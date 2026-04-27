import api from './api'

const configuracoesService = {
  buscar: () => api.get('/configuracoes'),
  salvar: (chave, valor) => api.put(`/configuracoes/${chave}`, { valor }),
}

export default configuracoesService
