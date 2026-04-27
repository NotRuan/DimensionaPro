import api from './api'

export const dimensionamentosService = {
  listar:         (params)    => api.get('/dimensionamentos', { params }),
  criar:          (body)      => api.post('/dimensionamentos', body),
  atualizar:      (id, body)  => api.put(`/dimensionamentos/${id}`, body),
  buscarPorId:    (id)        => api.get(`/dimensionamentos/${id}`),
  excluir:        (id)        => api.delete(`/dimensionamentos/${id}`),
  submeter:       (id)        => api.patch(`/dimensionamentos/${id}/submeter`),
  revisar:        (id)        => api.patch(`/dimensionamentos/${id}/revisar`),
  ajuste:         (id, comentario) => api.patch(`/dimensionamentos/${id}/ajuste`, { comentario }),
  revisarLote:    (ids)       => api.patch('/dimensionamentos/revisar-lote', { ids }),
  eventos:        (id)        => api.get(`/dimensionamentos/${id}/eventos`),
  dashboardGerente: ()        => api.get('/dimensionamentos/gerente/dashboard'),
  mapa:           ()          => api.get('/dimensionamentos/mapa'),
  listarPorCidade: (cidade)  => api.get(`/dimensionamentos?cidade=${encodeURIComponent(cidade)}`),
}
