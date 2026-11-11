# Modul 01 - Apache HTTP Server Grundlagen und Architektur

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Listings unverändert, farbige Boxen als Zitatblöcke mit fettem Titel, Tabellen als Markdown-Tabellen, Übungsaufgaben und Lösungen als Absätze bzw. Überschriften). Die Lerneinheiten sind wie in der Quelle nach Modul nummeriert (1.1 bis 1.13), danach folgen „Übungsaufgaben“ (9) und „Lösungen und Erklärungen“. **Die Konfigurationen und Befehle wurden für dieses Repository nicht ausgeführt:** Laut Einleitung hat der Autor die Beispiele in einer Linux-Umgebung (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0) ausgeführt; nicht getestet sind laut Skript Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt. Viele Beispiele ändern Server-Konfiguration, Zertifikate, Rechte oder Dienste: nur in einer Testumgebung ausprobieren. Übersicht zum Modul: [README](README.md).

**Geplante Dauer:** 15 h | **Priorität:** 1 | **Lerneinheiten:** 13

## Lerneinheiten laut Lehrplan

| **Nr.** | **Lerneinheit**             | **Dauer (h)** | **Prio** |
|--------:|:----------------------------|--------------:|---------:|
|     1.1 | Apache httpd Zweck          |             1 |        1 |
|     1.2 | Webserver vs. Reverse Proxy |             1 |        1 |
|     1.3 | Request Lifecycle           |           1,5 |        1 |
|     1.4 | Module und DSO              |             1 |        1 |
|     1.5 | MPM-Überblick               |             1 |        1 |
|     1.6 | Konfigurationsmodell        |           1,5 |        2 |
|     1.7 | Betriebsrollen              |             1 |        2 |
|     1.8 | Dokumentation               |             1 |        2 |
|     1.9 | Nginx Zweck und Einordnung  |             1 |        1 |
|    1.10 | Event-driven Architektur    |             1 |        1 |
|    1.11 | Master und Worker           |           1,5 |        1 |
|    1.12 | Request Processing          |             1 |        1 |
|    1.13 | Open Source und NGINX Plus  |           1,5 |        2 |
|         | **Summe**                   |        **15** |          |

## Überblick und Lernweg

Dieses Modul legt das Fundament für alles Weitere im Kurs. Es beantwortet zwei Grundfragen: Was ist ein Webserver, und wie sind die beiden wichtigsten Open-Source-Vertreter, der *Apache HTTP Server* und *Nginx*, im Inneren aufgebaut? Beide Programme erledigen im Kern dieselbe Aufgabe, nämlich HTTP-Anfragen entgegenzunehmen und Antworten zu liefern. Sie unterscheiden sich aber deutlich darin, wie sie intern mit vielen gleichzeitigen Verbindungen umgehen, wie sie konfiguriert werden und wo ihre Stärken liegen. Wer diese Unterschiede einmal verstanden hat, kann später jede Konfigurationsentscheidung begründen, statt Beispiele aus dem Internet blind zu kopieren.

Die ersten acht Lerneinheiten (1.1 bis 1.8) behandeln den Apache HTTP Server, die folgenden fünf (1.9 bis 1.13) Nginx. Die Reihenfolge ist bewusst so gewählt: Apache hat das ältere, modular erweiterbare Prozess-und-Thread-Modell, an dem sich viele Begriffe wie Modul, Direktive oder Kontext sauber einführen lassen. Nginx wird danach häufig als Gegenentwurf erklärt, und der Vergleich macht beide Systeme verständlicher.

> **Merke**
>
> Alle Beispiele in diesem Skript wurden in einer Testumgebung mit Apache HTTP Server 2.4.58 und Nginx 1.24.0 (Ubuntu) tatsächlich ausgeführt. Ausgaben, die als Terminal-Auszug gekennzeichnet sind, stammen aus diesen Läufen. Pfade und Paketnamen unterscheiden sich je nach Distribution; auf Abweichungen wird jeweils hingewiesen.

## 1.1 Apache httpd Zweck

Ein *Webserver* ist ein Programm, das auf einem TCP-Port lauscht (üblicherweise 80 für HTTP und 443 für HTTPS), Anfragen nach dem Protokoll HTTP entgegennimmt und dazu passende Antworten zurückschickt. Eine Anfrage (englisch *Request*) besteht aus einer Methode wie `GET` oder `POST`, einem Pfad, Kopfzeilen (*Header*) und gegebenenfalls einem Inhalt. Die Antwort (*Response*) enthält einen dreistelligen Statuscode wie 200 oder 404, wiederum Header und meist den eigentlichen Inhalt, etwa eine HTML-Seite, ein Bild oder JSON-Daten.

Der *Apache HTTP Server*, im Betrieb meist nur *httpd* genannt, ist ein Open-Source-Webserver der Apache Software Foundation. Er wird seit Mitte der 1990er Jahre entwickelt und steht unter der Apache License 2.0. Auf Red-Hat-artigen Systemen heißen Paket, Dienst und Programm `httpd`, auf Debian und Ubuntu `apache2`. Gemeint ist in beiden Fällen dasselbe Programm. Die Eigenschaften, die ihn bis heute relevant halten, lassen sich in drei Begriffen zusammenfassen: zuverlässig, weil er seit Jahrzehnten im Dauerbetrieb erprobt ist, erweiterbar, weil fast jede Funktion in einem eigenen Modul steckt, und flexibel, weil er sich über Textdateien feingranular konfigurieren lässt.

Typische Einsatzzwecke sind die Auslieferung statischer Dateien, das Hosten dynamischer Anwendungen (etwa PHP über FastCGI), das Beenden von TLS-Verbindungen und der Betrieb als Reverse Proxy vor Anwendungsservern. *TLS-Terminierung* bedeutet, dass der Webserver die Verschlüsselung der Verbindung zum Client übernimmt und dahinterliegende Systeme unverschlüsselt oder intern neu verschlüsselt anspricht. Die beiden letzten Einsatzzwecke werden in den folgenden Lerneinheiten und in den Modulen 6 und 7 vertieft.

Damit das Konzept greifbar wird, startet man am besten eine kleine, vollständige Instanz. Die folgende Konfiguration ist absichtlich minimal: Sie lädt nur die Module, die für statische Dateien nötig sind, lauscht ausschließlich auf der Loopback-Adresse und legt alle Laufzeitdateien unter `/tmp` ab, sodass sie neben einer bestehenden Installation gefahrlos getestet werden kann. Die Modulpfade entsprechen Debian und Ubuntu; auf RHEL-artigen Systemen liegen die Module unter `/usr/lib64/httpd/modules`.

```apache
# /tmp/demo-httpd/httpd.conf -- minimale, lauffähige Konfiguration
ServerRoot "/usr/lib/apache2"
DefaultRuntimeDir "/tmp/demo-httpd/run"
PidFile "/tmp/demo-httpd/run/httpd.pid"
Listen 127.0.0.1:8080
ServerName localhost

LoadModule mpm_event_module modules/mod_mpm_event.so
LoadModule authz_core_module modules/mod_authz_core.so
LoadModule authz_host_module modules/mod_authz_host.so
LoadModule mime_module modules/mod_mime.so
LoadModule dir_module modules/mod_dir.so
LoadModule status_module modules/mod_status.so

User www-data
Group www-data
ErrorLog "/tmp/demo-httpd/logs/error.log"
LogFormat "%h %l %u %t \"%r\" %>s %b" common
CustomLog "/tmp/demo-httpd/logs/access.log" common
TypesConfig "/etc/mime.types"

DocumentRoot "/tmp/demo-httpd/htdocs"
<Directory "/tmp/demo-httpd/htdocs">
    Require all granted
</Directory>
<Location "/server-status">
    SetHandler server-status
    Require local
</Location>
```

Die Datei lässt sich Zeile für Zeile lesen. `ServerRoot` nennt das Basisverzeichnis, relativ zu dem alle nicht absolut angegebenen Pfade aufgelöst werden; deshalb funktionieren die `LoadModule`-Zeilen mit dem kurzen Pfad `modules/...`. `DefaultRuntimeDir` und `PidFile` verlegen die Laufzeitdateien in ein beschreibbares Verzeichnis. `Listen` legt Adresse und Port fest, an die sich der Server bindet, und `ServerName` gibt dem Server seinen Namen, damit beim Start keine Warnung über einen nicht ermittelbaren Hostnamen erscheint. Die `LoadModule`-Zeilen aktivieren genau die Module, die gebraucht werden, darunter das Multi-Processing-Modul `mpm_event_module`, das in der Einheit zu MPMs erklärt wird. `User` und `Group` bestimmen, unter welchem Benutzer die Arbeitsprozesse laufen. `Require all granted` im `Directory`-Block erlaubt den Zugriff auf das Dokumentenverzeichnis ausdrücklich. In dieser kleinen Konfiguration wäre er auch ohne die Zeile erlaubt, weil keine Regel greift (das wurde getestet); die Standardkonfigurationen der Distributionen sperren das Dateisystem dagegen zunächst mit `<Directory /> Require all denied`, und dann ist die ausdrückliche Freigabe unverzichtbar. Der `Location`-Block schließlich schaltet die Statusseite frei, aber nur für lokale Zugriffe.

Gestartet und geprüft wird die Instanz mit wenigen Befehlen. Wichtig ist der *absolute* Pfad hinter `-f`: Ein relativer Pfad würde relativ zum `ServerRoot` der Standardkonfiguration aufgelöst und führt zu der Meldung „Could not open configuration file“.

```bash
$ mkdir -p /tmp/demo-httpd/{htdocs,logs,run}
$ echo '<h1>Hallo vom Apache</h1>' > /tmp/demo-httpd/htdocs/index.html
$ apache2 -f /tmp/demo-httpd/httpd.conf -t
Syntax OK
$ apache2 -f /tmp/demo-httpd/httpd.conf -k start
$ curl -i http://127.0.0.1:8080/
HTTP/1.1 200 OK
Server: Apache/2.4.58 (Ubuntu)
Content-Type: text/html
Content-Length: 26

<h1>Hallo vom Apache</h1>
$ apache2 -f /tmp/demo-httpd/httpd.conf -k stop
```

### Typische Fehler.

Beim ersten Aufbau treten zwei Meldungen fast zwangsläufig auf, und beide lassen sich aus dem Modulsystem erklären. Die erste entsteht, wenn man eine Direktive benutzt, deren Modul nicht geladen ist. Ein falsches Beispiel ist `Require local` ohne `mod_authz_host`; Apache bricht dann beim Start ab:

```text
AH00526: Syntax error on line 27 of /tmp/demo-httpd/httpd.conf:
Unknown Authz provider: local
```

Richtig ist, die Zeile `LoadModule authz_host_module modules/mod_authz_host.so` zu ergänzen. Die zweite Meldung kommt vom umgekehrten Fehler. Debian und Ubuntu kompilieren einige Module fest in das Programm ein; der Versuch, eines davon zusätzlich zu laden, scheitert mit `module log_config_module is built-in and can't be loaded`. Welche Module fest eingebaut sind, zeigt `apache2 -l`. Beide Fehler sind harmlos und schnell behoben, sie zeigen aber das Grundprinzip: Der Funktionsumfang eines Apache ergibt sich ausschließlich aus eingebauten und geladenen Modulen.

> **Ergänzung aus der Nachrecherche: Aktuelle Version**
>
> Laut der Ankündigung auf den Apache-Servern ist **2.4.69** (veröffentlicht am 1. 10. 2026) die aktuelle Version der Reihe 2.4; sie wird dort als „latest GA release“ und „recommended over all previous releases“ bezeichnet. Für den Betrieb heißt das: Auch Jahre nach dem ersten Release ist 2.4 der gepflegte Standardzweig, auf den sich Dokumentation, Distributionspakete und Sicherheitsupdates beziehen. Abgerufen am 31. 10. 2026 über einen Spiegelserver der Apache Software Foundation (siehe Quellenverzeichnis). Die Version in Distributionspaketen kann hinter dieser Zahl zurückliegen, weil Distributionen Sicherheitskorrekturen zurückportieren, statt die Versionsnummer anzuheben.

