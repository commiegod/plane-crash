# Extract only the existing, attributed aircraft animations; preserve per-aircraft licenses.
from pathlib import Path
import zipfile,xml.etree.ElementTree as E,json
root=Path(__file__).resolve().parent.parent
for id,files in {'c130':['Models/main.xml'],'citationx':['Models/Citation-X.xml','Models/pedestal.xml'],'dc3':['Models/main.xml'],'dc9':['Models/DC-9-32.xml','Models/Flightdeck/Instruments/Flaps/flaps.xml','Models/Flightdeck/Flightdeck.xml']}.items():
 z=zipfile.ZipFile(root/'assets'/id/'source.zip');anims=[]
 for path in files:
  frame=Path(path).stem;r=E.fromstring(z.read(path))
  for a in r.findall('animation'):
   names=[n.text for n in a.findall('object-name')];kind=a.findtext('type');prop=a.findtext('property','')
   if kind not in ['rotate','translate'] or not ('flap-pos' in prop or prop=='controls/flight/flaps'):continue
   def vec(tag,suf=''):
    el=a.find(tag);v=[float(el.findtext(k+suf,'0')) if el is not None else 0 for k in ['x','y','z']];return [v[0],v[2],-v[1]]
   axis=vec('axis');center=vec('center','-m')
   if a.find('axis/x1-m') is not None:
    center=vec('axis','1-m');end=vec('axis','2-m');axis=[v-center[i] for i,v in enumerate(end)]
   table=[[float(e.findtext('ind')),float(e.findtext('dep'))] for e in a.findall('interpolation/entry')]
   anims.append(dict(names=[frame+'/'+n for n in names],kind=kind,property='game/flaps',factor=float(a.findtext('factor','1')),offset=0,axis=axis,center=center,table=table,sourceFrame=frame))
 (root/'assets'/id/'flap-controls.json').write_text(json.dumps(anims,separators=(',',':'))+'\n');print(id,len(anims))
