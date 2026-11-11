# Modul 09 - Logging, Monitoring und Troubleshooting

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Listings unverändert, farbige Boxen als Zitatblöcke mit fettem Titel, Tabellen als Markdown-Tabellen, Übungsaufgaben und Lösungen als Absätze bzw. Überschriften). Die Lerneinheiten sind wie in der Quelle nach Modul nummeriert (9.1 bis 9.11), danach folgen „Übungsaufgaben“ (9) und „Lösungen und Erklärungen“. **Die Konfigurationen und Befehle wurden für dieses Repository nicht ausgeführt:** Laut Einleitung hat der Autor die Beispiele in einer Linux-Umgebung (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0) ausgeführt; nicht getestet sind laut Skript Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt. Viele Beispiele ändern Server-Konfiguration, Zertifikate, Rechte oder Dienste: nur in einer Testumgebung ausprobieren. Übersicht zum Modul: [README](README.md).

**Geplante Dauer:** 12 h | **Priorität:** 1 | **Lerneinheiten:** 11

## Lerneinheiten laut Lehrplan

| **Nr.** | **Lerneinheit**         | **Dauer (h)** | **Prio** |
|--------:|:------------------------|--------------:|---------:|
|     9.1 | ErrorLog                |             1 |        1 |
|     9.2 | AccessLog               |             1 |        1 |
|     9.3 | LogFormat               |           1,5 |        1 |
|     9.4 | Rotatelogs              |             1 |        1 |
|     9.5 | mod_status              |             1 |        1 |
|     9.6 | Metriken und Dashboards |           1,5 |        2 |
|     9.7 | Fehlercodes             |             1 |        2 |
|     9.8 | Incident Analyse        |             1 |        2 |
|     9.9 | JSON Logs               |             1 |        1 |
|    9.10 | stub_status             |             1 |        1 |
|    9.11 | Debug Logging           |             1 |        2 |
|         | **Summe**               |        **12** |          |

## Überblick und Lernweg

Ein Webserver, der läuft, ist noch kein beherrschter Webserver. Beherrscht ist er erst, wenn man jederzeit beantworten kann, was er gerade tut, was er in der letzten Stunde getan hat und warum er etwas nicht getan hat. Dafür gibt es drei Arten von Daten. *Logs* sind Aufzeichnungen einzelner Ereignisse: eine Anfrage, ein Fehler, eine Warnung. *Metriken* sind Zahlen über die Zeit: Anfragen pro Sekunde, offene Verbindungen, Fehlerrate. *Statusseiten* zeigen den Zustand des Servers in diesem Moment. Dieses Modul behandelt alle drei für Apache und Nginx und endet mit der Frage, wie man aus ihnen eine Störung rekonstruiert.

Die elf Einheiten gliedern sich in drei Gruppen. Die Einheiten 9.1 bis 9.4 behandeln das Protokollieren selbst: Fehlerprotokoll, Zugriffsprotokoll, Formate und Rotation. Die Einheiten 9.5, 9.6 und 9.10 behandeln Statusseiten und Metriken (`mod_status`, `stub_status`, Dashboards). Die Einheiten 9.7, 9.8, 9.9 und 9.11 behandeln die Auswertung: Fehlercodes lesen, einen Vorfall analysieren, maschinenlesbare Protokolle und das Debug-Protokoll. Die Reihenfolge im Lehrplan weicht davon ab; die Gliederung des Textes folgt dem Lehrplan, die Querverweise zeigen den Zusammenhang.

> **Merke**
>
> Alle Protokollausschnitte in diesem Modul stammen aus Testläufen mit Apache 2.4.58 und Nginx 1.24.0. Die Auswertung in Einheit 9.8 arbeitet mit einem *künstlich erzeugten* Zugriffsprotokoll (2 382 Zeilen, mit einem eingebauten Fehlerzeitraum), weil ein echter Vorfall in der Testumgebung nicht vorlag; die Zahlen sind deshalb Übungsdaten und keine Messungen eines realen Servers.

## 9.1 ErrorLog

Das *Fehlerprotokoll* ist die erste Anlaufstelle bei jeder Störung. Es enthält, was der Server selbst über seinen Zustand mitteilt: Start und Ende, Konfigurationsprobleme, abgelehnte Anfragen, Fehler beim Zugriff auf Dateien und Backends. Bei Apache legt die Direktive `ErrorLog` die Datei fest, bei Nginx die Direktive `error_log`. Beide Programme schreiben beim Start einige Zeilen, an denen man erkennt, dass die Konfiguration geladen wurde. Bei Apache sind das zum Beispiel `AH00489: Apache/2.4.58 (Ubuntu) configured -- resuming normal operations` und `AH00094: Command line: ...`; die Kennung `AHnnnnn` ist ein fester Meldungscode, mit dem man nach der Bedeutung in der Dokumentation oder im Internet suchen kann.

Eine typische Apache-Zeile aus dem Test zeigt den Aufbau:

```text
[Sat Oct 31 22:39:25.997524 2026] [auth_basic:error] [pid 20520:tid 140637249926848] [client 127.0.0.1:58508] AH01617: user anna: authentication failure for "/intern/": Password Mismatch
```

Sie enthält nacheinander die Uhrzeit, in eckigen Klammern das Modul und die Stufe (`auth_basic:error`), Prozess- und Thread-Nummer, die Adresse des Clients samt Port, die Meldungskennung und den Text. Dasselbe Ereignis bei Nginx sieht ähnlich aus, aber knapper:

```text
2026/10/31 22:38:43 [error] 20470#20470: *6 open() "/usr/share/nginx/html/nix" failed (2: No such file or directory), client: 127.0.0.1, server: , request: "GET /nix HTTP/1.1", host: "localhost:8091"
```

Hier stehen Datum, Stufe, die Nummern von Prozess und Arbeitsprozess, mit einem Stern die Verbindungsnummer (`*6`), dann die Meldung samt Systemfehler (`2: No such file or directory`) und am Ende Angaben zu Client, Anfrage und Host. Die Verbindungsnummer ist praktisch: Alle Zeilen derselben Verbindung tragen dieselbe Nummer, so dass man ein Ereignis über mehrere Meldungen verfolgen kann.

Die wichtigste Stellschraube ist die *Stufe*. Beide Server kennen eine Rangfolge von „nur das Schlimmste“ bis „alles“. Bei Apache heißt sie `emerg, alert, crit, error, warn, notice, info, debug, trace1` bis `trace8` und wird mit `LogLevel` gesetzt; bei Nginx `emerg, alert, crit, error, warn, notice, info, debug` und wird als letztes Argument von `error_log` angegeben. Eine Stufe schließt alle ernsteren ein: `warn` zeigt auch `error`. Für den Dauerbetrieb nimmt man `warn` (Apache) oder `error` beziehungsweise `warn` (Nginx); für die Fehlersuche erhöht man die Stufe zeitweise. Der Test mit `LogLevel info` bei Apache brachte eine Zeile, die vorher unsichtbar war: `[core:info] ... AH00561: Request header exceeds LimitRequestFieldSize: Foo`. Bei Nginx erschien auf `info` die Zeile `client 127.0.0.1 closed keepalive connection`, die im Normalbetrieb nur Rauschen wäre.

Apache erlaubt, die Stufe *pro Modul* zu setzen. Die Zeile `LogLevel warn rewrite:trace3` hält alles auf `warn`, schaltet aber für `mod_rewrite` die ausführliche Ablaufverfolgung ein. Im Test erschienen für jede Anfrage drei Zeilen mit `rewrite:trace2`, `trace3` und `trace1`, die zeigten, welches Muster auf welche Adresse angewandt wurde (`applying pattern '^/alt/(.*)$' to uri '/nix'`). Diese gezielte Erhöhung ist besser als ein globales `debug`, das die Datei in Minuten füllt.

Das Zeilenformat ist bei Apache veränderbar: `ErrorLogFormat` nimmt Platzhalter wie `%t` (Zeit), `%l` (Stufe), `%a` (Client-Adresse) und `%M` (Meldung). Das ist eine Randfunktion; für die meisten Betriebe genügt das Standardformat. Wichtiger ist, wohin das Protokoll geschrieben wird: Neben einer Datei kann Apache an `syslog:` liefern (`ErrorLog syslog:local7`) und Nginx an `syslog:server=...`; so landen die Meldungen in der zentralen Protokollierung des Betriebssystems. Zu Nginx gehört eine Besonderheit: Die Direktive `error_log` darf an mehreren Stellen und mehrfach stehen. Im Test schrieb Nginx gleichzeitig eine Datei mit Stufe `notice` und eine zweite mit Stufe `debug`.

