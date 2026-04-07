import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { MapView } from './components/MapView';
import { Sidebar } from './components/Sidebar';
import { LoadingOverlay } from './components/LoadingOverlay';
import { usePanden } from './hooks/usePanden';
import type { Pand, FunctieFilter, StatusFilter } from './lib/types';

export default function App() {
  const {
    allPanden,
    filteredPanden,
    loading,
    loadingMsg,
    error,
    functieFilter,
    statusFilter,
    searchQuery,
    setFunctieFilter,
    setStatusFilter,
    setSearchQuery,
  } = usePanden();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelectPand = useCallback((pand: Pand) => {
    setSelectedId(pand.id);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Header
        functieFilter={functieFilter}
        onFunctieChange={(f: FunctieFilter) => {
          setFunctieFilter(f);
          setSelectedId(null);
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative h-full">
          <MapView
            panden={filteredPanden}
            selectedId={selectedId}
            onSelectPand={handleSelectPand}
          />
          {(loading || error) && (
            <LoadingOverlay message={loadingMsg} error={error} />
          )}
        </div>

        <Sidebar
          allPanden={allPanden}
          filteredPanden={filteredPanden}
          statusFilter={statusFilter as StatusFilter}
          searchQuery={searchQuery}
          selectedId={selectedId}
          onStatusChange={setStatusFilter}
          onSearchChange={setSearchQuery}
          onSelectPand={handleSelectPand}
        />
      </div>
    </div>
  );
}
