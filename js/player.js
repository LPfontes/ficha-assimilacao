import { logger } from "./logger.js";
import { getPeerManager } from "./mesa-ui.js";

const audio = new Audio();
audio.preload = "none";
let playlist = [];
let currentIndex = -1;
let isPlaying = false;
let volume = parseFloat(localStorage.getItem("player_volume")) || 0.8;
let shuffle = false;
let repeat = "none";
let shuffleOrder = [];
let shuffleIndex = -1;

let syncInterval = null;
let autoplayBlocked = false;

const dom = {};

export function initPlayer() {
  cacheDom();
  setupAudioEvents();
  setupControls();
  setupKeyboardShortcut();
  loadPlaylist();
  updatePlayerControlsUI();
}

function cacheDom() {
  const ids = [
    "mini-player", "player-track-name", "player-btn-play", "player-play-icon",
    "player-btn-prev", "player-btn-next", "player-btn-shuffle", "player-shuffle-icon",
    "player-btn-repeat", "player-repeat-icon", "player-progress", "player-progress-fill",
    "player-time-current", "player-time-total", "player-btn-volume", "player-volume-icon",
    "player-volume-slider", "player-btn-expand",
    "player-track-art"
  ];
  ids.forEach(id => { dom[id] = document.getElementById(id); });
}

async function loadPlaylist() {
  try {
    const res = await fetch("music/manifest.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    playlist = await res.json();
    logger.info(`Player: ${playlist.length} faixas carregadas.`);
    restoreState();
  } catch (e) {
    logger.error("Player: Erro ao carregar manifest.json", e);
    if (dom["player-track-name"]) {
      dom["player-track-name"].textContent = "Sem músicas disponíveis";
    }
  }
}

function setupAudioEvents() {
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("loadedmetadata", updateDuration);
  audio.addEventListener("play", () => {
    isPlaying = true;
    updatePlayButton();
    const pm = getPeerManager();
    if (pm && pm.isHost) {
      broadcastMusicEvent("play");
      startPeriodicSync();
    }
  });
  audio.addEventListener("pause", () => {
    isPlaying = false;
    updatePlayButton();
    saveState();
    const pm = getPeerManager();
    if (pm && pm.isHost) {
      broadcastMusicEvent("pause");
      stopPeriodicSync();
    }
  });
  audio.addEventListener("ended", onTrackEnd);
  audio.addEventListener("error", onAudioError);
  audio.volume = volume;
}

function setupControls() {
  dom["player-btn-play"]?.addEventListener("click", togglePlay);
  dom["player-btn-next"]?.addEventListener("click", nextTrack);
  dom["player-btn-prev"]?.addEventListener("click", prevTrack);
  dom["player-btn-shuffle"]?.addEventListener("click", toggleShuffle);
  dom["player-btn-repeat"]?.addEventListener("click", toggleRepeat);
  dom["player-btn-volume"]?.addEventListener("click", toggleMute);

  dom["player-volume-slider"]?.addEventListener("input", (e) => {
    volume = parseFloat(e.target.value);
    audio.volume = volume;
    localStorage.setItem("player_volume", volume);
    updateVolumeIcon();
  });

  dom["player-progress"]?.addEventListener("click", (e) => {
    const rect = dom["player-progress"].getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (audio.duration) {
      audio.currentTime = pct * audio.duration;
      const pm = getPeerManager();
      if (pm && pm.isHost) {
        broadcastMusicEvent("sync");
      }
    }
  });

  dom["player-btn-expand"]?.addEventListener("click", openExpandedPlayer);
  const trackInfoClick = document.getElementById("player-track-info-click");
  trackInfoClick?.addEventListener("click", openExpandedPlayer);
}


function setupKeyboardShortcut() {
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
    if (e.code === "Space" && e.target === document.body) {
      e.preventDefault();
      togglePlay();
    }
  });
}

