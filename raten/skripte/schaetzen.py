import sys; sys.path.insert(0,'.')
from load import *
Q=[]
def add(st,frage,antwort,quelle): Q.append((st,frage,antwort,quelle))
# Städte
st={r[0]:(int(r[1]),num(r[2]),s) for r,s in rows('staedte.txt')}
cities={'leicht':['Berlin','Hamburg','München','Köln','Frankfurt am Main'],
 'mittel':['Düsseldorf','Leipzig','Dortmund','Essen','Bremen','Dresden','Hannover','Nürnberg','Duisburg','Bonn','Münster','Karlsruhe','Augsburg','Mainz','Kiel','Freiburg im Breisgau','Aachen'],
 'schwer':['Bielefeld','Wolfsburg','Erlangen','Jena','Fürth','Offenbach am Main','Herne','Ingolstadt','Göttingen','Cottbus']}
for lvl,ns in cities.items():
    for n in ns:
        if n not in st: continue
        e,a,s=st[n]
        add(lvl,f"Wie viele Einwohner hatte {n} am 31.12.2023?",fmt(e),s)
for n,lvl in [('Berlin','mittel'),('Hamburg','mittel'),('München','schwer'),('Köln','schwer'),('Offenbach am Main','schwer')]:
    e,a,s=st[n]; add(lvl,f"Wie groß ist die Stadtfläche von {n} in km²?",fmt(a,2)+' km²',s)
# Länder
la={r[0]:(int(r[1]),int(r[2]),int(r[3])) for r,s in rows('laender.txt')}
UBA='https://www.umweltbundesamt.de/system/files/medien/384/bilder/dateien/4_Tab_Flaeche-Bevoelkerung_2026-08-06.pdf'
DST='https://www.destatis.de/EN/Themes/Economic-Sectors-Enterprises/Agriculture-Forestry-Fisheries/Land-Use/Tables/areas-laender.html'
for n,lvl in [('Nordrhein-Westfalen','leicht'),('Bayern','leicht'),('Baden-Württemberg','mittel'),('Niedersachsen','mittel'),('Hessen','mittel'),('Sachsen','mittel'),('Saarland','mittel'),('Bremen','schwer'),('Thüringen','schwer'),('Mecklenburg-Vorpommern','schwer'),('Schleswig-Holstein','schwer'),('Rheinland-Pfalz','schwer')]:
    add(lvl,f"Wie viele Einwohner hatte {n} am 31.12.2025?",fmt(la[n][0]),UBA)
for n,lvl in [('Bayern','mittel'),('Niedersachsen','mittel'),('Saarland','mittel'),('Bremen','schwer'),('Brandenburg','schwer'),('Deutschland','leicht')]:
    add(lvl,f"Wie groß ist {n} in km²?",fmt(la[n][2])+' km²',DST)
add('schwer','Wie viele Einwohner leben in Berlin durchschnittlich auf einem km² (Stand 31.12.2025)?',fmt(la['Berlin'][1]),UBA)
add('schwer','Wie viele Einwohner leben in Mecklenburg-Vorpommern durchschnittlich auf einem km² (Stand 31.12.2025)?',fmt(la['Mecklenburg-Vorpommern'][1]),UBA)
add('mittel','Wie viele Einwohner leben in Deutschland durchschnittlich auf einem km² (Stand 31.12.2025)?',fmt(la['Deutschland'][1]),UBA)
# Österreich
at={r[0]:(int(r[1]),r[2]) for r,s in rows('oesterreich.txt')}
SA='https://www.statistik.at/fileadmin/announcement/2026/02/20260209Bevoelkerung1.1.2026.pdf'
for n,lvl in [('Österreich','leicht'),('Wien','leicht'),('Tirol','mittel'),('Steiermark','mittel'),('Salzburg','schwer'),('Burgenland','schwer'),('Vorarlberg','schwer')]:
    w='in Österreich' if n=='Österreich' else f'im Bundesland {n}' if n!='Wien' else 'in Wien'
    add(lvl,f"Wie viele Menschen lebten am 1.1.2026 {w}?",fmt(at[n][0])+' (vorläufig)',SA)
