# Modul 03 - Grundkonfiguration, Virtual Hosts und .htaccess

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Listings unverändert, farbige Boxen als Zitatblöcke mit fettem Titel, Tabellen als Markdown-Tabellen, Übungsaufgaben und Lösungen als Absätze bzw. Überschriften). Die Lerneinheiten sind wie in der Quelle nach Modul nummeriert (3.1 bis 3.14), danach folgen „Übungsaufgaben“ (9) und „Lösungen und Erklärungen“. **Die Konfigurationen und Befehle wurden für dieses Repository nicht ausgeführt:** Laut Einleitung hat der Autor die Beispiele in einer Linux-Umgebung (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0) ausgeführt; nicht getestet sind laut Skript Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt. Viele Beispiele ändern Server-Konfiguration, Zertifikate, Rechte oder Dienste: nur in einer Testumgebung ausprobieren. Übersicht zum Modul: [README](README.md).

**Geplante Dauer:** 15,5 h | **Priorität:** 1 | **Lerneinheiten:** 14

## Lerneinheiten laut Lehrplan

| **Nr.** | **Lerneinheit**             | **Dauer (h)** | **Prio** |
|--------:|:----------------------------|--------------:|---------:|
|     3.1 | httpd.conf Struktur         |             1 |        1 |
|     3.2 | Include-Dateien             |             1 |        1 |
|     3.3 | Virtual Hosts               |           1,5 |        1 |
|     3.4 | Name-based VHosts           |             1 |        1 |
|     3.5 | Directory und Location      |             1 |        1 |
|     3.6 | .htaccess und AllowOverride |           1,5 |        2 |
|     3.7 | apachectl configtest        |             1 |        2 |
|     3.8 | Konfigurationsreview        |             1 |        2 |
|     3.9 | Directives und Contexts     |             1 |        1 |
|    3.10 | http Context                |             1 |        1 |
|    3.11 | server Blocks               |           1,5 |        1 |
|    3.12 | server_name                 |             1 |        1 |
|    3.13 | location Matching           |             1 |        1 |
|    3.14 | nginx -t                    |             1 |        2 |
|         | **Summe**                   |      **15,5** |          |

## Überblick und Lernweg

In den ersten beiden Modulen ging es darum, was ein Webserver ist und wie er in das Betriebssystem eingebunden wird. Dieses Modul behandelt nun das Herzstück des Alltags: die *Konfiguration*. Wer sie sicher beherrscht, kann mehrere Websites auf einem Server betreiben, Zugriffe gezielt steuern und Fehler anhand der Konfiguration eingrenzen, statt zu raten. Im Mittelpunkt stehen die gemeinsamen Grundideen beider Server: Direktiven in Kontexten, eine Reihenfolge, nach der mehrere Regeln zusammenwirken, und eine klare Prüfroutine vor jeder Änderung.

Die Einheiten 3.1 bis 3.8 behandeln den Apache HTTP Server: den Aufbau der Hauptdatei, Include-Dateien, Virtual Hosts, die Abschnitte `Directory` und `Location`, `.htaccess`, den Konfigurationstest und das Review einer Konfiguration. Die Einheiten 3.9 bis 3.14 behandeln dasselbe für Nginx: Direktiven und Kontexte, den `http`-Kontext, `server`-Blöcke, `server_name`, die Auswahl der `location` und den Test mit `nginx -t`. Wo beide Server dasselbe Problem verschieden lösen, wird der Vergleich ausdrücklich gezogen.

> **Merke**
>
> Alle Beispiele wurden mit Apache 2.4.58 und Nginx 1.24.0 in einer Testumgebung ausgeführt; Ausgaben und Fehlermeldungen sind echte Auszüge. Einige Befunde sind überraschend und werden deshalb besonders hervorgehoben, zum Beispiel das Verhalten von `.htaccess` ohne `AllowOverride`-Angabe (Einheit 3.6).

## 3.1 httpd.conf Struktur

Die Hauptdatei des Apache heißt `httpd.conf` (bei Source Builds und RHEL-artigen Systemen) bzw. `apache2.conf` (Debian und Ubuntu). Sie ist eine reine Textdatei, in der jede Zeile eine *Direktive* enthält, also eine Anweisung mit Namen und Argumenten, oder ein *Container* wie `<Directory>`, der Direktiven bündelt. Ein Kommentar beginnt mit `#`. Bei Direktivennamen gilt keine Groß-/Kleinschreibung, bei Argumenten wie Dateipfaden schon; üblich ist die Schreibweise in Binnenmajuskeln (`DocumentRoot`).

Wer eine Konfiguration liest, sollte ihre *Gliederung* erkennen. Zuerst kommt der globale Teil mit Grundeinstellungen, die den ganzen Server betreffen: `ServerRoot`, `Listen`, `User` und `Group`, die Liste der geladenen Module, `ServerName`. Danach folgt eine Sicherheitsbasis für das Dateisystem, dann die Einstellungen für Dokumentenverzeichnis und Logs, schließlich die Einbindung von Zusatzdateien und Virtual Hosts. Der Aufbau der Standarddatei eines Source Builds, auf die wesentlichen Zeilen reduziert, sieht so aus:

```apache
ServerRoot "/usr/local/apache2"
Listen 80
LoadModule mpm_event_module modules/mod_mpm_event.so
LoadModule authz_core_module modules/mod_authz_core.so
<IfModule unixd_module>
    User daemon
    Group daemon
</IfModule>
ServerAdmin you@example.com

<Directory />
    AllowOverride none
    Require all denied
</Directory>

DocumentRoot "/usr/local/apache2/htdocs"
<Directory "/usr/local/apache2/htdocs">
    Options Indexes FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>

ErrorLog "logs/error_log"
LogLevel warn
```

Interessant ist vor allem der Block `<Directory />`. Er bezieht sich auf die Wurzel des gesamten Dateisystems und *sperrt* es zunächst vollständig (`Require all denied`) und schaltet `.htaccess`-Auswertung ab (`AllowOverride None`). Danach wird gezielt nur der `DocumentRoot` wieder freigegeben. Das Muster „erst alles verbieten, dann gezielt erlauben“ ist der Kern der Apache-Sicherheitsphilosophie (*Deny by Default*), und es ist *die* Ursache für viele 403-Fehler bei neuen Verzeichnissen: Ein Pfad, der nicht ausdrücklich freigegeben wurde, bleibt gesperrt. In Einheit 2.6 wurde gezeigt, dass das ohne diese Basisregel anders ist, Apache also ohne jede `Require`-Regel zulässt.

Die Debian-Konfiguration hat dieselbe Basis, nur anders gegliedert. Die Hauptdatei `apache2.conf` enthält die globalen Grundwerte (`Timeout 300`, `KeepAlive On`, `KeepAliveTimeout 5`), die Sperre `<Directory />` mit `Options FollowSymLinks`, `AllowOverride None` und `Require all denied`, danach Freigaben für `/usr/share` und `/var/www/`, einen Schutz für Dateien, die mit `.ht` beginnen, die `LogFormat`-Definitionen und zuletzt `IncludeOptional`-Zeilen, die Module, Konfigurationsschnipsel und Websites einlesen. Besonders lehrreich ist die Schutzzeile für `.ht`-Dateien, die in beiden Standarddateien vorkommt:

```apache
<FilesMatch "^\.ht">
    Require all denied
</FilesMatch>
```

Der Container `FilesMatch` wirkt auf Dateinamen, die einem regulären Ausdruck entsprechen. Hier verbietet er den Webzugriff auf alle Dateien, deren Name mit `.ht` beginnt, also auf `.htaccess` und `.htpasswd`. Würde man diese Regel vergessen, könnte jeder die Konfiguration oder Passworthashes herunterladen. Die Regel ist ein schönes Beispiel dafür, dass Standardkonfigurationen eine Reihe unscheinbarer Sicherheitsvorkehrungen enthalten, die man beim Aufräumen nicht löschen darf.

Ein weiterer Grundbegriff ist der *globale* im Gegensatz zum *virtuellen* Server. Alles, was außerhalb eines `<VirtualHost>` steht, gehört zur Hauptkonfiguration und gilt als Vorgabe für alle Virtual Hosts; innerhalb eines `VirtualHost` kann man einzelne Werte überschreiben. Das Prinzip der Vererbung ist der Grund, warum man gemeinsame Einstellungen nach oben zieht und Besonderheiten in die einzelnen Hosts schreibt.

### Typische Fehler.

Ein sehr häufiger Fehler ist ein Tippfehler im Direktivennamen oder eine nicht geladene Moduldirektive. Apache weigert sich zu starten und meldet, was es nicht versteht. Der zweite Klassiker ist die Verwechslung von Konfigurationen verschiedener Distributionen, etwa die Suche nach einer `httpd.conf` unter Ubuntu.

```text
$ apache2 -f /tmp/demo-httpd/e_tippfehler.conf -t
AH00526: Syntax error on line 28 of /tmp/demo-httpd/e_tippfehler.conf:
Invalid command 'ServerNam', perhaps misspelled or defined by a module not
included in the server configuration
```

Die Meldung nennt zwei mögliche Ursachen, und beide sind real: Entweder ist der Name falsch geschrieben (`ServerNam`), oder die Direktive gehört zu einem Modul, das nicht geladen ist (`ProxyPass` ohne `mod_proxy` lieferte in der Testumgebung dieselbe Meldung). Daraus folgt eine einfache Diagnoseregel: Zuerst die Schreibweise prüfen, dann mit `apachectl -M` nachsehen, ob das zugehörige Modul geladen ist.

> **Praxisbeispiel: Eine Konfiguration lesen lernen**
>
> Beim Übernehmen eines fremden Servers lohnt sich ein fester Lesepfad: zuerst `apachectl -V` (Pfade und Version), dann `apachectl -M` (Module), dann die Hauptdatei von oben nach unten, dabei jede `Include`-Zeile verfolgen. Wer sich angewöhnt, bei jedem Container zu fragen „auf welchen Teil der Anfrage wirkt das?“, erkennt Fehler und Lücken deutlich schneller.

## 3.2 Include-Dateien

Eine einzige riesige Konfigurationsdatei ist schwer zu pflegen. Deshalb zerlegt man sie mit den Direktiven `Include` und `IncludeOptional` in kleine, thematisch getrennte Dateien. Beim Einlesen wird die Include-Zeile durch den Inhalt der genannten Datei ersetzt, sodass Apache am Ende eine einzige, zusammengesetzte Konfiguration sieht. Das Argument kann ein einzelner Dateiname, ein Verzeichnis oder ein Muster mit Platzhaltern wie `*.conf` sein. Bei einem Verzeichnis oder Muster werden die passenden Dateien in alphabetischer Reihenfolge gelesen, was für die Wirkung der Reihenfolge wichtig sein kann.

Der Unterschied der beiden Direktiven ist klein, aber wichtig. `Include` ist *streng*: Findet es kein passendes Verzeichnis, bricht der Start ab. `IncludeOptional` ist *tolerant* und ignoriert eine fehlende Quelle. Die Testumgebung zeigt beides mit demselben Muster:

```text
$ apache2 -f /tmp/demo-httpd/inc1.conf -t      # Include "/tmp/demo-httpd/nichts/*.conf"
apache2: Syntax error on line 30 of /tmp/demo-httpd/inc1.conf:
Include/IncludeOptional: Could not open directory /tmp/demo-httpd/nichts: No such file or directory

$ apache2 -f /tmp/demo-httpd/inc2.conf -t      # IncludeOptional mit demselben Muster
Syntax OK
```

Wann nimmt man welche? Verwendet man `IncludeOptional` für Verzeichnisse, die leer sein dürfen (die Debian-Verzeichnisse `conf-enabled` und `sites-enabled` sind ein Beispiel), und `Include` für Dateien, die zwingend vorhanden sein müssen (zum Beispiel `ports.conf`). So erkennt man fehlende Pflichtdateien sofort, ohne dass ein leeres Verzeichnis den Start verhindert.

Welche Dateien am Ende tatsächlich eingelesen wurden, verrät ein Test mit dem Zusatz `-D DUMP_INCLUDES`. Das Ergebnis zeigt, in welcher Zeile welcher Datei die Einbindung steht und wie tief sie verschachtelt ist:

