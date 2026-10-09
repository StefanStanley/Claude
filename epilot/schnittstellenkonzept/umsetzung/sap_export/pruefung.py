"""Fachliche Prüfungen vor der Übertragung.

Heute prüft ein Mensch, bevor er die Datei ablegt. Diese Prüfung fällt mit der
Automatisierung weg. Was hier steht, ersetzt sie — alles Weitere, was im Gespräch mit
der Sachbearbeitung auftaucht, wird hier ergänzt.

Grundsatz: **Im Zweifel nicht liefern.** Ein Vorgang in der Klärliste ist ein sichtbares
Problem, ein falscher Wert in SAP ist ein unsichtbares — und die Werte hier sind
Vergütungsgrundlagen.

Eine Prüfung bekommt den Wert und gibt einen Befundtext zurück, oder `None`, wenn nichts
zu beanstanden ist. Ein Wert, der gar nicht vorhanden ist, gilt überall als in Ordnung;
ob er vorhanden sein muss, sagt allein die Prüfung `pflicht`.
"""
from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any

from .config import Config
from .mapping import hole


class Befund:
    """Ein Prüfergebnis, das der Klärung bedarf.

    Attributes:
        feld: Punktpfad des geprüften Feldes.
        text: Was daran zu beanstanden ist, in einem Satz für die Sachbearbeitung.
    """

    def __init__(self, feld: str, text: str) -> None:
        """Befund anlegen.

        Args:
            feld: Punktpfad des geprüften Feldes.
            text: Was daran zu beanstanden ist.
        """
        self.feld = feld
        self.text = text

    def __repr__(self) -> str:
        """Kurzform für Protokoll und Klärliste."""
        return f"{self.feld}: {self.text}"


def _als_datum(wert: Any) -> date | None:
    """Wert als Datum lesen; `None`, wenn er keines ist."""
    if wert in (None, ""):
        return None
    if isinstance(wert, datetime):
        return wert.date()
    if isinstance(wert, date):
        return wert
    try:
        return datetime.fromisoformat(str(wert).replace("Z", "+00:00")).date()
    except ValueError:
        return None


def _p_pflicht(wert: Any, **_: Any) -> str | None:
    """Der Wert muss vorhanden sein."""
    return "ist leer" if wert in (None, "", []) else None


def _p_regex(wert: Any, muster: str = "", hinweis: str = "", **_: Any) -> str | None:
    """Der Wert muss vollständig auf ein Muster passen — etwa eine Zählpunktbezeichnung."""
    if wert in (None, ""):
        return None
    if not re.fullmatch(muster, str(wert)):
        return hinweis or f"entspricht nicht dem erwarteten Muster ({muster})"
    return None


def _p_zahl_zwischen(
    wert: Any, min: float | None = None, max: float | None = None, **_: Any
) -> str | None:
    """Der Wert muss in einem plausiblen Bereich liegen — etwa die Anlagenleistung."""
    if wert in (None, ""):
        return None
    try:
        z = float(str(wert).replace(",", "."))
    except ValueError:
        return f"'{wert}' ist keine Zahl"
    if min is not None and z < min:
        return f"{z} liegt unter dem erwarteten Mindestwert {min}"
    if max is not None and z > max:
        return f"{z} liegt über dem erwarteten Höchstwert {max} — bitte fachlich prüfen"
    return None


def _p_datum_nicht_zukunft(wert: Any, toleranz_tage: int = 0, **_: Any) -> str | None:
    """Das Datum darf nicht in der Zukunft liegen — etwa die Inbetriebsetzung."""
    d = _als_datum(wert)
    if d is None:
        return None
    delta = (d - date.today()).days
    if delta > toleranz_tage:
        return (
            f"liegt {delta} Tage in der Zukunft — eine Inbetriebsetzung kann nicht in der "
            f"Zukunft liegen"
        )
    return None


def _p_datum_nicht_aelter_als(wert: Any, tage: int = 3650, **_: Any) -> str | None:
    """Das Datum darf nicht unplausibel weit zurückliegen — meist ein Tippfehler im Jahr."""
    d = _als_datum(wert)
    if d is None:
        return None
    delta = (date.today() - d).days
    if delta > tage:
        return f"liegt {delta} Tage zurück — bitte prüfen, ob das Datum stimmt"
    return None


def _p_in_werteliste(
    wert: Any, liste: str = "", _cfg: Config | None = None, **_: Any
) -> str | None:
    """Der Wert muss in der Übersetzungstabelle stehen, sonst kennt SAP ihn nicht."""
    if wert in (None, ""):
        return None
    tabelle = (_cfg.wertelisten if _cfg else {}).get(liste, {})
    if str(wert) not in tabelle:
        return f"Wert '{wert}' ist in der Werteliste '{liste}' nicht hinterlegt"
    return None


def _p_gleich_wie(
    wert: Any, anderes_feld: str = "", _entity: dict | None = None, **_: Any
) -> str | None:
    """Zwei Felder müssen übereinstimmen — z. B. Antragsleistung gegen Ist-Leistung."""
    if wert in (None, ""):
        return None
    anderer = hole(_entity or {}, anderes_feld)
    if anderer in (None, ""):
        return None
    if str(wert) != str(anderer):
        return (
            f"weicht von '{anderes_feld}' ab ({wert} statt {anderer}) — "
            f"bitte fachlich bestätigen"
        )
    return None


#: Die in der Konfiguration ansprechbaren Prüfungen, Schlüssel ist die Angabe `art`.
PRUEFUNGEN = {
    "pflicht": _p_pflicht,
    "regex": _p_regex,
    "zahl_zwischen": _p_zahl_zwischen,
    "datum_nicht_zukunft": _p_datum_nicht_zukunft,
    "datum_nicht_aelter_als": _p_datum_nicht_aelter_als,
    "in_werteliste": _p_in_werteliste,
    "gleich_wie": _p_gleich_wie,
}


def pruefe(entity: dict, cfg: Config) -> list[Befund]:
    """Alle konfigurierten Prüfungen auf eine Entity anwenden.

    Eine unbekannte Prüfungsart bricht den Lauf nicht ab, sondern wird selbst zum
    Befund: Ein Tippfehler in der Konfiguration soll auffallen, nicht stillschweigend
    dazu führen, dass gar nicht geprüft wird.

    Args:
        entity: Entity aus der epilot Entity API.
        cfg: Konfiguration des Laufs; maßgeblich ist `pruefungen`.

    Returns:
        Alle Befunde. Eine leere Liste heißt: Der Vorgang ist lieferbar.
    """
    befunde: list[Befund] = []
    for regel in cfg.pruefungen:
        feld = regel.get("feld", "")
        art = regel.get("art")
        fn = PRUEFUNGEN.get(art)
        if fn is None:
            befunde.append(Befund(feld, f"Unbekannte Prüfung '{art}' in der Konfiguration"))
            continue
        argumente = {k: v for k, v in regel.items() if k not in ("feld", "art")}
        text = fn(hole(entity, feld), _cfg=cfg, _entity=entity, **argumente)
        if text:
            befunde.append(Befund(feld, text))
    return befunde
