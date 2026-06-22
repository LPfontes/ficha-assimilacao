import { el, state, saveCurrentCharacter, loadCharacter } from "./state.js";
import { CARACTERISTICAS } from "../data.js";
import { ICONS } from "../icons.js";
import { selectRollAptitude, updateDiceDrawerUI } from "./roller.js";
import { logger } from "./logger.js";
import { updateResultsSummary } from "./chat.js";
import { getCurrentHealthLevel } from "./health.js";
export { getCurrentHealthLevel } from "./health.js";

// ==========================================
// RENDERS DA FICHA INTERATIVA
// ==========================================
export function renderAptitudesSheet() {
  const char = state.currentCharacter;
  if (!char) return;
  
  logger.debug("Renderizando aptidões na ficha...");
  // Renders de Instintos
  el.instinctsListSheet.innerHTML = "";
  Object.keys(char.instintos).forEach(name => {
    const val = char.instintos[name];
    const row = document.createElement("div");
    row.className = "aptitude-item";
    if (state.selectedRoll.instinto === name) row.classList.add("selected-for-roll");
    
    let bubblesHtml = "";
    for (let i = 1; i <= 4; i++) {
      bubblesHtml += `<span class="bubble bubble-instinct ${i <= val ? 'filled' : ''}"></span>`;
    }
    
    row.innerHTML = `
      <span class="name">${name}</span>
      <div class="value-bubbles">${bubblesHtml}</div>
    `;
    
    row.addEventListener("click", () => {
      selectRollAptitude("instinto", name, val);
    });
    
    el.instinctsListSheet.appendChild(row);
  });

  // Renders de Conhecimentos
  el.conhecimentosListSheet.innerHTML = "";
  Object.keys(char.conhecimentos).forEach(name => {
    const val = char.conhecimentos[name];
    const row = document.createElement("div");
    row.className = "aptitude-item";
    if (state.selectedRoll.skill === name) row.classList.add("selected-for-roll");
    
    let bubblesHtml = "";
    for (let i = 1; i <= 5; i++) {
      bubblesHtml += `<span class="bubble bubble-conhecimento ${i <= val ? 'filled' : ''}"></span>`;
    }
    
    row.innerHTML = `
      <span class="name">${name}</span>
      <div class="value-bubbles">${bubblesHtml}</div>
    `;
    
    row.addEventListener("click", () => {
      selectRollAptitude("skill", name, val);
    });
    
    el.conhecimentosListSheet.appendChild(row);
  });

  // Renders de Práticas
  el.praticasListSheet.innerHTML = "";
  Object.keys(char.praticas).forEach(name => {
    const val = char.praticas[name];
    const row = document.createElement("div");
    row.className = "aptitude-item";
    if (state.selectedRoll.skill === name) row.classList.add("selected-for-roll");
    
    let bubblesHtml = "";
    for (let i = 1; i <= 5; i++) {
      bubblesHtml += `<span class="bubble bubble-pratica ${i <= val ? 'filled' : ''}"></span>`;
    }
    
    row.innerHTML = `
      <span class="name">${name}</span>
      <div class="value-bubbles">${bubblesHtml}</div>
    `;
    
    row.addEventListener("click", () => {
      selectRollAptitude("skill", name, val);
    });
    
    el.praticasListSheet.appendChild(row);
  });
}


