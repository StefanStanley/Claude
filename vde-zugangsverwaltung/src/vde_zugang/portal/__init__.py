"""Anbindungen an das VDE-Portal."""

from .ausfuehrung import Ausfuehrungsbericht, Notbremse, fuehre_aus
from .basis import (
    AktionsErgebnis,
    AufgabenlistenAdapter,
    PortalAdapter,
    Portalbenutzer,
    PortalFehler,
    SelektorFehler,
)
from .selektoren import PortalZugang, Selektoren

__all__ = [
    "PortalAdapter",
    "AufgabenlistenAdapter",
    "AktionsErgebnis",
    "Portalbenutzer",
    "PortalFehler",
    "SelektorFehler",
    "Selektoren",
    "PortalZugang",
    "Notbremse",
    "Ausfuehrungsbericht",
    "fuehre_aus",
    "erzeuge_adapter",
]


def erzeuge_adapter(modus: str, zugang=None, selektoren=None, bestand=None) -> PortalAdapter:
    """Waehlt die Portal-Anbindung anhand des konfigurierten Modus."""
    if modus == "browser":
        from .normenbibliothek import NormenbibliothekAdapter

        if zugang is None or selektoren is None:
            raise ValueError("Der Browser-Modus braucht Zugangsdaten und Selektoren.")
        return NormenbibliothekAdapter(zugang, selektoren)
    if modus == "aufgabenliste":
        return AufgabenlistenAdapter(bestand)
    raise ValueError(f"Unbekannter Portal-Modus: {modus!r} (erlaubt: browser, aufgabenliste)")
