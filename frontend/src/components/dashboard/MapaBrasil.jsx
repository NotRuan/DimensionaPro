import { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/gh/giuliano-macedo/geodata-br-states@main/geojson/br_states.json'

const UF_POR_CODIGO_IBGE = {
  11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
  21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
  31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP',
  41: 'PR', 42: 'SC', 43: 'RS',
  50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
}

const UF_POR_NOME = {
  ACRE: 'AC', ALAGOAS: 'AL', AMAPA: 'AP', AMAZONAS: 'AM', BAHIA: 'BA', CEARA: 'CE',
  DISTRITO_FEDERAL: 'DF', ESPIRITO_SANTO: 'ES', GOIAS: 'GO', MARANHAO: 'MA',
  MATO_GROSSO: 'MT', MATO_GROSSO_DO_SUL: 'MS', MINAS_GERAIS: 'MG', PARA: 'PA',
  PARAIBA: 'PB', PARANA: 'PR', PERNAMBUCO: 'PE', PIAUI: 'PI', RIO_DE_JANEIRO: 'RJ',
  RIO_GRANDE_DO_NORTE: 'RN', RIO_GRANDE_DO_SUL: 'RS', RONDONIA: 'RO', RORAIMA: 'RR',
  SANTA_CATARINA: 'SC', SAO_PAULO: 'SP', SERGIPE: 'SE', TOCANTINS: 'TO',
}

const COORDS_ESTIMADAS = {
  'BELEM': [-48.5, -1.45], 'SAO PAULO': [-46.63, -23.55], 'RIO DE JANEIRO': [-43.18, -22.9],
  'AMERICANA': [-47.33, -22.73], 'CURITIBA': [-49.27, -25.42], 'PORTO ALEGRE': [-51.22, -30.03],
  'FORTALEZA': [-38.53, -3.72], 'SALVADOR': [-38.5, -12.97], 'BELO HORIZONTE': [-43.94, -19.92],
  'MANAUS': [-60.02, -3.10], 'RECIFE': [-34.88, -8.05], 'BRASILIA': [-47.93, -15.78],
  'GOIANIA': [-49.25, -16.67], 'FLORIANOPOLIS': [-48.55, -27.59], 'NATAL': [-35.21, -5.79],
  'MACEIO': [-35.73, -9.67], 'JOAO PESSOA': [-34.86, -7.12], 'TERESINA': [-42.8, -5.09],
  'CAMPO GRANDE': [-54.62, -20.44], 'CUIABA': [-56.1, -15.6], 'PORTO VELHO': [-63.9, -8.76],
  'MACAPA': [-51.07, 0.03], 'BOA VISTA': [-60.67, 2.82], 'RIO BRANCO': [-67.81, -9.97],
  'PALMAS': [-48.33, -10.18], 'SAO LUIS': [-44.3, -2.53], 'ARACAJU': [-37.07, -10.91],
  'VITORIA': [-40.34, -20.32], 'CAMPINAS': [-47.06, -22.9],
}

const UF_CENTERS = {
  AC: [-70.2, -8.8], AL: [-36.7, -9.6], AP: [-51.6, 1.2], AM: [-63.4, -4.2], BA: [-41.7, -12.6],
  CE: [-39.6, -5.2], DF: [-47.9, -15.8], ES: [-40.7, -19.6], GO: [-49.8, -16.0], MA: [-45.3, -5.0],
  MT: [-56.1, -12.8], MS: [-54.6, -20.5], MG: [-44.5, -18.5], PA: [-52.0, -3.8], PB: [-36.8, -7.1],
  PR: [-51.6, -24.6], PE: [-37.9, -8.3], PI: [-42.8, -7.4], RJ: [-43.4, -22.3], RN: [-36.7, -5.8],
  RS: [-53.2, -30.0], RO: [-63.1, -10.8], RR: [-61.4, 1.8], SC: [-50.2, -27.3], SP: [-48.6, -22.4],
  SE: [-37.4, -10.6], TO: [-48.3, -10.2],
}

const COR_STATUS = { SUBDIMENSIONADO: '#DC2626', ATENCAO: '#D97706', ADEQUADO: '#16A34A' }
const COR_STATUS_HOVER = { SUBDIMENSIONADO: '#B91C1C', ATENCAO: '#B45309', ADEQUADO: '#15803D' }
const PRIORIDADE = { SUBDIMENSIONADO: 3, ATENCAO: 2, ADEQUADO: 1 }
const STATUS_LABEL = { SUBDIMENSIONADO: 'Subdimensionado', ATENCAO: 'Atencao', ADEQUADO: 'Adequado' }

function normalizarTexto(valor) {
  return (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
}

function corStatus(status, fallback = '#64748B') {
  return COR_STATUS[normalizarTexto(status)] || fallback
}

function agruparPorCidade(dados) {
  const map = new Map()
  dados.forEach(d => {
    const cidade = normalizarTexto(d.cidade)
    const atual = map.get(cidade)
    if (!atual || PRIORIDADE[d.status_resultado] > PRIORIDADE[atual.status_resultado]) {
      map.set(cidade, { ...d, cidadeKey: cidade })
    }
  })
  return Array.from(map.values())
}

function agruparPorUf(dados) {
  const map = new Map()
  dados.forEach(d => {
    const uf = normalizarTexto(d.uf)
    if (!uf) return

    const atual = map.get(uf)
    if (!atual || PRIORIDADE[d.status_resultado] > PRIORIDADE[atual.status_resultado]) {
      map.set(uf, {
        ...d,
        uf,
        total: (atual?.total || 0) + 1,
        cidades: Array.from(new Set([...(atual?.cidades || []), d.cidade].filter(Boolean))),
      })
    } else {
      map.set(uf, {
        ...atual,
        total: (atual.total || 0) + 1,
        cidades: Array.from(new Set([...(atual.cidades || []), d.cidade].filter(Boolean))),
      })
    }
  })
  return map
}

function obterUfDaGeografia(geo) {
  const props = geo.properties || {}
  const codigo = Number(props.codarea || props.CD_UF || props.codigo_ibg || props.id || geo.id)
  const valor = normalizarTexto(
    props.sigla ||
    props.SIGLA ||
    props.uf ||
    props.UF ||
    UF_POR_CODIGO_IBGE[codigo] ||
    geo.id
  )
  const nome = normalizarTexto(props.estado || props.name || props.nome || props.NOME || props.NM_ESTADO).replace(/\s+/g, '_')

  return valor.length === 2 ? valor : UF_POR_NOME[nome] || valor
}

export function MapaBrasil({ dados, onCidadeClick }) {
  const [tooltip, setTooltip] = useState(null)
  const [mapPosition, setMapPosition] = useState({ coordinates: [-53, -15], zoom: 1 })
  const cidades = useMemo(() => agruparPorCidade(dados || []), [dados])
  const dadosPorUf = useMemo(() => agruparPorUf(dados || []), [dados])
  const estadosComDados = useMemo(() => (
    Array.from(dadosPorUf.values())
      .sort((a, b) => PRIORIDADE[b.status_resultado] - PRIORIDADE[a.status_resultado] || a.uf.localeCompare(b.uf))
  ), [dadosPorUf])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-4">
      <div className="relative w-full bg-slate-50 rounded-lg border border-slate-200 overflow-hidden" style={{ height: 460 }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 760 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            center={mapPosition.coordinates}
            zoom={mapPosition.zoom}
            minZoom={1}
            maxZoom={5}
            onMoveEnd={setMapPosition}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const uf = obterUfDaGeografia(geo)
                  const dadoUf = dadosPorUf.get(uf)
                  const fill = COR_STATUS[dadoUf?.status_resultado] || '#E5E7EB'
                  const hoverFill = COR_STATUS_HOVER[dadoUf?.status_resultado] || '#CBD5E1'

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke="#FFFFFF"
                      strokeWidth={1}
                      style={{
                        default: { outline: 'none' },
                        hover: { fill: hoverFill, outline: 'none', cursor: dadoUf ? 'pointer' : 'default' },
                        pressed: { outline: 'none' },
                      }}
                      onClick={() => dadoUf?.cidade && onCidadeClick(dadoUf.cidade)}
                      onMouseEnter={e => dadoUf && setTooltip({ x: e.clientX, y: e.clientY, kind: 'uf', uf, status: dadoUf.status_resultado, total: dadoUf.total, cidades: dadoUf.cidades })}
                      onMouseMove={e => setTooltip(t => t && { ...t, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  )
                })
              }
            </Geographies>

            {Object.entries(UF_CENTERS).map(([uf, coords]) => {
              const dadoUf = dadosPorUf.get(uf)
              return (
                <Marker key={uf} coordinates={coords}>
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={`pointer-events-none select-none text-[9px] font-bold ${dadoUf ? 'fill-white' : 'fill-slate-500'}`}
                  >
                    {uf}
                  </text>
                </Marker>
              )
            })}

            {cidades.map(c => {
              const coords = COORDS_ESTIMADAS[c.cidadeKey]
              if (!coords) return null
              const statusNormalizado = normalizarTexto(c.status_resultado)
              return (
                <Marker key={c.cidade} coordinates={coords}>
                  <circle
                    r={5}
                    fill={corStatus(statusNormalizado)}
                    stroke="#fff"
                    strokeWidth={1.5}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onCidadeClick(c.cidade)}
                    onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, kind: 'cidade', cidade: c.cidade, uf: c.uf, status: statusNormalizado, indice: c.indice_capacidade, tipo: c.tipo_servico })}
                    onMouseMove={e => setTooltip(t => t && { ...t, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                </Marker>
              )
            })}
          </ZoomableGroup>
        </ComposableMap>

        {tooltip && (
          <div
            className="fixed z-50 pointer-events-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
            style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
          >
            <p className="font-semibold text-slate-900">
              {tooltip.kind === 'uf' ? tooltip.uf : `${tooltip.cidade}${tooltip.uf ? ` - ${tooltip.uf}` : ''}`}
            </p>
            <p className="text-slate-500">
              {tooltip.kind === 'uf' ? `${tooltip.total || 0} dimensionamento(s)` : (tooltip.tipo || 'Servico nao informado')}
            </p>
            <p className="mt-1">
              <span className="font-medium" style={{ color: COR_STATUS[tooltip.status] || '#475569' }}>
                {STATUS_LABEL[tooltip.status] || tooltip.status || 'Sem status'}
              </span>
              {tooltip.indice != null && <span className="text-slate-500"> · Indice {Number(tooltip.indice).toFixed(2)}</span>}
            </p>
          </div>
        )}

        <div className="absolute left-3 bottom-3 bg-white/95 border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            {Object.entries(STATUS_LABEL).map(([status, label]) => (
              <span key={status} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COR_STATUS[status] }} />
                {label}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              Sem dados
            </span>
          </div>
        </div>
      </div>

      <aside className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">Estados com dados</p>
          <p className="text-xs text-slate-500">{estadosComDados.length} UFs e {cidades.length} cidades</p>
        </div>
        <div className="max-h-[396px] overflow-y-auto">
          {estadosComDados.map(estado => (
            <button
              key={estado.uf}
              type="button"
              className="w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50"
              onClick={() => estado.cidade && onCidadeClick(estado.cidade)}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-800">{estado.uf}</span>
                <span className="text-[11px] font-medium text-white rounded-full px-2 py-0.5" style={{ backgroundColor: COR_STATUS[estado.status_resultado] || '#64748B' }}>
                  {STATUS_LABEL[estado.status_resultado] || 'Sem status'}
                </span>
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                {estado.cidades.slice(0, 3).join(', ')}
                {estado.cidades.length > 3 ? ` +${estado.cidades.length - 3}` : ''}
              </span>
            </button>
          ))}
          {estadosComDados.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-500">Nenhum dimensionamento para colorir o mapa.</p>
          )}
        </div>
      </aside>
    </div>
  )
}
