import { useState } from 'react'
import { massnahmen } from '../data/massnahmen'
import {
  formatEuro,
  formatDatum,
  statusFarbe,
  sparteIcon,
} from '../data/helpers'
import { StatusBadge, PrioPill, Progress } from '../components/ui'
import type { Aufgabe, Genehmigung } from '../data/types'

const genehmigungFarbe: Record<Genehmigung['status'], string> = {
  Erteilt: '#0e7c5a',
  'In Prüfung': '#d97706',
  Beantragt: '#0891b2',
  Abgelehnt: '#dc2626',
}

const dokIcon: Record<string, string> = {
  Plan: '📐',
  Vertrag: '📄',
  Foto: '🖼️',
  Bericht: '📊',
  Genehmigung: '✅',
}

export function MassnahmeDetail({
  id,
  onBack,
}: {
  id: string
  onBack: () => void
}) {
  const massnahme = massnahmen.find((m) => m.id === id)!
  // Lokaler Zustand für die abhakbaren Aufgaben (Prototyp-Interaktivität)
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>(massnahme.aufgaben)

  const toggle = (aId: string) =>
    setAufgaben((prev) =>
      prev.map((a) => (a.id === aId ? { ...a, erledigt: !a.erledigt } : a)),
    )

  const erledigt = aufgaben.filter((a) => a.erledigt).length
  const budgetProzent = Math.round(
    (massnahme.ausgaben / massnahme.budget) * 100,
  )

  return (
    <>
      <button className="detail-back" onClick={onBack}>
        ← Zurück zur Übersicht
      </button>

      <div className="detail-header">
        <div className="detail-header-top">
          <div>
            <div className="proj-kennung" style={{ marginBottom: 4 }}>
              {sparteIcon(massnahme.sparte)} {massnahme.sparte} ·{' '}
              {massnahme.kennung}
            </div>
            <h2>{massnahme.titel}</h2>
            <div className="detail-tags">
              <StatusBadge status={massnahme.status} />
              <PrioPill prio={massnahme.prioritaet} />
              <span className="cell-muted">
                📍 {massnahme.ort}, {massnahme.gemeinde}
              </span>
            </div>
          </div>
          <div className="detail-actions">
            <button className="btn btn-ghost btn-sm">✎ Bearbeiten</button>
            <button className="btn btn-primary btn-sm">Status ändern</button>
          </div>
        </div>

        <div className="detail-stats">
          <div className="detail-stat">
            <div className="detail-stat-label">Fortschritt</div>
            <div className="detail-stat-value">{massnahme.fortschritt} %</div>
            <div className="budget-bar-wrap">
              <Progress
                value={massnahme.fortschritt}
                color={statusFarbe(massnahme.status)}
              />
            </div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-label">Budget / Ausgaben</div>
            <div className="detail-stat-value">
              {formatEuro(massnahme.budget)}
            </div>
            <div className="kpi-sub">
              <span className={budgetProzent > 95 ? 'warn-text' : ''}>
                {formatEuro(massnahme.ausgaben)} ({budgetProzent} %)
              </span>
            </div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-label">Bauzeitraum</div>
            <div className="detail-stat-value" style={{ fontSize: 14 }}>
              {formatDatum(massnahme.start)} – {formatDatum(massnahme.ende)}
            </div>
          </div>
          <div className="detail-stat">
            <div className="detail-stat-label">
              {massnahme.trasseLaengeM
                ? 'Trassenlänge'
                : 'Spannungsebene'}
            </div>
            <div className="detail-stat-value">
              {massnahme.trasseLaengeM
                ? `${massnahme.trasseLaengeM.toLocaleString('de-DE')} m`
                : massnahme.spannungsebene}
            </div>
            <div className="kpi-sub">Tiefbau: {massnahme.tiefbaufirma}</div>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card card-pad">
            <div className="section-title">Beschreibung</div>
            <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>
              {massnahme.beschreibung}
            </p>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>
                Aufgaben &amp; Gewerke ({erledigt}/{aufgaben.length})
              </h3>
              <button className="btn btn-ghost btn-sm">+ Aufgabe</button>
            </div>
            <div style={{ padding: '4px 20px 14px' }}>
              {aufgaben.map((a) => (
                <div className="task-row" key={a.id}>
                  <button
                    className={`checkbox ${a.erledigt ? 'checked' : ''}`}
                    onClick={() => toggle(a.id)}
                  >
                    {a.erledigt ? '✓' : ''}
                  </button>
                  <div className={`task-info ${a.erledigt ? 'done' : ''}`}>
                    <strong>{a.titel}</strong>
                    <span>
                      {a.zustaendig} · fällig {formatDatum(a.faellig)}
                    </span>
                  </div>
                  <span className="gewerk-tag">{a.gewerk}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Genehmigungen</h3>
            </div>
            <div style={{ padding: '4px 20px 14px' }}>
              {massnahme.genehmigungen.length === 0 && (
                <div className="empty">Keine Genehmigungen erforderlich</div>
              )}
              {massnahme.genehmigungen.map((g) => (
                <div className="task-row" key={g.id}>
                  <div className="task-info">
                    <strong>{g.art}</strong>
                    <span>
                      {g.behoerde} · {formatDatum(g.datum)}
                    </span>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: `${genehmigungFarbe[g.status]}1a`,
                      color: genehmigungFarbe[g.status],
                    }}
                  >
                    <span
                      className="badge-dot"
                      style={{ background: genehmigungFarbe[g.status] }}
                    />
                    {g.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card card-pad">
            <div className="section-title">Meilensteine</div>
            <div className="timeline">
              {massnahme.meilensteine.map((ms) => (
                <div className="timeline-item" key={ms.id}>
                  <div
                    className={`timeline-dot ${ms.erledigt ? 'done' : 'open'}`}
                  >
                    {ms.erledigt ? '✓' : ''}
                  </div>
                  <div className="timeline-content">
                    <strong>{ms.titel}</strong>
                    <span>{formatDatum(ms.datum)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div className="section-title">Projektbeteiligte</div>
            <div className="mini-list">
              {massnahme.beteiligte.map((p) => (
                <div className="mini-row" key={p.id}>
                  <div className="avatar">
                    {p.name
                      .split(' ')
                      .map((t) => t[0])
                      .slice(-2)
                      .join('')}
                  </div>
                  <div className="mini-row-info">
                    <strong>{p.name}</strong>
                    <span>
                      {p.rolle}
                      {p.firma ? ` · ${p.firma}` : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <div className="section-title">Dokumente</div>
            <div className="mini-list">
              {massnahme.dokumente.map((d) => (
                <div className="mini-row" key={d.id}>
                  <div className="doc-icon">{dokIcon[d.typ] ?? '📄'}</div>
                  <div className="mini-row-info">
                    <strong>{d.name}</strong>
                    <span>
                      {d.typ} · {d.groesse} · {formatDatum(d.geaendert)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
