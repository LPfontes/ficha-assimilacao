import { el, state, loadCharacter, saveCurrentCharacter } from "./state.js";
import { CARACTERISTICAS } from "./characteristics.js";
import { ICONS } from "../icons.js";
import { logger } from "./logger.js";

// ==========================================
// ASSISTENTE DE CRIAÇÃO (WIZARD) - LOGICA
// ==========================================
export function startWizard() {
  logger.info("Iniciando assistente de criação de Infectado (Wizard).");
  state.wizardData = {
    step: 1,
    name: "",
    generation: "Pós-Colapso",
    ocupacao: "",
    evento: "",
    propP1: "",
    propP2: "",
    propCol: "",
    instintos: { Influência: 1, Percepção: 1, Potência: 1, Reação: 1, Resolução: 1, Sagacidade: 1 },
    conhecimentos: { Biologia: 0, Erudição: 0, Engenharia: 0, Geografia: 0, Medicina: 0, Segurança: 0 },
    praticas: { Armas: 0, Atletismo: 0, Expressão: 0, Furtividade: 0, Manufaturas: 0, Sobrevivência: 0 },
    detNivel: 9,
    assNivel: 1,
    xp: 7,
    caracteristicas: [],
    equipamentoPacote: ""
  };
  
  document.getElementById("wiz-name").value = "";
  document.getElementById("wiz-ocupacao").value = "";
  document.getElementById("wiz-evento").value = "";
  document.getElementById("wiz-prop-p1").value = "";
  document.getElementById("wiz-prop-p2").value = "";
  document.getElementById("wiz-prop-col").value = "";
  document.getElementById("wiz-det-slider").value = 1;
  
  el.wizardScreen.classList.remove("hidden");
  el.sheetScreen.classList.add("hidden");
  
  showWizardStep(1);
}

export function showWizardStep(step) {
  logger.info(`Wizard: Transição para o Passo ${step}.`);
  state.wizardData.step = step;
  
  document.querySelectorAll(".step-indicator").forEach(indicator => {
    const s = parseInt(indicator.getAttribute("data-step"));
    indicator.className = "step-indicator";
    if (s === step) indicator.classList.add("active");
    else if (s < step) indicator.classList.add("complete");
  });
  
  document.querySelectorAll(".wizard-step").forEach(stepEl => {
    stepEl.classList.remove("active");
    if (parseInt(stepEl.getAttribute("data-step")) === step) {
      stepEl.classList.add("active");
    }
  });
  
  if (step === 4) renderWizardInstincts();
  if (step === 5) renderWizardSkills();
  if (step === 6) updateWizardCaboValues();
  if (step === 7) renderWizardHealth();
  if (step === 8) renderWizardTraits();
  if (step === 9) renderWizardPackages();
  
  el.btnWizPrev.disabled = (step === 1);
  if (step === 9) {
    el.btnWizNext.classList.add("hidden");
    el.btnWizFinish.classList.remove("hidden");
  } else {
    el.btnWizNext.classList.remove("hidden");
    el.btnWizFinish.classList.add("hidden");
  }
}

export function wizardNextStep() {
  if (validateWizardStep(state.wizardData.step)) {
    showWizardStep(state.wizardData.step + 1);
  }
}

export function wizardPrevStep() {
  if (state.wizardData.step > 1) {
    showWizardStep(state.wizardData.step - 1);
  }
}

