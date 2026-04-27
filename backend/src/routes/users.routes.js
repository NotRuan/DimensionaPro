const router = require('express').Router()
const bcrypt = require('bcryptjs')
const supabase = require('../config/supabase')
const authMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')
const { ERRORS } = require('../utils/errors')
const { registrarAuditoria } = require('../services/auditoria.service')

router.use(authMiddleware)
router.use(roleMiddleware(['ADM']))

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, perfil, ativo, created_at, updated_at')
      .order('nome')
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { nome, email, senha, perfil } = req.body
    if (!nome || !email || !senha || !perfil) throw ERRORS.VALIDATION_ERROR('Campos obrigatorios: nome, email, senha, perfil')
    if (!['ADM','CONSULTOR','GERENTE'].includes(perfil)) throw ERRORS.VALIDATION_ERROR('Perfil invalido')
    const senha_hash = await bcrypt.hash(senha, 10)
    const { data, error } = await supabase
      .from('usuarios')
      .insert({ nome, email: email.toLowerCase().trim(), senha_hash, perfil })
      .select('id, nome, email, perfil, ativo')
      .single()
    if (error) {
      if (error.code === '23505') throw ERRORS.VALIDATION_ERROR('E-mail ja cadastrado')
      throw error
    }
    await registrarAuditoria({ usuario: req.user, acao: 'USUARIO_CRIADO', entidade: 'usuarios', entidade_id: data.id, detalhes: { email: data.email, perfil: data.perfil } })
    res.status(201).json({ success: true, data })
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, email, perfil, ativo, created_at, updated_at')
      .eq('id', req.params.id)
      .single()
    if (error || !data) return next(ERRORS.VALIDATION_ERROR('Usuario nao encontrado'))
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { nome, email, perfil } = req.body
    const updates = {}
    if (nome) updates.nome = nome
    if (email) updates.email = email.toLowerCase().trim()
    if (perfil) {
      if (!['ADM','CONSULTOR','GERENTE'].includes(perfil)) throw ERRORS.VALIDATION_ERROR('Perfil invalido')
      updates.perfil = perfil
    }
    updates.updated_at = new Date().toISOString()
    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, nome, email, perfil, ativo')
      .single()
    if (error) throw error
    await registrarAuditoria({ usuario: req.user, acao: 'USUARIO_EDITADO', entidade: 'usuarios', entidade_id: data.id, detalhes: updates })
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

router.patch('/:id/reset-senha', async (req, res, next) => {
  try {
    const { senha } = req.body
    if (!senha || String(senha).length < 6) throw ERRORS.VALIDATION_ERROR('Senha deve ter pelo menos 6 caracteres')
    const senha_hash = await bcrypt.hash(senha, 10)
    const { data, error } = await supabase
      .from('usuarios')
      .update({ senha_hash, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id, nome, email, perfil, ativo')
      .single()
    if (error) throw error
    await registrarAuditoria({ usuario: req.user, acao: 'USUARIO_RESET_SENHA', entidade: 'usuarios', entidade_id: data.id, detalhes: { email: data.email } })
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

router.patch('/:id/toggle', async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) throw ERRORS.VALIDATION_ERROR('ADM nao pode alterar o proprio status')
    const { data: current } = await supabase.from('usuarios').select('ativo').eq('id', req.params.id).single()
    if (!current) return next(ERRORS.VALIDATION_ERROR('Usuario nao encontrado'))
    const { data, error } = await supabase
      .from('usuarios')
      .update({ ativo: !current.ativo, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id, nome, email, perfil, ativo')
      .single()
    if (error) throw error
    await registrarAuditoria({ usuario: req.user, acao: data.ativo ? 'USUARIO_ATIVADO' : 'USUARIO_DESATIVADO', entidade: 'usuarios', entidade_id: data.id, detalhes: { email: data.email } })
    res.json({ success: true, data })
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) throw ERRORS.VALIDATION_ERROR('ADM nao pode excluir a si mesmo')
    const { count, error: countErr } = await supabase
      .from('dimensionamentos')
      .select('*', { count: 'exact', head: true })
      .eq('consultor_id', req.params.id)
    if (countErr) throw countErr
    if (count > 0) throw ERRORS.VALIDATION_ERROR('Usuario possui dimensionamentos vinculados. Desative em vez de excluir.')
    const { error } = await supabase.from('usuarios').delete().eq('id', req.params.id)
    if (error) throw error
    await registrarAuditoria({ usuario: req.user, acao: 'USUARIO_EXCLUIDO', entidade: 'usuarios', entidade_id: req.params.id })
    res.json({ success: true, message: 'Usuario excluido' })
  } catch (err) { next(err) }
})

module.exports = router
