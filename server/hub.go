package main

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"
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
		broadcast:  make(chan BroadcastEvent, 256),
		register:   make(chan *Client, 64),
		unregister: make(chan *Client, 64),
		rooms:      make(map[string]*Room),
		deleteRoom: make(chan string, 16),
	}
}

// generateRoomCode produces a cryptographically secure random 6-character room code.
func generateRoomCode() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	bytes := make([]byte, 6)
	if _, err := rand.Read(bytes); err != nil {
		// Fallback in the rare event crypto/rand fails
		return fmt.Sprintf("%06X", time.Now().UnixNano()%0xFFFFFF)
	}
	for i := range bytes {
		bytes[i] = chars[int(bytes[i])%len(chars)]
	}
	return string(bytes)
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
			// Generate a unique room code that doesn't exist in DB
			for {
				roomId = generateRoomCode()
				_, err := GetRoomFromDB(roomId)
				if err != nil {
					// Error means it doesn't exist (mongo.ErrNoDocuments) or DB issue.
					break
				}
			}
			client.roomId = roomId
		} else {
			sendErrorMessage(client, "Código da sala é obrigatório para entrar.")
			client.safeClose()
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
			go func(doc *DBRoomState) {
				if err := SaveRoomToDB(doc); err != nil {
					log.Printf("[HUB] Falha ao registrar nova sala no MongoDB: %v", err)
				}
			}(dbRoom)

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
			client.safeClose()
			return
		}
	} else {
		// The room existed.
		if client.isHost {
			// Security check: if the room already has an active connected host (different from this client),
			// prevent hijacking the GM role!
			if currentHost, active := room.Players[room.HostID]; active && currentHost.playerId != client.playerId {
				log.Printf("[HUB] Tentativa de sobreposição de Mestre na sala %s por %s (%s). Mantendo Mestre ativo (%s).",
					roomId, client.playerName, client.playerId, room.HostID)
				client.isHost = false
			} else {
				room.HostID = client.playerId
				go func(rId, hId string) {
					if err := UpdateRoomSharedState(rId, "hostId", hId); err != nil {
						log.Printf("[HUB] Falha ao atualizar HostID no DB: %v", err)
					}
				}(roomId, client.playerId)
				log.Printf("[HUB] Mestre reassumiu a sala %s com o ID %s", roomId, client.playerId)
			}
		}
	}

	// Enforce 6-player limit in memory (excluding reconnecting players)
	if !client.isHost && len(room.Players) >= 6 && room.Players[client.playerId] == nil {
		sendErrorMessage(client, "Sala cheia (limite de 6 jogadores).")
		client.safeClose()
		return
	}

	// Register player connection in memory
	room.Players[client.playerId] = client

	// Save or update player record in DB asynchronously
	go func(rId, pId, pName string) {
		if err := UpdatePlayerStateInDB(rId, pId, pName, nil); err != nil {
			log.Printf("[HUB] Falha ao salvar jogador no MongoDB: %v", err)
		}
	}(roomId, client.playerId, client.playerName)

	log.Printf("[HUB] Jogador %s (%s) conectou à sala %s", client.playerName, client.playerId, roomId)

	// Send updated room details to all players
	h.broadcastRoomUpdate(room)

	// Send current shared states (map, scene, music) from DB to this connecting player
	if dbRoom == nil {
		go func(targetClient *Client, rId string) {
			rDoc, err := GetRoomFromDB(rId)
			if err != nil || rDoc == nil {
				return
			}
			h.sendInitialRoomState(targetClient, rDoc)
		}(client, roomId)
	} else {
		h.sendInitialRoomState(client, dbRoom)
	}
}

