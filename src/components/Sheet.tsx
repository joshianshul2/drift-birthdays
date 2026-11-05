import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  // Lock background scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto no-scrollbar bg-cream rounded-t-[28px] px-5 pt-3 pb-8 animate-sheet-up">
        <div className="mx-auto w-10 h-1 rounded-full bg-sand mb-4" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-milk flex items-center justify-center">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
