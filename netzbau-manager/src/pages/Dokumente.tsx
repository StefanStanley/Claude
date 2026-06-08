import { useMemo, useState } from 'react'
import { useStore } from '../data/store'
import { formatDatum } from '../data/helpers'
import type { Dokument } from '../data/types'

const TYP_FARBEN: Record<Dokument['typ'], string> = {
  Plan: '#0e7c5a',
  Vertrag: '#1e3a5f',
  Foto: '#0891b2',
  Bericht: '#7c3aed',
  Genehmigung: '#d97706',
}

const TYP_ICON: Record<Dokument['typ'], string> = {
  Plan: '📐',
  Vertrag: '📄',
  Foto: '🖼️',
  Bericht: '📊',
  Genehmigung: '✅',
}

interface DokZeile extends Dokument {
  massnahmeId: string
  massnahmeTitel: string
  kennung: string
}

export function Dokumente({ onOpen }: { onOpen: (id: string) => void }) {
  const { massnahmen } = useStore()
  const [filter, setFilter] = useState<string>('Alle')
  const [suche, setSuche] = useState('')

  const alle: DokZeile[] = useMemo(
    () =>
      massnahmen.flatMap((m) =>
        m.dokumente.map((d) => ({
          ...d,
          massnahmeId: m.id,
          massnahmeTitel: m.titel,
          kennung: m.kennung,
        })),
      ),
    [massnahmen],
  )

  const typen = ['Alle', 'Plan', 'Vertrag', 'Foto', 'Bericht', 'Genehmigung']

  const gefiltert = alle
    .filter((d) => (filter === 'Alle' ? true : d.typ === filter))
    .filter((d) =>
      suche.trim() === ''
        ? true
        : (d.name + d.massnahmeTitel + d.kennung)
            .toLowerCase()
            .includes(suche.toLowerCase()),
    )
    .sort((a, b) => +new Date(b.geaendert) - +new Date(a.geaendert))

  const proTyp = (typ: Dokument['typ']) =>
    alle.filter((d) => d.typ === typ).length

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {(['Plan', 'Vertrag', 'Foto', 'Bericht', 'Genehmigung'] as const).map(
          (t) => (
            <div className="kpi" key={t}>
              <div className="kpi-top">
                <span className="kpi-label">{t}</span>
                <span
                  className="kpi-icon"
                  style={{ background: `${TYP_FARBEN[t]}1a` }}
                >
                  {TYP_ICON[t]}
                </span>
              </div>
              <div className="kpi-value">{proTyp(t)}</div>
            </div>
          ),
        )}
      </div>

      <div className="toolbar">
        {typen.map((t) => (
          <button
            key={t}
            className={`filter-chip ${filter === t ? 'active' : ''}`}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
        <div className="topbar-search" style={{ marginLeft: 'auto' }}>
          <span>🔍</span>
          <input
            placeholder="Dokument oder Maßnahme suchen…"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-head doc-grid-head">
          <span></span>
          <span className="kpi-label">Dokument</span>
          <span className="kpi-label">Typ</span>
          <span className="kpi-label">Maßnahme</span>
          <span className="kpi-label">Geändert</span>
          <span className="kpi-label" style={{ textAlign: 'right' }}>
            Größe
          </span>
        </div>
        {gefiltert.length === 0 && (
          <div className="empty">Keine Dokumente gefunden</div>
        )}
        {gefiltert.map((d) => (
          <div
            className="doc-list-row"
            key={d.id}
            onClick={() => onOpen(d.massnahmeId)}
          >
            <div className="doc-icon">{TYP_ICON[d.typ]}</div>
            <div style={{ minWidth: 0 }}>
              <div className="proj-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.name}
              </div>
            </div>
            <div>
              <span
                className="doc-type-tag"
                style={{ background: `${TYP_FARBEN[d.typ]}1a`, color: TYP_FARBEN[d.typ] }}
              >
                {d.typ}
              </span>
            </div>
            <div className="cell-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <div className="proj-kennung">{d.kennung}</div>
              {d.massnahmeTitel}
            </div>
            <div className="cell-muted">{formatDatum(d.geaendert)}</div>
            <div className="cell-muted" style={{ textAlign: 'right' }}>
              {d.groesse}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
