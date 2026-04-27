const { parse } = require('csv-parse/sync')
const supabase = require('../config/supabase')
const { validarCabecalho, validarLinha } = require('../utils/csvValidator')
const { ERRORS } = require('../utils/errors')

async function processarCSV(buffer, contexto = {}) {
  const texto = buffer.toString('utf-8')

  let registros
  try {
    registros = parse(texto, { columns: true, skip_empty_lines: true, trim: true })
  } catch {
    throw ERRORS.CSV_COLUNAS_INVALIDAS('Arquivo CSV inválido ou malformado')
  }

  if (registros.length === 0) throw ERRORS.CSV_COLUNAS_INVALIDAS('Arquivo CSV está vazio')

  try {
    validarCabecalho(Object.keys(registros[0]))
  } catch (e) {
    throw ERRORS.CSV_COLUNAS_INVALIDAS(e.message)
  }

  const linhasValidas = []
  const erros = []

  registros.forEach((r, i) => {
    const errosLinha = validarLinha(r, i + 2)
    if (errosLinha.length > 0) {
      erros.push(...errosLinha)
    } else {
      linhasValidas.push({
        uf:               (r.uf || '').toUpperCase().trim(),
        cidade:           r.cidade.toUpperCase().trim(),
        idprestador:      parseInt(r.idprestador),
        nome_prestador:   r.nome_prestador.trim(),
        nome_servico:     r.nome_servico.toUpperCase().trim(),
        assistencia:      r.assistencia || null,
        servicos_criados: parseInt(r.servicos_criados),
        mesn:             parseInt(r.mesn),
        mes:              (r.mes || '').toLowerCase().trim(),
        ano:              parseInt(r.ano),
      })
    }
  })

  let importados = 0
  if (linhasValidas.length > 0) {
    for (let i = 0; i < linhasValidas.length; i += 500) {
      const lote = linhasValidas.slice(i, i + 500)
      const { error } = await supabase.from('prestadores').insert(lote)
      if (error) throw error
      importados += lote.length
    }
  }

  const periodos = [...new Set(linhasValidas.map(r => `${r.mes}/${r.ano}`))]

  const resultado = {
    total_linhas: registros.length,
    importados,
    erros: erros.length,
    periodo_importado: periodos.join(', '),
    detalhes_erros: erros,
  }

  await supabase.from('importacoes_base').insert({
    usuario_id: contexto.usuario?.id || null,
    arquivo_nome: contexto.arquivo_nome || null,
    ...resultado,
  })

  return resultado
}

module.exports = { processarCSV }
