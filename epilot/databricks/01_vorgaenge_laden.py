# Databricks notebook source
# MAGIC %md
# MAGIC # 01 · Vorgänge aus epilot laden
# MAGIC
# MAGIC **Zweck:** Rohdaten aus der epilot Entity API holen und ansehen. Noch nichts
# MAGIC abbilden, noch nichts filtern, noch nichts wegschreiben.
# MAGIC
# MAGIC **Warum in dieser Reihenfolge:** Ein Feldmapping ändert sich, solange die
# MAGIC Abstimmung mit SAP läuft — die Rohdaten nicht. Wer erst abbildet und dann
# MAGIC anbindet, baut die Strecke bei jeder Mapping-Änderung um. Andersherum liegen
# MAGIC die Daten, und das Mapping wird zu einer Abfrage darauf.
# MAGIC
# MAGIC **Voraussetzungen:**
# MAGIC
# MAGIC | Was | Wo |
# MAGIC | --- | --- |
# MAGIC | Access Token | Databricks Secret Scope `epilot`, Schlüssel `access_token` |
# MAGIC | Dieses Repository | als Git-Ordner im Workspace eingebunden |
# MAGIC | Dieses Notebook | liegt **im** Git-Ordner, sonst findet Zelle 2 die Werkzeuge nicht |
# MAGIC
# MAGIC **Der Token steht nirgends im Code.** Er wird aus dem Secret Scope gelesen.
# MAGIC Ein Token im Notebook landet in der Versionshistorie und ist praktisch nicht
# MAGIC mehr zurückzuholen.

# COMMAND ----------

# MAGIC %md
# MAGIC ## 1 · Abhängigkeiten
# MAGIC
# MAGIC `requests` spricht mit der API, `PyYAML` braucht die Werkzeugkette an anderer
# MAGIC Stelle. Nach `%pip install` **muss** der Python-Prozess neu starten — der Hinweis
# MAGIC von Databricks dazu ist kein Fehler.
# MAGIC
# MAGIC **Achtung:** Der Neustart verwirft alle Variablen. Deshalb steht er in einer
# MAGIC eigenen Zelle vor allem anderen, und der Token wird erst danach geholt.

# COMMAND ----------

# MAGIC %pip install requests PyYAML

# COMMAND ----------

dbutils.library.restartPython()

# COMMAND ----------

# MAGIC %md
# MAGIC ## 2 · Werkzeuge aus dem Git-Ordner einbinden
# MAGIC
# MAGIC Die Ladelogik steht nicht in diesem Notebook, sondern in
# MAGIC `werkzeuge/entity_laden.py` im Repository. Zwei Gründe: Sie ist dort getestet
# MAGIC (`werkzeuge/tests/`), und ein Notebook ist kein Ort für Logik, die auch ein
# MAGIC geplanter Job braucht.
# MAGIC
# MAGIC Die Schleife sucht die Repo-Wurzel, statt einen Pfad fest einzutragen — der
# MAGIC Pfad enthält sonst den Benutzernamen und bricht bei jedem anderen Konto.

# COMMAND ----------

import os
import sys

# Vom Verzeichnis dieses Notebooks aus nach oben laufen, bis ein Ordner "werkzeuge"
# danebenliegt. Das ist die Repo-Wurzel.
wurzel = os.getcwd()
while wurzel != "/" and not os.path.isdir(os.path.join(wurzel, "werkzeuge")):
    wurzel = os.path.dirname(wurzel)

if wurzel == "/":
    raise RuntimeError(
        "Kein Ordner 'werkzeuge' gefunden. Liegt dieses Notebook im Git-Ordner?"
    )

# sys.path ist die Liste der Verzeichnisse, in denen Python nach Modulen sucht.
# Mit insert(0, …) steht unseres vorn und gewinnt gegen gleichnamige Pakete.
sys.path.insert(0, os.path.join(wurzel, "werkzeuge"))

# Dieser Import steht bewusst unten und nicht im Kopf: Er gelingt erst, nachdem
# sys.path das Werkzeugverzeichnis kennt.
import entity_laden as el

print("Repo-Wurzel:", wurzel)

# COMMAND ----------

# MAGIC %md
# MAGIC ## 3 · Token holen und Verbindung prüfen
# MAGIC
# MAGIC `dbutils.secrets.get` liest den Token aus dem Secret Scope. Databricks maskiert
# MAGIC Secrets in jeder Ausgabe — ein versehentliches `print(TOKEN)` zeigt `[REDACTED]`.
# MAGIC Verlass dich nicht darauf: Gib ihn gar nicht erst aus.
# MAGIC
# MAGIC Der Aufruf unten holt **eine** Seite mit **einem** Treffer. Er beantwortet nur:
# MAGIC Kommt die Verbindung zustande und ist der Token gültig? Ein Fehler hier ist
# MAGIC billiger als einer nach zwanzig Minuten Ladezeit.

