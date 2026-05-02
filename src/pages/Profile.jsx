import { useState, useRef } from 'react'
import { useApp, ROLES } from '../context/AppContext'
import { Avatar } from '../components/UI'
import {
  User, Mail, Shield, Phone, CheckCircle2,
  Edit3, Save, X, LogOut, Calendar, Camera,
  Activity, Clock, Sun, Moon, Globe, Hash,
  Bell, BellOff, Lock, Info,
} from 'lucide-react'

export default function Profile({ navTo }) {
  const {
    user, updateUser, logout,
    clockRecords, isClockedIn,
    orderHistory, liveOrders,
    lang, setLang, theme, setTheme,
  } = useApp()

  // ── Edit profile ────────────────────────────────────────────────
  const [editing, setEditing]   = useState(false)
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [email, setEmail]       = useState(user?.email || '')
  const [phone, setPhone]       = useState(user?.phone || '')
  const [saveMsg, setSaveMsg]   = useState('')
  const fileRef = useRef()

  // ── PIN ─────────────────────────────────────────────────────────
  const [pinMode, setPinMode]   = useState(false) // 'set' | false
  const [pin, setPin]           = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinMsg, setPinMsg]     = useState('')

  // ── Notification prefs ──────────────────────────────────────────
  const defaultPrefs = { orders: true, inventory: true, users: true, system: true }
  const notifPrefs   = user?.notif_prefs || defaultPrefs

  const roleInfo = ROLES[user?.role]

  // ── Clock history (last 5) ──────────────────────────────────────
  const myClocks = clockRecords
    .filter(r => r.userId === user?.id)
    .sort((a, b) => b.clockIn - a.clockIn)
    .slice(0, 5)

  // ── Current shift ───────────────────────────────────────────────
  const activeShift = clockRecords.find(r => r.userId === user?.id && !r.clockOut)
  const shiftMins = activeShift
    ? Math.floor((Date.now() - new Date(activeShift.clockIn)) / 60000)
    : null

  // ── Activity summary ────────────────────────────────────────────
  const myName    = user?.full_name?.split(' ')[0]?.toLowerCase() || ''
  const myOrders  = orderHistory.filter(o => o.waiter?.toLowerCase().includes(myName)).length
  const myShifts  = clockRecords.filter(r => r.userId === user?.id && r.clockOut).length

  // ── Helpers ─────────────────────────────────────────────────────
  function fmtTime(date) {
    if (!date) return '—'
    return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }
  function fmtDate(date) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  function fmtDuration(mins) {
    if (mins === null) return '—'
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`
  }

  // ── Actions ─────────────────────────────────────────────────────
  function saveProfile() {
    if (!fullName.trim()) return
    updateUser(user.id, { full_name: fullName.trim(), email: email.trim(), phone: phone.trim() })
    setSaveMsg('Profile updated.')
    setEditing(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  function cancelEdit() {
    setFullName(user?.full_name || '')
    setEmail(user?.email || '')
    setPhone(user?.phone || '')
    setEditing(false)
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => updateUser(user.id, { avatar_url: ev.target.result })
    reader.readAsDataURL(file)
  }

  function savePin() {
    setPinMsg('')
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setPinMsg('PIN must be exactly 4 digits.'); return }
    if (pin !== pinConfirm) { setPinMsg('PINs do not match.'); return }
    updateUser(user.id, { pin })
    setPinMsg('PIN saved.')
    setPin(''); setPinConfirm('')
    setPinMode(false)
    setTimeout(() => setPinMsg(''), 3000)
  }

  function toggleNotif(key) {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] }
    updateUser(user.id, { notif_prefs: updated })
  }

  return (
    <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 sm:gap-5">

      {/* ── Profile Card ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">
        <div className="h-24 sm:h-20 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600" />
        <div className="px-4 sm:px-6 pb-5">
          {/* Avatar + edit row */}
          <div className="flex items-end justify-between -mt-8 mb-4">
            {/* Photo */}
            <div className="relative group flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 p-1 shadow-lg">
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="avatar" className="w-full h-full rounded-xl object-cover" />
                  : <div className="w-full h-full rounded-xl overflow-hidden"><Avatar name={user?.full_name} size="lg" /></div>
                }
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Change photo"
              >
                <Camera size={16} className="text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            <div className="flex gap-2 mb-1">
              {!editing ? (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
                  <Edit3 size={12} /> Edit
                </button>
              ) : (
                <>
                  <button onClick={cancelEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                    <X size={12} /> Cancel
                  </button>
                  <button onClick={saveProfile} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
                    <Save size={12} /> Save
                  </button>
                </>
              )}
            </div>
          </div>

          {saveMsg && (
            <div className="flex items-center gap-2 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl px-3 py-2 mb-3">
              <CheckCircle2 size={13} /> {saveMsg}
            </div>
          )}

          {/* Name + badges */}
          {!editing ? (
            <div className="mb-4">
              <div className="text-lg font-extrabold text-gray-900 dark:text-white">{user?.full_name}</div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${roleInfo?.color || 'bg-gray-100 text-gray-600'}`}>{roleInfo?.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${user?.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>{user?.status}</span>
                {user?.pin && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">PIN set</span>}
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}

          {/* Info fields */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3">
            <InfoField icon={<User size={14} className="text-indigo-400" />} label="Username" value={user?.username} />
            <InfoField icon={<Shield size={14} className="text-indigo-400" />} label="Role" value={roleInfo?.label} />
            <EditableField icon={<Mail size={14} className="text-indigo-400" />} label="Email" value={email} editing={editing} onChange={setEmail} placeholder="your@email.com" />
            <EditableField icon={<Phone size={14} className="text-indigo-400" />} label="Phone" value={phone} editing={editing} onChange={setPhone} placeholder="+356 9999 9999" />
          </div>
        </div>
      </div>

      {/* ── Account Info ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={15} className="text-indigo-500" />
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Account Info</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <InfoField icon={<User size={14} className="text-indigo-400" />} label="Account ID" value={`#${user?.id}`} />
          <InfoField icon={<Calendar size={14} className="text-indigo-400" />} label="Created By" value={user?.created_by || '—'} />
          <InfoField icon={<Lock size={14} className="text-indigo-400" />} label="Last Login"
            value={user?.last_login ? new Date(user.last_login).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : 'This session'} />
        </div>
      </div>

      {/* ── Activity Summary ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={15} className="text-indigo-500" />
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Activity Summary</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Orders Served',   value: myOrders,  color: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'Shifts Completed', value: myShifts,  color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Active Now',       value: isClockedIn ? 'Yes' : 'No', color: isClockedIn ? 'text-green-600 dark:text-green-400' : 'text-gray-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-2 sm:px-4 py-3 text-center">
              <div className={`text-2xl font-extrabold leading-none ${color}`}>{value}</div>
              <div className="text-[11px] text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Current Shift ── */}
      {isClockedIn && activeShift && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Clock size={15} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Current Shift</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Clocked in at {fmtTime(activeShift.clockIn)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">{fmtDuration(shiftMins)}</div>
              <div className="text-[11px] text-emerald-500 mt-0.5">elapsed</div>
            </div>
          </div>
        </div>
      )}

      {/* ── PIN Setup ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">
        <button
          onClick={() => { setPinMode(v => !v); setPinMsg(''); setPin(''); setPinConfirm('') }}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
              <Hash size={14} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-gray-800 dark:text-gray-100">Quick PIN</div>
              <div className="text-xs text-gray-400">{user?.pin ? 'PIN is set — click to change' : 'Set a 4-digit PIN for fast login'}</div>
            </div>
          </div>
          <span className="text-xs text-indigo-500 font-semibold">{pinMode ? 'Cancel' : user?.pin ? 'Change' : 'Set PIN'}</span>
        </button>
        {pinMode && (
          <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
            {pinMsg && (
              <div className={`text-xs font-semibold rounded-xl px-3 py-2 ${pinMsg === 'PIN saved.' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                {pinMsg}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">New PIN</label>
                <input type="password" maxLength={4} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0,4))} placeholder="••••" className="w-full text-center text-lg font-bold tracking-widest px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Confirm PIN</label>
                <input type="password" maxLength={4} value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0,4))} placeholder="••••" className="w-full text-center text-lg font-bold tracking-widest px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <button onClick={savePin} className="w-full py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
              Save PIN
            </button>
          </div>
        )}
      </div>

      {/* ── Preferences ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={15} className="text-indigo-500" />
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Preferences</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Language</label>
            <select value={lang} onChange={e => setLang(e.target.value)} className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="en">English</option>
              <option value="mt">Maltese</option>
              <option value="it">Italian</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Theme</label>
            <div className="grid grid-cols-2 gap-2">
              {[['light', <Sun size={13} />], ['dark', <Moon size={13} />]].map(([val, icon]) => (
                <button key={val} onClick={() => setTheme(val)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border-2 transition-all capitalize ${theme === val ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-300'}`}>
                  {icon}{val}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Notification Preferences ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={15} className="text-indigo-500" />
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Notification Preferences</span>
        </div>
        <div className="space-y-2">
          {[
            { key: 'orders',    label: 'Orders & Kitchen',  desc: 'New orders, status changes' },
            { key: 'inventory', label: 'Inventory Alerts',  desc: 'Low stock, supply warnings' },
            { key: 'users',     label: 'User Requests',     desc: 'New accounts awaiting approval' },
            { key: 'system',    label: 'System Notices',    desc: 'Session and app-wide alerts' },
          ].map(({ key, label, desc }) => (
            <div key={key} onClick={() => toggleNotif(key)} className="flex items-center justify-between px-3 sm:px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${notifPrefs[key] ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-gray-200 dark:bg-gray-600 text-gray-400'}`}>
                  {notifPrefs[key] ? <Bell size={13} /> : <BellOff size={13} />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{label}</div>
                  <div className="text-[11px] text-gray-400 truncate">{desc}</div>
                </div>
              </div>
              {/* Toggle */}
              <div className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${notifPrefs[key] ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifPrefs[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Clock Records ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
            <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Recent Clock Records</span>
          {isClockedIn && (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Clocked In
            </span>
          )}
        </div>
        {myClocks.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">No clock records yet.</div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/40">
            {myClocks.map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 sm:px-5 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.clockOut ? 'bg-gray-300 dark:bg-gray-600' : 'bg-green-400 animate-pulse'}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-100">{fmtDate(r.clockIn)}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                      In: {fmtTime(r.clockIn)}{r.clockOut ? ` · Out: ${fmtTime(r.clockOut)}` : ' · Still active'}
                    </div>
                  </div>
                </div>
                {r.clockOut && (
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {fmtDuration(Math.floor((new Date(r.clockOut) - new Date(r.clockIn)) / 60000))}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sign Out ── */}
      <button
        onClick={logout}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 bg-white dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
      >
        <LogOut size={15} /> Sign Out
      </button>
    </div>
  )
}

// ── Small helper components ───────────────────────────────────────
function InfoField({ icon, label, value }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-3 flex items-start gap-3">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-gray-400 mb-0.5">{label}</div>
        <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{value || '—'}</div>
      </div>
    </div>
  )
}

function EditableField({ icon, label, value, editing, onChange, placeholder }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-3 flex items-start gap-3">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-gray-400 mb-0.5">{label}</div>
        {!editing ? (
          <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{value || '—'}</div>
        ) : (
          <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className="w-full text-sm px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        )}
      </div>
    </div>
  )
}
