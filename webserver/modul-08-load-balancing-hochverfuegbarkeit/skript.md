# Modul 08 - Load Balancing, Hochverfügbarkeit und Traffic Steering

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Listings unverändert, farbige Boxen als Zitatblöcke mit fettem Titel, Tabellen als Markdown-Tabellen, Übungsaufgaben und Lösungen als Absätze bzw. Überschriften). Die Lerneinheiten sind wie in der Quelle nach Modul nummeriert (8.1 bis 8.8), danach folgen „Übungsaufgaben“ (9) und „Lösungen und Erklärungen“. **Die Konfigurationen und Befehle wurden für dieses Repository nicht ausgeführt:** Laut Einleitung hat der Autor die Beispiele in einer Linux-Umgebung (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0) ausgeführt; nicht getestet sind laut Skript Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt. Viele Beispiele ändern Server-Konfiguration, Zertifikate, Rechte oder Dienste: nur in einer Testumgebung ausprobieren. Übersicht zum Modul: [README](README.md).

**Geplante Dauer:** 9 h | **Priorität:** 1 | **Lerneinheiten:** 8

## Lerneinheiten laut Lehrplan

| **Nr.** | **Lerneinheit**       | **Dauer (h)** | **Prio** |
|--------:|:----------------------|--------------:|---------:|
|     8.1 | upstream Blocks       |             1 |        1 |
|     8.2 | Round Robin           |             1 |        1 |
|     8.3 | least_conn            |           1,5 |        1 |
|     8.4 | ip_hash               |             1 |        1 |
|     8.5 | Weighted Routing      |             1 |        1 |
|     8.6 | Health Checks         |           1,5 |        2 |
|     8.7 | Failover              |             1 |        2 |
|     8.8 | Blue-Green und Canary |             1 |        2 |
|         | **Summe**             |         **9** |          |

## Überblick und Lernweg

Modul 7 hat gezeigt, wie ein Proxy Anfragen an *ein* Backend weiterreicht. Dieses Modul behandelt den nächsten Schritt: Anfragen auf *mehrere* Backends verteilen, den Ausfall einzelner Server überstehen und neue Programmversionen kontrolliert in Betrieb nehmen. Die Begriffe dafür sind *Load Balancing* (Lastverteilung), *Hochverfügbarkeit* (der Dienst bleibt trotz Ausfällen erreichbar) und *Traffic Steering* (gezieltes Lenken von Anfragen, etwa einer kleinen Besuchergruppe auf eine neue Version).

Der Lehrplan führt in diesem Modul vor allem Nginx-Begriffe auf (`upstream`, `least_conn`, `ip_hash`). Die Einheiten werden deshalb an Nginx erklärt; wo Apache dasselbe anders löst, steht der Apache-Weg direkt daneben, und die Balancer-Grundlagen aus Einheit 7.4 und 7.5 werden ergänzt statt wiederholt. Alle Verteilungsergebnisse im Text stammen aus Testläufen mit Nginx 1.24.0 und Apache 2.4.58 gegen zwei Test-Backends (`b1` auf Port 9001, `b2` auf Port 9002), die in ihrer Antwort den eigenen Namen nennen. Wo ein Verhalten nur der Dokumentation oder dem Kenntnisstand des Autors entspricht, steht das ausdrücklich dabei.

> **Merke**
>
> Lastverteilung löst zwei verschiedene Probleme, die man nicht verwechseln sollte: *Kapazität* (mehr Anfragen, als ein Server bewältigt) und *Ausfallsicherheit* (ein Server darf ausfallen). Wer nur zwei gleiche Server hinter einen Verteiler stellt, hat noch keine Hochverfügbarkeit: Fällt einer aus, muss der andere die gesamte Last allein tragen können, und der Verteiler selbst ist ein einzelner Ausfallpunkt.

## 8.1 upstream Blocks

Ein `upstream`-Block fasst mehrere Backend-Server unter einem Namen zusammen. Der Name steht danach in `proxy_pass` anstelle einer Adresse; Nginx wählt bei jeder Anfrage einen Server der Gruppe aus. Der Block steht im `http`-Kontext (also außerhalb von `server`) und kann von beliebig vielen Locations genutzt werden. Das ist der Vorteil gegenüber einer festen Adresse in `proxy_pass`: Die Liste der Backends steht an einer einzigen Stelle, und Gewichte, Wartungszustände und Verbindungseinstellungen gelten für alle Verwender gemeinsam.

```nginx
http {
    upstream shop {
        server 127.0.0.1:9001;
        server 127.0.0.1:9002;
    }
    server {
        listen 8071;
        location /shop/ {
            proxy_pass http://shop/;
        }
    }
}
```

Die Gruppe `shop` enthält zwei Server. In der `location` verweist `proxy_pass http://shop/;` auf den Gruppennamen; der Schrägstrich am Ende wirkt wie in Einheit 7.9 (das Präfix `/shop/` wird entfernt). Ohne weitere Angaben verteilt Nginx abwechselnd. Eine Serie von acht Anfragen ergab im Test vier Treffer für `b1` und vier für `b2`.

Jede `server`-Zeile kennt Parameter, die den Zustand und die Behandlung dieses einen Servers festlegen. Die wichtigsten sind `weight=` (Gewicht, siehe 8.5), `max_fails=` und `fail_timeout=` (Fehlererkennung, siehe 8.6 und 8.7), `backup` (Reserve, die nur bei Ausfall der übrigen einspringt) und `down` (Server ist dauerhaft aus der Verteilung genommen). Die beiden letzten sind die „Wartungszustände“ aus dem Lehrplan: `down` markiert einen Server als abgeschaltet, ohne dass man seine Zeile löschen muss; sie bleibt als Dokumentation stehen. Im Test mit `server 127.0.0.1:9002 down;` gingen vier von vier Anfragen an `b1`, und ebenso bei `backup`, solange `b1` lief.

```nginx
upstream shop {
    server 10.0.0.11:8080 weight=3;
    server 10.0.0.12:8080;
    server 10.0.0.13:8080 backup;     # nur bei Ausfall der anderen
    server 10.0.0.14:8080 down;       # gewartet, vorerst aus
}
```

Das Beispiel dokumentiert vier Rollen: ein stärkerer Server mit Gewicht 3, ein normaler, eine Reserve und ein Server in Wartung. Die Kommentare in der Datei sind kein Luxus; Wartungszustände, die nur im Kopf des Administrators existieren, führen im Notfall zu Fehlern.

