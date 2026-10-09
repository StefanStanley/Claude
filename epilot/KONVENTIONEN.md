# Codekonventionen

Dieses Verzeichnis folgt den gängigen Python-Standards, nicht einer Hauskonvention:
**PEP 8** für den Code, **PEP 257 mit Google-Style-Docstrings** für die Dokumentation,
**PEP 484 Typannotationen** für die Signaturen, **Conventional Commits** für die Historie.

Die Regeln stehen maschinenlesbar in [`pyproject.toml`](./pyproject.toml). Das ist die
eigentliche Festlegung — eine Konvention, die niemand prüft, wird nicht eingehalten.

```bash
pip install ruff
ruff check .        # prüft Stil, Docstrings, Annotationen, Importreihenfolge
```

`ruff check .` läuft ohne Befund durch. Wer etwas ergänzt, lässt es vorher laufen.

**Die automatische Formatierung (`ruff format`) ist bewusst nicht eingeschaltet.** Sie
würde die von Hand ausgerichteten Tabellenaufrufe in `mappe_bauen.py` auseinanderziehen,
ohne sie lesbarer zu machen. Die Zeilenlänge von 100 Zeichen ist geprüft, der Rest ist
Handarbeit. Wer das ändern will, macht daraus einen eigenen Commit — sonst verschwindet
die nächste inhaltliche Änderung in einem Formatierungsdiff.

## Docstrings: Google-Style

Erste Zeile ist eine Aussage im Imperativ, dann eine Leerzeile, dann der Grund. Die
strukturierten Abschnitte heißen `Args:`, `Returns:`, `Raises:`, `Beispiel:`.

```python
def lege_ab(inhalt: bytes, cfg: Config, zeitpunkt: datetime) -> Path:
    """Datei atomar im Zielverzeichnis ablegen.

    Erst unter temporärem Namen schreiben, dann umbenennen: Sonst holt der
    SAP-Job irgendwann eine halb geschriebene Datei ab.

    Args:
        inhalt: Fertiger Dateiinhalt als Bytes, bereits in der Zielkodierung.
        cfg: Konfiguration; maßgeblich sind `ablage.verzeichnis` und `ablage.dateiname`.
        zeitpunkt: Zeitstempel für das strftime-Muster im Dateinamen.

    Returns:
        Pfad der abgelegten Datei.

    Raises:
        OSError: Zielverzeichnis nicht beschreibbar oder Umbenennen fehlgeschlagen.
    """
```

Warum Google und nicht reST oder NumPy: Google-Style ist ohne Schulung lesbar — auch für
jemanden, der die Datei im Browser öffnet und kein Python schreibt. Sphinx versteht ihn
über `napoleon`, `mkdocstrings` und `pdoc` ebenfalls.

**Das „Warum" gehört in den Docstring, das „Was" in den Code.** Ein Docstring, der die
Signatur in Prosa wiederholt, ist Ballast. Ein Docstring, der die getroffene Entscheidung
begründet, überlebt die nächste Änderung.

**Sprache ist Deutsch.** Die Fachbegriffe der Domäne sind deutsch (Einspeiser, Zählpunkt,
Inbetriebsetzung); eine Übersetzung in den Bezeichnern erzeugt nur eine zweite Vokabel für
dieselbe Sache. Ausgenommen sind Feldnamen fremder Systeme — die stehen so da, wie die API
sie schreibt.

## Was jede Datei mitbringt

| Ebene | Pflicht |
| --- | --- |
| Modul | Docstring: wozu das Modul da ist; bei aufrufbaren Werkzeugen der Aufruf als Beispiel |
| Öffentliche Funktion | Docstring mit `Args:`/`Returns:`, vollständige Typannotationen |
| Ausnahmeklasse | Docstring, der sagt, **wann** sie fliegt — nicht, dass sie eine Ausnahme ist |
| Modul-Konstante | Zeilenkommentar, wenn der Name nicht genügt |
| Private Funktion (`_name`) | Annotationen; Docstring nur, wenn etwas nicht offensichtlich ist |
| Test | kein Docstring nötig — der Testname ist die Dokumentation |

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):
`feat(bereich):`, `fix(bereich):`, `docs(bereich):`, `refactor(bereich):`, `chore(bereich):`.
Der Betreff sagt, was sich ändert; der Rumpf, warum.

## Dokumentation jenseits des Codes

- **Konzepte** in `schnittstellenkonzept/` tragen eine Kennung (`SK-001`) und einen Stand
  (`Entwurf 0.7`). Getroffene Annahmen und **korrigierte Irrtümer** stehen darin benannt.
- **Wissensstand** in `CLAUDE.md` — was eine neue Session wissen muss.
- **Verfahren** in `.claude/skills/epilot-abloesung/` — wie vorgegangen wird, nicht wie
  weit man ist.
