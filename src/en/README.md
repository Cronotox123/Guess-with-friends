# Englische Version (Guess with Friends)

Gebaut nach `en/index.html` (live unter `/en/`). Jede Sprache = eigenes Land + internationale Fragen.

1. `node src/en/parse_en.mjs` – Rätsel aus `src/en/raetsel/r_*.txt` → `src/en/raetsel.mjs`
2. `RAETSEL=./en/raetsel.mjs NE=<natural-earth-geojson>/ ZIELE=en/ziele.txt ZIELE_OUT=en/ziele_geo.json node shapes.mjs` (in `src/`) – Flächen (Staaten, Länder, Flüsse)
3. `KARTEN=us RAETSEL=./en/raetsel.mjs ZIELE_GEO=en/ziele_geo.json DATA_OUT=en/data.json ZUORD_OUT=en/zuordnung.json node build3.mjs` (in `src/`) – Karten USA/Europa/Welt
4. `python3 src/en/raten_en.py` – Ratefragen aus `src/en/raten/` → `src/en/raten.json`
5. `python3 src/en/build_en.py` – übersetzt Spieltexte (Liste `T`), Meilen statt km, eigener Speicher, baut `en/index.html`

Benötigt npm: us-atlas, world-atlas, topojson-client, topojson-server, d3-geo, all-the-cities.
