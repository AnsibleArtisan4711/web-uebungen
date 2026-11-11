# Modul 05 - Statische Inhalte, MIME, Compression und Caching

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Listings unverändert, farbige Boxen als Zitatblöcke mit fettem Titel, Tabellen als Markdown-Tabellen, Übungsaufgaben und Lösungen als Absätze bzw. Überschriften). Die Lerneinheiten sind wie in der Quelle nach Modul nummeriert (5.1 bis 5.8), danach folgen „Übungsaufgaben“ (10) und „Lösungen und Erklärungen“. **Die Konfigurationen und Befehle wurden für dieses Repository nicht ausgeführt:** Laut Einleitung hat der Autor die Beispiele in einer Linux-Umgebung (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0) ausgeführt; nicht getestet sind laut Skript Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt. Viele Beispiele ändern Server-Konfiguration, Zertifikate, Rechte oder Dienste: nur in einer Testumgebung ausprobieren. Übersicht zum Modul: [README](README.md).

**Geplante Dauer:** 9 h | **Priorität:** 1 | **Lerneinheiten:** 8

## Lerneinheiten laut Lehrplan

| **Nr.** | **Lerneinheit**      | **Dauer (h)** | **Prio** |
|--------:|:---------------------|--------------:|---------:|
|     5.1 | root und alias       |             1 |        1 |
|     5.2 | index Direktive      |             1 |        1 |
|     5.3 | try_files            |           1,5 |        1 |
|     5.4 | MIME Types           |             1 |        1 |
|     5.5 | gzip Compression     |             1 |        1 |
|     5.6 | Brotli Abgrenzung    |           1,5 |        2 |
|     5.7 | Cache-Control Header |             1 |        2 |
|     5.8 | Static Asset Review  |             1 |        2 |
|         | **Summe**            |         **9** |          |

## Überblick und Lernweg

Die meisten Anfragen an einen Webserver betreffen keine dynamischen Seiten, sondern *statische Dateien*: HTML, Stylesheets, Skripte, Bilder, Schriften. Sie sind der Teil, den ein Webserver am besten kann, und der Teil, an dem sich mit wenig Konfiguration am meisten gewinnen lässt. Dieses Modul beantwortet vier Fragen: Wie findet der Server die Datei zur Anfrage (`root`, `alias`, `index`, `try_files`)? Welchen Inhaltstyp meldet er dem Browser (MIME-Typen)? Wie klein bekommt man die Übertragung (gzip und Brotli)? Und wie lange darf der Browser die Datei behalten, ohne neu zu fragen (`Cache-Control`)?

Die Einheiten 5.1 bis 5.3 behandeln die Dateiauswahl; hier tragen beide Server ihre eigenen Begriffe, und die Einheiten zeigen die Nginx-Direktiven (`root`, `alias`, `index`, `try_files`) und stellen die Apache-Entsprechungen (`DocumentRoot`, `Alias`, `DirectoryIndex`, `FallbackResource` und `mod_rewrite`) daneben. Die Einheiten 5.4 bis 5.7 behandeln MIME, Kompression und Caching für beide Server. Einheit 5.8 fasst alles in einem Prüfverfahren für statische Auslieferung zusammen. Die Grundlagen von `DocumentRoot` und Dateirechten stehen in Modul 2, der Kontext von `location` in Modul 3; hier werden sie nur angewendet.

> **Merke**
>
> Beispiele mit Nginx wurden mit Version 1.24.0, Beispiele mit Apache mit 2.4.58 ausgeführt. Alle Zahlen zu Dateigrößen (zum Beispiel 10 000 Byte auf 89 Byte) stammen aus echten Testläufen mit einer absichtlich gut komprimierbaren Datei und sind keine Aussage über typische Einsparungen.

## 5.1 root und alias

Wenn eine Anfrage eintrifft, muss der Server aus der URL einen Dateipfad bilden. Bei Nginx gibt es dafür zwei Direktiven, die ähnlich aussehen und sich doch grundverschieden verhalten. Mit `root` *hängt* Nginx den kompletten URL-Pfad an das angegebene Verzeichnis an: Bei `root /srv/www;` wird aus `/img/logo.png` die Datei `/srv/www/img/logo.png`. Mit `alias` *ersetzt* Nginx dagegen den Teil der URL, der dem `location`-Muster entspricht, durch den angegebenen Pfad: Bei `location /bilder/ { alias /srv/medien/; }` wird aus `/bilder/a.txt` die Datei `/srv/medien/a.txt`.

Der Unterschied ist einfach zu merken: `root` fügt *hinzu*, `alias` *tauscht aus*. In der Praxis verwendet man `root` fast immer im `server`-Block, damit alle Pfade eine gemeinsame Basis haben, und `alias` nur dort, wo ein URL-Pfad auf einen *anderen* Ort außerhalb dieser Basis zeigen soll. Die Testumgebung zeigt den Unterschied mit einer Konfiguration, die auf dieselbe Datei `/tmp/m5/other/a.txt` zielt, einmal richtig und einmal falsch:

```nginx
server {
    listen 8051;
    root /tmp/m5/www;                       # Basis für alles

    location /bilder/ { alias /tmp/m5/other/; }   # tauscht aus
    location /falsch/ { root  /tmp/m5/other; }    # hängt an
}
```

Die Abfrage `/bilder/a.txt` lieferte den Inhalt von `/tmp/m5/other/a.txt` (Status 200). Die Abfrage `/falsch/a.txt` lieferte 404, und das Fehlerlog nennt den Grund: `open() "/tmp/m5/other/falsch/a.txt" failed (2: No such file or directory)`. Nginx hat die Datei dort gesucht, wo `root` sie hinterlässt: `/tmp/m5/other` plus der volle Pfad `/falsch/a.txt`. Diese Fehlermeldung ist die wichtigste Diagnose bei statischen Dateien, weil sie den *tatsächlich berechneten Pfad* zeigt. Wer ratlos vor einem 404 steht, liest zuerst das Fehlerlog und vergleicht den Pfad mit der Erwartung.

Bei `alias` gibt es eine berüchtigte Falle mit dem abschließenden Schrägstrich. Die Regel lautet: Endet das `location`-Muster mit einem Schrägstrich, muss auch der `alias`-Pfad damit enden. Der Test zeigt, was bei Verstoß geschieht: Mit `location /a2 { alias /tmp/m5/other/; }` (Muster ohne, Alias mit Schrägstrich) lieferte `/a2/a.txt` die Datei wie erwartet, aber auch `/a2a.txt` lieferte die Datei `a.txt` (Status 200): Das Präfix `/a2` wurde abgeschnitten und der Rest `a.txt` an den Alias-Pfad gehängt. Dieselbe Bauart mit Pfad-Traversierung („off-by-slash“) ist ein bekannter Konfigurationsfehler, der in schlimmeren Konstellationen Dateien außerhalb des beabsichtigten Verzeichnisses preisgibt.

Apache löst dieselbe Aufgabe mit `DocumentRoot` (Basis) und `Alias` (anderer Ort). Der Unterschied: Bei Apache gehört zu jedem Ziel außerhalb des `DocumentRoot` ein eigener `Directory`-Block mit `Require`, weil Apache Verzeichnisse standardmäßig sperrt (Einheit 3.5). Die Alias-Regeln der Testumgebung:

```apache
Alias "/bilder/" "/tmp/m5/other/"
Alias "/a2"      "/tmp/m5/other"

<Directory "/tmp/m5/other">
    Require all granted
</Directory>
```

