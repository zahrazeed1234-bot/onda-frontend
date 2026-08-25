import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './router/PrivateRoute.jsx'
import AppShell from './components/AppShell.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ForbiddenPage from './pages/ForbiddenPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import EquipmentsPage from './pages/EquipmentsPage.jsx'
import TicketsPage from './pages/TicketsPage.jsx'
import TicketFormPage from './pages/TicketFormPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import AuditPage from './pages/AuditPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route path="/" element={<PrivateRoute><AppShell><Navigate to="/dashboard" replace /></AppShell></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><AppShell><DashboardPage /></AppShell></PrivateRoute>} />
      <Route path="/equipments" element={<PrivateRoute><AppShell><EquipmentsPage /></AppShell></PrivateRoute>} />
      <Route path="/tickets" element={<PrivateRoute><AppShell><TicketsPage /></AppShell></PrivateRoute>} />
      <Route path="/tickets/create" element={<PrivateRoute roles={['ADMIN_CNS', 'TECHNICIAN_MAINTENANCE']}><AppShell><TicketFormPage /></AppShell></PrivateRoute>} />
      <Route path="/tickets/edit/:id" element={<PrivateRoute roles={['ADMIN_CNS', 'TECHNICIAN_MAINTENANCE']}><AppShell><TicketFormPage /></AppShell></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute roles={['ADMIN_CNS']}><AppShell><UsersPage /></AppShell></PrivateRoute>} />
      <Route path="/audit" element={<PrivateRoute roles={['ADMIN_CNS']}><AppShell><AuditPage /></AppShell></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
