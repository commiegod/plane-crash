// Geometry profiles and flight values are game approximations, not aircraft specifications.
const defineEngine=(name,x,y,z)=>({name,position:{x,y,z},side:Math.sign(x)});
export const AIRCRAFT = Object.freeze([
 {id:'twin',name:'Twin-engine trainer',geometry:'twin',clearance:3.2,thrust:13,liftSpeed:72,pitchRate:.48,rollRate:1.1,fuelBurn:.055,engines:[defineEngine('1 · Left',-5,-1.1,0),defineEngine('2 · Right',5,-1.1,0)]},
 {id:'dc10',name:'McDonnell Douglas DC-10',geometry:'dc10',clearance:4.4,thrust:13,liftSpeed:72,pitchRate:.44,rollRate:.9,fuelBurn:.065,engines:[defineEngine('1 · Left wing',-7,-1.6,0),defineEngine('2 · Tail',0,3.6,-15),defineEngine('3 · Right wing',7,-1.6,0)]},
 {id:'b747',name:'Boeing 747',geometry:'b747',clearance:4.4,thrust:13,liftSpeed:72,pitchRate:.42,rollRate:.75,fuelBurn:.075,engines:[defineEngine('1 · Left outer',-14,-1.3,-2.8),defineEngine('2 · Left inner',-7,-1.6,0),defineEngine('3 · Right inner',7,-1.6,0),defineEngine('4 · Right outer',14,-1.3,-2.8)]}
]);
export function getAircraft(id){const aircraft=AIRCRAFT.find(a=>a.id===id);if(!aircraft)throw new Error('Unknown aircraft: '+id);return aircraft}
