# Modul 07 - Reverse Proxy, Load Balancing und Backend-Integration

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Listings unverändert, farbige Boxen als Zitatblöcke mit fettem Titel, Tabellen als Markdown-Tabellen, Übungsaufgaben und Lösungen als Absätze bzw. Überschriften). Die Lerneinheiten sind wie in der Quelle nach Modul nummeriert (7.1 bis 7.13), danach folgen „Übungsaufgaben“ (9) und „Lösungen und Erklärungen“. **Die Konfigurationen und Befehle wurden für dieses Repository nicht ausgeführt:** Laut Einleitung hat der Autor die Beispiele in einer Linux-Umgebung (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0) ausgeführt; nicht getestet sind laut Skript Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt. Viele Beispiele ändern Server-Konfiguration, Zertifikate, Rechte oder Dienste: nur in einer Testumgebung ausprobieren. Übersicht zum Modul: [README](README.md).

**Geplante Dauer:** 14,5 h | **Priorität:** 1 | **Lerneinheiten:** 13

## Lerneinheiten laut Lehrplan

| **Nr.** | **Lerneinheit**         | **Dauer (h)** | **Prio** |
|--------:|:------------------------|--------------:|---------:|
|     7.1 | mod_proxy Grundlagen    |             1 |        1 |
|     7.2 | ProxyPass               |             1 |        1 |
|     7.3 | ProxyPassReverse        |           1,5 |        1 |
|     7.4 | BalancerMember          |             1 |        1 |
|     7.5 | Health Checks           |             1 |        1 |
|     7.6 | WebSocket Proxy         |           1,5 |        2 |
|     7.7 | Forwarded Headers       |             1 |        2 |
|     7.8 | Backend-Troubleshooting |             1 |        2 |
|     7.9 | Proxy Header            |             1 |        1 |
|    7.10 | X-Forwarded-For         |           1,5 |        1 |
|    7.11 | Buffering               |             1 |        1 |
|    7.12 | Timeouts                |             1 |        1 |
|    7.13 | gRPC Proxy              |             1 |        2 |
|         | **Summe**               |      **14,5** |          |

## Überblick und Lernweg

Ein *Reverse Proxy* steht vor einem oder mehreren *Backends* (Anwendungsservern) und nimmt Anfragen im Namen dieser Server entgegen. Für den Besucher sieht es aus, als spräche er mit einem einzigen Server; in Wahrheit leitet der Proxy die Anfrage weiter, holt die Antwort ab und gibt sie zurück. Das ist die häufigste Rolle, in der Apache und Nginx heute eingesetzt werden: Sie beenden TLS (Modul 6), liefern statische Dateien selbst aus (Modul 5) und reichen alles Dynamische an Anwendungen weiter, die auf eigenen Ports lauschen, in Containern laufen oder auf anderen Rechnern stehen.

Das Modul ist in zwei Blöcke gegliedert. Die Einheiten 7.1 bis 7.8 behandeln den Apache HTTP Server mit `mod_proxy`: Grundlagen, `ProxyPass`, die Korrektur von Weiterleitungen, Balancer-Gruppen, Health Checks, WebSockets, weitergegebene Header und die Fehlersuche. Die Einheiten 7.9 bis 7.13 behandeln dasselbe für Nginx: `proxy_pass` mit den Header-Direktiven, die Kette `X-Forwarded-For`, das Puffern von Antworten, Zeitlimits und gRPC. Lastverteilung als Thema für sich (`upstream`-Blöcke bei Nginx, Algorithmen, Blue-Green) folgt in Modul 8; hier genügt die Balancer-Gruppe von Apache.

> **Merke**
>
> Die Tests dieses Moduls liefen mit Apache 2.4.58 und Nginx 1.24.0 gegen zwei kleine Python-Backends auf den Ports 9001 und 9002, die den Pfad und die empfangenen Header zurückgeben, Weiterleitungen und langsame Antworten erzeugen und die WebSocket-Aushandlung beherrschen. Die Ausgaben im Text sind echte Auszüge. Nicht getestet wurden gRPC-Verbindungen (nur die Syntax der Konfiguration) und Betrieb hinter echten Lastverteilern.

## 7.1 mod_proxy Grundlagen

Das Modul `mod_proxy` ist das Gerüst für alle Weiterleitungen in Apache; für einzelne Protokolle kommen Erweiterungsmodule hinzu. `mod_proxy_http` spricht HTTP und HTTPS mit Backends, `mod_proxy_fcgi` spricht FastCGI (Einheit 4.6), `mod_proxy_wstunnel` reicht WebSockets durch (7.6), `mod_proxy_balancer` bildet Gruppen von Backends (7.4) und `mod_proxy_hcheck` prüft deren Gesundheit (7.5). Die Abhängigkeit ist wichtig: Das Basismodul muss immer zuerst geladen werden, sonst scheitert der Start mit `undefined symbol` (Einheit 4.1).

Zwei völlig verschiedene Betriebsarten teilen sich das Modul, und die Verwechslung gehört zu den gefährlichsten Fehlern der Apache-Konfiguration. Ein *Forward Proxy* stellt Anfragen im Auftrag *von Clients* an beliebige Ziele im Internet; er wird mit `ProxyRequests On` eingeschaltet und gehört in Firmennetze, die ihren Benutzern den Zugang erlauben. Ein *Reverse Proxy* stellt Anfragen im Auftrag *von Servern* an feste, vom Betreiber festgelegte Ziele. Für ihn gilt immer `ProxyRequests Off`. Ist `ProxyRequests On` versehentlich auf einem öffentlichen Server aktiv und nicht durch Zugriffsregeln geschützt, wird er zum *offenen Proxy*, den Fremde nutzen, um ihre Spuren zu verwischen. Die Grundkonfiguration der Testumgebung beginnt deshalb so:

```apache
LoadModule proxy_module      modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule headers_module    modules/mod_headers.so

ProxyRequests Off
```

Die Direktive steht ausdrücklich in der Datei, obwohl `Off` die Voreinstellung ist: Ein Reviewer sieht so auf einen Blick, dass der Server kein Forward Proxy ist. Die drei Module werden geladen, und alle weiteren Regeln (`ProxyPass` und andere) kommen in die Virtual Hosts oder `Location`-Blöcke.

Was geschieht bei einer weitergeleiteten Anfrage? Apache nimmt die Anfrage des Clients an, ermittelt anhand der `ProxyPass`-Regeln das Ziel, baut eine *eigene* Verbindung zum Backend auf (oder nutzt eine bestehende aus dem Verbindungspool wieder), sendet eine neue Anfrage und leitet die Antwort an den Client zurück. Der Client sieht das Backend nie; das Backend sieht nur den Proxy. Das hat Folgen: Die Client-Adresse, der ursprüngliche `Host`-Header und das Protokoll (HTTP oder HTTPS) sind für das Backend nicht mehr direkt erkennbar. Wie man sie weiterreicht, behandeln die Einheiten 7.7 und 7.9 bis 7.10.

Ein Test zeigt, was Apache dem Backend mitgibt. Die Konfiguration `ProxyPass "/app/" "http://127.0.0.1:9001/"` und eine Anfrage `curl localhost:8060/app/x?a=1` ergaben beim Backend:

```text
BACKEND=b1 path=/x?a=1
Host: 127.0.0.1:9001
X-Forwarded-For: 127.0.0.1
X-Forwarded-Host: localhost:8060
X-Forwarded-Server: localhost
Connection: Keep-Alive
```

Drei Beobachtungen sind wichtig. Erstens: Der Pfad `/app/x?a=1` wurde zu `/x?a=1`; der Teil `/app/` wurde durch das Ziel `/` *ersetzt*. Zweitens: Als `Host` sieht das Backend seine *eigene* Adresse, nicht die des Clients. Drittens: Apache fügt von sich aus drei Header hinzu (`X-Forwarded-For`, `X-Forwarded-Host` und `X-Forwarded-Server`), die auf den ursprünglichen Client und Host hinweisen. Dass diese Header automatisch entstehen, ist eine Eigenheit von Apache; Nginx tut es nicht (Einheit 7.9).

### Typische Fehler.

Der gefährlichste Fehler ist `ProxyRequests On` ohne Zugriffsschutz. Der zweite ist, `mod_proxy_http` zu vergessen: Der Test meldet dann nichts, die Anfrage endet aber mit einem Fehler 500 oder 503 (je nach Aufbau). Der dritte ist, davon auszugehen, dass das Backend den ursprünglichen `Host` sieht; viele Anwendungen bauen aus dem `Host`-Header Links und Weiterleitungen und liefern dann falsche Adressen (Einheit 7.3).

```apache
# falsch: offener Forward Proxy auf einem öffentlichen Server
ProxyRequests On
# richtig: Reverse Proxy mit festen Zielen
ProxyRequests Off
ProxyPass "/app/" "http://127.0.0.1:3000/"
```

> **Praxisbeispiel: Offener Proxy als Befund**
>
> In Sicherheitsprüfungen und in Missbrauchsmeldungen taucht der offene Proxy regelmäßig auf: Ein Server leitet beliebige Anfragen aus dem Internet weiter und wird für Spam, Betrug oder Angriffe genutzt. Die Prüfung ist einfach: `grep -R ProxyRequests /etc/apache2` und kontrollieren, dass dort nirgends `On` steht.

