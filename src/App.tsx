import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Hero } from './components/Hero'
import { BirthdayList } from './components/BirthdayList'
import { EditorSheet } from './components/EditorSheet'
import { SettingsSheet } from './components/SettingsSheet'
import type { Person, Settings } from './lib/types'
import { deletePerson, listPeople, loadSettings, nextId, requestPersistence, savePerson, saveSettings } from './lib/storage'
import { checkPermission, requestPermission, syncNotifications, type PermissionState } from './lib/notifications'
import { daysUntil } from './lib/dates'

type Editing = { mode: 'new' } | { mode: 'edit'; person: Person } | null

export default function App() {
  const [people, setPeople] = useState<Person[]>([])
  const [loaded, setLoaded] = useState(false)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [permission, setPermission] = useState<PermissionState>('prompt')
  const [editing, setEditing] = useState<Editing>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [loadError, setLoadError] = useState<string | null>(null)

  // Refs so long-lived native listeners always see current state.
  const state = useRef({ people, settings, editing, settingsOpen })
  // A reminder tapped on cold start can arrive before IndexedDB has loaded.
  const pendingOpen = useRef<number | null>(null)
  state.current = { people, settings, editing, settingsOpen }

  const resync = useCallback(async (list: Person[], s: Settings) => {
    try {
      await syncNotifications(list, s)
    } catch (e) {
      console.error('Notification sync failed', e)
    }
  }, [])

  // Initial load.
  useEffect(() => {
    requestPersistence()
    ;(async () => {
      try {
        const list = await listPeople()
        setPeople(list)
        const wanted = list.find((p) => p.id === pendingOpen.current)
        if (wanted) setEditing({ mode: 'edit', person: wanted })
        pendingOpen.current = null
        const perm = await checkPermission()
        setPermission(perm)
        await resync(list, state.current.settings)
      } catch (e) {
        console.error(e)
        setLoadError('Could not open your saved birthdays.')
      } finally {
        setLoaded(true)
      }
    })()
  }, [resync])

  // On resume: refresh "today", re-check permission (user may have changed it
  // in system settings), and re-sync so the alarm window stays fresh.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const subs = [
      CapApp.addListener('resume', async () => {
        setNow(new Date())
        const perm = await checkPermission()
        setPermission(perm)
        resync(state.current.people, state.current.settings)
      }),
      CapApp.addListener('backButton', () => {
        const s = state.current
        if (s.editing) setEditing(null)
        else if (s.settingsOpen) setSettingsOpen(false)
        else CapApp.minimizeApp() // feels native; keeps the app warm
      }),
      // Tapping a reminder opens that person.
      LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
        const id = notification.extra?.personId
        const p = state.current.people.find((x) => x.id === id)
        if (p) setEditing({ mode: 'edit', person: p })
        else if (typeof id === 'number') pendingOpen.current = id
      }),
    ]
    return () => {
      subs.forEach((s) => s.then((h) => h.remove()))
    }
  }, [resync])

  // Roll "today" over at midnight if the app is left open.
  useEffect(() => {
    const t = new Date(now)
    t.setHours(24, 0, 5, 0)
    const timer = setTimeout(() => setNow(new Date()), t.getTime() - now.getTime())
    return () => clearTimeout(timer)
  }, [now])

  const askPermission = useCallback(async () => {
    const perm = await requestPermission()
    setPermission(perm)
    if (perm === 'granted') resync(state.current.people, state.current.settings)
  }, [resync])

  const next = useMemo(
    () =>
      [...people].sort((a, b) => daysUntil(a.month, a.day, now) - daysUntil(b.month, b.day, now))[0],
    [people, now],
  )

  async function handleSave(draft: Omit<Person, 'id' | 'createdAt'>) {
    const current = state.current.editing
    const person: Person =
      current?.mode === 'edit'
        ? { ...current.person, ...draft }
        : { ...draft, id: nextId(people), createdAt: Date.now() }
    await savePerson(person)
    const list = [...people.filter((p) => p.id !== person.id), person]
    setPeople(list)
    setEditing(null)
    // Ask for permission at the moment it's obviously useful — after the first save.
    if (permission === 'prompt') {
      const perm = await requestPermission()
      setPermission(perm)
    }
    resync(list, settings)
  }

  async function handleDelete(person: Person) {
    await deletePerson(person.id)
    const list = people.filter((p) => p.id !== person.id)
    setPeople(list)
    setEditing(null)
    resync(list, settings)
  }

  function handleSettings(s: Settings) {
    setSettings(s)
    saveSettings(s)
    resync(people, s)
  }

  const scrollToList = () => document.getElementById('birthdays')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <main className="min-h-screen">
      <Hero
        next={next}
        onAdd={() => setEditing({ mode: 'new' })}
        onSettings={() => setSettingsOpen(true)}
        onList={scrollToList}
      />

      {loadError ? (
        <section className="relative z-10 bg-cream rounded-t-[25px] px-5 py-16 text-center">{loadError}</section>
      ) : loaded ? (
        <BirthdayList
          people={people}
          now={now}
          permission={permission}
          onAdd={() => setEditing({ mode: 'new' })}
          onEdit={(p) => setEditing({ mode: 'edit', person: p })}
          onEnableNotifications={askPermission}
        />
      ) : (
        <section className="relative z-10 bg-cream rounded-t-[25px] min-h-[60vh]" />
      )}

      {people.length > 0 && !editing && !settingsOpen && (
        <button
          onClick={() => setEditing({ mode: 'new' })}
          aria-label="Add birthday"
          className="fixed bottom-6 right-5 z-40 w-14 h-14 rounded-full bg-bark text-milk shadow-xl flex items-center justify-center active:scale-95 transition"
        >
          <Plus size={24} />
        </button>
      )}

      {editing && (
        <EditorSheet
          key={editing.mode === 'edit' ? editing.person.id : 'new'}
          person={editing.mode === 'edit' ? editing.person : undefined}
          onSave={handleSave}
          onDelete={editing.mode === 'edit' ? () => handleDelete(editing.person) : undefined}
          onClose={() => setEditing(null)}
        />
      )}

      {settingsOpen && (
        <SettingsSheet
          settings={settings}
          permission={permission}
          onChange={handleSettings}
          onEnableNotifications={askPermission}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </main>
  )
}
