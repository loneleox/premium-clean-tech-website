import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"

/**
 * Pointer-driven 3D tilt + specular glare. Mouse only, and inert when the
 * visitor asked for reduced motion. The DOM is updated directly so tilting
 * never re-renders React.
 */
export function TiltCard({
  children,
  className = "",
  max = 6,
}: {
  children: ReactNode
  className?: string
  max?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty("--tx", `${((0.5 - py) * max).toFixed(2)}deg`)
    el.style.setProperty("--ty", `${((px - 0.5) * max).toFixed(2)}deg`)
    el.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`)
    el.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`)
  }

  const reset = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty("--tx", "0deg")
    el.style.setProperty("--ty", "0deg")
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`tilt ${className}`}
    >
      {children}
    </div>
  )
}
