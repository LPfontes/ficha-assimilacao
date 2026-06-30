import { logger } from "./logger.js";

// =====================================================
// GERENCIADOR DE ESTADO — WORLD SHEETS
// Refúgios, Regiões, Conflitos e Locais
// =====================================================

const STORAGE_KEYS = {
  refugios:  "assimilação_rpg_refugios",
  regioes:   "assimilação_rpg_regioes",
  conflitos: "assimilação_rpg_conflitos",
  locais:    "assimilação_rpg_locais",
  itensDb:   "assimilação_rpg_itens_db",
};

// ---- Estado compartilhado (exportado) ----
export const worldState = {
  refugios:  [],
  regioes:   [],
  conflitos: [],
  locais:    [],
  itensDb:   [],
  currentRefugio:  null,
  currentRegiao:   null,
  currentConflito: null,
  currentLocal:    null,
  sheetMode: "personagem", // "personagem" | "refugio" | "regiao" | "conflito" | "local"
};

// ---- Helpers de storage genéricos ----
function loadFromStorage(key, arrayProp) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key]);
    if (raw) {
      worldState[arrayProp] = JSON.parse(raw);
      logger.info(`[WorldState] ${worldState[arrayProp].length} ficha(s) de ${key} carregada(s).`);
    }
  } catch (e) {
    logger.error(`[WorldState] Erro ao carregar ${key}:`, e);
    worldState[arrayProp] = [];
  }
}

function saveToStorage(key, arrayProp) {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(worldState[arrayProp]));
  } catch (e) {
    logger.error(`[WorldState] Erro ao salvar ${key}:`, e);
  }
}

