# Portfolio: Stand nach Modul 17

Neu: `css/main.css` wird aus Quelldateien in `css/src/` gebaut (ITCSS-Ordner, Ebenen `vendor`, `reset`, `tokens`, `base`, `objects`, `components`, `utilities`). BEM-Namen vereinheitlicht, Muster `stack` und `cluster`, Styleguide erweitert, Stylelint-Konfiguration, Pixelvergleich-Skript, Experimente `css-statistik`, `layers`, `scope`. Nur Platzhalterinhalte.

## Ansehen

`index.html` im Browser öffnen. Die Experimente brauchen einen Webserver (`npm run serve`, dann `http://localhost:8080/`).

## Struktur

```
modul-17/
  css/src/               Quelldateien (00-layers, 01-reset, 02-tokens, 03-base, 04-objects, 05-components/, 06 bis 09)
  css/main.css           GENERIERT, nicht von Hand ändern
  docs/                  css-konventionen.md, refactoring-plan.md, css-audit.md (zum Ausfüllen)
  experimente/           css-statistik, schlechtes.css, layers, scope
  tools/                 css-bauen.js, pixelvergleich.py (optional), server.js, budget-check.js
```

## Befehle

```
npm run css           css/main.css aus css/src/ bauen
npm run css:pruefen   prüfen, ob css/main.css aktuell ist
npm test              Tests (Logik und CSS-Regeln)
npm run budget        Größenbudget prüfen
npm run serve         Testserver auf Port 8080
```
