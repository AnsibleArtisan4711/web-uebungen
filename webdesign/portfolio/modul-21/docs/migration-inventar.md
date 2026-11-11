# Migrations-Inventar (Vorlage)

Für jede Inhaltseinheit der alten Seite eine Zeile. Die Entscheidung steht **vor** der Arbeit.

| Alte Adresse | Titel | Typ | Entscheidung | Neue Adresse | Anmerkung |
|---|---|---|---|---|---|
| `/index.php?id=2` | Über mich | Seite | übernehmen und überarbeiten | `/lebenslauf/` | Text aktualisieren |
| `/referenzen/projekt-1.html` | Projekt 1 | Seite | zusammenführen | `/projekte/` | Inhalt in die Projektliste |
| `/downloads/lebenslauf.pdf` | Lebenslauf (PDF) | Datei | entfernen | – (410) | Daten veraltet |
| `/blog/2019/erster-beitrag.html` | Erster Beitrag | Beitrag | übernehmen | `/blog/erster-beitrag/` | Datum behalten |

## Veraltetes Markup erkennen und ersetzen

Werkzeug: [`tools/legacy-check.js`](../tools/legacy-check.js) (`npm run legacy -- docs/migration/legacy.html docs/migration/legacy.css`). Die Beispiele `legacy.*` und `migriert.*` im Ordner [`docs/migration/`](migration/) zeigen Vorher und Nachher.

| Altes Muster | Problem | Heute |
|---|---|---|
| `<font>`, `<center>`, `bgcolor`, `valign` | Optik im HTML, veraltet | CSS (`font-family`, `text-align`, `background`) |
| Tabelle als Seitenlayout | Reihenfolge und Hilfstechnik, nicht responsiv | Flexbox oder Grid; Tabellen nur für Daten |
| `<br><br>`, `<p>&nbsp;</p>` als Abstand | Abstand ist Gestaltung | `margin` / `gap` |
| `float` für Spalten, `clearfix` | Notlösung aus der Zeit vor Flexbox | Flexbox / Grid |
| `style="…"` überall | blockiert strenge CSP, schlecht wartbar | Klassen in der CSS-Datei |
| `-webkit-box-shadow` & Co. von Hand | veraltete Präfixe | Autoprefixer |
| `filter: alpha(opacity=…)`, `*zoom` | Internet Explorer | entfernen |

## CMS-Templates

Bei Umzug auf ein CMS: Jede Vorlage (Template) wird aus einer wiederverwendbaren Komponente der Seite abgeleitet. Das hier gebaute Komponentensystem (Modul 17, Namensregeln Modul 20) bildet das Pflichtenheft: Welche Komponenten gibt es, welche Varianten, welche Pflichtfelder (Alt-Text, Überschrift)? **Nicht umgesetzt:** Es gibt in diesem Projekt kein CMS.
