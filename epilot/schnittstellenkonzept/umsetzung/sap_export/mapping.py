"""Werte aus einer epilot-Entity holen und in das SAP-Format bringen.

Zwei Schritte je Zelle: den Wert über einen Punktpfad aus der Entity holen, dann eine
Kette von Transformationen darauf anwenden. Beides steht in der Konfiguration — hier
stehen nur die Bausteine.

Eine Transformation bekommt den Wert und ihre Argumente aus der Konfiguration und gibt
den umgewandelten Wert zurück. `None` bedeutet durchweg „kein Wert", nicht „Fehler";
ob ein leeres Feld zulässig ist, entscheidet die Pflichtangabe der Spalte.
"""
from __future__ import annotations

import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any

from .config import Config, Spalte


class MappingFehler(Exception):
    """Ein Wert lässt sich nicht abbilden — der Vorgang geht in die Klärliste."""


def hole(entity: dict, pfad: str) -> Any:
    """Wert über einen Punktpfad aus der Entity holen.

    Zahlen im Pfad sind Listenindizes: `address.0.postal_code` wird zu
    `entity["address"][0]["postal_code"]`.

    Fehlt ein Glied der Kette, ist das Ergebnis `None` — das ist kein Fehler, sondern
    ein leeres Feld. Ob es eines sein darf, entscheidet die Pflichtprüfung.

    Args:
        entity: Entity aus der epilot Entity API.
        pfad: Punktpfad, Listenindizes als Ziffern.

    Returns:
        Der gefundene Wert oder `None`, wenn der Pfad ins Leere läuft.
    """
    wert: Any = entity
    for teil in pfad.split("."):
        if wert is None:
            return None
        if teil.isdigit():
            if not isinstance(wert, list) or len(wert) <= int(teil):
                return None
            wert = wert[int(teil)]
        else:
            if not isinstance(wert, dict):
                return None
            wert = wert.get(teil)
    return wert


# --------------------------------------------------------------- Transformationen
# Jede Transformation nimmt den Wert als erstes Argument, ihre Konfiguration als
# Schlüsselwortargumente und schluckt den Rest über **_ — so kann die Konfiguration
# Argumente mitgeben, die nur andere Transformationen brauchen.


def _t_datum(wert: Any, muster: str = "%d.%m.%Y", **_: Any) -> str | None:
    """ISO-Datum aus epilot in das von SAP erwartete Muster bringen.

    Raises:
        MappingFehler: Der Wert ist als Datum nicht lesbar.
    """
    if wert in (None, ""):
        return None
    text = str(wert)
    if isinstance(wert, datetime | date):
        d = wert
    else:
        roh = text.replace("Z", "+00:00")
        try:
            d = datetime.fromisoformat(roh)
        except ValueError:
            try:
                d = datetime.strptime(text[:10], "%Y-%m-%d")
            except ValueError as e:
                raise MappingFehler(f"'{text}' ist kein lesbares Datum") from e
    return d.strftime(muster)


def _t_dezimal(wert: Any, stellen: int = 2, trennzeichen: str = ",", **_: Any) -> str | None:
    """Zahl mit fester Stellenzahl und dem geforderten Dezimaltrennzeichen ausgeben.

    Raises:
        MappingFehler: Der Wert ist keine Zahl.
    """
    if wert in (None, ""):
        return None
    try:
        z = Decimal(str(wert).replace(",", "."))
    except InvalidOperation as e:
        raise MappingFehler(f"'{wert}' ist keine Zahl") from e
    text = f"{z:.{stellen}f}"
    return text.replace(".", trennzeichen) if trennzeichen != "." else text


def _t_werteliste(
    wert: Any,
    liste: str = "",
    _cfg: Config | None = None,
    unbekannt: str = "fehler",
    **_: Any,
) -> str | None:
    """epilot-Wert über eine konfigurierte Tabelle in den SAP-Schlüssel übersetzen.

    Raises:
        MappingFehler: Die Liste fehlt in der Konfiguration, oder der Wert steht nicht
            darin und `unbekannt` ist nicht auf `durchreichen` gesetzt.
    """
    if wert in (None, ""):
        return None
    tabelle = (_cfg.wertelisten if _cfg else {}).get(liste)
    if tabelle is None:
        raise MappingFehler(f"Werteliste '{liste}' ist nicht konfiguriert")
    schluessel = str(wert)
    if schluessel in tabelle:
        return tabelle[schluessel]
    if unbekannt == "durchreichen":
        return schluessel
    raise MappingFehler(f"Wert '{schluessel}' fehlt in der Werteliste '{liste}'")


def _t_bool(wert: Any, wahr: str = "X", falsch: str = "", **_: Any) -> str | None:
    """Wahrheitswert in die Kennzeichen umsetzen, die SAP erwartet."""
    if wert is None:
        return None
    return wahr if bool(wert) else falsch


