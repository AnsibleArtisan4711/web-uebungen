# Modul 11 - Performance, Caching und Skalierung

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Listings unverändert, farbige Boxen als Zitatblöcke mit fettem Titel, Tabellen als Markdown-Tabellen, Übungsaufgaben und Lösungen als Absätze bzw. Überschriften). Die Lerneinheiten sind wie in der Quelle nach Modul nummeriert (11.1 bis 11.14), danach folgen „Übungsaufgaben“ (9) und „Lösungen und Erklärungen“. **Die Konfigurationen und Befehle wurden für dieses Repository nicht ausgeführt:** Laut Einleitung hat der Autor die Beispiele in einer Linux-Umgebung (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0) ausgeführt; nicht getestet sind laut Skript Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt. Viele Beispiele ändern Server-Konfiguration, Zertifikate, Rechte oder Dienste: nur in einer Testumgebung ausprobieren. Übersicht zum Modul: [README](README.md).

**Geplante Dauer:** 16 h | **Priorität:** 2 | **Lerneinheiten:** 14

## Lerneinheiten laut Lehrplan

| **Nr.** | **Lerneinheit**          | **Dauer (h)** | **Prio** |
|--------:|:-------------------------|--------------:|---------:|
|    11.1 | MPM Tuning               |             1 |        2 |
|    11.2 | KeepAlive                |             1 |        2 |
|    11.3 | Timeouts                 |           1,5 |        2 |
|    11.4 | Compression              |             1 |        2 |
|    11.5 | Caching                  |             1 |        2 |
|    11.6 | Static Asset Optimierung |           1,5 |        3 |
|    11.7 | Capacity Tests           |             1 |        3 |
|    11.8 | Performance Monitoring   |             1 |        3 |
|    11.9 | Worker Tuning            |             1 |        2 |
|   11.10 | Buffers                  |           1,5 |        2 |
|   11.11 | sendfile                 |             1 |        2 |
|   11.12 | open_file_cache          |             1 |        2 |
|   11.13 | Microcaching             |           1,5 |        3 |
|   11.14 | Benchmarking             |             1 |        3 |
|         | **Summe**                |        **16** |          |

## Überblick und Lernweg

Leistung ist bei einem Webserver kein einzelner Schalter, sondern das Zusammenspiel von vier Dingen: wie viele Verbindungen und Anfragen gleichzeitig bearbeitet werden können (Parallelität), wie lange eine einzelne Anfrage dauert (Latenz), wie viel Arbeit der Server überhaupt ausführen muss (Entlastung durch Zwischenspeicher und Kompression) und wie sich das alles unter wachsender Last verhält (Skalierung). Dieses Modul behandelt vierzehn Bausteine, die sich diesen vier Fragen zuordnen lassen. Die Einheiten 11.1 und 11.9 betreffen die Parallelität, also die Prozess- und Thread-Modelle von Apache (MPM) und Nginx (Worker). Die Einheiten 11.2, 11.3, 11.10 und 11.11 betreffen den Weg der einzelnen Anfrage durch Verbindung, Zeitgrenzen, Puffer und Dateiauslieferung. Die Einheiten 11.4, 11.5, 11.6, 11.12 und 11.13 verringern die Arbeit pro Anfrage, durch Kompression, Zwischenspeicher, optimierte statische Dateien und gecachte Dateiinformationen. Die Einheiten 11.7, 11.8 und 11.14 schließlich behandeln das Messen: Lasttests, laufende Überwachung und sauberes Benchmarking.

Die Reihenfolge ist der Lehrplan, nicht die ideale Lernreihenfolge. Wer von Grund auf lernt, liest zuerst 11.14 (Benchmarking) und 11.7 (Kapazitätstests) im Überblick, weil alle anderen Einheiten sagen „ändere das und miss dann“. Ohne Messmethode ist jede Einstellung Raten. Ein Leitsatz zieht sich durch das ganze Modul: *Erst messen, dann ändern, dann wieder messen, und nur eine Sache auf einmal.* Viele verbreitete „Tuning-Anleitungen“ im Netz enthalten Zahlen, die für ein bestimmtes System gemessen wurden und auf einem anderen schaden.

> **Merke**
>
> Alle Messwerte dieses Moduls stammen von einem kleinen Testsystem (zwei Prozessorkerne, Apache 2.4.58 und Nginx 1.24.0 unter Ubuntu 24.04, Last und Server auf demselben Rechner über die Loopback-Schnittstelle). Solche Zahlen sind *relativ* zu verstehen: Sie zeigen, dass eine Einstellung eine Wirkung hat und wie groß sie ungefähr ist, aber nicht, wie viele Anfragen Ihr Server in der Produktion schafft. Wo Aussagen aus Dokumentation oder allgemeinem Fachwissen stammen und nicht selbst getestet wurden, steht das ausdrücklich im Text.

Grundlagen, die hier vorausgesetzt werden, stehen in früheren Modulen: die Arbeitsweise der MPMs in Modul 4, Kompression und Cache-Control-Header in Modul 5, Proxy-Puffer und Proxy-Zeitgrenzen in Modul 7, Zugriffsprotokolle und Statusseiten in Modul 9 sowie Anfragelimits und Schutz vor Überlast in Modul 10. Das vorliegende Modul wiederholt diese Erklärungen nicht, sondern betrachtet dieselben Einstellungen unter dem Gesichtspunkt „Wie stelle ich sie für Last ein, und woran erkenne ich, dass sie falsch stehen?“.

## 11.1 MPM Tuning

Ein *MPM* (Multi-Processing Module) legt bei Apache fest, wie der Server Anfragen auf Prozesse und Threads verteilt. Modul 4 hat die drei Varianten `event`, `worker` und `prefork` beschrieben. Auf aktuellen Systemen ist `event` der Standard, und deshalb konzentriert sich dieser Abschnitt darauf. *Tuning* heißt hier, die Grenzen des MPM so zu setzen, dass der Server unter Last weder an einer künstlich niedrigen Obergrenze hängt noch den Arbeitsspeicher des Rechners sprengt.

Das `event`-MPM arbeitet mit mehreren Prozessen, und jeder Prozess enthält mehrere Threads. Ein Thread bearbeitet zu einem Zeitpunkt genau eine Anfrage. Die Zahl der Threads pro Prozess legt `ThreadsPerChild` fest. Die Gesamtzahl der gleichzeitig bearbeitbaren Anfragen begrenzt `MaxRequestWorkers`. Daraus folgt die Zahl der Prozesse: `MaxRequestWorkers` geteilt durch `ThreadsPerChild`. Mit den Standardwerten von Ubuntu (`ThreadsPerChild 25`, `MaxRequestWorkers 150`) sind das sechs Prozesse. Eine weitere Grenze, `ServerLimit`, bestimmt, wie viele Prozesse überhaupt existieren dürfen (Voreinstellung 16). Sie muss mindestens so groß sein wie die benötigte Prozesszahl.

Weil nicht jede Anfrage einen Thread braucht, solange sie nur wartet, unterscheidet `event` zwischen *aktiven* Anfragen und *wartenden* Verbindungen. Eine Keep-Alive-Verbindung, auf der gerade nichts geschieht, wird von einem eigenen Listener-Thread beobachtet und belegt keinen Arbeits-Thread. Dadurch kann der Server mehr Verbindungen offen halten, als er Threads hat. Laut Dokumentation gilt als Obergrenze der Verbindungen etwa (`AsyncRequestWorkerFactor` + 1) × `MaxRequestWorkers`, bei der Voreinstellung 2 also das Dreifache. Dokumentiert ist außerdem, dass TLS-Verbindungen diese Entlastung nicht in jedem Fall bekommen. Dieser Punkt wurde nicht selbst geprüft, sollte aber bei der Dimensionierung bedacht werden.

```apache
<IfModule mpm_event_module>
    StartServers             2
    ServerLimit              8
    ThreadsPerChild         25
    ThreadLimit             64
    MinSpareThreads         50
    MaxSpareThreads        150
    MaxRequestWorkers      200
    MaxConnectionsPerChild   0
</IfModule>
```

Dieses Beispiel erlaubt 200 gleichzeitige Anfragen auf acht Prozesse mit je 25 Threads. `ServerLimit 8` reicht dafür, weil 200 geteilt durch 25 genau acht ergibt. `StartServers` sagt, mit wie vielen Prozessen der Server beginnt; weitere Prozesse startet er bei Bedarf. `MinSpareThreads` und `MaxSpareThreads` halten eine Reserve an freien Threads: Fällt sie unter das Minimum, startet der Server neue Prozesse, überschreitet sie das Maximum, beendet er überzählige. `ThreadLimit` ist die Obergrenze, die `ThreadsPerChild` im laufenden Betrieb überhaupt erreichen darf. `MaxConnectionsPerChild 0` bedeutet, dass Prozesse nie wegen ihres Alters ersetzt werden; ein Wert größer null lässt Prozesse nach so vielen Verbindungen neu starten und begrenzt damit Speicherlecks in Modulen.

Wie wirkt sich die Obergrenze aus? Im Test lief ein Apache mit `ServerLimit 2`, `ThreadsPerChild 5` und `MaxRequestWorkers 10` als Reverse Proxy vor einem Backend, das jede Anfrage 200 ms lang festhielt. Die Last waren 90 Anfragen mit 30 gleichzeitigen Verbindungen. Während der Last zeigte `server-status?auto` die Werte `BusyWorkers: 10` und `IdleWorkers: 0`, im Scoreboard standen zehn `W` (Writing) nebeneinander, und im Fehlerprotokoll erschien `AH00484: server reached MaxRequestWorkers setting, consider raising the MaxRequestWorkers setting`. Der Median der Antwortzeit lag bei 732 ms. Direkt am Backend, ohne den Apache, betrug er 208 ms. Mit `MaxRequestWorkers 40` und acht erlaubten Prozessen sank der Median auf 466 ms, und die Meldung AH00484 blieb aus. Der Median ging nicht auf die 208 ms des Backends zurück; ein Grund ist, dass der Server zusätzliche Prozesse erst nach und nach startet. Nach dem Kenntnisstand des Autors, nicht anhand der Dokumentation geprüft, vergrößert er die Zahl der neu gestarteten Prozesse von Sekunde zu Sekunde stufenweise. Wer plötzliche Lastspitzen erwartet, sollte deshalb `StartServers` und `MinSpareThreads` hoch genug wählen, damit die Prozesse schon bereitstehen.

Wie groß darf `MaxRequestWorkers` sein? Die Grenze setzt der Arbeitsspeicher, nicht die Hoffnung. Der Weg ist: Server mit realistischer Konfiguration unter Last setzen, den Speicherverbrauch eines Prozesses ablesen (zum Beispiel `ps -C apache2 -o pid,rss,cmd`), die Prozesszahl bei Volllast bestimmen und daraus den Gesamtverbrauch berechnen. Von dem Wert zieht man den Bedarf des Betriebssystems, der Datenbank und anderer Dienste ab. Was übrig bleibt, geteilt durch den Verbrauch pro Prozess, ergibt die erlaubte Prozesszahl und damit (mal `ThreadsPerChild`) die Obergrenze. Wer mit PHP oder anderen Modulen im Server selbst arbeitet, hat größere Prozesse als mit einem reinen Proxy. Moderne Aufbauten (Modul 4: PHP-FPM) halten die Webserverprozesse klein und lagern den Speicherhunger in einen eigenen Dienst aus.

> **Ergänzung aus der Nachrecherche: Änderungen von ServerLimit brauchen einen Neustart**
>
> Im Test wurde `ServerLimit` von 2 auf 8 und `MaxRequestWorkers` auf 40 erhöht, aber nur mit `apache2 -k restart` neu geladen. Der Server meldete beim Start `AH00516: MaxRequestWorkers of 40 would require 8 servers and exceed ServerLimit of 2, decreasing to 10`, behielt also den alten Wert von `ServerLimit` und kürzte `MaxRequestWorkers` auf 10. Erst nach vollständigem Beenden und erneutem Starten galten die neuen Werte. Die Lehre: Nach Änderungen an `ServerLimit` und `ThreadLimit` im Fehlerprotokoll nach AH00516 suchen und den Dienst notfalls anhalten und starten statt neu laden. Quelle: eigener Test; die Dokumentation zur Event-MPM (Apache 2.4) beschreibt die Zusammenhänge der Direktiven, nennt aber den Meldungscode nicht.

### Typische Fehler.

Der häufigste Fehler ist, `MaxRequestWorkers` willkürlich hoch zu setzen, „damit nichts blockiert“. Dann nimmt der Server unter Last mehr Arbeit an, als der Rechner bewältigt, beginnt zu swappen, und die Antwortzeiten brechen ein, statt dass einzelne Anfragen warten. Ein zweiter Fehler ist, `MaxRequestWorkers` größer als `ServerLimit` mal `ThreadsPerChild` zu wählen (siehe Ergänzung). Ein dritter ist, die Werte eines `prefork`-Beispiels aus dem Netz auf `event` zu übertragen: Bei `prefork` ist jeder Prozess genau eine Anfrage, bei `event` ist jeder Prozess viele.

```apache
# falsch: 2000 Anfragen, aber nur 16 Prozesse x 25 Threads erlaubt
MaxRequestWorkers 2000

# richtig: Prozesszahl und Obergrenze passen zusammen
ServerLimit        20
ThreadsPerChild    25
MaxRequestWorkers 500
```

> **Praxisbeispiel: Das Scoreboard als Frühwarnsystem**
>
> Die Statusseite (Modul 9) zeigt `BusyWorkers` und `IdleWorkers`. Wer beides in ein Überwachungssystem einspeist und bei `IdleWorkers` nahe null warnt, erfährt von einem Engpass, bevor Besucher es merken. Die Meldung `AH00484` im Fehlerprotokoll ist die späte, aber eindeutige Bestätigung. Kommt sie regelmäßig vor, hat man zwei Möglichkeiten: Kapazität erhöhen oder die Ursache beseitigen, etwa ein langsames Backend, das Threads festhält.

## 11.2 KeepAlive

Eine HTTP-Verbindung aufzubauen kostet Zeit: Beim TCP-Handshake müssen mehrere Pakete hin und her, bei HTTPS kommt der TLS-Handshake hinzu. *Keep-Alive* (persistente Verbindung) bedeutet, dass der Client dieselbe Verbindung für mehrere aufeinanderfolgende Anfragen benutzt, statt sie nach jeder Antwort zu schließen. Seit HTTP/1.1 ist das der Normalfall. Für den Server bedeutet es: weniger Verbindungsaufbauten, weniger kurzlebige Sockets, weniger CPU. Der Preis: Eine offene, aber untätige Verbindung belegt Ressourcen, bis sie ein Zeitlimit schließt.

