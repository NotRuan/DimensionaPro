import { create } from 'zustand'
import { TABELA_COEFICIENTES, COEF_SEGURANCA } from '../utils/coeficientes'

export const useConfiguracoesStore = create((set) => ({
  tabela: TABELA_COEFICIENTES,
  coefSeguranca: COEF_SEGURANCA,
  janelaMeses: 6,
  carregado: false,

  setConfiguracoes: (configs) => set({
    tabela: configs.coeficientes ?? TABELA_COEFICIENTES,
    coefSeguranca: configs.parametros_gerais?.coef_seguranca ?? COEF_SEGURANCA,
    janelaMeses: configs.parametros_gerais?.janela_meses ?? 6,
    carregado: true,
  }),
}))
