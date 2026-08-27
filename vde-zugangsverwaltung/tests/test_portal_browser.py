"""End-to-End-Tests der Browser-Automatisierung gegen das Portal-Double.

Beweist, dass Anmeldung, Bestandslesen, Anlegen, Entziehen und Verlaengern
tatsaechlich funktionieren - unabhaengig davon, wie das echte Portal aussieht.
Beim Umstellen auf die echten Selektoren bleibt dieser Test die Referenz.
"""

from __future__ import annotations

import os
import sys
import unittest
from datetime import date
from pathlib import Path

WURZEL = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(WURZEL / "src"))
sys.path.insert(0, str(WURZEL / "tests"))

try:
    from playwright.sync_api import sync_playwright  # noqa: F401
    PLAYWRIGHT_DA = True
except ImportError:
    PLAYWRIGHT_DA = False

import fake_portal  # noqa: E402

from vde_zugang.modelle import Aktion, Massnahme, Prioritaet  # noqa: E402
from vde_zugang.portal.ausfuehrung import Notbremse, fuehre_aus  # noqa: E402
from vde_zugang.portal.basis import PortalFehler  # noqa: E402
from vde_zugang.portal.selektoren import PortalZugang, Selektoren  # noqa: E402

CHROMIUM = os.environ.get("CHROMIUM_PFAD", "/opt/pw-browsers/chromium")


def massnahme(aktion, pnr="10025", regelwerk="VDE-0100", email=None, name="Clara Neu"):
    return Massnahme(
        aktion=aktion, personalnummer=pnr, name=name,
        email=email if email is not None else f"{name.split()[0].lower()}@firma.de",
        regelwerk=regelwerk, prioritaet=Prioritaet.HOCH, faellig_am=date(2026, 8, 27),
        begruendung="Test",
    )


@unittest.skipUnless(PLAYWRIGHT_DA, "Playwright ist nicht installiert")
class TestBrowserAutomatisierung(unittest.TestCase):
    def setUp(self):
        from vde_zugang.portal.normenbibliothek import NormenbibliothekAdapter

        self.server, self.zustand, self.url = fake_portal.starte()
        self.addCleanup(self.server.shutdown)
        self.selektoren = Selektoren(**fake_portal.SELEKTOREN)
        self.zugang = PortalZugang(
            basis_url=self.url,
            benutzer=fake_portal.BENUTZER,
            passwort=fake_portal.PASSWORT,
            chromium_pfad=CHROMIUM,
        )
        self.adapter = NormenbibliothekAdapter(self.zugang, self.selektoren)

    def test_anmeldung_und_bestand_lesen(self):
        with self.adapter as portal:
            bestand = portal.lese_bestand()
        schluessel = {z.schluessel for z in bestand}
        self.assertEqual(
            schluessel,
            {("10023", "VDE-AR-N-4100"), ("10024", "VDE-0100"), ("10024", "VDE-0105")},
        )

    def test_falsches_kennwort_bricht_klar_ab(self):
        self.zugang.passwort = "falsch"
        with self.assertRaises(PortalFehler) as ctx:
            with self.adapter:
                pass
        self.assertIn("abgelehnt", str(ctx.exception).lower())

    def test_zugang_anlegen(self):
        with self.adapter as portal:
            ergebnis = portal.anlegen(massnahme(Aktion.ANLEGEN, "10025", "VDE-AR-N-4105"))
            self.assertTrue(ergebnis.erfolg, ergebnis.meldung)
            bestand = {z.schluessel for z in portal.lese_bestand()}
        self.assertIn(("10025", "VDE-AR-N-4105"), bestand)
        self.assertEqual(self.zustand.finde("10025")["email"], "clara@firma.de")

    def test_zugang_entziehen_mit_sicherheitsabfrage(self):
        with self.adapter as portal:
            ergebnis = portal.entziehen(
                massnahme(Aktion.ENTZIEHEN, "10024", "VDE-0105", name="Bernd Muster")
            )
            self.assertTrue(ergebnis.erfolg, ergebnis.meldung)
            bestand = {z.schluessel for z in portal.lese_bestand()}
        self.assertNotIn(("10024", "VDE-0105"), bestand)
        self.assertIn(("10024", "VDE-0100"), bestand, "nur das eine Regelwerk darf weg sein")

    def test_entziehen_trifft_nur_die_richtige_person(self):
        # 10023 und 10024 bekommen dasselbe Regelwerk - der Entzug darf nur einen treffen.
        self.zustand.finde("10023")["regelwerke"].append("VDE-0100")
        with self.adapter as portal:
            portal.entziehen(massnahme(Aktion.ENTZIEHEN, "10024", "VDE-0100", name="Bernd Muster"))
        self.assertIn("VDE-0100", self.zustand.finde("10023")["regelwerke"])
        self.assertNotIn("VDE-0100", self.zustand.finde("10024")["regelwerke"])

    def test_entziehen_ohne_portal_eintrag_ist_kein_fehler(self):
        with self.adapter as portal:
            ergebnis = portal.entziehen(massnahme(Aktion.ENTZIEHEN, "99999", "VDE-0100"))
        self.assertTrue(ergebnis.erfolg)
        self.assertIn("nichts zu entziehen", ergebnis.meldung)

    def test_verlaengern_setzt_neues_ablaufdatum(self):
        with self.adapter as portal:
            ergebnis = portal.verlaengern(
                massnahme(Aktion.VERLAENGERN, "10023", "VDE-AR-N-4100", name="Anna Beispiel")
            )
        self.assertTrue(ergebnis.erfolg, ergebnis.meldung)
        self.assertTrue(self.zustand.finde("10023")["gueltig_bis"].endswith("-12-31"))

    def test_fehlender_selektor_meldet_klartext(self):
        self.selektoren.tabelle_benutzer = "#gibtesnicht"
        with self.adapter as portal:
            with self.assertRaises(PortalFehler) as ctx:
                portal.lese_bestand()
        self.assertIn("nicht gefunden", str(ctx.exception))

    def test_kompletter_lauf_ueber_die_ausfuehrungsschicht(self):
        aufgaben = [
            massnahme(Aktion.ANLEGEN, "10025", "VDE-AR-N-4105"),
            massnahme(Aktion.ENTZIEHEN, "10024", "VDE-0105", name="Bernd Muster"),
            massnahme(Aktion.PRUEFEN, "99999", "VDE-0100", name="Unbekannt"),
        ]
        with self.adapter as portal:
            bericht = fuehre_aus(portal, aufgaben, bestandsgroesse=3, dry_run=False)
            bestand = {z.schluessel for z in portal.lese_bestand()}

        self.assertFalse(bericht.abgebrochen)
        self.assertEqual(len(bericht.erfolgreich), 2)
        self.assertEqual(len(bericht.fehlgeschlagen), 0)
        self.assertEqual(len(bericht.uebersprungen), 1, "Pruefauftrag bleibt liegen")
        self.assertIn(("10025", "VDE-AR-N-4105"), bestand)
        self.assertNotIn(("10024", "VDE-0105"), bestand)

    def test_testlauf_veraendert_nichts(self):
        vorher = [dict(b) for b in self.zustand.benutzer]
        aufgaben = [massnahme(Aktion.ENTZIEHEN, "10024", "VDE-0105", name="Bernd Muster")]
        with self.adapter as portal:
            bericht = fuehre_aus(portal, aufgaben, bestandsgroesse=3, dry_run=True)
        self.assertEqual(len(bericht.uebersprungen), 1)
        self.assertEqual([b["regelwerke"] for b in self.zustand.benutzer],
                         [b["regelwerke"] for b in vorher])


