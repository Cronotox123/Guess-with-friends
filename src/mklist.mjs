import fs from 'fs';
import {R} from './raetsel.mjs';
const MAP={de:'Deutschland',eu:'Europa',world:'Welt'};
const prompt = (von,bis)=>`AUFGABE (bitte genau so bearbeiten):
Du prüfst Rätsel für ein Partyspiel. Bei jedem Rätsel muss man zuerst ein Wort oder einen Begriff erraten. In der Lösung steckt ein Ortsname (Stadt, Land, Region, Insel, Berg …). Danach tippt man diesen Ort auf einer Karte an (Karte: Deutschland, Europa oder Welt). Gespielt wird von deutschsprachigen Erwachsenen ohne Spezialwissen, auf dem Handy, ohne Internet-Suche.

Bewerte JEDES Rätsel mit genau einer Stufe:
- leicht = fast jeder kommt in wenigen Sekunden auf die Lösung
- mittel = viele kommen drauf, manche brauchen einen Moment
- schwer = nur wenige kommen drauf, aber die Lösung ist fair und man denkt „ach klar!“
- dumm = unlösbar, zu weit hergeholt, mehrdeutig, sachlich falsch, Ortsname steckt nicht wirklich in der Lösung, oder einfach nicht witzig/peinlich

Antworte NUR mit einer Zeile pro Rätsel, ohne Einleitung, ohne Tabelle, in diesem Format:
Nr;Stufe;kurzer Grund (max. 10 Wörter)
Beispiel:
17;mittel;bekanntes Produkt, Ort aber nicht jedem klar
18;dumm;Wortspiel funktioniert nicht

Wenn bei „dumm“ eine bessere Formulierung naheliegt, schreib sie als Grund dazu. Lass keine Nummer aus. Hier kommen die Rätsel ${von} bis ${bis}. Format jeder Zeile: Nr | Karte | Rätsel | gemeinte Lösung → Zielort
`;
const line=(r,i)=>`${i+1} | ${MAP[r[0]]} | ${r[2].replace(/\s+/g,' ')} | ${r[3]} → ${r[4]}`;
let all = 'PUNKTLANDUNG – PRÜFLISTE (1000 Rätsel in 10 Blöcken zu je 100)\nSo geht es: Kopiere immer einen ganzen Block (von „AUFGABE“ bis „ENDE BLOCK“) in den Chat der anderen KI. Jeder Block enthält die Anweisung schon. Die Antworten (Nr;Stufe;Grund) einfach sammeln und mir zurückgeben, die Nummern bleiben gleich.\n\n';
for(let b=0;b<Math.ceil(R.length/100);b++){
  const s=b*100, e=Math.min(R.length,s+100);
  const txt = `===== BLOCK ${b+1} von ${Math.ceil(R.length/100)} =====\n` + prompt(s+1,e) + '\n' + R.slice(s,e).map((r,j)=>line(r,s+j)).join('\n') + `\n===== ENDE BLOCK ${b+1} =====\n`;
  fs.writeFileSync(`/mnt/project-files/punktlandung/pruefliste/block-${String(b+1).padStart(2,'0')}.txt`, txt);
  all += txt + '\n\n';
}
fs.writeFileSync('/mnt/project-files/punktlandung/pruefliste-1000.txt', all);
console.log(R.length, all.length);
