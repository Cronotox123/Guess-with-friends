import fs from 'fs';
import {createRequire} from 'module';
import * as topo from 'topojson-client';
import * as d3 from 'd3-geo';
import {R} from './raetsel.mjs';
const require = createRequire(import.meta.url);
const cities = require('all-the-cities');
const t50 = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-50m.json'));
const t110 = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-110m.json'));
const de = JSON.parse(fs.readFileSync('de.geojson'));
const c50 = topo.feature(t50, t50.objects.countries);
const b50 = topo.mesh(t50, t50.objects.countries, (a,b)=>a!==b);
const b110 = topo.mesh(t110, t110.objects.countries, (a,b)=>a!==b);
const land50 = topo.merge(t50, t50.objects.countries.geometries);
const land110 = topo.merge(t110, t110.objects.countries.geometries);
const deOutline = c50.features.find(f=>f.properties.name==='Germany');
const rnd = s=>s.replace(/(\d+\.\d+)/g, m=>(+m).toFixed(1)).replace(/\.0(?=\D|$)/g,'');
const W=600;
const pDE = d3.geoMercator().fitExtent([[25,25],[W-25,800-25]], deOutline);
const HDE = Math.ceil(d3.geoPath(pDE).bounds(deOutline)[1][1]+25); pDE.clipExtent([[0,0],[W,HDE]]);
const pEU = d3.geoConicConformal().rotate([-10,0]).parallels([40,65]).fitExtent([[0,0],[W,620]], {type:'MultiPoint',coordinates:[[-24,35],[42,35],[42,71],[-24,71],[10,71],[10,34],[-24,53],[42,53]]});
pEU.clipExtent([[0,0],[W,620]]);
const pW = d3.geoNaturalEarth1().fitExtent([[5,5],[W*2-5,620-5]], {type:'Sphere'});
const maps = {
  de:{w:W,h:HDE,proj:pDE,layers:[['sea',{type:'Sphere'}],['land',land50],['de',{type:'FeatureCollection',features:de.features}],['border',b50]], km:{L:35,M:45,S:60}},
  eu:{w:W,h:620,proj:pEU,layers:[['sea',{type:'Sphere'}],['land',land50],['border',b50]], km:{L:180,M:230,S:300}},
  world:{w:W*2,h:620,proj:pW,layers:[['sea',{type:'Sphere'}],['land',land110],['border',b110]], km:{L:600,M:800,S:1000}},
};
const LV = {L:'leicht',M:'mittel',S:'schwer'};
const Q = []; const miss = [];
function add(map, t, lat, lon, lvl, a, s, o, kmOver){
  const m = maps[map], km = kmOver || m.km[lvl], p = m.proj;
  const [x,y] = p([lon,lat]); const [x2,y2] = p([lon, lat + km/111.2]); const [x3,y3] = p([lon + km/111.2/Math.cos(lat*Math.PI/180), lat]);
  const r = (Math.hypot(x2-x,y2-y)+Math.hypot(x3-x,y3-y))/2;
  if(!(x>=0&&y>=0&&x<=m.w&&y<=m.h)){ miss.push('offmap '+t); return; }
  if(Q.some(q=>q.map===map && q.t===t)) return;
  Q.push({t, s, o, a, map, lvl:LV[lvl], km, x:+x.toFixed(1), y:+y.toFixed(1), r:+r.toFixed(1), k:+(r/km).toFixed(4)});
}
function find(name, cc){
  const c = cities.filter(x=>x.country===cc && (x.name===name || (x.altName||'').split(',').includes(name))).sort((a,b)=>b.population-a.population);
  return c[0];
}
for (const [map,lvl,t,s,o,lat,lon,a,km] of R) add(map,t,lat,lon,lvl,a,s,o,km);
// ---- Flächen-Ziele (Länder, Gebiete, Flüsse) ----
const ZG = JSON.parse(fs.readFileSync('ziele_geo.json'));
const MINK = {g:{de:5,eu:20,world:80}, a:{de:5,eu:20,world:80}, f:{de:10,eu:30,world:100}};
function rewind(geom){ // d3 erwartet Außenringe im Uhrzeigersinn
  if (geom.type!=='MultiPolygon') return geom;
  return {type:'MultiPolygon', coordinates: geom.coordinates.map(poly => d3.geoArea({type:'Polygon',coordinates:poly}) > 2*Math.PI ? poly.map(r=>r.slice().reverse()) : poly)};
}
function parsePath(str){ const rings=[]; let cur=null;
  for (const m of (str||'').matchAll(/([MLZ])([^MLZ]*)/g)) {
    if (m[1]==='M') { cur=[]; rings.push(cur); }
    if (m[1]!=='Z') { const n=m[2].split(',').map(Number); if(n.length===2&&isFinite(n[0])) cur.push(n); }
  } return rings; }
