import {createAssetWreck} from '../asset-wreck.js';
import assert from 'node:assert/strict';
import * as T from '../assets/three.module.js';
import {createWingBreakup} from '../wing-breakup.js';
import {deformCessnaVertex} from '../c172-damage.js';
const scene=new T.Scene(),root=new T.Group(),model=new T.Group(),source=new T.BoxGeometry(11,.2,1.4),paint=new T.MeshStandardMaterial(),mesh=new T.Mesh(source,paint);scene.add(root);root.add(model);model.add(mesh);const before=source.attributes.position.array.slice(),breakup=createWingBreakup(scene);
const event=(side,cut)=>({side,cut,center:{x:side*4,y:0,z:0},pos:{x:10,y:5,z:0},p:0,r:0,y:0});
let s={aircraft:'c172',wingDamage:{right:.28},wingDebris:[event(1,3.96)]};breakup.update(model,root,s);
assert.notEqual(mesh.geometry,source);assert.equal(mesh.material,paint);assert(model.children.some(o=>o.userData.damageStructure),'exposed structure');
model.traverse(o=>{if(o.isMesh){assert(o.geometry.attributes.position.array.every(Number.isFinite));assert(o.geometry.attributes.normal.array.every(Number.isFinite));}});
s.wingDebris.push(event(1,2.2));breakup.update(model,root,s);assert.equal(model.children.filter(o=>o.userData.damageStructure).length,1,'old fracture structure removed');
s.wingDebris.push(event(-1,3.96));breakup.update(model,root,s);assert.equal(model.children.filter(o=>o.userData.damageStructure).length,2);
const wreck=createAssetWreck(scene);wreck.update(model,root,[{group:0,part:{center:{x:0,y:0,z:0}},pos:{x:0,y:0,z:0},p:0,r:0,y:0}],{aircraft:'c172',severity:.1});const bounds=new T.Box3().setFromObject(wreck.root);assert(bounds.max.x<2.4,'full crash must not restore missing wing');wreck.hide();scene.remove(wreck.root);
breakup.update(model,root,{aircraft:'c172',wingDamage:{},wingDebris:[]});assert.equal(mesh.geometry,source);assert.deepEqual(source.attributes.position.array,before);assert.equal(model.children.length,1);assert.equal(scene.children.length,1);
for(const name of ['LeftWheel','RightWheel','NoseWheelStrut']){const v=deformCessnaVertex(.5,-1.4,1,name,{gearCollapsed:true});assert(v.every(Number.isFinite));assert(v[1]>-1.4);assert.notDeepEqual(v,[.5,-1.4,1]);assert.deepEqual(deformCessnaVertex(.5,-1.4,1,name,{}),[.5,-1.4,1]);}
assert.deepEqual(deformCessnaVertex(1,0,0,'fuselage', {gearCollapsed:true,noseImpact:true,severity:1}),[1,0,0]);assert(deformCessnaVertex(.18,.3,2.25,'fuselage_cowling',{noseImpact:true,severity:.8})[1]<.3);
console.log('PASS C172 fracture structure, repeat/opposite breaks, finite geometry, paint preservation, source restoration, gear displacement and localized cowling dent');

assert(deformCessnaVertex(1,-1.4,0,'LeftWheel',{gearCollapsed:true})[0]>1);assert(deformCessnaVertex(-1,-1.4,0,'RightWheel',{gearCollapsed:true})[0]<-1);
