const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const app = express()

const normalizeOrigin = (origin) => origin?.trim().replace(/\/+$/, '')
const ALLOWED_ORIGINS = [
  ...(process.env.FRONTEND_URLS || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean),
  normalizeOrigin(process.env.FRONTEND_URL) || 'http://localhost:5173',
  'http://localhost:5174',
]
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || ALLOWED_ORIGINS.includes(normalizeOrigin(origin))),
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// Rotas serão adicionadas nas tasks seguintes
app.get('/health', (req, res) => res.json({ ok: true }))

app.use('/api/auth',             require('./routes/auth.routes'))
app.use('/api/users',            require('./routes/users.routes'))
app.use('/api/prestadores',      require('./routes/prestadores.routes'))
app.use('/api/dimensionamentos', require('./routes/dimensionamentos.routes'))
app.use('/api/upload',           require('./routes/upload.routes'))
app.use('/api/notificacoes',     require('./routes/notificacoes.routes'))
app.use('/api/configuracoes',   require('./routes/configuracoes.routes'))
app.use('/api/admin',           require('./routes/admin.routes'))

const { errorHandler } = require('./utils/errors')
app.use(errorHandler)

module.exports = app
