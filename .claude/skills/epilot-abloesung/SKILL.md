---
name: epilot-abloesung
description: >
  Vorgehen und Werkzeugkette für die Ablösung von Lovion durch epilot bei der
  Netzgesellschaft Düsseldorf — Kundenprozesse wie Einspeiseranmeldung und § 14a und ihre
  Datenübergabe an SAP. Nutze diesen Skill IMMER wenn es um epilot geht, um eine
  Schnittstelle oder einen Datenexport aus epilot, um Lovion oder dessen Ablösung, um ein
  Feldmapping oder eine Mapping-Sitzung, um CSV-Übergaben an SAP, um Entity-Schemas,
  Blueprints, Journeys oder Access Tokens in epilot. Auch relevant bei Netzanschluss,
  Einspeiseanlagen, steuerbaren Verbrauchseinrichtungen, EEG-Abrechnung, MaStR/SEE-Nummer,
  Marktlokation oder Zählerdaten in diesem Kontext — und wenn ein Ist-Export analysiert,
  eine Arbeitsmappe für eine Mapping-Runde gebaut oder eine Exportkonfiguration erstellt
  werden soll.
---

# epilot-Ablösung: Vorgehen und Werkzeuge

Alles Inhaltliche liegt im Repository unter `epilot/`. **Zuerst `epilot/CLAUDE.md` lesen** —
dort steht der aktuelle Stand, die getroffenen Entscheidungen und die verifizierten
epilot-Fakten. Dieser Skill beschreibt das *Verfahren*, nicht den Stand.

## Das Grundmuster

Jede Strecke folgt demselben Ablauf. Was bei Einspeiser und § 14a gelernt wurde, gilt für
die nächste Strecke genauso.

```
Ist-Export      →  Analyse    →  Attribute   →  Zuordnung  →  Mappe   →  Sitzung  →  Konfiguration  →  Parallelbetrieb
(Spalten+Datei)    (Werkzeug)    (Blueprint)    (Werkzeug)    (Werkzeug)             (Werkzeug)        (Vergleich)
```

## Werkzeugkette

Alle Werkzeuge liegen in `epilot/werkzeuge/`. Reihenfolge wie oben:

```bash
# 1 · Ist-Spalten analysieren — findet Duplikate, Randleerzeichen, Sonderzeichen, Blöcke
python3 epilot/werkzeuge/spaltenanalyse.py spalten.txt -o analyse.md --titel "Strecke X"

#     Zwei Strecken vergleichen (ein Format oder zwei?)
python3 epilot/werkzeuge/spaltenanalyse.py a.txt --vergleich b.txt -o vergleich.md

# 2 · Attribute des Zielmodells holen — Blueprint braucht keinen Token
python3 epilot/werkzeuge/schema_attribute.py --manifest blueprint.json \
    --spalten spalten.txt -o vorschlag.csv
#     Alternative gegen die laufende Instanz (genauer, weil mit euren Anpassungen):
EPILOT_TOKEN=… python3 epilot/werkzeuge/schema_attribute.py --schema opportunity

# 3 · Arbeitsmappe für die Sitzung bauen
python3 epilot/werkzeuge/mappe_bauen.py spalten.txt -o Mapping_X.xlsx \
    --titel "Strecke X" --vorschlaege vorschlag.csv

# 4 · Nach der Sitzung: Konfiguration aus der ausgefüllten Mappe erzeugen
python3 epilot/werkzeuge/config_aus_erhebung.py Mapping_X.xlsx -o config.yaml

# 5 · Export im Trockenlauf prüfen
cd epilot/schnittstellenkonzept/umsetzung
python3 -m sap_export.job --config config.yaml --probelauf
```

Die API-Referenz erzeugt sich selbst neu, wenn epilot Schnittstellen ändert:

```bash
git clone --depth 1 https://github.com/epilot-dev/sdk-js /tmp/sdk-js
python3 epilot/werkzeuge/api_referenz_erzeugen.py /tmp/sdk-js
```

## Die Regeln, die in der Umsetzung stecken

Der Export-Lauf in `epilot/schnittstellenkonzept/umsetzung/` ist
**konfigurationsgetrieben**: Alles Formatabhängige steht in einer YAML-Datei, der Code
kennt keine Zielfeldnamen. **Eine neue Strecke ist eine neue Konfiguration, kein neues
Programm.**

Fünf Entscheidungen sind dort bereits getroffen und gelten für jede Strecke:

1. **Selektion über einen Übertragungsstatus, nicht über einen Zeitraum.** Zeitraumfilter
   verlieren Nachzügler lautlos und duplizieren bei Wiederholung.
2. **Erst die Datei ablegen, dann den Status setzen.** Im Zweifel doppelt statt verloren —
   Dubletten fängt das Zielsystem über die Korrelations-ID ab.
3. **Kodierungsfehler nie still ersetzen.** Ein nicht darstellbares Zeichen schickt den
   Vorgang in die Klärliste, nicht mit `?` durch.
4. **Atomare Ablage**: unter `.tmp` schreiben, dann umbenennen. Sonst wird eine halb
   geschriebene Datei abgeholt.
5. **Im Zweifel nicht liefern.** Ein Vorgang in der Klärliste ist sichtbar, ein falscher
   Wert im Zielsystem nicht.

## Was bei jeder Strecke zuerst zu klären ist

Vor der Feldarbeit, sonst wird sie doppelt gemacht:

