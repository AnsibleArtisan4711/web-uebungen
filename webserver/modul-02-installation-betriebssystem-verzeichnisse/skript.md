# Modul 02 - Installation, Betriebssystemintegration und Verzeichnisstruktur

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Listings unverändert, farbige Boxen als Zitatblöcke mit fettem Titel, Tabellen als Markdown-Tabellen, Übungsaufgaben und Lösungen als Absätze bzw. Überschriften). Die Lerneinheiten sind wie in der Quelle nach Modul nummeriert (2.1 bis 2.11), danach folgen „Übungsaufgaben“ (9) und „Lösungen und Erklärungen“. **Die Konfigurationen und Befehle wurden für dieses Repository nicht ausgeführt:** Laut Einleitung hat der Autor die Beispiele in einer Linux-Umgebung (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0) ausgeführt; nicht getestet sind laut Skript Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt. Viele Beispiele ändern Server-Konfiguration, Zertifikate, Rechte oder Dienste: nur in einer Testumgebung ausprobieren. Übersicht zum Modul: [README](README.md).

**Geplante Dauer:** 12 h | **Priorität:** 1 | **Lerneinheiten:** 11

## Lerneinheiten laut Lehrplan

| **Nr.** | **Lerneinheit**          | **Dauer (h)** | **Prio** |
|--------:|:-------------------------|--------------:|---------:|
|     2.1 | Paketinstallation        |             1 |        1 |
|     2.2 | Source Build             |             1 |        1 |
|     2.3 | systemd Service          |           1,5 |        1 |
|     2.4 | Windows Service          |             1 |        1 |
|     2.5 | ServerRoot               |             1 |        1 |
|     2.6 | DocumentRoot             |           1,5 |        2 |
|     2.7 | Dedicated User           |             1 |        2 |
|     2.8 | Dateirechte              |             1 |        2 |
|     2.9 | nginx.conf Aufbau        |             1 |        1 |
|    2.10 | conf.d und sites-enabled |             1 |        1 |
|    2.11 | Firewall und Ports       |             1 |        2 |
|         | **Summe**                |        **12** |          |

## Überblick und Lernweg

Ein Webserver ist erst dann ein Dienst, wenn er sauber in das Betriebssystem eingebunden ist: installiert, als Systemdienst gestartet, mit klaren Verzeichnissen, einem eigenen Benutzer und passenden Dateirechten, und mit einer Firewall, die genau die richtigen Ports öffnet. Dieses Modul behandelt diese *Betriebssystemintegration*. Wer sie versteht, kann eine Installation von Grund auf aufbauen, eine fremde Installation lesen und Fehler wie „403 Forbidden“ oder „Address already in use“ gezielt eingrenzen, statt zu raten.

Die Einheiten 2.1 bis 2.4 beschreiben, *wie* die Software auf den Rechner kommt und als Dienst läuft: über Pakete, aus dem Quelltext, unter systemd und unter Windows. Die Einheiten 2.5 bis 2.8 erklären die wichtigsten Verzeichnisse und Rechte beim Apache HTTP Server. Die Einheiten 2.9 und 2.10 zeigen die entsprechende Struktur bei Nginx, und die Einheit 2.11 schließt mit Firewall und Ports für beide Server ab.

> **Merke**
>
> Die Beispiele wurden auf Ubuntu 24.04 mit Apache 2.4.58 und Nginx 1.24.0 ausgeführt. Pfade und Hilfsprogramme anderer Distributionen weichen ab; die Unterschiede zu RHEL-artigen Systemen werden benannt. Was in der Testumgebung nicht ausgeführt werden konnte (zum Beispiel Windows-Befehle oder Downloads von nginx.org), ist ausdrücklich so gekennzeichnet.

## 2.1 Paketinstallation

Der Normalfall für einen Server ist die Installation über den *Paketmanager* der Distribution. Ein Paket enthält das fertig übersetzte Programm, Standardkonfiguration, Dienstdefinition und Verzeichnisstruktur, und der Paketmanager löst Abhängigkeiten auf, protokolliert, welche Datei woher stammt, und liefert Updates. Gerade das Update-Verhalten ist für den Betrieb entscheidend: Die Distribution überwacht Sicherheitslücken und stellt korrigierte Pakete bereit, die per `apt` oder `dnf` eingespielt werden.

Auf Debian und Ubuntu heißen die Pakete `apache2` und `nginx` und werden mit `apt` installiert, auf RHEL-artigen Systemen (RHEL, AlmaLinux, Rocky Linux) heißen sie `httpd` und `nginx` und werden mit `dnf` installiert. Ein wichtiger Unterschied liegt im Verhalten nach der Installation: Debian und Ubuntu starten den Dienst sofort und aktivieren ihn für den Systemstart, RHEL-artige Systeme tun das nicht, dort muss man `systemctl enable --now httpd` selbst ausführen.

```bash
# Debian / Ubuntu
$ sudo apt update
$ sudo apt install apache2        # oder: nginx
$ apache2 -v
Server version: Apache/2.4.58 (Ubuntu)

# RHEL, AlmaLinux, Rocky Linux
$ sudo dnf install httpd          # oder: nginx
$ sudo systemctl enable --now httpd
$ sudo firewall-cmd --permanent --add-service=http --add-service=https
$ sudo firewall-cmd --reload
```

Der erste Block aktualisiert die Paketlisten und installiert den Webserver; `apache2 -v` bestätigt die Version. Der zweite Block zeigt, dass unter RHEL zwei Zusatzschritte nötig sind: den Dienst aktivieren und die Firewall öffnen (Einheit 2.11). Ob der Dienst läuft, prüft man mit `systemctl status`, und was ein Paket auf die Platte gebracht hat, zeigt `dpkg -L apache2` (Debian) bzw. `rpm -ql httpd` (RHEL).

Die Version eines Distributionspakets wirkt oft veraltet. Das liegt am *Backporting*: Die Distribution friert die Hauptversion ein und überträgt Sicherheitskorrekturen in die eingefrorene Version. Auf der Testmaschine steht deshalb `2.4.58-1ubuntu8.17`, obwohl die Apache Software Foundation längst eine höhere 2.4.x-Version veröffentlicht hat. Das ist kein Fehler, sondern ein Merkmal: Man erhält ein stabiles Verhalten mit Sicherheitsupdates, aber nicht die neuesten Funktionen. Wer neuere Funktionen braucht, kann beim Nginx das offizielle Repository des Projekts einbinden.

Für Nginx beschreibt die offizielle Installationsanleitung zwei Linien: *Stable* und *Mainline*. Für Debian und Ubuntu wird der Signierschlüssel des Projekts heruntergeladen, in ein Schlüsselbund (`/usr/share/keyrings`) abgelegt, anhand veröffentlichter Fingerabdrücke geprüft, danach das Repository in `/etc/apt/sources.list.d/nginx.list` eingetragen und die Priorität der Pakete von nginx.org über *Apt-Pinning* gegenüber der Distribution erhöht. Auf RHEL-artigen Systemen legt man dazu die Datei `/etc/yum.repos.d/nginx.repo` mit den Abschnitten `nginx-stable` und `nginx-mainline` an und wechselt bei Bedarf mit `dnf config-manager --enable nginx-mainline`. Diese Schritte konnten in der Testumgebung nicht ausgeführt werden, weil der Zugriff auf nginx.org gesperrt war; sie folgen der Dokumentation.

```bash
# Schlüssel holen, entpacken und ablegen (Debian/Ubuntu, laut Dokumentation)
$ curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor \
    | sudo tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null
# Fingerabdrücke mit den veröffentlichten Werten vergleichen
$ gpg --dry-run --quiet --no-keyring --import --import-options import-show \
    /usr/share/keyrings/nginx-archive-keyring.gpg
# Repository eintragen (stable) und installieren
$ echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
http://nginx.org/packages/ubuntu `lsb_release -cs` nginx" \
    | sudo tee /etc/apt/sources.list.d/nginx.list
$ sudo apt update && sudo apt install nginx
```

Der Befehl `gpg --dearmor` wandelt den Schlüssel in das binäre Format um, das `apt` erwartet. Der Zusatz `signed-by` bindet den Schlüssel *nur* an dieses Repository, sodass er nicht die Pakete anderer Quellen beglaubigen kann. Die Prüfung der Fingerabdrücke ist kein Formalismus: Wer den Schlüssel ungeprüft einträgt, vertraut jeder Datei, die über die Verbindung gekommen ist.

### Typische Fehler.

Ein häufiger Fehler ist, nach der Installation sofort im Browser zu testen und „geht nicht“ zu erleben, weil die Firewall den Port blockiert (RHEL) oder weil der Dienst nicht läuft (RHEL). Ein zweiter ist die Vermischung von Quellen: Paket aus der Distribution und Paket von nginx.org gleichzeitig, was bei Updates zu Konflikten führt. Falsch und richtig:

```bash
# falsch: Port nicht geöffnet, Dienst nicht aktiviert (RHEL)
$ sudo dnf install httpd
# richtig: Dienst starten und aktivieren, Firewall öffnen, dann testen
$ sudo systemctl enable --now httpd
$ sudo firewall-cmd --permanent --add-service=http && sudo firewall-cmd --reload
$ curl -I http://localhost/
```

> **Ergänzung aus der Nachrecherche: Stable und Mainline bei Nginx**
>
> Die Installationsanleitung des Herstellers beschreibt *Mainline* als die Entwicklungslinie mit Veröffentlichungen etwa alle ein bis zwei Monate (ungerade mittlere Versionsnummer, zum Beispiel 1.31.x) und *Stable* als die Linie, die höchstens jährlich neue Funktionen erhält und sonst kritische Korrekturen aus Mainline übernimmt (gerade mittlere Nummer, zum Beispiel 1.30.x). Mainline wird dort für den Produktionseinsatz empfohlen, sofern keine besonders strengen Stabilitätsanforderungen bestehen. Die Veröffentlichungsliste von nginx.org zeigt allerdings auch für Stable häufige Korrekturversionen (Oktober 2026: 1.30.5 am 15. 9. und 1.30.6 am 14. 10.). Beides ist kein Widerspruch: Stable ändert selten Funktionen, wird aber laufend korrigiert.

> **Praxisbeispiel: Welche Quelle ist die richtige?**
>
> In Unternehmen entscheidet oft die Support-Strategie: Wer Herstellersupport für das Betriebssystem hat, bleibt bei Paketen der Distribution; Teams mit hohem Funktionsbedarf (zum Beispiel HTTP/3) nutzen das Hersteller-Repository oder Container-Images. Wichtig ist, die Entscheidung bewusst zu treffen und festzuhalten, weil sie später bestimmt, wie Sicherheitsupdates ankommen.

## 2.2 Source Build

