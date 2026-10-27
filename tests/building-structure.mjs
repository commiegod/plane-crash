import assert from 'node:assert/strict';
import * as C from '../assets/cannon-es.js';
import * as T from '../assets/three.module.js';
import {createBuildingStructure} from '../building-structure.js';
import {createAirportDamage} from '../airport-damage.js';
function run(speed,tangent=0,hz=120){
 const world=new C.World({gravity:new C.Vec3(0,-9.81,0)}),mat=new C.Material();world.defaultContactMaterial.friction=.4/120;
 const floor=new C.Body({mass:0,material:mat,shape:new C.Plane()});floor.quaternion.setFromEuler(-Math.PI/2,0,0);world.addBody(floor);
 const defs=Array.from({length:8},(_,i)=>({size:[2,6,4],position:[0,3,i*4]}));
 const structure=createBuildingStructure(world,mat,defs,{limit:4});
 const plane=new C.Body({mass:650,position:new C.Vec3(-3,3,1),shape:new C.Box(new C.Vec3(.6,.6,.6)),velocity:new C.Vec3(speed,0,tangent)});plane.part='cabin';plane.collisionFilterGroup=2;world.addBody(plane);
 for(let i=0;i<120;i++)world.step(1/120);return {world,structure,plane};
}
const scrape=run(3,25);assert.equal(scrape.structure.debris.length,0,'glancing scrape leaves structure standing');assert(scrape.structure.cells.some(c=>c.scuffed));
const heavy=run(40);assert(heavy.structure.debris.length>0&&heavy.structure.debris.length<=4,'local bounded fracture');assert(!heavy.structure.cells[7].broken,'distant structure stands');
for(const c of heavy.structure.debris){assert(c.body.world===heavy.world);assert(!c.owner.shapes.includes(c.shape),'old wall collider removed');assert(c.body.collisionFilterMask&2,'debris hits aircraft');}
for(let i=0;i<7200;i++)heavy.world.step(1/120);
for(const c of heavy.structure.debris){c.body.updateAABB();assert(c.body.aabb.lowerBound.y>-.2,'debris remains above ground');assert(c.body.velocity.length()<.4,'debris settles');}
const scene=new T.Scene(),visual=createAirportDamage(scene,()=>0),mesh=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshStandardMaterial(),8),d=new T.Object3D();heavy.structure.cells.forEach((c,i)=>{d.position.set(...c.position);d.scale.set(...c.size);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);visual.register(mesh,i,c.size,c.position,mesh.material);});const original=Array.from(mesh.instanceMatrix.array);
visual.update({state:'flight',structural:true,structuralBuildings:heavy.structure},0);assert.notDeepEqual(Array.from(mesh.instanceMatrix.array),original,'visual tracks physical rubble');visual.update({state:'ready',systems:{}},0);assert.deepEqual(Array.from(mesh.instanceMatrix.array),original,'restart restores airport');
console.log('PASS glancing scuffs, local fracture, distant walls, collidable debris, removed wall collision, settling, visual sync and reset');
// Match the actual terminal pier's rendered section subdivision, including roof and glass overlap.
const {definitions}=await import('./structure-fixture.mjs');
const {startAirportStructure}=await import('../airport-structure.js');
const sections=[];
function detail(size,position){const n=size.map(v=>Math.max(1,Math.ceil(v/18)));for(let x=0;x<n[0];x++)for(let y=0;y<n[1];y++)for(let z=0;z<n[2];z++){const s=size.map((v,i)=>v/n[i]);sections.push({size:s,position:[x,y,z].map((v,i)=>position[i]-size[i]/2+s[i]*(v+.5))});}}
detail([380,15,50],[650,17.5,760]);detail([385,1.5,54],[650,25.7,760]);for(const side of [-1,1])detail([365,9,.4],[650,19,760+side*25.2]);
const model={definitions,groups:Object.fromEntries(Object.keys(definitions).map(id=>[id,{position:{copy(){}},quaternion:{copy(){}},children:[]}]))};
const airport=startAirportStructure(model,()=>10,{pos:{x:400,y:19,z:760},vel:{x:55,y:0,z:0},yaw:Math.PI/2,pitch:0,roll:0},sections);
for(let i=0;i<600;i++)airport.update(1/60,{throttle:.5});
assert(airport.buildings.debris.length>0,'actual Cessna breaks actual pier sections');assert(airport.buildings.debris.length<=24);assert(airport.buildings.cells.filter(c=>!c.broken).length>sections.length*.8,'majority of pier remains standing');
for(let i=0;i<3000;i++)airport.update(1/60,{});
for(const c of airport.buildings.debris){c.body.updateAABB();assert(c.body.aabb.lowerBound.y>9.7,'actual airport debris stays above runway');assert(c.body.velocity.length()<.5,'overlapping facade layers do not explode indefinitely');}
console.log('PASS actual Cessna/pier impact, overlapping roof and glass, local damage, terrain support and settled rubble: '+airport.buildings.debris.length+' sections');
