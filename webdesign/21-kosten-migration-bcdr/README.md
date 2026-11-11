# Modul 21: Kosten, Migration, Governance und BCDR

Etappe im Portfolio: Betrieb und Projekt: Kosten, Relaunch mit Umleitungen, Migration, Governance, Sicherheits- und Kompatibilitätsrisiken, Backup und Notfallplanung am Portfolio.

Lehrplan: 20 Stunden, Priorität 3. Pro Unterkapitel gibt es eine Übung.

Das zugehörige Kapitel des Skripts: [skript.md](skript.md) (aus LaTeX umgewandelt).

## Übungen

| Nr | Übung | Lehrplan | Zeit |
|---|---|---|---|
| 21.1 | [Projektkosten kalkulieren](21.1-projektkosten.md) | 21.2 | 60 Min |
| 21.2 | [Relaunch-Planung und Roadmap](21.2-relaunch-planung-und-roadmap.md) | 21.3 | 90 Min |
| 21.3 | [Migration von Inhalten, Markup und Styles](21.3-migration.md) | 21.4 | 90 Min |
| 21.4 | [Governance und Wartungsregeln](21.4-governance.md) | 21.5 | 75 Min |
| 21.5 | [CSS-Sicherheit, Third-Party CSS und Browser-Kompatibilität](21.5-css-sicherheit-third-party-und-browser-kompatibilitaet.md) | 21.6 | 105 Min |
| 21.6 | [Backup, Restore und Notfallplanung (BCDR)](21.6-backup-restore-und-notfallplanung.md) | 21.7 | 105 Min |

Die Nummern der Übungen zählen nur die Inhalts-Unterkapitel (der Lehrplan-Abschnitt „Überblick“ hat keine Übung).

## Fertiger Stand

[`../portfolio/modul-21/`](../portfolio/modul-21/)

## Etappen-Abnahme

Das Modul ist abgeschlossen, wenn Folgendes zutrifft:

- [ ] `npm run kosten -- docs/kosten/firmenwebsite.json` ergibt 170,2 h und 15.318,00 €
- [ ] `npm run redirects` meldet 0 Probleme und die Fehlertabelle meldet 11
- [ ] `npm run legacy` findet in `legacy.*` Hinweise und in `migriert.*` keine
- [ ] `npm test` besteht (Kosten, Governance, Backup, Server-Modi und die Tests aus Modul 20)
- [ ] `npm run backup` und `npm run restore:pruefen` laufen mit Passphrase ohne Fehler; falsche Passphrase und verändertes Archiv werden erkannt
- [ ] `npm run css:browser`, `npm run lint`, `npm run validate:html`, `npm run namen` und `npm run doku` laufen ohne Fehler
- [ ] Du kannst begründen, welche Browser, Hoster und Betriebsfragen du nicht getestet hast

Weiter mit dem Abschluss des Portfolios: README und Betriebshandbuch mit echten Entscheidungen füllen, Lizenz wählen, dann auf GitHub veröffentlichen (siehe Hauptordner-README).