## 7.2 ProxyPass

Die Direktive `ProxyPass` ist das Herzstück des Reverse Proxys: Sie ordnet einem URL-Pfad am Proxy ein Ziel beim Backend zu. Die Syntax ist `ProxyPass Pfad Ziel [Parameter]`. Der Pfad gibt an, welche Anfragen betroffen sind (alle, die mit diesem Präfix beginnen), das Ziel ist eine vollständige URL (`http://host:port/pfad`) oder eine Balancer-Gruppe (`balancer://name/`, Einheit 7.4).

Die wichtigste Regel betrifft den abschließenden Schrägstrich, und sie ist so wichtig wie bei `alias` (Einheit 5.1). Apache ersetzt den Pfad-Teil der Anfrage, der dem ersten Argument entspricht, durch das zweite Argument. Bei `ProxyPass "/app/" "http://127.0.0.1:9001/"` wird aus `/app/x` die Anfrage `/x` am Backend; bei `ProxyPass "/app/" "http://127.0.0.1:9001/api/"` würde daraus `/api/x`. Die Schrägstriche sollten an beiden Enden gleich behandelt werden: In der Testumgebung lieferte die Anfrage `/app` (ohne Schrägstrich) bei der Regel für `/app/` den Status 404, weil der Pfad nicht passte und Apache ihn deshalb als gewöhnliche Datei-Anfrage behandelte.

Hinter dem Ziel stehen optionale Parameter, die das Verhalten gegenüber diesem einen Backend einstellen. Die wichtigsten: `timeout=Sekunden` (wie lange auf eine Antwort gewartet wird, Einheit 7.12), `retry=Sekunden` (wie lange ein ausgefallenes Backend übersprungen wird), `connectiontimeout=` und `disablereuse=On` (Verbindung nicht wiederverwenden). Mit dem Ausrufezeichen als Ziel nimmt man Pfade von der Weiterleitung aus: `ProxyPass "/statisch/" "!"` sorgt dafür, dass dieser Pfad lokal bedient wird, obwohl eine allgemeinere Regel ihn erfassen würde. Die Reihenfolge ist wichtig, denn Apache wertet die Regeln in der Reihenfolge der Datei aus und nimmt die erste, die passt: Ausnahmen müssen *vor* den allgemeinen Regeln stehen.

```apache
# Ausnahme zuerst: statische Dateien lokal bedienen
ProxyPass "/assets/" "!"
# alles andere unter /app/ an die Anwendung
ProxyPass "/app/" "http://127.0.0.1:3000/" timeout=30 retry=10
```

Die erste Regel schützt die statischen Dateien (Modul 5) vor der Weiterleitung, die zweite leitet `/app/` mit 30 Sekunden Wartezeit weiter und lässt ein ausgefallenes Backend nach einem Fehler für zehn Sekunden in Ruhe, bevor es erneut versucht wird. Wer statt einer Pfad-Regel ein Muster braucht, nimmt `ProxyPassMatch` mit einem regulären Ausdruck (Einheit 4.6 zeigt das für PHP); in einem `Location`-Block kann man `ProxyPass` auch ohne Pfad schreiben, dann gilt der Pfad des Blocks.

Wie sich Fehler äußern, zeigte die Testumgebung. Ist das Backend nicht erreichbar (kein Prozess auf Port 9999), antwortet Apache mit `503` und schreibt `AH00957: http: attempt to connect to 127.0.0.1:9999 failed` und `AH01114: HTTP: failed to make connection to backend`. Antwortet es nicht rechtzeitig (`timeout=1` bei einem Backend, das drei Sekunden braucht), antwortet Apache mit `502` und schreibt `AH01102: error reading status line from remote server` sowie `AH00898: Error reading from remote server`. Dieser Unterschied ist für die Fehlersuche wichtig: *503* bedeutet bei Apache „Backend nicht erreichbar“, *502* bedeutet „Backend hat falsch oder zu spät geantwortet“. Nginx wählt hier andere Codes (Einheit 7.12).

### Typische Fehler.

Ein häufiger Fehler ist eine Regel, bei der Pfad und Ziel unterschiedlich enden (`/app` und `http://.../`): Man erhält Pfade mit doppelten oder fehlenden Schrägstrichen und wundert sich über 404. Ein zweiter ist, dass die Ausnahme (`"!"`) nach der allgemeinen Regel steht und wirkungslos bleibt. Ein dritter ist, ein Ziel mit `localhost` anzugeben, wenn der Name zu IPv6 aufgelöst wird und das Backend nur auf IPv4 lauscht; man schreibt besser die Adresse (`127.0.0.1`).

```apache
# falsch: Ausnahme steht hinter der allgemeinen Regel
ProxyPass "/" "http://127.0.0.1:3000/"
ProxyPass "/assets/" "!"
# richtig: Ausnahme zuerst
ProxyPass "/assets/" "!"
ProxyPass "/" "http://127.0.0.1:3000/"
```

> **Praxisbeispiel: Anwendung unter einem Pfad**
>
> Oft läuft eine Anwendung auf einem eigenen Port und soll unter `/app/` der Hauptwebsite erscheinen. Dann genügt `ProxyPass` nicht allein: Die Anwendung kennt ihren Pfad nicht und erzeugt Links und Weiterleitungen ohne `/app/`. Die Lösung ist eine Kombination aus `ProxyPassReverse` (nächste Einheit) und, wenn nötig, einer Einstellung in der Anwendung selbst („Basis-Pfad“).

## 7.3 ProxyPassReverse

Wenn ein Backend mit einer Weiterleitung antwortet (Status 301 oder 302), steht im Header `Location` eine Adresse, die aus Sicht des Backends gilt, etwa `http://127.0.0.1:9001/neu`. Gibt der Proxy diese Antwort unverändert weiter, schickt er den Browser des Besuchers an eine Adresse, die nur intern erreichbar ist, und der Besucher sieht einen Verbindungsfehler. `ProxyPassReverse` löst das: Die Direktive schreibt die Adressen in den Antwortheadern (`Location`, `Content-Location`, `URI`) vom Backend-Namensraum in den Namensraum des Proxys um. Sie wirkt nur auf *Header*, nicht auf den Inhalt der Seiten.

Die Syntax spiegelt `ProxyPass`: `ProxyPassReverse Pfad Ziel`, mit denselben Argumenten wie die zugehörige `ProxyPass`-Regel. Der folgende Test zeigt die Wirkung. Das Backend antwortet auf `/redir` mit `302` und `Location: http://127.0.0.1:9001/neu`:

```apache
ProxyPass        "/app/" "http://127.0.0.1:9001/"
ProxyPassReverse "/app/" "http://127.0.0.1:9001/"
```

Mit beiden Zeilen lautete die Antwort des Proxys `Location: http://localhost:8060/app/neu`. Das Backend-Präfix `http://127.0.0.1:9001/` wurde durch `http://localhost:8060/app/` ersetzt (Schema und Host des Proxys, Pfad `/app/`), so dass der Browser dem Link folgen kann. Ohne die zweite Zeile (eigene Testkonfiguration mit nur `ProxyPass`) blieb die Adresse unverändert: `Location: http://127.0.0.1:9001/neu`.

Bei einem ersten Test habe ich einen Fehler gemacht, der lehrreich ist: In einer Konfiguration mit *zwei* `ProxyPass`-Regeln zum selben Backend (`/app/` mit `ProxyPassReverse`, `/roh/` ohne) wurde die Weiterleitung auch für den Pfad `/roh/` umgeschrieben. Der Grund: `ProxyPassReverse` hängt nicht an einer bestimmten `ProxyPass`-Regel, sondern gilt für *jede Antwort*, deren `Location` mit dem angegebenen Backend-Präfix beginnt. Das ist praktisch (eine Zeile pro Backend genügt), kann aber überraschen, wenn mehrere Pfade zum selben Backend führen: Die Rückübersetzung wählt dann das passende Pfad-Paar anhand der Adresse, nicht anhand der ursprünglichen Anfrage.

Zwei Grenzen sollte man kennen. Erstens passt `ProxyPassReverse` nur Header an. Enthält der HTML-Text absolute Links auf das Backend (`<a href="http://127.0.0.1:9001/seite">`), bleiben sie unverändert; dafür braucht es entweder eine Einstellung in der Anwendung (sie soll korrekte Adressen erzeugen) oder ein zusätzliches Modul zur Inhaltsumschreibung (`mod_proxy_html`, nicht Teil dieses Kurses; das Modul liegt in der Testumgebung vor, wurde aber nicht geprüft). Zweitens gibt es für Cookies eigene Direktiven (`ProxyPassReverseCookiePath` und `ProxyPassReverseCookieDomain`), die Pfad und Domain in `Set-Cookie`-Headern umschreiben; sie wurden hier nicht getestet.

Das Nginx-Gegenstück heißt `proxy_redirect`. Bei Nginx zeigte der Test dieselbe Wirkung: Mit `proxy_redirect http://127.0.0.1:9001/ /app/;` wurde aus dem `Location`-Wert des Backends `http://localhost:8061/app/neu`; ohne die Direktive blieb `http://127.0.0.1:9001/neu` stehen. Der Unterschied: Nginx braucht die Regel pro `location`, Apache wertet sie global aus.

