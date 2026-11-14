import sys,json,os,trimesh,numpy as np
inv=json.load(open(sys.argv[1])); d=sys.argv[2]; out=sys.argv[3]
lo=(-340,-270,600); hi=(-140,-20,1060)
skip=('artery','vein','nerve','venous','arterial','lymph','skin','branch','arch','plexus','trunk','arteria')
bones=('phalanx','metacarpal','capitate','hamate','lunate','pisiform','scaphoid','trapezi','triquetral','radius','ulna','humerus')
sc=trimesh.Scene(); meta=[]
for r in inv:
    b=r['bounds']; c=[(b[i]+b[i+3])/2 for i in range(3)]
    n=r['name'].lower()
    if not all(lo[i]<=c[i]<=hi[i] for i in range(3)) or any(s in n for s in skip): continue
    m=trimesh.load(os.path.join(d,r['file']),process=False,force='mesh')
    kind='bone' if any(k in n for k in bones) and 'flexor' not in n and 'extensor' not in n and 'membrane' not in n else ('fascia' if 'retinac' in n or 'membrane' in n else 'muscle')
    key=r['file'][:-4]
    sc.add_geometry(m,geom_name=key,node_name=key)
    meta.append(dict(id=key,name=r['name'],kind=kind,f=r['f'],bounds=b))
sc.export(out)
json.dump(meta,open(out+'.json','w'))
print(len(meta),'meshes')
for m in meta:
    if 'digitorum' in m['name'].lower(): print(m['name'],m['bounds'])
