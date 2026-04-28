import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calcularIndiceCidade, calcularPrestador } from './calculos.js'

describe('calcularPrestador', () => {
  it('ignora reembolso na capacidade real do prestador', () => {
    const resultado = calcularPrestador({
      qtd_profissionais: 10,
      servicos_por_dia: 10,
      volume_mawdy: 100,
      volumetria_total: 100,
      tipo_servico: 'ELETRICISTA',
      pct_recusas: 0,
      reclamacoes_ratio: 0,
      tempo_chegada_min: 0,
      pct_deslocamento: 0,
      pct_reembolso: 100,
      nps: 100,
    })

    assert.equal(resultado.cap_teorica, 3000)
    assert.equal(resultado.capacidade_real, 2550)
    assert.equal(resultado.cf_reembolso, undefined)
  })
})

describe('calcularIndiceCidade', () => {
  it('classifica a cidade pela relacao capacidade real sobre demanda', () => {
    assert.deepEqual(
      calcularIndiceCidade([{ capacidade_real: 100 }], 100),
      { cap_total: 100, indice: 1, status: 'ADEQUADO' },
    )

    assert.deepEqual(
      calcularIndiceCidade([{ capacidade_real: 95 }], 100),
      { cap_total: 95, indice: 0.95, status: 'ATENCAO' },
    )

    assert.deepEqual(
      calcularIndiceCidade([{ capacidade_real: 89 }], 100),
      { cap_total: 89, indice: 0.89, status: 'SUBDIMENSIONADO' },
    )
  })

  it('classifica o caso dos screenshots como atencao', () => {
    const prestador = calcularPrestador({
      qtd_profissionais: 5,
      servicos_por_dia: 6,
      volume_mawdy: 10,
      volumetria_total: 100,
      tipo_servico: 'ELETRICISTA',
      pct_recusas: 15,
      reclamacoes_ratio: 0.5,
      tempo_chegada_min: 90,
      pct_deslocamento: 40,
      nps: 60,
    })

    const resultado = calcularIndiceCidade([prestador], 20)

    assert.equal(Number(resultado.cap_total.toFixed(1)), 19.4)
    assert.equal(Number(resultado.indice.toFixed(2)), 0.97)
    assert.equal(resultado.status, 'ATENCAO')
  })
})
