import sys; sys.path.insert(0,'.')
from load import *
Q=[]
def add(st,f,a,q): Q.append((st,f,a,q))
SS='https://www.schloss.bayern.de/deutsch/service/tourismus/preise2026.pdf'
sc={r[0]:r[1] for r,s in rows('schloesser.txt')}
names={'Schloss Neuschwanstein':('leicht','ins Schloss Neuschwanstein'),'Schloss Linderhof Einzelkarte':('mittel','ins Schloss Linderhof (Einzelkarte)'),
'Herrenchiemsee Gesamtkarte Insel':('mittel','für die Gesamtkarte „Insel“ auf Herrenchiemsee'),'Schloss Nymphenburg':('leicht','ins Schloss Nymphenburg'),
'Residenzmuseum München':('mittel','ins Residenzmuseum München'),'Schatzkammer München':('mittel','in die Schatzkammer der Münchner Residenz'),
'Gesamtkarte Residenz München':('mittel','für die Gesamtkarte der Münchner Residenz'),'Cuvilliés-Theater':('schwer','ins Cuvilliés-Theater in München'),
'Residenz Würzburg':('mittel','in die Würzburger Residenz'),'Kaiserburg Nürnberg':('mittel','in die Kaiserburg Nürnberg'),'Walhalla':('mittel','in die Walhalla bei Regensburg'),
'Befreiungshalle Kelheim':('schwer','in die Befreiungshalle Kelheim'),'Markgräfliches Opernhaus Bayreuth':('mittel','ins Markgräfliche Opernhaus Bayreuth (Welterbe)'),
'Neue Residenz Bamberg':('schwer','in die Neue Residenz Bamberg'),'Burg Burghausen':('schwer','in die Burg zu Burghausen (längste Burg der Welt)'),
'Burg Trausnitz':('schwer','in die Burg Trausnitz in Landshut'),'Schloss Ehrenburg (Coburg)':('schwer','ins Schloss Ehrenburg in Coburg'),
'Plassenburg Kulmbach':('schwer','in die Plassenburg in Kulmbach'),'Marstallmuseum':('schwer','ins Marstallmuseum in Nymphenburg'),
'Ruhmeshalle und Bavaria':('mittel','in die Bavaria an der Münchner Theresienwiese'),'Schloss Dachau':('schwer','ins Schloss Dachau'),
'Neues Schloss Schleißheim':('schwer','ins Neue Schloss Schleißheim'),'Venusgrotte':('mittel','in die Venusgrotte von Schloss Linderhof'),
'Königshaus am Schachen':('schwer','ins Königshaus am Schachen'),'Burg Cadolzburg':('schwer','in die Burg Cadolzburg'),'Schloss Johannisburg (Aschaffenburg)':('schwer','ins Schloss Johannisburg in Aschaffenburg'),
'Residenz Kempten':('schwer','in die Residenz Kempten'),'Jahreskarte Einzel':('mittel','die Jahreskarte der Bayerischen Schlösserverwaltung (Einzelperson)'),
'Jahreskarte Familie':('mittel','die Familien-Jahreskarte der Bayerischen Schlösserverwaltung'),'Schloss Linderhof Gesamtkarte':('mittel','die Gesamtkarte für Schloss Linderhof')}
for k,(lv,txt) in names.items():
    if txt.startswith('die '): f=f"Was kostet 2026 {txt}?"
    else: f=f"Was kostet 2026 der reguläre Eintritt {txt}?"
    add(lv,f,sc[k]+' €',SS)
