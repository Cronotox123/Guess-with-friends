import sys,re; sys.path.insert(0,'.')
from load import *
kc={r[0]:(float(r[1].split('/')[0]),r[3]) for r,s in rows('kcal.txt')}
Q=[]
def por(st,name,g,label,ml=False):
    v,u=kc[name]; k=round(v*g/100)
    unit='ml' if ml else 'g'
    Q.append((st,f"Wie viele kcal hat {label} ({g} {unit})?",f"ca. {k} kcal (gerechnet aus {fmt(v)} kcal pro 100 {unit})",u))
def per100(st,name,label,ml=False):
    v,u=kc[name]; unit='ml' if ml else 'g'
    Q.append((st,f"Wie viele kcal haben 100 {unit} {label}?",f"{fmt(v)} kcal",u))
L=[('leicht','Apfel',125,'ein mittelgroßer Apfel'),('mittel','Birne',205,'eine große Birne'),('mittel','Clementine',70,'eine Clementine'),
('schwer','Weintrauben',5,'eine einzelne Weintraube'),('mittel','Wassermelone',80,'eine Scheibe Wassermelone'),('schwer','Ananas',665,'eine ganze Ananas (ohne Schale)'),
('mittel','Mango',335,'eine ganze Mango'),('mittel','Karotte',80,'eine Karotte'),('schwer','Gurke',325,'eine ganze Salatgurke'),('mittel','Tomate',95,'eine Tomate'),
('mittel','Pommes (TK)',135,'eine Portion Tiefkühl-Pommes'),('mittel','Kartoffelpüree',200,'eine Portion Kartoffelpüree'),
('leicht','Vollmilchschokolade',100,'eine Tafel Vollmilchschokolade'),('mittel','Zartbitter 70 %',100,'eine Tafel Zartbitterschokolade (70 %)'),
('schwer','Marshmallow',7,'ein Marshmallow'),('mittel','Vanilleeis',95,'eine Portion Vanilleeis'),('mittel','Honig',22,'ein Esslöffel Honig'),
('mittel','Zucker',5,'ein Teelöffel Zucker'),('schwer','Zucker',2,'ein Würfelzucker'),
('mittel','Gouda',20,'Gouda für eine Brotscheibe'),('mittel','Salami',7,'eine Scheibe Salami'),('mittel','Wiener Würstchen',65,'ein Wiener Würstchen'),
('mittel','Brie',30,'eine Portion Brie'),('mittel','Frischkäse',15,'Frischkäse für eine Brotscheibe'),('schwer','Hähnchenbrust roh',195,'eine Portion Hähnchenbrust (roh)'),
('leicht','Tiefkühlpizza',300,'eine Tiefkühlpizza-Portion'),('mittel','Weizenbrötchen',85,'ein Weizenbrötchen'),('mittel','Hamburgerbrötchen',80,'ein Hamburgerbrötchen'),
('mittel','Ei gekocht',56,'ein gekochtes Ei'),('mittel','Croissant',80,'ein großes Croissant'),('mittel','Berliner',65,'ein Berliner'),('mittel','Donut',45,'ein Donut'),
('schwer','Muffin',30,'ein kleiner Muffin'),('mittel','Zimtschnecke',65,'eine Zimtschnecke'),('schwer','Plunder mit Marmelade',80,'ein großes Marmeladen-Plunderteilchen'),
('mittel','Walnüsse',20,'eine Handvoll Walnüsse'),('mittel','Mandeln',20,'eine Handvoll Mandeln'),('mittel','Haselnüsse',20,'eine Handvoll Haselnüsse'),
('schwer','Erdnüsse geröstet gesalzen',60,'ein Deziliter (Schälchen) geröstete Erdnüsse'),('schwer','Cashews gesalzen',60,'ein Deziliter (Schälchen) gesalzene Cashews'),
('mittel','Avocado',220,'eine große Avocado'),('schwer','Avocado',130,'eine kleine Avocado'),('mittel','Erdbeeren',60,'ein Deziliter Erdbeeren'),('schwer','Kirschen',60,'ein Deziliter Kirschen'),
('schwer','Kiwi',15,'eine Scheibe Kiwi'),('schwer','Orange',35,'eine Orangenspalte'),('schwer','Brokkoli',25,'ein Brokkoliröschen')]
for st,n,g,l in L: por(st,n,g,l)
D=[('leicht','Cola mit Zucker',330,'eine Dose Cola'),('mittel','Orangensaft',200,'ein Glas Orangensaft'),('mittel','Apfelsaft',200,'ein Glas Apfelsaft'),
('leicht','Pils 4,7 %',500,'ein großes Glas Pils'),('mittel','Pils 4,7 %',330,'eine Dose Pils'),('mittel','Weißwein trocken',100,'ein Glas trockener Weißwein'),('mittel','Sekt',100,'ein Glas Sekt'),
('mittel','Kakao (Instant zubereitet)',240,'eine Tasse Kakao (Instant)'),('mittel','Energydrink',250,'eine Dose Energydrink'),('mittel','Smoothie Heidelbeer-Apfel',200,'ein Glas Smoothie (Heidelbeer-Apfel)'),
('mittel','Caffè Latte Vollmilch',300,'eine große Tasse Caffè Latte mit Vollmilch')]
for st,n,g,l in D: por(st,n,g,l,True)
for st,n,l in [('mittel','Rotwein trocken','trockener Rotwein'),('schwer','Zuckermais roh','roher Zuckermais'),('mittel','Frühkartoffeln gekocht','gekochte Frühkartoffeln'),('mittel','Dürüm Kebab','Dürüm Kebab'),('mittel','Fruchtgummi-Pastillen','Fruchtgummi-Pastillen'),('schwer','Zartbitter 85 %','Zartbitterschokolade (85 %)'),('leicht','Banane','Banane')]:
    if n=='Banane': Q.append((st,'Wie viele kcal haben 100 g Banane?','89 kcal','https://files.givewell.org/files/DWDA%202009/Interventions/Salt_Substitution/US_Department_of_Agriculture_FoodData_Central_Nutrition_information_for_raw_banana_accessed_December_18_2020.pdf')); continue
    per100(st,n,l,ml=n.startswith('Rotwein'))
