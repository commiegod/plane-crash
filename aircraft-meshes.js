// Loft stations: longitudinal fraction, width, center height, vertical aspect.
const NOSES={
 c172:[[.08,1,.05,1.12],[.19,.91,.03,1.1],[.27,.73,-.1,.85],[.39,.63,-.16,.78],[.5,.25,-.17,.72]],
 dc3:[[.12,1,0,1],[.25,.97,.03,1],[.34,.85,-.04,.94],[.43,.55,-.12,.85],[.5,.025,-.19,.7]],
 a320:[[.16,1,0,1],[.34,.99,0,1],[.405,.9,-.025,.97],[.465,.58,-.08,.88],[.5,.02,-.2,.8]],
 b737:[[.16,1,0,1],[.33,.99,0,1],[.4,.88,-.025,.95],[.465,.49,-.09,.84],[.5,.02,-.18,.8]],
 dc9:[[.16,1,0,1],[.33,.99,0,1],[.405,.86,-.03,.96],[.465,.5,-.09,.86],[.5,.02,-.24,.7]],
 g650:[[.1,1,0,1],[.23,.95,0,.98],[.32,.76,-.05,.94],[.43,.32,-.19,.79],[.5,.02,-.24,.7]],
 c130:[[.1,1,0,1.05],[.26,.96,.01,1.07],[.36,.83,-.03,1.0],[.44,.58,-.16,.85],[.5,.08,-.3,.7]]
};
export function airframeSection(a,z){const v=a.visual,f=z/v.length,stations=[[-.27,1,0,1],...(NOSES[a.id]||NOSES.a320)];let k=1;while(k<stations.length-1&&f>stations[k][0])k++;const lo=stations[k-1],hi=stations[k],t=Math.max(0,Math.min(1,(f-lo[0])/(hi[0]-lo[0]))),u=t*t*(3-2*t);return {r:v.radius*(lo[1]+(hi[1]-lo[1])*u),y:v.radius*(lo[2]+(hi[2]-lo[2])*u),aspect:lo[3]+(hi[3]-lo[3])*u};}
// Distinct procedural airframes. All coordinates are meters in aircraft space (+Z nose).
export function createFleetMeshes(a){
 const v=a.visual,L=v.length,R=v.radius,S=v.span/2,tail=-L*.4;
 const result=[],point=(x,y,z)=>({x,y,z});
 function add(kind,verts,faces,extra={}){result.push({kind,verts,faces,color:[210,216,221],...extra})}
 function hull(kind,rings,extra={}){const verts=[],faces=[],N=32;for(const [z,r,y=0,aspect=1] of rings)for(let i=0;i<N;i++){const t=i/N*Math.PI*2;verts.push(point(Math.cos(t)*r,Math.sin(t)*r*aspect+y,z))}for(let j=0;j<rings.length-1;j++)for(let i=0;i<N;i++)faces.push([j*N+i,j*N+(i+1)%N,(j+1)*N+(i+1)%N,(j+1)*N+i]);faces.push(Array.from({length:N},(_,i)=>N-1-i));faces.push(Array.from({length:N},(_,i)=>(rings.length-1)*N+i));add(kind,verts,faces,extra)}
 const rings=[];for(let j=0;j<=64;j++){const z=-L*.27+j/64*L*.77,p=airframeSection(a,z);rings.push([z,p.r,p.y,p.aspect]);}hull('fuselage',rings);
 hull('aft',[[-L*.5,.04,R*.38],[-L*.47,R*.19,R*.32],[-L*.42,R*.43,R*.23],[-L*.36,R*.72,R*.1],[-L*.31,R*.93,R*.025],[-L*.27,R]]);
 function slab(kind,outline,thickness,extra={}){const verts=[...outline,...outline.map(p=>kind==='fin'?point(p.x-thickness,p.y,p.z):point(p.x,p.y-thickness,p.z))],n=outline.length,faces=[Array.from({length:n},(_,i)=>i),Array.from({length:n},(_,i)=>2*n-i-1)];for(let i=0;i<n;i++)faces.push([i,(i+1)%n,(i+1)%n+n,i+n]);add(kind,verts,faces,extra)}
 for(const side of [-1,1]){
 const chord=L*.17,verts=[],faces=[],rows=12,cols=24;
 for(let j=0;j<=rows;j++){const f=j/rows,x=side*(R*.7+(S-R*.7)*f),lead=a.id==='c172'?chord*.65:chord*.65*(1-f)+(-v.sweep+chord*.25)*f,c=chord*(a.id==='c172'?1.1-.1*f:1.3*(1-f)+(v.cargo||a.id==='dc3'?.65:.37)*f);for(let k=0;k<=cols;k++){const t=k/cols*Math.PI*2;verts.push(point(x,v.wingY+f*f*.35+Math.sin(t)*c*.055,lead-(1-Math.cos(t))*.5*c));}}
 for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const n=j*(cols+1)+k;faces.push(side>0?[n,n+cols+1,n+cols+2,n+1]:[n+1,n+cols+2,n+cols+1,n]);}add('wing',verts,faces,{side});
 slab('tail',[point(side*.3,v.tailWingY,tail+L*.07),point(side*S*.32,v.tailWingY+.15,tail-.3),point(side*S*.32,v.tailWingY+.15,tail-L*.06),point(side*.3,v.tailWingY,tail-L*.06)],.1);
 if(v.winglets)slab('winglet',[point(side*S,v.wingY+.35,-v.sweep+chord*.25),point(side*(S+.25),v.wingY+v.winglets,-v.sweep-chord*.1),point(side*(S+.25),v.wingY+v.winglets,-v.sweep-chord*.25),point(side*S,v.wingY+.35,-v.sweep-chord*.12)],.07);
 }
 slab('fin',[point(0,0,tail+L*.12),point(0,v.tailHeight,tail-L*.015),point(0,v.tailHeight,tail-L*.085),point(0,0,tail-L*.09)],.12);
 for(const [i,e] of a.engines.entries()){const {x,y,z}=e.position,r=v.engineRadius;hull('engine',[[z-1.4,r*.65,y],[z-1,r,y],[z+1,r,y],[z+1.3,r*.86,y]].map(([zz,rr,yy])=>[zz,rr,yy]),{engine:i});const item=result[result.length-1];item.verts.forEach(p=>{p.x+=x;if(a.id==='c172')p.z=z+(p.z-z)*.55})}
 return result;
}
