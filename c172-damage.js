import * as T from './assets/three.module.js';
// Deterministic, bounded visual damage. Physics and licensed source assets stay unchanged.
export function tearEdge(geometry,matrix,side,cut){
 const p=geometry.attributes.position,inv=matrix.clone().invert(),v=new T.Vector3(),seam=[];
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);if(Math.abs(side*v.x-cut)<.001){v.x+=side*(.055*Math.sin(v.z*39)+.025*Math.sin(v.z*83));v.y+=.022*Math.sin(v.z*57);seam.push(v.clone());v.applyMatrix4(inv);p.setXYZ(i,v.x,v.y,v.z);}}
 geometry.computeVertexNormals();return seam;
}
export function exposedWing(seam,side,cut){
 const group=new T.Group();group.userData.damageStructure=true;if(seam.length<3)return group;
 const low=Math.min(...seam.map(p=>p.z)),high=Math.max(...seam.map(p=>p.z));
 const y0=Math.min(...seam.map(p=>p.y)),y1=Math.max(...seam.map(p=>p.y));
 if(high-low<.05||y1-y0<.015)return group;
 const metal=new T.MeshStandardMaterial({color:0x9ca7a5,metalness:.6,roughness:.72,side:T.DoubleSide});
 const dark=new T.MeshStandardMaterial({color:0x242b29,roughness:1,side:T.DoubleSide});
 // Thin recessed rib, with the actual airfoil cross-section traced from cut vertices.
 const points=seam.map(p=>new T.Vector2(p.z,p.y)).sort((a,b)=>a.x-b.x||a.y-b.y);
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 const hull=[];for(const p of points){while(hull.length>1&&cross(hull.at(-2),hull.at(-1),p)<=0)hull.pop();hull.push(p);}const lower=hull.length;for(let i=points.length-2;i>=0;i--){const p=points[i];while(hull.length>lower&&cross(hull.at(-2),hull.at(-1),p)<=0)hull.pop();hull.push(p);}hull.pop();
 if(hull.length>=3){const shape=new T.Shape(hull),geo=new T.ShapeGeometry(shape);const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setXYZ(i,side*(cut-.035),p.getY(i),p.getX(i));geo.computeVertexNormals();group.add(new T.Mesh(geo,dark));}
 for(const f of [.25,.68]){const spar=new T.Mesh(new T.BoxGeometry(.22,Math.max(.04,(y1-y0)*.6),.045),metal);spar.position.set(side*cut,(y0+y1)/2,low+(high-low)*f);group.add(spar);}
 group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.damageStructure=true;}});return group;
}
export function deformCessnaVertex(x,y,z,name,damage){
 if(damage?.gearCollapsed&&/^(Left|Right|Nose)Wheel/.test(name)){
  const t=Math.max(0,Math.min(1,(.05-y)/1.5)),side=name.startsWith('Nose')?0:Math.sign(x);
  x+=side*.55*t*t;y+=.62*t*t;z-=(side?.18:.65)*t*t;
 }
 if(damage?.noseImpact&&/fuselage_cowling/.test(name)){
  const severity=Math.max(0,Math.min(1,damage.severity||0)),dent=Math.exp(-((x-.18)**2/.35+(z-2.25)**2/.65));
  y-=dent*.3*severity;z-=dent*.18*severity;
 }
 return [x,y,z];
}
