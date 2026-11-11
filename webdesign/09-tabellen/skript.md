# Modul 9: Tabellen, strukturierte Inhalte und Datenpräsentation

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webdesign: HTML, CSS und responsives Design“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Codebeispiele unverändert, Boxen als Zitatblöcke). Die Codebeispiele in diesem Kapitel wurden hier nicht ausgeführt oder geprüft. Die Übungen mit Musterlösungen und der lauffähige Stand des Projekts stehen im [README dieses Moduls](README.md).

> **Geplante Dauer:** 9 h \| **Priorität:** 2 \| **Lerneinheiten:** 8

## Lerneinheiten laut Lehrplan

| **Lerneinheit**        | **Dauer (h)** | **Prio** |
|:-----------------------|--------------:|---------:|
| Table-Grundstruktur    |             1 |        2 |
| thead tbody tfoot      |             1 |        2 |
| caption                |           1,5 |        2 |
| scope und headers      |             1 |        2 |
| Komplexe Tabellen      |             1 |        2 |
| Tabellen-Accessibility |           1,5 |        3 |
| Daten vs. Layout       |             1 |        3 |
| Tabellen-Review        |             1 |        3 |
| **Summe**              |         **9** |          |

## Überblick

Tabellen sind für *tabellarische Daten* gedacht (Werte, die in Zeilen und Spalten zusammenhängen), nicht für Seitenlayout. Richtig aufgebaut sind sie für Screenreader navigierbar, bleiben wartbar und lassen sich responsiv darstellen.

## Table-Grundstruktur, thead, tbody, tfoot, caption

```html
<table>
  <caption>Quartalsumsätze 2025 in Euro</caption>
  <thead>
    <tr><th scope="col">Quartal</th><th scope="col">Umsatz</th><th scope="col">Veränderung</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">Q1</th><td>120.000</td><td>+4 %</td></tr>
    <tr><th scope="row">Q2</th><td>135.000</td><td>+12 %</td></tr>
  </tbody>
  <tfoot>
    <tr><th scope="row">Summe</th><td>255.000</td><td></td></tr>
  </tfoot>
</table>
```

| **Element**               | **Funktion**                                                                     |
|:--------------------------|:---------------------------------------------------------------------------------|
| `<table>`                   | Tabelle; `<tr>` Zeile; `<th>` Kopfzelle; `<td>` Datenzelle                    |
| `<caption>`                   | Titel der Tabelle, *erstes* Kind von `table`; wird von Screenreadern angekündigt |
| `<thead>`, `<tbody>`, `<tfoot>` | Kopf, Körper, Fuß: bessere Struktur, wiederholter Kopf beim Drucken              |
| `<colgroup>`/`<col>`          | Spaltengruppen (z. B. für Formatierung ganzer Spalten)                           |

## scope und headers, Tabellen-Accessibility

- `scope="col"` / `scope="row"` verbindet Kopfzellen mit ihren Datenzellen. Ein Screenreader liest dann „Q2, Umsatz: 135.000“.

- `scope="colgroup"`/`"rowgroup"` bei gruppierten Überschriften.

- Bei **komplexen Tabellen** (mehrstufige Köpfe, verbundene Zellen) `id` auf den `th` und `headers="id1 id2"` auf den `td`.

- Zellen verbinden mit `colspan`/`rowspan` *sparsam*: Sie erschweren die Navigation. Besser: komplexe Tabelle in mehrere einfache aufteilen.

- Leere Zellen vermeiden oder erklären (z. B. „–“ mit Erläuterung).

- Kein Tabellenmarkup für Layout, keine „Layout-Tabellen“ mit `th`.

```html
<table>
  <caption>Öffnungszeiten</caption>
  <thead>
    <tr><td></td><th id="vm" scope="col">Vormittag</th><th id="nm" scope="col">Nachmittag</th></tr>
  </thead>
  <tbody>
    <tr><th id="mo" scope="row">Montag</th><td headers="mo vm">8--12 Uhr</td><td headers="mo nm">14--18 Uhr</td></tr>
  </tbody>
</table>
```

