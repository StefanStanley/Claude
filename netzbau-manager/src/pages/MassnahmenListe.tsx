import { useState } from 'react'
import { massnahmen, STATUS_REIHENFOLGE } from '../data/massnahmen'
import { formatEuro, formatDatum, statusFarbe, sparteIcon } from '../data/helpers'
import { StatusBadge, PrioPill, Progress } from '../components/ui'
import type { Massnahme } from '../data/types'

type Ansicht = 'tabelle' | 'kanban'

export function MassnahmenListe({
  onOpen,
  onNeu,
}: {
  onOpen: (id: string) => void
  onNeu: () => void
}) {
  const [ansicht, setAnsicht] = useState<Ansicht>('tabelle')
  const [filter, setFilter] = useState<string>('Alle')

  const filterOptionen = ['Alle', 'Bau', 'Planung', 'Genehmigung', 'Kritisch']

  const gefiltert = massnahmen.filter((m) => {
    if (filter === 'Alle') return true
    if (filter === 'Kritisch') return m.prioritaet === 'Kritisch'
    return m.status === filter
  })

  return (
    <>
      <div className="toolbar">
        {filterOptionen.map((f) => (
          <button
            key={f}
            className={`filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <div className="view-toggle">
          <button
            className={ansicht === 'tabelle' ? 'active' : ''}
            onClick={() => setAnsicht('tabelle')}
          >
            ☰ Tabelle
          </button>
          <button
            className={ansicht === 'kanban' ? 'active' : ''}
            onClick={() => setAnsicht('kanban')}
          >
            ▦ Kanban
          </button>
        </div>
      </div>

      {ansicht === 'tabelle' ? (
        <Tabelle daten={gefiltert} onOpen={onOpen} />
      ) : (
        <Kanban daten={gefiltert} onOpen={onOpen} onNeu={onNeu} />
      )}
    </>
  )
}

function Tabelle({
  daten,
  onOpen,
}: {
  daten: Massnahme[]
  onOpen: (id: string) => void
}) {
  return (
    <table className="proj-table">
      <thead>
        <tr>
          <th>Maßnahme</th>
          <th>Art</th>
          <th>Status</th>
          <th>Priorität</th>
          <th>Bauleitung</th>
          <th>Geplantes Ende</th>
          <th>Budget</th>
          <th>Fortschritt</th>
        </tr>
      </thead>
      <tbody>
        {daten.map((m) => (
          <tr key={m.id} onClick={() => onOpen(m.id)}>
            <td>
              <div className="proj-kennung">{m.kennung}</div>
              <div className="proj-title">{m.titel}</div>
              <div className="proj-kennung">
                {sparteIcon(m.sparte)} {m.gemeinde}
              </div>
            </td>
            <td className="cell-muted">{m.art}</td>
            <td>
              <StatusBadge status={m.status} />
            </td>
            <td>
              <PrioPill prio={m.prioritaet} />
            </td>
            <td className="cell-muted">{m.bauleiter}</td>
            <td className="cell-muted">{formatDatum(m.ende)}</td>
            <td className="cell-muted">{formatEuro(m.budget)}</td>
            <td>
              <div className="progress-cell">
                <Progress value={m.fortschritt} color={statusFarbe(m.status)} />
                <span>{m.fortschritt}%</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Kanban({
  daten,
  onOpen,
}: {
  daten: Massnahme[]
  onOpen: (id: string) => void
  onNeu: () => void
}) {
  return (
    <div className="kanban">
      {STATUS_REIHENFOLGE.map((status) => {
        const spalte = daten.filter((m) => m.status === status)
        return (
          <div className="kanban-col" key={status}>
            <div className="kanban-col-head">
              <span
                className="badge-dot"
                style={{ background: statusFarbe(status) }}
              />
              {status}
              <span className="count">{spalte.length}</span>
            </div>
            <div className="kanban-body">
              {spalte.map((m) => (
                <div
                  className="kanban-card"
                  key={m.id}
                  onClick={() => onOpen(m.id)}
                >
                  <div className="kanban-card-top">
                    <span className="proj-kennung">{m.kennung}</span>
                    <PrioPill prio={m.prioritaet} />
                  </div>
                  <h4>{m.titel}</h4>
                  <div className="kanban-meta">
                    {sparteIcon(m.sparte)} {m.art} · {m.gemeinde}
                  </div>
                  <Progress value={m.fortschritt} color={statusFarbe(status)} />
                </div>
              ))}
              {spalte.length === 0 && (
                <div className="empty" style={{ padding: 14, fontSize: 12 }}>
                  —
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