```text
$ apache2 -f /tmp/demo-httpd/httpd.conf -t -D DUMP_INCLUDES
Included configuration files:
  (*) /tmp/demo-httpd/httpd.conf
    (30) /tmp/demo-httpd/conf.d/doku.conf
    (30) /tmp/demo-httpd/conf.d/proxy.conf
```

Eine gut gegliederte Konfiguration kennt feste Zuständigkeiten für die einzelnen Dateien: eine Datei für globale Einstellungen, je eine für TLS-Grundwerte, Sicherheits-Header und Logformate sowie je eine pro Website. Das folgende Beispiel zeigt eine solche Struktur mit einer gemeinsamen Datei, die jeder Virtual Host einbindet:

```apache
# /etc/apache2/conf-available/sicherheit.conf  (gemeinsam)
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"

# /etc/apache2/sites-available/shop.conf
<VirtualHost *:80>
    ServerName shop.example.org
    DocumentRoot "/srv/shop/public"
    Include conf-available/sicherheit.conf
</VirtualHost>
```

Der Vorteil ist die Wiederverwendbarkeit: Ändert sich der Sicherheits-Header, ändert man eine Datei, und alle Websites, die sie einbinden, ziehen nach. Beachten muss man, dass die Datei zu dem Kontext passen muss, in dem sie eingebunden wird; eine Include-Datei mit `Listen` lässt sich nicht innerhalb eines `VirtualHost` einbinden.

### Typische Fehler.

Der erste Fehler ist ein Muster, das mehr trifft als gedacht: `Include conf.d/*` lädt *jede* Datei, auch Sicherungskopien wie `shop.conf.bak` oder Editor-Reste, und führt zu doppelten Definitionen. Besser ist das Muster `*.conf`, das nur Dateien mit der Endung einliest. Der zweite Fehler ist ein relativer Pfad, der relativ zum `ServerRoot` aufgelöst wird und deshalb nicht dort sucht, wo man es erwartet. Der dritte sind Zirkelbezüge, bei denen sich zwei Dateien gegenseitig einbinden.

```apache
# falsch: fängt auch shop.conf.bak und Editor-Dateien ein
IncludeOptional conf.d/*
# richtig: nur Dateien mit der Endung .conf
IncludeOptional conf.d/*.conf
```

> **Praxisbeispiel: Reihenfolge durch Dateinamen**
>
> Weil Dateien alphabetisch gelesen werden, benennt man sie häufig mit Zahlenpräfixen (`00-global.conf`, `10-tls.conf`, `50-shop.conf`). Das macht die Reihenfolge sichtbar und stabil. Die Debian-Datei `000-default.conf` nutzt denselben Trick, damit die Standardseite als erste gelesen wird und damit der Standard-Virtual-Host bleibt (Einheit 3.4).

## 3.3 Virtual Hosts

Ein *Virtual Host* (kurz VHost) erlaubt, mehrere Websites mit einer einzigen Apache-Instanz zu betreiben. Jede Website bekommt einen eigenen `<VirtualHost>`-Block mit eigenem Namen, eigenem Dokumentenverzeichnis, eigenen Logs und gegebenenfalls eigenem Zertifikat. Ohne Virtual Hosts bräuchte man für jede Domain einen eigenen Server oder eine eigene Instanz, was teuer und aufwendig wäre. Apache kennt zwei Arten der Zuordnung: *IP-basiert*, bei der jede Website ihre eigene IP-Adresse hat, und *namensbasiert*, bei der mehrere Websites dieselbe Adresse teilen und sich nur im Hostnamen unterscheiden. Die namensbasierte Variante ist heute der Normalfall und Thema der nächsten Einheit.

Der Aufbau eines Virtual Hosts ist einfach. Das Argument von `<VirtualHost>` nennt die Adresse und den Port, auf die der Block hört (`*:80` bedeutet: alle Adressen, Port 80). Darin stehen die Direktiven, die nur für diese Website gelten. Die Wichtigsten sind `ServerName` (Hauptname der Website), `ServerAlias` (weitere Namen), `DocumentRoot`, `ErrorLog` und `CustomLog`. Die Testumgebung verwendet folgende Definition für drei Websites:

```apache
<VirtualHost *:8080>
    ServerName standard.example
    DocumentRoot "/tmp/demo-httpd/vh/c"
    <Directory "/tmp/demo-httpd/vh/c">
        Require all granted
    </Directory>
</VirtualHost>

<VirtualHost *:8080>
    ServerName a.example
    ServerAlias www.a.example
    DocumentRoot "/tmp/demo-httpd/vh/a"
    <Directory "/tmp/demo-httpd/vh/a">
        Require all granted
    </Directory>
</VirtualHost>

<VirtualHost *:8080>
    ServerName b.example
    DocumentRoot "/tmp/demo-httpd/vh/b"
    <Directory "/tmp/demo-httpd/vh/b">
        Require all granted
    </Directory>
</VirtualHost>
```

Jede der drei Websites hat einen eigenen Dokumentenordner und eine eigene Freigabe. Die zweite hört zusätzlich auf den Alias `www.a.example`. Entscheidend ist die *Reihenfolge*: Der erste Block für eine Adresse und einen Port ist der *Standard-Host*, der alle Anfragen bekommt, die zu keinem Namen passen. Wie Apache die Blöcke tatsächlich zusammengesetzt hat, zeigt der Befehl `apachectl -S`:

```text
$ apache2 -f /tmp/demo-httpd/vh.conf -S
VirtualHost configuration:
*:8080                 is a NameVirtualHost
         default server standard.example (/tmp/demo-httpd/vh.conf:30)
         port 8080 namevhost standard.example (/tmp/demo-httpd/vh.conf:30)
         port 8080 namevhost a.example (/tmp/demo-httpd/vh.conf:37)
                 alias www.a.example
         port 8080 namevhost b.example (/tmp/demo-httpd/vh.conf:45)
```

Die Ausgabe ist das wichtigste Diagnosewerkzeug für Virtual Hosts. Sie nennt für jede Adresse den Standardserver (`default server`), die einzelnen Hosts mit der Zeilennummer ihrer Definition und die Aliase. Mit einem Blick erkennt man, ob ein Host überhaupt erkannt wurde und welcher der Standard ist. Das Verhalten lässt sich mit `curl` überprüfen, indem man den `Host`-Header setzt:

```bash
$ curl -H "Host: a.example" http://127.0.0.1:8080/
Seite A
$ curl -H "Host: www.a.example" http://127.0.0.1:8080/
Seite A
$ curl -H "Host: unbekannt.example" http://127.0.0.1:8080/
Seite C (Standard)
```

Die ersten beiden Anfragen treffen die zweite Website (über Name und Alias), die dritte fällt auf den Standard-Host zurück. Genau das ist die Stelle, an der sich die Sicherheit entscheidet: Der Standard-Host sollte keine echte Website sein, sondern eine neutrale Seite oder eine Ablehnung, damit Scans nach beliebigen Hostnamen keine Inhalte erhalten (Einheit 3.4).

Wenn ein Virtual Host für TLS vorgesehen ist, steht er auf Port 443 (`*:443`) und trägt zusätzlich die TLS-Direktiven, die Modul 6 behandelt. Es gilt eine wichtige Regel: Nicht jede Einstellung darf in einem `VirtualHost` stehen. `Listen`, `User` und `LoadModule` gehören in den globalen Kontext. Setzt man sie im `VirtualHost`, bricht Apache ab:

```text
AH00526: Syntax error on line 34 of /tmp/demo-httpd/t3.conf:
Listen cannot occur within <VirtualHost> section
```

### Typische Fehler.

Der häufigste Fehler ist die Annahme, `DocumentRoot` und `Directory` bildeten eine Einheit. Fehlt in einem neuen Virtual Host der `Directory`-Block mit `Require all granted`, antwortet Apache bei einer restriktiven Basis (Einheit 3.1) mit 403. Der zweite Fehler ist ein fehlendes `ServerName`: Dann wird der Name vom Hauptserver geerbt oder per Reverse-DNS geraten, was zu unerwarteten Zuordnungen führt. Der dritte Fehler ist ein Block, der nicht geschlossen wurde; Apache meldet `<VirtualHost> was not closed`.

```apache
# falsch: kein ServerName, kein Directory-Block
<VirtualHost *:80>
    DocumentRoot "/srv/shop/public"
</VirtualHost>
# richtig: Name ausdrücklich setzen und Verzeichnis freigeben
<VirtualHost *:80>
    ServerName shop.example.org
    DocumentRoot "/srv/shop/public"
    <Directory "/srv/shop/public">
        Require all granted
    </Directory>
</VirtualHost>
```

> **Ergänzung aus der Nachrecherche: NameVirtualHost**
>
> In älteren Apache-Versionen (2.2) musste man namensbasierte Hosts mit der Direktive `NameVirtualHost` ankündigen. In Apache 2.4 ist diese Direktive nicht mehr nötig, und Anleitungen, die sie noch verwenden, sind veraltet. Die Ausgabe von `apachectl -S` nennt die Adresse trotzdem „is a NameVirtualHost“, was nur der Beschreibung dient und nichts mit der alten Direktive zu tun hat. Die Namensregeln stehen in der Dokumentation zu namensbasierten Virtual Hosts: Der erste passende Block in der Reihenfolge der Konfiguration gewinnt, und ein ausdrücklicher Standard-Host wird empfohlen.

> **Praxisbeispiel: Hosting vieler Websites**
>
> Bei einem Hoster mit hunderten Kundenwebsites ist die Konfiguration nach dem Muster „eine Datei pro Website“ aufgebaut, oft aus Vorlagen erzeugt (Modul 12). Der Standard-Host liefert dort eine Willkommens- oder Fehlerseite, und die Kundenhosts sind durch eigene Logs und eigene Dateirechte voneinander getrennt.

## 3.4 Name-based VHosts

Beim namensbasierten Hosting teilen sich viele Websites eine IP-Adresse und einen Port. Damit der Server trotzdem die richtige Website auswählen kann, nutzt er den Namen, den der Client in der Anfrage angibt: Bei HTTP/1.1 steht er im `Host`-Header (bei HTTPS zusätzlich in der TLS-Erweiterung *SNI*, Modul 6). Das Verfahren funktioniert nur, weil der Client den Namen vorher in DNS aufgelöst hat und ihn dem Server mitteilt; die Namen müssen im DNS existieren und auf die Serveradresse zeigen.

Apache wählt den Virtual Host in zwei Schritten. Zuerst werden anhand von Adresse und Port der Verbindung alle Blöcke ausgewählt, die am besten passen; verwendet man überall `*` als Adresse, ist dieser Schritt bedeutungslos. Unter den verbliebenen Blöcken wird der Name der Anfrage mit `ServerName` und `ServerAlias` verglichen. Es gewinnt der *erste* passende Eintrag in der Reihenfolge der Konfiguration. Platzhalter wie `*` und `?` sind in `ServerAlias` erlaubt, haben aber keinen Vorrang vor genauen Namen; wer einen genauen Namen und einen Platzhalter mischt, muss auf die Reihenfolge achten. Passt kein Block, wird der *erste Block der Konfiguration* für diese Adresse benutzt, der Standard-Host.

Daraus ergibt sich die zentrale Empfehlung der Apache-Dokumentation, einen *ausdrücklichen* Standard-Host an die erste Stelle zu setzen. Er soll anfragen mit unbekanntem Namen entgegennehmen, ohne echte Inhalte preiszugeben, denn Scans und Fehlkonfigurationen in fremden DNS-Zonen schicken regelmäßig Anfragen mit beliebigen Namen an Ihre Adresse. Das folgende Beispiel richtet einen solchen Standard-Host ein, der alles ablehnt:

```apache
<VirtualHost *:8080>
    ServerName default.invalid
    DocumentRoot "/tmp/demo-httpd/vh/leer"
    <Directory "/tmp/demo-httpd/vh/leer">
        Require all denied
    </Directory>
</VirtualHost>

<VirtualHost *:8080>
    ServerName a.example
    DocumentRoot "/tmp/demo-httpd/vh/a"
    <Directory "/tmp/demo-httpd/vh/a">
        Require all granted
    </Directory>
</VirtualHost>
```

