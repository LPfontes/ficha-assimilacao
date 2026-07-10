import { PeerManager } from "./mesa.js";
import { deleteRoomFirestore } from "./webrtc-signaling.js";
import { state, saveCurrentCharacter, loadCharacter } from "./state.js";
import { esc } from "./screen-utils.js";
import { logger } from "./logger.js";
import { DICE_MAP, executeCustomRoll } from "./roller.js";
import { getDieSymbolsHtml, getDieFaceImgSrc } from "./chat.js";
import { ICONS } from "../icons.js";
import { getCurrentHealthLevel } from "./health.js";
import { worldState, saveConflito } from "./world-state.js";
import { handleIncomingMusicAction, updatePlayerControlsUI, broadcastMusicState } from "./player.js";
import {
  criarCampanha,
  entrarCampanha,
  compartilharFicha,
  removerFichaCompartilhada,
  adicionarNota,
  removerNota,
  adicionarEvento,
  removerEvento,
  alterarStatusEvento,
  adicionarHistoria,
  removerHistoria,
  atualizarSessaoAtiva,
  escutarCampanha
} from "./campanha.js";

let activeCampanha = null;
let _campanhaUnsub = null;


const tableScreen = document.getElementById("table-screen");
const roomModal = document.getElementById("room-modal");
const playerListEl = document.getElementById("table-player-list");
const rollFeedEl = document.getElementById("table-roll-feed");
const mapImg = document.getElementById("table-map-image");
const mapPlaceholder = document.getElementById("table-map-placeholder");

let peerManager = null;
let roomCode = "";
let broadcastInterval = null;
let previousScreen = null;   // tela que estava ativa antes de ir para a mesa
let pendingRolls = 0;        // rolagens recebidas fora da mesa
let isOnTableScreen = false;
let _playerStateCache = {};  // playerId → data (para reaplicar após updatePlayerList)
let _currentMapDataUrl = null; // última imagem de mapa enviada
let _zoomLevel = 1, _panX = 0, _panY = 0;
let _hiddenFichaIds = new Set();
let _lastPlayersList = [];

// ── Gerenciamento local de salas criadas ─────────────────────────────────────
const MANAGED_ROOMS_KEY = "assimilação_managed_rooms";
let _managedRooms = [];

function _loadManagedRooms() {
  try {
    const raw = localStorage.getItem(MANAGED_ROOMS_KEY);
    _managedRooms = raw ? JSON.parse(raw) : [];
  } catch (e) {
    _managedRooms = [];
  }
}

function _saveManagedRooms() {
  try {
    localStorage.setItem(MANAGED_ROOMS_KEY, JSON.stringify(_managedRooms));
  } catch (e) {
    logger.error("[Mesa] Erro ao salvar salas gerenciadas:", e);
  }
}

function _renderManagedRooms() {
  const list = document.getElementById("managed-rooms-list");
  if (!list) return;
  if (_managedRooms.length === 0) {
    list.innerHTML = `<div class="managed-rooms-empty">Nenhuma sala criada neste dispositivo.</div>`;
    return;
  }
  list.innerHTML = _managedRooms.map((r, idx) => {
    const date = new Date(r.createdAt).toLocaleString();
    return `<div class="managed-room-item" data-index="${idx}">
      <div class="managed-room-info">
        <span class="managed-room-code">${esc(r.code)}</span>
        <span class="managed-room-host">${esc(r.hostName)}</span>
        <span class="managed-room-date">${esc(date)}</span>
      </div>
      <div class="managed-room-actions">
        <button type="button" class="btn btn-sm btn-managed-join" data-code="${esc(r.code)}">Entrar</button>
        <button type="button" class="btn btn-sm btn-managed-master" data-code="${esc(r.code)}" data-host="${esc(r.hostName)}" title="Entrar como mestre">👑 Mestre</button>
        <button type="button" class="btn btn-sm btn-managed-delete" data-index="${idx}" style="border-color:var(--color-rust);color:var(--color-rust-glow);">✕</button>
      </div>
    </div>`;
  }).join("");
}

function _addManagedRoom(code, hostName) {
  _managedRooms.push({ code, hostName, createdAt: Date.now() });
  _saveManagedRooms();
  _renderManagedRooms();
}

async function _deleteManagedRoom(index) {
  const room = _managedRooms[index];
  if (!room) return;
  try {
    await deleteRoomFirestore(room.code);
  } catch (e) {
    logger.error("[Mesa] Erro ao excluir sala do Firestore:", e);
  }
  _managedRooms.splice(index, 1);
  _saveManagedRooms();
  _renderManagedRooms();
}

async function _enterAsMaster(code, hostName) {
  const playerName = prompt("Seu nome na mesa:", hostName || "Mestre");
  if (!playerName) return;
  try {
    const pm = new PeerManager(handleMessage);
    pm.onPeerConnected = () => {
      broadcastCharacterState();
      if (_currentMapDataUrl) peerManager?.broadcast({ type: "map", playerId: pm.playerId, data: { imageDataUrl: _currentMapDataUrl } });
      if (pm.isHost) {
        broadcastMusicState();
        broadcastFichasVisibility();
      }
    };
    peerManager = pm;
    roomCode = await pm.createRoom(playerName, code);
    updatePlayerControlsUI();
    document.body.classList.toggle("is-mesa-host", pm.isHost || false);
    document.getElementById("table-room-code-badge").textContent = "Sala: " + roomCode;
    showTableScreen();
    updatePlayerList([]);
    _updateLocalPlayerState();
    _applyCachedStates();
    closeRoomModal();
    logger.info("Sala recriada como mestre: " + roomCode);
    const idx = _managedRooms.findIndex(r => r.code === code);
    if (idx !== -1) {
      _managedRooms[idx].hostName = playerName;
      _managedRooms[idx].createdAt = Date.now();
      _saveManagedRooms();
    }
  } catch (e) {
    alert("Erro ao entrar como mestre: " + e.message);
  }
}

export function getPeerManager() {
  return peerManager;
}

function _populateCharSelectors() {
  const chars = state.characters || [];
  const selects = [document.getElementById("room-char-select"), document.getElementById("room-char-select-join")];
  selects.forEach(sel => {
    if (!sel) return;
    const prevVal = sel.value;
    const isCreate = sel.id === "room-char-select";
    sel.innerHTML = isCreate ? '<option value="">-- Nenhuma (apenas Mestre) --</option>' : '<option value="">-- Selecione uma ficha (obrigatório) --</option>';
    chars.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      sel.appendChild(opt);
    });
    if (prevVal && chars.some(c => c.id === prevVal)) sel.value = prevVal;
  });
}

function _onCharSelect(selId, nameInputId) {
  const sel = document.getElementById(selId);
  const nameInput = document.getElementById(nameInputId);
  if (!sel || !nameInput) return;
  const char = state.characters?.find(c => c.id === sel.value);
  if (char) {
    nameInput.value = char.name;
  }
}

export function openRoomModal() {
  _populateCharSelectors();
  _loadManagedRooms();
  _renderManagedRooms();
  if (roomModal) roomModal.classList.remove("hidden");
}

function closeRoomModal() {
  if (roomModal) roomModal.classList.add("hidden");
  // Reset character selects
  ["room-char-select", "room-char-select-join"].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.value = "";
  });
}

export function initMesaUI() {
  _createFloatingButton();
  _hoistDiceDrawer();

  document.getElementById("btn-mesa-landing")?.addEventListener("click", openRoomModal);
  document.getElementById("btn-close-room-modal")?.addEventListener("click", closeRoomModal);
  document.getElementById("btn-cancel-room")?.addEventListener("click", closeRoomModal);
  roomModal?.addEventListener("click", (e) => {
    if (e.target === roomModal) closeRoomModal();
  });

  // Delegação de eventos para botões de salas gerenciadas
  document.getElementById("managed-rooms-list")?.addEventListener("click", (e) => {
    const joinBtn = e.target.closest(".btn-managed-join");
    const masterBtn = e.target.closest(".btn-managed-master");
    const delBtn = e.target.closest(".btn-managed-delete");
    if (joinBtn) {
      const code = joinBtn.dataset.code;
      if (code) {
        document.getElementById("room-code-input").value = code;
        document.querySelector('.room-tab[data-room-tab="entrar"]')?.click();
      }
    }
    if (masterBtn) {
      const code = masterBtn.dataset.code;
      const hostName = masterBtn.dataset.host;
      if (code) _enterAsMaster(code, hostName);
    }
    if (delBtn) {
      const idx = parseInt(delBtn.dataset.index);
      if (!isNaN(idx)) _deleteManagedRoom(idx).catch(e => logger.error("[Mesa] Erro ao excluir sala:", e));
    }
  });

  document.getElementById("room-char-select")?.addEventListener("change", () => _onCharSelect("room-char-select", "room-player-name"));
  document.getElementById("room-char-select-join")?.addEventListener("change", () => _onCharSelect("room-char-select-join", "room-player-name-join"));

  document.getElementById("btn-create-room")?.addEventListener("click", async () => {
    _loadManagedRooms();
    if (_managedRooms.length >= 5) {
      alert("Você já atingiu o limite máximo de 5 salas criadas.\n\nGerencie as salas existentes na aba \"Minhas Salas\" antes de criar uma nova.");
      return;
    }
    const charSelect = document.getElementById("room-char-select");
    const charId = charSelect?.value;
    if (charId) {
      loadCharacter(charId);
      saveCurrentCharacter();
    }
    const nameInput = document.getElementById("room-player-name");
    const playerName = nameInput.value.trim() || "Jogador";
    try {
      const pm = new PeerManager(handleMessage);
      pm.onPeerConnected = () => {
        broadcastCharacterState();
        if (_currentMapDataUrl) peerManager?.broadcast({ type: "map", playerId: pm.playerId, data: { imageDataUrl: _currentMapDataUrl } });
        if (pm.isHost) {
          broadcastMusicState();
          broadcastFichasVisibility();
        }
      };
      peerManager = pm;
      roomCode = await pm.createRoom(playerName);
      updatePlayerControlsUI();
      document.body.classList.toggle("is-mesa-host", pm.isHost || false);
      _addManagedRoom(roomCode, playerName);
      document.getElementById("room-code-display").textContent = roomCode;
      document.getElementById("table-room-code-badge").textContent = "Sala: " + roomCode;
      document.getElementById("room-step-create").classList.add("hidden");
      document.getElementById("room-step-waiting").classList.remove("hidden");
      showTableScreen();
      updatePlayerList([]);
      _updateLocalPlayerState();
      _applyCachedStates();
      logger.info("Sala criada: " + roomCode);
    } catch (e) {
      if (e.message?.includes("permission") || e.code === "permission-denied") {
        alert("Erro de permissão do Firebase Firestore.\n\nVocê precisa atualizar as regras de segurança do Firestore no console do Firebase para:\n\nmatch /rooms/{roomId} {\n  allow read, write: if request.auth != null;\n}\nmatch /rooms/{roomId}/{document=**} {\n  allow read, write: if request.auth != null;\n}");
      } else {
        alert("Erro ao criar sala: " + e.message);
      }
    }
  });

  document.getElementById("btn-join-room")?.addEventListener("click", async () => {
    const charSelect = document.getElementById("room-char-select-join");
    const charId = charSelect?.value;
    if (!charId) { alert("Selecione uma ficha de personagem!"); return; }
    loadCharacter(charId);
    saveCurrentCharacter();
    const codeInput = document.getElementById("room-code-input");
    const nameInput = document.getElementById("room-player-name-join");
    const code = codeInput.value.trim().toUpperCase();
    const playerName = nameInput.value.trim() || "Jogador";
    if (!code) { alert("Digite o código da sala!"); return; }
    try {
      const pm = new PeerManager(handleMessage);
      pm.onPeerConnected = () => {
        broadcastCharacterState();
        if (_currentMapDataUrl) peerManager?.broadcast({ type: "map", playerId: pm.playerId, data: { imageDataUrl: _currentMapDataUrl } });
        if (pm.isHost) {
          broadcastMusicState();
          broadcastFichasVisibility();
        }
      };
      peerManager = pm;
      roomCode = code;
      await pm.joinRoom(code, playerName);
      updatePlayerControlsUI();
      document.body.classList.toggle("is-mesa-host", pm.isHost || false);
      document.getElementById("room-step-create").classList.add("hidden");
      document.getElementById("room-step-waiting").classList.remove("hidden");
      document.getElementById("room-code-display").textContent = code;
      document.getElementById("table-room-code-badge").textContent = "Sala: " + code;
      showTableScreen();
      _updateLocalPlayerState();
      logger.info("Entrou na sala: " + code);
    } catch (e) {
      if (e.message?.includes("permission") || e.code === "permission-denied") {
        alert("Erro de permissão do Firebase Firestore.\n\nAtualize as regras de segurança do Firestore no console do Firebase para:\n\nmatch /rooms/{roomId} {\n  allow read, write: if request.auth != null;\n}\nmatch /rooms/{roomId}/{document=**} {\n  allow read, write: if request.auth != null;\n}");
      } else {
        alert("Erro ao entrar na sala: " + e.message);
      }
    }
  });

  document.getElementById("btn-leave-table")?.addEventListener("click", async () => {
    // "Sair" desconecta de verdade
    if (broadcastInterval) { clearInterval(broadcastInterval); broadcastInterval = null; }
    if (peerManager) {
      await peerManager.leave();
      peerManager = null;
      updatePlayerControlsUI();
      document.body.classList.remove("is-mesa-host");
      _hiddenFichaIds.clear();
      _lastPlayersList = [];
    }
    roomCode = "";
    _playerStateCache = {};
    _currentMapDataUrl = null;
    _isSceneMode = false;
    _currentSceneId = null;
    const cenaDisplay = document.getElementById("table-cena-display");
    if (cenaDisplay) { cenaDisplay.classList.add("hidden"); cenaDisplay.style.opacity = ""; cenaDisplay.style.transition = ""; }
    document.getElementById("table-cena-controls")?.classList.add("hidden");
    previousScreen = null;
    isOnTableScreen = false;
    delete document.body.dataset.mesaVisited;
    resetMapDisplay();
    _updateFloatingButton();
    hideTableScreen();
    closeRoomModal();
    if (activeCampanha) {
      showCampaignScreen(activeCampanha);
    } else {
      document.getElementById("landing-screen")?.classList.remove("hidden");
    }
  });

  document.getElementById("btn-table-map-upload")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !peerManager?.isHost) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      setMapImage(dataUrl);
      // Redimensiona antes de broadcast para evitar limite de tamanho do DataChannel
      _compressImage(dataUrl, 1200, 0.6, (compressed) => {
        peerManager.broadcast({ type: "map", playerId: peerManager.playerId, data: { imageDataUrl: compressed || dataUrl } });
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });

  // Zoom do mapa
  let _isPanning = false, _panStartX, _panStartY;
  const mapImgZoom = document.getElementById("table-map-image");

  function _applyZoom() {
    if (!mapImgZoom) return;
    const pct = Math.round(_zoomLevel * 100);
    mapImgZoom.style.transform = `translate(${_panX}px, ${_panY}px) scale(${_zoomLevel})`;
    const display = document.getElementById("zoom-level-display");
    if (display) display.textContent = pct + "%";
    mapImgZoom.classList.toggle("zoomable", _zoomLevel > 1);
  }

  document.getElementById("btn-zoom-in")?.addEventListener("click", () => {
    _zoomLevel = Math.min(5, _zoomLevel + 0.25);
    _applyZoom();
  });
  document.getElementById("btn-zoom-out")?.addEventListener("click", () => {
    _zoomLevel = Math.max(0.25, _zoomLevel - 0.25);
    _applyZoom();
  });
  document.getElementById("btn-zoom-reset")?.addEventListener("click", () => {
    _zoomLevel = 1; _panX = 0; _panY = 0;
    _applyZoom();
  });

  // Pan via mouse drag (quando zoom > 1)
  mapImgZoom?.addEventListener("mousedown", (e) => {
    if (_zoomLevel <= 1) return;
    _isPanning = true;
    _panStartX = e.clientX - _panX;
    _panStartY = e.clientY - _panY;
    e.preventDefault();
  });
  document.addEventListener("mousemove", (e) => {
    if (!_isPanning) return;
    _panX = e.clientX - _panStartX;
    _panY = e.clientY - _panStartY;
    _applyZoom();
  });
  document.addEventListener("mouseup", () => { _isPanning = false; });

  // Scroll do mouse faz zoom (quando sobre o mapa)
  mapImgZoom?.addEventListener("wheel", (e) => {
    if (!mapImgZoom.style.display || mapImgZoom.style.display === "none") return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    _zoomLevel = Math.max(0.25, Math.min(5, _zoomLevel + delta));
    _applyZoom();
  }, { passive: false });

  // Botão de rolagem na mesa → abre o dice-drawer global
  document.getElementById("btn-open-roller-table")?.addEventListener("click", () => {
    const drawer = document.getElementById("dice-drawer");
    if (drawer) drawer.classList.remove("hidden");
  });

  // Sincroniza mesa quando a ficha gasta Determinação/Assimilação
  document.addEventListener("cabo-guerra-refresh", () => {
    if (isOnTableScreen) { _updateLocalPlayerState(); broadcastCharacterState(); }
  });

  // Sincroniza mesa quando a ficha é salva (qualquer alteração na sheet)
  window.addEventListener("character-saved", () => {
    if (!state.currentCharacter) return;
    if (document.getElementById("det-" + peerManager?.playerId)) _updateLocalPlayerState();
    if (peerManager) broadcastCharacterState();
  });

  // Limpar feed de rolagens
  document.getElementById("btn-clear-roll-feed")?.addEventListener("click", () => {
    if (rollFeedEl) {
      rollFeedEl.innerHTML = "";
      _totalRollCount = 0;
      const countEl = document.getElementById("table-roll-count");
      if (countEl) countEl.textContent = "0";
    }
  });

  _initChatPanel();
  _initFichasPicker();
  _initConflitoPicker();
  _initCenasPanel();
  _initFichasVisibility();
}