Hier lieferten `/bilder/a.txt` und `/a2/a.txt` die Datei, `/a2a.txt` dagegen 404. Apache gleicht Pfade segmentweise ab (`/a2` gilt für `/a2` und `/a2/...`, nicht für `/a2a.txt`); man sollte Schrägstriche in Muster und Ziel dennoch gleich behandeln, um sich nicht auf dieses Detail zu verlassen. Besonders wichtig ist das `Directory`: Ohne den Block verweigert Apache den Zugriff auf `/tmp/m5/other`, weil die Standardkonfiguration das Wurzelverzeichnis sperrt und nur ausdrücklich erlaubte Bereiche öffnet.

> **Ergänzung aus der Nachrecherche: Symbolische Links und Pfade nach außen**
>
> Beide Server folgen der Struktur des Dateisystems: Ein symbolischer Link im `root`, der auf ein Verzeichnis außerhalb zeigt, öffnet dieses Verzeichnis für den Webserver. Apache regelt das mit `Options FollowSymLinks` (Standardkonfigurationen schalten es ein, `SymLinksIfOwnerMatch` ist enger); Nginx folgt Links standardmäßig und kennt dafür die Direktive `disable_symlinks`. Ob und wie das für Ihr System gilt, steht in der Nginx-Referenz (nicht abgerufen, deshalb weiterführend). Als Faustregel gilt: In einem Webverzeichnis liegen keine Links auf Orte, die der Webserver nicht ausliefern soll.

### Typische Fehler.

Neben dem fehlenden Schrägstrich ist der häufigste Fehler, `root` in jeden `location`-Block zu schreiben. Das ist nicht verboten, aber fehleranfällig, weil man vergisst, den Wert bei einer Verschiebung überall zu ändern. Ein zweiter Fehler ist, `root` statt `alias` zu verwenden, wenn der URL-Pfad nicht im Verzeichnisbaum vorkommt. Ein dritter ist, einen Pfad im `root` anzugeben, auf den der Nginx-Arbeitsprozess keine Rechte hat; dann meldet das Log `Permission denied` und der Client sieht 403.

```nginx
# falsch: root hängt /falsch/ an, die Datei wird nicht gefunden
location /falsch/ { root /srv/medien; }
# richtig: alias ersetzt das Präfix, Schrägstriche an beiden Enden
location /medien/ { alias /srv/medien/; }
```

> **Praxisbeispiel: 404 nach dem Umzug**
>
> Nach einem Wechsel des Dokumentenverzeichnisses sind `root`-Fehler das häufigste Problem. Die Reihenfolge der Fehlersuche ist immer gleich: Fehlerlog lesen (welcher Pfad?), den Pfad im Dateisystem prüfen (`ls -l`), Rechte entlang des Pfades prüfen (`namei -l`, Einheit 2.8) und erst danach an der Konfiguration ändern.

## 5.2 index Direktive

Ruft ein Benutzer eine Adresse auf, die auf ein Verzeichnis endet (`/docs/`), kann der Server das Verzeichnis nicht ausliefern, sondern sucht eine *Startdatei* darin. Bei Nginx legt die Direktive `index` die Dateinamen fest, die in der angegebenen Reihenfolge ausprobiert werden; Voreinstellung ist `index index.html;`. Bei Apache heißt die Entsprechung `DirectoryIndex` (Voreinstellung `index.html`). Gibt es keine der Dateien, antwortet der Server je nach Einstellung mit 403 (kein Zugriff auf die Verzeichnisliste) oder mit einer automatisch erzeugten Verzeichnisliste (`autoindex on` bei Nginx, `Options +Indexes` bei Apache); Letzteres sollte man nur bewusst einschalten.

Mehrere Namen werden von links nach rechts geprüft, der erste vorhandene gewinnt. Das Beispiel stellt für `/docs/` die Datei `index.htm` ein, die der Standardwert nicht kennt; in beiden Servern wurde das geprüft:

```nginx
location /docs/ {
    index index.htm index.html;
}
```

```apache
<Directory "/tmp/m4/htdocs/docs">
    DirectoryIndex index.htm index.html
</Directory>
```

Die Abfrage `/docs/` lieferte in beiden Fällen den Inhalt von `index.htm` (Status 200). Die Direktive wirkt *intern*: Die URL bleibt unverändert, der Server liefert lediglich eine andere Datei aus. Ein Browser merkt davon nichts; für ihn ist `/docs/` die Adresse der Seite.

Eine wichtige Eigenschaft von `index` bei Nginx: Der letzte Eintrag darf eine absolute Pfadangabe mit Schrägstrich sein (`index index.html /fallback.php;`); damit wird nicht ein Dateiname gesucht, sondern es erfolgt ein interner Sprung auf diese URL. Das nutzt man bei Anwendungen, die für Verzeichnisse ein PHP-Skript bedienen. Bei Apache gibt es die gleiche Möglichkeit mit einem Schrägstrich vorn (`DirectoryIndex index.html /fehler.php`), und zudem ersetzt `FallbackResource` die Suche nach einer Datei, wenn gar nichts gefunden wurde (Einheit 5.3).

### Typische Fehler.

Ein häufiger Fehler ist, den Dateinamen der Startseite groß zu schreiben (`Index.html`), obwohl auf Linux zwischen Groß- und Kleinschreibung unterschieden wird: Die Datei wird dann nicht gefunden, und der Server meldet 403 (Nginx: `directory index of "..." is forbidden` im Log). Ein zweiter ist, die Verzeichnisliste einzuschalten, um „schnell etwas zu sehen“, und sie in der Produktion zu vergessen. Ein dritter betrifft Anwendungen, die `index.php` erwarten, aber keine Einstellung haben: Der Server liefert dann `index.html` oder gar nichts aus, und die Anwendung läuft nie an.

```nginx
# falsch: Startseite fehlt, Verzeichnisliste verrät den Inhalt
location /daten/ { autoindex on; }
# richtig: Startseite festlegen, keine Liste
location /daten/ {
    index index.html;
    autoindex off;
}
```

> **Praxisbeispiel: Verzeichnisse als Schwachstelle**
>
> Verzeichnislisten sind in Sicherheitsprüfungen ein häufiger Befund: Sie zeigen Sicherungsdateien, Exporte und Testdaten. Das Konfigurationsreview (Einheit 3.8) enthält deshalb eine eigene Prüfung auf `Indexes`. Bei Nginx ist die Liste ohnehin nur aktiv, wenn `autoindex on` gesetzt wurde.

## 5.3 try_files

Die Nginx-Direktive `try_files` prüft nacheinander mehrere Dateien oder Verzeichnisse und nimmt die erste, die existiert. Der letzte Parameter ist der *Rückfall* (*Fallback*): eine interne Weiterleitung auf eine URL oder ein Statuscode. Das ist das Standardwerkzeug moderner Anwendungen: Statische Dateien werden direkt ausgeliefert, alles Übrige geht an eine zentrale Anwendung (Frontend-Frameworks mit einer einzigen `index.html`, PHP-Anwendungen mit einem Front-Controller).

Die Syntax lautet `try_files Datei1 Datei2 ... Rückfall;`. Dateien werden aus `root` bzw. `alias` aufgelöst; `$uri` steht für den Pfad der Anfrage, `$uri/` prüft ein Verzeichnis. Das folgende Beispiel zeigt drei typische Muster, die in der Testumgebung geprüft wurden:

```nginx
server {
    listen 8051;
    root /tmp/m5/www;

    # 1. Single-Page-App: Datei, Verzeichnis, sonst index.html
    location /app/ { try_files $uri $uri/ /index.html; }
    # 2. Rückfall auf eine feste Datei
    location /fb/ { try_files $uri /fallback.txt; }
    # 3. Klares 404 statt Rückfall
    location /tf404/ { try_files $uri =404; }
    location = /fallback.txt { return 200 "FALLBACK\n"; }
}
```

