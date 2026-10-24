(function () {
  "use strict";
  const ROOT = "/app/assets/silhouettes/";
  const LEVELS = 6;
  const labels = ["Muito estreita", "Estreita", "Intermediária", "Moderadamente ampla", "Ampla", "Muito ampla"];
  function normalizeGender(gender) {
    const v = String(gender || "").toLowerCase();
    return v === "feminino" || v === "female" || v === "f" ? "feminino" : "masculino";
  }
  function render(n, gender, proportions = {}) {
    const level = Math.max(1, Math.min(LEVELS, Math.round(Number(n) || 3)));
    const sex = normalizeGender(gender);
    const file = `${sex}-${String(level).padStart(2, "0")}.png`;
    return `<img class="gde-avatar-render gde-avatar-photo" src="${ROOT}${file}" alt="Silhueta ${sex}: ${labels[level - 1]}" loading="lazy" decoding="async" style="display:block;width:100%;height:100%;object-fit:contain;object-position:center" />`;
  }
  function mountNav() {
    const nav = document.querySelector(".gde-refined-nav");
    if (nav && nav.parentElement !== document.body) {
      document.body.appendChild(nav);
      nav.style.setProperty("height", "auto", "important");
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountNav);
  else mountNav();
  window.GDEAvatar3D = { render, labels, levels: LEVELS };
})();
