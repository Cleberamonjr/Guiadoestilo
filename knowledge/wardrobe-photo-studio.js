(function(){
"use strict";
const el=id=>document.getElementById(id);let prepared=null,sourceFile=null,sourceImage=null;
function make(){const file=el("stItemPhoto")?.files?.[0];if(!file)return;
const wrapper=el("gdePhotoStudio");wrapper.hidden=false;sourceFile=file;prepared=null;
el("gdePhotoStatus").textContent="Prévia local. Original preservado; confirme a foto preparada para usar na vitrine.";
load(file).catch(e=>{el("gdePhotoStatus").textContent="Não foi possível visualizar: "+e.message;wrapper.hidden=true});
}
async function load(file){if(sourceImage?.close)sourceImage.close();sourceImage=await createImageBitmap(file);render()}
function removeBackground(canvas,tolerance){
const cx=canvas.getContext("2d",{willReadFrequently:true}),w=canvas.width,h=canvas.height,im=cx.getImageData(0,0,w,h),px=im.data,seen=new Uint8Array(w*h),queue=new Int32Array(w*h),idx=(x,y)=>y*w+x;
const corners=[0,w-1,(h-1)*w,h*w-1],bg=[0,1,2].map(k=>Math.round(corners.reduce((a,pos)=>a+px[pos*4+k],0)/4));
let first=0,last=0;
for(let x=0;x<w;x++){const top=x,bot=(h-1)*w+x;if(!seen[top]){seen[top]=1;queue[last++]=top}if(!seen[bot]){seen[bot]=1;queue[last++]=bot}}
for(let y=1;y<h-1;y++){const left=y*w,right=y*w+w-1;if(!seen[left]){seen[left]=1;queue[last++]=left}if(!seen[right]){seen[right]=1;queue[last++]=right}}
const close=(p)=>Math.abs(px[p*4]-bg[0])+Math.abs(px[p*4+1]-bg[1])+Math.abs(px[p*4+2]-bg[2])<tolerance*3;
while(first<last){const p=queue[first++],x=p%w,y=Math.floor(p/w);if(!close(p))continue;px[p*4]=255;px[p*4+1]=255;px[p*4+2]=255;px[p*4+3]=255;
const neighbors=[x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1];
for(let i=0;i<4;i++){const n=neighbors[i];if(n>=0&&!seen[n]&&close(n)){seen[n]=1;queue[last++]=n}}
}
cx.putImageData(im,0,0);
}
function render(){
const canvas=el("gdePhotoCanvas");if(!canvas||!sourceImage)return;
const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);ctx.fillStyle="#ffffff";ctx.fillRect(0,0,W,H);
const deg=Number(el("gdePhotoRotate").value),zoom=Number(el("gdePhotoZoom").value)/100;
ctx.save();ctx.translate(W/2,H/2);ctx.rotate(deg*Math.PI/180);
const avail=W*.82*zoom,ratio=Math.min(avail/sourceImage.width,avail/sourceImage.height),dw=sourceImage.width*ratio,dh=sourceImage.height*ratio;
ctx.drawImage(sourceImage,-dw/2,-dh/2,dw,dh);ctx.restore();
if(el("gdePhotoRemove")?.checked)removeBackground(canvas,Number(el("gdePhotoTolerance").value));
el("gdePhotoDegrees").textContent=deg+"°";
}
function init(){
const input=el("stItemPhoto");if(!input)return;
const panel=document.createElement("section");panel.id="gdePhotoStudio";panel.hidden=true;panel.className="gde-photo-studio";
panel.innerHTML='<h4>Estúdio da peça</h4><p>Endireite e centralize a fotografia. A opção de fundo branco funciona melhor com fundo liso e contrastante; confira se não apagou detalhes da roupa.</p><canvas id="gdePhotoCanvas" width="520" height="520" aria-label="Prévia da peça em enquadramento quadrado"></canvas><label>Alinhar peça: <output id="gdePhotoDegrees">0°</output><input type="range" id="gdePhotoRotate" min="-45" max="45" value="0" step="1"></label><label>Enquadramento<input type="range" id="gdePhotoZoom" min="65" max="115" value="100"></label><label class="gde-photo-check"><input type="checkbox" id="gdePhotoRemove"> Remover fundo uniforme e substituir por branco (experimental)</label><label id="gdeToleranceWrap" hidden>Sensibilidade do fundo<input type="range" id="gdePhotoTolerance" min="10" max="90" value="30"></label><div class="gde-photo-controls"><button id="gdePhotoApply" type="button">Usar foto preparada</button><button id="gdePhotoOriginal" type="button">Manter original</button></div><p id="gdePhotoStatus" role="status"></p>';
input.insertAdjacentElement("afterend",panel);
input.addEventListener("change",make);
["gdePhotoRotate","gdePhotoZoom","gdePhotoTolerance"].forEach(id=>el(id).addEventListener("input",()=>{prepared=null;render()}));
el("gdePhotoRemove").addEventListener("change",()=>{el("gdeToleranceWrap").hidden=!el("gdePhotoRemove").checked;prepared=null;render()});
el("gdePhotoApply").onclick=()=>{if(!sourceImage)return;render();prepared=el("gdePhotoCanvas").toDataURL("image/jpeg",.74);el("gdePhotoStatus").textContent="Foto de apresentação preparada. A foto original também será preservada."};
el("gdePhotoOriginal").onclick=()=>{prepared=null;el("gdePhotoRemove").checked=false;el("gdePhotoRotate").value=0;el("gdePhotoZoom").value=100;render();el("gdePhotoStatus").textContent="Será usada apenas a imagem original."};
window.addEventListener("gde:wardrobe-saved",()=>{prepared=null;sourceFile=null;el("gdePhotoStudio").hidden=true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
window.GDEPhotoStudio={getPrepared(file){return file===sourceFile?prepared:null},render};
})();