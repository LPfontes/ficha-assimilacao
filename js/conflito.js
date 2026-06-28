import { worldState, saveConflito, deleteConflito, createNewConflito } from "./world-state.js";
import { hideAllScreens, goToLanding, esc, setupImageUpload } from "./screen-utils.js";
import { renderImageFrame, renderAttrDots, renderStatusBadge, renderRefPanelSingle } from "./screen-components.js";
import { executeCustomRoll } from "./roller.js";
import { getDieFaceImgSrc } from "./chat.js";

const TIPO_CONFLITO = ["Doença", "Criatura", "Rebelião", "Ataque Externo", "Escassez", "Outro"];
const STATUS_CONFLITO = ["Ativo", "Contido", "Resolvido"];
const STATUS_CLASS_MAP = {
  "Ativo": "status-ativo",
  "Contido": "status-contido",
  "Resolvido": "status-resolvido"
};

function getScreen() { return document.getElementById("conflito-screen"); }

export function loadConflitoSheet(conflito) {
  worldState.currentConflito = conflito;
  worldState.sheetMode = "conflito";
  hideAllScreens();
  getScreen().classList.remove("hidden");
  renderConflitoSheet();
}

export function renderConflitoSheet() {
  const c = worldState.currentConflito;
  if (!c) return;
  if (!c.ativacoes) {
    c.ativacoes = [];
  }

  const hasOnlyC = c.ativacoes.some(act => {
    const clean = act.gatilho.toUpperCase().replace(/\s+/g, "");
    return clean.length > 0 && /^[CP]+$/.test(clean);
  });

  const hasOnlyS = c.ativacoes.some(act => {
    const clean = act.gatilho.toUpperCase().replace(/\s+/g, "");
    return clean.length > 0 && /^[S]+$/.test(clean);
  });

  const screen = getScreen();

  // Helper para renderizar os distintivos de gatilho mapeando C/P->P, S->S, A/B->A
  const renderTriggerBadges = (gatilho) => {
    const chars = gatilho.toUpperCase().replace(/\s+/g, "").split("");
    return chars.map(char => {
      if (char === "C" || char === "P") {
        return `<img src="assets/d6/3-4(D6).webp" alt="P" title="Pressão" class="conflito-trigger-badge-img badge-img-p">`;
      } else if (char === "S") {
        return `<img src="assets/d6/6(D6).webp" alt="S" title="Sucesso" class="conflito-trigger-badge-img badge-img-s">`;
      } else if (char === "B" || char === "A") {
        return `<img src="assets/d6/ad.webp" alt="A" title="Adaptação" class="conflito-trigger-badge-img badge-img-a">`;
      }
      return `<span class="conflito-trigger-badge-char">${char}</span>`;
    }).join("");
  };

  screen.innerHTML = `
    <div class="world-sheet-screen">
      <div class="world-sheet-header">
        <button class="sheet-back-btn" id="btn-conflito-back">← Voltar</button>
        <div class="world-sheet-title-group">
          <input class="world-name-input" id="conflito-nome" type="text" value="${esc(c.nome)}" placeholder="Nome do Conflito">
        </div>
        ${renderStatusBadge(c.status, STATUS_CLASS_MAP)}
        <button class="btn btn-danger btn-sm" id="btn-conflito-delete">Excluir</button>
      </div>
      <div class="world-sheet-body">
        <!-- Coluna 1: Dados -->
        <div class="card-glass conflito-col-dados">
          <div class="grid-3-col-d">
            <h3 class="ws-section-title conflito-section-title">Dados do Conflito</h3>
            <div class="select-attr-row">
              <label for="conflito-tipo">Tipo</label>
              <select id="conflito-tipo">
                ${TIPO_CONFLITO.map(t => `<option ${t === c.tipoConflito ? "selected" : ""}>${t}</option>`).join("")}
              </select>
            </div>
            <div class="select-attr-row">
              <label for="conflito-status">Status</label>
              <select id="conflito-status">
                ${STATUS_CONFLITO.map(s => `<option ${s === c.status ? "selected" : ""}>${s}</option>`).join("")}
              </select>
            </div>
            <div class="conflito-grau-row">
              <label class="ws-label ws-label-inline" style="min-width:100px;">Grau</label>
              <div class="attr-dots" id="conflito-grau-dots">
                ${Array.from({ length: 10 }, (_, i) => `<span class="attr-dot${i < c.grau ? ' filled attr-dot-danger' : ''}" data-idx="${i}"></span>`).join("")}
              </div>
              <span class="attr-value-badge" id="conflito-grau-val">${c.grau}</span>
            </div>
          </div>  
          <!-- Rolagem de Conflito integrada -->
          <div class="conflito-rolagem-wrapper">
            <label class="ws-label conflito-rolagem-label">Rolagem de Conflito</label>
            
            <div class="conflito-rolagem-container">
              <div class="conflito-rolagem-panel">
                <!-- d6 Row -->
                <div class="conflito-dado-row">
                  <span class="conflito-dado-title">DADOS D6</span>
                  <div class="conflito-qty-controls">
                    <button type="button" class="btn-conf-qty-dec" data-sides="6">-</button>
                    <input type="number" id="conflito-roll-d6" value="${c.grau || 1}" min="0" max="20" class="conflito-dado-input" readonly>
                    <button type="button" class="btn-conf-qty-inc" data-sides="6">+</button>
                  </div>
                </div>
                
                <!-- d10 Row -->
                <div class="conflito-dado-row">
                  <span class="conflito-dado-title">DADOS D10</span>
                  <div class="conflito-qty-controls">
                    <button type="button" class="btn-conf-qty-dec" data-sides="10">-</button>
                    <input type="number" id="conflito-roll-d10" value="0" min="0" max="20" class="conflito-dado-input" readonly>
                    <button type="button" class="btn-conf-qty-inc" data-sides="10">+</button>
                  </div>
                </div>

                <!-- d12 Row -->
                <div class="conflito-dado-row">
                  <span class="conflito-dado-title">DADOS D12</span>
                  <div class="conflito-qty-controls">
                    <button type="button" class="btn-conf-qty-dec" data-sides="12">-</button>
                    <input type="number" id="conflito-roll-d12" value="0" min="0" max="20" class="conflito-dado-input" readonly>
                    <button type="button" class="btn-conf-qty-inc" data-sides="12">+</button>
                  </div>
                </div>

                <button id="btn-conflito-roll" class="btn btn-sm btn-block conflito-roll-btn">
                  🎲 Rolar Conflito
                </button>
              </div>

              <!-- Log de Rolagens ao lado -->
              <div class="conflito-rolagem-log">
                <div class="conflito-log-header">
                  <span>Histórico de Rolagens</span>
                  <button id="btn-conflito-clear-log" class="btn-conflito-clear-log" title="Limpar Histórico">&times;</button>
                </div>
                <div id="conflito-rolagem-log-list" class="conflito-rolagem-log-list">
                  <!-- Será preenchido dinamicamente -->
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="ws-label">Descrição / Contexto Narrativo</label>
            <textarea id="conflito-descricao" class="ws-textarea conflito-descricao-textarea" placeholder="Descreva o conflito...">${esc(c.descricao)}</textarea>
          </div>
        </div>

        <!-- Coluna 2: Ativações -->
        <div class="card-glass conflito-col-ativacoes">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:6px;">
            <h3 class="ws-section-title conflito-section-title" style="margin-bottom:0;">Ativações do Conflito</h3>
            <div id="conflito-last-roll-container"></div>
          </div>
          <div id="conflito-ativacoes-list" class="conflito-ativacoes-list">
            ${c.ativacoes.map((act, idx) => {
    const cleanTrigger = act.gatilho.toUpperCase().replace(/\s+/g, "");
    const requiredS = (cleanTrigger.match(/S/g) || []).length;
    const requiredA = (cleanTrigger.match(/[AB]/g) || []).length;
    const requiredP = (cleanTrigger.match(/[CP]/g) || []).length;
    const totalRequired = requiredS + requiredA + requiredP;

    const investedS = act.investedS || 0;
    const investedA = act.investedA || 0;
    const investedP = act.investedP || 0;
    const totalInvested = investedS + investedA + investedP;

    const isCompleted = totalRequired > 0 &&
      investedS >= requiredS &&
      investedA >= requiredA &&
      investedP >= requiredP;

    let statusBadgeHtml = "";
    if (totalRequired > 0) {
      if (isCompleted) {
        statusBadgeHtml = `<span class="conflito-completion-badge completed" title="Requisitos preenchidos!">Ativada</span>`;
      } else if (totalInvested > 0) {
        statusBadgeHtml = `<span class="conflito-completion-badge progressing" title="Investido: ${totalInvested} de ${totalRequired} necessários">Partitura: ${totalInvested}/${totalRequired}</span>`;
      }
    }

    return `
                <div class="conflito-ativacao-item ${isCompleted ? 'completed-item' : ''}">
                  <div class="conflito-ativacao-title-row">
                    ${renderTriggerBadges(act.gatilho)}
                    <span class="conflito-ativacao-titulo">${act.titulo}</span>
                    ${statusBadgeHtml}
                  </div>
                  <div class="conflito-ativacao-efeito">${act.efeito}</div>
                  
                  <!-- Painel de Investimento (Partitura do Conflito) -->
                  <div class="conflito-ativacao-investimento">
                    <span class="investimento-label">Partitura:</span>
                    <div class="investimento-controls">
                      <div class="investimento-control-group group-s" title="Sucessos (S) investidos. Necessário: ${requiredS}">
                        <span class="invest-label-symbol">S:</span>
                        <button type="button" class="btn-invest-dec" data-idx="${idx}" data-type="S">-</button>
                        <span class="invest-val ${investedS >= requiredS && requiredS > 0 ? 'met' : ''}">${investedS}</span>
                        <button type="button" class="btn-invest-inc" data-idx="${idx}" data-type="S">+</button>
                      </div>
                      <div class="investimento-control-group group-a" title="Adaptações (A) investidas. Necessário: ${requiredA}">
                        <span class="invest-label-symbol">A:</span>
                        <button type="button" class="btn-invest-dec" data-idx="${idx}" data-type="A">-</button>
                        <span class="invest-val ${investedA >= requiredA && requiredA > 0 ? 'met' : ''}">${investedA}</span>
                        <button type="button" class="btn-invest-inc" data-idx="${idx}" data-type="A">+</button>
                      </div>
                      <div class="investimento-control-group group-p" title="Pressões (P) investidas. Necessário: ${requiredP}">
                        <span class="invest-label-symbol">P:</span>
                        <button type="button" class="btn-invest-dec" data-idx="${idx}" data-type="P">-</button>
                        <span class="invest-val ${investedP >= requiredP && requiredP > 0 ? 'met' : ''}">${investedP}</span>
                        <button type="button" class="btn-invest-inc" data-idx="${idx}" data-type="P">+</button>
                      </div>
                    </div>
                  </div>

                  <button class="btn-delete-ativacao" data-idx="${idx}" title="Excluir Ativação">&times;</button>
                </div>
              `;
  }).join("")}
          </div>

          <!-- Guia Rápido de Regras (pág. 33) -->
          <div class="conflito-guia-rapido">
            <button type="button" class="btn-toggle-guia" id="btn-toggle-guia">
              <span>📖 Guia de Regras (pág. 33)</span>
              <span class="guia-arrow">▼</span>
            </button>
            <div class="guia-body hidden" id="conflito-guia-body">
              <p><strong>Assimilador(a) em Conflito:</strong></p>
              <p>• Rola dados do Conflito &rarr; Investe <strong>todos</strong> os pontos de PRESSÃO e SUCESSO em ativações do Conflito.</p>
              <p>• Rola dados da Ameaça &rarr; Investe <strong>todos</strong> os pontos de PRESSÃO e SUCESSO em ativações da Ameaça (repete p/ cada Ameaça).</p>
              <p><strong>B (Adaptação):</strong> Usado para ativações com custo direto de ADAPTAÇÃO, para <em>Adaptar Ação Anterior</em> (reinvestir P/S) ou <em>Ignorar Penalidade</em> de custo.</p>
            </div>
          </div>

          <button id="btn-open-nova-ativacao-modal" class="btn btn-sm btn-block conflito-add-ativacao-btn" style="margin-top: 10px;">
            ➕ Nova Ativação
          </button>
        </div>

        <!-- Coluna 3: Referências -->
        <div class="card-glass conflito-col-refs">
          ${renderImageFrame(c, "conflito")}
          <h3 class="ws-section-title conflito-section-title" style="margin-top: 4px;">Referências (Opcionais)</h3>
          ${renderRefPanelSingle("Região Associada", "conflito-ref-regiao", c.regiaoId, "regioes")}
          ${renderRefPanelSingle("Refúgio Associado", "conflito-ref-refugio", c.refugioId, "refugios")}
          ${renderRefPanelSingle("Local Associado", "conflito-ref-local", c.localId, "locais")}
          <div>
            <label class="ws-label">Anotações</label>
            <textarea id="conflito-notas" class="ws-textarea conflito-notas-textarea" placeholder="Notas da sessão...">${esc(c.notas)}</textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Nova Ativação -->
    <div id="conflito-modal-nova-ativacao" class="conflito-modal hidden">
      <div class="conflito-modal-content card-glass">
        <div class="conflito-modal-header">
          <h4 class="conflito-modal-title">Nova Ativação</h4>
          <button type="button" class="btn-close-modal" id="btn-close-ativacao-modal">&times;</button>
        </div>
        <div class="conflito-modal-body">
          <div class="conflito-form-group">
            <label class="ws-label" for="modal-ativacao-gatilho">Custo / Gatilho (Ex: PPP, S, AA)</label>
            <input type="text" id="modal-ativacao-gatilho" placeholder="Ex: PPP" class="conflito-form-input-trigger" style="width: 100%; box-sizing: border-box; text-transform: uppercase;">
          </div>
          <div class="conflito-form-group">
            <label class="ws-label" for="modal-ativacao-titulo">Título / Nome da Ação</label>
            <input type="text" id="modal-ativacao-titulo" placeholder="Nome da Ação" class="conflito-form-input-titulo" style="width: 100%; box-sizing: border-box;">
          </div>
          <div class="conflito-form-group">
            <label class="ws-label" for="modal-ativacao-efeito">Efeito / Descrição</label>
            <textarea id="modal-ativacao-efeito" placeholder="Descrição do Efeito..." class="conflito-form-textarea-efeito" style="width: 100%; box-sizing: border-box; height: 80px;"></textarea>
          </div>
        </div>
        <div class="conflito-modal-footer">
          <button type="button" class="btn btn-sm btn-secondary" id="btn-cancel-ativacao-modal">Cancelar</button>
          <button type="button" class="btn btn-sm btn-primary" id="btn-confirm-add-ativacao">Adicionar</button>
        </div>
      </div>
    </div>
  `;

  _attachListeners(c);
  renderConflitoRollLog();
  renderConflitoLastRollCounter();
}

