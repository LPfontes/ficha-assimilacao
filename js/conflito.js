import { worldState, saveConflito, deleteConflito, createNewConflito, saveAmeacaToDb } from "./world-state.js";
import { hideAllScreens, goToLanding, esc, setupImageUpload } from "./screen-utils.js";
import { renderImageFrame, renderAttrDots, renderStatusBadge, renderRefPanelSingle } from "./screen-components.js";
import { openSelectReferencesModal } from "./modals.js";
import { executeCustomRoll } from "./roller.js";
import { getDieFaceImgSrc } from "./chat.js";

const TIPO_CONFLITO = ["Doença", "Criatura", "Rebelião", "Ataque Externo", "Escassez", "Outro"];
const STATUS_CONFLITO = ["Ativo", "Contido", "Resolvido"];
const STATUS_CLASS_MAP = {
  "Ativo": "status-ativo",
  "Contido": "status-contido",
  "Resolvido": "status-resolvido"
};

const _USE_SIMBOLOS_ALT_KEY = "conflito_simbolos_alt";
function _isSimbolosAlt() { return localStorage.getItem(_USE_SIMBOLOS_ALT_KEY) === "true"; }
function _toggleSimbolos() {
  const cur = _isSimbolosAlt();
  localStorage.setItem(_USE_SIMBOLOS_ALT_KEY, cur ? "false" : "true");
}
function _diceImg(type) {
  if (_isSimbolosAlt()) {
    const map = { S: "assets/sucesso.webp", A: "assets/adaptacao.webp", P: "assets/pressao.webp" };
    return map[type] || `assets/d6/${type}.webp`;
  }
  const map = { S: "assets/d6/6(D6).webp", A: "assets/d6/ad.webp", P: "assets/d6/3-4(D6).webp" };
  return map[type] || `assets/d6/${type}.webp`;
}

let activeThreatIdxForModal = null;
let editingActivationState = null; // { idx, ameacaIdx (or null), isAmeaca }
let _editingAmeacaIdx = null;
let _pendingAmeacaRollIdx = null;

function _renderTriggerBadges(gatilho) {
  const chars = gatilho.toUpperCase().replace(/\s+/g, "").split("");
  return chars.map(char => {
    if (char === "C" || char === "P") {
      return `
      <div class="investimento-control-group group-p">
      <img src="${_diceImg('P')}" alt="P" title="Pressão" class="conflito-trigger-badge-img badge-img-p">
      </div>`;
    } else if (char === "S") {
      return `<div class="investimento-control-group group-s">
      <img src="${_diceImg('S')}" alt="S" title="Sucesso" class="conflito-trigger-badge-img badge-img-s">
      </div>`;
    } else if (char === "B" || char === "A") {
      return `
      <div class="investimento-control-group group-a">
      <img src="${_diceImg('A')}" alt="A" title="Adaptação" class="conflito-trigger-badge-img badge-img-a">
      </div>`;
    }
    return `<span class="conflito-trigger-badge-char">${char}</span>`;
  }).join("");
}

function _getAtivacaoItemClass(isCompleted, extraClass) {
  let cls = "conflito-ativacao-item";
  if (isCompleted) cls += " completed-item";
  if (extraClass) cls += " " + extraClass;
  return cls;
}

