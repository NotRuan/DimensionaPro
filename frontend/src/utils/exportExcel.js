import * as XLSX from 'xlsx'

export function exportarExcel(store) {
  const { cidade, tipoServico, janela, prestadores, demanda, resultado } = store
  const wb = XLSX.utils.book_new()

  const resumo = [
    ['Cidade',               cidade],
    ['Serviço',              tipoServico],
    ['Período de referência', janela.label],
    ['Demanda da cidade',    parseFloat(demanda) || 0],
    ['Índice de Capacidade', resultado?.indice?.toFixed(2)],
    ['Status',               resultado?.status],
  ]

  const detalhes = prestadores.map(p => ({
    'Código':           p.idprestador,
    'Nome':             p.nome_prestador,
    'Profissionais':    p.qtd_profissionais,
    'Volume MAWDY':     p.volume_mawdy,
    'Cap. Teórica':     p.cap_teorica?.toFixed(2),
    'Cap. Real':        p.capacidade_real?.toFixed(2),
    '% MAWDY Cap.':     (p.pct_mawdy_capacidade * 100)?.toFixed(1) + '%',
    'NPS':              p.nps,
    '% Recusas':        p.pct_recusas,
    'Reclamações':      p.reclamacoes_ratio,
    'TMC (min)':        p.tempo_chegada_min,
    '% Deslocamento':   p.pct_deslocamento,
    '% Reembolso':      p.pct_reembolso,
  }))

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo),    'Resumo')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalhes), 'Prestadores')
  XLSX.writeFile(wb, `Dimensionamento_${cidade}_${tipoServico}.xlsx`)
}
