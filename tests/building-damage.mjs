import assert from 'node:assert/strict';
import * as T from '../assets/three.module.js';
import {createAirportDamage} from '../airport-damage.js';
const scene=new T.Scene(),damage=createAirportDamage(scene,()=>10,48),mat=new T.MeshStandardMaterial(),mesh=new T.InstancedMesh(new T.BoxGeometry(),mat,10),d=new T.Object3D();
for(let i=0;i<10;i++){const p=[0,20,i*8];d.position.set(...p);d.scale.set(2,10,6);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);damage.register(mesh,i,[2,10,6],p,mat);}
const original=Array.from(mesh.instanceMatrix.array),s={state:'flight',systems:{},scrape:{x:-1,y:20,z:0,nx:-1,nz:0,speed:70,normalSpeed:3}};
damage.update(s,1/60);assert.equal(damage.rubble.count,3);assert.deepEqual(Array.from(mesh.instanceMatrix.array),original,'scrape must not remove any structure');
const color=new T.Color();mesh.getColorAt(0,color);assert(color.r<1,'local scuff');mesh.getColorAt(9,color);assert.equal(color.r,1,'distant wall untouched');
s.state='paused';s.saved='flight';const paused=Array.from(damage.rubble.instanceMatrix.array);damage.update(s,1);assert.deepEqual(Array.from(damage.rubble.instanceMatrix.array),paused);
s.state='flight';s.scrape=null;for(let i=0;i<900;i++)damage.update(s,1/60);const rested=Array.from(damage.rubble.instanceMatrix.array);damage.update(s,1);assert.deepEqual(Array.from(damage.rubble.instanceMatrix.array),rested);
s.systems={};damage.update(s,0);assert.equal(damage.rubble.count,0);mesh.getColorAt(0,color);assert.equal(color.r,1);
function impact(severity,speed){damage.reset();Object.assign(s,{state:'crashed',impactPos:{x:-40,y:20,z:0},impact:speed,debris:[],crashCause:'BUILDING COLLISION',crashProfile:{severity,contactPoint:{x:-1,y:20,z:0}}});damage.update(s,1/60);const m=new T.Matrix4();let removed=0;for(let i=0;i<10;i++){mesh.getMatrixAt(i,m);if(m.determinant()===0)removed++;}return removed;}
assert.equal(impact(.2,150),0,'light damage cannot remove walls');const moderate=impact(.35,40);assert(moderate>0&&moderate<5);assert.equal(impact(.35,150),moderate,'tangential speed must not enlarge damage');assert(impact(.9,100)>moderate);assert(damage.rubble.count<=48);
s.state='ready';damage.update(s,0);assert.deepEqual(Array.from(mesh.instanceMatrix.array),original);
console.log('PASS scrape chips without structural removal, scuff restoration, pause, settling, contact-point damage, severity scaling and bounded rubble');
