const supabase = require('../config/supabase')

async function notificarGerentes(dimensionamento, consultor) {
  const { data: gerentes } = await supabase
    .from('usuarios')
    .select('id')
    .eq('perfil', 'GERENTE')
    .eq('ativo', true)

  if (!gerentes || gerentes.length === 0) return

  const msg = `${consultor.nome} dimensionou ${dimensionamento.cidade} (${dimensionamento.tipo_servico}) — ${dimensionamento.status_resultado}`

  await supabase.from('notificacoes').insert(
    gerentes.map(g => ({
      destinatario_id:    g.id,
      remetente_id:       consultor.id,
      dimensionamento_id: dimensionamento.id,
      mensagem:           msg,
    }))
  )
}

async function notificarConsultor(dimensionamento, gerente, comentario) {
  await supabase.from('notificacoes').insert({
    destinatario_id:    dimensionamento.consultor_id,
    remetente_id:       gerente.id,
    dimensionamento_id: dimensionamento.id,
    mensagem:           `Ajuste solicitado em ${dimensionamento.cidade} (${dimensionamento.tipo_servico}): ${comentario}`,
  })
}

module.exports = { notificarGerentes, notificarConsultor }
