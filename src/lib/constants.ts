export const ARNHEM_CENTER: [number, number] = [51.985, 5.898];
export const ARNHEM_BBOX = '5.80,51.89,5.97,52.03';

export const STATUS_MAP: Record<string, string> = {
  'Verblijfsobject gevormd': 'vacant',
  'Verblijfsobject buiten gebruik': 'nietingebruik',
  'Verblijfsobject in gebruik (niet ingemeten)': 'inuse',
  'Verblijfsobject in gebruik': 'inuse',
  'Verblijfsobject ingetrokken': 'vacant',
  'Niet gerealiseerd verblijfsobject': 'vacant',
};

export const STATUS_COLORS: Record<string, string> = {
  vacant: '#f0522a',
  nietingebruik: '#a855f7',
  inuse: '#06d6a0',
  unknown: '#3a3a5a',
};

export const FUNCTIE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Alle', value: 'alle' },
  { label: 'Winkels', value: 'winkelfunctie' },
  { label: 'Kantoren', value: 'kantoorfunctie' },
  { label: 'Woningen', value: 'woonfunctie' },
];
