import React, { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  FiHome, FiRadio, FiList, FiUsers, FiFileText, FiLogOut, FiMenu, FiX, FiShield,
} from 'react-icons/fi'

const menu = [
  { to: '/dashboard', label: 'Tableau de bord', icon: <FiHome size={18} /> },
  { to: '/equipments', label: 'Équipements CNS', icon: <FiRadio size={18} /> },
  { to: '/tickets', label: 'Tickets maintenance', icon: <FiList size={18} /> },
  { to: '/users', label: 'Utilisateurs', icon: <FiUsers size={18} />, roles: ['ADMIN_CNS'] },
  { to: '/audit', label: 'Journal d\'audit', icon: <FiShield size={18} />, roles: ['ADMIN_CNS'] },
]

export default function AppShell({ children }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = (user?.first_name?.[0] || '') + (user?.last_name?.[0] || user?.username?.[0] || '?').toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside
        className={clsx(
          'fixed md:static inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-onda-blue to-onda-blue2 text-white transition-transform md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-3 h-16 px-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center">
            <img src="/onda.svg" alt="ONDA" className="w-7 h-7" />
          </div>
          <div>
            <p className="font-semibold leading-tight">GMAO CNS</p>
            <p className="text-xs text-sky-200">ONDA Fès-Saïss</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden ml-auto text-white/80 hover:text-white">
            <FiX size={20} />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {menu.filter((m) => !m.roles || isAdmin).map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.to === '/dashboard'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx('sidebar-item', isActive ? 'sidebar-item-active' : 'sidebar-item-inactive')
              }
            >
              {m.icon}
              <span>{m.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10">
          <div className="text-xs text-sky-200 mb-2">{user?.role_label || 'Rôle'}</div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10">
            <div className="w-9 h-9 rounded-full bg-onda-accent text-white flex items-center justify-center font-bold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name || user?.username}</p>
              <p className="text-xs text-sky-200 truncate">{user?.email || ''}</p>
            </div>
            <button onClick={handleLogout} title="Déconnexion" className="text-sky-200 hover:text-white">
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-20 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded hover:bg-slate-100 text-slate-600">
              <FiMenu size={20} />
            </button>
            <div className="hidden md:block text-sm text-slate-500">
              <span className="text-slate-700 font-medium">Systèmes Communiquants & Surveillance</span> • GMAO
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/tickets/create" className="btn-primary">
              <FiFileText size={16} /> Nouveau Ticket
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
        <footer className="px-6 py-3 text-xs text-slate-400 text-center border-t border-slate-200 bg-white">
          © {new Date().getFullYear()} ONDA - Aéroport Fès-Saïss • GMAO CNS • MVP Stagiaire SCSI
        </footer>
      </div>
    </div>
  )
}
