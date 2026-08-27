"""Aufbereitung des Laufergebnisses als Markdown, HTML und CSV.

Wenn das Portal automatisch bedient wird, ist der Bericht kein Arbeitsauftrag
mehr, sondern ein Rechenschaftsbericht: was wurde geaendert, was ist
fehlgeschlagen, was bleibt liegen.
"""

from __future__ import annotations

import csv
import io
from datetime import date
from html import escape

from .modelle import AbgleichErgebnis, Aktion, Massnahme
from .portal.ausfuehrung import Ausfuehrungsbericht

AKTION_TEXT = {
    Aktion.ANLEGEN: "Zugang anlegen",
    Aktion.ENTZIEHEN: "Zugang entziehen",
    Aktion.VERLAENGERN: "Zugang verlaengern",
    Aktion.PRUEFEN: "Manuell pruefen",
}

AKTION_TEXT_ERLEDIGT = {
    Aktion.ANLEGEN: "Zugang angelegt",
    Aktion.ENTZIEHEN: "Zugang entzogen",
    Aktion.VERLAENGERN: "Zugang verlaengert",
    Aktion.PRUEFEN: "Manuell pruefen",
}

AKTION_REIHENFOLGE = [Aktion.ENTZIEHEN, Aktion.ANLEGEN, Aktion.VERLAENGERN, Aktion.PRUEFEN]

SPALTEN = [
    "status", "aktion", "prioritaet", "personalnummer", "name", "email", "abteilung",
    "regelwerk", "vde_benutzer", "faellig_am", "begruendung", "meldung", "dauer_s", "screenshot",
]


def _datum(wert: date | None) -> str:
    return wert.strftime("%d.%m.%Y") if wert else "-"


def _status_index(ausfuehrung: Ausfuehrungsbericht | None) -> dict:
    if ausfuehrung is None:
        return {}
    return {e.massnahme.schluessel: e for e in ausfuehrung.ergebnisse}


def _status(massnahme: Massnahme, index: dict) -> tuple[str, str]:
    """Gibt (Status, Meldung) fuer eine Massnahme zurueck."""
    ergebnis = index.get(massnahme.schluessel)
    if ergebnis is None:
        return ("OFFEN", "")
    return (ergebnis.status, ergebnis.meldung)


def zusammenfassung(ergebnis: AbgleichErgebnis) -> dict[str, int]:
    return {aktion.value: len(ergebnis.nach_aktion(aktion)) for aktion in AKTION_REIHENFOLGE}


def betreff(
    ergebnis: AbgleichErgebnis,
    praefix: str = "[VDE-Zugaenge]",
    ausfuehrung: Ausfuehrungsbericht | None = None,
) -> str:
    tag = _datum(ergebnis.stichtag)
    if ausfuehrung is not None and ausfuehrung.abgebrochen:
        return f"{praefix} {tag}: LAUF GESTOPPT - {ausfuehrung.abbruchgrund[:80]}"
    if not ergebnis.hat_aufgaben:
        return f"{praefix} {tag}: alles im Soll"

    if ausfuehrung is not None:
        teile = []
        if ausfuehrung.erfolgreich:
            teile.append(f"{len(ausfuehrung.erfolgreich)} erledigt")
        if ausfuehrung.fehlgeschlagen:
            teile.append(f"{len(ausfuehrung.fehlgeschlagen)} FEHLGESCHLAGEN")
        if ausfuehrung.uebersprungen:
            teile.append(f"{len(ausfuehrung.uebersprungen)} offen")
        if teile:
            return f"{praefix} {tag}: {', '.join(teile)}"

    zahlen = zusammenfassung(ergebnis)
    teile = [f"{n}x {AKTION_TEXT[Aktion(k)]}" for k, n in zahlen.items() if n]
    return f"{praefix} {tag}: {', '.join(teile)}"


