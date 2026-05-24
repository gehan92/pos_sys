const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const { initDatabase } = require('./database')
const { startSync } = require('./sync')

const authRoutes          = require('./routes/auth')
const menuRoutes          = require('./routes/menu')
const ordersRoutes        = require('./routes/orders')
const tablesRoutes        = require('./routes/tables')
const billingRoutes       = require('./routes/billing')
const shiftsRoutes        = require('./routes/shifts')
const inventoryRoutes     = require('./routes/inventory')
const notificationsRoutes = require('./routes/notifications')

const app = express()
const PORT = process.env.BACKEND_PORT || 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }))
app.use(express.json())

// Routes
app.use('/api/auth',          authRoutes)
app.use('/api/menu',          menuRoutes)
app.use('/api/orders',        ordersRoutes)
app.use('/api/tables',        tablesRoutes)
app.use('/api/billing',       billingRoutes)
app.use('/api/shifts',        shiftsRoutes)
app.use('/api/inventory',     inventoryRoutes)
app.use('/api/notifications', notificationsRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Malta POS Backend', time: new Date().toISOString() })
})

// Start
initDatabase()
startSync()

app.listen(PORT, () => {
  console.log(`\n Malta POS backend running on http://localhost:${PORT}`)
  console.log(` Health check: http://localhost:${PORT}/api/health\n`)
})
