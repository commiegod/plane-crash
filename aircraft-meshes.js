// Distinct procedural airframes. All coordinates are meters in aircraft space (+Z nose).
export function createFleetMeshes(a){
 const v=a.visual,L=v.length,R=v.radius,S=v.span/2,tail=-L*.4;
 const result=[],point=(x,y,z)=>({x,y,z});
 function add(kind,verts,faces,extra={}){result.push({kind,verts,faces,color:[210,216,221],...extra})}
 function hull(kind,rings,extra={}){const verts=[],faces=[],N=32;for(const [z,r,y=0] of rings)for(let i=0;i<N;i++){const t=i/N*Math.PI*2;verts.push(point(Math.cos(t)*r,Math.sin(t)*r+y,z))}for(let j=0;j<rings.length-1;j++)for(let i=0;i<N;i++)faces.push([j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i]);faces.push(Array.from({length:N},(_,i)=>N-1-i));faces.push(Array.from({length:N},(_,i)=>(rings.length-1)*N+i));add(kind,verts,faces,extra)}
 hull('fuselage',[[-L*.27,R],[L*.23,R],[L*.34,R*.92],[L*.42,R*.6],[L*.5,R*.07]]);
 hull('aft',[[-L*.5,.05,R*.3],[-L*.4,R*.45,R*.2],[-L*.27,R]]);
 function slab(kind,outline,thickness,extra={}){const verts=[...outline,...outline.map(p=>kind==='fin'?point(p.x-thickness,p.y,p.z):point(p.x,p.y-thickness,p.z))],n=outline.length,faces=[Array.from({length:n},(_,i)=>i),Array.from({length:n},(_,i)=>2*n-i-1)];for(let i=0;i<n;i++)faces.push([i,(i+1)%n,(i+1)%n+n,i+n]);add(kind,verts,faces,extra)}
 for(const side of [-1,1]){
 const chord=L*.17;slab('wing',[point(side*R*.7,v.wingY,chord*.65),point(side*S,v.wingY+.35,-v.sweep+chord*.25),point(side*S,v.wingY+.35,-v.sweep-chord*.12),point(side*R*.7,v.wingY,-chord*.65)],.13);
 slab('tail',[point(side*.3,v.tailWingY,tail+L*.07),point(side*S*.32,v.tailWingY+.15,tail-.3),point(side*S*.32,v.tailWingY+.15,tail-L*.06),point(side*.3,v.tailWingY,tail-L*.06)],.1);
 if(v.winglets)slab('winglet',[point(side*S,v.wingY+.35,-v.sweep+chord*.25),point(side*(S+.25),v.wingY+v.winglets,-v.sweep-chord*.1),point(side*(S+.25),v.wingY+v.winglets,-v.sweep-chord*.25),point(side*S,v.wingY+.35,-v.sweep-chord*.12)],.07);
 }
 slab('fin',[point(0,0,tail+L*.12),point(0,v.tailHeight,tail-L*.015),point(0,v.tailHeight,tail-L*.085),point(0,0,tail-L*.09)],.12);
 for(const [i,e] of a.engines.entries()){const {x,y,z}=e.position,r=v.engineRadius;hull('engine',[[z-1.4,r*.65,y],[z-1,r,y],[z+1,r,y],[z+1.3,r*.86,y]].map(([zz,rr,yy])=>[zz,rr,yy]),{engine:i});const item=result[result.length-1];item.verts.forEach(p=>p.x+=x)}
 return result;
}
