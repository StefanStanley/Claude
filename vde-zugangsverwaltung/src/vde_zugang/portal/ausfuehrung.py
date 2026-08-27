"""Kontrollierte Ausfuehrung der Massnahmen im Portal.

Eine Automatisierung, die Zugaenge entziehen kann, braucht Grenzen. Wenn die
SharePoint-Liste kaputt ist - leer geladen, Spalte umbenannt, Import halb
durchgelaufen - sieht der Abgleich das als "niemand braucht mehr etwas" und
wuerde reihenweise entziehen. Genau das verhindert die Notbremse hier.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Sequence

from ..modelle import Aktion, Massnahme
from .basis import AktionsErgebnis, PortalAdapter

LOG = logging.getLogger(__name__)

# Entziehen zuerst: gibt Lizenzen frei, die beim Anlegen im selben Lauf
# wiederverwendet werden koennen.
REIHENFOLGE = {Aktion.ENTZIEHEN: 0, Aktion.VERLAENGERN: 1, Aktion.ANLEGEN: 2, Aktion.PRUEFEN: 3}


@dataclass
class Notbremse:
    """Grenzen, ab denen der Lauf lieber gar nichts tut."""

    max_entzuege: int = 10
    max_aenderungen: int = 40
    anteil_entzug_grenze: float = 0.30   # Anteil des Bestands, der max. entzogen werden darf
    # Unterhalb dieser Bestandsgroesse greift die Prozentregel nicht: bei fuenf
    # Lizenzen sind zwei Entzuege 40 % und trotzdem voellig normal. Dort schuetzen
    # die absoluten Grenzen.
    mindestbestand_fuer_anteil: int = 20

    def pruefe(self, massnahmen: Sequence[Massnahme], bestandsgroesse: int) -> str | None:
        """Gibt den Grund zurueck, falls der Lauf gestoppt werden soll."""
        entzuege = sum(1 for m in massnahmen if m.aktion is Aktion.ENTZIEHEN)
        aenderungen = sum(1 for m in massnahmen if m.aktion is not Aktion.PRUEFEN)

        if entzuege > self.max_entzuege:
            return (
                f"{entzuege} Entzuege in einem Lauf (Grenze {self.max_entzuege}). "
                "Das deutet auf ein Datenproblem hin, nicht auf echte Personalbewegung."
            )
        if aenderungen > self.max_aenderungen:
            return f"{aenderungen} Aenderungen in einem Lauf (Grenze {self.max_aenderungen})."
        if (
            bestandsgroesse >= self.mindestbestand_fuer_anteil
            and entzuege / bestandsgroesse > self.anteil_entzug_grenze
        ):
            anteil = entzuege / bestandsgroesse
            return (
                f"{entzuege} von {bestandsgroesse} Zugaengen sollen entzogen werden "
                f"({anteil:.0%}, Grenze {self.anteil_entzug_grenze:.0%})."
            )
        return None


@dataclass
class Ausfuehrungsbericht:
    ergebnisse: list[AktionsErgebnis] = field(default_factory=list)
    abgebrochen: bool = False
    abbruchgrund: str = ""

    @property
    def erfolgreich(self) -> list[AktionsErgebnis]:
        return [e for e in self.ergebnisse if e.ausgefuehrt and e.erfolg]

    @property
    def fehlgeschlagen(self) -> list[AktionsErgebnis]:
        return [e for e in self.ergebnisse if e.ausgefuehrt and not e.erfolg]

    @property
    def uebersprungen(self) -> list[AktionsErgebnis]:
        return [e for e in self.ergebnisse if not e.ausgefuehrt]

    def zusammenfassung(self) -> str:
        if self.abgebrochen:
            return f"Abgebrochen: {self.abbruchgrund}"
        return (
            f"{len(self.erfolgreich)} erfolgreich, {len(self.fehlgeschlagen)} fehlgeschlagen, "
            f"{len(self.uebersprungen)} uebersprungen."
        )


def fuehre_aus(
    adapter: PortalAdapter,
    massnahmen: Sequence[Massnahme],
    bestandsgroesse: int,
    dry_run: bool = True,
    notbremse: Notbremse | None = None,
    versuche: int = 2,
) -> Ausfuehrungsbericht:
    """Arbeitet die Massnahmen im Portal ab.

    PRUEFEN-Massnahmen werden nie ausgefuehrt - unklare Datenlage bleibt
    Menschensache. Jede Aktion wird bei Fehlschlag einmal wiederholt, weil
    Oberflaechen gelegentlich langsam sind; ein zweiter Fehlschlag gilt als echt.
    """
    bericht = Ausfuehrungsbericht()
    notbremse = notbremse or Notbremse()

    grund = notbremse.pruefe(massnahmen, bestandsgroesse)
    if grund:
        LOG.error("Notbremse ausgeloest: %s", grund)
        bericht.abgebrochen = True
        bericht.abbruchgrund = grund
        bericht.ergebnisse = [
            AktionsErgebnis(m, erfolg=False, ausgefuehrt=False,
                            meldung=f"Nicht ausgefuehrt - Notbremse: {grund}")
            for m in massnahmen
        ]
        return bericht

    for massnahme in sorted(massnahmen, key=lambda m: (REIHENFOLGE[m.aktion], m.name.lower())):
        if massnahme.aktion is Aktion.PRUEFEN:
            bericht.ergebnisse.append(
                AktionsErgebnis(massnahme, erfolg=True, ausgefuehrt=False,
                                meldung="Pruefauftrag - bewusst nicht automatisiert.")
            )
            continue

        if dry_run or not adapter.kann_ausfuehren:
            grund_text = (
                "Testlauf - im Echtbetrieb wuerde diese Aktion ausgefuehrt."
                if dry_run
                else "Adapter fuehrt keine Aenderungen aus (nur Meldung)."
            )
            bericht.ergebnisse.append(
                AktionsErgebnis(massnahme, erfolg=True, ausgefuehrt=False, meldung=grund_text)
            )
            continue

        ergebnis = None
        for versuch in range(1, max(1, versuche) + 1):
            ergebnis = adapter.ausfuehren(massnahme)
            if ergebnis.erfolg:
                break
            LOG.warning(
                "Versuch %s/%s fuer %s %s fehlgeschlagen: %s",
                versuch, versuche, massnahme.aktion.value, massnahme.personalnummer,
                ergebnis.meldung,
            )
        bericht.ergebnisse.append(ergebnis)

    LOG.info("Ausfuehrung beendet: %s", bericht.zusammenfassung())
    return bericht
