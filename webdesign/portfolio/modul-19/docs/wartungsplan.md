# Wartungsplan (Vorlage zum Anpassen)

Zuständigkeit klären: Jede Zeile hat eine Person, die sich kümmert, und einen Termin. Ohne Zuständigen passiert die Aufgabe nicht.

| Aufgabe | Intervall | Wie (Befehl oder Werkzeug) | Zuständig | Zuletzt erledigt |
|---|---|---|---|---|
| Abhängigkeiten auf bekannte Lücken prüfen | monatlich | `npm audit` im Ordner `portfolio/modul-19` | | |
| Abhängigkeiten aktualisieren (Patch/Minor) | monatlich | `npm outdated`, dann `npm update`, danach `npm run lint && npm test && npm run build` | | |
| Links prüfen | monatlich | `npm run links -- dist` | | |
| Erreichbarkeit und Zertifikat | laufend / wöchentlich | `node tools/gesundheitscheck.js https://…` oder Überwachungsdienst | | |
| Domain und Zertifikat: Ablaufdatum | vierteljährlich | Registrar, Zertifikatsanzeige | | |
| Backup wiederherstellen (Probe) | vierteljährlich | siehe Modul 21 | | |
| Sicherheits-Review | halbjährlich | `docs/security-review.md` | | |
| Barrierefreiheit und SEO stichprobenartig | halbjährlich | axe, Lighthouse | | |
| Inhalte prüfen (Impressum, Datenschutz, Lebenslauf) | jährlich | von Hand | | |
| Rollback üben | jährlich | `docs/release-checkliste.md` | | |
