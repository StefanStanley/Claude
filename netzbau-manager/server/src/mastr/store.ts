// Server-seitiger Zugriff auf die MaStR-Daten für Düsseldorf.
// Liest die per `npm run download:mastr` erzeugte Datei, sonst Demo-Seed.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mastrSeed } from '../../../src/data/mastr.ts'
import type { MaStrEinheit } from '../../../src/data/mastr.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Konfigurierbar (z. B. persistente Disk im Hosting)
export const MASTR_DATEI =
  process.env.MASTR_DATA ??
  path.join(__dirname, '..', '..', 'data', 'mastr-duesseldorf.json')

function load(): MaStrEinheit[] | null {
  try {
    const roh = JSON.parse(fs.readFileSync(MASTR_DATEI, 'utf-8'))
    // Datei enthält entweder ein Array oder { einheiten: [...] }
    const arr = Array.isArray(roh) ? roh : roh.einheiten
    return Array.isArray(arr) ? (arr as MaStrEinheit[]) : null
  } catch {
    return null
  }
}

export interface MaStrFilter {
  /** Volltext über Name, Betreiber, Ort, MaStR-Nr. */
  q?: string
  energietraeger?: string
  richtung?: string
  plz?: string
  limit?: number
  offset?: number
}

export function getEinheiten(filter: MaStrFilter = {}): {
  total: number
  einheiten: MaStrEinheit[]
  demo: boolean
} {
  const geladen = load()
  const basis = geladen ?? mastrSeed
  const demo = geladen === null

  let res = basis
  const q = filter.q?.trim().toLowerCase()
  if (q) {
    res = res.filter((e) =>
      [e.name, e.betreiber, e.ort, e.mastrNr, e.energietraeger]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }
  if (filter.energietraeger)
    res = res.filter((e) => e.energietraeger === filter.energietraeger)
  if (filter.richtung) res = res.filter((e) => e.richtung === filter.richtung)
  if (filter.plz) res = res.filter((e) => e.plz === filter.plz)

  const total = res.length
  const offset = filter.offset ?? 0
  const limit = filter.limit ?? total
  return { total, einheiten: res.slice(offset, offset + limit), demo }
}
