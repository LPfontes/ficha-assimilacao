import { el, state, saveCurrentCharacter } from "./state.js";
import { getCurrentHealthLevel } from "./health.js";
import { appendRollToChat, renderResultsPanel, updateResultsSummary, getDieSymbolsHtml, getDieFaceImgSrc } from "./chat.js";
import { logger } from "./logger.js";

// ==========================================
// MAPEAMENTO DE DADOS (PÁG 43)
// ==========================================
export const DICE_MAP = {
  d6: {
    1: [],
    2: [],
    3: ["C"],
    4: ["C"],
    5: ["B", "C"],
    6: ["A"]
  },
  d10: {
    1: [],
    2: [],
    3: ["C"],
    4: ["C"],
    5: ["B", "C"],
    6: ["A"],
    7: ["A", "A"],
    8: ["A", "B"],
    9: ["A", "B", "C"],
    10: ["A", "A", "C"]
  },
  d12: {
    1: [],
    2: [],
    3: ["C"],
    4: ["C"],
    5: ["B", "C"],
    6: ["A"],
    7: ["A", "A"],
    8: ["A", "B"],
    9: ["A", "B", "C"],
    10: ["A", "A", "C"],
    11: ["A", "B", "B", "C"],
    12: ["C", "C"]
  }
};

// ==========================================
// SELEÇÃO DE ROLAGEM E CONVERSÃO DE DADOS
// ==========================================
export function selectRollAptitude(type, name, value) {
  if (!state.currentCharacter) return;
  
  logger.info(`Rolador: Selecionando aptidão para teste - Tipo: "${type}", Nome: "${name}", Valor: ${value}`);
  
  if (type === "instinto") {
    if (state.selectedRoll.instinto === name) {
      state.selectedRoll.instinto = "";
      state.selectedRoll.d6 = 0;
    } else {
      state.selectedRoll.instinto = name;
      state.selectedRoll.d6 = value;
    }
  } else if (type === "skill") {
    if (state.selectedRoll.skill === name) {
      state.selectedRoll.skill = "";
      state.selectedRoll.d10 = 0;
    } else {
      state.selectedRoll.skill = name;
      state.selectedRoll.d10 = value;
    }
  }
  
  // Se Agir por Instinto estiver ativo, atualiza
  if (state.selectedRoll.agirPorInstinto) {
    state.selectedRoll.d12 = state.selectedRoll.d6;
    state.selectedRoll.d6 = 0;
  }
  
  // Atualiza visualizadores
  document.dispatchEvent(new CustomEvent('aptitudes-refresh'));
  updateDiceDrawerUI();
}

