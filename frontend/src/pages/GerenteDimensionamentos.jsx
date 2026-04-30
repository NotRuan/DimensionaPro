import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { dimensionamentosService } from '../services/dimensionamentos.service'
import { StatusBadge, RevisaoBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { fmt } from '../utils/formatters'

function normalizar(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

export default function GerenteDimensionamentos() {
  const navigate = useNavigate()
  const [consultorId, setConsultorId] = useState('')
  const [termo, setTermo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['gerente-dimensionamentos'],
    queryFn: () => dimensionamentosService.listar().then(r => r.data.data),
  })

  const registros = useMemo(() => data || [], [data])

  const consultores = useMemo(() => {
    const map = new Map()
    registros.forEach(d => {
      const id = d.consultor_id || 'sem-consultor'
      const atual = map.get(id) || {
        id,
        nome: d.consultor?.nome || 'Sem consultor',
        email: d.consultor?.email || '',
        total: 0,
        pendentes: 0,
        ajustes: 0,
        revisados: 0,
      }
      atual.total += 1
      if (d.status_revisao === 'PENDENTE') atual.pendentes += 1
      if (d.status_revisao === 'AJUSTE_SOLICITADO') atual.ajustes += 1
      if (d.status_revisao === 'REVISADO') atual.revisados += 1
      map.set(id, atual)
    })
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [registros])

  const selecionado = consultores.find(c => c.id === consultorId)
  const termoNormalizado = normalizar(termo)

  const dimensionamentos = registros.filter(d => {
    if (consultorId && (d.consultor_id || 'sem-consultor') !== consultorId) return false
    if (!termoNormalizado) return true
    return normalizar(`${d.cidade} ${d.uf || ''} ${d.status_revisao || ''} ${d.status_resultado || ''}`).includes(termoNormalizado)
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dimensionamentos por Consultor</h1>
          <p className="text-sm text-gray-500">Acompanhe volume, pendencias e detalhes enviados por cada consultor.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/revisoes')}>Abrir fila de revisao</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {consultores.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => setConsultorId(c.id === consultorId ? '' : c.id)}
            className={`bg-white border rounded-lg px-4 py-3 text-left hover:bg-gray-50 ${c.id === consultorId ? 'border-teal-500 ring-2 ring-teal-100' : 'border-gray-200'}`}
          >
            <p className="text-sm font-semibold text-gray-900 truncate">{c.nome}</p>
            <p className="text-xs text-gray-500 truncate">{c.email || 'Sem email'}</p>
            <div className="grid grid-cols-4 gap-2 mt-3 text-center">
              <div><p className="text-lg font-bold text-gray-900">{c.total}</p><p className="text-[10px] text-gray-500">Total</p></div>
              <div><p className="text-lg font-bold text-yellow-700">{c.pendentes}</p><p className="text-[10px] text-gray-500">Pend.</p></div>
              <div><p className="text-lg font-bold text-orange-700">{c.ajustes}</p><p className="text-[10px] text-gray-500">Ajustes</p></div>
              <div><p className="text-lg font-bold text-green-700">{c.revisados}</p><p className="text-[10px] text-gray-500">Rev.</p></div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
        <select
          value={consultorId}
          onChange={e => setConsultorId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">Todos os consultores</option>
          {consultores.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.total})</option>)}
        </select>
        <input
          value={termo}
          onChange={e => setTermo(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1"
          placeholder="Buscar por cidade, UF ou status"
        />
        <p className="text-sm text-gray-500">
          {dimensionamentos.length} dimensionamento{dimensionamentos.length === 1 ? '' : 's'}
          {selecionado ? ` de ${selecionado.nome}` : ''}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Consultor', 'Cidade / UF', 'Servico', 'Indice', 'Status', 'Revisao', 'Criado', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center"><Spinner /></td></tr>
            ) : dimensionamentos.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Nenhum dimensionamento encontrado.</td></tr>
            ) : dimensionamentos.map(d => (
              <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{d.consultor?.nome || '-'}</p>
                  <p className="text-xs text-gray-400">{d.consultor?.email || ''}</p>
                </td>
                <td className="px-4 py-3 font-medium">{d.cidade} <span className="text-xs text-gray-400">{d.uf}</span></td>
                <td className="px-4 py-3 text-gray-500">Eletricista + Encanador</td>
                <td className="px-4 py-3 font-mono">{fmt.indice(d.indice_capacidade)}</td>
                <td className="px-4 py-3"><StatusBadge status={d.status_resultado} /></td>
                <td className="px-4 py-3"><RevisaoBadge status={d.status_revisao} /></td>
                <td className="px-4 py-3 text-gray-500">{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/revisoes/${d.id}`)}>Ver detalhes</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
