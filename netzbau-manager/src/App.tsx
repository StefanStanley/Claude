import { useState } from 'react'
import { useStore } from './data/store'
import { Sidebar } from './components/Sidebar'
import { Icon } from './components/icons'
import { Cockpit } from './pages/Cockpit'
import { Dashboard } from './pages/Dashboard'
import { MassnahmenListe } from './pages/MassnahmenListe'
import { MassnahmeDetail } from './pages/MassnahmeDetail'
import { Karte } from './pages/Karte'
import { MaStR } from './pages/MaStR'
import { Terminplan } from './pages/Terminplan'
import { Ressourcen } from './pages/Ressourcen'
import { Anschluesse } from './pages/Anschluesse'
import { Dokumente } from './pages/Dokumente'
import { Berichte } from './pages/Berichte'
import { NeueMassnahmeModal } from './components/NeueMassnahmeModal'
import { Assistent } from './components/Assistent'

export type View =
  | 'cockpit'
  | 'dashboard'
  | 'massnahmen'
  | 'karte'
  | 'mastr'
  | 'kalender'
  | 'ressourcen'
  | 'anschluesse'
  | 'dokumente'
  | 'berichte'

const titel: Record<View, string> = {
  cockpit: 'Steuerungs-Cockpit',
  dashboard: 'Dashboard',
  massnahmen: 'Bau­maßnahmen',
  karte: 'Netzkarte',
  mastr: 'MaStR-Anlagen Düsseldorf',
  kalender: 'Terminplan',
  ressourcen: 'Ressourcen & Gewerke',
  anschluesse: 'Netzanschlüsse',
  dokumente: 'Dokumente',
  berichte: 'Berichte & Kennzahlen',
}

export default function App() {
  const { online, verbindet, reconnect } = useStore()
  const [view, setView] = useState<View>('cockpit')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [modalOffen, setModalOffen] = useState(false)
  const [sidebarOffen, setSidebarOffen] = useState(true)
  const [assistentOffen, setAssistentOffen] = useState(false)

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
      case 'cockpit':
        inhalt = <Cockpit onOpen={oeffneDetail} onNavigate={navigate} />
        break
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
      case 'mastr':
        inhalt = <MaStR />
        break
      case 'kalender':
        inhalt = <Terminplan onOpen={oeffneDetail} />
        break
      case 'ressourcen':
        inhalt = <Ressourcen onOpen={oeffneDetail} />
        break
      case 'anschluesse':
        inhalt = <Anschluesse onOpen={oeffneDetail} onNavigate={navigate} />
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
    <div className={`app${sidebarOffen ? '' : ' sidebar-zu'}`}>
      <Sidebar active={view} onNavigate={navigate} />
      <div className="main">
        <header className="topbar">
          <button
            className="icon-btn topbar-menu"
            onClick={() => setSidebarOffen((o) => !o)}
            title={sidebarOffen ? 'Seitenleiste ausblenden' : 'Seitenleiste einblenden'}
          >
            <Icon name="menu" size={18} />
          </button>
          <h2>{detailId ? 'Maßnahmen-Detail' : titel[view]}</h2>
          <div className="topbar-search">
            <Icon name="search" size={15} style={{ color: 'var(--text-soft)' }} />
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
          <button
            className="btn btn-assistent btn-sm"
            onClick={() => setAssistentOffen(true)}
            title="KI-Steuerungsassistent"
          >
            <Icon name="sparkles" size={15} />
            Assistent
          </button>
          <button className="icon-btn" title="Benachrichtigungen">
            <Icon name="bell" size={17} />
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setModalOffen(true)}
          >
            <Icon name="plus" size={16} strokeWidth={2.2} />
            Neue Maßnahme
          </button>
        </header>
        <main className="content">{inhalt}</main>
      </div>
      {modalOffen && (
        <NeueMassnahmeModal onClose={() => setModalOffen(false)} />
      )}
      <Assistent
        offen={assistentOffen}
        onClose={() => setAssistentOffen(false)}
      />
    </div>
  )
}
