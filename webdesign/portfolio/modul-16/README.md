# Portfolio: Stand nach Modul 16

Neu: Avatar als `<picture>` (AVIF, WebP, PNG), erstes Projektbild mit hoher Priorität, reservierter Platz für Filter und Suche, Linktext „Startseite“, Testserver mit Kompression und Caching, Budget-Skript, Experimente zu Bildern, Schriften, Preload und Layoutsprüngen. Nur Platzhalterinhalte.

## Ansehen

Für die Experimente einen Webserver starten (`node tools/server.js 8080`, dann `http://localhost:8080/`). Die Seiten selbst laufen auch direkt per Doppelklick.

## Struktur

```
modul-16/
  docs/                  performance-budget.md, lighthouse-bericht.md (zum Ausfüllen)
  experimente/           bilder, fonts-*, preload-*, cls-*  (brauchen den Server)
  tools/                 server.js (Kompression, Cache-Header, ?delay=ms), budget-check.js
```

## Befehle

```
npm test           Tests der Logik (node --test)
npm run budget     Größenbudget prüfen
npm run serve      Testserver auf Port 8080
```