Manchmal reichen Distributionspakete nicht: Man braucht eine bestimmte Version, ein Modul, das im Paket fehlt, oder eine exakt kontrollierte Konfiguration des Programms. Dann übersetzt man den Quelltext selbst, einen *Source Build*. Der Preis ist deutlich: Man ist selbst für Updates, Sicherheitskorrekturen und die Integration in den Systemstart verantwortlich. Ein selbst gebauter Webserver wird vom Paketmanager nicht aktualisiert, und eine unbemerkte Sicherheitslücke bleibt offen, bis jemand sie bemerkt.

Der Ablauf ist bei beiden Servern verwandt und besteht aus vier Schritten: Quelltext beschaffen und prüfen, mit `configure` an das System und die Wünsche anpassen, mit `make` übersetzen und mit `make install` an den Zielort kopieren. `configure` ist ein Skript, das das System untersucht (Compiler, Bibliotheken) und daraus Bauanweisungen erzeugt; seine Optionen entscheiden über Installationsort und Funktionsumfang. Wichtig ist das *Präfix*: Alles wird unterhalb dieses Verzeichnisses abgelegt, und die Programme sind auf diesen Pfad festgelegt. Die Apache-Anleitung weist darauf hin, den Pfad sorgfältig zu wählen, weil `httpd` für ihn konfiguriert wird (Standard: `/usr/local/apache2`).

Zuerst benötigt man Werkzeuge und Entwicklungsbibliotheken. Für Apache sind das ein C-Compiler, `make`, APR und APR-Util sowie PCRE2; für Nginx PCRE2, zlib und OpenSSL (jeweils die `-dev`- oder `-devel`-Pakete). Wichtig ist auch die Herkunft des Quelltexts: Er stammt von den Projektseiten, und die Signatur wird mit PGP geprüft (die Apache-Anleitung verweist auf die Verifikationsseite des Projekts). Dies ist eine der wichtigsten Schutzmaßnahmen gegen manipulierte Downloads.

Im Folgenden wurde der *unveränderte Upstream-Quelltext* (aus den Quellpaketen der Distribution entpackt) in der Testumgebung tatsächlich übersetzt. Die Version ist deshalb Nginx 1.24.0 und Apache 2.4.58; die Schritte und Optionen sind für aktuelle Versionen identisch. Zuerst Nginx:

```bash
$ sudo apt install build-essential libpcre2-dev zlib1g-dev libssl-dev
$ tar xzf nginx-1.24.0.tar.gz && cd nginx-1.24.0
$ ./configure --prefix=/opt/nginx \
    --with-http_ssl_module --with-http_v2_module \
    --with-http_stub_status_module --with-threads
$ make -j4
$ sudo make install
$ /opt/nginx/sbin/nginx -V
nginx version: nginx/1.24.0
built with OpenSSL 3.0.13 30 Jan 2024
TLS SNI support enabled
configure arguments: --prefix=/opt/nginx --with-http_ssl_module ...
```

`--prefix` legt das Wurzelverzeichnis fest (im Test `/tmp/build/nginx-inst`). Die `--with-...`-Optionen schalten Module ein, die nicht zum Standardumfang gehören: TLS, HTTP/2, die Statusseite und Thread-Pools. Nach der Installation findet man unter dem Präfix die Verzeichnisse `sbin` (Programm), `conf` (Konfiguration mit `nginx.conf`, `mime.types` und Beispieldateien `*.default`), `logs` (Logs und PID-Datei) und `html` (Beispielseite). Der Befehl `nginx -V` zeigt hinterher genau, mit welchen Optionen das Programm gebaut wurde; die Ausgabe ist die verlässlichste Dokumentation eines Source Builds.

Bei Apache sind die Schritte gleich, nur die Optionen unterscheiden sich. Laut Anleitung werden Module standardmäßig als ladbare DSOs gebaut; die Option `--enable-mods-shared=most` bestimmt die Menge, `--enable-mpms-shared=all` baut alle MPMs als Module, und `--with-mpm=event` legt das Standard-MPM fest.

```bash
$ sudo apt install build-essential libapr1-dev libaprutil1-dev libpcre2-dev libssl-dev
$ tar xzf httpd-2.4.58.tar.gz && cd httpd-2.4.58
$ ./configure --prefix=/opt/apache2 \
    --enable-mods-shared=most --enable-mpms-shared=all --with-mpm=event \
    --enable-ssl --enable-proxy
$ make -j4
$ sudo make install
$ /opt/apache2/bin/httpd -v
Server version: Apache/2.4.58 (Unix)
$ /opt/apache2/bin/httpd -l
Compiled in modules:
  core.c
  mod_so.c
  http_core.c
```

Die Ausgabe von `httpd -l` zeigt, was die Option `mods-shared=most` bewirkt: Statisch eingebaut sind nur der Kern und `mod_so`; alle anderen Module liegen als `.so`-Dateien im Unterverzeichnis `modules` und werden über `LoadModule` aktiviert. Der Vergleich mit dem Paket aus Abschnitt 2.1 ist lehrreich: Dort waren `mod_log_config` und `mod_unixd` fest eingebaut, hier sind sie ladbar. Unter dem Präfix liegen `bin` (mit `httpd`, `apachectl`, `apxs`, `htpasswd`), `conf` (mit `httpd.conf` und dem Unterordner `extra`), `htdocs` (Dokumentenwurzel), `logs`, `modules` und `error`. Die mitgelieferte `httpd.conf` läuft standardmäßig als Benutzer `daemon` (nicht `www-data`) und lauscht auf Port 80; beides sollte man vor dem produktiven Einsatz bewusst anpassen (Einheit 2.7).

Ein Source Build gehört nicht in dasselbe Verzeichnis wie ein Paket. Deshalb wählt man einen eigenen Präfix wie `/opt/apache2` oder `/opt/nginx`, sodass beide Installationen nebeneinander bestehen können, etwa zum Testen einer neuen Version auf einem anderen Port. Die Apache-Dokumentation empfiehlt für Upgrades ausdrücklich, die neue Version neben der alten zu installieren, auf einem anderen Port zu testen und erst dann umzuschalten. Kleine Versionssprünge (2.4.x nach 2.4.y) sind als Drop-in gedacht: Die Datei `config.nice` im Quellverzeichnis hält die ursprünglichen `configure`-Optionen fest, sodass man sie mit `./config.nice` wiederverwenden kann.

### Typische Fehler.

Der klassische Abbruch passiert in `configure`, wenn Entwicklungsbibliotheken fehlen; die Meldung nennt dann beispielsweise PCRE oder OpenSSL. Die Lösung ist, das passende `-dev`-Paket nachzuinstallieren, nicht, die Prüfung zu umgehen. Der zweite Fehler ist ein Tippfehler bei Modulnamen: Laut Apache-Anleitung ignoriert `configure` unbekannte Modulnamen *stillschweigend*. Ein falsch geschriebenes `--enable-sll` führt also nicht zu einer Fehlermeldung, sondern zu einem Server ohne TLS-Modul, was man erst beim Blick in das Verzeichnis `modules` bemerkt. Aber auch ein korrekt gebautes Modul ist nicht automatisch aktiv: In der mitgelieferten `httpd.conf` sind die `LoadModule`-Zeilen für `mod_ssl` und `mod_proxy` auskommentiert, und `httpd -M` listet das Modul erst nach dem Aktivieren auf. Drittens: `make install` als `root` ausführen, den Compiler aber ebenfalls als `root` laufen lassen. Besser ist, nur den Installationsschritt mit erhöhten Rechten auszuführen.

```bash
# falsch: Tippfehler wird nicht gemeldet, SSL fehlt im Ergebnis
$ ./configure --prefix=/opt/apache2 --enable-sll
# richtig: nach dem Bau das Ergebnis prüfen
$ ./configure --prefix=/opt/apache2 --enable-ssl && make -j4
$ sudo make install
$ ls /opt/apache2/modules | grep ssl
mod_ssl.so
$ /opt/apache2/bin/httpd -M | grep ssl
                       <- keine Ausgabe: gebaut, aber noch nicht geladen
# in conf/httpd.conf die Zeile "#LoadModule ssl_module modules/mod_ssl.so" aktivieren
$ /opt/apache2/bin/httpd -M | grep ssl
 ssl_module (shared)
```

> **Ergänzung aus der Nachrecherche: Beschaffung im Arbeitsbereich**
>
> Die Quelltexte konnten im Testarbeitsbereich nicht von apache.org, nginx.org oder GitHub geladen werden (Netzwerkzugriff gesperrt). Für die Übersetzung wurden deshalb die unveränderten Upstream-Archive aus den Quellpaketen der Distribution verwendet. In der Praxis lädt man den Quelltext von den Projektseiten und verifiziert die PGP-Signatur, wie es die Installationsanleitung des Apache-Projekts beschreibt. Die aktuelle Apache-Version laut Ankündigung ist 2.4.69, die aktuelle Nginx-Stable-Version laut nginx.org 1.30.6.

> **Praxisbeispiel: Warum Source Builds selten werden**
>
> In vielen Betrieben ist der Source Build die Ausnahme, weil Containerbilder und Hersteller-Repositories dasselbe Ziel einfacher erreichen. Er bleibt aber nützlich, um ein Modul zu testen, einen Fehler zu reproduzieren oder zu verstehen, was ein Paket im Hintergrund tut. Wer einmal selbst gebaut hat, liest eine Ausgabe von `nginx -V` deutlich besser.

## 2.3 systemd Service

Auf nahezu allen modernen Linux-Distributionen startet und überwacht *systemd* die Dienste. Es kümmert sich darum, dass der Webserver beim Systemstart läuft, nach einem Absturz neu gestartet werden kann, seine Logs im Journal landen und er vor dem Netzwerk nicht zu früh startet. Die Beschreibung eines Dienstes steht in einer *Unit-Datei* mit der Endung `.service`. Pakete bringen sie mit (unter `/usr/lib/systemd/system/`); eigene oder geänderte Units liegen unter `/etc/systemd/system/`, und was dort steht, hat Vorrang.

Eine Unit besteht aus drei Abschnitten. Der Abschnitt `[Unit]` beschreibt den Dienst und seine Abhängigkeiten (`After=` legt fest, wonach er startet). Der Abschnitt `[Service]` sagt, *wie* der Dienst gestartet, neu geladen und gestoppt wird. Der Abschnitt `[Install]` regelt, in welchem Systemziel er aktiviert wird; `WantedBy=multi-user.target` bedeutet „beim normalen Mehrbenutzerstart“. Die folgende Datei ist die tatsächliche Unit des Apache-Pakets auf der Testmaschine, ohne Kommentare:

```ini
[Unit]
Description=The Apache HTTP Server
After=network.target remote-fs.target nss-lookup.target
Documentation=https://httpd.apache.org/docs/2.4/

[Service]
Type=forking
Environment=APACHE_STARTED_BY_SYSTEMD=true
ExecStart=/usr/sbin/apachectl start
ExecStop=/usr/sbin/apachectl graceful-stop
ExecReload=/usr/sbin/apachectl graceful
KillMode=mixed
PrivateTmp=true
Restart=on-abort

[Install]
WantedBy=multi-user.target
```

Die Zeilen lassen sich nun gut erklären. `Type=forking` teilt systemd mit, dass der gestartete Prozess sich abspaltet (dämonisiert): Der Startbefehl kehrt zurück, während der eigentliche Dienst als Kindprozess weiterläuft. Das passt zu Apache und Nginx im Standardbetrieb. `ExecStart`, `ExecStop` und `ExecReload` nennen die Kommandos; man erkennt, dass das Neuladen als `graceful` und das Stoppen als `graceful-stop` erfolgt, also sanft. `KillMode=mixed` sendet das Stoppsignal zunächst nur an den Hauptprozess und beendet verbliebene Kindprozesse später. `PrivateTmp=true` gibt dem Dienst ein eigenes, privates `/tmp`, sodass andere Dienste dort nicht mitlesen können. `Restart=on-abort` startet den Dienst nur nach einem Absturz durch Signal neu.

Die Nginx-Unit des Pakets zeigt dieselbe Struktur mit zwei Besonderheiten. Vor dem Start prüft `ExecStartPre` die Konfiguration (`nginx -t -q`), sodass ein Tippfehler den Dienst gar nicht erst in einen halbfertigen Zustand bringt. Und die Zeile `PIDFile=/run/nginx.pid` sagt systemd, wo es die Prozessnummer des Masters findet. Außerdem verwendet sie `-g 'daemon on; master_process on;'`, um globale Direktiven direkt aus der Kommandozeile zu setzen.

Bedient wird der Dienst mit `systemctl`. Die wichtigsten Befehle sind in der folgenden Übersicht zusammengestellt; `journalctl` liest die Meldungen des Dienstes.

```bash
$ sudo systemctl enable --now nginx    # beim Boot starten und jetzt starten
$ systemctl status nginx               # Zustand, PIDs, letzte Logzeilen
$ sudo systemctl reload nginx          # Konfiguration neu laden (ohne Ausfall)
$ sudo systemctl restart nginx         # kompletter Neustart (bricht Verbindungen)
$ journalctl -u nginx --since "1 hour ago"
$ systemctl cat nginx                  # zeigt die wirksame Unit samt Drop-ins
```

Eigene Anpassungen nimmt man nicht in der Paketdatei vor, weil ein Update sie überschreiben würde. Stattdessen legt man ein *Drop-in* an, am bequemsten mit `systemctl edit nginx`; die Datei landet unter `/etc/systemd/system/nginx.service.d/override.conf` und ergänzt oder überschreibt einzelne Einstellungen. Ein typischer Fall ist eine höhere Grenze für offene Dateien, die Nginx bei vielen Verbindungen braucht:

```ini
# /etc/systemd/system/nginx.service.d/override.conf
[Service]
LimitNOFILE=65535
```

Danach genügt `systemctl restart nginx`; die Einstellung wird beim Anlegen der Datei automatisch neu eingelesen. Bei einem Source Build gibt es keine mitgelieferte Unit, man schreibt sie selbst. Die folgende Variante für eine Installation unter `/opt/nginx` ergänzt die Grundstruktur um mehrere Härtungsoptionen. Ihre Syntax wurde mit `systemd-analyze verify` geprüft; die einzige Beanstandung in der Testumgebung war, dass die Programmdatei dort nicht installiert ist.

```ini
[Unit]
Description=Nginx (Source Build unter /opt/nginx)
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
PIDFile=/opt/nginx/logs/nginx.pid
ExecStartPre=/opt/nginx/sbin/nginx -t -q
ExecStart=/opt/nginx/sbin/nginx
ExecReload=/opt/nginx/sbin/nginx -s reload
ExecStop=/opt/nginx/sbin/nginx -s quit
KillMode=mixed
TimeoutStopSec=10
LimitNOFILE=65535
PrivateTmp=true
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

Hinzugekommen sind `NoNewPrivileges` (der Dienst und seine Kinder können keine zusätzlichen Rechte erlangen), `ProtectSystem=full` (die Verzeichnisse `/usr`, `/boot` und `/etc` sind für den Dienst schreibgeschützt) und `ProtectHome=true` (die Heimatverzeichnisse sind unzugänglich). Diese Optionen sind eine zweite Verteidigungslinie: Selbst wenn ein Angreifer den Dienst übernimmt, kann er weniger anrichten. Nach dem Ablegen der Datei muss man systemd mit `systemctl daemon-reload` auffordern, sie neu zu lesen.

### Typische Fehler.

Der erste Fehler ist, die Paket-Unit unter `/usr/lib` direkt zu bearbeiten: Die Änderung geht beim nächsten Paketupdate verloren. Richtig ist ein Drop-in. Der zweite Fehler ist ein Typ, der nicht zum Programm passt: Läuft Nginx mit `daemon off;` im Vordergrund (typisch in Containern), braucht die Unit `Type=simple`; mit `Type=forking` wartet systemd vergeblich auf eine PID-Datei und meldet nach einer Zeitüberschreitung einen Fehler. Der dritte Fehler ist das Vergessen von `daemon-reload` nach Änderungen an Unit-Dateien.

```bash
# falsch: Paket-Unit bearbeitet, Änderung geht beim Update verloren
$ sudo nano /usr/lib/systemd/system/nginx.service
# richtig: Drop-in anlegen (liegt unter /etc, bleibt erhalten)
$ sudo systemctl edit nginx
$ systemctl cat nginx
```

> **Praxisbeispiel: Reload nach Konfigurationsänderung**
>
> In der Praxis läuft jede Änderung nach dem gleichen Muster: Datei ändern, mit `apachectl configtest` oder `nginx -t` prüfen, mit `systemctl reload` anwenden. Die beiden mitgelieferten Units sind genau dafür gebaut: `reload` löst bei Apache `graceful` und bei Nginx `-s reload` aus, ohne den Dienst auszuschalten. Der Neustart ist die Ausnahme, etwa nach einem Update der Programmdatei.

## 2.4 Windows Service

Unter Windows heißen Hintergrundprogramme *Dienste*. Sie werden vom *Service Control Manager* gestartet und verwaltet, laufen unabhängig von angemeldeten Benutzern und starten bei Bedarf automatisch mit dem System. Auch unter Windows kann man Apache und Nginx betreiben, allerdings mit anderen Voraussetzungen als unter Linux. Die Windows-Befehle dieser Einheit konnten in der Linux-Testumgebung nicht ausgeführt werden; sie beruhen auf der Dokumentation der Projekte und auf allgemeinem Betriebswissen.

Die Apache Software Foundation verteilt den Apache HTTP Server nur als Quelltext. Fertige Windows-Binärdateien stammen von Dritten (bekannt sind unter anderem Apache Lounge und ApacheHaus), und die Apache-Seiten weisen darauf hin. Bei der Auswahl sollte man auf die Vertrauenswürdigkeit der Quelle, die Signatur der Dateien und die Version der Visual-C++-Laufzeitumgebung achten, mit der die Binärdateien gebaut wurden. Als MPM wird unter Windows `mpm_winnt` verwendet, das mit einem Prozess und mehreren Threads arbeitet und die native Netzwerkschnittstelle des Systems nutzt.

Die Installation besteht aus dem Entpacken des Archivs in ein Verzeichnis wie `C:\Apache24`, dem Anpassen der Variable `SRVROOT` in `conf\httpd.conf` und dem Einrichten des Dienstes. Das Einrichten übernimmt `httpd.exe` selbst:

```bash
C:\Apache24\bin> httpd.exe -t
Syntax OK
C:\Apache24\bin> httpd.exe -k install -n "Apache2.4"
C:\Apache24\bin> httpd.exe -k start -n "Apache2.4"
C:\Apache24\bin> httpd.exe -k restart -n "Apache2.4"
C:\Apache24\bin> httpd.exe -k uninstall -n "Apache2.4"
```

`-t` prüft zuerst die Syntax. `-k install` registriert den Dienst unter dem mit `-n` gewählten Namen im Service Control Manager; `start`, `restart` und `uninstall` steuern ihn. Die Konfigurationsdatei verwendet auch unter Windows Schrägstriche in Pfaden (`C:/Apache24/htdocs`), weil der Backslash in Apache-Konfigurationen als Fluchtzeichen gilt. Der Dienst läuft standardmäßig unter dem Systemkonto `LocalSystem`, das sehr weitreichende Rechte hat. Aus Sicherheitsgründen sollte man ihn in der Diensteverwaltung (`services.msc`) einem eigens angelegten Konto mit minimalen Rechten zuweisen, das nur Lesezugriff auf die Webinhalte und Schreibzugriff auf das Logverzeichnis erhält.

Bei Nginx ist die Lage anders. Die Windows-Version von nginx.org ist funktional eingeschränkt: Sie nutzt einen einfacheren Ereignismechanismus als unter Linux und skaliert deshalb schlechter; sie ist daher für Entwicklung und kleine Szenarien gedacht, nicht für Hochlast. Nginx bringt außerdem keine eigene Dienstintegration für Windows mit. Üblich ist, ihn über ein Hilfsprogramm wie NSSM oder WinSW als Dienst zu betreiben, das ein beliebiges Programm als Windows-Dienst startet und überwacht. Für produktiven Einsatz empfiehlt sich meist Linux, gegebenenfalls in einer virtuellen Maschine oder einem Container.

### Typische Fehler.

Der häufigste Fehler ist ein Pfadproblem: Ein Backslash in der Apache-Konfiguration wird als Fluchtzeichen gelesen. Weitere Stolpersteine sind ein bereits belegter Port 80 (zum Beispiel durch den Windows-Webserver IIS oder ein anderes Programm) und fehlende Laufzeitbibliotheken, die dann beim Start mit einem Hinweis auf eine fehlende DLL auffallen.

```apache
# falsch: Backslashes werden als Escape-Zeichen gelesen
DocumentRoot "C:\Apache24\htdocs"
# richtig: Schrägstriche verwenden
DocumentRoot "C:/Apache24/htdocs"
```

> **Praxisbeispiel: Windows im Unternehmensumfeld**
>
> Wo Windows-Server Standard sind, trifft man Apache häufig als Mitbringsel einer Anwendung (zum Beispiel eines Wikis oder einer Webentwicklungsumgebung) an. Dann gelten dieselben Betriebsprinzipien wie unter Linux: dedizierter Dienstbenutzer, minimale Dateirechte, Logs außerhalb des Webverzeichnisses, regelmäßige Updates. Der Unterschied liegt vor allem in der Werkzeugwelt, also Dienstverwaltung statt `systemctl` und Ereignisanzeige statt `journalctl`.

## 2.5 ServerRoot

Der `ServerRoot` ist das Heimatverzeichnis einer Apache-Installation. Dort liegen die Konfiguration, die Module und (je nach Layout) die Logs und Laufzeitdateien, und alle relativen Pfade in der Konfiguration werden von hier aus aufgelöst. Die Direktive `ServerRoot` setzt diesen Pfad, und er ist außerdem im Programm als Standardwert eingebaut (`HTTPD_ROOT`). Die Aussage „relativ zum ServerRoot“ taucht in der Dokumentation ständig auf: `LoadModule`-Pfade, `Include`-Dateien, `ErrorLog` und `PidFile` werden damit verstanden, solange sie nicht mit einem Schrägstrich beginnen.

Welcher `ServerRoot` bei einer vorhandenen Installation gilt, zeigt `apachectl -V`, der die Compile-Zeit-Einstellungen ausgibt. Auf der Testmaschine ergibt sich:

```bash
$ apache2ctl -V | grep -E "HTTPD_ROOT|SERVER_CONFIG_FILE|Server MPM"
Server MPM:     event
 -D HTTPD_ROOT="/etc/apache2"
 -D SERVER_CONFIG_FILE="apache2.conf"
