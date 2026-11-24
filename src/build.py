"""Baut index.html aus template.html + party.js + Daten.
Kartendaten: src/data.json, falls vorhanden, sonst aus dem bestehenden index.html übernommen.
Ratefragen: src/raten.json (erzeugt mit raten.py aus den fragen-*.txt)."""
import os
S=os.path.dirname(os.path.abspath(__file__)); R=os.path.dirname(S)
rd=lambda p: open(p,encoding='utf-8').read()
if os.path.exists(S+'/data.json'): data=rd(S+'/data.json')
else:
    old=rd(R+'/index.html'); i=old.index('const DATA = ')+len('const DATA = '); data=old[i:old.index(';\nconst ',i)]
t=rd(S+'/template.html').replace('__PARTY__',rd(S+'/party.js'))
page=t.replace('const DATA = __DATA__;','const DATA = '+data+';').replace('const RATEN = __RATEN__;','const RATEN = '+rd(S+'/raten.json')+';')
head='<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
i=page.index('<div id="app">'); full=head+page[:i]+'</head>\n<body>\n'+page[i:]+'\n</body>\n</html>\n'
libs='<script src="vendor/peerjs.min.js"></script>\n<script src="vendor/qrcode.js"></script>\n'
j=full.index('<script>\nconst DATA')
open(R+'/index.html','w',encoding='utf-8').write(full[:j]+libs+full[j:])
print('index.html gebaut')
