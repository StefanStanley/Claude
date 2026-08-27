"""Kernlogik: Soll-Ist-Abgleich der VDE-Regelwerkszugaenge.

Reines Python, keine Spark-/Netzwerk-Abhaengigkeit -> vollstaendig testbar.

Grundregel: Das Skript entscheidet nie ueber unklare Datenlagen hinweg.
Was nicht eindeutig zuordenbar ist, wird als PRUEFEN gemeldet und nicht
still entzogen.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Iterable, Sequence

from .modelle import (
    AbgleichErgebnis,
    Aktion,
    IstZugang,
    Massnahme,
    Mitarbeiter,
    Prioritaet,
    SollZugang,
)


def _index_mitarbeiter(mitarbeiter: Iterable[Mitarbeiter]) -> dict[str, Mitarbeiter]:
    index: dict[str, Mitarbeiter] = {}
    for person in mitarbeiter:
        if person.personalnummer:
            index[person.personalnummer] = person
    return index


def _de(wert: date) -> str:
    """Datum in der Schreibweise, die in der Aufgabenliste erwartet wird."""
    return wert.strftime("%d.%m.%Y")


def _tage_bis(ziel: date | None, stichtag: date) -> int | None:
    if ziel is None:
        return None
    return (ziel - stichtag).days


def _sortierschluessel(massnahme: Massnahme) -> tuple:
    # Faellige Aufgaben zuerst; Massnahmen ohne Datum ans Ende der Prioritaet.
    faellig = massnahme.faellig_am or date.max
    return (
        massnahme.prioritaet.rang,
        faellig,
        massnahme.name.lower(),
        massnahme.regelwerk,
        massnahme.aktion.value,
    )


def ermittle_massnahmen(
    mitarbeiter: Sequence[Mitarbeiter],
    soll: Sequence[SollZugang],
    ist: Sequence[IstZugang],
    stichtag: date | None = None,
    vorlauf_tage: int = 30,
) -> AbgleichErgebnis:
    """Vergleicht Soll (SharePoint) mit Ist (VDE-Portal-Bestand).

    Args:
        mitarbeiter: Stammdaten inkl. Austrittsdatum und Status.
        soll: Gewuenschte Zugaenge je Mitarbeiter und Regelwerk.
        ist: Tatsaechlich eingerichtete Zugaenge.
        stichtag: Bezugsdatum (Default: heute).
        vorlauf_tage: Wie viele Tage im Voraus auf Austritt/Ablauf hingewiesen wird.

    Returns:
        AbgleichErgebnis mit priorisierten Massnahmen und Datenqualitaets-Warnungen.
    """
    stichtag = stichtag or date.today()
    personen = _index_mitarbeiter(mitarbeiter)
    warnungen: list[str] = []

    soll_index: dict[tuple[str, str], SollZugang] = {}
    for eintrag in soll:
        if not eintrag.personalnummer or not eintrag.regelwerk:
            warnungen.append(
                f"Soll-Eintrag ohne Personalnummer oder Regelwerk uebersprungen: {eintrag}"
            )
            continue
        if eintrag.personalnummer not in personen:
            warnungen.append(
                f"Soll-Eintrag fuer unbekannte Personalnummer {eintrag.personalnummer} "
                f"(Regelwerk {eintrag.regelwerk}) - Stammdatensatz fehlt in der Liste."
            )
            continue
        # Doppelzeilen in SharePoint: laengste Gueltigkeit gewinnt.
        vorhanden = soll_index.get(eintrag.schluessel)
        if vorhanden is None or _ist_spaeter(eintrag.gueltig_bis, vorhanden.gueltig_bis):
            soll_index[eintrag.schluessel] = eintrag

    ist_index: dict[tuple[str, str], IstZugang] = {}
    for eintrag in ist:
        if not eintrag.personalnummer or not eintrag.regelwerk:
            warnungen.append(f"Ist-Eintrag ohne Personalnummer oder Regelwerk: {eintrag}")
            continue
        ist_index[eintrag.schluessel] = eintrag

    massnahmen: dict[tuple[str, str, str], Massnahme] = {}

    def merken(massnahme: Massnahme) -> None:
        vorhanden = massnahmen.get(massnahme.schluessel)
        if vorhanden is None or massnahme.prioritaet.rang < vorhanden.prioritaet.rang:
            massnahmen[massnahme.schluessel] = massnahme

    # --- 1. Bestehende Zugaenge pruefen (Offboarding, Ablauf, Entzug) ---
    for schluessel, zugang in ist_index.items():
        person = personen.get(zugang.personalnummer)

        if person is None:
            merken(
                Massnahme(
                    aktion=Aktion.PRUEFEN,
                    personalnummer=zugang.personalnummer,
                    name=zugang.email or zugang.vde_benutzer or "unbekannt",
                    email=zugang.email,
                    regelwerk=zugang.regelwerk,
                    prioritaet=Prioritaet.HOCH,
                    faellig_am=stichtag,
                    vde_benutzer=zugang.vde_benutzer,
                    begruendung=(
                        "Verwaister Zugang: zur Personalnummer existiert kein "
                        "Stammdatensatz in der SharePoint-Liste. Bitte manuell klaeren "
                        "(nicht automatisch entzogen)."
                    ),
                )
            )
            continue

        # 1a. Offboarding - bereits ausgeschieden
        if person.ist_ausgeschieden(stichtag):
            grund = (
                f"Mitarbeiter ausgeschieden zum {_de(person.austritt)}"
                if person.austritt
                else "Mitarbeiter in der Liste als inaktiv gefuehrt"
            )
            merken(
                _massnahme(
                    Aktion.ENTZIEHEN, person, zugang.regelwerk, Prioritaet.HOCH,
                    person.austritt or stichtag, f"{grund}. Zugang sofort entziehen.",
                    zugang.vde_benutzer,
                )
            )
            continue

        # 1b. Offboarding - Austritt steht bevor
        tage_bis_austritt = _tage_bis(person.austritt, stichtag)
        if tage_bis_austritt is not None and 0 < tage_bis_austritt <= vorlauf_tage:
            merken(
                _massnahme(
                    Aktion.ENTZIEHEN, person, zugang.regelwerk, Prioritaet.MITTEL,
                    person.austritt,
                    f"Austritt in {tage_bis_austritt} Tagen "
                    f"({_de(person.austritt)}). Entzug terminieren.",
                    zugang.vde_benutzer,
                )
            )
            continue

        soll_eintrag = soll_index.get(schluessel)

        # 1c. Zugang nicht mehr im Soll (z.B. Abteilungs-/Rollenwechsel)
        if soll_eintrag is None:
            merken(
                _massnahme(
                    Aktion.ENTZIEHEN, person, zugang.regelwerk, Prioritaet.MITTEL,
                    stichtag,
                    "Zugang steht nicht mehr in der SharePoint-Liste "
                    "(Rollen-/Abteilungswechsel oder Bedarf entfallen).",
                    zugang.vde_benutzer,
                )
            )
            continue

        # 1d. Ablauf der Lizenz/Gueltigkeit
        ablauf = soll_eintrag.gueltig_bis or zugang.gueltig_bis
        tage_bis_ablauf = _tage_bis(ablauf, stichtag)
        if tage_bis_ablauf is not None:
            if tage_bis_ablauf < 0:
                merken(
                    _massnahme(
                        Aktion.VERLAENGERN, person, zugang.regelwerk, Prioritaet.HOCH,
                        ablauf,
                        f"Zugang seit {abs(tage_bis_ablauf)} Tagen abgelaufen "
                        f"({_de(ablauf)}).",
                        zugang.vde_benutzer,
                    )
                )
            elif tage_bis_ablauf <= vorlauf_tage:
                merken(
                    _massnahme(
                        Aktion.VERLAENGERN, person, zugang.regelwerk, Prioritaet.MITTEL,
                        ablauf,
                        f"Zugang laeuft in {tage_bis_ablauf} Tagen ab "
                        f"({_de(ablauf)}).",
                        zugang.vde_benutzer,
                    )
                )

    # --- 2. Fehlende Zugaenge anlegen ---
    for schluessel, eintrag in soll_index.items():
        if schluessel in ist_index:
            continue
        person = personen[eintrag.personalnummer]

        if person.ist_ausgeschieden(stichtag):
            warnungen.append(
                f"{person.name} ({person.personalnummer}) ist ausgeschieden, steht aber "
                f"noch mit Regelwerk {eintrag.regelwerk} im Soll. Zeile in SharePoint bereinigen."
            )
            continue

        if eintrag.gueltig_bis is not None and eintrag.gueltig_bis < stichtag:
            warnungen.append(
                f"Soll-Eintrag {person.personalnummer}/{eintrag.regelwerk} ist bereits "
                f"am {_de(eintrag.gueltig_bis)} abgelaufen - kein Neuanlegen."
            )
            continue

        if not person.email:
            warnungen.append(
                f"{person.name} ({person.personalnummer}) hat keine E-Mail-Adresse - "
                "Zugang kann beim VDE nicht angelegt werden."
            )

        merken(
            _massnahme(
                Aktion.ANLEGEN, person, eintrag.regelwerk, Prioritaet.HOCH,
                stichtag,
                eintrag.begruendung or "Neuer Zugang laut SharePoint-Liste erforderlich.",
            )
        )

    ergebnis = AbgleichErgebnis(
        stichtag=stichtag,
        massnahmen=sorted(massnahmen.values(), key=_sortierschluessel),
        anzahl_soll=len(soll_index),
        anzahl_ist=len(ist_index),
        warnungen=warnungen,
    )
    return ergebnis


def _massnahme(
    aktion: Aktion,
    person: Mitarbeiter,
    regelwerk: str,
    prioritaet: Prioritaet,
    faellig_am: date | None,
    begruendung: str,
    vde_benutzer: str = "",
) -> Massnahme:
    return Massnahme(
        aktion=aktion,
        personalnummer=person.personalnummer,
        name=person.name,
        email=person.email,
        regelwerk=regelwerk,
        prioritaet=prioritaet,
        faellig_am=faellig_am,
        begruendung=begruendung,
        abteilung=person.abteilung,
        vde_benutzer=vde_benutzer,
    )


def _ist_spaeter(a: date | None, b: date | None) -> bool:
    """True, wenn a die 'grosszuegigere' Gueltigkeit ist (None = unbefristet)."""
    if a is None:
        return True
    if b is None:
        return False
    return a > b


def wende_massnahmen_an(
    ist: Sequence[IstZugang],
    massnahmen: Sequence[Massnahme],
    stichtag: date,
) -> list[IstZugang]:
    """Fuehrt den Bestand fort, wenn die Massnahmen erledigt wurden.

    Wird nur genutzt, wenn der Lauf mit `auto_bestaetigen=True` konfiguriert ist
    oder Massnahmen nachtraeglich als erledigt gemeldet werden. PRUEFEN-Massnahmen
    veraendern den Bestand nie.
    """
    bestand = {z.schluessel: z for z in ist}
    for massnahme in massnahmen:
        schluessel = (massnahme.personalnummer, massnahme.regelwerk)
        if massnahme.aktion is Aktion.ANLEGEN:
            bestand[schluessel] = IstZugang(
                personalnummer=massnahme.personalnummer,
                regelwerk=massnahme.regelwerk,
                angelegt_am=stichtag,
                gueltig_bis=None,
                email=massnahme.email,
            )
        elif massnahme.aktion is Aktion.ENTZIEHEN:
            bestand.pop(schluessel, None)
        elif massnahme.aktion is Aktion.VERLAENGERN:
            vorhanden = bestand.get(schluessel)
            if vorhanden is not None:
                bestand[schluessel] = IstZugang(
                    personalnummer=vorhanden.personalnummer,
                    regelwerk=vorhanden.regelwerk,
                    angelegt_am=vorhanden.angelegt_am,
                    gueltig_bis=stichtag + timedelta(days=365),
                    vde_benutzer=vorhanden.vde_benutzer,
                    email=vorhanden.email,
                )
    return sorted(bestand.values(), key=lambda z: z.schluessel)
