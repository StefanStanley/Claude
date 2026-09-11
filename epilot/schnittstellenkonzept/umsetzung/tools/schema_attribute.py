#!/usr/bin/env python3
"""Liest epilot-Attribute aus und schlägt Zuordnungen zu Exportspalten vor.

Beantwortet die Frage, die beim Mapping zuerst kommt: Welche Attribute gibt es überhaupt?
Statt Attributnamen zu raten, werden sie aus der Quelle gelesen. Zwei Quellen möglich:

**Blueprint-Manifest** (keine Anmeldung nötig) — der Weg, wenn das Schema in der eigenen
Instanz noch gar nicht steht. Das Manifest bringt die Definition mit:

    python3 tools/schema_attribute.py --manifest 14a-blueprint.json \
        --spalten ../bestand/14a_spalten_ist.txt -o vorschlag.csv

**Konfiguriertes Schema** (Token nötig) — der Weg, wenn bereits installiert ist:

    export EPILOT_TOKEN="..."
    python3 tools/schema_attribute.py --schema opportunity

Die Vorschläge beruhen auf Namensähnlichkeit — sie sind ein Startpunkt für die Runde,
keine Entscheidung. Jede Zeile gehört geprüft.
"""
from __future__ import annotations

import argparse
import csv
import difflib
import os
import re
import sys
import unicodedata

import requests

BASIS = "https://entity.sls.epilot.io"


def hole_schema(slug: str, token: str, basis: str = BASIS, org: str | None = None) -> dict:
    kopf = {"Authorization": f"Bearer {token}"}
    if org:
        kopf["x-epilot-org-id"] = org
    antwort = requests.get(f"{basis}/v1/entity/schemas/{slug}", headers=kopf, timeout=60)
    if antwort.status_code != 200:
        raise SystemExit(f"Schema '{slug}' nicht gelesen: HTTP {antwort.status_code} "
                         f"{antwort.text[:300]}")
    return antwort.json()


def aus_manifest(pfad: str) -> list[dict]:
    """Attribute aus einem Blueprint-Manifest ziehen.

    Manifeste bündeln Ressourcen unterschiedlicher Art (Schemas, Journeys, Workflows).
    Gesucht sind die Schema-Ressourcen und darin die Attributdefinitionen. Weil der
    Aufbau je nach Manifest-Version abweicht, wird rekursiv nach Objekten gesucht, die
    wie eine Attributdefinition aussehen: ein `name` plus ein `type`.
    """
    import json as _json
    daten = _json.loads(open(pfad, encoding="utf-8").read())
    gefunden: dict[str, dict] = {}

    def sieht_aus_wie_attribut(o: dict) -> bool:
        return (isinstance(o.get("name"), str) and o.get("name")
                and isinstance(o.get("type"), str)
                and o.get("type") in ATTRIBUTTYPEN)

    def geh(o, pfad_kette=()):
        if isinstance(o, dict):
            if sieht_aus_wie_attribut(o):
                name = o["name"]
                # erstes Vorkommen gewinnt, spätere ergänzen nur fehlende Angaben
                eintrag = gefunden.setdefault(name, {
                    "name": name, "label": "", "typ": o.get("type", ""),
                    "pflicht": "", "gruppe": "", "optionen": "",
                })
                if not eintrag["label"]:
                    eintrag["label"] = o.get("label") or ""
                if o.get("required"):
                    eintrag["pflicht"] = "ja"
                if not eintrag["gruppe"]:
                    eintrag["gruppe"] = o.get("group") or (pfad_kette[-1] if pfad_kette else "")
                if not eintrag["optionen"] and o.get("options"):
                    eintrag["optionen"] = ", ".join(
                        (x.get("value") if isinstance(x, dict) else str(x))
                        for x in o["options"])[:200]
            for k, v in o.items():
                geh(v, pfad_kette + (k,))
        elif isinstance(o, list):
            for x in o:
                geh(x, pfad_kette)

    geh(daten)
    return sorted(gefunden.values(), key=lambda x: x["name"])


# Attributtypen der Entity API - dient als Filter beim Durchsuchen eines Manifests
ATTRIBUTTYPEN = {
    "string", "text", "link", "date", "datetime", "country", "boolean", "select", "radio",
    "multiselect", "checkbox", "status", "sequence", "relation", "relation_user", "address",
    "relation_address", "relation_payment_method", "currency", "tags", "number", "table",
    "consent", "internal", "ordered_list", "image", "file", "computed", "phone", "email",
    "payment", "price_component", "purpose", "message_email_address",
}


def attribute(schema: dict) -> list[dict]:
    """Attribute flach auflisten - Name, Label, Typ, Pflicht."""
    ergebnis = []
    for a in schema.get("attributes", []) or []:
        if not isinstance(a, dict):
            continue
        ergebnis.append({
            "name": a.get("name", ""),
            "label": a.get("label", ""),
            "typ": a.get("type", ""),
            "pflicht": "ja" if a.get("required") else "",
            "gruppe": a.get("group", ""),
            "optionen": ", ".join(
                (o.get("value") if isinstance(o, dict) else str(o))
                for o in (a.get("options") or [])
            )[:200],
        })
    return sorted(ergebnis, key=lambda x: x["name"])


