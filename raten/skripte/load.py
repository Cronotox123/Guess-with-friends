import re
import os; D=os.path.join(os.path.dirname(__file__),'..','daten')+'/'  # Rohdaten mit Quellen
def rows(f):
    out=[];src=None
    for l in open(D+f,encoding='utf-8'):
        l=l.strip()
        if not l: continue
        if l.startswith('#'):
            m=re.search(r'https?://\S+',l); 
            if m: src=m.group(0)
            continue
        out.append((l.split(';'),src))
    return out
def num(s): return float(s.replace('.','').replace(',','.')) if re.match(r'^[\d.,]+$',s) else None
def fmt(x,dec=0):
    s=f"{x:,.{dec}f}".replace(',','X').replace('.',',').replace('X','.')
    return s
