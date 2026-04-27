import api from './api'

export const prestadoresService = {
  cidades: () => api.get('/prestadores/cidades'),
  busca:   (params) => api.get('/prestadores/busca', { params }),
  sugestoes: (params) => api.get('/prestadores/sugestoes', { params }),
}
