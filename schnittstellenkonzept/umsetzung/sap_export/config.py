"""Konfiguration laden und prüfen.

Alles, was aus der Erhebung bei der Gegenseite kommt, steht in der Konfiguration —
nicht im Code. Wenn der Rücklauf Überraschungen bringt, ändert sich eine YAML-Datei,
kein Python.

Die Prüfungen laufen beim Laden, nicht beim ersten Zugriff: Eine unbrauchbare
Konfiguration soll den Lauf gar nicht erst starten lassen, statt nach der halben
Ergebnismenge abzubrechen.
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
    """Die Konfiguration ist unbrauchbar — der Lauf startet gar nicht erst."""


@dataclass
class Spalte:
    """Eine Spalte der Zieldatei.

    Attributes:
        name: Spaltenname in der CSV, exakt wie ihn die Gegenseite erwartet.
        quelle: Punktpfad in der epilot-Entity, z. B. `address.0.postal_code`.
        konstante: Fester Wert statt einer Quelle; genau eines von beiden ist gesetzt.
        transform: Kette von Transformationsschritten, siehe `mapping.TRANSFORMATIONEN`.
        pflicht: Ist der Wert leer, geht der Vorgang in die Klärliste.
        max_laenge: Überlänge ist ein Fehler, kein stiller Zuschnitt.
    """

    name: str
    quelle: str | None = None
    konstante: str | None = None
    transform: list[dict] = field(default_factory=list)
    pflicht: bool = False
    max_laenge: int | None = None

    def __post_init__(self) -> None:
        """Prüft, dass die Spalte überhaupt einen Wert liefern kann.

        Raises:
            ConfigFehler: Weder `quelle` noch `konstante` gesetzt.
        """
        if not self.quelle and self.konstante is None:
            raise ConfigFehler(f"Spalte '{self.name}': weder quelle noch konstante gesetzt")


@dataclass
class Format:
    """Byte-Format der Zieldatei.

    Die Vorgaben hier entscheiden darüber, ob SAP die Datei annimmt. Sie gehören aus
    einer produktiven Originaldatei abgelesen, nicht geschätzt.

    Attributes:
        kodierung: Python-Name der Zeichenkodierung, z. B. `cp1252` für Windows-1252.
        bom: Byte Order Mark voranstellen; nur bei UTF-8 vorgesehen.
        trennzeichen: Genau ein Zeichen.
        textbegrenzer: Anführungszeichen um Felder, üblicherweise `"`.
        quoting: `minimal`, `all` oder `keines`.
        doppelte_begrenzer: Begrenzer im Wert verdoppeln statt mit Fluchtzeichen maskieren.
        zeilenende: `CRLF` oder `LF`.
        kopfzeile: Spaltennamen als erste Zeile ausgeben.
        dezimaltrennzeichen: Für die Transformation `dezimal`.
        leerwert: Was in einer Zelle steht, wenn kein Wert vorliegt.
    """

    kodierung: str = "utf-8"
    bom: bool = False
    trennzeichen: str = ";"
    textbegrenzer: str = '"'
    quoting: str = "minimal"
    doppelte_begrenzer: bool = True
    zeilenende: str = "CRLF"
    kopfzeile: bool = True
    dezimaltrennzeichen: str = ","
    leerwert: str = ""

    def __post_init__(self) -> None:
        """Prüft die Formatangaben gegen das, was der CSV-Schreiber umsetzen kann.

        Raises:
            ConfigFehler: Unbekannte Kodierung oder unzulässiger Wert.
        """
        try:
            codecs.lookup(self.kodierung)
        except LookupError as e:
            raise ConfigFehler(f"Unbekannte Kodierung '{self.kodierung}'") from e
        if self.zeilenende not in ZEILENENDEN:
            raise ConfigFehler(f"zeilenende muss CRLF oder LF sein, nicht '{self.zeilenende}'")
        if self.quoting not in ("minimal", "all", "keines"):
            raise ConfigFehler(
                f"quoting muss minimal, all oder keines sein, nicht '{self.quoting}'"
            )
        if len(self.trennzeichen) != 1:
            raise ConfigFehler("trennzeichen muss genau ein Zeichen sein")

    @property
    def newline(self) -> str:
        """Das konfigurierte Zeilenende als Zeichenkette."""
        return ZEILENENDEN[self.zeilenende]


@dataclass
class Ablage:
    """Wohin die Datei geschrieben wird und was bei einem Leerlauf geschieht.

    Attributes:
        verzeichnis: Zielverzeichnis, üblicherweise ein Netzlaufwerk.
        dateiname: strftime-Muster, z. B. `EINSPEISER_%Y%m%d_%H%M%S.csv`.
        temp_endung: Endung während des Schreibens; der Importjob darf sie nicht abholen.
        leerlauf: `keine_datei` oder `leere_datei_mit_kopf`.
        protokoll_verzeichnis: Ablage der Laufprotokolle; `None` schaltet sie ab.
    """

    verzeichnis: str
    dateiname: str
    temp_endung: str = ".tmp"
    leerlauf: str = "keine_datei"
    protokoll_verzeichnis: str | None = None

    def __post_init__(self) -> None:
        """Prüft die Leerlaufregel.

        Raises:
            ConfigFehler: `leerlauf` trägt einen unbekannten Wert.
        """
        if self.leerlauf not in ("keine_datei", "leere_datei_mit_kopf"):
            raise ConfigFehler("leerlauf muss keine_datei oder leere_datei_mit_kopf sein")


@dataclass
class Epilot:
    """Zugriff auf die epilot Entity API.

    Attributes:
        basis_url: Dienst-URL der Entity API.
        schema: Slug des Entity-Schemas, das exportiert wird.
        query: Suchausdruck für die fälligen Vorgänge.
        seitengroesse: Treffer je Seite; die API begrenzt auf 1000.
        hydrate: Verknüpfte Entitäten mitliefern lassen.
        status_attribut: Attribut, in dem der Übertragungsstand steht.
        status_nach_uebertragung: Wert, der nach erfolgreicher Ablage gesetzt wird.
        org_id: Nur bei mandantenübergreifendem Zugriff nötig.
        timeout: Sekunden je HTTP-Aufruf.
    """

    basis_url: str = "https://entity.sls.epilot.io"
    schema: str = "netzanschluss_anfrage"
    query: str = "_schema:netzanschluss_anfrage AND uebertragungsstatus:bereit"
    seitengroesse: int = 500
    hydrate: bool = True
    status_attribut: str = "uebertragungsstatus"
    status_nach_uebertragung: str = "uebertragen"
    org_id: str | None = None
    timeout: int = 60

    def __post_init__(self) -> None:
        """Prüft die Seitengröße gegen die API-Grenze.

        Raises:
            ConfigFehler: Seitengröße außerhalb von 1 bis 1000.
        """
        if not 1 <= self.seitengroesse <= 1000:
            raise ConfigFehler("seitengroesse muss zwischen 1 und 1000 liegen (API-Grenze)")


@dataclass
class Config:
    """Die vollständige Konfiguration eines Exportlaufs.

    Attributes:
        format: Byte-Format der Zieldatei.
        ablage: Zielverzeichnis und Dateiname.
        epilot: Zugriff auf die Entity API.
        spalten: Spalten der Zieldatei in verbindlicher Reihenfolge.
        wertelisten: Übersetzungstabellen, angesprochen über ihren Namen.
        pruefungen: Fachliche Regeln, siehe `pruefung.PRUEFUNGEN`.
        bei_kodierungsfehler: `zeile_zurueckhalten` oder `lauf_abbrechen`.
    """

    format: Format
    ablage: Ablage
    epilot: Epilot
    spalten: list[Spalte]
    wertelisten: dict[str, dict[str, str]] = field(default_factory=dict)
    pruefungen: list[dict] = field(default_factory=list)
    bei_kodierungsfehler: str = "zeile_zurueckhalten"

    @classmethod
    def laden(cls, pfad: str | Path) -> Config:
        """Konfiguration aus einer YAML-Datei lesen und vollständig prüfen.

        Args:
            pfad: Pfad zur YAML-Datei.

        Returns:
            Die geprüfte Konfiguration.

        Raises:
            ConfigFehler: Abschnitt fehlt, keine Spalten, doppelter Spaltenname oder
                ein unzulässiger Wert in einem der Abschnitte.
        """
        roh: dict[str, Any] = yaml.safe_load(Path(pfad).read_text(encoding="utf-8")) or {}
        fehlend = [k for k in ("format", "ablage", "epilot", "spalten") if k not in roh]
        if fehlend:
            raise ConfigFehler(f"Fehlende Abschnitte in der Konfiguration: {', '.join(fehlend)}")

        spalten = [Spalte(**s) for s in roh["spalten"]]
        if not spalten:
            raise ConfigFehler(
                "Keine Spalten konfiguriert — die Erhebung ist noch nicht eingearbeitet"
            )
        namen = [x.name for x in spalten]
        doppelt = {n for n in namen if namen.count(n) > 1}
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
            raise ConfigFehler(
                "bei_kodierungsfehler muss zeile_zurueckhalten oder lauf_abbrechen sein"
            )
        return cfg
