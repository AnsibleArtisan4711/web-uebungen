# Modul 14 - Kosten, Governance, Backup und BCDR

> **Hinweis zu diesem Kapitel:** Das ist das Kapitel des Skripts „Webserver – Apache HTTP Server und Nginx“, aus der LaTeX-Quelle in Markdown umgewandelt (Text und Listings unverändert, farbige Boxen als Zitatblöcke mit fettem Titel, Tabellen als Markdown-Tabellen, Übungsaufgaben und Lösungen als Absätze bzw. Überschriften). Die Lerneinheiten sind wie in der Quelle nach Modul nummeriert (14.1 bis 14.10), danach folgen „Übungsaufgaben“ (9) und „Lösungen und Erklärungen“. **Die Konfigurationen und Befehle wurden für dieses Repository nicht ausgeführt:** Laut Einleitung hat der Autor die Beispiele in einer Linux-Umgebung (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0) ausgeführt; nicht getestet sind laut Skript Windows-Dienste, Paketquellen von nginx.org, Firewall-Befehle und alles, was einen laufenden systemd-Dienst voraussetzt. Viele Beispiele ändern Server-Konfiguration, Zertifikate, Rechte oder Dienste: nur in einer Testumgebung ausprobieren. Übersicht zum Modul: [README](README.md).

**Geplante Dauer:** 11,5 h | **Priorität:** 3 | **Lerneinheiten:** 10

## Lerneinheiten laut Lehrplan

| **Nr.** | **Lerneinheit**           | **Dauer (h)** | **Prio** |
|--------:|:--------------------------|--------------:|---------:|
|    14.1 | Apache FinOps             |             1 |        3 |
|    14.2 | Ressourcenplanung         |             1 |        3 |
|    14.3 | Governance Standards      |           1,5 |        3 |
|    14.4 | Backup und Restore        |             1 |        3 |
|    14.5 | Log Retention             |             1 |        3 |
|    14.6 | Disaster Recovery         |           1,5 |        3 |
|    14.7 | BCDR Tests                |             1 |        3 |
|    14.8 | Betriebsroadmap           |             1 |        3 |
|    14.9 | Nginx FinOps              |             1 |        3 |
|   14.10 | Apache zu Nginx Migration |           1,5 |        3 |
|         | **Summe**                 |      **11,5** |          |

## Überblick und Lernweg

Die vorangegangenen Module haben gezeigt, wie man Webserver baut, absichert, beschleunigt und automatisiert. Dieses letzte Modul stellt die Fragen, die ein Betrieb über Jahre hinweg beantworten muss: Was kostet das Ganze, und wie hält man die Kosten unter Kontrolle? Welche Regeln gelten für alle Server, und wie weist man nach, dass sie eingehalten werden? Wie lange hebt man Protokolle auf, und was geschieht, wenn der Server oder das ganze Rechenzentrum ausfällt? Und schließlich: Wie plant man die nächsten Jahre, einschließlich eines möglichen Wechsels von Apache zu Nginx?

Man fasst diese Themen oft unter dem Kürzel *BCDR* zusammen: *Business Continuity* (Geschäftsfortführung: Wie läuft das Geschäft weiter, während etwas ausgefallen ist?) und *Disaster Recovery* (Wiederherstellung nach einem schweren Ausfall: Wie bringt man die Technik wieder in Gang?). Hinzu kommen *FinOps* (finanzielle Steuerung des Betriebs, vom englischen *Financial Operations*) und *Governance* (verbindliche Regeln und ihre Kontrolle). Im Kern geht es um eine einzige Haltung: Betrieb ist erst dann professionell, wenn er *messbar*, *geregelt* und *geübt* ist.

> **Merke**
>
> Die Beispiele dieses Moduls wurden auf dem Testsystem (Ubuntu 24.04, Apache 2.4.58, Nginx 1.24.0, 2 Prozessorkerne) tatsächlich ausgeführt. Die Messwerte gelten nur für dieses System, bei dem Lastgenerator und Server auf demselben Rechner laufen. Sie zeigen Verhältnisse und Vorgehensweisen, keine absoluten Leistungsdaten. Alle Preise in den Rechenbeispielen sind erfundene Annahmen. Es gab keine zusätzlichen Kursunterlagen; der Inhalt beruht auf dem Lehrplan, Recherche und eigenen Versuchen. Rechtliche Hinweise sind keine Rechtsberatung.

Die Reihenfolge folgt dem Lehrplan. Zuerst kommen die Kosten und die Planung der Ressourcen für Apache (14.1, 14.2), dann die Regeln (14.3). Es folgen die Datensicherung, die Aufbewahrung von Protokollen, die Wiederherstellung nach Katastrophen und deren Übung (14.4 bis 14.7). Den Abschluss bilden die Betriebsplanung über mehrere Jahre (14.8), die Kosten bei Nginx (14.9) und die praktische Umsetzung einer Apache-zu-Nginx-Migration (14.10), die an Modul 13 anknüpft.

## 14.1 Apache FinOps

*FinOps* bedeutet, die Kosten eines Betriebs sichtbar zu machen, zuzuordnen und gezielt zu beeinflussen, ohne die Qualität zu opfern. Für einen Webserver klingt das zunächst nach wenig: Apache selbst ist freie Software und kostet keine Lizenzgebühr. Die Kosten entstehen woanders: in den *Rechenressourcen* (Prozessorzeit und Arbeitsspeicher der Server), im *Datenverkehr* (Übertragungsvolumen, das viele Anbieter nach Gigabyte berechnen), im *Speicher* (Protokolle, Sicherungen, Inhalte) und vor allem in der *Arbeitszeit* der Menschen, die den Betrieb führen. Eine Kostenbetrachtung, die nur die Serverrechnung sieht, übersieht oft den größten Posten.

Der wichtigste Hebel für Rechenkosten ist die Frage, wie viel Arbeit eine Instanz pro Sekunde leisten kann, denn davon hängt die Zahl der benötigten Instanzen ab. Bei Apache bestimmt das Verarbeitungsmodell (*MPM*, Modul 4) den Durchsatz und den Speicherbedarf. Wir haben auf dem Testsystem eine Datei von etwa 27 kB (zufälliger Text, Base64-kodiert) ausgeliefert und mit `ab` 20 000 Anfragen mit 100 gleichzeitigen Verbindungen gesendet, einmal mit dem `event`-MPM und einmal mit dem älteren `prefork`-MPM, und dazu den Arbeitsspeicher der Prozesse gemessen:

```bash
$ ./rss.sh $(cat run/a_event.pid)          # vor der Last
Prozesse=4 RSS=15 MB PSS=3 MB
$ ab -q -k -c 100 -n 20000 http://127.0.0.1:8501/index.html | grep Requests
Requests per second:    19234.47 [#/sec] (mean)
$ ./rss.sh $(cat run/a_event.pid)          # nach der Last
Prozesse=5 RSS=26 MB PSS=9 MB

$ ./rss.sh $(cat run/a_prefork.pid)
Prozesse=6 RSS=17 MB PSS=1 MB
$ ab -q -k -c 100 -n 20000 http://127.0.0.1:8501/index.html | grep Requests
Requests per second:    2854.36 [#/sec] (mean)
$ ./rss.sh $(cat run/a_prefork.pid)
Prozesse=101 RSS=320 MB PSS=18 MB
```

Das kleine Skript `rss.sh` summiert für den Hauptprozess und seine Kindprozesse den *Resident Set Size* (RSS, der im Arbeitsspeicher befindliche Teil des Prozesses) und den *Proportional Set Size* (PSS, der Speicher, bei dem gemeinsam genutzte Seiten anteilig verteilt werden). Es liest beide Werte aus `/proc/PID/smaps_rollup`. Die Summe der RSS-Werte überschätzt den echten Verbrauch, weil Programmcode und Bibliotheken zwischen den Prozessen geteilt werden und trotzdem in jedem RSS-Wert auftauchen. Der PSS-Wert ist genauer, in unserer Testumgebung aber auffallend niedrig; wir wissen nicht, ob das an der Sandbox liegt. Deshalb gilt die Regel: Für die Planung muss der Speicherverbrauch *im Zielsystem* gemessen werden, etwa als Unterschied des verfügbaren Speichers (`free -m`) vor und nach der Last.

Dennoch ist das Verhältnis aufschlussreich. Bei gleicher Last (100 gleichzeitige Verbindungen) lief `event` mit fünf Prozessen und erreichte rund 19 000 Anfragen pro Sekunde, während `prefork` 101 Prozesse startete, weil dieses Modell für jede gleichzeitige Verbindung einen eigenen Prozess braucht, und nur rund 2 900 Anfragen pro Sekunde schaffte. Das MPM-Modell bestimmt also unmittelbar, wie viele Server man kaufen muss. Wir haben das in einem kleinen Kostenmodell festgehalten:

```bash
#!/usr/bin/env python3
"""Kostenmodell: Instanzen und Monatskosten aus gemessenem Durchsatz.
Alle Preise sind ANNAHMEN (Parameter), keine Marktpreise."""
import math
spitze   = 3000      # erwartete Spitzenlast, Anfragen pro Sekunde
auslast  = 0.60      # Zielauslastung bei Spitze
reserve  = 1         # zusaetzliche Instanz fuer Ausfall (N+1)
preis    = 40.0      # ANNAHME: Euro pro Instanz und Monat
messwerte = {        # req/s je Instanz, gemessen (ab, siehe Text)
    "Apache prefork": 2854,
    "Apache event":  19234,
    "Nginx":         35062,
}
print(f"{'Variante':16}{'req/s':>8}{'Instanzen':>11}{'Euro/Monat':>12}")
for name, rps in messwerte.items():
    n = math.ceil(spitze / (rps * auslast)) + reserve
    print(f"{name:16}{rps:8d}{n:11d}{n*preis:12.2f}")
```

Das Skript rechnet für jede Variante aus, wie viele Instanzen für die Spitzenlast nötig sind. Der Durchsatz wird mit der Zielauslastung multipliziert (man plant nicht auf 100 Prozent, sondern lässt Luft für Schwankungen), die Spitzenlast durch diesen nutzbaren Durchsatz geteilt und aufgerundet; dazu kommt eine Instanz Reserve für den Ausfall einer anderen (*N+1*). Das Ergebnis:

```bash
Variante           req/s  Instanzen  Euro/Monat
Apache prefork      2854          3      120.00
Apache event       19234          2       80.00
Nginx              35062          2       80.00
```

Die Ausgabe zeigt: Bei einer Last von 3 000 Anfragen pro Sekunde braucht `prefork` unter den angenommenen Bedingungen drei Instanzen, `event` und Nginx jeweils zwei. Der Unterschied zwischen `event` und Nginx verschwindet in der Rundung, obwohl Nginx im Test fast doppelt so viele Anfragen schaffte. Das ist eine wichtige FinOps-Erkenntnis: Ab einer gewissen Leistung bringt mehr Geschwindigkeit keine Ersparnis mehr, weil man ohnehin eine Mindestzahl von Instanzen für die Ausfallsicherheit braucht. Die absoluten Zahlen (40 Euro je Instanz) sind frei erfunden; wer das Modell benutzt, setzt eigene Preise und *selbst gemessene* Durchsätze ein.

Der zweite große Hebel ist das *Datenvolumen*. Aus Modul 11 liegt eine Messung vor: Eine JSON-Antwort von 662 915 Byte schrumpfte mit `gzip` auf der Stufe 5 auf 54 797 Byte. Bei einer Million Abrufe sind das 663 GB gegen 55 GB, eine Ersparnis von rund 92 Prozent des Übertragungsvolumens. Wie viel das in Euro ausmacht, hängt vom Tarif ab; manche Anbieter berechnen ausgehenden Verkehr, andere nicht (nach dem Kenntnisstand des Autors, nicht geprüft). Dasselbe gilt für Caching (Modul 11.5): Jede aus dem Zwischenspeicher gelieferte Antwort spart Rechenzeit im Backend.