Zwei Eigenschaften des `upstream`-Blocks sollte man kennen. Erstens kann man mit `keepalive 16;` einen Pool dauerhaft offener Verbindungen zu den Backends halten, was die Kosten für den Verbindungsaufbau spart; dafür müssen in der Location `proxy_http_version 1.1;` und `proxy_set_header Connection "";` gesetzt sein (Nginx spricht sonst HTTP/1.0 mit `Connection: close`, wie der Test in Einheit 7.9 zeigte). Zweitens kennt jeder Arbeitsprozess von Nginx den Zustand der Server zunächst nur für sich selbst. Mit der Direktive `zone name 64k;` legt man einen gemeinsamen Speicher an, damit alle Arbeitsprozesse denselben Zustand sehen; das ist nach der Dokumentation Voraussetzung für Funktionen wie die gemeinsame Fehlerzählung. Ich habe `zone` hier nicht getestet.

Bei Apache entspricht der Block `<Proxy "balancer://name">` mit `BalancerMember`-Zeilen dem `upstream`-Block (Einheit 7.4). Der Wartungszustand `down` heißt dort `status=+D`, die Reserve heißt `status=+H` (*hot standby*). Im Test lieferte `status=+D` bei vier Anfragen viermal `b1`; `status=+H` verhielt sich wie bei Nginx: Solange `b1` lief, bekam die Reserve nichts, und nach dem Beenden von `b1` antwortete `b2` auf alle vier Anfragen.

### Typische Fehler.

Der häufigste Fehler ist ein `upstream`-Block *innerhalb* von `server`: Nginx meldet dann einen Syntaxfehler, weil der Block nur im `http`-Kontext erlaubt ist. Ein zweiter ist ein Gruppenname, der mit einem Hostnamen verwechselt wird: Heißt die Gruppe `backend` und existiert zugleich ein DNS-Name `backend`, gewinnt die Gruppe; das kann überraschen. Ein dritter ist `backup` in einer Gruppe mit nur einem Server: Die Reserve ist dann der einzige Server und wird nie benutzt.

```nginx
# falsch: upstream im server-Block
server {
    upstream shop { server 127.0.0.1:9001; }
}
# richtig: upstream im http-Kontext
upstream shop { server 127.0.0.1:9001; }
server { location / { proxy_pass http://shop; } }
```

> **Praxisbeispiel: Eine Gruppe pro Anwendung**
>
> In der Praxis legt man pro Anwendung einen eigenen `upstream`-Block an und lagert die Blöcke oft in eine Datei aus (`include /etc/nginx/upstreams.d/*.conf;`). Dann kann ein Betriebsteam eine Server-Zeile ändern, ohne die Seitenkonfiguration anzufassen, und Änderungen sind in der Versionsverwaltung leicht nachvollziehbar.

## 8.2 Round Robin

*Round Robin* ist das Standardverfahren von Nginx, wenn im `upstream`-Block nichts anderes steht: Die Anfragen werden der Reihe nach auf die Server verteilt, der erste bekommt die erste Anfrage, der zweite die zweite, danach beginnt es von vorn. Das Verfahren ist einfach, vorhersehbar und braucht keinerlei Wissen über den Zustand der Server. Es passt, wenn die Server gleich stark sind und die Anfragen ungefähr gleich viel Arbeit machen.

Darin liegt auch seine Schwäche. Round Robin zählt Anfragen, nicht Aufwand. Eine Anwendung, bei der die meisten Anfragen in Millisekunden beantwortet werden, einzelne aber Sekunden brauchen (ein Bericht, ein Export), kann bei zufälliger Häufung dazu führen, dass ein Server mehrere teure Anfragen gleichzeitig bearbeitet, während der andere leer läuft. Der Test zeigt das Prinzip: Eine langsame Anfrage (drei Sekunden) wurde gestartet und lief auf `b1`; die danach gesendeten vier schnellen Anfragen verteilte Round Robin trotzdem zwei zu zwei, also auch zwei an den beschäftigten Server. Das ist kein Fehler des Verfahrens, sondern seine Definition, und es erklärt, warum die nächste Einheit `least_conn` behandelt.

Round Robin lässt sich mit Gesundheits- und Kapazitätsaspekten kombinieren, so verlangt es der Lehrplan. Die Kapazität kommt über Gewichte hinein (8.5): Ein Server mit doppelter Leistung bekommt Gewicht 2 und damit doppelt so viele Anfragen in der Reihe. Die Gesundheit kommt über die passive Fehlererkennung (8.6): Ein Server, der Fehler liefert, wird vorübergehend übersprungen. Das Verfahren selbst bleibt unverändert; es wird nur die Liste der in Frage kommenden Server angepasst.

Apache bietet das Gegenstück unter dem Namen `byrequests` (Einheit 7.4). Auch dort zählt die Anzahl der Anfragen, gewichtet mit `loadfactor`. Beide Verfahren sind in der Voreinstellung aktiv und müssen nicht eigens genannt werden; bei Apache muss allerdings das Modul `mod_lbmethod_byrequests` geladen sein, sonst schlägt der Start fehl.

```bash
# Testschleife: 8 Anfragen, Verteilung zählen
for i in $(seq 1 8); do
    curl -s http://localhost:8071/shop/x | head -1
done | sort | uniq -c
```

Die Schleife sendet acht Anfragen, `head -1` schneidet die erste Zeile der Antwort ab (den Namen des Backends), `sort | uniq -c` zählt die Treffer. Ergebnis im Test: `4 BACKEND=b1` und `4 BACKEND=b2`. Dieses Muster ist die Standardprobe für jede Verteilung in diesem Modul; man sollte es griffbereit haben, denn nur gemessene Verteilung zeigt, ob eine Konfiguration wirkt.

### Typische Fehler.

Der erste Fehler ist die Annahme, Round Robin sei „fair“: Bei ungleicher Anfragedauer ist es das nicht. Der zweite ist die Erwartung einer *exakten* Abwechslung bei mehreren Arbeitsprozessen: Jeder Arbeitsprozess führt seine eigene Reihenfolge, so dass die Verteilung nur im Mittel stimmt. Der dritte ist, mit nur wenigen Probeanfragen auf ein Gewichtsverhältnis zu schließen; man braucht Dutzende, um ein Bild zu bekommen.

```bash
# falsch: zwei Anfragen als Beweis für die Verteilung
curl -s http://localhost:8071/shop/x; curl -s http://localhost:8071/shop/x
# richtig: viele Anfragen zählen
for i in $(seq 1 100); do curl -s http://localhost:8071/shop/x | head -1; done | sort | uniq -c
```

