import { useReveal } from "../lib/scroll"

/** Words rise out of a mask, staggered, the first time the heading is seen. */
export function SplitText({
  text,
  delay = 0,
  className = "",
}: {
  text: string
  delay?: number
  className?: string
}) {
  const { ref, shown } = useReveal<HTMLSpanElement>({ threshold: 0.2 })

  return (
    <span ref={ref} className={`split ${shown ? "in" : ""} ${className}`}>
      <span className="sr-only">{text}</span>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="split__word" aria-hidden>
          <span
            className="split__inner"
            style={{ ["--i" as string]: `${i}`, ["--d" as string]: `${delay}ms` }}
          >
            {word}
          </span>
        </span>
      ))}
    </span>
  )
}
