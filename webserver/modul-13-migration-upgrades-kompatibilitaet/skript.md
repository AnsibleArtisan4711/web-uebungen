# Modul 13 - Migration, Upgrades und Kompatibilität

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Listings unverändert, farbige Boxen als Zitatblöcke mit fettem Titel, Tabellen als Markdown-Tabellen, Übungsaufgaben und Lösungen als Absätze bzw. Überschriften). Die Lerneinheiten sind wie in der Quelle nach Modul nummeriert (13.1 bis 13.8), danach folgen „Übungsaufgaben“ (9) und „Lösungen und Erklärungen“. **Die Konfigurationen und Befehle wurden für dieses Repository nicht ausgeführt:** Laut Einleitung hat der Autor die Beispiele in einer Linux-Umgebung (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0) ausgeführt; nicht getestet sind laut Skript Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt. Viele Beispiele ändern Server-Konfiguration, Zertifikate, Rechte oder Dienste: nur in einer Testumgebung ausprobieren. Übersicht zum Modul: [README](README.md).

**Geplante Dauer:** 9 h | **Priorität:** 2 | **Lerneinheiten:** 8

## Lerneinheiten laut Lehrplan

| **Nr.** | **Lerneinheit**      | **Dauer (h)** | **Prio** |
|--------:|:---------------------|--------------:|---------:|
|    13.1 | Versionsstrategie    |             1 |        2 |
|    13.2 | Apache 2.2 zu 2.4    |             1 |        2 |
|    13.3 | Modul-Kompatibilität |           1,5 |        2 |
|    13.4 | Konfig-Diff          |             1 |        2 |
|    13.5 | Staging Migration    |             1 |        2 |
|    13.6 | Regressionstests     |           1,5 |        3 |
|    13.7 | Rollback             |             1 |        3 |
|    13.8 | Change Dokumentation |             1 |        3 |
|         | **Summe**            |         **9** |          |

## Überblick und Lernweg

Webserver werden selten neu gebaut; fast immer werden sie *weiterentwickelt*. Eine Distribution liefert nach einigen Jahren eine neue Hauptversion, eine Sicherheitslücke zwingt zu einem Update, ein neues Protokoll wie HTTP/2 verlangt eine neuere Software, oder man wechselt gleich von Apache zu Nginx oder umgekehrt. Jede dieser Änderungen ist eine *Migration*: Ein laufendes System, das Kunden benutzen, wird auf einen neuen Stand gebracht, ohne dass diese es merken sollen. Das Risiko liegt weniger in der Software selbst als in den vielen kleinen Annahmen, die sich über Jahre in Konfigurationen, Skripten und Gewohnheiten angesammelt haben.

Dieses Modul folgt dem Weg einer Migration von der Planung bis zur Dokumentation. Zuerst wird entschieden, *welche* Version überhaupt eingesetzt werden soll und wie lange sie Sicherheitsupdates bekommt (13.1). Dann folgt der Klassiker unter den Versionssprüngen, der Wechsel von Apache 2.2 zu 2.4 mit seinen geänderten Zugriffsregeln (13.2), und die Frage, ob die benutzten Module im neuen System noch existieren und zusammenpassen (13.3). Danach geht es um Werkzeuge: den Vergleich zweier Konfigurationsstände (13.4), den Probebetrieb in einer Staging-Umgebung (13.5) und automatische Regressionstests, die belegen, dass sich das Verhalten nicht ungewollt geändert hat (13.6). Der Rückweg wird in 13.7 behandelt, denn eine Migration ist erst dann verantwortbar, wenn man sie in Minuten rückgängig machen kann. Abschnitt 13.8 hält fest, wie man das Ganze nachvollziehbar dokumentiert.

> **Merke**
>
> Die Beispiele dieses Moduls wurden auf dem Testsystem (Ubuntu 24.04 mit Apache 2.4.58 und Nginx 1.24.0) tatsächlich ausgeführt; die gezeigten Meldungen sind gemessen. Was nicht getestet werden konnte, ist im Text ausdrücklich als „nicht getestet“ oder als Kenntnisstand des Autors gekennzeichnet. Es gab keine zusätzlichen Kursunterlagen; der Inhalt beruht auf dem Lehrplan, Recherche und eigenen Versuchen.

Ein Grundgedanke zieht sich durch alle Abschnitte: *Prüfe, bevor du umschaltest, und halte den alten Zustand bereit.* Prüfen heißt mehr als `nginx -t`. Wie das Beispiel in 13.2 zeigt, kann eine Konfiguration syntaktisch fehlerfrei sein und trotzdem einen Server liefern, der sich nicht starten lässt oder ein anderes Verhalten zeigt. Den alten Zustand bereitzuhalten heißt, dass Paket, Konfiguration und gegebenenfalls Daten so gesichert sind, dass der Rückweg nicht erst im Notfall erfunden werden muss.

## 13.1 Versionsstrategie

Eine *Versionsstrategie* legt fest, welche Version einer Software in welcher Umgebung läuft, wie schnell Updates eingespielt werden und wann ein Versionssprung geplant wird. Sie ist die Antwort auf zwei gegensätzliche Kräfte. Einerseits veralten Webserver schnell im Sinne der Sicherheit: Sie sind aus dem Internet erreichbar, und jede bekannte Schwachstelle wird automatisiert ausgenutzt. Andererseits ist jede Änderung ein Risiko für den Betrieb. Eine gute Strategie macht kleine, häufige, gut getestete Schritte zur Regel und große Sprünge zur Ausnahme.

Bei beiden Servern gibt es mehrere Entwicklungsstränge, und man muss wissen, welchen man vor sich hat. Nginx veröffentlicht zwei parallele Linien: den *Stable-Zweig*, der nur noch Fehlerkorrekturen und Sicherheitsfixes erhält, und den *Mainline-Zweig*, in dem auch neue Funktionen erscheinen. Auf der Ankündigungsseite von nginx.org (abgerufen am 31.10.2026) steht für 2026 als aktuelle Stable-Version 1.30.6 vom 14.10.2026 und als Mainline-Version 1.31.8 vom 21.10.2026. Bei Apache gibt es dagegen im Wesentlichen eine einzige gepflegte Linie, die 2.4; die Schwachstellenübersicht des Projekts nennt als jüngste Ausgabe die 2.4.69 vom 01.10.2026. Von den dort für diese Ausgabe aufgeführten 20 Schwachstellen sind laut Seite fünf als „moderate“ und fünfzehn als „low“ eingestuft. Das zeigt, wie normal Sicherheitsupdates sind: Sie kommen mehrmals im Jahr, in den meisten Fällen ohne neue Funktionen.

> **Ergänzung aus der Nachrecherche: Aktuelle Versionsstände (abgerufen am 31.10.2026)**
>
> Nginx: Stable 1.30.6 (14.10.2026), Mainline 1.31.8 (21.10.2026), laut `nginx.org/2026.html`. Apache HTTP Server: Version 2.4.69 vom 01.10.2026 laut der Schwachstellenübersicht des Projekts. Diese Angaben ändern sich laufend; im Betrieb ist stets die offizielle Seite zu prüfen. Die Versionen auf dem Testsystem dieses Kurses (Ubuntu 24.04) sind deutlich älter: Apache 2.4.58 und Nginx 1.24.0. Der Unterschied ist normal, denn Distributionen frieren eine Version ein und übernehmen Sicherheitskorrekturen in das Paket (*Backporting*), ohne die Versionsnummer anzuheben. Das ist der Kenntnisstand des Autors und wurde nicht an einer Quelle überprüft.

Daraus folgt eine wichtige Praxisregel: Die Versionsnummer allein sagt bei Distributionspaketen wenig über den Sicherheitsstand aus. Wer wissen will, ob eine Schwachstelle im installierten Paket behoben ist, muss die Änderungsliste des Pakets (`apt changelog`) oder die Sicherheitshinweise der Distribution lesen, nicht die Upstream-Version vergleichen. Umgekehrt bedeutet das Installieren aus dem Herstellerarchiv (zum Beispiel `nginx.org`) neue Funktionen, aber auch, dass man selbst für den Updatezyklus verantwortlich ist.

Wie entscheidet man nun? Ein vernünftiger Ausgangspunkt für Produktivsysteme ist: Bei Nginx den Stable-Zweig, es sei denn, eine Funktion aus Mainline wird wirklich gebraucht; bei beiden Servern die Distributionspakete, solange sie die benötigten Funktionen enthalten und die Distribution noch Support liefert. Eine Strategie besteht aus mindestens vier Festlegungen, die man schriftlich festhält. Erstens die *Quelle* der Pakete (Distribution oder Hersteller). Zweitens der *Rhythmus* für Sicherheitsupdates, etwa „innerhalb von sieben Tagen nach Veröffentlichung, kritische sofort“. Drittens ein *Ablaufdatum*: Jede Version hat ein Ende des Supports, und man plant den Wechsel spätestens ein halbes Jahr davor. Viertens die *Reihenfolge der Umgebungen*: Updates laufen zuerst in Test, dann in Staging, dann in Produktion.

