/* Fashionpedia (CC BY 4.0) adapter for the user's confirmed wardrobe metadata.
 * Ontology: https://github.com/KMnP/fashionpedia-api/tree/master/data/demo
 * No photos, model weights or third-party API calls.
 */
(function(){
"use strict";
const el=id=>document.getElementById(id);
const escape=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const groupLabels={"nickname":"Modelo específico","silhouette":"Silhueta","waistline":"Cintura","length":"Comprimento","neckline type":"Decote","opening type":"Fechamento","non-textile material type":"Materiais não têxteis","leather":"Couro","textile finishing, manufacturing techniques":"Acabamento","textile pattern":"Estampa","animal":"Textura animal"};
let db=null,error=null,selectedAttributes=new Set();
const categoryOverrides={
  "calca":6,"vestido":10,"saia":8,"calcado":23,"parte-superior":1,"terceira-peca":4,"acessorio":24
};
const typeOverrides=[
 [/camiseta|t-shirt|top|regata|blusa|body|cropped|moletom/i,1],
 [/camisa|oxford|blouse|social|henley/i,0],
 [/sueter|suéter|gola alta|tricot|tricô/i,2],
 [/cardig/i,3],
 [/blazer|jaqueta|bomber|puffer/i,4],
 [/colete/i,5],
 [/sobretudo|trench|coat/i,9],
 [/vestido/i,10],
 [/jumpsuit|macacao|macacão/i,11],
 [/oculos|óculos/i,13],
 [/relogio|relógio/i,18],
 [/cinto/i,19],
 [/bolsa|carteira/i,24],
 [/tenis|tênis|sapato|mocassim|loafer|bota|sandalia|sandália|sapatilha|salto/i,23],
 [/lenço|cachecol/i,25]
];
function impliedId(item){
 if(!item)return null;
 const text=normalize(item.label||item.name);
 const override=typeOverrides.find(([pattern])=>pattern.test(text));
 return override?override[1]:(categoryOverrides[item.category||item.garmentType]??null);
}
function dropdown(item){
 const sel=el("fpCategory");if(!sel||!db)return;
 const existing=sel.value;
 sel.innerHTML='<option value="">Não especificada</option>'+db.categories.filter(x=>x.id<27).map(x=>'<option value="'+x.id+'">'+escape(x.name)+'</option>').join("");
 const proposed=impliedId(item);
 sel.value=proposed===null?"":String(proposed);
}
function getSelected(){
 const category=Number(el("fpCategory")?.value),raw=el("fpCategory")?.value||"";
 const group=raw!==""&&db?.categories?.find(x=>x.id===category);
 return {fashionpediaCategoryId:group?group.id:null,fashionpediaCategoryName:group?group.name:"",fashionpediaAttributeIds:[...selectedAttributes].filter(id=>db?.attributes?.some(a=>a.id===id)).sort((a,b)=>a-b),ontologyVersion:"Fashionpedia-2020"};
}
function attributes(){
 if(!db)return;
 const term=normalize(el("fpSearch")?.value||"").trim();
 const group=el("fpGroup")?.value||"all";
 const list=db.attributes.filter(a=>(group==="all"||a.supercategory===group)&&(!term||normalize(a.name+" "+a.supercategory).includes(term))).slice(0,36);
 const target=el("fpAttributes");if(!target)return;
 target.innerHTML=list.map(a=>'<label><input type="checkbox" data-fp-attr="'+a.id+'" '+(selectedAttributes.has(a.id)?"checked":"")+'><span>'+escape(a.name)+'</span></label>').join("")||'<p>Nenhum atributo corresponde à busca.</p>';
 el("fpCount").textContent=db.attributes.length+" atributos disponíveis; "+selectedAttributes.size+" selecionado(s).";
}
function create(){
 const anchor=el("gdeGarmentModel");if(!anchor||el("fpPanel"))return;
 const box=document.createElement("details");box.className="gde-fp-panel";box.id="fpPanel";
 box.innerHTML='<summary>Detalhes avançados da peça · Fashionpedia</summary><p>Classifique com mais precisão; confirme somente características que você reconhece. Opcional.</p><label for="fpCategory">Categoria Fashionpedia</label><select id="fpCategory"><option value="">Carregando…</option></select><label for="fpGroup">Tipo de atributo</label><select id="fpGroup"><option value="all">Todos</option></select><label for="fpSearch">Pesquisar atributos (inglês original)</label><input id="fpSearch" type="search" maxlength="70" placeholder="Ex.: high waist, collar, plaid"><div id="fpAttributes" class="gde-fp-attrs"></div><p id="fpCount"></p><p class="gde-fp-attribution">Fonte: <a href="https://fashionpedia.github.io/home/data_license.html" target="_blank" rel="noopener noreferrer">Fashionpedia Consortium — CC BY 4.0</a>. Ontologia original preservada, classificações do Guia do Estilo são adaptações. Sem imagens do dataset.</p>';
 anchor.closest(".gde-garment-fields")?.insertAdjacentElement("afterend",box);
 if(!el("fpPanel"))anchor.closest("label")?.insertAdjacentElement("afterend",box);
 el("fpAttributes")?.addEventListener("change",e=>{const input=e.target.closest("input[data-fp-attr]");if(!input)return;const id=Number(input.dataset.fpAttr);if(input.checked&&selectedAttributes.size>=8){input.checked=false;el("fpCount").textContent="Use até 8 atributos principais por peça.";return}if(input.checked)selectedAttributes.add(id);else selectedAttributes.delete(id);attributes()});
 el("fpGroup").addEventListener("change",attributes);el("fpSearch").addEventListener("input",attributes);
 el("gdeGarmentModel").addEventListener("change",()=>dropdown(window.GDEGarmentCatalog?.getSelected()));
 el("stCategory")?.addEventListener("change",()=>dropdown(window.GDEGarmentCatalog?.getSelected()||{category:({"superior":"parte-superior","inferior":"calca","calcado":"calcado","relogio":"acessorio","oculos":"acessorio","acessorio":"acessorio"}[el("stCategory").value])}));
 window.addEventListener("gde:wardrobe-saved",()=>{selectedAttributes=new Set();if(el("fpSearch"))el("fpSearch").value="";dropdown(null);attributes()});
}
async function load(){
 if(db)return db;
 const response=await fetch(new URL("fashionpedia-ontology.v1.json",document.querySelector('script[src*="fashionpedia-bridge.js"]')?.src||new URL("knowledge/fashionpedia-bridge.js",document.baseURI).href));
 if(!response.ok)throw Error("Ontologia indisponível");
 const data=await response.json();
 if(data.categories?.length!==46||data.attributes?.length!==294)throw Error("Ontologia incompleta");
 db=data;return db;
}
async function init(){
 create();
 try{const data=await load();const group=el("fpGroup");if(group){const families=[...new Set(data.attributes.map(x=>x.supercategory))];for(const name of families){const opt=document.createElement("option");opt.value=name;opt.textContent=groupLabels[name]||name;group.appendChild(opt)}}dropdown(window.GDEGarmentCatalog?.getSelected());attributes()}
 catch(e){error=e;const panel=el("fpPanel");if(panel)panel.innerHTML='<summary>Detalhes Fashionpedia indisponíveis</summary><p>O cadastro tradicional continua funcionando.</p>'}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
window.GDEFashionpedia={load,getSelected,impliedId,getError:()=>error};
})();