// Datenmodell + Seed-Daten für Anlagen aus dem Marktstammdatenregister (MaStR)
// im Versorgungsgebiet Düsseldorf.
//
// Die Daten werden vom Backend per `npm run download:mastr` aus der
// öffentlichen MaStR-Web-API geladen (Standortfilter Gemeinde = Düsseldorf)
// und unter server/data/mastr-duesseldorf.json abgelegt. Ohne geladene Daten
// arbeitet die App mit den hier hinterlegten realistischen Beispiel-Anlagen
// (Demo-Modus), damit die Oberfläche immer funktioniert.

export type MaStrSparte = 'Strom' | 'Gas'
export type MaStrRichtung = 'Erzeugung' | 'Verbrauch'

export interface MaStrEinheit {
  /** Einheit-MaStR-Nummer, z. B. "SEE901234567890" */
  mastrNr: string
  /** Anzeigename der Einheit (bei Privatpersonen anonymisiert) */
  name: string
  /** Betreibername (bei Privatpersonen "Natürliche Person") */
  betreiber: string
  sparte: MaStrSparte
  richtung: MaStrRichtung
  /** Energieträger, z. B. "Solare Strahlungsenergie", "Wind", "Erdgas" */
  energietraeger: string
  /** Bruttoleistung in kW (null, wenn nicht angegeben) */
  bruttoleistungKw: number | null
  /** Nettoleistung in kW (null, wenn nicht angegeben) */
  nettoleistungKw: number | null
  /** Inbetriebnahmedatum als ISO-String (null, wenn nicht angegeben) */
  inbetriebnahme: string | null
  /** Betriebsstatus, z. B. "In Betrieb", "In Planung" */
  status: string
  plz: string
  /** Ort bzw. Stadtteil */
  ort: string
  lat: number | null
  lng: number | null
}

// Farben je Energieträger – an der Palette der App orientiert
export const ENERGIETRAEGER_FARBE: Record<string, string> = {
  'Solare Strahlungsenergie': '#f59e0b',
  Wind: '#0891b2',
  Wasser: '#2563eb',
  Biomasse: '#0e7c5a',
  Stromspeicher: '#7c3aed',
  Erdgas: '#d97706',
  Mineralölprodukte: '#475569',
  'Nicht biogener Abfall': '#64748b',
  Wärmepumpe: '#db2777',
  Stromverbrauch: '#1e3a5f',
}

export function energietraegerFarbe(et: string): string {
  return ENERGIETRAEGER_FARBE[et] ?? '#64748b'
}

export interface MaStrZusammenfassung {
  anzahl: number
  anzahlErzeugung: number
  anzahlVerbrauch: number
  /** installierte Bruttoleistung der Erzeugungseinheiten in kW */
  leistungErzeugungKw: number
  /** Verteilung nach Energieträger (Anzahl Einheiten) */
  jeEnergietraeger: { label: string; value: number; color: string }[]
}

export function mastrZusammenfassung(
  einheiten: MaStrEinheit[],
): MaStrZusammenfassung {
  const erzeugung = einheiten.filter((e) => e.richtung === 'Erzeugung')
  const verbrauch = einheiten.filter((e) => e.richtung === 'Verbrauch')

  const counts = new Map<string, number>()
  einheiten.forEach((e) =>
    counts.set(e.energietraeger, (counts.get(e.energietraeger) ?? 0) + 1),
  )

  return {
    anzahl: einheiten.length,
    anzahlErzeugung: erzeugung.length,
    anzahlVerbrauch: verbrauch.length,
    leistungErzeugungKw: erzeugung.reduce(
      (s, e) => s + (e.bruttoleistungKw ?? 0),
      0,
    ),
    jeEnergietraeger: [...counts.entries()]
      .map(([label, value]) => ({
        label,
        value,
        color: energietraegerFarbe(label),
      }))
      .sort((a, b) => b.value - a.value),
  }
}

