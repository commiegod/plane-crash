import * as T from './assets/three.module.js';
// Localized visual damage. The airport is restored when a new flight starts.
export function createAirportDamage(scene,ground,limit=96){
 const sections=[],broken=[],bodies=[],dummy=new T.Object3D();let incident=null,flight=null;const scuffed=new Map();
 const rubble=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:0xffffff,roughness:.92}),limit);rubble.count=0;rubble.castShadow=rubble.receiveShadow=true;rubble.frustumCulled=false;scene.add(rubble);
 function register(mesh,index,size,position,material){sections.push({mesh,index,size,position,material});}
 function reset(){for(const b of broken){b.mesh.setMatrixAt(b.index,b.matrix);b.mesh.instanceMatrix.needsUpdate=true;}for(const [b,color] of scuffed){b.mesh.setColorAt(b.index,color);b.mesh.instanceColor.needsUpdate=true;}scuffed.clear();broken.length=bodies.length=0;rubble.count=0;incident=null;}
 function distance(b,p){const q=b.position,h=b.size;return Math.hypot(Math.max(0,Math.abs(p.x-q[0])-h[0]/2),Math.max(0,Math.abs(p.y-q[1])-h[1]/2),Math.max(0,Math.abs(p.z-q[2])-h[2]/2));}
 function update(s,dt){const state=s.state==='paused'?s.saved:s.state;
 if(s.systems&&flight!==s.systems){reset();flight=s.systems;}
 if(state==='ready'){reset();return;}if(s.state==='paused')return;
 if(state!=='crashed'&&s.scrape&&!s.scrape.terrain&&(s.scrape.normalSpeed>2||s.scrape.speed>12)&&scuffed.size<12){
 const p=s.scrape,b=sections.filter(b=>!scuffed.has(b)&&distance(b,p)<2).sort((a,b)=>distance(a,p)-distance(b,p))[0];
 if(b){const color=new T.Color(1,1,1);if(b.mesh.instanceColor)b.mesh.getColorAt(b.index,color);else {for(let i=0;i<b.mesh.count;i++)b.mesh.setColorAt(i,new T.Color(1,1,1));}scuffed.set(b,color.clone());b.mesh.setColorAt(b.index,color.multiplyScalar(.68));b.mesh.instanceColor.needsUpdate=true;
 for(let i=0;i<3&&bodies.length<limit;i++){const size=[.2+i*.1,.15,.25];bodies.push({position:new T.Vector3(p.x+(p.nx||0)*.2,p.y,p.z+(p.nz||0)*.2),velocity:new T.Vector3((p.nx||0)*(1+i),1+i,(p.nz||0)*(1+i)),size,rotation:new T.Vector3(),rest:false});rubble.setColorAt(bodies.length-1,b.material.color||new T.Color(0x9ba5a9));}rubble.count=bodies.length;if(rubble.instanceColor)rubble.instanceColor.needsUpdate=true;}
 }
 if(state==='crashed'&&incident!==s.debris){incident=s.debris;const p=s.crashProfile?.contactPoint||s.impactPos,radius=3+Math.min(1,s.crashProfile?.severity||0)*20;const hits=(s.crashCause==='BUILDING COLLISION'&&s.crashProfile?.severity>=.3?sections:[]).map(b=>{const q=b.position,h=b.size;const d=Math.hypot(Math.max(0,Math.abs(p.x-q[0])-h[0]/2),Math.max(0,Math.abs(p.y-q[1])-h[1]/2),Math.max(0,Math.abs(p.z-q[2])-h[2]/2));return {b,d};}).filter(x=>x.d<radius).sort((a,b)=>a.d-b.d).slice(0,Math.ceil(4+24*(s.crashProfile?.severity||0)));
 for(const {b} of hits){const matrix=new T.Matrix4();b.mesh.getMatrixAt(b.index,matrix);broken.push({...b,matrix});dummy.position.set(...b.position);dummy.scale.setScalar(0);dummy.updateMatrix();b.mesh.setMatrixAt(b.index,dummy.matrix);b.mesh.instanceMatrix.needsUpdate=true;
 for(let i=0;i<2&&bodies.length<limit;i++){const j=bodies.length,spread=i?1:-1;const size=[Math.min(4,Math.max(.8,b.size[0]*.28)),.35+i*.25,Math.min(5,Math.max(.8,b.size[2]*.28))];const position=new T.Vector3(...b.position).add(new T.Vector3(spread*size[0]*.3,0,spread*size[2]*.3));const velocity=position.clone().sub(new T.Vector3(p.x,p.y,p.z)).normalize().multiplyScalar(Math.min(18,s.impact*.12));velocity.y=4+i*3;bodies.push({position,velocity,size,rotation:new T.Vector3(),rest:false});rubble.setColorAt(j,b.material.color||new T.Color(0x9ba5a9));}}
 rubble.count=bodies.length;if(rubble.instanceColor)rubble.instanceColor.needsUpdate=true;
 }
 // Fixed bounded substeps prevent tunneling and keep low frame rates stable.
 const count=Math.max(1,Math.ceil(dt/(1/60))),h=dt/count;
 for(let step=0;step<count;step++)for(const b of bodies){if(b.rest)continue;b.velocity.y-=9.81*h;b.position.addScaledVector(b.velocity,h);b.rotation.x+=h*.9;b.rotation.z+=h*.6;const floor=ground(b.position.x,b.position.z)+.5*(Math.abs(Math.sin(b.rotation.z)*Math.cos(b.rotation.x))*b.size[0]+Math.abs(Math.cos(b.rotation.z)*Math.cos(b.rotation.x))*b.size[1]+Math.abs(Math.sin(b.rotation.x))*b.size[2]);if(b.position.y<=floor){b.position.y=floor;b.velocity.y=0;b.velocity.x*=Math.exp(-h*4);b.velocity.z*=Math.exp(-h*4);if(Math.hypot(b.velocity.x,b.velocity.z)<.25)b.rest=true;}}
 bodies.forEach((b,i)=>{dummy.position.copy(b.position);dummy.rotation.set(b.rotation.x,0,b.rotation.z);dummy.scale.set(...b.size);dummy.updateMatrix();rubble.setMatrixAt(i,dummy.matrix);});if(bodies.length)rubble.instanceMatrix.needsUpdate=true;
 }
 return {register,update,reset,rubble,sections};
}
