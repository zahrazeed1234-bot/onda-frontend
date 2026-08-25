import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { FiPlus, FiShield, FiKey, FiTrash2 } from 'react-icons/fi'
import { authApi } from '../api/endpoints.js'
import { useAuth } from '../context/AuthContext.jsx'
import {
  Badge, Card, DataTable, EmptyState, Input, Modal, PageHeader,
  SelectField, Spinner, Checkbox,
} from '../components/UI.jsx'

const ROLE_CHOICES = [
  { value: 'ADMIN_CNS', label: 'Administrateur CNS', variant: 'critique' },
  { value: 'TECHNICIAN_MAINTENANCE', label: 'Technicien Maintenance', variant: 'haute' },
  { value: 'CONSULTANT', label: 'Consultant', variant: 'info' },
]

export default function UsersPage() {
  const { isAdmin } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [form, setForm] = useState({})
  const [pwd, setPwd] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (roleFilter) params.role = roleFilter
      if (search) params.search = search
      const { data } = await authApi.listUsers(params)
      setRows(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [roleFilter, search]) // eslint-disable-line

  if (!isAdmin) {
    return (
      <div className="py-20">
        <div className="text-center max-w-xl mx-auto">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold">Accès restreint</h2>
          <p className="mt-2 text-slate-500">La gestion des utilisateurs est réservée aux administrateurs CNS.</p>
        </div>
      </div>
    )
  }

  const reset = () => {
    setForm({
      username: '', email: '', first_name: '', last_name: '', role: 'TECHNICIAN_MAINTENANCE',
      telephone: '', service: '', matricule: '', password: '', confirm_password: '',
    })
    setPwd({ userId: null, old_password: '', new_password: '', confirm_new_password: '' })
  }

  useEffect(() => { reset() }, [])

  const create = async () => {
    try {
      await authApi.createUser(form)
      toast.success('Utilisateur créé')
      setOpenCreate(false)
      reset()
      load()
    } catch { /* already alerted */ }
  }

  const changePwd = async () => {
    if (!pwd.userId) { toast.error('Sélectionnez un utilisateur'); return }
    if (pwd.new_password !== pwd.confirm_new_password) { toast.error('Mots de passe différents'); return }
    if (pwd.new_password.length < 6) { toast.error('Mot de passe trop court'); return }
    try {
      await authApi.changePassword(pwd.userId, pwd)
      toast.success('Mot de passe modifié')
      setPwd({ ...pwd, open: false })
    } catch { /* already */ }
  }

  const columns = [
    { key: 'username', label: 'Identifiant' },
    { key: 'full_name', label: 'Nom complet', render: (v, r) => v || <span className="text-slate-400 italic">—</span> },
    { key: 'email', label: 'Email' },
    { key: 'service', label: 'Service' },
    { key: 'role', label: 'Rôle', render: (v) => {
      const choice = ROLE_CHOICES.find((r) => r.value === v)
      return <Badge variant={choice?.variant || 'info'}>{choice?.label || v}</Badge>
    } },
    { key: 'is_active', label: 'Actif', render: (v) => v ? <span className="badge-ok badge">Actif</span> : <span className="badge-hs badge">Inactif</span> },
    { key: 'id', label: 'Actions', render: (v, r) => (
      <div className="flex gap-1">
        <button className="btn-secondary !py-1 !px-2 text-xs" onClick={() => setPwd({ ...pwd, userId: v, open: true, user: r })}><FiKey /> MDP</button>
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader
        breadcrumb="Administration RBAC"
        title="Utilisateurs & Rôles"
        subtitle="Gestion des comptes et groupes RBAC (Admin_CNS, Technicien_Maintenance, Consultant)"
        actions={<button className="btn-primary" onClick={() => setOpenCreate(true)}><FiPlus /> Nouvel utilisateur</button>}
      />

      <div className="card p-4 mb-4">
        <div className="grid md:grid-cols-3 gap-3">
          <Input label="Recherche" value={search} onChange={setSearch} placeholder="Nom / email / matricule..." />
          <SelectField label="Rôle" value={roleFilter} onChange={setRoleFilter} options={ROLE_CHOICES} />
        </div>
      </div>

      {loading ? <div className="py-10 text-center"><Spinner /></div> : <DataTable columns={columns} rows={rows} />}

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Nouvel utilisateur" size="lg" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpenCreate(false)}>Annuler</button>
          <button className="btn-primary" onClick={create}>Créer</button>
        </>
      }>
        <div className="grid md:grid-cols-2 gap-4">
          <Input label="Identifiant" required value={form.username} onChange={(v) => setForm({ ...form, username: v })} />
          <Input label="Email" type="email" required value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Input label="Prénom" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
          <Input label="Nom" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
          <SelectField label="Rôle" required value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={ROLE_CHOICES} />
          <Input label="Matricule" value={form.matricule} onChange={(v) => setForm({ ...form, matricule: v })} />
          <Input label="Téléphone" value={form.telephone} onChange={(v) => setForm({ ...form, telephone: v })} />
          <Input label="Service" value={form.service} onChange={(v) => setForm({ ...form, service: v })} />
          <Input label="Mot de passe" type="password" required value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
          <Input label="Confirmer mot de passe" type="password" required value={form.confirm_password} onChange={(v) => setForm({ ...form, confirm_password: v })} />
        </div>
      </Modal>

      <Modal open={!!pwd.open} onClose={() => setPwd({ ...pwd, open: false })} title={`Modifier mot de passe • ${pwd.user?.username || ''}`} size="sm" footer={
        <>
          <button className="btn-secondary" onClick={() => setPwd({ ...pwd, open: false })}>Annuler</button>
          <button className="btn-primary" onClick={changePwd}>Valider</button>
        </>
      }>
        <div className="space-y-3">
          <div className="text-xs text-slate-500">Laissez "Ancien mot de passe" vide si vous êtes administrateur.</div>
          <Input label="Ancien mot de passe (propriétaire)" type="password" value={pwd.old_password} onChange={(v) => setPwd({ ...pwd, old_password: v })} />
          <Input label="Nouveau mot de passe" type="password" value={pwd.new_password} onChange={(v) => setPwd({ ...pwd, new_password: v })} />
          <Input label="Confirmer" type="password" value={pwd.confirm_new_password} onChange={(v) => setPwd({ ...pwd, confirm_new_password: v })} />
        </div>
      </Modal>
    </div>
  )
}
