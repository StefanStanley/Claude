import { useStore } from '../data/store'
import { formatEuro, formatDatum, tageBis, statusFarbe } from '../data/helpers'
import { StatusBadge, PrioPill, Progress } from '../components/ui'
import type { View } from '../App'

export function Dashboard({
  onOpen,
  onNavigate,
}: {
  onOpen: (id: string) => void
  onNavigate: (v: View) => void
}) {
  const { massnahmen } = useStore()
  const aktiv = massnahmen.filter((m) => m.status !== 'Abgeschlossen')
  const inBau = massnahmen.filter((m) => m.status === 'Bau').length
  const budgetGesamt = massnahmen.reduce((s, m) => s + m.budget, 0)
  const ausgabenGesamt = massnahmen.reduce((s, m) => s + m.ausgaben, 0)
  const kritisch = massnahmen.filter(
    (m) => m.prioritaet === 'Kritisch' && m.status !== 'Abgeschlossen',
  ).length

  // Anstehende Meilensteine über alle Maßnahmen
  const meilensteine = massnahmen
    .flatMap((m) =>
      m.meilensteine
        .filter((ms) => !ms.erledigt)
        .map((ms) => ({ ...ms, mass: m })),
    )
    .sort((a, b) => +new Date(a.datum) - +new Date(b.datum))
    .slice(0, 6)

  const kpis = [
    {
      label: 'Aktive Maßnahmen',
      value: aktiv.length,
      sub: `davon ${inBau} in Bauausführung`,
      icon: '🏗️',
      farbe: '#0e7c5a',
    },
    {
      label: 'Budgetvolumen 2026',
      value: formatEuro(budgetGesamt),
      sub: `${Math.round((ausgabenGesamt / budgetGesamt) * 100)} % verausgabt`,
      icon: '💶',
      farbe: '#1e3a5f',
    },
    {
      label: 'Kritische Vorhaben',
      value: kritisch,
      sub: 'erfordern Aufmerksamkeit',
      icon: '⚠️',
      farbe: '#dc2626',
    },
    {
      label: 'Fällige Meilensteine',
      value: meilensteine.filter((m) => tageBis(m.datum) <= 14).length,
      sub: 'in den nächsten 14 Tagen',
      icon: '📌',
      farbe: '#d97706',
    },
  ]

  const aktivitaeten = [
    { farbe: '#0e7c5a', text: 'ONS Lindenstraße: Stationsgebäude gesetzt', zeit: 'vor 2 Std.' },
    { farbe: '#d97706', text: 'Kreuzungsvereinbarung B8 in Prüfung beim Straßenbauamt', zeit: 'gestern' },
    { farbe: '#6366f1', text: 'Neue Maßnahme „UW Oberkassel" angelegt', zeit: 'vor 2 Tagen' },
    { farbe: '#0891b2', text: 'Hausanschlüsse Am Quellenbusch (Gerresheim): Tiefbau ausgeschrieben', zeit: 'vor 3 Tagen' },
  ]

  return (
    <>
      <div className="kpi-grid">
        {kpis.map((k) => (
          <div className="kpi" key={k.label}>
            <div className="kpi-top">
              <span className="kpi-label">{k.label}</span>
              <span
                className="kpi-icon"
                style={{ background: `${k.farbe}1a`, color: k.farbe }}
              >
                {k.icon}
              </span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Maßnahmen in Ausführung</h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('massnahmen')}
            >
              Alle anzeigen →
            </button>
          </div>
          <div style={{ padding: '6px 20px 14px' }}>
            {aktiv
              .filter((m) => m.status === 'Bau' || m.status === 'Abnahme')
              .map((m) => (
                <div
                  key={m.id}
                  className="task-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onOpen(m.id)}
                >
                  <div className="task-info">
                    <strong>{m.titel}</strong>
                    <span>
                      {m.kennung} · {m.gemeinde} · Bauleitung {m.bauleiter}
                    </span>
                  </div>
                  <div style={{ width: 120 }}>
                    <Progress value={m.fortschritt} color={statusFarbe(m.status)} />
                  </div>
                  <span
                    style={{
                      width: 36,
                      textAlign: 'right',
                      fontWeight: 600,
                      fontSize: 12.5,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {m.fortschritt}%
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Aktivität</h3>
          </div>
          <div style={{ padding: '6px 20px 14px' }}>
            {aktivitaeten.map((a, i) => (
              <div className="activity-row" key={i}>
                <span className="activity-dot" style={{ background: a.farbe }} />
                <div>
                  <p>{a.text}</p>
                  <time>{a.zeit}</time>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h3>Anstehende Meilensteine</h3>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onNavigate('kalender')}
          >
            Terminplan →
          </button>
        </div>
        <table className="proj-table" style={{ border: 'none', borderRadius: 0 }}>
          <thead>
            <tr>
              <th>Meilenstein</th>
              <th>Maßnahme</th>
              <th>Termin</th>
              <th>Frist</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {meilensteine.map((ms) => {
              const tage = tageBis(ms.datum)
              return (
                <tr key={ms.id} onClick={() => onOpen(ms.mass.id)}>
                  <td>
                    <span className="proj-title">{ms.titel}</span>
                  </td>
                  <td className="cell-muted">{ms.mass.titel}</td>
                  <td className="cell-muted">{formatDatum(ms.datum)}</td>
                  <td>
                    <span className={tage <= 14 ? 'warn-text' : 'cell-muted'}>
                      {tage < 0
                        ? `${Math.abs(tage)} T überfällig`
                        : `in ${tage} Tagen`}
                    </span>
                  </td>
                  <td>
                    <div className="row gap-8">
                      <StatusBadge status={ms.mass.status} />
                      <PrioPill prio={ms.mass.prioritaet} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
