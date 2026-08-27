"""Alle Ortsangaben zum Portal an einer Stelle.

Warum eine eigene Datei: Die Oberflaeche der VDE Normenbibliothek kann sich
mit jedem Release aendern. Wenn das passiert, wird hier korrigiert - nie in
der Ablauflogik.

Die ausgelieferten Werte sind PLATZHALTER. `pruefe()` verweigert den Start,
solange sie nicht durch die echten Selektoren ersetzt wurden - lieber ein
klarer Abbruch als ein Lauf, der stillschweigend nichts tut.

Ermitteln lassen sich die echten Werte mit:

    python3 scripts/selektoren_erkunden.py --url https://... --benutzer ...

Das Skript meldet sich an, laeuft die Seiten ab und schlaegt fuer jedes
benoetigte Element Kandidaten vor.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field, fields
from pathlib import Path

PLATZHALTER = "BITTE-AUSFUELLEN"


@dataclass
class Selektoren:
    """CSS-/Text-Selektoren und Unterseiten des Portals."""

    # --- Anmeldung ---
    pfad_login: str = "/login"
    feld_benutzer: str = PLATZHALTER
    feld_passwort: str = PLATZHALTER
    knopf_anmelden: str = PLATZHALTER
    marker_angemeldet: str = PLATZHALTER      # Element, das nur nach Login existiert
    marker_loginfehler: str = ""              # optional: Fehlermeldung des Portals

    # --- Benutzeruebersicht ---
    pfad_benutzerliste: str = "/admin/benutzer"
    tabelle_benutzer: str = PLATZHALTER
    zeile_benutzer: str = PLATZHALTER
    zelle_personalnummer: str = PLATZHALTER
    zelle_email: str = PLATZHALTER
    zelle_name: str = ""
    zelle_regelwerke: str = PLATZHALTER
    zelle_gueltig_bis: str = ""
    zelle_status: str = ""
    trennzeichen_regelwerke: str = ","
    knopf_naechste_seite: str = ""            # leer = keine Blaetterfunktion

    # --- Zugang anlegen ---
    pfad_benutzer_neu: str = "/admin/benutzer/neu"
    feld_neu_personalnummer: str = PLATZHALTER
    feld_neu_email: str = PLATZHALTER
    feld_neu_name: str = ""
    auswahl_regelwerk: str = PLATZHALTER   # Vorlage mit {regelwerk}
    feld_gueltig_bis: str = ""
    knopf_speichern: str = PLATZHALTER
    marker_gespeichert: str = ""              # Bestaetigung nach dem Speichern

    # --- Zugang entziehen / verlaengern ---
    knopf_zeile_bearbeiten: str = ""
    # True, wenn der Entzug erst nach dem Oeffnen der Detailseite moeglich ist.
    # False (Standard): der Entzugsknopf steht in der Zeile der Uebersicht.
    entzug_ueber_detailseite: bool = False
    # Vorlage - {regelwerk}, {personalnummer} und {email} werden eingesetzt.
    # Auf die Zeile eingrenzen, sonst trifft der Knopf die falsche Person:
    #   'tr[data-pnr="{personalnummer}"] button[data-regelwerk="{regelwerk}"]'
    knopf_regelwerk_entziehen: str = PLATZHALTER
    knopf_bestaetigen: str = ""               # Sicherheitsabfrage des Portals
    marker_entzogen: str = ""

    # --- Verhalten ---
    wartezeit_ms: int = 15000
    ruhe_nach_aktion_ms: int = 400

    def platzhalter(self) -> list[str]:
        """Namen aller Felder, die noch nicht ausgefuellt sind."""
        return [f.name for f in fields(self) if getattr(self, f.name) == PLATZHALTER]

    def pruefe(self) -> None:
        offen = self.platzhalter()
        if offen:
            raise ValueError(
                "Die Portal-Selektoren sind noch nicht eingerichtet. Offen: "
                + ", ".join(offen)
                + ".\nErmitteln mit: python3 scripts/selektoren_erkunden.py --url ... "
                "und Ergebnis als JSON hinterlegen (Widget 'selektoren_pfad')."
            )

    # --- Laden und Speichern ---
    @classmethod
    def aus_json(cls, pfad: str | Path) -> "Selektoren":
        daten = json.loads(Path(pfad).read_text(encoding="utf-8"))
        bekannt = {f.name for f in fields(cls)}
        unbekannt = set(daten) - bekannt
        if unbekannt:
            raise ValueError(f"Unbekannte Selektor-Felder in {pfad}: {sorted(unbekannt)}")
        return cls(**daten)

    def nach_json(self, pfad: str | Path) -> None:
        Path(pfad).write_text(
            json.dumps(asdict(self), indent=2, ensure_ascii=False), encoding="utf-8"
        )


@dataclass
class PortalZugang:
    """Zugangsdaten und Laufzeitverhalten der Browser-Automatisierung."""

    basis_url: str = ""
    benutzer: str = ""
    passwort: str = field(repr=False, default="")
    sitzung_pfad: str = ""              # optional: gespeicherter Anmeldezustand
    chromium_pfad: str = ""             # leer = von Playwright mitgeliefertes Chromium
    kopflos: bool = True
    langsam_ms: int = 0                 # >0 verlangsamt jede Aktion (Fehlersuche)
    screenshot_verzeichnis: str = ""    # Ablage fuer Fehler-Screenshots

    def pruefe(self) -> None:
        fehlt = [n for n in ("basis_url", "benutzer", "passwort") if not getattr(self, n)]
        if fehlt:
            raise ValueError(f"Portal-Zugangsdaten unvollstaendig: {', '.join(fehlt)}")
