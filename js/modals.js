
// Auxiliar para decodificar custos textuais de mutações
function parseCost(costStr) {
  let a = 0, b = 0, c = 0, singular = 0;
  if (!costStr) return { a, b, c, singular };

  const s = costStr.toLowerCase();

  // Sucessos (Sucesso / Sucessos)
  const succMatch = s.match(/(\d+)\s*sucesso/);
  if (succMatch) {
    a = parseInt(succMatch[1]);
  } else if (s.includes("sucesso")) {
    a = (s.match(/sucesso/g) || []).length;
  }

  // Adaptações / Adptações (Qualquer variação de adapt/adpt)
  const adaptMatch = s.match(/(\d+)\s*(?:ad[a-z]*ptaç|adapt|adpt)/);
  if (adaptMatch) {
    b = parseInt(adaptMatch[1]);
  } else if (s.includes("adapt") || s.includes("adpt")) {
    b = (s.match(/(?:adapt|adpt)/g) || []).length;
  }

  // Pressões (Pressão / Pressões)
  const pressMatch = s.match(/(\d+)\s*press/);
  if (pressMatch) {
    c = parseInt(pressMatch[1]);
  } else if (s.includes("press") || s.includes("presão") || s.includes("presao")) {
    c = (s.match(/(?:press|pres)/g) || []).length;
  }

  // Singulares
  const singMatch = s.match(/(\d+)\s*singular/);
  if (singMatch) {
    singular = parseInt(singMatch[1]);
  } else if (s.includes("singular")) {
    singular = (s.match(/singular/g) || []).length;
  }

  return { a, b, c, singular };
}

import { el, state, saveCurrentCharacter, loadCharacter, getCustomTraits, saveCustomTraits, getCustomMutations, saveCustomMutations, updateCloudSyncBadge, updateCharSelector } from "./state.js";
import { worldState, saveItemToDb } from "./world-state.js";
import { getFirebaseConfig } from "./config.js";
import { renderMutationsSheet, renderCaboGuerraSheet, renderInventorySheet, renderAptitudesSheet, renderHomebrewSheet, renderSavedMacrosSheet } from "./sheet.js";
import { CARACTERISTICAS } from "./characteristics.js";
import { ASSIMILACOES } from "./assimilations.js";
import { ICONS } from "../icons.js";
import { getDieSymbolsHtml, getDieFaceImgSrc } from "./chat.js";
import { DICE_MAP } from "./roller.js";
import { logger } from "./logger.js";
import { esc } from "./screen-utils.js";

// ==========================================
// MODAL: SELETOR DE CARACTERÍSTICAS
// ==========================================
export function openTraitsModal() {
  const char = state.currentCharacter;
  if (!char) return;

  logger.info("Modal: Abrindo modal de características.");

  el.modalContainer.classList.remove("hidden");
  el.modalBody.innerHTML = `
    <h3 class="modal-title">Adquirir Característica</h3>
    <p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px;">
      Você possui <strong><span id="modal-xp-value">${char.xp}</span> pontos de XP</strong> disponíveis.
    </p>
    <div style="display:flex; gap:8px; margin-bottom:12px;">
      <button id="btn-open-create-trait-from-modal" class="btn btn-sm btn-success">+ Criar Característica</button>
    </div>
    <div class="traits-modal-grid" id="traits-modal-grid">
      <!-- JS insere os itens -->
    </div>
  `;

  document.getElementById("btn-open-create-trait-from-modal").addEventListener("click", () => {
    el.modalContainer.classList.add("hidden");
    setTimeout(() => openCreateTraitModal(), 100);
  }, { once: true });

  const grid = el.modalBody.querySelector("#traits-modal-grid");

  const renderTraitRow = (trait, isCustom) => {
    if (!isCustom && trait.id === "estagio_avancado") return;

    const isOwned = char.caracteristicas.includes(trait.id);
    const meetsReqs = isCustom ? true : checkCharacterTraitPrerequisites(char, trait.requisitos);

    const row = document.createElement("div");
    row.className = `trait-modal-row ${isOwned ? 'owned' : ''}`;
    if (!meetsReqs && !isOwned) row.style.opacity = "0.5";

    row.innerHTML = `
      <div class="info">
        <div class="title-row">
          <span class="title">${esc(trait.nome)}</span>
          <span class="cost-badge">${trait.custo} XP</span>
          ${isOwned ? '<span style="color:#00ff66; font-size:10px; font-weight:bold;">Adquirido</span>' : ''}
          ${isCustom ? '<span style="color:#a855f7; font-size:10px; margin-left:4px;">⚙️</span>' : ''}
        </div>
        <div class="req">${trait.requisitoText ? 'Requisito: ' + esc(trait.requisitoText) : ''}</div>
        <div class="desc">${esc(trait.descricao)}</div>
      </div>
      <div class="action">
        <button class="btn ${isOwned ? 'btn-danger' : ''} btn-sm modal-buy-trait-btn" 
          data-id="${trait.id}" ${(!meetsReqs && !isOwned) ? 'disabled' : ''}>
          ${isOwned ? 'Remover' : 'Adquirir'}
        </button>
      </div>
    `;

    row.querySelector(".modal-buy-trait-btn").addEventListener("click", () => {
      if (isOwned) {
        logger.info(`Modal: Removendo característica "${trait.nome}" (Custo devolvido: ${trait.custo} XP).`);
        char.caracteristicas = char.caracteristicas.filter(id => id !== trait.id);
        char.xp += trait.custo;
        saveCurrentCharacter();
        loadCharacter(char.id);
        openTraitsModal();
      } else {
        if (char.xp >= trait.custo) {
          logger.info(`Modal: Adquirindo característica "${trait.nome}" (Custo: ${trait.custo} XP).`);
          char.caracteristicas.push(trait.id);
          char.xp -= trait.custo;
          saveCurrentCharacter();
          loadCharacter(char.id);
          openTraitsModal();
        } else {
          logger.warn("Modal: Falha ao adquirir característica: XP insuficiente.");
          alert("Pontos de XP insuficientes!");
        }
      }
    });

    grid.appendChild(row);
  };

  CARACTERISTICAS.forEach(trait => renderTraitRow(trait, false));

  // Custom traits
  const customTraits = getCustomTraits();
  if (customTraits.length > 0) {
    const sep = document.createElement("div");
    sep.style.cssText = "grid-column:1/-1; border-top:1px solid rgba(255,255,255,0.08); margin:8px 0 4px 0; padding-top:8px; font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;";
    sep.textContent = "⚙️ Personalizadas";
    grid.appendChild(sep);
    customTraits.forEach(trait => renderTraitRow(trait, true));
  }
}


export function checkCharacterTraitPrerequisites(char, reqs) {
  if (!reqs) return true;
  for (const [key, value] of Object.entries(reqs)) {
    if (key === "criacao") return false; // Bloqueia característica exclusiva de criação na ficha
    if (key === "or") {
      const options = reqs.or;
      const targetVal = reqs.val || 1;
      let ok = false;
      options.forEach(opt => {
        const val = char.conhecimentos[opt] !== undefined ? char.conhecimentos[opt] : (char.praticas[opt] || 0);
        if (val >= targetVal) ok = true;
      });
      if (!ok) return false;
      continue;
    }
    if (key === "val") continue;

    if (char.instintos[key] !== undefined) {
      if (char.instintos[key] < value) return false;
    } else {
      const val = char.conhecimentos[key] !== undefined ? char.conhecimentos[key] : (char.praticas[key] || 0);
      if (val < value) return false;
    }
  }
  return true;
}

// ==========================================
// MODAL: TESTE DE ASSIMILAÇÃO & CARTAS (MUTAÇÕES)
// ==========================================
export function openAssimilationTestModal() {
  const char = state.currentCharacter;
  if (!char) return;

  logger.info("Modal: Abrindo modal de Teste de Assimilação.");

  el.modalContainer.classList.remove("hidden");
  el.modalBody.innerHTML = `
    <h3 class="modal-title">Realizar Teste de Assimilação</h3>
    <div class="assimilation-test-modal">
      <p class="pool-display">Pilha de Dados: <strong>1d10 + ${char.assNivel}d12</strong></p>
      <p style="font-size:13px; color:var(--text-secondary); text-align:center;">
        O teste é realizado ao aumentar seu nível de Assimilação. Os símbolos Sucesso, Presão e Adaptação sorteados determinam suas opções de mutações no repouso.
      </p>
      
      <button class="btn" id="btn-modal-roll-ass">ROLAR TESTE DE ASSIMILAÇÃO</button>
      
      <div class="test-results-box hidden" id="ass-test-results">
        <h4>Resultados do Teste</h4>
        <div class="test-results-dice" id="ass-test-dice-container"></div>
        
        <div class="test-results-summary">
          <div class="test-summary-row" data-type="A">
            <div class="label-box"><span class="symbol-color"></span> <span>Sucesso (Evolutivas)</span></div>
            <span class="count" id="ass-count-a">0</span>
          </div>
          <div class="test-summary-row" data-type="B">
            <div class="label-box"><span class="symbol-color"></span> <span>Adaptação (Adaptativas)</span></div>
            <span class="count" id="ass-count-b">0</span>
          </div>
          <div class="test-summary-row" data-type="C">
            <div class="label-box"><span class="symbol-color"></span> <span>Pressão (Inoportunas)</span></div>
            <span class="count" id="ass-count-c">0</span>
          </div>
        </div>

        <div class="c-alert-message hidden" id="death-alert">
          <strong>ATENÇÃO:</strong> O total  PRESSÃO acumuladas atingiu ou excedeu 10! A personagem perdeu toda a consciência humana e agora se tornou uma criatura sob controle definitivo do Assimilador (NPC).
        </div>

        <div class="modal-actions hidden" id="ass-modal-mutation-action">
          <button class="btn btn-success" id="btn-draw-mutations">Escolher Mutações</button>
        </div>
      </div>
    </div>
  `;

  const btnRoll = document.getElementById("btn-modal-roll-ass");
  const resultsBox = document.getElementById("ass-test-results");

  btnRoll.addEventListener("click", () => {
    btnRoll.disabled = true;

    // Executa a rolagem utilizando o motor 3D local
    const pool = ["1d10"];
    for (let i = 0; i < char.assNivel; i++) pool.push("1d12");
    const notationString = pool.join("+");

    logger.info(`Modal: Iniciando rolagem do Teste de Assimilação com pool "${notationString}".`);

    const box = state.diceBox || window.diceBox;

    if (!box) {
      alert("O motor 3D ainda está carregando...");
      btnRoll.disabled = false;
      return;
    }

    el.diceOverlay.classList.remove("hidden");
    setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 50);

    box.setDice(notationString);
    box.start_throw(
      null,
      (notation) => {
        btnRoll.disabled = false;
        resultsBox.classList.remove("hidden");

        setTimeout(() => {
          el.diceOverlay.classList.add("hidden");
        }, 3000);

        if (!notation.result || notation.result.length === 0 || notation.result[0] < 0) {
          console.error("Erro na simulação do Dice Box: os dados caíram da mesa.");
          alert("Ops! Os dados saíram da mesa de rolagem. Tente novamente.");
          return;
        }

        const convertedResults = notation.result.map((val, idx) => {
          const type = notation.set[idx]; // 'd10' or 'd12'
          const symbols = DICE_MAP[type][val] || [];
          const sides = parseInt(type.substring(1));
          return { value: val, sides: sides, symbols: symbols };
        });

        // Renderiza os dados no modal
        const container = document.getElementById("ass-test-dice-container");
        container.innerHTML = "";
        convertedResults.forEach(die => {
          const d = document.createElement("div");
          d.className = `result-die-card`;
          const imgSrc = getDieFaceImgSrc(die.sides, die.value);
          let contentHtml = "";
          if (imgSrc) {
            contentHtml = `<img src="${imgSrc}" class="die-face-img" alt="d${die.sides} face ${die.value}">`;
          } else {
            contentHtml = `
              <span class="die-type-tag d-${die.sides}">d${die.sides}</span>
              <span class="die-val-label">${die.value}</span>
              <div class="die-symbol-svg">${getDieSymbolsHtml(die.symbols)}</div>
            `;
          }
          d.innerHTML = contentHtml;
          container.appendChild(d);
        });

        // Conta símbolos
        let a = 0;
        let b = 0;
        let c = 0;
        convertedResults.forEach(die => {
          die.symbols.forEach(sym => {
            if (sym === "A") a++;
            if (sym === "B") b++;
            if (sym === "C") c++;
          });
        });

        document.getElementById("ass-count-a").textContent = a;
        document.getElementById("ass-count-b").textContent = b;
        document.getElementById("ass-count-c").textContent = c;
        
        logger.info(`Modal: Teste de Assimilação concluído - Sucesso [S]: ${a}, Adaptação [AS]: ${b}, Pressão [P]: ${c}.`);
        
        // Calcula Morte por Assimilação Completa (Pág 124)
        const prevC = char.mutações.filter(m => m.suit === "inoportunas").length;
        const totalC = prevC + c;

        if (totalC >= 10) {
          logger.error(`Modal: A personagem "${char.name}" atingiu ou excedeu 10 pressões no total (${totalC}/10). Tornou-se um NPC do Assimilador.`);
          document.getElementById("death-alert").classList.remove("hidden");
          char.assimiladoDefinitivo = true;
          saveCurrentCharacter();
        } else {
          char.ptsA = (char.ptsA || 0) + a;
          char.ptsB = (char.ptsB || 0) + b;
          char.ptsC = (char.ptsC || 0) + c;
          saveCurrentCharacter();
          renderMutationsSheet();

          document.getElementById("ass-modal-mutation-action").classList.remove("hidden");
          const oldBtn = document.getElementById("btn-draw-mutations");
          const newBtn = oldBtn.cloneNode(true);
          oldBtn.parentNode.replaceChild(newBtn, oldBtn);
          newBtn.addEventListener("click", () => {
            state.drawnMutationCards = null;
            openMutationSelectionScreen(char.ptsA, char.ptsB, char.ptsC);
          });
        }
      }
    );
  });
}


