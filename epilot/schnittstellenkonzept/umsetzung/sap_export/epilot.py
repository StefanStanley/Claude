"""Zugriff auf die epilot Entity API.

Nur lesend plus das Zurückschreiben des Übertragungsstatus. Der Token ist ein
Access Token vom Typ 'api' mit read_only=false (wegen der Statusrückschreibung),
aber mit möglichst enger Rollenzuweisung.
"""
from __future__ import annotations

import logging
from typing import Iterator

import requests

from .config import Epilot

log = logging.getLogger(__name__)


class EpilotFehler(Exception):
    pass


class EntityAPI:
    def __init__(self, cfg: Epilot, token: str, session: requests.Session | None = None):
        if not token:
            raise EpilotFehler("Kein Access Token übergeben")
        self.cfg = cfg
        self.http = session or requests.Session()
        self.http.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        })
        if cfg.org_id:
            self.http.headers["x-epilot-org-id"] = cfg.org_id

    # ------------------------------------------------------------------ lesen
    def suche(self) -> Iterator[dict]:
        """Alle fälligen Vorgänge holen, seitenweise.

        Paging über search_after statt from/size: 'from' bricht bei tiefen
        Ergebnismengen ab und liefert bei gleichzeitigen Änderungen inkonsistente
        Seiten. Sortiert wird stabil über _created_at, damit die Reihenfolge
        zwischen den Seiten eindeutig ist.
        """
        such_nach = None
        gesehen = 0
        while True:
            rumpf = {
                "q": self.cfg.query,
                "size": self.cfg.seitengroesse,
                "hydrate": self.cfg.hydrate,
                "sort": "_created_at:asc",
            }
            if such_nach:
                rumpf["search_after"] = such_nach

            antwort = self.http.post(
                f"{self.cfg.basis_url}/v1/entity:search",
                json=rumpf, timeout=self.cfg.timeout,
            )
            if antwort.status_code != 200:
                raise EpilotFehler(
                    f"Suche fehlgeschlagen: HTTP {antwort.status_code} {antwort.text[:300]}"
                )
            daten = antwort.json()
            treffer = daten.get("results") or daten.get("hits") or []
            if not treffer:
                return

            for e in treffer:
                gesehen += 1
                yield e

            if len(treffer) < self.cfg.seitengroesse:
                return
            such_nach = treffer[-1].get("_sort") or treffer[-1].get("sort")
            if not such_nach:
                # Kein Sortiercursor in der Antwort: lieber sauber abbrechen als
                # in einer Endlosschleife dieselbe Seite immer wieder liefern.
                log.warning(
                    "Antwort enthält keinen search_after-Cursor - Lauf endet nach %d Vorgängen. "
                    "Falls mehr erwartet werden: Seitengröße erhöhen oder Paging prüfen.", gesehen
                )
                return

    # ---------------------------------------------------------------- schreiben
    def setze_status(self, entity_id: str, wert: str) -> None:
        """Übertragungsstatus am Vorgang setzen.

        Erst nach erfolgreicher Ablage der Datei aufrufen. Schlägt das hier fehl,
        wird der Vorgang im nächsten Lauf erneut geliefert - eine Dublette, die
        SAP über die Korrelations-ID abfangen muss. Das ist die bewusst gewählte
        Richtung: lieber doppelt als verloren.
        """
        antwort = self.http.patch(
            f"{self.cfg.basis_url}/v1/entity/{self.cfg.schema}/{entity_id}",
            json={self.cfg.status_attribut: wert},
            timeout=self.cfg.timeout,
        )
        if antwort.status_code not in (200, 204):
            raise EpilotFehler(
                f"Status für {entity_id} nicht gesetzt: HTTP {antwort.status_code} "
                f"{antwort.text[:200]}"
            )
