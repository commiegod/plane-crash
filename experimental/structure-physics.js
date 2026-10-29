import * as C from '../assets/cannon-es.js';
export const STEP=1/120;
const v=(x=0,y=0,z=0)=>new C.Vec3(x,y,z),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const PARTS={
 cabin:{mass:650},nose:{mass:110,parent:'cabin',strength:140000},tail:{mass:70,parent:'cabin',strength:110000},
 leftInner:{mass:48,parent:'cabin',strength:100000,area:4.1},leftTip:{mass:32,parent:'leftInner',strength:24000,area:4},
 rightInner:{mass:48,parent:'cabin',strength:100000,area:4.1},rightTip:{mass:32,parent:'rightInner',strength:24000,area:4},
 leftGear:{mass:14,parent:'cabin',strength:24000},rightGear:{mass:14,parent:'cabin',strength:24000},noseGear:{mass:12,parent:'nose',strength:16000}
};
export function createStructure(definitions,{scenario='flight',aero=true,surfaceHeight=()=>0,installEnvironment=null,initialPose=null,profile=null}={}){
 const massScale=profile?.massScale||1,scale=profile?.scale||1;
 const parts=Object.fromEntries(Object.entries(PARTS).map(([id,p])=>[id,{...p,parent:id==='noseGear'&&profile?.id==='dc3'?'tail':p.parent,mass:p.mass*massScale,strength:p.strength*massScale*scale*(profile&&profile.id!=='c172'&&id.endsWith('Gear')?3:1),area:p.area?(profile?.area||16.2)*p.area/16.2:undefined}]));
 const world=new C.World({gravity:v(0,-9.81,0),allowSleep:true});world.solver.iterations=35;world.solver.tolerance=1e-7;
 // Cannon clamps friction equations as impulses; scale the contact budget to our fixed step.
 const groundMat=new C.Material('ground'),hullMat=new C.Material('hull'),wheelMat=new C.Material('wheel');
 world.addContactMaterial(new C.ContactMaterial(groundMat,hullMat,{friction:.48*STEP,restitution:.12,contactEquationStiffness:1e8}));
 world.addContactMaterial(new C.ContactMaterial(groundMat,wheelMat,{friction:.035*STEP,restitution:.04,contactEquationStiffness:1e8}));
 world.defaultContactMaterial.friction=.4*STEP;world.defaultContactMaterial.restitution=.08;
 const ground=new C.Body({mass:0,material:groundMat,shape:new C.Plane()});ground.quaternion.setFromEuler(-Math.PI/2,0,0);ground.surface='terrain';if(installEnvironment)installEnvironment(world,groundMat);else world.addBody(ground);
 const bodies={},joints=[],events=[],obstacles=[],hits=[];let time=0,accumulator=0,droppedTime=0;const controls={pitch:0,roll:0};
 const settings={flight:[0,70,-140,0,0,40],wing:[0,4,-22,0,0,40],gear:[0,5,-35,0,-6,24],runway:[0,1.55,-80,0,0,0],belly:[0,1.8,-35,0,-1,25]};
 const spawn=settings[scenario]||settings.flight;
 for(const [id,def] of Object.entries(definitions)){
  const cfg=parts[id];if(!cfg)continue;
  const body=new C.Body({mass:cfg.mass,material:id.endsWith('Gear')?wheelMat:hullMat,position:v(def.center.x+spawn[0],def.center.y+spawn[1],def.center.z+spawn[2]),linearDamping:.012,angularDamping:.28,sleepSpeedLimit:.15,sleepTimeLimit:1.5});
  let half=def.half.map(n=>Math.max(.06,n)),offset=v(def.shapeOffset?.x||0,def.shapeOffset?.y||0,def.shapeOffset?.z||0);
  if(!profile||profile.id==='c172') { if(id==='cabin')half=[.65,.55,half[2]];
  if(id==='nose')half=[.52,.55,half[2]];
  if(id.endsWith('Inner')){half=[half[0],.15,half[2]];offset.y=.32-def.center.y;} }
  if(def.colliders){for(const c of def.colliders)body.addShape(new C.Box(v(...c.half)),v(...c.offset));}else body.addShape(new C.Box(v(...half)),offset);if(id==='cabin'||id==='nose'||id.endsWith('Inner'))for(const p of def.support||[])body.addShape(new C.Sphere(.035),v(...p));body.velocity.set(spawn[3],spawn[4],spawn[5]);if(initialPose){const q=new C.Quaternion();q.setFromEuler(-initialPose.pitch,initialPose.yaw,initialPose.roll,'YXZ');body.position.copy(q.vmult(v(def.center.x,def.center.y,def.center.z)));body.position.vadd(v(initialPose.pos.x,initialPose.pos.y,initialPose.pos.z),body.position);body.quaternion.copy(q);body.velocity.copy(initialPose.vel);}body.addEventListener('collide',e=>{const normalSpeed=Math.abs(e.contact.getImpactVelocityAlongNormal());if(body.collisionResponse&&normalSpeed>3&&e.body.surface){if(hits.length>=100)hits.shift();hits.push({part:id,speed:normalSpeed,surface:e.body.surface,time});}});body.part=id;body.home={...def.center};world.addBody(body);bodies[id]=body;
 }
 for(const [id,cfg] of Object.entries(parts))if(cfg.parent&&bodies[id]&&bodies[cfg.parent]){
  // Preserve comparable joint rigidity as mass and rotational inertia grow across the fleet.
  const constraint=new C.LockConstraint(bodies[cfg.parent],bodies[id],{maxForce:2e7*massScale*scale});constraint.collideConnected=false;if(profile&&profile.id!=='c172')constraint.equations.forEach((e,i)=>e.setSpookParams(1e7*massScale*(i>=3?scale*scale:1),4,STEP));world.addConstraint(constraint);
  joints.push({id,parent:cfg.parent,constraint,strength:cfg.strength,stress:0,overload:0,broken:false});
 }
 function updateCollisionFamilies(){const parent={};for(const id of Object.keys(bodies))parent[id]=id;const root=id=>parent[id]===id?id:root(parent[id]);for(const j of joints)if(!j.broken)parent[root(j.id)]=root(j.parent);const entries=Object.entries(bodies);entries.forEach(([id,b],i)=>b.collisionFilterGroup=1<<(i+1));for(const [id,b] of entries){b.collisionFilterMask=1|(1<<14)|(1<<15);for(const [other,o] of entries)if(root(id)!==root(other))b.collisionFilterMask|=o.collisionFilterGroup;}}
 updateCollisionFamilies();
 function breakJoint(j,reason='connection overloaded'){if(j.broken)return;j.broken=true;world.removeConstraint(j.constraint);bodies[j.id].wakeUp();bodies[j.parent].wakeUp();events.push({time,id:j.id,reason});updateCollisionFamilies();}
 function attached(id){if(!bodies[id])return false;if(id==='cabin')return true;const j=joints.find(j=>j.id===id);return !!j&&!j.broken&&attached(j.parent);}
 if(scenario==='belly')for(const j of joints.filter(j=>j.id.endsWith('Gear')))breakJoint(j,'gear-collapse test');
 // Broad, thick obstacle avoids thin-wall tunnelling at the test speeds.
 if(scenario==='wing'){
  const wall=new C.Body({mass:0,material:groundMat,shape:new C.Box(v(1,2.5,2)),position:v(-4.4,2.5,0)});world.addBody(wall);obstacles.push(wall);
 }
 function forces(input){
  // Shape stick travel, then slew the surfaces at the fixed physics rate.
  // After wing loss, retain direct surface authority to counter the asymmetric lift.
  const damagedWing=!attached('leftTip')||!attached('rightTip');
  const raw=clamp(input.roll||0,-1,1),u=Math.sign(raw)*Math.max(0,(Math.abs(raw)-.06)/.94),rollTarget=damagedWing?raw:.4*u+.6*u*u*u;
  controls.roll+=(rollTarget-controls.roll)*(1-Math.exp(-STEP/.28));
  controls.pitch+=(clamp(input.pitch||0,-1,1)-controls.pitch)*(1-Math.exp(-STEP/.25));
  input={...input,...controls};
  const cabin=bodies.cabin,omega=cabin.vectorToLocalFrame(cabin.angularVelocity),local=cabin.vectorToLocalFrame(cabin.velocity),speed=Math.max(0,local.z),q=.5*1.225*speed*speed;
  if(aero){for(const [id,cfg] of Object.entries(parts)){
   const b=bodies[id];if(!b)continue;
   const air=b.vectorToLocalFrame(b.velocity),forward=Math.max(0,air.z),pressure=.5*1.225*forward*forward;
   if(cfg.area){const alpha=Math.atan2(-air.y,Math.max(3,forward));let cl=clamp(.65+4.6*alpha+clamp(input.flaps||0,0,1)*.3,-1.1,1.4);if(Math.abs(alpha)>.28)cl*=Math.max(.12,1-(Math.abs(alpha)-.28)*2.8);
    const connected=attached(id),desiredRoll=-input.roll*.45/Math.pow(scale,.15);
    const aileron=connected?(id.startsWith('left')?1:-1)*(damagedWing?input.roll*.19:clamp((omega.z-desiredRoll)*.35,-.13,.13))*Math.min(1,((profile?.rotationSpeed||31)*1.3/Math.max(1,forward))**2):0;
    b.applyLocalForce(v(0,pressure*cfg.area*(cl+aileron),-pressure*cfg.area*(.025+.055*cl*cl+clamp(input.flaps||0,0,1)*.04)),v(0,0,profile?.liftOffset||0));
   }else b.applyLocalForce(v(-air.x*Math.abs(air.x)*.8*scale*scale,-air.y*Math.abs(air.y)*.35*scale*scale,-air.z*Math.abs(air.z)*.08*scale*scale),v());
  }
  if(!profile||profile.id==='c172'){if(attached('nose'))bodies.nose.applyLocalForce(v(0,0,clamp(input.throttle||0,0,1)*(profile?.thrust||3000)),v());
  }else for(const [index,e] of profile.engines.entries()){if(!attached(e.part))continue;const body=bodies[e.part],home=body.home;body.applyLocalForce(v(0,0,clamp(input.throttle||0,0,1)*(input.engines?.[index]??1)*profile.thrust/profile.engines.length),v(e.position.x-home.x,e.position.y-home.y,e.position.z-home.z));}
  const alpha=Math.atan2(-local.y,Math.max(3,speed));
  const tail=attached('tail')?1:0,wingAuthority=(attached('leftInner')+attached('rightInner'))/2;
  const authority=clamp((speed/((profile?.rotationSpeed||31)*.8))**2,0,1);
  const pitchRate=clamp(q*(-input.pitch*(profile&&profile.id!=='c172'?25:15)+alpha*70-1.5)/8000,-.35,.35);
  // Bound commanded pitch/yaw rates before scaling damping to aircraft size.
  // Control inputs cannot demand unbounded rotation as dynamic pressure grows.
  const torque=v((tail*pitchRate-omega.x)*8000*massScale*scale*scale,
   (tail*clamp((local.x*q*.04+input.roll*q*.08)/4000,-.2,.2)-omega.y)*4000*massScale*scale*scale,
   -cabin.inertia.z*omega.z*.8*wingAuthority*authority);
  cabin.torque.vadd(cabin.vectorToWorldFrame(torque),cabin.torque);
  }
  if(cabin.position.y-surfaceHeight(cabin.position.x,cabin.position.z)<(profile?.clearance||1.5)+1){const steer=cabin.vectorToWorldFrame(v(0,(input.roll||0)*Math.min(Math.abs(local.z),12)*40*massScale*scale*scale/(1+Math.abs(local.z)/20),0));cabin.torque.vadd(steer,cabin.torque);
   if(input.reverse&&attached('nose'))cabin.applyLocalForce(v(0,0,clamp(-3-local.z,-3,3)*1600*massScale),v());
   if(input.brake)for(const b of Object.values(bodies))if(attached(b.part))b.applyForce(v(-b.velocity.x*b.mass*2,0,-b.velocity.z*b.mass*2));
  }
 }
 function step(input={}){
  for(const [id,b] of Object.entries(bodies))if(id.endsWith('Gear'))b.collisionResponse=input.gear!==false||!attached(id);
  forces(input);world.step(STEP);time+=STEP;
  const failing=[];for(const j of joints){if(j.broken)continue;const e=j.constraint.equations;
   const force=Math.hypot(...e.slice(0,3).map(e=>e.multiplier)),torque=Math.hypot(...e.slice(3).map(e=>e.multiplier));
   j.stress=Math.max(force/j.strength,torque/(j.strength*.65));
   j.overload=Math.max(0,j.overload+(j.stress>1?(j.stress-1)*STEP:-STEP*2));
   if(j.stress>1&&(j.overload>.025||j.stress>9))failing.push(j);
  }
  if(failing.length){failing.sort((a,b)=>b.stress-a.stress);breakJoint(failing[0]);for(const j of joints)j.overload=0;}
 }
 return {world,bodies,joints,events,obstacles,hits,attached,step,breakJoint,
  advance(dt,input={}){const accepted=Math.min(.1,Math.max(0,dt));droppedTime+=Math.max(0,dt-accepted);accumulator+=accepted;let steps=0;while(accumulator>=STEP&&steps<12){step(input);accumulator-=STEP;steps++;}return steps;},
  get time(){return time;},get droppedTime(){return droppedTime;}
 };
}
