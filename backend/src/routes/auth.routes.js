const router = require('express').Router()
const { login, refresh, register } = require('../services/auth.service')
const { ERRORS } = require('../utils/errors')

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body
    if (!email || !senha) {
      return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'E-mail e senha são obrigatórios' } })
    }
    const result = await login(email, senha)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.json({ success: true, data: { accessToken: result.accessToken, usuario: result.usuario } })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { nome, email, senha, confirmarSenha, perfil } = req.body
    if (!nome || !email || !senha) {
      return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Nome, e-mail e senha são obrigatórios' } })
    }
    if (senha !== confirmarSenha) {
      return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'As senhas não coincidem' } })
    }
    if (senha.length < 6) {
      return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Senha deve ter ao menos 6 caracteres' } })
    }
    const result = await register(nome, email, senha, perfil || 'CONSULTOR')
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.status(201).json({ success: true, data: { accessToken: result.accessToken, usuario: result.usuario } })
  } catch (err) {
    if (err.code === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({ success: false, error: { code: err.code, message: err.message } })
    }
    next(err)
  }
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) return next(ERRORS.AUTH_TOKEN_EXPIRED())
    const result = await refresh(refreshToken)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken')
  res.json({ success: true, message: 'Logout realizado' })
})

module.exports = router