export function renderHealthSheet() {
  const char = state.currentCharacter;
  if (!char) return;
  
  const maxPts = 1 + char.instintos.Potência + char.instintos.Resolução;
  
  // Hide health formula or update it dynamically
  const formulaInfo = document.querySelector(".health-formula-info");
  if (formulaInfo) {
    formulaInfo.textContent = `(${maxPts} Caixas por Nível)`;
  }
  
  el.healthLevelsSheet.innerHTML = "";
  
  const levels = [
    { key: "6", name: "6. Saudável", desc: "Plenamente funcional, sem modificadores" },
    { key: "5", name: "5. Escoriação", desc: "Plenamente funcional, sem modificadores" },
    { key: "4", name: "4. Laceração", desc: "Penalidade de -1 A (Sucesso) em todos os testes" },
    { key: "3", name: "3. Ferimentos", desc: "Penalidade de -1 A (Sucesso) em todos os testes" },
    { key: "2", name: "2. Debilitação", desc: "Penalidade de -2 A. Incapaz de agir sem gastar 1 Determinação" },
    { key: "1", name: "1. Incapacitação", desc: "Coma. Gasta 1 Determinação/rodada para falar. Ação: +2 B" }
  ];
  
  if (!char.dano) {
    char.dano = { 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  }
  
  const activeLvl = getCurrentHealthLevel(char);
  const lvlInfo = levels.find(l => parseInt(l.key) === activeLvl);
  
  const row = document.createElement("div");
  row.className = "health-level-row active";
  row.setAttribute("data-level", lvlInfo.key);
  
  let dropsHtml = "";
  const activeDano = char.dano[lvlInfo.key] || 0;
  
  for (let i = 1; i <= maxPts; i++) {
    const isFilled = i <= (maxPts - activeDano);
    dropsHtml += `
      <span class="health-drop ${isFilled ? 'filled' : ''}" data-index="${i}">
        ${ICONS.saude}
      </span>
    `;
  }
  
  row.innerHTML = `
    <div class="health-level-label">
      <div style="display: flex; align-items: center; gap: 8px;">
        <button class="btn-health-lvl-adjust" id="btn-health-lvl-prev" title="Subir Nível (Curar)" ${activeLvl === 6 ? 'disabled' : ''}>▲</button>
        <span class="name">${lvlInfo.name}</span>
        <button class="btn-health-lvl-adjust" id="btn-health-lvl-next" title="Descer Nível (Dano)" ${activeLvl === 1 && activeDano === maxPts ? 'disabled' : ''}>▼</button>
      </div>
    </div>
    <div class="health-drops" style="display: flex; align-items: center; gap: 6px;">
      <button class="btn-health-pts-adjust" id="btn-health-pts-dec" title="Perder Vida (-)" ${activeLvl === 1 && activeDano === maxPts ? 'disabled' : ''}>-</button>
      ${dropsHtml}
      <button class="btn-health-pts-adjust" id="btn-health-pts-inc" title="Ganhar Vida (+)" ${activeLvl === 6 && activeDano === 0 ? 'disabled' : ''}>+</button>
      <input type="text" id="input-health-adjust" class="health-adjust-input" placeholder="±x" title="Digite +1 ou -1 e pressione Enter para alterar a vida">
    </div>
    <span class="desc">${lvlInfo.desc}</span>
  `;
  
  const inputAdjust = row.querySelector("#input-health-adjust");
  if (inputAdjust) {
    inputAdjust.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const valStr = inputAdjust.value.trim();
        const value = parseInt(valStr);
        if (!isNaN(value) && value !== 0) {
          const totalHealth = activeLvl * maxPts - activeDano;
          const newTotalHealth = Math.max(0, Math.min(6 * maxPts, totalHealth + value));
          
          if (newTotalHealth === 0) {
            for (let lvl = 1; lvl <= 6; lvl++) {
              char.dano[lvl] = maxPts;
            }
          } else {
            const L = Math.ceil(newTotalHealth / maxPts);
            for (let lvl = 1; lvl <= 6; lvl++) {
              if (lvl > L) {
                char.dano[lvl] = maxPts;
              } else if (lvl < L) {
                char.dano[lvl] = 0;
              } else {
                char.dano[lvl] = L * maxPts - newTotalHealth;
              }
            }
          }
          
          saveCurrentCharacter();
          renderHealthSheet();
          
          try {
            updateDiceDrawerUI();
          } catch (err) {
            logger.error("Erro ao atualizar pós-ajuste de vida por input:", err);
          }
        } else {
          inputAdjust.value = "";
        }
      }
    });
  }
  
  row.querySelectorAll(".health-drop").forEach(drop => {
    drop.addEventListener("click", () => {
      const index = parseInt(drop.getAttribute("data-index"));
      const currentDano = char.dano[lvlInfo.key] || 0;
      const currentHealth = maxPts - currentDano;
      
      let newHealth;
      if (currentHealth === index) {
        newHealth = index - 1;
      } else {
        newHealth = index;
      }
      
      const newDano = maxPts - newHealth;
      char.dano[lvlInfo.key] = newDano;
      
      // If we completely filled this level with damage (0 health remaining), we transition to the next level down (if any)
      if (newDano === maxPts && activeLvl > 1) {
        char.dano[activeLvl - 1] = 0;
      }
      
      saveCurrentCharacter();
      renderHealthSheet();
      
      try {
        updateDiceDrawerUI();
      } catch (e) {
        logger.error("Erro ao atualizar rolagem ativa pós-dano:", e);
      }
    });
  });
  
  const btnPrev = row.querySelector("#btn-health-lvl-prev");
  const btnNext = row.querySelector("#btn-health-lvl-next");
  
  btnPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    if (activeLvl < 6) {
      char.dano[activeLvl] = 0;
      char.dano[activeLvl + 1] = maxPts - 1;
      saveCurrentCharacter();
      renderHealthSheet();
      
      try {
        updateDiceDrawerUI();
      } catch (err) {
        logger.error("Erro ao atualizar pós-ajuste de nível:", err);
      }
    }
  });
  
  btnNext.addEventListener("click", (e) => {
    e.stopPropagation();
    char.dano[activeLvl] = maxPts;
    if (activeLvl > 1) {
      char.dano[activeLvl - 1] = 0;
    }
    saveCurrentCharacter();
    renderHealthSheet();
    
    try {
      updateDiceDrawerUI();
    } catch (err) {
      logger.error("Erro ao atualizar pós-ajuste de nível:", err);
    }
  });

  const btnPtsDec = row.querySelector("#btn-health-pts-dec");
  const btnPtsInc = row.querySelector("#btn-health-pts-inc");

  if (btnPtsDec) {
    btnPtsDec.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentDano = char.dano[lvlInfo.key] || 0;
      if (currentDano < maxPts) {
        const newDano = currentDano + 1;
        char.dano[lvlInfo.key] = newDano;
        
        // If we completely filled this level with damage, transition to the level below
        if (newDano === maxPts && activeLvl > 1) {
          char.dano[activeLvl - 1] = 0;
        }
        
        saveCurrentCharacter();
        renderHealthSheet();
        
        try {
          updateDiceDrawerUI();
        } catch (err) {
          logger.error("Erro ao atualizar pós-dano por botão:", err);
        }
      }
    });
  }

  if (btnPtsInc) {
    btnPtsInc.addEventListener("click", (e) => {
      e.stopPropagation();
      const currentDano = char.dano[lvlInfo.key] || 0;
      if (currentDano > 0) {
        char.dano[lvlInfo.key] = currentDano - 1;
        saveCurrentCharacter();
        renderHealthSheet();
        
        try {
          updateDiceDrawerUI();
        } catch (err) {
          logger.error("Erro ao atualizar pós-cura por botão:", err);
        }
      } else if (activeLvl < 6) {
        // Transition to level above (fully healthy on active, so heal into level above)
        char.dano[activeLvl] = 0;
        char.dano[activeLvl + 1] = maxPts - 1;
        saveCurrentCharacter();
        renderHealthSheet();
        
        try {
          updateDiceDrawerUI();
        } catch (err) {
          logger.error("Erro ao atualizar pós-cura nível acima por botão:", err);
        }
      }
    });
  }
  
  el.healthLevelsSheet.appendChild(row);
}

