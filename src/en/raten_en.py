"""Englische Ratefragen -> en/raten.json (gleiches Format wie raten.json)."""
import re,json,os
D=os.path.dirname(os.path.abspath(__file__))+'/raten/'
PAIRS=[('more','fewer'),('more','less'),('higher','lower'),('taller','shorter'),('bigger','smaller')]
def num(a):
    m=re.search(r'\$?(\d[\d,]*(?:\.\d+)?)\s*(million|sq mi|ft|lb|calories)?',a)
    v=float(m.group(1).replace(',','')); u=m.group(2) or ''
    if '$' in a[:m.end()]: u=('million ' if u=='million' else '')+'$'
    return v,u
out=[];bad=[]
def add(m,n,st,q,a,src):
    e={'m':m,'n':n,'s':st,'q':q,'a':a,'src':src}
    if m=='gk':
        w=re.match(r'\s*(\w+)',a).group(1).lower(); ql=q.lower()
        pr=[x for x in PAIRS if w in x and f'{x[0]} or {x[1]}' in ql]
        if not pr: bad.append(q); return
        e['o']=[x.capitalize() for x in pr[0]]; e['c']=pr[0].index(w)
    else:
        e['v'],e['u']=num(a)
    out.append(e)
rows=lambda f:[l.rstrip('\n').split(';') for l in open(D+f,encoding='utf8') if l.strip() and not l.startswith('#')]
for m,f in [('schaetzen','raten_schaetzen_us.txt'),('gk','raten_groesser_kleiner_us.txt'),('preise','raten_preise_us.txt')]:
    for p in rows(f): add(m,int(p[0]),p[1],p[2],p[3],';'.join(p[4:]))
for p in rows('kalorien.txt'): add('kalorien',1000+int(p[0][1:]),p[1],p[7],p[8],p[4])
MM={'GK':'gk','SZ':'schaetzen','PR':'preise'}
for p in rows('raten_international.txt'): add(MM[p[0][:2]],2000+int(p[0][2:]),p[2],p[5],p[6],p[7])
json.dump(out,open(os.path.dirname(D[:-1])+'/raten.json','w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
from collections import Counter
print(len(out),Counter(e['m'] for e in out)); [print('BAD',b) for b in bad]
print(sorted(set(e.get('u') for e in out if 'u' in e)))
