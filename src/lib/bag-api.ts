import { STATUS_MAP, ARNHEM_BBOX } from './constants';
import type { Pand } from './types';

const BASE_URL = 'https://api.pdok.nl/kadaster/bag/ogc/v2/collections/verblijfsobject/items';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processFeature(f: any): Pand | null {
  const p = f.properties || {};
  const status: string = p.status || '';
  const cat = (STATUS_MAP[status] || 'unknown') as Pand['category'];
  const coords = f.geometry?.coordinates;
  if (!coords) return null;

  return {
    id: f.id || p.identificatie || String(Math.random()),
    lat: coords[1],
    lng: coords[0],
    adres: [p.straatnaam, p.huisnummer, p.huisletter, p.huisnummertoevoeging]
      .filter(Boolean)
      .join(' '),
    postcode: p.postcode || '',
    woonplaats: p.woonplaatsnaam || 'Arnhem',
    status: status || 'Onbekend',
    category: cat,
    gebruiksdoel: (p.gebruiksdoelen || [p.gebruiksdoel]).filter(Boolean).join(', '),
    oppervlakte: p.oppervlakte ?? null,
    bouwjaar: p.bouwjaar ?? null,
  };
}

export async function fetchBAGPanden(
  functie: string | null,
  onProgress: (msg: string) => void
): Promise<Pand[]> {
  const params = new URLSearchParams({
    f: 'json',
    limit: '1000',
    bbox: ARNHEM_BBOX,
  });

  if (functie && functie !== 'alle') {
    params.set('gebruiksdoel', functie);
  }

  let nextUrl: string | null = `${BASE_URL}?${params}`;
  const allPanden: Pand[] = [];
  let page = 1;

  while (nextUrl) {
    onProgress(`Pagina ${page} laden via PDOK BAG API...`);
    try {
      const res = await fetch(nextUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json();

      if (!data.features || data.features.length === 0) break;

      for (const f of data.features) {
        const pand = processFeature(f);
        if (pand) allPanden.push(pand);
      }

      onProgress(`${allPanden.length} verblijfsobjecten geladen...`);

      const nextLink = data.links?.find((l: { rel: string }) => l.rel === 'next');
      nextUrl = nextLink ? nextLink.href : null;
      page++;
    } catch (e) {
      console.error('BAG fetch error:', e);
      break;
    }
  }

  return allPanden;
}
