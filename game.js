import {stallCondition} from './stall-model.js';
import {assessImpact,fracturePanels} from './crash-model.js';
import {createFleetMeshes} from './aircraft-meshes.js';
import {LIVERIES,CABINS,spawnPoint,taxiRoute,onPavement,buildingCollision,loadFactor} from './flight-config.js';
import {createCabin,startIncident,tickCabin,cabinTotals} from './cabin.js';
import {createSetup} from './setup-ui.js';
import {bindJoystick} from './joystick.js';

import {createGraphics} from './graphics.js?v=fleet-20261005';
import {AIRCRAFT,getAircraft} from './aircraft-catalog.js';
import {createSystems,activeFaults,triggerFailure,tickSystems,enginePower,thrustImbalance} from './failures.js';
'use strict';const canvas=document.getElementById('scene'),$=id=>document.getElementById(id);
const V=(x=0,y=0,z=0)=>({x,y,z}),add=(a,b)=>V(a.x+b.x,a.y+b.y,a.z+b.z),sub=(a,b)=>V(a.x-b.x,a.y-b.y,a.z-b.z),mul=(a,s)=>V(a.x*s,a.y*s,a.z*s),dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z,cross=(a,b)=>V(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x),len=a=>Math.hypot(a.x,a.y,a.z),norm=a=>mul(a,1/(len(a)||1)),mix=(a,b,t)=>add(mul(a,1-t),mul(b,t)),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function naturalGround(x,z){const base=14+Math.sin(x*.0028)*26+Math.cos(z*.0032)*24+Math.sin((x+z)*.005)*12;const away=Math.min(1,Math.max(0,(Math.abs(x)-250)/1600));const mountains=away*(150+180*Math.sin(x*.0009+z*.0006)**2+95*Math.sin(z*.002+x*.001)**2);return base+mountains}
function ground(x,z){const edgeX=clamp((Math.abs(x)-125)/170,0,1),edgeZ=Math.max(clamp((-1450-z)/180,0,1),clamp((z-2650)/180,0,1));const airportBlend=Math.max(clamp((-140-x)/170,0,1),clamp((x-1050)/170,0,1),clamp((250-z)/180,0,1),clamp((z-2400)/180,0,1));const blend=Math.min(Math.max(edgeX,edgeZ),airportBlend);return 10+(naturalGround(x,z)-10)*blend}
const graphics=createGraphics(canvas,ground);
let aircraft='b747',gear=false,assist=false,mission='free',landingSpeed=0,landingSink=0,landingMessage=false;
const names=Object.fromEntries(AIRCRAFT.map(a=>[a.id,a.name]));
function spec(){return getAircraft(aircraft)}
let stall={severity:0,warning:false,stalled:false};
let systems=createSystems(spec()),crashCause='GROUND CONTACT',crashFuel=100,crashProfile=null,crashGroups=[];
$('aircraft').innerHTML=AIRCRAFT.map(a=>'<option value="'+a.id+'"'+(a.id===aircraft?' selected':'')+'>'+a.name+'</option>').join('');
function clearance(){return spec().clearance}
function gearUI(){$('gear').disabled=(state==='crashed'||state==='paused'&&saved==='crashed')||!!spec().fixedGear||systems.gearJammed||onGround();$('gear').textContent=spec().fixedGear?'WHEELS FIXED':gear?'RAISE WHEELS':'LOWER WHEELS';$('assist').disabled=state!=='flight';$('assist').textContent=assist?'LANDING HELP: ON':'HELP ME LAND';$('assist').setAttribute('aria-pressed',String(assist))}
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
function resetTrip(){stall={severity:0,warning:false,stalled:false};
 const c=CABINS[aircraft],p=currentConfig?.passengers??0;cabin=createCabin(p,currentConfig?c.crew:0);massFactor=currentConfig?loadFactor(aircraft,p,currentConfig.fuel):1;
 parking=true;taxiAssist=false;route=[];pushRemaining=0;reportShown=false;tripSeconds=0;crashProfile=null;crashGroups=[];$('report-content').innerHTML='';
}
function startConfigured(config){
 currentConfig={...config};aircraft=config.aircraft;livery=LIVERIES.find(l=>l.id===config.livery)||LIVERIES[0];begin(config.mode==='approach'?'approach':'free');systems.fuel=config.fuel;massFactor=loadFactor(aircraft,config.passengers,config.fuel);
 if(config.mode==='departure'){
 const spawn=spawnPoint(config);pos=V(spawn.x,10+clearance(),spawn.z);yaw=spawn.yaw;pitch=0;roll=0;vel=V();throttle=0;gear=true;assist=false;state=config.start==='gate'?'parked':'taxi';parking=true;
 }else if(config.mode==='approach'&&config.runway==='19'){pos=V(0,82,3400);yaw=Math.PI;vel=V(0,-3.6,-(spec().approachSpeed||72))}
 else if(config.mode!=='approach'){pos=V(0,320,-300);vel=V(0,0,(spec().approachSpeed||72)*1.12)}
 $('pilot-help').classList.add('hidden');$('extra-controls').classList.add('hidden');$('more-controls').setAttribute('aria-expanded','false');$('settings').classList.add('hidden');$('failures').classList.add('hidden');$('failure-toggle').setAttribute('aria-expanded','false');$('settings-toggle').setAttribute('aria-expanded','false');if(config.mode==='sandbox'){$('failures').classList.remove('hidden');$('failure-toggle').setAttribute('aria-expanded','true')}graphics.resetCamera();gearUI();
}
function onGround(){const phase=state==='paused'?saved:state;return ['parked','pushback','taxi','landed'].includes(phase)}
function startPushback(){if(state!=='parked')return;parking=false;throttle=0;state='pushback';pushRemaining=70;clearKeys();gearUI()}
function stopPushback(){if(state!=='pushback')return;state='taxi';pushRemaining=0;parking=false;taxiAssist=false;route=[];vel=V();throttle=0;clearKeys();gearUI()}
function setThrottle(value){if(!['taxi','flight'].includes(state))return;taxiAssist=false;assist=false;throttle=clamp(Number(value)/100,0,1)}
function headingDegrees(angle){return ((Math.round(angle*180/Math.PI)%360)+360)%360}
function enginePercent(e){return systems.fuel>0&&e.running&&!e.onFire&&!['crashed','ready','landed'].includes(state==='paused'?saved:state)?Math.round(throttle*100):0}
function toggleTaxi(){if(state!=='taxi')return;if(taxiAssist){taxiAssist=false;throttle=0;return}parking=false;taxiAssist=true;const g=spawnPoint({...currentConfig,start:'gate'});route=taxiRoute(g,currentConfig?.runway||'01');throttle=.25}
// Sample terrain across the gear footprint. Flat grass is a surface, not a collision.
function terrainUnsafe(x,z,speed=0,heading=yaw){
 const gx=(ground(x+3,z)-ground(x-3,z))/6,gz=(ground(x,z+3)-ground(x,z-3))/6;
 return Math.hypot(gx,gz)>.32||Math.abs(gx*Math.sin(heading)+gz*Math.cos(heading))*speed>5;
}
function groundStep(dt){
 if(tickSystems(systems,dt,state==='pushback'?0:throttle,spec())){crash(false,'FIRE DAMAGE');return}
 if(state==='parked'){vel=V();throttle=0;return}
 if(state==='pushback'){
 if(parking||keys.brake){vel=V();return}
 const turn=clamp((keys.right?1:0)-(keys.left?1:0)+stick.x,-1,1);yaw-=turn*dt*.45*(systems.controlsFailed?.18:1);
 const distance=Math.min(pushRemaining,10*dt),back=rotate(V(0,0,-1),0,0,yaw);vel=mul(back,10);pos=add(pos,mul(back,distance));pushRemaining-=distance;
 pos.y=ground(pos.x,pos.z)+clearance();if(terrainUnsafe(pos.x,pos.z,len(vel))){crash(false,'ROUGH TERRAIN IMPACT');return}if(buildingCollision(pos,spec().visual?Math.min(spec().visual.span/2,spec().visual.length*.35):spec().geometry==='twin'?10:23)){crash(false,'BUILDING COLLISION');return}
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
 yaw+=turn*dt*.6*clamp(speed/3,0,1)/(1+speed/18)*(systems.controlsFailed?.18:1);
 const brake=parking?12:keys.brake?9:0,power=parking||keys.brake?0:throttle*spec().thrust*enginePower(systems)/massFactor;
 const next=Math.max(0,speed+(power-.00125*speed*speed-(onPavement(pos.x,pos.z)?.7:3)-brake)*dt);
 vel=V(Math.sin(yaw)*next,0,Math.cos(yaw)*next);pos=add(pos,mul(vel,dt));
 const rotateSpeed=(spec().takeoffSpeed||65)*Math.sqrt(massFactor);pitch=clamp(pitch+pull*dt*.2,0,.2);if(!pull)pitch*=Math.exp(-dt*2);
 if(next>=rotateSpeed&&pitch>.06&&onPavement(pos.x,pos.z)&&!parking&&!keys.brake){state='flight';vel.y=Math.max(3,next*Math.sin(pitch));pos.y+=1;parking=false;return}
 }
 pos.y=ground(pos.x,pos.z)+clearance();roll=0;
 if(buildingCollision(pos,spec().visual?Math.min(spec().visual.span/2,spec().visual.length*.35):spec().geometry==='twin'?10:23)){crash(false,'BUILDING COLLISION');return}
 if(terrainUnsafe(pos.x,pos.z,len(vel))){crash(false,'ROUGH TERRAIN IMPACT')}
}
function showReport(safe=false){
 reportShown=true;const t=cabinTotals(cabin);$('tag').textContent=safe?'FLIGHT COMPLETE · SAFE ARRIVAL':'INCIDENT REPORT · FINAL';$('title').textContent=safe?'Everyone arrived.':'Flight outcome';
 $('copy').textContent=safe?`Touchdown at ${Math.round(landingSpeed*1.944)} kt, ${landingSink.toFixed(1)} m/s descent.`:`${crashCause} · ${Math.round(impact*1.944)} kt at initial damage. ${crashProfile?.label||'Impact damage'}.`;
 $('report-content').innerHTML=`<p>${cabin.passengers} passengers + ${cabin.crew} crew · ${cabin.total} aboard</p><div class="report-totals"><div><b>${t.survivors}</b>SURVIVORS</div><div><b>${t.injured}</b>INJURED SURVIVORS</div><div><b>${t.fatalities}</b>FATALITIES</div></div><table class="report-table"><thead><tr><th>Cabin</th><th>Aboard</th><th>Survived</th><th>Fatalities</th></tr></thead><tbody>${cabin.sections.map(s=>`<tr><td>${s.name}</td><td>${s.occupants}</td><td>${s.survivors}</td><td>${s.fatalities}</td></tr>`).join('')}</tbody></table><p>${safe?'Airframe intact.':`Cabin damage ${Math.round(cabin.sections.reduce((a,s)=>a+s.damage,0)/3*100)}% · Fire exposure ${Math.round(cabin.fire*100)}% · Exit availability ${Math.round(cabin.exits*100)}%.`}</p>`;
 $('instructions').textContent='Fictional game outcomes, not real-world survival estimates.';$('start').textContent='NEW FLIGHT →';$('panel').classList.remove('hidden');
}

