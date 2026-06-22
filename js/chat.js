import { el, state, saveCurrentCharacter } from "./state.js";
import { ICONS } from "../icons.js";
import { logger } from "./logger.js";
import { getCurrentHealthLevel } from "./health.js";

// ==========================================
// CHAT E HISTÓRICO DE RESULTADOS PERSISTIDO
// ==========================================

export function getActiveRollElements() {
  const activeMsg = document.querySelector(".chat-message.active-roll");
  if (!activeMsg) return {};
  return {
    resultsDiceContainer: activeMsg.querySelector(".results-dice-grid"),
    sumSucessos: activeMsg.querySelector(".sum-sucessos"),
    sumAdaptacoes: activeMsg.querySelector(".sum-adaptacoes"),
    sumPressoes: activeMsg.querySelector(".sum-pressoes"),
    rollNarrativeFeedback: activeMsg.querySelector(".roll-narrative"),
    maxKeepCount: activeMsg.querySelector(".max-keep-count")
  };
}

export function appendRollToChat(formula) {
  logger.info(`Chat: Adicionando mensagem de rolagem da fórmula: "${formula}"`);
  
  let maxKeep = 1;
  if (el.modEmpenho.checked) maxKeep++;
  if (el.modOrigemOcupacao.checked) maxKeep++;
  if (el.modOrigemEvento.checked) maxKeep++;
  if (state.selectedRoll.agirPorInstinto) maxKeep++;
  
  const rollEntry = {
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    formula: formula,
    maxKeep: maxKeep,
    results: JSON.parse(JSON.stringify(state.activeRollResults)),
    keptDiceIndexes: JSON.parse(JSON.stringify(state.keptDiceIndexes))
  };
  
  if (state.currentCharacter) {
    if (!state.currentCharacter.rollHistory) {
      state.currentCharacter.rollHistory = [];
    }
    state.currentCharacter.rollHistory.push(rollEntry);
    if (state.currentCharacter.rollHistory.length > 20) {
      state.currentCharacter.rollHistory.shift();
    }
    saveCurrentCharacter();
  } else {
    if (!state.tempRollHistory) {
      state.tempRollHistory = [];
    }
    state.tempRollHistory.push(rollEntry);
    if (state.tempRollHistory.length > 20) {
      state.tempRollHistory.shift();
    }
  }
  
  renderChatHistory();
}

