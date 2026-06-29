import { el, state, saveCurrentCharacter, loadCharacter, getCustomTraits, getCustomMutations, saveCustomTraits, saveCustomMutations } from "./state.js";
import { worldState, saveItemToDb } from "./world-state.js";
import { CARACTERISTICAS } from "./characteristics.js";
import { ASSIMILACOES } from "./assimilations.js";
import { ICONS } from "../icons.js";
import { selectRollAptitude, updateDiceDrawerUI } from "./roller.js";
import { logger } from "./logger.js";
import { esc } from "./screen-utils.js";
import { updateResultsSummary } from "./chat.js";
import { getCurrentHealthLevel } from "./health.js";
export { getCurrentHealthLevel } from "./health.js";

export const ITEM_CATEGORIAS = {
  nenhuma: {
    nome: "Nenhuma (Comum)",
    cat: 0,
    desc: "Equipamento comum sem características especiais."
  },
  artefato: {
    nome: "Artefato",
    cat: "Especial",
    desc: "Equipamentos especiais que possuem propriedades únicas e oferecem características ou vantagens além do comum, ajudando os Infectados em sua jornada e tornando suas ações mais eficazes ou estratégicas."
  },
  fragil: {
    nome: "Frágil",
    cat: -1,
    desc: "Característica de Categoria -1. Cai de nível de Qualidade com 1 Pressão a menos; nível 1 se torna Quebrado no próximo uso."
  },
  improvisado: {
    nome: "Improvisado",
    cat: -1,
    desc: "Característica de Categoria -1. Feito com materiais reaproveitados; testes têm –1 Sucesso, que pode ser cancelado investindo uma Adaptação."
  },
  pesado: {
    nome: "Pesado",
    cat: -1,
    desc: "Característica de Categoria -1. Reduz a mobilidade, cancelando 1 Sucesso em testes de movimento ou furtividade; ocupa 2 espaços de inventário."
  },
  uso_unico: {
    nome: "Uso Único",
    cat: -1,
    desc: "Característica de Categoria -1. Funciona apenas uma vez; após o uso, o item quebra ou se esgota completamente."
  },
  agil: {
    nome: "Ágil",
    cat: 1,
    desc: "Característica de Categoria 1. Arma branca balanceada; em ataques substitui Potência por Reação."
  },
  discreto: {
    nome: "Discreto",
    cat: 1,
    desc: "Característica de Categoria 1. Item pequeno ou retrátil, fácil de esconder; não ocupa espaço de inventário e passa despercebido enquanto guardado."
  },
  espacoso: {
    nome: "Espaçoso",
    cat: 1,
    desc: "Característica de Categoria 1. Aumenta em +2 os espaços de Inventário; efeitos podem ser acumulados ao comprar a característica mais de uma vez."
  },
  iluminador: {
    nome: "Iluminador",
    cat: 1,
    desc: "Característica de Categoria 1. Projeta luz proporcional ao nível de qualidade (6 m por nível). Pode perder um nível de qualidade com uso prolongado, com aviso do(a) Assimilador(a); tocha simples ilumina 6 m."
  },
  letal: {
    nome: "Letal",
    cat: 1,
    desc: "Característica de Categoria 1. Arma capaz de causar ferimentos graves. Uma vez por dia, permite trocar uma Adaptação por um Sucesso; uso extra concede +1 Sucesso, mas reduz 1 nível de Qualidade."
  },
  protetivo: {
    nome: "Protetivo",
    cat: 1,
    desc: "Característica de Categoria 1. Permite evitar a perda de 1 Ponto de Saúde uma vez por cena; uso extra é possível sacrificando 1 nível de Qualidade."
  },
  restaurador: {
    nome: "Restaurador",
    cat: 1,
    desc: "Característica de Categoria 1. Alimentos, bebidas ou remédios com 6 usos; cada uso alimenta um personagem por um dia e concede 1 Ponto de Saúde na próxima Recuperação, sem acumular efeitos no mesmo repouso."
  },
  eficiente: {
    nome: "Eficiente",
    cat: 2,
    desc: "Característica de Categoria 2. Item prático e ergonômico; uma vez por dia, permite trocar 1d6 por 1d10 em um teste. Uso extra no mesmo dia reduz 1 nível de Qualidade."
  },
  duravel: {
    nome: "Durável",
    cat: 2,
    desc: "Característica de Categoria 2. Itens reforçados para resistir ao desgaste; requer uma Pressão adicional para reduzir 1 nível de Qualidade."
  },
  adrenalina: {
    nome: "Adrenalina",
    cat: 3,
    desc: "Característica de Categoria 3. Canetas ou injeções que aumentam temporariamente a resistência à dor e cansaço. Cada uso concede 6 Pontos de Saúde até o próximo repouso. Usos adicionais exigem teste de Resolução + Atletismo: sucesso mantém os 6 pontos, falha causa perda de 8 pontos. Após o repouso, cada uso reduz 1 ponto de Determinação."
  },
  armadura: {
    nome: "Armadura",
    cat: 3,
    desc: "Característica de Categoria 3. Veste de proteção que absorve ferimentos. Permite até 3 usos por cena para evitar a perda de 1 Ponto de Saúde por uso. Quando os 3 usos são consumidos na mesma cena, a armadura perde 1 nível de Qualidade."
  },
  explosivo: {
    nome: "Explosivo",
    cat: 4,
    desc: "Característica de Categoria 4. Item projetado para detonação. Ao ser usado, pode ser destruído para causar 4d6 de dano em uma área, atingindo criaturas e estruturas. Sempre possui Uso Único e não acumula pontos de Categoria."
  },
  inflamavel: {
    nome: "Inflamável",
    cat: 4,
    desc: "Característica de Categoria 4. Item capaz de gerar fogo. Pode reduzir 1 nível de Qualidade para incendiar uma área, causando 3d6 de dano de queimadura. Alvos devem investir um Sucesso e uma Adaptação ou recebem 2d6 adicionais no final do turno."
  },
  medicinal: {
    nome: "Medicinal",
    cat: 4,
    desc: "Característica de Categoria 4. Itens médicos ou medicamentosos com 6 usos; cada uso cancela 1 Pressão em testes de Tratamento Médico, limitado à graduação em Medicina. Itens de Uso Único podem cancelar até 2 Pressões em um teste."
  }
};