> **Praxisbeispiel: Intranet und Altanwendungen**
>
> In vielen Unternehmen läuft Apache als „Frontdoor“ vor historisch gewachsenen Anwendungen: Er liefert Dokumentationsseiten aus, übernimmt die Anmeldung gegen ein Verzeichnis, beendet TLS und reicht den Rest an einen Anwendungsserver weiter. Wer solche Systeme übernimmt, trifft fast immer auf eine `httpd.conf` mit vielen `Include`-Dateien und einem beachtlichen Modulbestand. Die Fähigkeit, eine solche Konfiguration systematisch zu lesen, ist deshalb wichtiger als das Auswendiglernen einzelner Direktiven.

## 1.2 Webserver vs. Reverse Proxy

Die Begriffe *Webserver* und *Reverse Proxy* werden im Alltag oft vermischt, bezeichnen aber verschiedene Rollen. Ein Webserver im engeren Sinn erzeugt die Antwort selbst: Er liest eine Datei von der Platte, lässt ein Skript laufen oder erzeugt eine Fehlerseite. Ein *Reverse Proxy* erzeugt die Antwort nicht selbst, sondern leitet die Anfrage an ein anderes System weiter, das *Backend*, *Origin* oder *Upstream* genannt wird, und reicht dessen Antwort an den Client zurück. Der Client sieht nur den Proxy und weiß nicht, welches System im Hintergrund antwortet.

Vom Reverse Proxy zu unterscheiden ist der *Forward Proxy*. Er steht auf der Seite der Clients und holt in deren Auftrag Inhalte aus dem Internet, beispielsweise ein Unternehmens-Proxy für Webzugriffe der Mitarbeiter. Der Reverse Proxy steht dagegen auf der Seite der Server und schützt oder bündelt sie. Apache kann beides, die Rollen werden aber über unterschiedliche Direktiven aktiviert, und der Forward-Betrieb ist standardmäßig ausgeschaltet. Das hat einen guten Grund, auf den die Fehlerliste unten zurückkommt.

Warum setzt man einen Reverse Proxy ein? Der erste Grund ist *Entkopplung*: Anwendungsserver wie Tomcat, Node.js oder ein Python-Prozess sind gut darin, Geschäftslogik auszuführen, aber weniger gut in TLS, Komprimierung, Zugriffsbeschränkung oder dem Umgang mit langsamen Clients. Der Proxy übernimmt diese Aufgaben. Der zweite Grund ist *Sicherheit*: Nur der Proxy ist aus dem Netz erreichbar, die Backends liegen in einem internen Segment. Der dritte Grund ist *Verteilung*: Ein Proxy kann Anfragen anhand des Pfades oder des Hostnamens auf verschiedene Backends verteilen oder mehrere gleichartige Backends zu einer Gruppe bündeln (Load Balancing, Thema von Modul 8). Der vierte Grund ist *Betrieb*: Durch den Proxy lassen sich Wartungsfenster überbrücken, Fehlerseiten vereinheitlichen und Zugriffe zentral protokollieren.

Das folgende Beispiel erweitert die Testinstanz um eine einfache Reverse-Proxy-Regel. Alles unter `/api/` soll an einen Python-Prozess auf dem lokalen Port 9000 weitergereicht werden. Die beiden Module `mod_proxy` und `mod_proxy_http` bilden zusammen die Grundlage; `mod_proxy` liefert das Gerüst, `mod_proxy_http` das Protokoll HTTP zum Backend.

```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so

ProxyPass        "/api/" "http://127.0.0.1:9000/"
ProxyPassReverse "/api/" "http://127.0.0.1:9000/"
```

`ProxyPass` ordnet den eingehenden Pfad dem Backend zu: Eine Anfrage an `/api/daten` wird zu `http://127.0.0.1:9000/daten`. Der Präfix `/api/` wird dabei durch die Basisadresse des Backends ersetzt. `ProxyPassReverse` sorgt dafür, dass Weiterleitungen des Backends (Header wie `Location`) zurück in den öffentlichen Pfadraum übersetzt werden; ohne diese Zeile würde ein Redirect des Backends den Client auf die interne Adresse schicken. Zum Testen startet man im Verzeichnis mit einer Beispieldatei einen Mini-Server (`python3 -m http.server 9000 --bind 127.0.0.1`) und ruft `curl http://127.0.0.1:8080/api/` auf. Die Antwort kommt vom Backend, ausgeliefert durch Apache.

### Typische Fehler.

Die häufigste Stolperfalle sind unterschiedliche Schrägstriche. Wird `/api/` auf ein Ziel ohne abschließenden Schrägstrich abgebildet, ergeben sich verdoppelte oder fehlende Pfadtrennzeichen:

```apache
# falsch: Pfad links mit, Ziel ohne Schrägstrich
ProxyPass "/api/" "http://127.0.0.1:9000"
# richtig: beide Seiten gleich behandeln
ProxyPass "/api/" "http://127.0.0.1:9000/"
```

Gefährlicher ist die zweite Falle: `ProxyRequests On` schaltet den Forward-Proxy-Betrieb ein. Ein Server, der das ohne Zugriffsbeschränkung tut, wird zum *offenen Proxy*, den Fremde für anonyme Zugriffe oder Angriffe missbrauchen. Für reinen Reverse-Proxy-Betrieb ist `ProxyRequests Off` das Richtige (und gilt als Standardwert). Eine dritte, subtile Falle ist die Reihenfolge mehrerer `ProxyPass`-Regeln: Sie werden in der Reihenfolge der Konfigurationsdatei ausgewertet, spezielle Pfade müssen daher vor allgemeinen stehen.

> **Praxisbeispiel: Eine Domain, mehrere Anwendungen**
>
> Typisch ist ein Setup, in dem `shop.example.org` unter `/` von einer PHP-Anwendung bedient wird, `/api/` an ein Java-Backend geht und `/static/` direkt vom Dateisystem kommt. Der Reverse Proxy ist hier der einzige Einstiegspunkt; Zertifikate, Header-Regeln und Zugriffsprotokolle liegen an einer einzigen Stelle. Die vollständige Konfiguration solcher Setups behandelt Modul 7.

## 1.3 Request Lifecycle

Der *Request Lifecycle* beschreibt den Weg einer Anfrage durch den Server, vom Eintreffen der ersten Bytes bis zum Eintrag im Logfile. Wer diesen Weg kennt, versteht plötzlich viele Phänomene, die sonst willkürlich wirken: warum ein `Alias` manchmal einen Zugriff freigibt, den man gesperrt glaubte, warum ein Redirect die Authentifizierung umgeht oder warum Direktiven aus einem `Location`-Block scheinbar „später“ gelten als solche aus einem `Directory`-Block.

Am Anfang steht die *Verbindungsebene*. Das *Multi-Processing Module* (MPM, siehe Einheit 1.5) nimmt eine TCP-Verbindung an und übergibt sie einem Arbeitsprozess oder -thread. Ist TLS aktiv, schaltet `mod_ssl` einen Verbindungsfilter davor, der die Daten entschlüsselt. Danach liest der HTTP-Kern die Anfragezeile und die Header. Erst jetzt beginnt die eigentliche *Request-Verarbeitung*, die Apache in aufeinanderfolgende Phasen gliedert. Module hängen ihre Funktionen (*Hooks*) in diese Phasen ein, sodass jedes Modul genau dort eingreift, wo es hingehört.

| **Phase (Hook)**                         | **Aufgabe**                                               | **Typische Module**                |
|:-----------------------------------------|:----------------------------------------------------------|:-----------------------------------|
| post_read_request                        | Anfrage ist gelesen; erste Auswertung                     | `mod_remoteip`, `mod_unique_id`                 |
| translate_name                           | URL wird auf Datei oder Handler abgebildet                | `mod_alias`, `mod_rewrite`                 |
| map_to_storage                           | Konfiguration für Verzeichnis und `.htaccess` wird ermittelt | Kern                               |
| check_access / check_authn / check_authz | Zugriffs-, Anmelde- und Berechtigungsprüfung              | `mod_authz_host`, `mod_authn_file`, `mod_authz_core`       |
| type_checker                             | Inhaltstyp, Sprache, Kodierung bestimmen                  | `mod_mime`, `mod_negotiation`                 |
| fixups                                   | letzte Korrekturen (Umleitungen, Variablen)               | `mod_dir`, `mod_headers`                 |
| handler                                  | Inhalt erzeugen                                           | Kern (Dateien), `mod_proxy`, `mod_cgi` |
| log_transaction                          | Zugriff protokollieren                                    | `mod_log_config`                           |

Die Tabelle zeigt die wichtigste Erkenntnis: Die Abbildung der URL auf eine Datei (`translate_name`) geschieht *vor* der Zugriffsprüfung. Erst wenn bekannt ist, welche Datei oder welcher Handler gemeint ist, kann Apache die zugehörigen `Directory`-, `Files`- und `Location`-Abschnitte zusammensetzen und die Zugriffsregeln anwenden. Nach dem Handler läuft die Antwort noch durch *Ausgabefilter* wie die Komprimierung in `mod_deflate`; zuletzt schreibt das Logging-Modul die Zeile in die Zugriffslogdatei.

Sichtbar machen lässt sich das mit gezielter Protokollierung. Ab Apache 2.4 kann man den Loglevel je Modul einstellen, ohne den gesamten Server gesprächig zu machen. Die folgenden Zeilen schalten Debug-Ausgaben nur für Autorisierung, Verzeichnisindex und Alias an und binden zusätzlich eine kleine Zusatzkonfiguration ein:

```apache
LoadModule alias_module modules/mod_alias.so
IncludeOptional "/tmp/demo-httpd/conf.d/*.conf"
LogLevel info authz_core:debug dir:debug alias:debug

# conf.d/doku.conf
Alias "/doku" "/tmp/demo-httpd/doku"
<Directory "/tmp/demo-httpd/doku">
    Require all granted
</Directory>
```

Ruft man nun `/doku` (ohne Schrägstrich) und danach `/doku/` auf, ergibt sich ein aufschlussreiches Bild. Der erste Aufruf liefert den Statuscode 301 und verweist auf `/doku/`: In der Phase `fixups` erkennt `mod_dir`, dass ein Verzeichnis ohne abschließenden Schrägstrich angefragt wurde, und leitet um. Der zweite Aufruf liefert 200, und im Errorlog steht, wie die Autorisierung entschieden wurde:

```text
[authz_core:debug] ... AH01626: authorization result of Require all granted: granted
[authz_core:debug] ... AH01626: authorization result of <RequireAny>: granted
[authz_core:debug] ... AH01628: authorization result: granted (no directives)
```

Die letzte Zeile gehört zu einer Anfrage ohne passende Zugriffsregel (etwa dem Proxy-Pfad aus dem vorigen Beispiel): Wo keine `Require`-Direktive gilt, ist der Zugriff erlaubt. Das ist ein wichtiger Sicherheitsaspekt, weil er zeigt, dass „nichts konfiguriert“ nicht „gesperrt“ bedeutet.

### Reihenfolge der Konfigurationsabschnitte.

Wenn mehrere Abschnitte auf dieselbe Anfrage passen, kombiniert Apache sie in fester Reihenfolge: zuerst `Directory` (ohne reguläre Ausdrücke, vom kürzesten zum längsten Pfad) und gleichzeitig `.htaccess`-Dateien, dann `DirectoryMatch`, dann `Files` und `FilesMatch`, zuletzt `Location` und `LocationMatch`. Was später kommt, gewinnt bei Konflikten. Der `Location`-Abschnitt hat damit das letzte Wort, weshalb sich Zugriffsregeln, die sich nicht umgehen lassen sollen, am besten dort ablegen lassen.

### Typische Fehler.

