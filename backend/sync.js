// Background sync — pushes unsynced local records to Supabase cloud
// Runs every 30 seconds when internet is available
// If no VITE_SUPABASE_URL is set, sync is silently skipped

const SYNC_INTERVAL_MS = 30_000

let supabase = null

function getSupabase() {
  if (supabase) return supabase
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key || url.includes('your-project')) return null
  const { createClient } = require('@supabase/supabase-js')
  supabase = createClient(url, key)
  return supabase
}

async function syncTable(db, client, tableName, columns) {
  const rows = db.prepare(`SELECT * FROM ${tableName} WHERE synced = 0`).all()
  if (rows.length === 0) return

  const { error } = await client.from(tableName).upsert(
    rows.map(r => {
      const obj = {}
      columns.forEach(c => { obj[c] = r[c] })
      return obj
    }),
    { onConflict: 'id' }
  )

  if (!error) {
    const ids = rows.map(r => r.id)
    const mark = db.prepare(`UPDATE ${tableName} SET synced = 1 WHERE id = ?`)
    const markAll = db.transaction(ids => { for (const id of ids) mark.run(id) })
    markAll(ids)
    console.log(` Synced ${rows.length} row(s) → ${tableName}`)
  }
}

async function runSync() {
  const client = getSupabase()
  if (!client) return

  try {
    const { getDb } = require('./database')
    const db = getDb()

    await syncTable(db, client, 'orders',   ['id','order_number','table_id','table_number','waiter_id','waiter_name','order_type','status','notes','created_at','updated_at'])
    await syncTable(db, client, 'order_items', ['id','order_id','menu_item_id','item_name','quantity','unit_price','modifiers','status'])
    await syncTable(db, client, 'invoices', ['id','invoice_number','order_id','cashier_id','cashier_name','subtotal','vat_amount','discount','total','payment_method','cash_tendered','change_given','paid_at'])
    await syncTable(db, client, 'shifts',   ['id','user_id','user_name','role','clock_in','clock_out','notes','created_at'])
    await syncTable(db, client, 'restaurant_tables', ['id','number','capacity','status','floor','updated_at'])
  } catch (err) {
    // Silent fail — local DB is always the source of truth
  }
}

function startSync() {
  const client = getSupabase()
  if (!client) {
    console.log(' Cloud sync: disabled (no Supabase credentials)')
    return
  }
  console.log(' Cloud sync: enabled — syncing every 30s')
  setInterval(runSync, SYNC_INTERVAL_MS)
  runSync() // run immediately on startup
}

module.exports = { startSync, runSync }
