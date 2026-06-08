import type { View } from '../App'

const infos: Partial<Record<View, { icon: string; text: string }>> = {
  kalender: {
    icon: '📅',
    text: 'Gantt-Terminplan über alle Maßnahmen mit Gewerken, Abhängigkeiten und Ressourcenauslastung.',
  },
  dokumente: {
    icon: '📁',
    text: 'Zentrale Dokumentenablage: Pläne, Verträge, Aufmaße, Abnahmeprotokolle und Baustellenfotos je Maßnahme.',
  },
  berichte: {
    icon: '📊',
    text: 'Auswertungen zu Budget, Bauzeiten, Genehmigungsdurchlauf und Auslastung der Tiefbaufirmen.',
  },
}

export function Platzhalter({ view }: { view: View }) {
  const info = infos[view]
  return (
    <div
      className="card card-pad"
      style={{ textAlign: 'center', padding: '70px 24px' }}
    >
      <div style={{ fontSize: 46, marginBottom: 14 }}>{info?.icon ?? '🚧'}</div>
      <h3 style={{ fontSize: 18, marginBottom: 8 }}>In Vorbereitung</h3>
      <p
        className="cell-muted"
        style={{ maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}
      >
        {info?.text ?? 'Dieser Bereich wird im nächsten Iterationsschritt umgesetzt.'}
      </p>
    </div>
  )
}
