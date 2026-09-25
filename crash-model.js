// Gameplay crashworthiness model. Values are tuned for readable outcomes, not injury prediction.
export function assessImpact({speed=0,sink=0,bank=0,pitch=0,airborne=false,gear=true,cause='',fuel=0}){
 const obstacle=/BUILDING|ROUGH|GROUND IMPACT/.test(cause),blast=cause==='ONBOARD EXPLOSION';
 const normal=Math.max(0,-sink),attitude=Math.abs(bank)*13+Math.max(0,-pitch)*18;
 const energy=normal+attitude+(obstacle?speed*.48:Math.max(0,speed-85)*.16);
 const severity=blast?1:Math.min(1,energy/42+(airborne?.28:0));
 const mode=blast||severity>=.8?'fragmented':severity>=.3||airborne?'sections':'intact';
 const fire=blast?Math.min(1,.35+fuel/100):fuel>0&&severity>.48?Math.min(1,(severity-.4)*fuel/65):0;
 return {mode,severity,fire,gearCollapsed:!gear||normal>5,energy,label:mode==='intact'?(!gear?'BELLY LANDING':'LANDING GEAR COLLAPSE'):mode==='sections'?'MAJOR STRUCTURAL DAMAGE':'CABIN DESTROYED'};
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