```

Der `ServerRoot` ist hier `/etc/apache2`, die Hauptdatei heißt `apache2.conf`. Das verdeutlicht, wie unterschiedlich die Layouts sind: In einem Source Build liegt alles unter dem Präfix (`/usr/local/apache2` oder wie gewählt, im Test `/tmp/build/apache-inst`), bei RHEL-artigen Systemen ist es `/etc/httpd` mit `conf/httpd.conf`, und Debian hat die Aufteilung auf `/etc/apache2`, `/var/log/apache2` und `/var/www` spezifisch gelöst. Wer eine Anleitung liest, sollte daher immer prüfen, ob die genannten Pfade zur eigenen Distribution passen.

Die Debian-Variante zeigt eine Besonderheit, über die Neulinge stolpern. Die Konfiguration verwendet Variablen wie `${APACHE_LOG_DIR}` und `${APACHE_RUN_DIR}`, die in der Datei `/etc/apache2/envvars` definiert sind. Diese Datei liest nur das Hilfsprogramm `apache2ctl`, nicht das Programm `apache2` selbst. Ruft man `apache2 -V` direkt auf, erhält man deshalb eine Fehlermeldung statt der Ausgabe:

```text
$ apache2 -V
AH00111: Config variable ${APACHE_RUN_DIR} is not defined
apache2: Syntax error on line 80 of /etc/apache2/apache2.conf:
DefaultRuntimeDir must be a valid directory, absolute or relative to ServerRoot
```

Die Lösung ist einfach: Unter Debian und Ubuntu immer `apache2ctl` verwenden (für Prüfungen, `-S`, `-M`, `-t` und Neustarts), da es die Umgebung vorbereitet. Der Befehl `apache2ctl -t` lieferte in der Testumgebung `Syntax OK`.

Sicherheitsrelevant ist die Besitzverhältnisse am `ServerRoot`. Die Apache-Dokumentation empfiehlt, dass das Konfigurationsverzeichnis nur von `root` schreibbar ist: Wer die Konfiguration verändern darf, kann Apache beliebigen Code ausführen lassen (zum Beispiel über `LoadModule` oder `SetHandler`) und damit `root` übernehmen, weil der Elternprozess beim Start mit `root`-Rechten läuft. Auf der Testmaschine gehört `/etc/apache2/apache2.conf` entsprechend `root:root` mit den Rechten 644 (Lesen für alle, Schreiben nur für den Eigentümer).

Bei Nginx entspricht dem `ServerRoot` der *Präfix*: Er wird beim Bauen mit `--prefix` festgelegt und beim Start mit `-p` überschrieben, und relative Pfade in der Konfiguration beziehen sich darauf. Bei einem Source Build liegen `conf`, `logs` und `html` darunter; in der Debian-Paketversion sind die Pfade dagegen einzeln festgelegt (Konfiguration in `/etc/nginx`, Logs in `/var/log/nginx`, laut `nginx -V` der Präfix `/usr/share/nginx`). Einen vollständigen Überblick gibt `nginx -V`.

### Typische Fehler.

Der klassische Fehler ist ein relativer Pfad zur Konfigurationsdatei beim Aufruf mit `-f`: Er wird relativ zum `ServerRoot` der Standardkonfiguration aufgelöst, nicht relativ zum aktuellen Verzeichnis.

```bash
# falsch: sucht /etc/apache2/meine.conf
$ cd /tmp/demo-httpd && apache2 -f httpd.conf -t
AH00526 ... Could not open configuration file /etc/apache2/httpd.conf
# richtig: absoluter Pfad
$ apache2 -f /tmp/demo-httpd/httpd.conf -t
Syntax OK
```

> **Praxisbeispiel: Mehrere Instanzen nebeneinander**
>
> Mit eigenem `ServerRoot`, eigenem `PidFile` und eigenem Port lassen sich mehrere unabhängige Apache-Instanzen auf einem Server betreiben, zum Beispiel eine Testinstanz neben der produktiven. Dieses Prinzip ist die Grundlage aller Upgrade-Tests und liegt auch den Beispielen in diesem Skript zugrunde.

## 2.6 DocumentRoot

Der `DocumentRoot` ist das Verzeichnis, aus dem Apache Dateien ausliefert. Der Pfadteil der URL wird einfach an diesen Pfad angehängt: Bei `DocumentRoot "/var/www/html"` wird die Anfrage `/bilder/logo.png` zur Datei `/var/www/html/bilder/logo.png`. Jeder Virtual Host darf einen eigenen `DocumentRoot` haben (Modul 3). Ohne ihn gäbe es nichts zum Ausliefern, und ein falscher Pfad führt zu `404 Not Found` oder zu `403 Forbidden`.

Der Standardpfad unterscheidet sich je nach Herkunft. Auf Debian und Ubuntu ist es `/var/www/html`, auf RHEL-artigen Systemen `/var/www/html`, bei einem Source Build `<Präfix>/htdocs`. Der Pfad liegt bewusst *nicht* im Konfigurationsverzeichnis und nicht in Heimatverzeichnissen von Benutzern: Inhalte und Konfiguration haben verschiedene Lebenszyklen und verschiedene Zuständige, und Heimatverzeichnisse sind oft nur für den Eigentümer lesbar. Wichtig ist, dass Apache nicht über den `DocumentRoot` hinaus liefert, solange nichts anderes konfiguriert ist; `Alias` und symbolische Verknüpfungen können das aber ändern.

Für das Verzeichnis selbst braucht man zwei Dinge. Erstens die Freigabe in der Konfiguration. Hier ist Vorsicht bei der Erwartung geboten: Wo gar keine `Require`-Regel gilt, erlaubt Apache den Zugriff (im Test lieferte ein `DocumentRoot` ohne jeden `Directory`-Block den Statuscode 200). Die Standardkonfigurationen der Distributionen sperren das Dateisystem jedoch zunächst mit `<Directory /> Require all denied` und geben nur ausgewählte Verzeichnisse frei. Fügt man dort die Sperre hinzu, antwortet Apache mit 403 und im Errorlog steht `AH01630: client denied by server configuration`, bis ein `Directory`-Block mit `Require all granted` den Pfad freigibt. Zweitens sinnvolle `Options`, insbesondere für die Verzeichnisauflistung. Wird ein Verzeichnis angefragt und gibt es keine Indexdatei (`DirectoryIndex`, meist `index.html`), dann zeigt Apache entweder eine automatisch erzeugte Liste aller Dateien an (wenn `Indexes` aktiv und `mod_autoindex` geladen ist), oder es verweigert die Antwort. Die Testkonfiguration veranschaulicht beides:

```apache
DocumentRoot "/tmp/demo-httpd/htdocs"
<Directory "/tmp/demo-httpd/htdocs">
    Require all granted
    # Options +Indexes      <- nur bei Bedarf einschalten
</Directory>
```

Ohne `Indexes` liefert eine Anfrage an ein leeres Verzeichnis den Statuscode 403, und das Errorlog nennt den Grund:

```text
[autoindex:error] ... AH01276: Cannot serve directory /tmp/demo-httpd/htdocs/leer/:
No matching DirectoryIndex (index.html) found, and server-generated directory
index forbidden by Options directive
```

Mit `Options +Indexes` und geladenem `mod_autoindex` erscheint stattdessen eine Seite mit dem Titel `Index of /leer`. Das ist ein Komfort für Downloadbereiche, aber auch ein Risiko: Man legt damit ungewollt Dateien offen, etwa Sicherungen oder Konfigurationsdateien. Deshalb gilt die Regel, `Indexes` nur gezielt für einzelne Verzeichnisse zu aktivieren.

Auch symbolische Verknüpfungen (*Symlinks*) im `DocumentRoot` verdienen Aufmerksamkeit. `Options FollowSymLinks` erlaubt Apache, ihnen zu folgen; damit können Inhalte außerhalb des `DocumentRoot` erreichbar werden. Die schärfere Variante `SymLinksIfOwnerMatch` folgt Verknüpfungen nur, wenn Verknüpfung und Ziel denselben Eigentümer haben. Auf Systemen mit *SELinux* (RHEL-artig) kommt eine zusätzliche Schicht hinzu: Dateien müssen den Sicherheitskontext `httpd_sys_content_t` tragen, sonst verweigert der Kernel den Zugriff trotz korrekter Unix-Rechte. Ein neuer `DocumentRoot` außerhalb von `/var/www` braucht deshalb eine Kontextregel (`semanage fcontext` und `restorecon`).

Bei Nginx übernimmt die Direktive `root` diese Aufgabe; sie kann in `http`, `server` oder `location` stehen. Der Unterschied zu `alias` (der den Präfix der Location ersetzt statt ihn anzuhängen) ist Thema von Modul 5.

### Typische Fehler.

Der häufigste Fehler ist ein fehlendes `Require all granted` für ein neues Verzeichnis außerhalb der Standardpfade, wenn die Basiskonfiguration das Dateisystem sperrt (wie bei Distributionspaketen): Die Folge ist ein 403, obwohl die Dateirechte stimmen. Der zweite Fehler ist ein `DocumentRoot` in einem Verzeichnis, das für den Webserver-Benutzer nicht durchlaufbar ist (Einheit 2.8).

```apache
# falsch: neues Verzeichnis ohne Freigabe -> 403 bei gesperrter Basis
DocumentRoot "/srv/shop/public"

