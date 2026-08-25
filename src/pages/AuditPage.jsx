import React, { useEffect, useMemo, useState } from 'react'
import { FiShield, FiAlertTriangle } from 'react-icons/fi'
import { auditApi } from '../api/endpoints.js'
import { useAuth } from '../context/AuthContext.jsx'
import {
  Alert, Badge, Card, DataTable, EmptyState, Input, KpiCard, PageHeader,
  SelectField, Spinner,
} from '../components/UI.jsx'

const ACTION_BADGE = {
  LOGIN: 'ok', LOGOUT: 'info', LOGIN_FAILED: 'hs',
  CREATE: 'info', UPDATE: 'moyenne', DELETE: 'critique',
  FREQUENCY_CHANGE: 'critique', ASSIGNATION_TICKET: 'haute',
  TICKET_RESOLU: 'ok', TICKET_CLOTURE: 'ok',
  USER_CREATED: 'haute', PERMISSION_CHANGED: 'critique',
}

export default function AuditPage() {
  const { isAdmin } = useAuth()
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')
  const [days, setDays] = useState('7')

  const load = async () => {
    setLoading(true)
    try {
      const params = { limit: 200 }
      if (action) params.action = action
      if (search) params.search = search
      const [list, sum] = await Promise.all([
        auditApi.list(params),
        auditApi.summary({ days }),
      ])
      setRows(Array.isArray(list.data?.results) ? list.data.results : Array.isArray(list.data) ? list.data : [])
      setSummary(sum.data)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [search, action, days]) // eslint-disable-line

  if (!isAdmin) {
    return (
      <div className="py-20">
        <div className="text-center max-w-xl mx-auto">
          <FiShield size={64} className="mx-auto text-red-500 opacity-60" />
          <h2 className="mt-4 text-xl font-bold">Accès interdit</h2>
          <p className="mt-2 text-slate-500">Le journal d'audit est strictement réservé aux administrateurs CNS.</p>
        </div>
      </div>
    )
  }

  const actionOptions = useMemo(() => [
    { value: 'LOGIN', label: 'Connexion réussie' },
    { value: 'LOGIN_FAILED', label: 'Échec connexion' },
    { value: 'CREATE', label: 'Création' },
    { value: 'UPDATE', label: 'Modification' },
    { value: 'DELETE', label: 'Suppression' },
    { value: 'FREQUENCY_CHANGE', label: 'Changement fréquence' },
    { value: 'ASSIGNATION_TICKET', label: 'Assignation ticket' },
  ], [])

  const columns = [
    { key: 'timestamp', label: 'Heure', render: (v) => <span className="text-xs text-slate-500 whitespace-nowrap">{new Date(v).toLocaleString('fr-FR')}</span> },
    { key: 'action', label: 'Action', render: (v, r) => <Badge variant={ACTION_BADGE[v] || 'info'}>{r.action_label || v}</Badge> },
    { key: 'utilisateur_info', label: 'Utilisateur', render: (v) => v ? <span className="text-sm">{v.full_name || v.username}</span> : <span className="text-slate-400 italic">Système</span> },
    { key: 'adresse_ip', label: 'IP' },
    { key: 'endpoint', label: 'API', render: (v) => <span className="text-xs text-slate-500 font-mono">{v || '—'}</span> },
    { key: 'description', label: 'Détails', render: (v) => <span className="text-sm">{v || '—'}</span> },
  ]

  return (
    <div>
      <PageHeader
        breadcrumb="Sécurité & Conformité"
        title="Journal d'audit"
        subtitle="Traçabilité de toutes les actions sensibles - conformité RBAC & OACI"
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <KpiCard label="Événements (période)" value={summary?.total ?? 0} icon={<FiShield />} accent="blue" />
        <KpiCard label="Connexions OK" value={summary?.connexions_reussies ?? 0} icon="🔓" accent="green" />
        <KpiCard label="Échecs connexions" value={summary?.connexions_echouees ?? 0} icon="🔒" accent="red" />
        <KpiCard label="Modif. fréquences" value={summary?.modifications_freq ?? 0} icon="📡" accent="amber" />
        <KpiCard label="Suppressions" value={summary?.suppressions ?? 0} icon={<FiAlertTriangle />} accent="red" />
      </div>

      <div className="card p-4 mb-4">
        <div className="grid md:grid-cols-4 gap-3">
          <Input label="Recherche" value={search} onChange={setSearch} placeholder="Description / IP / Utilisateur..." />
          <SelectField label="Action" value={action} onChange={setAction} options={actionOptions} />
          <SelectField label="Période (jours)" value={days} onChange={setDays} options={[
            { value: '1', label: 'Dernier 1 jour' }, { value: '7', label: 'Derniers 7 jours' }, { value: '30', label: 'Derniers 30 jours' },
          ]} />
        </div>
      </div>

      <Card title={`${rows.length} événements d'audit`}
            actions={<Badge variant="critique">Lecture seule - Non modifiable</Badge>}>
        {loading ? <div className="py-10 text-center"><Spinner /></div> :
          rows.length === 0 ? <EmptyState icon="🛡️" subtitle="Aucun événement sur la période sélectionnée." />
            : <DataTable columns={columns} rows={rows} />
        }
      </Card>
    </div>
  )
}
