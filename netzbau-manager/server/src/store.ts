import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
// Seed-Daten direkt aus dem Frontend-Modell (nur Typen + Daten, keine UI)
import { massnahmen as seed } from '../../src/data/massnahmen'
import type { Massnahme, Prioritaet, Sparte, MassnahmeArt } from '../../src/data/types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Datenpfad konfigurierbar (z. B. auf eine persistente Disk im Hosting zeigen)
const DB_PATH =
  process.env.DB_PATH ?? path.join(__dirname, '..', 'data', 'db.json')

function load(): Massnahme[] | null {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as Massnahme[]
  } catch {
    return null
  }
}

let db: Massnahme[] = load() ?? structuredClone(seed)

function save() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
}
save() // initiale db.json anlegen, falls noch nicht vorhanden

export function getAll(): Massnahme[] {
  return db
}

export function getOne(id: string): Massnahme | undefined {
  return db.find((m) => m.id === id)
}

export function toggleAufgabe(
  mId: string,
  aId: string,
): Massnahme | undefined {
  const m = db.find((x) => x.id === mId)
  if (!m) return undefined
  const a = m.aufgaben.find((x) => x.id === aId)
  if (!a) return undefined
  a.erledigt = !a.erledigt
  // Fortschritt aus erledigten Aufgaben ableiten
  const erledigt = m.aufgaben.filter((x) => x.erledigt).length
  if (m.aufgaben.length > 0) {
    m.fortschritt = Math.round((erledigt / m.aufgaben.length) * 100)
  }
  save()
  return m
}

export interface NeuMassnahmeInput {
  titel: string
  sparte: Sparte
  art: MassnahmeArt
  gemeinde: string
  ort?: string
  prioritaet: Prioritaet
  start: string
  ende?: string
  budget: number
  bauleiter: string
  spannungsebene?: Massnahme['spannungsebene']
  beschreibung?: string
}

const SPARTE_PREFIX: Record<string, string> = {
  Strom: 'STR',
  Gas: 'GAS',
  Wasser: 'WAS',
  Fernwärme: 'FW',
  Breitband: 'BRB',
}

export function addMassnahme(input: NeuMassnahmeInput): Massnahme {
  const jahr = new Date().getFullYear()
  const lfd = String(db.length + 1).padStart(4, '0')
  const neu: Massnahme = {
    id: `m${Date.now()}`,
    kennung: `${SPARTE_PREFIX[input.sparte] ?? 'XXX'}-${jahr}-${lfd}`,
    titel: input.titel,
    sparte: input.sparte,
    art: input.art,
    spannungsebene: input.spannungsebene ?? 'Niederspannung',
    status: 'Planung',
    prioritaet: input.prioritaet,
    fortschritt: 0,
    ort: input.ort ?? input.gemeinde,
    gemeinde: input.gemeinde,
    bauleiter: input.bauleiter,
    tiefbaufirma: '—',
    budget: input.budget,
    ausgaben: 0,
    start: input.start,
    ende: input.ende ?? input.start,
    beschreibung: input.beschreibung ?? '',
    geo: { lat: 51.2277, lng: 6.7735 }, // Default: Düsseldorf-Zentrum
    beteiligte: [{ id: `p${Date.now()}`, name: input.bauleiter, rolle: 'Bauleitung VNB' }],
    meilensteine: [],
    aufgaben: [],
    genehmigungen: [],
    dokumente: [],
  }
  db = [neu, ...db]
  save()
  return neu
}
