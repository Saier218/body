import sys,os,re,json
d=sys.argv[1]; out=sys.argv[2]
rows=[]
for fn in sorted(os.listdir(d)):
    if not fn.endswith('.obj'): continue
    name=None;b=None;v=0;f=0;fma=None
    with open(os.path.join(d,fn),errors='ignore') as fh:
        for line in fh:
            if line.startswith('# English name'): name=line.split(':',1)[1].strip()
            elif line.startswith('# Concept ID'): fma=line.split(':',1)[1].strip()
            elif line.startswith('# Bounds'):
                m=re.findall(r'-?\d+\.\d+',line); b=[float(x) for x in m]
            elif line.startswith('v '): v+=1
            elif line.startswith('f '): f+=1
    rows.append(dict(file=fn,name=name,fma=fma,bounds=b,v=v,f=f))
json.dump(rows,open(out,'w'))
print(len(rows), sum(r['f'] for r in rows))
