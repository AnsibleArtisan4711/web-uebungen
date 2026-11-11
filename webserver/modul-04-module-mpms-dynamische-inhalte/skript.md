# Modul 04 - Module, MPMs und dynamische Inhalte

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Listings unverändert, farbige Boxen als Zitatblöcke mit fettem Titel, Tabellen als Markdown-Tabellen, Übungsaufgaben und Lösungen als Absätze bzw. Überschriften). Die Lerneinheiten sind wie in der Quelle nach Modul nummeriert (4.1 bis 4.8), danach folgen „Übungsaufgaben“ (10) und „Lösungen und Erklärungen“. **Die Konfigurationen und Befehle wurden für dieses Repository nicht ausgeführt:** Laut Einleitung hat der Autor die Beispiele in einer Linux-Umgebung (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0) ausgeführt; nicht getestet sind laut Skript Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt. Viele Beispiele ändern Server-Konfiguration, Zertifikate, Rechte oder Dienste: nur in einer Testumgebung ausprobieren. Übersicht zum Modul: [README](README.md).

**Geplante Dauer:** 9 h | **Priorität:** 1 | **Lerneinheiten:** 8

## Lerneinheiten laut Lehrplan

| **Nr.** | **Lerneinheit**       | **Dauer (h)** | **Prio** |
|--------:|:----------------------|--------------:|---------:|
|     4.1 | LoadModule            |             1 |        1 |
|     4.2 | MPM Event             |             1 |        1 |
|     4.3 | MPM Worker            |           1,5 |        1 |
|     4.4 | MPM Prefork           |             1 |        1 |
|     4.5 | CGI und SSI           |             1 |        1 |
|     4.6 | FastCGI und PHP-FPM   |           1,5 |        2 |
|     4.7 | Handler und Filter    |             1 |        2 |
|     4.8 | Modul-Troubleshooting |             1 |        2 |
|         | **Summe**             |         **9** |          |

## Überblick und Lernweg

Die Fähigkeiten eines Apache-Servers stecken nicht im Kern, sondern in *Modulen*. Der Kern kennt Konfigurationsdateien, Anfragen und Antworten; alles Weitere, vom Auflösen von Dateinamen über die Zugriffskontrolle bis zur Komprimierung, liefern Module. Dieses Modul zeigt, wie man Module lädt und verwaltet, wie der Server mit *Multi-Processing Modules* (MPMs) entscheidet, ob er Prozesse oder Threads für Verbindungen benutzt, und wie dynamische Inhalte (Programme, die eine Seite erst bei der Anfrage erzeugen) angebunden werden: über CGI, SSI und vor allem über FastCGI zu einem PHP-Prozessmanager.

Die acht Einheiten bauen aufeinander auf. Zuerst das Laden von Modulen (4.1), dann die drei MPMs *event*, *worker* und *prefork* (4.2 bis 4.4), danach die älteren und neueren Wege, Programme auszuführen (4.5 und 4.6), schließlich das Zusammenspiel aus Handlern und Filtern (4.7) und die systematische Fehlersuche (4.8). Alle Einheiten dieses Moduls beziehen sich auf den Apache HTTP Server; Nginx kennt weder ladbare MPMs noch CGI im Kern und bindet dynamische Inhalte ausschließlich über Weiterleitung an (Modul 7).

> **Merke**
>
> Die Beispiele wurden mit Apache 2.4.58 getestet. Als FastCGI-Gegenstelle diente `php-cgi -b`, das dasselbe Protokoll spricht wie PHP-FPM; PHP-FPM selbst war in der Testumgebung nicht installiert, die FPM-Konfiguration in Einheit 4.6 ist deshalb nicht ausgeführt worden.

## 4.1 LoadModule

Ein Apache-Modul ist ein Stück Programmcode, das der Server zur Laufzeit in sich hineinlädt. Der Fachbegriff dafür ist *DSO* (*Dynamic Shared Object*): Das Modul liegt als Datei (unter Linux mit der Endung `.so`, unter Windows `.dll`) vor, und die Direktive `LoadModule` sagt dem Server, welche Datei er laden soll und unter welchem Namen er das Modul kennt. Der Vorteil gegenüber fest einkompilierten Modulen liegt darin, dass man die Fähigkeiten des Servers ändern kann, ohne ihn neu zu übersetzen: Man schreibt eine Zeile in die Konfiguration und lädt neu. Möglich macht das das Modul `mod_so`, das selbst fest im Server steckt.

Die Syntax ist `LoadModule Name Pfad`. Der Name (zum Beispiel `rewrite_module`) ist ein interner Bezeichner, der von der Moduldatei vorgegeben ist und nicht frei gewählt werden darf; der Pfad (`modules/mod_rewrite.so`) ist relativ zum `ServerRoot`. Das ist der Grund, warum der `ServerRoot` *vor* der ersten `LoadModule`-Zeile stehen muss. Der Versuch in der Testumgebung zeigt, was passiert, wenn man das vergisst: Steht `LoadModule` vor `ServerRoot`, sucht Apache unter dem eingebauten Standardwert (`/etc/apache2`) und meldet `Cannot load modules/mod_mpm_event.so into server: /etc/apache2/modules/mod_mpm_event.so: cannot open shared object file`.

Welche Module geladen sind, zeigt `apachectl -M`. Die Ausgabe unterscheidet *static* (fest einkompiliert, zum Beispiel `core_module` und `so_module`) von *shared* (per `LoadModule` geladen). Auf Debian und Ubuntu verwaltet man die Zeilen nicht von Hand, sondern mit den Hilfsprogrammen `a2enmod` und `a2dismod`, die Verknüpfungen in `mods-enabled/` anlegen und entfernen; auf RHEL-artigen Systemen liegen die Zeilen in Dateien unter `conf.modules.d/`. Wer selbst Module kompiliert, nutzt `apxs` (Einheit 2.2).

```apache
# Hauptserver ohne Debian-Hilfsmittel: ServerRoot zuerst
ServerRoot "/usr/lib/apache2"
LoadModule mpm_event_module  modules/mod_mpm_event.so
LoadModule authz_core_module modules/mod_authz_core.so
LoadModule alias_module      modules/mod_alias.so
LoadModule headers_module    modules/mod_headers.so

<IfModule headers_module>
    Header always set X-Content-Type-Options "nosniff"
</IfModule>
```

Das Beispiel lädt einen MPM, das Zugriffsmodul, `mod_alias` und `mod_headers`. Am Ende zeigt es den Container `IfModule`: Die Direktiven darin gelten nur, wenn das genannte Modul geladen ist, sonst werden sie übersprungen. Das ist praktisch für Konfigurationen, die auf verschiedenen Servern laufen sollen, hat aber eine Schattenseite: Fehlt das Modul versehentlich, bleibt die Absicherung *unbemerkt* aus, weil auch kein Fehler erscheint. Für sicherheitsrelevante Direktiven ist es deshalb besser, das Modul ausdrücklich zu laden und kein `IfModule` zu verwenden, damit ein Fehler laut wird.

Die Reihenfolge der `LoadModule`-Zeilen spielt gelegentlich eine Rolle, weil manche Module von anderen abhängen. Die Abhängigkeit wird von Apache nicht automatisch aufgelöst. Lädt man `mod_proxy_http` ohne das Grundmodul `mod_proxy`, scheitert der Start mit `Cannot load modules/mod_proxy_http.so into server: ... undefined symbol: ap_proxy_location_reverse_map`. Die Meldung wirkt kryptisch, bedeutet aber schlicht: Ein Funktionsname, den das Modul braucht, wird von einem nicht geladenen Modul geliefert. Wer in solchen Meldungen `undefined symbol` liest, sucht also das *fehlende Basismodul*.