Ein klassischer Irrtum ist, den Zugriff auf eine Datei nur über einen `Location`-Block zu sperren, obwohl dieselbe Datei über einen `Alias` unter einem zweiten URL-Pfad erreichbar ist. Der Schutz greift dann nur für den einen Pfad. Richtig ist, den Schutz am Dateisystemort zu verankern (`Directory` oder `Files`). Umgekehrt gilt: Wer ein Backend über `ProxyPass` anbindet, hat kein Dateisystem, sondern nur einen URL-Raum; dort ist `Location` das passende Werkzeug.

> **Merke**
>
> URL-Raum und Dateisystem-Raum sind zwei verschiedene Welten. `Directory` und `Files` beziehen sich auf das Dateisystem, `Location` auf die URL. Apache bildet zuerst die URL ab und prüft danach beide Welten.

> **Praxisbeispiel: Fehlersuche bei 403 und 404**
>
> Bei „Mein Alias funktioniert nicht“ hilft der Lifecycle-Gedanke als Checkliste: Wurde der Pfad richtig abgebildet (Alias, Rewrite)? Wurde das Zielverzeichnis freigegeben (`Require`)? Hat der Prozessbenutzer Leserechte auf Dateisystemebene? Eine kurze Debug-Zeile je Modul ersetzt hier stundenlanges Raten.

## 1.4 Module und DSO

Der Kern von Apache ist klein. Fast alles, was man als Funktion wahrnimmt, steckt in Modulen: das Schreiben der Logdatei, die Rechteprüfung, die Umleitung, die Verschlüsselung, die Proxy-Fähigkeit. Module lassen sich auf zwei Arten in den Server bringen. *Statisch* einkompilierte Module sind fest im Programm enthalten; ihre Auswahl wird beim Bauen der Software festgelegt. *Dynamisch* ladbare Module liegen als eigene Dateien mit der Endung `.so` vor (*Dynamic Shared Object*, kurz DSO) und werden beim Start über die Direktive `LoadModule` eingebunden. Möglich macht das das Modul `mod_so`, das als einziges neben dem Kern immer statisch eingebaut sein muss, weil es den Lademechanismus bereitstellt.

Die Syntax ist `LoadModule <Modulname> <Dateipfad>`. Der Modulname (zum Beispiel `proxy_module`) ist ein interner Bezeichner, den das Modul selbst definiert, der Pfad ist relativ zu `ServerRoot`. Beide Angaben müssen übereinstimmen, sonst bricht der Start ab. Welche Module aktuell aktiv sind, verrät `apache2 -M` (oder `httpd -M`); die Ausgabe unterscheidet zwischen `static` und `shared`. Nur die statisch eingebauten zeigt `-l`.

```bash
$ apache2 -f /tmp/demo-httpd/httpd.conf -M
Loaded Modules:
 core_module (static)
 so_module (static)
 watchdog_module (static)
 http_module (static)
 log_config_module (static)
 logio_module (static)
 version_module (static)
 unixd_module (static)
 mpm_event_module (shared)
 authz_core_module (shared)
 mime_module (shared)
 dir_module (shared)
 status_module (shared)
```

Die Ausgabe stammt aus der Testinstanz und zeigt, wie unterschiedlich die Distributionen bauen. Auf Debian und Ubuntu ist `log_config_module` fest eingebaut, auf einem selbst kompilierten Apache dagegen meist ein ladbares Modul. Einen Hinweis für die Praxis liefert dabei die Dokumentation: Der Betrieb mit DSOs ist etwas langsamer als mit statisch eingebundenen Modulen, laut Apache-Dokumentation beim Start um rund 20 Prozent und auf manchen Plattformen im laufenden Betrieb um einige Prozent. Weil der Vorteil der Flexibilität diesen Preis bei Weitem überwiegt, sind DSOs der Normalfall.

Module hängen teilweise voneinander ab. `mod_proxy_http` funktioniert nur mit `mod_proxy`, `mod_ssl` braucht Kryptografie-Bibliotheken, und fast jedes Autorisierungsmodul setzt `mod_authz_core` voraus. Auf Debian und Ubuntu erledigen die Hilfsprogramme `a2enmod` und `a2dismod` das Verlinken der Dateien in `mods-enabled`; auf RHEL-artigen Systemen genügt eine Zeile in einer Datei unter `conf.modules.d`. Eigene Module baut man mit `apxs` (Apache Extension Tool), und `apxs -cia mod_foo.c` kompiliert, installiert und aktiviert ein Modul in einem Schritt.

Ein häufig genutzter Mechanismus, um Konfigurationen portabel zu halten, ist der Block `IfModule`. Er wertet seinen Inhalt nur aus, wenn das genannte Modul geladen ist:

```apache
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
</IfModule>
```

### Typische Fehler.

Der `IfModule`-Block ist bequem, aber tückisch: Fehlt das Modul, wird der Inhalt *stillschweigend* übersprungen, und der Admin glaubt, der Sicherheitsheader sei gesetzt. Besser ist es, geforderte Module explizit zu laden und bei Fehlen den Start scheitern zu lassen. Ein weiterer Fehler ist, einen MPM doppelt zu laden: Dann verweigert der Server den Start mit `AH00534: ... Configuration error: More than one MPM loaded`. Schließlich gilt aus Sicherheitssicht: Jedes geladene Modul vergrößert die Angriffsfläche und den Wartungsaufwand. Dokumentieren Sie daher, wofür jedes Modul im Einsatz ist, und entfernen Sie alles, was keinen Zweck hat.

> **Ergänzung aus der Nachrecherche: configure und unbekannte Modulnamen**
>
> Beim Bauen aus dem Quelltext werden Module standardmäßig als DSO erzeugt. Aktiviert oder abgeschaltet werden sie mit `--enable-<modul>` und `--disable-<modul>` (Modulname ohne `mod_`, Unterstriche als Bindestriche). Laut Installationsanleitung ignoriert `configure` unbekannte Modulnamen *stillschweigend*. Ein Tippfehler im Namen führt also nicht zu einer Fehlermeldung, sondern zu einem Server ohne das gewünschte Modul. Nach dem Bauen sollte man deshalb immer mit `httpd -M` nachsehen, was tatsächlich vorhanden ist.

> **Praxisbeispiel: Modulinventur als Härtungsmaßnahme**
>
> Bei Sicherheitsprüfungen wird oft gefragt: „Welche Module sind aktiv, und braucht Ihr Dienst sie alle?“ Eine Standardinstallation lädt gern Module für Funktionen, die nie genutzt werden, zum Beispiel Verzeichnislisting oder CGI. Die Ausgabe von `httpd -M` ist die ehrlichste Bestandsaufnahme und gehört in jede Betriebsdokumentation.

## 1.5 MPM-Überblick

Ein *Multi-Processing Module* (MPM) ist der Teil von Apache, der die Netzwerkports öffnet, eingehende Verbindungen annimmt und sie an Prozesse oder Threads zur Bearbeitung verteilt. Es handelt sich um die Antwort auf die Frage: „Wie bearbeitet der Server viele Anfragen gleichzeitig?“ Da diese Entscheidung tief in den Server eingreift, ist ein MPM kein gewöhnliches Zusatzmodul. Es muss genau *ein* MPM geladen sein, nicht keines und nicht mehrere.

Zum Verständnis hilft die Unterscheidung zwischen *Prozessen* und *Threads*. Ein Prozess ist ein eigenständiges Programm mit eigenem Speicherbereich; Prozesse sind gut gegeneinander abgeschottet, brauchen aber mehr Speicher. Ein Thread ist ein Ausführungsstrang innerhalb eines Prozesses und teilt sich dessen Speicher mit den anderen Threads; er ist leichtgewichtig, verlangt aber, dass der gesamte Code *thread-sicher* ist, also keine Fehler bei gleichzeitigem Zugriff macht. Die drei wichtigsten MPMs unter Unix unterscheiden sich genau in dieser Mischung.

Das MPM `prefork` arbeitet ausschließlich mit Prozessen: Jede Verbindung belegt einen eigenen Prozess, der vorab (englisch *pre-forked*) gestartet wird. Das ist robust und kompatibel mit Code, der nicht thread-sicher ist, braucht aber viel Speicher. Das MPM `worker` kombiniert mehrere Prozesse mit jeweils vielen Threads; ein Thread bearbeitet eine Verbindung. Das MPM `event` baut auf `worker` auf und fügt einen *Listener-Thread* hinzu, der ruhende Verbindungen (etwa Keep-Alive-Verbindungen, die gerade auf die nächste Anfrage warten) mit Betriebssystem-Ereignismechanismen wie `epoll` überwacht, ohne dafür einen Arbeits-Thread zu blockieren. Unter Windows gibt es stattdessen `mpm_winnt`, das die native Netzwerkschnittstelle verwendet.

Welches MPM verwendet wird, entscheidet entweder der Build oder die Konfiguration. Beim Kompilieren wählt `--with-mpm=NAME` ein MPM fest aus; wird es als DSO gebaut (`--enable-mpms-shared`), tauscht man es später durch Ändern der `LoadModule`-Zeile aus. Ohne explizite Wahl nimmt die Apache-Dokumentation zufolge `event`, wenn das System Threads und einen skalierbaren Ereignismechanismus (epoll, kqueue) bietet, sonst `worker` und nur im Notfall `prefork`. Im Alltag ist `event` damit das Standard-MPM moderner Linux-Distributionen.

Wie das aussieht, zeigt ein Blick auf die Prozesse der Testinstanz. Die Spalte `NLWP` gibt die Anzahl der Threads je Prozess an:

```text
$ ps -eo pid,ppid,nlwp,user,args | grep "[a]pache2 -f"
 1165     1    1 root     apache2 -f /tmp/demo-httpd/httpd.conf -k start
 1167  1165   27 www-data apache2 -f /tmp/demo-httpd/httpd.conf -k start
 1168  1165   27 www-data apache2 -f /tmp/demo-httpd/httpd.conf -k start
 1169  1165   27 www-data apache2 -f /tmp/demo-httpd/httpd.conf -k start
```

Man erkennt einen Elternprozess (PID 1165, ein Thread, Benutzer `root`) und drei Kindprozesse mit je 27 Threads, die als `www-data` laufen. Das passt zu den Standardwerten des `event`-MPM: drei Startprozesse (`StartServers 3`) mit je 25 Arbeits-Threads (`ThreadsPerChild 25`), dazu ein Listener-Thread und der Hauptthread jedes Prozesses. Die Gesamtzahl der gleichzeitig bearbeitbaren Anfragen begrenzt `MaxRequestWorkers`.

Wer die Parameter anpasst, tut das mit wenigen Direktiven. Das Beispiel gibt einer mittelgroßen Instanz einen festen Rahmen:

```apache
<IfModule mpm_event_module>
    StartServers              2
    ServerLimit               8
    ThreadsPerChild          25
    MaxRequestWorkers       200
    MinSpareThreads          50
    MaxSpareThreads         150
    MaxConnectionsPerChild 5000
</IfModule>
```

`ThreadsPerChild` legt die Zahl der Threads je Prozess fest. `ServerLimit` setzt die Obergrenze für die Zahl der Prozesse (und reserviert die dafür nötigen Datenstrukturen). `MaxRequestWorkers` begrenzt die Zahl gleichzeitig bearbeiteter Anfragen insgesamt. Die Werte müssen zusammenpassen: 8 Prozesse mal 25 Threads ergeben genau die 200 Arbeitsplätze. `MinSpareThreads` und `MaxSpareThreads` steuern, wie viele freie Threads Apache vorhält, und `MaxConnectionsPerChild` lässt einen Prozess nach einer bestimmten Zahl von Verbindungen neu starten, was Speicherlecks begrenzt. Die Zahl der *Verbindungen* kann übrigens deutlich über der Zahl der *Anfragen* liegen, weil der Listener ruhende Keep-Alive-Verbindungen übernimmt: Laut Dokumentation gilt mit `AsyncRequestWorkerFactor` (Standard 2) für den Fall, dass alle Arbeiter frei sind, ein Maximum von etwa (Faktor+1)×`MaxRequestWorkers` Verbindungen, hier also rund 600.