Der Funktionsunterschied zwischen Versionen ist oft kleiner als der Unterschied in der Syntax. Ein gutes Beispiel liefert HTTP/2 bei Nginx. Die offizielle Dokumentation des Moduls (nginx.org, abgerufen) nennt die Direktive `http2 on;`, die ab Version 1.25.1 existiert und standardmäßig ausgeschaltet ist. Davor aktivierte man HTTP/2 über einen Zusatz in der `listen`-Direktive. Wir prüfen auf dem Testsystem mit Nginx 1.24.0, was passiert, wenn man die neue Schreibweise auf einem älteren Server verwendet:

```bash
$ nginx -v
nginx version: nginx/1.24.0 (Ubuntu)

# Neue Schreibweise (ab 1.25.1) in server { ... }
http2 on;

$ nginx -t -c /tmp/m13/n/h2on.conf
[emerg] unknown directive "http2" in /tmp/m13/n/h2on.conf:6
nginx: configuration file /tmp/m13/n/h2on.conf test failed

# Alte Schreibweise
listen 8411 http2;

$ nginx -t -c /tmp/m13/n/h2old.conf
nginx: configuration file /tmp/m13/n/h2old.conf test is successful
```

Das Beispiel zeigt, warum Konfigurationen *versionsgebunden* sind. Die erste Konfiguration ist ab Nginx 1.25.1 korrekt und wird vom älteren Server mit `unknown directive` abgelehnt. Die zweite funktioniert auf dem Testsystem; ob sie in neueren Versionen weiterhin ohne Hinweis akzeptiert wird, ist nach dem Kenntnisstand des Autors nicht garantiert (die Schreibweise gilt dort als veraltet), wurde aber nicht getestet. Die Konsequenz für die Strategie: Eine Konfiguration, die auf mehreren Versionen laufen soll, muss auf der *ältesten* davon getestet werden, und beim Update ist jedes Konfigurationsstück gegen die Release-Notes der neuen Version zu prüfen.

> **Praxisbeispiel: Zwei Linien im Betrieb**
>
> Ein Hosting-Betrieb hält in der Staging-Umgebung die jeweils neueste Version, in Produktion den Stand der Distribution. Jede Woche läuft die Regressionsprüfung (13.6) gegen Staging. So werden Inkompatibilitäten sichtbar, lange bevor die Version die Produktion erreicht. Das Ablaufdatum der laufenden Version steht als Eintrag im Wartungskalender, nicht im Kopf einer Person.

Zu den typischen Fehlern gehört, ein Update aufzuschieben, bis eine Lücke bekannt wird; dann muss man unter Zeitdruck gleich mehrere Versionen überspringen, und genau das ist der riskanteste Fall. Ebenso häufig ist das Gegenteil: automatische Updates aller Pakete ohne Test in Produktion. Beides vermeidet man mit dem festen Rhythmus oben. Falsch wäre auch, `latest` oder `stable` ohne feste Nummer in Container-Abbildern zu verwenden (siehe Modul 12.3): Man weiß dann nicht mehr, welche Version läuft. Richtig ist eine feste Nummer, die man bewusst ändert.

## 13.2 Apache 2.2 zu 2.4

Der Sprung von Apache 2.2 auf 2.4 ist der bekannteste Versionssprung im Apache-Umfeld, und seine Probleme tauchen in Konfigurationen auf, die schon zehn Jahre und länger laufen. Die offizielle Anleitung `upgrading.html` (abgerufen am 31.10.2026) beschreibt die Änderungen. Dass Apache 2.2 selbst keine Sicherheitsupdates mehr erhält, ist nach dem Kenntnisstand des Autors seit Ende 2017 der Fall; das wurde hier nicht an einer Quelle nachgeprüft. Wer noch eine 2.2-Konfiguration besitzt, hat sie deshalb meist von einer alten Installation geerbt.

Die wichtigste Änderung betrifft die *Zugriffskontrolle*. In Apache 2.2 verwendete man die Direktiven `Order`, `Allow`, `Deny` und `Satisfy`. Dabei legte `Order` die Auswertungsreihenfolge fest, `Allow from` und `Deny from` die Regeln. In Apache 2.4 ersetzt ein neues System diese Regeln: `Require` (aus dem Modul `mod_authz_core`), ergänzt durch Container wie `RequireAll`, `RequireAny` und `RequireNone`. Der Vorteil ist, dass Autorisierung jetzt aus beliebig kombinierbaren Bedingungen besteht, ohne die verwirrende Reihenfolge der alten Syntax. Die alten Direktiven stecken weiter im Modul `mod_access_compat`, das nur zur Übergangszeit gedacht ist. Die Dokumentation rät ausdrücklich davon ab, beide Systeme zu mischen.

Wir prüfen, was ein Umstieg ohne Anpassung bewirkt. Das folgende Experiment startet auf dem Testsystem einen Apache mit einer minimalen Konfiguration (Port 8402, nur die benötigten Module) und fragt die Datei `index.html` ab. Vier Varianten der Zugriffsregel kommen zum Einsatz:

```bash
# A: neue Syntax (2.4)
<Directory "/tmp/m13/a/www">
  Require all granted
</Directory>

# B: alte Syntax (2.2), mod_access_compat geladen
<Directory "/tmp/m13/a/www">
  Order deny,allow
  Deny from all
  Allow from 127.0.0.1
</Directory>

# C: Mischung aus alt (Directory) und neu (Location)
<Directory "/tmp/m13/a/www">
  Order deny,allow
  Deny from all
</Directory>
<Location "/index.html">
  Require all granted
</Location>

# D: nur neue Syntax, aber andere Reihenfolge
<Directory "/tmp/m13/a/www">
  Require all denied
</Directory>
<Location "/index.html">
  Require all granted
</Location>
```

Die Varianten liefern im Test: A ergibt HTTP 200, B ergibt 200 (die Anfrage kommt von 127.0.0.1), C ergibt **403**, D ergibt 200. Variante C ist genau die Falle, vor der die Dokumentation warnt. Man hat zwei Systeme gleichzeitig, das neue `Require` im `Location`-Block erlaubt zwar, aber die Regeln der alten Direktiven im umgebenden `Directory`-Block verbieten, und das Ergebnis ist ein verweigerter Zugriff, den man aus keiner der beiden Zeilen allein ablesen kann. Variante D zeigt dagegen, dass in der reinen neuen Syntax der später zusammengeführte Block (hier `Location`) den früheren überstimmt. Dadurch läuft die Auswertung in der erwarteten Reihenfolge, nämlich erst `Directory`, dann `Location`. Das Protokoll mit dem Level `authz_core:debug` nennt die Entscheidung jeweils mit einer Meldungsnummer (im Test `AH01626` bei neuer Syntax, `AH01628` bei alter und `AH01797` bei der verweigerten Mischvariante); damit lässt sich die Ursache im Protokoll finden.

Neben der Zugriffskontrolle hat die Anleitung eine ganze Liste kleinerer Änderungen. Wir haben die wichtigsten mit `apache2 -t` gegen den Server 2.4.58 getestet. Die Ergebnisse dieser Prüfungen:

| **Altes Element**                          | **Verhalten auf Apache 2.4.58 (gemessen)**                |
|:-------------------------------------------|:----------------------------------------------------------|
| `Order`, `Allow`, `Deny` ohne `mod_access_compat` | `AH00526 … Invalid command 'Order'`; mit geladenem Modul: Syntax OK                  |
| `NameVirtualHost`                                   | Nur Warnung `AH00548: NameVirtualHost has no effect and will be removed in the next release`                                      |
| `DefaultType text/plain`                                   | `AH00117: Ignoring deprecated use of DefaultType`; ohne Wirkung                                    |
| `MaxClients`                                   | Wird weiter ohne Meldung akzeptiert (neuer Name `MaxRequestWorkers`) |
| `LockFile`                                   | `Invalid command 'LockFile'`; ersetzt durch `Mutex`                          |
| `RewriteLog`                                   | `Invalid command 'RewriteLog'`; Protokollierung läuft jetzt über `LogLevel`       |
| `LoadModule authz_default_module`                                   | `Cannot load …mod_authz_default.so … cannot open shared object file`; das Modul wurde entfernt                        |

Diese Tabelle enthält zwei verschiedene Fehlerklassen, die man unterscheiden muss. Manche Direktiven führen zu einem *harten Fehler*: Der Server startet nicht. Das ist unangenehm, aber ehrlich. Gefährlicher sind *stille Änderungen*, bei denen die Konfiguration weiter akzeptiert wird, aber ein anderes Verhalten entsteht. Die Anleitung nennt Beispiele: `AllowOverride` steht jetzt standardmäßig auf `None` (es werden also `.htaccess`-Dateien ignoriert, die vorher wirkten), `EnableSendfile` ist standardmäßig aus, und der Standard von `FileETag` lautet `MTime Size`. Außerdem müssen Module wie `mod_unixd`, `mod_authn_core`, `mod_access_compat` und `mod_filter` je nach Bedarf in der Konfiguration eingebunden werden, und `AddOutputFilterByType` gehört jetzt zu `mod_filter`. Auch der Hinweis, selbstübersetzte Module von Drittanbietern neu zu übersetzen, steht dort.

Ein weiterer Stolperstein: `apache2 -t` meldet nicht alles. Im Test fehlte in einer Konfiguration die `Listen`-Direktive; die Prüfung gab `Syntax OK` aus, der Start dagegen scheiterte mit `no listening sockets available, shutting down` und `AH00015: Unable to open logs`. Die Syntaxprüfung kann nur prüfen, was ohne den Betrieb prüfbar ist. Deshalb braucht jede Migration auch einen *echten Start* in einer Testumgebung (13.5) und Regressionstests (13.6).

