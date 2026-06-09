export const API: string =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:4000'

export async function fetchMitTimeout(
  url: string,
  opts: RequestInit = {},
  timeoutMs = 8000,
) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

export interface AssistentNachricht {
  rolle: 'user' | 'assistant'
  text: string
}

export interface AssistentAntwort {
  antwort: string
  quelle: 'ki' | 'regelbasiert'
}

// Fragt den KI-Assistenten im Backend. Fällt bei fehlendem Backend auf einen
// Hinweis zurück (der eigentliche Regel-Fallback passiert serverseitig).
export async function frageAssistent(
  frage: string,
  verlauf: AssistentNachricht[],
): Promise<AssistentAntwort> {
  const r = await fetchMitTimeout(
    `${API}/api/assistent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frage, verlauf }),
    },
    30000,
  )
  if (!r.ok) throw new Error(String(r.status))
  return (await r.json()) as AssistentAntwort
}
