export interface Person {
  /** Small positive integer; also the base for notification IDs (must fit Java int). */
  id: number
  name: string
  month: number // 1-12
  day: number // 1-31
  year?: number // optional birth year, for "turning N"
  photo?: string // resized JPEG data URL
  note?: string
  createdAt: number
}

export interface Settings {
  hour: number // 0-23, time of day reminders fire
  minute: number
  /** Extra heads-up reminder N days before (0 = off). */
  daysBefore: 0 | 1 | 3 | 7
}

export const DEFAULT_SETTINGS: Settings = { hour: 9, minute: 0, daysBefore: 1 }