### Typische Fehler.

Der erste Fehler ist, Module „auf Vorrat“ zu laden: Jedes Modul vergrößert die Angriffsfläche und kostet Speicher, und viele Standardinstallationen laden Dutzende Module, die niemand braucht. Der zweite ist, eine Direktive zu benutzen, deren Modul fehlt; der Test meldet dann `Invalid command 'ProxyPass', perhaps misspelled or defined by a module not included in the server configuration`. Der dritte ist, einen `LoadModule`-Eintrag zu kopieren, der auf einen Pfad zeigt, den es auf dem anderen System nicht gibt (Debian: `/usr/lib/apache2/modules`, RHEL: `/usr/lib64/httpd/modules`).

```apache
# falsch: Modul wird nicht geladen, Direktive unbekannt
ProxyPass "/app" "http://127.0.0.1:3000/"
# richtig: erst das Basismodul und die Protokollerweiterung laden
LoadModule proxy_module      modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
ProxyPass "/app" "http://127.0.0.1:3000/"
```

> **Praxisbeispiel: Modulinventur**
>
> Bei Übernahmen und Audits beginnt man mit `apachectl -M`: Jedes geladene Modul, das niemand erklären kann, ist ein Kandidat zum Abschalten. Besonders kritisch sind `mod_status` und `mod_info` (ohne Zugriffsbeschränkung), `mod_userdir` (gibt Heimatverzeichnisse frei) und `mod_autoindex` (Verzeichnislisten). Die Inventur gehört in jedes Konfigurationsreview (Einheit 3.8).

## 4.2 MPM Event

Ein *Multi-Processing Module* bestimmt, wie Apache Verbindungen auf Prozesse und Threads verteilt. Es ist das Gerüst des Servers, und es gibt genau eines davon pro Instanz. Unter Unix stehen drei zur Auswahl: *prefork* (nur Prozesse), *worker* (Prozesse mit mehreren Threads) und *event* (wie worker, aber mit einem eigenen Thread für wartende Verbindungen). Die Auswahl ist eine Entscheidung beim Start: Wird kein MPM geladen, bricht der Test ab mit `AH00534: Configuration error: No MPM loaded`, werden zwei geladen, mit `More than one MPM loaded`. Beide Meldungen wurden in der Testumgebung erzeugt.

Das Besondere am *event*-MPM ist der Umgang mit *Keep-Alive*-Verbindungen. Bei HTTP/1.1 bleibt eine Verbindung nach einer Antwort offen, damit der Browser weitere Dateien darüber holen kann. Ein klassischer Thread-Server reserviert für jede solche Verbindung einen Arbeits-Thread, auch wenn der Client gerade nichts will; ein Dutzend lahmer Browser kann dann alle Threads blockieren. Das event-MPM trennt das: Ein spezieller *Listener-Thread* überwacht die wartenden Verbindungen mit dem Betriebssystemmechanismus (`epoll`), und nur wenn wirklich Daten eintreffen, wird ein Arbeits-Thread eingesetzt. Wartende Verbindungen kosten damit fast nichts. Nach der Apache-Dokumentation gilt dasselbe für das Abwarten beim Schreiben, also wenn der Client Daten langsam abnimmt, und für das sanfte Beenden von Verbindungen. Weil Verbindungen mit TLS oder bestimmten Filtern auf Arbeits-Threads angewiesen bleiben können, ist der Vorteil nicht überall gleich groß.

Wichtig für die Auslegung ist, wie die Direktiven zusammenhängen. Ein Kindprozess (*Child*) hat `ThreadsPerChild` Arbeits-Threads. Die Gesamtzahl gleichzeitig bearbeiteter Anfragen begrenzt `MaxRequestWorkers`, und die Zahl der Kindprozesse begrenzt `ServerLimit`. Es muss gelten: `MaxRequestWorkers` ≤ `ServerLimit` × `ThreadsPerChild`. Apache korrigiert Verstöße beim Start selbst und warnt. Die Testumgebung zeigte zwei Fälle:

```apache
# Test 1: MaxRequestWorkers ist kein Vielfaches von ThreadsPerChild
ServerLimit 4
ThreadsPerChild 25
MaxRequestWorkers 90
# Ausgabe: AH00513: WARNING: MaxRequestWorkers of 90 is not an integer
#   multiple of ThreadsPerChild of 25, decreasing to nearest multiple 75,
#   for a maximum of 3 servers.

# Test 2: ServerLimit zu klein für den gewünschten Wert
ServerLimit 2
ThreadsPerChild 25
MaxRequestWorkers 400
# Ausgabe: AH00515: WARNING: MaxRequestWorkers of 400 would require 16 servers
#   and would exceed ServerLimit of 2, decreasing to 50.
```

Im ersten Test rundet Apache auf das nächste Vielfache (75, also drei Kindprozesse) ab, im zweiten kappt er den Wert auf `ServerLimit` mal `ThreadsPerChild`, also 50. In beiden Fällen meldet `configtest` trotzdem `Syntax OK`; die Warnung steht davor und geht leicht unter. Das ist ein Grund, die Ausgabe des Tests immer vollständig zu lesen. Die Standardwerte des event-MPM (nach der Dokumentation) sind `ThreadsPerChild 25`, `ServerLimit 16`, `MaxRequestWorkers 400` und `StartServers 3`; ein Start ohne Änderungen in der Testumgebung ergab einen Elternprozess und drei Kindprozesse mit je 27 Threads (25 Arbeits-Threads plus zwei Hilfs-Threads, darunter der Listener).

> **Ergänzung aus der Nachrecherche: Warum MaxRequestWorkers bei event nicht die Verbindungsgrenze ist**
>
> Nach der Dokumentation des event-MPM (abgerufen am 31.10.2026) können gleichzeitig mehr Verbindungen offen sein, als Arbeits-Threads existieren, weil wartende Verbindungen keinen Thread brauchen. Die Obergrenze für Verbindungen ergibt sich aus `MaxRequestWorkers` multipliziert mit einem Faktor, den die Direktive `AsyncRequestWorkerFactor` festlegt (Standard 2). Wer viele Keep-Alive-Verbindungen erwartet, sollte `MaxRequestWorkers` also nicht mit der Zahl der erwarteten Browser gleichsetzen, sondern mit der Zahl der *gleichzeitig arbeitenden* Anfragen. Der genaue Rechenweg steht in der verlinkten Dokumentation.

### Typische Fehler.

Der häufigste Fehler ist, `MaxRequestWorkers` zu hoch zu setzen, ohne den Speicher zu rechnen. Jeder Kindprozess belegt Speicher, und mit eingebetteten Interpretern oder großen Modulen können es viele Megabyte sein; bei Überlast beginnt der Server zu *swappen*, und die Antwortzeiten brechen ein. Der zweite Fehler ist, `ServerLimit` und `ThreadsPerChild` im laufenden Betrieb per `graceful` zu ändern und zu erwarten, dass sie wirken: Beide werden nur bei einem vollständigen Neustart gelesen. Der dritte ist, Werte aus einer Anleitung zu übernehmen, die für einen anderen MPM geschrieben wurde.

```apache
# falsch: Rechnung ergibt 16 x 25 = 400, aber der Server hat 2 GB RAM
MaxRequestWorkers 400
# richtig: aus Messwerten ableiten (Speicher pro Kindprozess x Prozesse < RAM)
ServerLimit 6
ThreadsPerChild 25
MaxRequestWorkers 150
```

