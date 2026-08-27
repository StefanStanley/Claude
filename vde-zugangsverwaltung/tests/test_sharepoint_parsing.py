"""Tests der SharePoint-Feldauswertung (ohne Netzwerkzugriff)."""

from __future__ import annotations

import sys
import unittest
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from vde_zugang.konfiguration import SharePointKonfig  # noqa: E402
from vde_zugang.sharepoint import (  # noqa: E402
    parse_datum,
    parse_ja_nein,
    parse_regelwerke,
    zeilen_zu_fachobjekten,
)


def konfig() -> SharePointKonfig:
    return SharePointKonfig(tenant_id="t", client_id="c", listen_name="VDE-Zugaenge")


class TestParser(unittest.TestCase):
    def test_datum_formate(self):
        self.assertEqual(parse_datum("2026-08-27T00:00:00Z"), date(2026, 8, 27))
        self.assertEqual(parse_datum("27.08.2026"), date(2026, 8, 27))
        self.assertEqual(parse_datum("2026-08-27"), date(2026, 8, 27))
        self.assertEqual(parse_datum(date(2026, 8, 27)), date(2026, 8, 27))

    def test_datum_leer_und_muell(self):
        self.assertIsNone(parse_datum(""))
        self.assertIsNone(parse_datum(None))
        self.assertIsNone(parse_datum("keine Angabe"))

    def test_status(self):
        self.assertTrue(parse_ja_nein("aktiv"))
        self.assertTrue(parse_ja_nein("Ja"))
        self.assertTrue(parse_ja_nein(""))  # leer = aktiv (Standard)
        self.assertFalse(parse_ja_nein("ausgeschieden"))
        self.assertFalse(parse_ja_nein("inaktiv"))

    def test_regelwerke_mehrfachauswahl_und_text(self):
        self.assertEqual(parse_regelwerke(["VDE-0100", "VDE-0105"]), ["VDE-0100", "VDE-0105"])
        self.assertEqual(parse_regelwerke("VDE-0100; VDE-0105"), ["VDE-0100", "VDE-0105"])
        self.assertEqual(parse_regelwerke("VDE-0100, VDE-0105"), ["VDE-0100", "VDE-0105"])
        self.assertEqual(parse_regelwerke(""), [])


class TestZeilenUmwandlung(unittest.TestCase):
    def zeile(self, **felder):
        basis = {
            "Personalnummer": "4711",
            "Title": "Anna Beispiel",
            "EMail": "Anna.Beispiel@Firma.de",
            "Abteilung": "Netzplanung",
            "Status": "aktiv",
            "Regelwerke": ["VDE-AR-N-4100", "VDE-0100"],
        }
        basis.update(felder)
        return {"id": "1", "fields": basis}

    def test_eine_zeile_ergibt_mehrere_soll_zugaenge(self):
        mitarbeiter, soll, warnungen = zeilen_zu_fachobjekten([self.zeile()], konfig())
        self.assertEqual(len(mitarbeiter), 1)
        self.assertEqual(mitarbeiter[0].email, "anna.beispiel@firma.de")
        self.assertEqual({s.regelwerk for s in soll}, {"VDE-AR-N-4100", "VDE-0100"})
        self.assertEqual(warnungen, [])

    def test_austritt_und_status_werden_uebernommen(self):
        mitarbeiter, _, _ = zeilen_zu_fachobjekten(
            [self.zeile(Status="ausgeschieden", Austrittsdatum="2026-07-31T00:00:00Z")], konfig()
        )
        self.assertFalse(mitarbeiter[0].aktiv)
        self.assertEqual(mitarbeiter[0].austritt, date(2026, 7, 31))

    def test_personenspalte_liefert_email(self):
        mitarbeiter, _, _ = zeilen_zu_fachobjekten(
            [self.zeile(EMail={"Email": "b.mueller@firma.de", "DisplayName": "B. Mueller"})],
            konfig(),
        )
        self.assertEqual(mitarbeiter[0].email, "b.mueller@firma.de")

    def test_zeile_ohne_personalnummer_wird_gemeldet(self):
        mitarbeiter, soll, warnungen = zeilen_zu_fachobjekten(
            [self.zeile(Personalnummer="")], konfig()
        )
        self.assertEqual(mitarbeiter, [])
        self.assertEqual(soll, [])
        self.assertEqual(len(warnungen), 1)

    def test_zeile_ohne_regelwerke_wird_gemeldet(self):
        _, soll, warnungen = zeilen_zu_fachobjekten([self.zeile(Regelwerke="")], konfig())
        self.assertEqual(soll, [])
        self.assertTrue(any("keine Regelwerke" in w for w in warnungen))

    def test_abweichende_spaltennamen_per_konfiguration(self):
        eigene = SharePointKonfig(
            tenant_id="t",
            client_id="c",
            listen_name="L",
            felder={"personalnummer": "PersNr", "name": "Mitarbeiter", "regelwerke": "Normen"},
        )
        zeile = {"fields": {"PersNr": "99", "Mitarbeiter": "Carl Test", "Normen": "VDE-0100"}}
        mitarbeiter, soll, _ = zeilen_zu_fachobjekten([zeile], eigene)
        self.assertEqual(mitarbeiter[0].name, "Carl Test")
        self.assertEqual(soll[0].regelwerk, "VDE-0100")


if __name__ == "__main__":
    unittest.main(verbosity=2)
