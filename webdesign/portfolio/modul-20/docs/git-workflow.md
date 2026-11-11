# Git-Workflow für dieses Projekt (Vorlage zum Anpassen)

## Grundregeln

- `main` ist immer lauffähig. Alle Prüfungen (CI) sind grün, bevor etwas dort landet.
- Neue Arbeit entsteht in kurzlebigen Branches: `feature/…`, `fix/…`, `docs/…`.
- Commits sind klein und thematisch. Nachricht nach Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.
- Keine Geheimnisse committen (Passwörter, API-Schlüssel, `.env`). Was einmal im Verlauf steht, bleibt dort.
- Veröffentlichungen bekommen einen Tag nach Semantic Versioning: `v0.19.0`.

## Ablauf von der Idee bis zum Merge

```text
git switch main && git pull                 # aktuellen Stand holen
git switch -c feature/kurzer-name           # Branch anlegen
# ... arbeiten, testen ...
git add -A && git commit -m "feat: ..."     # kleine Commits
git push -u origin feature/kurzer-name      # Branch hochladen, Pull Request öffnen
# Review + automatische Prüfungen, danach Merge in main
git switch main && git pull                 # Stand holen
git tag -a v0.20.0 -m "Stand nach ..."      # bei einer Veröffentlichung
git push origin v0.20.0
```

## Zurückrollen

| Situation | Befehl | Wirkung |
|---|---|---|
| Ein Commit war falsch, schon geteilt | `git revert <commit>` | Neuer Commit, der die Änderung zurücknimmt. Verlauf bleibt erhalten. |
| Nur ansehen, wie ein alter Stand war | `git switch --detach v0.19.0` | Du bist auf dem Tag, ohne Branch. Zurück mit `git switch main`. |
| Auf einem eigenen Branch, noch nicht geteilt | `git reset --hard <commit>` | Verwirft Änderungen. Nur nutzen, wenn dir klar ist, was verloren geht. |

## Hooks aktivieren (einmal je Klon)

```text
git config core.hooksPath .githooks
```

Der Hook `pre-commit` führt `npm run lint` und `npm run css:pruefen` im neuesten Portfolio-Stand aus. Mit `npm ci` im Ordner `portfolio/modul-20` vorbereiten.

## Offene Entscheidungen (ausfüllen)

- [ ] Wer darf nach `main` mergen? 
- [ ] Muss ein Review vorliegen? (Einstellung „Branch protection“ im Repository)
- [ ] Squash-Merge oder Merge-Commit?
