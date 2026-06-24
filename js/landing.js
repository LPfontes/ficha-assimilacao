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

let openDropdownId = null;

export function initLandingScreen() {
  btnCreateFirstChar.addEventListener("click", () => {
    startWizard();
  });

  btnImportLanding.addEventListener("click", () => {
    fileImportLanding.click();
  });

  fileImportLanding.addEventListener("change", (e) => {
    importCharacterFromFile(e);
    fileImportLanding.value = "";
  });

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

export function showLandingScreen(restore = true) {
  landingScreen.classList.remove("hidden");
  el.wizardScreen.classList.add("hidden");
  el.sheetScreen.classList.add("hidden");
  if (restore) {
    renderCharactersList();
  }
}

export function renderCharactersList() {
  loadCharactersFromStorage();

  if (emptyState) {
    emptyState.classList.add("hidden");
  }

  const sorted = [...state.characters].sort((a, b) => {
    const aTime = a.id && a.id.startsWith("char_") ? parseInt(a.id.replace("char_", "")) : 0;
    const bTime = b.id && b.id.startsWith("char_") ? parseInt(b.id.replace("char_", "")) : 0;
    return bTime - aTime;
  });

  let cardsHtml = sorted.map(char => {
    const portrait = char.portrait || "";
    const portraitContent = portrait 
      ? `<img src="${escapeHtml(portrait)}" alt="" class="char-card-avatar-img">`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="char-card-avatar-svg"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`;

    return `
      <article class="character-card square-card" data-char-id="${escapeHtml(char.id)}">
        <div class="char-card-avatar">
          ${portraitContent}
        </div>
        <div class="char-card-name">${escapeHtml(char.name)}</div>
        
        <div class="char-actions">
          <button class="btn-char-action" title="Mais ações" data-action="menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
          <div class="char-actions-dropdown" data-dropdown="${escapeHtml(char.id)}">
            <button data-action="export" data-id="${escapeHtml(char.id)}">
              ${ICONS.export} Exportar Ficha
            </button>
            <div class="dropdown-divider"></div>
            <button data-action="duplicate" data-id="${escapeHtml(char.id)}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Duplicar Ficha
            </button>
            <div class="dropdown-divider"></div>
            <button data-action="delete" data-id="${escapeHtml(char.id)}" class="btn-danger-dropdown">
              ${ICONS.trash} Excluir Ficha
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  // Append the "+" card as in the reference screens
  cardsHtml += `
    <article class="character-card square-card create-card" id="btn-create-card">
      <div class="char-card-avatar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="char-card-plus-svg">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <div class="char-card-name">Personagem</div>
    </article>
  `;

  charactersList.innerHTML = cardsHtml;

  attachCardListeners();
}

function attachCardListeners() {
  document.querySelectorAll(".character-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".char-actions") || card.classList.contains("create-card")) return;
      const charId = card.dataset.charId;
      if (charId) handleLoadCharacter(charId);
    });
  });

  const createCard = document.getElementById("btn-create-card");
  if (createCard) {
    createCard.addEventListener("click", () => {
      startWizard();
    });
  }

  document.querySelectorAll("[data-action='menu']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = e.target.closest(".character-card");
      if (card && card.dataset.charId) toggleDropdown(card.dataset.charId);
    });
  });

  document.querySelectorAll("[data-action='export']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const charId = btn.dataset.id;
      if (charId) handleExportCharacter(charId);
      closeDropdown();
    });
  });

  document.querySelectorAll("[data-action='duplicate']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const charId = btn.dataset.id;
      if (charId) handleDuplicateCharacter(charId);
      closeDropdown();
    });
  });

  document.querySelectorAll("[data-action='delete']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const charId = btn.dataset.id;
      if (charId) handleDeleteCharacter(charId);
      closeDropdown();
    });
  });
}

function toggleDropdown(charId) {
  if (openDropdownId === charId) {
    closeDropdown();
    return;
  }
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
  const jsonString = JSON.stringify(char, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
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
    logger.info(`Ficha "${duplicate.name}" duplicada com sucesso.`);
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
      <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: 12px; line-height: 1.5;">
        Tem certeza que deseja apagar permanentemente a ficha de <strong>${escapeHtml(char.name)}</strong>?<br>
        Esta ação não pode ser desfeita.
      </p>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button id="btn-cancel-delete" class="btn" style="padding: 10px 20px;">Cancelar</button>
        <button id="btn-confirm-delete" class="btn btn-danger" style="padding: 10px 20px;">
          ${ICONS.trash} Sim, Excluir
        </button>
      </div>
    </div>
  `;

  modalContainer.classList.remove("hidden");

  document.getElementById("btn-cancel-delete").addEventListener("click", () => {
    modalContainer.classList.add("hidden");
  }, { once: true });

  document.getElementById("btn-confirm-delete").addEventListener("click", () => {
    performDelete(char);
    modalContainer.classList.add("hidden");
  }, { once: true });

  const closeBtn = modalContainer.querySelector(".modal-close");
  if (closeBtn) {
    const handleClose = () => {
      modalContainer.classList.add("hidden");
      closeBtn.removeEventListener("click", handleClose);
    };
    closeBtn.addEventListener("click", handleClose, { once: true });
  }

  const handleOverlay = (e) => {
    if (e.target === modalContainer) {
      modalContainer.classList.add("hidden");
      modalContainer.removeEventListener("click", handleOverlay);
    }
  };
  modalContainer.addEventListener("click", handleOverlay, { once: true });
}

function performDelete(char) {
  const index = state.characters.findIndex(c => c.id === char.id);
  if (index !== -1) {
    state.characters.splice(index, 1);
    try {
      localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
      logger.info(`Ficha de "${char.name}" removida com sucesso.`);
    } catch (e) {
      logger.error("Erro ao salvar após deleção no LocalStorage:", e);
    }
    if (state.currentCharacter && state.currentCharacter.id === char.id) {
      state.currentCharacter = null;
    }
    loadCharactersFromStorage();
    updateCharSelector();
    renderCharactersList();
  }
}

function getTimeAgo(charId) {
  if (!charId || !charId.startsWith("char_")) return "";
  const ts = parseInt(charId.replace("char_", ""));
  if (!ts) return "";
  const diff = Date.now() - ts;
  if (diff < 60000) return "Agora mesmo";
  if (diff < 3600000) return `Há ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Há ${Math.floor(diff / 3600000)}h`;
  return `Há ${Math.floor(diff / 86400000)}d`;
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
      if (!charObj.id || !charObj.name) {
        alert("Ficha inválida! JSON corrompido ou fora do padrão do Assimilação RPG.");
        return;
      }
      charObj.id = "char_" + Date.now();
      state.characters.push(charObj);
      localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
      logger.info(`Ficha de "${charObj.name}" importada com sucesso.`);
      loadCharactersFromStorage();
      updateCharSelector();
      renderCharactersList();
    } catch (err) {
      alert("Erro ao ler o arquivo JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}
