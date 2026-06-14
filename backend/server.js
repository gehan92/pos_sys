const express = require('express')
const cors    = require('cors')
const path    = require('path')
const helmet  = require('helmet')
const morgan  = require('morgan')
const rateLimit = require('express-rate-limit')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const { initDatabase } = require('./database')
const { startSync }    = require('./sync')

const authRoutes          = require('./routes/auth')
const menuRoutes          = require('./routes/menu')
const ordersRoutes        = require('./routes/orders')
const tablesRoutes        = require('./routes/tables')
const billingRoutes       = require('./routes/billing')
const shiftsRoutes        = require('./routes/shifts')
const inventoryRoutes     = require('./routes/inventory')
const notificationsRoutes = require('./routes/notifications')
const dbviewerRoutes      = require('./routes/dbviewer')

const app  = express()
const PORT = process.env.BACKEND_PORT || 3001

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173']

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet())

// ── HTTP request logging ──────────────────────────────────────────────────────
app.use(morgan('dev'))

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({ origin: allowedOrigins }))

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
})

app.use('/api/', globalLimiter)
app.use('/api/auth/login', authLimiter)

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes)
app.use('/api/menu',          menuRoutes)
app.use('/api/orders',        ordersRoutes)
app.use('/api/tables',        tablesRoutes)
app.use('/api/billing',       billingRoutes)
app.use('/api/shifts',        shiftsRoutes)
app.use('/api/inventory',     inventoryRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/dbviewer',      dbviewerRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Malta POS Backend', time: new Date().toISOString() })
})

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(`[ERROR] ${_req.method} ${_req.path}:`, err.message)
  const status = err.status || err.statusCode || 500
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
})

// ── Start ─────────────────────────────────────────────────────────────────────
initDatabase()
startSync()

app.listen(PORT, () => {
  console.log(`\n Malta POS backend running on http://localhost:${PORT}`)
  console.log(` Health check: http://localhost:${PORT}/api/health\n`)
})
