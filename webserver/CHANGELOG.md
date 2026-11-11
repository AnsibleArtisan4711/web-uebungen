# Changelog

Alle nennenswerten Änderungen an diesem Repository. Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

## [Unveröffentlicht]

### Hinzugefügt

- Skript als Markdown: `skript.md` und `README.md` in jedem der 14 Modulordner, `docs/skript-einleitung.md` und `docs/skript-quellenverzeichnis.md` (aus der LaTeX-Quelle umgewandelt, 448 Codebeispiele zeichengleich geprüft, 5.685 Inline-Codes vollständig übernommen)
- Lizenzen: MIT für Code (`LICENSE`), CC BY 4.0 für Texte (`LICENSE-DOCS.md`)

### Hinweise zur Umwandlung

- Lerneinheiten wie in der Quelle als Modul.Lerneinheit nummeriert (zum Beispiel 5.3); Übungsaufgaben (9 oder 10 je Modul, mit Schwierigkeitsangabe) und Lösungen als eigene Abschnitte am Modulende; die Form der Lösungsüberschriften wechselt in der Quelle („Lösung zu Aufgabe N.“ in Modul 01 bis 06, „Lösung N.“ ab Modul 07) und wurde so übernommen
- Modul 03: In der Lerneinheitentabelle stehen die Nginx-Lerneinheiten 3.9 bis 3.14 ohne Präfix, in den Überschriften mit „Nginx: “; unverändert aus der Quelle übernommen
- Codeblöcke: 146 Nginx, 106 Apache, 141 Shell (als `bash`), 4 INI, 51 Klartext (`text`); die Beispiele wurden für das Repository nicht ausgeführt
- Mathematische Ausdrücke in Modul 01, 04 und 11 als Text umgesetzt (zum Beispiel ×, ≈, ≤)
- Die Aufzählung der Sicherheits-Header in Modul 10 (Beschreibungsliste) steht als fetter Begriff mit der Erklärung darunter