export function validateWizardStep(step) {
  if (step === 1) {
    const name = document.getElementById("wiz-name").value.trim();
    if (!name) {
      alert("Por favor, digite o nome do(a) Infectado(a).");
      return false;
    }
    state.wizardData.name = name;
    state.wizardData.generation = document.getElementById("wiz-generation").value;
  }
  
  if (step === 2) {
    const ocupacao = document.getElementById("wiz-ocupacao").value.trim();
    const evento = document.getElementById("wiz-evento").value.trim();
    if (!ocupacao || !evento) {
      alert("Defina a Ocupação e o Evento Marcante da personagem.");
      return false;
    }
    state.wizardData.ocupacao = ocupacao;
    state.wizardData.evento = evento;
  }
  
  if (step === 3) {
    const p1 = document.getElementById("wiz-prop-p1").value.trim();
    const p2 = document.getElementById("wiz-prop-p2").value.trim();
    const col = document.getElementById("wiz-prop-col").value.trim();
    if (!p1 || !p2 || !col) {
      alert("Preencha todos os três propósitos (2 Pessoais e 1 Coletivo).");
      return false;
    }
    state.wizardData.propP1 = p1;
    state.wizardData.propP2 = p2;
    state.wizardData.propCol = col;
  }
  
  if (step === 4) {
    const totalInstinctPoints = Object.values(state.wizardData.instintos).reduce((a, b) => a + b, 0);
    const added = totalInstinctPoints - 6;
    if (added !== 3) {
      alert(`Você precisa distribuir exatamente 3 pontos livres. Distribuídos: ${added}/3.`);
      return false;
    }
  }
  
  if (step === 5) {
    const totalSkills = Object.values(state.wizardData.conhecimentos).reduce((a, b) => a + b, 0) + 
                        Object.values(state.wizardData.praticas).reduce((a, b) => a + b, 0);
    if (totalSkills !== 7) {
      alert(`Você precisa distribuir exatamente 7 pontos entre Conhecimentos e Práticas. Distribuídos: ${totalSkills}/7.`);
      return false;
    }
  }

  if (step === 6) {
    const ass = parseInt(document.getElementById("wiz-det-slider").value);
    state.wizardData.assNivel = ass;
    state.wizardData.detNivel = 10 - ass;
  }
  
  if (step === 8) {
    if (state.wizardData.xp < 0) {
      logger.warn("Wizard: Validação do Passo 8 falhou: XP gasto excede o limite disponível.");
      alert("Você gastou mais pontos de Experiência (XP) do que os 7 disponíveis!");
      return false;
    }
  }
  
  logger.info(`Wizard: Passo ${step} validado com sucesso.`);
  return true;
}

export function renderWizardInstincts() {
  const container = document.querySelector(".instincts-grid");
  container.innerHTML = "";
  
  const instinctNames = ["Influência", "Percepção", "Potência", "Reação", "Resolução", "Sagacidade"];
  const currentTotal = Object.values(state.wizardData.instintos).reduce((a, b) => a + b, 0) - 6;
  document.getElementById("wiz-instinct-points").textContent = 3 - currentTotal;
  
  instinctNames.forEach(name => {
    const box = document.createElement("div");
    box.className = "instinct-control-box";
    box.innerHTML = `
      <span class="name">${name}</span>
      <div class="number-input">
        <button class="wiz-instinct-minus" data-name="${name}">-</button>
        <input type="number" value="${state.wizardData.instintos[name]}" min="1" max="3" readonly>
        <button class="wiz-instinct-plus" data-name="${name}">+</button>
      </div>
    `;
    
    box.querySelector(".wiz-instinct-minus").addEventListener("click", () => {
      if (state.wizardData.instintos[name] > 1) {
        state.wizardData.instintos[name]--;
        renderWizardInstincts();
      }
    });
    
    box.querySelector(".wiz-instinct-plus").addEventListener("click", () => {
      const added = Object.values(state.wizardData.instintos).reduce((a, b) => a + b, 0) - 6;
      if (added < 3 && state.wizardData.instintos[name] < 3) {
        state.wizardData.instintos[name]++;
        renderWizardInstincts();
      }
    });
    
    container.appendChild(box);
  });
}