Der erste Block hat den bewusst ungültigen Namen `default.invalid` (die Top-Level-Domain `.invalid` ist für solche Zwecke reserviert) und verbietet jeden Zugriff. Er steht an erster Stelle und ist damit der Standard. Der zweite Block bedient die echte Website. In der Testumgebung ergab sich: `Host: a.example` lieferte 200, `Host: fremd.example` lieferte 403. Damit sieht ein Scan nur die Ablehnung, nie die Website. Benennt man die Dateien im Debian-Stil, sorgt der Name `000-default.conf` (oder `000-catchall.conf`) dafür, dass der Block als Erster gelesen wird.

Ein Sonderfall ist die Anfrage ohne `Host`-Header, wie sie HTTP/1.0 zulässt. Dort kann der Server nur nach Adresse und Port wählen und nimmt ebenfalls den Standard-Host. Das lässt sich mit `curl --http1.0` nachstellen und ergab in der Testumgebung ebenfalls den Standard-Host. Wichtig ist außerdem die Direktive `ServerName` für den *Hauptserver* (außerhalb der VHosts): Fehlt sie, versucht Apache, den Namen über die Rückwärtsauflösung der IP-Adresse zu erraten, und gibt die Warnung `AH00558` aus. Das ist harmlos, aber unschön und lässt sich mit einem ausdrücklichen `ServerName localhost` beseitigen.

### Typische Fehler.

Der klassische Fehler ist, dass eine neu angelegte Website „nicht erscheint“ und stattdessen der Standard-Host antwortet. Die Ursachen sind meist ein Tippfehler im `ServerName`, ein fehlender `ServerAlias` (etwa für `www.`), eine nicht aktivierte Konfigurationsdatei oder ein nicht erfolgter Neustart. Die Diagnose beginnt immer mit `apachectl -S`: Taucht der Host in der Liste nicht auf, wurde er nicht gelesen; taucht er auf, prüft man mit `curl -H "Host: ..."` die Zuordnung. Der zweite Fehler ist die Vermischung von IP-Adressen und `*` in verschiedenen Blöcken, die dazu führt, dass ein Block mit der konkreten Adresse Vorrang vor einem mit `*` erhält und damit „überraschend“ antwortet.

```apache
# falsch: echte Website zuerst - jede unbekannte Anfrage landet dort
<VirtualHost *:80>
    ServerName shop.example.org
    ...
</VirtualHost>
# richtig: Standard-Host zuerst, danach die echten Websites
<VirtualHost *:80>
    ServerName default.invalid
    <Location "/">
        Require all denied
    </Location>
</VirtualHost>
<VirtualHost *:80>
    ServerName shop.example.org
    ...
</VirtualHost>
```

> **Praxisbeispiel: Warum der Standard-Host zählt**
>
> Bei Penetrationstests und Audits wird gern geprüft, was ein Server antwortet, wenn man nur seine IP-Adresse aufruft. Zeigt er dort eine echte Anwendung (oft eine Testumgebung oder eine Verwaltungsoberfläche), ist das ein Befund. Ein ausdrücklicher Standard-Host, der nichts preisgibt, erledigt diesen Punkt in wenigen Zeilen.

## 3.5 Directory und Location

Apache kann Regeln auf verschiedene Teile einer Anfrage beziehen, und dafür gibt es drei Gruppen von Containern. `Directory` und `DirectoryMatch` beziehen sich auf Orte im *Dateisystem* (Pfade wie `/srv/shop/public`), `Files` und `FilesMatch` auf einzelne *Dateinamen*, `Location` und `LocationMatch` auf den *URL-Pfad* der Anfrage (Pfade wie `/api/`). Die Varianten mit `Match` nehmen reguläre Ausdrücke statt fester Pfade. Wer die Unterscheidung nach Dateisystem und URL sicher beherrscht, hat das wichtigste Konzept der Apache-Konfiguration verstanden (vgl. Einheit 1.3).

Die Wahl des Containers folgt einer einfachen Regel: Geht es um *Dateien auf der Platte*, nimmt man `Directory` oder `Files`, weil der Schutz dann unabhängig davon gilt, über welche URL die Datei erreichbar ist. Geht es um etwas, das *keine Datei* ist, nimmt man `Location`: ein Proxy-Pfad (`ProxyPass`), eine Statusseite (`server-status`) oder ein Handler. Man erinnert sich: Für `ProxyPass` gibt es kein Dateisystem, nur einen URL-Raum.

Passen mehrere Container auf dieselbe Anfrage, kombiniert Apache sie in einer festen Reihenfolge, und bei Konflikten gewinnt die *spätere* Regel. Die Reihenfolge ist: erst `Directory` (ohne Ausdrücke, vom kürzesten zum längsten Pfad) und `.htaccess`, dann `DirectoryMatch`, dann `Files` und `FilesMatch`, zuletzt `Location` und `LocationMatch`. Zusätzlich gilt: Innerhalb einer Gruppe entscheidet die Reihenfolge in der Datei bzw. die Pfadlänge. Die Testumgebung belegt das mit einer Kette aus vier Abschnitten, die denselben Header jeweils anders setzen:

```apache
<Directory "/tmp/demo-httpd/mo">
    Require all granted
    Header set X-Quelle "Directory"
    Header set X-Nur-Directory "ja"
</Directory>
<Directory "/tmp/demo-httpd/mo/sub">
    Header set X-Quelle "Directory-sub"
</Directory>
<Files "privat.html">
    Header set X-Quelle "Files"
</Files>
<Location "/sub/">
    Header set X-Quelle "Location"
</Location>
```

Die Abfragen ergaben: `/test.html` liefert `X-Quelle: Directory`; `/sub/index.html` und `/sub/privat.html` liefern beide `X-Quelle: Location`, und alle drei tragen zusätzlich `X-Nur-Directory: ja`. Das Ergebnis lässt sich genau deuten. Für `/test.html` greift nur der äußere `Directory`-Block. Für `/sub/index.html` greifen zuerst der äußere Block, dann der tiefere (der `X-Quelle` überschreibt), schließlich `Location`, die wiederum überschreibt. Für `/sub/privat.html` kommt `Files` dazwischen, aber `Location` kommt zuletzt und gewinnt. Und `X-Nur-Directory` bleibt überall erhalten, weil kein späterer Abschnitt es neu setzt: Direktiven werden *zusammengeführt*, nicht ersetzt, solange sie sich nicht widersprechen.

Beachtenswert ist die Pfadsyntax bei `Location`. Der Eintrag `<Location "/api">` gilt laut Dokumentation für `/api`, `/api/` und `/api/daten`, aber nicht für `/apidoc`: Gemeint ist ein Pfadsegment-Präfix, kein Zeichenpräfix. Bei `Directory` muss man dagegen echte Verzeichnispfade angeben und kann keine URL verwenden. Mit `Require` lassen sich Bedingungen formulieren: `Require ip 10.0.0.0/8` erlaubt nur ein Netz, `Require all denied` verbietet alles, und mit `<RequireAny>` und `<RequireAll>` lassen sich Bedingungen verknüpfen.

```apache
<Location "/verwaltung/">
    <RequireAll>
        Require ip 10.0.0.0/8
        Require valid-user
    </RequireAll>
</Location>
```

Die Regel verlangt, dass der Client aus dem Netz `10.0.0.0/8` kommt *und* angemeldet ist (`valid-user` setzt ein Authentifizierungsmodul voraus, Modul 10). Mit `RequireAny` wäre es ein „oder“, und `RequireAll` ist das „und“. Ohne einen dieser Container gilt bei mehreren `Require`-Zeilen standardmäßig „oder“.

### Typische Fehler.

Der gefährlichste Fehler ist, eine Datei nur über `Location` zu schützen, obwohl sie über einen zweiten Pfad (etwa einen `Alias`) erreichbar ist; der Schutz greift dann nur für einen Pfad (vgl. Modul 1). Der zweite ist, `Directory` mit einem URL-Pfad zu füttern, etwa `<Directory "/api/">`, was ins Leere läuft, weil es dieses Verzeichnis nicht gibt. Der dritte betrifft Regeln, die sich widersprechen: Wer `Require all denied` in einem Abschnitt und `Require all granted` in einem späteren setzt, bekommt das Ergebnis des späteren.

```apache
# falsch: Schutz nur über URL - die Datei ist auch über /archiv erreichbar
Alias "/archiv" "/srv/intern"
<Location "/intern/">
    Require ip 10.0.0.0/8
</Location>
# richtig: Schutz am Speicherort, gilt für jeden URL-Pfad
<Directory "/srv/intern">
    Require ip 10.0.0.0/8
</Directory>
```

> **Praxisbeispiel: Statusseite absichern**
>
> Die Statusseite `mod_status` ist ein Paradebeispiel für `Location`: Sie ist keine Datei, sondern ein Handler (`SetHandler server-status`), und ein `Require local` oder `Require ip` verhindert, dass sie aus dem Internet erreichbar ist. In der Testumgebung wurde genau so verfahren; vergisst man die Beschränkung, gibt man Details über laufende Anfragen preis.

## 3.6 .htaccess und AllowOverride

Eine `.htaccess`-Datei ist eine Konfigurationsdatei, die man in ein Verzeichnis des Webinhalts legt und die dort (und in den Unterverzeichnissen) Direktiven wirksam macht, ohne dass man die Hauptkonfiguration ändern oder den Server neu laden muss. Das ist vor allem in Umgebungen nützlich, in denen Inhaltsverantwortliche keinen Zugriff auf die Serverkonfiguration haben, etwa bei Shared Hosting, in Kontrollpanels oder bei Anwendungen wie Content-Management-Systemen, die eigene Regeln mitbringen. Der Dateiname lässt sich mit `AccessFileName` ändern.

Welche Direktiven in einer `.htaccess` erlaubt sind, regelt die Direktive `AllowOverride` im umgebenden `Directory`-Block. Laut der Apache-Dokumentation bedeutet `None`, dass `.htaccess`-Dateien ganz ignoriert werden. `All` erlaubt alle Direktiven, die in dieser Umgebung zulässig sind. Dazwischen liegen Kategorien wie `AuthConfig` (Authentifizierung), `FileInfo` (Dateitypen, Rewrites, Header), `Indexes` und `Limit` (Zugriffskontrolle), `Options` (die Direktive `Options`). Bei jeder Direktive steht in der Referenz, welche Kategorie sie braucht. Noch feiner steuert `AllowOverrideList`, das einzelne Direktiven nennt, zum Beispiel `AllowOverrideList Redirect RewriteEngine RewriteRule RewriteCond`; jede nicht genannte Direktive in der `.htaccess` führt zu einem Serverfehler.

Wie sich das praktisch verhält, zeigt ein Versuch. In der Testumgebung liegt im Verzeichnis `/ht/` eine `.htaccess` mit der einzigen Zeile `Header set X-Ht "htaccess-aktiv"`. Der umgebende `Directory`-Block wurde in vier Varianten betrieben:

| **Einstellung im Directory-Block** | **Antwort**               | **Header X-Ht**                   |
|:-----------------------------------|:--------------------------|:----------------------------------|
| keine Angabe zu `AllowOverride`          | 500 Internal Server Error | nicht vorhanden                   |
| `AllowOverride None`                          | 200 OK                    | nicht vorhanden (Datei ignoriert) |
| `AllowOverride All`                          | 200 OK                    | vorhanden                         |
| `AllowOverride AuthConfig`                          | 500 Internal Server Error | nicht vorhanden                   |

Die Ergebnisse sind lehrreich. Mit `All` wird die Direktive ausgeführt, mit `None` wird die Datei vollständig ignoriert. In den beiden Fällen mit 500 liest Apache die Datei sehr wohl, lehnt aber die Direktive `Header` ab, weil sie nicht zu den erlaubten Kategorien gehört (`Header` braucht `FileInfo`), und das Errorlog sagt es deutlich:

```text
[core:alert] ... /tmp/demo-httpd/htdocs/ht/.htaccess: Header not allowed here
```

