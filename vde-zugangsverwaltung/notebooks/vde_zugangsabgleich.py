# Databricks notebook source
# MAGIC %md
# MAGIC # VDE-Regelwerkszugaenge – automatischer Abgleich und Ausfuehrung
# MAGIC
# MAGIC Der Job liest den **Soll-Zustand** aus der SharePoint-Liste, den **Ist-Zustand**
# MAGIC direkt aus der Normenbibliothek, und setzt die Differenz dort selbst um:
# MAGIC Zugaenge anlegen, entziehen, verlaengern.
# MAGIC
# MAGIC **Reihenfolge der Inbetriebnahme:**
# MAGIC 1. `portal_modus = aufgabenliste`, `dry_run = true` – nur sehen, was anstuende
# MAGIC 2. `portal_modus = browser`, `dry_run = true` – Portal wird gelesen, nichts geaendert
# MAGIC 3. `portal_modus = browser`, `dry_run = false` – Echtbetrieb
# MAGIC
# MAGIC Schritt 2 ist der wichtige: erst wenn der gelesene Ist-Bestand zum Portal passt,
# MAGIC darf geschrieben werden.

# COMMAND ----------

# MAGIC %md ## 1. Parameter

# COMMAND ----------

dbutils.widgets.text("katalog", "governance", "Unity Catalog")
dbutils.widgets.text("schema", "vde_zugang", "Schema")
dbutils.widgets.text("secret_scope", "vde-zugang", "Secret Scope")

dbutils.widgets.text("sp_site_hostname", "", "SharePoint Hostname (contoso.sharepoint.com)")
dbutils.widgets.text("sp_site_pfad", "/sites/Netzbetrieb", "SharePoint Site-Pfad")
dbutils.widgets.text("sp_liste", "VDE-Zugaenge", "Name der SharePoint-Liste")

dbutils.widgets.dropdown("portal_modus", "aufgabenliste", ["aufgabenliste", "browser"],
                         "Portal: nur melden oder ausfuehren")
dbutils.widgets.text("portal_url", "", "Basis-URL der Normenbibliothek")
dbutils.widgets.text("selektoren_pfad", "", "JSON mit den Portal-Selektoren (Volume-Pfad)")
dbutils.widgets.text("screenshot_pfad", "", "Ablage fuer Fehler-Screenshots (Volume-Pfad)")

dbutils.widgets.text("vorlauf_tage", "30", "Vorlauf fuer Austritt/Ablauf (Tage)")
dbutils.widgets.text("max_entzuege", "10", "Notbremse: max. Entzuege je Lauf")
dbutils.widgets.text("max_aenderungen", "40", "Notbremse: max. Aenderungen je Lauf")

dbutils.widgets.text("empfaenger", "", "Mail-Empfaenger (Komma-getrennt)")
dbutils.widgets.text("absender", "", "Absender-Postfach (nur bei Graph-Versand)")
dbutils.widgets.dropdown("dry_run", "true", ["true", "false"], "Testlauf ohne Aenderungen")
dbutils.widgets.dropdown("mail_versand", "aus", ["aus", "graph", "smtp"], "Mailversand")

# COMMAND ----------

# MAGIC %md ## 2. Modul laden

# COMMAND ----------

import logging
import os
import sys

# In Databricks Git-Ordnern ist das Arbeitsverzeichnis der Notebook-Ordner.
_kandidaten = [
    os.path.abspath(os.path.join(os.getcwd(), "..", "src")),
    os.path.abspath(os.path.join(os.getcwd(), "src")),
    "/Workspace/Repos/vde-zugangsverwaltung/src",
]
for _pfad in _kandidaten:
    if os.path.isdir(_pfad) and _pfad not in sys.path:
        sys.path.insert(0, _pfad)
        break
else:
    raise RuntimeError(
        f"Ordner 'src' nicht gefunden. Gesucht in: {_kandidaten}. "
        "Pfad hier eintragen oder das Notebook im Git-Ordner belassen."
    )

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

from vde_zugang.konfiguration import (  # noqa: E402
    LaufKonfig, MailKonfig, PortalKonfig, SharePointKonfig,
)
from vde_zugang.lauf import fuehre_abgleich_aus  # noqa: E402

print("Modul geladen.")

# COMMAND ----------

# MAGIC %md ### Browser pruefen
# MAGIC Nur noetig im Modus `browser`. Playwright und Chromium gehoeren auf den
# MAGIC Cluster, nicht in jeden Lauf: `resources/init_playwright.sh` als
# MAGIC Cluster-Init-Script hinterlegen (Compute -> Advanced -> Init Scripts).
# MAGIC
# MAGIC Fuer einen schnellen Test ohne Init-Script in einer eigenen Zelle:
# MAGIC `%pip install playwright==1.49.0` und danach
# MAGIC `!playwright install --with-deps chromium`.

# COMMAND ----------

if dbutils.widgets.get("portal_modus") == "browser":
    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as _p:
            _b = _p.chromium.launch(args=["--no-sandbox"])
            print(f"Chromium einsatzbereit: {_b.version}")
            _b.close()
    except Exception as _fehler:
        raise RuntimeError(
            "Browser nicht einsatzbereit: "
            f"{_fehler}\n\nInit-Script resources/init_playwright.sh am Cluster "
            "hinterlegen oder den Modus auf 'aufgabenliste' stellen."
        ) from _fehler
else:
    print("Modus 'aufgabenliste' - es wird kein Browser gebraucht.")