# richtig: Freigabe und bewusst gewählte Optionen
DocumentRoot "/srv/shop/public"
<Directory "/srv/shop/public">
    Require all granted
    Options -Indexes +FollowSymLinks
</Directory>
```

> **Praxisbeispiel: Inhalte getrennt von der Anwendung**
>
> Bewährt hat sich, nur das öffentliche Unterverzeichnis einer Anwendung (oft `public`) als `DocumentRoot` zu verwenden und Konfigurationsdateien, Quelltexte und Zugangsdaten außerhalb davon abzulegen. So kann auch ein Konfigurationsfehler des Webservers keine geheimen Dateien ausliefern.

## 2.7 Dedicated User

Ein Webserver verarbeitet Daten aus dem Internet und ist deshalb ein bevorzugtes Angriffsziel. Das Prinzip der *minimalen Rechte* (*Least Privilege*) fordert, dass er nur das darf, was er für seine Arbeit braucht. Der wichtigste Baustein ist ein *dedizierter Benutzer*: ein eigenes Systemkonto, unter dem die Arbeitsprozesse laufen und das sonst nichts besitzt. Unter Debian und Ubuntu heißt es `www-data`, unter RHEL-artigen Systemen `apache` (bei Nginx-Paketen von nginx.org `nginx`), und ein Source Build von Apache läuft zunächst als `daemon`.

Wie ein solches Konto aussieht, zeigt der Eintrag der Testmaschine:

```text
$ getent passwd www-data
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
```

Die Felder bedeuten: Name, Platzhalter für das Passwort, Benutzer- und Gruppennummer (33), Beschreibung, Heimatverzeichnis (`/var/www`) und Anmeldeprogramm. Das Programm `/usr/sbin/nologin` bedeutet, dass sich unter diesem Konto niemand interaktiv anmelden kann. Ein Systemkonto hat weder ein gültiges Passwort noch eine Shell, und das ist Absicht: Selbst wenn ein Angreifer den Prozess übernimmt, kann er sich nicht ohne Weiteres an der Maschine anmelden.

Einstellen lässt sich der Benutzer in beiden Servern. Bei Apache dienen die Direktiven `User` und `Group`; unter Debian werden sie über Variablen in `/etc/apache2/envvars` (`APACHE_RUN_USER` und `APACHE_RUN_GROUP`) gesetzt. Bei Nginx steht die Direktive `user` im `main`-Kontext von `nginx.conf` (Debian: `user www-data;`). In beiden Fällen läuft nur der Elternprozess (Apache) bzw. Master-Prozess (Nginx) als `root`, damit er die privilegierten Ports 80 und 443 öffnen kann; die Arbeitsprozesse wechseln anschließend auf den eingestellten Benutzer.

Wer das Konto selbst anlegt, tut es als Systemkonto ohne Anmeldeprogramm:

```bash
$ sudo groupadd --system webgrp
$ sudo useradd --system --gid webgrp --home-dir /var/www \
      --shell /usr/sbin/nologin webuser
```

Die Option `--system` legt ein Systemkonto mit niedriger Nummer an, das nicht in Anmeldedialogen erscheint. `--shell /usr/sbin/nologin` verhindert die Anmeldung. In der Apache-Konfiguration trägt man dann `User webuser` und `Group webgrp` ein. Auf Systemen mit mehreren Websites kann man noch weiter gehen und jeder Anwendung ein eigenes Konto geben, indem man etwa PHP-FPM mit getrennten Pools betreibt (Modul 4).

### Typische Fehler.

Der gefährlichste Fehler wäre, die Arbeitsprozesse als `root` laufen zu lassen. Apache verhindert das ausdrücklich: Trägt man `User root` ein, lehnt `apache2 -t` die Konfiguration ab, und die Meldung nennt die Gründe:

```text
AH00526: Syntax error on line 16 of /tmp/demo-httpd/t9.conf:
Error: Apache has not been designed to serve pages while running as root.
There are known race conditions that will allow any local user to read any
file on the system. [...] It is strongly suggested that you instead modify
the User directive in your httpd.conf file to list a non-root user.
```

Die Meldung ist im Original einzeilig und enthält die Zeichenfolgen `\n` und `\t` wörtlich; hier wurde sie lesbar umgebrochen und gekürzt. Der zweite Fehler ist, den Webserver-Benutzer zum Eigentümer der Webinhalte zu machen (siehe Einheit 2.8). Der dritte ist ein zu knapp bemessenes Konto, das auf Verzeichnisse nicht zugreifen kann, die es braucht, etwa das Logverzeichnis; das führt zu Startfehlern.

> **Ergänzung aus der Nachrecherche: Nginx und das Standardkonto**
>
> Ein Nginx ohne `user`-Direktive läuft laut Source-Build-Test mit dem Konto `nobody` (die Arbeitsprozesse in der Prozessliste der Testinstanz). Das Konto `nobody` wird von vielen Diensten geteilt; das widerspricht der Idee eines dedizierten Benutzers, weil sich dann mehrere Dienste dieselben Rechte teilen. Man setzt deshalb in produktiven Konfigurationen `user` ausdrücklich auf ein eigenes Konto.

> **Praxisbeispiel: Prüfen, wer wirklich läuft**
>
> Bei einer Übernahme prüft man sofort die Prozessliste (`ps -eo user,pid,args | grep -E "apache|nginx|httpd"`): Läuft etwas außer dem Master unter `root`? Oder unter einem Konto, das auch andere Dienste nutzt? Diese Fünf-Sekunden-Prüfung deckt häufig grundlegende Konfigurationsmängel auf.

## 2.8 Dateirechte

Unter Linux regeln *Dateirechte*, wer eine Datei lesen, schreiben oder ausführen darf. Jede Datei hat einen Eigentümer, eine Gruppe und drei Rechtegruppen: für den Eigentümer, die Gruppe und alle anderen. Jede Gruppe kann `r` (lesen), `w` (schreiben) und `x` (ausführen) enthalten. Als Zahl notiert man die Rechte oktal: `r` ist 4, `w` ist 2, `x` ist 1, die Summe je Gruppe ergibt eine Ziffer. `644` bedeutet also: Eigentümer darf lesen und schreiben (6), Gruppe und andere dürfen lesen (4 und 4). Bei *Verzeichnissen* bedeutet `x` „darf hineinwechseln und auf Einträge zugreifen“; ohne dieses Recht ist ein Verzeichnis für den Betreffenden eine Sperre, selbst wenn die darin liegenden Dateien lesbar sind.

Für einen Webserver heißt das: Der Arbeitsprozess muss jedes Verzeichnis *entlang des ganzen Pfades* durchlaufen dürfen (`x`) und die auszuliefernde Datei lesen dürfen (`r`). Die Anzeige aller Rechte entlang eines Pfades liefert der Befehl `namei -l`:

```text
$ namei -l /tmp/demo-httpd/htdocs/geheim/a.txt
f: /tmp/demo-httpd/htdocs/geheim/a.txt
drwxr-xr-x root root /
drwxrwxrwt root root tmp
drwxr-xr-x root root demo-httpd
drwxr-xr-x root root htdocs
drwx------ root root geheim
-rw-r--r-- root root a.txt
```

Die Datei `a.txt` selbst ist für alle lesbar. Das Verzeichnis `geheim` gehört aber `root` und hat die Rechte `700`; niemand außer `root` darf hinein. Für den Webserver-Benutzer ist die Datei damit unerreichbar, wie der Test mit `www-data` bestätigt: `cat: ...: Permission denied`. Ruft man dieselbe Datei über Apache auf, antwortet der Server mit `403 Forbidden`, und das Errorlog enthält die Ursache:

```text
[core:crit] (13)Permission denied: [client 127.0.0.1:32786] AH00529:
/tmp/demo-httpd/htdocs/geheim/.htaccess pcfg_openfile: unable to check htaccess
file, ensure it is readable and that '/tmp/demo-httpd/htdocs/geheim/' is executable
```

Die Meldung nennt das Verzeichnis und das fehlende Ausführungsrecht. Die Reihenfolge der Fehlersuche folgt daraus: Zuerst das Errorlog lesen, dann mit `namei -l` den Pfad abgehen, bis das Verzeichnis ohne `x` für den Webserver-Benutzer gefunden ist.

Aus den Standardwerten der Testmaschine lässt sich ein sinnvolles Muster ablesen: Die Konfigurationsdatei `/etc/apache2/apache2.conf` gehört `root:root` (Rechte 644), das Logverzeichnis `/var/log/apache2` gehört `root:adm` mit `750`, sodass nur `root` und die Gruppe `adm` Logs lesen können, und `/var/www/html` gehört `root:root` mit `755`. Für Webinhalte empfiehlt sich eine Dreiteilung. Die *Konfiguration* gehört `root` und ist für andere nur lesbar. Die *Inhalte* gehören einem Bereitstellungskonto (zum Beispiel dem Deployment-Benutzer), und der Webserver-Benutzer erhält über die Gruppe nur Leserechte (Verzeichnisse `750`, Dateien `640`). Für *Schreibverzeichnisse* (Uploads, Caches) bekommt der Webserver-Benutzer gezielt Schreibrechte, und diese Verzeichnisse liegen möglichst außerhalb der Dokumentenwurzel oder werden so konfiguriert, dass dort keine Skripte ausgeführt werden.

```bash
$ sudo chown -R deploy:www-data /srv/shop
$ sudo find /srv/shop -type d -exec chmod 750 {} \;
$ sudo find /srv/shop -type f -exec chmod 640 {} \;
# Upload-Verzeichnis: Webserver darf schreiben
$ sudo chown www-data:www-data /srv/shop/uploads && sudo chmod 750 /srv/shop/uploads
```

Die erste Zeile weist Eigentümer und Gruppe zu, die beiden `find`-Befehle setzen Verzeichnisse und Dateien getrennt (Dateien brauchen kein `x`), und die letzte Zeile öffnet nur das Upload-Verzeichnis. Wichtig ist die *umask*, also die Maske, die festlegt, welche Rechte neue Dateien erhalten. Der Standardwert `0022` (Testmaschine) macht neue Dateien für alle lesbar (644) und neue Verzeichnisse für alle durchlaufbar (755). Wer strengere Rechte braucht, setzt für den Dienst eine strengere Maske, zum Beispiel `UMask=0027` in der systemd-Unit.

### Typische Fehler.

Der Klassiker ist `chmod 777`, das „alles funktioniert“ erzwingt und jedem lokalen Benutzer Schreibrechte gibt. Es ist keine Lösung, sondern ein Sicherheitsproblem. Ein zweiter Fehler ist, nur die Datei zu prüfen, nicht den gesamten Pfad, und ein dritter, die Rechte rekursiv auf alle Dateien gleich zu setzen und damit Skripten das Ausführungsrecht zu geben, das sie nicht brauchen.

```bash
# falsch: jeder darf alles
$ sudo chmod -R 777 /srv/shop
# richtig: Rechte gezielt vergeben, Pfad prüfen
$ namei -l /srv/shop/public/index.html
$ sudo chmod 750 /srv/shop /srv/shop/public
```

> **Praxisbeispiel: 403 nach dem Deployment**
>
> Ein Klassiker im Betrieb: Nach einem Deployment liefert die Anwendung plötzlich 403, weil das Bereitstellungswerkzeug neue Dateien mit anderem Eigentümer oder einer strengeren umask angelegt hat. Ein Blick in das Errorlog, gefolgt von `namei -l`, löst solche Fälle meist in Minuten. Dauerhaft hilft, die Rechte im Deployment-Skript ausdrücklich zu setzen, statt sich auf Standardwerte zu verlassen.

## 2.9 nginx.conf Aufbau

Die gesamte Konfiguration von Nginx steht in Textdateien, und die Einstiegsdatei heißt `nginx.conf`. Ihr Ort hängt vom Layout ab: `/etc/nginx/nginx.conf` bei Paketen, `<Präfix>/conf/nginx.conf` bei einem Source Build (Standard-Präfix `/usr/local/nginx`). Wo die Datei eines laufenden Servers liegt, verrät `nginx -V` in der Zeile `--conf-path`. Auf der Testmaschine lautet sie `--conf-path=/etc/nginx/nginx.conf`.

Der Aufbau folgt der in Modul 1 eingeführten Hierarchie aus Kontexten. Direktiven außerhalb jedes Blocks stehen im *main*-Kontext und gelten für den ganzen Prozess; `events` und `http` sind Blöcke in `main`, `server` liegt in `http` und `location` in `server`. Eine *einfache Direktive* besteht aus Name und Parametern und endet mit einem Semikolon, eine *Blockdirektive* hat statt des Semikolons geschweifte Klammern. Kommentare beginnen mit `#`. Die folgende Datei ist die (um Kommentare gekürzte) Standardkonfiguration des Ubuntu-Pakets:

