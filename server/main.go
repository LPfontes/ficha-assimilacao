package main

import (
	"bufio"
	"log"
	"net/http"
	"os"
	"strings"
)

// loadEnvFile reads environment variables from a .env file if it exists.
// Useful for local development without external dependencies.
func loadEnvFile() {
	paths := []string{"../.env", ".env"}
	for _, path := range paths {
		file, err := os.Open(path)
		if err != nil {
			continue
		}
		defer file.Close()

		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				val := strings.TrimSpace(parts[1])
				val = strings.Trim(val, `"'`) // strip quotes if any
				os.Setenv(key, val)
			}
		}
		log.Printf("[SERVER] Arquivo .env carregado com sucesso de %s", path)
		break
	}
}

func main() {
	loadEnvFile()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Fatal("[SERVER] Variável MONGO_URI não configurada no ambiente ou no arquivo .env.")
	}

	// Initialize database connection
	err := initMongoDB(mongoURI)
	if err != nil {
		log.Fatalf("[SERVER] Falha ao conectar no MongoDB: %v", err)
	}

	// Initialize Google Cloud Storage bucket connection
	initStorage()

	hub := newHub()
	go hub.run()

	// WebSocket handler
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})

	// Delete room handler
	http.HandleFunc("/delete-room", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Método não permitido. Utilize POST.", http.StatusMethodNotAllowed)
			return
		}

		roomId := r.URL.Query().Get("roomId")
		if roomId == "" {
			http.Error(w, "Parâmetro roomId é obrigatório.", http.StatusBadRequest)
			return
		}

		// 1. Delete records from MongoDB and delete files from GCS
		err := DeleteRoomAndMessagesFromDB(roomId)
		if err != nil {
			log.Printf("[SERVER] Falha ao excluir dados da sala %s: %v", roomId, err)
			http.Error(w, "Erro ao excluir dados da mesa.", http.StatusInternalServerError)
			return
		}

		// 2. Signal the hub to kick active connections and clear memory cache
		hub.deleteRoom <- roomId

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"success","message":"Sala e dados excluídos com sucesso"}`))
	}))

	// Basic healthcheck
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	log.Printf("[SERVER] Servidor rodando na porta %s", port)
	err = http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatalf("[SERVER] Falha ao iniciar servidor: %v", err)
	}
}

// enableCORS wraps a handler function providing standard CORS support.
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}
