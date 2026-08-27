"""Aufbereitung der Massnahmen als Markdown, HTML und CSV."""

from __future__ import annotations

import csv
import io
from datetime import date
from html import escape

from .modelle import AbgleichErgebnis, Aktion, Massnahme

AKTION_TEXT = {
    Aktion.ANLEGEN: "Zugang anlegen",
    Aktion.ENTZIEHEN: "Zugang entziehen",
    Aktion.VERLAENGERN: "Zugang verlaengern",
    Aktion.PRUEFEN: "Manuell pruefen",
}

AKTION_REIHENFOLGE = [Aktion.ENTZIEHEN, Aktion.ANLEGEN, Aktion.VERLAENGERN, Aktion.PRUEFEN]

SPALTEN = [
    "aktion",
    "prioritaet",
    "personalnummer",
    "name",
    "email",
    "abteilung",
    "regelwerk",
    "vde_benutzer",
    "faellig_am",
    "begruendung",
]


def _datum(wert: date | None) -> str:
    return wert.strftime("%d.%m.%Y") if wert else "-"


def zusammenfassung(ergebnis: AbgleichErgebnis) -> dict[str, int]:
    return {aktion.value: len(ergebnis.nach_aktion(aktion)) for aktion in AKTION_REIHENFOLGE}


def betreff(ergebnis: AbgleichErgebnis, praefix: str = "[VDE-Zugaenge]") -> str:
    zahlen = zusammenfassung(ergebnis)
    if not ergebnis.hat_aufgaben:
        return f"{praefix} {_datum(ergebnis.stichtag)}: keine offenen Aufgaben"
    teile = [f"{anzahl}x {AKTION_TEXT[Aktion(name)]}" for name, anzahl in zahlen.items() if anzahl]
    return f"{praefix} {_datum(ergebnis.stichtag)}: {', '.join(teile)}"


def als_markdown(ergebnis: AbgleichErgebnis) -> str:
    """Fuer die Anzeige direkt im Databricks-Notebook."""
    zeilen: list[str] = [
        f"## VDE-Regelwerkszugaenge - Abgleich vom {_datum(ergebnis.stichtag)}",
        "",
        f"Soll-Zugaenge: **{ergebnis.anzahl_soll}** | "
        f"Ist-Zugaenge: **{ergebnis.anzahl_ist}** | "
        f"Offene Aufgaben: **{len(ergebnis.massnahmen)}**",
        "",
    ]

    if not ergebnis.hat_aufgaben:
        zeilen.append("Alles im Soll - nichts zu tun.")
    for aktion in AKTION_REIHENFOLGE:
        gruppe = ergebnis.nach_aktion(aktion)
        if not gruppe:
            continue
        zeilen += [
            f"### {AKTION_TEXT[aktion]} ({len(gruppe)})",
            "",
            "| Prio | Name | Pers.-Nr. | Abteilung | Regelwerk | Faellig | Grund |",
            "|---|---|---|---|---|---|---|",
        ]
        for m in gruppe:
            zeilen.append(
                f"| {m.prioritaet.value} | {m.name} | {m.personalnummer} | {m.abteilung} | "
                f"{m.regelwerk} | {_datum(m.faellig_am)} | {m.begruendung} |"
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
.HOCH{color:#a4262c;font-weight:600}
.MITTEL{color:#8a6d00}
.NIEDRIG{color:#4a4a4a}
.hinweis{color:#555;font-size:12px;margin-top:18px}
ul{margin:4px 0 0 18px;padding:0}
"""


def als_html(ergebnis: AbgleichErgebnis, dry_run: bool = False) -> str:
    """Mailtaugliches HTML - bewusst mit Inline-Stylesheet, ohne externe Assets."""
    teile = [
        f"<style>{_STIL}</style>",
        f"<h2>VDE-Regelwerkszugaenge &ndash; Abgleich vom {_datum(ergebnis.stichtag)}</h2>",
        f"<p>Soll-Zugaenge: <b>{ergebnis.anzahl_soll}</b> &middot; "
        f"Ist-Zugaenge: <b>{ergebnis.anzahl_ist}</b> &middot; "
        f"Offene Aufgaben: <b>{len(ergebnis.massnahmen)}</b></p>",
    ]
    if dry_run:
        teile.append("<p class='HOCH'>TESTLAUF (dry run) &ndash; es wurde nichts fortgeschrieben.</p>")

    if not ergebnis.hat_aufgaben:
        teile.append("<p>Alles im Soll &ndash; nichts zu tun.</p>")

    for aktion in AKTION_REIHENFOLGE:
        gruppe = ergebnis.nach_aktion(aktion)
        if not gruppe:
            continue
        teile.append(f"<h3>{AKTION_TEXT[aktion]} ({len(gruppe)})</h3>")
        teile.append(
            "<table><tr><th>Prio</th><th>Name</th><th>Pers.-Nr.</th><th>E-Mail</th>"
            "<th>Abteilung</th><th>Regelwerk</th><th>F&auml;llig</th><th>Grund</th></tr>"
        )
        for m in gruppe:
            teile.append(
                f"<tr><td class='{m.prioritaet.value}'>{m.prioritaet.value}</td>"
                f"<td>{escape(m.name)}</td><td>{escape(m.personalnummer)}</td>"
                f"<td>{escape(m.email)}</td><td>{escape(m.abteilung)}</td>"
                f"<td>{escape(m.regelwerk)}</td><td>{_datum(m.faellig_am)}</td>"
                f"<td>{escape(m.begruendung)}</td></tr>"
            )
        teile.append("</table>")

    if ergebnis.warnungen:
        teile.append(f"<h3>Datenqualit&auml;t ({len(ergebnis.warnungen)})</h3><ul>")
        teile += [f"<li>{escape(w)}</li>" for w in ergebnis.warnungen]
        teile.append("</ul>")

    teile.append(
        "<p class='hinweis'>Automatisch erzeugt vom Databricks-Job "
        "<i>vde_zugangsabgleich</i>. Das VDE-Portal wird nicht automatisch "
        "ver&auml;ndert &ndash; diese Liste ist die Arbeitsgrundlage.</p>"
    )
    return "\n".join(teile)


def als_csv(massnahmen: list[Massnahme]) -> str:
    puffer = io.StringIO()
    schreiber = csv.DictWriter(puffer, fieldnames=SPALTEN, delimiter=";", lineterminator="\n")
    schreiber.writeheader()
    for m in massnahmen:
        zeile = m.als_dict()
        zeile["faellig_am"] = zeile["faellig_am"].isoformat() if zeile["faellig_am"] else ""
        schreiber.writerow(zeile)
    return puffer.getvalue()
