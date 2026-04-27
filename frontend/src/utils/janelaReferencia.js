const MESES_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

export function calcularJanela6Meses(dataAtual = new Date()) {
  const ref = new Date(dataAtual)
  ref.setDate(1)
  ref.setMonth(ref.getMonth() - 1)

  const meses = []
  for (let i = 0; i < 6; i++) {
    meses.push({ mesn: ref.getMonth() + 1, mes: MESES_PT[ref.getMonth()], ano: ref.getFullYear() })
    ref.setMonth(ref.getMonth() - 1)
  }

  return {
    meses,
    inicio: meses[5],
    fim:    meses[0],
    label:  `${meses[5].mes}/${meses[5].ano} a ${meses[0].mes}/${meses[0].ano}`,
  }
}
