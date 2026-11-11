# Performance-Budget

Ein Budget ist eine Grenze, die du vorher festlegst. Wird sie überschritten, wird repariert (oder bewusst angehoben), nicht ignoriert.

## Zielwerte (Labor, Lighthouse „Mobile“, simuliert)

| Messgröße | Ziel | Messwert Stand Modul 16 | Eingehalten? |
|---|---|---|---|
| LCP (Largest Contentful Paint) | ≤ 2,5 s | | |
| CLS (Cumulative Layout Shift) | ≤ 0,1 | | |
| TBT (Total Blocking Time, Ersatz für INP im Labor) | ≤ 200 ms | | |
| Performance-Score | ≥ 90 | | |

## Größenbudget (prüft `node tools/budget-check.js`)

| Dateityp | Grenze | Art |
|---|---|---|
| CSS je Datei | 10 KiB | gzip |
| JavaScript je Datei | 6 KiB | gzip |
| HTML je Seite | 6 KiB | gzip |
| Bild je Datei (außer `og-bild.png`) | 20 KiB | roh |

## Warum diese Werte?

Trage hier in eigenen Worten ein, wie du die Grenzen gewählt hast (Zielgruppe, Verbindung, Seitenart).

## Was passiert bei Überschreitung?

- [ ] Ursache suchen (Bericht oder Netzwerk-Reiter)
- [ ] Beheben oder Budget mit Begründung anpassen
- [ ] Ergebnis im Lighthouse-Bericht notieren

## Hinweis

Labordaten (Lighthouse) sind kein Ersatz für Felddaten echter Besucher (CrUX, Search Console). Für ein Portfolio ohne Besucherzahlen gibt es meist keine Felddaten.
