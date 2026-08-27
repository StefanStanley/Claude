"""Ermittelt die Selektoren des echten Portals.

Die Automatisierung braucht Ortsangaben: Wo steht das Anmeldefeld, welche
Tabelle enthaelt die Benutzer, welcher Knopf entzieht ein Regelwerk. Dieses
Skript meldet sich an, sieht sich die Seiten an und schlaegt fuer jedes
benoetigte Feld Kandidaten vor - stabile Merkmale (id, name, data-Attribute)
zuerst, weil CSS-Klassen sich mit jedem Portal-Update aendern koennen.

    python3 scripts/selektoren_erkunden.py \\
        --url https://portal.example.de \\
        --benutzer admin@firma.de \\
        --passwort '...' \\
        --ausgabe selektoren.json

Mit --sichtbar oeffnet sich ein echtes Browserfenster zum Mitschauen.
Die erzeugte JSON-Datei anschliessend pruefen und ergaenzen - das Skript raet,
es weiss nichts.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from vde_zugang.portal.selektoren import Selektoren  # noqa: E402

# Was gesucht wird -> woran man es erkennt
STECKBRIEFE = {
    "feld_benutzer": ("input", ["benutzer", "user", "login", "email", "kennung"]),
    "feld_passwort": ("input[type=password]", []),
    "knopf_anmelden": ("button,input[type=submit]", ["anmelden", "login", "sign in"]),
    "tabelle_benutzer": ("table", ["benutzer", "user", "mitglied", "teilnehmer"]),
    "feld_neu_personalnummer": ("input", ["personal", "pers", "mitarbeiter", "nummer"]),
    "feld_neu_email": ("input", ["email", "mail"]),
    "knopf_speichern": ("button,input[type=submit]", ["speichern", "anlegen", "save"]),
    "knopf_regelwerk_entziehen": ("button,a", ["entziehen", "entfernen", "loeschen", "remove"]),
    "knopf_naechste_seite": ("button,a", ["weiter", "naechste", "next", "»"]),
}


def _selektor_fuer(element) -> str:
    """Baut einen moeglichst stabilen Selektor fuer ein Element."""
    for attribut, muster in (("id", "#{}"), ("data-testid", '[data-testid="{}"]'),
                             ("name", '[name="{}"]')):
        wert = element.get_attribute(attribut)
        if wert:
            return muster.format(wert)
    klassen = (element.get_attribute("class") or "").split()
    marke = element.evaluate("e => e.tagName.toLowerCase()")
    if klassen:
        return f"{marke}.{klassen[0]}"
    return marke


def _pfad(url: str) -> str:
    from urllib.parse import urlparse

    zerlegt = urlparse(url)
    return zerlegt.path + (f"?{zerlegt.query}" if zerlegt.query else "")


def _finde_unterseite(seite, woerter: list[str]) -> str:
    """Sucht einen Link, der auf die gesuchte Unterseite fuehrt."""
    for element in seite.query_selector_all("a,button"):
        text = (element.inner_text() or "").strip().lower()
        ziel = element.get_attribute("href") or ""
        if any(w in text or w in ziel.lower() for w in woerter):
            if ziel and not ziel.startswith("#") and not ziel.startswith("javascript"):
                from urllib.parse import urljoin

                return urljoin(seite.url, ziel)
    return ""


def _zeilenvorschlag(seite) -> list[dict]:
    """Schlaegt einen Selektor fuer die Datenzeilen der Uebersicht vor."""
    treffer = []
    for zeile in seite.query_selector_all("tr")[:40]:
        klassen = (zeile.get_attribute("class") or "").split()
        daten = [a for a in ("data-id", "data-pnr", "data-user")
                 if zeile.get_attribute(a)]
        if klassen:
            treffer.append({"selektor": f"tr.{klassen[0]}", "erkannt_an": "CSS-Klasse der Zeile"})
        elif daten:
            treffer.append({"selektor": f"tr[{daten[0]}]", "erkannt_an": daten[0]})
    if not treffer:
        treffer.append({"selektor": "table tbody tr", "erkannt_an": "Rueckfall ohne Merkmal"})
    # Doppelte zusammenfassen, haeufigste Struktur zuerst
    gezaehlt: dict[str, dict] = {}
    for t in treffer:
        eintrag = gezaehlt.setdefault(t["selektor"], {**t, "treffsicherheit": 0})
        eintrag["treffsicherheit"] += 1
    return sorted(gezaehlt.values(), key=lambda t: -t["treffsicherheit"])[:5]


def _kandidaten(seite, marken: str, woerter: list[str], grenze: int = 5) -> list[dict]:
    treffer = []
    for element in seite.query_selector_all(marken):
        text = " ".join(
            filter(None, [
                element.inner_text()[:60] if marken != "input" else "",
                element.get_attribute("placeholder") or "",
                element.get_attribute("name") or "",
                element.get_attribute("id") or "",
                element.get_attribute("aria-label") or "",
            ])
        ).lower()
        punkte = sum(1 for w in woerter if w in text) if woerter else 1
        if punkte:
            treffer.append({
                "selektor": _selektor_fuer(element),
                "erkannt_an": text.strip()[:70],
                "treffsicherheit": punkte,
            })
    treffer.sort(key=lambda t: -t["treffsicherheit"])
    return treffer[:grenze]


def erkunde(url: str, benutzer: str, passwort: str, sichtbar: bool, chromium: str) -> dict:
    from playwright.sync_api import sync_playwright

    vorschlaege: dict[str, list[dict]] = {}
    with sync_playwright() as p:
        start = {"headless": not sichtbar, "args": ["--no-sandbox"]}
        if chromium:
            start["executable_path"] = chromium
        browser = p.chromium.launch(**start)
        seite = browser.new_context(locale="de-DE").new_page()

        print(f"Rufe {url} auf ...")
        seite.goto(url, wait_until="domcontentloaded")
        for feld in ("feld_benutzer", "feld_passwort", "knopf_anmelden"):
            marken, woerter = STECKBRIEFE[feld]
            vorschlaege[feld] = _kandidaten(seite, marken, woerter)

        if benutzer and vorschlaege.get("feld_benutzer") and vorschlaege.get("feld_passwort"):
            print("Melde an ...")
            try:
                seite.fill(vorschlaege["feld_benutzer"][0]["selektor"], benutzer)
                seite.fill(vorschlaege["feld_passwort"][0]["selektor"], passwort)
                if vorschlaege.get("knopf_anmelden"):
                    seite.click(vorschlaege["knopf_anmelden"][0]["selektor"])
                seite.wait_for_load_state("networkidle", timeout=20000)
            except Exception as fehler:
                print(f"  Anmeldung nicht automatisch moeglich: {fehler}")
                print("  Mit --sichtbar starten und von Hand anmelden, dann Enter druecken.")
                if sichtbar:
                    input("  Weiter mit Enter ...")

        print(f"Angemeldete Seite: {seite.url}")
        uebersicht_url = seite.url
        for feld in ("tabelle_benutzer", "knopf_regelwerk_entziehen", "knopf_naechste_seite"):
            marken, woerter = STECKBRIEFE[feld]
            vorschlaege[feld] = _kandidaten(seite, marken, woerter)

        # Zeilenstruktur der Uebersicht: die Automatisierung liest zeilenweise.
        vorschlaege["zeile_benutzer"] = _zeilenvorschlag(seite)

        # Das Anlegen-Formular liegt fast immer auf einer eigenen Unterseite.
        anlegen_url = _finde_unterseite(seite, ["neu", "anlegen", "hinzu", "new", "add"])
        if anlegen_url:
            print(f"Anlegen-Seite gefunden: {anlegen_url}")
            seite.goto(anlegen_url, wait_until="domcontentloaded")
            vorschlaege["_pfad_benutzer_neu"] = [{"selektor": _pfad(anlegen_url)}]
        else:
            print("Keine Anlegen-Seite gefunden - Formularfelder bitte von Hand ermitteln.")
        for feld in ("feld_neu_personalnummer", "feld_neu_email", "knopf_speichern"):
            marken, woerter = STECKBRIEFE[feld]
            vorschlaege[feld] = _kandidaten(seite, marken, woerter)
        seite.goto(uebersicht_url, wait_until="domcontentloaded")

        vorschlaege["_seitenstruktur"] = [{
            "url": seite.url,
            "tabellen": len(seite.query_selector_all("table")),
            "formulare": len(seite.query_selector_all("form")),
            "links": [
                (a.inner_text().strip()[:40], a.get_attribute("href"))
                for a in seite.query_selector_all("a")[:25]
            ],
        }]
        browser.close()
    return vorschlaege


def main() -> None:
    zerleger = argparse.ArgumentParser(description=__doc__)
    zerleger.add_argument("--url", required=True, help="Startseite des Portals")
    zerleger.add_argument("--benutzer", default="")
    zerleger.add_argument("--passwort", default="")
    zerleger.add_argument("--ausgabe", default="selektoren_vorschlag.json")
    zerleger.add_argument("--sichtbar", action="store_true", help="Browserfenster anzeigen")
    zerleger.add_argument("--chromium", default="", help="Pfad zu einem eigenen Chromium")
    argumente = zerleger.parse_args()

    vorschlaege = erkunde(
        argumente.url, argumente.benutzer, argumente.passwort,
        argumente.sichtbar, argumente.chromium,
    )

    for feld, treffer in vorschlaege.items():
        if feld.startswith("_"):
            continue
        print(f"\n{feld}:")
        for t in treffer or [{"selektor": "- nichts gefunden -", "erkannt_an": ""}]:
            print(f"   {t['selektor']:<40} {t.get('erkannt_an', '')}")

    # Beste Kandidaten als Startpunkt in eine Selektor-Datei schreiben
    entwurf = Selektoren()
    for feld, treffer in vorschlaege.items():
        if not feld.startswith("_") and treffer and hasattr(entwurf, feld):
            setattr(entwurf, feld, treffer[0]["selektor"])
    if vorschlaege.get("_pfad_benutzer_neu"):
        entwurf.pfad_benutzer_neu = vorschlaege["_pfad_benutzer_neu"][0]["selektor"]

    ziel = Path(argumente.ausgabe)
    entwurf.nach_json(ziel)
    Path(ziel.stem + "_rohdaten.json").write_text(
        json.dumps(vorschlaege, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    offen = entwurf.platzhalter()
    print(f"\nEntwurf geschrieben: {ziel}")
    if offen:
        print(f"Noch von Hand zu ergaenzen: {', '.join(offen)}")
    else:
        print("Alle Pflichtfelder belegt - bitte trotzdem gegenlesen.")


if __name__ == "__main__":
    main()
