import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtData = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : null;
const fmtDataHora = (d) => d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : null;
const fmtValor = (v) => v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null;
const diasAtras = (d) => {
  if (!d) return null;
  const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
  return diff === 0 ? 'hoje' : diff === 1 ? 'ontem' : `há ${diff} dias`;
};

function Campo({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{value || <span className="text-gray-300">—</span>}</p>
    </div>
  );
}
function Secao({ title, children, cols = 3 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">{title}</h3>
      <div className={`grid sm:grid-cols-2 lg:grid-cols-${cols} gap-4`}>{children}</div>
    </div>
  );
}

const TIPO_INTERACAO = {
  VISITA_MATRIZ: { label: 'Visita à Matriz', icon: '🏛️', cor: 'bg-blue-100 text-blue-700' },
  LIGACAO:       { label: 'Ligação',          icon: '📞', cor: 'bg-green-100 text-green-700' },
  WHATSAPP:      { label: 'WhatsApp',         icon: '💬', cor: 'bg-emerald-100 text-emerald-700' },
  EMAIL:         { label: 'E-mail',           icon: '📧', cor: 'bg-purple-100 text-purple-700' },
  VISITA_CAMPO:  { label: 'Visita ao Campo',  icon: '✈️', cor: 'bg-amber-100 text-amber-700' },
  ORACAO:        { label: 'Pedido de Oração', icon: '🙏', cor: 'bg-pink-100 text-pink-700' },
  OUTRO:         { label: 'Outro',            icon: '📝', cor: 'bg-gray-100 text-gray-700' },
};
const TIPO_MARCO = {
  TEMPLO:        { label: 'Templo construído/inaugurado', icon: '⛪' },
  PONTO_PREGACAO:{ label: 'Ponto de pregação aberto',     icon: '📍' },
  BATISMO:       { label: 'Batismos realizados',           icon: '💧' },
  CELULA:        { label: 'Célula/grupo aberto',           icon: '👥' },
  OBRA:          { label: 'Obra iniciada/concluída',       icon: '🔨' },
  IMPACTO:       { label: 'Impacto comunitário',           icon: '🌟' },
  OUTRO:         { label: 'Outro marco',                   icon: '🏆' },
};
const SITUACAO_CAMPO = {
  CRESCENDO:     { label: 'Crescendo',      cor: 'bg-green-100 text-green-700' },
  ESTAVEL:       { label: 'Estável',        cor: 'bg-blue-100 text-blue-700' },
  DIFICULDADES:  { label: 'Dificuldades',   cor: 'bg-amber-100 text-amber-700' },
  PRECISA_APOIO: { label: 'Precisa apoio',  cor: 'bg-orange-100 text-orange-700' },
  PARADO:        { label: 'Parado',         cor: 'bg-red-100 text-red-700' },
};
const MESES = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ── Aba Dados ─────────────────────────────────────────────────────────────────
function TabDados({ m }) {
  const p = m.pessoa || {};
  return (
    <div className="space-y-4">
      <Secao title="Dados Missionários">
        <Campo label="Campo Missionário" value={m.campoMissionario} />
        <Campo label="Data de Envio" value={fmtData(m.dataEnvio)} />
        <Campo label="Status" value={m.status} />
        <Campo label="Base Missionária" value={m.baseMissionaria?.nome} />
        <Campo label="Coordenador" value={m.coordenador?.pessoa?.nome} />
      </Secao>
      <Secao title="Dados Pessoais">
        <Campo label="CPF" value={p.cpf} /><Campo label="RG" value={p.rg} />
        <Campo label="Data de Nascimento" value={fmtData(p.dataNascimento)} />
        <Campo label="Sexo" value={p.sexo === 'M' ? 'Masculino' : p.sexo === 'F' ? 'Feminino' : p.sexo} />
        <Campo label="Estado Civil" value={p.estadoCivil} />
        <Campo label="Nacionalidade" value={p.nacionalidade} />
        <Campo label="Naturalidade" value={p.naturalidade} />
        <Campo label="Grau de Instrução" value={p.grauInstrucao} />
        <Campo label="Profissão" value={p.profissao} />
        <Campo label="Origem Religiosa" value={p.origemReligiosa} />
        <Campo label="Tipo Sanguíneo" value={p.tipoSanguineo} />
      </Secao>
      <Secao title="Contato & Endereço">
        <Campo label="Telefone" value={p.telefone} /><Campo label="E-mail" value={p.email} />
        <Campo label="Endereço" value={p.endereco} /><Campo label="CEP" value={p.cep} />
        <Campo label="Cidade" value={p.cidade} /><Campo label="Estado" value={p.estado} />
      </Secao>
      <Secao title="Família">
        <Campo label="Nome do Pai" value={p.nomePai} />
        <Campo label="Nome da Mãe" value={p.nomeMae} />
        <Campo label="Nome do Cônjuge" value={p.nomeConjuge} />
      </Secao>
      {m.dependentes?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Dependentes</h3>
          <div className="divide-y divide-gray-100">
            {m.dependentes.map(dep => (
              <div key={dep.id} className="py-3 flex items-center justify-between">
                <div><p className="text-sm font-medium text-gray-800">{dep.pessoa?.nome}</p>
                  <p className="text-xs text-gray-400">{dep.parentesco}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {m.supervisionados?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Supervisionados</h3>
          <div className="space-y-2">
            {m.supervisionados.map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <p className="text-sm text-gray-800">{s.pessoa?.nome}</p><Badge text={s.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Aba Campo ─────────────────────────────────────────────────────────────────
function TabCampo({ missionarioId }) {
  const qc = useQueryClient();
  const { data: campo = {}, isLoading } = useQuery({
    queryKey: ['campo', missionarioId],
    queryFn: () => api.get(`/missionarios/${missionarioId}/acompanhamento/campo`).then(r => r.data),
  });
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ values: campo });

  const salvar = async (data) => {
    try {
      await api.put(`/missionarios/${missionarioId}/acompanhamento/campo`, data);
      toast.success('Campo salvo!');
      qc.invalidateQueries(['campo', missionarioId]);
    } catch (e) { toast.error(e.message); }
  };

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>;

  const situacaoAtual = SITUACAO_CAMPO[campo.situacao];

  return (
    <form onSubmit={handleSubmit(salvar)} className="space-y-4">
      {campo.situacao && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${situacaoAtual?.cor}`}>
          <span>Situação atual do campo:</span>
          <span>{situacaoAtual?.label}</span>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Localização</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div><label className="text-xs text-gray-500 block mb-1">País</label>
            <input {...register('pais')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Cidade</label>
            <input {...register('cidade')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Estado/Região</label>
            <input {...register('estado')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Trabalho Missionário</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div><label className="text-xs text-gray-500 block mb-1">Tipo de Área</label>
            <select {...register('tipoArea')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
              <option value="">Selecione</option>
              {['URBANA','RURAL','INDIGENA','QUILOMBOLA','OUTRO'].map(v => <option key={v} value={v}>{v}</option>)}
            </select></div>
          <div><label className="text-xs text-gray-500 block mb-1">Tipo de Reuniões</label>
            <select {...register('tipoReunioes')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
              <option value="">Selecione</option>
              {['CASA','SALAO','TEMPLO','AO_AR_LIVRE','MISTO'].map(v => <option key={v} value={v}>{v}</option>)}
            </select></div>
          <div><label className="text-xs text-gray-500 block mb-1">Situação do Campo</label>
            <select {...register('situacao')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
              {Object.entries(SITUACAO_CAMPO).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
            </select></div>
          <div><label className="text-xs text-gray-500 block mb-1">Pessoas alcançadas (est.)</label>
            <input type="number" {...register('qtdPessoas')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" {...register('temTemplo')} className="rounded" /> Possui templo próprio
          </label>
          {campo.temTemplo && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Capacidade:</label>
              <input type="number" {...register('capacidade')} className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm" />
            </div>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-2">Públicos atendidos</label>
          <div className="flex flex-wrap gap-3">
            {['CRIANCAS','ADOLESCENTES','ADULTOS','IDOSOS'].map(pub => (
              <label key={pub} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" value={pub}
                  defaultChecked={(campo.publicosAtendidos || []).includes(pub)}
                  {...register('publicosAtendidos')} className="rounded" /> {pub.charAt(0) + pub.slice(1).toLowerCase()}
              </label>
            ))}
          </div>
        </div>
        <div><label className="text-xs text-gray-500 block mb-1">Início do trabalho neste campo</label>
          <input type="date" {...register('dataInicio')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
        <div><label className="text-xs text-gray-500 block mb-1">Descrição geral do campo</label>
          <textarea rows={3} {...register('descricao')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" placeholder="Descreva o contexto, desafios, conquistas..." /></div>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg">
          {isSubmitting ? 'Salvando...' : 'Salvar Campo'}
        </button>
      </div>
    </form>
  );
}

// ── Aba Contatos ──────────────────────────────────────────────────────────────
function TabContatos({ missionarioId }) {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['interacoes', missionarioId],
    queryFn: () => api.get(`/missionarios/${missionarioId}/acompanhamento/interacoes`).then(r => r.data),
  });

  function openNew() { setEditItem(null); reset({ data: new Date().toISOString().slice(0, 10) }); setModal(true); }
  function openEdit(item) { setEditItem(item); reset({ ...item, data: item.data?.slice(0, 10) }); setModal(true); }

  async function onSubmit(d) {
    try {
      if (editItem) await api.put(`/missionarios/${missionarioId}/acompanhamento/interacoes/${editItem.id}`, d);
      else await api.post(`/missionarios/${missionarioId}/acompanhamento/interacoes`, d);
      toast.success(editItem ? 'Atualizado!' : 'Contato registrado!');
      setModal(false);
      qc.invalidateQueries(['interacoes', missionarioId]);
    } catch (e) { toast.error(e.message); }
  }

  async function deletar(id) {
    if (!confirm('Excluir este contato?')) return;
    try {
      await api.delete(`/missionarios/${missionarioId}/acompanhamento/interacoes/${id}`);
      toast.success('Excluído');
      qc.invalidateQueries(['interacoes', missionarioId]);
    } catch (e) { toast.error(e.message); }
  }

  const itens = data?.itens || [];
  const ultimoContato = itens[0]?.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {ultimoContato
            ? <p className="text-sm text-gray-500">Último contato: <span className="font-semibold text-gray-800">{diasAtras(ultimoContato)}</span> ({fmtData(ultimoContato)})</p>
            : <p className="text-sm text-amber-600 font-medium">⚠️ Nenhum contato registrado ainda</p>
          }
        </div>
        <Button onClick={openNew}>+ Registrar Contato</Button>
      </div>

      {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-3">
            {itens.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhum contato registrado</p>}
            {itens.map(item => {
              const tipo = TIPO_INTERACAO[item.tipo] || TIPO_INTERACAO.OUTRO;
              return (
                <div key={item.id} className="relative pl-14">
                  <div className={`absolute left-4 top-3 w-5 h-5 rounded-full flex items-center justify-center text-xs ${tipo.cor} border-2 border-white shadow`}>
                    {tipo.icon}
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipo.cor}`}>{tipo.label}</span>
                        <span className="text-xs text-gray-400">{fmtData(item.data)}</span>
                        {item.registradoPor && <span className="text-xs text-gray-300">por {item.registradoPor}</span>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEdit(item)} className="text-xs text-blue-500 hover:underline">Editar</button>
                        <button onClick={() => deletar(item.id)} className="text-xs text-red-400 hover:underline ml-1">Excluir</button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{item.descricao}</p>
                    {item.observacao && <p className="text-xs text-gray-400 mt-1 italic">{item.observacao}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editItem ? 'Editar Contato' : 'Registrar Contato'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 block mb-1">Tipo *</label>
              <select required {...register('tipo')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                <option value="">Selecione</option>
                {Object.entries(TIPO_INTERACAO).map(([v, t]) => <option key={v} value={v}>{t.icon} {t.label}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 block mb-1">Data *</label>
              <input type="date" required {...register('data')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
          </div>
          <div><label className="text-xs text-gray-500 block mb-1">Descrição / Resumo *</label>
            <textarea required rows={3} {...register('descricao')} placeholder="O que foi conversado, solicitado, decidido..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Observação interna</label>
            <input {...register('observacao')} placeholder="Observações adicionais (opcional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" /></div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Aba Relatórios ────────────────────────────────────────────────────────────
function TabRelatorios({ missionarioId }) {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const anoAtual = new Date().getFullYear();

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ['relatorios', missionarioId],
    queryFn: () => api.get(`/missionarios/${missionarioId}/acompanhamento/relatorios`).then(r => r.data),
  });

  function openNew() { setEditItem(null); reset({ anoRef: anoAtual, tipo: 'MENSAL', status: 'PENDENTE', mesRef: new Date().getMonth() + 1 }); setModal(true); }
  function openEdit(item) { setEditItem(item); reset({ ...item, dataEnvio: item.dataEnvio?.slice(0,10), dataRecebimento: item.dataRecebimento?.slice(0,10) }); setModal(true); }

  async function onSubmit(d) {
    try {
      if (editItem) await api.put(`/missionarios/${missionarioId}/acompanhamento/relatorios/${editItem.id}`, d);
      else await api.post(`/missionarios/${missionarioId}/acompanhamento/relatorios`, d);
      toast.success('Salvo!'); setModal(false);
      qc.invalidateQueries(['relatorios', missionarioId]);
    } catch (e) { toast.error(e.message); }
  }

  async function deletar(id) {
    if (!confirm('Excluir?')) return;
    try { await api.delete(`/missionarios/${missionarioId}/acompanhamento/relatorios/${id}`); toast.success('Excluído'); qc.invalidateQueries(['relatorios', missionarioId]); }
    catch (e) { toast.error(e.message); }
  }

  const statusCor = { PENDENTE: 'bg-amber-100 text-amber-700', RECEBIDO: 'bg-blue-100 text-blue-700', REVISADO: 'bg-green-100 text-green-700' };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{itens.length} relatório(s) registrado(s)</p>
        <Button onClick={openNew}>+ Registrar Relatório</Button>
      </div>
      {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Período</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Envio</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ações</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {itens.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">Nenhum relatório registrado</td></tr>}
              {itens.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.mesRef ? `${MESES[item.mesRef]}/${item.anoRef}` : `${item.anoRef}`}</td>
                  <td className="px-4 py-3">{item.tipo}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCor[item.status] || ''}`}>{item.status}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{fmtData(item.dataEnvio) || '—'}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(item)} className="text-xs text-blue-500 hover:underline">Editar</button>
                    <button onClick={() => deletar(item.id)} className="text-xs text-red-400 hover:underline">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editItem ? 'Editar Relatório' : 'Registrar Relatório'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-gray-500 block mb-1">Tipo *</label>
              <select required {...register('tipo')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {['MENSAL','SEMESTRAL','ANUAL','ESPECIAL'].map(v => <option key={v} value={v}>{v}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 block mb-1">Mês ref.</label>
              <select {...register('mesRef')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">—</option>
                {MESES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 block mb-1">Ano ref. *</label>
              <input type="number" required {...register('anoRef')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-gray-500 block mb-1">Status</label>
              <select {...register('status')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {['PENDENTE','RECEBIDO','REVISADO'].map(v => <option key={v} value={v}>{v}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 block mb-1">Data envio</label>
              <input type="date" {...register('dataEnvio')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Data recebimento</label>
              <input type="date" {...register('dataRecebimento')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="text-xs text-gray-500 block mb-1">Conteúdo / resumo</label>
            <textarea rows={3} {...register('conteudo')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Observação</label>
            <input {...register('observacao')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Aba Marcos ────────────────────────────────────────────────────────────────
function TabMarcos({ missionarioId }) {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ['marcos', missionarioId],
    queryFn: () => api.get(`/missionarios/${missionarioId}/acompanhamento/marcos`).then(r => r.data),
  });

  async function onSubmit(d) {
    try {
      await api.post(`/missionarios/${missionarioId}/acompanhamento/marcos`, d);
      toast.success('Marco registrado!'); setModal(false); reset();
      qc.invalidateQueries(['marcos', missionarioId]);
    } catch (e) { toast.error(e.message); }
  }

  async function deletar(id) {
    if (!confirm('Excluir este marco?')) return;
    try { await api.delete(`/missionarios/${missionarioId}/acompanhamento/marcos/${id}`); toast.success('Excluído'); qc.invalidateQueries(['marcos', missionarioId]); }
    catch (e) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{itens.length} marco(s) registrado(s)</p>
        <Button onClick={() => { reset({ data: new Date().toISOString().slice(0,10) }); setModal(true); }}>+ Registrar Marco</Button>
      </div>
      {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="space-y-3">
          {itens.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhum marco registrado</p>}
          {itens.map(item => {
            const tipo = TIPO_MARCO[item.tipo] || TIPO_MARCO.OUTRO;
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex gap-4">
                <div className="text-2xl shrink-0">{tipo.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-400">{tipo.label} · {fmtData(item.data)}</p>
                      <p className="font-semibold text-gray-800">{item.titulo}</p>
                    </div>
                    <button onClick={() => deletar(item.id)} className="text-xs text-red-400 hover:underline shrink-0">Excluir</button>
                  </div>
                  {item.descricao && <p className="text-sm text-gray-600 mt-1">{item.descricao}</p>}
                  {item.impacto && <p className="text-xs text-emerald-600 mt-1 font-medium">🌟 {item.impacto}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Registrar Marco da Missão">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 block mb-1">Tipo *</label>
              <select required {...register('tipo')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Selecione</option>
                {Object.entries(TIPO_MARCO).map(([v, t]) => <option key={v} value={v}>{t.icon} {t.label}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 block mb-1">Data *</label>
              <input type="date" required {...register('data')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="text-xs text-gray-500 block mb-1">Título *</label>
            <input required {...register('titulo')} placeholder="Ex: Inauguração do templo de Tacaratu" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Descrição</label>
            <textarea rows={2} {...register('descricao')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Impacto na comunidade</label>
            <input {...register('impacto')} placeholder="O que isso gerou para a comunidade local?" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Aba Apoio ─────────────────────────────────────────────────────────────────
function TabApoio({ missionarioId }) {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ['ajudas', missionarioId],
    queryFn: () => api.get(`/missionarios/${missionarioId}/acompanhamento/ajudas`).then(r => r.data),
  });

  const totalAjudas = itens.reduce((s, i) => s + (parseFloat(i.valor) || 0), 0);

  async function onSubmit(d) {
    try {
      await api.post(`/missionarios/${missionarioId}/acompanhamento/ajudas`, d);
      toast.success('Ajuda registrada!'); setModal(false); reset();
      qc.invalidateQueries(['ajudas', missionarioId]);
    } catch (e) { toast.error(e.message); }
  }

  async function deletar(id) {
    if (!confirm('Excluir?')) return;
    try { await api.delete(`/missionarios/${missionarioId}/acompanhamento/ajudas/${id}`); toast.success('Excluído'); qc.invalidateQueries(['ajudas', missionarioId]); }
    catch (e) { toast.error(e.message); }
  }

  const tipoCor = { FINANCEIRA:'bg-green-100 text-green-700', MATERIAL:'bg-blue-100 text-blue-700', EQUIPAMENTO:'bg-purple-100 text-purple-700', OBRA:'bg-amber-100 text-amber-700', OUTRO:'bg-gray-100 text-gray-700' };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          {totalAjudas > 0 && <p className="text-sm text-gray-500">Total em apoio registrado: <span className="font-semibold text-emerald-700">{fmtValor(totalAjudas)}</span></p>}
        </div>
        <Button onClick={() => { reset({ data: new Date().toISOString().slice(0,10), tipo: 'FINANCEIRA' }); setModal(true); }}>+ Registrar Apoio</Button>
      </div>
      {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50"><tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Descrição</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Valor</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {itens.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">Nenhum apoio registrado</td></tr>}
              {itens.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{fmtData(item.data)}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipoCor[item.tipo] || ''}`}>{item.tipo}</span></td>
                  <td className="px-4 py-3 text-gray-700">{item.descricao}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">{item.valor ? fmtValor(item.valor) : '—'}</td>
                  <td className="px-4 py-3"><button onClick={() => deletar(item.id)} className="text-xs text-red-400 hover:underline">Excluir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Registrar Apoio Enviado">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 block mb-1">Tipo *</label>
              <select required {...register('tipo')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                {['FINANCEIRA','MATERIAL','EQUIPAMENTO','OBRA','OUTRO'].map(v => <option key={v} value={v}>{v}</option>)}
              </select></div>
            <div><label className="text-xs text-gray-500 block mb-1">Data *</label>
              <input type="date" required {...register('data')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="text-xs text-gray-500 block mb-1">Descrição *</label>
            <input required {...register('descricao')} placeholder="O que foi enviado / comprado / providenciado?" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Valor (se houver)</label>
            <input type="number" step="0.01" {...register('valor')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Aba Avaliações ────────────────────────────────────────────────────────────
function TabAvaliacoes({ missionarioId }) {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const anoAtual = new Date().getFullYear();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ['avaliacoes', missionarioId],
    queryFn: () => api.get(`/missionarios/${missionarioId}/acompanhamento/avaliacoes`).then(r => r.data),
  });

  async function onSubmit(d) {
    try {
      await api.post(`/missionarios/${missionarioId}/acompanhamento/avaliacoes`, d);
      toast.success('Avaliação salva!'); setModal(false); reset();
      qc.invalidateQueries(['avaliacoes', missionarioId]);
    } catch (e) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">Avaliação a cada semestre — registra o estado geral do campo e do missionário</p>
        <Button onClick={() => { reset({ ano: anoAtual, semestre: new Date().getMonth() < 6 ? 1 : 2 }); setModal(true); }}>+ Nova Avaliação</Button>
      </div>
      {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <div className="space-y-3">
          {itens.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhuma avaliação semestral registrada</p>}
          {itens.map(item => {
            const sit = SITUACAO_CAMPO[item.situacaoCampo];
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{item.semestre}º Semestre de {item.ano}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sit?.cor || 'bg-gray-100 text-gray-700'}`}>{sit?.label || item.situacaoCampo}</span>
                </div>
                <p className="text-sm text-gray-700">{item.avaliacaoGeral}</p>
                {item.proximosPassos && <p className="text-xs text-blue-600 mt-2"><strong>Próximos passos:</strong> {item.proximosPassos}</p>}
                <p className="text-xs text-gray-400 mt-2">Avaliado por {item.avaliadoPor} em {fmtData(item.createdAt)}</p>
              </div>
            );
          })}
        </div>
      )}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Avaliação Semestral">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-gray-500 block mb-1">Semestre *</label>
              <select required {...register('semestre')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value={1}>1º Semestre</option><option value={2}>2º Semestre</option>
              </select></div>
            <div><label className="text-xs text-gray-500 block mb-1">Ano *</label>
              <input type="number" required {...register('ano')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Situação do Campo *</label>
              <select required {...register('situacaoCampo')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Selecione</option>
                {Object.entries(SITUACAO_CAMPO).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
              </select></div>
          </div>
          <div><label className="text-xs text-gray-500 block mb-1">Avaliação geral *</label>
            <textarea required rows={4} {...register('avaliacaoGeral')} placeholder="Como está o missionário e o campo? O que avançou? O que precisa de atenção?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" /></div>
          <div><label className="text-xs text-gray-500 block mb-1">Próximos passos</label>
            <textarea rows={2} {...register('proximosPassos')} placeholder="O que está planejado para o próximo semestre?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" /></div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
const ABAS = [
  { id: 'dados',      label: '👤 Dados' },
  { id: 'campo',      label: '🌍 Campo' },
  { id: 'contatos',   label: '📞 Contatos' },
  { id: 'relatorios', label: '📋 Relatórios' },
  { id: 'marcos',     label: '🏆 Marcos' },
  { id: 'apoio',      label: '🤝 Apoio' },
  { id: 'avaliacoes', label: '📊 Avaliações' },
];

export default function ViewMissionario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [aba, setAba] = useState('dados');

  const { data: m, isLoading } = useQuery({
    queryKey: ['missionario', id],
    queryFn: () => api.get(`/missionarios/${id}`).then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!m) return <p className="text-gray-500">Não encontrado.</p>;

  const p = m.pessoa || {};

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          {p.foto ? (
            <img src={`/${p.foto}`} alt="foto" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold shadow">
              {p.nome?.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{p.nome}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge text={m.status} />
              {m.campoMissionario && <span className="text-sm text-gray-500">{m.campoMissionario}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
          <Link to={`/missionarios/${id}`}><Button>Editar</Button></Link>
          <Button variant="secondary" onClick={() => navigate('/missionarios')}>Voltar</Button>
        </div>
      </div>

      {/* Navegação por abas */}
      <div className="flex gap-1 flex-wrap bg-gray-100 rounded-xl p-1">
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${aba === a.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Conteúdo da aba */}
      {aba === 'dados'      && <TabDados m={m} />}
      {aba === 'campo'      && <TabCampo missionarioId={id} />}
      {aba === 'contatos'   && <TabContatos missionarioId={id} />}
      {aba === 'relatorios' && <TabRelatorios missionarioId={id} />}
      {aba === 'marcos'     && <TabMarcos missionarioId={id} />}
      {aba === 'apoio'      && <TabApoio missionarioId={id} />}
      {aba === 'avaliacoes' && <TabAvaliacoes missionarioId={id} />}
    </div>
  );
}
