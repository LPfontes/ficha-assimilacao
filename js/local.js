import { worldState, saveLocal, deleteLocal, createNewLocal, saveItemToDb } from "./world-state.js";
import { hideAllScreens, goToLanding, esc, setupImageUpload } from "./screen-utils.js";
import { renderHeader, renderProfileCard, renderRefPanelSingle, renderRefPanelMulti, renderCrudListEmpty } from "./screen-components.js";

const TIPO_LOCAL = ["Cidade","Floresta","Ponte","Ruína","Edifício","Estrada","Caverna","Acampamento","Costa","Outro"];
const ESCASSEZ_OPTS = ["E0: Abundante","E1: Corriqueiro","E2: Comum","E3: Incomum","E4: Atípico","E5: Raro","E6: Quase Extinto"];

const LOCAL_SHEET_CONFIG = {
  imageKey: 'imagem',
  sideFields: [
    {
      id: 'local-tipo',
      label: 'Tipo',
      type: 'select',
      options: TIPO_LOCAL.map(t => ({ value: t, label: t })),
      valueKey: 'tipoLocal'
    }
  ],
  gridFields: []
};

function getScreen() { return document.getElementById("local-screen"); }

export function loadLocalSheet(local) {
  worldState.currentLocal = local;
  worldState.sheetMode = "local";
  hideAllScreens();
  getScreen().classList.remove("hidden");
  renderLocalSheet();
}

