// Bounded visual deformation, not a structural engineering simulation.
// Input/output coordinates are in the aircraft's local frame (+Z forward).
export function deformWreckVertex(x,y,z,bounds,damage){
 if(!damage)return [x,y,z];
 const length=Math.max(.1,bounds.max.z-bounds.min.z),height=Math.max(.1,bounds.max.y-bounds.min.y);
 const severity=Math.max(0,Math.min(1,damage.severity||0));
 if(damage.gearCollapsed){const floor=bounds.min.y+height*.12;if(y<floor)y=floor+(y-floor)*.4;}
 if(damage.noseImpact){
  const start=bounds.max.z-length*.22,depth=Math.max(0,z-start),t=depth/(length*.22);
  z-=depth*(.15+.55*severity);
  // Deterministic buckling keeps adjacent vertices together and avoids flicker.
  const buckle=Math.sin(t*Math.PI*4)*t*severity*length*.012;
  x+=Math.sign(x)*buckle;y+=buckle*.6;
 }
 return [x,y,z];
}
