package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

// BroadcastEvent carries the message payload and who sent it.
type BroadcastEvent struct {
	sender  *Client
	payload []byte
}

// Room represents a game table in memory.
type Room struct {
	ID      string
	HostID  string
	Players map[string]*Client
}

// Hub maintains the state of active rooms and clients.
type Hub struct {
	// Registered rooms: roomId -> Room
	rooms map[string]*Room

	// Inbound messages from the clients.
	broadcast chan BroadcastEvent

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	// Room deletion requests.
	deleteRoom chan string
}

func newHub() *Hub {
	return &Hub{
		broadcast:  make(chan BroadcastEvent),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		rooms:      make(map[string]*Room),
		deleteRoom: make(chan string),
	}
}

// generateRoomCode produces a random 6-character room code.
func generateRoomCode() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	rand.Seed(time.Now().UnixNano())
	code := make([]byte, 6)
	for i := range code {
		code[i] = chars[rand.Intn(len(chars))]
	}
	return string(code)
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.handleRegister(client)

		case client := <-h.unregister:
			h.handleUnregister(client)

		case event := <-h.broadcast:
			h.handleBroadcast(event)

		case roomId := <-h.deleteRoom:
			h.handleDeleteRoom(roomId)
		}
	}
}

func (h *Hub) handleRegister(client *Client) {
	roomId := client.roomId
	if roomId == "" {
		if client.isHost {
			// Generate a new unique room code that doesn't exist in DB
			for {
				roomId = generateRoomCode()
				_, err := GetRoomFromDB(roomId)
				if err != nil {
					// Error means it doesn't exist (mongo.ErrNoDocuments) or DB issue.
					// We'll proceed with this generated roomId.
					break
				}
			}
			client.roomId = roomId
		} else {
			sendErrorMessage(client, "Código da sala é obrigatório para entrar.")
			client.conn.Close()
			return
		}
	}

	// Try loading room from memory first, then fall back to MongoDB
	room, exists := h.rooms[roomId]
	var dbRoom *DBRoomState
	var err error

	if !exists {
		// Try to recover the room from MongoDB
		dbRoom, err = GetRoomFromDB(roomId)
		if err == nil && dbRoom != nil {
			// Restore memory room instance
			room = &Room{
				ID:      roomId,
				HostID:  dbRoom.HostID,
				Players: make(map[string]*Client),
			}
			h.rooms[roomId] = room
			exists = true
			log.Printf("[HUB] Sala %s recuperada com sucesso do MongoDB. Mestre: %s", roomId, dbRoom.HostID)
		}
	}

	if !exists {
		if client.isHost {
			// Create a brand new room document in MongoDB
			dbRoom = &DBRoomState{
				ID:        roomId,
				HostID:    client.playerId,
				CreatedAt: time.Now(),
				Players:   make(map[string]DBPlayerInfo),
			}
			dbRoom.Players[client.playerId] = DBPlayerInfo{
				Name: client.playerName,
			}
			if err := SaveRoomToDB(dbRoom); err != nil {
				log.Printf("[HUB] Falha ao registrar nova sala no MongoDB: %v", err)
			}

			// Initialize memory room instance
			room = &Room{
				ID:      roomId,
				HostID:  client.playerId,
				Players: make(map[string]*Client),
			}
			h.rooms[roomId] = room
			log.Printf("[HUB] Nova sala criada: %s pelo Mestre %s (%s)", roomId, client.playerName, client.playerId)
		} else {
			sendErrorMessage(client, "Sala não encontrada.")
			client.conn.Close()
			return
		}
	} else {
		// The room existed. If the client connecting claims to be host, update the host ID.
		if client.isHost {
			room.HostID = client.playerId
			if err := UpdateRoomSharedState(roomId, "hostId", client.playerId); err != nil {
				log.Printf("[HUB] Falha ao atualizar HostID no DB: %v", err)
			}
			log.Printf("[HUB] Mestre reassumiu a sala %s com o ID %s", roomId, client.playerId)
		}
	}

	// Enforce 6-player limit in memory
	if !client.isHost && len(room.Players) >= 6 && room.Players[client.playerId] == nil {
		sendErrorMessage(client, "Sala cheia (limite de 6 jogadores).")
		client.conn.Close()
		return
	}

	// Register player connection in memory
	room.Players[client.playerId] = client

	// Save or update player record in DB
	if err := UpdatePlayerStateInDB(roomId, client.playerId, client.playerName, nil); err != nil {
		log.Printf("[HUB] Falha ao salvar jogador no MongoDB: %v", err)
	}

	log.Printf("[HUB] Jogador %s (%s) conectou à sala %s", client.playerName, client.playerId, roomId)

	// Send updated room details to all players
	h.broadcastRoomUpdate(room)

	// Send current shared states (map, scene, music) from DB to this connecting player
	if dbRoom == nil {
		dbRoom, _ = GetRoomFromDB(roomId)
	}

	if dbRoom != nil {
		// Restore active map
		if dbRoom.CurrentMap != "" {
			mapMsg := WSMessage{
				Type:     "map",
				PlayerID: dbRoom.HostID,
				Data:     map[string]interface{}{"imageDataUrl": dbRoom.CurrentMap},
			}
			payload, _ := json.Marshal(mapMsg)
			client.send <- payload
		}
		// Restore active scene
		if dbRoom.CurrentScene != nil {
			sceneMsg := WSMessage{
				Type:     "scene",
				PlayerID: dbRoom.HostID,
				Data:     dbRoom.CurrentScene,
			}
			payload, _ := json.Marshal(sceneMsg)
			client.send <- payload
		}
		// Restore active music
		if dbRoom.CurrentMusic != nil {
			musicMsg := WSMessage{
				Type:     "music",
				PlayerID: dbRoom.HostID,
				Data:     dbRoom.CurrentMusic,
			}
			payload, _ := json.Marshal(musicMsg)
			client.send <- payload
		}
		// Restore extra fichas
		if dbRoom.ExtraFichas != nil {
			extraMsg := WSMessage{
				Type:     "extra_fichas",
				PlayerID: dbRoom.HostID,
				Data:     dbRoom.ExtraFichas,
			}
			payload, _ := json.Marshal(extraMsg)
			client.send <- payload
		}
	}

	// Feed last 50 logged messages (chats and rolls) to the connecting player
	history, err := GetMessagesFromDB(roomId, 50)
	if err == nil && len(history) > 0 {
		log.Printf("[HUB] Enviando %d mensagens de histórico para %s", len(history), client.playerId)
		for _, dbMsg := range history {
			historyMsg := WSMessage{
				Type:     dbMsg.Type,
				PlayerID: dbMsg.PlayerID,
				Data:     dbMsg.Data,
			}
			payload, _ := json.Marshal(historyMsg)
			client.send <- payload
		}
	}
}

