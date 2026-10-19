// Tuned gameplay responses, not certified aircraft performance data.
export const LIGHT_HANDLING=Object.freeze({
 c172:{flapDegrees:30,takeoffFlaps:1/3,flapLimit:46,steering:.78,turnGrip:3.2,response:4.5,braking:6.2,stroke:.16},
 twin:{flapDegrees:40,takeoffFlaps:.25,flapLimit:57,steering:.60,turnGrip:2.7,response:3.2,braking:5.4,stroke:.13}
});
export function lightAero(id,flaps=0,gear=false){
 const h=LIGHT_HANDLING[id];if(!h)return {liftScale:1,drag:.00125,rotationScale:1};
 const f=Math.max(0,Math.min(1,flaps));
 return {liftScale:1-.14*f,drag:.00125+.00065*f+(id==='twin'&&gear?.00010:0),rotationScale:1-.07*f};
}
export function lightSteering(id,input,speed){
 const h=LIGHT_HANDLING[id];if(!h)return input*.6*Math.min(1,speed/3)/(1+speed/18);
 // Tire grip limits lateral acceleration at speed; no pivoting at a standstill.
 const rate=h.steering*Math.min(1,speed/3)/(1+speed/12);
 return input*Math.min(rate,h.turnGrip/Math.max(1,speed));
}
