import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiLock, FiUser, FiAlertTriangle } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext.jsx'
import { Alert, Input, Spinner } from '../components/UI.jsx'

export default function LoginPage() {
 const { login, isAuthenticated } = useAuth()
 const navigate = useNavigate()
 const location = useLocation()
 const redirect = location.state?.from?.pathname || '/dashboard'
 const [username, setUsername] = useState('')
 const [password, setPassword] = useState('')
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState('')
 if (isAuthenticated) navigate(redirect, { replace: true })
 const onSubmit = async (event) => {
  event.preventDefault()
  if (!username || !password) { setError('Veuillez saisir votre identifiant et mot de passe.'); return }
  setLoading(true); setError('')
  try { await login(username, password); navigate(redirect, { replace: true }) }
  catch (err) { const detail = err?.response?.data?.detail || 'Identifiants incorrects.'; setError(detail); toast.error(detail) }
  finally { setLoading(false) }
 }
 return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-onda-blue via-onda-blue2 to-onda-accent p-4"><div className="w-full max-w-5xl grid md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl bg-white"><div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-onda-blue to-slate-800 text-white"><div className="flex items-center gap-3"><img src="/onda.svg" alt="ONDA" className="w-12 h-12"/><div><b className="text-lg">ONDA</b><p className="text-xs text-sky-200">Aéroport International Fès-Saïss</p></div></div><div><h1 className="text-3xl font-bold">GMAO - Systèmes CNS</h1><p className="mt-3 text-sky-100 text-sm">Application de gestion de maintenance des équipements Communication, Navigation et Surveillance.</p></div><p className="text-xs text-sky-300">Projet de stage SCSI • 2026</p></div><div className="p-8 md:p-10 flex flex-col justify-center"><div className="md:hidden mb-6 text-center"><img src="/onda.svg" alt="ONDA" className="w-14 h-14 mx-auto"/><h2 className="mt-2 font-bold text-lg">GMAO CNS - ONDA Fès</h2></div><h2 className="text-2xl font-bold text-slate-900">Connexion</h2><p className="mt-1 text-sm text-slate-500">Accédez à la console de gestion maintenance.</p><form onSubmit={onSubmit} className="mt-6 space-y-4">{error&&<Alert variant="danger" icon={<FiAlertTriangle />} title="Erreur d’authentification">{error}</Alert>}<Input label="Identifiant" icon={<FiUser />} value={username} onChange={setUsername} required/><Input label="Mot de passe" type="password" icon={<FiLock />} value={password} onChange={setPassword} required/><button type="submit" disabled={loading} className="w-full btn-primary justify-center py-2.5">{loading?<><Spinner/> Authentification...</>:<><FiLock/> Se connecter</>}</button></form><div className="mt-6 pt-5 border-t border-slate-100 text-center"><p className="text-sm text-slate-500">Vous n’avez pas encore de compte ?</p><Link to="/signup" className="mt-2 inline-block font-semibold text-onda-blue hover:underline">Créer un compte</Link></div></div></div></div>
}
