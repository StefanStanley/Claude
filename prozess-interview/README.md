# ProzessLupe *(Arbeitstitel)*

SaaS für den **Energiesektor**: Prozessaufnahme per **Interview**. Ein Fachexperte
erzählt seinen Prozess (Audio) und hängt Fotos, PDFs und Videos an – heraus kommt
ein **BPMN-Modell** und eine **Bewertung** des Prozesses.

- **Stack:** Next.js + TypeScript
- **Betrieb:** On-Prem-fähig (KRITIS) – KI-Anbieter austauschbar (Cloud ↔ lokal)
- **Status:** Konzeptphase

## Dokumentation

📄 **[KONZEPT.md](./KONZEPT.md)** – Vollständiges Konzept: Vision, User-Journey,
Datenmodell, KI-Pipeline, Architektur, Compliance, Roadmap.

## Kernidee der KI-Pipeline

```
Audio/PDF/Foto/Video → Transkript/Extraktion → Process IR (validiertes JSON)
                                                      ├──► BPMN 2.0 XML (bpmn-js)
                                                      └──► Bewertung (Rubrik)
```

Die **Process IR** (strukturierte Zwischenform) trennt „Verstehen" (LLM) vom
„Zeichnen" (deterministischer Generator) – prüfbar, versionierbar, wenig Halluzination.

## Nächste Schritte

1. Konzept freigeben, Produktnamen wählen
2. IR-JSON-Schema entwerfen
3. Phase-1-MVP-Durchstich bauen (Text → IR → BPMN → Bewertung)
