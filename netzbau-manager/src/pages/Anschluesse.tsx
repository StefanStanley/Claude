import { useMemo, useState } from 'react'
import { useStore } from '../data/store'
import { ANSCHLUSS_STATUS, anschlussFrist } from '../data/netzanschluesse'
import { formatDatum } from '../data/helpers'
import { Icon } from '../components/icons'
import type { AnschlussTyp, Netzanschluss } from '../data/types'
import type { View } from '../App'

const TYP_ICON: Record<AnschlussTyp, string> = {
  'PV-Einspeisung': 'zap',
  Wärmepumpe: 'heat',
  'E-Ladepunkt': 'plug',
  'Neubau Hausanschluss': 'projects',
  Gewerbeanschluss: 'projects',
  Batteriespeicher: 'zap',
}

const AMPEL_FARBE = { gruen: '#0f766e', gelb: '#d97706', rot: '#dc2626' }

export function Anschluesse({
  onOpen,
}: {
  onOpen: (id: string) => void
  onNavigate: (v: View) => void
}) {
  const { netzanschluesse } = useStore()
  const [typFilter, setTypFilter] = useState<string>('Alle')

  const aktive = netzanschluesse.filter((n) => n.status !== 'Inbetriebnahme')
  const ueberfaellig = aktive.filter((n) => anschlussFrist(n).ampel === 'rot')
  const leistung = aktive.reduce((s, n) => s + n.leistungKw, 0)
  const oDauer = Math.round(
    aktive.reduce((s, n) => s + anschlussFrist(n).tageOffen, 0) /
      Math.max(aktive.length, 1),
  )
  const p14a = aktive.filter((n) => n.paragraf14a).length

  const typen = ['Alle', ...new Set(netzanschluesse.map((n) => n.typ))]

  const gefiltert = useMemo(() => {
    const list =
      typFilter === 'Alle'
        ? netzanschluesse
        : netzanschluesse.filter((n) => n.typ === typFilter)
    // überfällige zuerst, dann nach Restfrist
    return [...list].sort(
      (a, b) => anschlussFrist(a).restTage - anschlussFrist(b).restTage,
    )
  }, [netzanschluesse, typFilter])

  const proStatus = (s: string) =>
    netzanschluesse.filter((n) => n.status === s).length

  const kpis = [
    { label: 'Offene Anträge', value: aktive.length, farbe: '#1e3a5f', icon: 'plug' },
    {
      label: 'Frist überschritten',
      value: ueberfaellig.length,
      farbe: ueberfaellig.length ? '#dc2626' : '#0f766e',
      icon: 'clock',
    },
    { label: 'Ø Bearbeitungsdauer', value: `${oDauer} T`, farbe: '#0891b2', icon: 'trend' },
    {
      label: 'Beantragte Leistung',
      value: `${(leistung / 1000).toFixed(1)} MW`,
      sub: `${p14a} × §14a EnWG`,
      farbe: '#7c3aed',
      icon: 'zap',
    },
  ]

  return (
    <>
      <div className="cockpit-intro">
        <div>
          <h2 className="cockpit-h2">Netzanschluss-Cockpit</h2>
          <p className="cell-muted">
            Energiewende-Pipeline mit SLA-Ampel – überfällige Anträge zuerst.
          </p>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((k) => (
          <div className="kpi" key={k.label}>
            <div className="kpi-top">
              <span className="kpi-label">{k.label}</span>
              <span
                className="kpi-icon"
                style={{ background: `${k.farbe}1a`, color: k.farbe }}
              >
                <Icon name={k.icon} size={18} />
              </span>
            </div>
            <div className="kpi-value" style={{ fontSize: 22 }}>
              {k.value}
            </div>
            {k.sub && <div className="kpi-sub">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="section-title">Antrags-Pipeline</div>
        <div className="pipeline">
          {ANSCHLUSS_STATUS.map((s, i) => (
            <div className="pipeline-step" key={s}>
              <div className="pipeline-count">{proStatus(s)}</div>
              <div className="pipeline-label">{s}</div>
              {i < ANSCHLUSS_STATUS.length - 1 && (
                <div className="pipeline-arrow">
                  <Icon name="arrowRight" size={14} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="toolbar">
        {typen.map((t) => (
          <button
            key={t}
            className={`filter-chip ${typFilter === t ? 'active' : ''}`}
            onClick={() => setTypFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <table className="proj-table">
        <thead>
          <tr>
            <th>SLA</th>
            <th>Antrag</th>
            <th>Typ</th>
            <th>Leistung</th>
            <th>Status</th>
            <th>Eingang</th>
            <th>Frist</th>
            <th>Sachbearbeitung</th>
          </tr>
        </thead>
        <tbody>
          {gefiltert.map((n: Netzanschluss) => {
            const f = anschlussFrist(n)
            return (
              <tr
                key={n.id}
                onClick={() => n.massnahmeId && onOpen(n.massnahmeId)}
                style={{ cursor: n.massnahmeId ? 'pointer' : 'default' }}
              >
                <td>
                  <span
                    className="sla-dot"
                    style={{ background: AMPEL_FARBE[f.ampel] }}
                    title={
                      f.abgeschlossen
                        ? 'Abgeschlossen'
                        : f.restTage < 0
                          ? `${Math.abs(f.restTage)} Tage überfällig`
                          : `${f.restTage} Tage Rest`
                    }
                  />
                </td>
                <td>
                  <div className="proj-kennung">{n.kennung}</div>
                  <div className="proj-title">{n.kunde}</div>
                  <div className="proj-kennung">{n.adresse}, {n.gemeinde}</div>
                </td>
                <td>
                  <span className="row gap-8" style={{ fontSize: 13 }}>
                    <Icon name={TYP_ICON[n.typ]} size={14} style={{ color: 'var(--text-muted)' }} />
                    {n.typ}
                    {n.paragraf14a && <span className="tag-14a">§14a</span>}
                  </span>
                </td>
                <td className="cell-muted">{n.leistungKw} kW</td>
                <td className="cell-muted">{n.status}</td>
                <td className="cell-muted">{formatDatum(n.eingang)}</td>
                <td>
                  {f.abgeschlossen ? (
                    <span className="cell-muted">erledigt</span>
                  ) : (
                    <span
                      style={{
                        color: AMPEL_FARBE[f.ampel],
                        fontWeight: 600,
                        fontSize: 12.5,
                      }}
                    >
                      {f.restTage < 0
                        ? `${Math.abs(f.restTage)} T überfällig`
                        : `${f.restTage} T Rest`}
                    </span>
                  )}
                </td>
                <td className="cell-muted">{n.sachbearbeiter}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
