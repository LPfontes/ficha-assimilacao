import { state } from "./state.js";
import { logger } from "./logger.js";

const FOLDERS_STORAGE_KEY = "assimilação_character_folders";
const UNASSIGNED_COLLAPSED_KEY = "assimilação_unassigned_collapsed";

/**
 * Carrega a lista de pastas salvas no LocalStorage.
 * @returns {Array<{id: string, name: string, icon: string, collapsed: boolean, createdAt: number}>}
 */
export function loadFolders() {
  try {
    const raw = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    logger.error("Erro ao carregar pastas de personagens:", err);
    return [];
  }
}

/**
 * Salva a lista de pastas no LocalStorage.
 * @param {Array} folders 
 */
export function saveFolders(folders) {
  try {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  } catch (err) {
    logger.error("Erro ao salvar pastas de personagens:", err);
  }
}

/**
 * Cria uma nova pasta.
 * @param {string} name 
 * @param {string} icon 
 * @returns {object} Nova pasta criada
 */
export function createFolder(name, icon = "📁") {
  const folders = loadFolders();
  const newFolder = {
    id: `folder_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || "Nova Pasta",
    icon: icon || "📁",
    collapsed: false,
    createdAt: Date.now()
  };
  folders.push(newFolder);
  saveFolders(folders);
  logger.info(`[Folders] Pasta criada: "${newFolder.name}" (${newFolder.id})`);
  return newFolder;
}

/**
 * Renomeia ou altera o ícone de uma pasta existente.
 * @param {string} folderId 
 * @param {string} newName 
 * @param {string} [newIcon] 
 */
export function renameFolder(folderId, newName, newIcon) {
  const folders = loadFolders();
  const folder = folders.find(f => f.id === folderId);
  if (!folder) return null;

  if (newName && newName.trim()) folder.name = newName.trim();
  if (newIcon) folder.icon = newIcon;

  saveFolders(folders);
  logger.info(`[Folders] Pasta renomeada: "${folder.name}" (${folder.id})`);
  return folder;
}

/**
 * Exclui uma pasta e move todos os itens vinculados a ela para "Sem Pasta" (folderId = null).
 * Nenhuma ficha é apagada.
 * @param {string} folderId 
 */
export function deleteFolder(folderId) {
  let folders = loadFolders();
  folders = folders.filter(f => f.id !== folderId);
  saveFolders(folders);

  // 1. Limpar folderId nos personagens
  if (Array.isArray(state.characters)) {
    let updatedChars = false;
    state.characters.forEach(char => {
      if (char.folderId === folderId) {
        char.folderId = null;
        updatedChars = true;
      }
    });
    if (updatedChars) {
      try {
        localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
      } catch (e) {}
    }
  }

  // 2. Limpar folderId nas fichas do worldState
  const worldSheets = ["refugios", "regioes", "conflitos", "locais"];
  const worldKeys = {
    refugios: "assimilação_rpg_refugios",
    regioes: "assimilação_rpg_regioes",
    conflitos: "assimilação_rpg_conflitos",
    locais: "assimilação_rpg_locais"
  };

  worldSheets.forEach(prop => {
    const raw = localStorage.getItem(worldKeys[prop]);
    if (raw) {
      try {
        const list = JSON.parse(raw);
        let changed = false;
        list.forEach(item => {
          if (item.folderId === folderId) {
            item.folderId = null;
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(worldKeys[prop], JSON.stringify(list));
          if (window._worldState && Array.isArray(window._worldState[prop])) {
            window._worldState[prop].forEach(item => {
              if (item.folderId === folderId) item.folderId = null;
            });
          }
        }
      } catch (e) {}
    }
  });

  // 3. Limpar folderId nas campanhas gerenciadas
  const rawCamp = localStorage.getItem("assimilação_managed_campaigns");
  if (rawCamp) {
    try {
      const campList = JSON.parse(rawCamp);
      let campChanged = false;
      campList.forEach(c => {
        if (c.folderId === folderId) {
          c.folderId = null;
          campChanged = true;
        }
      });
      if (campChanged) {
        localStorage.setItem("assimilação_managed_campaigns", JSON.stringify(campList));
      }
    } catch (e) {}
  }

  logger.info(`[Folders] Pasta ${folderId} excluída. Fichas realocadas com segurança.`);
}

/**
 * Alterna o estado de recolhimento (collapsed) de uma pasta.
 * @param {string} folderId 
 * @returns {boolean} Novo estado collapsed
 */
export function toggleFolderCollapsed(folderId) {
  if (folderId === "__unassigned__") {
    const current = isUnassignedCollapsed();
    setUnassignedCollapsed(!current);
    return !current;
  }

  const folders = loadFolders();
  const folder = folders.find(f => f.id === folderId);
  if (!folder) return false;

  folder.collapsed = !folder.collapsed;
  saveFolders(folders);
  return folder.collapsed;
}

/**
 * Define o estado recolhido/expandido de todas as pastas.
 * @param {boolean} collapsed 
 */
export function setAllFoldersCollapsed(collapsed) {
  const folders = loadFolders();
  folders.forEach(f => f.collapsed = collapsed);
  saveFolders(folders);
  setUnassignedCollapsed(collapsed);
}

/**
 * Verifica se a seção "Sem Pasta" está recolhida.
 * @returns {boolean}
 */
export function isUnassignedCollapsed() {
  return localStorage.getItem(UNASSIGNED_COLLAPSED_KEY) === "true";
}

/**
 * Salva o estado de recolhimento da seção "Sem Pasta".
 * @param {boolean} collapsed 
 */
export function setUnassignedCollapsed(collapsed) {
  localStorage.setItem(UNASSIGNED_COLLAPSED_KEY, collapsed ? "true" : "false");
}

/**
 * Atribui ou move uma ficha/item para uma pasta específica (ou null para sem pasta).
 * @param {string} itemId 
 * @param {string} sheetType "infectado" | "refugio" | "regiao" | "conflito" | "local" | "campanha"
 * @param {string|null} folderId 
 */
export function setItemFolder(itemId, sheetType, folderId) {
  const cleanFolderId = (folderId && folderId !== "__unassigned__") ? folderId : null;

  if (sheetType === "infectado") {
    if (Array.isArray(state.characters)) {
      const char = state.characters.find(c => c.id === itemId);
      if (char) {
        char.folderId = cleanFolderId;
        if (state.currentCharacter && state.currentCharacter.id === itemId) {
          state.currentCharacter.folderId = cleanFolderId;
        }
        try {
          localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
          logger.info(`[Folders] Infectado "${char.name}" movido para pasta ${cleanFolderId || "Sem Pasta"}`);
        } catch (e) {
          logger.error("Erro ao salvar personagem com nova pasta:", e);
        }
      }
    }
    return;
  }

  if (sheetType === "campanha") {
    const raw = localStorage.getItem("assimilação_managed_campaigns");
    if (raw) {
      try {
        const list = JSON.parse(raw);
        const camp = list.find(c => c.code === itemId);
        if (camp) {
          camp.folderId = cleanFolderId;
          localStorage.setItem("assimilação_managed_campaigns", JSON.stringify(list));
          logger.info(`[Folders] Campanha "${camp.name}" movida para pasta ${cleanFolderId || "Sem Pasta"}`);
        }
      } catch (e) {}
    }
    return;
  }

  const worldKeys = {
    refugio:  { prop: "refugios",  key: "assimilação_rpg_refugios"  },
    regiao:   { prop: "regioes",   key: "assimilação_rpg_regioes"   },
    conflito: { prop: "conflitos", key: "assimilação_rpg_conflitos" },
    local:    { prop: "locais",    key: "assimilação_rpg_locais"    }
  };

  const meta = worldKeys[sheetType];
  if (meta) {
    const raw = localStorage.getItem(meta.key);
    if (raw) {
      try {
        const list = JSON.parse(raw);
        const item = list.find(i => i.id === itemId);
        if (item) {
          item.folderId = cleanFolderId;
          localStorage.setItem(meta.key, JSON.stringify(list));
          if (window._worldState && Array.isArray(window._worldState[meta.prop])) {
            const wsItem = window._worldState[meta.prop].find(i => i.id === itemId);
            if (wsItem) wsItem.folderId = cleanFolderId;
          }
          logger.info(`[Folders] Item ${sheetType} "${item.nome || item.name}" movido para pasta ${cleanFolderId || "Sem Pasta"}`);
        }
      } catch (e) {}
    }
  }
}