### Typische Fehler.

Der erste Fehler ist, die Stufe dauerhaft auf `debug` zu lassen: Die Datei wächst schnell, die Leistung leidet, und Zugangsdaten und Cookies können im Protokoll landen. Der zweite ist, nie ins Fehlerprotokoll zu schauen, weil „es ja läuft“: Warnungen kündigen Probleme an. Der dritte ist, dem Server das Schreiben in das Verzeichnis nicht zu erlauben; dann startet Apache nicht (oder schreibt nicht), und die Fehlermeldung steht an der Konsole statt im Protokoll.

```apache
# falsch: dauerhaft alles protokollieren
LogLevel debug
# richtig: Normalbetrieb warn, nur das nötige Modul ausführlich
LogLevel warn rewrite:trace3
```

> **Praxisbeispiel: Der erste Blick nach einer Störungsmeldung**
>
> Nach einer Meldung „die Seite geht nicht“ lautet der erste Befehl `tail -n 50 /var/log/apache2/error.log` (Nginx: `/var/log/nginx/error.log`). Meist steht die Ursache in den letzten Zeilen: eine verweigerte Berechtigung, ein nicht erreichbares Backend, eine volle Platte. Die Dateipfade können je nach Distribution abweichen; `nginx -T` beziehungsweise `apachectl -S` zeigen die tatsächlichen Pfade.

## 9.2 AccessLog

Das *Zugriffsprotokoll* hält jede Anfrage fest, die der Server beantwortet hat: wer sie gestellt hat, was angefragt wurde, mit welchem Ergebnis und wie lang es dauerte. Es ist die Grundlage für Auswertungen, für die Sicherheitsanalyse und für die Frage, wie sich die Last entwickelt. Bei Apache legt `CustomLog` die Datei und das Format fest, bei Nginx `access_log`. Das Zugriffsprotokoll ist, anders als das Fehlerprotokoll, nach Zahl der Zeilen groß: jede Anfrage eine Zeile. Das bestimmt den Umgang damit (Rotation, Einheit 9.4; Speicherplatz; Datenschutz).

```apache
LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\" %D" combined_t
SetEnvIf Request_URI "^/health$" nolog
CustomLog "/var/log/apache2/access.log" combined_t env=!nolog
```

Die erste Zeile definiert ein Format mit dem Namen `combined_t` (die Einzelheiten folgen in 9.3). Die zweite setzt für Anfragen an `/health` die Umgebungsvariable `nolog`, und die dritte schreibt nur Anfragen, bei denen diese Variable *nicht* gesetzt ist (`env=!nolog`). Im Test lieferte ein Aufruf von `/health` keine Zeile in `access.log`, während drei andere Anfragen protokolliert wurden. Das ist die übliche Technik, um Gesundheitsprüfungen von Verteilern (Einheit 7.5) und Überwachungssystemen aus dem Protokoll herauszuhalten; sie machen sonst oft den größten Teil der Zeilen aus. Wichtig: Die Ausblendung gilt nur für diese eine `CustomLog`-Zeile; im Test schrieb eine zweite Zeile (JSON-Format) die Anfrage trotzdem.

Bei Nginx lautet das Gegenstück:

```nginx
map $request_uri $loggable {
    /health 0;
    default 1;
}
access_log /var/log/nginx/access.log main if=$loggable;
```

Die `map`-Anweisung (im `http`-Kontext) bildet die angefragte Adresse auf 0 oder 1 ab, und der Parameter `if=$loggable` schreibt nur, wenn der Wert nicht leer und nicht 0 ist. Auch hier zeigte der Test: `/health` fehlte im Protokoll, die übrigen Anfragen standen darin. Mit `access_log off;` schaltet man das Protokoll für einen Bereich ganz aus, etwa für statische Dateien, wenn man ihre Zeilen nicht braucht.

Ein Zugriffsprotokoll sagt mehr aus, als man auf den ersten Blick sieht. Der Statuscode zeigt, ob die Anfrage gelang. Die Dauer zeigt, wie schnell. Die Bytes zeigen, wie viel. Der `User-Agent` zeigt, welcher Browser oder welches Programm anfragte; Roboter und Angriffswerkzeuge sind oft daran zu erkennen. Der Pfad zeigt, was gesucht wurde, und deckt Angriffsversuche auf (Anfragen nach `/wp-login.php` auf einer Website ohne WordPress sind ein Klassiker). Die Client-Adresse ist ein personenbezogenes Datum; ihre Protokollierung braucht in der EU einen Zweck und eine Löschfrist (DSGVO; *keine Rechtsberatung*). Typisch sind kurze Aufbewahrungsfristen für die vollständigen Zeilen und anonymisierte Auswertungen darüber hinaus; die konkrete Frist ist eine Entscheidung der Organisation und ihrer Rechtsberatung.

Hinter einem Reverse Proxy (Modul 7) steht im Zugriffsprotokoll des *Backends* die Adresse des Proxys, solange `mod_remoteip` oder `realip` nicht eingerichtet sind. Das ist ein häufiger Grund für „alle Anfragen kommen von einer Adresse“. Im Protokoll des Proxys selbst steht dagegen die richtige Client-Adresse; für Nginx kommt zusätzlich die Backend-Information hinzu (`$upstream_addr`, siehe 9.3).

### Typische Fehler.

Der erste Fehler ist, das Zugriffsprotokoll auf der Systempartition ohne Rotation und ohne Platzüberwachung laufen zu lassen; irgendwann ist die Platte voll, und der Server kann nichts mehr schreiben. Der zweite ist, Gesundheitsprüfungen mitzuprotokollieren und damit die Statistik zu verfälschen. Der dritte ist, Zugangsdaten im Protokoll zu speichern: Parameter in der Adresse (`?token=...`) stehen in der Anfragezeile im Klartext.

```nginx
# falsch: Gesundheitsprüfungen füllen das Protokoll
access_log /var/log/nginx/access.log main;
# richtig: Prüfungen ausblenden
access_log /var/log/nginx/access.log main if=$loggable;
```

> **Praxisbeispiel: Wer war das?**
>
> Typische Fragen an das Zugriffsprotokoll: Welche Adressen haben am meisten Anfragen gestellt? Welche Pfade liefern die meisten 404? Wann stieg die Fehlerrate? Alle drei lassen sich mit `awk`, `sort` und `uniq -c` in einer Zeile beantworten (Einheit 9.8 zeigt die Befehle).

## 9.3 LogFormat

Das Format bestimmt, welche Informationen jede Protokollzeile enthält. Bei Apache beschreibt `LogFormat` das Format mit *Platzhaltern*, die mit einem Prozentzeichen beginnen; bei Nginx beschreibt `log_format` es mit *Variablen*, die mit einem Dollarzeichen beginnen. Beide Programme bringen vordefinierte Formate mit; das verbreitetste heißt `combined`. Es enthält Client, Zeit, Anfragezeile, Status, Bytes, Referer und User-Agent. Was dem `combined`-Format fehlt, ist die *Dauer*, und genau sie braucht man zur Fehlersuche. Deshalb erweitert man das Format meist um Zeitangaben.

Die wichtigsten Apache-Platzhalter: `%h` (Client-Adresse oder Hostname), `%a` (Client-IP, nach `mod_remoteip` die echte), `%t` (Zeit), `%r` (erste Zeile der Anfrage), `%m` (Methode), `%U` (Pfad ohne Abfrage), `%>s` (endgültiger Status), `%b` und `%B` (Antwortgröße in Bytes), `%D` (Dauer in Mikrosekunden), `%{Name}i` (Anfrage-Header), `%{Name}o` (Antwort-Header). Das Zeichen `>` in `%>s` bedeutet „der letzte Status nach internen Weiterleitungen“; ohne es erhielte man bei einem `ErrorDocument` den ersten statt den endgültigen Status. Der Test des oben gezeigten Formats ergab eine Zeile wie:

```text
127.0.0.1 - - [31/Oct/2026:22:38:17 +0100] "GET /nix HTTP/1.1" 404 196 "-" "curl/8.5.0" 134
```

Die letzte Zahl (134) ist die Dauer in Mikrosekunden, also gut ein zehntel Millisekunde. Die beiden Striche nach der Adresse sind die Felder `%l` (Identität per `ident`, praktisch nie gesetzt) und `%u` (angemeldeter Benutzer); ein Strich steht für „leer“. Das Referer-Feld zeigt ebenfalls einen Strich, weil `curl` keinen sendet.

Bei Nginx sieht ein erweitertes Format so aus:

```nginx
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" "$http_user_agent" '
                'rt=$request_time urt=$upstream_response_time '
                'us=$upstream_status ua=$upstream_addr';
```

