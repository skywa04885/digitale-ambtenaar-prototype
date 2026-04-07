interface LoadingOverlayProps {
  message: string;
  error?: string | null;
}

export function LoadingOverlay({ message, error }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-[2000]"
      style={{ background: 'rgba(15,15,18,0.85)' }}>
      {!error && (
        <div className="w-10 h-10 rounded-full border-[3px] animate-spin"
          style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--brand)' }} />
      )}
      <div className="text-center" style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        {error ? (
          <span style={{ color: '#f0522a' }}>{error}</span>
        ) : (
          <>
            <strong style={{ color: 'var(--text)', display: 'block', fontSize: '14px', marginBottom: '4px' }}>
              Data laden...
            </strong>
            {message}
          </>
        )}
      </div>
    </div>
  );
}
