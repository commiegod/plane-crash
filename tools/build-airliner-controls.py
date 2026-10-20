from pathlib import Path
import zipfile,xml.etree.ElementTree as E,json
root=Path(__file__).resolve().parent.parent;out={}
for id,files in {'a320':['Models/Fuselage/fuselage.xml'],'b737':['Models/LWing.xml','Models/RWing.xml']}.items():
 z=zipfile.ZipFile(root/'assets'/id/'source.zip');anims=[]
 for path in files:
  frame=Path(path).stem;r=E.fromstring(z.read(path))
  for a in r.findall('animation'):
   names=[n.text for n in a.findall('object-name')];kind=a.findtext('type');prop=a.findtext('property','')
   if kind not in ['rotate','translate']:continue
   if id=='a320' and not names or id=='a320' and not all(n.startswith(('FlapL','FlapR')) for n in names):continue
   if id=='b737' and not ('flap-pos' in prop and any('flap' in n.lower() and '/' in n for n in names)):continue
   def num(s):return float(s.replace('-5.5.88','-5.88'))
   def vec(tag,suf=''):
    el=a.find(tag);v=[num(el.findtext(k+suf,'0')) if el is not None else 0 for k in ['x','y','z']];return [v[0],v[2],-v[1]]
   axis=vec('axis');center=vec('center','-m')
   if a.find('axis/x1-m') is not None:
    center=vec('axis','1-m');end=vec('axis','2-m');axis=[v-center[i] for i,v in enumerate(end)]
   table=[[num(e.findtext('ind')),num(e.findtext('dep'))] for e in a.findall('interpolation/entry')]
   anims.append(dict(names=[frame+'/'+n for n in names],kind=kind,property='game/flaps',factor=num(a.findtext('factor','1')),offset=0,axis=axis,center=center,table=table,sourceFrame=frame))
 out[id]=anims
(root/'airliner-controls.js').write_text('// GPL-2.0: flap hinges adapted from the FlightGear sources archived in assets/a320 and assets/b737.\n// Boeing source typo -5.5.88 corrected to -5.88, consistent with its adjacent animation.\nexport const AIRLINER_CONTROLS='+json.dumps(out,separators=(',',':'))+';\n')
print({k:len(v) for k,v in out.items()})