> **Ergänzung aus der Nachrecherche: Migrationsreihenfolge nach der offiziellen Anleitung**
>
> Die Anleitung `upgrading.html` empfiehlt im Kern: (1) die alte Konfiguration nicht verändern, sondern mit der neuen Standardkonfiguration der Version 2.4 beginnen und die eigenen Einstellungen schrittweise übernehmen; (2) die Zugriffsregeln auf `Require` umstellen und `mod_access_compat` nur als Brücke verwenden; (3) Direktiven mit geändertem Namen aktualisieren (`MaxClients` zu `MaxRequestWorkers`, `MaxRequestsPerChild` zu `MaxConnectionsPerChild`, die alten Namen funktionieren weiter); (4) die Sperr- und Mutex-Direktiven (`AcceptMutex`, `LockFile`, `RewriteLock`, `SSLMutex` und andere) durch `Mutex` ersetzen; (5) alle Module neu übersetzen, die nicht Teil der Distribution sind. Die Reihenfolge ist eine Zusammenfassung des Autors aus der Seite, keine wörtliche Wiedergabe.

Der typische Fehler bei der Migration ist, die alte `httpd.conf` einfach in die neue Installation zu kopieren. Das Gegenbeispiel, das erfolgreich ist, lautet: Man startet mit der unveränderten Konfiguration der neuen Version, bringt sie zum Laufen und überträgt dann die eigenen Virtual Hosts und Regeln Block für Block. Dabei werden die Zugriffsregeln gleich in der neuen Syntax geschrieben. So entsteht keine Mischung aus beiden Welten, und jede Zeile hat jemand bewusst angefasst.

> **Praxisbeispiel: Alte Intranet-Konfiguration**
>
> Ein Intranetserver sperrt einen Verwaltungsbereich mit `Order deny,allow`, `Deny from all`, `Allow from 10.0.0.0/8`. Nach dem Umstieg wird mit geladenem `mod_access_compat` alles weiter funktionieren. Später kommt eine neue Regel mit `Require` dazu, und plötzlich gibt der Bereich 403 aus. Die Lösung: die alte Regel durch `Require ip 10.0.0.0/8` ersetzen und `mod_access_compat` entfernen.

## 13.3 Modul-Kompatibilität

Beide Server sind modular aufgebaut. Ein *Modul* ist ein Programmteil, der eine Funktion bereitstellt, zum Beispiel Kompression, Authentifizierung oder Umschreiben von Adressen. Bei Apache lädt man Module mit `LoadModule`, bei Nginx mit `load_module` (dynamische Module) oder sie sind fest in das Programm einkompiliert. Eine Migration scheitert erstaunlich oft nicht am Hauptprogramm, sondern an einem Modul, das es nicht mehr gibt, in anderer Form existiert oder nicht zur Version passt.

Es gibt drei Arten von Problemen. Das erste Problem: Ein Modul fehlt ganz. Bei Apache zeigt sich das als Ladefehler. Im Test mit dem entfernten Modul `mod_authz_default` meldete der Server, dass er die Datei nicht öffnen kann. Bei Nginx lässt sich dasselbe mit einem nicht vorhandenen dynamischen Modul nachstellen:

```bash
$ cat lm.conf | head -1
load_module modules/ngx_http_nope_module.so;

$ nginx -t -c /tmp/m13/n/lm.conf
[emerg] dlopen() "/usr/share/nginx/modules/ngx_http_nope_module.so" failed
 (/usr/share/nginx/modules/ngx_http_nope_module.so: cannot open shared
 object file: No such file or directory) in /tmp/m13/n/lm.conf:1
nginx: configuration file /tmp/m13/n/lm.conf test failed
```

Die Fehlermeldung enthält den vollständigen Suchpfad, sodass man sofort sieht, wo Nginx gesucht hat. Ein relativer Pfad wird also relativ zu einem Standardverzeichnis aufgelöst (hier `/usr/share/nginx/modules/`); die Software, nicht die Konfigurationsdatei, bestimmt dieses Verzeichnis. Dieser Fehler ist harmlos, weil der Server nicht startet und man ihn vor dem Umschalten findet.

Das zweite Problem ist heimtückischer: Das Modul fehlt, aber seine Direktiven kommen in der Konfiguration vor. Bei Nginx lautet die Meldung dann `unknown directive`. Im Test gab der Server mit der Zeile `brotli on;` die Meldung `[emerg] unknown directive "brotli"` aus, weil das Paket der Distribution kein Brotli-Modul enthält. Die Kompression mit Brotli, in Modul 11.4 besprochen, muss man in diesem Fall über ein zusätzliches Paket oder einen eigenen Build nachrüsten. Apache bringt dafür `mod_brotli` mit.

Das dritte Problem betrifft Module in anderer Form oder mit anderer Abhängigkeit. Im Apache-Test wurde `mod_proxy_http` geladen, ohne zuvor `mod_proxy` zu laden. Das Ergebnis war ein Ladefehler mit der Meldung `undefined symbol: ap_proxy_location_reverse_map`. Das Prinzip dahinter ist, dass viele Apache-Module auf anderen aufbauen und in der richtigen Reihenfolge geladen werden müssen. Die Debian-/Ubuntu-Pakete lösen das nach dem Kenntnisstand des Autors über Hilfsprogramme (`a2enmod`), die Abhängigkeiten berücksichtigen; schreibt man `LoadModule`-Zeilen von Hand, muss man selbst auf die Reihenfolge achten.

Wie findet man heraus, welche Module ein bestehendes System benutzt? Für Apache gibt es die Ausgabe der geladenen Module, für Nginx die Liste der Übersetzungsoptionen:

```bash
$ apache2 -t -D DUMP_MODULES
Loaded Modules:
 core_module (static)
 so_module (static)
 ...
 headers_module (shared)

$ nginx -V 2>&1 | tr ' ' '\n' | grep -E '^--with|^--modules-path'
--modules-path=/usr/lib/nginx/modules
--with-http_ssl_module
--with-http_stub_status_module
--with-http_realip_module
--with-http_v2_module
--with-http_gzip_static_module
--with-stream_ssl_module
--with-stream_ssl_preread_module
```

Die erste Ausgabe zeigt bei Apache jedes Modul mit dem Zusatz `static` (fest eingebaut) oder `shared` (als Datei geladen). Die zweite Ausgabe ist gekürzt; sie zeigt, welche Module in den Nginx-Programmcode einkompiliert wurden, hier unter anderem SSL, HTTP/2 und die Statusseite. Beide Ausgaben vergleicht man zwischen altem und neuem System; Fehlendes und Neues fällt dann sofort auf. Im Test haben wir mit dem Vergleich der sortierten Ausgabe zweier Apache-Konfigurationen den einzigen Unterschied (`headers_module (shared)`) sofort gefunden.

> **Ergänzung aus der Nachrecherche: Dynamische Nginx-Module sind versionsgebunden**
>
> Nach dem Kenntnisstand des Autors (nicht an einer Quelle abgerufen und nicht getestet) muss ein dynamisches Nginx-Modul zur genauen Nginx-Version und zu deren Übersetzungsoptionen passen, sonst weigert sich Nginx beim Laden. Die Folge: Nach jedem Nginx-Update sind alle Drittmodule neu zu bauen oder durch passende Pakete zu ersetzen. Für Apache gilt Ähnliches in gröberer Form; die Anleitung `upgrading.html` verlangt für den Sprung auf 2.4 ausdrücklich, Module von Drittanbietern neu zu übersetzen.

Als Gegenbeispiel dient eine Migration, die nur `nginx -t` prüft und danach auf die Produktion umschaltet. Dort fragt ein Überwachungsskript die Statusseite `/nginx_status` ab, die vom Modul `stub_status` stammt; fehlt dieses Modul im neuen Build, zeigt die Prüfung der Startseite nichts an, und nur die Überwachung schlägt später still fehl. Ein `nginx -t` mit dem neuen Programm und der alten Konfiguration hätte den Fehler (`unknown directive`) sofort gezeigt, falls die Direktive dort noch vorkommt. Richtig ist, vor der Migration eine *Modulinventur* zu schreiben: Welche Module nutzt die Konfiguration tatsächlich, welche Direktiven stammen aus welchem Modul, und gibt es das Modul im Zielsystem in derselben Form? Praktisch heißt das, die Konfiguration auf dem *neuen* Programm mit dem Konfigurationstest zu prüfen, bevor irgendetwas umgeschaltet wird.

> **Praxisbeispiel: Drittmodul beim Distributions-Update**
>
> Ein Shop nutzt ein Zusatzmodul für die Bildverarbeitung, das beim Update der Distribution auf einen neuen Nginx-Stand ersatzlos entfällt. Weil in der Wartungsliste eine Zeile „Modulinventur: nginx -V, Modulliste vergleichen“ stand, fiel es im Staging auf. Das Team konnte die Bilder wahlweise über einen vorgelagerten Dienst ausliefern, bevor die Produktion betroffen war.

## 13.4 Konfig-Diff

