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
        <div class="conflito-ativacao-investimento ameaca-ativacao-investimento">
          <div class="investimento-label-row">
            <div class="investimento-controls">
              ${requiredS > 0 ? `
              <span class="conflito-result-badge badge-s" title="Sucessos (S)">
                <img src="assets/sucesso.webp" alt="S">
                <button type="button" class="btn-pool-adjust btn-invest-ameaca-dec" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" data-type="S">-</button>
                <span class="invest-val ${investedS >= requiredS && requiredS > 0 ? 'met' : ''}">${investedS}/${requiredS}</span>
                <button type="button" class="btn-pool-adjust btn-invest-ameaca-inc" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" data-type="S">+</button>
              </span>` : ""}
              ${requiredA > 0 ? `
              <span class="conflito-result-badge badge-a" title="Adaptações (A)">
                <img src="assets/adaptacao.webp" alt="A">
                <button type="button" class="btn-pool-adjust btn-invest-ameaca-dec" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" data-type="A">-</button>
                <span class="invest-val ${investedA >= requiredA && requiredA > 0 ? 'met' : ''}">${investedA}/${requiredA}</span>
                <button type="button" class="btn-pool-adjust btn-invest-ameaca-inc" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" data-type="A">+</button>
              </span>` : ""}
              ${requiredP > 0 ? `
              <span class="conflito-result-badge badge-p" title="Pressões (P)">
                <img src="assets/pressao.webp" alt="P">
                <button type="button" class="btn-pool-adjust btn-invest-ameaca-dec" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" data-type="P">-</button>
                <span class="invest-val ${investedP >= requiredP && requiredP > 0 ? 'met' : ''}">${investedP}/${requiredP}</span>
                <button type="button" class="btn-pool-adjust btn-invest-ameaca-inc" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" data-type="P">+</button>
              </span>` : ""}
            </div>

            <div class="investimento-actions">
              ${isCompleted ? `<button class="btn btn-sm btn-reset-ativacao-ameaca" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" title="Gastar todas as investidas e resetar" style="background:rgba(255,255,0,0.1); border:1px solid rgba(255,200,0,0.3); color:var(--color-gold-glow); font-size: var(--font-size-xs); padding:2px 8px; border-radius:3px; cursor:pointer;">Gastar</button>` : ""}
              <button class="btn btn-sm btn-edit-ativacao-ameaca" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" title="Editar Ativação">Editar</button>
              <button class="btn-delete-ativacao-ameaca btn-danger btn-sm" data-ameaca-idx="${ameacaIdx}" data-act-idx="${actIdx}" title="Excluir Ativação">&times;</button>
            </div>
          </div>
          
          <div class="conflito-ativacao-info" style="margin-top:4px;">
            <strong class="conflito-ativacao-titulo ameaca-ativacao-titulo" style="color:var(--text-primary); font-size:var(--font-size-sm); display:block; margin-bottom:2px;">${esc(act.titulo)}</strong>
            <div class="conflito-ativacao-efeito ameaca-ativacao-efeito" style="color:var(--text-secondary); font-size:var(--font-size-xs);">${esc(act.efeito)}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function getScreen() { return document.getElementById("conflito-screen"); }

function _renderCondicionantes(condicionantes) {
  if (!condicionantes || condicionantes.length === 0) {
    return `<div class="world-list-empty" style="font-size: var(--font-size-md); padding: 12px; color: var(--text-muted);">Nenhum condicionante cadastrado.</div>`;
  }
  return condicionantes.map((cond, idx) => `
    <div class="world-list-item" data-cond-idx="${idx}" style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px; background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.06);">
      <input type="text" class="cond-texto" value="${esc(cond)}" placeholder="Ex: Ao sofrer dano, ganha +1 Pressão..." style="flex: 1; font-size: var(--font-size-md); background: transparent; border: none; color: #fff; padding: 2px 0; outline: none;">
      <button class="btn btn-sm btn-danger btn-remove-cond" data-idx="${idx}" style="padding: 1px 6px; font-size: var(--font-size-md); height: 18px; line-height: 1.2;">&times;</button>
    </div>
  `).join("");
}

function _renderObjetivosPrincipais(objetivosPrincipais) {
  if (!objetivosPrincipais || objetivosPrincipais.length === 0) {
    return `<div class="world-list-empty" style="font-size: var(--font-size-md); padding: 12px; color: var(--text-muted);">Nenhum objetivo principal definido.</div>`;
  }
  return objetivosPrincipais.map((obj, idx) => `
    <div class="objetivo-principal-item" data-obj-idx="${idx}" style="margin-bottom: 12px; padding: 8px; border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.15); border-radius: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <label class="ws-label" style="margin-bottom: 0;">Objetivo Principal ${idx + 1}</label>
        <div class="conflito-qty-controls" style="display:flex; align-items:center; gap:4px;">
          <button type="button" class="btn-obj-princ-dec" data-idx="${idx}">-</button>
          <input type="number" value="${obj.valor || 0}" min="0" max="99" class="conflito-dado-input obj-princ-val" readonly style="width: 32px; text-align: center;">
          <button type="button" class="btn-obj-princ-inc" data-idx="${idx}">+</button>
          <button type="button" class="btn btn-sm btn-danger btn-remove-obj-princ" data-idx="${idx}" style="margin-left:8px; font-size: var(--font-size-xs); padding:2px 6px;">&times;</button>
        </div>
      </div>
      <textarea class="ws-textarea obj-princ-desc" placeholder="Descreva o objetivo principal..." style="min-height: 48px; font-size: var(--font-size-md);">${esc(obj.descricao || '')}</textarea>
    </div>
  `).join("");
}

