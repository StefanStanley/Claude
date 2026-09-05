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
    gelesen: int = 0
    geliefert: int = 0
    zurueckgehalten: int = 0
    status_fehler: list[str] = field(default_factory=list)
    klaerliste: list[dict] = field(default_factory=list)
    datei: str | None = None
    probelauf: bool = False

    def als_dict(self) -> dict:
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
    """Eintrag für die Klärliste - bewusst ohne personenbezogene Inhalte.

    Die Klärliste wird protokolliert und ggf. weitergereicht; sie braucht die
    Kennung des Vorgangs, nicht die Daten des Betreibers.
    """
    return {
        "entity_id": entity.get("_id"),
        "titel": entity.get("_title"),
        "gruende": gruende,
    }


def lauf(cfg: Config, token: str, probelauf: bool = False,
         api: EntityAPI | None = None) -> Ergebnis:
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
    if not cfg.ablage.protokoll_verzeichnis:
        return
    verzeichnis = Path(cfg.ablage.protokoll_verzeichnis)
    verzeichnis.mkdir(parents=True, exist_ok=True)
    pfad = verzeichnis / f"lauf_{datetime.now():%Y%m%d_%H%M%S}.json"
    pfad.write_text(json.dumps(erg.als_dict(), ensure_ascii=False, indent=2), encoding="utf-8")
    log.info("Protokoll: %s", pfad)


def main(argv=None) -> int:
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
