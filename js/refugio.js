import { worldState, saveRefugio, deleteRefugio, createNewRefugio } from "./world-state.js";
import { hideAllScreens, goToLanding, esc, setupImageUpload } from "./screen-utils.js";
import { renderImageFrame, renderCrudListEmpty, renderRefPanelSingle } from "./screen-components.js";
import { openSelectReferencesModal } from "./modals.js";
import { el } from "./state.js";
import { getDieFaceImgSrc } from "./chat.js";
import { DEFESA_LABELS, MORAL_LABELS, BELIGERANCIA_LABELS, CONSTRUCOES_MODELO, CRISE_GATILHOS, CRISE_GRAVIDADES } from "./dados.js";

const CRISE_STATUS = ["Ativo", "Contido", "Resolvido"];



function getLevelLabel(val, arr) {
  return arr[Math.max(0, Math.min(val, arr.length - 1))] || "";
}

function getScreen() { return document.getElementById("refugio-screen"); }

export function loadRefugioSheet(refugio) {
  worldState.currentRefugio = refugio;
  worldState.sheetMode = "refugio";
  hideAllScreens();
  getScreen().classList.remove("hidden");
  renderRefugioSheet();
}



function openCreateBuildingModal(r) {
  el.modalContainer.classList.remove("hidden");
  el.modalBody.innerHTML = `
    <h3 class="modal-title" style="margin-bottom: 16px;">Nova Construção</h3>
    
    <div class="form-group" style="margin-bottom: 12px;">
      <label class="ws-label" style="display:block; margin-bottom: 4px;">Modelo de Construção</label>
      <select id="modal-building-preset" class="ws-select" style="width: 100%; background: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 6px; border-radius: 4px;">
        <option value="custom">[Personalizada...]</option>
        ` + CONSTRUCOES_MODELO.map((c, i) => `<option value="${i}">${c.nome} (Custo: ${c.nivel} Obra)</option>`).join("") + `
      </select>
    </div>

    <div class="form-group" style="margin-bottom: 12px;">
      <label class="ws-label" style="display:block; margin-bottom: 4px;">Nome da Construção</label>
      <input type="text" id="modal-building-name" class="ws-input" style="width: 100%; background: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 8px; border-radius: 4px;" placeholder="Ex: Refeitório Comunitário">
    </div>

    <div class="form-group" style="margin-bottom: 12px; display: flex; gap: 10px;">
      <div style="flex:1;">
        <label class="ws-label" style="display:block; margin-bottom: 4px;">Consome</label>
        <input type="text" id="modal-building-consumo" class="ws-input" style="width: 100%; background: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 8px; border-radius: 4px;" placeholder="Ex: Plantas 1">
      </div>
      <div style="flex:1;">
        <label class="ws-label" style="display:block; margin-bottom: 4px;">Produz</label>
        <input type="text" id="modal-building-producao" class="ws-input" style="width: 100%; background: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 8px; border-radius: 4px;" placeholder="Ex: Medicamentos 1">
      </div>
    </div>

    <div class="form-group" style="margin-bottom: 12px;">
      <label class="ws-label" style="display:block; margin-bottom: 4px;">Pontos de Obra (Nível/Custo)</label>
      <input type="number" id="modal-building-level" class="ws-input" style="width: 100%; background: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 8px; border-radius: 4px;" value="10" min="1">
    </div>

    <div class="form-group" style="margin-bottom: 16px;">
      <label class="ws-label" style="display:block; margin-bottom: 4px;">Descrição / Efeitos</label>
      <textarea id="modal-building-desc" class="ws-textarea" style="width: 100%; height: 80px; background: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 8px; border-radius: 4px; resize: vertical;" placeholder="Descrição dos benefícios e requisitos da obra..."></textarea>
    </div>

    <div class="modal-actions" style="display: flex; gap: 10px; justify-content: flex-end;">
      <button id="btn-modal-building-cancel" class="btn btn-sm btn-secondary" style="padding: 6px 12px;">Cancelar</button>
      <button id="btn-modal-building-save" class="btn btn-sm btn-success" style="padding: 6px 12px;">Adicionar</button>
    </div>
  `;

  const presetSel = document.getElementById("modal-building-preset");
  const nameInput = document.getElementById("modal-building-name");
  const levelInput = document.getElementById("modal-building-level");
  const consumoInput = document.getElementById("modal-building-consumo");
  const producaoInput = document.getElementById("modal-building-producao");
  const descText = document.getElementById("modal-building-desc");

  presetSel.addEventListener("change", e => {
    const val = e.target.value;
    if (val === "custom") {
      nameInput.value = "";
      levelInput.value = 10;
      consumoInput.value = "";
      producaoInput.value = "";
      descText.value = "";
    } else {
      const idx = parseInt(val);
      const model = CONSTRUCOES_MODELO[idx];
      nameInput.value = model.nome;
      levelInput.value = model.nivel;
      consumoInput.value = model.consumo || "";
      producaoInput.value = model.producao || "";
      descText.value = model.descricao;
    }
  });

  const closeModal = () => {
    el.modalContainer.classList.add("hidden");
  };

  document.getElementById("btn-modal-building-cancel").addEventListener("click", closeModal);

  document.getElementById("btn-modal-building-save").addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) {
      alert("Por favor, insira o nome da construção!");
      return;
    }
    const level = parseInt(levelInput.value) || 10;
    const consumo = consumoInput.value.trim();
    const producao = producaoInput.value.trim();
    const desc = descText.value.trim();

    r.construcoes.push({ nome: name, nivel: level, consumo: consumo, producao: producao, descricao: desc });
    saveRefugio(r);
    
    closeModal();
    _renderBuildings(getScreen(), r);
  });
}



