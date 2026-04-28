export const TABELA_COEFICIENTES = {
  recusas: [
    { min: 0,     max: 15,       coef: 1.00 },
    { min: 15.01, max: 25,       coef: 0.90 },
    { min: 25.01, max: 31,       coef: 0.75 },
    { min: 31.01, max: 40,       coef: 0.50 },
    { min: 40.01, max: Infinity, coef: 0.10 },
  ],
  reclamacoes: [
    { min: 0,    max: 0.40,      coef: 1.00 },
    { min: 0.41, max: 1.00,      coef: 0.75 },
    { min: 1.01, max: 1.60,      coef: 0.50 },
    { min: 1.61, max: Infinity,  coef: 0.10 },
  ],
  tempoChegada: [
    { min: 0,   max: 30,         coef: 1.00 },
    { min: 31,  max: 60,         coef: 0.90 },
    { min: 61,  max: 90,         coef: 0.75 },
    { min: 91,  max: 120,        coef: 0.50 },
    { min: 121, max: Infinity,   coef: 0.10 },
  ],
  deslocamento: [
    { min: 0,     max: 0,        coef: 1.00 },
    { min: 0.01,  max: 10,       coef: 0.90 },
    { min: 10.01, max: 25,       coef: 0.75 },
    { min: 25.01, max: 50,       coef: 0.50 },
    { min: 50.01, max: Infinity, coef: 0.10 },
  ],
  nps: [
    { min: 70,    max: 100,      coef: 1.00 },
    { min: 60,    max: 69.99,    coef: 0.90 },
    { min: 50,    max: 59.99,    coef: 0.75 },
    { min: -100,  max: 49.99,    coef: 0.10 },
  ],
}

export const COEF_SEGURANCA = { ELETRICISTA: 0.85, ENCANADOR: 0.85 }

export function getCoeficiente(metrica, valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const num = parseFloat(valor)
  if (isNaN(num)) return null
  const range = TABELA_COEFICIENTES[metrica]?.find(r => num >= r.min && num <= r.max)
  return range?.coef ?? null
}

export function getCoeficienteFromTabela(metrica, valor, tabela) {
  if (valor === null || valor === undefined || valor === '') return null
  const num = parseFloat(valor)
  if (isNaN(num)) return null
  const ranges = tabela?.[metrica]
  if (!ranges) return null
  const range = ranges.find(r => num >= r.min && (r.max === null || num <= r.max))
  return range?.coef ?? null
}

export const TOOLTIPS = {
  recusas:      'Percentual de servicos recusados. 0-15% -> 1,0 | 16-25% -> 0,9 | 26-31% -> 0,75 | 32-40% -> 0,5 | >40% -> 0,1',
  reclamacoes:  'Indice de reclamacoes (ratio). 0-0,4 -> 1,0 | 0,5-1,0 -> 0,75 | 1,1-1,6 -> 0,5 | >1,6 -> 0,1',
  tempoChegada: 'Tempo medio de chegada em minutos. 0-30 -> 1,0 | 31-60 -> 0,9 | 61-90 -> 0,75 | 91-120 -> 0,5 | >120 -> 0,1',
  deslocamento: 'Percentual de servicos com deslocamento cobrado. 0% -> 1,0 | 1-10% -> 0,9 | 11-25% -> 0,75 | 26-50% -> 0,5 | >50% -> 0,1',
  nps:          'Net Promoter Score. 70-100 -> 1,0 | 60-69 -> 0,9 | 50-59 -> 0,75 | <50 -> 0,1',
}
