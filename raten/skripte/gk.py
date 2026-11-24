import sys; sys.path.insert(0,'.')
from load import *
Q=[]
def lvl(a,b):
    r=max(a,b)/min(a,b)
    return 'leicht' if r>=1.25 else 'mittel' if r>=1.08 else 'schwer'
def pair(A,va,B,vb,tmpl,unit,src,dec=0,up='Mehr',down='Weniger'):
    if abs(va-vb)/max(va,vb)<0.02:
        print('SKIP',A,B); return
    ans=(up if vb>va else down)+f": {fmt(vb,dec)}{unit}"
    Q.append((lvl(va,vb),tmpl.format(A=A,va=fmt(va,dec)+unit,B=B),ans,src))
st={r[0]:(int(r[1]),num(r[2]),s) for r,s in rows('staedte.txt')}
S=st['Berlin'][2]
for a,b in [('Hamburg','München'),('Köln','Frankfurt am Main'),('Düsseldorf','Dortmund'),('Leipzig','Essen'),('Bremen','Hannover'),('Dresden','Nürnberg'),('Duisburg','Bochum'),('Bielefeld','Münster'),('Bonn','Karlsruhe'),('Mannheim','Augsburg'),('Aachen','Mainz'),('Kiel','Freiburg im Breisgau'),('Chemnitz','Halle (Saale)'),('Magdeburg','Erfurt'),('Lübeck','Oberhausen'),('Kassel','Hagen'),('Heidelberg','Paderborn'),('Darmstadt','Oldenburg'),('Ingolstadt','Fürth'),('Jena','Erlangen'),('Gelsenkirchen','Krefeld'),('Koblenz','Cottbus'),('Bottrop','Bremerhaven')]:
    pair(a,st[a][0],b,st[b][0],"{A} hatte Ende 2023 {va} Einwohner. Hatte {B} mehr oder weniger?",'',S)
for a,b in [('Köln','München'),('Berlin','Hamburg'),('Dresden','Leipzig'),('Bremen','Dortmund'),('Münster','Bremen')]:
    pair(a,st[a][1],b,st[b][1],"{A} ist {va} groß. Ist {B} größer oder kleiner?",' km²',S,2,'Größer','Kleiner')
la={r[0]:(int(r[1]),int(r[2]),int(r[3])) for r,s in rows('laender.txt')}
UBA='https://www.umweltbundesamt.de/system/files/medien/384/bilder/dateien/4_Tab_Flaeche-Bevoelkerung_2026-08-06.pdf'
DST='https://www.destatis.de/EN/Themes/Economic-Sectors-Enterprises/Agriculture-Forestry-Fisheries/Land-Use/Tables/areas-laender.html'
for a,b in [('Sachsen','Rheinland-Pfalz'),('Thüringen','Brandenburg'),('Brandenburg','Schleswig-Holstein'),('Bayern','Baden-Württemberg'),('Hamburg','Mecklenburg-Vorpommern'),('Berlin','Sachsen')]:
    pair(a,la[a][0],b,la[b][0],"In {A} lebten Ende 2025 {va} Menschen. Lebten in {B} mehr oder weniger?",'',UBA)
for a,b in [('Sachsen-Anhalt','Hessen'),('Mecklenburg-Vorpommern','Brandenburg'),('Rheinland-Pfalz','Sachsen'),('Thüringen','Schleswig-Holstein'),('Nordrhein-Westfalen','Baden-Württemberg')]:
    pair(a,la[a][2],b,la[b][2],"{A} ist {va} groß. Ist {B} größer oder kleiner?",' km²',DST,0,'Größer','Kleiner')
