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
  
  const addHtml = (available.length > 0 || items.length > 0)
    ? `<div style="margin-top:8px;">
         <button class="btn btn-sm btn-secondary btn-open-ref-modal" data-refcontainer="${containerId}" data-reflabel="${esc(label)}" data-statekey="${stateKey}" data-currentids="${(ids||[]).join(',')}">
           + Adicionar
         </button>
       </div>`
    : "";
  return `
    <div style="margin-bottom:10px;">
      <p style="font-family:var(--font-heading);font-size:var(--font-size-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px;">${esc(label)}</p>
      <div class="ref-chips-container" id="${containerId}-chips">${chips}</div>
      ${addHtml}
    </div>
  `;
}

export function renderRefPanelSingle(label, id, currentId, stateKey) {
  const items = stateKey === "characters"
    ? (window._worldStateCharacters || [])
    : (worldState[stateKey] || []);
    
  const currentItem = items.find(i => i.id === currentId);
  
  const chipHtml = currentItem 
    ? `<span class="ref-chip">
         <span>${esc(currentItem.name || currentItem.nome)}</span>
         <button class="btn-remove-ref" data-refid="${currentItem.id}" data-refcontainer="${id}" title="Remover vínculo">&times;</button>
       </span>`
    : `<span style="font-size:10px;color:var(--text-muted);">Nenhum vinculado</span>`;
    
  const addHtml = items.length > 0
    ? `<div style="margin-top:8px;">
         <button class="btn btn-sm btn-secondary btn-open-ref-modal-single btn-blue" data-refcontainer="${id}" data-reflabel="${esc(label)}" data-statekey="${stateKey}" data-currentids="${currentId || ''}">
           + ${currentItem ? 'Alterar' : 'Vincular'}
         </button>
       </div>`
    : "";

  return `
    <div style="margin-bottom:8px;">
      <label style="font-family:var(--font-heading);font-size:var(--font-size-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:4px;">${esc(label)}</label>
      <div class="ref-chips-container" id="${id}-chips">${chipHtml}</div>
      ${addHtml}
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

export function renderProfileCard(entity, prefix, config) {
  const { imageKey = 'imagem', sideFields = [], gridFields = [] } = config;

  const imgContent = entity[imageKey]
    ? `<img src="${entity[imageKey]}" alt="Imagem">`
    : `<div class="local-image-placeholder">${IMAGE_PLACEHOLDER_SVG}<span>Clique para adicionar imagem</span></div>`;

  const renderField = (field, value) => {
    const { id, label, type, options = [], valueKey, dataset = {}, attrs = {} } = field;
    const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    const dataAttrs = Object.entries(dataset).map(([k, v]) => `data-${k}="${v}"`).join(' ');

    if (type === 'select') {
      const optsHtml = options.map(o => `<option value="${o.value}" ${o.value === value ? 'selected' : ''}>${o.label}</option>`).join('');
      return `
        <div class="profile-attr-row">
          <label for="${id}">${label}</label>
          <select id="${id}" ${dataAttrs} ${attrStr}>${optsHtml}</select>
        </div>
      `;
    }
    if (type === 'textarea') {
      return `
        <div class="profile-attr-row" style="align-items: flex-start; gap: 8px;">
          <label for="${id}" style="margin-top: 4px;">${label}</label>
          <textarea id="${id}" class="ws-textarea" ${attrStr} ${dataAttrs}>${esc(value || '')}</textarea>
        </div>
      `;
    }
    return `
      <div class="profile-attr-row">
        <label for="${id}">${label}</label>
        <input type="text" id="${id}" class="sheet-input-text" value="${esc(value || '')}" ${attrStr} ${dataAttrs}>
      </div>
    `;
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  };

  function renderFields(fields) {
    let html = '';
    let group = null;
    let groupHtml = '';
    for (const f of fields) {
      const val = getNestedValue(entity, f.valueKey);
      const isNewGroup = f.group && f.group !== group;
      if (isNewGroup && groupHtml) {
        html += `<div class="profile-field-group" data-group="${group}">${groupHtml}</div>`;
        groupHtml = '';
      }
      if (isNewGroup) {
        group = f.group;
        if (f.groupLabel) {
          groupHtml += `<p class="ws-label" style="margin:8px 0 4px;">${esc(f.groupLabel)}</p>`;
        }
        groupHtml += renderField(f, val);
      } else if (!f.group && group) {
        if (groupHtml) {
          html += `<div class="profile-field-group" data-group="${group}">${groupHtml}</div>`;
          groupHtml = '';
        }
        group = null;
        html += renderField(f, val);
      } else if (f.group) {
        groupHtml += renderField(f, val);
      } else {
        group = null;
        html += renderField(f, val);
      }
    }
    if (groupHtml) {
      html += `<div class="profile-field-group" data-group="${group}">${groupHtml}</div>`;
    }
    return html;
  }

  const nonGroupSideFields = sideFields.filter(f => !f.group);
  const groupSideFields = sideFields.filter(f => f.group);

  const sideFieldsHtml = renderFields(nonGroupSideFields);
  const groupFieldsHtml = renderFields(groupSideFields);
  const gridFieldsHtml = renderFields(gridFields);

  const hasThreeColsClass = groupFieldsHtml ? ' has-three-cols' : '';

  return `
    <div class="profile-card card-glass" style="display:flex; flex-direction:column; gap:20px; align-items:stretch; width:100%;">
      <div class="profile-card-top-row${hasThreeColsClass}">
        <div class="portrait-centered-wrapper" style="display:flex; flex-direction:column; align-items:center; padding:10px 0; width:100%;">
          <div class="polaroid-frame" id="${prefix}-image-frame" title="Clique para alterar a imagem" style="margin: 0 auto; flex-shrink:0;">
            ${imgContent}
            <div class="portrait-overlay"><span>Alterar Foto</span></div>
          </div>
          <input type="file" id="${prefix}-image-input" accept="image/*" style="display:none;">
        </div>
        <div class="portrait-side-fields" style="width: 100%; display: flex; flex-direction: column; gap: 10px;">
          ${sideFieldsHtml}
        </div>
        ${groupFieldsHtml ? `
        <div class="portrait-group-fields" style="width: 100%; display: flex; flex-direction: column; gap: 10px;">
          ${groupFieldsHtml}
        </div>` : ''}
      </div>
      <div class="profile-fields-grid" style="width: 100%; display: flex; flex-direction: column; gap: 10px;">
        ${gridFieldsHtml}
      </div>
    </div>
  `;
}