### Typische Fehler.

Der erste Klassiker betrifft die Zählung. Ist `MaxRequestWorkers` größer als `ServerLimit` mal `ThreadsPerChild`, kann Apache den Wert nicht erreichen; er senkt ihn beim Start mit einer Warnung (`AH00515`) auf das mögliche Maximum ab. Der zweite Klassiker ist der Einsatz von `mod_php` mit `event` oder `worker`: Das PHP-Modul in Apache war lange nicht für Multithreading ausgelegt, weshalb es mit `prefork` betrieben wurde. Der moderne Weg ist, PHP über `PHP-FPM` auszulagern (Modul 4) und Apache mit `event` zu betreiben. Der dritte Fehler ist das Laden zweier MPMs, das mit der Meldung `AH00534` scheitert. Falsch und richtig gegenübergestellt:

```apache
# falsch: zwei MPMs gleichzeitig
LoadModule mpm_event_module   modules/mod_mpm_event.so
LoadModule mpm_prefork_module modules/mod_mpm_prefork.so

# richtig: genau ein MPM
LoadModule mpm_event_module   modules/mod_mpm_event.so
```

> **Ergänzung aus der Nachrecherche: Grenzen des Event-MPM**
>
> Das `event`-MPM entlastet nur dort, wo der Server Verbindungen *wartet*. Die Apache-Dokumentation nennt Einschränkungen: Ausgabefilter oder Handler, die die gesamte Antwort lesen müssen (typisch bei CGI- oder Proxy-Inhalten, bei denen das Ende der Antwort unbekannt ist), halten einen Arbeits-Thread belegt, bis die Daten gesendet sind. Bei statischen Dateien tritt das nicht auf, weil das MPM weiß, wo der Inhalt endet. Außerdem setzt `event` auf Linux einen Kernel mit `epoll` voraus.

> **Praxisbeispiel: Kapazitätsplanung**
>
> Aus den MPM-Parametern lässt sich der Speicherbedarf grob abschätzen: Prozesse mal Speicher je Prozess. Wer `MaxRequestWorkers` über den verfügbaren Hauptspeicher hinaus erhöht, löst keine Lastprobleme, sondern verlagert sie in Auslagerung (*Swapping*) und damit in drastisch längere Antwortzeiten. Die Abstimmung gehört zu Modul 11; hier genügt das Verständnis der Begriffe.

## 1.6 Konfigurationsmodell

Apache wird ausschließlich über Textdateien konfiguriert. Die Hauptdatei heißt `httpd.conf` (RHEL-artige Systeme) oder `apache2.conf` (Debian und Ubuntu); sie bindet weitere Dateien per `Include` oder `IncludeOptional` ein. Der Unterschied ist einfach: `Include` bricht den Start ab, wenn nichts zum Muster passt, `IncludeOptional` ignoriert fehlende Dateien. Eine Konfiguration besteht aus *Direktiven*, das sind Anweisungen wie `Listen 80`, und aus *Containern* wie `<VirtualHost>` oder `<Directory>`, die andere Direktiven bündeln und auf einen Teilbereich beschränken.

Entscheidend für das Verständnis ist der Begriff des *Kontexts*. Jede Direktive darf nur an bestimmten Stellen stehen: im *Server-Kontext* (global), innerhalb eines `VirtualHost`, innerhalb von `Directory`, `Location` oder `Files` oder in einer `.htaccess`-Datei (Modul 3). In der Referenzdokumentation steht zu jeder Direktive ein Eintrag „Context“ (wo sie erlaubt ist) und „Override“ (ob sie in `.htaccess` erlaubt werden kann). Außerdem gilt das *Vererbungsprinzip*: Was im Server-Kontext steht, gilt auch in allen Containern darunter, solange es dort nicht überschrieben wird.

Zum Aufbau einer wartbaren Konfiguration gehört außerdem die Möglichkeit, Werte und Varianten zu parametrisieren. `Define` legt eine Variable an, die man als `${NAME}` verwendet, und `IfDefine` aktiviert Blöcke nur, wenn beim Start ein Parameter mit `-D` übergeben wurde. Das folgende Beispiel trennt den Basispfad von den Pfaden darunter und erlaubt einen zuschaltbaren Debug-Modus:

```apache
Define SITE_ROOT /tmp/demo-httpd

DocumentRoot "${SITE_ROOT}/htdocs"
<Directory "${SITE_ROOT}/htdocs">
    Require all granted
</Directory>

<IfDefine DEBUG_ZUGRIFF>
    LogLevel info authz_core:debug
</IfDefine>

IncludeOptional "${SITE_ROOT}/conf.d/*.conf"
```

Gestartet wird die zuschaltbare Variante mit `apache2 -f ... -D DEBUG_ZUGRIFF -k start`. Ohne `-D` bleibt der Block wirkungslos. Der Wert in `Define` wird einfach in den Text eingesetzt; deshalb schützt man Pfade mit Leerzeichen durch Anführungszeichen. Die letzte Zeile bindet alle `.conf`-Dateien aus einem Unterverzeichnis ein, sodass jede Anwendung ihre eigene Datei haben kann, ohne die Hauptdatei zu verändern.

Die Distributionen strukturieren diese Einbindungen unterschiedlich, und das erklärt viele Verwirrungen bei Anleitungen aus dem Netz. Debian und Ubuntu zerlegen die Konfiguration in `apache2.conf`, `ports.conf` sowie die Verzeichnisse `mods-enabled`, `conf-enabled` und `sites-enabled`, deren Inhalte Verknüpfungen auf `*-available` sind. RHEL-artige Systeme nutzen `conf/httpd.conf`, `conf.d/*.conf` und `conf.modules.d/*.conf`. Modul 2 geht darauf im Detail ein.

Für den Umgang mit Konfigurationsänderungen gibt es drei Prüfbefehle, die man verinnerlichen sollte. `apachectl configtest` (gleichbedeutend mit `-t`) prüft die Syntax. `apachectl -S` zeigt die aufgelöste Struktur der Virtual Hosts, also welcher Host welche Adresse bedient und welcher der Standard ist. `apachectl -t -D DUMP_INCLUDES` listet alle tatsächlich eingebundenen Dateien. Erst nach erfolgreicher Prüfung wendet man die Änderung mit `apachectl graceful` an: Dabei beenden die Arbeitsprozesse laufende Anfragen sauber und werden durch neue mit der neuen Konfiguration ersetzt.

```text
$ apache2 -f /tmp/demo-httpd/httpd.conf -t -D DUMP_INCLUDES
Included configuration files:
  (*) /tmp/demo-httpd/httpd.conf
    (30) /tmp/demo-httpd/conf.d/doku.conf
    (30) /tmp/demo-httpd/conf.d/proxy.conf
```

Die Zahl in Klammern nennt die Zeile der Hauptdatei, in der die Einbindung steht. Wer eine Konfiguration übernimmt, bekommt so in Sekunden einen Überblick, welche Dateien wirklich eine Rolle spielen.

### Typische Fehler.

Ein verbreiteter Fehler ist, eine Direktive im falschen Kontext zu verwenden, etwa `Listen` innerhalb eines `VirtualHost`. Apache meldet dann `Listen cannot occur within <VirtualHost> section`, und die Zeile muss in den globalen Teil. Ein anderer Fehler: Änderungen werden vorgenommen, ohne sie zu laden. Die Konfiguration wird nur beim Start oder beim `graceful`-Neustart eingelesen, nicht fortlaufend. Wer erst die Syntax prüft und dann neu lädt, vermeidet außerdem, dass ein Tippfehler den laufenden Dienst lahmlegt: Schlägt `configtest` fehl, bleibt der alte Server unangetastet.

> **Merke**
>
> Reihenfolge im Alltag: ändern, `configtest`, bei Erfolg `graceful`. Nie umgekehrt, und nie ohne den Test.

> **Praxisbeispiel: Konfiguration als Code**
>
> Professionell gepflegte Server halten ihre Konfigurationsdateien in einem Git-Repository und rollen sie automatisiert aus (Modul 12). Die Aufteilung in kleine Include-Dateien, pro Anwendung eine, macht Änderungen nachvollziehbar und Rollbacks einfach, weil ein Diff auf genau eine Anwendung zeigt.

## 1.7 Betriebsrollen

„Rolle“ hat in diesem Zusammenhang zwei Bedeutungen, die man auseinanderhalten sollte: die *technische Rolle*, die ein Apache im Netz spielt, und die *organisatorische Rolle*, also die Zuständigkeit der Menschen, die ihn betreiben.

Technisch kann ein Apache mehrere Rollen zugleich einnehmen. Als *Webserver* liefert er Dateien aus. Als *Anwendungs-Frontend* reicht er Anfragen an PHP-FPM oder einen Applikationsserver weiter. Als *TLS-Terminierungspunkt* entschlüsselt er den Datenverkehr. Als *Reverse Proxy* verteilt er Anfragen auf Backends, und in Kubernetes-Umgebungen übernimmt er seltener, aber durchaus, die Rolle einer Ingress-Komponente. Die Rolle bestimmt, worauf es ankommt: Ein reiner Dateiserver braucht gute Caching-Header, ein Proxy braucht saubere Timeouts, ein TLS-Terminierungspunkt braucht sorgfältiges Zertifikatsmanagement.

Mit der technischen Rolle ist auch eine *Rechtetrennung* verbunden. Ports unterhalb von 1024 darf unter Unix nur ein privilegierter Prozess öffnen. Deshalb startet Apache als `root`, öffnet die Ports 80 und 443 und gibt dann die Rechte an Arbeitsprozesse ab, die unter einem unprivilegierten Benutzer laufen (`User` und `Group`). Das Prozessbild aus dem MPM-Abschnitt zeigt das genau: ein Elternprozess als `root`, die Kinder als `www-data`. Ein Angreifer, der einen Arbeitsprozess übernimmt, erbt damit nur die beschränkten Rechte dieses Benutzers.

Organisatorisch lassen sich typische Zuständigkeiten so beschreiben. Die *Betriebsverantwortlichen* installieren, patchen, überwachen und stellen wieder her. Die *Anwendungsverantwortlichen* liefern Inhalte und Anwendungen und brauchen Schreibzugriff auf diese, aber nicht auf die Serverkonfiguration. Das *Security-Team* legt Vorgaben für TLS, Header und Zugriffe fest und prüft sie. Das *Netzwerkteam* verantwortet Firewall, Load Balancer und DNS. Der *Zertifikatsverantwortliche* (oft ein eigenes Team oder ein automatisierter Prozess) erneuert Zertifikate rechtzeitig. Bei kleineren Teams fallen mehrere Rollen in einer Person zusammen; die Trennung der Aufgaben bleibt trotzdem sinnvoll, damit klar ist, wer eine Änderung freigibt.

Eine einfache, aber wirksame Maßnahme der Rechtetrennung ist, die Eigentümerschaft von Dateien zu überprüfen: Die Webanwendung darf ihre Inhalte schreiben, der Webserverprozess soll sie dagegen nur lesen. Das folgende Beispiel zeigt eine solche Aufteilung mit einem eigenen Benutzer für die Inhalte:

```bash
$ sudo useradd --system --home /srv/www --shell /usr/sbin/nologin webinhalt
$ sudo chown -R webinhalt:www-data /srv/www
$ sudo find /srv/www -type d -exec chmod 750 {} \;
$ sudo find /srv/www -type f -exec chmod 640 {} \;
```

Die Dateien gehören nun dem Benutzer `webinhalt`, der Gruppe `www-data` ist nur Lesezugriff erlaubt, für alle anderen ist gar nichts erlaubt. Gibt ein Skript auf dem Server einen Upload in ein Verzeichnis, das der Webserver nur lesen kann, schlägt der Upload fehl; für gewollte Schreibverzeichnisse (etwa einen Cache) vergibt man gezielt zusätzliche Rechte.

