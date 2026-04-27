import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from './components/ui/Toast'
import { router } from './router'
import configuracoesService from './services/configuracoes.service'
import { useConfiguracoesStore } from './store/configuracoesStore'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })

function ConfigLoader() {
  const setConfiguracoes = useConfiguracoesStore(s => s.setConfiguracoes)

  useEffect(() => {
    const carregarConfiguracoes = () => {
      configuracoesService.buscar()
        .then(res => setConfiguracoes(res.data))
        .catch(() => {}) // fallback to hardcoded defaults silently
    }

    const carregarAoVoltar = () => {
      if (!document.hidden) carregarConfiguracoes()
    }

    carregarConfiguracoes()
    window.addEventListener('focus', carregarConfiguracoes)
    document.addEventListener('visibilitychange', carregarAoVoltar)
    const intervalId = window.setInterval(carregarConfiguracoes, 60_000)

    return () => {
      window.removeEventListener('focus', carregarConfiguracoes)
      document.removeEventListener('visibilitychange', carregarAoVoltar)
      window.clearInterval(intervalId)
    }
  }, [setConfiguracoes])

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfigLoader />
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  )
}
