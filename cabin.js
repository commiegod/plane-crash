// Deliberately a deterministic game model, not a real-world injury predictor.
const cabinClamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export function createCabin(passengers,crew){
 passengers=Math.max(0,Math.floor(passengers));crew=Math.max(0,Math.floor(crew));
 const total=passengers+crew,a=Math.ceil(total/3),b=Math.ceil((total-a)/2);
 return {passengers,crew,total,sections:[a,b,total-a-b].map((occupants,i)=>({name:['Forward','Center','Rear'][i],occupants,survivors:occupants,injured:0,fatalities:0,damage:0,evacuated:0})),phase:'aboard',elapsed:0,fire:0,exits:1,final:false};
}
export function startIncident(cabin,{speed,sink,bank,airborne,fire,gear,cause}){
 cabin.phase=airborne?'descending':'impact';cabin.elapsed=0;cabin.fire=cabinClamp(fire);cabin.cause=cause;
 const severity=cabinClamp(Math.abs(sink)/35+Math.max(0,speed-35)/160+Math.abs(bank)*.2+(gear?0:.08)+(airborne||cause==='ONBOARD EXPLOSION'?.65:0));
 cabin.exits=cabinClamp(1-severity*.7,.15,1);
 cabin.sections.forEach((s,i)=>{s.damage=cabinClamp(severity*[1.13,1,.87][i]);s.fatalities=Math.min(s.occupants,Math.floor(s.occupants*cabinClamp((s.damage-.18)*1.18)));s.survivors=s.occupants-s.fatalities;s.injured=Math.floor(s.survivors*s.damage*.7)});
 cabin.impact={speed,sink,bank,airborne};
}
export function tickCabin(cabin,dt,grounded){
 if(cabin.final||cabin.phase==='aboard')return;
 if(!grounded){cabin.phase='descending';return}
 // Resolve the same abstract fire/exit outcome immediately on impact.
 for(const s of cabin.sections){
 const escaped=Math.min(s.survivors,Math.floor(s.occupants*cabin.exits));
 const trapped=Math.max(0,s.survivors-escaped),lost=Math.floor(trapped*cabin.fire*(.25+.6*s.damage));
 s.fatalities+=lost;s.survivors-=lost;s.injured=Math.min(s.survivors,s.injured+Math.floor((trapped-lost)*cabin.fire*.4));s.evacuated=s.survivors;
 }
 cabin.phase='complete';cabin.final=true;
}
export function cabinTotals(cabin){return cabin.sections.reduce((a,s)=>({survivors:a.survivors+s.survivors,injured:a.injured+s.injured,fatalities:a.fatalities+s.fatalities,evacuated:a.evacuated+s.evacuated}),{survivors:0,injured:0,fatalities:0,evacuated:0})}
