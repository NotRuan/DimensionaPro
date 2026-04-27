import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { notificacoesService } from '../services/notificacoes.service'
import { dimensionamentosService } from '../services/dimensionamentos.service'
import { useDimensionamentoStore } from '../store/dimensionamentoStore'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { PERFIS } from '../constants'

export default function Notificacoes() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const perfil = useAuthStore(s => s.usuario?.perfil)
  const carregarDimensionamento = useDimensionamentoStore(s => s.carregarDimensionamento)
  const [abrindoId, setAbrindoId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: () => notificacoesService.listar().then(r => r.data.data),
  })

  const marcarLida = async (id) => {
    await notificacoesService.marcarLida(id)
    qc.invalidateQueries({ queryKey: ['notificacoes'] })
    qc.invalidateQueries({ queryKey: ['notificacoes-nao-lidas'] })
  }

  const abrirDimensionamento = async (notificacao) => {
    const dimId = notificacao.dimensionamento_id
    if (!dimId) return
    setAbrindoId(notificacao.id)
    try {
      await marcarLida(notificacao.id)
      if ([PERFIS.GERENTE, PERFIS.ADM].includes(perfil)) {
        navigate(`/revisoes/${dimId}`)
        return
      }
      const { data: res } = await dimensionamentosService.buscarPorId(dimId)
      carregarDimensionamento(res.data)
      navigate('/dimensionamento/novo')
    } finally {
      setAbrindoId(null)
    }
  }

  return (
    <div className="max-w-3xl flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Notificacoes</h1>
        <p className="text-sm text-gray-500">Acompanhe retornos de revisao e ajustes solicitados.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-8"><Spinner /></div>
        ) : !data || data.length === 0 ? (
          <p className="px-4 py-8 text-center text-gray-400">Nenhuma notificacao encontrada.</p>
        ) : (
          data.map(n => (
            <div key={n.id} className={`px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-4 ${n.lida ? 'bg-white' : 'bg-red-50/50'}`}>
              <div>
                <p className={`text-sm ${n.lida ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>{n.mensagem}</p>
                {n.dimensionamento && (
                  <p className="text-xs text-gray-500 mt-1">
                    {n.dimensionamento.cidade} - {n.dimensionamento.tipo_servico} - {n.dimensionamento.status_resultado}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!n.lida && (
                  <Button size="sm" variant="ghost" onClick={() => marcarLida(n.id)}>
                    Marcar lida
                  </Button>
                )}
                {n.dimensionamento_id && (
                  <Button size="sm" variant="secondary" onClick={() => abrirDimensionamento(n)} disabled={abrindoId === n.id}>
                    {abrindoId === n.id ? 'Abrindo...' : 'Abrir'}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
