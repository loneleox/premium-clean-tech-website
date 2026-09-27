import { useEffect, useRef, useState } from "react"

/** Reveal children on first scroll into view. */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options?: { threshold?: number; once?: boolean },
) {
  const ref = useRef<T | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          if (options?.once !== false) io.disconnect()
        } else if (options?.once === false) {
          setShown(false)
        }
      },
      { threshold: options?.threshold ?? 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [options?.threshold, options?.once])

  return { ref, shown }
}

/**
 * Progress (0..1) of a section relative to the viewport.
 * 0 when the section top hits the viewport bottom, 1 when its bottom leaves the top.
 */
export function useSectionProgress<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const total = rect.height + vh
      const passed = vh - rect.top
      const p = Math.min(1, Math.max(0, passed / total))
      setProgress(p)
      raf = 0
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

  return { ref, progress }
}