// sendInitialRoomState delivers cached maps, scene, music, extra sheets and recent history to a newly connected player.
func (h *Hub) sendInitialRoomState(client *Client, dbRoom *DBRoomState) {
	if dbRoom.CurrentMap != "" {
		mapMsg := WSMessage{
			Type:     "map",
			PlayerID: dbRoom.HostID,
			Data:     map[string]interface{}{"imageDataUrl": dbRoom.CurrentMap},
		}
		if payload, err := json.Marshal(mapMsg); err == nil {
			sendClientMessage(client, payload)
		}
	}

	if dbRoom.CurrentScene != nil {
		sceneMsg := WSMessage{
			Type:     "scene",
			PlayerID: dbRoom.HostID,
			Data:     dbRoom.CurrentScene,
		}
		if payload, err := json.Marshal(sceneMsg); err == nil {
			sendClientMessage(client, payload)
		}
	}

	if dbRoom.CurrentMusic != nil {
		musicMsg := WSMessage{
			Type:     "music",
			PlayerID: dbRoom.HostID,
			Data:     dbRoom.CurrentMusic,
		}
		if payload, err := json.Marshal(musicMsg); err == nil {
			sendClientMessage(client, payload)
		}
	}

	if dbRoom.ExtraFichas != nil {
		extraMsg := WSMessage{
			Type:     "extra_fichas",
			PlayerID: dbRoom.HostID,
			Data:     dbRoom.ExtraFichas,
		}
		if payload, err := json.Marshal(extraMsg); err == nil {
			sendClientMessage(client, payload)
		}
	}

	// Fetch message history asynchronously
	go func(targetClient *Client, rId string) {
		history, err := GetMessagesFromDB(rId, 50)
		if err == nil && len(history) > 0 {
			log.Printf("[HUB] Enviando %d mensagens de histórico para %s", len(history), targetClient.playerId)
			for _, dbMsg := range history {
				historyMsg := WSMessage{
					Type:     dbMsg.Type,
					PlayerID: dbMsg.PlayerID,
					Data:     dbMsg.Data,
				}
				if payload, err := json.Marshal(historyMsg); err == nil {
					sendClientMessage(targetClient, payload)
				}
			}
		}
	}(client, dbRoom.ID)
}

