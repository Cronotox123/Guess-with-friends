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
function entry(line, where){
  const p = line.split(';');
  if(/\bNein\b|gestrichen/.test(line)) return {err:where+' Entwurf '+line};
  if(p.length<6) return {err:where+' Felder '+line};
  let [map,lvl,t,s,o,co,a='',km=''] = p.map(x=>x.trim());
  if(!['de','eu','world'].includes(map)||!'LMS'.includes(lvl)||lvl.length!==1) return {err:where+' map/lvl '+line};
  let lat,lon;
  if(co.startsWith('=')){ const [n,cc]=co.slice(1).split('/'); const c=find(n,cc); if(!c) return {err:where+' nicht gefunden '+co}; [lon,lat]=c.loc.coordinates; }
  else { [lat,lon]=co.split(',').map(Number); if(isNaN(lat)||isNaN(lon)) return {err:where+' coord '+line}; }
  if(!a){ const base=o.replace(/\s*\(.*\)$/,''); a = s.includes('+') ? `${s} ergibt ${base}.` : `In „${s}“ steckt ${base}.`; if(norm(s)===norm(base)) a=`Gesucht war ${base}.`; }
  const e=[map,lvl,t,s,o,+(+lat).toFixed(4),+(+lon).toFixed(4),a]; if(km) e.push(+km);
  return {e};
}
for (const f of process.argv.slice(2)){
  for (const [i,line] of fs.readFileSync(f,'utf8').split('\n').entries()){
    if(!line.trim()||line.startsWith('#')) continue;
    const r=entry(line, f+':'+(i+1)); if(r.err){errs.push(r.err);continue;}
    const [map,,t,s]=r.e;
    if(seenT.has(norm(t))||seenS.has(map+'|'+s.toLowerCase())){ dups.push(s); continue; }
    seenT.add(norm(t)); seenS.add(map+'|'+s.toLowerCase());
    all.push(r.e);
  }
}
// Ersatz für als „dumm“ bewertete Rätsel: Zeile = Nr;<Rätselzeile>, Nummer bleibt gleich
const rd=f=>fs.existsSync(f)?fs.readFileSync(f,'utf8').split('\n').filter(l=>l.trim()&&!l.startsWith('#')):[];
const ersetzt=new Set();
for(const l of rd('raetsel/ersatz.txt')){ const k=l.indexOf(';'); const nr=+l.slice(0,k); const r=entry(l.slice(k+1),'ersatz '+nr); if(r.err){errs.push(r.err);continue;} all[nr-1]=r.e; ersetzt.add(nr); }
// Bewertung der Prüf-KI: Nr;Stufe;Grund
const LV={leicht:'L',mittel:'M',schwer:'S'}; const offenDumm=[];
for(const l of rd('raetsel/bewertung.txt')){ const [nr,st]=l.split(';').map(x=>x.trim()); const i=+nr-1; if(!all[i])continue;
  if(LV[st]) { if(!ersetzt.has(+nr)) all[i][1]=LV[st]; } else if(st==='dumm' && !ersetzt.has(+nr)) offenDumm.push(nr); }
if(offenDumm.length) console.log('DUMM OHNE ERSATZ', offenDumm.join(','));
fs.writeFileSync('raetsel_alle.mjs','// [Karte, Stufe, Rätsel, Lösung, Ort, lat, lon, Erklärung, km]\nexport const R = [\n'+all.map(r=>JSON.stringify(r)).join(',\n')+'\n];\n');
const st={}; all.forEach(r=>{const k=r[0]+r[1];st[k]=(st[k]||0)+1});
console.log('gesamt',all.length,st);
console.log('FEHLER',errs.join('\n'));
console.log('DUPS',dups.join(' | '));
