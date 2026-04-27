import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/admin.service'
import { Spinner } from '../../components/ui/Spinner'

export default function Auditoria() {
  const [entidade, setEntidade] = useState('')
  const [acao, setAcao] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['auditoria', entidade, acao],
    queryFn: () => adminService.auditoria({ entidade: entidade || undefined, acao: acao || undefined }).then(r => r.data.data),
  })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Auditoria</h1>
        <p className="text-sm text-gray-500">Acompanhe acoes administrativas e operacionais relevantes.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3">
        <input value={acao} onChange={e => setAcao(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Filtrar por acao" />
        <input value={entidade} onChange={e => setEntidade(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Filtrar por entidade" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Data', 'Usuario', 'Acao', 'Entidade', 'Detalhes'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center"><Spinner /></td></tr>
            ) : !data || data.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nenhum evento encontrado.</td></tr>
            ) : data.map(e => (
              <tr key={e.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-500">{new Date(e.created_at).toLocaleString('pt-BR')}</td>
                <td className="px-4 py-3">{e.usuario?.nome || 'Sistema'}</td>
                <td className="px-4 py-3 font-medium">{e.acao}</td>
                <td className="px-4 py-3 text-gray-500">{e.entidade || '-'}</td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-md truncate">{e.detalhes ? JSON.stringify(e.detalhes) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
