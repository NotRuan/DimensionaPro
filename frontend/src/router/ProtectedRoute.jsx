import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export function ProtectedRoute({ perfis }) {
  const { token, usuario } = useAuthStore()
  if (!token || !usuario) return <Navigate to="/login" replace />
  if (perfis && !perfis.includes(usuario.perfil)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
