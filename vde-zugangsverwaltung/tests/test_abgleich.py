"""Tests der Fachlogik - laufen ohne Databricks/Spark."""

from __future__ import annotations

import sys
import unittest
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from vde_zugang.abgleich import ermittle_massnahmen, wende_massnahmen_an  # noqa: E402
from vde_zugang.modelle import (  # noqa: E402
    Aktion,
    IstZugang,
    Mitarbeiter,
    Prioritaet,
    SollZugang,
)

HEUTE = date(2026, 8, 27)


def person(nr="4711", name="Anna Beispiel", aktiv=True, austritt=None, email=None):
    return Mitarbeiter(
        personalnummer=nr,
        name=name,
        email=email if email is not None else f"{nr}@firma.de",
        abteilung="Netzplanung",
        aktiv=aktiv,
        austritt=austritt,
    )


def aktionen(ergebnis):
    return {(m.aktion, m.personalnummer, m.regelwerk) for m in ergebnis.massnahmen}


class TestAnlegen(unittest.TestCase):
    def test_fehlender_zugang_wird_angelegt(self):
        e = ermittle_massnahmen(
            [person()], [SollZugang("4711", "VDE-AR-N-4100")], [], HEUTE
        )
        self.assertIn((Aktion.ANLEGEN, "4711", "VDE-AR-N-4100"), aktionen(e))
        self.assertEqual(e.massnahmen[0].prioritaet, Prioritaet.HOCH)

    def test_vorhandener_zugang_erzeugt_keine_massnahme(self):
        e = ermittle_massnahmen(
            [person()],
            [SollZugang("4711", "VDE-AR-N-4100")],
            [IstZugang("4711", "VDE-AR-N-4100")],
            HEUTE,
        )
        self.assertEqual(e.massnahmen, [])

    def test_schreibweisen_werden_normalisiert(self):
        e = ermittle_massnahmen(
            [person(nr=" 4711 ")],
            [SollZugang("4711", "vde ar n 4100")],
            [IstZugang("4711", "VDE_AR-N-4100")],
            HEUTE,
        )
        self.assertEqual(e.massnahmen, [], "Nur Schreibweise unterschiedlich -> keine Massnahme")

    def test_kein_anlegen_fuer_ausgeschiedene(self):
        e = ermittle_massnahmen(
            [person(austritt=HEUTE - timedelta(days=5))],
            [SollZugang("4711", "VDE-AR-N-4100")],
            [],
            HEUTE,
        )
        self.assertEqual(e.massnahmen, [])
        self.assertTrue(any("ausgeschieden" in w for w in e.warnungen))

    def test_soll_ohne_stammdatensatz_wird_gewarnt(self):
        e = ermittle_massnahmen([], [SollZugang("9999", "VDE-AR-N-4100")], [], HEUTE)
        self.assertEqual(e.massnahmen, [])
        self.assertTrue(any("9999" in w for w in e.warnungen))


class TestOffboarding(unittest.TestCase):
    def test_ausgeschiedener_mitarbeiter_verliert_zugang(self):
        e = ermittle_massnahmen(
            [person(austritt=HEUTE - timedelta(days=1))],
            [SollZugang("4711", "VDE-AR-N-4100")],
            [IstZugang("4711", "VDE-AR-N-4100")],
            HEUTE,
        )
        (m,) = e.massnahmen
        self.assertEqual(m.aktion, Aktion.ENTZIEHEN)
        self.assertEqual(m.prioritaet, Prioritaet.HOCH)

    def test_austritt_am_stichtag_zaehlt_als_ausgeschieden(self):
        e = ermittle_massnahmen(
            [person(austritt=HEUTE)],
            [SollZugang("4711", "VDE-AR-N-4100")],
            [IstZugang("4711", "VDE-AR-N-4100")],
            HEUTE,
        )
        self.assertEqual(e.massnahmen[0].aktion, Aktion.ENTZIEHEN)

    def test_bevorstehender_austritt_wird_vorgemerkt(self):
        austritt = HEUTE + timedelta(days=14)
        e = ermittle_massnahmen(
            [person(austritt=austritt)],
            [SollZugang("4711", "VDE-AR-N-4100")],
            [IstZugang("4711", "VDE-AR-N-4100")],
            HEUTE,
            vorlauf_tage=30,
        )
        (m,) = e.massnahmen
        self.assertEqual(m.aktion, Aktion.ENTZIEHEN)
        self.assertEqual(m.prioritaet, Prioritaet.MITTEL)
        self.assertEqual(m.faellig_am, austritt)

    def test_austritt_ausserhalb_vorlauf_erzeugt_nichts(self):
        e = ermittle_massnahmen(
            [person(austritt=HEUTE + timedelta(days=90))],
            [SollZugang("4711", "VDE-AR-N-4100")],
            [IstZugang("4711", "VDE-AR-N-4100")],
            HEUTE,
            vorlauf_tage=30,
        )
        self.assertEqual(e.massnahmen, [])

    def test_inaktiver_mitarbeiter_ohne_austrittsdatum(self):
        e = ermittle_massnahmen(
            [person(aktiv=False)],
            [SollZugang("4711", "VDE-AR-N-4100")],
            [IstZugang("4711", "VDE-AR-N-4100")],
            HEUTE,
        )
        self.assertEqual(e.massnahmen[0].aktion, Aktion.ENTZIEHEN)

    def test_verwaister_zugang_wird_nur_zur_pruefung_gemeldet(self):
        e = ermittle_massnahmen(
            [], [], [IstZugang("8888", "VDE-AR-N-4100", email="alt@firma.de")], HEUTE
        )
        (m,) = e.massnahmen
        self.assertEqual(m.aktion, Aktion.PRUEFEN)
        self.assertEqual(m.prioritaet, Prioritaet.HOCH)