> **Praxisbeispiel: Gleichmäßige Last bei kurzen Anfragen**
>
> Für Seiten mit vielen kurzen, ähnlichen Anfragen (Webseiten, kleine APIs) ist Round Robin meist die richtige Wahl und die einfachste zu verstehen. Erst wenn Messungen (Antwortzeiten pro Server, Modul 9) eine ungleiche Auslastung zeigen, lohnt der Wechsel zu `least_conn`.

## 8.3 least_conn

Das Verfahren `least_conn` schickt die nächste Anfrage an den Server mit den *wenigsten aktiven Verbindungen*. Aktiv heißt: Anfragen, die Nginx gerade an diesen Server gesendet hat und auf deren Antwort es noch wartet. Damit bekommt ein Server, der mit langen Anfragen beschäftigt ist, vorübergehend weniger Neues, während freie Server mehr übernehmen. Das gleicht ungleiche Anfragedauern aus und ist bei Anwendungen mit gemischten Lasten das bessere Verfahren.

Man schaltet es mit einer Zeile im `upstream`-Block ein:

```nginx
upstream shop {
    least_conn;
    server 127.0.0.1:9001;
    server 127.0.0.1:9002;
}
```

Die Direktive `least_conn;` steht vor den `server`-Zeilen. Der Vergleichstest lief so: Eine langsame Anfrage (`/slow`, drei Sekunden) wurde zuerst gesendet und landete auf `b1`. Nach 0,4 Sekunden folgten vier schnelle Anfragen. Mit `least_conn` gingen alle vier an `b2`, weil `b1` eine aktive Verbindung hatte. Mit Round Robin teilten sich beide Server die vier Anfragen zwei zu zwei. Das ist genau der Unterschied, den das Verfahren machen soll.

Die Gewichte bleiben wirksam: Bei `least_conn` vergleicht Nginx die aktiven Verbindungen *im Verhältnis zum Gewicht*, so dass ein Server mit Gewicht 2 doppelt so viele gleichzeitige Verbindungen halten darf, bevor er als „voller“ gilt (nach der Dokumentation; nicht getestet). Bei Gleichstand, etwa wenn alle Server leer sind, fällt die Wahl auf Round Robin zurück.

Die Einschränkung betrifft die Zählung: Nginx kennt nur die Verbindungen, die *es selbst* geöffnet hat, und, ohne `zone`, nur im jeweiligen Arbeitsprozess. Bei mehreren Arbeitsprozessen, die jeweils eigene Zähler führen, wirkt das Verfahren schwächer als im Ein-Prozess-Test; ein `zone`-Eintrag im `upstream`-Block macht die Zähler gemeinsam (nach der Dokumentation). Außerdem zählt `least_conn` Verbindungen und nicht Rechenzeit: Zehn schnelle offene Verbindungen sind nicht gleich viel Arbeit wie zehn langsame.

Das Apache-Gegenstück ist `bybusyness`, das ebenfalls den Server mit der geringsten Zahl laufender Anfragen wählt (`ProxySet lbmethod=bybusyness`, Modul `mod_lbmethod_bybusyness`). Im Test mit einer langsamen Anfrage auf `b1` verteilten sich die folgenden vier schnellen Anfragen zwei zu zwei; erst nach drei gleichzeitig laufenden langsamen Anfragen (zwei davon auf `b1`) gingen vier von sechs schnellen Anfragen an `b2`. Die Tendenz zum weniger beschäftigten Server ist also vorhanden, aber nicht so scharf wie bei Nginx im Ein-Test; den genauen Grund habe ich nicht untersucht.

### Typische Fehler.

Der erste Fehler ist, `least_conn` für Anwendungen mit gleichmäßig kurzen Anfragen einzuführen und davon Wunder zu erwarten: Der Unterschied zu Round Robin ist dort klein. Der zweite ist, die Direktive hinter die `server`-Zeilen zu schreiben: Das ist erlaubt, aber unübersichtlich; man setzt sie an den Anfang. Der dritte ist, sie mit `ip_hash` zu kombinieren: Nginx lehnt das nicht ab, sondern meldet nur die Warnung `load balancing method redefined`, und das zuletzt genannte Verfahren gilt (so im Test mit `nginx -t` beobachtet).

```nginx
# falsch: zwei Verfahren, nur eines gilt (Warnung beim Test)
upstream shop {
    least_conn;
    ip_hash;
    server 127.0.0.1:9001;
}
# richtig: ein Verfahren
upstream shop {
    least_conn;
    server 127.0.0.1:9001;
}
```

> **Praxisbeispiel: Lange Downloads und Exporte**
>
> Hinter einem Verteiler laufen oft Anwendungen, bei denen einzelne Anfragen lange dauern (Berichte, Datei-Exporte, Uploads). Hier lohnt `least_conn`, weil sich die Last an der tatsächlichen Auslastung orientiert. Zusammen mit `proxy_read_timeout` pro Location (Einheit 7.12) bleibt die Verteilung vorhersehbar.

## 8.4 ip_hash

Manche Anwendungen merken sich Zustand im Speicher des einzelnen Servers, zum Beispiel die angemeldete Sitzung. Verteilt der Balancer die Anfragen eines Besuchers auf wechselnde Server, verliert dieser bei jedem Wechsel seine Sitzung. Die Lösung heißt *Session-Affinität* (auch *sticky sessions*): Anfragen desselben Clients landen immer beim selben Server. `ip_hash` erreicht das auf einfache Weise, indem es aus der Client-Adresse einen Hashwert berechnet und daraus den Server bestimmt. Gleiche Adresse, gleicher Server.

```nginx
upstream shop {
    ip_hash;
    server 127.0.0.1:9001;
    server 127.0.0.1:9002;
}
```

Mit `ip_hash;` wird die Adresse zum Schlüssel. Nginx verwendet für IPv4 nach der Dokumentation nur die ersten drei Oktette, also das `/24`-Netz, damit Clients desselben Netzes beieinander bleiben. Im Test wurde die Client-Adresse über `real_ip_header X-Forwarded-For` (Einheit 7.10) variiert. Sechs Anfragen mit `10.1.1.5` gingen alle an `b2`. Sechs Adressen aus `10.1.1.5` bis `10.1.6.5` (jeweils anderes drittes Oktett) verteilten sich abwechselnd auf `b2` und `b1`. Eine Adresse bleibt also bei *ihrem* Server, verschiedene Netze verteilen sich.