Neben den Standardfeldern stehen hier vier Felder, die hinter einem Proxy Gold wert sind: `$request_time` (Gesamtdauer der Anfrage in Sekunden mit Millisekunden), `$upstream_response_time` (Dauer der Antwort des Backends), `$upstream_status` (Status des Backends) und `$upstream_addr` (welches Backend geantwortet hat). Aus dem Test:

```text
127.0.0.1 - - [31/Oct/2026:22:38:43 +0100] "GET /app/slow HTTP/1.1" 200 61 "-" "curl/8.5.0" rt=3.004 urt=3.003 us=200 ua=127.0.0.1:9002
127.0.0.1 - - [31/Oct/2026:22:38:43 +0100] "GET /nix HTTP/1.1" 404 162 "-" "curl/8.5.0" rt=0.000 urt=- us=- ua=-
```

Die erste Zeile zeigt eine Anfrage, die drei Sekunden dauerte, davon 3,003 im Backend (`b2`, Port 9002): Das Backend war langsam, nicht Nginx. Die zweite Zeile zeigt eine Anfrage, die Nginx selbst beantwortete (ein 404 aus dem Dateisystem); die Backend-Felder stehen auf `-`. Aus dem Vergleich `rt` und `urt` erkennt man, ob eine Verzögerung vor oder hinter dem Proxy liegt: Ist `rt` deutlich größer als `urt`, wartete die Anfrage auf einen langsamen Client oder im Proxy selbst.

Zwei Details sind beim Format zu beachten. Erstens das *Maskieren*: Enthält ein Feld Anführungszeichen, muss das Format sie unschädlich machen. Apache schreibt in Anführungszeichen stehende Header mit Rückstrich-Maskierung (`"Test \"quote\" Agent"`); Nginx maskiert im Standardformat als `\x22` (so im Test: `"Test \x22quote\x22 Agent"`). Zweitens die *Zeitzone und Auflösung*: `$time_local` und `%t` schreiben die Ortszeit mit Zeitzonenangabe; bei zentraler Auswertung über mehrere Länder ist die ISO-Zeit (`$time_iso8601`) eindeutiger.

### Typische Fehler.

Der erste Fehler ist, die Dauer nicht zu protokollieren, so dass man bei einer Beschwerde über Langsamkeit nichts in der Hand hat. Der zweite ist, die Einheiten zu verwechseln: Apache `%D` liefert Mikrosekunden, `%T` Sekunden, Nginx `$request_time` Sekunden mit Dezimalstellen. Der dritte ist ein Format, das zusätzliche Leerzeichen in Feldern nicht abfängt und dadurch das spätere Auswerten mit `awk` erschwert; Felder mit freiem Text stehen deshalb in Anführungszeichen.

```apache
# falsch: keine Dauer im Format
LogFormat "%h %l %u %t \"%r\" %>s %b" common
# richtig: Dauer in Mikrosekunden am Ende
LogFormat "%h %l %u %t \"%r\" %>s %b %D" common_t
```

> **Praxisbeispiel: Das Format vor der Störung ändern**
>
> Ein Format ändert man vor der Störung, nicht währenddessen: Ein Protokoll, das erst ab heute Dauer und Backend enthält, hilft bei einer Störung von gestern nicht. In Neuinstallationen gehört ein erweitertes Format zur Grundausstattung, zusammen mit einer Notiz, welche Felder es enthält, damit Auswertungsskripte nicht raten müssen.

## 9.4 Rotatelogs

Protokolle wachsen ohne Ende, Festplatten nicht. Die *Rotation* begrenzt das: Die aktuelle Datei wird in regelmäßigen Abständen oder bei einer Größe abgeschlossen, durch eine neue ersetzt, ältere werden komprimiert und nach einer Frist gelöscht. Es gibt zwei übliche Wege. Der erste ist ein vom Webserver mitgelieferter Hilfsprogramm, bei Apache `rotatelogs`, das das Protokoll über eine Pipe erhält und selbst die Dateien wechselt. Der zweite ist das allgemeine Rotationswerkzeug des Betriebssystems, `logrotate`, das bei beiden Servern verwendet wird.

Das Programm `rotatelogs` wird in `CustomLog` nach einem senkrechten Strich angegeben:

```apache
CustomLog "|/usr/bin/rotatelogs -l /var/log/apache2/zugriff-%Y%m%d-%H%M%S.log 3600" combined_t
```

Apache startet das Programm als Kindprozess und schreibt die Protokollzeilen in dessen Eingabe. Die Option `-l` verwendet die lokale Zeit für den Dateinamen, die Zahl `3600` nennt das Intervall in Sekunden (hier: stündlich), und die `%`-Angaben im Dateinamen werden wie bei `strftime` durch Datum und Uhrzeit ersetzt. Im Test entstand dabei die Datei `rot-20261031-220000.log`, die die Zeilen der laufenden Stunde enthielt. Der Vorteil der Pipe-Methode: Es braucht keinen Neustart des Servers, um die Datei zu wechseln. Die Nachteile: Das Programm läuft als zusätzlicher Prozess unter Apache, und das Komprimieren und Löschen alter Dateien übernimmt es nicht; man braucht ein zusätzliches Aufräumen, zum Beispiel einen Cron-Auftrag.

Der übliche Weg auf Linux-Servern ist daher `logrotate`. Die Paketinstallation legt dafür fertige Dateien an. Auf dem Testsystem (Ubuntu 24.04) enthält `/etc/logrotate.d/nginx` im Kern:

```text
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        invoke-rc.d nginx rotate >/dev/null 2>&1
    endscript
}
```

Die Datei bedeutet: täglich rotieren, 14 Rotationen aufbewahren, ältere komprimieren (die jüngste noch nicht, `delaycompress`), nicht rotieren, wenn die Datei leer ist, die neue Datei mit Rechten `0640` für Benutzer `www-data` und Gruppe `adm` anlegen und nach dem Umbenennen den Server benachrichtigen. Dieser letzte Schritt ist entscheidend. Der Server hält die Protokolldatei offen und schreibt weiter in die *alte* Datei, auch nachdem sie umbenannt wurde, weil er mit dem Dateinamen nichts zu tun hat, sondern mit der offenen Datei. Das zeigte der Test: Nach `mv access.log al2` ohne weitere Maßnahme landete die nächste Anfrage in `al2`. Erst `nginx -s reopen` (Befehl, der das Signal `USR1` auslöst) ließ Nginx die Dateien neu öffnen; danach schrieb er in die neue `access.log`. Bei Apache führt das Rotationsskript stattdessen einen sanften Neustart aus (`invoke-rc.d apache2 reload` in `/etc/logrotate.d/apache2`), der die Dateien ebenfalls neu öffnet.

Die Rotation wirft zwei Fragen auf, die man bewusst beantworten sollte. Die erste lautet: Wie lange bewahrt man auf? Technische Gründe (Fehlersuche) sprechen für einige Wochen, rechtliche und datenschutzrechtliche für eine festgelegte Obergrenze (keine Rechtsberatung); die Zahl in `rotate 14` sollte aus dieser Entscheidung stammen und nicht aus der Voreinstellung. Die zweite lautet: Wohin gehen die Dateien? Auf dem Server selbst sind sie bei einem Einbruch oder Plattenausfall mit verloren; in größeren Umgebungen leitet man die Protokolle zusätzlich an eine zentrale Stelle weiter.

### Typische Fehler.

Der erste Fehler ist eine Rotation ohne Benachrichtigung des Servers: Das Skript benennt um, der Server schreibt weiter in die umbenannte Datei, und die neue bleibt leer. Der zweite ist falsche Besitzer-Rechte an der neuen Datei, so dass der Server nicht mehr schreiben kann. Der dritte ist eine zu kurze Aufbewahrung, die genau dann endet, wenn man einen Vorfall von vor drei Wochen untersuchen will.

```bash
# falsch: Datei verschieben, Server schreibt weiter in die alte
mv /var/log/nginx/access.log /var/log/nginx/access.log.1
# richtig: verschieben und Dateien neu öffnen lassen
mv /var/log/nginx/access.log /var/log/nginx/access.log.1
nginx -s reopen
```

> **Praxisbeispiel: Die volle Platte um drei Uhr**
>
> Der Klassiker: Ein Zugriffsprotokoll wächst unbemerkt auf mehrere Gigabyte und füllt die Systempartition. Der Server meldet dann Fehler beim Schreiben, Anmeldungen und Datenbanken fallen mit aus. Eine Rotation mit Aufbewahrungsgrenze und eine Überwachung des freien Platzes verhindern das. Erster Handgriff im Notfall: Mit `du -sh /var/log/*` die größten Dateien finden.

