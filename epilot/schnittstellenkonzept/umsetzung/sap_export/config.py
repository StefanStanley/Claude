"""Konfiguration laden und prüfen.

Alles, was aus der Erhebung bei der Gegenseite kommt, steht in der Konfiguration -
nicht im Code. Wenn der Rücklauf Überraschungen bringt, ändert sich eine YAML-Datei,
kein Python.
"""
from __future__ import annotations

import codecs
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

# Zeilenenden, die eine Gegenseite verlangen kann
ZEILENENDEN = {"CRLF": "\r\n", "LF": "\n"}


class ConfigFehler(Exception):
    """Die Konfiguration ist unbrauchbar - der Lauf startet gar nicht erst."""


@dataclass
class Spalte:
    name: str                      # Spaltenname in der CSV
    quelle: str | None = None      # Pfad in der epilot-Entity, z.B. "address.0.postal_code"
    konstante: str | None = None   # fester Wert statt Quelle
    transform: list[dict] = field(default_factory=list)
    pflicht: bool = False
    max_laenge: int | None = None

    def __post_init__(self):
        if not self.quelle and self.konstante is None:
            raise ConfigFehler(f"Spalte '{self.name}': weder quelle noch konstante gesetzt")


@dataclass
class Format:
    kodierung: str = "utf-8"
    bom: bool = False
    trennzeichen: str = ";"
    textbegrenzer: str = '"'
    quoting: str = "minimal"       # minimal | all | keines
    doppelte_begrenzer: bool = True
    zeilenende: str = "CRLF"
    kopfzeile: bool = True
    dezimaltrennzeichen: str = ","
    leerwert: str = ""

    def __post_init__(self):
        try:
            codecs.lookup(self.kodierung)
        except LookupError as e:
            raise ConfigFehler(f"Unbekannte Kodierung '{self.kodierung}'") from e
        if self.zeilenende not in ZEILENENDEN:
            raise ConfigFehler(f"zeilenende muss CRLF oder LF sein, nicht '{self.zeilenende}'")
        if self.quoting not in ("minimal", "all", "keines"):
            raise ConfigFehler(f"quoting muss minimal, all oder keines sein, nicht '{self.quoting}'")
        if len(self.trennzeichen) != 1:
            raise ConfigFehler("trennzeichen muss genau ein Zeichen sein")

    @property
    def newline(self) -> str:
        return ZEILENENDEN[self.zeilenende]


@dataclass
class Ablage:
    verzeichnis: str
    dateiname: str                 # strftime-Muster, z.B. "EINSPEISER_%Y%m%d_%H%M%S.csv"
    temp_endung: str = ".tmp"
    leerlauf: str = "keine_datei"  # keine_datei | leere_datei_mit_kopf
    protokoll_verzeichnis: str | None = None

    def __post_init__(self):
        if self.leerlauf not in ("keine_datei", "leere_datei_mit_kopf"):
            raise ConfigFehler("leerlauf muss keine_datei oder leere_datei_mit_kopf sein")


@dataclass
class Epilot:
    basis_url: str = "https://entity.sls.epilot.io"
    schema: str = "netzanschluss_anfrage"
    query: str = '_schema:netzanschluss_anfrage AND uebertragungsstatus:bereit'
    seitengroesse: int = 500
    hydrate: bool = True
    status_attribut: str = "uebertragungsstatus"
    status_nach_uebertragung: str = "uebertragen"
    org_id: str | None = None      # nur bei mandantenübergreifendem Zugriff
    timeout: int = 60

    def __post_init__(self):
        if not 1 <= self.seitengroesse <= 1000:
            raise ConfigFehler("seitengroesse muss zwischen 1 und 1000 liegen (API-Grenze)")


@dataclass
class Config:
    format: Format
    ablage: Ablage
    epilot: Epilot
    spalten: list[Spalte]
    wertelisten: dict[str, dict[str, str]] = field(default_factory=dict)
    pruefungen: list[dict] = field(default_factory=list)
    bei_kodierungsfehler: str = "zeile_zurueckhalten"   # oder "lauf_abbrechen"

    @classmethod
    def laden(cls, pfad: str | Path) -> "Config":
        roh: dict[str, Any] = yaml.safe_load(Path(pfad).read_text(encoding="utf-8")) or {}
        fehlend = [k for k in ("format", "ablage", "epilot", "spalten") if k not in roh]
        if fehlend:
            raise ConfigFehler(f"Fehlende Abschnitte in der Konfiguration: {', '.join(fehlend)}")

        spalten = [Spalte(**s) for s in roh["spalten"]]
        if not spalten:
            raise ConfigFehler("Keine Spalten konfiguriert - die Erhebung ist noch nicht eingearbeitet")
        doppelt = {s.name for s in spalten if [x.name for x in spalten].count(s.name) > 1}
        if doppelt:
            raise ConfigFehler(f"Spaltenname mehrfach vergeben: {', '.join(sorted(doppelt))}")

        cfg = cls(
            format=Format(**roh["format"]),
            ablage=Ablage(**roh["ablage"]),
            epilot=Epilot(**roh["epilot"]),
            spalten=spalten,
            wertelisten=roh.get("wertelisten") or {},
            pruefungen=roh.get("pruefungen") or [],
            bei_kodierungsfehler=roh.get("bei_kodierungsfehler", "zeile_zurueckhalten"),
        )
        if cfg.bei_kodierungsfehler not in ("zeile_zurueckhalten", "lauf_abbrechen"):
            raise ConfigFehler("bei_kodierungsfehler muss zeile_zurueckhalten oder lauf_abbrechen sein")
        return cfg
