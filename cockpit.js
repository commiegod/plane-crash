import * as T from './assets/three.module.js';
// Representative variants; instruments read the game's flight state, not a certified avionics model.
export const DECKS={
 twin:{name:'Twin trainer · conventional instruments',analog:true,color:'#393c3c',engines:2},
 c172:{name:'Cessna 172S · G1000 NXi layout',screens:2,color:'#464748',engines:1,small:true},
 dc3:{name:'DC-3 · classic analog flight deck',analog:true,color:'#323d35',engines:2,classic:true},
 dc9:{name:'DC-9-30 · analog flight deck',analog:true,color:'#45494c',engines:2},
 dc10:{name:'DC-10 · three-crew analog layout',analog:true,color:'#44484a',engines:3},
 b747:{name:'747-400 · six-display layout',screens:6,color:'#756657',engines:4},
 a320:{name:'A320 · six-display layout',screens:6,color:'#596975',engines:2,sideStick:true},
 b737:{name:'737-800 · six-display layout',screens:6,color:'#70645b',engines:2},
 g650:{name:'G650ER · PlaneView II layout',screens:4,color:'#514e49',engines:2},
 c130:{name:'C-130J · four-display layout',screens:4,color:'#404947',engines:4,hud:true}
};
export function cockpitReadings(s){return {speed:Math.hypot(s.vel.x,s.vel.y,s.vel.z)*1.94384,altitude:s.pos.y*3.28084,vertical:s.vel.y*196.8504,heading:((s.yaw*180/Math.PI)%360+360)%360,engines:s.systems.engines.map(e=>e.running&&s.systems.fuel>0?Math.round(s.throttle*100):0)}}
export function createCockpit(){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(58,1,.05,20);camera.lookAt(0,0,1);
 scene.add(new T.HemisphereLight(0xdce8ff,0x29221d,2.3));const lamp=new T.DirectionalLight(0xffffff,2);lamp.position.set(-2,3,-2);scene.add(lamp);
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=512;const g=canvas.getContext('2d');
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 let root=new T.Group(),id='',deck,clock=1,yokes=[],levers=[];scene.add(root);
 const dark=new T.MeshStandardMaterial({color:0x15191b,roughness:.7});
 function box(w,h,d,x,y,z,mat=dark){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);root.add(m);return m}
 function build(type){root.traverse(o=>{o.geometry?.dispose();if(o.material&&o.material!==dark){o.material.dispose()}});scene.remove(root);root=new T.Group();root.position.set(0,.23,.65);scene.add(root);yokes=[];levers=[];id=type;deck=DECKS[type]||DECKS.twin;
 const trim=new T.MeshStandardMaterial({color:deck.color,roughness:.82});
 box(3.6,.85,.3,0,-.85,1.65,trim);box(3.72,.07,.24,0,-.37,1.7);box(3.8,.15,2,0,-1.3,.85,trim);
 const panel=new T.Mesh(new T.PlaneGeometry(3.5,.78),new T.MeshBasicMaterial({map:texture}));panel.rotation.y=Math.PI;panel.position.set(0,-.82,1.48);root.add(panel);
 // Windshield mullions and side walls frame the actual outside world.
 for(const side of [-1,1]){const post=box(.055,1.6,.08,side*1.35,.28,1.5,trim);post.rotation.z=side*.22;box(.16,.8,2,side*1.85,-.82,.9,trim)}
 if(!deck.small)box(.035,1.24,.045,.33,.25,1.85,trim);
 box(3.5,.13,.18,0,1.0,1.6,trim);
 box(.42,.24,.95,.33,-1.05,.97,trim);
 for(let i=0;i<deck.engines;i++){const x=.2+i*.08;box(.025,.24,.025,x,-.82,1.03);levers.push(box(.055,.045,.12,x,-.69,1.03))}
 if(deck.sideStick){for(const side of [-1,1]){box(.12,.08,.23,side*1.48,-.77,.66,trim);const stick=box(.055,.22,.055,side*1.48,-.64,.66);yokes.push(stick)}}
 else for(const x of [-.83,.96]){box(.045,.42,.05,x,-1.02,.8);const control=new T.Group();control.position.set(x,-.8,.7);root.add(control);for(const [w,h,xx,yy] of [[.32,.045,0,0],[.045,.16,-.16,.06],[.045,.16,.16,.06]]){const m=new T.Mesh(new T.BoxGeometry(w,h,.055),dark);m.position.set(xx,yy,0);control.add(m)}yokes.push(control)}
 if(deck.hud){const hud=new T.Mesh(new T.PlaneGeometry(.48,.32),new T.MeshBasicMaterial({color:0x90dca7,transparent:true,opacity:.13,side:T.DoubleSide,depthWrite:false}));hud.position.set(-.6,.03,1.05);root.add(hud)}
 }
 function text(str,x,y,size=16,color='#dbe5e7'){g.fillStyle=color;g.font=`${size}px monospace`;g.textAlign='center';g.fillText(str,x,y)}
 function attitude(x,y,w,h,s){g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.translate(x+w/2,y+h/2);g.rotate(s.roll);const horizon=s.pitch*h*1.5;g.fillStyle='#3378aa';g.fillRect(-w*2,-h*3,w*4,h*3+horizon);g.fillStyle='#8b6540';g.fillRect(-w*2,horizon,w*4,h*3);g.strokeStyle='#f4f4dc';g.lineWidth=2;g.beginPath();g.moveTo(-w,horizon);g.lineTo(w,horizon);g.stroke();for(let i=-3;i<=3;i++)if(i){const yy=horizon+i*h*.17;g.beginPath();g.moveTo(-w*.16,yy);g.lineTo(w*.16,yy);g.stroke()}g.restore();g.strokeStyle='#ffdf68';g.lineWidth=3;g.beginPath();g.moveTo(x+w*.25,y+h*.5);g.lineTo(x+w*.43,y+h*.5);g.lineTo(x+w*.5,y+h*.55);g.lineTo(x+w*.57,y+h*.5);g.lineTo(x+w*.75,y+h*.5);g.stroke()}
 function gauge(x,y,r,label,value,max,s){g.save();g.translate(x,y);g.scale(.67,1);x=0;y=0;g.fillStyle='#161b1e';g.beginPath();g.arc(x,y,r+5,0,Math.PI*2);g.fill();g.strokeStyle='#9a9b97';g.lineWidth=2;g.stroke();if(label==='ATTITUDE'){g.save();g.beginPath();g.arc(x,y,r-5,0,Math.PI*2);g.clip();attitude(x-r,y-r,r*2,r*2,s);g.restore();g.restore();return}for(let i=0;i<30;i++){const a=(i/30*1.6+.7)*Math.PI;g.strokeStyle=i%5?'#819092':'#e7e7da';g.beginPath();g.moveTo(x+Math.cos(a)*(r-5),y+Math.sin(a)*(r-5));g.lineTo(x+Math.cos(a)*(r-(i%5?10:16)),y+Math.sin(a)*(r-(i%5?10:16)));g.stroke()}const a=(Math.max(0,Math.min(1,value/max))*1.6+.7)*Math.PI;g.strokeStyle='#f6eee0';g.lineWidth=3;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*(r-19),y+Math.sin(a)*(r-19));g.stroke();text(label,x,y+r*.42,12);text(Math.round(value),x,y+r*.7,16);g.restore()}
 function screen(x,y,w,h,kind,s,r){g.fillStyle='#101417';g.fillRect(x-9,y-9,w+18,h+18);g.strokeStyle='#889091';g.lineWidth=2;g.strokeRect(x-9,y-9,w+18,h+18);
 if(kind==='PFD'){attitude(x,y,w,h*.72,s);g.fillStyle='#18202b';g.fillRect(x,y+h*.72,w,h*.28);text(Math.round(r.speed)+' KT',x+w*.22,y+h*.87,15);text(Math.round(r.altitude)+' FT',x+w*.72,y+h*.87,15);text('HDG '+String(Math.round(r.heading)).padStart(3,'0'),x+w/2,y+h*.98,14,'#80e3cd')}
 else if(kind==='NAV'){g.fillStyle='#111e22';g.fillRect(x,y,w,h);g.strokeStyle='#678b80';g.beginPath();g.arc(x+w/2,y+h*.6,w*.38,0,Math.PI*2);g.stroke();g.save();g.translate(x+w/2,y+h*.6);g.rotate(s.yaw);for(const [t,dx,dy] of [['N',0,-w*.3],['E',w*.3,0],['S',0,w*.3],['W',-w*.3,0]])text(t,dx,dy,14);g.restore();text('▲',x+w/2,y+h*.62,23,'#f4e8bd');text('HDG '+Math.round(r.heading),x+w/2,y+22,15);text('AIRPORT  •  01 / 19',x+w/2,y+h-12,12)}
 else{g.fillStyle='#101b19';g.fillRect(x,y,w,h);text(kind,x+w/2,y+22,14);r.engines.forEach((value,i)=>{text('ENG '+(i+1)+'  '+value+'%',x+w/2,y+52+i*27,16,value?'#84eb9c':'#f0ba63')});text('FUEL '+Math.round(s.systems.fuel)+'%',x+w/2,y+h-18,14,'#94d6db')}
 // Bezel keys are visual only; existing touch controls remain the operable controls.
 for(let i=1;i<6;i++){g.fillStyle='#4d5152';g.fillRect(x+i*w/6-5,y+h+11,10,5)}
 }
 function paint(s){const r=cockpitReadings(s);g.fillStyle=deck.color;g.fillRect(0,0,1536,512);g.fillStyle='#222729';g.fillRect(0,0,1536,66);text(deck.name,768,25,19);text('HDG '+Math.round(r.heading)+'°    ALT '+Math.round(r.altitude)+' FT    V/S '+Math.round(r.vertical)+' FT/MIN',768,52,15,'#8df0bc');
 for(let x=20;x<1536;x+=140){g.fillStyle='#aaa99d';g.beginPath();g.arc(x,83,3,0,7);g.fill()}
 if(deck.analog){for(const offset of [70,1030]){gauge(offset+70,180,59,'AIRSPEED',r.speed,deck.classic?250:450,s);gauge(offset+220,180,59,'ATTITUDE',0,1,s);gauge(offset+370,180,59,'ALT FT',r.altitude%10000,10000,s);gauge(offset+70,335,59,'TURN',180+s.roll*60,360,s);gauge(offset+220,335,59,'HEADING',r.heading,360,s);gauge(offset+370,335,59,'V/S',Math.abs(r.vertical),4000,s)}r.engines.forEach((value,i)=>gauge(595+i*110,195,43,'ENG '+(i+1),value,100,s));text('FUEL '+Math.round(s.systems.fuel)+'%',768,310,22,'#a9dfa8');text(deck.classic?'THROTTLE  /  PROP  /  MIXTURE':'ENGINE INSTRUMENTS',768,360,16)}
 else if(deck.screens===6){screen(34,124,217,270,'PFD',s,r);screen(278,124,217,270,'NAV',s,r);screen(525,109,220,165,'ENGINES',s,r);screen(525,301,220,157,'SYSTEMS',s,r);screen(795,124,310,270,'NAV',s,r);screen(1140,124,350,270,'PFD',s,r)}
 else{const count=deck.screens,w=(1456-(count-1)*32)/count;for(let i=0;i<count;i++)screen(40+i*(w+32),121,w,284,i===0||count===4&&i===3?'PFD':i===1?'NAV':'ENGINES',s,r);if(deck.small)text('RPM '+Math.round(r.engines[0]*27)+'    FUEL '+Math.round(s.systems.fuel)+'%',1140,446,20,'#a9dfa8')}
 text('SIMULATED FLIGHT INSTRUMENTS',768,497,13,'#bac0be');texture.needsUpdate=true;
 }
 return {draw(renderer,s,dt){if(id!==s.aircraft)build(s.aircraft);clock+=dt;if(clock>=.1){paint(s);clock=0}for(const y of yokes){y.rotation.z=-s.roll*.45;y.rotation.x=s.pitch*.15}for(const l of levers)l.position.z=1.13-s.throttle*.2;camera.aspect=innerWidth/innerHeight;camera.fov=camera.aspect<1?85:58;camera.updateProjectionMatrix();renderer.autoClear=false;renderer.clearDepth();renderer.render(scene,camera);renderer.autoClear=true;},profile:()=>deck};
}
