import { useState, useRef } from 'react';

export default function FotoUpload({ currentFoto, onChange }) {
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  const fotoUrl = preview ?? (currentFoto ? `/${currentFoto}` : null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    onChange(file);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {fotoUrl ? (
        <img src={fotoUrl} alt="Foto" className="w-28 h-28 rounded-full object-cover border-4 border-blue-100 shadow" />
      ) : (
        <div className="w-28 h-28 rounded-full bg-gray-100 border-4 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} className="hidden" />
      <button type="button" onClick={() => inputRef.current?.click()} className="btn-secondary text-xs py-1.5">
        {currentFoto || preview ? 'Trocar foto' : 'Adicionar foto'}
      </button>
      <p className="text-xs text-gray-400">JPG, PNG ou WebP. Máx. 5 MB</p>
    </div>
  );
}
