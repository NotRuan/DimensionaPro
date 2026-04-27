const { ERRORS } = require('../utils/errors')

function roleMiddleware(perfisPermitidos) {
  return (req, res, next) => {
    if (!req.user || !perfisPermitidos.includes(req.user.perfil)) {
      return next(ERRORS.AUTH_FORBIDDEN())
    }
    next()
  }
}

module.exports = roleMiddleware
