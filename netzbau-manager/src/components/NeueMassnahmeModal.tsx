import { useState } from 'react'

export function NeueMassnahmeModal({ onClose }: { onClose: () => void }) {
  const [gespeichert, setGespeichert] = useState(false)

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
              Im Prototyp werden die Daten noch nicht persistiert.
            </p>
          </div>
        ) : (
          <>
            <div className="modal-body">
              <div className="field">
                <label>Bezeichnung der Maßnahme</label>
                <input placeholder="z. B. Kabeltrasse Ringschluss Nordstadt" />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Sparte</label>
                  <select defaultValue="Strom">
                    <option>Strom</option>
                    <option>Gas</option>
                    <option>Wasser</option>
                    <option>Fernwärme</option>
                    <option>Breitband</option>
                  </select>
                </div>
                <div className="field">
                  <label>Art</label>
                  <select>
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
                  <label>Gemeinde / Ort</label>
                  <input placeholder="Musterstadt" />
                </div>
                <div className="field">
                  <label>Priorität</label>
                  <select defaultValue="Mittel">
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
                  <input type="date" />
                </div>
                <div className="field">
                  <label>Budget (EUR)</label>
                  <input type="number" placeholder="250000" />
                </div>
              </div>
              <div className="field">
                <label>Bauleitung</label>
                <select>
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
                onClick={() => setGespeichert(true)}
              >
                Maßnahme anlegen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
