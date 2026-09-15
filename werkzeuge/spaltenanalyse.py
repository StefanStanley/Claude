#!/usr/bin/env python3
"""Analysiert die Spaltenliste eines Ist-Exports und erzeugt daraus eine Markdown-Auswertung.

Findet die Fallstricke, die man einer Liste beim Lesen nicht ansieht: mehrfach vorkommende
Spaltennamen, Leerzeichen am Rand, Sonderzeichen, uneinheitliche Benennung. Gruppiert die
Spalten über gemeinsame Präfixe und kennzeichnet mutmaßliche Formular-Anzeigetexte.

    # Einzelne Strecke auswerten
    python3 werkzeuge/spaltenanalyse.py spalten.txt -o analyse.md --titel "§ 14a"

    # Zwei Strecken vergleichen
    python3 werkzeuge/spaltenanalyse.py a.txt --vergleich b.txt -o vergleich.md

Eingabe: eine Zeile tab-getrennt (so wie aus einer CSV-Kopfzeile kopiert) oder eine Spalte
je Zeile. Die Auswertung beruht auf den Namen — Werte und Formate zeigt erst eine Datei
mit Inhalten.
"""
from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

# Präfixe, die auf einen reinen Anzeigetext im Formular hindeuten
TEXT_MUSTER = re.compile(r"^(text[-_]|hinweis|info[-_]|beschreibung)", re.I)


def lies(pfad: str) -> list[str]:
    roh = Path(pfad).read_text(encoding="utf-8").rstrip("\n")
    if "\t" in roh:
        return roh.split("\t")
    return [z for z in roh.splitlines() if z.strip()]


def normalisiere(name: str) -> str:
    t = unicodedata.normalize("NFKD", name.strip()).replace("ß", "ss")
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"[^a-zA-Z0-9]+", "_", t).strip("_").lower()


def schema_von(name: str) -> str:
    t = name.strip()
    if not t:
        return "leer"
    if "-" in t and t == t.lower():
        return "kebab-case klein"
    if "_" in t and t[:1].isupper():
        return "Deutsch_Unterstrich_Gross"
    if "_" in t and t[:1].islower():
        return "snake_case klein"
    if " " in t:
        return "mit Leerzeichen"
    if t[:1].islower() and any(c.isupper() for c in t):
        return "camelCase"
    return "sonstige"


def gruppiere(namen: list[str], mindestens: int = 2) -> dict[str, list[str]]:
    """Spalten über ihr erstes Namenssegment bündeln - erkennt die Blöcke des Formulars."""
    eimer: dict[str, list[str]] = defaultdict(list)
    for n in namen:
        t = normalisiere(n)
        praefix = t.split("_")[0] if "_" in t else t
        eimer[praefix].append(n)
    gross = {k: v for k, v in eimer.items() if len(v) >= mindestens}
    rest = [n for k, v in eimer.items() if len(v) < mindestens for n in v]
    if rest:
        gross["(einzeln)"] = rest
    return dict(sorted(gross.items(), key=lambda x: -len(x[1])))


def befunde(namen: list[str]) -> dict:
    zaehler = Counter(namen)
    return {
        "anzahl": len(namen),
        "mehrfach": {
            n: [i + 1 for i, x in enumerate(namen) if x == n]
            for n, c in zaehler.items() if c > 1
        },
        "randleerzeichen": [(i + 1, n) for i, n in enumerate(namen) if n != n.strip()],
        "sonderzeichen": [
            (i + 1, n) for i, n in enumerate(namen)
            if re.search(r"[./§%&()\[\]]", n.strip())
        ],
        "mit_leerzeichen": [(i + 1, n) for i, n in enumerate(namen) if " " in n.strip()],
        "umlaute": [(i + 1, n) for i, n in enumerate(namen)
                    if re.search(r"[äöüÄÖÜß]", n)],
        "anzeigetexte": [(i + 1, n) for i, n in enumerate(namen) if TEXT_MUSTER.match(n.strip())],
        "schemata": Counter(schema_von(n) for n in namen),
    }