func (h *Hub) handleUnregister(client *Client) {
	roomId := client.roomId
	room, exists := h.rooms[roomId]
	if !exists {
		return
	}

	if activeClient, ok := room.Players[client.playerId]; ok && activeClient == client {
		delete(room.Players, client.playerId)
		close(client.send)
		log.Printf("[HUB] Jogador %s (%s) desconectou da sala %s", client.playerName, client.playerId, roomId)

		// Remove player connection record from MongoDB room document
		if err := RemovePlayerFromDBRoom(roomId, client.playerId); err != nil {
			log.Printf("[HUB] Falha ao atualizar saída do jogador no DB: %v", err)
		}

		if len(room.Players) == 0 {
			// Room is empty, garbage collect from memory (database remains intact!)
			delete(h.rooms, roomId)
			log.Printf("[HUB] Sala %s descarregada da memória (inativa)", roomId)
		} else {
			h.broadcastRoomUpdate(room)
		}
	}
}

func (h *Hub) handleBroadcast(event BroadcastEvent) {
	roomId := event.sender.roomId
	room, exists := h.rooms[roomId]
	if !exists {
		return
	}

	var msg WSMessage
	err := json.Unmarshal(event.payload, &msg)
	if err != nil {
		log.Printf("[HUB] Erro ao decodificar pacote para broadcast: %v", err)
		return
	}

	// Persist based on message type
	switch msg.Type {
	case "chat", "roll":
		// Log chat history and rolls
		if err := SaveMessageToDB(roomId, msg.Type, event.sender.playerId, msg.Data); err != nil {
			log.Printf("[HUB] Falha ao registrar log de chat/rolagem no DB: %v", err)
		}

	case "state":
		// Persist character sheet state
		if err := UpdatePlayerStateInDB(roomId, event.sender.playerId, event.sender.playerName, msg.Data); err != nil {
			log.Printf("[HUB] Falha ao salvar ficha de personagem no DB: %v", err)
		}

	case "map":
		// Handle map image update and GCS upload
		if dataMap, ok := msg.Data.(map[string]interface{}); ok {
			if base64Str, ok := dataMap["imageDataUrl"].(string); ok && strings.HasPrefix(base64Str, "data:image/") {
				log.Println("[HUB] Nova imagem de mapa recebida. Iniciando upload para Cloud Storage...")
				
				var dbRoom *DBRoomState
				if roomDoc, err := GetRoomFromDB(roomId); err == nil {
					dbRoom = roomDoc
				}

				publicURL, err := UploadBase64Image(base64Str)
				if err == nil {
					// Replace the massive base64 payload with public link
					dataMap["imageDataUrl"] = publicURL
					msg.Data = dataMap

					// Update binary payload to broadcast public link instead of base64
					if updatedPayload, err := json.Marshal(msg); err == nil {
						event.payload = updatedPayload
					}

					// Enforce the 5-image GCS limit
					if dbRoom != nil {
						dbRoom.GCSImages = append(dbRoom.GCSImages, publicURL)
						for len(dbRoom.GCSImages) > 5 {
							oldestURL := dbRoom.GCSImages[0]
							log.Printf("[HUB] Excedeu o limite de 5 imagens. Excluindo a mais antiga do GCS: %s", oldestURL)
							_ = DeleteImageFromGCS(oldestURL)
							dbRoom.GCSImages = dbRoom.GCSImages[1:]
						}
						_ = UpdateRoomSharedState(roomId, "gcsImages", dbRoom.GCSImages)
					}
				} else {
					log.Printf("[HUB] Falha ao enviar para o Cloud Storage. Mantendo base64 inline: %v", err)
				}
			}

			// Update active map URL in DB room document
			if finalURL, ok := dataMap["imageDataUrl"].(string); ok {
				if err := UpdateRoomSharedState(roomId, "currentMap", finalURL); err != nil {
					log.Printf("[HUB] Falha ao salvar mapa ativo no DB: %v", err)
				}
			}
		}

	case "scene":
		// Save scene state to room doc
		if err := UpdateRoomSharedState(roomId, "currentScene", msg.Data); err != nil {
			log.Printf("[HUB] Falha ao salvar cena ativa no DB: %v", err)
		}

	case "music":
		// Save music state to room doc
		if err := UpdateRoomSharedState(roomId, "currentMusic", msg.Data); err != nil {
			log.Printf("[HUB] Falha ao salvar tocador no DB: %v", err)
		}

	case "extra_fichas":
		// Save extra sheets array to room doc
		if err := UpdateRoomSharedState(roomId, "extraFichas", msg.Data); err != nil {
			log.Printf("[HUB] Falha ao salvar extraFichas no DB: %v", err)
		}

	case "master_update_player_state":
		// Only allow the room master (HostID) to perform this update
		if roomId != "" && event.sender.playerId == room.HostID {
			if dataMap, ok := msg.Data.(map[string]interface{}); ok {
				targetPid, ok1 := dataMap["targetPlayerId"].(string)
				if ok1 {
					// Prepare character state sub-document for DB update
					charData := map[string]interface{}{
						"nome":     dataMap["nome"],
						"portrait": dataMap["portrait"],
						"saude":    dataMap["saude"],
						"det":      dataMap["det"],
						"ass":      dataMap["ass"],
					}
					// Update player's characterState inside the room document in MongoDB without modifying their name
					if err := UpdatePlayerCharacterStateInDB(roomId, targetPid, charData); err != nil {
						log.Printf("[HUB] Falha ao atualizar ficha do jogador %s via Mestre no DB: %v", targetPid, err)
					}
				}
			}
		}
	}

	// Relay message payload to all other players in the room
	for _, client := range room.Players {
		if client.playerId != event.sender.playerId {
			select {
			case client.send <- event.payload:
			default:
				close(client.send)
				delete(room.Players, client.playerId)
				go func(c *Client) {
					c.conn.Close()
				}(client)
			}
		}
	}
}

