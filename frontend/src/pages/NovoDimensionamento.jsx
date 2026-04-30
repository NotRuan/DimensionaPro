import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useDimensionamentoStore } from '../store/dimensionamentoStore'
import { prestadoresService } from '../services/prestadores.service'
import { PrestadorCard } from '../components/dimensionamento/PrestadorCard'
import { Button } from '../components/ui/Button'
import { ProgressSteps } from '../components/layout/ProgressSteps'
import { SERVICOS } from '../constants'
import { useAutoSave, loadAutoSave, clearAutoSave } from '../hooks/useAutoSave'

const AUTO_SAVE_KEY = 'dimensionamento-rascunho'
const SERVICO_COMBINADO = 'ELETRICISTA_ENCANADOR'

export default function NovoDimensionamento() {
  const store = useDimensionamentoStore()
  const navigate = useNavigate()

  const { data: cidadesData, isLoading: carregandoCidades, isError: erroCidades } = useQuery({
    queryKey: ['cidades'],
    queryFn: () => prestadoresService.cidades().then(r => r.data.data),
  })

  const cidades = useMemo(() => [...(cidadesData || [])].sort((a, b) => {
    const cidadeCompare = String(a.cidade || '').localeCompare(String(b.cidade || ''), 'pt-BR')
    if (cidadeCompare !== 0) return cidadeCompare
    return String(a.uf || '').localeCompare(String(b.uf || ''), 'pt-BR')
  }), [cidadesData])

  useAutoSave(AUTO_SAVE_KEY, { cidade: store.cidade, uf: store.uf, tipoServico: store.tipoServico, prestadores: store.prestadores })

  useEffect(() => {
    const salvo = loadAutoSave(AUTO_SAVE_KEY)
    if (salvo && salvo.cidade && !store.cidade) {
      store.setCidade(salvo.cidade, salvo.uf)
      store.setTipoServico(SERVICO_COMBINADO)
    } else if (!store.tipoServico) {
      store.setTipoServico(SERVICO_COMBINADO)
    }
  }, [store])

  const podeAvancar = store.prestadores.some(p => p.status === 'completo')

  const handleCidadeSelect = (cidade) => {
    if (store.prestadores.length > 0 && cidade !== store.cidade) {
      const confirmar = window.confirm('Alterar a cidade vai limpar os prestadores adicionados. Deseja continuar?')
      if (!confirmar) return
      store.limparPrestadores()
    }
    const found = cidades.find(c => c.cidade === cidade)
    store.setCidade(cidade, found?.uf || '')
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <ProgressSteps current={1} />
        <h1 className="text-xl font-bold text-gray-900 mt-4">{store.modoEdicao ? 'Editar Dimensionamento' : 'Novo Dimensionamento'}</h1>
        <p className="text-gray-500 text-sm">Preencha os dados do prestador para calcular o indice de capacidade</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Cidade <span className="text-teal-700">*</span></label>
            <select
              value={store.cidade}
              onChange={e => handleCidadeSelect(e.target.value)}
              disabled={carregandoCidades || erroCidades || cidades.length === 0}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
            >
              <option value="">
                {carregandoCidades ? 'Carregando cidades...' : 'Selecione uma cidade...'}
              </option>
              {cidades.map(c => (
                <option key={`${c.uf || 'UF'}-${c.cidade}`} value={c.cidade}>
                  {c.cidade}{c.uf ? ` - ${c.uf}` : ''}
                </option>
              ))}
            </select>
            {erroCidades && (
              <p className="text-xs text-red-600">Erro ao carregar cidades. Verifique o backend.</p>
            )}
            {!carregandoCidades && !erroCidades && cidades.length === 0 && (
              <p className="text-xs text-red-600">Nenhuma cidade cadastrada.</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Tipo de Servico <span className="text-teal-700">*</span></label>
            <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700">
              {SERVICOS[0].label}
            </div>
          </div>
        </div>

        {store.cidade && store.tipoServico && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
            Apenas os dados de 2026
          </div>
        )}
      </div>

      {store.cidade && store.tipoServico && (
        <>
          <div className="flex flex-col gap-3">
            {store.prestadores.map((p, i) => (
              <PrestadorCard
                key={p._id}
                prestador={p}
                index={i}
                cidade={store.cidade}
                tipoServico={store.tipoServico}
                onUpdate={store.atualizarPrestador}
                onRemove={store.removerPrestador}
                onDuplicate={store.duplicarPrestador}
              />
            ))}
          </div>

          <Button variant="secondary" onClick={store.adicionarPrestador}>
            + Adicionar Prestador
          </Button>
        </>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => { store.resetar(); clearAutoSave(AUTO_SAVE_KEY); navigate('/dashboard') }}>
          Cancelar
        </Button>
        <Button onClick={() => navigate('/dimensionamento/qualidade')} disabled={!podeAvancar}>
          Avancar para Dimensionamento
        </Button>
      </div>
    </div>
  )
}
