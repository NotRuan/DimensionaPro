import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/admin.service'

function StatCard({ label, value, tone = 'text-gray-900', hint }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${tone}`}>{value ?? '-'}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

export default function AdminStats() {
  const { data } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminService.dashboard().then(r => r.data.data),
  })

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Usuarios ativos" value={data?.usuarios_ativos} tone="text-blue-700" hint={`${data?.usuarios_inativos ?? 0} inativos`} />
        <StatCard label="Dimensionamentos mes" value={data?.dimensionamentos_mes} tone="text-green-700" />
        <StatCard label="Pendentes revisao" value={data?.revisao?.pendente} tone="text-red-700" />
        <StatCard label="Cidades ativas" value={data?.cidades_ativas} hint={`${data?.cidades_total ?? 0} cadastradas`} />
        <StatCard label="Registros base" value={data?.prestadores_registros} />
      </div>

      {data?.ultima_importacao && (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
          Ultima importacao: <strong>{new Date(data.ultima_importacao.created_at).toLocaleString('pt-BR')}</strong>
          {' '}({data.ultima_importacao.importados} importados, {data.ultima_importacao.erros} erros)
        </div>
      )}
    </div>
  )
}