## 9.5 mod_status

Das Modul `mod_status` liefert eine Seite, die den *aktuellen* Zustand von Apache zeigt: wie viele Arbeiter beschäftigt sind, was sie gerade tun und wie viele Anfragen seit dem Start bearbeitet wurden. Man bindet es mit einem `Location`-Block ein, der den Handler `server-status` setzt, und schützt ihn unbedingt:

```apache
LoadModule status_module modules/mod_status.so
ExtendedStatus On
<Location "/server-status">
    SetHandler server-status
    Require local
</Location>
```

`Require local` lässt nur Anfragen vom Rechner selbst zu (Modul `mod_authz_host` muss geladen sein). `ExtendedStatus On` liefert zusätzliche Zahlen, zum Beispiel pro Anfrage die Dauer und die Gesamtzahl der übertragenen Bytes; es kostet etwas Rechenzeit. Ein Aufruf von `curl http://localhost/server-status?auto` liefert eine maschinenlesbare Fassung. Ein Ausschnitt aus dem Test:

```text
ServerVersion: Apache/2.4.58 (Ubuntu)
ServerMPM: event
ServerUptimeSeconds: 1
Total Accesses: 4
BusyWorkers: 1
IdleWorkers: 74
Processes: 3
ConnsTotal: 0
Scoreboard: ____________________________________________________W______________________......
```

Die Felder sind teils selbsterklärend. `BusyWorkers` sind die Arbeiter (beim Event-MPM: Threads), die gerade eine Anfrage bearbeiten, `IdleWorkers` die freien; ihre Summe ist die Kapazität. Der Wert `Processes: 3` heißt, dass drei Kindprozesse laufen; zusammen bieten sie 75 Arbeiter (hier 74 frei und 1 beschäftigt). Das *Scoreboard* ist eine Bildzeile mit einem Zeichen je Arbeiter: `_` steht für wartend, `W` für „sendet gerade eine Antwort“ (in der Zeile genau die Anfrage, die den Status abfragt), `.` für einen freien Platz, den der Server bei Bedarf nutzen kann. Ist die Zeile voller `W` und `R` (lesen) und enthält keine `_` und `.` mehr, ist der Server ausgelastet. Das ist die zentrale Beobachtung für die Frage, ob `MaxRequestWorkers` (Modul 4, Modul 11) zu klein ist.

Die HTML-Fassung ohne `?auto` zeigt zusätzlich eine Tabelle der laufenden Anfragen mit Client-Adresse, virtuellem Host und angefragter Adresse. Genau deshalb ist die Seite ein Sicherheitsthema: Sie gibt Einblick in fremde Anfragen, Adressen und Pfade und verrät Aufbau und Auslastung des Servers. Sie gehört nie ohne Zugriffsbeschränkung ins Netz, und die Beschränkung `Require local` ist die strengste sinnvolle. Ein Überwachungssystem auf einem anderen Rechner bekommt eine eigene Freigabe für seine Adresse (`Require ip 10.0.0.5`). Die Prüfung ist einfach: Von einem fremden Rechner aus darf die Adresse nicht mit `200` antworten.

### Typische Fehler.

Der erste Fehler ist die Seite für alle offen zu lassen. Der zweite ist, das Modul zu laden, aber den `Location`-Block zu vergessen; dann gibt es keine Seite (Status 404). Der dritte ist ein Rewrite oder Proxy, der die Anfrage an `/server-status` abfängt, bevor sie den Handler erreicht; man schließt den Pfad dann mit `ProxyPass "/server-status" "!"` (Einheit 7.2) aus.

```apache
# falsch: Status für alle lesbar
<Location "/server-status">
    SetHandler server-status
</Location>
# richtig: nur lokal
<Location "/server-status">
    SetHandler server-status
    Require local
</Location>
```

> **Praxisbeispiel: Der Auslastungs-Check**
>
> Bei der Frage „ist Apache am Limit?“ ruft man `curl -s localhost/server-status?auto | grep -E 'BusyWorkers|IdleWorkers'` auf. Sind die freien Arbeiter dauerhaft nahe null, ist die Kapazität erschöpft; das Zugriffsprotokoll (Dauer) zeigt, ob die Anwendung langsam ist, oder ob schlicht zu viele Anfragen eintreffen.

## 9.6 Metriken und Dashboards

Ein Protokoll beantwortet Fragen zu *einzelnen* Anfragen. Wer wissen will, ob der Server *insgesamt* gesund ist, braucht Zahlen über die Zeit: *Metriken*. Eine Metrik ist ein Messwert mit Zeitstempel, zum Beispiel „412 Anfragen pro Sekunde um 14:03:10“. Ein Überwachungssystem sammelt solche Werte regelmäßig ein, speichert sie und stellt sie in einem *Dashboard* als Kurven dar. Man erkennt Trends (die Last wächst), Spitzen (Aktion im Onlineshop), Brüche (um 14:03 stieg die Fehlerrate) und kann *Alarme* formulieren (Fehlerrate über fünf Prozent seit fünf Minuten).

Welche Metriken sind wichtig? Eine bewährte Faustregel für Webdienste sind drei Größen, die im Englischen als *RED* bekannt sind: *Rate* (Anfragen pro Sekunde), *Errors* (Anteil fehlerhafter Antworten) und *Duration* (Antwortzeit). Sie ähneln den „vier goldenen Signalen“ der Betriebsliteratur, die zusätzlich die Sättigung nennen (wie voll sind die Arbeiter, die Verbindungen, die Platte). Ich nenne beide Konzepte nach dem Kenntnisstand des Autors; abgerufen habe ich dazu keine Quelle. Für einen Webserver entsprechen sie: Anfragen pro Sekunde, Anteil der 5xx-Antworten, Antwortzeit (nicht als Mittelwert, sondern als Perzentil) und Auslastung der Arbeiter oder Verbindungen.

Das Perzentil verdient eine Erklärung, weil der Mittelwert bei Antwortzeiten täuscht. Das 95. Perzentil (p95) ist der Wert, unter dem 95 Prozent aller Anfragen liegen; der Rest ist langsamer. Wenn wenige Anfragen sehr lang dauern, verschwinden sie im Mittelwert, werden aber von den betroffenen Besuchern bemerkt. Das Zugriffsprotokoll mit Dauer (Einheit 9.3) genügt, um Perzentile zu berechnen. Mit dem künstlichen Protokoll aus Einheit 9.8 (2 382 Anfragen):

```bash
awk '{split($NF,a,"="); print a[2]}' access.log | sort -n | awk '{v[NR]=$1} END{
  printf "n=%d p50=%s p95=%s p99=%s max=%s\n", NR, v[int(NR*0.5)], v[int(NR*0.95)], v[int(NR*0.99)], v[NR]}'
```

Der erste `awk`-Aufruf schneidet aus dem letzten Feld (`rt=0.062`) die Zahl heraus, `sort -n` ordnet sie, und der zweite `awk`-Aufruf liest die Werte in ein Feld und gibt die Werte an den Positionen 50, 95 und 99 Prozent aus. Das Ergebnis der Übungsdaten: `n=2382 p50=0.062 p95=0.119 p99=2.526 max=2.996`. Der Median beträgt 62 Millisekunden, das 99. Perzentil aber über 2,5 Sekunden; wenige Anfragen sind sehr langsam, genau das Bild eines Fehlers, den man im Mittelwert nicht sähe. (Die Daten sind künstlich erzeugt; der Fehlerzeitraum ist eingebaut.)

Woher kommen Metriken bei Apache und Nginx? Es gibt drei Quellen. Erstens die *Statusseiten* (`mod_status`, `stub_status`), die Zähler und den Zustand liefern; sie sind klein und billig. Zweitens die *Protokolle*, aus denen man Raten, Fehleranteile und Antwortzeiten ableiten kann; das ist aufwendiger, aber liefert Details, die die Statusseiten nicht kennen (Pfade, Backends). Drittens *Exporter*: kleine Programme, die eine Statusseite abfragen und ihre Werte in dem Format anbieten, das ein Überwachungssystem erwartet.

> **Ergänzung aus der Nachrecherche: Nginx-Exporter für Prometheus**
>
> Das Projekt *nginx-prometheus-exporter* liest nach seiner Beschreibung bei Nginx Open Source die Seite `stub_status` (Pfad `/stub_status` auf Port 8080 erwartet) und bei NGINX Plus die API. Es bietet die Werte standardmäßig auf Port 9113 unter `/metrics` an; ein Beispiel für einen Messwert ist `nginx_connections_active` (aktive Verbindungen). Prometheus fragt diese Adresse regelmäßig ab, und ein Dashboardwerkzeug wie Grafana stellt die Kurven dar. Für Apache gibt es nach meinem Kenntnisstand einen entsprechenden Exporter, der `server-status?auto` liest; ihn habe ich nicht abgerufen. Quelle: README des Projekts (siehe Quellenverzeichnis). Die Exporter wurden in der Testumgebung nicht ausgeführt.

