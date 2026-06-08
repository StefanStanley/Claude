import { useState } from 'react'
import { useStore } from '../data/store'
import type { Sparte, MassnahmeArt, Prioritaet } from '../data/types'

export function NeueMassnahmeModal({
  onClose,
  onAngelegt,
}: {
  onClose: () => void
  onAngelegt?: (id: string) => void
}) {
  const { addMassnahme, online } = useStore()
  const [gespeichert, setGespeichert] = useState(false)
  const [speichert, setSpeichert] = useState(false)

  const [titel, setTitel] = useState('')
  const [sparte, setSparte] = useState<Sparte>('Strom')
  const [art, setArt] = useState<MassnahmeArt>('Kabeltrasse')
  const [gemeinde, setGemeinde] = useState('')
  const [prioritaet, setPrioritaet] = useState<Prioritaet>('Mittel')
  const [start, setStart] = useState('')
  const [budget, setBudget] = useState('')
  const [bauleiter, setBauleiter] = useState('Andrea Kohl')

  const gueltig = titel.trim() !== '' && gemeinde.trim() !== '' && budget !== ''

  const speichern = async () => {
    if (!gueltig) return
    setSpeichert(true)
    try {
      const neu = await addMassnahme({
        titel: titel.trim(),
        sparte,
        art,
        gemeinde: gemeinde.trim(),
        prioritaet,
        start: start || new Date().toISOString().slice(0, 10),
        budget: Number(budget),
        bauleiter,
      })
      setGespeichert(true)
      onAngelegt?.(neu.id)
    } finally {
      setSpeichert(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Neue Baumaßnahme anlegen</h3>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {gespeichert ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <h3 style={{ marginBottom: 6 }}>Maßnahme angelegt</h3>
            <p className="cell-muted">
              {online
                ? 'Die Maßnahme wurde im Backend gespeichert und erscheint in der Übersicht.'
                : 'Backend nicht erreichbar – die Maßnahme wurde nur lokal in dieser Sitzung angelegt.'}
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 18 }}
              onClick={onClose}
            >
              Schließen
            </button>
          </div>
        ) : (
          <>
            <div className="modal-body">
              {!online && (
                <div className="hinweis-offline">
                  ⚠️ Backend nicht erreichbar – Anlage erfolgt nur lokal
                  (nicht persistent). Server mit <code>npm run dev</code> im
                  Ordner <code>server/</code> starten.
                </div>
              )}
              <div className="field">
                <label>Bezeichnung der Maßnahme *</label>
                <input
                  placeholder="z. B. Kabeltrasse Ringschluss Düsseltal"
                  value={titel}
                  onChange={(e) => setTitel(e.target.value)}
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Sparte</label>
                  <select
                    value={sparte}
                    onChange={(e) => setSparte(e.target.value as Sparte)}
                  >
                    <option>Strom</option>
                    <option>Gas</option>
                    <option>Wasser</option>
                    <option>Fernwärme</option>
                    <option>Breitband</option>
                  </select>
                </div>
                <div className="field">
                  <label>Art</label>
                  <select
                    value={art}
                    onChange={(e) => setArt(e.target.value as MassnahmeArt)}
                  >
                    <option>Kabeltrasse</option>
                    <option>Ortsnetzstation</option>
                    <option>Hausanschluss</option>
                    <option>Umspannwerk</option>
                    <option>Netzverstärkung</option>
                    <option>Smart-Meter-Rollout</option>
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Gemeinde / Stadtteil *</label>
                  <input
                    placeholder="Düsseldorf-Bilk"
                    value={gemeinde}
                    onChange={(e) => setGemeinde(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Priorität</label>
                  <select
                    value={prioritaet}
                    onChange={(e) => setPrioritaet(e.target.value as Prioritaet)}
                  >
                    <option>Niedrig</option>
                    <option>Mittel</option>
                    <option>Hoch</option>
                    <option>Kritisch</option>
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Geplanter Baubeginn</label>
                  <input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Budget (EUR) *</label>
                  <input
                    type="number"
                    placeholder="250000"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label>Bauleitung</label>
                <select
                  value={bauleiter}
                  onChange={(e) => setBauleiter(e.target.value)}
                >
                  <option>Andrea Kohl</option>
                  <option>Henning Vogt</option>
                  <option>Dr. Ines Brandt</option>
                  <option>Sandra Eichel</option>
                </select>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={onClose}>
                Abbrechen
              </button>
              <button
                className="btn btn-primary"
                onClick={speichern}
                disabled={!gueltig || speichert}
                style={{ opacity: !gueltig || speichert ? 0.6 : 1 }}
              >
                {speichert ? 'Speichert…' : 'Maßnahme anlegen'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