at={r[0]:int(r[1]) for r,s in rows('oesterreich.txt')}
SA='https://www.statistik.at/fileadmin/announcement/2026/02/20260209Bevoelkerung1.1.2026.pdf'
for a,b in [('Kärnten','Tirol'),('Oberösterreich','Niederösterreich'),('Tirol','Steiermark'),('Vorarlberg','Burgenland')]:
    pre=lambda n:{'Steiermark':'in der Steiermark','Burgenland':'im Burgenland'}.get(n,'in '+n)
    pair(pre(a).capitalize()[0]+pre(a)[1:],at[a],pre(b),at[b],"{A} lebten am 1.1.2026 {va} Menschen. Lebten {B} mehr oder weniger?",'',SA)
pair('Wien',at['Wien'],'Hamburg',1869473,"In Wien lebten am 1.1.2026 {va} Menschen. Lebten in Hamburg Ende 2025 mehr oder weniger?",'',SA+' und '+UBA)
K='https://en.wikipedia.org/wiki/List_of_tallest_churches'
kh={r[0]:num(r[1]) for r,s in rows('kirchen_berge.txt') if num(r[1]) and num(r[1])<200}
KD={'Kölner Dom':'der Kölner Dom','Ulmer Münster':'das Ulmer Münster','Stephansdom Wien':'der Wiener Stephansdom','Straßburger Münster':'das Straßburger Münster','Hamburg St. Michaelis':'der Hamburger Michel','Lübeck St. Marien':'die Lübecker Marienkirche','Freiburger Münster':'das Freiburger Münster','Regensburger Dom':'der Regensburger Dom','Münchner Frauenkirche':'die Münchner Frauenkirche','Schweriner Dom':'der Schweriner Dom','Magdeburger Dom':'der Magdeburger Dom','Berliner Dom':'der Berliner Dom','Landshut St. Martin':'St. Martin in Landshut','Petersdom Rom':'der Petersdom in Rom','Frankfurter Kaiserdom':'der Frankfurter Kaiserdom','Gedächtniskirche Speyer':'die Gedächtniskirche in Speyer','Sagrada Família Barcelona':'die Sagrada Família in Barcelona','Neuer Dom Linz':'der Neue Dom in Linz','Hamburg St. Jacobi':'St. Jacobi in Hamburg'}
for a,b in [('Kölner Dom','Ulmer Münster'),('Stephansdom Wien','Straßburger Münster'),('Hamburg St. Michaelis','Lübeck St. Marien'),('Freiburger Münster','Regensburger Dom'),('Münchner Frauenkirche','Schweriner Dom'),('Magdeburger Dom','Berliner Dom'),('Landshut St. Martin','Petersdom Rom'),('Frankfurter Kaiserdom','Gedächtniskirche Speyer'),('Ulmer Münster','Sagrada Família Barcelona'),('Neuer Dom Linz','Hamburg St. Jacobi')]:
    pair(KD[a][0].upper()+KD[a][1:],kh[a],KD[b],kh[b],"{A} ist {va} hoch. Ist {B} höher oder niedriger?",' m',K,1,'Höher','Niedriger')
B59=rows('berge_1959.txt')[0][1]; bg={r[0]:int(r[1]) for r,s in rows('berge_1959.txt')}
BD={'Hohe Acht':'die Hohe Acht','Hornisgrinde':'die Hornisgrinde','Kahler Asten':'der Kahle Asten','Großer Feldberg (Taunus)':'der Große Feldberg im Taunus','Großer Inselsberg':'der Große Inselsberg','Großer Beerberg':'der Große Beerberg','Großer Arber':'der Große Arber','Feldberg (Schwarzwald)':'der Feldberg im Schwarzwald','Schneeberg (Fichtelgebirge)':'der Schneeberg im Fichtelgebirge','Helgoland (Insel)':'die höchste Stelle Helgolands','Bastei':'die Bastei'}
bd=lambda n: BD.get(n,'der '+n)
for a,b in [('Feldberg (Schwarzwald)','Großer Arber'),('Brocken','Fichtelberg'),('Wasserkuppe','Großer Feldberg (Taunus)'),('Kahler Asten','Erbeskopf'),('Brocken','Wurmberg'),('Ochsenkopf','Schneeberg (Fichtelgebirge)'),('Großer Inselsberg','Großer Beerberg'),('Hohe Acht','Hesselberg'),('Wendelstein','Herzogstand'),('Watzmann','Hochvogel'),('Drachenfels','Kyffhäuser'),('Wilseder Berg','Helgoland (Insel)'),('Hornisgrinde','Schauinsland')]:
    A=bd(a); A=A[0].upper()+A[1:]
    if a=='Wasserkuppe': A='Die Wasserkuppe'
    pair(A,bg[a],bd(b),bg[b],"{A} ist {va} hoch. Ist {B} höher oder niedriger?",' m',B59,0,'Höher','Niedriger')
