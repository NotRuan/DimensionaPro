import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { BuscaPrestador } from './BuscaPrestador'
import { CamposCalculados } from './CamposCalculados'

export function PrestadorCard({ prestador, index, cidade, tipoServico, onUpdate, onRemove, onDuplicate }) {
  const [expandido, setExpandido] = useState(true)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const update = (campos) => onUpdate(prestador._id, campos)

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-teal-700 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {index + 1}
          </span>
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            {prestador.status === 'nao_encontrado' && <span className="text-red-500">✕</span>}
            {prestador.nome_prestador || 'Prestador'} — {tipoServico === 'ELETRICISTA' ? 'Eletricista' : 'Encanador'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onDuplicate(prestador._id)} className="text-xs text-gray-500 hover:text-gray-700">⧉ Duplicar</button>
          {!confirmRemove
            ? <button onClick={() => setConfirmRemove(true)} className="text-xs text-red-500 hover:text-red-700">✕ Remover</button>
            : <span className="text-xs flex gap-2 items-center">
                <span className="text-gray-600">Confirmar?</span>
                <button onClick={() => onRemove(prestador._id)} className="text-red-600 font-semibold">Sim</button>
                <button onClick={() => setConfirmRemove(false)} className="text-gray-500">Não</button>
              </span>
          }
          <button onClick={() => setExpandido(e => !e)} className="text-gray-400 hover:text-gray-600 ml-2">
            {expandido ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {expandido && (
        <div className="p-4 flex flex-col gap-4">
          <BuscaPrestador
            cidade={cidade}
            tipoServico={tipoServico}
            prestador={prestador}
            onResultado={(dados) => update(dados)}
          />

          {prestador.status === 'nao_encontrado' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
              Nenhum dado encontrado para este prestador. Corrija o código acima ou adicione um prestador diferente.
            </div>
          )}

          {(prestador.status === 'encontrado' || prestador.status === 'completo') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Qtd. de Profissionais"
                  type="number"
                  required
                  value={prestador.qtd_profissionais}
                  onChange={e => update({ qtd_profissionais: e.target.value })}
                  placeholder="Ex: 2"
                />
                <Input
                  label="Volumetria Total do Prestador"
                  type="number"
                  required
                  value={prestador.volumetria_total}
                  onChange={e => update({ volumetria_total: e.target.value })}
                  placeholder="Todos os clientes"
                />
              </div>

              <CamposCalculados
                servicos_diarios={prestador.servicos_diarios}
                capacidade_mensal={prestador.capacidade_mensal}
                dedicacao_mawdy={prestador.dedicacao_mawdy}
                pct_mawdy_capacidade={prestador.pct_mawdy_capacidade}
                servicos_por_dia={prestador.servicos_por_dia}
                onServicoPorDiaChange={(v) => update({ servicos_por_dia: v })}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