function _attachListeners(c) {
  const screen = getScreen();

  screen.querySelector("#btn-conflito-back")?.addEventListener("click", goToLanding);
  screen.querySelector("#btn-conflito-delete")?.addEventListener("click", () => {
    if (confirm(`Excluir o Conflito "${c.nome}"?`)) { deleteConflito(c.id); goToLanding(); }
  });

  screen.querySelector("#conflito-nome")?.addEventListener("input", e => { c.nome = e.target.value; saveConflito(c); });
  screen.querySelector("#conflito-tipo")?.addEventListener("change", e => { c.tipoConflito = e.target.value; saveConflito(c); });
  screen.querySelector("#conflito-descricao")?.addEventListener("input", e => { c.descricao = e.target.value; saveConflito(c); });
  screen.querySelector("#conflito-notas")?.addEventListener("input", e => { c.notas = e.target.value; saveConflito(c); });

  screen.querySelector("#conflito-status")?.addEventListener("change", e => {
    c.status = e.target.value;
    saveConflito(c);
    const badge = screen.querySelector("#conflito-status-badge");
    if (badge) {
      badge.textContent = c.status;
      badge.className = `status-badge ${STATUS_CLASS_MAP[c.status] || "status-ativo"}`;
    }
  });

  screen.querySelectorAll("#conflito-grau-dots .attr-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      const idx = parseInt(dot.dataset.idx);
      c.grau = c.grau === idx + 1 ? idx : idx + 1;
      saveConflito(c);
      screen.querySelectorAll("#conflito-grau-dots .attr-dot").forEach((d, i) => {
        d.classList.toggle("filled", i < c.grau);
        d.classList.toggle("attr-dot-danger", i < c.grau);
      });
      screen.querySelector("#conflito-grau-val").textContent = c.grau;

      const d6Input = screen.querySelector("#conflito-roll-d6");
      if (d6Input) {
        d6Input.value = c.grau;
      }
    });
  });

  // Listeners para os botões +/- dos dados de conflito mix
  screen.querySelectorAll(".btn-conf-qty-dec").forEach(btn => {
    btn.addEventListener("click", () => {
      const sides = btn.dataset.sides;
      const input = screen.querySelector(`#conflito-roll-d${sides}`);
      if (input) {
        let val = parseInt(input.value) || 0;
        input.value = Math.max(0, val - 1);
      }
    });
  });

  screen.querySelectorAll(".btn-conf-qty-inc").forEach(btn => {
    btn.addEventListener("click", () => {
      const sides = btn.dataset.sides;
      const input = screen.querySelector(`#conflito-roll-d${sides}`);
      if (input) {
        let val = parseInt(input.value) || 0;
        input.value = Math.min(20, val + 1);
      }
    });
  });

  // Listener para rolagem do conflito (composição de dados mix)
  screen.querySelector("#btn-conflito-roll")?.addEventListener("click", () => {
    const d6 = parseInt(screen.querySelector("#conflito-roll-d6")?.value) || 0;
    const d10 = parseInt(screen.querySelector("#conflito-roll-d10")?.value) || 0;
    const d12 = parseInt(screen.querySelector("#conflito-roll-d12")?.value) || 0;

    const parts = [];
    if (d6 > 0) parts.push(`${d6}d6`);
    if (d10 > 0) parts.push(`${d10}d10`);
    if (d12 > 0) parts.push(`${d12}d12`);

    if (parts.length === 0) {
      alert("Selecione pelo menos um dado para rolar!");
      return;
    }

    const formula = parts.join("+");

    // Configura o valor na fórmula de dados do rolador do sistema
    const customFormulaInput = document.getElementById("dice-custom-formula");
    if (customFormulaInput) {
      customFormulaInput.value = formula;
    }

    executeCustomRoll();
  });

  const modal = screen.querySelector("#conflito-modal-nova-ativacao");

  // Abrir o modal
  screen.querySelector("#btn-open-nova-ativacao-modal")?.addEventListener("click", () => {
    if (modal) {
      screen.querySelector("#modal-ativacao-gatilho").value = "";
      screen.querySelector("#modal-ativacao-titulo").value = "";
      screen.querySelector("#modal-ativacao-efeito").value = "";
      modal.classList.remove("hidden");
      screen.querySelector("#modal-ativacao-gatilho").focus();
    }
  });

  // Fechar o modal
  const hideModal = () => modal?.classList.add("hidden");
  screen.querySelector("#btn-close-ativacao-modal")?.addEventListener("click", hideModal);
  screen.querySelector("#btn-cancel-ativacao-modal")?.addEventListener("click", hideModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      hideModal();
    }
  });

  // Adicionar Ativação a partir do modal
  screen.querySelector("#btn-confirm-add-ativacao")?.addEventListener("click", () => {
    const gatilhoInput = screen.querySelector("#modal-ativacao-gatilho");
    const tituloInput = screen.querySelector("#modal-ativacao-titulo");
    const efeitoInput = screen.querySelector("#modal-ativacao-efeito");

    const gatilho = gatilhoInput.value.trim().toUpperCase();
    const titulo = tituloInput.value.trim();
    const efeito = efeitoInput.value.trim();

    if (!gatilho || !titulo || !efeito) {
      alert("Preencha todos os campos da ativação!");
      return;
    }

    c.ativacoes.push({
      gatilho,
      titulo,
      efeito,
      investedS: 0,
      investedA: 0,
      investedP: 0
    });
    saveConflito(c);
    hideModal();
    renderConflitoSheet();
  });

  // Listener para excluir ativacao
  screen.querySelectorAll(".btn-delete-ativacao").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      if (confirm("Excluir esta ativação do conflito?")) {
        c.ativacoes.splice(idx, 1);
        saveConflito(c);
        renderConflitoSheet();
      }
    });
  });

  // Listeners para os botões de incremento/decremento da partitura (investimento)
  screen.querySelectorAll(".btn-invest-inc").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      const type = btn.dataset.type;
      const act = c.ativacoes[idx];
      const key = `invested${type}`;

      // Calcula o total rolado desse tipo
      let totalRolled = 0;
      if (c.rolagens && c.rolagens.length > 0) {
        const lastRoll = c.rolagens[c.rolagens.length - 1];
        if (type === "S") totalRolled = lastRoll.bonusSuccesses || 0;
        if (type === "A") totalRolled = lastRoll.bonusAdaptations || 0;
        if (type === "P") totalRolled = lastRoll.bonusPressures || 0;

        lastRoll.keptDiceIndexes.forEach(idx => {
          const die = lastRoll.results[idx];
          if (die && die.symbols) {
            die.symbols.forEach(sym => {
              if (sym === "A" && type === "S") totalRolled++;
              if (sym === "B" && type === "A") totalRolled++;
              if (sym === "C" && type === "P") totalRolled++;
            });
          }
        });
      }

      // Calcula o total investido nessa rodada (desde o último snapshot)
      let newlyInvestedOfThisType = 0;
      c.ativacoes.forEach(a => {
        newlyInvestedOfThisType += (a[key] || 0) - (a[`snapshot${type}`] || 0);
      });

      const available = totalRolled - newlyInvestedOfThisType;
      if (available <= 0) {
        // Sem pontos disponíveis deste tipo nesta rolagem
        return;
      }

      act[key] = (act[key] || 0) + 1;
      saveConflito(c);
      renderConflitoSheet();
    });
  });

  screen.querySelectorAll(".btn-invest-dec").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      const type = btn.dataset.type;
      const act = c.ativacoes[idx];
      const key = `invested${type}`;
      act[key] = Math.max(0, (act[key] || 0) - 1);
      saveConflito(c);
      renderConflitoSheet();
    });
  });

  screen.querySelector("#btn-toggle-guia")?.addEventListener("click", () => {
    const body = screen.querySelector("#conflito-guia-body");
    const arrow = screen.querySelector(".guia-arrow");
    if (body) {
      const isHidden = body.classList.toggle("hidden");
      if (arrow) arrow.textContent = isHidden ? "▼" : "▲";
    }
  });

  [["conflito-ref-regiao", "regiaoId"], ["conflito-ref-refugio", "refugioId"], ["conflito-ref-local", "localId"]].forEach(([id, key]) => {
    screen.querySelector(`#${id}`)?.addEventListener("change", e => {
      c[key] = e.target.value || null;
      saveConflito(c);
    });
  });

  screen.querySelector("#btn-conflito-clear-log")?.addEventListener("click", () => {
    if (confirm("Limpar o histórico de rolagens deste conflito?")) {
      c.rolagens = [];
      c.ativacoes.forEach(act => {
        act.investedS = 0;
        act.investedA = 0;
        act.investedP = 0;
        act.snapshotS = 0;
        act.snapshotA = 0;
        act.snapshotP = 0;
      });
      saveConflito(c);
      renderConflitoSheet();
    }
  });

  setupImageUpload("conflito-image-frame", "conflito-image-input", c, saveConflito);
}

