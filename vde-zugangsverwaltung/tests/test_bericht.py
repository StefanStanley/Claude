"""Tests der Berichtsaufbereitung."""

from __future__ import annotations

import sys
import unittest
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from vde_zugang.abgleich import ermittle_massnahmen  # noqa: E402
from vde_zugang.bericht import (  # noqa: E402
    als_csv,
    als_html,
    als_markdown,
    betreff,
    zusammenfassung,
)
from vde_zugang.modelle import IstZugang, Mitarbeiter, SollZugang  # noqa: E402

HEUTE = date(2026, 8, 27)


def beispiel_ergebnis():
    mitarbeiter = [
        Mitarbeiter("4711", "Anna Beispiel", "anna@firma.de", "Netzplanung"),
        Mitarbeiter("4712", "Bernd Muster", "bernd@firma.de", "Netzbau",
                    austritt=HEUTE - timedelta(days=2)),
    ]
    soll = [SollZugang("4711", "VDE-AR-N-4100")]
    ist = [IstZugang("4712", "VDE-0100")]
    return ermittle_massnahmen(mitarbeiter, soll, ist, HEUTE)


class TestBericht(unittest.TestCase):
    def setUp(self):
        self.ergebnis = beispiel_ergebnis()

    def test_zusammenfassung_zaehlt_richtig(self):
        z = zusammenfassung(self.ergebnis)
        self.assertEqual(z["ANLEGEN"], 1)
        self.assertEqual(z["ENTZIEHEN"], 1)

    def test_betreff_nennt_aufgaben(self):
        self.assertIn("27.08.2026", betreff(self.ergebnis))
        self.assertIn("entziehen", betreff(self.ergebnis))

    def test_betreff_ohne_aufgaben(self):
        leer = ermittle_massnahmen([], [], [], HEUTE)
        self.assertIn("alles im Soll", betreff(leer))

    def test_markdown_enthaelt_namen_und_regelwerk(self):
        md = als_markdown(self.ergebnis)
        self.assertIn("Anna Beispiel", md)
        self.assertIn("VDE-AR-N-4100", md)
        self.assertIn("Zugang entziehen", md)

    def test_html_maskiert_sonderzeichen(self):
        mitarbeiter = [Mitarbeiter("1", "Mueller & Sohn <GmbH>", "m@firma.de")]
        ergebnis = ermittle_massnahmen(mitarbeiter, [SollZugang("1", "VDE-0100")], [], HEUTE)
        html = als_html(ergebnis)
        self.assertIn("Mueller &amp; Sohn &lt;GmbH&gt;", html)
        self.assertNotIn("<GmbH>", html)

    def test_html_kennzeichnet_testlauf(self):
        self.assertIn("TESTLAUF", als_html(self.ergebnis, dry_run=True))
        self.assertNotIn("TESTLAUF", als_html(self.ergebnis, dry_run=False))

    def test_csv_hat_kopfzeile_und_alle_zeilen(self):
        zeilen = als_csv(self.ergebnis.massnahmen).strip().split("\n")
        self.assertEqual(len(zeilen), len(self.ergebnis.massnahmen) + 1)
        self.assertTrue(zeilen[0].startswith("status;aktion;prioritaet"))


class TestBerichtMitAusfuehrung(unittest.TestCase):
    """Der Bericht muss zeigen, was passiert ist - nicht nur, was anstand."""

    def setUp(self):
        from vde_zugang.portal.ausfuehrung import fuehre_aus

        self.ergebnis = beispiel_ergebnis()
        self.fuehre_aus = fuehre_aus

    def test_testlauf_meldet_alles_als_uebersprungen(self):
        bericht = self.fuehre_aus(None, self.ergebnis.massnahmen, bestandsgroesse=50, dry_run=True)
        md = als_markdown(self.ergebnis, bericht)
        self.assertIn("UEBERSPRUNGEN", md)
        self.assertNotIn("ERFOLG", md)

    def test_betreff_nennt_das_ergebnis(self):
        bericht = self.fuehre_aus(None, self.ergebnis.massnahmen, bestandsgroesse=50, dry_run=True)
        self.assertIn("offen", betreff(self.ergebnis, ausfuehrung=bericht))

    def test_notbremse_steht_im_betreff_und_im_html(self):
        from vde_zugang.portal.ausfuehrung import Notbremse

        bericht = self.fuehre_aus(
            None, self.ergebnis.massnahmen, bestandsgroesse=50, dry_run=False,
            notbremse=Notbremse(max_aenderungen=0),
        )
        self.assertIn("GESTOPPT", betreff(self.ergebnis, ausfuehrung=bericht))
        self.assertIn("Notbremse", als_html(self.ergebnis, bericht))

    def test_csv_enthaelt_status_und_meldung(self):
        bericht = self.fuehre_aus(None, self.ergebnis.massnahmen, bestandsgroesse=50, dry_run=True)
        text = als_csv(self.ergebnis.massnahmen, bericht)
        self.assertIn("UEBERSPRUNGEN", text)
        self.assertIn("Testlauf", text)


if __name__ == "__main__":
    unittest.main(verbosity=2)
