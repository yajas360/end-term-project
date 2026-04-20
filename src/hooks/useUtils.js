import { useState, useEffect, useRef } from 'react';

/**
 * useLocalStorage — persists state in localStorage
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota exceeded or private mode
    }
  }, [key, value]);

  return [value, setValue];
}

/**
 * useDebounce — debounce any value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

/**
 * useToggle — simple boolean toggle
 */
export function useToggle(initial = false) {
  const [state, setState] = useState(initial);
  const toggle = () => setState((s) => !s);
  const setTrue = () => setState(true);
  const setFalse = () => setState(false);
  return [state, toggle, setTrue, setFalse];
}

/**
 * usePrevious — get the previous value of a state
 */

export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}
