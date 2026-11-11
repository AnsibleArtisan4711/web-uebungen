# Modul 10 - Security Hardening und Zugriffsschutz

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Listings unverändert, farbige Boxen als Zitatblöcke mit fettem Titel, Tabellen als Markdown-Tabellen, Übungsaufgaben und Lösungen als Absätze bzw. Überschriften). Die Lerneinheiten sind wie in der Quelle nach Modul nummeriert (10.1 bis 10.11), danach folgen „Übungsaufgaben“ (9) und „Lösungen und Erklärungen“. **Die Konfigurationen und Befehle wurden für dieses Repository nicht ausgeführt:** Laut Einleitung hat der Autor die Beispiele in einer Linux-Umgebung (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0) ausgeführt; nicht getestet sind laut Skript Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt. Viele Beispiele ändern Server-Konfiguration, Zertifikate, Rechte oder Dienste: nur in einer Testumgebung ausprobieren. Übersicht zum Modul: [README](README.md).

**Geplante Dauer:** 12 h | **Priorität:** 1 | **Lerneinheiten:** 11

## Lerneinheiten laut Lehrplan

| **Nr.** | **Lerneinheit**                  | **Dauer (h)** | **Prio** |
|--------:|:---------------------------------|--------------:|---------:|
|    10.1 | Least Privilege                  |             1 |        1 |
|    10.2 | ServerTokens und ServerSignature |             1 |        1 |
|    10.3 | Access Control                   |           1,5 |        1 |
|    10.4 | Authentication                   |             1 |        1 |
|    10.5 | Authorization                    |             1 |        1 |
|    10.6 | Security Headers                 |           1,5 |        2 |
|    10.7 | DoS-Mitigations                  |             1 |        2 |
|    10.8 | Patch Management                 |             1 |        2 |
|    10.9 | Rate Limiting                    |             1 |        1 |
|   10.10 | Connection Limiting              |             1 |        1 |
|   10.11 | Upstream TLS                     |             1 |        2 |
|         | **Summe**                        |        **12** |          |

## Überblick und Lernweg

Ein Webserver steht im Internet und beantwortet Anfragen von Fremden. Das ist seine Aufgabe, und es ist zugleich sein Risiko: Jede Anfrage kann ein Angriff sein. *Härtung* (englisch *hardening*) heißt, die Angriffsfläche zu verkleinern und die Folgen eines erfolgreichen Angriffs zu begrenzen. Das Modul behandelt dafür elf Bausteine. Sie lassen sich in vier Fragen ordnen. *Was darf der Prozess?* (Einheit 10.1, Least Privilege.) *Was verrät der Server?* (10.2 und 10.6, Versionsangaben und Sicherheits-Header.) *Wer darf was?* (10.3 bis 10.5, Zugriffskontrolle, Anmeldung und Berechtigung.) *Wie wird Missbrauch begrenzt, und wie bleibt der Server aktuell?* (10.7 bis 10.10, DoS-Schutz, Updates, Ratenbegrenzung und Verbindungslimits.) Dazu kommt als elfte Einheit die Absicherung der Strecke zwischen Proxy und Backend (10.11, Upstream TLS).

Eine Vorbemerkung zur Haltung: Härtung ist kein Zustand, sondern eine Reihe von Schichten. Keine einzelne Maßnahme schützt vollständig, und keine ist überflüssig. Wer die Versionsangabe versteckt, hat keine Lücke geschlossen; er hat dem Angreifer eine Information vorenthalten. Wer ein Ratenlimit setzt, hat Passwort-Raten nicht verhindert, sondern verlangsamt. Gut ist die Kombination: ein Prozess mit minimalen Rechten, aktuelle Software, wenig Angriffsfläche, begrenzter Missbrauch und Protokolle (Modul 9), die zeigen, was dennoch geschieht.

> **Merke**
>
> Die Tests dieses Moduls liefen mit Apache 2.4.58 und Nginx 1.24.0 auf Ubuntu 24.04. Alle Ergebnisse wurden gegen lokale Testserver erzeugt; ein Test gegen fremde Systeme fand nicht statt und ist auch nicht Teil dieses Kurses. Prüfungen und Angriffsversuche gegen Systeme, für die man keine Erlaubnis hat, sind in vielen Ländern strafbar (keine Rechtsberatung).

## 10.1 Least Privilege

Das Prinzip der *geringsten Rechte* (*least privilege*) verlangt, dass jeder Prozess nur die Rechte hat, die er für seine Aufgabe braucht, und keine mehr. Der Gedanke dahinter: Irgendwann wird ein Webprozess kompromittiert, sei es durch einen Fehler im Server, in einem Modul oder in der Anwendung. Dann entscheidet das Rechteprofil des Prozesses darüber, ob der Angreifer nur Seiten lesen oder das ganze System übernehmen kann.

Webserver brauchen zunächst Sonderrechte, weil die Ports 80 und 443 unter Linux nur privilegierten Prozessen offenstehen. Beide Programme lösen das gleich: Ein *Elternprozess* läuft als `root`, öffnet die Ports und startet *Kindprozesse* unter einem unprivilegierten Benutzer, die die Anfragen bearbeiten. Im Test zeigte `ps` bei Apache einen Prozess von `root` und mehrere von `www-data`; bei Nginx einen Master von `root` und einen Arbeiter von `nobody`. Der Unterschied erklärt sich so: Apache bekam die Zeilen `User www-data` und `Group www-data` in der Testkonfiguration, die Nginx-Testkonfiguration enthielt keine `user`-Direktive, so dass der einkompilierte Standard (`nobody`) galt. Die Paketkonfiguration von Ubuntu setzt dagegen in der ersten Zeile von `/etc/nginx/nginx.conf` ausdrücklich `user www-data;`. Die Regel lautet deshalb: Benutzer ausdrücklich nennen, nicht auf Voreinstellungen verlassen.

```apache
User  www-data
Group www-data
```

```nginx
user www-data;
worker_processes auto;
```

Beide Beispiele nennen den Betriebssystem-Benutzer, unter dem die Arbeiter laufen. Wichtig ist, dass dieser Benutzer *nichts anderes* tut: keine Anmeldung, kein Passwort, keine Mitgliedschaft in privilegierten Gruppen. Auf Debian und Ubuntu hat `www-data` keine Shell; man prüft das mit `getent passwd www-data`. Ein Benutzer, den sich mehrere Dienste teilen (Webserver, Datenbank, Anwendung), macht aus einem Einbruch in einen Dienst einen Einbruch in alle.

Die zweite Hälfte ist das *Dateisystem*. Der Webprozess darf seine Programmdateien, Konfiguration und die ausgelieferten Seiten *lesen*, aber nicht *ändern*. Dann kann ein Angreifer, der den Prozess übernimmt, die Webseite nicht umschreiben und keine Skripte ablegen, die später ausgeführt werden. Der Test: Eine Datei im Besitz von `root` mit den Rechten `644` ließ sich als `www-data` lesen (`cat` gab den Inhalt aus), ein Schreibversuch endete mit `Permission denied`. Genau das ist gewollt. Typische Rechte sind Besitzer `root` oder ein Deploy-Benutzer, Verzeichnisse `755`, Dateien `644`. Schreibrechte bekommt der Webprozess nur dort, wo die Anwendung sie braucht (Uploads, Zwischenspeicher, Sitzungen), und dort schaltet man die Ausführung von Skripten ab. Außerdem sollten Konfigurationsdateien mit Geheimnissen (Schlüssel, Passwortdateien) nur für `root` lesbar sein; der Server liest sie beim Start als `root` ein. Bei privaten TLS-Schlüsseln ist das üblich (`chmod 600`); Modul 6 hat es gezeigt.

Weitere Schichten gehören nach meinem Kenntnisstand dazu, wurden aber nicht getestet: die Härtungsoptionen des Dienstes unter `systemd` (etwa `ProtectSystem`, `NoNewPrivileges`, `PrivateTmp`), die den Prozess vom restlichen System abschotten, sowie Zugriffsregeln des Kernels (*AppArmor* unter Ubuntu, *SELinux* unter Red Hat), die selbst einem übernommenen Prozess bestimmte Dateien verbieten. Wer Container einsetzt, erreicht Ähnliches mit einem unprivilegierten Benutzer im Container.

### Typische Fehler.

Der erste Fehler ist `chmod 777` „damit es geht“: Jeder auf dem System, und damit auch der Webprozess, darf schreiben. Der zweite ist ein Webroot im Besitz von `www-data`: Der Prozess darf dann seine eigenen Seiten ändern, und ein Einbruch kann Schadcode auf die Seite bringen. Der dritte ist, Anwendungen mit `root`-Rechten laufen zu lassen, weil „es sonst nicht startet“; meist fehlt nur ein Verzeichnisrecht.

```bash
# falsch: alles für alle
chmod -R 777 /var/www/shop
# richtig: root besitzt, Webprozess liest; nur Uploads beschreibbar
chown -R root:root /var/www/shop
find /var/www/shop -type d -exec chmod 755 {} +
find /var/www/shop -type f -exec chmod 644 {} +
chown www-data:www-data /var/www/shop/uploads
```

> **Praxisbeispiel: Nach dem Einbruch**
>
> Bei einem Vorfall, bei dem Dateien in einem Webroot verändert wurden, ist die erste Frage: Welcher Benutzer hat sie geändert? Gehört das Webroot dem Webprozess, ist die Antwort „der Webserver“ und die Untersuchung beginnt bei der Anwendung. Gehört es `root`, muss der Angreifer mehr Rechte erlangt haben, was ein ernsterer Befund ist.

## 10.2 ServerTokens und ServerSignature

