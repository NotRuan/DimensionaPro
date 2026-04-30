import { useEffect, useState } from 'react'
import { Input } from '../ui/Input'
import { Spinner } from '../ui/Spinner'
import { useBuscaPrestador } from '../../hooks/useBuscaPrestador'
import { prestadoresService } from '../../services/prestadores.service'

export function BuscaPrestador({ cidade, tipoServico, prestador, onResultado }) {
  const { status, resultado, mensagemErro, buscar } = useBuscaPrestador()
  const [buscaNome, setBuscaNome] = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [buscandoSugestoes, setBuscandoSugestoes] = useState(false)

  const handleCodigo = (e) => {
    const val = e.target.value
    onResultado({ idprestador: val, status: 'buscando' })
    buscar(cidade, val, tipoServico)
  }

  const pesquisarPorNome = async () => {
    if (buscaNome.trim().length < 2) return
    setBuscandoSugestoes(true)
    try {
      const { data: res } = await prestadoresService.sugestoes({ cidade, nome_servico: tipoServico, q: buscaNome })
      setSugestoes(res.data || [])
    } finally {
      setBuscandoSugestoes(false)
    }
  }

  const selecionarSugestao = (sugestao) => {
    const codigo = String(sugestao.idprestador)
    onResultado({ idprestador: codigo, status: 'buscando' })
    buscar(cidade, codigo, tipoServico)
    setSugestoes([])
    setBuscaNome('')
  }

  useEffect(() => {
    if (status === 'encontrado' && resultado) {
      onResultado({
        idprestador:    resultado.idprestador,
        nome_prestador: resultado.nome_prestador,
        volume_mawdy:   resultado.volume_medio_mensal,
        meses_encontrados: resultado.meses_encontrados,
        aviso:          null,
        status:         'encontrado',
      })
    }
    if (status === 'erro') {
      onResultado({ status: 'nao_encontrado' })
    }
  }, [status, resultado])

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          label="Código do Prestador"
          required
          value={prestador.idprestador}
          onChange={handleCodigo}
          placeholder="Ex: 250010"
        />
        {status === 'buscando' && (
          <div className="absolute right-3 top-8"><Spinner size="sm" /></div>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={buscaNome}
            onChange={e => setBuscaNome(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') pesquisarPorNome() }}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
            placeholder="Pesquisar prestador por nome..."
          />
          <button
            type="button"
            onClick={pesquisarPorNome}
            disabled={buscandoSugestoes || buscaNome.trim().length < 2}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {buscandoSugestoes ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {sugestoes.length > 0 && (
          <div className="flex flex-col gap-1">
            {sugestoes.map(s => (
              <button
                key={s.idprestador}
                type="button"
                onClick={() => selecionarSugestao(s)}
                className="text-left px-2 py-1.5 rounded hover:bg-white text-sm"
              >
                <span className="font-medium text-gray-800">{s.nome_prestador}</span>
                <span className="text-gray-500"> - {s.idprestador}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {status === 'idle' && prestador.idprestador && String(prestador.idprestador).length < 6 && (
        <p className="text-xs text-gray-400">Continue digitando o código completo do prestador…</p>
      )}

      {status === 'encontrado' && resultado && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
          <p className="font-semibold text-green-800">{resultado.nome_prestador}</p>
          <p className="text-green-600">Volume MAWDY: <strong>{resultado.volume_medio_mensal} serviços/mês</strong></p>
          <p className="text-green-500 text-xs">Média de {resultado.meses_encontrados} meses</p>
          {resultado.aviso && (
            <p className="mt-1 text-yellow-700 bg-yellow-50 px-2 py-1 rounded text-xs">⚠️ {resultado.aviso}</p>
          )}
        </div>
      )}

      {status === 'erro' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex flex-col gap-1">
          <p className="text-sm font-semibold text-red-700 flex items-center gap-1">
            <span>✕</span> Prestador não encontrado
          </p>
          <p className="text-xs text-red-600">{mensagemErro}</p>
          <p className="text-xs text-red-500 mt-1">Verifique o código digitado ou consulte a base de prestadores.</p>
        </div>
      )}
    </div>
  )
}