export function renderCaboGuerraSheet() {
  const char = state.currentCharacter;
  if (!char) return;
  
  if (el.sheetDetLevel) el.sheetDetLevel.textContent = char.detNivel;
  if (el.sheetAssLevel) el.sheetAssLevel.textContent = char.assNivel;
  
  const ratio = (char.detNivel / 10) * 100;
  if (el.caboRatioFill) {
    el.caboRatioFill.style.height = `${100 - ratio}%`;
  }
  
  // Renderiza a sequência de símbolos de Determinação (exatamente detNivel de símbolos)
  if (el.sheetDetPoints) {
    el.sheetDetPoints.innerHTML = "";
    for (let i = 1; i <= char.detNivel; i++) {
      const isFilled = i <= char.detPoints;
      
      const point = document.createElement("span");
      point.className = `cabo-point ${isFilled ? 'filled' : ''}`;
      point.innerHTML = ICONS.determinacao;
      
      point.addEventListener("click", () => {
        if (isFilled && char.detPoints === i) {
          char.detPoints = i - 1;
        } else {
          char.detPoints = i;
        }
        saveCurrentCharacter();
        renderCaboGuerraSheet();
      });
      el.sheetDetPoints.appendChild(point);
    }
  }

  // Renderiza a sequência de símbolos de Assimilação (exatamente assNivel de símbolos)
  if (el.sheetAssPoints) {
    el.sheetAssPoints.innerHTML = "";
    for (let i = 1; i <= char.assNivel; i++) {
      const isFilled = i <= char.assPoints;
      
      const point = document.createElement("span");
      point.className = `cabo-point ${isFilled ? 'filled' : ''}`;
      point.innerHTML = ICONS.determinacao;
      
      point.addEventListener("click", () => {
        if (isFilled && char.assPoints === i) {
          char.assPoints = i - 1;
        } else {
          char.assPoints = i;
        }
        saveCurrentCharacter();
        renderCaboGuerraSheet();
      });
      el.sheetAssPoints.appendChild(point);
    }
  }
  
  if (char.detPoints === 0) {
    if (el.suscetivelAlert) el.suscetivelAlert.classList.remove("hidden");
  } else {
    if (el.suscetivelAlert) el.suscetivelAlert.classList.add("hidden");
  }
}