def bericht(namen: list[str], titel: str) -> str:
    b = befunde(namen)
    daten = b["anzahl"] - len(b["anzeigetexte"])
    z = [f"# {titel} — Analyse der Exportspalten", "",
         "> Erzeugt mit `werkzeuge/spaltenanalyse.py`. Die Auswertung beruht auf den",
         "> Spaltennamen — **Werte und Formate zeigt erst eine Datei mit Inhalten.**", "",
         f"**{b['anzahl']} Spalten.** Davon rund **{daten} mutmaßliche Datenfelder** und "
         f"**{len(b['anzeigetexte'])} mutmaßliche Formular-Anzeigetexte**.", ""]

    kritisch = []
    if b["mehrfach"]:
        for n, pos in b["mehrfach"].items():
            kritisch.append(
                f"**`{n}` kommt {len(pos)}× vor** (Position {', '.join(map(str, pos))}). "
                "Ein Mapping über Spaltennamen ist damit unmöglich — die Zuordnung muss über "
                "die **Position** laufen, auch in der neuen Erzeugung.")
    for pos, n in b["randleerzeichen"]:
        kritisch.append(
            f"**`{n}` trägt ein Leerzeichen am Rand** (Position {pos}). Wer den Namen abtippt "
            "oder trimmt, erzeugt eine andere Datei. Fällt nur im byteweisen Vergleich auf.")
    if b["sonderzeichen"] or b["mit_leerzeichen"]:
        gesehen, beispiele = set(), []
        for _, n in b["sonderzeichen"] + b["mit_leerzeichen"]:
            if n.strip() not in gesehen:
                gesehen.add(n.strip()); beispiele.append(n.strip())
            if len(beispiele) == 4:
                break
        kritisch.append(
            "**Sonderzeichen und Leerzeichen in Spaltennamen** — etwa "
            + ", ".join(f"`{x}`" for x in beispiele)
            + ". Spaltennamen sind Zeichenketten, keine Pfade; Punktnotation im Mapping bricht daran.")
    if kritisch:
        z += ["## Fallstricke", ""]
        z += [f"{i}. {t}" for i, t in enumerate(kritisch, 1)] + [""]
    else:
        z += ["## Fallstricke", "", "Keine Duplikate, keine Randleerzeichen, keine "
              "problematischen Sonderzeichen gefunden.", ""]

    if len(b["schemata"]) > 2:
        z += ["## Benennung", "",
              f"**{len(b['schemata'])} Namensschemata nebeneinander** — Hinweis auf ein über "
              "die Zeit gewachsenes Formular:", "",
              "| Schema | Spalten |", "| --- | --- |"]
        z += [f"| {k} | {v} |" for k, v in b["schemata"].most_common()] + [""]

    if b["umlaute"]:
        z += [f"**{len(b['umlaute'])} Spaltennamen mit Umlauten.** An ihnen entscheidet sich, "
              "ob die Zeichenkodierung stimmt.", ""]

    z += ["## Blöcke", "",
          "*Automatisch über gemeinsame Namenspräfixe gebildet — entspricht meist der "
          "Gliederung des Formulars.*", "", "| Block | Spalten |", "| --- | --- |"]
    for gruppe, mitglieder in gruppiere(namen).items():
        z.append(f"| `{gruppe}` | {len(mitglieder)} |")
    z.append("")

    z += ["## Alle Spalten in Reihenfolge", "",
          "| # | Spaltenname | Block | Art | Hinweis |", "| --- | --- | --- | --- | --- |"]
    gruppen_von = {n: g for g, ms in gruppiere(namen).items() for n in ms}
    for i, n in enumerate(namen, 1):
        t = n.strip()
        art = "Anzeige?" if TEXT_MUSTER.match(t) else "Daten"
        hinweise = []
        if n in b["mehrfach"]:
            hinweise.append(f"**mehrfach** ({', '.join(map(str, b['mehrfach'][n]))})")
        if n != t:
            hinweise.append("**Leerzeichen am Rand**")
        if re.search(r"[./§%&]", t):
            hinweise.append("Sonderzeichen")
        if " " in t:
            hinweise.append("Leerzeichen im Namen")
        anzeige = f"`{n}`" + ("␣" if n != t else "")
        z.append(f"| {i} | {anzeige} | {gruppen_von.get(n, '')} | {art} | "
                 f"{' · '.join(hinweise)} |")
    return "\n".join(z) + "\n"


def vergleich(a: list[str], b: list[str], titel_a: str, titel_b: str) -> str:
    na = {normalisiere(x) for x in a}
    nb = {normalisiere(x) for x in b}
    gemeinsam = sorted(na & nb)
    ba, bb = befunde(a), befunde(b)
    z = [f"# Vergleich: {titel_a} gegen {titel_b}", "",
         "> Erzeugt mit `werkzeuge/spaltenanalyse.py --vergleich`. Verglichen werden "
         "normalisierte Namen (Umlaute aufgelöst, Trennzeichen vereinheitlicht).", "",
         "| | " + titel_a + " | " + titel_b + " |", "| --- | --- | --- |",
         f"| Spalten | {ba['anzahl']} | {bb['anzahl']} |",
         f"| Doppelte Namen | {len(ba['mehrfach'])} | {len(bb['mehrfach'])} |",
         f"| Mutmaßliche Anzeigetexte | {len(ba['anzeigetexte'])} | {len(bb['anzeigetexte'])} |",
         f"| Namensschemata | {len(ba['schemata'])} | {len(bb['schemata'])} |", "",
         f"## Gemeinsame Felder: {len(gemeinsam)}", ""]
    if gemeinsam:
        z += ["| Normalisierter Name |", "| --- |"] + [f"| `{x}` |" for x in gemeinsam]
    else:
        z.append("Keine gemeinsamen Feldnamen.")
    z += ["", "## Einordnung", "",
          f"Bei {len(gemeinsam)} gemeinsamen von {ba['anzahl']} bzw. {bb['anzahl']} Spalten "
          + ("handelt es sich um **zwei verschiedene Formate**. Zwei Erhebungen und zwei "
             "Feldmappings — aber eine Umsetzung mit zwei Konfigurationen."
             if len(gemeinsam) < min(ba['anzahl'], bb['anzahl']) / 3 else
             "gibt es eine erhebliche Überschneidung. Prüfen, ob ein gemeinsames Format mit "
             "zwei Ausprägungen genügt."), ""]
    return "\n".join(z) + "\n"


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("spalten", help="Datei mit den Spaltennamen")
    p.add_argument("--vergleich", help="zweite Spaltenliste für einen Vergleich")
    p.add_argument("--titel", default="Export")
    p.add_argument("--titel-vergleich", default="Vergleichsstrecke")
    p.add_argument("-o", "--ausgabe")
    a = p.parse_args(argv)

    namen = lies(a.spalten)
    if a.vergleich:
        text = vergleich(namen, lies(a.vergleich), a.titel, a.titel_vergleich)
    else:
        text = bericht(namen, a.titel)

    if a.ausgabe:
        Path(a.ausgabe).write_text(text, encoding="utf-8")
        print(f"geschrieben: {a.ausgabe}", file=sys.stderr)
    else:
        print(text)

    b = befunde(namen)
    if b["mehrfach"] or b["randleerzeichen"]:
        print(f"ACHTUNG: {len(b['mehrfach'])} doppelte Namen, "
              f"{len(b['randleerzeichen'])} mit Randleerzeichen — Mapping über Position nötig.",
              file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