Der überraschende Befund ist die erste Zeile der Tabelle: Selbst *ohne* jede `AllowOverride`-Angabe (in der Testkonfiguration gab es keinen `Directory`-Block für `/`) wurde die `.htaccess` gelesen und führte zu einem Fehler. Nur ein ausdrückliches `AllowOverride None` sorgt dafür, dass Apache sie vollständig übergeht. Das ist ein Argument, `AllowOverride None` immer ausdrücklich zu setzen, so wie es die Standardkonfigurationen im Block `<Directory />` tun; die Dokumentation nennt `None` als Standard, das beobachtete Verhalten der getesteten Version weicht davon in dieser minimalen Konfiguration ab.

> **Ergänzung aus der Nachrecherche: Warum .htaccess Leistung kostet**
>
> Die Apache-Dokumentation rät ausdrücklich, `.htaccess` nur zu verwenden, wenn man keinen Zugriff auf die Hauptkonfiguration hat, und nennt zwei Gründe. Erstens die *Leistung*: Sind Overrides erlaubt, sucht Apache bei jeder Anfrage in *jedem* Verzeichnis entlang des Pfades nach einer `.htaccess` (für `/www/htdocs/example/` sind das vier Zugriffe auf das Dateisystem, auch wenn keine Datei existiert), und die Datei wird bei jeder Anfrage neu gelesen. Reguläre Ausdrücke in `RewriteRule` werden in einer `.htaccess` bei jeder Anfrage neu übersetzt, in der Hauptkonfiguration dagegen einmal beim Start. Zweitens die *Sicherheit*: Wer `.htaccess` erlaubt, gibt Teile der Serversteuerung aus der Hand und muss dokumentieren, was erlaubt ist. Empfohlen wird, `AllowOverride None` dort zu setzen, wo es nicht gebraucht wird, und sonst `AllowOverrideList` zu verwenden.

Die Konsequenz ist ein klares Vorgehen: Wer Zugriff auf die Serverkonfiguration hat, verschiebt die Regeln aus der `.htaccess` in einen `Directory`-Block und setzt `AllowOverride None`. Das Ergebnis ist schneller, und es gibt nur noch eine zentrale Stelle, an der Regeln stehen.

```apache
# vorher: Regel in /srv/shop/public/.htaccess
#   Header set X-Frame-Options "SAMEORIGIN"

# nachher: Regel in der Serverkonfiguration, .htaccess abgeschaltet
<Directory "/srv/shop/public">
    AllowOverride None
    Require all granted
    Header set X-Frame-Options "SAMEORIGIN"
</Directory>
```

### Typische Fehler.

Der häufigste Fehler ist das pauschale `AllowOverride All` „weil es so in der Anleitung stand“: Es öffnet unnötig viel und kostet Leistung. Ein zweiter ist, dass eine `.htaccess` mit einer nicht erlaubten Direktive die ganze Website mit 500 lahmlegt; bei jedem `500` nach dem Ablegen einer `.htaccess` lohnt der Blick ins Errorlog. Der dritte betrifft die Absicherung der Datei selbst: Dass `.htaccess` nicht per Browser abrufbar ist, garantiert die Regel `<FilesMatch "^\.ht">` aus Einheit 3.1, die man nicht entfernen darf.

```apache
# falsch: alles erlauben, jeder Ordner darf die Serverkonfiguration ändern
<Directory "/var/www">
    AllowOverride All
</Directory>
# richtig: nur das, was gebraucht wird
<Directory "/var/www">
    AllowOverride None
    AllowOverrideList Redirect RewriteEngine RewriteRule RewriteCond
</Directory>
```

> **Praxisbeispiel: CMS-Installationen**
>
> Viele Content-Management-Systeme liefern eine `.htaccess` mit, vor allem für schöne URLs (Rewrite-Regeln). Ein sicherer Weg ist, deren Inhalt zu prüfen und in die Serverkonfiguration zu übernehmen, statt `AllowOverride All` zu setzen. Bei Updates des CMS prüft man dann, ob sich die mitgelieferte Datei geändert hat.

## 3.7 apachectl configtest

Jede Änderung an der Konfiguration birgt das Risiko, den laufenden Dienst zu beschädigen. Der *Konfigurationstest* reduziert dieses Risiko: Er liest die komplette Konfiguration so ein, wie es der Server beim Start tun würde, meldet Fehler, startet aber nichts. Der Befehl `apachectl configtest` (gleichbedeutend mit `apachectl -t`, bei Debian `apache2ctl`) gibt bei Erfolg `Syntax OK` aus und beendet sich mit dem Status 0, bei einem Fehler nennt er Datei und Zeile und beendet sich mit einem Wert ungleich 0. Der Exit-Status ist wichtig, weil Skripte und Automatisierung sich auf ihn verlassen.

Die gängigen Fehlermeldungen sind überschaubar, und sie zu erkennen spart Zeit. Die folgende Übersicht stammt aus Versuchen mit absichtlich fehlerhaften Dateien:

| **Meldung (gekürzt)** | **Ursache**                         |
|:----------------------|:------------------------------------|
| `Invalid command 'ServerNam', perhaps misspelled or defined by a module not included`             | Tippfehler oder Modul nicht geladen |
| `<VirtualHost> was not closed`             | Container nicht geschlossen         |
| `Expected </Directory> but saw </VirtualHost>`             | Container falsch verschachtelt      |
| `Unknown Authz provider: alle`             | Falsches Argument bei `Require`     |
| `DocumentRoot '...' is not a directory, or is not readable`             | Verzeichnis fehlt oder nicht lesbar |
| `Include/IncludeOptional: Could not open directory ...`             | Include ohne vorhandenes Ziel       |

Der Konfigurationstest erkennt Syntaxfehler und viele Verweise auf fehlende Dateien. Er erkennt *nicht*, ob die Konfiguration fachlich richtig ist: Ein Virtual Host mit falschem `ServerName` besteht den Test mit `Syntax OK`. Deshalb folgt nach dem Test die *Strukturprüfung* mit `apachectl -S` (Virtual Hosts), `apachectl -M` (Module) und `apachectl -t -D DUMP_INCLUDES` (Dateien). Erst danach lädt man neu.

Aus diesen Bausteinen lässt sich ein kleines Hilfsskript bauen, das Prüfung, Sicherung und sanftes Neuladen in der richtigen Reihenfolge erledigt und bei einem Fehler abbricht, *bevor* etwas verändert wird. Das Skript wurde in der Testumgebung ausgeführt: Mit gültiger Konfiguration wurde gesichert und geladen, mit einer fehlerhaften Konfiguration (`ServerNam x`) brach es mit der Meldung „nichts verändert“ ab, und die Instanz antwortete weiter mit 200.

```bash
#!/bin/bash
# sicher-laden.sh -- Konfiguration prüfen, sichern, sanft neu laden
set -eu
CONF="${1:?Aufruf: $0 /absoluter/pfad/httpd.conf}"
BIN="${HTTPD_BIN:-apache2}"
SICH="${BACKUP_DIR:-/var/backups}/httpd-$(date +%Y%m%d-%H%M%S).tar.gz"

if ! "$BIN" -f "$CONF" -t; then
    echo "Konfigurationstest fehlgeschlagen - es wurde nichts verändert." >&2
    exit 1
fi
tar czf "$SICH" -C "$(dirname "$CONF")" .
"$BIN" -f "$CONF" -k graceful
echo "Neu geladen. Sicherung: $SICH"
```

Die Schritte im Skript folgen der Reihenfolge, die man sich merken sollte. Zuerst prüft `-t` die Datei, und bei Misserfolg endet das Skript ohne Folgen. Dann sichert `tar` das Konfigurationsverzeichnis, damit ein Rollback möglich ist. Schließlich lädt `-k graceful` die Konfiguration sanft: Die laufenden Arbeitsprozesse beenden ihre Anfragen sauber und werden durch neue ersetzt. Die Variable `BACKUP_DIR` lässt den Zielort verändern, und `HTTPD_BIN` ermöglicht den Einsatz unter RHEL (`httpd`).

### Typische Fehler.

Der Klassiker ist, nach erfolgreichem Test nicht zu laden oder nach dem Laden nicht zu prüfen, ob die Änderung wirkt. Der zweite Fehler ist, den Test mit der falschen Konfigurationsdatei durchzuführen, etwa mit einer anderen als der des laufenden Dienstes; `apachectl -V` zeigt, welche Datei der laufende Dienst verwendet. Der dritte, ein Neustart statt eines Neuladens: Er unterbricht alle Verbindungen.

```bash
# falsch: direkt neu starten, ohne Test
$ sudo systemctl restart apache2
# richtig: testen, Struktur prüfen, sanft laden
$ sudo apache2ctl configtest && sudo apache2ctl -S && sudo apache2ctl graceful
```

> **Praxisbeispiel: Test in der Pipeline**
>
> In automatisierten Abläufen läuft der Konfigurationstest meist vor dem Ausrollen, zum Beispiel in einem Container, der die Konfiguration einliest und mit `httpd -t` prüft. So kommt ein fehlerhafter Stand gar nicht erst auf den Server (Modul 12).

## 3.8 Konfigurationsreview

Ein *Review* ist die gezielte Durchsicht einer Konfiguration durch jemanden, der sie nicht geschrieben hat. Es ist eine der wirksamsten und billigsten Qualitätsmaßnahmen, denn das Vier-Augen-Prinzip fängt Fehler, die der Autor nicht mehr sieht. Ein Review beantwortet drei Fragen: Funktioniert die Konfiguration (Syntax, Struktur, Logik)? Ist sie sicher (Rechte, Header, Zugriffe)? Ist sie wartbar (Gliederung, Kommentare, keine Altlasten)?

Für den Alltag hilft eine feste Prüfliste. Die folgende Übersicht fasst die Punkte zusammen, die bei Apache-Konfigurationen am häufigsten Probleme bereiten:

| **Bereich**         | **Prüfpunkt**                            | **Werkzeug**                    |
|:--------------------|:-----------------------------------------|:--------------------------------|
| Funktion            | Syntax, Include-Struktur, Virtual Hosts  | `-t`, `-S`, `DUMP_INCLUDES` |
| Module              | nur Nötiges geladen                      | `-M`                       |
| Rechte              | `Require` je Verzeichnis, Basis gesperrt | Review der `Directory`-Blöcke     |
| Overrides           | `AllowOverride None` als Standard                   | `grep` nach `AllowOverride`        |
| Auflistung          | `Options -Indexes` außer bei Bedarf               | `grep` nach `Indexes`        |
| Informationsabfluss | `ServerTokens Prod`, `ServerSignature Off`                     | `grep`                       |
| Standard-Host       | ausdrücklich und restriktiv              | `-S`                       |

Viele dieser Punkte lassen sich automatisch vorprüfen. Das folgende Skript durchsucht ein Konfigurationsverzeichnis nach häufigen Auffälligkeiten und überspringt dabei Kommentarzeilen. Es ersetzt kein Review, nimmt aber die mühsame Suche ab:

```bash
#!/bin/bash
# review.sh -- einfache Sichtprüfung einer Apache-Konfiguration
DIR="${1:?Aufruf: $0 /pfad/zum/konfigurationsverzeichnis}"
prüfe() {   # Beschreibung, Muster
    echo "== $1"
    grep -RnE "$2" "$DIR" --include='*.conf' \
      | grep -vE '^\S+:[0-9]+:\s*#' || echo "   (keine Treffer)"
}
prüfe "AllowOverride All"            '^\s*AllowOverride\s+All'
prüfe "Verzeichnislisting (Indexes)" '^\s*Options.*[^-]Indexes'
prüfe "ServerSignature On"           '^\s*ServerSignature\s+On'
prüfe "ServerTokens nicht Prod"      '^\s*ServerTokens\s+(Full|OS|Minor|Minimal|Major)'
prüfe "TraceEnable"                  '^\s*TraceEnable'
```

Die Funktion `pruefe` nimmt eine Beschreibung und ein Muster, sucht rekursiv in allen `.conf`-Dateien, entfernt Kommentarzeilen und meldet „keine Treffer“, wenn nichts gefunden wurde. Auf der Debian-Standardkonfiguration der Testmaschine liefert es drei echte Hinweise: In `apache2.conf` gilt für `/var/www/` die Einstellung `Options Indexes FollowSymLinks` (Verzeichnislisting erlaubt), in `security.conf` steht `ServerSignature On` und `ServerTokens OS`, wodurch Serverversion und Betriebssystem in Fehlerseiten und Headern erscheinen. `TraceEnable Off` ist dagegen bereits sicher gesetzt, `AllowOverride All` kommt nicht vor.