Die Ergebnisse: `/app/` lieferte die Startseite des Verzeichnisses `app` (`$uri/` traf zu), `/app/nix` lieferte `INDEX-ROOT`, also die Datei `/index.html` aus dem Wurzelverzeichnis, weil weder Datei noch Verzeichnis existierten. `/fb/nix` lieferte `FALLBACK`, und `/tf404/nix` lieferte 404. Das Beispiel `/app/nix` ist eine wichtige Beobachtung: Der Rückfall ist ein *interner Sprung*; die Adresszeile im Browser bleibt, und der Statuscode ist 200, nicht 404. Das ist bei Single-Page-Anwendungen gewollt (die Routen gibt es nur im Browser), führt bei normalen Websites aber dazu, dass „nicht vorhandene“ Seiten mit Status 200 antworten, was Suchmaschinen verwirrt.

Der Rückfall mit `=404` dagegen sagt: Wenn nichts passt, ist die Seite nicht vorhanden. Auch ein dritter Parameter im Stil `=403` ist möglich. In der Praxis nutzt man zwei Formen: `try_files $uri =404;` für reine statische Bereiche und `try_files $uri $uri/ /index.php?$query_string;` für PHP-Frameworks, bei denen alles Unbekannte beim Front-Controller landet. Die letzte Form hängt die Query ausdrücklich an, weil beim internen Sprung die ursprüngliche Query sonst verloren geht.

Apache hat kein `try_files`, aber zwei Mittel mit derselben Wirkung. Das einfache ist `FallbackResource /index.html` (Apache 2.4.5 und neuer, Modul `mod_dir`), das jede Anfrage, die auf keine Datei trifft, an die angegebene URL weiterreicht. Das flexible ist `mod_rewrite` mit zwei Bedingungen, die prüfen, dass weder eine Datei noch ein Verzeichnis existiert. Die Testumgebung prüfte die zweite Form:

```apache
LoadModule rewrite_module modules/mod_rewrite.so
<Directory "/tmp/m4/htdocs/app">
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ /index.html [L]
</Directory>
```

Die erste Bedingung `!-f` trifft zu, wenn keine *Datei* dieses Namens existiert, die zweite `!-d`, wenn kein *Verzeichnis* existiert; beide müssen zutreffen, damit die Regel greift. Die Abfrage `/app/nix` lieferte in der Testumgebung die Datei `index.html` aus dem Wurzelverzeichnis (Status 200).

> **Ergänzung aus der Nachrecherche: FallbackResource als kürzere Alternative**
>
> Seit Apache 2.4.5 gibt es für das häufigste Muster eine einzelne Direktive, `FallbackResource /index.php`, die dasselbe tut wie die zwei Bedingungen und die Regel oben. Sie ist verständlicher und schneller als `mod_rewrite`, aber weniger flexibel: Man kann keine Sonderfälle ausnehmen. Die Angabe zur Version stammt aus dem Wissensstand des Autors; die Seite der Dokumentation zu `mod_dir` wurde in dieser Arbeit nicht abgerufen und steht unter „weiterführend“.

### Typische Fehler.

Der gefährlichste Fehler bei `try_files` ist ein Rückfall auf eine Anwendung, ohne zu prüfen, was sie mit unbekannten Pfaden tut. Ein zweiter ist, `try_files` mit `if (!-f $request_filename)` zu ersetzen; die Nginx-Dokumentation rät von solchen `if`-Konstrukten ausdrücklich ab, weil sie sich in vielen Fällen unerwartet verhalten. Ein dritter ist ein fehlender Rückfall: `try_files $uri;` ohne letzten Parameter ist ungültig (der Test meldet `invalid number of arguments`).

```nginx
# falsch: if statt try_files, Status und Verhalten unklar
location / {
    if (!-f $request_filename) { rewrite ^ /index.php last; }
}
# richtig: try_files mit klarem Rückfall
location / {
    try_files $uri $uri/ /index.php?$query_string;
}
```

> **Praxisbeispiel: Frontend-Frameworks**
>
> Eine in React oder Angular gebaute Anwendung besteht aus einer `index.html` und Dateien unter `assets/`. Ruft jemand direkt `/kunden/42` auf, gibt es diese Datei nicht; mit `try_files $uri /index.html;` (Nginx) oder `FallbackResource /index.html` (Apache) lädt der Server die Startdatei, und die Anwendung im Browser wertet die Adresse selbst aus.

## 5.4 MIME Types

*MIME-Typen* (heute offiziell *Medientypen*) sagen dem Browser, was er bekommt: `text/html` wird als Seite dargestellt, `text/css` als Stylesheet angewendet, `image/png` als Bild gezeigt, `application/octet-stream` als unbekannte Daten zum Herunterladen angeboten. Der Server meldet den Typ im Antwortkopf `Content-Type`; er ermittelt ihn *nicht* aus dem Inhalt, sondern aus der *Dateiendung*, mithilfe einer Zuordnungstabelle. Ein falscher Typ hat harte Folgen: Browser führen Skripte mit falschem Typ nicht aus, wenden Stylesheets nicht an oder zeigen Seiten als Text an.

Bei Nginx liefert die Datei `mime.types` die Tabelle, und `include mime.types;` im `http`-Block lädt sie. Fehlt die Zeile, antwortet Nginx für alles mit dem `default_type` (voreingestellt `text/plain`). Mit `default_type application/octet-stream;` legt man fest, was für unbekannte Endungen gilt. Bei Apache übernimmt `mod_mime` die Aufgabe, die Tabelle wird mit `TypesConfig` geladen (meist `/etc/mime.types` unter Debian), und eigene Zuordnungen setzt man mit `AddType`. Die Testumgebung ergab:

| **Datei** | **Nginx (1.24.0)** | **Apache (2.4.58)** |
|:----------|:-------------------|:--------------------|
| `s.css` | `text/css`          | `text/css`           |
| `x.wasm` | `application/wasm`          | (nicht geprüft)     |
| `big.json` | `application/json`          | (nicht geprüft)     |
| `data.xyz` | `application/octet-stream`          | `chemical/x-xyz`           |

Die letzte Zeile zeigt eine Eigenheit: Dieselbe Endung `.xyz` wird von den beiden Servern verschieden behandelt, weil sie unterschiedliche Tabellen verwenden. Apache unter Debian liest die große Systemtabelle `/etc/mime.types`, die auch seltene Endungen kennt; die Tabelle von Nginx ist kürzer und kennt `.xyz` nicht. Aus diesem Grund prüft man bei neuen Dateitypen (Schriften, `.wasm`, `.webmanifest`, `.mjs`) immer den ausgelieferten `Content-Type` mit `curl -I`. Eigene Einträge ergänzt man so:

```nginx
http {
    include mime.types;
    default_type application/octet-stream;

    types {
        application/manifest+json  webmanifest;
        text/javascript            mjs;
    }
}
```

```apache
TypesConfig "/etc/mime.types"
AddType application/manifest+json .webmanifest
AddType text/javascript .mjs
```

Ein Detail bei Nginx, das in der Testumgebung geprüft wurde: Steht ein `types`-Block im *selben* Kontext wie `include mime.types`, ergänzt er die Tabelle (`.webmanifest` wurde erkannt, `.css` blieb `text/css`). Steht er dagegen in einem *inneren* Kontext, zum Beispiel einem `location`, *ersetzt* er die geerbte Tabelle dort vollständig: Im Test lieferte `/w/a.webmanifest` den neuen Typ, aber `/w/s.css` nur noch `text/plain`, während `/s.css` außerhalb des Blocks weiter `text/css` hatte. Bei Apache fügt `AddType` dagegen immer hinzu.

Ein Zusammenhang, der oft übersehen wird, ist der Zeichensatz. Textdateien sollten mit dem Zeichensatz ausgeliefert werden, in dem sie gespeichert sind. Nginx hängt ihn mit `charset utf-8;` an (der Wert gilt für Typen aus `charset_types`), Apache mit `AddDefaultCharset utf-8`. Fehlt die Angabe, rät der Browser, und Umlaute erscheinen als Zeichensalat.

