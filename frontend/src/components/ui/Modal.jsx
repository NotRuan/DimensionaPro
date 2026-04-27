import { useEffect } from 'react'
import { Button } from './Button'

export function Modal({ open, title, children, onClose, onConfirm, confirmLabel = 'Confirmar', confirmVariant = 'primary', loading }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="text-sm text-gray-600 mb-6">{children}</div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          {onConfirm && (
            <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>
              {loading ? 'Aguarde...' : confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
