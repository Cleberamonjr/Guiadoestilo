/* User-confirmed photo metadata; never automatically writes AI guesses to wardrobe. */
(function(){
"use strict";
const el=id=>document.getElementById(id);
const allowed={category:["superior","inferior","calcado","relogio","oculos","acessorio"],fit:["","ajustada","regular","reta","solta","oversized","estruturada"],formality:["","casual","smart-casual","formal","esportivo"]};
let candidate=null,busy=false;
function clear(){candidate=null;if(el("stPhotoAnalysis"))el("stPhotoAnalysis").hidden=true;if(el("stPhotoConfirm"))el("stPhotoConfirm").checked=false;if(el("stPhotoApply"))el("stPhotoApply").disabled=true;}
function normalize(raw){
 if(!raw||typeof raw!=="object")throw Error("O provedor não retornou dados estruturados.");
 const value=(field,max=80)=>typeof raw[field]==="string"?raw[field].trim().slice(0,max):"";
 const category=allowed.category.includes(raw.category)?raw.category:"";
 const fit=allowed.fit.includes(raw.fit)?raw.fit:"";
 const formality=allowed.formality.includes(raw.formality)?raw.formality:"";
 const confidence=raw.confidence==="high"?"alta":raw.confidence==="medium"?"moderada":"baixa";
 return {category,color:value("color",50),fit,fabric:value("fabric",70),formality,name:value("name",100),confidence,limitations:value("limitations",220)};
}
function display(c){
 el("stPhotoAnalysis").hidden=false;
 el("stPhotoAiReport").textContent="Sugestões para conferência (confiança "+c.confidence+"):\n"+
 "Peça: "+(c.name||"não identificada")+"\n"+
 "Categoria: "+(c.category||"incerta")+"\n"+
 "Cor aparente: "+(c.color||"incerta")+"\n"+
 "Caimento aparente: "+(c.fit||"não identificado")+"\n"+
 "Tecido aparente: "+(c.fabric||"não identificável")+"\n"+
 "Formalidade sugerida: "+(c.formality||"não identificável")+"\n"+
 (c.limitations?"Limites: "+c.limitations:"Confirme à luz real e experimente o caimento.");
 el("stPhotoConfirm").checked=false;el("stPhotoApply").disabled=true;
}
function fileBlob(file){
 return new Promise(async(resolve,reject)=>{
  try{
   if(!file||!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type)&&!/\.(heic|heif)$/i.test(file.name||""))throw Error("Selecione uma imagem de roupa JPEG, PNG, WebP ou HEIC.");
   if(file.size>12*1024*1024)throw Error("Imagem acima de 12 MB.");
   const image=await createImageBitmap(file),scale=Math.min(1,1000/Math.max(image.width,image.height));
   const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);image.close();
   canvas.toBlob(blob=>blob?resolve(blob):reject(Error("Falha na preparação da foto.")),"image/jpeg",.78);
  }catch(err){reject(err)}
 });
}
async function analyze(){
 if(busy)return;const file=el("stItemPhoto")?.files?.[0],status=el("stPhotoStatus"),button=el("stPhotoAnalyze");
 if(!file){status.textContent="Selecione a fotografia de uma peça antes de analisar.";return}
 busy=true;button.disabled=true;button.textContent="Analisando foto…";clear();
 try{
  if(typeof aiVision!=="function")throw Error("O analisador visual não está disponível.");
  const blob=await fileBlob(file);
  const prompt="Você é um catalogador de roupas. Analise apenas a PEÇA de roupa ou acessório visível na FOTO, nunca atributos, corpo, beleza ou identidade de uma pessoa. Você deve devolver SOMENTE JSON com campos: {\"name\":\"\", \"category\":\"superior|inferior|calcado|relogio|oculos|acessorio|\", \"color\":\"\", \"fit\":\"ajustada|regular|reta|solta|oversized|estruturada|\", \"fabric\":\"\", \"formality\":\"casual|smart-casual|formal|esportivo|\", \"confidence\":\"low|medium|high\", \"limitations\":\"\"}. Se a imagem não permite distinguir categoria, tecido, caimento ou cor, deixe o respectivo campo vazio. NÃO invente material, marca, tamanho, preço ou disponibilidade. Avalie iluminação/filtros/cobertura parcial na confiança. Formalidade é sugestão editorial, caimento real depende da prova. Sem conclusões sobre biotipo. Não armazene a imagem.";
  const out=await aiVision(prompt,blob),normalized=normalize(out?.data||out);
  candidate=normalized;display(normalized);status.textContent="Confira as sugestões e confirme antes de aplicá-las.";
 }catch(err){status.textContent="Não foi possível analisar a foto. Você ainda pode cadastrar a peça manualmente. "+String(err?.message||"").slice(0,160)}
 finally{busy=false;button.disabled=false;button.textContent="Analisar foto com IA (opcional)"}
}
function apply(){
 if(!candidate||!el("stPhotoConfirm").checked)return;
 const fields={name:"stItem",category:"stCategory",color:"stItemColor",fit:"stGarmentFit",fabric:"stGarmentFabric",formality:"stGarmentFormality"};
 for(const [field,id] of Object.entries(fields)){const value=candidate[field];if(value&&el(id))el(id).value=value}
 el("stPhotoStatus").textContent="Sugestões aplicadas aos campos. Você pode corrigir qualquer informação antes de salvar.";
 clear();
}
function init(){
 if(!el("stPhotoAnalyze"))return;
 el("stPhotoAnalyze").addEventListener("click",analyze);
 el("stPhotoConfirm").addEventListener("change",ev=>{el("stPhotoApply").disabled=!candidate||!ev.target.checked});
 el("stPhotoApply").addEventListener("click",apply);
 el("stItemPhoto")?.addEventListener("change",clear);
 window.addEventListener("gde:wardrobe-saved",clear);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
window.GDEWardrobeVision={normalize};
})();