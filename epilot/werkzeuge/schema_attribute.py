#!/usr/bin/env python3
"""Liest epilot-Attribute aus und schlägt Zuordnungen zu Exportspalten vor.

Beantwortet die Frage, die beim Mapping zuerst kommt: Welche Attribute gibt es überhaupt?
Statt Attributnamen zu raten, werden sie aus der Quelle gelesen. Zwei Quellen möglich:

**Blueprint-Manifest** (keine Anmeldung nötig) — der Weg, wenn das Schema in der eigenen
Instanz noch gar nicht steht. Das Manifest bringt die Definition mit:

    python3 werkzeuge/schema_attribute.py --manifest 14a-blueprint.json \
        --spalten ../schnittstellenkonzept/bestand/14a_spalten_ist.txt -o vorschlag.csv

**Konfiguriertes Schema** (Token nötig) — der Weg, wenn bereits installiert ist:

    export EPILOT_TOKEN="..."
    python3 werkzeuge/schema_attribute.py --schema opportunity

Die Vorschläge beruhen auf Namensähnlichkeit — sie sind ein Startpunkt für die Runde,
keine Entscheidung. Jede Zeile gehört geprüft.
"""
from __future__ import annotations

import argparse
import contextlib
import csv
import difflib
import json
import os
import re
import sys
import unicodedata
from collections import Counter
from collections.abc import Iterator
from pathlib import Path
from typing import Any, TextIO

import requests

BASIS = "https://entity.sls.epilot.io"