Ein *Diff* ist der zeilenweise Vergleich zweier Textdateien, der genau zeigt, was hinzugekommen, weggefallen oder geändert ist. Bei einer Migration stellt sich die Frage: Was ist der Unterschied zwischen der alten und der neuen Konfiguration, und ist jeder Unterschied gewollt? Diese Frage klingt einfach, ist aber schwerer, als sie scheint, weil eine Webserver-Konfiguration meist aus vielen Dateien besteht, die mit `include` zusammengesetzt werden, voller Kommentare ist und in verschiedener Reihenfolge geschrieben sein kann. Ein Vergleich der Dateien im Verzeichnis zeigt dann viel Rauschen und übersieht die Wirkung.

Besser ist es, nicht die *Quelldateien*, sondern die *wirksame Konfiguration* zu vergleichen, also das, was der Server nach dem Zusammensetzen tatsächlich einliest. Nginx bietet dafür die Option `-T`: Sie testet die Konfiguration wie `-t` und gibt danach den gesamten eingelesenen Inhalt aller Dateien aus, jeweils mit einer Kommentarzeile, die den Dateinamen nennt. Wir bauen daraus ein kleines Skript, das Kommentare, führende und folgende Leerzeichen und Leerzeilen entfernt, damit nur echte Unterschiede übrig bleiben:

```bash
#!/usr/bin/env bash
# cfgdiff.sh ALT.conf NEU.conf
# Vergleicht die wirksame nginx-Konfiguration (nginx -T) ohne Rauschen.
set -euo pipefail
norm() {
  nginx -T -c "$1" 2>/dev/null \
    | sed -E 's/#.*$//; s/^[[:space:]]+//; s/[[:space:]]+$//' \
    | grep -v '^$'
}
diff -u <(norm "$1") <(norm "$2") || true
```

Die Funktion `norm` ruft `nginx -T` mit der angegebenen Konfiguration auf und leitet die Fehlerausgabe in den Papierkorb, weil `-T` den Testtext dorthin schreibt. Das erste `sed`-Kommando löscht Kommentare (alles ab `#`), das zweite entfernt Leerzeichen an Zeilenanfang und -ende; `grep -v` wirft die danach leeren Zeilen weg. Der Aufruf von `diff -u` bekommt zwei durch Prozesssubstitution (`<(…)`) erzeugte Datenströme. Das `|| true` am Ende ist nötig, weil `diff` mit dem Rückgabecode 1 endet, sobald es Unterschiede findet, und `set -e` das Skript sonst abbrechen würde. Ein Test mit zwei kleinen Konfigurationen, die sich in vier Punkten unterscheiden, ergibt:

```bash
$ ./cfgdiff.sh v1.conf v2.conf
-pid /tmp/m13/d/run/v1.pid;
-error_log /tmp/m13/d/logs/v1.log;
+pid /tmp/m13/d/run/v2.pid;
+error_log /tmp/m13/d/logs/v2.log;
 events { worker_connections 64; }
 http { access_log off; include /etc/nginx/mime.types;
-server { listen 8422; root /tmp/m13/d/w1; location = /old { return 302 /neu; } } }
+server { listen 8423; root /tmp/m13/d/w2; add_header X-Frame-Options DENY; location = /old { return 301 /neu; } } }
 types {
 ...
```

Aus diesem Ergebnis lernt man dreierlei. Erstens zeigt das Diff die inhaltlich bedeutsamen Änderungen, hier den neuen Schutzheader `X-Frame-Options` und die geänderte Weiterleitung von Status 302 auf 301. Zweitens zeigt es auch Änderungen, die nur durch die Testumgebung entstehen (andere Pfade und Ports), die man vor der Beurteilung gedanklich abziehen muss. Drittens macht der Diff bei dieser Schreibweise (der Server in einer einzigen Zeile) einen groben Zeilenvergleich; je besser die Konfiguration formatiert ist, desto lesbarer wird das Ergebnis. Dazu gehört der Rat, Konfigurationen mit einer Direktive pro Zeile zu schreiben.

Bei Apache liegt die Sache anders. Die Option `-t -D DUMP_INCLUDES` listet die eingebundenen Dateien, `-t -D DUMP_MODULES` die geladenen Module und `-t -D DUMP_VHOSTS` die Virtual Hosts. Im Test funktionierte der Vergleich der Modulliste gut: Nach dem Sortieren zeigte `diff` als einzigen Unterschied zwischen zwei Konfigurationen die Zeile `> headers_module (shared)`. Die ebenfalls dokumentierte Ausgabe der gesamten wirksamen Konfiguration mit `-t -D DUMP_CONFIG` lieferte auf unserem Testsystem (Apache 2.4.58) dagegen *nur* die Meldung `Syntax OK`, keinen Konfigurationstext. Ob das an der Version, am Paket oder an unserem Aufruf liegt, haben wir nicht geklärt. Für Apache bleibt deshalb nur der Vergleich der Quelldateien mit `diff -ru` oder, besser, der Vergleich der Git-Stände, in denen die Konfiguration liegt (siehe 13.8).

> **Merke**
>
> Ein Konfigurations-Diff beantwortet die Frage „Was hat sich geändert?“, aber nicht „Verhält sich der Server anders?“. Zwei völlig verschieden geschriebene Konfigurationen können dasselbe bewirken, und eine einzelne geänderte Zeile kann das Verhalten ganz ändern. Der Diff ist deshalb die erste Stufe; die zweite ist der Vergleich der Antworten (13.6).

Zu den typischen Fehlern gehört, sich auf den Dateivergleich eines Verzeichnisses zu verlassen. Falsch ist zum Beispiel `diff -r /etc/nginx.alt /etc/nginx.neu`, wenn die neue Installation andere Standarddateien mitbringt; man sieht hunderte Zeilen, die niemand liest, und übersieht die eine, die zählt. Richtig ist, die *eigene* Konfiguration von den Standarddateien zu trennen (zum Beispiel in eigene Dateien unter `conf.d/` oder `sites-available/`) und vom wirksamen Ergebnis (`nginx -T`) auszugehen. Ein zweiter Fehler: den Diff nur zu lesen, aber nicht zu erklären. Jede Zeile des Diffs soll einer Begründung zugeordnet werden (Wunsch, Pflicht durch die neue Version, Testumgebung); Zeilen ohne Begründung sind Fragen an das Team.

> **Praxisbeispiel: Prüfung vor dem Merge**
>
> In der Pipeline aus Modul 12 läuft bei jeder Änderung `cfgdiff.sh` zwischen dem Produktionsstand und dem Vorschlag. Das Ergebnis steht als Kommentar im Änderungsantrag. Wer den Antrag prüft, sieht in Sekunden, dass nur zwei Zeilen betroffen sind und welche.

## 13.5 Staging Migration

Eine *Staging-Umgebung* ist eine Kopie der Produktion, in der Änderungen geprobt werden, bevor echte Kunden sie sehen. Sie soll der Produktion möglichst gleichen: dieselbe Betriebssystemversion, dieselben Pakete, dieselbe Konfiguration bis auf unvermeidliche Unterschiede (Namen, Zertifikate, Anschrift der Datenbank). Je mehr Unterschiede, desto weniger sagt ein erfolgreicher Test dort aus. Der Begriff *Migration* meint hier das planmäßige Überführen der Umgebung auf den neuen Stand, und zwar zuerst im Staging.

Der Ablauf einer Staging-Migration lässt sich in vier Schritte fassen. Zuerst baut man das Staging mit dem Zielstand auf; bei der Arbeitsweise aus Modul 12 geschieht das automatisch aus denselben Rollen und Vorlagen wie in der Produktion. Dann führt man die technischen Prüfungen aus: Konfigurationstest mit dem neuen Programm, Start, Regressionstests (13.6). Danach lässt man *realistischen Verkehr* darüber laufen, denn Tests prüfen nur, was sich jemand vorher ausgedacht hat. Zuletzt entscheidet man über den Übergang in die Produktion, mit den Verfahren aus Modul 8 (stufenweise Verlagerung mit Gewichten, Blue-Green).

Für den dritten Schritt bietet Nginx einen eleganten Baustein: das *Spiegeln* (*mirror*) von Anfragen. Der Server beantwortet die Anfrage des Kunden wie bisher, schickt aber zusätzlich eine Kopie an ein zweites System und verwirft dessen Antwort. Das Staging bekommt so echte Anfragen, ohne dass ein Fehler dort einen Kunden trifft. Die Dokumentationsseite des Moduls war in unserer Umgebung nicht abrufbar; die folgende Beschreibung beruht daher auf dem eigenen Test und dem Kenntnisstand des Autors. Wir stellen sie zuerst in der Konfiguration dar:

```bash
upstream staging { server 127.0.0.1:9301; }
server {
  listen 8421;
  root /tmp/m13/d/w1;
  location / {
    mirror /mirror;
    mirror_request_body on;
  }
  location = /mirror {
    internal;
    proxy_pass http://staging$request_uri;
    proxy_set_header X-Mirror 1;
  }
}
```

Im Block `location /` bewirkt `mirror /mirror;`, dass für jede Anfrage ein Unterauftrag an die interne Adresse `/mirror` entsteht. Mit `mirror_request_body on;` wird auch der Anfragekörper mitgeschickt, damit POST-Anfragen im Staging vollständig ankommen. Der Block `location = /mirror` ist durch `internal` von außen nicht erreichbar und leitet die Kopie per `proxy_pass` an den Staging-Server weiter; der Zusatzkopf `X-Mirror` erlaubt dort, gespiegelte Anfragen zu erkennen. Wir haben als Staging-Ziel ein kleines Python-Programm gestartet, das jede Anfrage zählt, und dann fünf GET-Anfragen und eine POST-Anfrage an den Produktionsserver geschickt:

```bash
$ for i in 1 2 3 4 5; do curl -s localhost:8421/a.txt >/dev/null; done
$ curl -s -d x=1 -X POST localhost:8421/index.html -o /dev/null -w "POST->%{http_code}\n"
POST->405
$ curl -s localhost:9301/probe
staging hits=7 path=/probe

# Spiegelziel ausgeschaltet:
$ curl -s -o /dev/null -w "Client bekommt %{http_code} in %{time_total}s\n" localhost:8421/a.txt
Client bekommt 200 in 0.002540s
# im Fehlerprotokoll:
[error] connect() failed (111: Connection refused) while connecting to upstream,
  client: 127.0.0.1, ... request: "GET /a.txt HTTP/1.1", subrequest: "/mirror"
```

Die Zählung bestätigt das Verhalten: Fünf GET-Anfragen, eine POST-Anfrage und die letzte Abfrage `/probe` ergeben sieben Treffer im Staging. Der Kunde erhielt für die POST-Anfrage den Status 405, weil der statische Testserver sie nicht annimmt; das Spiegeln hat sie trotzdem weitergegeben. Entscheidend ist der zweite Teil: Mit abgeschaltetem Ziel bekam der Client weiterhin die Antwort 200 ohne merkliche Verzögerung (2,5 Millisekunden), und der Fehler erschien nur im Fehlerprotokoll. Der Ausfall des Spiegelziels trifft also die Kunden nicht.

> **Ergänzung aus der Nachrecherche: Grenzen des Spiegelns**
>
> Nach dem Kenntnisstand des Autors, nicht getestet: Gespiegelte Anfragen sind echte Anfragen. Schreibende Zugriffe (Bestellungen, Zahlungen, E-Mail-Versand) führen im Staging zu echten Nebenwirkungen, wenn es mit echten Zusatzdiensten verbunden ist. Staging darf deshalb nur mit Testdiensten, Testdaten und ausgeschalteten Versandwegen betrieben werden. Gespiegelte Daten können außerdem personenbezogene Daten enthalten; die Weitergabe in eine zweite Umgebung ist datenschutzrechtlich zu prüfen (DSGVO, keine Rechtsberatung). Für Apache gibt es im Kern keinen gleichwertigen Baustein; dort spiegelt man üblicherweise vor dem Server (Lastverteiler oder Proxy). Das wurde nicht getestet.

Neben dem Spiegeln gibt es einfachere Wege, ein Staging zu füttern. Man kann ein Stück Zugriffsprotokoll der Produktion erneut abspielen (nur lesende Anfragen) oder mit den Lasttestwerkzeugen aus Modul 11.14 einen typischen Verkehr erzeugen. Beide Wege vermeiden die Probleme des Spiegelns, sind aber weniger realistisch. Welche Methode passt, hängt davon ab, wie gefährlich Nebenwirkungen sind.

Zu den typischen Fehlern gehört das Staging, das sich schleichend von der Produktion entfernt. Wenn dort ein Paket anders ist, ein Zertifikat von Hand eingespielt wurde oder eine Konfigurationszeile fehlt, beweist der Test nichts mehr. Falsch ist ein Staging, das „nach Gefühl“ gepflegt wird. Richtig ist, es mit denselben Rollen aus demselben Git-Stand aufzubauen und regelmäßig neu zu erzeugen. Ein weiterer Fehler ist, nur den *glücklichen Pfad* zu testen. Ein Staging-Test ohne Fehlerfälle (nicht vorhandene Seiten, zu große Anfragen, abgebrochene Verbindungen) übersieht genau die Verhaltensänderungen, die bei Migrationen häufig sind.

> **Praxisbeispiel: Der Übergang in Stufen**
>
> Nach erfolgreichem Staging nimmt ein Team zunächst einen von vier Produktionsservern auf den neuen Stand (Modul 8: Gewichtung im Lastverteiler). Läuft er eine Stunde ohne Auffälligkeiten bei Fehlerquote und Antwortzeit, folgen die übrigen. Der alte Stand bleibt auf einem Server stehen, bis der Zeitraum der Beobachtung vorbei ist.

## 13.6 Regressionstests

Eine *Regression* ist ein Rückschritt: Etwas, das vorher funktionierte, funktioniert nach der Änderung nicht mehr oder anders. *Regressionstests* prüfen systematisch, dass das bekannte Verhalten erhalten bleibt. Bei Webservern bedeutet das konkret: Dieselben Anfragen an das alte und das neue System ergeben dieselben Antworten, abgesehen von Unterschieden, die man erwartet und bewusst akzeptiert hat.

Eine nützliche Technik heißt *Golden Master*. Man hält den Zustand des bewährten Systems als Maßstab fest und vergleicht das neue System dagegen. Man muss dafür nicht selbst formulieren, was richtig ist; es reicht, den Unterschied zum alten System zu sehen und zu beurteilen. Das passt gut zu Migrationen, bei denen das alte System „richtig“ ist, weil die Kunden damit leben.

Wir bauen ein kleines Prüfskript, das aus einer Tabelle von Adressen besteht. Zu jeder Adresse fragt es beide Server ab und vergleicht Statuscode, Weiterleitungsziel, Inhaltstyp und eine Prüfsumme des Inhalts. Gleiche Antworten melden `GLEICH`, erwartete Abweichungen `ERWARTET`, alles andere `ABWEICHUNG` mit Rückgabecode 1. Das Skript lautet:

```bash
#!/usr/bin/env bash
# regress.sh ALT-URL NEU-URL checks.tsv
OLD=$1; NEW=$2; TSV=$3; fail=0
probe() {  # Basis Pfad -> "Status|Location|Content-Type|Body-Hash"
  local base=$1 path=$2 hdr body
  hdr=$(curl -s -o /tmp/regress.body -D - -m 5 "$base$path")
  body=$(sha256sum < /tmp/regress.body | cut -c1-12)
  printf '%s|%s|%s|%s' \
    "$(head -1 <<<"$hdr" | awk '{print $2}')" \
    "$(grep -i "^location:" <<<"$hdr" | tr -d "\r" | awk "{print \$2}" | sed "s|^$base||")" \
    "$(grep -i '^content-type:' <<<"$hdr" | tr -d '\r' | awk '{print $2}')" "$body"
}
while IFS=$'\t' read -r path expect; do
  [[ -z $path || $path == \#* ]] && continue
  a=$(probe "$OLD" "$path"); b=$(probe "$NEW" "$path")
  if [[ $a == "$b" ]]; then echo "GLEICH   $path  ($b)"
  elif [[ -n $expect && $b == $expect* ]]; then
    echo "ERWARTET $path  alt=$a  neu=$b"
  else echo "ABWEICHUNG $path"; echo "   alt: $a"; echo "   neu: $b"; fail=1; fi
done < "$TSV"
exit $fail
```

Die Funktion `probe` fragt eine Adresse ab. Mit `curl -D -` werden die Antwortköpfe auf der Standardausgabe ausgegeben, der Inhalt landet in einer Datei, von der `sha256sum` eine Prüfsumme bildet (nur die ersten zwölf Zeichen). Aus dem Kopf werden die Statuszeile, das Feld `Location` und der Inhaltstyp herausgelöst und zu einer Zeichenkette mit senkrechten Strichen verbunden. Die Schleife liest die Tabelle, eine Adresse pro Zeile, optional gefolgt durch einen Tabulator und einen erwarteten Beginn der neuen Antwort. Kommentarzeilen und Leerzeilen werden übersprungen. Die Tabelle des Tests lautete:

```bash
/
/a.txt
/old	301|/neu
/old2
/missing
```

Hier sind die Einträge durch Tabulatoren getrennt; die Zeile `/old` erwartet, dass der neue Server mit Status 301 nach `/neu` weiterleitet (der alte tat es mit 302). Das Ergebnis beim ersten Lauf zeigte eine *falsche Abweichung*: Die Adresse im Header `Location` enthielt die Serveradresse mit Port (`http://127.0.0.1:8422/neu` gegen `http://127.0.0.1:8423/neu`), also unterschieden sich die Antworten allein durch den Port. Das `sed` in der Funktion, das die Basisadresse vor dem Vergleich abschneidet, entstand als Reaktion auf diesen Fehler. Danach lautete die Ausgabe:

```bash
$ ./regress.sh http://127.0.0.1:8422 http://127.0.0.1:8423 checks.tsv; echo rc=$?
GLEICH   /  (200||text/html|5891b5b522d5)
GLEICH   /a.txt  (200||text/plain|73cb3858a687)
ERWARTET /old  alt=302|/neu|text/html|da5060c18905  neu=301|/neu|text/html|7cb59ce03765
GLEICH   /old2  (404||text/html|766c1d6bcb81)
GLEICH   /missing  (404||text/html|766c1d6bcb81)
rc=0
```

