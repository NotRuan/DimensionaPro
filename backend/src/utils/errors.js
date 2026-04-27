class AppError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message)
    this.code = code
    this.statusCode = statusCode
  }
}

const ERRORS = {
  AUTH_INVALID_CREDENTIALS: (msg = 'E-mail ou senha incorretos') =>
    new AppError('AUTH_INVALID_CREDENTIALS', msg, 401),
  AUTH_TOKEN_EXPIRED: () =>
    new AppError('AUTH_TOKEN_EXPIRED', 'Token expirado', 401),
  AUTH_FORBIDDEN: () =>
    new AppError('AUTH_FORBIDDEN', 'Acesso não autorizado', 403),
  PRESTADOR_NAO_ENCONTRADO: (id, servico, cidade) =>
    new AppError(
      'PRESTADOR_NAO_ENCONTRADO',
      `Prestador ${id} não encontrado para ${servico} em ${cidade} nos últimos 6 meses. Verifique o código ou a base de dados.`,
      404
    ),
  CSV_COLUNAS_INVALIDAS: (msg) =>
    new AppError('CSV_COLUNAS_INVALIDAS', msg, 422),
  CSV_DADOS_INVALIDOS: (msg) =>
    new AppError('CSV_DADOS_INVALIDOS', msg, 422),
  DIM_NAO_ENCONTRADO: () =>
    new AppError('DIM_NAO_ENCONTRADO', 'Dimensionamento não encontrado', 404),
  DIM_SEM_PERMISSAO: () =>
    new AppError('DIM_SEM_PERMISSAO', 'Sem permissão para este dimensionamento', 403),
  VALIDATION_ERROR: (msg) =>
    new AppError('VALIDATION_ERROR', msg, 422),
}

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    })
  }
  console.error(err)
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
  })
}

module.exports = { AppError, ERRORS, errorHandler }
