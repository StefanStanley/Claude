import Anthropic from '@anthropic-ai/sdk'
import { getAll } from './store.ts'
import { netzanschluesse, anschlussFrist } from '../../src/data/netzanschluesse.ts'
import { bewertePortfolio, ampelLabel } from '../../src/data/risiko.ts'

// Modell laut Anthropic-Vorgabe; per Env überschreibbar.
const MODEL = process.env.ASSISTANT_MODEL ?? 'claude-opus-4-8'

export interface Nachricht {
  rolle: 'user' | 'assistant'
  text: string
}

// Kompakter, faktenbasierter Kontext aus dem aktuellen Portfolio.
export function baueKontext(): string {
  const bewertet = bewertePortfolio(getAll())
  const zeilen = bewertet.map((b) => {
    const m = b.massnahme
    const faktoren = b.bewertung.faktoren
      .filter((f) => f.wert >= 33)
      .map((f) => `${f.dimension} ${f.wert} (${f.begruendung})`)
      .join('; ')
    return `- ${m.kennung} "${m.titel}" | Status ${m.status}, ${m.fortschritt}% | Budget ${m.budget}€, Ausgaben ${m.ausgaben}€ | Gemeinde ${m.gemeinde} | Bauleitung ${m.bauleiter}, Tiefbau ${m.tiefbaufirma} | Risiko ${b.bewertung.score} (${ampelLabel[b.bewertung.ampel]})${faktoren ? ' | Risikotreiber: ' + faktoren : ''}${b.bewertung.topEmpfehlung ? ' | Empfehlung: ' + b.bewertung.topEmpfehlung.text : ''}`
  })

  const naAktiv = netzanschluesse.filter((n) => n.status !== 'Inbetriebnahme')
  const naZeilen = naAktiv.map((n) => {
    const f = anschlussFrist(n)
    return `- ${n.kennung} ${n.typ} | Kunde ${n.kunde}, ${n.gemeinde} | ${n.leistungKw} kW | Status ${n.status} | ${f.restTage < 0 ? Math.abs(f.restTage) + ' Tage ÜBERFÄLLIG' : f.restTage + ' Tage Restfrist'}${n.paragraf14a ? ' | §14a EnWG' : ''}`
  })

  return `BAUMASSNAHMEN (Risiko-bewertet):\n${zeilen.join('\n')}\n\nNETZANSCHLUSS-ANTRÄGE (offen):\n${naZeilen.join('\n')}`
}

const SYSTEM = (kontext: string) =>
  `Du bist der KI-Steuerungsassistent von "NetzBau Manager", einer Software für das Bauprojekt-Management bei Verteilnetzbetreibern (VNB) in Deutschland.

Deine Aufgabe: Bauleitung, Netzplanung und Geschäftsführung beim Steuern des Netzausbaus unterstützen. Beantworte Fragen zum Portfolio präzise, faktenbasiert und entscheidungsorientiert. Nenne konkrete Maßnahmen (mit Kennung), benenne Engpässe und empfiehl die nächste beste Aktion. Erfinde keine Daten – nutze ausschließlich den bereitgestellten Kontext. Antworte auf Deutsch, knapp und strukturiert (kurze Absätze oder Bulletpoints). Beziehe dich auf Risikowerte und Fristen, wo relevant.

AKTUELLE PORTFOLIODATEN (Stand heute):
${kontext}`

export interface AssistentAntwort {
  antwort: string
  quelle: 'ki' | 'regelbasiert'
}

export async function frageAssistent(
  frage: string,
  verlauf: Nachricht[],
): Promise<AssistentAntwort> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { antwort: regelAntwort(frage), quelle: 'regelbasiert' }
  }
  const client = new Anthropic({ apiKey })
  const messages: Anthropic.MessageParam[] = [
    ...verlauf.slice(-8).map((n) => ({
      role: n.rolle,
      content: n.text,
    })),
    { role: 'user' as const, content: frage },
  ]
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM(baueKontext()),
    messages,
  })
  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()
  return { antwort: text || '(keine Antwort)', quelle: 'ki' }
}

// Regelbasierter Fallback ohne API-Key – beantwortet die häufigsten Fragen
// direkt aus den Daten, damit der Assistent auch ohne LLM nützlich ist.
export function regelAntwort(frage: string): string {
  const f = frage.toLowerCase()
  const bewertet = bewertePortfolio(getAll())

  if (/kritisch|risiko|gefahr|gefährdet|problem/.test(f)) {
    const top = bewertet.slice(0, 3)
    return (
      'Die aktuell am stärksten gefährdeten Maßnahmen:\n\n' +
      top
        .map(
          (b, i) =>
            `${i + 1}. ${b.massnahme.titel} (${b.massnahme.kennung}) – Risiko ${b.bewertung.score}/${ampelLabel[b.bewertung.ampel]}.\n   ${b.bewertung.topEmpfehlung?.text ?? 'Keine akute Aktion.'}`,
        )
        .join('\n') +
      '\n\n(Regelbasierte Antwort – ohne ANTHROPIC_API_KEY im Backend.)'
    )
  }

  if (/genehmig|aufgrab|behörde/.test(f)) {
    const offen = getAll().flatMap((m) =>
      m.genehmigungen
        .filter((g) => g.status !== 'Erteilt')
        .map((g) => `- ${g.art} (${g.behoerde}) – ${g.status} – ${m.titel}`),
    )
    return offen.length
      ? 'Offene/hängende Genehmigungen:\n' + offen.join('\n')
      : 'Aktuell sind keine Genehmigungen offen.'
  }

  if (/anschluss|überfällig|frist|pv|wärmepumpe|ladepunkt|sla/.test(f)) {
    const ueber = netzanschluesse
      .filter((n) => n.status !== 'Inbetriebnahme' && anschlussFrist(n).restTage < 0)
      .map(
        (n) =>
          `- ${n.kennung} ${n.typ} (${n.kunde}, ${n.gemeinde}) – ${Math.abs(anschlussFrist(n).restTage)} Tage überfällig`,
      )
    return ueber.length
      ? 'Netzanschlüsse mit überschrittener SLA-Frist:\n' + ueber.join('\n')
      : 'Kein Netzanschluss ist derzeit überfällig.'
  }

  if (/budget|kosten|teuer|überschreit/.test(f)) {
    const budget = bewertet
      .filter((b) => b.bewertung.faktoren.some((x) => x.dimension === 'Budget' && x.wert >= 50))
      .map((b) => `- ${b.massnahme.titel}: ${b.bewertung.faktoren.find((x) => x.dimension === 'Budget')?.begruendung}`)
    return budget.length
      ? 'Maßnahmen mit Budgetrisiko:\n' + budget.join('\n')
      : 'Keine Maßnahme zeigt aktuell ein erhöhtes Budgetrisiko.'
  }

  // Default: Überblick
  const rot = bewertet.filter((b) => b.bewertung.ampel === 'rot').length
  return (
    `Portfolio-Überblick: ${bewertet.length} aktive Maßnahmen, davon ${rot} kritisch. ` +
    `Frag mich z. B. nach „kritischen Maßnahmen", „hängenden Genehmigungen", „überfälligen Netzanschlüssen" oder „Budgetrisiken".\n\n` +
    '(Regelbasierte Antwort – für KI-Antworten ANTHROPIC_API_KEY im Backend setzen.)'
  )
}
