type PanelState = "clean" | "dust" | "cleaning"

const STATE_META: Record<PanelState, { label: string; color: string; ring: string }> = {
  clean: { label: "Clean", color: "var(--color-leaf)", ring: "#34d399" },
  dust: { label: "Dust Detected", color: "var(--color-solar)", ring: "#ffb020" },
  cleaning: { label: "Cleaning", color: "var(--color-sensor)", ring: "#22d3ee" },
}

/** A single stylized PV panel with adjustable dust and status. */
export function SolarPanel({
  dust = 0,
  state,
  scan = false,
  wipe,
  className = "",
}: {
  dust?: number // 0..1
  state?: PanelState
  scan?: boolean
  wipe?: number // 0..1 — clips dust from the left so cleaning "wipes" across
  className?: string
}) {
  const cells = Array.from({ length: 24 })
  const meta = state ? STATE_META[state] : null

  return (
    <div className={`relative select-none ${className}`}>
      <div
        className="relative overflow-hidden rounded-[10px] border p-[6px] shadow-2xl"
        style={{
          background: "linear-gradient(150deg, #16324a 0%, #0d2136 60%, #0a1826 100%)",
          borderColor: "rgba(120,160,200,0.35)",
          boxShadow: "0 30px 60px -25px rgba(6,20,40,0.7)",
        }}
      >
        <div className="grid grid-cols-6 gap-[4px]">
          {cells.map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] rounded-[2px]"
              style={{
                background:
                  "linear-gradient(135deg, #2b6ea3 0%, #1c4c74 45%, #123454 100%)",
                boxShadow: "inset 0 0 0 1px rgba(150,190,225,0.18)",
              }}
            >
              <div
                className="h-full w-full rounded-[2px]"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, transparent 0 7px, rgba(10,25,45,0.55) 7px 8px), repeating-linear-gradient(0deg, transparent 0 9px, rgba(10,25,45,0.4) 9px 10px)",
                }}
              />
            </div>
          ))}
        </div>

        {/* specular sheen */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, rgba(255,255,255,0.22) 0%, transparent 32%)",
          }}
        />

        {/* dust overlay — clipped from the left when a wipe is passing */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: dust,
            clipPath:
              wipe != null
                ? `inset(0 0 0 ${Math.min(100, Math.max(0, wipe * 100))}%)`
                : undefined,
            background:
              "radial-gradient(120% 90% at 30% 20%, rgba(200,182,148,0.85), rgba(163,142,103,0.55) 55%, rgba(120,102,72,0.7))",
            mixBlendMode: "multiply",
          }}
        />

        {/* scanning sweep */}
        {scan && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="scan-line absolute inset-y-0 w-1/3"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(34,211,238,0.55), transparent)",
              }}
            />
          </div>
        )}
      </div>

      {meta && (
        <div className="mt-3 flex items-center gap-2 font-mono text-[11px] tracking-wide">
          <span className="relative flex h-2.5 w-2.5">
            {state === "cleaning" && (
              <span
                className="pulse-ring absolute inline-flex h-full w-full rounded-full"
                style={{ background: meta.ring }}
              />
            )}
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ background: meta.color }}
            />
          </span>
          <span style={{ color: meta.color }}>{meta.label.toUpperCase()}</span>
        </div>
      )}
    </div>
  )
}

export type { PanelState }
