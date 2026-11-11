# Review-Checkliste für Frontend-Änderungen

Vorlage für Pull Requests. Zuerst prüft die Maschine (Spalte „automatisch“), dann der Mensch. Wo die Maschine nichts sieht, bleibt nur der Blick der Reviewerin.

Faustregeln: Pull Requests klein halten (Richtwert aus dem Lehrplan: unter etwa 400 Zeilen), Rückmeldungen konkret und begründet formulieren („Vorschlag: … weil …“), Stilfragen der Maschine überlassen.

## Allgemein

| Frage | automatisch geprüft von |
|---|---|
| Erfüllt die Änderung die Anforderung? Gibt es Nebenwirkungen auf andere Seiten? | niemand: Reviewerin |
| Sind Tests und Dokumentation angepasst (README, Styleguide, Changelog)? | `npm run doku` prüft nur, ob Pflichtteile vorhanden sind |
| Gibt es Screenshots für mobil und Desktop im Pull Request? | niemand |

## HTML

| Frage | automatisch geprüft von |
|---|---|
| Valide (keine doppelten IDs, richtig geschachtelt)? | `npm run validate:html`, `npm run validate:w3c` |
| Bilder mit sinnvollem `alt`, Formularfelder mit `label`? | beide Validatoren (nur das Vorhandensein, nicht ob der Text sinnvoll ist) |
| Überschriftenebenen und Landmarken sinnvoll, Fokus sichtbar und erreichbar? | niemand: Reviewerin (axe findet einen Teil) |
| Keine Inline-Styles und Inline-Event-Handler (CSP)? | `npm run validate:html`, `npm run security` |

## CSS

| Frage | automatisch geprüft von |
|---|---|
| Tokens statt „Magic Numbers“ (`13px`, `#c0392b`)? | niemand: Reviewerin |
| Niedrige Spezifität, keine ID-Selektoren, kein neues `!important`? | `npm run lint:css` |
| Klassennamen im BEM-Muster, Namen nach Bedeutung statt Aussehen? | `npm run namen` (Muster), Bedeutung: Reviewerin |
| Mobile First (`min-width`), passende Breakpoints? | niemand: Reviewerin |
| Fokus-Stile nicht entfernt (`outline: none`), Kontrast ausreichend? | niemand: Reviewerin (axe prüft Kontrast) |
| Formatierung einheitlich? | `npm run format:pruefen` |
| `css/main.css` neu gebaut? | `npm run css:pruefen` |

## JavaScript

| Frage | automatisch geprüft von |
|---|---|
| Kein `innerHTML` mit Fremddaten, kein `eval`? | `npm run security`, `npm run lint:js` |
| Fehlerbehandlung vorhanden, kein unnötiger Code? | `npm run lint:js` (nur ungenutzte Variablen), sonst Reviewerin |

## Leistung und Abhängigkeiten

| Frage | automatisch geprüft von |
|---|---|
| Bildgrößen und Dateigrößen im Budget? | `npm run budget -- dist` |
| Neue Abhängigkeit nötig? Lizenz, Pflege, Größe? | niemand: Reviewerin |
| Layoutverschiebungen? | niemand (Seiten manuell ansehen, Visuelle Tests: `npm run e2e`) |
