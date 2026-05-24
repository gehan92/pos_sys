import { useState, useEffect, useCallback } from 'react'
import {
  Database, RefreshCw, Search, ChevronLeft, ChevronRight,
  Trash2, AlertCircle, Loader2, Unlink, LogIn, Eye, EyeOff, X
} from 'lucide-react'

const BACKEND     = 'http://localhost:3001'
const SESSION_KEY = 'dbviewer_token'

const DB_TABLES = [
  { name: 'company',            icon: '🏢', label: 'Company'          },
  { name: 'users',              icon: '👥', label: 'Users'            },
  { name: 'restaurant_tables',  icon: '🍽️', label: 'Tables'           },
  { name: 'menu_categories',    icon: '🗂️', label: 'Menu Categories'  },
  { name: 'menu_items',         icon: '🍛', label: 'Menu Items'       },
  { name: 'orders',             icon: '📋', label: 'Orders'           },
  { name: 'order_items',        icon: '📝', label: 'Order Items'      },
  { name: 'invoices',           icon: '🧾', label: 'Invoices'         },
  { name: 'shifts',             icon: '🗓️', label: 'Shifts'           },
  { name: 'inventory',          icon: '📦', label: 'Inventory'        },
  { name: 'notifications',      icon: '🔔', label: 'Notifications'    },
  { name: 'audit_logs',         icon: '🔍', label: 'Audit Logs'       },
]

function formatCell(value) {
  if (value === null || value === undefined) return <span className="text-gray-300 dark:text-gray-600 italic text-xs">null</span>
  if (typeof value === 'string' && value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed) && parsed.length === 0) return <span className="text-gray-300 dark:text-gray-600 italic text-xs">[]</span>
      return <span className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-mono">{`[${parsed.length}]`}</span>
    } catch {}
  }
  if (typeof value === 'string' && value.startsWith('{')) {
    return <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-mono">{'{…}'}</span>
  }
  const str = String(value)
  if (str === '0' || str === '1') {
    return <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${str === '1' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>{str === '1' ? 'YES' : 'NO'}</span>
  }
  if (str.length > 40) return <span title={str} className="truncate max-w-[180px] inline-block text-xs">{str.slice(0, 38)}…</span>
  return <span className="text-xs">{str}</span>
}

