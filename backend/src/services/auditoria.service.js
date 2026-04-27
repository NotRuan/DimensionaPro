const supabase = require('../config/supabase')

async function registrarAuditoria({ usuario, acao, entidade, entidade_id, detalhes }) {
  const { error } = await supabase.from('auditoria_sistema').insert({
    usuario_id: usuario?.id || null,
    acao,
    entidade,
    entidade_id: entidade_id ? String(entidade_id) : null,
    detalhes: detalhes || null,
  })

  if (error) console.error('Erro ao registrar auditoria', error)
}

async function listarAuditoria({ acao, entidade, usuario_id, limite = 100 }) {
  let query = supabase
    .from('auditoria_sistema')
    .select('*, usuario:usuarios(nome, email, perfil)')
    .order('created_at', { ascending: false })
    .limit(Math.min(parseInt(limite) || 100, 500))

  if (acao) query = query.eq('acao', acao)
  if (entidade) query = query.eq('entidade', entidade)
  if (usuario_id) query = query.eq('usuario_id', usuario_id)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

module.exports = { registrarAuditoria, listarAuditoria }
