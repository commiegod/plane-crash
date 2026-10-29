// Shared by aerodynamic forces and pilot feedback, so warnings match the physics.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function wingStall(alpha,profile){
 const critical=profile?.stallAngle||.28,width=profile?.stallWidth||.28;
 const excess=clamp((Math.abs(alpha)-critical)/width,0,1);
 const severity=excess*excess*(3-2*excess);
 return {severity,liftFactor:1-.88*severity,drag:.24*severity};
}
export function flightStall(air,profile,previous,dt){
 const speed=Math.hypot(air.x,air.y,air.z),alpha=Math.atan2(-air.y,air.z);
 const critical=profile?.stallAngle||.28,reference=(profile?.rotationSpeed||31)*Math.sqrt(1.1/1.4);
 const target=wingStall(alpha,profile).severity;
 const severity=previous.severity+(target-previous.severity)*(1-Math.exp(-dt*5));
 const warning=Math.abs(alpha)>critical-(previous.warning?.065:.045)||Math.max(0,air.z)<reference*(previous.warning?1.12:1.06);
 const stalled=severity>(previous.stalled?.035:.075);
 const buffet=clamp(Math.max(severity,(Math.abs(alpha)-(critical-.045))/.09),0,1);
 return {alpha,speed,reference,severity,warning,stalled,buffet};
}