> **Praxisbeispiel: Das Kostenschild an jeder Instanz**
>
> Ein Betrieb verteilt die monatliche Rechnung nach Kennzeichnung (*Tags*) auf Teams und Anwendungen. Plötzlich sieht ein Team, dass sein Server mit 8 statt 2 Prozessorkernen läuft, obwohl die mittlere Auslastung bei 6 Prozent liegt. Das Verkleinern spart Geld und ändert an der Qualität nichts. Der erste FinOps-Schritt ist fast immer Sichtbarkeit: Wer die Kosten nicht sieht, kann sie nicht steuern.

Typische Fehler: Erstens wird nach Gefühl *überdimensioniert*, weil ein Ausfall peinlicher ist als eine zu hohe Rechnung; die Antwort ist die gemessene Auslastung und das *N+1*-Prinzip statt „doppelt so viel wie nötig“. Zweitens wird nach Gefühl *unterdimensioniert*; dann steht die Seite bei einer Lastspitze still, und der Schaden übersteigt die Ersparnis. Drittens werden die *Arbeitskosten* vergessen: Ein Umbau, der 100 Euro im Monat spart, aber 40 Stunden Arbeit kostet, rechnet sich nach den Maßstäben der meisten Betriebe erst nach Jahren. Falsch ist daher der Satz „Nginx ist schneller, also billiger“; richtig ist die Rechnung aus gemessener Leistung, Zielauslastung, Reserve und Umstiegsaufwand.

## 14.2 Ressourcenplanung

*Ressourcenplanung* (englisch *capacity planning*) beantwortet die Frage: Wie viel Rechenleistung, Speicher und Bandbreite braucht der Dienst in der Zukunft, und wann muss man nachlegen? Sie ist die Brücke zwischen den Messungen aus Modul 11 und den Kosten aus 14.1. Das Grundwerkzeug ist eine einfache Beziehung, das *Little’sche Gesetz*: Die Zahl der gleichzeitig bearbeiteten Anfragen ist gleich der Ankunftsrate mal der mittleren Verweilzeit. Kommen 3 000 Anfragen pro Sekunde an, und jede wird im Mittel 50 Millisekunden bearbeitet, sind im Mittel 150 Anfragen gleichzeitig im System.

Aus dieser Zahl lassen sich die Konfigurationswerte ableiten. Bei Apache mit `event`-MPM entspricht jede gleichzeitig aktive Anfrage einem Thread; die Obergrenze heißt `MaxRequestWorkers`. Die Threads sind auf Kindprozesse verteilt (`ThreadsPerChild`), die Voreinstellung unter Ubuntu ist 25 (gemessen in Modul 11). Das folgende Skript rechnet das durch und plant einen Puffer ein:

```bash
#!/usr/bin/env python3
import math
rate      = 3000    # Spitzenlast in Anfragen pro Sekunde
latenz    = 0.050   # mittlere Antwortzeit in Sekunden
puffer    = 1.5     # Sicherheitsfaktor fuer Spitzen und Streuung
threads   = 25      # ThreadsPerChild (Apache event, Ubuntu)
mb_prozess = 40     # ANNAHME: Speicher je Kindprozess in MB

gleichzeitig = rate * latenz
mrw   = math.ceil(gleichzeitig * puffer / threads) * threads
kinder = mrw // threads
print(f"gleichzeitige Anfragen (Little): {gleichzeitig:.0f}")
print(f"MaxRequestWorkers: {mrw}  ({kinder} Kindprozesse x {threads} Threads)")
print(f"Speicher fuer Worker: ca. {kinder*mb_prozess} MB")
```

Die Zeilen berechnen zuerst die gleichzeitigen Anfragen, multiplizieren sie mit dem Puffer und runden auf ein Vielfaches von `ThreadsPerChild` auf, weil Apache Threads nur in ganzen Kindprozessen starten kann. Der Speicherbedarf ergibt sich aus der Zahl der Kindprozesse mal dem Verbrauch eines Prozesses; dieser Wert (40 MB) ist hier eine *Annahme* und muss gemessen werden. Das Skript gibt aus:

```bash
gleichzeitige Anfragen (Little): 150
MaxRequestWorkers: 225  (9 Kindprozesse x 25 Threads)
Speicher fuer Worker: ca. 360 MB (bei 40 MB je Prozess)
```

Der berechnete Wert muss mit der Wirklichkeit abgeglichen werden. Dazu dient ein Lasttest in Stufen, wie ihn Modul 11.7 beschrieben hat: Man erhöht die Zahl der gleichzeitigen Clients und beobachtet, ab wann die Antwortzeit steigt. Dort stieg der Durchsatz eines Backends bis etwa 16 gleichzeitige Clients auf rund 78 Anfragen pro Sekunde und blieb danach praktisch gleich (bei 64 Clients 79); mehr Clients erhöhten nur die Wartezeit, nicht den Durchsatz. Das erinnert an eine wichtige Regel: Die Obergrenze liegt oft nicht beim Webserver, sondern bei einem langsameren Glied dahinter (Datenbank, Anwendung). Ein größeres `MaxRequestWorkers` würde dann nur mehr Anfragen in die Warteschlange des Engpasses pressen.

Zur Planung gehören noch weitere Größen, die häufig vergessen werden. Jede Verbindung belegt einen Dateideskriptor; das Limit des Betriebssystems (`ulimit -n`) muss zur geplanten Zahl passen (in Modul 11.9 hat Nginx bei einem Limit von 20 den Dienst verweigert). Der Plattenplatz für Protokolle wächst mit dem Verkehr (14.5). Auch die Bandbreite der Netzwerkkarte ist eine Grenze: Wer 3 000 Antworten pro Sekunde mit je 27 kB sendet, benötigt rechnerisch etwa 650 Megabit pro Sekunde (3 000 mal 27 000 Byte mal 8 Bit), also mehr als eine 1-Gigabit-Verbindung bei Spitze sinnvoll auslastet. Diese Rechnung ist einfach und fängt Fehlplanung früh ab.

> **Ergänzung aus der Nachrecherche: Wachstum und Spitzen planen**
>
> Nach dem Kenntnisstand des Autors (nicht an einer Quelle überprüft) ist die Spitzenlast bei Webdiensten oft ein Vielfaches des Tagesmittels und hängt von Kampagnen, Jahreszeiten und Ereignissen ab. Deshalb plant man nicht mit dem Mittelwert, sondern mit der *beobachteten Spitze* plus Wachstumszuschlag, und prüft quartalsweise Messwerte aus dem Monitoring (Modul 9 und 11.8) gegen die Annahmen. Ein einfaches, wirksames Verfahren: Die höchste stündliche Last der letzten zwölf Monate wird mit einem Wachstumsfaktor und dem Reservefaktor multipliziert und mit der gemessenen Kapazität verglichen. Die Zahl, die dabei herauskommt, steht im Betriebshandbuch.

Typische Fehler: Man plant mit der *mittleren* statt mit der *Spitzen*last. Falsch ist „400 Anfragen pro Sekunde im Schnitt, also reicht ein Server“; richtig ist die Spitze des Jahres mit Puffer. Ein zweiter Fehler ist, ausschließlich nach Prozessorlast zu planen. Ein Webserver, der auf langsame Backends wartet, hat niedrige Prozessorlast und trotzdem zu wenig Worker; deshalb sind Zahl gleichzeitiger Verbindungen, Antwortzeiten und Fehlerquoten die besseren Messgrößen. Ein dritter Fehler ist, dass die Planung einmal erstellt und nie überprüft wird.

> **Praxisbeispiel: Der Black-Friday-Test**
>
> Ein Onlinehändler testet jedes Jahr im Oktober mit einer Lastsimulation, ob die Infrastruktur die doppelte Vorjahresspitze trägt. Der Test findet jedes Mal einen anderen Engpass (einmal die Zahl der Dateideskriptoren, einmal ein zu kleiner Verbindungspool zur Datenbank). Weil der Test im Oktober stattfindet und nicht im November, sind die Korrekturen eine Routinearbeit statt einer Notfallreparatur.

## 14.3 Governance Standards

*Governance* heißt hier: Es gibt verbindliche Regeln für den Betrieb, jemand ist für sie verantwortlich, und ihre Einhaltung wird kontrolliert. Ein *Standard* ist eine solche Regel, die möglichst konkret und überprüfbar ist: nicht „Server sind sicher zu konfigurieren“, sondern „`server_tokens` steht auf `off`, TLS ist mindestens in Version 1.2, Verzeichnislisten sind ausgeschaltet“. Ohne Standards entscheidet jeder Administrator nach eigenem Gutdünken, und der Betrieb besteht aus Einzelfällen, die niemand überblickt.

Ein tragfähiges Regelwerk besteht aus mehreren Ebenen. Oben steht eine kurze *Richtlinie*, die das Ziel und die Verantwortung festlegt (wer entscheidet, wer prüft). Darunter liegen die *Standards*, die technische Mindestanforderungen festhalten, zum Beispiel eine Konfigurationsgrundlage (*Baseline*) für Nginx und Apache. Ganz unten stehen *Verfahren* und *Checklisten*, die zeigen, wie man etwas tut. Der wichtigste Schritt ist die Übersetzung der Standards in *ausführbare Prüfungen*. In Modul 12.5 haben wir dafür ein Skript gebaut, das die wirksame Nginx-Konfiguration (`nginx -T`) prüft und bei einem Verstoß mit Rückgabecode 1 endet; im Modul 10 ging es um die Härtungsregeln selbst. Ein Standard, der nicht automatisch geprüft werden kann, wird im Alltag bald nicht mehr eingehalten.

> **Ergänzung aus der Nachrecherche: Externe Rahmenwerke**
>
> Es gibt öffentliche Regelwerke, an denen man sich orientieren kann. Nach dem Kenntnisstand des Autors (nicht abgerufen, nicht geprüft) enthält das IT-Grundschutz-Kompendium des deutschen Bundesamts für Sicherheit in der Informationstechnik (BSI) einen Baustein „Webserver“ (APP.3.2), und das Center for Internet Security (CIS) veröffentlicht Härtungsleitfäden (*Benchmarks*) für Apache und Nginx. Welche Vorgaben für ein Unternehmen verbindlich sind (etwa aus Verträgen, Branchenregeln oder Gesetzen), ist im Einzelfall zu klären und keine Rechtsberatung. Die Standards eines Betriebs sollten auf diese Quellen verweisen, statt sie abzuschreiben, weil sich die Quellen ändern.

Zu einem Standard gehört auch der Umgang mit *Ausnahmen*. Es gibt immer einen Fall, in dem eine Regel nicht passt: eine alte Anwendung, die nur mit TLS 1.0 läuft, ein Verzeichnis, das offen sein muss. Entscheidend ist, dass die Ausnahme *schriftlich* und *befristet* ist, einen Verantwortlichen hat und die Begründung sowie das Ablaufdatum enthält. Im Prüfskript lässt sich das abbilden, indem Ausnahmen in einer Datei stehen, die das Skript liest. Das folgende Beispiel erweitert die Idee aus Modul 12 um eine Ausnahmeliste und ein Ablaufdatum:

