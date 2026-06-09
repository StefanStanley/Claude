// Transparente, regelbasierte Risiko- & Empfehlungs-Engine.
// Reine TS-Logik (keine UI) – wird sowohl im Frontend (Cockpit) als auch im
// Backend (KI-Assistent-Kontext) genutzt.
import type { Massnahme } from './types'

export const HEUTE = new Date('2026-06-08')

export type Ampel = 'gruen' | 'gelb' | 'rot'
export type Dimension = 'Termin' | 'Genehmigung' | 'Budget' | 'Kapazität'

export interface Risikofaktor {
  dimension: Dimension
  wert: number // 0–100
  begruendung: string
}

export interface Empfehlung {
  dimension: Dimension
  text: string
  prioritaet: 'Hoch' | 'Mittel' | 'Niedrig'
}

export interface Risikobewertung {
  score: number // 0–100 gesamt
  ampel: Ampel
  faktoren: Risikofaktor[]
  empfehlungen: Empfehlung[]
  topEmpfehlung?: Empfehlung
}

const tage = (von: Date, bis: Date) =>
  Math.round((bis.getTime() - von.getTime()) / 86400000)

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Math.round(n)))

function ampelAus(score: number): Ampel {
  if (score >= 66) return 'rot'
  if (score >= 33) return 'gelb'
  return 'gruen'
}

function terminFaktor(m: Massnahme): Risikofaktor {
  if (m.status === 'Abgeschlossen')
    return { dimension: 'Termin', wert: 0, begruendung: 'Abgeschlossen.' }

  const start = new Date(m.start)
  const ende = new Date(m.ende)
  const gesamt = Math.max(tage(start, ende), 1)
  const vergangen = tage(start, HEUTE)
  const erwartet = clamp((vergangen / gesamt) * 100)
  const rueckstand = erwartet - m.fortschritt
  let wert = clamp(rueckstand * 1.6)
  let begruendung =
    rueckstand > 4
      ? `${Math.round(rueckstand)} % hinter Plan (erwartet ~${erwartet} %, ist ${m.fortschritt} %).`
      : 'Im Zeitplan.'

  const ueberfaellig = tage(ende, HEUTE)
  if (ueberfaellig > 0) {
    wert = clamp(Math.max(wert, 72 + ueberfaellig / 3))
    begruendung = `Endtermin um ${ueberfaellig} Tage überschritten (${m.fortschritt} % fertig).`
  } else if (tage(HEUTE, ende) <= 21 && m.fortschritt < 80) {
    wert = clamp(Math.max(wert, 55))
    begruendung = `Endtermin in ${tage(HEUTE, ende)} Tagen, erst ${m.fortschritt} % fertig.`
  }
  return { dimension: 'Termin', wert, begruendung }
}

function genehmigungFaktor(m: Massnahme): Risikofaktor {
  const offen = m.genehmigungen.filter((g) => g.status !== 'Erteilt')
  const abgelehnt = m.genehmigungen.find((g) => g.status === 'Abgelehnt')
  if (abgelehnt)
    return {
      dimension: 'Genehmigung',
      wert: 95,
      begruendung: `${abgelehnt.art} (${abgelehnt.behoerde}) wurde abgelehnt.`,
    }
  if (offen.length === 0)
    return {
      dimension: 'Genehmigung',
      wert: 0,
      begruendung: m.genehmigungen.length
        ? 'Alle Genehmigungen erteilt.'
        : 'Keine Genehmigung erforderlich.',
    }

  const bisStart = tage(HEUTE, new Date(m.start))
  const aelteste = offen.reduce(
    (min, g) => Math.min(min, tage(new Date(g.datum), HEUTE)),
    0,
  )
  let wert: number
  if (bisStart < 0)
    wert = clamp(70 + Math.abs(bisStart) / 3) // Baubeginn erreicht, noch offen
  else if (bisStart <= 30) wert = 60
  else if (bisStart <= 60) wert = 42
  else wert = 26
  const g = offen[0]
  const begruendung = `${g.art} bei ${g.behoerde} seit ${aelteste} Tagen ${g.status.toLowerCase()}${
    bisStart >= 0 ? `, Baubeginn in ${bisStart} Tagen` : ', Baubeginn bereits fällig'
  }.`
  return { dimension: 'Genehmigung', wert, begruendung }
}

