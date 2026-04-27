import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../../services/admin.service'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { useToast } from '../../components/ui/Toast'

export default function Cidades() {
  const qc = useQueryClient()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [uf, setUf] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ cidade: '', uf: '', ativo: true })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-cidades', q, uf],
    queryFn: () => adminService.cidades({ q: q || undefined, uf: uf || undefined }).then(r => r.data.data),
  })

  const ufs = useMemo(() => Array.from(new Set((data || []).map(c => c.uf).filter(Boolean))).sort(), [data])

  const abrirModal = (cidade = null) => {
    setModal(cidade || 'nova')
    setForm(cidade ? { cidade: cidade.cidade, uf: cidade.uf, ativo: cidade.ativo !== false } : { cidade: '', uf: '', ativo: true })
  }

  const salvar = async () => {
    try {
      if (modal?.id) await adminService.atualizarCidade(modal.id, form)
      else await adminService.criarCidade(form)
      qc.invalidateQueries({ queryKey: ['admin-cidades'] })
      qc.invalidateQueries({ queryKey: ['cidades'] })
      setModal(null)
      toast('Cidade salva', 'success')
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Erro ao salvar cidade', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cidades</h1>
          <p className="text-sm text-gray-500">Controle quais cidades aparecem no dimensionamento.</p>
        </div>
        <Button onClick={() => abrirModal()}>Nova Cidade</Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3">
        <input value={q} onChange={e => setQ(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-72" placeholder="Buscar cidade" />
        <select value={uf} onChange={e => setUf(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Todas UFs</option>
          {ufs.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Cidade', 'UF', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center"><Spinner /></td></tr>
            ) : !data || data.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Nenhuma cidade encontrada.</td></tr>
            ) : data.map(c => (
              <tr key={c.id || `${c.uf}-${c.cidade}`} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{c.cidade}</td>
                <td className="px-4 py-3 text-gray-500">{c.uf}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.ativo !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.ativo !== false ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="secondary" onClick={() => abrirModal(c)}>Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal open title={modal?.id ? 'Editar Cidade' : 'Nova Cidade'} onClose={() => setModal(null)} onConfirm={salvar} confirmLabel="Salvar">
          <div className="flex flex-col gap-3">
            <Input label="Cidade" value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} required />
            <Input label="UF" value={form.uf} onChange={e => setForm(f => ({ ...f, uf: e.target.value }))} required />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} />
              Cidade ativa
            </label>
          </div>
        </Modal>
      )}
    </div>
  )
}
