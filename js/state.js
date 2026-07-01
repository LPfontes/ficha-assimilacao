import { renderAptitudesSheet, renderHealthSheet, renderCaboGuerraSheet, renderCharacteristicsSheet, renderMutationsSheet, renderInventorySheet, renderHomebrewSheet, renderSavedMacrosSheet } from "./sheet.js";
import { resetDiceDrawerSelections } from "./roller.js";
import { logger } from "./logger.js";

// ==========================================
// SELETORES DOM
// ==========================================
export const el = {
  // Telas e Modais
  wizardScreen: document.getElementById("wizard-screen"),
  sheetScreen: document.getElementById("sheet-screen"),
  modalContainer: document.getElementById("modal-container"),
  modalBody: document.getElementById("modal-body"),
  
  // Header Controls
  btnNewChar: document.getElementById("btn-new-char"),
  btnExportJson: document.getElementById("btn-export-json"),
  btnImportJson: document.getElementById("btn-import-json"),
  fileImport: document.getElementById("file-import"),
  btnDeleteChar: document.getElementById("btn-delete-char"),
  btnOpenRoller: document.getElementById("btn-open-roller"),
  btnSettings: document.getElementById("btn-settings"),
  btnManageItems: document.getElementById("btn-manage-items"),
  btnCloudSync: document.getElementById("btn-cloud-sync"),
  btnMobileMenu: document.getElementById("btn-mobile-menu"),
  headerControls: document.querySelector(".header-controls"),
  
  // Wizard Navigation
  btnWizCancel: document.getElementById("btn-wiz-cancel"),
  btnWizPrev: document.getElementById("btn-wiz-prev"),
  btnWizNext: document.getElementById("btn-wiz-next"),
  btnWizFinish: document.getElementById("btn-wiz-finish"),
  
  // Ficha Inputs
  charName: document.getElementById("char-name"),
  charGeneration: document.getElementById("char-generation"),
  charOcupacao: document.getElementById("char-ocupacao"),
  charEvento: document.getElementById("char-evento"),
  charPropP1: document.getElementById("char-prop-p1"),
  charPropP2: document.getElementById("char-prop-p2"),
  charPropCol: document.getElementById("char-prop-col"),
  charPropCol2: document.getElementById("char-prop-col2"),
  charNotes: document.getElementById("char-notes"),
  sheetXpValue: document.getElementById("sheet-xp-value"),
  
  // Retrato/Avatar
  portraitImg: document.getElementById("char-portrait-img"),
  portraitInput: document.getElementById("char-portrait-input"),
  portraitFrame: document.getElementById("portrait-frame"),
  
  // Ficha Lists
  instinctsListSheet: document.getElementById("instincts-list-sheet"),
  conhecimentosListSheet: document.getElementById("conhecimentos-list-sheet"),
  praticasListSheet: document.getElementById("praticas-list-sheet"),
  healthLevelsSheet: document.getElementById("health-levels-sheet"),
  saudeEditControls: document.querySelector(".saude-edit-controls"),
  btnSaudeModDec: document.getElementById("btn-saude-mod-dec"),
  valSaudeMod: document.getElementById("val-saude-mod"),
  btnSaudeModInc: document.getElementById("btn-saude-mod-inc"),
  traitsListSheet: document.getElementById("traits-list-sheet"),
  btnAddTraitSheet: document.getElementById("btn-add-trait-sheet"),
  btnDecXp: document.getElementById("btn-dec-xp"),
  btnIncXp: document.getElementById("btn-inc-xp"),
  btnAssimilationTest: document.getElementById("btn-assimilation-test"),
  inventoryBodyList: document.getElementById("inventory-body-list"),
  inventoryBackpackList: document.getElementById("inventory-backpack-list"),
  btnIncBodySlot: document.getElementById("btn-add-body-slot"),
  btnIncBackpackSlot: document.getElementById("btn-add-backpack-slot"),
  
  // Cabo de Guerra Ficha
  sheetDetLevel: document.getElementById("sheet-det-level"),
  sheetDetPoints: document.getElementById("sheet-det-points"),
  sheetAssLevel: document.getElementById("sheet-ass-level"),
  sheetAssPoints: document.getElementById("sheet-ass-points"),
  inputDetMath: document.getElementById("input-det-math"),
  inputAssMath: document.getElementById("input-ass-math"),
  caboRatioFill: document.getElementById("cabo-ratio-fill"),
  suscetivelAlert: document.getElementById("suscetivel-alert"),
  assimilacaoTotalAlert: document.getElementById("assimilacao-total-alert"),
  btnDecDet: document.getElementById("btn-dec-det"),
  btnIncDet: document.getElementById("btn-inc-det"),
  btnDecAss: document.getElementById("btn-dec-ass"),
  btnIncAss: document.getElementById("btn-inc-ass"),
  btnAvancoAssimilacao: document.getElementById("btn-avanco-assimilacao"),

  
  // Dice Drawer Controls
  diceDrawer: document.getElementById("dice-drawer"),
  btnToggleDrawer: document.getElementById("btn-toggle-drawer"),
  diceQtyD6: document.getElementById("dice-qty-d6"),
  diceQtyD10: document.getElementById("dice-qty-d10"),
  diceQtyD12: document.getElementById("dice-qty-d12"),
  currentRollLabel: document.getElementById("current-roll-label"),
  modEmpenho: document.getElementById("mod-empenho"),
  modOrigemOcupacao: document.getElementById("mod-origem-ocupacao"),
  modOrigemEvento: document.getElementById("mod-origem-evento"),
  modEmpenhoAss: document.getElementById("mod-empenho-ass"),
  modOrigemOcupacaoAss: document.getElementById("mod-origem-ocupacao-ass"),
  modOrigemEventoAss: document.getElementById("mod-origem-evento-ass"),
  modBonusKeep: document.getElementById("mod-bonus-keep"),
  modBonusKeepAss: document.getElementById("mod-bonus-keep-ass"),
  btnAgirInstinto: document.getElementById("btn-agir-instinto"),
  btnRollAction: document.getElementById("btn-roll-action"),
  btnRollCustom: document.getElementById("btn-roll-custom"),
  diceCustomFormula: document.getElementById("dice-custom-formula"),
  
  // Novos Seletores na Gaveta, Overlay e Chat
  rollSelectInstinto: document.getElementById("roll-select-instinto"),
  rollSelectSkill: document.getElementById("roll-select-skill"),
  diceOverlay: document.getElementById("dice-overlay"),
  rollChatMessages: document.getElementById("roll-chat-messages"),
  customRollsListSheet: document.getElementById("custom-rolls-list-sheet"),
  btnAddCustomRoll: document.getElementById("btn-add-custom-roll")
};