function _renderObjetivosSecundarios(objetivosSecundarios) {
  if (!objetivosSecundarios || objetivosSecundarios.length === 0) {
    return `<div class="world-list-empty" style="font-size: var(--font-size-md); padding: 12px; color: var(--text-muted);">Nenhum objetivo secundário definido.</div>`;
  }
  return objetivosSecundarios.map((obj, idx) => `
    <div class="objetivo-secundario-item" data-obj-idx="${idx}" style="margin-bottom: 12px; padding: 8px; border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.15); border-radius: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <label class="ws-label" style="margin-bottom: 0;">Objetivo Secundário ${idx + 1}</label>
        <div class="conflito-qty-controls" style="display:flex; align-items:center; gap:4px;">
          <button type="button" class="btn-obj-sec-dec btn-conf-qty-dec" data-idx="${idx}">-</button>
          <input type="number" value="${obj.valor || 0}" min="0" max="99" class="conflito-dado-input obj-sec-val" readonly style="width: 32px; text-align: center;">
          <button type="button" class="btn-obj-sec-inc btn-conf-qty-inc" data-idx="${idx}">+</button>
          <button type="button" class="btn btn-sm btn-danger btn-remove-obj-sec" data-idx="${idx}" style="margin-left:8px; font-size: var(--font-size-xs); padding:2px 6px;">&times;</button>
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
      <div class="world-list-item conflito-ameaca-card" data-idx="${idx}">
        <div class="conflito-ameaca-title-row">
          <div class="conflito-ameaca-info">
            <strong class="conflito-ameaca-title">${esc(a.nome)}</strong>
            <span class="attr-value-badge conflito-ameaca-badge">${badgeText}</span>
          </div>
          <div class="conflito-ameaca-actions">
            <button class="btn btn-sm btn-view-ameaca btn-blue" data-idx="${idx}" title="Abrir Ameaça em Modal">Abrir Ameaça</button>
            <button class="btn btn-sm btn-danger btn-remove-ameaca" data-idx="${idx}" title="Excluir Ameaça">&times;</button>
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

  // Preservar estado aberto do modal de detalhes da ameaça (se houver)
  const prevDetalhesModal = screen.querySelector("#conflito-modal-ameaca-detalhes");
  const wasDetalhesOpen = prevDetalhesModal && !prevDetalhesModal.classList.contains("hidden");
  const openAmeacaIdx = wasDetalhesOpen && prevDetalhesModal.dataset.openAmeacaIdx !== "" && prevDetalhesModal.dataset.openAmeacaIdx !== undefined
    ? parseInt(prevDetalhesModal.dataset.openAmeacaIdx)
    : null;

  // Preservar estado aberto do modal de detalhes da ativação (se houver)
  const prevAtivacaoModal = screen.querySelector("#conflito-modal-ativacao-detalhes");
  const wasAtivacaoOpen = prevAtivacaoModal && !prevAtivacaoModal.classList.contains("hidden");
  const openAtivacaoIdx = wasAtivacaoOpen && prevAtivacaoModal.dataset.openAtivacaoIdx !== "" && prevAtivacaoModal.dataset.openAtivacaoIdx !== undefined
    ? parseInt(prevAtivacaoModal.dataset.openAtivacaoIdx)
    : null;

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
                <div class="modal-ameaca-dice-row" style="margin-bottom: 8px;">
                  <div class="investimento-control-group group-s" style="flex:1; flex-direction:column; padding:8px; gap:6px; cursor:default;">
                    <img src="assets/d6/3-4(D6).webp" alt="d6" style="width:36px;height:36px;object-fit:contain;">
                    <span style="font-size:var(--font-size-xs); color:var(--text-secondary); font-weight:bold;">d6</span>
                    <div style="display:flex; align-items:center; gap:4px; justify-content:center;">
                      <button type="button" class="btn-conf-qty-dec" data-sides="6" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">-</button>
                      <span id="conflito-roll-d6-val" class="invest-val" style="min-width:16px; font-weight:bold;">${(c.d6Count ?? c.grau) || 1}</span>
                      <button type="button" class="btn-conf-qty-inc" data-sides="6" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">+</button>
                      <input type="hidden" id="conflito-roll-d6" value="${(c.d6Count ?? c.grau) || 1}">
                    </div>
                  </div>

                  <div class="investimento-control-group group-a" style="flex:1; flex-direction:column; padding:8px; gap:6px; cursor:default;">
                    <img src="assets/d10/6(D10).webp" alt="d10" style="width:36px;height:36px;object-fit:contain;">
                    <span style="font-size:var(--font-size-xs); color:var(--text-secondary); font-weight:bold;">d10</span>
                    <div style="display:flex; align-items:center; gap:4px; justify-content:center;">
                      <button type="button" class="btn-conf-qty-dec" data-sides="10" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">-</button>
                      <span id="conflito-roll-d10-val" class="invest-val" style="min-width:16px; font-weight:bold;">${c.d10Count || 0}</span>
                      <button type="button" class="btn-conf-qty-inc" data-sides="10" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">+</button>
                      <input type="hidden" id="conflito-roll-d10" value="${c.d10Count || 0}">
                    </div>
                  </div>

                  <div class="investimento-control-group group-p" style="flex:1; flex-direction:column; padding:8px; gap:6px; cursor:default;">
                    <img src="assets/d12/11(D12).webp" alt="d12" style="width:36px;height:36px;object-fit:contain;">
                    <span style="font-size:var(--font-size-xs); color:var(--text-secondary); font-weight:bold;">d12</span>
                    <div style="display:flex; align-items:center; gap:4px; justify-content:center;">
                      <button type="button" class="btn-conf-qty-dec" data-sides="12" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">-</button>
                      <span id="conflito-roll-d12-val" class="invest-val" style="min-width:16px; font-weight:bold;">${c.d12Count || 0}</span>
                      <button type="button" class="btn-conf-qty-inc" data-sides="12" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">+</button>
                      <input type="hidden" id="conflito-roll-d12" value="${c.d12Count || 0}">
                    </div>
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
                  <button type="button" class="btn btn-sm btn-blue" id="btn-conflito-add-cond" style="font-size: var(--font-size-md); padding: 2px 10px; line-height: 1.2;">+ Condicionante</button>
                </div>
                <div id="conflito-condicionantes-list" class="conflito-condicionantes-list">
                  ${_renderCondicionantes(c.condicionantes)}
                </div>
              </div>
            </div>
            
            <div class="conflito-objetivos-panel">
              <div id="conflito-objetivos-principais-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <h4 class="ws-label" style="margin: 0; font-size: var(--font-size-md);">Objetivos Principais</h4>
                  <button type="button" class="btn btn-sm btn-blue" id="btn-conflito-add-obj-princ">+ Objetivo</button>
                </div>
                <div id="conflito-objetivos-princ-list" class="conflito-objetivos-princ-list">
                  ${_renderObjetivosPrincipais(c.objetivosPrincipais)}
                </div>
              </div>
              <div id="conflito-objetivos-secundarios-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <h4 class="ws-label" style="margin: 0; font-size: var(--font-size-md);">Objetivos Secundários</h4>
                  <button type="button" class="btn btn-sm btn-blue" id="btn-conflito-add-obj-sec">+ Objetivo</button>
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
                  <button id="btn-conflito-clear-log" class="btn btn-sm btn-danger btn-conflito-clear-log" style="font-size: var(--font-size-sm); padding: 2px 6px; line-height: 1.2;" title="Limpar Histórico">Limpar</button>
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
                <div class="${_getAtivacaoItemClass(isCompleted)}" data-act-idx="${idx}" style="cursor: pointer;">
                  <div class="conflito-ativacao-investimento conflito-ativacao-compact">
                    <div class="conflito-ativacao-info-col">
                      <strong class="conflito-ativacao-titulo" style="font-size:var(--font-size-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(act.titulo)}</strong>
                    </div>

                    <div class="conflito-ativacao-right-col">
                      <div class="investimento-controls">
                        ${requiredS > 0 ? `
                        <span class="conflito-result-badge badge-s" title="Sucessos (S)">
                          <img src="assets/sucesso.webp" alt="S">
                          <span class="invest-val ${investedS >= requiredS && requiredS > 0 ? 'met' : ''}">${investedS}/${requiredS}</span>
                        </span>` : ""}
                        ${requiredA > 0 ? `
                        <span class="conflito-result-badge badge-a" title="Adaptações (A)">
                          <img src="assets/adaptacao.webp" alt="A">
                          <span class="invest-val ${investedA >= requiredA && requiredA > 0 ? 'met' : ''}">${investedA}/${requiredA}</span>
                        </span>` : ""}
                        ${requiredP > 0 ? `
                        <span class="conflito-result-badge badge-p" title="Pressões (P)">
                          <img src="assets/pressao.webp" alt="P">
                          <span class="invest-val ${investedP >= requiredP && requiredP > 0 ? 'met' : ''}">${investedP}/${requiredP}</span>
                        </span>` : ""}
                      </div>

                      <div class="investimento-actions">
                        ${isCompleted ? `<button class="btn btn-sm btn-reset-ativacao" data-idx="${idx}" title="Gastar todas as investidas e resetar" style="background:rgba(255,255,0,0.1); border:1px solid rgba(255,200,0,0.3); color:var(--color-gold-glow); font-size: var(--font-size-xs); padding:2px 8px; border-radius:3px; cursor:pointer;">Gastar</button>` : ""}
                        <button class="btn-delete-ativacao btn-danger btn-sm" data-idx="${idx}" title="Excluir Ativação">&times;</button>
                      </div>
                    </div>
                  </div>
                </div>
              `;
  }).join("")}
          </div>

          <!-- Guia Rápido de Regras (pág. 33) -->
          <div class="conflito-guia-rapido">
            <button type="button" class="btn-toggle-guia" id="btn-toggle-guia">
              <span>Guia de Regras (pág. 33)</span>
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
            Nova Ativação
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
                <button type="button" id="btn-gatilho-clear" style="margin-left:auto; background:none; border:none; color:var(--text-muted); cursor:pointer; font-size: var(--font-size-xs);" title="Limpar">&times;</button>
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
      <div class="conflito-modal-content card-glass modal-nova-ameaca-content">
        <div class="conflito-modal-header">
          <h4 class="conflito-modal-title">Adicionar Ameaça</h4>
          <button type="button" class="btn-close-modal" id="btn-close-ameaca-modal">&times;</button>
        </div>
        <div class="conflito-modal-body">
          <p class="modal-form-help-text">
            Preencha os dados da Ameaça. Ela será cadastrada no banco compartilhado de ameaças.
          </p>
          <div class="conflito-form-group">
            <label class="ws-label" for="modal-ameaca-nome">Nome da Ameaça</label>
            <input type="text" id="modal-ameaca-nome" placeholder="Ex: Criatura Voraz, Rebelião Interna..." class="conflito-form-input conflito-form-input-full" list="ameacas-db-list">
          </div>
          <div class="conflito-form-group">
            <label class="ws-label" for="modal-ameaca-descricao">Descrição / Interesses</label>
            <textarea id="modal-ameaca-descricao" placeholder="Descreva os interesses, comportamento ou efeitos da Ameaça..." class="conflito-form-input conflito-textarea-fixed"></textarea>
          </div>
          <div class="dice-selector-row" style="margin-bottom: 12px;">
            <div class="dice-select-control">
              <img src="assets/d6/3-4(D6).webp" class="dice-tag tag-d6" alt="d6">
              <label>(d6)</label>
              <div class="number-input">
                <button type="button" class="num-minus btn-dice-step" data-target="modal-ameaca-d6" data-step="-1">-</button>
                <span id="modal-ameaca-d6-val" class="dice-qty-span">1</span>
                <button type="button" class="num-plus btn-dice-step" data-target="modal-ameaca-d6" data-step="1">+</button>
                <input type="hidden" id="modal-ameaca-d6" value="1">
              </div>
            </div>

            <div class="dice-select-control">
              <img src="assets/d10/6(D10).webp" class="dice-tag tag-d10" alt="d10">
              <label>(d10)</label>
              <div class="number-input">
                <button type="button" class="num-minus btn-dice-step" data-target="modal-ameaca-d10" data-step="-1">-</button>
                <span id="modal-ameaca-d10-val" class="dice-qty-span">0</span>
                <button type="button" class="num-plus btn-dice-step" data-target="modal-ameaca-d10" data-step="1">+</button>
                <input type="hidden" id="modal-ameaca-d10" value="0">
              </div>
            </div>

            <div class="dice-select-control">
              <img src="assets/d12/11(D12).webp" class="dice-tag tag-d12" alt="d12">
              <label>(d12)</label>
              <div class="number-input">
                <button type="button" class="num-minus btn-dice-step" data-target="modal-ameaca-d12" data-step="-1">-</button>
                <span id="modal-ameaca-d12-val" class="dice-qty-span">0</span>
                <button type="button" class="num-plus btn-dice-step" data-target="modal-ameaca-d12" data-step="1">+</button>
                <input type="hidden" id="modal-ameaca-d12" value="0">
              </div>
            </div>
          </div>
          <div class="conflito-form-group">
            <label class="ws-label" for="modal-ameaca-objetivo">Objetivo no Conflito</label>
            <select id="modal-ameaca-objetivo" class="conflito-form-input conflito-form-input-full">
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

    <!-- Modal de Visualização/Foco da Ameaça (sem desfoque) -->
    <div id="conflito-modal-ameaca-detalhes" class="conflito-modal modal-no-backdrop-blur hidden">
      <div class="conflito-modal-content card-glass modal-ameaca-detalhes-content">
        <div class="conflito-modal-header">
          <h4 class="conflito-modal-title" id="ameaca-detalhes-modal-title">Detalhes da Ameaça</h4>
          <button type="button" class="btn-close-modal" id="btn-close-ameaca-detalhes">&times;</button>
        </div>
        <div class="conflito-modal-body" id="ameaca-detalhes-modal-body">
          <!-- Conteúdo da Ameaça inserido dinamicamente -->
        </div>
      </div>
    </div>

    <!-- Modal de Visualização/Foco da Ativação do Conflito (sem desfoque) -->
    <div id="conflito-modal-ativacao-detalhes" class="conflito-modal modal-no-backdrop-blur hidden">
      <div class="conflito-modal-content card-glass modal-ativacao-detalhes-content">
        <div class="conflito-modal-header">
          <h4 class="conflito-modal-title" id="ativacao-detalhes-modal-title">Ativação</h4>
          <button type="button" class="btn-close-modal" id="btn-close-ativacao-detalhes">&times;</button>
        </div>
        <div class="conflito-modal-body" id="ativacao-detalhes-modal-body">
          <!-- Conteúdo da Ativação inserido dinamicamente -->
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

  _attachListeners(c, openAtivacaoIdx, openAmeacaIdx);
  renderConflitoRollLog();
  renderConflitoLastRollCounter();

  // Restaurar modal de detalhes da ameaça aberto se estiver ativo
  if (wasDetalhesOpen && openAmeacaIdx !== null && c.ameacas && c.ameacas[openAmeacaIdx]) {
    screen.querySelector(`.btn-view-ameaca[data-idx="${openAmeacaIdx}"]`)?.click();
  }
}

