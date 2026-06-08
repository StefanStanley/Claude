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
  beteiligte: Person[]
  meilensteine: Meilenstein[]
  aufgaben: Aufgabe[]
  genehmigungen: Genehmigung[]
  dokumente: Dokument[]
}