function dp(pts, tol){ if (pts.length<3) return pts;
  const keep=new Uint8Array(pts.length); keep[0]=keep[pts.length-1]=1; const st=[[0,pts.length-1]];
  while(st.length){ const [a,b]=st.pop(); let md=-1, mi=-1; const [ax,ay]=pts[a],[bx,by]=pts[b], L=Math.hypot(bx-ax,by-ay)||1e-9;
    for(let i=a+1;i<b;i++){ const d=Math.abs((bx-ax)*(ay-pts[i][1])-(ax-pts[i][0])*(by-ay))/L; if(d>md){md=d;mi=i;} }
    if(md>tol){ keep[mi]=1; st.push([a,mi],[mi,b]); } }
  return pts.filter((_,i)=>keep[i]); }
const ringArea = r => { let s=0; for(let i=0;i<r.length;i++){const [x1,y1]=r[i],[x2,y2]=r[(i+1)%r.length]; s+=x1*y2-x2*y1;} return Math.abs(s/2); };
const shapes = {}; const shapeInfo = {};
for (const [key, z] of Object.entries(ZG)) {
  const [map] = key.split('|'); const m = maps[map]; if (!m) continue;
  const line = z.geom.type==='MultiLineString';
  let rings = parsePath(d3.geoPath(m.proj)(line ? z.geom : rewind(z.geom)));
  rings = rings.map(r => { let q = dp(r, 0.5); if (!line && q.length>2 && Math.hypot(q[0][0]-q.at(-1)[0], q[0][1]-q.at(-1)[1])<0.01) q = q.slice(0,-1); return q; }).filter(r => r.length);
  if (!line) { const tot = rings.reduce((t,r)=>t+ringArea(r),0); const minA = tot > 2000 ? 1.5 : 0.3; const big = rings.filter(r => r.length>2 && ringArea(r) >= minA); if (big.length) rings = big; }
  if (!rings.length) { console.log('LEER', key); continue; }
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for (const r of rings) for (const [x,y] of r){ x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y); }
  // Kodierung: je Ring Zehntel-Pixel, erster Punkt absolut, dann Differenzen; Zahlen mit ',' getrennt, Ringe mit ';'
  shapes[key] = {c: z.cls, d: rings.map(r => { let px=0, py=0; const o=[]; for (const [x,y] of r){ const X=Math.round(x*10), Y=Math.round(y*10); if (o.length && X===px && Y===py) continue; o.push(X-px, Y-py); px=X; py=Y; } return o.join(','); }).join(';')};
  shapeInfo[key] = {extPx: Math.max(x1-x0, y1-y0), lenKm: z.lenKm, spec: z.spec};
}
for (const q of Q) {
  const key = q.map+'|'+q.o, sh = shapes[key]; if (!sh) continue;
  const inf = shapeInfo[key], mn = MINK[sh.c][q.map];
  let bk = mn;
  if (sh.c==='a') bk = Math.min(q.km, Math.max(mn, 0.2 * inf.extPx / q.k));
  if (sh.c==='f') bk = Math.min(q.km, Math.max(mn, 0.05 * inf.lenKm));
  q.g = key; q.bk = Math.round(bk); q.b = +(bk * q.k).toFixed(1);
}
const out = {maps:{}, questions:Q, shapes};
for (const [k,m] of Object.entries(maps)) { const path=d3.geoPath(m.proj); out.maps[k]={w:m.w,h:m.h,layers:m.layers.map(([c,g])=>[c,rnd(path(g)||'')])}; }
fs.writeFileSync('data.json', JSON.stringify(out));
const stat = {}; Q.forEach(q=>{const k=q.map+'/'+q.lvl; stat[k]=(stat[k]||0)+1;});
console.log('total', Q.length, 'size', fs.statSync('data.json').size, stat);
console.log('MISS', miss.join(' | '));
console.log('Flächen', Object.keys(shapes).length, 'Fragen mit Fläche', Q.filter(q=>q.g).length, 'Bytes', JSON.stringify(shapes).length);
fs.writeFileSync('zuordnung.json', JSON.stringify(Q.filter(q=>q.g).map(q=>({o:q.o,map:q.map,c:shapes[q.g].c,bk:q.bk,spec:shapeInfo[q.g].spec,t:q.t}))));