### Typische Fehler.

Der gefährlichste Fehler ist ein Webserver, dessen Arbeitsprozess zugleich Eigentümer aller Webdateien ist. Gelingt einem Angreifer dann über eine Schwachstelle in der Anwendung das Schreiben einer Datei, kann er den Inhalt der Website beliebig verändern oder Schadcode ablegen. Ein zweiter Fehler: Apache wird komplett als `root` betrieben, weil das „einfacher“ funktioniert (zum Beispiel, wenn Dateirechte Probleme bereiten). Richtig ist, die Rechte anzupassen und nicht die Rechtetrennung aufzugeben. Auf modernen Systemen kann man den Webserver zudem ohne Root-Rechte auf höhere Ports starten und einen Dienst wie systemd das Binden niedriger Ports regeln lassen.

> **Praxisbeispiel: Wer darf was?**
>
> In Audits wird häufig nach einer *Rollenmatrix* gefragt: Wer darf die Konfiguration ändern, wer darf neu laden, wer sieht die Logs? Hält man diese Zuordnung schriftlich fest und prüft sie regelmäßig, lassen sich unerklärliche Änderungen später auf eine Person zurückführen.

## 1.8 Dokumentation

Ein Webserver, dessen Betrieb nur im Kopf eines Kollegen existiert, ist ein Risiko. Gute *Betriebsdokumentation* beantwortet drei Fragen: Was läuft hier (Bestand)? Warum ist es so konfiguriert (Entscheidungen)? Was tue ich, wenn etwas schiefgeht (Handlungsanweisungen)? Für Apache lässt sich der Bestand zu einem erstaunlich großen Teil *automatisch* aus dem Server selbst ziehen, sodass die Dokumentation nicht veralten kann.

Der Bestand umfasst Version und Build-Informationen (`httpd -V`), den Modulbestand und das verwendete MPM (`httpd -M`), die aufgelösten Virtual Hosts (`httpd -S`) und die eingebundenen Dateien (`-t -D DUMP_INCLUDES`). Dazu kommen Informationen, die nicht im Server stecken: Zweck der Anwendung, verantwortliche Personen, Abhängigkeiten (Backends, Datenbanken, Zertifizierungsstelle), Ports und Firewall-Freigaben, Ablaufdaten der Zertifikate sowie Speicherorte von Logs und Backups.

Die Entscheidungsdokumentation hält fest, warum etwas so gemacht wurde. Bewährt haben sich *Architecture Decision Records* (ADR): kurze Texte mit Titel, Kontext, Entscheidung und Folgen. Ein ADR wie „Wir betreiben Apache mit dem event-MPM und PHP-FPM, weil mod_php nicht thread-sicher ist“ erspart Nachfolgern die Archäologie. Kommentare in der Konfiguration selbst ergänzen das, sollten aber das *Warum* erklären, nicht das *Was*: `# Timeout erhöht wegen langer Exporte (Ticket 4711)` ist nützlich, `# setzt Timeout` nicht.

Die Handlungsanweisungen bündeln sich in *Runbooks*: Schritt-für-Schritt-Anleitungen für wiederkehrende Aufgaben (Zertifikat erneuern, neuen Virtual Host anlegen, Konfiguration zurückrollen) und für typische Störungen. Ein Runbook ist dann gut, wenn es jemand um drei Uhr nachts mit wenig Vorwissen befolgen kann.

Das folgende Skript erzeugt aus einer laufenden Konfiguration ein Textinventar, das man in ein Repository einchecken oder an ein Ticket anhängen kann. Es verwendet nur Bordmittel und lässt sich in einen nächtlichen Job einbinden:

```bash
#!/bin/bash
# httpd-inventar.sh -- Bestandsaufnahme einer Apache-Instanz
set -eu
CONF="${1:?Aufruf: $0 /pfad/zur/httpd.conf}"
BIN="${HTTPD_BIN:-apache2}"        # unter RHEL: HTTPD_BIN=httpd

echo "# Inventar vom $(date +%F)"
echo "## Version";                "$BIN" -f "$CONF" -v | head -n 1
echo "## Module und MPM";         "$BIN" -f "$CONF" -M 2>&1
echo "## Virtual Hosts";          "$BIN" -f "$CONF" -S 2>&1
echo "## Konfigurationsdateien";  "$BIN" -f "$CONF" -t -D DUMP_INCLUDES 2>&1
```

Die Variable `CONF` nimmt den ersten Parameter und bricht mit einer Hilfemeldung ab, wenn er fehlt (das ist die Bedeutung von `:?`). `BIN` erlaubt, den Programmnamen von außen zu überschreiben, sodass dasselbe Skript auf Debian und RHEL läuft. `set -eu` sorgt dafür, dass das Skript bei einem Fehler oder einer nicht gesetzten Variablen sofort stoppt. Die Ausgabe von `-M` und `-S` wird mit `2>&1` zusammengeführt, weil Apache einen Teil davon auf dem Fehlerkanal ausgibt.

### Typische Fehler.

Dokumentation, die von Hand gepflegt wird und nirgends überprüft wird, weicht innerhalb weniger Monate von der Wirklichkeit ab (*Configuration Drift*). Das Gegenmittel ist, soviel wie möglich zu generieren und den Rest an die Änderungsprozesse zu koppeln: Ein Change ist erst abgeschlossen, wenn die Dokumentation aktualisiert wurde. Ebenfalls verbreitet ist das Ablegen von Dokumentation an einem Ort, den nur der Autor kennt. Besser ist ein zentraler, durchsuchbarer Ort mit klarer Struktur.

> **Merke**
>
> Je nach Branche und Auftraggeber können Regelwerke zur Informationssicherheit Nachweise über Systembestand, Änderungen und Verantwortlichkeiten verlangen. Die konkreten Anforderungen hängen von der jeweiligen Organisation ab und sind hier nicht bewertet (**keine Rechtsberatung**). Die in dieser Einheit beschriebenen Artefakte (Inventar, ADRs, Runbooks, Änderungsverlauf im Repository) liefern in der Praxis typische Belege.

> **Praxisbeispiel: Übergabe an das nächste Team**
>
> Wenn ein Betrieb wechselt, ist ein Inventar-Skript wie das obige die schnellste Brücke: Neue Kollegen erhalten in Sekunden die Fakten und können dann gezielt nach den Gründen fragen. Das ist wertvoller als ein dicker, aber veralteter Ordner.

## 1.9 Nginx Zweck und Einordnung

Nginx (gesprochen „engine x“) ist ein Open-Source-Webserver, der von Igor Sysoev entwickelt und 2004 erstmals veröffentlicht wurde. Der ursprüngliche Anlass war ein Leistungsproblem: Große russische Webseiten mussten sehr viele gleichzeitige Verbindungen bedienen, und die damals verbreiteten Server stießen dabei an Grenzen. Nginx wurde deshalb von Anfang an so gebaut, dass wenige Prozesse viele Tausend Verbindungen gleichzeitig halten können. Die Software steht unter einer BSD-artigen Lizenz, und die Weiterentwicklung wird heute vom Unternehmen F5 getragen, das auch die kommerzielle Variante NGINX Plus anbietet (siehe Einheit 1.13).

Die Einsatzrollen von Nginx überlappen sich mit denen von Apache, die Gewichtung ist aber eine andere. Als *Webserver* liefert Nginx statische Dateien sehr effizient aus. Als *Reverse Proxy* leitet er Anfragen an Backends weiter und puffert dabei Antworten, sodass langsame Clients die Anwendungsserver nicht blockieren. Als *Load Balancer* verteilt er Anfragen auf mehrere Backends (Modul 8). Als *TLS-Terminierungspunkt* entschlüsselt er den Datenverkehr (Modul 6). Daneben beherrscht er HTTP-Caching, das Weiterreichen von FastCGI-Anwendungen wie PHP-FPM und über das `stream`-Modul auch das Weiterleiten von rohen TCP- und UDP-Verbindungen, etwa für Datenbanken oder DNS. Dynamische Inhalte erzeugt Nginx anders als Apache nie im eigenen Prozess, sondern übergibt sie stets an einen separaten Dienst.

Das folgende Beispiel verbindet die zwei häufigsten Rollen in einer kleinen, vollständig lauffähigen Konfiguration: statische Dateien lokal ausliefern und alles unter `/api/` an ein Backend weiterleiten. Sie wird mit `nginx -c ... -p ...` gestartet, damit sie eine bestehende Installation nicht stört; die Option `-p` legt das Präfixverzeichnis für relative Pfade fest.

```nginx
worker_processes 2;
pid /tmp/demo-nginx/nginx.pid;
error_log /tmp/demo-nginx/error.log notice;

events {
    worker_connections 512;
}

http {
    include /etc/nginx/mime.types;
    access_log /tmp/demo-nginx/access.log;

    server {
        listen 127.0.0.1:8081;
        server_name localhost;
        root /tmp/demo-nginx/html;

        location / {
            index index.html;
        }
        location /api/ {
            proxy_pass http://127.0.0.1:9000/;
        }
        location /nginx_status {
            stub_status;
            allow 127.0.0.1;
            deny all;
        }
    }
}
```

Die Datei ist hierarchisch aufgebaut. Direktiven außerhalb jedes Blocks gehören zum *main*-Kontext und betreffen den ganzen Prozess: `worker_processes` legt die Zahl der Arbeitsprozesse fest, `pid` und `error_log` bestimmen Dateien. Der Block `events` regelt das Verbindungsverhalten, hier die maximale Zahl gleichzeitiger Verbindungen je Arbeitsprozess. Der Block `http` enthält alles Weitere für das HTTP-Protokoll, und darin beschreibt `server` einen virtuellen Server. `listen` legt Adresse und Port fest, `root` das Verzeichnis, aus dem Dateien kommen. Jeder `location`-Block gilt für Pfade eines bestimmten Musters: `/` fängt alles ab, was nichts Spezielleres trifft, `/api/` leitet per `proxy_pass` an das Backend weiter, und `/nginx_status` liefert einfache Zähler, aber nur für lokale Anfragen.

### Typische Fehler.

Zwei Stolpersteine betreffen Anfänger fast immer. Erstens der abschließende Schrägstrich bei `proxy_pass`: Mit Schrägstrich am Ende (`http://127.0.0.1:9000/`) wird der Präfix der `location` durch die Zieladresse ersetzt, ohne Schrägstrich (`http://127.0.0.1:9000`) wird der volle Pfad unverändert weitergereicht. Beide Varianten sind sinnvoll, aber verschieden, und eine Verwechslung ergibt Fehler 404 am Backend. Zweitens fehlt gern das Semikolon am Zeilenende; die Fehlermeldung nennt dann oft die *folgende* Zeile.

```nginx
# falsch: Semikolon fehlt, Meldung zeigt auf die nächste Zeile
location /api/ {
    proxy_pass http://127.0.0.1:9000/
}
# richtig
location /api/ {
    proxy_pass http://127.0.0.1:9000/;
}
```

> **Ergänzung aus der Nachrecherche: Aktueller Versionsstand**
>
> Auf der Nachrichtenseite von nginx.org sind für 2026 unter anderem folgende Veröffentlichungen verzeichnet: **1.30.6** (Stable, 14. 10. 2026) und **1.31.8** (Mainline, 21. 10. 2026). Es existieren also zwei parallele Linien: *Mainline* mit neuen Funktionen und *Stable* mit Fehlerkorrekturen, die aus Mainline zurückportiert werden. Nach der offiziellen Installationsanleitung erkennt man die Linie an der mittleren Versionsnummer: ungerade (hier 31) für Mainline, gerade (hier 30) für Stable. Abgerufen am 31. 10. 2026; Details im Quellenverzeichnis.