// Abre a tela de escolha das cartas de mutação com base nos pontos ABC do teste
export function openMutationSelectionScreen(ptsA, ptsB, ptsC) {
  const char = state.currentCharacter;
  if (!char) return;

  // Se não houver cartas sorteadas salvas no state, precisamos mostrar a tela de introdução/sorteio
  if (!state.drawnMutationCards) {
    logger.info("Modal: Iniciando fluxo de Sorteio de Mutações (reunião do baralho).");
    el.modalContainer.classList.remove("hidden");
    el.modalBody.innerHTML = `
      <style>
        .tarot-intro-screen {
          text-align: center;
          padding: 16px;
          color: var(--text-primary);
        }
        .tarot-intro-screen h3 {
          font-family: var(--font-heading);
          color: var(--color-blue-glow);
          font-size: 20px;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .points-badge-row {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin: 20px 0;
        }
        .points-badge {
          font-family: var(--font-heading);
          font-size: 14px;
          font-weight: bold;
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
        .points-badge.a { color: #00ff66; background: rgba(0,255,102,0.08); border-color: rgba(0,255,102,0.25); }
        .points-badge.b { color: #eab308; background: rgba(234,179,8,0.08); border-color: rgba(234,179,8,0.25); }
        .points-badge.c { color: #ef4444; background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.25); }
        .singulares-config-box {
          margin: 20px auto;
          background: rgba(255,255,255,0.02);
          padding: 16px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.05);
          max-width: 400px;
          text-align: left;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.3);
        }
        .singulares-config-box label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: bold;
          cursor: pointer;
          font-size: 13px;
        }
        .singulares-config-box .desc {
          font-size: 11px;
          color: var(--text-secondary);
          margin-top: 6px;
          line-height: 1.4;
        }
      </style>
      <div class="tarot-intro-screen">
        <h3>🔮 Leitura de Mutações (Repouso)</h3>
        <p style="font-size: 13px; color: var(--text-secondary); max-width: 500px; margin: 0 auto 16px; line-height: 1.5;">
          Mutações se manifestam e reestruturam o corpo durante o repouso.
          Compre as cartas do Baralho de Assimilações de acordo com os resultados anotados no seu Teste de Assimilação.
        </p>

        <div class="points-badge-row">
          <div class="points-badge a">Sucesso [S]: ${ptsA}</div>
          <div class="points-badge b">Adaptação [A]: ${ptsB}</div>
          <div class="points-badge c">Pressão [P]: ${ptsC}</div>
        </div>

        <div class="singulares-config-box">
          <label>
            <input type="checkbox" id="chk-include-singulares" style="width: 16px; height: 16px; cursor: pointer;">
            <span>Incluir Assimilações Singulares no sorteio</span>
          </label>
          <div class="desc">
            Adiciona mutações raras moldadas exclusivamente pelas características da região atual (ex: Deserto Central, Pantanal Alagado).
          </div>
        </div>

        <button class="btn btn-success btn-large" id="btn-draw-mutations-tarot" style="padding: 12px 28px; font-family: var(--font-heading); font-size: 15px; margin-top: 10px; box-shadow: var(--glow-shadow);">
          SORTEAR CARTAS DO DESTINO
        </button>
      </div>
    `;

    document.getElementById("btn-draw-mutations-tarot").addEventListener("click", () => {
      const includeSingulares = document.getElementById("chk-include-singulares").checked;

      const drawnCards = [];
      const shuffle = (array) => array.sort(() => Math.random() - 0.5);

      // Sorteia ptsA de Evolutivas
      if (ptsA > 0) {
        const deck = shuffle([...ASSIMILACOES.evolutivas.cartas]);
        const count = Math.min(ptsA, deck.length);
        for (let i = 0; i < count; i++) {
          drawnCards.push({ category: "evolutivas", cardData: deck[i], flipped: false });
        }
      }

      // Sorteia ptsB de Adaptativas
      if (ptsB > 0) {
        const deck = shuffle([...ASSIMILACOES.adaptativas.cartas]);
        const count = Math.min(ptsB, deck.length);
        for (let i = 0; i < count; i++) {
          drawnCards.push({ category: "adaptativas", cardData: deck[i], flipped: false });
        }
      }

      // Sorteia ptsC de Inoportunas
      if (ptsC > 0) {
        const deck = shuffle([...ASSIMILACOES.inoportunas.cartas]);
        const count = Math.min(ptsC, deck.length);
        for (let i = 0; i < count; i++) {
          drawnCards.push({ category: "inoportunas", cardData: deck[i], flipped: false });
        }
      }

      // Se incluir Singulares, adiciona 1 carta Singular
      if (includeSingulares && ASSIMILACOES.singulares && ASSIMILACOES.singulares.cartas.length > 0) {
        const deck = shuffle([...ASSIMILACOES.singulares.cartas]);
        drawnCards.push({ category: "singulares", cardData: deck[0], flipped: false });
      }

      // Fallback caso não tenha nenhum ponto e não tenha sorteado nada
      if (drawnCards.length === 0) {
        const deck = shuffle([...ASSIMILACOES.evolutivas.cartas]);
        drawnCards.push({ category: "evolutivas", cardData: deck[0], flipped: false });
      }

      // Salva a lista de cartas gerada e reseta seleção ativa
      state.drawnMutationCards = drawnCards;
      state.activeCardIndex = null;
      openMutationSelectionScreen(ptsA, ptsB, ptsC);
    });
    return;
  }

  // Se já tiver cartas sorteadas, renderiza a tela do Taro
  logger.info(`Modal: Renderizando spread de taro com 3 cartas.`);
  el.modalContainer.classList.remove("hidden");

  // Render de estilos CSS e HTML para as cartas de taro
  el.modalBody.innerHTML = `
    <style>
      .tarot-modal-container {
        color: var(--text-primary);
        padding: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .tarot-header {
        text-align: center;
        margin-bottom: 12px;
      }
      .tarot-header h3 {
        font-family: var(--font-heading);
        color: var(--color-blue-glow);
        margin: 0 0 6px 0;
        text-transform: uppercase;
        font-size: 18px;
      }
      .points-bar {
        display: flex;
        gap: 12px;
        font-family: var(--font-heading);
        font-size: 13px;
        background: rgba(0,0,0,0.3);
        padding: 6px 14px;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,0.05);
        margin-top: 6px;
      }
      .tarot-carousel-group {
        width: 100%;
        margin-bottom: 20px;
      }
      .tarot-carousel-title {
        font-family: var(--font-heading);
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 8px;
        text-transform: uppercase;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-bottom: 4px;
      }
      .tarot-spread {
        display: flex;
        gap: 16px;
        padding: 10px 0;
        perspective: 1000px;
        width: 100%;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        scrollbar-width: thin;
        scrollbar-color: var(--color-blue-glow) rgba(0,0,0,0.3);
      }
      .tarot-spread::-webkit-scrollbar {
        height: 6px;
      }
      .tarot-spread::-webkit-scrollbar-track {
        background: rgba(0,0,0,0.3);
        border-radius: 3px;
      }
      .tarot-spread::-webkit-scrollbar-thumb {
        background: var(--color-blue-glow);
        border-radius: 3px;
      }
      .tarot-card-wrapper {
        width: 120px;
        height: 190px;
        cursor: pointer;
        flex: 0 0 auto;
        scroll-snap-align: center;
      }
      .tarot-card {
        width: 100%;
        height: 100%;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s, border-color 0.3s;
        border-radius: 10px;
      }
      .tarot-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 8px 20px rgba(0, 149, 255, 0.3);
      }
      .tarot-card.flipped {
        transform: rotateY(180deg);
      }
      .tarot-card.active-selection {
        outline: 2px solid var(--color-blue-glow);
        outline-offset: 4px;
      }
      .tarot-card-face {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 8px;
        box-sizing: border-box;
      }
      .tarot-card-back {
        background: radial-gradient(circle, #1a0f2e 0%, #080314 100%);
        border: 2px solid #eab308;
        color: #eab308;
      }
      .tarot-card-back .sigil {
        font-size: 28px;
        filter: drop-shadow(0 0 6px #eab308);
      }
      .tarot-card-back .back-text {
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-top: 8px;
        font-family: var(--font-heading);
        opacity: 0.8;
      }
      .tarot-card-front {
        transform: rotateY(180deg);
        background: rgba(15, 15, 25, 0.95);
        border: 2px solid;
        text-align: center;
      }
      .tarot-card-front.evolutivas { border-color: #00ff66; color: #00ff66; }
      .tarot-card-front.adaptativas { border-color: #eab308; color: #eab308; }
      .tarot-card-front.inoportunas { border-color: #ef4444; color: #ef4444; }
      .tarot-card-front.singulares { border-color: #a855f7; color: #a855f7; }
      
      .card-suit-symbol { font-size: 24px; margin-bottom: 4px; }
      .card-name-title { font-size: 11px; font-family: var(--font-heading); font-weight: bold; line-height: 1.2; word-break: break-word; }
      .card-type-tag { font-size: 8px; text-transform: uppercase; margin-top: 6px; padding: 2px 6px; background: rgba(255,255,255,0.07); border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); }
      
      .tarot-details-panel {
        width: 100%;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 8px;
        padding: 14px;
        margin-top: 10px;
        min-height: 120px;
      }
      .detail-card-title {
        font-family: var(--font-heading);
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 6px;
      }
      .mutation-buy-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .mutation-buy-item {
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 6px;
        padding: 8px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      .mutation-buy-info {
        flex: 1;
      }
      .mut-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 3px;
      }
      .mut-title { font-weight: bold; font-size: var(--font-size-lg); }
      .mut-cost { font-size: 10px; font-family: var(--font-heading); padding: 1px 6px; border-radius: 4px; font-weight: bold; }
      .mut-cost.evolutivas { background: rgba(0,255,102,0.15); color: #00ff66; border: 1px solid rgba(0,255,102,0.3); }
      .mut-cost.adaptativas { background: rgba(234,179,8,0.15); color: #eab308; border: 1px solid rgba(234,179,8,0.3); }
      .mut-cost.inoportunas { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .mut-cost.singulares { background: rgba(168,85,247,0.15); color: #a855f7; border: 1px solid rgba(168,85,247,0.3); }
      .mut-desc { font-size: var(--font-size-md); color: var(--text-secondary); line-height: 1.3; }
      .mut-req { font-size: var(--font-size-md); color: var(--color-blue-glow); margin-top: 3px; font-weight: 500; }
    </style>

    <div class="tarot-modal-container">
      <div class="tarot-header">
        <h3>🔮 Selecionar Mutações Sorteadas</h3>
        <p style="font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0;">Toque em cada carta para revelar e ver as opções de mutação.</p>
        <div class="points-bar">
          <span style="color:#00ff66;">Sucessos: <strong id="val-pts-a">${ptsA}</strong></span>
          <span style="color:#eab308;">Adaptações: <strong id="val-pts-b">${ptsB}</strong></span>
          <span style="color:#ef4444;">Pressões: <strong id="val-pts-c">${ptsC}</strong></span>
        </div>
      </div>

      <div style="width: 100%; margin-top: 10px;">
        ${["evolutivas", "adaptativas", "inoportunas", "singulares"].map(cat => {
    const catCards = state.drawnMutationCards.map((item, idx) => ({ item, idx })).filter(o => o.item.category === cat);
    if (catCards.length === 0) return "";

    let title = "Evolutivas";
    let color = "#00ff66";
    if (cat === "adaptativas") { title = "Adaptativas"; color = "#eab308"; }
    if (cat === "inoportunas") { title = "Inoportunas"; color = "#ef4444"; }
    if (cat === "singulares") { title = "Singulares"; color = "#a855f7"; }

    return `
            <div class="tarot-carousel-group">
              <div class="tarot-carousel-title" style="color: ${color}; border-color: ${color}40;">${title}</div>
              <div class="tarot-spread">
                ${catCards.map(({ item, idx }) => {
      const type = item.category;
      const isFlipped = item.flipped;
      const isSelected = state.activeCardIndex === idx;
      const symbol = type === "evolutivas" ? "♥" : type === "adaptativas" ? "♦" : type === "inoportunas" ? "♠" : "♣";

      return `
                    <div class="tarot-card-wrapper" data-index="${idx}">
                      <div class="tarot-card ${isFlipped ? 'flipped' : ''} ${isSelected ? 'active-selection' : ''}">
                        <!-- Back (face down) -->
                        <div class="tarot-card-face tarot-card-back">
                          <img src="assets/logoAssimilacao.webp" alt="Assimilação RPG Logo" style="width: 52px; height: 52px; border-radius: 50%; border: 1.5px solid #eab308; box-shadow: 0 0 10px rgba(234, 179, 8, 0.45); object-fit: cover; animation: pulse 2s infinite alternate;">
                          <div class="back-text">Destino</div>
                        </div>
                        <!-- Front (face up) -->
                        <div class="tarot-card-face tarot-card-front ${type}">
                          <span class="card-suit-symbol">${symbol}</span>
                          <span class="card-name-title">${item.cardData.nome}</span>
                          <span class="card-type-tag">${type}</span>
                        </div>
                      </div>
                    </div>
                  `;
    }).join("")}
              </div>
            </div>
          `;
  }).join("")}
      </div>

      <div class="tarot-details-panel" id="tarot-details-panel">
        <div style="text-align: center; color: var(--text-muted); font-size: 12px; margin-top: 30px;">
          Selecione uma carta revelada no spread para ver as mutações disponíveis.
        </div>
      </div>

      <div class="modal-actions" style="margin-top: 16px; width:100%; display:flex; gap:10px;">
        <button class="btn btn-success" id="btn-close-mutation-selection" style="flex:1;">Finalizar Repouso</button>
      </div>
    </div>
  `;

  // Bind click nos cards do Tarot
  const cardElements = document.querySelectorAll(".tarot-card-wrapper");
  cardElements.forEach(wrapper => {
    wrapper.addEventListener("click", () => {
      const idx = parseInt(wrapper.getAttribute("data-index"), 10);
      const cardItem = state.drawnMutationCards[idx];

      if (!cardItem.flipped) {
        cardItem.flipped = true;
        // Toca animação e aguarda
        const cardInner = wrapper.querySelector(".tarot-card");
        cardInner.classList.add("flipped");

        setTimeout(() => {
          state.activeCardIndex = idx;
          openMutationSelectionScreen(ptsA, ptsB, ptsC);
        }, 350);
      } else {
        state.activeCardIndex = idx;
        openMutationSelectionScreen(ptsA, ptsB, ptsC);
      }
    });
  });

  // Renderiza detalhes da carta ativa se houver
  if (state.activeCardIndex !== null && state.activeCardIndex !== undefined) {
    const activeItem = state.drawnMutationCards[state.activeCardIndex];
    const detailsPanel = document.getElementById("tarot-details-panel");
    const type = activeItem.category;
    const cardData = activeItem.cardData;

    detailsPanel.innerHTML = `
      <div class="detail-card-title">
        <span>${cardData.carta} - ${cardData.nome}</span>
        <span style="font-size:11px; text-transform:uppercase; opacity:0.8;">(${type})</span>
      </div>
      <div class="mutation-buy-list">
        ${cardData.mutações.map((mut, mIdx) => {
      const isOwned = char.mutações.some(m => m.id && mut.id ? m.id === mut.id : m.name === mut.name);
      const reqs = parseCost(mut.cost);

      // Verifica se cumpre o requisito de Nível de Assimilação
      const meetsLevelReq = !mut.req || char.assNivel >= mut.req;

      // Verifica se tem recursos suficientes
      let isAffordable = false;
      if (reqs.singular > 0) {
        // Singular custa qualquer ponto
        isAffordable = (ptsA + ptsB + ptsC) >= reqs.singular;
      } else {
        isAffordable = ptsA >= reqs.a && ptsB >= reqs.b && ptsC >= reqs.c;
      }

      const canBuy = !isOwned && isAffordable && meetsLevelReq;

      let btnHtml = "";
      if (isOwned) {
        btnHtml = `<span style="font-size:12px; color:var(--text-muted); font-weight:bold;">Adquirido</span>`;
      } else {
        btnHtml = `
              <button class="btn btn-sm btn-buy-mut-tarot" data-m-idx="${mIdx}" ${!canBuy ? "disabled" : ""}>
                Adquirir
              </button>
            `;
      }

      let reqLabel = "";
      if (mut.req) {
        const hasReq = char.assNivel >= mut.req;
        reqLabel = `<div class="mut-req" style="color: var(--color-blue-glow)">
              Requer Assimilação Nível ${mut.req} (Atual: ${char.assNivel})
            </div>`;
      }

      return `
            <div class="mutation-buy-item">
              <div class="mutation-buy-info">
                <div class="mut-title-row">
                  <span class="mut-title">${mut.name}</span>
                  <span class="mut-cost ${type}">${mut.cost}</span>
                </div>
                <div class="mut-desc">${mut.desc}</div>
                ${reqLabel}
              </div>
              <div class="mutation-buy-control">
                ${btnHtml}
              </div>
            </div>
          `;
    }).join("")}
      </div>
    `;

    // Bind clique de compra
    detailsPanel.querySelectorAll(".btn-buy-mut-tarot").forEach(btn => {
      btn.addEventListener("click", () => {
        const mIdx = parseInt(btn.getAttribute("data-m-idx"), 10);
        const mut = cardData.mutações[mIdx];
        const reqs = parseCost(mut.cost);

        logger.info(`Modal: Adquirindo mutação "${mut.name}" via Taro.`);

        // Deduz pontos
        if (reqs.singular > 0) {
          // Desconta dos pontos disponíveis prioritariamente A, depois B, depois C
          let remSing = reqs.singular;
          if (ptsA >= remSing) {
            ptsA -= remSing;
            remSing = 0;
          } else {
            remSing -= ptsA;
            ptsA = 0;
          }

          if (remSing > 0) {
            if (ptsB >= remSing) {
              ptsB -= remSing;
              remSing = 0;
            } else {
              remSing -= ptsB;
              ptsB = 0;
            }
          }

          if (remSing > 0) {
            if (ptsC >= remSing) {
              ptsC -= remSing;
              remSing = 0;
            } else {
              remSing -= ptsC;
              ptsC = 0;
            }
          }
        } else {
          ptsA -= reqs.a;
          ptsB -= reqs.b;
          ptsC -= reqs.c;
        }

        char.ptsA = ptsA;
        char.ptsB = ptsB;
        char.ptsC = ptsC;

        // Adiciona mutação
        char.mutações.push({
          id: mut.id || "",
          suit: type,
          name: mut.name,
          cost: mut.cost,
          desc: mut.desc
        });

        saveCurrentCharacter();
        renderMutationsSheet();

        // Recarrega
        openMutationSelectionScreen(ptsA, ptsB, ptsC);
      });
    });
  }

  // Finalizar Repouso
  document.getElementById("btn-close-mutation-selection").addEventListener("click", () => {
    // Alerta se ainda restarem pontos de mutação e houver opções disponíveis
    const hasRemainingPoints = ptsA > 0 || ptsB > 0 || ptsC > 0;

    if (hasRemainingPoints) {
      const confirmFinalize = confirm("Você ainda possui pontos de Assimilação/Sucesso para gastar. Tem certeza que deseja finalizar e perder estes pontos?");
      if (!confirmFinalize) return;
    }

    logger.info("Modal: Finalizando seleção de mutações do Taro.");
    char.assPoints = char.assNivel; // Restabelece pontos de Assimilação de Uso da ficha
    // Zera pontos pendentes do teste
    char.ptsA = 0;
    char.ptsB = 0;
    char.ptsC = 0;

    state.drawnMutationCards = null;
    state.activeCardIndex = null;

    saveCurrentCharacter();
    renderCaboGuerraSheet();
    renderMutationsSheet();
    el.modalContainer.classList.add("hidden");
  });

  // Mantém a carta selecionada no centro do carrossel ao remontar o DOM
  if (state.activeCardIndex !== null && state.activeCardIndex !== undefined) {
    setTimeout(() => {
      const activeCardEl = document.querySelector(`.tarot-card-wrapper[data-index="${state.activeCardIndex}"]`);
      if (activeCardEl) {
        activeCardEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }, 50);
  }
}

export function openSettingsModal() {
  logger.info("Modal: Abrindo modal de configurações.");
  el.modalContainer.classList.remove("hidden");

  const disable3D = localStorage.getItem("assimilação_disable_3d") === "true";
  const char = state.currentCharacter;
  const currentMaxBubbles = (char && char.maxValueBubbles) || parseInt(localStorage.getItem("assimilação_max_value_bubbles")) || 5;

  el.modalBody.innerHTML = `
    <div class="settings-modal-content card-glass">
    <h3 class="modal-title">Configurações</h3>
    <div class="settings-modal-content card-glass" style="margin-top: 16px;">
      <div class="setting-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div class="setting-info" style="flex: 1; padding-right: 16px;">
          <div class="setting-label" style="font-weight: 600; font-size: var(--font-size-md); color: var(--text-primary);">Desativar Dados 3D</div>
          <div class="setting-desc" style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px;">Substitui a animação física dos dados por rolagens matemáticas instantâneas no chat.</div>
        </div>
        <div class="setting-control">
          <label class="theme-switch">
            <input type="checkbox" id="settings-disable-3d" ${disable3D ? "checked" : ""}>
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="setting-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px;">
        <div class="setting-info" style="flex: 1; padding-right: 16px;">
          <div class="setting-label" style="font-weight: 600; font-size: var(--font-size-md); color: var(--text-primary);">Máximo de Bolhas de Valor (Aptidões)</div>
          <div class="setting-desc" style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px;">Define a quantidade máxima de bolhas para Instintos, Conhecimentos e Práticas (Mínimo: 5).</div>
        </div>
        <div class="setting-control" style="display: flex; align-items: center; gap: 8px;">
          <button id="btn-bubbles-dec" class="btn btn-sm" style="padding: 2px 8px;">-</button>
          <strong id="val-bubbles-max" style="font-size: 14px; min-width: 20px; text-align: center;">${currentMaxBubbles}</strong>
          <button id="btn-bubbles-inc" class="btn btn-sm" style="padding: 2px 8px;">+</button>
        </div>
      </div>

      <div class="setting-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px;">
        <div class="setting-info" style="flex: 1; padding-right: 16px;">
          <div class="setting-label" style="font-weight: 600; font-size: var(--font-size-md); color: var(--text-primary);">Apagar Fichas (Local Storage)</div>
          <div class="setting-desc" style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px;">Remove todos os personagens e dados locais criados neste navegador.</div>
        </div>
        <div class="setting-control">
          <button id="btn-clear-local-storage" class="btn btn-danger btn-sm" style="white-space: nowrap;">Apagar Dados</button>
        </div>
      </div>

      <div class="setting-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px;">
        <div class="setting-info" style="flex: 1; padding-right: 16px;">
          <div class="setting-label" style="font-weight: 600; font-size: var(--font-size-md); color: var(--text-primary);">Forçar Recarregamento (PWA Cache)</div>
          <div class="setting-desc" style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px;">Limpa o cache offline e força o download da versão mais recente dos arquivos.</div>
        </div>
        <div class="setting-control">
          <button id="btn-clear-pwa-cache" class="btn btn-danger btn-sm" style="white-space: nowrap;">Forçar Recarga</button>
        </div>
      </div>
      
      <div class="setting-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px;">
        <div class="setting-info" style="flex: 1; padding-right: 16px;">
          <div class="setting-label" style="font-weight: 600; font-size: var(--font-size-md); color: var(--text-primary);">Gerenciador de Armazenamento</div>
          <div class="setting-desc" style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 4px;">Gerencie, delete ou exporte individualmente fichas de personagens, refúgios, regiões, conflitos, locais e pacotes de Homebrew.</div>
        </div>
        <div class="setting-control">
          <button id="btn-open-storage-manager" class="btn btn-md" style="white-space: nowrap; border-color: var(--color-blue-glow); color: var(--color-blue-glow); background: rgba(0,162,255,0.05);">Gerenciar Dados</button>
        </div>
      </div>
      
      <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
        <button id="btn-save-settings" class="btn btn-md">Fechar</button>
      </div>
    </div>
  </div>
  `;

  const checkbox = document.getElementById("settings-disable-3d");
  checkbox.addEventListener("change", (e) => {
    localStorage.setItem("assimilação_disable_3d", e.target.checked ? "true" : "false");
    logger.info(`Configurações: assimilação_disable_3d alterada para ${e.target.checked}`);
  });

  const updateBubblesMax = (newVal) => {
    newVal = Math.max(5, newVal);
    document.getElementById("val-bubbles-max").textContent = newVal;
    localStorage.setItem("assimilação_max_value_bubbles", newVal.toString());
    if (char) {
      char.maxValueBubbles = newVal;
      saveCurrentCharacter();
      renderAptitudesSheet();
    }
  };

  document.getElementById("btn-bubbles-dec").addEventListener("click", () => {
    const curVal = (char && char.maxValueBubbles) || parseInt(localStorage.getItem("assimilação_max_value_bubbles")) || 5;
    updateBubblesMax(curVal - 1);
  });

  document.getElementById("btn-bubbles-inc").addEventListener("click", () => {
    const curVal = (char && char.maxValueBubbles) || parseInt(localStorage.getItem("assimilação_max_value_bubbles")) || 5;
    updateBubblesMax(curVal + 1);
  });

  const clearStorageBtn = document.getElementById("btn-clear-local-storage");
  clearStorageBtn.addEventListener("click", () => {
    if (confirm("Tem certeza que deseja apagar todos os personagens salvos localmente? Essa ação não pode ser desfeita.")) {
      logger.info("Configurações: Apagando localStorage e sessionStorage.");
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  });

  const clearCacheBtn = document.getElementById("btn-clear-pwa-cache");
  clearCacheBtn.addEventListener("click", () => {
    if (confirm("Tem certeza que deseja limpar o cache do aplicativo e forçar o recarregamento? Os personagens salvos localmente serão preservados.")) {
      logger.info("Configurações: Limpando Cache Storage e desregistrando Service Workers.");

      const unregisterPromises = [];
      if ('serviceWorker' in navigator) {
        unregisterPromises.push(
          navigator.serviceWorker.getRegistrations().then(registrations => {
            return Promise.all(registrations.map(reg => reg.unregister()));
          })
        );
      }

      if ('caches' in window) {
        unregisterPromises.push(
          caches.keys().then(keys => {
            return Promise.all(keys.map(key => caches.delete(key)));
          })
        );
      }

      Promise.all(unregisterPromises).finally(() => {
        window.location.reload(true);
      });
    }
  });

  document.getElementById("btn-open-storage-manager").addEventListener("click", () => {
    el.modalContainer.classList.add("hidden");
    setTimeout(() => {
      openStorageManagerModal();
    }, 150);
  });

  document.getElementById("btn-save-settings").addEventListener("click", () => {
    el.modalContainer.classList.add("hidden");
  });
}

// ==========================================
// MODAL: ADICIONAR ITEM NO INVENTÁRIO
// ==========================================
import { ITEM_CATEGORIAS } from "./dados.js";

// ==========================================
// MODAL: ADICIONAR ITEM NO INVENTÁRIO
// ==========================================
export function openAddItemModal() {
  const char = state.currentCharacter;
  if (!char) return;

  el.modalContainer.classList.remove("hidden");
  el.modalContainer.style.opacity = "1";
  el.modalContainer.style.pointerEvents = "auto";


  const renderLibrary = () => {
    el.modalBody.innerHTML = `
    <div class="inventory-add-library-container">
      <h3 class="modal-title" style="margin-bottom:8px;">Biblioteca de Itens</h3>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; gap:8px;">
        <p style="font-size:13px; color:var(--text-secondary); margin:0;">
          Arraste um item para a ficha ou clique para equipar no primeiro espaço vazio.
        </p>
        <button id="btn-add-item-manual" class="btn btn-sm" style="flex-shrink:0;">Criar Manualmente</button>
      </div>
      <div class="library-items-grid" style="display:grid; grid-template-columns:1fr; gap:8px; max-height:60vh; overflow-y:auto; padding-right:4px;">
        ${(worldState.itensDb || []).map((it, idx) => `
          <div class="library-item-card" draggable="true" data-item-idx="${idx}" style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); padding:8px; border-radius:4px; cursor:grab; user-select:none;">
            <div style="font-weight:bold; font-size:13px; color:#fff;">${esc(it.name)}</div>
            <div style="font-size:11px; color:#aaa; margin-top:4px;">${esc(it.efeito || '')}</div>
            <div style="font-size:10px; color:#888; margin-top:4px;">Escassez: E${it.escassez} | Categoria: ${it.categorias ? it.categorias.join(", ") : (it.categoria || 'Nenhuma')}</div>
          </div>
        `).join("")}
      </div>
    </div>
    `;

    document.getElementById("btn-add-item-manual").addEventListener("click", renderManualForm, { once: true });

    el.modalBody.querySelectorAll(".library-item-card").forEach(card => {
      const idx = card.dataset.itemIdx;
      
      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("application/json", JSON.stringify({ source: "library", itemIdx: parseInt(idx) }));
        setTimeout(() => {
          el.modalContainer.style.opacity = "0.2";
          el.modalContainer.style.pointerEvents = "none";
        }, 0);
      });

      card.addEventListener("dragend", () => {
        el.modalContainer.style.opacity = "1";
        el.modalContainer.style.pointerEvents = "auto";
        el.modalContainer.classList.add("hidden"); // close after dragging
      });

      card.addEventListener("click", () => {
        const item = worldState.itensDb[idx];
        const inv = char.inventario;
        const emptyIndex = inv.findIndex(s => !s.name || s.name.trim() === "");
        if (emptyIndex === -1) {
          alert("Inventário cheio! Remova ou troque itens antes de adicionar novos.");
          return;
        }
        inv[emptyIndex] = {
          name: item.name,
          qualidade: 3,
          pressao: 0,
          escassez: item.escassez,
          categoria: (item.categorias && item.categorias.length > 0) ? item.categorias[0] : (item.categoria || 'nenhuma'),
          categorias: item.categorias || [],
          efeito: item.efeito
        };
        saveCurrentCharacter();
        renderInventorySheet();
        el.modalContainer.classList.add("hidden");
      });
    });
  };

  const renderManualForm = () => {
    el.modalBody.innerHTML = `
    <div class="inventory-add-manual-container">
      <h3 class="modal-title" style="margin-bottom:8px;">Adicionar Item Manual</h3>
      <p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px;">
        Preencha os dados do novo item. Ele será colocado no primeiro espaço vazio.
      </p>
      <div class="add-item-form" style="display:flex; flex-direction:column; gap:14px;">
        <div class="form-group">
          <label for="add-item-name" style="font-size:12px; color:var(--text-secondary); display:block; margin-bottom:4px;">Nome do Item</label>
          <input type="text" id="add-item-name" placeholder="Ex: Faca, Corda..." style="width:100%; padding:8px 12px;">
        </div>
        <div class="form-group">
          <label for="add-item-efeito" style="font-size:12px; color:var(--text-secondary); display:block; margin-bottom:4px;">Efeito / Descrição</label>
          <input type="text" id="add-item-efeito" placeholder="Ex: Arma leve..." style="width:100%; padding:8px 12px;">
        </div>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;">
          <div class="form-group">
            <label for="add-item-qualidade" style="font-size:12px; color:var(--text-secondary); display:block; margin-bottom:4px;">Qualidade</label>
            <select id="add-item-qualidade" style="width:100%; padding:6px 8px;">
              <option value="0">Q0: Quebrado</option>
              <option value="1">Q1: Defeituoso</option>
              <option value="2">Q2: Comprometido</option>
              <option value="3" selected>Q3: Padrão</option>
              <option value="4">Q4: Reforçado</option>
              <option value="5">Q5: Superior</option>
              <option value="6">Q6: Obra-Prima</option>
            </select>
          </div>
          <div class="form-group">
            <label for="add-item-pressao" style="font-size:12px; color:var(--text-secondary); display:block; margin-bottom:4px;">Desgaste</label>
            <select id="add-item-pressao" style="width:100%; padding:6px 8px;">
              <option value="0" selected>0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </div>
          <div class="form-group">
            <label for="add-item-escassez" style="font-size:12px; color:var(--text-secondary); display:block; margin-bottom:4px;">Escassez</label>
            <select id="add-item-escassez" style="width:100%; padding:6px 8px;">
              <option value="0">E0: Abundante</option>
              <option value="1">E1: Corriqueiro</option>
              <option value="2" selected>E2: Comum</option>
              <option value="3">E3: Incomum</option>
              <option value="4">E4: Atípico</option>
              <option value="5">E5: Raro</option>
              <option value="6">E6: Quase Extinto</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label style="font-size:12px; color:var(--text-secondary); display:block; margin-bottom:4px;">Características / Categorias</label>
          <button type="button" id="btn-toggle-cat-list" class="btn btn-sm btn-gerenciar-cat" style="width:100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,165,0,0.25); color: var(--color-gold-glow); font-size: 11px; padding: 6px 8px; border-radius: 4px; cursor: pointer; transition: background 0.2s;">
            ➕ Gerenciar Categorias
          </button>
          <div id="add-item-cat-list" style="display:none; flex-direction:column; gap:4px; margin-top:8px; max-height:200px; overflow-y:auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 4px;">
            ${Object.entries(ITEM_CATEGORIAS).map(([key, cat]) => `
              <label style="display:flex; align-items:center; gap:8px; padding:4px; border-radius:4px; background:rgba(255,255,255,0.03); cursor:pointer;">
                <input type="checkbox" class="add-item-cat-checkbox" value="${key}" style="accent-color:var(--color-gold-glow);">
                <div style="display:flex; flex-direction:column; gap:2px;">
                  <span style="font-size:11px; font-weight:bold; color:var(--color-gold-glow);">${cat.nome}</span>
                  <span style="font-size:9px; color:var(--text-secondary);">${cat.desc}</span>
                </div>
              </label>
            `).join("")}
          </div>
        </div>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:8px;">
          <button id="btn-cancel-add-item" class="btn" style="padding:10px 20px;">Voltar</button>
          <button id="btn-confirm-add-item" class="btn btn-success" style="padding:10px 20px;">Adicionar</button>
        </div>
      </div>
    </div>
    `;

    document.getElementById("btn-toggle-cat-list").addEventListener("click", () => {
      const list = document.getElementById("add-item-cat-list");
      list.style.display = list.style.display === "none" ? "flex" : "none";
    });

    document.getElementById("btn-cancel-add-item").addEventListener("click", renderLibrary, { once: true });

    document.getElementById("btn-confirm-add-item").addEventListener("click", () => {
      const nameInput = document.getElementById("add-item-name");
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.focus();
        nameInput.style.borderColor = "var(--color-rust)";
        return;
      }

      const inv = char.inventario;
      const emptyIndex = inv.findIndex(s => !s.name || s.name.trim() === "");
      if (emptyIndex === -1) {
        alert("Inventário cheio! Remova ou troque itens antes de adicionar novos.");
        return;
      }

      const checkedBoxes = el.modalBody.querySelectorAll(".add-item-cat-checkbox:checked");
      const selectedCats = Array.from(checkedBoxes).map(cb => cb.value);

      inv[emptyIndex] = {
        name: name,
        qualidade: parseInt(document.getElementById("add-item-qualidade").value),
        pressao: parseInt(document.getElementById("add-item-pressao").value),
        escassez: parseInt(document.getElementById("add-item-escassez").value),
        categoria: selectedCats.length > 0 ? selectedCats[selectedCats.length - 1] : 'nenhuma',
        categorias: selectedCats,
        efeito: document.getElementById("add-item-efeito").value.trim()
      };

      saveCurrentCharacter();
      renderInventorySheet();
      el.modalContainer.classList.add("hidden");
    }, { once: true });
  };

  renderLibrary();

  const closeBtn = el.modalContainer.querySelector(".modal-close");
  if (closeBtn) {
    // We don't want to use once:true because they might open and close it multiple times.
    // However, closeBtn is an existing DOM element, attaching another listener without removing might leak.
    // Let's do it inline:
    closeBtn.onclick = () => { el.modalContainer.classList.add("hidden"); };
  }
}