function handleMessage(data, fromId) {
  if (!data) return;
  console.log("[MESA] handleMessage type=" + data.type + " from=" + fromId, data.type === "state" ? data.data : "");
  switch (data.type) {
    case "state":
      updatePlayerState(data.playerId, data.data);
      break;
    case "roll":
      addRollToFeed(data);
      if (!isOnTableScreen) {
        pendingRolls++;
        _updateFloatingButton();
      }
      break;
    case "chat":
      _receiveChatMessage(data);
      break;
    case "map":
      if (data.data?.imageDataUrl) {
        setMapImage(data.data.imageDataUrl);
      }
      break;
    case "scene":
      if (data.data) {
        const { sceneId, src, name } = data.data;
        if (sceneId && src) {
          if (!_scenes.find(s => s.id === sceneId)) {
            _scenes.push({ id: sceneId, name: name || "Cena", src, isPredefined: false });
          }
          _switchScene(sceneId);
        } else if (sceneId === null) {
          _setSceneMode(false);
          _currentSceneId = null;
        }
      }
      break;
    case "music":
      if (data.data) {
        handleIncomingMusicAction(data.data);
      }
      break;
    case "_room_update":
      if (data.players) {
        const list = Object.entries(data.players).map(([id, p]) => ({ id, name: p.name }));
        const knownIds = new Set(Object.keys(_playerStateCache));
        knownIds.add(peerManager?.playerId);
        const hasNewPlayer = list.some(p => !knownIds.has(p.id));
        const filteredList = list.filter(p => p.id !== data.hostId);
        _lastPlayersList = filteredList;
        console.log("[MESA] _room_update players=" + list.map(p=>p.id).join(",") + " hasNew=" + hasNewPlayer + " cache=" + Object.keys(_playerStateCache).join(","));
        updatePlayerList(filteredList);
        _applyFichasVisibility();
        _updateLocalPlayerState();
        _applyCachedStates();
        if (hasNewPlayer && peerManager) { console.log("[MESA] _room_update -> broadcastCharacterState"); broadcastCharacterState(); }
        if (data.hostId) {
          const hostBadge = document.getElementById("table-host-badge");
          if (hostBadge) hostBadge.textContent = data.hostId === peerManager?.playerId ? "Você é o Mestre" : "Mestre: " + (list.find(p => p.id === data.hostId)?.name || "");
        }
      }
      break;
  }
}

function _getHealthMaxPts(char) {
  const basePts = 1 + (char.instintos?.Potência || 0) + (char.instintos?.Resolução || 0);
  return Math.max(1, basePts + (char.saudeMod || 0));
}

export function broadcastCharacterState() {
  if (!peerManager || !state.currentCharacter) { console.log("[MESA] broadcastCharacterState SKIP", { pm: !!peerManager, char: !!state.currentCharacter }); return; }
  const char = state.currentCharacter;
  console.log("[MESA] broadcastCharacterState", char.name, char.detPoints, char.detNivel, char.dano);
  peerManager.broadcast({
    type: "state",
    playerId: peerManager.playerId,
    data: {
      nome: char.name,
      portrait: char.portrait || "",
      saude: {
        atual: Object.values(char.dano || {}).reduce((a, b) => a + b, 0),
        max: Object.keys(char.dano || {}).length * _getHealthMaxPts(char),
        dano: { ...(char.dano || { 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }) },
        maxPts: _getHealthMaxPts(char)
      },
      det: { atual: char.detPoints || 0, max: char.detNivel || 1 },
      ass: { atual: char.assPoints || 0, max: char.assNivel || 0 }
    }
  });
}

export function broadcastRoll(rollData) {
  if (!peerManager) return;
  peerManager.broadcast({ type: "roll", playerId: peerManager.playerId, data: rollData });
}

function _getActiveLevel(dano, maxPts) {
  for (let lvl = 6; lvl >= 1; lvl--) {
    if ((dano[lvl] || 0) < maxPts) return lvl;
  }
  return 1;
}

function _renderHealthLevelsHTML(saude) {
  if (!saude || !saude.dano) return '<span class="stat-saude">Vida: --/--</span>';
  const dano = saude.dano;
  if (dano[6] === undefined) { dano[6] = 0; dano[5] = 0; dano[4] = 0; dano[3] = 0; dano[2] = 0; dano[1] = 0; }
  const maxPts = saude.maxPts || 2;
  const activeLvl = _getActiveLevel(dano, maxPts);
  const lvlNames = {
    6: "Saudável", 5: "Escoriação", 4: "Laceração",
    3: "Ferimentos", 2: "Debilitação", 1: "Incapacitação"
  };
  const totalMax = 6 * maxPts;
  let totalCurrent = 0;
  for (let lvl = 1; lvl <= 6; lvl++) totalCurrent += maxPts - (dano[lvl] || 0);
  const activeDano = dano[activeLvl] || 0;
  let dropsHtml = "";
  for (let i = 1; i <= maxPts; i++) {
    const isFilled = i <= (maxPts - activeDano);
    dropsHtml += `<span class="health-drop ${isFilled ? 'filled' : ''}" data-index="${i}" data-level="${activeLvl}">${ICONS.saude}</span>`;
  }
  return `
    <div class="health-levels-container" style="margin-top:4px;">
      <div class="health-level-row active" data-level="${activeLvl}">
        <div class="health-level-label">
          <span class="name">${activeLvl}. ${lvlNames[activeLvl]}</span>
          <div style="display:flex; gap:3px;">
            <button type="button" class="btn-health-mesa-dec" data-player="local">−</button>
            <button type="button" class="btn-health-mesa-inc" data-player="local">+</button>
          </div>
        </div>
        <div class="health-drops" style="display:flex; align-items:center; gap:6px;">
          ${dropsHtml}
        </div>
      </div>
      <div class="health-total-label"><span>Vida Total: <strong>${totalCurrent}</strong> / <strong>${totalMax}</strong></span></div>
    </div>`;
}

function updatePlayerList(players) {
  if (!playerListEl) return;

  playerListEl.innerHTML = players.map(p => {
    const isMe = p.id === peerManager?.playerId && !!state.currentCharacter;
    const isHidden = _hiddenFichaIds.has(p.id);
    return `<div class="table-player-item ${isMe ? 'is-me' : ''} ${isHidden ? 'hidden-ficha' : ''}" data-player-id="${p.id}">
      <div class="table-player-portrait" id="portrait-${p.id}"></div>
      <div class="table-player-stats">
        <span class="table-player-name">${esc(p.name)} ${isMe ? '(Você)' : ''}</span>
        <div class="stat-det" id="det-${p.id}">Det: --/--</div>
        <div class="stat-ass" id="ass-${p.id}">Ass: --/--</div>
        <div class="stat-saude" id="saude-${p.id}">Vida: --/--</div>
      </div>
    </div>`;
  }).join("");

  _renderExtraFichas();
}

