import React from 'react'
import { Link } from 'react-router-dom'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl font-black text-red-500">403</div>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Accès refusé</h1>
        <p className="mt-2 text-slate-500">
          Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
          Veuillez contacter un administrateur CNS.
        </p>
        <Link to="/dashboard" className="btn-primary mt-6 inline-flex">
          ← Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}
