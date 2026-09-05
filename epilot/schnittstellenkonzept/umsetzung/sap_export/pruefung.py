"""Fachliche Prüfungen vor der Übertragung.

Heute prüft ein Mensch, bevor er die Datei ablegt. Diese Prüfung fällt mit der
Automatisierung weg. Was hier steht, ersetzt sie - alles Weitere, was im Gespräch
mit der Sachbearbeitung auftaucht, wird hier ergänzt.

Grundsatz: Im Zweifel nicht liefern. Ein Vorgang in der Klärliste ist ein sichtbares
Problem, ein falscher Wert in SAP ist ein unsichtbares - und die Werte hier sind
Vergütungsgrundlagen.
"""
from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any

from .config import Config
from .mapping import hole


class Befund:
    def __init__(self, feld: str, text: str):
        self.feld = feld
        self.text = text

    def __repr__(self):
        return f"{self.feld}: {self.text}"


def _als_datum(wert: Any) -> date | None:
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


def _p_pflicht(wert, **_):
    return "ist leer" if wert in (None, "", []) else None


def _p_regex(wert, muster: str = "", hinweis: str = "", **_):
    if wert in (None, ""):
        return None
    if not re.fullmatch(muster, str(wert)):
        return hinweis or f"entspricht nicht dem erwarteten Muster ({muster})"
    return None


def _p_zahl_zwischen(wert, min=None, max=None, **_):
    if wert in (None, ""):
        return None
    try:
        z = float(str(wert).replace(",", "."))
    except ValueError:
        return f"'{wert}' ist keine Zahl"
    if min is not None and z < min:
        return f"{z} liegt unter dem erwarteten Mindestwert {min}"
    if max is not None and z > max:
        return f"{z} liegt über dem erwarteten Höchstwert {max} - bitte fachlich prüfen"
    return None


def _p_datum_nicht_zukunft(wert, toleranz_tage: int = 0, **_):
    d = _als_datum(wert)
    if d is None:
        return None
    delta = (d - date.today()).days
    if delta > toleranz_tage:
        return f"liegt {delta} Tage in der Zukunft - eine Inbetriebsetzung kann nicht in der Zukunft liegen"
    return None


def _p_datum_nicht_aelter_als(wert, tage: int = 3650, **_):
    d = _als_datum(wert)
    if d is None:
        return None
    delta = (date.today() - d).days
    if delta > tage:
        return f"liegt {delta} Tage zurück - bitte prüfen, ob das Datum stimmt"
    return None


def _p_in_werteliste(wert, liste: str = "", _cfg: Config | None = None, **_):
    if wert in (None, ""):
        return None
    tabelle = (_cfg.wertelisten if _cfg else {}).get(liste, {})
    if str(wert) not in tabelle:
        return f"Wert '{wert}' ist in der Werteliste '{liste}' nicht hinterlegt"
    return None


def _p_gleich_wie(wert, anderes_feld: str = "", _entity: dict | None = None, **_):
    """Zwei Felder müssen übereinstimmen - z.B. Antragsleistung gegen Ist-Leistung."""
    if wert in (None, ""):
        return None
    anderer = hole(_entity or {}, anderes_feld)
    if anderer in (None, ""):
        return None
    if str(wert) != str(anderer):
        return f"weicht von '{anderes_feld}' ab ({wert} statt {anderer}) - bitte fachlich bestätigen"
    return None


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
    """Alle konfigurierten Prüfungen auf eine Entity anwenden."""
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