### Typische Fehler.

Der häufigste Fehler ist, `ProxyPassReverse` ganz zu vergessen; Besucher landen nach Anmeldungen auf einer internen Adresse. Der zweite ist ein `ProxyPassReverse` mit anderen Argumenten als `ProxyPass` (Tippfehler oder fehlender Schrägstrich): Es greift dann nicht, und der Fehler fällt nur bei Weiterleitungen auf. Der dritte ist die Erwartung, dass die Direktive auch Seiteninhalte umschreibt.

```apache
# falsch: Reverse-Regel passt nicht zum Backend-Präfix
ProxyPass        "/app/" "http://127.0.0.1:9001/"
ProxyPassReverse "/app/" "http://localhost:9001/"
# richtig: dieselben Argumente wie bei ProxyPass
ProxyPass        "/app/" "http://127.0.0.1:9001/"
ProxyPassReverse "/app/" "http://127.0.0.1:9001/"
```

> **Praxisbeispiel: Der Anmelde-Redirect**
>
> Der typische Auslöser ist die Anmeldeseite einer Anwendung: Nach dem Absenden leitet das Backend auf die Startseite weiter. Ohne `ProxyPassReverse` landet der Besucher bei `http://backend:8080/start` und bricht ab. Bei der Fehlersuche schaut man mit `curl -D - -o /dev/null` auf den `Location`-Header.

## 7.4 BalancerMember

Eine *Balancer-Gruppe* verteilt Anfragen auf mehrere Backends, die dieselbe Anwendung bedienen. Apache baut sie mit zwei Modulen: `mod_proxy_balancer` stellt die Gruppe bereit, ein `lbmethod`-Modul (`mod_lbmethod_byrequests`, `bytraffic`, `bybusyness`) wählt die Verteilungsart, und `mod_slotmem_shm` legt den gemeinsamen Speicher an, in dem die Arbeitsprozesse den Zustand der Mitglieder teilen. In einem `Proxy`-Container gibt man der Gruppe einen Namen, und jede `BalancerMember`-Zeile fügt ein Backend hinzu. Das Ziel in `ProxyPass` lautet dann `balancer://name/`.

```apache
LoadModule proxy_balancer_module      modules/mod_proxy_balancer.so
LoadModule lbmethod_byrequests_module modules/mod_lbmethod_byrequests.so
LoadModule slotmem_shm_module         modules/mod_slotmem_shm.so

<Proxy "balancer://pool">
    BalancerMember "http://127.0.0.1:9001" loadfactor=3
    BalancerMember "http://127.0.0.1:9002" loadfactor=1
    ProxySet lbmethod=byrequests
</Proxy>
ProxyPass        "/lb/" "balancer://pool/"
ProxyPassReverse "/lb/" "balancer://pool/"
```

Die Gruppe `pool` hat zwei Mitglieder. `loadfactor` ist das Gewicht: Das erste Backend bekommt dreimal so viele Anfragen wie das zweite. Das Verfahren `byrequests` verteilt nach der Zahl der Anfragen unter Berücksichtigung der Gewichte. In der Testumgebung gingen von acht aufeinanderfolgenden Anfragen sechs an `b1` und zwei an `b2`, genau das Verhältnis 3:1. Das Gewicht erlaubt es, unterschiedlich starke Server zu mischen oder ein neu eingebundenes Backend vorsichtig anlaufen zu lassen.

Weitere Parameter an `BalancerMember` steuern den Zustand: `status=+H` (*hot standby*) macht ein Mitglied zur Reserve, die nur einspringt, wenn alle anderen ausfallen; `status=+D` (*disabled*) nimmt es aus der Verteilung, etwa für Wartungsarbeiten; `route=` kennzeichnet ein Mitglied für *sticky sessions*, bei denen ein Benutzer immer beim selben Backend landet (die Zuordnung läuft über ein Cookie oder einen URL-Parameter, die Einstellung heißt `stickysession`). Für den laufenden Betrieb gibt es die *Balancer-Manager*-Oberfläche (`SetHandler balancer-manager`), die Mitglieder zur Laufzeit ändern kann; sie muss unbedingt zugriffsbeschränkt werden, zum Beispiel mit `Require local`.

Zum Verständnis gehört die Fehlerbehandlung. Fällt ein Mitglied aus, versucht Apache bei der nächsten Anfrage ein anderes; das ausgefallene gilt als fehlerhaft und wird für die Zeit des Parameters `retry` (Standard 60 Sekunden) nicht mehr angesprochen. Wann ein Mitglied „fehlerhaft“ ist, hängt davon ab, wie der Ausfall erkannt wird, und genau dafür sind aktive *Health Checks* gedacht, die die nächste Einheit behandelt. Ein Mitglied *bleibt* außerdem bei aktivierter Session-Bindung (`stickysession`) an Benutzer gebunden, auch wenn es überlastet ist; das ist die Kehrseite der Bequemlichkeit.

### Typische Fehler.

Ein häufiger Fehler ist ein fehlendes `mod_slotmem_shm`: Der Start meldet einen Fehler, weil der Balancer keinen gemeinsamen Speicher anlegen kann. Ein zweiter ist, den Balancer-Manager ohne `Require` offen zu lassen; jeder Besucher könnte dann Mitglieder umstellen. Ein dritter ist, Sessions im Speicher des einzelnen Backends zu halten und trotzdem ohne `stickysession` zu verteilen: Benutzer verlieren zufällig ihre Anmeldung. Die saubere Lösung ist ein gemeinsamer Sitzungsspeicher (Datenbank, Redis).

```apache
# falsch: Verwaltungsoberfläche für alle erreichbar
<Location "/balancer-manager">
    SetHandler balancer-manager
</Location>
# richtig: nur vom lokalen Rechner
<Location "/balancer-manager">
    SetHandler balancer-manager
    Require local
</Location>
```

> **Praxisbeispiel: Wartung ohne Ausfall**
>
> Für einen Neustart eines Backends setzt man es im Balancer-Manager (oder per Konfiguration und `graceful`) auf `+D`, wartet, bis laufende Anfragen beendet sind, führt die Arbeiten durch und nimmt es wieder in die Verteilung auf. Die Besucher merken davon nichts, solange mindestens ein anderes Mitglied läuft.

## 7.5 Health Checks

Ein Balancer ohne Gesundheitsprüfung merkt einen Ausfall erst, wenn eine echte Anfrage eines Besuchers scheitert. Das kostet im ungünstigen Fall genau diese eine Anfrage; Apache versucht sie zwar bei einem anderen Mitglied erneut, doch bei Zeitüberschreitungen entstehen lange Wartezeiten. *Health Checks* drehen das um: Der Server fragt die Backends in festen Abständen von sich aus (*aktiv*), ob sie gesund sind, und nimmt kranke aus der Verteilung, bevor ein Besucher es merkt. Bei Apache übernimmt das `mod_proxy_hcheck`. Es setzt `mod_proxy_balancer` und `mod_slotmem_shm` voraus.

Die Prüfung wird pro `BalancerMember` mit `hc`-Parametern eingestellt. `hcmethod` legt die Art der Prüfung fest (`GET` und `HEAD` für HTTP, `TCP` für einen reinen Verbindungsaufbau), `hcuri` den Pfad der Prüf-Anfrage, `hcinterval` den Abstand in Sekunden. Mit `hcpasses` und `hcfails` bestimmt man, wie viele Prüfungen in Folge bestanden oder verfehlt werden müssen, bevor sich der Zustand ändert; so führt ein einzelner Ausreißer nicht gleich zur Umschaltung. Ob eine Antwort „gesund“ ist, entscheidet standardmäßig der Statuscode (2xx); mit `ProxyHCExpr` lässt sich eine Bedingung formulieren, die auch den Inhalt berücksichtigt.

```apache
LoadModule proxy_hcheck_module modules/mod_proxy_hcheck.so

<Proxy "balancer://pool">
    BalancerMember "http://127.0.0.1:9001" loadfactor=3 hcmethod=GET hcuri=/health hcinterval=2
    BalancerMember "http://127.0.0.1:9002" loadfactor=1 hcmethod=GET hcuri=/health hcinterval=2
    ProxySet lbmethod=byrequests
</Proxy>
```

Die Konfiguration gehört zur Gruppe aus der vorigen Einheit und ergänzt sie um die Prüfung: Alle zwei Sekunden fragt Apache bei jedem Mitglied `/health` per GET ab. Das Test-Backend antwortet dort mit `200`. Interessant ist das Verhalten beim Ausfall. Nach dem Beenden von `b2` erhielt der Client in einer Serie von Anfragen weiterhin nur `200`-Antworten; der Fehler blieb für Besucher unsichtbar. Im Fehlerlog stand die Meldung `AH00957: HCOH: attempt to connect to 127.0.0.1:9002 failed`, wobei `HCOH` für die HTTP-Prüfung des Moduls steht. Nach dem erneuten Start von `b2` wurde das Mitglied beim nächsten erfolgreichen Prüflauf wieder in die Verteilung aufgenommen.

