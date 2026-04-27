import { create } from 'zustand'

export const useNotificacoesStore = create((set) => ({
  naoLidas: 0,
  notificacoes: [],
  setNaoLidas: (n) => set({ naoLidas: n }),
  setNotificacoes: (lista) => set({ notificacoes: lista }),
}))
