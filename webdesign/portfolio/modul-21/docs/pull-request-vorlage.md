# Vorlage für Pull-Request-Beschreibungen

Auf GitHub kann diese Datei als `.github/pull_request_template.md` abgelegt werden. Dann füllt GitHub sie bei jedem neuen Pull Request automatisch ein. (Der Pfad `.github/` ist in diesem Kursordner nicht beschreibbar, deshalb liegt die Vorlage hier. Beim Einrichten des Repositories kopieren.)

```markdown
## Was ändert sich und warum?

(Ein bis drei Sätze, Verweis auf das Ticket oder die Aufgabe.)

## Wie wurde es geprüft?

- [ ] `npm run lint`, `npm run format:pruefen`, `npm test` laufen durch
- [ ] `npm run build` und `npm run validate:html` laufen durch
- [ ] Mobil (375 px) und Desktop (1280 px) angesehen, Screenshots unten
- [ ] Tastatur: Tab-Reihenfolge und Fokus geprüft

## Screenshots

(vorher / nachher, mobil / Desktop)

## Worauf soll die Reviewerin besonders achten?

(Unsichere Stellen, Alternativen, die verworfen wurden.)

## Nicht getestet

(Ehrlich auflisten: Browser, Geräte, Sonderfälle.)
```
