import { fmt } from '../../utils/formatters'

export function CoeficienteDisplay({ valor }) {
  if (valor === null || valor === undefined) return <span className="text-gray-400 text-sm">—</span>
  const color = valor >= 0.9 ? 'text-green-700 bg-green-100' : valor >= 0.75 ? 'text-yellow-700 bg-yellow-100' : 'text-red-700 bg-red-100'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {fmt.coef(valor)}
    </span>
  )
}