Jede Antwort verrät standardmäßig, welcher Server sie erzeugt hat, in der Kopfzeile `Server:`. Auch Fehlerseiten tragen den Namen und oft die Version. Für Angreifer ist das nützlich: Wer weiß, dass ein Server „Apache 2.4.49“ ist, kann gezielt nach bekannten Lücken dieser Version suchen. Die Direktiven `ServerTokens` und `ServerSignature` bei Apache und `server_tokens` bei Nginx begrenzen diese Auskunft.

Bei Apache steuert `ServerTokens`, wie viel der `Server`-Header enthält. Der Test lieferte für jede Stufe:

```text
ServerTokens Prod        ->  Server: Apache
ServerTokens Major       ->  Server: Apache/2
ServerTokens Minor       ->  Server: Apache/2.4
ServerTokens Min         ->  Server: Apache/2.4.58
ServerTokens OS          ->  Server: Apache/2.4.58 (Ubuntu)
ServerTokens Full        ->  Server: Apache/2.4.58 (Ubuntu)
```

Die Stufen werden nach oben gesprächiger. `Prod` nennt nur den Produktnamen. `Full` wäre mehr als `OS`, wenn Module sich mit eigener Versionsangabe anhängen (zum Beispiel PHP); in der Testumgebung war kein solches Modul geladen, so dass beide gleich aussehen. Die Voreinstellung der Paketquellen ist auf Ubuntu `Full`. Für den Betrieb setzt man `ServerTokens Prod`. Mit `ServerSignature Off` verschwindet außerdem die Fußzeile in Fehlerseiten. Im Test endete die Standard-404-Seite mit `<address>Apache/2.4.58 (Ubuntu) Server at localhost Port 8100</address>`; mit `ServerSignature Off` und `ServerTokens Prod` enthielt sie nur noch die Meldung selbst.

Bei Nginx gibt es einen Schalter: `server_tokens off;`. Mit dem Schalter lautete die Kopfzeile im Test `Server: nginx`, und die Fehlerseite endete mit `<center>nginx</center>`; ohne ihn steht dort `nginx/1.24.0 (Ubuntu)` (so in der 502-Fehlerseite des Tests aus Einheit 10.11 zu sehen). Völlig verschwinden lässt sich der Header bei Nginx Open Source nicht; dafür braucht es ein zusätzliches Modul (`headers-more`) oder NGINX Plus, was ich nicht getestet habe.

Wie viel bringt das? Wenig, und man sollte sich nichts vormachen: Das Verbergen der Version ist *Sicherheit durch Verschleierung*. Ein Angreifer probiert Angriffe ohnehin ohne Rücksicht auf die Version, und automatisierte Scanner erkennen Server an ihrem Verhalten. Gerechtfertigt ist die Maßnahme trotzdem, weil sie nichts kostet, Gelegenheitsscans erschwert und in Prüfberichten verlangt wird. Wichtiger ist, dass die Version *aktuell* ist (Einheit 10.8). Eine Besonderheit von Ubuntu: Die Versionsnummer, die ein Paket meldet (`2.4.58`), sagt nichts über den Stand der Sicherheitskorrekturen, weil die Distribution Korrekturen in die alte Version zurückportiert; Einheit 10.8 zeigt das am Testsystem.

```apache
ServerTokens Prod
ServerSignature Off
```

```nginx
http {
    server_tokens off;
}
```

### Typische Fehler.

Der erste Fehler ist, nur den Header zu verbergen und die Fehlerseite zu vergessen (`ServerSignature`); die Version steht dann im Text der 404-Seite. Der zweite ist, die Direktive im falschen Kontext zu setzen: `ServerTokens` gilt für den ganzen Server und darf nicht in einem Virtual Host stehen. Der dritte ist der Glaube, das Verbergen ersetze Updates.

```apache
# falsch: Header verborgen, Fehlerseite verrät Version
ServerTokens Prod
ServerSignature On
# richtig: beides
ServerTokens Prod
ServerSignature Off
```

> **Praxisbeispiel: Befund im Prüfbericht**
>
> Schwachstellenscanner melden „Versionsangabe im Server-Header“ fast immer. Die Behebung dauert zwei Zeilen. Man prüft sie mit `curl -sI https://beispiel.example | grep -i \^{}server` und sieht auch gleich, ob ein vorgeschalteter Proxy oder ein Anwendungsserver (`X-Powered-By`) ebenfalls Angaben macht.

## 10.3 Access Control

*Zugriffskontrolle* entscheidet, wer eine Ressource überhaupt ansehen darf, *bevor* es um Benutzernamen geht. Die einfachste Form stützt sich auf die Herkunft der Anfrage: die Adresse des Clients. Man erlaubt etwa die Verwaltungsseite nur aus dem Firmennetz. Das ist grob, aber wirksam, und es lässt sich mit einer Zeile ausdrücken.

Bei Apache 2.4 dient dafür die Direktive `Require` aus `mod_authz_core` und `mod_authz_host`. Die wichtigsten Formen: `Require all granted` (alle dürfen), `Require all denied` (niemand darf), `Require ip 10.0.0.0/8` (nur dieser Adressbereich), `Require local` (nur der Rechner selbst). Mehrere `Require`-Zeilen stehen in einer *ODER*-Verknüpfung: Es genügt, dass eine zutrifft. Sollen alle gelten, fasst man sie in `<RequireAll>` zusammen, soll mindestens eine gelten, in `<RequireAny>`; mit `Require not ip ...` verneint man eine Bedingung.

```apache
<Directory "/var/www/verwaltung">
    Require ip 10.0.0.0/8 192.168.0.0/16
</Directory>
<Location "/server-status">
    SetHandler server-status
    Require local
</Location>
```

Die erste Regel erlaubt den Zugriff auf das Verwaltungsverzeichnis nur aus zwei privaten Netzen, die zweite die Statusseite (Modul 9) nur vom Rechner selbst. Im Test lieferte ein Zugriff auf einen Pfad mit `Require ip 10.0.0.0/8` von `127.0.0.1` aus die Antwort `403`, und im Fehlerprotokoll stand `AH01630: client denied by server configuration: /tmp/m10/htdocs/pub/`. Die alte Schreibweise aus Apache 2.2 (`Order allow,deny`, `Allow from`, `Deny from`) gehört zum Modul `mod_access_compat` und gilt als veraltet; neue Konfigurationen verwenden sie nicht (Modul 13 geht auf die Migration ein). Gemischt mit den neuen Direktiven führt sie zu Fehlern.

Bei Nginx erledigen das `allow` und `deny` aus `ngx_http_access_module`. Sie werden *der Reihe nach* ausgewertet, und die *erste* passende Regel entscheidet. Deshalb steht `deny all;` am Ende:

```nginx
location /verwaltung/ {
    allow 10.0.0.0/8;
    allow 192.168.0.0/16;
    deny  all;
}
```

Die Reihenfolge ist wichtig: Stünde `deny all;` vorn, würde alles verweigert, und die `allow`-Zeilen wären wirkungslos. Der Test mit `allow 10.0.0.0/8; deny all;` ergab bei einem Zugriff von `127.0.0.1` den Status `403`; im Fehlerprotokoll stand `access forbidden by rule`.

Die Kombination mit einer Anmeldung steuert bei Nginx `satisfy`: Mit `satisfy all` (Standard) müssen Adressregel *und* Anmeldung erfüllt sein, mit `satisfy any` genügt eine. Im Test erlaubte die Regel `satisfy any; allow 10.0.0.0/8; auth_basic ...; deny all;` den Zugriff von `127.0.0.1` *nicht* (sie ist nicht im Netz 10.0.0.0/8), verlangte aber die Anmeldung (`401`), und mit gültigem Passwort kam `200`. Das Muster „aus dem Firmennetz ohne Passwort, von außen mit Passwort“ ist praktisch, setzt aber voraus, dass die Client-Adresse stimmt; hinter einem Proxy braucht es `realip` (Einheit 7.10), sonst kommen alle von der Adresse des Proxys und damit aus dem „vertrauten“ Netz.

Zu den Grenzen der Adressregeln: Adressen lassen sich fälschen (bei verbindungslosen Protokollen) oder teilen (NAT, Proxys). Für Dinge, die wirklich geschützt sein müssen, sind Adressregeln eine zusätzliche Schicht und kein Ersatz für Anmeldung. Sie eignen sich als Grundschutz für Verwaltungsoberflächen, die *gar nicht* aus dem Internet erreichbar sein sollen.

### Typische Fehler.

Der erste Fehler ist die Reihenfolge bei Nginx (`deny all` vor `allow`). Der zweite ist, bei Apache `Require ip` mit `Order`/`Allow` zu mischen. Der dritte ist, eine Verwaltungsseite nur durch eine versteckte Adresse zu schützen: Wer die Adresse errät, kommt hinein.

```nginx
# falsch: deny zuerst, allow wird nie erreicht
location /verwaltung/ { deny all; allow 10.0.0.0/8; }
# richtig: allow zuerst, deny am Ende
location /verwaltung/ { allow 10.0.0.0/8; deny all; }
```

> **Praxisbeispiel: Verwaltungsseiten nicht ins Internet**
>
> Statusseiten, Balancer-Manager, Datenbank-Oberflächen und Anwendungs-Verwaltungen gehören nicht ins offene Netz. Die wirksamste Regel ist, sie auf einer internen Adresse zu betreiben oder per Adressregel auf das Verwaltungsnetz zu beschränken, zusätzlich zur Anmeldung. Die Prüfung ist einfach: Von außen darf die Adresse nie mit `200` oder `401` antworten, nur mit `403` oder `404`.

## 10.4 Authentication