> **Praxisbeispiel: Auslastung beobachten**
>
> Mit `mod_status` (Statusseite, Einheit 3.5) sieht man, wie viele Arbeits-Threads belegt sind. Liegen sie dauerhaft bei 100 %, ist `MaxRequestWorkers` der Engpass; steht im Fehlerlog `AH00484: server reached MaxRequestWorkers setting`, ist die Grenze erreicht worden. Erst dann, und nur mit Blick auf den freien Speicher, erhöht man sie.

## 4.3 MPM Worker

Das *worker*-MPM ist der Vorgänger des event-MPM und die Mischform zwischen Prozessen und Threads: Mehrere Kindprozesse, die jeweils eine feste Zahl von Threads starten. Jeder Thread bearbeitet eine Verbindung vom ersten bis zum letzten Byte, inklusive der Wartezeiten bei Keep-Alive. Das ist einfacher gebaut als das event-MPM und deshalb sehr stabil, hat aber genau dessen Schwäche nicht gelöst: Ein Thread bleibt an eine Verbindung gebunden, solange sie offen ist. Im Gegenzug braucht es weit weniger Speicher als eine rein prozessbasierte Lösung, weil sich Threads Speicher teilen.

Die Konfiguration unterscheidet sich kaum von der des event-MPM. Dieselben Direktiven (`ServerLimit`, `ThreadsPerChild`, `MaxRequestWorkers`, `StartServers`, `MinSpareThreads`, `MaxSpareThreads`) steuern Größe und Elastizität. Die Elastizität ist ein wichtiger Begriff: Der Server startet nicht alle erlaubten Prozesse gleich, sondern hält eine Reserve an freien Threads zwischen `MinSpareThreads` und `MaxSpareThreads` vor. Fällt die Reserve unter das Minimum, startet er neue Kindprozesse, steigt sie über das Maximum, beendet er Kindprozesse. Das Beispiel zeigt eine typische Auslegung:

```apache
LoadModule mpm_worker_module modules/mod_mpm_worker.so

<IfModule mpm_worker_module>
    StartServers          2
    ServerLimit           8
    ThreadsPerChild      25
    MinSpareThreads      50
    MaxSpareThreads     150
    MaxRequestWorkers   200
    MaxConnectionsPerChild 10000
</IfModule>
```

Mit diesen Werten starten zwei Kindprozesse mit insgesamt 50 Threads. Wächst die Last, kommen weitere Prozesse hinzu, bis 200 Threads (8 mal 25) erreicht sind. `MaxConnectionsPerChild` beendet einen Prozess nach 10 000 Verbindungen und ersetzt ihn; das begrenzt die Folgen von Speicherlecks in Modulen. Der Wert 0 bedeutet „nie“. Der `IfModule`-Container sorgt dafür, dass die Werte nur gelten, wenn das worker-MPM tatsächlich geladen ist; so kann eine Datei mehrere MPM-Abschnitte enthalten, und nur der passende wirkt. Genau so sehen es die Standarddateien von Debian vor.

Wann nimmt man worker statt event? In der Praxis kaum noch, denn event ist bei fast jedem Arbeitsaufkommen gleich gut oder besser. Gründe für worker sind alte Module, die mit dem event-MPM nicht zusammenarbeiten, und Erfahrungsberichte in einer Umgebung, die seit Jahren läuft. Für neue Systeme ist event die Voreinstellung der meisten Distributionen.

### Typische Fehler.

Man verwechselt Prozess- und Threadwerte: `MaxRequestWorkers 200` bei worker bedeutet 200 *Threads*, nicht 200 Prozesse. Man vergisst, dass `ThreadsPerChild` größer als `ThreadLimit` (Standard 64) nicht erlaubt ist, ohne auch `ThreadLimit` zu erhöhen. Und man betreibt thread-unsichere Module (alte PHP-Einbindungen über `mod_php`) unter einem Thread-MPM; das führt zu seltenen, schwer zu findenden Abstürzen.

```apache
# falsch: mod_php (nicht thread-sicher) mit einem Thread-MPM
LoadModule mpm_worker_module modules/mod_mpm_worker.so
LoadModule php_module        modules/libphp.so
# richtig: Thread-MPM und PHP ausserhalb des Servers (FastCGI, Einheit 4.6)
LoadModule mpm_event_module  modules/mod_mpm_event.so
LoadModule proxy_fcgi_module modules/mod_proxy_fcgi.so
```

> **Praxisbeispiel: Migration von worker auf event**
>
> Der Wechsel besteht aus dem Austausch einer `LoadModule`-Zeile und der Prüfung, ob alle geladenen Module thread-sicher sind. Auf Debian geschieht er mit `a2dismod mpm_worker && a2enmod mpm_event`, gefolgt von einem *Neustart* (ein MPM-Wechsel gelingt nicht per Neuladen). Ein Test im Staging mit der echten Last ist Pflicht.

## 4.4 MPM Prefork

Das *prefork*-MPM ist das älteste Modell: Jeder Kindprozess bearbeitet immer genau eine Verbindung, es gibt keine Threads. Der Name kommt von *pre-forking*: Der Elternprozess startet im Voraus eine Anzahl Kindprozesse (mit `fork`), damit bei einer Anfrage keine Startzeit anfällt. Das Modell ist langsamer und verbraucht viel Speicher, aber es hat einen Vorteil: Weil Prozesse sich nicht den Speicher teilen, sind sie voneinander isoliert, und Programmcode muss nicht thread-sicher sein. Ein Absturz eines Kindprozesses betrifft nur eine Verbindung.

Deshalb war prefork lange die einzige Wahl für `mod_php`, das in jedem Kindprozess einen PHP-Interpreter einbettet. Mit FastCGI ist dieser Grund entfallen. Die Konfiguration kennt weniger Direktiven als die Thread-MPMs, weil es keine Threads gibt: `StartServers` (Prozesse beim Start), `MinSpareServers` und `MaxSpareServers` (Reserve an freien Prozessen), `MaxRequestWorkers` (Obergrenze der Prozesse, Standard 256) und `ServerLimit` (feste Obergrenze, nur per Neustart änderbar). Die Testumgebung prüfte folgende Auslegung mit `Syntax OK`:

```apache
LoadModule mpm_prefork_module modules/mod_mpm_prefork.so
<IfModule mpm_prefork_module>
    ServerLimit          20
    StartServers          3
    MinSpareServers       2
    MaxSpareServers       5
    MaxRequestWorkers    20
    MaxConnectionsPerChild 2000
</IfModule>
```

Hier laufen anfangs drei Prozesse; sinken die freien unter zwei, werden neue gestartet (nach der Dokumentation zunächst höchstens ein Prozess pro Sekunde, danach in steigender Rate, damit bei kurzen Lastspitzen kein Prozesssturm entsteht), steigen sie über fünf, werden überzählige beendet. Die Obergrenze von 20 bedeutet höchstens 20 gleichzeitige Anfragen, was für eine kleine Website reicht. Rechnen Sie nach: Hat ein Kindprozess 40 MB, verbrauchen 20 Prozesse 800 MB; mit dem event-MPM käme man bei derselben Last mit einem Bruchteil aus.

Prefork ist heute nur noch in drei Lagen sinnvoll: bei alten Anwendungen, die ausdrücklich nicht thread-sicher sind; in Umgebungen, in denen Prozessisolation wichtiger ist als Leistung; und bei Betriebssystemen ohne gute Thread-Unterstützung. In allen anderen Fällen lohnt der Umstieg.

### Typische Fehler.

Der klassische Fehler ist, `MaxRequestWorkers` bei prefork nach dem Muster von event auf 400 zu setzen und den Speicher zu überfordern. Ein zweiter: Der Wert `MaxRequestWorkers` liegt über `ServerLimit`; Apache setzt ihn dann auf den Wert von `ServerLimit` zurück und warnt beim Start. Ein dritter: Keep-Alive mit langem Timeout bei prefork; jeder wartende Browser belegt einen ganzen Prozess.

