import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { dimensionamentosService } from '../services/dimensionamentos.service'
import { useDimensionamentoStore } from '../store/dimensionamentoStore'
import { StatusBadge, RevisaoBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { fmt } from '../utils/formatters'

const FILTROS = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'RASCUNHO', label: 'Rascunhos' },
  { value: 'AJUSTE_SOLICITADO', label: 'Ajustes' },
  { value: 'PENDENTE', label: 'Pendentes' },
  { value: 'REVISADO', label: 'Revisados' },
]

const EDITAVEIS = ['RASCUNHO', 'AJUSTE_SOLICITADO', 'PENDENTE']

export default function MeusDimensionamentos() {
  const navigate = useNavigate()
  const carregarDimensionamento = useDimensionamentoStore(s => s.carregarDimensionamento)
  const [filtro, setFiltro] = useState('TODOS')
  const [editandoId, setEditandoId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['meus-dimensionamentos'],
    queryFn: () => dimensionamentosService.listar().then(r => r.data.data),
  })

  const registros = useMemo(() => {
    const lista = data || []
    return filtro === 'TODOS'
      ? lista
      : lista.filter(d => d.status_revisao === filtro)
  }, [data, filtro])

  const editar = async (id) => {
    setEditandoId(id)
    try {
      const { data: res } = await dimensionamentosService.buscarPorId(id)
      carregarDimensionamento(res.data)
      navigate('/dimensionamento/novo')
    } finally {
      setEditandoId(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Meus Dimensionamentos</h1>
          <p className="text-sm text-gray-500">Acompanhe rascunhos, ajustes solicitados e dimensionamentos enviados.</p>
        </div>
        <Button onClick={() => navigate('/dimensionamento/novo')}>Novo Dimensionamento</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFiltro(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
              filtro === f.value
                ? 'bg-teal-50 text-teal-800 border-teal-200'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Cidade / UF', 'Servico', 'Indice', 'Status', 'Revisao', 'Data', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center"><Spinner /></td></tr>
            ) : registros.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Nenhum dimensionamento encontrado.</td></tr>
            ) : registros.map(d => (
              <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{d.cidade} <span className="text-xs text-gray-400">{d.uf}</span></td>
                <td className="px-4 py-3 text-gray-500">{d.tipo_servico}</td>
                <td className="px-4 py-3 font-mono">{fmt.indice(d.indice_capacidade)}</td>
                <td className="px-4 py-3"><StatusBadge status={d.status_resultado} /></td>
                <td className="px-4 py-3"><RevisaoBadge status={d.status_revisao} /></td>
                <td className="px-4 py-3 text-gray-500">{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/historico/${encodeURIComponent(d.cidade)}`)}>
                      Historico
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!EDITAVEIS.includes(d.status_revisao) || editandoId === d.id}
                      onClick={() => editar(d.id)}
                    >
                      {editandoId === d.id ? 'Abrindo...' : 'Editar'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
