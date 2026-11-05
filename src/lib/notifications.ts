import { Capacitor } from '@capacitor/core'
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications'
import { daysUntil, reminderMonthDay } from './dates'
import type { Person, Settings } from './types'

const CHANNEL_ID = 'birthdays'
const TEST_ID = 9

/**
 * Android's AlarmManager caps an app at ~500 pending alarms. Each person uses
 * up to 2, so above this cap we keep the soonest birthdays scheduled; the
 * set is recomputed every time the app opens, so nobody is permanently dropped.
 */
const MAX_SCHEDULED = 450

/** Slots per person: id*10 + 0 = on the day, id*10 + 1 = heads-up before. */
const dayOfId = (p: Person) => p.id * 10
const beforeId = (p: Person) => p.id * 10 + 1
const isOurs = (id: number) => id >= 10 && id !== TEST_ID

/**
 * IMPORTANT: the plugin passes `on.month` straight into java.util.Calendar on
 * Android, which is 0-based (Jan = 0). iOS uses 1-based DateComponents.
 * Passing 12 on Android would silently roll over into next January.
 */
function platformMonth(month1to12: number): number {
  return Capacitor.getPlatform() === 'android' ? month1to12 - 1 : month1to12
}

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported'

export async function checkPermission(): Promise<PermissionState> {
  try {
    const { display } = await LocalNotifications.checkPermissions()
    return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt'
  } catch {
    return 'unsupported'
  }
}

export async function requestPermission(): Promise<PermissionState> {
  try {
    const { display } = await LocalNotifications.requestPermissions()
    return display === 'granted' ? 'granted' : 'denied'
  } catch {
    return 'unsupported'
  }
}

/** Android 12+: exact alarms make reminders land on the minute instead of "roughly then". */
export async function exactAlarmsEnabled(): Promise<boolean | null> {
  if (Capacitor.getPlatform() !== 'android') return null
  try {
    const { exact_alarm } = await LocalNotifications.checkExactNotificationSetting()
    return exact_alarm === 'granted'
  } catch {
    return null
  }
}

export async function openExactAlarmSettings(): Promise<void> {
  try {
    await LocalNotifications.changeExactNotificationSetting()
  } catch {
    /* older Android: nothing to change */
  }
}

let channelReady = false
async function ensureChannel(): Promise<void> {
  if (channelReady || Capacitor.getPlatform() !== 'android') return
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: 'Birthday reminders',
    description: 'Reminders on and before birthdays',
    importance: 4, // high: heads-up banner + sound
    visibility: 1,
    vibration: true,
  })
  channelReady = true
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}

function build(people: Person[], s: Settings): LocalNotificationSchema[] {
  const out: LocalNotificationSchema[] = []
  // Soonest first, so the cap (if ever hit) drops the furthest-out reminders.
  const sorted = [...people].sort((a, b) => daysUntil(a.month, a.day) - daysUntil(b.month, b.day))

  for (const p of sorted) {
    // Notification text is static across yearly repeats, so it deliberately
    // avoids anything that changes year to year (like age).
    const dayOf = reminderMonthDay(p.month, p.day, 0)
    out.push({
      id: dayOfId(p),
      channelId: CHANNEL_ID,
      title: `It's ${firstName(p.name)}'s birthday today 🎂`,
      body: `Send ${firstName(p.name)} some love — a call or a message goes a long way.`,
      schedule: {
        on: { month: platformMonth(dayOf.month), day: dayOf.day, hour: s.hour, minute: s.minute, second: 0 },
        allowWhileIdle: true,
      },
      extra: { personId: p.id },
    })

    if (s.daysBefore > 0) {
      const before = reminderMonthDay(p.month, p.day, s.daysBefore)
      const when = s.daysBefore === 1 ? 'tomorrow' : `in ${s.daysBefore} days`
      out.push({
        id: beforeId(p),
        channelId: CHANNEL_ID,
        title: `${firstName(p.name)}'s birthday is ${when}`,
        body: 'A gentle heads-up, so there is time to plan something.',
        schedule: {
          on: { month: platformMonth(before.month), day: before.day, hour: s.hour, minute: s.minute, second: 0 },
          allowWhileIdle: true,
        },
        extra: { personId: p.id },
      })
    }
  }
  return out.slice(0, MAX_SCHEDULED)
}

/**
 * Idempotent full sync: cancel everything we own, then schedule from the
 * source of truth. Called on launch, on resume, and after every edit — so
 * deletes, edits, settings changes and the 500-alarm window all self-heal.
 */
let syncChain: Promise<void> = Promise.resolve()

export function syncNotifications(people: Person[], s: Settings): Promise<void> {
  // Serialize: overlapping cancel/schedule calls could otherwise interleave.
  syncChain = syncChain.catch(() => {}).then(async () => {
    if ((await checkPermission()) !== 'granted') return
    await ensureChannel()

    const { notifications: pending } = await LocalNotifications.getPending()
    const stale = pending.filter((n) => isOurs(n.id)).map((n) => ({ id: n.id }))
    if (stale.length) await LocalNotifications.cancel({ notifications: stale })

    const next = build(people, s)
    if (next.length) await LocalNotifications.schedule({ notifications: next })
  })
  return syncChain
}

export async function sendTestNotification(): Promise<void> {
  await ensureChannel()
  await LocalNotifications.schedule({
    notifications: [
      {
        id: TEST_ID,
        channelId: CHANNEL_ID,
        title: 'Drift is all set 🌙',
        body: "This is how birthday reminders will look. You're good to go.",
        schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
      },
    ],
  })
}
