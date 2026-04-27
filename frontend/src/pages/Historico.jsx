import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { dimensionamentosService } from '../services/dimensionamentos.service'
import { StatusBadge as ResultadoBadge, RevisaoBadge } from '../components/ui/Badge'

const FILTROS = ['TODOS', 'ELETRICISTA', 'ENCANADOR']

function StatusBadge({ status }) {
  const map = {
    APROVADO: 'bg-green-100 text-green-700',
    REPROVADO: 'bg-red-100 text-red-700',
    PENDENTE:  'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status ?? 'Rascunho'}
    </span>
  )
}

export default function Historico() {
  const { cidade } = useParams()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('TODOS')

  const { data, isLoading } = useQuery({
    queryKey: ['historico', cidade],
    queryFn: () => dimensionamentosService.listarPorCidade(cidade),
  })

  const todos = data?.data?.data ?? data?.data ?? []

  const registros = filtro === 'TODOS'
    ? todos
    : todos.filter(d => d.tipo_servico === filtro)

  const chartData = registros
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(d => ({
      data: new Date(d.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      indice: d.indice_capacidade ?? null,
    }))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
        >
          ← Voltar ao Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{cidade}</h1>
      </div>

      {/* Filtro de tipo de serviço */}
      <div className="flex gap-2 mb-6">
        {FILTROS.map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtro === f
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Gráfico de linha */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-4">Índice de Capacidade ao longo do tempo</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 1.5]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <ReferenceLine y={1.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Subdim.', fontSize: 10, fill: '#ef4444' }} />
              <ReferenceLine y={0.9} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'Adequado', fontSize: 10, fill: '#eab308' }} />
              <Line type="monotone" dataKey="indice" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Data', 'Serviço', 'Índice', 'Status', 'Prestadores', 'Consultor', 'Revisão'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Carregando...</td></tr>
            ) : registros.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Nenhum registro encontrado.</td></tr>
            ) : registros.map(d => (
              <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3">{d.tipo_servico}</td>
                <td className="px-4 py-3 font-semibold">{d.indice_capacidade?.toFixed(2) ?? '—'}</td>
                <td className="px-4 py-3">
                  <ResultadoBadge status={d.status_resultado} />
                </td>
                <td className="px-4 py-3">{d.total_prestadores ?? '—'}</td>
                <td className="px-4 py-3">{d.consultor_nome ?? d.consultor?.nome ?? '—'}</td>
                <td className="px-4 py-3">
                  <RevisaoBadge status={d.status_revisao} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
