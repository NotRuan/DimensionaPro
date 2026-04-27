import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/auth.service'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function Login() {
  const [modo, setModo] = useState('login')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [perfil, setPerfil] = useState('CONSULTOR')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const resetForm = () => {
    setNome('')
    setEmail('')
    setSenha('')
    setConfirmarSenha('')
    setPerfil('CONSULTOR')
    setErro('')
  }

  const alternarModo = (novoModo) => {
    resetForm()
    setModo(novoModo)
  }

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

  const handleCadastro = async (e) => {
    e.preventDefault()
    setErro('')
    if (senha !== confirmarSenha) {
      setErro('As senhas nao coincidem')
      return
    }
    setLoading(true)
    try {
      const { data: res } = await authService.register(nome, email, senha, confirmarSenha, perfil)
      setAuth(res.data.accessToken, res.data.usuario)
      navigate(destinoPorPerfil(res.data.usuario.perfil), { replace: true })
    } catch (err) {
      setErro(err.response?.data?.error?.message || 'Erro ao criar conta')
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
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white text-teal-800 font-bold shadow-lg">DP</div>
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
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-teal-700 text-white font-bold">DP</div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">DimensionaPro</h1>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70">
            <div className="mb-6">
              <p className="text-sm font-medium text-teal-700">Acesso ao sistema</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">{modo === 'login' ? 'Entrar na conta' : 'Criar novo acesso'}</h2>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => alternarModo('login')}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${modo === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => alternarModo('cadastro')}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${modo === 'cadastro' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Cadastrar
              </button>
            </div>

            {modo === 'login' && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@empresa.com" required />
                <Input label="Senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Digite sua senha" required />
                {erro && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
                <Button type="submit" disabled={loading} size="lg" className="mt-2 w-full">
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            )}

            {modo === 'cadastro' && (
              <form onSubmit={handleCadastro} className="flex flex-col gap-4">
                <Input label="Nome completo" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" required />
                <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@empresa.com" required />
                <Input label="Senha" type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Minimo 6 caracteres" required />
                <Input label="Confirmar senha" type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} placeholder="Repita a senha" required />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">Perfil</label>
                  <select value={perfil} onChange={e => setPerfil(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700">
                    <option value="CONSULTOR">Consultor</option>
                    <option value="GERENTE">Gerente</option>
                    <option value="ADM">Administrador</option>
                  </select>
                </div>
                {erro && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
                <Button type="submit" disabled={loading} size="lg" className="mt-2 w-full">
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
