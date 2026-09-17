"""Tests für den Exportlauf.

Schwerpunkt liegt auf dem, was in Produktion wehtut: Dateiformat byteweise,
Kodierung, und dass fehlerhafte Vorgänge zurückgehalten statt geliefert werden.
"""
import json
import sys
import unittest
from datetime import datetime
from pathlib import Path
from typing import ClassVar

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sap_export.config import Config, ConfigFehler
from sap_export.csvschreiber import KodierungsFehler, baue_datei, lege_ab, zeile_als_text
from sap_export.job import lauf
from sap_export.mapping import hole, zeile
from sap_export.pruefung import pruefe

BASIS = Path(__file__).resolve().parents[1]
FIXTURES = json.loads((BASIS / "tests/fixtures/entities.json").read_text(encoding="utf-8"))


def config():
    return Config.laden(BASIS / "config.beispiel.yaml")


class FakeAPI:
    """Ersetzt die epilot-API im Test."""
    def __init__(self, entities, status_faellt_aus=False):
        self.entities = entities
        self.gesetzt = []
        self.status_faellt_aus = status_faellt_aus

    def suche(self):
        return iter(self.entities)

    def setze_status(self, entity_id, wert):
        if self.status_faellt_aus:
            from sap_export.epilot import EpilotFehler
            raise EpilotFehler("simulierter Ausfall")
        self.gesetzt.append((entity_id, wert))


class TestPfadzugriff(unittest.TestCase):
    def test_verschachtelt_mit_listenindex(self):
        e = FIXTURES[0]
        self.assertEqual(hole(e, "betreiber.0.address.0.postal_code"), "40233")

    def test_fehlendes_glied_ergibt_none(self):
        self.assertIsNone(hole(FIXTURES[0], "betreiber.5.nachname"))
        self.assertIsNone(hole(FIXTURES[0], "gibtsnicht.tief.drin"))


class TestMapping(unittest.TestCase):
    def setUp(self):
        self.cfg = config()

    def test_vollstaendiger_vorgang_wird_abgebildet(self):
        werte, fehler = zeile(FIXTURES[0], self.cfg)
        self.assertEqual(fehler, [])
        spalten = {s.name: w for s, w in zip(self.cfg.spalten, werte, strict=True)}
        self.assertEqual(spalten["IBN_DATUM"], "17032026")          # ISO -> TTMMJJJJ
        self.assertEqual(spalten["LEISTUNG_KWP"], "9,90")           # Dezimalkomma
        self.assertEqual(spalten["ANLAGEN_TYP"], "PVA")             # Werteliste
        self.assertEqual(spalten["UST_KZ"], "0")                    # Kleinunternehmer
        self.assertEqual(spalten["IBAN"], "DE89370400440532013000") # Leerzeichen raus
        self.assertEqual(spalten["EMAIL"], "anna.beispiel@example.org")
        self.assertEqual(spalten["EINGANGSKANAL"], "PORTAL")        # Konstante

    def test_unbekannter_wertelisteneintrag_wird_fehler(self):
        _, fehler = zeile(FIXTURES[2], self.cfg)   # anlagenart: geothermie
        self.assertTrue(any("geothermie" in f for f in fehler), fehler)

    def test_fehlendes_pflichtfeld_wird_fehler(self):
        _, fehler = zeile(FIXTURES[1], self.cfg)   # mastr_nummer fehlt
        self.assertTrue(any("MASTR_NR" in f for f in fehler), fehler)


class TestPruefung(unittest.TestCase):
    def setUp(self):
        self.cfg = config()

    def test_sauberer_vorgang_ohne_befund(self):
        self.assertEqual(pruefe(FIXTURES[0], self.cfg), [])

    def test_ibs_datum_in_der_zukunft_faellt_auf(self):
        befunde = pruefe(FIXTURES[4], self.cfg)
        self.assertTrue(any("Zukunft" in b.text for b in befunde), befunde)

    def test_fehlende_mastr_nummer_faellt_auf(self):
        befunde = pruefe(FIXTURES[1], self.cfg)
        self.assertTrue(any(b.feld == "mastr_nummer" for b in befunde), befunde)


