// Airline-inspired paint and game configurations; capacities are chosen cabin layouts.
export const LIVERIES=[
 {
  "id": "delta",
  "name": "Delta Air Lines",
  "label": "DELTA",
  "logo": "./assets/airlines/DAL.png",
  "color": "#071d49",
  "accent": "#c8102e",
  "ratio": 6.521739130434782,
  "body": "#f4f5f5"
 },
 {
  "id": "american",
  "name": "American Airlines",
  "label": "American",
  "logo": "./assets/airlines/AAL.png",
  "color": "#164b80",
  "accent": "#d22538",
  "ratio": 2.577777777777778,
  "body": "#d4d8db"
 },
 {
  "id": "united",
  "name": "United Airlines",
  "label": "UNITED",
  "logo": "./assets/airlines/UAL.png",
  "color": "#005daa",
  "accent": "#5eb6e4",
  "ratio": 5.769230769230769,
  "body": "#f5f6f6"
 },
 {
  "id": "southwest",
  "name": "Southwest Airlines",
  "label": "Southwest",
  "logo": "./assets/airlines/SWA.png",
  "color": "#304cb2",
  "accent": "#f9b612",
  "ratio": 6.521739130434782,
  "body": "#304cb2"
 },
 {
  "id": "emirates",
  "name": "Emirates",
  "label": "Emirates",
  "logo": "./assets/airlines/UAE.png",
  "color": "#d71920",
  "accent": "#00843d",
  "ratio": 1.4444444444444444,
  "body": "#f6f5f0"
 },
 {
  "id": "qatar",
  "name": "Qatar Airways",
  "label": "QATAR",
  "logo": "./assets/airlines/QTR.png",
  "color": "#5c0632",
  "accent": "#aaaeb2",
  "ratio": 3.27027027027027,
  "body": "#e6e6e7"
 },
 {
  "id": "british",
  "name": "British Airways",
  "label": "BRITISH AIRWAYS",
  "logo": "./assets/airlines/BAW.png",
  "color": "#08264c",
  "accent": "#c8102e",
  "ratio": 2.488888888888889,
  "body": "#f6f6f5"
 },
 {
  "id": "lufthansa",
  "name": "Lufthansa",
  "label": "Lufthansa",
  "logo": "./assets/airlines/DLH.png",
  "color": "#071d49",
  "accent": "#ffffff",
  "ratio": 5.769230769230769,
  "body": "#f6f6f5"
 },
 {
  "id": "airfrance",
  "name": "Air France",
  "label": "AIRFRANCE",
  "logo": "./assets/airlines/AFR.png",
  "color": "#051039",
  "accent": "#ed2939",
  "ratio": 11.538461538461538,
  "body": "#f6f6f5"
 },
 {
  "id": "singapore",
  "name": "Singapore Airlines",
  "label": "SINGAPORE AIRLINES",
  "logo": "./assets/airlines/SIA.png",
  "color": "#092345",
  "accent": "#d4a548",
  "ratio": 2.7333333333333334,
  "body": "#f4f3ed"
 }
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