Die Schwächen des Verfahrens sind erheblich, und der Lehrplan verlangt, sie zu bewerten. Erstens *NAT und Proxys*: Hinter einer Firmen- oder Mobilfunk-Adresse stehen oft hunderte Benutzer, die alle dieselbe öffentliche Adresse haben und damit alle beim selben Server landen; die Last wird ungleichmäßig. Umgekehrt kann ein Benutzer, dessen Adresse wechselt (Mobilfunk, WLAN-Wechsel), mitten in der Sitzung den Server wechseln. Zweitens *Verteiler hinter Verteilern*: Sieht Nginx wegen eines vorgeschalteten Proxys nur dessen Adresse, landen *alle* Besucher beim selben Server, solange `realip` nicht eingerichtet ist; genau dieser Fehler ist in der Praxis häufig. Drittens *Ausfall*: Fällt ein Server aus, ändert sich die Zuordnung der Adressen, und die betroffenen Besucher verlieren ihre Sitzung. Soll ein Server zeitweise ausgeschlossen werden, markiert man ihn mit `down`, statt die Zeile zu löschen, damit sich die Zuordnung der übrigen nicht verschiebt (nach der Dokumentation).

Bessere Alternativen sind eine *gemeinsame Sitzungsablage* (Datenbank, Redis), sodass jeder Server jede Sitzung kennt, oder die Bindung per Cookie statt per Adresse. Apache bietet Letzteres mit `stickysession=ROUTEID` und `route=`-Angaben an den Mitgliedern (Einheit 7.4). Im Test wurde dafür der Cookie `ROUTEID=.r2` mitgeschickt, und alle vier Anfragen gingen an `b2`; mit `ROUTEID=.r1` an `b1`; ohne Cookie verteilte Apache zwei zu zwei. Nginx Open Source hat keine Cookie-Bindung; sie gehört nach meinem Kenntnisstand zu den kostenpflichtigen Funktionen von NGINX Plus (`sticky cookie`), was ich hier nicht geprüft habe. Als Behelf lässt sich mit der Direktive `hash $cookie_name consistent;` oder `hash $http_x_user;` nach einem eigenen Schlüssel verteilen (nach der Dokumentation, nicht getestet).

### Typische Fehler.

Der erste Fehler ist `ip_hash` hinter einem Proxy ohne `realip`: Alle Anfragen haben dieselbe Adresse und gehen an einen Server. Der zweite ist, `ip_hash` als Ersatz für eine saubere Sitzungsablage zu betrachten. Der dritte ist, einen Server aus der Gruppe zu löschen statt auf `down` zu setzen.

```nginx
# falsch: Server aus der Gruppe gelöscht, Zuordnung verschiebt sich
upstream shop { ip_hash; server 10.0.0.11:8080; server 10.0.0.13:8080; }
# richtig: Server bleibt eingetragen, ist aber abgeschaltet
upstream shop { ip_hash; server 10.0.0.11:8080; server 10.0.0.12:8080 down; server 10.0.0.13:8080; }
```

> **Praxisbeispiel: Die Sitzung verschwindet „zufällig“**
>
> Berichten Benutzer, dass sie „manchmal abgemeldet werden“, ist bei mehreren Servern ohne gemeinsame Sitzungsablage die Verteilung der erste Verdacht. Die Gegenprobe: Zugriffsprotokoll mit dem Backend-Namen (`$upstream_addr`, Modul 9) auswerten; wechselt die Adresse innerhalb einer Sitzung, fehlt die Bindung.

## 8.5 Weighted Routing

Nicht jeder Server einer Gruppe ist gleich leistungsfähig. Ein neuer Rechner mit acht Kernen soll mehr Anfragen bekommen als ein alter mit zwei; ein frisch gestarteter Server soll vorsichtig anlaufen; ein Standort mit teurer Anbindung soll weniger Verkehr tragen. Dafür gibt es *Gewichte*. Bei Nginx steht `weight=Zahl` an der `server`-Zeile (Voreinstellung 1), bei Apache `loadfactor=Zahl` am `BalancerMember`. Ein Server mit Gewicht 3 erhält im Mittel dreimal so viele Anfragen wie einer mit Gewicht 1.

```nginx
upstream shop {
    server 127.0.0.1:9001 weight=3;
    server 127.0.0.1:9002 weight=1;
}
```

Das Beispiel gibt dem ersten Server ein Gewicht von 3. Im Test mit acht aufeinanderfolgenden Anfragen kamen sechs bei `b1` und zwei bei `b2` an, also genau das Verhältnis 3:1; derselbe Versuch bei Apache mit `loadfactor=3` und `loadfactor=1` ergab ebenfalls 6:2 (Einheit 7.4). Nginx verteilt nach der Dokumentation *gleichmäßig gemischt* („smooth weighted round-robin“): Der starke Server bekommt seine Anfragen nicht als Block von drei hintereinander, sondern zwischen die des schwächeren gestreut. Das vermeidet kurzzeitige Spitzen.

Gewichte beschreiben *Kapazität*, nicht *Qualität*. Sie lösen das Problem ungleich starker Server, aber nicht das Problem ungleich teurer Anfragen; dafür ist `least_conn` da (8.3). Beide lassen sich kombinieren: `least_conn` berücksichtigt das Gewicht beim Vergleich der Verbindungen. Auch bei `ip_hash` sind Gewichte erlaubt, wirken dort aber unscharf, weil die Adresse und nicht der Zähler entscheidet.

Aus der Sicht des Betriebs hat Gewichtung weitere Verwendungen. Ein Server, der nach einem Neustart noch „kalt“ ist (leere Caches, nicht aufgewärmte Laufzeit), kann mit einem kleinen Gewicht zunächst nur einen Bruchteil der Last bekommen und später hochgesetzt werden; das ist von Hand mit einer Konfigurationsänderung möglich. Eine automatische Anlaufphase (`slow_start`) gehört nach meinem Kenntnisstand zu den kostenpflichtigen Funktionen von NGINX Plus; geprüft habe ich das nicht. Bei Apache kann man Gewichte zur Laufzeit im Balancer-Manager ändern (Einheit 7.4), ohne die Konfiguration neu zu laden.

