import { el, state, loadCharactersFromStorage, saveCurrentCharacter, loadCharacter, deleteActiveCharacter, exportActiveCharacter, importCharacterFile } from "./js/state.js";
import { startWizard, wizardPrevStep, wizardNextStep, wizardFinish, renderWizardTraits } from "./js/wizard.js";
import { updateDiceDrawerUI, execute3DPhysicsRoll, executeCustomRoll, setupNumberInputControls, updateKeepCountDisplay, initRolagemAssimiladaPanel } from "./js/roller.js";
import { openTraitsModal, openAssimilationTestModal, openSettingsModal, openMutationSelectionScreen } from "./js/modals.js";
import { renderAptitudesSheet, adjustCaboGuerraLevels, executeAssimilacaoAvanco, renderCaboGuerraSheet } from "./js/sheet.js";
import { ICONS } from "./icons.js";
import { logger } from "./js/logger.js";

// ==========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  logger.info("Aplicação carregada. Inicializando components...");
  renderIcons();
  loadCharactersFromStorage();
  initDiceBox();
  setupEventListeners();
  
  // Se houver personagens, carrega o primeiro, senão abre o wizard
  if (state.characters.length > 0) {
    loadCharacter(state.characters[0].id);
  } else {
    startWizard();
  }
});

// Renderização dos ícones SVG inline baseados em data-icon
function renderIcons() {
  document.querySelectorAll("[data-icon]").forEach(node => {
    const iconName = node.getAttribute("data-icon");
    if (ICONS[iconName]) {
      node.innerHTML = ICONS[iconName];
    }
  });
}

