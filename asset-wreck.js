import * as T from './assets/three.module.js';
// Cut the displayed mesh into the existing physics bodies, retaining its UVs and materials.
export function createAssetWreck(scene){
 const root=new T.Group();root.visible=false;scene.add(root);let last=null,objects=[];
 function clear(){root.traverse(o=>{if(o.isMesh)o.geometry.dispose()});root.clear();objects=[];last=null;root.visible=false;}
 function build(model,aircraftRoot,debris){
  clear();last=debris;aircraftRoot.updateMatrixWorld(true);const inverse=aircraftRoot.matrixWorld.clone().invert();
  const buckets=new Map(),representatives=new Map();for(const d of debris)if(!representatives.has(d.group))representatives.set(d.group,d);
  model.traverse(o=>{
   if(!o.isMesh||!o.visible)return;
   let parent=o.parent;while(parent&&parent!==model){if(!parent.visible)return;parent=parent.parent;}
   const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld));
   const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
   const clip=(polygon,axis,bound,sign)=>{if(polygon.every(v=>Math.abs(v[axis]-bound)<1e-7))return sign>0?polygon:[];const out=[];for(let k=0;k<polygon.length;k++){const a=polygon[k],b=polygon[(k+1)%polygon.length],da=sign*(a[axis]-bound),db=sign*(b[axis]-bound);if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push(a.map((v,j)=>v+(b[j]-v)*t));}}return out;};
   function emit(polygon,d){if(polygon.length<3)return;const key=d.group+':'+o.material.uuid;let b=buckets.get(key);if(!b){b={d,material:o.material,p:[],n:[],uv:[]};buckets.set(key,b)}for(let k=1;k<polygon.length-1;k++)for(const v of [polygon[0],polygon[k],polygon[k+1]]){b.p.push(v[0]-d.part.center.x,v[1]-d.part.center.y,v[2]-d.part.center.z);b.n.push(v[3],v[4],v[5]);b.uv.push(v[6],v[7]);}}
   for(let i=0;i<p.count;i+=3){
    const triangle=[];for(let j=i;j<i+3;j++)triangle.push([p.getX(j),p.getY(j),p.getZ(j),n?.getX(j)||0,n?.getY(j)||0,n?.getZ(j)||0,uv?.getX(j)||0,uv?.getY(j)||0]);
    if(representatives.size===3&&representatives.has(0)&&representatives.has(1)&&representatives.has(2)){
     // Clean major breaks: rear fuselage, wings, and forward cabin. Interpolate UVs at cuts.
     emit(clip(triangle,2,-1.7,-1),representatives.get(1));const front=clip(triangle,2,-1.7,1);
     emit(clip(front,0,-1,-1),representatives.get(2));emit(clip(front,0,1,1),representatives.get(2));emit(clip(clip(front,0,-1,1),0,1,-1),representatives.get(0));
    }else{
     const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3;let nearest=debris[0],distance=Infinity;
     for(const d of debris){const c=d.part.center,dd=(x-c.x)**2+(y-c.y)**2+(z-c.z)**2;if(dd<distance){distance=dd;nearest=d;}}emit(triangle,representatives.get(nearest.group));
    }
   }g.dispose();
  });
  for(const b of buckets.values()){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));if(b.n.length)g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));else g.computeVertexNormals();if(b.uv.length)g.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));const mesh=new T.Mesh(g,b.material);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);objects.push({mesh,d:b.d});}
 }
 return {clear,root,update(model,aircraftRoot,debris){if(!debris.length)return false;if(last!==debris)build(model,aircraftRoot,debris);root.visible=true;for(const {mesh,d} of objects){mesh.position.set(d.pos.x,d.pos.y,d.pos.z);mesh.rotation.set(-d.p,d.y,d.r,'YXZ');}return true;},hide(){root.visible=false;if(last)clear()}};
}
