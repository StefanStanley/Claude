"""Persistenz des Ist-Bestands und der Massnahmen in Unity Catalog.

Weil das VDE-Portal keine API hat, fuehrt dieses Skript den Ist-Zustand
selbst als Delta-Tabelle mit:

* `bestand`     - welche Zugaenge im Portal eingerichtet sind
* `massnahmen`  - Protokoll je Lauf, damit nachvollziehbar bleibt,
                  was wann vorgeschlagen wurde

Der Bestand kann jederzeit aus einem CSV-Export des VDE-Portals neu
aufgesetzt werden (`importiere_portal_export`).
"""

from __future__ import annotations

import logging
from datetime import date
from typing import TYPE_CHECKING, Any, Sequence

from .modelle import IstZugang

if TYPE_CHECKING:  # nur fuer die Typannotation
    from .portal.ausfuehrung import Ausfuehrungsbericht

LOG = logging.getLogger(__name__)

BESTAND_DDL = """
CREATE TABLE IF NOT EXISTS {tabelle} (
    personalnummer STRING NOT NULL,
    regelwerk      STRING NOT NULL,
    email          STRING,
    vde_benutzer   STRING,
    angelegt_am    DATE,
    gueltig_bis    DATE,
    stand          TIMESTAMP
)
COMMENT 'Ist-Bestand der VDE-Regelwerkszugaenge (vom Job fortgeschrieben)'
"""

MASSNAHMEN_DDL = """
CREATE TABLE IF NOT EXISTS {tabelle} (
    lauf_id        STRING,
    stichtag       DATE,
    status         STRING,
    meldung        STRING,
    dauer_s        DOUBLE,
    screenshot     STRING,
    aktion         STRING,
    prioritaet     STRING,
    personalnummer STRING,
    name           STRING,
    email          STRING,
    abteilung      STRING,
    regelwerk      STRING,
    vde_benutzer   STRING,
    faellig_am     DATE,
    begruendung    STRING,
    dry_run        BOOLEAN,
    erstellt_am    TIMESTAMP
)
COMMENT 'Protokoll je Lauf: welche Massnahme wurde ausgefuehrt, mit welchem Ergebnis'
"""

# Spaltennamen, unter denen der Portal-Export die Werte liefern darf.
EXPORT_ALIASE = {
    "personalnummer": ("personalnummer", "pers_nr", "persnr", "mitarbeiternummer", "employee_id"),
    "regelwerk": ("regelwerk", "produkt", "lizenz", "norm", "regelwerkskuerzel"),
    "email": ("email", "e_mail", "e-mail", "mail", "benutzer_email"),
    "vde_benutzer": ("vde_benutzer", "benutzername", "login", "username", "kennung"),
    "angelegt_am": ("angelegt_am", "anlagedatum", "erstellt_am", "start"),
    "gueltig_bis": ("gueltig_bis", "gueltigbis", "ablaufdatum", "ende", "valid_to"),
}


def erstelle_tabellen(spark: Any, katalog: str, schema: str, bestand: str, massnahmen: str) -> None:
    spark.sql(f"CREATE SCHEMA IF NOT EXISTS {katalog}.{schema}")
    spark.sql(BESTAND_DDL.format(tabelle=bestand))
    spark.sql(MASSNAHMEN_DDL.format(tabelle=massnahmen))


def lade_bestand(spark: Any, tabelle: str) -> list[IstZugang]:
    zeilen = spark.table(tabelle).collect()
    return [
        IstZugang(
            personalnummer=z["personalnummer"],
            regelwerk=z["regelwerk"],
            angelegt_am=z["angelegt_am"],
            gueltig_bis=z["gueltig_bis"],
            vde_benutzer=z["vde_benutzer"] or "",
            email=z["email"] or "",
        )
        for z in zeilen
    ]


def schreibe_bestand(spark: Any, tabelle: str, bestand: Sequence[IstZugang]) -> None:
    """Ersetzt den Bestand vollstaendig (der Bestand ist klein und der Lauf idempotent)."""
    from pyspark.sql import functions as F  # lokaler Import: nur im Cluster verfuegbar

    daten = [
        (
            z.personalnummer,
            z.regelwerk,
            z.email or None,
            z.vde_benutzer or None,
            z.angelegt_am,
            z.gueltig_bis,
        )
        for z in bestand
    ]
    schema = (
        "personalnummer STRING, regelwerk STRING, email STRING, "
        "vde_benutzer STRING, angelegt_am DATE, gueltig_bis DATE"
    )
    df = spark.createDataFrame(daten, schema=schema).withColumn("stand", F.current_timestamp())
    df.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(tabelle)
    LOG.info("Bestand geschrieben: %s Zeilen in %s", len(daten), tabelle)


