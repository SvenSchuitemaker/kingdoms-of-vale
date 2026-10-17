(function(){'use strict';
const names=['warrior','knight','golem','archer','mage','ghost','catapult','giant'];
const tribes=['harvestfolk','tideborn','verdant','wildfang','arcanum','stoneguard','deepforge'];
const paths=['farming','fishing','lumber','hunting','magic','building','mining'];
const legacy={ranger:'archer',guardian:'golem',harpooner:'archer',woodsman:'warrior',healer:'mage'};
const images=new Map(),broken=new Set();
function normalize(type){return names.includes(type)?type:(legacy[type]||'warrior')}
function tribe(id){return tribes.includes(id)?id:tribes[paths.indexOf(id)]||'harvestfolk'}
function load(requested=tribes){for(const t of requested.map(tribe))for(const n of names){const key=t+'/'+n;if(images.has(key))continue;const img=new Image();img.decoding='async';img.onload=()=>window.dispatchEvent(new Event('kov-sprite-ready'));img.onerror=()=>{broken.add(key);console.warn('Unit sprite ontbreekt:',key)};img.src='./assets/units/'+key+'.webp';images.set(key,img)}}
function draw(ctx,t,n,x,y,width,height){const key=tribe(t)+'/'+normalize(n),img=images.get(key);if(!img||!img.complete||!img.naturalWidth)return false;const scale=Math.min(width/img.naturalWidth,height/img.naturalHeight);const dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;ctx.drawImage(img,x-dw/2,y-dh,dw,dh);return true}
window.KovSprites={names,tribes,paths,legacy,normalize,tribe,load,draw,broken};
})();