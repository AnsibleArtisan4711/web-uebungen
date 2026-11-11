# Webserver – Apache HTTP Server und Nginx: Lernskript

Lernskript zu den beiden wichtigsten Open-Source-Webservern in 14 Modulen: Architektur, Installation und Konfiguration von Apache HTTP Server und Nginx, Virtual Hosts, Module und MPMs, statische Inhalte und Caching, TLS und HTTP/2, Reverse Proxy und Load Balancing, Logging und Troubleshooting, Security Hardening, Performance, Automation und Infrastructure as Code, Migration und Upgrades sowie Kosten, Governance, Backup und BCDR. Jede Lerneinheit hat eine Erklärung, mindestens ein Beispiel, typische Fehler mit Gegenbeispiel und einen Praxisbezug. Am Ende jedes Moduls stehen Übungsaufgaben mit Lösungen.

## Wichtig: Was dieses Repository (noch) ist

- Es enthält das **Skript als Markdown**, ein Kapitel pro Modul (`skript.md`), dazu [Einleitung](docs/skript-einleitung.md) und [Quellenverzeichnis](docs/skript-quellenverzeichnis.md) im Ordner `docs`.
- Eine eigenständige Übungsreihe mit Konfigurationsdateien, Testskripten und Lösungen je Modul ist **noch nicht** Teil des Repositories (die Übungsaufgaben am Kapitelende gehören zum Skript).
- **Die Beispiele wurden für dieses Repository nicht ausgeführt.** Alle 448 Codeblöcke sind zeichengleich aus der Quelle übernommen (146 Nginx, 106 Apache, 141 Shell, 4 INI, 51 Klartext/Terminalausgaben). Laut Einleitung hat der Autor die Beispiele in einer Linux-Umgebung (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0) ausgeführt; nicht getestet sind Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt, und diese Stellen sind im Text als nicht getestet gekennzeichnet.
- Viele Beispiele ändern Konfiguration, Zertifikate, Rechte oder Dienste. Nur in einem Testverzeichnis, einer VM oder einem Container ausprobieren, nie ungeprüft auf einem Produktivsystem.
- **Versionsstand:** Die Versionsangaben im Skript (zum Beispiel Apache 2.4.69, Nginx stable 1.30.6) gelten laut Quelle für den Stand 31.10.2026; getestet wurde mit den älteren Paketversionen der Testumgebung. Maßgeblich ist immer die aktuelle Dokumentation von Apache und Nginx.
- **Stundenangaben:** Dauer laut Lehrplan 165,5 Stunden insgesamt; die Summe der Lerneinheiten stimmt in jedem Modul mit der Modulangabe überein.
- Das Quellenverzeichnis unterscheidet zwischen tatsächlich abgerufenen und nicht abgerufenen Quellen. Hinweise zu Datenschutz und Governance sind keine Rechtsberatung.

## Module

| Modul | Thema | Dauer | Prio | Übungsaufgaben | Stand |
|---|---|---|---|---|---|
| [01](modul-01-apache-grundlagen-architektur/) | Apache HTTP Server Grundlagen und Architektur | 15 h | 1 | 9 | Skript verfügbar |
| [02](modul-02-installation-betriebssystem-verzeichnisse/) | Installation, Betriebssystemintegration und Verzeichnisstruktur | 12 h | 1 | 9 | Skript verfügbar |
| [03](modul-03-grundkonfiguration-vhosts-htaccess/) | Grundkonfiguration, Virtual Hosts und .htaccess | 15,5 h | 1 | 9 | Skript verfügbar |
| [04](modul-04-module-mpms-dynamische-inhalte/) | Module, MPMs und dynamische Inhalte | 9 h | 1 | 10 | Skript verfügbar |
| [05](modul-05-statische-inhalte-mime-compression-caching/) | Statische Inhalte, MIME, Compression und Caching | 9 h | 1 | 10 | Skript verfügbar |
| [06](modul-06-tls-http2-transport/) | TLS, HTTP-2 und sichere Transportkonfiguration | 11 h | 1 | 10 | Skript verfügbar |
| [07](modul-07-reverse-proxy-backend/) | Reverse Proxy, Load Balancing und Backend-Integration | 14,5 h | 1 | 9 | Skript verfügbar |
| [08](modul-08-load-balancing-hochverfuegbarkeit/) | Load Balancing, Hochverfügbarkeit und Traffic Steering | 9 h | 1 | 9 | Skript verfügbar |
| [09](modul-09-logging-monitoring-troubleshooting/) | Logging, Monitoring und Troubleshooting | 12 h | 1 | 9 | Skript verfügbar |
| [10](modul-10-security-hardening-zugriffsschutz/) | Security Hardening und Zugriffsschutz | 12 h | 1 | 9 | Skript verfügbar |
| [11](modul-11-performance-caching-skalierung/) | Performance, Caching und Skalierung | 16 h | 2 | 9 | Skript verfügbar |
| [12](modul-12-automation-cicd-iac/) | Automation, CI/CD und Infrastructure as Code | 10 h | 2 | 9 | Skript verfügbar |
| [13](modul-13-migration-upgrades-kompatibilitaet/) | Migration, Upgrades und Kompatibilität | 9 h | 2 | 9 | Skript verfügbar |
| [14](modul-14-kosten-governance-backup-bcdr/) | Kosten, Governance, Backup und BCDR | 11,5 h | 3 | 9 | Skript verfügbar |

Priorität: 1 = höchste.

## Lizenz

- **Code** (Beispieldateien und Skripte, falls das Repository solche enthält): [MIT-Lizenz](LICENSE)
- **Texte** (die Modul-READMEs, die Kapitel `skript.md` und die Dateien unter `docs/`): [CC BY 4.0](LICENSE-DOCS.md)
- Apache, Apache HTTP Server, NGINX, NGINX Plus, F5, Linux, Ubuntu und weitere genannte Produkte sind Marken ihrer jeweiligen Inhaber; dieses Repository steht in keiner Verbindung zu ihnen.

Autor: AnsibleArtisan4711
