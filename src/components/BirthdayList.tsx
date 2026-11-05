import { useMemo, useState } from 'react'
import { Bell, BellOff, Cake, Plus, Search } from 'lucide-react'
import type { Person } from '../lib/types'
import { MONTHS, daysUntil, formatMonthDay, nextOccurrence, relativeLabel, turningAge } from '../lib/dates'
import type { PermissionState } from '../lib/notifications'
import { Avatar } from './Avatar'
import { Divider } from './Divider'
import { Logo } from './Logo'
import neonRainbow from '../images/neon-rainbow.jpg'
import dessertPlate from '../images/dessert-plate.jpg'

interface Props {
  people: Person[]
  now: Date
  permission: PermissionState
  onAdd: () => void
  onEdit: (p: Person) => void
  onEnableNotifications: () => void
}

export function BirthdayList({ people, now, permission, onAdd, onEdit, onEnableNotifications }: Props) {
  const [query, setQuery] = useState('')

  const sorted = useMemo(
    () =>
      people
        .map((p) => ({ p, days: daysUntil(p.month, p.day, now) }))
        .sort((a, b) => a.days - b.days || a.p.name.localeCompare(b.p.name)),
    [people, now],
  )

  const today = sorted.filter((x) => x.days === 0)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rest = sorted.filter((x) => x.days > 0)
    return q ? sorted.filter((x) => x.p.name.toLowerCase().includes(q)) : rest
  }, [sorted, query])

  // Group upcoming by the month (and year) they next occur in.
  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const x of filtered) {
      const d = nextOccurrence(x.p.month, x.p.day, now)
      const key = `${MONTHS[d.getMonth()]}${d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : ''}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(x)
    }
    return [...map.entries()]
  }, [filtered, now])

  return (
    <section id="birthdays" className="relative z-10 paper rounded-t-[25px] px-5 pt-10 pb-32 min-h-[60vh]">
      <div className="max-w-xl mx-auto">
        {permission !== 'granted' && permission !== 'unsupported' && (
          <button
            onClick={onEnableNotifications}
            className="w-full mb-8 flex items-center gap-3 bg-milk rounded-2xl p-4 text-left active:scale-[0.99] transition"
          >
            <span className="w-10 h-10 rounded-full bg-bark text-milk flex items-center justify-center shrink-0">
              <BellOff size={18} />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">Reminders are off</span>
              <span className="block text-xs text-bark/70 mt-0.5">
                {permission === 'denied'
                  ? 'Allow notifications for Drift in your phone settings.'
                  : 'Tap to allow notifications so Drift can nudge you.'}
              </span>
            </span>
          </button>
        )}

        {today.length > 0 && (
          <div className="mb-10 space-y-3">
            {today.map(({ p }) => {
              const age = turningAge(p.month, p.day, p.year, now)
              return (
                <button
                  key={p.id}
                  onClick={() => onEdit(p)}
                  className="relative w-full overflow-hidden rounded-3xl text-left animate-fade-in-down shadow-[0_20px_40px_-20px_rgba(50,28,4,0.6)]"
                >
                  <img src={neonRainbow} alt="" className="absolute inset-y-0 right-0 w-[70%] h-full object-cover object-[70%_50%]" />
                  <span className="absolute inset-0 bg-gradient-to-r from-[#1F1003] via-[#1F1003]/90 via-45% to-[#1F1003]/10" />
                  <span className="relative flex items-center gap-4 p-5 text-milk">
                    <Avatar name={p.name} photo={p.photo} size={68} ring />
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-semibold text-milk/70">
                        <Cake size={13} /> Today
                      </span>
                      <span className="block text-2xl mt-1 truncate">{p.name}</span>
                      <span className="block text-sm text-milk/80 mt-0.5">
                        {age ? `Turns ${age} — ` : ''}
                        <span className="serif-italic text-base">send some love</span>
                      </span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <p className="text-center text-base leading-relaxed max-w-sm mx-auto">
          {people.length === 0
            ? 'Add the people who matter. Drift remembers — you simply show up.'
            : `${people.length} ${people.length === 1 ? 'person' : 'people'}, lovingly remembered.`}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={onAdd}
            className="flex items-center gap-3 bg-bark hover:bg-bark-hover text-milk rounded-full pl-1.5 pr-5 py-1.5 uppercase tracking-wide text-xs font-medium transition"
          >
            <span className="w-8 h-8 rounded-full bg-white text-bark flex items-center justify-center">
              <Plus size={16} />
            </span>
            Add birthday
          </button>
          {permission === 'granted' && (
            <span className="flex items-center gap-3 bg-sand text-bark rounded-full pl-1.5 pr-5 py-1.5 uppercase tracking-wide text-xs font-medium">
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <Bell size={16} />
              </span>
              Reminders on
            </span>
          )}
        </div>

        {people.length > 6 && (
          <label className="mt-8 flex items-center gap-2 bg-milk rounded-full px-4 py-3">
            <Search size={16} className="text-bark/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search names"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-bark/40"
            />
          </label>
        )}

        <div className="my-10">
          <Divider />
        </div>

        {groups.length === 0 && people.length > 0 && (
          <p className="text-center text-sm text-bark/60">{query ? 'No one matches that name.' : 'Only today’s birthdays — all caught up.'}</p>
        )}

        {people.length === 0 && (
          <button
            onClick={onAdd}
            className="relative w-full overflow-hidden rounded-3xl text-left shadow-[0_20px_40px_-24px_rgba(50,28,4,0.7)] active:scale-[0.99] transition"
          >
            <img src={dessertPlate} alt="" className="w-full aspect-[4/3] object-cover object-top" />
            <span className="absolute inset-0 bg-gradient-to-t from-[#1F1003] via-[#1F1003]/80 via-40% to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-5 text-milk">
              <span className="block text-[11px] uppercase tracking-widest font-semibold text-milk/70">Your first reminder</span>
              <span className="block text-xl mt-1">
                Who would you <span className="serif-italic text-2xl">hate</span> to forget?
              </span>
              <span className="block text-sm text-milk/75 mt-1">A partner, a parent, a friend you keep meaning to call.</span>
            </span>
          </button>
        )}

        <div className="space-y-10">
          {groups.map(([month, items]) => (
            <div key={month}>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-bark/60 mb-3 px-1">{month}</h2>
              <ul className="space-y-2">
                {items.map(({ p, days }) => {
                  const age = turningAge(p.month, p.day, p.year, now)
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => onEdit(p)}
                        className="w-full flex items-center gap-4 bg-milk/80 hover:bg-milk border border-white/70 shadow-[0_6px_16px_-12px_rgba(50,28,4,0.45)] rounded-2xl p-3 text-left transition active:scale-[0.99]"
                      >
                        <Avatar name={p.name} photo={p.photo} />
                        <span className="flex-1 min-w-0">
                          <span className="block font-medium truncate">{p.name}</span>
                          <span className="block text-xs text-bark/60 mt-0.5">
                            {formatMonthDay(p.month, p.day)}
                            {age ? ` · turns ${age}` : ''}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 text-[11px] font-semibold uppercase tracking-wide rounded-full px-3 py-1.5 ${
                            days <= 7 ? 'bg-bark text-milk' : 'bg-sand text-bark'
                          }`}
                        >
                          {relativeLabel(days)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex items-center gap-4 text-bark/80">
          <Logo size={32} />
          <span className="text-[10px] uppercase tracking-widest font-semibold leading-tight">
            Calm
            <br />
            Amplified
          </span>
        </div>
      </div>
    </section>
  )
}
