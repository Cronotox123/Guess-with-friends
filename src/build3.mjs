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
const out = {maps:{}, questions:Q};
for (const [k,m] of Object.entries(maps)) { const path=d3.geoPath(m.proj); out.maps[k]={w:m.w,h:m.h,layers:m.layers.map(([c,g])=>[c,rnd(path(g)||'')])}; }
fs.writeFileSync('data.json', JSON.stringify(out));
const stat = {}; Q.forEach(q=>{const k=q.map+'/'+q.lvl; stat[k]=(stat[k]||0)+1;});
console.log('total', Q.length, 'size', fs.statSync('data.json').size, stat);
console.log('MISS', miss.join(' | '));
