import { el, state, loadCharacter, loadCharactersFromStorage, updateCharSelector } from "./state.js";
import { startWizard } from "./wizard.js";
import { ICONS } from "../icons.js";
import { logger } from "./logger.js";

const landingScreen = document.getElementById("landing-screen");
const charactersList = document.getElementById("characters-list");
const emptyState = document.getElementById("empty-state");
const btnCreateFirstChar = document.getElementById("btn-create-first-char");
const btnImportLanding = document.getElementById("btn-import-landing");
const fileImportLanding = document.getElementById("file-import-landing");
const btnEntrarCampanhaLanding = document.getElementById("btn-entrar-campanha-landing");

let openDropdownId = null;
let activeFilterTab = "all";

export function initLandingScreen() {
  btnCreateFirstChar?.addEventListener("click", () => {
    handleCreateClick();
  });

  btnImportLanding?.addEventListener("click", () => {
    fileImportLanding.click();
  });

  btnEntrarCampanhaLanding?.addEventListener("click", async () => {
    const code = prompt("Digite o código da campanha:");
    if (!code) return;

    const { entrarCampanha } = await import("./campanha.js");
    const { showCampaignScreen } = await import("./mesa-ui.js");
    try {
      const data = await entrarCampanha(code);

      // Registrar localmente no atalho de campanhas gerenciadas
      const raw = localStorage.getItem("assimilação_managed_campaigns");
      const list = raw ? JSON.parse(raw) : [];
      if (!list.some(c => c.code === data.id)) {
        list.push({ code: data.id, hostName: data.mestreNome, name: data.nome, createdAt: Date.now() });
        localStorage.setItem("assimilação_managed_campaigns", JSON.stringify(list));
      }

      renderCharactersList();
      showCampaignScreen(data);
    } catch (err) {
      alert("Erro ao entrar na campanha: " + err.message);
    }
  });

  fileImportLanding?.addEventListener("change", (e) => {
    importCharacterFromFile(e);
    fileImportLanding.value = "";
  });

  // Configurar escutadores para as abas de filtro
  const tabsContainer = document.getElementById("landing-tabs");
  if (tabsContainer) {
    tabsContainer.querySelectorAll(".landing-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        tabsContainer.querySelectorAll(".landing-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        activeFilterTab = tab.dataset.tab;
        renderCharactersList();
      });
    });
  }

  document.addEventListener("click", (e) => {
    if (openDropdownId && !e.target.closest(".char-actions")) {
      closeDropdown();
    }
  });

  document.addEventListener("start-wizard", () => {
    showLandingScreen(false);
  });

  document.addEventListener("characters-updated", () => {
    renderCharactersList();
  });
}

function handleCreateClick() {
  if (activeFilterTab === "all") {
    openSheetTypeModal();
  } else {
    _createSheetByType(activeFilterTab);
  }
}

export function showLandingScreen(restore = true) {
  landingScreen.classList.remove("hidden");
  el.wizardScreen.classList.add("hidden");
  el.sheetScreen.classList.add("hidden");
  document.getElementById("campaign-screen")?.classList.add("hidden");
  ["refugio-screen","regiao-screen","conflito-screen","local-screen"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });
  if (restore) {
    renderCharactersList();
  }
}

