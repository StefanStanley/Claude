import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { STATUS_REIHENFOLGE } from '../data/massnahmen'
import { useStore } from '../data/store'
import { statusFarbe, spannungsFarbe, formatEuro } from '../data/helpers'
import { sparteIconSvg } from '../components/icons'
import type { Massnahme } from '../data/types'

// Open-Source-Karte: Leaflet + OpenStreetMap, zentriert auf Düsseldorf,
// inkl. Trassen-Linien, amtlichen NRW-Geobasis-Layern (WMS), Layer-Umschalter
// und einem Status-Filter, der synchron Pins und Trassen ein-/ausblendet.
const DUESSELDORF: L.LatLngExpression = [51.2277, 6.7735]

const FILTER = ['Alle', 'Bau', 'Planung', 'Genehmigung', 'Kritisch'] as const
type Filter = (typeof FILTER)[number]

function passt(m: Massnahme, f: Filter): boolean {
  if (f === 'Alle') return true
  if (f === 'Kritisch') return m.prioritaet === 'Kritisch'
  return m.status === f
}

function imBau(m: Massnahme): boolean {
  return ['Bau', 'Abnahme', 'Abgeschlossen'].includes(m.status)
}

interface KartenItem {
  m: Massnahme
  marker: L.Marker
  linie?: L.Polyline
}

