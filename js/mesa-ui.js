import { PeerManager } from "./mesa.js";
import { state, saveCurrentCharacter, loadCharacter } from "./state.js";
import { esc } from "./screen-utils.js";
import { logger } from "./logger.js";
import { DICE_MAP } from "./roller.js";
import { getDieSymbolsHtml, getDieFaceImgSrc } from "./chat.js";
import { ICONS } from "../icons.js";
import { getCurrentHealthLevel } from "./health.js";

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

  document.getElementById("room-char-select")?.addEventListener("change", () => _onCharSelect("room-char-select", "room-player-name"));
  document.getElementById("room-char-select-join")?.addEventListener("change", () => _onCharSelect("room-char-select-join", "room-player-name-join"));

  document.getElementById("btn-create-room")?.addEventListener("click", async () => {
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
      };
      peerManager = pm;
      roomCode = await pm.createRoom(playerName);
      document.getElementById("room-code-display").textContent = roomCode;
      document.getElementById("table-room-code-badge").textContent = "Sala: " + roomCode;
      document.getElementById("room-step-create").classList.add("hidden");
      document.getElementById("room-step-waiting").classList.remove("hidden");
      showTableScreen();
      updatePlayerList([{ id: pm.playerId, name: playerName }]);
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
      };
      peerManager = pm;
      roomCode = code;
      await pm.joinRoom(code, playerName);
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

  document.getElementById("btn-copy-room-code")?.addEventListener("click", () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
  });

  document.getElementById("btn-leave-table")?.addEventListener("click", async () => {
    // "Sair" desconecta de verdade
    if (broadcastInterval) { clearInterval(broadcastInterval); broadcastInterval = null; }
    if (peerManager) {
      await peerManager.leave();
      peerManager = null;
    }
    roomCode = "";
    _playerStateCache = {};
    _currentMapDataUrl = null;
    previousScreen = null;
    isOnTableScreen = false;
    delete document.body.dataset.mesaVisited;
    resetMapDisplay();
    _updateFloatingButton();
    hideTableScreen();
    closeRoomModal();
    document.getElementById("room-step-create").classList.remove("hidden");
    document.getElementById("room-step-waiting").classList.add("hidden");
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

  // Limpar feed de rolagens
  document.getElementById("btn-clear-roll-feed")?.addEventListener("click", () => {
    if (rollFeedEl) {
      rollFeedEl.innerHTML = "";
      _totalRollCount = 0;
      const countEl = document.getElementById("table-roll-count");
      if (countEl) countEl.textContent = "0";
    }
  });
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
    case "map":
      if (data.data?.imageDataUrl) {
        setMapImage(data.data.imageDataUrl);
      }
      break;
    case "_room_update":
      if (data.players) {
        const list = Object.entries(data.players).map(([id, p]) => ({ id, name: p.name }));
        const knownIds = new Set(Object.keys(_playerStateCache));
        knownIds.add(peerManager?.playerId);
        const hasNewPlayer = list.some(p => !knownIds.has(p.id));
        console.log("[MESA] _room_update players=" + list.map(p=>p.id).join(",") + " hasNew=" + hasNewPlayer + " cache=" + Object.keys(_playerStateCache).join(","));
        updatePlayerList(list);
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
      det: { atual: char.detPoints || 0, max: char.detNivel || 1 }
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
    const isMe = p.id === peerManager?.playerId;
    return `<div class="table-player-item ${isMe ? 'is-me' : ''}" data-player-id="${p.id}">
      <div class="table-player-portrait" id="portrait-${p.id}"></div>
      <div class="table-player-stats">
        <span class="table-player-name">${esc(p.name)} ${isMe ? '(Você)' : ''}</span>
        <div class="stat-det" id="det-${p.id}">Det: --/--</div>
        <div class="stat-saude" id="saude-${p.id}">Vida: --/--</div>
      </div>
    </div>`;
  }).join("");
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
  if (portraitEl && char.portrait) portraitEl.innerHTML = `<img src="${char.portrait}" class="table-mini-portrait" alt="${esc(char.name)}">`;
  else if (portraitEl) portraitEl.innerHTML = `<div class="table-mini-portrait-placeholder">${esc(char.name?.[0] || '?')}</div>`;
}

function _applyCachedStates() {
  console.log("[MESA] _applyCachedStates", Object.keys(_playerStateCache));
  for (const pid of Object.keys(_playerStateCache)) {
    const cached = _playerStateCache[pid];
    const detEl = document.getElementById("det-" + pid);
    const saudeEl = document.getElementById("saude-" + pid);
    const portraitEl = document.getElementById("portrait-" + pid);
    console.log("[MESA] _applyCachedStates pid=" + pid + " detEl=" + !!detEl + " saudeEl=" + !!saudeEl + " det=", cached.det);
    if (detEl && cached.det) detEl.innerHTML = `<span class="det-value">Determinação:${cached.det.atual}/${cached.det.max}</span>`;
    if (saudeEl && cached.saude) saudeEl.innerHTML = _renderHealthLevelsHTML(cached.saude);
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
  const portraitEl = document.getElementById("portrait-" + playerId);
  console.log("[MESA] updatePlayerState found detEl=" + !!detEl + " saudeEl=" + !!saudeEl);
  if (detEl && data.det) detEl.innerHTML = `<span class="det-value">Determinação:${data.det.atual}/${data.det.max}</span>`;
  if (saudeEl && data.saude) saudeEl.innerHTML = _renderHealthLevelsHTML(data.saude);
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

  if (Array.isArray(data.data?.results) && data.data.results.length > 0) {
    const keptIndexes = Array.isArray(data.data?.keptDiceIndexes) ? data.data.keptDiceIndexes : [];
    const diceHtml = data.data.results.map((r, idx) => {
      const dKey = `d${r.sides}`;
      // Prefere symbols transmitidos; fallback para DICE_MAP local
      const symbols = (Array.isArray(r.symbols) && r.symbols.length >= 0)
        ? r.symbols
        : (DICE_MAP[dKey]?.[r.value] ?? []);

      const isKept = keptIndexes.includes(idx);

      if (isKept) totalSucessos += symbols.filter(s => s === "A").length;

      const imgSrc = getDieFaceImgSrc(r.sides, r.value);
      const faceHtml = imgSrc
        ? `<img src="${imgSrc}" class="feed-die-face" alt="d${r.sides}:${r.value}" title="d${r.sides} = ${r.value}">`
        : `<span class="roll-die die-d${r.sides}" title="d${r.sides}">${r.value ?? "?"}</span>`;

      const symHtml = r.sides !== 10 ? getDieSymbolsHtml(symbols) : null;

      const keptClass = isKept ? ' kept' : '';
      return `<div class="feed-die-card die-d${r.sides}${keptClass}">${faceHtml}</div>`;
    }).join("");

    const sucessosBadge = totalSucessos > 0
      ? `<span class="feed-roll-sucessos" title="Sucessos">${totalSucessos} <small>suces.</small></span>`
      : `<span class="feed-roll-fracasso">Fracasso</span>`;

    resultsHtml = `<div class="roll-dice-row">${diceHtml}</div><div class="roll-result-summary">${sucessosBadge}</div>`;
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
  } else {
    document.getElementById("table-map-controls")?.classList.add("hidden");
  }
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
