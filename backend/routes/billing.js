const express = require('express')
const { getDb } = require('../database')

const router = express.Router()

// GET /api/billing/invoices
router.get('/invoices', (req, res) => {
  const db       = getDb()
  const invoices = db.prepare('SELECT * FROM invoices ORDER BY paid_at DESC').all()
  res.json(invoices)
})

// GET /api/billing/invoices/:id
router.get('/invoices/:id', (req, res) => {
  const db      = getDb()
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id)
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
  res.json(invoice)
})

// POST /api/billing/invoices — process payment
router.post('/invoices', (req, res) => {
  const { order_id, cashier_id, cashier_name, subtotal, vat_amount, discount, total, payment_method, cash_tendered, change_given } = req.body
  const db = getDb()

  const invNum = (db.prepare('SELECT COUNT(*) as c FROM invoices').get().c || 0) + 1

  const result = db.prepare(`
    INSERT INTO invoices (invoice_number, order_id, cashier_id, cashier_name, subtotal, vat_amount, discount, total, payment_method, cash_tendered, change_given)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(invNum, order_id, cashier_id, cashier_name, subtotal, vat_amount, discount || 0, total, payment_method, cash_tendered, change_given)

  // Mark order as billed
  if (order_id) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id)
    db.prepare("UPDATE orders SET status = 'billed', synced = 0 WHERE id = ?").run(order_id)
    if (order?.table_id) {
      db.prepare("UPDATE restaurant_tables SET status = 'free', updated_at = datetime('now') WHERE id = ?").run(order.table_id)
    }
  }

  res.json({ success: true, id: result.lastInsertRowid, invoice_number: invNum })
})

// GET /api/billing/summary — daily summary for reports
router.get('/summary', (req, res) => {
  const db   = getDb()
  const date = req.query.date || new Date().toISOString().slice(0, 10)

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_invoices,
      SUM(total) as total_revenue,
      SUM(vat_amount) as total_vat,
      SUM(discount) as total_discount,
      SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as cash_total,
      SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END) as card_total,
      SUM(CASE WHEN payment_method = 'mobile' THEN total ELSE 0 END) as mobile_total
    FROM invoices
    WHERE date(paid_at) = ?
  `).get(date)

  res.json(summary)
})

module.exports = router
