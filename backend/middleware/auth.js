// Verifies JWT token on every protected request
// Attaches req.user = { id, username, role, full_name }

const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'malta-pos-secret-change-in-production'

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token provided' })

  const token = header.slice(7)
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: '12h' }
  )
}

module.exports = { authMiddleware, signToken }
