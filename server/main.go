package main

import (
	"bufio"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"
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

	mux := http.NewServeMux()

	// WebSocket handler
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})

	// Delete room handler
	mux.HandleFunc("/delete-room", enableCORS(func(w http.ResponseWriter, r *http.Request) {
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

	// Healthcheck endpoint with DB & Storage status
	mux.HandleFunc("/health", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		dbStatus := "connected"
		if err := PingMongoDB(); err != nil {
			dbStatus = "error: " + err.Error()
		}

		storageStatus := "disabled"
		if IsStorageConfigured() {
			storageStatus = "active"
		}

		status := "ok"
		statusCode := http.StatusOK
		if dbStatus != "connected" {
			status = "degraded"
			statusCode = http.StatusServiceUnavailable
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"status":  status,
			"db":      dbStatus,
			"storage": storageStatus,
			"time":    time.Now().Format(time.RFC3339),
		})
	}))

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	// Run server in background goroutine
	go func() {
		log.Printf("[SERVER] Servidor rodando na porta %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[SERVER] Falha ao iniciar servidor: %v", err)
		}
	}()

	// Graceful shutdown on SIGINT / SIGTERM
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	log.Println("[SERVER] Sinal de interrupção recebido. Iniciando encerramento gracioso...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("[SERVER] Erro ao encerrar servidor HTTP: %v", err)
	}

	if err := DisconnectMongoDB(shutdownCtx); err != nil {
		log.Printf("[SERVER] Erro ao desconectar MongoDB: %v", err)
	}

	log.Println("[SERVER] Servidor finalizado com sucesso.")
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
