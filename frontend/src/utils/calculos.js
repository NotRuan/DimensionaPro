import { getCoeficiente, getCoeficienteFromTabela, COEF_SEGURANCA } from './coeficientes'

export function calcularPrestador(dados, config = {}) {
  const {
    qtd_profissionais, servicos_por_dia = 6,
    volume_mawdy, volumetria_total, tipo_servico,
    pct_recusas, reclamacoes_ratio, tempo_chegada_min,
    pct_deslocamento, pct_reembolso, nps,
  } = dados

  const obterCoef = config.tabela
    ? (metrica, valor) => getCoeficienteFromTabela(metrica, valor, config.tabela)
    : getCoeficiente

  const qp  = parseFloat(qtd_profissionais) || 0
  const spd = parseFloat(servicos_por_dia)  || 6
  const vm  = parseFloat(volume_mawdy)      || 0
  const vt  = parseFloat(volumetria_total)  || 0

  const servicos_diarios      = qp * spd
  const capacidade_mensal     = servicos_diarios * 30
  const dedicacao_mawdy       = vt > 0 ? vm / vt : 0
  const total_recursos_mapfre = qp * dedicacao_mawdy
  const cap_teorica           = total_recursos_mapfre * spd * 30
  const pct_mawdy_capacidade  = capacidade_mensal > 0 ? vm / capacidade_mensal : 0

  const cf_recusas       = obterCoef('recusas',      pct_recusas)
  const cf_reclamacoes   = obterCoef('reclamacoes',  reclamacoes_ratio)
  const cf_tempo_chegada = obterCoef('tempoChegada', tempo_chegada_min)
  const cf_deslocamento  = obterCoef('deslocamento', pct_deslocamento)
  const cf_reembolso     = obterCoef('reembolso',    pct_reembolso)
  const cf_nps           = obterCoef('nps',          nps)
  const coefSeg = config.coefSeguranca ?? COEF_SEGURANCA
  const cf_seguranca = coefSeg[tipo_servico] ?? 0.85

  const coefs = [cf_recusas, cf_reclamacoes, cf_tempo_chegada, cf_deslocamento, cf_reembolso, cf_nps]
  const todosPreenchidos = coefs.every(c => c !== null)

  const capacidade_real = todosPreenchidos
    ? coefs.reduce((acc, c) => acc * c, cap_teorica) * cf_seguranca
    : null

  return {
    servicos_diarios, capacidade_mensal, dedicacao_mawdy,
    pct_mawdy_capacidade, cap_teorica,
    cf_recusas, cf_reclamacoes, cf_tempo_chegada,
    cf_deslocamento, cf_reembolso, cf_nps, cf_seguranca,
    capacidade_real,
  }
}

export function calcularIndiceCidade(prestadores, demanda) {
  const cap_total = prestadores.reduce((s, p) => s + (p.capacidade_real ?? 0), 0)
  const dem = parseFloat(demanda) || 0
  const indice = dem > 0 ? cap_total / dem : null

  // indice = capacidade / demanda
  // > 1.0  → mais capacidade que demanda → ADEQUADO
  // 0.9–1.0 → atenção
  // < 0.9  → capacidade abaixo da demanda → SUBDIMENSIONADO
  const status =
    indice === null  ? null              :
    indice >= 1.0    ? 'ADEQUADO'        :
    indice >= 0.9    ? 'ATENCAO'         :
                       'SUBDIMENSIONADO'

  return { cap_total, indice, status }
}
