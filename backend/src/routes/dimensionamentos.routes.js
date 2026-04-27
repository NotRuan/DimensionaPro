const router = require('express').Router()
const svc = require('../services/dimensionamentos.service')
const authMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')

router.use(authMiddleware)

router.get('/mapa', async (req, res, next) => {
  try { res.json({ success: true, data: await svc.listarMapa() }) }
  catch (err) { next(err) }
})

router.get('/gerente/dashboard', roleMiddleware(['GERENTE', 'ADM']), async (req, res, next) => {
  try { res.json({ success: true, data: await svc.dashboardGerente() }) }
  catch (err) { next(err) }
})

router.patch('/revisar-lote', roleMiddleware(['GERENTE', 'ADM']), async (req, res, next) => {
  try { res.json({ success: true, data: await svc.revisarLote(req.body.ids, req.user) }) }
  catch (err) { next(err) }
})

router.get('/', async (req, res, next) => {
  try {
    const { cidade, status_revisao, uf, tipo_servico, status_resultado } = req.query
    res.json({ success: true, data: await svc.listar(req.user, { cidade, status_revisao, uf, tipo_servico, status_resultado }) })
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.criar(req.body, req.user) }) }
  catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await svc.buscarPorId(req.params.id, req.user) }) }
  catch (err) { next(err) }
})

router.get('/:id/eventos', async (req, res, next) => {
  try { res.json({ success: true, data: await svc.listarEventos(req.params.id, req.user) }) }
  catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try { res.json({ success: true, data: await svc.atualizar(req.params.id, req.body, req.user) }) }
  catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await svc.excluir(req.params.id, req.user)
    res.json({ success: true, message: 'Dimensionamento excluído' })
  } catch (err) { next(err) }
})

router.patch('/:id/submeter', async (req, res, next) => {
  try { res.json({ success: true, data: await svc.submeter(req.params.id, req.user) }) }
  catch (err) { next(err) }
})

router.patch('/:id/revisar', roleMiddleware(['GERENTE', 'ADM']), async (req, res, next) => {
  try { res.json({ success: true, data: await svc.revisar(req.params.id, req.user) }) }
  catch (err) { next(err) }
})

router.patch('/:id/ajuste', roleMiddleware(['GERENTE', 'ADM']), async (req, res, next) => {
  try {
    const { comentario } = req.body
    if (!comentario) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Comentário é obrigatório' } })
    res.json({ success: true, data: await svc.solicitarAjuste(req.params.id, comentario, req.user) })
  } catch (err) { next(err) }
})

module.exports = router
