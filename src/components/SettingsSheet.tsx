import { useEffect, useState } from 'react'
import { BellRing, Zap } from 'lucide-react'
import type { Settings } from '../lib/types'
import {
  exactAlarmsEnabled,
  openExactAlarmSettings,
  sendTestNotification,
  type PermissionState,
} from '../lib/notifications'
import { Sheet } from './Sheet'

interface Props {
  settings: Settings
  permission: PermissionState
  onChange: (s: Settings) => void
  onEnableNotifications: () => void
  onClose: () => void
}

const OPTIONS: Settings['daysBefore'][] = [0, 1, 3, 7]
const label = 'block text-[11px] uppercase tracking-widest font-semibold text-bark/60 mb-2 px-1'
const pad = (n: number) => String(n).padStart(2, '0')

export function SettingsSheet({ settings, permission, onChange, onEnableNotifications, onClose }: Props) {
  const [exact, setExact] = useState<boolean | null>(null)
  const [testSent, setTestSent] = useState(false)

  useEffect(() => {
    exactAlarmsEnabled().then(setExact)
    // Re-check when the user returns from the system settings screen.
    const onVis = () => document.visibilityState === 'visible' && exactAlarmsEnabled().then(setExact)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <Sheet title="Reminders" onClose={onClose}>
      <div className="space-y-7">
        <div>
          <label className={label} htmlFor="time">Remind me at</label>
          <div className="flex items-center gap-3 bg-milk rounded-2xl px-4 py-3">
            <input
              id="time"
              type="time"
              className="flex-1 bg-transparent outline-none text-lg"
              value={`${pad(settings.hour)}:${pad(settings.minute)}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number)
                if (Number.isFinite(h) && Number.isFinite(m)) onChange({ ...settings, hour: h, minute: m })
              }}
            />
          </div>
          <p className="text-xs text-bark/60 mt-2 px-1">You'll always get a reminder on the day itself.</p>
        </div>

        <div>
          <span className={label}>Also give me a heads-up</span>
          <div className="grid grid-cols-4 gap-2">
            {OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => onChange({ ...settings, daysBefore: d })}
                className={`rounded-2xl py-3 text-sm font-medium transition ${
                  settings.daysBefore === d ? 'bg-bark text-milk' : 'bg-milk text-bark'
                }`}
              >
                {d === 0 ? 'Off' : d === 1 ? '1 day' : `${d} days`}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {permission !== 'granted' ? (
            <button
              onClick={onEnableNotifications}
              className="w-full flex items-center gap-3 bg-bark text-milk rounded-2xl p-4 text-left"
            >
              <BellRing size={18} />
              <span className="text-sm font-medium">
                {permission === 'denied'
                  ? 'Blocked — allow in phone Settings › Apps › Drift Birthdays › Notifications'
                  : 'Allow notifications'}
              </span>
            </button>
          ) : (
            <button
              onClick={async () => {
                await sendTestNotification()
                setTestSent(true)
              }}
              className="w-full flex items-center gap-3 bg-milk rounded-2xl p-4 text-left"
            >
              <BellRing size={18} />
              <span className="text-sm font-medium">{testSent ? 'Test sent — arrives in ~5 seconds' : 'Send a test notification'}</span>
            </button>
          )}

          {exact === false && (
            <button onClick={openExactAlarmSettings} className="w-full flex items-center gap-3 bg-milk rounded-2xl p-4 text-left">
              <Zap size={18} />
              <span className="flex-1">
                <span className="block text-sm font-medium">Make reminders exact</span>
                <span className="block text-xs text-bark/60 mt-0.5">
                  Android may deliver them a few minutes late until you allow "Alarms & reminders".
                </span>
              </span>
            </button>
          )}
        </div>

        <p className="text-xs text-bark/50 leading-relaxed px-1">
          Everything stays on this phone. If reminders don't arrive on Xiaomi, Oppo, Vivo or Realme, set Drift's
          battery usage to "No restrictions" in system settings.
        </p>
      </div>
    </Sheet>
  )
}
