import { useEffect, useRef, useState } from 'react'

interface Props {
  onAdd: () => void
  onSettings: () => void
  onList: () => void
}

export function Navbar({ onAdd, onSettings, onList }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const go = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }

  const line = 'absolute left-0 w-5 h-[2px] bg-black rounded-full transition-transform duration-300 ease-drift'

  return (
    <div ref={ref} className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-8 bg-white rounded-full shadow-lg pl-6 pr-3 py-2.5">
        <span className="text-lg font-bold tracking-tight text-black">Drift.</span>
        <button
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="relative w-9 h-9 flex items-center justify-center"
        >
          <span className="relative w-5 h-3">
            <span className={`${line} top-0 ${open ? 'translate-y-[5px] rotate-45' : ''}`} />
            <span className={`${line} bottom-0 ${open ? '-translate-y-[5px] -rotate-45' : ''}`} />
          </span>
        </button>
      </div>

      <nav
        aria-hidden={!open}
        inert={!open}
        className={`absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg p-2 origin-top transition-all duration-200 ease-out ${
          open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
        }`}
      >
        {[
          ['Birthdays', onList],
          ['Add birthday', onAdd],
          ['Reminders', onSettings],
        ].map(([label, fn]) => (
          <button
            key={label as string}
            onClick={go(fn as () => void)}
            className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-black hover:bg-black/5 active:bg-black/10"
          >
            {label as string}
          </button>
        ))}
      </nav>
    </div>
  )
}