function budgetFaktor(m: Massnahme): Risikofaktor {
  if (m.budget <= 0)
    return { dimension: 'Budget', wert: 0, begruendung: 'Kein Budget hinterlegt.' }
  const anteil = (m.ausgaben / m.budget) * 100
  const effizienz = anteil - m.fortschritt // >0: schneller Geld als Fortschritt
  let wert = clamp(effizienz * 2.2)
  if (anteil > 95 && m.status !== 'Abgeschlossen')
    wert = clamp(Math.max(wert, 75))
  const begruendung =
    effizienz > 6 || anteil > 95
      ? `${Math.round(anteil)} % Budget verausgabt bei ${m.fortschritt} % Fortschritt.`
      : `Budget im Rahmen (${Math.round(anteil)} % verausgabt).`
  return { dimension: 'Budget', wert, begruendung }
}

function kapazitaetFaktor(m: Massnahme): Risikofaktor {
  const ohneTiefbau =
    !m.tiefbaufirma ||
    m.tiefbaufirma === '—' ||
    m.tiefbaufirma.toLowerCase().startsWith('noch')
  const brauchtTiefbau = m.art !== 'Smart-Meter-Rollout'
  if (!ohneTiefbau || !brauchtTiefbau)
    return {
      dimension: 'Kapazität',
      wert: 0,
      begruendung: brauchtTiefbau
        ? `Tiefbau vergeben (${m.tiefbaufirma}).`
        : 'Kein Tiefbau erforderlich.',
    }
  const bisStart = tage(HEUTE, new Date(m.start))
  let wert: number
  if (bisStart < 0) wert = 88
  else if (bisStart <= 45) wert = 72
  else if (bisStart <= 90) wert = 48
  else wert = 30
  const begruendung =
    bisStart < 0
      ? 'Tiefbau noch nicht vergeben – Baubeginn bereits fällig.'
      : `Tiefbau noch nicht vergeben – Baubeginn in ${bisStart} Tagen.`
  return { dimension: 'Kapazität', wert, begruendung }
}

function empfehlungAus(f: Risikofaktor): Empfehlung | null {
  if (f.wert < 40) return null
  const prioritaet = f.wert >= 66 ? 'Hoch' : 'Mittel'
  const text: Record<Dimension, string> = {
    Termin: `Termin steuern: ${f.begruendung} Gewerke nachtakten oder Endtermin neu bewerten.`,
    Genehmigung: `Genehmigung eskalieren: ${f.begruendung}`,
    Budget: `Budget prüfen: ${f.begruendung} Nachtrag/Kostenstand klären.`,
    Kapazität: `Tiefbau beauftragen: ${f.begruendung}`,
  }
  return { dimension: f.dimension, text: text[f.dimension], prioritaet }
}

export function bewerteMassnahme(m: Massnahme): Risikobewertung {
  const faktoren = [
    terminFaktor(m),
    genehmigungFaktor(m),
    budgetFaktor(m),
    kapazitaetFaktor(m),
  ]
  const max = Math.max(...faktoren.map((f) => f.wert))
  const avg = faktoren.reduce((s, f) => s + f.wert, 0) / faktoren.length
  const score = clamp(max * 0.62 + avg * 0.38)
  const empfehlungen = faktoren
    .map(empfehlungAus)
    .filter((e): e is Empfehlung => e !== null)
    .sort((a, b) => (a.prioritaet === b.prioritaet ? 0 : a.prioritaet === 'Hoch' ? -1 : 1))
  return {
    score,
    ampel: ampelAus(score),
    faktoren,
    empfehlungen,
    topEmpfehlung: empfehlungen[0],
  }
}

export interface BewerteteMassnahme {
  massnahme: Massnahme
  bewertung: Risikobewertung
}

export function bewertePortfolio(massnahmen: Massnahme[]): BewerteteMassnahme[] {
  return massnahmen
    .filter((m) => m.status !== 'Abgeschlossen')
    .map((m) => ({ massnahme: m, bewertung: bewerteMassnahme(m) }))
    .sort((a, b) => b.bewertung.score - a.bewertung.score)
}

export const ampelFarbe: Record<Ampel, string> = {
  rot: '#dc2626',
  gelb: '#d97706',
  gruen: '#0f766e',
}

export const ampelLabel: Record<Ampel, string> = {
  rot: 'Kritisch',
  gelb: 'Beobachten',
  gruen: 'Auf Kurs',
}
