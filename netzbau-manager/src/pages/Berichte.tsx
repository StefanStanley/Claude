import { useStore } from '../data/store'
import {
  formatEuro,
  statusFarbe,
  prioritaetFarbe,
} from '../data/helpers'
import { Donut, HBars } from '../components/charts'
import type { Status } from '../data/types'

const ART_FARBEN: Record<string, string> = {
  Kabeltrasse: '#0e7c5a',
  Ortsnetzstation: '#1e3a5f',
  Hausanschluss: '#0891b2',
  Umspannwerk: '#7c3aed',
  Netzverstärkung: '#d97706',
  Erneuerung: '#475569',
  'Smart-Meter-Rollout': '#db2777',
}

export function Berichte() {
  const { massnahmen } = useStore()
  const budgetGesamt = massnahmen.reduce((s, m) => s + m.budget, 0)
  const ausgabenGesamt = massnahmen.reduce((s, m) => s + m.ausgaben, 0)
  const oFortschritt = Math.round(
    massnahmen.reduce((s, m) => s + m.fortschritt, 0) / massnahmen.length,
  )

  // Status-Verteilung
  const statusListe: Status[] = [
    'Planung',
    'Genehmigung',
    'Ausschreibung',
    'Bau',
    'Abnahme',
    'Abgeschlossen',
  ]
  const statusSegmente = statusListe
    .map((s) => ({
      label: s,
      value: massnahmen.filter((m) => m.status === s).length,
      color: statusFarbe(s),
    }))
    .filter((s) => s.value > 0)

  // Verteilung nach Art
  const artMap = new Map<string, number>()
  massnahmen.forEach((m) => artMap.set(m.art, (artMap.get(m.art) ?? 0) + 1))
  const artBars = [...artMap.entries()]
    .map(([art, anzahl]) => ({
      label: art,
      value: anzahl,
      color: ART_FARBEN[art] ?? '#64748b',
      anzeige: String(anzahl),
    }))
    .sort((a, b) => b.value - a.value)

  // Budget vs. Ausgaben je Maßnahme
  const budgetBars = [...massnahmen]
    .sort((a, b) => b.budget - a.budget)
    .map((m) => ({
      label: m.titel,
      value: m.budget,
      inner: m.ausgaben,
      color: statusFarbe(m.status),
      anzeige: formatEuro(m.budget),
    }))

  // Auslastung Tiefbaufirmen
  const firmaMap = new Map<
    string,
    { anzahl: number; volumen: number; aktiv: number }
  >()
  massnahmen.forEach((m) => {
    if (!m.tiefbaufirma || m.tiefbaufirma === '—' || m.tiefbaufirma.startsWith('noch'))
      return
    const e = firmaMap.get(m.tiefbaufirma) ?? { anzahl: 0, volumen: 0, aktiv: 0 }
    e.anzahl++
    e.volumen += m.budget
    if (m.status === 'Bau' || m.status === 'Abnahme') e.aktiv++
    firmaMap.set(m.tiefbaufirma, e)
  })
  const firmen = [...firmaMap.entries()].sort(
    (a, b) => b[1].volumen - a[1].volumen,
  )

  // Budget nach Gemeinde
  const gemeindeMap = new Map<string, number>()
  massnahmen.forEach((m) =>
    gemeindeMap.set(m.gemeinde, (gemeindeMap.get(m.gemeinde) ?? 0) + m.budget),
  )
  const gemeindeBars = [...gemeindeMap.entries()]
    .map(([g, v]) => ({
      label: g,
      value: v,
      color: '#1e3a5f',
      anzeige: formatEuro(v),
    }))
    .sort((a, b) => b.value - a.value)

  const kpis = [
    { label: 'Gesamtbudget', value: formatEuro(budgetGesamt), farbe: '#1e3a5f' },
    {
      label: 'Verausgabt',
      value: `${Math.round((ausgabenGesamt / budgetGesamt) * 100)} %`,
      sub: formatEuro(ausgabenGesamt),
      farbe: '#0e7c5a',
    },
    { label: 'Ø Fortschritt', value: `${oFortschritt} %`, farbe: '#0891b2' },
    { label: 'Maßnahmen gesamt', value: massnahmen.length, farbe: '#7c3aed' },
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
                📊
              </span>
            </div>
            <div className="kpi-value" style={{ fontSize: 22 }}>
              {k.value}
            </div>
            {k.sub && <div className="kpi-sub">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card card-pad">
          <div className="section-title">Budget vs. Ausgaben je Maßnahme</div>
          <p className="cell-muted" style={{ marginBottom: 14, fontSize: 12 }}>
            Gefüllter Anteil = bereits verausgabt.
          </p>
          <HBars items={budgetBars} />
        </div>
        <div className="card card-pad">
          <div className="section-title">Maßnahmen nach Statusphase</div>
          <Donut segmente={statusSegmente} einheit="Maßnahmen" />
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card card-pad">
          <div className="section-title">Maßnahmen nach Art</div>
          <HBars items={artBars} />
        </div>
        <div className="card card-pad">
          <div className="section-title">Budgetvolumen nach Gemeinde</div>
          <HBars items={gemeindeBars} />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Auslastung Tiefbaufirmen</h3>
        </div>
        <table className="proj-table" style={{ border: 'none', borderRadius: 0 }}>
          <thead>
            <tr>
              <th>Firma</th>
              <th>Beauftragte Maßnahmen</th>
              <th>Davon aktiv</th>
              <th>Auftragsvolumen</th>
              <th>Anteil am Gesamtbudget</th>
            </tr>
          </thead>
          <tbody>
            {firmen.map(([firma, e]) => (
              <tr key={firma} style={{ cursor: 'default' }}>
                <td>
                  <span className="proj-title">{firma}</span>
                </td>
                <td className="cell-muted">{e.anzahl}</td>
                <td>
                  <span
                    className="badge"
                    style={{
                      background: e.aktiv
                        ? `${prioritaetFarbe('Hoch')}1a`
                        : 'var(--surface-2)',
                      color: e.aktiv ? prioritaetFarbe('Hoch') : 'var(--text-muted)',
                    }}
                  >
                    {e.aktiv} in Ausführung
                  </span>
                </td>
                <td className="cell-muted">{formatEuro(e.volumen)}</td>
                <td>
                  <div className="progress-cell">
                    <div className="progress">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${(e.volumen / budgetGesamt) * 100}%`,
                          background: '#0e7c5a',
                        }}
                      />
                    </div>
                    <span>{Math.round((e.volumen / budgetGesamt) * 100)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
