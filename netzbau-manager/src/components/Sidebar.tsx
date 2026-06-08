import type { View } from '../App'

interface NavEntry {
  view: View
  label: string
  icon: string
  badge?: number
}

const haupt: NavEntry[] = [
  { view: 'dashboard', label: 'Dashboard', icon: '▦' },
  { view: 'massnahmen', label: 'Maßnahmen', icon: '🏗️', badge: 6 },
  { view: 'karte', label: 'Netzkarte', icon: '🗺️' },
]

const weiter: NavEntry[] = [
  { view: 'kalender', label: 'Terminplan', icon: '📅' },
  { view: 'ressourcen', label: 'Ressourcen', icon: '👷' },
  { view: 'dokumente', label: 'Dokumente', icon: '📁' },
  { view: 'berichte', label: 'Berichte', icon: '📊' },
]

export function Sidebar({
  active,
  onNavigate,
}: {
  active: View
  onNavigate: (v: View) => void
}) {
  const renderItem = (e: NavEntry) => (
    <button
      key={e.view}
      className={`nav-item ${active === e.view ? 'active' : ''}`}
      onClick={() => onNavigate(e.view)}
    >
      <span className="nav-icon">{e.icon}</span>
      {e.label}
      {e.badge !== undefined && <span className="nav-badge">{e.badge}</span>}
    </button>
  )

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">⚡</div>
        <div>
          <h1>NetzBau Manager</h1>
          <span>Stadtwerke Musterstadt</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {haupt.map(renderItem)}
        <div className="nav-label">Planung &amp; Doku</div>
        {weiter.map(renderItem)}
      </nav>
      <div className="sidebar-user">
        <div className="avatar">AK</div>
        <div className="sidebar-user-info">
          <strong>Andrea Kohl</strong>
          <span>Bauleitung Netze</span>
        </div>
      </div>
    </aside>
  )
}
