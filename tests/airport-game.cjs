// Exercise the real game state machine with the experimental physics adapter.
process.chdir(require('path').join(__dirname,'..'));
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('tests/contact-safety.cjs','utf8');
const harness=source.slice(source.indexOf("const fs=require"),source.indexOf('\n\n\nfor(const hz')).replace('const fs=require(\'fs\'),vm=require(\'vm\'),assert=require(\'assert\');','').replace('draw(){}','draw(){},setStructure(){}').replace('contains(){return true}','contains(){return true},toggle(){}');
eval(harness+`\n(async()=>{
 const module=await import('../airport-structure.js');
 const {definitions:defs}=await import('../tests/structure-fixture.mjs');
 context.physicsModule=module;context.modelFixture={definitions:defs,groups:Object.fromEntries(Object.keys(defs).map(id=>[id,{position:{copy(){}},quaternion:{copy(){}},children:[]}]))};
 run("structuralEnabled=true;structuralModule=physicsModule;structuralModel=modelFixture;startConfigured({aircraft:'c172',mode:'departure',start:'runway',runway:'01',passengers:3,fuel:100});for(let i=0;i<180;i++)step(1/60)");
 assert.equal(run('structuralIncident'),false);assert.equal(run('cabinTotals(cabin).fatalities'),0);
 run("state='parked';startPushback();for(let i=0;i<120;i++)step(1/60)");assert(run('vel.z<-.1'));run('stopPushback();step(1/60)');assert.equal(run('state'),'taxi');
 run('parking=false;throttle=1;for(let i=0;i<1800;i++){stick.y=i>900?.25:0;step(1/60)}');assert.equal(run('state'),'flight');assert.equal(run('structuralIncident'),false);
 run("structuralSession.sim.breakJoint(structuralSession.sim.joints.find(j=>j.id==='leftTip'));step(1/60)");assert.equal(run('structuralIncident'),true);assert.equal(run('cabinTotals(cabin).fatalities'),0,'wing separation is not cabin fatality');assert.equal(run('state'),'flight');assert.equal(run('reportShown'),false);
 run('pause()');const time=run('structuralSession.sim.time');run('step(1)');assert.equal(run('structuralSession.sim.time'),time);run('pause();showReport(false)');assert.equal(run('reportShown'),true);
 run('startConfigured(currentConfig);step(1/60)');assert.equal(run('structuralIncident'),false);assert.equal(run('structuralSession.sim.events.length'),0);
 run("startConfigured({...currentConfig,aircraft:'b737'});step(1/60)");assert.equal(run('structuralSession'),null);
 console.log('PASS main-game experimental pushback/stop, takeoff, wing loss, optional report, pause, restart, other aircraft isolation');
})().catch(error=>{console.error(error);process.exitCode=1});`);
