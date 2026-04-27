import { useNavigate } from 'react-router-dom'
import { StatusBadge, RevisaoBadge } from '../ui/Badge'
import { fmt } from '../../utils/formatters'

export function TabelaCidades({ dados, onCidadeClick }) {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Cidade / UF', 'Serviço', 'Consultor', 'Índice', 'Status', 'Revisão', ''].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(dados || []).map(d => (
            <tr
              key={d.id}
              className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
              onClick={() => onCidadeClick(d.cidade)}
            >
              <td className="px-4 py-3 font-medium">{d.cidade} <span className="text-gray-400 text-xs">{d.uf}</span></td>
              <td className="px-4 py-3 text-gray-500">{d.tipo_servico}</td>
              <td className="px-4 py-3 text-gray-500">{d.consultor?.nome || '—'}</td>
              <td className="px-4 py-3 font-mono">{fmt.indice(d.indice_capacidade)}</td>
              <td className="px-4 py-3"><StatusBadge status={d.status_resultado} /></td>
              <td className="px-4 py-3"><RevisaoBadge status={d.status_revisao} /></td>
              <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => navigate(`/historico/${encodeURIComponent(d.cidade)}`)}
                  className="text-xs text-red-600 border border-red-200 rounded-md px-2 py-1 hover:bg-red-50 whitespace-nowrap"
                >
                  📋 Histórico
                </button>
              </td>
            </tr>
          ))}
          {(!dados || dados.length === 0) && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Nenhum dimensionamento registrado</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
