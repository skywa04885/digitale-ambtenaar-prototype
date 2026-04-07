import { useState } from 'react';
import { Input } from './ui/input';
import { StatGrid } from './StatGrid';
import { Legend } from './Legend';
import { ResultsList } from './ResultsList';
import type { Pand, StatusFilter } from '../lib/types';

interface SidebarProps {
  allPanden: Pand[];
  filteredPanden: Pand[];
  statusFilter: StatusFilter;
  searchQuery: string;
  selectedId: string | null;
  onStatusChange: (s: StatusFilter) => void;
  onSearchChange: (q: string) => void;
  onSelectPand: (pand: Pand) => void;
}

export function Sidebar({
  allPanden,
  filteredPanden,
  statusFilter,
  searchQuery,
  selectedId,
  onStatusChange,
  onSearchChange,
  onSelectPand,
}: SidebarProps) {
  const [showMethodology, setShowMethodology] = useState(false);

  return (
    <aside className="w-[400px] flex flex-col overflow-hidden flex-shrink-0"
      style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border-color)' }}>

      {/* Stats */}
      <section className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="text-[10px] uppercase tracking-[1.5px] mb-3" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)' }}>
          Samenvatting
        </div>
        <StatGrid panden={filteredPanden} />
      </section>

      {/* Legend */}
      <section className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="text-[10px] uppercase tracking-[1.5px] mb-3" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)' }}>
          Legenda
        </div>
        <Legend panden={allPanden} statusFilter={statusFilter} onStatusChange={onStatusChange} />
      </section>

      {/* Search */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Zoek adres of straat..."
          className="text-[11px] h-9"
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border-color)',
            color: 'var(--text)',
            fontFamily: 'DM Mono, monospace',
          }}
        />
      </div>

      {/* Results */}
      <ResultsList
        panden={filteredPanden}
        selectedId={selectedId}
        onSelect={onSelectPand}
      />

      {/* Footer */}
      <div className="px-4 py-2 text-[9px] flex items-center gap-2" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
        Bron: BAG via PDOK — Kadaster &nbsp;|&nbsp;
        <button
          onClick={() => setShowMethodology((v) => !v)}
          className="underline cursor-pointer bg-transparent border-none p-0 text-[9px]"
          style={{ color: 'var(--brand)', fontFamily: 'DM Mono, monospace' }}
        >
          methode {showMethodology ? '▾' : '▸'}
        </button>
      </div>

      {showMethodology && (
        <div className="px-4 py-3 text-[11px] leading-relaxed" style={{ background: 'var(--surface2)', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text)' }}>Hoe wordt leegstand bepaald?</strong><br />
          De BAG registreert de <em>gebruiksstatus</em> van verblijfsobjecten. Panden met status{' '}
          <em>"verblijfsobject gevormd"</em> of <em>"verblijfsobject buiten gebruik"</em> worden als mogelijke
          leegstand beschouwd. Dit is een proxy-methode — echte leegstand vereist veldonderzoek.
        </div>
      )}
    </aside>
  );
}
