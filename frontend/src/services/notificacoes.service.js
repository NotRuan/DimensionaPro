import api from './api'

export const notificacoesService = {
  listar:         ()    => api.get('/notificacoes'),
  contarNaoLidas: ()    => api.get('/notificacoes/nao-lidas'),
  marcarLida:     (id)  => api.patch(`/notificacoes/${id}/lida`),
}
