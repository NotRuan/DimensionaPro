import { fmt } from '../../utils/formatters'

export function CamposCalculados({ servicos_diarios, capacidade_mensal, dedicacao_mawdy, pct_mawdy_capacidade, servicos_por_dia, onServicoPorDiaChange }) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-gray-50 rounded-lg">
      <div>
        <label className="text-xs text-gray-500">⚙️ Serviços por Dia (padrão)</label>
        <input
          type="number"
          value={servicos_por_dia}
          onChange={e => onServicoPorDiaChange(Number(e.target.value))}
          className="mt-1 w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-700"
          min={1}
        />
      </div>
      <div>
        <label className="text-xs text-gray-500">⚙️ Serviços Diários</label>
        <p className="mt-1 px-2 py-1 text-sm bg-gray-100 rounded text-gray-700">
          {servicos_diarios != null ? fmt.numero(servicos_diarios, 0) : '—'}
        </p>
      </div>
      <div>
        <label className="text-xs text-gray-500">⚙️ Capacidade Mensal</label>
        <p className="mt-1 px-2 py-1 text-sm bg-gray-100 rounded text-gray-700">
          {capacidade_mensal != null ? fmt.numero(capacidade_mensal, 0) : '—'}
        </p>
      </div>
      <div>
        <label className="text-xs text-gray-500">⚙️ % Dedicação MAWDY</label>
        <p className="mt-1 px-2 py-1 text-sm bg-gray-100 rounded text-gray-700">
          {dedicacao_mawdy != null ? fmt.pct(dedicacao_mawdy) : '—'}
        </p>
      </div>
      <div className="col-span-2">
        <label className="text-xs text-gray-500">⚙️ % MAWDY da Capacidade</label>
        <div className="mt-1 flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-700 rounded-full transition-all"
              style={{ width: `${Math.min((pct_mawdy_capacidade || 0) * 100, 100)}%` }}
            />
          </div>
          <span className="text-sm text-gray-700 w-12 text-right">
            {pct_mawdy_capacidade != null ? fmt.pct(pct_mawdy_capacidade) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
