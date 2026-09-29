// Gameplay approximation: angle of attack is wing attitude relative to airflow.
// FlightGear artwork does not supply this game's flight dynamics.
export function stallCondition({velocity,pitch,roll,yaw,liftSpeed,mass=1}){
 const speed=Math.hypot(velocity.x,velocity.y,velocity.z),c=Math.cos(pitch),s=Math.sin(pitch);
 const forward={x:Math.sin(yaw)*c,y:s,z:Math.cos(yaw)*c};
 const up={x:-Math.cos(yaw)*Math.sin(roll)-Math.sin(yaw)*s*Math.cos(roll),y:c*Math.cos(roll),z:Math.sin(yaw)*Math.sin(roll)-Math.cos(yaw)*s*Math.cos(roll)};
 const along=velocity.x*forward.x+velocity.y*forward.y+velocity.z*forward.z;
 const normal=velocity.x*up.x+velocity.y*up.y+velocity.z*up.z;
 const alpha=Math.atan2(-normal,along)+.065;
 const reference=liftSpeed*Math.sqrt(mass)*.76;
 // Low speed loses lift; a stall develops as the aircraft falls away from its attitude.
 const excess=Math.max(0,(Math.abs(alpha)-.25)/.23);
 const stalled=speed>2&&excess>0;
 return {alpha,speed,reference,severity:Math.min(1,excess),stalled,warning:Math.abs(alpha)>.20||speed<reference*1.12};
}
