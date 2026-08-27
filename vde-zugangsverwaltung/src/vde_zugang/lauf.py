"""Orchestrierung eines kompletten Abgleichlaufs."""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from datetime import date
from typing import Any

from . import bericht as bericht_modul
from . import bestand as bestand_modul
from . import mail as mail_modul
from .abgleich import ermittle_massnahmen, wende_massnahmen_an
from .konfiguration import LaufKonfig
from .modelle import AbgleichErgebnis
from .sharepoint import lade_soll_zustand

LOG = logging.getLogger(__name__)


@dataclass
class LaufErgebnis:
    lauf_id: str
    abgleich: AbgleichErgebnis
    markdown: str
    html: str
    csv: str
    mail_status: str
    bestand_status: str


def fuehre_abgleich_aus(spark: Any, konfig: LaufKonfig, stichtag: date | None = None) -> LaufErgebnis:
    """Kompletter Lauf: SharePoint lesen, abgleichen, protokollieren, melden."""
    if konfig.sharepoint is None:
        raise ValueError("SharePoint-Konfiguration fehlt.")

    stichtag = stichtag or date.today()
    lauf_id = str(uuid.uuid4())
    LOG.info("Starte Abgleich %s (Stichtag %s, dry_run=%s)", lauf_id, stichtag, konfig.dry_run)

    bestand_modul.erstelle_tabellen(
        spark, konfig.katalog, konfig.schema, konfig.bestand_tabelle, konfig.massnahmen_tabelle
    )

    mitarbeiter, soll, sp_warnungen = lade_soll_zustand(konfig.sharepoint)

    if konfig.portal_export_pfad:
        ist = bestand_modul.lese_portal_export(spark, konfig.portal_export_pfad)
        LOG.info("Ist-Zustand aus Portal-Export uebernommen (%s Zugaenge)", len(ist))
    else:
        ist = bestand_modul.lade_bestand(spark, konfig.bestand_tabelle)

    ergebnis = ermittle_massnahmen(
        mitarbeiter=mitarbeiter,
        soll=soll,
        ist=ist,
        stichtag=stichtag,
        vorlauf_tage=konfig.vorlauf_tage,
    )
    ergebnis.warnungen = sp_warnungen + ergebnis.warnungen

    markdown = bericht_modul.als_markdown(ergebnis)
    html = bericht_modul.als_html(ergebnis, dry_run=konfig.dry_run)
    csv_text = bericht_modul.als_csv(ergebnis.massnahmen)
    betreff = bericht_modul.betreff(ergebnis, konfig.mail.betreff_praefix)

    # --- Persistenz ---
    if konfig.dry_run:
        bestand_status = "TESTLAUF: Bestand und Protokoll unveraendert."
    else:
        bestand_modul.protokolliere_massnahmen(
            spark, konfig.massnahmen_tabelle, ergebnis.massnahmen, stichtag, lauf_id, konfig.dry_run
        )
        if konfig.portal_export_pfad:
            bestand_modul.schreibe_bestand(spark, konfig.bestand_tabelle, ist)
            bestand_status = (
                f"Bestand aus Portal-Export neu aufgesetzt ({len(ist)} Zugaenge). "
                "Massnahmen protokolliert."
            )
        elif konfig.auto_bestaetigen:
            neuer_bestand = wende_massnahmen_an(ist, ergebnis.massnahmen, stichtag)
            bestand_modul.schreibe_bestand(spark, konfig.bestand_tabelle, neuer_bestand)
            bestand_status = (
                f"Massnahmen als erledigt angenommen, Bestand fortgeschrieben "
                f"({len(neuer_bestand)} Zugaenge)."
            )
        else:
            bestand_status = (
                "Massnahmen protokolliert. Bestand bleibt unveraendert, bis die Aufgaben "
                "im VDE-Portal erledigt und bestaetigt sind."
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

    LOG.info("Abgleich %s beendet: %s Massnahmen", lauf_id, len(ergebnis.massnahmen))
    return LaufErgebnis(
        lauf_id=lauf_id,
        abgleich=ergebnis,
        markdown=markdown,
        html=html,
        csv=csv_text,
        mail_status=mail_status,
        bestand_status=bestand_status,
    )


def bestaetige_erledigte_massnahmen(
    spark: Any, konfig: LaufKonfig, lauf_id: str, stichtag: date | None = None
) -> int:
    """Uebernimmt die Massnahmen eines Laufs in den Bestand.

    Aufzurufen, nachdem die Aufgaben im VDE-Portal tatsaechlich umgesetzt
    wurden. PRUEFEN-Massnahmen bleiben unberuecksichtigt.
    """
    from .modelle import Aktion, Massnahme, Prioritaet

    stichtag = stichtag or date.today()
    from pyspark.sql import functions as F

    zeilen = (
        spark.table(konfig.massnahmen_tabelle)
        .where((F.col("lauf_id") == lauf_id) & (~F.col("dry_run")))
        .collect()
    )
    massnahmen = [
        Massnahme(
            aktion=Aktion(z["aktion"]),
            personalnummer=z["personalnummer"],
            name=z["name"],
            email=z["email"] or "",
            regelwerk=z["regelwerk"],
            prioritaet=Prioritaet(z["prioritaet"]),
            faellig_am=z["faellig_am"],
            begruendung=z["begruendung"] or "",
            vde_benutzer=z["vde_benutzer"] or "",
        )
        for z in zeilen
    ]
    ist = bestand_modul.lade_bestand(spark, konfig.bestand_tabelle)
    neuer_bestand = wende_massnahmen_an(ist, massnahmen, stichtag)
    bestand_modul.schreibe_bestand(spark, konfig.bestand_tabelle, neuer_bestand)
    return len(massnahmen)