// ==========================================
// RENDERS DA FICHA INTERATIVA
// ==========================================

let dragSourceIndex = -1;

export function renderAptitudesSheet() {
  const char = state.currentCharacter;
  if (!char) return;

  logger.debug("Renderizando aptidões na ficha...");

  // Helper para atualizar valores das aptidões quando clica na bolha
  const updateAptitudeValue = (type, categoryKey, name, newValue) => {
    char[categoryKey][name] = newValue;

    // Sincroniza com a seleção de rolagens ativa
    if (type === "instinto" && state.selectedRoll.instinto === name) {
      if (state.selectedRoll.agirPorInstinto) {
        state.selectedRoll.d12 = newValue;
      } else {
        state.selectedRoll.d6 = newValue;
      }
    } else if (type === "skill" && state.selectedRoll.skill === name) {
      state.selectedRoll.d10 = newValue;
    }

    saveCurrentCharacter();
    renderAptitudesSheet();

    // Se mudou Potência ou Resolução, recalcula Saúde
    if (name === "Potência" || name === "Resolução") {
      renderHealthSheet();
    }

    import("./roller.js").then(({ updateDiceDrawerUI }) => updateDiceDrawerUI());
  };

  // Renders de Instintos
  el.instinctsListSheet.innerHTML = "";
  const instinctsCard = el.instinctsListSheet.closest(".aptitude-column-card");
  const instinctsLocked = instinctsCard ? instinctsCard.classList.contains("locked") : true;

  Object.keys(char.instintos).forEach(name => {
    const val = char.instintos[name];
    const row = document.createElement("div");
    row.className = "aptitude-item";
    if (state.selectedRoll.instinto === name) row.classList.add("selected-for-roll");

    if (!instinctsLocked) {
      row.innerHTML = `
        <span class="name">${name}</span>
        <div style="display:flex; align-items:center; gap:6px;">
          <button class="btn-bubble-dec" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:18px; height:18px; display:flex; align-items:center; justify-content:center; border-radius:3px; cursor:pointer; font-size:12px; padding:0; user-select:none;">-</button>
          <div class="value-bubbles"></div>
          <button class="btn-bubble-inc" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:18px; height:18px; display:flex; align-items:center; justify-content:center; border-radius:3px; cursor:pointer; font-size:12px; padding:0; user-select:none;">+</button>
        </div>
      `;
    } else {
      row.innerHTML = `
        <span class="name">${name}</span>
        <div class="value-bubbles"></div>
      `;
    }

    const bubblesContainer = row.querySelector(".value-bubbles");
    const maxBubbles = char.maxValueBubbles || 5;
    const numBubbles = Math.max(maxBubbles, val);
    for (let i = 1; i <= numBubbles; i++) {
      const bubble = document.createElement("span");
      bubble.className = `bubble bubble-instinct ${i <= val ? 'filled' : ''}`;

      bubble.addEventListener("click", (e) => {
        e.stopPropagation(); // Impede selecionar para rolagem
        if (instinctsLocked) return;
        const newValue = val === i ? i - 1 : i;
        updateAptitudeValue("instinto", "instintos", name, Math.max(1, newValue));
      });
      bubblesContainer.appendChild(bubble);
    }

    if (!instinctsLocked) {
      row.querySelector(".btn-bubble-dec").addEventListener("click", (e) => {
        e.stopPropagation();
        updateAptitudeValue("instinto", "instintos", name, Math.max(1, val - 1));
      });
      row.querySelector(".btn-bubble-inc").addEventListener("click", (e) => {
        e.stopPropagation();
        updateAptitudeValue("instinto", "instintos", name, Math.min(10, val + 1));
      });
    }

    row.addEventListener("click", () => {
      selectRollAptitude("instinto", name, char.instintos[name]);
    });

    el.instinctsListSheet.appendChild(row);
  });

  // Renders de Conhecimentos
  el.conhecimentosListSheet.innerHTML = "";
  const conhecimentosCard = el.conhecimentosListSheet.closest(".aptitude-column-card");
  const conhecimentosLocked = conhecimentosCard ? conhecimentosCard.classList.contains("locked") : true;

  Object.keys(char.conhecimentos).forEach(name => {
    const val = char.conhecimentos[name];
    const row = document.createElement("div");
    row.className = "aptitude-item";
    if (state.selectedRoll.skill === name) row.classList.add("selected-for-roll");

    if (!conhecimentosLocked) {
      row.innerHTML = `
        <span class="name">${name}</span>
        <div style="display:flex; align-items:center; gap:6px;">
          <button class="btn-bubble-dec" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:18px; height:18px; display:flex; align-items:center; justify-content:center; border-radius:3px; cursor:pointer; font-size:12px; padding:0; user-select:none;">-</button>
          <div class="value-bubbles"></div>
          <button class="btn-bubble-inc" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:18px; height:18px; display:flex; align-items:center; justify-content:center; border-radius:3px; cursor:pointer; font-size:12px; padding:0; user-select:none;">+</button>
        </div>
      `;
    } else {
      row.innerHTML = `
        <span class="name">${name}</span>
        <div class="value-bubbles"></div>
      `;
    }

    const bubblesContainer = row.querySelector(".value-bubbles");
    const maxBubbles = char.maxValueBubbles || 5;
    const numBubbles = Math.max(maxBubbles, val);
    for (let i = 1; i <= numBubbles; i++) {
      const bubble = document.createElement("span");
      bubble.className = `bubble bubble-conhecimento ${i <= val ? 'filled' : ''}`;

      bubble.addEventListener("click", (e) => {
        e.stopPropagation();
        if (conhecimentosLocked) return;
        const newValue = val === i ? i - 1 : i;
        updateAptitudeValue("skill", "conhecimentos", name, newValue);
      });
      bubblesContainer.appendChild(bubble);
    }

    if (!conhecimentosLocked) {
      row.querySelector(".btn-bubble-dec").addEventListener("click", (e) => {
        e.stopPropagation();
        updateAptitudeValue("skill", "conhecimentos", name, Math.max(0, val - 1));
      });
      row.querySelector(".btn-bubble-inc").addEventListener("click", (e) => {
        e.stopPropagation();
        updateAptitudeValue("skill", "conhecimentos", name, Math.min(10, val + 1));
      });
    }

    row.addEventListener("click", () => {
      selectRollAptitude("skill", name, char.conhecimentos[name]);
    });

    el.conhecimentosListSheet.appendChild(row);
  });

  // Renders de Práticas
  el.praticasListSheet.innerHTML = "";
  const praticasCard = el.praticasListSheet.closest(".aptitude-column-card");
  const praticasLocked = praticasCard ? praticasCard.classList.contains("locked") : true;

  Object.keys(char.praticas).forEach(name => {
    const val = char.praticas[name];
    const row = document.createElement("div");
    row.className = "aptitude-item";
    if (state.selectedRoll.skill === name) row.classList.add("selected-for-roll");

    if (!praticasLocked) {
      row.innerHTML = `
        <span class="name">${name}</span>
        <div style="display:flex; align-items:center; gap:6px;">
          <button class="btn-bubble-dec" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:18px; height:18px; display:flex; align-items:center; justify-content:center; border-radius:3px; cursor:pointer; font-size:12px; padding:0; user-select:none;">-</button>
          <div class="value-bubbles"></div>
          <button class="btn-bubble-inc" style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:var(--text-secondary); width:18px; height:18px; display:flex; align-items:center; justify-content:center; border-radius:3px; cursor:pointer; font-size:12px; padding:0; user-select:none;">+</button>
        </div>
      `;
    } else {
      row.innerHTML = `
        <span class="name">${name}</span>
        <div class="value-bubbles"></div>
      `;
    }

    const bubblesContainer = row.querySelector(".value-bubbles");
    const maxBubbles = char.maxValueBubbles || 5;
    const numBubbles = Math.max(maxBubbles, val);
    for (let i = 1; i <= numBubbles; i++) {
      const bubble = document.createElement("span");
      bubble.className = `bubble bubble-pratica ${i <= val ? 'filled' : ''}`;

      bubble.addEventListener("click", (e) => {
        e.stopPropagation();
        if (praticasLocked) return;
        const newValue = val === i ? i - 1 : i;
        updateAptitudeValue("skill", "praticas", name, newValue);
      });
      bubblesContainer.appendChild(bubble);
    }

    if (!praticasLocked) {
      row.querySelector(".btn-bubble-dec").addEventListener("click", (e) => {
        e.stopPropagation();
        updateAptitudeValue("skill", "praticas", name, Math.max(0, val - 1));
      });
      row.querySelector(".btn-bubble-inc").addEventListener("click", (e) => {
        e.stopPropagation();
        updateAptitudeValue("skill", "praticas", name, Math.min(10, val + 1));
      });
    }

    row.addEventListener("click", () => {
      selectRollAptitude("skill", name, char.praticas[name]);
    });

    el.praticasListSheet.appendChild(row);
  });
}


