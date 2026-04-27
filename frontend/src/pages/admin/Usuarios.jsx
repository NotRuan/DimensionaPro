import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { Button } from '../../components/ui/Button'
import { FormUsuario } from '../../components/admin/FormUsuario'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'

export default function Usuarios() {
  const qc = useQueryClient()
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const [resetUser, setResetUser] = useState(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [busca, setBusca] = useState('')
  const [perfil, setPerfil] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/users').then(r => r.data.data),
  })

  const usuarios = useMemo(() => {
    const termo = busca.toLowerCase().trim()
    return (data || []).filter(u => {
      if (perfil && u.perfil !== perfil) return false
      if (status === 'ATIVO' && !u.ativo) return false
      if (status === 'INATIVO' && u.ativo) return false
      if (!termo) return true
      return `${u.nome} ${u.email}`.toLowerCase().includes(termo)
    })
  }, [data, busca, perfil, status])

  const handleToggle = async (id, ativo) => {
    try {
      await api.patch(`/users/${id}/toggle`)
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      toast(ativo ? 'Usuario desativado' : 'Usuario ativado', 'success')
    } catch (err) { toast(err.response?.data?.error?.message || 'Erro ao alterar status', 'error') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmar exclusao?')) return
    try {
      await api.delete(`/users/${id}`)
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      toast('Usuario excluido', 'success')
    } catch (err) { toast(err.response?.data?.error?.message || 'Erro ao excluir', 'error') }
  }

  const resetarSenha = async () => {
    try {
      await api.patch(`/users/${resetUser.id}/reset-senha`, { senha: novaSenha })
      setResetUser(null)
      setNovaSenha('')
      toast('Senha redefinida', 'success')
    } catch (err) { toast(err.response?.data?.error?.message || 'Erro ao redefinir senha', 'error') }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500">Gerencie acessos, perfis e status dos usuarios.</p>
        </div>
        <Button onClick={() => setModal('novo')}>Novo Usuario</Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3">
        <input value={busca} onChange={e => setBusca(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-72" placeholder="Buscar por nome ou email" />
        <select value={perfil} onChange={e => setPerfil(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Todos perfis</option>
          <option value="CONSULTOR">Consultor</option>
          <option value="GERENTE">Gerente</option>
          <option value="ADM">Administrador</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Todos status</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
        </select>
      </div>

      {isLoading ? <p className="text-gray-500">Carregando...</p> : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Nome', 'E-mail', 'Perfil', 'Status', 'Criado em', 'Acoes'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.nome}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{u.perfil}</span></td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setModal(u)}>Editar</Button>
                    <Button size="sm" variant="secondary" onClick={() => setResetUser(u)}>Resetar Senha</Button>
                    <Button size="sm" variant={u.ativo ? 'danger' : 'secondary'} onClick={() => handleToggle(u.id, u.ativo)}>
                      {u.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id)}>Excluir</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <FormUsuario
          usuario={modal === 'novo' ? null : modal}
          onSalvo={() => { qc.invalidateQueries({ queryKey: ['usuarios'] }); setModal(null); toast('Usuario salvo!', 'success') }}
          onFechar={() => setModal(null)}
        />
      )}

      {resetUser && (
        <Modal open title={`Resetar senha - ${resetUser.nome}`} onClose={() => setResetUser(null)} onConfirm={resetarSenha} confirmLabel="Resetar">
          <Input label="Nova senha" type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} required />
        </Modal>
      )}
    </div>
  )
}
