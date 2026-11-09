const DEFAULT_SPECS = [
  "PER-PANEL DUST DETECTION",
  "AUTOMATIC THRESHOLD CLEANING",
  "WATER-EFFICIENT NOZZLE ARRAY",
  "LIVE ARRAY MONITORING",
  "RETROFIT-FRIENDLY CONTROLLER",
  "SOLAR-YIELD PROTECTION",
]

/** Seamless capability marquee. Pauses on hover; static under reduced motion. */
export function SpecTicker({ items = DEFAULT_SPECS }: { items?: string[] }) {
  return (
    <div className="ticker" role="region" aria-label="System capabilities">
      <div className="ticker__track">
        {items.map((label) => (
          <span key={label} className="ticker__item">
            {label}
            <span className="ticker__dot" aria-hidden />
          </span>
        ))}
        {items.map((label) => (
          <span key={`dup-${label}`} className="ticker__item" aria-hidden>
            {label}
            <span className="ticker__dot" />
          </span>
        ))}
      </div>
    </div>
  )
}
