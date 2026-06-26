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
};

// ---- Estado compartilhado (exportado) ----
export const worldState = {
  refugios:  [],
  regioes:   [],
  conflitos: [],
  locais:    [],
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
    populacao: 0,
    reservas: 0,
    mobilidade: 0,
    defesa: 0,
    moral: 0,
    beligerancia: 0,
    crises: [],     // [{nome, grau, status, descricao}]
    notas: "",
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
    regiaoId: null,
    refugioId: null,
    localId: null,
    notas: "",
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
// LOAD ALL — Chamar na inicialização
// =====================================================
export function loadAllWorldData() {
  loadRefugiosFromStorage();
  loadRegioesFromStorage();
  loadConflitosFromStorage();
  loadLocaisFromStorage();
}
