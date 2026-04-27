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
  if (!usuario.ativo) throw ERRORS.AUTH_INVALID_CREDENTIALS('Usuário inativo')

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

async function register(nome, email, senha, perfil = 'CONSULTOR') {
  const PERFIS_VALIDOS = ['CONSULTOR', 'GERENTE', 'ADM']
  if (!PERFIS_VALIDOS.includes(perfil)) {
    throw ERRORS.VALIDATION_ERROR('Perfil inválido')
  }

  const { data: existente } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (existente) {
    const err = new Error('E-mail já cadastrado')
    err.statusCode = 409
    err.code = 'EMAIL_ALREADY_EXISTS'
    throw err
  }

  const senha_hash = await bcrypt.hash(senha, 10)

  const { data: novo, error } = await supabase
    .from('usuarios')
    .insert({ nome: nome.trim(), email: email.toLowerCase().trim(), senha_hash, perfil, ativo: true })
    .select('id, nome, email, perfil')
    .single()

  if (error) throw new Error('Erro ao criar usuário')

  const payload = { sub: novo.id, nome: novo.nome, email: novo.email, perfil: novo.perfil }

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  })

  const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  })

  return { accessToken, refreshToken, usuario: novo }
}

module.exports = { login, refresh, register }
