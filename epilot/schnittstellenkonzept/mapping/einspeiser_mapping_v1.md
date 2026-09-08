# Einspeiser — Feldmapping, Fassung 1 (Billing)

> Quelle: Zuordnung der Kollegin aus Billing, 08.09.2026. Sie nennt es ausdrücklich
> „die Felder, die wir auf jeden Fall erstmal brauchen" — **es ist ein Minimalset für den
> Go-Live, keine vollständige Ablösung des heutigen Exports.**

## Die Zuordnung

| Zielspalte | epilot-Platzhalter | Anmerkung Billing |
| --- | --- | --- |
| `Opportunity Nummer` | `{{opportunity.opportunity_number}}` | |
| `Straße_Anschlussobjekt` | `{{opportunity.delivery_address[Adresse Anlagenbetreiber]}}` | „Gibt's anscheinend nur als einen Block" |
| `Hausnummer_Anschlussobjekt` | — | aus demselben Block |
| `PLZ_Anschlussobjekt` | — | aus demselben Block |
| `Ort_Anschlussobjekt` | — | aus demselben Block |
| `Energieart` | `{{opportunity.ea_erzeugungsanlage_anlagentyp}}` | **Mapping auf Energieart notwendig** |
| `EEG_Inbetriebnahmedatum` | `{{opportunity.ea_inbetriebsetzungsdatum}}` | |
| `Gesamtleistung_kW` | `{{opportunity.ea_installierte_modulleistung_in_kwp}}` | |
| `Nettoleistung_kW` | entfällt? | „irrelevant, wenn Gesamtleistung und Wechselrichterleistung angegeben sind" |
| `Wechselrichterleistung_kW` | offen | „Feld müssen wir noch einmal klären" |
| `Mieterstromzuschlag_gültig_ab` | n. v. | nur bei Mieterstrom, nicht go-live-kritisch |
| `Einspeisemanagement` | offen | „Feld müssen wir noch einmal klären" |
| `Messkonzept` | `{{opportunity.zaehlermeldung_messkonzept}}` | |
| `SEE-Nr.` | `{{opportunity.ea_see_erzeugungsanlage}}` | |
| `Art der Einspeisung` | `{{opportunity.ea_erzeugungsanlage_art_der_einspeisung}}` | **Mapping auf `01` Volleinspeisung / `02` Überschusseinspeisung** |
| `Fernsteuerbarkeit` | offen | |

**16 Zeilen gegenüber 30 Spalten im heutigen Lovion-Export.**

---

## Was sich damit klärt

**Das epilot-Datenmodell existiert bereits.** Die Attribute `ea_erzeugungsanlage_anlagentyp`,
`ea_inbetriebsetzungsdatum`, `ea_installierte_modulleistung_in_kwp`,
`zaehlermeldung_messkonzept`, `ea_see_erzeugungsanlage` und
`ea_erzeugungsanlage_art_der_einspeisung` sind offenbar konfiguriert. Das Vorhaben startet
nicht bei null.

**`SEE-Nr.` ist die MaStR-Kennung.** Die Stromerzeugungseinheit im Marktstammdatenregister —
sie war im heutigen Lovion-Export nicht enthalten und kommt hier neu hinzu. Damit ist eine
Lücke geschlossen, die in SK-001 als offen geführt war.

**Zwei Wertelisten sind zu hinterlegen:** `Energieart` und `Art der Einspeisung`. Für
Letztere sind die Zielschlüssel bereits bekannt (`01`, `02`) — das ist der Anfang von
Blatt 3 der Erhebungsmappe.

**Die `Lovion ID` ist durch `Opportunity Nummer` ersetzt.** Damit ist der Weg gewählt —
siehe Rückfrage 1.

---

## Fünf Punkte, die vor der Umsetzung zu klären sind

### 1. Die Kennung wechselt — weiß SAP davon?

`Opportunity Nummer` tritt an die Stelle der `Lovion ID`. Das ist der Weg „neue Kennung in
SAP" aus [SK-001, Abschnitt 0a](../SK-001-einspeiser-sap.md) — und der einzige der drei
Wege, der **eine Änderung auf der SAP-Seite erfordert.**

Damit fällt die bisherige Festlegung „die SAP-Seite bleibt unangetastet". Zu klären:

- Ist der Wechsel mit dem SAP-Betrieb abgestimmt?
- Was geschieht mit Bestandsanlagen, zu denen in SAP eine Lovion-ID hinterlegt ist?
  Bleibt diese Verknüpfung erhalten, oder braucht es eine Umsetzungstabelle?
- Ist die Opportunity-Nummer über die Lebensdauer des Vorgangs stabil?

*Das ist der Punkt mit der größten Hebelwirkung auf Aufwand und Termin.*

### 2. Die Adresse liegt strukturiert vor — der Block ist ein Artefakt der Vorlagensyntax

