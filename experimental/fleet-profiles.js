import {AUTHORED_AIRCRAFT} from '../authored-fleet.js';
import {getAircraft} from '../aircraft-catalog.js';
// Game-tuned operating masses, wing areas and thrust; not certification data.
// Section cuts use the same centered, forward-Z coordinates as the authored fleet.
const tuning={
 c172:[1030,16.2,3000,1.1,-1.8,2.65,3.4],
 twin:[1800,19.5,6500,.85,-2.6,2.6,3.8],
 dc3:[10500,91,34000,1.65,-6,6,9],
 a320:[60000,123,210000,2.15,-9,12,11],
 b737:[62000,125,220000,2,-9,13,11],
 b727:[70000,158,270000,2.1,-13,15,10],
 dc9:[39000,93,130000,1.8,-9,11,9],
 g650:[13000,49,58000,1.3,-6,7,6],
 c130:[52000,162,170000,2.4,-8,9,13],
 dc10:[180000,339,600000,3,-15,18,18],
 b747:[280000,541,900000,3.4,-21,23,21]
};
const gears={
 c172:/^(Left|Right|Nose)Wheel/,
 twin:/^SenecaII\/(GearLeft|GearRight|NLG|RightMainGearCover|LeftMainGearCover)/,
 dc3:/^wheels\//,
 a320:/^fuselage\/(MLG|NLG|SideStay|GearLDoor)/,
 b737:/^NoseGear\/|^(L|R)Wing\/(mg|.*strut|.*mgd|.*gd|geardoor)/,
 b727:/^727-230\/(tyre|Cube$|n(lower|outer)strut|[lr]hsteercyl|nlink|noseaxle|[lr]mg|[lr]g.*strut)/i,
 dc9:/^DC-9-32\/LG[NLR]/,
 g650:/^Citation-X\/(Nosewheel|FrtStrut|frtshock|F[UL]damper|[LR]H(wheel|shock|Tarm)|[LR]Geardoor|[LR][HR]frt.geardoor)/,
 c130:/^main\/(roue|temp[ADGH]|temp[GH]?[GD]|rotationH|articule|porteroue)/,
 b747:/^747-400\/(blg|wlg|nlg|GearNose|Mesh[68]$)/i,
 dc10:/^DC-10-30\/(Gear|[NMLRC]LG|Wheel|tyres|central\.|front\.strut|left\.(arm|main|scissor|strut)|right\.(arm|main|scissor|strut)|nose\.)/i
};
export function fleetProfile(id='c172'){
 const asset=AUTHORED_AIRCRAFT[id],data=tuning[id];if(!asset||!data)throw Error('No structural profile: '+id);
 const [mass,area,thrust,width,tail,nose,tip]=data,spec=getAircraft(id),scale=Math.sqrt(area/16.2),massScale=mass/1030;
 const engines=spec.engines.map(e=>({...e,part:id==='c172'?'nose':e.position.z<tail?'tail':e.position.x<-width?'leftInner':e.position.x>width?'rightInner':'cabin'}));
 return {...asset,mass,area,thrust,width,tail,nose,tip,scale,massScale,gearPattern:gears[id],engines,
  rotationSpeed:id==='c172'?31:Math.sqrt(2*mass*9.81/(1.225*area*1.1)),
  regions:{tail:[[2,tail,-1]],nose:[[2,nose,1],[0,-width,1],[0,width,-1]],cabin:[[2,tail,1],[2,nose,-1],[0,-width,1],[0,width,-1]],leftInner:[[2,tail,1],[0,-width,-1],[0,-tip,1]],leftTip:[[2,tail,1],[0,-tip,-1]],rightInner:[[2,tail,1],[0,width,1],[0,tip,-1]],rightTip:[[2,tail,1],[0,tip,1]]}};
}
export const FLEET_IDS=Object.keys(tuning);