def _kopfzahlen(ergebnis: AbgleichErgebnis, ausfuehrung: Ausfuehrungsbericht | None) -> str:
    teile = [
        f"Soll-Zugaenge: {ergebnis.anzahl_soll}",
        f"Ist-Zugaenge: {ergebnis.anzahl_ist}",
        f"Massnahmen: {len(ergebnis.massnahmen)}",
    ]
    if ausfuehrung is not None:
        teile += [
            f"ausgefuehrt: {len(ausfuehrung.erfolgreich)}",
            f"fehlgeschlagen: {len(ausfuehrung.fehlgeschlagen)}",
            f"offen: {len(ausfuehrung.uebersprungen)}",
        ]
    return " | ".join(teile)


def als_markdown(
    ergebnis: AbgleichErgebnis, ausfuehrung: Ausfuehrungsbericht | None = None
) -> str:
    """Fuer die Anzeige direkt im Databricks-Notebook."""
    index = _status_index(ausfuehrung)
    erledigt = ausfuehrung is not None and bool(ausfuehrung.erfolgreich)
    titel = AKTION_TEXT_ERLEDIGT if erledigt else AKTION_TEXT

    zeilen = [
        f"## VDE-Regelwerkszugaenge - Lauf vom {_datum(ergebnis.stichtag)}",
        "",
        _kopfzahlen(ergebnis, ausfuehrung),
        "",
    ]

    if ausfuehrung is not None and ausfuehrung.abgebrochen:
        zeilen += [
            f"> **Lauf gestoppt (Notbremse):** {ausfuehrung.abbruchgrund}",
            "> Es wurde nichts geaendert. Bitte die SharePoint-Liste pruefen.",
            "",
        ]

    if not ergebnis.hat_aufgaben:
        zeilen.append("Alles im Soll - nichts zu tun.")

    for aktion in AKTION_REIHENFOLGE:
        gruppe = ergebnis.nach_aktion(aktion)
        if not gruppe:
            continue
        zeilen += [
            f"### {titel[aktion]} ({len(gruppe)})",
            "",
            "| Status | Name | Pers.-Nr. | Abteilung | Regelwerk | Faellig | Grund / Meldung |",
            "|---|---|---|---|---|---|---|",
        ]
        for m in gruppe:
            status, meldung = _status(m, index)
            zeilen.append(
                f"| {status} | {m.name} | {m.personalnummer} | {m.abteilung} | {m.regelwerk} | "
                f"{_datum(m.faellig_am)} | {meldung or m.begruendung} |"
            )
        zeilen.append("")

    if ergebnis.warnungen:
        zeilen += [f"### Datenqualitaet ({len(ergebnis.warnungen)} Hinweise)", ""]
        zeilen += [f"- {w}" for w in ergebnis.warnungen]
        zeilen.append("")

    return "\n".join(zeilen)


_STIL = """
body{font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#1b1b1b}
h2{margin:0 0 4px}
h3{margin:22px 0 6px;font-size:15px}
table{border-collapse:collapse;width:100%;margin-bottom:8px}
th,td{border:1px solid #d6d6d6;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#f2f4f7;font-weight:600}
.ERFOLG{color:#0b6b3a;font-weight:600}
.FEHLER{color:#a4262c;font-weight:600}
.UEBERSPRUNGEN{color:#8a6d00}
.OFFEN{color:#4a4a4a}
.warnbox{border:1px solid #a4262c;background:#fdf3f3;padding:10px 12px;margin:10px 0;
         border-radius:4px;color:#a4262c}
.hinweis{color:#555;font-size:12px;margin-top:18px}
ul{margin:4px 0 0 18px;padding:0}
"""