class TestEntzugUndAblauf(unittest.TestCase):
    def test_zugang_nicht_mehr_im_soll(self):
        e = ermittle_massnahmen(
            [person()], [], [IstZugang("4711", "VDE-AR-N-4100")], HEUTE
        )
        (m,) = e.massnahmen
        self.assertEqual(m.aktion, Aktion.ENTZIEHEN)
        self.assertEqual(m.prioritaet, Prioritaet.MITTEL)

    def test_abgelaufener_zugang(self):
        e = ermittle_massnahmen(
            [person()],
            [SollZugang("4711", "VDE-AR-N-4100", gueltig_bis=HEUTE - timedelta(days=3))],
            [IstZugang("4711", "VDE-AR-N-4100")],
            HEUTE,
        )
        (m,) = e.massnahmen
        self.assertEqual(m.aktion, Aktion.VERLAENGERN)
        self.assertEqual(m.prioritaet, Prioritaet.HOCH)

    def test_bald_ablaufender_zugang(self):
        e = ermittle_massnahmen(
            [person()],
            [SollZugang("4711", "VDE-AR-N-4100", gueltig_bis=HEUTE + timedelta(days=10))],
            [IstZugang("4711", "VDE-AR-N-4100")],
            HEUTE,
            vorlauf_tage=30,
        )
        self.assertEqual(e.massnahmen[0].prioritaet, Prioritaet.MITTEL)

    def test_ablaufdatum_aus_ist_bestand_wird_genutzt(self):
        e = ermittle_massnahmen(
            [person()],
            [SollZugang("4711", "VDE-AR-N-4100")],
            [IstZugang("4711", "VDE-AR-N-4100", gueltig_bis=HEUTE + timedelta(days=5))],
            HEUTE,
        )
        self.assertEqual(e.massnahmen[0].aktion, Aktion.VERLAENGERN)

    def test_unbefristeter_zugang_laeuft_nicht_ab(self):
        e = ermittle_massnahmen(
            [person()],
            [SollZugang("4711", "VDE-AR-N-4100")],
            [IstZugang("4711", "VDE-AR-N-4100")],
            HEUTE,
        )
        self.assertEqual(e.massnahmen, [])

    def test_doppelte_sharepoint_zeilen_laengste_gueltigkeit_gewinnt(self):
        e = ermittle_massnahmen(
            [person()],
            [
                SollZugang("4711", "VDE-AR-N-4100", gueltig_bis=HEUTE + timedelta(days=5)),
                SollZugang("4711", "VDE-AR-N-4100", gueltig_bis=HEUTE + timedelta(days=400)),
            ],
            [IstZugang("4711", "VDE-AR-N-4100")],
            HEUTE,
        )
        self.assertEqual(e.massnahmen, [])
        self.assertEqual(e.anzahl_soll, 1)


class TestSortierungUndFortschreibung(unittest.TestCase):
    def test_hohe_prioritaet_steht_oben(self):
        e = ermittle_massnahmen(
            [person("1", "Zeta"), person("2", "Alpha")],
            [SollZugang("2", "VDE-0100")],
            [IstZugang("1", "VDE-0105", gueltig_bis=HEUTE + timedelta(days=20))],
            HEUTE,
        )
        self.assertEqual(e.massnahmen[0].aktion, Aktion.ANLEGEN)
        self.assertEqual(e.massnahmen[0].prioritaet, Prioritaet.HOCH)

    def test_bestand_wird_nach_erledigung_fortgeschrieben(self):
        e = ermittle_massnahmen(
            [person()], [SollZugang("4711", "VDE-AR-N-4100")], [], HEUTE
        )
        neu = wende_massnahmen_an([], e.massnahmen, HEUTE)
        self.assertEqual([z.schluessel for z in neu], [("4711", "VDE-AR-N-4100")])

        # Folgelauf: nichts mehr zu tun
        e2 = ermittle_massnahmen(
            [person()], [SollZugang("4711", "VDE-AR-N-4100")], neu, HEUTE
        )
        self.assertEqual(e2.massnahmen, [])

    def test_entzug_entfernt_aus_bestand(self):
        bestand = [IstZugang("4711", "VDE-AR-N-4100")]
        e = ermittle_massnahmen([person()], [], bestand, HEUTE)
        neu = wende_massnahmen_an(bestand, e.massnahmen, HEUTE)
        self.assertEqual(neu, [])

    def test_pruefen_veraendert_bestand_nicht(self):
        bestand = [IstZugang("8888", "VDE-AR-N-4100")]
        e = ermittle_massnahmen([], [], bestand, HEUTE)
        neu = wende_massnahmen_an(bestand, e.massnahmen, HEUTE)
        self.assertEqual(len(neu), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