// ==========================================
// ESTADO COMPARTILHADO DA APLICAÇÃO
// ==========================================
export const state = {
  characters: [],
  currentCharacter: null,
  diceBox: null,
  currentUser: JSON.parse(localStorage.getItem("assimilação_mock_user")) || null,
  hasUnsavedCloudChanges: localStorage.getItem("assimilação_has_unsaved_changes") === "true",
  // Pilha de dados selecionada para rolagem
  selectedRoll: {
    instinto: "",
    skill: "",
    d6: 0,
    d10: 0,
    d12: 0,
    agirPorInstinto: false
  },
  // Histórico de rolagens recentes
  activeRollResults: [],
  keptDiceIndexes: [],
  // Estado da Mesa de Jogo
  mesa: {
    roomId: null,
    isHost: false,
    players: [],
    mapImage: null,
    rolls: []
  },
  // Estado temporário do Wizard de Criação
  wizardData: {
    step: 1,
    name: "",
    generation: "Pós-Colapso",
    ocupacao: "",
    evento: "",
    propP1: "",
    propP2: "",
    propCol: "",
    propCol2: "",
    instintos: { Influência: 1, Percepção: 1, Potência: 1, Reação: 1, Resolução: 1, Sagacidade: 1 },
    conhecimentos: { Biologia: 0, Erudição: 0, Engenharia: 0, Geografia: 0, Medicina: 0, Segurança: 0 },
    praticas: { Armas: 0, Atletismo: 0, Expressão: 0, Furtividade: 0, Manufaturas: 0, Sobrevivência: 0 },
    detNivel: 9,
    assNivel: 1,
    xp: 7,
    caracteristicas: [], // Array de IDs
    equipamentoPacote: ""
  }
};

// ==========================================
// GERENCIADOR DE ESTADO & ARMAZENAMENTO
// ==========================================
let saveTimeout = null;

export function loadCharactersFromStorage() {
  logger.info("Tentando carregar fichas de personagens do LocalStorage...");
  const data = localStorage.getItem("assimilação_rpg_characters");
  if (data) {
    try {
      state.characters = JSON.parse(data);
      logger.info(`${state.characters.length} ficha(s) de personagem(ns) carregada(s) com sucesso.`);
    } catch (e) {
      logger.error("Erro ao ler dados de personagens do LocalStorage:", e);
      state.characters = [];
    }
  } else {
    logger.warn("Nenhum dado de personagem encontrado no LocalStorage.");
  }
  
  if (!state.characters || state.characters.length === 0) {
    // Sem personagens - landing screen mostrará empty state
  }
  
  updateCharSelector();
}

