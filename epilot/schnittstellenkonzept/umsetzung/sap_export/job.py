"""Ablauf des Exportlaufs.

    epilot abfragen -> prüfen -> abbilden -> Datei schreiben -> ablegen -> Status setzen

Der Lauf ist wiederholbar: Solange der Status nicht zurückgeschrieben ist, wird
derselbe Vorgang wieder eingesammelt. Nichts geht verloren, wenn der Job mitten
im Lauf abbricht.
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from .config import Config
from .csvschreiber import KodierungsFehler, baue_datei, lege_ab, pruefe_kodierbar, zeile_als_text
from .epilot import EntityAPI, EpilotFehler
from .mapping import zeile
from .pruefung import pruefe

log = logging.getLogger("sap_export")


@dataclass
class Ergebnis:
    """Was ein Lauf bewirkt hat — die Grundlage für Protokoll und Rückgabewert.

    Attributes:
        gelesen: Vorgänge, die die Suche geliefert hat.
        geliefert: Vorgänge, die in der Datei stehen.
        zurueckgehalten: Vorgänge in der Klärliste.
        status_fehler: Kennungen, die geliefert, aber nicht markiert werden konnten;
            sie kommen im nächsten Lauf erneut.
        klaerliste: Je Vorgang die Kennung und die Gründe — ohne Antragsinhalte.
        datei: Pfad der abgelegten Datei, `None` bei Leerlauf.
        probelauf: War der Lauf ein Probelauf ohne Ablage und ohne Statusschreiben?
    """

    gelesen: int = 0
    geliefert: int = 0
    zurueckgehalten: int = 0
    status_fehler: list[str] = field(default_factory=list)
    klaerliste: list[dict] = field(default_factory=list)
    datei: str | None = None
    probelauf: bool = False

    def als_dict(self) -> dict:
        """Ergebnis als JSON-fähiges Wörterbuch für das Laufprotokoll."""
        return {
            "zeitpunkt": datetime.now().isoformat(timespec="seconds"),
            "gelesen": self.gelesen,
            "geliefert": self.geliefert,
            "zurueckgehalten": self.zurueckgehalten,
            "status_fehler": self.status_fehler,
            "datei": self.datei,
            "probelauf": self.probelauf,
            "klaerliste": self.klaerliste,
        }


def _klaerfall(entity: dict, gruende: list[str]) -> dict:
    """Eintrag für die Klärliste — bewusst ohne personenbezogene Inhalte.

    Die Klärliste wird protokolliert und gegebenenfalls weitergereicht; sie braucht die
    Kennung des Vorgangs, nicht die Daten des Betreibers.

    Args:
        entity: Der zurückgehaltene Vorgang.
        gruende: Alle Befunde dieses Vorgangs.

    Returns:
        Eintrag aus Kennung, Titel und Gründen.
    """
    return {
        "entity_id": entity.get("_id"),
        "titel": entity.get("_title"),
        "gruende": gruende,
    }


def lauf(
    cfg: Config,
    token: str,
    probelauf: bool = False,
    api: EntityAPI | None = None,
) -> Ergebnis:
    """Einen vollständigen Exportlauf durchführen.

    Die Reihenfolge ist Absicht: Erst die Datei ablegen, dann den Status setzen. Bricht
    der Lauf dazwischen ab, entsteht eine Dublette — andersherum entstünde ein
    verlorener Vorgang.

    Args:
        cfg: Konfiguration des Laufs.
        token: Access Token für die Entity API.
        probelauf: Datei nur erzeugen, nichts ablegen und keinen Status schreiben.
        api: Vorbereiteter API-Zugriff; im Test der Ort für ein Double.

    Returns:
        Das Ergebnis des Laufs samt Klärliste.

    Raises:
        KodierungsFehler: Nur wenn `bei_kodierungsfehler` auf `lauf_abbrechen` steht.
        EpilotFehler: Die Suche ist fehlgeschlagen. Fehler beim Statusschreiben brechen
            den Lauf dagegen nicht ab, sondern landen in `status_fehler`.
    """
    erg = Ergebnis(probelauf=probelauf)
    api = api or EntityAPI(cfg.epilot, token)

    zeilen: list[list[str]] = []
    gelieferte_ids: list[str] = []

    for entity in api.suche():
        erg.gelesen += 1
        gruende = [f"{b.feld}: {b.text}" for b in pruefe(entity, cfg)]

        werte, mapping_fehler = zeile(entity, cfg)
        gruende.extend(mapping_fehler)

        # Kodierbarkeit vor dem Schreiben klären, nicht erst beim Speichern -
        # sonst reißt ein einzelner Vorgang den ganzen Lauf mit.
        if not gruende:
            try:
                pruefe_kodierbar(zeile_als_text(werte, cfg), cfg)
            except KodierungsFehler as e:
                if cfg.bei_kodierungsfehler == "lauf_abbrechen":
                    raise
                gruende.append(str(e))

        if gruende:
            erg.zurueckgehalten += 1
            erg.klaerliste.append(_klaerfall(entity, gruende))
            log.warning("Vorgang %s zurückgehalten: %s", entity.get("_id"), "; ".join(gruende))
            continue

        zeilen.append(werte)
        gelieferte_ids.append(entity.get("_id"))

    erg.geliefert = len(zeilen)

    if not zeilen and cfg.ablage.leerlauf == "keine_datei":
        log.info("Keine lieferbaren Vorgänge - es wird keine Datei erzeugt.")
        _protokolliere(cfg, erg)
        return erg

    inhalt = baue_datei(zeilen, cfg)
    jetzt = datetime.now()

    if probelauf:
        log.info("Probelauf: %d Zeilen, %d Bytes - es wird nichts abgelegt und "
                 "kein Status geschrieben.", len(zeilen), len(inhalt))
        erg.datei = "(Probelauf)"
        _protokolliere(cfg, erg)
        return erg

    ziel = lege_ab(inhalt, cfg, jetzt)
    erg.datei = str(ziel)
    log.info("Datei abgelegt: %s (%d Zeilen, %d Bytes)", ziel, len(zeilen), len(inhalt))

    # Erst jetzt den Status setzen. Andersherum wäre ein Vorgang bei einem
    # Abbruch als übertragen markiert, ohne je in einer Datei gestanden zu haben.
    for entity_id in gelieferte_ids:
        try:
            api.setze_status(entity_id, cfg.epilot.status_nach_uebertragung)
        except EpilotFehler as e:
            erg.status_fehler.append(entity_id)
            log.error("Status für %s nicht gesetzt: %s", entity_id, e)

    if erg.status_fehler:
        log.error(
            "%d Vorgänge sind geliefert, aber nicht als übertragen markiert. "
            "Sie kommen im nächsten Lauf erneut - SAP muss sie über die "
            "Korrelations-ID als Dublette abfangen. IDs: %s",
            len(erg.status_fehler), ", ".join(erg.status_fehler),
        )

    _protokolliere(cfg, erg)
    return erg


def _protokolliere(cfg: Config, erg: Ergebnis) -> None:
    """Laufprotokoll als JSON ablegen, falls ein Protokollverzeichnis konfiguriert ist."""
    if not cfg.ablage.protokoll_verzeichnis:
        return
    verzeichnis = Path(cfg.ablage.protokoll_verzeichnis)
    verzeichnis.mkdir(parents=True, exist_ok=True)
    pfad = verzeichnis / f"lauf_{datetime.now():%Y%m%d_%H%M%S}.json"
    pfad.write_text(json.dumps(erg.als_dict(), ensure_ascii=False, indent=2), encoding="utf-8")
    log.info("Protokoll: %s", pfad)


def main(argv: list[str] | None = None) -> int:
    """Einstiegspunkt für den Aufruf über die Kommandozeile.

    Args:
        argv: Argumente; `None` nimmt die der Kommandozeile.

    Returns:
        Rückgabewert für den Scheduler: 0 wenn alles glattlief, 1 wenn etwas
        Aufmerksamkeit braucht (Klärfälle oder nicht gesetzte Status), 2 wenn kein
        Token gesetzt ist.
    """
    p = argparse.ArgumentParser(description="Einspeiseanlagen aus epilot nach SAP exportieren")
    p.add_argument("--config", required=True, help="Pfad zur YAML-Konfiguration")
    p.add_argument("--probelauf", action="store_true",
                   help="Datei nur erzeugen, nichts ablegen und keinen Status schreiben")
    p.add_argument("--ausgabe", help="Im Probelauf: erzeugte Datei zusätzlich hierhin schreiben")
    p.add_argument("--leise", action="store_true")
    a = p.parse_args(argv)

    logging.basicConfig(
        level=logging.WARNING if a.leise else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(message)s",
    )

    token = os.environ.get("EPILOT_TOKEN", "")
    if not token:
        print("EPILOT_TOKEN ist nicht gesetzt.", file=sys.stderr)
        return 2

    cfg = Config.laden(a.config)

    if a.ausgabe and a.probelauf:
        # Für den Abnahmevergleich: erzeugte Datei zum Anschauen ablegen
        api = EntityAPI(cfg.epilot, token)
        zeilen = []
        for entity in api.suche():
            werte, fehler = zeile(entity, cfg)
            if not fehler and not pruefe(entity, cfg):
                zeilen.append(werte)
        Path(a.ausgabe).write_bytes(baue_datei(zeilen, cfg))
        print(f"Probedatei geschrieben: {a.ausgabe}")
        return 0

    erg = lauf(cfg, token, probelauf=a.probelauf)
    print(json.dumps(
        {k: v for k, v in erg.als_dict().items() if k != "klaerliste"},
        ensure_ascii=False,
    ))
    # Rückgabewert 1, wenn etwas Aufmerksamkeit braucht - für den Scheduler
    return 1 if (erg.zurueckgehalten or erg.status_fehler) else 0


if __name__ == "__main__":
    raise SystemExit(main())
