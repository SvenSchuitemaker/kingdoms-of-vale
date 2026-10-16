(()=>{'use strict';
const N=14,c=document.getElementById('game'),ctx=c.getContext('2d'),$=id=>document.getElementById(id);
let w=0,h=0,zoom=1,panX=0,panY=0,selected=null,active=null,hit=[],drag=null,seed=0,state;
const rand=(x,z,s)=>{const n=Math.sin((x+17)*127.1+(z+29)*311.7+s*74.7)*43758.5453;return n-Math.floor(n)};
const idx=(x,z)=>z*N+x,inside=(x,z)=>x>=0&&z>=0&&x<N&&z<N;
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
function init(s=Math.floor(Math.random()*999999)){
seed=s;let tiles=[];
for(let z=0;z<N;z++)for(let x=0;x<N;x++){const n=.45*rand(x>>1,z>>1,s)+.55*rand(x,z,s+3),edge=Math.min(x,z,N-1-x,N-1-z);tiles.push({x,z,t:edge===0&&n<.73||n<.17?'water':n>.83?'mountain':n>.64?'forest':n>.41?'grass':'sand',r:rand(x,z,s+89)>.79})}
for(const [cx,cz] of [[3,3],[10,10]])for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){let x=cx+dx,z=cz+dz;if(inside(x,z)&&Math.abs(dx)+Math.abs(dz)<3&&['water','mountain'].includes(tiles[idx(x,z)].t))tiles[idx(x,z)].t='grass'}
for(let x=3;x<=10;x++)tiles[idx(x,3)].t='grass';for(let z=3;z<=10;z++)tiles[idx(10,z)].t='grass';
let cities=[{x:3,z:3,owner:0,lv:1,name:'Eikenburg'},{x:10,z:10,owner:1,lv:1,name:'Schaduwfort'}];
const names=['Berkwoud','Zonnehaven','Westwacht','Kristalstad','Morgenveld'];
for(let i=0;i<7;i++){let x=1+Math.floor(rand(i,3,s)*12),z=1+Math.floor(rand(i,9,s)*12);if(walk(tiles,x,z)&&!cities.some(k=>Math.abs(k.x-x)+Math.abs(k.z-z)<4))cities.push({x,z,owner:-1,lv:1,name:names[i%names.length]})}
state={tiles,cities,units:[{id:1,x:4,z:3,owner:0,hp:10,moved:false},{id:2,x:9,z:10,owner:1,hp:10,moved:false}],stars:[7,6],turn:1,seq:3,win:null};
selected=null;active=null;panX=0;panY=0;zoom=1;message('Welkom in Kingdoms of Vale!');save();draw()}
function walk(ts,x,z){return inside(x,z)&&!['water','mountain'].includes(ts[idx(x,z)].t)}
const tile=(x,z)=>inside(x,z)?state.tiles[idx(x,z)]:null,city=(x,z)=>state.cities.find(v=>v.x===x&&v.z===z),unit=(x,z)=>state.units.find(v=>v.x===x&&v.z===z);
const income=owner=>state.cities.filter(v=>v.owner===owner).reduce((a,v)=>a+2+v.lv,0);
function message(t){$('message').textContent=t}
function save(){localStorage.setItem('kingdoms-of-vale-01',JSON.stringify({seed,state}))}
function polygon(pts,fill,stroke='#0000'){ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke!=='#0000'){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
function poly(x,y,a,b,color,stroke){polygon([[x,y],[x+a,y+b],[x,y+2*b],[x-a,y+b]],color,stroke)}
function tower(x,y,owner,lv){let top=y-15-lv*3,color=owner===0?'#30bce2':owner===1?'#e8857e':'#d9c69b';polygon([[x-11,top+6],[x,top+12],[x,top+36],[x-11,top+29]],'#a2a28b');polygon([[x,top+12],[x+11,top+6],[x+11,top+29],[x,top+36]],'#e8d8a2');poly(x,top,12,6,color);ctx.fillStyle='#544b41';ctx.fillRect(x-3,top+23,6,12);ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText(cityLabel(owner),x,top-9)}
function cityLabel(owner){return owner===0?'◆':owner===1?'◇':'•'}
function tree(x,y){polygon([[x,y-34],[x-12,y-8],[x+12,y-8]],'#1f6c37');polygon([[x,y-42],[x-10,y-22],[x+10,y-22]],'#359c4a');ctx.fillStyle='#74583d';ctx.fillRect(x-2,y-9,4,9)}
function hill(x,y){polygon([[x-22,y-8],[x,y-40],[x+22,y-8]],'#82918b');polygon([[x,y-40],[x+22,y-8],[x+2,y-8]],'#4b656f');polygon([[x-7,y-28],[x,y-40],[x+9,y-26]],'#e5f5ec')}
function soldier(x,y,u){const blue=u.owner===0;polygon([[x-7,y-10],[x,y-15],[x+7,y-10],[x+7,y-1],[x,y+4],[x-7,y-1]],blue?'#2b93d8':'#cb5c68');ctx.fillStyle='#f8dbab';ctx.beginPath();ctx.arc(x,y-19,6,0,7);ctx.fill();ctx.fillStyle=blue?'#224b7e':'#742f46';ctx.fillRect(x-7,y-27,14,5);ctx.fillStyle='#1d2431';ctx.fillRect(x+8,y-13,2,23);ctx.fillStyle='#faeea9';ctx.fillRect(x+7,y-15,4,7);ctx.fillStyle='#26333c';ctx.fillRect(x-6,y+4,4,4);ctx.fillRect(x+3,y+4,4,4);ctx.fillStyle='#0009';ctx.fillRect(x-12,y+12,24,4);ctx.fillStyle=blue?'#65d4ff':'#ff9a99';ctx.fillRect(x-12,y+12,Math.max(0,u.hp/10)*24,4)}
function coord(x,z){const unit=27*zoom;return [w/2+panX+(x-z)*unit,h*.30+panY+(x+z)*unit*.52]}
function draw(){if(!ctx)return;ctx.clearRect(0,0,w,h);const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#304961');bg.addColorStop(1,'#90bbaf');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);hit=[];
for(let layer=0;layer<N*2;layer++)for(let z=0;z<N;z++){let x=layer-z;if(!inside(x,z))continue;const t=tile(x,z),[px,py]=coord(x,z),a=27*zoom,b=a*.52,highlight=selected&&selected.x===x&&selected.z===z;
let colors={water:'#4da9bf',grass:'#83c868',forest:'#61ad5b',mountain:'#a1a69a',sand:'#eac879'},side={water:'#267b94',grass:'#528f4c',forest:'#438446',mountain:'#666f70',sand:'#cb9e53'};
const p=[[px,py],[px+a,py+b],[px,py+2*b],[px-a,py+b]];hit.push({x,z,points:p,depth:layer});
polygon([[px-a,py+b],[px,py+2*b],[px,py+2*b+8*zoom],[px-a,py+b+8*zoom]],side[t.t]);polygon([[px,py+2*b],[px+a,py+b],[px+a,py+b+8*zoom],[px,py+2*b+8*zoom]],side[t.t]);polygon(p,highlight?'#f7e5a0':colors[t.t],'#19393025');
const cy=py+b;if(t.t==='forest')tree(px,cy);if(t.t==='mountain')hill(px,cy+5);if(t.t==='sand'&&t.r){ctx.fillStyle='#91a847';ctx.fillRect(px,cy-10,3,12)}if(t.t==='grass'&&t.r){ctx.fillStyle='#ead488';ctx.beginPath();ctx.arc(px,cy-6,4,0,7);ctx.fill()}
const ct=city(x,z);if(ct)tower(px,cy-7,ct.owner,ct.lv);
const u=unit(x,z);if(u)soldier(px+9,cy+3,u);
if(active&&dist(active,{x,z})===1&&walk(state.tiles,x,z)&&(!unit(x,z)||unit(x,z).owner!==0)){ctx.strokeStyle='#ffea85';ctx.lineWidth=2;ctx.beginPath();p.forEach(([vx,vy],i)=>i?ctx.lineTo(vx,vy):ctx.moveTo(vx,vy));ctx.closePath();ctx.stroke()}
}
$('stars').textContent=state.stars[0];$('turn').textContent=state.turn;$('cities').textContent=state.cities.filter(v=>v.owner===0).length;$('units').textContent=state.units.filter(v=>v.owner===0).length;const ct=selected&&city(selected.x,selected.z),u=selected&&unit(selected.x,selected.z),t=selected&&tile(selected.x,selected.z);
$('selection').textContent=ct?ct.name+' · niveau '+ct.lv:u?(u.owner===0?'Jouw krijger':'Vijandelijke krijger'):'Selecteer een tegel';
$('details').textContent=u?'❤️ '+u.hp+'/10 · '+(u.moved?'Al verplaatst':'Klaar voor actie'):ct?ct.owner===0?'Jouw stad · +'+(ct.lv+2)+' sterren per beurt':ct.owner===1?'Vijandelijke stad':'Neutraal dorp':t?'Terrein: '+t.t:'Tik op een tegel om te starten';
$('recruit').disabled=!ct||ct.owner!==0||state.stars[0]<3||state.win!==null;$('upgrade').disabled=!ct||ct.owner!==0||ct.lv>=4||state.stars[0]<4+ct.lv*2||state.win!==null;$('upgrade').textContent='🏛️ Upgrade ('+(ct?4+ct.lv*2:6)+'⭐)';
}
function pointIn(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes}
function pick(px,py){for(let i=hit.length-1;i>=0;i--)if(pointIn([px,py],hit[i].points))return hit[i];return null}
function tap(x,z){if(state.win!==null)return;const u=unit(x,z);if(active&&dist(active,{x,z})===1&&walk(state.tiles,x,z)){const opponent=unit(x,z);if(opponent&&opponent.owner===1){opponent.hp-=5;active.moved=true;message('Aanval! 5 schade.');if(opponent.hp<=0)state.units=state.units.filter(v=>v!==opponent);active=null;save();draw();return}
if(!opponent&&!active.moved){active.x=x;active.z=z;active.moved=true;let ct=city(x,z);if(ct&&ct.owner!==0){ct.owner=0;message(ct.name+' veroverd!')}else message('Krijger verplaatst.');active=null;checkWin();save();draw();return}}
selected={x,z};active=u&&u.owner===0&&!u.moved?u:null;draw()}
function checkWin(){if(!state.cities.some(v=>v.owner===1)){state.win=0;message('🏆 Overwinning! Alle vijandelijke steden veroverd.')}}
function enemyTurn(){for(const enemy of [...state.units].filter(v=>v.owner===1)){const target=state.cities.filter(v=>v.owner===0).sort((a,b)=>dist(enemy,a)-dist(enemy,b))[0];if(!target)continue;const victim=state.units.find(v=>v.owner===0&&dist(enemy,v)===1);if(victim){victim.hp-=4;continue}const dirs=[[1,0],[0,1],[-1,0],[0,-1]].sort((a,b)=>Math.abs(enemy.x+a[0]-target.x)+Math.abs(enemy.z+a[1]-target.z)-Math.abs(enemy.x+b[0]-target.x)-Math.abs(enemy.z+b[1]-target.z));let d=dirs.find(([dx,dz])=>walk(state.tiles,enemy.x+dx,enemy.z+dz)&&!unit(enemy.x+dx,enemy.z+dz));if(d){enemy.x+=d[0];enemy.z+=d[1];let ct=city(enemy.x,enemy.z);if(ct&&ct.owner===0)ct.owner=1}}
state.units=state.units.filter(u=>u.hp>0);
if(state.stars[1]>=3&&state.units.filter(u=>u.owner===1).length<5){let ct=state.cities.find(v=>v.owner===1),spots=[[0,0],[1,0],[-1,0],[0,1],[0,-1]];let p=ct&&spots.find(([dx,dz])=>walk(state.tiles,ct.x+dx,ct.z+dz)&&!unit(ct.x+dx,ct.z+dz));if(ct&&p){state.units.push({id:state.seq++,x:ct.x+p[0],z:ct.z+p[1],owner:1,hp:10,moved:true});state.stars[1]-=3}}
if(!state.cities.some(v=>v.owner===0)){state.win=1;message('Je rijk is gevallen. Probeer opnieuw.')}} 
$('end').onclick=()=>{if(state.win!==null)return;const gained=income(0);state.stars[0]+=gained;state.stars[1]+=income(1);state.turn++;state.units.forEach(u=>u.moved=false);enemyTurn();selected=null;active=null;if(state.win===null)message('Beurt '+state.turn+' · +'+gained+' sterren');save();draw()};
$('recruit').onclick=()=>{const ct=selected&&city(selected.x,selected.z);if(!ct||ct.owner!==0||state.stars[0]<3)return;const spots=[[0,0],[1,0],[-1,0],[0,1],[0,-1]],p=spots.find(([dx,dz])=>walk(state.tiles,ct.x+dx,ct.z+dz)&&!unit(ct.x+dx,ct.z+dz));if(!p){message('Geen plek voor een krijger.');return}state.units.push({id:state.seq++,x:ct.x+p[0],z:ct.z+p[1],owner:0,hp:10,moved:true});state.stars[0]-=3;message('Nieuwe krijger gerekruteerd');save();draw()};
$('upgrade').onclick=()=>{const ct=selected&&city(selected.x,selected.z);if(!ct||ct.owner!==0||ct.lv>=4||state.stars[0]<4+ct.lv*2)return;state.stars[0]-=4+ct.lv*2;ct.lv++;message(ct.name+' geüpgraded!');save();draw()};
$('reset').onclick=()=>{if(confirm('Een nieuw spel starten?'))init()};
function resize(){const d=Math.min(devicePixelRatio||1,2);w=c.clientWidth;h=c.clientHeight;c.width=w*d;c.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw()}addEventListener('resize',resize);
c.addEventListener('pointerdown',e=>{c.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,px:panX,py:panY,moved:false}});
c.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>7)drag.moved=true;if(drag.moved){panX=drag.px+dx;panY=drag.py+dy;draw()}});
c.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const t=pick(e.clientX,e.clientY);if(t)tap(t.x,t.z)}drag=null});
c.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.55,Math.min(2.1,zoom*(e.deltaY>0?.91:1.1)));draw()},{passive:false});
let oldDist=0;c.addEventListener('touchmove',e=>{if(e.touches.length===2){let a=e.touches[0],b=e.touches[1],d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);if(oldDist)zoom=Math.max(.55,Math.min(2.1,zoom*d/oldDist));oldDist=d;drag=null;draw()}},{passive:true});c.addEventListener('touchend',()=>oldDist=0);
try{const prior=JSON.parse(localStorage.getItem('kingdoms-of-vale-01'));if(prior&&prior.state&&prior.state.tiles.length===N*N){state=prior.state;seed=prior.seed;selected=null;active=null;message('Opgeslagen spel geladen.')}else init()}catch{init()}resize();
})();