function _renderAmeacaActivations(a, ameacaIdx) {
  if (!a.ativacoes || a.ativacoes.length === 0) {
    return `<div class="ameaca-ativacao-empty">Nenhuma ativação específica.</div>`;
  }
  return a.ativacoes.map((act, actIdx) => {
    const cleanTrigger = act.gatilho.toUpperCase().replace(/\s+/g, "");
    const requiredS = (cleanTrigger.match(/S/g) || []).length;
    const requiredA = (cleanTrigger.match(/[AB]/g) || []).length;
    const requiredP = (cleanTrigger.match(/[CP]/g) || []).length;
    const totalRequired = requiredS + requiredA + requiredP;

    const investedS = act.investedS || 0;
    const investedA = act.investedA || 0;
    const investedP = act.investedP || 0;
    const totalInvested = investedS + investedA + investedP;

    const isCompleted = totalRequired > 0 &&
      investedS >= requiredS &&
      investedA >= requiredA &&
      investedP >= requiredP;

    return `
      <div class="${_getAtivacaoItemClass(isCompleted, 'ameaca-ativacao-card')}">
        <!-- Partitura da Ameaça -->
        <div class="conflito-ativacao-investimento ameaca-ativacao-investimento">
        <div class="investimento-label-row" style="display:flex; align-items: center; gap:4px; ">
          <span class="investimento-label">Partitura:</span>
          <button class="btn-delete-ativacao-ameaca btn-danger btn-sm" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" title="Excluir Ativação da Ameaça">&times;</button>
          <div class="investimento-controls">
            ${requiredS > 0 ? `
            <div class="investimento-control-group group-s">
              <img src="${_diceImg('S')}" alt="S" title="Sucesso" class="conflito-trigger-badge-img badge-img-s">
              <button type="button" class="btn-invest-ameaca-dec btn-invest-mini" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" data-type="S">-</button>
              <span class="invest-val ${investedS >= requiredS && requiredS > 0 ? 'met' : ''}">${investedS}/${requiredS}</span>
              <button type="button" class="btn-invest-ameaca-inc btn-invest-mini" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" data-type="S">+</button>
            </div>` : ""}
            ${requiredA > 0 ? `
            <div class="investimento-control-group group-a">
              <img src="${_diceImg('A')}" alt="A" title="Adaptação" class="conflito-trigger-badge-img badge-img-a">
              <button type="button" class="btn-invest-ameaca-dec btn-invest-mini" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" data-type="A">-</button>
              <span class="invest-val ${investedA >= requiredA && requiredA > 0 ? 'met' : ''}">${investedA}/${requiredA}</span>
              <button type="button" class="btn-invest-ameaca-inc btn-invest-mini" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" data-type="A">+</button>
            </div>` : ""}
            ${requiredP > 0 ? `
            <div class="investimento-control-group group-p">
              <img src="${_diceImg('P')}" alt="P" title="Pressão" class="conflito-trigger-badge-img badge-img-p">
              <button type="button" class="btn-invest-ameaca-dec btn-invest-mini" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" data-type="P">-</button>
              <span class="invest-val ${investedP >= requiredP && requiredP > 0 ? 'met' : ''}">${investedP}/${requiredP}</span>
              <button type="button" class="btn-invest-ameaca-inc btn-invest-mini" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" data-type="P">+</button>
            </div>` : ""}
            <div class="conflito-ativacao-title-row-left">
              <span class="conflito-ativacao-titulo ameaca-ativacao-titulo">Ativação</span>
            </div>
          </div>
          </div
          
          <div class="conflito-ativacao-info">
            <span class="conflito-ativacao-titulo ameaca-ativacao-titulo">${esc(act.titulo)}</span>
            <div class="conflito-ativacao-efeito ameaca-ativacao-efeito">${esc(act.efeito)}</div>
          </div>
        </div>

        <div style="display:flex; gap:4px; margin-top:4px;">
          ${isCompleted ? `<button class="btn-reset-ativacao-ameaca" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" title="Gastar todas as investidas e resetar" style="background:rgba(255,255,0,0.1); border:1px solid rgba(255,200,0,0.3); color:var(--color-gold-glow); font-size:10px; padding:2px 8px; border-radius:3px; cursor:pointer;">Gastar</button>` : ""}
          <button class="btn-edit-ativacao-ameaca" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" title="Editar Ativação da Ameaça" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--text-secondary); font-size:10px; padding:2px 8px; border-radius:3px; cursor:pointer;">Editar</button>
        </div>
      </div>
    `;
  }).join("");
}

function getScreen() { return document.getElementById("conflito-screen"); }

function _renderCondicionantes(condicionantes) {
  if (!condicionantes || condicionantes.length === 0) {
    return `<div class="world-list-empty" style="font-size: 11px; padding: 12px; color: var(--text-muted);">Nenhum condicionante cadastrado.</div>`;
  }
  return condicionantes.map((cond, idx) => `
    <div class="world-list-item" data-cond-idx="${idx}" style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.06);">
      <input type="text" class="cond-texto" value="${esc(cond)}" placeholder="Ex: Ao sofrer dano, ganha +1 Pressão..." style="flex: 1; font-size: 12px; background: transparent; border: none; color: #fff; padding: 2px 0; outline: none;">
      <button class="btn btn-sm btn-danger btn-remove-cond" data-idx="${idx}" style="padding: 1px 6px; font-size: 11px; height: 18px; line-height: 1.2;">&times;</button>
    </div>
  `).join("");
}

function _renderObjetivosPrincipais(objetivosPrincipais) {
  if (!objetivosPrincipais || objetivosPrincipais.length === 0) {
    return `<div class="world-list-empty" style="font-size: 11px; padding: 12px; color: var(--text-muted);">Nenhum objetivo principal definido.</div>`;
  }
  return objetivosPrincipais.map((obj, idx) => `
    <div class="objetivo-principal-item" data-obj-idx="${idx}" style="margin-bottom: 12px; padding: 8px; border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.15); border-radius: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <label class="ws-label" style="margin-bottom: 0;">Objetivo Principal ${idx + 1}</label>
        <div class="conflito-qty-controls" style="display:flex; align-items:center; gap:4px;">
          <button type="button" class="btn-obj-princ-dec" data-idx="${idx}">-</button>
          <input type="number" value="${obj.valor || 0}" min="0" max="99" class="conflito-dado-input obj-princ-val" readonly style="width: 32px; text-align: center;">
          <button type="button" class="btn-obj-princ-inc" data-idx="${idx}">+</button>
          <button type="button" class="btn btn-sm btn-danger btn-remove-obj-princ" data-idx="${idx}" style="margin-left:8px; font-size:12px; padding:2px 6px;">&times;</button>
        </div>
      </div>
      <textarea class="ws-textarea obj-princ-desc" placeholder="Descreva o objetivo principal..." style="min-height: 48px; font-size: var(--font-size-md);">${esc(obj.descricao || '')}</textarea>
    </div>
  `).join("");
}

function _renderObjetivosSecundarios(objetivosSecundarios) {
  if (!objetivosSecundarios || objetivosSecundarios.length === 0) {
    return `<div class="world-list-empty" style="font-size: 11px; padding: 12px; color: var(--text-muted);">Nenhum objetivo secundário definido.</div>`;
  }
  return objetivosSecundarios.map((obj, idx) => `
    <div class="objetivo-secundario-item" data-obj-idx="${idx}" style="margin-bottom: 12px; padding: 8px; border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.15); border-radius: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <label class="ws-label" style="margin-bottom: 0;">Objetivo Secundário ${idx + 1}</label>
        <div class="conflito-qty-controls" style="display:flex; align-items:center; gap:4px;">
          <button type="button" class="btn-obj-sec-dec btn-conf-qty-dec" data-idx="${idx}">-</button>
          <input type="number" value="${obj.valor || 0}" min="0" max="99" class="conflito-dado-input obj-sec-val" readonly style="width: 32px; text-align: center;">
          <button type="button" class="btn-obj-sec-inc btn-conf-qty-inc" data-idx="${idx}">+</button>
          <button type="button" class="btn btn-sm btn-danger btn-remove-obj-sec" data-idx="${idx}" style="margin-left:8px; font-size:12px; padding:2px 6px;">&times;</button>
        </div>
      </div>
      <textarea class="ws-textarea obj-sec-desc" placeholder="Descreva o objetivo secundário..." style="min-height: 48px; font-size: var(--font-size-md);">${esc(obj.descricao || '')}</textarea>
    </div>
  `).join("");
}

function _renderAmeacas(c) {
  if (!c.ameacas) c.ameacas = [];
  if (c.ameacas.length === 0) {
    return `<div class="world-list-empty">Nenhuma ameaça cadastrada neste conflito.</div>`;
  }
  return c.ameacas.map((a, idx) => {
    const diceDesc = [
      a.d6 > 0 ? `${a.d6}d6` : '',
      a.d10 > 0 ? `${a.d10}d10` : '',
      a.d12 > 0 ? `${a.d12}d12` : ''
    ].filter(Boolean).join(" + ") || "Sem dados";

    const badgeColor = a.objetivoTipo === "Principal" ? "var(--color-rust)" : (a.objetivoTipo === "Secundário" ? "var(--color-gold-glow)" : "rgba(255,255,255,0.15)");
    const badgeText = a.objetivoTipo || "Principal";

    return `
      <div class="world-list-item conflito-ameaca-card">
        
      <div class="conflito-ameaca-title-row">
          <span>${esc(a.nome)}</span>
          <span class="attr-value-badge">${badgeText}</span>
          <button class="btn btn-sm btn-edit-ameaca btn-blue" data-idx="${idx}" title="Editar Ameaça">Editar</button>
          <button class="btn btn-sm btn-danger btn-remove-ameaca" data-idx="${idx}">&times;</button>
        </div>
        <div class="conflito-ameaca-descricao">
          ${esc(a.descricao || "Sem descrição.")}
        </div>

        <!-- Lista de Ativações da Ameaça -->
        <div class="ameaca-ativacoes-container">
        <button type="button" class="btn btn-sm btn-add-ativacao-ameaca btn-blue" data-ameaca-idx="${idx}">+ Ativação</button>
          <div class="ameaca-ativacoes-header">
            <div id="conflito-last-roll-container-ameaca-${idx}" class="conflito-last-roll-counter">
              <span class="last-roll-label">Disponível:</span>
              <span class="conflito-result-badge badge-s" title="Sucessos">S: 0</span>
              <span class="conflito-result-badge badge-a" title="Adaptações">A: 0</span>
              <span class="conflito-result-badge badge-p" title="Ameaças/Pressões">P: 0</span>
            </div>
            <span>Ativações da Ameaça</span>
            <div class="conflito-ativacao-header-row">
              <div class="conflito-ameaca-actions">
                <button class="btn btn-sm btn-roll-ameaca btn-blue" data-idx="${idx}">🎲 Rolar</button>
              </div>
              <span>Dados: ${diceDesc}</span>
            </div>
          </div>
          <div class="ameaca-ativacoes-list">
            ${_renderAmeacaActivations(a, idx)}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

export function loadConflitoSheet(conflito) {
  if (!conflito.objetivosSecundarios) {
    conflito.objetivosSecundarios = [];
    if (conflito.objetivoSecundario) {
      conflito.objetivosSecundarios.push({
        descricao: conflito.objetivoSecundario,
        valor: conflito.objSecundarioVal || 0
      });
    }
  }
  if (!conflito.objetivosPrincipais) {
    conflito.objetivosPrincipais = [];
    if (conflito.objetivoPrincipal) {
      conflito.objetivosPrincipais.push({
        descricao: conflito.objetivoPrincipal,
        valor: conflito.objPrincipalVal || 0
      });
    }
  }
  worldState.currentConflito = conflito;
  worldState.sheetMode = "conflito";
  hideAllScreens();
  getScreen().classList.remove("hidden");
  renderConflitoSheet();
}

export function renderConflitoSheet() {
  const c = worldState.currentConflito;
  if (!c) return;
  if (!c.ativacoes) {
    c.ativacoes = [];
  }

  const hasOnlyC = c.ativacoes.some(act => {
    const clean = act.gatilho.toUpperCase().replace(/\s+/g, "");
    return clean.length > 0 && /^[CP]+$/.test(clean);
  });

  const hasOnlyS = c.ativacoes.some(act => {
    const clean = act.gatilho.toUpperCase().replace(/\s+/g, "");
    return clean.length > 0 && /^[S]+$/.test(clean);
  });

  const screen = getScreen();

  screen.innerHTML = `
    <div class="world-sheet-screen">
      <div class="world-sheet-header">
        <button class="sheet-back-btn" id="btn-conflito-back">← Voltar</button>
        <div class="world-sheet-title-group">
          <input class="world-name-input" id="conflito-nome" type="text" value="${esc(c.nome)}" placeholder="Nome do Conflito">
        </div>
        ${renderStatusBadge(c.status, STATUS_CLASS_MAP)}
        <button class="btn btn-danger btn-sm" id="btn-conflito-delete">Excluir</button>
      </div>
      <div class="world-sheet-body">

        <!-- Coluna 1: Referências -->
        <div class="card-glass conflito-col-refs">
          <div class="conflito-refs-top-grid">
            ${renderImageFrame(c, "conflito")}
            <div class="conflito-refs-top-fields">
              <div class="select-attr-row">
                <label for="conflito-tipo">Tipo</label>
                <select id="conflito-tipo">
                  ${TIPO_CONFLITO.map(t => `<option ${t === c.tipoConflito ? "selected" : ""}>${t}</option>`).join("")}
                </select>
              </div>
              <div class="select-attr-row">
                <label for="conflito-status">Status</label>
                <select id="conflito-status">
                  ${STATUS_CONFLITO.map(s => `<option ${s === c.status ? "selected" : ""}>${s}</option>`).join("")}
                </select>
              </div>
              <div class="conflito-grau-row">
                <div class="conflito-grau-label">
                  <label class="ws-label ws-label-inline" style="min-width:100px;">Grau</label>
                  <span class="attr-value-badge" id="conflito-grau-val">${c.grau}</span>
                </div>
                <div class="attr-dots" id="conflito-grau-dots">
                  ${Array.from({ length: 10 }, (_, i) => `<span class="attr-dot${i < c.grau ? ' filled attr-dot-danger' : ''}" data-idx="${i}"></span>`).join("")}
                </div>
              </div>
            </div>
          </div>
          <h3 class="ws-section-title conflito-section-title" style="margin-top: 4px;">Referências (Opcionais)</h3>
          ${renderRefPanelSingle("Região Associada", "conflito-ref-regiao", c.regiaoId, "regioes")}
          ${renderRefPanelSingle("Refúgio Associado", "conflito-ref-refugio", c.refugioId, "refugios")}
          ${renderRefPanelSingle("Local Associado", "conflito-ref-local", c.localId, "locais")}
          <div>
            <label class="ws-label">Anotações</label>
            <textarea id="conflito-notas" class="ws-textarea conflito-notas-textarea" placeholder="Notas da sessão...">${esc(c.notas)}</textarea>
          </div>

        </div>

        <!-- Coluna 2: Dados -->
        <div class="card-glass conflito-col-dados">
            <h3 class="ws-section-title conflito-section-title">Dados do Conflito</h3>
            
            <div class="conflito-dados-mid-grid">
              <div class="conflito-rolagem-panel">
                <!-- d6 Row -->
                <div class="conflito-dado-row">
                  <span class="conflito-dado-title">DADOS D6</span>
                  <div class="conflito-qty-controls">
                    <button type="button" class="btn-conf-qty-dec" data-sides="6">-</button>
                    <input type="number" id="conflito-roll-d6" value="${(c.d6Count ?? c.grau) || 1}" min="0" max="20" class="conflito-dado-input" readonly>
                    <button type="button" class="btn-conf-qty-inc" data-sides="6">+</button>
                  </div>
                </div>
                
                <!-- d10 Row -->
                <div class="conflito-dado-row">
                  <span class="conflito-dado-title">DADOS D10</span>
                  <div class="conflito-qty-controls">
                    <button type="button" class="btn-conf-qty-dec" data-sides="10">-</button>
                    <input type="number" id="conflito-roll-d10" value="${c.d10Count || 0}" min="0" max="20" class="conflito-dado-input" readonly>
                    <button type="button" class="btn-conf-qty-inc" data-sides="10">+</button>
                  </div>
                </div>

                <!-- d12 Row -->
                <div class="conflito-dado-row">
                  <span class="conflito-dado-title">DADOS D12</span>
                  <div class="conflito-qty-controls">
                    <button type="button" class="btn-conf-qty-dec" data-sides="12">-</button>
                    <input type="number" id="conflito-roll-d12" value="${c.d12Count || 0}" min="0" max="20" class="conflito-dado-input" readonly>
                    <button type="button" class="btn-conf-qty-inc" data-sides="12">+</button>
                  </div>
                </div>

                <button id="btn-conflito-roll" class="btn btn-sm btn-block conflito-roll-btn">
                  🎲 Rolar Conflito
                </button>
              </div>

              <!-- Condicionantes -->
              <div class="conflito-condicionantes-section" style="background:transparent;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <h4 class="ws-label" style="margin: 0; font-size: var(--font-size-md);">Condicionantes da Cena</h4>
                  <button type="button" class="btn btn-sm btn-blue" id="btn-conflito-add-cond" style="font-size: 12px; padding: 2px 10px; line-height: 1.2;">+ Condicionante</button>
                </div>
                <div id="conflito-condicionantes-list" class="conflito-condicionantes-list">
                  ${_renderCondicionantes(c.condicionantes)}
                </div>
              </div>
            </div>
            
            <div class="conflito-objetivos-panel">
              <div id="conflito-objetivos-principais-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <label class="ws-label" style="margin-bottom: 0;">Objetivos Principais</label>
                  <button type="button" class="btn btn-sm btn-blue" id="btn-conflito-add-obj-princ" style="font-size: 12px; padding: 2px 10px; line-height: 1.2;">+ Objetivo</button>
                </div>
                <div id="conflito-objetivos-princ-list" class="conflito-objetivos-princ-list">
                  ${_renderObjetivosPrincipais(c.objetivosPrincipais)}
                </div>
              </div>
              <div id="conflito-objetivos-secundarios-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <label class="ws-label" style="margin-bottom: 0;">Objetivos Secundários</label>
                  <button type="button" class="btn btn-sm btn-blue" id="btn-conflito-add-obj-sec" style="font-size: 10px; padding: 2px 8px; line-height: 1.2;">+ Objetivo</button>
                </div>
                <div id="conflito-objetivos-sec-list" class="conflito-objetivos-sec-list">
                  ${_renderObjetivosSecundarios(c.objetivosSecundarios)}
                </div>
              </div>
            </div>
            
          <!-- Rolagem de Conflito integrada -->
          <div class="conflito-rolagem-wrapper">
            <div class="conflito-rolagem-container">
              <!-- Log de Rolagens ao lado -->
              <div class="conflito-rolagem-log">
                <div class="conflito-log-header">
                  <span>Histórico de Rolagens</span>
                  <button id="btn-conflito-clear-log" class="btn btn-sm btn-danger btn-conflito-clear-log" style="font-size: 10px; padding: 2px 6px; line-height: 1.2;" title="Limpar Histórico">Limpar</button>
                </div>
                <div id="conflito-rolagem-log-list" class="conflito-rolagem-log-list">
                  <!-- Será preenchido dinamicamente -->
                </div>
              </div>
            </div>
          </div>

          <div class="conflito-narrativa-wrapper">
            <label class="ws-label">Descrição / Contexto Narrativo</label>
            <textarea id="conflito-descricao" class="ws-textarea conflito-descricao-textarea" placeholder="Descreva o conflito...">${esc(c.descricao)}</textarea>
          </div>
        </div>

        <!-- Coluna 3: Ativações -->
        <div class="card-glass conflito-col-ativacoes">
          <div class="conflito-ativacoes-header">
            <h3 class="ws-section-title conflito-section-title">Ativações do Conflito</h3>
            <div id="conflito-last-roll-container"></div>
            <button id="btn-toggle-simbolos" class="btn btn-sm" style="font-size:9px;padding:2px 6px;" title="Alternar símbolos dos dados">🎲</button>
          </div>
          <div id="conflito-ativacoes-list" class="conflito-ativacoes-list">
            ${c.ativacoes.map((act, idx) => {
    const cleanTrigger = act.gatilho.toUpperCase().replace(/\s+/g, "");
    const requiredS = (cleanTrigger.match(/S/g) || []).length;
    const requiredA = (cleanTrigger.match(/[AB]/g) || []).length;
    const requiredP = (cleanTrigger.match(/[CP]/g) || []).length;
    const totalRequired = requiredS + requiredA + requiredP;

    const investedS = act.investedS || 0;
    const investedA = act.investedA || 0;
    const investedP = act.investedP || 0;
    const totalInvested = investedS + investedA + investedP;

    const isCompleted = totalRequired > 0 &&
      investedS >= requiredS &&
      investedA >= requiredA &&
      investedP >= requiredP;

    return `
                <div class="${_getAtivacaoItemClass(isCompleted)}">
                  
                  <!-- Painel de Investimento (Partitura do Conflito) -->
                  <div class="conflito-ativacao-investimento">
                  <div class="investimento-label-row" style="display:flex; align-items: center; gap:4px;">
                    <span class="investimento-label">Partitura:</span>
                    <div class="investimento-controls">
                      ${requiredS > 0 ? `
                      <div class="investimento-control-group group-s" title="Sucessos (S) investidos. Necessário: ${requiredS}">
                        <img src="${_diceImg('S')}" alt="S" title="Sucesso">
                        <button type="button" class="btn-invest-dec" data-idx="${idx}" data-type="S">-</button>
                        <span class="invest-val ${investedS >= requiredS && requiredS > 0 ? 'met' : ''}">${investedS}/${requiredS}</span>
                        <button type="button" class="btn-invest-inc" data-idx="${idx}" data-type="S">+</button>
                      </div>` : ""}
                      ${requiredA > 0 ? `
                      <div class="investimento-control-group group-a" title="Adaptações (A) investidas. Necessário: ${requiredA}">
                        <img src="${_diceImg('A')}" alt="A" title="Adaptação">
                        <button type="button" class="btn-invest-dec" data-idx="${idx}" data-type="A">-</button>
                        <span class="invest-val ${investedA >= requiredA && requiredA > 0 ? 'met' : ''}">${investedA}/${requiredA}</span>
                        <button type="button" class="btn-invest-inc" data-idx="${idx}" data-type="A">+</button>
                      </div>` : ""}
                      ${requiredP > 0 ? `
                      <div class="investimento-control-group group-p" title="Pressões (P) investidas. Necessário: ${requiredP}">
                        <img src="${_diceImg('P')}" alt="P" title="Pressão">
                        <button type="button" class="btn-invest-dec" data-idx="${idx}" data-type="P">-</button>
                        <span class="invest-val ${investedP >= requiredP && requiredP > 0 ? 'met' : ''}">${investedP}/${requiredP}</span>
                        <button type="button" class="btn-invest-inc" data-idx="${idx}" data-type="P">+</button>
                      </div>` : ""}
                    </div>
                    </div>
                  <div style="display:flex; gap:4px; margin-top:4px;">
                    ${isCompleted ? `<button class="btn-reset-ativacao" data-idx="${idx}" title="Gastar todas as investidas e resetar">Gastar</button>` : ""}
                    <button class="btn-edit-ativacao" data-idx="${idx}" title="Editar Ativação">Editar</button>
                  </div>
                  </div>
                  <div class="conflito-ativacao-title-row">
                  <span title="Ativação">
                    <span class="conflito-ativacao-titulo">${act.titulo}</span>
                  </span>
                  </div>
                  <div class="conflito-ativacao-efeito">${act.efeito}</div>

                  <div style="display:flex; gap:4px; margin-top:4px;">
                    <button class="btn-delete-ativacao" data-idx="${idx}" title="Excluir Ativação">&times;</button>
                  </div>
                </div>
              `;
  }).join("")}
          </div>

          <!-- Guia Rápido de Regras (pág. 33) -->
          <div class="conflito-guia-rapido">
            <button type="button" class="btn-toggle-guia" id="btn-toggle-guia">
              <span>📖 Guia de Regras (pág. 33)</span>
              <span class="guia-arrow">▼</span>
            </button>
            <div class="guia-body hidden" id="conflito-guia-body">
              <p><strong>Assimilador(a) em Conflito:</strong></p>
              <p>• Rola dados do Conflito &rarr; Investe <strong>todos</strong> os pontos de PRESSÃO e SUCESSO em ativações do Conflito.</p>
              <p>• Rola dados da Ameaça &rarr; Investe <strong>todos</strong> os pontos de PRESSÃO e SUCESSO em ativações da Ameaça (repete p/ cada Ameaça).</p>
              <p><strong>Adaptação:</strong> Usado para ativações com custo direto de ADAPTAÇÃO, para <em>Adaptar Ação Anterior</em> (reinvestir P/S) ou <em>Ignorar Penalidade</em> de custo.</p>
            </div>
          </div>

          <button id="btn-open-nova-ativacao-modal" class="btn btn-sm btn-block conflito-add-ativacao-btn" style="margin-top: 10px;">
            ➕ Nova Ativação
          </button>

          <!-- Ameaças Ativas -->
          <div class="conflito-ameacas-section">
            <div class="conflito-ameacas-header">
              <h4>Ameaças Ativas</h4>
              <button type="button" class="btn btn-sm btn-blue" id="btn-conflito-add-ameaca">+ Ameaça</button>
            </div>
            <div id="conflito-ameacas-list" class="conflito-ameacas-list">
              ${_renderAmeacas(c)}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Nova Ativação -->
    <div id="conflito-modal-nova-ativacao" class="conflito-modal hidden">
      <div class="conflito-modal-content card-glass">
        <div class="conflito-modal-header">
          <h4 class="conflito-modal-title">Nova Ativação</h4>
          <button type="button" class="btn-close-modal" id="btn-close-ativacao-modal">&times;</button>
        </div>
        <div class="conflito-modal-body">
          <div class="conflito-form-group">
            <label class="ws-label">Custo / Gatilho</label>
            <div id="gatilho-builder" style="display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap; min-height:36px; padding:6px 10px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:4px;">
                <span id="gatilho-preview" style="display:flex; align-items:center; gap:4px; min-height:26px;"></span>
                <button type="button" id="btn-gatilho-clear" style="margin-left:auto; background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:14px;" title="Limpar">&times;</button>
              </div>
              <div style="display:flex; gap:8px;">
                <div class="investimento-control-group group-s" style="flex:1; flex-direction:column; padding:8px; gap:6px; cursor:default;">
                  <img src="${_diceImg('S')}" alt="S" style="width:36px;height:36px;">
                  <div style="display:flex; align-items:center; gap:4px; justify-content:center;">
                    <button type="button" class="btn-gatilho-qty" data-type="S" data-dir="dec" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">-</button>
                    <span id="gatilho-count-s" class="invest-val" style="min-width:16px;">0</span>
                    <button type="button" class="btn-gatilho-qty" data-type="S" data-dir="inc" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">+</button>
                  </div>
                </div>
                <div class="investimento-control-group group-a" style="flex:1; flex-direction:column; padding:8px; gap:6px; cursor:default;">
                  <img src="${_diceImg('A')}" alt="A" style="width:36px;height:36px;">
                  <div style="display:flex; align-items:center; gap:4px; justify-content:center;">
                    <button type="button" class="btn-gatilho-qty" data-type="A" data-dir="dec" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">-</button>
                    <span id="gatilho-count-a" class="invest-val" style="min-width:16px;">0</span>
                    <button type="button" class="btn-gatilho-qty" data-type="A" data-dir="inc" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">+</button>
                  </div>
                </div>
                <div class="investimento-control-group group-p" style="flex:1; flex-direction:column; padding:8px; gap:6px; cursor:default;">
                  <img src="${_diceImg('P')}" alt="P" style="width:36px;height:36px;">
                  <div style="display:flex; align-items:center; gap:4px; justify-content:center;">
                    <button type="button" class="btn-gatilho-qty" data-type="P" data-dir="dec" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">-</button>
                    <span id="gatilho-count-p" class="invest-val" style="min-width:16px;">0</span>
                    <button type="button" class="btn-gatilho-qty" data-type="P" data-dir="inc" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">+</button>
                  </div>
                </div>
              </div>
            </div>
            <input type="hidden" id="modal-ativacao-gatilho">
          </div>
          <div class="conflito-form-group">
            <label class="ws-label" for="modal-ativacao-titulo">Título / Nome da Ação</label>
            <input type="text" id="modal-ativacao-titulo" placeholder="Nome da Ação" class="conflito-form-input-titulo" style="width: 100%; box-sizing: border-box;">
          </div>
          <div class="conflito-form-group">
            <label class="ws-label" for="modal-ativacao-efeito">Efeito / Descrição</label>
            <textarea id="modal-ativacao-efeito" placeholder="Descrição do Efeito..." class="conflito-form-textarea-efeito" style="width: 100%; box-sizing: border-box; height: 80px;"></textarea>
          </div>
        </div>
        <div class="conflito-modal-footer">
          <button type="button" class="btn btn-sm btn-secondary" id="btn-cancel-ativacao-modal">Cancelar</button>
          <button type="button" class="btn btn-sm btn-primary" id="btn-confirm-add-ativacao">Adicionar</button>
        </div>
      </div>
    </div>

    <!-- Modal de Nova Ameaça -->
    <div id="conflito-modal-nova-ameaca" class="conflito-modal hidden">
      <div class="conflito-modal-content card-glass">
        <div class="conflito-modal-header">
          <h4 class="conflito-modal-title">Adicionar Ameaça</h4>
          <button type="button" class="btn-close-modal" id="btn-close-ameaca-modal">&times;</button>
        </div>
        <div class="conflito-modal-body">
          <p style="font-size:12px; color:var(--text-secondary); margin-bottom:12px;">
            Preencha os dados da Ameaça. Ela será cadastrada no banco compartilhado de ameaças.
          </p>
          <div class="conflito-form-group">
            <label class="ws-label" for="modal-ameaca-nome">Nome da Ameaça</label>
            <input type="text" id="modal-ameaca-nome" placeholder="Ex: Criatura Voraz, Rebelião Interna..." class="conflito-form-input" style="width: 100%; box-sizing: border-box;" list="ameacas-db-list">
          </div>
          <div class="conflito-form-group">
            <label class="ws-label" for="modal-ameaca-descricao">Descrição / Interesses</label>
            <textarea id="modal-ameaca-descricao" placeholder="Descreva os interesses, comportamento ou efeitos da Ameaça..." class="conflito-form-input" style="width: 100%; box-sizing: border-box; height: 80px;"></textarea>
          </div>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; margin-bottom: 12px;">
            <div class="conflito-form-group">
              <label class="ws-label" for="modal-ameaca-d6">Dados D6</label>
              <input type="number" id="modal-ameaca-d6" value="1" min="0" max="20" class="conflito-form-input" style="width: 100%; box-sizing: border-box; text-align: center;">
            </div>
            <div class="conflito-form-group">
              <label class="ws-label" for="modal-ameaca-d10">Dados D10</label>
              <input type="number" id="modal-ameaca-d10" value="0" min="0" max="20" class="conflito-form-input" style="width: 100%; box-sizing: border-box; text-align: center;">
            </div>
            <div class="conflito-form-group">
              <label class="ws-label" for="modal-ameaca-d12">Dados D12</label>
              <input type="number" id="modal-ameaca-d12" value="0" min="0" max="20" class="conflito-form-input" style="width: 100%; box-sizing: border-box; text-align: center;">
            </div>
          </div>
          <div class="conflito-form-group">
            <label class="ws-label" for="modal-ameaca-objetivo">Objetivo no Conflito</label>
            <select id="modal-ameaca-objetivo" class="conflito-form-input" style="width:100%; box-sizing: border-box;">
              <option value="Principal">Objetivo Principal (Neutralização encerra Conflito)</option>
              <option value="Secundário">Objetivo Secundário (Neutralização retira ativações/dados)</option>
              <option value="Cenário">Apenas Cenário (Agente independente na cena)</option>
            </select>
          </div>
        </div>
        <div class="conflito-modal-footer">
          <button type="button" class="btn btn-sm btn-secondary" id="btn-cancel-ameaca-modal">Cancelar</button>
          <button type="button" class="btn btn-sm btn-success" id="btn-confirm-add-ameaca">Adicionar</button>
        </div>
      </div>
    </div>
  `;

  // Create or update shared threats datalist
  let datalist = document.getElementById("ameacas-db-list");
  if (!datalist) {
    datalist = document.createElement("datalist");
    datalist.id = "ameacas-db-list";
    document.body.appendChild(datalist);
  }
  datalist.innerHTML = (worldState.ameacasDb || []).map(a => `<option value="${esc(a.nome)}">`).join("");

  _attachListeners(c);
  renderConflitoRollLog();
  renderConflitoLastRollCounter();
}

function _attachListeners(c) {
  const screen = getScreen();

  screen.querySelector("#btn-conflito-back")?.addEventListener("click", goToLanding);
  screen.querySelector("#btn-conflito-delete")?.addEventListener("click", () => {
    if (confirm(`Excluir o Conflito "${c.nome}"?`)) { deleteConflito(c.id); goToLanding(); }
  });

  screen.querySelector("#conflito-nome")?.addEventListener("input", e => { c.nome = e.target.value; saveConflito(c); });
  screen.querySelector("#conflito-tipo")?.addEventListener("change", e => { c.tipoConflito = e.target.value; saveConflito(c); });
  screen.querySelector("#conflito-descricao")?.addEventListener("input", e => { c.descricao = e.target.value; saveConflito(c); });
  screen.querySelector("#conflito-notas")?.addEventListener("input", e => { c.notas = e.target.value; saveConflito(c); });
  try { _attachObjetivosPrincipaisListeners(c); } catch(e) { console.error("Erro objetivos principais:", e); }
  try { _attachObjetivosSecundariosListeners(c); } catch(e) { console.error("Erro objetivos secundários:", e); }

  screen.querySelector("#conflito-status")?.addEventListener("change", e => {
    c.status = e.target.value;
    saveConflito(c);
    const badge = screen.querySelector("#conflito-status-badge");
    if (badge) {
      badge.textContent = c.status;
      badge.className = `status-badge ${STATUS_CLASS_MAP[c.status] || "status-ativo"}`;
    }
  });

  screen.querySelectorAll("#conflito-grau-dots .attr-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      const idx = parseInt(dot.dataset.idx);
      c.grau = c.grau === idx + 1 ? idx : idx + 1;
      saveConflito(c);
      screen.querySelectorAll("#conflito-grau-dots .attr-dot").forEach((d, i) => {
        d.classList.toggle("filled", i < c.grau);
        d.classList.toggle("attr-dot-danger", i < c.grau);
      });
      screen.querySelector("#conflito-grau-val").textContent = c.grau;

      const d6Input = screen.querySelector("#conflito-roll-d6");
      if (d6Input) {
        d6Input.value = c.grau;
        c.d6Count = c.grau;
        saveConflito(c);
      }
    });
  });

  // Listeners para os botões +/- dos dados de conflito mix
  screen.querySelectorAll(".btn-conf-qty-dec").forEach(btn => {
    btn.addEventListener("click", () => {
      const sides = btn.dataset.sides;
      const input = screen.querySelector(`#conflito-roll-d${sides}`);
      if (input) {
        let val = parseInt(input.value) || 0;
        input.value = Math.max(0, val - 1);
        c[`d${sides}Count`] = parseInt(input.value);
        saveConflito(c);
      }
    });
  });

  screen.querySelectorAll(".btn-conf-qty-inc").forEach(btn => {
    btn.addEventListener("click", () => {
      const sides = btn.dataset.sides;
      const input = screen.querySelector(`#conflito-roll-d${sides}`);
      if (input) {
        let val = parseInt(input.value) || 0;
        input.value = Math.min(20, val + 1);
        c[`d${sides}Count`] = parseInt(input.value);
        saveConflito(c);
      }
    });
  });

  // Listener para rolagem do conflito (composição de dados mix)
  screen.querySelector("#btn-conflito-roll")?.addEventListener("click", () => {
    const d6 = parseInt(screen.querySelector("#conflito-roll-d6")?.value) || 0;
    const d10 = parseInt(screen.querySelector("#conflito-roll-d10")?.value) || 0;
    const d12 = parseInt(screen.querySelector("#conflito-roll-d12")?.value) || 0;

    const parts = [];
    if (d6 > 0) parts.push(`${d6}d6`);
    if (d10 > 0) parts.push(`${d10}d10`);
    if (d12 > 0) parts.push(`${d12}d12`);

    if (parts.length === 0) {
      alert("Selecione pelo menos um dado para rolar!");
      return;
    }

    const formula = parts.join("+");

    // Configura o valor na fórmula de dados do rolador do sistema
    const customFormulaInput = document.getElementById("dice-custom-formula");
    if (customFormulaInput) {
      customFormulaInput.value = formula;
    }

    executeCustomRoll();
  });

  const modal = screen.querySelector("#conflito-modal-nova-ativacao");

  // Abrir o modal
  const modalTitle = screen.querySelector("#conflito-modal-nova-ativacao .conflito-modal-title");
  const confirmBtn = screen.querySelector("#btn-confirm-add-ativacao");
  // Gatilho builder (individual + e -)
  const previewEl = screen.querySelector("#gatilho-preview");
  const hiddenGatilho = screen.querySelector("#modal-ativacao-gatilho");
  const countS = screen.querySelector("#gatilho-count-s");
  const countA = screen.querySelector("#gatilho-count-a");
  const countP = screen.querySelector("#gatilho-count-p");
  const getCounts = () => ({
    S: parseInt(countS?.textContent || "0"),
    A: parseInt(countA?.textContent || "0"),
    P: parseInt(countP?.textContent || "0")
  });

  const setCounts = (s, a, p) => {
    if (countS) countS.textContent = s;
    if (countA) countA.textContent = a;
    if (countP) countP.textContent = p;
  };

  const updateGatilhoPreview = () => {
    const counts = getCounts();
    let val = "";
    for (const ch of ["S","A","P"]) {
      val += ch.repeat(counts[ch]);
    }
    if (hiddenGatilho) hiddenGatilho.value = val;
    if (previewEl) {
      if (!val) {
        previewEl.innerHTML = "Clique em + ou - acima";
      } else {
        previewEl.innerHTML = val.split("").map(ch => `<img src="${_diceImg(ch)}" alt="${ch}" style="width:22px;height:22px;vertical-align:middle;">`).join("");
      }
    }
  };

  screen.querySelectorAll(".btn-gatilho-qty").forEach(btn => {
    btn.addEventListener("click", () => {
      try {
        const type = btn.dataset.type;
        const dir = btn.dataset.dir;
        const counts = getCounts();
        if (dir === "inc") counts[type]++;
        else counts[type] = Math.max(0, counts[type] - 1);
        setCounts(counts.S, counts.A, counts.P);
        updateGatilhoPreview();
      } catch(e) { console.error("Erro gatilho qty:", e); }
    });
  });
  screen.querySelector("#btn-gatilho-clear")?.addEventListener("click", () => {
    setCounts(0, 0, 0);
    updateGatilhoPreview();
  });

  screen.querySelector("#btn-open-nova-ativacao-modal")?.addEventListener("click", () => {
    activeThreatIdxForModal = null;
    editingActivationState = null;
    if (modal) {
      modalTitle.textContent = "Nova Ativação";
      confirmBtn.textContent = "Adicionar";
      setCounts(0, 0, 0);
      updateGatilhoPreview();
      screen.querySelector("#modal-ativacao-titulo").value = "";
      screen.querySelector("#modal-ativacao-efeito").value = "";
      modal.classList.remove("hidden");
    }
  });

  // Fechar o modal
  const hideModal = () => modal?.classList.add("hidden");
  screen.querySelector("#btn-close-ativacao-modal")?.addEventListener("click", hideModal);
  screen.querySelector("#btn-cancel-ativacao-modal")?.addEventListener("click", hideModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      hideModal();
    }
  });

  // Adicionar/Editar Ativação a partir do modal
  screen.querySelector("#btn-confirm-add-ativacao")?.addEventListener("click", () => {
    const gatilhoInput = screen.querySelector("#modal-ativacao-gatilho");
    const tituloInput = screen.querySelector("#modal-ativacao-titulo");
    const efeitoInput = screen.querySelector("#modal-ativacao-efeito");

    const gatilho = gatilhoInput.value.trim().toUpperCase();
    const titulo = tituloInput.value.trim();
    const efeito = efeitoInput.value.trim();

    if (!gatilho || !titulo || !efeito) {
      alert("Preencha todos os campos da ativação!");
      return;
    }

    if (editingActivationState) {
      if (editingActivationState.isAmeaca) {
        const a = c.ameacas[editingActivationState.ameacaIdx];
        if (a && a.ativacoes[editingActivationState.idx]) {
          const act = a.ativacoes[editingActivationState.idx];
          act.gatilho = gatilho;
          act.titulo = titulo;
          act.efeito = efeito;
        }
      } else {
        const act = c.ativacoes[editingActivationState.idx];
        if (act) {
          act.gatilho = gatilho;
          act.titulo = titulo;
          act.efeito = efeito;
        }
      }
      editingActivationState = null;
    } else if (activeThreatIdxForModal !== null) {
      const a = c.ameacas[activeThreatIdxForModal];
      if (a) {
        if (!a.ativacoes) a.ativacoes = [];
        a.ativacoes.push({
          gatilho,
          titulo,
          efeito,
          investedS: 0,
          investedA: 0,
          investedP: 0
        });
      }
    } else {
      c.ativacoes.push({
        gatilho,
        titulo,
        efeito,
        investedS: 0,
        investedA: 0,
        investedP: 0
      });
    }
    saveConflito(c);
    hideModal();
    renderConflitoSheet();
  });

  // Listener para editar ativacao do conflito
  screen.querySelectorAll(".btn-edit-ativacao").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      const act = c.ativacoes[idx];
      if (!act) return;
      editingActivationState = { idx, ameacaIdx: null, isAmeaca: false };
      activeThreatIdxForModal = null;
      modalTitle.textContent = "Editar Ativação";
      confirmBtn.textContent = "Salvar";
      {
        const val = act.gatilho || "";
        setCounts(
          (val.match(/S/g) || []).length,
          (val.match(/A/g) || []).length,
          (val.match(/P/g) || []).length
        );
      }
      updateGatilhoPreview();
      screen.querySelector("#modal-ativacao-titulo").value = act.titulo;
      screen.querySelector("#modal-ativacao-efeito").value = act.efeito;
      modal.classList.remove("hidden");
    });
  });

  // Listener para excluir ativacao
  screen.querySelectorAll(".btn-delete-ativacao").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      if (confirm("Excluir esta ativação do conflito?")) {
        c.ativacoes.splice(idx, 1);
        saveConflito(c);
        renderConflitoSheet();
      }
    });
  });

  // Listeners para os botões de incremento/decremento da partitura (investimento)
  function _updateInvestment(idx, type, delta) {
    const act = c.ativacoes[idx];
    if (!act) return;
    const key = `invested${type}`;
    act[key] = delta > 0 ? (act[key] || 0) + delta : Math.max(0, (act[key] || 0) + delta);

    const cleanTrigger = act.gatilho.toUpperCase().replace(/\s+/g, "");
    const requiredS = (cleanTrigger.match(/S/g) || []).length;
    const requiredA = (cleanTrigger.match(/[AB]/g) || []).length;
    const requiredP = (cleanTrigger.match(/[CP]/g) || []).length;
    const requiredMap = { S: requiredS, A: requiredA, P: requiredP };
    const required = requiredMap[type] || 0;

    const btn = screen.querySelector(`.btn-invest-inc[data-idx="${idx}"][data-type="${type}"], .btn-invest-dec[data-idx="${idx}"][data-type="${type}"]`);
    if (btn) {
      const group = btn.closest('.investimento-control-group');
      if (group) {
        const valSpan = group.querySelector('.invest-val');
        if (valSpan) {
          valSpan.textContent = `${act[key]}/${required}`;
          valSpan.classList.toggle('met', act[key] >= required && required > 0);
        }
      }
    }

    const el = screen.querySelector(`[data-idx="${idx}"]`);
    if (el) {
      const item = el.closest('.conflito-ativacao-item');
      if (item) {
        const totalRequired = requiredS + requiredA + requiredP;
        const isCompleted = totalRequired > 0 &&
          (act.investedS || 0) >= requiredS &&
          (act.investedA || 0) >= requiredA &&
          (act.investedP || 0) >= requiredP;
        item.classList.toggle('completed-item', isCompleted);

        const editBtn = item.querySelector('.btn-edit-ativacao');
        if (editBtn) {
          const container = editBtn.parentNode;
          let resetBtn = container.querySelector('.btn-reset-ativacao');
          if (isCompleted && !resetBtn) {
            resetBtn = document.createElement('button');
            resetBtn.className = 'btn-reset-ativacao';
            resetBtn.dataset.idx = idx;
            resetBtn.title = 'Gastar todas as investidas e resetar';
            resetBtn.textContent = 'Gastar';
            resetBtn.addEventListener('click', () => _resetAtivacao(idx));
            container.insertBefore(resetBtn, editBtn);
          } else if (!isCompleted && resetBtn) {
            resetBtn.remove();
          }
        }
      }
    }

    saveConflito(c);
  }

  screen.querySelectorAll(".btn-invest-inc").forEach(btn => {
    btn.addEventListener("click", () => {
      _updateInvestment(parseInt(btn.dataset.idx), btn.dataset.type, 1);
    });
  });

  screen.querySelectorAll(".btn-invest-dec").forEach(btn => {
    btn.addEventListener("click", () => {
      _updateInvestment(parseInt(btn.dataset.idx), btn.dataset.type, -1);
    });
  });

  function _resetAtivacao(idx) {
    const act = c.ativacoes[idx];
    if (!act) return;
    act.investedS = 0;
    act.investedA = 0;
    act.investedP = 0;
    act.snapshotS = 0;
    act.snapshotA = 0;
    act.snapshotP = 0;
    saveConflito(c);
  }

  screen.querySelectorAll(".btn-reset-ativacao").forEach(btn => {
    btn.addEventListener("click", () => _resetAtivacao(parseInt(btn.dataset.idx)));
  });

  screen.querySelector("#btn-toggle-guia")?.addEventListener("click", () => {
    const body = screen.querySelector("#conflito-guia-body");
    const arrow = screen.querySelector(".guia-arrow");
    if (body) {
      const isHidden = body.classList.toggle("hidden");
      if (arrow) arrow.textContent = isHidden ? "▼" : "▲";
    }
  });

  screen.querySelector("#btn-toggle-simbolos")?.addEventListener("click", () => {
    _toggleSimbolos();
    renderConflitoSheet();
  });

  const _attachSingleRefListener = (containerId, fieldKey, stateKey) => {
    const openBtn = screen.querySelector(`#${containerId}-chips`)?.parentNode.querySelector(".btn-open-ref-modal-single");
    if (openBtn) {
      openBtn.addEventListener("click", e => {
        const label = e.target.dataset.reflabel;
        const currentIds = c[fieldKey] ? [c[fieldKey]] : [];
        openSelectReferencesModal("Vincular " + label, stateKey, currentIds, (selectedIds) => {
          c[fieldKey] = selectedIds.length > 0 ? selectedIds[0] : null;
          saveConflito(c);
          renderConflitoSheet();
        }, true);
      });
    }
    screen.querySelectorAll(`#${containerId}-chips .btn-remove-ref`).forEach(btn => {
      btn.addEventListener("click", () => {
        c[fieldKey] = null;
        saveConflito(c); renderConflitoSheet();
      });
    });
  };

  _attachSingleRefListener("conflito-ref-regiao", "regiaoId", "regioes");
  _attachSingleRefListener("conflito-ref-refugio", "refugioId", "refugios");
  _attachSingleRefListener("conflito-ref-local", "localId", "locais");

  screen.querySelector("#btn-conflito-clear-log")?.addEventListener("click", () => {
    if (confirm("Limpar o histórico de rolagens deste conflito?")) {
      c.rolagens = [];
      c.ativacoes.forEach(act => {
        act.investedS = 0;
        act.investedA = 0;
        act.investedP = 0;
        act.snapshotS = 0;
        act.snapshotA = 0;
        act.snapshotP = 0;
      });
      saveConflito(c);
      renderConflitoSheet();
    }
  });

  setupImageUpload("conflito-image-frame", "conflito-image-input", c, saveConflito);

  // --- CONTROLES DE CONDICIONANTES ---
  screen.querySelector("#btn-conflito-add-cond")?.addEventListener("click", () => {
    if (!c.condicionantes) c.condicionantes = [];
    c.condicionantes.push("");
    saveConflito(c);
    renderConflitoSheet();
    // Foca no último input adicionado
    const inputs = screen.querySelectorAll(".cond-texto");
    if (inputs.length > 0) inputs[inputs.length - 1].focus();
  });

  screen.querySelectorAll(".cond-texto").forEach(input => {
    input.addEventListener("change", e => {
      const idx = parseInt(e.target.closest(".world-list-item").dataset.condIdx);
      if (!c.condicionantes) c.condicionantes = [];
      c.condicionantes[idx] = e.target.value;
      saveConflito(c);
    });
  });

  screen.querySelectorAll(".btn-remove-cond").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      if (confirm("Remover este condicionante?")) {
        c.condicionantes.splice(idx, 1);
        saveConflito(c);
        renderConflitoSheet();
      }
    });
  });

  // --- CONTROLES DE AMEAÇAS ---
  const ameacaModal = screen.querySelector("#conflito-modal-nova-ameaca");
  
  // Abrir modal de ameaça (add)
  screen.querySelector("#btn-conflito-add-ameaca")?.addEventListener("click", () => {
    _editingAmeacaIdx = null;
    if (ameacaModal) {
      screen.querySelector("#modal-ameaca-nome").value = "";
      screen.querySelector("#modal-ameaca-descricao").value = "";
      screen.querySelector("#modal-ameaca-d6").value = "1";
      screen.querySelector("#modal-ameaca-d10").value = "0";
      screen.querySelector("#modal-ameaca-d12").value = "0";
      screen.querySelector("#modal-ameaca-objetivo").value = "Principal";
      screen.querySelector("#btn-confirm-add-ameaca").textContent = "Adicionar";
      ameacaModal.classList.remove("hidden");
      screen.querySelector("#modal-ameaca-nome").focus();
    }
  });

  // Abrir modal de ameaça (edit)
  screen.querySelectorAll(".btn-edit-ameaca").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      const a = c.ameacas?.[idx];
      if (!a) return;
      _editingAmeacaIdx = idx;
      screen.querySelector("#modal-ameaca-nome").value = a.nome || "";
      screen.querySelector("#modal-ameaca-descricao").value = a.descricao || "";
      screen.querySelector("#modal-ameaca-d6").value = a.d6 ?? 1;
      screen.querySelector("#modal-ameaca-d10").value = a.d10 ?? 0;
      screen.querySelector("#modal-ameaca-d12").value = a.d12 ?? 0;
      screen.querySelector("#modal-ameaca-objetivo").value = a.objetivoTipo || "Principal";
      screen.querySelector("#btn-confirm-add-ameaca").textContent = "Salvar";
      ameacaModal.classList.remove("hidden");
      screen.querySelector("#modal-ameaca-nome").focus();
    });
  });

  // Fechar modal de ameaça
  const hideAmeacaModal = () => ameacaModal?.classList.add("hidden");
  screen.querySelector("#btn-close-ameaca-modal")?.addEventListener("click", hideAmeacaModal);
  screen.querySelector("#btn-cancel-ameaca-modal")?.addEventListener("click", hideAmeacaModal);
  ameacaModal?.addEventListener("click", (e) => {
    if (e.target === ameacaModal) {
      hideAmeacaModal();
    }
  });

  // Auto-completar descrição/dados ao digitar um nome já existente
  screen.querySelector("#modal-ameaca-nome")?.addEventListener("input", e => {
    const nome = e.target.value.trim();
    if (!nome) return;
    const match = (worldState.ameacasDb || []).find(a => a.nome.toLowerCase() === nome.toLowerCase());
    if (match) {
      screen.querySelector("#modal-ameaca-descricao").value = match.descricao || "";
      screen.querySelector("#modal-ameaca-d6").value = match.d6 !== undefined ? match.d6 : 1;
      screen.querySelector("#modal-ameaca-d10").value = match.d10 !== undefined ? match.d10 : 0;
      screen.querySelector("#modal-ameaca-d12").value = match.d12 !== undefined ? match.d12 : 0;
      screen.querySelector("#modal-ameaca-objetivo").value = match.objetivoTipo || "Principal";
    }
  });

  // Confirmar adicionar ameaça
  screen.querySelector("#btn-confirm-add-ameaca")?.addEventListener("click", () => {
    const nome = screen.querySelector("#modal-ameaca-nome").value.trim();
    const descricao = screen.querySelector("#modal-ameaca-descricao").value.trim();
    const d6 = parseInt(screen.querySelector("#modal-ameaca-d6").value) || 0;
    const d10 = parseInt(screen.querySelector("#modal-ameaca-d10").value) || 0;
    const d12 = parseInt(screen.querySelector("#modal-ameaca-d12").value) || 0;
    const objetivoTipo = screen.querySelector("#modal-ameaca-objetivo").value;

    if (!nome) {
      alert("A ameaça precisa de um nome!");
      return;
    }

    const ameacaData = { nome, descricao, d6, d10, d12, objetivoTipo };

    if (_editingAmeacaIdx !== null && c.ameacas && c.ameacas[_editingAmeacaIdx]) {
      c.ameacas[_editingAmeacaIdx] = { ...c.ameacas[_editingAmeacaIdx], ...ameacaData };
      _editingAmeacaIdx = null;
    } else {
      if (!c.ameacas) c.ameacas = [];
      c.ameacas.push(ameacaData);
      saveAmeacaToDb(ameacaData);
    }

    saveConflito(c);
    hideAmeacaModal();
    renderConflitoSheet();
  });

  // Listener para excluir ameaça do conflito
  screen.querySelectorAll(".btn-remove-ameaca").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      if (confirm(`Remover esta ameaça do conflito?`)) {
        c.ameacas.splice(idx, 1);
        saveConflito(c);
        renderConflitoSheet();
      }
    });
  });

  // Listener para rolar os dados da ameaça separadamente
  screen.querySelectorAll(".btn-roll-ameaca").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      const a = c.ameacas[idx];
      if (!a) return;

      const parts = [];
      if (a.d6 > 0) parts.push(`${a.d6}d6`);
      if (a.d10 > 0) parts.push(`${a.d10}d10`);
      if (a.d12 > 0) parts.push(`${a.d12}d12`);

      if (parts.length === 0) {
        alert("Esta ameaça não tem nenhum dado atribuído para rolar!");
        return;
      }

      const formula = parts.join("+");

      // Configura na caixa de rolagem customizada
      const customFormulaInput = document.getElementById("dice-custom-formula");
      if (customFormulaInput) {
        customFormulaInput.value = formula;
      }

      _pendingAmeacaRollIdx = idx;
      executeCustomRoll();
    });
  });

  // --- CONTROLES DE ATIVAÇÕES DE AMEAÇAS ---
  // Adicionar ativação da ameaça
  screen.querySelectorAll(".btn-add-ativacao-ameaca").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      activeThreatIdxForModal = parseInt(btn.dataset.ameacaIdx);
      editingActivationState = null;
      if (modal) {
        modalTitle.textContent = "Nova Ativação";
        confirmBtn.textContent = "Adicionar";
        setCounts(0, 0, 0);
        updateGatilhoPreview();
        screen.querySelector("#modal-ativacao-titulo").value = "";
        screen.querySelector("#modal-ativacao-efeito").value = "";
        modal.classList.remove("hidden");
      }
    });
  });

  // Editar ativação da ameaça
  screen.querySelectorAll(".btn-edit-ativacao-ameaca").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const ameacaIdx = parseInt(btn.dataset.ameacaIdx);
      const actIdx = parseInt(btn.dataset.actIdx);
      const a = c.ameacas[ameacaIdx];
      if (!a || !a.ativacoes || !a.ativacoes[actIdx]) return;
      const act = a.ativacoes[actIdx];
      editingActivationState = { idx: actIdx, ameacaIdx, isAmeaca: true };
      activeThreatIdxForModal = null;
      modalTitle.textContent = "Editar Ativação da Ameaça";
      confirmBtn.textContent = "Salvar";
      {
        const val = act.gatilho || "";
        setCounts(
          (val.match(/S/g) || []).length,
          (val.match(/A/g) || []).length,
          (val.match(/P/g) || []).length
        );
      }
      updateGatilhoPreview();
      screen.querySelector("#modal-ativacao-titulo").value = act.titulo;
      screen.querySelector("#modal-ativacao-efeito").value = act.efeito;
      modal.classList.remove("hidden");
    });
  });

  // Excluir ativação da ameaça
  screen.querySelectorAll(".btn-delete-ativacao-ameaca").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const ameacaIdx = parseInt(btn.dataset.ameacaIdx);
      const actIdx = parseInt(btn.dataset.actIdx);
      const a = c.ameacas[ameacaIdx];
      if (!a || !a.ativacoes) return;

      if (confirm(`Excluir a ativação "${a.ativacoes[actIdx].titulo}" da ameaça?`)) {
        a.ativacoes.splice(actIdx, 1);
        saveConflito(c);
        renderConflitoSheet();
      }
    });
  });

  function _updateAmeacaInvestment(ameacaIdx, actIdx, type, delta) {
    const a = c.ameacas[ameacaIdx];
    if (!a || !a.ativacoes || !a.ativacoes[actIdx]) return;
    const act = a.ativacoes[actIdx];
    const key = `invested${type}`;
    act[key] = delta > 0 ? (act[key] || 0) + delta : Math.max(0, (act[key] || 0) + delta);

    const cleanTrigger = act.gatilho.toUpperCase().replace(/\s+/g, "");
    const requiredS = (cleanTrigger.match(/S/g) || []).length;
    const requiredA = (cleanTrigger.match(/[AB]/g) || []).length;
    const requiredP = (cleanTrigger.match(/[CP]/g) || []).length;
    const requiredMap = { S: requiredS, A: requiredA, P: requiredP };
    const required = requiredMap[type] || 0;

    const selector = `.btn-invest-ameaca-inc[data-ameaca-idx="${ameacaIdx}"][data-act-idx="${actIdx}"][data-type="${type}"], .btn-invest-ameaca-dec[data-ameaca-idx="${ameacaIdx}"][data-act-idx="${actIdx}"][data-type="${type}"]`;
    const btn = screen.querySelector(selector);
    if (btn) {
      const group = btn.closest('.investimento-control-group');
      if (group) {
        const valSpan = group.querySelector('.invest-val');
        if (valSpan) {
          valSpan.textContent = `${act[key]}/${required}`;
          valSpan.classList.toggle('met', act[key] >= required && required > 0);
        }
      }
    }

    const el = screen.querySelector(`[data-ameaca-idx="${ameacaIdx}"][data-act-idx="${actIdx}"]`);
    if (el) {
      const item = el.closest('.conflito-ativacao-item');
      if (item) {
        const totalRequired = requiredS + requiredA + requiredP;
        const isCompleted = totalRequired > 0 &&
          (act.investedS || 0) >= requiredS &&
          (act.investedA || 0) >= requiredA &&
          (act.investedP || 0) >= requiredP;
        item.classList.toggle('completed-item', isCompleted);

        const editBtn = item.querySelector('.btn-edit-ativacao-ameaca');
        if (editBtn) {
          const container = editBtn.parentNode;
          let resetBtn = container.querySelector('.btn-reset-ativacao-ameaca');
          if (isCompleted && !resetBtn) {
            resetBtn = document.createElement('button');
            resetBtn.className = 'btn-reset-ativacao-ameaca';
            resetBtn.dataset.ameacaIdx = ameacaIdx;
            resetBtn.dataset.actIdx = actIdx;
            resetBtn.title = 'Gastar todas as investidas e resetar';
            resetBtn.textContent = 'Gastar';
            resetBtn.style.cssText = 'background:rgba(255,255,0,0.1); border:1px solid rgba(255,200,0,0.3); color:var(--color-gold-glow); font-size:10px; padding:2px 8px; border-radius:3px; cursor:pointer;';
            resetBtn.addEventListener('click', (e) => { e.stopPropagation(); _resetAmeacaAtivacao(ameacaIdx, actIdx); });
            container.insertBefore(resetBtn, editBtn);
          } else if (!isCompleted && resetBtn) {
            resetBtn.remove();
          }
        }
      }
    }

    saveConflito(c);
  }

  function _resetAmeacaAtivacao(ameacaIdx, actIdx) {
    const a = c.ameacas[ameacaIdx];
    if (!a || !a.ativacoes || !a.ativacoes[actIdx]) return;
    const act = a.ativacoes[actIdx];
    act.investedS = 0;
    act.investedA = 0;
    act.investedP = 0;
    saveConflito(c);
  }

  screen.querySelectorAll(".btn-invest-ameaca-inc").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      _updateAmeacaInvestment(parseInt(btn.dataset.ameacaIdx), parseInt(btn.dataset.actIdx), btn.dataset.type, 1);
    });
  });

  screen.querySelectorAll(".btn-invest-ameaca-dec").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      _updateAmeacaInvestment(parseInt(btn.dataset.ameacaIdx), parseInt(btn.dataset.actIdx), btn.dataset.type, -1);
    });
  });

  screen.querySelectorAll(".btn-reset-ativacao-ameaca").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      _resetAmeacaAtivacao(parseInt(btn.dataset.ameacaIdx), parseInt(btn.dataset.actIdx));
    });
  });
}

