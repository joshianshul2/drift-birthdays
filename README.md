# Drift Birthdays

A calm birthday reminder app for Android, in the Drift theme.
Add a name, birthday and photo — Drift notifies you on the day, plus an optional heads-up 1, 3 or 7 days before.

## Get the APK (no Android Studio needed)

```
 your laptop                GitHub                         your phone
 ───────────               ────────                       ──────────
 git push  ───────────▶  Actions builds APK  ───────▶  Releases page
                          (~5 min, free)                tap .apk → Install
```

1. Create an empty repo on GitHub, e.g. `drift-birthdays`.
2. From this folder:
   ```bash
   git remote add origin https://github.com/<you>/drift-birthdays.git
   git push -u origin main
   ```
3. Open the repo's **Actions** tab and wait for "Build APK" to go green.
4. On your phone, open the repo's **Releases** page → tap `drift-birthdays.apk` → allow "Install unknown apps" for your browser → Install.

Every later push builds a new release. It is signed with the same key, so it installs as an update and keeps your birthdays.

## Build locally instead (needs Android Studio)

```bash
npm install
npm run android        # builds web app + syncs into android/
npx cap open android   # then Run ▶ in Android Studio
```

## How it works

```
 ┌──────────────── React UI (WebView) ────────────────┐
 │ Hero · BirthdayList · EditorSheet · SettingsSheet  │
 └───────┬─────────────────────────────┬──────────────┘
         │ save / delete / settings    │ launch / resume
         ▼                             ▼
 ┌──────────────┐            ┌──────────────────────────┐
 │ IndexedDB    │ ─ people ─▶│ syncNotifications()      │
 │ people+photo │            │ cancel ours → reschedule │
 └──────────────┘            └────────────┬─────────────┘
                                          ▼
                         Android AlarmManager (yearly repeat,
                         survives reboot via BOOT_COMPLETED)
```

- **Source of truth is IndexedDB.** Every launch, resume and edit does a full idempotent re-sync, so deletes, edits and setting changes can never leave a stale alarm behind.
- **Notification IDs** are `personId * 10 + slot` (0 = on the day, 1 = heads-up).
- **Photos** are center-cropped and resized to 360px JPEG (~30 KB), so hundreds fit easily.
- Everything stays on the phone. No account, no server.

## Review notes (edge cases handled)

| Risk | Handling |
| --- | --- |
| Plugin bug: Android `on.month` is 0-based (Java `Calendar`), iOS is 1-based | `platformMonth()` converts; otherwise December would roll into January |
| Feb 29 birthdays | Shown correctly; reminded on Feb 28 every year |
| "1 day before 1 March" | Computed on a fixed non-leap year → 28 Feb, stable across years |
| Age in notification text goes stale on yearly repeats | Notification text never includes age; the app shows it instead |
| Android ~500 alarm cap per app | Schedules the soonest 450; window refreshes on every open |
| Android 13+ notification permission | Asked right after your first save, with a banner if declined |
| Android 12+ exact alarms | `SCHEDULE_EXACT_ALARM` declared; falls back to inexact; Settings sheet links to enable |
| Reboot | Plugin restores alarms on `BOOT_COMPLETED` |
| Tapping a reminder on cold start | Queued until data loads, then opens that person |
| CI builds signed with random keys can't update each other | Fixed keystore in `android/app/` |
| Offline / video blocked | Hero falls back to a warm gradient; fonts are bundled |
| Aggressive OEM battery savers (Xiaomi, Oppo, Vivo, Realme) | Can still kill alarms — set battery to "No restrictions" |

`npm test` runs the date-math tests (today, year wrap, leap years, reminder offsets, age).

The bundled keystore is fine for personal sideloading. Use your own private key before publishing to the Play Store.
