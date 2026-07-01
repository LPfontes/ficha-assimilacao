import { el, state, loadCharactersFromStorage, saveCurrentCharacter, loadCharacter, deleteActiveCharacter, importCharacterFile, getCustomTraits, getCustomMutations, updateCloudSyncBadge } from "./js/state.js";
import { startWizard, wizardPrevStep, wizardNextStep, wizardFinish, renderWizardTraits } from "./js/wizard.js";
import { updateDiceDrawerUI, execute3DPhysicsRoll, executeCustomRoll, setupNumberInputControls, updateKeepCountDisplay, initRolagemAssimiladaPanel } from "./js/roller.js";
import { openTraitsModal, openAssimilationTestModal, openSettingsModal, openManageItemsModal, openMutationSelectionScreen, openAddItemModal, openUpgradeAptitudesModal, openAssimilationLibraryModal, openCreateTraitModal, openCreateMutationModal, openCloudSyncModal, openExportModal } from "./js/modals.js";
import { renderAptitudesSheet, adjustCaboGuerraLevels, executeAssimilacaoAvanco, renderCaboGuerraSheet, addBodySlot, addBackpackSlot } from "./js/sheet.js";
import { ICONS } from "./icons.js";
import { logger } from "./js/logger.js";
import { initLandingScreen, showLandingScreen, renderCharactersList } from "./js/landing.js";
import { worldState, loadAllWorldData } from "./js/world-state.js";
import { initMesaUI, broadcastCharacterState, broadcastRoll } from "./js/mesa-ui.js";

