import { createRoom, joinRoom, leaveRoom, listenRoom, saveSignal, deleteSignal, listenSignals, saveCandidate, listenCandidates, cleanupRoomSignals } from "./webrtc-signaling.js";
import { logger } from "./logger.js";

const RTC_CONFIG = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export class PeerManager {
  constructor(onMessage) {
    this.roomId = null;
    this.playerId = null;
    this.isHost = false;
    this.hostId = null;
    this.peers = new Map();
    this.onMessage = onMessage;
    this._signalUnsub = null;
    this._candidateUnsub = null;
    this._roomUnsub = null;
  }

  async createRoom(playerName, existingRoomId) {
    const { roomId, playerId } = await createRoom(playerName, existingRoomId);
    this.roomId = roomId;
    this.playerId = playerId;
    this.isHost = true;
    this.hostId = playerId;
    this._startListeners();
    return roomId;
  }

  async joinRoom(roomId, playerName) {
    const result = await joinRoom(roomId, playerName);
    this.roomId = result.roomId;
    this.playerId = result.playerId;
    this.isHost = false;
    this.hostId = result.hostId;
    this._startListeners();
    for (const pid of Object.keys(result.players)) {
      if (pid !== this.playerId) {
        await this._connectToPeer(pid);
      }
    }
  }

  async leave() {
    if (this._signalUnsub) this._signalUnsub();
    if (this._candidateUnsub) this._candidateUnsub();
    if (this._roomUnsub) this._roomUnsub();
    for (const [pid, peer] of this.peers) {
      if (peer.dc) peer.dc.close();
      peer.pc.close();
    }
    this.peers.clear();
    if (this.roomId) {
      await cleanupRoomSignals(this.roomId);
      await leaveRoom(this.roomId, this.playerId);
    }
  }

  broadcast(data) {
    console.log("[MESA] broadcast type=" + data.type + " peers=" + this.peers.size);
    for (const [pid, peer] of this.peers) {
      const state = peer.dc?.readyState || "no-dc";
      console.log("[MESA] broadcast peer=" + pid + " dcState=" + state);
      if (peer.dc.readyState === "open") {
        try {
          peer.dc.send(JSON.stringify(data));
          console.log("[MESA] broadcast SENT to " + pid);
        } catch (e) {
          logger.error("Erro ao enviar para " + pid, e);
        }
      }
    }
  }

  _startListeners() {
    this._roomUnsub = listenRoom(this.roomId, (roomData) => {
      if (this.onMessage) {
        this.onMessage({ type: "_room_update", players: roomData.players, hostId: roomData.hostId });
      }
    });
    this._signalUnsub = listenSignals(this.roomId, this.playerId, (signal) => {
      this._handleSignal(signal);
    });
    this._candidateUnsub = listenCandidates(this.roomId, this.playerId, (candidate, from) => {
      const peer = this.peers.get(from);
      if (peer && peer.pc) {
        peer.pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candidate))).catch(e => logger.error("ICE error", e));
      }
    });
  }

  async _connectToPeer(targetId) {
    if (this.peers.has(targetId)) return;
    const pc = new RTCPeerConnection(RTC_CONFIG);
    const dc = pc.createDataChannel("mesa", { ordered: true });
    const peer = { pc, dc, connected: false };

    dc.onopen = () => {
      peer.connected = true;
      logger.info("DataChannel aberto com " + targetId);
      console.log("[MESA] dc.onopen (initiator) target=" + targetId + " hasOnPeerConnected=" + !!this.onPeerConnected);
      if (this.onPeerConnected) this.onPeerConnected(targetId);
    };
    dc.onclose = () => logger.info("DataChannel fechado com " + targetId);
    dc.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (this.onMessage) this.onMessage(data, targetId);
      } catch (err) {
        logger.error("Erro ao parsear mensagem de " + targetId, err);
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        saveCandidate(this.roomId, this.playerId, targetId, JSON.stringify(e.candidate.toJSON()));
      }
    };
    pc.ondatachannel = (e) => {
      const remoteDc = e.channel;
      remoteDc.onopen = () => { peer.connected = true; logger.info("DataChannel remoto aberto com " + targetId); };
      remoteDc.onclose = () => logger.info("DataChannel remoto fechado com " + targetId);
      remoteDc.onmessage = dc.onmessage;
      peer.dc = remoteDc;
    };

    this.peers.set(targetId, peer);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await saveSignal(this.roomId, this.playerId, targetId, { type: "offer", sdp: { type: offer.type, sdp: offer.sdp } });
  }

  async _handleSignal(signal) {
    if (signal.type === "offer") {
      const targetId = signal.from;
      if (!this.peers.has(targetId)) {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        const peer = { pc, dc: null, connected: false };
        pc.onicecandidate = (e) => {
          if (e.candidate) {
            saveCandidate(this.roomId, this.playerId, targetId, JSON.stringify(e.candidate.toJSON()));
          }
        };
        pc.ondatachannel = (e) => {
          const remoteDc = e.channel;
          remoteDc.onopen = () => { peer.connected = true; logger.info("DataChannel remoto aberto com " + targetId); console.log("[MESA] remoteDc.onopen (receiver) target=" + targetId + " hasOnPeerConnected=" + !!this.onPeerConnected); if (this.onPeerConnected) this.onPeerConnected(targetId); };
          remoteDc.onclose = () => logger.info("DataChannel remoto fechado com " + targetId);
          remoteDc.onmessage = (msg) => {
            try {
              const data = JSON.parse(msg.data);
              if (this.onMessage) this.onMessage(data, targetId);
            } catch (err) { logger.error("Erro ao parsear mensagem", err); }
          };
          peer.dc = remoteDc;
        };
        this.peers.set(targetId, peer);

        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await saveSignal(this.roomId, this.playerId, targetId, { type: "answer", sdp: { type: answer.type, sdp: answer.sdp } });
      }
    } else if (signal.type === "answer") {
      const peer = this.peers.get(signal.from);
      if (peer && peer.pc.signalingState !== "stable") {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      }
    }
  }
}