class TestNotbremse(unittest.TestCase):
    """Laeuft ohne Browser - reine Regellogik."""

    def entzuege(self, anzahl):
        return [massnahme(Aktion.ENTZIEHEN, str(i), "VDE-0100") for i in range(anzahl)]

    def test_zu_viele_entzuege_stoppen_den_lauf(self):
        bericht = fuehre_aus(None, self.entzuege(11), bestandsgroesse=200,
                             dry_run=False, notbremse=Notbremse(max_entzuege=10))
        self.assertTrue(bericht.abgebrochen)
        self.assertEqual(len(bericht.erfolgreich), 0)
        self.assertIn("11 Entzuege", bericht.abbruchgrund)

    def test_zu_grosser_anteil_stoppt_den_lauf(self):
        bericht = fuehre_aus(None, self.entzuege(50), bestandsgroesse=100, dry_run=False,
                             notbremse=Notbremse(max_entzuege=99, max_aenderungen=999,
                                                 anteil_entzug_grenze=0.30))
        self.assertTrue(bericht.abgebrochen)
        self.assertIn("50%", bericht.abbruchgrund)

    def test_kleiner_bestand_wird_nicht_von_der_prozentregel_blockiert(self):
        # Zwei von fuenf Lizenzen sind 40 % - bei dieser Groesse voellig normal.
        grund = Notbremse().pruefe(self.entzuege(2), bestandsgroesse=5)
        self.assertIsNone(grund)

    def test_normaler_umfang_laeuft_durch(self):
        grund = Notbremse().pruefe(self.entzuege(3), bestandsgroesse=120)
        self.assertIsNone(grund)

    def test_leerer_bestand_loest_keine_division_aus(self):
        self.assertIsNone(Notbremse().pruefe([], bestandsgroesse=0))

    def test_reihenfolge_entziehen_vor_anlegen(self):
        aufgaben = [massnahme(Aktion.ANLEGEN, "1"), massnahme(Aktion.ENTZIEHEN, "2")]
        bericht = fuehre_aus(None, aufgaben, bestandsgroesse=50, dry_run=True)
        aktionen = [e.massnahme.aktion for e in bericht.ergebnisse]
        self.assertEqual(aktionen, [Aktion.ENTZIEHEN, Aktion.ANLEGEN])


if __name__ == "__main__":
    unittest.main(verbosity=2)
