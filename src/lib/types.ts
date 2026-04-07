export interface Pand {
  id: string;
  lat: number;
  lng: number;
  adres: string;
  postcode: string;
  woonplaats: string;
  status: string;
  category: 'vacant' | 'nietingebruik' | 'inuse' | 'unknown';
  gebruiksdoel: string;
  oppervlakte: number | null;
  bouwjaar: number | null;
}

export type FunctieFilter = 'alle' | 'winkelfunctie' | 'kantoorfunctie' | 'woonfunctie';
export type StatusFilter = 'vacant' | 'nietingebruik' | 'inuse' | 'unknown' | null;
