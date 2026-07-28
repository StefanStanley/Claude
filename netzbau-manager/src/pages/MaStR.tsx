import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useStore } from '../data/store'
import { Icon } from '../components/icons'
import { Donut } from '../components/charts'
import {
  mastrZusammenfassung,
  energietraegerFarbe,
  formatLeistung,
  type MaStrEinheit,
} from '../data/mastr'
import { formatDatum } from '../data/helpers'

const DUESSELDORF: L.LatLngExpression = [51.2277, 6.7735]

export function MaStR() {
  const { mastrEinheiten, mastrDemo } = useStore()
  const [filter, setFilter] = useState<string>('Alle')
  const [suche, setSuche] = useState('')

  const summe = useMemo(
    () => mastrZusammenfassung(mastrEinheiten),
    [mastrEinheiten],
  )

  // Energieträger-Chips (nach Häufigkeit)
  const energietraeger = useMemo(
    () => ['Alle', ...summe.jeEnergietraeger.map((s) => s.label)],
    [summe],
  )

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()
    return mastrEinheiten.filter((e) => {
      if (filter !== 'Alle' && e.energietraeger !== filter) return false
      if (
        q &&
        ![e.name, e.betreiber, e.ort, e.mastrNr, e.plz]
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
        return false
      return true
    })
  }, [mastrEinheiten, filter, suche])

  const kpis = [
    {
      label: 'Anlagen gesamt',
      value: summe.anzahl.toLocaleString('de-DE'),
      sub: 'im Gebiet Düsseldorf',
      icon: 'database',
      farbe: '#1e3a5f',
    },
    {
      label: 'Erzeugungseinheiten',
      value: summe.anzahlErzeugung.toLocaleString('de-DE'),
      sub: 'PV, Wind, Speicher, KWK …',
      icon: 'solar',
      farbe: '#f59e0b',
    },
    {
      label: 'Installierte Leistung',
      value: formatLeistung(summe.leistungErzeugungKw),
      sub: 'Bruttoleistung Erzeugung',
      icon: 'zap',
      farbe: '#0e7c5a',
    },
    {
      label: 'Verbrauchseinheiten',
      value: summe.anzahlVerbrauch.toLocaleString('de-DE'),
      sub: 'Strom- & Gasverbrauch',
      icon: 'plug',
      farbe: '#7c3aed',
    },
  ]

  return (
    <>
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <span
          className="kpi-icon"
          style={{ background: '#1e3a5f1a', color: '#1e3a5f', flexShrink: 0 }}
        >
          <Icon name="download" size={18} />
        </span>
        <div style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>
          Anlagen aus dem{' '}
          <strong>Marktstammdatenregister (MaStR)</strong> der Bundesnetzagentur,
          gefiltert auf den Standort <strong>Düsseldorf</strong>. Aktualisieren
          im Backend mit{' '}
          <code
            style={{
              background: 'var(--primary-soft)',
              padding: '1px 6px',
              borderRadius: 5,
            }}
          >
            npm run download:mastr
          </code>
          .
        </div>
        <span
          className="badge"
          style={
            mastrDemo
              ? { background: '#d977061a', color: '#d97706' }
              : { background: '#0e7c5a1a', color: '#0e7c5a' }
          }
        >
          <span
            className="badge-dot"
            style={{ background: mastrDemo ? '#d97706' : '#0e7c5a' }}
          />
          {mastrDemo ? 'Demo-Daten' : 'Live aus MaStR'}
        </span>
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
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head">
            <h3>Anlagen nach Energieträger</h3>
          </div>
          <div className="card-pad">
            <Donut segmente={summe.jeEnergietraeger} einheit="Anlagen" />
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Standorte</h3>
          </div>
          <MaStrKarte einheiten={gefiltert} />
        </div>
      </div>

      <div className="toolbar" style={{ marginTop: 16 }}>
        {energietraeger.map((e) => (
          <button
            key={e}
            className={`filter-chip ${filter === e ? 'active' : ''}`}
            onClick={() => setFilter(e)}
          >
            {e}
          </button>
        ))}
        <div className="topbar-search" style={{ marginLeft: 'auto' }}>
          <Icon name="search" size={15} style={{ color: 'var(--text-soft)' }} />
          <input
            placeholder="Name, Betreiber, Ort, MaStR-Nr. …"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
          />
        </div>
      </div>

      <table className="proj-table">
        <thead>
          <tr>
            <th>Anlage</th>
            <th>Energieträger</th>
            <th>Art</th>
            <th>Leistung (brutto)</th>
            <th>Inbetriebnahme</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {gefiltert.map((e) => (
            <tr key={e.mastrNr}>
              <td>
                <div className="proj-kennung">{e.mastrNr}</div>
                <div className="proj-title">{e.name}</div>
                <div className="proj-kennung">
                  {e.betreiber} · {e.plz} {e.ort}
                </div>
              </td>
              <td>
                <span
                  className="badge"
                  style={{
                    background: `${energietraegerFarbe(e.energietraeger)}1a`,
                    color: energietraegerFarbe(e.energietraeger),
                  }}
                >
                  <span
                    className="badge-dot"
                    style={{ background: energietraegerFarbe(e.energietraeger) }}
                  />
                  {e.energietraeger}
                </span>
              </td>
              <td className="cell-muted">
                {e.sparte} · {e.richtung}
              </td>
              <td className="cell-muted">{formatLeistung(e.bruttoleistungKw)}</td>
              <td className="cell-muted">
                {e.inbetriebnahme ? formatDatum(e.inbetriebnahme) : '—'}
              </td>
              <td className="cell-muted">{e.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {gefiltert.length === 0 && (
        <div className="empty" style={{ padding: 24, textAlign: 'center' }}>
          Keine Anlagen für diese Filter.
        </div>
      )}
    </>
  )
}

// Leaflet-Karte mit Markern je MaStR-Anlage (nur Einheiten mit Koordinaten)
function MaStrKarte({ einheiten }: { einheiten: MaStrEinheit[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)

  // Karte einmalig aufbauen
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const map = L.map(el, { scrollWheelZoom: false }).setView(DUESSELDORF, 11)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap, &copy; CARTO',
      maxZoom: 19,
    }).addTo(map)
    const layer = L.layerGroup().addTo(map)
    mapRef.current = map
    layerRef.current = layer
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  // Marker bei Datenänderung neu setzen
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    const mitGeo = einheiten.filter(
      (e) => typeof e.lat === 'number' && typeof e.lng === 'number',
    )
    mitGeo.forEach((e) => {
      const farbe = energietraegerFarbe(e.energietraeger)
      const marker = L.circleMarker([e.lat as number, e.lng as number], {
        radius: 7,
        color: '#fff',
        weight: 1.5,
        fillColor: farbe,
        fillOpacity: 0.9,
      })
      marker.bindTooltip(e.name, { direction: 'top' })
      marker.bindPopup(
        `<div class="map-popup">
           <div class="map-popup-kennung">${e.mastrNr}</div>
           <strong>${e.name}</strong>
           <div class="map-popup-meta">${e.energietraeger} · ${formatLeistung(
             e.bruttoleistungKw,
           )}</div>
           <div class="map-popup-meta">${e.betreiber}</div>
         </div>`,
      )
      layer.addLayer(marker)
    })
    if (mitGeo.length > 0) {
      map.fitBounds(
        L.featureGroup(
          mitGeo.map((e) =>
            L.marker([e.lat as number, e.lng as number]),
          ),
        )
          .getBounds()
          .pad(0.25),
      )
    }
  }, [einheiten])

  return (
    <div
      ref={containerRef}
      className="leaflet-map"
      style={{ height: 280, borderRadius: '0 0 var(--radius) var(--radius)' }}
    />
  )
}