def als_html(
    ergebnis: AbgleichErgebnis,
    ausfuehrung: Ausfuehrungsbericht | None = None,
    dry_run: bool = False,
) -> str:
    """Mailtaugliches HTML - Inline-Stylesheet, keine externen Assets."""
    index = _status_index(ausfuehrung)
    erledigt = ausfuehrung is not None and bool(ausfuehrung.erfolgreich)
    titel = AKTION_TEXT_ERLEDIGT if erledigt else AKTION_TEXT

    teile = [
        f"<style>{_STIL}</style>",
        f"<h2>VDE-Regelwerkszug&auml;nge &ndash; Lauf vom {_datum(ergebnis.stichtag)}</h2>",
        f"<p>{escape(_kopfzahlen(ergebnis, ausfuehrung))}</p>",
    ]

    if ausfuehrung is not None and ausfuehrung.abgebrochen:
        teile.append(
            "<div class='warnbox'><b>Lauf gestoppt (Notbremse):</b> "
            f"{escape(ausfuehrung.abbruchgrund)}<br>Es wurde nichts ge&auml;ndert. "
            "Bitte die SharePoint-Liste pr&uuml;fen.</div>"
        )
    if dry_run:
        teile.append(
            "<div class='warnbox'>TESTLAUF &ndash; das Portal wurde nicht ver&auml;ndert.</div>"
        )
    if ausfuehrung is not None and ausfuehrung.fehlgeschlagen:
        teile.append(
            f"<div class='warnbox'>{len(ausfuehrung.fehlgeschlagen)} Aktion(en) sind "
            "fehlgeschlagen und brauchen eine manuelle Nachkontrolle.</div>"
        )

    if not ergebnis.hat_aufgaben:
        teile.append("<p>Alles im Soll &ndash; nichts zu tun.</p>")

    for aktion in AKTION_REIHENFOLGE:
        gruppe = ergebnis.nach_aktion(aktion)
        if not gruppe:
            continue
        teile.append(f"<h3>{titel[aktion]} ({len(gruppe)})</h3>")
        teile.append(
            "<table><tr><th>Status</th><th>Name</th><th>Pers.-Nr.</th><th>E-Mail</th>"
            "<th>Abteilung</th><th>Regelwerk</th><th>F&auml;llig</th>"
            "<th>Grund / Meldung</th></tr>"
        )
        for m in gruppe:
            status, meldung = _status(m, index)
            teile.append(
                f"<tr><td class='{status}'>{status}</td><td>{escape(m.name)}</td>"
                f"<td>{escape(m.personalnummer)}</td><td>{escape(m.email)}</td>"
                f"<td>{escape(m.abteilung)}</td><td>{escape(m.regelwerk)}</td>"
                f"<td>{_datum(m.faellig_am)}</td>"
                f"<td>{escape(meldung or m.begruendung)}</td></tr>"
            )
        teile.append("</table>")

    if ergebnis.warnungen:
        teile.append(f"<h3>Datenqualit&auml;t ({len(ergebnis.warnungen)})</h3><ul>")
        teile += [f"<li>{escape(w)}</li>" for w in ergebnis.warnungen]
        teile.append("</ul>")

    teile.append(
        "<p class='hinweis'>Automatisch erzeugt vom Databricks-Job "
        "<i>vde_zugangsabgleich</i>.</p>"
    )
    return "\n".join(teile)


def als_csv(
    massnahmen: list[Massnahme], ausfuehrung: Ausfuehrungsbericht | None = None
) -> str:
    index = _status_index(ausfuehrung)
    puffer = io.StringIO()
    schreiber = csv.DictWriter(puffer, fieldnames=SPALTEN, delimiter=";", lineterminator="\n")
    schreiber.writeheader()
    for m in massnahmen:
        ergebnis = index.get(m.schluessel)
        zeile = m.als_dict()
        zeile["faellig_am"] = zeile["faellig_am"].isoformat() if zeile["faellig_am"] else ""
        zeile["status"] = ergebnis.status if ergebnis else "OFFEN"
        zeile["meldung"] = ergebnis.meldung if ergebnis else ""
        zeile["dauer_s"] = round(ergebnis.dauer_s, 2) if ergebnis else ""
        zeile["screenshot"] = ergebnis.screenshot if ergebnis else ""
        schreiber.writerow(zeile)
    return puffer.getvalue()
