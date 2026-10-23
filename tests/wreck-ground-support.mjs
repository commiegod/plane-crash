import assert from 'node:assert/strict';
import * as T from '../assets/three.module.js';
import {terrainMeshHeight,wreckSupportHeight} from '../crash-model.js';
import {createAssetWreck} from '../asset-wreck.js';
const ground=(x,z)=>10+30*Math.sin(x*.015)+20*Math.cos(z*.012);
// Explicit barycentric height from the same triangle as PlaneGeometry.
const x0=0,z0=0,u=.3,v=.2;
assert(Math.abs(terrainMeshHeight(18,12,ground)-(ground(0,0)+u*(ground(60,0)-ground(0,0))+v*(ground(0,60)-ground(0,0))))<1e-10);
const scene=new T.Scene(),root=new T.Group(),model=new T.Group();scene.add(root);root.add(model);model.add(new T.Mesh(new T.BoxGeometry(18,4,30),new T.MeshStandardMaterial()));
for(const groundFn of [()=>10,ground])for(const roll of [0,.65,1.8]){
 const body={center:{x:0,y:0,z:0},pos:{x:10,y:-20,z:10},p:.3,r:roll,y:.4,rest:true};
 const d={group:0,part:{center:{x:0,y:0,z:0}},pos:{...body.pos},p:body.p,r:body.r,y:body.y,body};const wreck=createAssetWreck(scene,undefined,groundFn);
 wreck.update(model,root,[d],{});assert(body.support.length>0);assert(body.pos.y>=wreckSupportHeight(body.support,body.pos,body.p,body.r,body.y,groundFn)-1e-8);
 wreck.root.updateMatrixWorld(true);wreck.root.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const point=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);assert(point.y>=terrainMeshHeight(point.x,point.z,groundFn)-1e-5,'rendered vertex above terrain');}});
 const height=body.pos.y;wreck.update(model,root,[d],{});assert(Math.abs(body.pos.y-height)<1e-8,'resting wreck does not drift upward');wreck.hide();scene.remove(wreck.root);
}
console.log('PASS rendered triangle height, authored collision bounds, rolled/slope wrecks, no buried vertices, and stable rest');
const {createWingBreakup}=await import('../wing-breakup.js');
const wingScene=new T.Scene(),wingRoot=new T.Group(),wingModel=new T.Group();wingScene.add(wingRoot);wingRoot.add(wingModel);wingModel.add(new T.Mesh(new T.BoxGeometry(11,.5,2),new T.MeshStandardMaterial()));
const piece={side:1,cut:4,center:{x:4.75,y:0,z:0},pos:{x:20,y:-10,z:20},p:.3,r:.6,y:.2,rest:true};const breakup=createWingBreakup(wingScene,ground);breakup.update(wingModel,wingRoot,{aircraft:'c172',wingDamage:{right:.28},wingDebris:[piece]});assert(piece.support.length>0);assert(piece.pos.y>=wreckSupportHeight(piece.support,piece.pos,piece.p,piece.r,piece.y,ground)-1e-8);breakup.reset();
console.log('PASS detached authored wing receives terrain support before first draw');
