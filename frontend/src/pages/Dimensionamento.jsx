import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDimensionamentoStore } from '../store/dimensionamentoStore'
import { MetricasQualidade } from '../components/dimensionamento/MetricasQualidade'
import { Button } from '../components/ui/Button'
import { ProgressSteps } from '../components/layout/ProgressSteps'

export default function Dimensionamento() {
  const store = useDimensionamentoStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!store.cidade || store.prestadores.length === 0) {
      navigate('/dimensionamento/novo')
    }
  }, [])

  const prestadores = store.prestadores.filter(p => p.status === 'completo')
  const temMetricasInvalidas = prestadores.some(p => (
    ['pct_recusas', 'pct_deslocamento', 'pct_reembolso'].some(k => p[k] !== '' && (Number(p[k]) < 0 || Number(p[k]) > 100)) ||
    (p.nps !== '' && (Number(p.nps) < -100 || Number(p.nps) > 100)) ||
    (p.tempo_chegada_min !== '' && Number(p.tempo_chegada_min) < 0) ||
    (p.reclamacoes_ratio !== '' && Number(p.reclamacoes_ratio) < 0)
  ))
  const podeAvancar = prestadores.length > 0 && !temMetricasInvalidas && prestadores.every(p => p.capacidade_real !== null)

  if (!store.cidade || store.prestadores.length === 0) return null

  const incompletos = store.prestadores.filter(p => p.status !== 'completo').length

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <ProgressSteps current={2} />
        <h1 className="text-xl font-bold text-gray-900 mt-4">Métricas de Qualidade</h1>
        <p className="text-gray-500 text-sm">Preencha os indicadores de qualidade de cada prestador</p>
      </div>

      {incompletos > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
          {incompletos} prestador(es) sem dados completos não aparecem aqui. Volte e preencha todos os campos obrigatórios.
        </div>
      )}

      {temMetricasInvalidas && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          Existem metricas fora da faixa permitida. Corrija os campos destacados para continuar.
        </div>
      )}

      {prestadores.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-500">
          <p className="font-medium">Nenhum prestador completo encontrado.</p>
          <p className="text-sm mt-1">Volte e preencha o código, profissionais e volumetria de pelo menos um prestador.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {prestadores.map(p => (
            <MetricasQualidade
              key={p._id}
              prestador={p}
              onUpdate={store.atualizarPrestador}
            />
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => navigate('/dimensionamento/novo')}>
          ← Voltar
        </Button>
        <Button onClick={() => navigate('/dimensionamento/resultado')} disabled={!podeAvancar}>
          Ver Resultado →
        </Button>
      </div>
    </div>
  )
}
