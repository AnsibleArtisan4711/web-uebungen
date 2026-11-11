# Modul 12 - Automation, CI-CD und Infrastructure as Code

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Listings unverändert, farbige Boxen als Zitatblöcke mit fettem Titel, Tabellen als Markdown-Tabellen, Übungsaufgaben und Lösungen als Absätze bzw. Überschriften). Die Lerneinheiten sind wie in der Quelle nach Modul nummeriert (12.1 bis 12.9), danach folgen „Übungsaufgaben“ (9) und „Lösungen und Erklärungen“. **Die Konfigurationen und Befehle wurden für dieses Repository nicht ausgeführt:** Laut Einleitung hat der Autor die Beispiele in einer Linux-Umgebung (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0) ausgeführt; nicht getestet sind laut Skript Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt. Viele Beispiele ändern Server-Konfiguration, Zertifikate, Rechte oder Dienste: nur in einer Testumgebung ausprobieren. Übersicht zum Modul: [README](README.md).

**Geplante Dauer:** 10 h | **Priorität:** 2 | **Lerneinheiten:** 9

## Lerneinheiten laut Lehrplan

| **Nr.** | **Lerneinheit**     | **Dauer (h)** | **Prio** |
|--------:|:--------------------|--------------:|---------:|
|    12.1 | Ansible Rollen      |             1 |        2 |
|    12.2 | Template-Management |             1 |        2 |
|    12.3 | Container Images    |           1,5 |        2 |
|    12.4 | CI/CD Tests         |             1 |        2 |
|    12.5 | Policy-as-Code      |             1 |        2 |
|    12.6 | Secrets Management  |           1,5 |        3 |
|    12.7 | Blue-Green Releases |             1 |        3 |
|    12.8 | Release Runbooks    |             1 |        3 |
|    12.9 | Kubernetes Ingress  |             1 |        2 |
|         | **Summe**           |        **10** |          |

## Überblick und Lernweg

Bisher wurde jeder Webserver in diesem Kurs von Hand konfiguriert: Datei öffnen, Direktive ändern, Konfiguration prüfen, Dienst neu laden. Das funktioniert für einen Server und einen Techniker. Es versagt, sobald es zehn Server sind, mehrere Umgebungen (Test, Abnahme, Produktion) oder mehrere Personen, die Änderungen vornehmen. Dann entstehen Abweichungen, die niemand mehr nachvollziehen kann: Server, die „irgendwie anders“ konfiguriert sind, Änderungen ohne Spur, Wiederherstellung aus dem Gedächtnis. *Infrastructure as Code* (IaC) ist die Antwort darauf: Die Konfiguration wird als Text beschrieben, in einer Versionsverwaltung abgelegt, getestet und von einem Werkzeug auf die Server gebracht. Dasselbe Ergebnis lässt sich jederzeit reproduzieren.

Dieses Modul behandelt die Bausteine dieses Vorgehens für Webserver, in einer Reihenfolge, die dem Lehrplan folgt. Zuerst kommt die Beschreibung der Konfiguration: Ansible-Rollen (12.1) und Vorlagen (12.2). Dann die Verpackung als Container-Abbild (12.3). Es folgt die Absicherung der Änderungen: automatische Tests (12.4), Richtlinien als Code (12.5) und der Umgang mit Geheimnissen (12.6). Den Abschluss bildet das Ausrollen: Blue-Green-Umschaltung (12.7), das Dokument, das einen Ausrollvorgang wiederholbar macht (12.8), und der Betrieb eines Nginx als Eingangstor in einem Kubernetes-Cluster (12.9).

> **Merke**
>
> Die Beispiele dieses Moduls wurden auf dem Testsystem tatsächlich ausgeführt, soweit es möglich war: Ansible-Rolle, Vorlagen, Tresor (`ansible-vault`), Verschlüsselung mit `age`, Prüfskripte, Blue-Green-Skript und die Validierung eines Kubernetes-Manifests liefen. *Nicht* ausgeführt wurden Container-Builds (auf dem Testsystem lief kein Docker-Dienst), eine Pipeline in einem echten CI-System und ein echter Kubernetes-Cluster. Solche Beispiele sind im Text ausdrücklich als nicht getestet gekennzeichnet. Ansible-Version im Test: ansible-core 2.21.5.

Zwei Grundgedanken tragen das ganze Modul. Der erste heißt *Idempotenz*: Eine Operation, die man beliebig oft ausführen kann und die danach immer denselben Zustand herstellt, ohne bei Wiederholung etwas zu ändern. Ansible-Module sind so entworfen; ein zweiter Lauf desselben Playbooks soll `changed=0` melden. Der zweite heißt *Prüfen vor Wirken*: Jede Änderung wird zuerst ohne Folgen getestet (Syntax, Richtlinien, Probe-Lauf), bevor sie Besucher erreicht.

## 12.1 Ansible Rollen

*Ansible* ist ein Werkzeug, das Server über SSH konfiguriert, ohne dass auf den Zielsystemen ein eigenes Programm laufen muss (*agentenlos*). Die Beschreibung steht in YAML-Dateien, den *Playbooks*. Ein Playbook sagt: Auf diesen Servern sollen diese Aufgaben (*Tasks*) ausgeführt werden. Jede Aufgabe ruft ein *Modul* auf (etwa `template`, `file`, `command`). Ein Modul beschreibt den *gewünschten Zustand*, nicht den Weg dorthin; es prüft zuerst, ob der Zustand schon besteht, und ändert nur, wenn nötig.

Eine *Rolle* (*role*) bündelt zusammengehörige Aufgaben, Vorlagen, Voreinstellungen und Handler zu einer wiederverwendbaren Einheit, zum Beispiel „Nginx einrichten“. Eine Rolle hat eine feste Verzeichnisstruktur, die Ansible automatisch erkennt. Nach dem Kenntnisstand des Autors (die Dokumentationsseite ließ sich nicht abrufen; die Struktur wurde im Test benutzt und funktioniert) sind die wichtigsten Verzeichnisse: `tasks/` (die Aufgaben, Einstieg ist `main.yml`), `handlers/` (Aufgaben, die nur nach einer Änderung laufen), `defaults/` (Standardwerte der Variablen, die sich leicht überschreiben lassen), `templates/` (Vorlagen), `files/` (feste Dateien), `vars/` (fest eingebaute Variablen mit hoher Vorrangstufe) und `meta/` (Beschreibung, Abhängigkeiten).

Die folgende Rolle richtet Nginx-Konfigurationsdateien ein. Zuerst die Standardwerte in `defaults/main.yml`:

```bash
# roles/web_nginx/defaults/main.yml
---
web_nginx_root: /tmp/m12
web_nginx_conf_dir: "{{ web_nginx_root }}/etc/nginx"
web_nginx_worker_processes: auto
web_nginx_worker_connections: 1024
web_nginx_server_tokens: "off"
web_nginx_sites:
  - name: shop
    port: 8301
    server_name: shop.example
    root: /tmp/m11/www
    tls: false
web_nginx_reload: true
```

Alle Werte sind Variablen mit dem Rollennamen als Vorsilbe (`web_nginx_`). Das ist eine Konvention, die `ansible-lint` einfordert (Regel `var-naming[no-role-prefix]`), damit Variablen verschiedener Rollen sich nicht überschreiben. Im Test zeigt `web_nginx_root` auf ein Verzeichnis unter `/tmp`, damit das System nicht verändert wird; auf einem echten Server wäre der Wert `/etc/nginx`. `web_nginx_sites` ist eine Liste: Für jeden Eintrag erzeugt die Rolle eine Konfigurationsdatei. Nun die Aufgaben in `tasks/main.yml`:

```bash
# roles/web_nginx/tasks/main.yml
---
- name: Verzeichnisse anlegen
  ansible.builtin.file:
    path: "{{ item }}"
    state: directory
    mode: "0755"
  loop:
    - "{{ web_nginx_conf_dir }}"
    - "{{ web_nginx_conf_dir }}/sites"
    - "{{ web_nginx_root }}/logs"

- name: Site-Dateien erzeugen
  ansible.builtin.template:
    src: site.conf.j2
    dest: "{{ web_nginx_conf_dir }}/sites/{{ item.name }}.conf"
    mode: "0644"
  loop: "{{ web_nginx_sites }}"
  notify: Nginx neu laden

- name: Hauptkonfiguration erzeugen
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: "{{ web_nginx_conf_dir }}/nginx.conf"
    mode: "0644"
  notify: Nginx neu laden

- name: Konfiguration prüfen
  ansible.builtin.command: "nginx -t -c {{ web_nginx_conf_dir }}/nginx.conf -p {{ web_nginx_root }}/"
  changed_when: false
```

Die erste Aufgabe stellt sicher, dass die Verzeichnisse existieren (Modul `file`, `state: directory`); sie ändert nichts, wenn sie schon da sind. Die zweite schreibt pro Eintrag der Liste eine Datei aus der Vorlage `site.conf.j2`. `loop` wiederholt die Aufgabe, `item` ist der jeweilige Eintrag. `notify` meldet dem Handler „Nginx neu laden“, dass sich etwas geändert hat. Die dritte Aufgabe schreibt die Hauptdatei, die vierte prüft die gesamte Konfiguration mit `nginx -t`. Mit `changed_when: false` wird die Prüfung nie als „geändert“ gezählt, denn sie verändert nichts; ohne diese Zeile würde `ansible-lint` die Regel `no-changed-when` melden (so im Test geschehen). Den Handler definiert `handlers/main.yml`:

```bash
# roles/web_nginx/handlers/main.yml
---
- name: Nginx neu laden
  ansible.builtin.command: "nginx -s reload -c {{ web_nginx_conf_dir }}/nginx.conf -p {{ web_nginx_root }}/"
  changed_when: true
  when: web_nginx_reload | bool
```

Ein *Handler* läuft erst am Ende des Abschnitts und nur, wenn mindestens eine Aufgabe ihn gemeldet hat, also etwas geändert wurde. Dadurch wird Nginx nach einer Änderung genau einmal neu geladen und bei unveränderter Konfiguration gar nicht. Die Bedingung `when: web_nginx_reload | bool` erlaubt es, das Neuladen abzuschalten, etwa in einer Test-Pipeline (12.4). Aufgerufen wird die Rolle von einem kleinen Playbook:

```bash
# site.yml
---
- name: Webserver konfigurieren
  hosts: web
  roles:
    - web_nginx
```

Im Test (mit `ansible_connection=local` auf dem Testrechner) verhielt sich die Rolle so. Der erste Lauf meldete zwei Änderungen (die beiden Dateien) und stieß den Handler an. Dieser scheiterte, weil noch kein Nginx lief: `invalid PID number "" in "/tmp/m12/nginx.pid"`, Rückgabecode 1. Der zweite Lauf meldete `changed=0` und rief den Handler *nicht* erneut auf. Das ist die wichtigste Lehre des Tests: Ein Handler wird nur im selben Lauf ausgeführt, in dem er angemeldet wurde. Scheitert er, ist die Meldung verloren, und der nächste Lauf sieht keine Änderung mehr, weil die Dateien schon stimmen. Die Konfiguration auf der Platte und der laufende Server können so auseinanderlaufen. Nach dem Kenntnisstand des Autors (nicht getestet) gibt es die Kommandozeilenoption `--force-handlers`, die Handler auch nach einem Fehler in derselben Ausführung laufen lässt; sie ersetzt aber nicht den Entwurf, dass das Neuladen auch nach einem früheren Fehlschlag nachgeholt werden kann, etwa durch ein Modul, das den Zustand „Dienst läuft mit aktueller Konfiguration“ beschreibt.

