# Heuristische Evaluation (Stand Modul 07 / 08)

Prüfer: eine Person (du selbst). Eine echte heuristische Evaluation hat mehrere unabhängige Prüfer, hier ist es eine **Selbstprüfung** und deshalb nur ein erster Anhaltspunkt.

Methode: Alle Seiten im Browser durchgeklickt, Befunde nach Schweregrad gewichtet (0 = kein Problem, 1 = kosmetisch, 2 = klein, 3 = groß, 4 = Katastrophe).

| Nr | Heuristik | Befund | Schwere | Maßnahme |
|---|---|---|---|---|
| 1 | Systemstatus | Aktuelle Seite ist in der Navigation mit `aria-current="page"` markiert. Das Absenden des Formulars bestätigt die Seite `danke/`. | 0 | — |
| 2 | System und reale Welt | Beschriftungen in einfacher Sprache („Projekte“, „Kontakt“). Fachbegriffe in Blogbeiträgen werden über `abbr` erklärt. | 0 | — |
| 3 | Nutzerkontrolle | Die Bestätigungsseite hat den Link „Zurück zum Formular“ und die Hauptnavigation. | 0 | — |
| 4 | Konsistenz | Navigation, Kopf und Buttons sind auf allen Seiten gleich. | 0 | — |
| 5 | Fehlervermeidung | Formular nutzt passende Typen und `autocomplete`; Fehler erst nach der Eingabe. | 0 | — |
| 6 | Wiedererkennen | Alle Navigationspunkte sind sichtbar, keine versteckten Menüs. | 0 | — |
| 7 | Flexibilität | Keine Suche, kein Filter bei Projekten und Blog. Bei wenigen Einträgen unkritisch. | 1 | Folgt in Modul 12 |
| 8 | Minimalismus | Das Kontaktformular hat 5 Pflichtfelder (Name, E-Mail, Betreff, Nachricht, Datenschutz). Die User Story US4 nennt höchstens 3. Platzhaltertexte sind sichtbar als solche markiert. | 2 | Name und Betreff optional machen (Datenschutz-Checkbox bleibt Pflicht) oder US4 anpassen |
| 9 | Fehler erkennen und beheben | Es gibt keine eigene 404-Seite. Ein falscher Link führt auf die Fehlerseite des Servers. | 2 | Eigene `404.html` (Modul 19) |
| 10 | Hilfe und Dokumentation | Keine Hilfe nötig, Kontakt ist erreichbar. | 0 | — |

Fazit: Keine Katastrophen (Schwere 4). Priorität haben Befund 8 (Pflichtfelder) und 9 (404-Seite). Die Befunde stammen aus dem Durchklicken, nicht aus einem Test mit echten Personen.
