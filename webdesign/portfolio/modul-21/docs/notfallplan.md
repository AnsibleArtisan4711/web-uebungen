# Notfallplan (Runbook, Vorlage)

Gilt für Ausfall der Seite, defekte Veröffentlichung, Datenverlust und Sicherheitsvorfall. Kontaktdaten und Ablageorte der Zugänge stehen im [Betriebshandbuch](betriebshandbuch.md), **nicht hier und nicht im Repository**.

## Stufen

| Stufe | Beispiel | Erste Maßnahme |
|---|---|---|
| 1 Störung | Seite langsam, einzelne Seite defekt | Fehler eingrenzen, Änderung zurücknehmen |
| 2 Ausfall | Seite nicht erreichbar | Notfallseite aktivieren, Hoster prüfen |
| 3 Datenverlust / Manipulation | Inhalte verändert oder gelöscht | Zugänge sperren, aus Backup wiederherstellen |
| 4 Sicherheitsvorfall mit personenbezogenen Daten | Zugriff Unbefugter auf Formulardaten | Meldefrist beachten (siehe unten) |

## Notfallseite

[`wartung.html`](../wartung.html) ist eine statische Seite ohne Skripte. Sie wird mit **Status 503 und `Retry-After`** ausgeliefert, damit Suchmaschinen die Seite nicht als gelöscht ansehen (ein 200 oder 404 für „wir sind gleich zurück“ würde Rankings gefährden). Test: `WARTUNG=1 node tools/server.js 8080` (jede Adresse antwortet 503 mit `Retry-After: 3600` und `Cache-Control: no-store`; automatisiert in `tests/server-modus.test.js`).
Wie die Notfallseite beim echten Hoster aktiviert wird, ist **hoster-abhängig und hier nicht getestet**. Bei Anbietern ohne eigene Header- und Statuskonfiguration (vermutlich auch GitHub Pages, siehe die Header-Frage in `hosting-entscheidung.md`; nicht geprüft) geht ein 503 womöglich gar nicht, dann bleibt nur eine Notfallseite mit Status 200 und `noindex` als Kompromiss.

## Ablauf bei Ausfall (Stufe 2)

1. Prüfen: Ist die Seite für alle weg oder nur für mich? (anderes Netz, Statusseite des Hosters)
2. Letzte Änderung zurücknehmen (`git revert`, neu veröffentlichen) und Wirkung prüfen.
3. Hoster/Domain/DNS prüfen (Ablaufdatum der Domain, Zertifikat).
4. Wenn nach 30 Minuten nicht behoben: Notfallseite aktivieren, Nutzer informieren.
5. Wiederherstellung aus dem Backup (siehe [Backup-Konzept](backup-konzept.md)), danach Prüfung mit den Schritten der [Release-Checkliste](release-checkliste.md).
6. Nachbesprechung: Ursache, Dauer, was ändert sich? (Postmortem ohne Schuldzuweisung)

## Meldepflicht bei Datenpannen

Nach Art. 33 DSGVO muss eine Verletzung des Schutzes personenbezogener Daten in der Regel **innerhalb von 72 Stunden** nach Bekanntwerden der zuständigen Aufsichtsbehörde gemeldet werden, sofern ein Risiko für die Betroffenen besteht. Das ist eine Information aus dem Lehrplan, keine Rechtsberatung; im Zweifel Datenschutzbeauftragte oder Anwalt fragen.

## Übungen

- Notfall-Probe halbjährlich: Notfallseite starten, Backup zurückspielen, Zeit messen.
- Kontaktliste und Zugänge prüfen: Sind sie auffindbar, wenn die Hauptperson nicht erreichbar ist?