B=[('leicht','Wie viele kcal hat ein Big Mac (McDonald’s USA)?','580 kcal','https://www.mcdonalds.com/us/en-us/product/big-mac.html'),
('leicht','Wie viele kcal hat ein Whopper (270 g)?','670 kcal','https://en.wikipedia.org/wiki/Whopper'),
('mittel','Wie viele kcal hat eine Dose Red Bull (250 ml)?','ca. 115 kcal (gerechnet aus 46 kcal pro 100 ml)','https://world.openfoodfacts.org/product/90376542/red-bull-energy-drink'),
('mittel','Wie viele kcal hat eine Portion Nutella (15 g)?','ca. 81 kcal (gerechnet aus 539 kcal pro 100 g)','https://world.openfoodfacts.org/product/4008400402222'),
('mittel','Wie viele kcal haben 100 g Haribo Goldbären?','343 kcal','https://world.openfoodfacts.org/product/4001686301326'),
('mittel','Wie viele kcal hat eine 300-g-Tüte Haribo Goldbären?','ca. 1.029 kcal (gerechnet aus 343 kcal pro 100 g)','https://world.openfoodfacts.org/product/4001686301326'),
('mittel','Wie viele kcal hat eine 1,5-Liter-Flasche Coca-Cola?','ca. 630 kcal (gerechnet aus 42 kcal pro 100 ml)','https://www.coca-cola.com/ch/de/brands/coca-cola')]

for st,n,g,l in [('leicht','Lasagne',300,'eine Portion Lasagne'),('mittel','Taco',230,'ein Taco mit Hackfleisch und Gemüse'),('mittel','Camembert',30,'eine Portion Camembert'),
('mittel','Naturjoghurt Vollmilch',100,'ein Deziliter Naturjoghurt'),('schwer','Sprühsahne',25,'ein Deziliter Sprühsahne'),('mittel','Omelett',125,'eine Portion Omelett'),
('mittel','Vollkornbrot',45,'eine Scheibe Vollkornbrot'),('mittel','Weißbrot',40,'eine Scheibe Weißbrot'),('mittel','Pfannkuchen',65,'ein Pfannkuchen'),
('mittel','Waffel',85,'eine große Waffel'),('mittel','Cornflakes',35,'eine Portion Cornflakes (ohne Milch)'),('mittel','Schokoladenkuchen',80,'ein Stück Schokoladenkuchen'),
('schwer','Pistazien',50,'ein Deziliter Pistazien')]: por(st,n,g,l)
por('leicht','Vollmilch',200,'ein Glas Vollmilch',True)
for st,n,l in [('mittel','Bacon gebraten','gebratener Bacon'),('mittel','Spiegelei','Spiegelei'),('schwer','Hotdog-Brötchen','Hotdog-Brötchen'),('mittel','Früchtemüsli','Früchtemüsli'),
('schwer','Haferbrei mit Wasser','Haferbrei (mit Wasser gekocht)'),('mittel','Käsekuchen','Käsekuchen'),('schwer','Sprühsahne','Sprühsahne'),('mittel','Pommes (TK)','Tiefkühl-Pommes')]: per100(st,n,l)

por('mittel','Croissant',45,'ein kleines Croissant'); por('schwer','Waffel',20,'eine kleine Waffel'); por('schwer','Gouda',10,'eine dünne Scheibe Gouda')
por('mittel','Hähnchenbrust roh',100,'ein Stück rohe Hähnchenbrust'); per100('mittel','Salami','Salami'); per100('mittel','Walnüsse','Walnüsse')
Q+=B
order={'leicht':0,'mittel':1,'schwer':2}; Q.sort(key=lambda q:order[q[0]])
with open('/mnt/project-files/punktlandung/neue-modi/fragen-kalorien.txt','w',encoding='utf-8') as f:
    f.write('# Kalorien raten – Nr;Stufe;Frage;Antwort;Quelle\n')
    for i,q in enumerate(Q,1): f.write(f"{i};"+';'.join(q)+'\n')
print(len(Q),{x:sum(1 for q in Q if q[0]==x) for x in order})
