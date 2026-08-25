import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiArrowLeft, FiSave, FiCheckCircle } from 'react-icons/fi'
import { equipmentApi, ticketsApi, authApi } from '../api/endpoints.js'
import { useAuth } from '../context/AuthContext.jsx'
import {
  Card, Field, Input, Modal, PageHeader, PriorityBadge,
  SelectField, Spinner, Textarea, TicketTypeBadge, Alert,
} from '../components/UI.jsx'

export default function TicketFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { canWrite, user, isAdmin } = useAuth()
  const isEdit = !!id

  const [choices, setChoices] = useState({ types: [], priorites: [], statuts: [], equipements: [] })
  const [techs, setTechs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    titre: '',
    description: '',
    type_ticket: 'CORRECTIVE',
    priorite: 'MOYENNE',
    statut: 'CREE',
    content_type: '',
    object_id: '',
    assigne_a: '',
    rapport_intervention: '',
  })

  const loadChoices = async () => {
    const [ch, te] = await Promise.all([ticketsApi.choices(), authApi.listTechnicians()])
    const eqChoices = await equipmentApi.choices()
    setChoices({ ...ch.data, equipements: eqChoices.data.equipements })
    setTechs(te.data || [])
    return true
  }

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await loadChoices()
      if (isEdit) {
        const { data } = await ticketsApi.get(id)
        setForm({
          titre: data.titre, description: data.description,
          type_ticket: data.type_ticket, priorite: data.priorite, statut: data.statut,
          content_type: data.content_type, object_id: data.object_id || '',
          assigne_a: data.assigne_a || '', rapport_intervention: data.rapport_intervention || '',
        })
      } else {
        const eqId = params.get('equipment')
        const eqType = params.get('type')
        const match = choices.equipements?.find((e) => String(e.id) === String(eqId) && e.type === eqType)
        if (match) {
          setForm((f) => ({ ...f, object_id: match.id, content_type: match.content_type_id }))
        }
      }
      setLoading(false)
    })()
  }, [id]) // eslint-disable-line

  const eqSelected = useMemo(
    () => choices.equipements?.find((e) => String(e.id) === String(form.object_id) && String(e.content_type_id) === String(form.content_type)),
    [choices.equipements, form.object_id, form.content_type],
  )

  if (!canWrite && !isEdit) {
    return (
      <div className="py-20 text-center">
        <Alert variant="danger" title="Accès interdit">
          Vous n'êtes pas autorisé à créer des tickets.
          <div className="mt-3"><button className="btn-primary" onClick={() => navigate('/tickets')}>← Retour</button></div>
        </Alert>
      </div>
    )
  }

  const save = async () => {
    if (!form.titre || !form.description) {
      toast.error('Titre et description sont requis')
      return
    }
    setSaving(true)
    const payload = { ...form }
    if (!payload.content_type || !payload.object_id) {
      delete payload.content_type; delete payload.object_id
    }
    if (!payload.assigne_a) delete payload.assigne_a
    if (!payload.rapport_intervention) delete payload.rapport_intervention
    try {
      if (isEdit) {
        await ticketsApi.update(id, payload)
        toast.success('Ticket mis à jour')
      } else {
        await ticketsApi.create(payload)
        toast.success('Ticket créé avec succès')
      }
      navigate('/tickets')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumb={<button className="text-slate-500 hover:text-onda-blue" onClick={() => navigate('/tickets')}><FiArrowLeft className="inline mr-1" />Tickets</button>}
        title={isEdit ? `Modifier le ticket #${id}` : 'Nouveau ticket d\'intervention'}
        subtitle="Remplissez le formulaire pour créer ou modifier une intervention de maintenance."
      />

      {loading ? <div className="py-16 text-center text-slate-500"><Spinner /></div> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <Card title="Informations principales">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><Input label="Titre" required value={form.titre} onChange={(v) => setForm({ ...form, titre: v })} placeholder="Ex: Vérification DDM ILS LOC Piste 09" /></div>
                <div className="md:col-span-2"><Textarea label="Description détaillée" required rows={5} value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Contexte, symptômes, actions déjà menées..." /></div>
                <Field label="Type de maintenance" required>
                  <select className="input" value={form.type_ticket} onChange={(e) => setForm({ ...form, type_ticket: e.target.value })}>
                    <option value="PREVENTIVE">Maintenance Préventive</option>
                    <option value="CORRECTIVE">Maintenance Corrective</option>
                    <option value="URGENCE">Intervention Urgence</option>
                  </select>
                </Field>
                <Field label="Priorité" required>
                  <select className="input" value={form.priorite} onChange={(e) => setForm({ ...form, priorite: e.target.value })}>
                    <option value="BASSE">Basse</option>
                    <option value="MOYENNE">Moyenne</option>
                    <option value="HAUTE">Haute</option>
                    <option value="CRITIQUE">Critique</option>
                  </select>
                </Field>
                {isEdit && (
                  <Field label="Statut">
                    <select className="input" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                      {choices.statuts?.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </Field>
                )}
                <Field label="Équipement concerné">
                  <select className="input" value={form.object_id ? `${form.content_type}:${form.object_id}` : ''} onChange={(e) => {
                    const v = e.target.value
                    if (!v) { setForm({ ...form, content_type: '', object_id: '' }); return }
                    const [ctid, oid] = v.split(':')
                    setForm({ ...form, content_type: Number(ctid), object_id: Number(oid) })
                  }}>
                    <option value="">Aucun équipement</option>
                    {choices.equipements?.map((e) => (
                      <option key={`${e.content_type_id}-${e.id}`} value={`${e.content_type_id}:${e.id}`}>
                        [{e.type_label}] {e.code_unique} — {e.nom}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Technicien assigné">
                  <select className="input" value={form.assigne_a || ''} onChange={(e) => setForm({ ...form, assigne_a: Number(e.target.value) || '' })}>
                    <option value="">À assigner plus tard</option>
                    {techs.map((t) => <option key={t.id} value={t.id}>{t.full_name || t.username} ({t.role_label})</option>)}
                  </select>
                </Field>
                {isEdit && (
                  <div className="md:col-span-2">
                    <Textarea
                      label="Rapport d'intervention"
                      value={form.rapport_intervention}
                      onChange={(v) => setForm({ ...form, rapport_intervention: v })}
                      placeholder="Résultat de l'intervention, mesures effectuées, résolution..."
                      rows={4}
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card title="Résumé">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Type</span><TicketTypeBadge type={form.type_ticket} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Priorité</span><PriorityBadge priority={form.priorite} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Créateur</span><span className="font-medium">{user?.full_name || user?.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Équipement</span>
                  <span className="font-medium text-right text-sm">{eqSelected ? `${eqSelected.code_unique}` : '—'}</span>
                </div>
              </div>
              {eqSelected && (
                <div className="mt-4 p-3 rounded-lg bg-sky-50 border border-sky-200">
                  <div className="text-xs text-sky-700 font-semibold mb-1">{eqSelected.type_label} • {eqSelected.nom}</div>
                  <div className="text-xs text-sky-600">
                    Une checklist dynamique sera générée automatiquement en fonction du type d'équipement (OACI).
                  </div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <button className="w-full btn-primary justify-center" disabled={saving} onClick={save}>
                  {saving ? <><Spinner /> Enregistrement...</> : <><FiSave /> Enregistrer le ticket</>}
                </button>
                <button className="w-full btn-secondary justify-center" onClick={() => navigate('/tickets')}>
                  Annuler
                </button>
              </div>
            </Card>
            {!isEdit && (
              <Alert variant="info" title="Checklists intelligentes">
                À la création, le système génère automatiquement une liste de tâches adaptée
                au type d'équipement (VOR, ILS, DME, Radar, VCS) basée sur les procédures OACI.
              </Alert>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