Ein gutes Dashboard beantwortet die Frage „Geht es dem Dienst gut?“ auf einen Blick: Anfragen pro Sekunde und Fehleranteil oben, Antwortzeit (p50 und p95 als zwei Kurven), Auslastung (beschäftigte Arbeiter oder aktive Verbindungen) darunter. Weniger ist mehr; ein Dashboard mit vierzig Kurven wird nicht angesehen. Alarme gehören auf Symptome, die Besucher spüren (Fehlerrate, Antwortzeit), und seltener auf Ursachen (CPU-Auslastung allein); ein Alarm, der nachts weckt, muss einen Grund haben, etwas zu tun.

### Typische Fehler.

Der erste Fehler ist, nur Mittelwerte zu betrachten; Perzentile zeigen die langsamen Anfragen. Der zweite ist, die Statusseite für den Exporter öffentlich zu machen, statt sie auf die Adresse des Exporters zu beschränken. Der dritte sind Alarme ohne Schwelle und Dauer, die bei jedem kurzen Ausreißer auslösen und bald ignoriert werden.

```bash
# falsch: nur der Mittelwert der Antwortzeit
awk '{split($NF,a,"="); s+=a[2]} END{print s/NR}' access.log
# richtig: Perzentile ansehen (siehe oben), mindestens p95 und p99
```

> **Praxisbeispiel: Erst messen, dann tunen**
>
> Bevor man `MaxRequestWorkers` oder `worker_connections` ändert (Modul 11), braucht man Messwerte vor und nach der Änderung. Ein Dashboard mit Auslastung und Antwortzeit ist die Voraussetzung dafür, eine Änderung als Verbesserung zu beurteilen und nicht nur zu hoffen.

## 9.7 Fehlercodes

Jede Antwort trägt einen dreistelligen Statuscode. Die erste Ziffer nennt die Klasse: `2xx` Erfolg, `3xx` Weiterleitung oder „nicht geändert“, `4xx` Fehler des *Clients* (die Anfrage ist falsch oder nicht erlaubt), `5xx` Fehler des *Servers* (die Anfrage war in Ordnung, die Bearbeitung scheiterte). Diese Unterscheidung steuert die Fehlersuche: Bei 4xx schaut man auf die Anfrage und die Zugriffsregeln, bei 5xx auf Server und Backends. Wer ein Zugriffsprotokoll auswertet, beginnt mit der Verteilung der Klassen. Die folgende Tabelle fasst die Codes zusammen, die im Betrieb am häufigsten auftreten; die mit „T“ markierten wurden in den Tests dieses Kurses erzeugt.

| **Code** | **Name**              | **T** | **Typische Ursache**                                                        |
|:---------|:----------------------|:-----:|:----------------------------------------------------------------------------|
| 301/302  | Weiterleitung         |   T   | Umleitung per `Redirect` oder `return`; Backend-Weiterleitung (Einheit 7.3) |
| 304      | Not Modified          |       | Browser-Cache gültig (Modul 5)                                              |
| 400      | Bad Request           |   T   | Fehlerhafte Anfrage, zu lange Header                                        |
| 401      | Unauthorized          |   T   | Anmeldung fehlt oder falsch (Modul 10)                                      |
| 403      | Forbidden             |   T   | Zugriffsregel, fehlende Dateirechte                                         |
| 404      | Not Found             |   T   | Datei oder Pfad existiert nicht                                             |
| 405      | Method Not Allowed    |   T   | Methode gesperrt (zum Beispiel `TRACE`)                                   |
| 413      | Content Too Large     |   T   | Körper über dem Limit (`LimitRequestBody`, `client_max_body_size`)                                |
| 414      | URI Too Long          |   T   | Adresse zu lang                                                             |
| 429      | Too Many Requests     |   T   | Ratenbegrenzung (Nginx `limit_req`)                                           |
| 499      | (nur Nginx)           |   T   | Client hat vor der Antwort aufgelegt                                        |
| 500      | Internal Server Error |       | Anwendungsfehler, Konfigurationsfehler                                      |
| 502      | Bad Gateway           |   T   | Nginx: Backend nicht erreichbar; Apache: Backend antwortet falsch/zu spät   |
| 503      | Service Unavailable   |   T   | Apache: Backend nicht erreichbar; Überlast                                  |
| 504      | Gateway Timeout       |   T   | Nginx: Backend zu langsam                                                   |

Einige davon verdienen Erläuterungen. `499` ist kein offizieller HTTP-Code, sondern eine Erfindung von Nginx für das Zugriffsprotokoll: Der Client hat die Verbindung geschlossen, bevor Nginx antworten konnte. Im Test erzeugte `curl --max-time 1` gegen eine drei Sekunden dauernde Seite die Zeile `"GET /app/slow HTTP/1.1" 499 0`. Viele 499 sind ein Hinweis darauf, dass Besucher ungeduldig abbrechen, weil die Seite zu langsam ist. `403` und `404` haben bei Apache und Nginx verschiedene Ursachen, die das Fehlerprotokoll nennt: `AH01630: client denied by server configuration` (Zugriffsregel) beziehungsweise `open() ... failed (2: No such file or directory)`. Die Codes `502`, `503` und `504` haben bei beiden Servern verschiedene Bedeutungen, wie Einheit 7.2 und 7.12 gezeigt haben: Bei Apache bedeutet 503 „Backend nicht erreichbar“ und 502 „Zeitüberschreitung oder falsche Antwort“, bei Nginx bedeutet 502 „nicht erreichbar“ und 504 „Zeitüberschreitung“. In einem Betrieb mit beiden Servern muss die Überwachung diese Abweichung kennen.

Fehlerseiten lassen sich anpassen. Apache verwendet `ErrorDocument 404 /fehler/404.html`, Nginx `error_page 404 /fehler/404.html;`. Zwei Hinweise: Die Seiten sollten statisch sein und keine technischen Details verraten (Servername, Version, Pfade), und sie sollten den *richtigen* Statuscode behalten; eine Fehlerseite, die mit 200 ausgeliefert wird, verwirrt Suchmaschinen und Überwachungssysteme („Soft 404“). Der Test zeigte die Standardseiten: Apache fügt je nach `ServerSignature` eine Zeile mit Servername und Version an (Modul 10); Nginx zeigt in der Standardseite eine Zeile mit Namen und, wenn `server_tokens` nicht ausgeschaltet ist, der Version.

### Typische Fehler.

Der erste Fehler ist, jeden 5xx für einen Fehler des Webservers zu halten; in der Mehrzahl der Fälle liegt die Ursache beim Backend. Der zweite ist, 4xx zu ignorieren: Ein plötzlicher Anstieg von 404 oder 401 kann einen Angriff oder einen defekten Link anzeigen. Der dritte ist, Fehlerseiten so zu bauen, dass sie selbst einen Fehler erzeugen (zum Beispiel die Fehlerseite liegt hinter derselben Anmeldung).

```nginx
# falsch: Fehlerseite mit Status 200 (Soft 404)
error_page 404 =200 /fehler/404.html;
# richtig: Status bleibt 404
error_page 404 /fehler/404.html;
```

> **Praxisbeispiel: Die Statusverteilung als Pulsmesser**
>
> Eine Zeile genügt für den ersten Überblick: `awk '{print $9}' access.log | sort | uniq -c | sort -rn`. Ein normaler Betrieb zeigt viele 200, einige 304 und wenige 404. Taucht plötzlich ein großer Anteil 502 oder 5xx auf, hat man den Zeitpunkt und die Richtung (Einheit 9.8).

## 9.8 Incident Analyse

Ein *Incident* ist eine Störung, die Besucher bemerken oder bemerken könnten. Die *Incident-Analyse* ist das geordnete Vorgehen, um Umfang und Ursache zu klären und daraus zu lernen. Der häufigste Fehler dabei ist Hektik: Man ändert Dinge, ohne zu wissen, was kaputt ist, und vernichtet dabei Spuren. Eine feste Reihenfolge hilft. Erstens: *Umfang* bestimmen (wer ist betroffen, seit wann, welche Seiten). Zweitens: *Zeitverlauf* aus den Protokollen rekonstruieren (wann begann es, wann endete es, was änderte sich zu dem Zeitpunkt). Drittens: *Hypothese* bilden und mit Belegen prüfen. Viertens: *Gegenmaßnahme* ergreifen und beobachten, ob sie wirkt. Fünftens: *Nachbereitung*, um Wiederholung zu vermeiden.

