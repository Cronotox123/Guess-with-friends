"""Baut die englische Version en/index.html (Guess with Friends) aus template.html + party.js.
Deutsche Texte werden über die Liste T ersetzt; jede Zeile muss mindestens einmal vorkommen.
Daten: en/data.json (build3.mjs mit KARTEN=us), en/raten.json (en/raten_en.py)."""
import os,re,sys
S=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); R=os.path.dirname(S); E=S+'/en'
rd=lambda p: open(p,encoding='utf-8').read()
src=rd(S+'/template.html').replace('__PARTY__',rd(S+'/party.js'))
T=[
# Hilfsfunktionen: Stufen, Meilen, eigener Speicher
("function esc(s){", "function LVT(l){ return {leicht:'easy',mittel:'medium',schwer:'hard'}[l]||l; }\nfunction MI(km){ const m=Math.round(km*0.621371); return m.toLocaleString('en-US')+(m===1?' mile':' miles'); }\nfunction esc(s){"),
("const DATA = __DATA__;", "const LSX = {getItem:k=>localStorage.getItem('en:'+k), setItem:(k,v)=>localStorage.setItem('en:'+k,v), removeItem:k=>localStorage.removeItem('en:'+k)};\nconst DATA = __DATA__;"),
("localStorage.", "LSX."),
("prefix: 'punktlandung-v1-'","prefix: 'guesswf-en-v1-'"),
("'punktlandung/v1/' + code","'guesswf-en/v1/' + code"),
("s.src = 'vendor/mqtt.min.js'", "s.src = '../vendor/mqtt.min.js'"),
(">${q.lvl}</span>", ">${LVT(q.lvl)}</span>"),
(">${q.s}</span>", ">${LVT(q.s)}</span>"),
# Zahlen
("  if(s.includes(',')) s = s.replace(/\\./g,'').replace(',','.');\n  else if(/^\\d{1,3}(\\.\\d{3})+$/.test(s)) s = s.replace(/\\./g,'');", "  s = s.replace(/,/g,'');"),
("String(Math.round(x*10)/10).replace('.', ',')", "String(Math.round(x*10)/10)"),
("['km daneben', r=>r.km.toLocaleString('de-DE')]", "['Miles off', r=>Math.round(r.km*0.621371).toLocaleString('en-US')]"),
("r.km.toLocaleString('de-DE')", "Math.round(r.km*0.621371).toLocaleString('en-US')"),
("'de-DE'", "'en-US'"),
# Schwierigkeit, Kategorien
("name:'Leicht/Mittel'","name:'Easy/Medium'"),("name:'Mittel/Schwer'","name:'Medium/Hard'"),("name:'Leicht'","name:'Easy'"),("name:'Mittel'","name:'Medium'"),("name:'Schwer'","name:'Hard'"),("name:'Alle Fragen'","name:'All levels'"),
(">Schwierigkeit<",">Difficulty<"),("'Leichter Einstieg, schweres Finale.'","'Easy start, hard finale.'"),("'Alle 10 Rätsel aus dieser Stufe.'","'All 10 questions from this level.'"),
("karte:{name:'Karte', info:'Nur Kartenrätsel: Rätsel lösen, Ort tippen.'}","karte:{name:'Map', info:'Map riddles only: solve the riddle, tap the place.'}"),
("raten:{name:'Raten', info:'Nur Ratefragen. Bis 5 % daneben gibt 1 Treffer, bis 20 % einen halben. Bei Gleichstand gewinnt, wer im Schnitt weniger Prozent daneben lag.'}","raten:{name:'Guess', info:'Number questions only. Within 5 % counts as a hit, within 20 % as half a hit. In a tie, the lowest average % off wins.'}"),
("mix:{name:'Gemischt', info:'Abwechselnd Karte und Raten. Es zählen nur Treffer, bei Gleichstand entscheidet eine Schätz-Stechfrage.'}","mix:{name:'Mixed', info:'Map and Guess take turns. Only hits count; a tie is settled by an estimation tie-breaker.'}"),
("gk:{name:'Größer oder kleiner', short:'Größer/Kleiner'}","gk:{name:'More or less', short:'More/Less'}"),
("schaetzen:{name:'Zahlen schätzen', short:'Schätzen'}","schaetzen:{name:'Estimate', short:'Estimate'}"),
("kalorien:{name:'Kalorien raten', short:'Kalorien'}","kalorien:{name:'Guess the calories', short:'Calories'}"),
("preise:{name:'Preise raten', short:'Preise'}","preise:{name:'Guess the price', short:'Prices'}"),
(">Kategorie<",">Category<"),
# Raten
('placeholder="Deine Schätzung" aria-label="Deine Schätzung"','placeholder="Your guess" aria-label="Your guess"'),
("'Bitte nur eine Zahl eingeben'","'Please enter a number only'"),
(">Richtige Antwort<",">Correct answer<"),("Quelle: ${","Source: ${"),
("'<li>Keiner hat geantwortet.</li>'","'<li>Nobody answered.</li>'"),
("'Richtig!'","'Correct!'"),("'Knapp dran!'","'Close!'"),("'Daneben'","'Missed'"),
("'Niemand lag richtig'","'Nobody got it'"),("'Alle lagen richtig!'","'Everyone got it!'"),
("`${full} richtig${half?`, ${half} knapp dran`:''}`","`${full} correct${half?`, ${half} close`:''}`"),
# Start
('<a class="lang" href="en/" lang="en">English</a>','<a class="lang" href="../" lang="de">Deutsch</a>'),
("Punkt&shy;landung","Guess with Friends"),
("Größer oder kleiner, Zahlen schätzen, Kalorien und Preise raten. Jede Antwort ist mit Quelle belegt. ${ROUND} Fragen pro Spiel aus ${RATEN.length}, ein Handy für alle.","More or less, estimates, calories and prices. Every answer comes with a source. ${ROUND} questions per game out of ${RATEN.length}, one phone for everyone."),
("Erst das Rätsel knacken, dann den Ort finden. Die Lösung klingt wie eine Stadt, eine Region oder ein Land. Wer mit seinem Punkt im Zielkreis landet, liegt richtig. Ist die Lösung ein Land, ein Gebiet oder ein Fluss, zählt die ganze Fläche bzw. der Flusslauf plus etwas Spielraum. ${ROUND} Fragen pro Spiel, ein Handy für alle.","First crack the riddle, then find the place. The answer hides a city, a region or a country. Land your pin inside the target circle and you score. If the answer is a country, a region or a river, the whole area or the river counts, plus a little margin. ${ROUND} questions per game, one phone for everyone."),
('placeholder="Name eingeben"','placeholder="Enter a name"'),('aria-label="Spielername"','aria-label="Player name"'),(">Hinzufügen<",">Add<"),
('aria-label="${esc(p)} entfernen"','aria-label="Remove ${esc(p)}"'),
("${S.players.length} Spieler</p>","${S.players.length} player${S.players.length===1?'':'s'}</p>"),
(">Spiel starten<",">Start game<"),
("Handy-Party: Ich starte, die anderen scannen den QR-Code","Phone party: I host, the others scan the QR code"),
("Tablet-Party: Tablet in die Mitte, jeder spielt mit seinem Handy","Tablet party: tablet in the middle, everyone plays on their own phone"),
("'Bitte einen Namen eingeben.'","'Please enter a name.'"),("'Diesen Namen gibt es schon.'","'That name is already taken.'"),
# Weitergeben
("${tb?'Stechfrage':`Frage ${S.q+1} von ${ROUND}`}","${tb?'Tie-breaker':`Question ${S.q+1} of ${ROUND}`}"),
("'Los geht’s. Das Handy bekommt':'Handy weitergeben an'","'Here we go. The phone goes to':'Pass the phone to'"),
("Die anderen bitte nicht hinschauen.","Everyone else, no peeking."),
("Ich bin ${esc(name)}, zeig die Frage","I’m ${esc(name)}, show the question"),
(">Spiel abbrechen<",">Quit game<"),(">Weiterspielen<",">Keep playing<"),(">Ja, abbrechen<",">Yes, quit<"),
# Karte
('aria-label="Karte"','aria-label="Map"'),('aria-label="Hineinzoomen"','aria-label="Zoom in"'),('aria-label="Herauszoomen"','aria-label="Zoom out"'),('aria-label="Ganze Karte"','aria-label="Whole map"'),
("Auflösung · Stechfrage","Answer · Tie-breaker"),("Auflösung · ","Answer · "),
("Stechfrage · am nächsten dran gewinnt","Tie-breaker · closest wins"),
("Frage ${","Question ${"),
("Rätsel lösen, dann auf dem Handy den Ort tippen","Solve the riddle, then tap the place on your phone"),
("Rätsel lösen, dann den Ort tippen","Solve the riddle, then tap the place"),
("${esc(p)} ist dran","${esc(p)}’s turn"),
("Tippen setzt den Punkt · zwei Finger zoomen","Tap to drop your pin · pinch to zoom"),
("OK, Punkt bestätigen","OK, confirm pin"),("OK, Antwort bestätigen","OK, confirm answer"),
("`Kreis: ${q.km} km Radius.`","`Circle: ${MI(q.km)} radius.`"),
("`Ziel ist der Flusslauf, ${q.bk} km links und rechts zählen mit.`","`The target is the river; ${MI(q.bk)} on either side count too.`"),
("`Ziel ist die ganze Fläche, dazu ${q.bk} km Spielraum am Rand.`","`The target is the whole area, plus ${MI(q.bk)} of margin.`"),
# Auflösung, Ende
("'Zur Endwertung'","'Final scores'"),(">Zur Endwertung<",">Final scores<"),("'Nächste Frage'","'Next question'"),
("'Wieder gleich nah dran!':esc(win[0])+' lag am nächsten'","'Tied again!':esc(win[0])+' was closest'"),
(">Gemeint war<",">The answer<"),
("`${hits} von ${res.length} lagen richtig`","`${hits} of ${res.length} got it`"),
("${r.km} km daneben","${MI(r.km)} off"),
("Endwertung · ","Final scores · "),(">Endwertung<",">Final scores<"),
("Gleichstand<span","It’s a tie<span"),
(" haben je ${fmtPts(top.pts)} Treffer. Eine Schätzfrage entscheidet: Wer am nächsten dran ist, gewinnt."," each have ${fmtPts(top.pts)} hits. One estimation question decides: closest wins."),
(">Stechfrage starten<",">Start tie-breaker<"),("['Ø daneben',","['Avg. off',"),
("'Bei Gleichstand entscheidet, wer insgesamt weniger Kilometer daneben lag.'","'In a tie, whoever was fewer miles off in total wins.'"),
("'Bei Gleichstand entscheidet, wer im Schnitt weniger Prozent daneben lag.'","'In a tie, the lowest average % off wins.'"),
("`Gleichstand, die Stechfrage hat entschieden.`","`It was a tie; the tie-breaker decided.`"),("'Es zählen nur Treffer.'","'Only hits count.'"),
("${winners.map(esc).join(' und ')} ${winners.length>1?'gewinnen':'gewinnt'}","${winners.map(esc).join(' and ')} ${winners.length>1?'win':'wins'}"),
("${fmtPts(top.pts)} von ${ROUND} Treffern. ${note}","${fmtPts(top.pts)} of ${ROUND} hits. ${note}"),
("<th>Spieler</th>","<th>Player</th>"),('<th class="pts">Treffer</th>','<th class="pts">Hits</th>'),
(">Nochmal mit denselben Spielern<",">Play again, same players<"),(">Neue Spieler eintragen<",">New players<"),
# Partymodus
("mode === 'kreis' ? 'Treffer' : 'Punkte'","mode === 'kreis' ? 'hits' : 'points'"),
("'Direkte Verbindung klappt nicht, nehme den Umweg über den Vermittlungs-Server …'","'Direct connection fails, using the detour through the matchmaking server …'"),
("'Direkte Verbindung klappt nicht, nehme den Umweg über einen Server …'","'Direct connection fails, using a detour through a server …'"),
("'Umweg-Server: ' + n + ' von ' + RELAY.brokers.length + ' verbunden'","'Detour servers: ' + n + ' of ' + RELAY.brokers.length + ' connected'"),
("'Umweg: verbinde mit ' + host + ' …'","'Detour: connecting to ' + host + ' …'"),
("'Verbindung verloren, verbinde neu …'","'Connection lost, reconnecting …'"),
("'Umweg über ' + host + ' steht, warte auf den Gastgeber …'","'Detour via ' + host + ' is up, waiting for the host …'"),
("'Gastgeber'","'Host'"),
("'Server antwortet nicht, neuer Versuch …'","'Server not answering, trying again …'"),
("'Verbindungsproblem: ' + err.type + ', neuer Versuch …'","'Connection problem: ' + err.type + ', trying again …'"),
("'Verbindung zum Server weg, verbinde neu …'","'Lost the server, reconnecting …'"),
("'<span class=\"muted\">tippt …</span>'","'<span class=\"muted\">answering …</span>'"),
("' (du)'","' (you)'"),("'<span class=\"muted\">getrennt</span>'","'<span class=\"muted\">disconnected</span>'"),
("${H.play?'Handy-Party':'Partymodus'}","${H.play?'Phone party':'Party mode'}"),
("${esc(H.status)}","${esc(H.status==='bereit'?'ready':H.status)}"),
(">Dein Name<",">Your name<"),('aria-label="Dein Name"','aria-label="Your name"'),('placeholder="Dein Name"','placeholder="Your name"'),
("Raum wird geöffnet …","Opening the room …"),
("Mit dem Handy den QR-Code scannen oder diese Adresse öffnen:","Scan the QR code with your phone or open this address:"),
(">Raumcode<",">Room code<"),("Umweg-Server: verbinde …","Detour servers: connecting …"),
("Am besten klappt es im selben WLAN. Unterwegs: Gastgeber macht einen Hotspot an, die anderen verbinden sich damit. Diesen Bildschirm offen lassen.","Works best on the same Wi-Fi. On the go: the host turns on a hotspot and the others join it. Keep this screen open."),
(">Wertung<",">Scoring<"),
("<b>Treffer, sonst der Nächste</b><span>1 Punkt für jeden im Ziel. Liegt keiner im Ziel, bekommt der Nächste den Punkt.</span>","<b>Hits, else the closest</b><span>1 point for everyone on target. If nobody is on target, the closest player gets the point.</span>"),
("<b>Treffer im Ziel</b><span>1 Punkt für jeden, der im Kreis oder in der Zielfläche liegt.</span>","<b>Hits on target</b><span>1 point for everyone inside the circle or the target area.</span>"),
("<b>Je näher, desto mehr</b><span>Bis zu 100 Punkte, je nach Abstand zum Ziel.</span>","<b>The closer, the more</b><span>Up to 100 points, depending on the distance to the target.</span>"),
("<b>Treffer</b><span>Punkte für jeden, der richtig oder nah genug liegt.</span>","<b>Hits</b><span>Points for everyone who is right or close enough.</span>"),
("Du spielst selbst mit und tippst nach jeder Auflösung auf „Nächste Frage“, wenn alle so weit sind.","You play too, and after each answer you tap “Next question” when everyone is ready."),
(">Zurück zum Ein-Handy-Spiel<",">Back to the one-phone game<"),
("OK, Punkt setzen","OK, drop pin"),
("Dein Punkt ist gesetzt. Warte auf die anderen oder löse jetzt auf.","Your pin is set. Wait for the others or reveal now."),
(">Jetzt auflösen<",">Reveal now<"),
("'Stechfrage · Raum '+H.code","'Tie-breaker · Room '+H.code"),(" · Raum ${H.code}"," · Room ${H.code}"),
("`Gleichstand! Stechfrage für ${H.tb.pids.map(id=>esc(H.players[id].name)).join(' und ')}. Wer am nächsten dran ist, gewinnt.`","`It’s a tie! Tie-breaker for ${H.tb.pids.map(id=>esc(H.players[id].name)).join(' and ')}. Closest wins.`"),
("'Deine Antwort ist abgegeben. Warte auf die anderen oder löse jetzt auf.'","'Your answer is in. Wait for the others or reveal now.'"),
("'Antwort auf dem Handy eingeben'","'Enter your answer on your phone'"),
("OK, Antwort abgeben","OK, submit answer"),
("Antwort in: <b>","Answer in: <b>"),
(">Zwischenstand<",">Standings<"),
("${r.km} km · +${r.pts}","${MI(r.km)} · +${r.pts}"),
("'<li>Keiner hat einen Punkt gesetzt.</li>'","'<li>Nobody dropped a pin.</li>'"),
("'km daneben' : cat==='raten' ? 'Ø daneben'","'Miles off' : cat==='raten' ? 'Avg. off'"),
("'Karte · Treffer im Ziel'","'Map · Hits on target'"),("'Karte · Je näher, desto mehr'","'Map · The closer, the more'"),("'Karte') : CATS","'Map') : CATS"),
("' · Treffer, sonst der Nächste'","' · Hits, else the closest'"),
("winner:d.winners.join(' und ')","winner:d.winners.join(' and ')"),
(">Nochmal mit allen<",">Play again with everyone<"),
("'Verbinde mit dem Server …'","'Connecting to the server …'"),("'Server erreicht, suche das Spiel …'","'Server reached, looking for the game …'"),
("'Raum '+P.code+' nicht gefunden. Ist das Spiel beim Gastgeber noch offen (Bildschirm an, Browser im Vordergrund)?'","'Room '+P.code+' not found. Is the game still open on the host (screen on, browser in front)?'"),
("'Verbindungsproblem ('+err.type+'), versuche es weiter …'","'Connection problem ('+err.type+'), still trying …'"),
("'Der Spiel-Server ist gerade nicht erreichbar. Prüf das Internet (WLAN oder mobile Daten an?). Ich versuche es automatisch weiter …'","'The game server can’t be reached right now. Check your internet (Wi-Fi or mobile data on?). I’ll keep trying …'"),
("'Die Handys finden sich nicht. Tipp: Alle ins gleiche WLAN – oder der Gastgeber macht einen Hotspot an und die anderen verbinden sich damit. Ich versuche es weiter …'","'The phones can’t find each other. Tip: everyone on the same Wi-Fi, or the host turns on a hotspot and the others join it. I’ll keep trying …'"),
(">Raum ${esc(P.code)}<",">Room ${esc(P.code)}<"),(">Verbinde …<",">Connecting …<"),
("Du spielst mit deinem Handy. Die Rätsel und die Auflösung kommen direkt hierher.","You play on your phone. The riddles and the answers come straight here."),
(">Mitspielen<",">Join<"),("'Bitte gib deinen Namen ein.'","'Please enter your name.'"),
("Verbinde mit dem Tablet …","Connecting to the host …"),
("Du bist drin!","You’re in!"),("Warte, bis der Gastgeber das Spiel startet.","Wait for the host to start the game."),
("OK, Antwort abschicken","OK, send answer"),("'Keine Verbindung. Deine Antwort wird gesendet, sobald sie wieder da ist.'","'No connection. Your answer will be sent as soon as it’s back.'"),
("'Gesendet …'","'Sent …'"),("OK, Punkt abschicken","OK, send pin"),("'Keine Verbindung. Dein Punkt wird gesendet, sobald sie wieder da ist.'","'No connection. Your pin will be sent as soon as it’s back.'"),
("<h2>Gleichstand!</h2>","<h2>It’s a tie!</h2>"),(" spielen eine Stechfrage. Das Ergebnis kommt gleich."," play a tie-breaker. The result is coming."),
("'Antwort abgegeben':'Punkt gesetzt'","'Answer sent':'Pin dropped'"),
("Warte auf die anderen. Die Auflösung kommt gleich auch hier aufs Handy.","Wait for the others. The answer will show up here on your phone."),
(">Zu spät<",">Too late<"),("Diese Runde lief ohne deinen Punkt.","This round went on without your pin."),
("'Am nächsten dran!':'Treffer!'","'Closest!':'Hit!'"),("'Treffer!'","'Hit!'"),
("${r.km} km vom Ziel · +${r.pts} ${ptsLabel(r.mode)} · Gesamt: ","${MI(r.km)} from the target · +${r.pts} ${ptsLabel(r.mode)} · Total: "),
("'Deine Antwort: '","'Your answer: '"),("+' daneben'} · +${fmtPts(r.pts)} Treffer · Gesamt: ","+' off'} · +${fmtPts(r.pts)} hits · Total: "),
("Gleich geht es mit der nächsten Frage weiter.","The next question is coming up."),
(">Endstand<",">Final result<"),(">Platz ${r.rank}<",">Place ${r.rank}<"),(">von ${r.of} · ",">of ${r.of} · "),
("'<h2>Du hast gewonnen!</h2>'","'<h2>You won!</h2>'"),("Gewonnen hat ${esc(r.winner)}.","${esc(r.winner)} won."),
(">Stechfrage<",">Tie-breaker<"),
]
miss=[]
for a,b in T:
    if a not in src: miss.append(a); continue
    src=src.replace(a,b)
