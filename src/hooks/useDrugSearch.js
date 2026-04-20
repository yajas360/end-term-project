import { useState, useEffect, useRef, useCallback } from 'react';
import { searchDrug } from '../services/fdaApi';

/**
 * useDrugSearch — debounced FDA drug search
 * Returns { results, loading, error, query, setQuery, clear }
 */
export function useDrugSearch(debounceMs = 500) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const res = await searchDrug(query);
        setResults(res);
      } catch (err) {
        setError('Failed to search drug database');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError('');
  }, []);

  return { query, setQuery, results, loading, error, clear };
}
