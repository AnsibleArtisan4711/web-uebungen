# Entscheidung: CMS und Hosting (Vorlage zum Ausfüllen)

Projekt: ______________  Datum: ______________  Entschieden von: ______________

## 1. Anforderungen

| Frage | Antwort |
|---|---|
| Wer ändert Inhalte, wie oft? | |
| Muss das Redaktionsteam ohne Technikkenntnisse arbeiten? | |
| Gibt es Formulare, Anmeldung, Shop (serverseitige Logik)? | |
| Wie viele Besucher erwartet ihr? | |
| Budget pro Jahr | |
| Wer wartet die Technik, mit welchem Know-how? | |
| Datenschutz: Serverstandort EU nötig? Auftragsverarbeitungsvertrag (AVV) nötig? | |

## 2. Optionen bewerten

Bewertung 1 (schlecht) bis 5 (gut) oder Freitext.

| Kriterium | Statische Seite + Static Hosting | Klassisches CMS (z. B. WordPress) | Headless CMS + Generator | Baukasten |
|---|---|---|---|---|
| Redaktionsbedarf | | | | |
| Kosten | | | | |
| Wartungsaufwand | | | | |
| Sicherheit | | | | |
| Geschwindigkeit | | | | |
| Kontrolle über Header (CSP, HSTS) | | | | |
| Datenschutz / Standort | | | | |
| Ausstiegsmöglichkeit (Datenexport) | | | | |

## 3. Entscheidung und Begründung

- Gewählt: 
- Warum: 
- Was wir dafür in Kauf nehmen: 

## 4. Prüfpunkte beim Hoster

- [ ] Standort der Server, AVV vorhanden
- [ ] HTTPS mit automatischer Erneuerung; HSTS einstellbar
- [ ] Eigene Antwort-Header einstellbar (CSP, `frame-ancestors`, `Permissions-Policy`)
- [ ] Backups, Wiederherstellung getestet (Modul 21)
- [ ] Staging-Umgebung oder Vorschau je Pull Request
- [ ] Bereitstellung per Git oder SSH statt FTP
- [ ] Verfügbarkeitszusage (SLA), Support
- [ ] Kosten bei Wachstum
