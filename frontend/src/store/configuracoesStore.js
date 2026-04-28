import { create } from 'zustand'
import { TABELA_COEFICIENTES, COEF_SEGURANCA } from '../utils/coeficientes'

function semReembolso(tabela = TABELA_COEFICIENTES) {
  const metricas = { ...(tabela || {}) }
  delete metricas.reembolso
  return metricas
}

export const useConfiguracoesStore = create((set) => ({
  tabela: TABELA_COEFICIENTES,
  coefSeguranca: COEF_SEGURANCA,
  janelaMeses: 6,
  carregado: false,

  setConfiguracoes: (configs) => set({
    tabela: semReembolso(configs.coeficientes ?? TABELA_COEFICIENTES),
    coefSeguranca: configs.parametros_gerais?.coef_seguranca ?? COEF_SEGURANCA,
    janelaMeses: configs.parametros_gerais?.janela_meses ?? 6,
    carregado: true,
  }),
}))
