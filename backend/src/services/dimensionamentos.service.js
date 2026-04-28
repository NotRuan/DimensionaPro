const supabase = require('../config/supabase')
const { ERRORS } = require('../utils/errors')
const { notificarGerentes, notificarConsultor } = require('./notificacoes.service')
const { listarCidades } = require('./prestadores.service')

const STATUS_REVISAO_VALIDOS = ['RASCUNHO', 'PENDENTE', 'REVISADO', 'AJUSTE_SOLICITADO']

function normalizarTexto(valor) {
  return (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
}

async function registrarEvento(dimensionamentoId, usuario, tipo, comentario = null, metadata = null) {
  const { error } = await supabase.from('dimensionamento_eventos').insert({
    dimensionamento_id: dimensionamentoId,
    usuario_id: usuario?.id || null,
    tipo,
    comentario,
    metadata,
  })
  if (error) console.error('Erro ao registrar evento do dimensionamento', error)
}

async function listar(usuario, filtros = {}) {
  let query = supabase
    .from('dimensionamentos')
    .select('*, consultor:usuarios!consultor_id(nome, email)')
    .order('created_at', { ascending: false })

  if (usuario.perfil === 'CONSULTOR') {
    query = query.eq('consultor_id', usuario.id)
  }

  if (filtros.cidade) {
    query = query.eq('cidade', filtros.cidade)
  }

  if (filtros.status_revisao) {
    query = query.eq('status_revisao', filtros.status_revisao)
  }

  if (filtros.uf) {
    query = query.eq('uf', filtros.uf)
  }

  if (filtros.tipo_servico) {
    query = query.eq('tipo_servico', filtros.tipo_servico)
  }

  if (filtros.status_resultado) {
    query = query.eq('status_resultado', filtros.status_resultado)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

async function criar(body, usuario) {
  const { cidade, uf, tipo_servico, demanda_cidade, indice_capacidade,
          status_resultado, janela_inicio, janela_fim, prestadores } = body
  const status_revisao = STATUS_REVISAO_VALIDOS.includes(body.status_revisao)
    ? body.status_revisao
    : 'RASCUNHO'

  const { data: dim, error: dimErr } = await supabase
    .from('dimensionamentos')
    .insert({
      cidade, uf, tipo_servico, consultor_id: usuario.id,
      demanda_cidade, indice_capacidade, status_resultado,
      janela_inicio, janela_fim, status_revisao,
    })
    .select()
    .single()

  if (dimErr) throw dimErr

  if (prestadores && prestadores.length > 0) {
    const rows = prestadores.map(p => ({ ...p, dimensionamento_id: dim.id }))
    const { error: pdErr } = await supabase.from('prestadores_dim').insert(rows)
    if (pdErr) throw pdErr
  }

  await registrarEvento(dim.id, usuario, 'CRIADO', null, { status_revisao })
  return dim
}

async function atualizar(id, body, usuario) {
  const atual = await buscarPorId(id, usuario)
  if (usuario.perfil === 'CONSULTOR' && atual.consultor_id !== usuario.id) {
    throw ERRORS.DIM_SEM_PERMISSAO()
  }
  if (usuario.perfil === 'CONSULTOR' && atual.status_revisao === 'REVISADO') {
    throw ERRORS.VALIDATION_ERROR('Dimensionamento revisado nao pode ser alterado pelo consultor')
  }

  const { cidade, uf, tipo_servico, demanda_cidade, indice_capacidade,
          status_resultado, janela_inicio, janela_fim, prestadores } = body
  const status_revisao = STATUS_REVISAO_VALIDOS.includes(body.status_revisao)
    ? body.status_revisao
    : 'RASCUNHO'

  const { data: dim, error: dimErr } = await supabase
    .from('dimensionamentos')
    .update({
      cidade, uf, tipo_servico,
      demanda_cidade, indice_capacidade, status_resultado,
      janela_inicio, janela_fim, status_revisao,
      gerente_revisor_id: null,
      comentario_revisao: null,
      data_revisao: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (dimErr) throw dimErr

  const { error: delErr } = await supabase
    .from('prestadores_dim')
    .delete()
    .eq('dimensionamento_id', id)
  if (delErr) throw delErr

  if (prestadores && prestadores.length > 0) {
    const rows = prestadores.map(p => ({ ...p, dimensionamento_id: id }))
    const { error: pdErr } = await supabase.from('prestadores_dim').insert(rows)
    if (pdErr) throw pdErr
  }

  await registrarEvento(id, usuario, 'EDITADO', null, { status_revisao })
  return dim
}

async function buscarPorId(id, usuario) {
  const { data: dim, error } = await supabase
    .from('dimensionamentos')
    .select('*, prestadores_dim(*), consultor:usuarios!consultor_id(nome, email)')
    .eq('id', id)
    .single()

  if (error || !dim) throw ERRORS.DIM_NAO_ENCONTRADO()
  if (usuario.perfil === 'CONSULTOR' && dim.consultor_id !== usuario.id) {
    throw ERRORS.DIM_SEM_PERMISSAO()
  }
  return dim
}

async function listarEventos(id, usuario) {
  await buscarPorId(id, usuario)

  const { data, error } = await supabase
    .from('dimensionamento_eventos')
    .select('*, usuario:usuarios(nome, email, perfil)')
    .eq('dimensionamento_id', id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

async function submeter(id, usuario) {
  const dim = await buscarPorId(id, usuario)
  if (usuario.perfil === 'CONSULTOR' && dim.consultor_id !== usuario.id) throw ERRORS.DIM_SEM_PERMISSAO()

  const { data, error } = await supabase
    .from('dimensionamentos')
    .update({ status_revisao: 'PENDENTE', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  await registrarEvento(id, usuario, 'SUBMETIDO')
  await notificarGerentes(data, usuario)
  return data
}

async function revisar(id, usuario) {
  const { data, error } = await supabase
    .from('dimensionamentos')
    .update({
      status_revisao: 'REVISADO',
      gerente_revisor_id: usuario.id,
      data_revisao: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  await registrarEvento(id, usuario, 'REVISADO')
  return data
}

async function revisarLote(ids, usuario) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw ERRORS.VALIDATION_ERROR('Informe ao menos um dimensionamento')
  }

  const resultados = []
  for (const id of ids) {
    resultados.push(await revisar(id, usuario))
  }
  return resultados
}

async function solicitarAjuste(id, comentario, usuario) {
  const { data: dim } = await supabase.from('dimensionamentos').select('*').eq('id', id).single()
  if (!dim) throw ERRORS.DIM_NAO_ENCONTRADO()

  const { data, error } = await supabase
    .from('dimensionamentos')
    .update({
      status_revisao: 'AJUSTE_SOLICITADO',
      comentario_revisao: comentario,
      gerente_revisor_id: usuario.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  await registrarEvento(id, usuario, 'AJUSTE_SOLICITADO', comentario)
  await notificarConsultor(dim, usuario, comentario)
  return data
}

async function dashboardGerente() {
  const { data, error } = await supabase
    .from('dimensionamentos')
    .select('id, cidade, uf, tipo_servico, status_resultado, status_revisao, indice_capacidade, consultor_id, created_at, data_revisao, consultor:usuarios!consultor_id(nome, email)')
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = data || []
  const inicioMes = new Date()
  inicioMes.setUTCDate(1)
  inicioMes.setUTCHours(0, 0, 0, 0)

  const pendentes = rows.filter(d => d.status_revisao === 'PENDENTE')
  const revisadosMes = rows.filter(d => d.status_revisao === 'REVISADO' && d.data_revisao && new Date(d.data_revisao) >= inicioMes)
  const porConsultor = new Map()
  rows.forEach(d => {
    const key = d.consultor_id || 'sem-consultor'
    const atual = porConsultor.get(key) || { consultor: d.consultor?.nome || 'Sem consultor', pendentes: 0, ajustes: 0, total: 0 }
    atual.total += 1
    if (d.status_revisao === 'PENDENTE') atual.pendentes += 1
    if (d.status_revisao === 'AJUSTE_SOLICITADO') atual.ajustes += 1
    porConsultor.set(key, atual)
  })

  return {
    total: rows.length,
    pendentes: pendentes.length,
    subdimensionados_pendentes: pendentes.filter(d => d.status_resultado === 'SUBDIMENSIONADO').length,
    ajustes: rows.filter(d => d.status_revisao === 'AJUSTE_SOLICITADO').length,
    revisados_mes: revisadosMes.length,
    pendentes_criticos: pendentes
      .filter(d => d.status_resultado === 'SUBDIMENSIONADO')
      .slice(0, 10),
    consultores: Array.from(porConsultor.values())
      .sort((a, b) => b.pendentes - a.pendentes || b.ajustes - a.ajustes)
      .slice(0, 8),
  }
}

async function listarMapa() {
  const pageSize = 1000
  let from = 0
  let rows = []

  while (true) {
    const { data, error } = await supabase
      .from('dimensionamentos')
      .select('cidade, uf, tipo_servico, status_resultado, indice_capacidade')
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1)

    if (error) throw error

    rows = rows.concat(data || [])
    if (!data || data.length < pageSize) break

    from += pageSize
  }

  const cidades = await listarCidades()
  const ufPorCidade = new Map(cidades.map(c => [normalizarTexto(c.cidade), c.uf]))

  return rows.map(row => ({
    ...row,
    uf: row.uf || ufPorCidade.get(normalizarTexto(row.cidade)) || null,
  }))
}

async function excluir(id, usuario) {
  const dim = await buscarPorId(id, usuario)
  if (usuario.perfil === 'CONSULTOR' && dim.consultor_id !== usuario.id) throw ERRORS.DIM_SEM_PERMISSAO()

  const tabelasFilhas = ['notificacoes', 'dimensionamento_eventos', 'prestadores_dim']
  for (const tabela of tabelasFilhas) {
    const { error } = await supabase
      .from(tabela)
      .delete()
      .eq('dimensionamento_id', id)
    if (error) throw error
  }

  const { error } = await supabase.from('dimensionamentos').delete().eq('id', id)
  if (error) throw error
}

module.exports = { listar, criar, atualizar, buscarPorId, listarEventos, submeter, revisar, revisarLote, solicitarAjuste, dashboardGerente, listarMapa, excluir }