// ==========================================
// MODAL: EVOLUIR APTIDÕES (GASTAR XP)
// ==========================================
export function openUpgradeAptitudesModal() {
  const char = state.currentCharacter;
  if (!char) return;

  const categories = [
    { key: "instintos", label: "Instintos", max: 5, color: "var(--color-instintos)" },
    { key: "conhecimentos", label: "Conhecimentos", max: 5, color: "var(--color-conhecimentos)" },
    { key: "praticas", label: "Práticas", max: 5, color: "var(--color-praticas)" }
  ];

  let activeTab = categories[0].key;

  const render = () => {
    let html = `
      <h3 class="modal-title" style="margin-bottom:4px;">Evoluir Aptidões</h3>
      <p style="font-size:13px; color:var(--text-secondary); margin-bottom:12px;">
        XP disponível: <strong id="modal-xp-value-upgrade" style="color:var(--color-blue-glow);">${char.xp}</strong>
      </p>
      <div class="upgrade-tabs" style="display:flex; gap:4px; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
    `;

    categories.forEach(cat => {
      const isActive = cat.key === activeTab;
      html += `
        <button class="btn btn-sm upgrade-tab-btn" data-tab="${cat.key}" style="flex:1; justify-content:center; padding:6px 8px; font-size:var(--font-size-sm); font-family:var(--font-heading); font-weight:bold; ${isActive ? 'border-color:' + cat.color + '; color:' + cat.color + '; background:rgba(0,0,0,0.3);' : 'border-color:transparent; color:var(--text-muted);'}">
          ${cat.label}
        </button>
      `;
    });

    html += `</div><div class="upgrade-panels">`;

    categories.forEach(cat => {
      const isActive = cat.key === activeTab;
      html += `<div class="upgrade-panel" data-panel="${cat.key}" style="display:${isActive ? 'flex' : 'none'}; flex-direction:column; gap:2px;">`;

      Object.keys(char[cat.key]).forEach(name => {
        const curVal = char[cat.key][name];
        const cost = (curVal + 1) * (cat.key === "instintos" ? 3 : 2);
        const canUpgrade = curVal < cat.max && char.xp >= cost;
        const atMax = curVal >= cat.max;

        html += `
          <div class="upgrade-row" style="display:flex; align-items:center; justify-content:space-between; padding:6px 8px; border-radius:var(--radius-sm);" data-cat="${cat.key}" data-name="${name}">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:var(--font-size-md);">${name}</span>
              <span style="font-size:var(--font-size-md); color:var(--text-muted); background:rgba(0,0,0,0.3); padding:1px 6px; border-radius:8px;">${curVal}/${cat.max}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              ${atMax ? '<span style="font-size:var(--font-size-md); color:var(--text-muted);">MÁXIMO</span>' : `
                <span style="font-size:var(--font-size-md); color:var(--text-secondary);">${cost} XP</span>
                <button class="btn btn-sm btn-upgrade-apt" data-cat="${cat.key}" data-name="${name}" ${canUpgrade ? '' : 'disabled'} style="padding:2px 10px; font-size:var(--font-size-md); ${canUpgrade ? 'border-color:' + cat.color + '; color:' + cat.color + ';' : ''}">
                  ${char.xp >= cost ? `Subir para ${curVal + 1}` : 'XP insuf.'}
                </button>
              `}
            </div>
          </div>
        `;
      });

      html += `</div>`;
    });

    html += `
      </div>
      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:16px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08);">
        <button id="btn-close-upgrade" class="btn" style="padding:10px 20px;">Fechar</button>
      </div>
    `;

    el.modalBody.innerHTML = html;
    el.modalContainer.classList.remove("hidden");

    // Tab listeners
    document.querySelectorAll(".upgrade-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.tab;
        render();
      });
    });

    // Upgrade listeners
    document.querySelectorAll(".btn-upgrade-apt").forEach(btn => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.cat;
        const name = btn.dataset.name;
        const curVal = char[cat][name];
        const targetVal = curVal + 1;
        const cost = targetVal * (cat === "instintos" ? 3 : 2);

        if (char.xp >= cost) {
          char[cat][name] = targetVal;
          char.xp -= cost;
          saveCurrentCharacter();
          const sheetXpEl = document.getElementById("sheet-xp-value");
          if (sheetXpEl) sheetXpEl.textContent = char.xp;
          render();
          renderAptitudesSheet();
        }
      });
    });

    document.getElementById("btn-close-upgrade").addEventListener("click", () => {
      el.modalContainer.classList.add("hidden");
    }, { once: true });

    const closeBtn = el.modalContainer.querySelector(".modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => el.modalContainer.classList.add("hidden"), { once: true });
    }

    el.modalContainer.addEventListener("click", (e) => {
      if (e.target === el.modalContainer) el.modalContainer.classList.add("hidden");
    }, { once: true });
  };

  render();
}

