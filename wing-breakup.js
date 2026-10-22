import * as T from './assets/three.module.js';
// Split authored triangles at an aircraft-local span station, retaining paint UVs.
export function splitWingGeometry(source,matrix,side,cut){
 const g=(source.index?source.toNonIndexed():source.clone()).applyMatrix4(matrix),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
 const kept=[],lost=[];
 const clip=(polygon,sign)=>{const out=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],da=(side*a[0]-cut)*sign,db=(side*b[0]-cut)*sign;if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push(a.map((v,j)=>v+(b[j]-v)*t));}}return out;};
 const emit=(poly,out)=>{for(let i=1;i<poly.length-1;i++)out.push(...poly[0],...poly[i],...poly[i+1]);};
 for(let i=0;i<p.count;i+=3){const triangle=[];for(let j=i;j<i+3;j++)triangle.push([p.getX(j),p.getY(j),p.getZ(j),n?.getX(j)??0,n?.getY(j)??1,n?.getZ(j)??0,uv?.getX(j)||0,uv?.getY(j)||0]);if(triangle.every(v=>Math.abs(side*v[0]-cut)<1e-7))emit(triangle,kept);else{emit(clip(triangle,-1),kept);emit(clip(triangle,1),lost);}}
 g.dispose();const make=data=>{const geo=new T.BufferGeometry(),v=[],normal=[],tex=[];for(let i=0;i<data.length;i+=8){v.push(...data.slice(i,i+3));normal.push(...data.slice(i+3,i+6));tex.push(...data.slice(i+6,i+8));}geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normal,3));geo.setAttribute('uv',new T.Float32BufferAttribute(tex,2));return geo;};
 return {kept:make(kept).applyMatrix4(matrix.clone().invert()),lost:make(lost)};
}
export function createWingBreakup(scene){
 let flight=null;const originals=new Map(),fragments=new Map();
 function reset(){for(const [mesh,g] of originals){if(mesh.geometry!==g)mesh.geometry.dispose();mesh.geometry=g;}originals.clear();for(const group of fragments.values()){group.traverse(o=>{if(o.isMesh)o.geometry.dispose()});scene.remove(group);}fragments.clear();}
 return {update(model,root,s){
 if(flight!==s.wingDamage){reset();flight=s.wingDamage;}if(!flight)return;
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert();
 for(const d of s.wingDebris||[]){if(!fragments.has(d)){const group=new T.Group();model.traverse(o=>{if(!o.isMesh||!o.visible)return;let parent=o.parent;while(parent&&parent!==model){if(!parent.visible)return;parent=parent.parent;}
 const matrix=new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld);const bounds=new T.Box3().setFromBufferAttribute(o.geometry.attributes.position).applyMatrix4(matrix);if((d.side>0?bounds.max.x:-bounds.min.x)<=d.cut)return;
 const split=splitWingGeometry(o.geometry,matrix,d.side,d.cut);if(!originals.has(o))originals.set(o,o.geometry);else if(o.geometry!==originals.get(o))o.geometry.dispose();o.geometry=split.kept;
 split.lost.translate(-d.center.x,-d.center.y,-d.center.z);const mesh=new T.Mesh(split.lost,o.material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);});scene.add(group);fragments.set(d,group);}
 const group=fragments.get(d);group.position.set(d.pos.x,d.pos.y,d.pos.z);group.rotation.set(-d.p,d.y,d.r,'YXZ');}
 },reset};
}