### Typische Fehler.

Der häufigste Fehler ist ein fehlendes `include mime.types`: Alle Dateien werden als `text/plain` oder `application/octet-stream` gesendet, der Browser zeigt CSS und JavaScript als Text oder bietet Downloads an. Ein zweiter ist, `AddType` zu verwenden, um Dateien ausführbar zu machen (`AddType application/x-httpd-php .php`), ein veralteter Stil, der Einladung zu Fehlern ist (Einheit 4.7). Der dritte ist, einen falschen Typ durch eine Browsererweiterung oder `X-Content-Type-Options: nosniff` aufzudecken: Mit `nosniff` weigert sich der Browser, Typen zu erraten, und falsche Typen werden zu sichtbaren Fehlern.

```nginx
# falsch: Tabelle fehlt, alles bekommt den Standardtyp
http {
    default_type text/plain;
    server { listen 80; root /srv/www; }
}
# richtig: Tabelle laden, sichere Voreinstellung für Unbekanntes
http {
    include mime.types;
    default_type application/octet-stream;
    server { listen 80; root /srv/www; }
}
```

> **Praxisbeispiel: Neue Dateitypen**
>
> Wenn ein Entwicklerteam eine neue Dateiart einführt (WebAssembly, ES-Module, Web-App-Manifest), erreicht sie die Produktion oft mit falschem Typ, weil der Server sie nicht kennt. Der Test gehört deshalb in die Abnahme: Von jedem Dateityp der Anwendung wird der `Content-Type` abgefragt (Einheit 5.8).

## 5.5 gzip Compression

Textdateien wie HTML, CSS, JavaScript und JSON bestehen aus vielen Wiederholungen und lassen sich stark verkleinern. Der Server kann sie deshalb *komprimiert* ausliefern, der Browser entpackt sie wieder. Das Verfahren heißt *gzip* (nach dem Programm und dem Dateiformat). Die Aushandlung geschieht im Antwortkopf: Der Browser sendet `Accept-Encoding: gzip, br`, der Server antwortet bei Kompression mit `Content-Encoding: gzip` und dem Zusatz `Vary: Accept-Encoding`. Der `Vary`-Header ist wichtig für Zwischenspeicher: Er sagt, dass die Antwort vom Wunsch des Clients abhängt, und verhindert, dass ein Proxy eine komprimierte Antwort an einen Client ausliefert, der sie nicht entpacken kann.

Bei Nginx schaltet man die Kompression mit `gzip on;` ein und stellt sie mit wenigen Direktiven ab. `gzip_types` legt fest, welche Inhaltstypen komprimiert werden (`text/html` ist immer dabei, alles andere muss genannt werden), `gzip_min_length` setzt eine Mindestgröße, unter der sich die Kompression nicht lohnt, `gzip_comp_level` wählt die Stufe von 1 (schnell) bis 9 (stark) und `gzip_vary on` fügt den `Vary`-Header ein. Die geprüfte Konfiguration:

```nginx
http {
    include mime.types;
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 5;
    gzip_types text/css application/json application/javascript image/svg+xml;
}
```

Die Wirkung in der Testumgebung: Die CSS-Datei `big.css` (10 000 Byte, absichtlich redundant) wurde mit `Accept-Encoding: gzip` als `Content-Encoding: gzip` geliefert; die Übertragung betrug nur noch 89 Byte. Die kleine Datei `s.css` (16 Byte) blieb unkomprimiert, weil sie unter `gzip_min_length` liegt. Ein Verzeichnis mit `gzip off;` lieferte seine Datei unkomprimiert. Auffällig ist ein Detail im Header: Die Entitäts-Kennung (`ETag`) der komprimierten Antwort wird bei Nginx zu einem *schwachen* ETag (`W/"..."`), weil die Bytes der Antwort nicht mehr der Datei auf der Platte entsprechen; für gewöhnliches Caching ist das unproblematisch.

Bei Apache übernimmt `mod_deflate` die Aufgabe, mit der Zuordnung über Filter (Einheit 4.7). Die Konfiguration ist kürzer, weil Stufe und Mindestgröße selten angepasst werden:

```apache
LoadModule filter_module  modules/mod_filter.so
LoadModule deflate_module modules/mod_deflate.so
AddOutputFilterByType DEFLATE text/html text/css application/json application/javascript
```

Auch hier sank `big.css` von 10 000 auf 89 Byte, und die Antwort trug `Vary: Accept-Encoding` sowie einen ETag mit Zusatz `-gzip`. Wichtig ist, was man *nicht* komprimiert: Bilder (JPEG, PNG, WebP), Videos, Archive und bereits komprimierte Schriften (WOFF2) sind schon in sich komprimiert; nochmaliges Komprimieren kostet Rechenzeit und spart nichts, im Einzelfall wird die Datei sogar größer. Deshalb nennt man die Typen ausdrücklich, statt alles zu komprimieren.

Eine Sicherheitsfrage gehört dazu: Kompression kann in Verbindung mit TLS und veränderlichen, geheimen Inhalten (etwa Anmelde-Tokens, die in die Seite geschrieben werden) für Seitenkanalangriffe wie *BREACH* genutzt werden. Die Gegenmaßnahme liegt vor allem in der Anwendung (Token pro Antwort verändern), nicht in der Serverkonfiguration; bei statischen Dateien ohne geheime Inhalte spielt das keine Rolle. Die Angabe stammt aus dem Wissensstand des Autors und wurde nicht neu recherchiert.

### Typische Fehler.

Der häufigste Fehler ist, `gzip on;` zu setzen und zu vergessen, dass nur `text/html` komprimiert wird: CSS, JavaScript und JSON bleiben unkomprimiert, bis man `gzip_types` setzt. Ein zweiter ist, die höchste Stufe zu wählen (`gzip_comp_level 9`): Der Gewinn gegenüber Stufe 5 ist klein, die CPU-Kosten sind groß, und bei jeder Anfrage wird neu komprimiert. Ein dritter ist, bereits komprimierte Typen einzuschließen.

```nginx
# falsch: nur HTML wird komprimiert, Bilder werden unnötig bearbeitet
gzip on;
gzip_types image/jpeg image/png;
# richtig: Textformate, sinnvolle Stufe, Mindestgröße
gzip on;
gzip_min_length 1024;
gzip_comp_level 5;
gzip_types text/css application/javascript application/json image/svg+xml;
```

> **Praxisbeispiel: Vorab komprimieren**
>
> Für statische Dateien, die sich selten ändern, kann man die komprimierte Fassung beim Bauen erzeugen und vom Server bereitstellen lassen: Nginx kennt dafür das Modul `ngx_http_gzip_static_module` (`gzip_static on;`, nur wenn beim Kompilieren enthalten; ob das Paket es enthält, zeigt `nginx -V`), Apache nutzt eine Kombination aus `mod_rewrite` und `AddEncoding`. Das spart die Rechenzeit pro Anfrage und erlaubt die höchste Stufe. Dieser Weg wurde hier nicht getestet.

## 5.6 Brotli Abgrenzung

*Brotli* ist ein Kompressionsverfahren, das von Google entwickelt wurde, um Webinhalte kleiner zu übertragen als mit gzip. Es erreicht bei Textdateien meist deutlich bessere Ergebnisse, braucht aber bei hohen Stufen mehr Rechenzeit. Der Browser zeigt seine Unterstützung mit `br` im Header `Accept-Encoding` an. Die Abgrenzung im Lehrplan meint: Wann nimmt man Brotli, wann bleibt man bei gzip, und was unterscheidet die beiden Server in der Unterstützung?

Apache liefert mit `mod_brotli` ein eigenes Modul (ab Version 2.4.26). In der Testumgebung war es verfügbar und wurde so konfiguriert:

