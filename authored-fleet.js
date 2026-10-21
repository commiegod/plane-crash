import {createAssetAircraft} from './asset-aircraft.js?v=buildings-20261021';
export const AUTHORED_AIRCRAFT={
 b727:{id:'b727',folder:'b727',file:'b727',clearance:3.8,eye:[.475,1.02,20.44],cuts:{tail:-13,width:2.1}},
 twin:{id:'twin',folder:'seneca',file:'seneca',clearance:1.5,eye:[.358,1.75,.3],cuts:{tail:-2.6,width:.75}},
 c130:{id:'c130',folder:'c130',file:'c130',clearance:4.2,eye:[.607,-2.06119,11.95587],cuts:{tail:-8,width:2.4}},
 g650:{id:'g650',folder:'citationx',file:'citationx',clearance:2.4,eye:[.375,.41,7],cuts:{tail:-6,width:1.3}},
 dc9:{id:'dc9',folder:'dc9',file:'dc9',clearance:3.7,eye:[.5,1.5,-3.1],cuts:{tail:-9,width:1.8}},
 dc3:{id:'dc3',folder:'dc3',file:'dc3',clearance:2.6,eye:[.475,.434,7.965],cuts:{tail:-6,width:1.65}},
 b747:{id:'b747',folder:'b747',file:'b747',clearance:4.4,eye:[.55,3.8,24.05],cuts:{tail:-21,width:3.4}},
 dc10:{id:'dc10',folder:'dc10',file:'dc10',clearance:4.4,eye:[.52398,1.32,24.37],cuts:{tail:-15,width:3}},
 c172:{id:'c172',folder:'c172p',file:'c172p',clearance:1.5,eye:[.21,.273,-.36]},
 b737:{id:'b737',folder:'b737',file:'b737',clearance:4,eye:[.51,1.28,17.18],cuts:{tail:-9,width:2.0}},
 a320:{id:'a320',folder:'a320',file:'a320',clearance:4.2,eye:[.53,1.3,16.25],cuts:{tail:-9,width:2.15}}
};
export function createAuthoredFleet(scene){const models=new Map();let active=null;function load(id='c172'){const config=AUTHORED_AIRCRAFT[id];if(!config)return Promise.resolve();if(!models.has(id))models.set(id,createAssetAircraft(scene,config));return models.get(id).load();}return{load,update(s,inside,dt){active=models.get(s.aircraft);let detailed=false;for(const model of models.values())detailed=model.update(s,inside,dt)||detailed;return detailed;},eye(){return active.eye();}}}