*Authentifizierung* beantwortet die Frage „Wer bist du?“ Die einfachste Methode im Webserver ist die *HTTP-Basic-Authentifizierung*: Der Browser zeigt ein Anmeldefenster und sendet Benutzername und Passwort bei jeder Anfrage im Header `Authorization: Basic ...`. Der Wert nach `Basic` ist nur *Base64-kodiert*, nicht verschlüsselt (Modul 9 hat gezeigt, wie leicht sich so ein Wert lesen lässt). Basic-Authentifizierung ist deshalb *nur* über HTTPS (Modul 6) vertretbar. Sie ist gut für einfache Fälle (eine interne Seite, eine Testumgebung) und ungeeignet für große Benutzerzahlen, weil jede Anfrage das Passwort überträgt und der Server keine eigene Sitzung kennt.

Die Benutzer stehen in einer Datei, die das Werkzeug `htpasswd` aus dem Apache-Paket verwaltet und die Nginx ebenfalls lesen kann. Die Datei enthält pro Zeile einen Benutzer und den *Hash* des Passworts, nie das Passwort selbst. Der Test:

```bash
htpasswd -bc /etc/webserver/htpasswd anna geheim123     # Datei anlegen
htpasswd -bB /etc/webserver/htpasswd cara pw3           # weiterer Benutzer, bcrypt
```

Die erste Zeile legt die Datei an (`-c`) und trägt `anna` ein; `-b` nimmt das Passwort aus der Kommandozeile (praktisch im Test, für echte Passwörter schlecht, weil es in der Befehlsliste und in der Prozessliste steht; ohne `-b` fragt `htpasswd` interaktiv). Die zweite Zeile ergänzt `cara` mit dem Verfahren *bcrypt* (`-B`). Der Standard von `htpasswd` ist ein MD5-Verfahren (`$apr1$`, im Test an der Kennung zu erkennen); bcrypt (Kennung `$2y$`) ist stärker, weil es absichtlich langsam rechnet und damit Raten erschwert. Auch bcrypt-Einträge funktionierten im Test bei Nginx: `cara:pw3` bekam `200`. Der Kostenfaktor, den `htpasswd` bei `-B` voreinstellt (im Test `05`), ist niedrig; mit `-C 12` erhöht man ihn.

Die Einbindung bei Apache:

```apache
LoadModule authn_core_module modules/mod_authn_core.so
LoadModule authn_file_module modules/mod_authn_file.so
LoadModule auth_basic_module modules/mod_auth_basic.so
LoadModule authz_user_module modules/mod_authz_user.so

<Directory "/var/www/intern">
    AuthType Basic
    AuthName "Interner Bereich"
    AuthUserFile /etc/webserver/htpasswd
    Require valid-user
</Directory>
```

`AuthType Basic` wählt das Verfahren, `AuthName` ist der Text im Anmeldefenster (die „Realm“), `AuthUserFile` nennt die Datei, und `Require valid-user` verlangt *irgendeinen* gültigen Benutzer. Die Module für die Quelle (`authn_file`), das Verfahren (`auth_basic`) und die Regel (`authz_user`) müssen geladen sein. Im Test lieferte der Zugriff ohne Anmeldedaten und mit falschem Passwort jeweils `401`, mit richtigem `200`; die Antwort enthielt dabei `WWW-Authenticate: Basic realm="Intern"`, die Aufforderung an den Browser, das Anmeldefenster zu zeigen. Im Fehlerprotokoll stand bei falschem Passwort `AH01617: user anna: authentication failure for "/intern/": Password Mismatch`.

Bei Nginx genügen zwei Zeilen:

```nginx
location /intern/ {
    auth_basic           "Interner Bereich";
    auth_basic_user_file /etc/webserver/htpasswd;
}
```

Dasselbe Ergebnis: ohne Anmeldung und mit falschem Passwort `401`, mit richtigem `200`. Die Datei muss für den Benutzer der Arbeitsprozesse lesbar sein, weil diese sie bei Anfragen auswerten (im Test: Eigentümer `root`, Rechte `644`), aber nicht beschreibbar und, wenn möglich, nicht für andere Benutzer lesbar.

Für Fälle, in denen Basic nicht genügt (Einmalanmeldung, Zwei-Faktor, Anbindung an ein Benutzerverzeichnis), gibt es zwei Wege, die über das Thema dieses Moduls hinausgehen. Der erste ist, die Prüfung an einen *anderen Dienst* auszulagern. Nginx kann mit `auth_request` für jede Anfrage einen Hilfsaufruf an eine interne Adresse senden und je nach Antwort (`2xx` erlaubt, `401`/`403` verweigert) durchlassen. Der Test mit einer einfachen internen Location, die `401` liefert, solange der Header `X-Token` fehlt, ergab ohne Token `401`, mit richtigem Token `200`. In der Praxis ersetzt man die Testregel durch einen echten Anmeldedienst. Der zweite Weg sind Module für *OpenID Connect* (OIDC) und Tokens (JWT); für Apache gibt es meines Wissens `mod_auth_openidc`, für Nginx Open Source nur Lösungen über `auth_request` oder Skripte, während NGINX Plus eigene Module enthält. Beides habe ich nicht getestet; der Lehrplan nennt JWT und OIDC nur in der Modulübersicht, nicht als Einheit.

### Typische Fehler.

Der erste Fehler ist Basic ohne HTTPS: Das Passwort geht im Klartext über die Leitung. Der zweite ist, ein schwaches Hashverfahren oder schwache Passwörter zu verwenden; bcrypt mit ordentlichem Kostenfaktor und lange Passwörter sind ein Mindeststandard. Der dritte ist, die Passwortdatei in das Webroot zu legen: Dann lädt sie jeder herunter, wenn er den Pfad errät.

```apache
# falsch: Passwortdatei im öffentlichen Webroot
AuthUserFile /var/www/html/.htpasswd
# richtig: ausserhalb des Webroots, nur für root lesbar
AuthUserFile /etc/apache2/htpasswd
```

> **Praxisbeispiel: Der Schutz der Testumgebung**
>
> Staging-Systeme und Entwurfsseiten schützt man gern mit Basic. Das hält Suchmaschinen und Neugierige fern, ist aber keine Absicherung gegen gezielte Angriffe. Wichtig ist HTTPS und, dass die Anwendung dahinter nicht auf ihre eigene Anmeldung verzichtet.

## 10.5 Authorization

*Autorisierung* beantwortet die Frage „Darf dieser Benutzer das?“ Sie kommt *nach* der Authentifizierung: Erst steht fest, wer jemand ist, dann, was er darf. Beide verwechselt man leicht, und ein Teil der Fehlersuche besteht darin, sie zu trennen: `401` heißt „nicht (richtig) angemeldet“, `403` heißt „angemeldet oder nicht, aber nicht erlaubt“.

Bei Apache liegen beide Teile in derselben Direktive `Require`. `Require valid-user` erlaubt jeden gültigen Benutzer, `Require user anna bob` nur bestimmte Benutzer, `Require group verwaltung` Mitglieder einer Gruppe (mit `AuthGroupFile` und dem Modul `authz_groupfile`). Ein Test mit zwei gültigen Benutzern, aber der Regel `Require user anna`, ergab: `anna` bekam `200`; `bob` (gültiges Passwort) bekam `401`, und im Fehlerprotokoll stand `AH01631: user bob: authorization failure for "/intern/"`. Das Ergebnis überrascht: Obwohl `bob` bekannt ist, antwortet Apache mit `401` statt `403`. Das ist Absicht des Servers: Bei einer Anmeldeaufforderung kann ein anderer Benutzer es noch einmal versuchen, daher die Wiederholungsaufforderung. Wer einen echten `403` für authentifizierte, aber nicht berechtigte Benutzer will, braucht eine andere Konstruktion (etwa `AuthzSendForbiddenOnFailure On`, das ich nicht getestet habe). Auch die Fehlermeldung ist ein Hinweis: `authentication failure` (AH01617) heißt Passwort falsch, `authorization failure` (AH01631) heißt Passwort richtig, Berechtigung fehlt.

```apache
<Directory "/var/www/intern">
    AuthType Basic
    AuthName "Interner Bereich"
    AuthUserFile /etc/apache2/htpasswd
    Require user anna
</Directory>
```

Die Regel erlaubt dem Bereich nur den Benutzer `anna`. Beim Hinzufügen weiterer Benutzer wächst die Zeile; bei vielen Benutzern verwendet man Gruppen. Nginx trennt die Teile anders. Die Anmeldung (`auth_basic`) prüft nur, ob *irgendein* Benutzer der Datei vorliegt; benutzerabhängige Rechte gibt es im Kern nicht. Man kann den Benutzernamen (die Variable `$remote_user`) in einer `map` auswerten oder die Entscheidung dem `auth_request`-Dienst überlassen, der dann Benutzer und Pfad kennt.

Eine zweite Art der Autorisierung betrifft die *Methode*. Ein statischer Bereich braucht oft nur `GET` und `HEAD`; `POST`, `PUT` und `DELETE` sind dort nur Angriffsfläche. Nginx erlaubt das mit `limit_except`:

```nginx
location /ro/ {
    limit_except GET HEAD {
        deny all;
    }
}
```

Der Block gilt für alle Methoden außer `GET` und `HEAD`. Im Test lieferte `GET` den Status `200`, `POST` den Status `403`; das Fehlerprotokoll nannte `access forbidden by rule`. Das Gegenstück bei Apache ist `<LimitExcept GET HEAD>` mit `Require all denied`, was ich hier nicht getestet habe, oder das Modul `mod_allowmethods`, das auf dem Testsystem vorhanden ist (`AllowMethods GET HEAD`). In Modul 9 war außerdem zu sehen, dass `TraceEnable Off` die Methode `TRACE` mit `405` abweist.