export default function DatabaseViewer() {
  const [token,       setToken]       = useState(() => sessionStorage.getItem(SESSION_KEY) || '')
  const [tableCounts, setTableCounts] = useState({})
  const [selected,    setSelected]    = useState('users')
  const [rows,        setRows]        = useState([])
  const [total,       setTotal]       = useState(0)
  const [offset,      setOffset]      = useState(0)
  const [loading,     setLoading]     = useState(false)
  const [tableLoading,setTableLoading]= useState(false)
  const [error,       setError]       = useState('')
  const [search,      setSearch]      = useState('')
  const [deleteId,    setDeleteId]    = useState(null)
  const [deleting,    setDeleting]    = useState(false)

  // Login form
  const [loginForm,   setLoginForm]   = useState({ username: 'superadmin', password: '' })
  const [loginErr,    setLoginErr]    = useState('')
  const [loginLoading,setLoginLoading]= useState(false)
  const [showPwd,     setShowPwd]     = useState(false)

  const LIMIT = 50

  const apiFetch = useCallback(async (path, options = {}) => {
    const res = await fetch(`${BACKEND}${path}`, {
      ...options,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
    })
    if (res.status === 401 || res.status === 403) {
      sessionStorage.removeItem(SESSION_KEY)
      setToken('')
      throw new Error('Session expired — please login again')
    }
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Request failed') }
    return res.json()
  }, [token])

  // Load table counts
  const loadCounts = useCallback(async () => {
    if (!token) return
    setTableLoading(true)
    try {
      const data = await apiFetch('/api/dbviewer')
      const map = {}
      data.forEach(t => { map[t.name] = t.count })
      setTableCounts(map)
    } catch (e) { setError(e.message) } finally { setTableLoading(false) }
  }, [token, apiFetch])

  // Load rows for selected table
  const loadRows = useCallback(async (tbl = selected, off = offset) => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch(`/api/dbviewer/${tbl}?limit=${LIMIT}&offset=${off}`)
      setRows(data.rows)
      setTotal(data.total)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [token, selected, offset, apiFetch])

  useEffect(() => { if (token) { loadCounts(); loadRows() } }, [token]) // eslint-disable-line

  function selectTable(name) {
    setSelected(name)
    setOffset(0)
    setSearch('')
    setError('')
    if (token) {
      setLoading(true)
      setError('')
      apiFetch(`/api/dbviewer/${name}?limit=${LIMIT}&offset=0`)
        .then(data => { setRows(data.rows); setTotal(data.total) })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginErr('')
    try {
      const res = await fetch(`${BACKEND}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      if (data.user?.role !== 'superadmin') throw new Error('Only superadmin can access the database viewer')
      sessionStorage.setItem(SESSION_KEY, data.token)
      setToken(data.token)
    } catch (e) { setLoginErr(e.message) } finally { setLoginLoading(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await apiFetch(`/api/dbviewer/${selected}/${deleteId}`, { method: 'DELETE' })
      setDeleteId(null)
      await loadRows()
      await loadCounts()
    } catch (e) { setError(e.message) } finally { setDeleting(false) }
  }

  function disconnect() {
    sessionStorage.removeItem(SESSION_KEY)
    setToken('')
    setRows([])
    setTableCounts({})
  }

  const filteredRows = search.trim()
    ? rows.filter(row =>
        Object.values(row).some(v => v !== null && String(v).toLowerCase().includes(search.toLowerCase()))
      )
    : rows

  const columns = rows.length > 0 ? Object.keys(rows[0]) : []
  const pageCount = Math.ceil(total / LIMIT)
  const currentPage = Math.floor(offset / LIMIT) + 1
  const tableInfo = DB_TABLES.find(t => t.name === selected)

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Database size={32} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Database Viewer</h2>
            <p className="text-sm text-gray-400 mt-1">Superadmin access required</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Username</label>
              <input
                value={loginForm.username}
                onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))}
                placeholder="superadmin"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Enter password"
                  autoFocus
                  className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {loginErr && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400 px-3 py-2 rounded-xl">
                <AlertCircle size={13} /> {loginErr}
              </div>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
            >
              {loginLoading ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
              Connect to Database
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Backend must be running at <span className="font-mono">{BACKEND}</span>
          </p>
        </div>
      </div>
    )
  }

  // ── Main viewer ─────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-4 h-full min-h-0" style={{ height: 'calc(100vh - 100px)' }}>

      {/* Left sidebar — table list */}
      <aside className="w-52 flex-shrink-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tables</span>
          <button
            onClick={() => { loadCounts(); loadRows() }}
            disabled={tableLoading}
            title="Refresh counts"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <RefreshCw size={12} className={tableLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
          {DB_TABLES.map(t => (
            <button
              key={t.name}
              onClick={() => selectTable(t.name)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all text-xs font-medium ${
                selected === t.name
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-sm leading-none flex-shrink-0">{t.icon}</span>
              <span className="flex-1 truncate">{t.label}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                selected === t.name
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                {tableCounts[t.name] ?? '…'}
              </span>
            </button>
          ))}
        </nav>
        <div className="px-3 py-2.5 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={disconnect}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors font-medium"
          >
            <Unlink size={11} /> Disconnect
          </button>
        </div>
      </aside>

      {/* Right — data panel */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">

        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg leading-none">{tableInfo?.icon}</span>
            <div className="min-w-0">
              <div className="font-bold text-gray-900 dark:text-white text-sm truncate">{tableInfo?.label}</div>
              <div className="text-xs text-gray-400 font-mono">{selected} · {total} rows</div>
            </div>
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter rows…"
              className="pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 w-44"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={11} />
              </button>
            )}
          </div>

          <button
            onClick={() => loadRows()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400 px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-800">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Table */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full min-h-[200px] gap-3 text-gray-400">
                <Loader2 size={20} className="animate-spin" /> Loading…
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-2 text-gray-400">
                <Database size={32} className="opacity-30" />
                <span className="text-sm">{search ? 'No rows match filter' : 'Table is empty'}</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-max">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-3 py-2.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide w-10">#</th>
                    {columns.map(col => (
                      <th key={col} className="px-3 py-2.5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                    <th className="px-3 py-2.5 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, i) => (
                    <tr
                      key={row.id || i}
                      className="border-b border-gray-50 dark:border-gray-800 hover:bg-purple-50/40 dark:hover:bg-purple-900/10 transition-colors group"
                    >
                      <td className="px-3 py-2 text-[10px] text-gray-300 dark:text-gray-600 font-mono">
                        {offset + i + 1}
                      </td>
                      {columns.map(col => (
                        <td key={col} className="px-3 py-2 max-w-[220px]">
                          {formatCell(row[col])}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-right">
                        {row.id && selected !== 'company' && (
                          <button
                            onClick={() => setDeleteId(row.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                            title="Delete row"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && total > LIMIT && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xs text-gray-400">
                Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of <strong className="text-gray-600 dark:text-gray-300">{total}</strong>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { const o = Math.max(0, offset - LIMIT); setOffset(o); loadRows(selected, o) }}
                  disabled={offset === 0}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={12} /> Prev
                </button>
                <span className="text-xs text-gray-400 px-1">{currentPage} / {pageCount}</span>
                <button
                  onClick={() => { const o = offset + LIMIT; setOffset(o); loadRows(selected, o) }}
                  disabled={offset + LIMIT >= total}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-rose-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Delete row?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Table: <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{selected}</span>
            </p>
            <p className="text-xs text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-xl mb-5 break-all">
              id: {deleteId}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors disabled:opacity-60"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