function openCreateCriseModal(r) {
  el.modalContainer.classList.remove("hidden");
  el.modalBody.innerHTML = `
    <h3 class="modal-title" style="margin-bottom: 16px;">Registrar Nova Crise</h3>
    
    <div class="form-group" style="margin-bottom: 12px;">
      <label class="ws-label" style="display:block; margin-bottom: 4px;">Gatilho da Crise</label>
      <select id="modal-crise-gatilho" class="ws-select" style="width: 100%; background: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 6px; border-radius: 4px;">
        <option value="populacao">População excedeu o teto máximo</option>
        <option value="defesa">Defesa menor que o Perigo/Beligerância invasora</option>
        <option value="recurso">Falta de Recurso (Consumo semanal/anual/bienal)</option>
        <option value="custom" selected>[Outro gatilho / Personalizado...]</option>
      </select>
    </div>

    <div class="form-group" style="margin-bottom: 12px;">
      <label class="ws-label" style="display:block; margin-bottom: 4px;">Nome da Crise</label>
      <input type="text" id="modal-crise-name" class="ws-input" style="width: 100%; background: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 8px; border-radius: 4px;" placeholder="Ex: Crise de Fome">
    </div>

    <!-- Simulador de Dados -->
    <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 6px; margin-bottom: 12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
        <span class="ws-label" style="font-size: 11px;">Rolar Gravidade (4 dados - elimina 1)</span>
        <button id="btn-modal-crise-roll" class="btn btn-sm btn-secondary" style="padding: 2px 8px; font-size: 10px;">Rolar 4d6</button>
      </div>
      <div id="modal-crise-dice-container" style="display:flex; gap:8px; justify-content:center; min-height: 40px; align-items:center;">
        <span style="font-size:10px; color:var(--text-muted); font-style:italic;">Clique em "Rolar 4d6" para sortear.</span>
      </div>
      <div id="modal-crise-dice-instruction" style="font-size: 10px; color:#56ffff; text-align:center; margin-top: 4px; display:none; user-select:none;">
        Escolha 1 dado para eliminar clicando sobre ele
      </div>
    </div>

    <div class="form-group" style="margin-bottom: 12px;">
      <label class="ws-label" style="display:block; margin-bottom: 4px;">Gravidade da Crise (Símbolos Rolados)</label>
      <select id="modal-crise-grau" class="ws-select" style="width: 100%; background: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 6px; border-radius: 4px;">
        <option value="1">0-1 Símbolos: Sobrevivência</option>
        <option value="2">2 Símbolos: Briga Interna (Migração 50%)</option>
        <option value="3">3 Símbolos: Enfermidade (-1d em testes)</option>
        <option value="4">4 Símbolos: Criatura Assimilada</option>
        <option value="5">5 Símbolos: Rebelião (Facções)</option>
        <option value="6">6+ Símbolos: Ataque Invasor</option>
      </select>
    </div>

    <div class="form-group" style="margin-bottom: 12px;">
      <label class="ws-label" style="display:block; margin-bottom: 4px;">Efeitos / Descrição da Crise</label>
      <textarea id="modal-crise-desc" class="ws-textarea" style="width: 100%; height: 80px; background: #222; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 8px; border-radius: 4px; resize: vertical;" placeholder="Efeitos específicos da crise..."></textarea>
    </div>

    <div style="margin-bottom: 16px; display:flex; align-items:center; gap:8px;">
      <input type="checkbox" id="modal-crise-reduce-moral" checked style="width:16px; height:16px; accent-color:#ef4444; cursor:pointer;">
      <label for="modal-crise-reduce-moral" class="ws-label" style="cursor:pointer; font-size:11px; user-select:none; color:#ffb0b0;">
        Reduzir 1 de Moral do Refúgio (de ${r.moral || 0} para ${Math.max(0, (r.moral || 0) - 1)})
      </label>
    </div>

    <div class="modal-actions" style="display: flex; gap: 10px; justify-content: flex-end;">
      <button id="btn-modal-crise-cancel" class="btn btn-sm btn-secondary" style="padding: 6px 12px;">Cancelar</button>
      <button id="btn-modal-crise-save" class="btn btn-sm btn-danger" style="padding: 6px 12px;">Ativar Crise</button>
    </div>
  `;

  const gatilhoSel = document.getElementById("modal-crise-gatilho");
  const nameInput = document.getElementById("modal-crise-name");
  const grauSel = document.getElementById("modal-crise-grau");
  const descText = document.getElementById("modal-crise-desc");
  const moralCheck = document.getElementById("modal-crise-reduce-moral");
  const rollBtn = document.getElementById("btn-modal-crise-roll");
  const diceContainer = document.getElementById("modal-crise-dice-container");
  const diceInstruction = document.getElementById("modal-crise-dice-instruction");

  gatilhoSel.addEventListener("change", e => {
    const val = e.target.value;
    const trigger = CRISE_GATILHOS[val];
    if (trigger) {
      nameInput.value = trigger.nome;
      if (val !== "custom") {
        descText.value = `Gatilho: ${trigger.desc}\n\nConsequências:\n` + descText.value.replace(/^Gatilho: .*\n\nConsequências:\n/g, "");
      }
    }
  });

  const updateDescFromGrau = () => {
    const grau = parseInt(grauSel.value);
    const textData = CRISE_GRAVIDADES[grau];
    if (textData) {
      const baseDesc = descText.value;
      const gatilhoHeaderMatch = baseDesc.match(/^Gatilho: .*\n\n/);
      const gatilhoHeader = gatilhoHeaderMatch ? gatilhoHeaderMatch[0] : "";
      descText.value = `${gatilhoHeader}Efeito (${grau} Símbolos): ${textData.texto}`;
    }
  };
  grauSel.addEventListener("change", updateDescFromGrau);

  updateDescFromGrau();

  let rolledDice = [];
  rollBtn.addEventListener("click", () => {
    rolledDice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    
    diceContainer.innerHTML = rolledDice.map((d, i) => `
      <div class="modal-die-face" data-idx="${i}" style="width:40px; height:40px; background:#1a1a1a; border:2px solid rgba(255,255,255,0.2); display:flex; justify-content:center; align-items:center; border-radius:6px; cursor:pointer; user-select:none; transition:all 0.2s; overflow:hidden;">
        <img src="${getDieFaceImgSrc(6, d)}" style="width:100%; height:100%; object-fit:cover;" alt="d6 face ${d}">
      </div>
    `).join("");
    
    diceInstruction.style.display = "block";
    
    diceContainer.querySelectorAll(".modal-die-face").forEach(dieEl => {
      dieEl.addEventListener("click", e => {
        const idxToEliminate = parseInt(e.currentTarget.dataset.idx);
        
        diceContainer.querySelectorAll(".modal-die-face").forEach((el, i) => {
          if (i === idxToEliminate) {
            el.style.opacity = "0.2";
            el.style.textDecoration = "line-through";
            el.style.borderColor = "rgba(255,0,0,0.4)";
          }
          el.style.pointerEvents = "none";
        });
        
        diceInstruction.style.display = "none";
        
        const remainingDice = rolledDice.filter((_, i) => i !== idxToEliminate);
        const successes = remainingDice.filter(v => v >= 5).length;
        
        let targetGrau = 1; // 0-1 símbolos
        if (successes === 2) targetGrau = 2;
        if (successes === 3) targetGrau = 3;
        
        grauSel.value = targetGrau;
        updateDescFromGrau();
      });
    });
  });

  const closeModal = () => {
    el.modalContainer.classList.add("hidden");
  };

  document.getElementById("btn-modal-crise-cancel").addEventListener("click", closeModal);

  document.getElementById("btn-modal-crise-save").addEventListener("click", () => {
    const name = nameInput.value.trim() || "Crise Ativa";
    const grau = parseInt(grauSel.value) || 1;
    const desc = descText.value.trim();

    if (!r.crises) r.crises = [];
    r.crises.push({ nome: name, grau: grau, status: "Ativo", descricao: desc });

    if (moralCheck.checked) {
      r.moral = Math.max(0, (r.moral || 0) - 1);
    }

    saveRefugio(r);
    closeModal();
    renderRefugioSheet();
  });
}

