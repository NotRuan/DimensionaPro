import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/auth.service'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const destinoPorPerfil = (perfilUsuario) => {
    if (perfilUsuario === 'ADM') return '/admin/usuarios'
    if (perfilUsuario === 'GERENTE') return '/revisoes'
    return '/dashboard'
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const { data: res } = await authService.login(email, senha)
      setAuth(res.data.accessToken, res.data.usuario)
      navigate(destinoPorPerfil(res.data.usuario.perfil), { replace: true })
    } catch (err) {
      setErro(err.response?.data?.error?.message || 'E-mail ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 grid lg:grid-cols-[minmax(0,1fr)_460px]">
      <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#102A43] px-12 py-10 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-[linear-gradient(135deg,#102A43_0%,#0F766E_45%,#D97706_100%)]" />
        </div>
        <div className="relative">
          <h1 className="mt-8 max-w-xl text-4xl font-bold leading-tight">DimensionaPro</h1>
          <p className="mt-4 max-w-xl text-lg text-slate-100">
            Plataforma para dimensionamento operacional, revisao de capacidade e acompanhamento de qualidade.
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-3">
          {[
            ['Capacidade', 'Demanda vs. rede'],
            ['Revisao', 'Fluxos por perfil'],
            ['Auditoria', 'Historico rastreavel'],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs text-slate-200">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <main className="flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <h1 className="mt-4 text-2xl font-bold text-slate-900">DimensionaPro</h1>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70">
            <div className="mb-6">
              <p className="text-sm font-medium text-teal-700">Acesso ao sistema</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">Entrar na conta</h2>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@empresa.com" required />
              <Input label="Senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Digite sua senha" required />
              {erro && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
              <Button type="submit" disabled={loading} size="lg" className="mt-2 w-full">
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
