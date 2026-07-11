package main

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	mongoClient *mongo.Client
	dbName      = "assimilacao_rpg"
	roomsColl   *mongo.Collection
	msgColl     *mongo.Collection
)

// DBPlayerInfo represents a player's stored state inside the room.
type DBPlayerInfo struct {
	Name           string      `bson:"name"`
	CharacterState interface{} `bson:"characterState,omitempty"`
}

// DBRoomState represents the room document structure in MongoDB.
type DBRoomState struct {
	ID           string                  `bson:"_id"`
	HostID       string                  `bson:"hostId"`
	CreatedAt    time.Time               `bson:"createdAt"`
	CurrentMap   string                  `bson:"currentMap,omitempty"`
	CurrentScene interface{}             `bson:"currentScene,omitempty"`
	CurrentMusic interface{}             `bson:"currentMusic,omitempty"`
	Players      map[string]DBPlayerInfo `bson:"players"`
	ExtraFichas  interface{}             `bson:"extraFichas,omitempty"`
}

// DBMessage represents a chat message or dice roll stored in MongoDB.
type DBMessage struct {
	RoomID    string      `bson:"roomId"`
	Type      string      `bson:"type"`
	PlayerID  string      `bson:"playerId"`
	Data      interface{} `bson:"data,omitempty"`
	Timestamp time.Time   `bson:"timestamp"`
}

// initMongoDB connects to MongoDB using the URI.
func initMongoDB(uri string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return err
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		return err
	}

	mongoClient = client
	roomsColl = client.Database(dbName).Collection("rooms")
	msgColl = client.Database(dbName).Collection("messages")

	log.Println("[DB] Conexão com o MongoDB Atlas estabelecida com sucesso.")
	return nil
}

// GetRoomFromDB loads a room by ID from the database.
func GetRoomFromDB(roomId string) (*DBRoomState, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var state DBRoomState
	err := roomsColl.FindOne(ctx, bson.M{"_id": roomId}).Decode(&state)
	if err != nil {
		return nil, err
	}
	return &state, nil
}

// SaveRoomToDB upserts the room state.
func SaveRoomToDB(state *DBRoomState) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	opts := options.Replace().SetUpsert(true)
	_, err := roomsColl.ReplaceOne(ctx, bson.M{"_id": state.ID}, state, opts)
	return err
}

// UpdateRoomSharedState updates a specific shared room field (e.g. currentMap).
func UpdateRoomSharedState(roomId string, field string, value interface{}) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{"$set": bson.M{field: value}}
	_, err := roomsColl.UpdateOne(ctx, bson.M{"_id": roomId}, update)
	return err
}

// UpdatePlayerStateInDB saves a player's character state inside the room document.
func UpdatePlayerStateInDB(roomId string, playerId string, name string, charState interface{}) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"players." + playerId + ".name":           name,
			"players." + playerId + ".characterState": charState,
		},
	}
	_, err := roomsColl.UpdateOne(ctx, bson.M{"_id": roomId}, update)
	return err
}

// UpdatePlayerCharacterStateInDB saves a player's character state inside the room document without modifying their name.
func UpdatePlayerCharacterStateInDB(roomId string, playerId string, charState interface{}) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{
		"$set": bson.M{
			"players." + playerId + ".characterState": charState,
		},
	}
	_, err := roomsColl.UpdateOne(ctx, bson.M{"_id": roomId}, update)
	return err
}

// RemovePlayerFromDBRoom removes a player's entry from the room document.
func RemovePlayerFromDBRoom(roomId string, playerId string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	update := bson.M{"$unset": bson.M{"players." + playerId: ""}}
	_, err := roomsColl.UpdateOne(ctx, bson.M{"_id": roomId}, update)
	return err
}

// SaveMessageToDB logs a chat message or roll to the messages collection.
func SaveMessageToDB(roomId string, msgType string, playerId string, data interface{}) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	dbMsg := DBMessage{
		RoomID:    roomId,
		Type:      msgType,
		PlayerID:  playerId,
		Data:      data,
		Timestamp: time.Now(),
	}

	_, err := msgColl.InsertOne(ctx, dbMsg)
	return err
}

// GetMessagesFromDB returns the last limit messages sorted chronologically.
func GetMessagesFromDB(roomId string, limit int64) ([]DBMessage, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	opts := options.Find().
		SetSort(bson.M{"timestamp": -1}).
		SetLimit(limit)

	cursor, err := msgColl.Find(ctx, bson.M{"roomId": roomId}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var msgs []DBMessage
	if err = cursor.All(ctx, &msgs); err != nil {
		return nil, err
	}

	// Reverse to chronological order
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}

	return msgs, nil
}

// scanAndCleanGCSUrls recursively scans BSON structures to find and delete matching GCS files.
func scanAndCleanGCSUrls(val interface{}) {
	switch v := val.(type) {
	case string:
		_ = DeleteImageFromGCS(v)
	case bson.M:
		for _, item := range v {
			scanAndCleanGCSUrls(item)
		}
	case map[string]interface{}:
		for _, item := range v {
			scanAndCleanGCSUrls(item)
		}
	case bson.A:
		for _, item := range v {
			scanAndCleanGCSUrls(item)
		}
	case []interface{}:
		for _, item := range v {
			scanAndCleanGCSUrls(item)
		}
	}
}

// DeleteRoomAndMessagesFromDB queries the room and logs, cleans GCS assets, and deletes DB documents.
func DeleteRoomAndMessagesFromDB(roomId string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// 1. Scan and clean GCS images associated with the Room
	var room DBRoomState
	err := roomsColl.FindOne(ctx, bson.M{"_id": roomId}).Decode(&room)
	if err == nil {
		if room.CurrentMap != "" {
			_ = DeleteImageFromGCS(room.CurrentMap)
		}
		if room.CurrentScene != nil {
			scanAndCleanGCSUrls(room.CurrentScene)
		}
		for _, player := range room.Players {
			if player.CharacterState != nil {
				scanAndCleanGCSUrls(player.CharacterState)
			}
		}
	}

	// 2. Scan and clean GCS images inside the message logs
	cursor, err := msgColl.Find(ctx, bson.M{"roomId": roomId})
	if err == nil {
		defer cursor.Close(ctx)
		var msgs []DBMessage
		if err = cursor.All(ctx, &msgs); err == nil {
			for _, msg := range msgs {
				if msg.Data != nil {
					scanAndCleanGCSUrls(msg.Data)
				}
			}
		}
	}

	// 3. Delete records from MongoDB collections
	_, err = roomsColl.DeleteOne(ctx, bson.M{"_id": roomId})
	if err != nil {
		log.Printf("[DB] Erro ao deletar sala %s do MongoDB: %v", roomId, err)
		return err
	}

	_, err = msgColl.DeleteMany(ctx, bson.M{"roomId": roomId})
	if err != nil {
		log.Printf("[DB] Erro ao limpar histórico de mensagens da sala %s: %v", roomId, err)
		return err
	}

	log.Printf("[DB] Sala %s e todo o histórico de jogo/logs apagados com sucesso.", roomId)
	return nil
}
