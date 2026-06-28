import { worldState, saveRegiao, deleteRegiao, createNewRegiao } from "./world-state.js";
import { hideAllScreens, goToLanding, esc, setupImageUpload } from "./screen-utils.js";
import { renderHeader, renderProfileCard, renderRefPanelMulti } from "./screen-components.js";

const TAMANHO_OPTS   = ["Quarteirão","Largo","Bairro","Cidade Pequena","Zona Urbana","Cidade Média","Cidade Grande"];
const PERIGO_OPTS    = ["Seguro","Baixo","Moderado","Alto","Severo","Extremo","Mortal"];
const HABITACAO_OPTS = ["Inabitada","Esvaziada","Isolada","Esparsa","Dispersa","Concentrada","Inchada"];
const RECURSOS_OPTS  = ["Sem abundância","1 recurso farto","2 recursos fartos","3 recursos fartos","4 recursos fartos","5 recursos fartos","6 recursos fartos"];
const CONTAM_OPTS    = ["Inexistente","Introdutória","Disseminada","Propagada","Epidêmica","Pandêmica","Endêmica"];
const DESLOC_OPTS    = ["Labiríntico ( SUCESSOS)","Traiçoeiro ( SUCESSOS)","Complexo ( SUCESSO)","Moderado","Descomplicado ( SUCESSO)","Acessível ( SUCESSOS)","Facilitado ( SUCESSOS)"];
const TIPOS_RECURSOS = ["Água","Plantas","Animais","Madeira","Minerais","Biomassa"];
const ABUNDANCIA_OPTS = ["Inexistente", "Escasso", "Médio", "Abundante"];

const REGIAO_SHEET_CONFIG = {
  imageKey: 'imagem',
  sideFields: [
    { id: 'regiao-tamanho', label: 'Tamanho', type: 'select', options: TAMANHO_OPTS.map((o,i) => ({ value: i, label: `${i} – ${o}` })), valueKey: 'tamanho' },
    { id: 'regiao-perigo', label: 'Perigo', type: 'select', options: PERIGO_OPTS.map((o,i) => ({ value: i, label: `${i} – ${o}` })), valueKey: 'perigo' },
    { id: 'regiao-habitacao', label: 'Habitação', type: 'select', options: HABITACAO_OPTS.map((o,i) => ({ value: i, label: `${i} – ${o}` })), valueKey: 'habitacao' },
    { id: 'regiao-recursos', label: 'Recursos Naturais', type: 'select', options: RECURSOS_OPTS.map((o,i) => ({ value: i, label: `${i} – ${o}` })), valueKey: 'recursosNaturais' },
    { id: 'regiao-contaminacao', label: 'Contaminação', type: 'select', options: CONTAM_OPTS.map((o,i) => ({ value: i, label: `${i} – ${o}` })), valueKey: 'contaminacao' },
    { id: 'regiao-deslocamento', label: 'Deslocamento', type: 'select', options: DESLOC_OPTS.map((o,i) => ({ value: i, label: `${i} – ${o}` })), valueKey: 'deslocamento' },
    ...TIPOS_RECURSOS.map((t, i) => ({
      id: `regiao-recurso-${t.toLowerCase()}`,
      label: t,
      type: 'select',
      options: ABUNDANCIA_OPTS.map(o => ({ value: o.toLowerCase(), label: o })),
      valueKey: `tiposRecursos.${t}`,
      dataset: { recurso: t },
      group: 'recursos',
      ...(i === 0 ? { groupLabel: 'Tipos de Recursos' } : {})
    }))
  ],
  gridFields: [
    {
      id: 'regiao-descricao',
      label: 'Descrição',
      type: 'textarea',
      valueKey: 'descricao',
      attrs: { placeholder: 'Descreva a Região...', style: 'min-height:90px;' }
    },
    {
      id: 'regiao-notas',
      label: 'Anotações',
      type: 'textarea',
      valueKey: 'notas',
      attrs: { placeholder: 'Notas da sessão...', style: 'min-height:60px;' }
    }
  ]
};

function getScreen() { return document.getElementById("regiao-screen"); }

export function loadRegiaoSheet(regiao) {
  worldState.currentRegiao = regiao;
  worldState.sheetMode = "regiao";
  hideAllScreens();
  getScreen().classList.remove("hidden");
  renderRegiaoSheet();
}

export function renderRegiaoSheet() {
  const r = worldState.currentRegiao;
  if (!r) return;
  const screen = getScreen();

  screen.innerHTML = `
    <div class="world-sheet-screen">
      ${renderHeader("btn-regiao-back", "regiao-nome", r.nome, "Nome da Região", "btn-regiao-delete")}
      <div class="world-sheet-body">
        ${renderProfileCard(r, "regiao", REGIAO_SHEET_CONFIG)}
        <div class="card-glass" style="padding:16px;">
          <div class="world-list-section">
            <div class="world-list-header">
              <h4>Marcos Geográficos</h4>
              <button class="btn btn-sm" id="btn-add-marco">+ Marco</button>
            </div>
            <div class="world-list-items" id="regiao-marcos-list">
              ${_renderMarcos(r.marcosGeograficos)}
            </div>
          </div>
        </div>
        <div class="card-glass" style="padding:16px;">
          <h3 class="ws-section-title">Referências</h3>
          <div class="ref-panel">
            ${renderRefPanelMulti("Refúgios", "regiao-ref-refugios",  r.refugiosAssociados, "refugios")}
            ${renderRefPanelMulti("Conflitos","regiao-ref-conflitos", r.conflitosAssociados,"conflitos")}
            ${renderRefPanelMulti("Locais",   "regiao-ref-locais",    r.locaisAssociados,   "locais")}
          </div>
        </div>
      </div>
    </div>
  `;
  _attachListeners(r);
}

