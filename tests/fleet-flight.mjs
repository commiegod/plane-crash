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

 const sim=createStructure(model.definitions,{profile,initialPose:{pos:{x:0,y:2000,z:0},vel:{x:0,y:0,z:profile.cruiseSpeed},pitch:0,roll:0,yaw:0}});
 const cabin=sim.bodies.cabin,base={throttle:profile.cruiseThrottle,gear:false};
 function fly(seconds,inputs={}){for(let i=0;i<seconds*120;i++)sim.step({...base,...inputs});}
 function bank(){const right=cabin.vectorToWorldFrame({x:1,y:0,z:0}),up=cabin.vectorToWorldFrame({x:0,y:1,z:0});return Math.atan2(right.y,up.y);}
 fly(120);
 assert(!sim.stall.warning&&!sim.stall.stalled,id+' cruise has no false stall alert');
 assert.ok(Math.abs(cabin.position.y-2000)<85,id+' cruise altitude drift '+cabin.position.y);
 assert.ok(Math.abs(cabin.velocity.y)<.6,id+' sustained cruise sink/climb '+cabin.velocity.y);
 assert.ok(cabin.velocity.length()>profile.rotationSpeed,id+' adequate cruise speed');
 assert.ok(Math.abs(bank())<.08,id+' neutral wings level');
 console.log('PASS',id,'120s cruise',cabin.velocity.y.toFixed(2),'m/s vertical');
 fly(6,{roll:.55});const turnBank=bank();fly(25);
 assert.ok(turnBank<-.05,id+' right input banks right');assert.ok(Math.abs(bank())<.12,id+' release levels wings');
 let altitude=cabin.position.y;fly(12,{pitch:.12,throttle:1});
 assert.ok(cabin.position.y>altitude+5,id+' commanded climb');
 fly(45);altitude=cabin.position.y;fly(10,{pitch:-.06,throttle:profile.cruiseThrottle*.75});
 assert.ok(cabin.position.y<altitude-5,id+' commanded descent');
 fly(60);
 assert.equal(sim.events.length,0,id+' normal flight retains connections');
 assert.ok(Math.abs(cabin.velocity.y)<2,id+' settles after maneuvers '+cabin.velocity.y);
 console.log('PASS',id,'turn, release, climb, descent, return to cruise');
 const glide=createStructure(model.definitions,{profile,initialPose:{pos:{x:0,y:2000,z:0},vel:{x:0,y:0,z:profile.cruiseSpeed},pitch:0,roll:0,yaw:0}});
 for(let i=0;i<3600;i++)glide.step({throttle:0,gear:false,engines:profile.engines.map(()=>0)});
 assert.ok(glide.bodies.cabin.position.y<1950,id+' loss of power must descend, not auto-hover');
 assert.equal(glide.events.length,0,id+' engine-out glide retains the airframe');
 console.log('PASS',id,'unpowered glide loses altitude');
 model.dispose();
}
