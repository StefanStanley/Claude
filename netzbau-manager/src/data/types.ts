// Domänenmodell für Bauprojekt-Management bei Verteilnetzbetreibern (VNB)

export type Sparte = 'Strom' | 'Gas' | 'Wasser' | 'Fernwärme' | 'Breitband'

export type Spannungsebene =
  | 'Niederspannung'
  | 'Mittelspannung'
  | 'Hochspannung'
  | '—'

export type MassnahmeArt =
  | 'Kabeltrasse'
  | 'Ortsnetzstation'
  | 'Hausanschluss'
  | 'Umspannwerk'
  | 'Netzverstärkung'
  | 'Erneuerung'
  | 'Smart-Meter-Rollout'

export type Status =
  | 'Planung'
  | 'Genehmigung'
  | 'Ausschreibung'
  | 'Bau'
  | 'Abnahme'
  | 'Abgeschlossen'

export type Prioritaet = 'Niedrig' | 'Mittel' | 'Hoch' | 'Kritisch'

export interface Person {
  id: string
  name: string
  rolle: string
  firma?: string
}

export interface Meilenstein {
  id: string
  titel: string
  datum: string // ISO
  erledigt: boolean
}

export interface Aufgabe {
  id: string
  titel: string
  zustaendig: string
  faellig: string // ISO
  erledigt: boolean
  gewerk: string
}

export interface Genehmigung {
  id: string
  art: string
  behoerde: string
  status: 'Beantragt' | 'Erteilt' | 'In Prüfung' | 'Abgelehnt'
  datum: string // ISO
}

export interface Dokument {
  id: string
  name: string
  typ: 'Plan' | 'Vertrag' | 'Foto' | 'Bericht' | 'Genehmigung'
  groesse: string
  geaendert: string // ISO
}

export interface Massnahme {
  id: string
  kennung: string // z.B. "STR-2026-0142"
  titel: string
  sparte: Sparte
  art: MassnahmeArt
  spannungsebene: Spannungsebene
  status: Status
  prioritaet: Prioritaet
  fortschritt: number // 0–100
  ort: string
  gemeinde: string
  bauleiter: string
  tiefbaufirma: string
  budget: number // EUR
  ausgaben: number // EUR
  start: string // ISO
  ende: string // ISO geplant
  trasseLaengeM?: number
  beschreibung: string
  geo: { lat: number; lng: number } // reale Koordinaten (WGS84)
  // Trassenverlauf für Linien-Maßnahmen (Kabel/Erschließung)
  trasse?: { lat: number; lng: number }[]
  beteiligte: Person[]
  meilensteine: Meilenstein[]
  aufgaben: Aufgabe[]
  genehmigungen: Genehmigung[]
  dokumente: Dokument[]
}

// ---- Netzanschluss-Antragsprozess (Energiewende-Pipeline) ----

export type AnschlussTyp =
  | 'PV-Einspeisung'
  | 'Wärmepumpe'
  | 'E-Ladepunkt'
  | 'Neubau Hausanschluss'
  | 'Gewerbeanschluss'
  | 'Batteriespeicher'

export type AnschlussStatus =
  | 'Eingegangen'
  | 'Technische Prüfung'
  | 'Angebot'
  | 'Zusage'
  | 'Umsetzung'
  | 'Inbetriebnahme'

export interface Netzanschluss {
  id: string
  kennung: string // z.B. "NA-2026-04812"
  typ: AnschlussTyp
  kunde: string
  adresse: string
  gemeinde: string
  leistungKw: number
  status: AnschlussStatus
  eingang: string // ISO – Antragseingang
  slaTage: number // gesetzliche/interne Bearbeitungsfrist
  sachbearbeiter: string
  paragraf14a?: boolean // steuerbare Verbrauchseinrichtung (§14a EnWG)
  massnahmeId?: string // verknüpfte Baumaßnahme
}