P='https://www.deutschepost.de/dam/jcr:15eb81be-f45b-4111-86de-9cb40328e877/dp-leistungen-und-preise-sw-072026.pdf'
for lv,f,a in [('leicht','Was kostet das Porto für einen Standardbrief innerhalb Deutschlands (Stand Juli 2026)?','0,95 €'),
('mittel','Was kostet das Porto für eine Postkarte ins Ausland (Stand Juli 2026)?','1,25 €'),
('mittel','Was kostet das Porto für einen Großbrief innerhalb Deutschlands (Stand Juli 2026)?','1,80 €'),
('mittel','Was kostet das Porto für einen Maxibrief innerhalb Deutschlands (Stand Juli 2026)?','2,90 €'),
('schwer','Was kostet das Porto für einen Kompaktbrief innerhalb Deutschlands (Stand Juli 2026)?','1,10 €'),
('schwer','Was kostet das Porto für einen Großbrief ins Ausland (Stand Juli 2026)?','3,30 €'),
('schwer','Was kostet das Porto für einen Maxibrief ins Ausland (Stand Juli 2026)?','6,50 €'),
('schwer','Was kostet eine Warensendung innerhalb Deutschlands (Stand Juli 2026)?','2,70 €'),
('schwer','Was kostet der Zuschlag für ein Einschreiben Einwurf (Stand Juli 2026)?','2,35 €'),
('schwer','Was kostet der Zuschlag für einen Rückschein (Stand Juli 2026)?','2,20 €')]: add(lv,f,a,P)
H='https://digi.bib.uni-mannheim.de/fileadmin/statjahrb/514402342_1952/pdf/514402342_0437.pdf'
H2='https://digi.bib.uni-mannheim.de/fileadmin/statjahrb/514402342_1953/pdf/514402342_0542.pdf'
for lv,f,a,q in [('mittel','Was kostete 1950 in Westdeutschland ein Liter Vollmilch im Schnitt?','0,35 DM',H),
('mittel','Was kostete 1950 in Westdeutschland ein Kilo Butter im Schnitt?','5,50 DM',H),
('schwer','Was kostete 1938 in Deutschland ein Kilo Butter im Schnitt?','3,19 Reichsmark',H),
('mittel','Was kostete 1950 in Westdeutschland ein Ei (Klasse B) im Schnitt?','0,22 DM (22 Pfennig)',H),
('schwer','Was kostete 1938 in Deutschland ein Ei (Klasse B) im Schnitt?','0,12 Reichsmark (12 Pfennig)',H),
('mittel','Was kostete 1950 in Westdeutschland ein Kilo gerösteter Bohnenkaffee im Schnitt?','28,80 DM',H),
('schwer','Was kostete 1952 in Westdeutschland ein Kilo gerösteter Bohnenkaffee im Schnitt?','32,50 DM',H2),
('mittel','Was kostete 1950 in Westdeutschland ein Kilo Mischbrot im Schnitt?','0,50 DM',H),
('schwer','Was kostete 1950 in Westdeutschland ein Kilo Roggenbrot im Schnitt?','0,43 DM',H),
('mittel','Was kosteten 1950 in Westdeutschland 5 Kilo Speisekartoffeln im Schnitt?','0,76 DM',H),
('schwer','Was kosteten 1952 in Westdeutschland 5 Kilo Speisekartoffeln im Schnitt?','1,08 DM',H2),
('mittel','Was kostete 1951 in Westdeutschland ein Kilo Schweinekotelett im Schnitt?','4,64 DM',H),
('schwer','Was kostete 1938 in Deutschland ein Kilo Schweinekotelett im Schnitt?','2,10 Reichsmark',H),
('mittel','Was kostete 1951 in Westdeutschland ein Kilo Rinder-Schmorfleisch im Schnitt?','3,93 DM',H),
('schwer','Was kostete 1938 in Deutschland ein Liter Vollmilch im Schnitt?','0,23 Reichsmark',H),
('mittel','Was kostete 1951 in Westdeutschland ein Kilo Tafeläpfel im Schnitt?','0,83 DM',H),
('schwer','Was kostete 1949 in Westdeutschland ein Kilo Tafeläpfel im Schnitt?','1,31 DM',H),
('mittel','Was kostete 1950 in Westdeutschland ein Glas helles Bier in einer einfachen Gaststätte?','0,34 DM',H2),
('schwer','Was kostete 1952 in Westdeutschland ein Kilo Butter im Schnitt?','6,38 DM',H2),
('schwer','Was kostete 1952 in Westdeutschland ein Ei (Klasse B) im Schnitt?','0,25 DM (25 Pfennig)',H2)]:
    add(lv,f,a,q+(' und '+H2 if q==H else ''))