Nachdem ein Nginx lief, änderte der Lauf mit `-e web_nginx_worker_connections=2048` die Hauptdatei, `nginx -t` bestand, und der Handler lief (`RUNNING HANDLER ... changed`). Der Wiederholungslauf mit demselben Wert meldete `changed=0`; das ist die erwünschte Idempotenz. Mit `--check --diff` lässt sich die Wirkung vorab sehen, ohne etwas zu ändern: Ansible zeigt für jede Vorlage, welche Zeilen sich ändern würden, im Test zum Beispiel `+    ssl_protocols TLSv1.2 TLSv1.3;` und `+    location /health { return 204; }`.

Wichtig ist auch die Rolle der Prüfaufgabe am Ende. Der Test mit einer fehlerhaften Site (leerer Port) zeigte: Der Lauf schlug an der Aufgabe „Konfiguration prüfen“ mit `[emerg] invalid number of arguments` fehl, und zwar *bei jedem weiteren Lauf*, solange der Fehler bestand (`changed=0, failed=1`). Das ist erwünscht: Eine kaputte Konfiguration wird nicht stillschweigend akzeptiert. Allerdings lag die fehlerhafte Datei danach auf der Platte. Ein bereits laufender Nginx bleibt unberührt, weil der Handler nicht lief; ein Neustart des Rechners würde ihn aber mit der fehlerhaften Konfiguration starten. Bei Apache ist dieser Weg einfacher, wenn die Konfiguration aus einer einzigen Datei besteht: Das Modul `template` hat den Parameter `validate`, der die Datei vor dem Ersetzen prüft.

```bash
- name: Konfiguration erzeugen
  ansible.builtin.template:
    src: httpd.conf.j2
    dest: "{{ web_apache_root }}/httpd.conf"
    mode: "0644"
    validate: "apache2 -t -f %s"
  notify: Apache sanft neu starten
```

`%s` steht für die temporäre Datei, die Ansible zuerst schreibt und mit dem angegebenen Befehl prüft. Im Test (Apache 2.4.58) endete ein Lauf mit leerem Port in `failed to validate` und der Fehlermeldung `AH00526: Syntax error on line 6 ...`; die vorhandene Konfigurationsdatei blieb unverändert (die Zeile `Listen 8331` stand weiterhin darin). Der Handler `Apache sanft neu starten` ruft `apache2 -f ... -k graceful` auf.

### Typische Fehler.

Der erste Fehler sind Tasks ohne `name` und ohne klare Zustandsbeschreibung; ein Playbook, das fast nur aus `command` und `shell` besteht, ist ein Skript im YAML-Gewand und nicht idempotent. Der zweite ist, die Prüfung nur im Handler zu machen, so dass eine kaputte Datei unbemerkt auf der Platte liegt. Der dritte ist, sich auf das Nachholen eines gescheiterten Handlers zu verlassen (siehe oben).

```bash
# falsch: nicht idempotent, schreibt bei jedem Lauf und meldet immer "changed"
- ansible.builtin.shell: echo "server_tokens off;" >> /etc/nginx/nginx.conf

# richtig: Zeile genau einmal sicherstellen
- ansible.builtin.lineinfile:
    path: /etc/nginx/conf.d/hardening.conf
    line: "server_tokens off;"
    create: true
    mode: "0644"
```

> **Praxisbeispiel: Ein Team, eine Rolle**
>
> In einem Betrieb mit 20 Webservern liegt die Rolle in einem Git-Repository. Eine Änderung (etwa neue Zeitlimits) läuft als Änderungsantrag: Jemand ändert die Standardwerte, ein Kollege prüft, die Pipeline testet (12.4), und das Playbook rollt auf Test und später Produktion aus. Der Verlauf in Git beantwortet später Fragen wie „Wer hat wann `keepalive_timeout` geändert, und warum?“ Ohne Rolle steht diese Antwort in keinem System.

## 12.2 Template-Management

Eine *Vorlage* (*template*) ist eine Konfigurationsdatei mit Lücken, die Ansible beim Ausrollen mit Werten füllt. Damit schreibt man *eine* Vorlage für alle Server und setzt pro Server oder Umgebung nur die Werte, die sich unterscheiden: Portnummern, Servernamen, Pfade, Grenzwerte. Die Vorlagensprache heißt *Jinja2*. Sie kennt drei Schreibweisen: `{{ ausdruck }}` gibt einen Wert aus, `{% anweisung %}` steuert den Ablauf (Bedingungen, Schleifen), und `{# text #}` ist ein Kommentar, der nicht in der Ausgabe erscheint.

Die Vorlage der Rolle aus 12.1 zeigt alle drei Elemente. Sie erzeugt eine Site-Datei:

```text
# {{ ansible_managed }}
server {
    listen {{ item.port }};
    server_name {{ item.server_name }};
    root {{ item.root }};
{% if item.tls | default(false) %}
    ssl_protocols TLSv1.2 TLSv1.3;
{% endif %}
{% for loc in item.locations | default([]) %}
    location {{ loc.path }} { return {{ loc.status }}; }
{% endfor %}
}
```

Die erste Zeile gibt die Variable `ansible_managed` aus. Sie enthält einen Hinweis, dass die Datei von Ansible erzeugt wurde, und warnt so jeden, der sie von Hand ändern will: Die Änderung würde beim nächsten Lauf überschrieben. Die Zeilen `listen`, `server_name` und `root` füllen Werte aus dem jeweiligen Eintrag der Liste ein. Die Anweisung `if` fügt die Zeile `ssl_protocols` nur ein, wenn `item.tls` wahr ist; der Filter `default(false)` liefert `false`, wenn der Eintrag den Schlüssel gar nicht hat. Die `for`-Schleife erzeugt für jeden Eintrag der Liste `locations` eine `location`-Zeile und läuft null Mal, wenn die Liste fehlt (`default([])`).

Im Test erzeugte die Vorlage ohne zusätzliche Leerzeilen sauberen Nginx-Text, obwohl die Zeilen mit `{% ... %}` eigene Zeilen belegen: Das Ansible-Modul `template` entfernt nach den Anweisungen den Zeilenumbruch (Voreinstellung `trim_blocks`, nach dem Kenntnisstand des Autors; die Beobachtung im Test ist das Fehlen der Leerzeilen im Unterschied). Der Probelauf `--check --diff` mit `tls: true` und einer Location `/health` zeigte genau die zwei neuen Zeilen.

Variablen kommen aus mehreren Quellen: aus den Standardwerten der Rolle, aus `group_vars` (Werte für eine Gruppe von Servern, zum Beispiel alle Produktivserver), aus `host_vars` (für einen einzelnen Server) und aus der Kommandozeile (`-e`). Wenn eine Variable mehrfach definiert ist, gewinnt nach festgelegter Rangfolge die speziellere Quelle; die Standardwerte der Rolle haben nach dem Kenntnisstand des Autors den niedrigsten Rang, die Kommandozeile den höchsten. Dieser Mechanismus ist es, der „eine Vorlage, viele Umgebungen“ möglich macht:

```bash
# group_vars/produktion.yml
web_nginx_worker_connections: 8192
web_nginx_server_tokens: "off"

# group_vars/test.yml
web_nginx_worker_connections: 512
```

Hier erhält jede Gruppe ihre eigenen Werte, die Vorlage bleibt unverändert. Der Vorteil ist, dass sich Test und Produktion nur dort unterscheiden, wo es ausdrücklich in den Variablen steht; das macht Abweichungen sichtbar.

Drei Fallen sind typisch. Die erste: eine *fehlende Variable*. Das Ansible-Verhalten ist hier streng, und das ist gut so. Im Test enthielt die Vorlage `item.servername` statt `item.server_name`; der Lauf brach mit `object of type 'dict' has no attribute 'servername'` ab, statt eine leere Direktive zu erzeugen, die Nginx erst später ablehnen würde. Die zweite: *YAML-Anführungszeichen*. Ein Wert, der mit `{{` beginnt, muss in Anführungszeichen stehen, sonst liest YAML die geschweiften Klammern als eigene Struktur. Im Test meldete Ansible für `msg: {{ web_nginx_root }}/x` den Fehler `YAML parsing failed: This may be an issue with missing quotes around a template block`. Die dritte: *Zeichen, die Jinja2 selbst verwendet*. Wenn eine Konfigurationsdatei ausnahmsweise `{{` oder `{%` wörtlich enthalten soll (zum Beispiel ein Prometheus-Text mit Go-Vorlagen), schützt man den Abschnitt mit `{% raw %} ... {% endraw %}` (Fachwissen des Autors, nicht getestet). Die Variablen von Nginx (`$host`) und Apache (`%{REQUEST_URI}`) stören Jinja2 nicht, weil sie weder `{{` noch `{%` verwenden.

### Typische Fehler.

Der häufigste ist, Vorlagen mit eingebauten Servernamen und Pfaden zu schreiben, so dass sie nur für eine Umgebung taugen. Ein zweiter ist die Unordnung bei der Variablenvergabe: Dieselbe Einstellung steht in fünf Dateien, und niemand weiß, welche gilt. Ein dritter sind Vorlagen mit Logik, die nicht in die Vorlage gehört (komplizierte Berechnungen); Berechnungen gehören in die Variablen oder in eigene Aufgaben.

```text
# falsch: Wert fest eingebaut, nur für Produktion tauglich
worker_connections 8192;

# richtig: Wert aus Variable, in group_vars je Umgebung gesetzt
worker_connections {{ web_nginx_worker_connections }};
```

> **Praxisbeispiel: Die Abweichung finden**
>
> Ein Server in der Produktion verhält sich anders als seine Brüder. Mit Vorlagen und Variablen im Repository ist die Suche einfach: Ein Probelauf `ansible-playbook --check --diff` zeigt, wo die Datei auf dem Server von dem abweicht, was die Vorlage erzeugen würde. Die Abweichung ist entweder ein Handeingriff (dann zurücksetzen oder in die Vorlage übernehmen) oder ein Fehler in den Variablen.

## 12.3 Container Images

Ein *Container* ist ein isolierter Prozess mit eigenem Dateisystem, der auf dem Kernel des Wirtsrechners läuft. Ein *Abbild* (englisch *image*) ist die unveränderliche Vorlage, aus der Container gestartet werden: Es besteht aus mehreren *Schichten* (*layers*), die jeweils die Ergebnisse eines Build-Schrittes enthalten. Ein *Dockerfile* ist die Bauanleitung. Für Webserver hat das einen großen Vorteil: Das Abbild enthält Server, Konfiguration und Inhalte in einer festen Version, und derselbe Aufbau läuft auf dem Laptop des Entwicklers, in der Testumgebung und in der Produktion.

