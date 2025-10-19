import type { ReactNode } from "react"
import { useEffect } from "react"
import { createPortal } from "react-dom"

type Props = {
  open: boolean
  title?: string
  children?: ReactNode
  footer?: ReactNode
  onClose?: () => void
}

export default function Modal({ open, title, children, footer, onClose }: Props) {
  // bloquea scroll del body
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = original }
  }, [open])

  if (!open) return null

  // 🔑 Renderiza en <body> para que fixed sea verdaderamente a viewport
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 sm:p-6">
      {/* Overlay FULL viewport */}
      <div
        className="fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur-[6px] animate-fade-in"
        onClick={onClose}
      />
      {/* Panel optimizado para móvil */}
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl border border-gray-100 shadow-[0_8px_50px_rgba(0,0,0,0.25)] animate-scale-in overflow-hidden max-h-[85vh] sm:max-h-[90vh] flex flex-col">
        {title && (
          <div className="p-4 sm:p-5 border-b border-gray-100 flex-shrink-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 text-center sm:text-left">{title}</h3>
          </div>
        )}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-4 py-4 sm:px-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