def _t_kuerzen(wert: Any, laenge: int = 0, **_: Any) -> Any:
    """Auf die Feldlänge der Gegenseite zuschneiden — nur wo das ausdrücklich gewollt ist."""
    if wert in (None, ""):
        return wert
    return str(wert)[:laenge] if laenge else str(wert)


def _t_ersetzen(wert: Any, muster: str = "", durch: str = "", **_: Any) -> Any:
    """Regulären Ausdruck im Wert ersetzen."""
    if wert in (None, ""):
        return wert
    return re.sub(muster, durch, str(wert))


def _t_gross(wert: Any, **_: Any) -> str | None:
    """In Großbuchstaben umsetzen."""
    return None if wert is None else str(wert).upper()


def _t_klein(wert: Any, **_: Any) -> str | None:
    """In Kleinbuchstaben umsetzen."""
    return None if wert is None else str(wert).lower()


def _t_trimmen(wert: Any, **_: Any) -> str | None:
    """Leerzeichen am Rand entfernen."""
    return None if wert is None else str(wert).strip()


def _t_erster(wert: Any, **_: Any) -> Any:
    """Erstes Element einer Liste — für mehrwertige Attribute (tags, multiselect)."""
    if isinstance(wert, list):
        return wert[0] if wert else None
    return wert


def _t_verketten(wert: Any, trenner: str = "|", **_: Any) -> Any:
    """Mehrwertiges Attribut zu einer Zeichenkette zusammenfügen."""
    if isinstance(wert, list):
        return trenner.join(str(x) for x in wert if x not in (None, ""))
    return wert


#: Die in der Konfiguration ansprechbaren Transformationen, Schlüssel ist die Angabe `art`.
TRANSFORMATIONEN = {
    "datum": _t_datum,
    "dezimal": _t_dezimal,
    "werteliste": _t_werteliste,
    "bool": _t_bool,
    "kuerzen": _t_kuerzen,
    "ersetzen": _t_ersetzen,
    "gross": _t_gross,
    "klein": _t_klein,
    "trimmen": _t_trimmen,
    "erster": _t_erster,
    "verketten": _t_verketten,
}


def zelle(entity: dict, spalte: Spalte, cfg: Config) -> str:
    """Eine CSV-Zelle aus der Entity erzeugen.

    Args:
        entity: Entity aus der epilot Entity API.
        spalte: Konfiguration der Spalte, also Quelle bzw. Konstante plus Transformationen.
        cfg: Gesamte Konfiguration; gebraucht für Wertelisten und den Leerwert.

    Returns:
        Der fertige Zellinhalt als Zeichenkette, bei fehlendem Wert der konfigurierte
        Leerwert.

    Raises:
        MappingFehler: Unbekannte Transformation, leeres Pflichtfeld, Überlänge oder
            ein Fehler aus einer der Transformationen.
    """
    wert = spalte.konstante if spalte.quelle is None else hole(entity, spalte.quelle)

    for schritt in spalte.transform:
        art = schritt.get("art")
        fn = TRANSFORMATIONEN.get(art)
        if fn is None:
            raise MappingFehler(f"Unbekannte Transformation '{art}' in Spalte '{spalte.name}'")
        argumente = {k: v for k, v in schritt.items() if k != "art"}
        wert = fn(wert, _cfg=cfg, **argumente)

    if wert in (None, ""):
        if spalte.pflicht:
            raise MappingFehler(f"Pflichtfeld '{spalte.name}' ist leer")
        return cfg.format.leerwert

    text = str(wert)
    if spalte.max_laenge and len(text) > spalte.max_laenge:
        raise MappingFehler(
            f"'{spalte.name}': {len(text)} Zeichen, erlaubt sind {spalte.max_laenge}. "
            f"Kürzen ist hier nicht automatisch erlaubt — Transformation 'kuerzen' "
            f"eintragen, falls die Gegenseite das so will."
        )
    return text


def zeile(entity: dict, cfg: Config) -> tuple[list[str], list[str]]:
    """Eine Entity in eine CSV-Zeile abbilden.

    Es werden absichtlich alle Spalten durchlaufen, auch nach dem ersten Fehler: Die
    Klärliste soll alle Probleme eines Vorgangs auf einmal nennen, sonst dauert die
    Klärung so viele Läufe, wie der Vorgang Fehler hat.

    Args:
        entity: Entity aus der epilot Entity API.
        cfg: Konfiguration des Laufs.

    Returns:
        Ein Paar aus den Zellwerten und den Fehlermeldungen. Ist die Fehlerliste nicht
        leer, ist die Zeile **nicht** lieferbar — die Werte stehen nur zur Ansicht darin.
    """
    werte: list[str] = []
    fehler: list[str] = []
    for spalte in cfg.spalten:
        try:
            werte.append(zelle(entity, spalte, cfg))
        except MappingFehler as e:
            fehler.append(str(e))
            werte.append(cfg.format.leerwert)
    return werte, fehler
