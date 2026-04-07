import { useState, useEffect, useCallback } from 'react';
import { fetchBAGPanden } from '../lib/bag-api';
import type { Pand, FunctieFilter, StatusFilter } from '../lib/types';

interface UsePandenReturn {
  allPanden: Pand[];
  filteredPanden: Pand[];
  loading: boolean;
  loadingMsg: string;
  error: string | null;
  functieFilter: FunctieFilter;
  statusFilter: StatusFilter;
  searchQuery: string;
  setFunctieFilter: (f: FunctieFilter) => void;
  setStatusFilter: (s: StatusFilter) => void;
  setSearchQuery: (q: string) => void;
}

export function usePanden(): UsePandenReturn {
  const [allPanden, setAllPanden] = useState<Pand[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Verblijfsobjecten ophalen via BAG / PDOK...');
  const [error, setError] = useState<string | null>(null);
  const [functieFilter, setFunctieFilter] = useState<FunctieFilter>('alle');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchBAGPanden(functieFilter, (msg) => {
      if (!cancelled) setLoadingMsg(msg);
    })
      .then((panden) => {
        if (!cancelled) {
          setAllPanden(panden);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setError('Fout bij laden. Controleer je internetverbinding en herlaad de pagina.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [functieFilter]);

  const handleSetStatusFilter = useCallback((s: StatusFilter) => {
    setStatusFilter((prev) => (prev === s ? null : s));
  }, []);

  const filteredPanden = allPanden.filter((p) => {
    if (statusFilter && p.category !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.adres.toLowerCase().includes(q) ||
        p.postcode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return {
    allPanden,
    filteredPanden,
    loading,
    loadingMsg,
    error,
    functieFilter,
    statusFilter,
    searchQuery,
    setFunctieFilter,
    setStatusFilter: handleSetStatusFilter,
    setSearchQuery,
  };
}
