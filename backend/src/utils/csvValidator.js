const COLUNAS_ESPERADAS = [
  'uf','cidade','idprestador','nome_prestador',
  'nome_servico','assistencia','servicos_criados','mesn','mes','ano'
]

const SERVICOS_VALIDOS = ['ELETRICISTA', 'ENCANADOR']

function validarCabecalho(colunas) {
  const faltando = COLUNAS_ESPERADAS.filter(c => !colunas.includes(c))
  if (faltando.length > 0) {
    throw new Error(`Colunas ausentes no CSV: ${faltando.join(', ')}`)
  }
}

function validarLinha(linha, numero) {
  const erros = []
  if (!linha.cidade) erros.push({ linha: numero, campo: 'cidade', valor: linha.cidade, motivo: 'Obrigatório' })
  if (!linha.idprestador || isNaN(parseInt(linha.idprestador))) erros.push({ linha: numero, campo: 'idprestador', valor: linha.idprestador, motivo: 'Deve ser número inteiro positivo' })
  if (!linha.nome_prestador) erros.push({ linha: numero, campo: 'nome_prestador', valor: linha.nome_prestador, motivo: 'Obrigatório' })
  if (!SERVICOS_VALIDOS.includes((linha.nome_servico || '').toUpperCase())) erros.push({ linha: numero, campo: 'nome_servico', valor: linha.nome_servico, motivo: 'Valor não permitido (use ELETRICISTA ou ENCANADOR)' })
  if (isNaN(parseInt(linha.servicos_criados)) || parseInt(linha.servicos_criados) < 0) erros.push({ linha: numero, campo: 'servicos_criados', valor: linha.servicos_criados, motivo: 'Deve ser número inteiro >= 0' })
  const mesn = parseInt(linha.mesn)
  if (isNaN(mesn) || mesn < 1 || mesn > 12) erros.push({ linha: numero, campo: 'mesn', valor: linha.mesn, motivo: 'Deve ser entre 1 e 12' })
  const ano = parseInt(linha.ano)
  if (isNaN(ano) || ano < 2020 || ano > 2030) erros.push({ linha: numero, campo: 'ano', valor: linha.ano, motivo: 'Deve ser entre 2020 e 2030' })
  return erros
}

module.exports = { validarCabecalho, validarLinha, COLUNAS_ESPERADAS }