# COMMAND ----------

TOKEN = dbutils.secrets.get("epilot", "access_token")

probe = el.alle("_schema:opportunity", TOKEN, groesse=1, max_seiten=1)
print(f"Verbindung steht. Beispielvorgang: {probe[0].get('_id')}")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 4 · Erst klein laden und hinsehen
# MAGIC
# MAGIC `max_seiten=3` ist eine **Bremse zum Hinsehen**, keine fachliche Beschränkung.
# MAGIC Sie fliegt in Zelle 6 wieder raus.
# MAGIC
# MAGIC Zwei Parameter, die den Unterschied machen:
# MAGIC
# MAGIC - **`hydrate=True`** (Standard) lädt verknüpfte Entitäten mit. Ohne das tragen
# MAGIC   Relationen nur eine `entity_id` und keinen einzigen Wert — man sieht, *dass*
# MAGIC   ein Kontakt dranhängt, aber nicht, wer.
# MAGIC - **`groesse`** ist die Trefferzahl je Seite, höchstens 1000. Die Gesamtmenge
# MAGIC   begrenzt sie nicht; dafür holt das Werkzeug so viele Seiten wie nötig.

# COMMAND ----------

vorgaenge = el.alle("_schema:opportunity", TOKEN, groesse=100, max_seiten=3)

print(f"{len(vorgaenge)} Vorgänge geladen")

# COMMAND ----------

# MAGIC %md
# MAGIC ## 5 · Welche Felder sind überhaupt gefüllt?
# MAGIC
# MAGIC **Die Frage, an der die Form der Bronze-Tabelle hängt.**
# MAGIC
# MAGIC Das Schema `opportunity` trägt 880 Attribute — alle Formularstrecken liegen
# MAGIC darauf. Ein einzelner Vorgang füllt davon nur die Felder seiner eigenen Strecke.
# MAGIC
# MAGIC - Trägt ein Vorgang typischerweise **wenige Dutzend** Werte, ist die Tabelle
# MAGIC   dünn besetzt. Dann legen wir die Rohdaten als **JSON-Spalte** ab und entpacken
# MAGIC   beim Lesen.
# MAGIC - Sind es durchgängig **hunderte**, lohnt eine **flache Tabelle** mit einer
# MAGIC   Spalte je Attribut.
# MAGIC
# MAGIC `belegung()` zählt je Feld, in wie vielen Vorgängen es einen Wert hat. Leere
# MAGIC Zeichenketten, leere Listen und `None` zählen dabei **nicht** als Wert.

# COMMAND ----------

import pandas as pd

gefuellt = el.belegung(vorgaenge)

print(f"{len(gefuellt)} verschiedene Felder sind in mindestens einem Vorgang gefüllt")

# Je Vorgang zählen, wie viele Felder einen Wert tragen — der Median sagt mehr als
# der Mittelwert, weil einzelne große Vorgänge ihn sonst verzerren.
je_vorgang = [sum(1 for w in v.values() if w not in (None, "", [], {}))
              for v in vorgaenge]
print(f"Median gefüllter Felder je Vorgang: {pd.Series(je_vorgang).median():.0f}")

display(pd.DataFrame(gefuellt, columns=["feld", "vorgaenge_mit_wert"]))

# COMMAND ----------

# MAGIC %md
# MAGIC ## 6 · Vollständig laden
# MAGIC
# MAGIC Ohne `max_seiten` holt das Werkzeug alles. Das Paging läuft über `search_after`
# MAGIC und nicht über `from`/`size` — letzteres bricht bei tiefen Ergebnismengen ab und
# MAGIC liefert bei gleichzeitigen Änderungen inkonsistente Seiten, also Vorgänge doppelt
# MAGIC oder gar nicht.
# MAGIC
# MAGIC **Erst ausführen, wenn Zelle 5 beantwortet ist.** Bis dahin ist unklar, was mit
# MAGIC den Daten geschehen soll, und die Ladezeit wäre verschenkt.

# COMMAND ----------

# alle_vorgaenge = el.alle("_schema:opportunity", TOKEN, groesse=500)
# print(f"{len(alle_vorgaenge)} Vorgänge insgesamt")

# COMMAND ----------

# MAGIC %md
# MAGIC ## Nächster Schritt
# MAGIC
# MAGIC Notebook `02_bronze_ablegen` schreibt die Rohdaten als Delta-Tabelle. Dafür
# MAGIC fehlen noch zwei Angaben:
# MAGIC
# MAGIC 1. das Ergebnis aus Zelle 5 (dünn oder dicht besetzt)
# MAGIC 2. der Unity-Catalog-Katalog, in den geschrieben werden darf —
# MAGIC    `spark.sql("SHOW CATALOGS").display()`
