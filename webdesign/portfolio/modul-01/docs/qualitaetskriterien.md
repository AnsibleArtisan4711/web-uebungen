# Qualitätskriterien (messbar)

| Nr | Kriterium | Prüfung | Soll |
|---|---|---|---|
| Q1 | HTML ist valide | W3C Validator | 0 Fehler |
| Q2 | Semantisches HTML | Strukturreview | je Seite genau ein `h1`, Landmarken vorhanden |
| Q3 | Barrierefreiheit | WCAG 2.2 Level AA, Lighthouse-Accessibility | mindestens 95 |
| Q4 | Performance | Lighthouse, Core Web Vitals | grüner Bereich |
| Q5 | Browser-Funktion | Testmatrix aus `personas.md` | keine Funktionsfehler |
| Q6 | Sicherheit | HTTPS | durchgängig |
| Q7 | Datenschutz | Drittanbieter-Einbindungen | keine ohne Rechtsgrundlage |
| Q8 | Wartbarkeit | README, Ordnerstruktur | Setup in unter 5 Minuten nachvollziehbar |