Wichtig ist die Lehre aus dem ersten Lauf: Vergleichstests liefern erst dann verlässliche Aussagen, wenn man alles herausrechnet, was sich zwangsläufig unterscheidet (Adressen, Zeitstempel, Datum). Das gilt ebenso für Header wie `Date`, `Last-Modified` und `ETag`. Beim Vergleich der Antwortköpfe der beiden Server zeigte sich nach dem Entfernen dieser Felder genau ein Unterschied, der neue Header `X-Frame-Options: DENY`. Das ist die gewollte Änderung aus dem Konfigurations-Diff in 13.4, und damit schließt sich der Kreis: Diff und Antwortvergleich bestätigen einander.

> **Merke**
>
> Regressionstests brauchen eine Liste von Adressen, die das *Geschäft* abbilden, nicht nur die Startseite: Anmeldung, Suche, Bezahlung, Weiterleitungen, Fehlerseiten, statische Dateien, Schnittstellen. Die Liste wächst mit jedem Fehler, der in der Produktion auftritt: Für jeden Fehler kommt eine Prüfzeile dazu, die ihn künftig verhindert.

Neben der Funktion gehört die Leistung zu den Dingen, die sich nach einem Update verschlechtern können. Hier gelten die Warnungen aus Modul 11.14: Einzelne Messungen schwanken stark. Beim damaligen Test streuten sieben identische Läufe von `ab` zwischen etwa 29 351 und 78 952 Anfragen pro Sekunde. Ein Leistungsvergleich zwischen alter und neuer Version ist deshalb nur mit mehreren Wiederholungen, dem Median und einer Toleranz (zum Beispiel „nicht mehr als 10 Prozent schlechter“) sinnvoll, und nur dann, wenn beide Versionen auf derselben Hardware unter gleichen Bedingungen laufen.

Zu den typischen Fehlern: Das Ergebnis wird nur über den Statuscode beurteilt. Falsch ist ein Test, der nur `HTTP 200` verlangt; eine Fehlerseite mit Status 200 (das „weiche 404“) oder eine Seite mit leerem Inhalt besteht ihn. Richtig ist ein Vergleich, der Inhalt (Prüfsumme) und Header einbezieht. Ebenso falsch ist es, Abweichungen stillschweigend zu „erlauben“: Jede Ausnahme in der Tabelle (`ERWARTET`) braucht eine Begründung im Änderungsantrag (13.8).

> **Praxisbeispiel: Der Weiterleitungsfehler**
>
> Nach einer Migration sendet der neue Server auf `/shop` nicht mehr nach `/shop/`, sondern liefert 404. Im Alltag fällt das niemandem auf, weil man die Startseite testet; Suchmaschinen und gespeicherte Lesezeichen laufen aber ins Leere. Eine einzige Zeile in der Regressionstabelle hätte den Fehler vor der Produktion gezeigt.

## 13.7 Rollback

Ein *Rollback* ist die Rückkehr zum letzten funktionierenden Stand, wenn eine Änderung Probleme verursacht. Er ist keine Niederlage, sondern ein Teil der Planung: Wer vor der Änderung nicht weiß, wie er zurückkommt, ändert im Grunde blind. Ein guter Rollback hat drei Eigenschaften. Er ist *schnell* (Minuten, nicht Stunden), *vorab geprobt* (er wurde im Staging wirklich ausgeführt) und *eindeutig ausgelöst* (es steht vorher fest, bei welchen Messwerten man ihn ausführt, zum Beispiel „Fehlerquote über 2 Prozent für fünf Minuten“).

Zunächst ein häufiges Missverständnis: Das Neuladen einer fehlerhaften Konfiguration ist bei Nginx gar kein Problem, bei Apache dagegen unter Umständen schon. Wir haben beides getestet. Bei Nginx läuft der Server mit einer gültigen Konfiguration, danach wird die Datei auf einen Fehler (`listen 8411 foo;`) geändert und der Reload ausgelöst:

```bash
$ nginx -c /tmp/m13/n/live.conf -s reload; echo "reload rc=$?"
[emerg] invalid parameter "foo" in /tmp/m13/n/live.conf:6
reload rc=1
$ curl -s localhost:8411/
ok-v1
```

Der neue Hauptprozess liest die Konfiguration, findet den Fehler, bricht den Reload ab und lässt die alten Arbeitsprozesse mit der alten Konfiguration weiterlaufen. Das entspricht der Beschreibung der Signale in der Nginx-Dokumentation (`nginx.org/en/docs/control.html`, abgerufen): Bei `HUP` prüft der Hauptprozess die Syntax, versucht die neue Konfiguration anzuwenden und fällt bei einem Fehler auf die alte zurück. Der Kunde bemerkt nichts; der Fehler steht im Protokoll und im Rückgabecode.

Bei Apache haben wir zwei Wege geprüft. Ruft man das Programm mit `apache2 -k graceful` auf, prüft es zuerst die Konfiguration, meldet den Fehler und beendet sich mit Code 1, ohne den laufenden Server zu stören. Sendet man dagegen das Signal `USR1` (was der Befehl im Kern tut) *direkt* an den Hauptprozess, wird die Konfiguration neu gelesen, ohne vorherige Prüfung:

```bash
$ echo "BogusDirective on" >> live.conf
$ apache2 -f /tmp/m13/a/live.conf -k graceful; echo "rc=$?"
AH00526: Syntax error on line 18 ... Invalid command 'BogusDirective' ...
rc=1
$ curl -s localhost:8402/index.html
apache-v1                      # Server läuft weiter

$ kill -USR1 $(cat run/pid)
$ curl -s -m 3 localhost:8402/index.html ; echo "curl rc=$?"
curl rc=7                      # Verbindung abgelehnt
$ ps -eo pid,cmd | grep "[a]pache2 -f /tmp/m13" | wc -l
0
# error.log:
AH00493: SIGUSR1 received.  Doing graceful restart
AH00526: Syntax error on line 18 ... Invalid command 'BogusDirective' ...
```

Das zweite Ergebnis ist ernst: Nach dem direkten Signal mit der kaputten Konfiguration war der Server *tot*; kein Prozess lief mehr, und die Verbindung wurde abgelehnt (curl-Code 7). Im Protokoll sieht man erst die Meldung, dass der sanfte Neustart begonnen hat, und gleich danach den Syntaxfehler. Die Lehre: Bei Apache darf man das Signal nie an den Prozess senden, ohne vorher `apache2 -t` (oder `apachectl configtest`) laufen zu lassen. Die bequemen Befehle (`apachectl graceful`, `systemctl reload`) erledigen das üblicherweise, aber das ist Sache der jeweiligen Installation, und man sollte es ausprobieren, nicht annehmen. In Skripten verkettet man immer: `apache2 -t && apache2 -k graceful`.

Der schwierigere Rollback ist der des *Programms* selbst, also der Rückweg von einer neuen Version zur alten. Nginx bietet dafür ein Verfahren ohne Unterbrechung: den *Binärwechsel im laufenden Betrieb*. Nach der Dokumentation (`control.html`) ersetzt man die Programmdatei und schickt dem alten Hauptprozess das Signal `USR2`. Der alte Hauptprozess benennt seine PID-Datei in `nginx.pid.oldbin` um und startet einen neuen Hauptprozess mit dem neuen Programm. Beide laufen und bedienen Anfragen. Mit `WINCH` an den alten Hauptprozess beendet man dessen Arbeitsprozesse sanft, und der neue übernimmt die Last. Gefällt das Ergebnis nicht, schickt man dem alten Hauptprozess `HUP` (er startet seine Arbeitsprozesse wieder) und dem neuen `QUIT`. Wir haben das mit demselben Programm durchgespielt, um den Ablauf zu zeigen:

```bash
$ /usr/sbin/nginx -c /tmp/m13/n/live.conf       # voller Pfad!
$ kill -USR2 $(cat run/nginx.pid)
$ ls run/
nginx.pid  nginx.pid.oldbin
$ ps -eo pid,ppid,cmd | grep "[n]ginx: master"
13961     1 nginx: master process /usr/sbin/nginx -c /tmp/m13/n/live.conf
13966 13961 nginx: master process /usr/sbin/nginx -c /tmp/m13/n/live.conf

# Rückweg: alten Master wiederbeleben, neuen beenden
$ kill -HUP  13961
$ kill -QUIT 13966
$ ls run/
nginx.pid                       # nur noch eine PID-Datei
$ curl -s localhost:8411/
ok-v1
```

Die Ausgabe zeigt die zwei Hauptprozesse, wobei der neue (13966) ein Kind des alten (13961) ist. Nach dem `QUIT` an den neuen verschwindet die Datei `nginx.pid.oldbin`, und die Datei `nginx.pid` gehört wieder dem alten Hauptprozess; das Fehlerprotokoll bestätigt mit `new binary process 13966 exited with code 0`. Der Dienst war die ganze Zeit erreichbar.

Dieser Versuch führte auch zu einer lehrreichen Panne. Beim ersten Versuch hatten wir Nginx als `nginx` (ohne Pfad) gestartet. Das `USR2` löste das Starten des neuen Programms aus, das aber scheiterte, weil der Hauptprozess den Programmnamen so wieder aufruft, wie er gestartet wurde: `[alert] execve() failed while executing new binary process "nginx" (2: No such file or directory)`. Das ist harmlos, solange man es bemerkt. Wir schickten dann aber trotzdem `WINCH` an den (einzigen) Hauptprozess; seine Arbeitsprozesse beendeten sich, und die Seite war nicht mehr erreichbar (die Abfrage hing, bis sie abgebrochen wurde). Deshalb gilt die Regel: Nach `USR2` immer prüfen, ob der neue Hauptprozess wirklich läuft (`nginx.pid.oldbin` existiert, zwei Hauptprozesse sichtbar), *bevor* man dem alten `WINCH` schickt.