Die Gewichte sind außerdem ein Sicherheits- und Planungsthema. Wer ein Gewicht so setzt, dass der stärkste Server den Löwenanteil trägt, plant den Ausfall genau dieses Servers nicht mit: Fällt er aus, muss der Rest die gesamte Last übernehmen. Eine einfache Rechnung gehört daher in jede Planung: Reicht die Kapazität der übrigen Server, wenn der größte ausfällt („N+1“)? Ist die Antwort nein, hilft die beste Verteilung im Ausfall nichts.

### Typische Fehler.

Der erste Fehler ist, Gewichte nach Gefühl zu vergeben, ohne zu messen; die Verteilung wird mit der Zählschleife aus 8.2 überprüft. Der zweite ist, Gewicht 0 zu verwenden und zu erwarten, der Server sei „aus“: Dafür gibt es `down` (Nginx) und `status=+D` (Apache); ein Gewicht von 0 ist bei Nginx ein Konfigurationsfehler (Test: `invalid parameter "weight=0"`). Der dritte ist, zu viele Stufen zu verwenden (Gewichte 17, 23, 31): Niemand versteht sie später.

```nginx
# falsch: willkürliche Gewichte ohne Begründung
server 10.0.0.11:8080 weight=17;
server 10.0.0.12:8080 weight=23;
# richtig: Kerne als Massstab, im Kommentar erklärt
server 10.0.0.11:8080 weight=2;   # 2 vCPU
server 10.0.0.12:8080 weight=4;   # 4 vCPU
```

> **Praxisbeispiel: Gemischter Serverpark**
>
> In Umgebungen, die über Jahre gewachsen sind, laufen oft Server verschiedener Generationen hinter einem Verteiler. Die Gewichte entsprechen dann dem Verhältnis der Kerne oder dem gemessenen Durchsatz im Lasttest (Modul 11). Das Team notiert den Maßstab im Kommentar, damit ein späterer Wechsel der Hardware die Gewichte nachvollziehbar verändert.

## 8.6 Health Checks

Ein Verteiler, der tote Server nicht erkennt, schickt weiter Anfragen ins Leere. Es gibt zwei Arten der Erkennung. *Passive* Prüfung beobachtet die echten Anfragen: Scheitert eine, gilt der Server als verdächtig. *Aktive* Prüfung fragt die Server unabhängig vom Besucherverkehr regelmäßig, ob sie gesund sind. Die passive ist einfach und kostenlos, hat aber den Nachteil, dass *ein echter Besucher* den Fehler als Erster bemerkt. Die aktive findet den Fehler, bevor jemand betroffen ist.

Nginx Open Source kann nur passiv prüfen. Zwei Parameter an der `server`-Zeile steuern es: `max_fails` (wie viele Fehlversuche innerhalb von `fail_timeout` den Server als ausgefallen markieren; Voreinstellung 1) und `fail_timeout` (wie lange dieser Zeitraum dauert *und* wie lange der Server danach als ausgefallen gilt; Voreinstellung 10 Sekunden). Die Voreinstellungen stammen aus der Dokumentation und wurden nicht einzeln geprüft. Als Fehlversuch zählt, was `proxy_next_upstream` nennt (Voreinstellung: Verbindungsfehler und Zeitüberschreitung; siehe 8.7).

```nginx
upstream shop {
    server 127.0.0.1:9001 max_fails=2 fail_timeout=10s;
    server 127.0.0.1:9999 max_fails=2 fail_timeout=10s;
}
```

Hier ist der zweite Server ein Port, auf dem niemand lauscht. Im Test liefen sechs Anfragen nacheinander ohne einen einzigen Fehler zum Besucher: Alle bekamen ein `200` von `b1`. Im Fehlerlog stand dazu zuerst `connect() failed (111: Connection refused) while connecting to upstream` (der Fehlversuch) und nach dem zweiten Fehlversuch `upstream server temporarily disabled while connecting to upstream`, die Warnung, dass der Server für `fail_timeout` aus der Verteilung genommen wurde. Die Besucher merkten nichts, weil Nginx die gescheiterte Anfrage automatisch beim nächsten Server wiederholte. Das ist die Stärke der passiven Prüfung; ihre Grenze ist, dass sie nur Fehler erkennt, die Nginx selbst sieht (Verbindung verweigert, Zeitüberschreitung), nicht aber einen Server, der `200` mit leerer Seite oder falschem Inhalt liefert.

Aktive Prüfungen, bei denen Nginx von sich aus regelmäßig eine Adresse abfragt, gehören nach meinem Kenntnisstand zu NGINX Plus (Direktive `health_check`); die Herstellerdokumentation habe ich dafür nicht abgerufen. Mit Open Source behilft man sich so: Ein externes Werkzeug (Überwachungssystem, kleines Skript) fragt die Gesundheitsseite ab und schaltet bei Ausfall den Server in einer `include`-Datei auf `down`, danach folgt `nginx -t && nginx -s reload`. Das ist aufwendiger, aber transparent.

Bei Apache gibt es dagegen eine aktive Prüfung im Standardumfang, `mod_proxy_hcheck` (Einheit 7.5, mit Test). Der Vergleich beider Server lehrt etwas Allgemeines: Es gibt nicht *die* richtige Lösung, sondern jeder Server bietet einen eigenen Weg, und beim Wechsel muss man die Fähigkeit nachbauen.

Entscheidend ist die Gesundheitsseite selbst, die Einheit 7.5 beschrieben hat: schnell, ohne Anmeldung, mit echter Aussagekraft, aber nicht so streng, dass kurze Schwankungen alle Server gleichzeitig ausschalten. Dieser letzte Punkt ist bei passiver Prüfung besonders wichtig, denn `max_fails=1` (die Voreinstellung) schaltet einen Server schon bei einem einzigen Fehlversuch für zehn Sekunden ab. Bei einer Gruppe aus zwei Servern kann ein kurzer Netzfehler dann beide treffen.

### Typische Fehler.

Der erste Fehler ist `max_fails=0`: Das schaltet die Fehlererkennung ganz ab; der Server wird nie ausgeschlossen. Der zweite ist, die passive Prüfung für ein vollwertiges Gesundheitskonzept zu halten. Der dritte ist ein zu großes `fail_timeout`: Ein Server, der nach einem kurzen Fehler eine Stunde lang ausgeschlossen bleibt, ist ein Ärgernis; die Voreinstellung von zehn Sekunden ist meist richtig.

```nginx
# falsch: Fehlererkennung abgeschaltet
server 10.0.0.11:8080 max_fails=0;
# richtig: nach 3 Fehlern in 30 s für 30 s ausschliessen
server 10.0.0.11:8080 max_fails=3 fail_timeout=30s;
```

