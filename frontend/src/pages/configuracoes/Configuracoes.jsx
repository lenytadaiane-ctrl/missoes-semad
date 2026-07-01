import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const fmt = (v) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const anoAtual = new Date().getFullYear();

/* ─── ABA: LISTAS PERSONALIZADAS ─── */
function GerenciarLista({ lista }) {
  const qc = useQueryClient();
  const [novoItem, setNovoItem] = useState('');
  const [itens, setItens] = useState(lista.itens);
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [dirty, setDirty] = useState(false);

  const salvar = useMutation({
    mutationFn: () => api.put(`/configuracoes/listas/${lista.chave}`, { itens }),
    onSuccess: () => { toast.success('Lista salva!'); setDirty(false); qc.invalidateQueries(['config-listas']); },
    onError: () => toast.error('Erro ao salvar'),
  });

  const resetar = useMutation({
    mutationFn: () => api.delete(`/configuracoes/listas/${lista.chave}`),
    onSuccess: () => { toast.success('Restaurado para padrão'); qc.invalidateQueries(['config-listas']); },
    onError: () => toast.error('Erro ao resetar'),
  });

  function adicionar() {
    const v = novoItem.trim();
    if (!v) return;
    if (itens.includes(v)) { toast.error('Item já existe'); return; }
    setItens(prev => [...prev, v]);
    setNovoItem('');
    setDirty(true);
  }

  function remover(idx) {
    setItens(prev => prev.filter((_, i) => i !== idx));
    setDirty(true);
  }

  function mover(idx, dir) {
    const novo = [...itens];
    const dest = idx + dir;
    if (dest < 0 || dest >= novo.length) return;
    [novo[idx], novo[dest]] = [novo[dest], novo[idx]];
    setItens(novo);
    setDirty(true);
  }

  function salvarEdicao(idx) {
    const v = editVal.trim();
    if (!v) return;
    const novo = [...itens];
    novo[idx] = v;
    setItens(novo);
    setEditIdx(null);
    setDirty(true);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">{lista.label}</h3>
          <p className="text-xs text-gray-400">chave: <code className="bg-gray-100 px-1 rounded">{lista.chave}</code>
            {lista.personalizada && <span className="ml-2 text-blue-600">• personalizada</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {lista.personalizada && (
            <button onClick={() => { if (confirm('Restaurar para os valores padrão?')) resetar.mutate(); }}
              className="text-xs text-gray-400 hover:text-red-500 underline">Restaurar padrão</button>
          )}
          {dirty && (
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              {salvar.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          )}
        </div>
      </div>

      {/* Lista de itens */}
      <ul className="space-y-1.5">
        {itens.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2 group">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => mover(idx, -1)} disabled={idx === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none">▲</button>
              <button onClick={() => mover(idx, 1)} disabled={idx === itens.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-20 text-xs leading-none">▼</button>
            </div>
            {editIdx === idx ? (
              <div className="flex-1 flex gap-2">
                <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') salvarEdicao(idx); if (e.key === 'Escape') setEditIdx(null); }}
                  className="flex-1 border border-blue-400 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                <button onClick={() => salvarEdicao(idx)} className="text-sm text-blue-600 font-medium">OK</button>
                <button onClick={() => setEditIdx(null)} className="text-sm text-gray-400">✕</button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-800">{item}</span>
                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditIdx(idx); setEditVal(item); }} className="text-xs text-blue-500 hover:underline">Editar</button>
                  <button onClick={() => remover(idx)} className="text-xs text-red-400 hover:underline">Remover</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Adicionar novo */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Novo item..."
          value={novoItem}
          onChange={e => setNovoItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && adicionar()}
        />
        <Button onClick={adicionar} disabled={!novoItem.trim()}>+ Adicionar</Button>
      </div>
    </div>
  );
}

function AbaListas() {
  const { data: listas = [], isLoading } = useQuery({
    queryKey: ['config-listas'],
    queryFn: () => api.get('/configuracoes/listas').then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Gerencie as opções que aparecem nos dropdowns dos formulários do sistema.
        Edite, reordene, adicione ou remova itens conforme necessário.
      </p>
      {listas.map(lista => <GerenciarLista key={lista.chave} lista={lista} />)}
    </div>
  );
}

/* ─── ABA: ENTRADA ANUAL ─── */
function AbaEntradaAnual() {
  const qc = useQueryClient();
  const [novoAno, setNovoAno] = useState(String(anoAtual));
  const [novoValor, setNovoValor] = useState('');
  const [novaObs, setNovaObs] = useState('');
  const [editId, setEditId] = useState(null);
  const [editValor, setEditValor] = useState('');
  const [editObs, setEditObs] = useState('');

  const { data: entradas = [], isLoading } = useQuery({
    queryKey: ['config-entradas'],
    queryFn: () => api.get('/configuracoes/entrada-anual').then(r => r.data),
  });

  const salvar = useMutation({
    mutationFn: (dados) => api.post('/configuracoes/entrada-anual', dados),
    onSuccess: () => { toast.success('Entrada salva!'); setNovoValor(''); setNovaObs(''); qc.invalidateQueries(['config-entradas']); qc.invalidateQueries(['dashboard']); },
    onError: () => toast.error('Erro ao salvar'),
  });

  const atualizar = useMutation({
    mutationFn: (dados) => api.post('/configuracoes/entrada-anual', dados),
    onSuccess: () => { toast.success('Atualizado!'); setEditId(null); qc.invalidateQueries(['config-entradas']); qc.invalidateQueries(['dashboard']); },
    onError: () => toast.error('Erro ao atualizar'),
  });

  const deletar = useMutation({
    mutationFn: (id) => api.delete(`/configuracoes/entrada-anual/${id}`),
    onSuccess: () => { toast.success('Excluído'); qc.invalidateQueries(['config-entradas']); qc.invalidateQueries(['dashboard']); },
    onError: () => toast.error('Erro ao excluir'),
  });

  const anosExistentes = new Set(entradas.map(e => e.ano));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Registre ou atualize os totais anuais de arrecadação. Esses valores aparecem no gráfico de crescimento anual no Dashboard.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ano</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Valor Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Observação</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-32">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={4} className="py-8 text-center text-gray-400">Carregando...</td></tr>
            ) : entradas.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-bold text-gray-800">{e.ano}</td>
                <td className="px-4 py-3 text-right">
                  {editId === e.id ? (
                    <input type="number" step="0.01" value={editValor} onChange={ev => setEditValor(ev.target.value)}
                      className="w-40 border border-blue-400 rounded-lg px-2 py-1 text-right text-sm focus:outline-none" />
                  ) : (
                    <span className="font-semibold text-gray-800">{fmt(e.valor)}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {editId === e.id ? (
                    <input value={editObs} onChange={ev => setEditObs(ev.target.value)}
                      className="w-full border border-blue-400 rounded-lg px-2 py-1 text-sm focus:outline-none" placeholder="Observação..." />
                  ) : (e.observacao || '—')}
                </td>
                <td className="px-4 py-3">
                  {editId === e.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => atualizar.mutate({ ano: e.ano, valor: editValor, observacao: editObs })}
                        className="text-sm text-blue-600 font-medium hover:underline">Salvar</button>
                      <button onClick={() => setEditId(null)} className="text-sm text-gray-400 hover:underline">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={() => { setEditId(e.id); setEditValor(String(e.valor)); setEditObs(e.observacao || ''); }}
                        className="text-sm text-blue-600 hover:underline">Editar</button>
                      <button onClick={() => { if (confirm(`Excluir entrada do ano ${e.ano}?`)) deletar.mutate(e.id); }}
                        className="text-sm text-red-500 hover:underline">Excluir</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Adicionar novo ano */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-700 mb-3">Adicionar / Atualizar Ano</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Ano</label>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={novoAno} onChange={e => setNovoAno(e.target.value)}>
              {Array.from({ length: 20 }, (_, i) => anoAtual - i + 2).map(a => (
                <option key={a} value={a}>{a}{anosExistentes.has(a) ? ' ✓' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Valor Total (R$)</label>
            <input type="number" step="0.01" placeholder="Ex: 1250000.00" value={novoValor} onChange={e => setNovoValor(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div className="flex-1 min-w-40">
            <label className="text-xs text-gray-500 block mb-1">Observação (opcional)</label>
            <input placeholder="Ex: Valor consolidado após auditoria" value={novaObs} onChange={e => setNovaObs(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <Button onClick={() => salvar.mutate({ ano: novoAno, valor: novoValor, observacao: novaObs })}
            disabled={!novoValor || salvar.isPending}>
            {anosExistentes.has(parseInt(novoAno)) ? 'Atualizar' : 'Adicionar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── PÁGINA PRINCIPAL ─── */
const ABAS = [
  { id: 'listas', label: 'Listas do Sistema', desc: 'Dropdowns e opções dos formulários' },
  { id: 'entrada', label: 'Entrada Anual', desc: 'Totais anuais de arrecadação' },
];

export default function Configuracoes() {
  const [aba, setAba] = useState('listas');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h1>
        <p className="text-sm text-gray-400 mt-0.5">Personalize opções sem precisar abrir código.</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aba === a.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'listas' && <AbaListas />}
      {aba === 'entrada' && <AbaEntradaAnual />}
    </div>
  );
}
