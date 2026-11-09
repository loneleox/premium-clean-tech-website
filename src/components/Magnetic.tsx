import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"

/** Pulls its child a few pixels toward the cursor. Desktop pointers only. */
export function Magnetic({
  children,
  strength = 6,
  className = "",
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement | null>(null)

  const onMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (e.pointerType !== "mouse") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
    el.style.transform = `translate3d(${(dx * strength).toFixed(2)}px, ${(dy * strength).toFixed(2)}px, 0)`
  }

  const reset = () => {
    if (ref.current) ref.current.style.transform = ""
  }

  return (
    <span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`magnetic ${className}`}
    >
      {children}
    </span>
  )
}