export function startNewConflito() {
  const c = createNewConflito();
  saveConflito(c);
  loadConflitoSheet(c);
}

export function renderConflitoRollLog() {
  const c = worldState.currentConflito;
  if (!c) return;
  const list = document.getElementById("conflito-rolagem-log-list");
  if (!list) return;

  if (!c.rolagens || c.rolagens.length === 0) {
    list.innerHTML = `<div class="conflito-log-empty">Nenhuma rolagem neste conflito.</div>`;
    return;
  }

  list.innerHTML = c.rolagens.map((roll, rIdx) => {
    let sucessos = roll.bonusSuccesses || 0;
    let adaptacoes = roll.bonusAdaptations || 0;
    let pressoes = roll.bonusPressures || 0;

    roll.keptDiceIndexes.forEach(idx => {
      const die = roll.results[idx];
      if (die && die.symbols) {
        die.symbols.forEach(sym => {
          if (sym === "A") sucessos++;
          if (sym === "B") adaptacoes++;
          if (sym === "C") pressoes++;
        });
      }
    });

    const diceHtml = `
      <div class="results-dice-grid">
        ${roll.results.map((die, idx) => {
      const isKept = roll.keptDiceIndexes.includes(idx);
      const imgSrc = getDieFaceImgSrc(die.sides, die.value);
      const contentHtml = imgSrc
        ? `<img src="${imgSrc}" class="die-face-img" alt="d${die.sides} face ${die.value}">`
        : `<span style="font-size:8px;">d${die.sides}:${die.value}</span>`;
      return `
            <div class="result-die-card ${isKept ? 'kept' : ''}" data-die-index="${idx}" data-roll-idx="${rIdx}" style="cursor: default; pointer-events: none; opacity: 0.85;">
              ${contentHtml}
            </div>
          `;
    }).join("")}
      </div>
    `;

    return `
      <div class="conflito-log-item">
        <div class="conflito-log-item-header">
          <div class="conflito-log-results">
            <span class="conflito-result-badge badge-s" title="Sucessos">S: ${sucessos}</span>
            <span class="conflito-result-badge badge-a" title="Adaptações">A: ${adaptacoes}</span>
            <span class="conflito-result-badge badge-p" title="Ameaças/Pressões">P: ${pressoes}</span>
          </div>
          <span class="conflito-log-formula">${roll.formula}</span>
          <span class="conflito-log-time">${roll.timestamp}</span>
        </div>
        <div class="conflito-log-dice">
          ${diceHtml}
        </div>
      </div>
    `;
  }).reverse().join("");
}

