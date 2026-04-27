import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useNotificacoes } from '../../hooks/useNotificacoes'

export function AppLayout() {
  useNotificacoes()

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
