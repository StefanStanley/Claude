"""Ein kleines Portal-Double zum Testen der Browser-Automatisierung.

Bildet die Bedienschritte der Normenbibliothek nach: anmelden, Benutzerliste,
Zugang anlegen, Zugang entziehen (mit Sicherheitsabfrage), Gueltigkeit aendern.
Damit laesst sich die Automatisierung vollstaendig pruefen, ohne das echte
Portal anzufassen - und spaeter der Umbau auf neue Selektoren gegentesten.

Direkt startbar:  python3 tests/fake_portal.py  ->  http://127.0.0.1:8799
"""

from __future__ import annotations

import html
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

BENUTZER = "admin@firma.de"
PASSWORT = "geheim"

STARTBESTAND = [
    {"pnr": "10023", "email": "anna.beispiel@firma.de", "name": "Anna Beispiel",
     "regelwerke": ["VDE-AR-N-4100"], "gueltig_bis": "2027-12-31", "status": "aktiv"},
    {"pnr": "10024", "email": "bernd.muster@firma.de", "name": "Bernd Muster",
     "regelwerke": ["VDE-0100", "VDE-0105"], "gueltig_bis": "", "status": "aktiv"},
]

_STIL = "<style>body{font-family:sans-serif}td{padding:4px 8px}</style>"


class Zustand:
    def __init__(self):
        self.benutzer = [dict(b, regelwerke=list(b["regelwerke"])) for b in STARTBESTAND]
        self.angemeldet = False
        self.aufrufe: list[str] = []

    def finde(self, pnr: str):
        return next((b for b in self.benutzer if b["pnr"] == pnr), None)