Autorisierung ist am wirksamsten, wenn sie das Standardverhalten *Verweigern* nutzt: erst alles sperren, dann gezielt freigeben. Bei Apache geschieht das mit `Require all denied` im Verzeichnis `/` und gezielten Freigaben darunter, bei Nginx mit `deny all;` im `server`-Block und Ausnahmen in den Locations. So bleibt vergessene Konfiguration verschlossen statt offen.

### Typische Fehler.

Der erste Fehler ist, Authentifizierung und Autorisierung zu vermischen und mit `valid-user` jeden angemeldeten Benutzer überall hineinzulassen. Der zweite ist eine Konfiguration, die *offen* beginnt und Sperren hinzufügt; was man vergisst, bleibt offen. Der dritte ist, 401 und 403 als gleichwertig zu lesen und die Fehlersuche an der falschen Stelle zu beginnen.

```apache
# falsch: jeder gültige Benutzer darf in den Admin-Bereich
Require valid-user
# richtig: nur die zuständigen Personen
Require user anna
```

> **Praxisbeispiel: Zugriffsprotokoll und Fehlerprotokoll zusammen lesen**
>
> Meldet ein Benutzer „ich komme nicht hinein“, hilft die Meldung im Fehlerprotokoll: `authentication failure` bedeutet falsches Passwort, `authorization failure` fehlende Berechtigung, `client denied by server configuration` eine Adressregel. Aus der Zeile geht die Behebung hervor, ohne zu raten.

## 10.6 Security Headers

Sicherheits-Header sind Antwort-Header, die dem *Browser* Anweisungen zum Schutz des Besuchers geben. Sie ergänzen die Härtung des Servers um Schutz auf der Seite des Clients. Der Webserver setzt sie zentral für alle Seiten; die Anwendung muss dafür nichts tun. Die wichtigsten Header und ihre Wirkung:

**X-Content-Type-Options: nosniff**  
Der Browser soll dem angegebenen Inhaltstyp (`Content-Type`) trauen und nicht selbst raten. Das verhindert, dass etwa eine hochgeladene Textdatei als Skript ausgeführt wird.

**X-Frame-Options oder frame-ancestors**  
Regelt, ob die Seite in einem fremden `iframe` erscheinen darf. Das schützt vor *Clickjacking*, bei dem Besucher auf eine unsichtbar eingebettete Seite klicken. `DENY` verbietet jedes Einbetten.

**Referrer-Policy**  
Bestimmt, wie viel von der Herkunftsadresse beim Klick auf einen Link an die Zielseite geht. Der Wert `strict-origin-when-cross-origin` gibt an fremde Seiten nur den Ursprung (ohne Pfad).

**Permissions-Policy**  
Schaltet Browserfunktionen für die Seite ab (Kamera, Mikrofon, Standort), die sie nicht braucht.

**Content-Security-Policy (CSP)**  
Legt fest, von wo die Seite Skripte, Bilder und Stile laden darf. Sie ist der wirksamste Schutz gegen das Einschleusen von Skripten (*Cross-Site-Scripting*), aber auch der aufwendigste, weil die Anwendung dazu passen muss.

**Strict-Transport-Security (HSTS)**  
Zwingt den Browser auf HTTPS; Modul 6 hat ihn mit Test behandelt.

> **Ergänzung aus der Nachrecherche: Empfehlungen des OWASP Cheat Sheets**
>
> Das *HTTP Security Response Headers Cheat Sheet* von OWASP nennt unter anderem: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (mit dem Hinweis, dass ein Fehler oder ein abgelaufenes Zertifikat Besucher für die Dauer von `max-age` aussperren kann), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (mit dem Hinweis, wenn möglich die CSP-Direktive `frame-ancestors` zu verwenden), `Referrer-Policy: strict-origin-when-cross-origin` und als Beispiel `Permissions-Policy: geolocation=(), camera=(), microphone=()`. Der Header `X-XSS-Protection` soll nach dem Cheat Sheet nicht gesetzt oder ausdrücklich auf `0` gestellt werden; stattdessen soll eine CSP verwendet werden. Der Header `Server` soll entfernt oder auf einen nichtssagenden Wert gesetzt werden, `X-Powered-By` ganz entfernt. Für sensible Seiten nennt es `Cache-Control` mit `no-store`. Quelle: OWASP Cheat Sheet Series (abgerufen am 31.10.2026, siehe Quellenverzeichnis).

Bei Apache setzt `mod_headers` die Header, bei Nginx `add_header`:

```apache
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "DENY"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "geolocation=(), camera=(), microphone=()"
Header always unset X-Powered-By
```

Das Wort `always` ist entscheidend. Ohne `always` setzt Apache den Header nur bei *erfolgreichen* Antworten; mit `always` auch bei Fehlerseiten. Im Test erhielt die 404-Antwort bei `Header always set X-Always "ja"` den Header, bei `Header set X-Plain "ja"` nicht. Ein Angreifer, der Fehlerseiten provoziert, träfe ohne `always` auf ungeschützte Antworten. Die Testantwort für die Startseite enthielt alle vier gesetzten Header, `X-Powered-By` war entfernt, und die Kopfzeile `Server` lautete `Apache` (durch `ServerTokens Prod`).

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), camera=(), microphone=()" always;
```

Auch hier gilt: Ohne `always` fügt Nginx den Header nur bei bestimmten Erfolgs- und Weiterleitungs-Statuscodes hinzu (nach der Dokumentation 200, 201, 204, 206, 301, 302, 303, 304, 307 und 308). Im Test fehlte der Header `X-Plain` (ohne `always`) in der 404-Antwort, während die mit `always` gesetzten vorhanden waren. Die zweite Falle ist die Vererbung, die schon Modul 5 gezeigt hat: Enthält ein `location`-Block eine *eigene* `add_header`-Zeile, gelten die Zeilen der äußeren Ebene dort *nicht mehr*. Wer in einer Location (etwa für Caching-Header) `add_header` verwendet, verliert dort stillschweigend die Sicherheits-Header. Die Gegenmaßnahme ist wie bei den Proxy-Headern eine gemeinsame Datei, die in jede Location eingebunden wird.

Die Content-Security-Policy verdient besondere Vorsicht. Ein Beispiel wie `Content-Security-Policy: default-src 'self'` erlaubt nur Ressourcen vom eigenen Ursprung und blockiert damit Inline-Skripte, Skripte von Werbe- und Analyse-Diensten und Schriften von Fremdservern. Eine zu strenge CSP macht die Seite kaputt, eine zu weite schützt nicht. Der übliche Weg ist, zuerst im *Beobachtungsmodus* (`Content-Security-Policy-Report-Only`) zu laufen, die Meldungen auszuwerten und die Richtlinie schrittweise zu verschärfen. Die Richtlinie gehört eng mit der Anwendung zusammen; der Webserver liefert sie nur aus.

### Typische Fehler.

Der erste Fehler ist `always` zu vergessen. Der zweite ist die `add_header`-Vererbung bei Nginx. Der dritte ist, eine CSP ungeprüft in den Normalbetrieb zu nehmen und die Seite zu zerstören.

```nginx
# falsch: Header fehlt bei Fehlerseiten
add_header X-Frame-Options "DENY";
# richtig: auch bei Fehlerantworten
add_header X-Frame-Options "DENY" always;
```

> **Praxisbeispiel: Der Test mit curl**
>
> Ob die Header ankommen, prüft man von außen: `curl -sI https://beispiel.example` zeigt die Antwort-Header. Auch Fehlerseiten sollte man prüfen (`curl -sI https://beispiel.example/gibt-es-nicht`), denn dort versagt die Konfiguration meist. Öffentliche Prüfwerkzeuge bewerten dieselben Header, ersetzen aber nicht das Lesen der Antwort.

## 10.7 DoS-Mitigations

Ein *Denial-of-Service*-Angriff (DoS) versucht, einen Dienst durch Überlastung unbrauchbar zu machen. Es gibt zwei grundverschiedene Formen, und die Unterscheidung bestimmt, was ein Webserver leisten kann. *Volumetrische* Angriffe überfluten die Leitung oder den Rechner mit mehr Datenverkehr, als die Anbindung verträgt; dagegen hilft kein Webserver, sondern nur der Netzbetreiber, ein Schutzdienst vor dem Server oder ein Verteilnetz (*CDN*). *Ressourcenerschöpfende* Angriffe nutzen geschickt wenig Verkehr, um die Betriebsmittel des Servers zu binden: offene Verbindungen, Arbeiter, Speicher. Gegen diese Angriffe kann und soll man den Webserver selbst einstellen. Der Lehrplan nennt dafür Zeitlimits, Größenbegrenzungen und Verbindungsgrenzen sowie das Zusammenspiel mit Firewall und Ratenbegrenzung.

Das Muster der klassischen langsamen Angriffe (*Slowloris*) ist einfach: Der Angreifer öffnet viele Verbindungen und sendet jede Anfrage so langsam, dass der Server den Arbeiter für diese Verbindung festhält, ohne dass die Anfrage je fertig wird. Mit wenigen hundert solcher Verbindungen sind alle Arbeiter belegt, und echte Besucher warten vergeblich. Das Gegenmittel sind Zeitlimits für das Empfangen der Anfrage. Bei Apache leistet das `mod_reqtimeout`:

```apache
LoadModule reqtimeout_module modules/mod_reqtimeout.so
RequestReadTimeout header=5-10,MinRate=500 body=10,MinRate=500
```