> **Praxisbeispiel: Nginx am Rand des Netzes**
>
> In vielen modernen Architekturen steht Nginx als erste Station am Rand: Er beendet TLS, setzt Header, schützt vor Missbrauch (Rate Limiting) und gibt Anfragen an Anwendungsserver dahinter weiter. Die Konfiguration bleibt dabei meist klein und lesbar. Auch wer Apache betreibt, begegnet Nginx früher oder später, zum Beispiel als Ingress-Controller oder als Proxy in einem Container-Verbund.

## 1.10 Event-driven Architektur

Um zu verstehen, warum Nginx mit so wenigen Prozessen auskommt, lohnt der Blick auf die klassische Alternative. Beim *Thread-pro-Verbindung*-Modell wartet für jede Verbindung ein eigener Thread (oder Prozess) auf Daten. Ein Thread, der wartet, ist nicht untätig im Sinne von rechenfrei: Er belegt Speicher für seinen Stapel, verursacht Verwaltungsaufwand im Betriebssystem und muss beim Umschalten zwischen Threads (*Kontextwechsel*) Zeit kosten. Bei einigen Tausend wartenden Verbindungen summiert sich das. Das Problem hat einen eigenen Namen, *C10k-Problem*: Wie bedient man zehntausend gleichzeitige Verbindungen auf einem Rechner?

Die Antwort von Nginx ist eine *ereignisgesteuerte* (englisch *event-driven*) und *asynchrone* Verarbeitung. Jeder Arbeitsprozess hat nur einen Thread und führt eine Endlosschleife aus, die sogenannte *Event-Loop*. In dieser Schleife fragt er das Betriebssystem über einen Mechanismus wie `epoll` (Linux) oder `kqueue` (BSD, macOS): „Bei welchen meiner Verbindungen ist gerade etwas passiert?“ Das Betriebssystem meldet nur diejenigen Verbindungen, für die tatsächlich Daten angekommen sind oder bei denen ein Schreibvorgang möglich ist. Der Prozess bearbeitet genau diese kurz, ohne zu blockieren, und kehrt zur Schleife zurück. Verbindungen, bei denen nichts passiert, kosten fast nichts, nur einen kleinen Datensatz im Speicher.

Man kann sich das wie einen Kellner vorstellen, der nicht an einem Tisch stehen bleibt, bis die Gäste ausgewählt haben, sondern zwischen den Tischen umhergeht und nur dort etwas tut, wo jemand die Hand hebt. Ein einziger Kellner kann so viele Tische bedienen, solange kein Gast den Kellner mit einer langwierigen Aufgabe festhält.

Genau darin liegt die Einschränkung: Alles, was in einem Arbeitsprozess blockiert, hält *alle* seine Verbindungen auf. Rechenintensive Aufgaben oder langsame Plattenzugriffe im Hauptthread sind deshalb zu vermeiden; für Dateizugriffe gibt es optional Thread-Pools (Option `aio threads`), und dynamische Inhalte lagert Nginx grundsätzlich an Backends aus. Das erklärt auch, warum Nginx keine Skriptsprachen „im Server“ ausführt, wie es Apache mit seinen Modulen kann.

Die folgende Messung macht das Modell greifbar. In der oben gezeigten Testkonfiguration laufen zwei Arbeitsprozesse mit je höchstens 512 Verbindungen. Ein kleines Python-Skript öffnet nun 300 Verbindungen und lässt sie offen. Nginx zählt sie, und die Prozessliste zeigt, dass beide Arbeitsprozesse nach wie vor genau einen Thread haben:

```text
Active connections: 301
server accepts handled requests
 306 306 306
Reading: 0 Writing: 1 Waiting: 300

 1427    1 nginx: worker process
 1428    1 nginx: worker process
```

`Active connections` enthält neben den 300 wartenden Verbindungen auch die Abfrage der Statusseite selbst. Unter `Waiting` stehen die 300 Verbindungen, die offen sind und auf eine weitere Anfrage warten, ohne einen Thread zu binden. Die zweite Spalte der Prozessliste ist die Threadzahl und beträgt je Prozess eins. Mit dem Prozessmodell von Apache `prefork` wären dafür 300 Prozesse nötig gewesen.

Die theoretische Obergrenze folgt aus zwei Direktiven: Die höchste Zahl gleichzeitiger Clients beträgt ungefähr `worker_processes` mal `worker_connections`. Beim Betrieb als Reverse Proxy halbiert sich das etwa, weil jede Client-Verbindung eine zweite Verbindung zum Backend benötigt. Zusätzlich begrenzt das Betriebssystem die Zahl offener Dateien (`ulimit -n`); jede Verbindung ist eine Datei. Die Direktive `worker_rlimit_nofile` hebt diese Grenze für Nginx an, wenn das System es zulässt.

### Typische Fehler.

Wird `worker_connections` zu niedrig gewählt, steht im Errorlog die Meldung `worker_connections are not enough`, und neue Verbindungen werden abgewiesen. Falsch ist die Annahme, mehr Arbeitsprozesse als CPU-Kerne brächten mehr Leistung: Da jeder Prozess die Event-Loop eines Kerns ausfüllt, genügt in der Regel ein Prozess je Kern (`worker_processes auto`). Ebenfalls zu vermeiden sind Drittmodule oder Skripte, die den Prozess blockieren.

```nginx
# eher falsch: feste, willkürliche Zahl
worker_processes 64;
# besser: eine Event-Loop pro CPU-Kern
worker_processes auto;
```

> **Merke**
>
> Nginx ist nicht deshalb schnell, weil jede einzelne Anfrage schneller bearbeitet wird, sondern weil wartende Verbindungen fast nichts kosten. Der Vorteil zeigt sich bei vielen gleichzeitigen, überwiegend ruhenden Verbindungen: Keep-Alive, langsame Clients, Streaming, WebSockets.

> **Praxisbeispiel: Warum Proxys puffern**
>
> Ein typisches Problem bei Anwendungsservern ist der „Slow Client“: Ein Handy mit schlechter Verbindung nimmt die Antwort nur in kleinen Häppchen ab und hält den Anwendungsthread lange fest. Ein ereignisgesteuerter Proxy davor nimmt die komplette Antwort schnell vom Backend entgegen und verteilt sie in Ruhe an den Client. Das Backend ist sofort wieder frei. Dieser Effekt allein rechtfertigt in vielen Projekten den Einsatz von Nginx vor einem Anwendungsserver.

## 1.11 Master und Worker

Nginx besteht zur Laufzeit aus mehreren Prozessen mit klar getrennten Aufgaben. Der *Master-Prozess* liest und prüft die Konfiguration, öffnet die lauschenden Ports, startet und überwacht die Arbeitsprozesse und nimmt Signale vom Administrator entgegen. Er bearbeitet selbst keine Anfragen. Die *Worker-Prozesse* nehmen Verbindungen an und beantworten sie; ihre Zahl legt `worker_processes` fest, entweder als feste Zahl oder mit `auto` entsprechend der CPU-Kerne. Hinzu kommen bei aktivem Caching zwei Hilfsprozesse, *cache manager* und *cache loader*, die den Cache pflegen.

Das Prozessbild der Testinstanz zeigt die Aufteilung. Der Master läuft als `root`, damit er privilegierte Ports öffnen kann, die Worker laufen unter einem unprivilegierten Benutzer (hier `nobody`; das Paket unter Debian und Ubuntu setzt `www-data`, festgelegt über die Direktive `user`):

```text
$ ps -eo pid,ppid,user,args | grep "[n]ginx:"
 1270     1 root     nginx: master process nginx -c /tmp/demo-nginx/nginx.conf ...
 1271  1270 nobody   nginx: worker process
 1272  1270 nobody   nginx: worker process
```

Gesteuert wird Nginx über Signale an den Master. Die Beschreibung „Start, Stopp, Neuladen“ aus der offiziellen Einführung bildet das Gerüst: Der Aufruf `nginx -s SIGNAL` sendet das Signal an den laufenden Master, wobei `stop` den Dienst schnell beendet, `quit` ihn *geordnet* beendet (laufende Anfragen werden noch fertiggestellt), `reload` die Konfiguration neu lädt und `reopen` die Logdateien neu öffnet. Das Kommando muss unter demselben Benutzer laufen, der Nginx gestartet hat. Hinter diesen Kommandos stehen Unix-Signale, die man auch direkt mit `kill` senden kann: `TERM` oder `INT` für den schnellen Stopp, `QUIT` für den geordneten, `HUP` für das Neuladen und `USR1` für das Neuöffnen der Logs. Mit `USR2` und `WINCH` lässt sich zudem die Programmdatei im laufenden Betrieb austauschen; das behandelt Modul 13.

Das Neuladen ist der wichtigste Ablauf. Laut der offiziellen Einführung prüft der Master zunächst die Syntax der neuen Konfiguration. Ist sie gültig, startet er neue Worker mit der neuen Konfiguration und weist die alten an, sich zu beenden. Die alten Worker nehmen keine neuen Verbindungen mehr an, bearbeiten aber bestehende Anfragen zu Ende. Ist die neue Konfiguration fehlerhaft, macht der Master die Änderung rückgängig und arbeitet mit der alten weiter. Dadurch gibt es beim Reload keine Ausfallzeit. Das Experiment aus der Testumgebung belegt es: Die PID des Masters bleibt gleich, die der Worker ändert sich.

```text
$ nginx -c /tmp/demo-nginx/nginx.conf -p /tmp/demo-nginx/ -s reload
$ ps -eo pid,ppid,user,args | grep "[n]ginx:"
 1270     1 root     nginx: master process nginx -c /tmp/demo-nginx/nginx.conf ...
 1280  1270 nobody   nginx: worker process
 1282  1270 nobody   nginx: worker process
```

Der Master (1270) lebt weiter, die Worker haben neue Nummern (vorher 1271 und 1272). Im Errorlog stehen die zugehörigen Meldungen, darunter `signal 1 (SIGHUP) received ..., reconfiguring` und `start worker process`. Vergleich mit Apache: `apachectl graceful` erreicht dasselbe Ziel, bei Apache heißt der Ablauf *graceful restart*.

### Typische Fehler.

Ein häufiger Fehler ist, einen vollständigen Neustart (`systemctl restart nginx`) auszuführen, obwohl ein Reload genügt: Der Neustart beendet alle Verbindungen. Ein zweiter: die Konfiguration nicht vorher mit `nginx -t` prüfen. Zwar fängt Nginx beim Reload einen Syntaxfehler ab, aber bei einem Neustart würde der Dienst mit fehlerhafter Konfiguration nicht mehr hochkommen. Drittens: Den Master-Prozess mit `kill -9` abzuschießen, hinterlässt verwaiste Worker und eine veraltete PID-Datei.

```bash
# falsch: harter Neustart, bricht Verbindungen ab, ohne Test
$ sudo systemctl restart nginx
# richtig: erst testen, dann sanft neu laden
$ sudo nginx -t && sudo nginx -s reload
```

> **Praxisbeispiel: Reload nach Zertifikatserneuerung**
>
> Wenn ein automatisierter Dienst (wie ein ACME-Client) ein neues Zertifikat ablegt, ist ein Reload das gängige Mittel, damit Nginx es verwendet. Weil der Reload ohne Ausfall abläuft, kann er bedenkenlos in einem nächtlichen Job oder nach jeder Erneuerung geschehen, solange `nginx -t` davor erfolgreich war.

## 1.12 Request Processing

Nach dem Start fragt man sich: Wie entscheidet Nginx, welche Konfiguration auf eine Anfrage zutrifft? Der Ablauf besteht aus zwei Auswahlschritten, die man genau kennen sollte, weil an ihnen die meisten Konfigurationsfehler hängen.