// Leistung lesbar formatieren (kW → kW/MW)
export function formatLeistung(kw: number | null): string {
  if (kw === null || Number.isNaN(kw)) return '—'
  if (kw >= 1000) {
    return `${(kw / 1000).toLocaleString('de-DE', {
      maximumFractionDigits: 1,
    })} MW`
  }
  return `${kw.toLocaleString('de-DE', { maximumFractionDigits: 1 })} kW`
}

// ── Demo-Seed: realistische Beispiel-Anlagen in Düsseldorf ──────────────────
// Ersetzt durch echte MaStR-Daten, sobald `npm run download:mastr` gelaufen ist.
export const mastrSeed: MaStrEinheit[] = [
  {
    mastrNr: 'SEE900000000001',
    name: 'PV-Dachanlage Bilk',
    betreiber: 'Natürliche Person',
    sparte: 'Strom',
    richtung: 'Erzeugung',
    energietraeger: 'Solare Strahlungsenergie',
    bruttoleistungKw: 9.8,
    nettoleistungKw: 9.8,
    inbetriebnahme: '2023-05-12',
    status: 'In Betrieb',
    plz: '40225',
    ort: 'Düsseldorf-Bilk',
    lat: 51.2049,
    lng: 6.7836,
  },
  {
    mastrNr: 'SEE900000000002',
    name: 'PV-Aufdachanlage Gewerbehof Flingern',
    betreiber: 'Rheinpark Logistik GmbH',
    sparte: 'Strom',
    richtung: 'Erzeugung',
    energietraeger: 'Solare Strahlungsenergie',
    bruttoleistungKw: 248.4,
    nettoleistungKw: 240,
    inbetriebnahme: '2022-09-30',
    status: 'In Betrieb',
    plz: '40233',
    ort: 'Düsseldorf-Flingern',
    lat: 51.2308,
    lng: 6.8061,
  },
  {
    mastrNr: 'SEE900000000003',
    name: 'Batteriespeicher Quartier Grafenberg',
    betreiber: 'Stadtwerke-Quartier Grafenberg eG',
    sparte: 'Strom',
    richtung: 'Erzeugung',
    energietraeger: 'Stromspeicher',
    bruttoleistungKw: 150,
    nettoleistungKw: 150,
    inbetriebnahme: '2024-03-18',
    status: 'In Betrieb',
    plz: '40235',
    ort: 'Düsseldorf-Grafenberg',
    lat: 51.2356,
    lng: 6.8278,
  },
  {
    mastrNr: 'SEE900000000004',
    name: 'Müllheizkraftwerk Flingern (Block 1)',
    betreiber: 'AWISTA / Energie-Verwertung Düsseldorf',
    sparte: 'Strom',
    richtung: 'Erzeugung',
    energietraeger: 'Nicht biogener Abfall',
    bruttoleistungKw: 36000,
    nettoleistungKw: 31000,
    inbetriebnahme: '1999-11-01',
    status: 'In Betrieb',
    plz: '40233',
    ort: 'Düsseldorf-Flingern',
    lat: 51.2342,
    lng: 6.8093,
  },
  {
    mastrNr: 'SEE900000000005',
    name: 'Wasserkraft Schnatzhäuschen',
    betreiber: 'Natürliche Person',
    sparte: 'Strom',
    richtung: 'Erzeugung',
    energietraeger: 'Wasser',
    bruttoleistungKw: 22,
    nettoleistungKw: 20,
    inbetriebnahme: '2010-06-21',
    status: 'In Betrieb',
    plz: '40629',
    ort: 'Düsseldorf-Gerresheim',
    lat: 51.245,
    lng: 6.86,
  },
  {
    mastrNr: 'SEE900000000006',
    name: 'BHKW Klinikum (Erdgas)',
    betreiber: 'Klinik-Energie Düsseldorf GmbH',
    sparte: 'Strom',
    richtung: 'Erzeugung',
    energietraeger: 'Erdgas',
    bruttoleistungKw: 2000,
    nettoleistungKw: 1950,
    inbetriebnahme: '2018-01-15',
    status: 'In Betrieb',
    plz: '40225',
    ort: 'Düsseldorf-Bilk',
    lat: 51.1962,
    lng: 6.7906,
  },
  {
    mastrNr: 'SEE900000000007',
    name: 'PV-Freiflächenanlage Hafen',
    betreiber: 'Solarpark Rheinhafen GmbH & Co. KG',
    sparte: 'Strom',
    richtung: 'Erzeugung',
    energietraeger: 'Solare Strahlungsenergie',
    bruttoleistungKw: 1200,
    nettoleistungKw: 1150,
    inbetriebnahme: '2025-04-02',
    status: 'In Planung',
    plz: '40221',
    ort: 'Düsseldorf-Hafen',
    lat: 51.2138,
    lng: 6.7396,
  },
  {
    mastrNr: 'SEE900000000008',
    name: 'PV-Dachanlage Reihenhaus Eller',
    betreiber: 'Natürliche Person',
    sparte: 'Strom',
    richtung: 'Erzeugung',
    energietraeger: 'Solare Strahlungsenergie',
    bruttoleistungKw: 6.4,
    nettoleistungKw: 6.4,
    inbetriebnahme: '2024-08-09',
    status: 'In Betrieb',
    plz: '40229',
    ort: 'Düsseldorf-Eller',
    lat: 51.1885,
    lng: 6.8429,
  },
  {
    mastrNr: 'SEE900000000009',
    name: 'Notstromaggregat Rechenzentrum',
    betreiber: 'DataHub Rhein GmbH',
    sparte: 'Strom',
    richtung: 'Erzeugung',
    energietraeger: 'Mineralölprodukte',
    bruttoleistungKw: 800,
    nettoleistungKw: 800,
    inbetriebnahme: '2021-02-28',
    status: 'In Betrieb',
    plz: '40211',
    ort: 'Düsseldorf-Pempelfort',
    lat: 51.2376,
    lng: 6.7895,
  },
  {
    mastrNr: 'SEE900000000010',
    name: 'Biomasse-BHKW Klärwerk Süd',
    betreiber: 'Stadtentwässerungsbetrieb Düsseldorf',
    sparte: 'Strom',
    richtung: 'Erzeugung',
    energietraeger: 'Biomasse',
    bruttoleistungKw: 1340,
    nettoleistungKw: 1300,
    inbetriebnahme: '2016-07-12',
    status: 'In Betrieb',
    plz: '40221',
    ort: 'Düsseldorf-Hamm',
    lat: 51.1989,
    lng: 6.7402,
  },
  {
    mastrNr: 'SGV900000000011',
    name: 'Gas-Hausanschluss Mehrfamilienhaus Oberbilk',
    betreiber: 'Wohnungsbau Oberbilk eG',
    sparte: 'Gas',
    richtung: 'Verbrauch',
    energietraeger: 'Erdgas',
    bruttoleistungKw: null,
    nettoleistungKw: null,
    inbetriebnahme: '2009-10-01',
    status: 'In Betrieb',
    plz: '40215',
    ort: 'Düsseldorf-Oberbilk',
    lat: 51.2098,
    lng: 6.8009,
  },
  {
    mastrNr: 'SVE900000000012',
    name: 'Großverbraucher Industriepark Reisholz',
    betreiber: 'Reisholz Industrie Services GmbH',
    sparte: 'Strom',
    richtung: 'Verbrauch',
    energietraeger: 'Stromverbrauch',
    bruttoleistungKw: 5400,
    nettoleistungKw: 5400,
    inbetriebnahme: '2014-03-01',
    status: 'In Betrieb',
    plz: '40599',
    ort: 'Düsseldorf-Reisholz',
    lat: 51.16,
    lng: 6.8333,
  },
]