Die Direktive hat zwei Teile. Der Kopf (`header`) muss innerhalb von 5 Sekunden zu beginnen und zu fließen anfangen; danach darf der Server die Frist verlängern, solange mindestens 500 Bytes pro Sekunde ankommen, höchstens aber bis zur Obergrenze von 10 Sekunden. Der Körper (`body`) hat eine Frist von 10 Sekunden mit derselben Mindestgeschwindigkeit. Im Test sendete ein Skript den Anfang einer Anfrage (`GET ... X-A: b`), brach dann ab und wartete. Apache antwortete nach 5,1 Sekunden mit `HTTP/1.1 408 Request Timeout` und schloss die Verbindung. Die Paketkonfiguration von Ubuntu bringt bereits Werte mit (in `mods-available/reqtimeout.conf`: `header=20-40,minrate=500` und `body=10,minrate=500`), die toleranter sind; wer Slowloris ernst nimmt, verkürzt sie.

Bei Nginx übernehmen `client_header_timeout` und `client_body_timeout` (nach der Dokumentation jeweils 60 Sekunden Voreinstellung) diese Aufgabe, dazu `send_timeout` für das Senden der Antwort an einen trägen Client.

```nginx
client_header_timeout 5s;
client_body_timeout   5s;
send_timeout          10s;
client_max_body_size  1m;
large_client_header_buffers 4 8k;
```

Der Test mit `client_header_timeout 5s` verlief anders als bei Apache: Nach genau 5,0 Sekunden schloss Nginx die Verbindung, ohne eine Antwort zu senden (der Lesevorgang lieferte keine Bytes). Das ist ein Unterschied, den man kennen sollte: Apache sendet dem Client eine 408-Antwort, Nginx schließt still. Im Protokoll sieht man es trotzdem: In einem Wiederholungstest mit `client_header_timeout 3s` stand im Zugriffsprotokoll eine Zeile mit Status `408` und Größe 0, und das Fehlerprotokoll (Stufe `info`) nannte `client timed out (110: Connection timed out) while reading client request headers`.

Die zweite Gruppe sind *Größenbegrenzungen*. Ein Angreifer kann riesige Anfragekörper senden (Speicher, Platte) oder riesige Header (Speicher, Rechenzeit). Apache begrenzt das mit `LimitRequestBody` (Körper), `LimitRequestFields` (Anzahl der Header), `LimitRequestFieldSize` (Größe eines Headers) und `LimitRequestLine` (Länge der Anfragezeile). Nginx begrenzt den Körper mit `client_max_body_size` und die Header mit `large_client_header_buffers` sowie `client_header_buffer_size`. Die Tests lieferten:

```text
Apache  LimitRequestBody 1000, Körper 5000 Bytes      -> 413
Apache  LimitRequestLine 1000, Pfad mit 1500 Zeichen   -> 414
Apache  LimitRequestFieldSize 2000, Header mit 9000 Z. -> AH00561 im Log (Stufe info)
Nginx   client_max_body_size 1k, Körper 3000 Bytes    -> 413
Nginx   large_client_header_buffers 2 1k, Pfad 3000 Z. -> 414
```

Das Fehlerprotokoll nennt jeweils die Ursache; bei Nginx stand dort `client intended to send too large body: 3000 bytes`. Die Grenzen müssen zur Anwendung passen: Eine Seite mit Datei-Upload braucht größere Werte als eine, die nur Formulare liest. Deshalb setzt man sie global knapp und hebt sie gezielt in der Location an, die Uploads annimmt (`client_max_body_size 50m;` nur dort). Die Voreinstellung von Nginx (ein Megabyte, nach der Dokumentation) lässt Uploads mit `413` scheitern, was ein häufiger Anfängerfehler ist.

Dritte Gruppe: *Verbindungs- und Anfragegrenzen* (Einheiten 10.9 und 10.10) und die Einbindung in die Netzwerkschicht. Eine Firewall auf dem Server oder davor kann Verbindungen pro Adresse begrenzen und bekannte Angreifer sperren; Werkzeuge wie *fail2ban* lesen die Protokolle und tragen Adressen mit auffälligem Verhalten (zum Beispiel viele `401`) in die Firewall ein. Das gehört nach meinem Kenntnisstand zu den üblichen Bausteinen, wurde aber hier nicht getestet. Wichtig ist das Zusammenspiel: Die Firewall wirkt *vor* dem Webserver und kostet weniger Betriebsmittel als eine Ablehnung im Webserver.

### Typische Fehler.

Der erste Fehler ist, Zeitlimits zu großzügig zu lassen: Ein Zeitlimit von 60 Sekunden für das Senden des Kopfes erlaubt es, mit wenigen Verbindungen alle Arbeiter zu binden. Der zweite ist, Größenbegrenzungen global so hoch zu setzen, dass sie nichts bewirken. Der dritte ist, sich für vollständig geschützt zu halten: Volumetrische Angriffe erreichen den Webserver nie in der Form, in der er sie abwehren könnte.

```nginx
# falsch: großzügig für alle
client_max_body_size 2g;
# richtig: global knapp, nur der Upload-Pfad grosser
client_max_body_size 1m;
location /upload/ { client_max_body_size 50m; }
```

> **Praxisbeispiel: Der Upload, der mit 413 scheitert**
>
> Meldet ein Entwickler „der Upload geht nicht“, steht oft `413` im Zugriffsprotokoll und `client intended to send too large body` im Fehlerprotokoll. Die Lösung ist eine gezielte Erhöhung von `client_max_body_size` für den Upload-Pfad, nicht die globale Aufhebung der Grenze. Hinter einem Proxy gilt die Grenze an jeder Station einzeln; auch ein Lastverteiler davor kann sie haben.

## 10.8 Patch Management

Die meisten erfolgreichen Angriffe auf Webserver nutzen *bekannte* Lücken, für die es längst eine Korrektur gibt. *Patch Management* ist deshalb kein Anhängsel der Härtung, sondern ihr Kern: ein geordneter Prozess, der Korrekturen für den Webserver, seine Module, OpenSSL und das Betriebssystem erkennt, prüft und einspielt. Der Lehrplan nennt drei Aufgaben: regelmäßig aktualisieren, Sicherheitsmeldungen verfolgen und Wartungsfenster in die Betriebsprozesse einbinden.

Zuerst muss man wissen, was man betreibt. Die Befehle `apache2 -v`, `nginx -v` (beziehungsweise `-V` für die Kompilierungsoptionen) und `openssl version` nennen die Versionen; die Paketverwaltung nennt die Paketstände (`dpkg -l apache2 nginx openssl`). Auf dem Testsystem lauteten sie `apache2 2.4.58-1ubuntu8.17`, `nginx 1.24.0-2ubuntu7.19` und `openssl 3.0.13-0ubuntu3.16`. Die Versionsnummern wirken veraltet: Die Apache-Version 2.4.58 ist nicht die neueste, und Nginx 1.24.0 ist nicht die aktuelle stabile Linie. Der Zusatz hinter dem Bindestrich verrät aber, dass die Distribution weitergepflegt hat.

> **Ergänzung aus der Nachrecherche: Aktuelle Versionen und Meldungen**
>
> Auf der Seite *Apache HTTP Server 2.4 Vulnerabilities* (httpd.apache.org, abgerufen am 31.10.2026) waren zuletzt diese Veröffentlichungen verzeichnet: 2.4.69 vom 1.10.2026 mit 20 behobenen Schwachstellen (5 mittlere, 15 geringe), 2.4.68 vom 8.6.2026 mit 13 (6 mittlere, 7 geringe), 2.4.67 vom 4.5.2026 mit 11 (1 wichtige, 2 mittlere, 8 geringe) und 2.4.66 vom 4.12.2025 mit 5 (3 mittlere, 2 geringe). Die Einstufung ordnet jede Schwachstelle nach den Stufen der Apache-Sicherheitsrichtlinie ein; die Seite weist darauf hin, dass sich die Einstufung je nach Plattform unterscheiden kann. Für Nginx nennt `nginx.org/2026.html` als aktuelle Versionen die stabile Linie 1.30.6 (14.10.2026) und die Mainline 1.31.8 (21.10.2026). Die Zahlen sind ein Stand vom 31.10.2026 und veralten; maßgeblich sind die Seiten selbst. Quellen: siehe Quellenverzeichnis.

Warum sagt die alte Versionsnummer über den Sicherheitsstand nichts aus? Weil Linux-Distributionen Korrekturen in die ausgelieferte Version *zurückportieren* (*backporting*), statt die Version zu erhöhen. Das ist am Testsystem sichtbar. Das Änderungsprotokoll des Apache-Pakets (`/usr/share/doc/apache2/changelog.Debian.gz`) beginnt mit `apache2 (2.4.58-1ubuntu8.17) noble-security` und führt Einträge der Form `SECURITY UPDATE: Information disclosure in mod_dav_fs` mit der Nummer der Schwachstelle und dem Namen der Korrekturdatei auf. Das des Nginx-Pakets beginnt mit `nginx (1.24.0-2ubuntu7.19) noble-security` und einem Eintrag `SECURITY UPDATE: heap overflow in certain configurations`, dessen Korrektur die Abbildung von Pfaden bei `alias` mit `rewrite` betrifft (die Direktive `alias` kennt man aus Modul 5). In den ersten 400 Zeilen des Apache-Protokolls standen 61 verschiedene Schwachstellen-Nummern. Das heißt: Das Paket war ordentlich gepflegt, obwohl die Versionsnummer alt wirkt. Daraus folgt eine Regel für Prüfberichte: Man bewertet nicht die Versionsnummer, sondern den Paketstand gegen die Sicherheitsmitteilungen der Distribution. Wer den Webserver aus den *Quellen* oder von einem Fremdanbieter (zum Beispiel direkt von nginx.org) bezieht, bekommt dagegen die Upstream-Versionen und muss selbst auf neue Versionen achten.

