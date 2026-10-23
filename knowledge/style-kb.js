/* Guia do Estilo - local, curated knowledge retrieval. No external AI or tracking. */
(function(){
"use strict";
const dataUrl=new URL("style-knowledge.v1.json",document.currentScript?.src||document.baseURI);
const byId=id=>document.getElementById(id);
const fold=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const tokens=s=>fold(s).split(/[^a-z0-9]+/).filter(x=>x.length>2);
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let database=null,loadError=null;
async function load(){
 if(database)return database;
 const res=await fetch(dataUrl.href,{cache:"no-cache"});
 if(!res.ok)throw Error("Biblioteca indisponível (HTTP "+res.status+").");
 const v=await res.json();
 if(!Array.isArray(v.rules)||v.rules.some(r=>!r.id||!r.domain||!r.guidance))throw Error("Biblioteca inválida.");
 database=v;return v;
}
function search(db,query,options={}){
 const q=new Set(tokens(query)),domain=options.domain||"all";
 const result=db.rules.filter(r=>domain==="all"||r.domain===domain).map(r=>{
  const title=tokens(r.title),tags=r.tags.flatMap(tokens),topics=r.topics.flatMap(tokens),desc=tokens(r.guidance);
  let score=0;
  for(const t of q){if(title.includes(t))score+=7;if(tags.includes(t))score+=9;if(topics.includes(t))score+=5;if(desc.includes(t))score+=1}
  return {r,score};
 }).filter(x=>q.size?x.score>0:true).sort((a,b)=>b.score-a.score||a.r.id.localeCompare(b.r.id));
 return result.slice(0,Math.min(options.limit||5,12)).map(x=>({...x.r,relevance:x.score}));
}
function sources(r){
 if(!r.source)return '<small>Base editorial original · recomendação heurística</small>';
 const url=new URL(r.source);
 if(!/^https?:$/.test(url.protocol))return "";
 return '<small>Referência: <a href="'+esc(url.href)+'" target="_blank" rel="noopener noreferrer">'+esc(url.hostname)+'</a></small>';
}
function renderResults(results,target){
 if(!target)return;
 if(!results.length){target.innerHTML='<p>Nenhuma regra corresponde exatamente à consulta. Tente outra palavra ou categoria; não faremos uma inferência sem referência.</p>';return}
 target.innerHTML=results.map(x=>'<article class="gde-kb-rule"><b>'+esc(x.title)+'</b><p>'+esc(x.guidance)+'</p>'+sources(x)+'</article>').join("");
}
function contextualQuery(detail){
 const p=detail.opts||{},owned=detail.chosen||[];
 const body=window.getBodyFitProfile?.()||{};
 const accessories=detail.accessory||[];
 return [p.occasion,p.weather,p.formality,p.style,p.image,p.colors,p.priority,body.fit,body.shape==="nao-sei"?"":body.shape,body.proportion==="nao-sei"?"":body.proportion,owned.map(x=>[x.item?.name,x.item?.color].filter(Boolean).join(" ")).join(" "),accessories.map(x=>x.label).join(" "),"look caimento cores calcados perfume"].filter(Boolean).join(" ");
}
function contextualAdvice(db,detail){
 const p=detail.opts||{},body=window.getBodyFitProfile?.()||{},items=detail.chosen||[];
 const matches=[];
 const add=id=>{const r=db.rules.find(x=>x.id===id);if(r&&!matches.some(x=>x.id===id))matches.push(r)};
 add("OUT01");add("OUT02");
 if(p.weather==="quente")add("FAB01");if(p.weather==="frio")add("FAB02");
 if(p.formality==="formal"||p.occasion==="trabalho"||p.occasion==="evento")add("SHO01");else add("SHO02");
 if(body.fit||body.shape)add("FIT01");
 if(body.proportion&&body.proportion!=="nao-sei")add("FIT04");
 const colors=items.map(x=>fold(x.item?.color)).filter(Boolean);
 if(colors.length>1)add("CLR04");
 if(p.colors==="vivas"||p.style==="criativo")add("CLR03");
 else if(p.colors==="neutras"||p.style==="minimalista")add("CLR01");
 else add("CLR02");
 if(p.environment==="indoor")add("FRG02");
 add("FRG01");add("FRG04");
 return matches.slice(0,8);
}
function addUI(){
 const modal=byId("stylistModal");if(!modal)return;
 const host=byId("gdeLookStudio")||byId("stResult");if(!host)return;
 if(byId("gdeKBPanel"))return;
 const panel=document.createElement("section");panel.id="gdeKBPanel";panel.className="gde-kb-panel";
 panel.innerHTML='<details id="gdeKBDetails"><summary><span>Referências e critérios de estilo</span><span aria-hidden="true">⌄</span></summary><p class="gde-kb-description">Consulte regras de cores, caimento, calçados, tecidos, ocasiões e perfumes. As fotos servem como referência visual somente quando analisadas com consentimento.</p><form id="gdeKBForm"><label for="gdeKBQuery">O que você quer combinar?</label><div class="gde-kb-search"><input id="gdeKBQuery" type="search" maxlength="170" placeholder="Ex.: sapato para trabalho, cores marinho e bege"><button type="submit">Consultar</button></div><label for="gdeKBDomain">Assunto</label><select id="gdeKBDomain"><option value="all">Todos os assuntos</option><option value="cores">Cores</option><option value="caimento">Caimento</option><option value="tecidos">Tecidos</option><option value="calcados">Calçados</option><option value="estilos">Estilos</option><option value="acessorios">Acessórios</option><option value="perfumes">Perfumes</option><option value="fotografia">Fotos</option><option value="looks">Montagem de looks</option></select></form><div id="gdeKBResults" role="status" aria-live="polite"></div><p class="gde-kb-description" id="gdeKBStatus"></p></details>';
 host.insertAdjacentElement("afterend",panel);
 byId("gdeKBForm").addEventListener("submit",async ev=>{
  ev.preventDefault();
  const status=byId("gdeKBStatus"),target=byId("gdeKBResults");
  status.textContent="Consultando base local…";
  try{const db=await load();const query=byId("gdeKBQuery").value.trim(),domain=byId("gdeKBDomain").value;
   if(!query&&domain==="all"){status.textContent="Informe um tema ou escolha um assunto.";return}
   renderResults(search(db,query,{domain,limit:6}),target);status.textContent="Resultados de uma biblioteca editorial fixa; não representam pesquisa em tempo real.";
  }catch(e){status.textContent="Não foi possível carregar as referências. A montagem de looks continua funcionando.";target.innerHTML="";}
 });
}
function renderContext(db,detail){
 addUI();
 const target=byId("gdeKBResults");if(!target)return;
 const matches=contextualAdvice(db,detail);
 renderResults(matches,target);
 byId("gdeKBStatus").textContent="Critérios explicativos associados ao look. Dados do guarda-roupa têm prioridade; caimento e cor devem ser conferidos na peça real.";
}
window.addEventListener("gde:look-generated",ev=>{
 load().then(db=>renderContext(db,ev.detail)).catch(()=>{addUI();const status=byId("gdeKBStatus");if(status)status.textContent="Base editorial indisponível. As funções de looks e perfumes continuam operando.";});
});
document.addEventListener("DOMContentLoaded",addUI);
window.GDEKnowledge={load,search,contextualQuery,contextualAdvice};
})();