// broadcastRoomUpdate builds and sends a _room_update payload.
func (h *Hub) broadcastRoomUpdate(room *Room) {
	playersInfo := make(map[string]RoomPlayerInfo)
	for id, c := range room.Players {
		playersInfo[id] = RoomPlayerInfo{
			Name:     c.playerName,
			JoinedAt: time.Now().UnixNano() / int64(time.Millisecond),
		}
	}

	updateMsg := WSMessage{
		Type:     "_room_update",
		RoomID:   room.ID,
		Players:  playersInfo,
		HostID:   room.HostID,
		PlayerID: "server",
	}

	payload, err := json.Marshal(updateMsg)
	if err != nil {
		log.Printf("[HUB] Erro ao serializar room update: %v", err)
		return
	}

	for _, client := range room.Players {
		select {
		case client.send <- payload:
		default:
			close(client.send)
			delete(room.Players, client.playerId)
			go func(c *Client) {
				c.conn.Close()
			}(client)
		}
	}
}

// sendErrorMessage sends a simple system/error message to a single client.
func sendErrorMessage(client *Client, text string) {
	errMsg := WSMessage{
		Type: "error",
		Data: text,
	}
	payload, _ := json.Marshal(errMsg)
	_ = client.conn.WriteMessage(websocket.TextMessage, payload)
}

// handleDeleteRoom kicks all active clients in the room and deletes it from memory.
func (h *Hub) handleDeleteRoom(roomId string) {
	room, exists := h.rooms[roomId]
	if !exists {
		return
	}

	log.Printf("[HUB] Exclusão da sala %s solicitada. Desconectando %d jogadores...", roomId, len(room.Players))

	for _, client := range room.Players {
		sendErrorMessage(client, "Esta sala de jogo foi excluída permanentemente pelo Mestre.")
		// Close the socket connection
		go func(c *Client) {
			c.conn.Close()
		}(client)
	}

	delete(h.rooms, roomId)
	log.Printf("[HUB] Sala %s removida com sucesso da memória RAM.", roomId)
}
