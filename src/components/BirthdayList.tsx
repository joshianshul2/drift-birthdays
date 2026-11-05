import { useMemo, useState } from 'react'
import { Bell, BellOff, Cake, Mail, Plus, Search } from 'lucide-react'
import type { Person } from '../lib/types'
import { MONTHS, daysUntil, formatMonthDay, nextOccurrence, relativeLabel, turningAge } from '../lib/dates'
import type { PermissionState } from '../lib/notifications'
import { Avatar } from './Avatar'
import { Divider } from './Divider'
import { Logo } from './Logo'

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
    <section id="birthdays" className="relative z-10 bg-cream rounded-t-[25px] px-5 pt-10 pb-32 min-h-[60vh]">
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
                  className="w-full bg-bark text-milk rounded-3xl p-5 flex items-center gap-4 text-left animate-fade-in-down"
                >
                  <Avatar name={p.name} photo={p.photo} size={64} ring />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-semibold text-milk/60">
                      <Cake size={13} /> Today
                    </span>
                    <span className="block text-2xl mt-1 truncate">{p.name}</span>
                    <span className="block text-sm text-milk/70 mt-0.5">
                      {age ? `Turns ${age} — ` : ''}
                      <span className="serif-italic text-base">send some love</span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <p className="text-center text-base leading-relaxed max-w-sm mx-auto">
          {people.length === 0
            ? 'Add the people who matter. Drift remembers, so you can simply show up.'
            : `${people.length} ${people.length === 1 ? 'person' : 'people'}, gently remembered.`}
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
          <div className="flex flex-col items-center text-center gap-3 py-6 text-bark/60">
            <Mail size={22} />
            <p className="text-sm max-w-[260px]">Start with one name. A partner, a parent, a friend you keep meaning to call.</p>
          </div>
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
                        className="w-full flex items-center gap-4 bg-milk/70 hover:bg-milk rounded-2xl p-3 text-left transition active:scale-[0.99]"
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
