import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiLock, FiUser, FiAlertTriangle } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext.jsx'
import { Alert, Card, Input, Spinner } from '../components/UI.jsx'

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirect = location.state?.from?.pathname || '/dashboard'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) {
    navigate(redirect, { replace: true })
  }

  const quickFill = (u, p) => {
    setUsername(u); setPassword(p)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Veuillez saisir votre identifiant et mot de passe.')
      return
    }
    setLoading(true); setError('')
    try {
      await login(username, password)
      navigate(redirect, { replace: true })
    } catch (err) {
      const detail = err?.response?.data?.detail
      setError(detail || 'Identifiants incorrects.')
      toast.error(detail || 'Échec de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-onda-blue via-onda-blue2 to-onda-accent p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl bg-white">
        <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-onda-blue to-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <img src="/onda.svg" alt="ONDA" className="w-9 h-9" />
            </div>
            <div>
              <p className="font-bold text-lg">ONDA</p>
              <p className="text-xs text-sky-200">Aéroport International Fès-Saïss</p>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold leading-tight">GMAO - Systèmes CNS</h1>
            <p className="mt-3 text-sky-100 text-sm leading-relaxed">
              Application de Gestion de Maintenance Assistée par Ordinateur dédiée
              aux équipements critiques <b>Communication - Navigation - Surveillance</b>.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-sky-100">
              <li className="flex items-start gap-2"><span>✈️</span>Suivi VOR / ILS / DME conformes OACI Annexe 10</li>
              <li className="flex items-start gap-2"><span>📡</span>Gestion Radars PSR/SSR/ADS-B & VCS ED-137 VoIP</li>
              <li className="flex items-start gap-2"><span>🔧</span>Tickets de maintenance & checklists intelligentes</li>
              <li className="flex items-start gap-2"><span>🛡️</span>RBAC, JWT & journal d'audit complet</li>
            </ul>
          </div>
          <p className="text-xs text-sky-300">Projet de stage SCSI • 2026</p>
        </div>
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="md:hidden mb-6 text-center">
            <img src="/onda.svg" alt="ONDA" className="w-14 h-14 mx-auto" />
            <h2 className="mt-2 font-bold text-lg text-slate-900">GMAO CNS - ONDA Fès</h2>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Connexion</h2>
          <p className="mt-1 text-sm text-slate-500">Accédez à la console de gestion maintenance.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {error && (
              <Alert variant="danger" icon={<FiAlertTriangle />} title="Erreur d'authentification">
                {error}
              </Alert>
            )}
            <Input
              label="Identifiant"
              icon={<FiUser />}
              value={username}
              onChange={setUsername}
              placeholder="admin_cns ou tech_maint_1"
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5"
            >
              {loading ? <><Spinner /> Authentification...</> : (<><FiLock /> Se connecter</>)}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2">COMPTES DE DÉMONSTRATION</p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <button type="button" onClick={() => quickFill('admin_cns', 'Admin@2026!')}
                      className="flex justify-between items-center p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left">
                <div>
                  <p className="font-medium text-slate-800">Administrateur CNS</p>
                  <p className="text-slate-500">admin_cns / Admin@2026!</p>
                </div>
                <span className="badge-info badge">Super Admin</span>
              </button>
              <button type="button" onClick={() => quickFill('tech_maint_1', 'Tech@2026!')}
                      className="flex justify-between items-center p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left">
                <div>
                  <p className="font-medium text-slate-800">Technicien Maintenance</p>
                  <p className="text-slate-500">tech_maint_1 / Tech@2026!</p>
                </div>
                <span className="badge badge-info">Lecture + Écriture</span>
              </button>
              <button type="button" onClick={() => quickFill('consultant_safety', 'Cons@2026!')}
                      className="flex justify-between items-center p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left">
                <div>
                  <p className="font-medium text-slate-800">Consultant / Auditeur</p>
                  <p className="text-slate-500">consultant_safety / Cons@2026!</p>
                </div>
                <span className="badge badge-info">Lecture seule</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
