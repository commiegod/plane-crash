process.chdir(require('path').join(__dirname,'..'));
const fs=require('fs'),vm=require('vm'),assert=require('assert');const script=fs.readFileSync('light-aircraft.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('stall-model.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('crash-model.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('aircraft-meshes.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('flight-config.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('cabin.js','utf8').replace(/export /g,'')+'\nconst createSetup=()=>({open(){}});\n'+fs.readFileSync('aircraft-catalog.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('failures.js','utf8').replace(/export /g,'')+'\nconst bindJoystick=()=>({reset(){stick={x:0,y:0}}});const createGraphics=()=>({resetCamera(){},draw(){}});\n'+fs.readFileSync('game.js','utf8').replace(/import .*?;\n/g,'');const els={};function el(){return {textContent:'',classList:{add(){},remove(){},contains(){return true}},focus(){},setAttribute(){},addEventListener(){},getContext(){return {}},dataset:{}}}const context={console,Math,innerWidth:1280,innerHeight:720,devicePixelRatio:1,document:{getElementById:id=>els[id]??=el(),querySelectorAll:()=>[],addEventListener(){}},addEventListener(){},requestAnimationFrame(){}};vm.createContext(context);vm.runInContext(script,context);function run(s){return vm.runInContext(s,context)}


for(const id of run('AIRCRAFT.map(a=>a.id)')){
 for(const hz of [30,60,120]){
 const start=()=>run(`startConfigured({mode:"departure",aircraft:"${id}",start:"runway",passengers:3,fuel:80});state="taxi";parking=false;throttle=0;yaw=0;pos=V(0,10+clearance(),500);vel=V(0,0,12);`);
 start();run(`for(let i=0;i<${hz};i++)step(1/${hz})`);const paved=run('len(vel)');
 start();run(`pos.x=-65;for(let i=0;i<${hz};i++)step(1/${hz})`);assert(run('len(vel)')<paved,id+' grass resistance');assert.equal(run('state'),'taxi');assert.equal(run('cabinTotals(cabin).fatalities'),0);
 for(const direction of [-1,1]){start();run(`pos.x=${direction<0?-25:-45};yaw=${direction*Math.PI/2};vel=V(${direction*12},0,0);for(let i=0;i<${hz*3};i++)step(1/${hz})`);assert.equal(run('state'),'taxi',id+' edge crossing');assert.equal(run('cabinTotals(cabin).fatalities'),0);assert(run('Number.isFinite(pos.y)&&Math.abs(pos.y-ground(pos.x,pos.z)-clearance())<.001'));}
 start();run('pos.x=-34');assert(run('groundSurface().grass>0&&groundSurface().grass<1'),id+' mixed gear surfaces');
 start();run('pos.x=-65;parking=true;vel=V();throttle=1;step(1)');assert.equal(run('len(vel)'),0,'parking brake holds on grass');
 }
 console.log('PASS',id,'grass drag, both runway-edge directions, mixed surfaces and brake at 30/60/120 Hz');
}
run('const steep=(()=>{for(let x=-2000;x<2000;x+=20)for(let z=-2000;z<3000;z+=80)if(terrainUnsafe(x,z))return {x,z}})();pos=V(steep.x,ground(steep.x,steep.z)+clearance(),steep.z);state="pushback";pushRemaining=50;parking=false;vel=V(0,0,10);contactTerrain()');
assert.equal(run('state'),'taxi');assert(run('parking'));assert.equal(run('pushRemaining'),0);const before=run('JSON.stringify(pos)');run('step(1)');assert.equal(run('JSON.stringify(pos)'),before,'blocked pushback stays stopped');
console.log('PASS steep-ground pushback cancels and stays stopped');