Der erste Schritt ist die Auswahl des *Servers*. Nginx prüft zunächst, an welcher Adresse und welchem Port die Anfrage ankam, und vergleicht das mit den `listen`-Direktiven der `server`-Blöcke. Gibt es mehrere passende Server (typisch bei Name-based Virtual Hosts, also mehreren Websites auf derselben IP und demselben Port), entscheidet der `Host`-Header der Anfrage: Er wird mit den Werten der Direktive `server_name` verglichen. Passt kein Name, nimmt Nginx den *Standardserver* dieses Ports. Das ist der Server, der `default_server` in seiner `listen`-Direktive trägt, und ohne diese Angabe der *erste* Server in der Konfiguration, der den Port bedient. Der Standardserver gehört dabei zum Port, nicht zum Namen.

Der zweite Schritt ist die Auswahl der *Location* innerhalb des gewählten Servers. Nginx betrachtet dazu nur den Pfadteil der Anfrage ohne Query-String und geht in dieser Reihenfolge vor. Zuerst sucht es unter den Präfix-Locations (einfache Zeichenketten) die mit dem *längsten* passenden Präfix, unabhängig von ihrer Position in der Datei. Dann prüft es die Locations mit regulären Ausdrücken (`~` und `~*`) *in der Reihenfolge des Auftretens*; der erste Treffer gewinnt und beendet die Suche. Trifft kein regulärer Ausdruck, gilt die zuvor gemerkte Präfix-Location. Es gibt daher eine wichtige Asymmetrie: Bei Präfixen entscheidet die *Länge*, bei regulären Ausdrücken die *Reihenfolge*. Die Modifikatoren `=` (exakter Treffer) und `^~` (Präfix, das die regulären Ausdrücke ausschaltet) verfeinern das Verhalten und werden in Modul 3 behandelt.

Zur Kontrolle dient die Testkonfiguration aus Einheit 1.9, ergänzt um eine Regel für Bilddateien und einen zweiten Server. Die Tabelle zeigt, welche Location jeweils trifft; die Ergebnisse wurden mit `curl` überprüft.

```nginx
server {
    listen 127.0.0.1:8081;
    server_name localhost;
    root /tmp/demo-nginx/html;

    location / {
        index index.html;
    }
    location ~* \.(gif|jpg|png)$ {
        add_header X-Treffer "regex-bild" always;
    }
}
server {
    listen 127.0.0.1:8081;
    server_name zweite.example;
    return 200 "zweiter server\n";
}
```

| **Anfrage**    | **Gewählte Location**    | **Beobachtung**                                 |
|:---------------|:-------------------------|:------------------------------------------------|
| `/about.html`      | `/`                | liefert `about.html` aus dem Dokumentenverzeichnis |
| `/logo.gif`      | Regex `~* \.(gif\|jpg\|png)$`          | Antwort enthält den Header `X-Treffer: regex-bild`            |
| Host `zweite.example` | zweiter Server           | Antwort „zweiter server“                        |
| Host `unbekannt.example` | erster Server (Standard) | unbekannter Name landet beim ersten Server      |

Nach der Auswahl der Location durchläuft die Anfrage weitere Verarbeitungsphasen, die Nginx intern kennt: Umschreiben von Adressen, Zugriffsprüfung, die Inhaltsauslieferung durch einen *Handler* (statische Datei, Proxy, FastCGI) und zuletzt das Logging. Wichtig für den Anfang ist, dass die Ebene `location` der Ort ist, an dem Nginx entscheidet, *was* mit einer Anfrage geschieht.

### Typische Fehler.

Das klassische Missverständnis lautet, die Reihenfolge der `location`-Blöcke sei überall entscheidend. Das stimmt nur für reguläre Ausdrücke. Wer ein Präfix „weiter unten“ in der Datei definiert, wird trotzdem vorgezogen, wenn es länger passt. Ein zweiter Fehler betrifft den Standardserver: Verlässt man sich darauf, dass „der richtige“ Server unbekannte Hostnamen bekommt, bedient irgendein Zufallskandidat sie. Besser ist ein expliziter Auffangserver, der unerwünschte Anfragen ablehnt:

```nginx
# falsch: kein expliziter Standard, der erste Server nimmt alles
server { listen 80; server_name shop.example; }

# richtig: ein ausdrücklicher Auffangserver weist Unbekanntes ab
server {
    listen 80 default_server;
    server_name _;
    return 444;
}
server { listen 80; server_name shop.example; }
```

Der Statuscode 444 ist eine Nginx-Besonderheit: Er schließt die Verbindung, ohne zu antworten. Der Platzhalter `_` ist ein beliebiger, nie vorkommender Name; entscheidend ist `default_server`.

> **Ergänzung aus der Nachrecherche: Quelle der Auswahlregeln**
>
> Die Reihenfolge der Auswahl (Server nach Port und Host-Header, Location nach längstem Präfix und erstem passenden regulären Ausdruck) entspricht der Beschreibung in der offiziellen Nginx-Dokumentation „How nginx processes a request“. Dort werden `=` und `^~` nicht behandelt; sie sind in der Referenz der Direktive `location` beschrieben und folgen in Modul 3.

> **Praxisbeispiel: Mehrere Websites, ein Server**
>
> Betreibt man auf einer IP-Adresse mehrere Domains, ist die Qualität des Auffangservers ein Sicherheitsmerkmal: Er verhindert, dass Scans nach beliebigen Hostnamen Inhalte einer echten Website erhalten. In Logs fallen solche Zugriffe als Anfragen mit seltsamen Hostnamen oder der reinen IP-Adresse auf.

## 1.13 Open Source und NGINX Plus

Unter dem Namen „Nginx“ laufen heute zwei Produktlinien. Die *Open-Source-Variante* (auch *NGINX Open Source*, kurz OSS) wird auf nginx.org entwickelt und ist kostenlos. Daneben vertreibt das Unternehmen F5 *NGINX Plus*, eine kommerzielle, auf der Open-Source-Basis aufbauende Distribution mit zusätzlichen Funktionen und Herstellersupport. Dazu kommen Pakete von Betriebssystem-Distributionen, die teils ältere Versionen enthalten und eigene Patches mitbringen, sowie Forks wie freenginx, die aus der Community hervorgegangen sind. Für die Praxis ist wichtig, dass sich Konfigurationen zwischen OSS und Plus teilweise nicht uneingeschränkt übertragen lassen.

F5 beschreibt NGINX Plus als Erweiterung von NGINX Open Source um „advanced traffic control, security, and observability“. Als Beispiele nennt die Produktseite unter anderem erweiterte Lastverteilung mit aktiven Health Checks, die Änderung der Konfiguration über eine API ohne Neuladen, mehr als 200 Echtzeitmetriken, dynamisches Zertifikatsmanagement und eine direkte Kubernetes-Integration, zudem Herstellersupport. Die Open-Source-Variante bietet die grundlegenden Funktionen (Webserver, Reverse Proxy, Load Balancing, Caching, TLS), überlässt aber Überwachung und Automatisierung weitgehend externen Werkzeugen.

Die Unterschiede werden in der Konfiguration sichtbar. Direktiven, die nur NGINX Plus kennt, lehnt die Open-Source-Version beim Start ab. Das folgende Beispiel nutzt `health_check`, eine Plus-Funktion für aktive Gesundheitsprüfungen von Backends:

```nginx
events {}
http {
    upstream app { server 127.0.0.1:9000; }
    server {
        listen 127.0.0.1:8082;
        location / {
            proxy_pass http://app;
            health_check;
        }
    }
}
```

Mit Nginx Open Source schlägt die Prüfung fehl:

```text
$ nginx -t -c /tmp/demo-nginx/plus.conf -p /tmp/demo-nginx/
[emerg] unknown directive "health_check" in /tmp/demo-nginx/plus.conf:4
nginx: configuration file /tmp/demo-nginx/plus.conf test failed
```

Die Meldung `unknown directive` bedeutet: Das Programm kennt die Direktive nicht, weil sie in diesem Build nicht vorhanden ist. In Open Source stehen nur *passive* Prüfungen zur Verfügung (Parameter `max_fails` und `fail_timeout` am `server`), die Ausfälle erst anhand echter Anfragen feststellen (Modul 8).

Die Wahl zwischen Apache, Nginx Open Source und NGINX Plus ist keine Glaubensfrage, sondern eine Abwägung. Apache ist stark, wenn viele Direktiven in Verzeichnissen per `.htaccess` delegiert werden sollen (Hosting), wenn bewährte Module wie `mod_rewrite` oder `mod_security` gebraucht werden, oder wenn das Team die Apache-Konfiguration bereits kennt. Nginx Open Source ist stark als schlanker Proxy und Dateiserver mit vielen gleichzeitigen Verbindungen. NGINX Plus lohnt sich, wenn aktive Health Checks, eine Konfigurations-API, detaillierte Metriken oder Herstellersupport vertraglich verlangt werden. Auch eine Kombination ist verbreitet, zum Beispiel Nginx als Proxy vor einem Apache, der die PHP-Anwendung hostet.

### Typische Fehler.

Der häufigste Fehler ist das Kopieren von Beispielen aus der Plus-Dokumentation (`docs.nginx.com`) in eine Open-Source-Installation. Dann stoppt der Test mit `unknown directive`. Die Dokumentation kennzeichnet Plus-Funktionen, der Blick darauf spart Zeit. Der gegenteilige Fehler ist, Plus zu kaufen, weil eine Funktion benötigt wird, die mit Bordmitteln von Nginx Open Source oder externen Werkzeugen ausreichend lösbar wäre. Ein dritter: Versionslinien verwechseln. Stable und Mainline sind zwei Äste derselben Open-Source-Software, nicht Open Source und Plus.

```bash
# Prüfen, welche Version und welche Module vorhanden sind
$ nginx -V
nginx version: nginx/1.24.0 (Ubuntu)
built with OpenSSL 3.0.13 30 Jan 2024
TLS SNI support enabled
...
```

`nginx -V` (großes V) gibt Version und die beim Bauen verwendeten `configure`-Argumente aus und zeigt damit, welche Module der konkrete Build enthält. Der Befehl ist die Nginx-Entsprechung zu `httpd -V` und `httpd -M`.

> **Ergänzung aus der Nachrecherche: Quellenlage und Lizenzen**
>
> Zum Funktionsumfang von NGINX Plus stützt sich dieser Abschnitt auf die Herstellerseite von F5 („Compare NGINX Models“), die von Werbesprache nicht frei ist: Nachprüfbar sind die genannten Funktionen, weniger die Gewichtung. Zu Lizenz und Preismodellen enthält diese Quelle keine Angaben; verbindliche Informationen holt man direkt beim Hersteller ein. Rechtliche Fragen der Lizenznutzung sind hier nicht erörtert (**keine Rechtsberatung**).

> **Praxisbeispiel: Entscheidungsvorlage**
>
> In Projekten wird die Wahl des Webservers selten allein technisch getroffen. Gute Entscheidungsvorlagen vergleichen anhand weniger Kriterien: vorhandenes Know-how, benötigte Funktionen, Supportanforderungen, Betriebskosten und Integrationsaufwand. Halten Sie das Ergebnis in einem ADR fest (siehe Einheit 1.8), damit spätere Teams die Gründe kennen.

## Übungsaufgaben

Die Aufgaben steigen im Schwierigkeitsgrad. Die Aufgaben 7 und 8 sind praktische Konfigurationsaufgaben, die Sie in einer eigenen Testumgebung (Container, virtuelle Maschine) nachbauen sollten. Die Lösungen stehen im nächsten Abschnitt; versuchen Sie zuerst, ohne hineinzusehen.

**Aufgabe 1 (leicht).** Erklären Sie in je ein bis zwei Sätzen den Unterschied zwischen einem Webserver, einem Forward Proxy und einem Reverse Proxy. Nennen Sie zwei Gründe, einen Reverse Proxy vor einen Anwendungsserver zu stellen.

**Aufgabe 2 (leicht).** Entscheiden Sie bei jeder Aussage, ob sie richtig oder falsch ist, und begründen Sie kurz. (a) Ein Apache kann gleichzeitig die MPMs `event` und `prefork` geladen haben. (b) Ein Nginx-Worker bearbeitet jede Verbindung in einem eigenen Thread. (c) `IncludeOptional` bricht den Start ab, wenn keine passende Datei existiert. (d) Ein `nginx -s reload` unterbricht laufende Anfragen.

