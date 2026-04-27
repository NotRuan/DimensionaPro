import { STATUS_RESULTADO, STATUS_REVISAO } from '../../constants'

export function StatusBadge({ status }) {
  const config = STATUS_RESULTADO[status] || {}
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${config.bgClass || 'bg-gray-100 text-gray-600'}`}>
      {config.label || status}
    </span>
  )
}

export function RevisaoBadge({ status }) {
  const config = STATUS_REVISAO[status] || {}
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${config.bgClass || 'bg-gray-100 text-gray-600'}`}>
      {config.label || status}
    </span>
  )
}