Wie bleibt man informiert? Es gibt Ankündigungslisten der Projekte (Apache: Sicherheitsseite und Ankündigungsliste; Nginx: Seite *security advisories* auf nginx.org), die Sicherheitsmitteilungen der Distribution und Datenbanken wie die der CVE-Nummern. Die Nginx-Seite habe ich nur in einer Spiegelkopie abrufen können; sie steht deshalb im Quellenverzeichnis unter „weiterführend“. Hilfreich ist, die Meldungen auf die *eigene* Konfiguration zu beziehen: Eine Lücke in `mod_proxy_ftp` betrifft einen Server nicht, der das Modul nicht lädt (Modul 4); eine Lücke im HTTP/3-Modul keinen Server ohne HTTP/3 (Modul 6). Das verkürzt die Dringlichkeit, entbindet aber nicht vom Einspielen.

Der Betrieb braucht einen festen Ablauf. Typisch: Meldungen regelmäßig sichten, die Korrektur zuerst auf einem Testsystem einspielen und die wichtigsten Funktionen prüfen (Konfigurationstest `apachectl -t` beziehungsweise `nginx -t`, dann Stichproben-Anfragen), dann im Wartungsfenster produktiv einspielen. Bei Apache und Nginx lässt sich vieles ohne Ausfall erledigen: `apachectl graceful` und `nginx -s reload` laden Konfiguration und Module sanft neu, wobei laufende Anfragen zu Ende bearbeitet werden. Ein Update der Programmdatei selbst braucht bei Apache einen (sanften) Neustart; bei Nginx gibt es nach meinem Kenntnisstand ein Verfahren zum Austausch der Programmdatei im laufenden Betrieb mit dem Signal `USR2`, das ich nicht getestet habe. Automatische Sicherheitsupdates (unter Debian und Ubuntu das Paket `unattended-upgrades`) sind für viele Systeme sinnvoll, setzen aber voraus, dass ein fehlgeschlagenes Update erkannt wird; Näheres zur Planung von Versionswechseln und Rückfallstrategien folgt in Modul 13.

### Typische Fehler.

Der erste Fehler ist, Updates aufzuschieben, bis eine Gelegenheit kommt: Der Abstand zwischen Veröffentlichung einer Korrektur und ihrer Ausnutzung ist oft kurz. Der zweite ist, nur den Webserver zu betrachten und OpenSSL, Module und Anwendungslaufzeiten zu vergessen. Der dritte ist, die Versionsnummer des Pakets für den Stand zu halten.

```bash
# falsch: nur die Versionsnummer ansehen
nginx -v
# richtig: Paketstand und Änderungsprotokoll ansehen
dpkg -l nginx | tail -1
zcat /usr/share/doc/nginx/changelog.Debian.gz | head -20
```

> **Praxisbeispiel: Das Wartungsfenster**
>
> Ein Wartungsfenster ist ein vereinbarter Zeitraum für Eingriffe, mit einem Rückweg. Vor dem Update werden Konfiguration und Paketstand gesichert (Modul 14), im Fenster wird eingespielt, die Prüfliste durchlaufen und die Fehlerrate beobachtet (Modul 9). Wer Lastverteiler einsetzt (Modul 8), nimmt einen Server nach dem anderen aus der Verteilung und aktualisiert ohne sichtbaren Ausfall.

## 10.9 Rate Limiting

*Ratenbegrenzung* beschränkt, wie viele Anfragen ein Client in einer bestimmten Zeit stellen darf. Sie schützt vor Passwort-Raten (*Brute Force*), vor automatisiertem Abgreifen von Daten, vor Fehlverhalten eines einzelnen Clients und vor Lastspitzen. Sie verhindert Angriffe nicht, sie macht sie *teuer* und *langsam*.

Nginx bringt `ngx_http_limit_req_module` mit, das nach dem Verfahren des „lecken Eimers“ (*leaky bucket*) arbeitet: Anfragen füllen einen Eimer, der mit fester Rate ausläuft; ist der Eimer voll, laufen weitere Anfragen über, und sie werden abgewiesen. Die Einrichtung besteht aus zwei Teilen, einer *Zone* im `http`-Kontext und der Anwendung in der Location:

```nginx
http {
    limit_req_zone $binary_remote_addr zone=perip:1m rate=5r/s;
    limit_req_status 429;

    server {
        location / {
            limit_req zone=perip burst=5 nodelay;
        }
    }
}
```

Die Zeile `limit_req_zone` definiert eine Zone mit dem Namen `perip`. Der *Schlüssel* `$binary_remote_addr` (die Client-Adresse in kompakter Form) bestimmt, wer gezählt wird: jede Adresse einzeln. `1m` ist die Größe des Speichers (ein Megabyte reicht nach der Dokumentation für einige zehntausend Adressen; ich habe die Zahl nicht nachgemessen), und `rate=5r/s` setzt die erlaubte Rate auf fünf Anfragen pro Sekunde. Die Direktive `limit_req_status 429` setzt den Status für abgewiesene Anfragen; ohne sie antwortet Nginx mit `503`, was im Test bestätigt wurde (`200 503 503`) und bei der Fehlersuche irreführen kann, weil 503 sonst „Dienst nicht verfügbar“ bedeutet. `429 Too Many Requests` ist der passende Code.

In der Location bestimmt `limit_req` die Anwendung. Ohne `burst` ist jede Anfrage, die *schneller* kommt als die Rate erlaubt, sofort abgewiesen. Das ist für echte Browser zu streng, weil sie beim Laden einer Seite mehrere Anfragen gleichzeitig stellen. Der Parameter `burst=5` erlaubt kurzzeitig fünf zusätzliche Anfragen. Dann gibt es zwei Verhaltensweisen. Ohne `nodelay` werden die überschüssigen Anfragen *verzögert*, so dass sie mit der erlaubten Rate abgearbeitet werden. Im Test brauchten sechs schnell aufeinanderfolgende Anfragen bei `rate=5r/s burst=5` etwas über eine Sekunde (1,01 s) und wurden alle mit `200` beantwortet: Nginx hat sie gebremst. Mit `nodelay` werden die Anfragen des Bursts *sofort* bedient und nur die darüber hinausgehenden abgewiesen. Eine Serie von 14 schnellen Anfragen ergab so `200 200 200 200 429 429 429 429 200 429 429 429 429 429`: Zu Beginn passieren einige Anfragen, dann folgen Ablehnungen, und hin und wieder wird eine durchgelassen, wenn der Eimer Platz frei hat. Die genaue Folge hängt vom Zeitverhalten ab und ist nicht wiederholbar; die Tendenz ist es. Im Fehlerprotokoll steht pro Ablehnung eine Zeile wie `limiting requests, excess: 5.225 by zone "perip", client: 127.0.0.1`; `excess` nennt den Überschuss über der Rate.

Ein häufiger Einsatz ist eine *strenge* Zone für Anmeldeseiten. Eine Rate von einer Anfrage pro Minute genügt, um Passwort-Raten praktisch unbrauchbar zu machen, ohne echte Benutzer zu stören:

```nginx
limit_req_zone $binary_remote_addr zone=login:1m rate=1r/m;

location = /login {
    limit_req zone=login;
    proxy_pass http://app;
}
```

Im Test ergaben drei Anfragen an eine solche Location `200 429 429`. Ein Schlüssel, der nur die Adresse nutzt, hat eine bekannte Schwäche: Hinter einem Proxy, einer Firma oder einem Mobilfunknetz teilen sich viele Benutzer eine Adresse und damit *einen* Eimer. Und wenn Nginx selbst hinter einem Proxy steht und `realip` fehlt (Einheit 7.10), teilen sich *alle* Besucher denselben Eimer, und die Ratenbegrenzung sperrt den ganzen Dienst, genau der Vorfall, den Einheit 7.10 beschreibt. Der Schlüssel kann deshalb auch ein anderer Wert sein, etwa ein Benutzername aus einem Header oder die Kombination aus Adresse und Pfad.

Bei Apache gibt es im Standardumfang *keine* Ratenbegrenzung nach Anfragen pro Zeit. Das Modul `mod_ratelimit` (auf dem Testsystem vorhanden) begrenzt nach meinem Kenntnisstand die *Bandbreite* einer Antwort, nicht die Anfragerate. Für Anfrageraten gibt es Zusatzmodule Dritter (etwa `mod_evasive` oder `mod_qos`), die ich weder installiert noch getestet habe; häufiger setzt man dafür Nginx oder einen anderen Proxy vor Apache, ein Schutzsystem davor oder *fail2ban* auf Basis der Protokolle.

### Typische Fehler.

Der erste Fehler ist, das Ratenlimit pro Adresse zu setzen, ohne zu prüfen, welche Adresse Nginx sieht. Der zweite ist, den Burst zu vergessen und damit normale Browser abzuweisen. Der dritte ist ein Status 503 für abgewiesene Anfragen, der in Überwachung und Suche nach Fehlern mit Ausfällen verwechselt wird.

```nginx
# falsch: kein Burst, jeder schnelle Seitenaufruf wird abgewiesen
limit_req zone=perip;
# richtig: kurze Spitzen erlauben
limit_req zone=perip burst=10 nodelay;
```

> **Praxisbeispiel: Brute Force auf die Anmeldung**
>
> Im Zugriffsprotokoll erkennt man Passwort-Raten an vielen `401`- oder `200`-Antworten auf die Anmeldeadresse von derselben Adresse. Eine strenge Zone auf genau diese Adresse (eine Anfrage pro Sekunde und kleiner Burst) begrenzt den Schaden, ohne die restliche Seite zu bremsen. Ergänzend sollte die Anwendung selbst fehlgeschlagene Anmeldungen zählen und sperren.

## 10.10 Connection Limiting