function _handleHealthDropClick(e) {
  const drop = e.currentTarget;
  const lvlKey = parseInt(drop.dataset.level);
  const index = parseInt(drop.dataset.index);
  const char = state.currentCharacter;
  if (!char) return;
  const maxPts = _getHealthMaxPts(char);
  if (!char.dano) char.dano = { 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const currentDano = char.dano[lvlKey] || 0;
  const currentHealth = maxPts - currentDano;
  const newHealth = currentHealth === index ? index - 1 : index;
  const newDano = maxPts - newHealth;
  char.dano[lvlKey] = newDano;
  if (newDano === maxPts && lvlKey > 1) {
    char.dano[lvlKey - 1] = 0;
  }
  saveCurrentCharacter();
  _updateLocalPlayerState();
  broadcastCharacterState();
}

function _updateLocalPlayerState() {
  if (!peerManager || !state.currentCharacter) { console.log("[MESA] _updateLocalPlayerState SKIP pm=" + !!peerManager + " char=" + !!state.currentCharacter); return; }
  const char = state.currentCharacter;
  const playerId = peerManager.playerId;
  console.log("[MESA] _updateLocalPlayerState id=" + playerId + " det=" + (char.detPoints || 0) + "/" + (char.detNivel || 1));
  const detEl = document.getElementById("det-" + playerId);
  const saudeEl = document.getElementById("saude-" + playerId);
  const assEl = document.getElementById("ass-" + playerId);
  const portraitEl = document.getElementById("portrait-" + playerId);
  console.log("[MESA] _updateLocalPlayerState found detEl=" + !!detEl + " saudeEl=" + !!saudeEl);
  const maxPts = _getHealthMaxPts(char);
  if (detEl) {
    detEl.innerHTML = `<button type="button" class="btn-det-dec" data-player="${playerId}">−</button><span class="det-value">Determinação: ${char.detPoints || 0}/${char.detNivel || 1}</span><button type="button" class="btn-det-inc" data-player="${playerId}">+</button>`;
    const decBtn = detEl.querySelector(".btn-det-dec");
    const incBtn = detEl.querySelector(".btn-det-inc");
    if (decBtn) decBtn.addEventListener("click", () => { if (char.detPoints > 0) { char.detPoints--; saveCurrentCharacter(); _updateLocalPlayerState(); broadcastCharacterState(); } });
    if (incBtn) incBtn.addEventListener("click", () => { if (char.detPoints < (char.detNivel || 1)) { char.detPoints++; saveCurrentCharacter(); _updateLocalPlayerState(); broadcastCharacterState(); } });
  }
  if (saudeEl) {
    saudeEl.innerHTML = _renderHealthLevelsHTML({ dano: char.dano, maxPts });
    saudeEl.querySelectorAll(".health-drop").forEach(drop => {
      drop.addEventListener("click", _handleHealthDropClick);
    });
    const decHealth = saudeEl.querySelector(".btn-health-mesa-dec");
    const incHealth = saudeEl.querySelector(".btn-health-mesa-inc");
    if (decHealth) decHealth.addEventListener("click", () => {
      const maxPts2 = _getHealthMaxPts(char);
      const activeLvl2 = _getActiveLevel(char.dano || {}, maxPts2);
      const currentDano = (char.dano?.[activeLvl2] || 0);
      if (currentDano < maxPts2) {
        char.dano[activeLvl2] = currentDano + 1;
        if (char.dano[activeLvl2] === maxPts2 && activeLvl2 > 1) { char.dano[activeLvl2 - 1] = 0; }
        saveCurrentCharacter(); _updateLocalPlayerState(); broadcastCharacterState();
      }
    });
    if (incHealth) incHealth.addEventListener("click", () => {
      const maxPts2 = _getHealthMaxPts(char);
      const activeLvl2 = _getActiveLevel(char.dano || {}, maxPts2);
      const currentDano = (char.dano?.[activeLvl2] || 0);
      if (currentDano > 0) {
        char.dano[activeLvl2] = currentDano - 1;
        saveCurrentCharacter(); _updateLocalPlayerState(); broadcastCharacterState();
      } else if (activeLvl2 < 6) {
        char.dano[activeLvl2] = 0;
        char.dano[activeLvl2 + 1] = maxPts2 - 1;
        saveCurrentCharacter(); _updateLocalPlayerState(); broadcastCharacterState();
      }
    });
  }
  if (assEl) {
    assEl.innerHTML = `Ass: ${char.assPoints || 0}/${char.assNivel || 0}`;
  }
  if (portraitEl && char.portrait) portraitEl.innerHTML = `<img src="${char.portrait}" class="table-mini-portrait" alt="${esc(char.name)}">`;
  else if (portraitEl) portraitEl.innerHTML = `<div class="table-mini-portrait-placeholder">${esc(char.name?.[0] || '?')}</div>`;
}

function _applyCachedStates() {
  console.log("[MESA] _applyCachedStates", Object.keys(_playerStateCache));
  for (const pid of Object.keys(_playerStateCache)) {
    const cached = _playerStateCache[pid];
    const detEl = document.getElementById("det-" + pid);
    const saudeEl = document.getElementById("saude-" + pid);
    const assEl = document.getElementById("ass-" + pid);
    const portraitEl = document.getElementById("portrait-" + pid);
    console.log("[MESA] _applyCachedStates pid=" + pid + " detEl=" + !!detEl + " saudeEl=" + !!saudeEl + " det=", cached.det);
    if (detEl && cached.det) detEl.innerHTML = `<span class="det-value">Determinação:${cached.det.atual}/${cached.det.max}</span>`;
    if (saudeEl && cached.saude) saudeEl.innerHTML = _renderHealthLevelsHTML(cached.saude);
    if (assEl && cached.ass) assEl.innerHTML = `Ass: ${cached.ass.atual || 0}/${cached.ass.max || 0}`;
    if (portraitEl) {
      if (cached.portrait) portraitEl.innerHTML = `<img src="${cached.portrait}" class="table-mini-portrait" alt="${esc(cached.nome || '')}">`;
      else portraitEl.innerHTML = `<div class="table-mini-portrait-placeholder">${esc(cached.nome?.[0] || '?')}</div>`;
    }
    const playerItem = portraitEl?.closest?.(".table-player-item");
    if (playerItem && cached.nome) {
      const nameEl = playerItem.querySelector(".table-player-name");
      const isMe = playerItem.dataset.playerId === peerManager?.playerId;
      if (nameEl) nameEl.textContent = cached.nome + (isMe ? " (Você)" : "");
    }
  }
}

function updatePlayerState(playerId, data) {
  console.log("[MESA] updatePlayerState pid=" + playerId + " hasDet=" + !!data?.det + " hasSaude=" + !!data?.saude + " nome=" + data?.nome);
  if (data) { _playerStateCache[playerId] = data; console.log("[MESA] updatePlayerState CACHED", playerId, data); }
  const detEl = document.getElementById("det-" + playerId);
  const saudeEl = document.getElementById("saude-" + playerId);
  const assEl = document.getElementById("ass-" + playerId);
  const portraitEl = document.getElementById("portrait-" + playerId);
  console.log("[MESA] updatePlayerState found detEl=" + !!detEl + " saudeEl=" + !!saudeEl);
  if (detEl && data.det) detEl.innerHTML = `<span class="det-value">Determinação:${data.det.atual}/${data.det.max}</span>`;
  if (saudeEl && data.saude) saudeEl.innerHTML = _renderHealthLevelsHTML(data.saude);
  if (assEl && data.ass) assEl.innerHTML = `Ass: ${data.ass.atual || 0}/${data.ass.max || 0}`;
  if (portraitEl && data.portrait) portraitEl.innerHTML = `<img src="${data.portrait}" class="table-mini-portrait" alt="${esc(data.nome || '')}">`;
  else if (portraitEl && data?.nome) portraitEl.innerHTML = `<div class="table-mini-portrait-placeholder">${esc(data.nome[0] || '?')}</div>`;
  const playerItem = portraitEl?.closest?.(".table-player-item");
  if (playerItem && data.nome) {
    const nameEl = playerItem.querySelector(".table-player-name");
    const isMe = playerItem.dataset.playerId === peerManager?.playerId;
    if (nameEl) nameEl.textContent = data.nome + (isMe ? " (Você)" : "");
  }
}
let _totalRollCount = 0;

function addRollToFeed(data, isOwn = false) {
  if (!rollFeedEl) return;

  _totalRollCount++;
  const countEl = document.getElementById("table-roll-count");
  if (countEl) countEl.textContent = _totalRollCount;

  const entry = document.createElement("div");
  entry.className = "table-roll-entry" + (isOwn ? " is-own-roll" : "");

  const time = new Date(data.data?.timestamp || Date.now()).toLocaleTimeString();
  const label = esc(data.data?.label || "Rolagem");
  const formula = esc(data.data?.formula || "");

  // Monta dados com face + símbolos
  let resultsHtml = "";
  let totalSucessos = 0;
  let totalAdaptacao = 0;
  let totalPressao = 0;

  if (Array.isArray(data.data?.results) && data.data.results.length > 0) {
    const keptIndexes = Array.isArray(data.data?.keptDiceIndexes) ? data.data.keptDiceIndexes : [];
    const diceHtml = data.data.results.map((r, idx) => {
      const dKey = `d${r.sides}`;
      // Prefere symbols transmitidos; fallback para DICE_MAP local
      const symbols = (Array.isArray(r.symbols) && r.symbols.length >= 0)
        ? r.symbols
        : (DICE_MAP[dKey]?.[r.value] ?? []);

      const isKept = keptIndexes.includes(idx);

      if (isKept) {
        totalSucessos += symbols.filter(s => s === "A").length;
        totalAdaptacao += symbols.filter(s => s === "B").length;
        totalPressao += symbols.filter(s => s === "C").length;
      }

      const imgSrc = getDieFaceImgSrc(r.sides, r.value);
      const faceHtml = imgSrc
        ? `<img src="${imgSrc}" class="feed-die-face" alt="d${r.sides}:${r.value}" title="d${r.sides} = ${r.value}">`
        : `<span class="roll-die die-d${r.sides}" title="d${r.sides}">${r.value ?? "?"}</span>`;

      const keptClass = isKept ? ' kept' : '';
      return `<div class="feed-die-card die-d${r.sides}${keptClass}">${faceHtml}</div>`;
    }).join("");

    const sucessosBadge = totalSucessos > 0
      ? `<span class="feed-roll-sucessos" title="Sucessos">${totalSucessos} <small>sucesso</small></span>`
      : `<span class="feed-roll-fracasso">Fracasso</span>`;
    const adaptacaoBadge = totalAdaptacao > 0
      ? `<span class="feed-roll-adaptacao" title="Adaptação">${totalAdaptacao} <small>adaptação</small></span>`
      : "";
    const pressaoBadge = totalPressao > 0
      ? `<span class="feed-roll-pressao" title="Pressão">${totalPressao} <small>pressão</small></span>`
      : "";

    resultsHtml = `<div class="roll-dice-row">${diceHtml}</div><div class="roll-result-summary">${sucessosBadge} ${adaptacaoBadge} ${pressaoBadge}</div>`;
  }

  entry.innerHTML = `
    <div class="roll-header">
      <span class="roll-time">${time}</span>
      <strong class="roll-label">${label}</strong>
      ${formula ? `<code class="roll-formula">${formula}</code>` : ""}
    </div>
    ${resultsHtml}
  `;
  rollFeedEl.prepend(entry);
  while (rollFeedEl.children.length > 50) rollFeedEl.removeChild(rollFeedEl.lastChild);
}

/** Chamado pelo roller.js para registrar a rolagem do próprio jogador no feed da mesa */
export function addOwnRollToFeed(rollData) {
  addRollToFeed({ data: rollData }, true);
}

function showTableScreen() {
  const isFirstTime = !isOnTableScreen && !tableScreen?.classList.contains("hidden") === false
    && !document.body.dataset.mesaVisited;

  previousScreen = document.querySelector(".screen:not(.hidden)") || null;
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  if (tableScreen) tableScreen.classList.remove("hidden");
  isOnTableScreen = true;
  pendingRolls = 0;
  _updateFloatingButton();

  // Só reseta mapa e feed na primeira entrada na sala (não ao voltar via FAB)
  if (!document.body.dataset.mesaVisited) {
    document.body.dataset.mesaVisited = "1";
    resetMapDisplay();
    if (rollFeedEl) rollFeedEl.innerHTML = "";
  }

  if (peerManager?.isHost) {
    document.getElementById("table-map-controls")?.classList.remove("hidden");
    document.getElementById("btn-table-cenas")?.classList.remove("hidden");
  } else {
    document.getElementById("table-map-controls")?.classList.add("hidden");
    document.getElementById("btn-table-cenas")?.classList.add("hidden");
  }
  _updateAddFichaButton();
  _updateConflitoButton();
  broadcastCharacterState();
  if (broadcastInterval) clearInterval(broadcastInterval);
  broadcastInterval = setInterval(() => {
    if (!peerManager) { clearInterval(broadcastInterval); broadcastInterval = null; return; }
    broadcastCharacterState();
  }, 3000);
}


function resetMapDisplay() {
  if (mapImg) { mapImg.src = ""; mapImg.style.display = "none"; }
  if (mapPlaceholder) mapPlaceholder.style.display = "";
}

function _compressImage(dataUrl, maxDim, quality, cb) {
  const img = new Image();
  img.onload = () => {
    let w = img.width, h = img.height;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    cb(c.toDataURL("image/jpeg", quality));
  };
  img.onerror = () => cb(null);
  img.src = dataUrl;
}

function setMapImage(dataUrl) {
  if (!mapImg) return;
  _currentMapDataUrl = dataUrl;
  _zoomLevel = 1; _panX = 0; _panY = 0;
  mapImg.src = dataUrl;
  mapImg.style.transform = "";
  mapImg.classList.remove("zoomable");
  mapImg.style.display = "block";
  if (mapPlaceholder) mapPlaceholder.style.display = "none";
  const display = document.getElementById("zoom-level-display");
  if (display) display.textContent = "100%";
}

function hideTableScreen() {
  if (tableScreen) tableScreen.classList.add("hidden");
  isOnTableScreen = false;
  _updateFloatingButton();
  // Restaura a tela anterior, ou landing como fallback
  const target = previousScreen || document.getElementById("landing-screen");
  if (target) target.classList.remove("hidden");
}

// ── Scene Manager ──────────────────────────────────────────────────────────────

const CENAS_PREDEFINIDAS = [
  { id: "predef_fundo1", name: "Floresta", src: "assets/fundo1.webp", isPredefined: true },
  { id: "predef_fundo2", name: "Abrigo", src: "assets/fundo2.jpeg", isPredefined: true }
];
const SCENES_STORAGE_KEY = "assimilacao_cenas";
let _scenes = [];
let _currentSceneId = null;
let _isSceneMode = false;

function _loadScenes() {
  try {
    const raw = localStorage.getItem(SCENES_STORAGE_KEY);
    const uploaded = raw ? JSON.parse(raw) : [];
    const predefinedIds = new Set(CENAS_PREDEFINIDAS.map(s => s.id));
    _scenes = [...CENAS_PREDEFINIDAS, ...uploaded.filter(s => !predefinedIds.has(s.id))];
  } catch (e) {
    _scenes = [...CENAS_PREDEFINIDAS];
  }
}

function _saveScenes() {
  try {
    const uploaded = _scenes.filter(s => !s.isPredefined);
    localStorage.setItem(SCENES_STORAGE_KEY, JSON.stringify(uploaded));
  } catch (e) {
    logger.error("[Cenas] Erro ao salvar cenas:", e);
  }
}

function _addScene(name, dataUrl) {
  const id = "scene_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
  _scenes.push({ id, name, src: dataUrl, isPredefined: false });
  _saveScenes();
  _renderCenasGallery();
}

function _removeScene(id) {
  _scenes = _scenes.filter(s => s.id !== id);
  _saveScenes();
  _renderCenasGallery();
  if (_currentSceneId === id) {
    _setSceneMode(false);
    _currentSceneId = null;
  }
}

function _setSceneMode(active) {
  _isSceneMode = active;
  const mapImg = document.getElementById("table-map-image");
  const mapPlaceholder = document.getElementById("table-map-placeholder");
  const cenaDisplay = document.getElementById("table-cena-display");
  const cenaControls = document.getElementById("table-cena-controls");
  const mapControls = document.getElementById("table-map-controls");

  if (active) {
    mapImg.style.display = "none";
    mapPlaceholder.style.display = "none";
    cenaDisplay.classList.remove("hidden");
    cenaControls.classList.remove("hidden");
    mapControls.classList.add("hidden");
  } else {
    cenaDisplay.classList.add("hidden");
    cenaControls.classList.add("hidden");
    mapImg.style.display = _currentMapDataUrl ? "block" : "none";
    mapPlaceholder.style.display = _currentMapDataUrl ? "none" : "";
    mapControls.classList.remove("hidden");
  }
}

function _switchScene(sceneId) {
  const scene = _scenes.find(s => s.id === sceneId);
  if (!scene) return;

  const img = document.getElementById("table-cena-image");
  const newSrc = scene.src;

  _currentSceneId = sceneId;

  if (!_isSceneMode) {
    _cenaZoom = 1; _cenaPanX = 0; _cenaPanY = 0;
    _setSceneMode(true);
    img.style.opacity = "0";
    img.src = newSrc;
    void img.offsetHeight;
    img.style.transition = "opacity 0.35s ease";
    img.style.opacity = "1";
    _applyCenaZoom();
  } else if (img.src !== newSrc) {
    img.style.transition = "opacity 0.3s ease";
    img.style.opacity = "0";
    setTimeout(() => {
      img.src = newSrc;
      img.style.transition = "opacity 0.35s ease";
      img.style.opacity = "1";
    }, 300);
  }

  if (peerManager?.isHost) {
    peerManager.broadcast({ type: "scene", playerId: peerManager.playerId, data: { sceneId: scene.id, src: scene.src, name: scene.name } });
  }
}

function _openCenasModal() {
  _loadScenes();
  _renderCenasGallery();
  const modal = document.getElementById("modal-cenas");
  if (modal) modal.classList.remove("hidden");
}

function _closeCenasModal() {
  const modal = document.getElementById("modal-cenas");
  if (modal) modal.classList.add("hidden");
}

function _renderCenasGallery() {
  const list = document.getElementById("cenas-gallery-list");
  if (!list) return;

  list.innerHTML = _scenes.map(s => {
    const isActive = s.id === _currentSceneId;
    return `<div class="cena-thumb ${isActive ? 'active' : ''}" data-id="${esc(s.id)}">
      <div class="cena-thumb-image-wrapper">
        <img class="cena-thumb-image" src="${esc(s.src)}" alt="${esc(s.name)}" loading="lazy">
        ${isActive ? '<span class="cena-thumb-check">✓</span>' : ''}
        ${!s.isPredefined ? `<button class="cena-thumb-delete" data-id="${esc(s.id)}">✕</button>` : ''}
      </div>
      <div class="cena-thumb-name">${esc(s.name)}</div>
    </div>`;
  }).join("");

  list.querySelectorAll(".cena-thumb").forEach(el => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".cena-thumb-delete")) return;
      _switchScene(el.dataset.id);
      _closeCenasModal();
    });
  });

  list.querySelectorAll(".cena-thumb-delete").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      _removeScene(btn.dataset.id);
    });
  });
}