def hole_schema(slug: str, token: str, basis: str = BASIS, org: str | None = None) -> dict:
    """Ein konfiguriertes Entity-Schema aus der epilot-Instanz holen.

    Args:
        slug: Schema-Slug, etwa `opportunity`.
        token: Access Token für die Entity API.
        basis: Dienst-URL der Entity API.
        org: Organisationskennung, nur bei mandantenübergreifendem Zugriff nötig.

    Returns:
        Das Schema, wie die API es liefert.

    Raises:
        SystemExit: Die API hat nicht mit HTTP 200 geantwortet — der Aufruf ist ein
            Werkzeugaufruf, kein Bibliotheksaufruf, deshalb endet er hier sofort.
    """
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
    wie eine Attributdefinition aussehen: ein `name` plus ein bekannter `type`.

    Der Weg ohne Anmeldung — er trägt, solange das Schema in der eigenen Instanz noch
    gar nicht steht.

    Args:
        pfad: Manifest als JSON-Datei.

    Returns:
        Die gefundenen Attribute, nach Namen sortiert, je mit `name`, `label`, `typ`,
        `pflicht`, `gruppe` und `optionen`.
    """
    daten = json.loads(Path(pfad).read_text(encoding="utf-8"))
    gefunden: dict[str, dict] = {}

    def sieht_aus_wie_attribut(o: dict) -> bool:
        return (isinstance(o.get("name"), str) and o.get("name")
                and isinstance(o.get("type"), str)
                and o.get("type") in ATTRIBUTTYPEN)

    def geh(o: Any, pfad_kette: tuple[str, ...] = ()) -> None:
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
                geh(v, (*pfad_kette, k))
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
    """Die Attribute eines Schemas flach auflisten.

    Args:
        schema: Schema, wie `hole_schema` es liefert.

    Returns:
        Die Attribute, nach Namen sortiert, je mit `name`, `label`, `typ`, `pflicht`,
        `gruppe` und `optionen`.
    """
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


def familien(attr: list[dict], mindestens: int = 5) -> list[tuple[str, int]]:
    """Attribute nach ihrem Namenspräfix bündeln.

    Der wichtigste Schritt vor jedem Mapping an einem gewachsenen Schema. epilot hängt
    die Felder aller Formularstrecken an dasselbe Schema (bei der NGD: 880 Attribute an
    `opportunity`); die Strecken unterscheiden sich allein am Präfix — `vb_` für
    Verbrauchseinrichtungen nach § 14a, `ea_` für Erzeugungsanlagen, `ha_` für
    Hausanschlüsse.

    Ein Abgleich gegen das ganze Schema findet deshalb vor allem Zufallstreffer. Erst
    die Familie eingrenzen, dann zuordnen.

    Args:
        attr: Attributliste aus Schema oder Manifest.
        mindestens: Ab wie vielen Attributen ein Präfix als Familie zählt.

    Returns:
        Je Familie ihr Präfix und ihre Größe, nach Größe absteigend.
    """
    zaehler: Counter[str] = Counter()
    for a in attr:
        teile = a["name"].split("_")
        zaehler["_".join(teile[:2]) if len(teile) > 1 else teile[0]] += 1
    return [(k, n) for k, n in zaehler.most_common() if n >= mindestens]


def nach_praefix(attr: list[dict], praefixe: list[str]) -> list[dict]:
    """Auf die Attribute einer oder mehrerer Familien eingrenzen.

    Args:
        attr: Attributliste aus Schema oder Manifest.
        praefixe: Namensanfänge, etwa `["14a_", "vb_waermepumpe"]`.

    Returns:
        Die passenden Attribute; die Reihenfolge der Eingabe bleibt erhalten.
    """
    muster = tuple(praefixe)
    return [a for a in attr if a["name"].startswith(muster)]


def normalisiere(text: str) -> str:
    """Text für den Namensvergleich vereinheitlichen.

    Löst zusätzlich die Abkürzungen auf, die in den Exportspalten stehen (`WP`, `SP`,
    `ZN`, `IBN`) — ohne sie findet der Ähnlichkeitsvergleich die richtige Zuordnung nicht.

    Dasselbe gilt für Vokabelbrüche zwischen Formular und Schema: Was das Formular
    „Wallbox" nennt, heißt in epilot `ladeeinrichtung` beziehungsweise `ladepunkt`. Ohne
    die Auflösung findet der Abgleich dazu nichts — und niemand merkt, dass 25 Felder
    fehlen.

    Args:
        text: Spaltenname oder Attributname.

    Returns:
        Kleingeschriebener Text aus ASCII-Wörtern, durch Leerzeichen getrennt.
    """
    t = unicodedata.normalize("NFKD", text)
    t = t.replace("ß", "ss")
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"[^a-zA-Z0-9]+", " ", t).lower().strip()
    # gängige Abkürzungen aus den Exportspalten auflösen
    for kurz, lang in [("ab", "anlagenbetreiber"), ("ao", "anlagenort"), ("zn", "zaehlernummer"),
                       ("zs", "zaehlerstand"), ("wp", "waermepumpe"), ("sp", "speicher"),
                       ("ibn", "inbetriebnahme"), ("leist", "leistung"), ("nr", "nummer"),
                       ("bestaetigung", "bestaetigung"), ("anm", "anmerkung"),
                       ("wallbox", "ladeeinrichtung"), ("ladepunkt", "ladeeinrichtung")]:
        t = re.sub(rf"\b{kurz}\b", lang, t)
    return t


def ohne_praefix(name: str, praefixe: list[str]) -> str:
    """Das Streckenpräfix vom Attributnamen abschneiden.

    Args:
        name: Attributname, etwa `14a_anmeldung_zaehlernummer_z1`.
        praefixe: Die Präfixe, auf die eingegrenzt wurde.

    Returns:
        Der Name ohne das längste passende Präfix, sonst unverändert.
    """
    passend = [p for p in praefixe if name.startswith(p)]
    if not passend:
        return name
    return name[len(max(passend, key=len)):].lstrip("_") or name


def vorschlag(spalte: str, attr: list[dict], grenze: float = 0.55,
              praefixe: list[str] | None = None) -> list[tuple[str, float]]:
    """Zu einer Exportspalte die ähnlichsten Attribute vorschlagen.

    Der Abgleich ordnet immer dem Ähnlichsten zu — auch wenn das Richtige gar nicht in
    der Liste steht. Deshalb kommt die Güte mit zurück: **Alles unter etwa 0,75 gehört
    angeschaut.** Ein Vorschlag ist ein Startpunkt für die Mapping-Sitzung, keine
    Entscheidung.

    `praefixe` hebt die Trefferquote deutlich, wenn zuvor mit `nach_praefix` eingegrenzt
    wurde: Die epilot-Namen tragen ihr Streckenpräfix mit, die Exportspalten nicht.
    `ZN_Z1` gegen `14a_anmeldung_zaehlernummer_z1` kommt auf 0,70 und fällt damit unter
    die Schwelle — ohne das Präfix auf 1,0.

    Args:
        spalte: Spaltenname aus dem Ist-Export.
        attr: Attributliste aus Schema oder Manifest.
        grenze: Mindestähnlichkeit zwischen 0 und 1.
        praefixe: Streckenpräfixe, die beim Vergleich unberücksichtigt bleiben.

    Returns:
        Bis zu drei Paare aus vollem Attributnamen und Güte, nach Güte absteigend.
    """
    ziel = normalisiere(spalte)
    if not ziel:
        return []
    treffer = []
    for a in attr:
        kurz = ohne_praefix(a["name"], praefixe) if praefixe else a["name"]
        for kandidat in (kurz, a["label"]):
            if not kandidat:
                continue
            wert = difflib.SequenceMatcher(None, ziel, normalisiere(kandidat)).ratio()
            if wert >= grenze:
                treffer.append((a["name"], round(wert, 2)))
                break
    return sorted(treffer, key=lambda x: -x[1])[:3]


@contextlib.contextmanager
def _ausgabe(pfad: str | None) -> Iterator[TextIO]:
    """Zieldatei oder die Standardausgabe öffnen — die Datei mit BOM, damit Excel sie liest."""
    if pfad:
        with open(pfad, "w", newline="", encoding="utf-8-sig") as f:
            yield f
    else:
        yield sys.stdout


def main(argv: list[str] | None = None) -> int:
    """Einstiegspunkt für den Aufruf über die Kommandozeile.

    Args:
        argv: Argumente; `None` nimmt die der Kommandozeile.

    Returns:
        0 bei Erfolg, 1 wenn im Manifest keine Attribute erkannt wurden, 2 wenn der
        Token fehlt.
    """
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    quelle = p.add_mutually_exclusive_group(required=True)
    quelle.add_argument("--schema", help="Schema-Slug, z. B. opportunity (braucht EPILOT_TOKEN)")
    quelle.add_argument("--manifest",
                        help="Blueprint-Manifest als JSON-Datei (keine Anmeldung nötig)")
    p.add_argument("--spalten", help="Datei mit Spaltennamen (eine Zeile, tab-getrennt)")
    p.add_argument("-o", "--ausgabe", help="CSV-Datei für das Ergebnis")
    p.add_argument("--basis-url", default=BASIS)
    p.add_argument("--org")
    p.add_argument("--grenze", type=float, default=0.55,
                   help="Mindestähnlichkeit für einen Vorschlag (0-1, Standard 0.55)")
    p.add_argument("--familien", action="store_true",
                   help="nur die Präfix-Familien des Schemas ausgeben — der Schritt vor "
                        "jedem Mapping an einem gewachsenen Schema")
    p.add_argument("--praefix", action="append", metavar="PRAEFIX",
                   help="Abgleich auf diese Familie eingrenzen, mehrfach angebbar "
                        "(z. B. --praefix 14a_ --praefix vb_waermepumpe)")
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

    if a.familien:
        print(f"\n{'Attribute':>9}  Familie")
        for praefix, n in familien(attr):
            print(f"{n:9}  {praefix}_*")
        print("\nMit --praefix auf eine Familie eingrenzen, bevor abgeglichen wird.",
              file=sys.stderr)
        return 0

    if a.praefix:
        vorher = len(attr)
        attr = nach_praefix(attr, a.praefix)
        print(f"auf {len(attr)} von {vorher} Attributen eingegrenzt "
              f"({', '.join(a.praefix)})", file=sys.stderr)
        if not attr:
            print("Kein Attribut mit diesem Präfix — Schreibweise mit --familien prüfen.",
                  file=sys.stderr)
            return 1

    if not a.spalten:
        with _ausgabe(a.ausgabe) as ziel:
            schreiber = csv.DictWriter(
                ziel,
                fieldnames=["name", "label", "typ", "pflicht", "gruppe", "optionen"],
                delimiter=";")
            schreiber.writeheader()
            schreiber.writerows(attr)
        if a.ausgabe:
            print(f"geschrieben: {a.ausgabe}", file=sys.stderr)
        return 0

    roh = Path(a.spalten).read_text(encoding="utf-8").rstrip("\n")
    spalten = roh.split("\t") if "\t" in roh else roh.splitlines()

    zeilen, ohne = [], 0
    for i, sp in enumerate(spalten, 1):
        treffer = vorschlag(sp, attr, a.grenze, a.praefix)
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

    with _ausgabe(a.ausgabe) as ziel:
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
