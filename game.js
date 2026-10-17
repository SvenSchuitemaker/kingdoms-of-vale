(()=>{'use strict';
let N=16;const c=document.getElementById('game'),ctx=c.getContext('2d'),$=id=>document.getElementById(id);
let w=0,h=0,zoom=1,panX=0,panY=0,selected=null,active=null,hit=[],drag=null,seed=0,state=null,combat=null,combatBusy=false,currentSlot=-1;
const TYPES={warrior:{name:'Warrior',cost:3,hp:10,damage:5,move:2,range:1},knight:{name:'Knight',cost:7,hp:14,damage:6,move:3,range:1},golem:{name:'Golem',cost:10,hp:22,damage:8,move:1,range:1},archer:{name:'Archer',cost:5,hp:7,damage:4,move:2,range:3},mage:{name:'Mage',cost:7,hp:8,damage:7,move:2,range:2},ghost:{name:'Ghost',cost:8,hp:9,damage:6,move:3,range:1},catapult:{name:'Catapult',cost:11,hp:8,damage:8,move:1,range:4},giant:{name:'Giant',cost:13,hp:28,damage:9,move:1,range:1}};
const typeOf=u=>TYPES[u.type]||TYPES.warrior;
const tech=window.GameTech;
const damage=u=>tech.damage(state,u,typeOf(u).damage);
const maxHp=u=>tech.maxHp(state,u,typeOf(u).hp);
const recruitCost=kind=>tech.unitCost(state,kind,TYPES[kind].cost);
const ICONS={warrior:'⚔️',knight:'🐴',golem:'🪨',archer:'🏹',mage:'🔮',ghost:'👻',catapult:'💥',giant:'🗿'};
const sprites=window.KovSprites;
const ownerTribe=owner=>owner===0?sprites.tribe(state.settings?.tribe):sprites.tribe(state.settings?.aiTribes?.[owner-1]);
const canRecruit=kind=>tech.unlocked(state,kind);
const cityCost=ct=>tech.cityCost(state,ct);
const rand=(x,z,s)=>{const n=Math.sin((x+17)*127.1+(z+29)*311.7+s*74.7)*43758.5453;return n-Math.floor(n)};
const idx=(x,z)=>z*N+x,inside=(x,z)=>x>=0&&z>=0&&x<N&&z<N;
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
function init(settings={},s=Math.floor(Math.random()*999999)){
N=settings.mapSize||16;
seed=s;let tiles=[];
for(let z=0;z<N;z++)for(let x=0;x<N;x++){const n=.45*rand(x>>1,z>>1,s)+.55*rand(x,z,s+3),edge=Math.min(x,z,N-1-x,N-1-z);tiles.push({x,z,t:edge===0&&n<.73||n<.17?'water':n>.83?'mountain':n>.64?'forest':n>.41?'grass':'sand',r:rand(x,z,s+89)>.79})}
const starts=[[3,3],[N-4,N-4],[N-4,3],[3,N-4],[Math.floor(N/2),2]];
for(const [cx,cz] of starts.slice(0,1+(settings.aiCount||1)))for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){let x=cx+dx,z=cz+dz;if(inside(x,z)&&Math.abs(dx)+Math.abs(dz)<3&&['water','mountain'].includes(tiles[idx(x,z)].t))tiles[idx(x,z)].t='grass'}
for(let x=3;x<N-3;x++)tiles[idx(x,3)].t='grass';for(let z=3;z<N-3;z++)tiles[idx(N-4,z)].t='grass';
let cities=starts.slice(0,1+(settings.aiCount||1)).map(([x,z],owner)=>({x,z,owner,lv:1,name:owner===0?'Hoofdstad':'Rivalenstad '+owner}));
const names=['Berkwoud','Zonnehaven','Westwacht','Kristalstad','Morgenveld'];
for(let i=0;i<7;i++){let x=1+Math.floor(rand(i,3,s)*(N-2)),z=1+Math.floor(rand(i,9,s)*(N-2));if(walk(tiles,x,z)&&!cities.some(k=>Math.abs(k.x-x)+Math.abs(k.z-z)<4))cities.push({x,z,owner:-1,lv:1,name:names[i%names.length]})}
state={tiles,cities,units:starts.slice(0,1+(settings.aiCount||1)).map(([x,z],owner)=>({id:owner+1,x:owner===0?x+1:x-1,z,owner,hp:10,moved:false,type:'warrior'})),stars:Array(1+(settings.aiCount||1)).fill(7),turn:1,seq:2+(settings.aiCount||1),win:null,tech:settings.tribe?{[settings.tribe]:1}:{},settings:{...settings,aiTribes:Array.from({length:settings.aiCount||1},(_,i)=>{const options=sprites.tribes.filter(t=>t!==sprites.tribe(settings.tribe));return options[i%options.length]})},score:Array(1+(settings.aiCount||1)).fill(0)};
sprites.load([sprites.tribe(state.settings.tribe),...state.settings.aiTribes]);selected=null;active=null;panX=0;panY=0;zoom=1;message('Welkom in Kingdoms of Vale!');save();draw()}
function walk(ts,x,z){return inside(x,z)&&!['water','mountain'].includes(ts[idx(x,z)].t)}
const tile=(x,z)=>inside(x,z)?state.tiles[idx(x,z)]:null,city=(x,z)=>state.cities.find(v=>v.x===x&&v.z===z),unit=(x,z)=>state.units.find(v=>v.x===x&&v.z===z);
// Breadth-first search: only reachable tiles are shown. Units cannot cross blockers.
// Unit movement allowances are defined in TYPES.
function reachable(u){
 const visited=new Set([idx(u.x,u.z)]),queue=[{x:u.x,z:u.z,steps:0}],result=new Set();
 for(let i=0;i<queue.length;i++){
  const p=queue[i];if(p.steps>=typeOf(u).move)continue;
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const x=p.x+dx,z=p.z+dz,k=idx(x,z);
   if(!walk(state.tiles,x,z)||visited.has(k)||unit(x,z))continue;
   visited.add(k);result.add(k);queue.push({x,z,steps:p.steps+1});
  }
 }
 return result;
}
function attackTargets(u){return state.units.filter(v=>v.owner!==u.owner&&dist(u,v)<=typeOf(u).range)}
function resolveCombat(attacker,defender){
 combatBusy=true;
 const hitDamage=damage(attacker),retaliation=defender.hp>hitDamage&&dist(attacker,defender)<=typeOf(defender).range?Math.max(1,damage(defender)-2):0;
 combat={from:{x:attacker.x,z:attacker.z},to:{x:defender.x,z:defender.z},started:performance.now(),damage:hitDamage,retaliation};
 attacker.moved=true;attacker.attacked=true;
 // Resolve damage at the end of the short attack animation.
 setTimeout(()=>{
  defender.hp=Math.max(0,defender.hp-hitDamage);
  if(defender.hp===0)state.units=state.units.filter(v=>v!==defender);
  if(retaliation)attacker.hp=Math.max(0,attacker.hp-retaliation);
  if(attacker.hp===0)state.units=state.units.filter(v=>v!==attacker);
  const defeated=defender.hp===0;
  combat=null;combatBusy=false;active=null;
  selected=state.units.includes(attacker)?{x:attacker.x,z:attacker.z}:null;
  message(defeated?'⚔️ Vijand verslagen!':('⚔️ '+hitDamage+' schade! Tegenaanval: '+retaliation+' schade.'));
  checkWin();save();draw();
 },380);
 requestAnimationFrame(animateCombat);
}
function animateCombat(){if(!combat)return;draw();requestAnimationFrame(animateCombat)}
const income=owner=>state.cities.filter(v=>v.owner===owner).reduce((a,v)=>a+2+v.lv,0)+(owner===0?tech.income(state):0);
function message(t){$('message').textContent=t}
function save(){if(currentSlot<0||!state)return;localStorage.setItem('kov-save-'+currentSlot,JSON.stringify({seed,state,N,updated:Date.now()}));renderSlots()}
function polygon(pts,fill,stroke='#0000'){ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke!=='#0000'){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
function poly(x,y,a,b,color,stroke){polygon([[x,y],[x+a,y+b],[x,y+2*b],[x-a,y+b]],color,stroke)}
function tower(x,y,owner,lv){let top=y-15-lv*3,color=owner===0?'#30bce2':owner===1?'#e8857e':'#d9c69b';polygon([[x-11,top+6],[x,top+12],[x,top+36],[x-11,top+29]],'#a2a28b');polygon([[x,top+12],[x+11,top+6],[x+11,top+29],[x,top+36]],'#e8d8a2');poly(x,top,12,6,color);ctx.fillStyle='#544b41';ctx.fillRect(x-3,top+23,6,12);ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText(cityLabel(owner),x,top-9)}
function cityLabel(owner){return owner===0?'◆':owner===1?'◇':'•'}
function tree(x,y){polygon([[x,y-34],[x-12,y-8],[x+12,y-8]],'#1f6c37');polygon([[x,y-42],[x-10,y-22],[x+10,y-22]],'#359c4a');ctx.fillStyle='#74583d';ctx.fillRect(x-2,y-9,4,9)}
function hill(x,y){polygon([[x-22,y-8],[x,y-40],[x+22,y-8]],'#82918b');polygon([[x,y-40],[x+22,y-8],[x+2,y-8]],'#4b656f');polygon([[x-7,y-28],[x,y-40],[x+9,y-26]],'#e5f5ec')}
function soldier(x,y,u){const tribe=ownerTribe(u.owner);const big=u.type==='giant'||u.type==='golem';const width=big?47:38,height=big?58:48;const floor=y+9;ctx.fillStyle=u.owner===0?'#44d2e499':'#ffac6899';ctx.beginPath();ctx.ellipse(x,floor,14,5,0,0,Math.PI*2);ctx.fill();sprites.draw(ctx,tribe,u.type,x,floor,width,height);ctx.fillStyle='#101a2299';ctx.fillRect(x-14,y+15,28,5);ctx.fillStyle=u.owner===0?'#65d4ff':'#ff9a99';ctx.fillRect(x-14,y+15,Math.max(0,u.hp/maxHp(u))*28,5)}
function coord(x,z){const unit=42*zoom;return [w/2+panX+(x-z)*unit,h*.30+panY+(x+z)*unit*.52]}
function draw(){if(!ctx||!state)return;ctx.clearRect(0,0,w,h);const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#304961');bg.addColorStop(1,'#90bbaf');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);hit=[];const moves=active&&!active.moved?reachable(active):new Set();const targets=active&&!active.moved?new Set(attackTargets(active).map(v=>idx(v.x,v.z))):new Set();const heals=active&&!active.moved&&active.type==='healer'?new Set(state.units.filter(v=>v.owner===0&&v!==active&&dist(active,v)===1&&v.hp<maxHp(v)).map(v=>idx(v.x,v.z))):new Set();
for(let layer=0;layer<N*2;layer++)for(let z=0;z<N;z++){let x=layer-z;if(!inside(x,z))continue;const t=tile(x,z),[px,py]=coord(x,z),a=42*zoom,b=a*.52,highlight=selected&&selected.x===x&&selected.z===z;
let colors={water:'#4da9bf',grass:'#83c868',forest:'#61ad5b',mountain:'#a1a69a',sand:'#eac879'},side={water:'#267b94',grass:'#528f4c',forest:'#438446',mountain:'#666f70',sand:'#cb9e53'};
const p=[[px,py],[px+a,py+b],[px,py+2*b],[px-a,py+b]];hit.push({x,z,points:p,depth:layer});
polygon([[px-a,py+b],[px,py+2*b],[px,py+2*b+8*zoom],[px-a,py+b+8*zoom]],side[t.t]);polygon([[px,py+2*b],[px+a,py+b],[px+a,py+b+8*zoom],[px,py+2*b+8*zoom]],side[t.t]);polygon(p,highlight?'#f7e5a0':targets.has(idx(x,z))?'#f08a82':heals.has(idx(x,z))?'#a6ecad':moves.has(idx(x,z))?'#7cead4':colors[t.t],'#19393025');
const cy=py+b;ctx.save();ctx.translate(px,cy);ctx.scale(1.45*zoom,1.45*zoom);
if(t.t==='forest')tree(0,0);if(t.t==='mountain')hill(0,5);
if(t.t==='sand'&&t.r){ctx.fillStyle='#91a847';ctx.fillRect(0,-10,3,12)}
if(t.t==='grass'&&t.r){ctx.fillStyle='#ead488';ctx.beginPath();ctx.arc(0,-6,4,0,7);ctx.fill()}
ctx.restore();
const ct=city(x,z),u=unit(x,z);
if(ct||u){ctx.save();ctx.translate(px,cy);ctx.scale(1.45*zoom,1.45*zoom);
if(ct)tower(0,-7,ct.owner,ct.lv);
if(u)soldier(9,3,u);
ctx.restore()}
if(moves.has(idx(x,z))||targets.has(idx(x,z))||heals.has(idx(x,z))){ctx.strokeStyle=targets.has(idx(x,z))?'#ff4444':heals.has(idx(x,z))?'#36ef75':'#fff7bf';ctx.lineWidth=2;ctx.beginPath();p.forEach(([vx,vy],i)=>i?ctx.lineTo(vx,vy):ctx.moveTo(vx,vy));ctx.closePath();ctx.stroke()}
if(combat&&((combat.from.x===x&&combat.from.z===z)||(combat.to.x===x&&combat.to.z===z))){
 const progress=Math.min(1,(performance.now()-combat.started)/380),pulse=Math.sin(progress*Math.PI);
 ctx.strokeStyle='#ffe574';ctx.lineWidth=4*pulse;ctx.beginPath();ctx.arc(px,cy-16,8+18*pulse,0,Math.PI*2);ctx.stroke();
}
}
$('stars').textContent=state.stars[0];$('turn').textContent=state.turn;$('cities').textContent=state.cities.filter(v=>v.owner===0).length;$('units').textContent=state.units.filter(v=>v.owner===0).length;const ct=selected&&city(selected.x,selected.z),u=selected&&unit(selected.x,selected.z),t=selected&&tile(selected.x,selected.z);
$('selection').textContent=ct?ct.name+' · niveau '+ct.lv:u?(u.owner===0?'Jouw ':'Vijandelijke ')+typeOf(u).name:'Selecteer een tegel';
$('details').textContent=u?'❤️ '+u.hp+'/'+maxHp(u)+' · ⚔️ '+damage(u)+' · 👟 '+typeOf(u).move+' · 🏹 '+typeOf(u).range+' · '+(u.moved?'Al verplaatst':'Klaar voor actie'):ct?ct.owner===0?'Jouw stad · +'+(ct.lv+2)+' sterren per beurt':ct.owner===1?'Vijandelijke stad':'Neutraal dorp':t?'Terrein: '+t.t:'Tik op een tegel om te starten';
$('recruit').disabled=!ct||ct.owner!==0||!canRecruit($('unitType').value)||state.stars[0]<recruitCost($('unitType').value)||state.win!==null;
for(const opt of $('unitType').options){const open=canRecruit(opt.value);opt.disabled=!open;opt.textContent=(open?'':'🔒 ')+ICONS[opt.value]+' '+TYPES[opt.value].name+' · '+recruitCost(opt.value)+'⭐';}$('upgrade').disabled=!ct||ct.owner!==0||ct.lv>=4||state.stars[0]<cityCost(ct)||state.win!==null;$('upgrade').textContent='🏛️ Upgrade ('+(ct?cityCost(ct):6)+'⭐)';
}
function pointIn(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes}
function pick(px,py){for(const u of [...state.units].reverse()){const [ux,uy]=coord(u.x,u.z),sc=1.45*zoom,by=uy+21*zoom;if(Math.abs(px-(ux+9*sc))<15*sc&&py>=by-31*sc&&py<=by+17*sc)return {x:u.x,z:u.z}}for(let i=hit.length-1;i>=0;i--)if(pointIn([px,py],hit[i].points))return hit[i];return null}
function tap(x,z){
 if(state.win!==null||combatBusy)return;
 const u=unit(x,z);
 if(active&&!active.moved&&active.type==='healer'&&u&&u.owner===0&&u!==active&&dist(active,u)===1&&u.hp<maxHp(u)){
  u.hp=Math.min(maxHp(u),u.hp+5);active.moved=true;message('💚 Healer herstelt 5 HP');active=null;selected={x,z};save();draw();return;
 }
 if(active&&!active.moved){
  const opponent=u&&u.owner!==0&&dist(active,{x,z})<=typeOf(active).range?u:null;
  if(opponent){resolveCombat(active,opponent);return;}
  if(reachable(active).has(idx(x,z))){
   active.x=x;active.z=z;active.moved=true;
   const ct=city(x,z);
   if(ct&&ct.owner!==0){ct.owner=0;message(ct.name+' veroverd!')}
   else message('Krijger verplaatst.');
   selected={x,z};active=null;checkWin();save();draw();return;
  }
 }
 selected={x,z};active=u&&u.owner===0&&!u.moved?u:null;
 if(active)message('Groen = lopen · Rood = aanvallen. Tik op een vijand om te vechten.');
 draw();
}
function checkWin(){if(state.settings?.victory==='legacy'){if(state.score[0]>=state.settings.goal){state.win=0;message('🏆 Legacy gewonnen! De doelscore is bereikt.')}else if(state.score.slice(1).some(v=>v>=state.settings.goal)){state.win=1;message('De rivalen hebben de Legacy-doelscore bereikt.')}return}if(!state.cities.some(v=>v.owner>0)){state.win=0;message('🏆 Conquest gewonnen! Alle rivalen verslagen.')}}
function enemyTurn(){
 for(let owner=1;owner<state.stars.length;owner++){
  state.stars[owner]+=income(owner);
  for(const enemy of [...state.units].filter(v=>v.owner===owner)){
   const enemies=state.cities.filter(v=>v.owner!==owner&&v.owner>=0);
   const target=enemies.sort((a,b)=>dist(enemy,a)-dist(enemy,b))[0];if(!target)continue;
   const victim=state.units.find(v=>v.owner!==owner&&dist(enemy,v)<=typeOf(enemy).range);
   if(victim){victim.hp-=damage(enemy);continue}
   const dirs=[[1,0],[0,1],[-1,0],[0,-1]].sort((a,b)=>Math.abs(enemy.x+a[0]-target.x)+Math.abs(enemy.z+a[1]-target.z)-Math.abs(enemy.x+b[0]-target.x)-Math.abs(enemy.z+b[1]-target.z));
   const step=dirs.find(([dx,dz])=>walk(state.tiles,enemy.x+dx,enemy.z+dz)&&!unit(enemy.x+dx,enemy.z+dz));
   if(step){enemy.x+=step[0];enemy.z+=step[1];const ct=city(enemy.x,enemy.z);if(ct&&ct.owner!==owner)ct.owner=owner}
  }
  state.units=state.units.filter(u=>u.hp>0);
  const ct=state.cities.find(v=>v.owner===owner);
  if(ct&&state.stars[owner]>=3&&state.units.filter(u=>u.owner===owner).length<5){
   const spots=[[0,0],[1,0],[-1,0],[0,1],[0,-1]];
   const spot=spots.find(([dx,dz])=>walk(state.tiles,ct.x+dx,ct.z+dz)&&!unit(ct.x+dx,ct.z+dz));
   if(spot){const kind=state.stars[owner]>=7&&state.turn>5?'knight':state.stars[owner]>=5&&state.turn>2?'archer':'warrior';state.units.push({id:state.seq++,x:ct.x+spot[0],z:ct.z+spot[1],owner,type:kind,hp:TYPES[kind].hp,moved:true});state.stars[owner]-=TYPES[kind].cost}
  }
 }
 if(!state.cities.some(v=>v.owner===0)){state.win=1;message('Je rijk is gevallen. Probeer opnieuw.')}
}
$('end').onclick=()=>{if(state.win!==null||combatBusy)return;const gained=income(0);if(state.settings?.victory==='legacy'){for(let owner=0;owner<state.stars.length;owner++)state.score[owner]+=state.cities.filter(c=>c.owner===owner).reduce((n,c)=>n+5*c.lv,0)+state.units.filter(u=>u.owner===owner).length*2+(owner===0?Object.values(state.tech).reduce((n,v)=>n+v*3,0):0)}state.stars[0]+=gained;state.turn++;state.units.forEach(u=>{u.moved=false;u.attacked=false});enemyTurn();checkWin();selected=null;active=null;if(state.win===null)message('Beurt '+state.turn+' · +'+gained+' sterren'+(state.settings?.victory==='legacy'?' · '+state.score[0]+'/'+state.settings.goal+' Legacy-punten':''));save();draw()};
$('recruit').onclick=()=>{const ct=selected&&city(selected.x,selected.z);const kind=$('unitType').value,spec=TYPES[kind];if(combatBusy||!canRecruit(kind)||!ct||ct.owner!==0||state.stars[0]<recruitCost(kind))return;const spots=[[0,0],[1,0],[-1,0],[0,1],[0,-1]],p=spots.find(([dx,dz])=>walk(state.tiles,ct.x+dx,ct.z+dz)&&!unit(ct.x+dx,ct.z+dz));if(!p){message('Geen plek voor een krijger.');return}state.units.push({id:state.seq++,x:ct.x+p[0],z:ct.z+p[1],owner:0,type:kind,hp:spec.hp+(tech.level(state,'magic')>=1?1:0),moved:true});state.stars[0]-=recruitCost(kind);message('Nieuwe '+spec.name.toLowerCase()+' gerekruteerd');save();draw()};
$('upgrade').onclick=()=>{const ct=selected&&city(selected.x,selected.z);if(combatBusy||!ct||ct.owner!==0||ct.lv>=4||state.stars[0]<4+ct.lv*2)return;state.stars[0]-=cityCost(ct);ct.lv++;message(ct.name+' geüpgraded!');save();draw()};
$('reset').onclick=()=>{if(confirm('Terug naar het hoofdmenu? Je spel blijft opgeslagen.'))showHome()};
function resize(){const d=Math.min(devicePixelRatio||1,2);w=c.clientWidth;h=c.clientHeight;c.width=w*d;c.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw()}addEventListener('resize',resize);
c.addEventListener('pointerdown',e=>{c.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,px:panX,py:panY,moved:false}});
c.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>7)drag.moved=true;if(drag.moved){panX=drag.px+dx;panY=drag.py+dy;draw()}});
c.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const t=pick(e.clientX,e.clientY);if(t)tap(t.x,t.z)}drag=null});
c.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.55,Math.min(2.1,zoom*(e.deltaY>0?.91:1.1)));draw()},{passive:false});
let oldDist=0;c.addEventListener('touchmove',e=>{if(e.touches.length===2){let a=e.touches[0],b=e.touches[1],d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);if(oldDist)zoom=Math.max(.55,Math.min(2.1,zoom*d/oldDist));oldDist=d;drag=null;draw()}},{passive:true});c.addEventListener('touchend',()=>oldDist=0);
$('unitType').addEventListener('change',draw);
$('techOpen').onclick=()=>{tech.render(state,(id,step,name)=>{if(id==='magic'&&step===0)state.units.filter(u=>u.owner===0).forEach(u=>u.hp++);message(name+' onderzocht!');if(!canRecruit($('unitType').value))$('unitType').value='warrior';save();draw()});$('techOverlay').hidden=false};
$('techClose').onclick=()=>{$('techOverlay').hidden=true};
$('techOverlay').addEventListener('click',e=>{if(e.target===$('techOverlay'))$('techOverlay').hidden=true});
function renderSlots(){
 const root=$('saveSlots');root.replaceChildren();
 for(let i=0;i<2;i++){
  const slot=document.createElement('div');slot.className='slot';
  let data=null;try{data=JSON.parse(localStorage.getItem('kov-save-'+i))}catch{}
  const title=document.createElement('b');title.textContent=data?'Slot '+(i+1)+' · '+(data.state.settings?.tribe||'Klassieke stam'):'Slot '+(i+1)+' · Leeg';slot.append(title);
  const desc=document.createElement('small');desc.textContent=data?'Beurt '+data.state.turn+' · '+(data.state.settings?.victory==='legacy'?'Legacy':'Conquest')+' · '+(data.state.settings?.mapSize||14)+'×'+(data.state.settings?.mapSize||14):'Nog geen spel gestart';slot.append(desc);
  if(data){const buttons=document.createElement('div');buttons.className='slotActions';
   const play=document.createElement('button');play.textContent='▶ Verder spelen';play.onclick=()=>loadGame(i);
   const remove=document.createElement('button');remove.className='secondary';remove.textContent='Verwijderen';remove.onclick=()=>{if(confirm('Dit opgeslagen spel verwijderen?')){localStorage.removeItem('kov-save-'+i);renderSlots()}};
   buttons.append(play,remove);slot.append(buttons)}
  root.append(slot)
 }
 $('newGame').disabled=[0,1].every(i=>localStorage.getItem('kov-save-'+i));
}
function showHome(){
 if(currentSlot>=0&&state)save();
 $('homeScreen').hidden=false;$('setupScreen').hidden=true;$('gameHud').hidden=true;$('backHome').hidden=true;
 $('techOverlay').hidden=true;$('techInfo').hidden=true;currentSlot=-1;state=null;renderSlots();ctx.clearRect(0,0,w,h);
}
function enterGame(){ $('homeScreen').hidden=true;$('setupScreen').hidden=true;$('gameHud').hidden=false;$('backHome').hidden=false;resize()}
function loadGame(slot){
 const data=JSON.parse(localStorage.getItem('kov-save-'+slot));currentSlot=slot;state=data.state;N=data.N||state.settings?.mapSize||14;seed=data.seed;state.tech=state.tech||{};state.settings=state.settings||{};if(!Array.isArray(state.settings.aiTribes)){const choices=sprites.tribes.filter(t=>t!==sprites.tribe(state.settings.tribe));state.settings.aiTribes=Array.from({length:state.stars.length-1},(_,i)=>choices[i%choices.length])}for(const u of state.units){const old=u.type;u.type=sprites.normalize(old);if(old!==u.type){const previous={ranger:9,guardian:18,harpooner:11,woodsman:12,healer:9}[old]||10;u.hp=Math.max(1,Math.min(TYPES[u.type].hp,Math.round(u.hp/previous*TYPES[u.type].hp)))}}state.score=state.score||Array(state.stars.length).fill(0);sprites.load([sprites.tribe(state.settings.tribe),...state.settings.aiTribes]);active=null;selected=null;combat=null;combatBusy=false;panX=0;panY=0;zoom=1;enterGame();message('Welkom terug!');draw();
}
$('newGame').onclick=()=>{if([0,1].every(i=>localStorage.getItem('kov-save-'+i)))return;$('homeScreen').hidden=true;$('setupScreen').hidden=false};
$('setupBack').onclick=showHome;
$('victoryChoice').onchange=()=>{$('scoreGoalRow').hidden=$('victoryChoice').value!=='legacy'};
$('tribeChoice').onchange=()=>{$('tribeDescription').textContent=({farming:'Extra kennis van landbouw',fishing:'Volk van zee en water',lumber:'Meesters van het bos',hunting:'Jagers van de wildernis',magic:'Kenners van oude magie',building:'Bouwers en verdedigers',mining:'Meesters van steen en ertsen'})[$('tribeChoice').value]};
$('startGame').onclick=()=>{
 const slot=[0,1].find(i=>!localStorage.getItem('kov-save-'+i));if(slot===undefined){$('setupError').textContent='Je hebt al twee spellen. Verwijder eerst een slot.';return}
 currentSlot=slot;init({tribe:$('tribeChoice').value,mode:$('modeChoice').value,victory:$('victoryChoice').value,goal:Number($('scoreGoal').value),aiCount:Number($('aiChoice').value),mapSize:Number($('mapChoice').value)});
 enterGame();save();
};
$('backHome').onclick=showHome;
const old=localStorage.getItem('kingdoms-of-vale-01');
if(old&&!localStorage.getItem('kov-migrated')){if(!localStorage.getItem('kov-save-0')){try{const prior=JSON.parse(old);if(prior?.state?.tiles){prior.state.settings={tribe:'farming',mode:'classic',victory:'conquest',aiCount:1,mapSize:14};prior.state.score=[0,0];localStorage.setItem('kov-save-0',JSON.stringify({seed:prior.seed,state:prior.state,N:14,updated:Date.now()}))}}catch{}}localStorage.setItem('kov-migrated','1')}
window.addEventListener('kov-sprite-ready',()=>draw());resize();showHome();
})();