const express = require('express')
const { getDb } = require('../database')
const { authMiddleware } = require('../middleware/auth')
const { permit } = require('../middleware/permit')

const router = express.Router()

// GET /api/billing/invoices — management + supervisor
router.get('/invoices', authMiddleware, permit('viewHistory'), (req, res) => {
  const db       = getDb()
  const invoices = db.prepare('SELECT * FROM invoices ORDER BY paid_at DESC').all()
  res.json(invoices)
})

// GET /api/billing/invoices/:id
router.get('/invoices/:id', authMiddleware, permit('viewHistory'), (req, res) => {
  const db      = getDb()
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id)
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
  res.json(invoice)
})

// POST /api/billing/invoices — cashier and above
router.post('/invoices', authMiddleware, permit('processPayment'), (req, res) => {
  const { order_id, subtotal, vat_amount, discount, total, payment_method, cash_tendered, change_given } = req.body
  const db = getDb()

  const invNum = (db.prepare('SELECT COUNT(*) as c FROM invoices').get().c || 0) + 1
  const result = db.prepare(`
    INSERT INTO invoices (invoice_number, order_id, cashier_id, cashier_name, subtotal, vat_amount, discount, total, payment_method, cash_tendered, change_given)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(invNum, order_id, req.user.id, req.user.full_name, subtotal, vat_amount, discount || 0, total, payment_method, cash_tendered, change_given)

  if (order_id) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id)
    db.prepare("UPDATE orders SET status='billed', synced=0 WHERE id=?").run(order_id)
    if (order?.table_id)
      db.prepare("UPDATE restaurant_tables SET status='free', updated_at=datetime('now') WHERE id=?").run(order.table_id)
  }

  db.prepare(`INSERT INTO audit_logs (user_id, user_name, role, action, module, details)
    VALUES (?, ?, ?, 'process_payment', 'billing', ?)`
  ).run(req.user.id, req.user.full_name, req.user.role, JSON.stringify({ invoice_number: invNum, total, payment_method }))

  res.json({ success: true, id: result.lastInsertRowid, invoice_number: invNum })
})

// GET /api/billing/summary — reports permission
router.get('/summary', authMiddleware, permit('viewReports'), (req, res) => {
  const db   = getDb()
  const date = req.query.date || new Date().toISOString().slice(0, 10)
  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_invoices,
      ROUND(SUM(total), 2) as total_revenue,
      ROUND(SUM(vat_amount), 2) as total_vat,
      ROUND(SUM(discount), 2) as total_discount,
      ROUND(SUM(CASE WHEN payment_method='cash'   THEN total ELSE 0 END), 2) as cash_total,
      ROUND(SUM(CASE WHEN payment_method='card'   THEN total ELSE 0 END), 2) as card_total,
      ROUND(SUM(CASE WHEN payment_method='mobile' THEN total ELSE 0 END), 2) as mobile_total
    FROM invoices WHERE date(paid_at) = ?
  `).get(date)
  res.json(summary)
})

// GET /api/billing/reports/range — date range report
router.get('/reports/range', authMiddleware, permit('viewReports'), (req, res) => {
  const db       = getDb()
  const { from, to } = req.query
  const invoices = db.prepare(`
    SELECT date(paid_at) as date,
      COUNT(*) as count,
      ROUND(SUM(total), 2) as revenue,
      ROUND(SUM(vat_amount), 2) as vat
    FROM invoices
    WHERE date(paid_at) BETWEEN ? AND ?
    GROUP BY date(paid_at) ORDER BY date
  `).all(from, to)
  res.json(invoices)
})

module.exports = router
