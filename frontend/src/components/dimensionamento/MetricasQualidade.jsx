import { Input } from '../ui/Input'
import { Tooltip } from '../ui/Tooltip'
import { CoeficienteDisplay } from './CoeficienteDisplay'
import { getCoeficienteFromTabela, COEF_SEGURANCA } from '../../utils/coeficientes'
import { useConfiguracoesStore } from '../../store/configuracoesStore'
import { fmt } from '../../utils/formatters'

const METRICAS = [
  { key: 'pct_recusas',       label: '% Recusas',          suffix: '%',  coefKey: 'recusas' },
  { key: 'reclamacoes_ratio', label: 'Reclamações (ratio)', suffix: '',   coefKey: 'reclamacoes' },
  { key: 'tempo_chegada_min', label: 'Tempo de Chegada',    suffix: 'min', coefKey: 'tempoChegada' },
  { key: 'pct_deslocamento',  label: '% Deslocamento',      suffix: '%',  coefKey: 'deslocamento' },
  { key: 'nps',               label: 'NPS',                  suffix: '',  coefKey: 'nps' },
]

function erroMetrica(key, valor) {
  if (valor === '' || valor == null) return ''
  const n = Number(valor)
  if (Number.isNaN(n)) return 'Valor invalido'
  if (['pct_recusas', 'pct_deslocamento'].includes(key) && (n < 0 || n > 100)) return 'Use um percentual entre 0 e 100'
  if (key === 'nps' && (n < -100 || n > 100)) return 'Use NPS entre -100 e 100'
  if (key === 'tempo_chegada_min' && n < 0) return 'Tempo nao pode ser negativo'
  if (key === 'reclamacoes_ratio' && n < 0) return 'Valor nao pode ser negativo'
  return ''
}

function RangeList({ metrica, tabela }) {
  const ranges = tabela?.[metrica] ?? []
  return (
    <div>
      {ranges.map((r, i) => (
        <div key={i}>
          {r.min}{r.max !== null && r.max !== Infinity ? `–${r.max}` : '+'} → <strong>{r.coef}</strong>
        </div>
      ))}
    </div>
  )
}

export function MetricasQualidade({ prestador, onUpdate }) {
  const { cap_teorica, capacidade_real, tipo_servico } = prestador
  const tabela = useConfiguracoesStore(s => s.tabela)

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-4">
      <div className="mb-3">
        <p className="font-semibold text-gray-900">{prestador.nome_prestador} — {tipo_servico === 'ELETRICISTA' ? 'Eletricista' : 'Encanador'}</p>
        <p className="text-sm text-gray-500">Volume MAWDY: {prestador.volume_mawdy} serv/mês · Cap. Teórica: {fmt.numero(cap_teorica, 1)}</p>
      </div>

      <div className="flex flex-col gap-2">
        {METRICAS.map(m => {
          const val = prestador[m.key]
          const coef = getCoeficienteFromTabela(m.coefKey, val, tabela)
          const erro = erroMetrica(m.key, val)
          return (
            <div key={m.key} className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  label={<span>{m.label}<Tooltip content={<RangeList metrica={m.coefKey} tabela={tabela} />} /></span>}
                  type="number"
                  value={prestador[m.key] ?? ''}
                  onChange={e => onUpdate(prestador._id, { [m.key]: e.target.value })}
                  suffix={m.suffix}
                  required
                  error={erro}
                />
              </div>
              <div className="mt-5 w-14 text-center">
                <CoeficienteDisplay valor={coef} />
              </div>
            </div>
          )
        })}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-sm text-gray-500">Coeficiente de Segurança (automático)</span>
          <CoeficienteDisplay valor={COEF_SEGURANCA[tipo_servico]} />
        </div>

        <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${capacidade_real != null ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <span className="text-sm font-semibold text-gray-700">Capacidade Real</span>
          <span className="text-sm font-bold text-blue-700">{fmt.numero(capacidade_real, 1)} serv/mês</span>
        </div>
      </div>
    </div>
  )
}
