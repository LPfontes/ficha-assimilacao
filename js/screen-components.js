import { worldState } from "./world-state.js";
import { esc } from "./screen-utils.js";

export const IMAGE_PLACEHOLDER_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5M5.25 3v18M18.75 3v18"/>
</svg>`;

export function renderImageFrame(entity, prefix) {
  const imgContent = entity.imagem
    ? `<img src="${entity.imagem}" alt="Imagem">`
    : `<div class="local-image-placeholder">${IMAGE_PLACEHOLDER_SVG}<span>Clique para adicionar imagem</span></div>`;
  return `
    <div class="card-glass" style="padding:0;overflow:hidden;">
      <div class="local-image-frame" id="${prefix}-image-frame" title="Clique para alterar a imagem" style="border:none;border-radius:0;">
        ${imgContent}
        <div class="local-image-overlay"><span>Alterar Imagem</span></div>
      </div>
      <input type="file" id="${prefix}-image-input" accept="image/*" style="display:none;">
    </div>
  `;
}

export function renderSelectRow(label, id, value, opts) {
  const options = opts.map((o, i) => `<option value="${i}" ${i === value ? "selected" : ""}>${i} – ${o}</option>`).join("");
  return `
    <div class="select-attr-row">
      <label for="${id}">${label}</label>
      <select id="${id}">${options}</select>
    </div>
  `;
}

export function renderAttrDots(key, label, value, max, dotClass) {
  const dots = Array.from({ length: max }, (_, i) => {
    const filled = i < value ? "filled" : "";
    return `<span class="attr-dot ${filled}${dotClass ? " " + dotClass : ""}" data-key="${key}" data-idx="${i}"></span>`;
  }).join("");
  return `
    <div class="attr-row">
      <span class="attr-label">${label}</span>
      <div class="attr-dots">${dots}</div>
      <span class="attr-value-badge" id="attr-val-${key}">${value}</span>
    </div>
  `;
}

export function renderStatusBadge(status, classMap) {
  const cls = classMap[status] || "status-ativo";
  return `<span class="status-badge ${cls}">${esc(status)}</span>`;
}

export function renderCrudListEmpty(text) {
  return `<div class="world-list-empty">${esc(text)}</div>`;
}

export function renderCrudItem(fieldsHtml, removeAttr, removeLabel) {
  return `
    <div class="world-list-item" ${removeAttr ? removeAttr : ""}>
      <div class="item-fields">${fieldsHtml}</div>
      <button class="btn-remove-world-item" ${removeAttr} title="${esc(removeLabel || "Remover")}">&times;</button>
    </div>
  `;
}

export function renderCrudSection(title, btnId, btnLabel, listId, listHtml) {
  return `
    <div class="card-glass" style="padding:16px;">
      <div class="world-list-section">
        <div class="world-list-header">
          <h4>${esc(title)}</h4>
          <button class="btn btn-sm" id="${btnId}">+ ${esc(btnLabel)}</button>
        </div>
        <div class="world-list-items" id="${listId}">${listHtml}</div>
      </div>
    </div>
  `;
}

export function renderRefPanelMulti(label, containerId, ids, stateKey) {
  const items = stateKey === "characters"
    ? (window._worldStateCharacters || [])
    : (worldState[stateKey] || []);
  const selected = items.filter(i => (ids || []).includes(i.id));
  const available = items.filter(i => !(ids || []).includes(i.id));
  const chips = selected.map(s => `
    <span class="ref-chip">
      <span>${esc(s.name || s.nome)}</span>
      <button class="btn-remove-ref" data-refid="${s.id}" data-refcontainer="${containerId}" title="Remover vínculo">&times;</button>
    </span>
  `).join("") || `<span style="font-size:10px;color:var(--text-muted);">Nenhum vinculado</span>`;
  const selectOpts = available.map(a => `<option value="${a.id}">${esc(a.name || a.nome)}</option>`).join("");
  const selectHtml = available.length > 0
    ? `<select id="${containerId}-add" style="font-size:11px;padding:3px 6px;max-width:160px;">
         <option value="">— Vincular —</option>${selectOpts}
       </select>`
    : "";
  return `
    <div style="margin-bottom:10px;">
      <p style="font-family:var(--font-heading);font-size:var(--font-size-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;">${esc(label)}</p>
      <div class="ref-chips-container" id="${containerId}-chips">${chips}</div>
      <div style="margin-top:5px;">${selectHtml}</div>
    </div>
  `;
}

export function renderRefPanelSingle(label, id, currentId, stateKey) {
  const items = stateKey === "characters"
    ? (window._worldStateCharacters || [])
    : (worldState[stateKey] || []);
  const opts = items.map(i => `<option value="${i.id}" ${i.id === currentId ? "selected" : ""}>${esc(i.name || i.nome)}</option>`).join("");
  return `
    <div style="margin-bottom:8px;">
      <label style="font-family:var(--font-heading);font-size:var(--font-size-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:4px;">${esc(label)}</label>
      <select id="${id}" style="width:100%;font-size:var(--font-size-xs);padding:4px 8px;">
        <option value="">— Nenhum —</option>${opts}
      </select>
    </div>
  `;
}

export function renderHeader(backId, titleInputId, titleValue, placeholder, deleteBtnId, extraRight) {
  return `
    <div class="world-sheet-header">
      <button class="sheet-back-btn" id="${backId}">← Voltar</button>
      <div class="world-sheet-title-group">
        <input class="world-name-input" id="${titleInputId}" type="text" value="${esc(titleValue)}" placeholder="${esc(placeholder)}">
      </div>
      ${extraRight || ""}
      <button class="btn btn-danger btn-sm" id="${deleteBtnId}">Excluir</button>
    </div>
  `;
}