export function renderHealthSheet() {
  const char = state.currentCharacter;
  if (!char) return;

  if (char.saudeMod === undefined) char.saudeMod = 0;

  const basePts = 1 + char.instintos.Potência + char.instintos.Resolução;
  const maxPts = Math.max(1, basePts + char.saudeMod);

  if (el.valSaudeMod) el.valSaudeMod.textContent = char.saudeMod;

  // Hide health formula or update it dynamically
  const formulaInfo = document.querySelector(".health-formula-info");
  if (formulaInfo) {
    let saudeModText = char.saudeMod !== 0 ? ` ${char.saudeMod >= 0 ? '+' : ''}${char.saudeMod}` : "";
    formulaInfo.textContent = `(${basePts}${saudeModText} Caixas por Nível)`;
  }

  el.healthLevelsSheet.innerHTML = "";

  const levels = [
    { key: "6", name: "6. Saudável", desc: "Plenamente funcional." },
    { key: "5", name: "5. Escoriação", desc: "Apenas arranhões ou cortes leves." },
    { key: "4", name: "4. Laceração", desc: "Penalidade: -1 Sucesso nos testes.<br>Ignore gastando 1 Determinação ou 1 Adaptação na rolagem." },
    { key: "3", name: "3. Ferimentos", desc: "Penalidade: -1 Sucesso nos testes.<br>Ignore gastando 1 Determinação ou 1 Adaptação na rolagem." },
    { key: "2", name: "2. Debilitação", desc: "Custa 1 Determinação para agir (mantém penalidade de -2 Sucessos).<br>Ignore a penalidade de Sucessos gastando 1 Adaptação na rolagem. Requer tratamento." },
    { key: "1", name: "1. Incapacitação", desc: "Crítico. Gaste 1 Determinação/rodada para falar/manter consciência (sem Ação).<br>Para agir: +1 Determinação e exige 2 Adaptações na rolagem para ter sucesso. Requer tratamento." }
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

  const totalMax = 6 * maxPts;
  let totalCurrent = 0;
  for (let lvl = 1; lvl <= 6; lvl++) {
    totalCurrent += maxPts - (char.dano[lvl] || 0);
  }

  row.innerHTML = `
    <div class="health-total-label">
      <span>Vida Total: <strong id="vida-total-value">${totalCurrent}</strong> / <strong id="vida-max-value">${totalMax}</strong></span>
    </div>
    <div class="health-level-label">
      <div style="display: flex; align-items: center; gap: 8px;">
        <button type="button" class="btn-health-lvl-adjust" id="btn-health-lvl-prev" title="Subir Nível (Curar)" ${activeLvl === 6 ? 'disabled' : ''}>▲</button>
        <span class="name">${lvlInfo.name}</span>
        <button type="button" class="btn-health-lvl-adjust" id="btn-health-lvl-next" title="Descer Nível (Dano)" ${activeLvl === 1 && activeDano === maxPts ? 'disabled' : ''}>▼</button>
      </div>
    </div>
    <div class="health-drops" style="display: flex; align-items: center; gap: 6px;">
      <button type="button" class="btn-health-pts-adjust" id="btn-health-pts-dec" title="Perder Vida (-)" ${activeLvl === 1 && activeDano === maxPts ? 'disabled' : ''}>-</button>
      <div style="display: grid; grid-template-columns: repeat(6, auto); gap: 4px;">
        ${dropsHtml}
      </div>
      <button type="button" class="btn-health-pts-adjust" id="btn-health-pts-inc" title="Ganhar Vida (+)" ${activeLvl === 6 && activeDano === 0 ? 'disabled' : ''}>+</button>
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
    e.preventDefault();
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
    e.preventDefault();
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
      e.preventDefault();
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
      e.preventDefault();
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

  // Renderiza a sequência  Ponto de Saúdeímbolos de Determinação (exatamente detNivel  Ponto de Saúdeímbolos)
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

  // Renderiza a sequência  Ponto de Saúdeímbolos de Assimilação (exatamente assNivel  Ponto de Saúdeímbolos)
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

  if (char.detNivel === 0) {
    if (el.suscetivelAlert) el.suscetivelAlert.classList.add("hidden");
    if (el.assimilacaoTotalAlert) el.assimilacaoTotalAlert.classList.remove("hidden");
  } else if (char.detPoints === 0) {
    if (el.suscetivelAlert) el.suscetivelAlert.classList.remove("hidden");
    if (el.assimilacaoTotalAlert) el.assimilacaoTotalAlert.classList.add("hidden");
  } else {
    if (el.suscetivelAlert) el.suscetivelAlert.classList.add("hidden");
    if (el.assimilacaoTotalAlert) el.assimilacaoTotalAlert.classList.add("hidden");
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

  const customTraits = getCustomTraits();

  char.caracteristicas.forEach(traitId => {
    const trait = CARACTERISTICAS.find(c => c.id === traitId) || customTraits.find(c => c.id === traitId);
    if (!trait) return;

    const card = document.createElement("div");
    card.className = "trait-sheet-card";
    card.innerHTML = `
      <div style="flex:1;">
        <div class="name">${trait.nome}  <span style="font-size:10px; color:var(--text-secondary);"> (${trait.custo} XP)</span></div>
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

  // Renderizar pontos de assimilação (Sucesso, Adaptação, Pressão)
  const pointsContainer = document.getElementById("sheet-assimilation-points");
  if (pointsContainer) {
    if (char.ptsA === undefined) char.ptsA = 1;
    if (char.ptsB === undefined) char.ptsB = 0;
    if (char.ptsC === undefined) char.ptsC = 2;

    pointsContainer.innerHTML = `
      <div class="ass-point-badge success-badge">
        <span class="badge-label">Sucesso [S]:</span>
        <button class="btn-point-adjust dec-a">-</button>
        <span class="badge-val">${char.ptsA}</span>
        <button class="btn-point-adjust inc-a">+</button>
      </div>
      <div class="ass-point-badge adaptation-badge">
        <span class="badge-label">Adaptação [A]:</span>
        <button class="btn-point-adjust dec-b">-</button>
        <span class="badge-val">${char.ptsB}</span>
        <button class="btn-point-adjust inc-b">+</button>
      </div>
      <div class="ass-point-badge pressure-badge">
        <span class="badge-label">Pressão [P]:</span>
        <button class="btn-point-adjust dec-c">-</button>
        <span class="badge-val">${char.ptsC}</span>
        <button class="btn-point-adjust inc-c">+</button>
      </div>
    `;

    // Listeners
    pointsContainer.querySelector(".dec-a").addEventListener("click", () => {
      if (char.ptsA > 0) { char.ptsA--; saveCurrentCharacter(); renderMutationsSheet(); }
    });
    pointsContainer.querySelector(".inc-a").addEventListener("click", () => {
      char.ptsA++; saveCurrentCharacter(); renderMutationsSheet();
    });
    pointsContainer.querySelector(".dec-b").addEventListener("click", () => {
      if (char.ptsB > 0) { char.ptsB--; saveCurrentCharacter(); renderMutationsSheet(); }
    });
    pointsContainer.querySelector(".inc-b").addEventListener("click", () => {
      char.ptsB++; saveCurrentCharacter(); renderMutationsSheet();
    });
    pointsContainer.querySelector(".dec-c").addEventListener("click", () => {
      if (char.ptsC > 0) { char.ptsC--; saveCurrentCharacter(); renderMutationsSheet(); }
    });
    pointsContainer.querySelector(".inc-c").addEventListener("click", () => {
      char.ptsC++; saveCurrentCharacter(); renderMutationsSheet();
    });
  }

  const container = document.getElementById("mutations-list-sheet");
  if (!container) return;
  container.innerHTML = "";

  const suitLabels = {
    evolutivas: "Evolutiva ",
    adaptativas: "Adaptativa",
    inoportunas: "Inoportuna",
    singulares: "Singular"
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
        char.mutações = char.mutações.filter(m => {
          if (m.id && mut.id) {
            return m.id !== mut.id;
          }
          return !(m.suit === mut.suit && m.name === mut.name);
        });
        saveCurrentCharacter();
        renderMutationsSheet();
      }
    });

    container.appendChild(row);
  });
}

