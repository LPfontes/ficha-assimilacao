import { worldState, saveRegiao, deleteRegiao, createNewRegiao } from "./world-state.js";
import { hideAllScreens, goToLanding, esc, setupImageUpload } from "./screen-utils.js";
import { renderHeader, renderImageFrame, renderSelectRow, renderRefPanelMulti } from "./screen-components.js";

const TAMANHO_OPTS   = ["Quarteirão","Largo","Bairro","Cidade Pequena","Zona Urbana","Cidade Média","Cidade Grande"];
const PERIGO_OPTS    = ["Seguro","Baixo","Moderado","Alto","Severo","Extremo","Mortal"];
const HABITACAO_OPTS = ["Inabitada","Esvaziada","Isolada","Esparsa","Dispersa","Concentrada","Inchada"];
const RECURSOS_OPTS  = ["Sem abundância","1 recurso farto","2 recursos fartos","3 recursos fartos","4 recursos fartos","5 recursos fartos","6 recursos fartos"];
const CONTAM_OPTS    = ["Inexistente","Introdutória","Disseminada","Propagada","Epidêmica","Pandêmica","Endêmica"];
const DESLOC_OPTS    = ["Labiríntico (−AAA)","Traiçoeiro (−AA)","Complexo (−A)","Moderado","Descomplicado (+A)","Acessível (+AA)","Facilitado (+AAA)"];
const TIPOS_RECURSOS = ["Água","Plantas","Animais","Madeira","Minerais","Biomassa"];

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
      ${renderImageFrame(r, "regiao")}
      <div class="world-sheet-body">
        <div class="card-glass" style="padding:16px;">
          <h3 class="ws-section-title">Atributos</h3>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${renderSelectRow("Tamanho",          "regiao-tamanho",      r.tamanho,         TAMANHO_OPTS)}
            ${renderSelectRow("Perigo",           "regiao-perigo",       r.perigo,           PERIGO_OPTS)}
            ${renderSelectRow("Habitação",        "regiao-habitacao",    r.habitacao,        HABITACAO_OPTS)}
            ${renderSelectRow("Recursos Naturais","regiao-recursos",     r.recursosNaturais, RECURSOS_OPTS)}
            ${renderSelectRow("Contaminação",     "regiao-contaminacao", r.contaminacao,     CONTAM_OPTS)}
            ${renderSelectRow("Deslocamento",     "regiao-deslocamento", r.deslocamento,     DESLOC_OPTS)}
          </div>
          <div style="margin-top:14px;">
            <p class="ws-label">Tipos de Recursos em Abundância</p>
            <div class="resources-checkboxes" id="regiao-tipos-recursos">
              ${TIPOS_RECURSOS.map(t => `
                <label class="resource-chip ${r.tiposRecursos?.includes(t) ? "checked" : ""}">
                  <input type="checkbox" value="${t}" ${r.tiposRecursos?.includes(t) ? "checked" : ""}> ${t}
                </label>
              `).join("")}
            </div>
          </div>
        </div>
        <div class="card-glass" style="padding:16px;display:flex;flex-direction:column;gap:12px;">
          <div>
            <label class="ws-label" style="display:block;margin-bottom:4px;">Descrição</label>
            <textarea id="regiao-descricao" class="ws-textarea" style="min-height:90px;" placeholder="Descreva a Região...">${esc(r.descricao)}</textarea>
          </div>
          <div>
            <label class="ws-label" style="display:block;margin-bottom:4px;">Anotações</label>
            <textarea id="regiao-notas" class="ws-textarea" style="min-height:60px;" placeholder="Notas da sessão...">${esc(r.notas)}</textarea>
          </div>
        </div>
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
  screen.querySelector("#regiao-descricao")?.addEventListener("input", e => { r.descricao = e.target.value; saveRegiao(r); });
  screen.querySelector("#regiao-notas")?.addEventListener("input", e => { r.notas = e.target.value; saveRegiao(r); });

  [["regiao-tamanho","tamanho"],["regiao-perigo","perigo"],["regiao-habitacao","habitacao"],
   ["regiao-recursos","recursosNaturais"],["regiao-contaminacao","contaminacao"],["regiao-deslocamento","deslocamento"]
  ].forEach(([id, key]) => {
    screen.querySelector(`#${id}`)?.addEventListener("change", e => {
      r[key] = parseInt(e.target.value);
      saveRegiao(r);
    });
  });

  screen.querySelectorAll("#regiao-tipos-recursos .resource-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const cb = chip.querySelector("input[type=checkbox]");
      cb.checked = !cb.checked;
      chip.classList.toggle("checked", cb.checked);
      const val = cb.value;
      if (!r.tiposRecursos) r.tiposRecursos = [];
      if (cb.checked) { if (!r.tiposRecursos.includes(val)) r.tiposRecursos.push(val); }
      else { r.tiposRecursos = r.tiposRecursos.filter(v => v !== val); }
      saveRegiao(r);
    });
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

  setupImageUpload("regiao-image-frame", "regiao-image-input", r, saveRegiao);
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
