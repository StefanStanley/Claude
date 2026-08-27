"""Konfiguration des Abgleichlaufs.

Alle Werte kommen aus Databricks-Widgets (Job-Parameter) und Secrets.
Im Code stehen keine Zugangsdaten.
"""

from __future__ import annotations

from dataclasses import dataclass, field


# Zuordnung: interner Name -> Spaltenname (bzw. interner Name) in der SharePoint-Liste.
# Nur hier anpassen, wenn die Liste andere Spaltenueberschriften hat.
STANDARD_FELDER: dict[str, str] = {
    "personalnummer": "Personalnummer",
    "name": "Title",  # SharePoint nennt die erste Spalte intern immer "Title"
    "email": "EMail",
    "abteilung": "Abteilung",
    "status": "Status",
    "austritt": "Austrittsdatum",
    "regelwerke": "Regelwerke",
    "gueltig_bis": "GueltigBis",
    "begruendung": "Begruendung",
    "kostenstelle": "Kostenstelle",
}

# Werte in der Status-Spalte, die als "aktiv beschaeftigt" gelten.
AKTIV_WERTE = {"aktiv", "active", "ja", "yes", "true", "1", "beschaeftigt", "beschäftigt", ""}


@dataclass
class SharePointKonfig:
    tenant_id: str
    client_id: str
    client_secret: str = field(repr=False, default="")
    site_hostname: str = ""       # z.B. "contoso.sharepoint.com"
    site_pfad: str = ""           # z.B. "/sites/Netzbetrieb"
    listen_name: str = ""         # Anzeigename oder ID der Liste
    felder: dict[str, str] = field(default_factory=lambda: dict(STANDARD_FELDER))
    trennzeichen: str = ";"       # falls Regelwerke als Text-Spalte gepflegt werden

    def __post_init__(self) -> None:
        # Nur explizit gesetzte Felder ueberschreiben die Standardzuordnung.
        zusammengefuehrt = dict(STANDARD_FELDER)
        zusammengefuehrt.update({k: v for k, v in self.felder.items() if v})
        self.felder = zusammengefuehrt


@dataclass
class MailKonfig:
    versandart: str = "aus"            # "graph" | "smtp" | "aus"
    empfaenger: list[str] = field(default_factory=list)
    absender: str = ""
    betreff_praefix: str = "[VDE-Zugaenge]"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_benutzer: str = ""
    smtp_passwort: str = field(repr=False, default="")
    nur_bei_aufgaben: bool = True      # keine Mail, wenn nichts zu tun ist

    @property
    def aktiv(self) -> bool:
        return self.versandart in {"graph", "smtp"} and bool(self.empfaenger)


@dataclass
class PortalKonfig:
    """Anbindung an das VDE-Portal."""

    modus: str = "aufgabenliste"        # "browser" = ausfuehren, "aufgabenliste" = nur melden
    basis_url: str = ""
    benutzer: str = ""
    passwort: str = field(repr=False, default="")
    selektoren_pfad: str = ""           # JSON mit den Portal-Selektoren
    sitzung_pfad: str = ""              # optional: gespeicherter Anmeldezustand
    chromium_pfad: str = ""             # leer = von Playwright mitgeliefertes Chromium
    screenshot_verzeichnis: str = ""    # Ablage fuer Fehler-Screenshots (UC-Volume)
    langsam_ms: int = 0                 # >0 verlangsamt jede Aktion (Fehlersuche)
    versuche: int = 2

    # Notbremse - Grenzen, ab denen der Lauf lieber gar nichts aendert
    max_entzuege: int = 10
    max_aenderungen: int = 40
    anteil_entzug_grenze: float = 0.30

    @property
    def fuehrt_aus(self) -> bool:
        return self.modus == "browser"


@dataclass
class LaufKonfig:
    katalog: str = "governance"
    schema: str = "vde_zugang"
    tabelle_bestand: str = "bestand"
    tabelle_massnahmen: str = "massnahmen"
    vorlauf_tage: int = 30
    dry_run: bool = True
    auto_bestaetigen: bool = False
    portal_export_pfad: str = ""       # optionaler CSV-Export aus dem VDE-Portal
    sharepoint: SharePointKonfig | None = None
    portal: PortalKonfig = field(default_factory=PortalKonfig)
    mail: MailKonfig = field(default_factory=MailKonfig)

    def voll(self, tabelle: str) -> str:
        return f"{self.katalog}.{self.schema}.{tabelle}"

    @property
    def bestand_tabelle(self) -> str:
        return self.voll(self.tabelle_bestand)

    @property
    def massnahmen_tabelle(self) -> str:
        return self.voll(self.tabelle_massnahmen)
