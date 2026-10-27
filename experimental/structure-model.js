import * as T from '../assets/three.module.js';
import {GLTFLoader} from '../assets/GLTFLoader.js';
import {mergeGeometries} from '../assets/BufferGeometryUtils.js';
import {PARTS} from './structure-physics.js';
// Mutually exclusive half-space partitions keep the original texture coordinates.
const regions={tail:[[2,-1.8,-1]],nose:[[2,2.65,1],[0,-1.1,1],[0,1.1,-1]],cabin:[[2,-1.8,1],[2,2.65,-1],[0,-1.1,1],[0,1.1,-1]],leftInner:[[2,-1.8,1],[0,-1.1,-1],[0,-3.4,1]],leftTip:[[2,-1.8,1],[0,-3.4,-1]],rightInner:[[2,-1.8,1],[0,1.1,1],[0,3.4,-1]],rightTip:[[2,-1.8,1],[0,3.4,1]]};
export function clipPolygon(poly,axis,cut,sign){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=(a[axis]-cut)*sign,db=(b[axis]-cut)*sign;if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push(a.map((x,k)=>x+(b[k]-x)*t));}}return out;}
export function partitionGeometry(geometry,planes){const g=geometry.index?geometry.toNonIndexed():geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,vertices=[],normals=[],tex=[];
 for(let i=0;i<p.count;i+=3){let poly=[];for(let j=i;j<i+3;j++)poly.push([p.getX(j),p.getY(j),p.getZ(j),n?.getX(j)||0,n?.getY(j)||0,n?.getZ(j)||0,uv?.getX(j)||0,uv?.getY(j)||0]);for(const [axis,cut,sign] of planes)poly=clipPolygon(poly,axis,cut,sign);for(let j=1;j<poly.length-1;j++)for(const a of [poly[0],poly[j],poly[j+1]]){vertices.push(...a.slice(0,3));normals.push(...a.slice(3,6));tex.push(...a.slice(6,8));}}
 if(g!==geometry)g.dispose();const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(vertices,3));out.setAttribute('normal',new T.Float32BufferAttribute(normals,3));out.setAttribute('uv',new T.Float32BufferAttribute(tex,2));return out;
}
export async function loadStructureModel(){const {scene:model}=await new GLTFLoader().loadAsync(new URL('../assets/c172p/c172p.glb',import.meta.url).href);return buildStructureModel(model);}
export function buildStructureModel(model){model.rotation.y=Math.PI/2;model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model);model.position.set(0,-1.5-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);model.updateMatrixWorld(true);
 const groups=Object.fromEntries(Object.keys(PARTS).map(id=>[id,new T.Group()])),batches=new Map();
 model.traverse(o=>{if(!o.isMesh)return;const name=o.userData.name||o.name;if(/hotspot|FastProp|Propeller.Fast|courtesyon|BeaconOffX|^landinglight$|^taxilight$/i.test(name))return;
  const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);geo.computeBoundingBox();const center=geo.boundingBox.getCenter(new T.Vector3());
  let wheel=/^(Left|Right|Nose)Wheel/.test(name);let parent=o.parent;while(parent&&parent!==model){wheel=wheel||/^(Left|Right|Nose)Wheel/.test(parent.userData.name||parent.name);parent=parent.parent;}
  const destinations=wheel?{[name.startsWith('Nose')?'noseGear':center.x<0?'leftGear':'rightGear']:[]}:regions;
  const mat=o.material;if(mat.map){mat.map.colorSpace=T.SRGBColorSpace;mat.map.anisotropy=2;}if(/glass|transparent/i.test(mat.name)){mat.transparent=true;mat.opacity=.15;mat.depthWrite=false;}
  for(const [id,planes] of Object.entries(destinations)){const part=partitionGeometry(geo,planes);if(!part.attributes.position.count){part.dispose();continue;}const key=id+':'+mat.uuid;if(!batches.has(key))batches.set(key,{id,mat,geos:[]});batches.get(key).geos.push(part);}geo.dispose();
 });
 for(const {id,mat,geos} of batches.values()){const merged=mergeGeometries(geos);const mesh=new T.Mesh(merged,mat);mesh.castShadow=mesh.receiveShadow=true;groups[id].add(mesh);for(const g of geos)g.dispose();}
 const definitions={};
 for(const [id,group] of Object.entries(groups)){if(!group.children.length)throw Error('Missing aircraft section: '+id);const box=new T.Box3().setFromObject(group),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());const shapeCenter=center.clone();if(id==='cabin')center.z=1.7;definitions[id]={shapeOffset:{x:shapeCenter.x-center.x,y:shapeCenter.y-center.y,z:shapeCenter.z-center.z},center:{x:center.x,y:center.y,z:center.z},half:[size.x/2,size.y/2,size.z/2],support:[]};const extrema=new Map();for(const mesh of group.children){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const point=[p.getX(i)-center.x,p.getY(i)-center.y,p.getZ(i)-center.z];const key=(point[0]>0?1:0)+(point[2]>0?2:0);if(!extrema.has(key)||point[1]<extrema.get(key)[1])extrema.set(key,point);}}definitions[id].support=[...extrema.values()];for(const mesh of group.children)mesh.geometry.translate(-center.x,-center.y,-center.z);
  // Recessed dark closures make the structural cuts readable after separation.
  if(/Inner|Tip/.test(id)){for(const x of [box.min.x+.015,box.max.x-.015]){const outward=id.startsWith('left')?x<center.x:x>center.x;if(id.endsWith('Tip')&&outward)continue;const cap=new T.Mesh(new T.BoxGeometry(.02,Math.min(.13,size.y),Math.min(1.4,size.z)),new T.MeshStandardMaterial({color:'#3c4448',roughness:.95}));cap.position.set(x-center.x,.32-center.y,0);cap.userData.joint=id.endsWith('Inner')&&outward?id.replace('Inner','Tip'):id;cap.visible=false;group.add(cap);}}
 }
 return {groups,definitions};
}
