import type { Pand, StatusFilter } from '../lib/types';
import { STATUS_COLORS } from '../lib/constants';

const LEGEND_ITEMS: { status: StatusFilter; label: string; color: string }[] = [
  { status: 'vacant', label: 'Mogelijk leegstaand', color: STATUS_COLORS.vacant },
  { status: 'nietingebruik', label: 'Niet in gebruik', color: STATUS_COLORS.nietingebruik },
  { status: 'inuse', label: 'In gebruik', color: STATUS_COLORS.inuse },
  { status: 'unknown', label: 'Onbekend', color: '#4a4a6a' },
];

interface LegendProps {
  panden: Pand[];
  statusFilter: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
}

export function Legend({ panden, statusFilter, onStatusChange }: LegendProps) {
  const counts: Record<string, number> = {
    vacant: panden.filter((p) => p.category === 'vacant').length,
    nietingebruik: panden.filter((p) => p.category === 'nietingebruik').length,
    inuse: panden.filter((p) => p.category === 'inuse').length,
    unknown: panden.filter((p) => p.category === 'unknown').length,
  };

  return (
    <div className="flex flex-col gap-2">
      {LEGEND_ITEMS.map(({ status, label, color }) => (
        <div
          key={status}
          onClick={() => onStatusChange(status)}
          className="flex items-center gap-2.5 cursor-pointer px-2 py-1.5 rounded-md transition-colors"
          style={statusFilter === status ? { background: 'var(--surface2)' } : undefined}
          onMouseEnter={(e) => { if (statusFilter !== status) (e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)'; }}
          onMouseLeave={(e) => { if (statusFilter !== status) (e.currentTarget as HTMLDivElement).style.background = ''; }}
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: color, boxShadow: `0 0 6px ${color}` }}
          />
          <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{label}</span>
          <span className="ml-auto text-[10px]" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)' }}>
            {counts[status!]?.toLocaleString('nl') ?? '—'}
          </span>
        </div>
      ))}
    </div>
  );
}
