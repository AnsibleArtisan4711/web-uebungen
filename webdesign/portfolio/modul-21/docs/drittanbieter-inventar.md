# Inventar externer Ressourcen (Third-Party CSS und Skripte)

Werkzeug: [`tools/drittanbieter-check.js`](../tools/drittanbieter-check.js) (`npm run drittanbieter`).

**Gemessener Ist-Zustand dieser Seite:** 39 geprüfte HTML- und CSS-Dateien, 0 externe Ressourcen. Alles wird von der eigenen Domain geladen (Schriften, Bilder, Skripte, Stile). Deshalb ist auch die Content Security Policy so streng (`default-src 'self'`).

## Wenn doch ein Drittanbieter nötig wird

| Frage | Entscheidung / Maßnahme |
|---|---|
| Brauche ich ihn wirklich? | Eigene 20 Zeilen CSS sind sicherer als eine Bibliothek mit 200 KB. |
| Selbst hosten statt CDN? | Ja, wenn möglich: keine Verbindung zu Fremdservern (Datenschutz, Ausfall, IP-Weitergabe). |
| Version festlegen | feste Version in der Adresse oder im `package-lock.json`, nie `latest`. |
| Integrität prüfen | Subresource Integrity: `integrity="sha384-…" crossorigin="anonymous"`. Der Browser lehnt die Datei ab, wenn der Hash nicht passt. |
| Wirkung begrenzen | Fremdes CSS in eine eigene Schicht: `@layer vendor { … }`; die Ebene `vendor` steht in `00-layers.css` ganz vorn, spätere Ebenen (Komponenten, Utilities) gewinnen also immer gegen sie. |
| CSP anpassen | genau diese Quelle ergänzen (`style-src 'self' https://cdn.example.net`), nicht `*`. |
| Dokumentieren | Eintrag in der Tabelle unten. |

## Inventar (Vorlage, aktuell leer)

| Ressource | Zweck | Version | Hash geprüft | Hosting | Verantwortlich | Prüfdatum |
|---|---|---|---|---|---|---|
| – | – | – | – | – | – | – |

## Übungsmaterial

[`docs/drittanbieter/beispiel-extern.html`](drittanbieter/beispiel-extern.html) und `.css` enthalten absichtlich gemischte Fälle (mit und ohne SRI, `@latest`, `@import`, Hintergrundbild von fremdem Server). Alle Adressen sind erfundene Beispieldomains (`*.example.net`, `*.example.org`). Der Check meldet dort 7 externe Ressourcen, 6 davon mit Befund.
