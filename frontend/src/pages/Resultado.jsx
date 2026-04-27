import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDimensionamentoStore } from '../store/dimensionamentoStore'
import { dimensionamentosService } from '../services/dimensionamentos.service'
import { exportarPDF } from '../utils/exportPDF'
import { exportarExcel } from '../utils/exportExcel'
import { GraficoCapacidade } from '../components/dimensionamento/ResultadoFinal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ProgressSteps } from '../components/layout/ProgressSteps'
import { useToast } from '../components/ui/Toast'
import { fmt } from '../utils/formatters'
import { clearAutoSave } from '../hooks/useAutoSave'

const AUTO_SAVE_KEY = 'dimensionamento-rascunho'

const STATUS_CONFIG = {
  ADEQUADO:        { label: 'Adequado',         bg: 'bg-green-50',  border: 'border-green-300', text: 'text-green-800' },
  ATENCAO:         { label: 'Atenção',           bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800' },
  SUBDIMENSIONADO: { label: 'Subdimensionado',   bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-800' },
}

export default function Resultado() {
  const store = useDimensionamentoStore()
  const navigate = useNavigate()
  const toast = useToast()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const resultado = store.resultado
  const prestadores = store.prestadores.filter(p => p.status === 'completo')

  const handleCalcular = () => {
    if (!store.demanda) return
    store.calcularResultado()
  }

  function buildPayload() {
    const prestadoresDim = prestadores.map(p => ({
      idprestador:          p.idprestador,
      nome_prestador:       p.nome_prestador,
      tipo_servico:         p.tipo_servico,
      volume_mawdy:         p.volume_mawdy,
      qtd_profissionais:    p.qtd_profissionais,
      servicos_por_dia:     p.servicos_por_dia,
      volumetria_total:     p.volumetria_total,
      servicos_diarios:     p.servicos_diarios,
      capacidade_mensal:    p.capacidade_mensal,
      dedicacao_mawdy:      p.dedicacao_mawdy,
      pct_mawdy_capacidade: p.pct_mawdy_capacidade,
      cap_teorica:          p.cap_teorica,
      pct_recusas:          p.pct_recusas,
      reclamacoes_ratio:    p.reclamacoes_ratio,
      tempo_chegada_min:    p.tempo_chegada_min,
      pct_deslocamento:     p.pct_deslocamento,
      pct_reembolso:        p.pct_reembolso,
      nps:                  p.nps,
      cf_recusas:           p.cf_recusas,
      cf_reclamacoes:       p.cf_reclamacoes,
      cf_tempo_chegada:     p.cf_tempo_chegada,
      cf_deslocamento:      p.cf_deslocamento,
      cf_reembolso:         p.cf_reembolso,
      cf_nps:               p.cf_nps,
      cf_seguranca:         p.cf_seguranca,
      capacidade_real:      p.capacidade_real,
    }))
    return {
      cidade:            store.cidade,
      uf:                store.uf,
      tipo_servico:      store.tipoServico,
      demanda_cidade:    parseFloat(store.demanda),
      indice_capacidade: resultado.indice,
      status_resultado:  resultado.status,
      janela_inicio:     `${store.janela.inicio.ano}-${String(store.janela.inicio.mesn).padStart(2,'0')}-01`,
      janela_fim:        `${store.janela.fim.ano}-${String(store.janela.fim.mesn).padStart(2,'0')}-01`,
      prestadores:       prestadoresDim,
      status_revisao:    'RASCUNHO',
    }
  }

  const concluir = () => {
    clearAutoSave(AUTO_SAVE_KEY)
    store.resetar()
    navigate('/dashboard')
  }

  const handleSalvar = async () => {
    if (!resultado) return
    setSalvando(true)
    setErro('')
    try {
      const payload = buildPayload()
      if (store.dimensionamentoId) {
        await dimensionamentosService.atualizar(store.dimensionamentoId, payload)
      } else {
        await dimensionamentosService.criar(payload)
      }
      toast(store.dimensionamentoId ? 'Dimensionamento atualizado!' : 'Rascunho salvo!', 'success')
      concluir()
    } catch (e) {
      setErro(e.response?.data?.error?.message || 'Erro ao salvar dimensionamento')
    } finally {
      setSalvando(false)
    }
  }

  const handleSubmeter = async () => {
    if (!resultado) return
    setSalvando(true)
    setErro('')
    try {
      const payload = buildPayload()
      const res = store.dimensionamentoId
        ? await dimensionamentosService.atualizar(store.dimensionamentoId, payload)
        : await dimensionamentosService.criar(payload)
      const id = store.dimensionamentoId || res.data?.data?.id || res.data?.id
      if (!id) throw new Error('ID não retornado pelo servidor')
      await dimensionamentosService.submeter(id)
      toast('Dimensionamento submetido para revisão!', 'success')
      concluir()
    } catch (e) {
      setErro(e.response?.data?.error?.message || 'Erro ao submeter para revisão')
    } finally {
      setSalvando(false)
    }
  }

  const cfg = resultado?.status ? STATUS_CONFIG[resultado.status] : null
  const demandaNumerica = parseFloat(store.demanda) || 0
  const saldoCapacidade = resultado ? resultado.cap_total - demandaNumerica : 0
  const prestadorCritico = prestadores
    .slice()
    .sort((a, b) => (a.capacidade_real || 0) - (b.capacidade_real || 0))[0]

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <ProgressSteps current={3} />
        <h1 className="text-xl font-bold text-gray-900 mt-4">Resultado do Dimensionamento</h1>
        <p className="text-gray-500 text-sm">{store.cidade} — {store.tipoServico === 'ELETRICISTA' ? 'Eletricista' : 'Encanador'} · {store.janela?.label}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
        <Input
          label="Demanda da Cidade (serviços/mês)"
          type="number"
          required
          value={store.demanda}
          onChange={e => store.setDemanda(e.target.value)}
          placeholder="Ex: 450"
        />
        <Button onClick={handleCalcular} disabled={!store.demanda} variant="secondary">
          Calcular Índice de Capacidade
        </Button>
      </div>

      {resultado && cfg && (
        <>
          <div className={`rounded-xl border p-5 flex flex-col gap-1 ${cfg.bg} ${cfg.border}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${cfg.text}`}>Status</p>
            <p className={`text-2xl font-bold ${cfg.text}`}>{cfg.label}</p>
            <div className="flex gap-6 mt-2">
              <div>
                <p className="text-xs text-gray-500">Índice de Capacidade</p>
                <p className={`text-xl font-bold ${cfg.text}`}>{fmt.indice(resultado.indice)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Capacidade Total</p>
                <p className="text-xl font-bold text-gray-800">{fmt.numero(resultado.cap_total, 0)} serv/mês</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Demanda</p>
                <p className="text-xl font-bold text-gray-800">{fmt.numero(parseFloat(store.demanda), 0)} serv/mês</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-white/70 border border-white px-3 py-2 text-sm">
              {saldoCapacidade >= 0 ? (
                <p className="text-gray-700">Sobra estimada de <strong>{fmt.numero(saldoCapacidade, 0)} serv/mÃªs</strong> em relacao a demanda informada.</p>
              ) : (
                <p className="text-gray-700">Deficit estimado de <strong>{fmt.numero(Math.abs(saldoCapacidade), 0)} serv/mÃªs</strong>. Considere adicionar prestadores ou revisar disponibilidade/equipe.</p>
              )}
              {prestadorCritico && (
                <p className="text-gray-600 mt-1">Menor capacidade real: <strong>{prestadorCritico.nome_prestador}</strong> ({fmt.numero(prestadorCritico.capacidade_real, 1)} serv/mÃªs).</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Capacidade por Prestador</p>
            <GraficoCapacidade prestadores={prestadores} demanda={store.demanda} />
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>
          )}
        </>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/dimensionamento/qualidade')}>
            ← Voltar
          </Button>
          <Button variant="secondary" onClick={() => exportarPDF(store)} disabled={!resultado}>
            📄 PDF
          </Button>
          <Button variant="secondary" onClick={() => exportarExcel(store)} disabled={!resultado}>
            📊 Excel
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleSalvar} disabled={!resultado || salvando}>
            {store.dimensionamentoId ? 'Salvar Alteracoes' : 'Salvar Rascunho'}
          </Button>
          <Button onClick={handleSubmeter} disabled={!resultado || salvando}>
            {salvando ? 'Salvando…' : 'Salvar e Submeter →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
