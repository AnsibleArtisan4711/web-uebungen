# ADR 0001: Statische Seite ohne Framework und ohne CMS

- Status: angenommen (Kursannahme)
- Datum: 2026-11-07
- Beteiligte: Autor des Portfolios

## Kontext

Das Portfolio hat eine pflegende Person, ändert sich selten, hat keine Benutzerkonten und keinen Shop. Das Kontaktformular braucht eine serverseitige Annahme. Wartungsaufwand, Kosten und Angriffsfläche sollen klein sein (siehe `docs/hosting-entscheidung.md`).

## Entscheidung

Das Portfolio besteht aus handgeschriebenen HTML-Seiten, einem aus Quelldateien gebauten Stylesheet und wenig JavaScript. Es gibt kein Framework und kein CMS. Ein kleiner Build erzeugt den Ordner `dist/`.

## Alternativen

- Klassisches CMS (z. B. WordPress): bequeme Redaktion, aber Server, Datenbank und laufende Updates.
- Static-Site-Generator: sinnvoll bei vielen gleichartigen Seiten; hier nur 11 Seiten (nicht ausprobiert, siehe Übung 19.4).
- Baukasten: schnell, aber geringe Kontrolle über Header und Markup.

## Konsequenzen

- Wenig Angriffsfläche, kleine Seiten, einfache Auslieferung.
- Keine Oberfläche für Redakteure; Inhalte ändert man im Quelltext.
- Gleiche Kopfzeile und Fußzeile auf jeder Seite müssen von Hand synchron gehalten werden.
- Die Formularannahme braucht eine Lösung außerhalb der statischen Dateien (Platzhalter: `tools/server.js`).
