"""Datenmodelle fuer den VDE-Regelwerks-Zugangsabgleich.

Bewusst reines Python (keine Spark-Abhaengigkeit), damit die Fachlogik
lokal testbar bleibt und im Notebook nur noch verdrahtet wird.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from enum import Enum


def normalisiere_schluessel(wert: str | None) -> str:
    """Vereinheitlicht Personalnummern (Leerzeichen weg, Grossschreibung)."""
    if wert is None:
        return ""
    return "".join(str(wert).split()).upper()


def normalisiere_regelwerk(wert: str | None) -> str:
    """Vereinheitlicht Regelwerkskuerzel.

    SharePoint-Listen sind erfahrungsgemaess uneinheitlich gepflegt
    ("vde ar n 4100", "VDE_AR-N-4100", " VDE-AR-N-4100 "). Ohne
    Normalisierung entstehen Phantom-Differenzen im Abgleich.
    """
    if wert is None:
        return ""
    text = re.sub(r"[\s_]+", "-", str(wert).strip())
    text = re.sub(r"-{2,}", "-", text)
    return text.strip("-").upper()


def normalisiere_email(wert: str | None) -> str:
    if wert is None:
        return ""
    return str(wert).strip().lower()


class Aktion(str, Enum):
    ANLEGEN = "ANLEGEN"
    ENTZIEHEN = "ENTZIEHEN"
    VERLAENGERN = "VERLAENGERN"
    PRUEFEN = "PRUEFEN"


class Prioritaet(str, Enum):
    HOCH = "HOCH"
    MITTEL = "MITTEL"
    NIEDRIG = "NIEDRIG"

    @property
    def rang(self) -> int:
        return {"HOCH": 0, "MITTEL": 1, "NIEDRIG": 2}[self.value]


@dataclass(frozen=True)
class Mitarbeiter:
    personalnummer: str
    name: str
    email: str
    abteilung: str = ""
    aktiv: bool = True
    austritt: date | None = None
    kostenstelle: str = ""

    def __post_init__(self) -> None:
        object.__setattr__(self, "personalnummer", normalisiere_schluessel(self.personalnummer))
        object.__setattr__(self, "email", normalisiere_email(self.email))

    def ist_ausgeschieden(self, stichtag: date) -> bool:
        """Ausgeschieden = Status inaktiv ODER Austrittsdatum erreicht."""
        if not self.aktiv:
            return True
        return self.austritt is not None and self.austritt <= stichtag


@dataclass(frozen=True)
class SollZugang:
    """Ein Zugang, den ein Mitarbeiter laut SharePoint-Liste haben soll."""

    personalnummer: str
    regelwerk: str
    gueltig_bis: date | None = None
    begruendung: str = ""

    def __post_init__(self) -> None:
        object.__setattr__(self, "personalnummer", normalisiere_schluessel(self.personalnummer))
        object.__setattr__(self, "regelwerk", normalisiere_regelwerk(self.regelwerk))

    @property
    def schluessel(self) -> tuple[str, str]:
        return (self.personalnummer, self.regelwerk)


@dataclass(frozen=True)
class IstZugang:
    """Ein Zugang, der im VDE-Portal tatsaechlich eingerichtet ist."""

    personalnummer: str
    regelwerk: str
    angelegt_am: date | None = None
    gueltig_bis: date | None = None
    vde_benutzer: str = ""
    email: str = ""

    def __post_init__(self) -> None:
        object.__setattr__(self, "personalnummer", normalisiere_schluessel(self.personalnummer))
        object.__setattr__(self, "regelwerk", normalisiere_regelwerk(self.regelwerk))
        object.__setattr__(self, "email", normalisiere_email(self.email))

    @property
    def schluessel(self) -> tuple[str, str]:
        return (self.personalnummer, self.regelwerk)


@dataclass(frozen=True)
class Massnahme:
    """Eine konkrete Aufgabe fuer den Zugangsverantwortlichen."""

    aktion: Aktion
    personalnummer: str
    name: str
    email: str
    regelwerk: str
    prioritaet: Prioritaet = Prioritaet.MITTEL
    faellig_am: date | None = None
    begruendung: str = ""
    abteilung: str = ""
    vde_benutzer: str = ""

    @property
    def schluessel(self) -> tuple[str, str, str]:
        return (self.aktion.value, self.personalnummer, self.regelwerk)

    def als_dict(self) -> dict:
        return {
            "aktion": self.aktion.value,
            "prioritaet": self.prioritaet.value,
            "personalnummer": self.personalnummer,
            "name": self.name,
            "email": self.email,
            "abteilung": self.abteilung,
            "regelwerk": self.regelwerk,
            "vde_benutzer": self.vde_benutzer,
            "faellig_am": self.faellig_am,
            "begruendung": self.begruendung,
        }


@dataclass
class AbgleichErgebnis:
    stichtag: date
    massnahmen: list[Massnahme] = field(default_factory=list)
    anzahl_soll: int = 0
    anzahl_ist: int = 0
    warnungen: list[str] = field(default_factory=list)

    def nach_aktion(self, aktion: Aktion) -> list[Massnahme]:
        return [m for m in self.massnahmen if m.aktion is aktion]

    @property
    def hat_aufgaben(self) -> bool:
        return bool(self.massnahmen)