Dieses Ergebnis ist mit Vorsicht zu lesen. Die Testserie war kurz, und ein einzelner Lauf zeigt nicht, wie schnell der Zustand umspringt: Zwischen Ausfall und Erkennung liegt höchstens ein Prüfintervall (bei Fehlschwellen `hcfails` mehrere), und in diesem Fenster kann eine Anfrage das tote Mitglied treffen. Apache fängt das durch den Wiederholungsversuch bei einem anderen Mitglied teilweise ab. Wer genau wissen will, wie sich sein Aufbau verhält, misst es mit einer Schleife aus `curl`-Aufrufen, die den Statuscode ausgibt, während man ein Backend stoppt.

Die Prüfseite selbst verdient Sorgfalt. Eine gute Gesundheitsseite prüft, ob die Anwendung wirklich arbeiten kann (Datenbank erreichbar, Platte nicht voll), und antwortet schnell und ohne Anmeldung. Eine schlechte prüft nichts und antwortet immer `200`, so dass die Prüfung zur Fassade wird. Eine zu strenge hingegen, die bei einer kurzen Datenbank-Verzögerung auf `500` springt, nimmt alle Backends gleichzeitig aus der Verteilung und verwandelt eine Störung in einen Totalausfall. Man unterscheidet daher zwischen *liveness* (der Prozess lebt) und *readiness* (er kann Anfragen bearbeiten); für den Balancer ist die zweite Frage entscheidend.

### Typische Fehler.

Ein häufiger Fehler ist, das Modul zu vergessen: Die `hc`-Parameter werden dann nicht erkannt, und der Start bricht ab oder die Prüfung findet nie statt. Ein zweiter ist ein Prüfpfad, den die Anwendung nur nach der Anmeldung ausliefert (Status 302 oder 401): Das Mitglied gilt dauerhaft als krank. Ein dritter ist ein zu kurzes `hcinterval` bei vielen Mitgliedern, das die Backends mit Prüfungen belastet.

```apache
# falsch: Prüfpfad verlangt Anmeldung
BalancerMember "http://127.0.0.1:9001" hcmethod=GET hcuri=/konto
# richtig: eigener, offener Prüfpfad
BalancerMember "http://127.0.0.1:9001" hcmethod=GET hcuri=/health
```

> **Praxisbeispiel: Gesundheitsseite in der Pipeline**
>
> In Container-Umgebungen gehört die Gesundheitsseite zur Anwendung: Entwickler bauen `/health` oder `/ready` ein, Orchestrierungswerkzeuge und Balancer fragen sie ab. Als Betreiber der Webserver fordert man diese Seite beim Entwicklungsteam ein, statt auf die Startseite zu prüfen.

## 7.6 WebSocket Proxy

Das *WebSocket*-Protokoll erlaubt eine dauerhafte, in beide Richtungen offene Verbindung zwischen Browser und Server; Chats, Live-Anzeigen und Entwicklungsserver nutzen sie. Es beginnt als gewöhnliche HTTP-Anfrage mit den Headern `Upgrade: websocket` und `Connection: Upgrade`. Antwortet der Server mit dem Status `101 Switching Protocols`, wechselt die Verbindung vom HTTP-Format in das WebSocket-Format. Ein Proxy, der davon nichts weiß, behandelt die Anfrage als gewöhnliches HTTP: Er entfernt die Upgrade-Header (sie gelten nur für eine einzelne Verbindungsstrecke, *hop-by-hop*), und das Backend liefert eine normale Antwort statt `101`.

Apache löst das mit `mod_proxy_wstunnel`. Das Modul registriert die Schemata `ws://` und `wss://` für `ProxyPass`. In der Testumgebung genügte diese Konfiguration:

```apache
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so

ProxyPass "/ws/"   "ws://127.0.0.1:9001/"
ProxyPass "/nows/" "http://127.0.0.1:9001/"
```

Die erste Regel leitet `/ws/` als WebSocket weiter, die zweite dient zum Vergleich als gewöhnliches HTTP. Der Test sendete von `curl` aus eine Upgrade-Anfrage mit den üblichen Headern (`Upgrade: websocket`, `Connection: Upgrade`, `Sec-WebSocket-Version: 13` und einem `Sec-WebSocket-Key`). Über `/ws/` antwortete das Backend mit `101 Switching Protocols`, über `/nows/` kam der Status `200`: Die Verbindung blieb eine gewöhnliche HTTP-Anfrage, und die Upgrade-Aushandlung ging verloren. Das Verhalten ist tückisch, weil keine Fehlermeldung entsteht; die Anwendung funktioniert, nur der Echtzeit-Teil nicht. Der Browser meldet dann in der Konsole, dass der WebSocket-Aufbau fehlgeschlagen sei.

Zwei Aspekte betreffen den Betrieb. Erstens sind WebSocket-Verbindungen langlebig, so dass Zeitlimits (Einheit 7.12) und die Begrenzung der gleichzeitigen Verbindungen (Modul 3 und 4) anders wirken als bei kurzen Anfragen: Jede offene Verbindung belegt einen Thread oder, beim Event-MPM, einen Eintrag in dessen Verwaltung. Zweitens muss der Proxy zusammen mit TLS arbeiten: Der Browser verwendet `wss://` zum Proxy, und der Proxy spricht intern `ws://` mit dem Backend. Die Regel im Proxy bleibt dieselbe, weil das Schema des *Backends* zählt, nicht das des Browsers.

Das Nginx-Gegenstück ist anders gebaut und wird in Einheit 7.9 behandelt: Dort muss man die Header selbst durchreichen, weil Nginx sie standardmäßig verwirft.

### Typische Fehler.

Der erste Fehler ist das fehlende Modul oder ein `http://`-Ziel statt `ws://`: Die Seite lädt, doch die Echtzeit-Funktion fällt ohne Meldung aus. Der zweite ist ein Pfad, bei dem die Anwendung ihren WebSocket unter einer anderen Adresse erwartet; ein Blick in die Konsole der Entwicklerwerkzeuge zeigt die tatsächlich angefragte URL. Der dritte sind Zeitlimits, die ruhende Verbindungen kappen.

```apache
# falsch: WebSocket als normales HTTP weitergeleitet
ProxyPass "/ws/" "http://127.0.0.1:9001/"
# richtig: ws:// mit mod_proxy_wstunnel
ProxyPass "/ws/" "ws://127.0.0.1:9001/"
```

> **Praxisbeispiel: Entwicklungsserver und Live-Anzeigen**
>
> WebSockets begegnen einem nicht nur in Chats. Viele Entwicklungswerkzeuge (Live-Reload) und Verwaltungsoberflächen nutzen sie. Wenn „alles geht, nur die Live-Aktualisierung nicht“, ist die Weiterleitung der erste Verdächtige.

## 7.7 Forwarded Headers

Wie in Einheit 7.1 gezeigt, verliert das Backend durch den Proxy drei Informationen: die Adresse des Clients, den ursprünglich angefragten Host und das ursprüngliche Protokoll (HTTP oder HTTPS). Alle drei braucht eine Anwendung: für Protokolle und Sperren nach Adresse, für Links und Weiterleitungen, für die Entscheidung, ob ein Cookie als `Secure` markiert wird. Die Informationen werden in *Forwarded Headers* weitergegeben. Üblich sind `X-Forwarded-For` (Client-Adresse, bei mehreren Stationen eine Liste), `X-Forwarded-Host` (ursprünglicher Host) und `X-Forwarded-Proto` (`http` oder `https`). Der standardisierte Header `Forwarded` (RFC 7239) bündelt dasselbe, ist in der Praxis aber seltener.

Apache liefert die ersten beiden von sich aus (siehe Test in 7.1), nicht aber das Protokoll. Dieses muss man selbst setzen, und dafür eignet sich `mod_headers` mit `RequestHeader`. Der Haken: Zu welchem Zeitpunkt der Header gesetzt wird, und ob der Client ihn bereits mitgeschickt hat.

```apache
<VirtualHost *:443>
    ServerName www.example.org
    ProxyPass        "/" "http://127.0.0.1:3000/"
    ProxyPassReverse "/" "http://127.0.0.1:3000/"
    RequestHeader set X-Forwarded-Proto "https"
</VirtualHost>
<VirtualHost *:80>
    ServerName www.example.org
    ProxyPass        "/" "http://127.0.0.1:3000/"
    ProxyPassReverse "/" "http://127.0.0.1:3000/"
    RequestHeader set X-Forwarded-Proto "http"
</VirtualHost>
```

Das Beispiel besteht aus zwei Virtual Hosts, die dasselbe Backend bedienen, aber das Protokoll fest eintragen. `set` überschreibt einen vom Client mitgeschickten Wert, so dass niemand dem Backend ein falsches `https` vorspiegeln kann. Das Ergebnis lässt sich beim Backend prüfen, und genau das tut man bei der Einrichtung.

