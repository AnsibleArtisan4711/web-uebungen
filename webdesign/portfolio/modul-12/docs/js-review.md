# JavaScript-Review (Modul 12)

Gehe jede Zeile durch und trage Ja/Nein und Notizen ein.

| Prüfpunkt | Ja/Nein | Notiz |
|---|---|---|
| Alle Seiten funktionieren mit ausgeschaltetem JavaScript (Navigation sichtbar, Formular sendbar, alle Projekte und Beiträge sichtbar) | | |
| Skripte sind mit `defer` eingebunden, keines blockiert den Parser | | |
| Menü-Button ist ein `<button>` mit `aria-expanded` und `aria-controls` | | |
| Escape schließt das Menü, der Fokus kehrt zum Button zurück | | |
| Filter-Buttons nutzen `aria-pressed`; die Trefferzahl wird per `role="status"` angesagt | | |
| Fehlermeldungen im Formular sind per `aria-describedby` verknüpft, die Fehlerliste erhält den Fokus | | |
| Nutzertexte werden nie mit `innerHTML` eingefügt | | |
| `fetch` prüft `antwort.ok` und zeigt Lade-, Leer- und Fehlerzustand | | |
| Die reine Logik steckt in `js/logik.js` und ist mit `node --test` getestet | | |
| In der Konsole stehen keine Fehler (Chrome, Firefox) | | |

## Gemessen (Chromium, siehe Übungen)

- Laden: ohne Attribut Reihenfolge A, B vor `DOMContentLoaded`; mit `defer` A, B in Quelltextreihenfolge, `document.readyState` ist dann `interactive`; mit `async` kommt `DOMContentLoaded` zuerst und das schnellere Skript B vor dem langsameren A.
- Dieses Review ersetzt keinen Test mit Screenreader und echten Geräten.
