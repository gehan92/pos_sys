const express = require('express')
const bcrypt  = require('bcryptjs')
const { getDb } = require('../database')

const router = express.Router()

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' })

  const db   = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND status = ?')
                 .get(username.trim(), 'active')

  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Invalid credentials' })

  db.prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?').run(user.id)

  const { password_hash, pin, ...safeUser } = user
  res.json({ success: true, user: safeUser })
})

// GET /api/auth/users
router.get('/users', (req, res) => {
  const db = getDb()
  const users = db.prepare(
    'SELECT id, full_name, username, role, status, created_at, last_login FROM users ORDER BY full_name'
  ).all()
  res.json(users)
})

// POST /api/auth/users — create user
router.post('/users', (req, res) => {
  const { full_name, username, password, role } = req.body
  if (!full_name || !username || !password || !role)
    return res.status(400).json({ error: 'All fields required' })

  const db   = getDb()
  const hash = bcrypt.hashSync(password, 10)
  try {
    const result = db.prepare(
      'INSERT INTO users (full_name, username, password_hash, role) VALUES (?, ?, ?, ?)'
    ).run(full_name, username, hash, role)
    res.json({ success: true, id: result.lastInsertRowid })
  } catch {
    res.status(409).json({ error: 'Username already exists' })
  }
})

// PUT /api/auth/users/:id/status
router.put('/users/:id/status', (req, res) => {
  const { status } = req.body
  const db = getDb()
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id)
  res.json({ success: true })
})

module.exports = router