```bash
#!/usr/bin/env bash
# audit.sh KONFIG AUSNAHMEN  - prueft Regeln, beruecksichtigt befristete Ausnahmen
konfig=$1; ausn=$2; heute=$(date +%F); fehler=0
text=$(nginx -T -c "$konfig" 2>&1 | sed 's/#.*//')
grep -q "test is successful" <<<"$text" || { echo "FEHLER: Konfiguration nicht pruefbar"; exit 2; }

ausnahme() {   # REGEL -> 0, wenn eine gueltige (nicht abgelaufene) Ausnahme existiert
  awk -F';' -v r="$1" -v h="$heute" '$1==r && $2>=h {found=1} END{exit !found}' "$ausn"
}
pruefe() {     # REGEL BESCHREIBUNG MUSTER SOLL(1=muss vorkommen, 0=darf nicht)
  if grep -Eq "$3" <<<"$text"; then ist=1; else ist=0; fi
  if [ "$ist" != "$4" ]; then
    if ausnahme "$1"; then echo "AUSNAHME $1: $2"
    else echo "VERSTOSS  $1: $2"; fehler=1; fi
  else echo "OK        $1"; fi
}
pruefe R1 "server_tokens off"  '(^|[;{}[:space:]])server_tokens[[:space:]]+off[[:space:]]*;' 1
pruefe R2 "kein autoindex on"  '(^|[;{}[:space:]])autoindex[[:space:]]+on[[:space:]]*;'      0
exit $fehler
```

Das Skript liest die wirksame Konfiguration einmal ein. Die Funktion `ausnahme` durchsucht die Datei, in der jede Zeile aus Regelnummer, Ablaufdatum (im Format `JJJJ-MM-TT`) und Begründung besteht, durch Semikolons getrennt; die Ausnahme gilt nur, wenn ihr Datum nicht vor dem heutigen liegt. Die Funktion `pruefe` sucht ein Muster in der Konfiguration und vergleicht, ob es vorhanden sein soll oder nicht; bei Abweichung prüft sie, ob eine gültige Ausnahme besteht. Die zweite Zeile nach dem Einlesen bricht mit dem Rückgabecode 2 ab, wenn die Konfiguration gar nicht geprüft werden konnte. Sie entstand aus einem Fehler im ersten Testlauf: Ich hatte die Konfiguration mit einem *relativen* Pfad angegeben, Nginx suchte sie im falschen Verzeichnis, der Text blieb leer, und das Skript meldete den Verstoß gegen R1 aus dem falschen Grund (und „OK“ für R2, obwohl `autoindex on` in der Datei stand). Ein Prüfskript, das bei leerer Eingabe „OK“ sagt, ist gefährlicher als gar keines. Mit absolutem Pfad lieferte der korrigierte Lauf das erwartete Ergebnis, siehe das folgende Ergebnis.

```bash
$ ./audit.sh /tmp/m14/kfg.conf /dev/null            # keine Ausnahmen
VERSTOSS  R1: server_tokens off
VERSTOSS  R2: kein autoindex on          # rc=1
$ ./audit.sh /tmp/m14/kfg.conf ausn.csv              # R1 gueltig bis 2026-12-31
AUSNAHME R1: server_tokens off
VERSTOSS  R2: kein autoindex on          # rc=1
$ ./audit.sh /tmp/m14/kfg.conf ausn_alt.csv          # R1 abgelaufen (2026-01-31)
VERSTOSS  R1: server_tokens off
VERSTOSS  R2: kein autoindex on          # rc=1
$ ./audit.sh kfg.conf /dev/null                      # relativer Pfad
FEHLER: Konfiguration nicht pruefbar     # rc=2
```

Die vier Läufe zeigen das Verhalten: Ohne Ausnahmen werden beide Regeln verletzt; mit einer gültigen Ausnahme wird R1 nur noch als `AUSNAHME` gemeldet (der Rückgabecode bleibt 1, weil R2 weiterhin verletzt ist); nach Ablauf der Ausnahme wird R1 wieder zum Verstoß; und ein nicht prüfbarer Aufruf endet mit Code 2. In der Pipeline heißt das: Erst wenn alle Verstöße behoben oder ausdrücklich und befristet erlaubt sind, wird der Rückgabecode 0.

> **Merke**
>
> Ein Standard ist nur so gut wie seine *Durchsetzung*: automatisch prüfbar, in der Pipeline verankert (Modul 12), mit befristeten Ausnahmen und einem Verantwortlichen. Die Prüfung gehört dorthin, wo Änderungen entstehen, nicht in eine Jahresprüfung, die ein Jahr zu spät kommt.

Typische Fehler: Standards, die keiner kennt, weil sie in einem Ordner liegen, den niemand öffnet. Falsch ist ein Regelwerk als 80-seitiges Dokument; richtig sind kurze, konkrete Regeln mit Prüfskript und Verweis auf die Begründung. Ein weiterer Fehler: Ausnahmen, die niemals ablaufen und so zur Dauereinrichtung werden. Das Ablaufdatum im Beispiel erzwingt eine neue Entscheidung.

> **Praxisbeispiel: Der abgelaufene Sonderfall**
>
> Eine Fachabteilung bekommt für eine Altanwendung eine Ausnahme für TLS 1.0, befristet auf drei Monate. Nach Ablauf meldet die Pipeline einen Verstoß. Dadurch wird die Anwendung angefasst, statt jahrelang zu bleiben, und das Thema landet beim Verantwortlichen, bevor ein Prüfer es findet.

## 14.4 Backup und Restore

Eine *Datensicherung* (*Backup*) ist eine Kopie von Daten, die man benötigt, um nach einem Verlust den früheren Zustand wiederherzustellen (*Restore*). Der Satz, den jeder Betrieb irgendwann bitter bestätigt bekommt, lautet: *Ein Backup, dessen Wiederherstellung nie geprobt wurde, ist nur eine Hoffnung.* Deshalb besteht dieser Abschnitt zur Hälfte aus Sicherung und zur Hälfte aus Wiederherstellung.

Zuerst die Frage, *was* gesichert werden muss. Bei einem Webserver ist das weniger, als man denkt, und das Wichtigste liegt nicht in den Programmen, denn die kann man aus dem Paketarchiv jederzeit neu installieren. Gesichert werden die *Konfiguration* (Hauptdatei, Virtual Hosts, eingebundene Dateien), die *Inhalte*, soweit sie nicht aus einem anderen System stammen (statische Dateien, Uploads), und die *Schlüsselmaterialien* (Zertifikate und vor allem private Schlüssel; Modul 6). Nicht oder nur gesondert gesichert werden Protokolle (14.5), Zwischenspeicher und alles, was sich automatisch neu erzeugen lässt. Wenn die Konfiguration, wie in Modul 12, in Git liegt und die Server aus Rollen aufgebaut werden, ist ein großer Teil der „Sicherung“ schon die Versionsverwaltung selbst.

Wir bauen ein kleines Sicherungsskript für ein Nginx-Testsystem, das alle drei Arten enthält. Die Testumgebung liegt in `/tmp/m14/prod` mit den Verzeichnissen `conf`, `www` und `tls` (ein selbst erzeugtes Zertifikat mit privatem Schlüssel, Rechte 600) und 200 Beispielseiten:

```bash
#!/usr/bin/env bash
# backup.sh QUELLE ZIELVERZEICHNIS
set -euo pipefail
src=$1; dst=$2; ts=$(date +%Y%m%d-%H%M%S)
arc="$dst/web-$ts.tar.gz"
umask 077
tar --numeric-owner -C "$src" -czf "$arc" conf www tls
( cd "$dst" && sha256sum "$(basename "$arc")" > "$(basename "$arc").sha256" )
# Test: Archiv lesbar und Pruefsumme stimmt
tar -tzf "$arc" > /dev/null
( cd "$dst" && sha256sum -c "$(basename "$arc").sha256" )
echo "$arc"
```

Die Zeilen im Einzelnen: `set -euo pipefail` lässt das Skript bei jedem Fehler abbrechen, damit kein halbes Backup als gültig durchgeht. Der `umask 077` sorgt dafür, dass das Archiv nur vom Eigentümer lesbar ist; das ist wichtig, weil es den privaten Schlüssel enthält. Der `tar`-Aufruf packt die drei Verzeichnisse in ein komprimiertes Archiv, wobei `--numeric-owner` die Besitzer als Zahlen speichert, damit sie auch auf einem anderen Rechner mit anderer Benutzertabelle stimmen. Dann wird eine Prüfsumme (`sha256sum`) erzeugt und sofort geprüft, und zusätzlich liest `tar -t` das ganze Archiv einmal durch. Die Ausgabe im Test:

```bash
$ ./backup.sh /tmp/m14/prod /tmp/m14/bak
web-20261031-235149.tar.gz: OK
/tmp/m14/bak/web-20261031-235149.tar.gz
$ ls -l bak
1033852 web-20261031-235149.tar.gz
     93 web-20261031-235149.tar.gz.sha256
```

Das Archiv ist rund ein Megabyte groß. Die Prüfsumme hat noch einen zweiten Nutzen: Sie erkennt Beschädigungen. Wir haben im Archiv ein Byte überschrieben, und `sha256sum -c` meldete `FAILED` sowie `WARNING: 1 computed checksum did NOT match`. Ohne diese Prüfung hätte man den Schaden erst bei der Wiederherstellung bemerkt.

Nun die Wiederherstellung. Das Gegenstück zum Sicherungsskript prüft zuerst die Prüfsumme, packt das Archiv aus, testet die Konfiguration mit dem Programm (`nginx -t`) und startet den Dienst:

```bash
#!/usr/bin/env bash
# restore.sh ARCHIV ZIEL
set -euo pipefail
arc=$1; dst=$2
( cd "$(dirname "$arc")" && sha256sum -c "$(basename "$arc").sha256" )
mkdir -p "$dst/logs" "$dst/run"
tar --numeric-owner -C "$dst" -xzf "$arc"
nginx -t -c "$dst/conf/nginx.conf"
nginx -c "$dst/conf/nginx.conf"
```

Die Reihenfolge ist Absicht: Wer ein beschädigtes Archiv einspielt, soll nicht erst ein halbes System zerstören; deshalb steht die Prüfsumme an erster Stelle, und das `set -e` bricht bei einem Fehler ab. Das Verzeichnis `logs` und `run` werden angelegt, weil sie nicht im Archiv liegen. Der Test dieses Skripts folgt in Abschnitt 14.7 zusammen mit der Katastrophenübung, denn erst dort zeigt sich, ob alles funktioniert.

> **Ergänzung aus der Nachrecherche: Wo liegt die Sicherung? (nicht getestet)**
>
> Nach dem Kenntnisstand des Autors, ohne Überprüfung an einer Quelle, gilt als Faustregel die „3-2-1-Regel“: drei Kopien der Daten, auf zwei verschiedenen Arten von Speicher, davon eine an einem anderen Ort. Eine Sicherung auf demselben Server schützt nicht vor dem Verlust des Servers. Zusätzlich sollte mindestens eine Kopie so abgelegt sein, dass ein Angreifer mit Zugriff auf den Server sie nicht löschen kann (getrenntes Konto, nur Schreibrecht, unveränderbarer Speicher). Das Archiv enthält private Schlüssel und sollte außerhalb des Servers verschlüsselt gespeichert werden; das gezeigte Skript tut das nicht. Eine Möglichkeit ist das Werkzeug `age` aus Modul 12.6, das hier nicht in die Sicherung eingebaut und getestet wurde.

Typische Fehler: Die Sicherung enthält nicht das Entscheidende. Wer `conf` sichert, aber das Verzeichnis mit den Zertifikaten vergisst, kann den Dienst zwar starten, aber nicht mit HTTPS. Falsch ist „wir sichern den ganzen Server“, wenn niemand je geprüft hat, ob das Abbild startet; richtig ist eine Sicherung *mit* geprüftem Restore. Ein zweiter Fehler: Rechte gehen verloren. Im Test blieb der Schlüssel nach der Wiederherstellung bei Rechten 600, weil `tar` sie speichert; ein Kopieren mit einfachen Mitteln (zum Beispiel über ein Netzlaufwerk ohne Rechteverwaltung) kann den Schlüssel dagegen weltweit lesbar machen.

