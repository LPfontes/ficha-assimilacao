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

export function setupImageUpload(imageFrameId, inputId, entity, saveFn) {
  const frame = document.getElementById(imageFrameId);
  const input = document.getElementById(inputId);
  if (!frame || !input) return;
  frame.addEventListener("click", () => input.click());
  input.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      entity.imagem = evt.target.result;
      saveFn(entity);
      const alt = entity.nome || "Imagem";
      frame.innerHTML = `<img src="${entity.imagem}" alt="${alt}"><div class="local-image-overlay"><span>Alterar Imagem</span></div>`;
    };
    reader.readAsDataURL(file);
  });
}
