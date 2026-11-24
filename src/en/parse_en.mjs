// Englische Rätsel: en/raetsel/r_*.txt -> en/raetsel.mjs  [Karte, Stufe, Rätsel, Lösung, Ort, lat, lon, Erklärung, km]
import fs from 'fs';
import {createRequire} from 'module';
const require = createRequire(import.meta.url);
const cities = require('all-the-cities');
const D = new URL('.', import.meta.url).pathname;
const find = (n, cc) => cities.filter(x => x.country === cc && (x.name === n || (x.altName || '').split(',').includes(n))).sort((a, b) => b.population - a.population)[0];
const norm = s => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
const all = [], errs = [], seen = new Set();
for (const f of fs.readdirSync(D + 'raetsel').filter(f => f.endsWith('.txt')).sort()) {
  for (const [i, line] of fs.readFileSync(D + 'raetsel/' + f, 'utf8').split('\n').entries()) {
    if (!line.trim() || line.startsWith('#')) continue;
    let [map, lvl, t, s, o, co, a = '', km = ''] = line.split(';').map(x => x.trim());
    if (!['us', 'eu', 'world'].includes(map) || !'LMS'.includes(lvl) || lvl.length !== 1) { errs.push(f + ':' + (i + 1)); continue; }
    let lat, lon;
    if (co.startsWith('=')) { const [n, cc] = co.slice(1).split('/'); const c = find(n, cc); if (!c) { errs.push('nicht gefunden ' + co); continue; } [lon, lat] = c.loc.coordinates; }
    else [lat, lon] = co.split(',').map(Number);
    if (!a) a = s.includes('+') ? `${s} makes ${o}.` : norm(s) === norm(o) ? (s[0] === s[0].toLowerCase() ? `“${s}” has the same name as ${o}.` : `The answer was ${o}.`) : `“${s}” contains ${o}.`;
    if (seen.has(norm(t))) continue; seen.add(norm(t));
    const e = [map, lvl, t, s, o, +(+lat).toFixed(4), +(+lon).toFixed(4), a]; if (km) e.push(+km);
    all.push(e);
  }
}
fs.writeFileSync(D + 'raetsel.mjs', '// [Karte, Stufe, Rätsel, Lösung, Ort, lat, lon, Erklärung, km]\nexport const R = [\n' + all.map(r => JSON.stringify(r)).join(',\n') + '\n];\n');
console.log('gesamt', all.length, 'FEHLER', errs.join(' | '));