export function renderChatHistory() {
  const container = el.rollChatMessages;
  if (!container) return;
  
  container.innerHTML = "";
  
  const char = state.currentCharacter;
  const history = char ? (char.rollHistory || []) : (state.tempRollHistory || []);
  
  if (history.length === 0) {
    container.innerHTML = `<div class="chat-placeholder">Nenhuma rolagem realizada nesta sessão.</div>`;
    return;
  }
  
  history.forEach((roll, rollIdx) => {
    const isLast = rollIdx === history.length - 1;
    const msg = document.createElement("div");
    msg.className = `chat-message ${isLast ? 'active-roll' : ''}`;
    
    const charName = char ? char.name : "Infectado";
    
    // Build dice cards HTML
    let diceHtml = "";
    roll.results.forEach((die, index) => {
      const isKept = roll.keptDiceIndexes.includes(index);
      const imgSrc = getDieFaceImgSrc(die.sides, die.value);
      let contentHtml = "";
      if (imgSrc) {
        contentHtml = `<img src="${imgSrc}" class="die-face-img" alt="d${die.sides} face ${die.value}">`;
      } else {
        contentHtml = `
          <span class="die-type-tag d-${die.sides}">d${die.sides}</span>
          <span class="die-val-label">${die.value}</span>
          <div class="die-symbol-svg">
            ${getDieSymbolsHtml(die.symbols)}
          </div>
        `;
      }
      diceHtml += `
        <div class="result-die-card ${isKept ? 'kept' : ''}" data-die-index="${index}" data-roll-idx="${rollIdx}" style="${isLast ? 'cursor: pointer;' : 'cursor: default; pointer-events: none; opacity: 0.85;'}">
          ${contentHtml}
        </div>
      `;
    });
    
    // Calculate final counts for this roll
    let sucessos = 0;
    let adaptacoes = 0;
    let pressoes = 0;
    
    roll.keptDiceIndexes.forEach(index => {
      const die = roll.results[index];
      if (die) {
        die.symbols.forEach(sym => {
          if (sym === "A") sucessos++;
          if (sym === "B") adaptacoes++;
          if (sym === "C") pressoes++;
        });
      }
    });
    
    // Calculate health penalties dynamically
    let penalidadeA = 0;
    let penalidadeB = 0;
    let healthLvlName = "Saudável";
    const healthLvl = char ? getCurrentHealthLevel(char) : 6;
    if (healthLvl === 4 || healthLvl === 3) {
      penalidadeA = 1;
      healthLvlName = healthLvl === 4 ? "Laceração" : "Ferimentos";
    } else if (healthLvl === 2) {
      penalidadeA = 2;
      healthLvlName = "Debilitação";
    } else if (healthLvl === 1) {
      penalidadeB = 2;
      healthLvlName = "Incapacitação";
    }
    
    const finalSucessos = Math.max(0, sucessos - penalidadeA);
    const finalAdaptacoes = Math.max(0, adaptacoes - penalidadeB);
    
    let sucessosHtml = finalSucessos;
    if (penalidadeA > 0) {
      sucessosHtml = `${finalSucessos} <span class="penalty-tag" title="Penalidade de -${penalidadeA} [A] por ${healthLvlName}">(-${penalidadeA})</span>`;
    }
    
    let adaptacoesHtml = finalAdaptacoes;
    if (penalidadeB > 0) {
      adaptacoesHtml = `${finalAdaptacoes} <span class="penalty-tag" title="Penalidade de -${penalidadeB} [B] por ${healthLvlName}">(-${penalidadeB})</span>`;
    }
    
    let narrativeText = "";
    if (finalSucessos > 0) {
      narrativeText += `<strong>${finalSucessos} Sucesso(s)</strong> `;
    } else {
      narrativeText += `<strong>Fracasso:</strong> Sem sucessos. `;
    }
    
    if (finalAdaptacoes > 0) {
      narrativeText += `Obteve <strong>${finalAdaptacoes} Adaptação</strong>. `;
    }
    
    if (pressoes > 0) {
      narrativeText += `Sofreu <strong>${pressoes} Pressão</strong>. `;
    }
    
    if (healthLvl === 4 || healthLvl === 3) {
      narrativeText += `<div class="roll-health-warning health-warning-orange">⚠️ <strong>Penalidade de Saúde (${healthLvlName}):</strong> -1 Sucesso [A] aplicado.</div>`;
    } else if (healthLvl === 2) {
      narrativeText += `<div class="roll-health-warning health-warning-red">⚠️ <strong>Penalidade de Saúde (Debilitação):</strong> -2 Sucessos [A] aplicados. Incapaz de agir sem gastar 1 Determinação.</div>`;
    } else if (healthLvl === 1) {
      narrativeText += `<div class="roll-health-warning health-warning-darkred">⚠️ <strong>Penalidade de Saúde (Incapacitação):</strong> Personagem em coma. Conversa exige 1 Determinação/rodada. Ação exige +2 B.</div>`;
    }
    
    msg.innerHTML = `
      <div class="chat-message-header">
        <span class="char-name">${charName}</span>
        <span class="roll-time">${roll.timestamp}</span>
      </div>
      <div class="chat-message-body">
        <div class="roll-formula"><strong>${roll.formula}</strong> (Manter: <span class="max-keep-count">${roll.maxKeep}</span>)</div>
        <div class="results-dice-grid">
          ${diceHtml}
        </div>
        <div class="roll-summary-inline">
          <span>Sucesso: <strong class="sum-sucessos">${sucessosHtml}</strong></span>
          <span>Adaptação: <strong class="sum-adaptacoes">${adaptacoesHtml}</strong></span>
          <span>Pressão: <strong class="sum-pressoes">${pressoes}</strong></span>
        </div>
        <div class="roll-narrative">${narrativeText}</div>
      </div>
    `;
    
    // Add click listeners to dice cards of the active roll
    if (isLast) {
      msg.querySelectorAll(".result-die-card").forEach(card => {
        card.addEventListener("click", () => {
          const dieIdx = parseInt(card.getAttribute("data-die-index"));
          toggleKeepDie(dieIdx);
        });
      });
    }
    
    container.appendChild(msg);
  });
  
  // Auto scroll to bottom
  container.scrollTop = container.scrollHeight;
}