export function Karte({ onOpen }: { onOpen: (id: string) => void }) {
  const { massnahmen } = useStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const onOpenRef = useRef(onOpen)
  onOpenRef.current = onOpen

  const [filter, setFilter] = useState<Filter>('Alle')
  const filterRef = useRef(filter)
  filterRef.current = filter
  const datenRef = useRef<{
    items: KartenItem[]
    baustellen: L.LayerGroup
    trassen: L.LayerGroup
  } | null>(null)

  // Karte aufbauen (neu, sobald die Maßnahmen-Daten geladen/geändert sind)
  useEffect(() => {
    const el = containerRef.current
    if (!el || massnahmen.length === 0) return

    const map = L.map(el, { scrollWheelZoom: true }).setView(DUESSELDORF, 12)

    const osm = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      },
    ).addTo(map)

    const positron = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '&copy; OpenStreetMap, &copy; CARTO', maxZoom: 19 },
    )

    // Amtliche Geobasisdaten NRW (offene WMS-Dienste, Geobasis NRW)
    const dopNRW = L.tileLayer.wms('https://www.wms.nrw.de/geobasis/wms_nw_dop', {
      layers: 'nw_dop_rgb',
      format: 'image/png',
      transparent: true,
      attribution: '&copy; Geobasis NRW (DOP)',
    })
    const alkisNRW = L.tileLayer.wms(
      'https://www.wms.nrw.de/geobasis/wms_nw_alkis',
      {
        layers: 'adv_alkis_flurstuecke',
        format: 'image/png',
        transparent: true,
        attribution: '&copy; Geobasis NRW (ALKIS)',
      },
    )

    const baustellen = L.layerGroup().addTo(map)
    const trassen = L.layerGroup().addTo(map)

    const items: KartenItem[] = massnahmen.map((m) => {
      const farbe = statusFarbe(m.status)
      const icon = L.divIcon({
        className: 'leaflet-pin-wrap',
        html: `<div class="leaflet-pin" style="background:${farbe}">${sparteIconSvg(
          m.sparte,
          '#fff',
        )}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
      })
      const marker = L.marker([m.geo.lat, m.geo.lng], { icon })
      marker.bindTooltip(m.titel, { direction: 'top', offset: [0, -28] })
      marker.bindPopup(
        `<div class="map-popup">
           <div class="map-popup-kennung" style="display:inline-flex;align-items:center;gap:5px">${sparteIconSvg(m.sparte)} ${m.kennung} · ${m.gemeinde}</div>
           <strong>${m.titel}</strong>
           <div class="map-popup-status"><span style="background:${farbe}"></span>${m.status} · ${m.fortschritt}%</div>
           <div class="map-popup-meta">${m.art} · ${m.spannungsebene} · ${formatEuro(m.budget)}</div>
           <button class="map-popup-btn" data-id="${m.id}">Details öffnen →</button>
         </div>`,
      )

      let linie: L.Polyline | undefined
      if (m.trasse && m.trasse.length > 1) {
        linie = L.polyline(
          m.trasse.map((p) => [p.lat, p.lng] as L.LatLngTuple),
          {
            color: spannungsFarbe(m.spannungsebene),
            weight: 5,
            opacity: 0.85,
            // geplante (noch nicht im Bau befindliche) Trassen gestrichelt
            dashArray: imBau(m) ? undefined : '9 7',
          },
        )
        linie.bindTooltip(
          `${m.titel} · ${m.spannungsebene} · ${m.trasseLaengeM} m`,
        )
        linie.on('click', () => onOpenRef.current(m.id))
      }
      return { m, marker, linie }
    })

    datenRef.current = { items, baustellen, trassen }

    // Detail-Sprung aus dem Popup-Button
    map.on('popupopen', (e) => {
      const btn = (e.popup.getElement() as HTMLElement | null)?.querySelector(
        '.map-popup-btn',
      ) as HTMLButtonElement | null
      if (btn) btn.onclick = () => onOpenRef.current(btn.dataset.id!)
    })

    // Layer-Umschalter
    L.control
      .layers(
        { OpenStreetMap: osm, 'Positron (hell)': positron },
        {
          Baustellen: baustellen,
          'Geplante Trassen': trassen,
          'Luftbild NRW (DOP)': dopNRW,
          'Liegenschaften ALKIS (NRW)': alkisNRW,
        },
        { collapsed: false },
      )
      .addTo(map)

    map.fitBounds(
      L.featureGroup(items.map((i) => i.marker)).getBounds().pad(0.18),
    )

    // Befüllung gemäß aktuell gewähltem Filter
    fuelle(datenRef.current, filterRef.current)

    // Karte neu vermessen, wenn sich die Containergröße ändert
    // (z. B. beim Ein-/Ausblenden der Seitenleiste) – verhindert graue Kacheln
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)

    return () => {
      ro.disconnect()
      map.remove()
      datenRef.current = null
    }
  }, [massnahmen])

  // Filter anwenden: Pins + Trassen synchron ein-/ausblenden
  useEffect(() => {
    if (datenRef.current) fuelle(datenRef.current, filter)
  }, [filter])

  return (
    <>
      <div className="toolbar">
        {FILTER.map((f) => (
          <button
            key={f}
            className={`filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <span className="cell-muted" style={{ marginLeft: 'auto', fontSize: 12 }}>
          Open-Source-Karte · OpenStreetMap &amp; Geobasis NRW
        </span>
      </div>

      <div className="leaflet-shell">
        <div ref={containerRef} className="leaflet-map" />
        <div className="map-legend">
          <h4>Status (Pins)</h4>
          {STATUS_REIHENFOLGE.map((s) => (
            <div className="legend-row" key={s}>
              <span className="badge-dot" style={{ background: statusFarbe(s) }} />
              {s}
            </div>
          ))}
          <h4 style={{ marginTop: 10 }}>Trassen (Spannung)</h4>
          {['Niederspannung', 'Mittelspannung', 'Hochspannung'].map((e) => (
            <div className="legend-row" key={e}>
              <span
                style={{
                  width: 16,
                  height: 3,
                  borderRadius: 2,
                  background: spannungsFarbe(e),
                }}
              />
              {e}
            </div>
          ))}
          <div className="legend-row" style={{ marginTop: 4 }}>
            <span className="legend-dash" /> geplant
          </div>
        </div>
      </div>
    </>
  )
}

// Layer-Gruppen gemäß Filter neu befüllen
function fuelle(
  daten: { items: KartenItem[]; baustellen: L.LayerGroup; trassen: L.LayerGroup },
  filter: Filter,
) {
  daten.baustellen.clearLayers()
  daten.trassen.clearLayers()
  daten.items.forEach(({ m, marker, linie }) => {
    if (!passt(m, filter)) return
    daten.baustellen.addLayer(marker)
    if (linie) daten.trassen.addLayer(linie)
  })
}
