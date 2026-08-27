"""Lesezugriff auf die SharePoint-Liste ueber Microsoft Graph.

Authentifizierung: Client-Credentials-Flow einer App-Registrierung mit der
Anwendungsberechtigung `Sites.Selected` (empfohlen, auf genau diese Site
freigegeben) oder `Sites.Read.All`.

Das Modul liest ausschliesslich - es schreibt nie in SharePoint zurueck.
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any, Iterable, Sequence

import requests

from .konfiguration import AKTIV_WERTE, SharePointKonfig
from .modelle import Mitarbeiter, SollZugang

LOG = logging.getLogger(__name__)

GRAPH = "https://graph.microsoft.com/v1.0"
ZEITLIMIT = 60


class SharePointFehler(RuntimeError):
    pass


def hole_token(konfig: SharePointKonfig) -> str:
    """Holt ein App-Token fuer Microsoft Graph (Client Credentials)."""
    antwort = requests.post(
        f"https://login.microsoftonline.com/{konfig.tenant_id}/oauth2/v2.0/token",
        data={
            "client_id": konfig.client_id,
            "client_secret": konfig.client_secret,
            "scope": "https://graph.microsoft.com/.default",
            "grant_type": "client_credentials",
        },
        timeout=ZEITLIMIT,
    )
    if antwort.status_code != 200:
        raise SharePointFehler(
            f"Token konnte nicht geholt werden (HTTP {antwort.status_code}): {antwort.text[:400]}"
        )
    return antwort.json()["access_token"]


def _get(pfad_oder_url: str, token: str, params: dict | None = None) -> dict:
    url = pfad_oder_url if pfad_oder_url.startswith("http") else f"{GRAPH}{pfad_oder_url}"
    antwort = requests.get(
        url,
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
        params=params,
        timeout=ZEITLIMIT,
    )
    if antwort.status_code != 200:
        raise SharePointFehler(
            f"Graph-Aufruf {url} fehlgeschlagen (HTTP {antwort.status_code}): {antwort.text[:400]}"
        )
    return antwort.json()


def hole_site_id(konfig: SharePointKonfig, token: str) -> str:
    pfad = konfig.site_pfad if konfig.site_pfad.startswith("/") else f"/{konfig.site_pfad}"
    daten = _get(f"/sites/{konfig.site_hostname}:{pfad}", token)
    return daten["id"]


def lade_listeneintraege(konfig: SharePointKonfig, token: str, site_id: str) -> list[dict]:
    """Laedt alle Zeilen der Liste inklusive Paging."""
    eintraege: list[dict] = []
    daten = _get(
        f"/sites/{site_id}/lists/{konfig.listen_name}/items",
        token,
        params={"expand": "fields", "$top": "200"},
    )
    while True:
        eintraege.extend(daten.get("value", []))
        weiter = daten.get("@odata.nextLink")
        if not weiter:
            break
        daten = _get(weiter, token)
    LOG.info("SharePoint: %s Zeilen gelesen", len(eintraege))
    return eintraege


# --------------------------------------------------------------------------
# Umwandlung der Rohzeilen in Fachobjekte
# --------------------------------------------------------------------------

def _text(felder: dict, name: str) -> str:
    wert = felder.get(name)
    if wert is None:
        return ""
    if isinstance(wert, dict):  # Personen-/Lookup-Spalten
        for schluessel in ("Email", "email", "LookupValue", "DisplayName", "Title"):
            if wert.get(schluessel):
                return str(wert[schluessel]).strip()
        return ""
    return str(wert).strip()


def parse_datum(wert: Any) -> date | None:
    """Robuste Datumserkennung fuer Graph-ISO-Strings und deutsche Eingaben."""
    if wert in (None, ""):
        return None
    if isinstance(wert, date) and not isinstance(wert, datetime):
        return wert
    if isinstance(wert, datetime):
        return wert.date()
    text = str(wert).strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(text).date()
    except ValueError:
        pass
    for muster in ("%d.%m.%Y", "%d.%m.%y", "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(text, muster).date()
        except ValueError:
            continue
    LOG.warning("Datum nicht interpretierbar, wird ignoriert: %r", wert)
    return None


def parse_ja_nein(wert: Any, standard: bool = True) -> bool:
    if wert is None or wert == "":
        return standard
    if isinstance(wert, bool):
        return wert
    return str(wert).strip().lower() in AKTIV_WERTE


def parse_regelwerke(wert: Any, trennzeichen: str = ";") -> list[str]:
    """Akzeptiert Mehrfachauswahl (Liste) und Textspalten ('A; B, C')."""
    if wert in (None, ""):
        return []
    if isinstance(wert, (list, tuple, set)):
        rohwerte: Iterable[Any] = wert
    else:
        text = str(wert)
        for zeichen in (trennzeichen, ",", "\n", "|"):
            text = text.replace(zeichen, ";")
        rohwerte = text.split(";")
    return [str(r).strip() for r in rohwerte if str(r).strip()]


def zeilen_zu_fachobjekten(
    zeilen: Sequence[dict], konfig: SharePointKonfig
) -> tuple[list[Mitarbeiter], list[SollZugang], list[str]]:
    """Wandelt SharePoint-Zeilen in Mitarbeiter- und Soll-Zugangslisten.

    Erwartetes Listenformat: eine Zeile je Mitarbeiter, die Spalte
    `Regelwerke` enthaelt alle zugewiesenen Regelwerke (Mehrfachauswahl
    oder mit Semikolon getrennter Text).
    """
    f = konfig.felder
    mitarbeiter: dict[str, Mitarbeiter] = {}
    soll: list[SollZugang] = []
    warnungen: list[str] = []

    for zeile in zeilen:
        felder = zeile.get("fields", zeile)
        personalnummer = _text(felder, f["personalnummer"])
        name = _text(felder, f["name"]) or personalnummer

        if not personalnummer:
            warnungen.append(f"SharePoint-Zeile ohne Personalnummer uebersprungen: {name or zeile.get('id')}")
            continue

        person = Mitarbeiter(
            personalnummer=personalnummer,
            name=name,
            email=_text(felder, f["email"]),
            abteilung=_text(felder, f["abteilung"]),
            aktiv=parse_ja_nein(felder.get(f["status"])),
            austritt=parse_datum(felder.get(f["austritt"])),
            kostenstelle=_text(felder, f["kostenstelle"]),
        )
        if person.personalnummer in mitarbeiter:
            warnungen.append(
                f"Personalnummer {person.personalnummer} kommt mehrfach in der Liste vor - "
                "die Regelwerke werden zusammengefuehrt."
            )
        else:
            mitarbeiter[person.personalnummer] = person

        gueltig_bis = parse_datum(felder.get(f["gueltig_bis"]))
        begruendung = _text(felder, f["begruendung"])
        regelwerke = parse_regelwerke(felder.get(f["regelwerke"]), konfig.trennzeichen)

        if not regelwerke and not person.ist_ausgeschieden(date.today()):
            warnungen.append(
                f"{person.name} ({person.personalnummer}) hat keine Regelwerke eingetragen."
            )

        for regelwerk in regelwerke:
            soll.append(
                SollZugang(
                    personalnummer=person.personalnummer,
                    regelwerk=regelwerk,
                    gueltig_bis=gueltig_bis,
                    begruendung=begruendung,
                )
            )

    return list(mitarbeiter.values()), soll, warnungen


def lade_soll_zustand(
    konfig: SharePointKonfig,
) -> tuple[list[Mitarbeiter], list[SollZugang], list[str]]:
    """Kompletter Lesevorgang: Token -> Site -> Liste -> Fachobjekte."""
    token = hole_token(konfig)
    site_id = hole_site_id(konfig, token)
    zeilen = lade_listeneintraege(konfig, token, site_id)
    return zeilen_zu_fachobjekten(zeilen, konfig)