function _attachListeners(c, openAtivacaoIdx = null, openAmeacaIdx = null) {
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
      const d6ValSpan = screen.querySelector("#conflito-roll-d6-val");
      if (d6Input) {
        d6Input.value = c.grau;
        if (d6ValSpan) d6ValSpan.textContent = c.grau;
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
      const valSpan = screen.querySelector(`#conflito-roll-d${sides}-val`);
      if (input) {
        let val = parseInt(input.value) || 0;
        let newVal = Math.max(0, val - 1);
        input.value = newVal;
        if (valSpan) valSpan.textContent = newVal;
        c[`d${sides}Count`] = newVal;
        saveConflito(c);
      }
    });
  });

  screen.querySelectorAll(".btn-conf-qty-inc").forEach(btn => {
    btn.addEventListener("click", () => {
      const sides = btn.dataset.sides;
      const input = screen.querySelector(`#conflito-roll-d${sides}`);
      const valSpan = screen.querySelector(`#conflito-roll-d${sides}-val`);
      if (input) {
        let val = parseInt(input.value) || 0;
        let newVal = Math.min(20, val + 1);
        input.value = newVal;
        if (valSpan) valSpan.textContent = newVal;
        c[`d${sides}Count`] = newVal;
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

  // Função para abrir o modal de edição de ativação do conflito
  const openEditAtivacaoModal = (idx) => {
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
    screen.querySelector("#modal-ativacao-titulo").value = act.titulo || "";
    screen.querySelector("#modal-ativacao-efeito").value = act.efeito || "";
    modal.classList.remove("hidden");
  };

  // Listener para editar ativacao do conflito
  screen.querySelectorAll(".btn-edit-ativacao").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      openEditAtivacaoModal(idx);
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

    if (delta > 0) {
      const avail = _getAvailableDice(c.rolagens, c.ativacoes, c);
      if ((avail[type] || 0) <= 0) {
        return;
      }
    }

    const key = `invested${type}`;
    act[key] = delta > 0 ? (act[key] || 0) + delta : Math.max(0, (act[key] || 0) + delta);

    const cleanTrigger = act.gatilho.toUpperCase().replace(/\s+/g, "");
    const requiredS = (cleanTrigger.match(/S/g) || []).length;
    const requiredA = (cleanTrigger.match(/[AB]/g) || []).length;
    const requiredP = (cleanTrigger.match(/[CP]/g) || []).length;
    const requiredMap = { S: requiredS, A: requiredA, P: requiredP };
    const required = requiredMap[type] || 0;

    const item = screen.querySelector(`.conflito-ativacao-item[data-act-idx="${idx}"]`);
    if (item) {
      const badge = item.querySelector(`.badge-${type.toLowerCase()}`);
      const valSpan = badge?.querySelector('.invest-val');
      if (valSpan) {
        valSpan.textContent = `${act[key]}/${required}`;
        valSpan.classList.toggle('met', act[key] >= required && required > 0);
      }

      const totalRequired = requiredS + requiredA + requiredP;
      const isCompleted = totalRequired > 0 &&
        (act.investedS || 0) >= requiredS &&
        (act.investedA || 0) >= requiredA &&
        (act.investedP || 0) >= requiredP;
      item.classList.toggle('completed-item', isCompleted);

      const actionsContainer = item.querySelector('.investimento-actions');
      if (actionsContainer) {
        let resetBtn = actionsContainer.querySelector('.btn-reset-ativacao');
        const deleteBtn = actionsContainer.querySelector('.btn-delete-ativacao');
        if (isCompleted && !resetBtn) {
          resetBtn = document.createElement('button');
          resetBtn.className = 'btn btn-sm btn-reset-ativacao';
          resetBtn.dataset.idx = idx;
          resetBtn.title = 'Gastar todas as investidas e resetar';
          resetBtn.textContent = 'Gastar';
          resetBtn.style.cssText = 'background:rgba(255,255,0,0.1); border:1px solid rgba(255,200,0,0.3); color:var(--color-gold-glow); font-size: var(--font-size-xs); padding:2px 8px; border-radius:3px; cursor:pointer;';
          resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            _resetAtivacao(idx);
          });
          if (deleteBtn) {
            actionsContainer.insertBefore(resetBtn, deleteBtn);
          } else {
            actionsContainer.appendChild(resetBtn);
          }
        } else if (!isCompleted && resetBtn) {
          resetBtn.remove();
        }
      }
    }

    // Atualiza elementos no modal de detalhes da ativação (se aberto)
    if (ativacaoDetalhesModal && !ativacaoDetalhesModal.classList.contains("hidden") && parseInt(ativacaoDetalhesModal.dataset.openAtivacaoIdx) === idx) {
      const modalBadge = ativacaoDetalhesBody.querySelector(`.conflito-result-badge.badge-${type.toLowerCase()}`);
      if (modalBadge) {
        const modalValSpan = modalBadge.querySelector('.invest-val');
        if (modalValSpan) {
          modalValSpan.textContent = `${act[key]}/${required}`;
          modalValSpan.classList.toggle('met', act[key] >= required && required > 0);
        }
      }
      const totalRequired = requiredS + requiredA + requiredP;
      const isCompleted = totalRequired > 0 &&
        (act.investedS || 0) >= requiredS &&
        (act.investedA || 0) >= requiredA &&
        (act.investedP || 0) >= requiredP;
      const modalActions = ativacaoDetalhesBody.querySelector('.investimento-actions');
      if (modalActions) {
        let resetBtn = modalActions.querySelector('.btn-reset-ativacao');
        if (isCompleted && !resetBtn) {
          resetBtn = document.createElement('button');
          resetBtn.className = 'btn btn-sm btn-reset-ativacao';
          resetBtn.dataset.idx = idx;
          resetBtn.title = 'Gastar todas as investidas e resetar';
          resetBtn.textContent = 'Gastar';
          resetBtn.style.cssText = 'background:rgba(255,255,0,0.1); border:1px solid rgba(255,200,0,0.3); color:var(--color-gold-glow); font-size: var(--font-size-xs); padding:2px 8px; border-radius:3px; cursor:pointer;';
          resetBtn.addEventListener('click', () => _resetAtivacao(idx));
          modalActions.insertBefore(resetBtn, modalActions.firstChild);
        } else if (!isCompleted && resetBtn) {
          resetBtn.remove();
        }
      }
    }

    saveConflito(c);
    renderConflitoLastRollCounter();
  }

  // --- MODAL DE DETALHES DA ATIVAÇÃO (SEM DESFOQUE) ---
  const ativacaoDetalhesModal = screen.querySelector("#conflito-modal-ativacao-detalhes");
  const ativacaoDetalhesBody = screen.querySelector("#ativacao-detalhes-modal-body");
  const ativacaoDetalhesTitle = screen.querySelector("#ativacao-detalhes-modal-title");

  const hideAtivacaoDetalhesModal = () => {
    if (ativacaoDetalhesModal) {
      ativacaoDetalhesModal.classList.add("hidden");
      ativacaoDetalhesModal.dataset.openAtivacaoIdx = "";
      if (ativacaoDetalhesBody) ativacaoDetalhesBody.innerHTML = "";
    }
  };

  screen.querySelector("#btn-close-ativacao-detalhes")?.addEventListener("click", hideAtivacaoDetalhesModal);
  ativacaoDetalhesModal?.addEventListener("click", (e) => {
    if (e.target === ativacaoDetalhesModal) hideAtivacaoDetalhesModal();
  });

  const openAtivacaoDetalhesModal = (idx) => {
    const act = c.ativacoes && c.ativacoes[idx];
    if (!act || !ativacaoDetalhesModal || !ativacaoDetalhesBody) return;

    ativacaoDetalhesModal.dataset.openAtivacaoIdx = idx;
    if (ativacaoDetalhesTitle) ativacaoDetalhesTitle.textContent = `Ativação: ${act.titulo || 'Sem Título'}`;

    const cleanTrigger = act.gatilho.toUpperCase().replace(/\s+/g, "");
    const requiredS = (cleanTrigger.match(/S/g) || []).length;
    const requiredA = (cleanTrigger.match(/[AB]/g) || []).length;
    const requiredP = (cleanTrigger.match(/[CP]/g) || []).length;
    const totalRequired = requiredS + requiredA + requiredP;

    const investedS = act.investedS || 0;
    const investedA = act.investedA || 0;
    const investedP = act.investedP || 0;

    const isCompleted = totalRequired > 0 &&
      investedS >= requiredS &&
      investedA >= requiredA &&
      investedP >= requiredP;

    ativacaoDetalhesBody.innerHTML = `
      <div class="conflito-ativacao-item modal-ativacao-detalhes-card">
        <div class="conflito-ativacao-investimento" style="padding: 0;">
          <div class="investimento-label-row">
            <div class="investimento-controls">
              ${requiredS > 0 ? `
              <span class="conflito-result-badge badge-s" title="Sucessos (S)">
                <img src="assets/sucesso.webp" alt="S">
                <button type="button" class="btn-pool-adjust btn-invest-modal-dec" data-idx="${idx}" data-type="S">-</button>
                <span class="invest-val ${investedS >= requiredS && requiredS > 0 ? 'met' : ''}">${investedS}/${requiredS}</span>
                <button type="button" class="btn-pool-adjust btn-invest-modal-inc" data-idx="${idx}" data-type="S">+</button>
              </span>` : ""}
              ${requiredA > 0 ? `
              <span class="conflito-result-badge badge-a" title="Adaptações (A)">
                <img src="assets/adaptacao.webp" alt="A">
                <button type="button" class="btn-pool-adjust btn-invest-modal-dec" data-idx="${idx}" data-type="A">-</button>
                <span class="invest-val ${investedA >= requiredA && requiredA > 0 ? 'met' : ''}">${investedA}/${requiredA}</span>
                <button type="button" class="btn-pool-adjust btn-invest-modal-inc" data-idx="${idx}" data-type="A">+</button>
              </span>` : ""}
              ${requiredP > 0 ? `
              <span class="conflito-result-badge badge-p" title="Pressões (P)">
                <img src="assets/pressao.webp" alt="P">
                <button type="button" class="btn-pool-adjust btn-invest-modal-dec" data-idx="${idx}" data-type="P">-</button>
                <span class="invest-val ${investedP >= requiredP && requiredP > 0 ? 'met' : ''}">${investedP}/${requiredP}</span>
                <button type="button" class="btn-pool-adjust btn-invest-modal-inc" data-idx="${idx}" data-type="P">+</button>
              </span>` : ""}
            </div>

            <div class="investimento-actions">
              ${isCompleted ? `<button class="btn btn-sm btn-reset-ativacao" data-idx="${idx}" title="Gastar todas as investidas e resetar" style="background:rgba(255,255,0,0.1); border:1px solid rgba(255,200,0,0.3); color:var(--color-gold-glow); font-size: var(--font-size-xs); padding:2px 8px; border-radius:3px; cursor:pointer;">Gastar</button>` : ""}
              <button class="btn btn-sm btn-edit-ativacao-from-modal" data-idx="${idx}" title="Editar Ativação">Editar</button>
              <button class="btn-delete-ativacao-from-modal btn-danger btn-sm" data-idx="${idx}" title="Excluir Ativação">&times;</button>
            </div>
          </div>

          <div class="conflito-ativacao-info" style="margin-top:12px; background:rgba(0,0,0,0.25); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.06);">
            <strong class="conflito-ativacao-titulo" style="color:var(--text-primary); font-size:var(--font-size-md); display:block; margin-bottom:6px;">${esc(act.titulo)}</strong>
            <div class="conflito-ativacao-efeito" style="color:var(--text-secondary); font-size:var(--font-size-sm); line-height:1.5;">${esc(act.efeito)}</div>
          </div>
        </div>
      </div>
    `;

    // Conecta botões dentro do modal de detalhes da ativação
    ativacaoDetalhesBody.querySelectorAll(".btn-invest-modal-inc").forEach(b => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        _updateInvestment(parseInt(b.dataset.idx), b.dataset.type, 1);
      });
    });

    ativacaoDetalhesBody.querySelectorAll(".btn-invest-modal-dec").forEach(b => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        _updateInvestment(parseInt(b.dataset.idx), b.dataset.type, -1);
      });
    });

    ativacaoDetalhesBody.querySelector(".btn-reset-ativacao")?.addEventListener("click", (e) => {
      e.stopPropagation();
      _resetAtivacao(idx);
      openAtivacaoDetalhesModal(idx);
    });

    ativacaoDetalhesBody.querySelector(".btn-edit-ativacao-from-modal")?.addEventListener("click", (e) => {
      e.stopPropagation();
      hideAtivacaoDetalhesModal();
      openEditAtivacaoModal(idx);
    });

    ativacaoDetalhesBody.querySelector(".btn-delete-ativacao-from-modal")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Excluir esta ativação do conflito?")) {
        c.ativacoes.splice(idx, 1);
        saveConflito(c);
        hideAtivacaoDetalhesModal();
        renderConflitoSheet();
      }
    });

    ativacaoDetalhesModal.classList.remove("hidden");
  };

  // Clique no card abre diretamente os detalhes da ativação
  screen.querySelectorAll(".conflito-ativacao-item[data-act-idx]").forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("input")) return;
      const actIdx = parseInt(item.dataset.actIdx);
      if (!isNaN(actIdx)) openAtivacaoDetalhesModal(actIdx);
    });
  });

  // Restaurar modal de ativação se estava aberto antes do re-render
  if (openAtivacaoIdx !== null && c.ativacoes && c.ativacoes[openAtivacaoIdx]) {
    openAtivacaoDetalhesModal(openAtivacaoIdx);
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

    // Deduct spent dice permanently on conflict entity
    c.spentS = (c.spentS || 0) + (act.investedS || 0);
    c.spentA = (c.spentA || 0) + (act.investedA || 0);
    c.spentP = (c.spentP || 0) + (act.investedP || 0);

    act.investedS = 0;
    act.investedA = 0;
    act.investedP = 0;
    act.snapshotS = 0;
    act.snapshotA = 0;
    act.snapshotP = 0;

    const item = screen.querySelector(`.conflito-ativacao-item[data-act-idx="${idx}"]`);
    if (item) {
      item.classList.remove('completed-item');
      item.querySelectorAll('.invest-val').forEach(span => {
        const parts = span.textContent.split('/');
        const required = parts[1] || '0';
        span.textContent = `0/${required}`;
        span.classList.remove('met');
      });
      const resetBtn = item.querySelector('.btn-reset-ativacao');
      resetBtn?.remove();
    }

    if (ativacaoDetalhesModal && !ativacaoDetalhesModal.classList.contains("hidden") && parseInt(ativacaoDetalhesModal.dataset.openAtivacaoIdx) === idx) {
      ativacaoDetalhesBody.querySelectorAll('.invest-val').forEach(span => {
        const parts = span.textContent.split('/');
        const required = parts[1] || '0';
        span.textContent = `0/${required}`;
        span.classList.remove('met');
      });
      const modalResetBtn = ativacaoDetalhesBody.querySelector('.btn-reset-ativacao');
      modalResetBtn?.remove();
    }

    saveConflito(c);
    renderConflitoLastRollCounter();
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
      c.manualBonusS = 0;
      c.manualBonusA = 0;
      c.manualBonusP = 0;
      c.spentS = 0;
      c.spentA = 0;
      c.spentP = 0;
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
  
  // Função auxiliar para atualizar o valor visual dos dados na modal de nova ameaça
  const setModalAmeacaDiceVal = (targetId, val) => {
    const clamped = Math.max(0, Math.min(20, parseInt(val) || 0));
    const input = screen.querySelector(`#${targetId}`);
    const span = screen.querySelector(`#${targetId}-val`);
    if (input) input.value = clamped;
    if (span) span.textContent = clamped;
  };

  // Botões de incremento e decremento de dados (+/-)
  screen.querySelectorAll(".btn-dice-step").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const step = parseInt(btn.dataset.step) || 0;
      const current = parseInt(screen.querySelector(`#${targetId}`)?.value) || 0;
      setModalAmeacaDiceVal(targetId, current + step);
    });
  });

  // Abrir modal de ameaça (add)
  screen.querySelector("#btn-conflito-add-ameaca")?.addEventListener("click", () => {
    _editingAmeacaIdx = null;
    if (ameacaModal) {
      screen.querySelector("#modal-ameaca-nome").value = "";
      screen.querySelector("#modal-ameaca-descricao").value = "";
      setModalAmeacaDiceVal("modal-ameaca-d6", 1);
      setModalAmeacaDiceVal("modal-ameaca-d10", 0);
      setModalAmeacaDiceVal("modal-ameaca-d12", 0);
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
      setModalAmeacaDiceVal("modal-ameaca-d6", a.d6 ?? 1);
      setModalAmeacaDiceVal("modal-ameaca-d10", a.d10 ?? 0);
      setModalAmeacaDiceVal("modal-ameaca-d12", a.d12 ?? 0);
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
      setModalAmeacaDiceVal("modal-ameaca-d6", match.d6 !== undefined ? match.d6 : 1);
      setModalAmeacaDiceVal("modal-ameaca-d10", match.d10 !== undefined ? match.d10 : 0);
      setModalAmeacaDiceVal("modal-ameaca-d12", match.d12 !== undefined ? match.d12 : 0);
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

  // --- MODAL DE DETALHES DA AMEAÇA (SEM DESFOQUE) ---
  const detalhesModal = screen.querySelector("#conflito-modal-ameaca-detalhes");
  const detalhesBody = screen.querySelector("#ameaca-detalhes-modal-body");
  const detalhesTitle = screen.querySelector("#ameaca-detalhes-modal-title");

  const hideDetalhesModal = () => {
    if (detalhesModal) {
      detalhesModal.classList.add("hidden");
      detalhesModal.dataset.openAmeacaIdx = "";
      detalhesBody.innerHTML = "";
    }
  };

  screen.querySelector("#btn-close-ameaca-detalhes")?.addEventListener("click", hideDetalhesModal);
  detalhesModal?.addEventListener("click", (e) => {
    if (e.target === detalhesModal) hideDetalhesModal();
  });

  screen.querySelectorAll(".btn-view-ameaca").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      const a = c.ameacas[idx];
      if (!a || !detalhesModal || !detalhesBody) return;

      const preferredTab = btn.dataset.tab || detalhesModal.dataset.activeTab || "tab-geral";
      detalhesModal.dataset.openAmeacaIdx = idx;
      detalhesModal.dataset.activeTab = preferredTab;
      detalhesTitle.textContent = `Ameaça: ${a.nome}`;
      
      const diceDesc = [
        a.d6 > 0 ? `${a.d6}d6` : '',
        a.d10 > 0 ? `${a.d10}d10` : '',
        a.d12 > 0 ? `${a.d12}d12` : ''
      ].filter(Boolean).join(" + ") || "Sem dados";

      const ativacoesCount = (a.ativacoes || []).length;

      detalhesBody.innerHTML = `
        <div class="world-list-item conflito-ameaca-card modal-ameaca-card-inner">
          <!-- Linha de Título e Objetivo Editáveis -->
          <div class="modal-ameaca-header-row">
            <input type="text" id="modal-edit-ameaca-nome" class="modal-ameaca-input-nome" value="${esc(a.nome)}" placeholder="Nome da Ameaça">
            <select id="modal-edit-ameaca-objetivo" class="modal-ameaca-select-objetivo">
              <option value="Principal" ${a.objetivoTipo === 'Principal' ? 'selected' : ''}>Objetivo Principal</option>
              <option value="Secundário" ${a.objetivoTipo === 'Secundário' ? 'selected' : ''}>Objetivo Secundário</option>
              <option value="Cenário" ${a.objetivoTipo === 'Cenário' ? 'selected' : ''}>Apenas Cenário</option>
            </select>
          </div>

          <!-- Navegação por Abas -->
          <div class="modal-ameaca-tabs">
            <button type="button" class="modal-ameaca-tab-btn active" data-tab="tab-geral">
              Geral & Rolagem
            </button>
            <button type="button" class="modal-ameaca-tab-btn" data-tab="tab-ativacoes">
              Ativações <span class="modal-ameaca-tab-badge">${ativacoesCount}</span>
            </button>
            <button type="button" class="modal-ameaca-tab-btn" data-tab="tab-historico">
              Histórico <span class="modal-ameaca-tab-badge" id="modal-ameaca-rolagens-badge">${(a.rolagens || []).length}</span>
            </button>
          </div>

          <!-- Aba 1: Geral & Rolagem -->
          <div id="tab-geral" class="modal-ameaca-tab-content active">
            <!-- Descrição Editável -->
            <div class="modal-ameaca-desc-group">
              <textarea id="modal-edit-ameaca-descricao" placeholder="Descrição / Interesses da Ameaça..." class="ws-textarea modal-ameaca-textarea-desc">${esc(a.descricao || '')}</textarea>
            </div>

            <!-- Configuração dos Dados Editáveis e Ações -->
            <div class="modal-ameaca-dice-panel">
              <span style="font-size:var(--font-size-xs); color:var(--text-secondary); font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">Dados de Rolagem:</span>
              <div class="modal-ameaca-dice-row">
                <div class="investimento-control-group group-s" style="flex:1; flex-direction:column; padding:8px; gap:6px; cursor:default;">
                  <img src="assets/d6/3-4(D6).webp" alt="d6" style="width:36px;height:36px;object-fit:contain;">
                  <span style="font-size:var(--font-size-xs); color:var(--text-secondary); font-weight:bold;">d6</span>
                  <div style="display:flex; align-items:center; gap:4px; justify-content:center;">
                    <button type="button" class="btn-ameaca-dice-step" data-target="modal-edit-ameaca-d6" data-step="-1" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">-</button>
                    <span id="modal-edit-ameaca-d6-val" class="invest-val" style="min-width:16px; font-weight:bold;">${a.d6 !== undefined ? a.d6 : 1}</span>
                    <button type="button" class="btn-ameaca-dice-step" data-target="modal-edit-ameaca-d6" data-step="1" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">+</button>
                    <input type="hidden" id="modal-edit-ameaca-d6" value="${a.d6 !== undefined ? a.d6 : 1}">
                  </div>
                </div>

                <div class="investimento-control-group group-a" style="flex:1; flex-direction:column; padding:8px; gap:6px; cursor:default;">
                  <img src="assets/d10/6(D10).webp" alt="d10" style="width:36px;height:36px;object-fit:contain;">
                  <span style="font-size:var(--font-size-xs); color:var(--text-secondary); font-weight:bold;">d10</span>
                  <div style="display:flex; align-items:center; gap:4px; justify-content:center;">
                    <button type="button" class="btn-ameaca-dice-step" data-target="modal-edit-ameaca-d10" data-step="-1" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">-</button>
                    <span id="modal-edit-ameaca-d10-val" class="invest-val" style="min-width:16px; font-weight:bold;">${a.d10 !== undefined ? a.d10 : 0}</span>
                    <button type="button" class="btn-ameaca-dice-step" data-target="modal-edit-ameaca-d10" data-step="1" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">+</button>
                    <input type="hidden" id="modal-edit-ameaca-d10" value="${a.d10 !== undefined ? a.d10 : 0}">
                  </div>
                </div>

                <div class="investimento-control-group group-p" style="flex:1; flex-direction:column; padding:8px; gap:6px; cursor:default;">
                  <img src="assets/d12/11(D12).webp" alt="d12" style="width:36px;height:36px;object-fit:contain;">
                  <span style="font-size:var(--font-size-xs); color:var(--text-secondary); font-weight:bold;">d12</span>
                  <div style="display:flex; align-items:center; gap:4px; justify-content:center;">
                    <button type="button" class="btn-ameaca-dice-step" data-target="modal-edit-ameaca-d12" data-step="-1" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">-</button>
                    <span id="modal-edit-ameaca-d12-val" class="invest-val" style="min-width:16px; font-weight:bold;">${a.d12 !== undefined ? a.d12 : 0}</span>
                    <button type="button" class="btn-ameaca-dice-step" data-target="modal-edit-ameaca-d12" data-step="1" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:#fff; width:22px;height:22px;border-radius:3px;cursor:pointer;font-weight:bold;">+</button>
                    <input type="hidden" id="modal-edit-ameaca-d12" value="${a.d12 !== undefined ? a.d12 : 0}">
                  </div>
                </div>
              </div>

              <div class="modal-ameaca-actions-bar">
                <button class="btn btn-sm btn-roll-ameaca btn-blue" data-idx="${idx}">🎲 Rolar Ameaça</button>
              </div>
            </div>
          </div>

          <!-- Aba 2: Ativações -->
          <div id="tab-ativacoes" class="modal-ameaca-tab-content">
            <div id="conflito-last-roll-container-ameaca-${idx}" class="conflito-last-roll-counter">
                  <!-- Renderizado por renderConflitoLastRollCounter -->
            </div>
            <div class="modal-ameaca-ativacoes-header">
              <button type="button" class="btn btn-sm btn-add-ativacao-ameaca btn-blue" data-ameaca-idx="${idx}">+ Nova Ativação</button>
            </div>
            <div class="ameaca-ativacoes-container">
              <div class="ameaca-ativacoes-list">
                ${_renderAmeacaActivations(a, idx)}
              </div>
            </div>
          </div>

          <!-- Aba 3: Histórico de Rolagem -->
          <div id="tab-historico" class="modal-ameaca-tab-content">
            <div class="modal-ameaca-log-header">
              <span style="font-size: var(--font-size-xs); font-weight: bold; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Rolagens Recentes da Ameaça</span>
              <button type="button" class="btn-conflito-clear-log btn-clear-ameaca-log" data-idx="${idx}" title="Limpar histórico desta ameaça">🗑️ Limpar</button>
            </div>
            <div class="modal-ameaca-log-container" id="modal-ameaca-log-list-${idx}">
              ${_renderAmeacaRollLogHtml(a)}
            </div>
          </div>
        </div>
      `;

      // Gerenciamento das Abas
      const activeTabId = preferredTab || "tab-geral";
      detalhesBody.querySelectorAll(".modal-ameaca-tab-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.tab === activeTabId);
      });
      detalhesBody.querySelectorAll(".modal-ameaca-tab-content").forEach(cEl => {
        cEl.classList.toggle("active", cEl.id === activeTabId);
      });

      detalhesBody.querySelectorAll(".modal-ameaca-tab-btn").forEach(tabBtn => {
        tabBtn.addEventListener("click", () => {
          detalhesBody.querySelectorAll(".modal-ameaca-tab-btn").forEach(b => b.classList.remove("active"));
          detalhesBody.querySelectorAll(".modal-ameaca-tab-content").forEach(c => c.classList.remove("active"));

          tabBtn.classList.add("active");
          const target = tabBtn.dataset.tab;
          detalhesModal.dataset.activeTab = target;
          const content = detalhesBody.querySelector(`#${target}`);
          if (content) content.classList.add("active");
        });
      });

      // Listeners para edição em tempo real no modal
      const inputNome = detalhesBody.querySelector("#modal-edit-ameaca-nome");
      inputNome?.addEventListener("input", (ev) => {
        a.nome = ev.target.value;
        detalhesTitle.textContent = `Ameaça: ${a.nome || 'Sem Nome'}`;
        saveConflito(c);
        const cardTitle = screen.querySelector(`.conflito-ameaca-card[data-idx="${idx}"] strong`);
        if (cardTitle) cardTitle.textContent = a.nome;
      });

      const selectObjetivo = detalhesBody.querySelector("#modal-edit-ameaca-objetivo");
      selectObjetivo?.addEventListener("change", (ev) => {
        a.objetivoTipo = ev.target.value;
        saveConflito(c);
        const cardBadge = screen.querySelector(`.conflito-ameaca-card[data-idx="${idx}"] .attr-value-badge`);
        if (cardBadge) cardBadge.textContent = a.objetivoTipo;
      });

      const inputDesc = detalhesBody.querySelector("#modal-edit-ameaca-descricao");
      inputDesc?.addEventListener("input", (ev) => {
        a.descricao = ev.target.value;
        saveConflito(c);
      });

      // Controle dos botões de incremento/decremento dos dados da ameaça (+/-)
      detalhesBody.querySelectorAll(".btn-ameaca-dice-step").forEach(stepBtn => {
        stepBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const targetId = stepBtn.dataset.target;
          const step = parseInt(stepBtn.dataset.step) || 0;
          const hiddenInput = detalhesBody.querySelector(`#${targetId}`);
          const valSpan = detalhesBody.querySelector(`#${targetId}-val`);
          if (!hiddenInput) return;

          let currentVal = parseInt(hiddenInput.value) || 0;
          let newVal = Math.max(0, Math.min(20, currentVal + step));

          hiddenInput.value = newVal;
          if (valSpan) valSpan.textContent = newVal;

          if (targetId === "modal-edit-ameaca-d6") a.d6 = newVal;
          else if (targetId === "modal-edit-ameaca-d10") a.d10 = newVal;
          else if (targetId === "modal-edit-ameaca-d12") a.d12 = newVal;

          saveConflito(c);
        });
      });

      // Conectar botões dentro do modal de detalhes
      renderConflitoLastRollCounter();

      detalhesBody.querySelector(".btn-roll-ameaca")?.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const parts = [];
        if (a.d6 > 0) parts.push(`${a.d6}d6`);
        if (a.d10 > 0) parts.push(`${a.d10}d10`);
        if (a.d12 > 0) parts.push(`${a.d12}d12`);
        if (parts.length === 0) {
          alert("Esta ameaça não tem nenhum dado atribuído!");
          return;
        }
        const customFormulaInput = document.getElementById("dice-custom-formula");
        if (customFormulaInput) customFormulaInput.value = parts.join("+");
        _pendingAmeacaRollIdx = idx;
        executeCustomRoll();
      });

      detalhesBody.querySelector(".btn-clear-ameaca-log")?.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (confirm(`Limpar o histórico de rolagens da ameaça "${a.nome || ''}"?`)) {
          a.rolagens = [];
          saveConflito(c);
          const logList = detalhesBody.querySelector(`#modal-ameaca-log-list-${idx}`);
          if (logList) logList.innerHTML = _renderAmeacaRollLogHtml(a);
          const badge = detalhesBody.querySelector("#modal-ameaca-rolagens-badge");
          if (badge) badge.textContent = "0";
          renderConflitoLastRollCounter();
        }
      });

      detalhesBody.querySelector(".btn-add-ativacao-ameaca")?.addEventListener("click", (ev) => {
        ev.stopPropagation();
        activeThreatIdxForModal = idx;
        editingActivationState = null;
        if (modal) {
          modalTitle.textContent = "Nova Ativação da Ameaça";
          confirmBtn.textContent = "Adicionar";
          setCounts(0, 0, 0);
          updateGatilhoPreview();
          screen.querySelector("#modal-ativacao-titulo").value = "";
          screen.querySelector("#modal-ativacao-efeito").value = "";
          modal.classList.remove("hidden");
        }
      });

      // Função para conectar listeners de ativações dentro do modal de detalhes
      const attachDetalhesAtivacoesListeners = () => {
        detalhesBody.querySelectorAll(".btn-edit-ativacao-ameaca").forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const ameacaIdx = parseInt(btn.dataset.ameacaIdx);
            const actIdx = parseInt(btn.dataset.actIdx);
            const targetA = c.ameacas[ameacaIdx];
            if (!targetA || !targetA.ativacoes || !targetA.ativacoes[actIdx]) return;
            const act = targetA.ativacoes[actIdx];
            editingActivationState = { idx: actIdx, ameacaIdx, isAmeaca: true };
            activeThreatIdxForModal = null;
            if (modal) {
              modalTitle.textContent = "Editar Ativação da Ameaça";
              confirmBtn.textContent = "Salvar";
              const val = act.gatilho || "";
              setCounts(
                (val.match(/S/g) || []).length,
                (val.match(/A/g) || []).length,
                (val.match(/P/g) || []).length
              );
              updateGatilhoPreview();
              screen.querySelector("#modal-ativacao-titulo").value = act.titulo || "";
              screen.querySelector("#modal-ativacao-efeito").value = act.efeito || "";
              modal.classList.remove("hidden");
            }
          });
        });

        detalhesBody.querySelectorAll(".btn-delete-ativacao-ameaca").forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const ameacaIdx = parseInt(btn.dataset.ameacaIdx);
            const actIdx = parseInt(btn.dataset.actIdx);
            const targetA = c.ameacas[ameacaIdx];
            if (!targetA || !targetA.ativacoes) return;

            if (confirm(`Excluir a ativação "${targetA.ativacoes[actIdx]?.titulo || ''}" da ameaça?`)) {
              targetA.ativacoes.splice(actIdx, 1);
              saveConflito(c);
              const listContainer = detalhesBody.querySelector(".ameaca-ativacoes-list");
              if (listContainer) {
                listContainer.innerHTML = _renderAmeacaActivations(targetA, ameacaIdx);
                attachDetalhesAtivacoesListeners();
              }
              renderConflitoSheet();
            }
          });
        });

        detalhesBody.querySelectorAll(".btn-invest-ameaca-inc").forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            _updateAmeacaInvestment(parseInt(btn.dataset.ameacaIdx), parseInt(btn.dataset.actIdx), btn.dataset.type, 1);
          });
        });

        detalhesBody.querySelectorAll(".btn-invest-ameaca-dec").forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            _updateAmeacaInvestment(parseInt(btn.dataset.ameacaIdx), parseInt(btn.dataset.actIdx), btn.dataset.type, -1);
          });
        });

        detalhesBody.querySelectorAll(".btn-reset-ativacao-ameaca").forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            _resetAmeacaAtivacao(parseInt(btn.dataset.ameacaIdx), parseInt(btn.dataset.actIdx));
          });
        });
      };

      attachDetalhesAtivacoesListeners();

      detalhesModal.classList.remove("hidden");
    });
  });

  // Clique no card abre diretamente os detalhes da ameaça
  screen.querySelectorAll(".conflito-ameaca-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      card.querySelector(".btn-view-ameaca")?.click();
    });
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

    if (delta > 0) {
      const avail = _getAvailableDice(a.rolagens, a.ativacoes, a);
      if ((avail[type] || 0) <= 0) {
        return;
      }
    }

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
    screen.querySelectorAll(selector).forEach(btn => {
      const group = btn.closest('.conflito-result-badge') || btn.closest('.investimento-control-group');
      if (group) {
        const valSpan = group.querySelector('.invest-val');
        if (valSpan) {
          valSpan.textContent = `${act[key]}/${required}`;
          valSpan.classList.toggle('met', act[key] >= required && required > 0);
        }
      }
    });

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
            resetBtn.style.cssText = 'background:rgba(255,255,0,0.1); border:1px solid rgba(255,200,0,0.3); color:var(--color-gold-glow); font-size: var(--font-size-xs); padding:2px 8px; border-radius:3px; cursor:pointer;';
            resetBtn.addEventListener('click', (e) => { e.stopPropagation(); _resetAmeacaAtivacao(ameacaIdx, actIdx); });
            container.insertBefore(resetBtn, editBtn);
          } else if (!isCompleted && resetBtn) {
            resetBtn.remove();
          }
        }
      }
    }

    saveConflito(c);
    renderConflitoLastRollCounter();
  }

  function _resetAmeacaAtivacao(ameacaIdx, actIdx) {
    const a = c.ameacas[ameacaIdx];
    if (!a || !a.ativacoes || !a.ativacoes[actIdx]) return;
    const act = a.ativacoes[actIdx];

    // Deduct spent dice permanently on threat entity
    a.spentS = (a.spentS || 0) + (act.investedS || 0);
    a.spentA = (a.spentA || 0) + (act.investedA || 0);
    a.spentP = (a.spentP || 0) + (act.investedP || 0);

    act.investedS = 0;
    act.investedA = 0;
    act.investedP = 0;
    act.snapshotS = 0;
    act.snapshotA = 0;
    act.snapshotP = 0;

    const el = screen.querySelector(`.btn-invest-ameaca-inc[data-ameaca-idx="${ameacaIdx}"][data-act-idx="${actIdx}"], .btn-invest-ameaca-dec[data-ameaca-idx="${ameacaIdx}"][data-act-idx="${actIdx}"]`);
    const item = el?.closest('.conflito-ativacao-item');
    if (item) {
      item.classList.remove('completed-item');
      item.querySelectorAll('.invest-val').forEach(span => {
        const required = span.textContent.split('/')[1];
        span.textContent = `0/${required}`;
        span.classList.remove('met');
      });
      const resetBtn = item.querySelector('.btn-reset-ativacao-ameaca');
      resetBtn?.remove();
    }

    saveConflito(c);
    renderConflitoLastRollCounter();
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

function _renderRollItemHtml(roll, rIdx) {
  let sucessos = roll.bonusSuccesses || 0;
  let adaptacoes = roll.bonusAdaptations || 0;
  let pressoes = roll.bonusPressures || 0;

  (roll.keptDiceIndexes || []).forEach(idx => {
    const die = roll.results && roll.results[idx];
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
      ${(roll.results || []).map((die, idx) => {
    const isKept = (roll.keptDiceIndexes || []).includes(idx);
    const imgSrc = getDieFaceImgSrc(die.sides, die.value);
    const contentHtml = imgSrc
      ? `<img src="${imgSrc}" class="die-face-img" alt="d${die.sides} face ${die.value}">`
      : `<span style="font-size: var(--font-size-xs);">d${die.sides}:${die.value}</span>`;
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
        <span class="conflito-log-formula">${roll.formula || ''}</span>
        <span class="conflito-log-time">${roll.timestamp || ''}</span>
      </div>
      <div class="conflito-log-dice">
        ${diceHtml}
      </div>
    </div>
  `;
}

function _renderAmeacaRollLogHtml(ameaca) {
  const rolagens = ameaca.rolagens || [];
  if (rolagens.length === 0) {
    return `<div class="conflito-log-empty">Nenhuma rolagem realizada por esta ameaça ainda.</div>`;
  }
  return rolagens.map((roll, idx) => _renderRollItemHtml(roll, idx)).reverse().join("");
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

  list.innerHTML = c.rolagens.map((roll, rIdx) => _renderRollItemHtml(roll, rIdx)).reverse().join("");
}

function _getAvailableDice(rolagens, activations, target = null) {
  let sucessos = 0;
  let adaptacoes = 0;
  let pressoes = 0;

  (rolagens || []).forEach(roll => {
    // Compatibilidade com bônus de rolagem legados
    sucessos += roll.bonusSuccesses || 0;
    adaptacoes += roll.bonusAdaptations || 0;
    pressoes += roll.bonusPressures || 0;

    (roll.keptDiceIndexes || []).forEach(idx => {
      const die = roll.results && roll.results[idx];
      if (die && die.symbols) {
        die.symbols.forEach(sym => {
          if (sym === "A") sucessos++;
          if (sym === "B") adaptacoes++;
          if (sym === "C") pressoes++;
        });
      }
    });
  });

  if (target) {
    sucessos += (target.manualBonusS || 0) - (target.spentS || 0);
    adaptacoes += (target.manualBonusA || 0) - (target.spentA || 0);
    pressoes += (target.manualBonusP || 0) - (target.spentP || 0);
  }

  let investedS = 0;
  let investedA = 0;
  let investedP = 0;
  (activations || []).forEach(act => {
    investedS += act.investedS || 0;
    investedA += act.investedA || 0;
    investedP += act.investedP || 0;
  });

  return {
    S: Math.max(0, sucessos - investedS),
    A: Math.max(0, adaptacoes - investedA),
    P: Math.max(0, pressoes - investedP)
  };
}

function _adjustRollPool(type, delta, isThreat, threatIdx) {
  const c = worldState.currentConflito;
  if (!c) return;

  let target;
  if (isThreat) {
    if (!c.ameacas || !c.ameacas[threatIdx]) return;
    target = c.ameacas[threatIdx];
  } else {
    target = c;
  }

  // Prevent available from going below 0
  const avail = _getAvailableDice(target.rolagens, target.ativacoes, target);
  if (delta < 0 && (avail[type] || 0) <= 0) {
    return;
  }

  const key = `manualBonus${type}`;
  target[key] = (target[key] || 0) + delta;

  saveConflito(c);
  renderConflitoLastRollCounter();
}

export function renderConflitoLastRollCounter() {
  const c = worldState.currentConflito;
  if (!c) return;

  const updateContainer = (container, rolagens, activations, target, isThreat = false, threatIdx = null) => {
    if (!container) return;
    
    const avail = _getAvailableDice(rolagens, activations, target);

    container.innerHTML = `
      <span class="last-roll-label">Disponível:</span>
      <span class="conflito-result-badge badge-s" title="Sucessos">
        <img src="assets/sucesso.webp" alt="S" class="conflito-symbol-icon">
        <button type="button" class="btn-pool-adjust btn-pool-dec" data-type="S" data-threat="${isThreat}" data-threat-idx="${threatIdx}">-</button>
        <span>S: ${avail.S}</span>
        <button type="button" class="btn-pool-adjust btn-pool-inc" data-type="S" data-threat="${isThreat}" data-threat-idx="${threatIdx}">+</button>
      </span>
      <span class="conflito-result-badge badge-a" title="Adaptações">
        <img src="assets/adaptacao.webp" alt="A" class="conflito-symbol-icon">
        <button type="button" class="btn-pool-adjust btn-pool-dec" data-type="A" data-threat="${isThreat}" data-threat-idx="${threatIdx}">-</button>
        <span>A: ${avail.A}</span>
        <button type="button" class="btn-pool-adjust btn-pool-inc" data-type="A" data-threat="${isThreat}" data-threat-idx="${threatIdx}">+</button>
      </span>
      <span class="conflito-result-badge badge-p" title="Ameaças/Pressões">
        <img src="assets/pressao.webp" alt="P" class="conflito-symbol-icon">
        <button type="button" class="btn-pool-adjust btn-pool-dec" data-type="P" data-threat="${isThreat}" data-threat-idx="${threatIdx}">-</button>
        <span>P: ${avail.P}</span>
        <button type="button" class="btn-pool-adjust btn-pool-inc" data-type="P" data-threat="${isThreat}" data-threat-idx="${threatIdx}">+</button>
      </span>
    `;
    container.className = "conflito-last-roll-counter";
  };

  const registerAdjustListeners = (container) => {
    if (!container) return;
    container.querySelectorAll(".btn-pool-adjust").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const type = btn.dataset.type;
        const isThreat = btn.dataset.threat === "true";
        const threatIdx = btn.dataset.threatIdx !== "null" ? parseInt(btn.dataset.threatIdx) : null;
        const delta = btn.classList.contains("btn-pool-inc") ? 1 : -1;
        _adjustRollPool(type, delta, isThreat, threatIdx);
      });
    });
  };

  const mainContainer = document.getElementById("conflito-last-roll-container");
  updateContainer(mainContainer, c.rolagens, c.ativacoes, c, false, null);
  registerAdjustListeners(mainContainer);

  (c.ameacas || []).forEach((a, idx) => {
    const amContainer = document.getElementById(`conflito-last-roll-container-ameaca-${idx}`);
    updateContainer(amContainer, a.rolagens, a.ativacoes, a, true, idx);
    registerAdjustListeners(amContainer);
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
        if (a.rolagens.length > 50) a.rolagens.shift();
        a.ativacoes?.forEach(act => {
          act.snapshotS = act.investedS || 0;
          act.snapshotA = act.investedA || 0;
          act.snapshotP = act.investedP || 0;
        });

        // Se o modal de detalhes da ameaça estiver aberto, atualiza a lista de histórico e a badge em tempo real
        const detalhesModal = document.getElementById("conflito-modal-ameaca-detalhes");
        if (detalhesModal && !detalhesModal.classList.contains("hidden") && parseInt(detalhesModal.dataset.openAmeacaIdx) === _pendingAmeacaRollIdx) {
          const logList = document.getElementById(`modal-ameaca-log-list-${_pendingAmeacaRollIdx}`);
          if (logList) logList.innerHTML = _renderAmeacaRollLogHtml(a);
          const badge = document.getElementById("modal-ameaca-rolagens-badge");
          if (badge) badge.textContent = (a.rolagens || []).length;
        }
      }
      _pendingAmeacaRollIdx = null;
    } else {
      if (!c.rolagens) c.rolagens = [];
      c.rolagens.push(e.detail);
      if (c.rolagens.length > 50) c.rolagens.shift();

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
