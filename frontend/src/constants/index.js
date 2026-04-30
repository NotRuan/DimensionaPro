export const PERFIS = { ADM: 'ADM', CONSULTOR: 'CONSULTOR', GERENTE: 'GERENTE' }

export const SERVICOS = [
  { value: 'ELETRICISTA_ENCANADOR', label: 'Eletricista + Encanador' },
]

export const STATUS_RESULTADO = {
  SUBDIMENSIONADO: { label: 'Subdimensionado', color: 'red',    bgClass: 'bg-red-100 text-red-800' },
  ATENCAO:         { label: 'Atenção',          color: 'yellow', bgClass: 'bg-yellow-100 text-yellow-800' },
  ADEQUADO:        { label: 'Adequado',          color: 'green',  bgClass: 'bg-green-100 text-green-800' },
}

export const STATUS_REVISAO = {
  RASCUNHO:          { label: 'Rascunho',           bgClass: 'bg-blue-100 text-blue-700' },
  PENDENTE:          { label: 'Pendente',           bgClass: 'bg-gray-100 text-gray-700' },
  REVISADO:          { label: 'Revisado',           bgClass: 'bg-green-100 text-green-700' },
  AJUSTE_SOLICITADO: { label: 'Ajuste solicitado',  bgClass: 'bg-orange-100 text-orange-700' },
}
