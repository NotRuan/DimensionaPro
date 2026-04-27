const supabase = require('../config/supabase')

async function buscarTodas() {
  const { data, error } = await supabase
    .from('configuracoes')
    .select('chave, valor')
  if (error) throw error
  return data
}

async function salvar(chave, valor) {
  const { data, error } = await supabase
    .from('configuracoes')
    .upsert({ chave, valor, updated_at: new Date().toISOString() }, { onConflict: 'chave' })
    .select()
    .single()
  if (error) throw error
  return data
}

module.exports = { buscarTodas, salvar }
