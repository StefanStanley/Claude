"""Orchestrierung eines kompletten Abgleichlaufs."""

from __future__ import annotations

import logging
import uuid
from contextlib import nullcontext
from dataclasses import dataclass, field
from datetime import date
from typing import Any

from . import bericht as bericht_modul
from . import bestand as bestand_modul
from . import mail as mail_modul
from .abgleich import ermittle_massnahmen
from .konfiguration import LaufKonfig, PortalKonfig
from .modelle import AbgleichErgebnis, IstZugang
from .portal import Notbremse, PortalAdapter, erzeuge_adapter, fuehre_aus
from .portal.ausfuehrung import Ausfuehrungsbericht
from .portal.selektoren import PortalZugang, Selektoren
from .sharepoint import lade_soll_zustand

LOG = logging.getLogger(__name__)


@dataclass
class LaufErgebnis:
    lauf_id: str
    abgleich: AbgleichErgebnis
    ausfuehrung: Ausfuehrungsbericht
    markdown: str
    html: str
    csv: str
    mail_status: str
    bestand_status: str
    portal_modus: str = "aufgabenliste"
    warnungen: list[str] = field(default_factory=list)


def baue_adapter(konfig: PortalKonfig, rueckfall_bestand: list[IstZugang]) -> PortalAdapter:
    """Erzeugt die Portal-Anbindung passend zum konfigurierten Modus."""
    if not konfig.fuehrt_aus:
        return erzeuge_adapter("aufgabenliste", bestand=rueckfall_bestand)

    selektoren = (
        Selektoren.aus_json(konfig.selektoren_pfad) if konfig.selektoren_pfad else Selektoren()
    )
    zugang = PortalZugang(
        basis_url=konfig.basis_url,
        benutzer=konfig.benutzer,
        passwort=konfig.passwort,
        sitzung_pfad=konfig.sitzung_pfad,
        chromium_pfad=konfig.chromium_pfad,
        langsam_ms=konfig.langsam_ms,
        screenshot_verzeichnis=konfig.screenshot_verzeichnis,
    )
    return erzeuge_adapter("browser", zugang=zugang, selektoren=selektoren)


def fuehre_abgleich_aus(spark: Any, konfig: LaufKonfig, stichtag: date | None = None) -> LaufErgebnis:
    """Kompletter Lauf: Soll lesen, Ist lesen, abgleichen, ausfuehren, melden."""
    if konfig.sharepoint is None:
        raise ValueError("SharePoint-Konfiguration fehlt.")

    stichtag = stichtag or date.today()
    lauf_id = str(uuid.uuid4())
    warnungen: list[str] = []
    LOG.info(
        "Starte Abgleich %s (Stichtag %s, Portal-Modus %s, dry_run=%s)",
        lauf_id, stichtag, konfig.portal.modus, konfig.dry_run,
    )

    bestand_modul.erstelle_tabellen(
        spark, konfig.katalog, konfig.schema, konfig.bestand_tabelle, konfig.massnahmen_tabelle
    )

    mitarbeiter, soll, sp_warnungen = lade_soll_zustand(konfig.sharepoint)
    warnungen += sp_warnungen

    # Rueckfall-Bestand: nur relevant, wenn das Portal nicht direkt gelesen wird.
    if not konfig.portal.fuehrt_aus and konfig.portal_export_pfad:
        letzter_bestand = bestand_modul.lese_portal_export(spark, konfig.portal_export_pfad)
    else:
        letzter_bestand = bestand_modul.lade_bestand(spark, konfig.bestand_tabelle)
    adapter = baue_adapter(konfig.portal, letzter_bestand)

    with adapter if konfig.portal.fuehrt_aus else nullcontext(adapter):
        ist = adapter.lese_bestand()
        if konfig.portal.fuehrt_aus:
            LOG.info("Ist-Zustand direkt aus dem Portal gelesen (%s Zugaenge)", len(ist))
        else:
            warnungen.append(
                "Portal-Modus 'aufgabenliste': Der Ist-Zustand stammt aus der Delta-Tabelle, "
                "nicht aus dem Portal. Aenderungen werden nur gemeldet, nicht ausgefuehrt."
            )

        ergebnis = ermittle_massnahmen(
            mitarbeiter=mitarbeiter, soll=soll, ist=ist,
            stichtag=stichtag, vorlauf_tage=konfig.vorlauf_tage,
        )
        ergebnis.warnungen = warnungen + ergebnis.warnungen

        ausfuehrung = fuehre_aus(
            adapter=adapter,
            massnahmen=ergebnis.massnahmen,
            bestandsgroesse=len(ist),
            dry_run=konfig.dry_run,
            notbremse=Notbremse(
                max_entzuege=konfig.portal.max_entzuege,
                max_aenderungen=konfig.portal.max_aenderungen,
                anteil_entzug_grenze=konfig.portal.anteil_entzug_grenze,
            ),
            versuche=konfig.portal.versuche,
        )

        # Nach dem Schreiben den Bestand frisch aus dem Portal ziehen: das ist der
        # einzige belastbare Nachweis, was jetzt wirklich eingerichtet ist.
        if konfig.portal.fuehrt_aus and not konfig.dry_run and ausfuehrung.erfolgreich:
            try:
                ist = adapter.lese_bestand()
            except Exception as fehler:
                LOG.warning("Nachlese des Portals fehlgeschlagen: %s", fehler)
                ergebnis.warnungen.append(f"Nachlese des Portalbestands fehlgeschlagen: {fehler}")

    markdown = bericht_modul.als_markdown(ergebnis, ausfuehrung)
    html = bericht_modul.als_html(ergebnis, ausfuehrung, dry_run=konfig.dry_run)
    csv_text = bericht_modul.als_csv(ergebnis.massnahmen, ausfuehrung)
    betreff = bericht_modul.betreff(ergebnis, konfig.mail.betreff_praefix, ausfuehrung)

    if konfig.dry_run:
        bestand_status = "Testlauf: weder Portal noch Tabellen wurden veraendert."
    else:
        bestand_modul.protokolliere_lauf(
            spark, konfig.massnahmen_tabelle, ausfuehrung, stichtag, lauf_id, konfig.dry_run
        )
        bestand_modul.schreibe_bestand(spark, konfig.bestand_tabelle, ist)
        bestand_status = (
            f"{len(ist)} Zugaenge als Bestand gesichert. {ausfuehrung.zusammenfassung()}"
        )

    mail_status = mail_modul.versende(
        mail_konfig=konfig.mail,
        sp_konfig=konfig.sharepoint,
        betreff=betreff,
        html=html,
        csv_text=csv_text,
        dry_run=konfig.dry_run,
        hat_aufgaben=ergebnis.hat_aufgaben,
    )

    LOG.info("Abgleich %s beendet: %s", lauf_id, ausfuehrung.zusammenfassung())
    return LaufErgebnis(
        lauf_id=lauf_id,
        abgleich=ergebnis,
        ausfuehrung=ausfuehrung,
        markdown=markdown,
        html=html,
        csv=csv_text,
        mail_status=mail_status,
        bestand_status=bestand_status,
        portal_modus=konfig.portal.modus,
        warnungen=ergebnis.warnungen,
    )
