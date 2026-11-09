import { useEffect, useRef, useState } from "react"

/** True when the visitor has asked the OS to reduce motion. */
export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/**
 * Thin reading-progress bar pinned to the top of the page.
 * Writes straight to the DOM inside a rAF so scrolling never re-renders React.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = barRef.current
      if (!el) return
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      el.style.transform = `scaleX(${p})`
      el.style.opacity = p > 0.004 ? "1" : "0"
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return <div ref={barRef} className="scroll-progress" aria-hidden />
}

/**
 * Eases a number toward `value` whenever it changes, so live metrics
 * tick instead of jumping. Instant when reduced motion is requested.
 */
export function useCountUp(value: number, duration = 700) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      fromRef.current = value
      setDisplay(value)
      return
    }
    if (fromRef.current === value) return
    const from = fromRef.current
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = Math.round(from + (value - from) * eased)
      fromRef.current = next
      setDisplay(next)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return display
}
