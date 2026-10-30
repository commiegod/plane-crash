import * as T from '../assets/three.module.js';
import {GLTFLoader} from '../assets/GLTFLoader.js';
import {mergeGeometries} from '../assets/BufferGeometryUtils.js';
import {fleetProfile} from './fleet-profiles.js?v=stall-20261029';
import {PARTS} from './structure-physics.js';
// Mutually exclusive half-space partitions keep the original texture coordinates.
export function clipPolygon(poly,axis,cut,sign){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=(a[axis]-cut)*sign,db=(b[axis]-cut)*sign;if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push(a.map((x,k)=>x+(b[k]-x)*t));}}return out;}
export function partitionGeometry(geometry,planes){const g=geometry.index?geometry.toNonIndexed():geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,vertices=[],normals=[],tex=[];
 for(let i=0;i<p.count;i+=3){let poly=[];for(let j=i;j<i+3;j++)poly.push([p.getX(j),p.getY(j),p.getZ(j),n?.getX(j)||0,n?.getY(j)||0,n?.getZ(j)||0,uv?.getX(j)||0,uv?.getY(j)||0]);for(const [axis,cut,sign] of planes)poly=clipPolygon(poly,axis,cut,sign);for(let j=1;j<poly.length-1;j++)for(const a of [poly[0],poly[j],poly[j+1]]){vertices.push(...a.slice(0,3));normals.push(...a.slice(3,6));tex.push(...a.slice(6,8));}}
 if(g!==geometry)g.dispose();const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(vertices,3));out.setAttribute('normal',new T.Float32BufferAttribute(normals,3));out.setAttribute('uv',new T.Float32BufferAttribute(tex,2));return out;
}
export async function loadStructureModel(id='c172'){const profile=fleetProfile(id);const {scene:model}=await new GLTFLoader().loadAsync(new URL('../assets/'+profile.folder+'/'+profile.file+'.glb',import.meta.url).href);return buildStructureModel(model,profile);}
export function buildStructureModel(model,profile=fleetProfile()){profile={...profile};model.rotation.y=Math.PI/2;model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model);model.position.set(0,-profile.clearance-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);model.updateMatrixWorld(true);
 const groups=Object.fromEntries(Object.keys(PARTS).map(id=>[id,new T.Group()])),batches=new Map();
 model.traverse(o=>{if(!o.isMesh)return;const name=o.userData.name||o.name;if(/hotspot|FastProp|Propeller.Fast|courtesyon|BeaconOffX|^landinglight$|^taxilight$/i.test(name))return;
  if(profile.id==='twin'&&/Pick|Hotspot|Strobe|Beacon|Light1|Halo|PropDisc/.test(name))return;
  if(profile.id==='a320'&&/hud_|Sharklet|navglass.sharklet/i.test(name))return;
  const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);geo.computeBoundingBox();const center=geo.boundingBox.getCenter(new T.Vector3());
  const names=[name];let parent=o.parent;while(parent&&parent!==model){names.push(parent.userData.name||parent.name);parent=parent.parent;}
  const extent=geo.boundingBox.getSize(new T.Vector3());
  const wheel=names.some(n=>profile.gearPattern.test(n))&&Math.max(extent.x,extent.y,extent.z)<profile.clearance*2+2;
  const wheelId=(profile.id==='c172'||profile.id==='twin'||profile.id==='dc3')?
   (Math.abs(center.x)<profile.width*.45?'noseGear':center.x<0?'leftGear':'rightGear'):
   (center.z>profile.nose*.5&&Math.abs(center.x)<profile.width?'noseGear':center.x<0?'leftGear':'rightGear');
  const destinations=wheel?{[wheelId]:[]}:profile.regions;
  const mat=o.material;if(mat.map){mat.map.colorSpace=T.SRGBColorSpace;mat.map.anisotropy=2;}if(/glass|transparent/i.test(mat.name)){mat.transparent=true;mat.opacity=.15;mat.depthWrite=false;}
  for(const [id,planes] of Object.entries(destinations)){const part=partitionGeometry(geo,planes);if(!part.attributes.position.count){part.dispose();continue;}const key=id+':'+mat.uuid;if(!batches.has(key))batches.set(key,{id,mat,geos:[]});batches.get(key).geos.push(part);}geo.dispose();
 });
 for(const {id,mat,geos} of batches.values()){const merged=mergeGeometries(geos);const mesh=new T.Mesh(merged,mat);mesh.castShadow=mesh.receiveShadow=true;groups[id].add(mesh);for(const g of geos)g.dispose();}
 const definitions={};
 let cabinCenterZ=null;
 if(profile.id!=='c172'){
  const boxes=Object.fromEntries(Object.entries(groups).map(([id,g])=>[id,new T.Box3().setFromObject(g)]));
  const centerOfLift=['leftInner','leftTip','rightInner','rightTip'].reduce((sum,id)=>sum+boxes[id].getCenter(new T.Vector3()).z*PARTS[id].area,0)/16.2;
  const otherMoment=Object.entries(PARTS).filter(([id])=>id!=='cabin').reduce((sum,[id,p])=>sum+boxes[id].getCenter(new T.Vector3()).z*p.mass,0);
  const mainZ=(boxes.leftGear.getCenter(new T.Vector3()).z+boxes.rightGear.getCenter(new T.Vector3()).z)/2;
  const balanceZ=profile.id==='dc3'?Math.min(centerOfLift,mainZ-profile.width*.5):Math.max(centerOfLift,mainZ+profile.width*.65);
  profile.liftOffset=balanceZ-centerOfLift;
  cabinCenterZ=(balanceZ*1030-otherMoment)/PARTS.cabin.mass;
 }

 for(const [id,group] of Object.entries(groups)){if(!group.children.length)throw Error('Missing aircraft section: '+id);const box=new T.Box3().setFromObject(group),center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());const shapeCenter=center.clone();if(id==='cabin')center.z=profile.id==='c172'?1.7:cabinCenterZ;definitions[id]={shapeOffset:{x:shapeCenter.x-center.x,y:shapeCenter.y-center.y,z:shapeCenter.z-center.z},center:{x:center.x,y:center.y,z:center.z},half:[size.x/2,size.y/2,size.z/2],support:[]};if(profile.id!=='c172'){
   // Several tight hull slices follow taper and wing sweep instead of one empty box.
   const axis=/Inner|Tip/.test(id)?0:2,axisName=['x','y','z'][axis],count=id.endsWith('Gear')?1:4,colliders=[];
   for(let i=0;i<count;i++)for(let j=0;j<(/Inner|Tip/.test(id)?3:1);j++){
    const lo=box.min[axisName]+size[axisName]*i/count,hi=box.min[axisName]+size[axisName]*(i+1)/count,cell=new T.Box3();
    for(const mesh of group.children){const planes=[[axis,lo,1],[axis,hi,-1]];if(/Inner|Tip/.test(id))planes.push([2,box.min.z+size.z*j/3,1],[2,box.min.z+size.z*(j+1)/3,-1]);const clipped=partitionGeometry(mesh.geometry,planes);if(clipped.attributes.position.count){clipped.computeBoundingBox();cell.union(clipped.boundingBox);}clipped.dispose();}
    if(!cell.isEmpty()){const mid=cell.getCenter(new T.Vector3()).sub(center),extent=cell.getSize(new T.Vector3());colliders.push({offset:mid.toArray(),half:extent.toArray().map(n=>Math.max(.025,n/2))});}
   }
   definitions[id].colliders=colliders;
  }
  const extrema=new Map();for(const mesh of group.children){const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const point=[p.getX(i)-center.x,p.getY(i)-center.y,p.getZ(i)-center.z];const key=(point[0]>0?1:0)+(point[2]>0?2:0);if(!extrema.has(key)||point[1]<extrema.get(key)[1])extrema.set(key,point);}}definitions[id].support=[...extrema.values()];for(const mesh of group.children)mesh.geometry.translate(-center.x,-center.y,-center.z);
  // Recessed dark closures make the structural cuts readable after separation.
  if(/Inner|Tip/.test(id)){for(const x of [box.min.x+.015,box.max.x-.015]){const outward=id.startsWith('left')?x<center.x:x>center.x;if(id.endsWith('Tip')&&outward)continue;const cap=new T.Mesh(new T.BoxGeometry(.02,Math.min(.13,size.y),Math.min(1.4,size.z)),new T.MeshStandardMaterial({color:'#3c4448',roughness:.95}));cap.position.set(x-center.x,(profile.id==='c172'?.32:shapeCenter.y)-center.y,0);cap.userData.joint=id.endsWith('Inner')&&outward?id.replace('Inner','Tip'):id;cap.visible=false;group.add(cap);}}
 }
 // Prepare a bounded second fracture tier using the authored surfaces and UVs.
 const fragments={};
 for(const id of ['nose','tail','leftInner','leftTip','rightInner','rightTip']){
  const source=groups[id],box=new T.Box3();for(const mesh of source.children)if(!mesh.userData.joint){mesh.geometry.computeBoundingBox();box.union(mesh.geometry.boundingBox);}
  const size=box.getSize(new T.Vector3()),axis=/Inner|Tip/.test(id)?0:2,key=['x','y','z'][axis];fragments[id]=[];
  for(let i=0;i<3;i++){
   const group=new T.Group(),lo=box.min[key]+size[key]*i/3,hi=box.min[key]+size[key]*(i+1)/3;
   for(const mesh of source.children){if(mesh.userData.joint)continue;const geometry=partitionGeometry(mesh.geometry,[[axis,lo,1],[axis,hi,-1]]);if(!geometry.attributes.position.count){geometry.dispose();continue;}const shard=new T.Mesh(geometry,mesh.material);shard.castShadow=shard.receiveShadow=true;group.add(shard);}
   if(!group.children.length)continue;
   const bounds=new T.Box3().setFromObject(group),center=bounds.getCenter(new T.Vector3()),half=bounds.getSize(new T.Vector3()).multiplyScalar(.5);
   for(const mesh of group.children)mesh.geometry.translate(-center.x,-center.y,-center.z);
   const fragmentId=id+'Fragment'+i;group.userData.inactive=true;groups[fragmentId]=group;
   fragments[id].push({id:fragmentId,center:center.toArray(),half:half.toArray().map(n=>Math.max(.025,n))});
  }
 }
 function resetFractures(){for(const [id,group] of Object.entries(groups)){group.userData.retired=false;group.userData.inactive=id.includes('Fragment');}}
 let paint=null,disposed=false;
 const texturesOwned=new Set();for(const g of Object.values(groups))g.traverse(o=>{for(const value of Object.values(o.material||{}))if(value?.isTexture)texturesOwned.add(value);});
 function setPaint(id){
  if(!['a320','b737','dc10','b747','dc3','dc9'].includes(profile.id))return;
  const code=profile.id==='dc3'?'AFR':profile.id==='b747'?'KLM':profile.id==='dc10'?(id==='airfrance'?'AFR':id==='lufthansa'?'DLH':'AAL'):id==='american'?'AAL':profile.id==='b737'&&id==='united'?'UAL':'DAL';
  if(paint===code)return;paint=code;
  Promise.all((profile.id==='a320'?['fuselage','engine']:['fuselage']).map(slot=>new T.TextureLoader().loadAsync(`./assets/${profile.folder}/${code}-${slot}.webp`).then(t=>{t.colorSpace=T.SRGBColorSpace;t.flipY=false;t.anisotropy=2;return t;}))).then(textures=>{
   if(disposed||paint!==code){textures.forEach(t=>t.dispose());return;}
   textures.forEach(t=>texturesOwned.add(t));for(const g of Object.values(groups))g.traverse(o=>{const slot=o.material?.userData.paintSlot;if(slot){o.material.map=textures[slot==='engine'?1:0];o.material.needsUpdate=true;}});
  }).catch(e=>{paint=null;console.warn('Structural aircraft paint unavailable',e);});
 }
 function dispose(){disposed=true;const materials=new Set();for(const g of Object.values(groups))g.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material);});for(const m of materials)m.dispose();for(const t of texturesOwned)t.dispose();}
 return {groups,definitions,profile,fragments,resetFractures,setPaint,dispose};
}
