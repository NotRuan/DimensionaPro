import { useAuthStore } from '../../store/authStore'
import { useNotificacoesStore } from '../../store/notificacoesStore'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/auth.service'

export function Header() {
  const { usuario, logout } = useAuthStore()
  const naoLidas = useNotificacoesStore(s => s.naoLidas)
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authService.logout() } catch {
      // Logout local deve continuar mesmo se a API falhar.
    }
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur flex items-center justify-between px-6">
      <div>
        <p className="text-sm font-semibold text-slate-900">DimensionaPro</p>
        <p className="text-xs text-slate-500 hidden sm:block">Gestao de capacidade operacional</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/notificacoes')}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Notificacoes"
        >
          <span className="text-base">!</span>
          {naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </button>
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-sm font-medium text-slate-900">{usuario?.nome}</span>
          <span className="text-xs text-slate-500">{usuario?.perfil}</span>
        </div>
        <button onClick={handleLogout} className="text-sm font-medium text-slate-500 hover:text-slate-900">Sair</button>
      </div>
    </header>
  )
}