## Komplexe Tabellen und Responsives Verhalten

Breite Tabellen passen nicht auf schmale Displays. Lösungsmuster:

```css
/* 1. Horizontal scrollbar in Wrapper (Tabelle bleibt Tabelle) */
.tabelle-wrap { overflow-x: auto; }
.tabelle-wrap:focus-visible { outline: 3px solid #1a73e8; }

table { border-collapse: collapse; width: 100%; }
th, td { padding: .5rem .75rem; border: 1px solid #ccc; text-align: start; }
tbody tr:nth-child(even) { background: #f5f5f5; }
caption { text-align: start; font-weight: 700; padding-block: .5rem; }
td.zahl { text-align: end; font-variant-numeric: tabular-nums; }
```

```html
<div class="tabelle-wrap" role="region" aria-labelledby="t1-titel" tabindex="0">
  <table>...</table>
</div>
```

> **Ergänzung aus der Nachrecherche: Responsive Tabellen als „Karten“**
>
> Eine zweite Option für schmale Viewports ist die Umwandlung der Zeilen in gestapelte Blöcke (`display: block` auf `tr`/`td`, Spaltenüberschrift per `td::before { content: attr(data-label) }`). Achtung: `display: block/grid/flex` auf Tabellenelementen entfernt in manchen Browsern/Screenreadern die Tabellensemantik. Dann `role="table"`, `role="row"`, `role="cell"` ergänzen oder beim Scroll-Wrapper bleiben. Zahlen rechtsbündig mit `font-variant-numeric: tabular-nums` ausrichten.

## Daten vs. Layout, Tabellen-Review

**Daten vs. Layout:** Frage: „Gibt es Beziehungen zwischen Zeilen und Spalten?“ Ja → Tabelle. Nein (nur Anordnung) → Flexbox oder Grid. Beispiele: Preisvergleich, Stundenplan, Messwerte = Tabelle; Navigationsleiste, Formularausrichtung, Kartenraster = CSS-Layout.

**Tabellen-Review (Checkliste):**

1.  Handelt es sich um echte Daten?

2.  `caption` vorhanden und aussagekräftig?

3.  Kopfzellen als `th` mit `scope` (oder `headers`)?

4.  `thead`/`tbody`/`tfoot` verwendet?

5.  Keine unnötig verbundenen oder leeren Zellen?

6.  Auf Mobilgeräten benutzbar (Scroll-Wrapper)?

7.  Kontrast und Zeilenabstand ausreichend, Zahlen ausgerichtet?

8.  Validator ohne Fehler, Screenreader-Kurztest?

## Übungen

1.  Baue eine Tabelle „Tarife“ (Basic, Pro, Premium) mit Preis und drei Merkmalen, mit `caption`, `scope` und Zeilenköpfen.

2.  Wann verwendest du `headers` statt `scope`?

3.  Wie machst du eine breite Tabelle mobil nutzbar, ohne Semantik zu verlieren?

4.  Warum sind Layout-Tabellen heute ein Fehler? Nenne zwei Gründe.

## Lösungen

1.  Muster: `<caption>Tarife</caption>`, Kopfzeile `th scope="col"` (Merkmal, Basic, Pro, Premium), je Zeile `th scope="row"` (Preis, Speicher, Support, …).

2.  Bei komplexen Tabellen mit mehrstufigen oder unregelmäßigen Köpfen, wo `scope` die Zuordnung nicht eindeutig ausdrücken kann.

3.  Scroll-Wrapper (`overflow-x: auto`, fokussierbar mit `tabindex="0"` und Label) oder wichtige Spalten priorisieren; bei Karten-Umbau Rollen ergänzen.

4.  Sie vermischen Struktur und Darstellung, sind schwer responsiv und für Screenreader irreführend (Daten-Tabelle erwartet), außerdem unflexibel und schlecht wartbar.
