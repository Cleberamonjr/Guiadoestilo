/* v42 — mobile-first information architecture.
 * All olfactory content lives in Perfumes. Compact optional sections, no data loss.
 */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const view=$("viewPerfumes"),home=$("styleHome"),hub=$("perfumeHub"),vision=$("styleVision");
if(!view||!home||!vision)return;
let perfumeHub=hub;
if(!perfumeHub){perfumeHub=document.createElement("section");perfumeHub.id="perfumeHub";view.appendChild(perfumeHub)}
perfumeHub.setAttribute("aria-label","Minha coleção de perfumes");
function wrap(id,heading,sub,open=false){
 const node=$(id);if(!node)return;
 let details=$("gdeSection-"+id);
 if(!details){details=document.createElement("details");details.id="gdeSection-"+id;details.className="gde-fold";details.innerHTML='<summary><span><b>'+heading+'</b><small>'+sub+'</small></span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m6 9 6 6 6-6"/></svg></summary>';node.parentElement.insertBefore(details,node);details.append(node)}
 details.open=open;return details;
}
function section(id){const node=$(id);if(node&&node.parentElement!==perfumeHub)perfumeHub.appendChild(node);return node}
const header=perfumeHub.querySelector(".perfume-hub-heading");
if(header){header.querySelector("p").textContent="Sua coleção, preferências e consultoria em um só lugar.";header.querySelector("h2").textContent="Meus perfumes";}
for(const key of ["pSummary","onboardingNote","pControls","pGrid","pEmpty","profileDashboard","occasionAdvisor","scentQuizSection"])section(key);
// Move the photo analyzer out of the long default scroll and keep it on-demand.
const photoBox=document.createElement("div");photoBox.id="gdePhotoFold";photoBox.className="gde-photo-fold";
home.insertAdjacentElement("afterend",photoBox);photoBox.append(vision);
const photoToggle=document.createElement("button");photoToggle.type="button";photoToggle.id="gdeOpenPhoto";photoToggle.className="gde-photo-entry";photoToggle.setAttribute("aria-controls","gdePhotoFold");photoToggle.setAttribute("aria-expanded","false");
photoToggle.innerHTML='<span class="gde-photo-entry-icon"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="15" rx="3"/><circle cx="12" cy="12" r="3.4"/><path d="m8 5 1-2h6l1 2"/></svg></span><span><b>Analisar um look por foto</b><small>Abra somente quando quiser usar a câmera ou galeria</small></span><svg class="gde-photo-chevron" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m9 6 6 6-6 6"/></svg>';
home.insertAdjacentElement("afterend",photoToggle);
function togglePhoto(force){const expand=typeof force==="boolean"?force:!photoBox.classList.contains("open");photoBox.classList.toggle("open",expand);photoToggle.setAttribute("aria-expanded",String(expand));if(expand)photoBox.scrollIntoView({behavior:"smooth",block:"start"})}
photoToggle.onclick=()=>togglePhoto();
const scent=wrap("scentQuizSection","Minhas preferências olfativas","Questionário editável",false);
const dna=wrap("profileDashboard","DNA olfativo","Radar e leitura da sua coleção",false);
const adviser=wrap("occasionAdvisor","Escolher fragrância","Sugestões para cada ocasião",false);
const filter=$("pControls");
if(filter){
 const wrapNode=document.createElement("div");wrapNode.className="gde-perfume-filters";
 const controls=document.createElement("details");controls.className="gde-fold gde-filter-fold";controls.innerHTML='<summary><span><b>Filtrar coleção</b><small>Marca, família, características e ordenação</small></span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m6 9 6 6 6-6"/></svg></summary>';
 filter.parentNode.insertBefore(wrapNode,filter);wrapNode.appendChild(controls);controls.append(filter);
}
const shortcut=document.createElement("button");shortcut.type="button";shortcut.className="gde-perfume-add";shortcut.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg><span>Adicionar perfume</span>';
shortcut.addEventListener("click",()=>window.openPerfume?.());
const count=$("pSummary");if(count)count.insertAdjacentElement("afterend",shortcut);else perfumeHub.prepend(shortcut);
// Put perfume collection before all deep analysis panels.
const grid=$("pGrid");const empty=$("pEmpty");const sortBlock=$("."); // safe no-op
if(grid){
 const controlWrap=perfumeHub.querySelector(".gde-perfume-filters");
 const top=shortcut.nextSibling;
 if(controlWrap)shortcut.insertAdjacentElement("afterend",controlWrap);
 controlWrap?.insertAdjacentElement("afterend",grid);
 if(empty)grid.insertAdjacentElement("afterend",empty);
}
if(dna)perfumeHub.append(dna);
if(adviser)perfumeHub.append(adviser);
if(scent)perfumeHub.append(scent);
function activate(tab){
 const active=tab==="perfumes";
 perfumeHub.hidden=!active;
 home.hidden=active;
 photoToggle.hidden=active;
 photoBox.hidden=active;
 document.querySelectorAll(".product-nav-item").forEach(btn=>{
 const selected=btn.dataset.view===(active?"perfumes":"inicio");
 btn.classList.toggle("active",selected);
 if(selected)btn.setAttribute("aria-current","page");else btn.removeAttribute("aria-current");
 });
 window.scrollTo?.({top:0,behavior:"instant"});
}
const perfumesNav=$("navCollection"),homeNav=$("navHome"),profileNav=$("navProfile");
perfumesNav?.addEventListener("click",()=>activate("perfumes"));
homeNav?.addEventListener("click",()=>activate("inicio"));
profileNav?.addEventListener("click",()=>{activate("inicio");window.GDEOnboarding?.open(true)});
$("homeOpenProfile")?.addEventListener("click",()=>window.GDEOnboarding?.open(true));
$("scentGoQuiz")?.addEventListener("click",()=>{
 activate("perfumes");if(scent){scent.open=true;scent.scrollIntoView({behavior:"smooth",block:"start"})}
});
function showPerfumes(){if(view.hidden&&typeof window.switchTab==="function")window.switchTab("perfumes");activate("perfumes")}
window.gdeOpenPerfumes=showPerfumes;
window.switchProductView=(function(prior){return function(name){if(name==="relogios"){activate("inicio");return prior?.(name)}showPerfumes()}})(window.switchProductView);
activate("inicio");
window.GDEMobileLayout={activate,togglePhoto};
})();