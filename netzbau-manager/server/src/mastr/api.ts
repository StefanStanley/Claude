// Client für die öffentliche Web-API des Marktstammdatenregisters (MaStR).
//
// Genutzt wird der gleiche JSON-Endpunkt wie die öffentliche Einheiten-Suche
// auf marktstammdatenregister.de (Kendo-Grid-Format). Die Suche wird per
// Standortfilter auf eine Gemeinde (Düsseldorf) eingeschränkt und seitenweise
// abgerufen. Es ist kein API-Key nötig.
//
// Hinweis: Der MaStR-Host muss in restriktiven Netzwerkumgebungen in der
// Egress-Allowlist stehen (www.marktstammdatenregister.de).

import type { MaStrEinheit, MaStrSparte, MaStrRichtung } from '../../../src/data/mastr.ts'

const BASIS =
  process.env.MASTR_BASE ??
  'https://www.marktstammdatenregister.de/MaStR/Einheit/EinheitJson'

// Die abrufbaren Einheiten-Kategorien der öffentlichen Suche.
interface EinheitTyp {
  endpoint: string
  sparte: MaStrSparte
  richtung: MaStrRichtung
}

export const EINHEIT_TYPEN: EinheitTyp[] = [
  {
    endpoint: 'GetErweiterteOeffentlicheEinheitStromerzeugung',
    sparte: 'Strom',
    richtung: 'Erzeugung',
  },
  {
    endpoint: 'GetErweiterteOeffentlicheEinheitStromverbrauch',
    sparte: 'Strom',
    richtung: 'Verbrauch',
  },
  {
    endpoint: 'GetErweiterteOeffentlicheEinheitGaserzeugung',
    sparte: 'Gas',
    richtung: 'Erzeugung',
  },
  {
    endpoint: 'GetErweiterteOeffentlicheEinheitGasverbrauch',
    sparte: 'Gas',
    richtung: 'Verbrauch',
  },
]

// Energieträger werden in der öffentlichen JSON teils als Zahlencode geliefert.
// Diese Tabelle deckt die gängigen Codes ab; unbekannte Codes werden als
// "Code <n>" durchgereicht (an der Live-API verifizierbar). Textwerte werden
// unverändert übernommen.
const ENERGIETRAEGER_CODES: Record<number, string> = {
  2403: 'Biogas',
  2405: 'Biomasse',
  2406: 'Braunkohle',
  2407: 'Erdgas',
  2408: 'Geothermie',
  2409: 'Grubengas',
  2410: 'Klärgas',
  2411: 'Kernenergie',
  2412: 'Mineralölprodukte',
  2413: 'Nicht biogener Abfall',
  2414: 'Solare Strahlungsenergie',
  2415: 'Steinkohle',
  2416: 'Wasser',
  2417: 'Wind',
  2418: 'Sonstige Energieträger',
  2419: 'Wärmepumpe',
  2495: 'Stromspeicher',
  2496: 'Gasspeicher',
}

function energietraeger(roh: unknown): string {
  if (typeof roh === 'number') return ENERGIETRAEGER_CODES[roh] ?? `Code ${roh}`
  if (typeof roh === 'string' && roh.trim()) {
    const n = Number(roh)
    if (!Number.isNaN(n) && ENERGIETRAEGER_CODES[n]) return ENERGIETRAEGER_CODES[n]
    return roh
  }
  return 'Unbekannt'
}