function _attachObjetivosPrincipaisListeners(c) {
  const screen = getScreen();
  if (!screen) return;
  const container = screen.querySelector("#conflito-objetivos-principais-container");
  if (!container) return;

  const newContainer = container.cloneNode(true);
  container.parentNode.replaceChild(newContainer, container);

  newContainer.addEventListener("click", (e) => {
    if (e.target.closest("#btn-conflito-add-obj-princ")) {
      if (!c.objetivosPrincipais) c.objetivosPrincipais = [];
      c.objetivosPrincipais.push({ descricao: "", valor: 0 });
      saveConflito(c);
      renderConflitoSheet();
      return;
    }

    const btnDec = e.target.closest(".btn-obj-princ-dec");
    if (btnDec) {
      const idx = parseInt(btnDec.dataset.idx);
      c.objetivosPrincipais[idx].valor = Math.max(0, (c.objetivosPrincipais[idx].valor || 0) - 1);
      saveConflito(c);
      const valInput = btnDec.parentElement.querySelector(".obj-princ-val");
      if (valInput) valInput.value = c.objetivosPrincipais[idx].valor;
      return;
    }

    const btnInc = e.target.closest(".btn-obj-princ-inc");
    if (btnInc) {
      const idx = parseInt(btnInc.dataset.idx);
      c.objetivosPrincipais[idx].valor = (c.objetivosPrincipais[idx].valor || 0) + 1;
      saveConflito(c);
      const valInput = btnInc.parentElement.querySelector(".obj-princ-val");
      if (valInput) valInput.value = c.objetivosPrincipais[idx].valor;
      return;
    }

    const btnRemove = e.target.closest(".btn-remove-obj-princ");
    if (btnRemove) {
      const idx = parseInt(btnRemove.dataset.idx);
      if (confirm("Remover este objetivo principal?")) {
        c.objetivosPrincipais.splice(idx, 1);
        saveConflito(c);
        renderConflitoSheet();
      }
      return;
    }
  });

  newContainer.addEventListener("input", (e) => {
    if (e.target.classList.contains("obj-princ-desc")) {
      const itemEl = e.target.closest(".objetivo-principal-item");
      if (itemEl) {
        const idx = parseInt(itemEl.dataset.objIdx);
        c.objetivosPrincipais[idx].descricao = e.target.value;
        saveConflito(c);
      }
    }
  });
}