let _cenaZoom = 1, _cenaPanX = 0, _cenaPanY = 0;
let _cenaIsPanning = false, _cenaPanStartX, _cenaPanStartY;

function _applyCenaZoom() {
  const img = document.getElementById("table-cena-image");
  if (!img) return;
  const pct = Math.round(_cenaZoom * 100);
  img.style.transform = `translate(${_cenaPanX}px, ${_cenaPanY}px) scale(${_cenaZoom})`;
  const display = document.getElementById("cena-zoom-level-display");
  if (display) display.textContent = pct + "%";
  img.classList.toggle("zoomable", _cenaZoom > 1);
}

function _initCenasPanel() {
  _loadScenes();

  document.getElementById("btn-table-cenas")?.addEventListener("click", _openCenasModal);
  document.getElementById("btn-close-cenas-modal")?.addEventListener("click", _closeCenasModal);
  document.getElementById("modal-cenas")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) _closeCenasModal();
  });

  document.getElementById("btn-cenas-upload")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target.result;
      _compressImage(dataUrl, 1600, 0.7, (compressed) => {
        const name = file.name.replace(/\.[^.]+$/, "").substring(0, 30);
        _addScene(name, compressed || dataUrl);
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });

  document.getElementById("btn-back-to-map")?.addEventListener("click", () => {
    _setSceneMode(false);
    _currentSceneId = null;
    if (peerManager?.isHost) {
      peerManager.broadcast({ type: "scene", playerId: peerManager.playerId, data: { sceneId: null } });
    }
  });

  // Zoom controls
  const cenaImg = document.getElementById("table-cena-image");

  document.getElementById("btn-cena-zoom-in")?.addEventListener("click", () => {
    _cenaZoom = Math.min(5, _cenaZoom + 0.25);
    _applyCenaZoom();
  });
  document.getElementById("btn-cena-zoom-out")?.addEventListener("click", () => {
    _cenaZoom = Math.max(0.25, _cenaZoom - 0.25);
    _applyCenaZoom();
  });
  document.getElementById("btn-cena-zoom-reset")?.addEventListener("click", () => {
    _cenaZoom = 1; _cenaPanX = 0; _cenaPanY = 0;
    _applyCenaZoom();
  });

  // Pan via mouse drag
  cenaImg?.addEventListener("mousedown", (e) => {
    if (_cenaZoom <= 1) return;
    _cenaIsPanning = true;
    _cenaPanStartX = e.clientX - _cenaPanX;
    _cenaPanStartY = e.clientY - _cenaPanY;
    e.preventDefault();
  });
  document.addEventListener("mousemove", (e) => {
    if (!_cenaIsPanning) return;
    _cenaPanX = e.clientX - _cenaPanStartX;
    _cenaPanY = e.clientY - _cenaPanStartY;
    _applyCenaZoom();
  });
  document.addEventListener("mouseup", () => { _cenaIsPanning = false; });

  // Scroll zoom
  cenaImg?.addEventListener("wheel", (e) => {
    if (cenaImg.style.display === "none") return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    _cenaZoom = Math.max(0.25, Math.min(5, _cenaZoom + delta));
    _applyCenaZoom();
  }, { passive: false });
}

/** Minimiza a mesa (sem desconectar) se ela estiver ativa. */
export function minimizeMesa() {
  if (isOnTableScreen) hideTableScreen();
}

// ── Botão Flutuante ──────────────────────────────────────────────────────────

function _createFloatingButton() {
  const btn = document.createElement("button");
  btn.id = "fab-mesa";
  btn.setAttribute("aria-label", "Voltar à Mesa");
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
      <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2 0v10h14V5H5zm2 2h10v2H7V7zm0 4h6v2H7v-2z"/>
    </svg>
    <span id="fab-mesa-label">Mesa</span>
    <span id="fab-mesa-badge" class="fab-mesa-badge hidden">0</span>
  `;
  btn.classList.add("hidden");
  btn.addEventListener("click", _toggleTableScreen);
  document.body.appendChild(btn);
}

function _toggleTableScreen() {
  if (isOnTableScreen) {
    // Minimiza: volta para a tela anterior sem desconectar
    hideTableScreen();
  } else {
    // Maximiza: volta para a mesa
    showTableScreen();
  }
}

function _updateFloatingButton() {
  const btn = document.getElementById("fab-mesa");
  if (!btn) return;
  const badge = document.getElementById("fab-mesa-badge");
  const label = document.getElementById("fab-mesa-label");

  if (!peerManager) {
    btn.classList.add("hidden");
    return;
  }

  btn.classList.remove("hidden");

  if (isOnTableScreen) {
    label.textContent = "Minimizar";
    btn.classList.add("fab-mesa--active");
  } else {
    label.textContent = "Mesa";
    btn.classList.remove("fab-mesa--active");
  }

  if (pendingRolls > 0 && !isOnTableScreen) {
    badge.textContent = pendingRolls > 9 ? "9+" : pendingRolls;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

// ── Hoist do Dice Drawer ──────────────────────────────────────────────────────
// O #dice-drawer fica dentro do #sheet-screen, que tem overflow:hidden.
// Isso cria um stacking context que impede position:fixed de sobrepor outras
// telas (como a mesa). Movemos o drawer para filho direto do <body> para
// que seu z-index funcione globalmente.
function _hoistDiceDrawer() {
  const drawer = document.getElementById("dice-drawer");
  if (!drawer) return;
  if (drawer.parentElement === document.body) return; // já hoistado
  document.body.appendChild(drawer);
}

// ── Chat Panel ────────────────────────────────────────────────────────────────

let _chatMessages = [];      // { playerId, playerName, text, imageDataUrl, timestamp }
let _chatUnread   = 0;
let _chatOpen     = false;
let _pendingChatImg = null;  // dataUrl da imagem a enviar

function _initChatPanel() {
  const panel      = document.getElementById("table-chat-panel");
  const toggleBtn  = document.getElementById("btn-toggle-chat");
  const closeBtn   = document.getElementById("btn-close-chat");
  const sendBtn    = document.getElementById("btn-send-chat-msg");
  const textInput  = document.getElementById("table-chat-text-input");
  const imgInput   = document.getElementById("table-chat-img-input");
  const preview    = document.getElementById("table-chat-img-preview");
  const previewImg = document.getElementById("table-chat-img-preview-img");
  const cancelImg  = document.getElementById("btn-cancel-chat-img");

  if (!panel) return;

  // Cria lightbox global
  if (!document.getElementById("chat-img-lightbox")) {
    const lb = document.createElement("div");
    lb.id = "chat-img-lightbox";
    lb.className = "hidden";
    lb.innerHTML = `<img src="" alt="Imagem ampliada">`;
    lb.addEventListener("click", () => lb.classList.add("hidden"));
    document.body.appendChild(lb);
  }

  // Toggle abrir/fechar
  toggleBtn?.addEventListener("click", () => _setChatOpen(!_chatOpen));
  closeBtn?.addEventListener("click",  () => _setChatOpen(false));

  // Auto-resize textarea
  textInput?.addEventListener("input", () => {
    textInput.style.height = "auto";
    textInput.style.height = Math.min(textInput.scrollHeight, 80) + "px";
  });

  // Enter envia (Shift+Enter quebra linha)
  textInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      _sendChatMessage();
    }
  });

  sendBtn?.addEventListener("click", _sendChatMessage);

  // Selecionar imagem
  imgInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      _pendingChatImg = evt.target.result;
      if (previewImg) previewImg.src = _pendingChatImg;
      if (preview) preview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });

  cancelImg?.addEventListener("click", () => {
    _pendingChatImg = null;
    if (previewImg) previewImg.src = "";
    if (preview) preview.classList.add("hidden");
  });

  _renderChatMessages();
}

function _setChatOpen(open) {
  _chatOpen = open;
  const panel = document.getElementById("table-chat-panel");
  if (!panel) return;
  if (open) {
    panel.classList.remove("collapsed");
    _chatUnread = 0;
    _updateChatBadge();
    // Scroll para o fim
    const msgs = document.getElementById("table-chat-messages");
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  } else {
    panel.classList.add("collapsed");
  }
}

function _updateChatBadge() {
  const badge = document.getElementById("chat-unread-badge");
  if (!badge) return;
  if (_chatUnread > 0 && !_chatOpen) {
    badge.textContent = _chatUnread > 9 ? "9+" : _chatUnread;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function _sendChatMessage() {
  const textInput = document.getElementById("table-chat-text-input");
  const text = textInput?.value.trim() || "";
  if (!text && !_pendingChatImg) return;

  const playerName = peerManager
    ? (document.getElementById("room-player-name")?.value ||
       document.getElementById("room-player-name-join")?.value ||
       "Eu")
    : "Eu";

  const msg = {
    playerId: peerManager?.playerId || "local",
    playerName,
    text,
    imageDataUrl: _pendingChatImg || null,
    timestamp: Date.now()
  };

  // Comprime imagem se houver antes de broadcast
  if (_pendingChatImg && peerManager) {
    _compressImage(_pendingChatImg, 800, 0.7, (compressed) => {
      const broadcastMsg = { ...msg, imageDataUrl: compressed || _pendingChatImg };
      peerManager.broadcast({ type: "chat", playerId: peerManager.playerId, data: broadcastMsg });
    });
  } else if (peerManager) {
    peerManager.broadcast({ type: "chat", playerId: peerManager.playerId, data: msg });
  }

  _addChatMessage(msg, true);

  // Limpa inputs
  if (textInput) { textInput.value = ""; textInput.style.height = "auto"; }
  _pendingChatImg = null;
  const previewImg = document.getElementById("table-chat-img-preview-img");
  const preview    = document.getElementById("table-chat-img-preview");
  if (previewImg) previewImg.src = "";
  if (preview) preview.classList.add("hidden");
}

function _receiveChatMessage(data) {
  if (!data?.data) return;
  _addChatMessage(data.data, false);
  if (!_chatOpen) {
    _chatUnread++;
    _updateChatBadge();
  }
}

function _addChatMessage(msg, isOwn) {
  _chatMessages.push({ ...msg, isOwn });
  if (_chatMessages.length > 100) _chatMessages.shift();
  _renderChatMessages();
  if (_chatOpen) {
    const msgs = document.getElementById("table-chat-messages");
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }
}

function _renderChatMessages() {
  const container = document.getElementById("table-chat-messages");
  if (!container) return;

  if (_chatMessages.length === 0) {
    container.innerHTML = `<div class="chat-msg-placeholder">Nenhuma mensagem ainda.<br>Seja o primeiro a falar! 💬</div>`;
    return;
  }

  container.innerHTML = "";
  _chatMessages.forEach((msg) => {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${msg.isOwn ? 'is-own' : 'is-other'}`;

    const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const author = esc(msg.playerName || "?");

    let contentHtml = "";
    if (msg.text) {
      contentHtml += `<div class="chat-bubble-content">${esc(msg.text)}</div>`;
    }
    if (msg.imageDataUrl) {
      contentHtml += `<img class="chat-bubble-img" src="${msg.imageDataUrl}" alt="imagem" loading="lazy">`;
    }

    bubble.innerHTML = `
      <div class="chat-bubble-meta">
        <span class="chat-bubble-author">${author}</span>
        <span>${time}</span>
      </div>
      ${contentHtml}
    `;

    // Lightbox ao clicar em imagem
    const imgEl = bubble.querySelector(".chat-bubble-img");
    if (imgEl) {
      imgEl.addEventListener("click", () => {
        const lb = document.getElementById("chat-img-lightbox");
        if (!lb) return;
        lb.querySelector("img").src = msg.imageDataUrl;
        lb.classList.remove("hidden");
      });
    }

    container.appendChild(bubble);
  });
}

// ── Fichas Extras do Mestre ────────────────────────────────────────────────

let _extraFichas = []; // Array de { char: CharObject, id: string }

/** Chamado em showTableScreen para mostrar/ocultar o botão conforme isHost */
function _updateAddFichaButton() {
  const btn = document.getElementById("btn-add-ficha");
  const btnVis = document.getElementById("btn-manage-fichas-visibility");
  if (peerManager?.isHost) {
    btn?.classList.remove("hidden");
    btnVis?.classList.remove("hidden");
  } else {
    btn?.classList.add("hidden");
    btnVis?.classList.add("hidden");
  }
}

function _initFichasPicker() {
  const btn      = document.getElementById("btn-add-ficha");
  const modal    = document.getElementById("modal-add-ficha");
  const closeBtn = document.getElementById("btn-close-add-ficha");
  const search   = document.getElementById("ficha-picker-search");

  if (!btn || !modal) return;

  btn.addEventListener("click", () => {
    _openFichasPicker();
  });

  closeBtn?.addEventListener("click", () => modal.classList.add("hidden"));

  // Fechar ao clicar no overlay
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  // Filtro de busca em tempo real
  search?.addEventListener("input", () => _renderFichasPickerList(search.value.trim()));
}

