import { useState, useCallback, useRef } from 'react'
import { prestadoresService } from '../services/prestadores.service'

export function useBuscaPrestador() {
  const [status, setStatus] = useState('idle') // idle | buscando | encontrado | erro
  const [resultado, setResultado] = useState(null)
  const [mensagemErro, setMensagemErro] = useState('')
  const timerRef = useRef(null)

  const buscar = useCallback((cidade, idprestador, nome_servico) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!idprestador || String(idprestador).length < 6) {
      setStatus('idle')
      setResultado(null)
      return
    }
    setStatus('buscando')
    timerRef.current = setTimeout(async () => {
      try {
        const { data: res } = await prestadoresService.busca({ cidade, idprestador, nome_servico })
        setResultado(res.data)
        setStatus('encontrado')
        setMensagemErro('')
      } catch (err) {
        setStatus('erro')
        setMensagemErro(err.response?.data?.error?.message || 'Prestador não encontrado')
        setResultado(null)
      }
    }, 500)
  }, [])

  return { status, resultado, mensagemErro, buscar }
}