export function renderCharacteristicsSheet() {
  const char = state.currentCharacter;
  if (!char) return;
  
  el.traitsListSheet.innerHTML = "";
  if (char.caracteristicas.length === 0) {
    el.traitsListSheet.innerHTML = `<div style="color:var(--text-muted); font-size:13px; grid-column:1/-1;">Nenhuma característica adquirida com Experiência.</div>`;
    return;
  }
  
  char.caracteristicas.forEach(traitId => {
    const trait = CARACTERISTICAS.find(c => c.id === traitId);
    if (!trait) return;
    
    const card = document.createElement("div");
    card.className = "trait-sheet-card";
    card.innerHTML = `
      <div style="flex:1;">
        <div class="name">${trait.nome} <span style="font-size:10px; color:var(--text-secondary);">(${trait.custo} XP)</span></div>
        <div class="desc">${trait.descricao}</div>
      </div>
      <button class="btn-delete-trait" data-id="${trait.id}" title="Remover Característica e recuperar XP">
        ${ICONS.trash}
      </button>
    `;
    
    card.querySelector(".btn-delete-trait").addEventListener("click", () => {
      if (confirm(`Remover característica ${trait.nome}? Você recuperará os ${trait.custo} XP correspondentes.`)) {
        char.caracteristicas = char.caracteristicas.filter(id => id !== traitId);
        char.xp += trait.custo;
        saveCurrentCharacter();
        loadCharacter(char.id);
      }
    });
    
    el.traitsListSheet.appendChild(card);
  });
}

export function renderMutationsSheet() {
  const char = state.currentCharacter;
  if (!char) return;
  
  const container = document.getElementById("mutations-list-sheet");
  if (!container) return;
  container.innerHTML = "";
  
  const suitLabels = {
    evolutivas: "Evolutiva (F)",
    adaptativas: "Adaptativa (G)",
    inoportunas: "Inoportuna (H)",
    singulares: "Singular (I)"
  };
  
  if (!char.mutações || char.mutações.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted); font-size:13px; padding:8px;">Nenhuma mutação adquirida.</div>`;
    return;
  }
  
  char.mutações.forEach(mut => {
    const row = document.createElement("div");
    row.className = `mutation-sheet-item suit-${mut.suit}`;
    row.innerHTML = `
      <div style="flex:1;">
        <div class="title" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-weight: bold;">${mut.name}</span>
          <span class="mutation-badge suit-tag-${mut.suit}">${suitLabels[mut.suit] || mut.suit}</span>
          <span style="font-size:10px; color:var(--text-muted);">(${mut.cost})</span>
        </div>
        <div class="desc" style="margin-top: 4px;">${mut.desc}</div>
      </div>
      <button class="btn-remove-mutation" title="Remover mutação" style="font-size: var(--font-size-md); margin-left: 8px;">
        &times;
      </button>
    `;
    
    row.querySelector(".btn-remove-mutation").addEventListener("click", () => {
      if (confirm(`Remover mutação ${mut.name}?`)) {
        char.mutações = char.mutações.filter(m => !(m.suit === mut.suit && m.name === mut.name));
        saveCurrentCharacter();
        renderMutationsSheet();
      }
    });
    
    container.appendChild(row);
  });
}