// ==========================================
// MODAL: CRIAR CARACTERÍSTICA PERSONALIZADA
// ==========================================
export function openCreateTraitModal() {
  const char = state.currentCharacter;
  if (!char) return;

  el.modalContainer.classList.remove("hidden");
  el.modalBody.innerHTML = `
  <div class="settings-modal-content card-glass">
    <h3 class="modal-title">Criar Característica Personalizada</h3>
    <div class="homebrew-form">
      <div class="form-group">
        <label>Nome da Característica</label>
        <input type="text" id="hb-trait-name" placeholder="Ex: Sangue de Fogo" style="width:100%; padding:8px 12px;">
      </div>
      <div class="form-group">
        <label>Custo em XP (1-5)</label>
        <input type="number" id="hb-trait-cost" min="1" max="5" value="1" style="width:80px; padding:8px 12px;">
      </div>
      <div class="form-group">
        <label>Descrição (efeito mecânico)</label>
        <textarea id="hb-trait-desc" rows="4" placeholder="Descreva o efeito completo..." style="width:100%; padding:8px 12px; resize:vertical;"></textarea>
      </div>
      <div class="form-group">
        <label>Requisito (opcional, texto livre)</label>
        <input type="text" id="hb-trait-req" placeholder="Ex: Potência 3+" style="width:100%; padding:8px 12px;">
      </div>
      <div class="modal-actions">
        <button class="btn" id="btn-cancel-create-trait">Cancelar</button>
        <button class="btn btn-success" id="btn-confirm-create-trait">Criar Característica</button>
      </div>
    </div>
  </div>
  `;

  document.getElementById("btn-cancel-create-trait").addEventListener("click", () => {
    el.modalContainer.classList.add("hidden");
  }, { once: true });

  document.getElementById("btn-confirm-create-trait").addEventListener("click", () => {
    const name = document.getElementById("hb-trait-name").value.trim();
    const cost = parseInt(document.getElementById("hb-trait-cost").value) || 1;
    const desc = document.getElementById("hb-trait-desc").value.trim();
    const reqText = document.getElementById("hb-trait-req").value.trim();

    if (!name) { alert("O nome é obrigatório."); return; }
    if (!desc) { alert("A descrição é obrigatória."); return; }
    if (cost < 1 || cost > 5) { alert("O custo deve ser entre 1 e 5."); return; }

    const customTraits = getCustomTraits();
    const newTrait = {
      id: "custom_" + Date.now(),
      nome: name,
      custo: cost,
      descricao: desc,
      requisitoText: reqText || ""
    };
    customTraits.push(newTrait);
    saveCustomTraits(customTraits);
    logger.info(`Homebrew: Característica "${name}" criada (ID: ${newTrait.id}).`);
    el.modalContainer.classList.add("hidden");
    renderHomebrewSheet();
  });
}

// ==========================================
// MODAL: CRIAR MUTAÇÃO PERSONALIZADA
// ==========================================
export function openCreateMutationModal() {
  const char = state.currentCharacter;
  if (!char) return;

  el.modalContainer.classList.remove("hidden");
  el.modalBody.innerHTML = `
    <h3 class="modal-title">Criar Mutação Personalizada</h3>
    <div class="homebrew-form">
      <div class="form-group">
        <label>Nome da Mutação</label>
        <input type="text" id="hb-mut-name" placeholder="Ex: Toque Biótico" style="width:100%; padding:8px 12px;">
      </div>
      <div class="form-group">
        <label>Categoria (naipe)</label>
        <select id="hb-mut-suit" style="width:100%; padding:8px 12px;">
          <option value="evolutivas">♥ Evolutivas (Sucesso)</option>
          <option value="adaptativas">♦ Adaptativas (Adaptação)</option>
          <option value="inoportunas">♠ Inoportunas (Pressão)</option>
          <option value="singulares">♣ Singulares (Paus)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Custo (texto livre, ex: "2 sucessos e 1 adaptação")</label>
        <input type="text" id="hb-mut-cost" placeholder="Ex: 2 sucessos e 1 pressão" style="width:100%; padding:8px 12px;">
      </div>
      <div class="form-group">
        <label>Nível de Assimilação Requerido (opcional)</label>
        <input type="number" id="hb-mut-req" min="1" max="10" placeholder="Deixe em branco se não houver requisito" style="width:120px; padding:8px 12px;">
      </div>
      <div class="form-group">
        <label>Descrição (efeito mecânico)</label>
        <textarea id="hb-mut-desc" rows="4" placeholder="Descreva o efeito completo..." style="width:100%; padding:8px 12px; resize:vertical;"></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn" id="btn-cancel-create-mutation">Cancelar</button>
        <button class="btn btn-success" id="btn-confirm-create-mutation">Criar Mutação</button>
      </div>
    </div>
  `;

  document.getElementById("btn-cancel-create-mutation").addEventListener("click", () => {
    el.modalContainer.classList.add("hidden");
  }, { once: true });

  document.getElementById("btn-confirm-create-mutation").addEventListener("click", () => {
    const name = document.getElementById("hb-mut-name").value.trim();
    const suit = document.getElementById("hb-mut-suit").value;
    const cost = document.getElementById("hb-mut-cost").value.trim();
    const reqVal = document.getElementById("hb-mut-req").value.trim();
    const desc = document.getElementById("hb-mut-desc").value.trim();

    if (!name) { alert("O nome é obrigatório."); return; }
    if (!cost) { alert("O custo é obrigatório."); return; }
    if (!desc) { alert("A descrição é obrigatória."); return; }

    const customMutations = getCustomMutations();
    const newMut = {
      id: "mut_" + Date.now(),
      suit: suit,
      name: name,
      cost: cost,
      desc: desc,
      req: reqVal ? parseInt(reqVal) : undefined
    };
    customMutations.push(newMut);
    saveCustomMutations(customMutations);
    logger.info(`Homebrew: Mutação "${name}" criada (ID: ${newMut.id}, categoria: ${suit}).`);
    el.modalContainer.classList.add("hidden");
    renderHomebrewSheet();
  });
}

// ==========================================
// MODAL: BIBLIOTECA DE ASSIMILAÇÕES
// ==========================================
export function openAssimilationLibraryModal() {
  const char = state.currentCharacter;
  if (!char) return;

  logger.info("Modal: Abrindo Biblioteca de Assimilações.");

  let ptsA = char.ptsA || 0;
  let ptsB = char.ptsB || 0;
  let ptsC = char.ptsC || 0;

  const categories = [
    { key: "evolutivas", label: "Evolutivas", color: "#00ff66", suitSymbol: "♥" },
    { key: "adaptativas", label: "Adaptativas", color: "#eab308", suitSymbol: "♦" },
    { key: "inoportunas", label: "Inoportunas", color: "#ef4444", suitSymbol: "♠" },
    { key: "singulares", label: "Singulares", color: "#a855f7", suitSymbol: "♣" }
  ];

  let activeTab = 0;
  let activeSubTab = "Todas";

  const renderSubTabsHtml = (catIndex) => {
    const cat = categories[catIndex];
    const assimData = ASSIMILACOES[cat.key];
    const catCustomMuts = getCustomMutations().filter(m => m.suit === cat.key);
    if ((!assimData || !assimData.cartas || assimData.cartas.length === 0) && catCustomMuts.length === 0) return "";

    let html = `
      <div class="lib-sub-tab-bar" style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; padding:6px; background:rgba(0,0,0,0.25); border-radius:4px; border:1px solid rgba(255,255,255,0.05); overflow-x:auto;">
        <button class="lib-sub-tab" data-sub-tab="Todas" style="padding:4px 8px; font-size:11px; font-family:var(--font-heading); border-radius:3px; background:${activeSubTab === 'Todas' ? 'rgba(255,255,255,0.1)' : 'transparent'}; border:1px solid ${activeSubTab === 'Todas' ? 'var(--border-color)' : 'transparent'}; color:${activeSubTab === 'Todas' ? '#fff' : 'var(--text-secondary)'}; cursor:pointer; text-transform:uppercase; font-weight:bold;">Todas</button>
    `;
    if (assimData && assimData.cartas) {
      html += assimData.cartas.map(card => {
        const shortName = card.carta.split(" ")[0];
        const isActive = activeSubTab === card.carta;
        return `<button class="lib-sub-tab" data-sub-tab="${card.carta}" style="padding:4px 8px; font-size:11px; font-family:var(--font-heading); border-radius:3px; background:${isActive ? 'rgba(255,255,255,0.1)' : 'transparent'}; border:1px solid ${isActive ? 'var(--border-color)' : 'transparent'}; color:${isActive ? '#fff' : 'var(--text-secondary)'}; cursor:pointer; text-transform:uppercase; font-weight:bold;">${shortName}</button>`;
      }).join('');
    }
    if (catCustomMuts.length > 0) {
      const isActive = activeSubTab === "Personalizadas";
      html += `<button class="lib-sub-tab" data-sub-tab="Personalizadas" style="padding:4px 8px; font-size:11px; font-family:var(--font-heading); border-radius:3px; background:${isActive ? 'rgba(255,255,255,0.1)' : 'transparent'}; border:1px solid ${isActive ? 'var(--border-color)' : 'transparent'}; color:${isActive ? '#fff' : 'var(--text-secondary)'}; cursor:pointer; text-transform:uppercase; font-weight:bold;">⚙️ Criadas</button>`;
    }
    html += `</div>`;
    return html;
  };

  const renderCategoryContent = (catIndex) => {
    const cat = categories[catIndex];
    const curA = char.ptsA || 0;
    const curB = char.ptsB || 0;
    const curC = char.ptsC || 0;

    let html = `<div class="library-modal-list">`;

    const assimData = ASSIMILACOES[cat.key];
    if (assimData && assimData.cartas && activeSubTab !== "Personalizadas") {
      const cardsToRender = activeSubTab === "Todas"
        ? assimData.cartas
        : assimData.cartas.filter(c => c.carta === activeSubTab);

      cardsToRender.forEach(card => {
        html += `
          <div class="lib-card">
            <div class="lib-card-title">${card.carta} — ${card.nome}</div>
            <div class="lib-mutations">
        `;

        card.mutações.forEach(mut => {
          const isOwned = char.mutações.some(m => m.id && mut.id ? m.id === mut.id : m.name === mut.name);
          const reqs = parseCost(mut.cost);
          const meetsLevelReq = !mut.req || char.assNivel >= mut.req;

          let isAffordable = false;
          if (reqs.singular > 0) {
            isAffordable = (curA + curB + curC) >= reqs.singular;
          } else {
            isAffordable = curA >= reqs.a && curB >= reqs.b && curC >= reqs.c;
          }

          const canBuy = !isOwned && isAffordable && meetsLevelReq;

          let reqLabel = "";
          if (mut.req) {
            reqLabel = `<span class="lib-req">Requer Assimilação Nível ${mut.req} (Atual: ${char.assNivel})</span>`;
          }

          html += `
            <div class="lib-mutation ${isOwned ? 'owned' : ''}">
              <div class="lib-mut-info">
                <div class="lib-mut-title-row">
                  <span class="lib-mut-name">${mut.name}</span>
                  <span class="lib-mut-cost" style="border-color:${cat.color}; color:${cat.color};">${mut.cost}</span>
                  ${isOwned ? '<span class="lib-owned-badge">Adquirido</span>' : ''}
                </div>
                <div class="lib-mut-desc">${mut.desc}</div>
                ${reqLabel}
              </div>
              <div class="lib-mut-action">
                ${isOwned ? '' : `<button class="btn btn-sm lib-buy-btn" data-cat="${cat.key}" data-card="${card.carta}" data-mut-id="${mut.id || ''}" data-mut-name="${mut.name}" data-mut-cost="${mut.cost}" data-mut-desc="${mut.desc}" ${canBuy ? '' : 'disabled'}>Adquirir</button>`}
              </div>
            </div>
          `;
        });

        html += `</div></div>`;
      });
    }

    // Custom mutations for this category
    const catCustomMuts = getCustomMutations().filter(m => m.suit === cat.key);
    if (catCustomMuts.length > 0 && (activeSubTab === "Todas" || activeSubTab === "Personalizadas")) {
      html += `
        <div class="lib-card">
          <div class="lib-card-title" style="color:${cat.color};">⚙️ Personalizadas</div>
          <div class="lib-mutations">
      `;
      catCustomMuts.forEach(mut => {
        const isOwned = char.mutações.some(m => m.id && mut.id ? m.id === mut.id : m.name === mut.name);
        const reqs = parseCost(mut.cost);
        const meetsLevelReq = !mut.req || char.assNivel >= mut.req;

        let isAffordable = false;
        if (reqs.singular > 0) {
          isAffordable = (curA + curB + curC) >= reqs.singular;
        } else {
          isAffordable = curA >= reqs.a && curB >= reqs.b && curC >= reqs.c;
        }

        const canBuy = !isOwned && isAffordable && meetsLevelReq;

        let reqLabel = "";
        if (mut.req) {
          reqLabel = `<span class="lib-req">Requer Assimilação Nível ${mut.req} (Atual: ${char.assNivel})</span>`;
        }

        html += `
          <div class="lib-mutation ${isOwned ? 'owned' : ''}">
            <div class="lib-mut-info">
              <div class="lib-mut-title-row">
                <span class="lib-mut-name">${esc(mut.name)}</span>
                <span class="lib-mut-cost" style="border-color:${cat.color}; color:${cat.color};">${esc(mut.cost)}</span>
                ${isOwned ? '<span class="lib-owned-badge">Adquirido</span>' : ''}
              </div>
              <div class="lib-mut-desc">${esc(mut.desc)}</div>
              ${reqLabel}
            </div>
            <div class="lib-mut-action">
              ${isOwned ? '' : `<button class="btn btn-sm lib-buy-btn" data-cat="${cat.key}" data-card="Personalizada" data-mut-name="${esc(mut.name)}" data-mut-cost="${esc(mut.cost)}" data-mut-desc="${esc(mut.desc)}" ${canBuy ? '' : 'disabled'}>Adquirir</button>`}
            </div>
          </div>
        `;
      });
      html += `</div></div>`;
    }

    html += `</div>`;
    return html;
  };

  const renderLibrary = () => {
    const curA = char.ptsA || 0;
    const curB = char.ptsB || 0;
    const curC = char.ptsC || 0;

    let html = `
      <h3 class="modal-title">Biblioteca de Assimilações</h3>
      <p style="font-size:13px; color:var(--text-secondary); margin-bottom:12px;">
        Selecione mutações para adquirir com seus pontos disponíveis.
      </p>
      <div class="lib-points-bar">
        <span style="color:#00ff66;">♥ Sucesso: <strong>${curA}</strong></span>
        <span style="color:#eab308;">♦ Adaptação: <strong>${curB}</strong></span>
        <span style="color:#ef4444;">♠ Pressão: <strong>${curC}</strong></span>
      </div>
      <div class="lib-tab-bar">
        ${categories.map((cat, i) =>
      `<button class="lib-tab ${i === activeTab ? 'active' : ''}" data-tab-index="${i}" style="${i === activeTab ? `border-color:${cat.color}; color:${cat.color};` : ''}">${cat.suitSymbol} ${cat.label}</button>`
    ).join('')}
      </div>
      ${renderSubTabsHtml(activeTab)}
      <div id="lib-tab-content">
        ${renderCategoryContent(activeTab)}
      </div>
      <div class="modal-actions">
        <button class="btn" id="btn-close-library">Fechar</button>
      </div>
    `;

    el.modalContainer.classList.remove("hidden");
    el.modalBody.innerHTML = html;

    // Bind acquire buttons
    // Tab switching
    el.modalBody.querySelectorAll(".lib-tab").forEach(tabBtn => {
      tabBtn.addEventListener("click", () => {
        activeTab = parseInt(tabBtn.dataset.tabIndex, 10);
        activeSubTab = "Todas";
        renderLibrary();
      });
    });

    // Sub-tab switching
    el.modalBody.querySelectorAll(".lib-sub-tab").forEach(subTabBtn => {
      subTabBtn.addEventListener("click", () => {
        activeSubTab = subTabBtn.dataset.subTab;
        renderLibrary();
      });
    });

    el.modalBody.querySelectorAll(".lib-buy-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.cat;
        const mutId = btn.dataset.mutId || "";
        const name = btn.dataset.mutName;
        const costStr = btn.dataset.mutCost;
        const desc = btn.dataset.mutDesc;
        const reqs = parseCost(costStr);

        logger.info(`Modal: Adquirindo mutação "${name}" via Biblioteca.`);

        // Deduz pontos
        if (reqs.singular > 0) {
          let remSing = reqs.singular;
          if (ptsA >= remSing) { ptsA -= remSing; remSing = 0; }
          else { remSing -= ptsA; ptsA = 0; }
          if (remSing > 0) { if (ptsB >= remSing) { ptsB -= remSing; remSing = 0; } else { remSing -= ptsB; ptsB = 0; } }
          if (remSing > 0) { if (ptsC >= remSing) { ptsC -= remSing; remSing = 0; } else { remSing -= ptsC; ptsC = 0; } }
        } else {
          ptsA -= reqs.a;
          ptsB -= reqs.b;
          ptsC -= reqs.c;
        }

        char.ptsA = ptsA;
        char.ptsB = ptsB;
        char.ptsC = ptsC;

        char.mutações.push({
          id: mutId,
          suit: cat,
          name: name,
          cost: costStr,
          desc: desc
        });

        saveCurrentCharacter();
        renderMutationsSheet();
        renderLibrary();
      });
    });

    document.getElementById("btn-close-library").addEventListener("click", () => {
      el.modalContainer.classList.add("hidden");
    }, { once: true });

    const closeBtn = el.modalContainer.querySelector(".modal-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => el.modalContainer.classList.add("hidden"), { once: true });
    }

    el.modalContainer.addEventListener("click", (e) => {
      if (e.target === el.modalContainer) el.modalContainer.classList.add("hidden");
    }, { once: true });
  };

  renderLibrary();
}