> **Praxisbeispiel: Die Warnung im Log**
>
> Die Meldung `upstream server temporarily disabled` im Fehlerlog ist ein Frühwarnsignal. Wer sie in sein Monitoring aufnimmt (Modul 9), erfährt von einem kranken Backend, bevor Besucher sich beschweren. Ein `grep` auf diese Zeile im Fehlerlog ist die schnellste Prüfung nach einer Störungsmeldung.

## 8.7 Failover

*Failover* heißt, dass beim Ausfall eines Servers ein anderer übernimmt, möglichst ohne dass Besucher etwas merken. Bei einem Verteiler gibt es dafür zwei Ebenen: den Wechsel *innerhalb* einer Anfrage (die gescheiterte Anfrage wird beim nächsten Server wiederholt) und den Wechsel *zwischen* Anfragen (der kranke Server wird danach übersprungen, siehe 8.6). Die Steuerung der ersten Ebene übernimmt bei Nginx die Direktive `proxy_next_upstream`. Sie nennt die Bedingungen, bei denen Nginx die Anfrage an den nächsten Server weiterreicht. Die Voreinstellung ist `error timeout`, also Verbindungs- und Übertragungsfehler sowie Zeitüberschreitungen; weitere Werte sind unter anderem `http_502`, `http_503`, `http_504` und `non_idempotent`.

```nginx
location /shop/ {
    proxy_pass http://shop/;
    proxy_next_upstream error timeout http_502 http_503;
    proxy_next_upstream_tries 2;
    proxy_next_upstream_timeout 5s;
}
```

Die Location erlaubt Wiederholungen bei Verbindungsfehlern, Zeitüberschreitungen und den Antworten 502 und 503. Mit `proxy_next_upstream_tries 2` versucht Nginx höchstens zwei Server pro Anfrage, mit `proxy_next_upstream_timeout 5s` insgesamt höchstens fünf Sekunden. Diese Begrenzungen sind wichtig: Ohne sie würde eine Anfrage bei vielen kranken Servern der Reihe nach alle durchprobieren und den Besucher lange warten lassen, und alle Backends würden zusätzlich belastet.

Die Wirkung der Grenze zeigte ein Test mit einer Gruppe aus drei Servern, von denen zwei nicht erreichbar waren (`proxy_next_upstream_tries 2`). Die erste Anfrage traf beide toten Server, erreichte den lebenden gar nicht und endete mit `502`; die folgenden fünf wurden mit `200` beantwortet, weil die toten Server inzwischen als ausgefallen markiert waren (Einheit 8.6) und übersprungen wurden. Bei einer Gruppe, in der alle Server tot sind, antwortete Nginx mit `502 Bad Gateway`; im Log standen die Verbindungsfehler und die Warnung `temporarily disabled`.

Wiederholungen bergen eine Gefahr: Sie dürfen nur Anfragen treffen, bei denen ein zweiter Versuch nichts kaputt macht. Ein `GET` kann man gefahrlos wiederholen; ein `POST`, der eine Bestellung auslöst, möglicherweise nicht, denn der erste Server kann die Bestellung schon verarbeitet haben, bevor die Antwort verloren ging. Nginx wiederholt deshalb nicht idempotente Anfragen (`POST`, `LOCK`, `PATCH`) nach der Dokumentation nur, wenn der Wert `non_idempotent` ausdrücklich gesetzt ist. Man lässt ihn weg, solange die Anwendung keine Doppelverarbeitung abfängt.

Bei Apache übernimmt der Balancer den Wechsel selbst. Im Test mit einem toten Mitglied (`127.0.0.1:9999`) lieferten vier Anfragen viermal `200`; im Fehlerlog stand einmal `AH00957: ... attempt to connect to 127.0.0.1:9999 failed`. Beim Ausfall eines Mitglieds mit der Voreinstellung für `retry` schrieb Apache `AH00959: ap_proxy_connect_backend disabling worker for (127.0.0.1:9001) for 60s`: Das Mitglied wird 60 Sekunden lang nicht angesprochen.

Failover betrifft schließlich auch den Verteiler selbst. Ein einzelner Nginx oder Apache vor allen Servern ist ein einzelner Ausfallpunkt. Die üblichen Lösungen sind zwei Verteiler mit einer gemeinsamen, wandernden Adresse (nach meinem Kenntnisstand mit dem Protokoll VRRP, zum Beispiel über das Programm *keepalived*), ein vorgeschalteter Lastverteiler des Cloud-Anbieters oder mehrere Adressen im DNS. Diese Verfahren habe ich nicht getestet; sie gehören zur Betriebsarchitektur und werden hier nur als Hinweis genannt.

### Typische Fehler.

Der erste Fehler ist, `http_500` in `proxy_next_upstream` aufzunehmen: Ein Programmfehler, der auf jedem Server auftritt, würde dann auf allen durchprobiert und die Last vervielfacht. Der zweite ist, `non_idempotent` ohne Absicherung zu setzen. Der dritte ist, `proxy_next_upstream_tries` wegzulassen und bei einem größeren Ausfall die restlichen Server zu überrennen.

```nginx
# falsch: Programmfehler wird auf allen Servern wiederholt
proxy_next_upstream error timeout http_500;
# richtig: nur Infrastrukturfehler, begrenzt
proxy_next_upstream error timeout http_502 http_503;
proxy_next_upstream_tries 2;
```

> **Praxisbeispiel: Der Ausfalltest vor dem Go-live**
>
> Vor der Inbetriebnahme gehört ein Ausfalltest zum Pflichtprogramm: Während eine Schleife Anfragen sendet, wird ein Backend gestoppt. Man zählt die Fehler (erwartet: höchstens eine kurze Spitze) und startet das Backend wieder (erwartet: es wird wieder aufgenommen). Wer diesen Test nie gemacht hat, weiß nicht, ob sein Failover funktioniert.

## 8.8 Blue-Green und Canary

Neue Programmversionen sind das häufigste Risiko im Betrieb. Zwei Muster senken es. Bei *Blue-Green* laufen zwei vollständige Umgebungen nebeneinander: „Blau“ ist die aktuelle, „Grün“ die neue. Der Verteiler schaltet den Verkehr in einem Schritt von einer auf die andere um; bei Problemen schaltet man ebenso schnell zurück. Bei *Canary* (nach dem Kanarienvogel im Bergwerk) bekommt die neue Version zunächst nur einen kleinen Teil des Verkehrs, etwa fünf Prozent. Zeigen die Messwerte keine Probleme, wächst der Anteil schrittweise.

