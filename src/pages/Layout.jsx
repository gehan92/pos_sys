import { useState, useEffect } from 'react'
import { useApp, ROLES } from '../context/AppContext'
import { t } from '../i18n/translations'
import { Avatar } from '../components/UI'
import shopLogo from '../img/shopLogo_icon.jpeg'
import {
  LayoutDashboard, Building2, Users as UsersIcon, BarChart3, Settings as SettingsIcon, ShieldCheck,
  Grid3x3, ClipboardList, CreditCard, Package, BookOpen, Receipt, Eye,
  Calendar, ChefHat, FileText, Bell, LogOut, Globe, Sun, Moon, ChevronRight,
  Clock, LogIn, LogOut as LogOutIcon, Menu, X, UserCheck, Wine, History as HistoryIcon, Gift, Database,
} from 'lucide-react'

// Pages
import Dashboard from './Dashboard'
import Tables from './Tables'
import Orders from './Orders'
import Kitchen from './Kitchen'
import Billing from './Billing'
import Inventory from './Inventory'
import Users from './Users'
import Reports from './Reports'
import Settings from './Settings'
import Shifts from './Shifts'
import Audit from './Audit'
import Notifications from './Notifications'
import Supervisor from './Supervisor'
import Company from './Company'
import Receipts from './Receipts'
import Invoices from './Invoices'
import MenuManagement from './MenuManagement'
import Customers from './Customers'
import Waiters from './Waiters'
import OrderList from './OrderList'
import Bar from './Bar'
import History from './History'
import OTH from './OTH'
import Profile from './Profile'
import DatabaseViewer from './DatabaseViewer'

const PAGE_MAP = {
  dashboard: Dashboard, tables: Tables, orders: Orders, kitchen: Kitchen,
  bar: Bar,
  billing: Billing, inventory: Inventory, users: Users, reports: Reports,
  settings: Settings, shifts: Shifts, audit: Audit, notifications: Notifications,
  supervisor: Supervisor, company: Company, receipts: Receipts,
  invoices: Invoices, menu: MenuManagement, customers: Customers, waiters: Waiters,
  orderlist: OrderList,
  history: History,
  oth: OTH,
  profile: Profile,
  dbviewer: DatabaseViewer,
}

const NAV_ICONS_LUCIDE = {
  dashboard: LayoutDashboard,
  company: Building2,
  users: UsersIcon,
  reports: BarChart3,
  settings: SettingsIcon,
  audit: ShieldCheck,
  tables: Grid3x3,
  orders: ClipboardList,
  billing: CreditCard,
  inventory: Package,
  menu: BookOpen,
  receipts: Receipt,
  supervisor: Eye,
  shifts: Calendar,
  kitchen: ChefHat,
  bar: Wine,
  invoices: FileText,
  notifications: Bell,
  customers: UserCheck,
  waiters: UsersIcon,
  orderlist: ClipboardList,
  history: HistoryIcon,
  oth: Gift,
  profile: UsersIcon,
  dbviewer: Database,
}

