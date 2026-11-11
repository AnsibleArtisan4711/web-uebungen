# Formularkonzept: Kontaktformular

| Feld | Control | Pflicht | Besonderheiten |
|---|---|---|---|
| Name | `input type="text"` | ja | `autocomplete="name"` |
| E-Mail-Adresse | `input type="email"` | ja | `autocomplete="email"`, Hinweis mit Formatbeispiel |
| Betreff | `select` mit Leer-Option | ja | feste Auswahl |
| Ich schreibe als | `fieldset` mit drei Radios | nein | Gruppenfrage in `legend` |
| Nachricht | `textarea` | ja | 10 bis 1000 Zeichen |
| Datenschutz | `input type="checkbox"` | ja | Label klickbar |

## Regeln

- Jedes Control hat ein sichtbares `label` (`for` und `id`); Platzhalter ersetzen kein Label
- Eine Spalte, Label über dem Feld, Klickflächen mindestens 44 px hoch
- Pflichtfelder sind der Normalfall, optionale Felder tragen den Zusatz „optional“
- Fehlerzustand (`:user-invalid`) erst nach Interaktion, mit dickerem Rahmen (nicht nur Farbe)
- Der Fokus wird nie vom haftenden Kopf verdeckt (`scroll-padding-top`)
- Nach dem Absenden folgt eine Bestätigungsseite (`kontakt/danke/`)
- Die Clientprüfung dient der Bedienung. Ein Server muss jede Eingabe erneut prüfen (Modul 18)