> **Praxisbeispiel: Das fehlende Zertifikat**
>
> Ein Betrieb stellt nach einem Plattenausfall die Konfiguration aus der Sicherung wieder her, aber die Zertifikatsdateien lagen in einem Verzeichnis außerhalb der Sicherung. Der Server startet nicht, weil `nginx -t` die fehlende Datei meldet. Die Seite ist erst nach zwei Stunden wieder erreichbar, weil ein neues Zertifikat ausgestellt werden muss. Seitdem steht auf der Checkliste: „Alle Dateien, die in der Konfiguration vorkommen, sind in der Sicherung.“

## 14.5 Log Retention

*Log Retention* (Aufbewahrung von Protokollen) legt fest, wie lange Zugriffs- und Fehlerprotokolle gespeichert werden und was danach mit ihnen geschieht. Zwei Kräfte ziehen in entgegengesetzte Richtungen. Der Betrieb will Protokolle lange behalten, um Fehler zu analysieren, Angriffe nachzuvollziehen und Kapazität zu planen. Der Datenschutz und die Kosten sprechen dagegen: Protokolle enthalten IP-Adressen, die als personenbezogene Daten gelten können, und sie belegen Speicher. Eine gute Regelung ist ein begründeter Kompromiss, der schriftlich festgehalten und technisch durchgesetzt wird.

Technisch erledigt die Rotation (*Log Rotation*) die Arbeit: In regelmäßigen Abständen wird die aktuelle Protokolldatei abgeschlossen, eine neue begonnen, alte Dateien werden komprimiert und nach einer festen Zahl von Rotationen gelöscht. Unter Linux übernimmt das `logrotate`. Die folgende Konfiguration gehört zum Nginx-Testserver:

```bash
/tmp/m14/lr/access.log {
    rotate 3
    compress
    delaycompress
    create 0640 root root
    postrotate
        kill -USR1 $(cat /tmp/m14/lr/n.pid)
    endscript
}
```

`rotate 3` behält drei alte Dateien. `compress` komprimiert sie mit `gzip`, und `delaycompress` schiebt die Komprimierung um eine Runde auf, sodass die jüngste alte Datei noch unkomprimiert bleibt; das ist nützlich, weil ein Prozess möglicherweise noch einen Moment in sie schreibt. `create` legt die neue Datei mit den angegebenen Rechten an. Der Block `postrotate` sendet dem Nginx-Hauptprozess das Signal `USR1`, das ihn die Protokolldateien neu öffnen lässt. Hierzu in einem Moment mehr. Wir haben die Rotation erzwungen (`logrotate -f`) und nach jedem Schritt die Zeilen gezählt:

```bash
Start (5 Anfragen):
  access.log: 5 Zeilen
Nach Rotation MIT postrotate USR1 + 3 Anfragen:
  access.log: 3 Zeilen
  access.log.1: 5 Zeilen
2. Rotation + 2 Anfragen (delaycompress):
  access.log: 2 Zeilen
  access.log.1: 3 Zeilen          (unkomprimiert)
  access.log.2.gz: 5 Zeilen       (komprimiert)
```

Das Ergebnis zeigt die Staffelung: Die aktuelle Datei enthält nur die neuesten Zeilen, die vorige liegt unkomprimiert, die ältere als `.gz`. Nach drei weiteren Rotationen würde die älteste Datei gelöscht (`rotate 3`). Mit einer Rotation täglich ergibt das eine Aufbewahrung von rund drei Tagen; der Wert muss zur Vorgabe der Organisation passen. Ein Trockenlauf mit `logrotate -d` zeigt vorab, was geschehen würde, ohne etwas zu verändern; der Befehl meldet auch, dass er im Debug-Modus nichts tut.

Nun zur Warnung, auf die der `postrotate`-Block abzielt. Ohne ihn behält Nginx die alte Datei geöffnet. Wir haben das mit einer Konfiguration ohne `postrotate` geprüft: Nach fünf Anfragen, einer Rotation und drei weiteren Anfragen hatte die *neue* Datei `access.log` null Zeilen, die *alte* Datei `access.log.1` aber acht. Nginx schrieb also weiter in die umbenannte Datei, und die neuen Protokolle landeten dort, wo die Rotation sie bald komprimiert und löscht. In der Praxis sieht das aus, als sei das Protokoll leer. Das Signal `USR1` an den Hauptprozess (Nginx) beziehungsweise (nach dem Kenntnisstand des Autors, nicht getestet) ein sanfter Neustart bei Apache löst das Neuöffnen aus.

Für die Datenschutzseite gibt es zwei Maßnahmen. Die erste ist die *Verkürzung der IP-Adresse* vor dem Schreiben. Nginx kann das mit einer `map`-Anweisung erreichen, die aus der Adresse eine gekürzte Variable bildet, die dann im Protokollformat steht:

```bash
map $remote_addr $ip_anon {
  ~(?P<ip>\d+\.\d+\.\d+)\.\d+$   $ip.0;
  ~(?P<ip>[^:]+:[^:]+:[^:]+):.*$ $ip::;
  default                        0.0.0.0;
}
log_format anon '$ip_anon [$time_local] "$request" $status $body_bytes_sent';
access_log /var/log/nginx/anon.log anon;
```

Die erste Regel schneidet bei IPv4 das letzte Byte ab und ersetzt es durch Null, die zweite bei IPv6 alles nach den ersten drei Gruppen, und alles andere wird zu `0.0.0.0`. Im Test haben wir die Adresse über einen Kopf (`X-Addr`) eingespeist, weil die Testumgebung kein IPv6 unterstützte; das ändert nur die Eingabe der `map`, nicht ihr Verhalten:

```bash
203.0.113.0 127.0.0.1 "GET / HTTP/1.1" 200
2001:db8:85a3:: 127.0.0.1 "GET / HTTP/1.1" 200
0.0.0.0 127.0.0.1 "GET / HTTP/1.1" 200
```

Die drei Zeilen zeigen die gekürzte IPv4-Adresse, die gekürzte IPv6-Adresse und den Standardfall für Ungültiges. (Die zweite Spalte, die echte Adresse, stand nur im Testformat zur Kontrolle; im produktiven Format fehlt sie.) Ob die Kürzung um das letzte Byte datenschutzrechtlich ausreicht, ist eine Frage für Fachleute und nicht Teil dieses Moduls. Bei Apache bietet `LogFormat` nach dem Kenntnisstand des Autors keine eingebaute Kürzung; dort setzt man ein nachgeschaltetes Programm oder eine Erweiterung ein, das wurde nicht getestet.

Die zweite Maßnahme ist die *befristete Löschung*. Neben `rotate` lässt sich ein altersbasiertes Löschen mit `find` ausdrücken:

```bash
$ ls -l --time-style=+%F old
l1.log (1 Tag alt)  l5.log (5 Tage)  l10.log (10 Tage)  l40.log (40 Tage)
$ find old -name '*.log' -mtime +7 -print -delete
old/l40.log
old/l10.log
$ ls old
l1.log  l5.log
```

Dateien, die älter als sieben Tage sind, wurden gelöscht, jüngere blieben. Wichtig ist, den `find`-Befehl zuerst ohne `-delete` auszuführen und zu prüfen, was er trifft; ein falsch angegebener Pfad löscht sonst mehr als gedacht.

> **Ergänzung aus der Nachrecherche: Rechtlicher Rahmen (keine Rechtsberatung)**
>
> Die Seite `e-recht24.de` (Stand 24.03.2022, ein kommerzielles Informationsangebot, abgerufen am 31.10.2026) nennt für Server-Logdateien keine gesetzliche Frist; Betreiber müssten vorab festlegen, wann sie löschen. Als Richtwert nennt sie, die Daten „in der Regel maximal 7 Tage“ zu behalten, und empfiehlt, IP-Adressen anonymisiert zu speichern. Die Seite verweist außerdem auf Rechtsprechung, die hier nicht geprüft wurde. Ob und wie lange Protokolle im konkreten Fall gespeichert werden dürfen, hängt vom Zweck (zum Beispiel Angriffsabwehr), von der Rechtsgrundlage und vom Land ab; das ist eine Frage für die Datenschutzbeauftragte oder einen Anwalt. Dieses Modul gibt dazu keine Rechtsberatung. Wichtig ist die Arbeitsweise: Dauer und Zweck schriftlich festlegen, technisch durchsetzen und prüfen.

Typische Fehler: Die Rotation wird eingerichtet, aber das Neuöffnen vergessen (siehe oben). Falsch ist `rotate 365` ohne Begründung nur „zur Sicherheit“; richtig ist eine Dauer, die jemand begründet hat. Ein zweiter Fehler ist, dass die Festplatte mit Protokollen volläuft, weil die Rotation nur wöchentlich läuft, der Verkehr aber stark gewachsen ist; deshalb gehört der freie Plattenplatz in die Überwachung (Modul 9). Ein dritter: Protokolle, die als Beweis dienen sollen, sind auf dem Server selbst gespeichert, wo ein Angreifer sie verändern kann. Wo das zählt, überträgt man sie laufend auf ein getrenntes System.

> **Praxisbeispiel: Das leere Protokoll nach dem Wochenende**
>
> Nach einer Umstellung auf neue Rotationsregeln ist das Zugriffsprotokoll am Montag fast leer. Die Ursache liegt in der vergessenen Neuöffnung: Der Server hat zwei Tage in eine Datei geschrieben, die bereits komprimiert und gelöscht wurde. Seit dem Vorfall gehört `postrotate` in die Vorlage, die für alle Server gilt, und ein Test (neue Zeilen nach der Rotation vorhanden) in die Abnahme.

## 14.6 Disaster Recovery

*Disaster Recovery* (DR) ist die Fähigkeit, nach einem schweren Ausfall den Betrieb wiederherzustellen, wenn die normalen Maßnahmen wie Neustart oder Ersatzserver nicht reichen. Ein *Desaster* kann der Verlust eines Rechenzentrums sein, ein Brand, ein großflächiger Ausfall beim Anbieter, ein Verschlüsselungsangriff (Ransomware) oder ein menschlicher Fehler, der Daten oder Konfiguration löscht. DR plant für Ereignisse, die selten sind, aber den Betrieb sonst existenziell treffen würden.

Zwei Kennzahlen bestimmen jeden DR-Plan. Das *Recovery Time Objective* (RTO) ist die höchste Zeit, die der Dienst ausfallen darf, bis er wieder läuft. Das *Recovery Point Objective* (RPO) ist die höchste Datenmenge, gemessen als Zeitraum, die verloren gehen darf. Ein RPO von einer Stunde heißt: Die letzte Sicherung darf höchstens eine Stunde alt sein, und Änderungen der letzten Stunde dürfen verloren sein. Beide Zahlen sind *Geschäftsentscheidungen*, keine technischen: Ein kürzeres RTO und RPO kosten Geld (häufigere Sicherungen, bereitstehende Ersatzsysteme), und die Fachseite muss sagen, was ein Ausfall kostet.

Aus RTO und RPO folgen die Verfahren. Ein RPO von 24 Stunden erlaubt eine nächtliche Sicherung. Ein RPO von fünf Minuten verlangt kontinuierliche Replikation. Ein RTO von mehreren Stunden erlaubt einen Neuaufbau aus Rollen und Sicherung; ein RTO von Minuten verlangt bereitstehende Ersatzsysteme, zu denen der Verkehr umgeschaltet wird (Modul 8). Man unterscheidet dazu einfache Stufen: *Backup und Neuaufbau* (billig, langsam), *kaltes oder warmes Reservesystem* (teilweise vorbereitet) und *aktiv-aktiv in zwei Standorten* (teuer, schnell). Diese Einteilung ist nach dem Kenntnisstand des Autors gebräuchlich, aber nicht an einer Quelle überprüft.