export function updateDiceDrawerUI() {
  el.diceQtyD6.textContent = state.selectedRoll.d6;
  el.diceQtyD10.textContent = state.selectedRoll.d10;
  el.diceQtyD12.textContent = state.selectedRoll.d12;
  
  if (el.rollSelectInstinto) el.rollSelectInstinto.value = state.selectedRoll.instinto;
  if (el.rollSelectSkill) el.rollSelectSkill.value = state.selectedRoll.skill;
  
  if (state.selectedRoll.instinto || state.selectedRoll.skill) {
    const instText = state.selectedRoll.instinto ? `${state.selectedRoll.instinto} (${state.currentCharacter.instintos[state.selectedRoll.instinto]})` : "Nenhum Instinto";
    const skillText = state.selectedRoll.skill ? `${state.selectedRoll.skill} (${state.currentCharacter.conhecimentos[state.selectedRoll.skill] || state.currentCharacter.praticas[state.selectedRoll.skill] || 0})` : "Nenhuma Aptidão";
    el.currentRollLabel.textContent = `Teste: ${instText} + ${skillText}`;
  } else {
    el.currentRollLabel.textContent = "Nenhuma aptidão selecionada na ficha";
  }
  
  // Alerta de Saúde
  let warningEl = el.diceDrawer.querySelector("#drawer-health-warning");
  if (state.currentCharacter) {
    const healthLvl = getCurrentHealthLevel(state.currentCharacter);
    if (healthLvl <= 4) {
      if (!warningEl) {
        warningEl = document.createElement("div");
        warningEl.id = "drawer-health-warning";
        const h3 = el.diceDrawer.querySelector("h3");
        if (h3) {
          h3.parentNode.insertBefore(warningEl, h3.nextSibling);
        }
      }
      warningEl.className = `drawer-health-alert level-${healthLvl}`;
      
      let lvlName = "";
      if (healthLvl === 4) lvlName = "Laceração";
      else if (healthLvl === 3) lvlName = "Ferimentos";
      else if (healthLvl === 2) lvlName = "Debilitação";
      else if (healthLvl === 1) lvlName = "Incapacitação";
      
      if (healthLvl === 4 || healthLvl === 3) {
        warningEl.innerHTML = `⚠️ <strong>${lvlName}:</strong> -1 Sucesso [S] em todos os testes.`;
      } else if (healthLvl === 2) {
        warningEl.innerHTML = `⚠️ <strong>Debilitação:</strong> -2 Sucessos [S]. Incapaz de agir sem gastar 1 Determinação.`;
      } else if (healthLvl === 1) {
        warningEl.innerHTML = `⚠️ <strong>Incapacitação:</strong> Quase morte. Conversa exige 1 Determinação/rodada. Ação exige +2 A.`;
      }
    } else {
      if (warningEl) warningEl.remove();
    }
  } else {
    if (warningEl) warningEl.remove();
  }
  
  updateKeepCountDisplay();
}

export function resetDiceDrawerSelections() {
  state.selectedRoll = { instinto: "", skill: "", d6: 0, d10: 0, d12: 0 };
  el.diceQtyD6.textContent = 0;
  el.diceQtyD10.textContent = 0;
  el.diceQtyD12.textContent = 0;
  el.currentRollLabel.textContent = "Nenhuma aptidão selecionada na ficha";
  el.modEmpenho.checked = false;
  el.modOrigemOcupacao.checked = false;
  el.modOrigemEvento.checked = false;

  if (el.rollSelectInstinto) el.rollSelectInstinto.value = "";
  if (el.rollSelectSkill) el.rollSelectSkill.value = "";
  
  // Remove active-roll class from prior messages
  document.querySelectorAll(".chat-message.active-roll").forEach(msg => {
    msg.classList.remove("active-roll");
  });
}

// Calcula quantos dados podem ser mantidos (Roll and Keep)
export function updateKeepCountDisplay() {
  let maxKeep = 1; // Base
  if (el.modEmpenho.checked) maxKeep++;
  if (el.modOrigemOcupacao.checked) maxKeep++;
  if (el.modOrigemEvento.checked) maxKeep++;
  
  // Obter o maxKeepCount da gaveta ou da mensagem ativa
  const maxKeepCountDrawer = document.getElementById("max-keep-count");
  if (maxKeepCountDrawer) {
    maxKeepCountDrawer.textContent = maxKeep;
  }
  
  // Atualiza narrador se houver resultados ativos
  if (state.activeRollResults.length > 0) {
    updateResultsSummary();
  }
}