function clearKeys(){joystick.reset();for(const k in keys)keys[k]=false;document.querySelectorAll('.active').forEach(b=>b.classList.remove('active'))}
addEventListener('resize',clearKeys);
function begin(type=mission){mission=typeof type==='string'?type:mission;resetTrip();state='flight';pos=mission==='approach'?V(0,82,-1000):V(0,280,0);vel=mission==='approach'?V(0,-3.6,spec().approachSpeed||72):V(0,0,(spec().approachSpeed||72)*1.12);pitch=mission==='approach'?-.05:0;roll=0;yaw=0;throttle=mission==='approach'?.49:.65;gear=!!spec().fixedGear||mission==='approach';assist=mission==='approach';elapsed=0;impact=0;landingMessage=false;systems=createSystems(spec());crashCause='GROUND CONTACT';crashFuel=100;systemsUI(true);debris=[];dust=[];buildAircraft();camera=add(pos,V(0,18,spec().geometry==='twin'?-65:-92));target=add(pos,V(0,0,25));clearKeys();graphics.resetCamera();$('panel').classList.add('hidden');$('pause').textContent='PAUSE';gearUI();canvas.focus()}
function pause(){if(['flight','crashed','landed','parked','pushback','taxi'].includes(state)){saved=state;state='paused';clearKeys();$('pause').textContent='RESUME'}else if(state==='paused'){state=saved;$('pause').textContent='PAUSE'}}$('aircraft').onchange=()=>{aircraft=$('aircraft').value;begin()};$('airport-tour').onclick=()=>{begin('free');pos=V(540,190,350);vel=V(0,0,72);throttle=.5;graphics.resetCamera()};$('daylight').onclick=()=>{$('daylight').textContent=graphics.nextLighting()};$('approach').onclick=()=>begin('approach');$('gear').onclick=()=>{if(!spec().fixedGear&&!systems.gearJammed&&!onGround()){gear=!gear;assist=false;gearUI()}};$('assist').onclick=()=>{assist=!activeFaults(systems)&&!assist;gearUI()};$('dive').onclick=()=>{begin('free');pitch=-.7};$('start').onclick=()=>setup.open();$('camera').onclick=()=>{$('camera').textContent='VIEW: '+graphics.nextCamera()};$('reset').onclick=()=>{flight++;if(currentConfig)startConfigured(currentConfig);else begin()};$('pause').onclick=pause;$('cut').onclick=()=>{throttle=0};
function sound(){try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();if(!engine){const o=audio.createOscillator(),g=audio.createGain();o.type='sawtooth';o.connect(g);g.connect(audio.destination);g.gain.value=0;o.start();engine={o,g}}}catch{}}$('audio').onclick=()=>{muted=!muted;if(!muted)sound();$('audio').textContent=muted?'SOUND OFF':'SOUND ON'};
const map={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',q:'less',e:'more'};addEventListener('keydown',e=>{if(state==='ready'||['SELECT','INPUT','BUTTON'].includes(e.target?.tagName))return;if(e.key.startsWith('Arrow')||e.key===' ')e.preventDefault();const k=map[e.key]||map[e.key.toLowerCase()];if(k)keys[k]=true;if(e.key===' '){throttle=0;keys.brake=true;}if(e.key.toLowerCase()==='g'&&!e.repeat&&!spec().fixedGear&&!systems.gearJammed&&!onGround()){gear=!gear;assist=false;gearUI()}if(e.key.toLowerCase()==='c'&&!e.repeat){$('camera').textContent='VIEW: '+graphics.nextCamera()}if(e.key.toLowerCase()==='p'&&!e.repeat)pause();if(e.key.toLowerCase()==='r'&&!e.repeat){flight++;begin()}if(e.key==='Enter'&&state==='ready')begin()});addEventListener('keyup',e=>{const k=map[e.key]||map[e.key.toLowerCase()];if(k)keys[k]=false;if(e.key===' ')keys.brake=false});addEventListener('blur',()=>{if(['flight','crashed','landed','parked','pushback','taxi'].includes(state))pause();clearKeys()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&(['flight','crashed','landed','parked','pushback','taxi'].includes(state)))pause()});for(const b of document.querySelectorAll('[data-key]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true;if(b.dataset.key==='brake')throttle=0;b.classList.add('active')};for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{keys[b.dataset.key]=false;b.classList.remove('active')})}
function syncWreck(){
 for(const d of debris){const g=crashGroups[d.group];d.pos=add(g.pos,rotate(sub(d.part.center,g.center),g.p,g.r,g.y));d.vel=g.vel;d.p=g.p;d.r=g.r;d.y=g.y;d.hitGround=g.hitGround;d.rest=g.rest;}
}
function crash(airborne=false,cause='GROUND CONTACT'){
 if(state==='crashed')return;
 crashProfile=assessImpact({speed:len(vel),sink:vel.y,bank:roll,pitch,airborne,gear,cause,fuel:systems.fuel});
 crashCause=crashProfile.mode==='intact'&&cause==='GROUND CONTACT'?crashProfile.label:cause;
 startIncident(cabin,{speed:len(vel),sink:vel.y,bank:roll,airborne,fire:crashProfile.fire,gear,cause,damage:crashProfile});
 state='crashed';crashFuel=systems.fuel;assist=false;throttle=0;gearUI();impact=len(vel);impactPos={...pos};
 if(crashProfile.mode==='fragmented')parts=fracturePanels(parts);
 const assignments=parts.map((p,i)=>crashProfile.mode==='intact'?0:crashProfile.mode==='fragmented'?i:(p.kind==='aft'||p.kind==='tail'||p.kind==='fin'||(!p.kind&&[1,4,5,6].includes(i))?1:p.kind==='wing'||p.kind==='winglet'||p.kind==='engine'||(!p.kind&&[2,3,7,8,10,11].includes(i))?2:0));
 crashGroups=[];debris=[];
 for(const id of [...new Set(assignments)]){
 const members=parts.filter((p,i)=>assignments[i]===id),center=mul(members.reduce((a,p)=>add(a,p.center),V()),1/members.length),local=rotate(center,pitch,roll,yaw),spread=crashProfile.mode==='fragmented'?Math.min(18,impact*.18):crashProfile.mode==='sections'?3:0;
 const g={center,pos:add(pos,local),vel:add(vel,V((Math.random()-.5)*spread,airborne?(Math.random()-.5)*spread:0,(Math.random()-.5)*spread)),p:pitch,r:roll,y:yaw,spin:crashProfile.mode==='intact'?V():V((Math.random()-.5)*spread*.15,(Math.random()-.5)*spread*.1,(Math.random()-.5)*spread*.15),rest:false,hitGround:false,members};
 // Contact height follows the underside of this rigid assembly, not a fixed point.
 g.bottom=Math.min(...members.flatMap(p=>p.verts.map(v=>v.y+p.center.y-center.y)));g.contact=Math.max(.15,-g.bottom);crashGroups[id]=g;
 if(!airborne){g.pos.y=Math.max(g.pos.y,ground(g.pos.x,g.pos.z)+g.contact);g.vel.y=0;g.hitGround=true;}
 }
 for(let i=0;i<parts.length;i++)debris.push({part:parts[i],group:assignments[i]});syncWreck();elapsed=0;clearKeys();
 if(!muted&&audio){const buffer=audio.createBuffer(1,Math.floor(audio.sampleRate*.5),audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const src=audio.createBufferSource(),g=audio.createGain();src.buffer=buffer;g.gain.value=.08+crashProfile.severity*.22;src.connect(g);g.connect(audio.destination);src.start();}
 if(!airborne)tickCabin(cabin,0,true);
}
function stepWreck(dt){
 for(const g of crashGroups){if(!g||g.rest)continue;g.vel.y-=9.81*dt;g.pos=add(g.pos,mul(g.vel,dt));
 g.p+=g.spin.x*dt;g.r+=g.spin.y*dt;g.y+=g.spin.z*dt;
 const bottom=Math.min(...g.members.flatMap(p=>p.verts.map(v=>rotate(sub(add(v,p.center),g.center),g.p,g.r,g.y).y)));
 const gy=ground(g.pos.x,g.pos.z)-bottom;
 if(g.pos.y<=gy){g.hitGround=true;g.pos.y=gy;g.vel.y=0;
 const sp=Math.hypot(g.vel.x,g.vel.z),decel=onPavement(g.pos.x,g.pos.z)?3.8:6.5,next=Math.max(0,sp-decel*dt);g.vel.x*=next/(sp||1);g.vel.z*=next/(sp||1);g.spin=mul(g.spin,Math.exp(-dt*5));
 if(crashProfile.mode==='intact'){g.p*=Math.exp(-dt*3);g.r*=Math.exp(-dt*3);}
 if(next<.25){g.rest=true;g.vel=V();g.spin=V()}}
 }
 syncWreck();const center=crashGroups[0]?.pos||impactPos;const scale=spec().visual?Math.max(.4,spec().visual.length/34):1;
 const angle=yaw+Math.min(elapsed*.04,.5);camera=mix(camera,add(center,V(Math.sin(angle)*46*scale,18*scale,-Math.cos(angle)*46*scale)),1-Math.exp(-dt*1.2));camera.y=Math.max(camera.y,ground(camera.x,camera.z)+5);target=mix(target,center,1-Math.exp(-dt*2));
 tickCabin(cabin,dt,debris.some(d=>(d.part.cabin||d.part===parts[0]||d.part===parts[1])&&d.hitGround));
}
function touchdown(){const runway=Math.abs(pos.x)<29&&pos.z>=0&&pos.z<2400;const heading=Math.min(Math.abs(Math.atan2(Math.sin(yaw),Math.cos(yaw))),Math.abs(Math.atan2(Math.sin(yaw-Math.PI),Math.cos(yaw-Math.PI))));const safe=!buildingCollision(pos,spec().visual?Math.min(spec().visual.span/2,spec().visual.length*.35):spec().geometry==='twin'?10:23)&&!terrainUnsafe(pos.x,pos.z,len(vel))&&gear&&Math.abs(roll)<.17&&pitch>-.12&&pitch<.25&&(!runway||heading<.2)&&vel.y>=-5&&len(vel)<(spec().approachSpeed||72)*1.32&&len(vel)>(spec().approachSpeed||72)*.4;if(!safe){crash();return}state=runway?'landed':'taxi';parking=false;landingSpeed=len(vel);landingSink=Math.abs(vel.y);pos.y=ground(pos.x,pos.z)+clearance();vel.y=0;pitch=0;roll=0;throttle=0;assist=false;elapsed=0;clearKeys();gearUI()}
function step(dt){if(state==='paused'||state==='ready')return;elapsed+=dt;tripSeconds+=dt;if(['parked','pushback','taxi'].includes(state)){groundStep(dt);return}if(state==='flight'){if(tickSystems(systems,dt,throttle,spec())){crash(true,'FIRE DAMAGE');return}if(activeFaults(systems))assist=false;if(stick.x||stick.y||keys.up||keys.down||keys.left||keys.right||keys.less||keys.more||keys.brake){assist=false;gearUI()}if(assist){const agl=pos.y-ground(pos.x,pos.z);const reverse=currentConfig?.runway==='19',along=reverse?2400-pos.z:pos.z;const desiredY=10+clearance()+Math.max(0,(180-along)*.052);const desiredSink=clamp((desiredY-pos.y)*.4,-3.8,-.6);pitch=Math.asin(clamp(desiredSink/Math.max(50,len(vel)),-.12,0));const baseYaw=currentConfig?.runway==='19'?Math.PI:0;roll=clamp(pos.x*.004+Math.atan2(Math.sin(yaw-baseYaw),Math.cos(yaw-baseYaw))*.8,-.22,.22);throttle=clamp((spec().approachSpeed?.00125*spec().approachSpeed**2/Math.min(9,spec().thrust):.5)+((spec().approachSpeed||72)*Math.sqrt(massFactor)-len(vel))*.05,0,1);gear=true;gearUI()}throttle=clamp(throttle+((keys.more?1:0)-(keys.less?1:0))*dt*.35,0,1);pitch=clamp(pitch+clamp((keys.down?1:0)-(keys.up?1:0)+stick.y,-1,1)*dt*spec().pitchRate*(systems.controlsFailed?.18:1),-1.3,1.1);roll=clamp(roll+clamp((keys.left?1:0)-(keys.right?1:0)-stick.x,-1,1)*dt*spec().rollRate*(1-.7*stall.severity)*(systems.controlsFailed?.18:1),-1.3,1.3);if(!keys.left&&!keys.right&&!stick.x)roll*=Math.exp(-dt*.35);yaw-=Math.sin(roll)*dt*.45+thrustImbalance(systems)*throttle*dt*.11;const condition=stallCondition({velocity:vel,pitch,roll,yaw,liftSpeed:spec().liftSpeed,mass:massFactor});stall={...condition,severity:stall.severity+(condition.severity-stall.severity)*(1-Math.exp(-dt*4))};stall.stalled=stall.severity>.12;if(stall.stalled){assist=false;pitch=clamp(pitch-Math.sign(stall.alpha)*stall.severity*.65*dt,-1.3,1.1);}const forward=rotate(V(0,0,1),pitch,0,yaw),sp=len(vel),desired=mul(forward,sp);vel=mix(vel,desired,1-Math.exp(-dt*1.25*(1-.94*stall.severity)*clamp(sp/(spec().liftSpeed*.9),.08,1)**2));const accel=throttle*Math.min(9,spec().thrust)*enginePower(systems)/massFactor-.00125*sp*sp-9.81*Math.sin(pitch)-stall.severity*.012*sp;vel=add(vel,mul(forward,accel*dt));const lift=9.81*clamp((sp/(spec().liftSpeed*Math.sqrt(massFactor)))**2,0,1.15)*Math.max(.2,Math.cos(roll))*(1-.92*stall.severity);vel.y+=(lift-9.81)*dt;pos=add(pos,mul(vel,dt));if(buildingCollision(pos,spec().visual?Math.min(spec().visual.span/2,spec().visual.length*.35):spec().geometry==='twin'?10:23))crash(false,'BUILDING COLLISION');else if(pos.y<=ground(pos.x,pos.z)+clearance())touchdown();const behind=rotate(V(0,spec().geometry==='twin'?13:20,spec().geometry==='twin'?-53:-82),0,0,yaw);camera=mix(camera,add(pos,behind),1-Math.exp(-dt*3));camera.y=Math.max(camera.y,ground(camera.x,camera.z)+4);target=mix(target,add(pos,mul(forward,18)),1-Math.exp(-dt*5));}else if(state==='landed'){const sp=len(vel),next=Math.max(0,sp-(keys.brake?7:3.2)*dt);vel=mul(norm(vel),next);pos=add(pos,mul(vel,dt));pos.y=ground(pos.x,pos.z)+clearance();if(terrainUnsafe(pos.x,pos.z,next)||buildingCollision(pos,spec().visual?Math.min(spec().visual.span/2,spec().visual.length*.35):spec().geometry==='twin'?10:23)){crash(false,'GROUND IMPACT');return}if(!onPavement(pos.x,pos.z)){state='taxi';parking=false;throttle=0;return}camera=mix(camera,add(pos,V(0,18,spec().geometry==='twin'?-60:-88)),1-Math.exp(-dt*2));target=mix(target,add(pos,V(0,0,15)),1-Math.exp(-dt*3));if(next<.3&&!landingMessage){landingMessage=true;showReport(true)}}else if(state==='crashed'){stepWreck(dt);}}
function render(dt){systemsUI();graphics.draw({state,saved,aircraft,livery,aircraftFamily:spec().geometry,profile:spec(),systems,crashCause,crashFuel,crashProfile,parts,pos,vel,pitch,roll,yaw,gear,throttle,debris,impactPos,camera,target,rotate},dt);$('speed').textContent=Math.round(((state==='crashed'||state==='paused'&&saved==='crashed')?len(crashGroups[0]?.vel||V()):len(vel))*1.944);$('alt').textContent=Math.round(Math.max(0,pos.y-ground(pos.x,pos.z)));$('throttle').textContent=Math.round(throttle*100);$('vspeed').textContent=(state==='flight'||state==='paused'&&saved==='flight'?vel.y:0).toFixed(1);$('notice').textContent=state==='paused'?'HOLDING / PAUSED':state==='crashed'?crashCause+' · '+Math.round(impact*1.944)+' KT · '+(crashProfile?.mode==='intact'?'AIRFRAME INTACT':crashProfile?.mode==='sections'?'3 MAJOR SECTIONS':debris.length+' PANELS'):state==='landed'?(len(vel)>.3?'SAFE TOUCHDOWN · BRAKING · SPACE FOR HARD BRAKE':'PARKED · AIRFRAME INTACT'):state==='flight'?(mission==='approach'||assist?(assist?'ASSIST ON · INPUT TAKES CONTROL':'MANUAL APPROACH')+' · '+(gear?'GEAR DOWN':'LOWER GEAR')+' · '+(pos.z<0?Math.round(-pos.z)+' M TO RUNWAY':Math.abs(pos.x)<29?'OVER RUNWAY':'ALIGN WITH RUNWAY'):pos.y-ground(pos.x,pos.z)<65?'TERRAIN · PULL UP':len(vel)<spec().liftSpeed*Math.sqrt(massFactor)*.78?'Low speed. Increase power and lower the nose gently.':'FREE FLIGHT / '+Math.round(elapsed)+' SEC'):'FLIGHT TEST '+String(flight).padStart(3,'0')+' / RIDGELINE';updateFlightUI();const flying=(state==='paused'?saved:state)==='flight';$('notice').classList.toggle('stall-alert',flying&&stall.stalled);if(flying&&stall.stalled)$('notice').textContent='STALL · Lower the nose. Level the wings. Add power.';else if(flying&&stall.warning)$('notice').textContent='STALL WARNING · Ease the nose down and build speed.';if(engine){engine.o.frequency.value=30+throttle*65;engine.g.gain.value=!muted&&['flight','taxi'].includes(state)?.015*enginePower(systems):0}}
function systemsUI(rebuild=false){$('fuel').textContent=Math.ceil(systems.fuel)+'%';$('system-status').textContent=(state==='crashed'||state==='paused'&&saved==='crashed')?(crashProfile?.label||'AIRFRAME DAMAGED'):systems.message;const active=['flight','taxi','parked','pushback'].includes(state==='paused'?saved:state);$('apply-failure').disabled=!active;$('repair').disabled=!active;$('failure-status').textContent=active?'Each problem stays active until you repair or restart.':'Start a flight to trigger a failure.';if(rebuild){$('engine-target').innerHTML=systems.engines.map((e,i)=>'<option value="'+i+'">Engine '+e.name+'</option>').join('')}$('engine-readout').textContent=systems.engines.map((e,i)=>(i+1)+': '+(e.onFire?'FIRE':e.running?'OK':'OFF')).join('  ')}
function refreshFailureTarget(){$('engine-target').disabled=!['engine','fire'].includes($('failure-kind').value)}
$('failure-toggle').onclick=()=>{const tray=$('failures');tray.classList.toggle('hidden');$('failure-toggle').setAttribute('aria-expanded',String(!tray.classList.contains('hidden')))};
$('close-failures').onclick=()=>{$('failures').classList.add('hidden');$('failure-toggle').setAttribute('aria-expanded','false')};
$('failure-kind').onchange=refreshFailureTarget;
$('apply-failure').onclick=()=>{if(!['flight','taxi','parked','pushback'].includes(state==='paused'?saved:state))return;const wasPaused=state==='paused',result=triggerFailure(systems,$('failure-kind').value,Number($('engine-target').value));if(!result)return;$('failures').classList.add('hidden');$('failure-toggle').setAttribute('aria-expanded','false');assist=false;gearUI();if(result==='breakup'){if(wasPaused)state=saved;crash(pos.y-ground(pos.x,pos.z)>clearance()+2,'ONBOARD EXPLOSION');if(wasPaused){saved='crashed';state='paused'}}systemsUI()};
$('repair').onclick=()=>{if(!['flight','taxi','parked','pushback'].includes(state==='paused'?saved:state))return;systems=createSystems(spec());massFactor=currentConfig?loadFactor(aircraft,cabin.passengers,100):1;gearUI();systemsUI(true)};
$('quality').onclick=()=>{$('quality').textContent='GRAPHICS '+graphics.nextQuality()};
function updateFlightUI(){
 const actual=state==='paused'?saved:state;
 $('show-report').classList.toggle('hidden',!(cabin.final||reportShown));$('show-report').textContent=actual==='crashed'?'VIEW CRASH REPORT':'FLIGHT REPORT';$('heading').textContent=String(headingDegrees(yaw)).padStart(3,'0');$('aboard').textContent=cabin.total;
 $('flight-identity').textContent=names[aircraft]+' · '+(aircraft==='c172'?'Classic blue & white':livery.name);
 $('parking').classList.toggle('hidden',!onGround());$('parking').classList.toggle('engaged',parking);$('parking').textContent=parking?'RELEASE BRAKE':'SET BRAKE';$('parking').disabled=state==='paused';
 $('pushback').classList.toggle('hidden',!['parked','pushback'].includes(actual));$('pushback').disabled=state==='paused';$('pushback').textContent=actual==='pushback'?'STOP PUSHBACK':'PUSHBACK';
 $('taxi-guide').classList.toggle('hidden',actual!=='taxi'||currentConfig?.start==='runway');$('taxi-guide').disabled=state!=='taxi';$('taxi-guide').textContent=taxiAssist?'STOP AUTO TAXI':'AUTO TAXI TO RUNWAY';
 if(state==='parked')$('notice').textContent='Start here: tap Pushback to leave the gate.';
 if(state==='pushback')$('notice').textContent=parking?'Pushback paused. Release the brake to continue.':'Steer while reversing. Tap Stop Pushback to take over.';
 if(state==='taxi')$('notice').textContent=taxiAssist?'Auto taxi is driving to the runway. Steer to take over.':parking?'First, tap Release Brake. Then slide Power up.':len(vel)>(spec().takeoffSpeed||65)*Math.sqrt(massFactor)?'Ready to lift off! Pull the joystick down gently.':'Increase power. Lift off at '+Math.round((spec().takeoffSpeed||65)*Math.sqrt(massFactor)*1.944)+' KT';
 if(state==='crashed'&&!cabin.final)$('notice').textContent='DAMAGE IN PROGRESS · REPORT AT IMPACT';
 $('throttle-slider').value=Math.round(throttle*100);$('throttle-slider').disabled=!['flight','taxi'].includes(state);$('power-value').textContent=Math.round(throttle*100)+'%';
 const gauges=systems.engines.map((e,i)=>'<div class="engine-gauge '+(!e.running||e.onFire?'fault':'')+'"><small>ENG '+(i+1)+'</small><b>'+enginePercent(e)+'%</b><span>'+(e.onFire?'FIRE':!e.running||systems.fuel<=0?'OFF':'POWER')+'</span></div>').join('');if(gauges!==lastEngineGauges){$('engine-gauges').innerHTML=gauges;lastEngineGauges=gauges}
 const hdg=headingDegrees(yaw);$('compass-rose').setAttribute('transform','rotate('+(-hdg)+' 60 60)');$('compass-value').textContent=String(hdg).padStart(3,'0')+'°';
 const mapX=22+pos.x*.052,mapY=170-pos.z*.06;const off=mapX<8||mapX>122||mapY<8||mapY>178;
 $('map-aircraft').setAttribute('transform','translate('+clamp(mapX,8,122)+' '+clamp(mapY,8,178)+') rotate('+hdg+')');$('nav-distance').textContent=(Math.hypot(pos.x,pos.z-1200)/1000).toFixed(1)+' KM TO AIRPORT'+(off?' · OFF MAP':'');
 $('gear').classList.toggle('hidden',actual==='crashed'||!!spec().fixedGear||onGround());$('gear').disabled=(state==='crashed'||state==='paused'&&saved==='crashed')||!!spec().fixedGear||systems.gearJammed||onGround();$('assist').disabled=state!=='flight';
}
$('parking').onclick=()=>{if(onGround()&&state!=='paused'){parking=!parking;taxiAssist=false;throttle=0;clearKeys()}};
$('pushback').onclick=()=>state==='pushback'?stopPushback():startPushback();
$('throttle-slider').oninput=e=>setThrottle(e.target.value);
$('nav-toggle').onclick=()=>{const el=$('nav-map');el.classList.toggle('hidden');$('nav-toggle').setAttribute('aria-expanded',String(!el.classList.contains('hidden')))};$('taxi-guide').onclick=toggleTaxi;
$('settings-toggle').onclick=()=>{const el=$('settings');el.classList.toggle('hidden');$('settings-toggle').setAttribute('aria-expanded',String(!el.classList.contains('hidden')))};
$('close-settings').onclick=()=>{$('settings').classList.add('hidden');$('settings-toggle').setAttribute('aria-expanded','false')};
$('show-report').onclick=()=>{if(cabin.final||reportShown)showReport(state==='landed'||state==='paused'&&saved==='landed')};
$('dismiss-report').onclick=()=>{$('panel').classList.add('hidden')};
const setup=createSetup({start:startConfigured,prepare:id=>graphics.loadAircraft(id),opening(){state='ready';clearKeys();$('panel').classList.add('hidden')},preview(config){graphics.loadAircraft(config.aircraft);aircraft=config.aircraft;livery=LIVERIES.find(l=>l.id===config.livery);systems=createSystems(spec());pos=V(540,190,350);yaw=0;pitch=0;roll=0;gear=!!spec().fixedGear;buildAircraft();graphics.resetCamera()}});
$('new-flight').onclick=()=>setup.open();
$('more-controls').onclick=()=>{const el=$('extra-controls');el.classList.toggle('hidden');$('more-controls').setAttribute('aria-expanded',String(!el.classList.contains('hidden')))};
let helpPaused=false;
$('help-toggle').onclick=()=>{helpPaused=state!=='paused'&&state!=='ready';if(helpPaused)pause();$('pilot-help').classList.remove('hidden')};$('close-help').onclick=()=>{$('pilot-help').classList.add('hidden');if(helpPaused&&state==='paused')pause();helpPaused=false};

document.addEventListener('click',e=>{if(state!=='ready'&&e.target.closest?.('button')&&e.target.closest?.('.hud,.drawer'))canvas.focus()});
systemsUI(true);refreshFailureTarget();setup.open();
function frame(now){let dt=Math.min(.2,(now-last)/1000||.016);last=now;const wall=dt;while(dt>0){const tick=Math.min(dt,1/60);step(tick);dt-=tick}render(wall);requestAnimationFrame(frame)}requestAnimationFrame(frame);
