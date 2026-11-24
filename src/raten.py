import re,json,sys
import os
D=os.environ.get('RATEN_DIR','/mnt/project-files/punktlandung/neue-modi/')  # Ordner mit fragen-*.txt
MODES=[('gk','groesser-kleiner'),('schaetzen','schaetzen'),('kalorien','kalorien'),('preise','preise')]
PAIRS=[('mehr','weniger'),('größer','kleiner'),('höher','niedriger'),('länger','kürzer'),('teurer','billiger'),('älter','jünger'),('früher','später'),('schwerer','leichter'),('tiefer','flacher')]
NUM=re.compile(r'(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?')
def parse(a):
    s=a
    m=NUM.search(s)
    if not m: return None,None
    v=float(m.group(1).replace('.','')+('.'+m.group(2) if m.group(2) else ''))
    rest=s[m.end():]
    rest=re.split(r'[(≈]',rest)[0].strip().rstrip(',').strip()
    return v,rest
out=[];bad=[]
for m,f in MODES:
    for line in open(D+'fragen-'+f+'.txt',encoding='utf-8'):
        line=line.rstrip('\n')
        if not line or line.startswith('#') or line.startswith('Nr;'): continue
        p=line.split(';')
        nr,st,q,a,src=p[0],p[1],p[2],p[3],';'.join(p[4:])
        e={'m':m,'n':int(nr),'s':st,'q':q,'a':a,'src':src}
        if m=='gk':
            w=re.match(r'\s*(\w+)',a).group(1).lower()
            pr=[x for x in PAIRS if w in x and (x[0]+' oder '+x[1]) in q.lower()]
            if not pr: bad.append(('gk',line)); continue
            e['o']=[x.capitalize() for x in pr[0]]; e['c']=pr[0].index(w)
        else:
            v,u=parse(a.split('≈')[1]) if '≈' in a and 'kg' in q else parse(a)
            if u=='Millionen': u='Mio.'
            if v is None: bad.append((m,line)); continue
            e['v']=v; e['u']=u
        out.append(e)
json.dump(out,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'raten.json'),'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print(len(out),'ok'); [print('BAD',b) for b in bad]
