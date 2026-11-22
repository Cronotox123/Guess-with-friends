import fs from 'fs';
const Z = JSON.parse(fs.readFileSync('zuordnung.json'));
const KL = {g:'Grenze', a:'Gebiet +20 %', f:'Fluss 5 % je Seite'};
const MAP = {de:'Deutschland-Karte', eu:'Europa-Karte', world:'Welt-Karte'};
function src(spec){ return spec.split(';').map(p=>{ const i=p.indexOf(':'); const k=i<0?p:p.slice(0,i), a=i<0?'':p.slice(i+1);
  return ({c:'Staatsgrenze '+a, su:'Landesteil '+a, cont:'alle Länder von '+a, r:'Umriss „'+a+'“ (Natural Earth)', s:'Meeresfläche '+a, l:'See '+a, de:'Bundesland '+a,
    a1:'Bezirke: '+a.replace(/\/[A-Z-0-9]+/g,''), a1reg:'Region '+a.replace(/\/[A-Z]+/g,''), k:'Landkreise: '+a.replace(/ Städte/g,' (Stadt)'), kb:'Regierungsbezirke: '+a.replace('Munster','Münster'),
    f:'Flusslauf '+a, i: a ? 'alle Inseln im Umkreis von '+a+' km' : 'Inselumriss'})[k] || p; }).join(' + '); }
const seen = new Map();
for (const z of Z) { const key = z.map+'|'+z.o; if (!seen.has(key)) seen.set(key, {...z, n:0, bks:new Set()}); const e = seen.get(key); e.n++; e.bks.add(z.bk); }
let out = `PUNKTLANDUNG – Zuordnung der Flächen-Ziele (Stand ${new Date().toISOString().slice(0,10)})

So wird gewertet:
- Grenze (Länder, Bundesländer, Inseln, Seen): Punkt in der Fläche = Treffer. Spielraum am Rand: Deutschland 5 km, Europa 20 km, Welt 80 km.
- Gebiet +20 % (Gebirge, Wälder, Regionen, Meere): Fläche plus 20 % der größten Ausdehnung als Spielraum, mindestens wie oben, höchstens so groß wie der normale Kreis der Schwierigkeit.
- Fluss: Flusslauf plus 5 % der Flusslänge links und rechts, mindestens DE 10 / EU 30 / Welt 100 km, höchstens der normale Kreis.
- „Je näher, desto mehr“: im Ziel inkl. Spielraum = 100 Punkte, danach weniger, je weiter weg vom Rand.
- Alles, was hier NICHT steht (Städte, Berggipfel usw.), bleibt ein Kreis.

Bitte prüfen: Passt der Umriss zum gemeinten Ort? Falsche Zeilen einfach mit Nummer zurückschicken.

Nr | Karte | Ort | Wertung | Spielraum | Umriss aus
`;
let n = 0;
for (const map of ['de','eu','world']) {
  out += `\n=== ${MAP[map]} ===\n`;
  for (const e of [...seen.values()].filter(e=>e.map===map).sort((a,b)=>a.o.localeCompare(b.o,'de')))
    out += `${++n} | ${map} | ${e.o} | ${KL[e.c]} | ${[...e.bks].join('/')} km | ${src(e.spec)}${e.n>1?` (${e.n} Rätsel)`:''}\n`;
}
out += `
=== Bewusst als Kreis gelassen (kein brauchbarer Umriss in den Kartendaten) ===
Camargue, Ötztal, Riesengebirge, Kintyre (Halbinsel), Lago Maggiore, Rubikon, Clyde

Hinweise:
- Deutsche Landschaften sind aus Landkreisen zusammengesetzt (Kreisgrenzen vor 2008), dadurch teils etwas größer als die echte Landschaft.
- Harz und Erzgebirge kommen aus Natural Earth und sind grob umrissen.
- Schwaben = Regierungsbezirke Stuttgart, Tübingen und Bayerisch-Schwaben.
`;
fs.writeFileSync('/mnt/project-files/punktlandung/zuordnung-flaechen.txt', out);
console.log(n, 'Zeilen'); console.log(out.split('\n').slice(14,30).join('\n'));
