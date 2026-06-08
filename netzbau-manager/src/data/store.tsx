import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { massnahmen as seed } from './massnahmen'
import type { Massnahme, Prioritaet, Sparte, MassnahmeArt } from './types'

const API: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:4000'

export interface NeuMassnahmeInput {
  titel: string
  sparte: Sparte
  art: MassnahmeArt
  gemeinde: string
  prioritaet: Prioritaet
  start: string
  budget: number
  bauleiter: string
}

interface Store {
  massnahmen: Massnahme[]
  online: boolean // true = API erreichbar, Änderungen werden persistiert
  ladend: boolean
  toggleAufgabe: (mId: string, aId: string) => void
  addMassnahme: (input: NeuMassnahmeInput) => Promise<Massnahme>
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [massnahmen, setMassnahmen] = useState<Massnahme[]>(seed)
  const [online, setOnline] = useState(false)
  const [ladend, setLadend] = useState(true)

  // Beim Start: Daten von der API laden, sonst Seed-Fallback
  useEffect(() => {
    let abbruch = false
    ;(async () => {
      try {
        const r = await fetch(`${API}/api/massnahmen`)
        if (!r.ok) throw new Error(String(r.status))
        const daten = (await r.json()) as Massnahme[]
        if (!abbruch) {
          setMassnahmen(daten)
          setOnline(true)
        }
      } catch {
        // Kein Backend erreichbar → Prototyp läuft mit Seed-Daten weiter
        if (!abbruch) setOnline(false)
      } finally {
        if (!abbruch) setLadend(false)
      }
    })()
    return () => {
      abbruch = true
    }
  }, [])

  const toggleAufgabe = (mId: string, aId: string) => {
    // Optimistische lokale Aktualisierung
    setMassnahmen((prev) =>
      prev.map((m) => {
        if (m.id !== mId) return m
        const aufgaben = m.aufgaben.map((a) =>
          a.id === aId ? { ...a, erledigt: !a.erledigt } : a,
        )
        const erledigt = aufgaben.filter((a) => a.erledigt).length
        const fortschritt =
          aufgaben.length > 0
            ? Math.round((erledigt / aufgaben.length) * 100)
            : m.fortschritt
        return { ...m, aufgaben, fortschritt }
      }),
    )
    if (online) {
      fetch(`${API}/api/massnahmen/${mId}/aufgaben/${aId}`, {
        method: 'PATCH',
      }).catch(() => {})
    }
  }

  const addMassnahme = async (input: NeuMassnahmeInput): Promise<Massnahme> => {
    if (online) {
      const r = await fetch(`${API}/api/massnahmen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const neu = (await r.json()) as Massnahme
      setMassnahmen((prev) => [neu, ...prev])
      return neu
    }
    // Offline-Fallback: nur lokal anlegen
    const neu = lokaleMassnahme(input, massnahmen.length)
    setMassnahmen((prev) => [neu, ...prev])
    return neu
  }

  return (
    <StoreContext.Provider
      value={{ massnahmen, online, ladend, toggleAufgabe, addMassnahme }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore muss innerhalb von StoreProvider stehen')
  return ctx
}

const SPARTE_PREFIX: Record<string, string> = {
  Strom: 'STR',
  Gas: 'GAS',
  Wasser: 'WAS',
  Fernwärme: 'FW',
  Breitband: 'BRB',
}

function lokaleMassnahme(input: NeuMassnahmeInput, anzahl: number): Massnahme {
  const jahr = new Date().getFullYear()
  return {
    id: `m${Date.now()}`,
    kennung: `${SPARTE_PREFIX[input.sparte] ?? 'XXX'}-${jahr}-${String(
      anzahl + 1,
    ).padStart(4, '0')}`,
    titel: input.titel,
    sparte: input.sparte,
    art: input.art,
    spannungsebene: 'Niederspannung',
    status: 'Planung',
    prioritaet: input.prioritaet,
    fortschritt: 0,
    ort: input.gemeinde,
    gemeinde: input.gemeinde,
    bauleiter: input.bauleiter,
    tiefbaufirma: '—',
    budget: input.budget,
    ausgaben: 0,
    start: input.start,
    ende: input.start,
    beschreibung: '',
    geo: { lat: 51.2277, lng: 6.7735 },
    beteiligte: [
      { id: `p${Date.now()}`, name: input.bauleiter, rolle: 'Bauleitung VNB' },
    ],
    meilensteine: [],
    aufgaben: [],
    genehmigungen: [],
    dokumente: [],
  }
}