```apache
# falsch: lange Keep-Alive-Zeit bindet bei prefork je einen Prozess
KeepAlive On
KeepAliveTimeout 60
# richtig: kurze Wartezeit, damit Prozesse schnell frei werden
KeepAlive On
KeepAliveTimeout 2
MaxKeepAliveRequests 100
```

> **Praxisbeispiel: Altlasten erkennen**
>
> Findet man bei einer Übernahme `prefork` und `mod_php`, ist das ein Hinweis auf eine ältere Anwendung. Der Umstieg auf event mit PHP-FPM ist meist ein Wochenendprojekt, bringt aber deutlich bessere Auslastung; Einheit 4.6 beschreibt den Weg.

## 4.5 CGI und SSI

*CGI* (*Common Gateway Interface*) ist die älteste Art, eine Webseite von einem Programm erzeugen zu lassen. Das Prinzip: Bei jeder Anfrage startet der Webserver ein externes Programm (ein Shell-, Perl- oder Python-Skript oder eine ausführbare Datei), übergibt ihm die Anfragedaten über *Umgebungsvariablen* (`REQUEST_METHOD`, `QUERY_STRING`, `REMOTE_ADDR` und weitere) und liest die Antwort von dessen Standardausgabe. Die Antwort besteht aus Kopfzeilen, einer Leerzeile und dem Inhalt. Weil für jede Anfrage ein neuer Prozess entsteht, ist CGI langsam und nur für selten genutzte Funktionen geeignet. Dafür ist es einfach zu verstehen und unabhängig von jeder Programmiersprache.

In Apache übernimmt `mod_cgi` (bei Thread-MPMs `mod_cgid`, das einen eigenen Daemon zum Starten der Skripte benutzt) die Ausführung. Üblich ist die Direktive `ScriptAlias`: Sie ordnet einem URL-Pfad ein Dateisystemverzeichnis zu und erklärt gleichzeitig alle Dateien darin zu CGI-Programmen. Das folgende Skript und die Konfiguration wurden in der Testumgebung ausgeführt:

```bash
#!/bin/bash
echo "Content-Type: text/plain"
echo
echo "Hallo aus CGI, Methode=$REQUEST_METHOD, Query=$QUERY_STRING"
```

```apache
LoadModule cgid_module modules/mod_cgid.so
ScriptAlias "/cgi/" "/tmp/m4/cgi/"
<Directory "/tmp/m4/cgi">
    Require all granted
</Directory>
```

Das Skript schreibt zuerst die Kopfzeile `Content-Type`, dann eine Leerzeile (sie trennt Kopf und Inhalt, ohne sie kennt Apache das Ende der Kopfzeilen nicht) und danach den Text. Es muss ausführbar sein (`chmod 755`). Die Abfrage `curl "localhost:8070/cgi/hallo.sh?a=1"` lieferte `Hallo aus CGI, Methode=GET, Query=a=1`. Man sieht, wie die Anfrage das Skript erreicht: Die Methode und der Teil nach dem Fragezeichen stehen in Variablen.

Drei Fehlerbilder kommen in der Praxis ständig vor, und alle wurden nachgestellt. Fehlt die Kopfzeile (`kaputt.sh` gab nur „Hallo“ aus), antwortet Apache mit 500 und schreibt ins Fehlerlog: `malformed header from script 'kaputt.sh': Bad header: Hallo ohne Header`. Fehlt das Ausführungsrecht (`chmod 644`), ebenfalls 500, mit `AH01241: exec of '...ohnex.sh' failed` und `Permission denied`. Und Windows-Zeilenenden (`\r\n`) in der ersten Zeile des Skripts (`#!/bin/bash\r`) führen zu einem Fehler beim Starten des Interpreters, der im Log als „No such file or directory“ auftaucht, obwohl die Datei vorhanden ist.

*SSI* (*Server Side Includes*) sind kleine Anweisungen, die man als HTML-Kommentare in eine Seite schreibt und die der Server beim Ausliefern auflöst: Dateien einbinden, Variablen ausgeben, Datum anzeigen. Das Modul heißt `mod_include`, aktiviert wird es über einen *Filter* (Einheit 4.7) und die Option `Includes`. Die Testkonfiguration:

```apache
LoadModule include_module modules/mod_include.so
LoadModule filter_module  modules/mod_filter.so
AddType text/html .shtml
AddOutputFilter INCLUDES .shtml
<Directory "/tmp/m4/htdocs/s">
    Options +Includes
</Directory>
```

```text
<html><body>
Datei: <!--#echo var="DOCUMENT_NAME" -->
<!--#include virtual="/s/fuss.html" -->
<!--#exec cmd="echo exec-lief" -->
</body></html>
```

Dateien mit der Endung `.shtml` laufen durch den Filter `INCLUDES`. In der Antwort wird `DOCUMENT_NAME` zu `seite.shtml`, und `include virtual` fügt den Inhalt von `/s/fuss.html` ein. Die Anweisung `exec` ist ein Sonderfall: Sie startet ein Programm und braucht daher zusätzlich ein CGI-Modul. Ohne `mod_cgid` lieferte der Test den Text `[an error occurred while processing this directive]` und im Log `AH01371: unknown directive "exec"`; mit geladenem `mod_cgid` erschien `exec-lief`. Mit `Options +IncludesNOEXEC` bleibt SSI erlaubt, aber `exec` ist verboten; wer SSI braucht, sollte immer diese Variante wählen. Fehlt jede der beiden Optionen, schreibt Apache `AH01374: mod_include: Options +Includes (or IncludesNoExec) wasn't set, INCLUDES filter removed`, und der Browser zeigt die Rohform mit den Kommentaren, die für Besucher unsichtbar bleiben, aber Verzeichnisse und Dateinamen preisgeben können.

> **Merke**
>
> Der Lehrplan verlangt CGI und SSI als Wissen, weil man ihnen in Altsystemen begegnet. Neue Anwendungen sollten sie nicht mehr verwenden: CGI startet je Anfrage einen Prozess und ist anfällig für Eingabefehler, die zu Befehlsausführung führen; SSI wird heute meist durch Templates der Anwendung oder durch Nginx-/Apache-Funktionen wie Includes im Frontend ersetzt. Beide bleiben als Technik nützlich, um Abläufe zu verstehen: Die Umgebungsvariablen von CGI bilden die Grundlage von FastCGI und vielen Frameworks.

### Typische Fehler.

Neben den genannten Meldungen ist der wichtigste Fehler, ein `ScriptAlias`-Verzeichnis *innerhalb* des `DocumentRoot` anzulegen: Dann sind dieselben Dateien einmal als Programm und einmal als Quelltext abrufbar, weil sie über einen zweiten Pfad ausgeliefert werden. Ein weiterer ist, Benutzereingaben ungeprüft an eine Shell zu übergeben (`eval "$QUERY_STRING"`); das ist die klassische Befehlsinjektion.

```bash
# falsch: Benutzereingabe landet in der Shell
#!/bin/bash
echo "Content-Type: text/plain"; echo
eval "ping -c1 $QUERY_STRING"
# richtig: Eingabe prüfen, nie in die Shell übergeben
#!/bin/bash
echo "Content-Type: text/plain"; echo
case "$QUERY_STRING" in
  host=[a-z0-9.-]*) echo "Eingabe akzeptiert" ;;
  *) echo "ungültig" ;;
esac
```