Drei Einstellungen steuern das Verhalten. Erstens, ob Keep-Alive überhaupt erlaubt ist (Apache `KeepAlive On|Off`; bei Nginx ist es durch einen von null verschiedenen `keepalive_timeout` aktiv). Zweitens, wie lange der Server auf die nächste Anfrage wartet, bevor er die Verbindung schließt (Apache `KeepAliveTimeout`, Nginx `keepalive_timeout`). Drittens, wie viele Anfragen eine Verbindung höchstens bedienen darf, bevor sie erneuert wird (Apache `MaxKeepAliveRequests`, Nginx `keepalive_requests`). Die Ubuntu-Konfiguration von Apache setzt `KeepAlive On`, `MaxKeepAliveRequests 100` und `KeepAliveTimeout 5`. Die Ubuntu-Datei `nginx.conf` setzt `keepalive_timeout` nicht; es gilt der Standard des Programms (laut Dokumentation 75 Sekunden, nicht eigens geprüft).

Der Nutzen ließ sich im Test deutlich messen. Gemessen wurde mit `ab` (ApacheBench), einmal ohne und einmal mit der Option `-k`, die Keep-Alive einschaltet, jeweils 5000 Anfragen mit 10 gleichzeitigen Verbindungen auf eine kleine statische Datei:

```bash
ab -n 5000 -c 10 http://127.0.0.1:8201/index.html
ab -k -n 5000 -c 10 http://127.0.0.1:8201/index.html
```

Bei Nginx stieg die Rate von rund 10 500 auf rund 25 500 Anfragen pro Sekunde, bei Apache von rund 8 800 auf rund 15 800. Mit `KeepAlive Off` im Apache meldete `ab -k` `Keep-Alive requests: 0`, und die Rate fiel auf den Wert ohne Keep-Alive zurück (rund 8 500). Nach den Läufen ohne Keep-Alive standen im Betriebssystem fast 7800 Sockets im Zustand `TIME_WAIT` (`ss -tan state time-wait | wc -l`). Das ist der Zustand, in dem das System eine geschlossene Verbindung noch kurz vorhält. Wer sehr viele kurze Verbindungen erzeugt, kann damit seine Portnummern aufbrauchen. Zur Einordnung: Die absoluten Zahlen gelten nur für dieses Testsystem. Der Faktor von etwa zwei zeigt jedoch, wie viel Verbindungsaufbau selbst bei einer winzigen Datei kostet; bei HTTPS wäre der Unterschied größer, weil der TLS-Handshake sehr viel teurer ist als ein TCP-Handshake.

Das Zeitlimit wurde mit einem kleinen Python-Programm geprüft, das eine Anfrage schickt und dann nur noch wartet. Bei `keepalive_timeout 3s` (Nginx) und `KeepAliveTimeout 3` (Apache) schloss der Server die Verbindung nach genau 3,0 Sekunden. Das Anfragelimit pro Verbindung ließ sich bei Nginx zählen: Mit `keepalive_requests 3` meldete `ab -k` bei 30 Anfragen auf einer Verbindung nach der anderen `Keep-Alive requests: 20`. Von je drei Anfragen einer Verbindung war die dritte die letzte, und der Server kündigte dort das Schließen an.

```nginx
http {
    keepalive_timeout  15s;
    keepalive_requests 1000;
}
```

```apache
KeepAlive            On
KeepAliveTimeout     5
MaxKeepAliveRequests 500
```

Beide Beispiele sind moderate Werte. Ein kurzes Zeitlimit von wenigen Sekunden genügt in aller Regel, denn ein Browser lädt die Teile einer Seite kurz hintereinander. Ein sehr langes Zeitlimit (60 Sekunden und mehr) hält bei vielen gleichzeitigen Besuchern viele untätige Verbindungen offen. Beim `event`-MPM kostet jede davon wegen der asynchronen Behandlung keinen Thread, beim älteren `prefork` dagegen einen ganzen Prozess. Deshalb war bei `prefork` das Abschalten von Keep-Alive oder ein sehr kurzes Zeitlimit lange eine übliche Empfehlung; sie gilt für `event` nicht mehr in derselben Schärfe.

Eine zweite Seite des Themas ist die Verbindung zwischen Proxy und Backend. Nginx spricht standardmäßig mit dem Backend in HTTP/1.0 und schließt die Verbindung nach jeder Anfrage. Ein Aufbau mit vielen kleinen Anfragen leidet darunter. Im Test (Nginx als Proxy vor einem schnellen Python-Backend, 4000 Anfragen, 10 gleichzeitig) lag die Rate ohne wiederverwendete Verbindungen bei 580 bis 710 Anfragen pro Sekunde und erzeugte jeweils tausende `TIME_WAIT`-Sockets zum Backend-Port (zuerst 3926, im nächsten Lauf kamen weitere 2875 hinzu). Mit wiederverwendeten Verbindungen stieg die Rate auf 6300 bis 7050 pro Sekunde, und die Zahl der `TIME_WAIT`-Sockets blieb unverändert.

