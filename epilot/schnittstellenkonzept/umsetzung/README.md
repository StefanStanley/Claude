# Export Einspeiseanlagen → SAP (SK-001)

Holt fällige Vorgänge aus epilot, prüft sie, erzeugt die CSV byte-genau im
geforderten Format und legt sie atomar auf dem Netzlaufwerk ab.

> **Stand:** lauffähig gegen Testdaten, 22 Tests grün. Die Konfiguration enthält
> Platzhalter, bis der Rücklauf der [Erhebungsmappe](../erhebung/) da ist.
> Ohne die echte Kodierung und das echte Feldmapping ist der Job nicht produktionsreif.

## Der Grundgedanke

**Alles, was aus der Erhebung kommt, steht in der Konfiguration — nicht im Code.**
Kodierung, Trennzeichen, Zeilenende, Spaltenreihenfolge, Datumsformate, Wertelisten,
Prüfregeln. Wenn der Rücklauf Überraschungen bringt, ändert sich eine YAML-Datei.

Damit ist der Code schon jetzt nützlich, obwohl das Zielformat noch offen ist.

## Aufbau

```
sap_export/
  config.py         Konfiguration laden und prüfen (scheitert früh und laut)
  epilot.py         Entity API: Suche mit Paging und hydrate, Statusrückschreibung
  mapping.py        Pfadzugriff und Transformationen
  pruefung.py       fachliche Prüfungen — der Ersatz für die heutige Handkontrolle
  csvschreiber.py   byte-genaue Datei, atomare Ablage
  job.py            Ablauf und Kommandozeile
tools/
  config_aus_erhebung.py   erzeugt die Konfiguration aus der ausgefüllten Mappe
tests/                     22 Tests inkl. Fixtures
```

## Benutzung

```bash
pip install -r requirements.txt
export EPILOT_TOKEN="..."          # Access Token, token_type: api

# Konfigurationsentwurf aus der zurückgelaufenen Erhebungsmappe
python3 tools/config_aus_erhebung.py ../erhebung/SK-001_Erhebung_Schnittstelle_SAP.xlsx -o config.yaml

# Probelauf: erzeugt die Datei, legt nichts ab, schreibt keinen Status
python3 -m sap_export.job --config config.yaml --probelauf

# Probedatei zum Vergleich mit einem Original herausschreiben
python3 -m sap_export.job --config config.yaml --probelauf --ausgabe /tmp/vergleich.csv

# Echter Lauf
python3 -m sap_export.job --config config.yaml
```

Rückgabewert `0` = alles geliefert, `1` = etwas braucht Aufmerksamkeit
(Vorgänge in der Klärliste oder Status nicht geschrieben), `2` = kein Token.
Der Scheduler kann daran hängen.

## Fünf Entscheidungen, die im Code stecken

**Selektion über den Übertragungsstatus, nicht über einen Zeitraum.** Ein
Zeitraumfilter verliert Nachzügler lautlos und erzeugt bei jeder Wiederholung
Dubletten. Der Job holt alles mit Status `bereit` und setzt es danach auf
`uebertragen` — das ist wiederholbar und lückenlos.

**Erst die Datei ablegen, dann den Status setzen.** Andersherum wäre ein Vorgang
bei einem Abbruch als übertragen markiert, ohne je in einer Datei gestanden zu
haben. Scheitert das Statusschreiben, kommt der Vorgang im nächsten Lauf erneut —
eine Dublette, die SAP über die Korrelations-ID abfangen muss. Bewusst so herum:
**lieber doppelt als verloren.**

**Kodierungsfehler werden niemals still ersetzt.** Wenn ein Name ein Zeichen
enthält, das die Zielkodierung nicht kennt (etwa `ś` bei Windows-1252), wandert
der Vorgang in die Klärliste. Die bequeme Alternative wäre `errors="replace"` —
dann steht ein `?` im Namen und niemand merkt es je.

**Atomare Ablage.** Erst unter `.tmp` schreiben, dann umbenennen. Sonst holt der
SAP-Job irgendwann eine halb geschriebene Datei ab und importiert einen
abgeschnittenen Bestand. Die temporäre Endung muss so gewählt sein, dass der
Importjob sie nicht abholt.

**Im Zweifel nicht liefern.** Ein Vorgang in der Klärliste ist ein sichtbares
Problem, ein falscher Wert in SAP ein unsichtbares — und die Werte hier sind
Vergütungsgrundlagen. Alle Prüfungen eines Vorgangs laufen durch, damit die
Klärliste alle Probleme auf einmal nennt statt nur das erste.

## Wo der Job läuft

Reines Python ohne Plattformbindung. Damit läuft er als Databricks Job, als Azure
Function mit Timer oder als Cron-Job auf einem internen Server — die Entscheidung
hängt an der Kodierung der Zieldatei (siehe [SK-001](../SK-001-einspeiser-sap.md),
Abschnitt 4) und muss hier nicht vorweggenommen werden.

Wird die Datei nicht direkt auf das Netzlaufwerk geschrieben, sondern nach
Blob/ADLS, ändert sich nur `ablage.verzeichnis`. Den letzten Meter ins interne Netz
übernimmt dann Power Automate über den On-Premises Data Gateway.

**Der Token gehört in den Azure Key Vault**, nicht in ein Notebook und nicht in die
Konfiguration. Der Job liest ihn aus `EPILOT_TOKEN`.

## Prüfungen ergänzen

Die Regeln in `config.beispiel.yaml` sind ein Anfang. Was im Gespräch mit der
Sachbearbeitung auftaucht — „wann hast du zuletzt einen Vorgang herausgenommen?" —
kommt als weitere Regel dazu. Verfügbar sind `pflicht`, `regex`, `zahl_zwischen`,
`datum_nicht_zukunft`, `datum_nicht_aelter_als`, `in_werteliste`, `gleich_wie`.
Eine neue Regel ist eine Funktion in `pruefung.py` plus ein Eintrag in `PRUEFUNGEN`.

## Tests

```bash
python3 -m unittest discover -s tests -v
```

Abgedeckt sind Pfadzugriff, Transformationen, alle Prüfungen, das Dateiformat
byteweise (Zeilenende, Kodierung, Maskierung, BOM), die atomare Ablage und der
Lauf mit einer Attrappe der API — inklusive der Fälle „Status lässt sich nicht
schreiben" und „keine lieferbaren Vorgänge".

Ein Test prüft, dass die Klärliste **keine personenbezogenen Daten** enthält. Sie
wird protokolliert und weitergereicht und braucht die Kennung des Vorgangs, nicht
die Daten des Betreibers.

## Was noch fehlt

- Echtes Feldmapping und echte Kodierung aus dem Rücklauf der Erhebungsmappe
- Prüfregeln aus dem Gespräch mit der Sachbearbeitung
- Abgleichslauf: gelieferte Zeilen gegen in SAP angelegte Datensätze. Eine
  Dateischnittstelle hat keine Quittung — ohne diesen Abgleich bleibt der stille
  Fall unentdeckt, dass die Datei gar nicht erst abgeholt wurde.