// ==========================================
// ROLAGEM DE DADOS
// ==========================================
export function execute3DPhysicsRoll() {
  const box = state.diceBox || window.diceBox;
  if (!box) {
    alert("O motor 3D ainda está carregando...");
    return;
  }
  
  const d6Count = parseInt(el.diceQtyD6.textContent) || 0;
  const d10Count = parseInt(el.diceQtyD10.textContent) || 0;
  const d12Count = parseInt(el.diceQtyD12.textContent) || 0;
  
  if (d6Count === 0 && d10Count === 0 && d12Count === 0) {
    alert("Monte uma pilha de dados antes de rolar!");
    return;
  }
  
  if (el.modEmpenho.checked) {
    if (state.currentCharacter && state.currentCharacter.detPoints >= 1) {
      state.currentCharacter.detPoints -= 1;
      logger.info("Rolador: Gastou 1 Ponto de Determinação pelo uso de Empenho.");
      saveCurrentCharacter();
      document.dispatchEvent(new CustomEvent('cabo-guerra-refresh'));
    } else {
      alert("Determinação insuficiente para usar Empenho!");
      return;
    }
  }
  
  // Monta pool para o DiceBox
  const pool = [];
  if (d6Count > 0) pool.push(`${d6Count}d6`);
  if (d10Count > 0) pool.push(`${d10Count}d10`);
  if (d12Count > 0) pool.push(`${d12Count}d12`);
  
  const notationString = pool.join("+");
  logger.info(`Rolador: Iniciando rolagem 3D física com fórmula: "${notationString}"`);
  
  const disable3D = localStorage.getItem("assimilação_disable_3d") === "true";
  if (disable3D) {
    logger.info(`Rolador: Rolagem 3D desativada. Executando rolagem matemática rápida para ${notationString}`);
    const results = [];
    let idx = 0;
    
    for (let i = 0; i < d6Count; i++) {
      const val = Math.floor(Math.random() * 6) + 1;
      results.push({ id: idx++, sides: 6, value: val, symbols: DICE_MAP.d6[val] || [] });
    }
    for (let i = 0; i < d10Count; i++) {
      const val = Math.floor(Math.random() * 10) + 1;
      results.push({ id: idx++, sides: 10, value: val, symbols: DICE_MAP.d10[val] || [] });
    }
    for (let i = 0; i < d12Count; i++) {
      const val = Math.floor(Math.random() * 12) + 1;
      results.push({ id: idx++, sides: 12, value: val, symbols: DICE_MAP.d12[val] || [] });
    }
    
    state.activeRollResults = results;
    state.keptDiceIndexes = [];
    if (state.activeRollResults.length > 0) {
      state.keptDiceIndexes.push(0);
    }
    
    appendRollToChat(notationString);
    renderResultsPanel();
    updateResultsSummary();
    
    if (el.diceDrawer && el.diceDrawer.classList.contains("hidden")) {
      el.diceDrawer.classList.remove("hidden");
    }
    return;
  }

  // Exibe o overlay da mesa de rolagem no canto superior direito
  el.diceOverlay.classList.remove("hidden");
  
  // Ajusta o Three.js para o tamanho do overlay visível
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 50);
  
  // Define e rola no canvas local
  box.setDice(notationString);
  box.start_throw(
    null,
    (notation) => {
      logger.info("Rolador: Rolagem 3D concluída. Resultados brutos:", notation.result);
      
      if (!notation.result || notation.result.length === 0 || notation.result[0] < 0) {
        logger.error("Rolador: Erro na simulação do Dice Box (dados fora da mesa).");
        alert("Ops! Os dados saíram da mesa de rolagem. Tente novamente.");
        el.diceOverlay.classList.add("hidden");
        return;
      }
      
      // Converte os dados brutos e salva no estado
      state.activeRollResults = notation.result.map((val, idx) => {
        const type = notation.set[idx]; // 'd6', 'd10', 'd12'
        const symbols = DICE_MAP[type][val] || [];
        const sides = parseInt(type.substring(1));
        return {
          id: idx,
          sides: sides,
          value: val,
          symbols: symbols
        };
      });
      
      // Reseta dados mantidos
      state.keptDiceIndexes = [];
      
      // Se for rolagem básica, mantemos o primeiro automaticamente
      if (state.activeRollResults.length > 0) {
        state.keptDiceIndexes.push(0);
      }
      
      // Adiciona mensagem ao chat
      appendRollToChat(notationString);
      renderResultsPanel();
      updateResultsSummary();
      
      // Fecha a mesa de rolagem automaticamente após 2.5 segundos
      setTimeout(() => {
        el.diceOverlay.classList.add("hidden");
      }, 2500);

      // Abre o modal do painel caso ele esteja fechado para ver o chat do resultado
      if (el.diceDrawer && el.diceDrawer.classList.contains("hidden")) {
        el.diceDrawer.classList.remove("hidden");
      }
    }
  );
}