add('leicht','Was kostet das Deutschlandticket ab 2026 im Monat?','63 €','https://www.zdfheute.de/politik/deutschlandticket-dticket-verkehr-nahverkehr-preis-erhoehung-100.html')
add('mittel','Was kostete das Deutschlandticket 2025 im Monat?','58 €','https://int.bahn.de/en/faq/deutschlandticket-cost-new')
add('mittel','Für wie viel wurde Leonardo da Vincis „Salvator Mundi“ 2017 bei Christie’s versteigert (mit Gebühren)?','450,3 Mio. Dollar','https://news.artnet.com/market/last-known-leonardo-da-vinci-painting-just-sold-1149032')
add('schwer','Wie hoch war bei „Salvator Mundi“ (2017) der reine Zuschlag ohne Gebühren?','400 Mio. Dollar','https://news.artnet.com/market/last-known-leonardo-da-vinci-painting-just-sold-1149032')
add('mittel','Für wie viel wurde 2022 das Mercedes 300 SLR Uhlenhaut-Coupé von 1955 versteigert?','135 Mio. €','https://rmsothebys.com/media-center/press-releases/rm-sotheby-s-announces-the-sale-of-the-most-valuable-car-in-the-world-the-1955-mercedes-benz-300-slr-uhlenhaut-coup%C3%A9-is-sold-for-135-000-000')
add('mittel','Was kostete ein neuer Ford Model T bei der Einführung 1908?','850 Dollar','https://www.thehenryford.org/collections/explore/articles/fords-model-t')
add('schwer','Was kostete Anfang 1999 ein Liter Super in Deutschland im Schnitt (in DM)?','knapp 1,54 DM (unter 79 Cent)','https://www.adac.de/verkehr/tanken-kraftstoff-antrieb/kraftstoffpreisentwicklung/')

W='https://stadt.muenchen.de/dam/jcr%3A8811dc3c-f77e-4c6c-af71-5136d8cca5ee/Bierpreis_Oktoberfest2025.pdf'
for lv,f,a in [('leicht','Was kostete eine Maß Bier auf dem Oktoberfest 2025 im Durchschnitt?','15,25 €'),
('mittel','Was kostete die günstigste Maß Bier auf dem Oktoberfest 2025?','14,50 €'),
('mittel','Was kostete die teuerste Maß Bier auf dem Oktoberfest 2025?','15,80 €'),
('mittel','Was kostete eine Maß Bier auf dem Oktoberfest 2024 im Durchschnitt?','14,73 €'),
('schwer','Was kostete eine Maß alkoholfreies Bier auf dem Oktoberfest 2025 im Durchschnitt?','15,37 €'),
('mittel','Was kostete ein Liter Mineralwasser auf dem Oktoberfest 2025 im Durchschnitt?','10,95 €'),
('schwer','Was kostete ein Liter Spezi auf dem Oktoberfest 2025 im Durchschnitt?','12,48 €'),
('schwer','Was kostete ein Liter Limonade auf dem Oktoberfest 2025 im Durchschnitt?','12,11 €')]: add(lv,f,a,W)
M='https://www.bundesregierung.de/breg-de/aktuelles/mindestlohn-steigt-2391010'
add('leicht','Wie hoch ist der gesetzliche Mindestlohn in Deutschland seit 1.1.2026 (pro Stunde)?','13,90 €',M)
add('mittel','Auf wie viel Euro pro Stunde steigt der Mindestlohn am 1.1.2027?','14,60 €',M)
PA='https://www.gesetze-im-internet.de/pauswgebv/BJNR147700010.html'
add('mittel','Was kostet ein neuer Personalausweis für Menschen ab 24 Jahren (Stand 2026)?','46 €',PA)
add('schwer','Was kostet ein neuer Personalausweis für Menschen unter 24 Jahren (Stand 2026)?','27,60 €',PA)
V='https://www.oesterreich.gv.at/themen/mobilitaet/kfz/10/Vignette-und-Maut/Vignette-fuer-Fahrzeuge-bis-3,5-t.html'
add('leicht','Was kostet die österreichische Jahresvignette 2026 für ein Auto?','106,80 €',V)
add('mittel','Was kostet die österreichische 10-Tages-Vignette 2026 für ein Auto?','12,80 €',V)
add('mittel','Was kostet die österreichische 2-Monats-Vignette 2026 für ein Auto?','32,00 €',V)
add('schwer','Was kostet die österreichische 1-Tages-Vignette 2026 für ein Auto?','9,60 €',V)
add('schwer','Was kostet die österreichische Jahresvignette 2026 für ein Motorrad?','42,70 €',V)
add('mittel','Was kostet eine BahnCard 50 für die 2. Klasse (ein Jahr, Stand November 2026)?','244 €','https://www.bahn.de/angebot/bahncard/bahncard50-2-klasse')
add('schwer','Was kostet eine BahnCard 50 für die 1. Klasse (ein Jahr, Stand November 2026)?','492 €','https://www.bahn.de/angebot/bahncard/bahncard50-2-klasse')
add('mittel','Was kostet eine BahnCard 25 für die 2. Klasse (ein Jahr, Stand November 2026)?','62,90 €','https://www.bahn.de/angebot/bahncard/bahncard25/bahncard25')
add('schwer','Was kostet eine BahnCard 25 für die 1. Klasse (ein Jahr, Stand November 2026)?','125 €','https://www.bahn.de/angebot/bahncard/bahncard25/bahncard25')