```nginx
upstream backend {
    server 127.0.0.1:9101;
    keepalive 16;
}
server {
    listen 8210;
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

Drei Zeilen machen den Unterschied. `keepalive 16` im `upstream`-Block gibt an, wie viele ungenutzte Verbindungen zum Backend pro Arbeitsprozess bereitgehalten werden. `proxy_http_version 1.1` ist nötig, weil HTTP/1.0 keine persistenten Verbindungen kennt. `proxy_set_header Connection ""` entfernt den Header `Connection: close`, den Nginx sonst zum Backend schickt. Fehlt eine der drei Angaben, merkt man es nicht an einer Fehlermeldung, sondern nur an der Leistung. Bei Apache nutzt `mod_proxy` einen Verbindungspool zum Backend; die Wiederverwendung ist laut Dokumentation standardmäßig aktiv und lässt sich mit `disablereuse=On` am `ProxyPass` abschalten (nicht eigens getestet).

### Typische Fehler.

Der erste ist, Keep-Alive „zur Sicherheit“ abzuschalten. Das kostet Leistung und erzeugt, wie gemessen, tausende kurzlebige Sockets. Der zweite sind sehr lange Zeitlimits ohne Grenze bei `prefork`. Der dritte ist der vergessene Backend-Keep-Alive bei Nginx: Der Server läuft, ist aber deutlich langsamer als nötig.

```nginx
# falsch: keepalive im upstream, aber HTTP/1.0 zum Backend
upstream backend { server 127.0.0.1:9101; keepalive 16; }
location / { proxy_pass http://backend; }

# richtig: auch Version und Header setzen
location / {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
}
```

> **Praxisbeispiel: TIME_WAIT-Stürme erkennen**
>
> Ein typisches Alarmbild: Der Server ist nicht ausgelastet, aber Anfragen schlagen mit `Cannot assign requested address` oder Zeitüberschreitungen fehl. Ein Blick auf `ss -s` oder `ss -tan state time-wait | wc -l` zeigt zehntausende Sockets im Wartezustand, weil zwischen Proxy und Backend jede Anfrage eine neue Verbindung öffnet. Die Abhilfe ist nicht, Betriebssystemparameter zu drehen, sondern Keep-Alive zum Backend einzuschalten.

## 11.3 Timeouts

Ein *Timeout* (Zeitlimit) ist die Obergrenze, wie lange der Server auf ein Ereignis wartet, bevor er aufgibt. Ohne Zeitlimits könnte ein einziger langsamer oder bösartiger Client unbegrenzt Ressourcen binden. Zu knappe Zeitlimits wiederum brechen berechtigte, langsame Vorgänge ab, etwa den Upload über eine schlechte Mobilverbindung. Die richtige Einstellung ist deshalb immer ein Kompromiss, und sie muss für jede Wartestelle getrennt gedacht werden. Wichtig ist eine Eigenschaft, die oft missverstanden wird: Die meisten Zeitlimits gelten *nicht für die gesamte Anfrage*, sondern für die Pause zwischen zwei Lese- oder Schreibvorgängen. Eine Antwort darf also beliebig lange dauern, solange regelmäßig Daten fließen.

Dieser Punkt ließ sich im Test belegen. Ein Nginx mit `send_timeout 2s` lieferte eine Datei von 20 MB. Ein Testclient forderte sie an und las dann sechs Sekunden lang nichts. Nginx brach die Übertragung ab und protokollierte (Stufe `info`) `client timed out (110: Connection timed out) while sending response to client`. Der Client hatte bis dahin nur rund 2,8 MB bekommen, die im Betriebssystem zwischengepuffert waren. Eine zweite Anfrage derselben Datei mit gedrosselter Geschwindigkeit, die über vier Sekunden stetig lief, löste dagegen keinen Eintrag `timed out` aus, obwohl sie länger als zwei Sekunden dauerte: Die einzelnen Schreibvorgänge waren jeweils rechtzeitig erfolgreich. Auf Apache-Seite ließ sich das Verhalten mit dem eingesetzten Aufbau nicht reproduzieren (kein Fehlerprotokolleintrag im Test); die Dokumentation beschreibt `Timeout` ebenfalls als Obergrenze für einzelne Ein- und Ausgabevorgänge.

Welche Zeitlimits gibt es? Die folgende Tabelle ordnet sie nach der Wartestelle. Die Voreinstellungen in der letzten Spalte stammen, soweit nicht anders vermerkt, aus den Konfigurationsdateien der Ubuntu-Pakete bzw. aus den Dokumentationen der Programme.

| **Wartestelle**            | **Apache / Nginx**                | **Hinweis**                                                 |
|:---------------------------|:----------------------------------|:------------------------------------------------------------|
| Anfragekopf lesen          | `RequestReadTimeout` (`mod_reqtimeout`) / `client_header_timeout` | Schutz vor langsamen Clients, siehe Modul 10.               |
| Anfragekörper lesen        | `RequestReadTimeout body=` / `client_body_timeout`             | Gilt zwischen zwei Lesevorgängen.                           |
| Antwort senden             | `Timeout` / `send_timeout`             | Pause zwischen zwei Schreibvorgängen; Ubuntu-Apache: 300 s. |
| Leerlauf zwischen Anfragen | `KeepAliveTimeout` / `keepalive_timeout`             | Siehe Abschnitt 11.2.                                       |
| Verbindung zum Backend     | `ProxyTimeout`, `connectiontimeout` / `proxy_connect_timeout`  | Siehe Modul 7.                                              |
| Backend liest / antwortet  | `ProxyTimeout` / `proxy_read_timeout`, `proxy_send_timeout`  | Nginx laut Dokumentation je 60 s.                           |

Als Faustregel gilt: Je weiter vorn in der Kette (am Rand zum Internet), desto kürzer die Zeitlimits, denn dort sitzen potenziell böswillige oder langsame Clients. Je weiter hinten (beim Backend), desto genauer sollten sie zu dem passen, was die Anwendung tatsächlich braucht. Zudem muss jedes Glied der Kette auf das nächste abgestimmt sein. Läuft hinter einem Lastverteiler mit einem Zeitlimit von 60 Sekunden ein Webserver mit 300 Sekunden, bricht der Lastverteiler zuerst ab, und der Webserver arbeitet unnötig weiter. Umgekehrt führt ein zu kurzes Limit am Webserver dazu, dass die Anwendung ein Ergebnis berechnet, das niemand mehr abholt.

```nginx
http {
    client_header_timeout 10s;
    client_body_timeout   30s;
    send_timeout          30s;
    keepalive_timeout     15s;
    server {
        location /export/ {
            proxy_pass http://backend;
            proxy_read_timeout 300s;   # nur hier großzügig
        }
    }
}
```

Dieses Beispiel zeigt das Muster „knapp als Voreinstellung, großzügig nur an der begründeten Stelle“. Die globalen Werte sind kurz genug, um langsame Clients zu begrenzen. Nur die Export-Funktion, von der man weiß, dass sie lange rechnet, bekommt fünf Minuten Wartezeit auf das Backend. Dasselbe in Apache gelingt über ein `ProxyPass` mit dem Parameter `timeout=300` an der betreffenden Stelle oder über `ProxyTimeout` in einem eigenen `Location`-Block (Modul 7).

### Typische Fehler.

Der häufigste Fehler ist, ein einzelnes Problem durch ein globales Hochsetzen zu lösen. Ein Bericht bricht nach 60 Sekunden mit `504` ab, also setzt jemand `proxy_read_timeout 600s` für den ganzen Server. Folge: Jede hängende Anfrage blockiert nun zehn Minuten lang einen Backend-Prozess. Ein weiterer Fehler ist ein Zeitlimit, das kürzer ist als die Sekundenzahl, die ein erlaubter Vorgang braucht, etwa `client_body_timeout 5s` für einen Foto-Upload.

```nginx
# falsch: globaler Wert wegen eines einzigen Berichts
http { proxy_read_timeout 600s; }

# richtig: nur der betroffene Pfad
location = /bericht/export { proxy_read_timeout 600s; }
```

> **Praxisbeispiel: Das 60-Sekunden-Muster**
>
> Meldet sich ein Anwender mit „nach genau einer Minute kommt ein Fehler“, ist der Fall fast immer ein Zeitlimit mit dem Standardwert 60 Sekunden. Im Nginx-Fehlerprotokoll steht dann `upstream timed out (110: Connection timed out) while reading response header from upstream`. Die Dauer verrät also die Ursache. Die richtige Reaktion ist zu klären, ob die Anwendung wirklich so lange rechnen muss, und wenn ja, ob sie besser asynchron arbeiten sollte (Auftrag annehmen, später abholen).

## 11.4 Compression

Kompression verringert die Zahl der übertragenen Bytes, indem der Server Text in eine kürzere Darstellung umrechnet und der Browser sie wieder auflöst. Welches Verfahren verwendet wird, handeln beide über die Header `Accept-Encoding` (Wunsch des Clients) und `Content-Encoding` (Wahl des Servers) aus. Modul 5 hat `gzip` und die Abgrenzung zu *Brotli* erklärt. Hier geht es um die Kosten und Fallen: Kompression spart Bandbreite und Zeit beim Empfänger, kostet aber Prozessorzeit beim Server und ist nicht für jeden Inhalt sinnvoll.

Der Gewinn hängt vom Inhalt ab. Im Test wurde eine JSON-Datei von 662 915 Bytes (4000 gleichartige Datensätze) mit Nginx ausgeliefert. Mit `gzip_comp_level 1` kamen 59 409 Bytes beim Client an, mit Stufe 5 54 797 und mit Stufe 9 53 878. Die Datei schrumpfte also auf rund neun Prozent der Ursprungsgröße. Bemerkenswert ist, wie wenig die höheren Stufen bringen: Von Stufe 1 auf Stufe 9 sparte man nur noch rund 9 Prozent. Der Preis dafür ist die Rechenzeit. Eine isolierte Messung der Kompression mit der zlib-Bibliothek (dasselbe Verfahren wie gzip) ergab pro Kompression der Datei 1,6 ms bei Stufe 1, 1,6 ms bei Stufe 5, 4,4 ms bei Stufe 6 und 8,7 ms bei Stufe 9. Auf einem Server, der diese Datei tausendfach pro Sekunde ausliefern muss, sind das wesentliche Unterschiede. Deshalb liefern die niedrigen bis mittleren Stufen meist das beste Verhältnis. Die Stufen reichen bei Nginx (`gzip_comp_level`) und bei Apache (`DeflateCompressionLevel`) nach dem Kenntnisstand des Autors, nicht abgerufen, von 1 bis 9.

Messungen mit `ab` am gesamten Server zeigten diese Unterschiede nicht sauber (die Raten lagen zwischen 1 290 und 1 760 Anfragen pro Sekunde bei Schwankungen der Messung selbst). Der Grund liegt in der Messumgebung: Client und Server teilten sich zwei Prozessorkerne, und die Last war zu klein, um Kompressionskosten vom Messrauschen zu trennen. Man sollte deshalb Kosten einzelner Operationen isoliert messen (wie oben) und Gesamtleistung unter realistischen Bedingungen (Abschnitt 11.7).

```nginx
http {
    include mime.types;
    gzip            on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_vary       on;
    gzip_types      application/json application/javascript text/css image/svg+xml;
}
```

`gzip on` schaltet die Kompression ein. `gzip_comp_level 5` wählt die Stufe. `gzip_min_length 256` schließt winzige Antworten aus: Im Test wurde eine Datei von sechs Bytes nicht komprimiert, weil der Aufwand den Gewinn übersteigt und das Ergebnis sogar größer sein könnte. `gzip_vary on` fügt den Header `Vary: Accept-Encoding` hinzu; er sagt Zwischenspeichern, dass es zwei Varianten derselben Adresse gibt und sie nicht verwechselt werden dürfen. `gzip_types` nennt die Inhaltstypen, die komprimiert werden; HTML wird von Nginx immer komprimiert, alles andere muss ausdrücklich genannt werden.

Daraus folgt eine häufige Falle, die im Test auftrat. Zunächst wurde die JSON-Datei *nicht* komprimiert, obwohl `gzip_types application/json` gesetzt war. Der Grund: Die Testkonfiguration enthielt keine Zeile `include mime.types`, und Nginx lieferte die Datei deshalb als `Content-Type: text/plain` aus. Dieser Typ stand nicht in `gzip_types`, also unterblieb die Kompression, ohne Fehlermeldung. Erst nach dem Einbinden der MIME-Tabelle (Modul 5) wurde `application/json` erkannt. Dieselbe Datei, mit der Endung `.dat` abgelegt, blieb weiterhin unkomprimiert, weil ihr Typ `text/plain` blieb. Auf Apache-Seite sieht das Gegenstück so aus:

```apache
AddOutputFilterByType DEFLATE application/json text/html text/css
DeflateCompressionLevel 5
```

Im Test lieferte Apache damit die JSON-Datei mit `Content-Encoding: gzip`, `Vary: Accept-Encoding` und einer Größe von 55 153 Bytes aus (ohne Kompression 662 915). Die Datei bekam dort den Typ `application/json` über `ForceType`, weil die Testkonfiguration keine MIME-Tabelle lud; in einer Paketinstallation übernimmt `mod_mime` diese Aufgabe.

Für statische Dateien gibt es eine Möglichkeit, die Rechenzeit ganz zu sparen: *vorkomprimieren*. Man legt neben `api.json` die Datei `api.json.gz` ab (zum Beispiel mit `gzip -9 -k api.json`), und Nginx liefert sie mit dem Modul `gzip_static` aus, wenn der Client gzip versteht. Im Test antwortete Nginx mit `Content-Encoding: gzip` und `Content-Length: 53661`, ohne zur Laufzeit zu komprimieren. Das nutzt man typischerweise im Build-Prozess für Skripte und Stylesheets, wo sich die höchste Stufe lohnt, weil nur einmal komprimiert wird. Bei Apache erreicht man dasselbe mit Umschreibregeln auf die `.gz`-Datei; das wurde hier nicht getestet.

> **Ergänzung aus der Nachrecherche: Brotli und Sicherheit**
>
> Auf dem Testsystem ist das Apache-Modul `mod_brotli` im Paket enthalten. Der Nginx aus dem Ubuntu-Paket wurde ohne Brotli-Unterstützung gebaut (die Ausgabe von `nginx -V` nennt `gzip_static`, aber kein Brotli-Modul); dafür bräuchte man ein zusätzliches Modul. Beide Beobachtungen sind eigene Tests. Sicherheitshinweis nach dem Kenntnisstand des Autors, nicht abgerufen: Kompression von Antworten, die Geheimnisse und gleichzeitig vom Angreifer beeinflussbare Eingaben enthalten, kann über die Antwortlänge Informationen verraten (Angriffsklasse „BREACH“). Vorbeugen kann man, indem man Geheimnisse wie CSRF-Token nicht in komprimierten, nachladbaren Antworten wiederholt oder pro Antwort verändert.

### Typische Fehler.

Der erste Fehler ist, bereits komprimierte Formate (JPEG, PNG, WebP, MP4, ZIP, WOFF2) noch einmal zu komprimieren; das kostet Rechenzeit und spart nichts. Der zweite ist, `gzip_types` zu vergessen und sich zu wundern, warum JSON unkomprimiert bleibt. Der dritte ist die höchste Stufe „weil mehr besser ist“.

```nginx
# falsch: Bilder komprimieren, Stufe 9 für alles
gzip on; gzip_comp_level 9; gzip_types *;

# richtig: nur Textformate, mittlere Stufe
gzip on; gzip_comp_level 5;
gzip_types text/css application/javascript application/json image/svg+xml;
```

> **Praxisbeispiel: Prüfen, ob es wirkt**
>
> Mit `curl -s -H "Accept-Encoding: gzip" -D - -o /dev/null https://beispiel.example/api/produkte` sieht man sofort, ob `Content-Encoding: gzip` und `Vary: Accept-Encoding` gesetzt sind. Ein Blick in die Entwicklerwerkzeuge des Browsers (Netzwerkansicht, Spalten „Größe“ und „Übertragen“) zeigt den Gewinn je Datei. Das ist der erste Schritt jeder Performance-Prüfung, denn eine vergessene Kompression ist einer der billigsten Gewinne.

## 11.5 Caching

Ein *Cache* (Zwischenspeicher) hält eine fertige Antwort bereit, damit sie bei der nächsten gleichen Anfrage nicht erneut berechnet werden muss. Es gibt mehrere Stellen, an denen das geschehen kann: im Browser des Besuchers (privater Cache), in einem Proxy oder Content-Delivery-Network zwischen Besucher und Server (gemeinsamer Cache, englisch *shared cache*) und im eigenen Webserver vor dem Backend. Modul 5 hat die Header erklärt, mit denen man Browser und Zwischenspeicher steuert. Dieser Abschnitt behandelt den dritten Fall: den *serverseitigen Cache*, bei dem Nginx oder Apache Antworten des Backends selbst aufbewahren.

Der Gewinn ist oft größer als bei jeder anderen Maßnahme dieses Moduls, denn der teuerste Teil einer dynamischen Seite ist meist das Backend (Anwendung, Datenbank). Eine Antwort aus dem Cache kostet nur einen Dateizugriff. Der Preis ist die Gefahr, veraltete oder *falsche* Inhalte auszuliefern. Es gilt der alte Satz, dass es nur zwei schwierige Dinge in der Informatik gibt, und eines davon ist das Ungültigmachen von Caches. Die Fragen, die man bei jedem Cache beantworten muss, lauten: Was ist der *Schlüssel* (welche Anfragen sind „gleich“)? Wie lange ist ein Eintrag *frisch*? Was darf *gar nicht* gespeichert werden? Wie wird ein Eintrag bei Bedarf *entfernt*?

Nginx bietet dafür das Modul `proxy_cache`. Zuerst legt man mit `proxy_cache_path` einen Speicherort und eine Verwaltungszone im Arbeitsspeicher an, dann schaltet man den Cache pro `location` ein:

```nginx
http {
    proxy_cache_path /var/cache/nginx/app levels=1:2 keys_zone=appcache:10m
                     max_size=500m inactive=10m use_temp_path=off;
    server {
        listen 8202;
        add_header X-Cache-Status $upstream_cache_status always;
        location / {
            proxy_pass http://127.0.0.1:9101;
            proxy_cache appcache;
            proxy_cache_valid 200 10s;
        }
    }
}
```

`proxy_cache_path` nennt das Verzeichnis, `levels=1:2` verteilt die Dateien auf Unterverzeichnisse, damit keines zu groß wird, und `keys_zone=appcache:10m` reserviert zehn Megabyte Arbeitsspeicher für die Liste der Schlüssel. `max_size` begrenzt die Platte, `inactive` löscht Einträge, die so lange nicht abgerufen wurden. `proxy_cache_valid 200 10s` legt fest, dass Antworten mit Status 200 zehn Sekunden als frisch gelten, wenn das Backend nichts anderes sagt. Die Variable `$upstream_cache_status` liefert den Zustand der Anfrage (`MISS`, `HIT`, `EXPIRED`, `STALE`, `BYPASS` und weitere) und wird hier als Antwortheader ausgegeben, damit man die Wirkung mit `curl` sieht.

Im Test ergab sich folgendes Bild. Eine Antwort ohne Cache-Control-Header des Backends wurde zuerst als `MISS` geholt und danach als `HIT` aus dem Cache geliefert. Antwortete das Backend mit `Cache-Control: private`, `no-store` oder `no-cache`, blieb jede Anfrage ein `MISS`: Nginx respektiert diese Header und speichert nicht. Mit `Cache-Control: max-age=30` wurde gespeichert. Eine Antwort mit `Set-Cookie` wurde nicht gespeichert; das stimmt mit der Dokumentation überein, nach der solche Antworten standardmäßig nicht in den Cache gelangen. Nach Ablauf der zehn Sekunden zeigte die nächste Anfrage `EXPIRED` (Backend neu befragt), die darauf folgende wieder `HIT`. Der Schlüssel, den Nginx intern verwendete, war in der Cache-Datei lesbar: `KEY: http://127.0.0.1:9101/cc?cc=max-age=30`. Er setzt sich standardmäßig aus Schema, dem Namen des Backends und der angefragten Adresse zusammen. Beachten Sie, dass er nicht den Host-Header der Anfrage enthält: Zwei virtuelle Hosts, die denselben Upstream benutzen, teilen sich daher Cache-Einträge, es sei denn, man wählt mit `proxy_cache_key` einen anderen Schlüssel.

Die gefährlichste Beobachtung des Tests betraf den Header `Authorization`. Zwei Anfragen auf dieselbe Adresse, die eine mit `Authorization: Bearer ALICE`, die andere mit `Authorization: Bearer BOB`, lieferten das Ergebnis `MISS` und dann `HIT`, und die zweite Antwort enthielt die Daten, die für Alice erzeugt worden waren. Nginx hat also die Antwort für Alice einem anderen Benutzer ausgeliefert. Das ist eine klassische Datenpanne: Persönliche Inhalte landen im gemeinsamen Cache. Der HTTP-Standard (RFC 9111, Abschnitt 3.5) verbietet einem gemeinsamen Cache, eine Antwort auf eine Anfrage mit `Authorization` wiederzuverwenden, es sei denn, die Antwort erlaubt es ausdrücklich über `must-revalidate`, `public` oder `s-maxage`. Der Nginx-Cache in der Standardkonfiguration bildet diese Regel nicht ab; der Betreiber muss sie selbst herstellen:

```nginx
map $http_authorization $skip_auth { default 1; "" 0; }
map $http_cookie        $skip_cookie { default 0; ~*sessionid 1; }

location / {
    proxy_pass http://127.0.0.1:9101;
    proxy_cache appcache;
    proxy_cache_valid 200 1s;
    proxy_cache_bypass $skip_auth $skip_cookie;
    proxy_no_cache     $skip_auth $skip_cookie;
}
```

Die zwei `map`-Blöcke bilden Anfragemerkmale auf 0 oder 1 ab: `$skip_auth` ist 1, sobald irgendein `Authorization`-Header vorhanden ist, und `$skip_cookie` ist 1, wenn ein Cookie mit dem Namen `sessionid` mitgeschickt wird. `proxy_cache_bypass` bewirkt, dass solche Anfragen *nicht aus dem Cache bedient* werden, und `proxy_no_cache`, dass ihre Antworten *nicht gespeichert* werden. Man braucht beides, denn sonst könnte eine angemeldete Anfrage eine Antwort in den Cache legen, die dann an Anonyme ausgeliefert wird. Im Test zeigten alle Anfragen mit Authorization oder Sitzungs-Cookie danach `BYPASS`, und eine anonyme Anfrage nach der Anfrage von Alice lieferte weiterhin ihren eigenen Cache-Eintrag (`HIT`).

Bei Apache übernimmt `mod_cache` mit dem Speicher-Modul `mod_cache_disk` die Aufgabe:

```apache
LoadModule cache_module      modules/mod_cache.so
LoadModule cache_disk_module modules/mod_cache_disk.so
CacheRoot        /var/cache/apache2/mod_cache_disk
CacheEnable      disk /
CacheDefaultExpire 10
CacheHeader      on
ProxyPass        / http://127.0.0.1:9101/
```

`CacheRoot` nennt das Verzeichnis, `CacheEnable disk /` schaltet das Zwischenspeichern für alle Adressen ein, `CacheHeader on` fügt den Header `X-Cache: HIT` oder `MISS` an, und `CacheDefaultExpire` nennt laut Dokumentation (Übersetzung der Apache-Dokumentation, abgerufen) die Gültigkeit, wenn kein Ablaufdatum angegeben ist. Das Verhalten unterschied sich im Test stark von Nginx. Eine Antwort ganz ohne `Cache-Control`, `Expires`, `Last-Modified` oder `ETag` wurde *nicht* gespeichert, trotz `CacheDefaultExpire`. Das Protokoll auf Stufe `cache:debug` nannte den Grund: `AH00768: ... not cached ... Reason: No Last-Modified; Etag; Expires; Cache-Control: max-age or s-maxage`. Die Regel lautet für die Praxis: Apache speichert nur, wenn die Antwort wenigstens eines dieser Merkmale trägt. Mit `Cache-Control: max-age=30` gab es `X-Cache: HIT from localhost` und einen `Age`-Header. Bei `private` und `no-store` blieb es bei `MISS`.

Eine Überraschung betraf `Set-Cookie`. Apache speicherte die Antwort samt Cookie und lieferte beim zweiten Abruf einen `Set-Cookie: sid=abc`-Header mit aus: Ein Cookie, das für einen Besucher bestimmt war, wurde an den nächsten weitergegeben. Die Dokumentation beschreibt die Gegenmaßnahme: `CacheIgnoreHeaders Set-Cookie` verhindert, dass der Header im Cache abgelegt wird. Besser ist es, Antworten mit Cookies gar nicht zwischenzuspeichern. Bei Anfragen mit `Authorization` legte `mod_cache` im Test nichts ab und sendete auch keinen `X-Cache`-Header, selbst dann nicht, wenn die Antwort `public` erlaubte; die Dokumentation sagt allgemein, dass zugriffsgeschützte Inhalte nicht gespeichert werden.

> **Ergänzung aus der Nachrecherche: Standards zum Nachlesen**
>
> RFC 9111 (HTTP Caching, Juni 2022) legt fest, welche Antworten gemeinsame Caches speichern und wiederverwenden dürfen. Abschnitt 3.5 behandelt Anfragen mit `Authorization`: Ein gemeinsamer Cache darf die Antwort nur wiederverwenden, wenn sie `must-revalidate`, `public` oder `s-maxage` enthält. Abschnitt 7.3 hält fest, dass `Set-Cookie` das Zwischenspeichern *nicht* verhindert und Server daher passende Cache-Control-Header senden sollen. Beides erklärt die beobachteten Fallen: Weder Nginx noch Apache verlassen sich darauf, dass das Backend alles richtig angibt, und deshalb muss der Betreiber die Ausnahmen kennen. Quelle: rfc-editor.org (abgerufen).

Zu den Strategien für das Entfernen gehören: kurze Lebensdauer (Sekunden bis Minuten, siehe Abschnitt 11.13), versionierte Adressen für statische Dateien (11.6), explizites Löschen und das gezielte Umgehen. Das Löschen ist bei Nginx in der quelloffenen Ausführung nicht als Befehl vorgesehen. Im Test genügte es, die Cache-Datei zu löschen (sie hieß nach dem Hash des Schlüssels, zum Beispiel `cache2/f/49/1cd2...`); die nächste Anfrage zeigte `MISS` und holte die Antwort neu. Das funktioniert, ist aber ein Werkzeug für Notfälle; ein sauberes „Purge“ per Befehl kennt nach dem Kenntnisstand des Autors (nicht abgerufen) die kommerzielle Variante von Nginx. Bei Apache bereinigt das Programm `htcacheclean` den Plattencache (nach Kenntnisstand des Autors, nicht getestet).

Eine weitere Sicherheitsleine ist die Auslieferung *veralteter* Antworten bei Ausfall des Backends. Im Test lief ein Nginx mit `proxy_cache_use_stale error timeout http_500 http_502 http_503 updating`. Nachdem das Backend beendet und der Eintrag abgelaufen war, lieferte Nginx die letzte gute Antwort mit `STALE`, während eine nie gespeicherte Adresse mit einem Fehler beantwortet wurde. Für Besucher sieht eine leicht veraltete Seite besser aus als ein Fehler, und das ist bei vielen Auftritten die richtige Abwägung.

### Typische Fehler.

Die Datenpanne durch gemeinsames Speichern personalisierter Inhalte ist der schwerwiegendste (siehe oben). Der zweite Fehler ist ein Cache ohne Grenze für den Schlüsselraum: Wer Suchanfragen mit beliebigen Parametern zwischenspeichert, füllt die Platte mit Einmal-Einträgen. Der dritte ist, das Backend nicht mit Cache-Control-Headern auszustatten und sich auf Voreinstellungen zu verlassen.

```nginx
# falsch: alles cachen, auch für angemeldete Benutzer
location / { proxy_pass http://app; proxy_cache appcache; proxy_cache_valid 200 5m; }

# richtig: Authorization und Sitzung umgehen den Cache
location / {
    proxy_pass http://app; proxy_cache appcache; proxy_cache_valid 200 5m;
    proxy_cache_bypass $skip_auth $skip_cookie;
    proxy_no_cache     $skip_auth $skip_cookie;
}
```

> **Praxisbeispiel: Cache-Status im Protokoll**
>
> Wer `$upstream_cache_status` ins Zugriffsprotokoll schreibt (Modul 9), kann die *Trefferquote* berechnen: Anteil der `HIT` an allen Anfragen. Eine hohe Quote bedeutet, dass der Cache wirkt, eine niedrige, dass Schlüssel, Lebensdauer oder Header nicht passen. Das ist die wichtigste Kennzahl jedes Caches (siehe Abschnitt 11.8).

## 11.6 Static Asset Optimierung

*Statische Assets* sind Dateien, die sich nicht pro Anfrage ändern: Stylesheets, Skripte, Bilder, Schriften. Sie machen bei den meisten Webseiten den größten Teil der übertragenen Daten aus, und sie lassen sich am besten optimieren, weil man nichts über den einzelnen Besucher wissen muss. Optimierung bedeutet hier drei Dinge: die Dateien kleiner machen, sie seltener übertragen und sie schnell ausliefern. Modul 5 hat die Grundlagen (`Cache-Control`, Kompression, `try_files`) behandelt. Dieser Abschnitt setzt sie zu einem Gesamtkonzept zusammen.

Das wichtigste Prinzip ist das *Fingerprinting*: Der Dateiname enthält einen Hash des Inhalts, zum Beispiel `app.3f9a1c.css`. Ändert sich die Datei, ändert sich der Name; die HTML-Seite verweist auf den neuen Namen. Das erlaubt es, die Datei „für immer“ zwischenspeichern zu lassen, denn eine veraltete Version kann gar nicht mehr abgerufen werden. Zum Ausliefern genügt dann ein langes, unveränderliches Zeitlimit:

```nginx
location /assets/ {
    alias /var/www/shop/assets/;
    expires 1y;
    gzip_static on;
}
```

`expires 1y` erzeugt die Header `Expires` und `Cache-Control: max-age=31536000`. `gzip_static on` liefert vorkomprimierte `.gz`-Dateien aus (Abschnitt 11.4). Im Test kam hinzu, dass zusätzlich ein eigener Header gesetzt wurde: `add_header Cache-Control "public, max-age=31536000, immutable"`. Das Ergebnis waren *zwei* `Cache-Control`-Zeilen in der Antwort: Eine stammte von `expires`, die andere von `add_header`. Nginx fügt hier nichts zusammen. Browser verarbeiten mehrere Zeilen zwar nach festen Regeln, aber das Verhalten ist unübersichtlich und manche Zwischenspeicher reagieren anders. Man sollte pro Pfad genau eine Quelle für den Header benutzen: entweder `expires` oder ein vollständiges `add_header Cache-Control`.

Der Zusatz `immutable` sagt dem Browser, dass sich die Datei garantiert nicht ändert; er fragt dann auch beim Neuladen der Seite nicht nach. Auf Apache-Seite sieht es so aus:

```apache
<Location "/assets/">
    Header set Cache-Control "public, max-age=31536000, immutable"
</Location>
```

Gibt es keinen Fingerprint, bleibt nur die *bedingte Anfrage*. Der Server schickt mit jeder Datei einen `ETag` und `Last-Modified`, und der Browser fragt beim nächsten Mal nach, ob sich etwas geändert hat. Im Test antwortete Nginx auf `If-None-Match` mit dem ETag der Datei in 304 Not Modified, das heißt ohne die Datei selbst zu senden. Das spart die Übertragung, nicht aber die Anfrage; deshalb ist es für Dateien mit Fingerprint das schlechtere Verfahren.

Weitere Hebel sind inhaltlicher Art und liegen außerhalb des Servers, sollten aber im Review beachtet werden: moderne Bildformate (WebP, AVIF) und passende Bildgrößen für die Anzeige, die Schriftart WOFF2, das Zusammenfassen oder Aufteilen von Skripten, wenn HTTP/2 Anfragen bündelt (Modul 6), und das Auslagern auf ein Content-Delivery-Network. Diese Aussagen entsprechen dem allgemeinen Fachwissen des Autors und wurden hier nicht eigens gemessen.

### Typische Fehler.

Der erste Fehler ist ein langes Zeitlimit für Dateien ohne Fingerprint: Wird `style.css` ein Jahr lang zwischengespeichert und danach geändert, sehen Besucher bis zu einem Jahr lang die alte Fassung. Der zweite sind doppelte `Cache-Control`-Header (siehe oben). Der dritte ist ein Fingerprint, der nur im Dateinamen, nicht in der HTML-Seite steht.

```nginx
# falsch: ein Jahr, aber kein Fingerprint im Namen
location /css/ { expires 1y; }          # /css/style.css

# richtig: Fingerprint im Namen erlaubt langes Limit
location /assets/ { expires 1y; }       # /assets/style.3f9a1c.css
# und für HTML kurz bzw. mit Revalidierung
location = /index.html { add_header Cache-Control "no-cache"; }
```

> **Praxisbeispiel: Das Deploy-Muster**
>
> Der Build-Prozess erzeugt Dateien mit Hash im Namen und schreibt sie in ein neues Verzeichnis. Danach wird die HTML-Datei ausgetauscht, die auf die neuen Namen verweist. Alte Dateien bleiben noch einige Zeit liegen, damit Besucher, die noch die alte Seite im Browser haben, nicht ins Leere laufen. Dieses Vorgehen ist die Voraussetzung dafür, Assets bedenkenlos ein Jahr lang cachen zu lassen.

## 11.7 Capacity Tests

Ein *Kapazitätstest* (englisch *capacity test*, oft auch *Lasttest*) beantwortet die Frage: Wie viel Last verträgt das System, und was passiert, wenn es mehr wird? Er unterscheidet sich vom einmaligen Messen der Geschwindigkeit dadurch, dass man die Last schrittweise steigert und beobachtet, *wo* und *wie* das System an seine Grenze kommt. Sinnvoll sind drei Aussagen am Ende: die maximale Durchsatzrate, die noch akzeptable Antwortzeiten liefert (der *Sättigungspunkt*), das Verhalten darüber hinaus (bricht es kontrolliert ein oder fällt es um?) und der begrenzende Engpass.

Dass sich Durchsatz und Latenz bei steigender Parallelität in typischer Form verändern, lässt sich mit einem einfachen Experiment zeigen. Ein Testbackend bearbeitet höchstens acht Anfragen gleichzeitig, jede dauert etwa 100 ms. Davor stand ein Nginx als Proxy mit Keep-Alive zum Backend (Abschnitt 11.2). Mit `ab` wurde die Zahl der gleichzeitigen Verbindungen (`-c`) schrittweise erhöht:

```bash
for c in 1 2 4 8 16 32 64; do
  ab -k -n $((c*40)) -c $c http://127.0.0.1:8208/ \
    | awk -v c=$c '/Requests per second/{r=$4} / 95%/{p=$2} END{print c, r, p}'
done
```

Die Schleife ruft `ab` für jede Parallelität einmal auf (die Zahl der Anfragen wächst mit, damit jeder Lauf aussagekräftig ist) und gibt Parallelität, Anfragen pro Sekunde und die 95-Prozent-Antwortzeit aus. Das Ergebnis:

| **Parallelität** | **Anfragen/s** | **Mittel (ms)** | **95 % (ms)** |
|-----------------:|---------------:|----------------:|--------------:|
|                1 |            6,9 |             145 |           148 |
|                2 |           13,7 |             146 |           148 |
|                4 |           27,1 |             147 |           148 |
|                8 |           54,1 |             148 |           148 |
|               16 |           77,6 |             206 |           208 |
|               32 |           78,6 |             407 |           408 |
|               64 |           79,2 |             808 |           812 |

Die Tabelle zeigt das typische Muster. Bis zu acht gleichzeitigen Anfragen wächst der Durchsatz im gleichen Maß wie die Parallelität, die Antwortzeit bleibt konstant: Das System hat freie Kapazität. Ab 16 Verbindungen flacht der Durchsatz bei rund 79 Anfragen pro Sekunde ab, und die Antwortzeit steigt im gleichen Maß, wie die Parallelität steigt. Das System ist *gesättigt*: Zusätzliche Anfragen erhöhen nicht den Durchsatz, sondern nur das Warten. Der theoretische Wert ist leicht zu begründen: Acht gleichzeitige Verarbeitungsplätze und 100 ms pro Anfrage ergeben höchstens 80 Anfragen pro Sekunde, gemessen wurden 79. Diese Beziehung ist als Gesetz von Little bekannt (Durchsatz mal Verweildauer gleich Zahl der Anfragen im System). Aus ihr lässt sich ohne Messung abschätzen, wie groß ein Pool sein muss.

Wer die Parallelität 64 sieht, sieht auch die Warnung: Der Server ist nicht ausgefallen, er ist „nur“ langsam, und genau das ist die Gefahr. Eine Antwortzeit von 800 ms statt 150 ms ist für Besucher ein Ausfall. Deshalb muss die Obergrenze der Nutzung deutlich *unter* dem Sättigungspunkt liegen (Reserve), und der Alarm muss auf Latenz reagieren, nicht erst auf Fehler.

Methodisch gilt für Kapazitätstests: Erstens muss die Testumgebung der Produktion gleichen, in Hardware, Konfiguration und Datenmenge, sonst sind die Zahlen wertlos. Zweitens muss die Last die echte Nutzung abbilden (Mischung aus Seiten, Dateigrößen, Cache-Treffern), nicht nur eine einzelne Adresse. Drittens darf der Lastgenerator nicht selbst der Engpass sein; auf dem Testsystem dieses Moduls teilten sich Last und Server zwei Kerne, daher sind die Werte nur relativ zu lesen. Viertens sollte man nur Systeme testen, für die man die Erlaubnis hat: Eine Last gegen fremde Server ist ein Angriff und in vielen Ländern strafbar (keine Rechtsberatung). Neben `ab` existieren weitere Werkzeuge wie `wrk`, `k6`, `vegeta`, `locust` oder `JMeter`; sie wurden hier nicht getestet.

### Typische Fehler.

Der erste Fehler ist, nur die *mittlere* Antwortzeit zu betrachten; die Ausreißer (95. %, 99. %) sind für Besucher entscheidend. Der zweite ist, den Test gegen einen kalten Cache laufen zu lassen und das Ergebnis mit dem Betrieb zu vergleichen (oder umgekehrt). Der dritte ist ein Test von nur einer Minute, der Speicherlecks und Verbindungsstaus gar nicht sichtbar macht.

```bash
# falsch: eine Stufe, nur der Mittelwert
ab -n 1000 -c 50 http://test.example/ | grep "Time per request"

# richtig: Stufen, Perzentile, mehrfach
for c in 10 20 40 80 160; do
  ab -k -n $((c*100)) -c $c -e stufe_$c.csv http://test.example/
done
```

> **Praxisbeispiel: Vor dem Kampagnenstart**
>
> Vor einer Werbeaktion fragt das Marketing: „Hält die Seite das Zehnfache?“ Eine ehrliche Antwort liefert nur ein Test mit gestufter Last auf einer Kopie der Produktionsumgebung. Das Ergebnis ist ein Satz wie „Bis 400 Anfragen pro Sekunde bleibt die Antwortzeit unter 300 ms; darüber steigt sie, ab 520 treten Fehler auf, der Engpass ist die Datenbank“. Mit so einem Satz kann man entscheiden, ob man vorher aufrüsten muss.

## 11.8 Performance Monitoring

*Performance Monitoring* ist die laufende Beobachtung der Leistung im Betrieb. Während ein Lasttest eine Momentaufnahme unter künstlichen Bedingungen ist, zeigt das Monitoring, was echte Besucher erleben, und es macht Veränderungen sichtbar, bevor sie zum Ausfall werden. Modul 9 hat die Werkzeuge vorgestellt (Zugriffsprotokoll, `mod_status`, `stub_status`, Dashboards). Hier geht es darum, welche Kennzahlen für die Leistung wichtig sind und wie man sie gewinnt.

Eine bewährte Ordnung für die Kennzahlen eines Dienstes kennt vier Größen: *Latenz* (wie lange dauern Anfragen), *Verkehr* (wie viele), *Fehler* (wie viele scheitern) und *Sättigung* (wie nah ist das System an der Grenze). Die Aufstellung ist als „vier goldene Signale“ aus dem Betrieb großer Dienste bekannt; der Autor gibt sie nach seinem Kenntnisstand wieder und hat ihre Quelle hier nicht abgerufen. Für einen Webserver lassen sich diese Größen direkt zuordnen.

Die Latenz holt man am besten aus dem Zugriffsprotokoll, indem man die Dauer protokolliert. Nginx bietet `$request_time` (gesamte Dauer) und `$upstream_response_time` (Zeit des Backends), Apache `%D` (Mikrosekunden, Modul 9). Wichtig sind Perzentile, nicht der Mittelwert, weil wenige langsame Anfragen im Mittel verschwinden. Ein Beispiel mit `$upstream_cache_status` für die Cache-Wirkung:

```nginx
log_format perf '$remote_addr [$time_local] "$request" $status $body_bytes_sent '
                'rt=$request_time urt=$upstream_response_time cache=$upstream_cache_status';
access_log /var/log/nginx/perf.log perf;
```

Die Formatzeile fügt die drei Leistungsfelder an die übliche Protokollzeile an. Im Test ergab sich eine Zeile wie `... "GET /seite1 HTTP/1.1" 200 30 rt=0.003 urt=0.003 cache=MISS`. Aus einer solchen Datei lassen sich mit wenigen Befehlen die wichtigsten Zahlen berechnen:

```bash
# Trefferquote des Caches
awk '{for(i=1;i<=NF;i++) if($i ~ /^cache=/){split($i,a,"=");c[a[2]]++;n++}}
     END{for(k in c) printf "%s %d (%.0f %%)\n",k,c[k],100*c[k]/n}' perf.log

# Perzentile der Antwortzeit
awk '{for(i=1;i<=NF;i++) if($i ~ /^rt=/){split($i,a,"=");print a[2]}}' perf.log \
  | sort -n | awk '{v[NR]=$1} END{printf "n=%d p50=%s p95=%s max=%s\n",NR,v[int(NR*0.5)+1],v[int(NR*0.95)],v[NR]}'
```

Das erste Programm läuft über jede Zeile, sucht das Feld, das mit `cache=` beginnt, und zählt die Werte; am Ende gibt es die Anteile aus. Das zweite sammelt alle Antwortzeiten, sortiert sie numerisch und liest den Wert an der Stelle 50 bzw. 95 Prozent ab. Im Test mit 51 Anfragen lag die Trefferquote bei 69 Prozent (35 `HIT`, 15 `MISS`, eine Anfrage ohne Cache-Pfad), der Median der Antwortzeit bei 0,000 Sekunden (unter einer Millisekunde, Rundung auf drei Stellen) und das 95. Perzentil bei 0,204 Sekunden, verursacht durch die absichtlich langsamen Anfragen. Dieses Muster, „der Median ist unauffällig, das hintere Ende nicht“, ist im Betrieb typisch und zeigt, warum man Perzentile braucht.

Den Verkehr und die Sättigung liefern die Statusseiten. Der Nginx-Baustein `stub_status` gibt vier Gruppen von Zahlen:

```text
Active connections: 1
server accepts handled requests
 3 3 3
Reading: 0 Writing: 1 Waiting: 0
```

`Active connections` sind die aktuell offenen Verbindungen. `accepts` und `handled` zählen angenommene und bearbeitete Verbindungen; wenn `handled` kleiner ist als `accepts`, wurden Verbindungen wegen eines Limits abgewiesen (zum Beispiel `worker_connections`, Abschnitt 11.9). `requests` ist die Gesamtzahl der Anfragen. `Reading`, `Writing` und `Waiting` sagen, in welchem Zustand die Verbindungen sind; `Waiting` sind die untätigen Keep-Alive-Verbindungen. Bei Apache liefert `server-status?auto` die entsprechenden Zahlen (`BusyWorkers`, `IdleWorkers`, `ConnsAsync...`), wie in 11.1 gezeigt. Diese Werte sind Zählerstände, die sich laufend erhöhen; aus der Veränderung über die Zeit gewinnt man Anfragen pro Sekunde, und diese Berechnung übernimmt ein Überwachungssystem.

> **Ergänzung aus der Nachrecherche: Exporter für Prometheus**
>
> Wer Nginx-Kennzahlen in ein Überwachungssystem wie Prometheus einspeisen will, kann den `nginx-prometheus-exporter` verwenden. Laut dessen README (abgerufen) liest er die Daten von `stub_status` und stellt sie unter dem Pfad `/metrics` auf Port 9113 bereit; die Statusseite wird dabei beispielsweise unter `/stub_status` auf Port 8080 erwartet. Weil `stub_status` nur die in diesem Abschnitt gezeigten wenigen Zähler enthält, erhält man damit Verkehr und Verbindungszustände, aber keine Latenzverteilung; dafür bleibt das Zugriffsprotokoll nötig. Die Statusseite darf nie öffentlich erreichbar sein (Modul 10).

### Typische Fehler.

Der erste Fehler ist, nur Verfügbarkeit zu überwachen („die Seite antwortet“) und nicht die Latenz. Der zweite ist, Mittelwerte statt Perzentile zu alarmieren. Der dritte sind Dashboards ohne Schwellenwerte: Eine Grafik, die niemand ansieht, verhindert keinen Ausfall.

```text
falsch:  Alarm "durchschnittliche Antwortzeit > 2 s"      (Ausreißer verschwinden)
richtig: Alarm "95. Perzentil der Antwortzeit > 800 ms
         über 5 Minuten" plus "Fehlerquote > 1 %"
```

> **Praxisbeispiel: Ein Gefühl für „normal“**
>
> Die wertvollste Beobachtung im Monitoring ist die Abweichung vom Üblichen. Wer ein paar Wochen lang Trefferquote, 95. Perzentil und Anfragen pro Sekunde aufzeichnet, erkennt an einem Dienstagmorgen, dass etwas nicht stimmt, auch wenn kein Schwellenwert überschritten ist: Die Trefferquote ist von 80 auf 30 Prozent gefallen, weil nach einer Auslieferung die Cache-Header fehlen. Ohne Vergleichswerte wäre das nur ein Gefühl.

## 11.9 Worker Tuning

Nginx arbeitet anders als Apache: Es startet wenige *Arbeitsprozesse* (englisch *worker processes*), und jeder Prozess bearbeitet viele Verbindungen gleichzeitig mit einer Ereignisschleife (kein Thread pro Verbindung). Die zwei Stellschrauben heißen `worker_processes` und `worker_connections`. Die Obergrenze gleichzeitiger Verbindungen ist ihr Produkt, begrenzt durch das Betriebssystem, das pro Prozess nur eine bestimmte Zahl offener Dateien erlaubt.

`worker_processes` legt fest, wie viele Arbeitsprozesse laufen. Weil ein Prozess zu einem Zeitpunkt auf einem Kern rechnet, ist die übliche Empfehlung, ihn auf die Zahl der Kerne zu setzen. Der Wert `auto` erledigt das. Die Ubuntu-Datei `nginx.conf` setzt `worker_processes auto;` und `worker_connections 768;`. Mehr Prozesse als Kerne bringen nichts, solange die Arbeit überwiegend Rechenzeit ist; bei vielen blockierenden Plattenzugriffen können sie nach dem Kenntnisstand des Autors (nicht getestet) helfen.

`worker_connections` legt fest, wie viele Verbindungen ein Prozess gleichzeitig halten darf. Zu den Verbindungen zählen neben den Clients auch die Verbindungen zu Backends: Ein Reverse Proxy braucht für jede Anfrage eine Verbindung zum Client *und* eine zum Backend, so dass sich die nutzbare Zahl an Besuchern ungefähr halbiert. Was passiert, wenn der Wert zu klein ist? Im Test lief ein Nginx mit `worker_connections 16`, und 30 Verbindungen wurden gleichzeitig geöffnet. Das Fehlerprotokoll meldete `[warn] 16 worker_connections are not enough, reusing connections`, und von den 30 Verbindungen wurden nur 13 beantwortet: Nginx schloss die ältesten untätigen Verbindungen, um neue annehmen zu können. Für Besucher äußert sich das als abgebrochene Verbindungen, ohne dass der Server „voll“ aussieht.

```nginx
user www-data;
worker_processes  auto;
worker_rlimit_nofile 65536;

events {
    worker_connections 8192;
}
```

Das Beispiel zeigt die drei Größen, die zusammenpassen müssen. `worker_connections 8192` erlaubt pro Prozess 8192 Verbindungen. Damit sie wirklich geöffnet werden können, muss das Betriebssystem so viele *Dateideskriptoren* (offene Dateien und Sockets) pro Prozess erlauben; `worker_rlimit_nofile 65536` hebt die Grenze für die Arbeitsprozesse an. Was passiert, wenn die Grenze zu niedrig ist, zeigte der Test: Mit `ulimit -n 20` und `worker_connections 1024` meldete Nginx schon beim Start `[warn] 1024 worker_connections exceed open file resource limit: 20`, und beim Öffnen vieler Verbindungen `[crit] accept4() failed (24: Too many open files)`. Der Fehler 24 (`EMFILE`) ist das klassische Zeichen für ein zu niedriges Dateilimit. Beim Versuch, im Test `worker_rlimit_nofile 4096` zu verwenden, lehnte die Testumgebung das Anheben der Obergrenze ab (`setrlimit(RLIMIT_NOFILE, 4096) failed (1: Operation not permitted)`); auf einem normalen Server mit root-Rechten des Hauptprozesses geht es nach der Dokumentation, was hier aber nicht belegt werden konnte.

Unter `systemd` wird das Limit in der Diensteinheit gesetzt (`LimitNOFILE=65536` im Abschnitt `[Service]`, Modul 2), denn die Shell-Befehle `ulimit` gelten für den Dienst nicht. Zur Kontrolle liest man die laufende Grenze aus: `grep "open files" /proc/<PID>/limits`. Weitere Einstellungen im `events`-Block, die nach dem Kenntnisstand des Autors (nicht abgerufen und nicht getestet) von Bedeutung sein können, sind `multi_accept`, `accept_mutex` und die Listen-Option `reuseport`, die Verbindungen gleichmäßiger auf die Prozesse verteilt; ihre Wirkung hängt stark von der Last ab und sollte nur nach Messung geändert werden.

Das Gegenstück bei Apache sind die in Abschnitt 11.1 beschriebenen Direktiven; auch dort gilt, dass das Dateilimit des Dienstes zur Zahl der Verbindungen passen muss. Der gemeinsame Gedanke lautet: Die Zahl der erlaubten Verbindungen ist eine Kette aus mehreren Gliedern (Serverkonfiguration, Dateilimit, Speicher, Backend-Kapazität), und das schwächste Glied bestimmt das Ergebnis.

### Typische Fehler.

Der erste Fehler ist `worker_connections` zu erhöhen, ohne das Dateilimit anzuheben (siehe oben). Der zweite ist `worker_processes` deutlich über die Kernzahl zu setzen, in der Hoffnung auf mehr Leistung. Der dritte ist, `ulimit` in der Shell zu setzen und zu glauben, es gelte für den `systemd`-Dienst.

```bash
# falsch: Limit nur in der eigenen Shell gesetzt
ulimit -n 65536 && systemctl restart nginx

# richtig: Limit in der Diensteinheit
sudo systemctl edit nginx
#   [Service]
#   LimitNOFILE=65536
sudo systemctl restart nginx
grep "open files" /proc/$(cat /run/nginx.pid)/limits
```

> **Praxisbeispiel: Die Meldung im Fehlerprotokoll**
>
> Zwei Zeilen im Fehlerprotokoll sollten Alarme auslösen: `worker_connections are not enough` und `Too many open files`. Beide bedeuten, dass der Server Besucher abweist, ohne dass er „abgestürzt“ wäre. Nach der Anhebung der Werte sollte man den Test aus Abschnitt 11.7 wiederholen, um zu sehen, ob der Engpass nur weitergewandert ist.

## 11.10 Buffers

Ein *Puffer* (englisch *buffer*) ist ein Zwischenspeicher im Arbeitsspeicher, der Daten aufnimmt, solange Sender und Empfänger unterschiedlich schnell sind. Bei einem Webserver treten Puffer an mehreren Stellen auf: beim Lesen des Anfragekopfs und -körpers vom Client, beim Lesen der Backend-Antwort und beim Schreiben zum Client. Sie sind wichtig, weil Clients und Backends oft sehr unterschiedlich schnell sind. Ein Mobilfunkkunde nimmt 200 kB pro Sekunde auf, ein Backend liefert 200 MB pro Sekunde. Ohne Puffer müsste das Backend für die gesamte Dauer der Übertragung warten und seinen Arbeitsprozess blockieren. Mit einem Puffer übergibt das Backend die Antwort schnell an den Proxy und ist frei, während der Proxy sie dem langsamen Client zustellt. Modul 7 hat dieses Prinzip beschrieben; hier geht es um die Dimensionierung und die Fehlerbilder.

Nginx kennt für den Proxy-Weg die Direktiven `proxy_buffering`, `proxy_buffer_size`, `proxy_buffers` und `proxy_max_temp_file_size`. Nach der Dokumentation (abgerufen) ist `proxy_buffering` eingeschaltet, `proxy_buffers` hat den Standard acht Puffer von je einer Speicherseite (4 oder 8 kB), `proxy_buffer_size` ist der Puffer für den Antwortkopf, und passt die Antwort nicht in die Puffer, kann Nginx einen Teil in eine temporäre Datei schreiben, bis zu der Obergrenze von 1024 MB. Steht `proxy_max_temp_file_size 0`, wird nicht auf die Platte ausgelagert. Wichtig ist: Das Auslagern geschieht nur, wenn der Client langsamer liest, als das Backend liefert. Ein schneller Client auf einer schnellen Verbindung füllt die Puffer nicht.

Das ließ sich im Test nachvollziehen. Eine Datei von 270 kB, über den Proxy abgerufen, erzeugte keine Meldung, auch nicht mit einem gedrosselten Client; die Datei passte in das, was Betriebssystem und Puffer aufnehmen konnten. Mit einer Datei von 20 MB und einem auf 5 MB pro Sekunde gedrosselten Client dagegen schrieb Nginx ins Fehlerprotokoll: `[warn] an upstream response is buffered to a temporary file /tmp/m11/tmp_proxy/0000000002 while reading upstream`. Die Meldung ist ein Hinweis, kein Fehler, aber sie zeigt, dass jede dieser Übertragungen Plattenzugriffe verursacht.

```nginx
location /download/ {
    proxy_pass http://127.0.0.1:8201/;
    proxy_buffers 64 8k;          # 512 kB Puffer pro Verbindung
}
location /stream/ {
    proxy_pass http://127.0.0.1:8201/;
    proxy_buffering off;          # sofort weiterreichen
}
```

Der erste Block vergrößert die Puffer, damit mittlere Antworten komplett im Arbeitsspeicher bleiben. Das kostet Speicher: 512 kB pro gleichzeitiger Verbindung bedeuten bei 1000 Verbindungen eine halbe Gigabyte. Der zweite Block schaltet das Puffern aus. Das ist nötig für Antworten, die der Client sofort sehen soll, etwa ereignisgesteuerte Datenströme (Server-Sent Events) oder lange laufende Berichte, die Zeile für Zeile ausgegeben werden. Der Preis: Das Backend ist während der gesamten Übertragung gebunden.

Auf der Seite der Anfrage gilt Ähnliches. `client_body_buffer_size` bestimmt, wie viel vom Anfragekörper im Arbeitsspeicher gehalten wird. Im Test mit `client_body_buffer_size 16k` meldete Nginx beim Senden von 100 kB per `POST`: `[warn] a client request body is buffered to a temporary file`. Bei `client_body_buffer_size 512k` blieb die Meldung aus. Das Auslagern ist harmlos, wenn es selten vorkommt, und teuer, wenn jede Anfrage betroffen ist.

Eine dritte Gruppe betrifft den Anfragekopf. `client_header_buffer_size` und `large_client_header_buffers` begrenzen Kopfzeilen und die angefragte Adresse. Im Test mit `large_client_header_buffers 4 1k` antwortete Nginx auf eine Kopfzeile von 3000 Zeichen mit `400 Bad Request` und auf eine Adresse von 3000 Zeichen mit `414 Request-URI Too Large`. Das ist erwünscht als Schutz (Modul 10), wird aber zum Fehler, wenn legitime Anfragen große Cookies mitschicken, zum Beispiel wenn eine Anwendung viele Sitzungsdaten im Cookie ablegt. Bei Apache entsprechen `LimitRequestFieldSize` und `LimitRequestLine` diesen Grenzen (Modul 10). Eigene Puffer für Proxy-Verbindungen kennt Apache nach dem Kenntnisstand des Autors (nicht geprüft) mit `ProxyIOBufferSize`; die Einstellungen `SendBufferSize` und `ReceiveBufferSize` beeinflussen den Puffer des Betriebssystems für Verbindungen.

### Typische Fehler.

Der erste ist, `proxy_buffering off` global zu setzen, „weil Streaming gebraucht wird“: Damit gehen die Vorteile für alle anderen Anfragen verloren. Der zweite sind riesige Puffer für alle: Sie multiplizieren sich mit der Zahl der Verbindungen. Der dritte ist, einen Fehler wie `400 Request Header Or Cookie Too Large` durch ein unbegrenztes Vergrößern zu beheben, statt die Größe der Cookies zu hinterfragen.

```nginx
# falsch: für alle ausschalten
http { proxy_buffering off; }

# richtig: nur dort, wo Streaming nötig ist
location /events/ { proxy_pass http://app; proxy_buffering off; }
```

> **Praxisbeispiel: Antwortköpfe mit vielen Cookies**
>
> Ein typischer Praxisfall: Nach einem Update meldet der Proxy `502 Bad Gateway`, im Fehlerprotokoll steht `upstream sent too big header while reading response header from upstream`. Die Anwendung schickt jetzt mehr Cookies oder längere Header, als in `proxy_buffer_size` (Standard eine Seite) passen. Die Lösung ist, den Wert moderat zu erhöhen (zum Beispiel `proxy_buffer_size 16k`), nachdem man die Header gemessen hat. Der Meldungstext ist nach dem Kenntnisstand des Autors typisch für diesen Fall und wurde hier nicht eigens reproduziert.

## 11.11 sendfile

Ein Webserver, der eine statische Datei ausliefert, muss sie vom Datenträger zum Netzwerk bringen. Der klassische Weg lautet: Der Server liest die Datei mit einem Systemaufruf in seinen Arbeitsspeicher und schreibt sie mit einem zweiten Aufruf auf die Verbindung. Dabei werden die Daten vom Kernel in den Speicher des Programms und wieder zurück in den Kernel kopiert. *sendfile* ist ein Systemaufruf des Betriebssystems, der diese Umwege abkürzt: Der Server sagt dem Kernel „sende diese Datei auf jene Verbindung“, und der Kernel erledigt es ohne Kopie in den Programmspeicher (*zero copy*).

Der Unterschied ist an den Systemaufrufen sichtbar. Dafür wurde der Arbeitsprozess von Nginx mit `strace -f -c -p <PID>` beobachtet; die Option `-c` zählt Systemaufrufe, und `-f` schließt Unterprozesse ein. Es wurden 20 Anfragen auf eine Datei von 20 MB ausgeführt, also 400 MB in Summe. Mit `sendfile off` brauchte der Prozess 12 220 Aufrufe von `pread64` (Lesen) und 11 919 von `writev` (Schreiben). Mit `sendfile on` waren es 469 Aufrufe von `sendfile` und 20 von `writev` (für die Antwortköpfe). Das sind rund 50-mal weniger Systemaufrufe, und die Daten wurden nicht durch den Speicher des Programms bewegt. Bei 2000 kleinen Anfragen auf eine Sechs-Byte-Datei zeigte sich kein Gewinn; hier steckt der Aufwand im Verbindungs- und Protokollteil, und `sendfile` kostete pro Anfrage genauso einen Aufruf wie ein normales Schreiben. Das Beispiel zeigt: `sendfile` lohnt sich vor allem bei großen Dateien.

```nginx
http {
    sendfile    on;
    tcp_nopush  on;
    tcp_nodelay on;
}
```

`sendfile on` schaltet den Mechanismus ein; die Ubuntu-Konfiguration setzt ihn bereits. `tcp_nopush on` wirkt nur zusammen mit `sendfile` und weist das Betriebssystem an, den Antwortkopf und den Anfang der Datei in möglichst wenigen großen Netzwerkpaketen zu senden, statt viele kleine. `tcp_nodelay on` schaltet das Zusammenfassen kleiner Pakete (den Nagle-Algorithmus) für Verbindungen im Keep-Alive-Zustand ab, damit kleine Antworten ohne Verzögerung gesendet werden. Die Wirkung der beiden letzten Optionen ist laut allgemeinem Fachwissen des Autors (nicht gemessen) gering und zeigt sich vor allem bei bestimmten Lastprofilen.

Bei Apache heißt die Direktive `EnableSendfile`, und sie hat eine Gegenspielerin, `EnableMMAP`. Nach dem Kenntnisstand des Autors (nicht abgerufen) ist `EnableSendfile` in Apache 2.4 standardmäßig ausgeschaltet. Der Grund ist, dass `sendfile` auf manchen Dateisystemen Probleme macht, etwa auf Netzwerklaufwerken (NFS, SMB) oder bei virtualisierten Ordnern, die Datei-Inhalte nicht zuverlässig an den Kernel melden. Dort kann der Aufruf stocken oder alte Inhalte liefern. Wer Dateien von einer lokalen Platte ausliefert, kann `EnableSendfile On` erwägen und sollte es messen.

```apache
EnableSendfile On
EnableMMAP     Off
```

Die erste Zeile erlaubt `sendfile`, die zweite verbietet das Einblenden von Dateien in den Speicher (`mmap`); die zweite Einstellung ist ebenfalls für Netzlaufwerke üblich, weil eine Datei, die während des Lesens verkürzt wird, einen `mmap`-Zugriff zum Absturz bringen kann. Beide Aussagen entsprechen dem Fachwissen des Autors und wurden nicht getestet.

Es gibt eine Einschränkung, die oft vergessen wird: Bei verschlüsselten Verbindungen (HTTPS) muss die Datei vor dem Senden verschlüsselt werden. Der Kernel kann das nur in besonderen Konfigurationen selbst übernehmen. Nach dem Kenntnisstand des Autors (nicht geprüft) ist `sendfile` deshalb bei TLS meist ohne den beschriebenen Gewinn, weil die Daten ohnehin durch den Speicher des Servers laufen müssen. Der Nutzen von `sendfile` sinkt damit für Auftritte, die vollständig über HTTPS laufen, was heute fast alle sind.

### Typische Fehler.

Der erste Fehler ist, `sendfile` auf einem Netzlaufwerk zu aktivieren und danach Phantomprobleme zu jagen (abgeschnittene oder veraltete Dateien). Der zweite ist, `sendfile` als Allheilmittel zu betrachten: Bei dynamischen Antworten spielt es keine Rolle. Der dritte ist, `tcp_nopush` ohne `sendfile` zu setzen, wo es wirkungslos ist.

```nginx
# falsch: ohne sendfile bleibt tcp_nopush ohne Wirkung
http { tcp_nopush on; }

# richtig: beide zusammen
http { sendfile on; tcp_nopush on; }
```

> **Praxisbeispiel: Messung statt Glaube**
>
> Bei jeder Optimierung dieser Art hilft `strace -c`, denn es zeigt, ob der erwartete Systemaufruf tatsächlich benutzt wird. Zeigt die Statistik `sendfile` nicht, obwohl die Option an ist (zum Beispiel wegen TLS oder weil Nginx die Datei durch einen Filter laufen lässt, etwa Kompression), ist die Einstellung wirkungslos. Der Befehl ist eine harmlose Beobachtung, belastet den Prozess aber spürbar; auf Produktionssystemen nur kurz und mit Bedacht einsetzen.

## 11.12 open_file_cache

Bevor Nginx eine statische Datei ausliefern kann, muss es sie finden und öffnen: den Pfad auflösen, die Berechtigungen prüfen, die Größe und das Änderungsdatum bestimmen, die Datei öffnen. Jeder dieser Schritte ist ein Systemaufruf. Bei einem Auftritt mit wenigen, immer wieder abgerufenen Dateien wiederholt der Server dieselbe Arbeit tausendfach. Der *open_file_cache* merkt sich die Ergebnisse (geöffnete Dateien, Größen, Zeiten, auch das Fehlen von Dateien) im Arbeitsspeicher, so dass spätere Anfragen die Aufrufe sparen.

Die Wirkung ist wieder mit `strace` sichtbar. Es wurden 2000 Anfragen auf eine kleine Datei gestellt. Ohne Cache zählte der Arbeitsprozess 2000 Aufrufe von `openat` (Datei öffnen), 2000 von `fstat` (Dateiinformation) und 4000 von `close`. Mit Cache waren es genau ein `openat`, ein `fstat` und 2000 `close`; die 2000 Schließvorgänge entsprechen den Client-Verbindungen. Die Datei wurde also nur einmal geöffnet und für alle weiteren Anfragen wiederverwendet.

```nginx
http {
    open_file_cache          max=1000 inactive=20s;
    open_file_cache_valid    30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors   on;
}
```

`max=1000` begrenzt die Zahl der gemerkten Dateien; bei Überschreitung werden die am längsten ungenutzten entfernt. `inactive=20s` entfernt Einträge, die 20 Sekunden lang nicht benutzt wurden. `open_file_cache_valid 30s` legt fest, nach welcher Zeit Nginx die Angaben erneut prüft. `open_file_cache_min_uses 2` verlangt zwei Zugriffe, bevor eine Datei im Cache bleibt. `open_file_cache_errors on` merkt sich auch, dass eine Datei fehlt (die Bedeutung dieser Optionen entspricht der Beschreibung im Fachwissen des Autors und den Beobachtungen unten; die Dokumentation zu `open_file_cache` wurde hier nicht abgerufen).

Die Gefahr ist die *Veralterung*. Das ließ sich im Test deutlich beobachten. Bei `open_file_cache_valid 30s` wurde die Datei `v.txt` mit dem Inhalt `A` abgerufen. Danach wurde sie durch eine neue Datei mit dem Inhalt `B` ersetzt (Schreiben in eine Hilfsdatei, dann `mv`). Die nächste Anfrage lieferte weiterhin `A`. Dann wurde die Datei erneut überschrieben (Inhalt `C`), die Anfrage lieferte `A`. Schließlich wurde die Datei gelöscht (`rm`), und Nginx antwortete weiterhin mit `200`. Der Grund: Nginx hält die ursprüngliche Datei geöffnet und liest sie weiter, auch wenn sie im Verzeichnis nicht mehr existiert. Danach wurde die Datei neu angelegt (Inhalt `C`); erst nach Ablauf der 30 Sekunden lieferte die nächste Anfrage diesen neuen Inhalt.

Diese Verzögerung ist beim Ausrollen neuer Versionen wichtig. Wer eine Webseite durch Überschreiben einzelner Dateien aktualisiert, sieht die Änderungen bis zu `open_file_cache_valid` Sekunden später oder gar inkonsistente Zustände (neue HTML-Datei, alte CSS-Datei). Die saubere Lösung ist, jede Version in ein eigenes Verzeichnis zu legen und einen Verweis (Symlink) umzuschalten (siehe Modul 12); mit einem kurzen Gültigkeitswert und Hash-Dateinamen (Abschnitt 11.6) hält sich der Effekt in Grenzen.

Bei Apache übernimmt eine vergleichbare Aufgabe das Modul `mod_file_cache` mit den Direktiven `CacheFile` und `MMapFile`, das Dateien beim Start in den Speicher lädt. Es ist im Ubuntu-Paket enthalten, wurde aber nicht getestet; nach dem Kenntnisstand des Autors ist es für wenige, sehr oft abgerufene und unveränderliche Dateien gedacht, und Änderungen an den Dateien werden erst nach einem Neustart sichtbar.

### Typische Fehler.

Der erste ist, den Cache auf einem System mit häufigen Dateiänderungen einzuschalten und lange Gültigkeiten zu setzen. Der zweite ist, die Wirkung zu überschätzen: Das Betriebssystem hält selbst Verzeichnis- und Dateiinformationen im Cache; der Gewinn zeigt sich deshalb vor allem bei sehr hohen Anfragezahlen auf kleine Dateien. Der dritte ist, `max` zu klein zu wählen, so dass der Cache ständig verdrängt.

```nginx
# falsch: lange Gültigkeit bei Dateien, die per Hand überschrieben werden
open_file_cache_valid 10m;

# richtig: kurz, oder Deployment über neue Verzeichnisse
open_file_cache_valid 5s;
```

> **Praxisbeispiel: „Ich sehe die Änderung nicht“**
>
> Ein Entwickler lädt eine korrigierte Datei hoch, und im Browser erscheint weiterhin die alte Fassung. Bevor man den Browser-Cache beschuldigt, sollte man `curl` vom Server selbst benutzen und prüfen, ob `open_file_cache` (oder ein vorgeschalteter Cache) beteiligt ist. Warten bis zum Ablauf von `open_file_cache_valid` oder ein Neuladen mit `nginx -s reload` klärt die Frage.

## 11.13 Microcaching

*Microcaching* ist ein Cache mit extrem kurzer Lebensdauer, typischerweise eine bis zehn Sekunden. Es klingt zu kurz, um nützlich zu sein, doch bei vielen Anfragen pro Sekunde ist es sehr wirksam. Der Gedanke: Wenn eine Seite hundertmal pro Sekunde angefragt wird, genügt es, sie einmal pro Sekunde vom Backend zu holen und die übrigen 99 Anfragen aus dem Cache zu bedienen. Besucher sehen höchstens eine Sekunde alte Inhalte, das Backend wird um den Faktor hundert entlastet. Anders als langlebige Caches (Abschnitt 11.5) braucht Microcaching kaum Ungültigmachen, weil die Daten ohnehin in Sekunden ablaufen.

Im Test wurde ein Nginx-Cache mit einer Sekunde Gültigkeit vor ein Python-Backend gestellt, das etwa 580 Anfragen pro Sekunde schafft. Es wurden 3000 Anfragen mit 20 gleichzeitigen Verbindungen auf dieselbe Adresse gestellt. Der Lauf dauerte 0,215 Sekunden (rund 13 980 Anfragen pro Sekunde), und das Backend zählte genau eine Anfrage. Dasselbe direkt am Backend dauerte 5,17 Sekunden (580 Anfragen pro Sekunde, 3000 Backend-Aufrufe). Diese Zahl ist ein Extremfall, weil alle Anfragen innerhalb einer Sekunde eintrafen und dieselbe Adresse betrafen; sie zeigt aber das Prinzip.

```nginx
map $http_authorization $skip_auth   { default 1; "" 0; }
map $http_cookie        $skip_cookie { default 0; ~*sessionid 1; }

location / {
    proxy_pass http://127.0.0.1:9101;
    proxy_cache appcache;
    proxy_cache_valid 200 1s;
    proxy_cache_lock on;
    proxy_cache_use_stale updating error timeout http_500 http_502 http_503;
    proxy_cache_background_update on;
    proxy_cache_bypass $skip_auth $skip_cookie;
    proxy_no_cache     $skip_auth $skip_cookie;
}
```

Vier Zeilen verdienen eine genaue Erklärung. `proxy_cache_valid 200 1s` ist die eigentliche Lebensdauer. `proxy_cache_lock on` verhindert den *Cache Stampede* (auch *Thundering Herd*): Wenn ein Eintrag abgelaufen ist und gleichzeitig viele Anfragen eintreffen, würde ohne Sperre jede einzelne das Backend befragen. Mit der Sperre darf nur eine Anfrage den Eintrag neu holen; die anderen warten (laut Dokumentation höchstens fünf Sekunden) und bekommen dann das Ergebnis. `proxy_cache_use_stale updating` erlaubt, während der Aktualisierung die alte Antwort auszuliefern, und `proxy_cache_background_update on` aktualisiert im Hintergrund, so dass kein Besucher auf das Backend warten muss. Die beiden `bypass`-Zeilen nehmen angemeldete Besucher aus (Abschnitt 11.5).

Die Wirkung der Sperre wurde ebenfalls gemessen. Bei leerem Cache wurden 20 gleichzeitige Anfragen auf eine Adresse gestellt, die das Backend jeweils 0,2 Sekunden festhielt. Mit `proxy_cache_lock on` sah das Backend genau eine Anfrage, mit `proxy_cache_lock off` alle 20. Bei einem Backend, das für diese Antwort eine teure Datenbankabfrage braucht, ist das der Unterschied zwischen einem unbemerkten Ablauf und einem Lastspitzen-Ausfall.

Wann ist Microcaching geeignet? Für Inhalte, die für alle Besucher gleich sind und bei denen eine Sekunde Verzögerung nicht stört: Startseiten, Nachrichtenlisten, Katalogseiten, öffentliche API-Antworten. Ungeeignet ist es für alles Persönliche (Warenkorb, Konto), für Schreibzugriffe (`POST`) und für Daten, bei denen Aktualität wichtig ist (Kontostände, Lagerbestand beim Kauf). Der Schlüssel muss alles enthalten, was die Antwort beeinflusst: Wenn eine Seite je nach Sprachheader oder Gerät unterschiedlich aussieht, gehört dieses Merkmal in den Schlüssel oder in `Vary`. Bei Apache bietet `mod_cache` mit `CacheLock on` laut Dokumentation (abgerufen, übersetzte Fassung) ebenfalls eine Sperre gegen den Stampede; sie ist standardmäßig aus, und ihre Wirkung wurde hier nicht getestet.

### Typische Fehler.

Der gefährlichste Fehler ist Microcaching ohne Ausnahme für angemeldete Besucher (siehe 11.5). Der zweite ist ein Schlüssel, der Abfrageparameter ignoriert und damit verschiedene Seiten vermischt. Der dritte ist, `proxy_cache_lock` zu vergessen und beim Ablauf des Eintrags eine Lastspitze zu erzeugen.

```nginx
# falsch: Schlüssel ohne Host und Query, mehrere Sites vermischt
proxy_cache_key $uri;

# richtig: alles Relevante im Schlüssel
proxy_cache_key $scheme$host$request_uri;
```

> **Praxisbeispiel: Das Backend vor dem Ansturm schützen**
>
> Ein Nachrichtenportal erlebt bei einer Eilmeldung zehnfachen Verkehr auf wenigen Seiten. Das Backend ist darauf nicht ausgelegt. Eine Einsekunden-Zwischenspeicherung mit Sperre und `updating` fängt den Ansturm ab: Egal, wie viele Besucher kommen, das Backend sieht pro Seite höchstens eine Anfrage pro Sekunde. Eine Redaktion kann ohne Weiteres mit einer Sekunde Verzögerung leben.

## 11.14 Benchmarking

*Benchmarking* ist das systematische Messen der Leistung unter kontrollierten, wiederholbaren Bedingungen, mit dem Ziel, Konfigurationen zu vergleichen. Es unterscheidet sich vom Kapazitätstest (Abschnitt 11.7) im Ziel: Dort fragt man „Wie viel hält mein System aus?“, hier „Ist Variante A schneller als Variante B?“. Beides nutzt dieselben Werkzeuge, aber das zweite verlangt strengere Methodik, weil man oft kleine Unterschiede beurteilen will.

Wie schwer es ist, verlässlich zu messen, zeigte ein einfacher Versuch. Derselbe Befehl (`ab -k -n 5000 -c 10` auf eine statische Datei) wurde siebenmal hintereinander ausgeführt, ohne dass etwas verändert wurde. Die sortierten Ergebnisse in Anfragen pro Sekunde lauteten: 29 351, 48 783, 71 024, 74 054, 74 123, 75 447 und 78 952. Die Streuung vom kleinsten zum größten Wert beträgt mehr als das Zweieinhalbfache. Eine Optimierung, die „10 Prozent“ bringt, wäre in diesem Rauschen nicht erkennbar. Die Ursachen sind vielfältig: Der Lastgenerator läuft auf demselben Rechner, andere Prozesse stören, die Prozessortakt-Steuerung ändert sich, Caches des Betriebssystems sind kalt oder warm. Daraus folgt eine Methodik:

Erstens wird jede Messung *mehrfach wiederholt*, und man berichtet den Median und die Streuung, nicht einen einzigen Lauf. Zweitens gibt es einen *Aufwärmlauf*, dessen Ergebnis verworfen wird. Drittens wird *immer nur eine Sache geändert*. Viertens bleiben die Bedingungen gleich (derselbe Rechner, dieselben Dateien, derselbe Lastgenerator, möglichst wenig sonstige Aktivität). Fünftens wird das Ergebnis mit dem unveränderten Zustand verglichen, der ebenfalls mehrfach gemessen wird (die *Baseline*).

```bash
#!/bin/bash
# bench.sh URL [Läufe]  -  mehrfach messen, Median und Spanne ausgeben
url=$1; runs=${2:-7}
ab -k -n 2000 -c 10 "$url" > /dev/null 2>&1        # Aufwärmlauf
for i in $(seq "$runs"); do
  ab -k -n 5000 -c 10 "$url" 2>&1 | awk '/Requests per second/{print $4}'
done | sort -n | awk '{v[NR]=$1}
  END{printf "Läufe=%d min=%.0f median=%.0f max=%.0f\n",NR,v[1],v[int((NR+1)/2)],v[NR]}'
```

Das Skript führt zuerst einen Aufwärmlauf aus und verwirft ihn. Dann misst es die gewünschte Zahl von Läufen, liest aus jeder `ab`-Ausgabe die Zeile `Requests per second`, sortiert die Werte und gibt Minimum, Median und Maximum aus. Wer zwei Konfigurationen vergleicht, ruft es für beide auf und vergleicht die Mediane unter Beachtung der Spanne. Überlappen die Spannen stark, gibt es keinen belegbaren Unterschied.

Auch das Werkzeug hat Grenzen. `ab` ist einfach und überall vorhanden, aber nach dem Kenntnisstand des Autors eingeschränkt: Es läuft in einem einzigen Thread, spricht kein HTTP/2 und bildet keinen realistischen Besucher ab. Außerdem kann es Fehlalarme erzeugen: Im Test meldete `ab` bei einem Backend, dessen Antwort eine laufende Nummer enthielt, `Failed requests: 81` von 90, und die Aufschlüsselung lautete `Connect: 0, Receive: 0, Length: 81, Exceptions: 0`. Alle Antworten waren korrekt; `ab` zählt jedoch Antworten, deren Länge von der ersten abweicht, als fehlgeschlagen, und die Nummer wechselte zwischen ein und zwei Ziffern. Bei einer Antwort fester Länge meldete es im Gegentest 0 fehlgeschlagene Anfragen. Man muss also die Aufschlüsselung der Fehler lesen, bevor man Alarm schlägt.

Zwei Verzerrungen gelten für fast alle einfachen Benchmarks. Erstens ist ein Lastgenerator mit fester Parallelität ein „geschlossenes“ Modell: Wird der Server langsam, schickt er automatisch weniger Anfragen. Echte Besucher kommen aber unabhängig vom Zustand des Servers (offenes Modell). Dadurch erscheint der Server im Test besser, als er unter echter Last wäre; als *Coordinated Omission* ist dieses Problem bekannt (Fachwissen des Autors, nicht abgerufen). Zweitens ist ein Test über die lokale Schnittstelle (Loopback) ohne echte Netzlatenz unrealistisch: Verbindungsaufbau ist künstlich billig, Paketverluste fehlen.

### Typische Fehler.

Der erste Fehler ist, ein einziges Ergebnis zu berichten. Der zweite ist, mehrere Änderungen gleichzeitig zu testen und dann nicht zu wissen, welche gewirkt hat. Der dritte ist, die Messung zu verallgemeinern: Das Ergebnis gilt für die gemessene Datei, Last und Umgebung, nicht für „den Server“.

```text
falsch:  "Mit neuer Konfiguration 52 000 req/s, vorher 48 000, also 8 % schneller."
         (ein Lauf, keine Streuung, Lastgenerator auf demselben Rechner)

richtig: "Median aus 7 Läufen: 71 000 vorher (Spanne 29 000 bis 79 000),
         74 000 nachher (Spanne 31 000 bis 80 000): kein belegbarer Unterschied."
```

> **Praxisbeispiel: Beweis für die Planung**
>
> Soll ein Server ersetzt oder eine Einstellung im Betrieb geändert werden, will die Leitung eine Begründung sehen. Eine saubere Messreihe mit Baseline, Wiederholungen und Beschreibung der Bedingungen ist die Antwort. Sie schützt auch vor der Rückfrage „Und woher wissen wir, dass es an der Änderung liegt?“. Wer die Messung dokumentiert (Skript, Konfiguration, Ergebnis), kann sie nach einem Jahr wiederholen.

## Übungsaufgaben

Die Aufgaben steigen im Schwierigkeitsgrad. Für die praktischen Aufgaben genügt ein Testsystem mit Nginx und Apache sowie ein einfaches Backend (zum Beispiel `python3 -m http.server 9101`). Die Lösungen stehen im nächsten Abschnitt.

**Aufgabe 1 (leicht).** Ein Apache mit `event`-MPM soll 200 Anfragen gleichzeitig bearbeiten, mit 25 Threads pro Prozess. Welche Werte brauchen `ThreadsPerChild`, `MaxRequestWorkers` und `ServerLimit` mindestens? Welche Meldung erscheint, wenn `ServerLimit` zu klein ist?

**Aufgabe 2 (leicht).** Erkläre, was eine persistente Verbindung ist, warum sie die Leistung verbessert und warum ein zu langes `keepalive_timeout` trotzdem Nachteile haben kann. Wie erkennst du mit einem Befehl, dass zwei Anfragen dieselbe Verbindung benutzt haben?

**Aufgabe 3 (leicht).** Eine Webseite liefert `style.css` mit `expires 1y` aus. Nach einer Designänderung sehen manche Besucher weiterhin das alte Design. Erkläre die Ursache und nenne die dauerhafte Lösung.

**Aufgabe 4 (mittel).** Ein Nginx-Cache liefert einem Benutzer plötzlich das Konto eines anderen. Das Backend wertet den Header `Authorization` aus. Erkläre, wie es dazu kommt, wie du den Fehler im Test nachweist und wie du ihn behebst.

**Aufgabe 5 (mittel).** Die JSON-Antworten deiner API werden trotz `gzip on` nicht komprimiert. Nenne mindestens vier mögliche Ursachen und wie du jede prüfst.

**Aufgabe 6 (praktisch).** Schreibe eine Nginx-Konfiguration, die `/` an `127.0.0.1:9101` weiterleitet, dabei Keep-Alive zum Backend nutzt, mit einem Microcache von einer Sekunde arbeitet (mit Sperre und Ausliefern veralteter Antworten bei Fehlern) und Anfragen mit `Authorization` oder Sitzungs-Cookie nicht zwischenspeichert. Der Cache-Status soll als Antwortheader sichtbar sein.

**Aufgabe 7 (praktisch).** Ein Lasttest mit `ab -k` ergibt: Parallelität 10: 95 Anfragen/s, Mittel 105 ms; 20: 190, 105 ms; 40: 380, 105 ms; 80: 400, 200 ms; 160: 405, 395 ms. Schreibe die Schleife, mit der man solche Zahlen erzeugt, und bestimme Sättigungspunkt und Engpassgröße. Prüfe das Ergebnis mit dem Gesetz von Little.

**Aufgabe 8 (schwer).** Ein Nginx-Reverse-Proxy auf einem Rechner mit vier Kernen meldet im Fehlerprotokoll `worker_connections are not enough` und `accept4() failed (24: Too many open files)`. Plane `worker_processes`, `worker_connections`, `worker_rlimit_nofile` und das Limit in der `systemd`-Einheit für 8000 gleichzeitige Besucher und beschreibe, wie du die Wirkung prüfst.

**Aufgabe 9 (schwer).** Entwirf für einen Webshop eine Cache-Strategie: Wähle für Stylesheets mit Hash im Namen, Startseite, Produktlisten, Produktdetails, Warenkorb, Kasse und eine öffentliche JSON-Schnittstelle jeweils die Lebensdauer und begründe sie. Nenne drei Kennzahlen, mit denen du den Erfolg überwachst, und einen Fehler, der zu einer Datenpanne führen könnte.

## Lösungen und Erklärungen

**Lösung 1.** Es gilt: Zahl der Prozesse = `MaxRequestWorkers` geteilt durch `ThreadsPerChild`. Bei 200 und 25 sind das genau acht Prozesse. Also: `ThreadsPerChild 25`, `MaxRequestWorkers 200`, `ServerLimit` mindestens 8. Ist `ServerLimit` kleiner, kürzt Apache `MaxRequestWorkers` und meldet beim Start eine Warnung der Form `AH00516: MaxRequestWorkers of 200 would require 8 servers and exceed ServerLimit of N, decreasing to ...` (im Test mit anderen Zahlen beobachtet). Nach einer Änderung von `ServerLimit` muss der Dienst vollständig gestoppt und gestartet werden, ein Neuladen genügt nicht. Wird die Obergrenze unter Last erreicht, erscheint stattdessen `AH00484: server reached MaxRequestWorkers setting`.

**Lösung 2.** Eine persistente Verbindung (Keep-Alive) wird für mehrere Anfragen nacheinander benutzt, statt nach jeder Antwort geschlossen zu werden. Das spart TCP- und TLS-Handshakes sowie kurzlebige Sockets; im Test stiegen die Raten bei Nginx von rund 10 500 auf 25 500 und bei Apache von 8 800 auf 15 800 Anfragen pro Sekunde. Ein zu langes Zeitlimit hält viele untätige Verbindungen offen, die Speicher und Dateideskriptoren belegen, und erleichtert es Angreifern, Verbindungen zu blockieren. Dass zwei Anfragen dieselbe Verbindung benutzen, zeigt `curl -s -o /dev/null -w 'connects=%{num_connects}\n' http://host/a http://host/b`: Die Ausgabe nennt für die zweite URL `connects=0`.

**Lösung 3.** Eine Datei ohne Fingerprint im Namen wurde ein Jahr lang freigegeben. Browser und Zwischenspeicher fragen deshalb erst nach einem Jahr wieder nach und zeigen bis dahin die alte Fassung. Dauerhaft löst man das, indem man den Inhalts-Hash in den Dateinamen aufnimmt (`style.3f9a1c.css`) und die HTML-Seite auf den neuen Namen verweisen lässt; dann darf das lange Limit bleiben. Ohne Build-Prozess hilft nur ein kurzes Limit mit Revalidierung (`Cache-Control: no-cache` mit ETag), das jedoch mehr Anfragen verursacht.

**Lösung 4.** Nginx speichert Antworten standardmäßig auch dann, wenn die Anfrage einen `Authorization`-Header trägt, und der Schlüssel enthält ihn nicht. Die erste Antwort (für Alice) landet im Cache und wird dem zweiten Benutzer (Bob) als `HIT` ausgeliefert. Nachweis im Test: zwei Aufrufe mit `curl -H "Authorization: Bearer ALICE"` und `curl -H "Authorization: Bearer BOB"` auf dieselbe Adresse und Vergleich von Antworttext und `X-Cache-Status`. Behebung: ein `map`, das bei vorhandenem Header 1 liefert, und `proxy_cache_bypass` sowie `proxy_no_cache` mit dieser Variablen (und ebenso für Sitzungs-Cookies). Danach zeigt der Test `BYPASS`. Zusätzlich sollte das Backend personalisierte Antworten mit `Cache-Control: private` kennzeichnen.

**Lösung 5.** Mögliche Ursachen: (1) `application/json` fehlt in `gzip_types`; prüfen mit `curl -H "Accept-Encoding: gzip" -D -` und Vergleich des `Content-Type`. (2) Der Inhaltstyp ist ein anderer, als man denkt, etwa `text/plain`, weil die MIME-Tabelle nicht eingebunden ist oder die Anwendung einen anderen Typ meldet; im Test war genau das der Fall. (3) Die Antwort ist kleiner als `gzip_min_length`. (4) Der Client sendet kein `Accept-Encoding: gzip`. (5) Ein vorgeschalteter Proxy verlangt `gzip_proxied`, oder die Antwort kommt bereits komprimiert vom Backend. (6) Es wird mit der HTTP/1.0-Anfrage gearbeitet, die Kompression ist dafür nach Nginx-Voreinstellung nicht aktiv (Kenntnisstand des Autors, nicht geprüft). Jede Ursache lässt sich mit `curl -s -D - -o /dev/null -H "Accept-Encoding: gzip" URL` und Blick auf `Content-Type`, `Content-Length` und `Content-Encoding` prüfen.

**Lösung 6.**

```nginx
map $http_authorization $skip_auth   { default 1; "" 0; }
map $http_cookie        $skip_cookie { default 0; ~*sessionid 1; }

proxy_cache_path /var/cache/nginx/micro keys_zone=micro:5m max_size=100m inactive=1m;

upstream backend {
    server 127.0.0.1:9101;
    keepalive 16;
}

server {
    listen 8080;
    add_header X-Cache-Status $upstream_cache_status always;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        proxy_cache micro;
        proxy_cache_valid 200 1s;
        proxy_cache_lock on;
        proxy_cache_use_stale updating error timeout http_500 http_502 http_503;
        proxy_cache_background_update on;
        proxy_cache_bypass $skip_auth $skip_cookie;
        proxy_no_cache     $skip_auth $skip_cookie;
    }
}
```

Das `map` steht im `http`-Kontext, ebenso `proxy_cache_path` und `upstream`. `keepalive 16` zusammen mit `proxy_http_version 1.1` und dem leeren `Connection`-Header sorgt für wiederverwendete Backend-Verbindungen. Die Cache-Zeilen entsprechen Abschnitt 11.13. Der Test: dreimal `curl -D - http://localhost:8080/x` (erst `MISS`, dann `HIT`); mit `-H "Authorization: Bearer X"` erscheint `BYPASS`. Wichtig ist `always` bei `add_header`, sonst fehlt der Header bei Fehlerantworten.

**Lösung 7.** Die Schleife entspricht der aus Abschnitt 11.7:

```bash
for c in 10 20 40 80 160; do
  ab -k -n $((c*100)) -c $c http://test.example/ \
    | awk -v c=$c '/Requests per second/{r=$4} /Time per request.*mean\)/ && !/across/{m=$4} END{print c, r, m}'
done
```

Die Auswertung: Bis Parallelität 40 wächst der Durchsatz im gleichen Verhältnis wie die Last (95, 190, 380), die Antwortzeit bleibt bei 105 ms; das System hat Reserven. Bei 80 ist der Durchsatz mit 400 fast am Anschlag (nur 5 % mehr bei doppelter Last), die Antwortzeit hat sich verdoppelt; bei 160 steigt sie auf 395 ms. Der Sättigungspunkt liegt also bei etwa 400 Anfragen pro Sekunde und einer Parallelität von etwa 40. Little-Probe: Parallelität gleich Durchsatz mal Antwortzeit. Bei 40: 380 · 0,105 ≈ 40. Bei 160: 405 · 0,395 ≈ 160. Beide Werte passen, die Messung ist in sich stimmig. Der Engpass ist eine Ressource, die etwa 40 Anfragen gleichzeitig bearbeiten kann (zum Beispiel ein Thread- oder Datenbank-Pool von 40 bei 100 ms Bearbeitungszeit); welcher es ist, zeigen Monitoring und Profiler. Betriebsgrenze: deutlich unter 400, etwa bei 70 bis 80 Prozent, also rund 300 Anfragen pro Sekunde.

**Lösung 8.** Die erste Meldung bedeutet, dass `worker_connections` zu klein ist, die zweite, dass das Dateilimit des Prozesses (Fehler 24, `EMFILE`) zu niedrig ist. Planung für vier Kerne und 8000 Besucher: `worker_processes auto` (vier Prozesse). Jeder Besucher belegt bei einem Reverse Proxy zwei Verbindungen (Client und Backend), also sind 16 000 Verbindungen nötig, gleichmäßig verteilt vier mal 4000. Damit ist `worker_connections 4096` pro Prozess eine vernünftige Wahl mit etwas Reserve. Jede Verbindung ist ein Dateideskriptor, dazu kommen Protokolle und Cache-Dateien; `worker_rlimit_nofile 16384` lässt viel Spielraum (das Vierfache von `worker_connections` ist hier großzügig, die Regel lautet: mindestens das Doppelte). In der `systemd`-Einheit setzt man `LimitNOFILE=` auf mindestens denselben Wert, über `systemctl edit nginx` im Abschnitt `[Service]`. Prüfung: Neustart, dann `grep "open files" /proc/<PID>/limits` für einen Arbeitsprozess, `stub_status` (die Zahl `Active connections` und der Vergleich `accepts` gegen `handled`), anschließend ein Lasttest mit 8000 Verbindungen und ein Blick, ob die Fehlermeldungen ausbleiben. Beachte, dass auch das Backend die zusätzlichen Verbindungen verkraften muss, sonst wandert der Engpass nur.

**Lösung 9.** Ein möglicher Entwurf: *Stylesheets und Skripte mit Hash im Namen*: ein Jahr mit `immutable` (Abschnitt 11.6), weil sich der Inhalt bei gleicher Adresse nie ändert. *Startseite*: Microcache von einer bis fünf Sekunden mit Sperre und Ausliefern veralteter Antworten, weil sie für alle gleich ist, sehr oft abgerufen wird und eine kleine Verzögerung nicht stört. *Produktlisten*: fünf bis 30 Sekunden, Schlüssel inklusive Abfrageparametern, weil sie häufig, aber nicht sekundengenau aktuell sein müssen. *Produktdetails*: 30 bis 120 Sekunden, mit Möglichkeit zum gezielten Löschen bei Preisänderungen (zum Beispiel Cache-Datei löschen oder kurze Lebensdauer wählen), weil falsche Preise rechtliche und wirtschaftliche Folgen haben können. *Warenkorb und Kasse*: nie zwischenspeichern (Sitzungsbezug, `Cache-Control: private, no-store`), `bypass` und `no_cache` bei Sitzungs-Cookie. *Öffentliche JSON-Schnittstelle*: je nach Aktualitätsanforderung eine bis 30 Sekunden; mit Kompression. Kennzahlen: Trefferquote des Caches, 95. Perzentil der Antwortzeit (getrennt nach `HIT` und `MISS`) und Anfragen pro Sekunde am Backend. Der Fehler mit Folgen für den Datenschutz ist das gemeinsame Speichern personalisierter Antworten (siehe Aufgabe 4), zum Beispiel wenn das Sitzungs-Cookie nicht Teil der Ausnahmeregel ist oder ein Backend personalisierte Inhalte auf einer Adresse ausliefert, die als öffentlich gilt.