Beide Muster beruhen auf zwei `upstream`-Gruppen und einer Variablen, die bei jeder Anfrage die zu verwendende Gruppe nennt. Nginx erlaubt Variablen in `proxy_pass`; ist der Wert der Name einer `upstream`-Gruppe, wird sie verwendet.

```nginx
upstream blue  { server 127.0.0.1:9001; }
upstream green { server 127.0.0.1:9002; }

include /etc/nginx/active_pool.conf;   # enthält: map $host $active { default blue; }

server {
    listen 8072;
    location /app/ {
        proxy_pass http://$active;
    }
}
```

Die aktive Gruppe steht in einer kleinen Datei mit einem `map`-Block. Zum Umschalten ändert man dort `blue` in `green`, prüft mit `nginx -t` und lädt mit `nginx -s reload` neu. Im Test lief dabei eine Schleife mit vierzig Anfragen im Abstand von 50 Millisekunden; alle vierzig wurden mit `200` beantwortet, und danach kamen die Antworten von `b2`. Der Reload von Nginx ist *graceful*: Neue Arbeitsprozesse mit der neuen Konfiguration übernehmen, alte beenden ihre laufenden Anfragen. Das ist die technische Grundlage dafür, dass die Umschaltung ohne Ausfall gelingt.

Eine Falle zeigte sich im selben Test: Steht in `proxy_pass` eine *Variable* und danach ein URI-Teil, ersetzt dieser URI den *gesamten* Pfad der Anfrage. Wo die Konfiguration mit `proxy_pass http://$pool/;` formuliert war, sah das Backend bei einer Anfrage `/cn/x` den Pfad `/` statt `/x`. Bei `proxy_pass` mit Variable und ohne URI-Teil (wie oben `http://$active`) bleibt der Pfad unverändert; das Backend bekam im Test `/app/`, also mit Präfix. Will man das Präfix entfernen, braucht man `rewrite ^/app/(.*)$ /$1 break;` vor dem `proxy_pass`. Die Regel „URI-Teil bei Variablen ersetzt alles“ ist ein klassischer Stolperstein.

Für Canary gibt es zwei Auswahlverfahren. Das erste wählt nach einem *Merkmal* der Anfrage, etwa einem Header: Mit `map $http_x_canary $pool { default blue; "1" green; }` gingen im Test Anfragen mit `X-Canary: 1` an `b2`, alle anderen an `b1`. Das eignet sich für interne Tester, die die neue Version gezielt prüfen. Das zweite wählt nach einem *Anteil*: Die Direktive `split_clients` verteilt anhand eines Hashwerts prozentual.

```nginx
split_clients "${remote_addr}${http_user_agent}" $variant {
    20%  green;
    *    blue;
}
```

Aus Adresse und `User-Agent` entsteht ein Hashwert; 20 Prozent der Werte führen zu `green`, alle übrigen (`*`) zu `blue`. Dasselbe Hash-Ergebnis für dieselbe Eingabe bedeutet: Ein Besucher bleibt bei seiner Version, solange sich der Schlüssel nicht ändert. Im Test mit vierzig verschiedenen Schlüsseln (Header `X-User`) gingen 33 an `b1` und 7 an `b2`, bei einem Sollwert von 20 Prozent (acht von vierzig); kleine Stichproben schwanken. Der Anteil gilt für den *Schlüssel*, nicht für die Anfragen: Viele Anfragen eines einzelnen Schlüssels gehen immer an dieselbe Version.

Bei Apache lässt sich dasselbe mit `mod_rewrite` und Bedingungen auf einen Header oder ein Cookie erreichen, oder mit Balancer-Mitgliedern verschiedener Gewichte (ein Mitglied mit `loadfactor=1`, das andere mit `loadfactor=19`, ergibt etwa fünf Prozent). Die Gewichtsmethode ist zufällig pro Anfrage, nicht pro Besucher; ein Besucher kann deshalb zwischen den Versionen wechseln, was bei Sitzungen und Datenbank-Änderungen stört.

Beide Muster stellen Anforderungen an die Anwendung, die der Verteiler nicht lösen kann. Läuft in Blau und Grün dieselbe Datenbank, müssen beide Versionen mit dem Datenbankschema umgehen können; Änderungen werden daher in Schritten ausgerollt (zuerst das Schema kompatibel erweitern, dann die neue Version einführen, erst später alte Spalten entfernen). Dazu kommen Sitzungen (sie müssen versionsübergreifend lesbar sein), Caches und der Rückweg: Ein Rollback ist nur dann sicher, wenn die alte Version noch mit allen inzwischen geschriebenen Daten zurechtkommt.

### Typische Fehler.

Der erste Fehler ist die Pfadfalle (Variable plus URI), die den Pfad bis auf einen Schrägstrich kürzt. Der zweite ist, Blau und Grün auf derselben Maschine mit gemeinsamen Dateien zu betreiben und dann zu „wechseln“: Die Umgebungen sind nicht unabhängig. Der dritte ist, die Umschaltung ohne vorherige Prüfung von Grün vorzunehmen (Gesundheitsseite, Stichproben-Anfragen am Backend direkt).

```nginx
# falsch: Variable mit URI-Teil, der Pfad geht verloren (/cn/x -> /)
proxy_pass http://$pool/;
# richtig: Variable ohne URI-Teil, Pfad bleibt wie angefragt
proxy_pass http://$pool;
```

> **Praxisbeispiel: Umschalten per Reload**
>
> Ein bewährter Ablauf: Grün starten und direkt prüfen, Datei mit der aktiven Gruppe ändern, `nginx -t`, `nginx -s reload`, einige Minuten die Fehlerrate beobachten (Modul 9), bei Auffälligkeiten die Datei zurücksetzen und erneut neu laden. Der gesamte Wechsel dauert Sekunden, und der Rückweg ist derselbe Befehl.

## Übungsaufgaben

Die praktischen Aufgaben lassen sich mit zwei einfachen Backends nachvollziehen (zum Beispiel `python3 -m http.server` auf zwei Ports in Verzeichnissen mit verschiedenen Dateien). Die Lösungen stehen im nächsten Abschnitt.

**Aufgabe 1 (leicht).** Erkläre den Unterschied zwischen Kapazität und Ausfallsicherheit. Warum bedeutet „zwei Server hinter einem Verteiler“ nicht automatisch Hochverfügbarkeit?

