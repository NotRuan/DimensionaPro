import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { PERFIS } from '../../constants'

function Item({ to, children }) {
  const base = 'flex items-center px-3 py-2 rounded-lg text-sm transition-colors'
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${base} ${isActive ? 'bg-white text-slate-950 font-semibold shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
    >
      {children}
    </NavLink>
  )
}

export function Sidebar() {
  const perfil = useAuthStore(s => s.usuario?.perfil)

  return (
    <aside className="w-64 bg-slate-950 text-white flex flex-col min-h-full">
      <div className="h-16 border-b border-slate-800 px-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-teal-500 text-slate-950 font-bold flex items-center justify-center">DP</div>
        <div>
          <p className="font-semibold leading-tight">DimensionaPro</p>
          <p className="text-xs text-slate-400">Capacity Intelligence</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        <Item to="/dashboard">Dashboard</Item>

        {perfil === PERFIS.CONSULTOR && (
          <>
            <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Dimensionamento</p>
            <Item to="/dimensionamentos">Meus Dimensionamentos</Item>
            <Item to="/dimensionamento/novo">Novo Dimensionamento</Item>
          </>
        )}

        {perfil === PERFIS.GERENTE && (
          <>
            <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Revisao</p>
            <Item to="/revisoes">Fila de Revisao</Item>
            <Item to="/notificacoes">Notificacoes</Item>
          </>
        )}

        {perfil === PERFIS.ADM && (
          <>
            <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Administracao</p>
            <Item to="/admin/usuarios">Usuarios</Item>
            <Item to="/admin/base">Base de Prestadores</Item>
            <Item to="/admin/cidades">Cidades</Item>
            <Item to="/admin/configuracoes">Configuracoes</Item>
            <Item to="/admin/auditoria">Auditoria</Item>
            <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Revisao</p>
            <Item to="/revisoes">Fila de Revisao</Item>
          </>
        )}
      </nav>
    </aside>
  )
}