add('mittel','Was kostet ab 2026 der Eintritt in den Louvre für Besucher von außerhalb der EU?','32 €','https://www.euronews.com/2025/11/28/louvre-to-hike-ticket-prices-for-non-eu-visitors-by-45-next-year')
add('leicht','Was kostet die Schweizer Autobahnvignette (in Franken)?','40 Franken','https://www.bazg.admin.ch/de/schweizer-autobahnvignette-gebuehr-zwei-arten')
VZ='https://www.verbraucherzentrale.de/wissen/umwelt-haushalt/abfall/mehrweg-oder-einweg-wichtige-unterschiede-beim-pfand-11504'
add('leicht','Wie viel Pfand gibt es auf eine Einwegflasche oder Getränkedose?','0,25 €',VZ)
add('mittel','Wie viel Pfand gibt es auf eine Mehrweg-Bierflasche aus Glas?','0,08 €',VZ)
add('schwer','Was kostete die günstigste Maß Bier auf dem Oktoberfest 2024?','13,60 €',W)
add('schwer','Was kostete die teuerste Maß Bier auf dem Oktoberfest 2024?','15,30 €',W)
for k,txt,lv in [('Altes Schloss Schleißheim','ins Alte Schloss Schleißheim','schwer'),('Schloss Veitshöchheim','ins Schloss Veitshöchheim','schwer'),('Willibaldsburg Eichstätt','in die Willibaldsburg in Eichstätt','schwer'),('Burg Lauenstein','in die Burg Lauenstein','schwer')]:
    add(lv,f"Was kostet 2026 der reguläre Eintritt {txt}?",{'Altes Schloss Schleißheim':'4,00','Schloss Veitshöchheim':'6,00','Willibaldsburg Eichstätt':'6,00','Burg Lauenstein':'5,00'}[k]+' €',SS)
add('schwer','Was kostete 1952 in Westdeutschland ein Kilo Mischbrot im Schnitt?','0,68 DM',H2)
add('schwer','Was kostete 1952 in Westdeutschland ein Liter Vollmilch im Schnitt?','0,38 DM',H2)
add('schwer','Was kostete 1952 in Westdeutschland ein Kilo Schweinekotelett im Schnitt?','4,75 DM',H2)
order={'leicht':0,'mittel':1,'schwer':2}; Q.sort(key=lambda q:order[q[0]])
with open('/mnt/project-files/punktlandung/neue-modi/fragen-preise.txt','w',encoding='utf-8') as f:
    f.write('# Preise raten – Nr;Stufe;Frage;Antwort;Quelle\n')
    for i,q in enumerate(Q,1): f.write(f"{i};"+';'.join(q)+'\n')
print(len(Q),{x:sum(1 for q in Q if q[0]==x) for x in order})
