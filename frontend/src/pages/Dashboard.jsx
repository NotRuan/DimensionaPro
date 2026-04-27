import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { dimensionamentosService } from '../services/dimensionamentos.service'
import AdminStats from '../components/dashboard/AdminStats'
import { MapaBrasil } from '../components/dashboard/MapaBrasil'
import { TabelaCidades } from '../components/dashboard/TabelaCidades'
import { PainelLateral } from '../components/dashboard/PainelLateral'
import { Button } from '../components/ui/Button'
import { PERFIS } from '../constants'

export default function Dashboard() {
  const perfil = useAuthStore(s => s.usuario?.perfil)
  const navigate = useNavigate()
  const [cidadeSelecionada, setCidadeSelecionada] = useState(null)
  const [filtroMapa, setFiltroMapa] = useState('TODOS')

  const { data: mapaData } = useQuery({
    queryKey: ['mapa'],
    queryFn: () => dimensionamentosService.mapa().then(r => r.data.data),
    refetchInterval: 60_000,
  })

  const { data: listaData } = useQuery({
    queryKey: ['dimensionamentos'],
    queryFn: () => dimensionamentosService.listar().then(r => r.data.data),
  })
  const { data: gerenteData } = useQuery({
    queryKey: ['gerente-dashboard'],
    queryFn: () => dimensionamentosService.dashboardGerente().then(r => r.data.data),
    enabled: perfil === PERFIS.GERENTE,
  })
  const lista = listaData ?? []
  const listaFiltradaMapa = lista.filter(d => {
    if (filtroMapa === 'TODOS') return true
    if (filtroMapa === 'PENDENTES') return d.status_revisao === 'PENDENTE'
    if (filtroMapa === 'SUBDIMENSIONADOS') return d.status_resultado === 'SUBDIMENSIONADO'
    if (filtroMapa === 'AJUSTES') return d.status_revisao === 'AJUSTE_SOLICITADO'
    return true
  })
  const resumoConsultor = {
    rascunhos: lista.filter(d => d.status_revisao === 'RASCUNHO').length,
    ajustes: lista.filter(d => d.status_revisao === 'AJUSTE_SOLICITADO').length,
    pendentes: lista.filter(d => d.status_revisao === 'PENDENTE').length,
    revisados: lista.filter(d => d.status_revisao === 'REVISADO').length,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        {perfil === PERFIS.CONSULTOR && (
          <Button onClick={() => navigate('/dimensionamento/novo')}>+ Novo Dimensionamento</Button>
        )}
      </div>

      {perfil === PERFIS.CONSULTOR && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['Rascunhos', resumoConsultor.rascunhos],
            ['Ajustes solicitados', resumoConsultor.ajustes],
            ['Pendentes', resumoConsultor.pendentes],
            ['Revisados', resumoConsultor.revisados],
          ].map(([label, valor]) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate('/dimensionamentos')}
              className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-left hover:bg-gray-50"
            >
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{valor}</p>
            </button>
          ))}
        </div>
      )}

      {perfil === PERFIS.GERENTE && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            ['Pendentes', gerenteData?.pendentes ?? 0],
            ['Subdim. pendentes', gerenteData?.subdimensionados_pendentes ?? 0],
            ['Ajustes', gerenteData?.ajustes ?? 0],
            ['Revisados no mes', gerenteData?.revisados_mes ?? 0],
            ['Total', gerenteData?.total ?? 0],
          ].map(([label, valor]) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate('/revisoes')}
              className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-left hover:bg-gray-50"
            >
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{valor}</p>
            </button>
          ))}
        </div>
      )}

      {perfil === PERFIS.ADM && <AdminStats dimensionamentos={lista} />}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="mb-3">
          <h2 className="font-semibold text-gray-800">Mapa de Status</h2>
          <p className="text-sm text-gray-500">Estados coloridos pelo pior status encontrado nas cidades dimensionadas.</p>
          {perfil === PERFIS.GERENTE && (
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                ['TODOS', 'Todos'],
                ['PENDENTES', 'Pendentes'],
                ['SUBDIMENSIONADOS', 'Subdimensionados'],
                ['AJUSTES', 'Ajustes'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFiltroMapa(value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${filtroMapa === value ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <MapaBrasil dados={perfil === PERFIS.GERENTE ? listaFiltradaMapa : (mapaData || [])} onCidadeClick={setCidadeSelecionada} />
      </div>

      {perfil === PERFIS.GERENTE && gerenteData?.pendentes_criticos?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-gray-800">Pendentes Criticos</h2>
              <p className="text-sm text-gray-500">Subdimensionados aguardando revisao.</p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/revisoes')}>Abrir fila</Button>
          </div>
          <TabelaCidades dados={gerenteData.pendentes_criticos} onCidadeClick={setCidadeSelecionada} />
        </div>
      )}

      <TabelaCidades dados={perfil === PERFIS.GERENTE ? listaFiltradaMapa : lista} onCidadeClick={setCidadeSelecionada} />

      {cidadeSelecionada && (
        <PainelLateral cidade={cidadeSelecionada} onFechar={() => setCidadeSelecionada(null)} />
      )}
    </div>
  )
}
