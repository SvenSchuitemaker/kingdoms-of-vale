(function(){'use strict';
const cache=new Map();
const levels=8;
function key(tribe,level){return tribe+'/'+Math.max(1,Math.min(levels,Math.floor(Number(level)||1)))}
function request(tribe,level){
 const k=key(tribe,level);
 if(cache.has(k))return cache.get(k);
 const image=new Image();image.decoding='async';
 const item={image,status:'loading'};
 cache.set(k,item);
 image.onload=()=>{item.status='ready';window.dispatchEvent(new Event('kov-castle-ready'))};
 image.onerror=()=>{item.status='missing';window.dispatchEvent(new Event('kov-castle-ready'))};
 image.src='./assets/buildings/'+k.split('/')[0]+'/castle/level-'+k.split('/')[1]+'.webp';
 return item;
}
function draw(ctx,tribe,level,x,feetY){
 if(!tribe)return false;
 const item=request(tribe,level);
 if(item.status!=='ready'||!item.image.naturalWidth)return false;
 // Keep the base anchored on the city tile. Taller levels grow upwards.
 const lv=Math.max(1,Math.min(levels,Math.floor(Number(level)||1)));
 const width=31+Math.min(lv-1,7)*1.45;
 const height=42+Math.min(lv-1,7)*5.5;
 const scale=Math.min(width/item.image.naturalWidth,height/item.image.naturalHeight);
 const w=item.image.naturalWidth*scale,h=item.image.naturalHeight*scale;
 ctx.drawImage(item.image,x-w/2,feetY-h,w,h);
 return true;
}
window.KovCastles={draw,request};
})();