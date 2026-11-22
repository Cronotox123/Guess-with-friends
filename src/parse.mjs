// Liest r_*.txt und erzeugt raetsel_alle.mjs (alte 180 + neue), dedupliziert
import fs from 'fs';
import {createRequire} from 'module';
import {R} from './raetsel_180.mjs';
const require = createRequire(import.meta.url);
const cities = require('all-the-cities');
function find(name, cc){
  const c = cities.filter(x=>x.country===cc && (x.name===name || (x.altName||'').split(',').includes(name))).sort((a,b)=>b.population-a.population);
  return c[0];
}
const norm = s=>s.toLowerCase().replace(/[^a-zäöüß0-9]/g,'');
const _s=new Set(); const all = R.filter(r=>{const k=r[0]+norm(r[2]); if(_s.has(k)) return false; _s.add(k); return true;}).map(r=>[...r]);
const seenT = new Set(all.map(r=>norm(r[2])));
const seenS = new Set(all.map(r=>r[0]+'|'+r[3].toLowerCase()));
const errs=[], dups=[];
for (const f of process.argv.slice(2)){
  for (const [i,line] of fs.readFileSync(f,'utf8').split('\n').entries()){
    if(!line.trim()||line.startsWith('#')) continue;
    const p = line.split(';');
    if(/\bNein\b|gestrichen/.test(line)) errs.push(f+":"+(i+1)+" Entwurf "+line);
    if(p.length<6){ errs.push(f+':'+(i+1)+' Felder '+line); continue; }
    let [map,lvl,t,s,o,co,a='',km=''] = p.map(x=>x.trim());
    if(!['de','eu','world'].includes(map)||!'LMS'.includes(lvl)||lvl.length!==1){ errs.push(f+':'+(i+1)+' map/lvl '+line); continue; }
    let lat,lon;
    if(co.startsWith('=')){ const [n,cc]=co.slice(1).split('/'); const c=find(n,cc); if(!c){errs.push(f+':'+(i+1)+' nicht gefunden '+co); continue;} [lon,lat]=c.loc.coordinates; }
    else { [lat,lon]=co.split(',').map(Number); if(isNaN(lat)||isNaN(lon)){errs.push(f+':'+(i+1)+' coord '+line);continue;} }
    if(seenT.has(norm(t))||seenS.has(map+'|'+s.toLowerCase())){ dups.push(s); continue; }
    seenT.add(norm(t)); seenS.add(map+'|'+s.toLowerCase());
    if(!a){ const base=o.replace(/\s*\(.*\)$/,''); a = s.includes('+') ? `${s} ergibt ${base}.` : `In „${s}“ steckt ${base}.`; if(norm(s)===norm(base)) a=`Gesucht war ${base}.`; }
    const e=[map,lvl,t,s,o,+(+lat).toFixed(4),+(+lon).toFixed(4),a]; if(km) e.push(+km);
    all.push(e);
  }
}
fs.writeFileSync('raetsel_alle.mjs','// [Karte, Stufe, Rätsel, Lösung, Ort, lat, lon, Erklärung, km]\nexport const R = [\n'+all.map(r=>JSON.stringify(r)).join(',\n')+'\n];\n');
const st={}; all.forEach(r=>{const k=r[0]+r[1];st[k]=(st[k]||0)+1});
console.log('gesamt',all.length,st);
console.log('FEHLER',errs.join('\n'));
console.log('DUPS',dups.join(' | '));