export function renderWizardSkills() {
  const listCon = document.getElementById("wiz-conhecimentos-list");
  const listPra = document.getElementById("wiz-praticas-list");
  listCon.innerHTML = "";
  listPra.innerHTML = "";
  
  const currentTotal = Object.values(state.wizardData.conhecimentos).reduce((a, b) => a + b, 0) +
                       Object.values(state.wizardData.praticas).reduce((a, b) => a + b, 0);
  document.getElementById("wiz-skill-points").textContent = 7 - currentTotal;
  
  Object.keys(state.wizardData.conhecimentos).forEach(name => {
    const row = document.createElement("div");
    row.className = "skill-control-row";
    row.innerHTML = `
      <span class="name">${name}</span>
      <div class="number-input">
        <button class="wiz-con-minus" data-name="${name}">-</button>
        <input type="number" value="${state.wizardData.conhecimentos[name]}" min="0" max="2" readonly>
        <button class="wiz-con-plus" data-name="${name}">+</button>
      </div>
    `;
    row.querySelector(".wiz-con-minus").addEventListener("click", () => {
      if (state.wizardData.conhecimentos[name] > 0) {
        state.wizardData.conhecimentos[name]--;
        renderWizardSkills();
      }
    });
    row.querySelector(".wiz-con-plus").addEventListener("click", () => {
      const currentTotal = Object.values(state.wizardData.conhecimentos).reduce((a, b) => a + b, 0) +
                           Object.values(state.wizardData.praticas).reduce((a, b) => a + b, 0);
      if (currentTotal < 7 && state.wizardData.conhecimentos[name] < 2) {
        state.wizardData.conhecimentos[name]++;
        renderWizardSkills();
      }
    });
    listCon.appendChild(row);
  });

  Object.keys(state.wizardData.praticas).forEach(name => {
    const row = document.createElement("div");
    row.className = "skill-control-row";
    row.innerHTML = `
      <span class="name">${name}</span>
      <div class="number-input">
        <button class="wiz-pra-minus" data-name="${name}">-</button>
        <input type="number" value="${state.wizardData.praticas[name]}" min="0" max="2" readonly>
        <button class="wiz-pra-plus" data-name="${name}">+</button>
      </div>
    `;
    row.querySelector(".wiz-pra-minus").addEventListener("click", () => {
      if (state.wizardData.praticas[name] > 0) {
        state.wizardData.praticas[name]--;
        renderWizardSkills();
      }
    });
    row.querySelector(".wiz-pra-plus").addEventListener("click", () => {
      const currentTotal = Object.values(state.wizardData.conhecimentos).reduce((a, b) => a + b, 0) +
                           Object.values(state.wizardData.praticas).reduce((a, b) => a + b, 0);
      if (currentTotal < 7 && state.wizardData.praticas[name] < 2) {
        state.wizardData.praticas[name]++;
        renderWizardSkills();
      }
    });
    listPra.appendChild(row);
  });
}

export function updateWizardCaboValues() {
  const slider = document.getElementById("wiz-det-slider");
  const detVal = document.getElementById("wiz-det-val");
  const assVal = document.getElementById("wiz-ass-val");
  
  const handleInput = () => {
    const ass = parseInt(slider.value);
    assVal.textContent = ass;
    detVal.textContent = 10 - ass;
    state.wizardData.assNivel = ass;
    state.wizardData.detNivel = 10 - ass;
  };
  
  slider.removeEventListener("input", handleInput);
  slider.addEventListener("input", handleInput);
}

export function renderWizardHealth() {
  document.getElementById("wiz-pot-preview").textContent = state.wizardData.instintos.Potência;
  document.getElementById("wiz-res-preview").textContent = state.wizardData.instintos.Resolução;
  
  const pLevel = 1 + state.wizardData.instintos.Potência + state.wizardData.instintos.Resolução;
  document.getElementById("wiz-health-per-level-val").textContent = pLevel;
  
  const formulaEl = document.querySelector(".saude-formula");
  if (formulaEl) {
    formulaEl.innerHTML = `<span>Saúde por Nível = 1 + Potência (<span id="wiz-pot-preview">${state.wizardData.instintos.Potência}</span>) + Resolução (<span id="wiz-res-preview">${state.wizardData.instintos.Resolução}</span>) = </span>
    <strong id="wiz-health-per-level-val">${pLevel}</strong> pontos`;
  }
  
  const container = document.querySelector(".saude-preview-bars");
  container.innerHTML = "";
  
  const levels = ["Saudável", "Escoriação", "Laceração", "Ferimentos", "Debilitação", "Incapacitação"];
  levels.forEach(lvl => {
    const bar = document.createElement("div");
    bar.className = "health-level-row";
    bar.style.marginBottom = "8px";
    
    let dropsHtml = "";
    for (let i = 1; i <= pLevel; i++) {
      dropsHtml += `
        <span class="health-drop filled" style="width:12px; height:15px; color:#00ff66">
          ${ICONS.saude}
        </span>
      `;
    }
    
    bar.innerHTML = `
      <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:bold;">
        <span>${lvl}</span>
        <span style="color:#00ff66">${pLevel} pts</span>
      </div>
      <div class="health-drops">${dropsHtml}</div>
    `;
    container.appendChild(bar);
  });
}