Wer Nginx als Container betreibt, startet meist vom offiziellen Abbild. Nach der Beschreibung auf Docker Hub (abgerufen) gibt es die Varianten Standard (Debian), `-alpine` (deutlich kleiner, aber mit der anderen C-Bibliothek *musl*, die mit Software, die glibc voraussetzt, Probleme machen kann), `-slim` und `-perl`. Zum Zeitpunkt des Abrufs standen als Versionen `1.30.6` (stable) und `1.31.8` (mainline) in der Liste. Ein typisches Dockerfile für eine statische Webseite:

```text
FROM nginx:1.30.6-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/    /etc/nginx/conf.d/
COPY --chown=101:101 dist/ /usr/share/nginx/html/

RUN nginx -t

USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
```

Dieses Dockerfile wurde auf dem Testsystem *nicht gebaut*, weil dort kein Docker-Dienst lief; die einzelnen Bestandteile (Konfiguration für einen unprivilegierten Benutzer, Vorlagenersetzung) wurden aber getestet (siehe unten). Zeile für Zeile: `FROM` wählt das Basisabbild mit *festgelegter Version*, nicht `latest`, damit der Build reproduzierbar ist. `COPY` bringt Konfiguration und die fertigen Webseiten-Dateien in das Abbild. `RUN nginx -t` prüft die Konfiguration *beim Bauen*: Ein Fehler lässt den Build scheitern, statt erst im Betrieb aufzufallen. `USER 101` lässt den Prozess als unprivilegierten Benutzer laufen; 101 ist laut Docker-Hub-Beschreibung die Benutzer- und Gruppenkennung `nginx` im offiziellen Abbild. `EXPOSE 8080` dokumentiert den Port, und `HEALTHCHECK` lässt die Container-Umgebung regelmäßig prüfen, ob der Dienst antwortet.

Die Konfiguration muss zu diesem unprivilegierten Betrieb passen. Das war der wichtigste getestete Teil. Ein Nginx, der als Benutzer `www-data` (UID 33) läuft, scheitert an drei Stellen, wenn man nichts anpasst. Erstens kann er keine Ports unter 1024 öffnen: `bind() to 0.0.0.0:80 failed (13: Permission denied)`; deshalb hört das Beispiel auf 8080. Zweitens kann er die voreingestellte PID-Datei nicht schreiben: `open() "/run/nginx.pid" failed (13: Permission denied)`. Drittens brauchen die temporären Verzeichnisse (für Puffer, Abschnitt 11.10) beschreibbare Pfade. Die getestete Hauptdatei sah so aus:

```nginx
pid /tmp/m12/ct/run/nginx.pid;
error_log /tmp/m12/ct/run/error.log warn;
worker_processes 1;
events { worker_connections 256; }
http {
    access_log /tmp/m12/ct/run/access.log;
    client_body_temp_path /tmp/m12/ct/run/body;
    proxy_temp_path       /tmp/m12/ct/run/proxy;
    fastcgi_temp_path     /tmp/m12/ct/run/fcgi;
    uwsgi_temp_path       /tmp/m12/ct/run/uwsgi;
    scgi_temp_path        /tmp/m12/ct/run/scgi;
    include /tmp/m12/ct/conf.d/*.conf;
}
```

Alle schreibenden Pfade liegen in einem einzigen Verzeichnis, das dem Benutzer gehört. Mit dieser Datei bestand `nginx -t` als `www-data`, der Server startete und beantwortete `/healthz` mit `ok`; `ps` zeigte den Master-Prozess unter `www-data`. Wurde das Verzeichnis schreibgeschützt, scheiterte der Test mit `open() ".../nginx.pid" failed (13: Permission denied)`. In einem Container bedeutet das Verzeichnis ein eigenes Volume oder `tmpfs`. Die Docker-Hub-Seite nennt für ein schreibgeschütztes Dateisystem (`--read-only`) als beschreibbare Einhängepunkte `/var/cache/nginx` und `/var/run`. Der Gewinn: Wird der Prozess übernommen, kann der Angreifer das Abbild nicht verändern und hat keine Root-Rechte (Prinzip aus Modul 10, Abschnitt 10.1).

Die offiziellen Abbilder unterstützen außerdem Vorlagen für Umgebungsvariablen. Nach der Docker-Hub-Beschreibung (abgerufen) verarbeitet das Abbild beim Start alle Dateien `/etc/nginx/templates/*.template` mit `envsubst` und legt das Ergebnis ohne die Endung in `/etc/nginx/conf.d` ab; vier Variablen (`NGINX_ENVSUBST_TEMPLATE_DIR`, `_TEMPLATE_SUFFIX`, `_OUTPUT_DIR`, `_FILTER`) steuern das. Das Prinzip ließ sich im Test nachstellen. Die Vorlage:

```nginx
server {
    listen ${PORT};
    server_name _;
    location / { proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT}; }
    location = /healthz { return 200 "ok\n"; }
}
```

wurde mit `PORT=8310 BACKEND_HOST=127.0.0.1 BACKEND_PORT=9201 envsubst '${PORT} ${BACKEND_HOST} ${BACKEND_PORT}'` verarbeitet und lieferte eine gültige Datei. Der wichtige Teil ist die Filterliste in Anführungszeichen: Ohne sie ersetzt `envsubst` *jede* Variable, auch Nginx-eigene wie `$host`. Im Test machte aus `proxy_set_header Host $host;` die Ausgabe `proxy_set_header Host ;`, weil die Umgebungsvariable `host` nicht existiert. Das offizielle Abbild löst das nach dem Kenntnisstand des Autors (nicht geprüft) über den Filter, der nur tatsächlich definierte Umgebungsvariablen ersetzt; wer `envsubst` selbst benutzt, muss die Liste angeben.

Für Apache gibt es das offizielle Abbild `httpd` mit der Version 2.4 (Kenntnisstand des Autors, nicht abgerufen). Die Hauptkonfiguration liegt dort nach dem Kenntnisstand des Autors unter `/usr/local/apache2/conf/httpd.conf`, nicht unter `/etc/apache2`; wer Konfigurationsdateien aus einer Paketinstallation übernimmt, muss die Pfade anpassen.

> **Ergänzung aus der Nachrecherche: Abbilder aktuell halten**
>
> Ein Abbild friert den Stand der Software ein, und auch Sicherheitslücken. Ein Abbild, das ein halbes Jahr nicht neu gebaut wurde, enthält ein halbes Jahr alte Pakete. Die Apache-Sicherheitsseite (abgerufen) zeigt, wie dicht die Versionen kommen: 2.4.66 am 04.12.2025, 2.4.67 am 04.05.2026, 2.4.68 am 08.06.2026 und 2.4.69 am 01.10.2026; die letzte Version behebt 20 Schwachstellen, davon fünf mit der Einstufung moderat und 15 niedrig. Nginx veröffentlichte nach der Seite nginx.org/2026.html (abgerufen) stable 1.30.6 am 14.10.2026 und mainline 1.31.8 am 21.10.2026. Daraus folgt für Abbilder: regelmäßig neu bauen (zum Beispiel nächtlich oder bei jeder neuen Basisversion), Schwachstellen im Abbild mit einem Werkzeug prüfen (nach dem Kenntnisstand des Autors zum Beispiel Trivy oder Grype; nicht getestet) und nicht `latest` in der Produktion einsetzen.

### Typische Fehler.

Der erste Fehler ist, Geheimnisse in das Abbild zu bauen (Passwörter, private Schlüssel, `ENV`-Zeilen): Jede Schicht bleibt im Abbild erhalten, auch wenn eine spätere Zeile die Datei löscht. Der zweite ist, als Root zu laufen, weil es „einfacher“ ist. Der dritte ist `latest` als Basisabbild: Der Build von morgen kann sich von dem von heute unterscheiden.

```text
# falsch: unbestimmte Version, Root, Schlüssel im Abbild
FROM nginx:latest
COPY privkey.pem /etc/ssl/private/
ENV API_TOKEN=abc123

# richtig: feste Version, unprivilegiert, Geheimnisse zur Laufzeit einbinden
FROM nginx:1.30.6-alpine
USER 101
# Schlüssel und Token als Secret/Volume beim Start, nicht im Abbild
```

> **Praxisbeispiel: Reproduzierbare Abbilder**
>
> Für den Nachweis, was genau in der Produktion läuft, genügt ein Versionsstempel nicht. Bewährt ist, Abbilder mit einem eindeutigen Namen zu versehen (Versionsnummer der Anwendung plus Build-Nummer) und beim Ausrollen die Prüfsumme (*digest*) des Abbilds zu notieren. So lässt sich nach einem Vorfall sagen, welches Abbild betroffen war, und das gleiche Abbild lässt sich erneut starten. Die Verwendung der Prüfsumme statt eines veränderlichen Etiketts entspricht dem allgemeinen Fachwissen des Autors und wurde nicht getestet.

## 12.4 CI/CD Tests

*Continuous Integration* (CI) heißt: Jede Änderung wird sofort automatisch gebaut und getestet, bevor sie in den Hauptzweig der Versionsverwaltung gelangt. *Continuous Delivery* (CD) erweitert das um den automatisierten Weg bis kurz vor die Produktion, *Continuous Deployment* bis in die Produktion selbst. Für Webserver-Konfigurationen heißt das: Niemand lädt mehr eine Datei auf den Server hoch; stattdessen läuft bei jeder Änderung eine *Pipeline*, eine Folge von Stufen, die bei einem Fehler abbricht.

Welche Tests lohnen sich bei einer Webserver-Konfiguration? Man kann sie wie eine Pyramide ordnen, von billig und schnell nach unten bis teuer und langsam nach oben. Ganz unten stehen *statische Prüfungen*: Stil der YAML-Dateien (`yamllint`), Regeln für Ansible-Code (`ansible-lint`). Darüber folgt das *Erzeugen und Prüfen* der Konfiguration: Vorlagen füllen und mit `nginx -t` oder `apache2 -t` auf Syntaxfehler prüfen. Danach kommen *Richtlinien* (12.5), dann ein *Rauchtest* (englisch *smoke test*): Der Server wird mit der erzeugten Konfiguration wirklich gestartet, und einige wenige Anfragen prüfen, ob er antwortet. Ganz oben können Lasttests stehen (Abschnitte 11.7 und 11.14), die man seltener und nur in einer geeigneten Umgebung ausführt.

Das folgende Skript ist die lokale Fassung einer solchen Pipeline. Es bricht beim ersten Fehler ab (`set -e`):