```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;
error_log /var/log/nginx/error.log;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 768;
}

http {
    sendfile on;
    tcp_nopush on;
    types_hash_max_size 2048;
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    access_log /var/log/nginx/access.log;
    gzip on;
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

Die Datei lässt sich in vier Blöcken lesen. Im *main*-Kontext stehen der Benutzer der Arbeitsprozesse (`user`), deren Anzahl (`worker_processes auto` bedeutet: so viele wie CPU-Kerne), die PID-Datei, das Errorlog und eine `include`-Zeile für ladbare Module. Der Block `events` legt fest, wie viele Verbindungen ein Arbeitsprozess höchstens hält (768). Im `http`-Block stehen Voreinstellungen für alle Server: `sendfile` lässt den Kernel Dateien direkt an den Socket schicken, `include .../mime.types` lädt die Zuordnung von Dateiendungen zu Inhaltstypen, `default_type` gilt für alles Unbekannte, `gzip on` schaltet die Komprimierung ein. Die beiden letzten `include`-Zeilen holen die eigentlichen *Server*-Definitionen aus anderen Dateien (Einheit 2.10). Die Datei enthält selbst keinen `server`-Block, die Aufteilung ist Absicht.

Das Prinzip der *Vererbung* gilt wie bei Apache: Direktiven, die in einem äußeren Kontext stehen, gelten in den inneren, sofern sie dort nicht überschrieben werden. Setzt man `gzip on` im `http`-Block, gilt es für alle Server, und ein einzelner `server` kann es mit `gzip off` abschalten. Das ist sehr praktisch, kann aber überraschen: Setzt man in einer `location` auch nur eine einzige `add_header`-Direktive, gehen alle `add_header`-Zeilen der äußeren Ebenen für diese Location verloren, weil Listen nicht addiert, sondern ersetzt werden (Modul 10).

Zwei Befehle begleiten das Arbeiten mit der Konfiguration. `nginx -t` prüft die Syntax und die Erreichbarkeit der referenzierten Dateien, ohne den Server zu verändern. `nginx -T` (großes T) prüft zusätzlich und gibt die *gesamte, zusammengesetzte Konfiguration* aus, also die Hauptdatei samt aller eingebundenen Dateien, jeweils mit einer Kommentarzeile, aus welcher Datei der Abschnitt stammt. Das ist das wichtigste Werkzeug, um eine fremde Installation zu verstehen:

```text
$ nginx -T -c /tmp/demo-nginx/nginx.conf -p /tmp/demo-nginx/
nginx: the configuration file /tmp/demo-nginx/nginx.conf syntax is ok
nginx: configuration file /tmp/demo-nginx/nginx.conf test is successful
# configuration file /tmp/demo-nginx/nginx.conf:
worker_processes 2;
pid /tmp/demo-nginx/nginx.pid;
...
```

Man erkennt zuerst die Prüfergebnisse und danach die Konfiguration, beginnend mit der Kommentarzeile `# configuration file ...`. Bei einer Paketinstallation folgen anschließend die Inhalte aller per `include` eingebundenen Dateien. Die Ausgabe eignet sich, um sie in ein Ticket zu kopieren oder in ein Versionskontrollsystem einzuchecken.

### Typische Fehler.

Der häufigste Fehler ist ein vergessenes Semikolon oder eine nicht geschlossene Klammer. Die zweite typische Fehlerquelle ist ein Direktivenname im falschen Kontext, zum Beispiel `server_name` außerhalb eines `server`-Blocks: Nginx meldet dann `"server_name" directive is not allowed here`. Der dritte Fehler ist, die Datei zu ändern und den Server weiterlaufen zu lassen, ohne zu laden. Auch Nginx liest die Konfiguration nur beim Start und bei einem Reload.

```nginx
# falsch: Direktive im main-Kontext, wo sie nicht erlaubt ist
server_name beispiel.test;
events { worker_connections 512; }

# richtig: server_name gehört in einen server-Block
http {
    server {
        server_name beispiel.test;
    }
}
```

> **Praxisbeispiel: Hauptdatei schlank halten**
>
> In sauber gepflegten Installationen enthält `nginx.conf` nur globale Einstellungen; jede Website bekommt eine eigene Datei. So ist ein Diff im Versionskontrollsystem auf genau eine Website bezogen, und man kann eine Website abschalten, indem man ihre Datei aus dem Include-Verzeichnis nimmt.

## 2.10 conf.d und sites-enabled

Die Aufteilung der Konfiguration in viele kleine Dateien ist bei beiden Servern gebräuchlich, aber jede Distribution geht etwas anders damit um. Das gemeinsame Ziel: Man will eine Website hinzufügen oder abschalten, ohne die Hauptdatei anzufassen und ohne Inhalte zu löschen. Zwei Muster haben sich durchgesetzt. Das erste ist das einfache Verzeichnis, aus dem alle `*.conf`-Dateien eingelesen werden (`conf.d`); das zweite die Trennung in `sites-available` (alle vorhandenen Definitionen) und `sites-enabled` (nur die aktiven, als symbolische Verknüpfungen auf `sites-available`).

Das `sites-available`/`sites-enabled`-Muster stammt aus der Debian-Welt. Dort liegen die Definitionen unter `sites-available`, und das Einschalten besteht aus dem Anlegen einer Verknüpfung. Für Apache gibt es dazu Hilfsprogramme, die die Verknüpfung anlegen und eine Erinnerung an den Neuladebefehl ausgeben. Die Ausgaben der Testmaschine:

```bash
$ sudo a2dissite 000-default
Site 000-default disabled.
To activate the new configuration, you need to run:
  service apache2 reload
$ sudo a2ensite 000-default
Enabling site 000-default.
To activate the new configuration, you need to run:
  service apache2 reload
$ ls -l /etc/apache2/sites-enabled
lrwxrwxrwx 1 root root 35 ... 000-default.conf -> ../sites-available/000-default.conf
```

`a2dissite` entfernt die Verknüpfung, `a2ensite` legt sie an; die Konfigurationsdatei in `sites-available` bleibt unverändert. Die Ausgabe zeigt außerdem, dass die Änderung noch *nicht aktiv* ist, bis man neu lädt. Entsprechende Programme existieren für Module (`a2enmod`, `a2dismod`) und zusätzliche Konfigurationsschnipsel (`a2enconf`, `a2disconf`). Der Apache bindet die Verzeichnisse `mods-enabled`, `conf-enabled` und `sites-enabled` in `apache2.conf` per `IncludeOptional` ein.

Für Nginx gibt es unter Debian keine Hilfsprogramme, man legt die Verknüpfung von Hand an. Die Hauptdatei bindet `sites-enabled/*` ein, und das Paket liefert eine `default`-Seite mit. Das Einschalten einer neuen Seite geht so:

```bash
$ sudo nano /etc/nginx/sites-available/shop.conf
$ sudo ln -s /etc/nginx/sites-available/shop.conf /etc/nginx/sites-enabled/shop.conf
$ sudo nginx -t && sudo systemctl reload nginx
```

Die erste Zeile legt die Definition an, die zweite schaltet sie durch die Verknüpfung ein, die dritte prüft und lädt die Konfiguration. Zum Ausschalten genügt `rm` auf die *Verknüpfung*, die Originaldatei bleibt erhalten. Die Pakete von nginx.org und RHEL-artige Systeme verwenden dagegen nur `conf.d`: Das Paket legt dort eine Datei `default.conf` an, alle `*.conf` in `conf.d` werden geladen, und zum Abschalten benennt man eine Datei um, sodass sie nicht mehr auf `*.conf` passt. Ähnlich ist es bei Apache unter RHEL: `conf.d/*.conf` für Konfigurationen und `conf.modules.d/*.conf` für Module.

Die Mustererkennung ist der Schlüssel zu einer häufigen Falle. Nginx bindet unter Debian `sites-enabled/*` ein, *also jede Datei*, nicht nur Dateien mit der Endung `.conf`. Legt man eine Sicherungskopie wie `default.bak` dort ab, wird sie mitgeladen, und die Definitionen kollidieren. Auf der Testmaschine ergibt eine Kopie der Standardseite:

```text
$ sudo cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak
$ sudo nginx -t
[emerg] a duplicate default server for 0.0.0.0:80 in /etc/nginx/sites-enabled/default.bak:22
nginx: configuration file /etc/nginx/nginx.conf test failed
```