export function renderInventorySheet() {
  const char = state.currentCharacter;
  if (!char) return;
  
  el.inventoryListSheet.innerHTML = "";
  
  if (!char.inventario || char.inventario.length !== 10) {
    char.inventario = Array(10).fill(null).map(() => ({ name: "", qualidade: false, escassez: false }));
    saveCurrentCharacter();
  }
  
  char.inventario.forEach((slot, i) => {
    const row = document.createElement("div");
    row.className = "inventory-slot";
    
    row.innerHTML = `
      <span class="slot-num">${i + 1}</span>
      <input type="text" class="item-name" value="${slot.name || ''}" placeholder="Vazio">
      <div class="item-props">
        <label class="prop-checkbox prop-q" data-label="Qualidade">
          <input type="checkbox" class="chk-q" ${slot.qualidade ? 'checked' : ''}>
          <span class="checkmark"></span>
        </label>
        <label class="prop-checkbox prop-e" data-label="Escassez">
          <input type="checkbox" class="chk-e" ${slot.escassez ? 'checked' : ''}>
          <span class="checkmark"></span>
        </label>
      </div>
    `;
    
    const inputName = row.querySelector(".item-name");
    const chkQ = row.querySelector(".chk-q");
    const chkE = row.querySelector(".chk-e");
    
    const saveSlot = () => {
      char.inventario[i] = {
        name: inputName.value,
        qualidade: chkQ.checked,
        escassez: chkE.checked
      };
      saveCurrentCharacter();
    };
    
    inputName.addEventListener("input", saveSlot);
    chkQ.addEventListener("change", saveSlot);
    chkE.addEventListener("change", saveSlot);
    
    el.inventoryListSheet.appendChild(row);
  });
}

export function adjustCaboGuerraLevels(changeDet) {
  const char = state.currentCharacter;
  if (!char) return;
  
  const newDet = char.detNivel + changeDet;
  if (newDet >= 1 && newDet <= 9) {
    char.detNivel = newDet;
    char.assNivel = 10 - newDet;
    
    // Ajusta os pontos se necessário
    if (char.detPoints > char.detNivel) char.detPoints = char.detNivel;
    if (char.assPoints > char.assNivel) char.assPoints = char.assNivel;
    
    saveCurrentCharacter();
    renderCaboGuerraSheet();
  }
}

export function executeAssimilacaoAvanco() {
  const char = state.currentCharacter;
  if (!char) return;
  
  if (char.detPoints === 0) {
    if (char.detNivel > 1) {
      char.detNivel -= 1;
      char.assNivel += 1;
      char.detPoints = char.detNivel; // Restabelece Determinação ao novo máximo
      
      saveCurrentCharacter();
      renderCaboGuerraSheet();
      alert(`A infecção avançou! Determinação Máxima agora é Nível ${char.detNivel} e Assimilação Máxima é Nível ${char.assNivel}. Seus pontos de Determinação foram restaurados.`);
    } else {
      alert("Sua Determinação já está no nível mínimo (1). A infecção não pode avançar mais sem que o controle seja totalmente perdido!");
    }
  }
}

export function restoreDeterminacao() {
  const char = state.currentCharacter;
  if (!char) return;
  char.detPoints = char.detNivel;
  saveCurrentCharacter();
  renderCaboGuerraSheet();
}

