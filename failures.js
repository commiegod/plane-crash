// Sandbox systems: discrete failures, simplified fuel use, and engine thrust balance.
export function createSystems(aircraft){return {fuel:100,leak:false,controlsFailed:false,gearJammed:false,fireTime:0,engines:aircraft.engines.map(e=>({...e,running:true,onFire:false})),message:'ALL SYSTEMS NORMAL'}}
export function activeFaults(s){return s.fuel<=0||s.leak||s.controlsFailed||s.gearJammed||s.engines.some(e=>!e.running||e.onFire)}
export function triggerFailure(s,kind,engineIndex=0){const e=s.engines[engineIndex];switch(kind){
 case 'engine':if(!e)return false;e.running=false;s.message='ENGINE '+e.name+' FAILED';break;
 case 'fire':if(!e)return false;e.running=false;e.onFire=true;s.message='ENGINE '+e.name+' FIRE';break;
 case 'all-engines':s.engines.forEach(e=>e.running=false);s.message='ALL ENGINES FAILED';break;
 case 'fuel-leak':s.leak=true;s.message='FUEL LEAK';break;
 case 'empty-fuel':s.fuel=0;s.engines.forEach(e=>{e.running=false;e.onFire=false});s.message='FUEL EXHAUSTED';break;
 case 'controls':s.controlsFailed=true;s.message='HYDRAULIC FAILURE · REDUCED CONTROL';break;
 case 'gear':s.gearJammed=true;s.message='LANDING GEAR JAMMED';break;
 case 'explosion':s.message='ONBOARD EXPLOSION';return 'breakup';
 default:return false;
 }return true}
export function tickSystems(s,dt,throttle,aircraft){if(dt<=0)return false;const live=s.engines.filter(e=>e.running).length;s.fuel=Math.max(0,s.fuel-dt*((.2+.8*throttle)*aircraft.fuelBurn*live/s.engines.length+(s.leak?2.5:0)));if(s.fuel===0){s.engines.forEach(e=>{e.running=false;e.onFire=false});s.message='FUEL EXHAUSTED'}if(s.engines.some(e=>e.onFire)){s.fireTime+=dt;return s.fireTime>=30}return false}
export function enginePower(s){return s.fuel>0?s.engines.filter(e=>e.running).length/s.engines.length:0}
export function thrustImbalance(s){return s.fuel>0?s.engines.reduce((n,e)=>n+(e.running?e.side:0),0)/s.engines.length:0}
