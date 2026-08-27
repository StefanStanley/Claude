"""Schnittstelle zum VDE-Portal.

Die Fachlogik kennt nur diese Schnittstelle. Ob dahinter ein Browser, eine
REST-API oder nur eine Aufgabenliste steckt, ist fuer den Abgleich egal.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date

from ..modelle import Aktion, IstZugang, Massnahme


class PortalFehler(RuntimeError):
    """Fehler bei der Kommunikation mit dem Portal."""


class SelektorFehler(PortalFehler):
    """Ein erwartetes Element war nicht auffindbar - das Portal hat sich geaendert."""


@dataclass
class AktionsErgebnis:
    massnahme: Massnahme
    erfolg: bool
    meldung: str
    ausgefuehrt: bool = True          # False = bewusst uebersprungen (Testlauf, Notbremse)
    dauer_s: float = 0.0
    screenshot: str = ""

    @property
    def status(self) -> str:
        if not self.ausgefuehrt:
            return "UEBERSPRUNGEN"
        return "ERFOLG" if self.erfolg else "FEHLER"

    def als_dict(self) -> dict:
        daten = self.massnahme.als_dict()
        daten.update(
            {
                "status": self.status,
                "meldung": self.meldung,
                "dauer_s": round(self.dauer_s, 2),
                "screenshot": self.screenshot,
            }
        )
        return daten


@dataclass
class Portalbenutzer:
    """Ein im Portal angelegter Benutzer mit seinen Regelwerken."""

    personalnummer: str
    email: str
    name: str = ""
    benutzername: str = ""
    aktiv: bool = True
    regelwerke: list[str] = field(default_factory=list)
    gueltig_bis: date | None = None


class PortalAdapter(ABC):
    """Basisklasse aller Portal-Anbindungen."""

    name = "abstrakt"
    kann_ausfuehren = False

    def __enter__(self) -> "PortalAdapter":
        try:
            self.oeffnen()
        except Exception:
            # Scheitert die Anmeldung, muss der Browser trotzdem weg - sonst
            # bleibt auf dem Cluster bei jedem Fehllauf ein Prozess zurueck.
            self.schliessen()
            raise
        return self

    def __exit__(self, *_) -> None:
        self.schliessen()

    def oeffnen(self) -> None:
        """Verbindung aufbauen, anmelden."""

    def schliessen(self) -> None:
        """Verbindung sauber beenden."""

    @abstractmethod
    def lese_bestand(self) -> list[IstZugang]:
        """Liest den tatsaechlichen Zugangsbestand."""

    def ausfuehren(self, massnahme: Massnahme) -> AktionsErgebnis:
        """Fuehrt eine einzelne Massnahme aus."""
        verteiler = {
            Aktion.ANLEGEN: self.anlegen,
            Aktion.ENTZIEHEN: self.entziehen,
            Aktion.VERLAENGERN: self.verlaengern,
        }
        funktion = verteiler.get(massnahme.aktion)
        if funktion is None:
            return AktionsErgebnis(
                massnahme=massnahme,
                erfolg=True,
                ausgefuehrt=False,
                meldung="Pruefauftrag - bewusst nicht automatisiert.",
            )
        return funktion(massnahme)

    @abstractmethod
    def anlegen(self, massnahme: Massnahme) -> AktionsErgebnis: ...

    @abstractmethod
    def entziehen(self, massnahme: Massnahme) -> AktionsErgebnis: ...

    @abstractmethod
    def verlaengern(self, massnahme: Massnahme) -> AktionsErgebnis: ...


class AufgabenlistenAdapter(PortalAdapter):
    """Fuehrt nichts aus, meldet nur.

    Faellt auf den selbst gefuehrten Delta-Bestand zurueck. Nuetzlich, solange
    die Browser-Automatisierung noch nicht eingerichtet ist, und als Rueckfall,
    wenn das Portal nicht erreichbar ist.
    """

    name = "aufgabenliste"
    kann_ausfuehren = False

    def __init__(self, bestand: list[IstZugang] | None = None):
        self._bestand = list(bestand or [])

    def lese_bestand(self) -> list[IstZugang]:
        return list(self._bestand)

    def _melden(self, massnahme: Massnahme) -> AktionsErgebnis:
        return AktionsErgebnis(
            massnahme=massnahme,
            erfolg=True,
            ausgefuehrt=False,
            meldung="Nur gemeldet - dieser Adapter fuehrt keine Aenderungen aus.",
        )

    anlegen = _melden
    entziehen = _melden
    verlaengern = _melden
