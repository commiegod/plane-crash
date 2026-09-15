import * as T from './assets/three.module.js';
import { HDRLoader } from './assets/HDRLoader.js';

export function createGraphics(canvas,ground){
 const touch=globalThis.matchMedia?.('(any-pointer:coarse)').matches||false;
 const renderer=new T.WebGLRenderer({canvas,antialias:!touch,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,touch?1:1.6));renderer.setSize(innerWidth,innerHeight,false);
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
 const scene=new T.Scene();scene.background=new T.Color('#a4b9c3');scene.fog=new T.FogExp2('#a7b8bd',.00016);
 const camera=new T.PerspectiveCamera(49,innerWidth/innerHeight,.25,19000);
 const sun=new T.DirectionalLight('#fff0d3',3.1);sun.position.set(-500,800,-350);sun.castShadow=true;sun.shadow.mapSize.set(touch?1024:2048,touch?1024:2048);sun.shadow.camera.left=-100;sun.shadow.camera.right=100;sun.shadow.camera.top=100;sun.shadow.camera.bottom=-100;sun.shadow.camera.near=10;sun.shadow.camera.far=1600;sun.shadow.bias=-.0002;sun.shadow.normalBias=.15;scene.add(sun,sun.target);const hemi=new T.HemisphereLight('#c4d8ed','#78745c',1.2);scene.add(hemi);let lightMode=0,daySky=null;
 const envReady=new HDRLoader().loadAsync('./assets/sky.hdr').then(hdr=>{hdr.mapping=T.EquirectangularReflectionMapping;daySky=hdr;if(lightMode===0)scene.background=hdr;scene.backgroundIntensity=.85;scene.environment=hdr;scene.environmentIntensity=.65}).catch(()=>{});
 const loader=new T.TextureLoader(),aniso=Math.min(touch?2:8,renderer.capabilities.getMaxAnisotropy());
 function tex(url,repeat=1,color=false){const t=loader.load(url);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=aniso;if(color)t.colorSpace=T.SRGBColorSpace;return t}
 const grass=tex('./assets/grass-color.jpg',300,true),grassN=tex('./assets/grass-normal.jpg',300),grassR=tex('./assets/grass-rough.jpg',300);
 const terrainMat=new T.MeshStandardMaterial({map:grass,normalMap:grassN,roughnessMap:grassR,normalScale:new T.Vector2(.6,.6),color:0x99aa7d,roughness:1});
 terrainMat.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vTerrain;').replace('#include <begin_vertex>','#include <begin_vertex>\nvTerrain=position;');shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>', `#ifdef USE_MAP
vec4 sampleA=texture2D(map,vMapUv);
vec2 uvB=mat2(.71,-.71,.71,.71)*vMapUv*.743+vec2(17.3,8.9);
vec4 sampleB=texture2D(map,uvB);
float blendTex=.45+.2*sin(vTerrain.x*.013)*sin(vTerrain.z*.017);
diffuseColor*=mix(sampleA,sampleB,blendTex);
#endif`).replace('#include <common>','#include <common>\nvarying vec3 vTerrain;').replace('#include <color_fragment>',`#include <color_fragment>
 float field = sin(vTerrain.x*.008+sin(vTerrain.z*.005)*2.)*sin(vTerrain.z*.009);
 float broad=sin(vTerrain.x*.0009+vTerrain.z*.0015)*.5+.5;
 diffuseColor.rgb *= mix(vec3(.66,.72,.54),vec3(1.15,1.08,.86),broad*.65+field*.15+.2);`)};
 const terrainGeo=new T.PlaneGeometry(18000,18000,300,300);terrainGeo.rotateX(-Math.PI/2);const tp=terrainGeo.attributes.position;for(let i=0;i<tp.count;i++)tp.setY(i,ground(tp.getX(i),tp.getZ(i)));terrainGeo.computeVertexNormals();const terrain=new T.Mesh(terrainGeo,terrainMat);terrain.receiveShadow=true;scene.add(terrain);
 const asphalt=tex('./assets/asphalt-color.jpg',1,true),asphaltN=tex('./assets/asphalt-normal.jpg'),asphaltR=tex('./assets/asphalt-rough.jpg');for(const tx of [asphalt,asphaltN,asphaltR])tx.repeat.set(4,130);
 const roadMat=new T.MeshStandardMaterial({map:asphalt,normalMap:asphaltN,roughnessMap:asphaltR,color:0x999d9e,roughness:.94,normalScale:new T.Vector2(.3,.3)});
 const paint=new T.MeshStandardMaterial({color:0xe0ded0,roughness:.86}),yellow=new T.MeshStandardMaterial({color:0xd3ac43,roughness:.9});
 function mesh(geo,mat,p,parent=scene){const m=new T.Mesh(geo,mat);m.position.set(...p);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 function box(s,p,mat,parent=scene){return mesh(new T.BoxGeometry(...s),mat,p,parent)}
 function marking(x,z,w,l,mat=paint){const m=mesh(new T.PlaneGeometry(w,l),mat,[x,10.08,z]);m.rotation.x=-Math.PI/2;m.castShadow=false;return m}
 const runway=mesh(new T.PlaneGeometry(68,2400),roadMat,[0,10.03,1200]);runway.rotation.x=-Math.PI/2;runway.castShadow=false;
 for(let z=25;z<2380;z+=55)marking(0,z,1,28);for(const x of [-32,32])marking(x,1200,.6,2390);for(const z of [32,2368])for(let x=-25;x<=25;x+=7)marking(x,z,3,35);
 for(const z of [220,2130])for(const x of [-15,15])marking(x,z,6,45);
 function textTexture(text,w=1024,h=256,fg='#eff1e8',bg=null){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');if(bg){g.fillStyle=bg;g.fillRect(0,0,w,h)}g.fillStyle=fg;g.font='bold '+Math.floor(h*.66)+'px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h/2,w*.92);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=aniso;return t}
 const numberMat=new T.MeshStandardMaterial({map:textTexture('01',256,256),transparent:true,roughness:1,depthWrite:false});const n=marking(0,95,19,26,numberMat);n.rotation.z=Math.PI;
 // Rubber deposits, seams and runway lamps supply local scale cues.
 const rubberMat=new T.MeshStandardMaterial({color:0x171a1c,transparent:true,opacity:.32,roughness:1,depthWrite:false});for(let i=0;i<28;i++)marking((Math.random()-.5)*12,150+Math.random()*450,.1+Math.random()*.45,20+Math.random()*100,rubberMat);
 const lampMat=new T.MeshBasicMaterial({color:0xffe2a1});const lampGeo=new T.SphereGeometry(.24,6,4);for(let z=0;z<2400;z+=55)for(const x of [-35,35])mesh(lampGeo,lampMat,[x,10.3,z]);
 // Large terminal apron; repeated details share instanced draws for tablets.
 const taxiMat=roadMat.clone();taxiMat.map=asphalt.clone();taxiMat.map.repeat.set(1,100);
 const concrete=new T.MeshStandardMaterial({color:0xa3a29a,roughness:.95});
 const hangarMat=new T.MeshStandardMaterial({color:0x9ba5a9,metalness:.35,roughness:.65}),roofMat=new T.MeshStandardMaterial({color:0x45545d,metalness:.4,roughness:.55}),glassMat=new T.MeshPhysicalMaterial({color:0x29434e,metalness:.3,roughness:.17,clearcoat:1});
 const terminalGlass=new T.MeshStandardMaterial({color:0x38596c,metalness:.55,roughness:.25,emissive:0x263e50,emissiveIntensity:.35});
 const batches=new Map();function detail(s,p,mat){if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push({s,p})}
 function pavement(x,z,w,l,mat=taxiMat){const m=mesh(new T.PlaneGeometry(w,l),mat,[x,10.04,z]);m.rotation.x=-Math.PI/2;m.castShadow=false;return m}
 // Concrete joints and subtle variation are baked into one repeating texture.
 const slabCanvas=document.createElement('canvas');slabCanvas.width=slabCanvas.height=256;const slab=slabCanvas.getContext('2d');slab.fillStyle='#9a9d9b';slab.fillRect(0,0,256,256);slab.fillStyle='#a4a6a3';slab.fillRect(1,1,126,126);slab.fillRect(129,129,126,126);slab.strokeStyle='#737a7c';slab.lineWidth=1;for(const a of [0,128,255]){slab.beginPath();slab.moveTo(a,0);slab.lineTo(a,256);slab.moveTo(0,a);slab.lineTo(256,a);slab.stroke()}
 const slabs=new T.CanvasTexture(slabCanvas);slabs.wrapS=slabs.wrapT=T.RepeatWrapping;slabs.repeat.set(24,55);slabs.colorSpace=T.SRGBColorSpace;slabs.anisotropy=aniso;
 pavement(615,1300,790,1750,new T.MeshStandardMaterial({map:slabs,roughness:.94}));
 pavement(135,1200,32,2350);detail([.35,.015,2320],[135,10.09,1200],yellow);
 pavement(295,1280,30,1740);detail([.35,.015,1720],[295,10.09,1280],yellow);
 for(const z of [100,500,1000,1550,2100,2300]){pavement(84,z,115,30);detail([115,.015,.35],[84,10.09,z],yellow);if(z>=500&&z<=2100){pavement(214,z,160,30);detail([160,.015,.35],[214,10.09,z],yellow)}}
 // Long glass terminal with three piers, 18 contact stands and articulated bridges.
 detail([115,27,1480],[885,23.5,1300],hangarMat);detail([119,2,1484],[885,38,1300],roofMat);detail([.5,18,1460],[827.2,25,1300],terminalGlass);
 for(let z=580;z<2030;z+=28)detail([1,22,1.2],[826.5,24,z],hangarMat);
 const gatePaint=new T.MeshStandardMaterial({color:0xf1d16b,roughness:.9});
 let gate=0;
 for(const pierZ of [760,1300,1840]){
 detail([380,15,50],[650,17.5,pierZ],hangarMat);detail([385,1.5,54],[650,25.7,pierZ],roofMat);
 for(const side of [-1,1]){
 detail([365,9,.4],[650,19,pierZ+side*25.2],terminalGlass);
 for(const x of [495,625,755]){gate++;
 const standZ=pierZ+side*140;
 detail([.4,.02,135],[x,10.12,pierZ+side*130],gatePaint);
 detail([95,.02,.4],[x,10.12,pierZ+side*210],paint);
 for(const offset of [-48,48])detail([.3,.02,175],[x+offset,10.12,standZ],paint);
 detail([12,6,43],[x-20,17,pierZ+side*45],hangarMat);detail([11,4,40],[x-20,18,pierZ+side*45],terminalGlass);
 detail([30,6,11],[x-11,17,pierZ+side*71],hangarMat);detail([10,7,13],[x+4,17,pierZ+side*71],roofMat);
 detail([2,5,2],[x-20,12.5,pierZ+side*63],roofMat);
 const labelMat=new T.MeshBasicMaterial({map:textTexture('G'+gate,128,64,'#ffdc6b','#222d36')});const sign=mesh(new T.PlaneGeometry(12,6),labelMat,[x-20,22,pierZ+side*68]);if(side<0)sign.rotation.y=Math.PI;
 // Tugs, baggage carts and servicing lanes give the gates a human scale.
 detail([3,2,6],[x+33,11.2,standZ-25],paint);detail([2.7,1.4,2],[x+33,12.6,standZ-26],terminalGlass);
 for(let j=0;j<3;j++)detail([2.2,1.5,3.8],[x+37,11,standZ+j*5],roofMat);
 }
 }
 }
 // Control tower and cargo hangars at the northern end of the apron.
 detail([17,55,17],[975,37.5,2080],hangarMat);detail([33,9,33],[975,68,2080],terminalGlass);detail([36,2,36],[975,74,2080],roofMat);
 for(let z=550;z<2100;z+=280){detail([60,19,120],[1005,19.5,z],hangarMat);detail([62,2,123],[1005,30,z],roofMat)}
 const greenLights=[],blueLights=[];
 for(let z=50;z<2380;z+=24){greenLights.push([135,10.3,z]);blueLights.push([117,10.3,z],[153,10.3,z])}
 for(let z=440;z<2160;z+=24)greenLights.push([295,10.3,z]);
 for(const z of [100,500,1000,1550,2100,2300])for(let x=40;x<= (z>=500&&z<=2100?295:135);x+=22)greenLights.push([x,10.3,z]);
 function lights(points,color){const m=new T.InstancedMesh(new T.SphereGeometry(.5,6,4),new T.MeshBasicMaterial({color}),points.length);const d=new T.Object3D();points.forEach((p,i)=>{d.position.set(...p);d.updateMatrix();m.setMatrixAt(i,d.matrix)});scene.add(m)}
 lights(greenLights,0x41ff99);lights(blueLights,0x4c8cff);
 for(const z of [520,1060,1600,2140])for(const x of [370,800]){detail([.7,32,.7],[x,26,z],roofMat);detail([12,.8,2],[x,42,z],lampMat)}
 for(const [mat,items] of batches){const group=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat,items.length),d=new T.Object3D();items.forEach(({s,p},i)=>{d.position.set(...p);d.scale.set(...s);d.updateMatrix();group.setMatrixAt(i,d.matrix)});group.castShadow=mat!==paint&&mat!==yellow&&mat!==gatePaint;group.receiveShadow=true;scene.add(group)}
 // Distant tree stands are instanced to keep draw calls bounded.
 let seed=8192;function rnd(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}
 const treeCount=650;
 const twigMap=tex('./assets/tree-color.jpg',1,true),twigAlpha=tex('./assets/tree-alpha.jpg'),twigNormal=tex('./assets/tree-normal.jpg');
 const foliageMat=new T.MeshStandardMaterial({map:twigMap,alphaMap:twigAlpha,normalMap:twigNormal,normalScale:new T.Vector2(.4,.4),alphaTest:.45,side:T.DoubleSide,roughness:.95,color:0xb1ba8c});
 const branchV=[],branchUv=[],branchIdx=[];
 for(let level=0;level<9;level++)for(let j=0;j<8;j++){
 const f=level/9,angle=j/8*Math.PI*2+level*.61,length=5*(1-f)+.5,h=3+f*13,ww=length*.47,dx=Math.cos(angle),dz=Math.sin(angle),tx=-dz*ww,tz=dx*ww;
 const base=branchV.length/3;branchV.push(-tx,h,-tz,tx,h,tz,dx*length+tx*.35,h+2.3,dz*length+tz*.35,dx*length-tx*.35,h+2.3,dz*length-tz*.35);
 branchUv.push(.01,.55,.245,.55,.245,.99,.01,.99);branchIdx.push(base,base+1,base+2,base,base+2,base+3)
 }
 const foliageGeo=new T.BufferGeometry();foliageGeo.setAttribute('position',new T.Float32BufferAttribute(branchV,3));foliageGeo.setAttribute('uv',new T.Float32BufferAttribute(branchUv,2));foliageGeo.setIndex(branchIdx);foliageGeo.computeVertexNormals();
 const trunks=new T.InstancedMesh(new T.CylinderGeometry(.12,.45,15,6).translate(0,7.5,0),new T.MeshStandardMaterial({color:0x645548,roughness:1}),treeCount),leaves=new T.InstancedMesh(foliageGeo,foliageMat,treeCount);
 const dummy=new T.Object3D(),color=new T.Color();for(let i=0;i<treeCount;i++){const side=i%2?1:-1,x=side*((side>0?1250:300)+rnd()*1700),z=-1000+rnd()*5300,y=ground(x,z),size=.65+rnd()*1.3;dummy.position.set(x,y,z);dummy.scale.set(size,size,size);dummy.rotation.set(0,rnd()*7,0);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);leaves.setMatrixAt(i,dummy.matrix);color.setRGB(.7+rnd()*.3,.76+rnd()*.22,.65+rnd()*.3);leaves.setColorAt(i,color)}trunks.castShadow=leaves.castShadow=true;leaves.receiveShadow=true;scene.add(trunks,leaves);


 const white=new T.MeshPhysicalMaterial({color:0xf1f0e8,metalness:.22,roughness:.3,clearcoat:.8,clearcoatRoughness:.22});
 const aluminum=new T.MeshStandardMaterial({color:0xbac2c8,metalness:.72,roughness:.32});
 const navy=new T.MeshPhysicalMaterial({color:0x143d5a,metalness:.23,roughness:.3,clearcoat:.8});
 const dark=new T.MeshStandardMaterial({color:0x161d22,metalness:.2,roughness:.65});
 const rubber=new T.MeshStandardMaterial({color:0x181a1c,roughness:.93});
 const panelLine=new T.LineBasicMaterial({color:0x55636d,transparent:true,opacity:.35});
 function surface(rings,segments=48){const vertices=[],uvs=[],indices=[];for(let j=0;j<rings.length;j++){let [z,r,cy=0,ys=1]=rings[j];for(let i=0;i<=segments;i++){let th=i/segments*Math.PI*2;vertices.push(r*Math.cos(th),cy+r*Math.sin(th)*ys,z);uvs.push(j/(rings.length-1),i/segments)}}for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,a+1,b,b,a+1,b+1)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g}
 function line(points,parent){const l=new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),panelLine);parent.add(l)}
 function livery(type){const c=document.createElement('canvas');c.width=2048;c.height=512;const g=c.getContext('2d');g.fillStyle='#eff0eb';g.fillRect(0,0,2048,512);g.fillStyle='#153e59';g.fillRect(0,0,2048,252);g.fillStyle='#b49154';g.fillRect(0,252,2048,5);for(const y of [279,481])for(let x=220;x<1700;x+=31){g.fillStyle='#b3bdc0';g.beginPath();g.roundRect(x-1,y-1,15,13,4);g.fill();g.fillStyle='#203a47';g.beginPath();g.roundRect(x,y,13,11,3);g.fill()}g.strokeStyle='#75849055';g.lineWidth=1;for(let x=80;x<2000;x+=100){g.beginPath();g.moveTo(x,0);g.lineTo(x,512);g.stroke()}for(const y of [267,471])for(const x of [150,850,1670]){g.strokeStyle='#7b8e94';g.strokeRect(x,y,26,35)}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=aniso;return new T.MeshPhysicalMaterial({map:t,metalness:.2,roughness:.34,clearcoat:.7})}
 function airfoil(side,span,z,parent,tail=false){const rows=12,cols=24,v=[],idx=[];for(let j=0;j<=rows;j++){const f=j/rows,x=side*(1.4+(span-1.4)*f),lead=z+3-f*7,chord=(tail?4:8)*(1-f)+(tail?1:2)*f;for(let k=0;k<=cols;k++){const a=k/cols*Math.PI*2,ch=(1-Math.cos(a))*.5;v.push(x,.12+f*f*.7+Math.sin(a)*(tail?.14:.36)*(1-f*.85),lead-ch*chord)}}for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=j*(cols+1)+k,b=a+cols+1;if(side>0)idx.push(a,b,a+1,b,b+1,a+1);else idx.push(a,a+1,b,b,a+1,b+1)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();mesh(g,aluminum,[0,0,0],parent);for(const f of [.25,.68,.84]){const pts=[];for(let j=0;j<=10;j++){const t=j/10;const lead=z+3-t*7,chord=(tail?4:8)*(1-t)+(tail?1:2)*t;pts.push([side*(1.5+(span-1.5)*t),.16+t*t*.7+.1,lead-chord*f])}line(pts,parent)}if(!tail)for(const f of [.38,.61,.79]){let x=side*(1.4+(span-1.4)*f);box([.18,.65,2.7],[x,-.4,z-2-f*3],white,parent)}}
 function nacelle(x,y,z,parent,r=1.05){const rings=[[-2,r*.55],[-1.7,r*.9],[-1,r],[.8,r],[1.55,r*.97],[1.85,r*.9],[1.8,r*.77],[.7,r*.76]];mesh(surface(rings.map(([a,b])=>[a,b]),48),white,[x,y,z],parent);const lip=mesh(new T.TorusGeometry(r*.845,r*.075,10,48),aluminum,[x,y,z+1.8],parent);const inner=mesh(new T.CylinderGeometry(r*.77,r*.68,1.3,40,1,true),dark,[x,y,z+1.05],parent);inner.rotation.x=Math.PI/2;const fan=new T.Group();fan.position.set(x,y,z+.68);parent.add(fan);for(let i=0;i<20;i++){const a=i/20*Math.PI*2;const blade=mesh(new T.BoxGeometry(.075,r*.66,.08),aluminum,[Math.cos(a)*r*.43,Math.sin(a)*r*.43,0],fan);blade.rotation.z=a-.95}const spinner=mesh(new T.ConeGeometry(r*.2,.5,24),aluminum,[0,0,.14],fan);spinner.rotation.x=Math.PI/2;fan.userData.fan=true;fan.userData.engineX=x;box([.28,1.2,2.2],[x,y+1.2,z-.8],aluminum,parent);const nozzle=mesh(new T.CylinderGeometry(r*.46,r*.6,.7,32,1,true),dark,[x,y,z-2.1],parent);nozzle.rotation.x=Math.PI/2;return fan}
 function cockpit(parent,z,r,jumbo=false){
 const z1=jumbo?12.2:z-.2,z2=jumbo?13.15:z+1;
 function point(zz,th){let rr,cy;if(jumbo){rr=1.1-(zz-12)*.5;cy=1.6-(zz-12)*.05}else{const end=z+3.5,start=end-(r>1.5?27:15);rr=r*Math.min(1,Math.sqrt(Math.max(.001,(end-zz)/(end-start)/.15)));cy=0}return [(rr+.022)*Math.cos(th),cy+(rr+.022)*Math.sin(th),zz]}
 for(let i=0;i<4;i++){const a=.5+i*.535,b=a+.48;const pts=[point(z1,a),point(z1,b),point(z2,b),point(z2,a)];const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(pts.flat(),3));geom.setIndex([0,1,2,0,2,3]);geom.computeVertexNormals();const mat=glassMat.clone();mat.side=T.DoubleSide;mesh(geom,mat,[0,0,0],parent);line([...pts,pts[0]],parent)}
 }
 let roots=[],fans=[],gearRoot=new T.Group(),lastType='',lastParts=null;scene.add(gearRoot);const nav=[];
 function disposeRoots(){const shared=new Set([white,aluminum,navy,dark,rubber,panelLine,glassMat]),materials=new Set(),textures=new Set(),geometries=new Set();for(const root of [...roots,gearRoot]){root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material&&!shared.has(o.material))materials.add(o.material)})}for(const r of roots)scene.remove(r);for(const g of geometries)g.dispose();for(const m of materials){if(m.map)textures.add(m.map);m.dispose()}for(const t of textures)t.dispose();gearRoot.clear();roots=[];fans=[];nav.length=0}
 function build(s){if(!['twin','dc10','b747'].includes(s.aircraftFamily))throw new Error('Unregistered visual profile: '+s.aircraftFamily);disposeRoots();navy.color.set(s.livery?.color||'#143d5a');lastType=s.aircraft;lastParts=s.parts;const jumbo=s.aircraftFamily==='b747',trainer=s.aircraftFamily==='twin',radius=trainer?1.35:jumbo?2.15:1.8,tail=trainer?-10:jumbo?-18:-16;
 for(let i=0;i<s.parts.length;i++){const root=new T.Group(),content=new T.Group(),c=s.parts[i].center;content.position.set(-c.x,-c.y,-c.z);root.add(content);scene.add(root);roots.push(root);
 if(i===0){const end=trainer?9.5:jumbo?16.5:14.5,start=trainer?-5.5:jumbo?-14.5:-12.5;const rs=[];for(let j=0;j<=32;j++){const f=j/32,z=start+(end-start)*f;const nose=Math.min(1,Math.sqrt(Math.max(.001,(1-f)/.15)));rs.push([z,radius*nose,0,1])}mesh(surface(rs,64),livery(s.aircraft),[0,0,0],content);const cap=mesh(new T.CircleGeometry(radius,48),aluminum,[0,0,start],content);cap.rotation.y=Math.PI;
 const lettering=textTexture(s.livery?.label??'HORIZON',1024,160,s.livery?.color||'#213f55');for(const side of [-1,1]){const decal=mesh(new T.PlaneGeometry(trainer?5:9,.75),new T.MeshStandardMaterial({map:lettering,transparent:true,depthWrite:false,roughness:.4}),[side*(radius+.015),.75,trainer?2:5],content);decal.rotation.y=side*Math.PI/2}}
 else if(i===1){const z0=trainer?-11:tail-2,z1=trainer?-5.5:jumbo?-14.5:-12.5;mesh(surface([[z0,.07,.6],[z0+1,.32,.4],[z0+2,.7,.18],[z1-1,radius*.91,0],[z1,radius,0]],48),white,[0,0,0],content)}
 else if(i===2||i===3)airfoil(i===2?-1:1,trainer?13:jumbo?22:18,-1,content);
 else if(i===4||i===5)airfoil(i===4?-1:1,trainer?5:8,tail+1,content,true);
 else if(i===6){const shape=new T.Shape();shape.moveTo(tail+3,0);shape.lineTo(tail-.5,trainer?4.5:8);shape.lineTo(tail-3,trainer?4.6:8.2);shape.lineTo(tail-4,0);const g=new T.ExtrudeGeometry(shape,{depth:.24,bevelEnabled:true,bevelSize:.05,bevelThickness:.05,bevelSegments:2,steps:1});g.rotateY(-Math.PI/2);mesh(g,navy,[.12,0,0],content);const stripe=mesh(new T.PlaneGeometry(1.8,2.4),new T.MeshBasicMaterial({map:textTexture((s.livery?.label??'HORIZON').slice(0,1),128,128,s.livery?.accent||'#d0b276'),transparent:true,side:T.DoubleSide}),[.27,trainer?2.3:4.6,tail-1.3],content);stripe.rotation.y=Math.PI/2}
 else if(i===7||i===8)fans.push(nacelle(i===7?(trainer?-5:-7):(trainer?5:7),trainer?-1.1:-1.6,0,content,trainer?.75:1.05));
 else if(i===9)cockpit(content,trainer?6:jumbo?13:11,radius,jumbo);
 else if(jumbo&&(i===10||i===11))fans.push(nacelle(i===10?-14:14,-1.3,-2.8,content));
 else if(jumbo&&i===12){mesh(surface([[.5,.05,1.5],[2,.7,1.6],[5,1.2,1.65],[9,1.3,1.65],[12,1.1,1.6],[14,.1,1.5]],48),white,[0,0,0],content);for(const side of [-1,1])for(let z=4;z<11;z+=.7)box([.02,.23,.3],[side*1.13,2.1,z],glassMat,content)}
 else if(!trainer&&!jumbo&&i===10)fans.push(nacelle(0,3.6,tail+1,content,1.02));
 else if(!trainer&&!jumbo&&i===11)box([.35,2.1,3],[0,2,tail+1],white,content);
 else {const base=s.parts[i];const g=new T.BufferGeometry(),points=[];for(const f of base.faces)for(let k=1;k<f.length-1;k++)for(const q of [f[0],f[k],f[k+1]]){const v=base.verts[q];points.push(v.x+base.center.x,v.y+base.center.y,v.z+base.center.z)}g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.computeVertexNormals();mesh(g,navy,[0,0,0],content)}
 }
 for(const side of [-1,1]){const gx=side*(trainer?2.5:3.4);box([.15,2,.18],[gx,-2.1,-2],aluminum,gearRoot);for(const dz of (trainer?[0]:[-.6,.6]))for(const dx of [-.35,.35]){const wheel=mesh(new T.CylinderGeometry(.48,.48,.3,20),rubber,[gx+dx,-3.3,-2+dz],gearRoot);wheel.rotation.z=Math.PI/2;const hub=mesh(new T.CylinderGeometry(.21,.21,.32,12),aluminum,[gx+dx,-3.3,-2+dz],gearRoot);hub.rotation.z=Math.PI/2}if(jumbo)for(const dz of [-.6,.6])for(const dx of [-.35,.35]){const wheel=mesh(new T.CylinderGeometry(.48,.48,.3,20),rubber,[side*1.5+dx,-3.3,-5+dz],gearRoot);wheel.rotation.z=Math.PI/2}}
 box([.14,2.4,.14],[0,-2.2,trainer?6:10],aluminum,gearRoot);for(const dx of [-.22,.22]){const w=mesh(new T.CylinderGeometry(.35,.35,.24,16),rubber,[dx,-3.35,trainer?6:10],gearRoot);w.rotation.z=Math.PI/2}
 }
 // Soft, irregular particle textures: luminous fuel ignition then drifting soot.
 function particleTexture(kind){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');for(let i=0;i<35;i++){const x=64+(rnd()-.5)*52,y=64+(rnd()-.5)*52,r=14+rnd()*32;const grad=g.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,kind==='fire'?'rgba(255,246,188,.6)':'rgba(230,230,230,.16)');grad.addColorStop(.35,kind==='fire'?'rgba(255,140,30,.45)':'rgba(210,210,210,.12)');grad.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2)}return new T.CanvasTexture(c)}
 const smokeTexture=particleTexture('smoke'),fireTexture=particleTexture('fire');let effects=[],crashActive=false,fxAge=0,emit=0,flash=new T.PointLight(0xff7a24,0,150,1.4);scene.add(flash);const scorch=new T.Mesh(new T.CircleGeometry(15,48),new T.MeshBasicMaterial({color:0x17130f,transparent:true,opacity:.65,depthWrite:false}));scorch.rotation.x=-Math.PI/2;scorch.visible=false;scene.add(scorch);
 function addFx(p,kind,velocity,size,life){if(effects.length>=(quality==='PERFORMANCE'?100:touch?160:360))return;const mat=new T.SpriteMaterial({map:kind==='fire'?fireTexture:smokeTexture,color:kind==='fire'?0xffb255:0x36322f,transparent:true,opacity:.8,depthWrite:false,blending:kind==='fire'?T.AdditiveBlending:T.NormalBlending,rotation:rnd()*6.28});const sprite=new T.Sprite(mat);sprite.position.copy(p);sprite.scale.setScalar(size);scene.add(sprite);effects.push({sprite,velocity,size,life,age:0,kind})}
 function clearFx(){for(const f of effects){scene.remove(f.sprite);f.sprite.material.dispose()}effects=[];flash.intensity=0;scorch.visible=false;crashActive=false}
 function updateEffects(s,dt){const crashed=s.state==='crashed'||s.state==='paused'&&s.saved==='crashed';if(!crashed){if(crashActive)clearFx();if(s.state==='paused')dt=0;emit+=dt;if(emit>.09&&s.state==='flight'){emit=0;for(const e of s.systems.engines){if(!e.onFire||s.systems.fuel<=0)continue;const off=s.rotate(e.position,s.pitch,s.roll,s.yaw),p=new T.Vector3(s.pos.x+off.x,s.pos.y+off.y,s.pos.z+off.z);addFx(p,'smoke',new T.Vector3(s.vel.x*.55+2,s.vel.y*.55+4,s.vel.z*.55),2.5,6);addFx(p,'fire',new T.Vector3(s.vel.x*.8,s.vel.y*.8+2,s.vel.z*.8),2.1,.5)}}advanceEffects(dt);return}if(!crashActive){crashActive=true;fxAge=0;emit=0;const center=new T.Vector3(s.impactPos.x,s.impactPos.y,s.impactPos.z);scorch.position.copy(center);scorch.position.y=ground(center.x,center.z)+.12;scorch.visible=s.impactPos.y-ground(center.x,center.z)<6;for(let i=0;i<(s.crashFuel>0||s.crashCause==='ONBOARD EXPLOSION'?45:0);i++)addFx(center.clone().add(new T.Vector3((rnd()-.5)*8,rnd()*3,(rnd()-.5)*8)),'fire',new T.Vector3((rnd()-.5)*22,rnd()*14,(rnd()-.5)*22),3+rnd()*9,.5+rnd()*1.1);for(let i=0;i<30;i++)addFx(center.clone(),'smoke',new T.Vector3((rnd()-.5)*30,rnd()*8,(rnd()-.5)*30),4+rnd()*6,4+rnd()*4)}if(s.state==='paused')dt=0;fxAge+=dt;flash.position.set(s.impactPos.x,s.impactPos.y+5,s.impactPos.z);flash.intensity=Math.max(0,(s.crashFuel>0||s.crashCause==='ONBOARD EXPLOSION'?2200:0)*(1-fxAge/1.3));emit+=dt;if(emit>.07&&fxAge<28&&s.crashFuel>0){emit=0;for(let j=0;j<3;j++){const d=s.debris[j%Math.min(s.debris.length,3)];if(!d)continue;const p=new T.Vector3(d.pos.x,d.pos.y+1,d.pos.z);addFx(p,'smoke',new T.Vector3(2+rnd()*2,4+rnd()*4,1+rnd()*2),5+rnd()*4,7+rnd()*6);if(fxAge<14)addFx(p,'fire',new T.Vector3((rnd()-.5)*2,4+rnd()*4,(rnd()-.5)*2),3+rnd()*4,.4+rnd()*.8)}}advanceEffects(dt)}
 function advanceEffects(dt){for(const f of effects){f.age+=dt;f.sprite.position.addScaledVector(f.velocity,dt);f.sprite.scale.setScalar(f.size*(1+f.age*(f.kind==='fire'?.6:.32)));f.sprite.material.opacity=(f.kind==='fire'?.85:.55)*Math.min(1,f.age*5+.1)*Math.max(0,1-f.age/f.life);if(f.kind==='smoke')f.sprite.material.color.lerp(new T.Color(0x807b70),dt*.08)}effects=effects.filter(f=>{if(f.age<f.life)return true;scene.remove(f.sprite);f.sprite.material.dispose();return false})}
 let camMode=0,frameTime=0,frames=0,quality=touch?'BALANCED':'HIGH',qualityMode=0,slowWindows=0;
 function applyQuality(value){quality=value;renderer.setPixelRatio(Math.min(devicePixelRatio,value==='HIGH'?1.6:value==='BALANCED'?1:.75));renderer.shadowMap.enabled=value!=='PERFORMANCE';const size=value==='HIGH'?2048:1024;sun.shadow.mapSize.set(size,size);sun.shadow.map?.dispose();sun.shadow.map=null;resize()}

 const cameraOffsets=[new T.Vector3(0,17,-67),new T.Vector3(53,14,36),new T.Vector3(0,4,13)];
 function draw(s,dt){if(lastParts!==s.parts)build(s);const actual=s.state==='paused'?s.saved:s.state;for(let i=0;i<roots.length;i++){const root=roots[i];if(actual==='crashed'){const d=s.debris[i];if(!d){root.visible=false;continue}root.visible=true;root.position.set(d.pos.x,d.pos.y,d.pos.z);root.rotation.set(-d.p,d.y,d.r,'YXZ')}else{root.visible=true;const c=s.rotate(s.parts[i].center,s.pitch,s.roll,s.yaw);root.position.set(s.pos.x+c.x,s.pos.y+c.y,s.pos.z+c.z);root.rotation.set(-s.pitch,s.yaw,s.roll,'YXZ')}}gearRoot.visible=s.gear&&actual!=='crashed';gearRoot.position.set(s.pos.x,s.pos.y,s.pos.z);gearRoot.rotation.set(-s.pitch,s.yaw,s.roll,'YXZ');if(['flight','taxi'].includes(actual))for(const fan of fans){const e=s.systems.engines.find(e=>e.position.x===fan.userData.engineX);fan.rotation.z+=dt*(e?.running&&s.systems.fuel>0?18+s.throttle*50:2)}
 let desired,target=new T.Vector3(s.target.x,s.target.y,s.target.z);if(actual==='crashed'){desired=new T.Vector3(s.camera.x,s.camera.y,s.camera.z);desired.y=Math.max(desired.y,ground(desired.x,desired.z)+6)}else{const p=new T.Vector3(s.pos.x,s.pos.y,s.pos.z);const off=cameraOffsets[camMode].clone().multiplyScalar(s.aircraftFamily==='twin'?.78:1.08);if(s.state==='ready'){off.set(49,16,45)}off.multiplyScalar(Math.max(1,Math.pow(1.3/camera.aspect,.6)));off.applyAxisAngle(new T.Vector3(0,1,0),s.yaw);desired=p.clone().add(off);target=p.clone().add(new T.Vector3(0,0,camMode===2?80:0).applyAxisAngle(new T.Vector3(0,1,0),s.yaw));desired.y=Math.max(desired.y,ground(desired.x,desired.z)+3)}if(!camera.userData.initial){camera.position.copy(desired);camera.userData.initial=true}else camera.position.lerp(desired,1-Math.exp(-dt*4));camera.lookAt(target);sun.position.set(s.pos.x-420,s.pos.y+650,s.pos.z-260);sun.target.position.set(s.pos.x,s.pos.y,s.pos.z);updateEffects(s,dt);renderer.render(scene,camera);frames++;frameTime+=dt;if(frameTime>=2){const fps=Math.round(frames/frameTime);const el=document.getElementById('perf');if(el)el.textContent='WEBGL · '+quality+' · '+fps+' FPS';if(qualityMode===0){slowWindows=fps<28?slowWindows+1:0;if(slowWindows>=2&&quality!=='PERFORMANCE'){applyQuality(quality==='HIGH'?'BALANCED':'PERFORMANCE');slowWindows=0}}frames=0;frameTime=0}}
 function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
 addEventListener('resize',resize);return{draw,nextLighting(){lightMode=(lightMode+1)%3;scene.background=lightMode===0?(daySky||new T.Color('#a4b9c3')):new T.Color(lightMode===1?'#68778e':'#101d32');scene.fog.color.set(lightMode===0?'#a7b8bd':lightMode===1?'#68778e':'#101d32');sun.intensity=[3.1,.65,.12][lightMode];hemi.intensity=[1.2,.65,.35][lightMode];scene.environmentIntensity=[.65,.3,.12][lightMode];terminalGlass.emissiveIntensity=lightMode?1.1:.35;return ['DAYLIGHT','DUSK','NIGHT'][lightMode]},nextQuality(){qualityMode=(qualityMode+1)%4;const mode=['AUTO','PERFORMANCE','BALANCED','HIGH'][qualityMode];applyQuality(qualityMode===0?(touch?'BALANCED':'HIGH'):mode);slowWindows=0;return mode},nextCamera(){camMode=(camMode+1)%3;return ['CHASE','EXTERIOR','NOSE'][camMode]},resetCamera(){camera.userData.initial=false},ready:envReady,renderer};
}