Die Methode wird an Übungsdaten vorgeführt: einem künstlich erzeugten Zugriffsprotokoll mit 2 382 Zeilen von zehn Minuten (14:00 bis 14:10) im Format aus Einheit 9.3. Die Aufgabe lautet: „Gegen 14:03 beschwerten sich Kunden über Fehler bei der Anmeldung.“ Der erste Schritt ist die Verteilung der Statuscodes:

```bash
awk '{print $9}' access.log | sort | uniq -c | sort -rn
```

Die Ausgabe: 2 129 Antworten mit `200`, 226 mit `502`, 20 mit `404` und 7 mit `401`. Die 502 fallen auf, denn sie gehören nicht zum Normalbetrieb. Der zweite Schritt klärt den Zeitverlauf, indem die 502 nach Minuten gezählt werden:

```bash
awk '$9==502{split($4,a,":"); print a[2]":"a[3]}' access.log | sort | uniq -c
```

Das Feld `$4` enthält die Zeit (`[31/Oct/2026:14:03:21`); `split` zerlegt es an den Doppelpunkten, und Stunde und Minute werden zu einem Schlüssel verbunden. Ergebnis: 58 Fehler in Minute 14:03, 55 in 14:04, 52 in 14:05, 60 in 14:06 und einer in 14:07. Die Störung begann also um 14:03 und endete vor 14:07; die Dauer ist damit eingegrenzt. Der dritte Schritt fragt, welche Pfade betroffen waren:

```bash
awk '$9==502{print $7}' access.log | sort | uniq -c | sort -rn
```

Das Ergebnis nennt `/api/items` (119) und `/api/login` (107), aber keine statischen Dateien und keine Startseite. Das grenzt die Ursache ein: Betroffen ist offenbar der Teil, der zum Anwendungs-Backend weitergeleitet wird; statische Inhalte, die der Server selbst ausliefert, liefen fehlerfrei. Zusammen mit dem Wissen aus Modul 7 (ein 502 bei Nginx bedeutet, dass das Backend nicht erreichbar war oder falsch antwortete) lautet die Hypothese: Das API-Backend war von 14:03 bis 14:07 nicht verfügbar. Zur Prüfung zieht man das Fehlerprotokoll heran und sucht dort nach Verbindungsfehlern zum Backend (`connect() failed (111: Connection refused)`) im selben Zeitraum, und man fragt das Betriebssystem, ob der Backend-Prozess in diesem Zeitraum neu gestartet wurde (Zeitpunkte aus dem Dienst-Journal). Dieser Schritt ist an den Übungsdaten nicht möglich, weil es nur das Zugriffsprotokoll gibt; auch das gehört zur ehrlichen Lehre: Ein Beleg aus einer einzigen Quelle ist eine Hypothese, noch keine Ursache.

Ein weiteres Muster in den Daten betrifft die Sicherheit. Der Befehl `awk '$9==401{print $1}' access.log | sort | uniq -c` zeigt sieben Fehlschläge der Anmeldung, alle von der Adresse `203.0.113.9`. Eine einzelne Adresse mit wiederholten 401 auf `/api/login` kann ein Passwort-Raten sein (*Brute Force*); in den Übungsdaten sind es nur sieben über zehn Minuten, also unauffällig, aber das Verfahren ist dasselbe, das man bei einem Verdacht anwendet. Die Gegenmaßnahme ist Ratenbegrenzung (Modul 10).

Nach der Störung schreibt man eine *Nachbetrachtung* (Postmortem): Was geschah (Zeitleiste), wie wurde es bemerkt, was war die Ursache, was hat geholfen, was ändern wir? Wichtig ist eine fehlerfreundliche Haltung (*blameless*): Man fragt, welche Lücken im System den Fehler möglich machten, nicht, wer ihn gemacht hat. Typische Verbesserungen sind ein Alarm, der die Störung früher gemeldet hätte, eine Gesundheitsprüfung (Einheit 7.5) oder ein zweites Backend (Modul 8).

### Typische Fehler.

Der erste Fehler ist, vor der Analyse zu ändern: Neustarts löschen Zustand, und ohne Spuren bleibt die Ursache ungeklärt. Der zweite ist, aus einer einzigen Beobachtung zu schließen. Der dritte ist, die Protokolle nicht rechtzeitig zu sichern: Bei einer Störung gehört eine Kopie der betroffenen Protokolle in einen separaten Ordner, bevor die Rotation sie löscht.

```bash
# falsch: Neustart zuerst, Protokolle danach
systemctl restart nginx
# richtig: erst sichern, dann handeln
cp -a /var/log/nginx /root/incident-2026-10-31
tail -n 200 /var/log/nginx/error.log
```

> **Praxisbeispiel: Das Runbook**
>
> Teams halten für wiederkehrende Störungen ein *Runbook* bereit: eine kurze Anleitung mit den Befehlen aus diesem Abschnitt, in der Reihenfolge Umfang, Zeitverlauf, Pfade, Ursache. Wer nachts alarmiert wird, folgt der Liste, statt zu improvisieren. Die Befehle aus Einheit 9.8 sind der Kern eines solchen Runbooks für Weblogs.

## 9.9 JSON Logs

Klassische Protokollzeilen sind für Menschen lesbar und für Programme mühsam: Wer ein Feld sucht, muss die Zeile an Leerzeichen und Anführungszeichen zerlegen, und jede Änderung des Formats bricht die Auswertung. *JSON-Protokolle* schreiben jede Anfrage als ein JSON-Objekt in eine Zeile. Die Felder haben Namen, die Reihenfolge ist egal, neue Felder stören bestehende Auswertungen nicht, und Werkzeuge für zentrale Protokollsammlungen lesen JSON direkt. Der Preis: Die Zeilen sind länger und für Menschen schlechter lesbar; mit dem Werkzeug `jq` gleicht man das aus.

Nginx bringt dafür eine Option mit, die Zeichen in den Werten JSON-gerecht maskiert:

```nginx
log_format json escape=json
  '{"zeit":"$time_iso8601","ip":"$remote_addr","methode":"$request_method",'
  '"pfad":"$uri","status":$status,"bytes":$body_bytes_sent,'
  '"rt":"$request_time","urt":"$upstream_response_time","ua":"$http_user_agent"}';
access_log /var/log/nginx/access.json json buffer=4k flush=1s;
```

Das Format `json` nutzt `escape=json`, so dass Anführungszeichen, Rückstriche und Steuerzeichen in Werten korrekt maskiert werden. Der Parameter `buffer=4k flush=1s` puffert das Schreiben und entlastet die Platte; die Zeilen erscheinen dann bis zu eine Sekunde später (im Test wurde nach zwei Sekunden gelesen). Die Zahlenfelder (`status`, `bytes`) stehen ohne Anführungszeichen, die Zeitfelder als Text, weil `$upstream_response_time` bei Anfragen ohne Backend leer ist und als Zahl ein ungültiges JSON ergäbe (im Test `"urt":""`). Ein Test mit dem User-Agent `Test "quote" Agent` ergab `"ua":"Test \"quote\" Agent"` und mit einem Umlaut im User-Agent weiterhin gültiges JSON.

Bei Apache gibt es keine solche Option. Das Format entsteht von Hand mit `LogFormat`, und das hat zwei Fallstricke, die im Test sichtbar wurden:

```apache
LogFormat "{\"zeit\":\"%{%Y-%m-%dT%H:%M:%S%z}t\",\"ip\":\"%a\",\"methode\":\"%m\",\"pfad\":\"%U\",\"status\":%>s,\"bytes\":%B,\"dauer_us\":%D,\"ua\":\"%{User-Agent}i\"}" json
CustomLog "/var/log/apache2/access.json" json
```

Der erste Fallstrick: Apache maskiert Zeichen in Anfrage-Headern im C-Stil. Anführungszeichen werden zu `\"`, das ist gültiges JSON. Nicht-ASCII-Zeichen werden aber als `\xC3\xAB` geschrieben, und `\x` ist in JSON keine gültige Maskierung. Im Test ergab der User-Agent „Tëst“ die Zeile `"ua":"T\xc3\xabst"`, und `jq` brach mit `Invalid escape` ab. Ein einziger Besucher mit Umlaut im Header kann so eine ganze Auswertung zum Absturz bringen. Der zweite Fallstrick: Der Platzhalter `%b` schreibt bei einer Antwort ohne Inhalt einen Strich (`"bytes":-`), was als Zahl ungültig ist; im Test tat das eine `HEAD`-Anfrage. Deshalb steht im Beispiel `%B`, das in diesem Fall `0` liefert. Gegen den ersten Fallstrick hilft, den Header-Wert nicht ins Protokoll aufzunehmen, ihn vor dem Einlesen zu bereinigen (die Sammelwerkzeuge können das) oder die Protokollzeilen mit einem Werkzeug zu lesen, das ungültige Maskierungen toleriert. Ein Apache-Modul für JSON-Protokolle habe ich nicht getestet.