Eine Standardkonfiguration ist also ein Ausgangspunkt, kein Endzustand. Gute Reviews halten ihre Ergebnisse schriftlich fest, nennen Befund, Risiko und Empfehlung und trennen „muss“ von „sollte“. Zu einem Review gehört auch der Blick auf das, was fehlt: keine Zugriffsbeschränkung auf der Statusseite, kein Standard-Host, kein Log-Rotationskonzept.

### Typische Fehler.

Der häufigste Fehler ist, dass der Autor selbst prüft und nur wiederholt, was er sich gedacht hat. Ein zweiter ist, Review und Test zu verwechseln: Ein bestandener `configtest` sagt nichts darüber, ob die Konfiguration sinnvoll ist. Der dritte ist ein Review ohne Kriterien, bei dem jeder Prüfer etwas anderes liest.

```bash
# falsch: nur die Syntax geprüft, dann ausgerollt
$ apache2ctl configtest && apache2ctl graceful
# richtig: Syntax, Struktur und Auffälligkeiten prüfen, dann ausrollen
$ apache2ctl configtest && apache2ctl -S && ./review.sh /etc/apache2 && apache2ctl graceful
```

> **Ergänzung aus der Nachrecherche: Härtungsleitfäden**
>
> Für ein tiefergehendes Review gibt es veröffentlichte Härtungsleitfäden, zum Beispiel die CIS-Benchmarks. Sie wurden für dieses Skript nicht abgerufen und sind daher nur als weiterführender Hinweis aufgeführt; die Hauptthemen der Härtung folgen in Modul 10.

> **Praxisbeispiel: Review vor dem Ausrollen**
>
> In Teams mit Versionskontrolle ist ein Review Teil des Änderungsprozesses: Die Änderung wird als Merge Request eingereicht, ein zweiter Mensch liest den Diff, und die Pipeline führt `configtest` aus. Bei Apache, wo die Konfiguration oft über viele kleine Dateien verteilt ist, lohnt sich ein Blick auf `DUMP_INCLUDES`, damit nicht nur die geänderte Datei, sondern auch ihr Umfeld geprüft wird.

## 3.9 Nginx: Directives und Contexts

Die Konfiguration von Nginx besteht aus *Direktiven*. Eine Direktive ist entweder eine *einfache Direktive*, also ein Name mit Parametern, abgeschlossen durch ein Semikolon (`worker_processes 2;`), oder eine *Blockdirektive*, die in geschweiften Klammern weitere Direktiven enthält (`server { ... }`). Ein Block, der selbst Direktiven enthalten darf, heißt *Kontext*. Die Kontexte sind ineinander verschachtelt: Die oberste Ebene (außerhalb aller Klammern) heißt `main`, darin liegen `events` und `http`, im `http`-Block liegen `server`-Blöcke, darin `location`-Blöcke.

Dass es Kontexte gibt, hat einen praktischen Grund: Jede Direktive ist nur in bestimmten Kontexten erlaubt, und jede Direktive hat einen Vererbungsmechanismus. Die Referenz auf nginx.org nennt bei jeder Direktive Syntax, Standardwert und erlaubte Kontexte („Context:“). Steht eine Direktive in einem Kontext, in dem sie nicht erlaubt ist, verweigert Nginx den Start. Der Test in der Testumgebung zeigt die Meldung für `server_name` direkt in `main`:

```text
nginx: [emerg] "server_name" directive is not allowed here in /tmp/demo-nginx/t_ctx.conf:3
```

Die Meldung nennt Direktive, Datei und Zeile. Das ist eine gute Nachricht, denn sie trifft den Fehler genau. Die Vererbung funktioniert meist „von außen nach innen“: Eine Direktive, die in `http` gesetzt wird, gilt für alle `server`-Blöcke darin, es sei denn, ein `server`-Block (oder ein `location`) setzt dieselbe Direktive neu. Dann gilt der innere Wert. Das folgende Beispiel zeigt das mit `client_max_body_size`, das die maximale Größe des Anfragekörpers begrenzt:

```nginx
events {}
http {
    client_max_body_size 1k;           # global: sehr klein
    server {
        listen 8081;
        location /klein/ { return 200 "klein\n"; }
        location /gross/ {
            client_max_body_size 1m;   # nur hier überschrieben
            return 200 "gross\n";
        }
    }
}
```

Die Direktive steht zuerst im `http`-Block mit dem Wert `1k`, was für den ganzen Server gilt. Im `location /gross/` wird sie überschrieben. Ein Test mit einem 2000 Byte großen Körper per `curl --data-binary` ergab: Auf `/klein/` Antwort 413 (Request Entity Too Large), auf `/gross/` Antwort 200. Die innere Einstellung hat also Vorrang, und genau das macht Kontexte nützlich: Man legt eine vernünftige Voreinstellung außen fest und überschreibt sie dort, wo es eine Ausnahme gibt, zum Beispiel für den Upload-Pfad.

Die Vererbung hat jedoch eine Ausnahme, die in der Praxis viele Fehler verursacht: die *Array-Direktiven*, also solche, die mehrfach vorkommen dürfen, wie `add_header`, `proxy_set_header` und `fastcgi_param`. Für sie gilt: Gibt es auf einer Ebene mindestens eine solche Direktive, werden die Direktiven der äußeren Ebene *vollständig nicht mehr geerbt*. Sie ergänzen sich nicht, sondern ersetzen sich. Der Test zeigt es mit `add_header`:

```nginx
http {
    add_header X-Global "ja";
    server {
        listen 8082;
        add_header X-Server "ja";      # ersetzt X-Global
        location /a { return 200 "a\n"; }
        location /b {
            add_header X-Loc "ja";     # ersetzt X-Server
            return 200 "b\n";
        }
    }
}
```

Antwort auf `/a`: nur `X-Server`, der globale Header ist verschwunden. Antwort auf `/b`: nur `X-Loc`. Wer Sicherheits-Header global setzt und dann an einer Stelle einen weiteren Header hinzufügt, verliert damit die Sicherheits-Header an dieser Stelle, ohne dass eine Fehlermeldung erscheint. Die Lösung ist, die Header in einer Datei zu bündeln und sie in jedem Block, der eigene Header setzt, per `include` mitzunehmen.

> **Ergänzung aus der Nachrecherche: Das Verhalten ist dokumentiert**
>
> Die Nginx-Referenz zu `add_header` beschreibt nach dem Kenntnisstand des Autors, dass die Direktiven nur dann von der vorherigen Konfigurationsebene geerbt werden, wenn es auf der aktuellen Ebene keine `add_header`-Direktiven gibt. Das entspricht der Beobachtung im Test. Die Seite <https://nginx.org/en/docs/http/ngx_http_headers_module.html> konnte in der Arbeitsumgebung nicht abgerufen werden (nginx.org war gesperrt) und steht deshalb unter „weiterführend“ im Quellenverzeichnis; bitte den Wortlaut dort selbst prüfen.

Neben `include` ist die Reihenfolge innerhalb eines Kontexts selten relevant, mit wichtigen Ausnahmen: `rewrite`, `return` und `if` werden in der Reihenfolge ausgewertet, in der sie stehen (in den Modulen zu Proxy und Weiterleitungen). Die Reihenfolge der `location`-Blöcke ist dagegen für die Auswahl meist egal (Einheit 3.13).

### Typische Fehler.

Das fehlende Semikolon ist der häufigste Tippfehler: Aus ihm wird je nach Position die Meldung `unexpected "}"` oder ein Hinweis auf die nächste Zeile. Nicht übersehen werden darf auch die Vererbungsfalle bei `add_header`. Und Direktiven stehen in Kontexten, in denen sie nicht erlaubt sind, etwa `server_name` außerhalb von `server`.

```nginx
# falsch: Sicherheits-Header gehen im location verloren
server {
    add_header X-Content-Type-Options "nosniff";
    location /api/ {
        add_header Cache-Control "no-store";
    }
}
# richtig: gemeinsame Header per include in jedem Block
server {
    include snippets/sicherheits-header.conf;
    location /api/ {
        include snippets/sicherheits-header.conf;
        add_header Cache-Control "no-store";
    }
}
```

> **Praxisbeispiel: Wartbare Struktur**
>
> In produktiven Konfigurationen liegt in `nginx.conf` nur das Gerüst, und die Websites liegen in einzelnen Dateien (bei Debian `sites-enabled/`, sonst `conf.d/`). Wer die Vererbung kennt, kann gemeinsame Werte (Größenlimits, Timeouts, Header) einmal in `http` festlegen und nur Ausnahmen in den Blöcken tragen.

## 3.10 Nginx: http Context

Der `http`-Block ist der Kontext für alles, was mit dem HTTP-Protokoll zu tun hat. Er enthält die Voreinstellungen für alle Websites und die `server`-Blöcke. Eine Standardinstallation bringt einen `http`-Block mit, der etwa so aussieht, in der Testumgebung stammt die Struktur aus dem Debian-Paket 1.24.0:

```nginx
http {
    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    access_log /var/log/nginx/access.log;
    error_log  /var/log/nginx/error.log;

    gzip on;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

Die einzelnen Direktiven haben jeweils eine klare Aufgabe. `sendfile on` erlaubt dem Kernel, Dateien direkt an den Netzwerk-Socket zu übergeben, ohne den Umweg über den Prozessspeicher (schneller bei statischen Dateien). `tcp_nopush on` sorgt in Verbindung mit `sendfile` dafür, dass Antwortkopf und Dateianfang in einem Paket verschickt werden. `keepalive_timeout 65` gibt an, wie lange Nginx eine Verbindung für weitere Anfragen offen hält; kurze Werte sparen Verbindungen, lange sparen Verbindungsaufbau. `include mime.types` lädt die Zuordnung von Dateiendungen zu Content-Types, und `default_type` gilt, wenn nichts passt: Mit `application/octet-stream` erzwingt der Browser einen Download, statt unbekannte Daten anzuzeigen.

Die `access_log`- und `error_log`-Direktiven sind ebenfalls hier geeignet, weil sie dann für alle Websites gelten, die nichts Eigenes festlegen. Pro Website lassen sich eigene Logs einrichten, siehe Modul 9. Mit `log_format` definiert man ein Protokollformat, das bei `access_log` namentlich angegeben wird. Die letzten beiden Zeilen binden Konfigurationsdateien ein. Wichtig ist die Reihenfolge der Einbindung für die Auswahl des Standardservers: Wenn mehrere `server`-Blöcke dieselbe `listen`-Adresse haben und keiner `default_server` markiert ist, gilt der *erste* gelesene Block als Standard (Einheit 3.11).

Eine Besonderheit von Nginx ist die Trennung zwischen `events` und `http`. Der `events`-Block steuert die Verbindungsverarbeitung (`worker_connections`), der `http`-Block die Protokollebene. Daneben kennt Nginx weitere Hauptkontexte wie `stream` (für TCP/UDP-Durchleitung) und `mail`, die der Lehrplan hier nicht verlangt.

Den Gesamteindruck, was Nginx aus allen Dateien zusammensetzt, liefert `nginx -T`: Es testet die Konfiguration und gibt sie vollständig aus, jede Datei mit einem Kommentar `# configuration file ...`. Das ist das wichtigste Werkzeug, wenn man wissen will, *welche* Dateien tatsächlich eingebunden werden.

### Typische Fehler.

Ein typischer Fehler ist, einen `server`-Block außerhalb von `http` zu platzieren; die Meldung lautet dann, dass die Direktive `server` hier nicht erlaubt sei. Ein zweiter ist ein vergessenes `include /etc/nginx/mime.types`: Dann liefert Nginx CSS und JavaScript als `application/octet-stream`, und Browser verweigern die Ausführung oder bieten einen Download an. Der dritte ist, dieselbe Direktive mehrfach auf derselben Ebene zu setzen, wo sie nur einmal erlaubt ist (`"... directive is duplicate"`).

```nginx
# falsch: mime.types fehlt - CSS wird als Download ausgeliefert
http {
    server { listen 80; root /var/www/html; }
}
# richtig: Zuordnung laden
http {
    include       mime.types;
    default_type  application/octet-stream;
    server { listen 80; root /var/www/html; }
}
```