export function renderLocalSheet() {
  const l = worldState.currentLocal;
  if (!l) return;
  const screen = getScreen();

  // Create or update shared items datalist
  let datalist = document.getElementById("itens-db-list");
  if (!datalist) {
    datalist = document.createElement("datalist");
    datalist.id = "itens-db-list";
    document.body.appendChild(datalist);
  }
  datalist.innerHTML = (worldState.itensDb || []).map(it => `<option value="${esc(it.name)}">`).join("");

  if (!l.pontosInteresse) {
    l.pontosInteresse = [];
  }

  screen.innerHTML = `
    <div class="world-sheet-screen">
      ${renderHeader("btn-local-back", "local-nome", l.nome, "Nome do Local", "btn-local-delete")}
      <div class="world-sheet-body">
        <div style="display:flex;flex-direction:column;gap:16px;">
          ${renderProfileCard(l, "local", LOCAL_SHEET_CONFIG)}
          <div class="card-glass" style="padding:16px;">
            <h3 class="ws-section-title">Referências (Opcionais)</h3>
            <div class="ref-panel">
              ${renderRefPanelSingle("Região",    "local-ref-regiao",   l.regiaoId, "regioes")}
              ${renderRefPanelMulti("Infectados Presentes", "local-ref-infectados", l.infectadosAssociados, "characters")}
              ${renderRefPanelMulti("Conflitos Relacionados","local-ref-conflitos",  l.conflitosAssociados,  "conflitos")}
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="card-glass" style="padding:16px;">
            <div class="profile-fields-grid" style="width: 100%; display: flex; flex-direction: column; gap: 10px;">
               <div class="profile-attr-row" style="align-items: flex-start; gap: 8px;">
                 <label for="local-descricao" style="margin-top: 4px;">Descrição Narrativa</label>
                 <textarea id="local-descricao" class="ws-textarea" placeholder="Descreva o local..." style="min-height:100px;">${esc(l.descricao || '')}</textarea>
               </div>
               <div class="profile-attr-row" style="align-items: flex-start; gap: 8px;">
                 <label for="local-notas" style="margin-top: 4px;">Anotações</label>
                 <textarea id="local-notas" class="ws-textarea" placeholder="Notas da sessão..." style="min-height:60px;">${esc(l.notas || '')}</textarea>
               </div>
            </div>
          </div>
          <div class="card-glass" style="padding:16px;">
            <div class="world-list-section">
              <div class="world-list-header">
                <h4>Itens Encontráveis</h4>
                <button class="btn btn-sm" id="btn-add-item-local">+ Item</button>
              </div>
              <div class="world-list-items" id="local-itens-list">
                ${_renderItens(l.itens)}
              </div>
            </div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px;">
          <div class="card-glass" style="padding:16px;">
            <div class="world-list-section">
              <div class="world-list-header">
                <h4>Pontos de Interesse</h4>
                <button class="btn btn-sm" id="btn-add-poi-local">+ Ponto</button>
              </div>
              <div class="world-list-items" id="local-poi-list">
                ${_renderPOIs(l.pontosInteresse)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  _attachListeners(l);
}

function _renderItens(itens) {
  if (!itens || itens.length === 0) return renderCrudListEmpty("Nenhum item cadastrado.");
  return itens.map((it, i) => `
    <div class="world-list-item" data-item-idx="${i}">
      <div class="item-fields">
        <div class="item-inline-row">
          <input type="text" class="item-nome" value="${esc(it.nome)}" placeholder="Nome do Item" style="flex:2;" list="itens-db-list">
          <select class="item-escassez local-item-escassez">
            ${ESCASSEZ_OPTS.map((e,ei) => `<option value="${ei}" ${ei === it.escassez ? "selected" : ""}>${e}</option>`).join("")}
          </select>
        </div>
        <input type="text" class="item-desc" value="${esc(it.descricao)}" placeholder="Descrição / Efeito">
      </div>
      <button class="btn-remove-world-item" data-item-idx="${i}">&times;</button>
    </div>
  `).join("");
}

function _renderPOIs(pois) {
  if (!pois || pois.length === 0) return renderCrudListEmpty("Nenhum ponto de interesse cadastrado.");
  return pois.map((poi, i) => `
    <div class="world-list-item" data-poi-idx="${i}">
      <div class="item-fields" style="width: 100%;">
        <input type="text" class="poi-nome" value="${esc(poi.nome)}" placeholder="Nome do Ponto de Interesse" style="font-weight: bold; width: 100%; margin-bottom: 4px;">
        <textarea class="poi-desc" placeholder="Descrição / Notas sobre este ponto..." rows="2" style="width: 100%; resize: vertical;">${esc(poi.descricao || '')}</textarea>
      </div>
      <button class="btn-remove-world-item" data-poi-idx="${i}">&times;</button>
    </div>
  `).join("");
}

function _attachListeners(l) {
  const screen = getScreen();

  screen.querySelector("#btn-local-back")?.addEventListener("click", goToLanding);
  screen.querySelector("#btn-local-delete")?.addEventListener("click", () => {
    if (confirm(`Excluir o Local "${l.nome}"?`)) { deleteLocal(l.id); goToLanding(); }
  });

  screen.querySelector("#local-nome")?.addEventListener("input", e => { l.nome = e.target.value; saveLocal(l); });
  screen.querySelector("#local-tipo")?.addEventListener("change", e => { l.tipoLocal = e.target.value; saveLocal(l); });
  screen.querySelector("#local-descricao")?.addEventListener("input", e => { l.descricao = e.target.value; saveLocal(l); });
  screen.querySelector("#local-notas")?.addEventListener("input", e => { l.notas = e.target.value; saveLocal(l); });

  setupImageUpload("local-image-frame", "local-image-input", l, saveLocal, "portrait-overlay");

  screen.querySelector("#btn-add-item-local")?.addEventListener("click", () => {
    if (!l.itens) l.itens = [];
    l.itens.push({ nome: "", escassez: 2, descricao: "" });
    saveLocal(l);
    screen.querySelector("#local-itens-list").innerHTML = _renderItens(l.itens);
    _attachItensListeners(l);
  });
  _attachItensListeners(l);

  screen.querySelector("#btn-add-poi-local")?.addEventListener("click", () => {
    if (!l.pontosInteresse) l.pontosInteresse = [];
    l.pontosInteresse.push({ nome: "", descricao: "" });
    saveLocal(l);
    screen.querySelector("#local-poi-list").innerHTML = _renderPOIs(l.pontosInteresse);
    _attachPoiListeners(l);
  });
  _attachPoiListeners(l);

  screen.querySelector("#local-ref-regiao")?.addEventListener("change", e => {
    l.regiaoId = e.target.value || null; saveLocal(l);
  });

  _attachMultiRefListeners(l, "local-ref-infectados", "infectadosAssociados", "characters");
  _attachMultiRefListeners(l, "local-ref-conflitos",  "conflitosAssociados",  "conflitos");
}

function _attachItensListeners(l) {
  const list = getScreen().querySelector("#local-itens-list");
  if (!list) return;
  list.querySelectorAll(".world-list-item").forEach((item, i) => {
    const nameInput = item.querySelector(".item-nome");
    const escSelect = item.querySelector(".item-escassez");
    const descInput = item.querySelector(".item-desc");

    const saveLocalItem = () => {
      l.itens[i].nome = nameInput.value;
      l.itens[i].escassez = parseInt(escSelect.value);
      l.itens[i].descricao = descInput.value;
      saveLocal(l);

      if (nameInput.value.trim() !== "") {
        saveItemToDb({
          name: l.itens[i].nome,
          escassez: l.itens[i].escassez,
          efeito: l.itens[i].descricao
        });
      }
    };

    nameInput?.addEventListener("input", saveLocalItem);
    nameInput?.addEventListener("change", () => {
      const typed = nameInput.value.trim().toLowerCase();
      const dbItem = (worldState.itensDb || []).find(it => it.name.toLowerCase() === typed);
      if (dbItem) {
        escSelect.value = dbItem.escassez;
        descInput.value = dbItem.efeito;
        saveLocalItem();
        list.innerHTML = _renderItens(l.itens);
        _attachItensListeners(l);
      } else {
        saveLocalItem();
      }
    });

    escSelect?.addEventListener("change", saveLocalItem);
    descInput?.addEventListener("input", saveLocalItem);

    item.querySelector(".btn-remove-world-item")?.addEventListener("click", () => {
      l.itens.splice(i, 1); saveLocal(l);
      list.innerHTML = _renderItens(l.itens);
      _attachItensListeners(l);
    });
  });
}

function _attachPoiListeners(l) {
  const list = getScreen().querySelector("#local-poi-list");
  if (!list) return;
  list.querySelectorAll(".world-list-item").forEach((item, i) => {
    item.querySelector(".poi-nome")?.addEventListener("input", e => { l.pontosInteresse[i].nome = e.target.value; saveLocal(l); });
    item.querySelector(".poi-desc")?.addEventListener("input", e => { l.pontosInteresse[i].descricao = e.target.value; saveLocal(l); });
    item.querySelector(".btn-remove-world-item")?.addEventListener("click", () => {
      l.pontosInteresse.splice(i, 1); saveLocal(l);
      list.innerHTML = _renderPOIs(l.pontosInteresse);
      _attachPoiListeners(l);
    });
  });
}

function _attachMultiRefListeners(l, containerId, fieldKey, stateKey) {
  const screen = getScreen();
  const addSel = screen.querySelector(`#${containerId}-add`);
  if (addSel) {
    addSel.addEventListener("change", e => {
      const id = e.target.value;
      if (!id) return;
      if (!l[fieldKey]) l[fieldKey] = [];
      if (!l[fieldKey].includes(id)) { l[fieldKey].push(id); saveLocal(l); renderLocalSheet(); }
    });
  }
  screen.querySelectorAll(`#${containerId}-chips .btn-remove-ref`).forEach(btn => {
    btn.addEventListener("click", () => {
      l[fieldKey] = (l[fieldKey] || []).filter(i => i !== btn.dataset.refid);
      saveLocal(l); renderLocalSheet();
    });
  });
}

export function startNewLocal() {
  const l = createNewLocal();
  saveLocal(l);
  loadLocalSheet(l);
}
