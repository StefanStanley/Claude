// CLI: lädt MaStR-Anlagen für Düsseldorf aus der öffentlichen Web-API und
// speichert sie als JSON (für die App) und CSV (zur Weiterverarbeitung).
//
//   npm run download:mastr                 # Standard: Düsseldorf, alle Typen
//   npm run download:mastr -- --max 500    # je Kategorie höchstens 500
//   npm run download:mastr -- --gemeinde Neuss
//
// Der MaStR-Host muss erreichbar sein (Egress-Allowlist:
// www.marktstammdatenregister.de).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ladeMaStrEinheiten } from './api.ts'
import type { MaStrEinheit } from '../../../src/data/mastr.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

function nachCsv(einheiten: MaStrEinheit[]): string {
  const spalten: (keyof MaStrEinheit)[] = [
    'mastrNr',
    'name',
    'betreiber',
    'sparte',
    'richtung',
    'energietraeger',
    'bruttoleistungKw',
    'nettoleistungKw',
    'inbetriebnahme',
    'status',
    'plz',
    'ort',
    'lat',
    'lng',
  ]
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const kopf = spalten.join(';')
  const zeilen = einheiten.map((e) => spalten.map((s) => escape(e[s])).join(';'))
  return [kopf, ...zeilen].join('\n')
}

async function main() {
  const gemeinde = arg('gemeinde') ?? 'Düsseldorf'
  const maxProTyp = Number(arg('max') ?? 0)
  const zielDir = path.join(__dirname, '..', '..', 'data')

  console.log(`MaStR-Download für Gemeinde "${gemeinde}" …\n`)
  const start = Date.now()

  const einheiten = await ladeMaStrEinheiten({
    gemeinde,
    maxProTyp,
    log: (t) => console.log(t),
  })

  fs.mkdirSync(zielDir, { recursive: true })
  const jsonPfad = path.join(zielDir, 'mastr-duesseldorf.json')
  const csvPfad = path.join(zielDir, 'mastr-duesseldorf.csv')

  fs.writeFileSync(
    jsonPfad,
    JSON.stringify(
      {
        gemeinde,
        abgerufen: new Date().toISOString(),
        anzahl: einheiten.length,
        einheiten,
      },
      null,
      2,
    ),
    'utf-8',
  )
  fs.writeFileSync(csvPfad, nachCsv(einheiten), 'utf-8')

  const dauer = ((Date.now() - start) / 1000).toFixed(1)
  console.log(
    `\n✔ Fertig: ${einheiten.length} Einheiten in ${dauer}s\n  JSON: ${jsonPfad}\n  CSV:  ${csvPfad}`,
  )
}

main().catch((e) => {
  console.error('\n✖ Download fehlgeschlagen:', e instanceof Error ? e.message : e)
  console.error(
    '  Hinweis: Ist der Host www.marktstammdatenregister.de in der Egress-Allowlist erreichbar?',
  )
  process.exit(1)
})
