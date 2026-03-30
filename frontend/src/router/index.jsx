import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

// Pages — serão implementadas nas próximas etapas
// Lazy imports para melhor performance
import { lazy, Suspense } from 'react';

const Dashboard             = lazy(() => import('../pages/Dashboard'));
const MissionariosList      = lazy(() => import('../pages/missionarios/MissionariosList'));
const MissionariosForm      = lazy(() => import('../pages/missionarios/MissionariosForm'));
const BasesMissionariasList = lazy(() => import('../pages/basesMissionarias/BasesMissionariasList'));
const BasesMissionariasForm = lazy(() => import('../pages/basesMissionarias/BasesMissionariasForm'));
const SetoresList           = lazy(() => import('../pages/setores/SetoresList'));
const SetoresForm           = lazy(() => import('../pages/setores/SetoresForm'));
const CongregacoesList      = lazy(() => import('../pages/congregacoes/CongregacoesList'));
const CongregacoesForm      = lazy(() => import('../pages/congregacoes/CongregacoesForm'));
const PromotoresList        = lazy(() => import('../pages/promotores/PromotoresList'));
const PromotoresForm        = lazy(() => import('../pages/promotores/PromotoresForm'));
const AgentesList           = lazy(() => import('../pages/agentes/AgentesList'));
const AgentesForm           = lazy(() => import('../pages/agentes/AgentesForm'));
const SecretariosList       = lazy(() => import('../pages/secretarios/SecretariosList'));
const SecretariosForm       = lazy(() => import('../pages/secretarios/SecretariosForm'));
const OfertasList           = lazy(() => import('../pages/financeiro/OfertasList'));
const RankingSetores        = lazy(() => import('../pages/ranking/RankingSetores'));
const RankingCongregacoes   = lazy(() => import('../pages/ranking/RankingCongregacoes'));
const RelatorioMissionarios = lazy(() => import('../pages/relatorios/RelatorioMissionarios'));
const RelatorioBases        = lazy(() => import('../pages/relatorios/RelatorioBases'));
const RelatorioPromotores   = lazy(() => import('../pages/relatorios/RelatorioPromotores'));
const RelatorioSecretarios  = lazy(() => import('../pages/relatorios/RelatorioSecretarios'));
const RelatorioFinanceiro   = lazy(() => import('../pages/relatorios/RelatorioFinanceiro'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700" />
    </div>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Missionários */}
          <Route path="missionarios" element={<MissionariosList />} />
          <Route path="missionarios/novo" element={<MissionariosForm />} />
          <Route path="missionarios/:id" element={<MissionariosForm />} />

          {/* Cadastros */}
          <Route path="bases-missionarias" element={<BasesMissionariasList />} />
          <Route path="bases-missionarias/novo" element={<BasesMissionariasForm />} />
          <Route path="bases-missionarias/:id" element={<BasesMissionariasForm />} />

          <Route path="setores" element={<SetoresList />} />
          <Route path="setores/novo" element={<SetoresForm />} />
          <Route path="setores/:id" element={<SetoresForm />} />

          <Route path="congregacoes" element={<CongregacoesList />} />
          <Route path="congregacoes/novo" element={<CongregacoesForm />} />
          <Route path="congregacoes/:id" element={<CongregacoesForm />} />

          <Route path="promotores" element={<PromotoresList />} />
          <Route path="promotores/novo" element={<PromotoresForm />} />
          <Route path="promotores/:id" element={<PromotoresForm />} />

          <Route path="agentes" element={<AgentesList />} />
          <Route path="agentes/novo" element={<AgentesForm />} />
          <Route path="agentes/:id" element={<AgentesForm />} />

          <Route path="secretarios" element={<SecretariosList />} />
          <Route path="secretarios/novo" element={<SecretariosForm />} />
          <Route path="secretarios/:id" element={<SecretariosForm />} />

          {/* Financeiro */}
          <Route path="financeiro" element={<OfertasList />} />

          {/* Ranking */}
          <Route path="ranking/setores" element={<RankingSetores />} />
          <Route path="ranking/congregacoes" element={<RankingCongregacoes />} />

          {/* Relatórios */}
          <Route path="relatorios/missionarios" element={<RelatorioMissionarios />} />
          <Route path="relatorios/bases" element={<RelatorioBases />} />
          <Route path="relatorios/promotores" element={<RelatorioPromotores />} />
          <Route path="relatorios/secretarios" element={<RelatorioSecretarios />} />
          <Route path="relatorios/financeiro" element={<RelatorioFinanceiro />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