function _openFichasPicker() {
  const modal  = document.getElementById("modal-add-ficha");
  const search = document.getElementById("ficha-picker-search");
  if (!modal) return;
  if (search) search.value = "";
  _renderFichasPickerList("");
  modal.classList.remove("hidden");
  search?.focus();
}

function _renderFichasPickerList(filter = "") {
  const list = document.getElementById("ficha-picker-list");
  if (!list) return;

  const chars = state.characters || [];
  const addedIds = new Set(_extraFichas.map(e => e.char.id));
  const q = filter.toLowerCase();

  const filtered = chars.filter(c =>
    !q || c.name?.toLowerCase().includes(q) ||
    c.ocupacao?.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    list.innerHTML = `<div class="ficha-picker-empty">Nenhuma ficha encontrada.<br>Crie fichas na tela principal.</div>`;
    return;
  }

  list.innerHTML = "";
  filtered.forEach(char => {
    const isAdded = addedIds.has(char.id);
    const item = document.createElement("div");
    item.className = "ficha-picker-item" + (isAdded ? " already-added" : "");

    const avatarHtml = char.portrait
      ? `<img class="ficha-picker-avatar" src="${char.portrait}" alt="${esc(char.name)}">`
      : `<div class="ficha-picker-avatar-placeholder">${esc(char.name?.[0] || "?")}</div>`;

    const sub = [char.ocupacao, char.geracao].filter(Boolean).join(" · ") || "Infectado";

    item.innerHTML = `
      ${avatarHtml}
      <div class="ficha-picker-info">
        <div class="ficha-picker-name">${esc(char.name || "Sem nome")}</div>
        <div class="ficha-picker-sub">${esc(sub)}</div>
      </div>
      ${isAdded ? '<span class="ficha-picker-check">✓</span>' : ''}
    `;

    if (!isAdded) {
      item.addEventListener("click", () => {
        _addExtraFicha(char);
        document.getElementById("modal-add-ficha")?.classList.add("hidden");
      });
    }

    list.appendChild(item);
  });
}

function _addExtraFicha(char) {
  // Copia profunda para não afetar o personagem atual
  const copy = JSON.parse(JSON.stringify(char));
  const entry = { char: copy, id: "extra-" + copy.id };
  _extraFichas.push(entry);
  _renderExtraFichas();
}

function _removeExtraFicha(id) {
  _extraFichas = _extraFichas.filter(e => e.id !== id);
  _renderExtraFichas();
}

function _renderExtraFichas() {
  const container = document.getElementById("table-player-list");
  if (!container) return;
  
  // Remover itens extras existentes para evitar duplicados
  container.querySelectorAll(".extra-ficha-item").forEach(item => item.remove());

  _extraFichas.forEach(entry => {
    const { char, id } = entry;
    const maxPts = _getHealthMaxPts(char);
    const item = document.createElement("div");
    const isHidden = _hiddenFichaIds.has(id);
    item.className = `extra-ficha-item table-player-item ${isHidden ? 'hidden-ficha' : ''}`;
    item.dataset.extraId = id;

    const portraitHtml = char.portrait
      ? `<img src="${char.portrait}" class="table-mini-portrait" alt="${esc(char.name)}">`
      : `<div class="table-mini-portrait-placeholder">${esc(char.name?.[0] || "?")}</div>`;

    item.innerHTML = `
      <div class="table-player-portrait">${portraitHtml}</div>
      <div class="table-player-stats">
        <span class="table-player-name">${esc(char.name)}</span>
        <div class="stat-det" id="extra-det-${id}"></div>
        <div class="stat-saude" id="extra-saude-${id}"></div>
        <div class="stat-ass" id="extra-ass-${id}">Ass: ${char.assPoints || 0}/${char.assNivel || 0}</div>
      </div>
      <div class="extra-ficha-actions">
        <button class="btn-roll-extra-ficha" title="Rolar dado para esta ficha">&#x1F3B2;</button>
        <button class="btn-remove-extra-ficha" title="Remover ficha">✕</button>
      </div>
    `;

    // Botão de remover
    item.querySelector(".btn-remove-extra-ficha").addEventListener("click", (e) => {
      e.stopPropagation();
      _removeExtraFicha(id);
    });

    // Botao de rolagem
    item.querySelector(".btn-roll-extra-ficha").addEventListener("click", (e) => {
      e.stopPropagation();
      _openDrawerForExtraFicha(char);
    });

    container.appendChild(item);
    _renderExtraFichaStats(entry);
  });
  _applyFichasVisibility();
}

function _openDrawerForExtraFicha(char) {
  const drawer = document.getElementById("dice-drawer");
  if (!drawer) return;

  const prevChar = state.currentCharacter;
  state.currentCharacter = char;

  const titleEl = drawer.querySelector(".modal-title");
  const prevTitle = titleEl?.textContent;
  if (titleEl) titleEl.textContent = '🎲 Painel de Rolagem — ' + (char.name || 'Ficha Extra');

  import("./roller.js").then(({ updateDiceDrawerUI }) => updateDiceDrawerUI());

  drawer.classList.remove("hidden");

  const restore = () => {
    state.currentCharacter = prevChar;
    if (titleEl && prevTitle) titleEl.textContent = prevTitle;
    import("./roller.js").then(({ updateDiceDrawerUI }) => updateDiceDrawerUI());
    drawer.removeEventListener("click", onOverlay);
    closeBtn?.removeEventListener("click", restore);
  };

  const onOverlay = (e) => { if (e.target === drawer) restore(); };
  const closeBtn = drawer.querySelector("#btn-close-drawer");
  closeBtn?.addEventListener("click", restore, { once: true });
  drawer.addEventListener("click", onOverlay);
}
function _performExtraFichaRoll(charName, label, numDice) {
  const results = Array.from({ length: numDice }, () => ({
    sides: 10, value: Math.ceil(Math.random() * 10), symbols: []
  }));
  const keptDiceIndexes = results.map((_, i) => i);
  const rollData = {
    formula: `${numDice}d10`,
    label: `${charName}: ${label}`,
    timestamp: Date.now(),
    results,
    keptDiceIndexes
  };
  addOwnRollToFeed(rollData);
  if (peerManager) {
    peerManager.broadcast({ type: "roll", playerId: peerManager.playerId, data: rollData });
  }
}

function _renderExtraFichaStats(entry) {
  const { char, id } = entry;
  const maxPts = _getHealthMaxPts(char);
  if (!char.dano) char.dano = { 6:0, 5:0, 4:0, 3:0, 2:0, 1:0 };

  // Determinação
  const detEl = document.getElementById("extra-det-" + id);
  if (detEl) {
    detEl.innerHTML = `
      <button type="button" class="btn-det-dec">−</button>
      <span class="det-value">Determinação: ${char.detPoints || 0}/${char.detNivel || 1}</span>
      <button type="button" class="btn-det-inc">+</button>
    `;
    detEl.querySelector(".btn-det-dec").addEventListener("click", () => {
      if ((char.detPoints || 0) > 0) { char.detPoints--; _renderExtraFichaStats(entry); }
    });
    detEl.querySelector(".btn-det-inc").addEventListener("click", () => {
      if ((char.detPoints || 0) < (char.detNivel || 1)) { char.detPoints++; _renderExtraFichaStats(entry); }
    });
  }

  // Saúde
  const saudeEl = document.getElementById("extra-saude-" + id);
  if (saudeEl) {
    saudeEl.innerHTML = _renderHealthLevelsHTML({ dano: char.dano, maxPts });

    saudeEl.querySelectorAll(".health-drop").forEach(drop => {
      drop.addEventListener("click", () => {
        const lvlKey = parseInt(drop.dataset.level);
        const index  = parseInt(drop.dataset.index);
        const currentDano  = char.dano[lvlKey] || 0;
        const currentHealth = maxPts - currentDano;
        const newHealth = currentHealth === index ? index - 1 : index;
        char.dano[lvlKey] = maxPts - newHealth;
        if (char.dano[lvlKey] === maxPts && lvlKey > 1) char.dano[lvlKey - 1] = 0;
        _renderExtraFichaStats(entry);
      });
    });

    const decH = saudeEl.querySelector(".btn-health-mesa-dec");
    const incH = saudeEl.querySelector(".btn-health-mesa-inc");
    if (decH) decH.addEventListener("click", () => {
      const activeLvl = _getActiveLevel(char.dano, maxPts);
      const d = char.dano[activeLvl] || 0;
      if (d < maxPts) {
        char.dano[activeLvl] = d + 1;
        if (char.dano[activeLvl] === maxPts && activeLvl > 1) char.dano[activeLvl - 1] = 0;
        _renderExtraFichaStats(entry);
      }
    });
    if (incH) incH.addEventListener("click", () => {
      const activeLvl = _getActiveLevel(char.dano, maxPts);
      const d = char.dano[activeLvl] || 0;
      if (d > 0) {
        char.dano[activeLvl] = d - 1;
        _renderExtraFichaStats(entry);
      } else if (activeLvl < 6) {
        char.dano[activeLvl] = 0;
        char.dano[activeLvl + 1] = maxPts - 1;
        _renderExtraFichaStats(entry);
      }
    });
  }
  const assEl = document.getElementById("extra-ass-" + id);
  if (assEl) assEl.textContent = `Ass: ${char.assPoints || 0}/${char.assNivel || 0}`;
}

// ── Conflito na Mesa ──────────────────────────────────────────────────────────────

let _activeConflito = null; // ficha de conflito ativa na mesa

function _updateConflitoButton() {
  const btn    = document.getElementById("btn-table-conflito");
  const banner = document.getElementById("table-conflito-banner");
  if (!btn) return;

  if (peerManager?.isHost) {
    btn.classList.remove("hidden");
  } else {
    btn.classList.add("hidden");
    if (banner) banner.classList.add("hidden");
    return;
  }

  if (_activeConflito) {
    btn.classList.add("conflito-active");
    _showConflitoBanner(_activeConflito);
  } else {
    btn.classList.remove("conflito-active");
    if (banner) banner.classList.add("hidden");
  }
}

function _initConflitoPicker() {
  const btn      = document.getElementById("btn-table-conflito");
  const modal    = document.getElementById("modal-table-conflito");
  const closeBtn = document.getElementById("btn-close-table-conflito-modal");
  const search   = document.getElementById("conflito-picker-search");

  if (!btn || !modal) return;

  btn.addEventListener("click", () => {
    if (_activeConflito) {
      // já há conflito ativo → re-abre o picker para trocar
      _openConflitoPicker();
    } else {
      _openConflitoPicker();
    }
  });

  closeBtn?.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });
  search?.addEventListener("input", () => _renderConflitosPickerList(search.value.trim()));

  // Botões do banner
  document.getElementById("btn-tb-roll-conflito")?.addEventListener("click", _rollConflito);
  document.getElementById("btn-tb-ativacoes")?.addEventListener("click", () => {
    const modal = document.getElementById("modal-mesa-ativacoes");
    const panel = document.querySelector(".mesa-ativacoes-panel");
    const nomeEl = document.getElementById("mesa-ativacoes-conflito-nome");
    if (!modal) return;
    if (nomeEl && _activeConflito) nomeEl.textContent = _activeConflito.nome || "Conflito";
    _renderMesaAtivacoes();
    if (panel) {
      panel.style.position = "";
      panel.style.left = "";
      panel.style.top = "";
      panel.style.margin = "";
    }
    modal.classList.remove("hidden");
  });
  document.getElementById("btn-tb-end-conflito")?.addEventListener("click", () => {
    _activeConflito = null;
    _updateConflitoButton();
  });
  document.getElementById("btn-close-mesa-ativacoes")?.addEventListener("click", () => {
    document.getElementById("modal-mesa-ativacoes")?.classList.add("hidden");
  });
  _makeMesaAtivacoesDraggable();
  document.getElementById("btn-mesa-ativacoes-roll")?.addEventListener("click", () => {
    _rollConflito();
  });
  document.getElementById("modal-mesa-ativacoes")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add("hidden");
  });

  // +/- dos investimentos e reset nas ativações da mesa
  document.getElementById("mesa-ativacoes-list")?.addEventListener("click", (e) => {
    const inc = e.target.closest(".btn-invest-inc");
    const dec = e.target.closest(".btn-invest-dec");
    const reset = e.target.closest(".btn-reset-ativacao");
    if (inc) _updateMesaInvestment(parseInt(inc.dataset.idx), inc.dataset.type, 1);
    if (dec) _updateMesaInvestment(parseInt(dec.dataset.idx), dec.dataset.type, -1);
    if (reset) _resetMesaAtivacao(parseInt(reset.dataset.idx));
  });

  // +/- dos dados no banner
  document.querySelectorAll(".btn-conf-tb-dec").forEach(b => {
    b.addEventListener("click", () => {
      const input = document.getElementById(`tb-conflito-d${b.dataset.sides}`);
      if (input) input.value = Math.max(0, parseInt(input.value || 0) - 1);
    });
  });
  document.querySelectorAll(".btn-conf-tb-inc").forEach(b => {
    b.addEventListener("click", () => {
      const input = document.getElementById(`tb-conflito-d${b.dataset.sides}`);
      if (input) input.value = Math.min(20, parseInt(input.value || 0) + 1);
    });
  });
}

function _openConflitoPicker() {
  const modal  = document.getElementById("modal-table-conflito");
  const search = document.getElementById("conflito-picker-search");
  if (!modal) return;
  if (search) search.value = "";
  _renderConflitosPickerList("");
  modal.classList.remove("hidden");
  search?.focus();
}