Mit `jq` wertet man die Dateien komfortabel aus. Auf der Nginx-Datei aus dem Test: `jq -s 'group_by(.status) | map({status: .[0].status, n: length})' -c access.json` ergab `[{"status":200,"n":6},{"status":404,"n":3}]`. Ein Filter für alle Fehler lautet `jq -r 'select(.status>=400) | "\(.status) \(.pfad)"' access.json`; er erzeugte auf der Apache-Datei im Test unter anderem die Zeilen `404 /nix` und `404 /health`, brach danach aber an der Zeile mit dem Umlaut mit `Invalid escape` ab.

### Typische Fehler.

Der erste Fehler ist, in Nginx `escape=json` zu vergessen; dann maskiert das Standardverfahren mit `\x22`, und das Ergebnis ist kein gültiges JSON. Der zweite ist, leere Werte als Zahlen auszugeben. Der dritte ist, Pfade mit Abfrageparametern zu protokollieren, in denen Zugangsdaten stehen können; `$uri` bei Nginx und `%U` bei Apache enthalten die Abfrage nicht, `$request_uri` und `%r` dagegen schon.

```nginx
# falsch: ohne escape=json bricht ein Anführungszeichen im User-Agent das JSON
log_format json '{"ua":"$http_user_agent"}';
# richtig
log_format json escape=json '{"ua":"$http_user_agent"}';
```

> **Praxisbeispiel: Zentrale Protokollsammlung**
>
> Sobald mehrere Server vorhanden sind, schickt man die Protokolle an eine zentrale Stelle (ein Sammelsystem, das sie durchsuchbar macht). JSON erspart dort das Schreiben von Zerlegungsregeln. Eine Anfrage lässt sich über Server hinweg verfolgen, wenn sie eine Kennung trägt, die der Proxy erzeugt und weitergibt (zum Beispiel `$request_id` bei Nginx, im Format und im Backend-Header mitgegeben).

## 9.10 stub_status

Die Seite `stub_status` ist das Nginx-Gegenstück zu `mod_status`, aber sehr viel schlichter. Sie liefert vier Zähler und drei Zustände als Text. Das Modul `ngx_http_stub_status_module` muss einkompiliert sein; auf dem Testsystem war es das (`--with-http_stub_status_module`). Man schaltet die Seite in einer Location ein und schützt sie:

```nginx
location /stat {
    stub_status;
    allow 127.0.0.1;
    deny all;
}
```

Die Direktive `stub_status;` macht die Location zur Statusseite, `allow` und `deny` beschränken den Zugriff auf den eigenen Rechner (Einheit 10.3). Die Antwort aus dem Test:

```text
Active connections: 1
server accepts handled requests
 5 5 5
Reading: 0 Writing: 1 Waiting: 0
```

Die Bedeutung: `Active connections` sind alle aktuell offenen Client-Verbindungen (einschließlich wartender). In der Zeile darunter stehen drei Zähler seit dem Start: `accepts` (angenommene Verbindungen), `handled` (bearbeitete Verbindungen) und `requests` (Anfragen insgesamt). Normalerweise sind `accepts` und `handled` gleich; ist `handled` kleiner, hat Nginx Verbindungen wegen eines Limits (zum Beispiel `worker_connections`, Modul 11) abgewiesen, und das ist ein Alarmzeichen. Das Verhältnis `requests` zu `handled` sagt, wie viele Anfragen im Mittel pro Verbindung ankommen (Keep-Alive). Die letzte Zeile gliedert die aktiven Verbindungen: `Reading` (Nginx liest gerade eine Anfrage), `Writing` (Nginx schreibt gerade eine Antwort; die abfragende Anfrage zählt selbst mit) und `Waiting` (Keep-Alive-Verbindungen ohne laufende Anfrage).

Die Zähler sind *kumulativ*: Sie wachsen seit dem Start nur an. Aussagekräftig wird die Seite deshalb erst, wenn ein Überwachungssystem sie regelmäßig abfragt und die Differenz zwischen zwei Messungen bildet (Anfragen pro Sekunde). Dafür dient der Exporter aus Einheit 9.6. Die Seite ist bewusst klein; Details pro Anfrage oder pro Backend liefert sie nicht, wie sie bei `mod_status` in der erweiterten Fassung stehen. Reicht das nicht, bleibt das Zugriffsprotokoll mit Dauer und Backend-Feldern (9.3), oder bei NGINX Plus die kostenpflichtige API.

Die Absicherung ist die Hauptsache. Die Seite enthält keine Anfragedetails, sie verrät aber Auslastung und Verkehrsmenge, was Angreifern bei der Wahl des Zeitpunkts hilft. Das Ziel lautet nach dem Lehrplan: „nur intern oder streng geschützt bereitstellen“. Konkret: `allow 127.0.0.1; deny all;` oder ein eigener `server`-Block, der nur auf einer internen Adresse lauscht (`listen 127.0.0.1:8080;`), so dass die Seite nie von außen erreichbar ist, auch wenn eine Regel fehlerhaft ist.

### Typische Fehler.

Der erste Fehler ist, die Seite ohne `allow`/`deny` zu veröffentlichen. Der zweite ist ein `location`-Block, den eine andere, allgemeinere Location (zum Beispiel eine `proxy_pass`-Regel für `/`) verdeckt; der Pfad wird dann ans Backend weitergegeben. Der dritte ist, die Kumulativwerte direkt als „Last“ zu lesen.

```nginx
# falsch: Statusseite für alle
location /stat { stub_status; }
# richtig: nur intern erreichbar
server {
    listen 127.0.0.1:8080;
    location /stub_status { stub_status; }
}
```

> **Praxisbeispiel: Warnsignal Verbindungsabweisung**
>
> Das Paar `accepts` und `handled` ist die einfachste Überwachung von Nginx: Sind sie nicht gleich, werden Verbindungen verworfen. Ein Überwachungssystem kann diese Differenz als Alarm führen; sie braucht keinen Zugriff auf Protokolle.

## 9.11 Debug Logging

Wenn Fehlerprotokoll und Zugriffsprotokoll nicht erklären, warum etwas geschieht, bleibt das *Debug-Protokoll*: Der Server schreibt jeden internen Schritt. Das ist ein Werkzeug für die gezielte Untersuchung, nie für den Dauerbetrieb. Bei Nginx setzt man die Stufe `debug` im `error_log`; das setzt voraus, dass Nginx mit `--with-debug` gebaut wurde. Auf dem Testsystem war das der Fall (Anzeige mit `nginx -V`); bei Paketen anderer Hersteller kann es fehlen, dann gibt es oft ein eigenes Paket oder eine eigene Datei (`nginx-debug`).

```nginx
error_log /var/log/nginx/error.log notice;
error_log /var/log/nginx/debug.log debug;
```

Zwei Zeilen reichen: Das Fehlerprotokoll bleibt auf `notice`, und zusätzlich entsteht eine eigene Datei mit allen Einzelheiten. Im Test erzeugte *eine* einzige Anfrage 90 Zeilen, zum Beispiel `http request line: "GET /debugme HTTP/1.1"`, je eine Zeile pro Header, `http header done` und Zeilen wie `rewrite phase: 1`, die die Bearbeitungsphasen zeigen. Das ist genau der Weg, um zu verstehen, in welcher Phase ein `rewrite` oder `try_files` wirkt (Modul 5).

Weil die Datei so schnell wächst und für alle Besucher gilt, gibt es einen gezielten Weg: `debug_connection` im `events`-Block schaltet das Debug-Protokoll nur für Verbindungen einer bestimmten Adresse ein.

```nginx
events {
    debug_connection 127.0.0.2;
}
http {
    error_log /var/log/nginx/error.log notice;
    ...
}
```

Mit dieser Konfiguration blieb das Protokoll für Anfragen von `127.0.0.1` frei von Debug-Zeilen (0 Zeilen), während eine Anfrage von `127.0.0.2` 63 Debug-Zeilen erzeugte. Man kann also im laufenden Betrieb einen einzelnen Client beobachten, ohne die Datei für alle zu füllen. Dazu sendet man die Testanfrage von der freigegebenen Adresse aus.

