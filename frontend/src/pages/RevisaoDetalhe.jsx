import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dimensionamentosService } from '../services/dimensionamentos.service'
import { StatusBadge, RevisaoBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { fmt } from '../utils/formatters'

const MOTIVOS = [
  'Demanda inconsistente',
  'Prestador incorreto',
  'Metrica de qualidade fora do padrao',
  'Capacidade incompativel',
  'Dados insuficientes',
]

export default function RevisaoDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [motivo, setMotivo] = useState(MOTIVOS[0])
  const [comentario, setComentario] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['revisao-detalhe', id],
    queryFn: () => dimensionamentosService.buscarPorId(id).then(r => r.data.data),
  })

  const { data: eventos } = useQuery({
    queryKey: ['dimensionamento-eventos', id],
    queryFn: () => dimensionamentosService.eventos(id).then(r => r.data.data),
  })

  const revisar = useMutation({
    mutationFn: () => dimensionamentosService.revisar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['revisao-detalhe', id] })
      qc.invalidateQueries({ queryKey: ['dimensionamento-eventos', id] })
      qc.invalidateQueries({ queryKey: ['revisoes'] })
      qc.invalidateQueries({ queryKey: ['gerente-dashboard'] })
    },
  })

  const ajuste = useMutation({
    mutationFn: () => dimensionamentosService.ajuste(id, `${motivo}: ${comentario}`),
    onSuccess: () => {
      setComentario('')
      qc.invalidateQueries({ queryKey: ['revisao-detalhe', id] })
      qc.invalidateQueries({ queryKey: ['dimensionamento-eventos', id] })
      qc.invalidateQueries({ queryKey: ['revisoes'] })
      qc.invalidateQueries({ queryKey: ['gerente-dashboard'] })
    },
  })

  if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>
  if (!data) return <p className="text-gray-500">Dimensionamento nao encontrado.</p>

  const prestadores = data.prestadores_dim || []
  const chartData = prestadores.map(p => ({
    name: p.nome_prestador?.split(' ')[0] || String(p.idprestador),
    'Cap. Real': Number(p.capacidade_real) || 0,
    'Cap. Teorica': Number(p.cap_teorica) || 0,
  }))
  const demanda = Number(data.demanda_cidade) || 0
  const capTotal = prestadores.reduce((sum, p) => sum + (Number(p.capacidade_real) || 0), 0)
  const deficit = capTotal - demanda

  return (
    <div className="max-w-6xl flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/revisoes')} className="text-sm text-gray-500 hover:text-gray-800">Voltar para fila</button>
          <h1 className="text-xl font-bold text-gray-900 mt-2">{data.cidade} <span className="text-gray-400 text-base">{data.uf}</span></h1>
          <p className="text-sm text-gray-500">{data.tipo_servico} - Consultor: {data.consultor?.nome || '-'}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={data.status_resultado} />
          <RevisaoBadge status={data.status_revisao} />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500">Demanda</p>
          <p className="text-2xl font-bold text-gray-900">{fmt.numero(demanda, 0)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500">Capacidade real</p>
          <p className="text-2xl font-bold text-gray-900">{fmt.numero(capTotal, 0)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500">Indice</p>
          <p className="text-2xl font-bold text-gray-900">{fmt.indice(data.indice_capacidade)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500">{deficit >= 0 ? 'Sobra' : 'Deficit'}</p>
          <p className={`text-2xl font-bold ${deficit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt.numero(Math.abs(deficit), 0)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Capacidade por prestador</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Cap. Teorica" fill="#94A3B8" />
                <Bar dataKey="Cap. Real" fill="#0F766E" />
                <ReferenceLine y={demanda} label="Demanda" stroke="#D97706" strokeDasharray="4 4" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Prestador', 'Prof.', 'Vol. MAWDY', 'Cap. Teorica', 'Cap. Real', 'Recusas', 'NPS'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prestadores.map(p => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{p.nome_prestador}</td>
                    <td className="px-4 py-3">{p.qtd_profissionais}</td>
                    <td className="px-4 py-3">{fmt.numero(p.volume_mawdy, 1)}</td>
                    <td className="px-4 py-3">{fmt.numero(p.cap_teorica, 1)}</td>
                    <td className="px-4 py-3 font-semibold">{fmt.numero(p.capacidade_real, 1)}</td>
                    <td className="px-4 py-3">{fmt.numero(p.pct_recusas, 1)}%</td>
                    <td className="px-4 py-3">{fmt.numero(p.nps, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
            <h2 className="font-semibold text-gray-800">Acao de revisao</h2>
            <Button onClick={() => revisar.mutate()} disabled={data.status_revisao === 'REVISADO' || revisar.isPending}>
              Marcar como revisado
            </Button>
            <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Motivo do ajuste</label>
              <select value={motivo} onChange={e => setMotivo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none h-28"
                placeholder="Detalhe o que o consultor precisa ajustar..."
              />
              <Button variant="secondary" onClick={() => ajuste.mutate()} disabled={!comentario.trim() || ajuste.isPending}>
                Solicitar ajuste
              </Button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Historico de eventos</h2>
            <div className="flex flex-col gap-3">
              {(eventos || []).map(e => (
                <div key={e.id} className="border-l-2 border-red-200 pl-3">
                  <p className="text-sm font-medium text-gray-800">{e.tipo}</p>
                  <p className="text-xs text-gray-500">{e.usuario?.nome || 'Sistema'} - {new Date(e.created_at).toLocaleString('pt-BR')}</p>
                  {e.comentario && <p className="text-xs text-gray-600 mt-1">{e.comentario}</p>}
                </div>
              ))}
              {(!eventos || eventos.length === 0) && (
                <p className="text-sm text-gray-500">Nenhum evento registrado.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