function _attachObjetivosSecundariosListeners(c) {
  const container = getScreen().querySelector("#conflito-objetivos-secundarios-container");
  if (!container) return;

  const newContainer = container.cloneNode(true);
  container.parentNode.replaceChild(newContainer, container);

  newContainer.addEventListener("click", (e) => {
    if (e.target.closest("#btn-conflito-add-obj-sec")) {
      if (!c.objetivosSecundarios) c.objetivosSecundarios = [];
      c.objetivosSecundarios.push({ descricao: "", valor: 0 });
      saveConflito(c);
      renderConflitoSheet();
      return;
    }

    // Decrementar
    const btnDec = e.target.closest(".btn-obj-sec-dec");
    if (btnDec) {
      const idx = parseInt(btnDec.dataset.idx);
      c.objetivosSecundarios[idx].valor = Math.max(0, (c.objetivosSecundarios[idx].valor || 0) - 1);
      saveConflito(c);
      const valInput = btnDec.parentElement.querySelector(".obj-sec-val");
      if (valInput) valInput.value = c.objetivosSecundarios[idx].valor;
      return;
    }

    // Incrementar
    const btnInc = e.target.closest(".btn-obj-sec-inc");
    if (btnInc) {
      const idx = parseInt(btnInc.dataset.idx);
      c.objetivosSecundarios[idx].valor = (c.objetivosSecundarios[idx].valor || 0) + 1;
      saveConflito(c);
      const valInput = btnInc.parentElement.querySelector(".obj-sec-val");
      if (valInput) valInput.value = c.objetivosSecundarios[idx].valor;
      return;
    }

    // Remover
    const btnRemove = e.target.closest(".btn-remove-obj-sec");
    if (btnRemove) {
      const idx = parseInt(btnRemove.dataset.idx);
      if (confirm("Remover este objetivo secundário?")) {
        c.objetivosSecundarios.splice(idx, 1);
        saveConflito(c);
        renderConflitoSheet();
      }
      return;
    }
  });

  newContainer.addEventListener("input", (e) => {
    if (e.target.classList.contains("obj-sec-desc")) {
      const itemEl = e.target.closest(".objetivo-secundario-item");
      if (itemEl) {
        const idx = parseInt(itemEl.dataset.objIdx);
        c.objetivosSecundarios[idx].descricao = e.target.value;
        saveConflito(c);
      }
    }
  });
}

