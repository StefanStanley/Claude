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

Alles Inhaltliche liegt im Repository unter diesem Repository. **Zuerst `CLAUDE.md` lesen** —
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

Alle Werkzeuge liegen in `werkzeuge/`. Reihenfolge wie oben:

```bash
# 1 · Ist-Spalten analysieren — findet Duplikate, Randleerzeichen, Sonderzeichen, Blöcke
python3 werkzeuge/spaltenanalyse.py spalten.txt -o analyse.md --titel "Strecke X"

#     Zwei Strecken vergleichen (ein Format oder zwei?)
python3 werkzeuge/spaltenanalyse.py a.txt --vergleich b.txt -o vergleich.md

# 2 · Attribute des Zielmodells holen — Blueprint braucht keinen Token
python3 werkzeuge/schema_attribute.py --manifest blueprint.json \
    --spalten spalten.txt -o vorschlag.csv
#     Alternative gegen die laufende Instanz (genauer, weil mit euren Anpassungen):
EPILOT_TOKEN=… python3 werkzeuge/schema_attribute.py --schema opportunity

# 3 · Arbeitsmappe für die Sitzung bauen
python3 werkzeuge/mappe_bauen.py spalten.txt -o Mapping_X.xlsx \
    --titel "Strecke X" --vorschlaege vorschlag.csv

# 4 · Nach der Sitzung: Konfiguration aus der ausgefüllten Mappe erzeugen
python3 werkzeuge/config_aus_erhebung.py Mapping_X.xlsx -o config.yaml

# 5 · Export im Trockenlauf prüfen
cd schnittstellenkonzept/umsetzung
python3 -m sap_export.job --config config.yaml --probelauf
```

Die API-Referenz erzeugt sich selbst neu, wenn epilot Schnittstellen ändert:

```bash
git clone --depth 1 https://github.com/epilot-dev/sdk-js /tmp/sdk-js
python3 werkzeuge/api_referenz_erzeugen.py /tmp/sdk-js
```

## Die Regeln, die in der Umsetzung stecken

Der Export-Lauf in `schnittstellenkonzept/umsetzung/` ist
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

## Haltung

- **Ehrlich über Annahmen.** Zweimal wurde eine falsche Annahme erst spät korrigiert (die
  Erzeugung läuft automatisiert, nicht von Hand; der Einspeiser-Export enthält keine
  Personendaten). Lieber eine Lücke benennen als sie füllen.
- **Erst gleichwertig ablösen, verbessern danach.** Eine Ablösung, die gleichzeitig alles
  besser macht, wird nicht fertig.
- **Der Abnahmevergleich ist byteweise** gegen produktive Originaldateien — nicht nur die
  Werte, auch Kodierung, Trennzeichen, Maskierung und Zeilenenden.

## Umgebung

`docs.epilot.io` und `www.netz-duesseldorf.de` sind in Cloud-Sessions per Netzwerkrichtlinie
gesperrt; die API-Referenz stammt deshalb aus dem öffentlichen SDK. LibreOffice läuft dort
nicht — Excel- und Word-Dateien lassen sich nicht rendern, nur strukturell prüfen; bei
`.xlsx` deshalb formelfrei arbeiten.
