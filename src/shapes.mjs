// Löst ziele.txt in GeoJSON-Geometrien auf -> ziele_geo.json  {"map|Ort": {cls, spec, geom}}
import fs from 'fs';
import * as d3 from 'd3-geo';
const {R} = await import(process.env.RAETSEL || './raetsel.mjs');
import * as topoS from 'topojson-server';
import * as topoC from 'topojson-client';
function dissolve(polys){ if (polys.length<2) return polys; const t = topoS.topology({x:{type:'GeometryCollection',geometries:polys.map(p=>({type:'Polygon',coordinates:p}))}}, 1e6); return topoC.merge(t, t.objects.x.geometries).coordinates; }
const NE = process.env.NE || '../ne/';
const cache = {};
const load = f => cache[f] ||= JSON.parse(fs.readFileSync(NE + f + '.geojson')).features;
const low = s => (s ?? '') + '';
const eq = (a, b) => low(a).toLowerCase() === low(b).toLowerCase();
const nameHit = (p, n) => ['name','NAME','name_en','NAME_EN','name_de','NAME_DE','ADMIN','SUBUNIT','NAME_LONG','name_alt','gn_name','woe_name'].some(k => eq(p[k], n));

const pt = {};
for (const r of R) { const k = r[0] + '|' + r[4]; pt[k] ||= [r[6], r[5]]; }

function polysOf(geom) { // -> Liste von Polygon-Koordinaten
  if (!geom) return [];
  if (geom.type === 'Polygon') return [geom.coordinates];
  if (geom.type === 'MultiPolygon') return geom.coordinates;
  return [];
}
function linesOf(geom) {
  if (geom.type === 'LineString') return [geom.coordinates];
  if (geom.type === 'MultiLineString') return geom.coordinates;
  return [];
}
const kmDist = (a, b) => d3.geoDistance(a, b) * 6371;

let landPolys;
function islands(p, radius) {
  landPolys ||= [...load('ne_10m_land'), ...load('ne_10m_minor_islands')].flatMap(f => polysOf(f.geometry));
  if (!radius) {
    let best = null, bd = 1e9;
    for (const poly of landPolys) {
      const g = {type: 'Polygon', coordinates: poly};
      if (d3.geoContains(g, p)) return [poly];
      // nächstes Polygon (Punkt evtl. knapp im Wasser)
      for (const c of poly[0]) { const d = kmDist(c, p); if (d < bd) { bd = d; best = poly; } }
    }
    return bd < 15 ? [best] : [];
  }
  return landPolys.filter(poly => d3.geoArea({type:'Polygon',coordinates:poly}) * 6371 ** 2 < 20000).filter(poly => poly[0].some(c => kmDist(c, p) <= radius) || d3.geoContains({type:'Polygon',coordinates:poly}, p));
}

function riverChain(name, p) {
  const segs = [...load('ne_10m_rivers_lake_centerlines'), ...load('ne_10m_rivers_europe')]
    .filter(f => nameHit(f.properties, name)).flatMap(f => linesOf(f.geometry));
  if (!segs.length) return [];
  const near = (s, q, km) => s.some(c => kmDist(c, q) <= km);
  // Start: Segmente nahe am Punkt; sonst das nächste
  let pick = new Set(segs.filter(s => near(s, p, 60)));
  if (!pick.size) { let b, bd = 1e9; for (const s of segs) for (const c of s) { const d = kmDist(c, p); if (d < bd) { bd = d; b = s; } } if (bd < 400) pick.add(b); }
  let grown = true;
  while (grown) {
    grown = false;
    for (const s of segs) if (!pick.has(s)) {
      const ends = [s[0], s[s.length - 1]];
      if ([...pick].some(t => ends.some(e => t.some(c => kmDist(c, e) < 3)) || [t[0], t[t.length-1]].some(e => s.some(c => kmDist(c, e) < 3)))) { pick.add(s); grown = true; }
    }
  }
  return [...pick];
}