export function startNewConflito() {
  const c = createNewConflito();
  saveConflito(c);
  loadConflitoSheet(c);
}

export function renderConflitoRollLog() {
  const c = worldState.currentConflito;
  if (!c) return;
  const list = document.getElementById("conflito-rolagem-log-list");
  if (!list) return;

  if (!c.rolagens || c.rolagens.length === 0) {
    list.innerHTML = `<div class="conflito-log-empty">Nenhuma rolagem neste conflito.</div>`;
    return;
  }

  list.innerHTML = c.rolagens.map((roll, rIdx) => {
    let sucessos = roll.bonusSuccesses || 0;
    let adaptacoes = roll.bonusAdaptations || 0;
    let pressoes = roll.bonusPressures || 0;

    roll.keptDiceIndexes.forEach(idx => {
      const die = roll.results[idx];
      if (die && die.symbols) {
        die.symbols.forEach(sym => {
          if (sym === "A") sucessos++;
          if (sym === "B") adaptacoes++;
          if (sym === "C") pressoes++;
        });
      }
    });

    const diceHtml = `
      <div class="results-dice-grid">
        ${roll.results.map((die, idx) => {
      const isKept = roll.keptDiceIndexes.includes(idx);
      const imgSrc = getDieFaceImgSrc(die.sides, die.value);
      const contentHtml = imgSrc
        ? `<img src="${imgSrc}" class="die-face-img" alt="d${die.sides} face ${die.value}">`
        : `<span style="font-size:8px;">d${die.sides}:${die.value}</span>`;
      return `
            <div class="result-die-card ${isKept ? 'kept' : ''}" data-die-index="${idx}" data-roll-idx="${rIdx}" style="cursor: default; pointer-events: none; opacity: 0.85;">
              ${contentHtml}
            </div>
          `;
    }).join("")}
      </div>
    `;

    return `
      <div class="conflito-log-item">
        <div class="conflito-log-item-header">
          <div class="conflito-log-results">
            <span class="conflito-result-badge badge-s" title="Sucessos">S: ${sucessos}</span>
            <span class="conflito-result-badge badge-a" title="Adaptações">A: ${adaptacoes}</span>
            <span class="conflito-result-badge badge-p" title="Ameaças/Pressões">P: ${pressoes}</span>
          </div>
          <span class="conflito-log-formula">${roll.formula}</span>
          <span class="conflito-log-time">${roll.timestamp}</span>
        </div>
        <div class="conflito-log-dice">
          ${diceHtml}
        </div>
      </div>
    `;
  }).reverse().join("");
}

