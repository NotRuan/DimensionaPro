import { create } from 'zustand'
import { calcularPrestador, calcularIndiceCidade } from '../utils/calculos'
import { calcularJanela6Meses } from '../utils/janelaReferencia'
import { useConfiguracoesStore } from './configuracoesStore'

const novoPrestador = (tipoServico) => ({
  _id:             crypto.randomUUID(),
  status:          'vazio',
  idprestador:     '',
  nome_prestador:  '',
  tipo_servico:    tipoServico,
  volume_mawdy:    null,
  meses_encontrados: null,
  aviso:           null,
  qtd_profissionais: '',
  servicos_por_dia:  6,
  volumetria_total:  '',
  servicos_diarios:     null,
  capacidade_mensal:    null,
  dedicacao_mawdy:      null,
  pct_mawdy_capacidade: null,
  pct_recusas:       '',
  reclamacoes_ratio: '',
  tempo_chegada_min: '',
  pct_deslocamento:  '',
  nps:               '',
  cf_recusas: null, cf_reclamacoes: null, cf_tempo_chegada: null,
  cf_deslocamento: null, cf_nps: null,
  cf_seguranca: null, cap_teorica: null, capacidade_real: null,
  expandido: true,
})

function montarJanela(dim) {
  if (!dim?.janela_inicio || !dim?.janela_fim) return calcularJanela6Meses()

  const inicio = new Date(dim.janela_inicio)
  const fim = new Date(dim.janela_fim)
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return calcularJanela6Meses()

  const pad = (n) => String(n).padStart(2, '0')
  const ini = { ano: inicio.getUTCFullYear(), mesn: inicio.getUTCMonth() + 1 }
  const fimObj = { ano: fim.getUTCFullYear(), mesn: fim.getUTCMonth() + 1 }
  return {
    inicio: ini,
    fim: fimObj,
    label: `${pad(ini.mesn)}/${ini.ano} a ${pad(fimObj.mesn)}/${fimObj.ano}`,
  }
}

function prestadorFromDim(p, tipoServico) {
  return {
    ...novoPrestador(tipoServico),
    ...p,
    _id: crypto.randomUUID(),
    status: p.capacidade_real != null ? 'completo' : 'encontrado',
    qtd_profissionais: p.qtd_profissionais ?? '',
    volumetria_total: p.volumetria_total ?? '',
    pct_recusas: p.pct_recusas ?? '',
    reclamacoes_ratio: p.reclamacoes_ratio ?? '',
    tempo_chegada_min: p.tempo_chegada_min ?? '',
    pct_deslocamento: p.pct_deslocamento ?? '',
    nps: p.nps ?? '',
  }
}

export const useDimensionamentoStore = create((set, get) => ({
  dimensionamentoId: null,
  modoEdicao: false,
  cidade:      '',
  uf:          '',
  tipoServico: '',
  janela:      calcularJanela6Meses(),
  prestadores: [],
  demanda:     '',
  resultado:   null,
  step:        1,

  setCidade:       (cidade, uf) => set({ cidade, uf }),
  setTipoServico:  (ts) => set({ tipoServico: ts }),
  setDemanda:      (d)  => set({ demanda: d }),

  adicionarPrestador: () => set(s => ({
    prestadores: [...s.prestadores, novoPrestador(s.tipoServico)]
  })),

  atualizarPrestador: (id, dados) => set(s => ({
    prestadores: s.prestadores.map(p => {
      if (p._id !== id) return p
      const atualizado = { ...p, ...dados }
      const hasVolume = atualizado.volume_mawdy != null && atualizado.volume_mawdy !== ''
      const hasProfissionais = atualizado.qtd_profissionais != null && atualizado.qtd_profissionais !== ''
      const hasVolumetria = atualizado.volumetria_total != null && atualizado.volumetria_total !== ''
      if (hasVolume && hasProfissionais && hasVolumetria) {
        const { tabela, coefSeguranca } = useConfiguracoesStore.getState()
        const calc = calcularPrestador(atualizado, { tabela, coefSeguranca })
        Object.assign(atualizado, calc)
        atualizado.status = 'completo'
      }
      return atualizado
    })
  })),

  removerPrestador:  (id) => set(s => ({ prestadores: s.prestadores.filter(p => p._id !== id) })),

  limparPrestadores: () => set({ prestadores: [], demanda: '', resultado: null }),

  duplicarPrestador: (id) => set(s => {
    const idx = s.prestadores.findIndex(p => p._id === id)
    if (idx === -1) return s
    const copia = { ...s.prestadores[idx], _id: crypto.randomUUID() }
    const novos = [...s.prestadores]
    novos.splice(idx + 1, 0, copia)
    return { prestadores: novos }
  }),

  calcularResultado: () => {
    const { prestadores, demanda } = get()
    const resultado = calcularIndiceCidade(prestadores, demanda)
    set({ resultado, step: 3 })
    return resultado
  },

  carregarDimensionamento: (dim) => set({
    dimensionamentoId: dim.id,
    modoEdicao: true,
    cidade: dim.cidade || '',
    uf: dim.uf || '',
    tipoServico: dim.tipo_servico || '',
    janela: montarJanela(dim),
    prestadores: (dim.prestadores_dim || []).map(p => prestadorFromDim(p, dim.tipo_servico)),
    demanda: dim.demanda_cidade != null ? String(dim.demanda_cidade) : '',
    resultado: dim.indice_capacidade != null ? {
      cap_total: (dim.prestadores_dim || []).reduce((sum, p) => sum + (Number(p.capacidade_real) || 0), 0),
      indice: Number(dim.indice_capacidade),
      status: dim.status_resultado,
    } : null,
    step: 1,
  }),

  resetar: () => set({
    dimensionamentoId: null, modoEdicao: false,
    cidade: '', uf: '', tipoServico: '', prestadores: [],
    demanda: '', resultado: null, step: 1,
    janela: calcularJanela6Meses(),
  }),
}))
