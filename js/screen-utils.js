export function hideAllScreens() {
  ["refugio-screen", "regiao-screen", "conflito-screen", "local-screen", "sheet-screen"].forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });
}

export function goToLanding() {
  hideAllScreens();
  document.getElementById("landing-screen")?.classList.remove("hidden");
  import("./landing.js").then(m => m.renderCharactersList());
}

export function esc(str) {
  if (!str) return "";
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

export function setupImageUpload(imageFrameId, inputId, entity, saveFn, overlayClass) {
  const frame = document.getElementById(imageFrameId);
  const input = document.getElementById(inputId);
  if (!frame || !input) return;
  frame.addEventListener("click", () => input.click());
  input.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Alerta se o arquivo for excessivamente grande
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem selecionada é muito grande! Escolha um arquivo menor que 5MB.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = evt => {
      const tempImg = new Image();
      tempImg.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
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
        
        // Comprime a imagem para JPEG com 75% de qualidade
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
        
        entity.imagem = compressedDataUrl;
        saveFn(entity);
        
        const alt = entity.nome || "Imagem";
        frame.innerHTML = `<img src="${entity.imagem}" alt="${alt}"><div class="${overlayClass || "local-image-overlay"}"><span>Alterar Imagem</span></div>`;
      };
      tempImg.onerror = () => {
        alert("Erro ao processar o arquivo de imagem.");
      };
      tempImg.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });
}