Die Anmerkung „gibt's anscheinend nur als einen Block" trifft auf die
**Template-Variablen** zu (`{{…}}`, Handlebars). Diese sind für E-Mails und Dokumentvorlagen
gedacht und rendern eine Adresse als Fließtext.

**Über die Entity API kommen die Bestandteile einzeln.** Aus der offiziellen OpenAPI-Spec:

```
address: array of {
  street, street_number, postal_code, city,
  country (DE|AT|CH), additional_info
}
```

Der erste Eintrag (`address[0]`) gilt als der primäre. Der Export-Lauf greift damit direkt
auf `address.0.street`, `address.0.street_number`, `address.0.postal_code` und
`address.0.city` zu — **kein Zerlegen von Fließtext nötig**, was ohnehin fehleranfällig wäre
(Hausnummernzusätze wie „12a", „12-14", Straßennamen mit Ziffern).

*Praktische Folge: Der Datenabruf sollte über die Entity API laufen, nicht über die
Template-Variablen — siehe Punkt 5.*

### 3. Anlagenbetreiber ist nicht Anschlussobjekt

Die Zielspalten heißen `…_Anschlussobjekt`, die genannte Quelle ist
`delivery_address[Adresse Anlagenbetreiber]`. Fachlich sind das zwei verschiedene Orte: Wo
die Anlage steht, und wo der Betreiber wohnt. Bei der Aufdachanlage am eigenen Haus
identisch — bei Freiflächenanlagen, vermieteten Objekten und Betreibergesellschaften nicht.

Zu klären: Führt das Datenmodell beide Adressen getrennt, und ist hier die richtige gemeint?
Ein Fehler an dieser Stelle fällt im Test nicht auf, weil die Mehrzahl der Fälle identisch ist.

### 4. Vierzehn Spalten des heutigen Exports fehlen

Das Minimalset lässt gegenüber dem Lovion-Export unter anderem aus: Gemarkung, Flur,
Flurstück, `Einspeisespannungsebene`, `Anlagenart nach §48`, `Neu_Bestand_Erweiterung`,
die drei BAFA-/KWKG-Felder, `Speicherkapazität_kWh`, `Max_Entladeleistung_kW`,
`Geodaten_Lage_PV`, `Energieträger`, `Datum_Auslauf_Vergütung`, `Inselbetrieb`.

Das ist als Priorisierung nachvollziehbar. Die Frage ist, **was auf der SAP-Seite passiert,
wenn diese Spalten fehlen oder leer bleiben:**

| Fall | Folge |
| --- | --- |
| SAP erwartet die Spalten weiterhin, akzeptiert sie leer | Die Datei behält 30 Spalten, 14 davon leer. Unkritisch, aber festzuhalten. |
| SAP erwartet die Spalten und prüft auf Inhalt | Import scheitert oder legt unvollständige Stammdaten an. |
| Die Datei darf schrumpfen | SAP-seitige Anpassung des Imports nötig — dann zusammen mit Punkt 1 behandeln. |

*`Anlagenart nach §48` ist dabei besonders zu betrachten: In SK-001 als rechtlich kritisch
eingestuft, weil sie die EEG-Vergütungsklasse bestimmt. Wenn sie entfällt — woher nimmt SAP
die Klasse dann?*

### 5. „Report" oder Schnittstelle — erzeugt epilot die Datei selbst?

Billing spricht vom **Report**. Wenn epilot die Datei über eine eigene Report- oder
Exportfunktion erzeugt, verschiebt sich die Architektur aus SK-001:

| Variante | Erzeugung | Transport ins interne Netz |
| --- | --- | --- |
| **A — Export-Lauf** (SK-001) | eigener Job über die Entity API | derselbe Job schreibt direkt |
| **B — epilot-Report** | epilot erzeugt die Datei | zusätzlicher Abholschritt nötig |

epilot ist SaaS und kann nicht auf ein internes Netzlaufwerk schreiben — ein Transportschritt
bleibt in beiden Fällen nötig. Der Unterschied liegt in der Kontrolle über das Dateiformat:

> Variante B ist nur tragfähig, wenn epilots Report **Zeichenkodierung, Trennzeichen,
> Zeilenende und Spaltenreihenfolge exakt steuern lässt.** Andernfalls bleibt Variante A.

*Zu prüfen, bevor gebaut wird. Die Antwort entscheidet, ob der vorhandene Export-Lauf
gebraucht wird oder nur noch der Transport.*

---

## Offene Felder

| Feld | Status |
| --- | --- |
| `Wechselrichterleistung_kW` | Quelle in epilot zu klären |
| `Einspeisemanagement` | Quelle in epilot zu klären |
| `Fernsteuerbarkeit` | keine Quelle genannt |
| `Nettoleistung_kW` | Entfall vorgeschlagen — Bestätigung durch SAP-Betrieb nötig |
| `Mieterstromzuschlag_gültig_ab` | zurückgestellt, nicht go-live-kritisch |
