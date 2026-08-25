import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function PrivateRoute({ children, roles }) {
  const { isAuthenticated, loading, hasRole, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-10 w-10 border-4 border-onda-blue border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-slate-500 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && roles.length > 0 && !hasRole(roles) && !user?.is_superuser) {
    return <Navigate to="/403" replace />
  }

  return children
}