export function renderResultsPanel() {
  renderChatHistory();
}

export function updateResultsSummary() {
  renderChatHistory();
}

// Retorna representação HTML do conjunto de símbolos da face do dado
export function getDieSymbolsHtml(symbols) {
  if (symbols.length === 0) {
    return `<span style="font-size: var(--font-size-xs); color: var(--text-muted);">Vazio</span>`;
  }
  
  return symbols.map(sym => {
    if (sym === "A") return ICONS.sucesso;
    if (sym === "B") return ICONS.adaptacao;
    if (sym === "C") return ICONS.pressao;
    return "";
  }).join("");
}

export function toggleKeepDie(index) {
  logger.info(`Chat: Alterando seleção do dado mantido no painel (Índice clicado: ${index})`);
  
  const char = state.currentCharacter;
  const history = char ? (char.rollHistory || []) : (state.tempRollHistory || []);
  if (history.length === 0) return;
  
  const lastRoll = history[history.length - 1];
  const maxKeep = lastRoll.maxKeep;
  const isCurrentlyKept = state.keptDiceIndexes.includes(index);
  
  if (isCurrentlyKept) {
    if (state.keptDiceIndexes.length > 1) {
      state.keptDiceIndexes = state.keptDiceIndexes.filter(i => i !== index);
    }
  } else {
    if (state.keptDiceIndexes.length < maxKeep) {
      state.keptDiceIndexes.push(index);
    } else {
      if (maxKeep === 1) {
        state.keptDiceIndexes = [index];
      } else {
        state.keptDiceIndexes.shift();
        state.keptDiceIndexes.push(index);
      }
    }
  }
  
  // Sync the roll entry kept indices
  lastRoll.keptDiceIndexes = [...state.keptDiceIndexes];
  if (char) {
    saveCurrentCharacter();
  }
  
  renderChatHistory();
}

export function getDieFaceImgSrc(sides, value) {
  if (sides === 6) {
    if (value === 1 || value === 2) return "d6/1 ou 2 (D6).webp";
    if (value === 3 || value === 4) return "d6/3 ou 4 (D6).webp";
    if (value === 5) return "d6/5 (D6).webp";
    if (value === 6) return "d6/6 (D6).webp";
  } else if (sides === 10) {
    if (value === 1 || value === 2) return "d10/1 ou 2 (D10).webp";
    if (value === 3 || value === 4) return "d10/3 ou 4 (D10).webp";
    if (value === 5) return "d10/5 (D10).webp";
    if (value === 6) return "d10/6 (D10).webp";
    if (value === 7) return "d10/7 (D10).webp";
    if (value === 8) return "d10/8 (D10).webp";
    if (value === 9) return "d10/9 (D10).webp";
    if (value === 10) return "d10/10 (D10).webp";
  } else if (sides === 12) {
    if (value === 1 || value === 2) return "d12/1 ou 2 (D12).webp";
    if (value === 3 || value === 4) return "d12/3 ou 4 (D12).webp";
    if (value === 5) return "d12/5 (D12).webp";
    if (value === 6) return "d12/6 (D12).webp";
    if (value === 7) return "d12/7 (D12).webp";
    if (value === 8) return "d12/8 (D12).webp";
    if (value === 9) return "d12/9 (D12).webp";
    if (value === 10) return "d12/10 (D12).webp";
    if (value === 11) return "d12/11 (D12).webp";
    if (value === 12) return "d12/12 (D12).webp";
  }
  return null;
}

export function clearChatHistory() {
  logger.info("Chat: Limpando histórico de rolagens.");
  if (state.currentCharacter) {
    state.currentCharacter.rollHistory = [];
    saveCurrentCharacter();
  } else {
    state.tempRollHistory = [];
  }
  renderChatHistory();
}