> **Praxisbeispiel: CGI im Alltag**
>
> In Netzwerkgeräten, alten Verwaltungsoberflächen und kleinen Hilfsskripten läuft CGI heute noch. Wer so etwas erbt, prüft zuerst, welche Skripte im `ScriptAlias`-Verzeichnis liegen, wer sie ändern darf und ob sie Benutzereingaben verarbeiten.

## 4.6 FastCGI und PHP-FPM

*FastCGI* löst das Hauptproblem von CGI: Das Programm startet nicht bei jeder Anfrage neu, sondern läuft als dauerhafter Dienst und nimmt Anfragen über eine Verbindung entgegen (TCP oder Unix-Socket). Der Webserver schickt die Anfragedaten in demselben Format wie bei CGI, aber über das FastCGI-Protokoll, und liest die Antwort zurück. Damit bleiben Interpreter, geladener Code und Verbindungen zu Datenbanken im Speicher, und die Startkosten fallen weg.

*PHP-FPM* (*FastCGI Process Manager*) ist der übliche FastCGI-Dienst für PHP. Er verwaltet Gruppen von Arbeitsprozessen (*Pools*), startet und beendet sie nach Bedarf und läuft unabhängig vom Webserver, oft unter einem anderen Benutzer. Diese Trennung ist ein Gewinn: Der Webserver bleibt schlank (und kann das event-MPM nutzen), PHP lässt sich getrennt aktualisieren, und jede Website kann ihren eigenen Pool mit eigenen Rechten bekommen. Apache spricht FastCGI über das Modul `mod_proxy_fcgi`, das auf `mod_proxy` aufbaut.

Es gibt zwei Konfigurationsstile. Der einfache nutzt einen *Handler*, der den PHP-Dateien den Weg zum Pool vorgibt. Die Testumgebung hatte keinen PHP-FPM, aber `php-cgi -b 127.0.0.1:9000`, das dasselbe Protokoll spricht. Die folgende Konfiguration lieferte damit `PHP 8.3.6 via cgi-fcgi, Methode GET`:

```apache
LoadModule proxy_module      modules/mod_proxy.so
LoadModule proxy_fcgi_module modules/mod_proxy_fcgi.so
<FilesMatch "\.php$">
    SetHandler "proxy:fcgi://127.0.0.1:9000"
    ProxyFCGIBackendType GENERIC
    ProxyFCGISetEnvIf "true" SCRIPT_FILENAME "%{reqenv:DOCUMENT_ROOT}%{reqenv:SCRIPT_NAME}"
</FilesMatch>
```

Die `FilesMatch`-Regel erfasst alle Dateien auf `.php`. `SetHandler` schickt sie an die FastCGI-Gegenstelle. Die letzten beiden Zeilen sind eine Besonderheit meiner Gegenstelle: Das schlichte `php-cgi` erwartet im Feld `SCRIPT_FILENAME` den Dateipfad, bekam aber zunächst die Zeichenkette `proxy:fcgi://...`, und antwortete mit dem Text `No input file specified.` und dem Status 404. PHP-FPM ist an dieser Stelle toleranter, weil es dieses Format erkennt und das Präfix entfernt; bei einem Betrieb mit PHP-FPM genügt nach dem Kenntnisstand des Autors die erste Zeile mit dem Socket des Pools (nicht mit PHP-FPM getestet, bitte in der Dokumentation prüfen). Ein Praxisaufbau unter Debian sieht so aus (nicht in der Testumgebung ausgeführt):

```apache
<FilesMatch "\.php$">
    SetHandler "proxy:unix:/run/php/php8.3-fpm.sock|fcgi://localhost"
</FilesMatch>
```

```ini
; /etc/php/8.3/fpm/pool.d/www.conf (Auszug)
[www]
user = www-data
group = www-data
listen = /run/php/php8.3-fpm.sock
listen.owner = www-data
listen.group = www-data
pm = dynamic
pm.max_children = 20
pm.start_servers = 4
pm.min_spare_servers = 2
pm.max_spare_servers = 6
```

Der Pool läuft als Benutzer `www-data` und lauscht an einem Unix-Socket, auf den nur `www-data` zugreifen darf. Die Zeilen `pm.*` legen fest, wie der Prozessmanager Arbeitsprozesse verwaltet: `dynamic` startet `start_servers` Prozesse und hält zwischen `min_spare` und `max_spare` freie vor, höchstens aber `max_children`. Die Schreibweise `unix:/pfad|fcgi://localhost` trennt Socket und das „virtuelle“ Ziel, dessen Host nur für Header und Protokollierung gebraucht wird.

Die Fehlersuche folgt einem festen Schema, und der Test mit einem nicht vorhandenen Socket zeigt es. Antwortet der Dienst nicht, liefert Apache 503 und im Fehlerlog stehen zwei Zeilen: `AH02454: FCGI: attempt to connect to Unix domain socket /run/php/nix.sock failed` (mit dem Zusatz `No such file or directory`) und `AH01079: failed to make connection to backend`. Eine Antwort 503 bedeutet also, dass das Backend nicht erreichbar ist. Ein 404 *vom Backend* (`File not found.` oder `No input file specified.`) bedeutet dagegen, dass die Verbindung stand, der Pfad aber nicht stimmte. Und ein 502 oder 504 weist auf eine abgebrochene Verbindung oder eine Zeitüberschreitung hin.

### Typische Fehler.

Der gefährlichste Fehler betrifft hochgeladene Dateien: Liegt ein Upload-Verzeichnis im `DocumentRoot` und gilt die `.php`-Regel dort auch, kann ein Angreifer eine `.php`-Datei hochladen und ausführen lassen. Ein zweiter Fehler sind falsche Socket-Rechte (Dienst läuft, aber der Webserverbenutzer darf nicht zugreifen; im Log `Permission denied`). Ein dritter ist `pm.max_children` ohne Blick auf den Speicher.

```apache
# falsch: PHP wird auch im Upload-Ordner ausgeführt
<FilesMatch "\.php$">
    SetHandler "proxy:unix:/run/php/php8.3-fpm.sock|fcgi://localhost"
</FilesMatch>
# richtig: im Upload-Ordner keine PHP-Ausführung
<Directory "/var/www/shop/uploads">
    <FilesMatch "\.php$">
        Require all denied
    </FilesMatch>
</Directory>
```

> **Praxisbeispiel: Zeitüberschreitungen**
>
> Läuft ein PHP-Skript länger als die Proxy-Zeit, liefert Apache 504, obwohl PHP weiterarbeitet. Man stellt die Zeit mit `ProxyTimeout` (Apache) und `request_terminate_timeout` (PHP-FPM) bewusst ein, statt Standardwerte zu erben.

## 4.7 Handler und Filter

Apache verarbeitet jede Anfrage in Stufen (Einheit 1.3). Zwei dieser Stufen sind für die Anpassung besonders wichtig: der *Handler*, der *erzeugt* die Antwort, und die *Filter*, die die erzeugte Antwort (oder die eingehende Anfrage) *verändern*. Ein Handler beantwortet die Frage „Wer liefert den Inhalt?“: die Dateiauslieferung selbst (`default-handler`), ein CGI-Skript (`cgi-script`), die Statusseite (`server-status`), eine Weiterleitung (`proxy:...`). Ein Filter beantwortet „Was geschieht mit dem Inhalt auf dem Weg nach draußen?“: Komprimierung (`DEFLATE`), Ersetzungen (`SUBSTITUTE`), SSI (`INCLUDES`).

