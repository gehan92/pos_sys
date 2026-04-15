import { useState } from 'react'
import { useApp, ROLES } from '../context/AppContext'
import { t } from '../i18n/translations'
import { Btn, Input, Select } from '../components/UI'
import { ShieldCheck, UtensilsCrossed } from 'lucide-react'

export default function Login() {
  const { login, lang, setLang, company } = useApp()
  const [username, setUsername] = useState('superadmin')
  const [password, setPassword] = useState('Admin@1234')
  const [role, setRole] = useState('superadmin')
  const [error, setError] = useState('')

  function handleLogin() {
    const result = login(username, password, role)
    if (!result.success) setError('Invalid credentials. Try default: Admin@1234')
    else setError('')
  }

  const initials = company.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">

      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)', backgroundSize: '28px 28px' }}
      />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative animate-fadeInUp">
        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-white/10 shadow-2xl shadow-black/30 p-8">

          {/* Logo */}
          <div className="text-center mb-7">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-xl font-extrabold shadow-lg shadow-indigo-500/40 select-none">
              {initials}
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">{company.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 flex items-center justify-center gap-1.5">
              <UtensilsCrossed size={13} className="text-indigo-400" />
              Restaurant Point of Sale
            </p>
          </div>

          {/* Language switcher */}
          <div className="flex gap-2 justify-center mb-6">
            {['en', 'mt', 'it'].map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  lang === l
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="space-y-0">
            <Input
              label={t('username', lang)}
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
            />
            <Input
              label={t('password', lang)}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            <Select
              label={t('loginAs', lang)}
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              {Object.entries(ROLES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </Select>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-100 dark:border-rose-800 font-medium">
              {error}
            </div>
          )}

          <Btn variant="primary" fullWidth size="lg" onClick={handleLogin} className="mt-1">
            <ShieldCheck size={15} />
            {t('signIn', lang)}
          </Btn>

          {/* Demo hint */}
          <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Demo credentials</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Any username · Password:{' '}
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">Admin@1234</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-5">
          Malta POS v1.0 · © {new Date().getFullYear()} {company.name}
        </p>
      </div>
    </div>
  )
}