Für einen Webserver hat der Neuaufbau eine klare Reihenfolge, die man als Wiederanlaufplan aufschreibt: Erstens die Lage bestimmen und die Entscheidung „Desaster erklärt“ treffen (Wer darf das?). Zweitens ein neues System bereitstellen (Server oder Container). Drittens das Betriebssystem und die Software aus den Rollen aufbauen (Modul 12). Viertens Konfiguration, Inhalte und Schlüssel aus der Sicherung einspielen (14.4). Fünftens prüfen (Konfigurationstest, Regressionstests aus Modul 13.6). Sechstens den Verkehr umlenken, in der Regel durch eine DNS-Änderung oder den Lastverteiler, wobei die Gültigkeitsdauer der DNS-Einträge (*TTL*) bestimmt, wie schnell die Änderung bei den Nutzern ankommt. Siebtens beobachten, informieren und später den Normalbetrieb herstellen.

Der Plan muss die *Abhängigkeiten* kennen, die oft vergessen werden. Ein Webserver braucht DNS, Zertifikate (und die Möglichkeit, sie neu auszustellen), Zugangsdaten für Sicherung und Repositories, Netzwerkfreigaben und in vielen Fällen eine Anwendung und Datenbank, die ihre eigene Wiederherstellung brauchen. Der Webserver ist selten das eigentliche Problem; die Reihenfolge der Wiederherstellung ist es. Ein Plan, der verlangt, dass zuerst das Passwortsystem wiederhergestellt wird, aber dessen Zugangsdaten nur im Passwortsystem stehen, hat einen Kreisverweis.

> **Ergänzung aus der Nachrecherche: Ransomware und Löschen der Sicherung**
>
> Nach dem Kenntnisstand des Autors (nicht an einer Quelle überprüft) zielen Verschlüsselungsangriffe häufig auch auf die Sicherungen. Deshalb gehört zu einem DR-Plan mindestens eine Kopie, die ein Angreifer mit Zugriff auf den Server nicht ändern oder löschen kann, etwa auf einem getrennten Speicher mit nur schreibendem Zugriff oder ein unveränderbarer Speicher des Anbieters. Zusätzlich muss geklärt sein, wie man erkennt, *ab wann* Sicherungen unbrauchbar sind, denn eine verschlüsselte Datei wird gewissenhaft mitgesichert. Das beeinflusst, wie viele Generationen man aufhebt.

Typische Fehler: RTO und RPO existieren nur im Kopf eines Einzelnen oder sind „so schnell wie möglich“. Falsch ist ein Plan ohne Zahlen; richtig sind Zahlen, die jemand verantwortet und die durch Übungen bestätigt werden (14.7). Ein zweiter Fehler ist, dass der Plan nur in dem System steht, das ausgefallen ist (das Wiki auf dem Server, der kaputt ist); er muss an einem Ort liegen, der im Desaster erreichbar ist, auch ausgedruckt oder offline. Ein dritter: Der Plan beschreibt den Idealfall, nicht die Reihenfolge der echten Abhängigkeiten.

> **Praxisbeispiel: Die Reihenfolge entscheidet**
>
> Ein kleiner Betrieb verliert seinen Server. Im Plan steht: Server neu, Inhalte einspielen, DNS umstellen. Beim Üben stellt sich heraus, dass das Zertifikat ein Jahr alt ist und die zugehörige Anmeldung beim Zertifikatsdienst nur auf dem verlorenen Rechner gespeichert war. Der Plan wird um den Schritt „Zertifikat neu ausstellen, Zugangsdaten im Tresor“ ergänzt, bevor es ernst wird.

## 14.7 BCDR Tests

Ein Wiederherstellungsplan, der nicht getestet wurde, ist eine Behauptung. *BCDR-Tests* sind die regelmäßigen Übungen, die zeigen, ob RTO und RPO erreichbar sind, ob die Dokumentation stimmt und ob die Beteiligten ihre Rolle kennen. Die Lernziele des Lehrplans nennen dazu: Restore, Failover und Wiederanlauf regelmäßig üben sowie RTO, RPO und Verantwortlichkeiten nachweisbar dokumentieren.

Es gibt mehrere Stufen von Tests, die sich in Aufwand und Aussagekraft unterscheiden. Der einfachste ist die *Planbesprechung am Tisch* (englisch *tabletop exercise*): Das Team geht ein Szenario durch und beantwortet, was jeder täte; das findet Lücken im Plan, aber keine technischen Fehler. Dann der *Restore-Test*: Eine Sicherung wird in einer Testumgebung wiederhergestellt und geprüft. Weiter geht der *Failover-Test*: Der Verkehr wird auf das Ersatzsystem umgeschaltet. Der größte Test ist die *vollständige Übung*, in der ein Ausfall simuliert und der gesamte Plan abgearbeitet wird. Die Aussagen zu diesen Stufen sind eine Zusammenfassung des Autors aus Alltagswissen.

Wir haben eine kleine Übung als Skript geschrieben, die einen Ausfall simuliert, aus der Sicherung wiederherstellt und die Zeit bis zur ersten erfolgreichen Antwort misst:

```bash
#!/usr/bin/env bash
# drill.sh - Wiederanlauf-Uebung: Ausfall, Restore, RTO messen
PROD=/tmp/m14/prod; BAK=/tmp/m14/bak
arc=$(ls -t $BAK/web-*.tar.gz | head -1)
echo "Sicherung: $(basename $arc), Alter $(( $(date +%s) - $(stat -c %Y $arc) )) s"
echo "T0 Ausfall: Dienst gestoppt, Verzeichnis geloescht"
kill -QUIT $(cat $PROD/run/nginx.pid); sleep 0.5; rm -rf $PROD
t0=$(date +%s.%N)
/tmp/m14/restore.sh "$arc" "$PROD" || { echo "RESTORE FEHLGESCHLAGEN"; exit 1; }
until [ "$(curl -s -o /dev/null -w '%{http_code}' -m 1 localhost:8504/)" = 200 ]; do sleep 0.1; done
t1=$(date +%s.%N)
printf 'RTO gemessen: %.2f s\n' "$(echo "$t1 - $t0" | bc)"
echo "Inhalt nach Restore: $(curl -s localhost:8504/)"
echo "HTTPS: $(curl -sk -o /dev/null -w '%{http_code}' https://localhost:8505/)"
echo "Rechte key.pem: $(stat -c %a $PROD/tls/key.pem)"
```

Das Skript wählt die jüngste Sicherung und gibt ihr Alter aus. Dann stoppt es den Dienst und löscht das Verzeichnis (der simulierte Ausfall); *ab hier läuft die Uhr*. Es führt `restore.sh` aus und fragt in einer Schleife alle 0,1 Sekunden, ob die Startseite mit dem Statuscode 200 antwortet. Danach zeigt es die gemessene Zeit, den Inhalt (um zu sehen, welcher Stand zurückkam), die Funktion von HTTPS und die Rechte des Schlüssels. Vor dem Ausfall hatten wir, *nach* der Sicherung, die Startseite geändert („Shop v2 (nach der Sicherung)“). Das Ergebnis:

```bash
$ ./drill.sh
Sicherung: web-20261031-235149.tar.gz, Alter 6 s
T0 Ausfall: Dienst gestoppt, Verzeichnis geloescht
web-20261031-235149.tar.gz: OK
nginx: configuration file /tmp/m14/prod/conf/nginx.conf test is successful
RTO gemessen: 0.13 s
Inhalt nach Restore: Shop v1
HTTPS: 200
Rechte key.pem: 600
```

Die Übung liefert drei Erkenntnisse. Erstens: Die technische Wiederherstellung dauerte hier 0,13 Sekunden. Das ist ein *Laborwert*: Kleine Datenmenge, lokale Platte, ein Rechner, kein Mensch dazwischen. Ein echtes RTO enthält außerdem die Zeit bis zur Entdeckung, bis zur Entscheidung, die Bereitstellung eines Ersatzsystems, das Einspielen größerer Datenmengen und die DNS-Umstellung. Die Messung der *Technik allein* sagt nichts über das RTO aus, aber sie ist ein Baustein. Zweitens: Die Seite zeigt nach dem Restore `Shop v1`, nicht `Shop v2`. Die Änderung nach der Sicherung ist verloren; das ist das RPO in Aktion. Wäre das Ziel ein RPO von einer Minute gewesen, hätte die Sicherung nicht reichen dürfen. Drittens: HTTPS funktioniert, und der Schlüssel hat weiter die Rechte 600. Das bestätigt, dass die Sicherung die richtigen Dinge enthält.

Eine Übung ist erst dann ein Nachweis, wenn sie dokumentiert ist. Ein kurzes Protokoll hält Datum, Szenario, Beteiligte, gemessene Zeiten, aufgetretene Probleme und Verbesserungen fest. Zu einem Protokoll gehören etwa:

```bash
BCDR-Uebung 2026-10-31, Szenario: Verlust des Webservers web01
Beteiligte:       Betrieb (Leitung), Entwicklung (Pruefung)
Ziel:             RTO 60 min, RPO 24 h
Gemessen:         technischer Restore 0,13 s (Labor); Gesamtzeit Uebung 25 min
Datenverlust:     Aenderungen nach der Sicherung (Alter 6 s), RPO erfuellt
Probleme:         Zertifikat nur im Verzeichnis tls gesichert, ACME-Konto fehlte
Massnahmen:       ACME-Konto in Tresor aufnehmen (Verantw.: Betrieb, bis 30.11.)
Naechste Uebung:  in 6 Monaten, dann mit Failover auf Ersatzsystem
```

Die Zahlen in diesem Protokoll (Ziel 60 Minuten, Gesamtzeit 25 Minuten, ACME-Konto) sind erfunden und dienen nur dazu, die Form zu zeigen; gemessen sind allein der technische Restore und das Alter der Sicherung. Wichtig ist die Spalte „Maßnahmen“ mit einer verantwortlichen Person und einem Datum: Eine Übung ohne Folgen ist verschwendete Zeit.

> **Merke**
>
> Zur Übung gehört ein *Ausfallkriterium*: Bei welchem Ergebnis gilt sie als nicht bestanden (zum Beispiel Restore scheitert, RTO überschritten, Dokumentation falsch)? Ohne dieses Kriterium wird jede Übung als Erfolg gewertet. Die gemessenen Werte werden gespeichert und mit dem nächsten Mal verglichen, damit man Entwicklungen sieht.

Typische Fehler: Es wird nur die *Sicherung* geprüft, nicht der *Wiederanlauf*. Falsch ist die Aussage „das Backup-Skript läuft grün“; richtig ist „wir haben am Datum X wiederhergestellt und in Y Minuten einen funktionierenden Dienst gehabt“. Ein zweiter Fehler ist, dass die Übung immer von derselben Person gemacht wird, die den Plan kennt; im Ernstfall ist diese Person vielleicht im Urlaub. Deshalb übt auch jemand anderes nach dem Plan, ohne mündliche Hilfe. Ein dritter Fehler: Die Übung läuft nur in einer ruhigen Zeit und mit Vorankündigung; reale Ausfälle halten sich nicht daran.

> **Praxisbeispiel: Die Übung, die das Backup rettete**
>
> Bei einer Wiederherstellungsübung stellt ein Betrieb fest, dass die nächtliche Sicherung seit zwei Monaten leere Archive erzeugt, weil ein Pfad im Skript sich geändert hat. Das Skript meldete trotzdem Erfolg, weil es nur den Rückgabecode von `tar` prüfte, nicht die Größe. Seither prüft es Archiv und Prüfsumme wie in 14.4 und die Übung enthält einen Größenvergleich zur Vorwoche.

## 14.8 Betriebsroadmap

