# Databricks notebook source
# MAGIC %md
# MAGIC # 02 · SAP-Export · Probelauf
# MAGIC
# MAGIC **Zweck:** Aus echten Vorgängen eine echte CSV-Datei erzeugen und ansehen —
# MAGIC ohne etwas abzulegen und ohne in epilot einen Status zu schreiben.
# MAGIC
# MAGIC **Was dieser Lauf beantwortet:** Welche Werte liefert epilot tatsächlich für
# MAGIC `Energieart` und `Art der Einspeisung`? Beide Wertelisten sind noch leer. Die
# MAGIC Konfiguration lässt unbekannte Werte deshalb **durch**, statt den Vorgang
# MAGIC zurückzuhalten — nur so werden die Rohwerte überhaupt sichtbar.
# MAGIC
# MAGIC **Dieser Strang hängt nicht an der Bronze-Ablage.** Der Export läuft direkt
# MAGIC gegen die Entity API. Bronze ist für Auswertung und Wiederverwendung wertvoll,
# MAGIC aber kein Vorgänger dieser Schnittstelle.
# MAGIC
# MAGIC > **Das ist ein Probelauf, kein Produktivlauf.** Die Konfiguration
# MAGIC > `config.einspeiser.probelauf.yaml` enthält fünf ausdrücklich gekennzeichnete
# MAGIC > ANNAHMEN — Kodierung, Zeilenende, Datumsformat, die Adressquelle und den
# MAGIC > fehlenden Statusfilter.

# COMMAND ----------

# MAGIC %pip install requests PyYAML

# COMMAND ----------

dbutils.library.restartPython()

# COMMAND ----------

# MAGIC %md
# MAGIC ## 1 · Werkzeuge einbinden
# MAGIC
# MAGIC Der Export-Job liegt **nicht** unter `werkzeuge/`, sondern unter
# MAGIC `schnittstellenkonzept/umsetzung/`. Er ist ein eigenes Python-Paket
# MAGIC (`sap_export`) mit 30 Tests.

# COMMAND ----------

import os
import sys

wurzel = os.getcwd()
while wurzel != "/" and not os.path.isdir(os.path.join(wurzel, "werkzeuge")):
    wurzel = os.path.dirname(wurzel)

if wurzel == "/":
    raise RuntimeError("Kein Ordner 'werkzeuge' gefunden. Liegt dieses Notebook im Git-Ordner?")

# Das Verzeichnis, in dem das Paket sap_export liegt — nicht das Paket selbst.
umsetzung = os.path.join(wurzel, "schnittstellenkonzept", "umsetzung")
sys.path.insert(0, umsetzung)

from sap_export.config import Config
from sap_export.csvschreiber import baue_datei
from sap_export.epilot import EntityAPI
from sap_export.mapping import zeile
from sap_export.pruefung import pruefe

print("Umsetzung:", umsetzung)

# COMMAND ----------

# MAGIC %md
# MAGIC ## 2 · Konfiguration laden
# MAGIC
# MAGIC Das Laden prüft die Konfiguration vollständig: unbekannte Kodierung, doppelte
# MAGIC Spaltennamen, unzulässige Werte. Ein Fehler hier bedeutet, dass der Lauf gar
# MAGIC nicht erst startet — gewollt, denn eine halb gültige Konfiguration erzeugt eine
# MAGIC halb gültige Datei.

# COMMAND ----------

cfg = Config.laden(os.path.join(umsetzung, "config.einspeiser.probelauf.yaml"))

print(f"{len(cfg.spalten)} Spalten · {len(cfg.pruefungen)} Prüfungen")
print("Suchausdruck:", cfg.epilot.query)

# COMMAND ----------

# MAGIC %md
# MAGIC ## 3 · Vorgänge holen und abbilden
# MAGIC
# MAGIC Die Schleife macht dasselbe wie der produktive Lauf, nur ohne Ablage und ohne
# MAGIC Statusrückschreibung: prüfen, abbilden, sammeln. Vorgänge mit Befunden kommen in
# MAGIC die Klärliste statt in die Datei.
# MAGIC
# MAGIC **`grenze` ist eine Bremse für den ersten Blick.** Auf `None` setzen, um alles zu
# MAGIC holen.

# COMMAND ----------

TOKEN = dbutils.secrets.get("epilot", "access_token")
grenze = 50

api = EntityAPI(cfg.epilot, TOKEN)

# Die Vorgänge werden mitgesammelt, nicht nur die fertigen Zeilen: Zelle 5 wertet
# sie aus, ohne die API ein zweites Mal zu durchlaufen.
vorgaenge, zeilen, klaerliste = [], [], []

