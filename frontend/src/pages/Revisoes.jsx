import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { dimensionamentosService } from '../services/dimensionamentos.service'
import { StatusBadge, RevisaoBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { fmt } from '../utils/formatters'

const FILTRO_INICIAL = {
  status_revisao: 'PENDENTE',
  status_resultado: '',
  tipo_servico: '',
  uf: '',
  termo: '',
}

function normalizar(valor) {
  return (valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
}

export default function Revisoes() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [filtros, setFiltros] = useState(FILTRO_INICIAL)
  const [selecionados, setSelecionados] = useState([])

  const params = {
    status_revisao: filtros.status_revisao || undefined,
    status_resultado: filtros.status_resultado || undefined,
    tipo_servico: filtros.tipo_servico || undefined,
    uf: filtros.uf || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['revisoes', params],
    queryFn: () => dimensionamentosService.listar(params).then(r => r.data.data),
  })

  const registros = useMemo(() => {
    const termo = normalizar(filtros.termo)
    return (data || []).filter(d => {
      if (!termo) return true
      return normalizar(`${d.cidade} ${d.uf} ${d.consultor?.nome || ''}`).includes(termo)
    })
  }, [data, filtros.termo])

  const ufs = useMemo(() => Array.from(new Set((data || []).map(d => d.uf).filter(Boolean))).sort(), [data])

  const revisarLote = useMutation({
    mutationFn: () => dimensionamentosService.revisarLote(selecionados),
    onSuccess: () => {
      setSelecionados([])
      qc.invalidateQueries({ queryKey: ['revisoes'] })
      qc.invalidateQueries({ queryKey: ['dimensionamentos'] })
      qc.invalidateQueries({ queryKey: ['gerente-dashboard'] })
    },
  })

  const alternarSelecionado = (id) => {
    setSelecionados(atual => atual.includes(id)
      ? atual.filter(x => x !== id)
      : [...atual, id])
  }

  const exportar = () => {
    const rows = registros.map(d => ({
      Cidade: d.cidade,
      UF: d.uf,
      Servico: d.tipo_servico,
      Consultor: d.consultor?.nome || '',
      Indice: d.indice_capacidade,
      Status: d.status_resultado,
      Revisao: d.status_revisao,
      Criado_em: new Date(d.created_at).toLocaleString('pt-BR'),
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Revisoes')
    XLSX.writeFile(wb, 'fila_revisoes.xlsx')
  }

  const podeRevisarLote = selecionados.length > 0 && registros
    .filter(d => selecionados.includes(d.id))
    .every(d => d.status_resultado !== 'SUBDIMENSIONADO')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fila de Revisao</h1>
          <p className="text-sm text-gray-500">Priorize pendencias, revise detalhes e solicite ajustes aos consultores.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportar} disabled={registros.length === 0}>Exportar Excel</Button>
          <Button onClick={() => revisarLote.mutate()} disabled={!podeRevisarLote || revisarLote.isPending}>
            Revisar Selecionados
          </Button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          value={filtros.termo}
          onChange={e => setFiltros(f => ({ ...f, termo: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm md:col-span-2"
          placeholder="Buscar por cidade, UF ou consultor"
        />
        <select value={filtros.status_revisao} onChange={e => setFiltros(f => ({ ...f, status_revisao: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Todas revisoes</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="AJUSTE_SOLICITADO">Ajustes solicitados</option>
          <option value="REVISADO">Revisados</option>
        </select>
        <select value={filtros.status_resultado} onChange={e => setFiltros(f => ({ ...f, status_resultado: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Todos status</option>
          <option value="SUBDIMENSIONADO">Subdimensionado</option>
          <option value="ATENCAO">Atencao</option>
          <option value="ADEQUADO">Adequado</option>
        </select>
        <select value={filtros.tipo_servico} onChange={e => setFiltros(f => ({ ...f, tipo_servico: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Todos servicos</option>
          <option value="ELETRICISTA">Eletricista</option>
          <option value="ENCANADOR">Encanador</option>
        </select>
        <select value={filtros.uf} onChange={e => setFiltros(f => ({ ...f, uf: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option value="">Todas UFs</option>
          {ufs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
        </select>
      </div>

      {!podeRevisarLote && selecionados.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
          Revisao em lote fica bloqueada quando ha dimensionamento subdimensionado selecionado. Abra o detalhe para validar.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3"></th>
              {['Cidade / UF', 'Servico', 'Consultor', 'Indice', 'Status', 'Revisao', 'Criado', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center"><Spinner /></td></tr>
            ) : registros.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Nenhum item encontrado.</td></tr>
            ) : registros.map(d => (
              <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selecionados.includes(d.id)}
                    disabled={d.status_revisao !== 'PENDENTE'}
                    onChange={() => alternarSelecionado(d.id)}
                  />
                </td>
                <td className="px-4 py-3 font-medium">{d.cidade} <span className="text-xs text-gray-400">{d.uf}</span></td>
                <td className="px-4 py-3 text-gray-500">{d.tipo_servico}</td>
                <td className="px-4 py-3 text-gray-500">{d.consultor?.nome || '-'}</td>
                <td className="px-4 py-3 font-mono">{fmt.indice(d.indice_capacidade)}</td>
                <td className="px-4 py-3"><StatusBadge status={d.status_resultado} /></td>
                <td className="px-4 py-3"><RevisaoBadge status={d.status_revisao} /></td>
                <td className="px-4 py-3 text-gray-500">{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/revisoes/${d.id}`)}>Ver detalhes</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
