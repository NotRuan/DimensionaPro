const supabase = require('../config/supabase')
const { calcularJanela } = require('../utils/janelaReferencia')
const { ERRORS } = require('../utils/errors')

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
  const janela = calcularJanela(6)

  const { data, error } = await supabase.rpc('buscar_volumetria', {
    p_cidade:      cidade.toUpperCase().trim(),
    p_idprestador: parseInt(idprestador),
    p_servico:     nome_servico.toUpperCase().trim(),
    p_ano_inicio:  janela.anoInicio,
    p_mes_inicio:  janela.mesInicio,
    p_ano_fim:     janela.anoFim,
    p_mes_fim:     janela.mesFim,
  })

  if (error) throw error
  if (!data || data.length === 0) {
    throw ERRORS.PRESTADOR_NAO_ENCONTRADO(idprestador, nome_servico, cidade)
  }

  const row = data[0]
  const resultado = {
    idprestador:         parseInt(idprestador),
    nome_prestador:      row.nome_prestador,
    nome_servico:        nome_servico.toUpperCase(),
    volume_medio_mensal: parseFloat(row.volume_medio_mensal),
    meses_encontrados:   parseInt(row.meses_encontrados),
    janela_inicio:       janela.label.split(' a ')[0],
    janela_fim:          janela.label.split(' a ')[1],
    janela_label:        janela.label,
  }

  if (resultado.meses_encontrados < 6) {
    resultado.aviso = `Apenas ${resultado.meses_encontrados} meses de dados disponíveis. A média pode não ser representativa.`
  }

  return resultado
}

async function buscarSugestoes({ cidade, nome_servico, q }) {
  const termo = String(q || '').trim()
  if (termo.length < 2) return []

  let query = supabase
    .from('prestadores')
    .select('idprestador, nome_prestador, cidade, uf, nome_servico')
    .eq('cidade', cidade.toUpperCase().trim())
    .eq('nome_servico', nome_servico.toUpperCase().trim())
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
        nome_servico: p.nome_servico,
      })
    }
  })

  return Array.from(map.values()).slice(0, 10)
}

module.exports = { listarCidades, buscarVolumetria, buscarSugestoes }