export function renderConflitoLastRollCounter() {
  const c = worldState.currentConflito;
  if (!c) return;
  const container = document.getElementById("conflito-last-roll-container");
  if (!container) return;

  if (c.rolagens && c.rolagens.length > 0) {
    const lastRoll = c.rolagens[c.rolagens.length - 1];
    let sucessos = lastRoll.bonusSuccesses || 0;
    let adaptacoes = lastRoll.bonusAdaptations || 0;
    let pressoes = lastRoll.bonusPressures || 0;

    lastRoll.keptDiceIndexes.forEach(idx => {
      const die = lastRoll.results[idx];
      if (die && die.symbols) {
        die.symbols.forEach(sym => {
          if (sym === "A") sucessos++;
          if (sym === "B") adaptacoes++;
          if (sym === "C") pressoes++;
        });
      }
    });

    // Calcula os descontos de investimentos recém-feitos (nesta rodada)
    let newlyInvestedS = 0;
    let newlyInvestedA = 0;
    let newlyInvestedP = 0;
    c.ativacoes.forEach(act => {
      newlyInvestedS += (act.investedS || 0) - (act.snapshotS || 0);
      newlyInvestedA += (act.investedA || 0) - (act.snapshotA || 0);
      newlyInvestedP += (act.investedP || 0) - (act.snapshotP || 0);
    });

    const dispS = Math.max(0, sucessos - newlyInvestedS);
    const dispA = Math.max(0, adaptacoes - newlyInvestedA);
    const dispP = Math.max(0, pressoes - newlyInvestedP);

    container.innerHTML = `
      <span class="last-roll-label">Disponível:</span>
      <span class="conflito-result-badge badge-s" title="Sucessos">S: ${dispS}</span>
      <span class="conflito-result-badge badge-a" title="Adaptações">A: ${dispA}</span>
      <span class="conflito-result-badge badge-p" title="Ameaças/Pressões">P: ${dispP}</span>
    `;
    container.className = "conflito-last-roll-counter";
  } else {
    container.innerHTML = `
      <span class="last-roll-label" style="font-size: 10px; color: var(--text-muted);">Sem rolagens recentes</span>
    `;
    container.className = "conflito-last-roll-counter empty";
  }
}

// Escuta evento global de rolagem finalizada para registrar no histórico do conflito atual
document.addEventListener("roll-added", (e) => {
  if (worldState.sheetMode === "conflito" && worldState.currentConflito) {
    const c = worldState.currentConflito;
    if (!c.rolagens) c.rolagens = [];
    c.rolagens.push(e.detail);
    if (c.rolagens.length > 10) c.rolagens.shift();

    // Snapshot das ativações no momento em que a rolagem ocorre
    c.ativacoes.forEach(act => {
      act.snapshotS = act.investedS || 0;
      act.snapshotA = act.investedA || 0;
      act.snapshotP = act.investedP || 0;
    });

    saveConflito(c);
    renderConflitoRollLog();
    renderConflitoLastRollCounter();
  }
});
