const fs = require('fs');
let content = fs.readFileSync('js/refugio.js', 'utf8');

// Remove the objects
const regexArray = /const (DEFESA_LABELS|MORAL_LABELS|BELIGERANCIA_LABELS|CONSTRUCOES_MODELO) = \[\s*[\s\S]*?\s*\];/g;
content = content.replace(regexArray, '');

const regexObj = /const (CRISE_GATILHOS|CRISE_GRAVIDADES) = \{\s*[\s\S]*?\s*\};/g;
content = content.replace(regexObj, '');

// Update imports
content = content.replace(
  'import { renderImageFrame, renderCrudListEmpty, renderRefPanelSingle } from "./screen-components.js";',
  'import { renderImageFrame, renderCrudListEmpty, renderRefPanelSingle } from "./screen-components.js";\nimport { openSelectReferencesModal } from "./modals.js";'
);

content = content.replace(
  'import { getDieFaceImgSrc } from "./chat.js";',
  'import { getDieFaceImgSrc } from "./chat.js";\nimport { DEFESA_LABELS, MORAL_LABELS, BELIGERANCIA_LABELS, CONSTRUCOES_MODELO, CRISE_GATILHOS, CRISE_GRAVIDADES } from "./dados.js";'
);

// Add user changes back at the bottom
const oldBottom =   [["refugio-ref-regiao", "regiaoId"], ["refugio-ref-local", "localId"]].forEach(([id, key]) => {
    screen.querySelector(\#\\)?.addEventListener("change", e => {
      r[key] = e.target.value || null;
      saveRefugio(r);
    });
  });;

const newBottom =   const _attachSingleRefListener = (containerId, fieldKey, stateKey) => {
    const openBtn = screen.querySelector(\#\-chips\)?.parentNode.querySelector(".btn-open-ref-modal-single");
    if (openBtn) {
      openBtn.addEventListener("click", e => {
        const label = e.target.dataset.reflabel;
        const currentIds = r[fieldKey] ? [r[fieldKey]] : [];
        openSelectReferencesModal("Vincular " + label, stateKey, currentIds, (selectedIds) => {
          r[fieldKey] = selectedIds.length > 0 ? selectedIds[0] : null;
          saveRefugio(r);
          renderRefugioSheet();
        }, true);
      });
    }
    screen.querySelectorAll(\#\-chips .btn-remove-ref\).forEach(btn => {
      btn.addEventListener("click", () => {
        r[fieldKey] = null;
        saveRefugio(r); renderRefugioSheet();
      });
    });
  };

  _attachSingleRefListener("refugio-ref-regiao", "regiaoId", "regioes");
  _attachSingleRefListener("refugio-ref-local", "localId", "locais");;

content = content.replace(oldBottom, newBottom);

fs.writeFileSync('js/refugio.js', content, 'utf8');