Bei Apache setzt `LogLevel debug` oder `trace1` bis `trace8` die Ausführlichkeit; wie in Einheit 9.2 gezeigt, geht es modulweise (`LogLevel warn ssl:debug proxy:trace2 rewrite:trace3`). Das ist das bevorzugte Mittel, weil es den Schaden begrenzt. Für den Inhalt von Anfragen und Antworten gibt es `mod_dumpio`, das auf dem Testsystem vorhanden ist; ich habe es nicht ausprobiert und nenne es hier nur als Möglichkeit.

Das Debug-Protokoll ist ein Sicherheitsrisiko. Es enthält den vollständigen Anfragekopf, und damit Anmeldedaten. Im Test mit `curl -u` und einem Cookie stand im Debug-Protokoll wörtlich `http header: "Authorization: Basic YW5uYTpnZWhlaW0xMjM="` und `http header: "Cookie: sid=abc123"`. Der Wert nach `Basic` ist nur *Base64-kodiert*, keine Verschlüsselung, und mit einem Befehl lesbar. Wer ein Debug-Protokoll an andere weitergibt (Support, Forum), gibt damit Anmeldedaten und Sitzungs-Cookies weiter. Daraus folgen Regeln: Debug nur zeitlich begrenzt und gezielt einschalten, die Datei mit knappen Rechten ablegen, danach löschen, und vor dem Weitergeben bereinigen. Wer ein Passwort in einer Debug-Datei fand, behandelt es als bekannt und ändert es.

### Typische Fehler.

Der erste Fehler ist, Debug auf einem ausgelasteten Server global einzuschalten; die Platte füllt sich, die Leistung bricht ein. Der zweite ist, die Stufe nach der Untersuchung nicht zurückzusetzen. Der dritte ist, das Protokoll unbereinigt weiterzugeben.

```nginx
# falsch: Debug für alle Besucher, dauerhaft
error_log /var/log/nginx/error.log debug;
# richtig: Debug nur für die eigene Prüfadresse
events { debug_connection 203.0.113.5; }
```

> **Praxisbeispiel: Eine verschwundene Anfrage verfolgen**
>
> Ein typischer Einsatz: Eine bestimmte Anfrage wird scheinbar von der falschen Location bearbeitet. Man schaltet `debug_connection` für die eigene Adresse ein, sendet die Anfrage, liest die Phasenzeilen in der Debug-Datei, und schaltet es wieder aus. Der Reload dauert Sekunden und stört niemanden.

## Übungsaufgaben

Die praktischen Aufgaben lassen sich mit einem lokalen Server und `curl` nachvollziehen. Die Lösungen stehen im nächsten Abschnitt.

**Aufgabe 1 (leicht).** Nenne die Stufen des Fehlerprotokolls von Nginx in der Reihenfolge vom Schwersten zum Leichtesten. Welche Stufe nimmst du für den Normalbetrieb, welche für die Fehlersuche?

**Aufgabe 2 (leicht).** Was bedeuten die Felder `rt` und `urt` im Nginx-Format aus 9.3, und was sagt ein großer Unterschied zwischen beiden?

**Aufgabe 3 (leicht).** Warum ist ein 499 kein offizieller HTTP-Code, und was bedeutet er im Nginx-Protokoll?

**Aufgabe 4 (mittel).** Du benennst eine Nginx-Protokolldatei um, aber die neue Datei bleibt leer. Erkläre die Ursache und gib zwei Lösungswege an.

**Aufgabe 5 (mittel).** In der `stub_status`-Ausgabe zeigt `accepts` 1000 und `handled` 970. Was bedeutet das, und was prüfst du?

**Aufgabe 6 (praktisch).** Schreibe für Apache ein `LogFormat` mit Dauer und eine `CustomLog`-Zeile, die Anfragen an `/health` auslässt.

**Aufgabe 7 (praktisch).** Schreibe ein Nginx-`log_format` im JSON-Format mit Zeit, Adresse, Pfad, Status und Dauer, und eine `jq`-Zeile, die alle Anfragen mit Status 500 oder höher ausgibt.

**Aufgabe 8 (schwer).** Gegeben ist eine Zugriffsprotokoll-Datei im Format aus 9.3. Schreibe eine Kommandozeile, die die zehn häufigsten Adressen mit Status 404 auflistet, und eine, die die Anzahl der Anfragen über eine Sekunde ausgibt.

**Aufgabe 9 (schwer).** Eine Seite wird nachts um 02:10 langsam. Du hast nur Zugriffsprotokoll und Fehlerprotokoll. Beschreibe in fünf Schritten, wie du Umfang, Zeitverlauf und Ursache eingrenzt.

## Lösungen und Erklärungen

**Lösung 1.** Von schwer nach leicht: `emerg, alert, crit, error, warn, notice, info, debug`. Normalbetrieb: `warn` oder `error`; Fehlersuche: zeitweise `info` oder `debug`, besser nur für eine Adresse mit `debug_connection`. Jede Stufe schließt die ernsteren ein.

**Lösung 2.** `rt` ist die Gesamtdauer der Anfrage in Sekunden, `urt` die Zeit der Antwort des Backends. Ist `urt` fast so groß wie `rt`, liegt die Verzögerung im Backend (im Test: 3,004 gegen 3,003). Ist `rt` deutlich größer, wartete die Anfrage im Proxy oder auf einen langsamen Client.

**Lösung 3.** 499 ist eine Eigenschöpfung von Nginx für das Zugriffsprotokoll: Der Client hat die Verbindung geschlossen, bevor Nginx eine Antwort senden konnte. Viele 499 deuten auf zu langsame Antworten oder ungeduldige Clients hin.

**Lösung 4.** Der Server hält die Datei offen und schreibt nach dem Umbenennen weiter in die alte Datei, weil er an der offenen Datei hängt, nicht am Namen (im Test: die Anfrage nach dem `mv` landete in der umbenannten Datei). Lösung 1: `nginx -s reopen` (Signal `USR1`) nach dem Umbenennen. Lösung 2: `logrotate` mit `postrotate`-Befehl, der den Server benachrichtigt, wie in `/etc/logrotate.d/nginx`.

**Lösung 5.** `handled` kleiner als `accepts` bedeutet, dass Nginx 30 Verbindungen angenommen, aber nicht bearbeitet hat, meist weil ein Limit erreicht war. Man prüft `worker_connections` und `worker_rlimit_nofile`, das Fehlerprotokoll (Meldungen zu `worker_connections are not enough` oder zu offenen Dateien) und den Verlauf der Verbindungszahl (Modul 11).

**Lösung 6.**

```apache
LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\" %D" combined_t
SetEnvIf Request_URI "^/health$" nolog
CustomLog "/var/log/apache2/access.log" combined_t env=!nolog
```

Das Ergebnis wurde im Test bestätigt: `/health` fehlte in der Datei, die anderen Anfragen standen darin.

**Lösung 7.**

```nginx
log_format json escape=json
  '{"zeit":"$time_iso8601","ip":"$remote_addr","pfad":"$uri",'
  '"status":$status,"rt":"$request_time"}';
access_log /var/log/nginx/access.json json;
```

```bash
jq -c 'select(.status >= 500)' /var/log/nginx/access.json
```

`escape=json` sorgt für gültiges JSON. Der Status steht ohne Anführungszeichen und lässt sich deshalb numerisch vergleichen.

**Lösung 8.**

```bash
awk '$9==404{print $1}' access.log | sort | uniq -c | sort -rn | head -10
awk '{split($NF,a,"="); if (a[2] > 1) n++} END{print n+0}' access.log
```

Die erste Zeile filtert Status 404, nimmt das Adressfeld, zählt und sortiert absteigend. Die zweite liest die Zahl hinter `rt=` und zählt Werte über 1 (Sekunde); `n+0` verhindert eine leere Ausgabe, wenn kein Wert passt. In den Übungsdaten ergab die zweite Zeile 90 Anfragen.

**Lösung 9.** (1) Umfang: Statusverteilung und betroffene Pfade bestimmen (`awk` auf Status und Pfad). (2) Zeitverlauf: Anfragen oder langsame Anfragen pro Minute zählen und Beginn und Ende bestimmen. (3) Vergleich: Dauer `rt` und `urt` gegenüberstellen, um Server und Backend zu trennen. (4) Fehlerprotokoll: im Zeitraum nach Verbindungsfehlern, Zeitüberschreitungen und Warnungen suchen. (5) Hypothese gegen Ereignisse prüfen, die um 02:10 geplant waren (Sicherung, Rotation, Cron-Aufträge, Updates). Ergebnis ist eine Hypothese mit Belegen aus mehreren Quellen, kein Ratespiel.