function _renderConflitosPickerList(filter = "") {
  const list = document.getElementById("conflito-picker-list");
  if (!list) return;

  const conflitos = worldState.conflitos || [];
  const q = filter.toLowerCase();
  const filtered = conflitos.filter(c =>
    !q || c.nome?.toLowerCase().includes(q) ||
    c.tipoConflito?.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    list.innerHTML = `<div class="ficha-picker-empty">Nenhum conflito encontrado.<br>Crie conflitos na tela de mundo.</div>`;
    return;
  }

  const statusClassMap = { "Ativo": "status-ativo", "Contido": "status-contido", "Resolvido": "status-resolvido" };

  list.innerHTML = "";
  filtered.forEach(c => {
    const isActive = _activeConflito?.id === c.id;
    const item = document.createElement("div");
    item.className = "ficha-picker-item" + (isActive ? " already-added" : "");

    const statusClass = statusClassMap[c.status] || "status-ativo";
    const grau = c.grau || 1;
    const d6 = c.d6Count ?? grau;
    const d10 = c.d10Count ?? 0;
    const d12 = c.d12Count ?? 0;
    const diceStr = [d6 && `${d6}d6`, d10 && `${d10}d10`, d12 && `${d12}d12`].filter(Boolean).join(" + ") || `${grau}d6`;

    item.innerHTML = `
      <div class="ficha-picker-avatar-placeholder" style="background:rgba(190,49,53,0.18); border-color:rgba(190,49,53,0.35); color:var(--color-rust-glow); font-size:18px;">⚔️</div>
      <div class="ficha-picker-info">
        <div class="ficha-picker-name">${esc(c.nome || "Sem nome")}</div>
        <div class="ficha-picker-sub">${esc(diceStr)}</div>
      </div>
      <span class="conflito-picker-item-type">${esc(c.tipoConflito || "")}</span>
      <span class="conflito-picker-item-status ${statusClass}">${esc(c.status || "Ativo")}</span>
      ${isActive ? '<span class="ficha-picker-check">✓</span>' : ''}
    `;

    item.addEventListener("click", () => {
      _setActiveConflito(c);
      document.getElementById("modal-table-conflito")?.classList.add("hidden");
    });

    list.appendChild(item);
  });
}

function _setActiveConflito(c) {
  _activeConflito = c;
  _updateConflitoButton();
  // Pré-carrega os valores de dados do conflito no banner
  const d6Input  = document.getElementById("tb-conflito-d6");
  const d10Input = document.getElementById("tb-conflito-d10");
  const d12Input = document.getElementById("tb-conflito-d12");
  if (d6Input)  d6Input.value  = c.d6Count  ?? (c.grau || 1);
  if (d10Input) d10Input.value = c.d10Count ?? 0;
  if (d12Input) d12Input.value = c.d12Count ?? 0;
}

function _showConflitoBanner(c) {
  const banner   = document.getElementById("table-conflito-banner");
  const nomeEl   = document.getElementById("table-conflito-banner-nome");
  const tipoEl   = document.getElementById("table-conflito-banner-tipo");
  if (!banner) return;
  if (nomeEl) nomeEl.textContent = c.nome || "Conflito";
  if (tipoEl) tipoEl.textContent = c.tipoConflito || "";
  banner.classList.remove("hidden");
}

function _makeMesaAtivacoesDraggable() {
  const panel = document.querySelector(".mesa-ativacoes-panel");
  const handle = document.querySelector(".mesa-ativacoes-header");
  if (!panel || !handle) return;
  let isDragging = false, startX, startY, origLeft, origTop;
  handle.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;
    isDragging = true;
    const rect = panel.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    origLeft = rect.left;
    origTop = rect.top;
    panel.style.position = "fixed";
    panel.style.left = origLeft + "px";
    panel.style.top = origTop + "px";
    panel.style.margin = "0";
    document.body.style.cursor = "grabbing";
    panel.style.pointerEvents = "none";
    handle.style.pointerEvents = "auto";
  });
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    panel.style.left = (origLeft + e.clientX - startX) + "px";
    panel.style.top = (origTop + e.clientY - startY) + "px";
  });
  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    document.body.style.cursor = "";
    panel.style.pointerEvents = "";
    handle.style.pointerEvents = "";
  });
}

function _diceImgMesa(type) {
  const map = { S: "assets/d6/6(D6).webp", A: "assets/d6/ad.webp", P: "assets/d6/3-4(D6).webp" };
  return map[type] || `assets/d6/${type}.webp`;
}

function _renderMesaAtivacoes() {
  const list = document.getElementById("mesa-ativacoes-list");
  if (!list) return;
  const ativacoes = _activeConflito?.ativacoes || [];
  if (ativacoes.length === 0) {
    list.innerHTML = `<div style="text-align:center;color:var(--text-muted);font-size:12px;padding:16px 0;">Nenhuma ativação neste conflito.</div>`;
    return;
  }
  list.innerHTML = ativacoes.map((act, idx) => {
    const cleanTrigger = act.gatilho.toUpperCase().replace(/\s+/g, "");
    const requiredS = (cleanTrigger.match(/S/g) || []).length;
    const requiredA = (cleanTrigger.match(/[AB]/g) || []).length;
    const requiredP = (cleanTrigger.match(/[CP]/g) || []).length;
    const investedS = act.investedS || 0;
    const investedA = act.investedA || 0;
    const investedP = act.investedP || 0;
    const isCompleted = (requiredS + requiredA + requiredP) > 0 &&
      investedS >= requiredS && investedA >= requiredA && investedP >= requiredP;
    const itemClass = "conflito-ativacao-item" + (isCompleted ? " completed-item" : "");
    const triggerHtml = cleanTrigger.split("").map(ch => {
      if (ch === "S") return `<img src="${_diceImgMesa('S')}" class="mesa-dice-img" title="Sucesso">`;
      if (ch === "A" || ch === "B") return `<img src="${_diceImgMesa('A')}" class="mesa-dice-img" title="Adaptação">`;
      if (ch === "C" || ch === "P") return `<img src="${_diceImgMesa('P')}" class="mesa-dice-img" title="Pressão">`;
      return `<span>${esc(ch)}</span>`;
    }).join("");
    return `<div class="${itemClass}">
      <div class="conflito-ativacao-title-row">
        <span class="conflito-ativacao-titulo">${esc(act.titulo)}</span>
      </div>
      <div style="display:flex;gap:4px;margin:4px 0;flex-wrap:wrap;align-items:center;">
        <span style="font-size:10px;color:var(--text-muted);">Gatilho:</span>
        ${triggerHtml}
      </div>
      <div class="conflito-ativacao-efeito">${esc(act.efeito)}</div>
      <div class="mesa-ativacao-actions" style="display:flex; gap:4px; margin-top:4px;">
        ${isCompleted ? `<button class="btn-reset-ativacao" data-idx="${idx}" title="Gastar todas as investidas e resetar">Gastar</button>` : ""}
        <button class="btn-edit-ativacao" data-idx="${idx}" title="Editar Ativação">Editar</button>
      </div>
      <div class="conflito-ativacao-investimento" style="margin-top:6px;">
        <div class="investimento-label-row" style="display:flex;align-items:center;gap:4px;">
          <span class="investimento-label">Partitura:</span>
          <div class="investimento-controls">
            ${requiredS > 0 ? `
            <div class="investimento-control-group group-s" title="Sucessos (S) investidos. Necessário: ${requiredS}">
              <img src="${_diceImgMesa('S')}" alt="S">
              <button type="button" class="btn-invest-dec" data-idx="${idx}" data-type="S">-</button>
              <span class="invest-val ${investedS >= requiredS ? 'met' : ''}">${investedS}/${requiredS}</span>
              <button type="button" class="btn-invest-inc" data-idx="${idx}" data-type="S">+</button>
            </div>` : ""}
            ${requiredA > 0 ? `
            <div class="investimento-control-group group-a" title="Adaptações (A) investidas. Necessário: ${requiredA}">
              <img src="${_diceImgMesa('A')}" alt="A">
              <button type="button" class="btn-invest-dec" data-idx="${idx}" data-type="A">-</button>
              <span class="invest-val ${investedA >= requiredA ? 'met' : ''}">${investedA}/${requiredA}</span>
              <button type="button" class="btn-invest-inc" data-idx="${idx}" data-type="A">+</button>
            </div>` : ""}
            ${requiredP > 0 ? `
            <div class="investimento-control-group group-p" title="Pressões (P) investidas. Necessário: ${requiredP}">
              <img src="${_diceImgMesa('P')}" alt="P">
              <button type="button" class="btn-invest-dec" data-idx="${idx}" data-type="P">-</button>
              <span class="invest-val ${investedP >= requiredP ? 'met' : ''}">${investedP}/${requiredP}</span>
              <button type="button" class="btn-invest-inc" data-idx="${idx}" data-type="P">+</button>
            </div>` : ""}
          </div>
        </div>
      </div>
    </div>`;
  }).join("");
}

function _updateMesaInvestment(idx, type, delta) {
  const c = _activeConflito;
  if (!c || !c.ativacoes || !c.ativacoes[idx]) return;
  const act = c.ativacoes[idx];
  const key = `invested${type}`;
  act[key] = delta > 0 ? (act[key] || 0) + delta : Math.max(0, (act[key] || 0) + delta);
  const list = document.getElementById("mesa-ativacoes-list");
  if (!list) return;
  const group = list.querySelector(`.btn-invest-inc[data-idx="${idx}"][data-type="${type}"]`)?.closest(".investimento-control-group");
  if (!group) return;
  const valSpan = group.querySelector(".invest-val");
  if (!valSpan) return;
  const cleanTrigger = act.gatilho.toUpperCase().replace(/\s+/g, "");
  const requiredS = (cleanTrigger.match(/S/g) || []).length;
  const requiredA = (cleanTrigger.match(/[AB]/g) || []).length;
  const requiredP = (cleanTrigger.match(/[CP]/g) || []).length;
  const requiredMap = { S: requiredS, A: requiredA, P: requiredP };
  const required = requiredMap[type] || 0;
  valSpan.textContent = `${act[key]}/${required}`;
  valSpan.classList.toggle("met", act[key] >= required && required > 0);
  const item = group.closest(".conflito-ativacao-item");
  if (item) {
    const totalRequired = requiredS + requiredA + requiredP;
    const isCompleted = totalRequired > 0 &&
      (act.investedS || 0) >= requiredS &&
      (act.investedA || 0) >= requiredA &&
      (act.investedP || 0) >= requiredP;
    item.classList.toggle("completed-item", isCompleted);
    const actionsContainer = item.querySelector(".mesa-ativacao-actions");
    if (actionsContainer) {
      let resetBtn = actionsContainer.querySelector(".btn-reset-ativacao");
      if (isCompleted && !resetBtn) {
        resetBtn = document.createElement("button");
        resetBtn.className = "btn-reset-ativacao";
        resetBtn.dataset.idx = idx;
        resetBtn.title = "Gastar todas as investidas e resetar";
        resetBtn.textContent = "Gastar";
        actionsContainer.insertBefore(resetBtn, actionsContainer.firstChild);
      } else if (!isCompleted && resetBtn) {
        resetBtn.remove();
      }
    }
  }
  saveConflito(c);
}

function _resetMesaAtivacao(idx) {
  const c = _activeConflito;
  if (!c || !c.ativacoes || !c.ativacoes[idx]) return;
  const act = c.ativacoes[idx];

  // Deduct spent dice from conflict's last roll
  const lastRoll = c.rolagens && c.rolagens[c.rolagens.length - 1];
  if (lastRoll) {
    lastRoll.bonusSuccesses = (lastRoll.bonusSuccesses || 0) - (act.investedS || 0);
    lastRoll.bonusAdaptations = (lastRoll.bonusAdaptations || 0) - (act.investedA || 0);
    lastRoll.bonusPressures = (lastRoll.bonusPressures || 0) - (act.investedP || 0);
  }

  act.investedS = 0;
  act.investedA = 0;
  act.investedP = 0;
  act.snapshotS = 0;
  act.snapshotA = 0;
  act.snapshotP = 0;
  const list = document.getElementById("mesa-ativacoes-list");
  if (list) {
    const item = list.querySelector(`.btn-reset-ativacao[data-idx="${idx}"]`)?.closest(".conflito-ativacao-item");
    if (item) {
      item.classList.remove("completed-item");
      const resetBtn = item.querySelector(".btn-reset-ativacao");
      if (resetBtn) resetBtn.remove();
      item.querySelectorAll(".invest-val").forEach(span => {
        const required = span.textContent.split("/")[1];
        span.textContent = `0/${required}`;
        span.classList.remove("met");
      });
    }
  }
  saveConflito(c);

  const msg = `Ativação: ${act.titulo} - ${act.efeito}`;
  const pm = getPeerManager();
  const playerName = pm ? (pm.isHost ? "Mestre" : "Jogador") : "Mestre";
  const chatData = {
    text: msg,
    playerName,
    timestamp: Date.now()
  };
  _addChatMessage(chatData, true);
  if (pm) {
    pm.broadcast({ type: "chat", playerId: pm.playerId, data: chatData });
  }
}

function _rollConflito() {
  const d6  = parseInt(document.getElementById("tb-conflito-d6")?.value)  || 0;
  const d10 = parseInt(document.getElementById("tb-conflito-d10")?.value) || 0;
  const d12 = parseInt(document.getElementById("tb-conflito-d12")?.value) || 0;

  const parts = [];
  if (d6  > 0) parts.push(`${d6}d6`);
  if (d10 > 0) parts.push(`${d10}d10`);
  if (d12 > 0) parts.push(`${d12}d12`);

  if (parts.length === 0) { alert("Selecione pelo menos um dado para rolar!"); return; }

  const formula = parts.join("+");
  const label   = `Conflito${_activeConflito ? ': ' + _activeConflito.nome : ''}`;

  const customFormulaInput = document.getElementById("dice-custom-formula");
  if (customFormulaInput) customFormulaInput.value = formula;

  const handler = (e) => {
    document.removeEventListener("roll-added", handler);
    const entry = e.detail;
    const rollData = {
      formula: entry.formula || formula,
      label,
      timestamp: Date.now(),
      results: entry.results.map(r => ({ sides: r.sides, value: r.value, symbols: r.symbols })),
      keptDiceIndexes: [...(entry.keptDiceIndexes || [])]
    };
    addOwnRollToFeed(rollData);
    const pm = getPeerManager();
    if (pm) {
      pm.broadcast({
        type: "roll",
        playerId: pm.playerId,
        data: rollData
      });
    }
  };

  document.addEventListener("roll-added", handler);
  executeCustomRoll();
}

// ── Gerenciamento de Visibilidade das Fichas (Mestre) ───────────────────────

function _initFichasVisibility() {
  const btn = document.getElementById("btn-manage-fichas-visibility");
  const modal = document.getElementById("modal-fichas-visibility");
  const closeBtn = document.getElementById("btn-close-fichas-visibility");

  if (!btn || !modal) return;

  btn.addEventListener("click", () => {
    _renderFichasVisibilityList();
    modal.classList.remove("hidden");
  });

  closeBtn?.addEventListener("click", () => modal.classList.add("hidden"));

  // Fechar ao clicar no overlay
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });
}