> **Praxisbeispiel: Zentrale Voreinstellungen**
>
> Teams legen im `http`-Block fest, was für alle Websites gilt: Größenlimits, Timeouts, Kompression, Standard-Header und das Logformat. Eine einzelne Website muss dann nur ihre Abweichungen formulieren, und eine Änderung der Voreinstellung wirkt auf alle gleichzeitig.

## 3.11 Nginx: server Blocks

Ein `server`-Block beschreibt einen virtuellen Server, das Nginx-Gegenstück zum Apache-`VirtualHost`. Er enthält mindestens eine `listen`-Direktive (Adresse und Port, auf denen Verbindungen angenommen werden), meist eine `server_name`-Direktive (die Namen, für die er zuständig ist) und ein oder mehrere `location`-Blöcke oder ein `root`. Fehlt `listen`, lauscht der Block auf Port 80 (bzw. 8000, wenn Nginx ohne Superuser-Rechte läuft).

Die Auswahl des Servers funktioniert, wie die Nginx-Dokumentation zur Anfragebearbeitung beschreibt, in zwei Stufen. Zuerst prüft Nginx die Adresse und den Port der Verbindung gegen alle `listen`-Direktiven und sucht die passenden Blöcke. Unter diesen wählt es anhand des `Host`-Headers per `server_name` den richtigen Block (Einheit 3.12). Findet es keinen, nimmt es den *Standardserver* für diese Adresse und diesen Port: den, der mit `default_server` an der `listen`-Direktive markiert ist, sonst den ersten in der Konfiguration.

Wie in Apache gilt die Empfehlung, den Standardserver *ausdrücklich* zu bestimmen, damit Anfragen mit unbekanntem Namen nichts Wertvolles zu sehen bekommen. Nginx hat dafür eine besonders knappe Lösung, die Antwort `444`. Das ist kein offizieller HTTP-Statuscode, sondern ein Nginx-Sonderwert, der bedeutet: Die Verbindung wird ohne Antwort geschlossen. Das folgende Beispiel aus der Testumgebung stellt zwei Websites und einen solchen Standardserver zusammen:

```nginx
http {
    server {
        listen 8083 default_server;
        server_name _;
        return 444;                        # Verbindung kappen
    }
    server {
        listen 8083;
        server_name shop.example;
        location / { return 200 "shop\n"; }
    }
    server {
        listen 8083;
        server_name blog.example;
        location / { return 200 "blog\n"; }
    }
}
```

Der erste Block trägt `default_server` und den Namen `_` (ein Unterstrich, der sich keinem echten Hostnamen zuordnen lässt und deshalb als Platzhalter üblich ist; er hat keine Sonderbedeutung). Die Antwort `return 444` beendet die Verbindung sofort. Die beiden anderen Blöcke antworten jeweils mit ihrem Namen. Ein Aufruf mit `curl -H "Host: shop.example"` liefert `shop`, mit `blog.example` liefert er `blog`, und mit einem beliebigen anderen Namen bricht curl mit „Empty reply from server“ ab. Das ist genau das erwartete Verhalten.

Ein `server`-Block kann außerdem mehrere `listen`-Direktiven haben, etwa je eine für IPv4 und IPv6 (`listen 80;` und `listen [::]:80;`) oder für HTTP und HTTPS (`listen 443 ssl;`, Modul 6). Wichtig ist, dass `default_server` *pro Adresse und Port* gilt: Ein Block kann auf Port 80 Standard sein und auf Port 443 nicht, und wer für beide Ports einen Standard will, muss es an beiden `listen`-Zeilen angeben. Die Parameter wie `ssl`, `http2` und `reuseport` gehören ebenfalls an `listen`; bei `reuseport` gilt eine Einschränkung, die das Handbuch nennt: Es kann je Adresse und Port nur einmal gesetzt werden.

> **Ergänzung aus der Nachrecherche: Seit 1.25: http2 als eigene Direktive**
>
> Nach der Nginx-Dokumentation (nicht abgerufen, bitte prüfen) wurde der Parameter `http2` an `listen` ab Version 1.25.1 als veraltet markiert; stattdessen gibt es die Direktive `http2 on;`. In der Testumgebung (Nginx 1.24.0) existiert die neue Direktive noch nicht. Beim Lesen fremder Konfigurationen trifft man daher beide Schreibweisen an, Details in Modul 6.

### Typische Fehler.

Verbreitet ist der Fehler, den Standardserver dem Zufall zu überlassen, etwa weil Dateien in `sites-enabled/` alphabetisch gelesen werden und eine Fachanwendung zufällig als Erste kommt. Ein zweiter Fehler: `default_server` nur auf einem der beiden Ports gesetzt. Der dritte: zwei Blöcke mit derselben Kombination aus `listen` und `server_name` erzeugen die Warnung `conflicting server name ... ignored`; der zweite Block wird dann nie benutzt.

```nginx
# falsch: Standard ist der, der zufällig zuerst gelesen wird
server { listen 80; server_name intern.example.org; root /srv/intern; }
server { listen 80; server_name www.example.org;    root /srv/www; }
# richtig: ausdrücklicher Standard, der nichts preisgibt
server { listen 80 default_server; server_name _; return 444; }
server { listen 80; server_name intern.example.org; root /srv/intern; }
server { listen 80; server_name www.example.org;    root /srv/www; }
```

> **Praxisbeispiel: Zugriffe per IP-Adresse**
>
> Wie bei Apache ist der Aufruf einer Server-IP ohne Namen eine beliebte Methode von Scannern. Mit einem Standardserver, der `444` liefert (oder bei HTTPS die Verbindung ohne Zertifikat abweist, Modul 6), sieht ein Scan keine Website. In Protokollen erkennt man diese Treffer an der Antwort `444` und kann sie leicht filtern.

## 3.12 Nginx: server_name

Die Direktive `server_name` legt fest, für welche Hostnamen ein `server`-Block zuständig ist. Sie akzeptiert mehrere Namen, und neben exakten Namen kennt sie Platzhalter am Anfang oder am Ende sowie reguläre Ausdrücke. Weil mehrere Blöcke zugleich passen können, hat Nginx eine feste Rangfolge, die die Dokumentation so beschreibt: Zuerst gewinnt der exakte Name, dann der längste Platzhalter am Anfang (`*.example.org`), dann der längste Platzhalter am Ende (`mail.*`), und zuletzt der erste passende reguläre Ausdruck in der Reihenfolge der Konfiguration. Gibt es keinen Treffer, kommt der Standardserver.

Diese Rangfolge lässt sich in der Testumgebung mit einer Konfiguration prüfen, in der jeder Fall einen eigenen Block erhält und der Block seinen Typ zurückmeldet:

```nginx
server { listen 8084 default_server; server_name _;
         return 200 "default\n"; }
server { listen 8084; server_name exakt.example;
         return 200 "exakt\n"; }
server { listen 8084; server_name *.example.org;
         return 200 "wildcard-vorn\n"; }
server { listen 8084; server_name www.example.*;
         return 200 "wildcard-hinten\n"; }
server { listen 8084; server_name ~^(?<sub>[a-z]+)\.regex\.example$;
         return 200 "regex sub=$sub\n"; }
```

Das Ergebnis der Abfragen: `exakt.example` lieferte `exakt`; `x.example.org` lieferte `wildcard-vorn`; `www.example.net` lieferte `wildcard-hinten`; `abc.regex.example` lieferte `regex sub=abc`; ein unbekannter Name wie `zzz.test` lieferte `default`. Der letzte Block zeigt eine nützliche Fähigkeit: Ein regulärer Ausdruck mit *benannter Gruppe* `(?<sub>...)` legt das Ergebnis in eine Variable `$sub` ab, die danach im Block benutzbar ist, zum Beispiel, um aus dem Subdomain-Namen einen Verzeichnispfad zu bilden (`root /srv/kunden/$sub;`). Dass ein regulärer Ausdruck mit `~` beginnen muss, ist die Kennzeichnung für Nginx; ohne diese wird er als Name gelesen.

Zu beachten ist, dass ein Wildcard-Name nur am Anfang oder am Ende stehen darf, nicht in der Mitte (`www.*.example` ist ungültig), und dass `*.example.org` den Namen `example.org` selbst *nicht* einschließt. Der kürzere Weg, beide zu bedienen, ist der Sonderfall `.example.org`, der gleichbedeutend mit `example.org *.example.org` ist. Außerdem werden Namen intern in Hash-Tabellen gehalten; bei sehr vielen oder sehr langen Namen verlangt Nginx größere Tabellen mit `server_names_hash_bucket_size` oder `server_names_hash_max_size`, andernfalls verweigert der Test den Start mit einer Meldung, die genau diese Direktive nennt.

```nginx
server {
    listen 80;
    server_name example.org www.example.org;
    return 301 https://www.example.org$request_uri;
}
```

Dieses kleine Muster ist sehr häufig: Eine Website hat meist einen Hauptnamen und Aliasnamen. Hier erhalten beide Namen eine dauerhafte Weiterleitung (301) auf die HTTPS-Adresse mit `www`. Die Variable `$request_uri` enthält Pfad und Query-String der Anfrage, so dass die Zieladresse vollständig ist. Der Test mit `return 301 https://$host$request_uri` ergab den Header `Location: https://r.example/pfad?x=1`.

### Typische Fehler.

Ein verbreiteter Irrtum: `server_name *.example.org` bediene auch die Hauptdomain. Das tut es nicht. Ebenso häufig sind reguläre Ausdrücke ohne `~` oder ohne Anker (`^` und `$`), die dann zu viel treffen. Und ein dritter Fehler: den Namen mit Port angeben (`server_name example.org:8080;`); der Port gehört an `listen`, nicht an `server_name`.

```nginx
# falsch: Hauptdomain wird nicht bedient, Port im Namen
server_name *.example.org:8080;
# richtig: beide Namen, Port bei listen
listen 8080;
server_name example.org *.example.org;
```

> **Praxisbeispiel: Mandantenfähige Systeme**
>
> Bei Anwendungen, die jedem Kunden eine eigene Subdomain geben (`kunde1.app.example`), spart ein einziger Block mit Wildcard oder regulärem Ausdruck die Pflege vieler Einzelblöcke. Das zugehörige Zertifikat muss dann ebenfalls ein Wildcard-Zertifikat sein (Modul 6).

## 3.13 Nginx: location Matching

Innerhalb eines `server`-Blocks entscheidet `location`, wie eine Anfrage anhand ihres Pfades bearbeitet wird. Hier liegt die größte Fehlerquelle in Nginx-Konfigurationen, weil die Auswahl nach festen, aber nicht offensichtlichen Regeln erfolgt, die *nicht* der Reihenfolge in der Datei folgen. Die Syntax lautet `location [Modifikator] Muster { ... }`. Es gibt folgende Formen: kein Modifikator (Präfix), `=` (exakte Übereinstimmung), `~` (regulärer Ausdruck, Groß- und Kleinschreibung beachtet), `~*` (regulärer Ausdruck ohne Unterscheidung) und `^~` (Präfix, das die Suche nach Ausdrücken unterbindet). Dazu kommen *benannte Locations* mit `@`, die nur intern erreichbar sind.

Der Algorithmus hat nach der Nginx-Dokumentation vier Schritte. Erstens sucht Nginx unter den Präfix-Locations (mit und ohne `^~`) das Muster mit dem *längsten* passenden Präfix und merkt es sich. Zweitens: gibt es eine `=`-Übereinstimmung, wird die Suche sofort beendet. Drittens: Hat der längste Präfix den Modifikator `^~`, ist die Suche ebenfalls beendet. Viertens werden die regulären Ausdrücke in der Reihenfolge der Datei geprüft, und der *erste* Treffer gewinnt; gibt es keinen, gilt das gemerkte Präfix. Für den Test wurde jede dieser Regeln in einer Konfiguration abgebildet, jeder Block antwortet mit seinem Namen:

```nginx
server {
    listen 8085;
    location = /            { return 200 "L-exakt\n"; }
    location /              { return 200 "L-root\n"; }
    location /bild/         { return 200 "L-bild\n"; }
    location ~* \.txt$      { return 200 "L-regex-txt\n"; }
    location ^~ /statisch/  { return 200 "L-statisch-vorrang\n"; }
    location /statisch/sonder { return 200 "L-lang\n"; }
}
```

