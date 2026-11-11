# Governance der Frontend-Basis (Beispiel)

Regeln, die nicht geprüft werden, werden mit der Zeit nicht eingehalten. Deshalb steht neben jeder Regel, **wie** sie geprüft wird.

## Zuständigkeiten (RACI)

R = führt aus, A = verantwortet (genau eine Person), C = wird gefragt, I = wird informiert. Rollen statt Namen.

| Aufgabe | Entwicklung | Gestaltung | Inhalt | Betrieb |
|---|---|---|---|---|
| Design-Tokens ändern | R | A | I | I |
| Neue Komponente | R | C | I | I |
| Inhalte pflegen | I | I | A/R | I |
| Abhängigkeiten aktualisieren | R | I | I | A |
| Backup und Wiederherstellung testen | C | I | I | A/R |
| Browser-Support-Policy ändern | C | C | I | A |

Regel: **Jede Aufgabe hat genau ein „A“.** In einer Einzelperson-Seite sind alle Rollen dieselbe Person; die Tabelle zeigt dann, welche Hüte man trägt, und macht die Bus-Faktor-Frage sichtbar (siehe Betriebshandbuch).

## Änderungsprozess

1. Änderungswunsch als Ticket mit Begründung.
2. Entscheidung der verantwortlichen Rolle (ADR bei Architekturfragen, siehe [`adr/`](adr/)).
3. Umsetzung im Branch, Pull Request nach [Review-Checkliste](review-checkliste.md).
4. Automatische Prüfungen (CI), Freigabe, Release nach [Release-Checkliste](release-checkliste.md).
5. Eintrag in `CHANGELOG.md`.

## Regeln und ihre Prüfung

Umgesetzt in [`tests/governance.test.js`](../tests/governance.test.js) (läuft mit `npm test`):

| Nr | Regel | Prüfung |
|---|---|---|
| 1 | Farbwerte stehen nur in `02-tokens.css` | Test sucht `#hex`, `rgb()`, `hsl()` außerhalb |
| 2 | `z-index` nur über Token `var(--z-…)` | Test |
| 3 | `!important` nur in Reset und reduzierter Bewegung | Test mit Ausnahmeliste |
| 4 | keine ID-Selektoren im CSS | Test |
| 5 | Mobile first: keine `max-width`-Medienabfragen | Test; **dokumentierte Ausnahme** `filter.css` (Platzhalterhöhe gegen Layoutsprünge) |

Die Regeln wurden **vor** dem Schreiben des Tests am bestehenden Code gemessen: 0 Farbwerte außerhalb der Tokens, 0 rohe `z-index`-Werte, 1 `max-width`-Medienabfrage (Ausnahme). Regel 5 war beim ersten Lauf rot; statt den Code umzubauen, wurde die Ausnahme mit Begründung festgehalten. Eine Ausnahme ohne Begründung ist ein Fehler im Prozess.

Nicht automatisierbar (bleibt Review): sinnvolle Namen, Alt-Texte, verständliche Texte.

## Veraltete Teile (Deprecation)

1. Als „veraltet“ markieren (Kommentar im CSS und Eintrag im `CHANGELOG.md`), Ersatz nennen.
2. Übergangszeit festlegen (z. B. zwei Releases).
3. Nutzung messen: `npm run namen` zeigt ungenutzte Klassen als Hinweis.
4. Entfernen, Eintrag im CHANGELOG.

## Browser-Unterstützung

Siehe [browser-support-policy.md](browser-support-policy.md).

## Bus-Faktor

Wie viele Personen dürfen ausfallen, bevor niemand mehr die Seite pflegen kann? Hier: eine Person, also Bus-Faktor 1. Gegenmaßnahmen: dieses Dokumentationsset, Betriebshandbuch mit Ablageort der Zugänge (keine Passwörter im Repository), automatisierte Prüfungen, Wiederherstellungstest.
