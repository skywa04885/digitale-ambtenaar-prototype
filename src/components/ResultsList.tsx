import { ScrollArea } from './ui/scroll-area';
import { STATUS_COLORS } from '../lib/constants';
import type { Pand } from '../lib/types';

interface ResultsListProps {
  panden: Pand[];
  selectedId: string | null;
  onSelect: (pand: Pand) => void;
}

export function ResultsList({ panden, selectedId, onSelect }: ResultsListProps) {
  const vacantPanden = panden
    .filter((p) => p.category === 'vacant' || p.category === 'nietingebruik')
    .slice(0, 100);

  if (vacantPanden.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {panden.length === 0
            ? 'Klik op een marker op de kaart, of gebruik de zoekbalk om panden te vinden.'
            : 'Geen leegstaande panden gevonden in selectie.'}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2">
        <div className="px-3 pb-1 text-[9px] uppercase tracking-widest" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)' }}>
          Leegstaande panden ({vacantPanden.length})
        </div>
        {vacantPanden.map((pand) => {
          const color = STATUS_COLORS[pand.category];
          const tagLabel = pand.category === 'vacant' ? 'Leeg' : 'Niet in gebruik';
          const isSelected = selectedId === pand.id;

          return (
            <div
              key={pand.id}
              onClick={() => onSelect(pand)}
              className="px-3 py-2.5 rounded-lg mb-1 cursor-pointer transition-all"
              style={{
                border: `1px solid ${isSelected ? 'var(--brand)' : 'transparent'}`,
                background: isSelected ? 'var(--surface2)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.background = 'var(--surface2)';
                  el.style.borderColor = 'var(--border-color)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.background = 'transparent';
                  el.style.borderColor = 'transparent';
                }
              }}
            >
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                {pand.adres || 'Onbekend adres'}
              </div>
              <div className="flex gap-2 flex-wrap text-[10px]" style={{ fontFamily: 'DM Mono, monospace' }}>
                <span style={{ color }}>● {tagLabel}</span>
                {pand.gebruiksdoel && (
                  <span style={{ color: 'var(--text-muted)' }}>{pand.gebruiksdoel.split(',')[0]}</span>
                )}
                {pand.oppervlakte && (
                  <span style={{ color: 'var(--text-muted)' }}>{pand.oppervlakte}m²</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
