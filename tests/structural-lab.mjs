import fs from 'node:fs';
import assert from 'node:assert/strict';
import {GLTFLoader} from '../assets/GLTFLoader.js';
import {buildStructureModel} from '../experimental/structure-model.js';
import {createStructure,STEP} from '../experimental/structure-physics.js';
// Load the exact aircraft geometry without browser-only texture decoding.
globalThis.ProgressEvent=class{constructor(type,props){Object.assign(this,{type},props);}};
const raw=fs.readFileSync(new URL('../assets/c172p/c172p.glb',import.meta.url)),jsonLength=raw.readUInt32LE(12),json=JSON.parse(raw.subarray(20,20+jsonLength).toString()),binStart=20+jsonLength+8;
json.buffers[0].uri='data:application/octet-stream;base64,'+raw.subarray(binStart).toString('base64');json.images=[];json.textures=[];json.materials=json.materials.map(m=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:[1,1,1,1]}}));
const gltf=await new GLTFLoader().parseAsync(JSON.stringify(json),'');const model=buildStructureModel(gltf.scene);
fs.writeFileSync('/tmp/cessna-structure-definitions.json',JSON.stringify(model.definitions,null,2));
for(const [id,g] of Object.entries(model.groups)){assert(g.children.length,id);g.traverse(o=>{if(o.isMesh){assert(o.geometry.attributes.position.array.every(Number.isFinite));}});}

const defs=model.definitions;
function run(scenario,seconds,input={},hz=120){const sim=createStructure(defs,{scenario});for(let i=0;i<seconds*hz;i++)sim.advance(1/hz,typeof input==='function'?input(i/hz):input);return sim;}
const cruise=run('flight',15,{throttle:.65});assert.equal(cruise.events.length,0,'normal flight must retain all joints');assert(cruise.bodies.cabin.position.y>50,'trimmed flight stays aloft');
const parked=run('runway',10);assert.equal(parked.events.length,0);assert(parked.bodies.cabin.velocity.length()<.15);
const takeoff=run('runway',20,t=>({throttle:1,pitch:t>12.5?.7:0}));assert(takeoff.bodies.cabin.position.y>3,'takeoff');assert.equal(takeoff.events.length,0);
const wing=run('wing',.65,{throttle:.65});assert.equal(wing.events[0]?.id,'leftTip','struck tip breaks first');assert(wing.attached('leftInner')&&wing.attached('rightInner')&&wing.attached('tail'),'major sections remain connected');assert(!wing.attached('leftTip'));
const transfer=createStructure(defs,{aero:false});transfer.world.gravity.set(0,0,0);const before=transfer.bodies.cabin.velocity.x;transfer.bodies.leftTip.applyImpulse({x:15,y:0,z:0});for(let i=0;i<12;i++)transfer.step();assert(transfer.bodies.cabin.velocity.x>before+.005,'tip impulse transfers into cabin through joints');assert.equal(transfer.events.length,0);
const hard=run('gear',2);assert(hard.events.some(e=>e.id.endsWith('Gear')),'hard landing fails a wheel connection');assert(hard.attached('cabin')&&hard.attached('leftInner')&&hard.attached('rightInner'));
const skim=run('belly',.5);assert(skim.bodies.cabin.velocity.z>15,'skid must not stop instantly');
const settled=run('belly',60);assert(settled.bodies.cabin.velocity.length()<.3,'friction settles the cabin');assert.equal(settled.events.length,3,'belly skid does not require full breakup');
for(const [id,b] of Object.entries(settled.bodies)){assert([b.position.x,b.position.y,b.position.z,b.velocity.length()].every(Number.isFinite));b.updateAABB();assert(b.aabb.lowerBound.y>-.12,id+' collision shape stays above ground');}
for(const hz of [30,60]){const other=run('wing',3,{throttle:.65},hz),reference=run('wing',3,{throttle:.65});assert.deepEqual(other.events,reference.events);assert(other.bodies.cabin.position.distanceTo(reference.bodies.cabin.position)<1e-7,'fixed step consistency '+hz);}
function controlled(roll){const s=createStructure(defs);s.breakJoint(s.joints.find(j=>j.id==='leftTip'),'test separation');for(let i=0;i<240;i++)s.step({throttle:.65,roll});return s;}
const left=controlled(-.3),right=controlled(.3);assert(right.bodies.cabin.position.x>left.bodies.cabin.position.x+.5,'roll input still changes trajectory after tip loss');
const restart=createStructure(defs);assert.equal(restart.events.length,0);assert(restart.joints.every(j=>!j.broken));
console.log('PASS actual Cessna mesh partition, intact cruise, parked stability, takeoff, localized wing strike, joint force transfer, hard-landing gear failure, momentum and settling, 30/60/120 Hz consistency, post-damage control, fresh restart');
