"""Browser-Automatisierung der VDE Normenbibliothek (Playwright).

Bedient die Administrationsoberflaeche wie ein Mensch: anmelden, Benutzerliste
lesen, Zugaenge anlegen, entziehen, verlaengern. Jede Aktion wird anschliessend
verifiziert - "Knopf gedrueckt" ist kein Nachweis, dass etwas passiert ist.

Alle Ortsangaben stehen in `selektoren.py`, nicht hier.
"""

from __future__ import annotations

import logging
import re
import time
from datetime import date
from pathlib import Path

from ..modelle import IstZugang, Massnahme, normalisiere_regelwerk, normalisiere_schluessel
from .basis import AktionsErgebnis, PortalAdapter, PortalFehler, Portalbenutzer, SelektorFehler
from .selektoren import PortalZugang, Selektoren

LOG = logging.getLogger(__name__)


class NormenbibliothekAdapter(PortalAdapter):
    """Fuehrt Zugangsaenderungen im Portal per Browser aus."""

    name = "normenbibliothek"
    kann_ausfuehren = True

    def __init__(self, zugang: PortalZugang, selektoren: Selektoren):
        zugang.pruefe()
        selektoren.pruefe()
        self.zugang = zugang
        self.sel = selektoren
        self._playwright = None
        self._browser = None
        self._context = None
        self.seite = None

    # ------------------------------------------------------------------ Setup
    def oeffnen(self) -> None:
        from playwright.sync_api import sync_playwright

        self._playwright = sync_playwright().start()
        start = {"headless": self.zugang.kopflos, "slow_mo": self.zugang.langsam_ms or 0}
        if self.zugang.chromium_pfad:
            start["executable_path"] = self.zugang.chromium_pfad
        # Databricks-Cluster laufen als root, dort ist die Chromium-Sandbox nicht nutzbar.
        start["args"] = ["--no-sandbox", "--disable-dev-shm-usage"]

        self._browser = self._playwright.chromium.launch(**start)
        kontext_args = {"locale": "de-DE", "viewport": {"width": 1440, "height": 900}}
        sitzung = self.zugang.sitzung_pfad
        if sitzung and Path(sitzung).exists():
            kontext_args["storage_state"] = sitzung
        self._context = self._browser.new_context(**kontext_args)
        self._context.set_default_timeout(self.sel.wartezeit_ms)
        self.seite = self._context.new_page()
        self._anmelden()

    def schliessen(self) -> None:
        for teil in ("_context", "_browser"):
            objekt = getattr(self, teil, None)
            if objekt is not None:
                try:
                    objekt.close()
                except Exception as fehler:  # Aufraeumen darf den Lauf nicht kippen
                    LOG.warning("Fehler beim Schliessen von %s: %s", teil, fehler)
        if self._playwright is not None:
            try:
                self._playwright.stop()
            except Exception as fehler:
                LOG.warning("Fehler beim Stoppen von Playwright: %s", fehler)
        self._playwright = self._browser = self._context = self.seite = None

    # ------------------------------------------------------------- Hilfsmittel
    def _url(self, pfad: str) -> str:
        return self.zugang.basis_url.rstrip("/") + "/" + pfad.lstrip("/")

    def _screenshot(self, name: str) -> str:
        verzeichnis = self.zugang.screenshot_verzeichnis
        if not verzeichnis or self.seite is None:
            return ""
        try:
            Path(verzeichnis).mkdir(parents=True, exist_ok=True)
            ziel = str(Path(verzeichnis) / f"{name}-{int(time.time())}.png")
            self.seite.screenshot(path=ziel, full_page=True)
            return ziel
        except Exception as fehler:
            LOG.warning("Screenshot fehlgeschlagen: %s", fehler)
            return ""

    def _sichtbar(self, selektor: str, zeit_ms: int | None = None) -> bool:
        if not selektor:
            return False
        try:
            self.seite.wait_for_selector(
                selektor, state="visible", timeout=zeit_ms or self.sel.wartezeit_ms
            )
            return True
        except Exception:
            return False

    def _ruhe(self) -> None:
        if self.sel.ruhe_nach_aktion_ms:
            self.seite.wait_for_timeout(self.sel.ruhe_nach_aktion_ms)

    # ------------------------------------------------------------- Anmeldung
    def _anmelden(self) -> None:
        self.seite.goto(self._url(self.sel.pfad_login), wait_until="domcontentloaded")

        # Gespeicherte Sitzung kann uns den Login ersparen.
        if self._sichtbar(self.sel.marker_angemeldet, zeit_ms=3000):
            LOG.info("Bereits angemeldet (gespeicherte Sitzung).")
            return

        if not self._sichtbar(self.sel.feld_benutzer, zeit_ms=8000):
            self._screenshot("login-formular-fehlt")
            raise SelektorFehler(
                f"Anmeldeformular nicht gefunden ({self.sel.feld_benutzer}). "
                "Portal erreichbar? Selektoren aktuell?"
            )

        self.seite.fill(self.sel.feld_benutzer, self.zugang.benutzer)
        self.seite.fill(self.sel.feld_passwort, self.zugang.passwort)
        self.seite.click(self.sel.knopf_anmelden)

        if self.sel.marker_loginfehler and self._sichtbar(self.sel.marker_loginfehler, 4000):
            text = self.seite.inner_text(self.sel.marker_loginfehler).strip()
            self._screenshot("login-abgelehnt")
            raise PortalFehler(f"Anmeldung abgelehnt: {text[:200]}")

        if not self._sichtbar(self.sel.marker_angemeldet):
            self._screenshot("login-ohne-bestaetigung")
            raise PortalFehler(
                "Anmeldung nicht bestaetigt - Kennwort falsch, MFA aktiv oder Portal geaendert."
            )

        LOG.info("Am Portal angemeldet als %s", self.zugang.benutzer)
        if self.zugang.sitzung_pfad:
            try:
                self._context.storage_state(path=self.zugang.sitzung_pfad)
            except Exception as fehler:
                LOG.warning("Sitzung konnte nicht gesichert werden: %s", fehler)

    # ---------------------------------------------------------- Bestand lesen
    def lese_benutzer(self) -> list[Portalbenutzer]:
        """Liest die komplette Benutzeruebersicht inklusive Blaetterfunktion."""
        self.seite.goto(self._url(self.sel.pfad_benutzerliste), wait_until="domcontentloaded")
        if not self._sichtbar(self.sel.tabelle_benutzer):
            self._screenshot("benutzerliste-fehlt")
            raise SelektorFehler(
                f"Benutzeruebersicht nicht gefunden ({self.sel.tabelle_benutzer})."
            )

        benutzer: list[Portalbenutzer] = []
        gesehene_seiten = 0
        while True:
            gesehene_seiten += 1
            for zeile in self.seite.query_selector_all(self.sel.zeile_benutzer):
                eintrag = self._zeile_lesen(zeile)
                if eintrag is not None:
                    benutzer.append(eintrag)

            weiter = self.sel.knopf_naechste_seite
            if not weiter:
                break
            knopf = self.seite.query_selector(weiter)
            if knopf is None or not knopf.is_enabled():
                break
            knopf.click()
            self.seite.wait_for_selector(self.sel.tabelle_benutzer)
            self._ruhe()
            if gesehene_seiten > 200:  # Schutz gegen eine Blaetterschleife
                LOG.warning("Blaetterfunktion nach 200 Seiten abgebrochen.")
                break

        LOG.info("Portal: %s Benutzer auf %s Seite(n) gelesen", len(benutzer), gesehene_seiten)
        return benutzer

    def _zellentext(self, zeile, selektor: str) -> str:
        if not selektor:
            return ""
        element = zeile.query_selector(selektor)
        return element.inner_text().strip() if element else ""

    def _zeile_lesen(self, zeile) -> Portalbenutzer | None:
        personalnummer = self._zellentext(zeile, self.sel.zelle_personalnummer)
        email = self._zellentext(zeile, self.sel.zelle_email)
        if not personalnummer and not email:
            return None  # Kopf- oder Summenzeile

        roh = self._zellentext(zeile, self.sel.zelle_regelwerke)
        regelwerke = [
            normalisiere_regelwerk(teil)
            for teil in re.split(r"[;,\n|]+", roh)
            if teil.strip()
        ]
        status = self._zellentext(zeile, self.sel.zelle_status).lower()
        return Portalbenutzer(
            personalnummer=normalisiere_schluessel(personalnummer),
            email=email.lower(),
            name=self._zellentext(zeile, self.sel.zelle_name),
            aktiv=("inaktiv" not in status and "gesperrt" not in status),
            regelwerke=regelwerke,
            gueltig_bis=_datum(self._zellentext(zeile, self.sel.zelle_gueltig_bis)),
        )

    def lese_bestand(self) -> list[IstZugang]:
        bestand: list[IstZugang] = []
        for benutzer in self.lese_benutzer():
            for regelwerk in benutzer.regelwerke:
                bestand.append(
                    IstZugang(
                        personalnummer=benutzer.personalnummer,
                        regelwerk=regelwerk,
                        email=benutzer.email,
                        vde_benutzer=benutzer.benutzername or benutzer.email,
                        gueltig_bis=benutzer.gueltig_bis,
                    )
                )
        return bestand

    # ------------------------------------------------------------- Aktionen
    def _mit_messung(self, massnahme: Massnahme, arbeit) -> AktionsErgebnis:
        start = time.monotonic()
        try:
            meldung = arbeit()
            return AktionsErgebnis(
                massnahme=massnahme, erfolg=True, meldung=meldung,
                dauer_s=time.monotonic() - start,
            )
        except Exception as fehler:
            bild = self._screenshot(
                f"{massnahme.aktion.value.lower()}-{massnahme.personalnummer}"
            )
            LOG.error(
                "%s fuer %s / %s fehlgeschlagen: %s",
                massnahme.aktion.value, massnahme.personalnummer, massnahme.regelwerk, fehler,
            )
            return AktionsErgebnis(
                massnahme=massnahme, erfolg=False, meldung=str(fehler)[:400],
                dauer_s=time.monotonic() - start, screenshot=bild,
            )

    def anlegen(self, massnahme: Massnahme) -> AktionsErgebnis:
        def arbeit() -> str:
            if not massnahme.email:
                raise PortalFehler("Ohne E-Mail-Adresse kann kein Zugang angelegt werden.")

            self.seite.goto(self._url(self.sel.pfad_benutzer_neu), wait_until="domcontentloaded")
            if not self._sichtbar(self.sel.feld_neu_email):
                raise SelektorFehler("Formular 'Benutzer anlegen' nicht gefunden.")

            self.seite.fill(self.sel.feld_neu_personalnummer, massnahme.personalnummer)
            self.seite.fill(self.sel.feld_neu_email, massnahme.email)
            if self.sel.feld_neu_name and massnahme.name:
                self.seite.fill(self.sel.feld_neu_name, massnahme.name)
            self._regelwerk_waehlen(massnahme.regelwerk)
            if self.sel.feld_gueltig_bis and massnahme.faellig_am:
                self.seite.fill(self.sel.feld_gueltig_bis, massnahme.faellig_am.isoformat())

            self.seite.click(self.sel.knopf_speichern)
            self._ruhe()
            if self.sel.marker_gespeichert and not self._sichtbar(self.sel.marker_gespeichert):
                raise PortalFehler("Portal hat das Speichern nicht bestaetigt.")

            self._pruefe_zustand(massnahme, soll_vorhanden=True)
            return f"Zugang {massnahme.regelwerk} fuer {massnahme.email} angelegt."

        return self._mit_messung(massnahme, arbeit)

    def entziehen(self, massnahme: Massnahme) -> AktionsErgebnis:
        def arbeit() -> str:
            zeile = self._finde_zeile(massnahme.personalnummer, massnahme.email)
            if zeile is None:
                return (
                    f"Kein Portal-Eintrag fuer {massnahme.personalnummer} gefunden - "
                    "nichts zu entziehen."
                )
            if self.sel.entzug_ueber_detailseite and self.sel.knopf_zeile_bearbeiten:
                zeile.query_selector(self.sel.knopf_zeile_bearbeiten).click()
                self._ruhe()

            knopf = self._fuelle(self.sel.knopf_regelwerk_entziehen, massnahme.regelwerk,
                                 massnahme.personalnummer, massnahme.email)
            if not self._sichtbar(knopf):
                raise SelektorFehler(
                    f"Kein Entzugsknopf fuer Regelwerk {massnahme.regelwerk} gefunden."
                )
            self.seite.click(knopf)

            if self.sel.knopf_bestaetigen and self._sichtbar(self.sel.knopf_bestaetigen, 4000):
                self.seite.click(self.sel.knopf_bestaetigen)
            self._ruhe()

            self._pruefe_zustand(massnahme, soll_vorhanden=False)
            return f"Zugang {massnahme.regelwerk} fuer {massnahme.personalnummer} entzogen."

        return self._mit_messung(massnahme, arbeit)

    def verlaengern(self, massnahme: Massnahme) -> AktionsErgebnis:
        def arbeit() -> str:
            if not self.sel.feld_gueltig_bis:
                raise PortalFehler(
                    "Kein Feld fuer die Gueltigkeit konfiguriert - Verlaengerung nicht "
                    "automatisierbar. Selektor 'feld_gueltig_bis' setzen."
                )
            zeile = self._finde_zeile(massnahme.personalnummer, massnahme.email)
            if zeile is None:
                raise PortalFehler(
                    f"Kein Portal-Eintrag fuer {massnahme.personalnummer} - nichts zu verlaengern."
                )
            if self.sel.knopf_zeile_bearbeiten:
                zeile.query_selector(self.sel.knopf_zeile_bearbeiten).click()
                self._ruhe()

            neues_ende = date(date.today().year + 1, 12, 31)
            self.seite.fill(self.sel.feld_gueltig_bis, neues_ende.isoformat())
            self.seite.click(self.sel.knopf_speichern)
            self._ruhe()
            if self.sel.marker_gespeichert and not self._sichtbar(self.sel.marker_gespeichert):
                raise PortalFehler("Portal hat das Speichern nicht bestaetigt.")
            return (
                f"Gueltigkeit fuer {massnahme.personalnummer} / {massnahme.regelwerk} "
                f"auf {neues_ende.strftime('%d.%m.%Y')} gesetzt."
            )

        return self._mit_messung(massnahme, arbeit)

    # ----------------------------------------------------------- Verifikation
    @staticmethod
    def _fuelle(vorlage: str, regelwerk: str = "", personalnummer: str = "", email: str = "") -> str:
        """Setzt {regelwerk}, {personalnummer} und {email} in eine Selektor-Vorlage ein."""
        return vorlage.format(regelwerk=regelwerk, personalnummer=personalnummer, email=email)

    def _regelwerk_waehlen(self, regelwerk: str) -> None:
        selektor = self._fuelle(self.sel.auswahl_regelwerk, regelwerk)
        element = self.seite.query_selector(selektor)
        if element is None:
            raise SelektorFehler(f"Regelwerk {regelwerk} ist im Portal nicht auswaehlbar.")
        marke = (element.get_attribute("type") or "").lower()
        if marke in ("checkbox", "radio"):
            element.check()
        elif element.evaluate("e => e.tagName.toLowerCase()") == "select":
            self.seite.select_option(selektor, label=regelwerk)
        else:
            element.click()

    def _finde_zeile(self, personalnummer: str, email: str = ""):
        self.seite.goto(self._url(self.sel.pfad_benutzerliste), wait_until="domcontentloaded")
        self._sichtbar(self.sel.tabelle_benutzer)
        for zeile in self.seite.query_selector_all(self.sel.zeile_benutzer):
            gefunden = normalisiere_schluessel(
                self._zellentext(zeile, self.sel.zelle_personalnummer)
            )
            if gefunden and gefunden == normalisiere_schluessel(personalnummer):
                return zeile
            if email and self._zellentext(zeile, self.sel.zelle_email).lower() == email.lower():
                return zeile
        return None

    def _pruefe_zustand(self, massnahme: Massnahme, soll_vorhanden: bool) -> None:
        """Liest den Zugang frisch aus dem Portal und vergleicht mit der Erwartung."""
        zeile = self._finde_zeile(massnahme.personalnummer, massnahme.email)
        vorhanden = False
        if zeile is not None:
            roh = self._zellentext(zeile, self.sel.zelle_regelwerke)
            vorhanden = normalisiere_regelwerk(massnahme.regelwerk) in [
                normalisiere_regelwerk(t) for t in re.split(r"[;,\n|]+", roh) if t.strip()
            ]
        if vorhanden != soll_vorhanden:
            erwartet = "vorhanden" if soll_vorhanden else "entfernt"
            raise PortalFehler(
                f"Nachkontrolle fehlgeschlagen: {massnahme.regelwerk} fuer "
                f"{massnahme.personalnummer} ist nicht {erwartet}."
            )


def _datum(text: str) -> date | None:
    from ..sharepoint import parse_datum

    return parse_datum(text)
