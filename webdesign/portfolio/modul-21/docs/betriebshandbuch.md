# Betriebshandbuch (Vorlage)

Platzhalter ausfüllen. **Keine Passwörter, Schlüssel oder privaten Telefonnummern in dieses Dokument**, solange das Repository öffentlich ist. Verweise stattdessen darauf, wo sie sicher liegen (z. B. Passwortmanager).

## Überblick

| Punkt | Eintrag |
|---|---|
| Zweck der Seite | persönliches Portfolio (Platzhalterinhalte) |
| Adresse (Produktion) | `<https://…>` |
| Hoster | `<noch offen, siehe docs/hosting-entscheidung.md>` |
| Domain-Registrar | `<…>` |
| Verantwortliche Person | `<Rolle>` |

## Zugänge

| System | Wer hat Zugang | Wo liegen die Zugangsdaten | Zwei-Faktor |
|---|---|---|---|
| Git-Hoster (Repository) | `<Rolle>` | `<Passwortmanager>` | `<ja/nein>` |
| Hoster / Server | `<Rolle>` | `<Passwortmanager>` | `<ja/nein>` |
| Domain | `<Rolle>` | `<Passwortmanager>` | `<ja/nein>` |

## Backups

| Was | Wie oft | Wohin | Wiederherstellung zuletzt geübt |
|---|---|---|---|
| Quelltext | bei jedem Push (Git) | `<Remote und eine weitere Kopie>` | `<Datum>` |
| Formularnachrichten (falls gespeichert) | `<…>` | `<…>` | `<Datum>` |
| Gebautes Ergebnis (`dist`) als verschlüsseltes Archiv | `<RPO festlegen>` | `<externer Datenträger>` | `<Datum>` |

Verfahren, Kennzahlen (RPO/RTO) und 3-2-1-Regel: [`backup-konzept.md`](backup-konzept.md). Ablauf bei Ausfall und Meldepflicht: [`notfallplan.md`](notfallplan.md).

## Veröffentlichen und zurücknehmen

Siehe [`release-checkliste.md`](release-checkliste.md) (Checkliste und Rollback-Plan).

## Notfallkontakte

| Anlass | Rolle | Erreichbar über |
|---|---|---|
| Seite nicht erreichbar | Technik | `<Kontaktweg>` |
| Zertifikat oder Domain läuft ab | Inhaber | `<Kontaktweg>` |
| Sicherheitsvorfall / Datenpanne | Inhaber, Datenschutz | `<Kontaktweg>` (Meldepflichten prüfen lassen) |

## Wiederkehrende Aufgaben

Siehe [`wartungsplan.md`](wartungsplan.md).