# COMMAND ----------

# MAGIC %md ## 3. Konfiguration
# MAGIC Zugangsdaten kommen ausschliesslich aus dem Secret Scope.
# MAGIC
# MAGIC Benoetigte Secrets:
# MAGIC * `graph-tenant-id`, `graph-client-id`, `graph-client-secret` (SharePoint)
# MAGIC * `portal-benutzer`, `portal-passwort` (Normenbibliothek)
# MAGIC * nur bei SMTP-Versand: `smtp-host`, `smtp-benutzer`, `smtp-passwort`

# COMMAND ----------

SCOPE = dbutils.widgets.get("secret_scope")


def secret(name: str, standard: str = "") -> str:
    try:
        return dbutils.secrets.get(scope=SCOPE, key=name)
    except Exception:  # Secret nicht gesetzt -> Standard verwenden
        return standard


def widget(name: str, standard: str = "") -> str:
    return dbutils.widgets.get(name).strip() or standard


sharepoint = SharePointKonfig(
    tenant_id=secret("graph-tenant-id"),
    client_id=secret("graph-client-id"),
    client_secret=secret("graph-client-secret"),
    site_hostname=widget("sp_site_hostname"),
    site_pfad=widget("sp_site_pfad"),
    listen_name=widget("sp_liste"),
    # Spaltennamen der Liste hier anpassen, falls sie abweichen:
    felder={
        "personalnummer": "Personalnummer",
        "name": "Title",
        "email": "EMail",
        "abteilung": "Abteilung",
        "status": "Status",
        "austritt": "Austrittsdatum",
        "regelwerke": "Regelwerke",
        "gueltig_bis": "GueltigBis",
        "begruendung": "Begruendung",
        "kostenstelle": "Kostenstelle",
    },
)

portal = PortalKonfig(
    modus=widget("portal_modus", "aufgabenliste"),
    basis_url=widget("portal_url"),
    benutzer=secret("portal-benutzer"),
    passwort=secret("portal-passwort"),
    selektoren_pfad=widget("selektoren_pfad"),
    screenshot_verzeichnis=widget("screenshot_pfad"),
    max_entzuege=int(widget("max_entzuege", "10")),
    max_aenderungen=int(widget("max_aenderungen", "40")),
)

mail = MailKonfig(
    versandart=widget("mail_versand", "aus"),
    empfaenger=[e.strip() for e in widget("empfaenger").split(",") if e.strip()],
    absender=widget("absender"),
    smtp_host=secret("smtp-host"),
    smtp_port=int(secret("smtp-port", "587")),
    smtp_benutzer=secret("smtp-benutzer"),
    smtp_passwort=secret("smtp-passwort"),
)

konfig = LaufKonfig(
    katalog=widget("katalog", "governance"),
    schema=widget("schema", "vde_zugang"),
    vorlauf_tage=int(widget("vorlauf_tage", "30")),
    dry_run=widget("dry_run") == "true",
    sharepoint=sharepoint,
    portal=portal,
    mail=mail,
)

print(
    f"Portal-Modus: {portal.modus} | Testlauf: {konfig.dry_run} | "
    f"Notbremse: max {portal.max_entzuege} Entzuege, {portal.max_aenderungen} Aenderungen"
)
if portal.fuehrt_aus and not konfig.dry_run:
    print("ACHTUNG: Dieser Lauf veraendert das VDE-Portal.")

# COMMAND ----------

# MAGIC %md ## 4. Lauf ausfuehren

# COMMAND ----------

ergebnis = fuehre_abgleich_aus(spark, konfig)

print(f"Lauf-ID:  {ergebnis.lauf_id}")
print(f"Portal:   {ergebnis.ausfuehrung.zusammenfassung()}")
print(f"Bestand:  {ergebnis.bestand_status}")
print(f"Mail:     {ergebnis.mail_status}")

# COMMAND ----------

# MAGIC %md ## 5. Ergebnis

# COMMAND ----------

displayHTML(ergebnis.html)

# COMMAND ----------

# MAGIC %md ### Fehlgeschlagene Aktionen
# MAGIC Diese brauchen eine manuelle Nachkontrolle. Screenshots liegen im
# MAGIC konfigurierten Volume-Pfad.

# COMMAND ----------

if ergebnis.ausfuehrung.fehlgeschlagen:
    for e in ergebnis.ausfuehrung.fehlgeschlagen:
        print(f"[{e.massnahme.aktion.value}] {e.massnahme.name} / {e.massnahme.regelwerk}")
        print(f"    {e.meldung}")
        if e.screenshot:
            print(f"    Screenshot: {e.screenshot}")
else:
    print("Keine fehlgeschlagenen Aktionen.")

# COMMAND ----------

# MAGIC %md ### Alle Massnahmen als Tabelle

# COMMAND ----------

if ergebnis.ausfuehrung.ergebnisse:
    display(spark.createDataFrame([e.als_dict() for e in ergebnis.ausfuehrung.ergebnisse]))
else:
    print("Keine Massnahmen.")

# COMMAND ----------

# MAGIC %md ## 6. Datenqualitaet in der SharePoint-Liste

# COMMAND ----------

for hinweis in ergebnis.abgleich.warnungen:
    print("-", hinweis)
if not ergebnis.abgleich.warnungen:
    print("Keine Auffaelligkeiten.")

# COMMAND ----------

dbutils.notebook.exit(
    f"{ergebnis.ausfuehrung.zusammenfassung()} | {ergebnis.mail_status}"
)