```apache
LoadModule filter_module modules/mod_filter.so
LoadModule brotli_module modules/mod_brotli.so
AddOutputFilterByType BROTLI_COMPRESS text/css application/json
BrotliCompressionQuality 5
```

Die Datei `big.css` wurde mit `Accept-Encoding: br, gzip` als `Content-Encoding: br` geliefert und war nur noch 36 Byte groß, gegenüber 89 Byte bei gzip. Dieser Vergleich zeigt eine *künstlich* gut komprimierbare Datei und ist keine Aussage über typische Einsparungen; bei echten Stylesheets rechnet man mit einigen Prozent bis zu einem Fünftel kleineren Dateien (Erfahrungswert, nicht gemessen). Fragt der Browser nur nach `gzip`, tat der Brotli-Filter nichts, die Antwort kam ohne `Content-Encoding`. Wer beide Verfahren anbieten will, setzt in Apache beide Filter und lässt den Server entsprechend der Header wählen; die Reihenfolge und Kombination steht in der Dokumentation von `mod_brotli`, die nicht abgerufen wurde.

Bei Nginx gehört Brotli *nicht* zum Umfang des Kerns. Die Prüfung der Testumgebung (`nginx -V`) zeigte kein Brotli-Modul. Es existiert ein quelloffenes Zusatzmodul (`ngx_brotli`), das man selbst einbinden oder aus einer Distribution beziehen muss. In der Praxis heißt das: Für Nginx ist gzip der *Standardweg*, Brotli ein zusätzlicher, nachzurüstender Baustein; wer ihn nutzt, muss das Modul bei Updates mitpflegen.

Entscheidungshilfe: Brotli lohnt sich vor allem bei statischen Dateien, die einmal *vorab* auf hoher Stufe komprimiert und dann beliebig oft ausgeliefert werden. Bei dynamisch erzeugten Antworten kostet hohe Stufe CPU-Zeit pro Anfrage; dort nimmt man niedrige Stufen (etwa 4 bis 5). Brotli wird von Browsern nach allgemeinem Wissensstand nur über HTTPS angeboten; für reine HTTP-Websites ist es ohne Wirkung. Das ist heute selten ein Hindernis, weil produktive Websites HTTPS verwenden (Modul 6).

> **Ergänzung aus der Nachrecherche: Prüfen statt annehmen**
>
> Aussagen zu Browserunterstützung ändern sich; die Seite „Can I use“ und die Angaben der Browserhersteller sind die Quelle der Wahl. Dieses Skript hat sie nicht abgerufen. Für den Betrieb genügt ein einfacher Test: `curl -sI -H "Accept-Encoding: br" https://ihre-seite/stil.css | grep -i content-encoding` zeigt, ob der Server Brotli tatsächlich liefert.

### Typische Fehler.

Ein klassischer Fehler ist, Brotli auf höchster Stufe (11) für dynamische Antworten zu aktivieren: Der Server verbringt mehr Zeit mit Komprimieren als mit Senden. Ein zweiter ist, beide Filter unabgestimmt zu setzen, so dass ein Inhalt doppelt komprimiert wird. Ein dritter: Der `Vary`-Header fehlt in einer Konfiguration, in der ein Zwischenspeicher eingesetzt wird, und Clients ohne Brotli erhalten Brotli-Daten aus dem Cache.

```apache
# falsch: höchste Stufe für dynamische Antworten
BrotliCompressionQuality 11
AddOutputFilterByType BROTLI_COMPRESS text/html
# richtig: mittlere Stufe, gleiche Typen, Vary vom Modul gesetzt
BrotliCompressionQuality 5
AddOutputFilterByType BROTLI_COMPRESS text/html text/css application/javascript
```

> **Praxisbeispiel: Reihenfolge der Entscheidung**
>
> In Projekten fragt man in dieser Reihenfolge: Ist gzip aktiv und richtig konfiguriert (Typen, Mindestgröße, Vary)? Ist die Wirkung gemessen (Bytes vor und nach der Kompression im Browser-Netzwerkfenster)? Erst danach lohnt Brotli, und nur, wenn der Server es ohne großen Pflegeaufwand beherrscht.

## 5.7 Cache-Control Header

Der schnellste Request ist der, der gar nicht gestellt wird. Mit dem Antwortkopf `Cache-Control` sagt der Server dem Browser (und Zwischenspeichern wie Proxys oder CDNs), *wie lange* er eine Antwort behalten darf, ohne neu zu fragen, und *unter welchen Bedingungen*. Ohne diese Angabe raten Browser anhand von Heuristiken, meist aus dem Zeitpunkt der letzten Änderung (`Last-Modified`); das Ergebnis ist unvorhersehbar. Gut gesetzte Header sparen Anfragen, Bandbreite und Wartezeit.

Die wichtigsten Anweisungen sind: `max-age=Sekunden` (so lange gilt die Kopie als frisch), `public` (auch gemeinsame Zwischenspeicher dürfen sie halten), `private` (nur der Browser des Benutzers), `no-cache` (der Browser darf sie speichern, muss aber vor jeder Verwendung beim Server nachfragen), `no-store` (gar nicht speichern; für vertrauliche Inhalte) und `immutable` (der Inhalt ändert sich unter dieser Adresse nie, auch beim Neuladen nicht nachfragen). Der Name `no-cache` führt oft in die Irre: Er verbietet das Speichern *nicht*, sondern verlangt eine Rückfrage.

Eine Rückfrage ist billig, wenn der Server mit 304 (*Not Modified*) antwortet. Der Browser schickt dazu die Kennung der Kopie mit (`If-None-Match: ETag` oder `If-Modified-Since: Datum`), und der Server prüft sie. Die Testumgebung zeigte das: Für `s.css` lieferte Nginx einen `ETag`; ein Aufruf mit `If-None-Match` und diesem Wert ergab Status 304 ohne Inhalt. Beide Server erzeugen `ETag` und `Last-Modified` für statische Dateien selbst; man muss dafür nichts konfigurieren.

Eine praxistaugliche Strategie kombiniert zwei Regeln. Dateien, deren Namen sich bei jeder Änderung ändern (Versionsnummer oder Hash im Namen, etwa `app.4f3a9c.css`), dürfen sehr lange und mit `immutable` zwischengespeichert werden, weil eine neue Fassung eine neue Adresse bekommt. Die HTML-Seiten selbst, die auf diese Dateien verweisen, bekommen `no-cache`, damit der Browser bei jedem Aufruf nachfragt, ob es eine neue Fassung gibt, und die neue Dateiliste sofort sieht. In Nginx lautet die Umsetzung:

```nginx
location /assets/ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
location /html/ {
    add_header Cache-Control "no-cache";
}
```

Der Test enthält eine Überraschung. Für `/assets/app.css` erschienen *zwei* `Cache-Control`-Zeilen: `max-age=2592000` (von `expires`) und `public, immutable` (von `add_header`). Die Direktive `expires` erzeugt nämlich selbst `Expires` und `Cache-Control: max-age`; `add_header` fügt eine weitere Zeile hinzu, statt sie zu ersetzen. Zwei Zeilen sind nach dem HTTP-Standard erlaubt und werden zusammengefasst, aber die Konfiguration ist unübersichtlich. Sauberer ist es, die Zeit direkt in `add_header` zu schreiben (`add_header Cache-Control "public, max-age=2592000, immutable";`) und `expires` wegzulassen; dann entsteht nur eine Zeile und kein `Expires`-Header. Merken Sie sich außerdem die Vererbungsregel aus Einheit 3.9: Ein `add_header` im `location` verdrängt alle `add_header` der äußeren Ebenen.

Bei Apache setzt `mod_expires` die Zeit, `mod_headers` fügt die Zusätze an. Die Testumgebung ergab für dieselbe Aufgabe eine einzelne, zusammengesetzte Zeile:

```apache
LoadModule expires_module modules/mod_expires.so
LoadModule headers_module modules/mod_headers.so
<Location "/assets/">
    ExpiresActive On
    ExpiresDefault "access plus 30 days"
    Header append Cache-Control "public, immutable"
</Location>
```

Die Antwort lautete `Cache-Control: max-age=2592000, public, immutable` plus `Expires`. `Header append` hängt an den vorhandenen Wert an (durch Komma getrennt), anders als `Header set`, das ersetzt. Die Zeitangabe `access plus 30 days` rechnet ab dem Zugriff des Clients; man kann auch `modification` verwenden, was an die letzte Änderung der Datei knüpft.

### Typische Fehler.

Der gravierendste Fehler ist, lange Cachezeiten auf Dateien zu setzen, deren Namen sich nicht ändern: Nach einer Aktualisierung sehen Besucher wochenlang das alte Stylesheet. Ein zweiter ist, `no-cache` mit `no-store` zu verwechseln und zu glauben, vertrauliche Seiten würden nicht gespeichert; dafür braucht es `no-store`. Ein dritter ist die Doppelung aus `expires` und `add_header` sowie die Vererbungsfalle.

```nginx
# falsch: ein Jahr Cache, aber der Dateiname app.css bleibt immer gleich
location /assets/ { expires 1y; }
# richtig: lange Zeit nur für Dateien mit Hash im Namen (app.4f3a9c.css)
location ~* "^/assets/.+\.[0-9a-f]{6,}\.(css|js)$" {
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

> **Praxisbeispiel: Aktualisierung ausrollen**
>
> Bei jedem Release stellt sich dieselbe Frage: Welche Dateien haben neue Namen, welche nicht? Build-Werkzeuge erzeugen Namen mit Hash, und die HTML-Seite verweist auf die neuen Namen. Fehlt das, bleibt als Notlösung nur eine kurze Cachezeit (Minuten bis Stunden) oder eine Revalidierung per `no-cache`, die ETag und 304 nutzt.

## 5.8 Static Asset Review

Ein *Review der statischen Dateien* prüft, ob der Server sie richtig, schnell und sicher ausliefert. Die vorigen Einheiten liefern die Kriterien: Findet er die Dateien (Pfade, Rechte, 404-Verhalten)? Stimmt der `Content-Type`? Werden Textformate komprimiert, Binärformate nicht? Sind `Cache-Control` und `ETag` sinnvoll? Gibt es Verzeichnislisten, Sicherungsdateien oder versteckte Dateien (`.git`, `.env`), die nicht ausgeliefert werden dürfen?

Statt solche Punkte von Hand im Browser zu prüfen, schreibt man ein kleines Prüfskript, das für eine Liste von Pfaden die wichtigsten Antwortdaten ausgibt. Es verwendet `curl` mit `Accept-Encoding`, wie es ein Browser tut, und zeigt Status, Typ, Kodierung und Cache-Header in einer Zeile. Das Skript wurde gegen die Nginx-Testkonfiguration dieses Moduls ausgeführt:

```bash
#!/bin/bash
# asset-check.sh -- prüft Typ, Kompression und Caching statischer Dateien
BASIS="${1:?Aufruf: $0 http://host:port pfad [pfad ...]}"; shift
rc=0
for p in "$@"; do
    kopf=$(curl -s -o /dev/null -D - -H "Accept-Encoding: gzip, br" "$BASIS$p" | tr -d '\r')
    code=$(echo "$kopf" | awk 'NR==1 {print $2}')
    typ=$(echo "$kopf" | awk -F': ' 'tolower($1)=="content-type" {print $2}')
    enc=$(echo "$kopf" | awk -F': ' 'tolower($1)=="content-encoding" {print $2}')
    cc=$(echo "$kopf" | awk -F': ' 'tolower($1)=="cache-control" {print $2}' | paste -sd'|')
    printf '%-18s %s | typ=%s | enc=%s | cache=%s\n' "$p" "$code" "${typ:--}" "${enc:--}" "${cc:--}"
    [ "$code" = "200" ] || rc=1
done
exit $rc
```

Das Skript holt für jeden Pfad nur die Kopfzeilen (`-o /dev/null -D -`), entfernt die Wagenrücklaufzeichen, die HTTP mitbringt, und liest Status und Felder mit `awk`. Der Vergleich der Kopfzeilennamen mit `tolower` berücksichtigt, dass HTTP/2 sie klein schreibt. Mehrere `Cache-Control`-Zeilen werden mit `paste` zu einer Zeile zusammengefasst, damit Doppelungen sichtbar werden. Der Rückgabewert 1 meldet, dass mindestens ein Pfad nicht mit 200 antwortete. Die Ausgabe in der Testumgebung:

```text
/s.css           200 | typ=text/css | enc=- | cache=-
/big.css         200 | typ=text/css | enc=gzip | cache=-
/assets/app.css  200 | typ=text/css | enc=gzip | cache=max-age=2592000|public, immutable
/html/a.html     200 | typ=text/html | enc=- | cache=no-cache
/nix             404 | typ=text/html | enc=- | cache=-
```

Die Lesart: `s.css` ist klein und deshalb unkomprimiert, aber ohne jede Cache-Angabe; `big.css` wird komprimiert, hat aber ebenfalls keinen Cache-Header; `app.css` zeigt die Doppelung (zwei Werte, durch `|` getrennt); `a.html` ist wie gewünscht auf `no-cache` gestellt. Bei `/nix` ist 404 erwartet. So wird aus Eindrücken eine nachvollziehbare Liste von Befunden.

Zum vollständigen Review gehört der Blick auf das, was der Server *nicht* ausliefern darf. Dazu zählen versteckte Dateien (`.git/`, `.env`, `.htpasswd`), Sicherungsdateien (`.bak`, `~`, `.old`) und Entwicklungsreste (`phpinfo.php`, `test.html`). Bei Nginx sperrt man sie mit einem Block, der auf Punktdateien passt, bei Apache mit `FilesMatch` (Einheit 3.1 zeigt die mitgelieferte Regel für `.ht`). Das Beispiel gibt die Nginx-Fassung:

```nginx
# Punktdateien (ausser .well-known für Zertifikatsprüfungen) sperren
location ~ /\.(?!well-known) { deny all; }
# Sicherungs- und Altdateien sperren
location ~* \.(bak|old|orig|swp|sql)$ { deny all; }
```

Der erste Block weist alle Pfade ab, in denen ein Punkt direkt nach einem Schrägstrich steht, mit einer Ausnahme für `.well-known`: Dort liegen Dateien, die Zertifizierungsstellen zur Prüfung abrufen (Modul 6). Das Muster `(?!...)` ist ein negativer Vorgriff und wird von Nginx mit PCRE verstanden. Der zweite Block weist Sicherungsendungen ab. Beide sind reguläre Ausdrücke und daher Teil der Auswahl der `location` (Einheit 3.13): Sie gewinnen gegen allgemeine Präfixe, nicht aber gegen `^~`-Präfixe, was man bei Verzeichnissen mit statischen Inhalten bedenken muss.

### Typische Fehler.

Ein häufiger Fehler ist, nur die Startseite zu prüfen und Unterpfade zu vergessen; Fehler zeigen sich oft bei Schriftdateien (`.woff2`) und Manifesten. Ein zweiter ist, den Test nur mit dem Browser durchzuführen, der gecachte Antworten verwendet und damit Fehler versteckt; `curl` sieht den Server ohne Cache. Ein dritter ist, den Test nur gegen die Entwicklungs-URL zu fahren: Hinter einem Proxy oder CDN ändern sich Header (Kompression, Cache), und die Prüfung muss die Adresse der Besucher nehmen.

```bash
# falsch: nur im Browser geschaut, Cache verfälscht das Bild
# richtig: gleiche Pfade mit curl prüfen, Ausgabe aufbewahren
./asset-check.sh https://www.example.org / /css/site.css /js/app.js \
    /fonts/main.woff2 /manifest.webmanifest | tee review-$(date +%F).txt