```bash
#!/bin/bash
# Lokale Fassung der Pipeline: bricht beim ersten Fehler ab
set -euo pipefail
cd "$(dirname "$0")"
rm -rf /tmp/m12/ci

echo "[1/5] YAML-Stil";            yamllint -d '{extends: relaxed, rules: {line-length: {max: 140}}}' .
echo "[2/5] Ansible-Regeln";       ansible-lint -q site.yml roles
echo "[3/5] Erzeugen und prüfen";  ansible-playbook site.yml -e @ci_vars.yml | tail -3
echo "[4/5] Richtlinien";          python3 ../pol/policy.py /tmp/m12/ci/etc/nginx/nginx.conf /tmp/m12/ci/

echo "[5/5] Rauchtest"
nginx -c /tmp/m12/ci/etc/nginx/nginx.conf -p /tmp/m12/ci/ &
pid=$!
trap 'kill $pid 2>/dev/null || true' EXIT
sleep 1
code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: shop.example' http://127.0.0.1:8321/index.html)
[ "$code" = 200 ] && echo "Rauchtest ok (HTTP $code)" || { echo "Rauchtest FEHLER (HTTP $code)"; exit 1; }
```

Die ersten zwei Stufen sind die statischen Prüfungen. Die dritte führt das Playbook mit einer eigenen Variablendatei `ci_vars.yml` aus, die ein frisches Verzeichnis `/tmp/m12/ci` und einen anderen Port wählt sowie das Neuladen abschaltet (`web_nginx_reload: false`), denn in der Pipeline läuft kein Nginx, der neu geladen werden könnte. Dabei läuft die Aufgabe `nginx -t` der Rolle mit. Die vierte Stufe ist die Richtlinienprüfung aus Abschnitt 12.5. Die fünfte startet den Server im Hintergrund, wartet kurz, schickt eine Anfrage mit dem passenden `Host`-Header und vergleicht den Statuscode. Die Zeile mit `trap` sorgt dafür, dass der Testserver auch bei einem Fehler wieder beendet wird. Das Ergebnis im Test: Alle fünf Stufen bestanden, Ausgabe `Rauchtest ok (HTTP 200)`, Rückgabecode 0. Beim ersten Durchlauf schlug die erste Stufe fehl: `yamllint` meldete einen Syntaxfehler in einer vergessenen Beispieldatei (`bad.yml`) im Verzeichnis, außerdem Zeilen über 80 Zeichen (Warnung). Das ist genau der Zweck: Die Pipeline findet Fehler, die man selbst übersieht. Die Warnung wurde durch die Anhebung des Grenzwerts auf 140 Zeichen behandelt, die Beispieldatei entfernt.

In einem echten CI-System steht dieselbe Folge in einer Pipeline-Datei. Eine Fassung für GitLab CI sieht so aus (nicht in GitLab ausgeführt, nur auf gültiges YAML geprüft):

```bash
stages: [lint, build, test]

lint:
  stage: lint
  image: python:3.13
  script:
    - pip install ansible-core ansible-lint yamllint
    - yamllint .
    - ansible-lint site.yml roles

konfiguration:
  stage: build
  image: nginx:1.30.6-alpine
  script:
    - nginx -t -c "$CI_PROJECT_DIR/build/nginx.conf" -p "$CI_PROJECT_DIR/build/"
```

Zwei Stufen, in denen die erste (`lint`) ein Python-Abbild mit den Werkzeugen nutzt und die zweite (`konfiguration`) das Nginx-Abbild, um die erzeugte Datei mit derselben Version zu prüfen, die später läuft. Es ist wichtig, die Prüfung mit der *gleichen Programmversion* wie in der Produktion zu machen, weil sich Direktiven zwischen Versionen unterscheiden.

### Typische Fehler.

Der erste Fehler ist, nur die Syntax zu prüfen: `nginx -t` meldet „successful“ für eine Konfiguration, die alle Anfragen mit 404 beantwortet. Der Rauchtest fängt das. Der zweite sind Tests gegen die Produktion statt gegen eine Kopie. Der dritte ist eine Pipeline, deren Fehler man ignoriert (`allow_failure` aus Bequemlichkeit); dann prüft sie nichts mehr.

```bash
# falsch: nur Syntax
nginx -t

# richtig: Syntax, dann echter Start und eine Anfrage
nginx -t && nginx -c conf/nginx.conf &
sleep 1; curl -fsS http://127.0.0.1:8321/healthz
```

> **Praxisbeispiel: Der Fehler im Änderungsantrag**
>
> Ein Kollege ändert eine Weiterleitung. Die Pipeline startet automatisch, der Rauchtest meldet `HTTP 301` statt der erwarteten 200 für die Startseite, und der Antrag wird abgelehnt, bevor jemand ihn zusammenführt. Ohne Pipeline hätte man den Fehler nach dem Ausrollen von Besuchern erfahren.

## 12.5 Policy-as-Code

Jede Organisation hat Regeln für ihre Webserver: keine Versionsangabe im Header, keine alten TLS-Versionen, kein Verzeichnislisting, keine Prozesse als Root. Üblicherweise stehen solche Regeln in einem Dokument, das niemand liest, und werden bei Prüfungen von Hand kontrolliert. *Policy-as-Code* (Richtlinien als Code) macht aus den Regeln ausführbare Prüfungen: Ein Programm liest die Konfiguration und meldet, welche Regel verletzt ist. Die Regeln liegen wie jeder Code in der Versionsverwaltung, werden geprüft und ändern sich nachvollziehbar. Der Nutzen ist doppelt: Verstöße werden gefunden, *bevor* die Änderung ausgerollt wird (in der Pipeline, Abschnitt 12.4), und die Regeln sind für alle gleich und wiederholbar.

Es gibt fertige Werkzeuge und selbst geschriebene Prüfungen. Fertige Werkzeuge kennen viele typische Fehler. Im Test wurde das Paket `gixy-ng` installiert (Programm `gixy`, Version 0.2.60; ein Werkzeug zur Sicherheitsanalyse von Nginx-Konfigurationen). Auf eine absichtlich schlechte Konfiguration angewendet, meldete es zwei Probleme mit der Einstufung HIGH: `[weak_ssl_tls] Insecure TLS protocols enabled` für `ssl_protocols TLSv1 TLSv1.2;` und `[version_disclosure] Do not enable server_tokens on or server_tokens build` für `server_tokens on;`. Der Vorteil solcher Werkzeuge ist, dass sie Wissen bündeln, das man nicht selbst pflegen muss. Ihr Nachteil: Sie kennen die *eigenen* Regeln der Organisation nicht. Außerdem wurde dieses Werkzeug hier nur kurz ausprobiert; es ist eine Möglichkeit unter mehreren, und das Paket `gixy-ng` ist nach dem Kenntnisstand des Autors eine Fortführung des älteren Projekts `gixy`.

Für eigene Regeln genügt oft ein kleines Programm. Das folgende liest die vollständige Konfiguration, die `nginx -T` ausgibt (alle eingebundenen Dateien zusammengefügt), und prüft vier Regeln:

```bash
#!/usr/bin/env python3
"""Policy-Prüfung für Nginx: liest die ausgegebene Gesamtkonfiguration (nginx -T)."""
import re, subprocess, sys

def lade(conf, prefix):
    r = subprocess.run(["nginx", "-T", "-c", conf, "-p", prefix], capture_output=True, text=True)
    if r.returncode != 0:
        print("FEHLER: nginx -T schlägt fehl:", r.stderr.strip()); sys.exit(2)
    # Kommentare entfernen
    return "\n".join(re.sub(r"#.*", "", z) for z in r.stderr.splitlines() + r.stdout.splitlines())

REGELN = [
    ("server_tokens muss off sein",
     lambda t: re.search(r"(?:^|[;{}\s])server_tokens\s+off\s*;", t, re.M) is not None),
    ("autoindex darf nicht on sein",
     lambda t: re.search(r"(?:^|[;{}\s])autoindex\s+on\s*;", t, re.M) is None),
    ("keine veralteten TLS-Protokolle (SSLv3, TLSv1, TLSv1.1)",
     lambda t: not any({"SSLv3", "TLSv1", "TLSv1.1"} & set(m.split())
                       for m in re.findall(r"ssl_protocols\s+([^;]*);", t))),
    ("kein 'user root'",
     lambda t: re.search(r"(?:^|[;{}\s])user\s+root\b", t, re.M) is None),
]

if __name__ == "__main__":
    t = lade(sys.argv[1], sys.argv[2])
    fehler = 0
    for name, pruefung in REGELN:
        ok = pruefung(t)
        print(("OK     " if ok else "VERSTOSS"), name)
        fehler += (not ok)
    sys.exit(1 if fehler else 0)
```

Die Funktion `lade` ruft `nginx -T` auf; diese Option prüft die Konfiguration und gibt sie samt allen eingebundenen Dateien aus. Das ist wichtig, weil man sonst nur die Hauptdatei sähe, nicht aber die Dateien, die sie einbindet. Die Meldungen von Nginx gehen auf den Fehlerkanal, deshalb werden beide Kanäle gelesen. Dann werden Kommentare entfernt, damit eine auskommentierte Zeile nicht als aktive Einstellung zählt. `REGELN` ist eine Liste aus Beschreibung und Prüffunktion; jede Funktion bekommt den gesamten Text und liefert wahr oder falsch. Das Programm gibt für jede Regel `OK` oder `VERSTOSS` aus und endet mit dem Rückgabecode 1, wenn es einen Verstoß gab; genau dieser Rückgabecode lässt die Pipeline-Stufe fehlschlagen.

Beim Testen dieses Programms zeigten sich zwei Fehler, die Lehrbuchcharakter haben. Die erste Fassung suchte jede Regel mit einem Zeilenanfang als Anker (`^\s*autoindex`). Gegen eine Konfiguration mit `server { listen 8399; autoindex on; ... }` *in einer einzigen Zeile* meldete sie `OK`, obwohl das Verzeichnislisting aktiv war, weil `autoindex` nicht am Zeilenanfang stand. Die Lösung ist, den Anfang als „Zeilenanfang oder eines der Zeichen `;`, `{`, `}` oder Leerraum“ zu fassen. Der zweite Fehler betraf die TLS-Regel: Das Muster für `TLSv1` passte auch auf `TLSv1.2`, weil der Punkt kein Wortzeichen ist, und hätte eine völlig korrekte Konfiguration abgewiesen. Die endgültige Fassung zerlegt die Direktive in einzelne Wörter und vergleicht sie mit der Menge der verbotenen Protokolle. Danach lieferte die schlechte Konfiguration drei Verstöße (`server_tokens`, `autoindex`, TLS), die gute keinen, und eine Konfiguration mit `ssl_protocols TLSv1.2 TLSv1.3;` bestand. Die Lehre: *Auch Richtlinien brauchen Tests*, und zwar mit „guten“ und mit „schlechten“ Beispielen. Eine Prüfung, die niemals fehlschlägt, schützt nicht, und eine, die gute Konfigurationen abweist, wird bald abgeschaltet.

Für größere Regelwerke gibt es spezialisierte Sprachen und Werkzeuge, bei denen Richtlinien als Daten und Regeln beschrieben werden (genannt seien nach dem Kenntnisstand des Autors, nicht getestet, *Open Policy Agent* mit der Sprache Rego und das Werkzeug *Conftest*). Ihr Vorteil ist eine einheitliche Form für viele Dateitypen (Kubernetes-Manifeste, Terraform, Konfigurationen). Für eine überschaubare Zahl von Regeln genügt ein Skript wie das obige. Ein weiteres Werkzeug der Kette ist `ansible-lint`, das Richtlinien für Ansible-Code durchsetzt; es meldete im Test die Verstöße `var-naming[no-role-prefix]` und `no-changed-when`. Für Kubernetes-Manifeste prüft `kubernetes-validate` die Struktur gegen das offizielle Schema (Abschnitt 12.9).

