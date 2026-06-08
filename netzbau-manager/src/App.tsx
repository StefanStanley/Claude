import { useState } from 'react'
import { useStore } from './data/store'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { MassnahmenListe } from './pages/MassnahmenListe'
import { MassnahmeDetail } from './pages/MassnahmeDetail'
import { Karte } from './pages/Karte'
import { Terminplan } from './pages/Terminplan'
import { Ressourcen } from './pages/Ressourcen'
import { Dokumente } from './pages/Dokumente'
import { Berichte } from './pages/Berichte'
import { NeueMassnahmeModal } from './components/NeueMassnahmeModal'

export type View =
  | 'dashboard'
  | 'massnahmen'
  | 'karte'
  | 'kalender'
  | 'ressourcen'
  | 'dokumente'
  | 'berichte'

const titel: Record<View, string> = {
  dashboard: 'Dashboard',
  massnahmen: 'Bau­maßnahmen',
  karte: 'Netzkarte',
  kalender: 'Terminplan',
  ressourcen: 'Ressourcen & Gewerke',
  dokumente: 'Dokumente',
  berichte: 'Berichte & Kennzahlen',
}

export default function App() {
  const { online, verbindet, reconnect } = useStore()
  const [view, setView] = useState<View>('dashboard')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [modalOffen, setModalOffen] = useState(false)

  const navigate = (v: View) => {
    setDetailId(null)
    setView(v)
  }

  const oeffneDetail = (id: string) => setDetailId(id)

  let inhalt: React.ReactNode = null
  if (detailId) {
    inhalt = (
      <MassnahmeDetail id={detailId} onBack={() => setDetailId(null)} />
    )
  } else {
    switch (view) {
      case 'dashboard':
        inhalt = <Dashboard onOpen={oeffneDetail} onNavigate={navigate} />
        break
      case 'massnahmen':
        inhalt = (
          <MassnahmenListe
            onOpen={oeffneDetail}
            onNeu={() => setModalOffen(true)}
          />
        )
        break
      case 'karte':
        inhalt = <Karte onOpen={oeffneDetail} />
        break
      case 'kalender':
        inhalt = <Terminplan onOpen={oeffneDetail} />
        break
      case 'ressourcen':
        inhalt = <Ressourcen onOpen={oeffneDetail} />
        break
      case 'dokumente':
        inhalt = <Dokumente onOpen={oeffneDetail} />
        break
      case 'berichte':
        inhalt = <Berichte />
        break
    }
  }

  return (
    <div className="app">
      <Sidebar active={view} onNavigate={navigate} />
      <div className="main">
        <header className="topbar">
          <h2>{detailId ? 'Maßnahmen-Detail' : titel[view]}</h2>
          <div className="topbar-search">
            <span>🔍</span>
            <input placeholder="Maßnahme, Kennung, Ort suchen…" />
          </div>
          <button
            className="conn"
            onClick={() => {
              if (!online && !verbindet) reconnect()
            }}
            disabled={online}
            title={
              online
                ? 'Backend verbunden – Änderungen werden gespeichert'
                : verbindet
                  ? 'Backend wird gestartet … (Kaltstart kann ~1 Min dauern)'
                  : 'Kein Backend – Demodaten. Klicken für erneuten Verbindungsversuch.'
            }
            style={{
              cursor: online ? 'default' : 'pointer',
              background: online
                ? 'var(--primary-soft)'
                : verbindet
                  ? '#fef3c7'
                  : '#f1f5f9',
              color: online
                ? 'var(--primary-dark)'
                : verbindet
                  ? '#92400e'
                  : 'var(--text-muted)',
            }}
          >
            <span
              className={`conn-dot${verbindet ? ' conn-dot-pulse' : ''}`}
              style={{
                background: online
                  ? 'var(--primary)'
                  : verbindet
                    ? '#d97706'
                    : '#94a3b8',
              }}
            />
            {online
              ? 'Backend'
              : verbindet
                ? 'Backend wird gestartet…'
                : 'Demo · neu verbinden'}
          </button>
          <button className="icon-btn" title="Benachrichtigungen">
            🔔
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setModalOffen(true)}
          >
            + Neue Maßnahme
          </button>
        </header>
        <main className="content">{inhalt}</main>
      </div>
      {modalOffen && (
        <NeueMassnahmeModal onClose={() => setModalOffen(false)} />
      )}
    </div>
  )
}