Eine *Betriebsroadmap* ist ein Plan für die kommenden ein bis drei Jahre, der festhält, welche Veränderungen am Betrieb anstehen, in welcher Reihenfolge und aus welchen Gründen. Sie unterscheidet sich vom Änderungsantrag (Modul 13.8), der eine einzelne Änderung beschreibt, und vom Betriebshandbuch, das den heutigen Zustand erklärt. Die Roadmap verhindert, dass der Betrieb nur auf Ereignisse reagiert: Statt im Dezember festzustellen, dass die Betriebssystemversion im Frühjahr ausläuft, steht das Ende des Supports schon ein Jahr vorher im Plan.

Eine brauchbare Roadmap beginnt bei den *festen Terminen*, die man nicht verschieben kann. Bei Webservern sind das vor allem die Enden des Supports und die Fristen von Zertifikaten. Ein Beispiel liefert die Seite zum Veröffentlichungszyklus von Ubuntu (abgerufen am 31.10.2026): Für Ubuntu 24.04 LTS enden die normalen Sicherheitsupdates im Mai 2029, die erweiterte Sicherheitswartung (ESM) im Mai 2034; für Ubuntu 26.04 LTS im Mai 2031 beziehungsweise Mai 2036. Auf der Seite steht allgemein: „LTS are released every two years and receive 5 years of standard security maintenance.“ Das Testsystem dieses Kurses läuft also auf einer Version, deren normaler Support nach dieser Angabe noch rund zweieinhalb Jahre dauert; ein Wechsel muss davor geplant, geprobt (Modul 13) und im Betrieb umgesetzt sein.

Ein zweites Beispiel für einen festen Termin zeigt, wie plötzlich sich Rahmenbedingungen ändern können. Das Kubernetes-Projekt teilte am 29.01.2026 mit, dass das Projekt „Ingress NGINX“ im März 2026 eingestellt wird und danach keine Veröffentlichungen und keine Sicherheitskorrekturen mehr erscheinen; empfohlen werden die Gateway API oder Controller von Drittanbietern (abgerufen, siehe Modul 12.9). Wer diesen Controller betrieb, hatte damit eine Frist, die nicht aus dem eigenen Kalender stammte. Eine Roadmap, die solche Abhängigkeiten sammelt (welche Komponente, wessen Projekt, welcher Stand, welches Ende?), erlaubt es, auf Ankündigungen früh zu reagieren.

> **Ergänzung aus der Nachrecherche: Versionsstände als Roadmap-Eingabe (abgerufen am 31.10.2026)**
>
> Nginx Stable 1.30.6 vom 14.10.2026 und Mainline 1.31.8 vom 21.10.2026 (nginx.org); Apache HTTP Server 2.4.69 vom 01.10.2026 (Schwachstellenübersicht des Projekts); Ubuntu 24.04 LTS mit Standardwartung bis Mai 2029 und ESM bis Mai 2034, Ubuntu 26.04 LTS bis Mai 2031 beziehungsweise Mai 2036 (ubuntu.com). Das Testsystem aus diesem Kurs hat Apache 2.4.58 und Nginx 1.24.0, also deutlich ältere Programmstände als die Herstellerversionen, aber mit den Korrekturen der Distribution (Modul 13.1).

Auf die festen Termine folgen die *Themen*, die man verfolgen will. Üblich ist eine Einteilung in drei Zeithorizonte: *Jetzt* (bereits geplant, Ressourcen zugesagt), *Als Nächstes* (Absicht, noch nicht terminiert) und *Später* (Idee, noch zu prüfen). Jedes Thema hat einen Verantwortlichen, eine Begründung (Risiko, Kosten, Kundennutzen) und einen *Auslöser*, der das Thema nach vorn schiebt. Ein einfaches Beispiel einer solchen Tabelle:

| **Horizont**   | **Thema**                                                            | **Begründung / Auslöser**                                            |
|:---------------|:---------------------------------------------------------------------|:---------------------------------------------------------------------|
| Jetzt (bis Q1) | Regressionstabelle und Rollback-Übung für alle Webserver (Modul 13)  | Voraussetzung für jede weitere Änderung                              |
| Jetzt (bis Q2) | Log-Aufbewahrung und Kürzung der IP-Adressen vereinheitlichen (14.5) | Datenschutz; Entscheidung der Datenschutzstelle liegt vor            |
| Als Nächstes   | Wiederanlaufübung mit Ersatzsystem (14.7)                            | Ziel: RTO belegen; Auslöser: erster Vertrag mit Verfügbarkeitszusage |
| Als Nächstes   | Betriebssystem-Wechsel auf die nächste LTS-Version                   | Ende der Standardwartung Mai 2029 (ubuntu.com); Vorlauf zwölf Monate |
| Später         | Wechsel von Apache auf Nginx prüfen (14.10)                          | Auslöser: Kostenvergleich nach 14.9 oder fehlende Apache-Module      |

Die Tabelle ist ein Beispiel, kein Befund aus einem echten Betrieb; die Einträge zeigen die Form. Wichtig sind die Auslöser, denn sie machen aus dem Wunsch eine Entscheidungsregel. Eine Roadmap ist außerdem ein *lebendes Dokument*: Sie wird mindestens vierteljährlich gelesen, angepasst und von denen bestätigt, die sie umsetzen müssen. Ein Plan, den keiner pflegt, veraltet schneller als die Software, die er betrifft.

Typische Fehler: Die Roadmap besteht nur aus Wünschen und enthält keine Termine, die von außen vorgegeben sind. Falsch ist „2027: alles modernisieren“; richtig sind Einträge mit Verantwortlichem, Begründung und Auslöser. Ein zweiter Fehler ist das Gegenteil, eine zu detaillierte Planung für drei Jahre, die nach einem Quartal überholt ist; man plant das nahe Fenster genau und das ferne grob. Ein dritter Fehler: Die Roadmap kennt keinen Platz für *Wartungsarbeiten* (Updates, Zertifikate, Rotationen), sodass sie nur aus neuen Projekten besteht und die Pflege zur Nebensache wird.

> **Praxisbeispiel: Zwölf Monate Vorlauf**
>
> Ein Betrieb legt für jede Plattform das Ende des Supports plus einen Vorlauf von zwölf Monaten als Termin „Migration abgeschlossen“ in die Roadmap. Ab sechs Monaten vorher beginnt die Staging-Probe. So bleibt Raum für Verzögerungen, ohne dass die Software ohne Sicherheitsupdates läuft.

## 14.9 Nginx FinOps

Auch bei Nginx gilt: Die Software ist (in der verbreiteten Open-Source-Fassung) frei, die Kosten entstehen im Betrieb. Neben den Rechen- und Datenvolumenkosten aus 14.1 gibt es einige Besonderheiten, die für Nginx typisch sind. Wir betrachten sie nach den Hebeln, die man in den Messungen sieht, und nach den Faktoren, die oft vergessen werden.

Der erste Hebel ist die *Ressourceneffizienz*. Nginx arbeitet mit wenigen Prozessen, die viele Verbindungen gleichzeitig bedienen (ereignisgesteuert). Im Test auf dem 2-Kern-System hatte Nginx mit zwei Arbeitsprozessen insgesamt drei Prozesse und eine Summe des RSS von 7 MB im Leerlauf und 8 MB nach 20 000 Anfragen mit 100 gleichzeitigen Verbindungen, bei rund 35 000 Anfragen pro Sekunde; Apache `event` kam auf 19 000 und `prefork` auf 2 900 (alle Messwerte aus 14.1; der RSS überschätzt wegen geteilter Seiten und gilt nur für diese Umgebung). Daraus folgt aber nicht automatisch eine Ersparnis: Das Kostenmodell aus 14.1 zeigte, dass bei *moderater* Last Nginx und Apache `event` dieselbe Zahl von Instanzen brauchen, weil die Reserve für den Ausfall die Zahl bestimmt. Der Vorteil von Nginx zeigt sich bei *hoher* Last oder vielen gleichzeitigen, trägen Verbindungen. Die Aussage, dass Nginx weniger Speicher je Verbindung braucht, lässt sich mit dieser Messung stützen, ein Verhältnis für andere Lasten aber nicht.

Der zweite Hebel ist *Zwischenspeicherung*. Ein Nginx vor einer Anwendung kann Antworten kurzzeitig vorhalten, und das senkt die Last des teuersten Gliedes, nämlich des Anwendungsservers. In Modul 11.13 lieferte ein Zwischenspeicher mit einer Gültigkeit von einer Sekunde bei 3 000 Anfragen in 0,215 Sekunden nur *einen* Treffer im Backend; direkt am Backend dauerte dieselbe Last 5,17 Sekunden (rund 580 Anfragen pro Sekunde). Bei Seiten, die für alle Besucher gleich sind, kann diese Technik die Zahl der Anwendungsserver deutlich verringern; sie hat aber Risiken, die in 11.5 gezeigt wurden (zum Beispiel wurde bei fehlender Sorgfalt eine Antwort für den Benutzer „Bob“ an „Alice“ ausgeliefert, wenn die Anmeldung nicht Teil des Schlüssels war). Eine Ersparnis durch Caching darf nie mit einem Datenschutzvorfall bezahlt werden.

Der dritte Hebel sind die *Verbindungen zum Backend*. Mit `keepalive` zum vorgelagerten Server stieg der Durchsatz im Test von 581 bis 713 auf 6 313 bis 7 055 Anfragen pro Sekunde, und die Zahl der Sockets im Zustand `TIME_WAIT` blieb bei Null statt bei 2 875 bis 3 926 zu wachsen (Modul 11.2). Ein einziger Konfigurationswert verändert also die Zahl der benötigten Backend-Instanzen. Solche „billigen“ Maßnahmen sollten vor jeder Aufrüstung der Hardware stehen.

> **Ergänzung aus der Nachrecherche: Lizenzen und Zusatzprodukte (nicht geprüft)**
>
> Nach dem Kenntnisstand des Autors, ohne Quelle abgerufen, gibt es neben dem freien Nginx kommerzielle Produkte des Herstellers mit zusätzlichen Funktionen und Support gegen Gebühr. Preise und Funktionsumfang wurden nicht recherchiert und gehören in einen Kostenvergleich, wenn man Support oder bestimmte Funktionen braucht. Dasselbe gilt für Pakete von Drittanbietern: Das Distributionspaket aus dem Test enthielt zum Beispiel kein Brotli-Modul (`unknown directive "brotli"`, Modul 13.3); wer es braucht, muss ein Zusatzmodul beschaffen und pflegen oder selbst bauen, und diese Arbeit ist ein Kostenfaktor.

Zu den oft vergessenen Faktoren gehört der *Pflegeaufwand* für Eigenbauten. Ein selbst gebauter Nginx mit Zusatzmodulen verlangt, bei jeder Sicherheitsmeldung neu zu übersetzen und zu testen (Modul 13.3). Die Arbeitsstunden dafür übersteigen leicht die Ersparnis bei den Serverkosten. Ebenso gehört die *Verfügbarkeit von Wissen* dazu: Wenn nur eine Person Nginx beherrscht, ist das ein Betriebsrisiko, das sich in Euro ausdrücken lässt (Vertretung, Schulung). Schließlich gibt es das *Risiko der Abhängigkeit von Projekten*: Das in 14.8 genannte Ende von Ingress NGINX zeigt, dass ein Baustein, den viele benutzen, plötzlich keine Sicherheitsupdates mehr erhalten kann; Umstiegskosten sind dann ungeplant.

> **Merke**
>
> FinOps ist keine Sparaktion. Es heißt, Kosten *und Nutzen* sichtbar zu machen: gemessene Leistung, Zielauslastung, Reserve, Arbeitszeit und Risiko in einer Rechnung. Die Rechnung hat ein Verfallsdatum; bei jeder Änderung der Last oder der Preise ist sie zu wiederholen.

