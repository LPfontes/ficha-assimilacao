import { worldState, saveConflito, deleteConflito, createNewConflito } from "./world-state.js";
import { hideAllScreens, goToLanding, esc, setupImageUpload } from "./screen-utils.js";
import { renderImageFrame, renderAttrDots, renderStatusBadge, renderRefPanelSingle } from "./screen-components.js";

const TIPO_CONFLITO = ["Doença","Criatura","Rebelião","Ataque Externo","Escassez","Outro"];
const STATUS_CONFLITO = ["Ativo","Contido","Resolvido"];
const STATUS_CLASS_MAP = {
  "Ativo": "status-ativo",
  "Contido": "status-contido",
  "Resolvido": "status-resolvido"
};

function getScreen() { return document.getElementById("conflito-screen"); }

export function loadConflitoSheet(conflito) {
  worldState.currentConflito = conflito;
  worldState.sheetMode = "conflito";
  hideAllScreens();
  getScreen().classList.remove("hidden");
  renderConflitoSheet();
}

export function renderConflitoSheet() {
  const c = worldState.currentConflito;
  if (!c) return;
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
      ${renderImageFrame(c, "conflito")}
      <div class="world-sheet-body">
        <div class="card-glass" style="padding:16px;display:flex;flex-direction:column;gap:14px;">
          <h3 class="ws-section-title" style="margin-bottom:0;">Dados do Conflito</h3>
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
          <div style="display:flex;align-items:center;gap:10px;">
            <label class="ws-label ws-label-inline" style="min-width:100px;">Grau</label>
            <div class="attr-dots" id="conflito-grau-dots">
              ${Array.from({length:10},(_,i)=>`<span class="attr-dot${i<c.grau?' filled attr-dot-danger':''}" data-idx="${i}"></span>`).join("")}
            </div>
            <span class="attr-value-badge" id="conflito-grau-val">${c.grau}</span>
          </div>
          <div>
            <label class="ws-label" style="display:block;margin-bottom:4px;">Descrição / Contexto Narrativo</label>
            <textarea id="conflito-descricao" class="ws-textarea" style="min-height:100px;" placeholder="Descreva o conflito...">${esc(c.descricao)}</textarea>
          </div>
        </div>
        <div class="card-glass" style="padding:16px;display:flex;flex-direction:column;gap:14px;">
          <h3 class="ws-section-title" style="margin-bottom:0;">Referências (Opcionais)</h3>
          ${renderRefPanelSingle("Região Associada",  "conflito-ref-regiao",  c.regiaoId,  "regioes")}
          ${renderRefPanelSingle("Refúgio Associado", "conflito-ref-refugio", c.refugioId, "refugios")}
          ${renderRefPanelSingle("Local Associado",   "conflito-ref-local",   c.localId,   "locais")}
          <div>
            <label class="ws-label" style="display:block;margin-bottom:4px;">Anotações</label>
            <textarea id="conflito-notas" class="ws-textarea" style="min-height:80px;" placeholder="Notas da sessão...">${esc(c.notas)}</textarea>
          </div>
        </div>
      </div>
    </div>
  `;

  _attachListeners(c);
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
    });
  });

  [["conflito-ref-regiao","regiaoId"],["conflito-ref-refugio","refugioId"],["conflito-ref-local","localId"]].forEach(([id, key]) => {
    screen.querySelector(`#${id}`)?.addEventListener("change", e => {
      c[key] = e.target.value || null;
      saveConflito(c);
    });
  });

  setupImageUpload("conflito-image-frame", "conflito-image-input", c, saveConflito);
}

export function startNewConflito() {
  const c = createNewConflito();
  saveConflito(c);
  loadConflitoSheet(c);
}
