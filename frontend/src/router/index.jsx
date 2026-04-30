import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from '../components/layout/AppLayout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import NovoDimensionamento from '../pages/NovoDimensionamento'
import Dimensionamento from '../pages/Dimensionamento'
import Resultado from '../pages/Resultado'
import Usuarios from '../pages/admin/Usuarios'
import BasePrestadores from '../pages/admin/BasePrestadores'
import Configuracoes from '../pages/admin/Configuracoes'
import Auditoria from '../pages/admin/Auditoria'
import Cidades from '../pages/admin/Cidades'
import Historico from '../pages/Historico'
import MeusDimensionamentos from '../pages/MeusDimensionamentos'
import Notificacoes from '../pages/Notificacoes'
import Revisoes from '../pages/Revisoes'
import RevisaoDetalhe from '../pages/RevisaoDetalhe'
import GerenteDimensionamentos from '../pages/GerenteDimensionamentos'

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <ProtectedRoute perfis={['ADM','CONSULTOR','GERENTE']} />,
    children: [{
      element: <AppLayout />,
      children: [
        { path: '/dashboard', element: <Dashboard /> },
        { path: '/historico/:cidade', element: <Historico /> },
        { path: '/notificacoes', element: <Notificacoes /> },
        {
          element: <ProtectedRoute perfis={['CONSULTOR']} />,
          children: [
            { path: '/dimensionamentos',          element: <MeusDimensionamentos /> },
            { path: '/dimensionamento/novo',      element: <NovoDimensionamento /> },
            { path: '/dimensionamento/qualidade',  element: <Dimensionamento /> },
            { path: '/dimensionamento/resultado',  element: <Resultado /> },
          ],
        },
        {
          element: <ProtectedRoute perfis={['GERENTE','ADM']} />,
          children: [
            { path: '/revisoes', element: <Revisoes /> },
            { path: '/revisoes/:id', element: <RevisaoDetalhe /> },
            { path: '/gerente/dimensionamentos', element: <GerenteDimensionamentos /> },
          ],
        },
        {
          element: <ProtectedRoute perfis={['ADM']} />,
          children: [
            { path: '/admin/usuarios',       element: <Usuarios /> },
            { path: '/admin/base',           element: <BasePrestadores /> },
            { path: '/admin/configuracoes',  element: <Configuracoes /> },
            { path: '/admin/cidades',        element: <Cidades /> },
            { path: '/admin/auditoria',      element: <Auditoria /> },
          ],
        },
      ],
    }],
  },
  { path: '*', element: <Login /> },
])
