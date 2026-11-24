# Punktlandung

Rätsel-Partyspiel für Handy und Tablet: Erst das Wortspiel lösen, dann den Ort auf der Karte antippen. Wer im Kreis landet, punktet.

- **Ein Handy für alle:** `index.html` öffnen, Spieler eintragen, Handy reihum weitergeben.
- **Partymodus:** Auf dem Tablet „Partymodus“ wählen. Mitspieler scannen den QR-Code und setzen ihren Punkt auf dem eigenen Handy. Verbindung direkt zwischen den Geräten (WebRTC über PeerJS).

- **Kategorien:** Karte (Ortsrätsel), Raten (Größer oder kleiner, Zahlen schätzen, Kalorien, Preise; jede Antwort mit Quelle) oder Gemischt. Raten: bis 5 % daneben = 1 Treffer, bis 20 % = ½. Gleichstand: Karte nach km, Raten nach Ø Abweichung, Gemischt per Schätz-Stechfrage.

`src/` enthält den Generator: `raetsel.mjs` (Fragenkatalog), `build3.mjs` (Karten und Koordinaten), `template.html` + `party.js` (Spiel), `raten.py` (Ratefragen aus den `fragen-*.txt` nach `raten.json`), `build.py` (baut `index.html`).
