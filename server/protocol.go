package main

// WSMessage represents the generic JSON message exchanged via WebSockets.
type WSMessage struct {
	Type     string      `json:"type"`
	PlayerID string      `json:"playerId,omitempty"`
	RoomID   string      `json:"roomId,omitempty"`
	Data     interface{} `json:"data,omitempty"`
	// Additional fields for room updates
	Players  map[string]RoomPlayerInfo `json:"players,omitempty"`
	HostID   string                    `json:"hostId,omitempty"`
}

// RoomPlayerInfo contains basic details about a player in a room.
type RoomPlayerInfo struct {
	Name     string `json:"name"`
	JoinedAt int64  `json:"joinedAt"`
}