Typische Fehler: „Nginx ist leichtgewichtig, also kostenlos im Betrieb“ (der Aufwand für Betrieb und Wissen bleibt). Falsch ist ein Kostenvergleich, der nur die Serverkosten enthält; richtig ist ein Vergleich mit den Posten aus 14.1 (Rechnung, Datenvolumen, Speicher, Arbeitszeit, Risiko) über einen festen Zeitraum, zum Beispiel drei Jahre. Ein weiterer Fehler: Messwerte aus fremden Tests übernehmen. Die Zahlen aus diesem Modul stammen von einem 2-Kern-Testsystem mit Lastgenerator auf demselben Rechner und gelten nur dort.

> **Praxisbeispiel: Eine Zeile, die Server spart**
>
> Ein Betrieb bemerkt, dass sein Nginx die Verbindungen zum Anwendungsserver bei jeder Anfrage neu aufbaut. Eine Zeile (`keepalive 32;` im `upstream`-Block, dazu `proxy_http_version 1.1` und ein leerer `Connection`-Kopf) senkt die Last auf dem Anwendungsserver so weit, dass zwei von vier Instanzen entfallen. Die Kostenersparnis dieser Zeile übersteigt jede Optimierung bei den Webservern selbst.

## 14.10 Apache zu Nginx Migration

Der Wechsel von Apache zu Nginx ist eine der häufigsten großen Migrationen im Webserver-Betrieb, und sie ist heikel, weil die beiden Server Konfiguration grundverschieden verstehen. Apache liest zur Laufzeit `.htaccess`-Dateien in den Verzeichnissen der Webinhalte und wendet deren Regeln an. Nginx kennt nichts Vergleichbares: Alle Regeln stehen in der Serverkonfiguration, die beim Start gelesen wird. Aus Sicht der Anwendung ist das ein Vorteil (schneller, weil keine Dateien pro Anfrage gesucht werden, Modul 3), aus Sicht der Migration die größte Schwierigkeit, denn die Regeln liegen verstreut in Verzeichnissen und wurden vielleicht von Entwicklern angelegt, die niemand mehr kennt.

Das Lehrplanziel lautet: Apache-Virtual-Hosts, Rewrite-Regeln und `.htaccess`-Logik in Nginx-Konfiguration überführen und die Migration mit Staging, Weiterleitungstests und Rückweg absichern. Wir führen das an einem Beispiel durch, das alle typischen Bausteine enthält und mit beiden Servern auf dem Testsystem ausgeführt wurde. Die Apache-Seite besteht aus einer Konfiguration mit `AllowOverride All` und zwei `.htaccess`-Dateien. Die erste liegt im Wurzelverzeichnis:

```bash
# site/.htaccess
Options -Indexes
ErrorDocument 404 /404.html
Header always set X-Content-Type-Options nosniff
<FilesMatch "^\.">
  Require all denied
</FilesMatch>
Redirect permanent /old /neu.html
RewriteEngine On
RewriteRule ^alt/(.*)$ /neu.html [R=301,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^app/ /app.html [L]
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
</IfModule>

# site/admin/.htaccess
AuthType Basic
AuthName "Admin"
AuthUserFile /tmp/m14/mig/site/.htpasswd
Require valid-user
```

Die Regeln bedeuten der Reihe nach: keine Verzeichnislisten; eine eigene 404-Seite; ein Sicherheitskopf bei allen Antworten; Zugriff auf Dateien, deren Name mit einem Punkt beginnt, verbieten; eine dauerhafte Weiterleitung von `/old`; eine Umschreibung von `/alt/...` auf `/neu.html` mit Weiterleitung; für alles unter `/app/`, was keine Datei oder kein Verzeichnis ist, die Seite `app.html` ausliefern (das klassische Muster für Anwendungen mit einem Einstiegspunkt); lange Gültigkeit für CSS-Dateien; und im Verzeichnis `admin` eine Anmeldung mit Benutzernamen und Passwort aus einer `.htpasswd`-Datei. Die zugehörige Nginx-Konfiguration, wie wir sie schließlich getestet haben:

```bash
server {
  listen 8512; root /tmp/m14/mig/site; index index.html;
  error_page 404 /404.html;
  add_header X-Content-Type-Options nosniff always;
  location ~ /\.(?!well-known/) { deny all; }
  location ~ ^/old(/.*)?$ { return 301 /neu.html$1; }
  location /alt/ { rewrite ^/alt/(.*)$ /neu.html permanent; }
  location /app/ { try_files $uri $uri/ /app.html; }
  location ~* \.css$ { expires 1y; add_header X-Content-Type-Options nosniff always; }
  location /admin/ {
    auth_basic "Admin";
    auth_basic_user_file /tmp/m14/mig/site/.htpasswd;
  }
}
```

Die Entsprechungen im Überblick: `Options -Indexes` ist bei Nginx der Normalzustand (Verzeichnislisten gibt es nur mit `autoindex on`); `ErrorDocument` entspricht `error_page`; `Header always set` entspricht `add_header ... always`; `FilesMatch` wird zu einem `location` mit regulärem Ausdruck; `Redirect` und `RewriteRule` werden zu `return` und `rewrite`; die Bedingungen `RewriteCond ... !-f` und `!-d` lassen sich mit `try_files` ausdrücken; `ExpiresByType` wird zu `expires` (hier im `location` für CSS, weil Nginx nach Dateiendungen auswählt); und `AuthType Basic` mit `AuthUserFile` wird zu `auth_basic` mit `auth_basic_user_file`. Die Passwortdatei ließ sich unverändert weiterverwenden: Mit dem Benutzer `bob` (von `htpasswd` erzeugt) lieferten beide Server ohne Anmeldung 401, mit richtigem Passwort 200 und mit falschem 401.

Die eigentliche Arbeit steckt in den Unterschieden, die man nicht sieht, wenn man die Regeln nur übersetzt. Wir haben deshalb ein Prüfskript über beide Server laufen lassen, die Regressionstabelle aus Modul 13.6 (`regress.sh`), mit einer Abwandlung: Es schneidet das Semikolon aus dem Inhaltstyp ab, weil Apache `text/html; charset=UTF-8` sendet und Nginx nur `text/html`. Der erste Versuch mit einer *naiven* Nginx-Konfiguration, die nur die offensichtlichen Regeln übertrug (ohne den Dateinamen-Schutz und mit einer `location = /old` statt der Regel für das ganze Präfix), brachte Folgendes zutage:

```bash
ABWEICHUNG /old/x      alt: 301|/neu.html/x     neu: 404
ABWEICHUNG /.env       alt: 403                 neu: 200|text/plain
ABWEICHUNG /.htaccess  alt: 403                 neu: 200|text/plain
ABWEICHUNG /.htpasswd  alt: 403                 neu: 200|text/plain
```

Die Ausgabe ist ein Auszug. Sie zeigt zwei schwere Fehler, die jedes Übersetzen ohne Test begleiten. Der erste: `Redirect permanent /old ...` in Apache wirkt auf den *Anfangsteil* des Pfades, auch für `/old/x`, und hängt den Rest an; die naive Regel mit `=` traf nur genau `/old`. Der zweite ist gravierender: Die Dateien `.env`, `.htaccess` und `.htpasswd` wurden von Nginx als `text/plain` ausgeliefert, also im Klartext einschließlich der Passwort-Hashes. In Apache hatte die `.htaccess` selbst diesen Schutz geliefert (die Regel `FilesMatch`, und bei Debian-Systemen zusätzlich die mitgelieferte Grundkonfiguration, nach dem Kenntnisstand des Autors); nach dem Wechsel ist die schützende Regel verschwunden, und der Fehler fällt nur durch einen Test auf. Das ist die wichtigste Lehre dieses Abschnitts: *Beim Wechsel gehen nicht nur Funktionen, sondern auch unsichtbare Schutzfunktionen verloren.*

Mit der korrigierten Konfiguration (oben) sah das Ergebnis so aus, wobei die Zeilen mit `ABWEICHUNG` nur noch den Inhalt von Fehler- und Weiterleitungsseiten betreffen, die der Server selbst erzeugt:

```bash
GLEICH     /               (200||text/html|60ec1089f429)
GLEICH     /neu.html       (200||text/html|66e200f0381f)
ABWEICHUNG /old            alt: 301|/neu.html|text/html   neu: 301|/neu.html|text/html
ABWEICHUNG /old/x          alt: 301|/neu.html/x           neu: 301|/neu.html/x
ABWEICHUNG /alt/seite      alt: 301|/neu.html             neu: 301|/neu.html
GLEICH     /app/irgendwas  (200||text/html|260569d69491)
GLEICH     /missing        (404||text/html|610946229577)
ABWEICHUNG /assets/        alt: 403                       neu: 403
GLEICH     /assets/a.css   (200||text/css|4bcdc870de70)
ABWEICHUNG /.env           alt: 403                       neu: 403
ABWEICHUNG /.git/config    alt: 200                       neu: 403
ABWEICHUNG /.htaccess      alt: 403                       neu: 403
ABWEICHUNG /.htpasswd      alt: 403                       neu: 403
ABWEICHUNG /admin/         alt: 401                       neu: 401
```

Die Zeilen sind gekürzt dargestellt (die Prüfsummen der Fehlerseiten sind weggelassen). In den `ABWEICHUNG`-Zeilen stimmen Status und Weiterleitungsziel überein; es unterscheidet sich nur der Text der vom Server erzeugten Seite, denn beide Server schreiben ihre eigenen Standardtexte. Für solche Fälle sollte die Prüfung nur Status und Ziel vergleichen. Eine Ausnahme ist ein echter Unterschied: `/.git/config` lieferte Apache mit 200 aus, Nginx dagegen mit 403. Apache hatte nur Dateien geschützt, die mit einem Punkt *beginnen*; die Datei `config` in einem Verzeichnis `.git` heißt aber nicht so. Dieser Fehler bestand also schon in der alten Konfiguration und wurde durch die neue Regel (die auch Verzeichnisse mit Punkt erfasst) *versehentlich behoben*. Ein Test, der den Unterschied zeigt, gibt die Gelegenheit, ihn bewusst zu entscheiden.

Zwei weitere Beobachtungen aus dem Test sind lehrreich. Erstens: Beim Aufbau der Apache-Seite fehlte zunächst das Modul `mod_authz_user`; die Anfrage auf `/admin/` lieferte `500`, im Fehlerprotokoll stand `Unknown Authz provider: valid-user`. Das Problem steckte in einer `.htaccess`-Datei und zeigte sich erst bei der *Anfrage*, nicht bei der Syntaxprüfung der Hauptkonfiguration. Das ist das Gegenstück zu Nginx, wo die gesamte Konfiguration beim Start geprüft wird, und ein Argument für den Wechsel. Zweitens: Der Kopf `X-Content-Type-Options` musste im `location` für CSS wiederholt werden, damit er dort erscheint. Nach dem Kenntnisstand des Autors (nicht getestet) gilt bei Nginx, dass `add_header` aus einer höheren Ebene verloren geht, sobald auf einer tieferen Ebene eigene `add_header`-Zeilen stehen. Im Test kam der Kopf bei beiden Servern genau einmal vor.

> **Ergänzung aus der Nachrecherche: Weitere Stolpersteine bei der Umstellung (nicht getestet)**
>
> Nach dem Kenntnisstand des Autors, ohne Überprüfung, gehören zur Umstellung außerdem: die Anbindung von PHP und anderen Anwendungen (bei Apache oft über ein Modul im Server selbst, bei Nginx über einen getrennten Prozess und Schnittstelle, die in Modul 7 behandelt wurde); die Behandlung von Pfaden mit Groß- und Kleinschreibung und von doppelten Schrägstrichen; die Reihenfolge der Auswahl von `location`-Blöcken (Nginx wählt nach festen Regeln, nicht in der Reihenfolge der Datei, außer bei regulären Ausdrücken); und die Weiterleitung von Anfragen mit Anfragetext (POST). Alle diese Punkte gehören in die Regressionstabelle, und ihre Wirkung ist im Staging an echten Anfragen zu prüfen.

