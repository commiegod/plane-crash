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

 for(const speedFactor of [1.3,2]){
 const sim=createStructure(model.definitions,{profile,initialPose:{pos:{x:0,y:10000,z:0},vel:{x:0,y:0,z:profile.rotationSpeed*speedFactor},pitch:0,roll:0,yaw:0}});
 let peak=0;
 for(let i=0;i<3600;i++){const t=i/120;sim.step({throttle:.6,roll:t<2?0:Math.sin(t*1.3)>0?1:-1,pitch:t<2?0:Math.sin(t*.7)>.5?.6:-.15,gear:false});peak=Math.max(peak,sim.bodies.cabin.angularVelocity.length());}
 assert.equal(sim.events.length,0,id+' steering must not break the airframe at '+speedFactor+'x rotation speed');
 assert.ok(peak<1,id+' excessive turn rate: '+peak);assert.ok(peak>.05,id+' controls still respond');
 console.log('PASS',id,speedFactor,'peak angular speed',peak.toFixed(2),'rad/s, no breakage');
 }
 const impact=createStructure(model.definitions,{profile,initialPose:{pos:{x:0,y:profile.clearance+3,z:0},vel:{x:0,y:-30,z:profile.rotationSpeed},pitch:.2,roll:.2,yaw:0}});
 for(let i=0;i<360;i++)impact.step({throttle:0});
 assert.ok(impact.events.length>0,id+' hard ground impact still breaks connections');
 console.log('PASS',id,'hard impact causes structural damage');
 model.dispose();
}
