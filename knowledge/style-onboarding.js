(function(){
"use strict";
const key="gde:welcome:v1",profileKey="gde:stylist-profile:v1",bodyKey="gde:body-fit:v1",scentKey="gde:scent-preferences:v1";
const el=id=>document.getElementById(id),read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"null")||d}catch(e){return d}},save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};
let step=0,form={gender:"",frame:"",style:"casual",image:"elegante",routine:"variada",fit:"regular",colors:"neutras",family:"",sweetness:"",projection:""};
const options=(key,list)=>'<label>'+({style:"Estilo preferido",image:"Imagem desejada",routine:"Rotina",fit:"Como prefere o caimento?",colors:"Cores favoritas",family:"Família olfativa",sweetness:"Doçura",projection:"Projeção"}[key]||key)+'<select data-field="'+key+'">'+list.map(o=>'<option value="'+o[0]+'">'+o[1]+'</option>').join("")+'</select></label>';
function avatar(frame,rose){const w=18+frame*7,c=rose?"#DFA8BA":"#BDC9D6",line=rose?"#AC6983":"#8194A8";return '<svg viewBox="0 0 90 120" aria-hidden="true"><circle cx="45" cy="15" r="11" fill="'+c+'" stroke="'+line+'"/><path d="M'+(45-w/2)+' 41 Q45 34 '+(45+w/2)+' 41 L'+(45+w/2+5)+' 73 L'+(54+w/3)+' 115 H48 L44 83 L41 115 H'+(37-w/3)+' L'+(40-w/2)+' 73 Z" fill="'+c+'" stroke="'+line+'" stroke-width="1.5" stroke-linejoin="round"/></svg>'}
function pages(){
return [
'<h2>Seu estilo, suas escolhas.</h2><p>Como prefere se identificar? A resposta é opcional e não limita suas roupas.</p><div class="gde-gender-row">'+[["feminino","Feminino"],["masculino","Masculino"],["livre","Prefiro não informar"]].map(o=>'<button type="button" data-gender="'+o[0]+'" aria-pressed="'+(form.gender===o[0])+'">'+o[1]+'</button>').join("")+'</div><p>Escolha uma silhueta ilustrativa para personalizar o perfil (opcional).</p><div class="gde-avatars">'+[1,2,3,4,5].map(i=>'<button type="button" data-frame="'+i+'" aria-pressed="'+(form.frame===String(i))+'">'+avatar(i,form.gender==="feminino")+'<small>'+["Muito estreita","Estreita","Intermediária","Ampla","Muito ampla"][i-1]+'</small></button>').join("")+'</div><small>Silhuetas são ilustrações, não indicam peso ou saúde nem determinam que roupa usar.</small>',
'<h2>Que imagem deseja transmitir?</h2><div class="gde-wizard-fields">'+options("style",[["casual","Casual refinado"],["classico","Clássico"],["minimalista","Minimalista"],["criativo","Criativo"],["esportivo","Esportivo"],["explorar","Quero descobrir"]])+options("image",[["elegante","Elegância"],["confiavel","Confiança"],["criativo","Criatividade"],["discreto","Discrição"],["marcante","Presença marcante"]])+options("routine",[["variada","Variada"],["trabalho","Trabalho"],["casual","Casual"],["eventos","Eventos"]])+'</div>',
'<h2>Conforto e cores</h2><p>O caimento é uma preferência pessoal, não regra por biotipo.</p><div class="gde-wizard-fields">'+options("fit",[["regular","Regular"],["slim","Ajustado"],["relaxed","Solto"],["oversized","Amplo"]])+options("colors",[["neutras","Neutras"],["frias","Frias"],["quentes","Quentes"],["vivas","Vibrantes"],["mistas","Variadas"]])+'</div>',
'<h2>Sua assinatura olfativa</h2><p>Você pode pular as escolhas que ainda não conhece.</p><div class="gde-wizard-fields">'+options("family",[["","Ainda não sei"],["citrica","Cítrica"],["floral","Floral"],["amadeirada","Amadeirada"],["aromatica","Aromática"],["ambarada","Ambarada"],["gourmand","Gourmand"],["aquatica","Aquática"]])+options("sweetness",[["","Não sei"],["baixa","Baixa"],["moderada","Moderada"],["alta","Alta"]])+options("projection",[["","Não sei"],["discreta","Discreta"],["moderada","Moderada"],["marcante","Marcante"]])+'</div>'
]}
function render(){
const root=el("gdeWelcome"),list=pages();if(!root)return;
root.innerHTML='<section class="gde-welcome-card" role="dialog" aria-modal="true" aria-labelledby="gdeWelcomeTitle"><header><b id="gdeWelcomeTitle">GUIA DO ESTILO</b><span>Etapa '+(step+1)+' de '+list.length+'</span></header><div class="gde-welcome-progress"><span style="width:'+((step+1)/list.length*100)+'%"></span></div><div class="gde-welcome-content">'+list[step]+'</div><footer><button id="gdeWizardBack" type="button" '+(step===0?"disabled":"")+'>Voltar</button><button id="gdeWizardNext" type="button">'+(step===list.length-1?"Salvar meu perfil":"Continuar")+'</button></footer><p id="gdeWizardStatus" role="status"></p></section>';
root.querySelectorAll("[data-field]").forEach(c=>{c.value=form[c.dataset.field]||"";c.onchange=()=>form[c.dataset.field]=c.value});
root.querySelectorAll("[data-gender]").forEach(b=>b.onclick=()=>{form.gender=b.dataset.gender;render()});
root.querySelectorAll("[data-frame]").forEach(b=>b.onclick=()=>{form.frame=b.dataset.frame;render()});
el("gdeWizardBack").onclick=()=>{if(step>0){step--;render()}};
el("gdeWizardNext").onclick=()=>{if(step<list.length-1){step++;render()}else finish()}
}
function finish(){
const p={...read(profileKey,{}),style:form.style,image:form.image,routine:form.routine,colors:form.colors,gender:form.gender||"nao-informado",frame:form.frame||"nao-sei"};
const body={...read(bodyKey,{}),fit:form.fit||"regular"};
const oldScent=read(scentKey,{}),scent={...oldScent,family:form.family||oldScent.family||"",sweetness:form.sweetness||oldScent.sweetness||"",projection:form.projection||oldScent.projection||""};
if(!save(profileKey,p)||!save(bodyKey,body)||!save(scentKey,scent)||!save(key,{completed:true})){el("gdeWizardStatus").textContent="Não foi possível salvar neste navegador.";return}
el("gdeWelcome").hidden=true;document.body.classList.remove("gde-welcome-open");window.dispatchEvent(new Event("gde:profile-updated"));
if(!localStorage.getItem("gde:palette:v1")&&["feminino","masculino"].includes(form.gender)){const theme=form.gender==="feminino"?"feminino-escuro":"masculino-escuro";document.documentElement.setAttribute("data-theme",theme);try{localStorage.setItem("gde:palette:v1",theme)}catch(e){}}
}
function open(edit){
if(!edit&&read(key,{})?.completed)return;
const prior=read(profileKey,null);
if(!edit&&prior){save(key,{completed:true,migrated:true});return}
const scent=read(scentKey,{}),body=read(bodyKey,{});
form={...form,...(prior||{}),fit:body.fit||"regular",family:scent.family||"",sweetness:scent.sweetness||"",projection:scent.projection||""};
step=0;el("gdeWelcome").hidden=false;document.body.classList.add("gde-welcome-open");render()
}
function init(){
const root=document.createElement("div");root.id="gdeWelcome";root.hidden=true;document.body.appendChild(root);
const b=document.createElement("button");b.id="gdeEditProfile";b.type="button";b.className="drawer-item";b.textContent="Editar quiz inicial de estilo";b.onclick=()=>open(true);el("stylistOpenBtn")?.insertAdjacentElement("afterend",b);
const home=document.createElement("button");home.type="button";home.className="gde-hero-profile";home.textContent="Editar minhas preferências";home.onclick=()=>open(true);el("styleHome")?.appendChild(home);
open(false);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
window.GDEOnboarding={open};
})();