Handler weist man mit `SetHandler` (für einen ganzen Bereich) oder `AddHandler` (für Dateiendungen) zu. Der Unterschied ist wichtig: `SetHandler` gilt für *alles* im Container, `AddHandler` nur für Dateien mit der bestimmten Endung. Für Filter dienen `SetOutputFilter` und `AddOutputFilter` (Endungen), `AddOutputFilterByType` (nach Inhaltstyp) sowie `SetInputFilter` für Anfragen. Filter bilden eine *Kette*, die in der Reihenfolge ihrer Beschreibung durchlaufen wird; `mod_filter` bietet die Direktive `FilterChain` zur genauen Steuerung. Das folgende Beispiel verkettet zwei Filter und wurde in der Testumgebung geprüft:

```apache
LoadModule filter_module     modules/mod_filter.so
LoadModule deflate_module    modules/mod_deflate.so
LoadModule substitute_module modules/mod_substitute.so
<Location "/">
    AddOutputFilterByType SUBSTITUTE text/html
    Substitute "s/test.example/www.firma.example/ni"
    AddOutputFilterByType DEFLATE text/html
</Location>
```

Die Datei `f.html` enthielt `test.example`. Der Aufruf lieferte `www.firma.example`: Der erste Filter ersetzt, der zweite komprimiert. Mit `Accept-Encoding: gzip` erschien im Antwortkopf `Content-Encoding: gzip` und `Vary: Accept-Encoding`, und der entpackte Inhalt enthielt bereits den ersetzten Text. Die Reihenfolge ist wichtig: Müsste DEFLATE vor SUBSTITUTE laufen, könnte der Ersetzer den komprimierten Datenstrom nicht mehr lesen. Der Ausdruck in `Substitute` ist ein Muster der Form `s/Suche/Ersatz/Flags`; `i` ignoriert die Schreibweise, `n` behandelt die Suche als festen Text statt als regulären Ausdruck.

Die Wirkung eines Handlers lässt sich einfach prüfen: Die Direktive `SetHandler server-status` macht aus einem URL-Pfad die Statusseite (Einheit 3.5). Eine Faustregel zur Wahl: Soll etwas den Inhalt *erzeugen*, ist es ein Handler; soll es den bereits erzeugten Inhalt *bearbeiten*, ist es ein Filter. Die Zuordnung von Dateiendungen zu Typen und Handlern übernimmt `mod_mime`, deshalb tauchen `AddType`, `AddHandler` und `AddOutputFilter` in einem Atemzug auf (Modul 5 vertieft die MIME-Typen).

### Typische Fehler.

Ein häufiger Fehler ist `AddHandler` für PHP in einer Weise, die Dateien wie `bild.php.jpg` ausführbar macht: `AddHandler` wirkt auf *jede* Endung im Dateinamen, nicht nur auf die letzte. Ein zweiter ist, SUBSTITUTE auf alle Typen anzuwenden, wodurch Binärdateien beschädigt werden; deshalb der Filter nur für `text/html` über `AddOutputFilterByType`. Ein dritter ist, Filter zu setzen, ohne den Inhaltstyp zu kennen, und sich zu wundern, dass nichts passiert.

```apache
# falsch: jede Datei mit .php irgendwo im Namen wird ausgeführt (bild.php.jpg)
AddHandler application/x-httpd-php .php
# richtig: Regel nur für Dateien, die auf .php ENDEN
<FilesMatch "\.php$">
    SetHandler "proxy:unix:/run/php/php8.3-fpm.sock|fcgi://localhost"
</FilesMatch>
```

> **Praxisbeispiel: Ersetzungen am Rand**
>
> Mit `mod_substitute` lassen sich fest eingetragene Adressen in alten Anwendungen anpassen, etwa wenn eine Anwendung hinter einem Reverse Proxy ihre interne Adresse in Links ausgibt. Das ist eine Behelfslösung; sauberer ist es, die Anwendung so zu konfigurieren, dass sie die richtige Adresse erzeugt (Modul 7).

## 4.8 Modul-Troubleshooting

Fehler bei Modulen lassen sich fast immer in drei Gruppen einteilen: Das Modul *lässt sich nicht laden*, es *ist nicht geladen*, obwohl man es braucht, oder es *ist geladen, tut aber nicht, was man erwartet*. Die Behandlung folgt einem festen Weg, der von außen nach innen führt: erst die Meldung beim Start lesen, dann prüfen, was der Server tatsächlich geladen hat, schließlich im Fehlerlog mit erhöhter Protokollstufe nachsehen.

Die erste Gruppe erkennt man am Fehlschlag von `configtest`. Die Testumgebung lieferte die folgenden Meldungen:

| **Meldung (gekürzt)** | **Bedeutung und Abhilfe**                                                 |
|:----------------------|:--------------------------------------------------------------------------|
| `Cannot load modules/mod_foo.so into server: ... cannot open shared object file: No such file or directory`             | Datei fehlt oder Pfad stimmt nicht (`ServerRoot` prüfen, Paket installieren) |
| `... undefined symbol: ap_proxy_location_reverse_map`             | Basismodul (hier `mod_proxy`) fehlt oder wird später geladen                |
| `Invalid command 'ProxyPass', perhaps misspelled or defined by a module not included`             | Modul fehlt, oder Tippfehler                                              |
| `AH00534: Configuration error: No MPM loaded.`             | Kein MPM geladen                                                          |
| `More than one MPM loaded.`             | Zwei MPMs geladen                                                         |

Für die zweite Gruppe gibt es das wichtigste Werkzeug der Einheit: `apachectl -M` listet alle geladenen Module, getrennt nach `static` und `shared`. Mit `apachectl -M | grep proxy` prüft man schnell, ob die gewünschte Gruppe geladen ist. Ergänzend zeigt `apachectl -V` Kompilierungsoptionen wie das Standard-MPM. Die Ausgabe der Testumgebung begann mit `Server MPM: event`, gefolgt von `threaded: yes (fixed thread count)` und `forked: yes (variable process count)`. Auf Debian fragt man zusätzlich nach den aktivierten Verknüpfungen mit `ls /etc/apache2/mods-enabled`, und auf RHEL schaut man in `/etc/httpd/conf.modules.d`.

Die dritte Gruppe ist die kniffligste, denn hier hilft nur das Fehlerlog. Seit Apache 2.4 lässt sich die Protokollstufe *je Modul* einstellen, so dass man nur dort ausführlich protokolliert, wo man sucht: `LogLevel warn rewrite:trace3 proxy:debug`. Das vermeidet eine Flut von Meldungen. Üblich ist außerdem, mit einer minimalen Konfiguration zu arbeiten: Man startet eine Testinstanz auf einem anderen Port (wie in diesem Modul) mit nur dem einen Modul, das man untersucht, und prüft, ob das Verhalten dort reproduzierbar ist. Gelingt das, ist die Ursache in der Konfiguration, nicht im Modul.

```bash
#!/bin/bash
# modul-check.sh -- prüft, ob erwartete Module geladen sind
BIN="${HTTPD_CTL:-apache2ctl}"
fehlt=0
for m in "$@"; do
    if "$BIN" -M 2>/dev/null | grep -q "^ ${m}_module"; then
        echo "ok      $m"
    else
        echo "FEHLT   $m"; fehlt=1
    fi
done
exit $fehlt
```

Das Skript nimmt Modulnamen ohne die Endung `_module` (`./modul-check.sh proxy proxy_fcgi headers`), fragt `apache2ctl -M` ab und meldet für jedes Modul „ok“ oder „FEHLT“. Der Rückgabewert 1 bei mindestens einem fehlenden Modul macht es für Abnahmetests und Pipelines tauglich (Modul 12). Die Ausgabe von `-M` beginnt jede Zeile mit einem Leerzeichen, deshalb das Muster `"^ ${m}_module"`.

### Typische Fehler.

