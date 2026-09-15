# Werkzeuge

Die Kette für eine Ablösestrecke. Jedes Werkzeug ist einzeln aufrufbar und schreibt sein
Ergebnis in eine Datei — nichts hängt von einem laufenden Dienst ab.

| Werkzeug | Eingabe | Ergebnis |
| --- | --- | --- |
| `spaltenanalyse.py` | Spaltenliste des Ist-Exports | Markdown-Auswertung: Fallstricke, Blöcke, Benennung. Optional Vergleich zweier Strecken |
| `schema_attribute.py` | Blueprint-Manifest **oder** Schema-Slug | Attributliste; optional Zuordnungsvorschläge zu den Exportspalten |
| `mappe_bauen.py` | Spaltenliste, optional Vorschläge | Excel-Arbeitsmappe für die Mapping-Sitzung |
| `config_aus_erhebung.py` | ausgefüllte Arbeitsmappe | Konfigurationsentwurf für den Export-Lauf |
| `api_referenz_erzeugen.py` | Clone von `epilot-dev/sdk-js` | die 51 API-Seiten unter `../api-referenz/` |

## Ablauf

```bash
# 1 · Ist-Export verstehen
python3 werkzeuge/spaltenanalyse.py spalten.txt -o analyse.md --titel "Strecke X"

# 2 · Zielmodell holen (Blueprint braucht keinen Token)
python3 werkzeuge/schema_attribute.py --manifest blueprint.json \
    --spalten spalten.txt -o vorschlag.csv

# 3 · Arbeitsmappe bauen
python3 werkzeuge/mappe_bauen.py spalten.txt -o Mapping_X.xlsx \
    --titel "Strecke X" --vorschlaege vorschlag.csv

# 4 · Nach der Sitzung: Konfiguration erzeugen
python3 werkzeuge/config_aus_erhebung.py Mapping_X.xlsx -o config.yaml

# 5 · Trockenlauf
cd ../schnittstellenkonzept/umsetzung
python3 -m sap_export.job --config config.yaml --probelauf
```

## Zwei Grundsätze

**Geraten wird nicht.** Attributnamen kommen aus dem Blueprint oder dem konfigurierten
Schema, Dateiformate aus einer produktiven Originaldatei. Wo etwas fehlt, schreiben die
Werkzeuge `TODO` statt einer Vermutung.

**Vorschläge sind Vorschläge.** Der Namensabgleich in `schema_attribute.py` ordnet immer
dem Ähnlichsten zu — auch wenn das Richtige fehlt. Deshalb die Gütespalte: Alles unter
etwa 0,75 gehört angeschaut.

## Abhängigkeiten

`requests`, `PyYAML`, `openpyxl`. Installation über
`schnittstellenkonzept/umsetzung/requirements.txt`.

## Beim Ändern

Der Code folgt den Konventionen in [`../KONVENTIONEN.md`](../KONVENTIONEN.md): PEP 8,
Google-Style-Docstrings, Typannotationen. Geprüft wird mit `ruff check .` aus `epilot/` —
das läuft ohne Befund durch und soll es bleiben.
