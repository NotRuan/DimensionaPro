import api from './api'

export const authService = {
  login:    (email, senha)                          => api.post('/auth/login', { email, senha }),
  logout:   ()                                      => api.post('/auth/logout'),
}