**Aufgabe 3 (leicht bis mittel).** Welches MPM würden Sie wählen? Begründen Sie jeweils. (a) Ein Server liefert überwiegend statische Dateien an Browser, die Verbindungen lange offen halten (Keep-Alive). (b) Auf einem Altsystem läuft ein Apache-Modul, das nicht thread-sicher ist, und es lässt sich nicht austauschen.

**Aufgabe 4 (mittel).** Rechnen Sie. (a) Ein Apache mit `event`-MPM hat `ThreadsPerChild 32`, `ServerLimit 6` und `AsyncRequestWorkerFactor 2`. Wie hoch kann `MaxRequestWorkers` höchstens sinnvoll gesetzt werden, und wie viele Verbindungen sind bei lauter freien Arbeitern ungefähr möglich? (b) Ein Nginx hat `worker_processes 4` und `worker_connections 1024`. Wie viele gleichzeitige Clients sind ungefähr möglich, einmal als Dateiserver und einmal als Reverse Proxy?

**Aufgabe 5 (mittel).** Ein Administrator hat in Apache die URL `/intern/` mit `<Location "/intern/">` und `Require ip 10.0.0.0/8` geschützt. Die Dateien liegen unter `/srv/intern`. Ein Kollege legt später `Alias "/archiv" "/srv/intern"` mit eigenem `Directory`-Block und `Require all granted` an. Was passiert, und wie hätte man es vermeiden können? Beziehen Sie sich auf den Request Lifecycle.

**Aufgabe 6 (mittel bis schwer).** Gegeben ist dieser Nginx-Server. Geben Sie für jede der sechs Anfragen an, welche Location gewählt wird.

```nginx
server {
    listen 80;
    server_name a.example;
    location /                       { return 200 "L1\n"; }
    location /img/                   { return 200 "L2\n"; }
    location /img/icons/             { return 200 "L3\n"; }
    location ~ \.png$                { return 200 "L4\n"; }
    location ~* ^/img/.*\.(jpg|png)$ { return 200 "L5\n"; }
}
```

Anfragen: `/index.html`, `/img/a.gif`, `/img/icons/x.gif`, `/img/logo.png`, `/IMG/LOGO.PNG`, `/img/icons/up.png`.

**Aufgabe 7 (praktisch).** Schreiben Sie einen Apache-Konfigurationsausschnitt, der alle Anfragen unter `/app/` an ein Backend auf `127.0.0.1:3000` weiterleitet, Redirects des Backends korrekt zurückübersetzt und den Forward-Proxy-Betrieb ausdrücklich abschaltet. Nennen Sie die benötigten Module und prüfen Sie die Syntax mit einem Befehl.

**Aufgabe 8 (praktisch).** Schreiben Sie eine vollständige `nginx.conf`: Arbeitsprozesse nach CPU-Kernen, ein Standardserver auf Port 8080, der unbekannte Hostnamen mit Verbindungsabbruch beantwortet, ein Server für `www.beispiel.test` mit Dokumentenverzeichnis `/srv/www` und `index.html` als Startseite, sowie eine Statusseite unter `/status`, die nur von der lokalen Adresse erreichbar ist (eigener Server auf `127.0.0.1:8081`). Prüfen Sie die Konfiguration, ohne den Dienst zu starten.

**Aufgabe 9 (schwer).** Analysieren Sie folgende vier Meldungen: Nennen Sie jeweils Ursache und Behebung. (a) `AH00534: ... Configuration error: More than one MPM loaded.` (b) `Unknown Authz provider: local` (c) `[emerg] unknown directive "health_check"` (d) `worker_connections are not enough`. Skizzieren Sie danach in fünf Schritten ein sicheres Vorgehen, mit dem eine Konfigurationsänderung auf einem Produktivserver (Apache *oder* Nginx) eingespielt wird.

## Lösungen und Erklärungen

### Lösung zu Aufgabe 1.

Ein Webserver erzeugt Antworten selbst, etwa durch Auslieferung von Dateien. Ein Forward Proxy steht auf der Clientseite und holt Inhalte im Auftrag der Clients aus dem Internet. Ein Reverse Proxy steht auf der Serverseite, nimmt Anfragen entgegen und leitet sie an Backends weiter. Gründe für einen Reverse Proxy sind unter anderem: Auslagerung von TLS und Komprimierung, Schutz der Backends durch Netztrennung, Verteilung auf mehrere Backends, zentrale Protokollierung und die Pufferung langsamer Clients. Zwei davon genügen.

### Lösung zu Aufgabe 2.

\(a\) *Falsch.* Es darf genau ein MPM geladen sein, sonst bricht der Start mit `AH00534` ab. (b) *Falsch.* Nginx-Worker arbeiten mit einer Event-Loop in einem Thread und bedienen darin viele Verbindungen gleichzeitig. (c) *Falsch.* Das ist das Verhalten von `Include`; `IncludeOptional` ignoriert fehlende Dateien. (d) *Falsch.* Beim Reload starten neue Worker, die alten bearbeiten laufende Anfragen noch zu Ende und beenden sich dann.

### Lösung zu Aufgabe 3.

\(a\) `event`: Der Listener-Thread überwacht ruhende Keep-Alive-Verbindungen, ohne Arbeits-Threads zu blockieren; statische Dateien sind dafür der ideale Fall. (b) `prefork`: Jede Verbindung läuft in einem eigenen Prozess, daher spielt die fehlende Thread-Sicherheit keine Rolle. Perspektivisch ist es besser, das Modul abzulösen (zum Beispiel PHP über PHP-FPM), um auf `event` wechseln zu können.

### Lösung zu Aufgabe 4.

\(a\) `MaxRequestWorkers` sollte höchstens `ServerLimit`×`ThreadsPerChild` = 6× 32 = 192 betragen; ein größerer Wert würde von Apache auf diese Zahl abgesenkt (Meldung `AH00515`). Bei lauter freien Arbeitern sind ungefähr (2+1)× 192 = 576 Verbindungen möglich, weil der Listener ruhende Verbindungen zusätzlich übernimmt. (b) Als Dateiserver gilt 4× 1024 = 4096 gleichzeitige Clients. Als Reverse Proxy braucht jeder Client zusätzlich eine Verbindung zum Backend, daher sind es etwa die Hälfte, also rund 2048. Beide Werte sind Obergrenzen; die Betriebssystemgrenze für offene Dateien kann früher greifen.

### Lösung zu Aufgabe 5.

Die Dateien sind über `/archiv` weiterhin erreichbar, und zwar ohne IP-Beschränkung. Der `Location`-Block gilt nur für den URL-Pfad `/intern/`. Über `/archiv` bildet `translate_name` die URL auf dieselben Dateien ab, und die Zugriffsprüfung stützt sich dann auf den `Directory`-Block, der alles erlaubt. Vermeiden lässt sich das, indem man den Schutz am Dateisystemort verankert: ein `<Directory "/srv/intern">` mit `Require ip 10.0.0.0/8`. Dann greift die Regel unabhängig davon, über welchen URL-Pfad die Dateien erreicht werden.

### Lösung zu Aufgabe 6.

Maßgeblich sind die Regeln: längstes Präfix merken, dann reguläre Ausdrücke der Reihe nach prüfen, erster Treffer gewinnt, sonst das gemerkte Präfix. `/index.html`: kein Regex passt, Präfix `/` gewinnt, also **L1**. `/img/a.gif`: längstes Präfix `/img/`, kein Regex passt (`.gif`), also **L2**. `/img/icons/x.gif`: längstes Präfix `/img/icons/`, kein Regex, also **L3**. `/img/logo.png`: Regex L4 passt als Erster, also **L4** (auch L5 würde passen, kommt aber später). `/IMG/LOGO.PNG`: L4 ist groß-/kleinschreibungsabhängig und passt nicht, L5 (`~*`) passt, also **L5**. `/img/icons/up.png`: längstes Präfix wäre L3, aber ein Regex passt (L4) und geht vor, also **L4**. Das Ergebnis wurde in der Testumgebung mit `curl` bestätigt.

### Lösung zu Aufgabe 7.

Benötigt werden `mod_proxy` und `mod_proxy_http`.

```apache
LoadModule proxy_module      modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so

ProxyRequests Off
ProxyPass        "/app/" "http://127.0.0.1:3000/"
ProxyPassReverse "/app/" "http://127.0.0.1:3000/"
```

Die Syntaxprüfung erfolgt mit `apachectl configtest` (oder `apache2 -f <Datei> -t`). `ProxyRequests Off` schaltet den Forward-Proxy-Betrieb ab, `ProxyPass` bildet `/app/` auf das Backend ab, `ProxyPassReverse` übersetzt Weiterleitungen des Backends zurück. Auf beiden Seiten steht der Schrägstrich am Ende. Falls die Module schon an anderer Stelle geladen werden, meldet Apache nur eine Warnung, dass ein Modul bereits geladen ist (`AH01574`).

### Lösung zu Aufgabe 8.

```nginx
worker_processes auto;
pid /run/nginx.pid;
error_log /var/log/nginx/error.log;
events { worker_connections 1024; }

http {
    include /etc/nginx/mime.types;

    server {                       # Standardserver: unbekannte Hosts
        listen 8080 default_server;
        server_name _;
        return 444;
    }
    server {
        listen 8080;
        server_name www.beispiel.test;
        root /srv/www;
        location / { index index.html; }
    }
    server {                       # Status nur lokal
        listen 127.0.0.1:8081;
        location /status { stub_status; allow 127.0.0.1; deny all; }
    }
}
```

Geprüft wird mit `nginx -t -c <Datei>`, das die Syntax testet, ohne zu starten. Der erste Server trägt `default_server` und fängt alle Anfragen ab, deren `Host`-Header zu keinem anderen Namen passt; `444` schließt die Verbindung ohne Antwort. Der dritte Server bindet ausschließlich an die Loopback-Adresse, sodass die Statusseite schon deshalb nicht von außen erreichbar ist; `allow`/`deny` sind eine zweite Absicherung. In der Testumgebung wurde die Konfiguration mit Pfaden unter `/tmp` erfolgreich geprüft.

### Lösung zu Aufgabe 9.

\(a\) Zwei MPM-Module sind geladen; Ursache ist meist ein zusätzliches `LoadModule` für ein weiteres MPM, etwa in einer eingebundenen Datei. Behebung: Genau eines laden, mit `apachectl -M` und `-t -D DUMP_INCLUDES` die Quelle suchen. (b) Eine `Require`-Direktive nennt einen Provider, dessen Modul fehlt (hier `local`, gehört zu `mod_authz_host`). Behebung: Modul laden. (c) Die Direktive existiert nur in NGINX Plus; Behebung: Direktive entfernen oder durch passive Prüfungen (`max_fails`, `fail_timeout`) ersetzen, alternativ Plus verwenden. (d) Die maximale Verbindungszahl der Worker ist erschöpft; Behebung: `worker_connections` anheben und darauf achten, dass `ulimit -n` bzw. `worker_rlimit_nofile` ausreichen, und Ursache der vielen Verbindungen prüfen (Angriff, fehlende Timeouts).

Ein sicheres Vorgehen für Änderungen lautet in fünf Schritten: (1) Änderung in einem Versionskontrollsystem vorbereiten und prüfen lassen (Vier-Augen-Prinzip). (2) Syntaxtest ausführen (`apachectl configtest` bzw. `nginx -t`), idealerweise zuerst in einer Staging-Umgebung. (3) Aktuelle Konfiguration sichern, damit ein Rollback möglich ist. (4) Sanft laden (`apachectl graceful` bzw. `nginx -s reload`), nicht neu starten. (5) Wirkung prüfen (Statuscodes, Logs, Monitoring) und die Änderung samt Begründung dokumentieren; bei Auffälligkeiten sofort zurückrollen.