function _renderFichasVisibilityList() {
  const container = document.getElementById("fichas-visibility-list");
  if (!container) return;
  container.innerHTML = "";

  // 1. Jogadores Conectados
  _lastPlayersList.forEach(p => {
    const isHidden = _hiddenFichaIds.has(p.id);
    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.justifyContent = "space-between";
    item.style.padding = "6px 8px";
    item.style.background = "rgba(255,255,255,0.05)";
    item.style.borderRadius = "4px";

    item.innerHTML = `
      <span style="font-size: 13px; font-weight: 500;">👤 ${esc(p.name)} (Jogador)</span>
      <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
        <input type="checkbox" class="visibility-checkbox" data-id="${p.id}" ${isHidden ? "checked" : ""}>
        <span style="font-size: 11px; color: ${isHidden ? "#ff5555" : "#55ff55"}; font-weight: bold;">${isHidden ? "Oculto" : "Visível"}</span>
      </label>
    `;

    item.querySelector(".visibility-checkbox").addEventListener("change", (e) => {
      const checked = e.target.checked;
      if (checked) {
        _hiddenFichaIds.add(p.id);
      } else {
        _hiddenFichaIds.delete(p.id);
      }
      const span = e.target.nextElementSibling;
      if (span) {
        span.textContent = checked ? "Oculto" : "Visível";
        span.style.color = checked ? "#ff5555" : "#55ff55";
      }
      _applyFichasVisibility();
      broadcastFichasVisibility();
    });

    container.appendChild(item);
  });

  // 2. Fichas Extras do Mestre
  _extraFichas.forEach(entry => {
    const isHidden = _hiddenFichaIds.has(entry.id);
    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.justifyContent = "space-between";
    item.style.padding = "6px 8px";
    item.style.background = "rgba(255,255,255,0.05)";
    item.style.borderRadius = "4px";

    item.innerHTML = `
      <span style="font-size: 13px; font-weight: 500;">📋 ${esc(entry.char.name)} (Ficha Mestre)</span>
      <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
        <input type="checkbox" class="visibility-checkbox" data-id="${entry.id}" ${isHidden ? "checked" : ""}>
        <span style="font-size: 11px; color: ${isHidden ? "#ff5555" : "#55ff55"}; font-weight: bold;">${isHidden ? "Oculto" : "Visível"}</span>
      </label>
    `;

    item.querySelector(".visibility-checkbox").addEventListener("change", (e) => {
      const checked = e.target.checked;
      if (checked) {
        _hiddenFichaIds.add(entry.id);
      } else {
        _hiddenFichaIds.delete(entry.id);
      }
      const span = e.target.nextElementSibling;
      if (span) {
        span.textContent = checked ? "Oculto" : "Visível";
        span.style.color = checked ? "#ff5555" : "#55ff55";
      }
      _applyFichasVisibility();
      broadcastFichasVisibility();
    });

    container.appendChild(item);
  });

  if (_lastPlayersList.length === 0 && _extraFichas.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:16px; color:var(--color-text-muted); font-size:12px;">Nenhuma ficha disponível na mesa no momento.</div>`;
  }
}

function _applyFichasVisibility() {
  // Aplicar em Jogadores
  document.querySelectorAll("#table-player-list .table-player-item").forEach(item => {
    const playerId = item.dataset.playerId;
    if (_hiddenFichaIds.has(playerId)) {
      item.classList.add("hidden-ficha");
    } else {
      item.classList.remove("hidden-ficha");
    }
  });

  // Aplicar em Fichas Extras
  document.querySelectorAll("#table-player-list .extra-ficha-item").forEach(item => {
    const extraId = item.dataset.extraId;
    if (_hiddenFichaIds.has(extraId)) {
      item.classList.add("hidden-ficha");
    } else {
      item.classList.remove("hidden-ficha");
    }
  });
}

function broadcastFichasVisibility() {
  if (peerManager && peerManager.isHost) {
    peerManager.broadcast({
      type: "fichas_visibility",
      playerId: peerManager.playerId,
      data: {
        hiddenIds: Array.from(_hiddenFichaIds)
      }
    });
  }
}

// ==========================================
// CAMPAIGN SCREEN UI HANDLERS & LIFECYCLE
// ==========================================

export function showCampaignScreen(campaignData) {
  activeCampanha = campaignData;
  state.activeCampaignId = campaignData.id;

  // Sincronizar em tempo real com Firestore
  if (_campanhaUnsub) _campanhaUnsub();
  escutarCampanha(campaignData.id, (updatedMesa) => {
    activeCampanha = updatedMesa;
    _renderCampaignDashboard();
  }).then(unsub => {
    _campanhaUnsub = unsub;
  });

  // Trocar telas
  document.getElementById("landing-screen")?.classList.add("hidden");
  document.getElementById("table-screen")?.classList.add("hidden");
  document.getElementById("campaign-screen")?.classList.remove("hidden");
  
  _initCampaignListeners();
  _renderCampaignDashboard();
}

function hideCampaignScreen() {
  if (_campanhaUnsub) {
    _campanhaUnsub();
    _campanhaUnsub = null;
  }
  activeCampanha = null;
  state.activeCampaignId = null;
  document.getElementById("campaign-screen")?.classList.add("hidden");
  document.getElementById("landing-screen")?.classList.remove("hidden");
}

let _campaignListenersInitialized = false;
function _initCampaignListeners() {
  if (_campaignListenersInitialized) return;
  _campaignListenersInitialized = true;

  // Sub-abas da Campanha
  const tabBtns = document.querySelectorAll(".campaign-tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const targetPanel = btn.dataset.tab;
      document.querySelectorAll(".campaign-tab-panel").forEach(p => p.classList.remove("active"));
      document.getElementById(targetPanel)?.classList.add("active");
    });
  });

  // Botão Voltar ao Início
  document.getElementById("btn-camp-leave")?.addEventListener("click", hideCampaignScreen);

  // Compartilhar Ficha
  document.getElementById("btn-camp-share-char")?.addEventListener("click", async () => {
    const sel = document.getElementById("camp-share-char-select");
    const charId = sel.value;
    if (!charId) { alert("Selecione uma ficha!"); return; }
    const char = state.characters.find(c => c.id === charId);
    if (char) {
      const playerName = localStorage.getItem("assimilação_player_name_" + activeCampanha.id) || state.currentUser?.displayName || "Jogador";
      await compartilharFicha(activeCampanha.id, char, state.currentUser?.uid || "player", playerName);
      alert(`Ficha de "${char.name}" compartilhada com sucesso!`);
    }
  });

  // Criar Nota
  document.getElementById("btn-camp-add-note")?.addEventListener("click", async () => {
    const titleInput = document.getElementById("camp-note-title-input");
    const contentInput = document.getElementById("camp-note-content-input");
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (!title || !content) { alert("Preencha o título e o conteúdo da nota!"); return; }
    
    const author = (activeCampanha.mestreId === state.currentUser?.uid) 
      ? activeCampanha.mestreNome 
      : (localStorage.getItem("assimilação_player_name_" + activeCampanha.id) || "Jogador");
      
    await adicionarNota(activeCampanha.id, title, content, author);
    titleInput.value = "";
    contentInput.value = "";
  });

  // Agendar Evento
  document.getElementById("btn-camp-add-event")?.addEventListener("click", async () => {
    const titleInput = document.getElementById("camp-event-title-input");
    const dateInput = document.getElementById("camp-event-date-input");
    const descInput = document.getElementById("camp-event-desc-input");
    const title = titleInput.value.trim();
    const date = dateInput.value.trim();
    const desc = descInput.value.trim();
    if (!title) { alert("Preencha o título do evento!"); return; }
    
    await adicionarEvento(activeCampanha.id, title, desc, date);
    titleInput.value = "";
    dateInput.value = "";
    descInput.value = "";
  });

  // Registrar Crônica / História
  document.getElementById("btn-camp-add-chronicle")?.addEventListener("click", async () => {
    const input = document.getElementById("camp-chronicle-input");
    const text = input.value.trim();
    if (!text) return;
    
    const author = (activeCampanha.mestreId === state.currentUser?.uid) 
      ? activeCampanha.mestreNome 
      : (localStorage.getItem("assimilação_player_name_" + activeCampanha.id) || "Jogador");
      
    await adicionarHistoria(activeCampanha.id, text, author);
    input.value = "";
  });
  
  // Registrar Crônica pressionando Enter
  document.getElementById("camp-chronicle-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      document.getElementById("btn-camp-add-chronicle")?.click();
    }
  });

  // Botão primário do cabeçalho da campanha (Iniciar / Entrar na Sessão)
  document.getElementById("btn-camp-session-action")?.addEventListener("click", () => {
    _handleSessionAction();
  });

  // Fechar Visualizador de Ficha
  document.getElementById("btn-close-ficha-viewer")?.addEventListener("click", () => {
    document.getElementById("modal-ficha-viewer")?.classList.add("hidden");
  });
  
  document.getElementById("modal-ficha-viewer")?.addEventListener("click", (e) => {
    if (e.target.id === "modal-ficha-viewer") {
      document.getElementById("modal-ficha-viewer")?.classList.add("hidden");
    }
  });
}

function _renderCampaignDashboard() {
  if (!activeCampanha) return;

  // Atualizar Header
  document.getElementById("camp-title").textContent = activeCampanha.nome;
  document.getElementById("camp-gm-name").textContent = activeCampanha.mestreNome;
  document.getElementById("camp-code-display").textContent = "CÓDIGO: " + activeCampanha.id;

  const isMestre = activeCampanha.mestreId === state.currentUser?.uid;
  
  // Status da sessão e botão do cabeçalho
  const statusIndicator = document.getElementById("camp-session-status");
  const actionBtn = document.getElementById("btn-camp-session-action");
  
  if (activeCampanha.sessaoAtiva) {
    statusIndicator.className = "session-status-indicator active";
    statusIndicator.querySelector(".status-text").textContent = "Sessão Ativa";
    actionBtn.textContent = isMestre ? "Retornar à Mesa" : "Entrar na Sessão";
    actionBtn.disabled = false;
  } else {
    statusIndicator.className = "session-status-indicator inactive";
    statusIndicator.querySelector(".status-text").textContent = "Sessão Inativa";
    actionBtn.textContent = isMestre ? "Iniciar Sessão" : "Aguardando Mestre";
    actionBtn.disabled = !isMestre; // Jogadores não podem clicar se inativa
  }

  // Ocultar formulário de eventos para jogadores
  const eventForm = document.getElementById("camp-event-form");
  if (eventForm) {
    if (isMestre) {
      eventForm.classList.remove("hidden");
    } else {
      eventForm.classList.add("hidden");
    }
  }

  // Preencher dropdown de compartilhamento de fichas
  const shareSelect = document.getElementById("camp-share-char-select");
  if (shareSelect) {
    const currentVal = shareSelect.value;
    shareSelect.innerHTML = '<option value="">-- Selecione uma Ficha --</option>';
    (state.characters || []).forEach(char => {
      const opt = document.createElement("option");
      opt.value = char.id;
      opt.textContent = char.name;
      shareSelect.appendChild(opt);
    });
    shareSelect.value = currentVal;
  }

  // Renderizar sub-seções
  _renderCampaignFichas();
  _renderCampaignNotas();
  _renderCampaignEventos();
  _renderCampaignHistoria();
}

function _renderCampaignFichas() {
  const grid = document.getElementById("camp-fichas-grid");
  if (!grid) return;

  const fichas = Object.values(activeCampanha.fichas || {});
  if (fichas.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:32px; color:var(--text-muted);">Nenhuma ficha compartilhada nesta mesa ainda.</div>';
    return;
  }

  const isMestre = activeCampanha.mestreId === state.currentUser?.uid;

  grid.innerHTML = fichas.map(item => {
    const portrait = item.data?.portrait || item.data?.imagem || "";
    const avatarHtml = portrait 
      ? `<img src="${esc(portrait)}" alt="">`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;

    const isOwner = item.donoId === state.currentUser?.uid;
    const canDelete = isMestre || isOwner;
    const deleteBtn = canDelete 
      ? `<div class="ficha-camp-actions">
           <button class="btn-remove-ficha-camp" data-id="${esc(item.id)}" title="Remover da Mesa">✕</button>
         </div>`
      : "";

    const typeLabels = {
      infectado: "🧬 Infectado",
      refugio: "🏕️ Refúgio",
      regiao: "🗺️ Região",
      conflito: "⚔️ Conflito",
      local: "📍 Local"
    };

    return `
      <div class="ficha-camp-card" data-id="${esc(item.id)}">
        <div class="ficha-camp-avatar">${avatarHtml}</div>
        <div class="ficha-camp-name">${esc(item.nome)}</div>
        <div class="ficha-camp-type">${esc(typeLabels[item.tipo] || item.tipo)}</div>
        <div class="ficha-camp-owner">Dono: ${esc(item.donoNome)}</div>
        ${deleteBtn}
      </div>
    `;
  }).join("");

  // Adicionar click listener nos cards para abrir o visualizador de ficha
  grid.querySelectorAll(".ficha-camp-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".btn-remove-ficha-camp")) return;
      const id = card.dataset.id;
      const targetFicha = activeCampanha.fichas[id];
      if (targetFicha) {
        _openSharedFichaViewer(targetFicha);
      }
    });
  });

  // Click listener para excluir
  grid.querySelectorAll(".btn-remove-ficha-camp").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (confirm("Deseja mesmo remover esta ficha da mesa?")) {
        await removerFichaCompartilhada(activeCampanha.id, id);
      }
    });
  });
}

