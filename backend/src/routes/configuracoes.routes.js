const router = require('express').Router()
const configuracoesService = require('../services/configuracoes.service')
const authMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')
const supabase = require('../config/supabase')
const { registrarAuditoria } = require('../services/auditoria.service')

// GET /api/configuracoes — PUBLIC (no auth required)
router.get('/', async (req, res, next) => {
  try {
    const data = await configuracoesService.buscarTodas()
    const result = {}
    data.forEach(row => { result[row.chave] = row.valor })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// PUT /api/configuracoes/:chave — ADM only
router.put('/:chave', authMiddleware, roleMiddleware(['ADM']), async (req, res, next) => {
  try {
    const { chave } = req.params
    const { valor } = req.body

    const chavesPermitidas = ['coeficientes', 'parametros_gerais']
    if (!chavesPermitidas.includes(chave)) {
      return res.status(400).json({ error: 'chave inválida' })
    }

    if (valor === undefined || valor === null) {
      return res.status(400).json({ error: 'valor é obrigatório' })
    }

    const { data: atual } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', chave)
      .maybeSingle()

    const data = await configuracoesService.salvar(chave, valor)

    await supabase.from('configuracoes_historico').insert({
      chave,
      valor_antigo: atual?.valor || null,
      valor_novo: valor,
      usuario_id: req.user.id,
    })
    await registrarAuditoria({ usuario: req.user, acao: 'CONFIGURACAO_ALTERADA', entidade: 'configuracoes', entidade_id: chave })
    res.json(data)
  } catch (err) {
    next(err)
  }
})

module.exports = router