Darüber hinaus steht Apache im Fall einer Kette von Proxys vor der Frage, welchen Angaben er trauen darf. Dafür dient das Modul `mod_remoteip`, das die Gegenrichtung abdeckt: Steht Apache *hinter* einem anderen Proxy (Lastverteiler, CDN), dann sieht er als Client-Adresse die des Proxys. Mit `RemoteIPHeader X-Forwarded-For` und `RemoteIPInternalProxy` (oder `RemoteIPTrustedProxy`) sagt man ihm, welchem Header er bei welchen Absendern glauben soll. Der Test mit dem Proxy auf `127.0.0.1` und einer Anfrage mit `X-Forwarded-For: 203.0.113.7` ergab im Log mit `LogFormat "%a (Verbindung %{c}a)"` die Zeile `203.0.113.7 (Verbindung 127.0.0.1)`; ohne den Header lautete sie `127.0.0.1 (Verbindung 127.0.0.1)`. Im Log blieb der Header `X-Forwarded-For` selbst leer („-“), weil `mod_remoteip` ihn nach der Auswertung entfernt. Die Einzelheiten zu Vertrauen und Fälschung folgen in Einheit 7.10.

### Typische Fehler.

Der häufigste ist ein Backend, das die Header nicht auswertet, weil es dafür konfiguriert werden muss (viele Frameworks haben eine Einstellung „vertraue dem Proxy“). Der zweite ist `RequestHeader append` oder `add` statt `set` bei `X-Forwarded-Proto`: Ein vom Client gesendeter Wert bleibt dann erhalten. Der dritte ist, den Header im Backend ungeprüft zu verwenden, obwohl das Backend auch direkt aus dem Internet erreichbar ist: Jeder könnte die Angaben fälschen.

```apache
# falsch: der Wert des Clients bleibt bestehen
RequestHeader add X-Forwarded-Proto "https"
# richtig: der Proxy bestimmt den Wert
RequestHeader set X-Forwarded-Proto "https"
```

> **Praxisbeispiel: Endlose Weiterleitungsschleife**
>
> Ein klassischer Fall: Die Anwendung erzwingt HTTPS und leitet `http`-Anfragen um. Da der Proxy dem Backend immer per HTTP schreibt, hält sich die Anwendung für ungesichert und leitet endlos weiter. Browser melden „zu viele Weiterleitungen“. Die Lösung ist der Header `X-Forwarded-Proto`, den die Anwendung auswerten muss.

## 7.8 Backend-Troubleshooting

Die Fehlersuche hinter einem Reverse Proxy folgt einer festen Reihenfolge: erst feststellen, *welche Station* den Fehler erzeugt, dann *warum*. Die Statuscodes liefern den ersten Hinweis. Die in diesem Modul beobachteten Fälle bei Apache sind `503` (Backend nicht erreichbar), `502` (Backend antwortet falsch oder zu spät) und `404` (Pfad stimmt nicht, oder das Backend selbst antwortet mit 404). Entscheidend ist, die Antwort des Proxys von der des Backends zu unterscheiden; die Seite, die der Besucher sieht, verrät es oft: Eine Fehlerseite im Stil von Apache stammt vom Proxy, eine andere Seite stammt vom Backend.

Die Standardwerkzeuge sind das Fehlerlog des Proxys, das Zugriffsprotokoll und ein direkter Aufruf des Backends. Der direkte Aufruf ist der wichtigste Schritt, weil er das Problem aufteilt: Antwortet das Backend auf `curl http://127.0.0.1:9001/pfad` korrekt, liegt der Fehler im Proxy; antwortet es schon dort falsch, hilft keine Proxy-Konfiguration. Mit `curl -v` und `-H` testet man außerdem, wie das Backend auf die vom Proxy gesetzten Header reagiert. Das Fehlerlog von Apache hilft mit einer Reihe fester Meldungen. Aus den Tests dieses Moduls:

```text
AH00957: http: attempt to connect to 127.0.0.1:9999 (127.0.0.1:9999) failed
AH01114: HTTP: failed to make connection to backend: 127.0.0.1
AH01102: error reading status line from remote server 127.0.0.1:9001
AH00898: Error reading from remote server returned by /app/slow
```

Die ersten beiden gehören zusammen und bedeuten, dass keine Verbindung zustande kam: Das Backend läuft nicht, lauscht auf einem anderen Port oder wird durch eine Firewall blockiert. Das `503` ist die Folge. Die letzten beiden gehören ebenfalls zusammen: Die Verbindung stand, aber eine Antwort blieb aus oder brach ab; das `502` ist die Folge. Auf Systemen mit SELinux ist eine häufige, unscheinbare Ursache für den ersten Fall das Verbot, dass der Webserver Netzwerkverbindungen aufbaut (`httpd_can_network_connect`); die Meldung ist dann eine „Permission denied“ beim Verbindungsaufbau. Das wurde in der Testumgebung nicht geprüft, ist aber auf Red-Hat-artigen Systemen ein bekannter Stolperstein.

Mit erhöhter Protokollstufe wird die Spur genauer: `LogLevel warn proxy:trace2` zeigt, welche Regel gewählt, welches Ziel angesprochen und welche Verbindung wiederverwendet wurde. Die Stufe gehört nur für die Dauer der Suche in die Konfiguration, weil sie bei Last viel schreibt. Für das Verhalten der Mitglieder einer Gruppe hilft der Balancer-Manager (`/balancer-manager`), der Zustand, Gewicht und Fehlerzähler jedes Mitglieds anzeigt.

### Typische Fehler.

Der häufigste Fehler ist, am Proxy zu suchen, ohne das Backend direkt abzufragen. Der zweite ist, `502` und `503` als dasselbe zu lesen und den Zeitlimit-Fall (langsames Backend) als Ausfall zu behandeln. Der dritte ist, ein veraltetes Ziel zu prüfen: Nach einer Änderung der Konfiguration ohne `graceful` läuft der alte Zustand weiter. Man prüft deshalb zuerst mit `apachectl -t`, ob die Datei gültig ist, und lädt dann neu.

```bash
# falsch: nur am Proxy raten
curl -i http://localhost/app/
# richtig: Backend direkt und Proxy vergleichen
curl -i http://127.0.0.1:9001/
curl -i http://localhost/app/
tail -n 20 /var/log/apache2/error.log
```

> **Praxisbeispiel: Die Checkliste im Notfall**
>
> Bei einem Einsatz um drei Uhr nachts zählt eine feste Reihenfolge: läuft das Backend (Prozess, Port), antwortet es direkt, was sagt das Fehlerlog des Proxys, wurde die Konfiguration seit dem letzten Reload geändert. Wer diese vier Fragen kennt, löst die Mehrzahl der Fälle in Minuten.

## 7.9 Proxy Header

Bei Nginx übernimmt `ngx_http_proxy_module` die Weiterleitung, und es ist immer eingebaut. Die zentrale Direktive heißt `proxy_pass`. Sie steht in einem `location`-Block und nennt das Ziel. Anders als bei Apache hängt die Wirkung hier an einer Feinheit, die jeder kennen muss, der Nginx als Proxy betreibt: ob das Ziel einen *URI-Teil* hat, also einen Pfad nach der Adresse, und sei er nur ein Schrägstrich.

Die Regel lautet: Steht in `proxy_pass` nur Schema, Host und Port, gibt Nginx den Pfad der Anfrage unverändert weiter. Steht danach ein Pfad (auch nur `/`), ersetzt Nginx den Teil der Anfrage, der dem `location`-Präfix entspricht, durch diesen Pfad. Die Testumgebung zeigte es mit vier Blöcken, die alle zum selben Backend führen:

```nginx
location /a/ { proxy_pass http://127.0.0.1:9001; }
location /b/ { proxy_pass http://127.0.0.1:9001/; }
location /c/ { proxy_pass http://127.0.0.1:9001/x/; }
```

Eine Anfrage nach `/a/x` kam beim Backend als `/a/x` an (Pfad unverändert), `/b/x` als `/x` (Präfix durch `/` ersetzt) und `/c/x` als `/x/x` (Präfix durch `/x/` ersetzt). Der Unterschied zwischen `/a/` und `/b/` besteht nur in einem Schrägstrich am Ende des Ziels. Das ist dieselbe Regel, die man von `alias` kennt (Einheit 5.1), nur mit umgekehrter Schreibweise, und sie ist die häufigste Ursache für „404 am Backend“ bei frisch eingerichteten Proxys.

Das zweite Thema sind die Header. Nginx baut für die Anfrage an das Backend eine neue Anfrage und gibt dabei, anders als Apache, *nichts* automatisch weiter außer den eigenen Standardwerten. Der Test zeigte: Der `Host`-Header lautete `127.0.0.1:9001` (Adresse des Backends), und die Verbindung war mit `Connection: close` markiert, es gab keine `X-Forwarded`-Header. Alles, was das Backend wissen soll, setzt man mit `proxy_set_header`. Die übliche Gruppe:

