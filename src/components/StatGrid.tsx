import type { Pand } from '../lib/types';

interface Stats {
  totaal: number;
  leeg: number;
  niet: number;
  pct: string;
}

function calcStats(panden: Pand[]): Stats {
  const totaal = panden.length;
  const leeg = panden.filter((p) => p.category === 'vacant').length;
  const niet = panden.filter((p) => p.category === 'nietingebruik').length;
  const pct = totaal > 0 ? ((leeg + niet) / totaal * 100).toFixed(1) + '%' : '—';
  return { totaal, leeg, niet, pct };
}

interface StatCardProps {
  value: string | number;
  label: string;
  color?: string;
}

function StatCard({ value, label, color }: StatCardProps) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--surface2)', border: '1px solid var(--border-color)' }}>
      <div className="text-2xl font-extrabold leading-none mb-1" style={{ color: color || 'var(--text)' }}>
        {typeof value === 'number' ? value.toLocaleString('nl') : value}
      </div>
      <div className="text-[9px] uppercase tracking-[0.8px]" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)' }}>
        {label}
      </div>
    </div>
  );
}

interface StatGridProps {
  panden: Pand[];
}

export function StatGrid({ panden }: StatGridProps) {
  const { totaal, leeg, niet, pct } = calcStats(panden);
  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard value={totaal} label="Totaal panden" />
      <StatCard value={leeg} label="Mogelijk leegstaand" color="var(--brand)" />
      <StatCard value={pct} label="Leegstandsperc." color="#ffd166" />
      <StatCard value={niet} label="Niet in gebruik" color="#a855f7" />
    </div>
  );
}
