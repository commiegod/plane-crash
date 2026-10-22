// Gameplay crashworthiness model. Values are tuned for readable outcomes, not injury prediction.
export function assessImpact({speed=0,sink=0,bank=0,pitch=0,airborne=false,gear=true,cause='',fuel=0}){
 const obstacle=/BUILDING|ROUGH|GROUND IMPACT/.test(cause),blast=cause==='ONBOARD EXPLOSION';
 const normal=Math.max(0,-sink),attitude=Math.abs(bank)*13+Math.max(0,-pitch)*18;
 const energy=normal+normal*normal/90+attitude+(obstacle?speed*.30+speed*speed/450:Math.max(0,speed-85)*.16);
 const severity=blast?1:Math.min(1,energy/42+(airborne?.28:0));
 const mode=blast||severity>=.8?'fragmented':severity>=.3||airborne?'sections':'intact';
 const fire=blast?Math.min(1,.35+fuel/100):fuel>0&&severity>.48?Math.min(1,(severity-.4)*fuel/65):0;
 return {mode,severity,fire,noseImpact:obstacle&&speed>12,gearCollapsed:!gear||normal>5,energy,label:mode==='intact'?(!gear?'BELLY LANDING':normal>5?'LANDING GEAR COLLAPSE':'AIRFRAME DAMAGED'):mode==='sections'?'MAJOR STRUCTURAL DAMAGE':'CABIN DESTROYED'};
}
export function fracturePanels(parts){
 // Subdivide long faces into short panels, preserving a bounded debris count.
 const out=[];
 for(const part of parts){const faces=part.faces.filter(f=>f.length<=4),stride=Math.max(1,Math.ceil(faces.length/8));
 for(let n=0;n<faces.length;n+=stride){const verts=[],fs=[];for(const face of faces.slice(n,n+stride)){const ids=[];for(const i of face){ids.push(verts.length);const p=part.verts[i];verts.push({x:p.x+part.center.x,y:p.y+part.center.y,z:p.z+part.center.z})}fs.push(ids)}
 if(!verts.length)continue;const center=verts.reduce((a,p)=>({x:a.x+p.x/verts.length,y:a.y+p.y/verts.length,z:a.z+p.z/verts.length}),{x:0,y:0,z:0});
 out.push({kind:'wreck',cabin:part.kind==='fuselage'||part.kind==='aft'||parts.indexOf(part)<2,center,verts:verts.map(p=>({x:p.x-center.x,y:p.y-center.y,z:p.z-center.z})),faces:fs,color:part.color});}
 }return out;
}

// Integrate ground drag analytically so settling is consistent across frame rates.
export function wreckGroundMotion(speed,dt,mode,paved){
 const friction=(paved?8:13)*(mode==='intact'?.8:1),drag=mode==='fragmented'?.8:mode==='sections'?.40:.18;
 const stop=Math.log1p(Math.max(0,speed)*drag/friction)/drag,t=Math.min(Math.max(0,dt),stop);
 return {speed:Math.max(0,(speed+friction/drag)*Math.exp(-drag*t)-friction/drag),distance:(speed+friction/drag)*(1-Math.exp(-drag*t))/drag-friction*t/drag};
}

// Surface contact is determined by descent and sideways motion, not runway heading.
// These thresholds are gameplay tuning, not certified landing limits.
export function assessTouchdown({sink=0,bank=0,pitch=0,gear=true,speed=0,lateral=0,approach=72,blocked=false}){
 const descent=Math.max(0,-sink);
 const controlled=Math.abs(bank)<.17&&pitch>-.12&&pitch<.25&&Math.abs(lateral)<Math.max(5,speed*.16);
 if(blocked||!controlled||speed>approach*1.5)return 'impact';
 if(!gear)return 'belly';
 if(descent>5)return 'collapse';
 return descent>2.5?'hard':'smooth';
}

// Shallow contacts retain tangential motion; steep impacts spend more energy at contact.
export function groundImpactRetention(mode,sink,speed){
 const normal=Math.max(0,-sink),ratio=normal/Math.max(1,speed);
 return Math.max(.25,(mode==='intact'?.97:mode==='sections'?.90:.78)-Math.min(.5,ratio*.8));
}

// Contact normal speed measures motion into terrain, not speed along it.
export function assessScrape({normalSpeed=0,depth=0,speed=0,wear=0,dt=0}){
 const next=wear+Math.max(0,dt)*Math.max(0,speed-8)*(.006+Math.max(0,depth)*.035);
 return {wear:next,breaks:normalSpeed>4.5||depth>.85||next>=1};
}