def normalisiere(text: str) -> str:
    """Für den Vergleich: Umlaute auflösen, Trennzeichen vereinheitlichen, kleinschreiben."""
    t = unicodedata.normalize("NFKD", text)
    t = t.replace("ß", "ss")
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"[^a-zA-Z0-9]+", " ", t).lower().strip()
    # gängige Abkürzungen aus den Exportspalten auflösen
    for kurz, lang in [("ab", "anlagenbetreiber"), ("ao", "anlagenort"), ("zn", "zaehlernummer"),
                       ("zs", "zaehlerstand"), ("wp", "waermepumpe"), ("sp", "speicher"),
                       ("ibn", "inbetriebnahme"), ("leist", "leistung"), ("nr", "nummer"),
                       ("bestaetigung", "bestaetigung"), ("anm", "anmerkung")]:
        t = re.sub(rf"\b{kurz}\b", lang, t)
    return t


def vorschlag(spalte: str, attr: list[dict], grenze: float = 0.55) -> list[tuple[str, float]]:
    ziel = normalisiere(spalte)
    if not ziel:
        return []
    treffer = []
    for a in attr:
        for kandidat in (a["name"], a["label"]):
            if not kandidat:
                continue
            wert = difflib.SequenceMatcher(None, ziel, normalisiere(kandidat)).ratio()
            if wert >= grenze:
                treffer.append((a["name"], round(wert, 2)))
                break
    return sorted(treffer, key=lambda x: -x[1])[:3]


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    quelle = p.add_mutually_exclusive_group(required=True)
    quelle.add_argument("--schema", help="Schema-Slug, z. B. opportunity (braucht EPILOT_TOKEN)")
    quelle.add_argument("--manifest", help="Blueprint-Manifest als JSON-Datei (keine Anmeldung nötig)")
    p.add_argument("--spalten", help="Datei mit Spaltennamen (eine Zeile, tab-getrennt)")
    p.add_argument("-o", "--ausgabe", help="CSV-Datei für das Ergebnis")
    p.add_argument("--basis-url", default=BASIS)
    p.add_argument("--org")
    p.add_argument("--grenze", type=float, default=0.55,
                   help="Mindestähnlichkeit für einen Vorschlag (0-1, Standard 0.55)")
    a = p.parse_args(argv)

    if a.manifest:
        attr = aus_manifest(a.manifest)
        print(f"Manifest '{a.manifest}': {len(attr)} Attribute gefunden", file=sys.stderr)
        if not attr:
            print("Keine Attributdefinitionen erkannt. Aufbau des Manifests prüfen — "
                  "gesucht werden Objekte mit 'name' und einem bekannten 'type'.",
                  file=sys.stderr)
            return 1
    else:
        token = os.environ.get("EPILOT_TOKEN", "")
        if not token:
            print("EPILOT_TOKEN ist nicht gesetzt.", file=sys.stderr)
            return 2
        attr = attribute(hole_schema(a.schema, token, a.basis_url, a.org))
        print(f"Schema '{a.schema}': {len(attr)} Attribute", file=sys.stderr)

    if not a.spalten:
        schreiber = csv.DictWriter(
            open(a.ausgabe, "w", newline="", encoding="utf-8-sig") if a.ausgabe else sys.stdout,
            fieldnames=["name", "label", "typ", "pflicht", "gruppe", "optionen"], delimiter=";")
        schreiber.writeheader()
        schreiber.writerows(attr)
        if a.ausgabe:
            print(f"geschrieben: {a.ausgabe}", file=sys.stderr)
        return 0

    roh = open(a.spalten, encoding="utf-8").read().rstrip("\n")
    spalten = roh.split("\t") if "\t" in roh else roh.splitlines()

    zeilen, ohne = [], 0
    for i, sp in enumerate(spalten, 1):
        treffer = vorschlag(sp, attr, a.grenze)
        if not treffer:
            ohne += 1
        zeilen.append({
            "position": i,
            "spalte": sp,
            "vorschlag_1": treffer[0][0] if len(treffer) > 0 else "",
            "guete_1": treffer[0][1] if len(treffer) > 0 else "",
            "vorschlag_2": treffer[1][0] if len(treffer) > 1 else "",
            "vorschlag_3": treffer[2][0] if len(treffer) > 2 else "",
        })

    ziel = open(a.ausgabe, "w", newline="", encoding="utf-8-sig") if a.ausgabe else sys.stdout
    schreiber = csv.DictWriter(ziel, fieldnames=list(zeilen[0].keys()), delimiter=";")
    schreiber.writeheader()
    schreiber.writerows(zeilen)

    print(f"{len(spalten)} Spalten, davon {len(spalten)-ohne} mit Vorschlag, {ohne} ohne.",
          file=sys.stderr)
    print("Die Vorschläge beruhen auf Namensähnlichkeit und sind ungeprüft.", file=sys.stderr)
    if a.ausgabe:
        print(f"geschrieben: {a.ausgabe}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
