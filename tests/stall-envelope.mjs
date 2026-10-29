import assert from 'node:assert/strict';
import {wingStall,flightStall} from '../experimental/stall.js';
import {fleetProfile,FLEET_IDS} from '../experimental/fleet-profiles.js';
for(const id of FLEET_IDS){
 const p=fleetProfile(id),a=p.stallAngle;
 assert.equal(wingStall(a,p).liftFactor,1);
 let last=1;
 for(let alpha=a;alpha<a+p.stallWidth+.01;alpha+=.002){const loss=wingStall(alpha,p);assert(loss.liftFactor<=last+1e-9);assert(Math.abs(last-loss.liftFactor)<.02,'no sudden lift cliff');assert(loss.drag>=0);last=loss.liftFactor;}
 assert(wingStall(a+p.stallWidth,p).liftFactor<.15);
 assert.equal(wingStall(-a-.1,p).severity,wingStall(a+.1,p).severity);
 let state={severity:0,warning:false,stalled:false};
 const air=alpha=>({x:0,y:-Math.sin(alpha)*p.cruiseSpeed,z:Math.cos(alpha)*p.cruiseSpeed});
 state=flightStall(air(a-.03),p,state,1/120);assert(state.warning&&!state.stalled,'early warning');
 for(let i=0;i<120;i++)state=flightStall(air(a+.12),p,state,1/120);
 assert(state.stalled&&state.buffet>0,'developed stall');
 for(let i=0;i<240;i++)state=flightStall(air(0),p,state,1/120);
 assert(!state.warning&&!state.stalled&&state.buffet<.001,'warning clears after recovery');
 console.log('PASS',id,'smooth lift loss, warning lead, buffet and recovery');
}