export function renderWizardTraits() {
  document.getElementById("wiz-xp-points").textContent = state.wizardData.xp;
  
  const container = document.getElementById("wiz-traits-list");
  container.innerHTML = "";
  
  const filterCost = document.getElementById("wiz-traits-cost-filter").value;
  
  CARACTERISTICAS.forEach(trait => {
    if (trait.id === "estagio_avancado" && state.wizardData.step !== 8) return; 
    if (filterCost !== "all" && trait.custo !== parseInt(filterCost)) return;
    
    const isOwned = state.wizardData.caracteristicas.includes(trait.id);
    const meetsReqs = checkWizardTraitPrerequisites(trait.requisitos);
    
    const card = document.createElement("div");
    card.className = `trait-wiz-item ${isOwned ? 'owned' : ''}`;
    if (!meetsReqs && !isOwned) card.style.opacity = "0.5";
    
    card.innerHTML = `
      <div class="info">
        <div class="name-row">
          <span class="name">${trait.nome}</span>
          <span class="tag-cost">${trait.custo} XP</span>
          ${isOwned ? '<span style="color:#00ff66; font-size:11px; font-weight:bold;">Adquirido</span>' : ''}
        </div>
        <div class="req">Requisito: ${trait.requisitoText}</div>
        <div class="desc">${trait.descricao}</div>
      </div>
      <div class="action">
        <button class="btn ${isOwned ? 'btn-danger' : ''} btn-sm wiz-buy-trait-btn" 
          data-id="${trait.id}" ${(!meetsReqs && !isOwned) ? 'disabled' : ''}>
          ${isOwned ? 'Remover' : 'Adquirir'}
        </button>
      </div>
    `;
    
    card.querySelector(".wiz-buy-trait-btn").addEventListener("click", () => {
      if (isOwned) {
        state.wizardData.caracteristicas = state.wizardData.caracteristicas.filter(id => id !== trait.id);
        state.wizardData.xp += trait.custo;
      } else {
        if (state.wizardData.xp >= trait.custo) {
          state.wizardData.caracteristicas.push(trait.id);
          state.wizardData.xp -= trait.custo;
        } else {
          alert("Pontos de Experiência (XP) insuficientes!");
        }
      }
      renderWizardTraits();
    });
    
    container.appendChild(card);
  });
  
  renderWizardSkillUpgrades();
}

export function checkWizardTraitPrerequisites(reqs) {
  if (!reqs) return true;
  if (reqs.criacao && state.wizardData.step !== 8) return false;
  
  for (const [key, value] of Object.entries(reqs)) {
    if (key === "criacao") continue;
    if (key === "or") {
      const options = reqs.or;
      const targetVal = reqs.val || 1;
      let ok = false;
      options.forEach(opt => {
        const val = state.wizardData.conhecimentos[opt] !== undefined ? state.wizardData.conhecimentos[opt] : (state.wizardData.praticas[opt] || 0);
        if (val >= targetVal) ok = true;
      });
      if (!ok) return false;
      continue;
    }
    if (key === "val") continue;
    
    if (state.wizardData.instintos[key] !== undefined) {
      if (state.wizardData.instintos[key] < value) return false;
    } else {
      const val = state.wizardData.conhecimentos[key] !== undefined ? state.wizardData.conhecimentos[key] : (state.wizardData.praticas[key] || 0);
      if (val < value) return false;
    }
  }
  return true;
}