function _renderMarcos(marcos) {
  if (!marcos || marcos.length === 0) return `<div class="world-list-empty">Nenhum marco cadastrado.</div>`;
  return marcos.map((m, i) => `
    <div class="world-list-item" data-marco-idx="${i}">
      <div class="item-fields">
        <input type="text" class="marco-nome" value="${esc(m.nome)}" placeholder="Nome do Marco">
        <textarea class="marco-desc" placeholder="Descrição do marco...">${esc(m.descricao)}</textarea>
      </div>
      <button class="btn-remove-world-item" data-marco-idx="${i}">&times;</button>
    </div>
  `).join("");
}

function _attachListeners(r) {
  const screen = getScreen();

  screen.querySelector("#btn-regiao-back")?.addEventListener("click", goToLanding);
  screen.querySelector("#btn-regiao-delete")?.addEventListener("click", () => {
    if (confirm(`Excluir a Região "${r.nome}"?`)) { deleteRegiao(r.id); goToLanding(); }
  });

  screen.querySelector("#regiao-nome")?.addEventListener("input", e => { r.nome = e.target.value; saveRegiao(r); });
  [...REGIAO_SHEET_CONFIG.sideFields, ...REGIAO_SHEET_CONFIG.gridFields].forEach(f => {
    const el = screen.querySelector(`#${f.id}`);
    if (!el) return;
    if (f.dataset?.recurso) {
      el.addEventListener("change", e => {
        if (!r.tiposRecursos) r.tiposRecursos = {};
        r.tiposRecursos[f.dataset.recurso] = e.target.value;
        saveRegiao(r);
      });
    } else if (f.type === 'textarea') {
      el.addEventListener("input", e => {
        r[f.valueKey] = e.target.value;
        saveRegiao(r);
      });
    } else {
      el.addEventListener("change", e => {
        r[f.valueKey] = parseInt(e.target.value);
        saveRegiao(r);
      });
    }
  });

  screen.querySelector("#btn-add-marco")?.addEventListener("click", () => {
    if (!r.marcosGeograficos) r.marcosGeograficos = [];
    r.marcosGeograficos.push({ nome: "", descricao: "" });
    saveRegiao(r);
    screen.querySelector("#regiao-marcos-list").innerHTML = _renderMarcos(r.marcosGeograficos);
    _attachMarcosListeners(r);
  });
  _attachMarcosListeners(r);

  _attachRefListeners(r, "regiao-ref-refugios",  "refugiosAssociados",  "refugios");
  _attachRefListeners(r, "regiao-ref-conflitos", "conflitosAssociados", "conflitos");
  _attachRefListeners(r, "regiao-ref-locais",    "locaisAssociados",    "locais");

  setupImageUpload("regiao-image-frame", "regiao-image-input", r, saveRegiao, "portrait-overlay");
}

function _attachMarcosListeners(r) {
  const list = getScreen().querySelector("#regiao-marcos-list");
  if (!list) return;
  list.querySelectorAll(".world-list-item").forEach((item, i) => {
    item.querySelector(".marco-nome")?.addEventListener("input", e => { r.marcosGeograficos[i].nome = e.target.value; saveRegiao(r); });
    item.querySelector(".marco-desc")?.addEventListener("input", e => { r.marcosGeograficos[i].descricao = e.target.value; saveRegiao(r); });
    item.querySelector(".btn-remove-world-item")?.addEventListener("click", () => {
      r.marcosGeograficos.splice(i, 1); saveRegiao(r);
      list.innerHTML = _renderMarcos(r.marcosGeograficos);
      _attachMarcosListeners(r);
    });
  });
}

function _attachRefListeners(r, containerId, fieldKey, stateKey) {
  const screen = getScreen();
  const addSel = screen.querySelector(`#${containerId}-add`);
  if (addSel) {
    addSel.addEventListener("change", e => {
      const id = e.target.value;
      if (!id) return;
      if (!r[fieldKey]) r[fieldKey] = [];
      if (!r[fieldKey].includes(id)) { r[fieldKey].push(id); saveRegiao(r); renderRegiaoSheet(); }
    });
  }
  screen.querySelectorAll(`#${containerId}-chips .btn-remove-ref`).forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.refid;
      r[fieldKey] = (r[fieldKey] || []).filter(i => i !== id);
      saveRegiao(r);
      renderRegiaoSheet();
    });
  });
}

export function startNewRegiao() {
  const r = createNewRegiao();
  saveRegiao(r);
  loadRegiaoSheet(r);
}