**Aufgabe 2 (leicht).** Wofür stehen `backup` und `down` an einer `server`-Zeile? Worin liegt der Vorteil von `down` gegenüber dem Löschen der Zeile?

**Aufgabe 3 (leicht).** Wie wird bei Nginx ein Server mit doppelter Leistung eingestellt, und wie bei Apache?

**Aufgabe 4 (mittel).** Eine Anwendung hat meist kurze Anfragen, aber einzelne Exporte von mehreren Sekunden. Welches Verfahren empfiehlst du und warum? Was zeigt der Vergleichstest mit einer langsamen Anfrage?

**Aufgabe 5 (mittel).** Alle Besucher landen trotz `ip_hash` beim selben Server. Nenne die wahrscheinlichste Ursache und die Abhilfe.

**Aufgabe 6 (praktisch).** Schreibe einen `upstream`-Block mit drei Servern (Gewichte 2, 1, eine Reserve) und eine Location, die ihn mit `least_conn` nutzt. Schreibe dazu die Zählschleife, die die Verteilung prüft.

**Aufgabe 7 (praktisch).** Konfiguriere für zwei Gruppen `blue` und `green` eine Canary-Auswahl, bei der Anfragen mit dem Header `X-Canary: 1` an Grün gehen. Wie schaltest du später den ganzen Verkehr um, ohne Anfragen zu verlieren?

**Aufgabe 8 (schwer).** Ein `POST` legt eine Bestellung an, und gelegentlich entstehen doppelte Bestellungen. Der Verteiler hat `proxy_next_upstream error timeout non_idempotent`. Erkläre die Ursache und eine Lösung.

**Aufgabe 9 (schwer).** Du planst drei gleiche Server, die zusammen im Mittel 60 Prozent ihrer Kapazität nutzen. Hält die Gruppe den Ausfall eines Servers aus? Welche Rolle spielt dabei `max_fails=1`?

## Lösungen und Erklärungen

**Lösung 1.** Kapazität betrifft die Menge der Anfragen, die das System insgesamt bewältigt; Ausfallsicherheit betrifft die Frage, ob der Dienst bei einem Ausfall weiterläuft. Zwei Server erhöhen die Kapazität nur, wenn beide gebraucht werden, und bieten Ausfallsicherheit nur, wenn einer allein die gesamte Last tragen kann. Außerdem bleibt der Verteiler selbst ein einzelner Ausfallpunkt, solange er nicht doppelt ausgelegt ist.

**Lösung 2.** `backup` macht den Server zur Reserve, die nur einspringt, wenn die übrigen ausfallen; `down` nimmt ihn dauerhaft aus der Verteilung. Der Vorteil von `down`: Die Zeile bleibt als Dokumentation stehen, und bei `ip_hash` verschiebt sich die Zuordnung der übrigen Adressen nicht (Dokumentation).

**Lösung 3.** Nginx: `server adresse weight=2;` (die anderen mit Gewicht 1). Apache: `BalancerMember "http://adresse" loadfactor=2`. Im Test ergab Gewicht 3 gegenüber 1 bei acht Anfragen sechs zu zwei.

**Lösung 4.** `least_conn`, weil es Anfragen an den Server mit den wenigsten aktiven Verbindungen schickt und so lange Exporte ausgleicht. Im Test lief eine langsame Anfrage auf `b1`; mit `least_conn` gingen alle vier folgenden schnellen Anfragen an `b2`, mit Round Robin zwei zu zwei.

**Lösung 5.** Die wahrscheinlichste Ursache: Nginx sieht wegen eines vorgeschalteten Proxys oder Lastverteilers nur dessen Adresse. Abhilfe: `set_real_ip_from` mit der Adresse des vorgeschalteten Geräts und `real_ip_header X-Forwarded-For` (Einheit 7.10); danach die Verteilung mit unterschiedlichen `X-Forwarded-For`-Adressen prüfen. Alternativ von Adress- auf Cookie- oder Schlüsselbindung wechseln.

**Lösung 6.**

```nginx
upstream shop {
    least_conn;
    server 10.0.0.11:8080 weight=2;
    server 10.0.0.12:8080;
    server 10.0.0.13:8080 backup;
}
server {
    location /shop/ { proxy_pass http://shop/; }
}
```

```bash
for i in $(seq 1 100); do curl -s http://localhost/shop/x | head -1; done | sort | uniq -c
```

Der Block steht im `http`-Kontext. Die Schleife zählt die Treffer pro Backend, das dritte erscheint nur bei Ausfall der anderen. Bei `least_conn` und kurzen Anfragen stimmt das Gewichtsverhältnis nur ungefähr.

**Lösung 7.**

```nginx
upstream blue  { server 127.0.0.1:9001; }
upstream green { server 127.0.0.1:9002; }
map $http_x_canary $pool { default blue; "1" green; }
server {
    location /app/ { proxy_pass http://$pool; }
}
```

Zum Umschalten des gesamten Verkehrs setzt man `default green;`, prüft mit `nginx -t` und lädt mit `nginx -s reload` neu. Der Reload ist graceful; im Test blieben dabei alle 40 Anfragen einer laufenden Schleife bei `200`. Die Variable steht ohne URI-Teil, damit der Pfad erhalten bleibt.

**Lösung 8.** `non_idempotent` erlaubt, dass auch `POST` beim nächsten Server wiederholt wird. Hat der erste Server die Bestellung gespeichert, aber die Antwort kam zu spät (Zeitüberschreitung), entsteht sie ein zweites Mal. Lösung: `non_idempotent` entfernen. Zusätzlich sollte die Anwendung Bestellungen mit einem eindeutigen Schlüssel (Idempotenz-Schlüssel) entgegennehmen, damit auch Wiederholungen durch den Browser keine Doppelungen erzeugen.

**Lösung 9.** Bei drei Servern mit je 100 Prozent Kapazität und 60 Prozent mittlerer Auslastung beträgt die Gesamtlast 180 Prozent einer Servereinheit. Fällt einer aus, tragen zwei Server 200 Prozent Kapazität: Die Last (180) passt knapp, aber ohne Reserve für Spitzen. Die Gruppe hält den Ausfall also gerade noch aus, im Spitzenfall nicht. `max_fails=1` schaltet einen Server schon beim ersten Fehlversuch ab, so dass ein kurzer Netzfehler nacheinander mehrere Server treffen und die Gruppe unnötig verkleinern kann; `max_fails=3` mit `fail_timeout=30s` ist robuster.
