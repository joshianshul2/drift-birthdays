import { useRef, useState } from 'react'
import { Camera, Check, Trash2, X } from 'lucide-react'
import type { Person } from '../lib/types'
import { MONTHS, daysInMonth, isLeapYear } from '../lib/dates'
import { resizePhoto } from '../lib/image'
import { Avatar } from './Avatar'
import { Sheet } from './Sheet'

interface Props {
  person?: Person
  onSave: (draft: Omit<Person, 'id' | 'createdAt'>) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

const field = 'w-full bg-milk rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-bark/30 placeholder:text-bark/40'
const label = 'block text-[11px] uppercase tracking-widest font-semibold text-bark/60 mb-2 px-1'

export function EditorSheet({ person, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(person?.name ?? '')
  const [month, setMonth] = useState<number | ''>(person?.month ?? '')
  const [day, setDay] = useState<number | ''>(person?.day ?? '')
  const [year, setYear] = useState(person?.year ? String(person.year) : '')
  const [note, setNote] = useState(person?.note ?? '')
  const [photo, setPhoto] = useState<string | undefined>(person?.photo)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const currentYear = new Date().getFullYear()
  const maxDay = month ? daysInMonth(month) : 31

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    try {
      setPhoto(await resizePhoto(file))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not use that photo')
    }
  }

  function validate(): string | null {
    const n = name.trim()
    if (!n) return 'Add a name'
    if (n.length > 60) return 'That name is a little long (60 characters max)'
    if (!month) return 'Pick a month'
    if (!day) return 'Pick a day'
    if (day > daysInMonth(month)) return `${MONTHS[month - 1]} has only ${daysInMonth(month)} days`
    if (year) {
      const y = Number(year)
      if (!Number.isInteger(y) || y < 1900 || y > currentYear) return `Year should be between 1900 and ${currentYear}`
      if (month === 2 && day === 29 && !isLeapYear(y)) return `${y} wasn't a leap year`
      if (new Date(y, month - 1, day) > new Date()) return "That date hasn't happened yet"
    }
    return null
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const v = validate()
    if (v) return setError(v)
    setBusy(true)
    try {
      await onSave({
        name: name.trim(),
        month: month as number,
        day: day as number,
        year: year ? Number(year) : undefined,
        note: note.trim() || undefined,
        photo,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save — please try again')
      setBusy(false)
    }
  }

  return (
    <Sheet title={person ? 'Edit birthday' : 'New birthday'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative rounded-full"
            aria-label={photo ? 'Change photo' : 'Add photo'}
          >
            {photo || name ? (
              <Avatar name={name || '?'} photo={photo} size={104} />
            ) : (
              <span className="w-[104px] h-[104px] rounded-full bg-sand flex items-center justify-center text-[11px] uppercase tracking-widest font-semibold text-bark/70">
                Add photo
              </span>
            )}
            <span className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-bark text-milk flex items-center justify-center ring-4 ring-cream">
              <Camera size={16} />
            </span>
          </button>
          {photo && (
            <button type="button" onClick={() => setPhoto(undefined)} className="text-xs text-bark/60 flex items-center gap-1">
              <X size={12} /> Remove photo
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
        </div>

        <div>
          <label className={label} htmlFor="name">Name</label>
          <input
            id="name"
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Riya Sharma"
            autoComplete="off"
            maxLength={80}
          />
        </div>

        <div className="grid grid-cols-[1fr_1.6fr] gap-3">
          <div>
            <label className={label} htmlFor="day">Day</label>
            <select
              id="day"
              className={`${field} appearance-none`}
              value={day}
              onChange={(e) => setDay(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">—</option>
              {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="month">Month</label>
            <select
              id="month"
              className={`${field} appearance-none`}
              value={month}
              onChange={(e) => {
                const m = e.target.value ? Number(e.target.value) : ''
                setMonth(m)
                if (m && day && day > daysInMonth(m)) setDay(daysInMonth(m)) // e.g. 31 → 30
              }}
            >
              <option value="">—</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={label} htmlFor="year">Birth year <span className="normal-case tracking-normal font-normal">(optional, shows age)</span></label>
          <input
            id="year"
            className={field}
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            placeholder="e.g. 1996"
          />
        </div>

        <div>
          <label className={label} htmlFor="note">Note <span className="normal-case tracking-normal font-normal">(optional)</span></label>
          <input
            id="note"
            className={field}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Gift ideas, favourite cake…"
            maxLength={140}
          />
        </div>

        {month === 2 && day === 29 && (
          <p className="text-xs text-bark/60 px-1">In non-leap years, Drift reminds you on 28 February.</p>
        )}
        {error && <p className="text-sm text-[#9b2c1a] px-1 animate-fade-in-down" role="alert">{error}</p>}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-3 bg-bark hover:bg-bark-hover disabled:opacity-60 text-milk rounded-full pl-1.5 pr-6 py-1.5 uppercase tracking-wide text-xs font-medium transition"
          >
            <span className="w-9 h-9 rounded-full bg-white text-bark flex items-center justify-center">
              <Check size={16} />
            </span>
            {busy ? 'Saving…' : 'Save'}
          </button>
          {onDelete && (
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!confirmDelete) return setConfirmDelete(true)
                setBusy(true)
                try {
                  await onDelete()
                } catch {
                  setError('Could not delete — please try again')
                  setBusy(false)
                }
              }}
              className="flex items-center gap-3 bg-sand hover:bg-sand-hover text-bark rounded-full pl-1.5 pr-5 py-1.5 uppercase tracking-wide text-xs font-medium transition"
            >
              <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
                <Trash2 size={16} />
              </span>
              {confirmDelete ? 'Tap to confirm' : 'Delete'}
            </button>
          )}
        </div>
      </form>
    </Sheet>
  )
}