add('mittel','Wie viel Prozent der Menschen in Wien hatten am 1.1.2026 keine österreichische Staatsbürgerschaft?',at['Wien'][1]+' %',SA)
add('schwer','Wie viel Prozent der Menschen in Österreich hatten am 1.1.2026 keine österreichische Staatsbürgerschaft?',at['Österreich'][1]+' %',SA)
# USDA
U='https://esmis.nal.usda.gov/sites/default/release-files/r207tp32d/k930dv029/6w9267982/lsan0425.txt'
lb=lambda x: f"{fmt(x)} Pfund ≈ {fmt(x*0.45359)} kg"
add('mittel','Wie schwer war ein in den USA 2024 geschlachtetes Rind im Durchschnitt (Lebendgewicht, in kg)?',lb(1399),U)
add('mittel','Wie schwer war ein in den USA 2024 geschlachtetes Schwein im Durchschnitt (Lebendgewicht, in kg)?',lb(288),U)
add('schwer','Wie schwer war ein in den USA 2024 geschlachtetes Schaf oder Lamm im Durchschnitt (Lebendgewicht, in kg)?',lb(119),U)
add('schwer','Wie schwer war ein in den USA 2024 geschlachtetes Kalb im Durchschnitt (Lebendgewicht, in kg)?',lb(323),U)
add('schwer','Wie viel wog das Fleisch (Schlachtgewicht) eines in den USA 2024 geschlachteten Bullen im Schnitt (in kg)?',lb(899),U)
add('mittel','Wie viele Rinder wurden 2024 in den USA gewerblich geschlachtet?','31,8 Millionen',U)
add('mittel','Wie viele Schweine wurden 2024 in den USA gewerblich geschlachtet?','130 Millionen',U)
# Kirchtürme / Berge
K='https://en.wikipedia.org/wiki/List_of_tallest_churches'
for n,v,lvl in [('Ulmer Münster','161,5','leicht'),('Kölner Dom','157,2','leicht'),('Stephansdom in Wien','136,4','mittel'),('Petersdom in Rom','136,6','mittel'),('Freiburger Münster','116,0','mittel'),('Hamburger Michel (St. Michaelis)','132,0','mittel'),('Münchner Frauenkirche','98,6','mittel'),('Berliner Dom','98,0','schwer'),('Regensburger Dom','105,0','schwer'),('Sagrada Família in Barcelona','172,5','mittel'),('Straßburger Münster','142,0','schwer'),('Frankfurter Kaiserdom','95,1','schwer')]:
    add(lvl,f"Wie hoch ist der höchste Turm des {n}?".replace('des Stephansdom','des Stephansdoms').replace('des Petersdom','des Petersdoms').replace('des Kölner Dom','des Kölner Doms').replace('des Berliner Dom','des Berliner Doms').replace('des Regensburger Dom','des Regensburger Doms').replace('des Frankfurter Kaiserdom','des Frankfurter Kaiserdoms').replace('des Hamburger Michel','des Hamburger Michels').replace('des Münchner Frauenkirche','der Münchner Frauenkirche').replace('des Sagrada','der Sagrada'),v+' m',K)
B='https://en.wikipedia.org/wiki/List_of_mountains_in_Germany'
add('leicht','Wie hoch ist die Zugspitze?','2.962 m',B)
add('mittel','Wie hoch ist die Mittelspitze des Watzmann?','2.713 m',B)
add('schwer','Wie hoch ist der Hochkalter in den Berchtesgadener Alpen?','2.607 m',B)
# Flüsse Bayern
F='https://www.lfu.bayern.de/wasser/gewaesserverzeichnisse/doc/tab_gew_name_100_abc.pdf'
for n,v,lvl in [('Isar','270,53','mittel'),('Main','407,52','mittel'),('Donau','380,84','mittel'),('Inn','218,76','schwer'),('Altmühl','196,19','schwer'),('Lech','166,46','schwer'),('Pegnitz','113,46','schwer'),('Salzach','59,57','schwer')]:
    add(lvl,f"Wie viele Kilometer fließt die {n} durch Bayern?".replace('fließt die Main','fließt der Main').replace('fließt die Inn','fließt der Inn').replace('fließt die Lech','fließt der Lech'),v+' km',F)
# Sonstiges
add('leicht','Wie viele Menschen lebten am 31.12.2024 in Deutschland?','83.577.140','https://www.destatis.de/EN/Themes/Society-Environment/Population/Current-Population/Tables/census-sex-and-citizenship-2024-basis-2022.html')
add('mittel','Wie viele Kinder wurden 2025 in Deutschland lebend geboren?','654.241','https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Geburten/Tabellen/lebendgeborene-insgesamt.html')
W='https://www.muenchen.de/veranstaltungen/oktoberfest/aktuell/wiesn-bilanz-2025-zahlen-und-fakten'
add('leicht','Wie viele Besucher kamen 2025 auf das Münchner Oktoberfest?','6,5 Millionen',W)
add('mittel','Wie viele Maß Bier wurden auf dem Oktoberfest 2024 ausgeschenkt?','7 Millionen',W)
add('mittel','Wie viele Passagiere zählte der Frankfurter Flughafen 2024?','rund 61,6 Millionen','https://www.fraport.com/en/newsroom/press-releases/2025/traffic-figures/fraport-traffic-figures-2024--frankfurt-remains-the-leading-airp.html')
add('mittel','Wie viele Stufen führen im Kölner Dom hinauf zur Aussichtsplattform?','533','https://www.cologne-tourism.com/see-experience/cologne-cathedral/tower-ascent')
add('schwer','Wie viele Stufen hat die Treppe im Berliner Fernsehturm?','986','https://en.wikipedia.org/wiki/Berlin_TV_Tower')
add('leicht','Wie hoch ist der Berliner Fernsehturm?','368 m','https://www.visitberlin.de/de/berliner-fernsehturm')
add('leicht','Wie hoch ist der Eiffelturm (seit 2022)?','330 m','https://www.toureiffel.paris/en/news/history-and-culture/300-330-meters-story-towers-height')
add('mittel','In welcher Höhe liegt das Restaurant im Berliner Fernsehturm?','207 m','https://www.visitberlin.de/de/berliner-fernsehturm')
add('leicht','Wie hoch ist das Burj Khalifa in Dubai?','828 m','https://en.wikipedia.org/wiki/Pinnacle_height')
order={'leicht':0,'mittel':1,'schwer':2}
Q.sort(key=lambda q:order[q[0]])
with open('/mnt/project-files/punktlandung/neue-modi/fragen-schaetzen.txt','w',encoding='utf-8') as f:
    f.write('# Zahlen schätzen – Nr;Stufe;Frage;Antwort;Quelle\n')
    for i,q in enumerate(Q,1): f.write(f"{i};"+';'.join(q)+'\n')
print(len(Q), {k:sum(1 for q in Q if q[0]==k) for k in order})
