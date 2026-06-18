import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { massnahmen as seed } from './massnahmen'
import { netzanschluesse as anschlussSeed } from './netzanschluesse'
import { mastrSeed } from './mastr'
import type { MaStrEinheit } from './mastr'
import { API, fetchMitTimeout } from './api'
import type {
  Massnahme,
  Netzanschluss,
  Prioritaet,
  Sparte,
  MassnahmeArt,
} from './types'

const POLL_MS = 5000 // Abstand der Wiederverbindungsversuche
const MAX_TRIES = 30 // ~2,5 min – deckt den Render-Kaltstart ab

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
  netzanschluesse: Netzanschluss[]
  mastrEinheiten: MaStrEinheit[]
  mastrDemo: boolean // true = Seed-Daten (noch kein download:mastr gelaufen)
  online: boolean // Backend verbunden, Änderungen werden persistiert
  verbindet: boolean // Verbindungsversuch läuft (z. B. Backend-Kaltstart)
  reconnect: () => void // manueller Sofort-Neuversuch
  toggleAufgabe: (mId: string, aId: string) => void
  addMassnahme: (input: NeuMassnahmeInput) => Promise<Massnahme>
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [massnahmen, setMassnahmen] = useState<Massnahme[]>(seed)
  const [netzanschluesse, setNetzanschluesse] =
    useState<Netzanschluss[]>(anschlussSeed)
  const [mastrEinheiten, setMastrEinheiten] = useState<MaStrEinheit[]>(mastrSeed)
  const [mastrDemo, setMastrDemo] = useState(true)
  const [online, setOnline] = useState(false)
  const [verbindet, setVerbindet] = useState(true)

  const aliveRef = useRef(true)
  const timerRef = useRef<number | null>(null)
  const triesRef = useRef(0)
  const onlineRef = useRef(false)

  const stopTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // Einen Verbindungsversuch durchführen; Daten laden, wenn erreichbar
  const versuch = async (): Promise<boolean> => {
    try {
      const r = await fetchMitTimeout(`${API}/api/massnahmen`)
      if (!r.ok) throw new Error(String(r.status))
      const daten = (await r.json()) as Massnahme[]
      if (aliveRef.current) {
        setMassnahmen(daten)
        setOnline(true)
        onlineRef.current = true
        setVerbindet(false)
      }
      // Netzanschlüsse best effort nachladen
      fetchMitTimeout(`${API}/api/netzanschluesse`)
        .then((res) => (res.ok ? res.json() : null))
        .then((na) => {
          if (na && aliveRef.current) setNetzanschluesse(na as Netzanschluss[])
        })
        .catch(() => {})
      // MaStR-Anlagen (Düsseldorf) best effort nachladen
      fetchMitTimeout(`${API}/api/mastr`)
        .then((res) => (res.ok ? res.json() : null))
        .then((m) => {
          if (m && aliveRef.current && Array.isArray(m.einheiten)) {
            setMastrEinheiten(m.einheiten as MaStrEinheit[])
            setMastrDemo(Boolean(m.demo))
          }
        })
        .catch(() => {})
      return true
    } catch {
      return false
    }
  }

  // Im Hintergrund weiter versuchen, bis das Backend wach ist
  const pollen = () => {
    stopTimer()
    timerRef.current = window.setTimeout(async () => {
      if (!aliveRef.current) return
      triesRef.current += 1
      const ok = await versuch()
      if (ok || !aliveRef.current) return
      if (triesRef.current >= MAX_TRIES) {
        setVerbindet(false) // aufgeben → Demo-Modus
        return
      }
      pollen()
    }, POLL_MS)
  }

  const starteVerbindung = () => {
    setVerbindet(true)
    triesRef.current = 0
    versuch().then((ok) => {
      if (!ok && aliveRef.current) pollen()
    })
  }

  const reconnect = () => {
    if (onlineRef.current) return
    stopTimer()
    starteVerbindung()
  }

  useEffect(() => {
    aliveRef.current = true
    starteVerbindung()
    return () => {
      aliveRef.current = false
      stopTimer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Verbindung als verloren markieren und Wiederverbindung anstoßen
  const verbindungVerloren = () => {
    if (!onlineRef.current) return
    setOnline(false)
    onlineRef.current = false
    starteVerbindung()
  }

  const toggleAufgabe = (mId: string, aId: string) => {
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
    if (onlineRef.current) {
      fetchMitTimeout(`${API}/api/massnahmen/${mId}/aufgaben/${aId}`, {
        method: 'PATCH',
      }).catch(() => verbindungVerloren())
    }
  }

  const addMassnahme = async (input: NeuMassnahmeInput): Promise<Massnahme> => {
    if (onlineRef.current) {
      try {
        const r = await fetchMitTimeout(`${API}/api/massnahmen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        if (!r.ok) throw new Error(String(r.status))
        const neu = (await r.json()) as Massnahme
        setMassnahmen((prev) => [neu, ...prev])
        return neu
      } catch {
        verbindungVerloren()
      }
    }
    const neu = lokaleMassnahme(input, massnahmen.length)
    setMassnahmen((prev) => [neu, ...prev])
    return neu
  }

  return (
    <StoreContext.Provider
      value={{
        massnahmen,
        netzanschluesse,
        mastrEinheiten,
        mastrDemo,
        online,
        verbindet,
        reconnect,
        toggleAufgabe,
        addMassnahme,
      }}
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
