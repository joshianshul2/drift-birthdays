import assert from 'node:assert/strict'
import { test } from 'node:test'
import { daysUntil, nextOccurrence, observedDate, reminderMonthDay, turningAge, daysInMonth } from '../src/lib/dates.ts'

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h)

test('today counts as 0 even late in the day', () => {
  assert.equal(daysUntil(11, 6, at(2026, 11, 6, 23)), 0)
})
test('tomorrow and year wrap', () => {
  assert.equal(daysUntil(11, 7, at(2026, 11, 6)), 1)
  assert.equal(daysUntil(1, 1, at(2026, 12, 31)), 1)
  assert.equal(daysUntil(11, 5, at(2026, 11, 6)), 364)
})
test('Feb 29 observed Feb 28 in non-leap years, Feb 29 in leap years', () => {
  assert.equal(observedDate(2, 29, 2027).getDate(), 28)
  assert.equal(observedDate(2, 29, 2028).getDate(), 29)
  assert.equal(nextOccurrence(2, 29, at(2027, 3, 1)).getFullYear(), 2028)
  assert.equal(daysUntil(2, 29, at(2027, 2, 28)), 0)
})
test('reminder rules (stable yearly month/day)', () => {
  assert.deepEqual(reminderMonthDay(3, 1, 1), { month: 2, day: 28 })
  assert.deepEqual(reminderMonthDay(1, 1, 1), { month: 12, day: 31 })
  assert.deepEqual(reminderMonthDay(1, 3, 7), { month: 12, day: 27 })
  assert.deepEqual(reminderMonthDay(2, 29, 0), { month: 2, day: 28 })
  assert.deepEqual(reminderMonthDay(12, 25, 0), { month: 12, day: 25 })
})
test('turning age', () => {
  assert.equal(turningAge(11, 6, 1996, at(2026, 11, 6)), 30)
  assert.equal(turningAge(11, 5, 1996, at(2026, 11, 6)), 31)
  assert.equal(turningAge(11, 5, undefined, at(2026, 11, 6)), null)
})
test('days in month', () => {
  assert.equal(daysInMonth(2), 29)
  assert.equal(daysInMonth(2, 2027), 28)
  assert.equal(daysInMonth(4), 30)
})
