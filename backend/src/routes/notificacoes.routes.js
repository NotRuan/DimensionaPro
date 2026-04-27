const router = require('express').Router()
const supabase = require('../config/supabase')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*, dimensionamento:dimensionamentos(cidade, tipo_servico, status_resultado)')
      .eq('destinatario_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

router.get('/nao-lidas', async (req, res, next) => {
  try {
    const { count, error } = await supabase
      .from('notificacoes')
      .select('*', { count: 'exact', head: true })
      .eq('destinatario_id', req.user.id)
      .eq('lida', false)
    if (error) throw error
    res.json({ success: true, data: { total: count } })
  } catch (err) { next(err) }
})

router.patch('/:id/lida', async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', req.params.id)
      .eq('destinatario_id', req.user.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) { next(err) }
})

module.exports = router