export function openCustomRollModal(macroToEdit = null) {
  const char = state.currentCharacter;
  if (!char) return;

  logger.info(`Modal: Abrindo modal de rolagem personalizada (${macroToEdit ? 'Editar' : 'Criar'}).`);

  const defaultMacro = {
    name: "",
    assimilada: false,
    instinto: "",
    instinto2: "",
    instintoBonus: 0,
    skill: "",
    skillBonus: 0,
    bonusSuccesses: 0,
    bonusPressures: 0,
    bonusAdaptations: 0,
    maxKeep: 1,
    d12Bonus: 0
  };

  const macro = macroToEdit ? { ...defaultMacro, ...macroToEdit } : { ...defaultMacro };

  el.modalContainer.classList.remove("hidden");
  el.modalBody.innerHTML = `
    <h3 class="modal-title">${macroToEdit ? "Editar Rolagem" : "Nova Rolagem Personalizada"}</h3>
    <form id="form-custom-roll" style="display:flex; flex-direction:column; gap:12px; margin-top:12px;">
      <div class="form-group" style="display:flex; flex-direction:column; gap:4px;">
        <label for="macro-name" style="font-weight:bold; font-size:12px; color:var(--text-secondary);">Nome da Rolagem:</label>
        <input type="text" id="macro-name" value="${esc(macro.name)}" placeholder="Ex: Ataque Rápido, Furtividade Sutil" style="width:100%; padding:8px; font-size:14px; background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;" required />
      </div>

      <div class="form-group" style="display:flex; align-items:center; justify-content:space-between; background: rgba(0, 162, 255, 0.08); border: 1px dashed rgba(0, 162, 255, 0.3); padding: 8px; border-radius: 4px;">
        <span style="font-weight:bold; font-size:12px; color:var(--text-secondary); user-select:none;">Rolagem Assimilada (Consome 1 Assimilação / 2 Determinação e rola d12)</span>
        <label class="theme-switch">
          <input type="checkbox" id="macro-assimilada" ${macro.assimilada ? "checked" : ""}>
          <span class="slider"></span>
        </label>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group" style="display:flex; flex-direction:column; gap:4px;">
          <label id="label-instinto-1" for="macro-instinto" style="font-weight:bold; font-size:12px; color:var(--text-secondary);">Instinto (d6):</label>
          <select id="macro-instinto" style="width:100%; padding:8px; font-size:14px; background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
            <option value="">-- Nenhum --</option>
            <option value="Influência" ${macro.instinto === "Influência" ? "selected" : ""}>Influência</option>
            <option value="Percepção" ${macro.instinto === "Percepção" ? "selected" : ""}>Percepção</option>
            <option value="Potência" ${macro.instinto === "Potência" ? "selected" : ""}>Potência</option>
            <option value="Reação" ${macro.instinto === "Reação" ? "selected" : ""}>Reação</option>
            <option value="Resolução" ${macro.instinto === "Resolução" ? "selected" : ""}>Resolução</option>
            <option value="Sagacidade" ${macro.instinto === "Sagacidade" ? "selected" : ""}>Sagacidade</option>
          </select>
        </div>
        <div class="form-group" id="group-instinto-bonus" style="display:flex; flex-direction:column; gap:4px;">
          <label for="macro-instinto-bonus" style="font-weight:bold; font-size:12px; color:var(--text-secondary);">Bônus Dados Instinto (d6):</label>
          <input type="number" id="macro-instinto-bonus" value="${macro.instintoBonus}" min="-5" max="10" style="width:100%; padding:8px; font-size:14px; background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;" />
        </div>
        <div class="form-group" id="group-instinto-2" style="display:none; flex-direction:column; gap:4px;">
          <label for="macro-instinto-2" style="font-weight:bold; font-size:12px; color:var(--text-secondary);">Instinto 2 (d12):</label>
          <select id="macro-instinto-2" style="width:100%; padding:8px; font-size:14px; background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
            <option value="">-- Nenhum --</option>
            <option value="Influência" ${macro.instinto2 === "Influência" ? "selected" : ""}>Influência</option>
            <option value="Percepção" ${macro.instinto2 === "Percepção" ? "selected" : ""}>Percepção</option>
            <option value="Potência" ${macro.instinto2 === "Potência" ? "selected" : ""}>Potência</option>
            <option value="Reação" ${macro.instinto2 === "Reação" ? "selected" : ""}>Reação</option>
            <option value="Resolução" ${macro.instinto2 === "Resolução" ? "selected" : ""}>Resolução</option>
            <option value="Sagacidade" ${macro.instinto2 === "Sagacidade" ? "selected" : ""}>Sagacidade</option>
          </select>
        </div>
      </div>

      <div id="group-skill-container" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group" style="display:flex; flex-direction:column; gap:4px;">
          <label for="macro-skill" style="font-weight:bold; font-size:12px; color:var(--text-secondary);">Conhecimento / Prática (d10):</label>
          <select id="macro-skill" style="width:100%; padding:8px; font-size:14px; background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
            <option value="">-- Nenhum --</option>
            <optgroup label="Conhecimentos">
              <option value="Biologia" ${macro.skill === "Biologia" ? "selected" : ""}>Biologia</option>
              <option value="Erudição" ${macro.skill === "Erudição" ? "selected" : ""}>Erudição</option>
              <option value="Engenharia" ${macro.skill === "Engenharia" ? "selected" : ""}>Engenharia</option>
              <option value="Geografia" ${macro.skill === "Geografia" ? "selected" : ""}>Geografia</option>
              <option value="Medicina" ${macro.skill === "Medicina" ? "selected" : ""}>Medicina</option>
              <option value="Segurança" ${macro.skill === "Segurança" ? "selected" : ""}>Segurança</option>
            </optgroup>
            <optgroup label="Práticas">
              <option value="Armas" ${macro.skill === "Armas" ? "selected" : ""}>Armas</option>
              <option value="Atletismo" ${macro.skill === "Atletismo" ? "selected" : ""}>Atletismo</option>
              <option value="Expressão" ${macro.skill === "Expressão" ? "selected" : ""}>Expressão</option>
              <option value="Furtividade" ${macro.skill === "Furtividade" ? "selected" : ""}>Furtividade</option>
              <option value="Manufaturas" ${macro.skill === "Manufaturas" ? "selected" : ""}>Manufaturas</option>
              <option value="Sobrevivência" ${macro.skill === "Sobrevivência" ? "selected" : ""}>Sobrevivência</option>
            </optgroup>
          </select>
        </div>
        <div class="form-group" style="display:flex; flex-direction:column; gap:4px;">
          <label for="macro-skill-bonus" style="font-weight:bold; font-size:12px; color:var(--text-secondary);">Bônus Dados Skill (d10):</label>
          <input type="number" id="macro-skill-bonus" value="${macro.skillBonus}" min="-5" max="10" style="width:100%; padding:8px; font-size:14px; background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;" />
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
        <div class="form-group" style="display:flex; flex-direction:column; gap:4px;">
          <label for="macro-bonus-successes" style="font-weight:bold; font-size:11px; color:var(--text-secondary);">Sucessos Extras:</label>
          <input type="number" id="macro-bonus-successes" value="${macro.bonusSuccesses}" min="-5" max="10" style="width:100%; padding:8px; font-size:14px; background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;" />
        </div>
        <div class="form-group" style="display:flex; flex-direction:column; gap:4px;">
          <label for="macro-bonus-pressures" style="font-weight:bold; font-size:11px; color:var(--text-secondary);">Pressões Extras:</label>
          <input type="number" id="macro-bonus-pressures" value="${macro.bonusPressures}" min="-5" max="10" style="width:100%; padding:8px; font-size:14px; background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;" />
        </div>
        <div class="form-group" style="display:flex; flex-direction:column; gap:4px;">
          <label for="macro-bonus-adaptations" style="font-weight:bold; font-size:11px; color:var(--text-secondary);">Adaptações Extras:</label>
          <input type="number" id="macro-bonus-adaptations" value="${macro.bonusAdaptations}" min="-5" max="10" style="width:100%; padding:8px; font-size:14px; background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;" />
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="form-group" style="display:flex; flex-direction:column; gap:4px;">
          <label for="macro-max-keep" style="font-weight:bold; font-size:12px; color:var(--text-secondary);">Dados a Manter:</label>
          <input type="number" id="macro-max-keep" value="${macro.maxKeep}" min="1" max="10" style="width:100%; padding:8px; font-size:14px; background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;" required />
        </div>
        <div class="form-group" style="display:flex; flex-direction:column; gap:4px;">
          <label for="macro-d12-bonus" style="font-weight:bold; font-size:12px; color:var(--text-secondary);">Bônus Dados d12:</label>
          <input type="number" id="macro-d12-bonus" value="${macro.d12Bonus || 0}" min="0" max="10" style="width:100%; padding:8px; font-size:14px; background:rgba(0,0,0,0.3); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;" />
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px;">
        <button type="button" class="btn btn-close-macro" style="border-color:var(--text-muted); color:var(--text-muted);">Cancelar</button>
        <button type="submit" class="btn btn-success">Salvar Rolagem</button>
      </div>
    </form>
  `;

  const closeForm = () => {
    el.modalContainer.classList.add("hidden");
  };

  el.modalBody.querySelector(".btn-close-macro").addEventListener("click", closeForm);

  const checkboxAss = el.modalBody.querySelector("#macro-assimilada");
  const labelInst1 = el.modalBody.querySelector("#label-instinto-1");
  const groupInstBonus = el.modalBody.querySelector("#group-instinto-bonus");
  const groupInst2 = el.modalBody.querySelector("#group-instinto-2");
  const groupSkill = el.modalBody.querySelector("#group-skill-container");
  const inputMaxKeep = el.modalBody.querySelector("#macro-max-keep");

  const updateFormFields = () => {
    const isAss = checkboxAss.checked;
    if (isAss) {
      labelInst1.textContent = "Instinto 1 (d12):";
      groupInstBonus.style.display = "none";
      groupInst2.style.display = "flex";
      groupSkill.style.display = "none";
      if (parseInt(inputMaxKeep.value) === 1 && !macroToEdit) {
        inputMaxKeep.value = 2;
      }
    } else {
      labelInst1.textContent = "Instinto (d6):";
      groupInstBonus.style.display = "flex";
      groupInst2.style.display = "none";
      groupSkill.style.display = "grid";
      if (parseInt(inputMaxKeep.value) === 2 && !macroToEdit) {
        inputMaxKeep.value = 1;
      }
    }
  };

  checkboxAss.addEventListener("change", updateFormFields);
  updateFormFields();

  const form = el.modalBody.querySelector("#form-custom-roll");
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("macro-name").value.trim();
    const assimilada = checkboxAss.checked;
    const instinto = document.getElementById("macro-instinto").value;
    const instinto2 = assimilada ? document.getElementById("macro-instinto-2").value : "";
    const instintoBonus = assimilada ? 0 : (parseInt(document.getElementById("macro-instinto-bonus").value) || 0);
    const skill = assimilada ? "" : document.getElementById("macro-skill").value;
    const skillBonus = assimilada ? 0 : (parseInt(document.getElementById("macro-skill-bonus").value) || 0);
    const bonusSuccesses = parseInt(document.getElementById("macro-bonus-successes").value) || 0;
    const bonusPressures = parseInt(document.getElementById("macro-bonus-pressures").value) || 0;
    const bonusAdaptations = parseInt(document.getElementById("macro-bonus-adaptations").value) || 0;
    const maxKeep = parseInt(document.getElementById("macro-max-keep").value) || 1;
    const d12Bonus = parseInt(document.getElementById("macro-d12-bonus").value) || 0;

    if (!char.savedRolls) char.savedRolls = [];

    const savedMacro = {
      id: macro.id || "macro_" + Date.now(),
      name,
      assimilada,
      instinto,
      instinto2,
      instintoBonus,
      skill,
      skillBonus,
      bonusSuccesses,
      bonusPressures,
      bonusAdaptations,
      maxKeep,
      d12Bonus
    };

    if (macro.id) {
      const idx = char.savedRolls.findIndex(m => m.id === macro.id);
      if (idx !== -1) char.savedRolls[idx] = savedMacro;
    } else {
      char.savedRolls.push(savedMacro);
    }

    saveCurrentCharacter();
    renderSavedMacrosSheet();
    closeForm();
  });
}

// ============================================================================
// SISTEMA DE SINCRONIZAÇÃO EM NUVEM E LIMITAÇÃO DE ESPAÇO (SIMULADO / FIREBASE)
// ============================================================================

const MOCK_CLOUD_DB_KEY = "assimilação_mock_cloud_db";
let cloudCharactersCache = [];

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

async function initRealFirebase() {
  if (firebaseApp) return { auth: firebaseAuth, db: firebaseDb };

  const config = await getFirebaseConfig();
  if (!config) return null;

  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

    firebaseApp = initializeApp(config);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);

    return { auth: firebaseAuth, db: firebaseDb };
  } catch (e) {
    console.error("Falha ao inicializar o Firebase Real:", e);
    return null;
  }
}