Der erste Fehler ist Raten statt Prüfen: Man ändert mehrere Dinge gleichzeitig und weiß hinterher nicht, was gewirkt hat. Der zweite ist, nur den Test zu lesen und die Warnungen zu überspringen. Der dritte ist, ein MPM-Wechsel per `graceful` zu versuchen: Das MPM wird nur beim vollständigen Start gewechselt, die laufende Instanz behält das alte und meldet nichts Auffälliges.

```bash
# falsch: mehrere Änderungen, nur Neuladen
$ sudo a2dismod mpm_prefork && sudo a2enmod mpm_event proxy_fcgi
$ sudo systemctl reload apache2
# richtig: prüfen, vollständig neu starten, kontrollieren
$ sudo apache2ctl configtest
$ sudo systemctl restart apache2
$ apache2ctl -V | grep MPM && ./modul-check.sh proxy_fcgi
```

> **Praxisbeispiel: Nach dem Update**
>
> Nach einem Paketupdate von Apache ändern sich gelegentlich Modullisten oder Standard-MPMs. Ein kurzer Lauf von `modul-check.sh` mit der Liste der erwarteten Module, kombiniert mit `apachectl -V`, entdeckt solche Abweichungen, bevor Kunden sie bemerken.

## Übungsaufgaben

Die Aufgaben steigen im Schwierigkeitsgrad. Die Aufgaben 6 bis 9 sind praktische Aufgaben, die Sie in einer Testumgebung (virtuelle Maschine oder Container, nicht auf einem Produktivsystem) nachbauen sollten. Die Lösungen mit Erklärung folgen im nächsten Abschnitt.

**Aufgabe 1 (leicht).** Was bedeutet `LoadModule rewrite_module modules/mod_rewrite.so`? Erklären Sie die drei Bestandteile der Zeile und nennen Sie die Datei, die auf einem System mit `ServerRoot "/usr/lib/apache2"` tatsächlich geladen wird. Mit welchem Befehl prüfen Sie danach, ob das Modul geladen ist?

**Aufgabe 2 (leicht).** Ordnen Sie zu, welche der folgenden Aussagen zu *prefork*, *worker* und *event* gehört: (a) jede Verbindung belegt einen eigenen Prozess, (b) ein Listener-Thread überwacht wartende Keep-Alive-Verbindungen, (c) mehrere Prozesse mit je mehreren Threads, wobei ein Thread an eine Verbindung gebunden bleibt.

**Aufgabe 3 (leicht).** Warum liefert ein CGI-Skript den Fehler 500, wenn es nur den Text `Hallo` ausgibt? Wie muss die Ausgabe mindestens aufgebaut sein?

**Aufgabe 4 (mittel).** Ein event-MPM ist so konfiguriert: `ServerLimit 3`, `ThreadsPerChild 20`, `MaxRequestWorkers 100`. Welche Warnung erwarten Sie beim Test, auf welchen Wert wird `MaxRequestWorkers` gesetzt, und was müssten Sie ändern, damit tatsächlich 100 Anfragen gleichzeitig laufen können?

**Aufgabe 5 (mittel).** Ein Server mit `mod_php` unter prefork soll auf event mit PHP-FPM umgestellt werden. Beschreiben Sie die nötigen Schritte in der richtigen Reihenfolge, nennen Sie je Schritt den Befehl oder die Konfigurationszeile und erklären Sie, warum der Wechsel des MPM nicht mit einem Neuladen gelingt.

**Aufgabe 6 (praktisch).** Richten Sie eine Testinstanz mit event-MPM auf Port 8070 ein, die ein CGI-Skript unter `/cgi/info.sh` ausführt. Das Skript soll die Anfragemethode, die Query und die Client-Adresse (`REMOTE_ADDR`) ausgeben. Prüfen Sie dann, was bei fehlendem Ausführungsrecht und bei fehlender Leerzeile nach dem Header passiert, und notieren Sie die Fehlerlog-Meldungen.

**Aufgabe 7 (praktisch).** Aktivieren Sie SSI für Dateien auf `.shtml` in einem Verzeichnis und binden Sie eine Fußzeilendatei per `include virtual` ein. Stellen Sie anschließend sicher, dass `exec` nicht erlaubt ist, und zeigen Sie die Fehlermeldung, die dann erscheint.

**Aufgabe 8 (praktisch).** Konfigurieren Sie zwei Filter: Ersetzen Sie in HTML-Antworten den Text `Testserver` durch `Produktion` und komprimieren Sie die Antwort mit gzip. Weisen Sie mit `curl` nach, dass beides wirkt, und erklären Sie, warum die Reihenfolge nicht umgekehrt werden darf.

**Aufgabe 9 (praktisch).** Schreiben Sie ein Skript `mpm-bericht.sh`, das (a) das aktive MPM aus `apache2ctl -V` ausliest, (b) die Zahl der laufenden Apache-Prozesse ausgibt und (c) mit Exit-Status 1 endet, wenn das MPM nicht `event` ist.

**Aufgabe 10 (schwer).** Eine Website läuft hinter Apache mit PHP-FPM. Nach einem Umzug liefert `/index.php` den Status 503; im Fehlerlog steht `AH02454: FCGI: attempt to connect to Unix domain socket /run/php/php8.2-fpm.sock failed`. (a) Was bedeutet das, und welche drei Ursachen prüfen Sie in welcher Reihenfolge? (b) Nach der Korrektur kommt für `/index.php` ein 404 mit dem Text `File not found.` vom Backend. Was ist nun anders, und wo suchen Sie? (c) Entwerfen Sie die Konfiguration so, dass im Upload-Verzeichnis `/var/www/shop/uploads` keine PHP-Datei ausgeführt wird, und begründen Sie, warum die Regel im `Directory`-Block stehen sollte.

## Lösungen und Erklärungen

### Lösung zu Aufgabe 1.

`LoadModule` ist die Direktive, `rewrite_module` der interne Name des Moduls (vom Modul vorgegeben, nicht frei wählbar), `modules/mod_rewrite.so` der Pfad zur Datei, relativ zum `ServerRoot`. Geladen wird also `/usr/lib/apache2/modules/mod_rewrite.so`. Geprüft wird mit `apachectl -M` (oder gezielt `apachectl -M | grep rewrite`); das Modul erscheint dort als `rewrite_module (shared)`.

### Lösung zu Aufgabe 2.

\(a\) gehört zu *prefork*: ein Prozess je Verbindung, keine Threads. (b) gehört zu *event*: Der Listener-Thread beobachtet wartende Verbindungen, die dadurch keinen Arbeits-Thread belegen. (c) gehört zu *worker*: Prozesse mit Threads, aber ein Thread bleibt für die ganze Verbindung belegt, auch während des Wartens bei Keep-Alive.

### Lösung zu Aufgabe 3.

Apache erwartet vom CGI-Programm zuerst Kopfzeilen, dann eine Leerzeile und danach den Inhalt. Fehlt der Kopf, meldet das Fehlerlog `malformed header from script '...': Bad header: Hallo`, und der Client erhält 500. Mindestens nötig ist eine Zeile `Content-Type: text/plain` und eine Leerzeile, danach darf der Text folgen.

### Lösung zu Aufgabe 4.

Der Server braucht für 100 gleichzeitige Anfragen 5 Kindprozesse zu je 20 Threads, `ServerLimit` erlaubt aber nur 3 (also höchstens 60). Es kommt eine Warnung nach dem Muster `AH00515: WARNING: MaxRequestWorkers of 100 would require 5 servers and would exceed ServerLimit of 3, decreasing to 60.`; der Test endet trotzdem mit `Syntax OK`. Damit tatsächlich 100 Anfragen gleichzeitig laufen, muss `ServerLimit` auf mindestens 5 steigen, und weil dieser Wert nur beim Start gelesen wird, braucht es einen vollständigen Neustart. Außerdem ist zu prüfen, ob der Speicher für fünf Kindprozesse reicht.