```nginx
location /h/ {
    proxy_pass http://127.0.0.1:9001/;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Die vier Zeilen leisten Folgendes: `Host $host` gibt den vom Client angefragten Host weiter, `X-Real-IP $remote_addr` die Adresse des Clients, `X-Forwarded-For` hängt die Client-Adresse an eine eventuell vorhandene Liste an (siehe 7.10), und `X-Forwarded-Proto $scheme` nennt das Protokoll der Client-Verbindung. Das Backend sah nach dieser Konfiguration im Test `Host: localhost` (der Name aus der Anfrage), `X-Real-IP: 127.0.0.1` und `X-Forwarded-Proto: http`. Hinzu kam bei einer Anfrage, die selbst schon `X-Forwarded-For: 10.9.9.9` trug, der Wert `10.9.9.9, 127.0.0.1`: Die Adresse der unmittelbaren Verbindung wurde hinten angehängt.

Eine Besonderheit der Vererbung erwischt viele: Die Direktiven `proxy_set_header` werden von der äußeren Ebene (`server`) nur dann geerbt, wenn die innere (`location`) *keine einzige* eigene `proxy_set_header`-Zeile enthält. Sobald ein `location`-Block auch nur einen Header setzt, gelten die Zeilen der äußeren Ebene dort nicht mehr. Man schreibt die Gruppe deshalb meist in eine Datei, die per `include` in jeden Block geholt wird. Das Muster entspricht der Vererbung von `add_header` aus Modul 5.

Ein kleiner Zusatz betrifft die Weiterleitungen des Backends, das Gegenstück zu `ProxyPassReverse` (Einheit 7.3). Nginx schreibt `Location`-Header nur dann um, wenn sie genau dem Ziel von `proxy_pass` entsprechen, und das ist bei Ziel ohne URI und `Host`-Header `$host` oft nicht der Fall. Mit `proxy_redirect http://127.0.0.1:9001/ /app/;` legt man die Umschreibung selbst fest. Im Test machte die Direktive aus `http://127.0.0.1:9001/neu` die Adresse `http://localhost:8061/app/neu`; ohne sie blieb der Wert unverändert.

### Typische Fehler.

Der erste Fehler ist der Schrägstrich am Ziel (siehe oben). Der zweite ist, den `Host`-Header nicht zu setzen, so dass Anwendungen mit mehreren Domains (virtuelle Hosts im Backend) die falsche Seite ausliefern. Der dritte ist die oben beschriebene Vererbung.

```nginx
# falsch: Backend erwartet /x, bekommt /app/x
location /app/ { proxy_pass http://127.0.0.1:9001; }
# richtig: Präfix wird entfernt
location /app/ { proxy_pass http://127.0.0.1:9001/; }
```

> **Praxisbeispiel: Eine Datei für alle Proxy-Header**
>
> In Projekten legt man eine Datei `proxy_params` (oder ähnlich) mit den Header-Zeilen an und bindet sie per `include` in jeden Proxy-Block ein. So bleibt die Liste einheitlich, und Änderungen (zum Beispiel ein neuer Header) erfolgen an einer Stelle.

## 7.10 X-Forwarded-For

Der Header `X-Forwarded-For` (kurz XFF) trägt die Kette der Adressen, über die eine Anfrage gelaufen ist: zuerst die des Clients, dann jeder Proxy, der sie weitergereicht hat. Jede Station hängt die Adresse ihres Vorgängers (der Verbindung, die sie sieht) an die Liste. Für das Backend ist der *letzte* Eintrag der verlässlichste, denn ihn hat der eigene Proxy gesetzt; die Einträge davor stammen aus der Kette und sind nur so vertrauenswürdig wie jede Station davor.

Hier liegt das Sicherheitsproblem. Der Header ist eine bloße Behauptung des Clients. Wer ihn selbst mitschickt (`curl -H "X-Forwarded-For: 1.2.3.4"`), kann damit Sperren nach Adresse umgehen oder die Protokolle verfälschen, wenn die Anwendung dem ersten Eintrag blind glaubt. Der Nginx-Wert `$proxy_add_x_forwarded_for` hängt die echte Verbindungsadresse an und bewahrt den mitgeschickten Wert; der Proxy, der als *erste* Station im eigenen Netz steht, sollte den Header dagegen ersetzen: `proxy_set_header X-Forwarded-For $remote_addr;`. Welche Variante richtig ist, hängt von der Kette ab: Steht vor dem eigenen Nginx kein weiterer Proxy, überschreibt man; steht davor ein vertrauter Proxy (Lastverteiler, CDN), bewahrt man und wertet den Header gezielt aus.

Das Auswerten übernimmt bei Nginx `ngx_http_realip_module`, das in der Testumgebung eingebaut war. Es ersetzt die Variable `$remote_addr` durch die Adresse aus dem Header, aber nur, wenn die Verbindung von einer vertrauten Adresse kommt:

```nginx
set_real_ip_from 127.0.0.1;
real_ip_header   X-Forwarded-For;
```

Die erste Zeile nennt die vertrauten Proxys, die zweite den Header, aus dem die Client-Adresse zu lesen ist. Im Test lieferte eine Anfrage mit `X-Forwarded-For: 203.0.113.7` von `127.0.0.1` danach `$remote_addr` gleich `203.0.113.7`. Kam dieselbe Anfrage von einer nicht aufgelisteten Adresse, wurde der Header ignoriert. Bei Ketten aus mehreren Proxys ergänzt man `real_ip_recursive on;`, damit Nginx von rechts nach links alle vertrauten Stationen überspringt und die erste unvertraute Adresse als Client nimmt.

Das Apache-Gegenstück ist `mod_remoteip` (Einheit 7.7). Beide folgen demselben Grundsatz: Einem Header wird nur geglaubt, wenn er von einer Adresse kommt, die man vorher als vertrauenswürdig erklärt hat. Diese Liste muss genau so lang sein wie die Wirklichkeit: Ein zu großzügiger Bereich (`0.0.0.0/0`) macht den Schutz zunichte.

Aus Sicht des Datenschutzes ist die Client-Adresse ein personenbezogenes Datum (im Sinne der DSGVO, Hinweis: keine Rechtsberatung). Wer sie in Protokolle schreibt, braucht dafür einen Zweck und eine Löschfrist; Protokollierung behandelt Modul 9.

### Typische Fehler.

Der erste Fehler ist, dem Header ohne Prüfung zu glauben und Zugriffsregeln darauf zu bauen. Der zweite ist die Gegenrichtung: Das Backend sieht nur die Adresse des Proxys, weil `realip` fehlt, und alle Besucher teilen sich ein Ratenlimit oder eine Sperre. Der dritte ist ein zu weiter vertrauter Bereich.

```nginx
# falsch: jedem Absender wird geglaubt
set_real_ip_from 0.0.0.0/0;
real_ip_header   X-Forwarded-For;
# richtig: nur der eigene Lastverteiler
set_real_ip_from 10.0.0.5;
real_ip_header   X-Forwarded-For;
```

> **Praxisbeispiel: Sperre trifft alle**
>
> Ein klassischer Vorfall: Ein Ratenlimit (Modul 10) wird eingerichtet, und plötzlich sind alle Besucher gesperrt, weil der Server nur die Adresse des vorgeschalteten Lastverteilers sieht. Die Ursache ist fehlendes `realip`. Die Gegenprobe ist das Zugriffsprotokoll: Steht überall dieselbe Adresse, fehlt die Auswertung.

## 7.11 Buffering

Standardmäßig *puffert* Nginx die Antwort des Backends: Es liest sie so schnell wie möglich vollständig in Speicherpuffer (und bei Bedarf in eine temporäre Datei), gibt das Backend frei und reicht die Antwort dann in der Geschwindigkeit des Clients weiter. Das lohnt sich, weil ein Backend-Prozess teuer ist und ein langsamer Client ihn sonst blockieren würde: Eine Anwendung, die in 20 Millisekunden antwortet, wäre bei einem Mobilfunk-Client sekundenlang belegt. Der Puffer entkoppelt beide Seiten.

Die wichtigsten Direktiven sind `proxy_buffering` (an oder aus), `proxy_buffer_size` (Größe des Puffers für den Antwortkopf), `proxy_buffers` (Anzahl und Größe der Puffer für den Rest) und `proxy_busy_buffers_size` (wie viel gleichzeitig an den Client gesendet werden darf, während noch gelesen wird). Hinzu kommen `proxy_max_temp_file_size` und `proxy_temp_path` für den Überlauf auf die Platte. Passt die Antwort nicht in die Puffer, schreibt Nginx den Rest in eine temporäre Datei und meldet das mit einer Warnung im Log („an upstream response is buffered to a temporary file“). In der Testumgebung konnte ich diese Meldung nicht erzeugen, auch nicht mit einer 270 KB großen Antwort und einer Begrenzung der Client-Geschwindigkeit; ich gebe sie deshalb nur nach der Dokumentation und dem Kenntnisstand des Autors an, nicht als beobachtetes Ergebnis.

Die Größen stehen in einer festen Beziehung, die Nginx beim Prüfen der Konfiguration kontrolliert. Bei einem Versuch mit zu kleinen `proxy_buffers` und zu großem `proxy_busy_buffers_size` lehnte `nginx -t` die Datei ab:

```text
nginx: [emerg] "proxy_busy_buffers_size" must be less than the size of all "proxy_buffers" minus one buffer
```

