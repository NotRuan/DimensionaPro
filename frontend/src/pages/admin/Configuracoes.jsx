import { useState } from 'react'
import { useConfiguracoesStore } from '../../store/configuracoesStore'
import configuracoesService from '../../services/configuracoes.service'
import { useToast } from '../../components/ui/Toast'

const METRICAS = [
  { key: 'recusas',      label: '% Recusas' },
  { key: 'reclamacoes',  label: 'Reclamações (ratio)' },
  { key: 'tempoChegada', label: 'Tempo de Chegada (min)' },
  { key: 'deslocamento', label: '% Deslocamento' },
  { key: 'reembolso',    label: '% Reembolso' },
  { key: 'nps',          label: 'NPS' },
]

export default function Configuracoes() {
  const toast = useToast()
  const { tabela, coefSeguranca, janelaMeses, setConfiguracoes } = useConfiguracoesStore()

  // Local edit state — clone of store values
  const [tabelaEdit, setTabelaEdit] = useState(() => JSON.parse(JSON.stringify(tabela)))
  const [coefSegEdit, setCoefSegEdit] = useState({ ...coefSeguranca })
  const [janelaMesesEdit, setJanelaMesesEdit] = useState(janelaMeses)
  const [saving, setSaving] = useState(false)

  function handleRangeChange(metrica, idx, field, value) {
    setTabelaEdit(prev => {
      const next = { ...prev, [metrica]: prev[metrica].map((r, i) =>
        i === idx ? { ...r, [field]: value === '' ? null : parseFloat(value) } : r
      )}
      return next
    })
  }

  async function handleSalvar() {
    setSaving(true)
    try {
      await configuracoesService.salvar('coeficientes', tabelaEdit)
      await configuracoesService.salvar('parametros_gerais', {
        coef_seguranca: coefSegEdit,
        janela_meses: janelaMesesEdit,
      })
      setConfiguracoes({
        coeficientes: tabelaEdit,
        parametros_gerais: { coef_seguranca: coefSegEdit, janela_meses: janelaMesesEdit },
      })
      toast('Configurações salvas com sucesso!', 'success')
    } catch {
      toast('Erro ao salvar configurações.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurações do Sistema</h1>

      {/* Parâmetros Gerais */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Parâmetros Gerais</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Coef. Segurança Eletricista</label>
            <input
              type="number" step="0.01" min="0" max="1"
              value={coefSegEdit.ELETRICISTA}
              onChange={e => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v)) setCoefSegEdit(p => ({ ...p, ELETRICISTA: v }))
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Coef. Segurança Encanador</label>
            <input
              type="number" step="0.01" min="0" max="1"
              value={coefSegEdit.ENCANADOR}
              onChange={e => {
                const v = parseFloat(e.target.value)
                if (!isNaN(v)) setCoefSegEdit(p => ({ ...p, ENCANADOR: v }))
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Janela de Meses</label>
            <input
              type="number" min="1" max="24"
              value={janelaMesesEdit}
              onChange={e => {
                const v = parseInt(e.target.value)
                if (!isNaN(v)) setJanelaMesesEdit(v)
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Coeficientes de Qualidade */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Coeficientes de Qualidade</h2>
        {METRICAS.map(({ key, label }) => (
          <div key={key} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">{label}</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 border border-gray-200 font-medium text-gray-500">Min</th>
                  <th className="text-left px-3 py-2 border border-gray-200 font-medium text-gray-500">Max</th>
                  <th className="text-left px-3 py-2 border border-gray-200 font-medium text-gray-500">Coeficiente</th>
                </tr>
              </thead>
              <tbody>
                {tabelaEdit[key]?.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-1 border border-gray-200">
                      <input
                        type="number" step="any"
                        value={row.min ?? ''}
                        onChange={e => handleRangeChange(key, idx, 'min', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-2 py-1 border border-gray-200">
                      <input
                        type="number" step="any"
                        value={row.max ?? ''}
                        placeholder="∞"
                        onChange={e => handleRangeChange(key, idx, 'max', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-2 py-1 border border-gray-200">
                      <input
                        type="number" step="0.01" min="0" max="1"
                        value={row.coef ?? ''}
                        onChange={e => handleRangeChange(key, idx, 'coef', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      <div className="flex justify-end">
        <button
          onClick={handleSalvar}
          disabled={saving}
          className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )
}