Während Ratenbegrenzung zählt, *wie oft* ein Client anfragt, begrenzt die *Verbindungsbegrenzung*, *wie viele Verbindungen gleichzeitig* offen sein dürfen. Beides schützt vor Missbrauch, aber vor unterschiedlichen Mustern: Ein Client, der viele langsame, lange Verbindungen hält, bleibt unter jeder Anfragerate und belegt trotzdem Arbeiter. Bei Nginx übernimmt `ngx_http_limit_conn_module` diese Aufgabe, ähnlich aufgebaut wie die Ratenbegrenzung:

```nginx
http {
    limit_conn_zone $binary_remote_addr zone=conn:1m;
    limit_conn_status 429;

    server {
        location /downloads/ {
            limit_conn conn 2;
        }
    }
}
```

Die Zone `conn` zählt die Verbindungen je Adresse, und `limit_conn conn 2` erlaubt höchstens zwei gleichzeitig in dieser Location. Der Test sendete vier gleichzeitige Anfragen an eine drei Sekunden dauernde Seite. Zwei wurden sofort mit `429` abgewiesen, zwei nach drei Sekunden mit `200` beantwortet; im Fehlerprotokoll stand `limiting connections by zone "conn", client: 127.0.0.1`. Wichtig ist, was gezählt wird: Verbindungen, die gerade eine Anfrage bearbeiten und deren Kopf bereits gelesen wurde. Pro Anfrage zählt Nginx eine Verbindung; bei HTTP/2 zählt jeder gleichzeitige Strom einer Verbindung einzeln (nach der Dokumentation), so dass eine einzelne HTTP/2-Verbindung eines Browsers mit vielen parallelen Anfragen das Limit schnell erreicht. Das Limit muss deshalb für Webseiten großzügig sein (zehn oder mehr) und für Downloads knapp.

Neben dem Schlüssel *Adresse* ist ein Schlüssel *Server* nützlich: `limit_conn_zone $server_name zone=perserver:1m;` mit einem hohen Limit schützt den ganzen Virtual Host vor Überlastung, unabhängig davon, wer die Verbindungen hält. Mit `limit_rate 200k;` (Bandbreite pro Verbindung) lässt sich zusätzlich verhindern, dass wenige Downloads die Leitung füllen; zusammen mit `limit_conn` ergibt sich eine faire Aufteilung (Bandbreite je Verbindung mal erlaubte Verbindungen).

Apache begrenzt im Standardumfang nur die *Gesamtzahl* der Verbindungen und Arbeiter (`MaxRequestWorkers`, Modul 4 und Modul 11), nicht die Verbindungen *je Client*. Dafür gibt es nach meinem Kenntnisstand Zusatzmodule (`mod_qos`, `mod_limitipconn`), die ich nicht getestet habe, oder die Begrenzung in der Firewall (Verbindungszähler je Quelladresse), die vor dem Webserver wirkt und weniger kostet. Als Schutz gegen langsame Verbindungen wirkt `mod_reqtimeout` (10.7) in beiden Fällen.

### Typische Fehler.

Der erste Fehler ist ein zu niedriges Limit, das Browser mit vielen parallelen Anfragen (HTTP/2) abweist. Der zweite ist derselbe wie bei der Ratenbegrenzung: eine Adresse als Schlüssel hinter einem Proxy ohne `realip`. Der dritte ist, ein Verbindungslimit als Schutz gegen verteilte Angriffe zu betrachten: Wer von tausend Adressen aus angreift, bleibt unter jedem Limit pro Adresse.

```nginx
# falsch: zu knapp für eine Webseite mit HTTP/2
location / { limit_conn conn 2; }
# richtig: großzügig für Seiten, knapp für Downloads
location /          { limit_conn conn 20; }
location /downloads/ { limit_conn conn 2; limit_rate 500k; }
```

> **Praxisbeispiel: Download-Portale**
>
> Server, die große Dateien ausliefern, setzen typischerweise `limit_conn` und `limit_rate` nur auf den Download-Pfad. Ein einzelner Client kann dann nicht alle Arbeiter und die ganze Leitung belegen, und die übrige Seite bleibt unberührt. Zeigt das Fehlerprotokoll viele Meldungen `limiting connections`, prüft man, ob es ein Angriff oder ein zu knappes Limit ist, anhand der Verteilung der Adressen.

## 10.11 Upstream TLS

In Modul 6 ging es um die Verschlüsselung zwischen Browser und Proxy. Hinter dem Proxy läuft die Verbindung zum Backend oft unverschlüsselt (`http://`), was in einem vertrauenswürdigen, abgeschotteten Netz vertretbar sein kann. Sobald das Netz geteilt ist (Cloud, mehrere Mandanten, mehrere Standorte), oder Vorschriften Verschlüsselung *überall* verlangen, braucht auch diese Strecke TLS. Das nennt der Lehrplan *Upstream TLS*. Dabei kommt es auf zwei Dinge an: dass die Strecke verschlüsselt ist, und dass man weiß, *mit wem* man spricht. Verschlüsselung ohne Prüfung des Gegenübers schützt vor Mithören, aber nicht vor einem untergeschobenen Server.

Bei Nginx genügt für die Verschlüsselung das Schema `https://` in `proxy_pass`. Die Prüfung muss man aber *ausdrücklich* einschalten. Die Tests dieser Einheit nutzten ein Backend mit TLS (Nginx auf Port 9443) und ein selbst erzeugtes Zertifikat, ausgestellt von einer Test-Zertifizierungsstelle (CA) für den Namen `backend.internal`.

```nginx
location /sicher/ {
    proxy_pass https://127.0.0.1:9443/;
    proxy_ssl_verify              on;
    proxy_ssl_trusted_certificate /etc/nginx/tls/intern-ca.pem;
    proxy_ssl_name                backend.internal;
    proxy_ssl_server_name         on;
}
```

Die Zeilen bedeuten: `proxy_ssl_verify on` schaltet die Prüfung des Zertifikats ein; `proxy_ssl_trusted_certificate` nennt die Datei mit den vertrauten Zertifizierungsstellen (hier die interne CA); `proxy_ssl_name` legt den Namen fest, gegen den das Zertifikat geprüft wird; `proxy_ssl_server_name on` sendet diesen Namen außerdem als *SNI* an das Backend (Modul 6), damit ein Backend mit mehreren Zertifikaten das richtige wählt. Die Wirkung im Test:

```text
ohne proxy_ssl_verify (Standard)                       -> 200 (keine Prüfung)
verify on, Ziel 127.0.0.1, ohne proxy_ssl_name         -> 502
verify on, proxy_ssl_name backend.internal             -> 200
verify on, proxy_ssl_name other.internal               -> 502
verify on, ohne proxy_ssl_trusted_certificate          -> nginx -t scheitert
```

Die erste Zeile ist der wichtigste Befund: *Ohne* `proxy_ssl_verify on` verbindet sich Nginx mit jedem Zertifikat und akzeptiert auch ein falsches; die Verschlüsselung ist dann nur ein Schein gegenüber einem aktiven Angreifer im Netz. Bei eingeschalteter Prüfung gegen die IP-Adresse scheiterte die Verbindung, weil das Zertifikat nur den Namen `backend.internal` trägt; im Fehlerprotokoll stand `upstream SSL certificate does not match "127.0.0.1" while SSL handshaking to upstream`. Mit dem richtigen Namen (`proxy_ssl_name`) gelang der Aufruf, mit einem falschen scheiterte er mit `does not match "other.internal"`. Fehlt die Datei der vertrauten CAs, lehnt schon `nginx -t` die Konfiguration ab: `no proxy_ssl_trusted_certificate for proxy_ssl_verify`. Die Reihenfolge der Prüfungen ist also: erst der Konfigurationstest, dann die Namensprüfung, dann die Kette (die Prüfung der Kette gegen die CA ist in diesen Tests implizit mit eingeschlossen; ich habe sie nicht getrennt mit einer falschen CA durchgespielt).

Bei Apache gibt es den vergleichbaren Satz an Direktiven:

```apache
SSLProxyEngine On
<Proxy "https://backend.internal:9443/">
    SSLProxyVerify require
    SSLProxyCACertificateFile /etc/apache2/tls/intern-ca.pem
    SSLProxyCheckPeerName on
</Proxy>
ProxyPass "/sicher/" "https://backend.internal:9443/"
```

`SSLProxyEngine On` erlaubt TLS zu Backends überhaupt, `SSLProxyVerify require` verlangt ein gültiges Zertifikat, `SSLProxyCACertificateFile` nennt die vertrauten CAs, und `SSLProxyCheckPeerName on` prüft den Namen. Der Test brachte zwei Erkenntnisse. Erstens: Die Direktiven sind nur im Server-Kontext und in einem `Proxy`-Abschnitt erlaubt, *nicht* in einem `Location`-Block; der erste Versuch endete mit `SSLProxyVerify not allowed in <Location> context`. Zweitens: Die Apache-Voreinstellung ist weniger lax als die von Nginx. Mit der Voreinstellung (`SSLProxyVerify none`) antwortete das Backend über den Namen `backend.internal` mit `200`, obwohl die CA nicht als vertraut eingetragen war: Die Namensprüfung (`SSLProxyCheckPeerName`, voreingestellt an) lief also, die Prüfung der Kette nicht. Über die IP-Adresse (kein passender Name im Zertifikat) lieferte Apache `500` (Proxy Error, *Error during SSL Handshake with remote server*), und erst mit `SSLProxyCheckPeerName off` und `SSLProxyCheckPeerCN off` kam wieder `200`, ein Zustand ohne jede Prüfung. Mit den Direktiven oben (Kette und Name) antwortete der Server über den Namen mit `200`. Zum Vergleich der beiden Programme: Nginx prüft ohne Einstellung nichts, Apache prüft den Namen, aber nicht die Kette; keines der beiden Programme ist ohne Zutun „sicher“.

