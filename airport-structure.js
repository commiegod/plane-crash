import {createBuildingStructure} from './building-structure.js';
import * as C from './assets/cannon-es.js';
import * as T from './assets/three.module.js';
import {createStructure} from './experimental/structure-physics.js?v=steering-20261029';
import {loadStructureModel} from './experimental/structure-model.js?v=fleet-20261028';
import {terrainMeshHeight} from './crash-model.js';
export function airportBuildingBoxes(){
 const b=[{x:885,y:24.5,z:1300,w:119,h:29,l:1484},{x:975,y:37.5,z:2080,w:17,h:55,l:17},{x:975,y:69.5,z:2080,w:36,h:11,l:36}];
 for(const z of [760,1300,1840]){b.push({x:650,y:18.6,z,w:385,h:17.2,l:54});for(const side of [-1,1])for(const x of [495,625,755]){b.push({x:x-20,y:17,z:z+side*45,w:12,h:6,l:43},{x:x-11,y:17,z:z+side*71,w:30,h:6,l:11},{x:x+4,y:17,z:z+side*71,w:10,h:7,l:13});}}
 for(let z=550;z<2100;z+=280)b.push({x:1005,y:20.5,z,w:62,h:21,l:123});return b;
}
export function installAirport(world,material,ground,sections=null){
 // Cyclic axis permutation maps heightfield (x,y,z) to world (y,z,x).
 // This preserves the exact diagonal of the rendered 60 m terrain triangles.
 const data=Array.from({length:301},(_,i)=>Array.from({length:301},(_,j)=>ground(-9000+j*60,-9000+i*60)));
 const terrain=new C.Body({mass:0,material,shape:new C.Heightfield(data,{elementSize:60})});terrain.position.set(-9000,0,-9000);terrain.quaternion.set(-.5,-.5,-.5,.5);terrain.surface='terrain';world.addBody(terrain);
 if(sections){const structures=createBuildingStructure(world,material,sections);return {terrain,structures};}
 const buildings=airportBuildingBoxes().map(b=>{const body=new C.Body({mass:0,material,position:new C.Vec3(b.x,b.y,b.z),shape:new C.Box(new C.Vec3(b.w/2,b.h/2,b.l/2))});body.surface='building';world.addBody(body);return body;});
 return {terrain,buildings};
}
export async function prepareAirportStructure(id='c172'){return loadStructureModel(id);}
export function startAirportStructure(model,ground,pose,sections=null){
 let environment;
 const sim=createStructure(model.definitions,{profile:model.profile,surfaceHeight:(x,z)=>terrainMeshHeight(x,z,ground),installEnvironment:(w,m)=>{environment=installAirport(w,m,ground,sections)},initialPose:pose});
 let eventIndex=0;const rotation=new T.Euler(0,0,0,'YXZ');
 return {sim,model,buildings:environment.structures,update(dt,input){sim.advance(dt,input);for(const [id,b] of Object.entries(sim.bodies)){const group=model.groups[id];group.userData??={};group.userData.retracted=id.endsWith('Gear')&&input.gear===false&&sim.attached(id);group.position.copy(b.position);group.quaternion.copy(b.quaternion);for(const mesh of group.children)if(mesh.userData.joint)mesh.visible=sim.joints.find(j=>j.id===mesh.userData.joint).broken;}
 const b=sim.bodies.cabin;rotation.setFromQuaternion(new T.Quaternion(b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w),'YXZ');
 const center=b.pointToWorldFrame(new C.Vec3(model.definitions.cabin.center.x,model.definitions.cabin.center.y,model.definitions.cabin.center.z).negate());
 const hits=sim.hits.splice(0),events=sim.events.slice(eventIndex);eventIndex=sim.events.length;
 const grounded=sim.world.contacts.some(c=>(c.bi.surface&&c.bj.collisionResponse&&c.ni.y>.45&&sim.attached(c.bj.part))||(c.bj.surface&&c.bi.collisionResponse&&c.ni.y<-.45&&sim.attached(c.bi.part)));
 return {pos:{...center},vel:{...b.velocity},pitch:-rotation.x,roll:rotation.z,yaw:rotation.y,grounded,hits,events};
 },breakup(){for(const j of sim.joints)sim.breakJoint(j,'onboard explosion');}};
}
