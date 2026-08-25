import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import {
  FiAlertTriangle, FiCheckCircle, FiRadio, FiList,
  FiBarChart2, FiShield, FiClock, FiXOctagon,
} from 'react-icons/fi'
import { equipmentApi, ticketsApi, auditApi } from '../api/endpoints.js'
import {
  Alert, Badge, Card, KpiCard, DataTable, EmptyState, PageHeader, Spinner, TicketTypeBadge,
} from '../components/UI.jsx'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
)

export default function DashboardPage() {
  const [equipmentStats, setEquipmentStats] = useState(null)
  const [ticketStats, setTicketStats] = useState(null)
  const [latestAudit, setLatestAudit] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const [eq, tk, au] = await Promise.all([
          equipmentApi.stats(),
          ticketsApi.stats(),
          auditApi.latest({ limit: 10 }).catch(() => ({ data: [] })),
        ])
        setEquipmentStats(eq.data)
        setTicketStats(tk.data)
        setLatestAudit(au.data || [])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const ddmData = useMemo(() => {
    const logs = equipmentStats?.courbe_ddm_7j || []
    const labels = [...new Set(logs.map((l) => l.date.slice(0, 10)))]
    return {
      labels,
      datasets: [
        {
          label: 'DDM LOC',
          data: labels.map((lbl) => {
            const same = logs.filter((l) => l.date.startsWith(lbl))
            return same.length ? (same.reduce((s, l) => s + l.valeur, 0) / same.length) : null
          }),
          borderColor: '#0056A6',
          backgroundColor: 'rgba(0,86,166,0.12)',
          fill: true,
          tension: 0.35,
        },
      ],
    }
  }, [equipmentStats])

  const dmeRendData = useMemo(() => {
    const logs = equipmentStats?.courbe_rendement_7j || []
    const labels = [...new Set(logs.map((l) => l.date.slice(0, 10)))]
    return {
      labels,
      datasets: [
        {
          label: 'Rendement DME principal (%)',
          data: labels.map((lbl) => {
            const same = logs.filter((l) => l.date.startsWith(lbl))
            return same.length ? (same.reduce((s, l) => s + l.valeur, 0) / same.length) : null
          }),
          borderColor: '#059669',
          backgroundColor: 'rgba(5,150,105,0.12)',
          fill: true,
          tension: 0.35,
          yAxisID: 'y',
        },
        {
          label: 'Seuil OACI 70%',
          data: labels.map(() => 70),
          borderColor: '#DC2626',
          borderDash: [6, 6],
          pointRadius: 0,
          fill: false,
          tension: 0,
          yAxisID: 'y',
        },
      ],
    }
  }, [equipmentStats])

  const typeDoughnut = useMemo(() => {
    const parType = equipmentStats?.par_type || {}
    return {
      labels: Object.keys(parType),
      datasets: [{
        data: Object.values(parType).map((v) => v.total),
        backgroundColor: ['#0056A6', '#0099D7', '#10B981', '#F59E0B', '#8B5CF6'],
        borderWidth: 0,
      }],
    }
  }, [equipmentStats])

  const ticketsPriorities = useMemo(() => {
    const p = ticketStats?.par_priorite || {}
    return {
      labels: Object.keys(p).map((k) => ({ BASSE: 'Basse', MOYENNE: 'Moyenne', HAUTE: 'Haute', CRITIQUE: 'Critique' }[k] || k)),
      datasets: [{
        label: 'Tickets',
        data: Object.values(p),
        backgroundColor: ['#9CA3AF', '#3B82F6', '#F59E0B', '#DC2626'],
        borderRadius: 8,
      }],
    }
  }, [ticketStats])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner /> <span className="ml-3 text-slate-500">Chargement du tableau de bord...</span>
      </div>
    )
  }

  const alertes = equipmentStats?.alerte_seuils || []

  return (
    <div>
      <PageHeader
        breadcrumb="Accueil"
        title="Tableau de bord CNS Health"
        subtitle="Vue consolidée des systèmes critiques Communication • Navigation • Surveillance (OACI Annexe 10)"
        actions={
          <>
            <Link to="/equipments" className="btn-secondary"><FiRadio /> Inventaire</Link>
            <Link to="/tickets" className="btn-primary"><FiList /> Tickets ouverts</Link>
          </>
        }
      />

      {alertes.length > 0 && (
        <div className="mb-6 space-y-3">
          {alertes.map((a, i) => (
            <Alert
              key={i}
              variant={a.niveau === 'ALARME' ? 'danger' : 'warning'}
              icon={a.niveau === 'ALARME' ? <FiXOctagon size={20} /> : <FiAlertTriangle size={20} />}
              title={`${a.niveau === 'ALARME' ? 'ALARME OACI' : 'ALERTE'} • ${a.code} (${a.nom})`}
            >
              <div className="flex flex-wrap gap-3 items-center text-sm">
                <span>Paramètre : <b>{a.type}</b></span>
                <span>Valeur : <b className="font-semibold">{a.valeur}</b></span>
                <span>Seuil : <b>{a.seuil}</b></span>
              </div>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Équipements critiques"
          value={equipmentStats?.critique_count ?? 0}
          icon={<FiRadio />}
          accent="blue"
          footer={`Total parc CNS : ${equipmentStats?.total_equipements ?? 0}`}
        />
        <KpiCard
          label="Tickets ouverts"
          value={ticketStats?.ouverts ?? 0}
          icon={<FiList />}
          accent="amber"
          footer={`${ticketStats?.critics ?? 0} critique(s) • ${ticketStats?.urgents ?? 0} urgence(s)`}
        />
        <KpiCard
          label="Disponibilité globale"
          value={`${equipmentStats?.disponibilite ?? 0}%`}
          icon={<FiCheckCircle />}
          accent={(equipmentStats?.disponibilite ?? 0) >= 98 ? 'green' : 'amber'}
          footer={`OK: ${equipmentStats?.par_statut?.OK ?? 0} / Dégradés: ${equipmentStats?.par_statut?.DEGRADE ?? 0} / HS: ${equipmentStats?.par_statut?.HS ?? 0}`}
        />
        <KpiCard
          label="Événements audit 7j"
          value={latestAudit.length}
          icon={<FiShield />}
          accent="purple"
          footer="Actions sensibles tracées en base"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card title="Évolution DDM ILS Localizer (7 derniers jours)"
              actions={<Badge variant="info">OACI ±DDM alerte ~0.160</Badge>}
              className="xl:col-span-2">
          {ddmData.labels.length === 0 ? (
            <EmptyState subtitle="Aucune mesure DME enregistrée sur la période." />
          ) : (
            <Line
              data={ddmData}
              height={220}
              options={{
                responsive: true,
                plugins: { legend: { position: 'bottom' } },
                scales: {
                  y: {
                    title: { display: true, text: 'DDM' },
                    suggestedMin: 0.10, suggestedMax: 0.20,
                  },
                },
              }}
            />
          )}
        </Card>
        <Card title="Répartition équipements par type">
          <div className="flex items-center justify-center">
            <div style={{ height: 240, width: 240 }}>
              <Doughnut data={typeDoughnut} options={{ plugins: { legend: { position: 'bottom' } }, maintainAspectRatio: true }} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card title="Rendement DME (%) - 7 derniers jours"
              actions={<Badge variant="haute">Seuil OACI ≥ 70%</Badge>}
              className="xl:col-span-2">
          {dmeRendData.labels.length === 0 ? (
            <EmptyState subtitle="Aucune mesure rendement DME." />
          ) : (
            <Line
              data={dmeRendData}
              height={220}
              options={{
                responsive: true,
                plugins: { legend: { position: 'bottom' } },
                scales: {
                  y: {
                    title: { display: true, text: '% rendement' },
                    min: 50, max: 100,
                  },
                },
              }}
            />
          )}
        </Card>
        <Card title="Tickets par priorité">
          <Bar
            data={ticketsPriorities}
            height={220}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            }}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Disponibilité par type d'équipement"
              icon={<FiBarChart2 className="text-onda-blue" />}>
          {Object.entries(equipmentStats?.par_type || {}).length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {Object.entries(equipmentStats?.par_type || {}).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{k}</span>
                    <span className="text-slate-500">
                      {v.OK}/{v.total} • Dispo {v.disponibilite}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${v.disponibilite}%`,
                        backgroundColor: v.disponibilite >= 95 ? '#10B981' : v.disponibilite >= 80 ? '#F59E0B' : '#EF4444',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="Derniers événements d'audit" actions={<Link to="/audit" className="text-xs text-onda-blue font-medium hover:underline">Voir tout →</Link>}>
          {latestAudit.length === 0 ? (
            <EmptyState subtitle="Aucun événement récent." icon="🛡️" />
          ) : (
            <DataTable
              rowKey="id"
              columns={[
                { key: 'timestamp', label: 'Heure', render: (v) => <span className="text-xs text-slate-500">{new Date(v).toLocaleString('fr-FR')}</span> },
                { key: 'action_label', label: 'Action' },
                { key: 'utilisateur_info', label: 'Utilisateur', render: (v) => v?.full_name || v?.username || '—' },
                { key: 'description', label: 'Détails', render: (v) => <span className="max-w-xs truncate inline-block align-middle">{v || '—'}</span> },
              ]}
              rows={latestAudit}
            />
          )}
        </Card>
      </div>
    </div>
  )
}
