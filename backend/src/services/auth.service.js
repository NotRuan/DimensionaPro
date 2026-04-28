const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const supabase = require('../config/supabase')
const { ERRORS } = require('../utils/errors')

async function login(email, senha) {
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('id, nome, email, senha_hash, perfil, ativo')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (error || !usuario) throw ERRORS.AUTH_INVALID_CREDENTIALS()
  if (!usuario.ativo) throw ERRORS.AUTH_INVALID_CREDENTIALS('Usuario inativo')

  const senhaValida = await bcrypt.compare(senha, usuario.senha_hash)
  if (!senhaValida) throw ERRORS.AUTH_INVALID_CREDENTIALS()

  const payload = {
    sub:    usuario.id,
    nome:   usuario.nome,
    email:  usuario.email,
    perfil: usuario.perfil,
  }

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  })

  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  })

  return {
    accessToken,
    refreshToken,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
  }
}

async function refresh(refreshToken) {
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET)
    const newPayload = { sub: payload.sub, nome: payload.nome, email: payload.email, perfil: payload.perfil }
    const accessToken = jwt.sign(newPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    })
    return { accessToken }
  } catch {
    throw ERRORS.AUTH_TOKEN_EXPIRED()
  }
}

module.exports = { login, refresh }