export function getCloudStorageInfo() {
  const sheets = state.useRealFirebase ? cloudCharactersCache : (getMockCloudDB()[state.currentUser?.uid] || []);
  const count = sheets.length;
  const jsonStr = JSON.stringify(sheets);
  const sizeBytes = new Blob([jsonStr]).size; // tamanho em bytes
  const sizeKB = (sizeBytes / 1024);

  return {
    count,
    maxCount: 10,
    sizeKB: sizeKB,
    maxSizeKB: 10240
  };
}

function getMockCloudDB() {
  return JSON.parse(localStorage.getItem(MOCK_CLOUD_DB_KEY)) || {};
}

function saveMockCloudDB(db) {
  localStorage.setItem(MOCK_CLOUD_DB_KEY, JSON.stringify(db));
}

export async function openCloudSyncModal() {
  openStorageManagerModal("nuvem");
}

// Ouvinte do evento beforeunload para alertar antes de fechar a aba
window.addEventListener("beforeunload", (e) => {
  if (state.currentUser && state.hasUnsavedCloudChanges) {
    e.preventDefault();
    e.returnValue = "Você possui alterações na ficha que não foram salvas na nuvem. Sincronize antes de sair!";
    return e.returnValue;
  }
});

// Modal para gerenciar todo o conteúdo armazenado localmente
export async function openStorageManagerModal(defaultTab = "fichas") {
  logger.info("Modal: Abrindo gerenciador de armazenamento.");
  el.modalContainer.classList.remove("hidden");
  
  // Importar o worldState e helpers dinamicamente
  const { worldState, deleteRefugio, deleteRegiao, deleteConflito, deleteLocal, loadAllWorldData } = await import("./world-state.js");
  
  // Garantir que todos os dados do mundo estejam carregados na memória
  loadAllWorldData();

  let activeTab = defaultTab; // "fichas" | "mundo" | "homebrew" | "nuvem" | "backup"

  // Detectar se há configurações no .env / config para o Firebase
  const config = await getFirebaseConfig();
  state.useRealFirebase = !!config;

  // Carregar cache real se logado
  if (state.useRealFirebase && state.currentUser && cloudCharactersCache.length === 0) {
    try {
      const firebase = await initRealFirebase();
      if (firebase) {
        const { getDocs, collection, query, where } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const q = query(collection(firebase.db, "characters"), where("userId", "==", state.currentUser.uid));
        const snap = await getDocs(q);
        const cloudSheets = [];
        snap.forEach(d => cloudSheets.push(d.data()));
        cloudCharactersCache = cloudSheets;
      }
    } catch (e) {
      console.warn("Erro ao carregar dados do Firebase no cache:", e);
    }
  }

  // Função utilitária compartilhada para fazer o upload de qualquer ficha
  async function pushCharacterToCloud(char) {
    const stats = getCloudStorageInfo();
    const characterId = char.id;

    if (state.useRealFirebase) {
      try {
        const firebase = await initRealFirebase();
        if (!firebase) return;

        const { doc, setDoc, getDocs, collection, query, where } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

        // Buscar fichas atuais do Firestore para validação de limites
        const q = query(collection(firebase.db, "characters"), where("userId", "==", state.currentUser.uid));
        const snap = await getDocs(q);
        const cloudSheets = [];
        snap.forEach(d => cloudSheets.push(d.data()));

        const exists = cloudSheets.some(c => c.id === characterId);

        // Validação de limite de quantidade (máximo 5)
        if (!exists && cloudSheets.length >= stats.maxCount) {
          alert(`Erro de Limite: Você atingiu o limite de ${stats.maxCount} fichas salvas na nuvem. Apague uma ficha no Firestore antes de adicionar outra.`);
          renderContent();
          return;
        }

        // Validação de limite de espaço (máximo 100 KB)
        const updatedSheets = [...cloudSheets.filter(c => c.id !== characterId), char];
        const newSizeBytes = new Blob([JSON.stringify(updatedSheets)]).size;
        const newSizeKB = newSizeBytes / 1024;
        if (newSizeKB > stats.maxSizeKB) {
          alert(`Erro de Espaço: Limite de armazenamento de ${stats.maxSizeKB} KB excedido (tamanho necessário: ${newSizeKB.toFixed(2)} KB). Reduza o tamanho de anotações ou remova outras fichas.`);
          renderContent();
          return;
        }

        // Gravação no Firestore
        const docData = {
          ...char,
          userId: state.currentUser.uid,
          lastUpdated: Date.now()
        };
        await setDoc(doc(firebase.db, "characters", characterId), docData);

        // Atualiza cache e UI
        cloudCharactersCache = updatedSheets;
        if (state.currentCharacter && state.currentCharacter.id === characterId) {
          state.hasUnsavedCloudChanges = false;
          localStorage.setItem("assimilação_has_unsaved_changes", "false");
        }
        logger.info(`Sincronização Firestore: Ficha de "${char.name}" salva com sucesso.`);

        alert(`Ficha de "${char.name}" salva no Firestore com sucesso!`);
        renderContent();
        updateCloudSyncBadge();
      } catch (err) {
        logger.error("Erro ao salvar no Firestore:", err);
        alert("Erro ao gravar dados na nuvem real. Verifique sua conexão e regras do Firestore.");
        renderContent();
      }
    } else {
      // Modo simulado
      const db = getMockCloudDB();
      const uid = state.currentUser.uid;
      const userSheets = db[uid] || [];

      const existsIndex = userSheets.findIndex(c => c.id === characterId);

      const pendingSheets = [...userSheets];
      if (existsIndex !== -1) {
        pendingSheets[existsIndex] = char;
      } else {
        pendingSheets.push(char);
      }

      // Valida limite de quantidade
      if (existsIndex === -1 && userSheets.length >= stats.maxCount) {
        alert(`Erro de Limite: Você atingiu o limite de ${stats.maxCount} fichas salvas na nuvem. Apague uma ficha no banco antes de adicionar outra.`);
        renderContent();
        return;
      }

      // Valida limite de espaço (100 KB)
      const newSizeBytes = new Blob([JSON.stringify(pendingSheets)]).size;
      const newSizeKB = newSizeBytes / 1024;
      if (newSizeKB > stats.maxSizeKB) {
        alert(`Erro de Espaço: Limite de armazenamento de ${stats.maxSizeKB} KB excedido (tamanho necessário: ${newSizeKB.toFixed(2)} KB). Reduza o tamanho de anotações ou remova outras fichas.`);
        renderContent();
        return;
      }

      // Salva
      db[uid] = pendingSheets;
      saveMockCloudDB(db);

      if (state.currentCharacter && state.currentCharacter.id === characterId) {
        state.hasUnsavedCloudChanges = false;
        localStorage.setItem("assimilação_has_unsaved_changes", "false");
      }
      logger.info(`Sincronização: Ficha de "${char.name}" sincronizada com a nuvem.`);

      alert(`Ficha de "${char.name}" enviada com sucesso!`);
      renderContent();
      updateCloudSyncBadge();
    }
  }

  const renderContent = () => {
    let html = "";
    
    if (activeTab === "fichas") {
      html = `
        <h4 style="font-family:var(--font-heading); margin-bottom:12px; color:var(--text-primary);">Personagens Salvos (${state.characters.length})</h4>
        ${state.characters.length === 0 ? `
          <p style="font-size:var(--font-size-xs); color:var(--text-secondary);">Nenhum personagem salvo.</p>
        ` : `
          <div style="display:flex; flex-direction:column; gap:8px; max-height:300px; overflow-y:auto; padding-right:4px;">
            ${state.characters.map(char => `
              <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.02); padding:10px; border-radius:4px; border:1px solid rgba(255,255,255,0.05);">
                <div>
                  <div style="font-weight:600; color:var(--text-primary); font-size:var(--font-size-sm);">${char.name}</div>
                  <div style="font-size:var(--font-size-xs); color:var(--text-secondary);">${char.ocupacao || "Sem Ocupação"}</div>
                </div>
                <div style="display:flex; gap:6px;">
                  <button class="btn btn-sm btn-export-char" data-id="${char.id}" style="padding:4px 8px;">📥 Exportar</button>
                  <button class="btn btn-sm btn-danger btn-delete-char" data-id="${char.id}" style="padding:4px 8px;">❌ Excluir</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      `;
    } else if (activeTab === "mundo") {
      html = `
        <!-- Refúgios -->
        <h4 style="font-family:var(--font-heading); margin-bottom:8px; color:var(--color-blue-glow); font-size:var(--font-size-sm);">Refúgios (${worldState.refugios.length})</h4>
        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:16px; max-height:120px; overflow-y:auto; padding-right:4px;">
          ${worldState.refugios.length === 0 ? `<p style="font-size:var(--font-size-xs); color:var(--text-secondary);">Nenhum refúgio salvo.</p>` : 
            worldState.refugios.map(r => `
              <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.02); padding:6px; border-radius:4px; border:1px solid rgba(255,255,255,0.04);">
                <span style="font-size:var(--font-size-xs); color:var(--text-primary);">${r.nome}</span>
                <div style="display:flex; gap:6px;">
                  <button class="btn btn-xs btn-export-refugio" data-id="${r.id}" style="padding:2px 6px; font-size:10px;">📥 Exportar</button>
                  <button class="btn btn-xs btn-danger btn-delete-refugio" data-id="${r.id}" style="padding:2px 6px; font-size:10px;">❌ Excluir</button>
                </div>
              </div>
            `).join('')
          }
        </div>

        <!-- Regiões -->
        <h4 style="font-family:var(--font-heading); margin-bottom:8px; color:var(--color-conhecimentos); font-size:var(--font-size-sm);">Regiões (${worldState.regioes.length})</h4>
        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:16px; max-height:120px; overflow-y:auto; padding-right:4px;">
          ${worldState.regioes.length === 0 ? `<p style="font-size:var(--font-size-xs); color:var(--text-secondary);">Nenhuma região salva.</p>` : 
            worldState.regioes.map(r => `
              <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.02); padding:6px; border-radius:4px; border:1px solid rgba(255,255,255,0.04);">
                <span style="font-size:var(--font-size-xs); color:var(--text-primary);">${r.nome}</span>
                <div style="display:flex; gap:6px;">
                  <button class="btn btn-xs btn-export-regiao" data-id="${r.id}" style="padding:2px 6px; font-size:10px;">📥 Exportar</button>
                  <button class="btn btn-xs btn-danger btn-delete-regiao" data-id="${r.id}" style="padding:2px 6px; font-size:10px;">❌ Excluir</button>
                </div>
              </div>
            `).join('')
          }
        </div>

        <!-- Conflitos -->
        <h4 style="font-family:var(--font-heading); margin-bottom:8px; color:var(--color-danger); font-size:var(--font-size-sm);">Conflitos (${worldState.conflitos.length})</h4>
        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:16px; max-height:120px; overflow-y:auto; padding-right:4px;">
          ${worldState.conflitos.length === 0 ? `<p style="font-size:var(--font-size-xs); color:var(--text-secondary);">Nenhum conflito salvo.</p>` : 
            worldState.conflitos.map(c => `
              <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.02); padding:6px; border-radius:4px; border:1px solid rgba(255,255,255,0.04);">
                <span style="font-size:var(--font-size-xs); color:var(--text-primary);">${c.nome}</span>
                <div style="display:flex; gap:6px;">
                  <button class="btn btn-xs btn-export-conflito" data-id="${c.id}" style="padding:2px 6px; font-size:10px;">📥 Exportar</button>
                  <button class="btn btn-xs btn-danger btn-delete-conflito" data-id="${c.id}" style="padding:2px 6px; font-size:10px;">❌ Excluir</button>
                </div>
              </div>
            `).join('')
          }
        </div>

        <!-- Locais -->
        <h4 style="font-family:var(--font-heading); margin-bottom:8px; color:var(--color-praticas); font-size:var(--font-size-sm);">Locais (${worldState.locais.length})</h4>
        <div style="display:flex; flex-direction:column; gap:6px; max-height:120px; overflow-y:auto; padding-right:4px;">
          ${worldState.locais.length === 0 ? `<p style="font-size:var(--font-size-xs); color:var(--text-secondary);">Nenhum local salvo.</p>` : 
            worldState.locais.map(l => `
              <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.02); padding:6px; border-radius:4px; border:1px solid rgba(255,255,255,0.04);">
                <span style="font-size:var(--font-size-xs); color:var(--text-primary);">${l.nome}</span>
                <div style="display:flex; gap:6px;">
                  <button class="btn btn-xs btn-export-local" data-id="${l.id}" style="padding:2px 6px; font-size:10px;">📥 Exportar</button>
                  <button class="btn btn-xs btn-danger btn-delete-local" data-id="${l.id}" style="padding:2px 6px; font-size:10px;">❌ Excluir</button>
                </div>
              </div>
            `).join('')
          }
        </div>
      `;
    } else if (activeTab === "homebrew") {
      const customTraits = getCustomTraits();
      const customMutations = getCustomMutations();
      
      html = `
        <!-- Características Homebrew -->
        <h4 style="font-family:var(--font-heading); margin-bottom:8px; color:var(--text-primary); font-size:var(--font-size-sm);">Características Customizadas (${customTraits.length})</h4>
        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:16px; max-height:150px; overflow-y:auto; padding-right:4px;">
          ${customTraits.length === 0 ? `<p style="font-size:var(--font-size-xs); color:var(--text-secondary);">Nenhuma característica criada.</p>` : 
            customTraits.map((t, idx) => `
              <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.02); padding:6px; border-radius:4px; border:1px solid rgba(255,255,255,0.04);">
                <div>
                  <span style="font-size:var(--font-size-xs); font-weight:600; color:var(--text-primary);">${t.nome}</span>
                  <small style="font-size:10px; color:var(--text-secondary); margin-left:6px;">(Custo: ${t.custo} XP)</small>
                </div>
                <button class="btn btn-xs btn-danger btn-delete-custom-trait" data-idx="${idx}" style="padding:2px 6px; font-size:10px;">❌ Excluir</button>
              </div>
            `).join('')
          }
        </div>

        <!-- Mutações Homebrew -->
        <h4 style="font-family:var(--font-heading); margin-bottom:8px; color:var(--text-primary); font-size:var(--font-size-sm);">Mutações Customizadas (${customMutations.length})</h4>
        <div style="display:flex; flex-direction:column; gap:6px; max-height:150px; overflow-y:auto; padding-right:4px;">
          ${customMutations.length === 0 ? `<p style="font-size:var(--font-size-xs); color:var(--text-secondary);">Nenhuma mutação criada.</p>` : 
            customMutations.map((m, idx) => `
              <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.02); padding:6px; border-radius:4px; border:1px solid rgba(255,255,255,0.04);">
                <div>
                  <span style="font-size:var(--font-size-xs); font-weight:600; color:var(--text-primary);">${m.name}</span>
                  <small style="font-size:10px; color:var(--text-secondary); margin-left:6px;">(${m.suit.toUpperCase()})</small>
                </div>
                <button class="btn btn-xs btn-danger btn-delete-custom-mutation" data-idx="${idx}" style="padding:2px 6px; font-size:10px;">❌ Excluir</button>
              </div>
            `).join('')
          }
        </div>
      `;
    } else if (activeTab === "nuvem") {
      if (!state.currentUser) {
        html = `
          <h4 style="font-family:var(--font-heading); margin-bottom:12px; color:var(--text-primary);">Sincronização em Nuvem</h4>
          <div style="text-align: center; padding: 20px 0;">
            <div style="font-size: 40px; margin-bottom: 16px; color: var(--color-blue-glow);">☁️</div>
            <p style="font-size: var(--font-size-sm); color: var(--text-primary); margin-bottom: 8px;">Salve suas fichas na nuvem de forma segura.</p>
            <p style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-bottom: 20px; max-width: 320px; margin-left: auto; margin-right: auto; line-height: 1.4;">
              Conecte-se com sua conta Google para enviar suas fichas locais e acessá-las em qualquer outro navegador ou dispositivo móvel.
            </p>
            
            <button id="btn-google-sign-in" class="btn" style="background: #fff; color: #1f1f1f; border-color: #fff; padding: 10px 20px; font-weight: bold; border-radius: 4px; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.9c1.7-1.56 2.69-3.86 2.69-6.57zm-8.64 6.8c1.89 0 3.48-.63(4.64)-1.7l-2.9-2.24c-.8.54-1.84.86-2.9.86-2.23 0-4.12-1.51-4.8-3.53H.07v2.32C1.23 14 5.02 16 9 16zm-4.8-7.93c-.17-.5-.26-1.03-.26-1.57s.09-1.07.26-1.57V2.63H.07C-.48 3.74-.8 4.97-.8 6.28s.32 2.54.87 3.65l3.27-2.53zm4.8-4.87c1.03 0 1.95.35 2.68 1.05l2.01-2.01C11.53.86 9.89.5 9 .5 5.02.5 1.23 2.5.07 6.28l3.27 2.53c.68-2.02 2.57-3.53 4.8-3.53z" fill="#4285F4"/>
              </svg>
              Entrar com o Google
            </button>
          </div>
        `;
      } else {
        const stats = getCloudStorageInfo();
        const sizePercent = Math.min(100, (stats.sizeKB / stats.maxSizeKB) * 100);
        const countPercent = Math.min(100, (stats.count / stats.maxCount) * 100);

        // Listar outros personagens locais para enviar
        const otherCharacters = state.characters.filter(c => !state.currentCharacter || c.id !== state.currentCharacter.id);
        let otherCharactersHtml = "";
        if (otherCharacters.length > 0) {
          otherCharactersHtml = `
            <div style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px; text-align: left;">
              <h5 style="font-size: 11px; margin-bottom: 8px; color: var(--text-primary); text-transform: uppercase; font-family:var(--font-heading);">Enviar Outras Fichas</h5>
              <div style="display:flex; flex-direction:column; gap:6px;">
                ${otherCharacters.map(char => `
                  <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.02); padding:6px; border-radius:4px; border:1px solid rgba(255,255,255,0.04);">
                    <span style="font-size:11px; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:160px;">${char.name}</span>
                    <button class="btn btn-xs btn-cloud-push-other" data-char-id="${char.id}" style="padding:2px 6px; font-size:10px; border-color:var(--color-blue-glow); color:var(--color-blue-glow); background:rgba(0,162,255,0.04); cursor:pointer;">
                      📤 Enviar
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
        
          let cloudCharactersHtml = "";
          if (cloudCharactersCache && cloudCharactersCache.length > 0) {
            cloudCharactersHtml = `
              <div style="margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px; text-align: left;">
                <h5 style="font-size: 11px; margin-bottom: 8px; color: var(--text-primary); text-transform: uppercase; font-family:var(--font-heading);">Fichas na Nuvem</h5>
                <div style="display:flex; flex-direction:column; gap:6px;">
                  ${cloudCharactersCache.map(char => `
                    <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.02); padding:6px; border-radius:4px; border:1px solid rgba(255,255,255,0.04);">
                      <span style="font-size:11px; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:160px;">${char.name}</span>
                      <button class="btn btn-xs btn-cloud-delete-char" data-char-id="${char.id}" style="padding:2px 6px; font-size:10px; border-color:var(--color-danger); color:var(--color-danger); background:rgba(239,68,68,0.04); cursor:pointer;">
                        🗑️ Apagar
                      </button>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }

          html = `
          <!-- Perfil do Usuário -->
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px; background:rgba(255,255,255,0.04); padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
            <div style="width:36px; height:36px; border-radius:50%; background:var(--color-blue-glow); display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:16px; color:#fff;">
              ${state.currentUser.displayName.charAt(0).toUpperCase()}
            </div>
            <div style="flex:1; text-align:left;">
              <div style="font-weight:600; color:var(--text-primary); font-size:var(--font-size-sm);">${state.currentUser.displayName}</div>
              <div style="font-size:10px; color:var(--text-secondary);">${state.currentUser.email}</div>
            </div>
            <button id="btn-google-sign-out" class="btn btn-xs btn-danger" style="padding: 4px 8px;">Sair</button>
          </div>

          <!-- Status de Sincronização -->
          ${state.hasUnsavedCloudChanges ? `
            <div style="background:rgba(255, 102, 0, 0.08); border:1px solid var(--color-orange); color:var(--color-orange); padding:8px; border-radius:4px; font-size:11px; margin-bottom:16px; display:flex; align-items:center; gap:6px;">
              <span>⚠️</span>
              <span>Modificações pendentes de envio!</span>
            </div>
          ` : `
            <div style="background:rgba(0, 255, 102, 0.05); border:1px solid var(--color-praticas); color:var(--color-praticas); padding:8px; border-radius:4px; font-size:11px; margin-bottom:16px; display:flex; align-items:center; gap:6px;">
              <span>✔️</span>
              <span>Sincronizado com o Firebase</span>
            </div>
          `}

          <!-- Limites de Armazenamento -->
          <div style="margin-bottom:10px; text-align:left;">
            <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-secondary); margin-bottom:2px;">
              <span>Espaço:</span>
              <strong>${stats.sizeKB.toFixed(2)} KB / ${stats.maxSizeKB} KB</strong>
            </div>
            <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
              <div style="width:${sizePercent}%; height:100%; background:var(--color-blue-glow);"></div>
            </div>
          </div>

          <div style="margin-bottom:16px; text-align:left;">
            <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-secondary); margin-bottom:2px;">
              <span>Fichas na Nuvem:</span>
              <strong>${stats.count} / ${stats.maxCount}</strong>
            </div>
            <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
              <div style="width:${countPercent}%; height:100%; background:var(--color-blue-glow);"></div>
            </div>
          </div>

          <!-- Ações principais -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
            <button id="btn-cloud-push" class="btn" style="border-color: var(--color-blue-glow); color: var(--color-blue-glow); font-weight: bold; background: rgba(0,162,255,0.05); padding: 8px; font-size:11px; cursor:pointer;">
              📤 Enviar Atual
            </button>
            <button id="btn-cloud-pull" class="btn" style="border-color: var(--color-praticas); color: var(--color-praticas); font-weight: bold; background: rgba(0,255,102,0.05); padding: 8px; font-size:11px; cursor:pointer;">
              📥 Puxar Nuvem
            </button>
          </div>

          <!-- Listagem da Nuvem -->
          ${cloudCharactersHtml}

          <!-- Outras Fichas -->
          ${otherCharactersHtml}
        `;
      }
    } else if (activeTab === "backup") {
      html = `
        <h4 style="font-family:var(--font-heading); margin-bottom:12px; color:var(--text-primary);">Backup e Importação Completa</h4>
        <p style="font-size:var(--font-size-xs); color:var(--text-secondary); margin-bottom:20px; line-height:1.4;">
          Exporte absolutamente tudo do seu jogo (todas as fichas de personagens, refúgios, regiões, conflitos, locais e customizações de homebrew) em um único arquivo de backup completo, ou restaure um backup existente.
        </p>

        <!-- Botões de Ação de Backup -->
        <div style="display:grid; grid-template-columns:1fr; gap:12px; margin-bottom:24px;">
          <button id="btn-export-all-backup" class="btn btn-block" style="border-color:var(--color-blue-glow); color:var(--color-blue-glow); background:rgba(0,162,255,0.05); padding:10px; font-weight:bold;">
            📤 Exportar Backup Completo (.JSON)
          </button>
          
          <button id="btn-trigger-import-backup" class="btn btn-block" style="border-color:var(--color-praticas); color:var(--color-praticas); background:rgba(0,255,102,0.05); padding:10px; font-weight:bold;">
            📥 Importar Backup Completo (.JSON)
          </button>
          <input type="file" id="file-import-all-backup" accept=".json" style="display:none;">
        </div>

        <h4 style="font-family:var(--font-heading); margin-bottom:8px; color:var(--color-danger); font-size:var(--font-size-sm);">Zona de Risco</h4>
        <div style="background:rgba(239,68,68,0.08); border:1px solid var(--color-danger); padding:12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
          <div style="flex:1; padding-right:12px;">
            <div style="font-size:var(--font-size-xs); font-weight:bold; color:#fff; margin-bottom:2px;">Apagar Tudo do Navegador</div>
            <div style="font-size:10px; color:var(--text-secondary);">Isso limpará absolutamente todas as fichas locais, dados do mundo, e homebrews permanentemente.</div>
          </div>
          <button id="btn-wipe-everything" class="btn btn-danger btn-sm" style="white-space:nowrap;">Limpar Tudo</button>
        </div>
      `;
    }

    el.modalBody.innerHTML = `
      <h3 class="modal-title">Gerenciador de Armazenamento</h3>
      
      <!-- Tab Bar -->
      <div class="lib-tab-bar" style="margin-top:16px; margin-bottom:16px;">
        <button class="lib-tab ${activeTab === 'fichas' ? 'active' : ''}" data-tab="fichas">👤 Fichas</button>
        <button class="lib-tab ${activeTab === 'mundo' ? 'active' : ''}" data-tab="mundo">🌍 Mundo</button>
        <button class="lib-tab ${activeTab === 'homebrew' ? 'active' : ''}" data-tab="homebrew">🧪 Custom</button>
        <button class="lib-tab ${activeTab === 'nuvem' ? 'active' : ''}" data-tab="nuvem">☁️ Nuvem</button>
        <button class="lib-tab ${activeTab === 'backup' ? 'active' : ''}" data-tab="backup">💾 Backup</button>
      </div>

      <!-- Tab Content Area -->
      <div class="storage-tab-content-container" style="min-height:280px; margin-bottom:20px;">
        ${html}
      </div>

      <!-- Footer -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.08); padding-top:16px;">
        <button id="btn-back-to-settings" class="btn btn-md btn-secondary">Voltar</button>
        <button id="btn-close-storage-manager" class="btn btn-md">Fechar</button>
      </div>
    `;

    // Reassociar eventos de Abas
    el.modalBody.querySelectorAll(".lib-tab").forEach(tabBtn => {
      tabBtn.addEventListener("click", () => {
        activeTab = tabBtn.getAttribute("data-tab");
        renderContent();
      });
    });

    // Eventos do rodapé
    document.getElementById("btn-back-to-settings").addEventListener("click", () => {
      openSettingsModal();
    });
    document.getElementById("btn-close-storage-manager").addEventListener("click", () => {
      el.modalContainer.classList.add("hidden");
    });

    // Eventos da aba Fichas
    if (activeTab === "fichas") {
      el.modalBody.querySelectorAll(".btn-export-char").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const char = state.characters.find(c => c.id === id);
          if (!char) return;
          const blob = new Blob([JSON.stringify(char, null, 2)], { type: "application/json" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${char.name.toLowerCase().replace(/\s+/g, "_")}_ficha.json`;
          a.click();
        });
      });

      el.modalBody.querySelectorAll(".btn-delete-char").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const char = state.characters.find(c => c.id === id);
          if (!char) return;
          if (confirm(`Tem certeza de que deseja excluir a ficha de ${char.name}? Esta ação não pode ser desfeita.`)) {
            const index = state.characters.findIndex(c => c.id === id);
            if (index !== -1) {
              state.characters.splice(index, 1);
              localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
              
              if (state.currentCharacter && state.currentCharacter.id === id) {
                if (state.characters.length > 0) {
                  import("./state.js").then(({ loadCharacter }) => loadCharacter(state.characters[0].id));
                } else {
                  state.currentCharacter = null;
                  window.location.reload(); // Recarrega para voltar à tela inicial limpa
                  return;
                }
              }
              import("./state.js").then(({ updateCharSelector }) => updateCharSelector());
              renderContent();
            }
          }
        });
      });
    }

    // Eventos da aba Mundo
    if (activeTab === "mundo") {
      const setupWorldEvents = (selectorExport, selectorDelete, arrayProp, deleteFn, filenamePrefix) => {
        el.modalBody.querySelectorAll(selectorExport).forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const item = worldState[arrayProp].find(i => i.id === id);
            if (!item) return;
            const blob = new Blob([JSON.stringify(item, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${filenamePrefix}_${item.nome.toLowerCase().replace(/\s+/g, "_")}.json`;
            a.click();
          });
        });

        el.modalBody.querySelectorAll(selectorDelete).forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const item = worldState[arrayProp].find(i => i.id === id);
            if (!item) return;
            if (confirm(`Tem certeza de que deseja deletar "${item.nome}"? Esta ação não pode ser desfeita.`)) {
              deleteFn(id);
              renderContent();
            }
          });
        });
      };

      setupWorldEvents(".btn-export-refugio", ".btn-delete-refugio", "refugios", deleteRefugio, "refugio");
      setupWorldEvents(".btn-export-regiao", ".btn-delete-regiao", "regioes", deleteRegiao, "regiao");
      setupWorldEvents(".btn-export-conflito", ".btn-delete-conflito", "conflitos", deleteConflito, "conflito");
      setupWorldEvents(".btn-export-local", ".btn-delete-local", "locais", deleteLocal, "local");
    }

    // Eventos da aba Homebrew
    if (activeTab === "homebrew") {
      el.modalBody.querySelectorAll(".btn-delete-custom-trait").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.getAttribute("data-idx"), 10);
          const traits = getCustomTraits();
          const name = traits[idx]?.nome;
          if (confirm(`Tem certeza de que deseja excluir a característica customizada "${name}"?`)) {
            traits.splice(idx, 1);
            localStorage.setItem("assimilação_homebrew_traits", JSON.stringify(traits));
            import("./sheet.js").then(({ renderHomebrewSheet }) => renderHomebrewSheet());
            renderContent();
          }
        });
      });

      el.modalBody.querySelectorAll(".btn-delete-custom-mutation").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.getAttribute("data-idx"), 10);
          const mutations = getCustomMutations();
          const name = mutations[idx]?.name;
          if (confirm(`Tem certeza de que deseja excluir a mutação customizada "${name}"?`)) {
            mutations.splice(idx, 1);
            localStorage.setItem("assimilação_homebrew_mutations", JSON.stringify(mutations));
            import("./sheet.js").then(({ renderHomebrewSheet }) => renderHomebrewSheet());
            renderContent();
          }
        });
      });
    }

    // Eventos da aba Nuvem
    if (activeTab === "nuvem") {
      const btnSignIn = document.getElementById("btn-google-sign-in");
      if (btnSignIn) {
        btnSignIn.addEventListener("click", async () => {
          if (state.useRealFirebase) {
            try {
              const firebase = await initRealFirebase();
              if (firebase) {
                const { signInWithPopup, GoogleAuthProvider } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(firebase.auth, provider);
                
                state.currentUser = {
                  uid: result.user.uid,
                  displayName: result.user.displayName,
                  email: result.user.email
                };
                localStorage.setItem("assimilação_mock_user", JSON.stringify(state.currentUser));
                logger.info(`Autenticação: Logado via Google (Real) - ${state.currentUser.displayName}`);
                
                // Recarregar cache
                const { getDocs, collection, query, where } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                const q = query(collection(firebase.db, "characters"), where("userId", "==", state.currentUser.uid));
                const snap = await getDocs(q);
                const cloudSheets = [];
                snap.forEach(d => cloudSheets.push(d.data()));
                cloudCharactersCache = cloudSheets;
                
                renderContent();
                updateCloudSyncBadge();
              }
            } catch (error) {
              logger.error("Erro no login real do Google:", error);
              alert("Falha no login com Google. Verifique seu arquivo .env.");
            }
          } else {
            const name = prompt("Digite seu nome para simular o login do Google:", "Jogador Assimilado");
            if (name === null) return;
            const email = prompt("Digite seu e-mail do Google:", "jogador@gmail.com");
            if (!email) return;
            
            const mockUser = {
              uid: "google_user_" + Math.random().toString(36).substr(2, 9),
              displayName: name,
              email: email
            };
            
            state.currentUser = mockUser;
            localStorage.setItem("assimilação_mock_user", JSON.stringify(mockUser));
            logger.info("Autenticação: Login efetuado com sucesso via conta Google (Simulado).");
            renderContent();
            updateCloudSyncBadge();
          }
        });
      }

      el.modalBody.querySelectorAll(".btn-cloud-delete-char").forEach(btn => {
        btn.addEventListener("click", async () => {
          const charId = btn.getAttribute("data-char-id");
          const char = cloudCharactersCache.find(c => c.id === charId);
          if (!char) return;

          if (!confirm(`Tem certeza que deseja apagar a ficha de "${char.name}" da NUVEM? Esta ação é irreversível e NÃO afetará a sua ficha local.`)) {
            return;
          }

          btn.disabled = true;
          btn.textContent = "Apagando...";

          try {
            if (state.useRealFirebase) {
              const firebase = await initRealFirebase();
              if (firebase) {
                const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                await deleteDoc(doc(firebase.db, "characters", charId));
              }
            } else {
              const db = getMockCloudDB();
              const uid = state.currentUser.uid;
              if (db[uid]) {
                db[uid] = db[uid].filter(c => c.id !== charId);
                saveMockCloudDB(db);
              }
            }

            // Atualiza o cache local
            cloudCharactersCache = cloudCharactersCache.filter(c => c.id !== charId);
            renderContent();
            updateCloudSyncBadge();
          } catch (e) {
            logger.error("Erro ao apagar ficha da nuvem", e);
            alert("Erro ao apagar a ficha. Tente novamente.");
            btn.disabled = false;
            btn.textContent = "🗑️ Apagar";
          }
        });
      });

      const btnSignOut = document.getElementById("btn-google-sign-out");
      if (btnSignOut) {
        btnSignOut.addEventListener("click", async () => {
          if (confirm("Tem certeza que deseja sair de sua conta Google? Suas fichas locais permanecerão salvas no navegador.")) {
            if (state.useRealFirebase) {
              try {
                const firebase = await initRealFirebase();
                if (firebase) {
                  const { signOut } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
                  await signOut(firebase.auth);
                }
              } catch (e) {
                console.error("Erro ao deslogar do Firebase:", e);
              }
            }
            state.currentUser = null;
            state.hasUnsavedCloudChanges = false;
            cloudCharactersCache = [];
            localStorage.removeItem("assimilação_mock_user");
            localStorage.removeItem("assimilação_has_unsaved_changes");
            logger.info("Autenticação: Desconexão efetuada.");
            renderContent();
            updateCloudSyncBadge();
          }
        });
      }

      const btnPush = document.getElementById("btn-cloud-push");
      if (btnPush) {
        btnPush.addEventListener("click", async () => {
          if (!state.currentCharacter) {
            alert("Crie ou selecione um personagem primeiro!");
            return;
          }
          btnPush.disabled = true;
          btnPush.textContent = "⌛ Enviando...";
          await pushCharacterToCloud(state.currentCharacter);
        });
      }

      const btnPull = document.getElementById("btn-cloud-pull");
      if (btnPull) {
        btnPull.addEventListener("click", async () => {
          let cloudSheets = [];
          btnPull.disabled = true;
          btnPull.textContent = "⌛ Carregando...";

          if (state.useRealFirebase) {
            try {
              const firebase = await initRealFirebase();
              if (!firebase) { btnPull.disabled = false; btnPull.textContent = "📥 Puxar da Nuvem"; return; }

              const { getDocs, collection, query, where } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
              const q = query(collection(firebase.db, "characters"), where("userId", "==", state.currentUser.uid));
              const snap = await getDocs(q);
              snap.forEach(d => cloudSheets.push(d.data()));
              cloudCharactersCache = cloudSheets;
            } catch (err) {
              logger.error("Erro ao puxar dados do Firestore:", err);
              alert("Não foi possível conectar ao Firestore. Verifique seu arquivo .env.");
              btnPull.disabled = false;
              btnPull.textContent = "📥 Puxar da Nuvem";
              return;
            }
          } else {
            const db = getMockCloudDB();
            const uid = state.currentUser.uid;
            cloudSheets = db[uid] || [];
          }

          if (cloudSheets.length === 0) {
            alert("Nenhuma ficha encontrada na nuvem para esta conta.");
            btnPull.disabled = false;
            btnPull.textContent = "📥 Puxar da Nuvem";
            return;
          }

          if (confirm(`Encontramos ${cloudSheets.length} fichas na nuvem. Deseja importá-las? Fichas locais com o mesmo ID serão substituídas.`)) {
            cloudSheets.forEach(cloudChar => {
              const localIndex = state.characters.findIndex(c => c.id === cloudChar.id);
              if (localIndex !== -1) {
                state.characters[localIndex] = cloudChar;
              } else {
                state.characters.push(cloudChar);
              }
            });

            localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
            import("./state.js").then(({ updateCharSelector, loadCharacter }) => {
              updateCharSelector();
              if (state.currentCharacter) {
                const reloadedChar = state.characters.find(c => c.id === state.currentCharacter.id);
                if (reloadedChar) loadCharacter(reloadedChar.id);
              } else if (state.characters.length > 0) {
                loadCharacter(state.characters[0].id);
              }
            });

            state.hasUnsavedCloudChanges = false;
            localStorage.setItem("assimilação_has_unsaved_changes", "false");
            logger.info("Sincronização: Fichas carregadas da nuvem.");
            alert("Fichas importadas da nuvem com sucesso!");
            renderContent();
            updateCloudSyncBadge();
          } else {
            btnPull.disabled = false;
            btnPull.textContent = "📥 Puxar da Nuvem";
          }
        });
      }

      // Eventos para botões das outras fichas locais
      document.querySelectorAll(".btn-cloud-push-other").forEach(btn => {
        btn.addEventListener("click", async () => {
          const charId = btn.getAttribute("data-char-id");
          const char = state.characters.find(c => c.id === charId);
          if (!char) return;
          
          btn.disabled = true;
          btn.textContent = "⌛ Enviando...";
          await pushCharacterToCloud(char);
        });
      });
    }

    // Eventos da aba Backup
    if (activeTab === "backup") {
      document.getElementById("btn-export-all-backup").addEventListener("click", () => {
        const backup = {
          format: "assimilacao_full_backup",
          version: 1,
          timestamp: Date.now(),
          characters: state.characters,
          refugios: worldState.refugios,
          regioes: worldState.regioes,
          conflitos: worldState.conflitos,
          locais: worldState.locais,
          traits: getCustomTraits(),
          mutations: getCustomMutations()
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `backup_completo_assimilacao_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
      });

      const fileInput = document.getElementById("file-import-all-backup");
      document.getElementById("btn-trigger-import-backup").addEventListener("click", () => {
        fileInput.click();
      });

      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = JSON.parse(evt.target.result);
            if (data.format !== "assimilacao_full_backup") {
              alert("Formato de arquivo inválido! Por favor, selecione um arquivo de backup do Assimilação RPG.");
              return;
            }

            if (confirm("Esta importação irá mesclar os dados importados com os seus dados locais existentes. Deseja prosseguir?")) {
              // Mesclar Personagens
              if (data.characters && Array.isArray(data.characters)) {
                data.characters.forEach(char => {
                  const existingIdx = state.characters.findIndex(c => c.id === char.id);
                  if (existingIdx !== -1) {
                    state.characters[existingIdx] = char;
                  } else {
                    state.characters.push(char);
                  }
                });
                localStorage.setItem("assimilação_rpg_characters", JSON.stringify(state.characters));
              }

              // Mesclar Mundo (Refúgios, Regiões, Conflitos, Locais)
              const mergeWorld = (importList, localList, storageKey) => {
                if (importList && Array.isArray(importList)) {
                  importList.forEach(item => {
                    const existingIdx = localList.findIndex(i => i.id === item.id);
                    if (existingIdx !== -1) {
                      localList[existingIdx] = item;
                    } else {
                      localList.push(item);
                    }
                  });
                  localStorage.setItem(storageKey, JSON.stringify(localList));
                }
              };

              mergeWorld(data.refugios, worldState.refugios, "assimilação_rpg_refugios");
              mergeWorld(data.regioes, worldState.regioes, "assimilação_rpg_regioes");
              mergeWorld(data.conflitos, worldState.conflitos, "assimilação_rpg_conflitos");
              mergeWorld(data.locais, worldState.locais, "assimilação_rpg_locais");

              // Mesclar Homebrew
              if (data.traits && Array.isArray(data.traits)) {
                const existing = getCustomTraits();
                const merged = [...existing, ...data.traits.filter(t => !existing.some(et => et.id === t.id))];
                localStorage.setItem("assimilação_homebrew_traits", JSON.stringify(merged));
              }
              if (data.mutations && Array.isArray(data.mutations)) {
                const existing = getCustomMutations();
                const merged = [...existing, ...data.mutations.filter(m => !existing.some(em => em.id === m.id))];
                localStorage.setItem("assimilação_homebrew_mutations", JSON.stringify(merged));
              }

              alert("Backup importado e mesclado com sucesso! O aplicativo será recarregado.");
              window.location.reload();
            }
          } catch (err) {
            alert("Erro ao ler o arquivo de backup: " + err.message);
          }
        };
        reader.readAsText(file);
      });

      document.getElementById("btn-wipe-everything").addEventListener("click", () => {
        if (confirm("⚠️ ATENÇÃO EXTREMA: Você está prestes a deletar ABSOLUTAMENTE TUDO (personagens, fichas, mundos, refúgios, homebrew). Esta ação é permanente e NÃO PODE ser desfeita. Tem certeza absoluta?")) {
          localStorage.clear();
          sessionStorage.clear();
          alert("Todos os dados foram apagados com sucesso.");
          window.location.reload();
        }
      });
    }
  };

  renderContent();
}

// Ouvinte do evento beforeunload para alertar antes de fechar a aba
window.addEventListener("beforeunload", (e) => {
  if (state.currentUser && state.hasUnsavedCloudChanges) {
    e.preventDefault();
    e.returnValue = "Você possui alterações na ficha que não foram salvas na nuvem. Sincronize antes de sair!";
    return e.returnValue;
  }
});

// ==========================================
// MODAL: EXPORTAR FICHA
// ==========================================
export function openExportModal() {
  if (!el.modalContainer || !el.modalBody) return;
  el.modalContainer.classList.remove("hidden");

  const chars = state.characters || [];
  const listHtml = chars.length === 0
    ? `<div class="world-list-empty" style="padding:20px;text-align:center;color:var(--text-muted);">Nenhuma ficha salva.</div>`
    : chars.map(char => `
      <div class="world-list-item" style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;margin-bottom:6px;">
        <span style="font-weight:600;font-size:var(--font-size-md);">${esc(char.name)}</span>
        <button class="btn btn-sm btn-blue btn-export-char-modal" data-id="${char.id}" style="white-space:nowrap;">Exportar</button>
      </div>
    `).join("");

  el.modalBody.innerHTML = `
    <div class="settings-modal-content card-glass">
      <h3 class="modal-title">Exportar Ficha</h3>
      <div style="margin-top:12px;font-size:var(--font-size-sm);color:var(--text-secondary);margin-bottom:12px;">
        Selecione a ficha que deseja exportar como arquivo JSON.
      </div>
      <div style="max-height:400px;overflow-y:auto;">
        ${listHtml}
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:16px;">
        <button id="btn-close-export-modal" class="btn btn-md">Fechar</button>
      </div>
    </div>
  `;

  el.modalBody.querySelectorAll(".btn-export-char-modal").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const char = state.characters.find(c => c.id === id);
      if (!char) return;
      const blob = new Blob([JSON.stringify(char, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${char.name.toLowerCase().replace(/\s+/g, "_")}_ficha.json`;
      a.click();
    });
  });

  const closeBtn = el.modalContainer.querySelector(".modal-close");
  if (closeBtn) closeBtn.onclick = () => el.modalContainer.classList.add("hidden");
  document.getElementById("btn-close-export-modal").onclick = () => el.modalContainer.classList.add("hidden");
  el.modalContainer.onclick = (e) => { if (e.target === el.modalContainer) el.modalContainer.classList.add("hidden"); };
}

