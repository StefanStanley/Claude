import type { Status, Prioritaet } from './types'

export function formatEuro(value: number): string {
  return value.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
}

export function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function statusFarbe(status: Status): string {
  const map: Record<Status, string> = {
    Planung: '#6366f1',
    Genehmigung: '#d97706',
    Ausschreibung: '#0891b2',
    Bau: '#0e7c5a',
    Abnahme: '#7c3aed',
    Abgeschlossen: '#64748b',
  }
  return map[status]
}

export function spannungsFarbe(ebene: string): string {
  const map: Record<string, string> = {
    Niederspannung: '#0891b2',
    Mittelspannung: '#d97706',
    Hochspannung: '#7c3aed',
    '—': '#64748b',
  }
  return map[ebene] ?? '#64748b'
}

export function prioritaetFarbe(p: Prioritaet): string {
  const map: Record<Prioritaet, string> = {
    Niedrig: '#64748b',
    Mittel: '#0891b2',
    Hoch: '#d97706',
    Kritisch: '#dc2626',
  }
  return map[p]
}

export function tageBis(iso: string): number {
  const heute = new Date('2026-06-08')
  const ziel = new Date(iso)
  return Math.round((ziel.getTime() - heute.getTime()) / (1000 * 60 * 60 * 24))
}