function restoreState() {
  const savedIndex = parseInt(localStorage.getItem("player_current_index") || "-1", 10);
  const savedTime = parseFloat(localStorage.getItem("player_current_time") || "0");
  const savedShuffle = localStorage.getItem("player_shuffle") === "true";
  const savedRepeat = localStorage.getItem("player_repeat") || "none";

  shuffle = savedShuffle;
  repeat = savedRepeat;
  updateShuffleIcon();
  updateRepeatIcon();

  if (savedIndex >= 0 && savedIndex < playlist.length) {
    currentIndex = savedIndex;
    if (shuffle) buildShuffleOrder();
    loadTrack(currentIndex);
    if (savedTime > 0 && audio.duration) {
      audio.currentTime = Math.min(savedTime, audio.duration);
    }
    dom["mini-player"]?.classList.remove("hidden");
    updateMiniPlayer();
  }

  if (volume !== undefined) {
    audio.volume = volume;
    if (dom["player-volume-slider"]) dom["player-volume-slider"].value = volume;
    updateVolumeIcon();
  }
}

function saveState() {
  if (currentIndex >= 0) {
    localStorage.setItem("player_current_index", currentIndex);
    localStorage.setItem("player_current_time", audio.currentTime || 0);
  }
  localStorage.setItem("player_shuffle", shuffle);
  localStorage.setItem("player_repeat", repeat);
}

export function playTrack(index) {
  if (index < 0 || index >= playlist.length) return;
  currentIndex = index;
  if (shuffle) buildShuffleOrder();
  loadTrack(index);
  audio.play();
  dom["mini-player"]?.classList.remove("hidden");
  updateMiniPlayer();
  saveState();
}

function loadTrack(index) {
  const track = playlist[index];
  if (!track) return;
  audio.src = `music/${encodeURIComponent(track.file)}`;
  audio.load();
  updateMiniPlayer();
}

function togglePlay() {
  if (playlist.length === 0) return;
  if (currentIndex < 0) {
    playTrack(0);
    return;
  }
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
}

function nextTrack() {
  if (playlist.length === 0) return;
  let next;
  if (shuffle) {
    shuffleIndex++;
    if (shuffleIndex >= shuffleOrder.length) {
      if (repeat === "all") {
        buildShuffleOrder();
        shuffleIndex = 0;
      } else {
        return;
      }
    }
    next = shuffleOrder[shuffleIndex];
  } else {
    next = currentIndex + 1;
    if (next >= playlist.length) {
      if (repeat === "all") { next = 0; }
      else { return; }
    }
  }
  playTrack(next);
}

function prevTrack() {
  if (playlist.length === 0) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  let prev;
  if (shuffle) {
    shuffleIndex--;
    if (shuffleIndex < 0) {
      if (repeat === "all") {
        buildShuffleOrder();
        shuffleIndex = shuffleOrder.length - 1;
      } else {
        return;
      }
    }
    prev = shuffleOrder[shuffleIndex];
  } else {
    prev = currentIndex - 1;
    if (prev < 0) {
      if (repeat === "all") { prev = playlist.length - 1; }
      else { return; }
    }
  }
  playTrack(prev);
}

function onTrackEnd() {
  if (repeat === "one") {
    audio.currentTime = 0;
    audio.play();
    return;
  }
  nextTrack();
}

function onAudioError() {
  logger.error("Player: Erro ao carregar áudio:", audio.src);
  nextTrack();
}

function toggleShuffle() {
  shuffle = !shuffle;
  if (shuffle) buildShuffleOrder();
  updateShuffleIcon();
  saveState();
}

function buildShuffleOrder() {
  const indices = playlist.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  shuffleOrder = indices;
  shuffleIndex = shuffleOrder.indexOf(currentIndex);
  if (shuffleIndex < 0) shuffleIndex = 0;
}

function toggleRepeat() {
  const modes = ["none", "all", "one"];
  const idx = modes.indexOf(repeat);
  repeat = modes[(idx + 1) % modes.length];
  updateRepeatIcon();
  saveState();
}

function toggleMute() {
  if (audio.volume > 0) {
    audio.dataset.prevVolume = audio.volume;
    audio.volume = 0;
  } else {
    audio.volume = parseFloat(audio.dataset.prevVolume) || volume || 0.8;
  }
  updateVolumeIcon();
}