if miss: print('NICHT GEFUNDEN:'); [print('  ',m[:120]) for m in miss]
# Reste: deutsche Wörter außerhalb von Kommentaren
code=re.sub(r'/\*.*?\*/','',src,flags=re.S); code=re.sub(r'(?m)//[^\n]*$','',code)
left=sorted(set(m.group(0) for m in re.finditer(r"[^\n'\"`<>]*[äöüÄÖÜß][^\n'\"`<>]*",code)))
print('REST mit Umlaut:',len(left)); [print('  ',l.strip()[:140]) for l in left[:60]]
data=rd(E+'/data.json'); raten=rd(E+'/raten.json')
page=src.replace('const DATA = __DATA__;','const DATA = '+data+';').replace('const RATEN = __RATEN__;','const RATEN = '+raten+';')
head='<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
i=page.index('<div id="app">'); full=head+page[:i]+'</head>\n<body>\n'+page[i:]+'\n</body>\n</html>\n'
full=re.sub(r'<title>[^<]*</title>','<title>Guess with Friends</title>',full)
libs='<script src="../vendor/peerjs.min.js"></script>\n<script src="../vendor/qrcode.js"></script>\n'
j=full.index('<script>\nconst LSX'); os.makedirs(R+'/en',exist_ok=True)
open(R+'/en/index.html','w',encoding='utf-8').write(full[:j]+libs+full[j:])
print('en/index.html gebaut', len(full))
