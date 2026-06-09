import { useMemo } from 'react'
import { useStore } from '../data/store'
import {
  bewertePortfolio,
  ampelFarbe,
  ampelLabel,
  type Dimension,
} from '../data/risiko'
import { anschlussFrist } from '../data/netzanschluesse'
import { formatEuro } from '../data/helpers'
import { Icon } from '../components/icons'
import type { View } from '../App'

const DIM_ICON: Record<Dimension, string> = {
  Termin: 'calendar',
  Genehmigung: 'shield',
  Budget: 'euro',
  Kapazität: 'resources',
}

export function Cockpit({
  onOpen,
  onNavigate,
}: {
  onOpen: (id: string) => void
  onNavigate: (v: View) => void
}) {
  const { massnahmen, netzanschluesse } = useStore()

  const bewertet = useMemo(() => bewertePortfolio(massnahmen), [massnahmen])

  const rot = bewertet.filter((b) => b.bewertung.ampel === 'rot').length
  const gelb = bewertet.filter((b) => b.bewertung.ampel === 'gelb').length
  const gruen = bewertet.filter((b) => b.bewertung.ampel === 'gruen').length
  const aufKurs = bewertet.length
    ? Math.round((gruen / bewertet.length) * 100)
    : 100

  // Aggregierte Handlungsempfehlungen (Top-Aktion je Maßnahme), priorisiert
  const aktionen = bewertet
    .filter((b) => b.bewertung.topEmpfehlung)
    .map((b) => ({
      massnahme: b.massnahme,
      score: b.bewertung.score,
      empfehlung: b.bewertung.topEmpfehlung!,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)

  // Engpass: Tiefbaufirmen mit mehreren parallel laufenden Maßnahmen
  const firmaLast = new Map<string, number>()
  massnahmen.forEach((m) => {
    if (
      (m.status === 'Bau' || m.status === 'Abnahme') &&
      m.tiefbaufirma &&
      m.tiefbaufirma !== '—' &&
      !m.tiefbaufirma.toLowerCase().startsWith('noch')
    ) {
      firmaLast.set(m.tiefbaufirma, (firmaLast.get(m.tiefbaufirma) ?? 0) + 1)
    }
  })
  const engpaesse = [...firmaLast.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])

  const offeneGenehmigungen = massnahmen.flatMap((m) =>
    m.genehmigungen
      .filter((g) => g.status !== 'Erteilt' && g.status !== 'Abgelehnt')
      .map((g) => ({ m, g })),
  )

  // Netzanschluss-Frühindikatoren
  const aktiveNA = netzanschluesse.filter(
    (n) => n.status !== 'Inbetriebnahme',
  )
  const ueberfaellig = aktiveNA.filter(
    (n) => anschlussFrist(n).ampel === 'rot',
  ).length
  const knapp = aktiveNA.filter((n) => anschlussFrist(n).ampel === 'gelb').length
  const leistungPipeline = aktiveNA.reduce((s, n) => s + n.leistungKw, 0)

  const kpis = [
    {
      label: 'Portfolio-Risiko',
      value: `${rot} kritisch`,
      sub: `${gelb} beobachten · ${gruen} auf Kurs`,
      icon: 'cockpit',
      farbe: rot > 0 ? '#dc2626' : gelb > 0 ? '#d97706' : '#0f766e',
    },
    {
      label: 'Auf Kurs',
      value: `${aufKurs} %`,
      sub: `${bewertet.length} aktive Maßnahmen`,
      icon: 'trend',
      farbe: '#0f766e',
    },
    {
      label: 'Anschluss-Pipeline',
      value: `${aktiveNA.length} offen`,
      sub: `${(leistungPipeline / 1000).toFixed(1)} MW beantragt`,
      icon: 'plug',
      farbe: '#1e3a5f',
    },
    {
      label: 'SLA-Frist überschritten',
      value: `${ueberfaellig}`,
      sub: `${knapp} laufen knapp`,
      icon: 'clock',
      farbe: ueberfaellig > 0 ? '#dc2626' : '#0f766e',
    },
  ]

  return (
    <>
      <div className="cockpit-intro">
        <div>
          <h2 className="cockpit-h2">Steuerungs-Cockpit</h2>
          <p className="cell-muted">
            Priorisiert nach Risiko – mit erklärbarer Bewertung und nächster
            bester Aktion. Stand {new Intl.DateTimeFormat('de-DE').format(new Date('2026-06-08'))}.
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
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-head">
            <h3>Risiko-Radar · größte Gefährdungen</h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('massnahmen')}
            >
              Alle Maßnahmen
            </button>
          </div>
          <div className="risk-list">
            {bewertet.slice(0, 5).map(({ massnahme: m, bewertung: b }) => (
              <button
                key={m.id}
                className="risk-row"
                onClick={() => onOpen(m.id)}
              >
                <div
                  className="risk-score"
                  style={{ background: ampelFarbe[b.ampel] }}
                >
                  {b.score}
                </div>
                <div className="risk-main">
                  <div className="risk-title">{m.titel}</div>
                  <div className="risk-factors">
                    {b.faktoren
                      .filter((f) => f.wert >= 33)
                      .sort((x, y) => y.wert - x.wert)
                      .map((f) => (
                        <span
                          key={f.dimension}
                          className="risk-chip"
                          style={{
                            color: ampelFarbe[
                              f.wert >= 66 ? 'rot' : 'gelb'
                            ],
                            background: `${ampelFarbe[f.wert >= 66 ? 'rot' : 'gelb']}14`,
                          }}
                          title={f.begruendung}
                        >
                          <Icon name={DIM_ICON[f.dimension]} size={11} />
                          {f.dimension} {f.wert}
                        </span>
                      ))}
                    {b.faktoren.every((f) => f.wert < 33) && (
                      <span className="risk-chip" style={{ color: 'var(--primary)', background: 'var(--primary-soft)' }}>
                        <Icon name="check" size={11} /> auf Kurs
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="ampel-pill"
                  style={{
                    color: ampelFarbe[b.ampel],
                    background: `${ampelFarbe[b.ampel]}18`,
                  }}
                >
                  {ampelLabel[b.ampel]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Nächste beste Aktionen</h3>
          </div>
          <div className="aktion-list">
            {aktionen.length === 0 && (
              <div className="empty">Keine akuten Handlungsbedarfe 🎉</div>
            )}
            {aktionen.map(({ massnahme: m, empfehlung }) => (
              <button
                key={m.id}
                className="aktion-row"
                onClick={() => onOpen(m.id)}
              >
                <span
                  className={`aktion-prio prio-${empfehlung.prioritaet === 'Hoch' ? 'hoch' : 'mittel'}`}
                >
                  {empfehlung.prioritaet}
                </span>
                <div className="aktion-text">
                  <strong>{empfehlung.text}</strong>
                  <span>{m.kennung} · {m.titel}</span>
                </div>
                <Icon name="arrowRight" size={15} style={{ color: 'var(--text-soft)' }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <div className="section-title">Engpässe & Kapazität</div>
          <div className="engpass-block">
            <div className="engpass-head">
              <Icon name="resources" size={15} /> Tiefbau-Auslastung
            </div>
            {engpaesse.length === 0 && (
              <p className="cell-muted" style={{ fontSize: 12.5 }}>
                Keine Firma mit Parallel-Überlast.
              </p>
            )}
            {engpaesse.map(([firma, n]) => (
              <div className="engpass-row" key={firma}>
                <span>{firma}</span>
                <span className="warn-text">{n} Baustellen parallel</span>
              </div>
            ))}
          </div>
          <div className="engpass-block">
            <div className="engpass-head">
              <Icon name="shield" size={15} /> Offene Genehmigungen
            </div>
            {offeneGenehmigungen.length === 0 && (
              <p className="cell-muted" style={{ fontSize: 12.5 }}>
                Keine hängenden Genehmigungen.
              </p>
            )}
            {offeneGenehmigungen.slice(0, 4).map(({ m, g }) => (
              <button
                key={g.id}
                className="engpass-row engpass-link"
                onClick={() => onOpen(m.id)}
              >
                <span>{g.art} – {g.behoerde}</span>
                <span className="cell-muted">{g.status}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card card-pad">
          <div className="section-title">Netzanschluss-Frühindikatoren</div>
          <p className="cell-muted" style={{ fontSize: 12.5, marginBottom: 14 }}>
            Energiewende-Pipeline (PV, Wärmepumpe, E-Mobilität).
          </p>
          <div className="na-mini-grid">
            <div className="na-mini">
              <div className="na-mini-value">{aktiveNA.length}</div>
              <div className="na-mini-label">offene Anträge</div>
            </div>
            <div className="na-mini">
              <div className="na-mini-value" style={{ color: '#dc2626' }}>
                {ueberfaellig}
              </div>
              <div className="na-mini-label">Frist überschritten</div>
            </div>
            <div className="na-mini">
              <div className="na-mini-value">
                {(leistungPipeline / 1000).toFixed(1)} MW
              </div>
              <div className="na-mini-label">beantragte Leistung</div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 16 }}
            onClick={() => onNavigate('anschluesse')}
          >
            <Icon name="plug" size={14} /> Zum Netzanschluss-Cockpit
          </button>
          <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-soft)' }}>
            Gesamt-Auftragsvolumen Bau:{' '}
            {formatEuro(massnahmen.reduce((s, m) => s + m.budget, 0))}
          </div>
        </div>
      </div>
    </>
  )
}