class Handler(BaseHTTPRequestHandler):
    zustand: Zustand = None  # wird beim Start gesetzt

    def log_message(self, *_):
        pass  # keine Konsolenausgabe im Test

    # ------------------------------------------------------------ Hilfsmittel
    def _senden(self, koerper: str, code: int = 200):
        daten = koerper.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(daten)))
        self.end_headers()
        self.wfile.write(daten)

    def _umleiten(self, ziel: str):
        self.send_response(303)
        self.send_header("Location", ziel)
        self.end_headers()

    def _formulardaten(self) -> dict:
        laenge = int(self.headers.get("Content-Length") or 0)
        roh = self.rfile.read(laenge).decode("utf-8")
        return {k: v[0] for k, v in parse_qs(roh).items()}

    def _kopf(self) -> str:
        return f"{_STIL}<div id='angemeldet'>Angemeldet als {BENUTZER}</div>"

    # ---------------------------------------------------------------- Seiten
    def _seite_login(self, fehler: str = "") -> str:
        meldung = f"<p id='loginfehler'>{html.escape(fehler)}</p>" if fehler else ""
        return f"""{_STIL}<h1>VDE Normenbibliothek – Anmeldung</h1>{meldung}
        <form method="post" action="/login">
          <input id="benutzer" name="benutzer" placeholder="Benutzer">
          <input id="passwort" name="passwort" type="password" placeholder="Passwort">
          <button id="anmelden" type="submit">Anmelden</button>
        </form>"""

    def _seite_liste(self, erfolg: str = "") -> str:
        zeilen = []
        for b in self.zustand.benutzer:
            knoepfe = "".join(
                f'<form method="post" action="/entziehen" style="display:inline">'
                f'<input type="hidden" name="pnr" value="{b["pnr"]}">'
                f'<input type="hidden" name="regelwerk" value="{r}">'
                f'<button class="entziehen" data-regelwerk="{r}" type="submit">x</button></form>'
                for r in b["regelwerke"]
            )
            zeilen.append(
                f'<tr class="benutzer" data-pnr="{b["pnr"]}">'
                f'<td class="pnr">{b["pnr"]}</td>'
                f'<td class="email">{b["email"]}</td>'
                f'<td class="name">{html.escape(b["name"])}</td>'
                f'<td class="regelwerke">{", ".join(b["regelwerke"])}</td>'
                f'<td class="gueltig">{b["gueltig_bis"]}</td>'
                f'<td class="status">{b["status"]}</td>'
                f'<td>{knoepfe}<a class="bearbeiten" href="/admin/benutzer/{b["pnr"]}">Bearbeiten</a></td>'
                f"</tr>"
            )
        meldung = f"<p id='erfolg'>{html.escape(erfolg)}</p>" if erfolg else ""
        return f"""{self._kopf()}<h1>Benutzer</h1>{meldung}
        <table id="benutzer"><tbody>{"".join(zeilen)}</tbody></table>
        <a href="/admin/benutzer/neu">Neuer Benutzer</a>"""

    def _seite_neu(self) -> str:
        alle = sorted({r for b in self.zustand.benutzer for r in b["regelwerke"]}
                      | {"VDE-AR-N-4100", "VDE-AR-N-4105", "VDE-AR-N-4110", "VDE-0100", "VDE-0105"})
        kaestchen = "".join(
            f'<label><input type="checkbox" name="regelwerke" value="{r}" '
            f'data-regelwerk="{r}"> {r}</label><br>'
            for r in alle
        )
        return f"""{self._kopf()}<h1>Benutzer anlegen</h1>
        <form method="post" action="/admin/benutzer/neu">
          <input id="pnr" name="pnr" placeholder="Personalnummer">
          <input id="email" name="email" placeholder="E-Mail">
          <input id="name" name="name" placeholder="Name">
          <input id="gueltig" name="gueltig" placeholder="gueltig bis">
          {kaestchen}
          <button id="speichern" type="submit">Speichern</button>
        </form>"""

    def _seite_bearbeiten(self, pnr: str) -> str:
        b = self.zustand.finde(pnr)
        if b is None:
            return self._seite_liste("Unbekannter Benutzer")
        return f"""{self._kopf()}<h1>Benutzer {b["pnr"]}</h1>
        <form method="post" action="/admin/benutzer/{pnr}">
          <input id="gueltig" name="gueltig" value="{b['gueltig_bis']}">
          <button id="speichern" type="submit">Speichern</button>
        </form>"""

    def _seite_bestaetigen(self, pnr: str, regelwerk: str) -> str:
        return f"""{self._kopf()}<h1>Zugang entziehen?</h1>
        <p>{regelwerk} für {pnr}</p>
        <form method="post" action="/entziehen/bestaetigt">
          <input type="hidden" name="pnr" value="{pnr}">
          <input type="hidden" name="regelwerk" value="{regelwerk}">
          <button id="bestaetigen" type="submit">Ja, entziehen</button>
        </form>"""

    # ----------------------------------------------------------------- Routen
    def do_GET(self):
        pfad = urlparse(self.path).path
        self.zustand.aufrufe.append(f"GET {pfad}")

        if pfad in ("/", "/login"):
            if self.zustand.angemeldet:
                return self._senden(self._seite_liste())
            return self._senden(self._seite_login())
        if not self.zustand.angemeldet:
            return self._umleiten("/login")
        if pfad == "/admin/benutzer":
            return self._senden(self._seite_liste())
        if pfad == "/admin/benutzer/neu":
            return self._senden(self._seite_neu())
        if pfad.startswith("/admin/benutzer/"):
            return self._senden(self._seite_bearbeiten(pfad.rsplit("/", 1)[-1]))
        return self._senden("<h1>404</h1>", 404)

    def do_POST(self):
        pfad = urlparse(self.path).path
        daten = self._formulardaten()
        self.zustand.aufrufe.append(f"POST {pfad}")

        if pfad == "/login":
            if daten.get("benutzer") == BENUTZER and daten.get("passwort") == PASSWORT:
                self.zustand.angemeldet = True
                return self._umleiten("/admin/benutzer")
            return self._senden(self._seite_login("Benutzer oder Kennwort falsch."), 401)

        if not self.zustand.angemeldet:
            return self._umleiten("/login")

        if pfad == "/admin/benutzer/neu":
            pnr = daten.get("pnr", "").strip()
            regelwerke = [r for r in parse_qs(
                self.headers.get("X-Regelwerke", "")).get("r", [])] or daten.get("regelwerke", "")
            neue = [regelwerke] if isinstance(regelwerke, str) and regelwerke else list(regelwerke)
            vorhanden = self.zustand.finde(pnr)
            if vorhanden:
                vorhanden["regelwerke"] = sorted(set(vorhanden["regelwerke"]) | set(neue))
            else:
                self.zustand.benutzer.append({
                    "pnr": pnr, "email": daten.get("email", ""), "name": daten.get("name", ""),
                    "regelwerke": neue, "gueltig_bis": daten.get("gueltig", ""), "status": "aktiv",
                })
            return self._senden(self._seite_liste("Benutzer gespeichert."))

        if pfad == "/entziehen":
            return self._senden(
                self._seite_bestaetigen(daten.get("pnr", ""), daten.get("regelwerk", ""))
            )

        if pfad == "/entziehen/bestaetigt":
            b = self.zustand.finde(daten.get("pnr", ""))
            if b and daten.get("regelwerk") in b["regelwerke"]:
                b["regelwerke"].remove(daten["regelwerk"])
            return self._senden(self._seite_liste("Zugang entzogen."))

        if pfad.startswith("/admin/benutzer/"):
            b = self.zustand.finde(pfad.rsplit("/", 1)[-1])
            if b:
                b["gueltig_bis"] = daten.get("gueltig", "")
            return self._senden(self._seite_liste("Benutzer gespeichert."))

        return self._senden("<h1>404</h1>", 404)