export function executeCustomRoll() {
  const box = state.diceBox || window.diceBox;
  if (!box) {
    alert("O motor 3D ainda está carregando...");
    return;
  }
  
  const formula = el.diceCustomFormula.value.trim().toLowerCase();
  if (!formula) {
    alert("Digite uma fórmula de dados para rolar (Ex: 1d20+2d8)!");
    return;
  }
  
  logger.info(`Rolador: Iniciando rolagem customizada com fórmula: "${formula}"`);
  
  const disable3D = localStorage.getItem("assimilação_disable_3d") === "true";
  if (disable3D) {
    logger.info(`Rolador: Rolagem 3D desativada. Executando rolagem customizada matemática rápida para: "${formula}"`);
    const results = [];
    let idx = 0;
    const parts = formula.split("+");
    parts.forEach(part => {
      const match = part.trim().match(/^(\d+)d(\d+)$/);
      if (match) {
        const qty = parseInt(match[1]);
        const sides = parseInt(match[2]);
        for (let i = 0; i < qty; i++) {
          const val = Math.floor(Math.random() * sides) + 1;
          const symbols = DICE_MAP[`d${sides}`] ? (DICE_MAP[`d${sides}`][val] || []) : [];
          results.push({ id: idx++, sides: sides, value: val, symbols: symbols });
        }
      }
    });
    
    state.activeRollResults = results;
    state.keptDiceIndexes = [];
    if (state.activeRollResults.length > 0) {
      state.keptDiceIndexes.push(0);
    }
    
    appendRollToChat(formula);
    renderResultsPanel();
    updateResultsSummary();
    
    if (el.diceDrawer.classList.contains("closed")) {
      el.diceDrawer.classList.remove("closed");
      el.btnToggleDrawer.querySelector(".trigger-arrow").textContent = "▶";
    }
    return;
  }

  // Exibe o overlay da mesa de rolagem no canto superior direito
  el.diceOverlay.classList.remove("hidden");
  
  // Ajusta o Three.js para o tamanho do overlay visível
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 50);
  
  box.setDice(formula);
  box.start_throw(
    null,
    (notation) => {
      logger.info("Rolador: Rolagem customizada concluída. Resultados:", notation.result);
      
      if (!notation.result || notation.result.length === 0 || notation.result[0] < 0) {
        logger.error("Rolador: Erro na simulação do Dice Box customizado.");
        alert("Ops! Os dados saíram da mesa de rolagem. Tente novamente.");
        el.diceOverlay.classList.add("hidden");
        return;
      }
      
      // Converte os dados brutos e salva no estado
      state.activeRollResults = notation.result.map((val, idx) => {
        const type = notation.set[idx]; // 'd6', 'd10', 'd12', 'd20', etc.
        const symbols = DICE_MAP[type] ? (DICE_MAP[type][val] || []) : [];
        const sides = parseInt(type.substring(1));
        return {
          id: idx,
          sides: sides,
          value: val,
          symbols: symbols
        };
      });
      
      // Reseta dados mantidos
      state.keptDiceIndexes = [];
      
      // Se for rolagem básica, mantemos o primeiro automaticamente
      if (state.activeRollResults.length > 0) {
        state.keptDiceIndexes.push(0);
      }
      
      // Adiciona mensagem ao chat
      appendRollToChat(formula);
      renderResultsPanel();
      updateResultsSummary();
      
      // Fecha a mesa de rolagem automaticamente após 2.5 segundos
      setTimeout(() => {
        el.diceOverlay.classList.add("hidden");
      }, 2500);
      
      // Abre a gaveta se estiver fechada para dar feedback
      if (el.diceDrawer.classList.contains("closed")) {
        el.diceDrawer.classList.remove("closed");
        el.btnToggleDrawer.querySelector(".trigger-arrow").textContent = "▶";
      }
    }
  );
}

