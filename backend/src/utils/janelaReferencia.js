/**
 * Retorna a janela dos últimos N meses fechados a partir de uma data de referência.
 * "Fechado" = exclui o mês corrente.
 *
 * Exemplo: chamado em abril/2026, n=6 →
 *   { anoInicio: 2025, mesInicio: 10, anoFim: 2026, mesFim: 3, label: 'out/2025 a mar/2026' }
 */
function calcularJanela(n = 6, dataRef = new Date()) {
  const MESES_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

  const ref = new Date(dataRef)
  ref.setDate(1)
  // último mês fechado = mês anterior ao atual
  ref.setMonth(ref.getMonth() - 1)

  const fim = { ano: ref.getFullYear(), mesn: ref.getMonth() + 1 }

  ref.setMonth(ref.getMonth() - (n - 1))
  const inicio = { ano: ref.getFullYear(), mesn: ref.getMonth() + 1 }

  const label =
    `${MESES_PT[inicio.mesn - 1]}/${inicio.ano} a ${MESES_PT[fim.mesn - 1]}/${fim.ano}`

  return {
    anoInicio:  inicio.ano,
    mesInicio:  inicio.mesn,
    anoFim:     fim.ano,
    mesFim:     fim.mesn,
    label,
  }
}

module.exports = { calcularJanela }
