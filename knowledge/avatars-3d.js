(function(){
"use strict";
function render(n,gender){
 const i=Math.max(1,Math.min(5,Number(n)||3)),v=(i-1)/4,f=gender==="feminino",id="avatar"+i+(f?"r":"s");
 const shoulder=(f?19:24)+v*(f?5:8),waist=(f?12:16)+v*(f?16:17),hip=(f?20:18)+v*(f?20:17);
 const edge=f?"#B97999":"#7C94B5",base=f?"#F2C9D9":"#CAD9EB";
 return '<svg class="gde-avatar-render" viewBox="0 0 120 235" aria-hidden="true"><defs>'+
 '<linearGradient id="'+id+'Body" x1="0" y1="0" x2="1" y2="0"><stop stop-color="'+edge+'"/><stop offset=".22" stop-color="'+base+'"/><stop offset=".5" stop-color="#FAFDFF"/><stop offset=".8" stop-color="'+base+'"/><stop offset="1" stop-color="'+edge+'"/></linearGradient>'+
 '<radialGradient id="'+id+'Head"><stop stop-color="#FCFEFF"/><stop offset=".65" stop-color="'+base+'"/><stop offset="1" stop-color="'+edge+'"/></radialGradient></defs>'+
 '<ellipse cx="60" cy="228" rx="'+(22+hip/3)+'" ry="4" fill="'+edge+'" opacity=".25"/>'+
 '<path d="M '+(60-hip+5)+' 117 Q '+(60-hip-2)+' 145 '+(60-hip+3)+' 174 L '+(60-hip+10)+' 222 L '+(60-hip+19)+' 226 L 56 226 L 59 148 L 61 148 L 64 226 L '+(60+hip-19)+' 226 L '+(60+hip-10)+' 222 L '+(60+hip-3)+' 174 Q '+(60+hip+2)+' 145 '+(60+hip-5)+' 117 Z" fill="url(#'+id+'Body)" stroke="'+edge+'" stroke-width=".8"/>'+
 '<path d="M '+(60-shoulder)+' 56 Q '+(60-shoulder-9)+' 56 '+(60-shoulder-13)+' 77 L '+(60-shoulder-16)+' 142 Q '+(60-shoulder-12)+' 151 '+(60-shoulder-6)+' 144 L '+(60-shoulder-1)+' 101 L '+(60-waist)+' 119 Q 60 130 '+(60+waist)+' 119 L '+(60+shoulder+1)+' 101 L '+(60+shoulder+6)+' 144 Q '+(60+shoulder+12)+' 151 '+(60+shoulder+16)+' 142 L '+(60+shoulder+13)+' 77 Q '+(60+shoulder+9)+' 56 '+(60+shoulder)+' 56 L 68 50 L 52 50 Z" fill="url(#'+id+'Body)" stroke="'+edge+'" stroke-width=".8"/>'+
 '<path d="M '+(60-hip+5)+' 130 Q 60 137 '+(60+hip-5)+' 130 L '+(60+hip-5)+' 153 L 61 157 L 59 157 L '+(60-hip+5)+' 153 Z" fill="'+(f?"#CE9CAF":"#334760")+'" opacity=".8"/>'+
 '<rect x="54" y="42" width="12" height="17" rx="4" fill="url(#'+id+'Body)"/>'+
 '<ellipse cx="60" cy="24" rx="'+(f?13:14)+'" ry="19" fill="url(#'+id+'Head)" stroke="'+edge+'" stroke-width=".8"/>'+
 (f?'<path d="M 48 15 Q 41 1 58 2 Q 77 0 73 20" fill="none" stroke="'+edge+'" stroke-width="4" opacity=".85"/>':'')+
 '</svg>';
}
function mountNav(){const nav=document.querySelector(".gde-refined-nav");if(nav&&nav.parentElement!==document.body){document.body.appendChild(nav);nav.style.setProperty("height","auto","important")}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mountNav);else mountNav();
window.GDEAvatar3D={render};
})();