// Configura botões mais/menos nos seletores numéricos
export function setupNumberInputControls() {
  document.querySelectorAll(".number-input").forEach(container => {
    const input = container.querySelector("input");
    const minus = container.querySelector(".num-minus");
    const plus = container.querySelector(".num-plus");
    
    // Evita duplicar escutas se o container for do wizard
    if (container.closest("#wizard-screen")) return;

    if (minus && plus && input) {
      minus.addEventListener("click", () => {
        let val = parseInt(input.value) || 0;
        if (val > parseInt(input.min || 0)) {
          input.value = val - 1;
          input.dispatchEvent(new Event("change"));
          triggerSelectedRollUpdate();
        }
      });
      
      plus.addEventListener("click", () => {
        let val = parseInt(input.value) || 0;
        if (val < parseInt(input.max || 10)) {
          input.value = val + 1;
          input.dispatchEvent(new Event("change"));
          triggerSelectedRollUpdate();
        }
      });

      input.addEventListener("change", () => {
        triggerSelectedRollUpdate();
      });
    }
  });

  setupDiceTagSelectionControls();
}

export function setupDiceTagSelectionControls() {
  const d6Tag = document.querySelector(".dice-select-control .tag-d6");
  const d10Tag = document.querySelector(".dice-select-control .tag-d10");
  const d12Tag = document.querySelector(".dice-select-control .tag-d12");
  
  if (d6Tag) {
    d6Tag.addEventListener("click", () => {
      let val = parseInt(el.diceQtyD6.textContent) || 0;
      if (val < 10) {
        el.diceQtyD6.textContent = val + 1;
        triggerSelectedRollUpdate();
        updateDiceDrawerUI();
      }
    });
    d6Tag.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      let val = parseInt(el.diceQtyD6.textContent) || 0;
      if (val > 0) {
        el.diceQtyD6.textContent = val - 1;
        triggerSelectedRollUpdate();
        updateDiceDrawerUI();
      }
    });
  }

  if (d10Tag) {
    d10Tag.addEventListener("click", () => {
      let val = parseInt(el.diceQtyD10.textContent) || 0;
      if (val < 10) {
        el.diceQtyD10.textContent = val + 1;
        triggerSelectedRollUpdate();
        updateDiceDrawerUI();
      }
    });
    d10Tag.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      let val = parseInt(el.diceQtyD10.textContent) || 0;
      if (val > 0) {
        el.diceQtyD10.textContent = val - 1;
        triggerSelectedRollUpdate();
        updateDiceDrawerUI();
      }
    });
  }

  if (d12Tag) {
    d12Tag.addEventListener("click", () => {
      let val = parseInt(el.diceQtyD12.textContent) || 0;
      if (val < 10) {
        el.diceQtyD12.textContent = val + 1;
        triggerSelectedRollUpdate();
        updateDiceDrawerUI();
      }
    });
    d12Tag.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      let val = parseInt(el.diceQtyD12.textContent) || 0;
      if (val > 0) {
        el.diceQtyD12.textContent = val - 1;
        triggerSelectedRollUpdate();
        updateDiceDrawerUI();
      }
    });
  }
}

function triggerSelectedRollUpdate() {
  state.selectedRoll.d6 = parseInt(el.diceQtyD6.textContent) || 0;
  state.selectedRoll.d10 = parseInt(el.diceQtyD10.textContent) || 0;
  state.selectedRoll.d12 = parseInt(el.diceQtyD12.textContent) || 0;
}