function upsert(arrayProp, item) {
  const idx = worldState[arrayProp].findIndex(i => i.id === item.id);
  if (idx !== -1) {
    worldState[arrayProp][idx] = item;
  } else {
    worldState[arrayProp].push(item);
  }
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}`;
}

// =====================================================
// REFÚGIOS
// =====================================================
export function loadRefugiosFromStorage() {
  loadFromStorage("refugios", "refugios");
}

export function saveRefugio(refugio) {
  upsert("refugios", refugio);
  saveToStorage("refugios", "refugios");
}

export function deleteRefugio(id) {
  worldState.refugios = worldState.refugios.filter(r => r.id !== id);
  saveToStorage("refugios", "refugios");
  if (worldState.currentRefugio?.id === id) worldState.currentRefugio = null;
}

export function createNewRefugio(name = "Novo Refúgio") {
  return {
    id: generateId("refugio"),
    tipo: "refugio",
    nome: name,
    imagem: "",
    descricao: "",
    populacao: 0,
    populacaoMax: 10,
    reservas: 0,
    reservasMax: 10,
    mobilidade: 0,
    defesa: 0,
    moral: 0,
    beligerancia: 0,
    recursos: {
      agua: 0,
      plantas: 0,
      animais: 0,
      madeira: 0,
      minerais: 0,
      biomassa: 0,
      alimento: 0,
      vestuario: 0,
      municao: 0,
      combustivel: 0,
      remedios: 0,
      mat_constr: 0
    },
    construcoes: [], // [{nome, nivel, descricao}]
    crises: [],     // [{nome, grau, status, descricao}]
    notas: "",
    regiaoId: null,
    localId: null,
  };
}

// =====================================================
// REGIÕES
// =====================================================
export function loadRegioesFromStorage() {
  loadFromStorage("regioes", "regioes");
}

export function saveRegiao(regiao) {
  upsert("regioes", regiao);
  saveToStorage("regioes", "regioes");
}

export function deleteRegiao(id) {
  worldState.regioes = worldState.regioes.filter(r => r.id !== id);
  saveToStorage("regioes", "regioes");
  if (worldState.currentRegiao?.id === id) worldState.currentRegiao = null;
}

export function createNewRegiao(name = "Nova Região") {
  return {
    id: generateId("regiao"),
    tipo: "regiao",
    nome: name,
    imagem: "",
    descricao: "",
    tamanho: 3,
    perigo: 2,
    habitacao: 1,
    recursosNaturais: 0,
    tiposRecursos: {},  // { "Água": "inexistente", "Plantas": "inexistente", ... }
    contaminacao: 1,
    deslocamento: 3,
    marcosGeograficos: [], // [{nome, descricao}]
    conflitosAssociados: [],  // IDs de Conflitos
    refugiosAssociados: [],   // IDs de Refúgios
    locaisAssociados: [],     // IDs de Locais
    notas: "",
  };
}

// =====================================================
// CONFLITOS
// =====================================================
export function loadConflitosFromStorage() {
  loadFromStorage("conflitos", "conflitos");
}

export function saveConflito(conflito) {
  upsert("conflitos", conflito);
  saveToStorage("conflitos", "conflitos");
}

export function deleteConflito(id) {
  worldState.conflitos = worldState.conflitos.filter(c => c.id !== id);
  saveToStorage("conflitos", "conflitos");
  if (worldState.currentConflito?.id === id) worldState.currentConflito = null;
}

export function createNewConflito(name = "Novo Conflito") {
  return {
    id: generateId("conflito"),
    tipo: "conflito",
    nome: name,
    imagem: "",
    tipoConflito: "Outro",
    grau: 1,
    descricao: "",
    status: "Ativo",
    ativacoes: [],
    rolagens: [],
    regiaoId: null,
    refugioId: null,
    localId: null,
    notas: "",
    objetivoPrincipal: "",
    objetivoSecundario: "",
    objPrincipalVal: 0,
    objSecundarioVal: 0,
    condicionantes: [],
  };
}

// =====================================================
// LOCAIS
// =====================================================
export function loadLocaisFromStorage() {
  loadFromStorage("locais", "locais");
}

export function saveLocal(local) {
  upsert("locais", local);
  saveToStorage("locais", "locais");
}

export function deleteLocal(id) {
  worldState.locais = worldState.locais.filter(l => l.id !== id);
  saveToStorage("locais", "locais");
  if (worldState.currentLocal?.id === id) worldState.currentLocal = null;
}

export function createNewLocal(name = "Novo Local") {
  return {
    id: generateId("local"),
    tipo: "local",
    nome: name,
    tipoLocal: "Outro",
    imagem: "",
    descricao: "",
    itens: [],   // [{nome, escassez, descricao}]
    infectadosAssociados: [],  // IDs de personagens
    conflitosAssociados: [],   // IDs de Conflitos
    regiaoId: null,
    notas: "",
    pontosInteresse: [], // [{nome, descricao}]
  };
}

// =====================================================
// HELPERS DE LOOKUP (para painéis de referência)
// =====================================================
export function getRefugioById(id) {
  return worldState.refugios.find(r => r.id === id) || null;
}
export function getRegiaoById(id) {
  return worldState.regioes.find(r => r.id === id) || null;
}
export function getConflitoById(id) {
  return worldState.conflitos.find(c => c.id === id) || null;
}
export function getLocalById(id) {
  return worldState.locais.find(l => l.id === id) || null;
}

// =====================================================
// BANCO DE ITENS COMPARTILHADO
// =====================================================

import { DEFAULT_ITENS_DB } from "./dados.js";

export function loadItensDb() {
  try {
    const raw = localStorage.getItem("assimilação_rpg_itens_db");
    if (raw) {
      worldState.itensDb = JSON.parse(raw);
    } else {
      worldState.itensDb = [];
    }
  } catch (e) {
    logger.error("[WorldState] Erro ao carregar banco de itens:", e);
    worldState.itensDb = [];
  }

  // Popula itens default que não estejam no DB, e atualiza propriedades ausentes
  let dbChanged = false;
  for (const defaultItem of DEFAULT_ITENS_DB) {
    const existing = worldState.itensDb.find(i => i.name.toLowerCase() === defaultItem.name.toLowerCase());
    if (!existing) {
      worldState.itensDb.push(defaultItem);
      dbChanged = true;
    } else {
      if (!existing.categorias && defaultItem.categorias) {
        existing.categorias = defaultItem.categorias;
        dbChanged = true;
      }
    }
  }

  if (dbChanged) {
    localStorage.setItem("assimilação_rpg_itens_db", JSON.stringify(worldState.itensDb));
  }
}

export function saveItemToDb(item) {
  if (!item || !item.name || item.name.trim() === "") return;
  const nameClean = item.name.trim();
  
  if (!worldState.itensDb) worldState.itensDb = [];
  
  // Encontra item por nome (case insensitive)
  const idx = worldState.itensDb.findIndex(i => i.name.toLowerCase() === nameClean.toLowerCase());
  
  const itemToSave = {
    name: nameClean,
    efeito: item.efeito || "",
    escassez: item.escassez !== undefined ? item.escassez : 2,
    peso: item.peso !== undefined ? item.peso : 1,
    categorias: item.categorias || (item.categoria && item.categoria !== 'nenhuma' ? [item.categoria] : []),
  };

  if (idx !== -1) {
    worldState.itensDb[idx] = itemToSave;
  } else {
    worldState.itensDb.push(itemToSave);
  }
  
  try {
    localStorage.setItem("assimilação_rpg_itens_db", JSON.stringify(worldState.itensDb));
  } catch (e) {
    logger.error("[WorldState] Erro ao salvar banco de itens:", e);
  }
}

export function loadAmeacasFromDb() {
  try {
    const raw = localStorage.getItem("assimilação_rpg_ameacas_db");
    if (raw) {
      worldState.ameacasDb = JSON.parse(raw);
    } else {
      worldState.ameacasDb = [];
    }
  } catch (e) {
    logger.error("[WorldState] Erro ao carregar banco de ameaças:", e);
    worldState.ameacasDb = [];
  }
}

export function saveAmeacaToDb(ameaca) {
  if (!ameaca || !ameaca.nome || ameaca.nome.trim() === "") return;
  const nameClean = ameaca.nome.trim();

  if (!worldState.ameacasDb) worldState.ameacasDb = [];

  const idx = worldState.ameacasDb.findIndex(a => a.nome.toLowerCase() === nameClean.toLowerCase());

  const ameacaToSave = {
    nome: nameClean,
    descricao: ameaca.descricao || "",
    d6: ameaca.d6 !== undefined ? ameaca.d6 : 1,
    d10: ameaca.d10 !== undefined ? ameaca.d10 : 0,
    d12: ameaca.d12 !== undefined ? ameaca.d12 : 0,
    objetivoTipo: ameaca.objetivoTipo || "Principal"
  };

  if (idx !== -1) {
    worldState.ameacasDb[idx] = ameacaToSave;
  } else {
    worldState.ameacasDb.push(ameacaToSave);
  }

  try {
    localStorage.setItem("assimilação_rpg_ameacas_db", JSON.stringify(worldState.ameacasDb));
  } catch (e) {
    logger.error("[WorldState] Erro ao salvar banco de ameaças:", e);
  }
}

// =====================================================
// LOAD ALL — Chamar na inicialização
// =====================================================
export function loadAllWorldData() {
  loadRefugiosFromStorage();
  loadRegioesFromStorage();
  loadConflitosFromStorage();
  loadLocaisFromStorage();
  loadItensDb();
  loadAmeacasFromDb();
}
