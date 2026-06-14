// ─────────────────────────────────────────────────────────────────────────────
// Badge  — colored pill label, optionally with a status dot
// props: color = blue | green | red | yellow | orange | purple | gray | indigo
// ─────────────────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'blue', dot = false }) {
  const backgroundByColor = {
    blue:   'bg-blue-50   dark:bg-blue-900/30   text-blue-700   dark:text-blue-300   ring-blue-600/20',
    green:  'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20',
    red:    'bg-rose-50   dark:bg-rose-900/30   text-rose-700   dark:text-rose-300   ring-rose-600/20',
    yellow: 'bg-amber-50  dark:bg-amber-900/30  text-amber-700  dark:text-amber-300  ring-amber-600/20',
    orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 ring-orange-600/20',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-purple-600/20',
    gray:   'bg-gray-50   dark:bg-gray-700      text-gray-600   dark:text-gray-300   ring-gray-500/20',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 ring-indigo-600/20',
  }

  const dotColorByColor = {
    blue: 'bg-blue-500',   green: 'bg-emerald-500', red: 'bg-rose-500',
    yellow: 'bg-amber-500', orange: 'bg-orange-500', purple: 'bg-purple-500',
    gray: 'bg-gray-400',   indigo: 'bg-indigo-500',
  }

  const pillClasses = `inline-flex items-center gap-1 px-2.5 py-0.5
    rounded-full text-xs font-semibold ring-1 ring-inset
    ${backgroundByColor[color] ?? backgroundByColor.blue}`

  return (
    <span className={pillClasses}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColorByColor[color] ?? dotColorByColor.blue}`} />
      )}
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Btn  — universal button
// props: variant = default | primary | success | danger | warning | ghost
//        size    = sm | md | lg
// ─────────────────────────────────────────────────────────────────────────────
export function Btn({
  children,
  variant   = 'default',
  size      = 'md',
  onClick,
  disabled,
  className = '',
  type      = 'button',
  fullWidth,
}) {
  const baseClasses = [
    'inline-flex items-center justify-center gap-1.5',
    'font-semibold rounded-xl',
    'transition-all duration-150 active:scale-[.97]',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
  ].join(' ')

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2   text-sm',
    lg: 'px-5 py-2.5 text-sm',
  }

  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm focus-visible:ring-gray-400',
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30 focus-visible:ring-indigo-500',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30 focus-visible:ring-emerald-500',
    danger:  'bg-rose-500   text-white hover:bg-rose-600   shadow-sm shadow-rose-200   dark:shadow-rose-900/30   focus-visible:ring-rose-500',
    warning: 'bg-amber-500  text-white hover:bg-amber-600  shadow-sm focus-visible:ring-amber-500',
    ghost:   'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:ring-gray-400',
  }

  const computedClass = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ')

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={computedClass}>
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Card  — white rounded container
// ─────────────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', padding = true }) {
  return (
    <div
      className={[
        'bg-white dark:bg-gray-800',
        'border border-gray-100 dark:border-gray-700/60',
        'rounded-2xl shadow-card',
        padding ? 'p-5' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// StatCard  — KPI tile with icon, big number, label, and optional sub-text
// props: accentColor = indigo | emerald | amber | rose | blue | purple
// ─────────────────────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  sub,
  subColor    = 'text-emerald-600 dark:text-emerald-400',
  icon,
  accentColor = 'indigo',
}) {
  const iconBgByColor = {
    indigo:  'bg-indigo-100  dark:bg-indigo-900/40  text-indigo-600  dark:text-indigo-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    amber:   'bg-amber-100   dark:bg-amber-900/40   text-amber-600   dark:text-amber-400',
    rose:    'bg-rose-100    dark:bg-rose-900/40    text-rose-600    dark:text-rose-400',
    blue:    'bg-blue-100    dark:bg-blue-900/40    text-blue-600    dark:text-blue-400',
    purple:  'bg-purple-100  dark:bg-purple-900/40  text-purple-600  dark:text-purple-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl shadow-card p-5 flex items-start gap-4">
      {icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${iconBgByColor[accentColor] ?? iconBgByColor.indigo}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
          {label}
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {value}
        </div>
        {sub && (
          <div className={`text-xs mt-1.5 font-medium ${subColor}`}>{sub}</div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Form inputs  — Input / Select / Textarea — all share the same style
// ─────────────────────────────────────────────────────────────────────────────
const fieldClass =
  'w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm ' +
  'bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white ' +
  'placeholder-gray-400 dark:placeholder-gray-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm'

const labelClass =
  'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide'

export function Input({ label, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className={labelClass}>{label}</label>}
      <input className={fieldClass} {...props} />
    </div>
  )
}

export function Select({ label, children, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className={labelClass}>{label}</label>}
      <select className={fieldClass} {...props}>
        {children}
      </select>
    </div>
  )
}

export function Textarea({ label, ...props }) {
  return (
    <div className="mb-4">
      {label && <label className={labelClass}>{label}</label>}
      <textarea className={`${fieldClass} resize-none`} rows={3} {...props} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Table / TR / TD  — simple data table building blocks
// ─────────────────────────────────────────────────────────────────────────────
export function Table({ headers, children }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-100 dark:border-gray-700">
            {headers.map(header => (
              <th
                key={header}
                className="text-left px-4 py-3 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function TR({ children, onClick, className = '' }) {
  return (
    <tr
      onClick={onClick}
      className={[
        'border-b border-gray-50 dark:border-gray-700/50 last:border-0',
        'hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors',
        onClick ? 'cursor-pointer' : '',
        className,
      ].join(' ')}
    >
      {children}
    </tr>
  )
}

export function TD({ children, className = '' }) {
  return (
    <td className={`px-4 py-3 text-gray-700 dark:text-gray-300 ${className}`}>
      {children}
    </td>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar  — circle with initials, color based on first letter of name
// ─────────────────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 'sm' }) {
  // Take first letter of each word, max 2 characters → "John Doe" → "JD"
  const initials = name
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'

  const sizeClasses = {
    sm: 'w-8  h-8  text-xs',
    md: 'w-9  h-9  text-sm',
    lg: 'w-12 h-12 text-base',
  }

  const gradients = [
    'bg-gradient-to-br from-indigo-400 to-indigo-600',
    'bg-gradient-to-br from-violet-400 to-violet-600',
    'bg-gradient-to-br from-emerald-400 to-emerald-600',
    'bg-gradient-to-br from-rose-400 to-rose-600',
    'bg-gradient-to-br from-amber-400 to-amber-600',
    'bg-gradient-to-br from-sky-400 to-sky-600',
    'bg-gradient-to-br from-pink-400 to-pink-600',
  ]

  // Pick a consistent gradient based on the first character of the name
  const gradientIndex = (name?.charCodeAt(0) ?? 0) % gradients.length

  return (
    <div
      className={[
        sizeClasses[size],
        'rounded-full text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm',
        gradients[gradientIndex],
      ].join(' ')}
    >
      {initials}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionLabel  — small all-caps section heading
// ─────────────────────────────────────────────────────────────────────────────
export function SectionLabel({ children }) {
  return (
    <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Divider  — horizontal separator line
// ─────────────────────────────────────────────────────────────────────────────
export function Divider() {
  return <div className="h-px bg-gray-100 dark:bg-gray-700 my-4" />
}

// ─────────────────────────────────────────────────────────────────────────────
// statusColor  — maps an order/table status string to a Badge color name
// ─────────────────────────────────────────────────────────────────────────────
export function statusColor(status) {
  const colorMap = {
    pending:       'yellow',
    active:        'green',
    cooking:       'blue',
    ready:         'green',
    paid:          'green',
    free:          'green',
    occupied:      'red',
    billed:        'purple',
    approved:      'blue',
    delivered:     'green',
    rejected:      'red',
    suspended:     'red',
    'on-duty':     'green',
    break:         'yellow',
    served:        'orange',
    completed:     'indigo',
    bill_requested: 'orange',
  }
  return colorMap[status] ?? 'gray'
}
