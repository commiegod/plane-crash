// Tuned gameplay responses, not certified aircraft performance data.
export const LIGHT_HANDLING=Object.freeze({
 c172:{flapDegrees:30,takeoffFlaps:1/3,flapLimit:46,steering:.78,turnGrip:3.2,response:4.5,braking:6.2,stroke:.16},
 a320:{flapDegrees:40,takeoffFlaps:.375,flapLimit:105,steering:.40,turnGrip:2.0,response:1.65,braking:4.2,stroke:.26,airThrust:12,flapDrag:.00042,flapRate:.13},
 b737:{flapDegrees:40,takeoffFlaps:.25,flapLimit:100,steering:.46,turnGrip:2.2,response:1.9,braking:4.6,stroke:.23,airThrust:12.5,flapDrag:.00046,flapRate:.15},
 dc3:{flapDegrees:40,takeoffFlaps:.25,flapLimit:70,steering:.50,turnGrip:1.8,response:2.2,braking:3.8,stroke:.18,airThrust:9.4,flapDrag:.00040,flapRate:.18},
 dc9:{flapDegrees:50,takeoffFlaps:.30,flapLimit:95,steering:.43,turnGrip:2.1,response:1.8,braking:4.4,stroke:.22,airThrust:11.5,flapDrag:.00044,flapRate:.14},
 twin:{flapDegrees:40,takeoffFlaps:.25,flapLimit:57,steering:.60,turnGrip:2.7,response:3.2,braking:5.4,stroke:.13}
});
export function lightAero(id,flaps=0,gear=false){
 const h=LIGHT_HANDLING[id];if(!h)return {liftScale:1,drag:.00125,rotationScale:1};
 const f=Math.max(0,Math.min(1,flaps));
 return {liftScale:1-.14*f,drag:.00125+(h.flapDrag??.00065)*f+(!['c172'].includes(id)&&gear?.00010:0),rotationScale:1-(h.airThrust?.14:.07)*f};
}
export function lightSteering(id,input,speed){
 const h=LIGHT_HANDLING[id];if(!h)return input*.6*Math.min(1,speed/3)/(1+speed/18);
 // Tire grip limits lateral acceleration at speed; no pivoting at a standstill.
 const rate=h.steering*Math.min(1,speed/3)/(1+speed/12);
 return input*Math.min(rate,h.turnGrip/Math.max(1,speed));
}
