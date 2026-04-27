import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = (() => {
    try { return JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token }
    catch { return null }
  })()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = data.data.accessToken
        const { useAuthStore } = await import('../store/authStore')
        useAuthStore.getState().setToken(newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        const { useAuthStore } = await import('../store/authStore')
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
