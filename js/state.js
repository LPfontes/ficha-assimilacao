import { renderAptitudesSheet, renderHealthSheet, renderCaboGuerraSheet, renderCharacteristicsSheet, renderMutationsSheet, renderInventorySheet } from "./sheet.js";
import { resetDiceDrawerSelections } from "./roller.js";
import { logger } from "./logger.js";
import { renderChatHistory } from "./chat.js";

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
  charSelector: document.getElementById("char-selector"),
  btnNewChar: document.getElementById("btn-new-char"),
  btnExportJson: document.getElementById("btn-export-json"),
  btnImportJson: document.getElementById("btn-import-json"),
  fileImport: document.getElementById("file-import"),
  btnDeleteChar: document.getElementById("btn-delete-char"),
  btnOpenRoller: document.getElementById("btn-open-roller"),
  btnSettings: document.getElementById("btn-settings"),
  
  // Wizard Navigation
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
  traitsListSheet: document.getElementById("traits-list-sheet"),
  btnAddTraitSheet: document.getElementById("btn-add-trait-sheet"),
  btnAssimilationTest: document.getElementById("btn-assimilation-test"),
  inventoryBodyList: document.getElementById("inventory-body-list"),
  inventoryBackpackList: document.getElementById("inventory-backpack-list"),
  
  // Cabo de Guerra Ficha
  sheetDetLevel: document.getElementById("sheet-det-level"),
  sheetDetPoints: document.getElementById("sheet-det-points"),
  sheetAssLevel: document.getElementById("sheet-ass-level"),
  sheetAssPoints: document.getElementById("sheet-ass-points"),
  inputDetMath: document.getElementById("input-det-math"),
  inputAssMath: document.getElementById("input-ass-math"),
  caboRatioFill: document.getElementById("cabo-ratio-fill"),
  suscetivelAlert: document.getElementById("suscetivel-alert"),
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
  btnAgirInstinto: document.getElementById("btn-agir-instinto"),
  btnRollAction: document.getElementById("btn-roll-action"),
  btnRollCustom: document.getElementById("btn-roll-custom"),
  diceCustomFormula: document.getElementById("dice-custom-formula"),
  
  // Novos Seletores na Gaveta, Overlay e Chat
  rollSelectInstinto: document.getElementById("roll-select-instinto"),
  rollSelectSkill: document.getElementById("roll-select-skill"),
  diceOverlay: document.getElementById("dice-overlay"),
  rollChatMessages: document.getElementById("roll-chat-messages")
};

// ==========================================
// ESTADO COMPARTILHADO DA APLICAÇÃO
// ==========================================
export const state = {
  characters: [],
  currentCharacter: null,
  diceBox: null,
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
    createTestCharacter();
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
    } catch (e) {
      logger.error("Erro ao salvar personagem no LocalStorage:", e);
    }
  }, 500);
}

export function saveCurrentCharacterImmediate() {
  if (!state.currentCharacter) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  try {
    localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
    logger.info(`[IMMEDIATE SAVE] Ficha de "${state.currentCharacter.name}" persistida imediatamente.`);
  } catch (e) {
    logger.error("Erro ao salvar personagem imediatamente no LocalStorage:", e);
  }
}

export function updateCharSelector() {
  el.charSelector.innerHTML = "";
  if (state.characters.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Nenhum personagem salvo";
    opt.disabled = true;
    opt.selected = true;
    el.charSelector.appendChild(opt);
    el.btnExportJson.disabled = true;
    el.btnDeleteChar.disabled = true;
    return;
  }
  
  state.characters.forEach(char => {
    const opt = document.createElement("option");
    opt.value = char.id;
    opt.textContent = char.name;
    if (state.currentCharacter && char.id === state.currentCharacter.id) {
      opt.selected = true;
    }
    el.charSelector.appendChild(opt);
  });
  
  el.btnExportJson.disabled = false;
  el.btnDeleteChar.disabled = false;
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
  el.charNotes.value = char.notes || "";
  el.sheetXpValue.textContent = char.xp;
  
  if (el.portraitImg) {
    el.portraitImg.src = char.portrait || "default_avatar.png";
  }
  
  // Renderiza componentes
  renderAptitudesSheet();
  renderHealthSheet();
  renderCaboGuerraSheet();
  renderCharacteristicsSheet();
  renderMutationsSheet();
  renderInventorySheet();
  
  // Reseta seleção de rolagem
  resetDiceDrawerSelections();

  // Renderiza histórico de rolagens do chat
  renderChatHistory();
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
      } else {
        state.currentCharacter = null;
        const event = new CustomEvent("start-wizard");
        document.dispatchEvent(event);
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
      alert(`Ficha de ${charObj.name} importada com sucesso!`);
    } catch (err) {
      logger.error("Erro ao analisar arquivo JSON importado:", err);
      alert("Erro ao ler o arquivo JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}

// Persistir salvamentos pendentes ao fechar/recarregar a página
window.addEventListener("beforeunload", () => {
  saveCurrentCharacterImmediate();
});
