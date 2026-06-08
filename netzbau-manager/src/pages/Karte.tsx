import { massnahmen } from '../data/massnahmen'
import { statusFarbe, sparteIcon, formatEuro } from '../data/helpers'
import { STATUS_REIHENFOLGE } from '../data/massnahmen'
import { StatusBadge } from '../components/ui'

export function Karte({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <>
      <p className="cell-muted" style={{ marginBottom: 16 }}>
        Geografische Übersicht aller Baumaßnahmen im Versorgungsgebiet.
        Schematische Darstellung — in der Vollversion via GIS / WebMap-Dienst.
      </p>
      <div className="map-wrap">
        <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* schematische Flüsse / Straßen */}
          <path
            d="M0,30 C20,35 35,20 50,28 C65,36 80,22 100,30"
            stroke="#bcd4cb"
            strokeWidth="0.8"
            fill="none"
          />
          <path
            d="M15,0 C18,30 12,55 22,80 L24,100"
            stroke="#cdd9e0"
            strokeWidth="1.4"
            fill="none"
          />
          <path
            d="M0,62 L40,60 L60,72 L100,68"
            stroke="#cdd9e0"
            strokeWidth="1.4"
            fill="none"
          />
          <path
            d="M55,0 L52,40 L58,70 L56,100"
            stroke="#cdd9e0"
            strokeWidth="1"
            fill="none"
          />
          {/* Siedlungsflächen */}
          <rect x="35" y="32" width="14" height="12" rx="1" fill="#d6e3db" opacity="0.7" />
          <rect x="68" y="38" width="12" height="11" rx="1" fill="#d6e3db" opacity="0.7" />
          <rect x="20" y="54" width="10" height="10" rx="1" fill="#d6e3db" opacity="0.7" />
          <rect x="52" y="66" width="14" height="12" rx="1" fill="#d6e3db" opacity="0.7" />
        </svg>

        {massnahmen.map((m) => (
          <div
            key={m.id}
            className="map-pin"
            style={{ left: `${m.koordinaten.x}%`, top: `${m.koordinaten.y}%` }}
            onClick={() => onOpen(m.id)}
          >
            <div
              className="map-pin-dot"
              style={{ background: statusFarbe(m.status) }}
            >
              <span>{sparteIcon(m.sparte)}</span>
            </div>
            <div className="map-pin-tooltip">
              <strong>{m.titel}</strong>
              <div style={{ marginBottom: 6 }}>
                <StatusBadge status={m.status} />
              </div>
              <div className="proj-kennung">
                {m.kennung} · {m.gemeinde}
              </div>
              <div className="cell-muted" style={{ fontSize: 11.5, marginTop: 4 }}>
                {formatEuro(m.budget)} · {m.fortschritt}% fertig
              </div>
            </div>
          </div>
        ))}

        <div className="map-legend">
          <h4>Status</h4>
          {STATUS_REIHENFOLGE.map((s) => (
            <div className="legend-row" key={s}>
              <span className="badge-dot" style={{ background: statusFarbe(s) }} />
              {s}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