// ==========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  logger.info("Aplicação carregada. Inicializando components...");
  renderIcons();
  loadCharactersFromStorage();
  updateCloudSyncBadge();

  // Carrega todos os novos tipos de ficha do mundo
  loadAllWorldData();
  // Expõe para uso em landing.js (acesso síncrono sem import dinâmico)
  window._worldState = worldState;

  initDiceBox();
  setupEventListeners();
  setupRoomTabs();
  
  // Inicializa a tela de entrada (Landing)
  initLandingScreen();
  initMesaUI();
  showLandingScreen();
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
  el.btnNewChar.addEventListener("click", startWizard);
  el.btnDeleteChar.addEventListener("click", deleteActiveCharacter);
  if (el.btnSettings) {
    el.btnSettings.addEventListener("click", openSettingsModal);
  }
  if (el.btnManageItems) {
    el.btnManageItems.addEventListener("click", openManageItemsModal);
  }
  if (el.btnCloudSync) {
    el.btnCloudSync.addEventListener("click", openCloudSyncModal);
  }
  
  // Logo home button - volta para landing screen
  const btnHome = document.getElementById("btn-home");
  if (btnHome) {
    btnHome.addEventListener("click", () => {
      goToLanding();
    });
  }

  // Export/Import JSON
  el.btnExportJson.addEventListener("click", openExportModal);
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


  }

  // Voltar button in mobile sidebar
  const btnVoltar = document.getElementById("btn-voltar-landing");
  if (btnVoltar) {
    btnVoltar.addEventListener("click", goToLanding);
  }

  document.querySelectorAll(".btn-lock-toggle").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".aptitude-column-card");
      if (card) {
        const isLocked = card.classList.toggle("locked");
        card.classList.toggle("card-glass", isLocked);
        const iconSpan = btn.querySelector("[data-icon]");
        if (iconSpan) {
          iconSpan.setAttribute("data-icon", isLocked ? "lock" : "unlock");
          // Re-render icon
          const iconName = iconSpan.getAttribute("data-icon");
          if (ICONS[iconName]) {
            iconSpan.innerHTML = ICONS[iconName];
          }
        }
        renderAptitudesSheet();
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
  if (el.btnWizCancel) {
    el.btnWizCancel.addEventListener("click", () => {
      if (confirm("Deseja cancelar a criação do personagem? Todo o progresso será perdido.")) {
        goToLanding();
      }
    });
  }
  el.btnWizPrev.addEventListener("click", wizardPrevStep);
  el.btnWizNext.addEventListener("click", wizardNextStep);
  el.btnWizFinish.addEventListener("click", wizardFinish);
  
  // Ficha Auto-save inputs
  const autoSaveInputs = [el.charName, el.charOcupacao, el.charEvento, el.charPropP1, el.charPropP2, el.charPropCol, el.charPropCol2, el.charNotes];
  autoSaveInputs.forEach(input => {
    input.addEventListener("input", () => {
      if (state.currentCharacter) {
        state.currentCharacter.name = el.charName.value || "Sem Nome";
        state.currentCharacter.ocupacao = el.charOcupacao.value;
        state.currentCharacter.evento = el.charEvento.value;
        state.currentCharacter.propP1 = el.charPropP1.value;
        state.currentCharacter.propP2 = el.charPropP2.value;
        state.currentCharacter.propCol = el.charPropCol.value;
        state.currentCharacter.propCol2 = el.charPropCol2.value;
        state.currentCharacter.notes = el.charNotes.value;
        saveCurrentCharacter();
        
        
      }
    });
  });

  // Modal Generic Close
  el.modalContainer.addEventListener("click", (e) => {
    if (e.target === el.modalContainer || e.target.classList.contains("modal-close")) {
      el.modalContainer.classList.add("hidden");
    }
  });

  // Torna os modais arrastáveis
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;
  let currentDragTarget = null;

  document.addEventListener("mousedown", (e) => {
    const modalContent = e.target.closest(".modal-content, .conflito-modal-content");
    if (!modalContent) return;

    // Não arrasta se clicar em botões, campos de entrada, selects, links ou no botão de fechar
    const tag = e.target.tagName.toLowerCase();
    if (
      tag === "input" || 
      tag === "button" || 
      tag === "select" || 
      tag === "textarea" || 
      tag === "a" || 
      e.target.closest(".btn") || 
      e.target.classList.contains("modal-close") ||
      e.target.closest(".dice-skills-selection") || 
      e.target.closest(".results-dice-grid") ||
      e.target.closest(".library-items-grid")
    ) {
      return;
    }
    
    isDragging = true;
    currentDragTarget = modalContent;
    currentDragTarget.style.cursor = "grabbing";
    
    const rect = currentDragTarget.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    
    startX = e.clientX;
    startY = e.clientY;
    
    currentDragTarget.style.position = "absolute";
    currentDragTarget.style.margin = "0";
    currentDragTarget.style.left = `${initialLeft}px`;
    currentDragTarget.style.top = `${initialTop}px`;
    currentDragTarget.style.transform = "none";
    currentDragTarget.style.animation = "none";
    
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging || !currentDragTarget) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    currentDragTarget.style.left = `${initialLeft + dx}px`;
    currentDragTarget.style.top = `${initialTop + dy}px`;
  });

  document.addEventListener("mouseup", () => {
    if (isDragging && currentDragTarget) {
      isDragging = false;
      currentDragTarget.style.cursor = "grab";
      currentDragTarget = null;
    }
  });

  // Aplica o cursor grab inicial
  document.querySelectorAll(".modal-content, .conflito-modal-content").forEach(m => m.style.cursor = "grab");

  // Observer para recentralizar os modais quando os containers forem escondidos
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "class") {
        const targetContainer = mutation.target;
        if (targetContainer.classList.contains("hidden")) {
          // Reseta todos os modais dentro deste container
          const modalsInside = targetContainer.querySelectorAll(".modal-content, .conflito-modal-content");
          modalsInside.forEach(m => {
            m.style.position = "";
            m.style.left = "";
            m.style.top = "";
            m.style.transform = "";
            m.style.margin = "";
            m.style.animation = "";
            m.style.cursor = "grab";
          });
        }
      }
    });
  });
  
  if (el.modalContainer) observer.observe(el.modalContainer, { attributes: true, attributeFilter: ["class"] });
  const diceDrawer = document.getElementById("dice-drawer");
  if (diceDrawer) observer.observe(diceDrawer, { attributes: true, attributeFilter: ["class"] });

  // Add Trait from Sheet
  el.btnAddTraitSheet.addEventListener("click", openTraitsModal);
  el.btnAssimilationTest.addEventListener("click", openAssimilationTestModal);

  // Add Item to Inventory
  const btnAddItem = document.getElementById("btn-add-item");
  if (btnAddItem) btnAddItem.addEventListener("click", openAddItemModal);
  
  if (el.btnIncBodySlot) el.btnIncBodySlot.addEventListener("click", addBodySlot);
  if (el.btnIncBackpackSlot) el.btnIncBackpackSlot.addEventListener("click", addBackpackSlot);

  const btnAddItemBody = document.getElementById("btn-add-item-body");
  if (btnAddItemBody) btnAddItemBody.addEventListener("click", openAddItemModal);

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

  const btnOpenAssimilationLibrary = document.getElementById("btn-open-assimilation-library");
  if (btnOpenAssimilationLibrary) {
    btnOpenAssimilationLibrary.addEventListener("click", openAssimilationLibraryModal);
  }

  // Homebrew buttons
  const btnCreateHomebrewTrait = document.getElementById("btn-create-homebrew-trait");
  if (btnCreateHomebrewTrait) {
    btnCreateHomebrewTrait.addEventListener("click", openCreateTraitModal);
  }
  const btnCreateHomebrewMutation = document.getElementById("btn-create-homebrew-mutation");
  if (btnCreateHomebrewMutation) {
    btnCreateHomebrewMutation.addEventListener("click", openCreateMutationModal);
  }

  // Homebrew import/export
  const btnExportHomebrew = document.getElementById("btn-export-homebrew");
  if (btnExportHomebrew) {
    btnExportHomebrew.addEventListener("click", () => {
      const pkg = {
        format: "assimilacao_homebrew_package",
        version: 1,
        name: "Homebrew Pack",
        traits: getCustomTraits(),
        mutations: getCustomMutations()
      };
      const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "homebrew_pack.json";
      a.click();
      URL.revokeObjectURL(blob);
    });
  }
  const btnImportHomebrew = document.getElementById("btn-import-homebrew");
  const fileImportHomebrew = document.getElementById("file-import-homebrew");
  if (btnImportHomebrew && fileImportHomebrew) {
    btnImportHomebrew.addEventListener("click", () => fileImportHomebrew.click());
    fileImportHomebrew.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const pkg = JSON.parse(evt.target.result);
          if (pkg.format !== "assimilacao_homebrew_package") {
            alert("Formato de pacote inválido.");
            return;
          }
          if (pkg.traits && Array.isArray(pkg.traits)) {
            const existing = getCustomTraits();
            const merged = [...existing, ...pkg.traits];
            localStorage.setItem("assimilação_homebrew_traits", JSON.stringify(merged));
          }
          if (pkg.mutations && Array.isArray(pkg.mutations)) {
            const existing = getCustomMutations();
            const merged = [...existing, ...pkg.mutations];
            localStorage.setItem("assimilação_homebrew_mutations", JSON.stringify(merged));
          }
          alert(`Pacote "${pkg.name || 'Homebrew'}" importado com ${(pkg.traits||[]).length} características e ${(pkg.mutations||[]).length} mutações.`);
          import("./js/sheet.js").then(({ renderHomebrewSheet }) => renderHomebrewSheet());
        } catch (err) {
          alert("Erro ao ler pacote: " + err.message);
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });
  }

  // Cabo de Guerra Adjustments
  if (el.btnDecDet) el.btnDecDet.addEventListener("click", () => adjustCaboGuerraLevels(-1));
  if (el.btnIncDet) el.btnIncDet.addEventListener("click", () => adjustCaboGuerraLevels(1));
  if (el.btnDecAss) el.btnDecAss.addEventListener("click", () => adjustCaboGuerraLevels(1));
  if (el.btnIncAss) el.btnIncAss.addEventListener("click", () => adjustCaboGuerraLevels(-1));
  if (el.btnAvancoAssimilacao) el.btnAvancoAssimilacao.addEventListener("click", executeAssimilacaoAvanco);

  // XP Adjustments
  if (el.btnDecXp) {
    el.btnDecXp.addEventListener("click", () => {
      if (state.currentCharacter) {
        state.currentCharacter.xp = Math.max(0, (state.currentCharacter.xp || 0) - 1);
        saveCurrentCharacter();
        updateXpDisplay();
      }
    });
  }
  if (el.btnIncXp) {
    el.btnIncXp.addEventListener("click", () => {
      if (state.currentCharacter) {
        state.currentCharacter.xp = (state.currentCharacter.xp || 0) + 1;
        saveCurrentCharacter();
        updateXpDisplay();
      }
    });
  }

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
  el.modBonusKeep?.addEventListener("input", updateKeepCountDisplay);
  
  if (el.modEmpenhoAss) el.modEmpenhoAss.addEventListener("change", initRolagemAssimiladaPanel);
  if (el.modOrigemOcupacaoAss) el.modOrigemOcupacaoAss.addEventListener("change", initRolagemAssimiladaPanel);
  if (el.modOrigemEventoAss) el.modOrigemEventoAss.addEventListener("change", initRolagemAssimiladaPanel);
  if (el.modBonusKeepAss) el.modBonusKeepAss.addEventListener("input", initRolagemAssimiladaPanel);
  
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

  // Botão Evoluir Aptidões (XP)
  const btnUpgradeApt = document.getElementById("btn-upgrade-aptitudes");
  if (btnUpgradeApt) btnUpgradeApt.addEventListener("click", openUpgradeAptitudesModal);

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

  // Enviar resultado para a Mesa
  document.getElementById("btn-send-normal-to-mesa")?.addEventListener("click", () => {
    import("./js/roller.js").then(({ sendRollToMesa }) => sendRollToMesa(false));
  });
  document.getElementById("btn-send-instinto-to-mesa")?.addEventListener("click", () => {
    import("./js/roller.js").then(({ sendRollToMesa }) => sendRollToMesa(true));
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

  // Ouvintes para gerenciamento de rolagens personalizadas (macros)
  if (el.btnAddCustomRoll) {
    el.btnAddCustomRoll.addEventListener("click", () => {
      import("./js/modals.js").then(({ openCustomRollModal }) => openCustomRollModal());
    });
  }


}

function goToLanding() {
  import("./js/landing.js").then(({ showLandingScreen, renderCharactersList }) => {
    showLandingScreen();
  });
}

function setupRoomTabs() {
  const tabs = document.querySelectorAll(".room-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.roomTab;
      document.querySelectorAll(".room-tab-content").forEach(c => c.classList.add("hidden"));
      const content = document.getElementById("room-tab-" + target);
      if (content) content.classList.remove("hidden");
    });
  });
  const joinStep = document.getElementById("room-step-join");
  if (joinStep) {
    document.querySelector("[data-room-tab='entrar']")?.addEventListener("click", () => {
      document.getElementById("room-step-join")?.classList.remove("hidden");
    });
  }
}

function updateXpDisplay() {
  const char = state.currentCharacter;
  if (!char) return;
  // Modal de características (aberto via openTraitsModal)
  const xpEl = document.getElementById("xp-value");
  if (xpEl) xpEl.textContent = char.xp;
  // Contador de XP na aba da ficha (sempre visível na sheet-screen)
  const sheetXpEl = document.getElementById("sheet-xp-value");
  if (sheetXpEl) sheetXpEl.textContent = char.xp;
  // Modal de upgrade de aptidões (se estiver aberto)
  const upgradeXpEl = document.getElementById("modal-xp-value-upgrade");
  if (upgradeXpEl) upgradeXpEl.textContent = char.xp;
}
