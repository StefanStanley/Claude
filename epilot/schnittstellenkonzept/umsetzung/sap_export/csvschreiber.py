"""Die CSV byte-genau erzeugen und atomar ablegen.

Der Kern der ganzen Strecke. SAP nimmt die Datei oder nicht - es gibt keine
Verhandlung über das Format und keine Rückmeldung, wenn es nicht passt.
"""
from __future__ import annotations

import csv
import io
import os
from pathlib import Path

from .config import Config

QUOTING = {
    "minimal": csv.QUOTE_MINIMAL,
    "all": csv.QUOTE_ALL,
    "keines": csv.QUOTE_NONE,
}


class KodierungsFehler(Exception):
    """Ein Zeichen lässt sich in der Zielkodierung nicht darstellen.

    Tritt typischerweise auf, wenn die Zieldatei Windows-1252 verlangt und ein
    Name oder Ort ein Zeichen außerhalb dieses Vorrats enthält. Niemals still
    ersetzen: aus 'Ł' würde '?' und niemand merkt es.
    """


def zeile_als_text(werte: list[str], cfg: Config) -> str:
    """Eine Werteliste in eine CSV-Zeile umwandeln - ohne Zeilenende."""
    puffer = io.StringIO()
    schreiber = csv.writer(
        puffer,
        delimiter=cfg.format.trennzeichen,
        quotechar=cfg.format.textbegrenzer or '"',
        quoting=QUOTING[cfg.format.quoting],
        doublequote=cfg.format.doppelte_begrenzer,
        escapechar=None if cfg.format.doppelte_begrenzer else "\\",
        lineterminator="",
    )
    schreiber.writerow(werte)
    return puffer.getvalue()


def pruefe_kodierbar(text: str, cfg: Config) -> None:
    """Wirft KodierungsFehler, wenn ein Zeichen in der Zielkodierung fehlt."""
    try:
        text.encode(cfg.format.kodierung, errors="strict")
    except UnicodeEncodeError as e:
        zeichen = text[e.start:e.end]
        raise KodierungsFehler(
            f"Zeichen {zeichen!r} (Position {e.start}) lässt sich nicht in "
            f"{cfg.format.kodierung} darstellen"
        ) from e


def baue_datei(zeilen: list[list[str]], cfg: Config) -> bytes:
    """Den vollständigen Dateiinhalt als Bytes erzeugen.

    Bewusst im Speicher: die Dateien sind klein, und so lässt sich der Inhalt
    im Test byteweise gegen ein Original vergleichen.
    """
    teile: list[str] = []
    if cfg.format.kopfzeile:
        teile.append(zeile_als_text([s.name for s in cfg.spalten], cfg))
    teile.extend(zeile_als_text(w, cfg) for w in zeilen)

    inhalt = cfg.format.newline.join(teile)
    if teile:
        inhalt += cfg.format.newline          # abschließendes Zeilenende

    roh = inhalt.encode(cfg.format.kodierung, errors="strict")
    if cfg.format.bom:
        if cfg.format.kodierung.lower().replace("-", "") in ("utf8", "u8"):
            roh = b"\xef\xbb\xbf" + roh
        else:
            raise KodierungsFehler(
                f"BOM ist für Kodierung '{cfg.format.kodierung}' nicht vorgesehen"
            )
    return roh


def lege_ab(inhalt: bytes, cfg: Config, zeitpunkt) -> Path:
    """Datei atomar im Zielverzeichnis ablegen.

    Erst unter temporärem Namen schreiben, dann umbenennen: Sonst holt der
    SAP-Job irgendwann eine halb geschriebene Datei ab. os.replace ist innerhalb
    eines Dateisystems atomar; auf einem SMB-Netzlaufwerk hängt das an Server und
    Protokollversion - deshalb liegt die temporäre Datei im selben Verzeichnis
    und trägt eine Endung, die der Importjob nicht abholt.
    """
    verzeichnis = Path(cfg.ablage.verzeichnis)
    verzeichnis.mkdir(parents=True, exist_ok=True)
    ziel = verzeichnis / zeitpunkt.strftime(cfg.ablage.dateiname)
    temp = ziel.with_name(ziel.name + cfg.ablage.temp_endung)

    with open(temp, "wb") as f:
        f.write(inhalt)
        f.flush()
        os.fsync(f.fileno())
    os.replace(temp, ziel)
    return ziel
