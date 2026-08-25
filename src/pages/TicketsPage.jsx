import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  FiPlus, FiFilter, FiSearch, FiEdit2, FiTrash2, FiUser,
  FiCheckCircle, FiClock, FiMessageSquare, FiAlertOctagon, FiArrowRight,
} from 'react-icons/fi'
import { ticketsApi, equipmentApi, authApi } from '../api/endpoints.js'
import { useAuth } from '../context/AuthContext.jsx'
import {
  Badge, Card, Checkbox, DataTable, EmptyState, Input, Modal, PageHeader,
  PriorityBadge, SelectField, Spinner, StatusBadge, Textarea, TicketTypeBadge, Alert, Field,
} from '../components/UI.jsx'

const STATUT_LABELS = {
  CREE: { l: 'Créé', c: 'badge-info' },
  ASSIGNE: { l: 'Assigné', c: 'badge-moyenne' },
  EN_COURS: { l: 'En cours', c: 'badge-haute' },
  RESOLU: { l: 'Résolu', c: 'badge-ok' },
  CLOTURE: { l: 'Clôturé', c: 'badge-degrade' },
}

export default function TicketsPage() {
  const { isAdmin, canWrite, user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fType, setFType] = useState('')
  const [fPriority, setFPriority] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fMine, setFMine] = useState(false)
  const [stats, setStats] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailTicket, setDetailTicket] = useState(null)
  const [comment, setComment] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [techs, setTechs] = useState([])
  const [newAssignee, setNewAssignee] = useState('')
  const [assigning, setAssigning] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (fType) params.type_ticket = fType
      if (fPriority) params.priorite = fPriority
      if (fStatus) params.statut = fStatus
      if (fMine) params.assigne_a = user.id
      const [{ data }, statsResp] = await Promise.all([
        ticketsApi.list(params),
        ticketsApi.stats(),
      ])
      setRows(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [])
      setStats(statsResp.data)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [fType, fPriority, fStatus, fMine, search]) // eslint-disable-line

  const onDeleteConfirm = async () => {
    if (!deleteId) return
    try {
      await ticketsApi.remove(deleteId)
      toast.success('Ticket supprimé')
      load()
    } finally {
      setDeleteId(null)
    }
  }

  const openDetail = async (id) => {
    setDetailOpen(true)
    setDetailTicket(null)
    setNewAssignee('')
    try {
      const [{ data: ticket }, { data: techList }] = await Promise.all([
        ticketsApi.get(id),
        authApi.listTechnicians(),
      ])
      setDetailTicket(ticket)
      setTechs(techList || [])
      setNewAssignee(ticket.assigne_a || '')
    } catch {
      const { data } = await ticketsApi.get(id)
      setDetailTicket(data)
    }
  }

  const doTransition = async (newStatus) => {
    try {
      await ticketsApi.transition(detailTicket.id, { nouveau_statut: newStatus, commentaire: '' })
      toast.success(`Ticket passé en statut: ${newStatus}`)
      const { data } = await ticketsApi.get(detailTicket.id)
      setDetailTicket(data)
      load()
    } catch { /* already alerted */ }
  }

  const doComment = async () => {
    if (!comment.trim()) return
    await ticketsApi.commenter(detailTicket.id, { commentaire: comment })
    const { data } = await ticketsApi.get(detailTicket.id)
    setDetailTicket(data); setComment('')
    toast.success('Commentaire ajouté')
  }

  const doAssign = async () => {
    if (!newAssignee || String(newAssignee) === String(detailTicket.assigne_a)) return
    setAssigning(true)
    try {
      await ticketsApi.assign({
        ticket_id: detailTicket.id,
        technicien_id: Number(newAssignee),
      })
      toast.success('Ticket réassigné')
      const { data } = await ticketsApi.get(detailTicket.id)
      setDetailTicket(data)
      load()
    } finally {
      setAssigning(false)
    }
  }

  const toggleChecklist = async (item, checked) => {
    const payload = { items: [{ id: item.id, est_effectue: checked }] }
    await ticketsApi.updateChecklist(detailTicket.id, payload)
    const { data } = await ticketsApi.get(detailTicket.id)
    setDetailTicket(data)
  }

  const summaryCards = useMemo(() => [
    { l: 'Total tickets', v: stats?.total ?? 0, accent: 'blue' },
    { l: 'Ouverts', v: stats?.ouverts ?? 0, accent: 'amber' },
    { l: 'En cours', v: stats?.en_cours ?? 0, accent: 'purple' },
    { l: 'Urgences critiques', v: stats?.urgents ?? 0, accent: 'red' },
  ], [stats])

  const columns = [
    { key: 'id', label: 'N°', render: (v) => <span className="font-semibold text-onda-blue">#{v}</span> },
    {
      key: 'titre', label: 'Titre / Équipement', render: (v, r) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{v}</span>
          <span className="text-xs text-slate-500">{r.equipement_info ? `${r.equipement_info.code_unique} • ${r.equipement_info.nom}` : 'Sans équipement lié'}</span>
        </div>
      )
    },
    { key: 'type_ticket', label: 'Type', render: (v) => <TicketTypeBadge type={v} /> },
    { key: 'priorite', label: 'Priorité', render: (v) => <PriorityBadge priority={v} /> },
    { key: 'statut', label: 'Statut', render: (v) => <span className={`badge ${STATUT_LABELS[v]?.c}`}>{STATUT_LABELS[v]?.l}</span> },
    { key: 'assigne_a_info', label: 'Assigné à', render: (v) => v ? <span className="flex items-center gap-1 text-sm"><FiUser className="text-slate-400" />{v.full_name || v.username}</span> : <span className="text-slate-400 italic">Non assigné</span> },
    { key: 'date_creation', label: 'Créé le', render: (v) => <span className="text-xs text-slate-500">{new Date(v).toLocaleDateString('fr-FR')}</span> },
    {
      key: 'id', label: '', width: '140px', render: (v, r) => (
        <div className="flex items-center gap-1">
          <button className="btn-secondary !py-1 !px-2 text-xs" onClick={() => openDetail(v)}>👁️</button>
          {canWrite && <Link className="btn-secondary !py-1 !px-2 text-xs" to={`/tickets/edit/${v}`}><FiEdit2 /></Link>}
          {isAdmin && <button className="btn-danger !py-1 !px-2 text-xs" onClick={() => setDeleteId(v)}>🗑️</button>}
        </div>
      )
    },
  ]

  return (
    <div>
      <PageHeader
        breadcrumb="Maintenance"
        title="Tickets d'intervention"
        subtitle="Suivi des opérations de maintenance préventive, corrective et urgences"
        actions={
          canWrite && <Link to="/tickets/create" className="btn-primary"><FiPlus /> Nouveau ticket</Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {summaryCards.map((c) => (
          <div key={c.l} className="card p-4">
            <div className="text-xs text-slate-500 font-medium">{c.l}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{c.v}</div>
          </div>
        ))}
      </div>

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div><label className="label"><FiSearch className="inline mr-1 text-slate-400" />Recherche</label><Input value={search} onChange={setSearch} placeholder="Titre / description..." /></div>
          <SelectField label="Type" value={fType} onChange={setFType} options={[{ value: 'PREVENTIVE', label: 'Préventive' }, { value: 'CORRECTIVE', label: 'Corrective' }, { value: 'URGENCE', label: 'Urgence' }]} />
          <SelectField label="Priorité" value={fPriority} onChange={setFPriority} options={[{ value: 'BASSE', label: 'Basse' }, { value: 'MOYENNE', label: 'Moyenne' }, { value: 'HAUTE', label: 'Haute' }, { value: 'CRITIQUE', label: 'Critique' }]} />
          <SelectField label="Statut" value={fStatus} onChange={setFStatus} options={Object.entries(STATUT_LABELS).map(([k, v]) => ({ value: k, label: v.l }))} />
          <div className="flex items-end">
            <Checkbox label={`Mes tickets (${user?.full_name || user?.username || ''})`} checked={fMine} onChange={setFMine} />
          </div>
        </div>
      </div>

      {loading ? <div className="py-10 text-center text-slate-500"><Spinner /></div> : <DataTable columns={columns} rows={rows} onRowClick={(r) => openDetail(r.id)} />}

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer ce ticket ?" size="sm" footer={
        <>
          <button className="btn-secondary" onClick={() => setDeleteId(null)}>Annuler</button>
          <button className="btn-danger" onClick={onDeleteConfirm}>Supprimer</button>
        </>
      }>
        <p className="text-sm text-slate-600">Cette action est irréversible. L'historique sera conservé dans le journal d'audit.</p>
      </Modal>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={detailTicket ? `Ticket #${detailTicket.id} • ${detailTicket.titre}` : 'Détails'} size="lg">
        {!detailTicket ? <div className="text-center py-10"><Spinner /></div> : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <TicketTypeBadge type={detailTicket.type_ticket} />
              <PriorityBadge priority={detailTicket.priorite} />
              <span className={`badge ${STATUT_LABELS[detailTicket.statut]?.c}`}><FiClock className="mr-1" />{STATUT_LABELS[detailTicket.statut]?.l}</span>
              {detailTicket.equipement_info && (
                <Badge variant="info">
                  {detailTicket.equipement_info.code_unique} • {detailTicket.equipement_info.nom}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Info label="Créé par" value={detailTicket.cree_par_info?.full_name || detailTicket.cree_par_info?.username || '—'} />
              <Info label="Assigné à" value={detailTicket.assigne_a_info?.full_name || detailTicket.assigne_a_info?.username || '—'} />
              <Info label="Date création" value={new Date(detailTicket.date_creation).toLocaleString('fr-FR')} />
              <Info label="Date clotûre" value={detailTicket.date_cloture ? new Date(detailTicket.date_cloture).toLocaleString('fr-FR') : '—'} />
            </div>
            {canWrite && (
              <Card title="Réassigner le ticket"
                actions={
                  <button
                    className="btn-primary !py-1 text-xs"
                    disabled={assigning || !newAssignee || String(newAssignee) === String(detailTicket.assigne_a)}
                    onClick={doAssign}
                  >
                    {assigning ? <><Spinner /> Enregistrement...</> : '✓ Réassigner'}
                  </button>
                }>
                <div className="flex items-center gap-3">
                  <FiUser className="text-slate-400 shrink-0" />
                  <select
                    className="input"
                    value={newAssignee || ''}
                    onChange={(e) => setNewAssignee(e.target.value || '')}
                  >
                    <option value="">— Sélectionner un technicien —</option>
                    {techs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name || t.username} ({t.role_label || t.role})
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            )}
            <Card title="Description">
              <p className="whitespace-pre-wrap text-sm text-slate-700">{detailTicket.description}</p>
            </Card>
            {detailTicket.checklist?.length > 0 && (
              <Card title={`Checklist maintenance (${detailTicket.checklist.filter(c => c.est_effectue).length}/${detailTicket.checklist.length})`}>
                <ul className="space-y-2">
                  {detailTicket.checklist.map((it) => (
                    <li key={it.id} className="flex items-start gap-3 p-2 rounded hover:bg-slate-50">
                      <input
                        type="checkbox"
                        disabled={!canWrite}
                        checked={it.est_effectue}
                        onChange={(e) => toggleChecklist(it, e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-onda-blue"
                      />
                      <div className="flex-1">
                        <div className={it.est_effectue ? 'line-through text-slate-400' : 'text-slate-700'}>{it.libelle}</div>
                        {it.commentaire && <div className="text-xs text-slate-500 mt-0.5">{it.commentaire}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {canWrite && detailTicket.possible_transitions?.length > 0 && (
              <Card title="Changement de statut (workflow)"
                actions={<span className="text-xs text-slate-500">Transitions autorisées OACI</span>}>
                <div className="flex flex-wrap gap-2">
                  {detailTicket.possible_transitions.map(({ value, label }) => (
                    <button key={value} className={`btn ${value === 'CLOTURE' || value === 'RESOLU' ? 'btn-success' : value === 'EN_COURS' ? 'btn-warning' : 'btn-secondary'}`} onClick={() => doTransition(value)}>
                      → Passer: {label}
                    </button>
                  ))}
                </div>
              </Card>
            )}
            {detailTicket.rapport_intervention && (
              <Card title="Rapport d'intervention">
                <p className="whitespace-pre-wrap text-sm text-slate-700">{detailTicket.rapport_intervention}</p>
              </Card>
            )}
            <Card title="Nouveau commentaire"
              actions={<button className="btn-primary" onClick={doComment}><FiMessageSquare /> Envoyer</button>}>
              <Textarea value={comment} onChange={setComment} placeholder="Ajouter une note à l'historique..." />
            </Card>
            <Card title="Historique & Commentaires">
              {detailTicket.historique?.length === 0 ? <EmptyState /> : (
                <ul className="space-y-3">
                  {[...(detailTicket.historique || [])].reverse().map((h) => (
                    <li key={h.id} className="flex gap-3 p-3 rounded-lg bg-slate-50">
                      <div className="w-8 h-8 rounded-full bg-onda-blue text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {(h.utilisateur_info?.first_name?.[0] || h.utilisateur_info?.username?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-sm">{h.utilisateur_info?.full_name || h.utilisateur_info?.username || 'Système'}</span>
                          <span className="badge-info badge">{h.action_label || h.action}</span>
                          <span className="text-xs text-slate-400">{new Date(h.date).toLocaleString('fr-FR')}</span>
                        </div>
                        {(h.commentaire || h.ancienne_valeur || h.nouvelle_valeur) && (
                          <div className="mt-1 text-sm text-slate-700">
                            {h.commentaire}
                            {h.ancienne_valeur && h.nouvelle_valeur && (
                              <div className="text-xs mt-1">
                                <span className="text-red-500 line-through mr-2">{String(h.ancienne_valeur)}</span>
                                <FiArrowRight />
                                <span className="text-emerald-600 ml-2">{String(h.nouvelle_valeur)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-800 text-sm">{value}</div>
    </div>
  )
}
