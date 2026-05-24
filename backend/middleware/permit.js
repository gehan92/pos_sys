// Role-based permission middleware
// Usage: router.get('/route', authMiddleware, permit('viewReports'), handler)

const { can } = require('../lib/permissions')

function permit(permission) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ error: 'Not authenticated' })

    if (!can(req.user, permission))
      return res.status(403).json({
        error: `Access denied. Required permission: ${permission}`,
        yourRole: req.user.role
      })

    next()
  }
}

// Allow any authenticated user (no specific permission needed)
function authenticated(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
  next()
}

module.exports = { permit, authenticated }
