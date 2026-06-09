import { useEffect, useRef, useState } from 'react'
import { frageAssistent, type AssistentNachricht } from '../data/api'
import { Icon } from './icons'

const VORSCHLAEGE = [
  'Welche Maßnahmen sind aktuell am kritischsten?',
  'Wo hängen Genehmigungen?',
  'Welche Netzanschlüsse sind überfällig?',
  'Wo droht eine Budgetüberschreitung?',
]

export function Assistent({
  offen,
  onClose,
}: {
  offen: boolean
  onClose: () => void
}) {
  const [verlauf, setVerlauf] = useState<AssistentNachricht[]>([])
  const [eingabe, setEingabe] = useState('')
  const [laedt, setLaedt] = useState(false)
  const [quelle, setQuelle] = useState<'ki' | 'regelbasiert' | null>(null)
  const endeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endeRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [verlauf, laedt])

  const senden = async (text: string) => {
    const frage = text.trim()
    if (!frage || laedt) return
    const bisher = [...verlauf, { rolle: 'user', text: frage } as AssistentNachricht]
    setVerlauf(bisher)
    setEingabe('')
    setLaedt(true)
    try {
      const a = await frageAssistent(frage, verlauf)
      setQuelle(a.quelle)
      setVerlauf((v) => [...v, { rolle: 'assistant', text: a.antwort }])
    } catch {
      setVerlauf((v) => [
        ...v,
        {
          rolle: 'assistant',
          text: 'Der Assistent ist nicht erreichbar – läuft das Backend? (Demo-Modus.)',
        },
      ])
    } finally {
      setLaedt(false)
    }
  }

  if (!offen) return null

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="assistent">
        <div className="assistent-head">
          <div className="assistent-title">
            <span className="assistent-logo">
              <Icon name="sparkles" size={16} />
            </span>
            <div>
              <strong>KI-Steuerungsassistent</strong>
              <span>
                {quelle === 'regelbasiert'
                  ? 'Regelbasiert (kein API-Key)'
                  : quelle === 'ki'
                    ? 'Claude · live'
                    : 'Fragen zum Portfolio'}
              </span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="assistent-body">
          {verlauf.length === 0 && (
            <div className="assistent-intro">
              <p>
                Frag mich zum Portfolio – ich werte Risiken, Genehmigungen,
                Budgets und Netzanschlüsse aus und empfehle die nächste Aktion.
              </p>
              <div className="assistent-vorschlaege">
                {VORSCHLAEGE.map((v) => (
                  <button key={v} onClick={() => senden(v)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {verlauf.map((n, i) => (
            <div key={i} className={`chat-bubble chat-${n.rolle}`}>
              {n.text.split('\n').map((zeile, j) => (
                <p key={j}>{zeile || ' '}</p>
              ))}
            </div>
          ))}
          {laedt && (
            <div className="chat-bubble chat-assistant chat-laedt">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          )}
          <div ref={endeRef} />
        </div>

        <form
          className="assistent-foot"
          onSubmit={(e) => {
            e.preventDefault()
            senden(eingabe)
          }}
        >
          <input
            placeholder="Frage zum Portfolio…"
            value={eingabe}
            onChange={(e) => setEingabe(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!eingabe.trim() || laedt}
          >
            <Icon name="send" size={16} />
          </button>
        </form>
      </aside>
    </>
  )
}
