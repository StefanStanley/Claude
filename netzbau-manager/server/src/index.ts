import express from 'express'
import cors from 'cors'
import {
  getAll,
  getOne,
  toggleAufgabe,
  addMassnahme,
  type NeuMassnahmeInput,
} from './store.ts'

const app = express()
app.use(cors())
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

app.listen(PORT, () => {
  console.log(`NetzBau Manager API läuft auf http://localhost:${PORT}`)
})
