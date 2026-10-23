(function(){
"use strict";
const el=id=>document.getElementById(id);let taxonomy=null;
const target={calca:"inferior","parte-superior":"superior",vestido:"superior",saia:"inferior",calcado:"calcado","terceira-peca":"superior",acessorio:"acessorio"};
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function load(){if(taxonomy)return taxonomy;const res=await fetch(new URL("garment-taxonomy.v1.json",document.querySelector('script[src*="wardrobe-catalog.js"]')?.src||new URL("knowledge/wardrobe-catalog.js",document.baseURI).href));if(!res.ok)throw Error("Glossário indisponível");const d=await res.json();if(!Array.isArray(d.items))throw Error("Glossário inválido");taxonomy=d;return d}
function options(query){
 const group=el("gdeGarmentGroup").value,audience=el("gdeGarmentAudience").value,kind=el("stCategory").value;
 const list=(taxonomy?.items||[]).filter(x=>(!group||x.category===group)&&(!kind||target[x.category]===kind)&&(audience==="all"||x.audience===audience||x.audience==="unissex"));
 const select=el("gdeGarmentModel"),v=select.value;
 select.innerHTML='<option value="">Modelo não especificado</option>'+list.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.label)+'</option>').join("");
 if(list.some(x=>x.id===v))select.value=v;
 advice();
}
function advice(){
 const id=el("gdeGarmentModel").value,r=taxonomy?.items?.find(x=>x.id===id);
 el("gdeGarmentAdvice").textContent=r?"Modelagem: "+r.silhouette+". "+r.fitAdvice+" "+r.pairingAdvice:"Escolha um modelo conhecido para ver sugestões de caimento. Prefira o conforto e a mobilidade reais.";
}
function init(){
 const inp=el("stItem"),category=el("stCategory");if(!inp||!category)return;
 const panel=document.createElement("div");panel.className="gde-garment-reference";panel.innerHTML='<h4>Referência de modelagem</h4><p>Uma biblioteca de tipos de roupa ajuda a identificar peças. Todas as peças podem ser usadas por qualquer pessoa.</p><div class="gde-garment-fields"><label>Grupo<select id="gdeGarmentGroup"><option value="">Todos</option><option value="calca">Calças</option><option value="parte-superior">Camisetas, camisas e blusas</option><option value="vestido">Vestidos</option><option value="saia">Saias</option><option value="terceira-peca">Casacos e terceiras peças</option><option value="calcado">Calçados</option><option value="acessorio">Acessórios</option></select></label><label>Referência de modelagem<select id="gdeGarmentAudience"><option value="all">Todas</option><option value="masculino">Modelagens masculinas</option><option value="feminino">Modelagens femininas</option></select></label><label>Modelo<select id="gdeGarmentModel"><option value="">Carregando referência…</option></select></label></div><p id="gdeGarmentAdvice" role="status">Verifique o conforto, a finalidade e o caimento real da peça.</p><p id="gdeGarmentCount"></p>';
 category.closest("label")?.insertAdjacentElement("afterend",panel);
 el("gdeGarmentGroup").addEventListener("change",()=>{const kind=el("gdeGarmentGroup").value;if(kind&&target[kind])category.value=target[kind];options()});el("gdeGarmentAudience").addEventListener("change",options);
 category.addEventListener("change",options);el("gdeGarmentModel").addEventListener("change",()=>{
 const r=taxonomy?.items?.find(x=>x.id===el("gdeGarmentModel").value);
 if(r){const inp=el("stItem");if(!inp.value.trim())inp.value=r.label;if(r.category==="vestido")category.value="superior";else if(r.category==="saia")category.value="inferior";else category.value=target[r.category]||category.value}
 advice()
 });
 load().then(d=>{el("gdeGarmentCount").textContent=d.items.length+" referências de peças disponíveis nesta versão.";options()}).catch(()=>{el("gdeGarmentCount").textContent="Referências indisponíveis; o cadastro manual continua disponível."});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
window.GDEGarmentCatalog={load,getSelected(){const key=el("gdeGarmentModel")?.value;return taxonomy?.items?.find(x=>x.id===key)||null},target};
})();