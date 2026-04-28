const router = require('express').Router()
const { login, refresh } = require('../services/auth.service')
const { ERRORS } = require('../utils/errors')

const isProduction = process.env.NODE_ENV === 'production'
const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}
const clearRefreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'strict',
}

router.post('/login', async (req, res, next) => {
  try {
    const { email, senha } = req.body
    if (!email || !senha) {
      return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'E-mail e senha sao obrigatorios' } })
    }
    const result = await login(email, senha)
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions)
    res.json({ success: true, data: { accessToken: result.accessToken, usuario: result.usuario } })
  } catch (err) {
    next(err)
  }
})

router.post('/register', async (req, res, next) => {
  try {
    res.status(403).json({
      success: false,
      error: {
        code: 'PUBLIC_REGISTER_DISABLED',
        message: 'Cadastro publico desativado. Solicite a criacao do usuario ao ADM.',
      },
    })
  } catch (err) {
    next(err)
  }
})

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

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken', clearRefreshCookieOptions)
  res.json({ success: true, message: 'Logout realizado' })
})

module.exports = router
