import { useQuery } from '@tanstack/react-query'
import { useNotificacoesStore } from '../store/notificacoesStore'
import { notificacoesService } from '../services/notificacoes.service'
import { useEffect } from 'react'

export function useNotificacoes() {
  const { setNaoLidas } = useNotificacoesStore()

  const { data } = useQuery({
    queryKey: ['notificacoes-nao-lidas'],
    queryFn: () => notificacoesService.contarNaoLidas().then(r => r.data.data.total),
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (data != null) setNaoLidas(data)
  }, [data, setNaoLidas])
}
