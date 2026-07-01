import { useState, useMemo } from 'react';

export function useSortable(data, defaultKey, defaultDir = 'asc') {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);

  function toggleSort(key) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sorted = useMemo(() => {
    if (!data?.length) return data || [];
    return [...data].sort((a, b) => {
      let va = resolveKey(a, sortKey);
      let vb = resolveKey(b, sortKey);
      if (va == null) va = sortDir === 'asc' ? '￿' : '';
      if (vb == null) vb = sortDir === 'asc' ? '￿' : '';
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb), 'pt-BR')
        : String(vb).localeCompare(String(va), 'pt-BR');
    });
  }, [data, sortKey, sortDir]);

  return { sorted, sortKey, sortDir, toggleSort };
}

function resolveKey(obj, key) {
  return key.split('.').reduce((o, k) => (o != null ? o[k] : null), obj);
}
