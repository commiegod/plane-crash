import fs from 'node:fs';
import assert from 'node:assert/strict';
import {GLTFLoader} from '../assets/GLTFLoader.js';
import {buildStructureModel} from '../experimental/structure-model.js';
import {fleetProfile,FLEET_IDS} from '../experimental/fleet-profiles.js';
import {createStructure} from '../experimental/structure-physics.js';
globalThis.ProgressEvent=class{constructor(type,props){Object.assign(this,{type},props);}};
for(const id of FLEET_IDS.filter(id=>!process.env.FLEET_TEST_IDS||process.env.FLEET_TEST_IDS.split(',').includes(id))){
 let profile=fleetProfile(id);const raw=fs.readFileSync(new URL(`../assets/${profile.folder}/${profile.file}.glb`,import.meta.url)),len=raw.readUInt32LE(12),json=JSON.parse(raw.subarray(20,20+len).toString());
 json.buffers[0].uri='data:application/octet-stream;base64,'+raw.subarray(28+len).toString('base64');json.images=[];json.textures=[];json.materials=json.materials.map(m=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:[1,1,1,1]}}));
 const {scene}=await new GLTFLoader().parseAsync(JSON.stringify(json),'');
 const model=buildStructureModel(scene,profile);profile=model.profile;

 const pose={pos:{x:0,y:profile.clearance+.08,z:0},vel:{x:0,y:0,z:0},pitch:0,roll:0,yaw:0};
 const sim=createStructure(model.definitions,{profile,initialPose:pose});
 for(let i=0;i<600;i++)sim.step({brake:true});
 assert.equal(sim.events.length,0,id+' parked joints');
 assert.ok(sim.bodies.cabin.position.y>0,id+' parked above terrain');
 const flight=createStructure(model.definitions,{profile,initialPose:{...pose,pos:{x:0,y:500,z:0},vel:{x:0,y:0,z:profile.rotationSpeed*1.3}}});
 for(let i=0;i<600;i++)flight.step({throttle:.6});
 assert.equal(flight.events.length,0,id+' cruise joints');
 if(id!=='c172')for(const b of Object.values(flight.bodies)){const a=b.quaternion,c=flight.bodies.cabin.quaternion;assert.ok(Math.abs(a.x*c.x+a.y*c.y+a.z*c.z+a.w*c.w)>.99,id+' connected sections remain aligned');}
 assert.ok(flight.bodies.cabin.position.y>400,id+' cruise lift');
 flight.breakJoint(flight.joints.find(j=>j.id==='leftTip'));
 assert.equal(flight.attached('leftTip'),false);assert.equal(flight.attached('rightInner'),true);
 for(let i=0;i<240;i++)flight.step({throttle:.5,roll:.2});
 for(const b of Object.values(flight.bodies))assert.ok(Number.isFinite(b.position.y),id+' finite after damage');
 const departure=createStructure(model.definitions,{profile,initialPose:pose});
 let rotating=false;for(let i=0;i<7200;i++){rotating ||= departure.bodies.cabin.velocity.z>profile.rotationSpeed;departure.step({throttle:1,flaps:.33,pitch:rotating?.25:0});}
 assert.equal(departure.events.length,0,id+' departure joints');
 assert.ok(departure.bodies.cabin.position.y>profile.clearance+5,id+' takes off: '+JSON.stringify(departure.bodies.cabin.position));
 flight.step({gear:false});for(const [part,b] of Object.entries(flight.bodies))if(part.endsWith('Gear'))assert.equal(b.collisionResponse,false,id+' retracted collision');
 flight.breakJoint(flight.joints.find(j=>j.id==='leftGear'));flight.step({gear:false});assert.equal(flight.bodies.leftGear.collisionResponse,true,id+' detached gear collision');
 const powered=createStructure(model.definitions,{profile,initialPose:{...pose,pos:{x:0,y:500,z:0},vel:{x:0,y:0,z:0}}});
 const unpowered=createStructure(model.definitions,{profile,initialPose:{...pose,pos:{x:0,y:500,z:0},vel:{x:0,y:0,z:0}}});
 for(let i=0;i<120;i++){powered.step({throttle:1});unpowered.step({throttle:id==='c172'?0:1,engines:profile.engines.map(()=>0)});}
 assert.ok(powered.bodies.cabin.velocity.z>unpowered.bodies.cabin.velocity.z+.5,id+' working engines supply thrust');
 const wreck=createStructure(model.definitions,{profile,aero:false,initialPose:{...pose,pos:{x:0,y:profile.clearance+1,z:0},vel:{x:0,y:-6,z:30}}});
 for(const j of wreck.joints)wreck.breakJoint(j);
 for(let i=0;i<7200;i++)wreck.step();
 for(const [part,b] of Object.entries(wreck.bodies)){assert.ok(b.position.y>-1,id+' '+part+' above terrain');assert.ok(b.velocity.length()<1,id+' '+part+' settles');b.updateAABB();assert.ok(b.aabb.lowerBound.y>-.2,id+' '+part+' hull remains above ground');}
 console.log('PASS',id,'park, cruise, damage, departure, settling');
}