// Inicializa a biblioteca DiceBox local
function initDiceBox() {
  logger.info("Inicializando o motor DiceBox 3D...");
  const container = document.getElementById("dice-box-3d");
  const diceEngine = (typeof DICE !== "undefined") ? DICE : null;
  if (diceEngine && diceEngine.dice_box && container) {
    try {
      state.diceBox = new diceEngine.dice_box(container);
      window.diceBox = state.diceBox;
      logger.info("3D Dice Box local inicializado com sucesso.");
    } catch (e) {
      logger.error("Erro ao instanciar DICE.dice_box:", e);
    }
  } else {
    logger.error("DICE.dice_box ou container #dice-box-3d não encontrado no DOM.");
  }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
  logger.info("Configurando ouvintes de eventos da interface...");
  // Header controls
  el.charSelector.addEventListener("change", (e) => {
    if (e.target.value) loadCharacter(e.target.value);
  });
  el.btnNewChar.addEventListener("click", startWizard);
  el.btnDeleteChar.addEventListener("click", deleteActiveCharacter);
  if (el.btnSettings) {
    el.btnSettings.addEventListener("click", openSettingsModal);
  }
  
  // Export/Import JSON
  el.btnExportJson.addEventListener("click", exportActiveCharacter);
  el.btnImportJson.addEventListener("click", () => el.fileImport.click());
  el.fileImport.addEventListener("change", importCharacterFile);

  // Mobile Menu Toggling
  if (el.btnMobileMenu && el.headerControls) {
    el.btnMobileMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      el.btnMobileMenu.classList.toggle("active");
      el.headerControls.classList.toggle("active");
    });

    // Close sidebar when clicking outside of it
    document.addEventListener("click", (e) => {
      if (el.headerControls.classList.contains("active")) {
        if (!el.headerControls.contains(e.target) && !el.btnMobileMenu.contains(e.target)) {
          el.btnMobileMenu.classList.remove("active");
          el.headerControls.classList.remove("active");
        }
      }
    });

    // Close sidebar when a control inside it is clicked (e.g. character selector or button)
    el.headerControls.addEventListener("click", (e) => {
      if (e.target.closest("button") || (e.target.closest("select") && e.type === "change")) {
        el.btnMobileMenu.classList.remove("active");
        el.headerControls.classList.remove("active");
      }
    });

    // Handle change on character selector specifically to close sidebar
    el.charSelector.addEventListener("change", () => {
      el.btnMobileMenu.classList.remove("active");
      el.headerControls.classList.remove("active");
    });
  }

  // Aptitude Columns Lock Toggles
  document.querySelectorAll(".btn-lock-toggle").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".aptitude-column-card");
      if (card) {
        const isLocked = card.classList.toggle("locked");
        const iconSpan = btn.querySelector("[data-icon]");
        if (iconSpan) {
          iconSpan.setAttribute("data-icon", isLocked ? "lock" : "unlock");
          // Re-render icon
          const iconName = iconSpan.getAttribute("data-icon");
          if (ICONS[iconName]) {
            iconSpan.innerHTML = ICONS[iconName];
          }
        }
      }
    });
  });
  
  // Saude Lock Toggle
  const btnLockSaude = document.querySelector(".btn-lock-toggle-saude");
  if (btnLockSaude) {
    btnLockSaude.addEventListener("click", () => {
      const card = document.getElementById("saude-card-container");
      if (card) {
        const isLocked = card.classList.toggle("locked");
        const iconSpan = btnLockSaude.querySelector("[data-icon]");
        if (iconSpan) {
          iconSpan.setAttribute("data-icon", isLocked ? "lock" : "unlock");
          import("./icons.js").then(({ ICONS }) => {
            const iconName = iconSpan.getAttribute("data-icon");
            if (ICONS[iconName]) {
              iconSpan.innerHTML = ICONS[iconName];
            }
          });
        }
        if (el.saudeEditControls) {
          el.saudeEditControls.style.display = isLocked ? "none" : "flex";
        }
      }
    });
  }

  // Saude Modifier Buttons
  if (el.btnSaudeModDec) {
    el.btnSaudeModDec.addEventListener("click", () => {
      if (state.currentCharacter) {
        state.currentCharacter.saudeMod = (state.currentCharacter.saudeMod || 0) - 1;
        saveCurrentCharacter();
        import("./js/sheet.js").then(({ renderHealthSheet }) => renderHealthSheet());
      }
    });
  }

  if (el.btnSaudeModInc) {
    el.btnSaudeModInc.addEventListener("click", () => {
      if (state.currentCharacter) {
        state.currentCharacter.saudeMod = (state.currentCharacter.saudeMod || 0) + 1;
        saveCurrentCharacter();
        import("./js/sheet.js").then(({ renderHealthSheet }) => renderHealthSheet());
      }
    });
  }

  // Wizard Navigation
  el.btnWizPrev.addEventListener("click", wizardPrevStep);
  el.btnWizNext.addEventListener("click", wizardNextStep);
  el.btnWizFinish.addEventListener("click", wizardFinish);
  
  // Ficha Auto-save inputs
  const autoSaveInputs = [el.charName, el.charOcupacao, el.charEvento, el.charPropP1, el.charPropP2, el.charPropCol, el.charNotes];
  autoSaveInputs.forEach(input => {
    input.addEventListener("input", () => {
      if (state.currentCharacter) {
        state.currentCharacter.name = el.charName.value || "Sem Nome";
        state.currentCharacter.ocupacao = el.charOcupacao.value;
        state.currentCharacter.evento = el.charEvento.value;
        state.currentCharacter.propP1 = el.charPropP1.value;
        state.currentCharacter.propP2 = el.charPropP2.value;
        state.currentCharacter.propCol = el.charPropCol.value;
        state.currentCharacter.notes = el.charNotes.value;
        saveCurrentCharacter();
        
        // Atualiza a opção no select
        const option = el.charSelector.querySelector(`option[value="${state.currentCharacter.id}"]`);
        if (option) option.textContent = state.currentCharacter.name;
      }
    });
  });

  // Modal Generic Close
  el.modalContainer.addEventListener("click", (e) => {
    if (e.target === el.modalContainer || e.target.classList.contains("modal-close")) {
      el.modalContainer.classList.add("hidden");
    }
  });

  // Torna o modal arrastável e redefine a posição ao abrir
  const modalContent = document.querySelector(".modal-content");
  if (modalContent) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    modalContent.addEventListener("mousedown", (e) => {
      // Não arrasta se clicar em botões, campos de entrada, selects, links ou no botão de fechar
      const tag = e.target.tagName.toLowerCase();
      if (
        tag === "input" || 
        tag === "button" || 
        tag === "select" || 
        tag === "textarea" || 
        tag === "a" || 
        e.target.closest(".btn") || 
        e.target.classList.contains("modal-close")
      ) {
        return;
      }
      
      isDragging = true;
      modalContent.style.cursor = "grabbing";
      
      const rect = modalContent.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      
      startX = e.clientX;
      startY = e.clientY;
      
      modalContent.style.position = "absolute";
      modalContent.style.margin = "0";
      modalContent.style.left = `${initialLeft}px`;
      modalContent.style.top = `${initialTop}px`;
      modalContent.style.transform = "none";
      modalContent.style.animation = "none";
      
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      modalContent.style.left = `${initialLeft + dx}px`;
      modalContent.style.top = `${initialTop + dy}px`;
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        modalContent.style.cursor = "grab";
      }
    });
    
    modalContent.style.cursor = "grab";

    // Observer para recentralizar o modal sempre que for reaberto
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const isHidden = el.modalContainer.classList.contains("hidden");
          if (!isHidden) {
            modalContent.style.position = "";
            modalContent.style.left = "";
            modalContent.style.top = "";
            modalContent.style.transform = "";
            modalContent.style.margin = "";
            modalContent.style.animation = "";
          }
        }
      });
    });
    observer.observe(el.modalContainer, { attributes: true });
  }

  // Add Trait from Sheet
  el.btnAddTraitSheet.addEventListener("click", openTraitsModal);
  el.btnAssimilationTest.addEventListener("click", openAssimilationTestModal);
  
  const btnAssimilationTestSheet = document.getElementById("btn-assimilation-test-sheet");
  if (btnAssimilationTestSheet) {
    btnAssimilationTestSheet.addEventListener("click", openAssimilationTestModal);
  }

  const handleOpenTarot = () => {
    const char = state.currentCharacter;
    if (!char) return;
    
    // Verifica se possui pontos pendentes
    const ptsA = char.ptsA || 0;
    const ptsB = char.ptsB || 0;
    const ptsC = char.ptsC || 0;
    
    if (ptsA === 0 && ptsB === 0 && ptsC === 0) {
      alert("Você não possui pontos de Sucesso, Adaptação ou Pressão pendentes para realizar a leitura do Tarot!");
      return;
    }
    
    // Reseta o cache de cartas sorteadas para forçar uma nova tiragem
    state.drawnMutationCards = null;
    openMutationSelectionScreen(ptsA, ptsB, ptsC);
  };

  const btnOpenTarotAgain = document.getElementById("btn-open-tarot-again");
  if (btnOpenTarotAgain) {
    btnOpenTarotAgain.addEventListener("click", handleOpenTarot);
  }
  
  const btnOpenTarotAgainSheet = document.getElementById("btn-open-tarot-again-sheet");
  if (btnOpenTarotAgainSheet) {
    btnOpenTarotAgainSheet.addEventListener("click", handleOpenTarot);
  }

  // Cabo de Guerra Adjustments
  if (el.btnDecDet) el.btnDecDet.addEventListener("click", () => adjustCaboGuerraLevels(-1));
  if (el.btnIncDet) el.btnIncDet.addEventListener("click", () => adjustCaboGuerraLevels(1));
  if (el.btnDecAss) el.btnDecAss.addEventListener("click", () => adjustCaboGuerraLevels(1));
  if (el.btnIncAss) el.btnIncAss.addEventListener("click", () => adjustCaboGuerraLevels(-1));
  if (el.btnAvancoAssimilacao) el.btnAvancoAssimilacao.addEventListener("click", executeAssimilacaoAvanco);

  const handlePointsMath = (inputEl, type) => {
    if (!state.currentCharacter || !inputEl) return;
    const valueStr = inputEl.value.trim();
    if (!valueStr) return;

    let delta = 0;
    let isRelative = false;
    if (valueStr.startsWith("+")) {
      delta = parseInt(valueStr.slice(1).trim(), 10);
      isRelative = true;
    } else if (valueStr.startsWith("-")) {
      delta = parseInt(valueStr.trim(), 10);
      isRelative = true;
    } else {
      delta = parseInt(valueStr, 10);
    }

    if (isNaN(delta)) return;

    if (type === "det") {
      const current = state.currentCharacter.detPoints;
      const max = state.currentCharacter.detNivel;
      let target = isRelative ? current + delta : delta;
      state.currentCharacter.detPoints = Math.max(0, Math.min(max, target));
    } else if (type === "ass") {
      const current = state.currentCharacter.assPoints;
      const max = state.currentCharacter.assNivel;
      let target = isRelative ? current + delta : delta;
      state.currentCharacter.assPoints = Math.max(0, Math.min(max, target));
    }

    saveCurrentCharacter();
    renderCaboGuerraSheet();
    inputEl.value = "";
  };

  if (el.inputDetMath) {
    el.inputDetMath.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handlePointsMath(el.inputDetMath, "det");
      }
    });
  }

  if (el.inputAssMath) {
    el.inputAssMath.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handlePointsMath(el.inputAssMath, "ass");
      }
    });
  }


  // Dice Drawer Trigger
 // --- SUBSTITUA O BLOCO ANTIGO DE "Dice Drawer Trigger" E "Header Open Roller Trigger" POR ESTE: ---

  // Botão "Lançar Dados" no cabeçalho abre o modal do rolador
  if (el.btnOpenRoller) {
    el.btnOpenRoller.addEventListener("click", () => {
      if (el.diceDrawer) el.diceDrawer.classList.remove("hidden");
    });
  }

  // Novo botão de fechar (X) dentro do modal do rolador
  const btnCloseDrawer = document.getElementById("btn-close-drawer");
  if (btnCloseDrawer) {
    btnCloseDrawer.addEventListener("click", () => {
      if (el.diceDrawer) el.diceDrawer.classList.add("hidden");
    });
  }

  // Botões inferiores "FECHAR PAINEL"
  document.querySelectorAll(".btn-close-roller-panel").forEach(btn => {
    btn.addEventListener("click", () => {
      if (el.diceDrawer) el.diceDrawer.classList.add("hidden");
    });
  });

  // Fechar o modal ao clicar na área escura (overlay) de fundo
  if (el.diceDrawer) {
    el.diceDrawer.addEventListener("click", (e) => {
      if (e.target === el.diceDrawer) {
        el.diceDrawer.classList.add("hidden");
      }
    });
  }

  // Seletores rápidos na gaveta
  el.rollSelectInstinto.addEventListener("change", (e) => {
    const value = e.target.value;
    if (!state.currentCharacter) return;
    
    if (value) {
      const val = state.currentCharacter.instintos[value] || 0;
      state.selectedRoll.instinto = value;
      if (state.selectedRoll.agirPorInstinto) {
        state.selectedRoll.d12 = val;
        state.selectedRoll.d6 = 0;
      } else {
        state.selectedRoll.d6 = val;
        state.selectedRoll.d12 = 0;
      }
    } else {
      state.selectedRoll.instinto = "";
      state.selectedRoll.d6 = 0;
      state.selectedRoll.d12 = 0;
    }
    renderAptitudesSheet();
    updateDiceDrawerUI();
  });
  
  el.rollSelectSkill.addEventListener("change", (e) => {
    const value = e.target.value;
    if (!state.currentCharacter) return;
    
    if (value) {
      const val = state.currentCharacter.conhecimentos[value] !== undefined 
        ? state.currentCharacter.conhecimentos[value] 
        : (state.currentCharacter.praticas[value] || 0);
      state.selectedRoll.skill = value;
      state.selectedRoll.d10 = val;
    } else {
      state.selectedRoll.skill = "";
      state.selectedRoll.d10 = 0;
    }
    renderAptitudesSheet();
    updateDiceDrawerUI();
  });

  // Roll Quantities manual adjustment
  setupNumberInputControls();

  // Modificadores de Rolagem
  el.modEmpenho.addEventListener("change", updateKeepCountDisplay);
  el.modOrigemOcupacao.addEventListener("change", updateKeepCountDisplay);
  el.modOrigemEvento.addEventListener("change", updateKeepCountDisplay);
  
  if (el.modEmpenhoAss) el.modEmpenhoAss.addEventListener("change", initRolagemAssimiladaPanel);
  if (el.modOrigemOcupacaoAss) el.modOrigemOcupacaoAss.addEventListener("change", initRolagemAssimiladaPanel);
  if (el.modOrigemEventoAss) el.modOrigemEventoAss.addEventListener("change", initRolagemAssimiladaPanel);
  
  // Alternar abas do Rolador (Normal vs Assimilada)
  const tabRollerNormal = document.getElementById("tab-roller-normal");
  const tabRollerAssimilada = document.getElementById("tab-roller-assimilada");
  const panelRollerNormal = document.getElementById("panel-roller-normal");
  const panelRollerAssimilada = document.getElementById("panel-roller-assimilada");
  
  if (tabRollerNormal && tabRollerAssimilada && panelRollerNormal && panelRollerAssimilada) {
    const switchToNormal = () => {
      panelRollerNormal.classList.remove("hidden");
      panelRollerAssimilada.classList.add("hidden");
    };
    
    const switchToAssimilada = () => {
      panelRollerAssimilada.classList.remove("hidden");
      panelRollerNormal.classList.add("hidden");
      
      initRolagemAssimiladaPanel();
    };
    
    tabRollerNormal.addEventListener("click", switchToNormal);
    tabRollerAssimilada.addEventListener("click", switchToAssimilada);
  }

  el.btnRollAction.addEventListener("click", execute3DPhysicsRoll);
  
  // Custom Roll listeners
  el.btnRollCustom.addEventListener("click", executeCustomRoll);
  el.diceCustomFormula.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      executeCustomRoll();
    }
  });

  // Navegação de Abas da Ficha
  const tabButtons = document.querySelectorAll(".sheet-tab-btn");
  const tabPanels = document.querySelectorAll(".sheet-tab-panel");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      tabPanels.forEach(panel => {
        if (panel.id === targetTab) {
          panel.classList.add("active");
        } else {
          panel.classList.remove("active");
        }
      });
    });
  });

  // Navegação de Abas do Assistente de Criação (XP Inicial / Passo 8)
  const xpTabButtons = document.querySelectorAll(".xp-tab-btn");
  const xpTabContents = document.querySelectorAll(".xp-tab-content");
  xpTabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      
      xpTabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      xpTabContents.forEach(panel => {
        if (panel.id === targetTab) {
          panel.classList.add("active");
        } else {
          panel.classList.remove("active");
        }
      });
    });
  });

  // Filtro de Custo de Características do Wizard
  const wizTraitsCostFilter = document.getElementById("wiz-traits-cost-filter");
  if (wizTraitsCostFilter) {
    wizTraitsCostFilter.addEventListener("change", renderWizardTraits);
  }

  // Clique na moldura do retrato para abrir selecionador de arquivo
  if (el.portraitFrame && el.portraitInput) {
    el.portraitFrame.addEventListener("click", () => {
      el.portraitInput.click();
    });

    el.portraitInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 1.5 * 1024 * 1024) {
        alert("A imagem selecionada é muito grande! Por favor, escolha uma imagem menor que 1.5MB.");
        return;
      }

      logger.info(`Iniciando upload e otimização de imagem de retrato: ${file.name} (${Math.round(file.size / 1024)} KB)`);
      const reader = new FileReader();
      reader.onload = function(evt) {
        const tempImg = new Image();
        tempImg.onload = function() {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = tempImg.width;
          let height = tempImg.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(tempImg, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
          logger.info(`Retrato comprimido com sucesso. Novo tamanho Base64 aproximado: ${Math.round(compressedDataUrl.length / 1024)} KB`);

          if (state.currentCharacter) {
            state.currentCharacter.portrait = compressedDataUrl;
            if (el.portraitImg) {
              el.portraitImg.src = compressedDataUrl;
            }
            saveCurrentCharacter();
          }
        };
        tempImg.onerror = function() {
          logger.error("Erro ao carregar a imagem temporária para redimensionamento.");
          alert("Erro ao processar a imagem. Certifique-se de que é um formato válido.");
        };
        tempImg.src = evt.target.result;
      };
      reader.onerror = function(err) {
        logger.error("Erro ao ler o arquivo selecionado:", err);
      };
      reader.readAsDataURL(file);
    });
  }
    // Abrir o modal pelo botão "Lançar Dados" do cabeçalho
  document.getElementById("btn-open-roller").addEventListener("click", () => {
    document.getElementById("dice-drawer").classList.remove("hidden");
  });

  // Fechar o modal pelo botão de fechar X incorporado
  document.getElementById("btn-close-drawer").addEventListener("click", () => {
    document.getElementById("dice-drawer").classList.add("hidden");
  });

  // Fechar ao clicar na área escura de fora do modal
  document.getElementById("dice-drawer").addEventListener("click", (e) => {
    if (e.target.id === "dice-drawer") {
      document.getElementById("dice-drawer").classList.add("hidden");
    }
  });

  const btnClearChat = document.getElementById("btn-clear-chat");
  if (btnClearChat) {
    btnClearChat.addEventListener("click", () => {
      import("./js/chat.js").then(({ clearChatHistory }) => clearChatHistory());
    });
  }

  // Roteamento de eventos customizados para modularidade
  document.addEventListener("start-wizard", startWizard);
  document.addEventListener("load-new-character", (e) => {
    loadCharacter(e.detail);
  });
  document.addEventListener("cabo-guerra-refresh", () => {
    renderCaboGuerraSheet();
  });
  document.addEventListener("aptitudes-refresh", () => {
    renderAptitudesSheet();
  });
  document.addEventListener("render-chat-history", () => {
    import("./js/chat.js").then(({ renderChatHistory }) => renderChatHistory());
  });
}
