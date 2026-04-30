const supabase = require('../config/supabase')
const { ERRORS } = require('../utils/errors')

const ANO_BASE_DIMENSIONAMENTO = 2026
const SERVICO_COMBINADO = 'ELETRICISTA_ENCANADOR'
const SERVICOS_DIMENSIONAMENTO = ['ELETRICISTA', 'ENCANADOR']

async function listarCidades() {
  const pageSize = 1000
  let from = 0
  let rows = []

  while (true) {
    const { data, error } = await supabase
      .from('cidades')
      .select('*')
      .range(from, from + pageSize - 1)

    if (error) throw error

    rows = rows.concat(data || [])
    if (!data || data.length < pageSize) break

    from += pageSize
  }

  const map = new Map()
  rows.forEach(r => {
    const cidade = (r.cidade || r.nome || r.nome_cidade || r.municipio || r.municipio_nome)?.trim()
    const uf = (r.uf || r.estado || r.sigla_uf)?.trim() || null
    if (cidade && r.ativo !== false) map.set(cidade, uf)
  })

  return Array.from(map, ([cidade, uf]) => ({ cidade, uf }))
    .sort((a, b) => a.cidade.localeCompare(b.cidade, 'pt-BR'))
}

async function buscarVolumetria({ cidade, idprestador, nome_servico }) {
  const cidadeNormalizada = cidade.toUpperCase().trim()
  const servico = String(nome_servico || '').toUpperCase().trim()
  const servicos = servico === SERVICO_COMBINADO ? SERVICOS_DIMENSIONAMENTO : [servico]

  const { data, error } = await supabase
    .from('prestadores')
    .select('nome_prestador, nome_servico, servicos_criados, mesn, ano')
    .eq('cidade', cidadeNormalizada)
    .eq('idprestador', parseInt(idprestador))
    .eq('ano', ANO_BASE_DIMENSIONAMENTO)
    .in('nome_servico', servicos)

  if (error) throw error
  if (!data || data.length === 0) {
    throw ERRORS.PRESTADOR_NAO_ENCONTRADO(idprestador, nome_servico, cidade)
  }

  const totalPorMes = new Map()
  data.forEach(row => {
    const mes = Number(row.mesn)
    if (!mes) return
    totalPorMes.set(mes, (totalPorMes.get(mes) || 0) + (Number(row.servicos_criados) || 0))
  })

  const meses = Array.from(totalPorMes.values())
  const volumeMedio = meses.length > 0
    ? Math.round(meses.reduce((sum, total) => sum + total, 0) / meses.length)
    : 0

  const resultado = {
    idprestador:         parseInt(idprestador),
    nome_prestador:      data[0].nome_prestador,
    nome_servico:        servico,
    volume_medio_mensal: volumeMedio,
    meses_encontrados:   meses.length,
    janela_inicio:       `jan/${ANO_BASE_DIMENSIONAMENTO}`,
    janela_fim:          `dez/${ANO_BASE_DIMENSIONAMENTO}`,
    janela_label:        `Apenas os dados de ${ANO_BASE_DIMENSIONAMENTO}`,
  }

  return resultado
}

async function buscarSugestoes({ cidade, nome_servico, q }) {
  const termo = String(q || '').trim()
  if (termo.length < 2) return []

  const servico = String(nome_servico || '').toUpperCase().trim()
  const servicos = servico === SERVICO_COMBINADO ? SERVICOS_DIMENSIONAMENTO : [servico]

  let query = supabase
    .from('prestadores')
    .select('idprestador, nome_prestador, cidade, uf, nome_servico')
    .eq('cidade', cidade.toUpperCase().trim())
    .eq('ano', ANO_BASE_DIMENSIONAMENTO)
    .in('nome_servico', servicos)
    .limit(50)

  query = /^\d+$/.test(termo)
    ? query.eq('idprestador', parseInt(termo))
    : query.ilike('nome_prestador', `%${termo}%`)

  const { data, error } = await query
  if (error) throw error

  const map = new Map()
  ;(data || []).forEach(p => {
    if (!map.has(p.idprestador)) {
      map.set(p.idprestador, {
        idprestador: p.idprestador,
        nome_prestador: p.nome_prestador,
        cidade: p.cidade,
        uf: p.uf,
        nome_servico: servico,
      })
    }
  })

  return Array.from(map.values()).slice(0, 10)
}

module.exports = { listarCidades, buscarVolumetria, buscarSugestoes }
