process.chdir(require('path').join(__dirname,'..'));
const fs=require('fs'),vm=require('vm'),assert=require('assert');const script=fs.readFileSync('light-aircraft.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('stall-model.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('crash-model.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('aircraft-meshes.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('flight-config.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('cabin.js','utf8').replace(/export /g,'')+'\nconst createSetup=()=>({open(){}});\n'+fs.readFileSync('aircraft-catalog.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('failures.js','utf8').replace(/export /g,'')+'\nconst bindJoystick=()=>({reset(){stick={x:0,y:0}}});const createGraphics=()=>({resetCamera(){},draw(){}});\n'+fs.readFileSync('game.js','utf8').replace(/import .*?;\n/g,'');const els={};function el(){return {textContent:'',classList:{add(){},remove(){},contains(){return true}},focus(){},setAttribute(){},addEventListener(){},getContext(){return {}},dataset:{}}}const context={console,Math,innerWidth:1280,innerHeight:720,devicePixelRatio:1,document:{getElementById:id=>els[id]??=el(),querySelectorAll:()=>[],addEventListener(){}},addEventListener(){},requestAnimationFrame(){}};vm.createContext(context);vm.runInContext(script,context);function run(s){return vm.runInContext(s,context)}

const modes=[];
for(const sink of [-2,-18,-32])modes.push(run(`assessImpact({speed:70,sink:${sink},gear:false,fuel:70}).mode`));
assert.deepEqual(modes,['intact','sections','fragmented']);
for(const mode of ['intact','sections','fragmented']){
 const results=[];
 for(const hz of [30,60,120]){
  let speed=70,distance=0,time=0;
  while(speed>.01&&time<30){const m=run(`wreckGroundMotion(${speed},${1/hz},"${mode}",true)`);speed=m.speed;distance+=m.distance;time+=1/hz;}
  assert(time<7,mode+' stops promptly');results.push(distance);
 }
 assert(Math.max(...results)-Math.min(...results)<.001,'frame independent stopping distance');
 assert(run(`wreckGroundMotion(70,1,"${mode}",false).distance`)<run(`wreckGroundMotion(70,1,"${mode}",true).distance`),'grass slows more than pavement');
}
for(const id of ['c172','dc10','b747']){
 run(`startConfigured({mode:"departure",aircraft:"${id}",start:"runway",runway:"01",passengers:20,fuel:70});pos=V(0,80,300);vel=V(0,0,70);crash(false,"BUILDING COLLISION")`);
 assert(run('crashGroups.every(g=>!g.hitGround)'),'elevated impact must fall');
 const height=run('crashGroups[0].pos.y');run('step(.1)');assert(run('crashGroups[0].pos.y')<height);
 assert(!run('reportShown'),'report remains optional');
 run('for(let i=0;i<1800;i++)step(1/60)');assert(run('crashGroups.every(g=>g.rest)'),'wreckage settles');
 assert(run('cabinTotals(cabin).fatalities+cabinTotals(cabin).survivors===cabin.total'),'occupant totals preserved');
 run('pause()');const held=run('JSON.stringify(crashGroups)');run('step(1)');assert.equal(run('JSON.stringify(crashGroups)'),held);
}
console.log('PASS impact tiers, surface drag, frame-independent settling, elevated collisions, optional report, occupant totals and pause');
