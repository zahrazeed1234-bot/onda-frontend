import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiFilter, FiSearch, FiFileText } from 'react-icons/fi'
import { equipmentApi, ticketsApi } from '../api/endpoints.js'
import { useAuth } from '../context/AuthContext.jsx'
import {
  Badge, Card, DataTable, EmptyState, Input, KpiCard, Modal, PageHeader,
  SelectField, StatusBadge, Spinner, Textarea, Checkbox, Alert,
} from '../components/UI.jsx'

const TYPE_MAPPING = {
  EquipmentVOR: {
    label: 'VOR', apiKey: 'vor',
    fields: [
      { k: 'frequence', l: 'Fréquence (MHz)', type: 'number' },
      { k: 'taux_modulation_AM', l: 'Mod AM (%)', type: 'number' },
      { k: 'indice_FM', l: 'Indice FM', type: 'number' },
      { k: 'puissance_erp', l: 'Puissance ERP (W)', type: 'number' },
      { k: 'identifiant_morse', l: 'Identifiant Morse', type: 'text' },
    ],
  },
  EquipmentILS: {
    label: 'ILS', apiKey: 'ils',
    fields: [
      { k: 'type_ils', l: 'Type LOC/GP', type: 'select', opts: [{ value: 'LOC', label: 'Localizer' }, { value: 'GP', label: 'Glide Path' }] },
      { k: 'frequence_porteuse', l: 'Fréquence porteuse (MHz)', type: 'number' },
      { k: 'taux_modulation_90Hz', l: 'Modulation 90Hz (%)', type: 'number' },
      { k: 'taux_modulation_150Hz', l: 'Modulation 150Hz (%)', type: 'number' },
      { k: 'ddm_nominale', l: 'DDM nominale', type: 'number' },
      { k: 'sdm_nominale', l: 'SDM nominale', type: 'number' },
      { k: 'course', l: 'Course (°)', type: 'number' },
      { k: 'identifiant', l: 'Identifiant', type: 'text' },
    ],
  },
  EquipmentDME: {
    label: 'DME', apiKey: 'dme',
    fields: [
      { k: 'canal', l: 'Canal X/Y', type: 'select', opts: [{ value: 'X', label: 'X' }, { value: 'Y', label: 'Y' }] },
      { k: 'numero_canal', l: 'N° canal (1-126)', type: 'number' },
      { k: 'frequence_interrogation', l: 'Fréq interrogation (MHz)', type: 'number' },
      { k: 'frequence_reponse', l: 'Fréq réponse (MHz)', type: 'number' },
      { k: 'retard_systematique', l: 'Retard systématique (µs)', type: 'number' },
      { k: 'puissance_sortie', l: 'Puissance sortie (W)', type: 'number' },
      { k: 'rendement_recent', l: 'Rendement (%)', type: 'number' },
      { k: 'mode_fonctionnement', l: 'Mode Search/Track', type: 'select', opts: [{ value: 'SEARCH', label: 'Search' }, { value: 'TRACK', label: 'Track' }] },
    ],
  },
  EquipmentRadar: {
    label: 'Radar', apiKey: 'radar',
    fields: [
      { k: 'type_radar', l: 'Type Radar', type: 'select', opts: [{ value: 'PSR', label: 'PSR' }, { value: 'SSR', label: 'SSR' }, { value: 'ADS-B', label: 'ADS-B' }] },
      { k: 'frequence_bande', l: 'Bande fréquence', type: 'text' },
      { k: 'portee_max', l: 'Portée max (NM)', type: 'number' },
      { k: 'mode_s_actif', l: 'Mode S actif', type: 'checkbox' },
      { k: 'traitement_oldi', l: 'Traitement OLDI', type: 'checkbox' },
      { k: 'puissance_emetteur', l: 'Puissance (kW)', type: 'number' },
    ],
  },
  EquipmentVCS: {
    label: 'VCS', apiKey: 'vcs',
    fields: [
      { k: 'site_radio', l: 'Site radio', type: 'text' },
      { k: 'codec', l: 'Codec', type: 'select', opts: [{ value: 'G.711A', label: 'G.711 A-law' }, { value: 'G.711U', label: 'G.711 µ-law' }, { value: 'G.729', label: 'G.729' }] },
      { k: 'protocole', l: 'Protocole', type: 'select', opts: [{ value: 'ED-137', label: 'ED-137' }, { value: 'SIP', label: 'SIP' }] },
      { k: 'canaux_vhf', l: 'Canaux VHF', type: 'number' },
      { k: 'voip_active', l: 'VoIP activé', type: 'checkbox' },
      { k: 'adresse_ip', l: 'Adresse IP', type: 'text' },
    ],
  },
}

const BASE_FIELDS = [
  { k: 'nom', l: 'Nom', type: 'text', required: true },
  { k: 'code_unique', l: 'Code unique', type: 'text', required: true },
  { k: 'statut_operationnel', l: 'Statut', type: 'select', opts: [{ value: 'OK', label: 'Opérationnel' }, { value: 'DEGRADE', label: 'Dégradé' }, { value: 'HS', label: 'Hors service' }], required: true },
  { k: 'localisation_lat', l: 'Latitude', type: 'number' },
  { k: 'localisation_lng', l: 'Longitude', type: 'number' },
  { k: 'date_mise_en_service', l: 'Date mise en service', type: 'date' },
  { k: 'description', l: 'Description', type: 'textarea' },
]

