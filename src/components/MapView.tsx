import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ARNHEM_CENTER, STATUS_COLORS } from '../lib/constants';
import type { Pand } from '../lib/types';

const STYLE_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const SOURCE_ID = 'panden';

function toGeoJSON(panden: Pand[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: panden.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: {
        id: p.id,
        adres: p.adres,
        postcode: p.postcode,
        woonplaats: p.woonplaats,
        status: p.status,
        category: p.category,
        gebruiksdoel: p.gebruiksdoel,
        oppervlakte: p.oppervlakte,
        bouwjaar: p.bouwjaar,
        color: STATUS_COLORS[p.category] ?? STATUS_COLORS.unknown,
      },
    })),
  };
}

function popupHTML(props: Record<string, unknown>): string {
  const color = String(props.color ?? '#888');
  return `
    <div style="font-family:'Syne',sans-serif;padding:4px 0;min-width:220px">
      <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#e8e6f0">${props.adres || 'Onbekend adres'}</div>
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
        <span style="color:#7a7a9a;font-family:'DM Mono',monospace">Postcode</span>
        <span style="color:#e8e6f0">${props.postcode} ${props.woonplaats}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
        <span style="color:#7a7a9a;font-family:'DM Mono',monospace">Status</span>
        <span style="color:${color}">${props.status}</span>
      </div>
      ${props.gebruiksdoel ? `<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px"><span style="color:#7a7a9a;font-family:'DM Mono',monospace">Gebruik</span><span style="color:#e8e6f0">${props.gebruiksdoel}</span></div>` : ''}
      ${props.oppervlakte ? `<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px"><span style="color:#7a7a9a;font-family:'DM Mono',monospace">Oppervlakte</span><span style="color:#e8e6f0">${props.oppervlakte} m²</span></div>` : ''}
      ${props.bouwjaar ? `<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px"><span style="color:#7a7a9a;font-family:'DM Mono',monospace">Bouwjaar</span><span style="color:#e8e6f0">${props.bouwjaar}</span></div>` : ''}
    </div>`;
}

interface MapViewProps {
  panden: Pand[];
  selectedId: string | null;
  onSelectPand?: (pand: Pand) => void;
}

export function MapView({ panden, selectedId, onSelectPand }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pandenRef = useRef<Pand[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [ARNHEM_CENTER[1], ARNHEM_CENTER[0]],
      zoom: 13,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: toGeoJSON(pandenRef.current),
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 40,
        clusterProperties: {
          // Tel het aantal leegstaande panden (vacant + nietingebruik) per cluster
          leegstand: ['+', ['case',
            ['any',
              ['==', ['get', 'category'], 'vacant'],
              ['==', ['get', 'category'], 'nietingebruik'],
            ], 1, 0,
          ]],
        },
      });

      // Cluster circles — kleur op basis van leegstandspercentage
      // > 30% rood, > 10% oranje, anders groen
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'case',
            ['>', ['/', ['get', 'leegstand'], ['get', 'point_count']], 0.3], '#f0522a',
            ['>', ['/', ['get', 'leegstand'], ['get', 'point_count']], 0.1], '#ffd166',
            '#06d6a0',
          ],
          'circle-radius': ['step', ['get', 'point_count'], 14, 100, 18, 500, 22],
          'circle-opacity': 0.85,
        },
      });

      // Cluster labels
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Noto Sans Regular'],
          'text-size': 11,
        },
        paint: { 'text-color': '#fff' },
      });

      // Individual points
      map.addLayer({
        id: 'points',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': [
            'match', ['get', 'category'],
            'vacant', 5,
            'nietingebruik', 5,
            3,
          ],
          'circle-opacity': [
            'match', ['get', 'category'],
            'inuse', 0.35,
            0.9,
          ],
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-width': 0.5,
          'circle-stroke-opacity': 0.6,
        },
      });

      // Click: zoom into cluster
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0].properties.cluster_id as number;
        (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource)
          .getClusterExpansionZoom(clusterId)
          .then((zoom) => {
            map.easeTo({
              center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
              zoom,
            });
          });
      });

      // Click: show popup for individual point
      map.on('click', 'points', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const props = feature.properties as Record<string, unknown>;
        const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];

        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({ maxWidth: '300px' })
          .setLngLat(coords)
          .setHTML(popupHTML(props))
          .addTo(map);

        // Find matching pand and notify parent
        const pand = pandenRef.current.find((p) => p.id === props.id);
        if (pand) onSelectPand?.(pand);
      });

      map.on('mouseenter', 'points', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'points', () => { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onSelectPand]);

  // Update GeoJSON data when panden changes
  useEffect(() => {
    pandenRef.current = panden;
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined)?.setData(toGeoJSON(panden));
  }, [panden]);

  // Fly to selected pand
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const pand = pandenRef.current.find((p) => p.id === selectedId);
    if (!pand) return;
    mapRef.current.flyTo({ center: [pand.lng, pand.lat], zoom: 17, speed: 1.5 });
  }, [selectedId]);

  return <div ref={containerRef} className="h-full w-full" />;
}