```

> **Praxisbeispiel: Abnahme vor dem Livegang**
>
> Ein solches Skript gehört in die Abnahme jeder Website und in die Pipeline (Modul 12): Es meldet, wenn ein Update Dateitypen, Kompression oder Cache-Header verändert hat. Die gesammelten Ausgaben dienen als Beleg dafür, wie der Server zu einem bestimmten Zeitpunkt konfiguriert war.

## Übungsaufgaben

Die Aufgaben steigen im Schwierigkeitsgrad. Die Aufgaben 6 bis 9 sind praktische Aufgaben, die Sie in einer Testumgebung (virtuelle Maschine oder Container, nicht auf einem Produktivsystem) nachbauen sollten. Die Lösungen mit Erklärung folgen im nächsten Abschnitt.

**Aufgabe 1 (leicht).** Gegeben ist bei Nginx `root /srv/www;` im `server`-Block. Welche Datei liefert die Anfrage `/css/site.css`? Und welche Datei liefert sie, wenn im `location /css/` stattdessen `alias /srv/styles/;` steht?

**Aufgabe 2 (leicht).** Nennen Sie die Aufgaben der Header `Content-Type`, `Content-Encoding`, `Vary` und `Cache-Control` in je einem Satz.

**Aufgabe 3 (leicht).** Welche Folgen hat es, wenn bei Nginx die Zeile `include mime.types;` fehlt? Wie zeigt sich das im Browser, und wie prüfen Sie es auf der Kommandozeile?

**Aufgabe 4 (mittel).** Die Konfiguration `location /static { alias /srv/files/; }` liefert auf `/staticx.txt` die Datei `/srv/files/x.txt`. Erklären Sie, warum, welche Gefahr darin liegt und wie Sie es korrigieren.

**Aufgabe 5 (mittel).** Eine Single-Page-Anwendung liegt in `/srv/spa` (mit `index.html` und `assets/`). Besucher, die `/kunden/42` direkt aufrufen, bekommen 404. Schreiben Sie die Nginx-Lösung, ergänzen Sie sie für Apache (einmal mit `FallbackResource`, einmal mit `mod_rewrite`), und erklären Sie, welche Nebenwirkung der Rückfall auf den Statuscode hat.

**Aufgabe 6 (praktisch).** Bauen Sie eine Nginx-Testinstanz auf Port 8051 mit einem Wurzelverzeichnis und einem zweiten Verzeichnis außerhalb, das über `/bilder/` per `alias` erreichbar ist. Provozieren Sie den Fehler mit `root` statt `alias` und lesen Sie den berechneten Pfad aus dem Fehlerlog ab.

**Aufgabe 7 (praktisch).** Konfigurieren Sie Nginx so, dass CSS, JavaScript und JSON komprimiert werden, Dateien unter 1 KB aber nicht. Weisen Sie mit `curl` nach, dass eine große Datei `Content-Encoding: gzip` und `Vary: Accept-Encoding` trägt, eine kleine nicht, und vergleichen Sie die übertragenen Bytes.

**Aufgabe 8 (praktisch).** Richten Sie bei Apache (Testinstanz) für `/assets/` eine Cache-Zeit von 30 Tagen mit `immutable` ein und für `/html/` `no-cache`. Zeigen Sie die Header mit `curl -I` und erklären Sie den Unterschied zwischen `Header set` und `Header append`.

**Aufgabe 9 (praktisch).** Erweitern Sie das Skript `asset-check.sh` aus Einheit 5.8 so, dass es zusätzlich meldet, wenn `Cache-Control` in mehr als einer Zeile vorkommt, wenn `max-age` doppelt vorkommt, und wenn eine komprimierbare Datei (`text/*`, `application/json`, `application/javascript`) größer als 1024 Byte ohne `Content-Encoding` geliefert wird.

**Aufgabe 10 (schwer).** Sie übernehmen eine Website mit folgender Nginx-Konfiguration. Finden Sie mindestens fünf Probleme, erklären Sie jedes und schreiben Sie die korrigierte Fassung.

```nginx
http {
    server {
        listen 80;
        root /var/www/site;
        gzip on;
        gzip_comp_level 9;
        gzip_types image/jpeg image/png text/html;
        location / {
            autoindex on;
            expires 1y;
        }
        location /downloads { alias /srv/downloads/; }
        location /assets/ {
            add_header X-Frame-Options "SAMEORIGIN";
            expires 1y;
            add_header Cache-Control "public";
        }
    }
}
```

## Lösungen und Erklärungen

### Lösung zu Aufgabe 1.

Mit `root` wird der volle Pfad angehängt: `/srv/www/css/site.css`. Mit `alias` im `location /css/` wird der Teil `/css/` durch den Alias-Pfad ersetzt: `/srv/styles/site.css`. Merkhilfe: `root` fügt hinzu, `alias` tauscht aus.

### Lösung zu Aufgabe 2.

`Content-Type` nennt den Medientyp (und gegebenenfalls Zeichensatz) des Inhalts, damit der Browser ihn richtig verarbeitet. `Content-Encoding` gibt an, wie der Inhalt für die Übertragung kodiert ist (etwa `gzip` oder `br`). `Vary` meldet, von welchen Anfrageheadern die Antwort abhängt (hier `Accept-Encoding`), damit Zwischenspeicher die richtige Fassung ausliefern. `Cache-Control` steuert, ob und wie lange Browser und Zwischenspeicher die Antwort wiederverwenden dürfen.

### Lösung zu Aufgabe 3.

Ohne die Zuordnungstabelle liefert Nginx alle Dateien mit dem `default_type` (Voreinstellung `text/plain`). Im Browser erscheinen CSS und JavaScript als Text oder werden nicht angewendet, Seiten werden unformatiert angezeigt, und bei `nosniff` verweigern Browser die Ausführung. Auf der Kommandozeile zeigt `curl -I http://server/stil.css` den Header `Content-Type: text/plain` statt `text/css`. Die Abhilfe ist `include mime.types;` und `default_type application/octet-stream;` im `http`-Block.

### Lösung zu Aufgabe 4.

Das Muster `/static` (ohne Schrägstrich) trifft jeden Pfad, der mit `/static` *beginnt*, auch `/staticx.txt`. Nginx schneidet `/static` ab und hängt den Rest (`x.txt`) an `/srv/files/`. Die Gefahr: Pfade, die niemand vorgesehen hat, werden ausgeliefert, und bei Mustern wie `/static../` können Dateien außerhalb des Verzeichnisses erreichbar werden („off-by-slash“). Die Korrektur: `location /static/ { alias /srv/files/; }`, also gleiche Schrägstriche an beiden Enden. Dieselbe Bauart wurde in der Testumgebung nachgestellt: `/a2a.txt` lieferte die Datei `a.txt`.

### Lösung zu Aufgabe 5.

Nginx:

```nginx
server {
    listen 80;
    root /srv/spa;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Apache mit `FallbackResource`: `<Directory "/srv/spa">` mit `FallbackResource /index.html` (Apache ab 2.4.5; nicht getestet). Apache mit `mod_rewrite` (in der Testumgebung geprüft):

```apache
<Directory "/srv/spa">
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ /index.html [L]
</Directory>
```

Nebenwirkung: Für nicht vorhandene Pfade antwortet der Server mit Status 200 und der Startseite statt mit 404, weil der Rückfall ein interner Sprung ist. Für die Anwendung ist das gewollt (die Routen gibt es nur im Browser), Suchmaschinen und Überwachungen sehen aber „erfolgreiche“ Antworten für beliebige Adressen. Eine Abhilfe ist, für Pfade mit Dateiendung (`.js`, `.png`) ein klares 404 zu liefern und den Rückfall nur für endungslose Pfade zu verwenden.

### Lösung zu Aufgabe 6.

Konfiguration:

```nginx
events {}
http {
    include /etc/nginx/mime.types;
    server {
        listen 8051;
        root /tmp/m5/www;
        location /bilder/ { alias /tmp/m5/other/; }
        location /falsch/ { root /tmp/m5/other; }
    }
}
```

`curl localhost:8051/bilder/a.txt` liefert den Inhalt, `curl localhost:8051/falsch/a.txt` 404. Im Fehlerlog steht `open() "/tmp/m5/other/falsch/a.txt" failed (2: No such file or directory)`: Der Pfad der Anfrage (`/falsch/a.txt`) wurde an das `root` angehängt. Genau diese Zeile ist bei jedem unerwarteten 404 der erste Anhaltspunkt.

### Lösung zu Aufgabe 7.

Konfiguration (in der Testumgebung geprüft):

```nginx
http {
    include mime.types;
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/css application/javascript application/json;
    server { listen 8052; root /tmp/m5/www; }
}
```

Mit `curl -s -D - -o /dev/null -H "Accept-Encoding: gzip" localhost:8052/big.css` erscheinen `Content-Encoding: gzip` und `Vary: Accept-Encoding`; die Übertragung betrug 89 statt 10 000 Byte (`curl -s -H "Accept-Encoding: gzip" ... | wc -c`). Die kleine Datei `s.css` (16 Byte) bleibt wegen `gzip_min_length 1024` unkomprimiert und ohne Kodierungs-Header. Beachten Sie, dass `curl` die Antwort nur dann entpackt, wenn man `--compressed` verwendet; `wc -c` zählt daher die übertragenen Bytes.

### Lösung zu Aufgabe 8.

Konfiguration (geprüft):

```apache
LoadModule expires_module modules/mod_expires.so
LoadModule headers_module modules/mod_headers.so
<Location "/assets/">
    ExpiresActive On
    ExpiresDefault "access plus 30 days"
    Header append Cache-Control "public, immutable"
</Location>
<Location "/html/">
    Header set Cache-Control "no-cache"
</Location>
```

`curl -I localhost:8070/assets/app.css` zeigt `Cache-Control: max-age=2592000, public, immutable` und `Expires`. `Header set` *ersetzt* einen vorhandenen Wert vollständig, `Header append` *hängt* an den vorhandenen Wert an (mit Komma). Hier hat `mod_expires` zuerst `max-age` gesetzt, so dass `append` die Zusätze ergänzt und `set` die Zeit überschrieben hätte.

### Lösung zu Aufgabe 9.

Eine Erweiterung der Schleife aus Einheit 5.8:

```bash
#!/bin/bash
# asset-check2.sh -- wie asset-check.sh, mit zusätzlichen Warnungen
BASIS="${1:?Aufruf: $0 http://host:port pfad [pfad ...]}"; shift
rc=0
for p in "$@"; do
    kopf=$(curl -s -o /dev/null -D - -H "Accept-Encoding: gzip, br" "$BASIS$p" | tr -d '\r')
    code=$(echo "$kopf" | awk 'NR==1 {print $2}')
    typ=$(echo "$kopf" | awk -F': ' 'tolower($1)=="content-type" {print $2}')
    enc=$(echo "$kopf" | awk -F': ' 'tolower($1)=="content-encoding" {print $2}')
    len=$(echo "$kopf" | awk -F': ' 'tolower($1)=="content-length" {print $2}')
    cc=$(echo "$kopf" | awk -F': ' 'tolower($1)=="cache-control" {print $2}')
    n=$(echo "$cc" | grep -c .)
    printf '%-18s %s | typ=%s | enc=%s\n' "$p" "$code" "${typ:--}" "${enc:--}"
    [ "$n" -gt 1 ] && { echo "   WARNUNG: $n Cache-Control-Zeilen"; rc=2; }
    [ "$(echo "$cc" | grep -o 'max-age' | wc -l)" -gt 1 ] && { echo "   WARNUNG: max-age doppelt"; rc=2; }
    case "$typ" in text/*|application/json*|application/javascript*)
        if [ -z "$enc" ] && [ "${len:-0}" -gt 1024 ]; then
            echo "   WARNUNG: komprimierbar, ${len} Byte, unkomprimiert"; rc=2
        fi;;
    esac
    [ "$code" = "200" ] || rc=1
done
exit $rc
```

Neu sind drei Prüfungen. Die Zahl der Zeilen mit `Cache-Control` wird mit `grep -c .` gezählt (die Doppelung von `expires` und `add_header` fällt so auf). Das mehrfache Vorkommen von `max-age` erkennt man mit `grep -o` und `wc -l`. Ob eine Datei komprimierbar und groß, aber unkomprimiert ist, entscheidet der `case`-Block anhand von Typ, `Content-Encoding` und `Content-Length`. Hinweis: Fehlt bei einer Antwort die Länge (etwa bei komprimierter, abschnittsweise gesendeter Ausgabe), zählt die Prüfung sie als 0 und warnt nicht; das ist hier gewollt, weil solche Antworten meist ohnehin kodiert sind.

### Lösung zu Aufgabe 10.

Probleme und Korrekturen: (1) `gzip_comp_level 9` kostet viel CPU bei kleinem Mehrgewinn; Stufe 5 genügt. (2) `gzip_types` nennt `image/jpeg` und `image/png`, die schon komprimiert sind; es fehlen `text/css`, `application/javascript`, `application/json`. (3) Es fehlt `include mime.types;`, alle Dateien bekämen den Standardtyp; der Auszug zeigt außerdem keinen `events`-Block, der in einer vollständigen Datei nötig ist. (4) `autoindex on;` gibt Verzeichnisse preis; ausschalten (`autoindex` ist ohnehin nur sinnvoll in bewusst gewählten Verzeichnissen). (5) `expires 1y` auf `location /` gibt *allen* Dateien, auch den HTML-Seiten, ein Jahr Cache; Besucher sähen alte Seiten. Für HTML gilt `no-cache`, lange Zeiten nur für Dateien mit Hash im Namen. (6) `location /downloads { alias /srv/downloads/; }`: Das Muster hat keinen Schrägstrich, der Alias-Pfad schon (off-by-slash). (7) In `/assets/` steht ein `add_header` für `X-Frame-Options`; durch den zweiten `add_header` und die Vererbung gehen außerdem alle auf höherer Ebene gesetzten Header verloren; zusätzlich erzeugt `expires 1y` plus `add_header Cache-Control "public"` zwei `Cache-Control`-Zeilen. (8) Es fehlt eine Sperre für Punktdateien und Sicherungsdateien. Eine korrigierte Fassung:

```nginx
events {}
http {
    include mime.types;
    default_type application/octet-stream;
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 5;
    gzip_types text/css application/javascript application/json image/svg+xml;
    server {
        listen 80;
        root /var/www/site;
        location ~ /\.(?!well-known) { deny all; }
        location ~* \.(bak|old|orig|swp|sql)$ { deny all; }
        location / {
            add_header Cache-Control "no-cache";
        }
        location /downloads/ { alias /srv/downloads/; }
        location /assets/ {
            add_header Cache-Control "public, max-age=31536000, immutable";
            add_header X-Frame-Options "SAMEORIGIN";
        }
    }
}
```

Die Lösung setzt voraus, dass die Dateien in `/assets/` Hashes im Namen tragen; andernfalls wählt man eine kurze Zeit. Ob die Header-Bündelung (`include` einer gemeinsamen Datei) nötig ist, hängt davon ab, welche globalen Header gelten sollen; sie wurde hier weggelassen, um die Lösung kurz zu halten.
