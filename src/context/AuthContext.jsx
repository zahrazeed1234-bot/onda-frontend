import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { toast } from 'react-toastify'
import { authApi } from '../api/endpoints.js'
import { logoutUser } from '../api/client.js'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function getUserFromStorage() {
  try {
    const raw = localStorage.getItem('user_info')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUserFromStorage())
  const [loading, setLoading] = useState(true)

  const isAuthenticated = useMemo(() => !!user && !!localStorage.getItem('access_token'), [user])

  const hasRole = (roleOrRoles) => {
    if (!user?.role) return false
    const list = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles]
    return list.includes(user.role)
  }

  const isAdmin = useMemo(() => hasRole(['ADMIN_CNS']) || user?.is_superuser, [user])
  const isTechnician = useMemo(() => hasRole(['TECHNICIAN_MAINTENANCE']), [user])
  const canWrite = useMemo(() => isAdmin || isTechnician, [isAdmin, isTechnician])

  const loadMe = async () => {
    try {
      const { data } = await authApi.me()
      setUser(data)
      localStorage.setItem('user_info', JSON.stringify(data))
      return data
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const access = localStorage.getItem('access_token')
    if (access) {
      try {
        const decoded = jwtDecode(access)
        const exp = decoded.exp * 1000
        if (exp > Date.now()) {
          loadMe()
          return
        }
      } catch { /* ignore */ }
    }
    logoutUser()
    setUser(null)
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const { data } = await authApi.login({ username, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    const me = await loadMe()
    toast.success(`Bienvenue ${me?.first_name || me?.username || username} !`)
  }

  const logout = () => {
    logoutUser()
    setUser(null)
    toast.info('Vous avez été déconnecté.')
  }

  const value = { user, setUser, loading, isAuthenticated, isAdmin, isTechnician, canWrite, hasRole, login, logout, refresh: loadMe }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