Die Meldung nennt Datei und Zeile des Konflikts, zwei Standardserver für denselben Port. Gelöst wird sie, indem man die Sicherung *außerhalb* des Include-Verzeichnisses ablegt. Die Testumgebung hat keinen IPv6-Stack, weshalb ein `nginx -t` der unveränderten Paketkonfiguration dort bei der `listen [::]:80`-Zeile an einer anderen Meldung (`Address family not supported by protocol`) scheiterte, die mit dem Thema nichts zu tun hat und auf einem normalen Server nicht auftritt.

### Typische Fehler.

Neben der Sicherungsdatei gibt es zwei häufige Probleme. Erstens: Die Standardseite bleibt aktiv, und neue Seiten werden von ihr „überschattet“, weil sie als Standardserver auf Port 80 jede unbekannte Anfrage bekommt. Zweitens: Eine Verknüpfung zeigt auf eine nicht mehr vorhandene Datei (*kaputter Symlink*), und der Dienst startet nicht mehr.

```bash
# falsch: Sicherung im Include-Verzeichnis
$ sudo cp site.conf /etc/nginx/sites-enabled/site.conf.bak
# richtig: Sicherung ausserhalb ablegen
$ sudo cp site.conf /root/backup/site.conf.2026-10-31
```

> **Praxisbeispiel: Eine Site, eine Datei**
>
> In Betrieb bewährt sich die Konvention „eine Website, eine Datei, benannt nach dem Hauptdomainnamen“. Sie macht das Auffinden einfach, das Abschalten gefahrlos und die Versionskontrolle übersichtlich. Automatisierungswerkzeuge wie Ansible arbeiten nach demselben Muster (Modul 12).

## 2.11 Firewall und Ports

Ein Webserver ist nur erreichbar, wenn drei Dinge zusammenpassen: Der Server *lauscht* auf einem Port, die *Firewall* lässt den Verkehr zu diesem Port durch, und im Netz dazwischen (Router, Cloud-Sicherheitsgruppe) ist der Weg frei. Ein *Port* ist eine Nummer, die einen Dienst auf einem Rechner adressiert; HTTP verwendet standardmäßig 80, HTTPS 443. Ports unterhalb von 1024 sind *privilegiert*: Nur ein Prozess mit entsprechenden Rechten darf sie öffnen, weshalb Apache und Nginx mit `root`-Rechten starten und diese Rechte nach dem Öffnen der Ports abgeben.

Bei Apache legt die Direktive `Listen` fest, wo der Server lauscht, bei Nginx die Direktive `listen` im `server`-Block. Angegeben werden Adresse und Port, wobei die Adresse die Erreichbarkeit stark einschränkt: `127.0.0.1:8080` ist nur lokal erreichbar, ein reiner Port wie `80` auf allen Schnittstellen. Unter Debian steht das Apache-`Listen` in `ports.conf`; das Paket öffnet 80 und, wenn `mod_ssl` geladen ist, zusätzlich 443:

```apache
Listen 80
<IfModule ssl_module>
    Listen 443
</IfModule>
```

Welche Prozesse an welchen Ports lauschen, zeigt `ss`. Die Optionen stehen für TCP (`-t`), lauschende Sockets (`-l`), numerische Anzeige (`-n`) und den zugehörigen Prozess (`-p`):

```text
$ sudo ss -ltnp | grep 8080
LISTEN 0  511  127.0.0.1:8080  0.0.0.0:*  users:(("apache2",pid=20832,fd=3),...)
```

Das Ergebnis ist die schnellste Antwort auf die Frage „Wer belegt diesen Port?“ Es zeigt Adresse, Port und Prozess. Der wichtigste Fehler an dieser Stelle ist ein Portkonflikt: Versucht ein zweiter Server, denselben Port zu öffnen, scheitert er. Die Meldung aus dem Test lautet:

```text
(98)Address already in use: AH00072: make_sock: could not bind to address 127.0.0.1:8080
no listening sockets available, shutting down
AH00015: Unable to open logs
```

Die Ursache ist fast immer eine zweite Instanz (etwa Apache und Nginx beide auf Port 80) oder ein nicht beendeter alter Prozess. Die Lösung: Mit `ss -ltnp` den Verursacher finden und entweder beenden oder einen anderen Port wählen.

Die *Firewall* entscheidet, welche Verbindungen das System überhaupt annimmt. Unter Linux arbeitet im Kern `nftables` (früher `iptables`); für Administratoren gibt es einfachere Oberflächen. Unter Ubuntu ist das `ufw`, das Anwendungsprofile für Webserver mitbringt, unter RHEL-artigen Systemen `firewalld`, das mit Diensten statt mit Portnummern arbeitet:

```bash
# Ubuntu / Debian mit ufw
$ sudo ufw allow 'Nginx Full'        # oder 'Apache Full': Ports 80 und 443
$ sudo ufw status

# RHEL, AlmaLinux, Rocky mit firewalld
$ sudo firewall-cmd --permanent --add-service=http --add-service=https
$ sudo firewall-cmd --reload
$ sudo firewall-cmd --list-all
```

Die Profile `Nginx Full` und `Apache Full` öffnen 80 und 443 gemeinsam. Bei `firewalld` bewirkt `--permanent` die dauerhafte Speicherung, und erst `--reload` macht die Änderung wirksam. Diese Befehle wurden in der Testumgebung nicht ausgeführt, weil dort keine Firewall-Dienste laufen; sie entsprechen den gängigen Werkzeugen der Distributionen. Läuft der Server auf einem nichtstandardmäßigen Port wie 8080, muss man diesen Port explizit freigeben (`--add-port=8080/tcp`). Auf RHEL-artigen Systemen schränkt zudem *SELinux* ein, auf welchen Ports Webserver lauschen dürfen; ein zusätzlicher Port wird mit `semanage port -a -t http_port_t -p tcp 8080` erlaubt.

Mit Blick auf Modul 6 sei erwähnt, dass HTTP/3 nicht TCP, sondern *UDP* auf Port 443 nutzt. Eine Firewall, die nur TCP/443 freigibt, bremst HTTP/3 aus; Clients fallen dann auf HTTP/2 zurück.

### Typische Fehler.

Der Klassiker lautet „lokal geht, von außen nicht“. Dann liegt es fast immer an einer von drei Ursachen: Der Server lauscht nur auf `127.0.0.1` (`ss` prüfen), die lokale Firewall blockiert, oder eine vorgelagerte Firewall (Cloud-Sicherheitsgruppe) lässt den Port nicht durch. Systematisches Vorgehen von innen nach außen, zuerst `curl localhost`, dann `curl` mit der Serveradresse von einem anderen Rechner, grenzt den Ort des Problems ein.

```nginx
# falsch: bindet nur an Loopback, von aussen nicht erreichbar
server { listen 127.0.0.1:80; }
# richtig: auf allen IPv4-Schnittstellen (und IPv6)
server { listen 80; listen [::]:80; }
```

> **Merke**
>
> Fehlersuche bei „nicht erreichbar“: Lauscht der Dienst (`ss -ltnp`)? Antwortet er lokal (`curl localhost`)? Lässt die Host-Firewall den Port zu? Lässt die Netzwerk-Firewall ihn zu? In dieser Reihenfolge, von innen nach außen.

> **Praxisbeispiel: Minimale Angriffsfläche**
>
> Auf einem Webserver sollten nur die Ports offen sein, die ein Dienst wirklich braucht, und Verwaltungsports (zum Beispiel SSH) nur aus bekannten Netzen. Ein regelmäßiger Abgleich von `ss -ltnp` mit den Firewallregeln deckt vergessene Dienste auf, etwa eine Testinstanz auf Port 8080, die jemand nie abgebaut hat.

## Übungsaufgaben

Die Aufgaben steigen im Schwierigkeitsgrad. Die Aufgaben 6 bis 8 sind praktische Aufgaben, die Sie in einer Testumgebung (virtuelle Maschine oder Container, nicht auf einem Produktivsystem) nachbauen sollten. Die Lösungen folgen im nächsten Abschnitt.

**Aufgabe 1 (leicht).** Sie installieren auf einem frisch aufgesetzten Ubuntu-Server und auf einem AlmaLinux-Server jeweils den Apache HTTP Server mit dem Paketmanager. Nennen Sie zu Paketnamen, Verhalten nach der Installation und Firewall jeweils die Unterschiede.

**Aufgabe 2 (leicht).** Ein Apache hat `ServerRoot "/etc/apache2"`. In der Konfiguration stehen `LoadModule alias_module modules/mod_alias.so` und `ErrorLog logs/error.log`. Zu welchen Dateipfaden führen diese Zeilen? Und welche Datei wird bei `DocumentRoot "/var/www/html"` für die Anfrage `/bilder/logo.png` ausgeliefert?

**Aufgabe 3 (leicht).** Übersetzen Sie die Rechte: (a) `rwxr-x---` in Oktalschreibweise, (b) `640` in die `rwx`-Schreibweise, (c) Welche Oktalrechte sind für Verzeichnisse und welche für Dateien eines Webauftritts sinnvoll, wenn der Webserver nur lesen soll?

**Aufgabe 4 (mittel).** Erklären Sie, was in einer systemd-Unit `Type=forking`, `ExecReload` und `KillMode=mixed` bedeuten, und warum man Änderungen an einer Paket-Unit nicht direkt in `/usr/lib/systemd/system` vornehmen soll. Was ist die Alternative?

**Aufgabe 5 (mittel).** Ein Apache liefert für `/intern/daten.pdf` den Statuscode 403. Das Errorlog enthält `AH00529: ... unable to check htaccess file, ensure it is readable and that '/srv/web/intern/' is executable`. Die Ausgabe von `namei -l /srv/web/intern/daten.pdf` ist unten abgedruckt. Finden Sie die Ursache und beheben Sie sie mit möglichst wenig Rechten.

```text
drwxr-xr-x root     root     /
drwxr-xr-x root     root     srv
drwxr-xr-x root     root     web
drwx------ deploy   deploy   intern
-rw-r----- deploy   www-data daten.pdf
```

**Aufgabe 6 (praktisch).** Schreiben Sie ein systemd-Drop-in für den Dienst `nginx`, das die Zahl der offenen Dateien auf 65535 erhöht. Nennen Sie alle Befehle, um das Drop-in anzulegen, zu aktivieren und zu überprüfen, dass die Grenze für den laufenden Prozess gilt.

**Aufgabe 7 (praktisch).** Bauen Sie eine zweite, unabhängige Apache-Instanz: Port 8082 nur auf der Loopback-Adresse, Dokumentenverzeichnis `/tmp/aufg7/htdocs`, eigene PID-, Log- und Laufzeitdateien unter `/tmp/aufg7`, MPM `event`, Verzeichnislisting verboten. Prüfen Sie die Konfiguration, starten Sie die Instanz, rufen Sie die Seite ab und prüfen Sie mit `ss`, dass der Port lauscht.

