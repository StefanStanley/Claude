"""Lokale Vorschau ohne Databricks und ohne SharePoint.

Erzeugt Beispieldaten, laesst den Abgleich laufen und gibt den Bericht aus:

    python3 scripts/demo_lokal.py
    python3 scripts/demo_lokal.py --html > vorschau.html
"""

from __future__ import annotations

import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from vde_zugang.abgleich import ermittle_massnahmen
from vde_zugang.bericht import als_csv, als_html, als_markdown, betreff
from vde_zugang.modelle import IstZugang, Mitarbeiter, SollZugang

HEUTE = date.today()


def beispieldaten():
    mitarbeiter = [
        Mitarbeiter("10023", "Anna Beispiel", "anna.beispiel@firma.de", "Netzplanung"),
        Mitarbeiter("10024", "Bernd Muster", "bernd.muster@firma.de", "Netzbau",
                    austritt=HEUTE - timedelta(days=3)),
        Mitarbeiter("10025", "Clara Neu", "clara.neu@firma.de", "Betriebsführung"),
        Mitarbeiter("10026", "Dirk Wechsel", "dirk.wechsel@firma.de", "Messstellenbetrieb"),
        Mitarbeiter("10027", "Eva Austritt", "eva.austritt@firma.de", "Netzplanung",
                    austritt=HEUTE + timedelta(days=12)),
    ]
    soll = [
        SollZugang("10023", "VDE-AR-N-4100", gueltig_bis=HEUTE + timedelta(days=200)),
        SollZugang("10023", "VDE-AR-N-4110", gueltig_bis=HEUTE + timedelta(days=9)),
        SollZugang("10024", "VDE-0100"),
        SollZugang("10025", "VDE-0100", begruendung="Neu in der Betriebsführung, Onboarding"),
        SollZugang("10025", "VDE-AR-N-4105"),
        SollZugang("10026", "VDE-AR-N-4105"),
        SollZugang("10027", "VDE-AR-N-4100"),
    ]
    ist = [
        IstZugang("10023", "VDE-AR-N-4100", angelegt_am=HEUTE - timedelta(days=400)),
        IstZugang("10023", "VDE-AR-N-4110", angelegt_am=HEUTE - timedelta(days=356)),
        IstZugang("10024", "VDE-0100", angelegt_am=HEUTE - timedelta(days=800)),
        IstZugang("10026", "VDE-0105", angelegt_am=HEUTE - timedelta(days=120)),
        IstZugang("10027", "VDE-AR-N-4100", angelegt_am=HEUTE - timedelta(days=90)),
        IstZugang("99999", "VDE-0100", email="alt.kollege@firma.de", vde_benutzer="akollege"),
    ]
    return mitarbeiter, soll, ist


def main() -> None:
    mitarbeiter, soll, ist = beispieldaten()
    ergebnis = ermittle_massnahmen(mitarbeiter, soll, ist, HEUTE, vorlauf_tage=30)

    if "--html" in sys.argv:
        print(als_html(ergebnis, dry_run=True))
    elif "--csv" in sys.argv:
        print(als_csv(ergebnis.massnahmen))
    else:
        print(betreff(ergebnis))
        print()
        print(als_markdown(ergebnis))


if __name__ == "__main__":
    main()