for vorgang in api.suche():
    vorgaenge.append(vorgang)

    # Erst die fachlichen Prüfungen, dann die Abbildung. Beide Fehlerarten landen
    # zusammen am Vorgang, damit die Klärung nicht Runde für Runde läuft.
    gruende = [f"{b.feld}: {b.text}" for b in pruefe(vorgang, cfg)]
    werte, mapping_fehler = zeile(vorgang, cfg)
    gruende.extend(mapping_fehler)

    if gruende:
        # Bewusst ohne Antragsinhalte: Die Klärliste braucht die Kennung des
        # Vorgangs, nicht die Daten des Betreibers.
        klaerliste.append({"id": vorgang.get("_id"), "gruende": "; ".join(gruende)})
    else:
        zeilen.append(werte)

    if grenze and len(vorgaenge) >= grenze:
        break

print(f"{len(vorgaenge)} gelesen · {len(zeilen)} lieferbar · "
      f"{len(klaerliste)} in der Klärliste")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 4 · Die Datei ansehen
# MAGIC
# MAGIC `baue_datei` erzeugt den Inhalt byte-genau so, wie er auf dem Netzlaufwerk
# MAGIC landen würde — mit Kodierung, Trennzeichen, Maskierung und Zeilenenden aus der
# MAGIC Konfiguration. Hier wird er nur angezeigt.

# COMMAND ----------

if not zeilen:
    print("Keine lieferbare Zeile. Klärliste unten ansehen — dort steht der Grund.")
else:
    inhalt = baue_datei(zeilen, cfg)
    print(f"{len(inhalt)} Bytes · {len(zeilen)} Datenzeilen\n")
    # Nur die ersten Zeilen: Der Rest bringt keine neue Erkenntnis und die Datei
    # enthält Vorgangsdaten.
    for z in inhalt.decode(cfg.format.kodierung).splitlines()[:6]:
        print(z)

# COMMAND ----------

# MAGIC %md
# MAGIC ## 5 · Die eigentliche Frage: welche Werte liefert epilot?
# MAGIC
# MAGIC Beide Wertelisten sind leer, die Rohwerte werden durchgereicht. Diese Auswertung
# MAGIC sammelt sie ein — **das Ergebnis ist die Vorlage für Blatt 3 der Erhebungsmappe.**
# MAGIC Jeder gefundene Wert braucht einen SAP-Schlüssel von Billing.
# MAGIC
# MAGIC **Achtung bei der Aussagekraft:** Ausgewertet wird, was Zelle 3 geholt hat. Bei
# MAGIC `grenze = 50` sind das 50 Vorgänge — für einen ersten Blick genug, für eine
# MAGIC vollständige Werteliste nicht. Ein seltener Anlagentyp taucht darin nicht auf.
# MAGIC Vor der Übergabe an Billing die Bremse lösen und erneut laufen lassen.

# COMMAND ----------

from collections import Counter

for attribut in ("ea_erzeugungsanlage_anlagentyp", "ea_erzeugungsanlage_art_der_einspeisung"):
    werte = Counter()
    for v in vorgaenge:
        w = v.get(attribut)
        werte[w if w not in (None, "") else "(leer)"] += 1
    print(f"\n{attribut}  —  aus {len(vorgaenge)} Vorgängen")
    for wert, n in werte.most_common():
        print(f"  {n:5}  {wert}")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 6 · Klärliste
# MAGIC
# MAGIC Vorgänge, die nicht lieferbar sind, mit Begründung. Im produktiven Betrieb geht
# MAGIC diese Liste an eine benannte Person — ohne Zuständigkeit verschwinden die Fälle.

# COMMAND ----------

import pandas as pd

if klaerliste:
    display(pd.DataFrame(klaerliste))
else:
    print("Keine Klärfälle.")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Was danach zu tun ist
# MAGIC
# MAGIC 1. **Die Werte aus Zelle 5 an Billing geben** — für jeden brauchst du den
# MAGIC    SAP-Schlüssel. Danach die Wertelisten in der Konfiguration füllen und
# MAGIC    `unbekannt: durchreichen` entfernen.
# MAGIC 2. **Eine produktive Originaldatei beschaffen.** Sie ersetzt drei Annahmen
# MAGIC    (Kodierung, Zeilenende, Datumsformat) und ist der Referenzsatz für den
# MAGIC    byteweisen Abnahmevergleich.
# MAGIC 3. **Prüfen, ob `delivery_address` wirklich das Anschlussobjekt trägt** — an
# MAGIC    einem Vorgang, bei dem Anlagen- und Betreiberadresse abweichen.
# MAGIC 4. **Das Attribut `uebertragungsstatus` in epilot anlegen.** Ohne den Statusfilter
# MAGIC    liefert jeder Lauf alle Vorgänge erneut.