class TestDateiformat(unittest.TestCase):
    def setUp(self):
        self.cfg = config()

    def test_zeilenende_und_kodierung(self):
        werte, _ = zeile(FIXTURES[0], self.cfg)
        roh = baue_datei([werte], self.cfg)
        self.assertTrue(roh.endswith(b"\r\n"))
        self.assertNotIn(b"\n\n", roh)
        # Umlaut in Windows-1252, nicht UTF-8
        self.assertIn("Düsseldorf".encode("cp1252"), roh)
        self.assertNotIn("Düsseldorf".encode(), roh)

    def test_kopfzeile_steht_in_konfigurierter_reihenfolge(self):
        roh = baue_datei([], self.cfg)
        kopf = roh.decode("cp1252").split("\r\n")[0]
        self.assertEqual(kopf.split(";")[:3], ["EXT_REFERENZ", "EINGANGSKANAL", "NACHNAME"])

    def test_trennzeichen_im_feldinhalt_wird_maskiert(self):
        text = zeile_als_text(["a;b", "c"], self.cfg)
        self.assertEqual(text, '"a;b";c')

    def test_nicht_kodierbares_zeichen_wirft(self):
        werte, _ = zeile(FIXTURES[3], self.cfg)   # Łukasz Wiśniewski
        with self.assertRaises(UnicodeEncodeError):
            baue_datei([werte], self.cfg)

    def test_bom_nur_bei_utf8(self):
        roh = dict(self.cfg.format.__dict__)
        self.cfg.format.kodierung = "utf-8"
        self.cfg.format.bom = True
        self.assertTrue(baue_datei([], self.cfg).startswith(b"\xef\xbb\xbf"))
        self.cfg.format.kodierung = "cp1252"
        with self.assertRaises(KodierungsFehler):
            baue_datei([], self.cfg)
        self.cfg.format.__dict__.update(roh)


class TestAtomareAblage(unittest.TestCase):
    def test_keine_temp_datei_bleibt_liegen(self):
        import tempfile
        cfg = config()
        with tempfile.TemporaryDirectory() as tmp:
            cfg.ablage.verzeichnis = tmp
            ziel = lege_ab(b"inhalt", cfg, datetime(2026, 3, 17, 2, 30, 0))
            self.assertEqual(ziel.name, "EINSPEISER_20260317_023000.csv")
            self.assertEqual(ziel.read_bytes(), b"inhalt")
            self.assertEqual(list(Path(tmp).glob("*.tmp")), [])


class TestLauf(unittest.TestCase):
    def setUp(self):
        self.cfg = config()
        self.tmp = __import__("tempfile").TemporaryDirectory()
        self.cfg.ablage.verzeichnis = self.tmp.name
        self.cfg.ablage.protokoll_verzeichnis = None

    def tearDown(self):
        self.tmp.cleanup()

    def test_nur_saubere_vorgaenge_werden_geliefert(self):
        api = FakeAPI(FIXTURES)
        erg = lauf(self.cfg, "token", api=api)
        self.assertEqual(erg.gelesen, 5)
        self.assertEqual(erg.geliefert, 1)          # nur der erste ist sauber
        self.assertEqual(erg.zurueckgehalten, 4)
        self.assertEqual(len(api.gesetzt), 1)
        self.assertEqual(api.gesetzt[0][1], "uebertragen")

    def test_klaerliste_nennt_grund_und_id(self):
        erg = lauf(self.cfg, "token", api=FakeAPI(FIXTURES))
        ids = {k["entity_id"] for k in erg.klaerliste}
        self.assertIn("aaaaaaaa-1111-2222-3333-444444444444", ids)
        eintrag = next(k for k in erg.klaerliste if k["entity_id"].startswith("cccc"))
        self.assertTrue(any("cp1252" in g for g in eintrag["gruende"]), eintrag)

    def test_klaerliste_enthaelt_keine_personendaten(self):
        erg = lauf(self.cfg, "token", api=FakeAPI(FIXTURES))
        roh = json.dumps(erg.klaerliste, ensure_ascii=False)
        for verboten in ("Anna", "DE89", "Musterweg", "example.org"):
            self.assertNotIn(verboten, roh)

    def test_probelauf_legt_nichts_ab_und_setzt_keinen_status(self):
        api = FakeAPI(FIXTURES)
        erg = lauf(self.cfg, "token", probelauf=True, api=api)
        self.assertEqual(api.gesetzt, [])
        self.assertEqual(list(Path(self.tmp.name).iterdir()), [])
        self.assertEqual(erg.geliefert, 1)

    def test_status_ausfall_wird_gemeldet_datei_bleibt(self):
        api = FakeAPI(FIXTURES, status_faellt_aus=True)
        erg = lauf(self.cfg, "token", api=api)
        self.assertEqual(len(erg.status_fehler), 1)
        self.assertTrue(Path(erg.datei).exists())   # Datei ist geliefert, Status offen

    def test_ohne_lieferbare_vorgaenge_keine_datei(self):
        erg = lauf(self.cfg, "token", api=FakeAPI([FIXTURES[1]]))
        self.assertEqual(erg.geliefert, 0)
        self.assertIsNone(erg.datei)
        self.assertEqual(list(Path(self.tmp.name).iterdir()), [])


