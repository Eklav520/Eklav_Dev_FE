import { useEffect, useRef, useState } from 'react'

/* Count-up animation for dashboard numbers. Eases out (fast start, slow finish) so the final value
   lands with a short pause, then the number gives a small "settle" pop. Skipped when the user
   prefers reduced motion. */

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// easeOutExpo: most of the movement happens early, the last few steps slow right down
const ease = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

/** Animated progress 0 → 1 that restarts whenever `key` changes */
export const useProgress = (key: unknown, duration = 1400, delay = 0) => {
  const [p, setP] = useState(() => (reducedMotion() ? 1 : 0))
  useEffect(() => {
    if (reducedMotion()) { setP(1); return }
    let raf = 0
    let start = 0
    setP(0)
    const timer = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!start) start = now
        const t = Math.min(1, (now - start) / duration)
        setP(ease(t))
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delay)
    return () => { window.clearTimeout(timer); cancelAnimationFrame(raf) }
  }, [key, duration, delay])
  return p
}

/** Animated number that counts from 0 to `value` */
export const useCountUp = (value: number, duration = 1400, delay = 0) => {
  const p = useProgress(value, duration, delay)
  return value * p
}

/* Animates every number inside a text value, keeping the rest ("#7", "8%", "54m", "1h 20m",
   "2,031") as it is. Decimals keep their precision; thousands separators are kept. */
const NUM = /\d[\d,]*(?:\.\d+)?/g

export const CountUp = ({ text, duration = 1400, delay = 0, className }: {
  text: string | number | null | undefined
  duration?: number
  delay?: number
  className?: string
}) => {
  const str = text == null ? '' : String(text)
  const p = useProgress(str, duration, delay)
  const [settled, setSettled] = useState(false)
  const done = p >= 1
  const prevDone = useRef(done)

  useEffect(() => {
    if (done && !prevDone.current && !reducedMotion()) {
      setSettled(true)
      const t = window.setTimeout(() => setSettled(false), 450)
      prevDone.current = done
      return () => window.clearTimeout(t)
    }
    prevDone.current = done
  }, [done])

  const shown = done
    ? str
    : str.replace(NUM, (m) => {
      const hasComma = m.includes(',')
      const raw = Number(m.replace(/,/g, ''))
      if (!Number.isFinite(raw)) return m
      const decimals = (m.split('.')[1] || '').length
      const v = raw * p
      const out = decimals ? v.toFixed(decimals) : String(Math.round(v))
      return hasComma ? Number(out).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : out
    })

  return (
    <span className={`count-up${settled ? ' is-settled' : ''}${className ? ` ${className}` : ''}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {shown}
      <style>{`
        .count-up { display: inline-block; transform-origin: left center; }
        .count-up.is-settled { animation: count-up-settle 0.45s cubic-bezier(.34,1.56,.64,1); }
        @keyframes count-up-settle { 0% { transform: scale(1); } 40% { transform: scale(1.08); } 100% { transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) { .count-up.is-settled { animation: none; } }
      `}</style>
    </span>
  )
}

export default CountUp
