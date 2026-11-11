# Release-Checkliste und Rollback-Plan (Vorlage)

## Vor dem Release

- [ ] Alle CI-Prüfungen auf `main` sind grün (Lint, Format, Tests, Security, Build, Links, Budget)
- [ ] `CHANGELOG.md` ergänzt, Version nach Semantic Versioning gewählt
  - Patch (0.19.1): nur Fehlerkorrekturen
  - Minor (0.20.0): neue Funktionen, abwärtskompatibel
  - Major (1.0.0): Änderungen, die Bestehendes brechen
- [ ] Vorschau/Staging angesehen (Mobil und Desktop)
- [ ] Zeitfenster gewählt, in dem ein Fehler wenig schadet
- [ ] Rollback-Plan unten gelesen

## Release

```text
git switch main && git pull
git tag -a vX.Y.Z -m "Kurzbeschreibung"
git push origin vX.Y.Z
npm ci && npm run build        # erzeugt dist/ mit Hash-Dateinamen
# dist/ auf den Hoster bereitstellen (Weg je nach Hoster, siehe hosting-entscheidung.md)
```

Hash-Dateinamen (`main.86a20622.css`) sorgen dafür, dass Browser nach einer Änderung die neue Datei laden: Ändert sich der Inhalt, ändert sich der Name. Die HTML-Seiten werden mit `no-cache` ausgeliefert und verweisen auf die neuen Namen.

## Nach dem Release

- [ ] `node tools/gesundheitscheck.js https://…` meldet „Alles in Ordnung“
- [ ] Stichprobe: Startseite, Kontakt (Formular absenden), 404-Seite
- [ ] Fehlerprotokoll des Hosters in den ersten Stunden ansehen

## Rollback-Plan

1. Entscheiden: Ist der Fehler schlimm genug (Seite kaputt, Daten falsch, Sicherheitslücke)? Dann sofort zurückrollen, Ursache später suchen.
2. Letzten guten Tag bereitstellen:
   ```text
   git switch --detach vX.Y.Z-vorher
   npm ci && npm run build
   # dist/ erneut bereitstellen
   ```
3. Auf `main` die fehlerhafte Änderung mit `git revert <commit>` zurücknehmen, damit der nächste Release nicht denselben Fehler enthält.
4. Gesundheitscheck wiederholen und im Changelog vermerken, was passiert ist.

Der Rollback ist nur dann ein Plan, wenn du ihn einmal geübt hast. Trage hier das Datum der letzten Probe ein: ______________
