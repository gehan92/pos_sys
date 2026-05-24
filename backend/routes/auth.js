const express = require('express')
const bcrypt  = require('bcryptjs')
const { getDb } = require('../database')
const { signToken } = require('../middleware/auth')
const { authMiddleware } = require('../middleware/auth')
const { permit } = require('../middleware/permit')

const router = express.Router()

// POST /api/auth/login — public
router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' })

  const db   = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND status = ?')
                 .get(username.trim(), 'active')

  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Invalid credentials' })

  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id)

  // Audit log
  db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module)
    VALUES (?, ?, ?, 'login', 'auth')`).run(user.id, user.full_name, user.role)

  const { password_hash, pin, ...safeUser } = user
  const token = signToken(safeUser)
  res.json({ success: true, token, user: safeUser })
})

// GET /api/auth/me — verify token and return user
router.get('/me', authMiddleware, (req, res) => {
  const db   = getDb()
  const user = db.prepare('SELECT id, full_name, username, role, status, last_login FROM users WHERE id = ?').get(req.user.id)
  res.json(user)
})

// GET /api/auth/users — management only
router.get('/users', authMiddleware, permit('viewStaff'), (req, res) => {
  const db    = getDb()
  const users = db.prepare(
    'SELECT id, full_name, username, role, status, created_at, last_login FROM users ORDER BY full_name'
  ).all()
  res.json(users)
})

// POST /api/auth/users — owner/admin/superadmin only
router.post('/users', authMiddleware, permit('manageUsers'), (req, res) => {
  const { full_name, username, password, role } = req.body
  if (!full_name || !username || !password || !role)
    return res.status(400).json({ error: 'All fields required' })

  const db   = getDb()
  const hash = bcrypt.hashSync(password, 10)
  try {
    const result = db.prepare(
      'INSERT INTO users (full_name, username, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run(full_name, username, hash, role)

    db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module, details)
      VALUES (?, ?, ?, 'create_user', 'users', ?)`
    ).run(req.user.id, req.user.full_name, req.user.role, JSON.stringify({ new_user: username, role }))

    res.json({ success: true, id: result.lastInsertRowid })
  } catch {
    res.status(409).json({ error: 'Username already exists' })
  }
})

// PUT /api/auth/users/:id — update user details
router.put('/users/:id', authMiddleware, permit('manageUsers'), (req, res) => {
  const { full_name, role, status } = req.body
  const db = getDb()
  db.prepare('UPDATE users SET full_name = ?, role = ?, status = ? WHERE id = ?')
    .run(full_name, role, status, req.params.id)
  res.json({ success: true })
})

// PUT /api/auth/users/:id/status — suspend/activate
router.put('/users/:id/status', authMiddleware, permit('manageUsers'), (req, res) => {
  const { status } = req.body
  const db = getDb()
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id)

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module, details)
    VALUES (?, ?, ?, 'change_user_status', 'users', ?)`
  ).run(req.user.id, req.user.full_name, req.user.role, JSON.stringify({ target_id: req.params.id, status }))

  res.json({ success: true })
})

// PUT /api/auth/users/:id/password — change password (own or admin)
router.put('/users/:id/password', authMiddleware, (req, res) => {
  const isSelf  = req.user.id === req.params.id
  const isAdmin = ['superadmin','admin','owner'].includes(req.user.role)
  if (!isSelf && !isAdmin)
    return res.status(403).json({ error: 'Cannot change another user\'s password' })

  const { password } = req.body
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' })

  const db   = getDb()
  const hash = bcrypt.hashSync(password, 10)
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.params.id)
  res.json({ success: true })
})

module.exports = router