function _renderCampaignNotas() {
  const list = document.getElementById("camp-notes-list");
  if (!list) return;

  const notas = [...(activeCampanha.notas || [])].sort((a, b) => b.timestamp - a.timestamp);
  if (notas.length === 0) {
    list.innerHTML = '<div style="text-align:center; padding:16px; color:var(--text-muted);">Nenhuma nota cadastrada.</div>';
    return;
  }

  const isMestre = activeCampanha.mestreId === state.currentUser?.uid;

  list.innerHTML = notas.map(note => {
    const timeStr = new Date(note.timestamp).toLocaleString();
    const canDelete = isMestre || note.autor === state.currentUser?.displayName;
    const deleteBtn = canDelete 
      ? `<button class="btn btn-sm btn-danger-dropdown btn-remove-note" data-id="${esc(note.id)}" style="position:absolute; top:12px; right:12px; padding:2px 6px; font-size:10px;">✕</button>` 
      : "";

    return `
      <div class="note-card-camp">
        <div class="note-header-camp">
          <span class="note-title-camp">${esc(note.titulo)}</span>
        </div>
        <div class="note-content-camp">${esc(note.conteudo)}</div>
        <div class="note-meta-camp">
          <span>Autor: <strong>${esc(note.autor)}</strong></span>
          <span>•</span>
          <span>${esc(timeStr)}</span>
        </div>
        ${deleteBtn}
      </div>
    `;
  }).join("");

  list.querySelectorAll(".btn-remove-note").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("Remover esta nota?")) {
        await removerNota(activeCampanha.id, id);
      }
    });
  });
}

function _renderCampaignEventos() {
  const list = document.getElementById("camp-events-list");
  if (!list) return;

  const eventos = [...(activeCampanha.eventos || [])].sort((a, b) => b.timestamp - a.timestamp);
  if (eventos.length === 0) {
    list.innerHTML = '<div style="text-align:center; padding:16px; color:var(--text-muted);">Nenhum evento registrado.</div>';
    return;
  }

  const isMestre = activeCampanha.mestreId === state.currentUser?.uid;

  list.innerHTML = eventos.map(evt => {
    const statusLabel = evt.status === "ativo" ? "Ativo" : "Resolvido";
    const statusClass = evt.status === "ativo" ? "active" : "resolved";
    
    // Controles para o Mestre
    const mestreControls = isMestre 
      ? `<div style="display:flex; gap:6px;">
           <button class="btn btn-sm btn-toggle-event" data-id="${esc(evt.id)}" data-status="${evt.status}">${evt.status === 'ativo' ? 'Resolver' : 'Reativar'}</button>
           <button class="btn btn-sm btn-remove-event" data-id="${esc(evt.id)}" style="border-color:var(--color-rust);color:var(--color-rust-glow);">Excluir</button>
         </div>`
      : "";

    return `
      <div class="event-card-camp">
        <div class="event-details-camp">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="event-title-camp">${esc(evt.titulo)}</span>
            <span class="event-status-badge ${statusClass}">${statusLabel}</span>
          </div>
          <div class="event-desc-camp">${esc(evt.descricao || "Sem descrição.")}</div>
          <div style="font-size:var(--font-size-xs); color:var(--color-gold-glow); margin-top:2px;">
            Cronograma: <strong>${esc(evt.dataHora || "Indefinido")}</strong>
          </div>
        </div>
        ${mestreControls}
      </div>
    `;
  }).join("");

  list.querySelectorAll(".btn-toggle-event").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const status = btn.dataset.status;
      const nextStatus = status === "ativo" ? "resolvido" : "ativo";
      await alterarStatusEvento(activeCampanha.id, id, nextStatus);
    });
  });

  list.querySelectorAll(".btn-remove-event").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("Excluir este evento?")) {
        await removerEvento(activeCampanha.id, id);
      }
    });
  });
}

function _renderCampaignHistoria() {
  const feed = document.getElementById("camp-chronicle-feed");
  if (!feed) return;

  const entradas = [...(activeCampanha.historia || [])].sort((a, b) => a.timestamp - b.timestamp);
  if (entradas.length === 0) {
    feed.innerHTML = '<div style="text-align:center; padding:16px; color:var(--text-muted);">A crônica está vazia. Comece a registrar a história!</div>';
    return;
  }

  const isMestre = activeCampanha.mestreId === state.currentUser?.uid;

  feed.innerHTML = entradas.map(entry => {
    const dateStr = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const deleteBtn = isMestre 
      ? `<button class="btn-remove-hist" data-id="${esc(entry.id)}" style="background:none;border:none;color:var(--color-rust-glow);cursor:pointer;font-size:10px;margin-left:8px;">Excluir</button>`
      : "";
    return `
      <div class="chronicle-entry">
        <div class="chronicle-text">${esc(entry.texto)}</div>
        <div class="chronicle-meta">
          Por <strong>${esc(entry.autor)}</strong> às ${esc(dateStr)} ${deleteBtn}
        </div>
      </div>
    `;
  }).join("");

  feed.scrollTop = feed.scrollHeight; // Auto-scroll to bottom

  feed.querySelectorAll(".btn-remove-hist").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      await removerHistoria(activeCampanha.id, id);
    });
  });
}

async function _handleSessionAction() {
  const isMestre = activeCampanha.mestreId === state.currentUser?.uid;
  const playerName = localStorage.getItem("assimilação_player_name_" + activeCampanha.id) || state.currentUser?.displayName || "Jogador";
  
  if (isMestre) {
    if (!activeCampanha.sessaoAtiva) {
      await atualizarSessaoAtiva(activeCampanha.id, true);
    }
    await _startWebRTCSession(activeCampanha.id, activeCampanha.mestreNome, true);
  } else {
    if (activeCampanha.sessaoAtiva) {
      await _startWebRTCSession(activeCampanha.id, playerName, false);
    } else {
      alert("A sessão de jogo não foi iniciada pelo Mestre!");
    }
  }
}

async function _startWebRTCSession(campaignId, playerName, isHost) {
  try {
    const pm = new PeerManager(handleMessage);
    pm.onPeerConnected = () => {
      broadcastCharacterState();
      if (_currentMapDataUrl) peerManager?.broadcast({ type: "map", playerId: pm.playerId, data: { imageDataUrl: _currentMapDataUrl } });
      if (pm.isHost) {
        broadcastMusicState();
        broadcastFichasVisibility();
      }
    };
    peerManager = pm;
    
    if (isHost) {
      roomCode = await pm.createRoom(playerName, campaignId);
    } else {
      roomCode = campaignId;
      await pm.joinRoom(campaignId, playerName);
    }

    updatePlayerControlsUI();
    document.body.classList.toggle("is-mesa-host", pm.isHost || false);
    document.getElementById("table-room-code-badge").textContent = "Sala: " + roomCode;
    
    // Esconder tela de campanha e mostrar mesa de jogo
    document.getElementById("campaign-screen")?.classList.add("hidden");
    showTableScreen();
    
    updatePlayerList([]);
    _updateLocalPlayerState();
    _applyCachedStates();
    
    logger.info("Conectado à sessão da mesa: " + roomCode);
  } catch (e) {
    alert("Erro ao conectar à sessão: " + e.message);
  }
}

function _openSharedFichaViewer(fichaObj) {
  const modal = document.getElementById("modal-ficha-viewer");
  const title = document.getElementById("ficha-viewer-title");
  const body = document.getElementById("ficha-viewer-body");
  if (!modal || !body) return;

  title.textContent = `Visualizando Ficha: ${fichaObj.nome}`;
  
  const char = fichaObj.data;
  
  // Calcular pontos de vida
  const maxPts = 1 + (char.instintos?.Potência || 0) + (char.instintos?.Resolução || 0);
  const totalMax = 6 * maxPts;
  let totalCurrent = 0;
  for (let lvl = 1; lvl <= 6; lvl++) totalCurrent += maxPts - (char.dano?.[lvl] || 0);

  // Renderizar características
  const traits = char.traits || [];
  const traitsHtml = traits.length > 0 
    ? traits.map(t => `<div class="lib-item-viewer"><div class="lib-item-title">${esc(t.name)}</div><div class="lib-item-desc">${esc(t.effect)}</div></div>`).join("")
    : '<div style="color:var(--text-muted); font-size:12px;">Nenhuma característica.</div>';

  // Renderizar mutações / assimilações
  const mutations = char.mutations || [];
  const mutationsHtml = mutations.length > 0 
    ? mutations.map(m => `<div class="lib-item-viewer"><div class="lib-item-title">${esc(m.name)} (Nível ${m.level || 1})</div><div class="lib-item-desc">${esc(m.desc)}</div></div>`).join("")
    : '<div style="color:var(--text-muted); font-size:12px;">Nenhuma mutação/assimilação.</div>';

  // Renderizar inventário
  const slots = char.inventory || {};
  const slotsHtml = Object.values(slots).length > 0
    ? Object.values(slots).map(s => s.name ? `<div class="lib-item-viewer"><div class="lib-item-title">${esc(s.name)}</div><div class="lib-item-desc">Qtde: ${s.qty || 1} • Tipo: ${s.type || "Geral"}</div></div>` : "").join("")
    : '<div style="color:var(--text-muted); font-size:12px;">Inventário vazio.</div>';

  body.innerHTML = `
    <div class="ficha-viewer-grid">
      <!-- Coluna Esquerda: Dados Básicos e Atributos -->
      <div class="ficha-viewer-block">
        <div class="ficha-viewer-block-title">Identidade</div>
        <div class="ficha-viewer-stat-row">
          <span class="ficha-viewer-stat-name">Ocupação</span>
          <span class="ficha-viewer-stat-value">${esc(char.ocupacao || "Nenhuma")}</span>
        </div>
        <div class="ficha-viewer-stat-row">
          <span class="ficha-viewer-stat-name">Geração</span>
          <span class="ficha-viewer-stat-value">${esc(char.generation || "Indefinida")}</span>
        </div>
        <div class="ficha-viewer-stat-row">
          <span class="ficha-viewer-stat-name">Evento de Infecção</span>
          <span class="ficha-viewer-stat-value">${esc(char.evento || "Desconhecido")}</span>
        </div>
        
        <div class="ficha-viewer-block-title" style="margin-top:16px;">Atributos Básicos</div>
        <div class="ficha-viewer-stat-row">
          <span class="ficha-viewer-stat-name">Determinação</span>
          <span class="ficha-viewer-stat-value">${char.detPoints || 0} / ${char.detNivel || 1}</span>
        </div>
        <div class="ficha-viewer-stat-row">
          <span class="ficha-viewer-stat-name">Assimilação</span>
          <span class="ficha-viewer-stat-value">${char.assPoints || 0} / ${char.assNivel || 0}</span>
        </div>
        <div class="ficha-viewer-stat-row">
          <span class="ficha-viewer-stat-name">Saúde Total</span>
          <span class="ficha-viewer-stat-value">${totalCurrent} / ${totalMax}</span>
        </div>
        
        <div class="ficha-viewer-block-title" style="margin-top:16px;">Aptidões (Instintos)</div>
        <div class="ficha-viewer-aptitudes-grid">
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Influência</span><span class="ficha-viewer-stat-value">${char.instintos?.Influência || 0}</span></div>
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Percepção</span><span class="ficha-viewer-stat-value">${char.instintos?.Percepção || 0}</span></div>
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Potência</span><span class="ficha-viewer-stat-value">${char.instintos?.Potência || 0}</span></div>
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Reação</span><span class="ficha-viewer-stat-value">${char.instintos?.Reação || 0}</span></div>
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Resolução</span><span class="ficha-viewer-stat-value">${char.instintos?.Resolução || 0}</span></div>
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Sagacidade</span><span class="ficha-viewer-stat-value">${char.instintos?.Sagacidade || 0}</span></div>
        </div>
        
        <div class="ficha-viewer-block-title" style="margin-top:16px;">Aptidões (Conhecimentos)</div>
        <div class="ficha-viewer-aptitudes-grid">
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Biologia</span><span class="ficha-viewer-stat-value">${char.conhecimentos?.Biologia || 0}</span></div>
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Engenharia</span><span class="ficha-viewer-stat-value">${char.conhecimentos?.Engenharia || 0}</span></div>
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Erudição</span><span class="ficha-viewer-stat-value">${char.conhecimentos?.Erudição || 0}</span></div>
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Geografia</span><span class="ficha-viewer-stat-value">${char.conhecimentos?.Geografia || 0}</span></div>
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Medicina</span><span class="ficha-viewer-stat-value">${char.conhecimentos?.Medicina || 0}</span></div>
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Segurança</span><span class="ficha-viewer-stat-value">${char.conhecimentos?.Segurança || 0}</span></div>
        </div>
        
        <div class="ficha-viewer-block-title" style="margin-top:16px;">Aptidões (Práticas)</div>
        <div class="ficha-viewer-aptitudes-grid">
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Armas</span><span class="ficha-viewer-stat-value">${char.praticas?.Armas || 0}</span></div>
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Atletismo</span><span class="ficha-viewer-stat-value">${char.praticas?.Atletismo || 0}</span></div>
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Expressão</span><span class="ficha-viewer-stat-value">${char.praticas?.Expressão || 0}</span></div>
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Furtividade</span><span class="ficha-viewer-stat-value">${char.praticas?.Furtividade || 0}</span></div>
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Manufaturas</span><span class="ficha-viewer-stat-value">${char.praticas?.Manufaturas || 0}</span></div>
          <div class="ficha-viewer-stat-row" style="margin-bottom: 0;"><span class="ficha-viewer-stat-name">Sobrevivência</span><span class="ficha-viewer-stat-value">${char.praticas?.Sobrevivência || 0}</span></div>
        </div>
      </div>
      
      <!-- Coluna Direita: Características, Assimilações e Inventário -->
      <div class="ficha-viewer-block">
        <div class="ficha-viewer-block-title">Características</div>
        <div class="lib-list-viewer">${traitsHtml}</div>
        
        <div class="ficha-viewer-block-title" style="margin-top:16px;">Mutações & Assimilações</div>
        <div class="lib-list-viewer">${mutationsHtml}</div>
        
        <div class="ficha-viewer-block-title" style="margin-top:16px;">Inventário</div>
        <div class="lib-list-viewer">${slotsHtml}</div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
}

// Helper extra para entrar em campanha a partir do card na Landing
export async function _enterCampaign(code) {
  try {
    const { entrarCampanha } = await import("./campanha.js");
    const data = await entrarCampanha(code);
    
    // Garantir registro no localStorage de campanhas se não existir
    const raw = localStorage.getItem("assimilação_managed_campaigns");
    let list = raw ? JSON.parse(raw) : [];
    if (!list.some(c => c.code === data.id)) {
      list.push({ code: data.id, hostName: data.mestreNome, name: data.nome, createdAt: Date.now() });
      localStorage.setItem("assimilação_managed_campaigns", JSON.stringify(list));
    }
    
    const { showCampaignScreen } = await import("./mesa-ui.js");
    showCampaignScreen(data);
  } catch (e) {
    alert("Erro ao acessar campanha: " + e.message);
  }
}
