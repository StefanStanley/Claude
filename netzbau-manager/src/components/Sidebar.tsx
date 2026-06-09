import type { View } from '../App'
import { Icon } from './icons'

interface NavEntry {
  view: View
  label: string
  icon: string
  badge?: number
}

const haupt: NavEntry[] = [
  { view: 'cockpit', label: 'Cockpit', icon: 'cockpit' },
  { view: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { view: 'massnahmen', label: 'Maßnahmen', icon: 'projects', badge: 6 },
  { view: 'anschluesse', label: 'Netzanschlüsse', icon: 'plug' },
  { view: 'karte', label: 'Netzkarte', icon: 'map' },
]

const weiter: NavEntry[] = [
  { view: 'kalender', label: 'Terminplan', icon: 'calendar' },
  { view: 'ressourcen', label: 'Ressourcen', icon: 'resources' },
  { view: 'dokumente', label: 'Dokumente', icon: 'documents' },
  { view: 'berichte', label: 'Berichte', icon: 'reports' },
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
      <span className="nav-icon">
        <Icon name={e.icon} size={18} />
      </span>
      {e.label}
      {e.badge !== undefined && <span className="nav-badge">{e.badge}</span>}
    </button>
  )

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Icon name="zap" size={20} strokeWidth={2.2} />
        </div>
        <div>
          <h1>NetzBau Manager</h1>
          <span>Rheinnetz Düsseldorf</span>
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
