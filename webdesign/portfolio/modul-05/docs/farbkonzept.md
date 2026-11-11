# Farbkonzept und Kontrastprüfung

Berechnet nach der WCAG-Formel (Kontrastverhältnis aus relativer Luminanz).

## Helles Theme

| Kombination | Verhältnis | Anforderung | Ergebnis |
|---|---|---|---|
| Text `#1a1a1a` auf Hintergrund `#ffffff` | 17,4 : 1 | 4,5 : 1 | erfüllt |
| Überschrift `#1a3c6e` auf `#ffffff` | 10,96 : 1 | 4,5 : 1 | erfüllt |
| Link `#0b4fb3` auf `#ffffff` | 7,54 : 1 | 4,5 : 1 | erfüllt |
| Link `#0b4fb3` auf Fläche `#f5f8fc` | 7,08 : 1 | 4,5 : 1 | erfüllt |
| Hover `#7a1f1f` auf `#ffffff` | 10,28 : 1 | 4,5 : 1 | erfüllt |
| Button: Weiß auf `#1a3c6e` | 10,96 : 1 | 4,5 : 1 | erfüllt |
| Fokusrahmen `#1a73e8` auf `#ffffff` | 4,51 : 1 | 3 : 1 | erfüllt |
| Rahmen für Eingabefelder `#5f7391` auf `#ffffff` | 4,83 : 1 | 3 : 1 | erfüllt |

## Dunkles Theme

| Kombination | Verhältnis | Anforderung | Ergebnis |
|---|---|---|---|
| Text `#eeeeee` auf `#121212` | 16,15 : 1 | 4,5 : 1 | erfüllt |
| Überschrift/Link `#8fb4ee` auf `#121212` | 8,86 : 1 | 4,5 : 1 | erfüllt |
| Link `#8fb4ee` auf Fläche `#1b2433` | 7,37 : 1 | 4,5 : 1 | erfüllt |
| Hover `#f2a0a0` auf `#121212` | 9,2 : 1 | 4,5 : 1 | erfüllt |
| Button: `#121212` auf `#8fb4ee` | 8,86 : 1 | 4,5 : 1 | erfüllt |
| Rahmen für Eingabefelder `#8da2c4` auf `#121212` | 7,22 : 1 | 3 : 1 | erfüllt |

## Hinweise

- Der Rahmen der Karten (`--color-border`) ist reine Dekoration und braucht kein 3 : 1. Rahmen von **Bedienelementen** (Modul 06) nutzen `--color-border-strong`.
- Information wird nie nur über Farbe vermittelt: Der aktuelle Menüpunkt ist zusätzlich fett.