function openItemCategoriesModal(slotIndex) {
  const char = state.currentCharacter;
  if (!char) return;

  const slot = char.inventario[slotIndex];
  if (!slot) return;

  const currentCats = slot.categorias || (slot.categoria && slot.categoria !== 'nenhuma' ? [slot.categoria] : []);

  el.modalContainer.classList.remove("hidden");
  el.modalBody.innerHTML = `
    <h3 class="modal-title" style="margin-bottom:8px;">Gerenciar Categorias do Item</h3>
    <p style="font-size:13px; color:var(--text-secondary); margin-bottom:12px;">
      <strong>${esc(slot.name)}</strong>
    </p>
    <div style="display:flex; flex-direction:column; gap:6px; max-height:400px; overflow-y:auto;">
      ${Object.entries(ITEM_CATEGORIAS).map(([key, cat]) => {
        const checked = currentCats.includes(key) ? 'checked' : '';
        return `
          <label style="display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:4px; background:rgba(255,255,255,0.03); cursor:pointer; transition:background 0.2s;">
            <input type="checkbox" class="cat-checkbox" value="${key}" ${checked} style="accent-color:var(--color-gold-glow);">
            <div style="display:flex; flex-direction:column; gap:2px;">
              <span style="font-size:12px; font-weight:bold; color:var(--color-gold-glow);">${cat.nome}</span>
              <span style="font-size:10px; color:var(--text-secondary);">${cat.desc}</span>
            </div>
          </label>
        `;
      }).join("")}
    </div>
    <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:16px;">
      <button id="btn-cancel-cat-modal" class="btn" style="padding:8px 16px;">Cancelar</button>
      <button id="btn-confirm-cat-modal" class="btn btn-success" style="padding:8px 16px;">Salvar</button>
    </div>
  `;

  const closeModal = () => el.modalContainer.classList.add("hidden");

  document.getElementById("btn-cancel-cat-modal").addEventListener("click", closeModal, { once: true });
  document.getElementById("btn-confirm-cat-modal").addEventListener("click", () => {
    const checkedBoxes = el.modalBody.querySelectorAll(".cat-checkbox:checked");
    const selected = Array.from(checkedBoxes).map(cb => cb.value);
    slot.categorias = selected;
    slot.categoria = selected.length > 0 ? selected[selected.length - 1] : 'nenhuma';
    saveCurrentCharacter();
    renderInventorySheet();
    closeModal();
  }, { once: true });

  const closeBtn = el.modalContainer.querySelector(".modal-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal, { once: true });
  }

  el.modalContainer.addEventListener("click", (e) => {
    if (e.target === el.modalContainer) closeModal();
  }, { once: true });
}

