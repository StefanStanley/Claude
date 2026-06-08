import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { massnahmen, STATUS_REIHENFOLGE } from '../data/massnahmen'
import { statusFarbe, sparteIcon, formatEuro } from '../data/helpers'

// Open-Source-Karte: Leaflet + OpenStreetMap-Kacheln, zentriert auf Düsseldorf.
const DUESSELDORF: L.LatLngExpression = [51.2277, 6.7735]

export function Karte({ onOpen }: { onOpen: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onOpenRef = useRef(onOpen)
  onOpenRef.current = onOpen

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const map = L.map(el, { scrollWheelZoom: true }).setView(DUESSELDORF, 12)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende',
      maxZoom: 19,
    }).addTo(map)

    const marker: L.Marker[] = []
    massnahmen.forEach((m) => {
      const farbe = statusFarbe(m.status)
      const icon = L.divIcon({
        className: 'leaflet-pin-wrap',
        html: `<div class="leaflet-pin" style="background:${farbe}"><span>${sparteIcon(
          m.sparte,
        )}</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
      })
      const mk = L.marker([m.geo.lat, m.geo.lng], { icon }).addTo(map)
      mk.bindTooltip(m.titel, { direction: 'top', offset: [0, -28] })
      mk.bindPopup(
        `<div class="map-popup">
           <div class="map-popup-kennung">${sparteIcon(m.sparte)} ${m.kennung} · ${m.gemeinde}</div>
           <strong>${m.titel}</strong>
           <div class="map-popup-status"><span style="background:${farbe}"></span>${m.status} · ${m.fortschritt}%</div>
           <div class="map-popup-meta">${m.art} · ${formatEuro(m.budget)}</div>
           <button class="map-popup-btn" data-id="${m.id}">Details öffnen →</button>
         </div>`,
      )
      marker.push(mk)
    })

    map.on('popupopen', (e) => {
      const btn = (e.popup.getElement() as HTMLElement | null)?.querySelector(
        '.map-popup-btn',
      ) as HTMLButtonElement | null
      if (btn) btn.onclick = () => onOpenRef.current(btn.dataset.id!)
    })

    if (marker.length) {
      map.fitBounds(L.featureGroup(marker).getBounds().pad(0.18))
    }

    return () => {
      map.remove()
    }
  }, [])

  return (
    <>
      <p className="cell-muted" style={{ marginBottom: 16 }}>
        Geografische Übersicht aller Baumaßnahmen im Versorgungsgebiet
        Düsseldorf — Open-Source-Karte (Leaflet / OpenStreetMap). Pin anklicken
        für Details.
      </p>
      <div className="leaflet-shell">
        <div ref={containerRef} className="leaflet-map" />
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
