process.chdir(require('path').join(__dirname,'..'));
const fs=require('fs'),vm=require('vm'),assert=require('assert');const script=fs.readFileSync('light-aircraft.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('stall-model.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('crash-model.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('aircraft-meshes.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('flight-config.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('cabin.js','utf8').replace(/export /g,'')+'\nconst createSetup=()=>({open(){}});\n'+fs.readFileSync('aircraft-catalog.js','utf8').replace(/export /g,'')+'\n'+fs.readFileSync('failures.js','utf8').replace(/export /g,'')+'\nconst bindJoystick=()=>({reset(){stick={x:0,y:0}}});const createGraphics=()=>({resetCamera(){},draw(){}});\n'+fs.readFileSync('game.js','utf8').replace(/import .*?;\n/g,'');const els={};function el(){return {textContent:'',classList:{add(){},remove(){},contains(){return true}},focus(){},setAttribute(){},addEventListener(){},getContext(){return {}},dataset:{}}}const context={console,Math,innerWidth:1280,innerHeight:720,devicePixelRatio:1,document:{getElementById:id=>els[id]??=el(),querySelectorAll:()=>[],addEventListener(){}},addEventListener(){},requestAnimationFrame(){}};vm.createContext(context);vm.runInContext(script,context);function run(s){return vm.runInContext(s,context)}
for(const id of ['c172','twin']){
 const start='startConfigured({mode:"departure",aircraft:'+JSON.stringify(id)+',livery:"klm",start:"runway",runway:"01",passengers:1,fuel:80});';
 run(start+'cycleFlaps();step(1);');assert.equal(run('flapSetting'),1);assert(run('flaps>0&&flaps<=LIGHT_HANDLING[aircraft].takeoffFlaps'));
 run('pause();cycleFlaps();step(2)');assert.equal(run('flapSetting'),1);assert.equal(run('flaps'),.25);run('pause();step(1)');assert.equal(run('flaps'),run('LIGHT_HANDLING[aircraft].takeoffFlaps'));
 run('cycleFlaps();for(let i=0;i<240;i++)step(1/60)');assert.equal(run('flaps'),1);assert(run('aero().liftScale<1'));assert(run('aero().drag>lightAero(aircraft,0,gear).drag'));
 run('cycleFlaps();for(let i=0;i<240;i++)step(1/60)');assert(run('flaps<.0001'));
 run('state="flight";pos.y=400;vel=V(0,0,80);cycleFlaps()');assert.equal(run('flapSetting'),0);assert(run('flapNotice>0'));
 run(start+'parking=false;vel=V(0,0,8);stick.x=1;step(.1)');const slowTurn=run('yaw');assert(slowTurn>0);
 run(start+'parking=false;vel=V(0,0,38);stick.x=1;step(.1)');assert(run('yaw')<slowTurn);assert(run('yaw')>0);
 run(start+'stick.x=1;step(.1)');assert.equal(run('yaw'),0);
 for(const hz of [30,60,120]){
 run('begin("approach");assist=false;pos=V(0,10+clearance(),200);vel=V(0,-2,approachTarget());pitch=.07;roll=0;touchdown()');assert.equal(run('state'),'landed');assert(run('pitch>0&&gearCompression>0'));assert(!run('reportShown'));
 run('for(let i=0;i<'+hz*2+';i++)step(1/'+hz+')');assert(run('gearCompression<.001'));assert(run('pitch<.005'));
 run('setThrottle(100);keys.down=true;for(let i=0;i<'+hz*100+'&&state!=="flight"&&state!=="crashed";i++)step(1/'+hz+');clearKeys()');assert.equal(run('state'),'flight',id+' flap landing then takeoff '+hz);
 }
 run('begin("approach");assist=false;pos=V(0,10+clearance(),200);vel=V(0,-7,approachTarget());pitch=.05;touchdown()');assert.equal(run('state'),'crashed');assert(run('crashProfile.gearCollapsed'));assert(!run('reportShown'));
 run('begin("free");vel=V(0,0,45);stick.x=1;step(1/60)');assert(Math.abs(run('roll'))<run('spec().rollRate/60'));
 run('pause()');assert.equal(run('controlRoll'),0);
 run('begin("approach");assist=false;pos=V(0,250,200);vel=V(0,0,approachTarget());pitch=.10;throttle=1;for(let i=0;i<600&&state==="flight";i++)step(1/60)');assert.equal(run('state'),'flight');assert(run('pos.y>250'),id+' full-flap go-around');
 console.log('PASS',id,'gradual flaps, pause, overspeed interlock, tire grip, stationary steering, touchdown compression, hard landing and repeat takeoff at 30/60/120 Hz');
}
