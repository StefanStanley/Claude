import express from 'express'
import cors from 'cors'
import {
  getAll,
  getOne,
  toggleAufgabe,
  addMassnahme,
  type NeuMassnahmeInput,
} from './store.ts'
import { netzanschluesse } from '../../src/data/netzanschluesse.ts'
import { frageAssistent, type Nachricht } from './assistent.ts'
import { getEinheiten } from './mastr/store.ts'

const app = express()
// CORS: im Hosting auf die Frontend-Domain(s) einschränken (CORS_ORIGIN,
// kommagetrennt). Ohne Angabe sind alle Ursprünge erlaubt (Entwicklung).
const corsOrigin = process.env.CORS_ORIGIN
app.use(cors(corsOrigin ? { origin: corsOrigin.split(',').map((s) => s.trim()) } : undefined))
app.use(express.json())

const PORT = Number(process.env.PORT ?? 4000)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'netzbau-manager-server' })
})

app.get('/api/massnahmen', (_req, res) => {
  res.json(getAll())
})

app.get('/api/massnahmen/:id', (req, res) => {
  const m = getOne(req.params.id)
  if (!m) return res.status(404).json({ fehler: 'Maßnahme nicht gefunden' })
  res.json(m)
})

app.post('/api/massnahmen', (req, res) => {
  const input = req.body as NeuMassnahmeInput
  if (!input?.titel || !input?.gemeinde || !input?.budget) {
    return res
      .status(400)
      .json({ fehler: 'titel, gemeinde und budget sind erforderlich' })
  }
  res.status(201).json(addMassnahme(input))
})

app.patch('/api/massnahmen/:id/aufgaben/:aId', (req, res) => {
  const m = toggleAufgabe(req.params.id, req.params.aId)
  if (!m) return res.status(404).json({ fehler: 'Maßnahme/Aufgabe nicht gefunden' })
  res.json(m)
})

app.get('/api/netzanschluesse', (_req, res) => {
  res.json(netzanschluesse)
})

// MaStR-Anlagen im Versorgungsgebiet Düsseldorf (aus download:mastr oder Demo)
app.get('/api/mastr', (req, res) => {
  const { total, einheiten, demo } = getEinheiten({
    q: req.query.q ? String(req.query.q) : undefined,
    energietraeger: req.query.energietraeger
      ? String(req.query.energietraeger)
      : undefined,
    richtung: req.query.richtung ? String(req.query.richtung) : undefined,
    plz: req.query.plz ? String(req.query.plz) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    offset: req.query.offset ? Number(req.query.offset) : undefined,
  })
  res.json({ total, demo, einheiten })
})

app.post('/api/assistent', async (req, res) => {
  const frage = String(req.body?.frage ?? '').trim()
  const verlauf = (req.body?.verlauf ?? []) as Nachricht[]
  if (!frage) return res.status(400).json({ fehler: 'frage ist erforderlich' })
  try {
    const antwort = await frageAssistent(frage, verlauf)
    res.json(antwort)
  } catch (e) {
    console.error('Assistent-Fehler:', e)
    res.status(500).json({ fehler: 'Assistent nicht verfügbar' })
  }
})

app.listen(PORT, () => {
  console.log(`NetzBau Manager API läuft auf http://localhost:${PORT}`)
})
