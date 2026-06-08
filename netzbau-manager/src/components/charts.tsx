// Schlanke, abhängigkeitsfreie SVG-Diagramme für die Berichtsansicht

export interface Segment {
  label: string
  value: number
  color: string
}

export function Donut({
  segmente,
  size = 168,
  einheit,
}: {
  segmente: Segment[]
  size?: number
  einheit?: string
}) {
  const summe = segmente.reduce((s, x) => s + x.value, 0) || 1
  const radius = size / 2
  const dicke = size * 0.17
  const innerR = radius - dicke
  const umfang = 2 * Math.PI * (radius - dicke / 2)
  let offset = 0

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${radius} ${radius})`}>
          {segmente.map((s, i) => {
            const anteil = s.value / summe
            const laenge = anteil * umfang
            const dash = `${laenge} ${umfang - laenge}`
            const el = (
              <circle
                key={i}
                cx={radius}
                cy={radius}
                r={radius - dicke / 2}
                fill="none"
                stroke={s.color}
                strokeWidth={dicke}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            )
            offset += laenge
            return el
          })}
        </g>
        <text
          x={radius}
          y={radius - 4}
          textAnchor="middle"
          fontSize={size * 0.2}
          fontWeight="800"
          fill="var(--text)"
        >
          {summe}
        </text>
        <text
          x={radius}
          y={radius + size * 0.14}
          textAnchor="middle"
          fontSize={size * 0.085}
          fill="var(--text-muted)"
        >
          {einheit ?? 'gesamt'}
        </text>
        <circle cx={radius} cy={radius} r={innerR} fill="var(--surface)" />
      </svg>
      <div className="donut-legend">
        {segmente.map((s, i) => (
          <div className="legend-row" key={i}>
            <span className="badge-dot" style={{ background: s.color }} />
            <span style={{ flex: 1 }}>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export interface HBarItem {
  label: string
  value: number
  color: string
  // optionaler zweiter Wert (z. B. Ausgaben innerhalb Budget)
  inner?: number
  // formatierte Anzeige rechts
  anzeige?: string
}

export function HBars({
  items,
  max,
}: {
  items: HBarItem[]
  max?: number
}) {
  const maxWert = max ?? Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="hbars">
      {items.map((it, i) => (
        <div className="hbar-row" key={i}>
          <div className="hbar-label" title={it.label}>
            {it.label}
          </div>
          <div className="hbar-track">
            <div
              className="hbar-fill"
              style={{
                width: `${(it.value / maxWert) * 100}%`,
                background: `${it.color}33`,
                border: `1px solid ${it.color}`,
              }}
            >
              {it.inner !== undefined && (
                <div
                  className="hbar-inner"
                  style={{
                    width: `${(it.inner / it.value) * 100}%`,
                    background: it.color,
                  }}
                />
              )}
            </div>
          </div>
          <div className="hbar-value">{it.anzeige ?? it.value}</div>
        </div>
      ))}
    </div>
  )
}
