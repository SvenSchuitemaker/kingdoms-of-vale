(()=>{
const tribes=[
{id:'farming',name:'Harvestfolk',path:'Farming',icon:'🌾',description:'De Harvestfolk leven van vruchtbare velden en rijke oogsten.',bonus:'Start met Irrigatie (Farming niveau 1).'},
{id:'fishing',name:'Tideborn',path:'Fishing',icon:'🐟',description:'De Tideborn beheersen de havens en kustwateren.',bonus:'Start met Visnetten (Fishing niveau 1).'},
{id:'lumber',name:'Verdant',path:'Lumber',icon:'🌲',description:'De Verdant bewaken oerbossen en zijn meesters van hout.',bonus:'Start met Houtbewerking (Lumber niveau 1).'},
{id:'hunting',name:'Wildfang',path:'Hunting',icon:'🏹',description:'De Wildfang kennen ieder spoor in de wildernis.',bonus:'Start met Spoorzoeken (Hunting niveau 1).'},
{id:'magic',name:'Arcanum',path:'Magic',icon:'✨',description:'De Arcanum begrijpen de kracht van oude kristallen.',bonus:'Start met Runenleer (Magic niveau 1).'},
{id:'building',name:'Stoneguard',path:'Building',icon:'🏰',description:'Stoneguard sticht forten en verdedigt het rijk.',bonus:'Start met Metselen (Building niveau 1).'},
{id:'mining',name:'Deepforge',path:'Mining',icon:'⛏️',description:'Deepforge haalt waardevolle schatten uit de bergen.',bonus:'Start met Mijnbouw (Mining niveau 1).'}
];
const $=id=>document.getElementById(id);let chosen='farming',pending='farming';
const data=id=>tribes.find(t=>t.id===id)||tribes[0];
function portrait(t){const el=document.createElement('span');el.className='tribeAvatar';el.dataset.tribe=t.id;el.setAttribute('role','img');el.setAttribute('aria-label',t.name);const img=document.createElement('img');img.src='./assets/tribes/'+t.id+'.webp';img.alt='';img.loading='lazy';img.decoding='async';img.onerror=()=>{img.remove();el.textContent=t.icon};el.append(img);return el}
function updatePreview(){const t=data(pending);$('tribePreviewName').textContent=t.name+' · '+t.path;$('tribePreviewDescription').textContent=t.description;$('tribePreviewBonus').textContent=t.bonus;[...$('tribeGrid').children].forEach(e=>{const current=e.dataset.tribe===pending;e.classList.toggle('selected',current);e.setAttribute('aria-pressed',String(current))})}
function show(){pending=chosen;$('tribeModal').hidden=false;updatePreview();$('closeTribes').focus()}
function hide(){$('tribeModal').hidden=true;$('chooseTribe').focus()}
function select(id){chosen=id;const t=data(id);$('tribeChoice').value=id;$('selectedTribeName').textContent=t.name;$('tribeDescription').textContent=t.description;const avatar=$('selectedTribeAvatar');avatar.replaceWith(portrait(t));$('chooseTribe').querySelector('.tribeAvatar').id='selectedTribeAvatar'}
for(const t of tribes){const card=document.createElement('button');card.type='button';card.className='tribeCard';card.dataset.tribe=t.id;card.append(portrait(t));const title=document.createElement('b');title.textContent=t.name;const sub=document.createElement('small');sub.textContent=t.path;card.append(title,sub);card.onclick=()=>{pending=t.id;updatePreview()};$('tribeGrid').append(card)}
$('chooseTribe').onclick=show;$('closeTribes').onclick=hide;$('confirmTribe').onclick=()=>{select(pending);hide()};
$('tribeModal').addEventListener('click',e=>{if(e.target===$('tribeModal'))hide()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('tribeModal').hidden)hide()});
select(chosen);
window.KovTribes={list:tribes,name:id=>data(id).name};
})();