func (h *Hub) handleUnregister(client *Client) {
	roomId := client.roomId
	room, exists := h.rooms[roomId]
	if !exists {
		return
	}

	if activeClient, ok := room.Players[client.playerId]; ok && activeClient == client {
		delete(room.Players, client.playerId)
		client.safeClose()
		log.Printf("[HUB] Jogador %s (%s) desconectou da sala %s", client.playerName, client.playerId, roomId)

		// Remove player connection record from MongoDB room document asynchronously
		go func(rId, pId string) {
			if err := RemovePlayerFromDBRoom(rId, pId); err != nil {
				log.Printf("[HUB] Falha ao atualizar saída do jogador no DB: %v", err)
			}
		}(roomId, client.playerId)

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

	// 1. Process asynchronous persistence based on message type
	switch msg.Type {
	case "chat", "roll":
		go func(rId, mType, pId string, data interface{}) {
			if err := SaveMessageToDB(rId, mType, pId, data); err != nil {
				log.Printf("[HUB] Falha ao registrar log de chat/rolagem no DB: %v", err)
			}
		}(roomId, msg.Type, event.sender.playerId, msg.Data)

	case "state":
		go func(rId, pId, pName string, data interface{}) {
			if err := UpdatePlayerStateInDB(rId, pId, pName, data); err != nil {
				log.Printf("[HUB] Falha ao salvar ficha de personagem no DB: %v", err)
			}
		}(roomId, event.sender.playerId, event.sender.playerName, msg.Data)

	case "scene":
		go func(rId string, data interface{}) {
			if err := UpdateRoomSharedState(rId, "currentScene", data); err != nil {
				log.Printf("[HUB] Falha ao salvar cena ativa no DB: %v", err)
			}
		}(roomId, msg.Data)

	case "music":
		go func(rId string, data interface{}) {
			if err := UpdateRoomSharedState(rId, "currentMusic", data); err != nil {
				log.Printf("[HUB] Falha ao salvar tocador no DB: %v", err)
			}
		}(roomId, msg.Data)

	case "extra_fichas":
		go func(rId string, data interface{}) {
			if err := UpdateRoomSharedState(rId, "extraFichas", data); err != nil {
				log.Printf("[HUB] Falha ao salvar extraFichas no DB: %v", err)
			}
		}(roomId, msg.Data)

	case "master_update_player_state":
		if roomId != "" && event.sender.playerId == room.HostID {
			if dataMap, ok := msg.Data.(map[string]interface{}); ok {
				targetPid, ok1 := dataMap["targetPlayerId"].(string)
				if ok1 {
					charData := map[string]interface{}{
						"nome":     dataMap["nome"],
						"portrait": dataMap["portrait"],
						"saude":    dataMap["saude"],
						"det":      dataMap["det"],
						"ass":      dataMap["ass"],
					}
					go func(rId, tPid string, cData map[string]interface{}) {
						if err := UpdatePlayerCharacterStateInDB(rId, tPid, cData); err != nil {
							log.Printf("[HUB] Falha ao atualizar ficha do jogador %s via Mestre no DB: %v", tPid, err)
						}
					}(roomId, targetPid, charData)
				}
			}
		}

	case "map":
		if dataMap, ok := msg.Data.(map[string]interface{}); ok {
			base64Str, isB64 := dataMap["imageDataUrl"].(string)
			if isB64 && strings.HasPrefix(base64Str, "data:image/") && IsStorageConfigured() {
				// Upload asynchronously to GCS without blocking Hub
				go h.handleAsyncMapUpload(roomId, event.sender.playerId, base64Str)
			} else if finalURL, ok := dataMap["imageDataUrl"].(string); ok {
				go func(rId, url string) {
					if err := UpdateRoomSharedState(rId, "currentMap", url); err != nil {
						log.Printf("[HUB] Falha ao salvar mapa ativo no DB: %v", err)
					}
				}(roomId, finalURL)
			}
		}
	}

	// 2. Relay message payload immediately to all other players in the room
	for _, client := range room.Players {
		if client.playerId != event.sender.playerId {
			sendClientMessage(client, event.payload)
		}
	}
}

// handleAsyncMapUpload uploads a base64 map to Google Cloud Storage in the background,
// updates MongoDB, and broadcasts the public URL to all players in the room.
func (h *Hub) handleAsyncMapUpload(roomId string, senderPlayerId string, base64Str string) {
	log.Printf("[HUB] Iniciando upload de imagem de mapa no GCS para a sala %s...", roomId)
	publicURL, err := UploadBase64Image(base64Str)
	if err != nil {
		log.Printf("[HUB] Falha no upload para o Cloud Storage: %v", err)
		return
	}

	// Enforce 5-image retention limit in DB
	dbRoom, err := GetRoomFromDB(roomId)
	if err == nil && dbRoom != nil {
		dbRoom.GCSImages = append(dbRoom.GCSImages, publicURL)
		for len(dbRoom.GCSImages) > 5 {
			oldestURL := dbRoom.GCSImages[0]
			log.Printf("[HUB] Limite de 5 imagens excedido. Excluindo a mais antiga: %s", oldestURL)
			_ = DeleteImageFromGCS(oldestURL)
			dbRoom.GCSImages = dbRoom.GCSImages[1:]
		}
		_ = UpdateRoomSharedState(roomId, "gcsImages", dbRoom.GCSImages)
	}

	_ = UpdateRoomSharedState(roomId, "currentMap", publicURL)

	// Broadcast the public CDN URL to all room participants
	mapMsg := WSMessage{
		Type:     "map",
		PlayerID: senderPlayerId,
		Data:     map[string]interface{}{"imageDataUrl": publicURL},
	}
	if payload, err := json.Marshal(mapMsg); err == nil {
		h.broadcast <- BroadcastEvent{
			sender:  &Client{roomId: roomId, playerId: ""}, // Empty ID ensures all players receive the link
			payload: payload,
		}
	}
}

// broadcastRoomUpdate builds and sends a _room_update payload to all players in the room.
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
		sendClientMessage(client, payload)
	}
}

// sendClientMessage attempts a non-blocking send to client.send. If the channel is full,
// the client is deemed slow/stalled and disconnected safely.
func sendClientMessage(client *Client, payload []byte) {
	select {
	case client.send <- payload:
	default:
		log.Printf("[HUB] Canal de envio lotado para o jogador %s (%s). Desconectando.", client.playerName, client.playerId)
		client.safeClose()
	}
}

// sendErrorMessage formats and sends a system/error message safely to a single client.
func sendErrorMessage(client *Client, text string) {
	errMsg := WSMessage{
		Type: "error",
		Data: text,
	}
	payload, _ := json.Marshal(errMsg)
	sendClientMessage(client, payload)
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
		client.safeClose()
	}

	delete(h.rooms, roomId)
	log.Printf("[HUB] Sala %s removida com sucesso da memória RAM.", roomId)
}