export function renderInventorySheet() {
  const char = state.currentCharacter;
  if (!char) return;

  if (el.inventoryBodyList) el.inventoryBodyList.innerHTML = "";
  if (el.inventoryBackpackList) el.inventoryBackpackList.innerHTML = "";

  // Create or update shared items datalist
  let datalist = document.getElementById("itens-db-list");
  if (!datalist) {
    datalist = document.createElement("datalist");
    datalist.id = "itens-db-list";
    document.body.appendChild(datalist);
  }
  datalist.innerHTML = (worldState.itensDb || []).map(it => `<option value="${esc(it.name)}">`).join("");

  if (char.bodySlotsCount === undefined) char.bodySlotsCount = 3;
  if (char.backpackSlotsCount === undefined) char.backpackSlotsCount = 6;
  const expectedLength = char.bodySlotsCount + char.backpackSlotsCount;

  if (!char.inventario || char.inventario.length !== expectedLength) {
    const oldInv = char.inventario || [];
    char.inventario = Array(expectedLength).fill(null).map((_, idx) => {
      const oldItem = oldInv[idx] || {};
      let qual = 3; // Padrão
      if (typeof oldItem.qualidade === 'boolean') {
        qual = oldItem.qualidade ? 4 : 3;
      } else if (typeof oldItem.qualidade === 'number') {
        qual = oldItem.qualidade;
      }

      let esc = 2; // Comum
      if (typeof oldItem.escassez === 'boolean') {
        esc = oldItem.escassez ? 3 : 2;
      } else if (typeof oldItem.escassez === 'number') {
        esc = oldItem.escassez;
      }

      return {
        name: oldItem.name || "",
        qualidade: qual,
        pressao: oldItem.pressao || 0,
        escassez: esc,
        categoria: oldItem.categoria || "nenhuma",
        efeito: oldItem.efeito || ""
      };
    });
    saveCurrentCharacter();
  }

  const labelBody = document.getElementById("label-body-slots");
  const labelBackpack = document.getElementById("label-backpack-slots");
  if (labelBody) {
    labelBody.textContent = `No Corpo`;
  }
  if (labelBackpack) {
    labelBackpack.textContent = `Na Mochila`;
  }

  char.inventario.forEach((slot, i) => {
    const row = document.createElement("div");
    row.className = "inventory-slot";
    row.draggable = true;
    row.dataset.index = i;

    const isBody = i < char.bodySlotsCount;
    const slotDisplayNum = isBody ? i + 1 : i - char.bodySlotsCount + 1;

    let qual = typeof slot.qualidade === 'number' ? slot.qualidade : (slot.qualidade ? 4 : 3);
    let pressao = typeof slot.pressao === 'number' ? slot.pressao : 0;
    let esc = typeof slot.escassez === 'number' ? slot.escassez : (slot.escassez ? 3 : 2);
    let slotCats = slot.categorias || (slot.categoria && slot.categoria !== 'nenhuma' ? [slot.categoria] : []);
    if (!slot.categorias) {
      slot.categorias = slotCats;
    }

    row.innerHTML = `
      <div class="inventory-item-header">
        <span class="slot-num" title="${isBody ? 'Espaço no Corpo' : 'Espaço na Mochila'}" style="color: ${isBody ? 'var(--color-blue-glow)' : 'var(--text-muted)'}; font-weight: bold; font-family: var(--font-heading);">${slotDisplayNum}</span>
        <input type="text" class="item-name" value="${slot.name || ''}" placeholder="Vazio" style="width: 100%;" list="itens-db-list">
        <div class="item-category-badges-container" style="display: flex; gap: 4px; flex-wrap: wrap; margin-left: 6px;">
          ${slotCats.map(catKey => {
            const cat = ITEM_CATEGORIAS[catKey];
            if (!cat) return '';
            return `
              <span class="item-category-badge" style="font-size: 8px; padding: 2px 4px; border-radius: 4px; font-weight: bold; text-transform: uppercase; background: rgba(255, 165, 0, 0.1); border: 1px solid rgba(255, 165, 0, 0.35); color: var(--color-gold-glow); white-space: nowrap;">
                ${cat.nome}
              </span>
            `;
          }).join('')}
        </div>
      </div>
      
      <div class="item-props-redesign" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
        
        <div class="row" style="display: flex; flex-direction: row; gap: 4px;">  
          <!-- Qualidade -->
            <div class="prop-select-wrapper" title="Qualidade do Equipamento">
              <select class="select-qualidade" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(0,255,102,0.2); color: var(--text-primary); font-size: 11px; padding: 2px 4px; border-radius: 4px; outline: none; cursor: pointer;">
                <option value="0" ${qual === 0 ? 'selected' : ''}>Q0: Quebrado</option>
                <option value="1" ${qual === 1 ? 'selected' : ''}>Q1: Defeituoso</option>
                <option value="2" ${qual === 2 ? 'selected' : ''}>Q2: Comprometido</option>
                <option value="3" ${qual === 3 ? 'selected' : ''}>Q3: Padrão</option>
                <option value="4" ${qual === 4 ? 'selected' : ''}>Q4: Reforçado</option>
                <option value="5" ${qual === 5 ? 'selected' : ''}>Q5: Superior</option>
                <option value="6" ${qual === 6 ? 'selected' : ''}>Q6: Obra-Prima</option>
              </select>
            </div>
 
            <!-- C Investidas -->
            <div class="prop-c-wrapper" title="Pressões" style="display: flex; align-items: center; gap: 4px;">
              <span style="color: var(--color-rust-glow); font-size: 11px; font-weight: bold;">Desgate:</span>
              <select class="select-pressao" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(141,36,40,0.3); color: var(--text-primary); font-size: 11px; padding: 2px 4px; border-radius: 4px; outline: none; width: 40px; cursor: pointer;">
                <option value="0" ${pressao === 0 ? 'selected' : ''}>0</option>
                <option value="1" ${pressao === 1 ? 'selected' : ''}>1</option>
                <option value="2" ${pressao === 2 ? 'selected' : ''}>2</option>
                <option value="3" ${pressao === 3 ? 'selected' : ''}>3</option>
                <option value="4" ${pressao === 4 ? 'selected' : ''}>4</option>
                <option value="5" ${pressao === 5 ? 'selected' : ''}>5</option>
                <option value="6" ${pressao === 6 ? 'selected' : ''}>6</option>
              </select>
            </div>
          </div>
            <div class="row" style="display: flex; flex-direction: row; gap: 6px; align-items: center;">
              <!-- Escassez -->
              <div class="prop-select-wrapper" title="Nível de Escassez">
                <select class="select-escassez" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(0,162,255,0.2); color: var(--text-primary); font-size: 11px; padding: 2px 4px; border-radius: 4px; outline: none; cursor: pointer;">
                  <option value="0" ${esc === 0 ? 'selected' : ''}>E0: Abundante</option>
                  <option value="1" ${esc === 1 ? 'selected' : ''}>E1: Corriqueiro</option>
                  <option value="2" ${esc === 2 ? 'selected' : ''}>E2: Comum</option>
                  <option value="3" ${esc === 3 ? 'selected' : ''}>E3: Incomum</option>
                  <option value="4" ${esc === 4 ? 'selected' : ''}>E4: Atípico</option>
                  <option value="5" ${esc === 5 ? 'selected' : ''}>E5: Raro</option>
                  <option value="6" ${esc === 6 ? 'selected' : ''}>E6: Quase Extinto</option>
                </select>
            </div>
            <div class="prop-select-wrapper prop-categoria-wrapper">
              <button type="button" class="btn btn-sm btn-gerenciar-cat" data-slot="${i}" style="background: rgba(0,0,0,0.5); border: 1px solid rgba(255,165,0,0.25); color: var(--color-gold-glow); font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer; transition: background 0.2s;">
                ➕ Gerenciar Categorias
              </button>
            </div>
          
        </div>
        <div class="column" style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
        <!-- Efeito -->
            <div class="prop-effect-wrapper" title="Efeito ou Bônus do Item">
              <input type="text" class="item-effect" value="${slot.efeito || ''}" placeholder="Efeito / Descrição" style="background: rgba(0,0,0,0.5); border: 1px dashed rgba(255,255,255,0.25); color: var(--text-secondary); font-size: 11px; padding: 2px 6px; border-radius: 4px; outline: none; width: 300px; height: 50px;" title="Efeito do item">
            </div>
            <!-- Texto das Categorias -->
            <div class="category-descs-container" style="display: flex; flex-direction: column; gap: 4px; max-width: 300px; margin-top: 4px;">
              ${slotCats.map(catKey => {
                const cat = ITEM_CATEGORIAS[catKey];
                if (!cat) return '';
                return `
                  <span class="category-desc-text" data-cat-key="${catKey}" style="font-size: 10px; color: var(--color-gold-glow); opacity: 0.85; font-style: italic;">
                    <strong>${cat.nome}</strong>: ${cat.desc}
                  </span>
                `;
              }).join('')}
            </div>
        </div>
      </div>
      <button class="btn-delete-slot" title="Remover item deste espaço" type="button">
        ${ICONS.trash}
      </button>
    `;
 
    const inputName = row.querySelector(".item-name");
    const selQ = row.querySelector(".select-qualidade");
    const selP = row.querySelector(".select-pressao");
    const selE = row.querySelector(".select-escassez");
    const inputEffect = row.querySelector(".item-effect");

    const saveSlot = () => {
      char.inventario[i] = {
        name: inputName.value,
        qualidade: parseInt(selQ.value),
        pressao: parseInt(selP.value),
        escassez: parseInt(selE.value),
        categoria: slot.categoria || 'nenhuma',
        categorias: slot.categorias || [],
        efeito: inputEffect.value
      };
      saveCurrentCharacter();
      if (inputName.value.trim() !== "") {
        saveItemToDb(char.inventario[i]);
      }
    };
 
    inputName.addEventListener("input", saveSlot);
    inputName.addEventListener("change", () => {
      const typed = inputName.value.trim().toLowerCase();
      const dbItem = (worldState.itensDb || []).find(it => it.name.toLowerCase() === typed);
      if (dbItem) {
        selE.value = dbItem.escassez;
        inputEffect.value = dbItem.efeito;
        slot.categorias = dbItem.categorias || [];
        slot.categoria = dbItem.categoria || (dbItem.categorias && dbItem.categorias.length > 0 ? dbItem.categorias[dbItem.categorias.length - 1] : 'nenhuma');
        saveSlot();
        renderInventorySheet();
      } else {
        saveSlot();
      }
    });
    selQ.addEventListener("change", saveSlot);
    selP.addEventListener("change", saveSlot);
    selE.addEventListener("change", saveSlot);
    inputEffect.addEventListener("input", saveSlot);

    const btnGerenciarCat = row.querySelector(".btn-gerenciar-cat");
    if (btnGerenciarCat) {
      btnGerenciarCat.addEventListener("click", () => {
        openItemCategoriesModal(i);
      });
    }

    // Delete slot button
    const btnDelete = row.querySelector(".btn-delete-slot");
    btnDelete.addEventListener("click", (e) => {
      e.stopPropagation();
      // Remove o slot do array e ajusta o contador correspondente
      char.inventario.splice(i, 1);
      if (i < char.bodySlotsCount) {
        char.bodySlotsCount = Math.max(0, char.bodySlotsCount - 1);
      } else {
        char.backpackSlotsCount = Math.max(0, char.backpackSlotsCount - 1);
      }
      saveCurrentCharacter();
      renderInventorySheet();
    });

    // Drag & Drop handlers
    row.addEventListener("dragstart", (e) => {
      dragSourceIndex = i;
      row.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(i));
    });

    row.addEventListener("dragend", () => {
      dragSourceIndex = -1;
      row.classList.remove("dragging");
      document.querySelectorAll("#tab-inventario .inventory-slot").forEach(s => {
        s.classList.remove("drag-over", "drag-over-target");
      });
    });

    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    row.addEventListener("dragenter", (e) => {
      e.preventDefault();
      if (dragSourceIndex === i || dragSourceIndex === -1 || row.classList.contains("dragging")) return;
      row.classList.add("drag-over");
    });

    row.addEventListener("dragleave", () => {
      row.classList.remove("drag-over");
    });

    row.addEventListener("drop", (e) => {
      e.preventDefault();
      row.classList.remove("drag-over");

      const fromIdx = dragSourceIndex;
      if (fromIdx === -1 || fromIdx === i) return;

      // Swap items
      const temp = char.inventario[fromIdx];
      char.inventario[fromIdx] = char.inventario[i];
      char.inventario[i] = temp;

      saveCurrentCharacter();
      renderInventorySheet();
    });

    if (isBody) {
      if (el.inventoryBodyList) el.inventoryBodyList.appendChild(row);
    } else {
      if (el.inventoryBackpackList) el.inventoryBackpackList.appendChild(row);
    }
  });
}