export function createTestCharacter() {
  logger.info("Criando personagem de teste padrão ('Infectado de Teste').");
  const testChar = {
    id: "char_teste",
    name: "Infectado de Teste",
    portrait: "",
    generation: "Pós-Colapso",
    ocupacao: "Militar Atento",
    evento: "Sobreviveu à Queda",
    propP1: "Achar comida",
    propP2: "Encontrar abrigo",
    propCol: "Proteger refúgio",
    propCol2: "Ajudar necessitados",
    instintos: { Influência: 2, Percepção: 2, Potência: 2, Reação: 2, Resolução: 2, Sagacidade: 2 },
    conhecimentos: { Biologia: 1, Erudição: 1, Engenharia: 1, Geografia: 1, Medicina: 1, Segurança: 1 },
    praticas: { Armas: 1, Atletismo: 1, Expressão: 1, Furtividade: 1, Manufaturas: 1, Sobrevivência: 1 },
    detNivel: 9,
    detPoints: 9,
    assNivel: 1,
    assPoints: 1,
    ptsA: 1,
    ptsB: 0,
    ptsC: 2,
    xp: 3,
    caracteristicas: ["estagio_avancado"],
    mutações: [],
    notes: "Ficha de demonstração gerada automaticamente para testes das mecânicas e rolagens 3D com texturas oficiais.",
    inventario: Array(10).fill(null).map((_, i) => {
      const items = ["Faca", "Corda (15m)", "Pederneira", "Saco de dormir"];
      return items[i] ? { name: items[i], qualidade: false, escassez: false } : { name: "", qualidade: false, escassez: false };
    })
  };
  state.characters = [testChar];
  try {
    localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
    logger.info("Ficha de teste padrão persistida com sucesso.");
  } catch (e) {
    logger.error("Erro ao persistir ficha de teste:", e);
  }
}

export function updateCloudSyncBadge() {
  const badge = document.getElementById("cloud-sync-badge");
  if (badge) {
    if (state.currentUser && state.hasUnsavedCloudChanges) {
      badge.style.display = "block";
      localStorage.setItem("assimilação_has_unsaved_changes", "true");
    } else {
      badge.style.display = "none";
      localStorage.setItem("assimilação_has_unsaved_changes", "false");
    }
  }
}

export function saveCurrentCharacter() {
  if (!state.currentCharacter) return;
  const index = state.characters.findIndex(c => c.id === state.currentCharacter.id);
  if (index !== -1) {
    state.characters[index] = state.currentCharacter;
  } else {
    state.characters.push(state.currentCharacter);
  }

  // Otimização: Debounce no salvamento LocalStorage (500ms)
  if (saveTimeout) clearTimeout(saveTimeout);
  
  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
      logger.info(`[DEBOUNCED SAVE] Ficha de "${state.currentCharacter.name}" salva com sucesso.`);
      if (state.currentUser) {
        state.hasUnsavedCloudChanges = true;
        updateCloudSyncBadge();
      }
    } catch (e) {
      logger.error("Erro ao salvar personagem no LocalStorage:", e);
    }
  }, 500);
  window.dispatchEvent(new CustomEvent("character-saved", { detail: { id: state.currentCharacter.id } }));
}

export function saveCurrentCharacterImmediate() {
  if (!state.currentCharacter) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  try {
    localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
    logger.info(`[IMMEDIATE SAVE] Ficha de "${state.currentCharacter.name}" persistida imediatamente.`);
    if (state.currentUser) {
      state.hasUnsavedCloudChanges = true;
      updateCloudSyncBadge();
    }
  } catch (e) {
    logger.error("Erro ao salvar personagem imediatamente no LocalStorage:", e);
  }
}

export function updateCharSelector() {
}

