import { useEffect, useRef, useState } from "react"

/**
 * Writes --hp (0..1) onto the header as the page leaves the top, so its
 * glass surface can form gradually instead of snapping on at a threshold.
 */
export function useHeaderFormation<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const raw = Math.min(1, Math.max(0, window.scrollY / 900))
      const eased = raw * raw * (3 - 2 * raw)
      el.style.setProperty("--hp", eased.toFixed(3))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return ref
}

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
      { 
        threshold: options?.threshold ?? 0.05,
        rootMargin: "0px 0px 10% 0px",
      },
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

/**
 * Writes section progress into the element as a `--p` custom property on
 * each frame. CSS children can then drive transforms from scroll position
 * directly, so the motion tracks the scrollbar one-to-one with no timers.
 */
export function useScrollLink<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const total = rect.height + vh
      const p = Math.min(1, Math.max(0, (vh - rect.top) / total))
      el.style.setProperty("--p", p.toFixed(4))
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

  return ref
}

/** id of the section currently crossing the upper third of the viewport. */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join("|")

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const line = window.innerHeight * 0.38
      let current: string | null = null
      for (const id of key.split("|")) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      setActive(current)
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
  }, [key])

  return active
}