function resolve(spec, p) {
  const polys = [], lines = [], miss = [];
  for (const part of spec.split(';')) {
    const i = part.indexOf(':');
    const kind = i < 0 ? part : part.slice(0, i), arg = i < 0 ? '' : part.slice(i + 1);
    let got = [];
    if (kind === 'c') got = load('ne_10m_admin_0_countries').filter(f => nameHit(f.properties, arg));
    else if (kind === 'su') got = load('ne_10m_admin_0_map_subunits').filter(f => eq(f.properties.SUBUNIT, arg));
    else if (kind === 'cont') got = load('ne_10m_admin_0_countries').filter(f => eq(f.properties.CONTINENT, arg));
    else if (kind === 'r') got = load('ne_10m_geography_regions_polys').filter(f => nameHit(f.properties, arg));
    else if (kind === 's') got = load('ne_10m_geography_marine_polys').filter(f => nameHit(f.properties, arg));
    else if (kind === 'l') got = [...load('ne_10m_lakes'), ...load('ne_10m_lakes_europe')].filter(f => nameHit(f.properties, arg));
    else if (kind === 'de') got = JSON.parse(fs.readFileSync('de.geojson')).features.filter(f => eq(f.properties.name, arg));
    else if (kind === 'a1' || kind === 'a1reg') {
      for (const it of arg.split(',')) {
        const [n, cc] = it.split('/');
        const g = load('ne_10m_admin_1_states_provinces').filter(f => (cc === undefined || f.properties.iso_a2 === cc) && (kind === 'a1' ? nameHit(f.properties, n) : eq(f.properties.region, n)));
        if (!g.length) miss.push(kind + ':' + it); got.push(...g);
      }
    } else if (kind === 'k') {
      const base = s => s.replace(/ Städte$/, '').replace(/ \(.*\)$/, '');
      for (const n of arg.split(',')) {
        let g = load('kreise').filter(f => f.properties.NAME_3 === n || f.properties.VARNAME_3 === n);
        if (!g.length) g = load('kreise').filter(f => base(f.properties.NAME_3) === base(n));
        if (!g.length) miss.push('k:' + n); got.push(...g);
      }
    } else if (kind === 'kb') { // Regierungsbezirke
      for (const n of arg.split(',')) { const g = load('kreise').filter(f => f.properties.NAME_2 === n); if (!g.length) miss.push('kb:' + n); got.push(...g); }
    } else if (kind === 'i') { const ps = islands(p, arg ? +arg : 0); if (!ps.length) miss.push(part); polys.push(...ps); continue; }
    else if (kind === 'f') { const ls = riverChain(arg, p); if (!ls.length) miss.push(part); lines.push(...ls); continue; }
    else miss.push('?' + part);
    if (!got.length && !['a1', 'a1reg', 'k', 'kb'].includes(kind)) miss.push(part);
    for (const f of got) polys.push(...polysOf(f.geometry));
  }
  return {polys, lines, miss};
}

const out = {}, report = [];
for (const l of fs.readFileSync(process.env.ZIELE || 'ziele.txt', 'utf8').split('\n')) {
  if (!l.trim() || l[0] === '#') continue;
  const [map, ort, cls, spec] = l.split('|');
  const key = map + '|' + ort, p = pt[key];
  if (!p) { report.push('KEIN PUNKT ' + key); continue; }
  const {polys, lines, miss} = resolve(spec, p);
  if (miss.length) report.push('FEHLT ' + key + ': ' + miss.join(', '));
  if (!polys.length && !lines.length) continue;
  const geom = lines.length ? {type: 'MultiLineString', coordinates: lines} : {type: 'MultiPolygon', coordinates: dissolve(polys)};
  // Plausibilität: Punkt drin bzw. nah dran?
  let dKm = 0;
  if (!lines.length && !d3.geoContains(geom, p)) { dKm = 1e9; for (const poly of polys) for (const r of poly) for (const c of r) dKm = Math.min(dKm, kmDist(c, p)); }
  const areaKm = lines.length ? 0 : Math.round(d3.geoArea(geom) * 6371 ** 2);
  const lenKm = lines.length ? Math.round(d3.geoLength(geom) * 6371) : 0;
  if (dKm > 30) report.push(`WEIT ${key}: Punkt ${Math.round(dKm)} km außerhalb`);
  out[key] = {cls, spec, geom, areaKm, lenKm};
}
fs.writeFileSync(process.env.ZIELE_OUT || 'ziele_geo.json', JSON.stringify(out));
console.log(Object.keys(out).length, 'Ziele aufgelöst');
console.log(report.join('\n'));
for (const [k, v] of Object.entries(out)) console.log(k.padEnd(36), v.cls, v.lenKm ? 'Länge ' + v.lenKm : 'Fläche ' + v.areaKm);
