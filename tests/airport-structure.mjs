import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as C from '../assets/cannon-es.js';
import {installAirport,startAirportStructure} from '../airport-structure.js';
import {terrainMeshHeight} from '../crash-model.js';
import {definitions as defs} from './structure-fixture.mjs';
const model=()=>({definitions:defs,groups:Object.fromEntries(Object.keys(defs).map(id=>[id,{position:{copy(){}},quaternion:{copy(){}},children:[]}]))});
const ground=(x,z)=>10+Math.sin(x*.002)*15+Math.cos(z*.003)*10;
const world=new C.World(),env=installAirport(world,new C.Material(),ground);for(const b of world.bodies)b.updateAABB();
for(const [x,z] of [[5,9],[41,52],[-400,190],[1201,-701]]){const hit=new C.RaycastResult();assert(world.raycastClosest(new C.Vec3(x,1000,z),new C.Vec3(x,-100,z),{},hit));assert(Math.abs(hit.hitPointWorld.y-terrainMeshHeight(x,z,ground))<1e-5,'terrain triangle alignment');}
function start(pos,vel={x:0,y:0,z:0},yaw=0){return startAirportStructure(model(),()=>10,{pos,vel,pitch:0,roll:0,yaw});}
const park=start({x:0,y:11.55,z:100});for(let i=0;i<600;i++)park.update(1/60,{brake:true});assert.equal(park.sim.events.length,0,'parking intact');assert(park.sim.bodies.cabin.velocity.length()<.2);
const taxi=start({x:-65,y:11.55,z:500},{x:0,y:0,z:8});for(let i=0;i<180;i++)taxi.update(1/60,{});assert.equal(taxi.sim.events.length,0,'level grass safe');
const impact=start({x:785,y:32,z:1100},{x:40,y:0,z:0},Math.PI/2);let hits=[];for(let i=0;i<180;i++)hits.push(...impact.update(1/60,{throttle:.5}).hits);assert(hits.some(h=>h.surface==='building'),'building has collision');assert(impact.sim.events.length>0,'building hit breaks local joints');assert(impact.sim.bodies.cabin.position.x<887,'terminal stops penetration');
const pose=start({x:12,y:90,z:54},{x:0,y:0,z:-35},Math.PI);const result=pose.update(0,{});assert(Math.abs(result.pos.x-12)<1e-7&&Math.abs(result.pos.z-54)<1e-7,'pose COM preserved');
console.log('PASS airport terrain triangles, parking, grass taxi, building impact, rotated spawn');
