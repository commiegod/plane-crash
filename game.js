import {LIGHT_HANDLING,lightAero,lightSteering} from './light-aircraft.js?v=groundfix-20261022';
import {stallCondition} from './stall-model.js';
import {assessImpact,assessTouchdown,fracturePanels,wreckGroundMotion,groundImpactRetention,assessScrape,terrainMeshHeight,supportBox,wreckSupportHeight} from './crash-model.js?v=groundfix-20261022';
import {createFleetMeshes} from './aircraft-meshes.js';
import {LIVERIES,CABINS,spawnPoint,taxiRoute,onPavement,buildingCollision,buildingContact,loadFactor} from './flight-config.js?v=groundfix-20261022';
import {createCabin,startIncident,tickCabin,cabinTotals} from './cabin.js?v=groundfix-20261022';
import {createSetup} from './setup-ui.js?v=fleet-20261028';
import {bindJoystick} from './joystick.js?v=groundfix-20261022';

import {createGraphics} from './graphics.js?v=fleet-20261028';
import {AIRCRAFT,getAircraft} from './aircraft-catalog.js?v=groundfix-20261022';
import {createSystems,activeFaults,triggerFailure,tickSystems,enginePower,thrustImbalance} from './failures.js';
'use strict';const canvas=document.getElementById('scene'),$=id=>document.getElementById(id);
const V=(x=0,y=0,z=0)=>({x,y,z}),add=(a,b)=>V(a.x+b.x,a.y+b.y,a.z+b.z),sub=(a,b)=>V(a.x-b.x,a.y-b.y,a.z-b.z),mul=(a,s)=>V(a.x*s,a.y*s,a.z*s),dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z,cross=(a,b)=>V(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x),len=a=>Math.hypot(a.x,a.y,a.z),norm=a=>mul(a,1/(len(a)||1)),mix=(a,b,t)=>add(mul(a,1-t),mul(b,t)),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function naturalGround(x,z){const base=14+Math.sin(x*.0028)*26+Math.cos(z*.0032)*24+Math.sin((x+z)*.005)*12;const away=Math.min(1,Math.max(0,(Math.abs(x)-250)/1600));const mountains=away*(150+180*Math.sin(x*.0009+z*.0006)**2+95*Math.sin(z*.002+x*.001)**2);return base+mountains}
function ground(x,z){const edgeX=clamp((Math.abs(x)-125)/170,0,1),edgeZ=Math.max(clamp((-1450-z)/180,0,1),clamp((z-2650)/180,0,1));const airportBlend=Math.max(clamp((-140-x)/170,0,1),clamp((x-1050)/170,0,1),clamp((250-z)/180,0,1),clamp((z-2400)/180,0,1));const blend=Math.min(Math.max(edgeX,edgeZ),airportBlend);return 10+(naturalGround(x,z)-10)*blend}
const graphics=createGraphics(canvas,ground);
let structuralEnabled=false,structuralModule=null,structuralModel=null,structuralSession=null,structuralIncident=false,structuralSeverity=0,structuralAirTime=0;
let aircraft='b747',gear=false,assist=false,mission='free',landingSpeed=0,landingSink=0,landingMessage=false,landingQuality='smooth';
const names=Object.fromEntries(AIRCRAFT.map(a=>[a.id,a.name]));
function spec(){return getAircraft(aircraft)}
let flapSetting=0,flaps=0,controlPitch=0,controlRoll=0,gearCompression=0,flapNotice=0;
let stall={severity:0,warning:false,stalled:false};
let scrape=null,wingDamage={left:0,right:0},wingDebris=[],wingWear={left:0,right:0};
let systems=createSystems(spec()),crashCause='GROUND CONTACT',crashFuel=100,crashProfile=null,crashGroups=[];
$('aircraft').innerHTML=AIRCRAFT.map(a=>'<option value="'+a.id+'"'+(a.id===aircraft?' selected':'')+'>'+a.name+'</option>').join('');
function clearance(){return spec().clearance}
function gearUI(){$('gear').disabled=(state==='crashed'||state==='paused'&&saved==='crashed')||!!spec().fixedGear||systems.gearJammed||onGround();$('gear').textContent=spec().fixedGear?'WHEELS FIXED':gear?'RAISE WHEELS':'LOWER WHEELS';$('assist').disabled=!!structuralSession||state!=='flight';$('assist').textContent=structuralSession?'MANUAL FLIGHT ONLY':assist?'LANDING HELP: ON':'HELP ME LAND';$('assist').setAttribute('aria-pressed',String(assist))}
let state='ready',saved='flight',pos=V(0,280,0),vel=V(0,0,80),pitch=0,roll=0,yaw=0,throttle=.65,elapsed=0,impact=0,debris=[],dust=[],camera=V(0,294,-65),target=V(0,280,25),last=0,engine=null,audio=null,muted=true,flight=1,impactPos=V();const keys={};let stick={x:0,y:0};const joystick=bindJoystick($('joystick'),a=>{stick=a});
function rotate(v,p=0,r=0,y=0){let a=V(v.x*Math.cos(r)-v.y*Math.sin(r),v.x*Math.sin(r)+v.y*Math.cos(r),v.z);a=V(a.x,a.y*Math.cos(p)+a.z*Math.sin(p),-a.y*Math.sin(p)+a.z*Math.cos(p));return V(a.x*Math.cos(y)+a.z*Math.sin(y),a.y,-a.x*Math.sin(y)+a.z*Math.cos(y))}
function box(cx,cy,cz,sx,sy,sz,color){const verts=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(v=>V(cx+v[0]*sx/2,cy+v[1]*sy/2,cz+v[2]*sz/2));return{verts,faces:[[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]],color}}
function body(cz,length,r,color){const verts=[];for(let j=0;j<3;j++){const z=cz+(j-1)*length/2;const radius=j===2?r*.38:r;for(let i=0;i<10;i++){const a=i/10*Math.PI*2;verts.push(V(Math.cos(a)*radius,Math.sin(a)*radius,z))}}const faces=[];for(let j=0;j<2;j++)for(let i=0;i<10;i++)faces.push([j*10+i,j*10+(i+1)%10,(j+1)*10+(i+1)%10,(j+1)*10+i]);faces.push([...Array(10)].map((_,i)=>i));faces.push([...Array(10)].map((_,i)=>20+i));return{verts,faces,color}}
const trainerMeshes=[body(2,15,1.35,[209,215,213]),body(-8,6,.95,[160,174,180]),box(-7,0,-.8,12,.32,3.6,[192,204,207]),box(7,0,-.8,12,.32,3.6,[192,204,207]),box(-3,-.05,-10,5,.22,2.3,[153,171,182]),box(3,-.05,-10,5,.22,2.3,[153,171,182]),box(0,1.8,-10,.22,3.8,3,[69,99,116]),box(-5,-1.05,1,1.6,1.5,4,[68,83,89]),box(5,-1.05,1,1.6,1.5,4,[68,83,89]),box(0,1.12,6.4,1.6,.38,2.5,[32,66,79]),box(-9,.2,-.8,1.3,.08,3.6,[214,94,50]),box(9,.2,-.8,1.3,.08,3.6,[214,94,50])];
function translateMesh(mesh,x,y,z){return {...mesh,verts:mesh.verts.map(v=>add(v,V(x,y,z)))}}
function sweptWing(side,span,z,color){const verts=[V(side*1.5,0,z+3),V(side*span,.8,z-4),V(side*span,.8,z-6),V(side*1.5,0,z-3)];return {verts:[...verts,...verts.map(v=>add(v,V(0,-.3,0)))],faces:[[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3]],color}}
function fin(z,color){return{verts:[V(-.2,0,z+3),V(-.2,7,z-1),V(-.2,7,z-4),V(-.2,0,z-5),V(.2,0,z+3),V(.2,7,z-1),V(.2,7,z-4),V(.2,0,z-5)],faces:[[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2]],color}}
function engineMesh(x,y,z){return translateMesh(body(0,4,1.05,[99,114,123]),x,y,z)}
function airliner(type){const jumbo=type==='b747',span=jumbo?22:18,radius=jumbo?2.15:1.8,tail=jumbo?-18:-16;
const m=[body(1,jumbo?31:27,radius,[215,219,215]),body(tail+1,6,radius*.65,[185,193,196]),sweptWing(-1,span,-1,[173,186,193]),sweptWing(1,span,-1,[173,186,193]),sweptWing(-1,8,tail+1,[119,144,161]),sweptWing(1,8,tail+1,[119,144,161]),fin(tail,[53,92,125]),engineMesh(-7,-1.6,0),engineMesh(7,-1.6,0),box(0,radius*.9,jumbo?13:11,2.4,.45,2,[31,64,80])];
if(jumbo){m.push(engineMesh(-14,-1.3,-2.8),engineMesh(14,-1.3,-2.8));m.push(translateMesh(body(7,13,1.3,[219,223,220]),0,1.3,0))}else{m.push(engineMesh(0,3.7,tail+1));m.push(box(0,2.2,tail+2,.45,2,4,[169,184,193]))}
for(const side of [-1,1]){m.push(box(side*(radius-.08),.25,1,.14,.42,jumbo?24:21,[42,104,148]));m.push(box(side*(span-1),.85,-5,1.4,.13,2,[216,105,49]))}return m}
let parts=[];
function buildAircraft(){const factories={fleet:()=>createFleetMeshes(spec()),twin:()=>trainerMeshes,dc10:()=>airliner('dc10'),b747:()=>airliner('b747')};const factory=factories[spec().geometry];if(!factory)throw new Error('Unregistered aircraft geometry: '+spec().geometry);const meshes=factory();parts=meshes.map(mesh=>{const c=mul(mesh.verts.reduce((a,b)=>add(a,b),V()),1/mesh.verts.length);return{...mesh,center:c,verts:mesh.verts.map(v=>sub(v,c))}})}
buildAircraft();
let lastEngineGauges='';
let currentConfig=null,livery=LIVERIES[0],cabin=createCabin(0,0),massFactor=1,parking=true,taxiAssist=false,route=[],pushRemaining=0,reportShown=false,tripSeconds=0;
function resetTrip(){structuralSession=null;structuralIncident=false;structuralSeverity=0;structuralAirTime=0;wingWear={left:0,right:0};wingDamage={left:0,right:0};wingDebris=[];flapSetting=0;flaps=0;controlPitch=0;controlRoll=0;gearCompression=0;flapNotice=0;stall={severity:0,warning:false,stalled:false};
 const c=CABINS[aircraft],p=currentConfig?.passengers??0;cabin=createCabin(p,currentConfig?c.crew:0);massFactor=currentConfig?loadFactor(aircraft,p,currentConfig.fuel):1;
 parking=true;taxiAssist=false;route=[];pushRemaining=0;reportShown=false;tripSeconds=0;crashProfile=null;crashGroups=[];scrape=null;$('report-content').innerHTML='';
}
function startConfigured(config){
 currentConfig={...config};aircraft=config.aircraft;livery=LIVERIES.find(l=>l.id===config.livery)||LIVERIES[0];begin(config.mode==='approach'?'approach':'free');systems.fuel=config.fuel;massFactor=loadFactor(aircraft,config.passengers,config.fuel);
 if(config.mode==='departure'){
 const spawn=spawnPoint(config);pos=V(spawn.x,10+clearance(),spawn.z);yaw=spawn.yaw;pitch=0;roll=0;vel=V();throttle=0;gear=true;assist=false;state=config.start==='gate'?'parked':'taxi';parking=true;
 }else if(config.mode==='approach'&&config.runway==='19'){pos=V(0,82,3400);yaw=Math.PI;vel=V(0,-3.6,-approachTarget())}
 else if(config.mode!=='approach'){pos=V(0,320,-300);vel=V(0,0,(spec().approachSpeed||72)*1.12)}
 $('pilot-help').classList.add('hidden');$('extra-controls').classList.add('hidden');$('more-controls').setAttribute('aria-expanded','false');$('settings').classList.add('hidden');$('failures').classList.add('hidden');$('failure-toggle').setAttribute('aria-expanded','false');$('settings-toggle').setAttribute('aria-expanded','false');if(config.mode==='sandbox'){$('failures').classList.remove('hidden');$('failure-toggle').setAttribute('aria-expanded','true')}graphics.resetCamera();gearUI();
}
function onGround(){const phase=state==='paused'?saved:state;return ['parked','pushback','taxi','landed'].includes(phase)}
function startPushback(){if(state!=='parked')return;parking=false;throttle=0;state='pushback';pushRemaining=70;clearKeys();gearUI()}
function stopPushback(){if(state!=='pushback')return;state='taxi';pushRemaining=0;parking=false;taxiAssist=false;route=[];vel=V();throttle=0;clearKeys();gearUI()}
function setThrottle(value){if(!['taxi','flight','landed'].includes(state))return;taxiAssist=false;assist=false;throttle=clamp(Number(value)/100,0,1)}
function cycleFlaps(){
 const h=LIGHT_HANDLING[aircraft];if(!h||!['flight','taxi','landed','parked'].includes(state))return;
 const next=(flapSetting+1)%3;
 if(next>flapSetting&&len(vel)>h.flapLimit){flapNotice=3;return}
 flapSetting=next;assist=false;
}
$('flaps').onclick=cycleFlaps;
function airborneThrust(){return Math.min(LIGHT_HANDLING[aircraft]?.airThrust||9,spec().thrust)}
function aero(){return lightAero(aircraft,flaps,gear)}
function approachTarget(){return (spec().approachSpeed||72)*aero().liftScale*Math.sqrt(massFactor)}
function rotationTarget(){if(structuralEnabled&&structuralModel?.profile?.id===aircraft)return structuralModel.profile.rotationSpeed;return (spec().takeoffSpeed||65)*aero().rotationScale*Math.sqrt(massFactor)}
function headingDegrees(angle){return ((Math.round(angle*180/Math.PI)%360)+360)%360}
function enginePercent(e){return systems.fuel>0&&e.running&&!e.onFire&&!['crashed','ready'].includes(state==='paused'?saved:state)?Math.round(throttle*100):0}
function toggleTaxi(){if(state!=='taxi')return;if(taxiAssist){taxiAssist=false;throttle=0;return}parking=false;taxiAssist=true;const g=spawnPoint({...currentConfig,start:'gate'});route=taxiRoute(g,currentConfig?.runway||'01');throttle=.25}
// Approximate the three gear contact patches; mixed surfaces blend rolling resistance.
function groundSurface(){
 const span=spec().visual?.span||(aircraft==='b747'?59:aircraft==='dc10'?50:20),length=spec().visual?.length||(aircraft==='b747'?64:aircraft==='dc10'?55:28);
 const track=clamp(span*.12,.8,7),wheelbase=clamp(length*.28,1.8,16);
 const patches=[[-track,-wheelbase*.2],[track,-wheelbase*.2],[0,wheelbase*.8]];
 const grass=patches.reduce((n,[x,z])=>{const q=rotate(V(x,0,z),0,0,yaw);return n+(onPavement(pos.x+q.x,pos.z+q.z)?0:1)},0)/3;
 return {grass,resistance:.7+grass*2.3,drag:grass*.0007};
}
// Flat grass is a surface, not a collision.
function terrainUnsafe(x,z,speed=0,heading=yaw){
 const gx=(ground(x+3,z)-ground(x-3,z))/6,gz=(ground(x,z+3)-ground(x,z-3))/6;
 return Math.hypot(gx,gz)>.65;
}
function contactBuilding(dt){
 const radius=spec().visual?Math.min(spec().visual.span/2,spec().visual.length*.35):spec().geometry==='twin'?10:23;
 const hit=buildingContact(pos,radius);if(!hit)return false;
 const into=Math.max(0,-vel.x*hit.nx-vel.z*hit.nz);
 const contact={x:pos.x+hit.nx*(hit.depth-radius),y:pos.y,z:pos.z+hit.nz*(hit.depth-radius)};
 if(into>16){crash(false,'BUILDING COLLISION',into,contact);return true;}
 scrape={...contact,nx:hit.nx,nz:hit.nz,normalSpeed:into,life:.18,speed:len(vel)};
 pos.x+=hit.nx*(hit.depth+.05);pos.z+=hit.nz*(hit.depth+.05);
 vel.x=(vel.x+hit.nx*into)*Math.exp(-dt*.6);vel.z=(vel.z+hit.nz*into)*Math.exp(-dt*.6);
 taxiAssist=false;if(state==='pushback'){state='taxi';pushRemaining=0;}
 if(into>2&&state!=='flight')throttle=0;
 return false;
}
function contactTerrain(){
 if(!terrainUnsafe(pos.x,pos.z))return false;
 if(len(vel)>14){crash(false,'ROUGH TERRAIN IMPACT',Math.min(len(vel),22));return true;}
 throttle=0;vel=V();taxiAssist=false;if(state==='pushback'){state='taxi';pushRemaining=0;parking=true;gearUI();}return true;
}
function groundStep(dt){
 if(tickSystems(systems,dt,state==='pushback'?0:throttle,spec())){crash(false,'FIRE DAMAGE');return}
 if(state==='parked'){vel=V();throttle=0;return}
 if(state==='pushback'){
 if(parking||keys.brake){vel=V();return}
 const turn=clamp((keys.right?1:0)-(keys.left?1:0)+stick.x,-1,1);yaw-=turn*dt*.45*(systems.controlsFailed?.18:1);
 const distance=Math.min(pushRemaining,10*dt),back=rotate(V(0,0,-1),0,0,yaw);vel=mul(back,10);pos=add(pos,mul(back,distance));pushRemaining-=distance;
 pos.y=ground(pos.x,pos.z)+clearance();if(contactTerrain())return;if(contactBuilding(dt))return;
 if(pushRemaining<=.001){state='taxi';vel=V();parking=true}return;
 }
 const turn=clamp((keys.right?1:0)-(keys.left?1:0)+stick.x,-1,1),pull=clamp((keys.down?1:0)-(keys.up?1:0)+stick.y,-1,1);
 if(turn||pull||keys.less||keys.more||keys.brake||activeFaults(systems)){taxiAssist=false}
 if(taxiAssist&&route.length){
 const next=route[0],dx=next.x-pos.x,dz=next.z-pos.z,dist=Math.hypot(dx,dz),want=Math.atan2(dx,dz),diff=Math.atan2(Math.sin(want-yaw),Math.cos(want-yaw));
 yaw+=clamp(diff,-dt*.5,dt*.5);const speed=Math.abs(diff)<.15?Math.min(7,dist/dt):0;vel=V(Math.sin(yaw)*speed,0,Math.cos(yaw)*speed);pos=add(pos,mul(vel,dt));throttle=.25;
 if(dist<.4){pos.x=next.x;pos.z=next.z;route.shift();if(!route.length){yaw=currentConfig?.runway==='19'?Math.PI:0;parking=true;taxiAssist=false;throttle=0;vel=V()}}
 }else{
 throttle=clamp(throttle+((keys.more?1:0)-(keys.less?1:0))*dt*.35,0,1);const speed=len(vel);
 yaw+=lightSteering(aircraft,turn,speed)*dt*(systems.controlsFailed?.18:1);
 const brake=parking?12:keys.brake?(LIGHT_HANDLING[aircraft]?.braking||9):0,power=parking||keys.brake?0:throttle*spec().thrust*enginePower(systems)/massFactor;
 const surface=groundSurface(),rolling=surface.resistance+(state==='landed'&&throttle===0?(1-surface.grass)*2.5:0);
 const next=Math.max(0,speed+(power-(aero().drag+surface.drag)*speed*speed-rolling-brake)*dt);
 vel=V(Math.sin(yaw)*next,0,Math.cos(yaw)*next);pos=add(pos,mul(vel,dt));
 const rotateSpeed=rotationTarget();pitch=clamp(pitch+pull*dt*.2,0,.2);if(!pull)pitch*=Math.exp(-dt*2);
 if(next>=rotateSpeed&&pitch>.06&&onPavement(pos.x,pos.z)&&!parking&&!keys.brake){state='flight';landingMessage=false;reportShown=false;$('panel').classList.add('hidden');stall={severity:0,stalled:false,warning:false,alpha:0};vel.y=Math.max(3,next*Math.sin(pitch));pos.y+=1;parking=false;return}
 }
 pos.y=ground(pos.x,pos.z)+clearance();roll=0;if(state==='landed'&&!onPavement(pos.x,pos.z))state='taxi';
 if(contactBuilding(dt))return;
 contactTerrain();
}
function showReport(safe=false){
 reportShown=true;const t=cabinTotals(cabin);$('tag').textContent=safe?'LANDING REPORT · SAFE TOUCHDOWN':(cabin.final?'INCIDENT REPORT · FINAL':'INCIDENT REPORT · IN PROGRESS');$('title').textContent=safe?'Safe landing.':'Flight outcome';
 $('copy').textContent=safe?`${landingQuality==='hard'?'Hard landing':'Smooth touchdown'} at ${Math.round(landingSpeed*1.944)} kt, ${landingSink.toFixed(1)} m/s descent.`:`${crashCause} · ${Math.round(impact*1.944)} kt at latest impact. ${crashProfile?.label||'Impact damage'}.`;
 $('report-content').innerHTML=`<p>${cabin.passengers} passengers + ${cabin.crew} crew · ${cabin.total} aboard</p><div class="report-totals"><div><b>${t.survivors}</b>SURVIVORS</div><div><b>${t.injured}</b>INJURED SURVIVORS</div><div><b>${t.fatalities}</b>FATALITIES</div></div><table class="report-table"><thead><tr><th>Cabin</th><th>Aboard</th><th>Survived</th><th>Fatalities</th></tr></thead><tbody>${cabin.sections.map(s=>`<tr><td>${s.name}</td><td>${s.occupants}</td><td>${s.survivors}</td><td>${s.fatalities}</td></tr>`).join('')}</tbody></table><p>${safe?(wingDamage.left||wingDamage.right||activeFaults(systems)?'Emergency landing completed with aircraft damage.':'Airframe intact.'):`Cabin damage ${Math.round(cabin.sections.reduce((a,s)=>a+s.damage,0)/3*100)}% · Fire exposure ${Math.round(cabin.fire*100)}% · Exit availability ${Math.round(cabin.exits*100)}%.`}</p>`;
 $('instructions').textContent=!safe&&!cabin.final?'Aircraft still moving. These provisional totals may change after another impact.':'Fictional game outcomes, not real-world survival estimates.';$('start').textContent='NEW FLIGHT →';$('panel').classList.remove('hidden');
}

