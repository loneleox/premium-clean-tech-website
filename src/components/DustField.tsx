/** Ambient falling-dust particle field. `intensity` scales count + opacity. */
export function DustField({
  intensity = 1,
  count = 40,
  className = "",
}: {
  intensity?: number
  count?: number
  className?: string
}) {
  const n = Math.round(count * Math.min(1, Math.max(0, intensity)))
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity: Math.min(1, intensity * 1.1) }}
      aria-hidden
    >
      {Array.from({ length: n }).map((_, i) => {
        const size = 1.5 + Math.random() * 3.5
        return (
          <span
            key={i}
            className="dust-particle absolute rounded-full"
            style={
              {
                left: `${Math.random() * 100}%`,
                width: size,
                height: size,
                background: "rgba(190,168,132,0.9)",
                boxShadow: "0 0 6px rgba(190,168,132,0.5)",
                ["--dur" as string]: `${7 + Math.random() * 8}s`,
                ["--delay" as string]: `${-Math.random() * 10}s`,
                ["--drift" as string]: `${(Math.random() - 0.5) * 80}px`,
              } as React.CSSProperties
            }
          />
        )
      })}
    </div>
  )
}
