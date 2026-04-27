const router = require('express').Router()
const supabase = require('../config/supabase')
const authMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')
const { listarAuditoria } = require('../services/auditoria.service')
const { ERRORS } = require('../utils/errors')

router.use(authMiddleware)
router.use(roleMiddleware(['ADM']))

router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      usuarios,
      dimensionamentos,
      cidades,
      prestadores,
      importacoes,
    ] = await Promise.all([
      supabase.from('usuarios').select('perfil, ativo'),
      supabase.from('dimensionamentos').select('status_revisao, status_resultado, created_at'),
      supabase.from('cidades').select('ativo'),
      supabase.from('prestadores').select('id', { count: 'exact', head: true }),
      supabase.from('importacoes_base').select('*').order('created_at', { ascending: false }).limit(1),
    ])

    for (const result of [usuarios, dimensionamentos, cidades, prestadores, importacoes]) {
      if (result.error) throw result.error
    }

    const users = usuarios.data || []
    const dims = dimensionamentos.data || []
    const cityRows = cidades.data || []
    const inicioMes = new Date()
    inicioMes.setUTCDate(1)
    inicioMes.setUTCHours(0, 0, 0, 0)

    const porPerfil = users.reduce((acc, u) => {
      acc[u.perfil] = (acc[u.perfil] || 0) + 1
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        usuarios_total: users.length,
        usuarios_ativos: users.filter(u => u.ativo).length,
        usuarios_inativos: users.filter(u => !u.ativo).length,
        usuarios_por_perfil: porPerfil,
        dimensionamentos_total: dims.length,
        dimensionamentos_mes: dims.filter(d => new Date(d.created_at) >= inicioMes).length,
        revisao: {
          rascunho: dims.filter(d => d.status_revisao === 'RASCUNHO').length,
          pendente: dims.filter(d => d.status_revisao === 'PENDENTE').length,
          ajuste: dims.filter(d => d.status_revisao === 'AJUSTE_SOLICITADO').length,
          revisado: dims.filter(d => d.status_revisao === 'REVISADO').length,
        },
        capacidade: {
          subdimensionado: dims.filter(d => d.status_resultado === 'SUBDIMENSIONADO').length,
          atencao: dims.filter(d => d.status_resultado === 'ATENCAO').length,
          adequado: dims.filter(d => d.status_resultado === 'ADEQUADO').length,
        },
        cidades_total: cityRows.length,
        cidades_ativas: cityRows.filter(c => c.ativo !== false).length,
        prestadores_registros: prestadores.count || 0,
        ultima_importacao: importacoes.data?.[0] || null,
      },
    })
  } catch (err) { next(err) }
})

router.get('/auditoria', async (req, res, next) => {
  try {
    const data = await listarAuditoria(req.query)
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

router.get('/importacoes', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('importacoes_base')
      .select('*, usuario:usuarios(nome, email)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

router.get('/cidades', async (req, res, next) => {
  try {
    const { q, uf, ativo } = req.query
    let query = supabase.from('cidades').select('*').order('cidade')
    if (q) query = query.ilike('cidade', `%${q}%`)
    if (uf) query = query.eq('uf', uf.toUpperCase())
    if (ativo === 'true') query = query.eq('ativo', true)
    if (ativo === 'false') query = query.eq('ativo', false)
    const { data, error } = await query.limit(500)
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

router.post('/cidades', async (req, res, next) => {
  try {
    const cidade = String(req.body.cidade || '').trim().toUpperCase()
    const uf = String(req.body.uf || '').trim().toUpperCase()
    if (!cidade || !uf) throw ERRORS.VALIDATION_ERROR('Cidade e UF sao obrigatorios')
    const { data, error } = await supabase
      .from('cidades')
      .insert({ cidade, uf, ativo: req.body.ativo !== false })
      .select()
      .single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (err) { next(err) }
})

router.put('/cidades/:id', async (req, res, next) => {
  try {
    const updates = {}
    if (req.body.cidade) updates.cidade = String(req.body.cidade).trim().toUpperCase()
    if (req.body.uf) updates.uf = String(req.body.uf).trim().toUpperCase()
    if (typeof req.body.ativo === 'boolean') updates.ativo = req.body.ativo
    const { data, error } = await supabase
      .from('cidades')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

module.exports = router
