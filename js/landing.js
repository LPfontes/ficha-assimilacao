import { el, state, loadCharacter, loadCharactersFromStorage, updateCharSelector } from "./state.js";
import { startWizard } from "./wizard.js";
import { ICONS } from "../icons.js";
import { logger } from "./logger.js";
import {
  loadFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  toggleFolderCollapsed,
  setAllFoldersCollapsed,
  isUnassignedCollapsed,
  setItemFolder
} from "./folders.js";

const landingScreen = document.getElementById("landing-screen");
const charactersList = document.getElementById("characters-list");
const emptyState = document.getElementById("empty-state");
const btnCreateFirstChar = document.getElementById("btn-create-first-char");
const btnImportLanding = document.getElementById("btn-import-landing");
const fileImportLanding = document.getElementById("file-import-landing");
const btnEntrarCampanhaLanding = document.getElementById("btn-entrar-campanha-landing");
const btnNewFolder = document.getElementById("btn-new-folder");
const btnCollapseAllFolders = document.getElementById("btn-collapse-all-folders");
const btnExpandAllFolders = document.getElementById("btn-expand-all-folders");

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

  btnNewFolder?.addEventListener("click", () => {
    openCreateFolderModal();
  });

  btnCollapseAllFolders?.addEventListener("click", () => {
    setAllFoldersCollapsed(true);
    renderCharactersList();
  });

  btnExpandAllFolders?.addEventListener("click", () => {
    setAllFoldersCollapsed(false);
    renderCharactersList();
  });
}

