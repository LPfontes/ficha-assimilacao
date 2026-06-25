import { worldState, saveRefugio, deleteRefugio, createNewRefugio } from "./world-state.js";
import { hideAllScreens, goToLanding, esc, setupImageUpload } from "./screen-utils.js";
import { renderHeader, renderImageFrame, renderAttrDots, renderCrudListEmpty } from "./screen-components.js";

const REFUGIO_ATTRS = [
  { key: "populacao",    label: "População",    desc: "~10 hab/ponto" },
  { key: "reservas",     label: "Reservas",     desc: "Recursos estocados" },
  { key: "mobilidade",   label: "Mobilidade",   desc: "Transporte/montarias" },
  { key: "defesa",       label: "Defesa",       desc: "Fortificações" },
  { key: "moral",        label: "Moral",        desc: "Resistência a crises" },
  { key: "beligerancia", label: "Beligerância", desc: "Poder armado" },
];

const CRISE_STATUS = ["Ativo", "Contido", "Resolvido"];

function getScreen() { return document.getElementById("refugio-screen"); }

export function loadRefugioSheet(refugio) {
  worldState.currentRefugio = refugio;
  worldState.sheetMode = "refugio";
  hideAllScreens();
  getScreen().classList.remove("hidden");
  renderRefugioSheet();
}

export function renderRefugioSheet() {
  const r = worldState.currentRefugio;
  if (!r) return;
  const screen = getScreen();

  screen.innerHTML = `
    <div class="world-sheet-screen">
      ${renderHeader("btn-refugio-back", "refugio-nome", r.nome, "Nome do Refúgio", "btn-refugio-delete")}
      ${renderImageFrame(r, "refugio")}
      <div class="world-sheet-body">
        <div class="card-glass" style="padding:16px;">
          <h3 class="ws-section-title">Atributos</h3>
          <div class="attr-danger-alert" id="refugio-danger-alert">
            ⚠️ <strong>Alerta:</strong> O Perigo da região excede a Defesa deste Refúgio — Crises podem ser ativadas!
          </div>
          <div class="attr-slider-group" id="refugio-attrs">
            ${REFUGIO_ATTRS.map(a => renderAttrDots(a.key, a.label, r[a.key] || 0, 10)).join("")}
          </div>
        </div>
        <div class="card-glass" style="padding:16px;display:flex;flex-direction:column;gap:12px;">
          <div>
            <label class="ws-label" style="display:block;margin-bottom:4px;">Descrição</label>
            <textarea id="refugio-descricao" class="ws-textarea" style="min-height:80px;" placeholder="Descreva o refúgio...">${esc(r.descricao)}</textarea>
          </div>
          <div>
            <label class="ws-label" style="display:block;margin-bottom:4px;">Anotações</label>
            <textarea id="refugio-notas" class="ws-textarea" style="min-height:80px;" placeholder="Notas da sessão...">${esc(r.notas)}</textarea>
          </div>
        </div>
        <div class="card-glass world-sheet-full-col" style="padding:16px;">
          <div class="world-list-section">
            <div class="world-list-header">
              <h4>Crises Ativas</h4>
              <button class="btn btn-sm" id="btn-add-crise">+ Crise</button>
            </div>
            <div class="world-list-items" id="refugio-crises-list">
              ${_renderCrises(r.crises)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  _attachListeners(r);
}

function _renderCrises(crises) {
  if (!crises || crises.length === 0) return renderCrudListEmpty("Nenhuma crise ativa.");
  return crises.map((c, i) => `
    <div class="world-list-item" data-crise-idx="${i}">
      <div class="item-fields">
        <div class="item-inline-row">
          <input type="text" class="crise-nome" value="${esc(c.nome)}" placeholder="Nome da Crise" style="flex:2;">
          <input type="number" class="crise-grau grau-input" value="${c.grau}" min="0" max="10" title="Grau (0-10)">
          <select class="crise-status">
            ${CRISE_STATUS.map(s => `<option ${s === c.status ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>
        <textarea class="crise-desc" placeholder="Descrição da crise...">${esc(c.descricao)}</textarea>
      </div>
      <button class="btn-remove-world-item" data-crise-idx="${i}" title="Remover Crise">&times;</button>
    </div>
  `).join("");
}

function _attachListeners(r) {
  const screen = getScreen();

  screen.querySelector("#btn-refugio-back")?.addEventListener("click", goToLanding);
  screen.querySelector("#btn-refugio-delete")?.addEventListener("click", () => {
    if (confirm(`Excluir o Refúgio "${r.nome}"? Esta ação não pode ser desfeita.`)) {
      deleteRefugio(r.id);
      goToLanding();
    }
  });

  screen.querySelector("#refugio-nome")?.addEventListener("input", e => { r.nome = e.target.value; saveRefugio(r); });
  screen.querySelector("#refugio-descricao")?.addEventListener("input", e => { r.descricao = e.target.value; saveRefugio(r); });
  screen.querySelector("#refugio-notas")?.addEventListener("input", e => { r.notas = e.target.value; saveRefugio(r); });

  screen.querySelectorAll(".attr-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      const key = dot.dataset.key;
      const idx = parseInt(dot.dataset.idx);
      const current = r[key] || 0;
      r[key] = current === idx + 1 ? idx : idx + 1;
      saveRefugio(r);
      const row = dot.closest(".attr-row");
      row.querySelectorAll(".attr-dot").forEach((d, i) => d.classList.toggle("filled", i < r[key]));
      row.querySelector(`#attr-val-${key}`).textContent = r[key];
    });
  });

  screen.querySelector("#btn-add-crise")?.addEventListener("click", () => {
    if (!r.crises) r.crises = [];
    r.crises.push({ nome: "", grau: 1, status: "Ativo", descricao: "" });
    saveRefugio(r);
    screen.querySelector("#refugio-crises-list").innerHTML = _renderCrises(r.crises);
    _attachCriseListeners(r);
  });
  _attachCriseListeners(r);

  setupImageUpload("refugio-image-frame", "refugio-image-input", r, saveRefugio);
}

function _attachCriseListeners(r) {
  const list = getScreen().querySelector("#refugio-crises-list");
  if (!list) return;
  list.querySelectorAll(".world-list-item").forEach((item, i) => {
    item.querySelector(".crise-nome")?.addEventListener("input", e => { r.crises[i].nome = e.target.value; saveRefugio(r); });
    item.querySelector(".crise-grau")?.addEventListener("input", e => { r.crises[i].grau = parseInt(e.target.value) || 0; saveRefugio(r); });
    item.querySelector(".crise-status")?.addEventListener("change", e => { r.crises[i].status = e.target.value; saveRefugio(r); });
    item.querySelector(".crise-desc")?.addEventListener("input", e => { r.crises[i].descricao = e.target.value; saveRefugio(r); });
    item.querySelector(".btn-remove-world-item")?.addEventListener("click", () => {
      r.crises.splice(i, 1); saveRefugio(r);
      list.innerHTML = _renderCrises(r.crises);
      _attachCriseListeners(r);
    });
  });
}

export function startNewRefugio() {
  const r = createNewRefugio();
  saveRefugio(r);
  loadRefugioSheet(r);
}
