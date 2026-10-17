(function(){
const branches=[
{id:'farming',icon:'🌾',name:'Farming',nodes:[{name:'Irrigatie',cost:4,benefit:'+1 ster per stad per beurt'},{name:'Oogstfeest',cost:9,benefit:'Nog +1 ster per stad per beurt'}]},
{id:'fishing',icon:'🐟',name:'Fishing',nodes:[{name:'Visnetten',cost:4,benefit:'+1 ster per beurt'},{name:'Vishandel',cost:9,benefit:'Nog +2 sterren per beurt'}]},
{id:'lumber',icon:'🌲',name:'Lumber',nodes:[{name:'Houtbewerking',cost:4,benefit:'Stadsupgrades 1 ster goedkoper'},{name:'Zagerij',cost:9,benefit:'Nog 1 ster goedkoper'}]},
{id:'hunting',icon:'🏹',name:'Hunting',nodes:[{name:'Spoorzoeken',cost:4,benefit:'Boogschutters 1 ster goedkoper'},{name:'Meesterschutters',cost:9,benefit:'Boogschutters +1 aanvalsschade'}]},
{id:'magic',icon:'✨',name:'Magic',nodes:[{name:'Runenleer',cost:4,benefit:'Alle eigen eenheden +1 maximale HP'},{name:'Betovering',cost:9,benefit:'Alle eigen eenheden +1 aanvalsschade'}]},
{id:'building',icon:'🏛️',name:'Building',nodes:[{name:'Metselen',cost:4,benefit:'Stadsupgrades 1 ster goedkoper'},{name:'Vestingbouw',cost:9,benefit:'+1 ster per stad per beurt'}]},
{id:'mining',icon:'⛏️',name:'Mining',nodes:[{name:'Mijnbouw',cost:4,benefit:'+1 ster per beurt'},{name:'Edelstenen',cost:9,benefit:'Nog +2 sterren per beurt'}]}
];
const level=(s,id)=>s.tech?.[id]||0;
function render(state,onUnlock){
const root=document.getElementById('techBranches');root.replaceChildren();
for(const branch of branches){
const card=document.createElement('article');card.className='techBranch';
const name=document.createElement('h3');name.textContent=branch.icon+' '+branch.name+' ('+level(state,branch.id)+'/2)';card.append(name);
branch.nodes.forEach((node,i)=>{const btn=document.createElement('button');btn.className='techNode';const current=level(state,branch.id);
btn.textContent=(i<current?'✓ ':i===current?'🔓 ':'🔒 ')+node.name+' · '+(i<current?'Ontgrendeld':node.cost+' ⭐')+' — '+node.benefit;
btn.disabled=i!==current||state.stars[0]<node.cost||state.win!==null;
btn.onclick=()=>{if(level(state,branch.id)!==i||state.stars[0]<node.cost)return;state.stars[0]-=node.cost;state.tech[branch.id]=i+1;onUnlock(branch.id,i,node.name);render(state,onUnlock)};card.append(btn)});
root.append(card)}
}
window.GameTech={branches,level,render,
income:(s)=>{const cities=s.cities.filter(v=>v.owner===0).length;return cities*(level(s,'farming')+(level(s,'building')>=2?1:0))+(level(s,'fishing')>=1?1:0)+(level(s,'fishing')>=2?2:0)+(level(s,'mining')>=1?1:0)+(level(s,'mining')>=2?2:0)},
unitCost:(s,kind,cost)=>Math.max(1,cost-(kind==='archer'&&level(s,'hunting')>=1?1:0)),
cityCost:(s,ct)=>Math.max(1,4+ct.lv*2-level(s,'lumber')-(level(s,'building')>=1?1:0)),
damage:(s,u,base)=>base+(u.owner===0?((u.type==='archer'&&level(s,'hunting')>=2?1:0)+(level(s,'magic')>=2?1:0)):0),
maxHp:(s,u,base)=>base+(u.owner===0&&level(s,'magic')>=1?1:0)
};
})();