import * as C from './assets/cannon-es.js';
const v=(a)=>new C.Vec3(...a);
// Visual sections are the collision source: removed walls cannot leave invisible boxes.
export function createBuildingStructure(world,material,definitions,{limit=24}={}){
 const cells=definitions.map((d,id)=>({...d,id,broken:false,scuffed:false,damage:0})),chunks=new Map(),pending=new Map(),debris=[];
 for(const cell of cells){const key=cell.position.map(n=>Math.floor(n/60)).join(':');if(!chunks.has(key))chunks.set(key,[]);chunks.get(key).push(cell);}
 const buildingGroup=1<<14,debrisGroup=1<<15,aircraftMask=(1<<11)-2;
 for(const list of chunks.values()){
  const origin=list[0].position,body=new C.Body({mass:0,material,position:v(origin),collisionFilterGroup:buildingGroup});body.surface='building';
  for(const c of list){c.shape=new C.Box(v(c.size.map(n=>Math.max(.08,n/2))));body.addShape(c.shape,v(c.position.map((n,i)=>n-origin[i])));c.owner=body;}
  body.addEventListener('collide',e=>{
   if(!e.body.part&&e.body.surface!=='building-debris')return;
   const contact=e.contact,shape=contact.bi===body?contact.si:contact.sj,cell=list.find(c=>c.shape===shape);if(!cell||cell.broken)return;
   const speed=Math.abs(contact.getImpactVelocityAlongNormal()),energy=.5*e.body.mass*speed*speed;
   // Tangential motion does not count as a head-on impact. A scrape only marks the wall.
   if(speed>1)cell.scuffed=true;
   if(speed<7||energy<18000)return;
   const old=pending.get(cell.id);if(!old||energy>old.energy)pending.set(cell.id,{cell,energy,velocity:e.body.velocity.clone()});
  });world.addBody(body);
 }
 function detach(c,velocity){
  if(c.broken||debris.length>=limit)return;
  c.broken=true;c.owner.removeShape(c.shape);c.owner.updateBoundingRadius();c.owner.aabbNeedsUpdate=true;
  if(!c.owner.shapes.length)world.removeBody(c.owner);
  const volume=c.size.reduce((a,b)=>a*b,1),body=new C.Body({mass:Math.min(8000,Math.max(120,volume*12)),material,position:v(c.position),shape:new C.Box(v(c.size.map(n=>Math.max(.08,n*.46)))),linearDamping:.12,angularDamping:.35,allowSleep:true,sleepSpeedLimit:.2,sleepTimeLimit:1.5,collisionFilterGroup:debrisGroup,collisionFilterMask:1|aircraftMask});
  body.surface='building-debris';body.velocity.copy(velocity.scale(.15));c.body=body;c.age=0;world.addBody(body);debris.push(c);
 }
 world.addEventListener('postStep',()=>{
  for(const {cell,energy,velocity} of pending.values()){
   if(cell.broken)continue;
   const threshold=18000+cell.size.reduce((a,b)=>a*b,1)*6;cell.damage+=energy/threshold;
   if(cell.damage<1)continue;
   detach(cell,velocity);
   // A strong local strike can loosen touching sections, never the entire building.
   if(energy>threshold*4){const nearby=cells.filter(c=>!c.broken&&c.id!==cell.id&&c.position.every((n,i)=>Math.abs(n-cell.position[i])<=(c.size[i]+cell.size[i])/2+.25)).sort((a,b)=>Math.hypot(...a.position.map((n,i)=>n-cell.position[i]))-Math.hypot(...b.position.map((n,i)=>n-cell.position[i]))).slice(0,2);for(const c of nearby)detach(c,velocity.scale(.5));}
  }pending.clear();
  for(const c of debris){c.age+=world.dt;if(c.age>.2)c.body.collisionFilterMask=1|aircraftMask|buildingGroup|debrisGroup;}
 });
 return {cells,debris,limit};
}
