import { useState } from 'react'
import { useApp, ROLES, ROLE_NAV } from '../context/AppContext'
import { t } from '../i18n/translations'
import { Avatar } from '../components/UI'
import {
  LayoutDashboard, Building2, Users as UsersIcon, BarChart3, Settings as SettingsIcon, ShieldCheck,
  Grid3x3, ClipboardList, CreditCard, Package, BookOpen, Receipt, Eye,
  Calendar, ChefHat, FileText, Bell, LogOut, Globe, Sun, Moon, ChevronRight,
  Clock, LogIn, LogOut as LogOutIcon,
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

const PAGE_MAP = {
  dashboard: Dashboard, tables: Tables, orders: Orders, kitchen: Kitchen,
  billing: Billing, inventory: Inventory, users: Users, reports: Reports,
  settings: Settings, shifts: Shifts, audit: Audit, notifications: Notifications,
  supervisor: Supervisor, company: Company, receipts: Receipts,
  invoices: Invoices, menu: MenuManagement,
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
  invoices: FileText,
  notifications: Bell,
}

export default function Layout() {
  const { user, logout, lang, setLang, theme, setTheme, company, unreadCount, clockIn, clockOut, isClockedIn } = useApp()
  const [page, setPage] = useState(() => {
    const nav = ROLE_NAV[user?.role] || ['dashboard']
    return nav[0]
  })
  const [orderContext, setOrderContext] = useState({ tableId: null, tableNumber: null, isTakeaway: false })

  const nav = ROLE_NAV[user?.role] || []
  const PageComponent = PAGE_MAP[page] || Dashboard
  const roleInfo = ROLES[user?.role]
  const companyInitials = company.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  function navTo(p, ctx = null) {
    if (ctx) setOrderContext(ctx)
    setPage(p)
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-950 overflow-hidden">

      {/* SIDEBAR — dark professional */}
      <aside className="w-60 bg-slate-900 dark:bg-slate-950 flex flex-col flex-shrink-0 shadow-xl">

        {/* Brand */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg shadow-indigo-900/40">
              {companyInitials}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate leading-tight">{company.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">Point of Sale</div>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2.5 bg-white/5 rounded-xl px-3 py-2.5">
            <Avatar name={user?.full_name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{user?.full_name}</div>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleInfo?.color || 'bg-gray-700 text-gray-300'}`}>{roleInfo?.label}</span>
            </div>
          </div>
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
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white capitalize">{t(page, lang) || page}</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{company.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Clock In / Out button — visible to all staff */}
            <button
              onClick={isClockedIn ? clockOut : clockIn}
              title={isClockedIn ? 'Clock Out' : 'Clock In'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                isClockedIn
                  ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30'
                  : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
              }`}
            >
              <Clock size={13} />
              {isClockedIn ? 'Clock Out' : 'Clock In'}
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
            <button
              onClick={() => navTo('settings')}
              className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <SettingsIcon size={16} />
            </button>
            <div className="w-px h-6 bg-gray-100 dark:bg-gray-700 mx-1" />
            <Avatar name={user?.full_name} size="sm" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 animate-fadeIn">
          <PageComponent navTo={navTo} orderContext={orderContext} setOrderContext={setOrderContext} />
        </main>
      </div>
    </div>
  )
}