F='https://www.lfu.bayern.de/wasser/gewaesserverzeichnisse/doc/tab_gew_name_100_abc.pdf'
fl={r[0]:num(r[1]) for r,s in rows('fluesse_bayern.txt')}
art={'Main':'der','Inn':'der','Lech':'der','Regen':'der'}
for a,b in [('Main','Donau'),('Isar','Inn'),('Lech','Altmühl'),('Iller','Paar'),('Pegnitz','Regen'),('Loisach','Amper'),('Naab','Vils'),('Ammer','Würm'),('Salzach','Mangfall'),('Wörnitz','Fränkische Saale')]:
    pair(a,fl[a],b,fl[b],"{aa} {A} fließt {va} durch Bayern. Ist {bb} {B} in Bayern länger oder kürzer?".replace('{aa}',art.get(a,'die').capitalize()).replace('{bb}',art.get(b,'die')),' km',F,2,'Länger','Kürzer')
kc={r[0]:(r[1],r[3]) for r,s in rows('kcal.txt')}
def k(n): return float(kc[n][0].split('/')[0])
for a,b in [('Banane' if 'Banane' in kc else 'Apfel','Birne'),('Erdbeeren','Wassermelone'),('Gouda','Brie'),('Salami','Gouda'),('Vollmilchschokolade','Zartbitter 70 %'),('Erdnüsse geröstet gesalzen','Mandeln'),('Haselnüsse','Cashews gesalzen'),('Pommes (TK)','Kartoffelpüree'),('Croissant','Donut'),('Weintrauben','Mango'),('Honig','Marshmallow'),('Tiefkühlpizza','Wiener Würstchen')]:
    pair(a,k(a),b,k(b),"100 g {A} haben {va}. Haben 100 g {B} mehr oder weniger?",' kcal',kc[a][1]+' und '+kc[b][1])
for a,b in [('Sekt','Weißwein trocken'),('Pils 4,7 %','Orangensaft'),('Cola mit Zucker','Caffè Latte Vollmilch')]:
    pair(a,k(a),b,k(b),"100 ml {A} haben {va}. Haben 100 ml {B} mehr oder weniger?",' kcal',kc[a][1]+' und '+kc[b][1])
sc={r[0]:num(r[1]) for r,s in rows('schloesser.txt')}; SS='https://www.schloss.bayern.de/deutsch/service/tourismus/preise2026.pdf'
for a,b in [('Schloss Neuschwanstein','Schloss Linderhof Gesamtkarte'),('Schloss Nymphenburg','Marstallmuseum'),('Kaiserburg Nürnberg','Burg Cadolzburg'),('Herrenchiemsee Gesamtkarte Insel','Schloss Linderhof Einzelkarte'),('Walhalla','Burg Prunn'),('Schloss Dachau','Residenz Kempten')]:
    pair(a,sc[a],b,sc[b],"Eintritt 2026: {A} kostet {va}. Ist {B} teurer oder billiger?",' €',SS,2,'Teurer','Billiger')
