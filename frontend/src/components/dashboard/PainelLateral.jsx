import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { dimensionamentosService } from '../../services/dimensionamentos.service'
import { StatusBadge, RevisaoBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import { useToast } from '../ui/Toast'
import { useAuthStore } from '../../store/authStore'
import { useDimensionamentoStore } from '../../store/dimensionamentoStore'
import { useState } from 'react'
import { fmt } from '../../utils/formatters'
import { PERFIS } from '../../constants'

const STATUS_EDITAVEIS = ['RASCUNHO', 'AJUSTE_SOLICITADO', 'PENDENTE']

export function PainelLateral({ cidade, onFechar }) {
  const toast = useToast()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const perfil = useAuthStore(s => s.usuario?.perfil)
  const carregarDimensionamento = useDimensionamentoStore(s => s.carregarDimensionamento)
  const [comentario, setComentario] = useState('')
  const [ajusteAberto, setAjusteAberto] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['mapa-cidade', cidade],
    queryFn: () => dimensionamentosService.listar({ cidade }).then(r => r.data.data),
    enabled: !!cidade,
  })

  const handleRevisar = async (id) => {
    try {
      await dimensionamentosService.revisar(id)
      qc.invalidateQueries({ queryKey: ['mapa-cidade', cidade] })
      qc.invalidateQueries({ queryKey: ['revisoes'] })
      qc.invalidateQueries({ queryKey: ['gerente-dashboard'] })
      toast('Marcado como revisado!', 'success')
    } catch { toast('Erro ao revisar', 'error') }
  }

  const handleAjuste = async (id) => {
    if (!comentario.trim()) { toast('Digite um comentario', 'warning'); return }
    try {
      await dimensionamentosService.ajuste(id, comentario)
      qc.invalidateQueries({ queryKey: ['mapa-cidade', cidade] })
      qc.invalidateQueries({ queryKey: ['revisoes'] })
      qc.invalidateQueries({ queryKey: ['gerente-dashboard'] })
      setAjusteAberto(null)
      setComentario('')
      toast('Ajuste solicitado!', 'success')
    } catch { toast('Erro ao solicitar ajuste', 'error') }
  }

  const handleEditar = async (id) => {
    try {
      const { data: res } = await dimensionamentosService.buscarPorId(id)
      carregarDimensionamento(res.data)
      navigate('/dimensionamento/novo')
    } catch {
      toast('Erro ao abrir dimensionamento', 'error')
    }
  }

  return (
    <div className="fixed right-0 top-14 h-[calc(100vh-56px)] w-80 bg-white border-l border-gray-200 shadow-xl z-40 overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-900">{cidade}</h3>
        <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Spinner /></div>
      ) : (
        <div className="p-4 flex flex-col gap-4">
          {(data || []).map(d => (
            <div key={d.id} className="border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{d.tipo_servico}</span>
                <StatusBadge status={d.status_resultado} />
              </div>
              <p className="text-xs text-gray-500">Indice: {fmt.indice(d.indice_capacidade)}</p>
              <p className="text-xs text-gray-500">Consultor: {d.consultor?.nome}</p>
              <RevisaoBadge status={d.status_revisao} />

              {perfil === PERFIS.CONSULTOR && STATUS_EDITAVEIS.includes(d.status_revisao) && (
                <Button size="sm" variant="secondary" onClick={() => handleEditar(d.id)}>
                  Editar Dimensionamento
                </Button>
              )}

              {[PERFIS.GERENTE, PERFIS.ADM].includes(perfil) && d.status_revisao === 'PENDENTE' && (
                <div className="flex flex-wrap gap-2 mt-1">
                  <Button size="sm" onClick={() => navigate(`/revisoes/${d.id}`)}>Detalhe</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleRevisar(d.id)}>Revisado</Button>
                  <Button size="sm" variant="ghost" onClick={() => setAjusteAberto(d.id)}>Ajuste</Button>
                </div>
              )}

              {ajusteAberto === d.id && (
                <div className="flex flex-col gap-2 mt-1">
                  <textarea
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                    placeholder="Descreva o ajuste necessario..."
                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded resize-none h-20 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAjuste(d.id)}>Enviar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setAjusteAberto(null)}>Cancelar</Button>
                  </div>
                </div>
              )}

              {d.comentario_revisao && (
                <p className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                  {d.comentario_revisao}
                </p>
              )}
            </div>
          ))}
          {(!data || data.length === 0) && (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum dimensionamento encontrado para esta cidade.</p>
          )}
          <button
            onClick={() => navigate(`/historico/${encodeURIComponent(cidade)}`)}
            className="w-full mt-3 text-sm text-red-600 border border-red-200 rounded-lg py-1.5 hover:bg-red-50"
          >
            Ver Histórico
          </button>
        </div>
      )}
    </div>
  )
}