### Lösung zu Aufgabe 5.

Reihenfolge: (1) PHP-FPM installieren (`apt install php-fpm`) und den Pool prüfen (Benutzer, Socket, `pm.*`-Werte). (2) Apache vorbereiten: `a2enmod proxy proxy_fcgi`. (3) `mod_php` abschalten (`a2dismod php8.3`) und die `FilesMatch`-Regel mit `SetHandler "proxy:unix:/run/php/php8.3-fpm.sock|fcgi://localhost"` eintragen. (4) MPM wechseln: `a2dismod mpm_prefork && a2enmod mpm_event`. (5) `apache2ctl configtest`, dann `systemctl restart apache2`. Der Neustart ist nötig, weil das MPM das Gerüst des Servers bildet und nur beim vollständigen Start geladen wird. Danach prüft man mit `apache2ctl -V | grep MPM` und einem Aufruf einer PHP-Seite. Die Befehle entsprechen dem Debian-Vorgehen und wurden hier nicht mit PHP-FPM ausgeführt.

### Lösung zu Aufgabe 6.

Skript und Konfiguration:

```bash
#!/bin/bash
echo "Content-Type: text/plain"
echo
echo "Methode: $REQUEST_METHOD"
echo "Query:   $QUERY_STRING"
echo "Client:  $REMOTE_ADDR"
```

```apache
LoadModule cgid_module modules/mod_cgid.so
ScriptAlias "/cgi/" "/tmp/m4/cgi/"
<Directory "/tmp/m4/cgi">
    Require all granted
</Directory>
```

Das Skript muss mit `chmod 755` ausführbar sein. Ohne Ausführungsrecht liefert Apache 500 und schreibt `AH01241: exec of '...' failed` mit `Permission denied`, danach `End of script output before headers`. Ohne Leerzeile beziehungsweise ohne `Content-Type`-Header steht `malformed header from script ...: Bad header: ...`. Diese Meldungen wurden in der Testumgebung erzeugt. Die Abfrage `curl "localhost:8070/cgi/info.sh?x=1"` gibt die drei Zeilen aus, `Client` lautet bei lokalem Aufruf `127.0.0.1`.

### Lösung zu Aufgabe 7.

Die Konfiguration ist dieselbe wie in Einheit 4.5 (Modul `include`, `filter`, `AddType text/html .shtml`, `AddOutputFilter INCLUDES .shtml`), und im Verzeichnis gilt `Options +IncludesNOEXEC`. Die Seite enthält `<!--#include virtual="/s/fuss.html" -->`, und der Inhalt der Fußzeile erscheint in der Antwort. Eine Anweisung `<!--#exec cmd="echo x" -->` liefert bei `IncludesNOEXEC` den Text `[an error occurred while processing this directive]`, und im Fehlerlog steht `AH01371: unknown directive "exec"`. Dasselbe Verhalten erhält man, wenn kein CGI-Modul geladen ist; die Ursache unterscheidet sich, die Meldung ist gleich, weshalb man beim Suchen beide Möglichkeiten prüft.

### Lösung zu Aufgabe 8.

Konfiguration:

```apache
LoadModule filter_module     modules/mod_filter.so
LoadModule deflate_module    modules/mod_deflate.so
LoadModule substitute_module modules/mod_substitute.so
<Location "/">
    AddOutputFilterByType SUBSTITUTE text/html
    Substitute "s/Testserver/Produktion/n"
    AddOutputFilterByType DEFLATE text/html
</Location>
```

Mit `curl -s localhost:8070/f.html` sieht man den ersetzten Text, mit `curl -s -H "Accept-Encoding: gzip" -D - -o /tmp/f.gz ...` die Header `Content-Encoding: gzip` und `Vary: Accept-Encoding`; `zcat /tmp/f.gz` zeigt den ersetzten Text im Archiv. Die Reihenfolge ergibt sich aus der Kette: SUBSTITUTE muss den lesbaren Text bearbeiten, bevor DEFLATE ihn komprimiert. Käme DEFLATE zuerst, bekäme SUBSTITUTE einen binären Datenstrom, in dem das Suchmuster nicht vorkommt. (Beobachtung in der Testumgebung, mit anderen Suchbegriffen, aber derselben Kette.)

### Lösung zu Aufgabe 9.

Eine mögliche Lösung:

```bash
#!/bin/bash
# mpm-bericht.sh -- aktives MPM und Prozesszahl melden
CTL="${HTTPD_CTL:-apache2ctl}"
BIN="${HTTPD_PROC:-apache2}"
mpm=$("$CTL" -V 2>/dev/null | awk -F': *' '/Server MPM/ {print $2}')
anz=$(pgrep -c -x "$BIN" || true)
echo "MPM: ${mpm:-unbekannt}"
echo "Prozesse ($BIN): ${anz:-0}"
[ "$mpm" = "event" ] || { echo "Warnung: nicht event" >&2; exit 1; }
```

Das Skript liest die Zeile `Server MPM:     event` aus der Ausgabe von `-V` (die Zahl der Leerzeichen schluckt das Trennmuster `: *`), zählt Prozesse mit genau dem Namen und endet mit Status 1, wenn nicht `event` aktiv ist. Unter RHEL setzt man `HTTPD_CTL=apachectl` und `HTTPD_PROC=httpd`. Wichtig ist `|| true` bei `pgrep`, weil `pgrep` bei null Treffern den Status 1 liefert.

### Lösung zu Aufgabe 10.

\(a\) 503 mit `AH02454` heißt: Apache konnte keine Verbindung zum Backend aufbauen. Prüfreihenfolge: Erstens, *existiert* der Socket (`ls -l /run/php/`) und passt der Name zur installierten PHP-Version? Nach einem Umzug oder einem Versionswechsel ist das die häufigste Ursache (hier steht noch `php8.2`, installiert ist vielleicht `php8.3`). Zweitens, *läuft* der Dienst (`systemctl status php8.3-fpm`)? Drittens, *darf* der Webserverbenutzer auf den Socket zugreifen (Besitzer und Rechte, `listen.owner` und `listen.group` im Pool)? (b) Ein 404 mit `File not found.` kommt vom Backend selbst, die Verbindung steht also. Der Pfad zur Skriptdatei, den Apache übergibt, existiert aus Sicht des PHP-Dienstes nicht, etwa bei getrennten Containern oder anderem `DocumentRoot`. Man vergleicht den `DocumentRoot` in Apache und den Pfad, den der PHP-Dienst sieht, und prüft die Rechte der Datei. (c) Konfiguration siehe unten; sie gehört in den `Directory`-Block, weil sie am Speicherort wirkt und unabhängig davon gilt, über welche URL die Datei erreichbar ist.

```apache
<Directory "/var/www/shop/uploads">
    <FilesMatch "\.php[0-9]?$">
        Require all denied
    </FilesMatch>
    Options -ExecCGI
</Directory>
```

Die Regel verweigert den Zugriff auf alle Dateien mit PHP-Endung im Upload-Verzeichnis. Ergänzend sollte die Anwendung hochgeladene Dateien umbenennen und nur erlaubte Dateitypen annehmen; die Serverregel ist die letzte Sicherung, nicht die einzige. Die Zugriffsverweigerung wirkt, bevor ein Handler die Anfrage übernehmen könnte; deshalb läuft auch eine global gesetzte `SetHandler`-Regel für `.php` im Upload-Ordner ins Leere.
