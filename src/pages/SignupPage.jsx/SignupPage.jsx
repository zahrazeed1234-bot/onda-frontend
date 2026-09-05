import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiArrowLeft, FiCheckCircle, FiUserPlus } from 'react-icons/fi'
import { authApi } from '../api/endpoints.js'
import { Alert, Input, Spinner } from '../components/UI.jsx'

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', first_name: '', last_name: '', telephone: '', service: '', password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    try {
      await authApi.register(form)
      toast.success('Compte créé avec succès. Vous pouvez vous connecter.')
      navigate('/login', { replace: true })
    } catch (err) {
      const data = err?.response?.data
      const message = data ? Object.values(data).flat().join(' ') : 'Impossible de créer le compte.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-onda-blue via-onda-blue2 to-onda-accent p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl p-8 md:p-10">
        <div className="flex items-center justify-between mb-6"><Link to="/login" className="text-sm text-slate-500 hover:text-onda-blue flex items-center gap-2"><FiArrowLeft /> Retour à la connexion</Link><img src="/onda.svg" alt="ONDA" className="w-12 h-12" /></div>
        <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><FiUserPlus className="text-onda-blue" /> Créer un compte</h1><p className="mt-2 text-sm text-slate-500">L’inscription publique crée automatiquement un profil <b>Consultant</b> avec un accès en lecture seule.</p></div>
        {error && <Alert variant="danger" title="Inscription impossible">{error}</Alert>}
        <form onSubmit={submit} className="mt-5 grid md:grid-cols-2 gap-4">
          <Input label="Identifiant" value={form.username} onChange={update('username')} required />
          <Input label="E-mail" type="email" value={form.email} onChange={update('email')} required />
          <Input label="Prénom" value={form.first_name} onChange={update('first_name')} required />
          <Input label="Nom" value={form.last_name} onChange={update('last_name')} required />
          <Input label="Téléphone" value={form.telephone} onChange={update('telephone')} />
          <Input label="Service" value={form.service} onChange={update('service')} />
          <Input label="Mot de passe" type="password" value={form.password} onChange={update('password')} minLength={8} required />
          <Input label="Confirmer le mot de passe" type="password" value={form.confirm_password} onChange={update('confirm_password')} minLength={8} required />
          <div className="md:col-span-2 flex items-center gap-2 text-xs text-slate-500"><FiCheckCircle className="text-emerald-500" /> Votre rôle sera limité à Consultant, sans accès aux fonctions d’administration.</div>
          <button type="submit" disabled={loading} className="md:col-span-2 btn-primary justify-center py-2.5">{loading ? <><Spinner /> Création...</> : <><FiUserPlus /> S’inscrire</>}</button>
        </form>
      </div>
    </div>
  )
}