> **Ergänzung aus der Nachrecherche: Paketrückstufung (nicht getestet)**
>
> Nach dem Kenntnisstand des Autors lässt sich bei Debian/Ubuntu ein Paket durch Installation einer bestimmten älteren Version zurücksetzen (`apt install paket=version`), sofern das Archiv diese Version noch bereithält. Das wurde hier nicht getestet. Wichtig ist, dass Konfigurationsdateien und Daten durch ein neues Programm verändert worden sein können (Migrationsschritte, neue Standarddateien), sodass der Rückweg nur dann sicher ist, wenn vorher eine Sicherung angelegt wurde. Die sicherste Methode bleibt, den alten Zustand als vollständiges System bereitzuhalten (Blue-Green, Modul 12.7), statt ihn aus Paketen zurückzubauen.

Rollback betrifft nicht nur den Webserver. Hat die Migration Daten verändert, etwa das Schema einer Datenbank oder Dateien im Speicher, genügt es nicht, das Programm zurückzusetzen. Der Rückweg muss auch für die Daten gelten, oder die Änderungen müssen so entworfen sein, dass alter und neuer Stand nebeneinander funktionieren (zuerst abwärtskompatibel erweitern, später aufräumen). Das ist keine Besonderheit von Webservern, wird aber bei Migrationen oft übersehen.

Typische Fehler: Der Rollback wurde nie geprobt und scheitert in der Nacht an einer Kleinigkeit. Falsch ist ein Plan, der nur sagt „Backup einspielen“. Richtig ist ein Ablauf mit festen Schritten, Zuständigen, Zeitgrenzen (nach 15 Minuten ohne Besserung wird zurückgegangen) und einer Prüfung nach dem Zurückgehen, dass wieder alles läuft (die Regressionstests aus 13.6 mit umgekehrter Richtung). Ein zweiter Fehler: der Entschluss kommt zu spät, weil niemand „aufgeben“ will. Vorher festgelegte Kriterien nehmen diese Entscheidung aus der Stimmung des Augenblicks.

> **Praxisbeispiel: Die 30-Minuten-Regel**
>
> Ein Team plant das Update an einem Dienstagvormittag mit der Regel: Wenn die Fehlerquote nach 30 Minuten nicht unter der Schwelle liegt, wird zurückgegangen, ohne Diskussion. Der Rückweg (Umlegen des Verweises auf die alte Version, Modul 12.7) dauert 20 Sekunden und wurde am Vortag im Staging geübt.

## 13.8 Change Dokumentation

Die *Änderungsdokumentation* (englisch *change documentation*) hält fest, was geändert wurde, warum, durch wen, wann und mit welchem Ergebnis. Sie dient drei Zwecken. Sie ist die *Erinnerung* des Teams: Ein Jahr später weiß niemand mehr, warum die Zeile `keepalive_timeout 15;` so lautet. Sie ist die *Entscheidungsgrundlage* vor der Änderung: Wer zustimmt, braucht Ziel, Risiko, Test und Rückweg auf einer Seite. Und sie ist der *Nachweis* gegenüber Kunden, Prüfern oder Behörden, dass Änderungen kontrolliert ablaufen. Ob und welche Nachweise im Einzelfall verlangt sind (zum Beispiel durch Sicherheitsnormen oder Verträge), hängt vom Unternehmen ab und ist hier nicht Gegenstand; es ist keine Rechtsberatung.

Eine brauchbare Dokumentation besteht aus zwei Teilen. Der erste Teil ist der *Änderungsantrag* vor der Arbeit. Er beantwortet die Fragen: Was soll sich ändern, und warum? Welche Systeme sind betroffen? Was ist das Risiko, und wie wahrscheinlich ist es? Wie wird getestet (Verweis auf die Regressionstabelle)? Wie sieht der Rückweg aus, und woran erkennt man, dass er nötig ist? Wann ist das Zeitfenster, wer ist verfügbar, wer informiert die Kunden? Der zweite Teil ist der *Änderungsbericht* danach: Was wurde tatsächlich getan, wie war das Ergebnis, was wurde anders gemacht als geplant?

Der Bericht lässt sich zum großen Teil automatisch erzeugen, wenn die Konfiguration in Git liegt (Modul 12). Jede Änderung ist dann ein Commit mit Beschreibung, und der Unterschied zwischen zwei markierten Ständen (Tags) ist eindeutig bestimmbar. Das folgende Skript macht daraus eine Markdown-Datei:

````bash
#!/usr/bin/env bash
# changereport.sh ALT NEU  -> Markdown-Änderungsbericht aus Git
set -euo pipefail
alt=$1; neu=$2
echo "# Änderungsbericht $alt -> $neu"
echo; echo "## Commits"
git log --format='- %h %s (%an, %ad)' --date=short "$alt..$neu"
echo; echo "## Betroffene Dateien"
git diff --stat "$alt" "$neu"
echo; echo "## Änderungen im Detail"
echo '```diff'; git diff -U1 "$alt" "$neu"; echo '```'
````

Das Skript erwartet zwei Git-Verweise (Tags, Zweige oder Commits). Der Befehl `git log` mit der Schreibweise `alt..neu` listet alle Commits, die im neuen, aber nicht im alten Stand enthalten sind; das Format zeigt Kurzkennung, Beschreibung, Autor und Datum. `git diff --stat` fasst die betroffenen Dateien mit Zeilenzahlen zusammen, und `git diff -U1` gibt den eigentlichen Unterschied mit einer Zeile Umgebung aus. Die drei Backticks am Ende umschließen den Diff, damit Markdown ihn als Codeblock darstellt. Auf einem Testarchiv mit zwei Ständen ergab das:

````bash
$ ./changereport.sh stand-alt stand-neu
# Änderungsbericht stand-alt -> stand-neu

## Commits
- 5e2af8a Härtung: server_tokens aus, mehr Verbindungen, HTTP/2 (T, 2026-10-31)

## Betroffene Dateien
 conf/nginx.conf | 5 +++--
 1 file changed, 3 insertions(+), 2 deletions(-)

## Änderungen im Detail
```diff
-server_tokens on;
-worker_connections 64;
+server_tokens off;
+worker_connections 1024;
+http2 on;
```
````

Der Bericht kann nur beschreiben, *was* sich geändert hat. Das *Warum* muss in der Commit-Beschreibung stehen, sonst bleibt die Dokumentation leer. Deshalb gehört zu einer guten Praxis, Commit-Beschreibungen mit Begründung zu schreiben, nicht „Änderung“ oder „fix“. Für wichtige Entscheidungen, etwa den Wechsel von Apache zu Nginx oder von einem Paket zum Herstellerarchiv, ist ein kurzer *Architekturentscheid* (englisch *Architecture Decision Record*, ADR) üblich: eine Seite mit Ausgangslage, betrachteten Alternativen, Entscheidung und Folgen. Der Wert liegt in den verworfenen Alternativen, denn ohne sie diskutiert das Team dieselbe Frage nach zwei Jahren erneut.

Als Vorlage für den Änderungsantrag genügt ein einfaches Gerüst. Wichtig ist, dass jedes Feld ausgefüllt wird; ein leeres Feld „Rollback“ ist ein Warnzeichen:

```bash
# Änderungsantrag CHG-2026-041
Titel:        Nginx 1.24 -> 1.30 (Stable) auf web01-web04
Ziel:         Sicherheitsupdates, HTTP/2 mit "http2 on;"
Betroffen:    web01-web04, Lastverteiler lb01
Risiko:       mittel (Konfigurationssyntax ändert sich, siehe 13.1)
Test:         regress.sh gegen Staging, 38 Prüfzeilen, alle GLEICH/ERWARTET
Zeitfenster:  Di 10:00-12:00, eine Stunde Beobachtung nach web01
Rollback:     Verweis auf alte Version zurücksetzen (20 s), Auslöser:
              Fehlerquote > 2 % über 5 Minuten
Zuständig:    Betrieb (Durchführung), Entwicklung (Rückfragen)
Freigabe:     ______________  Datum: ________
```

Das Gerüst ist bewusst kurz. Jedes Feld entspricht einer Frage, die im Ernstfall sonst gestellt wird: Wer? Wie lange? Wie kommt man zurück? Die Zahlen im Beispiel (38 Prüfzeilen, 2 Prozent) sind erfunden und dienen nur zur Illustration der Form.

Typische Fehler: Die Dokumentation entsteht *nachträglich* aus dem Gedächtnis und weicht vom wirklichen Ablauf ab. Falsch ist ein Bericht, der nur das Geplante wiedergibt. Richtig ist, während der Änderung in einem Protokoll mitzuschreiben (Uhrzeit, Schritt, Ergebnis) und die Abweichungen festzuhalten. Ein weiterer Fehler ist der Papierfriedhof: Dokumente, die niemand liest, weil sie zu lang sind oder an einem Ort liegen, den keiner findet. Die Antwort ist, sie dort aufzubewahren, wo gearbeitet wird (im selben Git-Archiv wie die Konfiguration), und kurz zu halten.

