import React from 'react'
import clsx from 'clsx'

export function Badge({ variant = 'info', children, className = '' }) {
  const map = {
    ok: 'badge-ok', degrade: 'badge-degrade', hs: 'badge-hs', info: 'badge-info',
    basse: 'badge-basse', moyenne: 'badge-moyenne', haute: 'badge-haute', critique: 'badge-critique',
  }
  return <span className={clsx(map[variant] || 'badge-info', className)}>{children}</span>
}

export function StatusBadge({ status }) {
  const map = { OK: 'ok', DEGRADE: 'degrade', HS: 'hs' }
  const labels = { OK: 'Opérationnel', DEGRADE: 'Dégradé', HS: 'Hors service' }
  return <Badge variant={map[status] || 'info'}>{labels[status] || status}</Badge>
}

export function PriorityBadge({ priority }) {
  const map = { BASSE: 'basse', MOYENNE: 'moyenne', HAUTE: 'haute', CRITIQUE: 'critique' }
  const labels = { BASSE: 'Basse', MOYENNE: 'Moyenne', HAUTE: 'Haute', CRITIQUE: 'Critique' }
  return <Badge variant={map[priority] || 'info'}>{labels[priority] || priority}</Badge>
}

export function TicketTypeBadge({ type }) {
  const map = {
    PREVENTIVE: 'info', CORRECTIVE: 'moyenne', URGENCE: 'critique',
  }
  const labels = {
    PREVENTIVE: 'Préventive', CORRECTIVE: 'Corrective', URGENCE: 'Urgence',
  }
  return <Badge variant={map[type] || 'info'}>{labels[type] || type}</Badge>
}

export function Alert({ variant = 'info', title, children, icon }) {
  const variants = {
    danger: 'alert-danger', warning: 'alert-warning', info: 'alert-info', success: 'alert-success',
  }
  return (
    <div className={variants[variant] || 'alert-info'}>
      {icon && <span className="text-xl shrink-0 mt-0.5">{icon}</span>}
      <div className="flex-1">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  )
}

export function Card({ title, actions, children, className = '', bodyClassName = '' }) {
  return (
    <div className={clsx('card', className)}>
      {title && (
        <div className="card-header">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={clsx('card-body', bodyClassName)}>{children}</div>
    </div>
  )
}

export function KpiCard({ label, value, icon, trend, accent = 'blue', footer }) {
  const accents = {
    blue: 'text-onda-blue bg-blue-50',
    green: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
  }
  return (
    <div className="kpi-card">
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {trend && <div className={clsx('mt-2 text-xs font-medium', trend > 0 ? 'text-emerald-600' : 'text-red-600')}>{trend}</div>}
        {footer && <div className="mt-2 text-xs text-slate-500">{footer}</div>}
      </div>
      <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center text-2xl', accents[accent] || accents.blue)}>
        {icon}
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-3xl', lg: 'max-w-5xl', xl: 'max-w-7xl' }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={clsx('modal', sizes[size])} onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function DataTable({ columns, rows, emptyText = 'Aucune donnée', rowKey = 'id', onRowClick, className = '' }) {
  return (
    <div className={clsx('table-wrapper', className)}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.width ? `w-[${c.width}]` : ''} style={c.width ? { width: c.width } : {}}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-10 text-slate-400">{emptyText}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row[rowKey] ?? Math.random()} className={onRowClick ? 'cursor-pointer' : ''} onClick={() => onRowClick?.(row)}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key] ?? '-'}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        {breadcrumb && <div className="text-xs text-slate-400 mb-1">{breadcrumb}</div>}
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

export function Field({ label, required, children, error, hint }) {
  return (
    <div>
      <label className="label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function SelectField({ label, required, options, value, onChange, placeholder = 'Sélectionner...', error }) {
  return (
    <Field label={label} required={required} error={error}>
      <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  )
}

export function Input({ label, type = 'text', required, value, onChange, placeholder, error, hint, disabled, icon }) {
  return (
    <Field label={label} required={required} error={error} hint={hint}>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</div>}
        <input
          type={type}
          className={icon ? "input pl-10" : "input"}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
        />
      </div>
    </Field>
  )
}

export function Textarea({ label, required, value, onChange, placeholder, rows = 4, error }) {
  return (
    <Field label={label} required={required} error={error}>
      <textarea
        rows={rows}
        className="input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </Field>
  )
}

export function Checkbox({ label, checked, onChange, disabled }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
      <input type="checkbox" disabled={disabled} checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-onda-blue focus:ring-onda-blue" />
      <span className="text-slate-700">{label}</span>
    </label>
  )
}

export function EmptyState({ title = 'Aucune donnée', subtitle, icon = '📭' }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <div className="text-5xl mb-3 opacity-60">{icon}</div>
      <h4 className="text-lg font-semibold text-slate-700">{title}</h4>
      {subtitle && <p className="mt-1 text-sm text-slate-500 max-w-md">{subtitle}</p>}
    </div>
  )
}

export function Spinner({ className = '' }) {
  return (
    <div className="inline-block h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
  )
}
