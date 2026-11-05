import { useState } from 'react'
import { Navbar } from './Navbar'
import type { Person } from '../lib/types'
import { daysUntil, relativeLabel } from '../lib/dates'

const HERO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260711_090308_1dd0cea7-f9ba-4db4-8147-c7d746061c9e.mp4'

interface Props {
  next?: Person
  onAdd: () => void
  onSettings: () => void
  onList: () => void
}

export function Hero({ next, onAdd, onSettings, onList }: Props) {
  // If offline or the video fails, a warm gradient shows instead of a black box.
  const [videoOk, setVideoOk] = useState(true)
  const nextDays = next ? daysUntil(next.month, next.day) : null
  const nextFirst = next?.name.trim().split(/\s+/)[0]

  return (
    <section className="relative h-[68vh] min-h-[480px] max-h-[760px] overflow-hidden mb-[-25px] bg-gradient-to-b from-[#6b4a2a] via-[#8a6440] to-[#3a2410]">
      {videoOk && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={HERO_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() => setVideoOk(false)}
        />
      )}
      <div className="absolute inset-0 bg-black/20" />

      <Navbar onAdd={onAdd} onSettings={onSettings} onList={onList} />

      <div className="relative z-10 h-full flex flex-col justify-end items-center px-5 pb-14 text-center">
        <h1 className="text-white font-normal leading-[1.1] tracking-tight text-[44px] sm:text-7xl">
          Every birthday,
          <br />
          without{' '}
          <em className="not-italic" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic' }}>
            the stress
          </em>
        </h1>
        <p className="mt-4 text-white/80 text-sm font-medium max-w-[340px]">
          Drift quietly remembers the people you love, and nudges you right on time.
        </p>

        <div className="mt-6 flex items-center gap-3 bg-black/25 backdrop-blur-md rounded-xl pl-5 pr-1 py-1 max-w-full">
          <span className="text-white text-sm font-medium truncate text-left">
            {next && nextDays !== null ? (
              <>
                Next: {nextFirst} · {relativeLabel(nextDays).toLowerCase()}
              </>
            ) : (
              'No noise. Just your people, gently remembered.'
            )}
          </span>
          <button
            onClick={onAdd}
            className="shrink-0 bg-white text-black text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-white/90 active:scale-[0.98] transition"
          >
            Add birthday
          </button>
        </div>
      </div>
    </section>
  )
}