export default function Layout() {
  const { user, users, logout, lang, setLang, theme, setTheme, company, unreadCount, clockIn, clockOut, isClockedIn, navPermissions } = useApp()
  const [page, setPage] = useState(() => {
    const nav = navPermissions[user?.role] || ['dashboard']
    return nav[0]
  })
  const [orderContext, setOrderContext] = useState({ tableId: null, tableNumber: null, isTakeaway: false })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [clockModal, setClockModal] = useState(null) // 'in' | 'out' | null
  const [clockPassword, setClockPassword] = useState('')
  const [clockError, setClockError] = useState('')

  const nav = navPermissions[user?.role] || []

  // If nav changes and current page was removed, redirect to first available
  // Note: do NOT include `page` in deps — that would cancel navTo() for pages not in sidebar nav
  useEffect(() => {
    if (nav.length > 0 && !nav.includes(page)) setPage(nav[0])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav])
  const PageComponent = PAGE_MAP[page] || Dashboard
  const roleInfo = ROLES[user?.role]

  function navTo(p, ctx = null) {
    if (ctx) setOrderContext(ctx)
    setPage(p)
    setSidebarOpen(false)
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

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-950 overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-60 bg-slate-900 dark:bg-slate-950 flex flex-col flex-shrink-0 shadow-xl
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Brand */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 shadow-md shadow-blue-900/40 ring-1 ring-white/20">
              <img src={shopLogo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate leading-tight">{company.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">Point of Sale</div>
            </div>
            {/* Close button mobile */}
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-4 py-3 border-b border-white/10">
          <button onClick={() => navTo('profile')} className="w-full flex items-center gap-2.5 bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2.5 transition-colors text-left">
            <Avatar name={user?.full_name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{user?.full_name}</div>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleInfo?.color || 'bg-gray-700 text-gray-300'}`}>{roleInfo?.label}</span>
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {nav.map(key => {
            const Icon = NAV_ICONS_LUCIDE[key] || ChevronRight
            const isActive = page === key
            return (
              <button
                key={key}
                onClick={() => navTo(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-100 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50 nav-active'
                    : 'text-slate-400 hover:bg-white/8 hover:text-slate-100'
                }`}
              >
                <Icon size={16} className="flex-shrink-0" />
                <span className="truncate flex-1 text-left">{t(key, lang)}</span>
                {key === 'notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-rose-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-bold leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer controls */}
        <div className="px-3 py-3 border-t border-white/10 space-y-1">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Globe size={11} /> Lang
            </span>
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              className="text-xs bg-white/10 border-0 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="en" className="bg-slate-800 text-white">EN</option>
              <option value="mt" className="bg-slate-800 text-white">MT</option>
              <option value="it" className="bg-slate-800 text-white">IT</option>
            </select>
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              {theme === 'dark' ? <Moon size={11} /> : <Sun size={11} />} Theme
            </span>
            <select
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="text-xs bg-white/10 border-0 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="light" className="bg-slate-800 text-white">Light</option>
              <option value="dark" className="bg-slate-800 text-white">Dark</option>
            </select>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all font-medium"
          >
            <LogOut size={15} />
            <span>{t('signOut', lang)}</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">

        {/* Topbar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 lg:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-sm lg:text-base font-bold text-gray-900 dark:text-white capitalize">{t(page, lang) || page}</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block mt-0.5">{company.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Clock In / Out button */}
            <button
              onClick={openClockModal}
              title={isClockedIn ? 'Clock Out' : 'Clock In'}
              className={`flex items-center gap-1.5 px-2 lg:px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                isClockedIn
                  ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30'
                  : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
              }`}
            >
              <Clock size={13} />
              <span className="hidden sm:inline">{isClockedIn ? 'Clock Out' : 'Clock In'}</span>
            </button>
            <button
              onClick={() => navTo('notifications')}
              className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{unreadCount}</span>
              )}
            </button>
            {nav.includes('settings') && (
              <button
                onClick={() => navTo('settings')}
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <SettingsIcon size={16} />
              </button>
            )}
            <div className="w-px h-6 bg-gray-100 dark:bg-gray-700 mx-1 hidden sm:block" />
            <button onClick={() => navTo('profile')} title="My Profile" className="flex-shrink-0">
              <Avatar name={user?.full_name} size="sm" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-3 lg:p-6 animate-fadeIn">
          <PageComponent navTo={navTo} orderContext={orderContext} setOrderContext={setOrderContext} />
        </main>
      </div>

      {/* Clock In / Out Confirmation Modal */}
      {clockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setClockModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className={`px-6 py-5 ${clockModal === 'in' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  {clockModal === 'in' ? <LogIn size={20} className="text-white" /> : <LogOutIcon size={20} className="text-white" />}
                </div>
                <div>
                  <div className="text-white font-extrabold text-lg leading-tight">{clockModal === 'in' ? 'Clock In' : 'Clock Out'}</div>
                  <div className="text-white/70 text-xs mt-0.5">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date().toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-3 mb-5">
                <Avatar name={user?.full_name} size="sm" />
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{user?.full_name}</div>
                  <div className="text-xs text-gray-400 capitalize">{roleInfo?.label}</div>
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
                  <span className="w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 font-bold flex-shrink-0">!</span>
                  {clockError}
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setClockModal(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClockConfirm}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2 ${
                    clockModal === 'in' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
                  }`}
                >
                  {clockModal === 'in' ? <LogIn size={14} /> : <LogOutIcon size={14} />}
                  {clockModal === 'in' ? 'Clock In' : 'Clock Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