export function renderWizardSkillUpgrades() {
  const containerCon = document.getElementById("wiz-upgrade-conhecimentos");
  const containerPra = document.getElementById("wiz-upgrade-praticas");
  containerCon.innerHTML = "";
  containerPra.innerHTML = "";
  
  Object.keys(state.wizardData.conhecimentos).forEach(name => {
    const curVal = state.wizardData.conhecimentos[name];
    const targetVal = curVal + 1;
    const cost = targetVal * 2;
    
    const row = document.createElement("div");
    row.className = "skill-control-row";
    row.innerHTML = `
      <span class="name">${name} (${curVal})</span>
      <div style="display:flex; align-items:center;">
        <span class="skill-upgrade-cost">Custo: ${cost} XP</span>
        <button class="btn btn-sm wiz-upgrade-con-btn" data-name="${name}" ${state.wizardData.xp < cost ? 'disabled' : ''}>
          Subir para ${targetVal}
        </button>
      </div>
    `;
    
    row.querySelector(".wiz-upgrade-con-btn").addEventListener("click", () => {
      if (state.wizardData.xp >= cost) {
        state.wizardData.conhecimentos[name]++;
        state.wizardData.xp -= cost;
        renderWizardTraits();
      }
    });
    containerCon.appendChild(row);
  });

  Object.keys(state.wizardData.praticas).forEach(name => {
    const curVal = state.wizardData.praticas[name];
    const targetVal = curVal + 1;
    const cost = targetVal * 2;
    
    const row = document.createElement("div");
    row.className = "skill-control-row";
    row.innerHTML = `
      <span class="name">${name} (${curVal})</span>
      <div style="display:flex; align-items:center;">
        <span class="skill-upgrade-cost">Custo: ${cost} XP</span>
        <button class="btn btn-sm wiz-upgrade-pra-btn" data-name="${name}" ${state.wizardData.xp < cost ? 'disabled' : ''}>
          Subir para ${targetVal}
        </button>
      </div>
    `;
    
    row.querySelector(".wiz-upgrade-pra-btn").addEventListener("click", () => {
      if (state.wizardData.xp >= cost) {
        state.wizardData.praticas[name]++;
        state.wizardData.xp -= cost;
        renderWizardTraits();
      }
    });
    containerPra.appendChild(row);
  });
}

export function renderWizardPackages() {
  const container = document.querySelector(".packages-grid");
  container.innerHTML = "";
  
  const packages = [
    { id: "combatente", name: "Combatente", items: "Bebida, corda (15m), faca, lança, machado." },
    { id: "curandeiro", name: "Curandeiro", items: "Álcool, curativos, faca, kit de costura, serrote." },
    { id: "desbravador", name: "Desbravador", items: "Bússola, facão, mapas úteis, saco de dormir, tenda desmontável." },
    { id: "estudioso", name: "Estudioso", items: "Caderno de notas, caixa de velas, canivete, kit de escrita, 3 livros." },
    { id: "mercador", name: "Mercador", items: "Ábaco, balança, caderno de notas, kit de escrita, mapas úteis." },
    { id: "nomade", name: "Nômade", items: "Aljava com 10 flechas, arco, facão, manto camuflado, sinalizador." },
    { id: "infiltrador", name: "Infiltrador", items: "Corda (15m), faca, gazuas, manto camuflado, pé de cabra." },
    { id: "selvagem", name: "Selvagem", items: "Faca de osso, lança, pintura ritualística, rede de dormir, rede de pesca." },
    { id: "sobrevivente", name: "Sobrevivente", items: "Corda (15m), faca, machado, pederneira, saco de dormir." }
  ];
  
  packages.forEach(pkg => {
    const card = document.createElement("div");
    card.className = `package-wiz-card ${state.wizardData.equipamentoPacote === pkg.id ? 'active' : ''}`;
    card.innerHTML = `
      <h4>${pkg.name}</h4>
      <div class="items">${pkg.items}</div>
    `;
    
    card.addEventListener("click", () => {
      state.wizardData.equipamentoPacote = pkg.id;
      renderWizardPackages();
    });
    
    container.appendChild(card);
  });
}