> **Praxisbeispiel: Der Fund nach einem Jahr**
>
> Ein Kunde meldet, dass eine alte Weiterleitung nicht mehr geht. Im Git-Verlauf findet das Team den Commit, der sie entfernt hat, samt Begründung („alte Kampagne abgeschlossen, Ticket 4711“). Ohne diese Beschreibung hätte die Ursachensuche Stunden gedauert.

## Übungsaufgaben

Die Aufgaben steigen im Schwierigkeitsgrad. Für die praktischen Aufgaben genügt ein Testrechner mit Apache und Nginx (zum Beispiel Ubuntu 24.04) sowie `curl` und `git`.

**Aufgabe 1 (leicht).** Erkläre den Unterschied zwischen dem Stable- und dem Mainline-Zweig von Nginx. Welchen würdest du für einen Produktivserver wählen, und warum?

**Aufgabe 2 (leicht).** Warum sagt die Versionsnummer `2.4.58` bei einem Distributionspaket wenig darüber aus, ob eine bestimmte Sicherheitslücke behoben ist? Wo findest du die Antwort?

**Aufgabe 3 (leicht).** Nenne drei Direktiven oder Module von Apache 2.2, die in 2.4 ersetzt oder entfernt wurden, und die jeweilige Nachfolgerin.

**Aufgabe 4 (mittel).** Eine Apache-Konfiguration enthält in einem `Directory`-Block `Order deny,allow` und `Deny from all`, in einem `Location`-Block darin `Require all granted`. Welches Ergebnis ist zu erwarten, und wie behebst du es?

**Aufgabe 5 (mittel).** Ein Team prüft eine Migration nur mit `apache2 -t`, der Start schlägt trotzdem fehl. Nenne zwei Gründe, warum die Syntaxprüfung nicht alles findet.

**Aufgabe 6 (praktisch).** Schreibe ein Skript, das die Modulliste von Apache (`-t -D DUMP_MODULES`) zweier Konfigurationsdateien vergleicht und alle Module meldet, die nur in der neuen Konfiguration vorkommen.

**Aufgabe 7 (praktisch).** Erstelle zwei Nginx-Konfigurationen, die sich in einer Weiterleitung und einem Header unterscheiden, und prüfe sie mit `cfgdiff.sh` und `regress.sh`. Ergänze die Tabelle so, dass die gewollten Unterschiede als `ERWARTET` gelten.

**Aufgabe 8 (schwer).** Entwirf einen Rollback-Plan für den Wechsel von Nginx 1.24 auf eine neuere Version mit Binärwechsel im Betrieb. Beschreibe Schritte, Prüfpunkte nach jedem Schritt, Auslöser und die Maßnahme, falls der neue Hauptprozess nicht startet.

**Aufgabe 9 (schwer).** Ein Onlineshop soll von Apache 2.2 auf Nginx umziehen. Erstelle einen Migrationsplan mit Modulinventur, Staging, Spiegelung, Regressionsliste, Stufenplan, Rollback und Änderungsantrag, und benenne, was du vorher klären musst (zum Beispiel `.htaccess`-Regeln).

## Lösungen und Erklärungen

**Lösung 1.** Der Stable-Zweig erhält nur Fehlerkorrekturen und Sicherheitsfixes, der Mainline-Zweig zusätzlich neue Funktionen (nginx.org, abgerufen). Für Produktion ist Stable die vorsichtigere Wahl, solange keine Funktion aus Mainline benötigt wird; das Risiko neuer Funktionen und neuer Fehler ist kleiner. Wer neue Funktionen braucht, wählt Mainline und akzeptiert den häufigeren Wechsel. Das Argument ist wichtiger als die Wahl.

**Lösung 2.** Distributionen übernehmen Sicherheitskorrekturen häufig in die alte Version, ohne die Nummer zu ändern (Backporting; Kenntnisstand des Autors). Die Versionsnummer ist deshalb kein Maß. Die Antwort steht in der Änderungsliste des Pakets (`apt changelog`) oder in den Sicherheitshinweisen der Distribution zum jeweiligen Schwachstellenkürzel.

**Lösung 3.** Beispiele aus der Anleitung und dem Test: `Order/Allow/Deny/Satisfy` wird zu `Require` (mit `RequireAll`/`RequireAny`); `MaxClients` wird zu `MaxRequestWorkers`; `LockFile`, `AcceptMutex` und ähnliche werden zu `Mutex`; `RewriteLog` wird zu `LogLevel`; `NameVirtualHost` und `DefaultType` haben keine Wirkung mehr; `mod_authz_default` und `mod_authn_default` sind entfallen.

**Lösung 4.** Im Test der Mischung ergab dieselbe Anordnung HTTP 403. Die alten Direktiven im umgebenden Block verweigern, und das Mischen beider Systeme ist unzuverlässig. Behebung: die alten Direktiven durch `Require` ersetzen (zum Beispiel `Require all denied` im `Directory` und `Require all granted` im `Location`, das lieferte im Test 200) und `mod_access_compat` entfernen, sobald nichts Altes mehr übrig ist.

**Lösung 5.** Beispiele: Es fehlt die `Listen`-Direktive; die Prüfung meldete im Test `Syntax OK`, der Start brach mit `no listening sockets available` ab. Ein weiterer Grund ist eine Abhängigkeit zwischen Modulen oder zur Umgebung, die erst beim Start sichtbar wird, etwa Rechte an Verzeichnissen und Dateien, ein belegter Port, ein nicht lesbares Zertifikat. Die Syntaxprüfung prüft die Form, nicht den Betrieb; deshalb braucht es einen echten Start im Staging.

**Lösung 6.**

```bash
#!/usr/bin/env bash
# neue-module.sh ALT.conf NEU.conf
mods() { apache2 -f "$1" -t -D DUMP_MODULES 2>&1 \
         | grep -E '_module \(' | sed 's/^ *//' | sort; }
comm -13 <(mods "$1") <(mods "$2")
```

Die Funktion `mods` ruft Apache mit der Konfiguration auf, behält nur Zeilen, die ein Modul beschreiben, entfernt Leerzeichen und sortiert. `comm -13` gibt die Zeilen aus, die nur in der zweiten Eingabe vorkommen. Im Test lieferte der Vergleich genau `headers_module (shared)`.

**Lösung 7.** Mögliche Lösung: zwei Dateien mit gleichem Aufbau wie in 13.4 erzeugen (einmal `return 302`, einmal `return 301` plus `add_header X-Frame-Options DENY;`). `cfgdiff.sh` zeigt beide Unterschiede. In `checks.tsv` steht die Zeile `/old`, ein Tabulator und `301|/neu`; damit meldet `regress.sh` die Weiterleitung als `ERWARTET`. Der Header erscheint nicht in der Prüfsumme des Inhalts; wer ihn prüfen will, muss das Skript um einen Vergleich der Header erweitern, wie im Text gezeigt.

**Lösung 8.** Ein tragfähiger Plan enthält: (1) Sicherung von Konfiguration und alter Programmdatei; (2) Test der neuen Version im Staging mit `nginx -t` und Regressionstests; (3) Start des Dienstes mit *vollem Pfad*; (4) Programmdatei ersetzen, `USR2` senden; Prüfpunkt: `nginx.pid.oldbin` vorhanden, zwei Hauptprozesse, Antwort der Testadresse stimmt; (5) erst dann `WINCH` an den alten Hauptprozess; Prüfpunkt: Fehlerquote und Antwortzeit; (6) bei Auslöser (zum Beispiel Fehlerquote über Schwelle) `HUP` an den alten, `QUIT` an den neuen Hauptprozess. Startet der neue Hauptprozess nicht (`execve() failed` im Fehlerprotokoll), bleibt der alte unverändert; `WINCH` darf dann nicht gesendet werden. Zusätzlich ein Notausgang: Dienst vollständig neu starten mit der alten Programmdatei, wenn nichts mehr hilft.

**Lösung 9.** Ein guter Plan enthält: (a) Bestandsaufnahme der Apache-Konfiguration einschließlich aller `.htaccess`-Dateien, denn Nginx liest sie nicht und die Regeln müssen in die Serverkonfiguration übertragen werden (Kenntnisstand des Autors); (b) Modulinventur und Zuordnung der genutzten Funktionen (Umschreiben, Authentifizierung, PHP-Anbindung) zu Nginx-Bausteinen; (c) Staging aus Git, Prüfung mit `nginx -t`; (d) Spiegelung oder Wiedergabe echter lesender Anfragen, mit Testdiensten statt echter Zahlungs- und Versandwege; (e) eine Regressionsliste aus den Zugriffsprotokollen (häufigste Adressen, alle Weiterleitungen, alle Fehlerseiten); (f) Stufenplan hinter dem Lastverteiler mit Gewichtung, zuerst ein kleiner Anteil; (g) Rollback durch Zurückstellen der Gewichtung auf den Apache-Pool, der bis zum Ende des Beobachtungszeitraums weiterläuft; (h) Änderungsantrag mit Risiko, Zeitfenster und Auslösern. Vorher zu klären: Wer nutzt `.htaccess`? Gibt es Module ohne Gegenstück? Wie sind Sitzungen und Zertifikate verteilt?
