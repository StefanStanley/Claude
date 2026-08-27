# Databricks notebook source
# MAGIC %md
# MAGIC # VDE-Regelwerkszugaenge – automatischer Abgleich
# MAGIC
# MAGIC Liest den **Soll-Zustand** aus der SharePoint-Liste, vergleicht ihn mit dem
# MAGIC **Ist-Bestand** (Delta-Tabelle) und erzeugt eine priorisierte Aufgabenliste
# MAGIC inklusive fertiger Mail.
# MAGIC
# MAGIC Das VDE-Portal wird **nicht** automatisch veraendert – es gibt dort keine API.
# MAGIC Anlegen und Entziehen bleiben ein manueller Klick, aber ohne die Sucherei davor.
# MAGIC
# MAGIC **Erster Lauf:** `dry_run = true` lassen. Es wird nichts geschrieben und
# MAGIC keine Mail versendet, der Bericht erscheint nur hier im Notebook.

# COMMAND ----------

# MAGIC %md ## 1. Parameter

# COMMAND ----------

dbutils.widgets.text("katalog", "governance", "Unity Catalog")
dbutils.widgets.text("schema", "vde_zugang", "Schema")
dbutils.widgets.text("secret_scope", "vde-zugang", "Secret Scope")
dbutils.widgets.text("sp_site_hostname", "", "SharePoint Hostname (contoso.sharepoint.com)")
dbutils.widgets.text("sp_site_pfad", "/sites/Netzbetrieb", "SharePoint Site-Pfad")
dbutils.widgets.text("sp_liste", "VDE-Zugaenge", "Name der SharePoint-Liste")
dbutils.widgets.text("vorlauf_tage", "30", "Vorlauf fuer Austritt/Ablauf (Tage)")
dbutils.widgets.text("empfaenger", "", "Mail-Empfaenger (Komma-getrennt)")
dbutils.widgets.text("absender", "", "Absender-Postfach (nur bei Graph-Versand)")
dbutils.widgets.text("portal_export_pfad", "", "Optional: CSV-Export aus dem VDE-Portal")
dbutils.widgets.dropdown("dry_run", "true", ["true", "false"], "Testlauf ohne Aenderungen")
dbutils.widgets.dropdown("mail_versand", "aus", ["aus", "graph", "smtp"], "Mailversand")
dbutils.widgets.dropdown("auto_bestaetigen", "false", ["true", "false"], "Massnahmen sofort als erledigt buchen")

# COMMAND ----------

# MAGIC %md ## 2. Modul laden
# MAGIC Das Notebook liegt im Git-Ordner neben `../src`. Falls die Struktur abweicht,
# MAGIC hier den Pfad anpassen.

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

from vde_zugang.konfiguration import LaufKonfig, MailKonfig, SharePointKonfig  # noqa: E402
from vde_zugang.lauf import fuehre_abgleich_aus  # noqa: E402

print("Modul geladen.")

# COMMAND ----------

# MAGIC %md ## 3. Konfiguration zusammenbauen
# MAGIC Zugangsdaten kommen ausschliesslich aus dem Secret Scope, nie aus dem Code.
# MAGIC
# MAGIC Benoetigte Secrets:
# MAGIC * `graph-tenant-id`, `graph-client-id`, `graph-client-secret`
# MAGIC * nur bei SMTP-Versand zusaetzlich: `smtp-host`, `smtp-benutzer`, `smtp-passwort`

# COMMAND ----------

SCOPE = dbutils.widgets.get("secret_scope")


def secret(name: str, standard: str = "") -> str:
    try:
        return dbutils.secrets.get(scope=SCOPE, key=name)
    except Exception:  # Secret nicht gesetzt -> Standard verwenden
        return standard


versandart = dbutils.widgets.get("mail_versand")
empfaenger = [e.strip() for e in dbutils.widgets.get("empfaenger").split(",") if e.strip()]

sharepoint = SharePointKonfig(
    tenant_id=secret("graph-tenant-id"),
    client_id=secret("graph-client-id"),
    client_secret=secret("graph-client-secret"),
    site_hostname=dbutils.widgets.get("sp_site_hostname"),
    site_pfad=dbutils.widgets.get("sp_site_pfad"),
    listen_name=dbutils.widgets.get("sp_liste"),
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

mail = MailKonfig(
    versandart=versandart,
    empfaenger=empfaenger,
    absender=dbutils.widgets.get("absender"),
    smtp_host=secret("smtp-host"),
    smtp_port=int(secret("smtp-port", "587")),
    smtp_benutzer=secret("smtp-benutzer"),
    smtp_passwort=secret("smtp-passwort"),
)

konfig = LaufKonfig(
    katalog=dbutils.widgets.get("katalog"),
    schema=dbutils.widgets.get("schema"),
    vorlauf_tage=int(dbutils.widgets.get("vorlauf_tage")),
    dry_run=dbutils.widgets.get("dry_run") == "true",
    auto_bestaetigen=dbutils.widgets.get("auto_bestaetigen") == "true",
    portal_export_pfad=dbutils.widgets.get("portal_export_pfad").strip(),
    sharepoint=sharepoint,
    mail=mail,
)

print(f"Ziel: {konfig.bestand_tabelle} | Testlauf: {konfig.dry_run} | Versand: {mail.versandart}")

# COMMAND ----------

# MAGIC %md ## 4. Abgleich ausfuehren

# COMMAND ----------

ergebnis = fuehre_abgleich_aus(spark, konfig)

print(f"Lauf-ID:  {ergebnis.lauf_id}")
print(f"Bestand:  {ergebnis.bestand_status}")
print(f"Mail:     {ergebnis.mail_status}")

# COMMAND ----------

# MAGIC %md ## 5. Aufgabenliste

# COMMAND ----------

displayHTML(ergebnis.html)

# COMMAND ----------

# MAGIC %md ### Als Tabelle (filter- und exportierbar)

# COMMAND ----------

if ergebnis.abgleich.massnahmen:
    display(spark.createDataFrame([m.als_dict() for m in ergebnis.abgleich.massnahmen]))
else:
    print("Keine offenen Aufgaben.")

# COMMAND ----------

# MAGIC %md ## 6. Datenqualitaet in der SharePoint-Liste

# COMMAND ----------

for hinweis in ergebnis.abgleich.warnungen:
    print("-", hinweis)
if not ergebnis.abgleich.warnungen:
    print("Keine Auffaelligkeiten.")

# COMMAND ----------

# MAGIC %md ## 7. Nach der Umsetzung: Massnahmen bestaetigen
# MAGIC
# MAGIC Sobald die Aufgaben im VDE-Portal erledigt sind, den Bestand fortschreiben –
# MAGIC sonst schlaegt der naechste Lauf dieselben Aufgaben erneut vor.
# MAGIC Die Lauf-ID steht in Schritt 4.

# COMMAND ----------

# from vde_zugang.lauf import bestaetige_erledigte_massnahmen
# anzahl = bestaetige_erledigte_massnahmen(spark, konfig, lauf_id="<Lauf-ID einsetzen>")
# print(f"{anzahl} Massnahmen in den Bestand uebernommen.")

# COMMAND ----------

dbutils.notebook.exit(
    f"{len(ergebnis.abgleich.massnahmen)} offene Aufgaben | {ergebnis.mail_status}"
)