def protokolliere_lauf(
    spark: Any,
    tabelle: str,
    ausfuehrung: "Ausfuehrungsbericht",
    stichtag: date,
    lauf_id: str,
    dry_run: bool,
) -> None:
    """Schreibt fuer jede Massnahme fest, was tatsaechlich passiert ist.

    Das ist der Nachweis gegenueber Lizenzgeber und Revision: wer hat wann
    welchen Zugang bekommen oder verloren, und ob die Aktion geglueckt ist.
    """
    if not ausfuehrung.ergebnisse:
        return
    from pyspark.sql import functions as F

    daten = []
    for e in ausfuehrung.ergebnisse:
        m = e.massnahme
        daten.append(
            (
                lauf_id, stichtag, e.status, e.meldung[:2000] or None,
                float(e.dauer_s), e.screenshot or None,
                m.aktion.value, m.prioritaet.value, m.personalnummer, m.name,
                m.email or None, m.abteilung or None, m.regelwerk,
                m.vde_benutzer or None, m.faellig_am, m.begruendung, dry_run,
            )
        )
    schema = (
        "lauf_id STRING, stichtag DATE, status STRING, meldung STRING, dauer_s DOUBLE, "
        "screenshot STRING, aktion STRING, prioritaet STRING, personalnummer STRING, "
        "name STRING, email STRING, abteilung STRING, regelwerk STRING, vde_benutzer STRING, "
        "faellig_am DATE, begruendung STRING, dry_run BOOLEAN"
    )
    df = spark.createDataFrame(daten, schema=schema).withColumn(
        "erstellt_am", F.current_timestamp()
    )
    df.write.mode("append").saveAsTable(tabelle)
    LOG.info("%s Massnahmen protokolliert (Lauf %s)", len(daten), lauf_id)


def _spalte(vorhandene: dict[str, str], feld: str) -> str | None:
    for alias in EXPORT_ALIASE[feld]:
        if alias in vorhandene:
            return vorhandene[alias]
    return None


def lese_portal_export(spark: Any, pfad: str, trennzeichen: str = ";") -> list[IstZugang]:
    """Liest einen CSV-Export aus dem VDE-Portal (z.B. aus einem UC-Volume).

    Spaltennamen werden tolerant zugeordnet (siehe EXPORT_ALIASE), damit der
    Export nicht vor jedem Import von Hand umbenannt werden muss.
    """
    from .sharepoint import parse_datum

    df = (
        spark.read.option("header", "true")
        .option("sep", trennzeichen)
        .option("inferSchema", "false")
        .csv(pfad)
    )
    vorhandene = {name.strip().lower().replace(" ", "_"): name for name in df.columns}
    sp_personalnummer = _spalte(vorhandene, "personalnummer")
    sp_regelwerk = _spalte(vorhandene, "regelwerk")
    if not sp_personalnummer or not sp_regelwerk:
        raise ValueError(
            f"Portal-Export {pfad} braucht mindestens eine Personalnummer- und eine "
            f"Regelwerk-Spalte. Gefundene Spalten: {list(df.columns)}"
        )

    felder = {feld: _spalte(vorhandene, feld) for feld in EXPORT_ALIASE}
    ergebnis: list[IstZugang] = []
    for zeile in df.collect():
        def wert(feld: str) -> str:
            spalte = felder[feld]
            return (zeile[spalte] or "").strip() if spalte else ""

        if not wert("personalnummer") or not wert("regelwerk"):
            continue
        ergebnis.append(
            IstZugang(
                personalnummer=wert("personalnummer"),
                regelwerk=wert("regelwerk"),
                email=wert("email"),
                vde_benutzer=wert("vde_benutzer"),
                angelegt_am=parse_datum(wert("angelegt_am")),
                gueltig_bis=parse_datum(wert("gueltig_bis")),
            )
        )
    LOG.info("Portal-Export gelesen: %s Zugaenge aus %s", len(ergebnis), pfad)
    return ergebnis