export function initRolagemAssimiladaPanel() {
  const char = state.currentCharacter;
  if (!char) return;

  const INSTINTOS = ["Influência", "Percepção", "Potência", "Reação", "Resolução", "Sagacidade"];
  const select1 = document.getElementById("inst-select-1");
  const select2 = document.getElementById("inst-select-2");
  
  if (!select1 || !select2) return;

  const optionsHtml = INSTINTOS.map(i =>
    `<option value="${i}">${i} (${char.instintos[i] || 0})</option>`
  ).join("");

  select1.innerHTML = optionsHtml;
  select2.innerHTML = optionsHtml;

  // Seleciona o instinto padrão se houver
  const preInstinto = state.selectedRoll.instinto;
  if (preInstinto && INSTINTOS.includes(preInstinto)) {
    select1.value = preInstinto;
  }

  const podeAssimilacao = char.assPoints >= 1;
  const podeDeterminacao = char.detPoints >= 2;
  const podeAtuar = podeAssimilacao || podeDeterminacao;

  const custoDisplay = document.getElementById("instinto-custo-display");
  if (custoDisplay) {
    custoDisplay.innerHTML = podeAssimilacao
      ? `<div class="custo-badge custo-ass" style="background: rgba(0, 162, 255, 0.1); border: 1px solid rgba(0, 162, 255, 0.3); padding: 8px 12px; border-radius: var(--radius-sm); color: #00a2ff; font-weight: bold;">Custo: 1 Ponto de Assimilação (disponível: ${char.assPoints})</div>`
      : podeDeterminacao
      ? `<div class="custo-badge custo-det" style="background: rgba(255, 51, 51, 0.1); border: 1px solid rgba(255, 51, 51, 0.3); padding: 8px 12px; border-radius: var(--radius-sm); color: #ff3333; font-weight: bold;">Custo: 2 Pontos de Determinação — Assimilação zerada (disponível: ${char.detPoints})</div>`
      : `<div class="custo-badge custo-sem" style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; padding: 8px 12px; border-radius: var(--radius-sm); color: #fca5a5; font-weight: bold;">⛔ Sem recursos! Precisa de 1 Assimilação ou 2 Determinação.</div>`;
  }

  const btnAgir = document.getElementById("btn-panel-agir-instinto");
  if (btnAgir) {
    btnAgir.disabled = !podeAtuar;
  }

  function updatePoolPreview() {
    const val1 = char.instintos[select1.value] || 0;
    const val2 = char.instintos[select2.value] || 0;
    const instCount1 = document.getElementById("inst-count-1");
    const instCount2 = document.getElementById("inst-count-2");
    const poolLabel = document.getElementById("instinto-pool-label");
    const keepLabel = document.getElementById("instinto-keep-label");

    if (instCount1) instCount1.textContent = `d12 × ${val1}`;
    if (instCount2) instCount2.textContent = `d12 × ${val2}`;
    if (poolLabel) poolLabel.textContent = `${val1 + val2}d12`;

    let maxKeep = 2;
    if (el.modEmpenhoAss && el.modEmpenhoAss.checked) maxKeep++;
    if (el.modOrigemOcupacaoAss && el.modOrigemOcupacaoAss.checked) maxKeep++;
    if (el.modOrigemEventoAss && el.modOrigemEventoAss.checked) maxKeep++;
    if (keepLabel) keepLabel.textContent = maxKeep;
  }

  select1.removeEventListener("change", updatePoolPreview);
  select2.removeEventListener("change", updatePoolPreview);
  select1.addEventListener("change", updatePoolPreview);
  select2.addEventListener("change", updatePoolPreview);
  updatePoolPreview();

  const btnPanelAgir = document.getElementById("btn-panel-agir-instinto");
  if (btnPanelAgir) {
    const runRoll = () => {
      if (!podeAtuar) return;
      const inst1 = select1.value;
      const inst2 = select2.value;
      const val1 = char.instintos[inst1] || 0;
      const val2 = char.instintos[inst2] || 0;
      const totalD12 = val1 + val2;
      if (totalD12 === 0) { alert("Selecione instintos com valor maior que 0!"); return; }

      let totalDetCost = 0;
      let totalAssCost = 0;

      if (podeAssimilacao) {
        totalAssCost = 1;
      } else {
        totalDetCost = 2;
      }

      const empenhoChecked = el.modEmpenhoAss && el.modEmpenhoAss.checked;
      if (empenhoChecked) {
        totalDetCost += 1;
      }

      if (char.detPoints < totalDetCost) {
        alert("Pontos de Determinação insuficientes para realizar esta rolagem com os modificadores selecionados!");
        return;
      }

      char.assPoints -= totalAssCost;
      char.detPoints -= totalDetCost;
      saveCurrentCharacter();
      document.dispatchEvent(new CustomEvent('cabo-guerra-refresh'));
      
      // Refresh cost display in panel
      initRolagemAssimiladaPanel();

      const notationString = `${totalD12}d12`;
      
      const disable3D = localStorage.getItem("assimilação_disable_3d") === "true";
      if (disable3D) {
        logger.info(`Rolador: Rolagem assimilada 3D desativada. Executando rolagem rápida.`);
        const results = [];
        for (let i = 0; i < totalD12; i++) {
          const val = Math.floor(Math.random() * 12) + 1;
          results.push({ value: val, sides: 12, symbols: DICE_MAP["d12"][val] || [] });
        }
        
        let maxKeep = 2;
        if (el.modEmpenhoAss && el.modEmpenhoAss.checked) maxKeep++;
        if (el.modOrigemOcupacaoAss && el.modOrigemOcupacaoAss.checked) maxKeep++;
        if (el.modOrigemEventoAss && el.modOrigemEventoAss.checked) maxKeep++;

        const keptIndexes = [...results.map((d, i) => ({ ...d, i }))]
          .sort((a, b) => b.value - a.value).slice(0, maxKeep).map(d => d.i);

        const container = document.getElementById("instinto-panel-dice-container");
        if (container) {
          container.innerHTML = "";
          results.forEach((die, idx) => {
            const card = document.createElement("div");
            card.className = `result-die-card ${keptIndexes.includes(idx) ? "kept" : ""}`;
            const imgSrc = getDieFaceImgSrc(12, die.value);
            card.innerHTML = imgSrc
              ? `<img src="${imgSrc}" class="die-face-img" alt="d12">`
              : `<span class="die-type-tag d-12">d12</span><span class="die-val-label">${die.value}</span><div class="die-symbol-svg">${getDieSymbolsHtml(die.symbols)}</div>`;
            container.appendChild(card);
          });
        }

        let suc = 0, adp = 0, pre = 0;
        keptIndexes.forEach(idx => {
          results[idx].symbols.forEach(s => {
            if (s === "A") suc++;
            if (s === "B") adp++;
            if (s === "C") pre++;
          });
        });

        const summary = document.getElementById("instinto-panel-summary");
        if (summary) {
          summary.innerHTML = `
            <span>Sucesso: <strong>${suc}</strong></span>
            <span>Adaptação: <strong>${adp}</strong></span>
            <span>Pressão: <strong>${pre}</strong></span>`;
        }

        const resultsBox = document.getElementById("instinto-panel-results");
        if (resultsBox) {
          resultsBox.classList.remove("hidden");
        }

        const rollEntry = {
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          formula: `Instinto: ${inst1} + ${inst2} (${notationString})`,
          results, keptDiceIndexes: keptIndexes, maxKeep: maxKeep,
          healthLvl: char ? getCurrentHealthLevel(char) : 6
        };
        if (!char.rollHistory) char.rollHistory = [];
        char.rollHistory.push(rollEntry);
        if (char.rollHistory.length > 20) char.rollHistory.shift();
        saveCurrentCharacter();
        document.dispatchEvent(new CustomEvent('render-chat-history'));
        return;
      }

      const box = state.diceBox || window.diceBox;
      if (!box) { alert("Motor 3D carregando..."); return; }

      btnPanelAgir.disabled = true;
      btnPanelAgir.textContent = "Rolando...";
      el.diceOverlay.classList.remove("hidden");
      setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 50);

      box.setDice(notationString);
      box.start_throw(null, (notation) => {
        setTimeout(() => { el.diceOverlay.classList.add("hidden"); }, 3000);
        if (!notation.result || notation.result.length === 0 || notation.result[0] < 0) {
          alert("Os dados saíram da mesa! Tente novamente.");
          btnPanelAgir.disabled = false;
          btnPanelAgir.textContent = "REALIZAR ROLAGEM ASSIMILADA";
          return;
        }

        const results = notation.result.map(val => ({
          value: val, sides: 12, symbols: DICE_MAP["d12"][val] || []
        }));
        let maxKeep = 2;
        if (el.modEmpenhoAss && el.modEmpenhoAss.checked) maxKeep++;
        if (el.modOrigemOcupacaoAss && el.modOrigemOcupacaoAss.checked) maxKeep++;
        if (el.modOrigemEventoAss && el.modOrigemEventoAss.checked) maxKeep++;

        const keptIndexes = [...results.map((d, i) => ({ ...d, i }))]
          .sort((a, b) => b.value - a.value).slice(0, maxKeep).map(d => d.i);

        const container = document.getElementById("instinto-panel-dice-container");
        if (container) {
          container.innerHTML = "";
          results.forEach((die, idx) => {
            const card = document.createElement("div");
            card.className = `result-die-card ${keptIndexes.includes(idx) ? "kept" : ""}`;
            const imgSrc = getDieFaceImgSrc(12, die.value);
            card.innerHTML = imgSrc
              ? `<img src="${imgSrc}" class="die-face-img" alt="d12">`
              : `<span class="die-type-tag d-12">d12</span><span class="die-val-label">${die.value}</span><div class="die-symbol-svg">${getDieSymbolsHtml(die.symbols)}</div>`;
            container.appendChild(card);
          });
        }

        let suc = 0, adp = 0, pre = 0;
        keptIndexes.forEach(idx => {
          results[idx].symbols.forEach(s => {
            if (s === "A") suc++;
            if (s === "B") adp++;
            if (s === "C") pre++;
          });
        });

        const summary = document.getElementById("instinto-panel-summary");
        if (summary) {
          summary.innerHTML = `
            <span>Sucesso: <strong>${suc}</strong></span>
            <span>Adaptação: <strong>${adp}</strong></span>
            <span>Pressão: <strong>${pre}</strong></span>`;
        }

        const resultsBox = document.getElementById("instinto-panel-results");
        if (resultsBox) {
          resultsBox.classList.remove("hidden");
        }

        const rollEntry = {
          timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          formula: `Instinto: ${inst1} + ${inst2} (${notationString})`,
          results, keptDiceIndexes: keptIndexes, maxKeep: maxKeep,
          healthLvl: char ? getCurrentHealthLevel(char) : 6
        };
        if (!char.rollHistory) char.rollHistory = [];
        char.rollHistory.push(rollEntry);
        if (char.rollHistory.length > 20) char.rollHistory.shift();
        saveCurrentCharacter();
        document.dispatchEvent(new CustomEvent('render-chat-history'));
        btnPanelAgir.textContent = "Rolagem Assimilada";
        btnPanelAgir.disabled = false;
        logger.info(`Agir por Instinto: Suc ${suc}, Adp ${adp}, Pre ${pre}`);
      });
    };
    
    btnPanelAgir.removeEventListener("click", btnPanelAgir._onClick);
    btnPanelAgir._onClick = runRoll;
    btnPanelAgir.addEventListener("click", runRoll);
  }
}
