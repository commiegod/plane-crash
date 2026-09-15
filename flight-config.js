// Original liveries and game configurations; capacities are chosen cabin layouts.
export const LIVERIES=[
 {id:'horizon',name:'Horizon Air',label:'HORIZON',color:'#143d5a',accent:'#d0b276'},
 {id:'coastal',name:'Coastal Airways',label:'COASTAL',color:'#087f98',accent:'#b6f3f0'},
 {id:'aurora',name:'Aurora Jet',label:'AURORA',color:'#673bb0',accent:'#e8c5ff'},
 {id:'plain',name:'Unpainted',label:'',color:'#d7dce1',accent:'#ffffff'}
];
export const CABINS={twin:{capacity:8,crew:2,emptyMass:4000},dc10:{capacity:270,crew:10,emptyMass:120000},b747:{capacity:416,crew:16,emptyMass:180000}};
export const MODES=[{id:'departure',name:'Full departure',caption:'Gate to runway. Push back, taxi and take off.',mark:'01'}, {id:'free',name:'Free flight',caption:'Start above the airport and explore.',mark:'02'},{id:'approach',name:'Landing practice',caption:'A stabilized approach with optional assistance.',mark:'03'},{id:'sandbox',name:'Failure sandbox',caption:'Experiment with systems and emergency landings.',mark:'04'}];
export const GATES=[];
for(const pier of [760,1300,1840])for(const side of [-1,1])for(const x of [495,625,755])GATES.push({id:'g'+(GATES.length+1),name:'Gate '+(GATES.length+1),x,z:pier+side*140,yaw:side<0?0:Math.PI,side,pier});
export const RUNWAYS=[{id:'01',name:'Runway 01',x:0,z:120,yaw:0},{id:'19',name:'Runway 19',x:0,z:2280,yaw:Math.PI}];
export function spawnPoint(config){return config.start==='runway'?RUNWAYS.find(r=>r.id===config.runway)||RUNWAYS[0]:GATES.find(g=>g.id===config.gate)||GATES[0]}
export function taxiRoute(gate,runway){const z=gate.z+gate.side*70;const connector=gate.pier===760?500:gate.pier===1300?1000:1550;return [{x:295,z},{x:295,z:connector},{x:135,z:connector},{x:135,z:runway==='19'?2300:100},{x:0,z:runway==='19'?2300:100},{x:0,z:runway==='19'?2280:120}]}
export function onPavement(x,z){
 if(Math.abs(x)<34&&z>=0&&z<=2400)return true;
 if(Math.abs(x-135)<18&&z>=25&&z<=2375)return true;
 if(x>=220&&x<=1010&&z>=425&&z<=2175)return true;
 if(Math.abs(x-295)<17&&z>=410&&z<=2150)return true;
 return [100,500,1000,1550,2100,2300].some(c=>Math.abs(z-c)<17&&x>=27&&x<=(c>=500&&c<=2100?310:153));
}
export function buildingCollision(pos,radius=8){
 const boxes=[{x:885,z:1300,w:115,l:1480,h:39},{x:975,z:2080,w:36,l:36,h:75}];
 for(const z of [760,1300,1840]){boxes.push({x:650,z,w:385,l:54,h:27});for(const side of [-1,1])for(const x of [495,625,755])boxes.push({x:x-11,z:z+side*60,w:45,l:40,h:23})}
 for(let z=550;z<2100;z+=280)boxes.push({x:1005,z,w:62,l:123,h:32});
 return boxes.some(b=>pos.y< b.h+3&&Math.abs(pos.x-b.x)<b.w/2+radius&&Math.abs(pos.z-b.z)<b.l/2+radius);
}
export function loadFactor(aircraft,passengers,fuel){const c=CABINS[aircraft];return 1+passengers*90/c.emptyMass+fuel*.0015}
