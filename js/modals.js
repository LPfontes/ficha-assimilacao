
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

import { el, state, saveCurrentCharacter, loadCharacter } from "./state.js";
import { renderMutationsSheet, renderCaboGuerraSheet } from "./sheet.js";
import { CARACTERISTICAS } from "./characteristics.js";
import { ASSIMILACOES } from "./assimilations.js";
import { ICONS } from "../icons.js";
import { getDieSymbolsHtml, getDieFaceImgSrc } from "./chat.js";
import { DICE_MAP } from "./roller.js";
import { logger } from "./logger.js";

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
    <div class="traits-modal-grid">
      <!-- JS insere os itens -->
    </div>
  `;
  
  const grid = el.modalBody.querySelector(".traits-modal-grid");
  
  CARACTERISTICAS.forEach(trait => {
    // Esconder característica de criação se já iniciou
    if (trait.id === "estagio_avancado") return;
    
    const isOwned = char.caracteristicas.includes(trait.id);
    const meetsReqs = checkCharacterTraitPrerequisites(char, trait.requisitos);
    
    const row = document.createElement("div");
    row.className = `trait-modal-row ${isOwned ? 'owned' : ''}`;
    if (!meetsReqs && !isOwned) row.style.opacity = "0.5";
    
    row.innerHTML = `
      <div class="info">
        <div class="title-row">
          <span class="title">${trait.nome}</span>
          <span class="cost-badge">${trait.custo} XP</span>
          ${isOwned ? '<span style="color:#00ff66; font-size:10px; font-weight:bold;">Adquirido</span>' : ''}
        </div>
        <div class="req">Requisito: ${trait.requisitoText}</div>
        <div class="desc">${trait.descricao}</div>
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
        openTraitsModal(); // Recarrega
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
  });
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
          <strong>ATENÇÃO:</strong> O total de C acumuladas atingiu ou excedeu 10! A personagem perdeu toda a consciência humana e agora se tornou uma criatura sob controle definitivo do Assimilador (NPC).
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
        
        logger.info(`Modal: Teste de Assimilação concluído - Sucesso [A]: ${a}, Adaptação [B]: ${b}, Pressão [C]: ${c}.`);
        
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
          <div class="points-badge a">Sucesso [A]: ${ptsA}</div>
          <div class="points-badge b">Adaptação [B]: ${ptsB}</div>
          <div class="points-badge c">Pressão [C]: ${ptsC}</div>
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
      .mut-title { font-weight: bold; font-size: 13px; }
      .mut-cost { font-size: 10px; font-family: var(--font-heading); padding: 1px 6px; border-radius: 4px; font-weight: bold; }
      .mut-cost.evolutivas { background: rgba(0,255,102,0.15); color: #00ff66; border: 1px solid rgba(0,255,102,0.3); }
      .mut-cost.adaptativas { background: rgba(234,179,8,0.15); color: #eab308; border: 1px solid rgba(234,179,8,0.3); }
      .mut-cost.inoportunas { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
      .mut-cost.singulares { background: rgba(168,85,247,0.15); color: #a855f7; border: 1px solid rgba(168,85,247,0.3); }
      .mut-desc { font-size: 11px; color: var(--text-secondary); line-height: 1.3; }
      .mut-req { font-size: 10px; color: var(--color-rust-glow); margin-top: 3px; font-weight: 500; }
    </style>

    <div class="tarot-modal-container">
      <div class="tarot-header">
        <h3>🔮 Selecionar Mutações Sorteadas</h3>
        <p style="font-size: 11px; color: var(--text-secondary); margin: 0;">Toque em cada carta para revelar e ver as opções de mutação.</p>
        <div class="points-bar">
          <span style="color:#00ff66;">[A] Sucessos: <strong id="val-pts-a">${ptsA}</strong></span>
          <span style="color:#eab308;">[B] Adaptações: <strong id="val-pts-b">${ptsB}</strong></span>
          <span style="color:#ef4444;">[C] Pressões: <strong id="val-pts-c">${ptsC}</strong></span>
        </div>
      </div>

      <div style="width: 100%; margin-top: 10px;">
        ${["evolutivas", "adaptativas", "inoportunas", "singulares"].map(cat => {
          const catCards = state.drawnMutationCards.map((item, idx) => ({item, idx})).filter(o => o.item.category === cat);
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
                ${catCards.map(({item, idx}) => {
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
          const isOwned = char.mutações.some(m => m.name === mut.name);
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
            reqLabel = `<div class="mut-req" style="color: ${hasReq ? 'var(--color-blue-glow)' : 'var(--color-rust)'}">
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
  
  el.modalBody.innerHTML = `
    <h3 class="modal-title">Configurações</h3>
    <div class="settings-modal-content" style="margin-top: 16px;">
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
      
      <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
        <button id="btn-save-settings" class="btn btn-md">Fechar</button>
      </div>
    </div>
  `;
  
  const checkbox = document.getElementById("settings-disable-3d");
  checkbox.addEventListener("change", (e) => {
    localStorage.setItem("assimilação_disable_3d", e.target.checked ? "true" : "false");
    logger.info(`Configurações: assimilação_disable_3d alterada para ${e.target.checked}`);
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
  
  document.getElementById("btn-save-settings").addEventListener("click", () => {
    el.modalContainer.classList.add("hidden");
  });
}
