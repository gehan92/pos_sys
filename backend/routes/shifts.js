const express = require('express')
const { getDb } = require('../database')
const { authMiddleware } = require('../middleware/auth')
const { permit } = require('../middleware/permit')

const router = express.Router()

// GET /api/shifts — management sees all, others see own
router.get('/', authMiddleware, (req, res) => {
  const db  = getDb()
  const { can } = require('../lib/permissions')
  const canViewAll = can(req.user, 'viewAllShifts')

  const shifts = canViewAll
    ? db.prepare('SELECT * FROM shifts ORDER BY clock_in DESC').all()
    : db.prepare('SELECT * FROM shifts WHERE user_id = ? ORDER BY clock_in DESC').all(req.user.id)

  res.json(shifts)
})

// POST /api/shifts/clock-in — any authenticated user (for themselves)
router.post('/clock-in', authMiddleware, (req, res) => {
  const db = getDb()
  const userId = req.user.id

  const open = db.prepare('SELECT id FROM shifts WHERE user_id = ? AND clock_out IS NULL').get(userId)
  if (open) return res.status(409).json({ error: 'Already clocked in' })

  const result = db.prepare(`
    INSERT INTO shifts (user_id, user_name, role, clock_in) VALUES (?, ?, ?, datetime('now'))
  `).run(userId, req.user.full_name, req.user.role)

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module)
    VALUES (?, ?, ?, 'clock_in', 'shifts')`).run(userId, req.user.full_name, req.user.role)

  res.json({ success: true, id: result.lastInsertRowid })
})

// PUT /api/shifts/clock-out — clock out own active shift
router.put('/clock-out', authMiddleware, (req, res) => {
  const db   = getDb()
  const open = db.prepare('SELECT id FROM shifts WHERE user_id = ? AND clock_out IS NULL').get(req.user.id)
  if (!open) return res.status(404).json({ error: 'No active shift found' })

  db.prepare("UPDATE shifts SET clock_out=datetime('now'), synced=0 WHERE id=?").run(open.id)

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module)
    VALUES (?, ?, ?, 'clock_out', 'shifts')`).run(req.user.id, req.user.full_name, req.user.role)

  res.json({ success: true })
})

// PUT /api/shifts/force-clock-out/:userId — supervisor and above
router.put('/force-clock-out/:userId', authMiddleware, permit('forceClockOut'), (req, res) => {
  const db   = getDb()
  const open = db.prepare('SELECT id FROM shifts WHERE user_id = ? AND clock_out IS NULL').get(req.params.userId)
  if (!open) return res.status(404).json({ error: 'No active shift for this user' })

  db.prepare("UPDATE shifts SET clock_out=datetime('now'), synced=0 WHERE id=?").run(open.id)

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module, details)
    VALUES (?, ?, ?, 'force_clock_out', 'shifts', ?)`
  ).run(req.user.id, req.user.full_name, req.user.role, JSON.stringify({ target_user_id: req.params.userId }))

  res.json({ success: true })
})

// GET /api/shifts/active — all currently clocked-in staff (supervisor+)
router.get('/active', authMiddleware, permit('viewAllShifts'), (req, res) => {
  const db = getDb()
  const active = db.prepare(`
    SELECT s.*, u.full_name, u.role FROM shifts s
    JOIN users u ON s.user_id = u.id
    WHERE s.clock_out IS NULL ORDER BY s.clock_in
  `).all()
  res.json(active)
})

module.exports = router
