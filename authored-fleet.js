import {createAssetAircraft} from './asset-aircraft.js?v=crash-dc10-20261005';
export const AUTHORED_AIRCRAFT={
 dc10:{id:'dc10',folder:'dc10',file:'dc10',clearance:4.4,eye:[.52398,1.32,24.37],cuts:{tail:-15,width:3}},
 c172:{id:'c172',folder:'c172p',file:'c172p',clearance:1.5,eye:[.21,.273,-.36]},
 b737:{id:'b737',folder:'b737',file:'b737',clearance:4,eye:[.51,1.28,17.18],cuts:{tail:-9,width:2.0}},
 a320:{id:'a320',folder:'a320',file:'a320',clearance:4.2,eye:[.53,1.3,16.25],cuts:{tail:-9,width:2.15}}
};
export function createAuthoredFleet(scene){const models=new Map();let active=null;function load(id='c172'){const config=AUTHORED_AIRCRAFT[id];if(!config)return Promise.resolve();if(!models.has(id))models.set(id,createAssetAircraft(scene,config));return models.get(id).load();}return{load,update(s,inside,dt){active=models.get(s.aircraft);let detailed=false;for(const model of models.values())detailed=model.update(s,inside,dt)||detailed;return detailed;},eye(){return active.eye();}}}
