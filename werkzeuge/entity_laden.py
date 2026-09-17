#!/usr/bin/env python3
"""Vorgänge aus der epilot Entity API holen — vollständig und wiederholbar.

Der erste Baustein der Datenstrecke: Rohdaten beschaffen, bevor irgendetwas abgebildet
oder gefiltert wird. Was hier herauskommt, ist unverändert das, was die API liefert.

    # Als Werkzeug: erst klein, zum Hinsehen
    export EPILOT_TOKEN="..."
    python3 werkzeuge/entity_laden.py --schema opportunity --max-seiten 3 -o probe.json

    # Alles holen
    python3 werkzeuge/entity_laden.py --schema opportunity -o vorgaenge.json

    # In einem Databricks-Notebook
    import entity_laden as el
    vorgaenge = el.alle("_schema:opportunity", token=dbutils.secrets.get("epilot", "access_token"))

**Warum die Rohdaten zuerst kommen:** Ein Mapping ändert sich, solange die Abstimmung
läuft — die Rohdaten nicht. Wer erst abbildet und dann anbindet, baut die Strecke bei
jeder Mapping-Änderung um. Andersherum liegen die Daten, und das Mapping wird zu einer
Abfrage darauf.

Die Paging-Logik überschneidet sich mit `sap_export/epilot.py`. Das ist bewusst noch
nicht zusammengeführt: Dort hängt sie an der Exportkonfiguration und schreibt Status
zurück, hier soll sie ohne jede Konfiguration laufen. Zusammenlegen, sobald die
Bronze-Strecke steht — vorher wäre es eine Abstraktion auf Verdacht.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from collections import Counter
from collections.abc import Iterator
from pathlib import Path

import requests

BASIS = "https://entity.sls.epilot.io"

#: Obergrenze der API für `size`; größere Werte quittiert sie mit HTTP 400.
MAX_SEITENGROESSE = 1000


class LadeFehler(Exception):
    """Die API hat nicht mit HTTP 200 geantwortet — der Lauf bricht ab.

    Bewusst ein Abbruch und kein Weitermachen mit dem, was schon da ist: Eine
    unvollständige Ergebnismenge sieht aus wie eine vollständige und wird später zu
    einem Bestandsabgleich, der nicht aufgeht.
    """


def _sitzung(token: str, org: str | None = None) -> requests.Session:
    """Sitzung mit Anmeldung und Organisationskopf vorbereiten.

    Args:
        token: Access Token vom Typ `api`. Gehört in einen Databricks Secret Scope
            oder Azure Key Vault — nie in das Notebook und nie in das Repository.
        org: Organisationskennung, nur bei mandantenübergreifendem Zugriff nötig.

    Returns:
        Die vorbereitete Sitzung.

    Raises:
        LadeFehler: Kein Token übergeben.
    """
    if not token:
        raise LadeFehler("Kein Access Token übergeben")
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    if org:
        # Uneinheitlich über die epilot-Dienste: meist x-epilot-org-id, teils x-ivy-org-id.
        s.headers["x-epilot-org-id"] = org
    return s


def seiten(
    query: str,
    token: str,
    basis: str = BASIS,
    groesse: int = 500,
    hydrate: bool = True,
    org: str | None = None,
    max_seiten: int | None = None,
    timeout: int = 60,
    sitzung: requests.Session | None = None,
) -> Iterator[list[dict]]:
    """Die Treffer einer Suche seitenweise liefern.

    Das Paging läuft über `search_after`, nicht über `from`/`size`. Zwei Gründe: `from`
    bricht bei tiefen Ergebnismengen ab, und bei gleichzeitigen Änderungen liefert es
    inkonsistente Seiten — ein Vorgang kann doppelt kommen oder ganz fehlen. Sortiert
    wird stabil über `_created_at`, damit die Reihenfolge zwischen den Seiten eindeutig
    ist.

    Fehlt der Sortiercursor in einer Antwort, endet der Lauf mit einer Warnung statt in
    einer Endlosschleife über dieselbe Seite.

    Args:
        query: Suchausdruck, etwa `_schema:opportunity`.
        token: Access Token für die Entity API.
        basis: Dienst-URL der Entity API.
        groesse: Treffer je Seite, höchstens `MAX_SEITENGROESSE`.
        hydrate: Verknüpfte Entitäten mitliefern. Ohne das tragen Relationen nur eine
            `entity_id` und keine Werte.
        org: Organisationskennung bei mandantenübergreifendem Zugriff.
        max_seiten: Bremse für den ersten Blick; `None` holt alles.
        timeout: Sekunden je HTTP-Aufruf.
        sitzung: Eigene requests-Sitzung; im Test der Ort für ein Double.

    Yields:
        Je eine Seite Treffer in der Reihenfolge ihrer Anlage.

    Raises:
        LadeFehler: Kein Token, unzulässige Seitengröße, oder die Suche hat nicht mit
            HTTP 200 geantwortet.
    """
    # Vor dem ersten Aufruf prüfen: Eine zu große Seite quittiert die API mit HTTP 400,
    # und zwar erst nach dem Verbindungsaufbau.
    if not 1 <= groesse <= MAX_SEITENGROESSE:
        raise LadeFehler(f"groesse muss zwischen 1 und {MAX_SEITENGROESSE} liegen")

    http = sitzung or _sitzung(token, org)

    # Der Cursor auf die zuletzt gelesene Position. Beim ersten Aufruf gibt es ihn
    # noch nicht — dann liefert die API den Anfang der Ergebnismenge.
    such_nach = None
    gezaehlt = 0

    while max_seiten is None or gezaehlt < max_seiten:
        rumpf: dict = {
            "q": query,                    # Suchausdruck, z. B. _schema:opportunity
            "size": groesse,               # Treffer je Seite, nicht insgesamt
            "hydrate": hydrate,            # verknüpfte Entitäten mit Werten statt nur IDs
            "sort": "_created_at:asc",     # stabile Ordnung, sonst ist Paging sinnlos
        }
        if such_nach:
            # Ab der zweiten Seite: dort weiterlesen, wo die vorige endete.
            rumpf["search_after"] = such_nach

        antwort = http.post(f"{basis}/v1/entity:search", json=rumpf, timeout=timeout)

        # Abbrechen statt weitermachen: Eine halbe Ergebnismenge sieht aus wie eine
        # ganze und fällt erst beim Bestandsabgleich auf — dann aber teuer.
        if antwort.status_code != 200:
            raise LadeFehler(
                f"Suche fehlgeschlagen: HTTP {antwort.status_code} {antwort.text[:300]}"
            )

        daten = antwort.json()
        # Das Antwortfeld heißt je nach Dienstversion results oder hits.
        treffer = daten.get("results") or daten.get("hits") or []
        if not treffer:
            return

        yield treffer
        gezaehlt += 1

        # Weniger Treffer als angefragt heißt: Das war die letzte Seite. Ohne diese
        # Abkürzung kostet jeder Lauf einen zusätzlichen Aufruf ins Leere.
        if len(treffer) < groesse:
            return

        # Der Cursor steckt im letzten Treffer der Seite und heißt je nach
        # Dienstversion _sort oder sort.
        such_nach = treffer[-1].get("_sort") or treffer[-1].get("sort")
        if not such_nach:
            # Ohne Cursor würde der nächste Aufruf dieselbe Seite liefern — endlos.
            # Lieber sauber enden und sagen, dass etwas fehlen könnte.
            print("Antwort enthält keinen search_after-Cursor — Lauf endet hier. "
                  "Die Ergebnismenge ist womöglich unvollständig.", file=sys.stderr)
            return


def alle(query: str, token: str, **kwargs: object) -> list[dict]:
    """Alle Treffer einer Suche in eine Liste holen.

    Bequem, aber alles landet im Speicher. Bei großen Mengen besser `seiten` nehmen und
    jede Seite einzeln wegschreiben.

    Args:
        query: Suchausdruck, etwa `_schema:opportunity`.
        token: Access Token für die Entity API.
        **kwargs: Wird unverändert an `seiten` durchgereicht.

    Returns:
        Alle Vorgänge in der Reihenfolge ihrer Anlage.

    Raises:
        LadeFehler: Siehe `seiten`.
    """
    gesammelt: list[dict] = []
    for seite in seiten(query, token, **kwargs):
        gesammelt.extend(seite)
        # Fortschritt nach stderr, nicht nach stdout: So bleibt stdout frei für das
        # eigentliche Ergebnis, wenn das Werkzeug in eine Datei umgeleitet wird.
        print(f"{len(gesammelt)} Vorgänge geladen", file=sys.stderr)
    return gesammelt


def belegung(vorgaenge: list[dict], mindestens: int = 1) -> list[tuple[str, int]]:
    """Zählen, welche Felder in den Vorgängen tatsächlich gefüllt sind.

    Ein Schema mit 880 Attributen heißt nicht, dass ein Vorgang 880 Werte trägt. Diese
    Auswertung sagt, welche Felder überhaupt vorkommen — die Grundlage dafür, ob die
    Rohdaten flach oder als JSON-Spalte abgelegt werden.

    Args:
        vorgaenge: Die geladenen Vorgänge.
        mindestens: Nur Felder ab dieser Häufigkeit ausgeben.

    Returns:
        Je Feldname die Anzahl der Vorgänge, in denen es einen Wert hat, absteigend.
    """
    zaehler: Counter[str] = Counter()
    for v in vorgaenge:
        for k, wert in v.items():
            # Leere Zeichenkette, leere Liste und None zählen nicht als Wert: Ein Feld,
            # das die API zwar mitliefert aber nie füllt, ist für das Mapping so
            # uninteressant wie ein Feld, das gar nicht existiert.
            if wert not in (None, "", [], {}):
                zaehler[k] += 1
    return [(k, n) for k, n in zaehler.most_common() if n >= mindestens]


def main(argv: list[str] | None = None) -> int:
    """Einstiegspunkt für den Aufruf über die Kommandozeile.

    Args:
        argv: Argumente; `None` nimmt die der Kommandozeile.

    Returns:
        0 bei Erfolg, 1 wenn nichts gefunden wurde, 2 wenn der Token fehlt.
    """
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--schema", default="opportunity",
                   help="Schema-Slug; wird zu '_schema:<slug>' (Standard: opportunity)")
    p.add_argument("--query", help="vollständiger Suchausdruck, verdrängt --schema")
    p.add_argument("--groesse", type=int, default=500, help="Treffer je Seite (1-1000)")
    p.add_argument("--max-seiten", type=int,
                   help="Bremse für den ersten Blick; ohne Angabe wird alles geholt")
    p.add_argument("--ohne-hydrate", action="store_true",
                   help="verknüpfte Entitäten NICHT mitliefern — Relationen tragen dann "
                        "nur eine entity_id")
    p.add_argument("--basis-url", default=BASIS)
    p.add_argument("--org")
    p.add_argument("-o", "--ausgabe", help="JSON-Datei für die Rohdaten")
    p.add_argument("--belegung", action="store_true",
                   help="zusätzlich auswerten, welche Felder überhaupt gefüllt sind")
    a = p.parse_args(argv)

    token = os.environ.get("EPILOT_TOKEN", "")
    if not token:
        print("EPILOT_TOKEN ist nicht gesetzt.", file=sys.stderr)
        return 2

    vorgaenge = alle(
        a.query or f"_schema:{a.schema}",
        token,
        basis=a.basis_url,
        groesse=a.groesse,
        hydrate=not a.ohne_hydrate,
        org=a.org,
        max_seiten=a.max_seiten,
    )
    if not vorgaenge:
        print("Kein Vorgang gefunden — Suchausdruck prüfen.", file=sys.stderr)
        return 1

    if a.ausgabe:
        Path(a.ausgabe).write_text(
            json.dumps(vorgaenge, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"geschrieben: {a.ausgabe}", file=sys.stderr)
    else:
        print(json.dumps(vorgaenge[0], ensure_ascii=False, indent=2)[:2000])

    if a.belegung:
        print(f"\n{'Vorgänge':>9}  Feld", file=sys.stderr)
        for feld, n in belegung(vorgaenge):
            print(f"{n:9}  {feld}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
