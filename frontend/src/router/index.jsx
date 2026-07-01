import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import Spinner from '../components/ui/Spinner';

const Login = lazy(() => import('../pages/Login'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const ListaMissionarios = lazy(() => import('../pages/missionarios/ListaMissionarios'));
const FormMissionario = lazy(() => import('../pages/missionarios/FormMissionario'));
const ViewMissionario = lazy(() => import('../pages/missionarios/ViewMissionario'));
const ViewBase = lazy(() => import('../pages/bases/ViewBase'));
const ViewSetor = lazy(() => import('../pages/setores/ViewSetor'));
const ViewCongregacao = lazy(() => import('../pages/congregacoes/ViewCongregacao'));
const ViewPromotor = lazy(() => import('../pages/promotores/ViewPromotor'));
const ViewAgente = lazy(() => import('../pages/agentes/ViewAgente'));
const ViewSecretario = lazy(() => import('../pages/secretarios/ViewSecretario'));
const ListaBases = lazy(() => import('../pages/bases/ListaBases'));
const FormBase = lazy(() => import('../pages/bases/FormBase'));
const ListaSetores = lazy(() => import('../pages/setores/ListaSetores'));
const FormSetor = lazy(() => import('../pages/setores/FormSetor'));
const ListaCongregacoes = lazy(() => import('../pages/congregacoes/ListaCongregacoes'));
const FormCongregacao = lazy(() => import('../pages/congregacoes/FormCongregacao'));
const ListaPromotores = lazy(() => import('../pages/promotores/ListaPromotores'));
const FormPromotor = lazy(() => import('../pages/promotores/FormPromotor'));
const ListaAgentes = lazy(() => import('../pages/agentes/ListaAgentes'));
const FormAgente = lazy(() => import('../pages/agentes/FormAgente'));
const ListaSecretarios = lazy(() => import('../pages/secretarios/ListaSecretarios'));
const FormSecretario = lazy(() => import('../pages/secretarios/FormSecretario'));
const Financeiro = lazy(() => import('../pages/financeiro/Financeiro'));
const RankingSetores = lazy(() => import('../pages/ranking/RankingSetores'));
const RankingCongregacoes = lazy(() => import('../pages/ranking/RankingCongregacoes'));
const RelatorioMissionarios = lazy(() => import('../pages/relatorios/RelatorioMissionarios'));
const RelatorioBases = lazy(() => import('../pages/relatorios/RelatorioBases'));
const RelatorioPromotores = lazy(() => import('../pages/relatorios/RelatorioPromotores'));
const RelatorioSecretarios = lazy(() => import('../pages/relatorios/RelatorioSecretarios'));
const RelatorioFinanceiro = lazy(() => import('../pages/relatorios/RelatorioFinanceiro'));
const Configuracoes = lazy(() => import('../pages/configuracoes/Configuracoes'));

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

const fallback = <div className="flex h-screen items-center justify-center"><Spinner /></div>;

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={fallback}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="missionarios" element={<ListaMissionarios />} />
            <Route path="missionarios/novo" element={<FormMissionario />} />
            <Route path="missionarios/:id/ver" element={<ViewMissionario />} />
            <Route path="missionarios/:id" element={<FormMissionario />} />
            <Route path="bases-missionarias" element={<ListaBases />} />
            <Route path="bases-missionarias/nova" element={<FormBase />} />
            <Route path="bases-missionarias/:id/ver" element={<ViewBase />} />
            <Route path="bases-missionarias/:id" element={<FormBase />} />
            <Route path="setores" element={<ListaSetores />} />
            <Route path="setores/novo" element={<FormSetor />} />
            <Route path="setores/:id/ver" element={<ViewSetor />} />
            <Route path="setores/:id" element={<FormSetor />} />
            <Route path="congregacoes" element={<ListaCongregacoes />} />
            <Route path="congregacoes/nova" element={<FormCongregacao />} />
            <Route path="congregacoes/:id/ver" element={<ViewCongregacao />} />
            <Route path="congregacoes/:id" element={<FormCongregacao />} />
            <Route path="promotores" element={<ListaPromotores />} />
            <Route path="promotores/novo" element={<FormPromotor />} />
            <Route path="promotores/:id/ver" element={<ViewPromotor />} />
            <Route path="promotores/:id" element={<FormPromotor />} />
            <Route path="agentes" element={<ListaAgentes />} />
            <Route path="agentes/novo" element={<FormAgente />} />
            <Route path="agentes/:id/ver" element={<ViewAgente />} />
            <Route path="agentes/:id" element={<FormAgente />} />
            <Route path="secretarios" element={<ListaSecretarios />} />
            <Route path="secretarios/novo" element={<FormSecretario />} />
            <Route path="secretarios/:id/ver" element={<ViewSecretario />} />
            <Route path="secretarios/:id" element={<FormSecretario />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="ranking/setores" element={<RankingSetores />} />
            <Route path="ranking/congregacoes" element={<RankingCongregacoes />} />
            <Route path="relatorios/missionarios" element={<RelatorioMissionarios />} />
            <Route path="relatorios/bases" element={<RelatorioBases />} />
            <Route path="relatorios/promotores" element={<RelatorioPromotores />} />
            <Route path="relatorios/secretarios" element={<RelatorioSecretarios />} />
            <Route path="relatorios/financeiro" element={<RelatorioFinanceiro />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