function openSheetTypeModal() {
  const modalContainer = el.modalContainer;
  const modalBody = el.modalBody;

  modalBody.innerHTML = `
    <h3 class="modal-title" style="margin-bottom:16px;">Que tipo de ficha deseja criar?</h3>
    <div class="sheet-type-modal-grid">
      <div class="sheet-type-card" data-type="infectado" tabindex="0">
        <span class="type-emoji">🧬</span>
        <span class="type-label" style="color:hsl(145,60%,55%);">Infectado</span>
        <span class="type-desc">Ficha de personagem jogador</span>
      </div>
      <div class="sheet-type-card" data-type="refugio" tabindex="0">
        <span class="type-emoji">🏕️</span>
        <span class="type-label" style="color:hsl(28,70%,60%);">Refúgio</span>
        <span class="type-desc">Acampamento ou comunidade</span>
      </div>
      <div class="sheet-type-card" data-type="regiao" tabindex="0">
        <span class="type-emoji">🗺️</span>
        <span class="type-label" style="color:hsl(205,55%,55%);">Região</span>
        <span class="type-desc">Território com atributos</span>
      </div>
      <div class="sheet-type-card" data-type="conflito" tabindex="0">
        <span class="type-emoji">⚔️</span>
        <span class="type-label" style="color:hsl(0,60%,58%);">Conflito</span>
        <span class="type-desc">Ameaça ou crise narrativa</span>
      </div>
      <div class="sheet-type-card" data-type="local" tabindex="0">
        <span class="type-emoji">📍</span>
        <span class="type-label" style="color:hsl(270,45%,62%);">Local</span>
        <span class="type-desc">Ponto de interesse narrativo</span>
      </div>
      <div class="sheet-type-card" data-type="campanha" tabindex="0">
        <span class="type-emoji">📋</span>
        <span class="type-label" style="color:var(--color-blue-glow);">Mesa de Jogo</span>
        <span class="type-desc">Lobby e diários compartilhados para narrar</span>
      </div>
    </div>
  `;

  modalContainer.classList.remove("hidden");

  modalBody.querySelectorAll(".sheet-type-card").forEach(card => {
    const activate = () => {
      const type = card.dataset.type;
      modalContainer.classList.add("hidden");
      _createSheetByType(type);
    };
    card.addEventListener("click", activate);
    card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") activate(); });
  });

  const closeBtn = modalContainer.querySelector(".modal-close");
  if (closeBtn) closeBtn.addEventListener("click", () => modalContainer.classList.add("hidden"), { once: true });
  modalContainer.addEventListener("click", e => {
    if (e.target === modalContainer) modalContainer.classList.add("hidden");
  }, { once: true });
}

async function _createSheetByType(type) {
  switch (type) {
    case "infectado":
      startWizard();
      break;
    case "refugio": {
      const { startNewRefugio } = await import("./refugio.js");
      landingScreen.classList.add("hidden");
      startNewRefugio();
      break;
    }
    case "regiao": {
      const { startNewRegiao } = await import("./regiao.js");
      landingScreen.classList.add("hidden");
      startNewRegiao();
      break;
    }
    case "conflito": {
      const { startNewConflito } = await import("./conflito.js");
      landingScreen.classList.add("hidden");
      startNewConflito();
      break;
    }
    case "local": {
      const { startNewLocal } = await import("./local.js");
      window._worldStateCharacters = state.characters;
      landingScreen.classList.add("hidden");
      startNewLocal();
      break;
    }
    case "campanha": {
      const name = prompt("Nome da Mesa:", "Minha Mesa");
      if (!name) return;
      const mestre = prompt("Seu Nome (Mestre):", "Mestre");
      if (!mestre) return;

      const { criarCampanha } = await import("./campanha.js");
      const { showCampaignScreen } = await import("./mesa-ui.js");
      try {
        const campaignData = await criarCampanha(name, mestre);
        
        // Registrar localmente no atalho
        const raw = localStorage.getItem("assimilação_managed_campaigns");
        const list = raw ? JSON.parse(raw) : [];
        list.push({ code: campaignData.id, hostName: campaignData.mestreNome, name: campaignData.nome, createdAt: Date.now() });
        localStorage.setItem("assimilação_managed_campaigns", JSON.stringify(list));
        
        renderCharactersList();
        showCampaignScreen(campaignData);
      } catch (err) {
        alert("Erro ao criar mesa: " + err.message);
      }
      break;
    }
  }
}

