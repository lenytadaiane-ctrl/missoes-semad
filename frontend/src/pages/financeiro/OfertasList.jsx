import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ofertasApi } from '../../api/ofertas';
import { congregacoesApi } from '../../api/congregacoes';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { TipoLocalBadge } from '../../components/ui/Badge';
import { formatarMoeda, nomeMes } from '../../utils/formatters';
import { MESES, ANOS } from '../../utils/constants';

const anoAtual = new Date().getFullYear();
const mesAtual = new Date().getMonth() + 1;

function OfertaForm({ inicial, onClose }) {
  const qc = useQueryClient();
  const { data: congregacoes = [] } = useQuery({
    queryKey: ['congregacoes'],
    queryFn: () => congregacoesApi.listar({ limit: 500 }),
    select: (r) => r.data ?? r,
  });
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: inicial
      ? {
          congregacaoId: inicial.congregacaoId,
          mesReferencia: inicial.mesReferencia,
          anoReferencia: inicial.anoReferencia,
          valor: inicial.valor,
          observacao: inicial.observacao || '',
        }
      : { mesReferencia: mesAtual, anoReferencia: anoAtual },
  });
  const mutation = useMutation({
    mutationFn: (d) =>
      inicial ? ofertasApi.atualizar(inicial.id, d) : ofertasApi.criar(d),
    onSuccess: () => {
      qc.invalidateQueries(['ofertas']);
      toast.success(inicial ? 'Oferta atualizada!' : 'Oferta registrada!');
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div>
        <label className="label">Congregação *</label>
        <select
          {...register('congregacaoId', { required: 'Obrigatório' })}
          className="input"
          disabled={!!inicial}
        >
          <option value="">Selecione...</option>
          {congregacoes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome} — {c.tipo === 'CAPITAL' ? `Setor ${c.setor?.nome}` : 'Interior'}
            </option>
          ))}
        </select>
        {errors.congregacaoId && <p className="text-red-500 text-xs mt-1">{errors.congregacaoId.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Mês *</label>
          <select {...register('mesReferencia', { required: 'Obrigatório' })} className="input">
            {MESES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Ano *</label>
          <select {...register('anoReferencia', { required: 'Obrigatório' })} className="input">
            {ANOS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Valor (R$) *</label>
        <input
          {...register('valor', { required: 'Obrigatório', min: { value: 0.01, message: 'Valor deve ser maior que zero' } })}
          type="number"
          step="0.01"
          min="0"
          className="input"
          placeholder="0,00"
        />
        {errors.valor && <p className="text-red-500 text-xs mt-1">{errors.valor.message}</p>}
      </div>
      <div>
        <label className="label">Observação</label>
        <textarea {...register('observacao')} className="input" rows={2} placeholder="Opcional..." />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={mutation.isPending} className="btn-primary">
          {mutation.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

export default function OfertasList() {
  const { role } = useAuth();
  const isMaster = role === 'MASTER';
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [filtros, setFiltros] = useState({ mes: mesAtual, ano: anoAtual, tipo: '' });
  const qc = useQueryClient();

  const { data: resp = {}, isLoading } = useQuery({
    queryKey: ['ofertas', filtros],
    queryFn: () => ofertasApi.listar({ ...filtros, tipo: filtros.tipo || undefined, limit: 200 }),
  });
  const lista = resp.data || [];
  const soma = resp.soma || 0;

  const [sort, setSort] = useState({ key: 'congregacao', dir: 'asc' });

  const deleteMutation = useMutation({
    mutationFn: (id) => ofertasApi.remover(id),
    onSuccess: () => { qc.invalidateQueries(['ofertas']); toast.success('Oferta excluída!'); setConfirm(null); },
    onError: (e) => toast.error(e.message),
  });

  function handleSort(key) {
    setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  }

  const sortedLista = useMemo(() => {
    const mul = sort.dir === 'asc' ? 1 : -1;
    return [...lista].sort((a, b) => {
      switch (sort.key) {
        case 'congregacao':
          return mul * (a.congregacao?.nome ?? '').localeCompare(b.congregacao?.nome ?? '', 'pt-BR');
        case 'tipo':
          return mul * (a.congregacao?.tipo ?? '').localeCompare(b.congregacao?.tipo ?? '', 'pt-BR');
        case 'setor': {
          const na = a.congregacao?.setor?.nome ?? '';
          const nb = b.congregacao?.setor?.nome ?? '';
          if (!na && nb) return 1;
          if (na && !nb) return -1;
          return mul * na.localeCompare(nb, 'pt-BR');
        }
        case 'referencia':
          return mul * ((a.anoReferencia * 12 + a.mesReferencia) - (b.anoReferencia * 12 + b.mesReferencia));
        case 'valor':
          return mul * (Number(a.valor) - Number(b.valor));
        default:
          return 0;
      }
    });
  }, [lista, sort]);

  function SortHeader({ sortKey, children }) {
    const ativo = sort.key === sortKey;
    return (
      <th
        onClick={() => handleSort(sortKey)}
        className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap cursor-pointer select-none
          ${ativo ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {ativo
            ? <span className="text-blue-500">{sort.dir === 'asc' ? '↑' : '↓'}</span>
            : <span className="text-gray-300">↕</span>}
        </span>
      </th>
    );
  }

  return (
    <div>
      <PageHeader
        title="Ofertas Missionárias"
        subtitle={`${lista.length} registros — Total: ${formatarMoeda(soma)}`}
        actions={isMaster ? <button onClick={() => setModal({ mode: 'create' })} className="btn-primary">+ Nova Oferta</button> : null}
      />

      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          <label className="label">Mês</label>
          <select
            value={filtros.mes}
            onChange={(e) => setFiltros((f) => ({ ...f, mes: e.target.value }))}
            className="input w-36"
          >
            <option value="">Todos</option>
            {MESES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Ano</label>
          <select
            value={filtros.ano}
            onChange={(e) => setFiltros((f) => ({ ...f, ano: e.target.value }))}
            className="input w-28"
          >
            {ANOS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Tipo</label>
          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}
            className="input w-36"
          >
            <option value="">Todos</option>
            <option value="CAPITAL">Capital</option>
            <option value="INTERIOR">Interior</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200">
              <SortHeader sortKey="congregacao">Congregação</SortHeader>
              <SortHeader sortKey="tipo">Tipo</SortHeader>
              <SortHeader sortKey="setor">Setor</SortHeader>
              <SortHeader sortKey="referencia">Referência</SortHeader>
              <SortHeader sortKey="valor">Valor</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Obs</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-gray-400">Carregando...</td>
              </tr>
            ) : sortedLista.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-gray-400">Nenhuma oferta encontrada para o período.</td>
              </tr>
            ) : (
              sortedLista.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 py-3 text-gray-700">{row.congregacao?.nome ?? '—'}</td>
                  <td className="px-4 py-3"><TipoLocalBadge tipo={row.congregacao?.tipo} /></td>
                  <td className="px-4 py-3 text-gray-700">{row.congregacao?.setor?.nome ?? <span className="text-gray-400">—</span>}</td>
                  <td className="px-4 py-3 text-gray-700">{nomeMes(row.mesReferencia).slice(0, 3)}/{row.anoReferencia}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">{formatarMoeda(row.valor)}</td>
                  <td className="px-4 py-3 text-gray-500">{row.observacao || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3">
                    {isMaster && (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setModal({ mode: 'edit', item: row })} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">Editar</button>
                        <button onClick={() => setConfirm(row)} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">Excluir</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {lista.length > 0 && (
        <div className="mt-3 flex justify-end">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-2 text-sm font-semibold text-emerald-800">
            Total filtrado: {formatarMoeda(soma)}
          </div>
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Editar Oferta' : 'Registrar Oferta'}
      >
        {modal && <OfertaForm inicial={modal.item} onClose={() => setModal(null)} />}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => deleteMutation.mutate(confirm.id)}
        message={`Excluir a oferta de ${formatarMoeda(confirm?.valor)} de "${confirm?.congregacao?.nome}"?`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
