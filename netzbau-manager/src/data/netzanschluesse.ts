import type { Netzanschluss, AnschlussStatus, AnschlussTyp } from './types'

export const ANSCHLUSS_STATUS: AnschlussStatus[] = [
  'Eingegangen',
  'Technische Prüfung',
  'Angebot',
  'Zusage',
  'Umsetzung',
  'Inbetriebnahme',
]

// Beispielhafte Netzanschluss-Anträge im Versorgungsgebiet Düsseldorf.
export const netzanschluesse: Netzanschluss[] = [
  {
    id: 'na1',
    kennung: 'NA-2026-04812',
    typ: 'PV-Einspeisung',
    kunde: 'Familie Brinkmann',
    adresse: 'Aachener Str. 142',
    gemeinde: 'Bilk',
    leistungKw: 11.2,
    status: 'Technische Prüfung',
    eingang: '2026-05-12',
    slaTage: 30,
    sachbearbeiter: 'Jens Otto',
  },
  {
    id: 'na2',
    kennung: 'NA-2026-04790',
    typ: 'Wärmepumpe',
    kunde: 'M. Schiller',
    adresse: 'Gerresheimer Landstr. 8',
    gemeinde: 'Gerresheim',
    leistungKw: 9,
    status: 'Eingegangen',
    eingang: '2026-05-28',
    slaTage: 21,
    sachbearbeiter: 'Jens Otto',
    paragraf14a: true,
  },
  {
    id: 'na3',
    kennung: 'NA-2026-04501',
    typ: 'Gewerbeanschluss',
    kunde: 'Rheinlogistik GmbH',
    adresse: 'Reisholzer Werftstr. 30',
    gemeinde: 'Reisholz',
    leistungKw: 630,
    status: 'Angebot',
    eingang: '2026-03-18',
    slaTage: 60,
    sachbearbeiter: 'Claudia Maier',
    massnahmeId: 'm2',
  },
  {
    id: 'na4',
    kennung: 'NA-2026-04233',
    typ: 'E-Ladepunkt',
    kunde: 'Stadtwerke Mobilität',
    adresse: 'Kö-Bogen Tiefgarage',
    gemeinde: 'Stadtmitte',
    leistungKw: 150,
    status: 'Eingegangen',
    eingang: '2026-04-02',
    slaTage: 30,
    sachbearbeiter: 'Sandra Eichel',
    paragraf14a: true,
  },
  {
    id: 'na5',
    kennung: 'NA-2026-04980',
    typ: 'PV-Einspeisung',
    kunde: 'WEG Oberkasseler Ufer',
    adresse: 'Oberkasseler Ufer 12',
    gemeinde: 'Oberkassel',
    leistungKw: 29.9,
    status: 'Zusage',
    eingang: '2026-04-22',
    slaTage: 30,
    sachbearbeiter: 'Jens Otto',
  },
  {
    id: 'na6',
    kennung: 'NA-2026-05012',
    typ: 'Wärmepumpe',
    kunde: 'T. Achterberg',
    adresse: 'Ellerstr. 77',
    gemeinde: 'Eller',
    leistungKw: 12,
    status: 'Umsetzung',
    eingang: '2026-03-30',
    slaTage: 21,
    sachbearbeiter: 'Jens Otto',
    paragraf14a: true,
    massnahmeId: 'm4',
  },
  {
    id: 'na7',
    kennung: 'NA-2026-05098',
    typ: 'Batteriespeicher',
    kunde: 'GreenStore UG',
    adresse: 'Höherweg 200',
    gemeinde: 'Flingern',
    leistungKw: 250,
    status: 'Technische Prüfung',
    eingang: '2026-05-02',
    slaTage: 30,
    sachbearbeiter: 'Claudia Maier',
  },
  {
    id: 'na8',
    kennung: 'NA-2026-05140',
    typ: 'Neubau Hausanschluss',
    kunde: 'Bauträger Mühlbach',
    adresse: 'Am Quellenbusch 4–18',
    gemeinde: 'Gerresheim',
    leistungKw: 84,
    status: 'Umsetzung',
    eingang: '2026-04-15',
    slaTage: 45,
    sachbearbeiter: 'Andrea Kohl',
    massnahmeId: 'm3',
  },
  {
    id: 'na9',
    kennung: 'NA-2026-05201',
    typ: 'PV-Einspeisung',
    kunde: 'H. Doruk',
    adresse: 'Kruppstr. 9',
    gemeinde: 'Oberbilk',
    leistungKw: 8.4,
    status: 'Eingegangen',
    eingang: '2026-06-01',
    slaTage: 30,
    sachbearbeiter: 'Jens Otto',
  },
  {
    id: 'na10',
    kennung: 'NA-2026-04688',
    typ: 'E-Ladepunkt',
    kunde: 'Autohaus Niederrhein',
    adresse: 'Höherweg 310',
    gemeinde: 'Flingern',
    leistungKw: 300,
    status: 'Angebot',
    eingang: '2026-04-08',
    slaTage: 30,
    sachbearbeiter: 'Sandra Eichel',
    paragraf14a: true,
  },
  {
    id: 'na11',
    kennung: 'NA-2026-05222',
    typ: 'Wärmepumpe',
    kunde: 'I. Sönmez',
    adresse: 'Garather Weg 21',
    gemeinde: 'Garath',
    leistungKw: 8,
    status: 'Eingegangen',
    eingang: '2026-06-04',
    slaTage: 21,
    sachbearbeiter: 'Jens Otto',
    paragraf14a: true,
  },
  {
    id: 'na12',
    kennung: 'NA-2026-04955',
    typ: 'PV-Einspeisung',
    kunde: 'Gewerbehof Derendorf eG',
    adresse: 'Rather Str. 25',
    gemeinde: 'Derendorf',
    leistungKw: 99,
    status: 'Inbetriebnahme',
    eingang: '2026-02-20',
    slaTage: 60,
    sachbearbeiter: 'Claudia Maier',
  },
]

const HEUTE = new Date('2026-06-08')

export interface AnschlussFrist {
  tageOffen: number
  restTage: number // verbleibend bis SLA-Frist (negativ = überfällig)
  ampel: 'gruen' | 'gelb' | 'rot'
  abgeschlossen: boolean
}

export function anschlussFrist(na: Netzanschluss): AnschlussFrist {
  const tageOffen = Math.round(
    (HEUTE.getTime() - new Date(na.eingang).getTime()) / 86400000,
  )
  const restTage = na.slaTage - tageOffen
  const abgeschlossen = na.status === 'Inbetriebnahme'
  let ampel: AnschlussFrist['ampel']
  if (abgeschlossen) ampel = 'gruen'
  else if (restTage < 0) ampel = 'rot'
  else if (restTage <= 5) ampel = 'gelb'
  else ampel = 'gruen'
  return { tageOffen, restTage, ampel, abgeschlossen }
}

export const ANSCHLUSS_TYP_LEISTUNG: Record<AnschlussTyp, string> = {
  'PV-Einspeisung': 'Einspeisung',
  Wärmepumpe: 'Bezug',
  'E-Ladepunkt': 'Bezug',
  'Neubau Hausanschluss': 'Bezug',
  Gewerbeanschluss: 'Bezug',
  Batteriespeicher: 'Bezug/Einspeisung',
}
