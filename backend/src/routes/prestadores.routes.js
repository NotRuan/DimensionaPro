const router = require('express').Router()
const { listarCidades, buscarVolumetria, buscarSugestoes } = require('../services/prestadores.service')
const authMiddleware = require('../middlewares/auth.middleware')

router.use(authMiddleware)

router.get('/cidades', async (req, res, next) => {
  try {
    const data = await listarCidades()
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

router.get('/busca', async (req, res, next) => {
  try {
    const { cidade, idprestador, nome_servico } = req.query
    if (!cidade || !idprestador || !nome_servico) {
      return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Parâmetros obrigatórios: cidade, idprestador, nome_servico' } })
    }
    const data = await buscarVolumetria({ cidade, idprestador, nome_servico })
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

router.get('/sugestoes', async (req, res, next) => {
  try {
    const { cidade, nome_servico, q } = req.query
    if (!cidade || !nome_servico || !q) {
      return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'ParÃ¢metros obrigatÃ³rios: cidade, nome_servico, q' } })
    }
    const data = await buscarSugestoes({ cidade, nome_servico, q })
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

module.exports = router
