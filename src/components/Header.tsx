import { Button } from './ui/button';
import { FUNCTIE_OPTIONS } from '../lib/constants';
import type { FunctieFilter } from '../lib/types';

interface HeaderProps {
  functieFilter: FunctieFilter;
  onFunctieChange: (f: FunctieFilter) => void;
}

export function Header({ functieFilter, onFunctieChange }: HeaderProps) {
  return (
    <header className="flex items-center gap-4 px-5 py-3 flex-shrink-0 z-[1000]"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md flex items-center justify-center text-base"
          style={{ background: 'var(--brand)' }}>
          📍
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">
            Leegstand <span style={{ color: 'var(--brand)' }}>Arnhem</span>
          </h1>
          <div className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)' }}>
            BAG · PDOK · Open Data
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px]"
        style={{ background: 'rgba(240,82,42,0.15)', border: '1px solid rgba(240,82,42,0.3)', fontFamily: 'DM Mono, monospace', color: 'var(--brand)' }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--brand)' }} />
        Live data
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="text-[10px] uppercase tracking-widest mr-1"
          style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)' }}>
          Functie:
        </span>
        <div className="flex gap-1.5">
          {FUNCTIE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant="ghost"
              size="sm"
              onClick={() => onFunctieChange(opt.value as FunctieFilter)}
              className="rounded-full h-7 px-3 text-[11px] transition-all"
              style={
                functieFilter === opt.value
                  ? { background: 'var(--brand)', borderColor: 'var(--brand)', color: 'white', fontFamily: 'DM Mono, monospace' }
                  : { border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }
              }
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </header>
  );
}