Q1='https://digi.bib.uni-mannheim.de/fileadmin/statjahrb/514402342_1952/pdf/514402342_0437.pdf'
hist=[("1950 kostete 1 Liter Vollmilch im Schnitt 0,35 DM. War ein Ei (Klasse B) teurer oder billiger?","Billiger: 0,22 DM"),
("1950 kostete 1 kg Mischbrot im Schnitt 0,50 DM. Waren 5 kg Speisekartoffeln teurer oder billiger?","Teurer: 0,76 DM"),
("1938 kostete 1 kg Butter im Schnitt 3,19 Reichsmark. War 1 kg Butter 1951 teurer oder billiger als 6 DM?","Teurer: 6,12 DM"),
("1951 kostete 1 kg Schweinekotelett im Schnitt 4,64 DM. War 1 kg Rinder-Schmorfleisch teurer oder billiger?","Billiger: 3,93 DM"),
("1950 kostete 1 kg Butter im Schnitt 5,50 DM. War 1 kg Bohnenkaffee mehr oder weniger als fünfmal so teuer?","Mehr: 28,80 DM"),
("1949 kostete 1 kg Tafeläpfel im Schnitt 1,31 DM. Waren sie 1951 teurer oder billiger?","Billiger: 0,83 DM"),
("1938 kostete ein Ei (Klasse B) 12 Pfennig. Kostete es 1951 mehr oder weniger als das Doppelte?","Weniger: 23 Pfennig"),
("1950 kostete ein Glas helles Bier in einer einfachen Gaststätte 0,34 DM. War 1 Liter Vollmilch teurer oder billiger?","Kaum: 0,35 DM, also teurer (1 Pfennig)")]
for qq,aa in hist: Q.append(('mittel',qq,aa,Q1+' und '+Q1.replace('1952/pdf/514402342_0437','1953/pdf/514402342_0542')))
Q[-1]=( 'schwer',)+Q[-1][1:]
Q.append(('mittel',"Der Eiffelturm ist 330 m hoch. Ist der Berliner Fernsehturm höher oder niedriger?","Höher: 368 m","https://www.toureiffel.paris/en/news/history-and-culture/300-330-meters-story-towers-height und https://www.visitberlin.de/de/berliner-fernsehturm"))
Q.append(('mittel',"Zur Plattform des Kölner Doms führen 533 Stufen. Hat die Treppe im Berliner Fernsehturm mehr oder weniger?","Mehr: 986","https://www.cologne-tourism.com/see-experience/cologne-cathedral/tower-ascent und https://en.wikipedia.org/wiki/Berlin_TV_Tower"))
Q.append(('leicht',"1908 kostete ein neuer Ford Model T 850 Dollar. Kostete er im Oktober 1922 mehr oder weniger als 300 Dollar?","Weniger (unter 300 $)","https://www.thehenryford.org/collections/explore/articles/fords-model-t"))
Q.append(('leicht',"Das Mercedes 300 SLR Uhlenhaut-Coupé wurde 2022 für 135 Mio. € versteigert. War Leonardos „Salvator Mundi“ (2017) teurer oder billiger?","Teurer: 450,3 Mio. $","https://rmsothebys.com/media-center/press-releases/rm-sotheby-s-announces-the-sale-of-the-most-valuable-car-in-the-world-the-1955-mercedes-benz-300-slr-uhlenhaut-coup%C3%A9-is-sold-for-135-000-000 und https://news.artnet.com/market/last-known-leonardo-da-vinci-painting-just-sold-1149032"))
order={'leicht':0,'mittel':1,'schwer':2}
Q.sort(key=lambda q:order[q[0]])
with open('/mnt/project-files/punktlandung/neue-modi/fragen-groesser-kleiner.txt','w',encoding='utf-8') as f:
    f.write('# Größer oder kleiner – Nr;Stufe;Frage;Antwort;Quelle\n')
    for i,q in enumerate(Q,1): f.write(f"{i};"+';'.join(q)+'\n')
print(len(Q),{x:sum(1 for q in Q if q[0]==x) for x in order})
