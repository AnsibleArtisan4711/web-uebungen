# ADR 0002: Content Security Policy per Header und zusätzlich per meta-Element

- Status: angenommen (Kursannahme)
- Datum: 2026-11-07
- Beteiligte: Autor des Portfolios

## Kontext

Die Seiten sollen Skripte und Stile nur aus der eigenen Herkunft laden (Modul 18). Ob der spätere Hoster eigene Antwort-Header erlaubt, ist offen. GitHub Pages unterstützt laut einer Diskussion der GitHub-Community (Antworten von GitHub-Mitarbeitern 2023 und 2024) keine eigenen Header.

## Entscheidung

Die Richtlinie steht in jeder Seite als `<meta http-equiv="Content-Security-Policy">`. Der Testserver sendet dieselbe Richtlinie zusätzlich als Header. Das eine Inline-Skript ist per Hash erlaubt, `style-src` und `script-src` kommen ohne `'unsafe-inline'` aus.

## Alternativen

- Nur Header: stärker (`frame-ancestors` wirkt), setzt aber einen Hoster mit Header-Kontrolle voraus.
- Keine CSP: einfacher, aber ohne zweite Verteidigungslinie gegen XSS.

## Konsequenzen

- Per `<meta>` wirken `frame-ancestors` und `report-uri` nicht; `Permissions-Policy` und HSTS sind so nicht setzbar. Diese Lücken stehen in `docs/security-review.md` bzw. in Übung 19.4 als offen.
- Ändert sich das Inline-Skript, muss der Hash in allen Seiten neu eingetragen werden. `npm test` und die CSP-Probe fallen auf, wenn er nicht mehr passt.