export function loadCharacter(charId) {
  const char = state.characters.find(c => c.id === charId);
  if (!char) {
    logger.error(`Tentativa fracassada de carregar personagem inexistente com ID: ${charId}`);
    return;
  }
  if (char.ptsA === undefined) char.ptsA = 1;
  if (char.ptsB === undefined) char.ptsB = 0;
  if (char.ptsC === undefined) char.ptsC = 2;
  state.currentCharacter = char;
  logger.info(`Carregando ficha da personagem: "${char.name}" (ID: ${charId})`);
  updateCharSelector();
  
  // Atualiza as Telas
  document.getElementById("landing-screen")?.classList.add("hidden");
  el.wizardScreen.classList.add("hidden");
  el.sheetScreen.classList.remove("hidden");
  
  // Preenche Dados Básicos
  el.charName.value = char.name;
  el.charGeneration.value = char.generation;
  el.charOcupacao.value = char.ocupacao || "";
  el.charEvento.value = char.evento || "";
  el.charPropP1.value = char.propP1 || "";
  el.charPropP2.value = char.propP2 || "";
  el.charPropCol.value = char.propCol || "";
  el.charPropCol2.value = char.propCol2 || "";
  el.charNotes.value = char.notes || "";
  el.sheetXpValue.textContent = char.xp;
  
  if (el.portraitImg) {
    el.portraitImg.src = char.portrait || "";
  }
  
  // Renderiza componentes
  renderAptitudesSheet();
  renderHealthSheet();
  renderCaboGuerraSheet();
  renderCharacteristicsSheet();
  renderMutationsSheet();
  renderInventorySheet();
  renderHomebrewSheet();
  renderSavedMacrosSheet();
  
  // Reseta seleção de rolagem
  resetDiceDrawerSelections();
}

export function deleteActiveCharacter() {
  if (!state.currentCharacter) return;
  const name = state.currentCharacter.name;
  if (confirm(`Tem certeza que deseja apagar a ficha de ${name}? Esta ação não pode ser desfeita.`)) {
    logger.warn(`Iniciando deleção da personagem ativa: "${name}"`);
    const index = state.characters.findIndex(c => c.id === state.currentCharacter.id);
    if (index !== -1) {
      state.characters.splice(index, 1);
      try {
        localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
        logger.info(`Ficha de "${name}" removida com sucesso.`);
      } catch (e) {
        logger.error("Erro ao salvar após deleção no LocalStorage:", e);
      }
      loadCharactersFromStorage();
      if (state.characters.length > 0) {
        loadCharacter(state.characters[0].id);
        import("./chat.js").then(({ renderChatHistory }) => renderChatHistory());
      } else {
        state.currentCharacter = null;
        el.sheetScreen.classList.add("hidden");
        el.wizardScreen.classList.add("hidden");
        const landingScreen = document.getElementById("landing-screen");
        if (landingScreen) {
          landingScreen.classList.remove("hidden");
          import("./landing.js").then(({ renderCharactersList }) => renderCharactersList());
        }
      }
    }
  }
}

export function exportActiveCharacter() {
  if (!state.currentCharacter) return;
  logger.info(`Exportando personagem "${state.currentCharacter.name}" para arquivo JSON.`);
  const jsonString = JSON.stringify(state.currentCharacter, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${state.currentCharacter.name.toLowerCase().replace(/\s+/g, "_")}_ficha.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importCharacterFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  logger.info(`Iniciando importação de ficha do arquivo selecionado: ${file.name}`);
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const charObj = JSON.parse(evt.target.result);
      if (!charObj.id || !charObj.name) {
        logger.error("Falha na importação: arquivo JSON não contém estrutura básica de ficha.");
        alert("Ficha inválida! JSON corrompido ou fora do padrão do Assimilação RPG.");
        return;
      }
      
      charObj.id = "char_" + Date.now();
      state.characters.push(charObj);
      localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
      logger.info(`Ficha de "${charObj.name}" importada com sucesso com novo ID: ${charObj.id}`);
      loadCharactersFromStorage();
      loadCharacter(charObj.id);
      import("./chat.js").then(({ renderChatHistory }) => renderChatHistory());
      alert(`Ficha de ${charObj.name} importada com sucesso!`);
    } catch (err) {
      logger.error("Erro ao analisar arquivo JSON importado:", err);
      alert("Erro ao ler o arquivo JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}

// ==========================================
// HOME BREW — DADOS PERSONALIZADOS
// ==========================================
export function getCustomTraits() {
  try { return JSON.parse(localStorage.getItem("assimilação_homebrew_traits") || "[]"); }
  catch { return []; }
}
export function saveCustomTraits(traits) {
  localStorage.setItem("assimilação_homebrew_traits", JSON.stringify(traits));
}
export function getCustomMutations() {
  try { return JSON.parse(localStorage.getItem("assimilação_homebrew_mutations") || "[]"); }
  catch { return []; }
}
export function saveCustomMutations(mutations) {
  localStorage.setItem("assimilação_homebrew_mutations", JSON.stringify(mutations));
}

// Persistir salvamentos pendentes ao fechar/recarregar a página
window.addEventListener("beforeunload", () => {
  saveCurrentCharacterImmediate();
});
