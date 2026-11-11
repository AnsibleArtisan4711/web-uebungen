# Relaunch-Checkliste (Vorlage)

Ein Relaunch ersetzt eine bestehende Seite. Das Risiko liegt weniger im neuen Design als darin, **bestehende Adressen, Rankings und Inhalte** zu verlieren.

## Vor dem Start

- [ ] Ziele und Erfolgsmaße festlegen (z. B. Anfragen über das Formular, organische Besuche)
- [ ] Alt-Bestand erfassen: alle Adressen der alten Seite (Crawl, Sitemap, Search Console, Server-Logs), siehe `docs/relaunch/alte-urls.txt`
- [ ] Bestandsaufnahme der Inhalte: behalten, überarbeiten, entfernen ([Migrations-Inventar](migration-inventar.md))
- [ ] Umleitungstabelle `docs/relaunch/url-mapping.csv`: jede alte Adresse hat ein Ziel oder den Status 410
- [ ] Staging-Umgebung mit `noindex` (nicht in Suchmaschinen), Zugang geschützt

## Prüfungen vor dem Livegang

- [ ] `npm run redirects`: keine Ketten, keine Schleifen, alle Ziele vorhanden, alle alten Adressen abgedeckt
- [ ] Testlauf der Umleitungen gegen den echten Server (Status 301, Location)
- [ ] `robots.txt`, `noindex` und Sitemap: Staging-Sperre ist entfernt, die Sitemap enthält die neuen Adressen
- [ ] Alle Prüfungen der Module 19 und 20 grün
- [ ] Rückfallplan: Wie kommt die alte Seite zurück, wie lange dauert das? (Rollback-Zeit messen, nicht schätzen)

## Livegang

- [ ] Zeitpunkt mit geringer Last wählen, Verantwortliche erreichbar
- [ ] Umleitungen aktivieren, Sitemap in der Search Console einreichen
- [ ] Sofort-Kontrolle: Startseite, 5 wichtige Unterseiten, Formular, 5 alte Adressen mit Umleitung

## Nach dem Livegang (Hypercare)

- [ ] Search Console beobachten: Crawling-Fehler, 404-Häufungen
- [ ] Server-Logs: welche alten Adressen werden noch abgefragt und sind nicht in der Tabelle?
- [ ] Nach 2 Wochen: Auswertung gegen die Ziele; Umleitungen **nicht** nach kurzer Zeit wieder entfernen