Zwei Erweiterungen sind in der Praxis wichtig, wurden aber nicht getestet. Die erste ist *gegenseitige Authentifizierung* (*mutual TLS*): Das Backend verlangt vom Proxy ein Client-Zertifikat und lässt nur ihn herein. Nginx stellt dafür `proxy_ssl_certificate` und `proxy_ssl_certificate_key` bereit (nach der Dokumentation), Apache `SSLProxyMachineCertificateFile`. Die zweite ist die Wahl der Protokolle und Cipher für die Strecke (`proxy_ssl_protocols`, `SSLProxyProtocol`), die man wie in Modul 6 auf TLS 1.2 und 1.3 beschränkt. Zur Verwaltung gehört außerdem der Ablauf der *internen* Zertifikate: Sie laufen wie alle ab (Modul 6), und ein vergessenes Backend-Zertifikat legt den Dienst lahm, weil der Proxy es nun zu Recht ablehnt.

### Typische Fehler.

Der erste Fehler ist `https://` im `proxy_pass` ohne `proxy_ssl_verify on` und das Gefühl, damit abgesichert zu sein. Der zweite ist, die Prüfung mit der IP-Adresse des Backends zu betreiben, obwohl das Zertifikat nur Namen enthält; man trägt den Namen als `proxy_ssl_name` ein oder stellt das Zertifikat mit passender Adresse (SAN) aus. Der dritte ist, bei Fehlern die Prüfung abzuschalten statt das Zertifikat zu reparieren.

```nginx
# falsch: verschlüsselt, aber ungeprüft
proxy_pass https://backend.internal:9443/;
# richtig: Prüfung mit eigener CA und Namen
proxy_pass https://backend.internal:9443/;
proxy_ssl_verify on;
proxy_ssl_trusted_certificate /etc/nginx/tls/intern-ca.pem;
```

> **Praxisbeispiel: Zero-Trust im Rechenzentrum**
>
> In Umgebungen nach dem Zero-Trust-Gedanken gilt das interne Netz nicht mehr als sicher. Jede Verbindung zwischen Diensten wird verschlüsselt und gegenseitig authentifiziert, oft mit kurzlebigen Zertifikaten einer eigenen CA. Der Webserver als Proxy ist dort einer von vielen Teilnehmern und muss Backend-Zertifikate prüfen und selbst ein Zertifikat vorzeigen können.

## Übungsaufgaben

Die praktischen Aufgaben lassen sich mit einem lokalen Testserver nachvollziehen; bitte nur gegen eigene Systeme. Die Lösungen stehen im nächsten Abschnitt.

**Aufgabe 1 (leicht).** Erkläre, warum der Webserver-Elternprozess als `root` läuft, die Arbeiter aber nicht. Welche Rechte sollte das Webroot haben?

**Aufgabe 2 (leicht).** Welche Antwort-Header verraten Informationen über den Server, und welche Direktiven begrenzen sie bei Apache und Nginx?

**Aufgabe 3 (leicht).** Worin unterscheiden sich 401 und 403, und was bedeuten die Fehlermeldungen `authentication failure` und `authorization failure` bei Apache?

**Aufgabe 4 (mittel).** Warum gehört bei Sicherheits-Headern in Apache `always` und in Nginx `always` hinter jede Zeile? Welche zusätzliche Falle gibt es bei Nginx?

**Aufgabe 5 (mittel).** Ein Apache-Paket meldet Version 2.4.58, die aktuelle Upstream-Version ist 2.4.69. Ist der Server damit verwundbar? Wie stellst du es fest?

**Aufgabe 6 (praktisch).** Schreibe eine Nginx-Konfiguration, die die Adresse `/verwaltung/` nur aus `10.0.0.0/8` zulässt und zusätzlich ein Passwort verlangt, wenn der Zugriff von außerhalb kommt (nicht beides auf einmal).

**Aufgabe 7 (praktisch).** Schreibe eine Ratenbegrenzung für die Anmeldeadresse `/login` (eine Anfrage pro Sekunde je Adresse, Burst 3, Status 429) und beschreibe, wie du sie testest.

**Aufgabe 8 (schwer).** Nach Einrichtung der Ratenbegrenzung hinter einem Lastverteiler sind alle Besucher gesperrt, sobald einer die Grenze überschreitet. Erkläre die Ursache und die Lösung. Welches Risiko birgt die Lösung?

**Aufgabe 9 (schwer).** Ein Proxy nutzt `proxy_pass https://10.0.0.20/;` ohne weitere TLS-Direktiven. Ein Prüfer sagt, die Strecke sei „verschlüsselt, aber nicht gesichert“. Begründe das und schreibe die korrigierte Konfiguration.

## Lösungen und Erklärungen

**Lösung 1.** Die Ports 80 und 443 sind unter Linux privilegiert; nur ein Prozess mit entsprechenden Rechten darf sie öffnen. Danach geben die Arbeiter die Rechte ab und laufen als `www-data`, damit ein übernommener Arbeiter nur eingeschränkt handeln kann. Das Webroot sollte `root` (oder einem Deploy-Benutzer) gehören, Verzeichnisse `755`, Dateien `644`; nur gezielte Upload- und Zwischenspeicher-Verzeichnisse sind für den Webprozess beschreibbar. Im Test konnte `www-data` eine solche Datei lesen, aber nicht schreiben (`Permission denied`).

**Lösung 2.** Der Header `Server` (und Fehlerseiten mit Signatur), außerdem `X-Powered-By` von Anwendungen. Apache: `ServerTokens Prod` und `ServerSignature Off`; Nginx: `server_tokens off;`. Im Test blieb bei Apache `Server: Apache` und bei Nginx `Server: nginx`. Das ist Verschleierung und ersetzt keine Updates.

**Lösung 3.** 401 bedeutet fehlende oder falsche Anmeldung, 403 bedeutet verweigert trotz oder unabhängig von der Anmeldung (zum Beispiel Adressregel). `authentication failure` (AH01617) heißt: Das Passwort war falsch. `authorization failure` (AH01631) heißt: Das Passwort war richtig, aber der Benutzer ist nicht berechtigt; Apache antwortet auch dabei mit 401, wie der Test mit `Require user anna` und dem Benutzer `bob` zeigte.

**Lösung 4.** Ohne `always` werden die Header nur bei Erfolgsantworten gesetzt. Fehlerseiten (404, 500) blieben ungeschützt; im Test fehlte der Header ohne `always` bei 404 in beiden Servern. Die zusätzliche Nginx-Falle ist die Vererbung: Eine `add_header`-Zeile in einer `location` hebt die geerbten Zeilen der äußeren Ebene auf. Abhilfe: eine gemeinsame Datei, die in jede Location eingebunden wird.

**Lösung 5.** Nicht zwingend. Ubuntu und andere Distributionen portieren Sicherheitskorrekturen zurück und erhöhen die Upstream-Version nicht. Man prüft den Paketstand (`dpkg -l apache2`) und das Änderungsprotokoll (`changelog.Debian.gz`) auf die Schwachstellen-Nummern und vergleicht mit den Sicherheitsmitteilungen der Distribution. Im Test stand im Protokoll von `2.4.58-1ubuntu8.17` eine lange Liste von Korrekturen.

**Lösung 6.**

```nginx
location /verwaltung/ {
    satisfy any;
    allow 10.0.0.0/8;
    deny  all;
    auth_basic           "Verwaltung";
    auth_basic_user_file /etc/nginx/htpasswd;
}
```

Mit `satisfy any` genügt eine der Bedingungen: Adresse aus dem Netz *oder* gültiges Passwort. Ohne `satisfy any` wäre es `satisfy all`, also beides gleichzeitig. Im Test blieb der Zugriff aus einem nicht freigegebenen Netz ohne Passwort bei `401`, mit Passwort bei `200`. Hinter einem Proxy braucht die Adresse `realip`.

**Lösung 7.**

```nginx
http {
    limit_req_zone $binary_remote_addr zone=login:1m rate=1r/s;
    limit_req_status 429;
    server {
        location = /login {
            limit_req zone=login burst=3 nodelay;
            proxy_pass http://app;
        }
    }
}
```

Test: `for i in $(seq 1 10); do curl -s -o /dev/null -w "%{http_code} " http://localhost/login; done`. Erwartet werden einige `200` (Anfangsdurchlass durch den Burst) und danach `429`. Das Fehlerprotokoll zeigt `limiting requests, excess: ... by zone "login"`.

**Lösung 8.** Nginx sieht als Client-Adresse nur die des Lastverteilers, so dass alle Besucher denselben Eimer teilen. Lösung: `set_real_ip_from` mit der Adresse des Lastverteilers und `real_ip_header X-Forwarded-For` (Einheit 7.10), damit `$binary_remote_addr` die echte Client-Adresse trägt. Das Risiko: Ist die vertraute Liste zu weit, kann jeder den Header fälschen und sich so Eimer „mieten“ oder fremde Adressen sperren lassen; die Liste darf nur den eigenen Lastverteiler enthalten.

**Lösung 9.** Mit `https://` ist die Strecke verschlüsselt, aber Nginx prüft das Zertifikat des Backends nicht (im Test: Standard ohne `proxy_ssl_verify` akzeptierte jedes Zertifikat). Ein Angreifer im Netz könnte sich als Backend ausgeben. Korrektur:

```nginx
proxy_pass https://backend.internal/;
proxy_ssl_verify              on;
proxy_ssl_trusted_certificate /etc/nginx/tls/intern-ca.pem;
proxy_ssl_name                backend.internal;
proxy_ssl_server_name         on;
```

Zusätzlich muss das Backend-Zertifikat den Namen `backend.internal` im SAN tragen; eine reine IP-Adresse im `proxy_pass` würde ohne passenden Eintrag fehlschlagen, wie der Test zeigte (`does not match "127.0.0.1"`).
