import api from './client.js'

export const authApi = {
  login: (data) => api.post('/auth/token/', data, { silent: true }),
  me: () => api.get('/auth/users/me/'),
  changePassword: (userId, payload) => api.post(`/auth/users/${userId}/change_password/`, payload),
  listUsers: (params) => api.get('/auth/users/', { params }),
  listTechnicians: () => api.get('/auth/users/technicians/'),
  createUser: (data) => api.post('/auth/users/', data),
}

export const equipmentApi = {
  getAll: (params) => api.get('/equipment/all/', { params }),
  choices: () => api.get('/equipment/choices/'),
  stats: () => api.get('/equipment/stats/'),
  listByType: (type, params) => api.get(`/equipment/${type.toLowerCase()}/`, { params }),
  getById: (type, id) => api.get(`/equipment/${type.toLowerCase()}/${id}/`),
  create: (type, data) => api.post(`/equipment/${type.toLowerCase()}/`, data),
  update: (type, id, data) => api.patch(`/equipment/${type.toLowerCase()}/${id}/`, data),
  remove: (type, id) => api.delete(`/equipment/${type.toLowerCase()}/${id}/`),
  mesures: (type, id) => api.get(`/equipment/${type.toLowerCase()}/${id}/mesures/`),
  addMesure: (type, id, data) => api.post(`/equipment/${type.toLowerCase()}/${id}/ajouter_mesure/`, data),
}

export const ticketsApi = {
  list: (params) => api.get('/tickets/', { params }),
  get: (id) => api.get(`/tickets/${id}/`),
  create: (data) => api.post('/tickets/', data),
  update: (id, data) => api.patch(`/tickets/${id}/`, data),
  remove: (id) => api.delete(`/tickets/${id}/`),
  assign: (data) => api.post('/tickets/assign/', data),
  transition: (id, data) => api.post(`/tickets/${id}/transition/`, data),
  updateChecklist: (id, data) => api.post(`/tickets/${id}/update_checklist/`, data),
  commenter: (id, data) => api.post(`/tickets/${id}/commenter/`, data),
  stats: () => api.get('/tickets/stats/summary/'),
  choices: () => api.get('/tickets/metadata/choices/'),
}

export const auditApi = {
  list: (params) => api.get('/audit/logs/', { params }),
  summary: (params) => api.get('/audit/logs/summary/', { params }),
  latest: (params) => api.get('/audit/logs/latest/', { params }),
}