| Frage | Warum sie vorn steht |
| --- | --- |
| Welche Spalten braucht das Zielsystem **inhaltlich**? | Anzeigetexte müssen oft nur formal dastehen — das kann ein Fünftel der Arbeit sparen |
| Position oder Name als Schlüssel? | Bei doppelten Spaltennamen ist Namensmapping unmöglich |
| Was tritt an die Stelle der Lovion-Kennung? | Nur „Nummernkreis fortführen" lässt die SAP-Seite unberührt |
| Welche Kodierung hat die Originaldatei? | Entscheidet über das Werkzeug: UTF-8 ohne BOM → Power Automate genügt; sonst braucht es byte-genaue Kontrolle |
| Welches Feld ist der Diskriminator? | Bedingte Pflichtfelder — sonst hält die Prüfung jeden Vorgang zurück |

## Wiederkehrende Fallstricke

Alle schon einmal aufgetreten:

- **Mehrfach vorkommende Spaltennamen** (§ 14a: `text-info-messkonzept` dreimal)
- **Leerzeichen am Rand eines Spaltennamens** — nur im byteweisen Vergleich sichtbar
- **Zeichenkodierung**: epilot liefert UTF-8; erwartet die Gegenseite Windows-1252, zerlegt
  es jeden Umlaut
- **Template-Variablen liefern Adressen als Block**, die Entity API liefert sie strukturiert
  (`address.0.street` …) — für Exporte immer die Entity API nutzen
- **Relationen liefern nur `entity_id`** — ohne `hydrate: true` fehlen die Werte
- **Org-Header uneinheitlich**: meist `x-epilot-org-id`, teils `x-ivy-org-id`
- **Vokabelbrüche zwischen Formular und Schema**: Was das Formular „Wallbox" nennt, heißt
  in epilot `ladeeinrichtung`/`ladepunkt` — das Wort „Wallbox" kommt im Schema nicht vor.
  Ein Abgleich, der nichts findet, heißt „heißt anders", nicht „fehlt"

## Haltung

- **Ehrlich über Annahmen.** Zweimal wurde eine falsche Annahme erst spät korrigiert (die
  Erzeugung läuft automatisiert, nicht von Hand; der Einspeiser-Export enthält keine
  Personendaten). Lieber eine Lücke benennen als sie füllen.
- **Erst gleichwertig ablösen, verbessern danach.** Eine Ablösung, die gleichzeitig alles
  besser macht, wird nicht fertig.
- **Der Abnahmevergleich ist byteweise** gegen produktive Originaldateien — nicht nur die
  Werte, auch Kodierung, Trennzeichen, Maskierung und Zeilenenden.

## Zuerst die Präfix-Familien, dann das Mapping

epilot hängt die Felder **aller** Formularstrecken an dasselbe Schema — bei der NGD 880
Attribute an `opportunity`; die übrigen 30 Schemas sind Standard und klein. Die Strecken
unterscheiden sich allein am Namenspräfix: `ea_` Erzeugungsanlage (Einspeiser), `vb_`
Verbrauchseinrichtung (§ 14a), `ha_` Hausanschluss.

Daraus folgt das Vorgehen:

1. `schema_attribute.py --schema opportunity --familien` — welche Strecken liegen drauf?
2. Mit `--praefix` auf die eigene eingrenzen, **dann** erst abgleichen.

Ein Abgleich gegen das ganze Schema liefert Rauschen: 86 Spalten ergaben 64 Vorschläge,
davon 10 belastbar. Der Grund ist doppelt — bei 880 Kandidaten findet Ähnlichkeit fast
immer irgendetwas, und die epilot-Namen tragen ihr Streckenpräfix mit, die Exportspalten
nicht. `--praefix` behebt beides (`ZN_Z1 → 14a_anmeldung_zaehlernummer_z1` steigt von
0,70 auf 1,00).

**Ein Präfix ist nicht die Strecke.** `14a_*` umfasst nur 18 Felder (Zähler, Messkonzept,
Modulwahl) — die Geräte einer § 14a-Anmeldung stehen unter `vb_*`. Vor dem Eingrenzen die
Familienliste ganz lesen.

## Konventionen im Code

Gängige Standards, keine Hauskonvention: PEP 8, PEP 257 mit Google-Style-Docstrings
(`Args:`/`Returns:`/`Raises:`), Typannotationen, Conventional Commits. Maschinenlesbar in
`epilot/pyproject.toml`, begründet in `epilot/KONVENTIONEN.md`; `ruff check .` läuft ohne
Befund durch.

Zwei Regeln, die häufiger gebrochen werden als der Rest:

- **Das „Warum" in den Docstring, das „Was" in den Code.** Ein Docstring, der die Signatur
  wiederholt, ist Ballast; einer, der die Entscheidung begründet, überlebt die nächste
  Änderung.
- **Ausnahmeklassen dokumentieren, wann sie fliegen** — nicht, dass sie Ausnahmen sind.

Bezeichner sind deutsch, weil die Domäne deutsch ist (Einspeiser, Zählpunkt,
Inbetriebsetzung). Ausgenommen: Feldnamen fremder Systeme, die stehen so da, wie die API
sie schreibt.

## Umgebung

`docs.epilot.io` und `www.netz-duesseldorf.de` sind in Cloud-Sessions per Netzwerkrichtlinie
gesperrt; die API-Referenz stammt deshalb aus dem öffentlichen SDK. LibreOffice läuft dort
nicht — Excel- und Word-Dateien lassen sich nicht rendern, nur strukturell prüfen; bei
`.xlsx` deshalb formelfrei arbeiten.
