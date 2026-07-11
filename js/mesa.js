import { loadEnv } from "./config.js";
import { logger } from "./logger.js";

// Helper to determine default WebSocket URL based on how the page is loaded.
function getDefaultWsUrl() {
  const loc = window.location;
  if (loc.protocol === "file:") {
    return "ws://localhost:8080";
  }
  const protocol = loc.protocol === "https:" ? "wss:" : "ws:";
  // Use the same hostname where the frontend is loaded, but on port 8080
  return `${protocol}//${loc.hostname}:8080`;
}

export class PeerManager {
  constructor(onMessage) {
    this.roomId = null;
    this.playerId = "player_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    this.isHost = false;
    this.hostId = null;
    this.peers = new Map(); // Kept for interface compatibility (e.g. peerManager.peers.size)
    this.onMessage = onMessage;
    this.ws = null;
    this.onPeerConnected = null;
  }

  async _connect(action, roomId, playerName) {
    const env = await loadEnv();
    let serverUrl = env.WS_SERVER_URL;
    if (!serverUrl) {
      serverUrl = getDefaultWsUrl();
    }

    // Ensure proper WebSocket protocol scheme
    if (serverUrl.startsWith("http://")) {
      serverUrl = serverUrl.replace("http://", "ws://");
    } else if (serverUrl.startsWith("https://")) {
      serverUrl = serverUrl.replace("https://", "wss://");
    } else if (!serverUrl.startsWith("ws://") && !serverUrl.startsWith("wss://")) {
      serverUrl = "ws://" + serverUrl;
    }

    const url = `${serverUrl}/ws?action=${action}&roomId=${roomId || ""}&playerName=${encodeURIComponent(playerName)}&playerId=${this.playerId}`;
    logger.info(`Conectando ao servidor WebSocket: ${url}`);

    return new Promise((resolve, reject) => {
      let resolved = false;

      const doResolve = (val) => {
        if (!resolved) {
          resolved = true;
          resolve(val);
        }
      };

      const doReject = (err) => {
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      };

      try {
        const ws = new WebSocket(url);
        this.ws = ws;

        ws.onopen = () => {
          logger.info("WebSocket conectado com sucesso. Aguardando inicialização da sala...");
        };

        ws.onmessage = (e) => {
          try {
            const lines = e.data.split("\n");
            for (const line of lines) {
              if (!line.trim()) continue;
              const data = JSON.parse(line);
              
              if (data.type === "error") {
                doReject(new Error(data.data));
                ws.close();
                return;
              }

              if (data.type === "_room_update") {
                this.roomId = data.roomId || roomId || this.roomId;
                this.hostId = data.hostId;
                this.isHost = (this.playerId === data.hostId);

                // Update the peers map with dummy entries to maintain compatibility with peers.size checks
                this.peers.clear();
                if (data.players) {
                  Object.keys(data.players).forEach(pId => {
                    if (pId !== this.playerId) {
                      this.peers.set(pId, { connected: true, dc: { readyState: "open" } });
                    }
                  });
                }

                // Resolve the joinRoom / createRoom promise
                doResolve(this.roomId);

                // Notify the table UI about the room and players update
                if (this.onMessage) {
                  this.onMessage(data, "server");
                }

                // Call onPeerConnected to trigger initial sync of character sheet / maps / music
                if (this.onPeerConnected) {
                  this.onPeerConnected();
                }
              } else {
                // Message relay from other players
                if (this.onMessage) {
                  this.onMessage(data, data.playerId);
                }
              }
            }
          } catch (err) {
            logger.error("Erro ao processar mensagem do WebSocket:", err);
          }
        };

        ws.onerror = (err) => {
          logger.error("Erro no canal WebSocket:", err);
          doReject(new Error("Não foi possível conectar ao servidor da mesa de jogo."));
        };

        ws.onclose = (event) => {
          logger.info(`WebSocket fechado. Código: ${event.code}, Razão: ${event.reason}`);
          doReject(new Error("Conexão com a sala foi encerrada."));
        };

      } catch (e) {
        doReject(e);
      }
    });
  }

  async createRoom(playerName, existingRoomId) {
    return this._connect("create", existingRoomId, playerName);
  }

  async joinRoom(roomId, playerName) {
    return this._connect("join", roomId, playerName);
  }

  async leave() {
    if (this.ws) {
      // Temporarily remove onclose handler to avoid triggering connection error alerts during normal exit
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.peers.clear();
    this.roomId = null;
    this.isHost = false;
    this.hostId = null;
  }

  broadcast(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch (e) {
        logger.error("Erro ao enviar dados pelo WebSocket:", e);
      }
    } else {
      logger.warn("Conexão WebSocket indisponível para transmissão de dados.");
    }
  }
}

// REST request to delete room and its messages/files from database and storage
export async function deleteRoomFirestore(roomId) {
  logger.info(`Removendo sala gerenciada: ${roomId}`);
  try {
    const env = await loadEnv();
    let serverUrl = env.WS_SERVER_URL;
    if (!serverUrl) {
      serverUrl = getDefaultWsUrl();
    }

    // Resolve WS URL to HTTP/HTTPS for REST call
    let httpUrl = serverUrl;
    if (httpUrl.startsWith("ws://")) {
      httpUrl = httpUrl.replace("ws://", "http://");
    } else if (httpUrl.startsWith("wss://")) {
      httpUrl = httpUrl.replace("wss://", "https://");
    } else if (!httpUrl.startsWith("http://") && !httpUrl.startsWith("https://")) {
      httpUrl = "http://" + httpUrl;
    }

    const response = await fetch(`${httpUrl}/delete-room?roomId=${roomId}`, {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error(`Servidor retornou status ${response.status}`);
    }
    logger.info(`Sala ${roomId} excluída com sucesso do MongoDB e GCS.`);
  } catch (err) {
    logger.error(`Erro ao deletar sala ${roomId} do servidor:`, err);
    throw err;
  }
}