function clearKeys(){controlPitch=0;controlRoll=0;joystick.reset();for(const k in keys)keys[k]=false;document.querySelectorAll('.active').forEach(b=>b.classList.remove('active'))}
addEventListener('resize',clearKeys);
function begin(type=mission){mission=typeof type==='string'?type:mission;resetTrip();if(LIGHT_HANDLING[aircraft]&&mission==='approach'){flapSetting=2;flaps=1;}state='flight';pos=mission==='approach'?V(0,82,-1000):V(0,280,0);vel=mission==='approach'?V(0,-3.6,approachTarget()):V(0,0,(spec().approachSpeed||72)*1.12);pitch=mission==='approach'?-.05:0;roll=0;yaw=0;throttle=mission==='approach'?.49:.65;gear=!!spec().fixedGear||mission==='approach';assist=mission==='approach';elapsed=0;impact=0;landingMessage=false;systems=createSystems(spec());crashCause='GROUND CONTACT';crashFuel=100;systemsUI(true);debris=[];dust=[];buildAircraft();camera=add(pos,V(0,18,spec().geometry==='twin'?-65:-92));target=add(pos,V(0,0,25));clearKeys();graphics.resetCamera();$('panel').classList.add('hidden');$('pause').textContent='PAUSE';gearUI();canvas.focus()}
function pause(){if(['flight','crashed','landed','parked','pushback','taxi'].includes(state)){saved=state;state='paused';clearKeys();$('pause').textContent='RESUME'}else if(state==='paused'){state=saved;$('pause').textContent='PAUSE'}}$('aircraft').onchange=async()=>{const id=$('aircraft').value;if(structuralEnabled){state='ready';try{await prepareStructure(id)}catch(e){console.error(e);$('notice').textContent='Aircraft could not load. Choose it again.';return;}}aircraft=id;begin()};$('airport-tour').onclick=()=>{begin('free');pos=V(540,190,350);vel=V(0,0,72);throttle=.5;graphics.resetCamera()};$('daylight').onclick=()=>{$('daylight').textContent=graphics.nextLighting()};$('approach').onclick=()=>begin('approach');$('gear').onclick=()=>{if(!spec().fixedGear&&!systems.gearJammed&&!onGround()){gear=!gear;assist=false;gearUI()}};$('assist').onclick=()=>{assist=!activeFaults(systems)&&!assist;gearUI()};$('dive').onclick=()=>{begin('free');pitch=-.7};$('start').onclick=()=>setup.open();$('camera').onclick=()=>{$('camera').textContent='VIEW: '+graphics.nextCamera(!!structuralSession)};$('reset').onclick=()=>{flight++;if(currentConfig)startConfigured(currentConfig);else begin()};$('pause').onclick=pause;$('cut').onclick=()=>{throttle=0};
function sound(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();if(!engine){const o=audio.createOscillator(),g=audio.createGain();o.type='sawtooth';o.connect(g);g.connect(audio.destination);g.gain.value=0;o.start();engine={o,g}}}catch{}}$('audio').onclick=()=>{muted=!muted;if(!muted)sound();$('audio').textContent=muted?'SOUND OFF':'SOUND ON'};
const map={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',q:'less',e:'more'};addEventListener('keydown',e=>{if(state==='ready'||['SELECT','INPUT','BUTTON'].includes(e.target?.tagName))return;if(e.key.startsWith('Arrow')||e.key===' ')e.preventDefault();const k=map[e.key]||map[e.key.toLowerCase()];if(k)keys[k]=true;if(e.key===' '){throttle=0;keys.brake=true;}if(e.key.toLowerCase()==='f'&&!e.repeat)cycleFlaps();if(e.key.toLowerCase()==='g'&&!e.repeat&&!spec().fixedGear&&!systems.gearJammed&&!onGround()){gear=!gear;assist=false;gearUI()}if(e.key.toLowerCase()==='c'&&!e.repeat){$('camera').textContent='VIEW: '+graphics.nextCamera(!!structuralSession)}if(e.key.toLowerCase()==='p'&&!e.repeat)pause();if(e.key.toLowerCase()==='r'&&!e.repeat){flight++;begin()}if(e.key==='Enter'&&state==='ready')begin()});addEventListener('keyup',e=>{const k=map[e.key]||map[e.key.toLowerCase()];if(k)keys[k]=false;if(e.key===' ')keys.brake=false});addEventListener('blur',()=>{if(['flight','crashed','landed','parked','pushback','taxi'].includes(state))pause();clearKeys()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&(['flight','crashed','landed','parked','pushback','taxi'].includes(state)))pause()});for(const b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true;if(b.dataset.key==='brake')throttle=0;b.classList.add('active')};for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{keys[b.dataset.key]=false;b.classList.remove('active')})}
function syncWreck(){
 for(const d of debris){const g=crashGroups[d.group];d.pos=add(g.pos,rotate(sub(d.part.center,g.center),g.p,g.r,g.y));d.body=g;d.vel=g.vel;d.p=g.p;d.r=g.r;d.y=g.y;d.hitGround=g.hitGround;d.rest=g.rest;}
}
function crash(airborne=false,cause='GROUND CONTACT',contactSpeed=null,contactPoint=null){
 if(structuralSession){structuralSession.breakup();recordStructuralIncident(cause,1);return;}
 if(state==='crashed')return;
 crashProfile=assessImpact({speed:contactSpeed??len(vel),sink:vel.y,bank:roll,pitch,airborne,gear,cause,fuel:systems.fuel});
 crashProfile.contactPoint=contactPoint;
 crashCause=crashProfile.mode==='intact'&&cause==='GROUND CONTACT'?crashProfile.label:cause;
 startIncident(cabin,{speed:len(vel),sink:vel.y,bank:roll,airborne,fire:crashProfile.fire,gear,cause,damage:crashProfile});
 reportShown=false;$('panel').classList.add('hidden');landingMessage=false;state='crashed';crashFuel=systems.fuel;assist=false;throttle=0;gearUI();impact=len(vel);impactPos={...pos};
 if(crashProfile.mode==='fragmented')parts=fracturePanels(parts);
 const assignments=parts.map((p,i)=>crashProfile.mode==='intact'?0:crashProfile.mode==='fragmented'?i:(p.kind==='aft'||p.kind==='tail'||p.kind==='fin'||(!p.kind&&[1,4,5,6].includes(i))?1:p.kind==='wing'||p.kind==='winglet'||p.kind==='engine'||(!p.kind&&[2,3,7,8,10,11].includes(i))?2:0));
 crashGroups=[];debris=[];
 for(const id of [...new Set(assignments)]){
 const members=parts.filter((p,i)=>assignments[i]===id),center=mul(members.reduce((a,p)=>add(a,p.center),V()),1/members.length),local=rotate(center,pitch,roll,yaw),spread=crashProfile.mode==='fragmented'?Math.min(18,impact*.18):crashProfile.mode==='sections'?3:0;
 const g={center,pos:add(pos,local),vel:add(vel,V((Math.random()-.5)*spread,airborne?(Math.random()-.5)*spread:0,(Math.random()-.5)*spread)),p:pitch,r:roll,y:yaw,spin:crashProfile.mode==='intact'?V():V((Math.random()-.5)*spread*.15,(Math.random()-.5)*spread*.1,(Math.random()-.5)*spread*.15),rest:false,hitGround:false,members};
 // Contact height follows the underside of this rigid assembly, not a fixed point.
 g.support=supportBox(members.flatMap(p=>p.verts.map(v=>sub(add(v,p.center),center))));g.bottom=Math.min(...members.flatMap(p=>p.verts.map(v=>v.y+p.center.y-center.y)));g.contact=Math.max(.15,-g.bottom);crashGroups[id]=g;
 if(!airborne&&g.pos.y<=ground(g.pos.x,g.pos.z)+g.contact+.15){const retention=groundImpactRetention(crashProfile.mode,vel.y,Math.hypot(g.vel.x,g.vel.z));const wall=cause==='BUILDING COLLISION'?.35:1;g.vel.x*=retention*wall;g.vel.z*=retention*wall;g.pos.y=Math.max(g.pos.y,ground(g.pos.x,g.pos.z)+g.contact);g.vel.y=0;g.hitGround=true;}
 }
 for(let i=0;i<parts.length;i++)debris.push({part:parts[i],group:assignments[i]});syncWreck();elapsed=0;clearKeys();
 if(!muted&&audio){const buffer=audio.createBuffer(1,Math.floor(audio.sampleRate*.5),audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const src=audio.createBufferSource(),g=audio.createGain();src.buffer=buffer;g.gain.value=.08+crashProfile.severity*.22;src.connect(g);g.connect(audio.destination);src.start();}
 if(crashGroups.some(g=>g?.hitGround))tickCabin(cabin,0,true,false);
}
function updateImpactOutcome(g,damage,cause){
 if(damage.severity<=crashProfile.severity)return;
 crashProfile={...crashProfile,severity:damage.severity,fire:Math.max(crashProfile.fire,damage.fire)};debris=debris.map(d=>({...d}));
 startIncident(cabin,{speed:len(g.vel),sink:g.vel.y,bank:g.r,airborne:false,fire:crashProfile.fire,gear:false,cause,damage});
}
function stepWreck(dt){
 for(const g of crashGroups){if(!g||g.rest)continue;const wasGrounded=g.hitGround,oldPos={...g.pos};
 if(crashProfile.mode==='intact'&&g.hitGround){
  const speed=Math.hypot(g.vel.x,g.vel.z),turn=clamp((keys.right?1:0)-(keys.left?1:0)-stick.x,-1,1),angle=turn*.16*clamp(speed/40,0,1)*dt*(systems.controlsFailed?.2:1);
  g.vel=rotate(g.vel,0,0,angle);g.y+=angle;
  // Damaged gear has little braking authority; aerodynamic drag still helps.
  if(keys.brake){const factor=Math.max(0,speed-(crashProfile.gearCollapsed?1.4:7)*dt)/(speed||1);g.vel.x*=factor;g.vel.z*=factor;}
 }
 g.vel.y-=9.81*dt;g.pos=add(g.pos,mul(g.vel,dt));
 g.p+=g.spin.x*dt;g.r+=g.spin.y*dt;g.y+=g.spin.z*dt;
 const bottom=Math.min(...g.members.flatMap(p=>p.verts.map(v=>rotate(sub(add(v,p.center),g.center),g.p,g.r,g.y).y)));
 const gy=wreckSupportHeight(g.support,g.pos,g.p,g.r,g.y,ground);
 if(g.pos.y<=gy||g.hitGround){if(!g.hitGround){if(crashProfile.mode==='intact'&&g.vel.y < -8){pos=sub(g.pos,rotate(g.center,g.p,g.r,g.y));vel={...g.vel};pitch=g.p;roll=g.r;yaw=g.y;state='flight';crash(false,'GROUND CONTACT');return;}if(g.members.some(p=>p.cabin||p===parts[0]||p===parts[1]))updateImpactOutcome(g,assessImpact({speed:len(g.vel),sink:g.vel.y,bank:g.r,pitch:g.p,gear:false,fuel:crashFuel}),'SECONDARY GROUND IMPACT');const retention=groundImpactRetention(crashProfile.mode,g.vel.y,Math.hypot(g.vel.x,g.vel.z));g.vel.x*=retention;g.vel.z*=retention;}g.hitGround=true;g.pos.y=gy;g.vel.y=0;
 const sp=Math.hypot(g.vel.x,g.vel.z),motion=wreckGroundMotion(sp,dt,crashProfile.mode,onPavement(g.pos.x,g.pos.z)),next=motion.speed;if(wasGrounded){g.pos.x=oldPos.x+g.vel.x/(sp||1)*motion.distance;g.pos.z=oldPos.z+g.vel.z/(sp||1)*motion.distance;g.pos.y=wreckSupportHeight(g.support,g.pos,g.p,g.r,g.y,ground);}g.vel.x*=next/(sp||1);g.vel.z*=next/(sp||1);g.spin=mul(g.spin,Math.exp(-dt*5));
 if(crashProfile.mode==='intact'){g.p*=Math.exp(-dt*3);g.r*=Math.exp(-dt*3);}
 g.pos.y=Math.max(g.pos.y,wreckSupportHeight(g.support,g.pos,g.p,g.r,g.y,ground));if(next<.25){g.rest=true;g.vel=V();g.spin=V()}}
 }
 // An intact skid can still hit a building. Rebuild the wreck from that impact.
 const body=crashGroups[0];
 if(body&&crashProfile.mode==='intact'&&!body.rest){
  const hit=buildingContact(body.pos,spec().visual?.radius||2);
  if(hit){const into=Math.max(0,-body.vel.x*hit.nx-body.vel.z*hit.nz);body.pos.x+=hit.nx*(hit.depth+.1);body.pos.z+=hit.nz*(hit.depth+.1);
   if(into>16){pos=sub(body.pos,rotate(body.center,body.p,body.r,body.y));vel={...body.vel};pitch=body.p;roll=body.r;yaw=body.y;state='flight';crash(false,'BUILDING COLLISION',into);return;}
   body.vel.x+=hit.nx*into;body.vel.z+=hit.nz*into;
  }
 }
 syncWreck();const center=crashGroups[0]?.pos||impactPos;const scale=spec().visual?Math.max(.4,spec().visual.length/34):1;
 const angle=yaw+Math.min(elapsed*.04,.5);camera=mix(camera,add(center,V(Math.sin(angle)*46*scale,18*scale,-Math.cos(angle)*46*scale)),1-Math.exp(-dt*1.2));camera.y=Math.max(camera.y,ground(camera.x,camera.z)+5);if(buildingCollision(camera,3))camera.y=Math.max(camera.y,85);target=mix(target,center,1-Math.exp(-dt*2));
 const cabinBodies=crashGroups.filter(g=>g&&g.members.some(p=>p.cabin||p===parts[0]||p===parts[1]));
 tickCabin(cabin,dt,cabinBodies.some(g=>g.hitGround),cabinBodies.length>0&&cabinBodies.every(g=>g.rest));
 if(body){pos=sub(body.pos,rotate(body.center,body.p,body.r,body.y));yaw=body.y;}
 if(reportShown&&!$('panel').classList.contains('hidden'))showReport(false);
}
function touchdown(){const runway=Math.abs(pos.x)<29&&pos.z>=0&&pos.z<2400;landingQuality=assessTouchdown({sink:vel.y,bank:roll,pitch,gear,speed:len(vel),lateral:vel.x*Math.cos(yaw)-vel.z*Math.sin(yaw),approach:spec().approachSpeed||72,blocked:!!buildingCollision(pos,spec().visual?Math.min(spec().visual.span/2,spec().visual.length*.35):spec().geometry==='twin'?10:23)||terrainUnsafe(pos.x,pos.z,len(vel))});if(!['smooth','hard'].includes(landingQuality)){crash();return}state=runway?'landed':'taxi';landingMessage=true;reportShown=false;$('panel').classList.add('hidden');parking=false;landingSpeed=len(vel);landingSink=Math.abs(vel.y);pos.y=ground(pos.x,pos.z)+clearance();vel.y=0;gearCompression=LIGHT_HANDLING[aircraft]?Math.min(LIGHT_HANDLING[aircraft].stroke,landingSink*.035):0;pitch=LIGHT_HANDLING[aircraft]?clamp(pitch,0,.12):0;roll=0;throttle=0;assist=false;elapsed=0;clearKeys();gearUI()}
// Wing contact is independent of the fuselage landing envelope.
function wingEnvelope(){return spec().visual||{span:aircraft==='b747'?64.4:50.4,wingY:-1,sweep:9,length:60};}
function terrainScrape(point,depth,wear,dt,part){
 const dx=(ground(point.x+1,point.z)-ground(point.x-1,point.z))/2,dz=(ground(point.x,point.z+1)-ground(point.x,point.z-1))/2;
 const normalSpeed=Math.max(0,(dx*vel.x+dz*vel.z-vel.y)/Math.hypot(dx,1,dz)),speed=len(vel);
 scrape={x:point.x,y:ground(point.x,point.z)+.08,z:point.z,normalSpeed,speed,life:.12,terrain:true,part};
 return assessScrape({normalSpeed,depth,speed,wear,dt});
}
function contactEngines(dt){
 for(const e of systems.engines){
  // Underwing nacelles only; propeller and tail-engine contact needs a different envelope.
  if(e.position.y>=0||Math.abs(e.position.x)<(spec().visual?.radius||2))continue;
  const side=e.position.x<0?'left':'right';if(Math.abs(e.position.x)>wingEnvelope().span/2*(1-wingDamage[side]))continue;
  const point=add(pos,rotate(V(e.position.x,e.position.y-(spec().visual?.engineRadius||.9),e.position.z),pitch,roll,yaw)),depth=ground(point.x,point.z)-point.y;
  if(depth<=0)continue;
  const result=terrainScrape(point,depth,e.scrapeWear||0,dt,'engine');e.scrapeWear=result.wear;
  if(result.breaks){e.running=false;e.contactDamaged=true;assist=false;systems.message='ENGINE CONTACT DAMAGE · PREPARE TO LAND';}
 }
}
function contactWings(dt){
 // Terrain is bounded below 501 m; no wing can reach it above this envelope.
 if(pos.y>700+Math.abs(vel.y)*dt)return false;
 const v=wingEnvelope(),half=v.span/2;
 for(const side of [-1,1]){
  const key=side<0?'left':'right',remaining=1-wingDamage[key];let innermost=2,contact=null,depth=0;
  // Span and chord samples, swept through the previous physics step.
  for(let f=.34;f<=remaining+.001;f+=.04)for(const chord of [-.7,0,.7])for(const t of [0,.5,1]){
   const local=V(side*half*f,v.wingY+.35*f*f-.12,-v.sweep*f+chord*(v.length*.09)*(1-.65*f));
   const point=add(add(pos,mul(vel,-dt*t)),rotate(local,pitch,roll,yaw));
   const penetration=ground(point.x,point.z)-point.y;if(penetration>0){innermost=Math.min(innermost,f);if(penetration>depth){depth=penetration;contact=point;}}
  }
  if(innermost>1)continue;
  const result=terrainScrape(contact,depth,wingWear[key],dt,'wing');wingWear[key]=result.wear;
  if(!result.breaks){roll+=side*dt*.25;continue;}
  if(len(vel)<8){vel=V();parking=true;continue;}
  if(innermost<.43){crash(false,'WING ROOT IMPACT');return true;}
  const remain=innermost>.76?.72:.40;
  if(remain>=remaining)continue;
  const center=V(side*half*(remaining+remain)/2,v.wingY,-v.sweep*(remaining+remain)/2);
  wingDebris.push({side,cut:half*remain,center,pos:add(pos,rotate(center,pitch,roll,yaw)),vel:{...vel},p:pitch,r:roll,y:yaw,rest:false});
  wingDamage[key]=1-remain;assist=false;
  for(const e of systems.engines)if(side*e.position.x>half*remain)e.running=false;
  systems.message=(side<0?'LEFT':'RIGHT')+' WING DAMAGED';
 }
 return false;
}
function stepWingDebris(dt){for(const d of wingDebris){if(d.rest)continue;d.vel.y-=9.81*dt;d.pos=add(d.pos,mul(d.vel,dt));const floor=wreckSupportHeight(d.support||[{x:0,y:-.3,z:0}],d.pos,d.p,d.r,d.y,ground);if(d.pos.y<=floor){d.pos.y=floor;d.vel.y=0;const speed=Math.hypot(d.vel.x,d.vel.z),motion=wreckGroundMotion(speed,dt,'sections',Math.abs(d.pos.x)<30&&d.pos.z>-1450&&d.pos.z<2650),factor=motion.speed/Math.max(.001,speed);d.vel.x*=factor;d.vel.z*=factor;d.r*=Math.exp(-dt*3);d.p*=Math.exp(-dt*3);d.pos.y=Math.max(d.pos.y,wreckSupportHeight(d.support||[{x:0,y:-.3,z:0}],d.pos,d.p,d.r,d.y,ground));d.rest=motion.speed<.1;}else{d.r+=d.side*dt*.7;d.p+=dt*.2;}}}

// The experimental aircraft never hands its pose to the legacy crash simulation.
function recordStructuralIncident(cause,severity){
 structuralIncident=true;structuralSeverity=Math.max(structuralSeverity,severity);crashCause=cause;impact=len(vel);
 crashProfile={mode:'sections',severity:structuralSeverity,label:'CONNECTED AIRFRAME · LOCAL DAMAGE'};
 startIncident(cabin,{speed:len(vel),sink:vel.y,bank:roll,airborne:state==='flight',fire:0,gear:true,cause,damage:crashProfile});
}
function stepStructural(dt){
 if(!structuralSession){
  if(onGround())pos.y=terrainMeshHeight(pos.x,pos.z,ground)+(structuralModel.profile?.clearance||1.5)+.05;
  else parking=false;
  structuralSession=structuralModule.startAirportStructure(structuralModel,ground,{pos,vel,pitch,roll,yaw},graphics.buildingSections?.());
  structuralModel.setPaint?.(livery?.id);graphics.setStructure(structuralModel);assist=false;taxiAssist=false;graphics.resetCamera();gearUI();
 }
 elapsed+=dt;tripSeconds+=dt;flapNotice=Math.max(0,flapNotice-dt);
 const goal=[0,(LIGHT_HANDLING[aircraft]?.takeoffFlaps||.33),1][flapSetting];flaps+=clamp(goal-flaps,-dt*.25,dt*.25);
 if(tickSystems(systems,dt,throttle,spec())&&!structuralIncident)crash(true,'FIRE DAMAGE');
 throttle=clamp(throttle+((keys.more?1:0)-(keys.less?1:0))*dt*.35,0,1);
 const prev=state,authority=systems.controlsFailed?.18:1;
 const result=structuralSession.update(dt,{throttle:parking?0:throttle*(aircraft==='c172'?enginePower(systems):1),engines:systems.engines.map(e=>e.running&&systems.fuel>0?1:0),gear,pitch:((keys.down?1:0)-(keys.up?1:0)+stick.y)*authority,roll:((keys.right?1:0)-(keys.left?1:0)-stick.x)*authority,flaps,brake:parking||keys.brake,reverse:state==='pushback'&&!parking});
 pos=result.pos;vel=result.vel;pitch=result.pitch;roll=result.roll;yaw=result.yaw;
 structuralAirTime=result.grounded?0:structuralAirTime+dt;
 if(prev==='pushback'){if(!parking)pushRemaining-=dt*10;if(pushRemaining<=0)stopPushback();}
 else if(result.grounded){if(prev==='flight'){state='landed';landingMessage=!structuralIncident;landingSpeed=len(vel);landingSink=Math.abs(vel.y);}else if(prev!=='parked')state=prev==='landed'?'landed':'taxi';}
 else if(structuralAirTime>.25){state='flight';parking=false;landingMessage=false;}
 for(const hit of result.hits){if(hit.part==='cabin'&&hit.speed>5)recordStructuralIncident(hit.surface.startsWith('building')?'BUILDING IMPACT':'GROUND IMPACT',clamp((hit.speed-5)/35,0,1));}
 if(result.events.length&&!structuralIncident)recordStructuralIncident('AIRFRAME CONNECTION BROKEN',0);
 for(const [i,e] of (structuralModel.profile?.engines||[{part:'nose'}]).entries())if(!structuralSession.sim.attached(e.part)&&systems.engines[i])systems.engines[i].running=false;
 if(structuralIncident){tickCabin(cabin,dt,result.grounded,len(vel)<.2);if(reportShown&&!$('panel').classList.contains('hidden'))showReport(false);}
 stall=stallCondition({velocity:vel,pitch,roll,yaw,liftSpeed:spec().liftSpeed,mass:1});
}
$('building-test').onclick=()=>{
 if(!structuralEnabled||!structuralModel)return;
 startConfigured({aircraft,mode:'free',passengers:2,fuel:80,livery:LIVERIES[0].id});
 pos=V(400,19,760);vel=V(55,0,0);yaw=Math.PI/2;pitch=roll=0;throttle=.5;graphics.resetCamera();
};
$('structure-toggle').onclick=async()=>{
 const button=$('structure-toggle');button.disabled=true;button.textContent='LOADING AIRCRAFT PHYSICS…';
 try{
  await prepareStructure(aircraft);
  structuralEnabled=!structuralEnabled;
  const config=currentConfig?.aircraft===aircraft?currentConfig:{aircraft,mode:'departure',start:'runway',runway:'01',livery:LIVERIES[0].id,passengers:2,fuel:100};
  startConfigured(config);button.textContent=structuralEnabled?'FLEET PHYSICS: EXPERIMENTAL':'FLEET PHYSICS: STANDARD';button.setAttribute('aria-pressed',String(structuralEnabled));
 }catch(error){console.error(error);button.textContent='COULD NOT LOAD · TAP TO RETRY';}finally{button.disabled=false;}
};

function step(dt){if(state==='paused'||state==='ready')return;if(structuralEnabled&&structuralModel&&(structuralModel.profile?.id||'c172')===aircraft){stepStructural(dt);return;}stepWingDebris(dt);if(scrape){scrape.life-=dt;if(scrape.life<=0)scrape=null;}elapsed+=dt;tripSeconds+=dt;flapNotice=Math.max(0,flapNotice-dt);if(LIGHT_HANDLING[aircraft]){const h=LIGHT_HANDLING[aircraft],goal=[0,h.takeoffFlaps,1][flapSetting],rate=h.flapRate||.25;flaps+=clamp(goal-flaps,-dt*rate,dt*rate);gearCompression*=Math.exp(-dt*5);}if(['parked','pushback','taxi','landed'].includes(state)){groundStep(dt);if(state!=='crashed'){contactEngines(dt);contactWings(dt);}return}if(state==='flight'){if(tickSystems(systems,dt,throttle,spec())){crash(true,'FIRE DAMAGE');return}if(activeFaults(systems)||wingDamage.left||wingDamage.right)assist=false;if(stick.x||stick.y||keys.up||keys.down||keys.left||keys.right||keys.less||keys.more||keys.brake){assist=false;gearUI()}if(assist){const agl=pos.y-ground(pos.x,pos.z);const reverse=currentConfig?.runway==='19',along=reverse?2400-pos.z:pos.z;const desiredY=10+clearance()+Math.max(0,(180-along)*.052);const desiredSink=clamp((desiredY-pos.y)*.4,-3.8,-.6);pitch=Math.asin(clamp(desiredSink/Math.max(50,len(vel)),-.12,0));const baseYaw=currentConfig?.runway==='19'?Math.PI:0;roll=clamp(pos.x*.004+Math.atan2(Math.sin(yaw-baseYaw),Math.cos(yaw-baseYaw))*.8,-.22,.22);throttle=clamp((LIGHT_HANDLING[aircraft]?aero().drag*approachTarget()**2*massFactor/airborneThrust():(spec().approachSpeed?.00125*spec().approachSpeed**2/airborneThrust():.5))+(approachTarget()-len(vel))*.05,0,1);gear=true;gearUI()}throttle=clamp(throttle+((keys.more?1:0)-(keys.less?1:0))*dt*.35,0,1);const h=LIGHT_HANDLING[aircraft],authority=h?clamp(len(vel)/(spec().liftSpeed*aero().liftScale*.9),.25,1):1,blend=h?1-Math.exp(-dt*h.response):1;controlPitch+=(clamp((keys.down?1:0)-(keys.up?1:0)+stick.y,-1,1)-controlPitch)*blend;controlRoll+=(clamp((keys.left?1:0)-(keys.right?1:0)-stick.x,-1,1)-controlRoll)*blend;pitch=clamp(pitch+controlPitch*authority*dt*spec().pitchRate*(systems.controlsFailed?.18:1),-1.3,1.1);roll=clamp(roll+controlRoll*authority*dt*spec().rollRate*(1-.7*stall.severity)*(1-.55*Math.max(wingDamage.left,wingDamage.right))*(systems.controlsFailed?.18:1),-1.3,1.3);if(!keys.left&&!keys.right&&!stick.x)roll*=Math.exp(-dt*.35);roll=clamp(roll+(wingDamage.left-wingDamage.right)*dt*.65,-1.3,1.3);yaw-=(h?clamp(9.81*Math.tan(roll)/Math.max(18,len(vel)),-.55,.55):Math.sin(roll)*.45)*dt+thrustImbalance(systems)*throttle*dt*.11;const condition=stallCondition({velocity:vel,pitch,roll,yaw,liftSpeed:spec().liftSpeed*aero().liftScale,mass:massFactor});stall={...condition,severity:stall.severity+(condition.severity-stall.severity)*(1-Math.exp(-dt*4))};stall.stalled=stall.severity>.12;if(stall.stalled){assist=false;pitch=clamp(pitch-Math.sign(stall.alpha)*stall.severity*.65*dt,-1.3,1.1);}const forward=rotate(V(0,0,1),pitch,0,yaw),sp=len(vel),desired=mul(forward,sp);vel=mix(vel,desired,1-Math.exp(-dt*1.25*(1-.94*stall.severity)*clamp(sp/(spec().liftSpeed*aero().liftScale*.9),.08,1)**2));const accel=throttle*airborneThrust()*enginePower(systems)/massFactor-aero().drag*sp*sp-9.81*Math.sin(pitch)-stall.severity*.012*sp;vel=add(vel,mul(forward,accel*dt));const lift=9.81*clamp((sp/(spec().liftSpeed*aero().liftScale*Math.sqrt(massFactor)))**2,0,1.15)*Math.max(.2,Math.cos(roll))*(1-.92*stall.severity)*(1-.48*(wingDamage.left+wingDamage.right));vel.y+=(lift-9.81)*dt;pos=add(pos,mul(vel,dt));contactEngines(dt);if(contactWings(dt)||contactBuilding(dt)){}else if(pos.y<=ground(pos.x,pos.z)+clearance())touchdown();const behind=rotate(V(0,spec().geometry==='twin'?13:20,spec().geometry==='twin'?-53:-82),0,0,yaw);camera=mix(camera,add(pos,behind),1-Math.exp(-dt*3));camera.y=Math.max(camera.y,ground(camera.x,camera.z)+4);target=mix(target,add(pos,mul(forward,18)),1-Math.exp(-dt*5));}else if(state==='crashed'){stepWreck(dt);}}
function render(dt){systemsUI();graphics.draw({structuralBuildings:structuralSession?.buildings,structural:!!structuralSession&&state!=='ready',state,saved,aircraft,livery,aircraftFamily:spec().geometry,profile:spec(),systems,wingDamage,wingDebris,scrape,crashCause,crashFuel,crashProfile,parts,pos,vel,pitch,roll,yaw,gear,flaps,gearCompression,throttle,debris,impact,impactPos,camera,target,rotate},dt);$('speed').textContent=Math.round(((state==='crashed'||state==='paused'&&saved==='crashed')?len(crashGroups[0]?.vel||V()):len(vel))*1.944);$('alt').textContent=Math.round(Math.max(0,pos.y-ground(pos.x,pos.z)));$('throttle').textContent=Math.round(throttle*100);$('vspeed').textContent=(state==='flight'||state==='paused'&&saved==='flight'?vel.y:0).toFixed(1);$('notice').textContent=state==='paused'?'HOLDING / PAUSED':state==='crashed'?crashCause+' · '+Math.round(impact*1.944)+' KT · '+(crashProfile?.mode==='intact'?'AIRFRAME INTACT':crashProfile?.mode==='sections'?'3 MAJOR SECTIONS':debris.length+' PANELS'):state==='landed'?(len(vel)>.3?(landingQuality==='hard'?'HARD LANDING · GEAR HOLDING · BRAKING':'SMOOTH TOUCHDOWN · BRAKING · SPACE FOR HARD BRAKE'):'PARKED · AIRFRAME INTACT'):state==='flight'?(mission==='approach'||assist?(assist?'ASSIST ON · INPUT TAKES CONTROL':'MANUAL APPROACH')+' · '+(gear?'GEAR DOWN':'LOWER GEAR')+' · '+(pos.z<0?Math.round(-pos.z)+' M TO RUNWAY':Math.abs(pos.x)<29?'OVER RUNWAY':'ALIGN WITH RUNWAY'):pos.y-ground(pos.x,pos.z)<65?'TERRAIN · PULL UP':len(vel)<spec().liftSpeed*aero().liftScale*Math.sqrt(massFactor)*.78?'Low speed. Increase power and lower the nose gently.':'FREE FLIGHT / '+Math.round(elapsed)+' SEC'):'FLIGHT TEST '+String(flight).padStart(3,'0')+' / RIDGELINE';updateFlightUI();const flying=(state==='paused'?saved:state)==='flight';$('notice').classList.toggle('stall-alert',flying&&stall.stalled);if(state!=='paused'&&scrape?.terrain)$('notice').textContent=(scrape.part==='engine'?'ENGINE':'WING')+' SCRAPE · Level the wings and lift clear.';if(flying&&(wingDamage.left||wingDamage.right))$('notice').textContent='WING DAMAGE · Counter the roll and prepare to land.';if(flying&&stall.stalled)$('notice').textContent='STALL · Lower the nose. Level the wings. Add power.';else if(flying&&stall.warning)$('notice').textContent='STALL WARNING · Ease the nose down and build speed.';if(engine){engine.o.frequency.value=30+throttle*65;engine.g.gain.value=!muted&&['flight','taxi','landed'].includes(state)?.015*enginePower(systems):0}}
function systemsUI(rebuild=false){$('fuel').textContent=Math.ceil(systems.fuel)+'%';$('system-status').textContent=(state==='crashed'||state==='paused'&&saved==='crashed')?(crashProfile?.label||'AIRFRAME DAMAGED'):systems.message;const active=['flight','taxi','landed','parked','pushback'].includes(state==='paused'?saved:state);$('apply-failure').disabled=!active;$('repair').disabled=!active;$('failure-status').textContent=active?'Each problem stays active until you repair or restart.':'Start a flight to trigger a failure.';if(rebuild){$('engine-target').innerHTML=systems.engines.map((e,i)=>'<option value="'+i+'">Engine '+e.name+'</option>').join('')}$('engine-readout').textContent=systems.engines.map((e,i)=>(i+1)+': '+(e.onFire?'FIRE':e.running?'OK':'OFF')).join('  ')}
function refreshFailureTarget(){$('engine-target').disabled=!['engine','fire'].includes($('failure-kind').value)}
$('failure-toggle').onclick=()=>{const tray=$('failures');tray.classList.toggle('hidden');$('failure-toggle').setAttribute('aria-expanded',String(!tray.classList.contains('hidden')))};
$('close-failures').onclick=()=>{$('failures').classList.add('hidden');$('failure-toggle').setAttribute('aria-expanded','false')};
$('failure-kind').onchange=refreshFailureTarget;
$('apply-failure').onclick=()=>{if(!['flight','taxi','landed','parked','pushback'].includes(state==='paused'?saved:state))return;const wasPaused=state==='paused',result=triggerFailure(systems,$('failure-kind').value,Number($('engine-target').value));if(!result)return;$('failures').classList.add('hidden');$('failure-toggle').setAttribute('aria-expanded','false');assist=false;gearUI();if(result==='breakup'){if(wasPaused)state=saved;crash(pos.y-ground(pos.x,pos.z)>clearance()+2,'ONBOARD EXPLOSION');if(wasPaused){saved=structuralSession?state:'crashed';state='paused'}}systemsUI()};
$('repair').onclick=()=>{if(!['flight','taxi','landed','parked','pushback'].includes(state==='paused'?saved:state))return;systems=createSystems(spec());for(const e of systems.engines){const damage=e.position.x<0?wingDamage.left:wingDamage.right;if(Math.abs(e.position.x)>wingEnvelope().span/2*(1-damage))e.running=false;}if(wingDamage.left||wingDamage.right)systems.message='WING DAMAGE · RESTART TO RESTORE AIRFRAME';massFactor=currentConfig?loadFactor(aircraft,cabin.passengers,100):1;gearUI();systemsUI(true)};
$('quality').onclick=()=>{$('quality').textContent='GRAPHICS '+graphics.nextQuality()};
function updateFlightUI(){
 const actual=state==='paused'?saved:state;
 $('building-test').disabled=!structuralEnabled;
 const h=LIGHT_HANDLING[aircraft];$('flaps').classList.toggle('hidden',!h||actual==='crashed');$('flaps').disabled=!h||!['flight','taxi','landed','parked'].includes(state);$('flaps').textContent='FLAPS: '+['UP','TAKEOFF','LANDING'][flapSetting]+(h?' · '+Math.round(flaps*h.flapDegrees)+'°':'');
 $('show-report').classList.toggle('hidden',!(structuralIncident||actual==='crashed'||cabin.final||reportShown||landingMessage));$('show-report').textContent=(structuralIncident||actual==='crashed')?'VIEW CRASH REPORT':'FLIGHT REPORT';$('heading').textContent=String(headingDegrees(yaw)).padStart(3,'0');$('aboard').textContent=cabin.total;
 $('flight-identity').textContent=names[aircraft]+' · '+(AIRCRAFT.find(a=>a.id===aircraft).paintName||(aircraft==='c172'?'Classic blue & white':livery.name));
 $('parking').classList.toggle('hidden',!onGround());$('parking').classList.toggle('engaged',parking);$('parking').textContent=parking?'RELEASE BRAKE':'SET BRAKE';$('parking').disabled=state==='paused';
 $('pushback').classList.toggle('hidden',!['parked','pushback'].includes(actual));$('pushback').disabled=state==='paused';$('pushback').textContent=actual==='pushback'?'STOP PUSHBACK':'PUSHBACK';
 $('taxi-guide').classList.toggle('hidden',actual!=='taxi'||currentConfig?.start==='runway');$('taxi-guide').disabled=!!structuralSession||state!=='taxi';$('taxi-guide').textContent=taxiAssist?'STOP AUTO TAXI':'AUTO TAXI TO RUNWAY';
 if(state==='parked')$('notice').textContent='Start here: tap Pushback to leave the gate.';
 if(state!=='paused'&&actual==='crashed'&&crashProfile?.mode==='intact'&&!crashGroups[0]?.rest)$('notice').textContent='EMERGENCY SLIDE · Steer gently. Hold brake to slow.';if(state==='pushback')$('notice').textContent=parking?'Pushback paused. Release the brake to continue.':'Steer while reversing. Tap Stop Pushback to take over.';
 if(state==='taxi')$('notice').textContent=taxiAssist?'Auto taxi is driving to the runway. Steer to take over.':parking?'First, tap Release Brake. Then slide Power up.':len(vel)>rotationTarget()?'Ready to lift off! Pull the joystick down gently.':'Increase power. Lift off at '+Math.round(rotationTarget()*1.944)+' KT';
 if(state==='landed')$('notice').textContent=parking?'Brake is set. Release it to taxi or fly again.':(landingQuality==='hard'?'Hard landing. Gear is holding. Taxi or take off again.':'Smooth landing. Steer to taxi, or add power to take off again.');
 if(['taxi','landed'].includes(state)&&!parking&&groundSurface().grass>0)$('notice').textContent='Grass slows the plane. Steer back to pavement for takeoff.';
 if(state==='crashed'&&!cabin.final)$('notice').textContent='DAMAGE IN PROGRESS · REPORT AT IMPACT';
 if(h&&flapNotice>0)$('notice').textContent='Slow below '+Math.round(h.flapLimit*1.944)+' KT to lower flaps.';
 $('throttle-slider').value=Math.round(throttle*100);$('throttle-slider').disabled=!['flight','taxi','landed'].includes(state);$('power-value').textContent=Math.round(throttle*100)+'%';
 const gauges=systems.engines.map((e,i)=>'<div class="engine-gauge '+(!e.running||e.onFire?'fault':'')+'"><small>ENG '+(i+1)+'</small><b>'+enginePercent(e)+'%</b><span>'+(e.onFire?'FIRE':!e.running||systems.fuel<=0?'OFF':'POWER')+'</span></div>').join('');if(gauges!==lastEngineGauges){$('engine-gauges').innerHTML=gauges;lastEngineGauges=gauges}
 const hdg=headingDegrees(yaw);$('compass-rose').setAttribute('transform','rotate('+(-hdg)+' 60 60)');$('compass-value').textContent=String(hdg).padStart(3,'0')+'°';
 const mapX=22+pos.x*.052,mapY=170-pos.z*.06;const off=mapX<8||mapX>122||mapY<8||mapY>178;
 $('map-aircraft').setAttribute('transform','translate('+clamp(mapX,8,122)+' '+clamp(mapY,8,178)+') rotate('+hdg+')');$('nav-distance').textContent=(Math.hypot(pos.x,pos.z-1200)/1000).toFixed(1)+' KM TO AIRPORT'+(off?' · OFF MAP':'');
 if(structuralSession?.buildings?.debris.length)$('system-status').textContent=structuralSession.buildings.debris.length+' BUILDING SECTIONS BROKEN';
 if(structuralSession){$('flight-identity').textContent+=' · EXPERIMENTAL PHYSICS';if(state!=='paused'&&structuralIncident)$('notice').textContent='AIRFRAME DAMAGED · Keep flying or watch the wreckage. Report when ready.';}
 $('gear').classList.toggle('hidden',actual==='crashed'||!!spec().fixedGear||onGround());$('gear').disabled=(state==='crashed'||state==='paused'&&saved==='crashed')||!!spec().fixedGear||systems.gearJammed||onGround();$('assist').disabled=!!structuralSession||state!=='flight';
}
$('parking').onclick=()=>{if(onGround()&&state!=='paused'){parking=!parking;taxiAssist=false;throttle=0;clearKeys()}};
$('pushback').onclick=()=>state==='pushback'?stopPushback():startPushback();
$('throttle-slider').oninput=e=>setThrottle(e.target.value);
$('nav-toggle').onclick=()=>{const el=$('nav-map');el.classList.toggle('hidden');$('nav-toggle').setAttribute('aria-expanded',String(!el.classList.contains('hidden')))};$('taxi-guide').onclick=toggleTaxi;
$('settings-toggle').onclick=()=>{const el=$('settings');el.classList.toggle('hidden');$('settings-toggle').setAttribute('aria-expanded',String(!el.classList.contains('hidden')))};
$('close-settings').onclick=()=>{$('settings').classList.add('hidden');$('settings-toggle').setAttribute('aria-expanded','false')};
$('show-report').onclick=()=>{if(structuralIncident||(state==='paused'?saved:state)==='crashed'||cabin.final||reportShown||landingMessage)showReport(!structuralIncident&&landingMessage&&(state==='paused'?saved:state)!=='crashed')};
$('dismiss-report').onclick=()=>{$('panel').classList.add('hidden')};
async function prepareStructure(id){if(structuralModel?.profile?.id===id)return;structuralModule??=await import('./airport-structure.js?v=fleet-20261028');const next=await structuralModule.prepareAirportStructure(id);structuralModel?.dispose?.();structuralModel=next;}
const setup=createSetup({start:startConfigured,prepare:async id=>{await graphics.loadAircraft(id);if(structuralEnabled)await prepareStructure(id)},opening(){state='ready';clearKeys();$('panel').classList.add('hidden')},preview(config){graphics.loadAircraft(config.aircraft);aircraft=config.aircraft;livery=LIVERIES.find(l=>l.id===config.livery);systems=createSystems(spec());pos=V(540,190,350);yaw=0;pitch=0;roll=0;gear=!!spec().fixedGear;buildAircraft();graphics.resetCamera()}});
$('new-flight').onclick=()=>setup.open();
$('more-controls').onclick=()=>{const el=$('extra-controls');el.classList.toggle('hidden');$('more-controls').setAttribute('aria-expanded',String(!el.classList.contains('hidden')))};
let helpPaused=false;
$('help-toggle').onclick=()=>{helpPaused=state!=='paused'&&state!=='ready';if(helpPaused)pause();$('pilot-help').classList.remove('hidden')};$('close-help').onclick=()=>{$('pilot-help').classList.add('hidden');if(helpPaused&&state==='paused')pause();helpPaused=false};

document.addEventListener('click',e=>{if(state!=='ready'&&e.target.closest?.('button')&&e.target.closest?.('.hud,.drawer'))canvas.focus()});
systemsUI(true);refreshFailureTarget();setup.open();
function frame(now){let dt=Math.min(.2,(now-last)/1000||.016);last=now;const wall=dt;while(dt>0){const tick=Math.min(dt,1/60);step(tick);dt-=tick}render(wall);requestAnimationFrame(frame)}requestAnimationFrame(frame);
