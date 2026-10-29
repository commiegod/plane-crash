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

 const sim=createStructure(model.definitions,{profile,initialPose:{pos:{x:0,y:3000,z:0},vel:{x:0,y:0,z:profile.rotationSpeed*.9},pitch:.55,roll:0,yaw:0}});
 let peak=0,warning=false;
 for(let i=0;i<240;i++){sim.step({throttle:.25,pitch:.8,gear:false});peak=Math.max(peak,sim.stall.severity);warning||=sim.stall.warning;}
 console.log(id,'stall',peak.toFixed(2),'vy',sim.bodies.cabin.velocity.y.toFixed(1));
 assert(warning,id+' warning');assert(peak>.1,id+' develops stall');
 for(let i=0;i<480;i++)sim.step({throttle:1,pitch:-.18,gear:false});
 for(let i=0;i<4800;i++)sim.step({throttle:profile.cruiseThrottle,gear:false});
 console.log(id,'recovered',sim.stall.severity.toFixed(3),'speed',sim.bodies.cabin.velocity.length().toFixed(1),'vy',sim.bodies.cabin.velocity.y.toFixed(1),'events',sim.events.length);
 assert(!sim.stall.stalled,id+' recovers after lowering nose');
 assert(sim.bodies.cabin.velocity.length()>profile.rotationSpeed*.95,id+' regains flying speed');
 assert.equal(sim.events.length,0,id+' stall itself does not break airframe');
 const climb=createStructure(model.definitions,{profile,initialPose:{pos:{x:0,y:3000,z:0},vel:{x:0,y:0,z:profile.cruiseSpeed},pitch:0,roll:0,yaw:0}});
 let climbStall=0,warnAt=null,stallAt=null;
 for(let i=0;i<2400;i++){climb.step({throttle:1,pitch:1,gear:false});climbStall=Math.max(climbStall,climb.stall.severity);if(climb.stall.warning&&warnAt===null)warnAt=i;if(climb.stall.stalled&&stallAt===null)stallAt=i;}
 console.log(id,'sustained pull-up severity',climbStall.toFixed(2),'warning frame',warnAt,'stall frame',stallAt);
 assert(climbStall>.1,id+' sustained pull-up can stall even at full power');
 assert(warnAt!==null&&warnAt<stallAt,id+' warns before sustained pull-up stall');
 assert.equal(climb.events.length,0,id+' pull-up stall does not cause spontaneous breakup');
 model.dispose();
}