export function adjustCaboGuerraLevels(changeDet) {
  const char = state.currentCharacter;
  if (!char) return;

  const newDet = char.detNivel + changeDet;
  if (newDet >= 0 && newDet <= 10) {
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
    if (char.detNivel > 0) {
      char.detNivel -= 1;
      char.assNivel += 1;
      char.detPoints = char.detNivel; // Restabelece Determinação ao novo máximo

      saveCurrentCharacter();
      renderCaboGuerraSheet();
      alert(`A infecção avançou! Determinação Máxima agora é Nível ${char.detNivel} e Assimilação Máxima é Nível ${char.assNivel}. Seus pontos de Determinação foram restaurados.`);
    } else {
      alert("Sua Determinação já está no nível mínimo (0). A infecção não pode avançar mais sem que o controle seja totalmente perdido!");
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

export function addBodySlot() {
  const char = state.currentCharacter;
  if (!char) return;

  if (char.bodySlotsCount === undefined) char.bodySlotsCount = 3;
  if (char.backpackSlotsCount === undefined) char.backpackSlotsCount = 6;

  const newItem = { name: "", qualidade: 3, pressao: 0, escassez: 2, efeito: "" };

  // Insert at index bodySlotsCount (after current body slots, before backpack slots)
  char.inventario.splice(char.bodySlotsCount, 0, newItem);
  char.bodySlotsCount++;

  saveCurrentCharacter();
  renderInventorySheet();
}

export function addBackpackSlot() {
  const char = state.currentCharacter;
  if (!char) return;

  if (char.bodySlotsCount === undefined) char.bodySlotsCount = 3;
  if (char.backpackSlotsCount === undefined) char.backpackSlotsCount = 6;

  const newItem = { name: "", qualidade: 3, pressao: 0, escassez: 2, efeito: "" };

  // Add at the end of backpack slots (end of inventario array)
  char.inventario.push(newItem);
  char.backpackSlotsCount++;

  saveCurrentCharacter();
  renderInventorySheet();
}

// ==========================================
// HOME BREW TAB
// ==========================================
export function renderHomebrewSheet() {
  const traitList = document.getElementById("homebrew-trait-list");
  const mutationList = document.getElementById("homebrew-mutation-list");
  if (!traitList || !mutationList) return;

  const customTraits = getCustomTraits();
  const customMutations = getCustomMutations();

  traitList.innerHTML = "";
  if (customTraits.length === 0) {
    traitList.innerHTML = `<div class="homebrew-empty">Nenhuma característica personalizada criada.</div>`;
  } else {
    customTraits.forEach(t => {
      const item = document.createElement("div");
      item.className = "homebrew-item";
      item.innerHTML = `
        <div class="homebrew-item-info">
          <div class="homebrew-item-title-row">
            <span class="homebrew-item-name">${esc(t.nome)}</span>
            <span class="homebrew-item-cost">${t.custo} XP</span>
          </div>
          <div class="homebrew-item-desc">${esc(t.descricao)}</div>
          ${t.requisitoText ? `<div class="homebrew-item-req">${esc(t.requisitoText)}</div>` : ""}
          <div class="homebrew-item-id">ID: ${t.id}</div>
        </div>
        <button class="btn btn-sm btn-danger homebrew-delete-trait" data-id="${t.id}" title="Remover">${ICONS.trash}</button>
      `;
      item.querySelector(".homebrew-delete-trait").addEventListener("click", () => {
        if (confirm(`Remover característica "${t.nome}" permanentemente?`)) {
          saveCustomTraits(customTraits.filter(x => x.id !== t.id));
          renderHomebrewSheet();
        }
      });
      traitList.appendChild(item);
    });
  }

  mutationList.innerHTML = "";
  if (customMutations.length === 0) {
    mutationList.innerHTML = `<div class="homebrew-empty">Nenhuma mutação personalizada criada.</div>`;
  } else {
    const suitLabels = { evolutivas: "Evolutiva", adaptativas: "Adaptativa", inoportunas: "Inoportuna", singulares: "Singular" };
    const suitColors = { evolutivas: "#00ff66", adaptativas: "#eab308", inoportunas: "#ef4444", singulares: "#a855f7" };

    customMutations.forEach(m => {
      const item = document.createElement("div");
      item.className = "homebrew-item";
      item.innerHTML = `
        <div class="homebrew-item-info">
          <div class="homebrew-item-title-row">
            <span class="homebrew-item-name">${esc(m.name)}</span>
            <span class="homebrew-mut-suit" style="color:${suitColors[m.suit] || '#888'};">${suitLabels[m.suit] || m.suit}</span>
            <span class="homebrew-item-cost">${esc(m.cost)}</span>
          </div>
          <div class="homebrew-item-desc">${esc(m.desc)}</div>
          ${m.req ? `<div class="homebrew-item-req">Nível de Assimilação ${m.req}+</div>` : ""}
          <div class="homebrew-item-id">ID: ${m.id}</div>
        </div>
        <button class="btn btn-sm btn-danger homebrew-delete-mutation" data-id="${m.id}" title="Remover">${ICONS.trash}</button>
      `;
      item.querySelector(".homebrew-delete-mutation").addEventListener("click", () => {
        if (confirm(`Remover mutação "${m.name}" permanentemente?`)) {
          saveCustomMutations(customMutations.filter(x => x.id !== m.id));
          renderHomebrewSheet();
        }
      });
      mutationList.appendChild(item);
    });
  }
}

export function renderSavedMacrosSheet() {
  const char = state.currentCharacter;
  if (!char) return;

  const listContainer = el.customRollsListSheet;
  if (!listContainer) return;

  listContainer.innerHTML = "";
  const savedRolls = char.savedRolls || [];

  if (savedRolls.length === 0) {
    listContainer.innerHTML = `<div style="font-size: var(--font-size-xs); color: var(--text-muted); text-align: center; padding: 12px; border: 1px dashed rgba(255,255,255,0.05); border-radius: var(--radius-md);">Nenhuma rolagem personalizada criada. Clique no botão "+" para começar.</div>`;
  } else {
    savedRolls.forEach(m => {
      const item = document.createElement("div");
      item.className = "custom-roll-item";

      // Build formula preview string
      let formulaParts = [];
      if (m.assimilada) {
        const val1 = char.instintos[m.instinto] || 0;
        const val2 = char.instintos[m.instinto2] || 0;
        formulaParts.push(`Assimilação [${m.instinto} (${val1}) + ${m.instinto2 || 'Nenhum'} (${val2})]`);
        if (m.d12Bonus > 0) {
          formulaParts.push(`+${m.d12Bonus}d12`);
        }
      } else {
        if (m.instinto) {
          const val = char.instintos[m.instinto] || 0;
          const bonusStr = m.instintoBonus >= 0 ? `+${m.instintoBonus}` : `${m.instintoBonus}`;
          formulaParts.push(`${m.instinto} (${val}${m.instintoBonus !== 0 ? bonusStr : ""})`);
        }
        if (m.skill) {
          const val = char.conhecimentos[m.skill] || char.praticas[m.skill] || 0;
          const bonusStr = m.skillBonus >= 0 ? `+${m.skillBonus}` : `${m.skillBonus}`;
          formulaParts.push(`${m.skill} (${val}${m.skillBonus !== 0 ? bonusStr : ""})`);
        }
        if (m.d12Bonus > 0) {
          formulaParts.push(`+${m.d12Bonus}d12`);
        }
      }
      if (m.bonusSuccesses !== 0) {
        const sign = m.bonusSuccesses > 0 ? "+" : "";
        formulaParts.push(`${sign}${m.bonusSuccesses} Sucesso(s)`);
      }
      if (m.bonusPressures !== 0) {
        const sign = m.bonusPressures > 0 ? "+" : "";
        formulaParts.push(`${sign}${m.bonusPressures} Pressão(ões)`);
      }
      if (m.bonusAdaptations !== 0) {
        const sign = m.bonusAdaptations > 0 ? "+" : "";
        formulaParts.push(`${sign}${m.bonusAdaptations} Adaptação(ões)`);
      }
      formulaParts.push(`mantém ${m.maxKeep}`);

      const formulaString = formulaParts.join(" + ").replace(" + mantém", " mantém").replace(" + -", " - ");
      const nameBadge = m.assimilada ? `<span class="mutation-badge suit-tag-singulares" style="font-size: 9px; padding: 1px 4px; margin-left: 6px; background: #00a2ff; color: #fff; border-radius: 4px; font-weight: bold; text-transform: uppercase;">Assimilada</span>` : "";

      item.innerHTML = `
        <div class="custom-roll-info" title="Clique para rolar">
          <div class="custom-roll-name-row">
            <span class="custom-roll-name">${esc(m.name)}${nameBadge}</span>
          </div>
          <span class="custom-roll-formula-preview">${esc(formulaString)}</span>
        </div>
        <div class="custom-roll-actions">
          <button class="btn btn-sm btn-edit-macro" title="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px; height:14px; display:inline-block; vertical-align:middle;">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
            </svg>
          </button>
          <button class="btn btn-sm btn-danger btn-delete-macro" title="Excluir">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px; height:14px; display:inline-block; vertical-align:middle;">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
      `;

      // Roll action click on info row
      item.querySelector(".custom-roll-info").addEventListener("click", () => {
        import("./roller.js").then(({ executeMacroRoll }) => executeMacroRoll(m));
      });

      // Edit macro click
      item.querySelector(".btn-edit-macro").addEventListener("click", (e) => {
        e.stopPropagation();
        import("./modals.js").then(({ openCustomRollModal }) => openCustomRollModal(m));
      });

      // Delete macro click
      item.querySelector(".btn-delete-macro").addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm(`Tem certeza de que deseja excluir a rolagem "${m.name}"?`)) {
          char.savedRolls = char.savedRolls.filter(x => x.id !== m.id);
          saveCurrentCharacter();
          renderSavedMacrosSheet();
        }
      });

      listContainer.appendChild(item);
    });
  }
}