Die Umstellung selbst folgt dem Ablauf aus Modul 13. Zuerst die Bestandsaufnahme: alle `.htaccess`-Dateien suchen (mit `find` nach Dateien dieses Namens), alle Rewrite-Regeln, Umleitungen, Zugriffsregeln, Header- und Cache-Einstellungen sammeln und je Regel einen Test schreiben. Dann das Staging: Nginx mit der übersetzten Konfiguration neben dem alten Server aufbauen, die Tabelle über beide laufen lassen und Spiegelung oder Wiedergabe von echten Anfragen nutzen (13.5). Danach der stufenweise Übergang mit einem kleinen Verkehrsanteil (Modul 8). Und schließlich der Rückweg: Der Apache-Pool bleibt unverändert bereit, bis der Beobachtungszeitraum vorbei ist; ein Zurück ist das Umstellen der Gewichtung (13.7). Zuletzt die Dokumentation (13.8) mit der Begründung jeder bewussten Abweichung.

Typische Fehler: Man übersetzt nur die Regeln, die man *sieht*, und übersieht die, die in Unterverzeichnissen liegen. Falsch ist „die `httpd.conf` ist übersetzt, also fertig“; richtig ist das Durchsuchen des gesamten Inhaltsverzeichnisses nach `.htaccess`-Dateien. Ein zweiter Fehler ist, die Entsprechungen blind zu übernehmen; die Regeln für den Pfadvergleich unterscheiden sich, und der Test zeigt es. Ein dritter Fehler ist, den Test nur mit erlaubten Anfragen zu machen: Die wichtigsten Prüfungen sind die *verbotenen* (die Zeilen mit `.env` und `.htpasswd` oben).

> **Praxisbeispiel: Der Fund im Staging**
>
> Beim Üben einer solchen Umstellung fragt das Team routinemäßig eine Liste von Dateien ab, die nie erreichbar sein dürfen (`.env`, `.git/config`, Sicherungsdateien wie `index.php.bak`). Das Staging liefert die `.env` aus. Das Team ergänzt die Regel und die Prüfzeile, bevor die erste Anfrage aus dem Internet ankommt.

## Übungsaufgaben

Die Aufgaben steigen im Schwierigkeitsgrad. Für die praktischen Aufgaben genügt ein Testrechner mit Apache, Nginx, `curl`, `logrotate` und `tar`.

**Aufgabe 1 (leicht).** Erkläre die Begriffe RTO und RPO an einem Beispiel. Welcher der beiden bestimmt, wie oft gesichert werden muss?

**Aufgabe 2 (leicht).** Nenne vier Kostenarten, die beim Betrieb eines Webservers entstehen, obwohl die Software lizenzfrei ist.

**Aufgabe 3 (leicht).** Warum gehört die Prüfsumme zu jeder Sicherung? Was zeigt `sha256sum -c` bei einem beschädigten Archiv?

**Aufgabe 4 (mittel).** Ein Server liefert 1 200 Anfragen pro Sekunde in der Spitze, die mittlere Antwortzeit beträgt 80 ms. Wie viele Anfragen sind im Mittel gleichzeitig aktiv? Wie viele Threads sollte `MaxRequestWorkers` bei einem Puffer von 1,5 und `ThreadsPerChild 25` mindestens erlauben?

**Aufgabe 5 (mittel).** Nach der Rotation steht in der neuen Protokolldatei nichts mehr, während die Datei der Vorwoche stark wächst. Erkläre die Ursache und die Behebung.

**Aufgabe 6 (praktisch).** Schreibe eine `logrotate`-Konfiguration für das Zugriffsprotokoll von Nginx mit täglicher Rotation, 14 Generationen, Komprimierung mit verzögertem Packen und Neuöffnen per Signal. Teste sie mit `logrotate -d` und danach mit `-f`, und zähle die Zeilen vor und nach der Rotation.

**Aufgabe 7 (praktisch).** Erweitere `backup.sh` so, dass es eine Mindestgröße des Archivs prüft (zum Beispiel mindestens 80 Prozent des vorigen Archivs) und andernfalls mit einem Fehler endet. Teste mit einem absichtlich leeren Quellordner.

**Aufgabe 8 (schwer).** Übersetze die folgenden `.htaccess`-Regeln in Nginx und schreibe eine Prüftabelle für `regress.sh`: (a) `Redirect 301 /blog /news`, (b) `RewriteRule \^{}produkt/([0-9]+)$ /shop.php?id=$1 [L]`, (c) Zugriff auf `/intern/` nur aus dem Netz 10.0.0.0/8. Welche Unterschiede erwartest du, und welche Fälle prüfst du zusätzlich?

**Aufgabe 9 (schwer).** Entwirf für einen Webshop mit zwei Nginx-Servern und einer Datenbank einen DR-Plan: RTO und RPO begründen, Sicherungsstrategie, Wiederanlaufreihenfolge mit Abhängigkeiten, Übungsplan und ein Protokoll-Raster. Nenne mindestens drei Abhängigkeiten, die im Desaster ausfallen könnten.

## Lösungen und Erklärungen

**Lösung 1.** Das RTO ist die höchste tolerierte Ausfallzeit, das RPO der höchste tolerierte Datenverlust, gemessen als Zeitraum. Beispiel: RTO 1 Stunde heißt, dass der Dienst nach spätestens einer Stunde wieder laufen muss; RPO 24 Stunden heißt, dass Änderungen eines Tages verloren gehen dürfen. Das RPO bestimmt die Häufigkeit der Sicherung (bei 24 Stunden täglich), das RTO die Art der Wiederherstellung (Neuaufbau oder Ersatzsystem).

**Lösung 2.** Rechenressourcen (Server, Prozessor, Speicher), Datenvolumen (ausgehender Verkehr), Speicher für Protokolle und Sicherungen, Arbeitszeit für Betrieb und Pflege; zusätzlich zum Beispiel Zertifikate, Überwachung oder Supportverträge (je Betrieb).

**Lösung 3.** Die Prüfsumme erkennt Beschädigungen und unvollständige Übertragungen, bevor man das Archiv einspielt. Bei einem beschädigten Archiv meldet `sha256sum -c` `FAILED` und `WARNING: 1 computed checksum did NOT match` (im Test mit einem überschriebenen Byte).

**Lösung 4.** Nach dem Little’schen Gesetz: 1 200 mal 0,08 s ergibt 96 gleichzeitige Anfragen. Mit Puffer 1,5 sind das 144, aufgerundet auf ein Vielfaches von 25 ergibt 150 (sechs Kindprozesse mit je 25 Threads). `MaxRequestWorkers` sollte also mindestens 150 erlauben; ob das Backend die Last trägt, ist eine eigene Frage.

**Lösung 5.** Der Server hat die alte Datei weiter geöffnet und schreibt in die umbenannte Datei; das Signal zum Neuöffnen (`USR1` bei Nginx) fehlt. Im Test hatte die neue Datei null Zeilen, die alte acht. Behebung: `postrotate` mit `kill -USR1` (Nginx) oder einem sanften Neustart (Apache, nicht getestet) und einen Test in die Abnahme, der nach der Rotation neue Zeilen verlangt.

**Lösung 6.**

```bash
/var/log/nginx/access.log {
    daily
    rotate 14
    missingok
    notifempty
    compress
    delaycompress
    create 0640 root adm
    postrotate
        kill -USR1 $(cat /run/nginx.pid)
    endscript
}
```

`daily` rotiert täglich, `rotate 14` behält 14 Generationen, `missingok` und `notifempty` verhindern Fehler bei fehlender oder leerer Datei, `delaycompress` packt die jüngste alte Datei erst eine Runde später. Der Pfad der PID-Datei und die Gruppe sind Annahmen und müssen zum System passen. Mit `logrotate -d konfig` sieht man, was geschehen würde; `logrotate -f -s status konfig` erzwingt die Rotation (im Test lieferten 5 Zeilen vor und 3 Zeilen nach der Rotation in der neuen Datei, 5 in der `.1`).

**Lösung 7.**

```bash
# nach dem tar-Aufruf in backup.sh einfuegen
neu=$(stat -c %s "$arc")
alt=$(ls -t "$dst"/web-*.tar.gz | sed -n 2p)
if [ -n "$alt" ]; then
  a=$(stat -c %s "$alt")
  if [ $((neu * 100)) -lt $((a * 80)) ]; then
    echo "FEHLER: Archiv ($neu) kleiner als 80 Prozent des vorigen ($a)"; exit 1
  fi
fi
```

Das Skript vergleicht die Größe des neuen Archivs mit dem zweitjüngsten (dem vorigen). Ein leerer Quellordner ergibt ein winziges Archiv, das die Prüfung auslöst. Die Idee entspricht dem Größenvergleich aus dem Praxisbeispiel in 14.7; die Schwelle von 80 Prozent ist eine Annahme und muss zur Schwankung der Daten passen.

**Lösung 8.** Mögliche Übersetzung: (a) `location \~{} \^{}/blog(/.*)?$ { return 301 /news$1; }` (Präfix wie bei Apache, siehe das Beispiel `/old/x`); (b) `location \~{} \^{}/produkt/([0-9]+)$ { rewrite \^{}/produkt/([0-9]+)$ /shop.php?id=$1 break; ... }` mit Weitergabe an die Anwendung; (c) `location /intern/ { allow 10.0.0.0/8; deny all; }`. Prüfzeilen: `/blog`, `/blog/x`, `/produkt/42`, `/produkt/abc`, `/intern/` aus erlaubtem und aus nicht erlaubtem Netz (Letzteres ist mit `curl` auf einem Testrechner schwer; hierfür wird eine Quelladresse über ein zweites System oder einen Kopf wie `X-Forwarded-For` und `real_ip` simuliert). Erwartete Unterschiede: Fehlerseitentexte und Inhaltstyp-Parameter; zusätzlich zu prüfen: Groß- und Kleinschreibung, Anfragetext bei POST, Abfrageparameter in der Weiterleitung und der Fall ohne abschließenden Schrägstrich. Die Details der Regeln sind hier als Vorschlag dargestellt; sie wurden nicht ausgeführt.

**Lösung 9.** Ein tragfähiger Plan enthält: (a) RTO und RPO mit Begründung aus dem Geschäft (zum Beispiel RTO 2 Stunden, RPO 15 Minuten für die Bestelldaten, RPO 24 Stunden für statische Inhalte); (b) Sicherung: Konfiguration in Git, Inhalte täglich, Datenbank laufend oder häufig, mindestens eine Kopie getrennt und unveränderbar, Schlüssel verschlüsselt; (c) Wiederanlauf in Reihenfolge: Entscheidung, Netz und DNS, Datenbank, Anwendung, Nginx aus Rollen, Konfiguration und Schlüssel, Prüfung mit Regressionstabelle, Umlenkung; (d) Übungsplan: Planbesprechung vierteljährlich, Restore-Test monatlich, Failover halbjährlich, vollständige Übung jährlich, jeweils mit Protokoll und Maßnahmenliste; (e) Raster wie in 14.7. Abhängigkeiten, die ausfallen können: DNS-Anbieter, Zertifikatsdienst und Konto, Passwortsystem, Paketquelle oder Abbildarchiv, Verbindung zum Sicherungsspeicher, Personen mit Zugriff. Wichtig ist die Begründung, wie jede Abhängigkeit im Plan abgesichert ist.