### Typische Fehler.

Der erste Fehler sind Regeln ohne Ausnahmeverfahren: Dann wird bei der ersten berechtigten Ausnahme die ganze Prüfung abgeschaltet. Besser ist eine dokumentierte Ausnahmeliste mit Begründung und Ablaufdatum. Der zweite sind Regeln, die man nicht testet (siehe oben). Der dritte sind zu viele Regeln auf einmal; wer mit hundert Verstößen beginnt, ignoriert alle. Man startet mit wenigen wichtigen und fügt nach und nach hinzu.

```bash
# falsch: nur die erste Zeile jeder Datei prüfen, einzeilige Blöcke rutschen durch
grep -E '^server_tokens on' nginx.conf

# richtig: die vollständig zusammengesetzte Konfiguration auswerten
nginx -T -c nginx.conf 2>&1 | grep -E 'server_tokens[[:space:]]+on'
```

> **Praxisbeispiel: Vom Audit zur Pipeline**
>
> Ein Audit stellt fest: Drei von zwanzig Servern geben die Nginx-Version preis. Man könnte sie von Hand korrigieren. Besser ist, die Regel „`server_tokens` muss `off` sein“ als Prüfung in die Pipeline aufzunehmen. Dann kann derselbe Fehler nie wieder in eine neue Konfiguration gelangen, und das Audit im nächsten Jahr findet nichts mehr.

## 12.6 Secrets Management

Ein *Geheimnis* (englisch *secret*) ist jede Information, die Zugriff gewährt: Passwörter, API-Schlüssel, Zugangsdaten zu Datenbanken, private TLS-Schlüssel, Zugangsdaten für Basic Authentication. *Secrets Management* ist der Umgang damit über den gesamten Lebenslauf: Wo liegen sie, wer darf sie lesen, wie kommen sie auf den Server, wie werden sie erneuert. Das Grundproblem bei IaC lautet: Alles gehört in die Versionsverwaltung, aber Geheimnisse dürfen dort *nicht im Klartext* stehen. Wer ein Passwort einmal in ein Git-Repository eingecheckt hat, hat es für immer im Verlauf, auch wenn die Datei später gelöscht wird, und jeder mit Lesezugriff auf das Repository kennt es.

Ansible bringt dafür den *Tresor* (`ansible-vault`) mit, der Dateien oder einzelne Werte verschlüsselt. Im Test wurde eine Variablendatei mit einem Passwort verschlüsselt:

```bash
echo 'geheim-pw-123' > .vault_pass ; chmod 600 .vault_pass
ansible-vault encrypt --vault-password-file .vault_pass group_vars/web/vault.yml
head -2 group_vars/web/vault.yml
```

Die Datei `.vault_pass` enthält das Passwort des Tresors und gehört selbst *nicht* in die Versionsverwaltung (in `.gitignore` eintragen), die Rechte `600` erlauben nur dem Besitzer das Lesen. Die Ausgabe von `head` zeigt, dass die Datei nun verschlüsselt ist: Sie beginnt mit `$ANSIBLE_VAULT;1.1;AES256`, danach folgt eine Zeichenfolge in Hexadezimalziffern. Diese Datei darf ins Repository, denn sie ist ohne das Tresor-Passwort wertlos. Ohne das Passwort bricht ein Playbook ab: `Attempting to decrypt but no vault secrets found`. Mit `ansible-vault encrypt_string` lässt sich auch ein einzelner Wert verschlüsseln; das Ergebnis (`db_pw: !vault | $ANSIBLE_VAULT;1.1;AES256 ...`) steht dann inmitten einer ansonsten lesbaren Variablendatei.

Der Tresor schützt die Daten *im Ruhezustand*. Beim Ausrollen werden sie entschlüsselt, und hier lauert eine Falle, die im Test sichtbar wurde. Ein Playbook schrieb eine Zeile `admin:{{ web_admin_password }}` in eine Datei. Lief es mit `--diff`, gab Ansible die geänderte Zeile im Klartext aus: `+admin:S3cr3t-Admin-Pw`. Der Tresor war machtlos, denn das Passwort stand nun in der Ausgabe, und damit im Protokoll der Pipeline. Die Abhilfe ist `no_log: true` an der Aufgabe, die das Geheimnis verarbeitet:

```bash
- name: htpasswd-Zeile schreiben
  ansible.builtin.copy:
    dest: /etc/nginx/.htpasswd_admin
    content: "admin:{{ web_admin_password }}\n"
    mode: "0600"
  no_log: true
```

Im Test erschien bei der Aufgabe mit `no_log` nur `changed` und kein Inhalt. Dasselbe gilt für Fehlermeldungen: Ohne `no_log` kann ein fehlgeschlagener Task die Argumente samt Geheimnis ausgeben. In diesem Beispiel stehen im Klartext ein Passwort, das in einem echten Betrieb aus einem Hash bestehen sollte (Modul 10, `htpasswd`), damit auch die Datei selbst kein Klartext enthält; der Test zeigt hier nur das Prinzip.

Ein zweites Werkzeug, das im Test lief, ist `age`, ein kleines Programm zum Verschlüsseln von Dateien mit einem Schlüsselpaar. `age-keygen -o key.txt` erzeugt das Paar; die Datei enthält den geheimen Schlüssel, und die Ausgabe nennt den öffentlichen (`Public key: age1...`). `echo 'api-token=abc123' | age -r <öffentlicher Schlüssel> -o token.age` verschlüsselt, `age -d -i key.txt token.age` entschlüsselt wieder. Die verschlüsselte Datei beginnt mit der Kennung `age-encryption.org/v1`. Das Prinzip: Jeder kann mit dem öffentlichen Schlüssel verschlüsseln, entschlüsseln kann nur, wer den geheimen besitzt. Damit kann eine Pipeline Geheimnisse für den Server verschlüsselt ablegen, ohne selbst das Entschlüsseln zu können.

Es gibt Orte, an denen Geheimnisse *nur scheinbar* geschützt sind. Das erste Beispiel ist die Kodierung *base64*: `echo -n 'api-token=abc123' | base64` liefert `YXBpLXRva2VuPWFiYzEyMw==`, und `base64 -d` stellt den Klartext sofort wieder her. Das ist eine Darstellung, keine Verschlüsselung. Das gilt auch für Kubernetes-Secrets, deren Werte base64-kodiert sind; nach dem Kenntnisstand des Autors (die Dokumentation wurde hier nicht abgerufen) liegen sie standardmäßig unverschlüsselt in der Datenbank des Clusters, und der Schutz besteht in Zugriffsrechten, in der optionalen Verschlüsselung im Ruhezustand und in externen Geheimnisspeichern. Die Seite „Good practices for Kubernetes Secrets“ der Kubernetes-Dokumentation behandelt das Thema; ihr Inhalt wurde nicht gelesen. Weitere Orte, an denen Geheimnisse ungewollt auftauchen: Container-Abbilder (jede Schicht bleibt erhalten, Abschnitt 12.3), Kommandozeilen (sichtbar in der Prozessliste), Protokolle (der Debug-Modus von Nginx schreibt den `Authorization`-Header und Cookies in die Protokolldatei, wie in Modul 9 getestet) und das Git-Verzeichnis.

> **Ergänzung aus der Nachrecherche: Erneuern und Entdecken**
>
> Zum Lebenslauf eines Geheimnisses gehört die *Erneuerung* (englisch *rotation*): Zugangsdaten werden in festen Abständen und nach jedem Verdacht ausgetauscht. Das ist nur praktikabel, wenn der Austausch automatisiert ist; mit IaC genügt es, den Wert im Tresor zu ändern und das Playbook laufen zu lassen. Zum *Entdecken* versehentlich eingecheckter Geheimnisse gibt es Werkzeuge, die Repositories nach typischen Mustern absuchen (nach dem Kenntnisstand des Autors zum Beispiel `gitleaks`; nicht getestet) und sich als Prüfung vor dem Einchecken oder in die Pipeline einbauen lassen. Wurde ein Geheimnis doch veröffentlicht, gilt es als kompromittiert: Das Löschen aus dem Verlauf genügt nicht, es muss erneuert werden. Für die Verschlüsselung privater TLS-Schlüssel auf dem Server selbst gelten die Hinweise aus Modul 6 (Rechte `600`, Besitzer `root`) und Modul 10.

### Typische Fehler.

Der erste Fehler ist ein Klartext-Passwort in einer Variablendatei im Repository, „nur für den Test“. Der zweite ist das Tresor-Passwort im selben Repository wie die verschlüsselte Datei. Der dritte ist ein Playbook mit `--diff` oder mit ausführlicher Ausgabe (`-vvv`) in einer Pipeline, deren Protokolle viele Personen lesen können.

```bash
# falsch: Passwort im Klartext in group_vars, ohne no_log
web_admin_password: "S3cr3t-Admin-Pw"

# richtig: Datei mit ansible-vault verschlüsselt, Aufgabe mit no_log: true
# group_vars/web/vault.yml beginnt mit $ANSIBLE_VAULT;1.1;AES256
```

> **Praxisbeispiel: Nach dem Ausscheiden eines Mitarbeiters**
>
> Eine Administratorin verlässt die Firma. Sie kannte das Tresor-Passwort. Wer die Geheimnisse sauber getrennt hat, kann das Tresor-Passwort wechseln (`ansible-vault rekey`, nach dem Kenntnisstand des Autors nicht getestet) und die dahinter liegenden Zugangsdaten erneuern, und zwar automatisiert. Wer alles im Klartext verstreut hat, weiß nicht einmal, was er alles ändern muss.

## 12.7 Blue-Green Releases

Bei einem *Blue-Green-Release* laufen zwei vollständige Umgebungen nebeneinander: die aktive (angenommen „blue“) und die inaktive („green“). Eine neue Version wird auf der inaktiven Seite eingespielt und dort geprüft, während Besucher weiter die alte Version nutzen. Anschließend schaltet man den Verkehr auf die neue Seite um. Geht etwas schief, schaltet man zurück; die alte Version läuft ja noch. Der Gewinn gegenüber einem Austausch am laufenden System: kaum Ausfallzeit und ein schneller, einfacher Rückweg. Modul 8 hat die technische Seite gezeigt (Umschalten über eine Variable und eine eingebundene Datei mit anschließendem Neuladen, mit 40 von 40 erfolgreichen Anfragen im Test). Hier geht es um die Automatisierung: Das Umschalten wird als Skript mit Prüfungen und Rückfall geschrieben.

Der Aufbau im Test: Zwei Backends (blue auf Port 9201, green auf 9202), ein Nginx als Proxy auf Port 8302. Die Hauptdatei bindet über `include` eine Datei `active.conf` ein; diese ist ein symbolischer Verweis (*Symlink*) auf `blue.conf` oder `green.conf`, in denen jeweils nur der `upstream`-Block steht.

