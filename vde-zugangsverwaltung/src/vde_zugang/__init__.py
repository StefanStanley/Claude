"""Automatisierte Verwaltung der VDE-Regelwerkszugaenge auf Databricks."""

from .konfiguration import LaufKonfig, MailKonfig, SharePointKonfig
from .modelle import Aktion, IstZugang, Massnahme, Mitarbeiter, Prioritaet, SollZugang

__all__ = [
    "LaufKonfig",
    "MailKonfig",
    "SharePointKonfig",
    "Aktion",
    "Prioritaet",
    "Mitarbeiter",
    "SollZugang",
    "IstZugang",
    "Massnahme",
]

__version__ = "1.0.0"