function calculateCurrentReserves(r) {
  let total = 0;
  if (r.recursos) {
    Object.values(r.recursos).forEach(val => {
      const str = String(val || "");
      const matches = str.match(/\d+/g);
      if (matches) {
        matches.forEach(numStr => {
          total += parseInt(numStr) || 0;
        });
      } else {
        const parsed = parseInt(str);
        if (!isNaN(parsed)) {
          total += parsed;
        }
      }
    });
  }
  return total;
}

export function renderRefugioSheet() {
  const r = worldState.currentRefugio;
  if (!r) return;
  const screen = getScreen();

  // Garante a presença dos campos novos no objeto para retrocompatibilidade
  if (!r.recursos) {
    r.recursos = {
      agua: 0, plantas: 0, animais: 0, madeira: 0, minerais: 0, biomassa: 0,
      alimento: 0, vestuario: 0, municao: 0, combustivel: 0, remedios: 0, mat_constr: 0
    };
  }
  if (!r.construcoes) {
    r.construcoes = [];
  }
  if (r.populacaoMax === undefined) r.populacaoMax = 10;
  if (r.reservasMax === undefined) r.reservasMax = 10;
  r.reservas = calculateCurrentReserves(r);

  screen.innerHTML = `
    <div class="world-sheet-screen">
      <div class="world-sheet-header" style="justify-content: space-between; border-bottom: none; padding-bottom: 0; margin-bottom: 12px;">
        <button id="btn-refugio-back" class="sheet-back-btn">
          Voltar
        </button>
        <button id="btn-refugio-delete" class="btn btn-sm btn-danger" style="padding:6px 12px;">Excluir Refúgio</button>
      </div>

      <div class="refugio-screen-grid">
        <!-- Coluna da Esquerda (Foto & Identificação) -->
        <div class="ref-area-left">
          <!-- Título/Nome -->
          <div class="refugio-title-input-card">
            <input type="text" id="refugio-nome" value="${esc(r.nome)}" placeholder="Título do Refúgio">
          </div>
          <div class="refugio-tag-card">REFÚGIO</div>
          ${renderImageFrame(r, "refugio")}
          ${renderRefPanelSingle("Região", "refugio-ref-regiao", r.regiaoId, "regioes")}
          ${renderRefPanelSingle("Local", "refugio-ref-local", r.localId, "locais")}
          </div>

        <!-- Coluna do Meio (Título, Atributos, Recursos) -->
        <div class="ref-area-middle">
          <!-- Atributos -->
          <div class="refugio-attrs-grid">
            <div class="refugio-attr-card" title="Cada nível de População representa aproximadamente 10 habitantes. A cada seis níveis de População, um é composto por pessoas que não podem trabalhar (não-trabalhadores).">
              <span class="refugio-attr-label">População</span>
              <div class="refugio-attr-split-container">
                <div class="refugio-qty-controls">
                  <button type="button" class="btn-ref-qty-dec" data-target="populacao">-</button>
                  <span id="refugio-populacao" class="refugio-qty-span">${r.populacao || 0}</span>
                  <button type="button" class="btn-ref-qty-inc" data-target="populacao">+</button>
                </div>
                <span class="refugio-attr-split-divider">/</span>
                <div class="refugio-qty-controls">
                  <button type="button" class="btn-ref-qty-dec" data-target="populacaoMax">-</button>
                  <span id="refugio-populacao-max" class="refugio-qty-span">${r.populacaoMax || 10}</span>
                  <button type="button" class="btn-ref-qty-inc" data-target="populacaoMax">+</button>
                </div>
              </div>
            </div>
            <div class="refugio-attr-card" title="Primeiro valor é o número total atual de recursos estocados (soma dos recursos abaixo) e o segundo é o máximo que o refúgio comporta. Todo excedente se perde.">
              <span class="refugio-attr-label">Reservas</span>
              <div class="refugio-attr-split-container">
                <span id="refugio-reservas" class="refugio-qty-span readonly" style="padding: 0 8px;">${r.reservas || 0}</span>
                <span class="refugio-attr-split-divider">/</span>
                <div class="refugio-qty-controls">
                  <button type="button" class="btn-ref-qty-dec" data-target="reservasMax">-</button>
                  <span id="refugio-reservas-max" class="refugio-qty-span">${r.reservasMax || 10}</span>
                  <button type="button" class="btn-ref-qty-inc" data-target="reservasMax">+</button>
                </div>
              </div>
            </div>
            <div class="refugio-attr-card" title="Cada nível representa aproximadamente 10 indivíduos que podem ser transportados (pode carregar 1 nível de População).">
              <span class="refugio-attr-label">Mobilidade</span>
              <div class="refugio-qty-controls">
                <button type="button" class="btn-ref-qty-dec" data-target="mobilidade">-</button>
                <span id="refugio-mobilidade" class="refugio-qty-span">${r.mobilidade || 0}</span>
                <button type="button" class="btn-ref-qty-inc" data-target="mobilidade">+</button>
              </div>
            </div>
            <div class="refugio-attr-card" title="Nível 0: Nenhuma&#10;Nível 1: Linhas e sinos&#10;Nível 2: Cerca de arame farpado&#10;Nível 3: Muro de madeira&#10;Nível 4: Muro de pedra ou tijolo&#10;Nível 5: Complexo prisional&#10;Nível 6: Base militar">
              <span class="refugio-attr-label">Defesa</span>
              <div class="refugio-qty-controls">
                <button type="button" class="btn-ref-qty-dec" data-target="defesa" data-max="6">-</button>
                <span id="refugio-defesa" class="refugio-qty-span">${r.defesa || 0}</span>
                <button type="button" class="btn-ref-qty-inc" data-target="defesa" data-max="6">+</button>
              </div>
              <span class="refugio-attr-level-desc" id="desc-refugio-defesa" style="display:block; text-align:center; font-size:var(--font-size-md); color:rgba(255,255,255,0.5); font-family:var(--font-heading); text-transform:uppercase; font-weight:600; letter-spacing:0.3px;">${getLevelLabel(r.defesa || 0, DEFESA_LABELS)}</span>
            </div>
            <div class="refugio-attr-card" title="Nível 0: Amotinada&#10;Nível 1: Desiludida&#10;Nível 2: Hesitante&#10;Nível 3: Resoluta&#10;Nível 4: Animada&#10;Nível 5: Empenhada&#10;Nível 6: Exaltada">
              <span class="refugio-attr-label">Moral</span>
              <div class="refugio-qty-controls">
                <button type="button" class="btn-ref-qty-dec" data-target="moral" data-max="6">-</button>
                <span id="refugio-moral" class="refugio-qty-span">${r.moral || 0}</span>
                <button type="button" class="btn-ref-qty-inc" data-target="moral" data-max="6">+</button>
              </div>
              <span class="refugio-attr-level-desc" id="desc-refugio-moral" style="display:block; text-align:center; font-size:var(--font-size-md); color:rgba(255,255,255,0.5); font-family:var(--font-heading); text-transform:uppercase; font-weight:600; letter-spacing:0.3px;">${getLevelLabel(r.moral || 0, MORAL_LABELS)}</span>
            </div>
            <div class="refugio-attr-card" title="Nível 0: Pacifista&#10;Nível 1: Mínima&#10;Nível 2: Razoável&#10;Nível 3: Eficiente&#10;Nível 4: Ameaçadora&#10;Nível 5: Terrível&#10;Nível 6: Arrasadora">
              <span class="refugio-attr-label">Beligerância</span>
              <div class="refugio-qty-controls">
                <button type="button" class="btn-ref-qty-dec" data-target="beligerancia" data-max="6">-</button>
                <span id="refugio-beligerancia" class="refugio-qty-span">${r.beligerancia || 0}</span>
                <button type="button" class="btn-ref-qty-inc" data-target="beligerancia" data-max="6">+</button>
              </div>
              <span class="refugio-attr-level-desc" id="desc-refugio-beligerancia" style="display:block; text-align:center; font-size:var(--font-size-md); color:rgba(255,255,255,0.5); font-family:var(--font-heading); text-transform:uppercase; font-weight:600; letter-spacing:0.3px;">${getLevelLabel(r.beligerancia || 0, BELIGERANCIA_LABELS)}</span>
            </div>
          </div>
          <div class="refugio-resource-theme-col">   
              <div class="refugio-theme-header">Sobrevivência</div>
                <div class="refugio-resources-row">
                  <div class="refugio-resource-card res-agua">
                    <span class="refugio-resource-label">Água</span>
                    <button type="button" class="btn-res-dec" data-res-key="agua" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">-</button>
                    <span class="refugio-resource-value" data-res-key="agua">${r.recursos.agua ?? 0}</span>
                    <button type="button" class="btn-res-inc" data-res-key="agua" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">+</button>
                  </div>
                  <div class="refugio-resource-card res-alimento">
                  <span class="refugio-resource-label">Alimento</span>
                  <button type="button" class="btn-res-dec" data-res-key="alimento" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">-</button>
                  <span class="refugio-resource-value" data-res-key="alimento">${r.recursos.alimento ?? 0}</span>
                  <button type="button" class="btn-res-inc" data-res-key="alimento" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">+</button>
                  </div>
                  <div class="refugio-resource-card res-remedios">
                  <span class="refugio-resource-label">Remédios</span>
                  <button type="button" class="btn-res-dec" data-res-key="remedios" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">-</button>
                  <span class="refugio-resource-value" data-res-key="remedios">${r.recursos.remedios ?? 0}</span>
                  <button type="button" class="btn-res-inc" data-res-key="remedios" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">+</button>
                  </div>
                  <div class="refugio-resource-card res-vestuario">
                  <span class="refugio-resource-label">Vestuário</span>
                  <button type="button" class="btn-res-dec" data-res-key="vestuario" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">-</button>
                  <span class="refugio-resource-value" data-res-key="vestuario">${r.recursos.vestuario ?? 0}</span>
                  <button type="button" class="btn-res-inc" data-res-key="vestuario" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">+</button>
                  </div>
                </div>
              </div>

            <!-- Coluna 2: Orgânicos -->
            <div class="refugio-resource-theme-col">
              <div class="refugio-theme-header">Orgânicos</div>
              <div class="refugio-resources-row">
                <div class="refugio-resource-card res-plantas">
                  <span class="refugio-resource-label">Plantas</span>
                  <button type="button" class="btn-res-dec" data-res-key="plantas" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">-</button>
                  <span class="refugio-resource-value" data-res-key="plantas">${r.recursos.plantas ?? 0}</span>
                  <button type="button" class="btn-res-inc" data-res-key="plantas" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">+</button>
                </div>
                <div class="refugio-resource-card res-animais">
                  <span class="refugio-resource-label">Animais</span>
                  <button type="button" class="btn-res-dec" data-res-key="animais" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">-</button>
                  <span class="refugio-resource-value" data-res-key="animais">${r.recursos.animais ?? 0}</span>
                  <button type="button" class="btn-res-inc" data-res-key="animais" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">+</button>
                </div>
                <div class="refugio-resource-card res-madeira">
                  <span class="refugio-resource-label">Madeira</span>
                  <button type="button" class="btn-res-dec" data-res-key="madeira" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">-</button>
                  <span class="refugio-resource-value" data-res-key="madeira">${r.recursos.madeira ?? 0}</span>
                  <button type="button" class="btn-res-inc" data-res-key="madeira" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">+</button>
                </div>
                <div class="refugio-resource-card res-biomassa">
                  <span class="refugio-resource-label">Biomassa</span>
                  <button type="button" class="btn-res-dec" data-res-key="biomassa" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">-</button>
                  <span class="refugio-resource-value" data-res-key="biomassa">${r.recursos.biomassa ?? 0}</span>
                  <button type="button" class="btn-res-inc" data-res-key="biomassa" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">+</button>
                </div>
              </div>
            </div>

            <!-- Coluna 3: Indústria -->
            <div class="refugio-resource-theme-col">
              <div class="refugio-theme-header">Indústria</div>
              <div class="refugio-resources-row">
                <div class="refugio-resource-card res-minerais">
                  <span class="refugio-resource-label">Minerais</span>
                  <button type="button" class="btn-res-dec" data-res-key="minerais" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">-</button>
                  <span class="refugio-resource-value" data-res-key="minerais">${r.recursos.minerais ?? 0}</span>
                  <button type="button" class="btn-res-inc" data-res-key="minerais" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">+</button>
                </div>
                <div class="refugio-resource-card res-combustivel">
                  <span class="refugio-resource-label">Combustível</span>
                  <button type="button" class="btn-res-dec" data-res-key="combustivel" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">-</button>
                  <span class="refugio-resource-value" data-res-key="combustivel">${r.recursos.combustivel ?? 0}</span>
                  <button type="button" class="btn-res-inc" data-res-key="combustivel" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">+</button>
                </div>
                <div class="refugio-resource-card res-municao">
                  <span class="refugio-resource-label">Munição</span>
                  <button type="button" class="btn-res-dec" data-res-key="municao" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">-</button>
                  <span class="refugio-resource-value" data-res-key="municao">${r.recursos.municao ?? 0}</span>
                  <button type="button" class="btn-res-inc" data-res-key="municao" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">+</button>
                </div>
                <div class="refugio-resource-card res-mat_constr">
                  <span class="refugio-resource-label">Mat. Constr.</span>
                  <button type="button" class="btn-res-dec" data-res-key="mat_constr" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">-</button>
                  <span class="refugio-resource-value" data-res-key="mat_constr">${r.recursos.mat_constr ?? 0}</span>
                  <button type="button" class="btn-res-inc" data-res-key="mat_constr" style="background:rgba(255,255,255,0.02); border:none; border-left:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:28px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:bold; outline:none; user-select:none;">+</button>
                </div>
              </div>
          </div>
        </div>

        <!-- Coluna da Direita (Descrição, Anotações, Crises) -->
        <div class="ref-area-right">
          <!-- Descrição -->
          <div class="refugio-textarea-card">
            <label>Descrição</label>
            <textarea id="refugio-descricao" placeholder="Descreva o refúgio...">${esc(r.descricao)}</textarea>
          </div>

          <!-- Anotações -->
          <div class="refugio-textarea-card">
            <label>Anotações</label>
            <textarea id="refugio-notas" placeholder="Notas da sessão...">${esc(r.notas)}</textarea>
          </div>

          <!-- Crises -->
          <div class="refugio-crises-card">
            <div class="refugio-crises-header">
              <h4>Crises Ativas</h4>
              <button class="btn btn-sm" id="btn-add-crise">+ Crise</button>
            </div>
            <div class="world-list-items" id="refugio-crises-list">
              ${_renderCrises(r.crises)}
            </div>
          </div>
        </div>

        <!-- Parte Inferior (Construções - Ocupa Coluna 1 & 2 no Desktop) -->
        <div class="ref-area-bottom">
          <div class="refugio-buildings-card">
            <div class="refugio-buildings-header">
              <h4>Construções</h4>
              <button id="btn-add-construcao">+</button>
            </div>
            <div class="refugio-buildings-list" id="refugio-buildings-list">
              <!-- Inserido dinamicamente -->
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  _attachListeners(r);
  _renderBuildings(screen, r);
}

function _renderBuildings(screen, r) {
  const list = screen.querySelector("#refugio-buildings-list");
  if (!list) return;
  if (!r.construcoes || r.construcoes.length === 0) {
    list.innerHTML = `<div style="font-size:var(--font-size-xs); color:var(--text-muted); text-align:center; padding:16px; font-style:italic;">Nenhuma construção registrada. Clique no "+" acima para adicionar.</div>`;
    return;
  }
  list.innerHTML = r.construcoes.map((c, i) => `
    <div class="refugio-building-item" data-building-idx="${i}">
      <div class="refugio-building-top-row">
        <input type="text" class="refugio-building-name-input building-nome" value="${esc(c.nome)}" placeholder="Nome da Construção">
        <div class="refugio-building-level-wrapper">
          <span class="refugio-building-level-label">Obra</span>
          <input type="number" class="refugio-building-level-input building-nivel" value="${c.nivel || 10}" min="1" max="999">
        </div>
        <button class="refugio-building-remove-btn btn-remove-building" title="Remover">&times;</button>
      </div>
      
      <!-- Linha de Fluxo de Recursos (Consome / Produz) -->
      <div style="display:flex; gap:10px; margin: 4px 0 6px 0;">
        <div style="flex:1; display:flex; align-items:center; gap:6px; background:rgba(239,68,68,0.04); border:1px solid rgba(239,68,68,0.15); padding:3px 8px; border-radius:4px;">
          <span style="font-size:9px; color:#ef4444; text-transform:uppercase; font-weight:bold; letter-spacing:0.5px; user-select:none;">Consome</span>
          <input type="text" class="building-consumo" value="${esc(c.consumo || '')}" placeholder="Ex: Plantas 1" style="background:transparent; border:none; color:#ffb0b0; font-size:11px; width:100%; outline:none;">
        </div>
        <div style="flex:1; display:flex; align-items:center; gap:6px; background:rgba(0,255,102,0.04); border:1px solid rgba(0,255,102,0.15); padding:3px 8px; border-radius:4px;">
          <span style="font-size:9px; color:#00ff66; text-transform:uppercase; font-weight:bold; letter-spacing:0.5px; user-select:none;">Produz</span>
          <input type="text" class="building-producao" value="${esc(c.producao || '')}" placeholder="Ex: Medicamentos 1" style="background:transparent; border:none; color:#a0ffa0; font-size:11px; width:100%; outline:none;">
        </div>
      </div>

      <textarea class="refugio-building-desc-textarea building-desc" placeholder="Efeito / Requisitos da obra..." rows="2">${esc(c.descricao || "")}</textarea>
    </div>
  `).join("");

  list.querySelectorAll(".refugio-building-item").forEach((item, i) => {
    item.querySelector(".building-nome")?.addEventListener("input", e => { r.construcoes[i].nome = e.target.value; saveRefugio(r); });
    item.querySelector(".building-nivel")?.addEventListener("input", e => { r.construcoes[i].nivel = parseInt(e.target.value) || 0; saveRefugio(r); });
    item.querySelector(".building-consumo")?.addEventListener("input", e => { r.construcoes[i].consumo = e.target.value; saveRefugio(r); });
    item.querySelector(".building-producao")?.addEventListener("input", e => { r.construcoes[i].producao = e.target.value; saveRefugio(r); });
    item.querySelector(".building-desc")?.addEventListener("input", e => { r.construcoes[i].descricao = e.target.value; saveRefugio(r); });
    item.querySelector(".btn-remove-building")?.addEventListener("click", () => {
      if (confirm(`Remover a construção "${r.construcoes[i].nome || 'Sem nome'}"?`)) {
        r.construcoes.splice(i, 1);
        saveRefugio(r);
        _renderBuildings(screen, r);
      }
    });
  });
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

  // Escutas dos botões + e - dos atributos principais do Refúgio
  screen.querySelectorAll(".btn-ref-qty-dec").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      const span = screen.querySelector(`#refugio-${target.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`);
      if (!span) return;
      let val = parseInt(span.textContent) || 0;
      if (val > 0) {
        val--;
        span.textContent = val;
        r[target] = val;
        saveRefugio(r);
        
        // Se for defesa, moral ou beligerância, atualiza a descrição
        if (target === "defesa") {
          const descEl = screen.querySelector("#desc-refugio-defesa");
          if (descEl) descEl.textContent = getLevelLabel(val, DEFESA_LABELS);
        } else if (target === "moral") {
          const descEl = screen.querySelector("#desc-refugio-moral");
          if (descEl) descEl.textContent = getLevelLabel(val, MORAL_LABELS);
        } else if (target === "beligerancia") {
          const descEl = screen.querySelector("#desc-refugio-beligerancia");
          if (descEl) descEl.textContent = getLevelLabel(val, BELIGERANCIA_LABELS);
        }
      }
    });
  });

  screen.querySelectorAll(".btn-ref-qty-inc").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      const maxVal = parseInt(btn.dataset.max) || 999;
      const span = screen.querySelector(`#refugio-${target.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`);
      if (!span) return;
      let val = parseInt(span.textContent) || 0;
      if (val < maxVal) {
        val++;
        span.textContent = val;
        r[target] = val;
        saveRefugio(r);
        
        // Se for defesa, moral ou beligerância, atualiza a descrição
        if (target === "defesa") {
          const descEl = screen.querySelector("#desc-refugio-defesa");
          if (descEl) descEl.textContent = getLevelLabel(val, DEFESA_LABELS);
        } else if (target === "moral") {
          const descEl = screen.querySelector("#desc-refugio-moral");
          if (descEl) descEl.textContent = getLevelLabel(val, MORAL_LABELS);
        } else if (target === "beligerancia") {
          const descEl = screen.querySelector("#desc-refugio-beligerancia");
          if (descEl) descEl.textContent = getLevelLabel(val, BELIGERANCIA_LABELS);
        }
      }
    });
  });

  // Escutas dos botões + e - de recursos
  screen.querySelectorAll(".btn-res-dec").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.resKey;
      const span = screen.querySelector(`.refugio-resource-value[data-res-key="${key}"]`);
      if (span) {
        let val = parseInt(span.textContent) || 0;
        val = Math.max(0, val - 1);
        span.textContent = val;
        r.recursos[key] = val;
        
        // Recalcular Reservas Atuais e atualizar span no DOM
        r.reservas = calculateCurrentReserves(r);
        const resSpan = screen.querySelector("#refugio-reservas");
        if (resSpan) {
          resSpan.textContent = r.reservas;
        }
        saveRefugio(r);
      }
    });
  });

  screen.querySelectorAll(".btn-res-inc").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.resKey;
      const span = screen.querySelector(`.refugio-resource-value[data-res-key="${key}"]`);
      if (span) {
        let val = parseInt(span.textContent) || 0;
        val = val + 1;
        span.textContent = val;
        r.recursos[key] = val;
        
        // Recalcular Reservas Atuais e atualizar span no DOM
        r.reservas = calculateCurrentReserves(r);
        const resSpan = screen.querySelector("#refugio-reservas");
        if (resSpan) {
          resSpan.textContent = r.reservas;
        }
        saveRefugio(r);
      }
    });
  });

  // Escuta do botão de adicionar Construção
  screen.querySelector("#btn-add-construcao")?.addEventListener("click", () => {
    openCreateBuildingModal(r);
  });

  screen.querySelector("#btn-add-crise")?.addEventListener("click", () => {
    openCreateCriseModal(r);
  });
  _attachCriseListeners(r);

  const _attachSingleRefListener = (containerId, fieldKey, stateKey) => {
    const openBtn = screen.querySelector(`#${containerId}-chips`)?.parentNode.querySelector(".btn-open-ref-modal-single");
    if (openBtn) {
      openBtn.addEventListener("click", e => {
        const label = e.target.dataset.reflabel;
        const currentIds = r[fieldKey] ? [r[fieldKey]] : [];
        openSelectReferencesModal("Vincular " + label, stateKey, currentIds, (selectedIds) => {
          r[fieldKey] = selectedIds.length > 0 ? selectedIds[0] : null;
          saveRefugio(r);
          renderRefugioSheet();
        }, true);
      });
    }
    screen.querySelectorAll(`#${containerId}-chips .btn-remove-ref`).forEach(btn => {
      btn.addEventListener("click", () => {
        r[fieldKey] = null;
        saveRefugio(r); renderRefugioSheet();
      });
    });
  };

  _attachSingleRefListener("refugio-ref-regiao", "regiaoId", "regioes");
  _attachSingleRefListener("refugio-ref-local", "localId", "locais");

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