**Aufgabe 8 (praktisch).** Richten Sie bei Nginx im Debian-Stil eine Site `intern.test` ein: Dokumentenverzeichnis `/srv/intern`, `index.html` als Startseite, Zugriff nur aus dem Netz `10.0.0.0/8`. Legen Sie die Datei in `sites-available` an, aktivieren Sie sie über `sites-enabled` und prüfen Sie die Konfiguration.

**Aufgabe 9 (schwer).** Ein neu installierter Nginx-Server ist lokal erreichbar (`curl localhost` liefert die Seite), von einem anderen Rechner aus aber nicht (Verbindung läuft in ein Timeout). Beschreiben Sie das systematische Vorgehen und nennen Sie je Schritt den Befehl. Entwerfen Sie anschließend ein Rechtekonzept für `/srv/shop`: Es gibt einen Bereitstellungsbenutzer `deploy`, den Webserver-Benutzer `www-data`, ein Upload-Verzeichnis `uploads` und ein Verzeichnis `config` mit Zugangsdaten, die der Webserver nicht lesen soll.

## Lösungen und Erklärungen

### Lösung zu Aufgabe 1.

Paketnamen: Ubuntu `apache2`, AlmaLinux `httpd`; Installationsbefehl `apt install` bzw. `dnf install`. Verhalten nach der Installation: Ubuntu startet den Dienst sofort und aktiviert ihn für den Systemstart; AlmaLinux tut keines von beidem, dort braucht es `systemctl enable --now httpd`. Firewall: Auf Ubuntu ist `ufw` üblicherweise nicht aktiv oder wird mit Profilen wie `Apache Full` gesteuert; auf AlmaLinux läuft `firewalld` standardmäßig, und man muss `http` und `https` freigeben und neu laden.

### Lösung zu Aufgabe 2.

Relative Pfade gelten ab `ServerRoot`. Die Moduldatei ist `/etc/apache2/modules/mod_alias.so`, das Errorlog `/etc/apache2/logs/error.log`. (Auf Debian liegen die Module real unter `/usr/lib/apache2/modules`; das Beispiel dient nur dem Verständnis der Auflösung, und die Debian-Konfiguration umgeht es mit Variablen und eigenen Pfaden.) Die Anfrage wird an den `DocumentRoot` angehängt: `/var/www/html/bilder/logo.png`.

### Lösung zu Aufgabe 3.

\(a\) `rwx` = 4+2+1 = 7, `r-x` = 4+1 = 5, `---` = 0, also `750`. (b) `6` = `rw-`, `4` = `r--`, `0` = `---`, also `rw-r-----`. (c) Verzeichnisse brauchen das Ausführungsrecht, um durchlaufen zu werden, also `750`; Dateien genügt das Leserecht, also `640`. Bei beiden hat der Eigentümer volle Rechte (bzw. Lesen und Schreiben), die Gruppe des Webservers nur Lesen (und Durchlaufen), alle anderen nichts.

### Lösung zu Aufgabe 4.

`Type=forking` sagt systemd, dass der gestartete Prozess sich abspaltet und der Dienst im Kindprozess weiterläuft; systemd wartet, bis der Startbefehl zurückkehrt. `ExecReload` gibt das Kommando an, das bei `systemctl reload` ausgeführt wird (bei Apache `apachectl graceful`, bei Nginx `nginx -s reload`), ohne den Dienst zu beenden. `KillMode=mixed` sendet das Stoppsignal nur an den Hauptprozess und beendet verbliebene Kindprozesse später hart. Die Paket-Unit würde durch ein Paketupdate überschrieben; die Alternative ist ein *Drop-in* unter `/etc/systemd/system/<dienst>.service.d/`, am einfachsten mit `systemctl edit`.

### Lösung zu Aufgabe 5.

Das Verzeichnis `intern` gehört `deploy:deploy` und hat die Rechte `700`. Der Webserver-Benutzer `www-data` ist weder Eigentümer noch in der Gruppe `deploy`, darf das Verzeichnis also nicht durchlaufen (fehlendes `x`), selbst wenn die Datei `daten.pdf` der Gruppe `www-data` lesbar ist. Die minimale Korrektur: Gruppe des Verzeichnisses auf `www-data` setzen und das Gruppen-Ausführungsrecht vergeben: `sudo chgrp www-data /srv/web/intern && sudo chmod 750 /srv/web/intern`. Danach kann `www-data` das Verzeichnis durchlaufen und die Datei lesen, aber nichts anlegen oder ändern. Ein `chmod 777` wäre unnötig und gefährlich.

### Lösung zu Aufgabe 6.

```bash
$ sudo systemctl edit nginx
# im Editor eintragen und speichern:
[Service]
LimitNOFILE=65535
# Dienst neu starten, damit der Prozess die neue Grenze bekommt
$ sudo systemctl restart nginx
# Wirksame Unit samt Drop-in anzeigen
$ systemctl cat nginx
# Grenze des laufenden Master-Prozesses prüfen
$ grep "open files" /proc/$(cat /run/nginx.pid)/limits
Max open files            65535                65535                files
```

`systemctl edit` legt die Datei `/etc/systemd/system/nginx.service.d/override.conf` an und lädt die Units neu. Ein `restart` (kein `reload`) ist nötig, weil Prozessgrenzen beim Start des Prozesses gesetzt werden. In `/proc/<PID>/limits` sieht man den tatsächlich geltenden Wert. Damit Nginx die Grenze auch ausnutzt, setzt man zusätzlich `worker_rlimit_nofile` und passt `worker_connections` entsprechend an.

### Lösung zu Aufgabe 7.

Die Konfiguration (in der Testumgebung geprüft und gestartet, die Antwort lautete `<h1>Instanz 2</h1>`, `ss` zeigte `127.0.0.1:8082` als lauschend):

```apache
ServerRoot "/usr/lib/apache2"
DefaultRuntimeDir "/tmp/aufg7/run"
PidFile "/tmp/aufg7/run/httpd.pid"
Listen 127.0.0.1:8082
ServerName localhost

LoadModule mpm_event_module modules/mod_mpm_event.so
LoadModule authz_core_module modules/mod_authz_core.so
LoadModule mime_module modules/mod_mime.so
LoadModule dir_module modules/mod_dir.so

User www-data
Group www-data
ErrorLog "/tmp/aufg7/logs/error.log"
TypesConfig "/etc/mime.types"

DocumentRoot "/tmp/aufg7/htdocs"
<Directory "/tmp/aufg7/htdocs">
    Require all granted
    Options -Indexes
</Directory>
```

```bash
$ mkdir -p /tmp/aufg7/{htdocs,logs,run}
$ echo '<h1>Instanz 2</h1>' > /tmp/aufg7/htdocs/index.html
$ apache2 -f /tmp/aufg7/httpd.conf -t          # absoluter Pfad!
Syntax OK
$ apache2 -f /tmp/aufg7/httpd.conf -k start
$ curl http://127.0.0.1:8082/
$ ss -ltn | grep 8082
$ apache2 -f /tmp/aufg7/httpd.conf -k stop
```

Die Pfade der Module gelten für Debian und Ubuntu (auf RHEL `/usr/lib64/httpd/modules` als `ServerRoot`-Ersatz oder ein Verzeichnis mit Verknüpfungen). `Options -Indexes` verbietet das Verzeichnislisting. Der `-f`-Pfad muss absolut sein, sonst sucht Apache die Datei unter dem Standard-`ServerRoot`.

### Lösung zu Aufgabe 8.

```nginx
# /etc/nginx/sites-available/intern.conf
server {
    listen 80;
    server_name intern.test;
    root /srv/intern;
    index index.html;

    allow 10.0.0.0/8;
    deny all;
}
```

```bash
$ sudo ln -s /etc/nginx/sites-available/intern.conf /etc/nginx/sites-enabled/intern.conf
$ sudo nginx -t && sudo systemctl reload nginx
```

Die Regeln `allow` und `deny` werden von oben nach unten ausgewertet; die erste passende gewinnt, und `deny all` fängt alles Übrige ab. Das Muster wurde in der Testumgebung mit einem eigenen Präfix aufgebaut (Verknüpfung in `sites-enabled`, Einbindung per `include`) und erfolgreich mit `nginx -t` geprüft.

### Lösung zu Aufgabe 9.

Vorgehen von innen nach außen. Schritt 1: Lauscht der Dienst auf der richtigen Adresse? `sudo ss -ltnp | grep nginx` zeigt, ob er an `0.0.0.0:80` (alle Schnittstellen) oder nur an `127.0.0.1:80` gebunden ist; ein `listen 127.0.0.1:80` erklärt das Verhalten. Schritt 2: Antwortet er lokal mit der Serveradresse statt `localhost`? `curl -I http://<Serveradresse>/` auf dem Server selbst. Schritt 3: Blockiert die Host-Firewall? `sudo ufw status` bzw. `sudo firewall-cmd --list-all`, und gegebenenfalls Port 80 und 443 freigeben. Schritt 4: Blockiert eine vorgelagerte Firewall oder Cloud-Sicherheitsgruppe? Test von einem anderen Rechner mit `curl` oder `nc -vz <Adresse> 80`; ein Timeout (statt `Connection refused`) deutet auf eine verwerfende Firewall hin, während `refused` bedeutet, dass der Port erreicht wird, aber nichts lauscht.

Das Rechtekonzept: Der Bereitstellungsbenutzer besitzt alle Inhalte, `www-data` bekommt über die Gruppe nur Leserechte, nur `uploads` ist beschreibbar, und `config` bleibt dem Webserver verschlossen.

```bash
$ sudo chown -R deploy:www-data /srv/shop
$ sudo find /srv/shop -type d -exec chmod 750 {} \;
$ sudo find /srv/shop -type f -exec chmod 640 {} \;
# Upload-Verzeichnis: Webserver darf schreiben
$ sudo chown www-data:www-data /srv/shop/uploads && sudo chmod 750 /srv/shop/uploads
# Zugangsdaten: Webserver-Gruppe ausschliessen
$ sudo chown -R deploy:deploy /srv/shop/config && sudo chmod -R o-rwx,g-rwx /srv/shop/config
```

Allerdings muss `www-data` den Pfad bis zu `uploads` durchlaufen können, und das gilt für `/srv/shop` (Gruppe `www-data`, 750). Ein Verzeichnis `config` ohne Gruppenrecht ist für `www-data` unzugänglich. Wenn die Anwendung die Zugangsdaten braucht, liest sie sie beim Start über einen eigenen Prozess oder eine Umgebungsvariable, nicht über das Dateisystem des Webserver-Benutzers. Im Upload-Verzeichnis sollte zusätzlich konfiguriert werden, dass dort keine Skripte ausgeführt werden.
