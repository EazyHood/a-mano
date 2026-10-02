import { useCallback, useEffect, useRef, useState } from 'react';
import type { Item } from './domain';

type Status = 'idle' | 'loading' | 'indexing' | 'ready' | 'searching' | 'error';
type Result = { id: string; score: number };
export function useSemanticSearch(items: Item[], query: string) {
  const [enabled, setEnabled] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState<number | null>(null);
  const [resultState, setResultState] = useState<{items:Result[];query:string;signature:string}|null>(null);
  const [error, setError] = useState<string | null>(null);
  const [readyVersion, setReadyVersion] = useState(-1);
  const worker = useRef<Worker | null>(null);
  const version = useRef(0);
  const requestId = useRef(0);
  const activeSearch = useRef<{id:number;query:string;signature:string}|null>(null);
  const serialized = JSON.stringify(items.map(i => ({ id: i.id, title: i.title, description: i.description, tags: i.tags })));
  const itemsRef = useRef(items); itemsRef.current = items;
  const queryRef = useRef(query); queryRef.current = query;
  const setResults = (_: null) => setResultState(null);

  useEffect(() => {
    if (!enabled) return;
    const instance = new Worker(new URL('./search.worker.ts', import.meta.url), { type: 'module' });
    worker.current = instance;
    setStatus('loading'); setError(null); setResults(null); setProgress(null);
    instance.onmessage = ({ data }) => {
      const active = activeSearch.current;
      if (data.type === 'progress') { setProgress(data.progress); return; }
      if (data.version !== version.current) return;
      if (data.type === 'indexing') setStatus('indexing');
      if (data.type === 'ready') { setStatus('ready'); setReadyVersion(data.version); setProgress(100); }
      if (data.type === 'results' && data.requestId === requestId.current && active && active.id === data.requestId && active.query === queryRef.current.trim()) {
        setResultState({items:data.results, query:active.query, signature:active.signature}); setStatus('ready');
      }
      if (data.type === 'error' && (data.requestId === undefined || data.requestId === requestId.current)) { setError(data.error); setStatus('error'); setResults(null); }
    };
    instance.onerror = () => { setError('La búsqueda inteligente no pudo iniciarse. Puedes reintentar o seguir buscando por palabras.'); setStatus('error'); setResults(null); };
    return () => { instance.terminate(); if (worker.current === instance) worker.current = null; };
  }, [enabled, generation]);

  useEffect(() => {
    if (!enabled || !worker.current) return;
    version.current += 1; requestId.current += 1;
    setReadyVersion(-1); setResults(null);
    setStatus(current => current === 'loading' ? current : 'indexing');
    worker.current.postMessage({ type: 'index', version: version.current, items: itemsRef.current });
    // Status updates must not trigger indexing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, generation, serialized]);

  useEffect(() => {
    const id = ++requestId.current;
    setResults(null);
    if (!enabled || readyVersion !== version.current) return;
    if (!query.trim()) { setStatus(current => current === 'searching' ? 'ready' : current); return; }
    const timeout = setTimeout(() => {
      if (!worker.current) return;
      setStatus('searching');
      activeSearch.current = {id,query:query.trim(),signature:serialized};
      worker.current.postMessage({ type: 'search', version: version.current, requestId: id, query: query.trim() });
    }, 280);
    return () => { clearTimeout(timeout); };
  }, [enabled, readyVersion, query]);

  const enable = useCallback(() => { setEnabled(true); setGeneration(v => v + 1); }, []);
  const disable = useCallback(() => { setEnabled(false); setStatus('idle'); setResults(null); setError(null); setReadyVersion(-1); }, []);
  const results = resultState?.query === query.trim() && resultState.signature === serialized ? resultState.items : null;
  return { status, progress, results, error, enable, disable };
}
