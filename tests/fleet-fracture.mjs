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


 const make=(speed,surface='grass')=>createStructure(model.definitions,{profile,fragments:model.fragments,aero:false,surfaceType:()=>surface,initialPose:{pos:{x:0,y:profile.clearance+3,z:0},vel:{x:0,y:-speed,z:35},pitch:.15,roll:.1,yaw:0}});
 const hard=make(32);for(let i=0;i<3600;i++)hard.step();
 const shards=Object.values(hard.bodies).filter(b=>b.fragment);assert.ok(shards.length>=6,id+' severe crash has secondary breakup');assert.ok(shards.length<=18,id+' fragment budget');
 const active=Object.values(hard.bodies).filter(b=>!b.retired);
 assert.ok(Math.abs(active.reduce((n,b)=>n+b.mass,0)-profile.mass)<.001,id+' mass conserved');
 for(const b of active){assert.ok(Number.isFinite(b.position.y),id+' finite wreck');b.updateAABB();assert.ok(b.aabb.lowerBound.y>-.3,id+' wreck above terrain');assert.ok(b.velocity.length()<1,id+' wreck settles');}
 const gentle=make(1);for(let i=0;i<120;i++)gentle.step();assert.equal(Object.values(gentle.bodies).filter(b=>b.fragment).length,0,id+' gentle contact no fragmentation');
 console.log('PASS',id,'hard impact',shards.length,'shards, mass, ground support, settlement, gentle contact');
 if(id==='c172'){
  const skid=surface=>{const sim=createStructure(model.definitions,{profile,aero:false,surfaceType:()=>surface,initialPose:{pos:{x:0,y:profile.clearance+.1,z:0},vel:{x:0,y:-1,z:25},pitch:0,roll:0,yaw:0}});for(const j of sim.joints)sim.breakJoint(j);for(let i=0;i<120;i++)sim.step();assert.ok(sim.bodies.cabin.velocity.length()>5,'skid retains initial momentum');for(let i=0;i<2280;i++)sim.step();assert.ok(sim.bodies.cabin.velocity.length()<.5,'skid stops within 20 seconds');return sim.bodies.cabin.position.z;};
  const grass=skid('grass'),pavement=skid('pavement');assert.ok(grass<pavement*.8,'grass stops wreckage sooner');console.log('Skid distance:',grass.toFixed(1),'m grass;',pavement.toFixed(1),'m pavement');
 }
 model.dispose();
}
