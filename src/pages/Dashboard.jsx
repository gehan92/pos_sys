// ─── Dashboard ───────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react'
import { useApp, ROLES, ROLE_NAV } from '../context/AppContext'
import { t } from '../i18n/translations'
import { Card, StatCard, Badge, Table, TR, TD, Btn, Avatar, Divider, SectionLabel, statusColor, Input, Select, Textarea } from '../components/UI'
import { SAMPLE_USERS, SAMPLE_ORDERS, INVENTORY_ITEMS, TABLES, MENU_CATEGORIES, MENU_ITEMS, SAMPLE_INVOICES, SUPPLIER_INVOICES } from '../lib/mockData'
import { can } from '../lib/permissions'
import { AlertTriangle, Timer, GitMerge, ArrowRight, CheckCircle2, Flame, Activity, Printer, Play, AlertCircle, Wine, ChefHat } from 'lucide-react'

export function Dashboard({ navTo }) {
  const { user, lang, users, approveUser } = useApp()
  const isManagement = ['superadmin','admin','owner','manager','supervisor'].includes(user?.role)
  const canApprove = ['superadmin','admin'].includes(user?.role)
  const pendingUsers = users.filter(u => u.status === 'pending')

  return (
    <div>
      {isManagement && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard label="Today's sales" value="€2,840" sub="+12% vs yesterday" />
          <StatCard label="Orders" value="47" sub="8 pending" />
          <StatCard label="Tables" value="9/12" sub="75% occupied" />
          <StatCard label="Low stock" value="3" sub="Restock needed" subColor="text-red-500" />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-900 dark:text-white text-sm">Recent activity</h2>
            <Badge color="blue">Live</Badge>
          </div>
          <Table headers={['Time','Action','User','Status']}>
            {[['14:32','Order #047 placed','Maria G.','cooking'],['14:28','Invoice #312 paid','John C.','paid'],['14:15','New user request','Manager','pending'],['13:55','Stock updated','Supplier','active'],['13:40','Table 6 cleared','Waiter','free']].map(([time,action,u,s]) => (
              <TR key={time}>
                <TD>{time}</TD><TD>{action}</TD><TD>{u}</TD>
                <TD><Badge color={statusColor(s)}>{s}</Badge></TD>
              </TR>
            ))}
          </Table>
        </Card>
        <div className="space-y-4">
          {isManagement && canApprove && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-medium text-gray-900 dark:text-white text-sm">Pending approvals</h2>
                <Badge color={pendingUsers.length > 0 ? 'red' : 'green'}>{pendingUsers.length}</Badge>
              </div>
              {pendingUsers.length === 0
                ? <p className="text-sm text-gray-400 text-center py-3">All users approved</p>
                : pendingUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-2">
                    <Avatar name={u.full_name} />
                    <div>
                      <div className="text-sm text-gray-800 dark:text-gray-200">{u.full_name}</div>
                      <div className="text-xs text-gray-400">{ROLES[u.role]?.label} · by {u.created_by}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Btn size="sm" variant="success" onClick={() => approveUser(u.id)}>Approve</Btn>
                    <Btn size="sm" onClick={() => navTo('users')}>View all</Btn>
                  </div>
                </div>
                ))
              }
            </Card>
          )}
          <Card>
            <h2 className="font-medium text-gray-900 dark:text-white text-sm mb-3">Low stock alerts</h2>
            {INVENTORY_ITEMS.filter(i => i.quantity < i.min_stock).map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-sm text-gray-700 dark:text-gray-300">{item.item_name}</span>
                <span className="text-xs text-red-500">{item.quantity}{item.unit} / min {item.min_stock}{item.unit}</span>
              </div>
            ))}
            <Btn size="sm" variant="primary" className="mt-3" onClick={() => navTo('inventory')}>View Inventory</Btn>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function Users() {
  const { lang, user: currentUser, users, createUser, approveUser, deactivateUser } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name:'', username:'', role:'waiter', password:'' })
  const [confirmDeactivate, setConfirmDeactivate] = useState(null)
  const [usernameError, setUsernameError] = useState('')

  // Which roles the current user is allowed to create
  const CREATABLE_ROLES = {
    superadmin: ['superadmin','admin','owner','manager','cashier','supervisor','waiter','cook','supplier'],
    admin:      ['admin','owner','manager','cashier','supervisor','waiter','cook','supplier'],
    owner:      ['manager','cashier','supervisor','waiter','cook'],
    manager:    ['cashier','waiter','cook'],
  }
  const allowedRoles = CREATABLE_ROLES[currentUser?.role] || []

  // Only superadmin & admin can approve
  const canApprove = ['superadmin','admin'].includes(currentUser?.role)

  function handleCreate() {
    if (!form.full_name.trim() || !form.username.trim() || !form.password.trim()) return
    if (!allowedRoles.includes(form.role)) return
    // Check username uniqueness
    if (users.find(u => u.username === form.username.trim())) {
      setUsernameError('Username already taken')
      return
    }
    setUsernameError('')
    createUser({ ...form, username: form.username.trim().toLowerCase() }, currentUser)
    setShowForm(false)
    setForm({ full_name:'', username:'', role: allowedRoles[0] || 'waiter', password:'' })
  }

  const pendingCount = users.filter(u => u.status === 'pending').length

  return (
    <div>
      {/* Confirm deactivate dialog */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl w-full sm:max-w-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Deactivate account?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              <strong>{confirmDeactivate.full_name}</strong> will no longer be able to log in.
            </p>
            <div className="flex gap-2">
              <Btn fullWidth onClick={() => setConfirmDeactivate(null)}>Cancel</Btn>
              <Btn variant="danger" fullWidth onClick={() => { deactivateUser(confirmDeactivate.id); setConfirmDeactivate(null) }}>Deactivate</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Pending approvals banner */}
      {pendingCount > 0 && canApprove && (
        <div className="mb-4 flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
          <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">⏳ {pendingCount} account{pendingCount > 1 ? 's' : ''} awaiting your approval</span>
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-medium text-gray-900 dark:text-white">Staff accounts</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {allowedRoles.length > 0
                ? <>You can create: <span className="font-semibold text-indigo-500">{allowedRoles.map(r => ROLES[r]?.label).join(', ')}</span></>
                : 'You do not have permission to create accounts'}
            </p>
          </div>
          {allowedRoles.length > 0 && (
            <Btn variant="primary" size="sm" onClick={() => { setShowForm(!showForm); setUsernameError('') }}>
              {showForm ? 'Cancel' : '+ Add User'}
            </Btn>
          )}
        </div>

        {/* Create account form */}
        {showForm && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">New staff account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <Input label="Full Name" value={form.full_name} onChange={e => setForm(p=>({...p,full_name:e.target.value}))} placeholder="e.g. Maria Galea" />
              <div>
                <Input label="Username" value={form.username} onChange={e => { setForm(p=>({...p,username:e.target.value})); setUsernameError('') }} placeholder="mgalea" />
                {usernameError && <p className="text-xs text-rose-500 mt-1">{usernameError}</p>}
              </div>
              <Select label="Role" value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))}>
                {allowedRoles.map(k => <option key={k} value={k}>{ROLES[k]?.label}</option>)}
              </Select>
              <Input label="Temporary Password" type="password" value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))} placeholder="Temp@1234" />
            </div>
            {/* Status notice */}
            {['manager','owner'].includes(currentUser?.role) ? (
              <div className="flex items-start gap-2 mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                ⚠ This account will be <strong className="mx-1">pending approval</strong> — an Admin or Super Admin must activate it before the user can log in.
              </div>
            ) : (
              <div className="flex items-start gap-2 mb-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                ✅ Account will be <strong className="mx-1">immediately active</strong> — the user can log in right away.
              </div>
            )}
            <div className="flex gap-2">
              <Btn variant="success" onClick={handleCreate} disabled={!form.full_name.trim() || !form.username.trim() || !form.password.trim()}>
                Create Account
              </Btn>
              <Btn onClick={() => { setShowForm(false); setUsernameError('') }}>Cancel</Btn>
            </div>
          </div>
        )}

        {/* Users table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Staff member</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Created by</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.full_name} />
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{u.full_name}</div>
                        <div className="text-xs text-gray-400 font-mono">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={statusColor(u.role)}>{ROLES[u.role]?.label || u.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell">{u.created_by || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge color={u.status==='active'?'green':u.status==='pending'?'yellow':'red'}>
                      {u.status === 'active' ? '✓ Active' : u.status === 'pending' ? '⏳ Pending' : '✗ Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {u.status === 'pending' && canApprove && (
                        <Btn size="sm" variant="success" onClick={() => approveUser(u.id)}>Approve</Btn>
                      )}
                      {u.status === 'active' && u.id !== currentUser?.id && (
                        <Btn size="sm" variant="danger" onClick={() => setConfirmDeactivate(u)}>Deactivate</Btn>
                      )}
                      {u.status === 'inactive' && canApprove && (
                        <Btn size="sm" variant="primary" onClick={() => approveUser(u.id)}>Reactivate</Btn>
                      )}
                      {u.id === currentUser?.id && (
                        <span className="text-xs text-gray-400 italic px-2">You</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ─── Waiters ──────────────────────────────────────────────────────────────────
export function Waiters() {
  const { user: currentUser, users, createUser, updateUser, deleteUser, approveUser, deactivateUser } = useApp()

  const waiters = users.filter(u => u.role === 'waiter')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', username: '', password: '', pin: '' })
  const [usernameError, setUsernameError] = useState('')
  const [editModal, setEditModal] = useState(null)   // { user } | null
  const [editForm, setEditForm] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)

  function handleCreate() {
    if (!form.full_name.trim() || !form.username.trim() || !form.password.trim()) return
    if (users.find(u => u.username === form.username.trim())) {
      setUsernameError('Username already taken')
      return
    }
    setUsernameError('')
    createUser({ full_name: form.full_name.trim(), username: form.username.trim().toLowerCase(), password: form.password, pin: form.pin.trim(), role: 'waiter' }, currentUser)
    setShowForm(false)
    setForm({ full_name: '', username: '', password: '', pin: '' })
  }

  function openEdit(u) {
    setEditForm({ full_name: u.full_name, pin: u.pin || '' })
    setEditModal(u)
  }

  function handleSave() {
    if (!editForm.full_name.trim()) return
    updateUser(editModal.id, { full_name: editForm.full_name.trim(), pin: editForm.pin.trim() })
    setEditModal(null)
  }

  function handleDelete(u) {
    deleteUser(u.id)
    setConfirmDelete(null)
  }

  const canManage = ['superadmin', 'admin', 'owner', 'manager'].includes(currentUser?.role)

  // ── Waiter sees only their own record ─────────────────────────────────────
  if (currentUser?.role === 'waiter') {
    const me = users.find(u => u.id === currentUser.id) || currentUser
    return (
      <div className="max-w-sm mx-auto">
        <Card>
          <div className="flex items-center gap-4 mb-5">
            <Avatar name={me.full_name} size="lg" />
            <div>
              <div className="text-base font-extrabold text-gray-900 dark:text-white">{me.full_name}</div>
              <div className="text-xs text-gray-400 font-mono mt-0.5">@{me.username}</div>
              <div className="mt-1.5">
                <Badge color={me.status === 'active' ? 'green' : me.status === 'pending' ? 'yellow' : 'red'}>
                  {me.status === 'active' ? '✓ Active' : me.status === 'pending' ? '⏳ Pending' : '✗ Inactive'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-3">
              <div className="text-xs text-gray-400 mb-0.5">Role</div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100">Waiter</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-3">
              <div className="text-xs text-gray-400 mb-0.5">PIN</div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100">
                {me.pin ? <span className="font-mono tracking-widest">{'•'.repeat(me.pin.length)}</span> : <span className="text-gray-400 text-xs">Not set</span>}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-3">
              <div className="text-xs text-gray-400 mb-0.5">Username</div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100 font-mono">@{me.username}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-3">
              <div className="text-xs text-gray-400 mb-0.5">Created By</div>
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{me.created_by || '—'}</div>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">Contact a manager to update your account details.</p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl w-full sm:max-w-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Remove waiter?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              <strong>{confirmDelete.full_name}</strong> will be permanently deleted.
            </p>
            <div className="flex gap-2">
              <Btn fullWidth onClick={() => setConfirmDelete(null)}>Cancel</Btn>
              <Btn variant="danger" fullWidth onClick={() => handleDelete(confirmDelete)}>Delete</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setEditModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">Edit Waiter</h2>
              <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <Input label="Full Name" value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} placeholder="e.g. Maria Galea" />
              <Input label="PIN (4 digits)" value={editForm.pin} onChange={e => setEditForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="Optional 4-digit PIN" maxLength={4} />
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <Btn fullWidth onClick={() => setEditModal(null)}>Cancel</Btn>
              <Btn variant="success" fullWidth onClick={handleSave} disabled={!editForm.full_name.trim()}>Save</Btn>
            </div>
          </div>
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-medium text-gray-900 dark:text-white">Waiters</h2>
            <p className="text-xs text-gray-400 mt-0.5">{waiters.length} waiter{waiters.length !== 1 ? 's' : ''} registered</p>
          </div>
          {canManage && (
            <Btn variant="primary" size="sm" onClick={() => { setShowForm(!showForm); setUsernameError('') }}>
              {showForm ? 'Cancel' : '+ Add Waiter'}
            </Btn>
          )}
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">New waiter account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <Input label="Full Name" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="e.g. Maria Galea" />
              <div>
                <Input label="Username" value={form.username} onChange={e => { setForm(p => ({ ...p, username: e.target.value })); setUsernameError('') }} placeholder="mgalea" />
                {usernameError && <p className="text-xs text-rose-500 mt-1">{usernameError}</p>}
              </div>
              <Input label="Temporary Password" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Temp@1234" />
              <Input label="PIN (4 digits, optional)" value={form.pin} onChange={e => setForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="e.g. 1234" maxLength={4} />
            </div>
            <div className="flex gap-2">
              <Btn variant="success" onClick={handleCreate} disabled={!form.full_name.trim() || !form.username.trim() || !form.password.trim()}>
                Create Waiter
              </Btn>
              <Btn onClick={() => { setShowForm(false); setUsernameError('') }}>Cancel</Btn>
            </div>
          </div>
        )}

        {/* Waiters table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Waiter</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">PIN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {waiters.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">No waiters yet — add one above</td></tr>
              )}
              {waiters.map(u => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.full_name} />
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{u.full_name}</div>
                        <div className="text-xs text-gray-400 font-mono">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {u.pin ? (
                      <span className="font-mono text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg">
                        {'•'.repeat(u.pin.length)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={u.status === 'active' ? 'green' : u.status === 'pending' ? 'yellow' : 'red'}>
                      {u.status === 'active' ? '✓ Active' : u.status === 'pending' ? '⏳ Pending' : '✗ Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {canManage && (
                        <Btn size="sm" onClick={() => openEdit(u)}>Edit</Btn>
                      )}
                      {u.status === 'active' && canManage && u.id !== currentUser?.id && (
                        <Btn size="sm" variant="warning" onClick={() => deactivateUser(u.id)}>Deactivate</Btn>
                      )}
                      {u.status === 'inactive' && canManage && (
                        <Btn size="sm" variant="primary" onClick={() => approveUser(u.id)}>Reactivate</Btn>
                      )}
                      {canManage && u.id !== currentUser?.id && (
                        <Btn size="sm" variant="danger" onClick={() => setConfirmDelete(u)}>Delete</Btn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ─── Active Orders Card (expandable) ─────────────────────────────────────────
const STATUS_CFG_DASH = {
  pending:   { label: 'Pending',  bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-400' },
  cooking:   { label: 'Cooking',  bg: 'bg-blue-100 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-400',   dot: 'bg-blue-500' },
  ready:     { label: 'Ready',    bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
  served:    { label: 'Served',   bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500' },
  completed: { label: 'Done',     bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', dot: 'bg-gray-400' },
}

function ActiveOrdersCard({ liveOrders, setLiveOrders, setReprintModal, setOrderContext, navTo }) {
  const { user } = useApp()
  const [expanded, setExpanded] = useState(null)
  const [preCompDialog, setPreCompDialog] = useState(null) // { orderId, itemIdx, itemName, price, qty }
  const [preCompReason, setPreCompReason] = useState('')
  const [preCompApprover, setPreCompApprover] = useState('')
  const PRE_COMP_REASONS = ['Incorrect Order', 'Customer Complaint', 'VIP / Loyalty', 'Quality Issue', 'Manager Decision', 'Other']
  const active = liveOrders.filter(o => !['paid'].includes(o.status))

  function openPreCompDialog(orderId, itemIdx, itemName, price, qty) {
    setPreCompDialog({ orderId, itemIdx, itemName, price, qty })
    setPreCompReason('')
    setPreCompApprover('')
  }

  function confirmPreComp() {
    if (!preCompReason) return
    setLiveOrders(prev => prev.map(o => {
      if (o.id !== preCompDialog.orderId) return o
      const items = o.items.map((item, idx) =>
        idx === preCompDialog.itemIdx
          ? { ...item, comped: true, compReason: preCompReason, compApprovedBy: preCompApprover.trim() || user?.full_name || '—' }
          : item
      )
      return { ...o, items }
    }))
    setPreCompDialog(null); setPreCompReason(''); setPreCompApprover('')
  }

  function removePreComp(orderId, itemIdx) {
    setLiveOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o
      const items = o.items.map((item, idx) => {
        if (idx !== itemIdx) return item
        const { comped, compReason, compApprovedBy, ...rest } = item
        return rest
      })
      return { ...o, items }
    }))
  }

  return (
    <>
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium text-gray-900 dark:text-white">Active Orders</h2>
        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
          {active.length} orders
        </span>
      </div>
      {active.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No active orders</div>
      ) : (
        <div className="space-y-2">
          {active.map(o => {
            const cfg = STATUS_CFG_DASH[o.status] || STATUS_CFG_DASH.pending
            const total = (o.items || []).reduce((s, i) => s + i.price * i.qty, 0)
            const isOpen = expanded === o.id
            const allItems = (o.items || []).map((item, idx) => ({ ...item, origIdx: idx }))
            const kitchenItems = allItems.filter(i => (i.station || 'kitchen') !== 'bar')
            const barItems     = allItems.filter(i => i.station === 'bar')
            const preCompCount = (o.items || []).filter(i => i.comped).length
            return (
              <div key={o.id} className={`rounded-xl border transition-all overflow-hidden ${isOpen ? 'border-indigo-200 dark:border-indigo-700/60 shadow-sm' : 'border-gray-100 dark:border-gray-700/60'}`}>
                {/* Header row — always visible, click to expand */}
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-gray-100/80 dark:hover:bg-gray-700/40 transition-colors text-left"
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                >
                  {/* Table */}
                  <div className="flex flex-col min-w-[3rem]">
                    <span className="text-sm font-extrabold text-gray-800 dark:text-gray-200">
                      {o.order_type === 'takeaway' ? 'T/A' : `T${o.table_number || 0}`}
                    </span>
                    {o.merged_from_number && (
                      <span className="text-[10px] font-semibold text-blue-500">+T{o.merged_from_number}</span>
                    )}
                  </div>

                  {/* Order # + waiter */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">#{o.order_number}</span>
                      <span className="text-[11px] text-gray-400">{(o.items || []).reduce((s,i)=>s+i.qty,0)} items · €{total.toFixed(2)}</span>
                      {preCompCount > 0 && <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">🎁 {preCompCount} comp{preCompCount !== 1 ? 's' : ''}</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {o.waiter && (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-[9px] font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                            {o.waiter.charAt(0)}
                          </div>
                          <span className="text-[11px] text-gray-400 truncate">{o.waiter.split(' ')[0]}</span>
                          <span className="text-[11px] text-gray-300 dark:text-gray-600">·</span>
                        </>
                      )}
                      <span className="text-[11px] text-gray-400">{o.created_at || ''}</span>
                    </div>
                  </div>

                  {/* Chevron */}
                  <span className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                  </span>
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div className="px-3 pb-3 pt-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700/60 space-y-3">

                    {/* Table info grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg px-2.5 py-2">
                        <div className="text-[10px] text-gray-400 mb-0.5">Table</div>
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-100">
                          {o.order_type === 'takeaway' ? 'Takeaway' : `Table ${o.table_number || 0}`}
                          {o.merged_from_number && <span className="ml-1 text-blue-500">+T{o.merged_from_number}</span>}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg px-2.5 py-2">
                        <div className="text-[10px] text-gray-400 mb-0.5">Waiter</div>
                        <div className="text-xs font-bold text-gray-800 dark:text-gray-100">{o.waiter || '—'}</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg px-2.5 py-2">
                        <div className="text-[10px] text-gray-400 mb-0.5">Total</div>
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">€{total.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Items list */}
                    {kitchenItems.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <ChefHat size={11} />Kitchen
                        </div>
                        <div className="rounded-lg border border-orange-100 dark:border-orange-900/30 overflow-hidden">
                          {kitchenItems.map(item => (
                            <div key={item.origIdx} className={`flex items-center gap-2 px-2.5 py-1.5 border-b border-orange-50 dark:border-orange-900/20 last:border-0 ${item.comped ? 'bg-amber-50/60 dark:bg-amber-900/10' : 'bg-orange-50/40 dark:bg-orange-900/5'}`}>
                              <span className="w-5 h-5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[11px] font-extrabold flex items-center justify-center flex-shrink-0">{item.qty}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className={`text-xs font-medium truncate ${item.comped ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{item.name || item.name_en}</span>
                                  {item.comped && <span className="text-[8px] font-extrabold px-1 py-0.5 rounded bg-amber-500 text-white tracking-widest flex-shrink-0">COMP</span>}
                                  {item.mods?.length > 0 && <span className="text-[10px] text-indigo-500 truncate">· {item.mods.join(', ')}</span>}
                                </div>
                                {item.comped && <div className="text-[9px] text-amber-600 dark:text-amber-400 font-medium truncate">✓ {item.compReason} · {item.compApprovedBy}</div>}
                              </div>
                              <span className={`text-[11px] font-bold flex-shrink-0 ${item.comped ? 'line-through text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>€{(item.price * item.qty).toFixed(2)}</span>
                              <button
                                onClick={() => item.comped ? removePreComp(o.id, item.origIdx) : openPreCompDialog(o.id, item.origIdx, item.name || item.name_en, item.price, item.qty)}
                                title={item.comped ? 'Remove Comp Flag' : 'Pre-flag as Comp'}
                                className={`w-5 h-5 flex items-center justify-center rounded-md text-[10px] flex-shrink-0 transition-colors ${item.comped ? 'bg-amber-400 text-white hover:bg-rose-400' : 'text-gray-300 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                              >🎁</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {barItems.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Wine size={11} />Bar
                        </div>
                        <div className="rounded-lg border border-purple-100 dark:border-purple-900/30 overflow-hidden">
                          {barItems.map(item => (
                            <div key={item.origIdx} className={`flex items-center gap-2 px-2.5 py-1.5 border-b border-purple-50 dark:border-purple-900/20 last:border-0 ${item.comped ? 'bg-amber-50/60 dark:bg-amber-900/10' : 'bg-purple-50/40 dark:bg-purple-900/5'}`}>
                              <span className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[11px] font-extrabold flex items-center justify-center flex-shrink-0">{item.qty}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className={`text-xs font-medium truncate ${item.comped ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{item.name || item.name_en}</span>
                                  {item.comped && <span className="text-[8px] font-extrabold px-1 py-0.5 rounded bg-amber-500 text-white tracking-widest flex-shrink-0">COMP</span>}
                                  {item.mods?.length > 0 && <span className="text-[10px] text-indigo-500 truncate">· {item.mods.join(', ')}</span>}
                                </div>
                                {item.comped && <div className="text-[9px] text-amber-600 dark:text-amber-400 font-medium truncate">✓ {item.compReason} · {item.compApprovedBy}</div>}
                              </div>
                              <span className={`text-[11px] font-bold flex-shrink-0 ${item.comped ? 'line-through text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>€{(item.price * item.qty).toFixed(2)}</span>
                              <button
                                onClick={() => item.comped ? removePreComp(o.id, item.origIdx) : openPreCompDialog(o.id, item.origIdx, item.name || item.name_en, item.price, item.qty)}
                                title={item.comped ? 'Remove Comp Flag' : 'Pre-flag as Comp'}
                                className={`w-5 h-5 flex items-center justify-center rounded-md text-[10px] flex-shrink-0 transition-colors ${item.comped ? 'bg-amber-400 text-white hover:bg-rose-400' : 'text-gray-300 hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}
                              >🎁</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {o.notes && (
                      <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-2.5 py-2">
                        <AlertTriangle size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">{o.notes}</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-0.5">
                      <button
                        onClick={() => setReprintModal({ order: o })}
                        className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      ><Printer size={11} />Print</button>
                      <button
                        onClick={() => navTo('billing', { preloadOrder: o })}
                        className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >Go to Bill</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>

    {/* ── Pre-Comp Flag Dialog ─────────────────────────────────────────────────── */}
    {preCompDialog && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPreCompDialog(null)}>
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎁</span>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Pre-flag as Comp</h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium truncate max-w-[200px]">{preCompDialog.itemName}</p>
              </div>
            </div>
            <button onClick={() => setPreCompDialog(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
          </div>
          <div className="mx-5 mt-4 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Will be comped at billing</div>
              <div className="text-lg font-extrabold text-amber-700 dark:text-amber-300">€{(preCompDialog.price * preCompDialog.qty).toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">×{preCompDialog.qty} @ €{preCompDialog.price.toFixed(2)}</div>
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">Applied automatically</div>
            </div>
          </div>
          <div className="px-5 pt-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Reason <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {PRE_COMP_REASONS.map(r => (
                <button key={r} onClick={() => setPreCompReason(r)}
                  className={`text-xs font-semibold px-2.5 py-2 rounded-xl border-2 text-left transition-all ${preCompReason === r ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-amber-300'}`}
                >{r}</button>
              ))}
            </div>
          </div>
          <div className="px-5 pb-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Approved By</label>
            <input value={preCompApprover} onChange={e => setPreCompApprover(e.target.value)}
              placeholder={`Default: ${user?.full_name || 'Current user'}`}
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="px-5 pb-5 grid grid-cols-2 gap-2">
            <button onClick={() => setPreCompDialog(null)}
              className="py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >Cancel</button>
            <button onClick={confirmPreComp} disabled={!preCompReason}
              className="py-3 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all active:scale-[0.98]"
            >Flag as Comp</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

// ─── Tables ───────────────────────────────────────────────────────────────────
export function Tables({ navTo, setOrderContext }) {
  const { user, liveOrders, setLiveOrders, users, company, openBills, transferOrder, mergeOrder, unmergeOrder, othRecords, pushNotif } = useApp()
  const [tables, setTables] = useState(TABLES)
  const [guestModal, setGuestModal] = useState(null)      // { table, mode: 'open'|'edit' }
  const [actionModal, setActionModal] = useState(null)    // { table, order }
  const [transferModal, setTransferModal] = useState(null) // { fromTable }
  const [mergeModal, setMergeModal] = useState(null)      // { fromTable }
  const [reprintModal, setReprintModal] = useState(null) // { order }
  const [guestAdults, setGuestAdults] = useState(1)
  const [guestChildren, setGuestChildren] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [showOthModal, setShowOthModal] = useState(false)
  const [othLoading, setOthLoading] = useState(false)
  const [reservationsList, setReservationsList] = useState([])  // flat array: { id, tableId, tableNumber, name, phone, guests, date, time, notes, status, createdAt, createdBy, ... }
  const [reserveModal, setReserveModal] = useState(null)        // { table, mode: 'create'|'view'|'edit', resId? }
  const [reservationHistory, setReservationHistory] = useState([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showTodayBookings, setShowTodayBookings] = useState(false)
  const [resName, setResName] = useState('')
  const [resPhone, setResPhone] = useState('')
  const [resGuests, setResGuests] = useState(2)
  const [resDate, setResDate] = useState('')
  const [resTime, setResTime] = useState('')
  const [resNotes, setResNotes] = useState('')
  const [resEditId, setResEditId] = useState(null)
  // ── Add Table ──────────────────────────────────────────────────────────────
  const [showAddTableModal, setShowAddTableModal] = useState(false)
  const [addTableChairs, setAddTableChairs] = useState(4)
  const [addTableFloor, setAddTableFloor] = useState('Ground')
  const [addTableLabel, setAddTableLabel] = useState('')
  // ── Edit / Delete Table ────────────────────────────────────────────────────
  const [editTableModal, setEditTableModal] = useState(null)   // table object being edited
  const [editTableChairs, setEditTableChairs] = useState(4)
  const [editTableFloor, setEditTableFloor] = useState('Ground')
  const [editTableLabel, setEditTableLabel] = useState('')
  const [deleteTableConfirm, setDeleteTableConfirm] = useState(null) // table to delete
  const [deleteReason, setDeleteReason] = useState('')
  const [showArchivedModal, setShowArchivedModal] = useState(false)
  // ── Takeaway ───────────────────────────────────────────────────────────────
  const [showTakeawayModal, setShowTakeawayModal] = useState(false)
  const [taName, setTaName] = useState('')
  const [taGuests, setTaGuests] = useState(1)
  // ── Table Records & History ────────────────────────────────────────────────
  const [tableRecords, setTableRecords] = useState([])
  const [tableHistory, setTableHistory] = useState([])
  const [showTableRecordsModal, setShowTableRecordsModal] = useState(false)
  const [recordsFilter, setRecordsFilter] = useState('all')
  const [recordsTab, setRecordsTab] = useState('seatings') // 'seatings' | 'history'
  const todayStr = new Date().toDateString()
  const todayOthRecords = othRecords.filter(r => new Date(r.created_at).toDateString() === todayStr)
  const todayOthTotal = todayOthRecords.reduce((s, r) => s + Number(r.total_value || 0), 0)
  const todayISO = new Date().toISOString().split('T')[0]
  const todayActiveRes = reservationsList.filter(r => r.date === todayISO && ['confirmed','arrived'].includes(r.status))
  function getTableReservation(tableId) { return todayActiveRes.find(r => r.tableId === tableId) || null }
  function getTableFutureRes(tableId) { return reservationsList.filter(r => r.tableId === tableId && r.date > todayISO && r.status === 'confirmed') }
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])
  function elapsed(ts) {
    if (!ts) return null
    const mins = Math.floor((now - ts) / 60000)
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  const activeWaiters = users.filter(u => u.role === 'waiter' && u.status === 'active')

  // Get the active order for a table (non-paid)
  function tableOrder(tableId) {
    return liveOrders.find(o => o.table_id === tableId && !['paid'].includes(o.status))
  }

  function openEditGuests(table) {
    const order = tableOrder(table.id)
    setGuestAdults(order?.guests?.adults ?? 1)
    setGuestChildren(order?.guests?.children ?? 0)
    setGuestModal({ table, mode: 'edit' })
  }

  function selectTable(table) {
    const todayRes = getTableReservation(table.id)
    if (table.status === 'reserved' && todayRes) {
      setReserveModal({ table, mode: 'view', resId: todayRes.id })
    } else if (table.status === 'free') {
      setGuestAdults(1)
      setGuestChildren(0)
      setGuestModal({ table, mode: 'open' })
    } else {
      const existingOrder = liveOrders.find(o => o.table_id === table.id && !['paid'].includes(o.status))
      addToOrder(existingOrder || { table_id: table.id, table_number: table.number, order_type: 'dine_in' })
    }
  }

  function openReserveCreate(table) {
    setResName('')
    setResPhone('')
    setResGuests(2)
    setResDate(new Date().toISOString().split('T')[0])
    setResTime('')
    setResNotes('')
    setResEditId(null)
    setReserveModal({ table, mode: 'create' })
  }

  function openReserveEdit(table, res) {
    setResName(res.name)
    setResPhone(res.phone || '')
    setResGuests(res.guests || 2)
    setResDate(res.date || new Date().toISOString().split('T')[0])
    setResTime(res.time || '')
    setResNotes(res.notes || '')
    setResEditId(res.id)
    setReserveModal({ table, mode: 'edit' })
  }

  function confirmReservation() {
    if (!resName.trim() || !resTime) return
    const table = reserveModal.table
    const isEdit = !!resEditId
    const performer = user?.full_name || user?.username || 'Staff'
    const nowTs = new Date()
    const isToday = resDate === todayISO

    if (isEdit) {
      const oldRes = reservationsList.find(r => r.id === resEditId)
      const wasToday = oldRes?.date === todayISO
      setReservationsList(prev => prev.map(r => r.id === resEditId ? {
        ...r, name: resName.trim(), phone: resPhone.trim(), guests: resGuests,
        date: resDate, time: resTime, notes: resNotes.trim(),
        updatedAt: nowTs, updatedBy: performer,
      } : r))
      // Adjust table status if date moved to/from today
      if (wasToday && !isToday) {
        const stillHasToday = reservationsList.some(r => r.id !== resEditId && r.tableId === table.id && r.date === todayISO && ['confirmed','arrived'].includes(r.status))
        if (!stillHasToday) setTables(prev => prev.map(t => t.id === table.id ? { ...t, status: 'free' } : t))
      } else if (!wasToday && isToday) {
        setTables(prev => prev.map(t => t.id === table.id && t.status === 'free' ? { ...t, status: 'reserved' } : t))
      }
    } else {
      const newRes = {
        id: `res_${Date.now()}`, tableId: table.id, tableNumber: table.number,
        name: resName.trim(), phone: resPhone.trim(), guests: resGuests,
        date: resDate, time: resTime, notes: resNotes.trim(),
        status: 'confirmed', createdAt: nowTs, createdBy: performer,
      }
      setReservationsList(prev => [...prev, newRes])
      if (isToday) setTables(prev => prev.map(t => t.id === table.id && t.status === 'free' ? { ...t, status: 'reserved' } : t))
    }

    setReservationHistory(prev => [{
      id: Date.now(), type: isEdit ? 'edited' : 'created',
      tableId: table.id, tableNumber: table.number,
      name: resName.trim(), phone: resPhone.trim(), guests: resGuests,
      date: resDate, time: resTime, notes: resNotes.trim(),
      performedBy: performer, performedAt: nowTs,
    }, ...prev])
    pushNotif(`Table ${table.number} ${isEdit ? 'reservation updated' : 'reserved'} for ${resName.trim()} at ${resTime} by ${performer}`, 'info', 'Reservations')
    setReserveModal(null)
  }

  function cancelReservation(resId) {
    const res = reservationsList.find(r => r.id === resId)
    if (!res) return
    const performer = user?.full_name || user?.username || 'Staff'
    setReservationsList(prev => prev.map(r => r.id === resId ? { ...r, status: 'cancelled', cancelledBy: performer, cancelledAt: new Date() } : r))
    const stillHasToday = reservationsList.some(r => r.id !== resId && r.tableId === res.tableId && r.date === todayISO && ['confirmed','arrived'].includes(r.status))
    if (!stillHasToday) setTables(prev => prev.map(t => t.id === res.tableId ? { ...t, status: 'free' } : t))
    setReservationHistory(prev => [{
      id: Date.now(), type: 'cancelled',
      tableId: res.tableId, tableNumber: res.tableNumber,
      name: res.name, phone: res.phone, guests: res.guests,
      date: res.date, time: res.time, notes: res.notes,
      performedBy: performer, performedAt: new Date(),
    }, ...prev])
    setReserveModal(null)
  }

  function checkInReservation(resId) {
    const res = reservationsList.find(r => r.id === resId)
    if (!res) return
    const performer = user?.full_name || user?.username || 'Staff'
    setReservationsList(prev => prev.map(r => r.id === resId ? { ...r, status: 'arrived', arrivedAt: new Date(), arrivedBy: performer } : r))
    setReservationHistory(prev => [{
      id: Date.now(), type: 'arrived',
      tableId: res.tableId, tableNumber: res.tableNumber,
      name: res.name, phone: res.phone, guests: res.guests,
      date: res.date, time: res.time, notes: res.notes,
      performedBy: performer, performedAt: new Date(),
    }, ...prev])
    pushNotif(`${res.name} checked in for Table ${res.tableNumber}`, 'info', 'Reservations')
    setReserveModal(null)
  }

  function markNoShow(resId) {
    const res = reservationsList.find(r => r.id === resId)
    if (!res) return
    const performer = user?.full_name || user?.username || 'Staff'
    setReservationsList(prev => prev.map(r => r.id === resId ? { ...r, status: 'no_show', noShowBy: performer, noShowAt: new Date() } : r))
    const stillHasToday = reservationsList.some(r => r.id !== resId && r.tableId === res.tableId && r.date === todayISO && ['confirmed','arrived'].includes(r.status))
    if (!stillHasToday) setTables(prev => prev.map(t => t.id === res.tableId ? { ...t, status: 'free' } : t))
    setReservationHistory(prev => [{
      id: Date.now(), type: 'no_show',
      tableId: res.tableId, tableNumber: res.tableNumber,
      name: res.name, phone: res.phone, guests: res.guests,
      date: res.date, time: res.time, notes: res.notes,
      performedBy: performer, performedAt: new Date(),
    }, ...prev])
    setReserveModal(null)
  }

  function seatReservation(resId, table) {
    const res = reservationsList.find(r => r.id === resId)
    if (!res) return
    const performer = user?.full_name || user?.username || 'Staff'
    setReservationsList(prev => prev.map(r => r.id === resId ? { ...r, status: 'seated', seatedAt: new Date(), seatedBy: performer } : r))
    const stillHasToday = reservationsList.some(r => r.id !== resId && r.tableId === table.id && r.date === todayISO && ['confirmed','arrived'].includes(r.status))
    if (!stillHasToday) setTables(prev => prev.map(t => t.id === table.id ? { ...t, status: 'free' } : t))
    setReservationHistory(prev => [{
      id: Date.now(), type: 'seated',
      tableId: table.id, tableNumber: table.number,
      name: res.name, phone: res.phone, guests: res.guests,
      date: res.date, time: res.time, notes: res.notes,
      performedBy: performer, performedAt: new Date(),
    }, ...prev])
    setReserveModal(null)
    const guests = Math.max(1, res.guests || 1)
    pushTableRecord(table, { adults: guests, children: 0 }, true, res.name)
    setOrderContext({ tableId: table.id, tableNumber: table.number, isTakeaway: false, existingOrder: null, guests: { adults: guests, children: 0 } })
    navTo('orders')
  }


  function confirmTransfer(toTable) {
    const { fromTable } = transferModal
    transferOrder(fromTable.id, toTable.id, toTable.number)
    setTables(prev => prev.map(t => {
      if (t.id === fromTable.id) return { ...t, status: 'free', assignedWaiter: null }
      if (t.id === toTable.id) return { ...t, status: 'occupied' }
      return t
    }))
    setTransferModal(null)
    setActionModal(null)
  }

  function confirmMerge(toTable) {
    const { fromTable } = mergeModal
    mergeOrder(fromTable.id, fromTable.number, toTable.id, toTable.number)
    setTables(prev => prev.map(t => {
      if (t.id === fromTable.id)
        return { ...t, status: 'merged', mergedInto: { id: toTable.id, number: toTable.number } }
      if (t.id === toTable.id)
        return { ...t, mergedTables: [...(t.mergedTables || []), { id: fromTable.id, number: fromTable.number }] }
      return t
    }))
    setMergeModal(null)
    setActionModal(null)
  }

  function confirmUnmerge(mergedTable) {
    unmergeOrder(mergedTable.id, mergedTable.number)
    setTables(prev => prev.map(t => {
      if (t.id === mergedTable.id)
        return { ...t, status: 'occupied', mergedInto: null }
      // Remove from target's mergedTables list
      if (t.mergedTables?.some(m => m.id === mergedTable.id))
        return { ...t, mergedTables: t.mergedTables.filter(m => m.id !== mergedTable.id) }
      return t
    }))
    setActionModal(null)
  }

  function addToOrder(order) {
    setOrderContext({
      tableId: order.table_id,
      tableNumber: order.table_number,
      isTakeaway: order.order_type === 'takeaway',
      existingOrder: order,
      customerName: order.customer_name || null,
    })
    navTo('orders')
  }

  function startTakeaway() {
    setOrderContext({
      tableId: null,
      tableNumber: null,
      isTakeaway: true,
      existingOrder: null,
      guests: { adults: taGuests, children: 0 },
      customerName: taName.trim() || null,
    })
    setShowTakeawayModal(false)
    navTo('orders')
  }

  function pushTableHistory(action, table, details = {}) {
    setTableHistory(prev => [{
      id: `th_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      action,
      tableId: table.id,
      tableNumber: table.number,
      tableLabel: table.label || `Table ${table.number}`,
      performedBy: user?.full_name || user?.username || 'Staff',
      performedByRole: user?.role || 'unknown',
      performedAt: new Date(),
      details,
    }, ...prev])
  }

  function pushTableRecord(table, covers, fromReservation = false, reservationName = null) {
    const entry = {
      id: `rec_${Date.now()}`,
      tableId: table.id,
      tableNumber: table.number,
      tableLabel: table.label || `Table ${table.number}`,
      openedAt: new Date(),
      covers,
      openedBy: user?.full_name || user?.username || 'Staff',
      openedByRole: user?.role || 'unknown',
      fromReservation,
      reservationName: reservationName || null,
    }
    setTableRecords(prev => [entry, ...prev])
    pushTableHistory('seated', table, { covers, fromReservation, reservationName })
  }

  function confirmAddTable() {
    const existingNums = tables.filter(t => !t.isOTH).map(t => t.number)
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1
    const tableNum = nextNum
    const newTable = {
      id: `t_${Date.now()}`,
      number: tableNum,
      label: addTableLabel.trim() || `Table ${tableNum}`,
      capacity: addTableChairs,
      status: 'free',
      floor: addTableFloor,
      isOTH: false,
      addedBy: user?.full_name || user?.username || 'Staff',
      addedAt: new Date(),
    }
    setTables(prev => [...prev, newTable])
    pushTableHistory('added', newTable, { chairs: addTableChairs, floor: addTableFloor, label: newTable.label })
    pushNotif(`Table ${tableNum} added (${addTableChairs} chairs, ${addTableFloor}) by ${newTable.addedBy}`, 'info', 'Tables')
    setShowAddTableModal(false)
    setAddTableLabel('')
    setAddTableChairs(4)
    setAddTableFloor('Ground')
  }

  function openEditTable(table) {
    setEditTableChairs(table.capacity || 4)
    setEditTableFloor(table.floor || 'Ground')
    setEditTableLabel(table.label && table.label !== `Table ${table.number}` ? table.label : '')
    setEditTableModal(table)
  }

  function confirmEditTable() {
    const table = editTableModal
    const actor = user?.full_name || user?.username || 'Staff'
    const updatedTable = { ...table, capacity: editTableChairs, floor: editTableFloor, label: editTableLabel.trim() || `Table ${table.number}` }
    setTables(prev => prev.map(t => t.id === table.id ? { ...updatedTable, updatedBy: actor, updatedAt: new Date() } : t))
    pushTableHistory('edited', updatedTable, {
      chairs: editTableChairs, floor: editTableFloor, label: updatedTable.label,
      prevChairs: table.capacity, prevFloor: table.floor, prevLabel: table.label,
    })
    pushNotif(`Table ${table.number} updated (${editTableChairs} chairs, ${editTableFloor}) by ${actor}`, 'info', 'Tables')
    setEditTableModal(null)
  }

  function confirmDeleteTable(table) {
    const actor = user?.full_name || user?.username || 'Staff'
    const reason = deleteReason.trim() || 'No reason given'
    setTables(prev => prev.map(t => t.id === table.id ? { ...t, status: 'archived', archivedBy: actor, archivedAt: new Date(), archiveReason: reason } : t))
    pushTableHistory('archived', table, { reason })
    pushNotif(`Table ${table.number} archived by ${actor}${deleteReason.trim() ? ` — "${deleteReason.trim()}"` : ''}`, 'warning', 'Tables')
    setDeleteTableConfirm(null)
    setDeleteReason('')
  }

  function restoreTable(table) {
    const actor = user?.full_name || user?.username || 'Staff'
    setTables(prev => prev.map(t => t.id === table.id ? {
      ...t, status: 'free',
      archivedBy: undefined, archivedAt: undefined, archiveReason: undefined,
      restoredBy: actor, restoredAt: new Date(),
    } : t))
    pushTableHistory('restored', table, { previousReason: table.archiveReason })
    pushNotif(`Table ${table.number} restored by ${actor}`, 'info', 'Tables')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* ── Reserve Table Modal (create / edit) ─────────────────────── */}
      {(reserveModal?.mode === 'create' || reserveModal?.mode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setReserveModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-sky-50 dark:bg-sky-900/20">
              <div>
                <div className="text-xs font-semibold text-sky-400 uppercase tracking-widest mb-0.5">Table {reserveModal.table.number}</div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white">{reserveModal.mode === 'edit' ? 'Edit Reservation' : 'Reserve Table'}</div>
              </div>
              <button onClick={() => setReserveModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-base">✕</button>
            </div>
            <div className="px-5 py-5 space-y-4">
              {/* Customer name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Customer Name *</label>
                <input
                  type="text"
                  value={resName}
                  onChange={e => setResName(e.target.value)}
                  placeholder="e.g. Anna Borg"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-200 placeholder-gray-300 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Phone Number</label>
                <input
                  type="tel"
                  value={resPhone}
                  onChange={e => setResPhone(e.target.value)}
                  placeholder="+356 9900 0000"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-200 placeholder-gray-300 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
              {/* Guests */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Number of Guests *</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setResGuests(n => Math.max(1, n - 1))} className="w-9 h-9 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold text-lg flex items-center justify-center hover:border-sky-400 hover:text-sky-600 transition-all disabled:opacity-30" disabled={resGuests <= 1}>−</button>
                  <span className="text-2xl font-extrabold text-gray-900 dark:text-white w-8 text-center tabular-nums">{resGuests}</span>
                  <button onClick={() => setResGuests(n => n + 1)} className="w-9 h-9 rounded-xl border-2 border-sky-500 bg-sky-600 text-white font-bold text-lg flex items-center justify-center hover:bg-sky-700 transition-all">+</button>
                  <div className="flex gap-1.5 flex-1">
                    {[1,2,3,4,5,6].map(n => (
                      <button key={n} onClick={() => setResGuests(n)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${resGuests === n ? 'bg-sky-600 text-white border-sky-600' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-sky-300 bg-white dark:bg-gray-700'}`}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Date & Time row */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Date</label>
                  <input
                    type="date"
                    value={resDate}
                    onChange={e => setResDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Time *</label>
                  <input
                    type="time"
                    value={resTime}
                    onChange={e => setResTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>
              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Notes</label>
                <textarea
                  value={resNotes}
                  onChange={e => setResNotes(e.target.value)}
                  placeholder="e.g. Birthday dinner, window seat preferred"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-200 placeholder-gray-300 focus:outline-none focus:border-sky-500 transition-colors resize-none"
                />
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2.5">
              <button onClick={() => setReserveModal(null)} className="flex-1 py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Cancel</button>
              <button
                disabled={!resName.trim() || !resTime}
                onClick={confirmReservation}
                className="flex-1 py-3 rounded-xl text-sm font-extrabold bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white transition-all disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {reserveModal.mode === 'edit' ? 'Save Changes' : 'Confirm Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Takeaway Modal ────────────────────────────────────────── */}
      {showTakeawayModal && (() => {
        const activeTakeaways = liveOrders.filter(o => o.order_type === 'takeaway' && !['paid','voided'].includes(o.status))
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowTakeawayModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/20">
                <div>
                  <div className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-0.5">Counter / Walk-in</div>
                  <div className="text-base font-extrabold text-gray-900 dark:text-white">🥡 New Takeaway Order</div>
                </div>
                <button onClick={() => setShowTakeawayModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
              </div>

              <div className="p-5 space-y-5">

                {/* Active takeaway orders */}
                {activeTakeaways.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Active Orders — tap to continue</div>
                    <div className="space-y-2">
                      {activeTakeaways.map(o => (
                        <button
                          key={o.id}
                          onClick={() => { addToOrder(o); setShowTakeawayModal(false) }}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🥡</span>
                            <div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                #{o.order_number}{o.customer_name ? ` · ${o.customer_name}` : ''}
                              </div>
                              <div className="text-xs text-gray-400">{o.items.length} item{o.items.length !== 1 ? 's' : ''} · {o.created_at} · {o.waiter}</div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-orange-500 group-hover:translate-x-0.5 transition-transform">Continue →</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
                      <span className="text-xs text-gray-400 font-medium">or start new</span>
                      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
                    </div>
                  </div>
                )}

                {/* Customer name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Customer Name <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                  <input
                    type="text"
                    value={taName}
                    onChange={e => setTaName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && startTakeaway()}
                    placeholder="e.g. John, Maria…"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                    autoFocus
                  />
                </div>

                {/* Guest count */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Guests</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setTaGuests(g => Math.max(1, g - 1))} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">−</button>
                    <span className="text-xl font-bold text-gray-900 dark:text-white w-8 text-center">{taGuests}</span>
                    <button onClick={() => setTaGuests(g => g + 1)} className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 font-bold text-lg flex items-center justify-center hover:bg-orange-200 transition-colors">+</button>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={startTakeaway}
                  className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-extrabold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  🥡 Start Order{taName.trim() ? ` for ${taName.trim()}` : ''}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Today's Bookings Modal ─────────────────────────────────── */}
      {showTodayBookings && (() => {
        const todayAll = reservationsList.filter(r => r.date === todayISO).sort((a, b) => a.time.localeCompare(b.time))
        const statusCfg = {
          confirmed: { label: 'Confirmed', bg: 'bg-sky-100 dark:bg-sky-900/30',    text: 'text-sky-700 dark:text-sky-300'      },
          arrived:   { label: 'Arrived',   bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300' },
          seated:    { label: 'Seated',    bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
          no_show:   { label: 'No-Show',   bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300'  },
          cancelled: { label: 'Cancelled', bg: 'bg-rose-100 dark:bg-rose-900/30',   text: 'text-rose-700 dark:text-rose-300'    },
        }
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowTodayBookings(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-sky-50 dark:bg-sky-900/20">
                <div>
                  <div className="text-xs font-semibold text-sky-400 uppercase tracking-widest mb-0.5">
                    {new Date().toLocaleDateString('en-MT', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  <div className="text-base font-extrabold text-gray-900 dark:text-white">Today's Bookings</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">{todayActiveRes.length} active</span>
                  <button onClick={() => setShowTodayBookings(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
                {todayAll.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">No bookings for today</div>
                ) : todayAll.map(r => {
                  const cfg = statusCfg[r.status] || statusCfg.confirmed
                  const timeLabel = r.time ? (() => { const [h, m] = r.time.split(':'); const d = new Date(); d.setHours(+h, +m); return d.toLocaleTimeString('en-MT', { hour: '2-digit', minute: '2-digit' }) })() : '—'
                  const tbl = tables.find(t => t.id === r.tableId)
                  const isDone = ['seated','no_show','cancelled'].includes(r.status)
                  return (
                    <div key={r.id} className={`rounded-xl border px-4 py-3 ${isDone ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700 opacity-60' : 'bg-white dark:bg-gray-700/60 border-gray-200 dark:border-gray-600 shadow-sm'}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold text-gray-900 dark:text-white">{r.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-400 flex-shrink-0">T{r.tableNumber}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span>🕐 <span className="font-bold text-gray-700 dark:text-gray-200">{timeLabel}</span></span>
                        <span>👥 <span className="font-bold text-gray-700 dark:text-gray-200">{r.guests} guests</span></span>
                        {r.phone && <span>📞 <span className="font-semibold">{r.phone}</span></span>}
                      </div>
                      {r.notes && <div className="text-xs text-gray-400 italic mb-2">"{r.notes}"</div>}
                      {!isDone && tbl && (
                        <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                          {r.status === 'confirmed' && (
                            <button onClick={() => checkInReservation(r.id)} className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors">
                              ✅ Check In
                            </button>
                          )}
                          <button onClick={() => { seatReservation(r.id, tbl); setShowTodayBookings(false) }} className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors">
                            🪑 Seat
                          </button>
                          {can(user, 'cancelReservation') && (
                            <button onClick={() => markNoShow(r.id)} className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors">
                              ⏰ No-Show
                            </button>
                          )}
                          {can(user, 'cancelReservation') && (
                            <button onClick={() => cancelReservation(r.id)} className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors">
                              ✕ Cancel
                            </button>
                          )}
                        </div>
                      )}
                      {isDone && (
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 pt-1.5 border-t border-gray-100 dark:border-gray-600">
                          By {r.status === 'seated' ? r.seatedBy : r.status === 'no_show' ? r.noShowBy : r.cancelledBy || r.createdBy} · {new Date(r.status === 'seated' ? r.seatedAt : r.status === 'no_show' ? r.noShowAt : r.cancelledAt || r.createdAt).toLocaleTimeString('en-MT', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{todayAll.filter(r => r.status === 'seated').length} seated · {todayAll.filter(r => r.status === 'no_show').length} no-show · {todayAll.filter(r => r.status === 'cancelled').length} cancelled</span>
                <button onClick={() => { setShowTodayBookings(false) }} className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">Close</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Reservation History Modal ───────────────────────────────── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Management View</div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white">Reservation History</div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-base">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
              {reservationHistory.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No reservation activity yet</div>
              ) : reservationHistory.map(h => {
                const typeConfig = {
                  created:   { label: 'Reserved',   bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
                  edited:    { label: 'Edited',     bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
                  seated:    { label: 'Seated',     bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
                  cancelled: { label: 'Cancelled',  bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
                }[h.type] || {}
                const timeLabel = h.time ? (() => { const [hr, mn] = h.time.split(':'); const d = new Date(); d.setHours(+hr, +mn); return d.toLocaleTimeString('en-MT', { hour: '2-digit', minute: '2-digit' }) })() : '—'
                const dateLabel = h.date ? new Date(h.date + 'T00:00').toLocaleDateString('en-MT', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'
                const loggedAt = new Date(h.performedAt).toLocaleString('en-MT', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={h.id} className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 ${typeConfig.dot}`} />
                        <span className="text-sm font-extrabold text-gray-900 dark:text-white">{h.name || '—'}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeConfig.bg} ${typeConfig.text}`}>{typeConfig.label}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">Table {h.tableNumber}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <div><span className="text-gray-400 dark:text-gray-500">Guests </span><span className="font-semibold text-gray-700 dark:text-gray-200">{h.guests ?? '—'}</span></div>
                      <div><span className="text-gray-400 dark:text-gray-500">Time </span><span className="font-semibold text-gray-700 dark:text-gray-200">{timeLabel}</span></div>
                      <div><span className="text-gray-400 dark:text-gray-500">Date </span><span className="font-semibold text-gray-700 dark:text-gray-200">{dateLabel}</span></div>
                    </div>
                    {h.phone && <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">📞 {h.phone}</div>}
                    {h.notes && <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 italic">"{h.notes}"</div>}
                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-200 dark:border-gray-600 mt-1.5">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">By <span className="font-semibold text-gray-600 dark:text-gray-300">{h.performedBy}</span></span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">{loggedAt}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            {reservationHistory.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => { if (window.confirm('Clear all reservation history?')) setReservationHistory([]) }}
                  className="w-full py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  Clear History
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Reserve Table Modal (view) ───────────────────────────────── */}
      {reserveModal?.mode === 'view' && (() => {
        const res = reservationsList.find(r => r.id === reserveModal.resId)
        if (!res) return null
        const dateLabel = res.date ? new Date(res.date + 'T00:00').toLocaleDateString('en-MT', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'
        const timeLabel = res.time ? (() => { const [h, m] = res.time.split(':'); const d = new Date(); d.setHours(+h, +m); return d.toLocaleTimeString('en-MT', { hour: '2-digit', minute: '2-digit' }) })() : '—'
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setReserveModal(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xs max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className={`flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 ${res.status === 'arrived' ? 'bg-violet-50 dark:bg-violet-900/20' : 'bg-sky-50 dark:bg-sky-900/20'}`}>
                <div>
                  <div className={`text-xs font-semibold uppercase tracking-widest mb-0.5 ${res.status === 'arrived' ? 'text-violet-400' : 'text-sky-400'}`}>
                    Table {reserveModal.table.number} · {res.status === 'arrived' ? '✅ Guest Arrived' : 'Reserved'}
                  </div>
                  <div className="text-base font-extrabold text-gray-900 dark:text-white">{res.name}</div>
                </div>
                <button onClick={() => setReserveModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-base">✕</button>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl py-2.5">
                    <div className="text-lg font-extrabold text-violet-700 dark:text-violet-300">{res.guests}</div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Guests</div>
                  </div>
                  <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl py-2.5">
                    <div className="text-xs font-extrabold text-sky-700 dark:text-sky-300 leading-tight pt-1">{timeLabel}</div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Time</div>
                  </div>
                  <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl py-2.5">
                    <div className="text-[10px] font-extrabold text-sky-700 dark:text-sky-300 leading-tight pt-1">{dateLabel}</div>
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date</div>
                  </div>
                </div>
                {res.phone && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <span className="text-sm">📞</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{res.phone}</span>
                  </div>
                )}
                {res.notes && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <span className="text-sm mt-0.5">📝</span>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 leading-relaxed">{res.notes}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-sm">👤</span>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Added by</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{res.createdBy}</span>
                  </div>
                </div>
                {res.editedBy && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <span className="text-sm">✏️</span>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Edited by</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{res.editedBy}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-5 pb-5 space-y-2.5">
                {res.status === 'confirmed' && (
                  <button
                    onClick={() => checkInReservation(res.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 hover:border-violet-500 transition-all text-left"
                  >
                    <span className="text-xl">✅</span>
                    <div>
                      <div className="text-sm font-bold text-violet-700 dark:text-violet-300">Check In Guest</div>
                      <div className="text-xs text-gray-400">Mark guest as arrived — table goes violet</div>
                    </div>
                  </button>
                )}
                <button
                  onClick={() => seatReservation(res.id, reserveModal.table)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-sky-200 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/20 hover:border-sky-500 transition-all text-left"
                >
                  <span className="text-xl">🪑</span>
                  <div>
                    <div className="text-sm font-bold text-sky-700 dark:text-sky-300">Seat Now</div>
                    <div className="text-xs text-gray-400">Open the table and start an order</div>
                  </div>
                </button>
                <button
                  onClick={() => openReserveEdit(reserveModal.table, res)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 hover:border-indigo-500 transition-all text-left"
                >
                  <span className="text-xl">✏️</span>
                  <div>
                    <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Edit Reservation</div>
                    <div className="text-xs text-gray-400">Change name, guests, time or notes</div>
                  </div>
                </button>
                {can(user, 'cancelReservation') && (
                  <button
                    onClick={() => markNoShow(res.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 hover:border-amber-500 transition-all text-left"
                  >
                    <span className="text-xl">⏰</span>
                    <div>
                      <div className="text-sm font-bold text-amber-700 dark:text-amber-300">No-Show</div>
                      <div className="text-xs text-gray-400">Guest didn't arrive — free the table</div>
                    </div>
                  </button>
                )}
                {can(user, 'cancelReservation') && (
                  <button
                    onClick={() => cancelReservation(res.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-rose-200 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 hover:border-rose-500 transition-all text-left"
                  >
                    <span className="text-xl">✕</span>
                    <div>
                      <div className="text-sm font-bold text-rose-700 dark:text-rose-300">Cancel Reservation</div>
                      <div className="text-xs text-gray-400">Guest cancelled — free the table</div>
                    </div>
                  </button>
                )}
                <button onClick={() => setReserveModal(null)} className="w-full py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Close</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Guest count modal — open table or edit guests */}
      {guestModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setGuestModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Table {guestModal.table.number}</div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white">{guestModal.mode === 'edit' ? 'Update Guests' : 'Guest Count'}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums leading-none">{guestAdults + guestChildren}</div>
                  <div className="text-xs text-gray-400 mt-0.5">total</div>
                </div>
                <button onClick={() => setGuestModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-base">✕</button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-5 space-y-5">

              {/* Adults row */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">Adults</div>
                    <div className="text-xs text-gray-400">Age 13+</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGuestAdults(n => Math.max(0, n - 1))}
                      className="w-9 h-9 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold text-lg flex items-center justify-center hover:border-indigo-400 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={guestAdults === 0}
                    >−</button>
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-white w-7 text-center tabular-nums">{guestAdults}</span>
                    <button
                      onClick={() => setGuestAdults(n => n + 1)}
                      className="w-9 h-9 rounded-xl border-2 border-indigo-500 bg-indigo-600 text-white font-bold text-lg flex items-center justify-center hover:bg-indigo-700 transition-all"
                    >+</button>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {[1,2,3,4,5,6,7,8].map(n => (
                    <button key={n} onClick={() => setGuestAdults(n)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${guestAdults === n ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-300 bg-white dark:bg-gray-700'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100 dark:bg-gray-700" />

              {/* Children row */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">Children</div>
                    <div className="text-xs text-gray-400">Under 13</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGuestChildren(n => Math.max(0, n - 1))}
                      className="w-9 h-9 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold text-lg flex items-center justify-center hover:border-indigo-400 hover:text-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={guestChildren === 0}
                    >−</button>
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-white w-7 text-center tabular-nums">{guestChildren}</span>
                    <button
                      onClick={() => setGuestChildren(n => n + 1)}
                      className="w-9 h-9 rounded-xl border-2 border-indigo-500 bg-indigo-600 text-white font-bold text-lg flex items-center justify-center hover:bg-indigo-700 transition-all"
                    >+</button>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {[0,1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setGuestChildren(n)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${guestChildren === n ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-300 bg-white dark:bg-gray-700'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-2.5">
              <button
                onClick={() => setGuestModal(null)}
                className="flex-1 py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={guestAdults + guestChildren === 0}
                onClick={() => {
                  if (guestModal.mode === 'edit') {
                    setLiveOrders(prev => prev.map(o =>
                      o.table_id === guestModal.table.id && !['paid'].includes(o.status)
                        ? { ...o, guests: { adults: guestAdults, children: guestChildren } }
                        : o
                    ))
                    setGuestModal(null)
                  } else {
                    pushTableRecord(guestModal.table, { adults: guestAdults, children: guestChildren })
                    setOrderContext({ tableId: guestModal.table.id, tableNumber: guestModal.table.number, isTakeaway: false, existingOrder: null, guests: { adults: guestAdults, children: guestChildren } })
                    setGuestModal(null)
                    navTo('orders')
                  }
                }}
                className="flex-1 py-3 rounded-xl text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white transition-all disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {guestAdults + guestChildren === 0 ? 'Select guests' : guestModal.mode === 'edit' ? `Update — ${guestAdults + guestChildren} guest${(guestAdults + guestChildren) !== 1 ? 's' : ''}` : `Open Table — ${guestAdults + guestChildren} guest${(guestAdults + guestChildren) !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action modal — shown when tapping an occupied table */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setActionModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xs max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Table {actionModal.table.number}</div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white">What would you like to do?</div>
              </div>
              <button onClick={() => setActionModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-base">✕</button>
            </div>
            <div className="px-5 py-4 space-y-2.5">
              {actionModal.table.status === 'merged' ? (
                <button
                  onClick={() => confirmUnmerge(actionModal.table)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:border-blue-400 transition-all text-left"
                >
                  <span className="text-xl">🔓</span>
                  <div>
                    <div className="text-sm font-bold text-blue-700 dark:text-blue-300">Unmerge Table</div>
                    <div className="text-xs text-gray-400">Split back from Table {actionModal.table.mergedInto?.number}</div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setOrderContext({ tableId: actionModal.table.id, tableNumber: actionModal.table.number, isTakeaway: false, existingOrder: actionModal.order })
                    setActionModal(null)
                    navTo('orders')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 hover:border-indigo-400 transition-all text-left"
                >
                  <span className="text-xl">➕</span>
                  <div>
                    <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300">Add Items</div>
                    <div className="text-xs text-gray-400">Add more items to this order</div>
                  </div>
                </button>
              )}
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={() => setActionModal(null)}
                className="w-full py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer table modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setTransferModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Transfer from Table {transferModal.fromTable.number}</div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white">Select New Table</div>
              </div>
              <button onClick={() => setTransferModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-base">✕</button>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-gray-400 mb-3">Only free tables are available for transfer</p>
              <div className="grid grid-cols-3 gap-2">
                {tables.filter(t => t.status === 'free').map(t => (
                  <button
                    key={t.id}
                    onClick={() => confirmTransfer(t)}
                    className="h-16 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-0.5"
                  >
                    <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">T{t.number}</span>
                    <span className="text-[10px] font-semibold text-emerald-500">Free</span>
                  </button>
                ))}
                {tables.filter(t => t.status === 'free').length === 0 && (
                  <p className="col-span-3 text-center text-sm text-gray-400 py-6">No free tables available</p>
                )}
              </div>
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={() => setTransferModal(null)}
                className="w-full py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Merge table modal */}
      {mergeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setMergeModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Merge from Table {mergeModal.fromTable.number}</div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white">Merge Into Which Table?</div>
              </div>
              <button onClick={() => setMergeModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-base">✕</button>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-gray-400 mb-3">All items from <span className="font-bold text-gray-600 dark:text-gray-300">Table {mergeModal.fromTable.number}</span> will be added to the selected table. Table {mergeModal.fromTable.number} will be freed.</p>
              <div className="grid grid-cols-3 gap-2">
                {tables.filter(t => t.status === 'occupied' && t.id !== mergeModal.fromTable.id).map(t => {
                  const ord = tableOrder(t.id)
                  const itemCount = ord?.items?.length || 0
                  return (
                    <button
                      key={t.id}
                      onClick={() => confirmMerge(t)}
                      className="h-16 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 active:scale-[0.97] transition-all flex flex-col items-center justify-center gap-0.5"
                    >
                      <span className="text-lg font-extrabold text-red-700 dark:text-red-300">T{t.number}</span>
                      <span className="text-[10px] font-semibold text-gray-400">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                    </button>
                  )
                })}
                {tables.filter(t => t.status === 'occupied' && t.id !== mergeModal.fromTable.id).length === 0 && (
                  <p className="col-span-3 text-center text-sm text-gray-400 py-6">No other occupied tables</p>
                )}
              </div>
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={() => setMergeModal(null)}
                className="w-full py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Daily OTH Modal ──────────────────────────────────────────── */}
      {showOthModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowOthModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🎁</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Today's On the House</h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    {new Date().toLocaleDateString('en-MT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOthModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg leading-none"
              >✕</button>
            </div>

            {othLoading ? (
              /* Loading spinner */
              <div className="flex flex-col items-center justify-center gap-4 py-16">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Loading today's OTH records…</p>
              </div>
            ) : (
              <>
                {/* Stats bar */}
                <div className="flex items-center gap-4 px-5 py-2.5 bg-amber-50/60 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-800/30">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Items today</span>
                    <span className="text-sm font-extrabold text-amber-700 dark:text-amber-300">{todayOthRecords.length}</span>
                  </div>
                  <div className="w-px h-4 bg-amber-200 dark:bg-amber-700" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total value</span>
                    <span className="text-sm font-extrabold text-amber-700 dark:text-amber-300">€{todayOthTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Records list */}
                <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-700/50">
                  {todayOthRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 gap-2">
                      <span className="text-4xl opacity-40">🎁</span>
                      <p className="text-sm font-semibold text-gray-400">No OTH items today</p>
                      <p className="text-xs text-gray-300 dark:text-gray-500">Items marked as On the House will appear here</p>
                    </div>
                  ) : todayOthRecords.map((r, idx) => (
                    <div key={r.id ?? idx} className="px-5 py-3 flex items-start gap-3 hover:bg-amber-50/40 dark:hover:bg-amber-900/10 transition-colors">
                      {/* Time + Order# */}
                      <div className="flex-shrink-0 text-right w-14">
                        <div className="text-xs font-bold text-gray-700 dark:text-gray-200">
                          {new Date(r.created_at).toLocaleTimeString('en-MT', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">#{r.order_number || '—'}</div>
                      </div>
                      {/* Item details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{r.item_name}</span>
                          <span className="text-[9px] font-extrabold px-1 py-0.5 rounded bg-amber-400 dark:bg-amber-600 text-white tracking-widest">OTH</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {r.table_label && <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">🪑 {r.table_label}</span>}
                          {r.approved_by && <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">✓ {r.approved_by}</span>}
                          {r.reason && <span className="text-[10px] italic text-gray-400 dark:text-gray-500 truncate max-w-[140px]">{r.reason}</span>}
                        </div>
                      </div>
                      {/* Value */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-xs font-bold text-amber-700 dark:text-amber-300">€{Number(r.total_value || 0).toFixed(2)}</div>
                        <div className="text-[10px] text-gray-400">×{r.quantity ?? 1}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Older records → Full History</p>
                  <button
                    onClick={() => { setShowOthModal(false); navTo('oth') }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white transition-all"
                  >View Full History →</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Table Layout</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tap a table to open or add to an order</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {can(user, 'createOrder') && (
              <button
                onClick={() => { setTaName(''); setTaGuests(1); setShowTakeawayModal(true) }}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors flex items-center gap-1"
              >
                🥡 Takeaway
              </button>
            )}
            {can(user, 'addTable') && (
              <button
                onClick={() => { setAddTableLabel(''); setAddTableChairs(4); setAddTableFloor('Ground'); setShowAddTableModal(true) }}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1"
              >
                + Table
              </button>
            )}
            {can(user, 'deleteTable') && tables.some(t => t.status === 'archived') && (
              <button
                onClick={() => setShowArchivedModal(true)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
              >
                🗄 Archived <span className="bg-red-400 dark:bg-red-600 text-white rounded-full px-1.5 py-0.5 text-[10px]">{tables.filter(t => t.status === 'archived').length}</span>
              </button>
            )}
            {can(user, 'viewTableRecords') && tableRecords.length > 0 && (
              <button
                onClick={() => setShowTableRecordsModal(true)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1"
              >
                📊 Records <span className="bg-purple-400 dark:bg-purple-600 text-white rounded-full px-1.5 py-0.5 text-[10px]">{tableRecords.length}</span>
              </button>
            )}
            {reservationsList.some(r => r.date === todayISO) && (
              <button
                onClick={() => setShowTodayBookings(true)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors flex items-center gap-1"
              >
                📅 Today {todayActiveRes.length > 0 && <span className="bg-sky-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">{todayActiveRes.length}</span>}
              </button>
            )}
            {can(user, 'viewReservHistory') && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
              >
                📋 Reservation History {reservationHistory.length > 0 && <span className="bg-gray-400 dark:bg-gray-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">{reservationHistory.length}</span>}
              </button>
            )}
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
              {tables.filter(t=>t.status==='free').length} Free
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              {tables.filter(t=>t.status==='occupied').length} Occupied
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
              {openBills.length} Bill Ready
            </span>
            {tables.some(t=>t.status==='merged') && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {tables.filter(t=>t.status==='merged').length} Merged
              </span>
            )}
            {tables.some(t=>t.status==='reserved') && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">
                {tables.filter(t=>t.status==='reserved').length} Reserved
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          {tables.filter(t => t.status !== 'archived').map(table => {
            // ── Special OTH table card ──────────────────────────────────────
            if (table.isOTH) {
              return (
                <button
                  key={table.id}
                  onClick={() => {
                    setOthLoading(true)
                    setShowOthModal(true)
                    setTimeout(() => setOthLoading(false), 800)
                  }}
                  className="w-full h-28 rounded-2xl border-2 border-dashed border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:border-amber-500 hover:shadow-md active:scale-[0.97] transition-all p-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-extrabold leading-none text-amber-700 dark:text-amber-300">T0</span>
                    <span className="text-lg">🎁</span>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-extrabold text-amber-700 dark:text-amber-300 tracking-widest">OTH</div>
                    <div className="text-[10px] font-semibold text-amber-500 dark:text-amber-400">On the House</div>
                  </div>
                  <div className="pt-0.5 border-t border-amber-200 dark:border-amber-700/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Today's OTH</span>
                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">{todayOthRecords.length} items</span>
                  </div>
                </button>
              )
            }

            const order = tableOrder(table.id)
            const waiterName = order?.waiter || table.assignedWaiter
            const waiterInitial = waiterName ? waiterName.charAt(0).toUpperCase() : null
            const totalGuests = (order?.guests?.adults || 0) + (order?.guests?.children || 0)
            const elapsedTime = order?.created_timestamp ? elapsed(order.created_timestamp) : null
            const isOccupied  = table.status === 'occupied'
            const isMerged    = table.status === 'merged'
            const isReserved  = table.status === 'reserved'
            const isBillReady = isOccupied && openBills.some(b => b.tableId === table.id && b.status === 'open')
            const todayRes    = getTableReservation(table.id)
            const futureResList = getTableFutureRes(table.id)
            const isArrived   = isReserved && todayRes?.status === 'arrived'

            // Color tokens per state
            const colors = isMerged ? {
              card:        'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 hover:border-blue-400 hover:shadow-md',
              number:      'text-blue-700 dark:text-blue-300',
              dot:         'bg-blue-400',
              value:       'text-blue-500 dark:text-blue-400',
              statusLabel: 'text-blue-500 dark:text-blue-400',
              statusText:  `→ T${table.mergedInto?.number ?? '?'}`,
            } : isBillReady ? {
              card:        'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 hover:border-orange-500 hover:shadow-md',
              number:      'text-orange-700 dark:text-orange-300',
              dot:         'bg-orange-500',
              value:       'text-orange-600 dark:text-orange-400',
              statusLabel: 'text-orange-500 dark:text-orange-400',
              statusText:  'Bill Ready',
            } : isOccupied ? {
              card:        'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 hover:border-amber-500 hover:shadow-md',
              number:      'text-amber-700 dark:text-amber-300',
              dot:         'bg-amber-500',
              value:       'text-amber-600 dark:text-amber-400',
              statusLabel: 'text-amber-600 dark:text-amber-400',
              statusText:  'Occupied',
            } : isArrived ? {
              card:        'bg-violet-50 dark:bg-violet-900/20 border-violet-400 dark:border-violet-600 hover:border-violet-500 hover:shadow-md',
              number:      'text-violet-700 dark:text-violet-300',
              dot:         'bg-violet-500 animate-pulse',
              value:       'text-violet-600 dark:text-violet-400',
              statusLabel: 'text-violet-600 dark:text-violet-400',
              statusText:  'Guest Arrived',
            } : isReserved ? {
              card:        'bg-sky-50 dark:bg-sky-900/20 border-sky-300 dark:border-sky-700 hover:border-sky-500 hover:shadow-md',
              number:      'text-sky-700 dark:text-sky-300',
              dot:         'bg-sky-500',
              value:       'text-sky-600 dark:text-sky-400',
              statusLabel: 'text-sky-500 dark:text-sky-400',
              statusText:  'Reserved',
            } : {
              card:        'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 hover:shadow-md',
              number:      'text-emerald-700 dark:text-emerald-300',
              dot:         'bg-emerald-500',
              value:       'text-gray-300 dark:text-gray-600',
              statusLabel: 'text-emerald-500 dark:text-emerald-400',
              statusText:  'Available',
            }

            return (
              <div key={table.id} className="relative">
                <button
                  onClick={() => selectTable(table)}
                  className={`w-full h-28 rounded-2xl border-2 p-3 text-left flex flex-col justify-between transition-all active:scale-[0.97] ${colors.card}`}
                >
                  {/* Table number + status dot */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xl font-extrabold leading-none tabular-nums ${colors.number}`}>
                      T{table.number}
                    </span>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                  </div>

                  {/* Always-same-height info rows */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{!isOccupied && !isReserved ? 'Section' : 'Time'}</span>
                      <span className={`text-xs font-extrabold tabular-nums ${isOccupied ? colors.value : isReserved ? colors.value : 'text-gray-400 dark:text-gray-500'}`}>
                        {!isOccupied && !isReserved
                          ? (table.floor || 'Ground')
                          : isReserved && todayRes?.time
                            ? (() => { const [h, m] = todayRes.time.split(':'); const d = new Date(); d.setHours(+h, +m); return d.toLocaleTimeString('en-MT', { hour: '2-digit', minute: '2-digit' }) })()
                            : elapsedTime || '—'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{!isOccupied && !isReserved ? 'Chairs' : 'Guests'}</span>
                      <span className={`text-xs font-extrabold tabular-nums ${isOccupied && totalGuests > 0 ? colors.value : isReserved && todayRes?.guests ? colors.value : 'text-emerald-500 dark:text-emerald-400'}`}>
                        {!isOccupied && !isReserved
                          ? `🪑 ${table.capacity || 4}`
                          : isOccupied && totalGuests > 0
                            ? totalGuests
                            : isReserved && todayRes?.guests
                              ? todayRes.guests
                              : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Status row */}
                  <div className="pt-0.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-1.5 min-h-[1.25rem]">
                    <span className={`text-[10px] font-bold ${colors.statusLabel}`}>{colors.statusText}</span>
                    {table.addedBy && table.status === 'free' && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500 dark:text-indigo-400 leading-none">NEW</span>
                    )}
                    {isReserved && todayRes?.name && (
                      <div className="flex items-center gap-1">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${isArrived ? 'bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300' : 'bg-sky-200 dark:bg-sky-800 text-sky-700 dark:text-sky-300'}`}>
                          {todayRes.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate">{todayRes.name.split(' ')[0]}</span>
                      </div>
                    )}
                    {isOccupied && waiterName && (
                      <div className="flex items-center gap-1">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${isBillReady ? 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300' : 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300'}`}>
                          {waiterInitial}
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate">{waiterName.split(' ')[0]}</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Merged tables badge — shown on target table */}
                {table.mergedTables?.length > 0 && (
                  <div className="absolute -top-1.5 -left-1.5 flex gap-0.5">
                    {table.mergedTables.map(m => (
                      <span key={m.id} className="px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[9px] font-bold shadow-sm">
                        +T{m.number}
                      </span>
                    ))}
                  </div>
                )}

                {/* Transfer badge — occupied, allowed roles only */}
                {isOccupied && can(user, 'transferTable') && (
                  <button
                    onClick={e => { e.stopPropagation(); setTransferModal({ fromTable: table }) }}
                    title="Transfer table"
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white dark:bg-gray-700 border border-amber-300 dark:border-amber-600 text-amber-500 dark:text-amber-400 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all flex items-center justify-center text-[10px] shadow-sm"
                  >
                    🔀
                  </button>
                )}

                {/* Merge badge — occupied, allowed roles only */}
                {isOccupied && can(user, 'mergeTable') && (
                  <button
                    onClick={e => { e.stopPropagation(); setMergeModal({ fromTable: table }) }}
                    title="Merge table"
                    className="absolute -bottom-1.5 -left-1.5 w-5 h-5 rounded-full bg-white dark:bg-gray-700 border border-purple-300 dark:border-purple-600 text-purple-500 dark:text-purple-400 hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all flex items-center justify-center text-[10px] shadow-sm"
                  >
                    🔗
                  </button>
                )}

                {/* Edit guests badge — occupied only */}
                {isOccupied && (
                  <button
                    onClick={e => { e.stopPropagation(); openEditGuests(table) }}
                    title="Update guests"
                    className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex items-center justify-center text-[9px] font-bold shadow-sm"
                  >
                    {totalGuests || '+'}
                  </button>
                )}

                {/* Reserve badge — free tables, allowed roles only */}
                {table.status === 'free' && can(user, 'reserveTable') && (
                  <button
                    onClick={e => { e.stopPropagation(); openReserveCreate(table) }}
                    title={futureResList.length > 0 ? `${futureResList.length} future booking(s) — add another` : 'Reserve table'}
                    className={`absolute -bottom-1.5 -left-1.5 w-5 h-5 rounded-full border transition-all flex items-center justify-center text-[9px] font-bold shadow-sm ${futureResList.length > 0 ? 'bg-sky-500 border-sky-400 text-white hover:bg-sky-600' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-400 hover:bg-sky-600 hover:text-white hover:border-sky-600'}`}
                  >
                    {futureResList.length > 0 ? futureResList.length : '📅'}
                  </button>
                )}

                {/* Edit table badge — free tables, allowed roles only */}
                {table.status === 'free' && !table.isOTH && can(user, 'editTable') && (
                  <button
                    onClick={e => { e.stopPropagation(); openEditTable(table) }}
                    title="Edit table"
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-400 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all flex items-center justify-center text-[9px] shadow-sm"
                  >
                    ✏
                  </button>
                )}

                {/* Delete table badge — free tables, management only */}
                {table.status === 'free' && !table.isOTH && can(user, 'deleteTable') && (
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteTableConfirm(table) }}
                    title="Delete table"
                    className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all flex items-center justify-center text-[9px] shadow-sm"
                  >
                    🗑
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Stats badges row */}
        <div className="flex flex-wrap gap-2 mb-3">
          {tables.filter(t => t.status === 'reserved').length > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">
              {tables.filter(t => t.status === 'reserved').length} Reserved
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700/60">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Free</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Occupied</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" />Bill Ready</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" />Merged</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" />Reserved</span>
          <span className="flex items-center gap-1.5"><span className="text-base">🎁</span><span className="font-semibold text-amber-600 dark:text-amber-400">T0 — On the House</span></span>
          <span className="flex items-center gap-1.5 ml-auto">
            <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500 flex items-center justify-center bg-white dark:bg-gray-700 font-bold text-[10px]">2</span>
            Guests
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-500 flex items-center justify-center bg-white dark:bg-gray-700 text-[9px] shadow-sm">📅</span>
            Reserve table
          </span>
        </div>
      </Card>

      {/* ── Add Table Modal ── */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAddTableModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20">
              <div>
                <div className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-0.5">Table Layout</div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white">Add New Table</div>
              </div>
              <button onClick={() => setShowAddTableModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
            </div>
            <div className="px-5 py-5 space-y-4">
              {/* Chairs / Capacity */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Number of Chairs *</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setAddTableChairs(c => Math.max(1, c - 1))} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 text-lg transition-all">−</button>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{addTableChairs}</div>
                    <div className="text-xs text-gray-400">chairs</div>
                  </div>
                  <button onClick={() => setAddTableChairs(c => Math.min(20, c + 1))} className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-900/60 text-lg transition-all">+</button>
                </div>
                <div className="flex gap-2 mt-2">
                  {[2,4,6,8].map(n => (
                    <button key={n} onClick={() => setAddTableChairs(n)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${addTableChairs === n ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200'}`}>{n}</button>
                  ))}
                </div>
              </div>
              {/* Floor / Section */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Section / Floor</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Ground','Terrace','Bar','VIP','Garden','Upstairs'].map(f => (
                    <button key={f} onClick={() => setAddTableFloor(f)} className={`py-2 rounded-xl text-xs font-bold transition-all ${addTableFloor === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{f}</button>
                  ))}
                </div>
              </div>
              {/* Optional label */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Custom Label <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  value={addTableLabel}
                  onChange={e => setAddTableLabel(e.target.value)}
                  placeholder={`Table ${tables.filter(t => !t.isOTH).length + 1}`}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-200 placeholder-gray-300 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              {/* Preview */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="text-2xl">🪑</div>
                <div>
                  <div className="text-sm font-extrabold text-gray-900 dark:text-white">
                    Table {tables.filter(t => !t.isOTH).length + 1}
                    {addTableLabel.trim() ? ` — "${addTableLabel.trim()}"` : ''}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{addTableChairs} chairs · {addTableFloor} · Added by {user?.full_name || user?.username}</div>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2.5">
              <button onClick={() => setShowAddTableModal(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Cancel</button>
              <button onClick={confirmAddTable} className="flex-1 py-3 rounded-xl text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white transition-all">Add Table</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Table Modal ── */}
      {editTableModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditTableModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20">
              <div>
                <div className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-0.5">Table {editTableModal.number}</div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white">Edit Table</div>
              </div>
              <button onClick={() => setEditTableModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
            </div>
            <div className="px-5 py-5 space-y-4">
              {/* Chairs */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Number of Chairs</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setEditTableChairs(c => Math.max(1, c - 1))} className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-200 text-lg transition-all">−</button>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{editTableChairs}</div>
                    <div className="text-xs text-gray-400">chairs</div>
                  </div>
                  <button onClick={() => setEditTableChairs(c => Math.min(20, c + 1))} className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 font-bold text-indigo-700 dark:text-indigo-300 flex items-center justify-center hover:bg-indigo-200 text-lg transition-all">+</button>
                </div>
                <div className="flex gap-2 mt-2">
                  {[2,4,6,8].map(n => (
                    <button key={n} onClick={() => setEditTableChairs(n)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${editTableChairs === n ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'}`}>{n}</button>
                  ))}
                </div>
              </div>
              {/* Floor / Section */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Section / Floor</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Ground','Terrace','Bar','VIP','Garden','Upstairs'].map(f => (
                    <button key={f} onClick={() => setEditTableFloor(f)} className={`py-2 rounded-xl text-xs font-bold transition-all ${editTableFloor === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{f}</button>
                  ))}
                </div>
              </div>
              {/* Label */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Custom Label <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  value={editTableLabel}
                  onChange={e => setEditTableLabel(e.target.value)}
                  placeholder={`Table ${editTableModal.number}`}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-200 placeholder-gray-300 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              {/* Current info */}
              {editTableModal.addedBy && (
                <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700/40 rounded-xl px-3 py-2">
                  Added by {editTableModal.addedBy} · {editTableModal.floor} · {editTableModal.capacity} chairs
                  {editTableModal.updatedBy && ` · Last updated by ${editTableModal.updatedBy}`}
                </div>
              )}
            </div>
            <div className="px-5 pb-5 flex gap-2.5">
              <button onClick={() => setEditTableModal(null)} className="flex-1 py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Cancel</button>
              <button onClick={confirmEditTable} className="flex-1 py-3 rounded-xl text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Archive Table Confirm ── */}
      {deleteTableConfirm && (() => {
        const recCount = tableRecords.filter(r => r.tableId === deleteTableConfirm.id).length
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setDeleteTableConfirm(null); setDeleteReason('') }}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
                <div>
                  <div className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-0.5">Table {deleteTableConfirm.number}</div>
                  <div className="text-base font-extrabold text-gray-900 dark:text-white">Archive Table</div>
                </div>
                <button onClick={() => { setDeleteTableConfirm(null); setDeleteReason('') }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
              </div>
              <div className="px-5 py-5 space-y-4">
                {/* Table summary */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-extrabold text-red-600 dark:text-red-400">T{deleteTableConfirm.number}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{deleteTableConfirm.label || `Table ${deleteTableConfirm.number}`}</div>
                    <div className="text-xs text-gray-400">{deleteTableConfirm.capacity || '—'} chairs · {deleteTableConfirm.floor || '—'}</div>
                  </div>
                </div>
                {/* Record count warning */}
                {recCount > 0 && (
                  <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2.5">
                    <span className="text-amber-500 text-sm flex-shrink-0">⚠️</span>
                    <div className="text-xs text-amber-700 dark:text-amber-300">
                      This table has <span className="font-bold">{recCount} seating record{recCount !== 1 ? 's' : ''}</span>. Records will be preserved but the table will no longer appear in the layout.
                    </div>
                  </div>
                )}
                {/* Reason */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Reason for archiving</label>
                  <input
                    type="text"
                    value={deleteReason}
                    onChange={e => setDeleteReason(e.target.value)}
                    placeholder="e.g. Damaged, removed for event, relocated..."
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-200 placeholder-gray-300 focus:outline-none focus:border-red-400 transition-colors"
                  />
                </div>
                <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700/40 rounded-xl px-3 py-2">
                  The table will be archived, not permanently deleted. Management can restore it at any time from the Archived list.
                </div>
              </div>
              <div className="px-5 pb-5 flex gap-2.5">
                <button onClick={() => { setDeleteTableConfirm(null); setDeleteReason('') }} className="flex-1 py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Cancel</button>
                <button onClick={() => confirmDeleteTable(deleteTableConfirm)} className="flex-1 py-3 rounded-xl text-sm font-extrabold bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white transition-all">Archive Table</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Archived Tables Modal ── */}
      {showArchivedModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowArchivedModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">🗄 Archived Tables</h3>
                <div className="text-xs text-gray-400 mt-0.5">{tables.filter(t => t.status === 'archived').length} archived · can be restored</div>
              </div>
              <button onClick={() => setShowArchivedModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {tables.filter(t => t.status === 'archived').length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-8">No archived tables</div>
              ) : tables.filter(t => t.status === 'archived').map(t => {
                const recCount = tableRecords.filter(r => r.tableId === t.id).length
                return (
                  <div key={t.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-extrabold text-red-500 dark:text-red-400">T{t.number}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{t.label || `Table ${t.number}`}</div>
                        <div className="text-xs text-gray-400">{t.capacity || '—'} chairs · {t.floor || '—'}</div>
                        {t.archiveReason && (
                          <div className="text-xs text-red-500 dark:text-red-400 mt-0.5">Reason: {t.archiveReason}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-0.5">
                          Archived by {t.archivedBy} · {t.archivedAt ? new Date(t.archivedAt).toLocaleString('en-MT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </div>
                        {recCount > 0 && (
                          <div className="text-xs text-purple-500 dark:text-purple-400 mt-0.5">{recCount} seating record{recCount !== 1 ? 's' : ''} preserved</div>
                        )}
                      </div>
                      <button
                        onClick={() => restoreTable(t)}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-all"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Table Records Modal ── */}
      {showTableRecordsModal && (() => {
        const roleCfg = {
          superadmin: { label: 'Superadmin', cls: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
          admin:      { label: 'Admin',      cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
          owner:      { label: 'Owner',      cls: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
          manager:    { label: 'Manager',    cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
          supervisor: { label: 'Supervisor', cls: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' },
          waiter:     { label: 'Waiter',     cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
          cashier:    { label: 'Cashier',    cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
        }
        const actionCfg = {
          seated:   { label: '🪑 Seated',   cls: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
          added:    { label: '➕ Added',    cls: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' },
          edited:   { label: '✏ Edited',   cls: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
          archived: { label: '🗄 Archived', cls: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
          restored: { label: '♻ Restored', cls: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
        }
        const allTableNums = [...new Set(tableHistory.map(h => h.tableNumber))].sort((a,b)=>a-b)
        const filteredHistory = recordsFilter === 'all' ? tableHistory : tableHistory.filter(h => String(h.tableNumber) === recordsFilter)
        const filteredSeatings = recordsFilter === 'all' ? tableRecords : tableRecords.filter(r => String(r.tableNumber) === recordsFilter)

        function RoleBadge({ role }) {
          const cfg = roleCfg[role] || { label: role, cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500' }
          return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
        }

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowTableRecordsModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">📊 Table Records</h3>
                  <div className="text-xs text-gray-400 mt-0.5">{tableRecords.length} seatings · {tableHistory.length} actions logged</div>
                </div>
                <button onClick={() => setShowTableRecordsModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
              </div>

              {/* Tabs */}
              <div className="px-4 pt-3 pb-0 flex-shrink-0">
                <div className="grid grid-cols-2 gap-1.5 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                  <button onClick={() => setRecordsTab('seatings')} className={`py-2 rounded-lg text-xs font-bold transition-all ${recordsTab === 'seatings' ? 'bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 shadow' : 'text-gray-500 dark:text-gray-400'}`}>
                    🪑 Seatings ({tableRecords.length})
                  </button>
                  <button onClick={() => setRecordsTab('history')} className={`py-2 rounded-lg text-xs font-bold transition-all ${recordsTab === 'history' ? 'bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 shadow' : 'text-gray-500 dark:text-gray-400'}`}>
                    📋 Activity Log ({tableHistory.length})
                  </button>
                </div>
              </div>

              {/* Filter by table */}
              <div className="px-4 pt-2 pb-2 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  <button onClick={() => setRecordsFilter('all')} className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${recordsFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>All</button>
                  {allTableNums.map(num => (
                    <button key={num} onClick={() => setRecordsFilter(String(num))} className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${recordsFilter === String(num) ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>T{num}</button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 p-4 space-y-2">
                {recordsTab === 'seatings' ? (
                  filteredSeatings.length === 0
                    ? <div className="text-center text-sm text-gray-400 py-8">No seatings recorded yet</div>
                    : filteredSeatings.map(r => (
                      <div key={r.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3 flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300">T{r.tableNumber}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{r.tableLabel}</span>
                            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded-full">
                              {(r.covers.adults||0)+(r.covers.children||0)} covers{r.covers.children > 0 ? ` (${r.covers.adults}A+${r.covers.children}C)` : ''}
                            </span>
                            {r.fromReservation && <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-1.5 py-0.5 rounded-full">📅 Reservation</span>}
                          </div>
                          {r.fromReservation && r.reservationName && <div className="text-xs text-gray-500 dark:text-gray-400">Guest: {r.reservationName}</div>}
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-gray-400">By {r.openedBy}</span>
                            <RoleBadge role={r.openedByRole} />
                            <span className="text-xs text-gray-400">· {new Date(r.openedAt).toLocaleString('en-MT', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  filteredHistory.length === 0
                    ? <div className="text-center text-sm text-gray-400 py-8">No activity logged yet</div>
                    : filteredHistory.map(h => {
                      const aCfg = actionCfg[h.action] || { label: h.action, cls: 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700' }
                      return (
                        <div key={h.id} className={`rounded-xl border px-4 py-3 ${aCfg.cls}`}>
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/70 dark:bg-gray-800/70 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-extrabold text-gray-700 dark:text-gray-300">T{h.tableNumber}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">{aCfg.label}</span>
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{h.tableLabel}</span>
                              </div>
                              {/* Action-specific details */}
                              {h.action === 'added' && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">{h.details.chairs} chairs · {h.details.floor}{h.details.label !== `Table ${h.tableNumber}` ? ` · "${h.details.label}"` : ''}</div>
                              )}
                              {h.action === 'edited' && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {h.details.prevChairs !== h.details.chairs && `Chairs: ${h.details.prevChairs}→${h.details.chairs} `}
                                  {h.details.prevFloor !== h.details.floor && `Section: ${h.details.prevFloor}→${h.details.floor} `}
                                  {h.details.prevLabel !== h.details.label && `Label: "${h.details.prevLabel}"→"${h.details.label}"`}
                                </div>
                              )}
                              {h.action === 'archived' && (
                                <div className="text-xs text-red-500 dark:text-red-400">Reason: {h.details.reason}</div>
                              )}
                              {h.action === 'restored' && h.details.previousReason && (
                                <div className="text-xs text-gray-400">Was archived: {h.details.previousReason}</div>
                              )}
                              {h.action === 'seated' && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {(h.details.covers?.adults||0)+(h.details.covers?.children||0)} covers{h.details.fromReservation ? ` · Reservation: ${h.details.reservationName||''}` : ''}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-xs text-gray-400">{h.performedBy}</span>
                                <RoleBadge role={h.performedByRole} />
                                <span className="text-xs text-gray-400">· {new Date(h.performedAt).toLocaleString('en-MT', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                )}
              </div>

              {/* Footer summary */}
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-700/30">
                {recordsTab === 'seatings' ? (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div><div className="text-lg font-extrabold text-gray-900 dark:text-white">{tableRecords.length}</div><div className="text-[11px] text-gray-400">Total Seatings</div></div>
                    <div><div className="text-lg font-extrabold text-gray-900 dark:text-white">{tableRecords.reduce((s,r)=>s+(r.covers.adults||0)+(r.covers.children||0),0)}</div><div className="text-[11px] text-gray-400">Total Covers</div></div>
                    <div><div className="text-lg font-extrabold text-gray-900 dark:text-white">{[...new Set(tableRecords.map(r=>r.tableNumber))].length}</div><div className="text-[11px] text-gray-400">Tables Used</div></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {['added','edited','archived','restored'].map(a => (
                      <div key={a}>
                        <div className="text-base font-extrabold text-gray-900 dark:text-white">{tableHistory.filter(h=>h.action===a).length}</div>
                        <div className="text-[11px] text-gray-400 capitalize">{a}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
      <ActiveOrdersCard liveOrders={liveOrders} setLiveOrders={setLiveOrders} setReprintModal={setReprintModal} setOrderContext={setOrderContext} navTo={navTo} />

      {/* Reprint modal */}
      {reprintModal && (() => {
        const o = reprintModal.order
        const kitchenItems = (o.items || []).filter(i => (i.station || 'kitchen') !== 'bar')
        const barItems     = (o.items || []).filter(i => i.station === 'bar')
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setReprintModal(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xs max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
                    {o.order_type === 'takeaway' ? 'Takeaway' : `Table ${o.table_number}`} · #{o.order_number}
                  </div>
                  <div className="text-base font-extrabold text-gray-900 dark:text-white">Reprint Chit</div>
                </div>
                <button onClick={() => setReprintModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-base">✕</button>
              </div>
              <div className="px-5 py-4 space-y-2.5">
                {kitchenItems.length > 0 ? (
                  <button
                    onClick={() => { printStationTicket(o, kitchenItems, 'Kitchen'); setReprintModal(null) }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 hover:border-amber-400 transition-all text-left"
                  >
                    <span className="text-xl">👨‍🍳</span>
                    <div>
                      <div className="text-sm font-bold text-amber-700 dark:text-amber-300">Reprint Kitchen</div>
                      <div className="text-xs text-gray-400">{kitchenItems.length} kitchen item{kitchenItems.length !== 1 ? 's' : ''}</div>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 opacity-40 cursor-not-allowed">
                    <span className="text-xl">👨‍🍳</span>
                    <div>
                      <div className="text-sm font-bold text-gray-500">Kitchen</div>
                      <div className="text-xs text-gray-400">No kitchen items</div>
                    </div>
                  </div>
                )}
                {barItems.length > 0 ? (
                  <button
                    onClick={() => { printStationTicket(o, barItems, 'Bar'); setReprintModal(null) }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-cyan-200 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 hover:border-cyan-400 transition-all text-left"
                  >
                    <span className="text-xl">🍸</span>
                    <div>
                      <div className="text-sm font-bold text-cyan-700 dark:text-cyan-300">Reprint Bar</div>
                      <div className="text-xs text-gray-400">{barItems.length} bar item{barItems.length !== 1 ? 's' : ''}</div>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 opacity-40 cursor-not-allowed">
                    <span className="text-xl">🍸</span>
                    <div>
                      <div className="text-sm font-bold text-gray-500">Bar</div>
                      <div className="text-xs text-gray-400">No bar items</div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => { printStationTicket(o, o.items || [], 'Full Order'); setReprintModal(null) }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-gray-400 transition-all text-left"
                >
                  <span className="text-xl">📋</span>
                  <div>
                    <div className="text-sm font-bold text-gray-700 dark:text-gray-300">Full Order</div>
                    <div className="text-xs text-gray-400">All {o.items?.length || 0} items on one ticket</div>
                  </div>
                </button>
              </div>
              <div className="px-5 pb-5">
                <button
                  onClick={() => setReprintModal(null)}
                  className="w-full py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >Cancel</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export function Orders({ navTo, orderContext, setOrderContext }) {
  const { lang, user, liveOrders, setLiveOrders, nextOrderNum, setNextOrderNum, markOrderServed, completeProcess, menuItems, menuCategories, deductInventory, pushNotif } = useApp()
  const [reprintModal, setReprintModal] = useState(null)
  const [newItems, setNewItems] = useState([])
  const [cat, setCat] = useState('cat1')
  const [notes, setNotes] = useState('')
  const [mobileOrderTab, setMobileOrderTab] = useState('menu')

  // ── Item modifier modal ──────────────────────────────────────────────────────
  const [itemModal, setItemModal] = useState(null)
  const [modalQty, setModalQty] = useState(1)
  const [modalSelections, setModalSelections] = useState({}) // { groupLabel: string[] }
  const [modalNote, setModalNote] = useState('')

  // ── Pre-comp for existing order items ───────────────────────────────────────
  const [existingPreCompDialog, setExistingPreCompDialog] = useState(null)
  const [existingPreCompReason, setExistingPreCompReason] = useState('')
  const [existingPreCompApprover, setExistingPreCompApprover] = useState('')
  const PRE_COMP_REASONS = ['Incorrect Order', 'Customer Complaint', 'VIP / Loyalty', 'Quality Issue', 'Manager Decision', 'Other']

  function openExistingPreCompDialog(itemIdx, itemName, price, qty) {
    setExistingPreCompDialog({ itemIdx, itemName, price, qty })
    setExistingPreCompReason('')
    setExistingPreCompApprover('')
  }

  function confirmExistingPreComp() {
    if (!existingPreCompReason || !existingOrder) return
    setLiveOrders(prev => prev.map(o => {
      if (o.id !== existingOrder.id) return o
      const items = o.items.map((item, idx) =>
        idx === existingPreCompDialog.itemIdx
          ? { ...item, comped: true, compReason: existingPreCompReason, compApprovedBy: existingPreCompApprover.trim() || user?.full_name || '—' }
          : item
      )
      return { ...o, items }
    }))
    setExistingPreCompDialog(null); setExistingPreCompReason(''); setExistingPreCompApprover('')
  }

  function removeExistingPreComp(itemIdx) {
    if (!existingOrder) return
    setLiveOrders(prev => prev.map(o => {
      if (o.id !== existingOrder.id) return o
      const items = o.items.map((item, idx) => {
        if (idx !== itemIdx) return item
        const { comped, compReason, compApprovedBy, ...rest } = item
        return rest
      })
      return { ...o, items }
    }))
  }

  function openItemModal(item) {
    setItemModal(item)
    setModalQty(1)
    setModalSelections({})
    setModalNote('')
  }

  function toggleMod(group, choice) {
    setModalSelections(prev => {
      const current = prev[group.label] || []
      if (!group.multi) {
        return { ...prev, [group.label]: current.includes(choice) ? [] : [choice] }
      }
      return { ...prev, [group.label]: current.includes(choice) ? current.filter(c => c !== choice) : [...current, choice] }
    })
  }

  function addItemWithMods() {
    const flatMods = Object.values(modalSelections).flat().filter(Boolean)
    const cartKey = `${itemModal.id}-${Date.now()}`
    setNewItems(p => [...p, { ...itemModal, qty: modalQty, cartKey, selectedMods: flatMods, note: modalNote.trim() }])
    setItemModal(null)
  }

  const isAddingToExisting = !!orderContext?.existingOrder
  // Use live liveOrders so pre-comp flags update reactively
  const existingOrder = isAddingToExisting
    ? (liveOrders.find(o => o.id === orderContext.existingOrder.id) || orderContext.existingOrder)
    : null
  const existingItems = existingOrder?.items || []
  const round = isAddingToExisting ? (existingOrder.rounds ?? 1) + 1 : 1

  const label = orderContext?.isTakeaway
    ? (orderContext?.customerName ? `Takeaway · ${orderContext.customerName}` : 'Takeaway')
    : orderContext?.tableNumber ? `Table ${orderContext.tableNumber}` : 'New Order'
  const catItems = menuItems.filter(m => m.category_id === cat && m.available)

  const existingSubtotal = existingItems.reduce((a, i) => a + i.price * i.qty, 0)
  const newSubtotal = newItems.reduce((a, i) => a + i.price * i.qty, 0)
  const grandTotal = existingSubtotal + newSubtotal

  function addItem(item) {
    setNewItems(p => {
      const ex = p.find(i => i.id === item.id)
      if (ex) return p.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...p, { ...item, qty: 1 }]
    })
  }

  function changeQty(key, delta) {
    setNewItems(p => p.map(i => (i.cartKey || i.id) === key ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0))
  }

  function sendKitchen() {
    if (!newItems.length) return

    const mappedItems = newItems.map(i => ({ name: i.name_en, qty: i.qty, price: i.price, mods: i.selectedMods || [], note: i.note || '', station: i.station || 'kitchen' }))
    const kitchenItems = mappedItems.filter(i => (i.station || 'kitchen') !== 'bar')
    const barItems     = mappedItems.filter(i => i.station === 'bar')
    const hasKitchen   = kitchenItems.length > 0
    const hasBar       = barItems.length > 0

    if (isAddingToExisting) {
      const mergedItems   = [...existingOrder.items, ...mappedItems]
      const allHasKitchen = mergedItems.some(i => (i.station || 'kitchen') !== 'bar')
      const allHasBar     = mergedItems.some(i => i.station === 'bar')
      const editEntry = {
        editedAt: new Date(),
        editedBy: user?.full_name || 'Staff',
        editedByRole: user?.role || '',
        addedItems: mappedItems.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      }
      const updatedOrder  = {
        ...existingOrder,
        items: mergedItems,
        rounds: round,
        status: 'cooking',
        kitchenStatus: allHasKitchen ? (existingOrder.kitchenStatus === 'served' ? 'cooking' : existingOrder.kitchenStatus || 'cooking') : null,
        barStatus:     allHasBar     ? (existingOrder.barStatus     === 'served' ? 'pending'  : existingOrder.barStatus     || 'pending')  : null,
        editLog: [...(existingOrder.editLog || []), editEntry],
      }
      setLiveOrders(prev => prev.map(o => o.id === existingOrder.id ? updatedOrder : o))
      deductInventory(mappedItems)
      pushNotif(`Round ${round} added to Order #${existingOrder.order_number} (${label})`, 'info', 'Orders')
      const roundTicket = { ...existingOrder, rounds: round }
      if (hasKitchen) printStationTicket(roundTicket, kitchenItems, 'Kitchen')
      if (hasBar)     printStationTicket(roundTicket, barItems, 'Bar')
    } else {
      const newOrder = {
        id: `o${Date.now()}`,
        order_number: nextOrderNum,
        table_id:     orderContext?.tableId   || null,
        table_number: orderContext?.tableNumber || null,
        order_type:   orderContext?.isTakeaway ? 'takeaway' : 'dinein',
        customer_name: orderContext?.customerName || null,
        status: 'cooking',
        waiter: user?.full_name || 'Staff',
        notes,
        guests: orderContext?.guests || { adults: 0, children: 0 },
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        created_timestamp: Date.now(),
        items: mappedItems,
        rounds: 1,
        kitchenStatus: hasKitchen ? 'cooking' : null,
        barStatus:     hasBar     ? 'pending'  : null,
        editLog: [],
      }
      setLiveOrders(prev => [...prev, newOrder])
      setNextOrderNum(n => n + 1)
      deductInventory(mappedItems)
      pushNotif(`New Order #${nextOrderNum} placed for ${label} by ${user?.full_name || 'Staff'}`, 'info', 'Orders')
      if (hasKitchen) printStationTicket(newOrder, kitchenItems, 'Kitchen')
      if (hasBar)     printStationTicket(newOrder, barItems, 'Bar')
    }

    setNewItems([])
    setNotes('')
    navTo('orders')
  }

  return (
    <>
    {/* ── Item Modifier Modal ── */}
    {itemModal && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setItemModal(null)}>
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-700">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-2xl">{itemModal.emoji}</span>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{itemModal.name_en}</h2>
              </div>
              <div className="text-sm text-indigo-600 font-bold">€{itemModal.price.toFixed(2)}</div>
            </div>
            <button onClick={() => setItemModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">✕</button>
          </div>
          <div className="p-5 space-y-5">
            {/* Quantity */}
            <div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Quantity</div>
              <div className="flex items-center gap-3">
                <button onClick={() => setModalQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600">−</button>
                <span className="text-xl font-bold text-gray-900 dark:text-white w-8 text-center">{modalQty}</span>
                <button onClick={() => setModalQty(q => q + 1)} className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold text-lg flex items-center justify-center hover:bg-indigo-200">+</button>
                <span className="text-sm text-gray-400 ml-2">= €{(itemModal.price * modalQty).toFixed(2)}</span>
              </div>
            </div>
            {/* Modifier groups */}
            {(itemModal.modifierGroups || []).map(group => (
              <div key={group.label}>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {group.label} {group.multi ? <span className="normal-case font-normal text-gray-400">(select multiple)</span> : <span className="normal-case font-normal text-gray-400">(choose one)</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.choices.map(choice => {
                    const active = (modalSelections[group.label] || []).includes(choice)
                    return (
                      <button key={choice} onClick={() => toggleMod(group, choice)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300 bg-white dark:bg-gray-700'}`}>
                        {active && '✓ '}{choice}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {/* Free text note */}
            <div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Additional note</div>
              <textarea
                value={modalNote}
                onChange={e => setModalNote(e.target.value)}
                placeholder="e.g. No onion, allergen request, cook medium..."
                rows={2}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>
          {/* Footer buttons */}
          <div className="flex gap-2 px-5 pb-5">
            <Btn fullWidth onClick={() => setItemModal(null)}>Cancel</Btn>
            <Btn variant="success" fullWidth onClick={addItemWithMods}>
              Add {modalQty > 1 ? `×${modalQty}` : ''} to Order — €{(itemModal.price * modalQty).toFixed(2)}
            </Btn>
          </div>
        </div>
      </div>
    )}

    {/* ── Pre-Comp Flag Dialog (existing items) ────────────────────────────────── */}
    {existingPreCompDialog && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setExistingPreCompDialog(null)}>
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎁</span>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Pre-flag as Comp</h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium truncate max-w-[200px]">{existingPreCompDialog.itemName}</p>
              </div>
            </div>
            <button onClick={() => setExistingPreCompDialog(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
          </div>
          <div className="mx-5 mt-4 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Will be comped at billing</div>
              <div className="text-lg font-extrabold text-amber-700 dark:text-amber-300">€{(existingPreCompDialog.price * existingPreCompDialog.qty).toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">×{existingPreCompDialog.qty} @ €{existingPreCompDialog.price.toFixed(2)}</div>
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">Applied automatically</div>
            </div>
          </div>
          <div className="px-5 pt-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Reason <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {PRE_COMP_REASONS.map(r => (
                <button key={r} onClick={() => setExistingPreCompReason(r)}
                  className={`text-xs font-semibold px-2.5 py-2 rounded-xl border-2 text-left transition-all ${existingPreCompReason === r ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-amber-300'}`}
                >{r}</button>
              ))}
            </div>
          </div>
          <div className="px-5 pb-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Approved By</label>
            <input value={existingPreCompApprover} onChange={e => setExistingPreCompApprover(e.target.value)}
              placeholder={`Default: ${user?.full_name || 'Current user'}`}
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="px-5 pb-5 grid grid-cols-2 gap-2">
            <button onClick={() => setExistingPreCompDialog(null)}
              className="py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >Cancel</button>
            <button onClick={confirmExistingPreComp} disabled={!existingPreCompReason}
              className="py-3 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all active:scale-[0.98]"
            >Flag as Comp</button>
          </div>
        </div>
      </div>
    )}

    {/* ── Reprint Modal ──────────────────────────────────────────────────────── */}
    {reprintModal && (() => {
      const o = reprintModal.order
      const kitchenItems = (o.items || []).filter(i => (i.station || 'kitchen') !== 'bar')
      const barItems     = (o.items || []).filter(i => i.station === 'bar')
      return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setReprintModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xs max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
                  {o.order_type === 'takeaway' ? 'Takeaway' : `Table ${o.table_number}`} · #{o.order_number}
                </div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white">Reprint Chit</div>
              </div>
              <button onClick={() => setReprintModal(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
            </div>
            <div className="px-5 py-4 space-y-2.5">
              {kitchenItems.length > 0 ? (
                <button onClick={() => { printStationTicket(o, kitchenItems, 'Kitchen'); setReprintModal(null) }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 hover:border-amber-400 transition-all text-left">
                  <span className="text-xl">👨‍🍳</span>
                  <div>
                    <div className="text-sm font-bold text-amber-700 dark:text-amber-300">Reprint Kitchen</div>
                    <div className="text-xs text-gray-400">{kitchenItems.length} kitchen item{kitchenItems.length !== 1 ? 's' : ''}</div>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 opacity-40">
                  <span className="text-xl">👨‍🍳</span>
                  <div className="text-sm font-bold text-gray-500">No kitchen items</div>
                </div>
              )}
              {barItems.length > 0 ? (
                <button onClick={() => { printStationTicket(o, barItems, 'Bar'); setReprintModal(null) }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-cyan-200 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 hover:border-cyan-400 transition-all text-left">
                  <span className="text-xl">🍸</span>
                  <div>
                    <div className="text-sm font-bold text-cyan-700 dark:text-cyan-300">Reprint Bar</div>
                    <div className="text-xs text-gray-400">{barItems.length} bar item{barItems.length !== 1 ? 's' : ''}</div>
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 opacity-40">
                  <span className="text-xl">🍸</span>
                  <div className="text-sm font-bold text-gray-500">No bar items</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    })()}

    {/* ── Context Bar ───────────────────────────────────────────────────────── */}
    {orderContext && (
      <div className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <button
          onClick={() => navTo('tables')}
          className="flex items-center gap-1.5 text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group flex-shrink-0"
        >
          <span className="text-base transition-transform group-hover:-translate-x-0.5 inline-block">←</span>
          <span>Tables</span>
        </button>
        <span className="text-gray-200 dark:text-gray-700 select-none">/</span>
        <div className="flex-1 flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{label}</span>
          {isAddingToExisting && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              Round {round}
            </span>
          )}
          {orderContext.guests && (orderContext.guests.adults + orderContext.guests.children) > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
              · {orderContext.guests.adults + orderContext.guests.children} guest{(orderContext.guests.adults + orderContext.guests.children) !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${orderContext.isTakeaway ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
          {orderContext.isTakeaway ? 'Takeaway' : 'Dine-in'}
        </span>
      </div>
    )}

    {/* ── Order entry form ──────────────────────────────────────────────────── */}
    {/* Mobile tab switcher */}
    <div className="flex gap-2 mb-3 md:hidden">
      <button
        onClick={() => setMobileOrderTab('menu')}
        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${mobileOrderTab === 'menu' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
      >Menu</button>
      <button
        onClick={() => setMobileOrderTab('order')}
        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all relative ${mobileOrderTab === 'order' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
      >
        Order{newItems.length > 0 ? ` (${newItems.reduce((s,i)=>s+i.qty,0)})` : ''}
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Menu side */}
      <div className={mobileOrderTab !== 'menu' ? 'hidden md:block' : ''}>
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{label}</h2>
              {orderContext?.guests && (orderContext.guests.adults + orderContext.guests.children) > 0 && (
                <div className="text-xs text-gray-400 mt-0.5">
                  {orderContext.guests.adults} adult{orderContext.guests.adults !== 1 ? 's' : ''}{orderContext.guests.children > 0 ? ` · ${orderContext.guests.children} child${orderContext.guests.children !== 1 ? 'ren' : ''}` : ''}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isAddingToExisting && <Badge color="indigo">Round {round}</Badge>}
              <Badge color={orderContext?.isTakeaway ? 'orange' : 'blue'}>{orderContext?.isTakeaway ? 'Takeaway' : 'Dine-in'}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {menuCategories.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${cat === c.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-300'}`}>
                {c.name_en}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {catItems.map(item => (
              <button key={item.id} onClick={() => openItemModal(item)}
                className="border border-gray-200 dark:border-gray-600 rounded-xl p-3 text-left hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 active:scale-95 transition-all">
                <div className="flex items-center justify-between mb-1">
                  {item.modifierGroups?.length > 0 && (
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full">+ options</span>
                  )}
                </div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">{item.name_en}</div>
                <div className="text-sm text-indigo-600 font-bold mt-1">€{item.price.toFixed(2)}</div>
                <div className="text-xs text-gray-400 mt-0.5 truncate">{item.description_en}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Order side */}
      <div className={`space-y-3 ${mobileOrderTab !== 'order' ? 'hidden md:block' : ''}`}>

        {/* Allergy / Notes warning for existing orders */}
        {isAddingToExisting && existingOrder?.notes && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">⚠ Allergy / Note</div>
              <div className="text-sm text-amber-800 dark:text-amber-300 font-medium">{existingOrder.notes}</div>
            </div>
          </div>
        )}

        {/* Already ordered (existing rounds) */}
        {isAddingToExisting && existingItems.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-500 dark:text-gray-400 text-sm">
                Already ordered
                {existingOrder.rounds > 1 && <span className="ml-1 text-xs">({existingOrder.rounds} round{existingOrder.rounds > 1 ? 's' : ''})</span>}
              </h2>
              <Badge color="gray">€{existingSubtotal.toFixed(2)}</Badge>
            </div>
            {existingItems.map((item, i) => (
              <div key={i} className={`flex items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 ${item.comped ? 'bg-amber-50/40 dark:bg-amber-900/10 -mx-1 px-1 rounded-lg' : 'opacity-60'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-sm ${item.comped ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>{item.name}</span>
                    {item.comped && <span className="text-[8px] font-extrabold px-1 py-0.5 rounded bg-amber-500 text-white tracking-widest flex-shrink-0">COMP</span>}
                  </div>
                  {item.comped && <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">✓ {item.compReason} · {item.compApprovedBy}</div>}
                </div>
                <span className="text-xs text-gray-400">x{item.qty}</span>
                <span className={`text-sm w-14 text-right ${item.comped ? 'line-through text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>€{(item.price * item.qty).toFixed(2)}</span>
                <button
                  onClick={() => item.comped ? removeExistingPreComp(i) : openExistingPreCompDialog(i, item.name, item.price, item.qty)}
                  title={item.comped ? 'Remove Comp Flag' : 'Pre-flag as Comp'}
                  className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs flex-shrink-0 transition-colors ${item.comped ? 'bg-amber-400 text-white hover:bg-rose-400' : 'text-gray-300 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                >🎁</button>
              </div>
            ))}
          </Card>
        )}

        {/* New items being added */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
              {isAddingToExisting ? `Round ${round} — adding now` : 'Order summary'}
            </h2>
            {newItems.length > 0 && <Badge color="indigo">+€{newSubtotal.toFixed(2)}</Badge>}
          </div>
          {newItems.length === 0
            ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400">
                  {isAddingToExisting ? 'Select items to add to this order' : 'No items added yet'}
                </p>
              </div>
            )
            : newItems.map(item => (
              <div key={item.cartKey || item.id} className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-800 dark:text-gray-200">{item.name_en}</span>
                    {item.selectedMods?.length > 0 && (
                      <div className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5 truncate">+ {item.selectedMods.join(' · ')}</div>
                    )}
                    {item.note && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 truncate">📝 {item.note}</div>
                    )}
                  </div>
                  <button onClick={() => changeQty(item.cartKey || item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold">−</button>
                  <span className="text-sm font-bold w-5 text-center text-gray-800 dark:text-gray-200">{item.qty}</span>
                  <button onClick={() => changeQty(item.cartKey || item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold">+</button>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 w-14 text-right">€{(item.price * item.qty).toFixed(2)}</span>
                </div>
              </div>
            ))
          }
          {newItems.length > 0 && (
            <>
              <Divider />
              <div className="space-y-1">
                {isAddingToExisting && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Previous total</span>
                    <span className="text-gray-400">€{existingSubtotal.toFixed(2)}</span>
                  </div>
                )}
                {isAddingToExisting && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Round {round} adds</span>
                    <span className="text-indigo-600 font-semibold">+€{newSubtotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-200">{isAddingToExisting ? 'Running total' : 'Subtotal'}</span>
                  <span className="text-gray-900 dark:text-white text-base">€{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Notes (only for new orders) */}
        {!isAddingToExisting && (
          <Card>
            <Textarea label="Notes / Allergies" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Nut allergy, no garlic..." />
            <div className="flex flex-wrap gap-1.5">
              {['Nut allergy','Gluten free','Lactose','Vegan','No spice'].map(tag => (
                <button key={tag} onClick={() => setNotes(p => p ? p+'. '+tag : tag)}
                  className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                  {tag}
                </button>
              ))}
            </div>
          </Card>
        )}

        <Btn
          variant="success"
          fullWidth
          size="lg"
          onClick={sendKitchen}
          disabled={newItems.length === 0}
        >
          {isAddingToExisting ? `Send Round ${round}` : 'Send Order'}
        </Btn>
        <Btn fullWidth onClick={() => navTo('tables')}>Back to Tables</Btn>
      </div>
    </div>
    </>
  )
}

// ─── Shared station helpers ───────────────────────────────────────────────────
const STATE_ORDER = ['pending', 'cooking', 'ready', 'served']
function computeOverallStatus(ks, bs) {
  const active = [ks, bs].filter(s => s !== null && s !== undefined)
  if (!active.length) return 'served'
  return active.reduce((min, s) => STATE_ORDER.indexOf(s) < STATE_ORDER.indexOf(min) ? s : min, 'served')
}
function printStationTicket(o, items, stationLabel) {
  const win = window.open('', '_blank', 'width=420,height=650')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><title>${stationLabel} Ticket #${o.order_number}</title>
  <style>
    *{box-sizing:border-box}body{font-family:'Courier New',monospace;padding:20px;max-width:380px;margin:0 auto}
    h2{font-size:18px;margin:0 0 4px;letter-spacing:2px}
    .sub{font-size:12px;color:#555;margin-bottom:12px}
    hr{border:none;border-top:1px dashed #000;margin:12px 0}
    .item{margin:10px 0}.item-name{font-size:14px;font-weight:bold}
    .item-qty{font-size:18px;float:right;font-weight:bold}
    .mods{font-size:11px;color:#444;margin-top:2px}
    .note{font-size:11px;font-style:italic;color:#c00;margin-top:2px;padding:2px 4px;border:1px dashed #c00}
    .allergy{font-size:11px;font-weight:bold;color:#c00;padding:6px;border:2px solid #c00;margin-top:8px}
    @media print{body{padding:8px}}
  </style></head><body>
  <h2>${stationLabel.toUpperCase()}</h2>
  <div class="sub">Order #${o.order_number} &bull; ${o.order_type === 'takeaway' ? 'TAKEAWAY' : 'Table ' + o.table_number}<br>
  ${o.created_at} &bull; ${o.waiter}</div>
  <hr>
  ${items.map(i => `<div class="item">
    <span class="item-qty">&times;${i.qty}</span>
    <div class="item-name">${i.name || i.name_en}</div>
    ${i.mods?.length ? `<div class="mods">+ ${i.mods.join(' &middot; ')}</div>` : ''}
    ${i.note ? `<div class="note">&#9888; ${i.note}</div>` : ''}
  </div>`).join('<hr style="border-top:1px dotted #ccc;margin:4px 0">')}
  <hr>
  </body></html>`)
  win.document.close()
  win.focus()
  win.print()
}

// ─── Kitchen ──────────────────────────────────────────────────────────────────
// ─── Shared station helpers ───────────────────────────────────────────────────
function stationElapsedMin(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return null
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  const now = new Date(), then = new Date()
  then.setHours(h, m, 0, 0)
  if (then > now) then.setDate(then.getDate() - 1)
  return Math.max(0, Math.floor((now - then) / 60000))
}

function StationElapsed({ timeStr }) {
  const min = stationElapsedMin(timeStr)
  if (min === null) return <span className="text-xs text-gray-400">—</span>
  const urgent = min > 20, warn = min >= 10 && min <= 20
  const label  = min < 60 ? `${min}m` : `${Math.floor(min/60)}h ${min % 60}m`
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${urgent ? 'text-red-600 dark:text-red-400' : warn ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
      {urgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping flex-shrink-0" />}
      <Timer size={11} />{label}
    </span>
  )
}

function StationTableLabel({ o }) {
  const base = o.order_type === 'takeaway' ? 'Takeaway' : `Table ${o.table_number}`
  return (
    <span className="flex items-center gap-1.5 flex-wrap">
      <span className="font-bold text-gray-900 dark:text-white">{base}</span>
      {o.merged_from_number && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
          <GitMerge size={9} />+T{o.merged_from_number}
        </span>
      )}
      {o.transferred_from_id && !o.merged_from_number && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
          <ArrowRight size={9} />moved
        </span>
      )}
    </span>
  )
}

export function Kitchen() {
  const { liveOrders, setLiveOrders } = useApp()

  const kitchenOrders = [...liveOrders]
    .filter(o => {
      if (o.kitchenStatus === undefined) return ['pending','cooking','ready'].includes(o.status)
      return o.kitchenStatus !== null && o.kitchenStatus !== 'served'
    })
    .sort((a, b) => {
      if (b.priority !== a.priority) return (b.priority ? 1 : 0) - (a.priority ? 1 : 0)
      return (a.order_number || 0) - (b.order_number || 0)
    })

  function advance(id) {
    setLiveOrders(p => p.map(o => {
      if (o.id !== id) return o
      const ks = o.kitchenStatus ?? o.status
      const next = ks === 'pending' ? 'cooking' : ks === 'cooking' ? 'ready' : ks === 'ready' ? 'served' : ks
      return { ...o, kitchenStatus: next, status: computeOverallStatus(next, o.barStatus ?? null) }
    }))
  }

  function togglePriority(id) {
    setLiveOrders(p => p.map(o => o.id === id ? { ...o, priority: !o.priority } : o))
  }

  function printAll() {
    kitchenOrders.forEach((o, idx) => {
      const items = o.items.filter(i => (i.station || 'kitchen') !== 'bar')
      setTimeout(() => printStationTicket(o, items, 'Kitchen'), idx * 450)
    })
  }

  const stats = { pending: 0, cooking: 0, ready: 0 }
  kitchenOrders.forEach(o => { const s = o.kitchenStatus ?? o.status; if (stats[s] !== undefined) stats[s]++ })

  const KS_CFG = {
    pending: { label:'Pending',  topBar:'bg-amber-400', bg:'bg-amber-100 dark:bg-amber-900/30', text:'text-amber-700 dark:text-amber-400', dot:'bg-amber-400' },
    cooking: { label:'Cooking',  topBar:'bg-blue-500',  bg:'bg-blue-100 dark:bg-blue-900/30',   text:'text-blue-700 dark:text-blue-400',   dot:'bg-blue-500' },
    ready:   { label:'Ready',    topBar:'bg-green-500', bg:'bg-green-100 dark:bg-green-900/30', text:'text-green-700 dark:text-green-400', dot:'bg-green-500' },
  }

  if (kitchenOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60">
        <ChefHat size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
        <div className="text-sm font-semibold text-gray-400">No active kitchen orders</div>
        <div className="text-xs text-gray-300 dark:text-gray-600 mt-1">Waiting for new orders…</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <ChefHat size={18} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-gray-900 dark:text-white leading-none">Kitchen Orders</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-400">Live</span>
            </div>
          </div>
        </div>
        <button
          onClick={printAll}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 hover:bg-orange-100 transition-all"
        >
          <Printer size={14} />Print All ({kitchenOrders.length})
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key:'pending', label:'Pending', Icon:Activity, iconCls:'text-amber-500', bg:'bg-amber-50 dark:bg-amber-900/20', border:'border-amber-200 dark:border-amber-800/40' },
          { key:'cooking', label:'Cooking', Icon:Flame,    iconCls:'text-blue-500',  bg:'bg-blue-50 dark:bg-blue-900/20',   border:'border-blue-200 dark:border-blue-800/40' },
          { key:'ready',   label:'Ready',   Icon:CheckCircle2, iconCls:'text-green-500', bg:'bg-green-50 dark:bg-green-900/20', border:'border-green-200 dark:border-green-800/40' },
        ].map(({ key, label, Icon, iconCls, bg, border }) => (
          <div key={key} className={`${bg} border ${border} rounded-2xl px-4 py-3 flex items-center gap-3`}>
            <Icon size={20} className={`flex-shrink-0 ${iconCls}`} />
            <div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{stats[key]}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Order cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {kitchenOrders.map(o => {
          const ks          = o.kitchenStatus ?? o.status
          const cfg         = KS_CFG[ks] || KS_CFG.pending
          const kitchenItems = o.items.filter(i => (i.station || 'kitchen') !== 'bar')
          const elapsed     = stationElapsedMin(o.created_at) || 0
          const isUrgent    = elapsed > 20 && ks === 'pending'

          return (
            <div
              key={o.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden transition-all ${o.priority ? 'ring-2 ring-red-400 dark:ring-red-500' : ''} ${isUrgent ? 'border-red-300 dark:border-red-700 shadow-md shadow-red-100 dark:shadow-red-900/20' : 'border-gray-100 dark:border-gray-700/60'}`}
            >
              {/* Colour top bar */}
              <div className={`h-1.5 w-full ${cfg.topBar}`} />

              <div className="p-4 flex flex-col gap-3">

                {/* Row 1: order# + status + elapsed */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">#{o.order_number}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${ks === 'cooking' ? 'animate-pulse' : ''}`} />
                      {cfg.label}
                    </span>
                    {o.priority && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-extrabold">
                        <AlertCircle size={9} />PRIORITY
                      </span>
                    )}
                  </div>
                  <StationElapsed timeStr={o.created_at} />
                </div>

                {/* Row 2: table + waiter */}
                <div className="flex items-center justify-between">
                  <StationTableLabel o={o} />
                  <span className="text-xs text-gray-400 truncate max-w-[100px]">{o.waiter || '—'}</span>
                </div>

                {/* Items */}
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-3 space-y-1.5">
                  {kitchenItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-extrabold flex-shrink-0 mt-0.5">{item.qty}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.name || item.name_en}</div>
                        {item.mods?.length > 0 && <div className="text-xs text-orange-500 mt-0.5">+ {item.mods.join(' · ')}</div>}
                        {item.note && (
                          <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded px-2 py-0.5 mt-1 inline-block">
                            ⚠ {item.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bar crossover indicator */}
                {o.barStatus && o.barStatus !== 'served' && (
                  <div className="flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-900/30 rounded-xl px-3 py-2">
                    <Wine size={12} />Drinks also at Bar <span className="font-bold">({o.barStatus})</span>
                  </div>
                )}

                {/* Allergy */}
                {o.notes && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl px-3 py-2 font-semibold">
                    <AlertTriangle size={12} className="flex-shrink-0" />{o.notes}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => togglePriority(o.id)}
                    className={`flex-none inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${o.priority ? 'bg-red-500 text-white border-red-500' : 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-red-300 hover:text-red-500'}`}
                  >
                    <AlertCircle size={12} />{o.priority ? 'High' : 'Low'}
                  </button>
                  <button
                    onClick={() => printStationTicket(o, kitchenItems, 'Kitchen')}
                    className="flex-none inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:border-orange-300 hover:text-orange-500 transition-all"
                  >
                    <Printer size={13} />
                  </button>
                  {ks === 'pending' && (
                    <button onClick={() => advance(o.id)} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-all">
                      <Play size={13} />Start Cooking
                    </button>
                  )}
                  {ks === 'cooking' && (
                    <button onClick={() => advance(o.id)} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 transition-all">
                      <CheckCircle2 size={13} />Mark Ready
                    </button>
                  )}
                  {ks === 'ready' && (
                    <button onClick={() => advance(o.id)} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/60 hover:bg-green-100 transition-all">
                      <CheckCircle2 size={13} />Notify Waiter
                    </button>
                  )}
                </div>

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Bar ──────────────────────────────────────────────────────────────────────
export function Bar() {
  const { liveOrders, setLiveOrders } = useApp()

  const barOrders = [...liveOrders]
    .filter(o => o.barStatus !== null && o.barStatus !== undefined && o.barStatus !== 'served')
    .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))

  function advance(id) {
    setLiveOrders(p => p.map(o => {
      if (o.id !== id) return o
      const bs = o.barStatus
      const next = bs === 'pending' ? 'preparing' : bs === 'preparing' ? 'ready' : bs === 'ready' ? 'served' : bs
      const overall = computeOverallStatus(o.kitchenStatus ?? null, next)
      return { ...o, barStatus: next, status: overall }
    }))
  }

  function togglePriority(id) {
    setLiveOrders(p => p.map(o => o.id === id ? { ...o, priority: !o.priority } : o))
  }

  const borderColor = { pending: 'border-l-cyan-400', preparing: 'border-l-blue-500', ready: 'border-l-green-500' }
  const btnVariant  = { pending: 'primary', preparing: 'success', ready: 'warning' }
  const btnLabel    = { pending: '▶ Start Preparing', preparing: '✓ Mark Ready', ready: '🛎 Ready — Notify Waiter' }

  if (barOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400">
        <div className="text-4xl mb-2">🍸</div>
        <div className="text-sm font-medium">No active bar orders</div>
        <div className="text-xs mt-1">Waiting for drink orders…</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {barOrders.map(o => {
        const bs = o.barStatus
        const barItems = o.items.filter(i => i.station === 'bar')
        return (
          <div key={o.id} className={`bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl shadow-card p-5 border-l-4 ${borderColor[bs] || 'border-l-gray-300'} ${o.priority ? 'ring-2 ring-red-400 dark:ring-red-500' : ''}`}>
            {/* Order header */}
            <div className="flex items-start justify-between mb-1">
              <div>
                <div className="text-base font-bold text-gray-900 dark:text-white">
                  {o.order_type === 'takeaway' ? 'Takeaway' : `Table ${o.table_number}`}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">#{o.order_number} · {o.created_at} · {o.waiter}{o.guests && (o.guests.adults + o.guests.children) > 0 ? ` · ${o.guests.adults + o.guests.children} guests` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePriority(o.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${o.priority ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-400 hover:text-red-500'}`}
                >
                  {o.priority ? '🚨 Priority' : 'Prioritise'}
                </button>
                <Badge color={statusColor(bs === 'preparing' ? 'cooking' : bs)}>{bs}</Badge>
              </div>
            </div>
            {/* Bar-only drink items */}
            <div className="mt-3 space-y-0">
              {barItems.map((item, i) => (
                <div key={i} className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {item.name || item.name_en} <span className="text-cyan-500">×{item.qty}</span>
                  </div>
                  {item.mods?.length > 0 && (
                    <div className="text-xs text-cyan-400 mt-0.5">+ {item.mods.join(' · ')}</div>
                  )}
                  {item.note && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-0.5 inline-block">Note: {item.note}</div>
                  )}
                </div>
              ))}
            </div>
            {/* Kitchen status indicator */}
            {o.kitchenStatus && o.kitchenStatus !== 'served' && (
              <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-2 py-1.5">
                👨‍🍳 Food also sent to Kitchen ({o.kitchenStatus})
              </div>
            )}
            {/* Allergy note */}
            {o.notes && (
              <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1.5">
                ⚠ Allergy / Note: {o.notes}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => printStationTicket(o, barItems, 'Bar')}
                className="flex-none text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              >🖨 Print</button>
              <Btn variant={btnVariant[bs]} fullWidth size="lg" onClick={() => advance(o.id)}>
                {btnLabel[bs]}
              </Btn>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Billing ──────────────────────────────────────────────────────────────────
export function Billing({ orderContext }) {
  const { lang, user, company, liveOrders, setLiveOrders, openBills, finalizeBill, addToHistory, menuItems, menuCategories, addOthRecords } = useApp()
  const vatRate = company.vat_rate / 100

  // ── Cart state ──────────────────────────────────────────────────────────────
  const [cart, setCart] = useState([])
  const [payMethod, setPayMethod] = useState(null)
  const [cashGiven, setCashGiven] = useState(0)
  const [receipt, setReceipt] = useState(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [billNote, setBillNote] = useState('')

  // ── OTH (Comp) state ────────────────────────────────────────────────────────
  // compItems: { [itemKey]: { reason, approvedBy } }
  const [compItems, setCompItems] = useState({})
  // compDialog: null | { itemKey, itemName, price, qty, source: 'bill'|'cart' }
  const [compDialog, setCompDialog] = useState(null)
  const [compReason, setCompReason] = useState('')
  const [compApprover, setCompApprover] = useState('')

  const COMP_REASONS = ['Customer Complaint', 'VIP / Loyalty Guest', 'Staff Meal', 'Manager Comp', 'Promotion / Event', 'Incorrect Order', 'Other']

  function itemKey(source, indexOrId) { return `${source}-${indexOrId}` }
  function isComped(key) { return !!compItems[key] }

  function openCompDialog(key, itemName, price, qty) {
    setCompDialog({ key, itemName, price, qty })
    const existing = compItems[key]
    setCompReason(existing?.reason || '')
    setCompApprover(existing?.approvedBy || '')
  }

  function confirmComp() {
    if (!compReason) return
    setCompItems(p => ({ ...p, [compDialog.key]: { reason: compReason, approvedBy: compApprover.trim() || user?.full_name || '—' } }))
    setCompDialog(null)
    setCompReason('')
    setCompApprover('')
  }

  // ── Comp Reversal state ───────────────────────────────────────────────────────
  // reverseDialog: null | { key, itemName, price, qty, originalReason, originalApprover }
  const [reverseDialog, setReverseDialog] = useState(null)
  const [reverseReason, setReverseReason] = useState('')
  const [reverseApprover, setReverseApprover] = useState('')
  // compRemovedLog: audit trail of items un-comped in this billing session
  const [compRemovedLog, setCompRemovedLog] = useState([])

  const REVERSE_REASONS = ['Incorrectly Flagged', 'Customer Will Pay', 'Manager Override', 'Input Error', 'Other']

  function openReverseDialog(key, itemName, price, qty) {
    setReverseDialog({ key, itemName, price, qty, originalReason: compItems[key]?.reason, originalApprover: compItems[key]?.approvedBy })
    setReverseReason('')
    setReverseApprover('')
  }

  function confirmReversal() {
    if (!reverseReason) return
    setCompRemovedLog(p => [...p, {
      key: reverseDialog.key,
      itemName: reverseDialog.itemName,
      price: reverseDialog.price,
      qty: reverseDialog.qty,
      originalReason: reverseDialog.originalReason,
      originalApprover: reverseDialog.originalApprover,
      reverseReason,
      reversedBy: reverseApprover.trim() || user?.full_name || '—',
      reversedAt: new Date(),
    }])
    setCompItems(p => { const n = { ...p }; delete n[reverseDialog.key]; return n })
    setReverseDialog(null)
    setReverseReason('')
    setReverseApprover('')
  }

  // ── Open bill tracking ──────────────────────────────────────────────────────
  const [loadedBillId, setLoadedBillId] = useState(null)    // which open bill is loaded
  const [preloadOrderId, setPreloadOrderId] = useState(null) // liveOrders id when loaded from takeaway
  const [billItems, setBillItems] = useState([])             // items from the loaded bill (read-only display)
  const [preloadLabel, setPreloadLabel] = useState('')      // label when loaded from OrderList

  // ── Product browser state ───────────────────────────────────────────────────
  const [activeCat, setActiveCat] = useState('all')
  const [search, setSearch] = useState('')
  const [mobileBillTab, setMobileBillTab] = useState('menu')
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalCat, setModalCat] = useState('all')
  const [modalSearch, setModalSearch] = useState('')
  const [showShopModal, setShowShopModal] = useState(false)
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [splitCount, setSplitCount] = useState(2)
  const [splitPaid, setSplitPaid] = useState({})
  const [splitPayMethods, setSplitPayMethods] = useState({})
  const [splitCashGiven, setSplitCashGiven] = useState({})
  const [billItemModal, setBillItemModal] = useState(null)
  const [billModalQty, setBillModalQty] = useState(1)
  const [billModalSelections, setBillModalSelections] = useState({})
  const [billModalNote, setBillModalNote] = useState('')
  const searchRef = useRef(null)

  // ── Filtered items ──────────────────────────────────────────────────────────
  const visibleItems = menuItems.filter(item => {
    if (!item.available) return false
    const q = search.trim().toLowerCase()
    const matchCat = activeCat === 'all' || item.category_id === activeCat
    const matchSearch = !q || item.name_en.toLowerCase().includes(q)
                            || item.code?.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  // ── Load an open bill into the cashier view ─────────────────────────────────
  function loadBillIntoCart(bill) {
    // Store original bill items separately (cannot be removed, for display)
    setBillItems(bill.items.map(i => ({
      id: i.id || `bill-${i.name || i.name_en}-${Math.random()}`,
      name_en: i.name || i.name_en,
      price: i.price,
      qty: i.qty,
      discount_pct: i.discount_pct || 0,
      fromBill: true,
    })))
    setCart([])  // cashier extras start empty
    setLoadedBillId(bill.id)
  }

  // ── Load a takeaway (or any) liveOrder directly into billing ───────────────
  function loadTakeawayOrder(order) {
    setBillItems(order.items.map(i => ({
      id: i.id || `bill-${i.name || i.name_en}-${Math.random()}`,
      name_en: i.name || i.name_en,
      price: i.price,
      qty: i.qty,
      discount_pct: 0,
      fromBill: true,
      round: i.round || 1,
    })))
    const preComps = {}
    order.items.forEach((item, idx) => {
      if (item.comped) {
        preComps[itemKey('bill', idx)] = { reason: item.comped_reason || 'Pre-flagged', approvedBy: '—' }
      }
    })
    setCompItems(preComps)
    setCart([])
    setLoadedBillId(null)
    setPreloadOrderId(order.id)
    setPreloadLabel(order.order_type === 'takeaway'
      ? `🥡 ${order.customer_name || 'Walk-in'} — #${order.order_number}`
      : `🍽️ Table ${order.table_number} — #${order.order_number}`)
    setMobileBillTab('cart')
  }

  // ── Preload order when navigated from OrderList ─────────────────────────────
  useEffect(() => {
    const order = orderContext?.preloadOrder
    if (!order) return
    setBillItems(order.items.map(i => ({
      id: i.id || `bill-${i.name || i.name_en}-${Math.random()}`,
      name_en: i.name || i.name_en,
      price: i.price,
      qty: i.qty,
      discount_pct: 0,
      fromBill: true,
      round: i.round || 1,
    })))
    const preComps = {}
    order.items.forEach((item, idx) => {
      if (item.comped) {
        preComps[itemKey('bill', idx)] = { reason: item.compReason || 'Pre-flagged', approvedBy: item.compApprovedBy || '—' }
      }
    })
    setCompItems(preComps)
    setCart([])
    setLoadedBillId(null)
    setPreloadOrderId(order.id)
    setPreloadLabel(order.order_type === 'takeaway' ? `🥡 ${order.customer_name || 'Walk-in'} — #${order.order_number}` : `🍽️ Table ${order.table_number} — #${order.order_number}`)
  }, [orderContext?.preloadOrder])

  function clearLoadedBill() {
    setBillItems([])
    setCart([])
    setLoadedBillId(null)
    setPreloadOrderId(null)
    setPayMethod(null)
    setCashGiven(0)
    setBillNote('')
    setPreloadLabel('')
    setCompItems({})
    setCompRemovedLog([])
  }

  function openBillItemModal(item) {
    setBillItemModal(item)
    setBillModalQty(1)
    setBillModalSelections({})
    setBillModalNote('')
  }

  function toggleBillMod(group, choice) {
    setBillModalSelections(prev => {
      const current = prev[group.label] || []
      if (!group.multi) {
        return { ...prev, [group.label]: current.includes(choice) ? [] : [choice] }
      }
      return { ...prev, [group.label]: current.includes(choice) ? current.filter(c => c !== choice) : [...current, choice] }
    })
  }

  function addToCartWithMods() {
    const flatMods = Object.values(billModalSelections).flat().filter(Boolean)
    const cartKey = `${billItemModal.id}-${Date.now()}`
    setCart(p => [...p, { ...billItemModal, qty: billModalQty, cartKey, selectedMods: flatMods, note: billModalNote.trim() }])
    setMobileBillTab('cart')
    setBillItemModal(null)
  }

  function addToCart(item) {
    setCart(p => {
      const ex = p.find(i => i.id === item.id)
      if (ex) return p.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...p, { ...item, qty: 1 }]
    })
    setMobileBillTab('cart')
  }

  function changeQty(id, delta) {
    setCart(p => p.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0))
  }

  function removeFromCart(id) {
    setCart(p => p.filter(i => i.id !== id))
  }

  function changeBillItemQty(index, delta) {
    setBillItems(p => p.map((item, i) => i === index ? { ...item, qty: item.qty + delta } : item).filter(item => item.qty > 0))
  }

  function removeBillItem(index) {
    setBillItems(p => p.filter((_, i) => i !== index))
  }

  function setExtraNote(id, note) {
    setCart(p => p.map(i => i.id === id ? { ...i, extraNote: note } : i))
  }

  // ── Totals (bill items + cashier extras) ────────────────────────────────────
  const allCartItems = [...billItems, ...cart]

  // Compute per-item keys for comp check
  const billItemKeys  = billItems.map((_, i) => itemKey('bill', i))
  const cartItemKeys  = cart.map(item => itemKey('cart', item.id))
  const allKeys       = [...billItemKeys, ...cartItemKeys]

  const compCount = Object.keys(compItems).length
  const compTotal = allCartItems.reduce((sum, item, idx) => {
    const key = allKeys[idx]
    if (!isComped(key)) return sum
    return sum + item.price * item.qty
  }, 0)

  const subtotal = allCartItems.reduce((a, item, idx) => {
    const key = allKeys[idx]
    if (isComped(key)) return a  // comped items are free
    const disc = Number(item.discount_pct || 0) / 100
    return a + (item.price * (1 - disc)) * item.qty
  }, 0)
  const totalSavings = allCartItems.reduce((a, item, idx) => {
    const key = allKeys[idx]
    if (isComped(key)) return a
    const disc = Number(item.discount_pct || 0) / 100
    return a + (item.price * disc) * item.qty
  }, 0)
  const vat = subtotal * vatRate
  const total = subtotal + vat

  // ── Confirm payment & finalize ───────────────────────────────────────────────
  function confirmPayment() {
    if (!payMethod || allCartItems.length === 0) return
    const orderNum = Math.floor(Math.random() * 900) + 100
    const bill = loadedBillId ? openBills.find(b => b.id === loadedBillId) : null
    const paidAt = new Date()
    if (loadedBillId) finalizeBill(loadedBillId)
    if (preloadOrderId) {
      setLiveOrders(prev => prev.map(o => o.id === preloadOrderId ? { ...o, status: 'paid' } : o))
      setPreloadOrderId(null)
    }

    // Record comped items to OTH log
    const othEntries = allCartItems
      .map((item, idx) => ({ item, key: allKeys[idx] }))
      .filter(({ key }) => isComped(key))
      .map(({ item, key }) => ({
        id: `oth_${Date.now()}_${key}`,
        order_number: orderNum,
        invoice_ref: `INV-${orderNum}`,
        item_name: item.name_en,
        quantity: item.qty,
        original_price: item.price,
        total_value: item.price * item.qty,
        approved_by: compItems[key]?.approvedBy || user?.full_name || '—',
        reason: compItems[key]?.reason || '',
        table_label: bill?.tableLabel || 'Walk-in',
        created_at: paidAt.toISOString(),
      }))
    if (othEntries.length > 0) addOthRecords(othEntries)

    addToHistory({
      id: `hist_${Date.now()}`,
      order_number: orderNum,
      table_label: bill?.tableLabel || 'Walk-in',
      waiter: bill?.waiter || '—',
      cashier: user?.full_name || '—',
      items: allCartItems,
      subtotal, vat, total,
      total_savings: totalSavings,
      pay_method: payMethod,
      cash_given: cashGiven,
      change: cashGiven > 0 ? Math.max(0, cashGiven - total) : 0,
      note: billNote.trim(),
      paid_at: paidAt,
      comp_reversals: compRemovedLog.length > 0 ? compRemovedLog.map(r => ({
        itemName: r.itemName,
        price: r.price,
        qty: r.qty,
        originalReason: r.originalReason,
        originalApprover: r.originalApprover,
        reverseReason: r.reverseReason,
        reversedBy: r.reversedBy,
        reversedAt: r.reversedAt.toISOString(),
      })) : undefined,
    })

    setReceipt({
      items: allCartItems,
      compItems: { ...compItems },
      allKeys: [...allKeys],
      subtotal, vat, total, totalSavings, payMethod, cashGiven,
      change: cashGiven > 0 ? Math.max(0, cashGiven - total) : 0,
      date: paidAt,
      order_number: orderNum,
      note: billNote.trim(),
      compTotal,
      compCount,
    })
    setCompItems({})
    setCompRemovedLog([])
  }

  // ── Receipt view ─────────────────────────────────────────────────────────────
  if (receipt) {
    return (
      <div className="max-w-sm mx-auto">
        <Card>
          <div className="text-center pb-4 border-b-2 border-dashed border-gray-200 dark:border-gray-600 mb-4">
            <div className="text-base font-bold text-gray-900 dark:text-white">{company.name}</div>
            <div className="text-xs text-gray-400">{company.address}</div>
            <div className="text-xs text-gray-400 mt-1">
              {receipt.date.toLocaleDateString()} {receipt.date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex justify-center gap-2 mt-2">
              <Badge color="green" dot>Paid</Badge>
              <Badge color="indigo">#{receipt.order_number}</Badge>
            </div>

          </div>
          {receipt.items.map((item, i) => {
            const disc = Number(item.discount_pct||0)
            const key = receipt.allKeys?.[i]
            const comped = key && receipt.compItems?.[key]
            const lineTotal = comped ? 0 : item.price * (1 - disc/100) * item.qty
            return (
            <div key={i} className={`flex justify-between text-sm py-1.5 border-b border-gray-100 dark:border-gray-700 ${comped ? 'opacity-70' : ''}`}>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-gray-700 dark:text-gray-300 ${comped ? 'line-through' : ''}`}>{item.name_en} ×{item.qty}</span>
                  {comped && <span className="text-[9px] font-extrabold px-1 py-0.5 rounded bg-amber-500 text-white tracking-widest">COMP</span>}
                </div>
                {disc > 0 && !comped && <div className="text-xs text-rose-400">-{disc}% discount</div>}
                {comped && <div className="text-xs text-amber-600 dark:text-amber-400">{receipt.compItems[key].reason}</div>}
              </div>
              <span className={`font-medium ${comped ? 'text-amber-600 dark:text-amber-400' : 'text-gray-800 dark:text-gray-200'}`}>
                {comped ? 'COMP' : `€${lineTotal.toFixed(2)}`}
              </span>
            </div>
            )
          })}
          <Divider />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>€{receipt.subtotal.toFixed(2)}</span></div>
            {receipt.totalSavings > 0 && <div className="flex justify-between text-rose-500 font-semibold"><span>Discounts saved</span><span>-€{receipt.totalSavings.toFixed(2)}</span></div>}
            {receipt.compCount > 0 && <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold"><span>🎁 Comp ({receipt.compCount} item{receipt.compCount !== 1 ? 's' : ''})</span><span>−€{receipt.compTotal.toFixed(2)}</span></div>}
            <div className="flex justify-between text-gray-500"><span>VAT {company.vat_rate}%</span><span>€{receipt.vat.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base text-gray-900 dark:text-white pt-2 border-t-2 border-gray-200 dark:border-gray-600">
              <span>Total</span><span>€{receipt.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 capitalize"><span>Payment</span><span>{receipt.payMethod}</span></div>
            {receipt.note && (
              <div className="mt-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1.5">
                📝 {receipt.note}
              </div>
            )}
            {receipt.change > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Change</span><span>€{receipt.change.toFixed(2)}</span>
              </div>
            )}
          </div>
          {/* Barcode */}
          <div className="flex flex-col items-center mt-5 mb-3">
            <div className="text-2xl tracking-widest font-mono text-gray-700 dark:text-gray-300">▌▌▐▌▌▐▌▐▌▌▐</div>
            <div className="text-xs text-gray-400 mt-1 font-mono">#{receipt.order_number}</div>
          </div>
          <div className="text-center text-xs text-gray-400 mb-5 italic">{company.receipt_footer}</div>
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="primary" onClick={() => alert('Sending to printer...')}>Print</Btn>
            <Btn onClick={() => alert('Share via email/WhatsApp...')}>Share</Btn>
          </div>
          <Btn variant="success" fullWidth className="mt-2" onClick={() => {
            setReceipt(null); setCart([]); setBillItems([]); setPayMethod(null); setCashGiven(0); setLoadedBillId(null); setMobileBillTab('menu'); setBillNote(''); setCompItems({}); setCompRemovedLog([])
          }}>
            New Sale
          </Btn>
        </Card>
      </div>
    )
  }

  // ── Main POS layout ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">

    {/* Mobile tab bar - hidden on desktop */}
    <div className="flex gap-2 mb-3 lg:hidden">
      <button onClick={() => setMobileBillTab('menu')}
        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${mobileBillTab==='menu' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800'}`}>
        Menu
      </button>
      <button onClick={() => setMobileBillTab('cart')}
        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all relative ${mobileBillTab==='cart' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800'}`}>
        Cart{allCartItems.length > 0 ? ` (${allCartItems.reduce((s,i)=>s+i.qty,0)})` : ''}
      </button>
    </div>

    <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-160px)] min-h-0">

      {/* ── LEFT: Product browser ── */}
      <div className={`flex-1 flex flex-col min-w-0 gap-3 min-h-0 ${mobileBillTab !== 'menu' ? 'hidden lg:flex' : ''}`}>

        {/* Search row */}
        <div className="flex gap-2">
          {/* Text / code search */}
          <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, code (M001, S002…)"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveCat('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activeCat === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}
          >All Items ({menuItems.filter(m => m.available).length})
          </button>
          {menuCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${activeCat === cat.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}
            >
              {cat.name_en} ({menuItems.filter(m => m.category_id === cat.id && m.available).length})
            </button>
          ))}
        </div>

        {/* Product grid — professional text tiles */}
        <div className="flex-1 overflow-y-auto">
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <div className="text-sm font-medium">No items found</div>
              <div className="text-xs mt-1">Try a different search or category</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 pb-2">
              {visibleItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => openBillItemModal(item)}
                  className={`relative rounded-xl border-2 p-3 text-left transition-all active:scale-95 cursor-pointer
                    ${'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">€{item.price.toFixed(2)}</span>
                  </div>
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-tight">{item.name_en}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{item.code}</div>
                  {cart.find(c => c.id === item.id) && (
                    <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                      {cart.find(c => c.id === item.id).qty}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart + Payment ── */}
      <div className={`w-full lg:w-80 flex-shrink-0 flex flex-col gap-3 ${mobileBillTab !== 'cart' ? 'hidden lg:flex lg:flex-col' : ''}`}>

        {/* Bill / Cart */}
        <Card className="flex flex-col h-[38rem] lg:h-auto lg:flex-1 lg:min-h-0 !p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/60 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <span className="text-sm">🧾</span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-none">Current Bill</h2>
                {loadedBillId
                  ? <div className="text-xs text-indigo-500 font-semibold mt-0.5">{openBills.find(b => b.id === loadedBillId)?.tableLabel}</div>
                  : preloadLabel
                    ? <div className="text-xs text-indigo-500 font-semibold mt-0.5">{preloadLabel}</div>
                    : <div className="text-xs text-gray-400 mt-0.5">Walk-in / Direct sale</div>
                }
              </div>
            </div>
            <div className="flex items-center gap-2">
              {allCartItems.length > 0 && (
                <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                  {allCartItems.reduce((s, i) => s + i.qty, 0)} items
                </span>
              )}
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-rose-400 hover:text-rose-600 font-semibold transition-colors">Clear extras</button>
              )}
            </div>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2 space-y-1">
            {allCartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
                  <span className="text-2xl">🛒</span>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-400 dark:text-gray-500">Bill is empty</div>
                  <div className="text-xs text-gray-300 dark:text-gray-600 mt-1">Load an open bill or add items from the menu</div>
                </div>
              </div>
            ) : (
            <>
                {/* --- From Order section (grouped by round) --- */}
                {billItems.length > 0 && (() => {
                  const rounds = [...new Set(billItems.map(i => i.round || 1))].sort((a,b) => a-b)
                  return rounds.map(roundNum => {
                    const roundItems = billItems.map((item, idx) => ({ item, idx })).filter(({ item }) => (item.round || 1) === roundNum)
                    const roundLabel = roundNum === 1 ? 'Round 1' : `Round ${roundNum}`
                    const roundColor = roundNum === 1 ? 'text-gray-400' : 'text-indigo-500'
                    const lineColor  = roundNum === 1 ? 'bg-gray-100 dark:bg-gray-700' : 'bg-indigo-100 dark:bg-indigo-900/30'
                    return (
                      <div key={roundNum}>
                        <div className="flex items-center gap-2 pt-1 pb-1.5">
                          <div className={`text-xs font-bold uppercase tracking-wider ${roundColor}`}>{roundLabel}</div>
                          <div className={`flex-1 h-px ${lineColor}`}></div>
                          <span className="text-xs text-gray-400">{roundItems.reduce((s,{item})=>s+item.qty,0)} items</span>
                        </div>
                        {roundItems.map(({ item, idx: i }) => {
                          const key = itemKey('bill', i)
                          const comped = isComped(key)
                          return (
                          <div key={`bill-${i}`} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${comped ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50' : roundNum === 1 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-indigo-50/50 dark:bg-indigo-900/10'}`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <div className={`text-xs font-semibold truncate ${comped ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{item.name_en}</div>
                                {comped && <span className="text-[9px] font-extrabold px-1 py-0.5 rounded bg-amber-500 text-white tracking-widest">COMP</span>}
                              </div>
                              {comped
                                ? <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 truncate">✓ {compItems[key]?.reason} · {compItems[key]?.approvedBy}</div>
                                : <div className="text-xs text-gray-400 mt-0.5">€{item.price.toFixed(2)} each</div>
                              }
                            </div>
                            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                              <button onClick={() => changeBillItemQty(i, -1)} className="w-7 h-7 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold text-sm transition-colors">−</button>
                              <span className="text-xs font-extrabold px-2 text-gray-800 dark:text-gray-200">{item.qty}</span>
                              <button onClick={() => changeBillItemQty(i, 1)} className="w-7 h-7 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-bold text-sm transition-colors">+</button>
                            </div>
                            <span className={`text-xs font-bold w-14 text-right flex-shrink-0 ${comped ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                              €{(item.price * (1 - Number(item.discount_pct || 0) / 100) * item.qty).toFixed(2)}
                            </span>
                            <button
                              onClick={() => comped ? openReverseDialog(key, item.name_en, item.price, item.qty) : openCompDialog(key, item.name_en, item.price, item.qty)}
                              title={comped ? 'Reverse Comp' : 'Mark as Comp (On the House)'}
                              className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs flex-shrink-0 transition-colors font-bold ${comped ? 'bg-amber-400 text-white hover:bg-rose-500' : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                            >🎁</button>
                            <button onClick={() => removeBillItem(i)} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-xs flex-shrink-0">✕</button>
                          </div>
                          )
                        })}
                      </div>
                    )
                  })
                })()}

                {/* --- Cashier Additions section (editable) --- */}
                {cart.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 pt-2 pb-1.5">
                      <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider">+ Added by Cashier</div>
                      <div className="flex-1 h-px bg-indigo-100 dark:bg-indigo-900/30"></div>
                    </div>
                    {cart.map(item => {
                      const key = itemKey('cart', item.id)
                      const comped = isComped(key)
                      return (
                      <div key={item.id} className={`px-3 py-2 rounded-xl border transition-colors ${comped ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50' : 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30'}`}>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <div className={`text-xs font-semibold truncate ${comped ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{item.name_en}</div>
                              {comped && <span className="text-[9px] font-extrabold px-1 py-0.5 rounded bg-amber-500 text-white tracking-widest">COMP</span>}
                            </div>
                            {comped
                              ? <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 truncate">✓ {compItems[key]?.reason} · {compItems[key]?.approvedBy}</div>
                              : <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">€{item.price.toFixed(2)} each</div>
                            }
                          </div>
                          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                            <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold text-sm transition-colors">−</button>
                            <span className="text-xs font-extrabold px-2 text-gray-800 dark:text-gray-200">{item.qty}</span>
                            <button onClick={() => changeQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-bold text-sm transition-colors">+</button>
                          </div>
                          <span className={`text-xs font-extrabold w-14 text-right ${comped ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                            €{(item.price * (1 - Number(item.discount_pct || 0) / 100) * item.qty).toFixed(2)}
                          </span>
                          {/* Comp toggle */}
                          <button
                            onClick={() => comped ? openReverseDialog(key, item.name_en, item.price, item.qty) : openCompDialog(key, item.name_en, item.price, item.qty)}
                            title={comped ? 'Reverse Comp' : 'Mark as Comp (On the House)'}
                            className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs flex-shrink-0 transition-colors font-bold ${comped ? 'bg-amber-400 text-white hover:bg-rose-500' : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                          >🎁</button>
                          <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-xs">✕</button>
                        </div>
                      </div>
                      )
                    })}
                  </>
                )}

            {/* Bill note — always visible */}
            <div className="pt-2">
              <textarea
                value={billNote}
                onChange={e => setBillNote(e.target.value)}
                placeholder="Add a note for this bill… (allergy, special request)"
                rows={2}
                className="w-full text-xs px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
              />
            </div>
          </>
          )}
          </div>

          {/* Totals footer — only when bill has items */}
          {allCartItems.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700/60 px-4 py-2 flex-shrink-0 space-y-1 bg-gray-50 dark:bg-gray-800/60">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Subtotal</span><span>€{subtotal.toFixed(2)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between text-xs text-rose-500 font-semibold">
                <span>Discounts</span><span>−€{totalSavings.toFixed(2)}</span>
              </div>
            )}
            {compCount > 0 && (
              <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400 font-semibold">
                <span>🎁 Comp ({compCount} item{compCount !== 1 ? 's' : ''})</span>
                <span>−€{compTotal.toFixed(2)}</span>
              </div>
            )}
            {compRemovedLog.length > 0 && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/40 px-3 py-2 space-y-1.5 mt-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-500 text-white tracking-widest">REVERSED</span>
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">{compRemovedLog.length} comp{compRemovedLog.length !== 1 ? 's' : ''} removed this session</span>
                </div>
                {compRemovedLog.map((r, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 truncate">↩ {r.itemName}</div>
                      <div className="text-[9px] text-rose-500 dark:text-rose-400 truncate">{r.reverseReason} · {r.reversedBy}</div>
                    </div>
                    <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300 flex-shrink-0">+€{(r.price * r.qty).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-400">
              <span>VAT {company.vat_rate}%</span><span>€{vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Total</span>
              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">€{total.toFixed(2)}</span>
            </div>
          </div>
          )}

          {/* Confirm + Cancel buttons — only when bill has items */}
          {allCartItems.length > 0 && (
          <div className="px-3 pb-3 pt-2 flex-shrink-0 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowPayModal(true)}
                className="py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-sm transition-all"
              >
                Confirm
              </button>
              <button
                onClick={() => { setShowSplitModal(true); setSplitCount(2); setSplitPaid({}); setSplitPayMethods({}); setSplitCashGiven({}); }}
                className="py-3 rounded-xl text-sm font-bold bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 active:scale-[0.98] text-blue-700 dark:text-blue-300 transition-all"
              >
                ✂ Split
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowShopModal(true)}
                className="py-3 rounded-xl text-sm font-bold bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 active:scale-[0.98] text-indigo-700 dark:text-indigo-300 transition-all"
              >
                Shop
              </button>
              <button
                onClick={() => { clearLoadedBill(); setPayMethod(null); setCashGiven(0); }}
                className="py-3 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
          )}
        </Card>

      </div>
    </div>

    {/* ── Comp (OTH) Reason Dialog ───────────────────────────────────────────── */}
    {compDialog && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setCompDialog(null)}>
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎁</span>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Mark as Comp</h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium truncate max-w-[200px]">{compDialog.itemName}</p>
              </div>
            </div>
            <button onClick={() => setCompDialog(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
          </div>

          {/* Item summary */}
          <div className="mx-5 mt-4 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Comp value</div>
              <div className="text-lg font-extrabold text-amber-700 dark:text-amber-300">€{(compDialog.price * compDialog.qty).toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">×{compDialog.qty} @ €{compDialog.price.toFixed(2)}</div>
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">Will not be charged</div>
            </div>
          </div>

          {/* Reason */}
          <div className="px-5 pt-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Reason <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {COMP_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setCompReason(r)}
                  className={`text-xs font-semibold px-2.5 py-2 rounded-xl border-2 text-left transition-all ${compReason === r ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-amber-300'}`}
                >{r}</button>
              ))}
            </div>
          </div>

          {/* Approved By */}
          <div className="px-5 pb-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Approved By</label>
            <input
              value={compApprover}
              onChange={e => setCompApprover(e.target.value)}
              placeholder={`Default: ${user?.full_name || 'Current user'}`}
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 grid grid-cols-2 gap-2">
            <button
              onClick={() => setCompDialog(null)}
              className="py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >Cancel</button>
            <button
              onClick={confirmComp}
              disabled={!compReason}
              className="py-3 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all active:scale-[0.98]"
            >Confirm Comp</button>
          </div>
        </div>
      </div>
    )}

    {/* ── Comp Reversal Confirmation Dialog ────────────────────────────────────── */}
    {reverseDialog && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setReverseDialog(null)}>
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-rose-50 dark:bg-rose-900/20">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">↩️</span>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Reverse Comp</h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium truncate max-w-[200px]">{reverseDialog.itemName}</p>
              </div>
            </div>
            <button onClick={() => setReverseDialog(null)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
          </div>

          {/* Original comp info */}
          <div className="mx-5 mt-4 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Original comp</div>
              <div className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-0.5">{reverseDialog.originalReason || '—'}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">by {reverseDialog.originalApprover || '—'}</div>
              <div className="text-sm font-extrabold text-amber-700 dark:text-amber-300">€{(reverseDialog.price * reverseDialog.qty).toFixed(2)}</div>
            </div>
          </div>

          {/* Bill impact notice */}
          <div className="mx-5 mt-3 flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl px-4 py-2.5">
            <span className="text-rose-500 text-sm">⚠️</span>
            <div className="text-xs text-rose-700 dark:text-rose-300 font-semibold">
              €{(reverseDialog.price * reverseDialog.qty).toFixed(2)} will be <span className="underline">added back</span> to the bill
            </div>
          </div>

          {/* Reversal reason */}
          <div className="px-5 pt-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Reason for Reversal <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {REVERSE_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReverseReason(r)}
                  className={`text-xs font-semibold px-2.5 py-2 rounded-xl border-2 text-left transition-all ${reverseReason === r ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-rose-300'}`}
                >{r}</button>
              ))}
            </div>
          </div>

          {/* Authorised By */}
          <div className="px-5 pb-4">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Authorised By</label>
            <input
              value={reverseApprover}
              onChange={e => setReverseApprover(e.target.value)}
              placeholder={`Default: ${user?.full_name || 'Current user'}`}
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          {/* Actions */}
          <div className="px-5 pb-5 grid grid-cols-2 gap-2">
            <button
              onClick={() => setReverseDialog(null)}
              className="py-3 rounded-xl text-sm font-bold border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >Keep Comp</button>
            <button
              onClick={confirmReversal}
              disabled={!reverseReason}
              className="py-3 rounded-xl text-sm font-bold bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all active:scale-[0.98]"
            >Reverse Comp</button>
          </div>
        </div>
      </div>
    )}

    {/* ── Shop / Owner Account Confirmation Modal ── */}
    {showShopModal && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowShopModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Owner's Account</h3>
            <button onClick={() => setShowShopModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-3 mb-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Bill Total</div>
                <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">€{total.toFixed(2)}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Charge this bill to the <span className="font-bold text-gray-900 dark:text-white">shop owner's account</span>?</p>
            <p className="text-xs text-gray-400 mb-5">This will be recorded as an internal shop payment and finalize the bill.</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowShopModal(false)}
                className="py-3 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowShopModal(false)
                  setPayMethod('shop')
                  setTimeout(() => {
                    if (loadedBillId) finalizeBill(loadedBillId)
                    const orderNum = Math.floor(Math.random() * 900) + 100
                    setReceipt({
                      items: allCartItems,
                      subtotal, vat, total, totalSavings,
                      payMethod: 'Shop Account',
                      cashGiven: 0,
                      change: 0,
                      date: new Date(),
                      order_number: orderNum,
                      note: billNote.trim(),
                    })
                  }, 0)
                }}
                className="py-3 rounded-xl text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white transition-all"
              >
                ✓ Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ── Split Bill Modal ── */}
    {showSplitModal && (() => {
      const personColors = ['bg-rose-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-purple-500','bg-pink-500']
      const personLabels = ['Person 1','Person 2','Person 3','Person 4','Person 5','Person 6']
      const persons = Array.from({ length: splitCount }, (_, i) => i)
      const perPerson = total / splitCount
      const allPaid = persons.every(pi => splitPaid[pi])

      function closeSplit() {
        setShowSplitModal(false)
        setSplitPaid({})
        setSplitPayMethods({})
        setSplitCashGiven({})
      }

      function finalizeSplitBill() {
        const orderNum = Math.floor(Math.random() * 900) + 100
        const bill = loadedBillId ? openBills.find(b => b.id === loadedBillId) : null
        const paidAt = new Date()
        if (loadedBillId) finalizeBill(loadedBillId)
        if (preloadOrderId) {
          setLiveOrders(prev => prev.map(o => o.id === preloadOrderId ? { ...o, status: 'paid' } : o))
          setPreloadOrderId(null)
        }
        addToHistory({
          id: `hist_${Date.now()}`,
          order_number: orderNum,
          table_label: bill?.tableLabel || 'Walk-in',
          waiter: bill?.waiter || '—',
          cashier: user?.full_name || '—',
          items: allCartItems,
          subtotal, vat, total,
          total_savings: totalSavings,
          pay_method: 'Split',
          cash_given: 0,
          change: 0,
          note: billNote.trim(),
          paid_at: paidAt,
        })
        setReceipt({
          items: allCartItems,
          subtotal, vat, total, totalSavings,
          payMethod: 'Split',
          cashGiven: 0,
          change: 0,
          date: paidAt,
          order_number: orderNum,
          note: billNote.trim(),
        })
        closeSplit()
      }

      function markPaid(pi) {
        const method = splitPayMethods[pi] || 'cash'
        const cash = Number(splitCashGiven[pi] || 0)
        if (method === 'cash' && cash < perPerson) return
        setSplitPaid(p => ({ ...p, [pi]: true }))
      }

      return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeSplit}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">✂ Split Bill</h3>
                <div className="text-xs text-gray-400 mt-0.5">Total: <span className="font-bold text-gray-700 dark:text-gray-300">€{total.toFixed(2)}</span></div>
              </div>
              <button onClick={closeSplit} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {/* Number of people */}
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Number of people</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSplitCount(c => Math.max(2, c - 1))} className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-600 font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-300">−</button>
                  <span className="text-lg font-extrabold text-gray-900 dark:text-white w-5 text-center">{splitCount}</span>
                  <button onClick={() => setSplitCount(c => Math.min(6, c + 1))} className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center hover:bg-blue-200">+</button>
                </div>
              </div>

              {/* Per-person payment panels */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payments</div>
                {persons.map(pi => {
                  const paid = splitPaid[pi]
                  const method = splitPayMethods[pi] || 'cash'
                  const cash = Number(splitCashGiven[pi] || 0)
                  const change = Math.max(0, cash - perPerson)
                  const canPay = method === 'card' || cash >= perPerson
                  return (
                    <div key={pi} className={`rounded-xl border-2 transition-all ${paid ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-750'}`}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className={`w-8 h-8 rounded-full ${personColors[pi]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{pi + 1}</div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{personLabels[pi]}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-extrabold text-gray-900 dark:text-white">€{perPerson.toFixed(2)}</div>
                          {paid && <div className="text-xs text-emerald-600 font-bold">✓ Paid</div>}
                        </div>
                      </div>
                      {!paid && (
                        <div className="px-4 pb-3 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => setSplitPayMethods(p => ({ ...p, [pi]: 'cash' }))}
                              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${method === 'cash' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
                            >
                              💵 Cash
                            </button>
                            <button
                              onClick={() => setSplitPayMethods(p => ({ ...p, [pi]: 'card' }))}
                              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${method === 'card' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
                            >
                              💳 Card
                            </button>
                          </div>
                          {method === 'cash' && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 flex-shrink-0">Cash Given €</span>
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={splitCashGiven[pi] || ''}
                                onChange={e => setSplitCashGiven(p => ({ ...p, [pi]: e.target.value }))}
                                placeholder={perPerson.toFixed(2)}
                                className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1 text-sm font-bold text-gray-900 dark:text-white outline-none"
                              />
                              {cash >= perPerson && cash > 0 && (
                                <span className="text-xs text-emerald-600 font-bold flex-shrink-0">Change €{change.toFixed(2)}</span>
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => markPaid(pi)}
                            disabled={!canPay}
                            className={`w-full py-2 rounded-xl text-sm font-bold transition-all ${canPay ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98]' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                          >
                            ✓ Mark Paid
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
              {allPaid ? (
                <button
                  onClick={finalizeSplitBill}
                  className="w-full py-3.5 rounded-xl text-sm font-extrabold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow transition-all"
                >
                  ✓ Finalize — All Paid
                </button>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{persons.filter(pi => splitPaid[pi]).length} of {splitCount} paid</span>
                  <div className="flex gap-0.5">
                    {persons.map(pi => (
                      <div key={pi} className={`w-3 h-3 rounded-full ${splitPaid[pi] ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    })()}

    {/* ── Item Modifier Modal (Billing) ── */}
    {billItemModal && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setBillItemModal(null)}>
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-700">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-2xl">{billItemModal.emoji}</span>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{billItemModal.name_en}</h2>
              </div>
              <div className="text-sm text-indigo-600 font-bold">€{billItemModal.price.toFixed(2)}</div>
            </div>
            <button onClick={() => setBillItemModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">✕</button>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Quantity</div>
              <div className="flex items-center gap-3">
                <button onClick={() => setBillModalQty(q => Math.max(1, q - 1))} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600">−</button>
                <span className="text-xl font-bold text-gray-900 dark:text-white w-8 text-center">{billModalQty}</span>
                <button onClick={() => setBillModalQty(q => q + 1)} className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-bold text-lg flex items-center justify-center hover:bg-indigo-200">+</button>
                <span className="text-sm text-gray-400 ml-2">= €{(billItemModal.price * billModalQty).toFixed(2)}</span>
              </div>
            </div>
            {(billItemModal.modifierGroups || []).map(group => (
              <div key={group.label}>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {group.label} {group.multi ? <span className="normal-case font-normal text-gray-400">(select multiple)</span> : <span className="normal-case font-normal text-gray-400">(choose one)</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.choices.map(choice => {
                    const active = (billModalSelections[group.label] || []).includes(choice)
                    return (
                      <button key={choice} onClick={() => toggleBillMod(group, choice)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300 bg-white dark:bg-gray-700'}`}>
                        {active && '✓ '}{choice}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <div>
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Additional note</div>
              <textarea
                value={billModalNote}
                onChange={e => setBillModalNote(e.target.value)}
                placeholder="e.g. No onion, allergen request…"
                rows={2}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={() => setBillItemModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Cancel</button>
            <button onClick={addToCartWithMods} className="flex-1 py-2.5 rounded-xl text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white transition-all">
              Add {billModalQty > 1 ? `×${billModalQty}` : ''} to Bill — €{(billItemModal.price * billModalQty).toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Add Food Modal ── */}
    {showAddModal && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={() => setShowAddModal(false)}>
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Add Food Items</h3>
            <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold">✕</button>
          </div>
          {/* Search */}
          <div className="px-4 pt-3 pb-2 flex-shrink-0">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                autoFocus
                value={modalSearch}
                onChange={e => setModalSearch(e.target.value)}
                placeholder="Search items…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {/* Category tabs */}
          <div className="flex gap-1.5 px-4 pb-2 flex-wrap flex-shrink-0">
            <button onClick={() => setModalCat('all')} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${modalCat === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}>All</button>
            {menuCategories.map(cat => (
              <button key={cat.id} onClick={() => setModalCat(cat.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${modalCat === cat.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}>{cat.name_en}</button>
            ))}
          </div>
          {/* Product grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {menuItems.filter(item => {
                if (!item.available) return false
                const q = modalSearch.trim().toLowerCase()
                const matchCat = modalCat === 'all' || item.category_id === modalCat
                const matchSearch = !q || item.name_en.toLowerCase().includes(q) || item.code?.toLowerCase().includes(q)
                return matchCat && matchSearch
              }).map(item => {
                const inCart = cart.find(c => c.id === item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => { setShowAddModal(false); openBillItemModal(item) }}
                    className="relative rounded-xl border-2 p-3 text-left transition-all active:scale-95 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  >
                    <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">€{item.price.toFixed(2)}</div>
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-tight">{item.name_en}</div>
                    {inCart && (
                      <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">{inCart.qty}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          {/* Done button */}
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full py-3 rounded-xl text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white transition-all"
            >
              {cart.length > 0 ? `Done — ${cart.reduce((s,i)=>s+i.qty,0)} item${cart.reduce((s,i)=>s+i.qty,0)!==1?'s':''} added` : 'Done'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Payment Modal ── */}
    {showPayModal && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto">
          {/* Modal header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">💳 Payment</h3>
            <button
              onClick={() => { setShowPayModal(false); setPayMethod(null); setCashGiven(0); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold"
            >✕</button>
          </div>

          {/* Total to pay */}
          <div className="px-5 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/40">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Total to Pay</span>
              <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">€{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Payment method */}
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Method</div>
              <div className="grid grid-cols-3 gap-2">
                {[['💵', 'Cash', 'cash'], ['💳', 'Card', 'card'], ['📱', 'Mobile', 'mobile']].map(([icon, label, val]) => (
                  <button
                    key={val}
                    onClick={() => setPayMethod(val)}
                    className={`py-3 rounded-xl border-2 text-center transition-all ${
                      payMethod === val
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'
                    }`}
                  >
                    <div className="text-xl">{icon}</div>
                    <div className={`text-xs font-bold mt-1 ${payMethod === val ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>{label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash denominations */}
            {payMethod === 'cash' && (
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cash Tendered</div>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {[5, 10, 20, 50, 100, 200].map(a => (
                    <button
                      key={a}
                      onClick={() => setCashGiven(a)}
                      className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                        cashGiven === a
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:border-indigo-300'
                      }`}
                    >
                      €{a}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2.5">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Change due</span>
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">€{Math.max(0, cashGiven - total).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Confirm button */}
            <button
              disabled={!payMethod}
              onClick={() => { confirmPayment(); setShowPayModal(false); }}
              className="w-full py-3.5 rounded-xl text-sm font-extrabold transition-all bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-md shadow-emerald-200 dark:shadow-none disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {!payMethod ? 'Select a payment method' : '✅ Confirm & Print Receipt'}
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export function Inventory() {
  const { inventoryItems, setInventoryItems } = useApp()
  const BLANK = { id:'', item_name:'', quantity:'', unit:'kg', min_stock:'', category:'', supplier:'' }
  const [modal, setModal]   = useState(null)   // null | { mode:'add'|'edit' }
  const [form, setForm]     = useState(BLANK)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [adjustId, setAdjustId] = useState(null)  // item being adjusted
  const [adjustDelta, setAdjustDelta] = useState('')
  const [search, setSearch] = useState('')

  const visible = inventoryItems.filter(i => !search || i.item_name.toLowerCase().includes(search.toLowerCase()))

  function openAdd() { setForm({ ...BLANK, id: `inv${Date.now()}` }); setModal({ mode:'add' }) }
  function openEdit(item) { setForm({ ...item }); setModal({ mode:'edit' }) }
  function closeModal() { setModal(null) }

  function saveItem() {
    if (!form.item_name.trim()) return
    const item = { ...form, quantity: parseFloat(form.quantity)||0, min_stock: parseFloat(form.min_stock)||0 }
    if (modal.mode === 'add') {
      setInventoryItems(p => [...p, item])
    } else {
      setInventoryItems(p => p.map(i => i.id === item.id ? item : i))
    }
    closeModal()
  }

  function deleteItem(id) {
    setInventoryItems(p => p.filter(i => i.id !== id))
    setConfirmDelete(null)
  }

  function applyAdjust(id) {
    const delta = parseFloat(adjustDelta)
    if (isNaN(delta)) return
    setInventoryItems(p => p.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i))
    setAdjustId(null)
    setAdjustDelta('')
  }

  const lowCount = inventoryItems.filter(i => i.quantity < i.min_stock).length

  return (
    <div>
      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl w-full sm:max-w-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Delete stock item?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">"{confirmDelete.item_name}" will be removed from inventory.</p>
            <div className="flex gap-2">
              <Btn fullWidth onClick={() => setConfirmDelete(null)}>Cancel</Btn>
              <Btn variant="danger" fullWidth onClick={() => deleteItem(confirmDelete.id)}>Delete</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">{modal.mode === 'add' ? 'Add Stock Item' : 'Edit Stock Item'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <Input label="Item Name" value={form.item_name} onChange={e => setForm(f=>({...f,item_name:e.target.value}))} placeholder="e.g. Olive Oil" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Current Quantity" type="number" min="0" step="0.01" value={form.quantity} onChange={e => setForm(f=>({...f,quantity:e.target.value}))} placeholder="0" />
                <Input label="Unit" value={form.unit} onChange={e => setForm(f=>({...f,unit:e.target.value}))} placeholder="kg / L / pcs" />
                <Input label="Min Stock Level" type="number" min="0" step="0.01" value={form.min_stock} onChange={e => setForm(f=>({...f,min_stock:e.target.value}))} placeholder="Reorder at this level" />
                <Input label="Category" value={form.category||''} onChange={e => setForm(f=>({...f,category:e.target.value}))} placeholder="e.g. Dairy, Meat, Produce" />
              </div>
              <Input label="Supplier (optional)" value={form.supplier||''} onChange={e => setForm(f=>({...f,supplier:e.target.value}))} placeholder="Supplier name" />
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <Btn fullWidth onClick={closeModal}>Cancel</Btn>
              <Btn variant="success" fullWidth onClick={saveItem} disabled={!form.item_name.trim()}>Save</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {lowCount > 0 && (
            <span className="px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold">
              ⚠ {lowCount} item{lowCount!==1?'s':''} low on stock
            </span>
          )}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stock…" className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40" />
        </div>
        <Btn variant="primary" size="sm" onClick={openAdd}>+ Add Item</Btn>
      </div>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700/60">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qty</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Unit</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Min Stock</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Level</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(item => {
              const pct = item.min_stock > 0 ? Math.min(100, Math.round((item.quantity / item.min_stock) * 100)) : 100
              const barColor = pct < 50 ? 'bg-red-500' : pct < 100 ? 'bg-amber-400' : 'bg-emerald-500'
              const statusColor = pct < 50 ? 'red' : pct < 100 ? 'yellow' : 'green'
              return (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{item.item_name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell">{item.category || '—'}</td>
                  <td className="px-4 py-3">
                    {adjustId === item.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number" step="0.01"
                          value={adjustDelta}
                          onChange={e => setAdjustDelta(e.target.value)}
                          placeholder="±qty"
                          autoFocus
                          className="w-16 px-2 py-1 text-xs rounded-lg border border-indigo-400 focus:outline-none text-gray-900 dark:text-white dark:bg-gray-700"
                        />
                        <button onClick={() => applyAdjust(item.id)} className="text-emerald-600 hover:text-emerald-700 text-xs font-bold">✓</button>
                        <button onClick={() => { setAdjustId(null); setAdjustDelta('') }} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                      </div>
                    ) : (
                      <span
                        className={`font-bold cursor-pointer hover:underline ${item.quantity < item.min_stock ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}
                        onClick={() => { setAdjustId(item.id); setAdjustDelta('') }}
                        title="Click to adjust quantity"
                      >
                        {item.quantity}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell">{item.unit}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden sm:table-cell">{item.min_stock}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                      <div className={`h-full rounded-full ${barColor}`} style={{width:`${pct}%`}} />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{pct}%</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={statusColor}>{pct<50?'Low':pct<100?'OK':'Good'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Btn size="sm" onClick={() => openEdit(item)}>Edit</Btn>
                      <Btn size="sm" variant="danger" onClick={() => setConfirmDelete(item)}>Delete</Btn>
                    </div>
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">No stock items found</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  )
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export function Reports() {
  const bars = [65,80,45,90,70,110,85,95,60,100,75,88,92,78]
  const maxBar = Math.max(...bars)
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="This month" value="€48,200" sub="+8% vs last month" />
        <StatCard label="Total orders" value="1,284" sub="avg €37.50 each" />
        <StatCard label="Top seller" value="Pasta Carbonara" sub="312 sold" />
        <StatCard label="Staff active" value="14" sub="All shifts covered" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-medium text-gray-900 dark:text-white mb-4">Daily sales — April</h2>
          <div className="flex items-end gap-1 h-28">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 bg-blue-500 dark:bg-blue-600 rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer min-w-0"
                style={{ height: `${(h / maxBar) * 100}%` }} title={`Apr ${i+1}: €${(h*40).toFixed(0)}`} />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">Apr 1</span>
            <span className="text-xs text-gray-400">Apr 14</span>
          </div>
        </Card>
        <Card>
          <h2 className="font-medium text-gray-900 dark:text-white mb-3">Top items this month</h2>
          {[['Pasta Carbonara',312,'€4,524'],['Grilled Sea Bass',198,'€4,356'],['Margherita Pizza',245,'€2,940'],['Tiramisu',289,'€2,023'],['House Wine',401,'€2,406']].map(([name,count,rev]) => (
            <div key={name} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{count}x</span>
                <span className="text-sm font-medium text-blue-600">{rev}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

// ─── Settings ─────────────────────────────────────────────────────────────────
// ── Nav Permission Manager ────────────────────────────────────────────────────
const NAV_MANAGER_ITEMS = [
  { key:'dashboard',     label:'Dashboard',     icon:'🏠', cat:'General' },
  { key:'notifications', label:'Notifications', icon:'🔔', cat:'General' },
  { key:'tables',        label:'Tables',        icon:'🍽️', cat:'Floor' },
  { key:'orderlist',     label:'Order List',    icon:'📃', cat:'Floor' },
  { key:'billing',       label:'Billing',       icon:'💰', cat:'Floor' },
  { key:'kitchen',       label:'Kitchen',       icon:'👨‍🍳', cat:'Floor' },
  { key:'bar',           label:'Bar',           icon:'🍸', cat:'Floor' },
  { key:'oth',           label:'OTH / Comps',   icon:'🎁', cat:'Floor' },
  { key:'history',       label:'History',       icon:'🕓', cat:'Reports' },
  { key:'reports',       label:'Reports',       icon:'📊', cat:'Reports' },
  { key:'supervisor',    label:'Supervisor',    icon:'👁️', cat:'Reports' },
  { key:'inventory',     label:'Inventory',     icon:'📦', cat:'Management' },
  { key:'menu',          label:'Menu',          icon:'🗂️', cat:'Management' },
  { key:'customers',     label:'Customers',     icon:'👤', cat:'Management' },
  { key:'users',         label:'Users',         icon:'👥', cat:'Management' },
  { key:'waiters',       label:'Waiters',       icon:'🧑‍🍽️', cat:'Management' },
  { key:'shifts',        label:'Shifts',        icon:'🗓️', cat:'Management' },
  { key:'settings',      label:'Settings',      icon:'⚙️', cat:'Admin' },
  { key:'audit',         label:'Audit Log',     icon:'🔒', cat:'Admin' },
  { key:'company',       label:'Company',       icon:'🏢', cat:'Admin' },
  { key:'receipts',      label:'Receipts',      icon:'🖨️', cat:'Other' },
  { key:'invoices',      label:'Invoices',      icon:'📄', cat:'Other' },
]

const MANAGED_ROLES = [
  { key:'superadmin', label:'Super Admin', color:'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  { key:'admin',      label:'Admin',       color:'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  { key:'owner',      label:'Owner',       color:'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  { key:'manager',    label:'Manager',     color:'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  { key:'supervisor', label:'Supervisor',  color:'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300' },
  { key:'cashier',    label:'Cashier',     color:'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' },
  { key:'waiter',     label:'Waiter',      color:'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' },
  { key:'cook',       label:'Cook',        color:'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
  { key:'bartender',  label:'Bartender',   color:'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' },
  { key:'supplier',   label:'Supplier',    color:'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' },
]

function NavManager() {
  const { navPermissions, setNavPermissions } = useApp()
  const [role, setRole] = useState('admin')

  const roleNav = navPermissions[role] || []
  const cats = [...new Set(NAV_MANAGER_ITEMS.map(i => i.cat))]

  function toggle(key) {
    const current = navPermissions[role] || []
    const updated = current.includes(key) ? current.filter(k => k !== key) : [...current, key]
    setNavPermissions({ ...navPermissions, [role]: updated })
  }

  function resetRole() {
    setNavPermissions({ ...navPermissions, [role]: [...(ROLE_NAV[role] || [])] })
  }

  const roleInfo = MANAGED_ROLES.find(r => r.key === role)

  return (
    <div className="space-y-4">
      {/* Role tabs */}
      <div className="flex flex-wrap gap-2">
        {MANAGED_ROLES.map(r => (
          <button key={r.key} onClick={() => setRole(r.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
              role === r.key
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : `border-transparent ${r.color} hover:border-gray-300 dark:hover:border-gray-500`
            }`}
          >{r.label}</button>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 px-1">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${roleInfo?.color}`}>{roleInfo?.label}</span>
        <span className="text-xs text-gray-400">{roleNav.length} pages enabled</span>
        <button onClick={resetRole} className="ml-auto text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors">
          Reset to default
        </button>
      </div>

      {/* Nav items grouped by category */}
      {cats.map(cat => {
        const items = NAV_MANAGER_ITEMS.filter(i => i.cat === cat)
        return (
          <div key={cat} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{cat}</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
              {items.map(item => {
                const isOn = roleNav.includes(item.key)
                return (
                  <div key={item.key} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base w-6 text-center">{item.icon}</span>
                      <span className={`text-sm font-medium ${isOn ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>{item.label}</span>
                    </div>
                    <button
                      onClick={() => toggle(item.key)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none ${isOn ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Settings() {
  const { company, setCompany, lang, user } = useApp()
  const [form, setForm] = useState({ ...company })
  const [settingsTab, setSettingsTab] = useState('general')
  const canManageNav = ['superadmin', 'admin'].includes(user?.role)
  function save() { setCompany(form); alert(t('settingsSaved', lang)) }

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-2 border-b border-gray-100 dark:border-gray-700 pb-0">
        {[
          { key: 'general', label: 'General' },
          ...(canManageNav ? [{ key: 'navigation', label: 'Navigation Access' }] : []),
        ].map(tb => (
          <button key={tb.key} onClick={() => setSettingsTab(tb.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              settingsTab === tb.key
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >{tb.label}</button>
        ))}
      </div>

      {settingsTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h2 className="font-medium text-gray-900 dark:text-white mb-4">Company details</h2>
            <Input label="Company name" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} />
            <Input label="Address" value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} />
            <Select label="Currency" value={form.currency} onChange={e => setForm(p=>({...p,currency:e.target.value}))}>
              <option value="EUR">EUR — Euro</option>
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — British Pound</option>
            </Select>
            <Input label="VAT rate (%)" type="number" value={form.vat_rate} onChange={e => setForm(p=>({...p,vat_rate:Number(e.target.value)}))} />
            <Textarea label="Receipt footer" value={form.receipt_footer} onChange={e => setForm(p=>({...p,receipt_footer:e.target.value}))} />
            <Btn variant="success" onClick={save}>Save Changes</Btn>
          </Card>
          <Card>
            <h2 className="font-medium text-gray-900 dark:text-white mb-4">System info</h2>
            <div className="space-y-2 text-sm">
              {[['System','Malta POS v1.0'],['Languages','English, Maltese, Italian'],['Database','Supabase (PostgreSQL)'],['VAT Region','Malta — 18%'],['Currency','EUR — Euro']].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">{k}</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {settingsTab === 'navigation' && canManageNav && (
        <div>
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Sidebar Navigation Access</h2>
            <p className="text-sm text-gray-400 mt-0.5">Control which pages each role can see in the sidebar. Changes take effect immediately.</p>
          </div>
          <NavManager />
        </div>
      )}
    </div>
  )
}

// ─── Company (Super Admin) ────────────────────────────────────────────────────
export function Company() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900 dark:text-white">All restaurants</h2>
        <Btn variant="primary" size="sm">+ Add Restaurant</Btn>
      </div>
      <Table headers={['Name','Location','Admin','Status','Action']}>
        {[['Bella Vista Malta','Valletta','admin@bellavista.mt','active'],['Sea View Bistro','Sliema','admin@seaview.mt','active'],['Gozo Kitchen','Victoria','admin@gozo.mt','pending']].map(([name,loc,admin,status]) => (
          <TR key={name}>
            <TD className="font-medium">{name}</TD>
            <TD>{loc}</TD>
            <TD className="text-blue-600">{admin}</TD>
            <TD><Badge color={statusColor(status)}>{status}</Badge></TD>
            <TD><Btn size="sm">Manage</Btn></TD>
          </TR>
        ))}
      </Table>
    </Card>
  )
}

// ─── Audit ────────────────────────────────────────────────────────────────────
export function Audit() {
  const logs = [
    {time:'14:32',user:'Maria G.',role:'waiter',action:'Created order #047',module:'Orders'},
    {time:'14:28',user:'John C.',role:'cashier',action:'Printed invoice #312',module:'Billing'},
    {time:'14:15',user:'Anna B.',role:'manager',action:'Created user account',module:'Users'},
    {time:'13:55',user:'Tony S.',role:'supplier',action:'Updated stock levels',module:'Inventory'},
    {time:'13:40',user:'Owner',role:'owner',action:'Approved 2 users',module:'Users'},
    {time:'13:20',user:'Sam V.',role:'supervisor',action:'Generated shift report',module:'Reports'},
  ]
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900 dark:text-white">Audit log</h2>
        <input placeholder="Search logs..." className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-40" />
      </div>
      <Table headers={['Time','User','Role','Action','Module']}>
        {logs.map((log,i) => (
          <TR key={i}>
            <TD>{log.time}</TD>
            <TD>{log.user}</TD>
            <TD><Badge color="gray">{log.role}</Badge></TD>
            <TD>{log.action}</TD>
            <TD>{log.module}</TD>
          </TR>
        ))}
      </Table>
    </Card>
  )
}

// ─── Notifications ────────────────────────────────────────────────────────────
export function Notifications() {
  const { notifications, markAllRead } = useApp()
  const typeColor = { warning:'yellow', error:'red', info:'blue', success:'green' }
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900 dark:text-white">Notifications</h2>
        <Btn size="sm" onClick={markAllRead}>Mark all read</Btn>
      </div>
      {notifications.map(n => (
        <div key={n.id} className={`flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 ${!n.is_read ? '' : 'opacity-60'}`}>
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-gray-300' : typeColor[n.type]==='yellow'?'bg-amber-400':typeColor[n.type]==='red'?'bg-red-500':'bg-blue-500'}`} />
          <div className="flex-1">
            <div className="text-sm text-gray-800 dark:text-gray-200">{n.message_en}</div>
            <div className="text-xs text-gray-400 mt-1">{n.module}</div>
          </div>
        </div>
      ))}
    </Card>
  )
}

// ─── Supervisor ───────────────────────────────────────────────────────────────
export function Supervisor() {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Staff on duty" value="8" sub="All present" />
        <StatCard label="Orders today" value="47" sub="8 active" />
        <StatCard label="Avg order time" value="18m" sub="Target: 20m" />
        <StatCard label="Issues flagged" value="1" sub="Late order T5" subColor="text-amber-500" />
      </div>
      <Card>
        <h2 className="font-medium text-gray-900 dark:text-white mb-3">Staff performance today</h2>
        <Table headers={['Name','Role','Orders','Avg time','Status']}>
          {[['Maria Galea','Waiter',12,'16m','on-duty'],['John Camilleri','Cashier',18,'4m','on-duty'],['Tony Farrugia','Cook',31,'14m','on-duty'],['Sam Vella','Waiter',9,'19m','break']].map(([n,r,o,time,s]) => (
            <TR key={n}>
              <TD><div className="flex items-center gap-2"><Avatar name={n} />{n}</div></TD>
              <TD>{r}</TD><TD>{o}</TD><TD>{time}</TD>
              <TD><Badge color={statusColor(s)}>{s}</Badge></TD>
            </TR>
          ))}
        </Table>
      </Card>
    </div>
  )
}

// ─── Shifts ───────────────────────────────────────────────────────────────────
export function Shifts() {
  const { clockRecords, user, users, clockIn, clockOut, isClockedIn, adminClockOut } = useApp()
  const [tab, setTab] = useState('today')
  const [now, setNow] = useState(new Date())
  const [histSearch, setHistSearch] = useState('')
  const [histDate, setHistDate] = useState('')
  const [forceOutConfirm, setForceOutConfirm] = useState(null)
  const [clockModal, setClockModal] = useState(null) // 'in' | 'out' | null
  const [clockPassword, setClockPassword] = useState('')
  const [clockError, setClockError] = useState('')

  const isManagement = ['superadmin','admin','owner','manager','supervisor'].includes(user?.role)

  // Live clock — fixed: useEffect not useState
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  const todayStr = now.toDateString()

  // Scope records by role
  const visibleRecords = isManagement
    ? clockRecords
    : clockRecords.filter(r => r.userId === user?.id)

  const todayRecords   = visibleRecords.filter(r => r.clockIn.toDateString() === todayStr)
  const activeNow      = todayRecords.filter(r => r.clockOut === null)
  const doneToday      = todayRecords.filter(r => r.clockOut !== null)

  // History = all records for this user (or all for management), sorted newest first
  const historyRecords = [...visibleRecords]
    .filter(r => {
      const q = histSearch.trim().toLowerCase()
      const matchName = !q || r.userName?.toLowerCase().includes(q) || r.role?.toLowerCase().includes(q)
      const matchDate = !histDate || r.clockIn.toISOString().startsWith(histDate)
      return matchName && matchDate
    })
    .sort((a, b) => b.clockIn - a.clockIn)

  function fmtTime(date) {
    if (!date) return '—'
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function fmtDuration(start, end) {
    const e = end || now
    const mins = Math.round((e - start) / 60000)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h ${m < 10 ? '0' : ''}${m}m`
  }

  function fmtDate(date) {
    return date.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' })
  }

  function openClockModal() {
    setClockModal(isClockedIn ? 'out' : 'in')
    setClockPassword('')
    setClockError('')
  }

  function handleClockConfirm() {
    const found = users.find(u => u.id === user.id && u.password === clockPassword)
    if (!found) { setClockError('Incorrect password. Please try again.'); return }
    if (clockModal === 'in') clockIn()
    else clockOut()
    setClockModal(null)
    setClockPassword('')
    setClockError('')
  }

  // Total hours worked today (completed shifts only)
  const totalMinsToday = doneToday.reduce((s, r) => s + Math.round((r.clockOut - r.clockIn) / 60000), 0)
  const totalHoursToday = `${Math.floor(totalMinsToday / 60)}h ${totalMinsToday % 60}m`

  // My open shift record
  const myOpenShift = clockRecords.find(r => r.userId === user?.id && r.clockOut === null)

  return (
    <div className="space-y-4">

      {/* My status card */}
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4 border-2 ${isClockedIn ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${isClockedIn ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
            {isClockedIn ? '🟢' : '⚫'}
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white text-sm">{user?.full_name}</div>
            {isClockedIn && myOpenShift ? (
              <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                On shift since {fmtTime(myOpenShift.clockIn)} · <span className="font-bold">{fmtDuration(myOpenShift.clockIn, null)}</span>
              </div>
            ) : (
              <div className="text-sm text-gray-400 dark:text-gray-500">Not clocked in today</div>
            )}
          </div>
        </div>
        <button
          onClick={openClockModal}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
            isClockedIn
              ? 'bg-rose-500 hover:bg-rose-600 text-white'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {isClockedIn ? '⏹ Clock Out' : '▶ Clock In'}
        </button>
      </div>

      {/* Stats (management only) */}
      {isManagement && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl px-4 py-3">
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{activeNow.length}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">On Shift Now</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-2xl px-4 py-3">
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{doneToday.length}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Completed Today</div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl px-4 py-3">
            <div className="text-lg font-extrabold text-gray-900 dark:text-white leading-none">{doneToday.length > 0 ? totalHoursToday : '—'}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Total Hours Today</div>
          </div>
        </div>
      )}

      {/* Active Staff on Shift panel (management only) */}
      {isManagement && activeNow.length > 0 && (() => {
        const ROLE_COLOR = {
          waiter:     'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
          cashier:    'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
          cook:       'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
          bartender:  'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
          supervisor: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
          manager:    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
          admin:      'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
          owner:      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
        }
        return (
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Staff on Shift</span>
              <span className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">{activeNow.length} on duty</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeNow.map(r => (
                <div key={r.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    {r.userName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-none">{r.userName}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ROLE_COLOR[r.role] || 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{r.role}</span>
                      <span className="text-[10px] text-gray-400">{fmtDuration(r.clockIn, null)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Tabs */}
      <div className="flex gap-2">
        {[['today', `Today (${todayRecords.length})`], ['history', isManagement ? 'Full History' : 'My History']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${tab === key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'today' && (
        <div className="space-y-4">

          {/* Currently on shift */}
          {activeNow.length > 0 && (
            <Card padding={false}>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Currently On Shift</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{activeNow.length} active</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700/60">
                      {[isManagement ? 'Staff' : null,'Role','Clocked In','Duration', isManagement ? '' : null].filter(Boolean).map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeNow.map(r => (
                      <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        {isManagement && <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{r.userName}</td>}
                        <td className="px-4 py-3"><Badge color="indigo">{r.role}</Badge></td>
                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">{fmtTime(r.clockIn)}</td>
                        <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-300">{fmtDuration(r.clockIn, null)}</td>
                        {isManagement && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setForceOutConfirm(r.id)}
                              title="Force clock-out (staff forgot)"
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all"
                            >
                              Force Out
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Completed today */}
          {doneToday.length > 0 && (
            <Card padding={false}>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completed Today</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700/60">
                      {[isManagement ? 'Staff' : null,'Role','In','Out','Duration'].filter(Boolean).map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {doneToday.map(r => (
                      <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        {isManagement && <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{r.userName}</td>}
                        <td className="px-4 py-3"><Badge color="gray">{r.role}</Badge></td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtTime(r.clockIn)}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtTime(r.clockOut)}</td>
                        <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">{fmtDuration(r.clockIn, r.clockOut)}</td>
                      </tr>
                    ))}
                    {isManagement && doneToday.length > 0 && (
                      <tr className="bg-gray-50 dark:bg-gray-700/30 border-t-2 border-gray-200 dark:border-gray-600">
                        <td colSpan={3} className="px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</td>
                        <td />
                        <td className="px-4 py-2.5 font-extrabold text-indigo-700 dark:text-indigo-300 text-sm">{totalHoursToday}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {todayRecords.length === 0 && (
            <Card>
              <div className="text-center py-10">
                <div className="text-3xl mb-2">🕐</div>
                <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">No shift records for today yet</div>
                {!isClockedIn && <div className="text-xs text-gray-400 mt-1">Clock in using the button above to start your shift</div>}
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            {isManagement && (
              <input
                value={histSearch}
                onChange={e => setHistSearch(e.target.value)}
                placeholder="Search by name or role…"
                className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
            <input
              type="date"
              value={histDate}
              onChange={e => setHistDate(e.target.value)}
              className="text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {histDate && (
              <button onClick={() => setHistDate('')} className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                Clear
              </button>
            )}
          </div>

          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/60">
                    {['Date', isManagement ? 'Staff' : null, 'Role', 'In', 'Out', 'Duration', 'Status'].filter(Boolean).map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historyRecords.map(r => (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{fmtDate(r.clockIn)}</td>
                      {isManagement && <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{r.userName}</td>}
                      <td className="px-4 py-3"><Badge color="gray">{r.role}</Badge></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtTime(r.clockIn)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {r.clockOut ? fmtTime(r.clockOut) : <span className="text-emerald-500 dark:text-emerald-400 font-bold">Active</span>}
                      </td>
                      <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">{fmtDuration(r.clockIn, r.clockOut)}</td>
                      <td className="px-4 py-3">
                        {r.clockOut
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">✓ Done</span>
                          : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />On Shift
                            </span>
                        }
                      </td>
                    </tr>
                  ))}
                  {historyRecords.length === 0 && (
                    <tr>
                      <td colSpan={isManagement ? 7 : 6} className="text-center py-10 text-gray-400 text-sm">
                        {histSearch || histDate ? 'No records match your filter' : 'No shift history yet'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Clock In / Out Confirmation Modal */}
      {clockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setClockModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-5 ${clockModal === 'in' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl">
                  {clockModal === 'in' ? '▶' : '⏹'}
                </div>
                <div>
                  <div className="text-white font-extrabold text-lg leading-tight">{clockModal === 'in' ? 'Clock In' : 'Clock Out'}</div>
                  <div className="text-white/70 text-xs mt-0.5">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date().toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-3 mb-5">
                <Avatar name={user?.full_name} size="sm" />
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{user?.full_name}</div>
                  <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
                </div>
              </div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Enter your password to confirm</label>
              <input
                type="password"
                value={clockPassword}
                onChange={e => { setClockPassword(e.target.value); setClockError('') }}
                onKeyDown={e => e.key === 'Enter' && handleClockConfirm()}
                placeholder="••••••••"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              {clockError && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                  <span className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center font-bold flex-shrink-0">!</span>
                  {clockError}
                </div>
              )}
              <div className="flex gap-3 mt-5">
                <button onClick={() => setClockModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                <button
                  onClick={handleClockConfirm}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${clockModal === 'in' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
                >
                  {clockModal === 'in' ? '▶ Clock In' : '⏹ Clock Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Force clock-out confirm modal */}
      {forceOutConfirm && (() => {
        const rec = clockRecords.find(r => r.id === forceOutConfirm)
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setForceOutConfirm(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-xl flex-shrink-0">⏹</div>
                <div>
                  <div className="text-sm font-extrabold text-gray-900 dark:text-white">Force Clock-Out</div>
                  <div className="text-xs text-gray-400 mt-0.5">{rec?.userName} — clocked in at {fmtTime(rec?.clockIn)}</div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                This will clock out <span className="font-semibold text-gray-700 dark:text-gray-200">{rec?.userName}</span> now ({fmtTime(new Date())}). Use this if staff forgot to clock out.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setForceOutConfirm(null)} className="py-2.5 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Cancel</button>
                <button
                  onClick={() => { adminClockOut(forceOutConfirm); setForceOutConfirm(null) }}
                  className="py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all"
                >Clock Out Now</button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}

// ─── Receipts ─────────────────────────────────────────────────────────────────
export function Receipts() {
  return (
    <Card>
      <h2 className="font-medium text-gray-900 dark:text-white mb-4">Receipt history</h2>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-100 dark:border-gray-700">
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Receipt #</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Table</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Type</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Payment</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Time</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_INVOICES.map(inv => (
              <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3 font-medium text-blue-600">RCP-{inv.invoice_number}</td>
                <td className="px-4 py-3 hidden sm:table-cell">{inv.table}</td>
                <td className="px-4 py-3 hidden sm:table-cell"><Badge color={inv.type==='takeaway'?'orange':'blue'}>{inv.type==='takeaway'?'Takeaway':'Dine-in'}</Badge></td>
                <td className="px-4 py-3 font-medium">€{inv.total.toFixed(2)}</td>
                <td className="px-4 py-3 hidden md:table-cell">{inv.payment_method}</td>
                <td className="px-4 py-3 hidden md:table-cell">{inv.created_at}</td>
                <td className="px-4 py-3"><Btn size="sm" onClick={() => alert('Reprinting...')}>Reprint</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ─── Supplier Invoices ────────────────────────────────────────────────────────
export function Invoices() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900 dark:text-white">Supplier invoices</h2>
        <Btn variant="primary" size="sm">+ Submit Invoice</Btn>
      </div>
      <Table headers={['Invoice #','Supplier','Items','Total','Status','Date']}>
        {SUPPLIER_INVOICES.map(inv => (
          <TR key={inv.id}>
            <TD className="font-medium text-blue-600">{inv.invoice_ref}</TD>
            <TD>{inv.supplier}</TD>
            <TD className="text-gray-500 text-xs">{inv.items}</TD>
            <TD className="font-medium">€{inv.total.toFixed(2)}</TD>
            <TD><Badge color={statusColor(inv.status)}>{inv.status}</Badge></TD>
            <TD>{inv.date}</TD>
          </TR>
        ))}
      </Table>
    </Card>
  )
}

// ─── Customers ────────────────────────────────────────────────────────────────
export function Customers() {
  const { customers, createCustomer, updateCustomer, deleteCustomer, user } = useApp()
  const canManage = ['superadmin','admin','owner','manager'].includes(user?.role)

  const BLANK = { name:'', phone:'', email:'', notes:'', loyalty_points:0, tags:[], orders:[] }
  const [modal, setModal] = useState(null)  // null | { mode:'add'|'edit'|'view' }
  const [form, setForm] = useState(BLANK)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')
  const [viewTab, setViewTab] = useState('details')

  const visible = customers.filter(c => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || (c.phone||'').includes(q) || (c.email||'').toLowerCase().includes(q)
  })

  function openAdd() { setForm({ ...BLANK }); setModal({ mode:'add' }) }
  function openEdit(c) { setForm({ ...c }); setModal({ mode:'edit' }) }
  function openView(c) { setForm({ ...c }); setModal({ mode:'view' }); setViewTab('details') }
  function closeModal() { setModal(null) }

  function save() {
    if (!form.name.trim()) return
    const record = { ...form, loyalty_points: parseInt(form.loyalty_points) || 0 }
    if (modal.mode === 'add') createCustomer(record)
    else updateCustomer(record)
    closeModal()
  }

  const isReadOnly = modal?.mode === 'view'

  const TAG_OPTIONS = ['VIP','Regular','Allergy','Gluten-Free','Vegan','Lactose-Free','Staff Discount']

  return (
    <div>
      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl w-full sm:max-w-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Remove customer?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">"{confirmDelete.name}"'s data will be permanently deleted.</p>
            <div className="flex gap-2">
              <Btn fullWidth onClick={() => setConfirmDelete(null)}>Cancel</Btn>
              <Btn variant="danger" fullWidth onClick={() => { deleteCustomer(confirmDelete.id); setConfirmDelete(null) }}>Delete</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit / View Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">
                {modal.mode === 'add' ? 'Add Customer' : modal.mode === 'view' ? 'Customer Details' : 'Edit Customer'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
            </div>
            {isReadOnly && (
              <div className="flex border-b border-gray-100 dark:border-gray-700 px-6">
                {[['details','Details'],['orders',`Orders (${(form.orders||[]).length})`]].map(([key,label]) => (
                  <button key={key} onClick={() => setViewTab(key)}
                    className={`px-4 py-3 text-xs font-bold border-b-2 transition-all -mb-px ${viewTab===key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            <div className={`px-6 py-5 space-y-4${isReadOnly && viewTab === 'orders' ? ' hidden' : ''}`}>
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Full Name {!isReadOnly && <span className="text-rose-400">*</span>}</label>
                <input
                  value={form.name}
                  onChange={e => !isReadOnly && setForm(f => ({ ...f, name: e.target.value }))}
                  readOnly={isReadOnly}
                  placeholder="e.g. Anna Borg"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600' : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`}
                />
              </div>
              {/* Phone + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Phone</label>
                  <input type="tel" value={form.phone||''} onChange={e => !isReadOnly && setForm(f=>({...f,phone:e.target.value}))} readOnly={isReadOnly} placeholder="+356 ..." className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600' : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
                  <input type="email" value={form.email||''} onChange={e => !isReadOnly && setForm(f=>({...f,email:e.target.value}))} readOnly={isReadOnly} placeholder="email@example.com" className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600' : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`} />
                </div>
              </div>
              {/* Loyalty points */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Loyalty Points</label>
                <input type="number" min="0" value={form.loyalty_points||0} onChange={e => !isReadOnly && setForm(f=>({...f,loyalty_points:e.target.value}))} readOnly={isReadOnly} className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isReadOnly ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600' : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`} />
              </div>
              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map(tag => {
                    const active = (form.tags||[]).includes(tag)
                    return (
                      <button key={tag} type="button"
                        onClick={() => !isReadOnly && setForm(f => ({ ...f, tags: active ? (f.tags||[]).filter(t=>t!==tag) : [...(f.tags||[]),tag] }))}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'} ${!isReadOnly ? 'hover:border-indigo-400 cursor-pointer' : 'cursor-default'}`}>
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Notes / Preferences</label>
                <textarea
                  value={form.notes||''}
                  onChange={e => !isReadOnly && setForm(f=>({...f,notes:e.target.value}))}
                  readOnly={isReadOnly}
                  placeholder="e.g. Nut allergy, prefers window seat, birthday in March…"
                  rows={3}
                  className={`w-full text-sm px-3.5 py-2.5 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-gray-900 dark:text-white ${isReadOnly ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600' : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`}
                />
              </div>
            </div>
            {isReadOnly && viewTab === 'orders' && (
              <div className="px-6 py-5">
                {(form.orders||[]).length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">No orders recorded for this customer yet</div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {[...(form.orders||[])].reverse().map((o,i) => (
                      <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Order #{o.order_number}</span>
                          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">€{Number(o.total).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{o.date} · {o.pay_method}</div>
                        <div className="text-xs text-gray-400 mt-1">{o.items}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2 px-6 pb-6">
              {isReadOnly ? (
                <Btn fullWidth onClick={closeModal}>Close</Btn>
              ) : (
                <>
                  <Btn fullWidth onClick={closeModal}>Cancel</Btn>
                  <Btn variant="success" fullWidth onClick={save} disabled={!form.name.trim()}>
                    {modal.mode === 'add' ? 'Add Customer' : 'Save Changes'}
                  </Btn>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email…" className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52" />
          <span className="text-xs text-gray-400">{customers.length} customer{customers.length !== 1 ? 's' : ''}</span>
        </div>
        <Btn variant="primary" size="sm" onClick={openAdd}>+ Add Customer</Btn>
      </div>

      {/* Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Tags</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(c => (
                <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={c.name} />
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                          {c.name}
                          {(c.tags||[]).includes('VIP') && <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold">VIP</span>}
                        </div>
                        {c.notes && <div className="text-xs text-gray-400 truncate max-w-[150px]">{c.notes}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">{c.email || '—'}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(c.tags||[]).filter(t => t !== 'VIP').map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-bold text-sm ${c.loyalty_points > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                      {c.loyalty_points || 0} pts
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {canManage ? (
                        <>
                          <Btn size="sm" onClick={() => openEdit(c)}>Edit</Btn>
                          <Btn size="sm" variant="danger" onClick={() => setConfirmDelete(c)}>Delete</Btn>
                        </>
                      ) : (
                        <Btn size="sm" onClick={() => openView(c)}>View</Btn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                  {search ? 'No customers match your search' : 'No customers yet — add your first one!'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ─── Menu Management ──────────────────────────────────────────────────────────
export function MenuManagement() {
  const { menuItems, setMenuItems, menuCategories } = useApp()

  const BLANK_ITEM = { id:'', code:'', barcode:'', category_id: menuCategories[0]?.id || '', name_en:'', price:'', cost_price:'', tax_rate:'18', discount_pct:'0', image_url:'', description_en:'', available:true, emoji:'🍽️', dietary_tags:[], modifierGroups:[] }
  const DIETARY_OPTIONS = ['Vegan','Vegetarian','Vegan Option','Halal','Gluten-Free','Dairy-Free','Contains Nuts','Spicy']
  const [modal, setModal]   = useState(null)   // null | { mode:'add'|'edit', item }
  const [form, setForm]     = useState(BLANK_ITEM)
  const [modInput, setModInput] = useState({ label:'', multi:false, choices:'' })
  const [filterCat, setFilterCat] = useState('all')
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  // ── Search + filter ────────────────────────────────────────────────────────
  const visible = menuItems.filter(i => {
    const matchCat = filterCat === 'all' || i.category_id === filterCat
    const q = search.toLowerCase()
    const matchSearch = !q || i.name_en.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  function openAdd() {
    setForm({ ...BLANK_ITEM, id: `m${Date.now()}`, code: `C${menuItems.length + 1}`.padStart(4,'0') })
    setModal({ mode:'add' })
  }
  function openEdit(item) {
    setForm({ ...item })
    setModal({ mode:'edit' })
  }
  function closeModal() { setModal(null) }

  function saveItem() {
    if (!form.name_en.trim() || !form.price) return
    const item = { ...form, price: parseFloat(form.price) }
    if (modal.mode === 'add') {
      setMenuItems(p => [...p, item])
    } else {
      setMenuItems(p => p.map(i => i.id === item.id ? item : i))
    }
    closeModal()
  }

  function deleteItem(id) {
    setMenuItems(p => p.filter(i => i.id !== id))
    setConfirmDelete(null)
  }

  function toggleAvailable(id) {
    setMenuItems(p => p.map(i => i.id === id ? { ...i, available: !i.available } : i))
  }

  // ── Modifier group helpers ─────────────────────────────────────────────────
  function addModGroup() {
    if (!modInput.label.trim() || !modInput.choices.trim()) return
    const choices = modInput.choices.split(',').map(c => c.trim()).filter(Boolean)
    setForm(f => ({ ...f, modifierGroups: [...(f.modifierGroups || []), { label: modInput.label, multi: modInput.multi, choices }] }))
    setModInput({ label:'', multi:false, choices:'' })
  }
  function removeModGroup(idx) {
    setForm(f => ({ ...f, modifierGroups: f.modifierGroups.filter((_,i) => i !== idx) }))
  }

  return (
    <div>
      {/* ── Confirm delete ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl w-full sm:max-w-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Delete item?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">"{confirmDelete.name_en}" will be permanently removed from the menu.</p>
            <div className="flex gap-2">
              <Btn fullWidth onClick={() => setConfirmDelete(null)}>Cancel</Btn>
              <Btn variant="danger" fullWidth onClick={() => deleteItem(confirmDelete.id)}>Delete</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">{modal.mode === 'add' ? 'Add Menu Item' : 'Edit Menu Item'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Basic fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Item Name" value={form.name_en} onChange={e => setForm(f=>({...f,name_en:e.target.value}))} placeholder="e.g. Grilled Sea Bass" />
                <Input label="Selling Price (€)" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} placeholder="0.00" />
                <Input label="Cost Price (€)" type="number" step="0.01" min="0" value={form.cost_price||''} onChange={e => setForm(f=>({...f,cost_price:e.target.value}))} placeholder="Your cost" />
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Profit Margin</label>
                  <div className="px-3.5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700/30 text-emerald-600 dark:text-emerald-400 font-bold">
                    {form.price && form.cost_price && parseFloat(form.cost_price) > 0
                      ? `${Math.round(((parseFloat(form.price) - parseFloat(form.cost_price)) / parseFloat(form.price)) * 100)}%`
                      : '— %'}
                  </div>
                </div>
                <Input label="Discount (%)" type="number" step="1" min="0" max="100" value={form.discount_pct||'0'} onChange={e => setForm(f=>({...f,discount_pct:e.target.value}))} placeholder="0" />
                <Input label="Tax / VAT Rate (%)" type="number" step="1" min="0" value={form.tax_rate||'18'} onChange={e => setForm(f=>({...f,tax_rate:e.target.value}))} placeholder="18" />
                <Input label="Item Code" value={form.code} onChange={e => setForm(f=>({...f,code:e.target.value}))} placeholder="M001" />
                <Input label="Barcode" value={form.barcode} onChange={e => setForm(f=>({...f,barcode:e.target.value}))} placeholder="5990000001" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select label="Category" value={form.category_id} onChange={e => setForm(f=>({...f,category_id:e.target.value}))}>
                  {menuCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name_en}</option>)}
                </Select>
                <Input label="Emoji" value={form.emoji} onChange={e => setForm(f=>({...f,emoji:e.target.value}))} placeholder="🍽️" />
              </div>
              <Input label="Image URL (optional)" value={form.image_url||''} onChange={e => setForm(f=>({...f,image_url:e.target.value}))} placeholder="https://... (leave blank for emoji tile)" />
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Description</label>
                <input value={form.description_en} onChange={e => setForm(f=>({...f,description_en:e.target.value}))} placeholder="Short description shown to waiter & cashier" className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {/* Dietary tags */}
              <div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Dietary Tags</div>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(tag => {
                    const active = (form.dietary_tags||[]).includes(tag)
                    return (
                      <button key={tag} type="button"
                        onClick={() => setForm(f => ({ ...f, dietary_tags: active ? (f.dietary_tags||[]).filter(t=>t!==tag) : [...(f.dietary_tags||[]), tag] }))}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${active ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-emerald-400'}`}>
                        {tag}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Available on menu</label>
                <button onClick={() => setForm(f=>({...f,available:!f.available}))} className={`relative w-11 h-6 rounded-full transition-colors ${form.available ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.available ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">{form.available ? 'Visible to staff' : 'Hidden from menu'}</span>
              </div>

              {/* Modifier groups */}
              <div>
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Modifier / Option Groups</div>
                {(form.modifierGroups || []).map((g, i) => (
                  <div key={i} className="flex items-start justify-between bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2 mb-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{g.label} <span className="font-normal text-gray-400">({g.multi ? 'multi' : 'single'})</span></div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{g.choices.join(' · ')}</div>
                    </div>
                    <button onClick={() => removeModGroup(i)} className="text-rose-400 hover:text-rose-600 text-xs ml-2 flex-shrink-0">Remove</button>
                  </div>
                ))}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input value={modInput.label} onChange={e => setModInput(p=>({...p,label:e.target.value}))} placeholder="Group name (e.g. Cooking level)" className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    <input value={modInput.choices} onChange={e => setModInput(p=>({...p,choices:e.target.value}))} placeholder="Choices comma-separated (Rare, Medium...)" className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                      <input type="checkbox" checked={modInput.multi} onChange={e => setModInput(p=>({...p,multi:e.target.checked}))} className="rounded" />
                      Allow multiple selections
                    </label>
                    <Btn size="sm" variant="primary" onClick={addModGroup}>+ Add Group</Btn>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <Btn fullWidth onClick={closeModal}>Cancel</Btn>
              <Btn variant="success" fullWidth onClick={saveItem} disabled={!form.name_en.trim() || !form.price}>
                {modal.mode === 'add' ? 'Add to Menu' : 'Save Changes'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCat('all')} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterCat==='all' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800'}`}>All ({menuItems.length})</button>
          {menuCategories.map(c => (
            <button key={c.id} onClick={() => setFilterCat(c.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterCat===c.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800'}`}>
              {c.icon} {c.name_en} ({menuItems.filter(i=>i.category_id===c.id).length})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…" className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40" />
          <Btn variant="primary" size="sm" onClick={openAdd}>+ Add Item</Btn>
        </div>
      </div>

      {/* ── Table ── */}
      <Card padding={false}>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700/60">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Code</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Tags &amp; Mods</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Available</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(item => (
              <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700/40 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-200">{item.name_en}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[180px]">{item.description_en}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{menuCategories.find(c=>c.id===item.category_id)?.name_en || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">€{Number(item.price).toFixed(2)}</span>
                    {Number(item.discount_pct) > 0 && <span className="ml-1 text-xs text-rose-500 font-semibold">-{item.discount_pct}%</span>}
                    {item.cost_price && <div className="text-xs text-emerald-500 font-medium">{Math.round(((Number(item.price)-Number(item.cost_price))/Number(item.price))*100)}% margin</div>}
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">{item.code}</span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {(item.dietary_tags||[]).map(t => <span key={t} className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">{t}</span>)}
                    {(item.modifierGroups||[]).length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-xs">{item.modifierGroups.length} mod(s)</span>}
                    {!(item.dietary_tags||[]).length && !(item.modifierGroups||[]).length && <span className="text-xs text-gray-400">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleAvailable(item.id)} className={`relative w-10 h-5 rounded-full transition-colors ${item.available ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.available ? 'translate-x-5' : ''}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <Btn size="sm" onClick={() => openEdit(item)}>Edit</Btn>
                    <Btn size="sm" variant="danger" onClick={() => setConfirmDelete(item)}>Delete</Btn>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">No items found</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  )
}

// ─── Order History ────────────────────────────────────────────────────────────
export function History() {
  const { orderHistory, company } = useApp()
  const [search, setSearch] = useState('')
  const [filterMethod, setFilterMethod] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  const vatRate = company?.vat_rate ?? 18

  const filtered = orderHistory.filter(r => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q ||
      String(r.order_number).includes(q) ||
      r.table_label.toLowerCase().includes(q) ||
      r.waiter.toLowerCase().includes(q) ||
      r.cashier.toLowerCase().includes(q)
    const matchMethod = filterMethod === 'all' || r.pay_method === filterMethod
    return matchSearch && matchMethod
  })

  const todayTotal = orderHistory.filter(r => {
    const d = r.paid_at instanceof Date ? r.paid_at : new Date(r.paid_at)
    return d.toDateString() === new Date().toDateString()
  }).reduce((s, r) => s + r.total, 0)

  const methodColor = { cash: 'green', card: 'indigo', mobile: 'cyan' }
  const methodLabel = { cash: 'Cash', card: 'Card', mobile: 'Mobile' }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <div className="text-xs text-gray-400 mb-1">Total Orders</div>
          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">{orderHistory.length}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400 mb-1">Today's Revenue</div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">€{todayTotal.toFixed(2)}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400 mb-1">Cash Payments</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{orderHistory.filter(r => r.pay_method === 'cash').length}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400 mb-1">Card / Mobile</div>
          <div className="text-2xl font-extrabold text-gray-700 dark:text-gray-200">{orderHistory.filter(r => r.pay_method !== 'cash').length}</div>
        </Card>
      </div>

      <Card>
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order #, table, waiter…"
            className="flex-1 min-w-[180px] text-sm px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <select
            value={filterMethod}
            onChange={e => setFilterMethod(e.target.value)}
            className="text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile">Mobile</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3">Date</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3">Order #</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3">Table</th>
                <th className="hidden sm:table-cell text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3">Waiter</th>
                <th className="hidden md:table-cell text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3">Cashier</th>
                <th className="hidden sm:table-cell text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3">Items</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3">Method</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No records found</td></tr>
              )}
              {filtered.map(r => {
                const d = r.paid_at instanceof Date ? r.paid_at : new Date(r.paid_at)
                const isExpanded = expandedId === r.id
                return (
                  <>
                    <tr
                      key={r.id}
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 pr-3">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{d.toLocaleDateString('en-MT',{day:'2-digit',month:'short'})}</div>
                        <div className="text-xs text-gray-400">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-2.5 pr-3 font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">#{r.order_number}</td>
                      <td className="py-2.5 pr-3 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">{r.table_label}</td>
                      <td className="hidden sm:table-cell py-2.5 pr-3 text-xs text-gray-600 dark:text-gray-400">{r.waiter}</td>
                      <td className="hidden md:table-cell py-2.5 pr-3 text-xs text-gray-600 dark:text-gray-400">{r.cashier}</td>
                      <td className="hidden sm:table-cell py-2.5 pr-3 text-xs text-gray-600 dark:text-gray-400">{r.items.length} item{r.items.length !== 1 ? 's' : ''}</td>
                      <td className="py-2.5 pr-3">
                        <Badge color={methodColor[r.pay_method] || 'gray'}>{methodLabel[r.pay_method] || r.pay_method}</Badge>
                      </td>
                      <td className="py-2.5 font-extrabold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">€{r.total.toFixed(2)}</td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${r.id}-detail`} className="bg-gray-50 dark:bg-gray-800/60">
                        <td colSpan={8} className="px-3 py-3">
                          <div className="grid sm:grid-cols-2 gap-4">
                            {/* Items */}
                            <div>
                              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Items</div>
                              <div className="space-y-1">
                                {r.items.map((item, i) => {
                                  const disc = Number(item.discount_pct || 0) / 100
                                  const line = item.price * (1 - disc) * item.qty
                                  return (
                                    <div key={i} className="flex justify-between text-xs">
                                      <span className="text-gray-700 dark:text-gray-300">
                                        <span className="font-bold text-gray-500">{item.qty}×</span> {item.name_en || item.name}
                                        {disc > 0 && <span className="ml-1 text-rose-500">−{item.discount_pct}%</span>}
                                      </span>
                                      <span className="font-semibold text-gray-700 dark:text-gray-300">€{line.toFixed(2)}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                            {/* Totals + note */}
                            <div>
                              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Summary</div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>€{r.subtotal.toFixed(2)}</span></div>
                                {r.total_savings > 0 && <div className="flex justify-between text-rose-500"><span>Savings</span><span>−€{r.total_savings.toFixed(2)}</span></div>}
                                <div className="flex justify-between text-gray-500"><span>VAT {vatRate}%</span><span>€{r.vat.toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold text-gray-800 dark:text-gray-200 pt-1 border-t border-gray-200 dark:border-gray-700"><span>Total</span><span>€{r.total.toFixed(2)}</span></div>
                                {r.pay_method === 'cash' && r.cash_given > 0 && (
                                  <>
                                    <div className="flex justify-between text-gray-400"><span>Cash given</span><span>€{r.cash_given.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-gray-400"><span>Change</span><span>€{r.change.toFixed(2)}</span></div>
                                  </>
                                )}
                                {r.note && <div className="mt-2 text-gray-400 italic">Note: {r.note}</div>}
                              </div>
                            </div>
                          </div>
                          {/* Edit log */}
                          {r.editLog && r.editLog.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Edit History</div>
                              <div className="space-y-2">
                                {r.editLog.map((entry, ei) => (
                                  <div key={ei} className="flex items-start gap-2 text-xs">
                                    <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-[9px] font-bold text-indigo-600 flex-shrink-0 mt-0.5">✏</span>
                                    <div>
                                      <span className="font-semibold text-gray-700 dark:text-gray-300">{entry.editedBy}</span>
                                      <span className="text-gray-400 ml-1">({entry.editedByRole})</span>
                                      <span className="text-gray-400 ml-1">added {entry.addedItems?.map(i => `${i.qty}× ${i.name}`).join(', ')}</span>
                                      <div className="text-gray-400">{new Date(entry.editedAt).toLocaleString('en-MT', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export function OTH() {
  const { othRecords, company } = useApp()
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('today')
  const [reasonFilter, setReasonFilter] = useState('all')

  const todayStr = new Date().toDateString()
  const now = new Date()

  function inRange(r) {
    const d = new Date(r.created_at)
    if (dateFilter === 'today')   return d.toDateString() === todayStr
    if (dateFilter === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7)
      return d >= weekAgo
    }
    if (dateFilter === 'month') {
      const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30)
      return d >= monthAgo
    }
    return true // 'all'
  }

  const allReasons = [...new Set(othRecords.map(r => r.reason).filter(Boolean))]

  const filtered = othRecords.filter(r => {
    if (!inRange(r)) return false
    if (reasonFilter !== 'all' && r.reason !== reasonFilter) return false
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      r.item_name?.toLowerCase().includes(q) ||
      String(r.order_number).includes(q) ||
      r.table_label?.toLowerCase().includes(q) ||
      r.approved_by?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q)
    )
  })

  const filteredTotal  = filtered.reduce((s, r) => s + Number(r.total_value || 0), 0)
  const filteredCount  = filtered.length

  const todayItems  = othRecords.filter(r => new Date(r.created_at).toDateString() === todayStr)
  const todayTotal  = todayItems.reduce((s, r) => s + Number(r.total_value || 0), 0)
  const allTotal    = othRecords.reduce((s, r) => s + Number(r.total_value || 0), 0)

  // Group filtered by date for visual separation
  const byDate = filtered.reduce((acc, r) => {
    const d = new Date(r.created_at).toDateString()
    if (!acc[d]) acc[d] = []
    acc[d].push(r)
    return acc
  }, {})
  const sortedDates = Object.keys(byDate).sort((a, b) => new Date(b) - new Date(a))

  return (
    <div className="space-y-4">
      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <div className="text-xs text-gray-400 mb-1">Today's Comps</div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{todayItems.length}</div>
          <div className="text-xs text-gray-400 mt-1">items given free</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400 mb-1">Today's Value</div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">€{todayTotal.toFixed(2)}</div>
          <div className="text-xs text-gray-400 mt-1">comped today</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400 mb-1">All-Time Records</div>
          <div className="text-2xl font-extrabold text-gray-700 dark:text-gray-200">{othRecords.length}</div>
          <div className="text-xs text-gray-400 mt-1">total comp items</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400 mb-1">All-Time Value</div>
          <div className="text-2xl font-extrabold text-gray-700 dark:text-gray-200">€{allTotal.toFixed(2)}</div>
          <div className="text-xs text-gray-400 mt-1">total given free</div>
        </Card>
      </div>

      <Card>
        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search item, order #, table, approver…"
            className="flex-1 min-w-[180px] text-sm px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          {allReasons.length > 0 && (
            <select
              value={reasonFilter}
              onChange={e => setReasonFilter(e.target.value)}
              className="text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">All Reasons</option>
              {allReasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                {['Date & Time','Order #','Table','Item','Qty','Unit Price','Total Value','Reason','Approved By'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-4 last:pr-0 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCount === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-14">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl opacity-30">🎁</span>
                      <p className="text-sm font-semibold text-gray-400">No comp records found</p>
                      <p className="text-xs text-gray-300 dark:text-gray-500">Try a different date range or search term</p>
                    </div>
                  </td>
                </tr>
              )}
              {sortedDates.map(dateStr => (
                <>
                  {/* Date group header */}
                  <tr key={`hdr-${dateStr}`}>
                    <td colSpan={9} className="pt-4 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          {dateStr === todayStr ? '📅 Today' : `📅 ${new Date(dateStr).toLocaleDateString('en-MT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}`}
                        </span>
                        <div className="flex-1 h-px bg-amber-100 dark:bg-amber-900/30" />
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                          {byDate[dateStr].length} item{byDate[dateStr].length !== 1 ? 's' : ''} · €{byDate[dateStr].reduce((s,r)=>s+Number(r.total_value||0),0).toFixed(2)}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {byDate[dateStr].map((r, i) => (
                    <tr key={r.id ?? `${dateStr}-${i}`} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-amber-50/40 dark:hover:bg-amber-900/10 transition-colors">
                      <td className="py-2.5 pr-4 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{new Date(r.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-2.5 pr-4 font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                        {r.order_number ? `#${r.order_number}` : '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {r.table_label || '—'}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{r.item_name}</span>
                          <span className="text-[9px] font-extrabold px-1 py-0.5 rounded bg-amber-500 text-white tracking-widest flex-shrink-0">COMP</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-center font-bold text-gray-700 dark:text-gray-300">{r.quantity ?? 1}</td>
                      <td className="py-2.5 pr-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">€{Number(r.original_price || 0).toFixed(2)}</td>
                      <td className="py-2.5 pr-4 font-extrabold text-amber-700 dark:text-amber-300 whitespace-nowrap">€{Number(r.total_value || 0).toFixed(2)}</td>
                      <td className="py-2.5 pr-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">{r.reason || '—'}</span>
                      </td>
                      <td className="py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">✓ {r.approved_by || '—'}</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
            {filteredCount > 0 && (
              <tfoot>
                <tr className="border-t-2 border-amber-200 dark:border-amber-700/50 bg-amber-50/60 dark:bg-amber-900/10">
                  <td colSpan={5} className="py-3 pl-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {filteredCount} record{filteredCount !== 1 ? 's' : ''} · filtered total
                  </td>
                  <td className="py-3 pr-4" />
                  <td className="py-3 pr-4 font-extrabold text-amber-700 dark:text-amber-300 whitespace-nowrap text-base">
                    €{filteredTotal.toFixed(2)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard
