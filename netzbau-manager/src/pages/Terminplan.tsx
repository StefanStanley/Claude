import { useMemo, useState } from 'react'
import { useStore } from '../data/store'
import { statusFarbe, formatDatum } from '../data/helpers'
import { StatusBadge } from '../components/ui'
import { SparteIcon } from '../components/icons'

const MONAT_BREITE = 70 // px je Monat
const HEUTE = new Date('2026-06-08')

const MONATSNAMEN = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
]

interface MonatsSpalte {
  jahr: number
  monat: number // 0-basiert
}

// Bruchteil-Monate seit Achsenbeginn → Pixel-Position
function monatsOffset(datum: Date, start: MonatsSpalte): number {
  const tageImMonat = new Date(
    datum.getFullYear(),
    datum.getMonth() + 1,
    0,
  ).getDate()
  const monate =
    (datum.getFullYear() - start.jahr) * 12 +
    (datum.getMonth() - start.monat) +
    (datum.getDate() - 1) / tageImMonat
  return monate * MONAT_BREITE
}

export function Terminplan({ onOpen }: { onOpen: (id: string) => void }) {
  const { massnahmen } = useStore()
  const [nurAktive, setNurAktive] = useState(false)

  const sichtbar = nurAktive
    ? massnahmen.filter((m) => m.status !== 'Abgeschlossen')
    : massnahmen

  const { spalten, achsenStart } = useMemo(() => {
    const starts = massnahmen.map((m) => new Date(m.start))
    const enden = massnahmen.map((m) => new Date(m.ende))
    const min = new Date(Math.min(...starts.map((d) => +d)))
    const max = new Date(Math.max(...enden.map((d) => +d)))
    const start: MonatsSpalte = { jahr: min.getFullYear(), monat: min.getMonth() }
    const cols: MonatsSpalte[] = []
    let j = min.getFullYear()
    let mo = min.getMonth()
    while (j < max.getFullYear() || (j === max.getFullYear() && mo <= max.getMonth())) {
      cols.push({ jahr: j, monat: mo })
      mo++
      if (mo > 11) {
        mo = 0
        j++
      }
    }
    return { spalten: cols, achsenStart: start }
  }, [massnahmen])

  const gesamtBreite = spalten.length * MONAT_BREITE
  const heuteLinks = monatsOffset(HEUTE, achsenStart)

  return (
    <>
      <div className="toolbar">
        <p className="cell-muted" style={{ margin: 0 }}>
          Bauzeitenplan über alle Maßnahmen — Balkenfarbe nach Statusphase,
          Rauten markieren Meilensteine.
        </p>
        <div className="view-toggle" style={{ marginLeft: 'auto' }}>
          <button
            className={!nurAktive ? 'active' : ''}
            onClick={() => setNurAktive(false)}
          >
            Alle
          </button>
          <button
            className={nurAktive ? 'active' : ''}
            onClick={() => setNurAktive(true)}
          >
            Nur aktive
          </button>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="gantt-scroll">
          <div className="gantt" style={{ width: 220 + gesamtBreite }}>
            {/* Kopfzeile: Jahre + Monate */}
            <div className="gantt-head">
              <div className="gantt-head-label">Maßnahme</div>
              <div className="gantt-head-timeline" style={{ width: gesamtBreite }}>
                <div className="gantt-months">
                  {spalten.map((s, i) => (
                    <div
                      key={i}
                      className="gantt-month"
                      style={{ width: MONAT_BREITE }}
                    >
                      <span className="gantt-month-name">
                        {MONATSNAMEN[s.monat]}
                      </span>
                      {(s.monat === 0 || i === 0) && (
                        <span className="gantt-year">{s.jahr}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Heute-Linie */}
            <div
              className="gantt-today"
              style={{ left: 220 + heuteLinks }}
              title={`Heute: ${formatDatum(HEUTE.toISOString())}`}
            >
              <span className="gantt-today-label">Heute</span>
            </div>

            {/* Zeilen */}
            {sichtbar.map((m) => {
              const start = new Date(m.start)
              const ende = new Date(m.ende)
              const links = monatsOffset(start, achsenStart)
              const breite = Math.max(
                monatsOffset(ende, achsenStart) - links,
                14,
              )
              const farbe = statusFarbe(m.status)
              return (
                <div
                  key={m.id}
                  className="gantt-row"
                  onClick={() => onOpen(m.id)}
                >
                  <div className="gantt-row-label">
                    <div className="gantt-row-title">{m.titel}</div>
                    <div
                      className="gantt-row-sub"
                      style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <SparteIcon sparte={m.sparte} size={12} />
                      {m.kennung} · {m.gemeinde}
                    </div>
                  </div>
                  <div
                    className="gantt-row-track"
                    style={{ width: gesamtBreite }}
                  >
                    {/* vertikale Monatsraster */}
                    {spalten.map((_, i) => (
                      <div
                        key={i}
                        className="gantt-grid-line"
                        style={{ left: i * MONAT_BREITE }}
                      />
                    ))}
                    {/* Balken */}
                    <div
                      className="gantt-bar"
                      style={{
                        left: links,
                        width: breite,
                        background: `${farbe}33`,
                        borderColor: farbe,
                      }}
                    >
                      <div
                        className="gantt-bar-fill"
                        style={{
                          width: `${m.fortschritt}%`,
                          background: farbe,
                        }}
                      />
                      <span className="gantt-bar-label">{m.fortschritt}%</span>
                    </div>
                    {/* Meilensteine */}
                    {m.meilensteine.map((ms) => {
                      const pos = monatsOffset(new Date(ms.datum), achsenStart)
                      return (
                        <div
                          key={ms.id}
                          className="gantt-milestone"
                          style={{
                            left: pos,
                            background: ms.erledigt ? farbe : '#fff',
                            borderColor: farbe,
                          }}
                          title={`${ms.titel} — ${formatDatum(ms.datum)}`}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="gantt-legend">
        <div className="legend-row">
          <span className="gantt-milestone" style={{ position: 'static', borderColor: 'var(--accent)', background: 'var(--accent)' }} />
          Meilenstein erledigt
        </div>
        <div className="legend-row">
          <span className="gantt-milestone" style={{ position: 'static', borderColor: 'var(--accent)', background: '#fff' }} />
          Meilenstein offen
        </div>
        <div className="legend-row" style={{ marginLeft: 'auto' }}>
          <StatusBadge status="Bau" /> Balkenfarbe = aktuelle Phase
        </div>
      </div>
    </>
  )
}