// /Date(1690000000000)/ oder ISO-String → ISO-Datum (oder null)
function parseDatum(roh: unknown): string | null {
  if (typeof roh !== 'string' || !roh) return null
  const ms = /\/Date\((\d+)\)\//.exec(roh)
  if (ms) return new Date(Number(ms[1])).toISOString().slice(0, 10)
  const d = new Date(roh)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

function zahl(roh: unknown): number | null {
  if (typeof roh === 'number') return roh
  if (typeof roh === 'string') {
    const n = Number(roh.replace(/\./g, '').replace(',', '.'))
    return Number.isNaN(n) ? null : n
  }
  return null
}

// Liest einen Wert aus mehreren möglichen Feldnamen (die öffentliche JSON
// variiert je Kategorie).
function feld(zeile: Record<string, unknown>, ...namen: string[]): unknown {
  for (const n of namen) {
    if (zeile[n] !== undefined && zeile[n] !== null && zeile[n] !== '') return zeile[n]
  }
  return undefined
}

// Eine Roh-Zeile der MaStR-JSON in unser Modell überführen.
function normalisiere(
  zeile: Record<string, unknown>,
  typ: EinheitTyp,
): MaStrEinheit {
  return {
    mastrNr: String(
      feld(zeile, 'EinheitMastrNummer', 'MaStRNummer', 'MastrNummer') ?? '',
    ),
    name: String(
      feld(zeile, 'AnzeigeNameDerEinheit', 'NameDerEinheit', 'Name') ??
        'Einheit ohne Namen',
    ),
    betreiber: String(
      feld(zeile, 'BetreiberName', 'Betreiber', 'AnzeigeNameBetreiber') ??
        'Unbekannt',
    ),
    sparte: typ.sparte,
    richtung: typ.richtung,
    energietraeger:
      typ.richtung === 'Verbrauch' && typ.sparte === 'Strom'
        ? 'Stromverbrauch'
        : energietraeger(feld(zeile, 'Energietraeger', 'EnergietraegerName')),
    bruttoleistungKw: zahl(feld(zeile, 'Bruttoleistung', 'BruttoleistungDerEinheit')),
    nettoleistungKw: zahl(feld(zeile, 'Nettonennleistung', 'NettoleistungDerEinheit')),
    inbetriebnahme: parseDatum(
      feld(zeile, 'InbetriebnahmeDatum', 'Inbetriebnahmedatum'),
    ),
    status: String(feld(zeile, 'BetriebsStatusName', 'BetriebsStatus', 'EinheitBetriebsstatus') ?? '—'),
    plz: String(feld(zeile, 'Postleitzahl', 'Plz') ?? ''),
    ort: String(feld(zeile, 'Ort', 'Gemeinde') ?? ''),
    lat: zahl(feld(zeile, 'Breitengrad', 'Latitude')),
    lng: zahl(feld(zeile, 'Laengengrad', 'Longitude')),
  }
}

interface KendoAntwort {
  Data?: Record<string, unknown>[]
  Total?: number
}

async function fetchSeite(
  typ: EinheitTyp,
  gemeinde: string,
  seite: number,
  seitenGroesse: number,
): Promise<KendoAntwort> {
  const filter = `Gemeinde~eq~'${gemeinde}'`
  const params = new URLSearchParams({
    sort: '',
    page: String(seite),
    pageSize: String(seitenGroesse),
    group: '',
    filter,
  })
  const url = `${BASIS}/${typ.endpoint}?${params.toString()}`

  let letzterFehler: unknown
  for (let versuch = 0; versuch < 4; versuch++) {
    try {
      const r = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'NetzBau-Manager/0.1 (MaStR-Import Düsseldorf)',
        },
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return (await r.json()) as KendoAntwort
    } catch (e) {
      letzterFehler = e
      // exponentielles Backoff: 1s, 2s, 4s
      await new Promise((res) => setTimeout(res, 1000 * 2 ** versuch))
    }
  }
  throw new Error(
    `MaStR-Abruf fehlgeschlagen (${typ.endpoint}, Seite ${seite}): ${String(
      letzterFehler,
    )}`,
  )
}

export interface DownloadOptionen {
  gemeinde?: string
  seitenGroesse?: number
  /** Obergrenze je Kategorie (Schutz vor sehr großen Abrufen); 0 = unbegrenzt */
  maxProTyp?: number
  /** Fortschrittsausgabe */
  log?: (text: string) => void
}

// Lädt alle Einheiten-Kategorien für eine Gemeinde und gibt sie normalisiert
// zurück.
export async function ladeMaStrEinheiten(
  opts: DownloadOptionen = {},
): Promise<MaStrEinheit[]> {
  const gemeinde = opts.gemeinde ?? 'Düsseldorf'
  const seitenGroesse = opts.seitenGroesse ?? 250
  const maxProTyp = opts.maxProTyp ?? 0
  const log = opts.log ?? (() => {})

  const alle: MaStrEinheit[] = []

  for (const typ of EINHEIT_TYPEN) {
    log(`▶ ${typ.sparte}/${typ.richtung} (${typ.endpoint}) …`)
    let seite = 1
    let geladen = 0
    while (true) {
      const antwort = await fetchSeite(typ, gemeinde, seite, seitenGroesse)
      const zeilen = antwort.Data ?? []
      if (zeilen.length === 0) break
      for (const z of zeilen) alle.push(normalisiere(z, typ))
      geladen += zeilen.length
      log(`   Seite ${seite}: ${zeilen.length} (gesamt ${geladen})`)

      const gesamt = antwort.Total ?? 0
      if (geladen >= gesamt && gesamt > 0) break
      if (zeilen.length < seitenGroesse) break
      if (maxProTyp > 0 && geladen >= maxProTyp) break
      seite++
    }
    log(`✔ ${typ.sparte}/${typ.richtung}: ${geladen} Einheiten`)
  }

  return alle
}