class TestConfigPruefung(unittest.TestCase):
    def test_unbekannte_kodierung_faellt_beim_laden_auf(self):
        cfg = config()
        with self.assertRaises(ConfigFehler):
            type(cfg.format)(kodierung="gibtsnicht")

    def test_doppelter_spaltenname_faellt_auf(self):
        import tempfile

        import yaml
        roh = yaml.safe_load((BASIS / "config.beispiel.yaml").read_text(encoding="utf-8"))
        roh["spalten"].append({"name": "PLZ", "quelle": "_id"})
        with tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False, encoding="utf-8") as f:
            yaml.safe_dump(roh, f)
            pfad = f.name
        with self.assertRaises(ConfigFehler):
            Config.laden(pfad)


if __name__ == "__main__":
    unittest.main(verbosity=2)


class TestProbelaufEinspeiser(unittest.TestCase):
    """Die Konfiguration für den Probelauf gegen einen realistischen Vorgang.

    Sichert die Feldnamen aus dem Billing-Mapping ab: Ändert epilot ein Attribut oder
    vertippt sich jemand in der Konfiguration, fällt es hier auf und nicht erst in der
    Datei, die bei SAP landet.
    """

    VORGANG: ClassVar[dict] = {
        "_id": "abc-123",
        "opportunity_number": "OPP-2026-004711",
        "delivery_address": [{"street": "Musterstraße ", "street_number": "12a",
                              "postal_code": "40233", "city": "Düsseldorf"}],
        "ea_erzeugungsanlage_anlagentyp": "photovoltaik",
        "ea_inbetriebsetzungsdatum": "2026-03-17T00:00:00.000Z",
        "ea_installierte_modulleistung_in_kwp": 9.9,
        "zaehlermeldung_messkonzept": "MK-03",
        "ea_see_erzeugungsanlage": "SEE900000123456",
        "ea_erzeugungsanlage_art_der_einspeisung": "ueberschusseinspeisung",
    }

    def setUp(self):
        self.cfg = Config.laden(BASIS / "config.einspeiser.probelauf.yaml")

    def spalten(self):
        werte, fehler = zeile(self.VORGANG, self.cfg)
        self.assertEqual(fehler, [])
        return {s.name: w for s, w in zip(self.cfg.spalten, werte, strict=True)}

    def test_vollstaendiger_vorgang_geht_durch(self):
        self.assertEqual(pruefe(self.VORGANG, self.cfg), [])
        self.assertEqual(zeile(self.VORGANG, self.cfg)[1], [])

    def test_sechzehn_spalten_nicht_dreissig(self):
        # Entscheidung vom 19.09.2026: Die Datei darf auf das Minimalset schrumpfen.
        self.assertEqual(len(self.cfg.spalten), 16)

    def test_einspeiseart_wird_zum_sap_schluessel(self):
        self.assertEqual(self.spalten()["Art der Einspeisung"], "02")

    def test_unbekannte_energieart_wird_durchgereicht_statt_zurueckgehalten(self):
        # Die Werteliste ist leer, solange die Zielschlüssel fehlen. Im Probelauf soll
        # der Rohwert sichtbar werden, damit man ihn überhaupt erfährt.
        self.assertEqual(self.spalten()["Energieart"], "photovoltaik")

    def test_datum_und_dezimaltrennzeichen(self):
        s = self.spalten()
        self.assertEqual(s["EEG_Inbetriebnahmedatum"], "17.03.2026")
        self.assertEqual(s["Gesamtleistung_kW"], "9,90")

    def test_randleerzeichen_der_strasse_faellt_weg(self):
        self.assertEqual(self.spalten()["Straße_Anschlussobjekt"], "Musterstraße")

    def test_offene_felder_bleiben_leer_statt_zu_scheitern(self):
        s = self.spalten()
        for feld in ("Einspeisemanagement", "Fernsteuerbarkeit", "Nettoleistung_kW"):
            self.assertEqual(s[feld], "")

    def test_fehlende_see_nummer_haelt_den_vorgang_zurueck(self):
        # Ohne SEE-Nummer keine EEG-Vergütung — der Vorgang gehört in die Klärliste.
        ohne = {k: v for k, v in self.VORGANG.items() if k != "ea_see_erzeugungsanlage"}
        self.assertTrue(pruefe(ohne, self.cfg))