def starte(port: int = 0) -> tuple[ThreadingHTTPServer, Zustand, str]:
    zustand = Zustand()
    handler = type("GebundenerHandler", (Handler,), {"zustand": zustand})
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, zustand, f"http://127.0.0.1:{server.server_address[1]}"


SELEKTOREN = {
    "pfad_login": "/login",
    "feld_benutzer": "#benutzer",
    "feld_passwort": "#passwort",
    "knopf_anmelden": "#anmelden",
    "marker_angemeldet": "#angemeldet",
    "marker_loginfehler": "#loginfehler",
    "pfad_benutzerliste": "/admin/benutzer",
    "tabelle_benutzer": "#benutzer",
    "zeile_benutzer": "tr.benutzer",
    "zelle_personalnummer": "td.pnr",
    "zelle_email": "td.email",
    "zelle_name": "td.name",
    "zelle_regelwerke": "td.regelwerke",
    "zelle_gueltig_bis": "td.gueltig",
    "zelle_status": "td.status",
    "pfad_benutzer_neu": "/admin/benutzer/neu",
    "feld_neu_personalnummer": "#pnr",
    "feld_neu_email": "#email",
    "feld_neu_name": "#name",
    "auswahl_regelwerk": 'input[data-regelwerk="{regelwerk}"]',
    "feld_gueltig_bis": "#gueltig",
    "knopf_speichern": "#speichern",
    "marker_gespeichert": "#erfolg",
    "knopf_zeile_bearbeiten": "a.bearbeiten",
    "knopf_regelwerk_entziehen": 'tr[data-pnr="{personalnummer}"] button[data-regelwerk="{regelwerk}"]',
    "knopf_bestaetigen": "#bestaetigen",
    "ruhe_nach_aktion_ms": 0,
    "wartezeit_ms": 8000,
}


if __name__ == "__main__":
    server, zustand, url = starte(8799)
    print(f"Portal-Double laeuft auf {url} - Benutzer {BENUTZER} / {PASSWORT}")
    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        server.shutdown()
