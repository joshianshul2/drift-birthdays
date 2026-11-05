import { useEffect, useState } from 'react'
import { Navbar } from './Navbar'
import type { Person } from '../lib/types'
import { daysUntil, relativeLabel } from '../lib/dates'
import sparklers from '../images/sparklers.jpg'
import vanillaCake from '../images/vanilla-cake.jpg'
import neonGold from '../images/neon-gold.jpg'
import balloon from '../images/balloon.jpg'
import pinkCake from '../images/pink-cake.jpg'

// All photos are bundled in the APK: sharp, instant, and offline.
// `pos` keeps each photo's subject in the upper part, away from the text.
const SLIDES = [
  { src: sparklers, pos: '50% 30%' },
  { src: vanillaCake, pos: '55% 45%' },
  { src: neonGold, pos: '52% 50%' },
  { src: balloon, pos: '30% 20%' },
  { src: pinkCake, pos: '50% 40%' },
]
const SLIDE_MS = 6000

interface Props {
  next?: Person
  onAdd: () => void
  onSettings: () => void
  onList: () => void
}

export function Hero({ next, onAdd, onSettings, onList }: Props) {
  const [active, setActive] = useState(0)
  const nextDays = next ? daysUntil(next.month, next.day) : null
  const nextFirst = next?.name.trim().split(/\s+/)[0]

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setActive((i) => (i + 1) % SLIDES.length), SLIDE_MS)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="relative h-[72vh] min-h-[500px] max-h-[780px] overflow-hidden mb-[-25px] bg-bark">
      {SLIDES.map((s, i) => (
        <img
          key={s.src}
          src={s.src}
          alt=""
          aria-hidden="true"
          decoding="async"
          style={{ objectPosition: s.pos }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1600ms] ease-in-out ${
            i === active ? 'opacity-100 animate-ken-burns' : 'opacity-0'
          }`}
        />
      ))}

      {/* Warm brown wash ties every photo to the Drift palette */}
      <div className="absolute inset-0 bg-[#321C04]/15 mix-blend-multiply" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#1F1003] via-[#1F1003]/70 to-transparent" />
      <div className="absolute inset-0 grain opacity-[0.18] mix-blend-overlay pointer-events-none" />

      <Navbar onAdd={onAdd} onSettings={onSettings} onList={onList} />

      <div className="relative z-10 h-full flex flex-col justify-end items-center px-6 pb-14 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-white/85">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F6E4CF]" />
          Birthday reminders
        </span>

        <h1 className="text-white font-normal leading-[1.05] tracking-tight text-[46px] sm:text-7xl [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">
          Never miss
          <br />
          a{' '}
          <em className="not-italic text-[#F6E4CF]" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>
            birthday
          </em>{' '}
          again
        </h1>
        <p className="mt-4 text-white/75 text-sm font-medium leading-relaxed max-w-[320px]">
          Drift remembers the people you love and nudges you right on time — softly, never loudly.
        </p>

        <div className="mt-7 w-full max-w-[360px] flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl pl-5 pr-1.5 py-1.5">
          <span className="flex-1 min-w-0 text-left">
            {next && nextDays !== null ? (
              <>
                <span className="block text-[10px] uppercase tracking-widest text-white/55 font-semibold">Up next</span>
                <span className="block text-white text-sm font-medium truncate">
                  {nextFirst} · {relativeLabel(nextDays).toLowerCase()}
                </span>
              </>
            ) : (
              <span className="block text-white text-sm font-medium">Start with one name</span>
            )}
          </span>
          <button
            onClick={onAdd}
            className="shrink-0 bg-white text-black text-sm font-medium px-5 py-3 rounded-xl hover:bg-white/90 active:scale-[0.98] transition"
          >
            Add birthday
          </button>
        </div>

        <div className="mt-6 flex gap-1.5" aria-hidden="true">
          {SLIDES.map((s, i) => (
            <span
              key={s.src}
              className={`h-1 rounded-full transition-all duration-500 ${i === active ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