export function wizardFinish() {
  if (!state.wizardData.equipamentoPacote) {
    alert("Por favor, selecione um pacote de equipamentos iniciais.");
    return;
  }
  
  const newChar = {
    id: "char_" + Date.now(),
    name: state.wizardData.name,
    generation: state.wizardData.generation,
    ocupacao: state.wizardData.ocupacao,
    evento: state.wizardData.evento,
    propP1: state.wizardData.propP1,
    propP2: state.wizardData.propP2,
    propCol: state.wizardData.propCol,
    instintos: state.wizardData.instintos,
    conhecimentos: state.wizardData.conhecimentos,
    praticas: state.wizardData.praticas,
    detNivel: state.wizardData.detNivel,
    detPoints: state.wizardData.detNivel,
    assNivel: state.wizardData.assNivel,
    assPoints: state.wizardData.assNivel,
    xp: state.wizardData.xp,
    caracteristicas: state.wizardData.caracteristicas,
    mutações: [],
    notes: "",
    inventario: Array(9).fill(null).map((_, i) => {
      const itemsMap = {
        combatente: ["Bebida", "Corda (15 metros)", "Faca", "Lança", "Machado"],
        curandeiro: ["Álcool", "Curativos", "Faca", "Kit de costura", "Serrote"],
        desbravador: ["Bússola", "Facão", "Mapas úteis", "Saco de dormir", "Tenda desmontável"],
        estudioso: ["Caderno de notas", "Caixa de velas", "Canivete", "Kit de escrita", "Livro (1)", "Livro (2)", "Livro (3)"],
        mercador: ["Ábaco", "Balança", "Caderno de notas", "Kit de escrita", "Mapas úteis"],
        nomade: ["Aljava c/ 10 flechas", "Arco", "Facão", "Manto camuflado", "Sinalizador"],
        infiltrador: ["Corda (15 metros)", "Faca", "Gazuas", "Manto camuflado", "Pé de cabra"],
        selvagem: ["Faca de osso", "Lança", "Pintura ritualística", "Rede de dormir", "Rede de pesca"],
        sobrevivente: ["Corda (15 metros)", "Faca", "Machado", "Pederneira", "Saco de dormir"]
      };
      const itemEscassez = {
        "Bebida": 2, "Corda (15 metros)": 1, "Faca": 1, "Lança": 1, "Machado": 2,
        "Álcool": 2, "Curativos": 2, "Kit de costura": 2, "Serrote": 2,
        "Bússola": 3, "Facão": 2, "Mapas úteis": 3, "Saco de dormir": 2, "Tenda desmontável": 3,
        "Caderno de notas": 2, "Caixa de velas": 2, "Canivete": 4, "Kit de escrita": 2, "Livro (1)": 3, "Livro (2)": 3, "Livro (3)": 3,
        "Ábaco": 3, "Balança": 2,
        "Aljava c/ 10 flechas": 2, "Arco": 3, "Manto camuflado": 4, "Sinalizador": 3,
        "Gazuas": 2, "Pé de cabra": 2,
        "Faca de osso": 1, "Pintura ritualística": 1, "Rede de dormir": 1, "Rede de pesca": 1,
        "Pederneira": 2
      };
      const defaults = itemsMap[state.wizardData.equipamentoPacote] || [];
      const itemName = defaults[i] || "";
      const esc = itemEscassez[itemName] || (itemName ? 2 : 0);
      return {
        name: itemName,
        qualidade: itemName ? 3 : 3, // Padrão
        pressao: 0,
        escassez: esc
      };
    })
  };
  
  logger.info(`Wizard: Criação concluída. Salvando ficha para "${newChar.name}".`);
  
  state.characters.push(newChar);
  localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
  
  // Atualiza selector e carrega ficha
  const event = new CustomEvent("load-new-character", { detail: newChar.id });
  document.dispatchEvent(event);
  
  alert(`Infectado(a) ${newChar.name} criado(a) com sucesso!`);
}