Die Ergebnisse bestätigen die Regeln. `/` liefert `L-exakt`, weil `=` Vorrang hat; `/anderes` liefert `L-root`, den allgemeinsten Präfix. `/bild/x.png` liefert `L-bild`. `/bild/a.txt` liefert aber `L-regex-txt`: Der Präfix `/bild/` wurde gemerkt, aber der Ausdruck gewinnt, weil er danach geprüft wird. `/statisch/a.txt` dagegen liefert `L-statisch-vorrang`, denn der Präfix mit `^~` beendet die Suche, bevor Ausdrücke geprüft werden. Und `/statisch/sonder` liefert `L-lang`: Der längere Präfix gewinnt die Präfixsuche, und weil er kein `^~` trägt, würden Ausdrücke zwar noch geprüft, doch hier passt keiner.

Aus diesen Regeln folgen Gestaltungsempfehlungen. Man sollte `location /` immer als allgemeinen Fallback haben. Exakte Treffer mit `=` beschleunigen häufige feste Pfade wie `/` oder `/favicon.ico`. Wo ein Verzeichnis nie von einem Ausdruck erfasst werden soll (statische Dateien in einem eigenen Pfad), nimmt man `^~`. Und reguläre Ausdrücke sollte man sparsam einsetzen, weil ihre Reihenfolge in der Datei zählt, was die Wartung erschwert. Ein praktisches Beispiel ist die Kombination aus statischen Dateien und Anwendung:

```nginx
server {
    listen 8086;
    location ^~ /assets/ {
        root /srv/app;                 # /srv/app/assets/...
        expires 7d;
    }
    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

Alle Pfade unter `/assets/` werden direkt aus dem Dateisystem bedient (mit Cache-Hinweis für sieben Tage), alles andere geht an die Anwendung im Hintergrund (`proxy_pass`, Modul 7). Beachten Sie bei `root`, dass der Pfad der Anfrage *angehängt* wird: Für `/assets/a.css` sucht Nginx die Datei `/srv/app/assets/a.css`. Wer den Anfang des Pfades abschneiden möchte, nimmt statt `root` die Direktive `alias`, bei der der `location`-Teil durch den angegebenen Pfad ersetzt wird.

Eine *benannte Location* ist ein Sprungziel, das nur intern erreichbar ist, zum Beispiel für Fehlerbehandlung. In der Testumgebung wurde `error_page 404 = @fallback;` verwendet: Bei einem 404 wechselt Nginx intern zu `location @fallback`, deren Antwort dann gesendet wird, wobei das `=` den Statuscode durch den der Zielantwort ersetzt. Das ist eine gängige Technik, um nicht vorhandene Dateien an eine Anwendung weiterzureichen.

### Typische Fehler.

Der häufigste Fehler ist die Annahme, die Reihenfolge der Präfix-Locations sei wichtig; sie ist es nicht, nur die Länge. Das Gegenteil gilt bei regulären Ausdrücken. Ein zweiter ist, dass ein Ausdruck wie `~ \.php$` auch Dateien in Upload-Verzeichnissen erfasst (und damit Ausführung ermöglichen kann), weil ein Ausdruck den Präfix übertrumpft. Ein dritter: zwei identische Locations (`duplicate location`).

```nginx
# falsch: Ausdruck erfasst auch /statisch/.../x.php (Ausdruck gewinnt)
location /statisch/ { root /srv/app; }
location ~ \.php$   { fastcgi_pass unix:/run/php/fpm.sock; }
# richtig: ^~ verhindert die Prüfung von Ausdrücken für diesen Pfad
location ^~ /statisch/ { root /srv/app; }
location ~ \.php$      { fastcgi_pass unix:/run/php/fpm.sock; }
```

> **Praxisbeispiel: Der Klassiker: PHP im Upload-Ordner**
>
> Eine zu allgemeine PHP-Regel zusammen mit einem Upload-Verzeichnis ist ein bekannter Weg, hochgeladene Dateien ausführbar zu machen. Mit `^~` oder einer eigenen Regel für den Upload-Pfad (`location ^~ /uploads/ { ... }`) schließt man das aus; Modul 10 behandelt das ausführlich.

## 3.14 Nginx: nginx -t

Der Befehl `nginx -t` ist das Nginx-Gegenstück zu `apachectl configtest`. Er liest die Konfiguration, prüft Syntax und Verweise und öffnet dabei die genannten Dateien (Logdateien, Zertifikate, `include`-Ziele). Bei Erfolg meldet er `syntax is ok` und `test is successful`, bei Fehlern nennt er Datei und Zeile und beendet sich mit Status 1. Ergänzend gibt es `-T`, das zusätzlich die gesamte zusammengesetzte Konfiguration ausgibt, `-q` (still, nur Fehler ausgeben), `-c Datei` (andere Konfigurationsdatei) und `-g "Direktiven"` (Direktiven aus der Kommandozeile hinzufügen, der Test ergab, dass etwa `-g "worker_processes 3;"` zusammen mit `-t` funktioniert).

Die Fehlermeldungen sind meist sehr aussagekräftig. Die folgende Tabelle fasst die in der Testumgebung erzeugten Meldungen zusammen:

| **Meldung (gekürzt)** | **Ursache**                              |
|:----------------------|:-----------------------------------------|
| `unexpected "}"`             | Semikolon in der Zeile davor vergessen   |
| `unexpected end of file, expecting "}"`             | Eine schließende Klammer fehlt           |
| `unknown directive "retrun"`             | Tippfehler im Direktivennamen            |
| `invalid number of arguments in "return" directive`             | Falsche Parameterzahl                    |
| `open() "...gibtsnicht.conf" failed (2: No such file or directory)`             | `include` auf eine fehlende Datei        |
| `duplicate location "/a"`             | Zwei gleiche Locations                   |
| `cannot load certificate ... BIO_new_file() failed`             | Zertifikatsdatei fehlt oder nicht lesbar |
| `"server_name" directive is not allowed here`             | Direktive im falschen Kontext            |

Auffällig ist die Ähnlichkeit zum Apache-Test, aber auch ein Unterschied: Nginx prüft beim Test, ob Logverzeichnisse und Zertifikate *geöffnet* werden können. Ein fehlendes Logverzeichnis führt zu einer `open()`-Meldung, ein fehlendes Zertifikat zum Fehler beim Laden. Ein bestandener Test ist deshalb aussagekräftiger für das spätere Starten, aber auch er sagt nichts darüber, ob der Port frei ist: Ob `bind()` gelingt, zeigt erst das Starten oder Neuladen. Wer als normaler Benutzer testet, bekommt außerdem Rechteprobleme (zum Beispiel beim PID-File), die als Superuser nicht auftreten.

Der Test gehört wie bei Apache in einen festen Ablauf. Auch hier lässt sich das in einem kleinen Skript festhalten, das testet und erst bei Erfolg neu lädt. Die Befehle in der Reihenfolge, wie sie auf einem Server mit systemd laufen:

```bash
#!/bin/bash
# nginx-laden.sh -- testen, bei Erfolg sanft neu laden
set -eu
if sudo nginx -t -q; then
    sudo nginx -s reload
    echo "Konfiguration neu geladen."
else
    echo "Test fehlgeschlagen - laufende Konfiguration bleibt aktiv." >&2
    exit 1