Die Meldung sagt, dass `proxy_busy_buffers_size` kleiner sein muss als die Summe aller Puffer abzüglich eines Puffers. Mit `proxy_buffer_size 4k; proxy_buffers 2 4k; proxy_busy_buffers_size 4k;` war die Bedingung erfüllt (8 KB gesamt, davon einer abzuziehen, 4 KB blieben erlaubt). Solche Feinabstimmung ist selten nötig; die Voreinstellungen (ein Puffer von 4 oder 8 KB für den Kopf, acht Puffer für den Rest) tragen die meisten Anwendungen.

Es gibt Fälle, in denen man das Puffern ausschaltet: `proxy_buffering off;`. Typisch sind *Server-Sent Events* und andere Ströme, bei denen der Client jedes Stück sofort sehen soll, sowie sehr große Downloads, die man nicht zwischenlagern will. Statt der ganzen Location kann auch das Backend das Puffern pro Antwort abschalten, indem es den Header `X-Accel-Buffering: no` sendet; Nginx beachtet ihn. Auch für Anfragen des Clients wird gepuffert (`proxy_request_buffering`); wer große Uploads direkt zum Backend durchreichen will, schaltet das aus, zahlt dafür aber mit einem länger belegten Backend.

### Typische Fehler.

Der erste Fehler ist, das Puffern bei Strömen laufen zu lassen: Die Ereignisse erreichen den Browser gebündelt und verspätet, was wie ein Fehler der Anwendung aussieht. Der zweite ist, das Puffern pauschal abzuschalten „für mehr Geschwindigkeit“, wodurch langsame Clients Backend-Prozesse blockieren. Der dritte ist eine Platte ohne Platz im Pfad der temporären Dateien.

```nginx
# falsch: Ereignisstrom wird gepuffert
location /events/ { proxy_pass http://127.0.0.1:9001/; }
# richtig: Strom sofort weiterreichen
location /events/ {
    proxy_pass http://127.0.0.1:9001/;
    proxy_buffering off;
    proxy_read_timeout 1h;
}
```

> **Praxisbeispiel: Der Fortschrittsbalken, der nicht läuft**
>
> Ein Standardfall ist ein Fortschrittsbalken oder Live-Protokoll, das hinter dem Proxy erst am Ende alles auf einmal anzeigt. Die Ursache ist das Puffern; die Abhilfe ist `proxy_buffering off` für diese Location oder der Header `X-Accel-Buffering: no` vom Backend.

## 7.12 Timeouts

Ein Proxy hat mehrere Uhren, und jede hat ihre eigene Aufgabe. Bei Nginx gibt es drei Zeitlimits für die Strecke zum Backend: `proxy_connect_timeout` (wie lange der Verbindungsaufbau dauern darf, Voreinstellung 60 Sekunden), `proxy_send_timeout` (wie lange zwischen zwei Schreibvorgängen zum Backend vergehen darf) und `proxy_read_timeout` (wie lange zwischen zwei Lesevorgängen vom Backend vergehen darf, Voreinstellung ebenfalls 60 Sekunden). Wichtig ist das Wort *zwischen*: Die Zeitlimits messen nicht die Gesamtdauer, sondern die Stille zwischen zwei Datenpaketen. Ein Backend, das alle 30 Sekunden ein Lebenszeichen schickt, wird nie abgebrochen, auch wenn die Antwort Minuten dauert.

Die Fehlercodes unterscheiden sich von Apache, und das sollte man im Kopf haben. Im Test lieferte `proxy_read_timeout 1s` bei einem Backend, das drei Sekunden braucht, den Status `504 Gateway Time-out`; das Fehlerlog enthielt `upstream timed out (110: Connection timed out) while reading response header from upstream`. War das Backend nicht erreichbar (Port ohne Prozess), antwortete Nginx mit `502 Bad Gateway` und schrieb `connect() failed (111: Connection refused) while connecting to upstream`. Bei Apache war es genau andersherum: Ausfall gab `503`, Zeitüberschreitung `502`. Wer zwischen beiden Servern wechselt, sollte diese Tabelle verinnerlichen, weil Überwachungssysteme oft auf Statuscodes reagieren.

```nginx
location /slow/ {
    proxy_pass http://127.0.0.1:9001/slow;
    proxy_connect_timeout 3s;
    proxy_read_timeout    1s;
}
```

Das Beispiel gibt dem Verbindungsaufbau drei Sekunden und dem Warten auf eine Antwort eine Sekunde. Der Aufbau soll bei einem gesunden Backend in Millisekunden gelingen; ein langer Wert hilft nur, ein totes Backend länger anzustarren. Beim Lesen hängt der passende Wert von der Anwendung ab: Berichte oder Exporte brauchen länger, normale Seiten nicht. Man setzt daher keinen globalen großen Wert, sondern erhöht ihn nur in der Location, die es braucht.

Zeitlimits spielen mit dem Nachbarn zusammen. Ein Browser, ein vorgeschalteter Lastverteiler und der eigene Proxy haben jeweils eigene Grenzen, und die kürzeste gewinnt. Die Faustregel lautet, dass die Zeitlimits von außen nach innen kürzer werden sollten: Der äußere Proxy wartet etwas länger als der innere, damit der Fehler dort entsteht, wo man ihn erklären kann, und nicht als stumme Trennung. Bei WebSockets und Strömen (7.6, 7.11) ist `proxy_read_timeout` besonders wichtig, weil dort Stille normal ist; ohne Anpassung kappt Nginx ruhende Verbindungen nach 60 Sekunden.

Für Wiederholungsversuche gibt es `proxy_next_upstream`: Es legt fest, bei welchen Fehlern (Verbindung, Zeitüberschreitung, bestimmte Statuscodes) Nginx die Anfrage an einen anderen Server der Gruppe schickt. Das gehört zur Lastverteilung (Modul 8). Hier ist nur die Warnung wichtig, dass Wiederholungen bei nicht idempotenten Anfragen wie `POST` gefährlich sind; Nginx wiederholt sie standardmäßig nicht.

### Typische Fehler.

Der erste Fehler ist, bei Zeitüberschreitung einfach das Limit hochzusetzen, statt zu fragen, warum die Anwendung so langsam ist. Der zweite ist, die Codes zu verwechseln (504 heißt „Backend zu langsam“, 502 „Backend nicht erreichbar oder falsche Antwort“). Der dritte ist ein vergessenes Limit bei langen Verbindungen.

```nginx
# falsch: globaler Riesenwert verdeckt Probleme
proxy_read_timeout 3600s;
# richtig: nur dort, wo es gebraucht wird
location /export/ {
    proxy_pass http://127.0.0.1:9001/export/;
    proxy_read_timeout 300s;
}
```

> **Praxisbeispiel: Das Rätsel „nach genau 60 Sekunden“**
>
> Berichten Anwender, dass ein Vorgang *nach genau einer Minute* abbricht, ist die Ursache fast immer ein Zeitlimit auf der Strecke, in Nginx der Wert von 60 Sekunden. Die Fehlerseite (504) und die Meldung im Log nennen die Station.

## 7.13 gRPC Proxy

*gRPC* ist ein Protokoll für Aufrufe zwischen Diensten. Es läuft über HTTP/2 und überträgt Nachrichten im Binärformat *Protocol Buffers*. In Microservice-Umgebungen ist es verbreitet, und Nginx kann es mit `ngx_http_grpc_module` weiterleiten. Weil gRPC auf HTTP/2 beruht, muss Nginx auf der Client-Seite HTTP/2 sprechen (bei TLS wird es per ALPN ausgehandelt, Modul 6), und zum Backend verwendet es ein eigenes Schema: `grpc://` für unverschlüsselte und `grpcs://` für TLS-Verbindungen.

Die Direktiven entsprechen denen des HTTP-Proxys mit dem Präfix `grpc_`: `grpc_pass` (Ziel), `grpc_set_header`, `grpc_read_timeout`, `grpc_send_timeout`, `grpc_connect_timeout`. Das Beispiel nutzt einen `upstream`-Block, der in Modul 8 vertieft wird:

```nginx
upstream grpc_backend {
    server 127.0.0.1:50051;
}
server {
    listen 8443 ssl http2;
    ssl_certificate     /etc/nginx/tls/cert.pem;
    ssl_certificate_key /etc/nginx/tls/key.pem;

    location / {
        grpc_pass grpc://grpc_backend;
        grpc_set_header Host $host;
        grpc_read_timeout 300s;
    }
}
```

Der Server lauscht mit TLS und HTTP/2 auf Port 8443, und alle Anfragen gehen als gRPC an den Dienst auf Port 50051. Die Syntax dieser Konfiguration bestand in der Testumgebung den Test mit `nginx -t` (mit eingebautem HTTP/2-Modul). Gegen einen echten gRPC-Dienst habe ich sie *nicht* ausgeführt; das Beispiel zeigt die Struktur nach der Dokumentation. Ab Nginx 1.25.1 gilt `listen ... http2` als veraltet, und HTTP/2 wird mit der eigenen Direktive `http2 on;` eingeschaltet (Modul 6); die Testversion 1.24 kennt sie noch nicht.

