import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import { adminService } from '../../services/admin.service'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import { Spinner } from '../../components/ui/Spinner'

export default function BasePrestadores() {
  const toast = useToast()
  const fileRef = useRef()
  const [resultado, setResultado] = useState(null)
  const [uploading, setUploading] = useState(false)

  const { data: importacoes } = useQuery({
    queryKey: ['importacoes-base'],
    queryFn: () => adminService.importacoes().then(r => r.data.data),
  })

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) { toast('Selecione um arquivo CSV', 'warning'); return }
    setUploading(true)
    setResultado(null)
    try {
      const form = new FormData()
      form.append('arquivo', file)
      const { data: res } = await api.post('/upload/csv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResultado(res.data)
      toast(`${res.data.importados} registros importados!`, 'success')
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Erro no upload', 'error')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Base de Prestadores</h1>
        <p className="text-sm text-gray-500">Importe a volumetria mensal e acompanhe o historico de cargas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,480px)_1fr] gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800">Atualizar Base Mensal</h2>
          <p className="text-sm text-gray-500">Os registros historicos serao preservados.</p>
          <p className="text-xs text-gray-400 font-mono">uf, cidade, idprestador, nome_prestador, nome_servico, assistencia, servicos_criados, mesn, mes, ano</p>
          <input ref={fileRef} type="file" accept=".csv" className="text-sm" />
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? <span className="flex items-center gap-2"><Spinner size="sm" /> Importando...</span> : 'Importar CSV'}
          </Button>

          {resultado && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-800 mb-2">Resultado</h3>
              <p className="text-sm">Total de linhas: <strong>{resultado.total_linhas}</strong></p>
              <p className="text-sm text-green-700">Importados: <strong>{resultado.importados}</strong></p>
              <p className={`text-sm ${resultado.erros > 0 ? 'text-red-600' : 'text-gray-500'}`}>Erros: <strong>{resultado.erros}</strong></p>
              {resultado.detalhes_erros?.length > 0 && (
                <div className="mt-3 max-h-40 overflow-y-auto">
                  {resultado.detalhes_erros.slice(0, 20).map((e, i) => (
                    <p key={i} className="text-xs text-red-500">Linha {e.linha} - {e.campo}: {e.motivo}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Historico de Importacoes</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Data', 'Arquivo', 'Usuario', 'Importados', 'Erros', 'Periodo'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(importacoes || []).map(i => (
                <tr key={i.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-gray-500">{new Date(i.created_at).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3">{i.arquivo_nome || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{i.usuario?.nome || '-'}</td>
                  <td className="px-4 py-3 text-green-700 font-semibold">{i.importados}</td>
                  <td className="px-4 py-3 text-red-700 font-semibold">{i.erros}</td>
                  <td className="px-4 py-3 text-gray-500">{i.periodo_importado || '-'}</td>
                </tr>
              ))}
              {(!importacoes || importacoes.length === 0) && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nenhuma importacao registrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
