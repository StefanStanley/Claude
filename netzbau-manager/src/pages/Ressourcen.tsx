import { useMemo, useState } from 'react'
import { useStore } from '../data/store'
import { statusFarbe, formatEuro, formatDatum } from '../data/helpers'
import type { Massnahme } from '../data/types'

const HEUTE = new Date('2026-06-08')
const SPUR_BREITE = 640 // px Gesamtbreite der Zeitspur

type Modus = 'firmen' | 'bauleitung'

interface Ressource {
  name: string
  rolle: string
  massnahmen: Massnahme[]
}

function laeuftHeute(m: Massnahme): boolean {
  return new Date(m.start) <= HEUTE && new Date(m.ende) >= HEUTE
}

export function Ressourcen({ onOpen }: { onOpen: (id: string) => void }) {
  const { massnahmen } = useStore()
  const [modus, setModus] = useState<Modus>('firmen')

  // Gemeinsame Zeitachse
  const { tMin, spanne } = useMemo(() => {
    const starts = massnahmen.map((m) => +new Date(m.start))
    const enden = massnahmen.map((m) => +new Date(m.ende))
    const min = Math.min(...starts)
    const max = Math.max(...enden)
    return { tMin: min, spanne: max - min }
  }, [massnahmen])

  const pos = (iso: string) => ((+new Date(iso) - tMin) / spanne) * SPUR_BREITE
  const heuteLinks = ((+HEUTE - tMin) / spanne) * SPUR_BREITE

  const ressourcen: Ressource[] = useMemo(() => {
    const map = new Map<string, Ressource>()
    massnahmen.forEach((m) => {
      const key =
        modus === 'firmen' ? m.tiefbaufirma : m.bauleiter
      if (
        modus === 'firmen' &&
        (!key || key === '—' || key.startsWith('noch'))
      )
        return
      const rolle = modus === 'firmen' ? 'Auftragnehmer Tiefbau' : 'Bauleitung VNB'
      const e = map.get(key) ?? { name: key, rolle, massnahmen: [] }
      e.massnahmen.push(m)
      map.set(key, e)
    })
    return [...map.values()].sort(
      (a, b) => b.massnahmen.length - a.massnahmen.length,
    )
  }, [modus, massnahmen])

  return (
    <>
      <div className="toolbar">
        <p className="cell-muted" style={{ margin: 0 }}>
          Bindung von Auftragnehmern und Bauleitung über die Maßnahmen —
          rote Linie = heute. Mehrere gleichzeitige Balken zeigen
          Parallelauslastung.
        </p>
        <div className="view-toggle" style={{ marginLeft: 'auto' }}>
          <button
            className={modus === 'firmen' ? 'active' : ''}
            onClick={() => setModus('firmen')}
          >
            Tiefbaufirmen
          </button>
          <button
            className={modus === 'bauleitung' ? 'active' : ''}
            onClick={() => setModus('bauleitung')}
          >
            Bauleitung
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ressourcen.map((r) => {
          const aktiv = r.massnahmen.filter(laeuftHeute).length
          const volumen = r.massnahmen.reduce((s, m) => s + m.budget, 0)
          const auslastung = Math.min(aktiv, 3) / 3 // 3 parallele = volle Auslastung
          const farbe =
            auslastung >= 1 ? '#dc2626' : auslastung >= 0.66 ? '#d97706' : '#0e7c5a'
          return (
            <div className="card res-card" key={r.name}>
              <div className="res-info">
                <h4>{r.name}</h4>
                <div className="res-meta">{r.rolle}</div>
                <div className="res-meta" style={{ marginTop: 8 }}>
                  {r.massnahmen.length} Maßnahmen · {formatEuro(volumen)}
                </div>
                <div className="res-util">
                  <div className="res-util-bar">
                    <div
                      style={{
                        height: '100%',
                        width: `${auslastung * 100}%`,
                        background: farbe,
                      }}
                    />
                  </div>
                  <span
                    style={{ fontSize: 11.5, fontWeight: 600, color: farbe }}
                  >
                    {aktiv} aktiv
                  </span>
                </div>
              </div>
              <div className="res-assignments">
                <div
                  style={{
                    position: 'relative',
                    height: r.massnahmen.length * 26,
                  }}
                >
                  {/* Heute-Linie */}
                  <div
                    style={{
                      position: 'absolute',
                      left: heuteLinks,
                      top: -4,
                      bottom: -4,
                      width: 2,
                      background: '#dc2626',
                      zIndex: 1,
                    }}
                  />
                  {r.massnahmen
                    .slice()
                    .sort((a, b) => +new Date(a.start) - +new Date(b.start))
                    .map((m, i) => {
                      const links = pos(m.start)
                      const breite = Math.max(pos(m.ende) - links, 26)
                      return (
                        <div
                          key={m.id}
                          className="res-bar"
                          onClick={() => onOpen(m.id)}
                          title={`${m.titel} · ${formatDatum(m.start)} – ${formatDatum(m.ende)}`}
                          style={{
                            position: 'absolute',
                            top: i * 26,
                            left: links,
                            width: breite,
                            background: statusFarbe(m.status),
                          }}
                        >
                          {m.kennung}
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
