# Portfolio: Stand nach Modul 12

Neu: Menü-Button für kleine Bildschirme, Projektfilter, Blog-Suche, Formular-Fehlerliste, FAQ mit `<details>`, dritte Projektkarte und zwei Blog-Entwürfe. Nur Platzhalterinhalte.

## Ansehen

`index.html` im Browser öffnen. Die Experimente `modul.html` und `fetch.html` brauchen einen lokalen Server:

```
cd modul-12
python3 -m http.server 8000      # Windows: py -m http.server 8000
```

Dann `http://localhost:8000/experimente/fetch.html` öffnen. Tests: `npm test` (Node ab 20).

## Struktur

```
modul-12/
  index.html, lebenslauf/, projekte/, blog/, kontakt/, styleguide/
  css/main.css          Menü, Chips, Suche, Fehlermeldungen
  js/logik.js           reine Logik (testbar)
  js/main.js            DOM-Code (Menü, Filter, Suche, Formular)
  data/beitraege.json   Beispieldaten für fetch
  tests/logik.test.js
  docs/js-review.md
  experimente/          modul, fetch, web-component
```
