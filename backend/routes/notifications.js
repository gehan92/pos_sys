const express = require('express')
const { getDb } = require('../database')
const { authMiddleware } = require('../middleware/auth')
const { permit } = require('../middleware/permit')

const router = express.Router()

// GET /api/notifications — own notifications (or all for supervisors+)
router.get('/', authMiddleware, (req, res) => {
  const db = getDb()
  const { can } = require('../lib/permissions')
  const canViewAll = can(req.user, 'viewAllNotifs')

  const notifs = canViewAll
    ? db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100').all()
    : db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id)

  res.json(notifs)
})

// GET /api/notifications/unread-count
router.get('/unread-count', authMiddleware, (req, res) => {
  const db    = getDb()
  const count = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id)
  res.json({ count: count.count })
})

// PUT /api/notifications/:id/read — mark one as read
router.put('/:id/read', authMiddleware, (req, res) => {
  const db = getDb()
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ success: true })
})

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', authMiddleware, (req, res) => {
  const db = getDb()
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id)
  res.json({ success: true })
})

// POST /api/notifications — create notification (management+)
router.post('/', authMiddleware, permit('viewAllNotifs'), (req, res) => {
  const { user_id, message_en, type, module } = req.body
  const db     = getDb()
  const result = db.prepare(
    'INSERT INTO notifications (user_id, message_en, type, module) VALUES (?, ?, ?, ?)'
  ).run(user_id, message_en, type || 'info', module)
  res.json({ success: true, id: result.lastInsertRowid })
})

// GET /api/audit — audit logs (management only)
router.get('/audit', authMiddleware, permit('viewEditHistory'), (req, res) => {
  const db   = getDb()
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200').all()
  res.json(logs.map(l => ({ ...l, details: l.details ? JSON.parse(l.details) : null })))
})

module.exports = router