```nginx
# nginx.conf
http {
  include /tmp/m12/bg/active.conf;          # Verweis auf blue.conf oder green.conf
  server { listen 8302; location / { proxy_pass http://app; } }
}
# blue.conf:  upstream app { server 127.0.0.1:9201; }
# green.conf: upstream app { server 127.0.0.1:9202; }
```

Das Umschalten besteht darin, den Verweis auf die andere Datei zu setzen und Nginx neu zu laden. Das Skript macht daraus einen kontrollierten Ablauf:

```bash
#!/bin/bash
# Blue-Green-Umschaltung mit Prüfung und Rückfall
set -euo pipefail
BASE=/tmp/m12/bg
NGX=(nginx -c "$BASE/nginx.conf" -p /tmp/m12/)

live=$(basename "$(readlink "$BASE/active.conf")" .conf)
if [ "$live" = blue ]; then neu=green; else neu=blue; fi
port=$(grep -o 'server 127.0.0.1:[0-9]*' "$BASE/$neu.conf" | cut -d: -f2)
echo "live=$live  neu=$neu (Port $port)"

umschalten() { ln -sfn "$BASE/$1.conf" "$BASE/active.conf.tmp" && mv -Tf "$BASE/active.conf.tmp" "$BASE/active.conf"; }

# 1. Kandidat direkt prüfen, bevor er Verkehr bekommt
if ! curl -fsS --max-time 3 "http://127.0.0.1:$port/health" >/dev/null; then
  echo "ABBRUCH: $neu ist nicht gesund, nichts geändert"; exit 1
fi

# 2. umschalten und Konfiguration prüfen; bei Fehler zurück
umschalten "$neu"
if ! "${NGX[@]}" -t 2>/dev/null; then
  echo "RÜCKFALL: Konfiguration ungültig, zurück auf $live"; umschalten "$live"; exit 1
fi

# 3. sanft neu laden, dann über den Proxy prüfen
"${NGX[@]}" -s reload 2>/dev/null
sleep 1
if curl -fsS --max-time 3 http://127.0.0.1:8302/ | grep -q "BACKEND=$neu"; then
  echo "ERFOLG: Verkehr läuft jetzt über $neu"
else
  echo "RÜCKFALL: Prüfung über den Proxy fehlgeschlagen, zurück auf $live"
  umschalten "$live"; "${NGX[@]}" -s reload 2>/dev/null; exit 1
fi
```

Der Ablauf in Worten: Zuerst wird anhand des Verweises ermittelt, welche Farbe aktiv ist, und die andere zum Kandidaten bestimmt; aus der Kandidatendatei liest das Skript den Port. Schritt 1 prüft den Kandidaten *direkt*, bevor irgendein Besucher ihn sieht. Schritt 2 setzt den Verweis um und prüft die Konfiguration; fällt die Prüfung durch, wird der Verweis zurückgesetzt, und es ist nichts passiert. Schritt 3 lädt Nginx neu und prüft über den Proxy, ob wirklich der Kandidat antwortet; wenn nicht, wird zurückgeschaltet. Die Funktion `umschalten` setzt den Verweis in zwei Schritten: Sie legt zunächst einen neuen Verweis unter einem Hilfsnamen an und ersetzt dann mit `mv -T` den alten durch eine Umbenennung. Eine Umbenennung ist ein einziger, nicht unterbrechbarer Vorgang des Dateisystems (Fachwissen des Autors); es gibt keinen Moment, in dem der Verweis fehlt. Das direkte Überschreiben mit `ln -sfn` löscht den alten Verweis zuerst und legt dann den neuen an.

Die vier Läufe im Test deckten alle Pfade ab. Lauf 1 (blue nach green): `ERFOLG`, die nächste Anfrage lieferte `BACKEND=green`. Lauf 2 sollte zurück auf blue; blue war jedoch gesperrt (die Gesundheitsprüfung des Testbackends lieferte 503): `ABBRUCH: blue ist nicht gesund, nichts geändert`, Rückgabecode 1; der Verweis zeigte weiter auf green, und die Anfragen liefen weiter. Lauf 3: blue war wieder gesund, aber die Datei `blue.conf` enthielt einen Syntaxfehler (fehlendes Semikolon): `RÜCKFALL: Konfiguration ungültig, zurück auf green`; der Verweis stand wieder auf green, die Anfragen wurden weiter von green beantwortet. Lauf 4 mit repariertem blue: `ERFOLG`. Ein weiterer Test schickte während der Umschaltung 40 Anfragen im Abstand von 50 ms; alle 40 lieferten `200`. Das stimmt mit dem Verhalten des sanften Neuladens überein: Nginx startet neue Arbeitsprozesse mit der neuen Konfiguration, und die alten beenden ihre laufenden Anfragen noch.

Es gibt Grenzen. Dauerhaft offene Verbindungen (WebSockets, Abschnitt 7.6) bleiben nach der Umschaltung beim alten Backend, bis sie sich schließen. Das *Datenbankschema* wird gemeinsam genutzt: Eine Änderung, die mit der alten Version nicht zurechtkommt, macht den Rückweg unmöglich. Die übliche Gegenmaßnahme ist, Änderungen in zwei Schritten zu machen (erst erweitern, dann, nach der Umschaltung, aufräumen); das ist allgemeines Fachwissen des Autors und kein Gegenstand dieses Tests. Bei Apache gelingt dasselbe mit einer eingebundenen Datei und `apachectl graceful` (nach Kenntnisstand des Autors, nicht getestet).

### Typische Fehler.

Der erste Fehler ist, den Kandidaten nicht zu prüfen, bevor er Verkehr bekommt. Der zweite ist ein Umschalten ohne Rückweg, etwa weil die alte Seite sofort abgebaut wird. Der dritte ist, nur die Konfiguration zu prüfen und nicht, ob der Kandidat wirklich antwortet (Schritt 3).

```bash
# falsch: direkt umschalten und hoffen
ln -sfn green.conf active.conf && nginx -s reload

# richtig: Kandidat prüfen, umschalten, Konfiguration prüfen, laden, über den Proxy prüfen, sonst zurück
./deploy.sh
```

> **Praxisbeispiel: Der Freitagnachmittag**
>
> Eine Auslieferung am Freitag um 16 Uhr ist mit einem Blue-Green-Skript vertretbar: Die neue Version läuft bereits und ist geprüft, die Umschaltung dauert Sekunden, und wenn die Fehlerrate steigt, genügt ein weiterer Aufruf des Skripts. Ohne diese Technik ist ein Freitagsrelease ein Wagnis. Wichtig bleibt, dass jemand die Fehlerrate nach der Umschaltung beobachtet (Abschnitt 11.8).

## 12.8 Release Runbooks

Ein *Runbook* (deutsch etwa „Betriebshandbuch“ für einen bestimmten Vorgang) ist eine schriftliche Anleitung, mit der jemand einen wiederkehrenden Vorgang korrekt ausführen kann, auch unter Zeitdruck und auch, wenn er den Vorgang nicht ständig macht. Ein *Release Runbook* beschreibt das Ausrollen einer neuen Version. Seine Aufgabe ist, Wissen aus den Köpfen zu holen: Was prüfe ich vorher? Welche Befehle führe ich in welcher Reihenfolge aus? Woran erkenne ich, dass es klappt? Wann breche ich ab, und wie gehe ich zurück?

Ein gutes Runbook hat eine feste Gliederung. Nach dem Fachwissen des Autors sind das: Zweck und Geltungsbereich; Voraussetzungen und Beteiligte; *Vorabprüfungen* (was muss stimmen, bevor man beginnt); die *Schritte*, jeweils mit dem genauen Befehl und dem erwarteten Ergebnis; *Abbruchkriterien* (feste, vorher vereinbarte Bedingungen); der *Rückweg*; die Kommunikation (wer wird wann informiert); und die Nachbereitung (Protokoll, Beobachtung). Das folgende Beispiel für die Blue-Green-Umschaltung aus Abschnitt 12.7 zeigt den Aufbau. Es bezieht sich auf das im Test verwendete Skript:

```text
RUNBOOK: Release der Webanwendung "Shop" (Blue-Green)
Zweck:        Neue Version auf die inaktive Seite einspielen und umschalten.
Verantwortl.: Release-Leitung (Durchführung), Zweitperson (Kontrolle)

VORABPRÜFUNGEN (alle müssen erfüllt sein)
 [ ] Pipeline-Lauf für die Version ist grün (Prüfungen, Richtlinien, Rauchtest)
 [ ] Backups der Datenbank sind aktuell (Zeitstempel kleiner als 24 h)
 [ ] Fehlerquote der letzten Stunde unter 1 % (Monitoring)
 [ ] Kein anderes Release oder keine Störung läuft

SCHRITTE
 1. Neue Version auf die inaktive Seite einspielen.
    Erwartet: Dienst der inaktiven Seite läuft.
 2. Kandidaten direkt prüfen:      curl -fsS http://127.0.0.1:<Port>/health
    Erwartet: HTTP 200. Sonst: ABBRUCH, nichts umgeschaltet.
 3. Umschalten:                     ./deploy.sh
    Erwartet: "ERFOLG: Verkehr läuft jetzt über <Farbe>".
 4. Beobachten (10 Minuten): Fehlerquote, 95. Perzentil der Antwortzeit.

ABBRUCHKRITERIEN (nach dem Umschalten)
 - Fehlerquote über 2 % für 2 Minuten
 - 95. Perzentil mehr als doppelt so hoch wie vorher

RÜCKWEG
 ./deploy.sh   (schaltet auf die vorherige Seite zurück, die noch läuft)
 Datenbankänderungen: nur rückwärtskompatible Änderungen sind erlaubt.

NACHBEREITUNG
 - Ergebnis, Uhrzeit, Version ins Änderungsprotokoll eintragen
 - Alte Seite erst nach 24 h abbauen
```

Beim Lesen fällt auf, was ein Runbook von einer Erinnerung unterscheidet: Es enthält *messbare* Kriterien („Fehlerquote über 2 % für 2 Minuten“) statt „wenn es schlecht aussieht“. Ein Entschluss zum Abbruch unter Druck fällt leichter, wenn die Grenze vorher gemeinsam festgelegt wurde. Außerdem gibt es einen Rückweg, der *im Voraus* geplant ist, und eine zweite Person, die kontrolliert.

Der nächste Entwicklungsschritt ist, die Schritte, die ein Mensch nur abtippt, in Skripte zu verwandeln (*Runbook as Code*). Im Beispiel ist das bereits für Schritt 3 geschehen: Das Skript enthält die Prüfungen und den Rückfall, so dass die Person nur noch ein Kommando eingibt und die Ausgabe liest. Eine menschliche Entscheidung bleibt sinnvoll an den Stellen, an denen ein Urteil nötig ist (zum Beispiel, ob die beobachtete Fehlerquote ein Problem ist). Auch das Ergebnis jedes Laufs sollte nachvollziehbar sein: Die Ausgabe des Skripts samt Uhrzeit (etwa in eine Datei umgeleitet) gehört zum Änderungsprotokoll.

