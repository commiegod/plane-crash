import * as T from './assets/three.module.js';
import {wreckSupportHeight} from './crash-model.js?v=groundfix-20261022';
export function geometrySupport(geometry,offset={x:0,y:0,z:0}){
 // Keep actual surface vertices, not empty corners of a large bounding box.
 const cells=new Map(),p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){const v={x:p.getX(i)+offset.x,y:p.getY(i)+offset.y,z:p.getZ(i)+offset.z},key=Math.floor(v.x*2)+':'+Math.floor(v.z*2);const cell=cells.get(key);if(!cell)cells.set(key,{lo:v,hi:v});else{if(v.y<cell.lo.y)cell.lo=v;if(v.y>cell.hi.y)cell.hi=v;}}
 return [...cells.values()].flatMap(c=>c.lo===c.hi?[c.lo]:[c.lo,c.hi]);
}
export function groupSupport(group){group.updateMatrixWorld(true);const points=[];group.traverse(o=>{if(!o.isMesh)return;const matrix=new T.Matrix4().multiplyMatrices(group.matrixWorld.clone().invert(),o.matrixWorld);for(const p of geometrySupport(o.geometry)){const v=new T.Vector3(p.x,p.y,p.z).applyMatrix4(matrix);points.push({x:v.x,y:v.y,z:v.z});}});return points;}
const settledChecks=new WeakMap();
export function liftAboveGround(body,ground){if(!ground)return 0;const key=[body.pos.x,body.pos.y,body.pos.z,body.p,body.r,body.y].join(',');const cached=settledChecks.get(body);if(body.rest&&cached?.key===key&&cached.support===body.support)return 0;const floor=wreckSupportHeight(body.support||[],body.pos,body.p,body.r,body.y,ground),lift=Math.max(0,floor-body.pos.y);body.pos.y+=lift;settledChecks.set(body,{support:body.support,key:[body.pos.x,body.pos.y,body.pos.z,body.p,body.r,body.y].join(',')});return lift;}
