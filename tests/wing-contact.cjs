process.chdir(require('path').join(__dirname,'..'));
const fs=require('fs'),vm=require('vm'),assert=require('assert');const script=fs.readFileSync('light-aircraft.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('stall-model.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('crash-model.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('aircraft-meshes.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('flight-config.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('cabin.js','utf8').replace(/export /g,'')+'\nconst createSetup=()=>({open(){}});\n'+fs.readFileSync('aircraft-catalog.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('failures.js','utf8').replace(/export /g,'')+'\nconst bindJoystick=()=>({reset(){stick={x:0,y:0}}});const createGraphics=()=>({resetCamera(){},draw(){}});\n'+fs.readFileSync('game.js','utf8').replace(/import .*?;\n/g,'');const els={};function el(){return {textContent:'',classList:{add(){},remove(){},contains(){return true}},focus(){},setAttribute(){},addEventListener(){},getContext(){return {}},dataset:{}}}const context={console,Math,innerWidth:1280,innerHeight:720,devicePixelRatio:1,document:{getElementById:id=>els[id]??=el(),querySelectorAll:()=>[],addEventListener(){}},addEventListener(){},requestAnimationFrame(){}};vm.createContext(context);vm.runInContext(script,context);function run(s){return vm.runInContext(s,context)}



for(const id of ['b727','twin','dc10','b747','c172','dc3','a320','b737','dc9','g650','c130'])for(const side of [-1,1]){
 run(`startConfigured({mode:"departure",aircraft:"${id}",start:"runway",passengers:3,fuel:80});state="flight";gear=false;pitch=0;yaw=0;roll=${-side*.55};var envelope=wingEnvelope();pos=V(0,10+envelope.span/2*.88*Math.sin(.55)-envelope.wingY*Math.cos(.55),700);vel=V(0,0,70);contactWings(1/60)`);
 assert.equal(run('state'),'flight',id+' survives tip strike');
 assert(run(`wingDamage.${side<0?'left':'right'}>0`),id+' hit side');
 assert.equal(run(`wingDamage.${side<0?'right':'left'}`),0,id+' opposite intact');
 assert.equal(run('wingDebris.length'),1);
 run('pos.y+=100;var oldRoll=roll;keys.left=true;controlRoll=1;step(1/60)');assert(run('roll>oldRoll'),id+' retains input');
 run('pause()');const held=run('JSON.stringify(wingDebris)');run('step(1)');assert.equal(run('JSON.stringify(wingDebris)'),held);
 run('pause();for(let i=0;i<1200;i++)stepWingDebris(1/60)');assert(run('wingDebris.every(d=>d.rest)'),id+' fragment settles');
}
run('startConfigured({mode:"departure",aircraft:"c172",start:"runway",passengers:3,fuel:80})');assert.equal(run('wingDebris.length'),0);assert.equal(run('wingDamage.left+wingDamage.right'),0);
for(const mode of ['intact','sections','fragmented'])assert(run(`groundImpactRetention("${mode}",-2,70)>groundImpactRetention("${mode}",-60,70)`));
run('state="flight";pos=V(0,11,700);vel=V(0,-2,70);gear=false;crash(false,"GROUND IMPACT");const startZ=crashGroups[0].pos.z;for(let i=0;i<60;i++)step(1/60)');assert(run('crashGroups[0].pos.z-startZ>30'),'shallow wreck slides visibly');
console.log('PASS both wing tips across 11 aircraft, retained input, fragment settling, pause/reset, and shallow crash slide');

run('startConfigured({mode:"departure",aircraft:"b737",start:"runway",passengers:3,fuel:80});state="flight";gear=false;roll=0;pitch=0;yaw=0;vel=V(0,0,60)');
const hillside=run(`(()=>{const v=wingEnvelope();for(let x=-1800;x<1800;x+=20)for(let z=500;z<2000;z+=25){const outer=ground(x+v.span*.47,z-v.sweep*.94),inner=ground(x,z);if(outer-inner>3){pos=V(x,outer-v.wingY-.5,z);contactWings(1/60);if(wingDebris.length)return true;}}return false;})()`);assert(hillside,'level wing intersects rising hillside');
console.log('PASS hillside wing contact without relying on bank angle');
