import fs from 'node:fs';
import {GLTFLoader} from '../assets/GLTFLoader.js';
import {buildStructureModel} from '../experimental/structure-model.js';
// Load the exact aircraft geometry without browser-only texture decoding.
globalThis.ProgressEvent=class{constructor(type,props){Object.assign(this,{type},props);}};
const raw=fs.readFileSync(new URL('../assets/c172p/c172p.glb',import.meta.url)),jsonLength=raw.readUInt32LE(12),json=JSON.parse(raw.subarray(20,20+jsonLength).toString()),binStart=20+jsonLength+8;
json.buffers[0].uri='data:application/octet-stream;base64,'+raw.subarray(binStart).toString('base64');json.images=[];json.textures=[];json.materials=json.materials.map(m=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:[1,1,1,1]}}));
const gltf=await new GLTFLoader().parseAsync(JSON.stringify(json),'');const loadedModel=buildStructureModel(gltf.scene);
export const definitions=loadedModel.definitions;