// ==========================================
// MODAL: GERENCIAR BANCO DE ITENS
// ==========================================
export function openManageItemsModal() {
  if (!el.modalContainer || !el.modalBody) return;
  el.modalContainer.classList.remove("hidden");
  
  function renderList() {
    const items = worldState.itensDb || [];
    el.modalBody.innerHTML = `
      <h3 class="modal-title" style="margin-bottom: 16px;">Gerenciar Banco de Itens</h3>
      <div class="manage-items-form" style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.1);">
        <input type="text" id="manage-item-name" class="ws-input" placeholder="Nome do Item" style="width:100%; background:#222; border:1px solid rgba(255,255,255,0.1); color:#fff; padding:8px; border-radius:4px;">
        <div style="display:flex; gap:8px;">
          <input type="number" id="manage-item-escassez" class="ws-input" placeholder="Escassez (ex: 2)" style="flex:1; background:#222; border:1px solid rgba(255,255,255,0.1); color:#fff; padding:8px; border-radius:4px;">
          <input type="number" id="manage-item-peso" class="ws-input" placeholder="Peso (ex: 1)" style="flex:1; background:#222; border:1px solid rgba(255,255,255,0.1); color:#fff; padding:8px; border-radius:4px;">
        </div>
        <input type="text" id="manage-item-categoria" class="ws-input" placeholder="Categoria (opcional, separadas por vírgula)" style="width:100%; background:#222; border:1px solid rgba(255,255,255,0.1); color:#fff; padding:8px; border-radius:4px;">
        <textarea id="manage-item-efeito" class="ws-textarea" placeholder="Efeito / Descrição" style="width:100%; height:60px; background:#222; border:1px solid rgba(255,255,255,0.1); color:#fff; padding:8px; border-radius:4px;"></textarea>
        <button id="btn-save-manage-item" class="btn btn-success" style="padding:10px;">Salvar Item</button>
      </div>
      <div class="manage-items-list" style="max-height: 40vh; overflow-y: auto;">
        ${items.map((it, idx) => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:rgba(0,0,0,0.3); margin-bottom:4px; border-radius:4px;">
            <div>
              <div style="font-weight:bold; font-size:14px; color:#fff;">${esc(it.name)}</div>
              <div style="font-size:11px; color:#aaa;">Escassez: ${it.escassez} | Categorias: ${it.categorias ? it.categorias.join(", ") : ''}</div>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-sm btn-edit-item" data-idx="${idx}">Editar</button>
              <button class="btn btn-sm btn-danger btn-delete-item" data-idx="${idx}">Excluir</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    document.getElementById("btn-save-manage-item").addEventListener("click", () => {
      const name = document.getElementById("manage-item-name").value.trim();
      if (!name) return;
      const itemToSave = {
        name: name,
        escassez: parseInt(document.getElementById("manage-item-escassez").value) || 0,
        peso: parseInt(document.getElementById("manage-item-peso").value) || 1,
        categorias: document.getElementById("manage-item-categoria").value.split(",").map(c => c.trim()).filter(c => c),
        efeito: document.getElementById("manage-item-efeito").value.trim()
      };
      
      saveItemToDb(itemToSave);
      renderList();
    });

    el.modalBody.querySelectorAll(".btn-edit-item").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = e.target.getAttribute("data-idx");
        const it = worldState.itensDb[idx];
        if (it) {
          document.getElementById("manage-item-name").value = it.name;
          document.getElementById("manage-item-escassez").value = it.escassez !== undefined ? it.escassez : "";
          document.getElementById("manage-item-peso").value = it.peso !== undefined ? it.peso : "";
          document.getElementById("manage-item-categoria").value = it.categorias ? it.categorias.join(", ") : (it.categoria || "");
          document.getElementById("manage-item-efeito").value = it.efeito || "";
        }
      });
    });

    el.modalBody.querySelectorAll(".btn-delete-item").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = e.target.getAttribute("data-idx");
        if (confirm("Tem certeza que deseja excluir este item permanentemente do banco de dados?")) {
          worldState.itensDb.splice(idx, 1);
          localStorage.setItem("assimilação_rpg_itens_db", JSON.stringify(worldState.itensDb));
          renderList();
        }
      });
    });
  }

  renderList();
  
  const closeBtn = el.modalContainer.querySelector(".modal-close");
  if (closeBtn) {
    closeBtn.onclick = () => el.modalContainer.classList.add("hidden");
  }
}

// ==========================================
// MODAL: SELECIONAR VÍNCULOS / REFERÊNCIAS
// ==========================================
export function openSelectReferencesModal(title, stateKey, currentIds, callback, isSingle = false) {
  if (!el.modalContainer || !el.modalBody) return;
  el.modalContainer.classList.remove("hidden");

  const items = stateKey === "characters"
    ? (window._worldStateCharacters || [])
    : (worldState[stateKey] || []);

  // Ensure currentIds is an array
  let selectedSet = new Set(Array.isArray(currentIds) ? currentIds : (currentIds ? [currentIds] : []));

  function renderList(filterText = "") {
    const listContainer = el.modalBody.querySelector(".ref-modal-list");
    if (!listContainer) return;

    const filtered = items.filter(item => {
      const name = (item.name || item.nome || item.titulo || "").toLowerCase();
      return name.includes(filterText.toLowerCase());
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `<div style="text-align:center; color:var(--text-secondary); padding:16px;">Nenhum item encontrado.</div>`;
      return;
    }

    listContainer.innerHTML = filtered.map(item => {
      const name = item.name || item.nome || item.titulo || item.id;
      const isSelected = selectedSet.has(item.id);
      return `
        <label style="display:flex; align-items:center; gap:10px; padding:10px; background:rgba(255,255,255,0.02); border:1px solid ${isSelected ? 'var(--color-blue-glow, #3b82f6)' : 'rgba(255,255,255,0.05)'}; border-radius:6px; cursor:pointer; user-select:none; transition: all 0.2s;">
          <input type="${isSingle ? 'radio' : 'checkbox'}" name="ref-item" value="${item.id}" ${isSelected ? 'checked' : ''} style="cursor:pointer;">
          <span style="font-size:14px; color:#fff;">${esc(name)}</span>
        </label>
      `;
    }).join("");

    // Add change listeners to inputs
    listContainer.querySelectorAll('input[name="ref-item"]').forEach(input => {
      input.addEventListener("change", (e) => {
        const val = e.target.value;
        if (isSingle) {
          selectedSet.clear();
          if (e.target.checked) {
            selectedSet.add(val);
          }
        } else {
          if (e.target.checked) {
            selectedSet.add(val);
          } else {
            selectedSet.delete(val);
          }
        }
        // Rerender to show borders correctly
        renderList(document.getElementById("ref-modal-search").value);
      });
    });
  }

  el.modalBody.innerHTML = `
    <h3 class="modal-title" style="margin-bottom: 16px;">${esc(title)}</h3>
    <div style="margin-bottom: 12px;">
      <input type="text" id="ref-modal-search" class="ws-input" placeholder="Buscar..." style="width:100%; background:#222; border:1px solid rgba(255,255,255,0.1); color:#fff; padding:8px; border-radius:4px;">
    </div>
    <div class="ref-modal-list" style="max-height: 45vh; overflow-y: auto; margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px;">
    </div>
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button id="btn-ref-modal-cancel" class="btn btn-secondary">Cancelar</button>
      <button id="btn-ref-modal-confirm" class="btn btn-success">Confirmar</button>
    </div>
  `;

  renderList();

  const searchInput = document.getElementById("ref-modal-search");
  searchInput.addEventListener("input", (e) => {
    renderList(e.target.value);
  });

  const closeModal = () => el.modalContainer.classList.add("hidden");
  
  const closeBtn = el.modalContainer.querySelector(".modal-close");
  if (closeBtn) {
    closeBtn.onclick = closeModal;
  }
  document.getElementById("btn-ref-modal-cancel").onclick = closeModal;

  document.getElementById("btn-ref-modal-confirm").onclick = () => {
    callback(Array.from(selectedSet));
    closeModal();
  };
}