export function renderCharactersList() {
  loadCharactersFromStorage();

  const { worldState } = _getWorldState();

  if (emptyState) emptyState.classList.add("hidden");

  window._worldStateCharacters = state.characters;

  const rawCamps = localStorage.getItem("assimilação_managed_campaigns");
  const campaigns = rawCamps ? JSON.parse(rawCamps) : [];

  const allItems = [
    ...state.characters.map(c => ({ ...c, _sheetType: "infectado" })),
    ...(worldState.refugios  || []).map(r => ({ ...r, _sheetType: "refugio"  })),
    ...(worldState.regioes   || []).map(r => ({ ...r, _sheetType: "regiao"   })),
    ...(worldState.conflitos || []).map(c => ({ ...c, _sheetType: "conflito" })),
    ...(worldState.locais    || []).map(l => ({ ...l, _sheetType: "local"    })),
    ...campaigns.map(c => ({ id: c.code, name: c.name, hostName: c.hostName, createdAt: c.createdAt || Date.now(), _sheetType: "campanha" })),
  ].sort((a, b) => {
    const tsA = a._sheetType === "campanha" ? a.createdAt : _extractTimestamp(a.id);
    const tsB = b._sheetType === "campanha" ? b.createdAt : _extractTimestamp(b.id);
    return tsB - tsA;
  });

  // Filtrar itens com base na aba ativa
  const filteredItems = activeFilterTab === "all"
    ? allItems
    : allItems.filter(item => item._sheetType === activeFilterTab);

  const TYPE_BADGES = {
    infectado: `<span class="sheet-type-badge badge-infectado">🧬 Infectado</span>`,
    refugio:   `<span class="sheet-type-badge badge-refugio">🏕️ Refúgio</span>`,
    regiao:    `<span class="sheet-type-badge badge-regiao">🗺️ Região</span>`,
    conflito:  `<span class="sheet-type-badge badge-conflito">⚔️ Conflito</span>`,
    local:     `<span class="sheet-type-badge badge-local">📍 Local</span>`,
    campanha:  `<span class="sheet-type-badge badge-campanha">📋 Mesa de Jogo</span>`,
  };

  const TYPE_SUB = {
    infectado: item => item.ocupacao || "",
    refugio:   item => `Pop ${item.populacao||0} • Def ${item.defesa||0}`,
    regiao:    item => `Perigo ${item.perigo||0} • Tam ${item.tamanho||0}`,
    conflito:  item => `${item.tipoConflito||"Conflito"} • Grau ${item.grau||0}`,
    local:     item => item.tipoLocal || "",
    campanha:  item => `Mestre: ${item.hostName || "Mestre"}`,
  };

  let cardsHtml = filteredItems.map(item => {
    const type = item._sheetType;
    const name = item.name || item.nome || "Sem nome";
    const subInfo = TYPE_SUB[type]?.(item) || "";
    const portrait = item.portrait || item.imagem || "";
    const avatarContent = portrait
      ? `<img src="${escapeHtml(portrait)}" alt="" class="char-card-avatar-img">`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="char-card-avatar-svg"><path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`;

    const actionsHtml = `
      <div class="char-actions">
        <button class="btn-char-action" title="Mais ações" data-action="menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </button>
        <div class="char-actions-dropdown" data-dropdown="${escapeHtml(item.id)}">
          <button data-action="share-code" data-id="${escapeHtml(item.id)}" data-type="${type}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Código Nuvem
          </button>
          <div class="dropdown-divider"></div>
          ${type === "infectado" ? `
            <button data-action="duplicate" data-id="${escapeHtml(item.id)}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Duplicar Ficha
            </button>
            <div class="dropdown-divider"></div>
          ` : ""}
          <button data-action="delete-any" data-id="${escapeHtml(item.id)}" data-type="${type}" class="btn-danger-dropdown">
            ${ICONS.trash} Excluir
          </button>
        </div>
      </div>
    `;

    return `
      <article class="character-card square-card" data-char-id="${escapeHtml(item.id)}" data-sheet-type="${type}">
        <div class="char-card-avatar">${avatarContent}</div>
        <div class="char-card-name">${escapeHtml(name)}</div>
        <div class="char-card-sub-info">
          ${TYPE_BADGES[type]}
          ${subInfo ? `<div class="char-card-sub-info">${escapeHtml(subInfo)}</div>` : ""}
        </div>
        ${actionsHtml}
      </article>
    `;
  }).join("");

  cardsHtml += `
    <article class="character-card square-card create-card" id="btn-create-card">
      <div class="char-card-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="char-card-plus-svg">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <div class="char-card-name">Nova Ficha</div>
    </article>
  `;

  if (emptyState) {
    emptyState.classList.toggle("hidden", filteredItems.length > 0);
    const titleEl = emptyState.querySelector(".empty-title");
    const subEl = emptyState.querySelector(".empty-sub");
    if (titleEl && subEl) {
      const titles = {
        all: "Nenhuma ficha encontrada",
        infectado: "Nenhum infectado encontrado",
        refugio: "Nenhum refúgio encontrado",
        regiao: "Nenhuma região encontrada",
        conflito: "Nenhum conflito encontrado",
        local: "Nenhum local encontrado"
      };
      const subtitles = {
        all: "Crie ou importe um elemento para começar",
        infectado: "Crie seu primeiro personagem para começar",
        refugio: "Crie seu primeiro refúgio para começar",
        regiao: "Crie sua primeira região para começar",
        conflito: "Crie seu primeiro conflito para começar",
        local: "Crie seu primeiro local para começar"
      };
      titleEl.textContent = titles[activeFilterTab] || titles.all;
      subEl.textContent = subtitles[activeFilterTab] || subtitles.all;
    }
  }

  charactersList.innerHTML = cardsHtml;
  attachCardListeners();
}

function _getWorldState() {
  if (window._worldState) return { worldState: window._worldState };
  return { worldState: { refugios: [], regioes: [], conflitos: [], locais: [] } };
}

function _extractTimestamp(id) {
  if (!id) return 0;
  const parts = id.split("_");
  const ts = parseInt(parts[parts.length - 1]);
  return isNaN(ts) ? 0 : ts;
}

function attachCardListeners() {
  document.querySelectorAll(".character-card").forEach(card => {
    card.addEventListener("click", async (e) => {
      if (e.target.closest(".char-actions") || card.classList.contains("create-card")) return;
      const id = card.dataset.charId;
      const type = card.dataset.sheetType;
      if (!id) return;
      if (type === "infectado") {
        handleLoadCharacter(id);
      } else if (type === "campanha") {
        const { entrarCampanha } = await import("./campanha.js");
        const { showCampaignScreen } = await import("./mesa-ui.js");
        try {
          const campaignData = await entrarCampanha(id);
          showCampaignScreen(campaignData);
        } catch (err) {
          alert("Erro ao abrir campanha: " + err.message);
        }
      } else {
        await _openWorldSheet(type, id);
      }
    });
  });

  const createCard = document.getElementById("btn-create-card");
  if (createCard) createCard.addEventListener("click", handleCreateClick);

  document.querySelectorAll("[data-action='menu']").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const card = e.target.closest(".character-card");
      if (card?.dataset.charId) toggleDropdown(card.dataset.charId);
    });
  });
  document.querySelectorAll("[data-action='share-code']").forEach(btn => {
    btn.addEventListener("click", async e => {
      e.stopPropagation();
      closeDropdown();
      const id = btn.dataset.id;
      const type = btn.dataset.type;
      
      let sheetObj = null;
      if (type === "infectado") {
        sheetObj = state.characters.find(c => c.id === id);
      } else if (type === "campanha") {
        const raw = localStorage.getItem("assimilação_managed_campaigns");
        const list = raw ? JSON.parse(raw) : [];
        const item = list.find(c => c.code === id);
        if (item) {
          const { entrarCampanha } = await import("./campanha.js");
          try {
            sheetObj = await entrarCampanha(id);
          } catch(err) {}
        }
      } else {
        const { worldState } = _getWorldState();
        const listName = type === "refugio" ? "refugios" : type === "regiao" ? "regioes" : type === "conflito" ? "conflitos" : "locais";
        sheetObj = (worldState[listName] || []).find(x => x.id === id);
      }
      
      if (!sheetObj) { alert("Ficha não encontrada!"); return; }
      sheetObj._sheetType = type;

      const { gerarCodigoCompartilhamento } = await import("./campanha.js");
      try {
        const code = await gerarCodigoCompartilhamento(sheetObj);
        prompt("Ficha compartilhada na nuvem! Código de Compartilhamento (copiado para a área de transferência):", code);
        navigator.clipboard.writeText(code).catch(() => {});
      } catch (err) {
        alert("Erro ao compartilhar ficha: " + err.message);
      }
    });
  });

  document.querySelectorAll("[data-action='duplicate']").forEach(btn => {
    btn.addEventListener("click", e => { e.stopPropagation(); handleDuplicateCharacter(btn.dataset.id); closeDropdown(); });
  });

  document.querySelectorAll("[data-action='delete-any']").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      closeDropdown();
      const id = btn.dataset.id;
      const type = btn.dataset.type;
      if (type === "infectado") {
        handleDeleteCharacter(id);
      } else {
        _deleteWorldSheet(type, id);
      }
    });
  });
}

async function _openWorldSheet(type, id) {
  landingScreen.classList.add("hidden");
  const { worldState } = _getWorldState();
  switch (type) {
    case "refugio": {
      const item = (worldState.refugios || []).find(r => r.id === id);
      if (item) { const m = await import("./refugio.js"); m.loadRefugioSheet(item); }
      break;
    }
    case "regiao": {
      const item = (worldState.regioes || []).find(r => r.id === id);
      if (item) { const m = await import("./regiao.js"); m.loadRegiaoSheet(item); }
      break;
    }
    case "conflito": {
      const item = (worldState.conflitos || []).find(c => c.id === id);
      if (item) { const m = await import("./conflito.js"); m.loadConflitoSheet(item); }
      break;
    }
    case "local": {
      const item = (worldState.locais || []).find(l => l.id === id);
      if (item) {
        window._worldStateCharacters = state.characters;
        const m = await import("./local.js");
        m.loadLocalSheet(item);
      }
      break;
    }
  }
}

async function _deleteWorldSheet(type, id) {
  const labels = { refugio: "Refúgio", regiao: "Região", conflito: "Conflito", local: "Local", campanha: "Campanha" };
  if (!confirm(`Excluir este ${labels[type] || "item"}? Esta ação não pode ser desfeita.`)) return;
  const ws = await import("./world-state.js");
  switch (type) {
    case "refugio":  ws.deleteRefugio(id);  break;
    case "regiao":   ws.deleteRegiao(id);   break;
    case "conflito": ws.deleteConflito(id); break;
    case "local":    ws.deleteLocal(id);    break;
    case "campanha": {
      const raw = localStorage.getItem("assimilação_managed_campaigns");
      let list = raw ? JSON.parse(raw) : [];
      list = list.filter(c => c.code !== id);
      localStorage.setItem("assimilação_managed_campaigns", JSON.stringify(list));
      break;
    }
  }
  renderCharactersList();
}

function toggleDropdown(charId) {
  if (openDropdownId === charId) { closeDropdown(); return; }
  closeDropdown();
  openDropdownId = charId;
  const dropdown = document.querySelector(`[data-dropdown="${CSS.escape(charId)}"]`);
  if (dropdown) dropdown.classList.add("open");
}

function closeDropdown() {
  if (openDropdownId) {
    const old = document.querySelector(`[data-dropdown="${CSS.escape(openDropdownId)}"]`);
    if (old) old.classList.remove("open");
    openDropdownId = null;
  }
}

function handleLoadCharacter(charId) {
  landingScreen.classList.add("hidden");
  loadCharacter(charId);
}

function handleExportCharacter(charId) {
  const char = state.characters.find(c => c.id === charId);
  if (!char) return;
  const blob = new Blob([JSON.stringify(char, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${char.name.toLowerCase().replace(/\s+/g, "_")}_ficha.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleDuplicateCharacter(charId) {
  const char = state.characters.find(c => c.id === charId);
  if (!char) return;
  const duplicate = JSON.parse(JSON.stringify(char));
  duplicate.id = "char_" + Date.now();
  duplicate.name = char.name + " (Cópia)";
  state.characters.push(duplicate);
  try {
    localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
  } catch (e) {
    logger.error("Erro ao salvar após duplicação:", e);
  }
  renderCharactersList();
}

function handleDeleteCharacter(charId) {
  const char = state.characters.find(c => c.id === charId);
  if (!char) return;
  showDeleteConfirmModal(char);
}

function showDeleteConfirmModal(char) {
  const modalContainer = el.modalContainer;
  const modalBody = el.modalBody;
  modalBody.innerHTML = `
    <div class="landing-actions-menu">
      <h3 class="menu-title">Excluir Infectado</h3>
      <p style="color:var(--text-secondary);font-size:var(--font-size-sm);margin-bottom:12px;line-height:1.5;">
        Tem certeza que deseja apagar permanentemente a ficha de <strong>${escapeHtml(char.name)}</strong>?<br>Esta ação não pode ser desfeita.
      </p>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button id="btn-cancel-delete" class="btn" style="padding:10px 20px;">Cancelar</button>
        <button id="btn-confirm-delete" class="btn btn-danger" style="padding:10px 20px;">${ICONS.trash} Sim, Excluir</button>
      </div>
    </div>
  `;
  modalContainer.classList.remove("hidden");
  document.getElementById("btn-cancel-delete").addEventListener("click", () => modalContainer.classList.add("hidden"), { once: true });
  document.getElementById("btn-confirm-delete").addEventListener("click", () => {
    performDelete(char);
    modalContainer.classList.add("hidden");
  }, { once: true });
  const closeBtn = modalContainer.querySelector(".modal-close");
  if (closeBtn) closeBtn.addEventListener("click", () => modalContainer.classList.add("hidden"), { once: true });
  modalContainer.addEventListener("click", e => {
    if (e.target === modalContainer) modalContainer.classList.add("hidden");
  }, { once: true });
}

function performDelete(char) {
  const index = state.characters.findIndex(c => c.id === char.id);
  if (index !== -1) {
    state.characters.splice(index, 1);
    try { localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters)); } catch (e) {}
    if (state.currentCharacter?.id === char.id) state.currentCharacter = null;
    loadCharactersFromStorage();
    updateCharSelector();
    renderCharactersList();
  }
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function importCharacterFromFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const charObj = JSON.parse(evt.target.result);
      if (!charObj.id || !charObj.name) { alert("Ficha inválida!"); return; }
      charObj.id = "char_" + Date.now();
      state.characters.push(charObj);
      localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
      loadCharactersFromStorage();
      updateCharSelector();
      renderCharactersList();
    } catch (err) {
      alert("Erro ao ler o arquivo JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}
