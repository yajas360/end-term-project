import { useState, useRef, useEffect, memo } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDrugSearch } from '../hooks/useDrugSearch';

/**
 * DrugSearchInput — autocomplete dropdown backed by FDA API
 * Props:
 *  onSelect(drugObj) — called when user picks a drug
 *  placeholder
 *  className
 */
const DrugSearchInput = memo(function DrugSearchInput({ onSelect, placeholder = 'Search drug name...', className = '' }) {
  const { query, setQuery, results, loading, error, clear } = useDrugSearch(400);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setOpen(results.length > 0 && focused);
  }, [results, focused]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (drug) => {
    onSelect(drug);
    clear();
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef} style={{ width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <MagnifyingGlassIcon style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          width: 16, height: 16, color: 'var(--neutral-400)', pointerEvents: 'none',
        }} />
        <input
          id="drug-search"
          className={`form-input ${className}`}
          style={{ paddingLeft: 38, paddingRight: query ? 38 : 14 }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {query && (
          <button
            onClick={clear}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--neutral-400)', cursor: 'pointer', display: 'flex',
            }}
          >
            <XMarkIcon style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="animate-scale-in" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--neutral-800)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 300, overflow: 'hidden',
          maxHeight: 280, overflowY: 'auto',
        }}>
          {loading && (
            <div style={{ padding: '12px 16px', color: 'var(--neutral-400)', fontSize: '0.875rem' }}>
              Searching FDA database...
            </div>
          )}
          {error && (
            <div style={{ padding: '12px 16px', color: 'var(--danger-400)', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          {results.map((drug) => (
            <button
              key={drug.id}
              onClick={() => handleSelect(drug)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 16px', cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background var(--transition-fast)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-shine)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div className="text-sm font-semibold text-white">{drug.brandName}</div>
              {drug.genericName && (
                <div className="text-xs text-muted">{drug.genericName} · {drug.route}</div>
              )}
              {drug.manufacturer && (
                <div className="text-xs" style={{ color: 'var(--neutral-500)' }}>{drug.manufacturer}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default DrugSearchInput;
