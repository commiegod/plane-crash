// Pointer capture allows steering and throttle to be held by separate fingers.
export function joystickAxes(dx,dy,radius){
 const length=Math.hypot(dx,dy),magnitude=Math.min(1,length/radius);
 const strength=Math.max(0,(magnitude-.08)/.92);
 return {x:length?dx/length*strength:0,y:length?dy/length*strength:0};
}
export function bindJoystick(element,onChange){
 let pointer=null;
 const knob=element.querySelector('.stick-knob');
 function reset(){pointer=null;knob.style.transform='translate(0px,0px)';onChange({x:0,y:0});element.classList.remove('active')}
 function move(e){if(e.pointerId!==pointer)return;e.preventDefault();const b=element.getBoundingClientRect(),r=b.width*.32;const a=joystickAxes(e.clientX-b.left-b.width/2,e.clientY-b.top-b.height/2,r);knob.style.transform=`translate(${a.x*r}px,${a.y*r}px)`;onChange(a)}
 element.addEventListener('pointerdown',e=>{if(pointer!==null)return;pointer=e.pointerId;element.setPointerCapture(pointer);element.classList.add('active');move(e)});
 element.addEventListener('pointermove',move);
 for(const event of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(event,e=>{if(e.pointerId===pointer)reset()});
 return {reset};
}