function handleCreateClick(folderId = null) {
  if (folderId) state.pendingFolderId = folderId;
  if (activeFilterTab === "all") {
    openSheetTypeModal(folderId);
  } else {
    _createSheetByType(activeFilterTab, folderId);
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

function openSheetTypeModal(folderId = null) {
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
      _createSheetByType(type, folderId);
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

async function _createSheetByType(type, folderId = null) {
  if (folderId) state.pendingFolderId = folderId;

  switch (type) {
    case "infectado":
      startWizard();
      break;
    case "refugio": {
      const { startNewRefugio } = await import("./refugio.js");
      landingScreen.classList.add("hidden");
      startNewRefugio();
      if (folderId && window._worldState?.currentRefugio) {
        window._worldState.currentRefugio.folderId = folderId;
        const ws = await import("./world-state.js");
        ws.saveRefugio(window._worldState.currentRefugio);
      }
      break;
    }
    case "regiao": {
      const { startNewRegiao } = await import("./regiao.js");
      landingScreen.classList.add("hidden");
      startNewRegiao();
      if (folderId && window._worldState?.currentRegiao) {
        window._worldState.currentRegiao.folderId = folderId;
        const ws = await import("./world-state.js");
        ws.saveRegiao(window._worldState.currentRegiao);
      }
      break;
    }
    case "conflito": {
      const { startNewConflito } = await import("./conflito.js");
      landingScreen.classList.add("hidden");
      startNewConflito();
      if (folderId && window._worldState?.currentConflito) {
        window._worldState.currentConflito.folderId = folderId;
        const ws = await import("./world-state.js");
        ws.saveConflito(window._worldState.currentConflito);
      }
      break;
    }
    case "local": {
      const { startNewLocal } = await import("./local.js");
      window._worldStateCharacters = state.characters;
      landingScreen.classList.add("hidden");
      startNewLocal();
      if (folderId && window._worldState?.currentLocal) {
        window._worldState.currentLocal.folderId = folderId;
        const ws = await import("./world-state.js");
        ws.saveLocal(window._worldState.currentLocal);
      }
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
        list.push({ code: campaignData.id, hostName: campaignData.mestreNome, name: campaignData.nome, folderId: folderId || null, createdAt: Date.now() });
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
    ...campaigns.map(c => ({ id: c.code, name: c.name, hostName: c.hostName, folderId: c.folderId || null, createdAt: c.createdAt || Date.now(), _sheetType: "campanha" })),
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

  const renderCardHtml = (item) => {
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
          <button data-action="move-folder" data-id="${escapeHtml(item.id)}" data-type="${type}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            Mover p/ Pasta...
          </button>
          <div class="dropdown-divider"></div>
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
      <article class="character-card square-card" draggable="true" data-char-id="${escapeHtml(item.id)}" data-sheet-type="${type}" data-folder-id="${escapeHtml(item.folderId || '')}">
        <div class="char-card-avatar">${avatarContent}</div>
        <div class="char-card-name">${escapeHtml(name)}</div>
        <div class="char-card-sub-info">
          ${TYPE_BADGES[type]}
          ${subInfo ? `<div class="char-card-sub-info">${escapeHtml(subInfo)}</div>` : ""}
        </div>
        ${actionsHtml}
      </article>
    `;
  };

  const createCardHtml = (folderId = null) => `
    <article class="character-card square-card create-card" ${folderId ? `data-create-folder-id="${escapeHtml(folderId)}"` : `id="btn-create-card"`} title="Criar nova ficha">
      <div class="char-card-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="char-card-plus-svg">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <div class="char-card-name">Nova Ficha</div>
    </article>
  `;

  const folders = loadFolders();
  const btnCollapseAll = document.getElementById("btn-collapse-all-folders");
  const btnExpandAll = document.getElementById("btn-expand-all-folders");

  let contentHtml = "";

  if (folders.length === 0) {
    btnCollapseAll?.classList.add("hidden");
    btnExpandAll?.classList.add("hidden");
    contentHtml = filteredItems.map(renderCardHtml).join("") + createCardHtml(null);
  } else {
    btnCollapseAll?.classList.remove("hidden");
    btnExpandAll?.classList.remove("hidden");

    // Renderizar pastas criadas
    folders.forEach(folder => {
      const itemsInFolder = filteredItems.filter(item => item.folderId === folder.id);
      const isCollapsed = Boolean(folder.collapsed);

      let innerCards = itemsInFolder.map(renderCardHtml).join("");
      if (itemsInFolder.length === 0) {
        innerCards = `
          <div class="folder-empty-dropzone" data-drop-folder-id="${escapeHtml(folder.id)}">
            <span style="font-size:1.1rem;opacity:0.6;">📥</span>
            <span>Pasta vazia. Arraste fichas para cá ou adicione abaixo.</span>
          </div>
        `;
      }
      innerCards += createCardHtml(folder.id);

      contentHtml += `
        <section class="folder-group ${isCollapsed ? 'is-collapsed' : ''}" data-folder-id="${escapeHtml(folder.id)}">
          <header class="folder-group-header">
            <div class="folder-info-btn" role="button" tabindex="0" data-action="toggle-folder" data-folder-id="${escapeHtml(folder.id)}">
              <button class="folder-collapse-arrow" type="button" aria-label="Recolher ou expandir">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <span class="folder-icon">${folder.icon || '📁'}</span>
              <h2 class="folder-title">${escapeHtml(folder.name)}</h2>
              <span class="folder-counter">${itemsInFolder.length} ${itemsInFolder.length === 1 ? 'ficha' : 'fichas'}</span>
            </div>
            <div class="folder-actions">
              <button class="btn-folder-header-action" type="button" data-action="create-in-folder" data-folder-id="${escapeHtml(folder.id)}" title="Criar nova ficha nesta pasta">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                + Ficha
              </button>
              <button class="btn-folder-header-action" type="button" data-action="rename-folder" data-folder-id="${escapeHtml(folder.id)}" title="Renomear pasta">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button class="btn-folder-header-action btn-folder-danger" type="button" data-action="delete-folder" data-folder-id="${escapeHtml(folder.id)}" title="Excluir pasta (as fichas não serão apagadas)">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </header>
          <div class="folder-cards-grid characters-grid" data-drop-folder-id="${escapeHtml(folder.id)}">
            ${innerCards}
          </div>
        </section>
      `;
    });

    // Seção Fichas Avulsas (Sem Pasta)
    const unassignedItems = filteredItems.filter(item => !item.folderId || !folders.some(f => f.id === item.folderId));
    const isUnassignedCol = isUnassignedCollapsed();

    let unassignedCards = unassignedItems.map(renderCardHtml).join("");
    if (unassignedItems.length === 0) {
      unassignedCards = `
        <div class="folder-empty-dropzone" data-drop-folder-id="__unassigned__">
          <span style="font-size:1.1rem;opacity:0.6;">📥</span>
          <span>Nenhuma ficha avulsa. Arraste fichas para cá se quiser tirá-las das pastas.</span>
        </div>
      `;
    }
    unassignedCards += createCardHtml(null);

    contentHtml += `
      <section class="folder-group unassigned-group ${isUnassignedCol ? 'is-collapsed' : ''}" data-folder-id="__unassigned__">
        <header class="folder-group-header">
          <div class="folder-info-btn" role="button" tabindex="0" data-action="toggle-folder" data-folder-id="__unassigned__">
            <button class="folder-collapse-arrow" type="button" aria-label="Recolher ou expandir">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <span class="folder-icon">🗂️</span>
            <h2 class="folder-title">Fichas Avulsas (Sem Pasta)</h2>
            <span class="folder-counter">${unassignedItems.length} ${unassignedItems.length === 1 ? 'ficha' : 'fichas'}</span>
          </div>
        </header>
        <div class="folder-cards-grid characters-grid" data-drop-folder-id="__unassigned__">
          ${unassignedCards}
        </div>
      </section>
    `;
  }

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

  charactersList.innerHTML = contentHtml;
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
  if (createCard) createCard.addEventListener("click", () => handleCreateClick());

  document.querySelectorAll("[data-create-folder-id]").forEach(card => {
    card.addEventListener("click", () => {
      const folderId = card.dataset.createFolderId;
      handleCreateClick(folderId);
    });
  });

  document.querySelectorAll("[data-action='menu']").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const card = e.target.closest(".character-card");
      if (card?.dataset.charId) toggleDropdown(card.dataset.charId);
    });
  });

  document.querySelectorAll("[data-action='move-folder']").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      closeDropdown();
      const id = btn.dataset.id;
      const type = btn.dataset.type;
      openMoveToFolderModal(id, type);
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

  // Ações das pastas (toggle, create, rename, delete)
  document.querySelectorAll("[data-action='toggle-folder']").forEach(elBtn => {
    elBtn.addEventListener("click", (e) => {
      const folderId = elBtn.dataset.folderId;
      if (!folderId) return;
      toggleFolderCollapsed(folderId);
      renderCharactersList();
    });
  });

  document.querySelectorAll("[data-action='create-in-folder']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const folderId = btn.dataset.folderId;
      handleCreateClick(folderId);
    });
  });

  document.querySelectorAll("[data-action='rename-folder']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const folderId = btn.dataset.folderId;
      openRenameFolderModal(folderId);
    });
  });

  document.querySelectorAll("[data-action='delete-folder']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const folderId = btn.dataset.folderId;
      openDeleteFolderModal(folderId);
    });
  });

  setupDragAndDrop();
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
      if (!charObj.folderId && state.pendingFolderId) {
        charObj.folderId = state.pendingFolderId;
      }
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

// ==========================================================
// MODAIS E CONTROLES DE PASTAS
// ==========================================================

function openCreateFolderModal(onCreated = null) {
  const modalContainer = el.modalContainer;
  const modalBody = el.modalBody;
  let selectedIcon = "📁";
  const icons = ["📁", "🏕️", "🧬", "⚔️", "🗺️", "📍", "📋", "💀", "🛡️", "📦", "☣️", "🔥", "⚙️", "🌲", "🏢"];

  modalBody.innerHTML = `
    <div class="folder-modal-content">
      <h3 class="modal-title">Nova Pasta</h3>
      <p style="color:var(--text-secondary);font-size:var(--font-size-sm);margin:0;">
        Crie uma pasta para organizar suas fichas por campanha, grupo ou tema.
      </p>
      <div>
        <label style="display:block;font-size:var(--font-size-xs);color:var(--text-muted);margin-bottom:6px;">Nome da Pasta</label>
        <input type="text" id="folder-name-input" class="input-text" placeholder="Ex: Campanha Vale da Morte" style="width:100%;box-sizing:border-box;" autofocus />
      </div>
      <div>
        <label style="display:block;font-size:var(--font-size-xs);color:var(--text-muted);margin-bottom:6px;">Ícone da Pasta</label>
        <div class="folder-icons-selector">
          ${icons.map(ic => `<button type="button" class="folder-icon-option ${ic === '📁' ? 'active' : ''}" data-icon="${ic}">${ic}</button>`).join("")}
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px;">
        <button id="btn-cancel-folder" class="btn" style="padding:8px 18px;">Cancelar</button>
        <button id="btn-confirm-create-folder" class="btn btn-primary" style="padding:8px 20px;">Criar Pasta</button>
      </div>
    </div>
  `;

  modalContainer.classList.remove("hidden");
  const input = document.getElementById("folder-name-input");
  input?.focus();

  modalBody.querySelectorAll(".folder-icon-option").forEach(btn => {
    btn.addEventListener("click", () => {
      modalBody.querySelectorAll(".folder-icon-option").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedIcon = btn.dataset.icon;
    });
  });

  const handleConfirm = () => {
    const name = input?.value.trim();
    if (!name) {
      input?.focus();
      return;
    }
    const newFolder = createFolder(name, selectedIcon);
    modalContainer.classList.add("hidden");
    renderCharactersList();
    if (onCreated) onCreated(newFolder);
  };

  document.getElementById("btn-confirm-create-folder")?.addEventListener("click", handleConfirm);
  document.getElementById("btn-cancel-folder")?.addEventListener("click", () => modalContainer.classList.add("hidden"));
  input?.addEventListener("keydown", e => { if (e.key === "Enter") handleConfirm(); });

  const closeBtn = modalContainer.querySelector(".modal-close");
  if (closeBtn) closeBtn.addEventListener("click", () => modalContainer.classList.add("hidden"), { once: true });
  modalContainer.addEventListener("click", e => {
    if (e.target === modalContainer) modalContainer.classList.add("hidden");
  }, { once: true });
}

function openRenameFolderModal(folderId) {
  const folders = loadFolders();
  const folder = folders.find(f => f.id === folderId);
  if (!folder) return;

  const modalContainer = el.modalContainer;
  const modalBody = el.modalBody;
  let selectedIcon = folder.icon || "📁";
  const icons = ["📁", "🏕️", "🧬", "⚔️", "🗺️", "📍", "📋", "💀", "🛡️", "📦", "☣️", "🔥", "⚙️", "🌲", "🏢"];

  modalBody.innerHTML = `
    <div class="folder-modal-content">
      <h3 class="modal-title">Renomear Pasta</h3>
      <div>
        <label style="display:block;font-size:var(--font-size-xs);color:var(--text-muted);margin-bottom:6px;">Nome da Pasta</label>
        <input type="text" id="rename-folder-input" class="input-text" value="${escapeHtml(folder.name)}" style="width:100%;box-sizing:border-box;" autofocus />
      </div>
      <div>
        <label style="display:block;font-size:var(--font-size-xs);color:var(--text-muted);margin-bottom:6px;">Ícone da Pasta</label>
        <div class="folder-icons-selector">
          ${icons.map(ic => `<button type="button" class="folder-icon-option ${ic === selectedIcon ? 'active' : ''}" data-icon="${ic}">${ic}</button>`).join("")}
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px;">
        <button id="btn-cancel-rename" class="btn" style="padding:8px 18px;">Cancelar</button>
        <button id="btn-confirm-rename" class="btn btn-primary" style="padding:8px 20px;">Salvar</button>
      </div>
    </div>
  `;

  modalContainer.classList.remove("hidden");
  const input = document.getElementById("rename-folder-input");
  input?.focus();
  input?.select();

  modalBody.querySelectorAll(".folder-icon-option").forEach(btn => {
    btn.addEventListener("click", () => {
      modalBody.querySelectorAll(".folder-icon-option").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedIcon = btn.dataset.icon;
    });
  });

  const handleConfirm = () => {
    const name = input?.value.trim();
    if (!name) { input?.focus(); return; }
    renameFolder(folderId, name, selectedIcon);
    modalContainer.classList.add("hidden");
    renderCharactersList();
  };

  document.getElementById("btn-confirm-rename")?.addEventListener("click", handleConfirm);
  document.getElementById("btn-cancel-rename")?.addEventListener("click", () => modalContainer.classList.add("hidden"));
  input?.addEventListener("keydown", e => { if (e.key === "Enter") handleConfirm(); });

  const closeBtn = modalContainer.querySelector(".modal-close");
  if (closeBtn) closeBtn.addEventListener("click", () => modalContainer.classList.add("hidden"), { once: true });
  modalContainer.addEventListener("click", e => {
    if (e.target === modalContainer) modalContainer.classList.add("hidden");
  }, { once: true });
}

function openDeleteFolderModal(folderId) {
  const folders = loadFolders();
  const folder = folders.find(f => f.id === folderId);
  if (!folder) return;

  const modalContainer = el.modalContainer;
  const modalBody = el.modalBody;

  modalBody.innerHTML = `
    <div class="landing-actions-menu">
      <h3 class="menu-title">Excluir Pasta</h3>
      <p style="color:var(--text-secondary);font-size:var(--font-size-sm);margin-bottom:14px;line-height:1.5;">
        Tem certeza que deseja excluir a pasta <strong>${escapeHtml(folder.name)}</strong>?<br>
        <span style="color:var(--color-blue-glow);font-size:var(--font-size-xs);margin-top:6px;display:block;">
          ✓ As fichas dentro dela <strong>não serão apagadas</strong>. Elas serão movidas com segurança para "Sem Pasta".
        </span>
      </p>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button id="btn-cancel-folder-del" class="btn" style="padding:10px 20px;">Cancelar</button>
        <button id="btn-confirm-folder-del" class="btn btn-danger" style="padding:10px 20px;">${ICONS.trash} Excluir Pasta</button>
      </div>
    </div>
  `;

  modalContainer.classList.remove("hidden");
  document.getElementById("btn-cancel-folder-del")?.addEventListener("click", () => modalContainer.classList.add("hidden"), { once: true });
  document.getElementById("btn-confirm-folder-del")?.addEventListener("click", () => {
    deleteFolder(folderId);
    modalContainer.classList.add("hidden");
    renderCharactersList();
  }, { once: true });

  const closeBtn = modalContainer.querySelector(".modal-close");
  if (closeBtn) closeBtn.addEventListener("click", () => modalContainer.classList.add("hidden"), { once: true });
  modalContainer.addEventListener("click", e => {
    if (e.target === modalContainer) modalContainer.classList.add("hidden");
  }, { once: true });
}

function openMoveToFolderModal(itemId, sheetType) {
  const folders = loadFolders();
  let currentItem = null;
  if (sheetType === "infectado") {
    currentItem = state.characters.find(c => c.id === itemId);
  } else if (sheetType === "campanha") {
    const raw = localStorage.getItem("assimilação_managed_campaigns");
    const list = raw ? JSON.parse(raw) : [];
    currentItem = list.find(c => c.code === itemId);
  } else {
    const { worldState } = _getWorldState();
    const prop = sheetType === "refugio" ? "refugios" : sheetType === "regiao" ? "regioes" : sheetType === "conflito" ? "conflitos" : "locais";
    currentItem = (worldState[prop] || []).find(i => i.id === itemId);
  }

  const currentName = currentItem ? (currentItem.name || currentItem.nome || "Ficha") : "Ficha";
  const currentFolderId = currentItem?.folderId || null;

  const modalContainer = el.modalContainer;
  const modalBody = el.modalBody;

  modalBody.innerHTML = `
    <div class="folder-modal-content">
      <h3 class="modal-title">Mover "${escapeHtml(currentName)}" para:</h3>
      <div class="folder-select-list">
        <div class="folder-select-item ${!currentFolderId ? 'is-current' : ''}" data-folder-id="__unassigned__">
          <div class="folder-select-item-left">
            <span class="folder-icon">🗂️</span>
            <span class="folder-select-name">Sem Pasta (Ficha Avulsa)</span>
          </div>
          ${!currentFolderId ? '<span style="color:var(--color-blue-glow);font-size:12px;">✓ Atual</span>' : ''}
        </div>
        ${folders.map(f => `
          <div class="folder-select-item ${f.id === currentFolderId ? 'is-current' : ''}" data-folder-id="${escapeHtml(f.id)}">
            <div class="folder-select-item-left">
              <span class="folder-icon">${f.icon || '📁'}</span>
              <span class="folder-select-name">${escapeHtml(f.name)}</span>
            </div>
            ${f.id === currentFolderId ? '<span style="color:var(--color-blue-glow);font-size:12px;">✓ Atual</span>' : ''}
          </div>
        `).join("")}
      </div>
      <div style="display:flex;gap:10px;justify-content:space-between;align-items:center;margin-top:8px;">
        <button id="btn-create-in-move" class="btn btn-folder-secondary" style="font-size:12px;">
          + Criar Nova Pasta
        </button>
        <button id="btn-close-move" class="btn" style="padding:8px 18px;">Fechar</button>
      </div>
    </div>
  `;

  modalContainer.classList.remove("hidden");

  modalBody.querySelectorAll(".folder-select-item").forEach(itemEl => {
    itemEl.addEventListener("click", () => {
      const targetFolderId = itemEl.dataset.folderId;
      setItemFolder(itemId, sheetType, targetFolderId);
      modalContainer.classList.add("hidden");
      renderCharactersList();
    });
  });

  document.getElementById("btn-create-in-move")?.addEventListener("click", () => {
    modalContainer.classList.add("hidden");
    openCreateFolderModal((newFolder) => {
      setItemFolder(itemId, sheetType, newFolder.id);
      renderCharactersList();
    });
  });

  document.getElementById("btn-close-move")?.addEventListener("click", () => {
    modalContainer.classList.add("hidden");
  });

  const closeBtn = modalContainer.querySelector(".modal-close");
  if (closeBtn) closeBtn.addEventListener("click", () => modalContainer.classList.add("hidden"), { once: true });
  modalContainer.addEventListener("click", e => {
    if (e.target === modalContainer) modalContainer.classList.add("hidden");
  }, { once: true });
}

function setupDragAndDrop() {
  document.querySelectorAll(".character-card[draggable='true']").forEach(card => {
    card.addEventListener("dragstart", (e) => {
      const id = card.dataset.charId;
      const type = card.dataset.sheetType;
      if (!id) return;
      card.classList.add("is-dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", JSON.stringify({ id, type }));
      window._draggingSheet = { id, type };
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("is-dragging");
      window._draggingSheet = null;
      document.querySelectorAll(".drag-target-active").forEach(node => node.classList.remove("drag-target-active"));
    });
  });

  document.querySelectorAll("[data-drop-folder-id]").forEach(dropTarget => {
    dropTarget.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const folderGroup = dropTarget.closest(".folder-group") || dropTarget;
      folderGroup.classList.add("drag-target-active");
    });

    dropTarget.addEventListener("dragleave", (e) => {
      if (!dropTarget.contains(e.relatedTarget)) {
        const folderGroup = dropTarget.closest(".folder-group") || dropTarget;
        folderGroup.classList.remove("drag-target-active");
      }
    });

    dropTarget.addEventListener("drop", (e) => {
      e.preventDefault();
      const folderGroup = dropTarget.closest(".folder-group") || dropTarget;
      folderGroup.classList.remove("drag-target-active");

      let data = window._draggingSheet;
      try {
        const raw = e.dataTransfer.getData("text/plain");
        if (raw) data = JSON.parse(raw);
      } catch (err) {}

      if (!data || !data.id) return;

      const targetFolderId = dropTarget.dataset.dropFolderId;
      setItemFolder(data.id, data.type, targetFolderId);
      renderCharactersList();
    });
  });
}
