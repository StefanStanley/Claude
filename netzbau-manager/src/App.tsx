import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { MassnahmenListe } from './pages/MassnahmenListe'
import { MassnahmeDetail } from './pages/MassnahmeDetail'
import { Karte } from './pages/Karte'
import { Terminplan } from './pages/Terminplan'
import { Platzhalter } from './pages/Platzhalter'
import { NeueMassnahmeModal } from './components/NeueMassnahmeModal'

export type View =
  | 'dashboard'
  | 'massnahmen'
  | 'karte'
  | 'kalender'
  | 'dokumente'
  | 'berichte'

const titel: Record<View, string> = {
  dashboard: 'Dashboard',
  massnahmen: 'Bau­maßnahmen',
  karte: 'Netzkarte',
  kalender: 'Terminplan',
  dokumente: 'Dokumente',
  berichte: 'Berichte & Kennzahlen',
}

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [modalOffen, setModalOffen] = useState(false)

  const navigate = (v: View) => {
    setDetailId(null)
    setView(v)
  }

  const oeffneDetail = (id: string) => setDetailId(id)

  let inhalt: React.ReactNode
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
      default:
        inhalt = <Platzhalter view={view} />
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
