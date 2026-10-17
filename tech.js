(function(){
const branches=[
{id:'farming',icon:'🌾',name:'Farming',nodes:[{name:'Irrigatie',cost:4,benefit:'+1 ster per stad per beurt'},{name:'Oogstfeest',cost:9,benefit:'Nog +1 ster per stad per beurt en ontgrendelt Giant'}]},
{id:'fishing',icon:'🐟',name:'Fishing',nodes:[{name:'Visnetten',cost:4,benefit:'+1 ster per beurt'},{name:'Vishandel',cost:9,benefit:'Nog +2 sterren per beurt en ontgrendelt Catapult'}]},
{id:'lumber',icon:'🌲',name:'Lumber',nodes:[{name:'Houtbewerking',cost:4,benefit:'Stadsupgrades 1 ster goedkoper'},{name:'Zagerij',cost:9,benefit:'Nog 1 ster goedkoper en ontgrendelt Ghost'}]},
{id:'hunting',icon:'🏹',name:'Hunting',nodes:[{name:'Spoorzoeken',cost:4,benefit:'Ontgrendelt boogschutters'},{name:'Meesterschutters',cost:9,benefit:'Boogschutters +1 schade en 1 ster goedkoper; versterkt boogschutters'}]},
{id:'magic',icon:'✨',name:'Magic',nodes:[{name:'Runenleer',cost:4,benefit:'Alle eigen eenheden +1 maximale HP en ontgrendelt Mage'},{name:'Betovering',cost:9,benefit:'Alle eigen eenheden +1 aanvalsschade'}]},
{id:'building',icon:'🏛️',name:'Building',nodes:[{name:'Metselen',cost:4,benefit:'Stadsupgrades 1 ster goedkoper en ontgrendelt Golem'},{name:'Vestingbouw',cost:9,benefit:'Ontgrendelt ridders en +1 ster per stad per beurt'}]},
{id:'mining',icon:'⛏️',name:'Mining',nodes:[{name:'Mijnbouw',cost:4,benefit:'+1 ster per beurt'},{name:'Edelstenen',cost:9,benefit:'Nog +2 sterren per beurt en versterkt Golems'}]}
];
const level=(s,id)=>s.tech?.[id]||0;
function showInfo(state,branch,node,index,onUnlock){
 const modal=document.getElementById('techInfo');
 const close=()=>{modal.hidden=true;document.removeEventListener('keydown',onKey)};
 const onKey=e=>{if(e.key==='Escape')close()};
 const owned=index<level(state,branch.id),ready=index===level(state,branch.id);
 const affordable=state.stars[0]>=node.cost;
 document.getElementById('techInfoIcon').textContent=branch.icon;
 document.getElementById('techInfoTitle').textContent=node.name;
 document.getElementById('techInfoBranch').textContent=branch.name+' · Niveau '+(index+1);
 document.getElementById('techInfoBenefit').textContent=node.benefit;
 document.getElementById('techInfoPrice').textContent='Kosten: '+node.cost+' ⭐ · Beschikbaar: '+state.stars[0]+' ⭐';
 const status=document.getElementById('techInfoStatus');
 status.textContent=owned?'Deze technologie is al onderzocht.':!ready?'Ontgrendel eerst de vorige technologie.':!affordable?'Je hebt nog '+(node.cost-state.stars[0])+' sterren nodig.':'Wil je deze technologie onderzoeken?';
 const confirm=document.getElementById('techInfoConfirm');
 confirm.disabled=owned||!ready||!affordable||state.win!==null;
 confirm.textContent=owned?'Al ontgrendeld':ready?'Onderzoeken · '+node.cost+' ⭐':'Vergrendeld';
 confirm.onclick=()=>{
  if(level(state,branch.id)!==index||state.stars[0]<node.cost||state.win!==null)return;
  state.stars[0]-=node.cost;state.tech[branch.id]=index+1;
  close();onUnlock(branch.id,index,node.name);render(state,onUnlock);
 };
 document.getElementById('techInfoCancel').onclick=close;
 modal.onclick=e=>{if(e.target===modal)close()};
 modal.hidden=false;document.addEventListener('keydown',onKey);
}
function render(state,onUnlock){
 const root=document.getElementById('techBranches');root.replaceChildren();
 const board=document.createElement('div');board.className='techBoard';
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 760 760');svg.setAttribute('class','techLines');
 const center={x:380,y:380};const hub=document.createElement('div');hub.className='techHub';hub.textContent='🏰';hub.title='Kingdoms of Vale';hub.style.left=center.x+'px';hub.style.top=center.y+'px';board.append(svg,hub);
 const makeLine=(a,b,unlocked)=>{
  const line=document.createElementNS('http://www.w3.org/2000/svg','line');
  for(const [k,v] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y}))line.setAttribute(k,v);
  line.setAttribute('stroke',unlocked?'#49cb80':'#506373');
  line.setAttribute('stroke-width','4');svg.append(line);
 };
 branches.forEach((branch,index)=>{
  const angle=(-Math.PI/2)+(index*2*Math.PI/branches.length);
  let previous=center;const lv=level(state,branch.id);
  branch.nodes.forEach((node,i)=>{
   const radius=144+i*133,point={x:center.x+Math.cos(angle)*radius,y:center.y+Math.sin(angle)*radius};
   makeLine(previous,point,i<lv);
   const btn=document.createElement('button');btn.className='techCircle '+(i<lv?'researched':i===lv?'available':'locked');
   btn.style.left=point.x+'px';btn.style.top=point.y+'px';
   btn.setAttribute('aria-label',branch.name+': '+node.name+' '+node.cost+' sterren');
   const symbol=document.createElement('span');symbol.className='techEmoji';symbol.textContent=branch.icon;
   const label=document.createElement('span');label.className='techName';label.textContent=node.name;
   const price=document.createElement('span');price.className='techPrice';price.textContent=i<lv?'✓':node.cost+' ⭐';
   btn.append(symbol,label,price);btn.title=node.benefit;
   btn.disabled=false;
   btn.onclick=()=>showInfo(state,branch,node,i,onUnlock);
   board.append(btn);
   previous=point;
  });
 });
 root.append(board);root.scrollLeft=Math.max(0,(root.scrollWidth-root.clientWidth)/2);root.scrollTop=Math.max(0,(root.scrollHeight-root.clientHeight)/2);
}

window.GameTech={branches,level,render,
income:(s)=>{const cities=s.cities.filter(v=>v.owner===0).length;return cities*(level(s,'farming')+(level(s,'building')>=2?1:0))+(level(s,'fishing')>=1?1:0)+(level(s,'fishing')>=2?2:0)+(level(s,'mining')>=1?1:0)+(level(s,'mining')>=2?2:0)},
unlocked:(s,kind)=>({warrior:true,archer:level(s,'hunting')>=1,mage:level(s,'magic')>=1,knight:level(s,'building')>=2,golem:level(s,'mining')>=2||level(s,'building')>=1,ghost:level(s,'lumber')>=2,catapult:level(s,'fishing')>=2,giant:level(s,'farming')>=2}[kind]===true),
unitCost:(s,kind,cost)=>Math.max(1,cost-(kind==='archer'&&level(s,'hunting')>=2?1:0)),
cityCost:(s,ct)=>Math.max(1,4+ct.lv*2-level(s,'lumber')-(level(s,'building')>=1?1:0)),
damage:(s,u,base)=>base+(u.owner===0?((u.type==='archer'&&level(s,'hunting')>=2?1:0)+(level(s,'magic')>=2?1:0)):0),
maxHp:(s,u,base)=>base+(u.owner===0&&level(s,'magic')>=1?1:0)
};
})();