fi
```

Mit `-t -q` gibt der Test bei Erfolg nichts aus (Exit-Status 0), bei Fehlern nur die Fehlermeldung (Exit-Status 1). Das Skript nutzt das als Bedingung. Das Neuladen mit `nginx -s reload` sendet das Signal HUP an den Master-Prozess, der die Konfiguration neu liest, neue Arbeitsprozesse startet und die alten sanft beendet (Einheit 1.11). Wichtig: Auch ein fehlerfreies `reload` kann scheitern, wenn die neue Konfiguration trotz bestandenem Test beim Anwenden Probleme macht; in diesem Fall behält Nginx die alte Konfiguration und schreibt eine Meldung ins Fehlerlog. Nach einem Neuladen lohnt sich daher der Blick in `error.log` und eine Stichprobe per `curl`.

### Typische Fehler.

Man testet und lädt eine andere Datei, als der laufende Dienst verwendet (`nginx -V` zeigt den Standardpfad und `--conf-path`); man startet statt zu laden neu, obwohl Verbindungen offen sind; oder man ignoriert Warnungen. Warnungen (`[warn]`) lassen den Test bestehen, deuten aber auf Probleme hin, etwa auf veraltete Direktiven oder Namenskonflikte.

```bash
# falsch: Datei bearbeitet und gleich neu geladen
$ sudo nano /etc/nginx/sites-enabled/shop && sudo nginx -s reload
# richtig: erst testen, dann laden, dann prüfen
$ sudo nginx -t && sudo nginx -s reload && curl -sI http://localhost/ | head -1
```

> **Praxisbeispiel: Test in der CI**
>
> Eine Nginx-Konfiguration lässt sich in einem Wegwerf-Container prüfen, ohne einen Server zu starten: Man kopiert die Dateien an die erwarteten Orte und ruft `nginx -t` auf. So schlagen Tippfehler in der Pipeline auf, nicht erst bei der Auslieferung (Modul 12). Dabei müssen Zertifikate und Verzeichnisse existieren, sonst scheitert der Test an `open()`; man legt dafür Platzhalterdateien an.

## Übungsaufgaben

Die Aufgaben steigen im Schwierigkeitsgrad. Die Aufgaben 6 bis 9 sind praktische Aufgaben, die Sie in einer Testumgebung (virtuelle Maschine oder Container, nicht auf einem Produktivsystem) nachbauen sollten. Die Lösungen mit Erklärung folgen im nächsten Abschnitt.

**Aufgabe 1 (leicht).** Ein Apache-Server hat drei Virtual Hosts auf `*:80`, in dieser Reihenfolge der Konfiguration: `shop.example`, `blog.example`, `wiki.example`. Welcher Block antwortet auf eine Anfrage mit `Host: forum.example`, welcher auf eine Anfrage ohne `Host`-Header? Warum ist dieses Verhalten ein Risiko, und wie beseitigen Sie es?

**Aufgabe 2 (leicht).** Erklären Sie in zwei bis drei Sätzen den Unterschied zwischen `Directory`, `Files` und `Location` bei Apache. Für welchen Fall nehmen Sie jeweils welchen Container: (a) Schutz aller `.bak`-Dateien, (b) Beschränkung eines Proxy-Pfades `/api/`, (c) Zugriffsregel für das Verzeichnis `/srv/intern`?

**Aufgabe 3 (leicht).** Was bedeuten bei Nginx die Begriffe „einfache Direktive“, „Blockdirektive“ und „Kontext“? Nennen Sie die Kontexte von außen nach innen, in denen die Direktive `location` stehen darf, und erklären Sie, was passiert, wenn man `server_name` außerhalb eines `server`-Blocks schreibt.

**Aufgabe 4 (mittel).** Ein Verzeichnis `/var/www/app/` enthält eine `.htaccess` mit der Zeile `Header set X-Test "1"`. Der Server liefert für alle Dateien darin den Statuscode 500. Im Errorlog steht `.htaccess: Header not allowed here`. Nennen Sie zwei Ursachen und für jede die Lösung. Welche Lösung bevorzugen Sie, wenn Sie Zugriff auf die Serverkonfiguration haben, und warum?

**Aufgabe 5 (mittel).** Gegeben ist die Nginx-Konfiguration unten. Welchen Block treffen die Anfragen (a) `/`, (b) `/seite`, (c) `/bild/logo.png`, (d) `/bild/notiz.txt`, (e) `/doku/handbuch.txt`? Begründen Sie jede Antwort mit der passenden Regel des Auswahlalgorithmus.

```nginx
server {
    location = /            { return 200 "A\n"; }
    location /              { return 200 "B\n"; }
    location /bild/         { return 200 "C\n"; }
    location ~* \.txt$      { return 200 "D\n"; }
    location ^~ /doku/      { return 200 "E\n"; }
}
```

**Aufgabe 6 (praktisch).** Schreiben Sie für Apache einen Standard-Host und zwei echte Virtual Hosts (`a.example` und `b.example`) auf Port 8080. Der Standard-Host soll jeden Zugriff mit 403 ablehnen. Prüfen Sie die Konfiguration, starten Sie eine Testinstanz und weisen Sie mit `curl -H "Host: ..."` nach, dass `a.example` und `b.example` mit 200 antworten und `fremd.example` mit 403.

**Aufgabe 7 (praktisch).** Schreiben Sie ein Bash-Skript `nginx-laden.sh`, das (1) die Konfiguration mit `nginx -t` prüft, (2) bei einem Fehler mit einer klaren Meldung und Exit-Status 1 abbricht, (3) bei Erfolg die Konfiguration in ein Verzeichnis `/var/backups/nginx` sichert (mit Zeitstempel) und (4) erst danach neu lädt. Das Skript soll den Pfad zur Konfigurationsdatei als Parameter nehmen.

**Aufgabe 8 (praktisch).** Erstellen Sie eine Nginx-Konfiguration mit einem Standardserver, der die Verbindung ohne Antwort schließt, und drei Servern: `shop.example` (liefert den Text `shop`), ein Server für alle Subdomains von `kunden.example`, der den Namen der Subdomain in der Antwort wiedergibt (`kunde=abc` für `abc.kunden.example`), und `www.example.*`. Prüfen Sie jeden Fall mit `curl`.

**Aufgabe 9 (schwer).** Ein Kollege setzt in Nginx im `http`-Block drei Sicherheits-Header per `add_header`. Nach dem Hinzufügen von `add_header Cache-Control "no-store";` im Block `location /api/` fehlen die Sicherheits-Header bei allen Antworten unter `/api/`. Erklären Sie die Ursache, belegen Sie sie mit einem Versuch (Konfiguration und `curl -i`) und entwerfen Sie eine wartbare Lösung. Beurteilen Sie anschließend Ihre Lösung: Welches Risiko bleibt, und wie lässt es sich mit einem Review abfangen?

## Lösungen und Erklärungen

### Lösung zu Aufgabe 1.

Auf `Host: forum.example` antwortet der *erste* Block der Konfiguration, hier also `shop.example`, weil kein Name passt. Dasselbe gilt für eine Anfrage ohne `Host`-Header (HTTP/1.0). Das Risiko: Wer die IP-Adresse oder einen falsch zeigenden DNS-Namen aufruft, bekommt die Shop-Website zu sehen, obwohl er sie nicht gemeint hat; bei einem versehentlich offenen Intern-Host wäre das ein Datenabfluss. Die Abhilfe ist ein ausdrücklicher Standard-Host als *erster* Block, der mit `Require all denied` jeden Zugriff verweigert (siehe Einheit 3.4).

### Lösung zu Aufgabe 2.

`Directory` bezieht sich auf einen Ort im Dateisystem, `Files` auf Dateinamen, `Location` auf den URL-Pfad. (a) `<FilesMatch "\.bak$">` mit `Require all denied`, weil es um Dateien auf der Platte geht, egal unter welcher URL. (b) `<Location "/api/">`, denn ein Proxy-Pfad ist keine Datei, sondern existiert nur im URL-Raum. (c) `<Directory "/srv/intern">`, weil es ein Verzeichnis ist und die Regel unabhängig von Aliasen gelten soll.

### Lösung zu Aufgabe 3.

Eine einfache Direktive besteht aus Namen und Parametern, endet mit einem Semikolon (`worker_processes 2;`). Eine Blockdirektive enthält in geschweiften Klammern weitere Direktiven (`server { ... }`). Ein Kontext ist ein solcher Block, der Direktiven aufnimmt; die oberste Ebene heißt `main`. `location` steht von außen nach innen in `main`, `http`, `server` und darf in einem `location` wiederum verschachtelt werden. Schreibt man `server_name` außerhalb von `server`, bricht der Test ab mit `"server_name" directive is not allowed here` unter Angabe von Datei und Zeile, und Nginx startet nicht.

### Lösung zu Aufgabe 4.

Die Meldung besagt, dass die Direktive `Header` in dieser Umgebung nicht erlaubt ist. Ursache 1: Der umgebende `Directory`-Block erlaubt nicht die passende Kategorie, etwa weil dort `AllowOverride AuthConfig` steht. `Header` gehört zur Kategorie `FileInfo`; die Lösung ist `AllowOverride FileInfo` oder enger `AllowOverrideList Header`. Ursache 2: Für den Pfad ist gar keine `AllowOverride`-Angabe wirksam. In der Testumgebung führte auch das zu einem 500; die Lösung ist, die Angabe ausdrücklich zu setzen. Mit Zugriff auf die Serverkonfiguration bevorzugt man jedoch einen dritten Weg, der beide Ursachen beseitigt: die Zeile `Header set X-Test "1"` in den `Directory`-Block für `/var/www/app/` verschieben, die `.htaccess` löschen und `AllowOverride None` setzen. Das spart die Dateizugriffe bei jeder Anfrage, und es gibt nur noch einen Ort für Regeln (vgl. Einheit 3.6).

### Lösung zu Aufgabe 5.

\(a\) `/` trifft `A`: die exakte Übereinstimmung mit `=` beendet die Suche sofort. (b) `/seite` trifft `B`: Es gibt nur den Präfix `/`, und kein regulärer Ausdruck passt. (c) `/bild/logo.png` trifft `C`: der längste Präfix ist `/bild/`, und der Ausdruck `\.txt$` passt nicht. (d) `/bild/notiz.txt` trifft `D`: Der Präfix `/bild/` wird nur gemerkt, danach werden Ausdrücke geprüft, und `D` passt, also gewinnt der Ausdruck. (e) `/doku/handbuch.txt` trifft `E`: Der längste Präfix `/doku/` trägt `^~`, daher wird nicht mehr nach Ausdrücken gesucht, obwohl `D` passen würde.

### Lösung zu Aufgabe 6.

Die Konfiguration (in der Testumgebung mit Apache 2.4.58 geprüft):

```apache
Listen 8080
<VirtualHost *:8080>
    ServerName default.invalid
    DocumentRoot "/tmp/aufg6/leer"
    <Directory "/tmp/aufg6/leer">
        Require all denied
    </Directory>
</VirtualHost>
<VirtualHost *:8080>
    ServerName a.example
    DocumentRoot "/tmp/aufg6/a"
    <Directory "/tmp/aufg6/a">
        Require all granted
    </Directory>
</VirtualHost>
<VirtualHost *:8080>
    ServerName b.example
    DocumentRoot "/tmp/aufg6/b"
    <Directory "/tmp/aufg6/b">
        Require all granted
    </Directory>
</VirtualHost>
```

Diese Blöcke gehören in eine vollständige Konfiguration mit `ServerRoot`, `PidFile`, den nötigen Modulen (`mpm_event`, `authz_core`, `dir`, `mime`, `log_config`, `unixd`) und eigenen Logpfaden, wie in der Lösung zu Aufgabe 7 in Modul 2. Der Ablauf: Verzeichnisse mit je einer `index.html` anlegen, `apache2 -f /pfad/httpd.conf -t` muss `Syntax OK` melden, dann starten und prüfen: `curl -s -o /dev/null -w "%{http_code}\n" -H "Host: a.example" http://127.0.0.1:8080/` liefert 200, ebenso für `b.example`, und `fremd.example` liefert 403, weil der erste Block der Standard ist. Zusätzlich zeigt `apache2 -f ... -S` die Zuordnung, und der Standard-Host ist dort als `default server` markiert.

### Lösung zu Aufgabe 7.

Eine mögliche Lösung:

```bash
#!/bin/bash
# nginx-laden.sh -- prüfen, sichern, neu laden
set -eu
CONF="${1:?Aufruf: $0 /pfad/zur/nginx.conf}"
ZIEL="${BACKUP_DIR:-/var/backups/nginx}"

if ! nginx -t -q -c "$CONF"; then
    echo "Test fehlgeschlagen - nichts verändert." >&2
    exit 1
fi
mkdir -p "$ZIEL"
tar czf "$ZIEL/nginx-$(date +%Y%m%d-%H%M%S).tar.gz" \
    -C "$(dirname "$CONF")" .
nginx -s reload
echo "Konfiguration gesichert und neu geladen."
```

Entscheidend ist die Reihenfolge: Mit `set -eu` bricht das Skript bei unbelegten Variablen ab; `if ! nginx -t` fängt den Testfehler ab, bevor etwas geschieht, und gibt Status 1 zurück. Gesichert wird erst nach bestandenem Test, damit das Archiv einen gültigen Stand enthält. Das Neuladen kommt zuletzt. Hinweis: Der Parameter `-c` kann beim Neuladen nicht an `-s reload` übergeben werden; `reload` wirkt auf den laufenden Master-Prozess und damit auf dessen Konfigurationsdatei. Das Skript setzt voraus, dass `CONF` die vom laufenden Dienst verwendete Datei ist. Das Skript wurde in dieser Form nicht auf einem Produktivsystem ausgeführt; die Befehle `nginx -t -q` und `-c` entsprechen den getesteten Aufrufen.

### Lösung zu Aufgabe 8.

Die Konfiguration:

```nginx
events {}
http {
    server {
        listen 8090 default_server;
        server_name _;
        return 444;
    }
    server {
        listen 8090;
        server_name shop.example;
        return 200 "shop\n";
    }
    server {
        listen 8090;
        server_name ~^(?<sub>[a-z0-9]+)\.kunden\.example$;
        return 200 "kunde=$sub\n";
    }
    server {
        listen 8090;
        server_name www.example.*;
        return 200 "wildcard-hinten\n";
    }
}
```

Die Prüfung: `curl -H "Host: shop.example" http://127.0.0.1:8090/` liefert `shop`; `abc.kunden.example` liefert `kunde=abc`; `www.example.net` liefert `wildcard-hinten`; ein anderer Name wie `x.test` endet mit „Empty reply from server“. Der reguläre Ausdruck verwendet eine benannte Gruppe, deren Ergebnis die Variable `$sub` füllt; die Anker `^` und `$` verhindern, dass auch `x.abc.kunden.example.evil` passt. Ein Platzhalter wie `*.kunden.example` wäre ebenfalls möglich, liefert aber die Variable nicht. Als Prüfung der Konfiguration genügt `nginx -t -c /pfad/zur/datei`.

### Lösung zu Aufgabe 9.

Ursache: `add_header` gehört zu den Direktiven, die nur dann von der äußeren Ebene geerbt werden, wenn die innere Ebene keine eigene `add_header`-Direktive hat. Sobald `location /api/` eine setzt, gelten die äußeren dort nicht mehr. Der Versuch (in der Testumgebung bestätigt):

```nginx
http {
    add_header X-Content-Type-Options "nosniff";
    server {
        listen 8091;
        location /       { return 200 "ok\n"; }
        location /api/   {
            add_header Cache-Control "no-store";
            return 200 "api\n";
        }
    }
}
```

Mit `curl -i http://127.0.0.1:8091/` erscheint `X-Content-Type-Options`, mit `curl -i http://127.0.0.1:8091/api/` nur `Cache-Control`. Eine wartbare Lösung bündelt die gemeinsamen Header in einer Datei `snippets/sicherheits-header.conf` und bindet sie in jedem Block ein, der eigene Header setzt:

```nginx
# snippets/sicherheits-header.conf
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;

# im location-Block
location /api/ {
    include snippets/sicherheits-header.conf;
    add_header Cache-Control "no-store" always;
    return 200 "api\n";
}
```

Das Restrisiko: Man kann das `include` in einem neuen Block vergessen, und der Test meldet nichts. Im Review hilft eine feste Prüfregel, nämlich bei jedem `add_header` in einem `location`- oder `server`-Block zu fragen, ob die Sicherheits-Header mit eingebunden sind. Zusätzlich lässt sich dies automatisch prüfen: ein kleines Skript, das nach der Auslieferung mit `curl -sI` auf wichtigen Pfaden die erwarteten Header abfragt und bei einem fehlenden Header fehlschlägt. Das Schlüsselwort `always` sorgt dafür, dass die Header auch bei Fehlerantworten (z. B. 404 oder 500) gesendet werden.
