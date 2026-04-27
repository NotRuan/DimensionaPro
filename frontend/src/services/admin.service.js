import api from './api'

export const adminService = {
  dashboard: () => api.get('/admin/dashboard'),
  auditoria: (params) => api.get('/admin/auditoria', { params }),
  importacoes: () => api.get('/admin/importacoes'),
  cidades: (params) => api.get('/admin/cidades', { params }),
  criarCidade: (body) => api.post('/admin/cidades', body),
  atualizarCidade: (id, body) => api.put(`/admin/cidades/${id}`, body),
}