function emptyForm(typeKey) {
  const base = {}
  BASE_FIELDS.forEach((f) => { base[f.k] = f.type === 'checkbox' ? false : '' })
  const spec = TYPE_MAPPING[typeKey]
  spec?.fields.forEach((f) => { base[f.k] = f.type === 'checkbox' ? false : '' })
  base.statut_operationnel = 'OK'
  return base
}

export default function EquipmentsPage() {
  const { isAdmin, canWrite } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fType, setFType] = useState('')
  const [fStatus, setFStatus] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState('create')
  const [current, setCurrent] = useState(null)
  const [formType, setFormType] = useState('EquipmentVOR')
  const [formData, setFormData] = useState(emptyForm('EquipmentVOR'))
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const { data } = await equipmentApi.getAll({ type: fType, statut: fStatus, search })
      setRows(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [fType, fStatus, search]) // eslint-disable-line

  const filtered = useMemo(() => rows, [rows])

  const openCreate = (typeKey) => {
    setMode('create'); setFormType(typeKey); setFormData(emptyForm(typeKey)); setCurrent(null)
    setModalOpen(true)
  }
  const openEdit = (row) => {
    const typeKey = row.type
    setMode('edit'); setFormType(typeKey); setCurrent(row)
    setFormData({ ...row.details, ...(row.details || {}), nom: row.nom, code_unique: row.code_unique, statut_operationnel: row.statut_operationnel, localisation_lat: row.localisation_lat, localisation_lng: row.localisation_lng, date_mise_en_service: row.date_mise_en_service, description: row.description })
    setModalOpen(true)
  }
  const openDetail = async (row) => {
    setDetailOpen(true); setDetailData(null)
    try {
      const { data } = await equipmentApi.getById(TYPE_MAPPING[row.type].apiKey, row.id)
      setDetailData({ ...row, ...data })
    } catch {
      setDetailData(row)
    }
  }
  const confirmDelete = async () => {
    if (!deleteId) return
    const { type, id } = deleteId
    try {
      await equipmentApi.remove(TYPE_MAPPING[type].apiKey, id)
      toast.success('Équipement supprimé')
      loadData()
    } finally {
      setDeleteId(null)
    }
  }

  const save = async () => {
    if (!formData.nom || !formData.code_unique) {
      toast.error('Nom et code unique sont requis')
      return
    }
    setSaving(true)
    const spec = TYPE_MAPPING[formType]
    try {
      if (mode === 'create') {
        await equipmentApi.create(spec.apiKey, formData)
        toast.success('Équipement créé')
      } else {
        await equipmentApi.update(spec.apiKey, current.id, formData)
        toast.success('Équipement mis à jour')
      }
      setModalOpen(false)
      loadData()
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'code_unique', label: 'Code', render: (v, r) => <div className="flex flex-col"><span className="font-semibold text-slate-900">{v}</span><span className="text-xs text-slate-500">{r.type_label}</span></div> },
    { key: 'nom', label: 'Nom / Localisation' },
    { key: 'statut_operationnel', label: 'Statut', render: (v) => <StatusBadge status={v} /> },
    { key: 'is_critique', label: 'Critique', render: (v) => v ? <Badge variant="critique">CRITIQUE OACI</Badge> : <Badge variant="info">Standard</Badge> },
    { key: 'id', label: 'Actions', width: '200px', render: (v, r) => (
      <div className="flex items-center gap-1">
        <button className="btn-secondary !py-1 !px-2 text-xs" onClick={() => openDetail(r)}><FiEye /> Détails</button>
        <Link className="btn-secondary !py-1 !px-2 text-xs" to={`/tickets/create?equipment=${r.id}&type=${r.type}`}><FiFileText /></Link>
        {canWrite && <button className="btn-secondary !py-1 !px-2 text-xs" onClick={() => openEdit(r)}><FiEdit2 /></button>}
        {isAdmin && <button className="btn-danger !py-1 !px-2 text-xs" onClick={() => setDeleteId(r)}><FiTrash2 /></button>}
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader
        breadcrumb="Gestion du parc"
        title="Équipements CNS"
        subtitle="Inventaire des systèmes de Communication, Navigation et Surveillance"
        actions={canWrite && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(TYPE_MAPPING).map(([k, v]) => (
              <button key={k} className="btn-secondary !py-2 text-xs" onClick={() => openCreate(k)}>
                <FiPlus /> {v.label}
              </button>
            ))}
          </div>
        )}
      />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="label"><FiSearch className="inline mr-1 text-slate-400" />Recherche</label>
            <Input value={search} onChange={setSearch} placeholder="Code unique / Nom..." />
          </div>
          <SelectField
            label="Type équipement"
            value={fType}
            onChange={setFType}
            options={[
              { value: 'EquipmentVOR', label: 'VOR' }, { value: 'EquipmentILS', label: 'ILS' },
              { value: 'EquipmentDME', label: 'DME' }, { value: 'EquipmentRadar', label: 'Radar' }, { value: 'EquipmentVCS', label: 'VCS' },
            ]}
          />
          <SelectField
            label="Statut"
            value={fStatus}
            onChange={setFStatus}
            options={[{ value: 'OK', label: 'Opérationnel' }, { value: 'DEGRADE', label: 'Dégradé' }, { value: 'HS', label: 'Hors service' }]}
          />
          <div className="flex items-end gap-2">
            <button className="btn-secondary w-full" onClick={loadData}><FiFilter /> Appliquer</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {Object.entries(TYPE_MAPPING).map(([k, v]) => (
          <KpiCard
            key={k}
            label={`Équipements ${v.label}`}
            value={rows.filter((r) => r.type === k).length}
            accent="blue"
          />
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-slate-500"><Spinner /> Chargement...</div>
      ) : (
        <DataTable columns={columns} rows={filtered} onRowClick={openDetail} />
      )}

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={mode === 'create' ? `Nouvel équipement • ${TYPE_MAPPING[formType].label}` : `Modifier équipement • ${formData.code_unique || ''}`}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>Annuler</button>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? <><Spinner /> Enregistrement...</> : '💾 Enregistrer'}</button>
          </>
        }
      >
        {!isAdmin && (
          <Alert variant="warning" title="Champs fréquence protégés">
            Les champs de fréquence ne peuvent être modifiés que par un Administrateur CNS (RBAC).
          </Alert>
        )}
        <div className="grid md:grid-cols-2 gap-4">
          {BASE_FIELDS.map((f) => renderField(f, formData, (v) => setFormData({ ...formData, [f.k]: v }), !isAdmin && f.k.includes('frequence')))}
          {TYPE_MAPPING[formType].fields.map((f) => renderField(f, formData, (v) => setFormData({ ...formData, [f.k]: v }), !isAdmin && f.k.includes('frequence')))}
        </div>
      </Modal>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={detailData ? `${detailData.code_unique} • ${detailData.nom}` : 'Détails équipement'} size="lg">
        {!detailData ? <div className="text-center py-10"><Spinner /></div> : (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <StatusBadge status={detailData.statut_operationnel} />
              <Badge variant="info">{TYPE_MAPPING[detailData.type]?.label || detailData.type_label}</Badge>
              {detailData.is_critique && <Badge variant="critique">CRITIQUE</Badge>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {[
                ['Code unique', detailData.code_unique],
                ['Mise en service', detailData.date_mise_en_service || '—'],
                ['Lat / Lng', detailData.localisation_lat ? `${detailData.localisation_lat} / ${detailData.localisation_lng}` : '—'],
                ['Description', detailData.description || '—'],
              ].map(([l, v]) => (
                <div key={l} className="p-3 rounded-lg bg-slate-50">
                  <div className="text-xs text-slate-500">{l}</div>
                  <div className="font-medium text-slate-800 mt-0.5">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <h4 className="font-semibold text-slate-800 mb-3">Paramètres techniques {TYPE_MAPPING[detailData.type]?.label}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {(TYPE_MAPPING[detailData.type]?.fields || []).map((f) => (
                  <div key={f.k} className="p-3 rounded-lg border border-slate-100">
                    <div className="text-xs text-slate-500">{f.l}</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{detailData[f.k] ?? '—'}</div>
                  </div>
                ))}
              </div>
            </div>
            {canWrite && (
              <div className="mt-6 flex justify-end gap-2">
                <Link className="btn-secondary" to={`/tickets/create?equipment=${detailData.id}&type=${detailData.type}`}><FiFileText /> Nouveau ticket</Link>
                <button className="btn-primary" onClick={() => { setDetailOpen(false); openEdit(detailData) }}><FiEdit2 /> Modifier</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirmer la suppression" size="sm" footer={
        <>
          <button className="btn-secondary" onClick={() => setDeleteId(null)}>Annuler</button>
          <button className="btn-danger" onClick={confirmDelete}>Confirmer</button>
        </>
      }>
        <p className="text-sm text-slate-600">Êtes-vous sûr de vouloir supprimer définitivement <b>{deleteId?.nom}</b> ({deleteId?.code_unique}) ?</p>
      </Modal>
    </div>
  )
}

function renderField(f, data, onChange, disabled) {
  const v = data[f.k]
  if (f.type === 'textarea') return <Textarea key={f.k} label={f.l} required={f.required} value={v} onChange={onChange} disabled={disabled} />
  if (f.type === 'checkbox') return <div key={f.k} className="pt-6"><Checkbox label={f.l} checked={!!v} onChange={onChange} disabled={disabled} /></div>
  if (f.type === 'select') return <SelectField key={f.k} label={f.l} required={f.required} value={v} onChange={onChange} options={f.opts} />
  return <Input key={f.k} label={f.l} type={f.type} required={f.required} value={v} onChange={onChange} disabled={disabled} />
}