Ein Runbook veraltet. Befehle ändern sich, Systeme werden umgebaut, Zuständigkeiten wechseln. Ein Runbook, das nie ausprobiert wird, ist bei einem Ernstfall fehlerhaft. Deshalb gehört das regelmäßige Durchspielen in einer Testumgebung dazu (nach dem Kenntnisstand des Autors manchmal „Game Day“ genannt), und jeder Fehler im Ernstfall führt zu einer Änderung des Runbooks.

### Typische Fehler.

Der erste Fehler ist ein Runbook ohne genaue Befehle („Dienst neu starten“ statt des Befehls samt erwartetem Ergebnis). Der zweite ist ein fehlender oder ungetesteter Rückweg. Der dritte sind Abbruchkriterien, die man erst im Ernstfall festlegt.

```text
falsch:  "Nach dem Umschalten beobachten und im Zweifel zurückgehen."
richtig: "10 Minuten beobachten. Rückweg, wenn Fehlerquote > 2 % für 2 Minuten
          oder p95 mehr als doppelt so hoch wie vorher: ./deploy.sh"
```

> **Praxisbeispiel: Vier-Augen-Prinzip und Nachweis**
>
> In vielen Organisationen müssen Änderungen am Produktivsystem nachweisbar freigegeben und protokolliert werden. Das Runbook liefert den Ablauf, die Pipeline die Prüfungsergebnisse, das Skript die Ausgabe mit Uhrzeit, und die Versionsverwaltung den Stand der Konfiguration. Zusammen ergibt das einen Nachweis, ohne dass jemand eigens Dokumente schreiben muss. Ob und wie das den eigenen Anforderungen genügt, ist Sache der jeweiligen Vorgaben (keine Rechtsberatung).

## 12.9 Kubernetes Ingress

*Kubernetes* ist ein System, das Container auf einer Gruppe von Rechnern (dem *Cluster*) verteilt und betreibt. Anwendungen laufen dort in *Pods*; ein *Service* gibt einer Gruppe gleichartiger Pods einen stabilen Namen und eine feste Adresse. Damit Besucher von außen die Dienste erreichen, braucht es ein Eingangstor, und hier kommt der Webserver ins Spiel. Ein *Ingress* ist eine *Beschreibung* (ein Kubernetes-Objekt) der Art: „Anfragen für den Host `shop.example` und den Pfad `/` gehören zum Service `shop`, mit diesem TLS-Zertifikat“. Der *Ingress-Controller* ist das Programm, das diese Beschreibungen liest und in eine laufende Konfiguration umsetzt; bei einem Nginx-basierten Controller ist das Ergebnis eine Nginx-Konfiguration, die er laufend neu erzeugt und lädt. Das Objekt allein tut also nichts; ohne Controller ist es nur ein Datensatz.

Ein Ingress-Objekt für den Shop sieht so aus:

```bash
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop
  namespace: web
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - shop.example
      secretName: shop-tls
  rules:
    - host: shop.example
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: shop
                port:
                  number: 8080
```

Die Datei beschreibt: `ingressClassName: nginx` wählt, welcher Controller zuständig ist (in einem Cluster können mehrere laufen). Der Abschnitt `tls` nennt das Zertifikat; es liegt in einem Kubernetes-Secret namens `shop-tls` (Typ `kubernetes.io/tls`, das Zertifikat und Schlüssel enthält; zu den Fallen bei Secrets siehe Abschnitt 12.6). Die `rules` bilden Host und Pfad auf einen Service ab; `pathType: Prefix` bedeutet „alles, was mit diesem Pfad beginnt“. Die `annotations` sind controllerspezifische Einstellungen: Hier verlangt die erste eine Obergrenze von 10 MB für Anfragekörper (entspricht `client_max_body_size` aus Modul 10), die zweite die Weiterleitung auf HTTPS. Die Namen der Annotationen gelten für den Controller der Kubernetes-Gemeinschaft (`ingress-nginx`); ihre genaue Bedeutung wurde hier nicht in dessen Dokumentation geprüft.

Das Manifest wurde mit `kubernetes-validate` gegen das offizielle Schema geprüft, ohne Cluster: `INFO k8s/ingress.yaml passed for resource ingress/shop against version 1.37`. Ließ man die Zeile `pathType` weg, lautete die Meldung `ERROR ... spec.rules.0.http.paths.0: 'pathType' is a required property`. Eine solche Prüfung gehört in die Pipeline (Abschnitt 12.4); sie findet Strukturfehler vor dem Ausrollen. Sie prüft aber nicht, ob der Service existiert, ob das Secret vorhanden ist oder ob der Controller die Annotationen versteht; dazu braucht es einen Cluster. Ein Cluster stand für den Test nicht zur Verfügung.

> **Ergänzung aus der Nachrecherche: Das Ende von Ingress NGINX und der Weg zur Gateway API**
>
> Der verbreitete Ingress-Controller der Kubernetes-Gemeinschaft, *Ingress NGINX*, wird nicht mehr weiterentwickelt. Die Kubernetes-Projektleitung (Steering und Security Response Committee) kündigte am 29. Januar 2026 an: „In March 2026, Kubernetes will retire Ingress NGINX“; danach gebe es keine Veröffentlichungen mehr für Fehlerbehebungen oder Sicherheitskorrekturen (Quelle: kubernetes.io, abgerufen). Der Google Open Source Blog (abgerufen) ergänzt: Bestehende Installationen laufen weiter, der Grund für die Einstellung sei unter anderem die „Snippets“-Funktion, mit der sich Nginx-Konfiguration über Annotationen einschleusen lässt und die als Sicherheitsrisiko gilt; das Projekt sei von ein bis zwei Personen in ihrer Freizeit gepflegt worden. Nicht betroffen seien die Ingress-Schnittstelle von Kubernetes selbst (sie bleibt verfügbar, wird aber nicht mehr erweitert) und der separate Nginx-Ingress-Controller von F5/NGINX Inc., der weiter gepflegt wird. Als Nachfolger für die Beschreibung des Verkehrs wird die *Gateway API* genannt, die Funktionen im Standard selbst enthält, statt sie über Annotationen anzubauen, und auch TCP, UDP und gRPC beschreiben kann. Das Werkzeug `ingress2gateway` hilft laut dem Blog bei der Umstellung. Den heutigen Stand (Oktober 2026) haben wir nicht eigens geprüft; wer einen Cluster betreibt, sollte nachsehen, welcher Controller läuft (laut Blog lassen sich die Pods mit dem Etikett `app.kubernetes.io/name=ingress-nginx` finden) und eine Umstellung planen.

Eine Gateway-API-Beschreibung desselben Ziels sieht so aus. Sie wurde nur auf gültiges YAML geprüft, nicht gegen einen Cluster oder ein Schema der Gateway API, und folgt dem Kenntnisstand des Autors:

```bash
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: shop
  namespace: web
spec:
  parentRefs:
    - name: eingang
  hostnames:
    - shop.example
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: shop
          port: 8080
```

Hier trennt die Gateway API die Rollen: Das *Gateway* (hier `eingang`, von den Betreibern des Clusters definiert) beschreibt Ports und TLS, die *HTTPRoute* (von den Anwendungsteams) die Weiterleitung. Der Unterschied zum Ingress ist, dass Einstellungen wie Weiterleitungen oder Header-Änderungen in der Beschreibung selbst stehen, nicht in herstellerspezifischen Annotationen.

Für IaC heißt das alles: Ingress- oder Gateway-Objekte sind Textdateien, die in dieselbe Versionsverwaltung und Pipeline gehören wie die Serverkonfiguration (Schema-Prüfung, Richtlinienprüfung, Freigabe). Wer bei einem Nginx-Controller Änderungen am Cluster direkt mit `kubectl edit` vornimmt, umgeht die Versionsverwaltung. Die Konfiguration, die der Controller tatsächlich erzeugt hat, lässt sich nach dem Kenntnisstand des Autors (nicht getestet) im Controller-Pod mit `nginx -T` ansehen, und dieselbe Technik der Richtlinienprüfung aus Abschnitt 12.5 lässt sich dann anwenden.

### Typische Fehler.

Der erste Fehler ist ein Ingress ohne laufenden Controller oder mit falscher `ingressClassName`: Das Objekt wird angenommen, und es passiert nichts. Der zweite ist, TLS-Zertifikate als Secret im Klartext im Repository abzulegen. Der dritte ist, sich auf Annotationen eines bestimmten Controllers zu verlassen, ohne zu wissen, dass sie bei einem Wechsel verloren gehen.

```bash
# falsch: Controller-Klasse vergessen oder falsch geschrieben
spec:
  ingressClassName: ngnix

# richtig: genau der Name der installierten IngressClass
spec:
  ingressClassName: nginx
```

> **Praxisbeispiel: Der Controller als Webserver**
>
> Wer Nginx in der Produktion kennt, findet sich im Controller schnell zurecht: Es gelten dieselben Regeln für Zeitlimits (Abschnitt 11.3), Puffer (11.10), Körpergrößen und Sicherheitsüberschriften, nur dass sie über Annotationen oder ein Konfigurationsobjekt gesetzt werden statt über eine Datei. Ein Fehler wie `413 Request Entity Too Large` bei einem Upload hat dieselbe Ursache und denselben Hebel (Obergrenze für den Anfragekörper); nur steht er jetzt im Ingress-Objekt.

## Übungsaufgaben

Die Aufgaben steigen im Schwierigkeitsgrad. Für die praktischen Aufgaben genügt ein Testrechner mit Nginx, Python und `ansible-core` (zum Beispiel per `pip install ansible-core ansible-lint yamllint`). Die Lösungen stehen im nächsten Abschnitt.

**Aufgabe 1 (leicht).** Erkläre in eigenen Worten die Begriffe Idempotenz und Handler bei Ansible. Welche Ausgabe erwartest du beim zweiten Lauf eines unveränderten Playbooks?

**Aufgabe 2 (leicht).** Nenne die fünf wichtigsten Verzeichnisse einer Ansible-Rolle und wofür sie dienen. Warum sollen Variablen einer Rolle mit dem Rollennamen beginnen?

**Aufgabe 3 (leicht).** Ein Dockerfile beginnt mit `FROM nginx:latest`, kopiert einen privaten Schlüssel in das Abbild und lässt den Prozess als Root laufen. Nenne drei Probleme und je eine Verbesserung.

**Aufgabe 4 (mittel).** In einer Vorlage steht `server_name {{ item.servername }};`, die Variable heißt aber `server_name`. Was passiert beim Ausrollen, und warum ist das Verhalten von Ansible hier günstig? Welche YAML-Falle gibt es bei Werten, die mit `{{` beginnen?

**Aufgabe 5 (mittel).** Ein Playbook schreibt ein Passwort aus dem Tresor in eine Datei. In den Protokollen der Pipeline taucht das Passwort im Klartext auf. Erkläre die Ursache und wie du es beheben und künftig verhindern kannst.

