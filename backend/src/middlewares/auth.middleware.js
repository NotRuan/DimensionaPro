const jwt = require('jsonwebtoken')
const { ERRORS } = require('../utils/errors')

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return next(ERRORS.AUTH_TOKEN_EXPIRED())
  }
  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub, nome: payload.nome, email: payload.email, perfil: payload.perfil }
    next()
  } catch {
    next(ERRORS.AUTH_TOKEN_EXPIRED())
  }
}

module.exports = authMiddleware
