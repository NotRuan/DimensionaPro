const router = require('express').Router()
const upload = require('../config/multer')
const { processarCSV } = require('../services/upload.service')
const { registrarAuditoria } = require('../services/auditoria.service')
const authMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')

router.use(authMiddleware)
router.use(roleMiddleware(['ADM']))

router.post('/csv', upload.single('arquivo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Arquivo não enviado' } })
    const resultado = await processarCSV(req.file.buffer, { usuario: req.user, arquivo_nome: req.file.originalname })
    await registrarAuditoria({ usuario: req.user, acao: 'BASE_IMPORTADA', entidade: 'prestadores', detalhes: { arquivo: req.file.originalname, importados: resultado.importados, erros: resultado.erros } })
    res.json({ success: true, data: resultado })
  } catch (err) { next(err) }
})

module.exports = router