export function renderConflitoLastRollCounter() {
  const c = worldState.currentConflito;
  if (!c) return;

  const updateContainer = (container, rolagens, activations) => {
    if (!container) return;
    if (rolagens && rolagens.length > 0) {
      const lastRoll = rolagens[rolagens.length - 1];
      let sucessos = lastRoll.bonusSuccesses || 0;
      let adaptacoes = lastRoll.bonusAdaptations || 0;
      let pressoes = lastRoll.bonusPressures || 0;

      lastRoll.keptDiceIndexes.forEach(idx => {
        const die = lastRoll.results[idx];
        if (die && die.symbols) {
          die.symbols.forEach(sym => {
            if (sym === "A") sucessos++;
            if (sym === "B") adaptacoes++;
            if (sym === "C") pressoes++;
          });
        }
      });

      let newlyInvestedS = 0;
      let newlyInvestedA = 0;
      let newlyInvestedP = 0;
      (activations || []).forEach(act => {
        newlyInvestedS += (act.investedS || 0) - (act.snapshotS || 0);
        newlyInvestedA += (act.investedA || 0) - (act.snapshotA || 0);
        newlyInvestedP += (act.investedP || 0) - (act.snapshotP || 0);
      });

      const dispS = Math.max(0, sucessos - newlyInvestedS);
      const dispA = Math.max(0, adaptacoes - newlyInvestedA);
      const dispP = Math.max(0, pressoes - newlyInvestedP);

      container.innerHTML = `
        <span class="last-roll-label">Disponível:</span>
        <span class="conflito-result-badge badge-s" title="Sucessos">S: ${dispS}</span>
        <span class="conflito-result-badge badge-a" title="Adaptações">A: ${dispA}</span>
        <span class="conflito-result-badge badge-p" title="Ameaças/Pressões">P: ${dispP}</span>
      `;
      container.className = "conflito-last-roll-counter";
    } else {
      container.innerHTML = `
        <span class="last-roll-label" style="font-size: 10px; color: var(--text-muted);">Sem rolagens recentes</span>
      `;
      container.className = "conflito-last-roll-counter empty";
    }
  };

  const mainContainer = document.getElementById("conflito-last-roll-container");
  updateContainer(mainContainer, c.rolagens, c.ativacoes);

  (c.ameacas || []).forEach((a, idx) => {
    const amContainer = document.getElementById(`conflito-last-roll-container-ameaca-${idx}`);
    updateContainer(amContainer, a.rolagens, a.ativacoes);
  });
}

