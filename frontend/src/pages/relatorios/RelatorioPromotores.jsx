import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import SortTh from '../../components/ui/SortTh';
import { useSortable } from '../../hooks/useSortable';

async function capturarCanvas(ref) {
  const el = ref.current;
  const prevDisplay = el.style.display, prevWidth = el.style.width;
  el.style.display = 'inline-block'; el.style.width = 'auto';
  const tables = el.querySelectorAll('table'); const tw = [];
  tables.forEach(t => { tw.push(t.style.minWidth); t.style.minWidth = 'unset'; });
  const ov = el.querySelectorAll('.overflow-x-auto'); const ow = [];
  ov.forEach(o => { ow.push(o.style.width); o.style.width = 'fit-content'; });
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  el.style.display = prevDisplay; el.style.width = prevWidth;
  tables.forEach((t, i) => { t.style.minWidth = tw[i]; });
  ov.forEach((o, i) => { o.style.width = ow[i]; });
  return canvas;
}
async function exportarImagem(ref, nome = 'relatorio.png') {
  if (!ref.current) return;
  const c = await capturarCanvas(ref);
  const a = document.createElement('a'); a.download = nome; a.href = c.toDataURL('image/png'); a.click();
}
async function exportarPDF(ref, nome = 'relatorio.pdf') {
  if (!ref.current) return;
  const c = await capturarCanvas(ref);
  const pdf = new jsPDF({ orientation: c.width > c.height ? 'landscape' : 'portrait', unit: 'px', format: [c.width / 2, c.height / 2] });
  pdf.addImage(c.toDataURL('image/png'), 'PNG', 0, 0, c.width / 2, c.height / 2);
  pdf.save(nome);
}
function BotoesExportar({ refArea, prefixo }) {
  const [car, setCar] = useState(false);
  const run = async (fn, ext) => { setCar(ext); try { await fn(refArea, `${prefixo}.${ext}`); } finally { setCar(false); } };
  return (<>
    <button onClick={() => run(exportarImagem, 'png')} disabled={!!car} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors">{car === 'png' ? '...' : '📷'} Imagem</button>
    <button onClick={() => run(exportarPDF, 'pdf')} disabled={!!car} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors">{car === 'pdf' ? '...' : '📄'} PDF</button>
  </>);
}

function Avatar({ foto, nome }) {
  if (foto) return <img src={`/${foto}`} alt={nome} className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0" />;
  return (
    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold shrink-0">
      {nome?.charAt(0) || '?'}
    </div>
  );
}

export default function RelatorioPromotores() {
  const [filtroSetor, setFiltroSetor] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [mostrarFoto, setMostrarFoto] = useState(true);
  const areaRef = useRef(null);

  const { data: raw = [], isLoading } = useQuery({
    queryKey: ['rel-promotores'],
    queryFn: () => api.get('/promotores-missoes').then(r => r.data),
  });
  const { data: setores = [] } = useQuery({ queryKey: ['setores'], queryFn: () => api.get('/setores').then(r => r.data) });

  const filtrado = useMemo(() => {
    let d = raw;
    if (filtroSetor) d = d.filter(p => String(p.setorId) === filtroSetor);
    if (filtroBusca) d = d.filter(p => p.pessoa?.nome?.toLowerCase().includes(filtroBusca.toLowerCase()));
    return d;
  }, [raw, filtroSetor, filtroBusca]);

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtrado, 'pessoa.nome');
  const thProps = { current: sortKey, dir: sortDir, onSort: toggleSort };

  return (
    <div ref={areaRef} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <h1 className="text-2xl font-bold text-gray-800">Relatório de Promotores de Missões</h1>
        <div className="flex items-center gap-2">
          <BotoesExportar refArea={areaRef} prefixo="relatorio-promotores" />
          <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 no-print">
        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48" placeholder="Buscar por nome..." value={filtroBusca} onChange={e => setFiltroBusca(e.target.value)} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filtroSetor} onChange={e => setFiltroSetor(e.target.value)}>
          <option value="">Todos os setores</option>
          {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer border border-gray-300 rounded-lg px-3 py-2">
          <input type="checkbox" checked={mostrarFoto} onChange={e => setMostrarFoto(e.target.checked)} className="accent-blue-600" />
          Mostrar foto
        </label>
      </div>

      <div className="text-sm text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        Total: <strong>{sorted.length}</strong> promotor(es)
      </div>

      <div className="print-area bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {mostrarFoto && <th className="px-4 py-3 w-12" />}
              <SortTh label="Nome" sortKey="pessoa.nome" {...thProps} />
              <SortTh label="Setor" sortKey="setor.nome" {...thProps} />
              <SortTh label="Telefone" sortKey="pessoa.telefone" {...thProps} />
              <SortTh label="E-mail" sortKey="pessoa.email" {...thProps} />
              <SortTh label="CPF" sortKey="pessoa.cpf" {...thProps} />
              <SortTh label="Cidade" sortKey="pessoa.cidade" {...thProps} />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={7} className="py-8 text-center text-gray-400">Carregando...</td></tr>
            ) : sorted.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 align-middle">
                {mostrarFoto && <td className="px-3 py-2"><Avatar foto={p.pessoa?.foto} nome={p.pessoa?.nome} /></td>}
                <td className="px-4 py-2.5 font-medium text-gray-800">{p.pessoa?.nome}</td>
                <td className="px-4 py-2.5 text-gray-600">{p.setor?.nome || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{p.pessoa?.telefone || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{p.pessoa?.email || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{p.pessoa?.cpf || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{p.pessoa?.cidade || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 text-xs text-gray-400 border-t">{sorted.length} promotor(es)</div>
      </div>
    </div>
  );
}
