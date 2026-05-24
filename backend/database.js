const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const DB_PATH    = path.join(__dirname, '../malta-pos.db')
const SCHEMA_PATH = path.join(__dirname, 'schema.sql')
const SEED_PATH  = path.join(__dirname, 'seed.js')

let db

function getDb() {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

function initDatabase() {
  const database = getDb()
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8')
  database.exec(schema)
  console.log(' Database ready:', DB_PATH)

  // Seed demo data on first run
  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get()
  if (userCount.count === 0) {
    require('./seed')
    console.log(' Demo data seeded')
  }
}

module.exports = { getDb, initDatabase }