Die Besonderheit von gRPC gegenüber normalem HTTP liegt in den Zeitlimits: Streaming-Aufrufe halten die Verbindung lange offen, so dass `grpc_read_timeout` analog zu WebSockets großzügig zu wählen ist. Außerdem sind die Fehlercodes anders: gRPC meldet Fehler im HTTP-Trailer `grpc-status`, nicht über den HTTP-Statuscode; ein Proxy-Fehler wird von Nginx in einen gRPC-Status übersetzt. Zur Fehlersuche schaut man ins Fehlerlog von Nginx und prüft den Dienst mit einem gRPC-Werkzeug (zum Beispiel `grpcurl`) direkt am Backend.

### Typische Fehler.

Der erste Fehler ist die Verwendung von `proxy_pass` statt `grpc_pass`: Der Dienst bekommt HTTP/1.1 und antwortet mit einem Fehler. Der zweite ist fehlendes HTTP/2 auf der Client-Seite. Der dritte ist, das Backend mit `grpc://` anzusprechen, obwohl es TLS erwartet (`grpcs://`).

```nginx
# falsch: HTTP-Proxy für einen gRPC-Dienst
location / { proxy_pass http://grpc_backend; }
# richtig: gRPC-Modul
location / { grpc_pass grpc://grpc_backend; }
```

> **Praxisbeispiel: Ein Eingang für viele Dienste**
>
> In Umgebungen mit mehreren gRPC-Diensten nutzt man den Pfad (Dienst- und Methodenname bilden ihn: `/paket.Dienst/Methode`), um mit mehreren `location`-Blöcken auf verschiedene Backends zu verteilen. Nginx wird so zum einzigen Eingang, der TLS beendet und Dienste verteilt.

## Übungsaufgaben

Die Aufgaben steigen im Schwierigkeitsgrad. Die praktischen Aufgaben lassen sich mit zwei einfachen Backends nachvollziehen (zum Beispiel `python3 -m http.server 9001` und `9002` in zwei Verzeichnissen mit unterschiedlichen Dateien). Die Lösungen stehen im nächsten Abschnitt.

**Aufgabe 1 (leicht).** Erkläre in eigenen Worten den Unterschied zwischen einem Forward Proxy und einem Reverse Proxy. Welche Direktive trennt bei Apache beide Betriebsarten, und welcher Wert ist für einen Reverse Proxy richtig?

**Aufgabe 2 (leicht).** Ein Nginx-Block lautet `location /api/ { proxy_pass http://127.0.0.1:3000; }`. Welchen Pfad sieht das Backend bei einer Anfrage nach `/api/users`? Wie lautet er, wenn das Ziel mit einem Schrägstrich endet?

**Aufgabe 3 (leicht).** Bei Apache antwortet der Proxy mit 503, bei Nginx mit 502, obwohl in beiden Fällen das Backend nicht läuft. Erkläre den Unterschied in der Zuordnung der Codes und nenne für jeden Server den Statuscode bei einem *zu langsamen* Backend.

**Aufgabe 4 (mittel).** Ein Backend leitet nach der Anmeldung auf `http://127.0.0.1:3000/start` um, der Browser des Besuchers meldet einen Verbindungsfehler. Nenne die Ursache und die Abhilfe für Apache und für Nginx.

**Aufgabe 5 (mittel).** Eine Anwendung hinter Nginx erzwingt HTTPS und leitet in einer Endlosschleife weiter. Welche Informationen fehlen dem Backend, und welche Zeile in der Nginx-Konfiguration behebt es?

**Aufgabe 6 (praktisch).** Schreibe eine Apache-Konfiguration, die `/app/` an `127.0.0.1:9001` weiterleitet, Redirects korrigiert, `/app/assets/` lokal ausliefert und `X-Forwarded-Proto: https` setzt.

**Aufgabe 7 (praktisch).** Schreibe eine Nginx-Konfiguration für `/ws/`, die eine WebSocket-Verbindung zu `127.0.0.1:9001` durchreicht und ruhende Verbindungen erst nach einer Stunde trennt.

**Aufgabe 8 (schwer).** Du betreibst Nginx hinter einem Lastverteiler mit der Adresse `10.0.0.5`. Alle Besucher erscheinen im Zugriffsprotokoll mit dieser Adresse. Beschreibe die Ursache, schreibe die Konfiguration und nenne das Risiko einer zu weiten Vertrauensliste.

**Aufgabe 9 (schwer).** Ein Export-Bericht bricht nach genau 60 Sekunden mit einem 504 ab; normale Seiten sind schnell. Entwickle eine Fehlersuche und eine Lösung, die andere Seiten nicht beeinträchtigt. Warum ist ein globaler großer Wert schlecht?

## Lösungen und Erklärungen

**Lösung 1.** Ein Forward Proxy handelt im Auftrag von Clients und ruft beliebige Ziele ab; ein Reverse Proxy handelt im Auftrag von Servern und leitet an feste, vom Betreiber bestimmte Backends weiter. Bei Apache schaltet `ProxyRequests` die Forward-Funktion ein. Für einen Reverse Proxy gilt `ProxyRequests Off`. Der Wert `On` auf einem öffentlichen Server ohne Zugriffsschutz erzeugt einen offenen Proxy, der missbraucht werden kann.

**Lösung 2.** Ohne Schrägstrich am Ziel bleibt der Pfad unverändert: Das Backend sieht `/api/users`. Mit `http://127.0.0.1:3000/` wird das Präfix `/api/` durch `/` ersetzt, das Backend sieht `/users`. Die Regel hängt am URI-Teil des Ziels, auch wenn er nur ein Schrägstrich ist; sie ist im Test dieses Moduls bestätigt (`/a/x` blieb `/a/x`, `/b/x` wurde `/x`).

**Lösung 3.** Beide Server haben dieselbe Unterscheidung (kein Kontakt gegen falsche oder zu späte Antwort), aber vertauschte Codes. Apache: Backend nicht erreichbar gibt 503, Zeitüberschreitung gibt 502. Nginx: Backend nicht erreichbar gibt 502, Zeitüberschreitung gibt 504. Wer Alarme auf Statuscodes baut, muss das pro Server berücksichtigen. Das Fehlerlog nennt in beiden Fällen die genaue Ursache.

**Lösung 4.** Die Ursache ist, dass der `Location`-Header der Antwort die interne Adresse enthält und der Proxy ihn unverändert weitergibt. Apache: `ProxyPassReverse` mit denselben Argumenten wie `ProxyPass`. Nginx: `proxy_redirect http://127.0.0.1:3000/ /;` (oder mit dem passenden Pfadpräfix) sowie `proxy_set_header Host $host`. Die Probe ist `curl -D - -o /dev/null` auf die Anmeldeseite und der Blick auf `Location`.

**Lösung 5.** Der Proxy spricht mit dem Backend per HTTP, so dass die Anwendung die Verbindung für ungesichert hält und auf HTTPS umleitet. Es fehlt die Angabe, dass der Besucher HTTPS verwendet. Die Zeile `proxy_set_header X-Forwarded-Proto $scheme;` im Proxy-Block liefert sie; die Anwendung muss so eingestellt sein, dass sie diesem Header (vom Proxy) vertraut.

**Lösung 6.**

```apache
ProxyRequests Off
ProxyPass        "/app/assets/" "!"
ProxyPass        "/app/" "http://127.0.0.1:9001/"
ProxyPassReverse "/app/" "http://127.0.0.1:9001/"
RequestHeader set X-Forwarded-Proto "https"
```

Die Ausnahme steht vor der allgemeinen Regel, sonst würde sie nie greifen. Für die lokale Auslieferung von `/app/assets/` braucht es zusätzlich ein `Alias` mit zugehörigem `Directory`-Block (Modul 5). Die Module `proxy`, `proxy_http` und `headers` müssen geladen sein.

**Lösung 7.**

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
location /ws/ {
    proxy_pass http://127.0.0.1:9001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_read_timeout 1h;
}
```

Das `map` steht im `http`-Kontext. Ohne `proxy_http_version 1.1` und die beiden Header ergab der Test eine normale Antwort (200) statt `101`. Der Wert `proxy_read_timeout 1h` verhindert, dass ruhende Verbindungen nach 60 Sekunden getrennt werden.

**Lösung 8.** Die Ursache: Nginx sieht als Verbindungsadresse nur die des Lastverteilers. Lösung: `set_real_ip_from 10.0.0.5;` und `real_ip_header X-Forwarded-For;` (bei mehreren Stationen zusätzlich `real_ip_recursive on;`). Der Lastverteiler muss den Header setzen. Das Risiko einer zu weiten Liste (zum Beispiel `0.0.0.0/0`) ist, dass jeder Absender seine Adresse fälschen kann und damit Sperren und Protokolle unterläuft. Die Wirkung ließ sich im Test nachvollziehen: Von einer vertrauten Adresse wurde der Wert übernommen.

**Lösung 9.** Das Muster „genau 60 Sekunden“ passt zu `proxy_read_timeout`. Das Fehlerlog bestätigt es mit `upstream timed out (110: Connection timed out) while reading response header`. Abhilfe: nur für die Export-Location `proxy_read_timeout 300s;` setzen. Sinnvoller ist langfristig, dass die Anwendung den Export asynchron erzeugt und dem Besucher später einen Link gibt. Ein globaler großer Wert ist schlecht, weil er Fehler bei allen Seiten verdeckt, Backend-Prozesse lange blockiert und bei Ausfällen die Besucher lange warten lässt.