**Aufgabe 6 (praktisch).** Schreibe ein Prüfskript für eine Nginx-Konfiguration, das mit dem Rückgabecode 1 endet, wenn (a) `server_tokens` nicht auf `off` steht oder (b) irgendwo `autoindex on` vorkommt. Teste es mit einer guten und einer schlechten Konfiguration, auch mit einer, bei der der gesamte `server`-Block in einer Zeile steht.

**Aufgabe 7 (praktisch).** Baue eine kleine Pipeline als Shell-Skript mit vier Stufen: YAML-Stil, Erzeugen der Konfiguration aus einer Vorlage, `nginx -t`, Rauchtest mit `curl`. Die Pipeline muss beim ersten Fehler abbrechen und den Testserver in jedem Fall beenden.

**Aufgabe 8 (schwer).** Erweitere das Blue-Green-Skript aus Abschnitt 12.7 so, dass es nach dem Umschalten eine Minute lang jede Sekunde die Startseite abfragt und automatisch zurückschaltet, wenn mehr als zwei Antworten keinen Statuscode 200 liefern. Beschreibe, welche Fälle das Skript damit nicht abdeckt.

**Aufgabe 9 (schwer).** Ein Cluster verwendet `ingress-nginx` mit mehreren Dutzend Ingress-Objekten und Annotationen. Entwirf einen Plan für den Umstieg auf die Gateway API: Bestandsaufnahme, Vorgehen, Tests, Rückweg, und nenne Risiken.

## Lösungen und Erklärungen

**Lösung 1.** Idempotenz heißt, dass eine Operation beliebig oft ausgeführt werden kann und danach immer denselben Zustand ergibt, ohne bei Wiederholung etwas zu ändern. Ansible-Module beschreiben den gewünschten Zustand und ändern nur, wenn er noch nicht besteht. Ein Handler ist eine Aufgabe, die nur läuft, wenn eine andere Aufgabe sie per `notify` angemeldet hat, weil sie etwas geändert hat, und zwar am Ende des Abschnitts; typisch ist das Neuladen des Dienstes nach einer Änderung der Konfiguration. Beim zweiten Lauf eines unveränderten Playbooks erwartet man in der Zusammenfassung `changed=0` und keine Handler-Ausführung. Im Test war das so; allerdings ging ein im ersten Lauf gescheiterter Handler verloren, weil er im zweiten nicht erneut angemeldet wurde.

**Lösung 2.** `tasks/` enthält die Aufgaben (Einstieg `main.yml`), `handlers/` die Aufgaben, die nach Änderungen laufen, `defaults/` leicht überschreibbare Standardwerte, `templates/` die Vorlagen und `files/` feste Dateien; weitere sind `vars/` und `meta/`. Die Vorsilbe verhindert, dass Variablen verschiedener Rollen sich gegenseitig überschreiben, weil alle Variablen in einem gemeinsamen Namensraum liegen. `ansible-lint` meldet Verstöße mit `var-naming[no-role-prefix]` (im Test beobachtet).

**Lösung 3.** (1) `latest` ist keine feste Version: Der Build ist nicht reproduzierbar; Abhilfe: eine bestimmte Version angeben (zum Beispiel `nginx:1.30.6-alpine`). (2) Der private Schlüssel steckt in einer Schicht des Abbilds und lässt sich aus ihr lesen, auch wenn eine spätere Zeile ihn löscht; Abhilfe: Schlüssel zur Laufzeit als Secret oder Volume einbinden. (3) Root im Container vergrößert den Schaden bei einem Einbruch; Abhilfe: `USER 101`, Ports über 1024, schreibbare Pfade außerhalb des Systems und eventuell ein schreibgeschütztes Dateisystem.

**Lösung 4.** Ansible bricht mit einer Fehlermeldung ab (im Test: `object of type 'dict' has no attribute 'servername'`), statt eine leere oder halbe Direktive zu schreiben. Das ist günstig, weil der Fehler beim Erzeugen auffällt und nicht erst, wenn Nginx die Datei beim Neuladen ablehnt oder, schlimmer, sie falsch auslegt. Die YAML-Falle: Ein Wert, der mit `{{` beginnt, muss in Anführungszeichen stehen (`msg: "{{ var }}/x"`), sonst liest YAML die Klammern als Struktur und meldet `YAML parsing failed: This may be an issue with missing quotes around a template block`.

**Lösung 5.** Ursache ist vermutlich `--diff` oder eine ausführliche Ausgabe: Ansible zeigt die geänderte Zeile einschließlich des entschlüsselten Passworts (im Test: `+admin:S3cr3t-Admin-Pw`). Der Tresor schützt nur die Daten im Ruhezustand. Behebung: An der Aufgabe, die das Geheimnis verarbeitet, `no_log: true` setzen; die Protokolle der Pipeline bereinigen und das Passwort als kompromittiert behandeln und erneuern. Vorbeugung: `--diff` und `-vvv` in Pipelines nur gezielt und nie für Aufgaben mit Geheimnissen verwenden, Protokolle nur für berechtigte Personen lesbar machen, und die Pipeline-Einstellungen so wählen, dass Geheimnisse maskiert werden.

**Lösung 6.**

```bash
#!/bin/bash
# check.sh KONFIG PRAEFIX  -  Rückgabecode 1 bei Verstoß
set -u
konfig=$1; praefix=$2
text=$(nginx -T -c "$konfig" -p "$praefix" 2>&1 | sed 's/#.*//')
fehler=0
if ! grep -Eq '(^|[;{}[:space:]])server_tokens[[:space:]]+off[[:space:]]*;' <<<"$text"; then
  echo "VERSTOSS: server_tokens ist nicht off"; fehler=1
fi
if grep -Eq '(^|[;{}[:space:]])autoindex[[:space:]]+on[[:space:]]*;' <<<"$text"; then
  echo "VERSTOSS: autoindex on"; fehler=1
fi
exit $fehler
```

Das Skript holt die zusammengesetzte Konfiguration mit `nginx -T`, entfernt Kommentare und sucht die Direktiven. Entscheidend ist der Anfang des Suchmusters: Ein Zeilenanker allein würde `server { autoindex on; }` in einer Zeile übersehen (im Test mit einem Python-Skript beobachtet); deshalb darf vor der Direktive auch eines der Zeichen `;`, `{`, `}` oder Leerraum stehen. Testfälle: eine gute Konfiguration (Rückgabecode 0), eine mit `server_tokens on` (1), eine mit `autoindex on` in einer einzigen Zeile (1). Eine Prüfung, die für alle drei Fälle richtig antwortet, hat ihre Probe bestanden.

**Lösung 7.**

```bash
#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
rm -rf build && mkdir -p build

echo "[1/4] YAML-Stil";  yamllint -d relaxed vars.yml
echo "[2/4] Erzeugen"
PORT=8321 envsubst '${PORT}' < nginx.conf.template > build/nginx.conf
echo "[3/4] Syntax";     nginx -t -c "$PWD/build/nginx.conf" -p "$PWD/build/"

echo "[4/4] Rauchtest"
nginx -c "$PWD/build/nginx.conf" -p "$PWD/build/" &
pid=$!
trap 'kill $pid 2>/dev/null || true' EXIT
sleep 1
curl -fsS http://127.0.0.1:8321/healthz
```

`set -euo pipefail` bricht beim ersten Fehler ab, auch in Pipes und bei nicht gesetzten Variablen. `trap ... EXIT` beendet den Testserver, egal wie das Skript endet. `curl -f` lässt den Befehl bei einem HTTP-Fehlerstatus mit einem Fehlercode enden, so dass `set -e` greift. Die Filterliste `'${PORT}'` bei `envsubst` schützt Nginx-eigene Variablen (Abschnitt 12.3). Die Vorlage braucht dazu eine `location = /healthz` mit `return 200`.

**Lösung 8.** Zusatz am Ende des Skripts, nach dem erfolgreichen Schritt 3:

```bash
fehler=0
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://127.0.0.1:8302/ || echo 000)
  [ "$code" = 200 ] || fehler=$((fehler+1))
  if [ "$fehler" -gt 2 ]; then
    echo "RÜCKFALL: mehr als 2 Fehlantworten nach dem Umschalten, zurück auf $live"
    umschalten "$live"; "${NGX[@]}" -s reload 2>/dev/null; exit 1
  fi
  sleep 1
done
echo "Beobachtung abgeschlossen: $fehler Fehlantworten"
```

Die Schleife zählt Antworten ohne Status 200 (`000` bei einem Verbindungsfehler) und schaltet bei mehr als zwei zurück. Nicht abgedeckt sind: Fehler, die nur bestimmte Seiten oder angemeldete Benutzer betreffen (die Startseite ist gesund); Verschlechterungen der Antwortzeit statt des Statuscodes (hier wären Perzentile aus dem Zugriffsprotokoll nötig, Abschnitt 11.8); Fehler, die erst nach Minuten auftreten, etwa Speicherlecks; Änderungen, die sich nicht zurücknehmen lassen (Datenbankänderungen); und Verbindungen, die dauerhaft am alten Backend hängen (WebSockets). Deshalb ersetzt die automatische Beobachtung das Beobachten durch Menschen nicht, sie ergänzt es.

**Lösung 9.** Ein möglicher Plan. *Bestandsaufnahme:* Alle Ingress-Objekte und Annotationen auflisten; die Pods des alten Controllers finden (Etikett `app.kubernetes.io/name=ingress-nginx`); die Annotationen nach Gruppen ordnen (Weiterleitungen, Größenlimits, Zeitlimits, Authentifizierung, Snippets) und prüfen, welche in der Gateway API einen Standard-Gegenpart haben. *Vorgehen:* Einen Gateway-API-Controller wählen, der den eigenen Anforderungen genügt, und ihn neben dem alten betreiben, statt zu ersetzen; ein Werkzeug wie `ingress2gateway` kann erste Entwürfe erzeugen (laut Google Open Source Blog), die von Hand zu prüfen sind. Dienst für Dienst migrieren, beginnend mit unkritischen; Routen als Dateien in die Versionsverwaltung. *Tests:* Schema-Prüfung in der Pipeline, Rauchtests je Host und Pfad, dann ein Vergleich der Antworten (Statuscodes, Header) zwischen alter und neuer Strecke, Lasttest. *Umschalten:* Gewichtete Verteilung oder DNS mit kurzer Lebensdauer, zuerst kleine Anteile. *Rückweg:* Der alte Controller bleibt unverändert, bis alle Dienste migriert und eine Zeit lang beobachtet wurden; die Umschaltung kann jederzeit rückgängig gemacht werden. *Risiken:* Annotationen ohne Gegenstück (etwa Konfigurationsschnipsel), unterschiedliches Verhalten bei Zeitlimits und Puffern, TLS-Zertifikate und Secrets, die im neuen Namensraum liegen müssen, Lücke in der Beobachtbarkeit (Protokollformate und Metriken ändern sich). Außerdem das Risiko, zu lange zu warten: Ein nicht mehr gepflegter Controller erhält keine Sicherheitskorrekturen mehr (Kubernetes-Ankündigung).