function updateProgress() {
  if (audio.duration) {
    const pct = (audio.currentTime / audio.duration) * 100;
    if (dom["player-progress-fill"]) dom["player-progress-fill"].style.width = pct + "%";
    dom["player-time-current"].textContent = formatTime(audio.currentTime);
  }
}

function updateDuration() {
  dom["player-time-total"].textContent = formatTime(audio.duration);
}

function formatTime(s) {
  if (isNaN(s) || s === Infinity) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function updatePlayButton() {
  if (!dom["player-play-icon"]) return;
  if (isPlaying) {
    dom["player-play-icon"].innerHTML = `<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>`;
  } else {
    dom["player-play-icon"].innerHTML = `<path d="M8 5v14l11-7z"/>`;
  }
}

function updateMiniPlayer() {
  const track = playlist[currentIndex];
  if (!track) return;
  if (dom["player-track-name"]) {
    dom["player-track-name"].textContent = autoplayBlocked
      ? `${track.title} ⚠️ (Clique para ativar áudio)`
      : track.title;
  }
}

function updateShuffleIcon() {
  if (!dom["player-shuffle-icon"]) return;
  dom["player-shuffle-icon"].style.opacity = shuffle ? "1" : "0.4";
}

function updateRepeatIcon() {
  if (!dom["player-repeat-icon"]) return;
  const icons = { none: "0.4", all: "1", one: "1" };
  dom["player-repeat-icon"].style.opacity = icons[repeat] || "0.4";
  if (repeat === "one") {
    dom["player-repeat-icon"].innerHTML = `<text x="12" y="16" text-anchor="middle" font-size="8" fill="currentColor" font-weight="bold">1</text>`;
  } else {
    dom["player-repeat-icon"].innerHTML = `<path d="M4 4v5h5M20 20v-5h-5"/><path d="M16 4a8 8 0 014.24 3.76M8 20a8 8 0 01-4.24-3.76" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
  }
}

function updateVolumeIcon() {
  if (!dom["player-volume-icon"]) return;
  const v = audio.volume;
  if (v === 0 || audio.muted) {
    dom["player-volume-icon"].innerHTML = `<path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>`;
  } else if (v < 0.5) {
    dom["player-volume-icon"].innerHTML = `<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 010 7.07"/>`;
  } else {
    dom["player-volume-icon"].innerHTML = `<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>`;
  }
}

function openExpandedPlayer() {
  const container = document.getElementById("modal-container");
  const body = document.getElementById("modal-body");
  if (!container || !body) return;
  body.innerHTML = renderExpandedContent();
  container.classList.remove("hidden");
}

function renderExpandedContent() {
  const pm = getPeerManager();
  const isMaster = pm ? pm.isHost : true;
  let html = `<div class="player-expanded">
    <div class="player-expanded-header">
      <div class="player-expanded-art" id="player-expanded-art">
        <svg viewBox="0 0 80 80" fill="none" stroke="var(--color-blue-glow)" stroke-width="2" width="80" height="80">
          <circle cx="40" cy="40" r="36"/>
          <path d="M55 40a15 15 0 01-30 0" stroke-width="3"/>
          <circle cx="40" cy="40" r="6" fill="var(--color-blue-glow)"/>
        </svg>
      </div>
      <div class="player-expanded-info">
        <div class="player-expanded-title" id="player-expanded-title">${playlist[currentIndex]?.title || "Nenhuma faixa"}</div>
        <div class="player-expanded-sub">Assimilação RPG - Trilha Sonora</div>
      </div>
    </div>
    <div class="player-expanded-list">`;
  playlist.forEach((track, i) => {
    const active = i === currentIndex ? " active" : "";
    const playing = i === currentIndex && isPlaying ? " playing" : "";
    const disabledClass = isMaster ? "" : " disabled";
    html += `<div class="player-expanded-item${active}${playing}${disabledClass}" data-index="${i}">
      <span class="player-item-num">${String(i + 1).padStart(2, "0")}</span>
      <span class="player-item-title">${track.title}</span>
      <span class="player-item-indicator">${i === currentIndex ? (isPlaying ? "▶" : "⏸") : ""}</span>
    </div>`;
  });
  html += `</div></div>`;

  // Defer event binding
  setTimeout(() => {
    document.querySelectorAll(".player-expanded-item").forEach(el => {
      el.addEventListener("click", () => {
        const pm = getPeerManager();
        const isMaster = pm ? pm.isHost : true;
        if (!isMaster) return;

        const idx = parseInt(el.dataset.index, 10);
        if (idx === currentIndex) { togglePlay(); }
        else { playTrack(idx); }
        document.querySelectorAll(".player-expanded-item").forEach(e => e.classList.remove("active", "playing"));
        el.classList.add("active", "playing");
        const titleEl = document.getElementById("player-expanded-title");
        if (titleEl) titleEl.textContent = playlist[idx]?.title || "";
      });
    });
  }, 50);

  return html;
}

// Salvar estado ao fechar a página
window.addEventListener("beforeunload", saveState);

export function getPlayerState() {
  return { currentIndex, isPlaying, playlist, volume, shuffle, repeat };
}

// ── Funções de Sincronização de Música via WebRTC ───────────────────────────

export function updatePlayerControlsUI() {
  const pm = getPeerManager();
  const isMaster = pm ? pm.isHost : true;

  const controlsToToggle = [
    dom["player-btn-play"],
    dom["player-btn-prev"],
    dom["player-btn-next"],
    dom["player-btn-shuffle"],
    dom["player-btn-repeat"]
  ];

  controlsToToggle.forEach(btn => {
    if (btn) {
      btn.disabled = !isMaster;
      btn.style.opacity = isMaster ? "" : "0.3";
      btn.style.pointerEvents = isMaster ? "" : "none";
    }
  });
}

function broadcastMusicEvent(action) {
  const pm = getPeerManager();
  if (pm && pm.isHost) {
    const data = {
      action,
      index: currentIndex,
      time: audio.currentTime,
      isPlaying: isPlaying,
      timestamp: Date.now()
    };
    pm.broadcast({
      type: "music",
      playerId: pm.playerId,
      data: data
    });
  }
}

export function broadcastMusicState() {
  broadcastMusicEvent("sync");
}

function startPeriodicSync() {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => {
    const pm = getPeerManager();
    if (pm && pm.isHost && isPlaying) {
      broadcastMusicEvent("sync");
    }
  }, 5000);
}

function stopPeriodicSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export function handleIncomingMusicAction(data) {
  const pm = getPeerManager();
  if (pm?.isHost) return; // Se for o mestre, ignora

  const { action, index, time, isPlaying: hostIsPlaying, timestamp } = data;

  // Mostrar mini player
  dom["mini-player"]?.classList.remove("hidden");

  // Calcular tempo estimado compensando latência
  const latency = timestamp ? (Date.now() - timestamp) / 1000 : 0;
  const targetTime = time + latency;

  if (action === "sync" || action === "play" || action === "trackChange") {
    if (currentIndex !== index) {
      currentIndex = index;
      loadTrack(index);
    }

    if (hostIsPlaying) {
      if (audio.paused) {
        audio.play()
          .then(() => {
            autoplayBlocked = false;
            updateMiniPlayer();
          })
          .catch(err => {
            logger.error("Player: Autoplay bloqueado pelo navegador:", err);
            showAutoplayNotice();
          });
      }
      if (Math.abs(audio.currentTime - targetTime) > 2) {
        audio.currentTime = targetTime;
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
      if (Math.abs(audio.currentTime - targetTime) > 2) {
        audio.currentTime = targetTime;
      }
    }
  } else if (action === "pause") {
    if (!audio.paused) {
      audio.pause();
    }
    if (time !== undefined) {
      audio.currentTime = time;
    }
  }
}

function showAutoplayNotice() {
  if (autoplayBlocked) return;
  autoplayBlocked = true;
  updateMiniPlayer();

  const activateAudio = () => {
    if (autoplayBlocked) {
      audio.play().then(() => {
        autoplayBlocked = false;
        updateMiniPlayer();
        document.removeEventListener("click", activateAudio);
      }).catch(err => {
        logger.error("Player: Falha ao ativar áudio pós-clique:", err);
      });
    }
  };
  document.addEventListener("click", activateAudio);
}

