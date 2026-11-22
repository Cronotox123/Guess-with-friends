# Punktlandung

Rätsel-Partyspiel für Handy und Tablet: Erst das Wortspiel lösen, dann den Ort auf der Karte antippen. Wer im Kreis landet, punktet.

- **Ein Handy für alle:** `index.html` öffnen, Spieler eintragen, Handy reihum weitergeben.
- **Partymodus:** Auf dem Tablet „Partymodus“ wählen. Mitspieler scannen den QR-Code und setzen ihren Punkt auf dem eigenen Handy. Verbindung direkt zwischen den Geräten (WebRTC über PeerJS).

`src/` enthält den Generator: `raetsel.mjs` (Fragenkatalog), `build3.mjs` (Karten und Koordinaten), `template.html` + `party.js` (Spiel), `assemble.py` (baut `index.html`).