// Escuta evento global de rolagem finalizada para registrar no histórico do conflito atual
document.addEventListener("roll-added", (e) => {
  if (worldState.sheetMode === "conflito" && worldState.currentConflito) {
    const c = worldState.currentConflito;

    if (_pendingAmeacaRollIdx !== null) {
      const a = c.ameacas && c.ameacas[_pendingAmeacaRollIdx];
      if (a) {
        if (!a.rolagens) a.rolagens = [];
        a.rolagens.push(e.detail);
        if (a.rolagens.length > 10) a.rolagens.shift();
        a.ativacoes?.forEach(act => {
          act.snapshotS = act.investedS || 0;
          act.snapshotA = act.investedA || 0;
          act.snapshotP = act.investedP || 0;
        });
      }
      _pendingAmeacaRollIdx = null;
    } else {
      if (!c.rolagens) c.rolagens = [];
      c.rolagens.push(e.detail);
      if (c.rolagens.length > 10) c.rolagens.shift();

      // Snapshot das ativações no momento em que a rolagem ocorre
      c.ativacoes.forEach(act => {
        act.snapshotS = act.investedS || 0;
        act.snapshotA = act.investedA || 0;
        act.snapshotP = act.investedP || 0;
      });
    }

    saveConflito(c);
    renderConflitoRollLog();
    renderConflitoLastRollCounter();
  }
});
