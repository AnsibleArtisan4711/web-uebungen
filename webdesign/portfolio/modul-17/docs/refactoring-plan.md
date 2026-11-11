# Refactoring-Plan

Ziel: das CSS umbauen, **ohne** dass sich das Aussehen ändert. Jede Etappe wird einzeln geprüft und eingecheckt.

## 1. Bestandsaufnahme

Werte vor dem Umbau (aus `experimente/css-statistik.html`):

| Messgröße | Vorher |
|---|---|
| Regeln | |
| Selektoren | |
| ID-Selektoren | |
| `!important` | |
| Höchste Spezifität | |
| Längste Selektorkette | |

Auffälligkeiten (doppelte Selektoren, wirkungslose Regeln, Wiederholungen):

-

## 2. Etappen

| Nr. | Schritt | Prüfung | Erledigt |
|---|---|---|---|
| 1 | Tokens vollständig? Feste Werte durch Tokens ersetzen | Screenshots vorher/nachher | |
| 2 | Namen auf BEM umstellen | Screenshots, Skripte laufen | |
| 3 | Spezifität senken, `!important` abbauen | Stylelint ohne Fehler | |
| 4 | In Ebenen ordnen (`@layer`) | Screenshots | |
| 5 | In Dateien zerlegen, Build-Skript | `node tools/css-bauen.js --pruefen` | |

## 3. Sicherung

Wie stellst du fest, dass sich nichts verändert hat? Beschreibe dein Vorgehen (Screenshots von Hand? Skript?).

## 4. Nachher

| Messgröße | Nachher |
|---|---|
| Regeln | |
| Selektoren | |
| `!important` | |
| Höchste Spezifität | |
| Größe von `main.css` | |

## 5. Offen

-
