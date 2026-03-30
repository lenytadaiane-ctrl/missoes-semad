import { useState, useEffect } from 'react';

export default function SearchInput({ value, onChange, placeholder = 'Buscar...', className = '' }) {
  const [local, setLocal] = useState(value || '');

  useEffect(() => {
    const t = setTimeout(() => onChange(local), 350);
    return () => clearTimeout(t);
  }, [local]);

  useEffect(() => { setLocal(value || ''); }, [value]);

  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="input pl-9"
      />
    </div>
  );
}
