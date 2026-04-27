import { useEffect } from 'react'

export function useAutoSave(key, data) {
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch {
      // Autosave nao deve interromper o fluxo se o storage estiver indisponivel.
    }
  }, [key, data])
}

export function loadAutoSave(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearAutoSave(key) {
  localStorage.removeItem(key)
}
