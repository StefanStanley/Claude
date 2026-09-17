"""Tests für das Laden von Vorgängen.

Schwerpunkt liegt auf dem Paging: Genau dort entstehen die Fehler, die niemand bemerkt,
weil eine unvollständige Ergebnismenge aussieht wie eine vollständige.
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from entity_laden import LadeFehler, alle, belegung, seiten


class FakeAntwort:
    def __init__(self, nutzlast, status=200):
        self.status_code = status
        self._nutzlast = nutzlast
        self.text = str(nutzlast)

    def json(self):
        return self._nutzlast


class FakeSitzung:
    """Ersetzt requests.Session und gibt vorbereitete Seiten zurück."""

    def __init__(self, seiten_folge, status=200):
        self.seiten_folge = list(seiten_folge)
        self.status = status
        self.rumpfe = []

    def post(self, url, json=None, timeout=None):
        self.rumpfe.append(json)
        if self.status != 200:
            return FakeAntwort({"fehler": "kaputt"}, self.status)
        if not self.seiten_folge:
            return FakeAntwort({"results": []})
        return FakeAntwort({"results": self.seiten_folge.pop(0)})


def vorgang(i, mit_cursor=True):
    e = {"_id": f"v{i}", "_title": f"Vorgang {i}"}
    if mit_cursor:
        e["_sort"] = [i]
    return e


class TestPaging(unittest.TestCase):
    def test_holt_ueber_mehrere_seiten(self):
        s = FakeSitzung([[vorgang(i) for i in range(2)], [vorgang(9)]])
        ergebnis = alle("_schema:opportunity", "tok", groesse=2, sitzung=s)
        self.assertEqual([e["_id"] for e in ergebnis], ["v0", "v1", "v9"])

    def test_letzte_seite_erkennt_sich_an_der_menge(self):
        # Eine Seite mit weniger Treffern als angefragt beendet den Lauf —
        # ohne einen weiteren Aufruf ins Leere.
        s = FakeSitzung([[vorgang(0)]])
        alle("q", "tok", groesse=500, sitzung=s)
        self.assertEqual(len(s.rumpfe), 1)

    def test_cursor_wandert_von_seite_zu_seite(self):
        s = FakeSitzung([[vorgang(0), vorgang(1)], [vorgang(2)]])
        alle("q", "tok", groesse=2, sitzung=s)
        self.assertNotIn("search_after", s.rumpfe[0])
        self.assertEqual(s.rumpfe[1]["search_after"], [1])

    def test_fehlender_cursor_beendet_statt_endlos_zu_laufen(self):
        # Ohne _sort in der Antwort gäbe es sonst immer wieder dieselbe Seite.
        volle_seite = [vorgang(i, mit_cursor=False) for i in range(2)]
        s = FakeSitzung([volle_seite, volle_seite, volle_seite])
        ergebnis = alle("q", "tok", groesse=2, sitzung=s)
        self.assertEqual(len(ergebnis), 2)
        self.assertEqual(len(s.rumpfe), 1)

    def test_max_seiten_bremst(self):
        s = FakeSitzung([[vorgang(i), vorgang(i + 100)] for i in range(5)])
        ergebnis = alle("q", "tok", groesse=2, max_seiten=2, sitzung=s)
        self.assertEqual(len(ergebnis), 4)

    def test_hits_statt_results(self):
        class NurHits(FakeSitzung):
            def post(self, url, json=None, timeout=None):
                self.rumpfe.append(json)
                return FakeAntwort({"hits": [vorgang(1)]})

        self.assertEqual(len(alle("q", "tok", groesse=5, sitzung=NurHits([]))), 1)


class TestFehler(unittest.TestCase):
    def test_fehlerstatus_bricht_ab_statt_teilmenge_zu_liefern(self):
        s = FakeSitzung([], status=403)
        with self.assertRaises(LadeFehler):
            alle("q", "tok", sitzung=s)

    def test_ohne_token_keine_sitzung(self):
        with self.assertRaises(LadeFehler):
            list(seiten("q", ""))

    def test_seitengroesse_ueber_der_api_grenze(self):
        with self.assertRaises(LadeFehler):
            list(seiten("q", "tok", groesse=5000))


class TestBelegung(unittest.TestCase):
    def test_zaehlt_nur_gefuellte_felder(self):
        daten = [{"a": 1, "b": "", "c": None, "d": []},
                 {"a": 2, "b": "x"}]
        self.assertEqual(dict(belegung(daten)), {"a": 2, "b": 1})


if __name__ == "__main__":
    unittest.main()
