import os,shutil
base='/tmp/claude-0/-home-user/7b7f3a4f-73f0-5901-a053-4c9704cb0559/scratchpad'
t=open('template.html').read().replace('__PARTY__',open('party.js').read())
page=t.replace('const DATA = __DATA__;','const DATA = '+open('data.json').read()+';')
open(base+'/punktlandung.html','w').write(page)
head='<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
i=page.index('<div id="app">')
full=head+page[:i]+'</head>\n<body>\n'+page[i:]+'\n</body>\n</html>\n'
open(base+'/punktlandung-offline.html','w').write(full)
site=base+'/site'; os.makedirs(site+'/vendor',exist_ok=True)
libs='<script src="vendor/peerjs.min.js"></script>\n<script src="vendor/qrcode.js"></script>\n'
j=full.index('<script>\nconst DATA')
open(site+'/index.html','w').write(full[:j]+libs+full[j:])
shutil.copy('node_modules/peerjs/dist/peerjs.min.js',site+'/vendor/')
shutil.copy('node_modules/qrcode-generator/qrcode.js',site+'/vendor/')
shutil.copy('node_modules/mqtt/dist/mqtt.min.js',site+'/vendor/')
open(site+'/.nojekyll','w').write('')
print('ok', len(page), len(full))
