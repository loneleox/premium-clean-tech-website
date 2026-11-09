import { useState } from "react"
import { SolarPanel } from "./SolarPanel"

/**
 * Before/after scrubber: a dusty panel underneath, the cleaned panel clipped
 * to the right of the handle. The transparent range input makes it draggable
 * and keyboard-accessible.
 */
export function CleanSlider() {
  const [value, setValue] = useState(55)

  return (
    <div className="clean-slider">
      <div className="relative select-none overflow-hidden rounded-[10px]">
        <SolarPanel dust={0.8} />

        <div
          className="pointer-events-none absolute inset-0"
          style={{ clipPath: `inset(0 0 0 ${value}%)` }}
        >
          <SolarPanel dust={0} />
        </div>

        <div className="pointer-events-none absolute inset-y-0" style={{ left: `${value}%` }}>
          <span className="clean-slider__line" />
          <span className="clean-slider__grip" aria-hidden>
            ↔
          </span>
        </div>

        <span className="absolute left-3 top-3 rounded-full bg-[#0b1116]/55 px-2.5 py-1 font-mono text-[9px] tracking-[0.16em] text-white backdrop-blur">
          DUSTY
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-[#0b1116]/55 px-2.5 py-1 font-mono text-[9px] tracking-[0.16em] text-white backdrop-blur">
          CLEAN
        </span>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          aria-label="Drag to compare the dusty and cleaned solar panel"
          className="clean-slider__input"
        />
      </div>

      <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-[0.18em] text-ink/45">
        <span>DUST BUILD-UP</span>
        <span className="text-[var(--color-solar-deep)]">DRAG TO CLEAN</span>
        <span>CLEAN SURFACE</span>
      </div>
    </div>
  )
}
