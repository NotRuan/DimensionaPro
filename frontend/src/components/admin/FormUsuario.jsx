import { useState } from 'react'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import api from '../../services/api'

export function FormUsuario({ usuario, onSalvo, onFechar }) {
  const [form, setForm] = useState({
    nome:   usuario?.nome   || '',
    email:  usuario?.email  || '',
    perfil: usuario?.perfil || 'CONSULTOR',
    senha:  '',
  })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))

  const handleSalvar = async () => {
    setErro('')
    setLoading(true)
    try {
      if (usuario?.id) {
        await api.put(`/users/${usuario.id}`, { nome: form.nome, email: form.email, perfil: form.perfil })
      } else {
        await api.post('/users', form)
      }
      onSalvo()
    } catch (err) {
      setErro(err.response?.data?.error?.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open
      title={usuario?.id ? 'Editar Usuário' : 'Novo Usuário'}
      onClose={onFechar}
      onConfirm={handleSalvar}
      confirmLabel="Salvar"
      loading={loading}
    >
      <div className="flex flex-col gap-3">
        <Input label="Nome" required value={form.nome} onChange={e => set('nome', e.target.value)} />
        <Input label="E-mail" type="email" required value={form.email} onChange={e => set('email', e.target.value)} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Perfil <span className="text-red-500">*</span></label>
          <select value={form.perfil} onChange={e => set('perfil', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-700">
            <option value="CONSULTOR">Consultor</option>
            <option value="GERENTE">Gerente</option>
            <option value="ADM">Administrador</option>
          </select>
        </div>
        {!usuario?.id && (
          <Input label="Senha" type="password" required value={form.senha} onChange={e => set('senha', e.target.value)} />
        )}
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </div>
    </Modal>
  )
}
