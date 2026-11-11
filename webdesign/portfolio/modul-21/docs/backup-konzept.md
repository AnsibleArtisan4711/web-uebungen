# Backup-Konzept (Beispiel)

Werkzeuge: [`tools/backup.js`](../tools/backup.js) und [`tools/restore-pruefen.js`](../tools/restore-pruefen.js). Die Seite ist statisch; **der Quelltext liegt in Git** und ist damit schon eine Sicherung. Gesichert werden zusätzlich das gebaute Ergebnis (`dist`) und alles, was nicht in Git liegt (Formular-Empfänger, Hosting-Einstellungen: im Beispiel keine).

## Kennzahlen festlegen

| Begriff | Frage | Beispielwert (Platzhalter, zu entscheiden) |
|---|---|---|
| RPO (Recovery Point Objective) | Wie viel Datenverlust ist höchstens tragbar? | bis zum letzten Commit; Inhalte ändern sich selten, also 24 h |
| RTO (Recovery Time Objective) | Wie lange darf die Seite höchstens fehlen? | 4 Stunden |

RPO bestimmt die **Häufigkeit** der Sicherung, RTO die **Technik** der Wiederherstellung (und ob eine Notfallseite nötig ist). Beide kosten Geld: Je kleiner, desto teurer.

## 3-2-1-Regel

3 Kopien der Daten, auf 2 verschiedenen Medien, davon 1 an einem anderen Ort. Erweiterung 3-2-1-1-0: zusätzlich 1 Kopie offline oder unveränderlich (schützt gegen Verschlüsselungstrojaner und versehentliches Löschen) und 0 Fehler bei der Wiederherstellungsprüfung.

| Kopie | Ort | Medium |
|---|---|---|
| 1 | Arbeitsrechner (Git-Arbeitskopie) | Festplatte |
| 2 | GitHub (Repository) | Cloud |
| 3 | verschlüsseltes Archiv `backups/*.sbk` auf externem Datenträger, getrennt aufbewahrt | USB-Platte, offline |

Die Zuordnung ist ein **Vorschlag**; welche Orte tatsächlich genutzt werden, entscheidet die verantwortliche Person (siehe Betriebshandbuch).

## Ablauf

```text
npm run build
set BACKUP_PASSPHRASE=…          (Windows: Eingabeaufforderung; PowerShell: $env:BACKUP_PASSPHRASE = "…")
npm run backup                   → backups/sicherung-<Datum>.sbk und .sbk.sha256
npm run restore:pruefen -- backups/<Datei>.sbk wiederhergestellt dist
```

- Die Passphrase steht **nicht** im Repository und nicht im Archivnamen; sie wird getrennt vom Archiv aufbewahrt (Passwortmanager). Ohne Passphrase ist das Archiv wertlos.
- `backups/` steht in `.gitignore`.
- Verschlüsselung: AES-256-GCM, Schlüssel per scrypt aus der Passphrase; GCM erkennt Veränderungen.

## Wiederherstellung testen

Ein Backup, das nie zurückgespielt wurde, ist nur eine Hoffnung. Test mindestens vierteljährlich und nach jeder Änderung am Verfahren: `restore:pruefen` mit Vergleich gegen `dist`. Messergebnis (siehe Übung 21.6): 46 Dateien, rund 0,05 s auf dem Testrechner. Das ist **nur der Dateivorgang**; das RTO besteht aus Entscheidung, Zugriff auf Passphrase, Hosting, DNS und Prüfung und liegt um Größenordnungen höher.

## Datenschutz

Archive können personenbezogene Daten enthalten (z. B. Formularnachrichten, falls vorhanden). Deshalb verschlüsseln, Aufbewahrungsdauer festlegen, Löschung prüfen.
