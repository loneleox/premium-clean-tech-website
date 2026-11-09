import VisitorTracker from './VisitorTracker'
import { createContext, Fragment, useContext, useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import { CleanSlider } from "./components/CleanSlider"
import { DustField } from "./components/DustField"
import { Magnetic } from "./components/Magnetic"
import { SpecTicker } from "./components/SpecTicker"
import { SplitText } from "./components/SplitText"
import { TiltCard } from "./components/TiltCard"
import { PanelState, SolarPanel } from "./components/SolarPanel"
import {
  useActiveSection,
  useHeaderFormation,
  useReveal,
  useScrollLink,
  useSectionProgress,
} from "./lib/scroll"
import { ScrollProgress, useCountUp } from "./lib/motion"
import { ThemeToggle } from "./lib/theme"

/* ------------------------------------------------------------------ */
/* Shared solar-system state — Smart Control & Smart Monitoring both   */
/* read from this single source of truth so they stay in sync.         */
/* ------------------------------------------------------------------ */

interface SystemCtx {
  panels: PanelState[]
  selected: number | null
  setSelected: (n: number) => void
  busy: boolean
  phase: "idle" | "cleaning" | "done"
  auto: boolean
  setAuto: (b: boolean) => void
  cleanPanel: (idx: number) => void
  dustyCount: number
}

const SystemContext = createContext<SystemCtx | null>(null)

function useSystem() {
  const ctx = useContext(SystemContext)
  if (!ctx) throw new Error("useSystem must be used within SystemProvider")
  return ctx
}

function SystemProvider({ children }: { children: React.ReactNode }) {
  const [panels, setPanels] = useState<PanelState[]>(["clean", "clean", "clean", "clean"])
  const [selected, setSelected] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState<"idle" | "cleaning" | "done">("idle")
  const [auto, setAuto] = useState(true)

  // Synchronous locks so double-invoked effects / rapid clicks never spawn
  // or clean twice.
  const panelsRef = useRef(panels)
  panelsRef.current = panels
  const cycleRef = useRef(false) // a dusty/cleaning cycle is currently active
  const busyRef = useRef(false)

  // Mark one random clean panel as dusty (only if nothing is pending).
  const spawnDust = () => {
    if (cycleRef.current) return
    const p = panelsRef.current
    const candidates = p.map((s, i) => (s === "clean" ? i : -1)).filter((i) => i >= 0)
    if (candidates.length === 0) return
    cycleRef.current = true
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    setPanels((prev) => prev.map((s, i) => (i === pick ? "dust" : s)))
    setSelected(pick)
  }

  const cleanPanel = (idx: number) => {
    if (busyRef.current || idx == null || panelsRef.current[idx] !== "dust") return
    busyRef.current = true
    setBusy(true)
    setPhase("cleaning")
    setPanels((prev) => prev.map((s, i) => (i === idx ? "cleaning" : s)))
    setTimeout(() => {
      setPanels((prev) => prev.map((s, i) => (i === idx ? "clean" : s)))
      setPhase("done")
      setBusy(false)
      busyRef.current = false
      cycleRef.current = false
      setTimeout(() => setPhase("idle"), 1800)
      // 10-second gap, then dust appears on another random panel → cycle.
      setTimeout(spawnDust, 10000)
    }, 2600)
  }

  // Kick off the first detection shortly after mount.
  useEffect(() => {
    const t = setTimeout(spawnDust, 1200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Automatic mode: whenever a panel is dusty and we're idle, clean it.
  useEffect(() => {
    if (!auto || busy) return
    const dusty = panels.findIndex((s) => s === "dust")
    if (dusty < 0) return
    const t = setTimeout(() => cleanPanel(dusty), 1800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, busy, panels])

  const dustyCount = panels.filter((s) => s === "dust").length

  return (
    <SystemContext.Provider
      value={{ panels, selected, setSelected, busy, phase, auto, setAuto, cleanPanel, dustyCount }}
    >
      {children}
    </SystemContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function Reveal({
  children,
  delay = 0,
  from = "up",
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  from?: "up" | "left" | "right"
  className?: string
}) {
  const { ref, shown } = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`reveal ${from !== "up" ? `reveal--${from}` : ""} ${shown ? "in" : ""} ${className}`}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function Kicker({ n, label, dark = false }: { n: string; label: string; dark?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 font-mono text-[11px] tracking-[0.28em] ${
        dark ? "text-white/50" : "text-ink/45"
      }`}
    >
      <span className="h-px w-8" style={{ background: "currentColor" }} />
      <span>{label}</span>
    </div>
  )
}

/** Gradient blend strip so adjacent sections flow into each other with no
    hard color break. */
function Seam({ from, to, h = 110 }: { from: string; to: string; h?: number }) {
  return (
    <div
      aria-hidden
      className="w-full"
      style={{ height: h, background: `linear-gradient(180deg, ${from}, ${to})` }}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Nav                                                                 */
/* ------------------------------------------------------------------ */

const SECTIONS = [
  { id: "problem", label: "PROBLEM" },
  { id: "solution", label: "SYSTEM" },
  { id: "app", label: "APP" },
  { id: "future", label: "FUTURE" },
]

function Nav() {
  const headerRef = useHeaderFormation<HTMLElement>()
  const [open, setOpen] = useState(false)
  const active = useActiveSection(SECTIONS.map((s) => s.id))

  // Lock the page and allow Escape to dismiss the mobile sheet.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <>
      <header ref={headerRef} className="site-header nav-enter">
        <div className="site-header__inner">
          <a href="#hero" className="site-brand" onClick={() => setOpen(false)}>
            <span className="relative h-6 w-6">
              <span
                className="sun-core absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle at 38% 32%, #ffd98c, #e58a2b 62%, #c96f18)",
                }}
              />
            </span>
            <span className="font-display text-[15px] font-600 tracking-tight">SOLARA</span>
          </a>

          <nav aria-label="Sections" className="site-nav hidden items-center md:flex">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`site-nav__link ${active === s.id ? "is-active" : ""}`}
                aria-current={active === s.id ? "true" : undefined}
              >
                {s.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <ThemeToggle />
            <Link
              to="/contact"
              className="btn-sheen header-cta hidden text-white sm:inline-flex"
              style={{ background: "var(--color-night)" }}
            >
              CONTACT
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className={`menu-btn inline-flex md:hidden ${open ? "is-open" : ""}`}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`mobile-menu fixed inset-0 z-[45] flex flex-col justify-center px-6 pb-10 pt-[104px] md:hidden ${
          open ? "is-open" : ""
        }`}
        aria-hidden={!open}
      >
        {SECTIONS.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="mobile-menu__link"
            style={{ ["--i" as string]: `${i}` }}
            onClick={() => setOpen(false)}
          >
            <span>{s.label}</span>
            <span className="mobile-menu__index">0{i + 1}</span>
          </a>
        ))}
        <Link
          to="/contact"
          className="mobile-menu__link"
          style={{ ["--i" as string]: `${SECTIONS.length}` }}
          onClick={() => setOpen(false)}
        >
          <span>CONTACT</span>
          <span className="mobile-menu__index">05</span>
        </Link>
        <div className="mobile-menu__foot">
          <p className="font-mono text-[10px] tracking-[0.22em] text-ink/40">
            SMART SOLAR PANEL CLEANING SYSTEM
          </p>
        </div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* 1. HERO — sun to panel                                              */
/* ------------------------------------------------------------------ */

function Hero() {
  const { ref, progress } = useSectionProgress<HTMLDivElement>()
  const sceneRef = useRef<HTMLDivElement | null>(null)

  // A shallow pointer parallax: the sun and panel drift against the cursor.
  useEffect(() => {
    const el = sceneRef.current
    if (!el) return
    if (window.matchMedia("(pointer: coarse)").matches) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const r = el.getBoundingClientRect()
        el.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
        el.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
      })
    }
    const reset = () => {
      el.style.setProperty("--mx", "0")
      el.style.setProperty("--my", "0")
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    document.addEventListener("pointerleave", reset)
    return () => {
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerleave", reset)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // panel grows / tilts as we scroll; dust builds in the back half
  const scale = 0.7 + progress * 0.9
  const rotate = 24 - progress * 24
  const dust = Math.max(0, (progress - 0.45) / 0.5)
  const sunY = -progress * 260
  const sunOpacity = Math.max(0, 1 - progress * 1.4)

  return (
    <section ref={ref} className="relative h-[220vh]" id="hero">
      <div ref={sceneRef} className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        {/* daylight wash + fine engineering grid */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--color-solar) 14%, var(--color-paper)) 0%, color-mix(in oklab, var(--color-solar) 5%, var(--color-paper)) 24%, var(--color-paper) 60%)",
          }}
        />
        <div
          aria-hidden
          className="tech-grid"
          style={{ transform: `translate3d(0, ${progress * 80}px, 0)` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[12%] h-[440px] w-[440px] -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--color-solar) 20%, transparent), transparent 68%)",
          }}
        />
        {/* sun */}
        <div
          className="absolute left-1/2 top-[14%] -translate-x-1/2"
          style={{ transform: `translate(-50%, ${sunY}px) translate3d(calc(var(--mx, 0) * 18px), calc(var(--my, 0) * 12px), 0)`, opacity: sunOpacity }}
        >
          <div className="relative">
            <div
              className="sun-core h-40 w-40 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 40% 34%, #ffe3a6 0%, #f7bf5f 38%, #e58a2b 72%, #c96f18 100%)",
                boxShadow: "0 0 90px 26px rgba(229,138,43,0.28)",
              }}
            />
            {/* light beams radiating around the sun */}
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className="sun-ray absolute left-1/2 top-1/2 origin-top"
                style={{
                  width: i % 2 === 0 ? 3 : 2,
                  height: 320,
                  transform: `translate(-50%, 0) rotate(${i * (360 / 16)}deg)`,
                  background:
                    "linear-gradient(180deg, color-mix(in oklab, var(--color-solar) 55%, transparent) 0%, transparent 100%)",
                  filter: "blur(0.5px)",
                  ["--ray-delay" as string]: `${i * 0.25}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* headline */}
        <div
          className="hero-copy relative z-10 mx-auto max-w-[900px] px-6 text-center"
          style={{
            opacity: Math.max(0, 1 - Math.max(0, progress - 0.32) * 3.4),
            transform: `translate3d(0, ${-progress * 80}px, 0)`,
          }}
        >
          <p
            className="hero-intro mb-6 font-mono text-[11px] tracking-[0.3em]"
            style={{
              color: "var(--color-ink)",
              opacity: 0.75,
              ["--intro-opacity" as string]: "0.75",
              ["--intro-delay" as string]: "140ms",
            }}
          >
            SMART SOLAR PANEL CLEANING SYSTEM
          </p>
          <h1
            className="font-display text-[clamp(2.2rem,6vw,4.6rem)] font-700 leading-[1.02] tracking-[-0.02em]"
            style={{ color: "var(--color-ink)" }}
          >
            <span className="line-mask">
              <span style={{ ["--intro-delay" as string]: "240ms" }}>
                What if your solar panels could tell you when they need cleaning?
              </span>
            </span>
          </h1>
          <p
            className="hero-intro mx-auto mt-6 max-w-[520px] text-[17px] leading-relaxed"
            style={{
              color: "var(--color-ink)",
              opacity: 0.85,
              ["--intro-opacity" as string]: "0.85",
              ["--intro-delay" as string]: "420ms",
            }}
          >
            Detect the dust. Clean when needed. Control every panel.
          </p>
        </div>

        {/* panel that grows toward viewer */}
        <div
          className="hero-panel absolute bottom-[-6%] left-1/2 z-0 w-[440px] max-w-[80vw] -translate-x-1/2"
          style={{
            transform: `translateX(-50%) perspective(1200px) rotateX(${rotate}deg) scale(${scale}) translate3d(calc(var(--mx, 0) * 14px), calc(var(--my, 0) * 8px), 0)`,
          }}
        >
          <SolarPanel dust={dust} />
          {dust > 0.35 && (
            <div
              className="absolute -right-4 top-2 flex items-center gap-2 rounded-full border border-ink/10 bg-card/80 px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] shadow-lg backdrop-blur"
              style={{ color: "var(--color-solar-deep)" }}
            >
              <span className="live-dot h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-solar)" }} />
              DUST DETECTED
            </div>
          )}
        </div>

        {dust > 0.1 && <DustField intensity={dust} count={36} />}

        {/* scroll cue */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.25em] text-ink/40"
          style={{ opacity: Math.max(0, 1 - Math.max(0, progress - 0.32) * 6) }}
        >
          SCROLL ↓
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 2. PROBLEM — dust accumulation                                      */
/* ------------------------------------------------------------------ */

function Problem() {
  const { ref, progress } = useSectionProgress<HTMLDivElement>()
  const dust = Math.min(0.92, progress * 1.2)
  const lines = [
    { t: "Dust accumulates.", at: 0.12 },
    { t: "Performance can be affected.", at: 0.32 },
    { t: "Someone has to clean it.", at: 0.52 },
    { t: "Again. And again.", at: 0.72 },
  ]
  return (
    <section ref={ref} className="relative h-[240vh]" id="problem">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden bg-paper">
        {/* dusty panel background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-[720px] max-w-[92vw] opacity-90"
            style={{ transform: `scale(${1 + progress * 0.15})` }}
          >
            <SolarPanel dust={dust} />
          </div>
        </div>
        <DustField intensity={0.3 + dust} count={60} />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, color-mix(in oklab, var(--color-paper) 94%, transparent), color-mix(in oklab, var(--color-paper) 40%, transparent) 55%, transparent)" }}
        />

        <div className="relative z-10 mx-auto w-full max-w-[1240px] px-6">
          <Kicker n="01" label="THE PROBLEM" />
          <h2 className="mt-6 max-w-[620px] font-display text-[clamp(2rem,5vw,3.6rem)] font-600 leading-[1.05] tracking-[-0.02em]">
            The problem starts quietly.
          </h2>
          <div className="mt-10 flex flex-col gap-4">
            {lines.map((l) => (
              <p
                key={l.t}
                className="font-display text-[clamp(1.1rem,2.4vw,1.7rem)] font-400 transition-all duration-700"
                style={{
                  opacity: progress > l.at ? 1 : 0,
                  transform: progress > l.at ? "none" : "translateX(-16px)",
                  color: progress > l.at ? "var(--color-ink)" : "var(--color-ink)",
                }}
              >
                {l.t}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 3. THE QUESTION                                                     */
/* ------------------------------------------------------------------ */

function Question() {
  const { ref, progress } = useSectionProgress<HTMLDivElement>()
  const q = [
    { t: "So why should a person have to find a dirty panel?", at: 0.18, big: true },
    { t: "Why can't the system detect it?", at: 0.42 },
    { t: "And clean it?", at: 0.64 },
  ]
  return (
    <section ref={ref} className="relative h-[260vh]" style={{ background: "var(--color-night)" }}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* faint grid */}
        <div className="grain-lines absolute inset-0 text-white/60" />
        <div className="relative z-10 mx-auto max-w-[860px] px-6 text-center text-white">
          {q.map((l, i) => (
            <p
              key={l.t}
              className={`mb-8 font-display font-500 leading-[1.1] tracking-[-0.02em] transition-all duration-1000 ${
                l.big ? "text-[clamp(1.8rem,4.4vw,3.2rem)]" : "text-[clamp(1.4rem,3.4vw,2.4rem)]"
              }`}
              style={{
                opacity: progress > l.at ? 1 : 0,
                transform: progress > l.at ? "none" : "translateY(24px)",
                color: i === 0 ? "#fff" : "rgba(255,255,255,0.82)",
              }}
            >
              {l.t}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 4. PROJECT REVEAL                                                   */
/* ------------------------------------------------------------------ */

function Reveal4() {
  const chain = [
    { label: "CAMERA", desc: "Sees dust", color: "var(--color-sensor)" },
    { label: "CONTROLLER", desc: "Decides", color: "var(--color-solar)" },
    { label: "CLEANING", desc: "Activates", color: "var(--color-leaf)" },
  ]
  return (
    <section id="solution" className="relative overflow-hidden bg-paper py-32">

      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{ background: "linear-gradient(180deg, var(--color-night), transparent)" }}
      />
      <div className="mx-auto max-w-[1240px] px-6">
        <Reveal>
          <Kicker n="02" label="THE SOLUTION" />
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-6 max-w-[820px] font-display text-[clamp(2.2rem,5.5vw,4rem)] font-600 leading-[1.03] tracking-[-0.025em]">
            <SplitText text="Meet our Smart Solar Panel Cleaning System." delay={60} />
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-6 max-w-[560px] text-[18px] leading-relaxed text-ink/60">
            A semi-automatic system that detects dust and activates cleaning when required.
          </p>
        </Reveal>

        <div className="mt-20">
          <div className="relative grid items-center gap-6 md:grid-cols-[1.1fr_auto_0.9fr_auto_0.9fr_auto_0.9fr]">
            {/* hero panel */}
            <Reveal from="left" delay={120}>
              <TiltCard className="lift-card rounded-2xl border border-ink/10 bg-card/70 p-6 shadow-xl backdrop-blur">
                <SolarPanel dust={0} scan />
                <p className="mt-4 font-mono text-[11px] tracking-[0.15em] text-ink/50">LIVE INSTALLATION · ARRAY A</p>
              </TiltCard>
            </Reveal>

            {/* chain */}
            <ChainArrow />
            {chain.map((c, i) => (
              <Fragment key={c.label}>
                <Reveal from={i % 2 === 1 ? "right" : "left"} delay={220 + i * 150}>
                  <div className="lift-card rounded-2xl border border-ink/10 bg-card p-6 text-center shadow-sm">
                    <span
                      className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ background: `color-mix(in oklab, ${c.color} 18%, var(--color-card))` }}
                    >
                      <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                    </span>
                    <p className="font-display text-[15px] font-600">{c.label}</p>
                    <p className="mt-1 font-mono text-[11px] text-ink/45">{c.desc}</p>
                  </div>
                </Reveal>
                {i < chain.length - 1 && <ChainArrow />}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ChainArrow() {
  return (
    <div className="hidden items-center justify-center md:flex">
      <svg width="40" height="10" viewBox="0 0 40 10" fill="none">
        <line
          className="flow-line"
          x1="0"
          y1="5"
          x2="34"
          y2="5"
          stroke="var(--color-solar)"
          strokeWidth="1.5"
        />
        <path d="M32 1 L39 5 L32 9" stroke="var(--color-solar)" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 5. HOW IT WORKS — scroll story                                      */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "DETECT",
      body: "A camera captures each panel and computer vision analyzes the surface for accumulated dust.",
      render: () => (
        <div className="relative">
          <SolarPanel dust={0.75} state="dust" />
        </div>
      ),
    },
    {
      n: "02",
      title: "DECIDE",
      body: "The controller compares the live reading against the defined threshold.",
      render: () => (
        <div className="rounded-2xl border border-ink/10 bg-card p-8 shadow-lg">
          <Meter label="Dust Level" value={78} color="var(--color-solar)" />
          <Meter label="Threshold" value={60} color="var(--color-ink)" muted />
          <div
            className="mt-6 flex items-center gap-2 rounded-lg px-4 py-3 font-mono text-[12px] tracking-[0.12em]"
            style={{ background: "color-mix(in oklab, var(--color-solar) 14%, var(--color-card))", color: "var(--color-solar-deep)" }}
          >
            <span className="live-dot h-2 w-2 rounded-full" style={{ background: "var(--color-solar)" }} />
            CLEANING REQUIRED
          </div>
        </div>
      ),
    },
    {
      n: "03",
      title: "CLEAN",
      body: "Water or air is activated and moves smoothly across the panel surface.",
      render: () => <CleanSlider />,
    },
    {
      n: "04",
      title: "CONTROL",
      body: "The user receives the panel status directly through the mobile application.",
      render: () => <MiniPhone />,
    },
  ]
  const railRef = useScrollLink<HTMLDivElement>()
  return (
    <section className="relative bg-mist py-28">

      <div ref={railRef} className="mx-auto max-w-[1240px] px-6">
        <Reveal>
          <Kicker n="03" label="HOW IT WORKS" />
          <h2 className="mt-6 font-display text-[clamp(2rem,4.6vw,3.2rem)] font-600 tracking-[-0.02em]">
            <SplitText text="Four steps, one continuous loop." />
          </h2>
        </Reveal>

        <div className="relative mt-16">
          <div aria-hidden className="scroll-rail hidden md:block">
            <span className="scroll-rail__fill" />
            <span className="scroll-rail__dot" />
          </div>
          <div className="flex flex-col gap-24 md:pl-14">
          {steps.map((s, i) => (
            <Reveal key={s.n} from={i % 2 === 0 ? "right" : "left"}>
              <div
                className={`grid items-center gap-10 md:grid-cols-2 ${
                  i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <div className="flex items-baseline gap-4">
                    <span
                      className="font-display text-[64px] font-700 leading-none"
                      style={{ color: "color-mix(in oklab, var(--color-solar) 55%, transparent)" }}
                    >
                      {s.n}
                    </span>
                    <span className="font-mono text-[13px] tracking-[0.3em] text-ink/50">STEP</span>
                  </div>
                  <h3 className="mt-4 font-display text-[32px] font-600 tracking-tight">{s.title}</h3>
                  <p className="mt-3 max-w-[380px] text-[16px] leading-relaxed text-ink/60">{s.body}</p>
                </div>
                <div>{s.render()}</div>
              </div>
            </Reveal>
          ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Meter({ label, value, color, muted = false }: { label: string; value: number; color: string; muted?: boolean }) {
  const { ref, shown } = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className="mb-5">
      <div className="mb-2 flex justify-between font-mono text-[12px]">
        <span className="text-ink/60">{label}</span>
        <span style={{ color: muted ? "var(--color-ink)" : color }}>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: "color-mix(in oklab, var(--color-ink) 10%, transparent)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-[1400ms] ease-out"
          style={{ width: shown ? `${value}%` : "0%", background: color }}
        />
      </div>
    </div>
  )
}


function MiniPhone() {
  return (
    <div className="mx-auto w-[220px] rounded-[28px] border-4 border-night bg-night p-2 shadow-2xl">
      <div className="rounded-[20px] bg-card p-4">
        <p className="font-mono text-[10px] tracking-[0.2em] text-ink/40">SOLARA · LIVE</p>
        <p className="mt-2 font-display text-[15px] font-600">System Status</p>
        {[
          { l: "Panel 01", s: "clean" as PanelState },
          { l: "Panel 02", s: "dust" as PanelState },
          { l: "Panel 03", s: "cleaning" as PanelState },
        ].map((p) => (
          <StatusRow key={p.l} label={p.l} state={p.s} />
        ))}
      </div>
    </div>
  )
}

const STATE_COLOR: Record<PanelState, string> = {
  clean: "var(--color-leaf)",
  dust: "var(--color-solar)",
  cleaning: "var(--color-sensor)",
}
const STATE_LABEL: Record<PanelState, string> = {
  clean: "Clean",
  dust: "Dust Detected",
  cleaning: "Cleaning",
}

function StatusRow({ label, state }: { label: string; state: PanelState }) {
  return (
    <div className="mt-3 flex items-center justify-between border-t border-ink/8 pt-3 first:border-0">
      <span className="text-[13px] text-ink/70">{label}</span>
      <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: STATE_COLOR[state] }}>
        <span className="h-2 w-2 rounded-full" style={{ background: STATE_COLOR[state] }} />
        {STATE_LABEL[state]}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 6. WATER FLOW TRANSITION                                            */
/* ------------------------------------------------------------------ */

function WaterTransition() {
  const { ref, progress } = useSectionProgress<HTMLDivElement>()
  // Map the wipe across the window where the panel is pinned in view.
  const clean = Math.min(1, Math.max(0, (progress - 0.34) / 0.32))
  const passing = clean > 0.02 && clean < 0.98
  return (
    <section ref={ref} className="relative h-[200vh]">        <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden" style={{ background: "#0a1a26" }}>
        <div className="relative w-[560px] max-w-[88vw]">
          {/* dusty panel; dust is wiped away to the left of the ray */}
          <SolarPanel dust={0.85} wipe={clean} />

          {/* cleaned area: subtle wet sheen trailing behind the ray */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 rounded-[10px]"
            style={{
              width: `${clean * 100}%`,
              background:
                "linear-gradient(90deg, rgba(150,215,255,0.06) 0%, rgba(180,225,255,0.16) 100%)",
              mixBlendMode: "screen",
            }}
          />

          {/* the cleaning ray / water jet edge */}
          {passing && (
            <div
              className="pointer-events-none absolute inset-y-0"
              style={{ left: `calc(${clean * 100}% - 44px)`, width: 88 }}
            >
              {/* soft water band */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(120,200,255,0) 0%, rgba(180,230,255,0.5) 50%, rgba(120,200,255,0) 100%)",
                }}
              />
              {/* bright core beam */}
              <div
                className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2"
                style={{
                  background:
                    "linear-gradient(180deg, transparent, rgba(210,240,255,0.95) 20%, rgba(210,240,255,0.95) 80%, transparent)",
                  boxShadow: "0 0 34px 10px rgba(120,200,255,0.75)",
                }}
              />
              {/* droplets sparkle */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(2px 2px at 40% 30%, rgba(255,255,255,0.9), transparent), radial-gradient(1.5px 1.5px at 60% 60%, rgba(255,255,255,0.8), transparent), radial-gradient(1.5px 1.5px at 50% 80%, rgba(255,255,255,0.7), transparent)",
                }}
              />
            </div>
          )}
        </div>

        {/* progress caption */}
        <div className="mt-10 flex items-center gap-3 font-mono text-[11px] tracking-[0.3em]">
          <span style={{ color: clean < 0.05 ? "var(--color-solar)" : "rgba(255,255,255,0.3)" }}>DUST</span>
          <span className="text-white/25">→</span>
          <span style={{ color: passing ? "var(--color-sensor)" : "rgba(255,255,255,0.3)" }}>CLEANING</span>
          <span className="text-white/25">→</span>
          <span style={{ color: clean > 0.95 ? "var(--color-leaf)" : "rgba(255,255,255,0.3)" }}>CLEAN PANEL</span>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 7 + 9. MOBILE APP + INDIVIDUAL CONTROL (interactive)               */
/* ------------------------------------------------------------------ */

function AppControl() {
  const { panels, selected, setSelected, busy, phase, auto, setAuto, cleanPanel, dustyCount } = useSystem()

  return (
    <section id="app" className="relative overflow-hidden py-28" style={{ background: "var(--color-night)" }}>
      <DustField intensity={0.15} count={18} className="opacity-40" />
      <div className="mx-auto max-w-[1240px] px-6 text-white">
        <Reveal>
          <Kicker n="04" label="SMART CONTROL" dark />
          <h2 className="mt-6 max-w-[760px] font-display text-[clamp(2rem,4.8vw,3.4rem)] font-600 leading-[1.05] tracking-[-0.02em]">
            <SplitText text="Why clean every panel when only one needs attention?" />
          </h2>
          <p className="mt-5 max-w-[520px] text-[17px] leading-relaxed text-white/55">
            Dust appears on one panel at a time. In automatic mode the system detects and cleans it on its own, then waits for the next. Switch to manual to select and clean a panel yourself.
          </p>
        </Reveal>

        <div className="mt-16 grid items-center gap-14 lg:grid-cols-[1fr_360px]">
          {/* Array */}
          <Reveal from="right">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {panels.map((s, i) => {
                const isSelected = selected === i
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelected(i)}
                    className="group relative rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5"
                    style={{
                      borderColor: isSelected
                        ? "rgba(229,138,43,0.9)"
                        : s === "dust"
                        ? "rgba(229,138,43,0.55)"
                        : "rgba(255,255,255,0.12)",
                      background: isSelected ? "rgba(229,138,43,0.08)" : "rgba(255,255,255,0.03)",
                      boxShadow: isSelected ? "0 0 0 3px rgba(229,138,43,0.18)" : "none",
                    }}
                  >
                    {s === "dust" && (
                      <span className="pulse-ring absolute inset-0 rounded-xl" style={{ background: "rgba(229,138,43,0.15)" }} />
                    )}
                    <SolarPanel dust={s === "dust" ? 0.6 : s === "cleaning" ? 0.25 : 0} state={s} scan={s === "cleaning"} />
                    <div className="mt-2 flex items-center justify-between">
                      <p className="font-mono text-[10px] tracking-[0.15em] text-white/40">PANEL 0{i + 1}</p>
                      <span
                        className="flex items-center gap-1 font-mono text-[9px]"
                        style={{ color: STATE_COLOR[s] }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATE_COLOR[s] }} />
                        {isSelected ? "SELECTED" : STATE_LABEL[s].toUpperCase()}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </Reveal>

          {/* Phone dashboard */}
          <Reveal delay={120} from="left">
            <div className="mx-auto w-[300px] rounded-[36px] border-[6px] border-white/15 bg-[#05090f] p-3 shadow-2xl">
              <div className="rounded-[26px] bg-gradient-to-b from-[#0d141d] to-[#070b11] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[14px] font-600 text-white">Solar System</span>
                  <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.15em] text-emerald-400">
                    <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" /> ONLINE
                  </span>
                </div>

                <div className="mt-5 space-y-2.5">
                  {panels.map((s, i) => {
                    const isSelected = selected === i
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelected(i)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition-colors"
                        style={{
                          background: isSelected ? "rgba(229,138,43,0.12)" : "rgba(255,255,255,0.04)",
                          boxShadow: isSelected ? "inset 0 0 0 1px rgba(229,138,43,0.55)" : "none",
                        }}
                      >
                        <span className="text-[13px] text-white/80">Panel 0{i + 1}</span>
                        <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: STATE_COLOR[s] }}>
                          <span className="h-2 w-2 rounded-full" style={{ background: STATE_COLOR[s] }} />
                          {STATE_LABEL[s]}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* mode toggle */}
                <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                  {(["auto", "manual"] as const).map((m) => {
                    const active = (m === "auto") === auto
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setAuto(m === "auto")}
                        className="rounded-lg py-2 font-mono text-[10px] tracking-[0.14em] transition-colors"
                        style={{
                          background: active ? "linear-gradient(90deg, var(--color-solar), var(--color-solar-deep))" : "transparent",
                          color: active ? "var(--color-night)" : "rgba(255,255,255,0.55)",
                        }}
                      >
                        {m === "auto" ? "AUTOMATIC" : "MANUAL"}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4">
                  {phase === "done" ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 py-3 font-mono text-[12px] tracking-[0.12em] text-emerald-400">
                      CLEANING COMPLETE ✓
                    </div>
                  ) : phase === "cleaning" ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500/15 py-3 font-mono text-[12px] tracking-[0.12em] text-cyan-300">
                      <span className="live-dot">{auto ? "AUTO CLEANING…" : "CLEANING…"}</span>
                    </div>
                  ) : auto ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 py-3 font-mono text-[12px] tracking-[0.12em] text-emerald-400">
                      <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {dustyCount > 0 ? "DETECTED · AUTO CLEANING" : "MONITORING…"}
                    </div>
                  ) : selected != null && panels[selected] === "dust" ? (
                    <button
                      onClick={() => cleanPanel(selected)}
                      className="btn-sheen w-full rounded-xl py-3 font-mono text-[12px] tracking-[0.14em] text-night transition-transform hover:scale-[1.02] active:scale-95"
                      style={{ background: "linear-gradient(90deg, var(--color-solar), var(--color-solar-deep))" }}
                    >
                      CLEAN PANEL 0{selected + 1}
                    </button>
                  ) : (
                    <div className="w-full rounded-xl border border-white/15 py-3 text-center font-mono text-[12px] tracking-[0.14em] text-white/50">
                      {dustyCount > 0 ? "SELECT THE DUSTY PANEL" : "ALL PANELS CLEAN"}
                    </div>
                  )}
                  <p className="mt-3 text-center font-mono text-[9px] tracking-[0.1em] text-white/30">
                    {auto ? "SYSTEM CLEANS AUTOMATICALLY" : "MANUAL CONTROL · TAP TO ACTIVATE"}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 10. TECHNOLOGY — exploded architecture                             */
/* ------------------------------------------------------------------ */

function Technology() {
  const parts = [
    { n: "01", t: "Camera Module", d: "Captures panel imagery for vision-based dust detection" },
    { n: "02", t: "Microcontroller", d: "Threshold logic & decision core" },
    { n: "03", t: "Pump", d: "Pressurizes the cleaning line" },
    { n: "04", t: "Solenoid Valve", d: "Gates flow per-panel on demand" },
    { n: "05", t: "Cleaning Nozzle", d: "Even water / air distribution" },
    { n: "06", t: "Mobile Application", d: "Status, control & alerts" },
  ]
  const deckRef = useScrollLink<HTMLDivElement>()
  return (
    <section className="relative bg-paper py-28">

      <div className="mx-auto max-w-[1240px] px-6">
        <Reveal>
          <Kicker n="05" label="ARCHITECTURE" />
          <h2 className="mt-6 max-w-[680px] font-display text-[clamp(2rem,4.6vw,3.2rem)] font-600 tracking-[-0.02em]">
            <SplitText text="Six components. One coordinated system." />
          </h2>
        </Reveal>

        <div
          ref={deckRef}
          className="tech-deck mt-16 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 md:grid-cols-3"
        >
          {parts.map((p, i) => (
            <Reveal key={p.n} delay={i * 120} from={i % 2 === 1 ? "right" : "left"}>
              <TiltCard className="lift-card group relative h-full bg-paper p-8 transition-colors hover:bg-mist">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] tracking-[0.2em] text-ink/40">{p.n}</span>
                  <span
                    className="h-2.5 w-2.5 rounded-full transition-transform group-hover:scale-150"
                    style={{ background: "var(--color-solar)" }}
                  />
                </div>
                <h3 className="mt-8 font-display text-[22px] font-600 tracking-tight">{p.t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink/55">{p.d}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 11. DASHBOARD                                                       */
/* ------------------------------------------------------------------ */

function Dashboard() {
  const { panels } = useSystem()
  const count = (s: PanelState) => panels.filter((p) => p === s).length
  const stats = [
    { k: panels.length, l: "Panels" },
    { k: count("dust"), l: "Requires Cleaning", c: "var(--color-solar)" },
    { k: count("cleaning"), l: "Cleaning", c: "var(--color-sensor)" },
    { k: count("clean"), l: "Clean", c: "var(--color-leaf)" },
  ]
  return (
    <section className="relative overflow-hidden py-28" style={{ background: "var(--color-night-soft)" }}>
      <div className="grain-lines absolute inset-0 text-white/40" />
      <div className="relative mx-auto max-w-[1240px] px-6 text-white">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Kicker n="06" label="SMART MONITORING" dark />
              <h2 className="mt-6 font-display text-[clamp(2rem,4.6vw,3.2rem)] font-600 tracking-[-0.02em]">
                <SplitText text="System online." />
              </h2>
            </div>
            <span className="flex items-center gap-2 font-mono text-[12px] tracking-[0.15em] text-emerald-400">
              <span className="live-dot h-2.5 w-2.5 rounded-full bg-emerald-400" /> SYSTEM ONLINE
            </span>
          </div>
        </Reveal>

        <Reveal delay={120} from="right">
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <Stat key={s.l} value={s.k} label={s.l} color={s.c} total={panels.length} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Stat({
  value,
  label,
  color,
  total,
}: {
  value: number
  label: string
  color?: string
  total: number
}) {
  const n = useCountUp(value)
  const ratio = total > 0 ? value / total : 0
  return (
    <div className="bg-[#0b1017] p-8">
      <p
        className="font-display text-[52px] font-700 leading-none tabular-nums"
        style={{ color: color ?? "#fff" }}
      >
        {n}
      </p>
      <div
        className="stat-bar"
        style={{
          ["--v" as string]: `${ratio}`,
          ["--bar-color" as string]: color ?? "rgba(255,255,255,0.55)",
        }}
      >
        <span className="stat-bar__fill" />
      </div>
      <p className="mt-3 font-mono text-[11px] tracking-[0.15em] text-white/45">{label.toUpperCase()}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 12. FUTURE — horizontal timeline                                   */
/* ------------------------------------------------------------------ */

type RoadmapItem = { tag: string; t: string; d: string }

function RoadmapCard({ item, i, className = "" }: { item: RoadmapItem; i: number; className?: string }) {
  return (
    <TiltCard className={`lift-card relative rounded-2xl border border-ink/10 bg-paper p-8 ${className}`}>
      <div className="mb-6 flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full font-mono text-[12px] text-white"
          style={{ background: "var(--color-night)" }}
        >
          {i + 1}
        </span>
        <span className="font-mono text-[11px] tracking-[0.25em] text-ink/45">{item.tag}</span>
      </div>
      <h3 className="font-display text-[22px] font-600 leading-tight tracking-tight">{item.t}</h3>
      <p className="mt-3 text-[14px] leading-relaxed text-ink/55">{item.d}</p>
    </TiltCard>
  )
}

function Future() {
  const items: RoadmapItem[] = [
    { tag: "TODAY", t: "Dust Detection", d: "Cameras flag panels that need attention." },
    { tag: "NEXT", t: "Automatic Cleaning", d: "Fully hands-off activation on threshold." },
    { tag: "FUTURE", t: "Panel Monitoring", d: "Continuous health & yield analytics." },
    { tag: "VISION", t: "Smarter Solar Maintenance", d: "Predictive, autonomous solar farms." },
  ]
  const { ref, progress } = useSectionProgress<HTMLElement>()
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [overflow, setOverflow] = useState(0)

  useEffect(() => {
    const measure = () => {
      const el = trackRef.current
      if (!el) return
      setOverflow(Math.max(0, el.scrollWidth - window.innerWidth + 72))
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  // Advances only while the section is pinned, so the track moves at scroll speed.
  const advance = Math.max(0, Math.min(1, (progress - 0.34) / 0.315))
  const shift = advance * overflow

  const heading = (
    <div className="mx-auto max-w-[1240px] px-6">
      <Reveal>
        <Kicker n="07" label="ROADMAP" />          <h2 className="mt-6 font-display text-[clamp(2rem,4.6vw,3.2rem)] font-600 tracking-[-0.02em]">
            <SplitText text="Where this is going." />
          </h2>
      </Reveal>
    </div>
  )

  return (
    <section id="future" ref={ref} className="relative bg-mist">

      {/* Desktop: pinned timeline advanced by vertical scroll. */}
      <div className="roadmap-pin hidden md:block">
        <div className="roadmap-pin__sticky">
          {heading}
          <div className="roadmap-viewport mt-14">
            <div
              ref={trackRef}
              className="roadmap-track"
              style={{ transform: `translate3d(${-shift}px, 0, 0)` }}
            >
              {items.map((it, i) => (
                <RoadmapCard key={it.tag} item={it} i={i} className="w-[440px] flex-none" />
              ))}
            </div>
          </div>
          <div className="mx-auto mt-10 flex w-full max-w-[1240px] items-center gap-4 px-6 font-mono text-[10px] tracking-[0.24em] text-ink/40">
            <span className="h-px flex-1 bg-ink/15" />
            <span>SCROLL TO ADVANCE</span>
            <span className="h-px flex-1 bg-ink/15" />
          </div>
        </div>
      </div>

      {/* Mobile: swipeable strip. */}
      <div className="py-24 md:hidden">
        {heading}
        <div className="mt-12 flex gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none]">
          {items.map((it, i) => (
            <RoadmapCard key={it.tag} item={it} i={i} className="min-w-[280px] flex-1" />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 13. FINAL                                                           */
/* ------------------------------------------------------------------ */

function Final() {
  const { ref, progress } = useSectionProgress<HTMLDivElement>()
  const light = Math.min(1, progress * 1.5)
  return (
    <section ref={ref} id="final" className="relative" style={{ background: "var(--color-night)" }}>
      <div className="mx-auto flex max-w-[1240px] flex-col items-center px-6 py-40 text-center text-white">
        <div
          className="final-panel relative mb-14 w-[360px] max-w-[80vw]"
          style={{ transform: `translate3d(0, ${(1 - light) * 24}px, 0)` }}
        >
          <div
            className="absolute -inset-10 rounded-full transition-opacity duration-500"
            style={{
              opacity: light,
              background: "radial-gradient(circle, color-mix(in oklab, var(--color-solar) 38%, transparent), transparent 65%)",
            }}
          />
          <div className="relative" style={{ filter: `brightness(${0.5 + light * 0.7})` }}>
            <SolarPanel dust={0} />
          </div>
        </div>

        <Reveal>
          <h2 className="font-display text-[clamp(2.2rem,5.5vw,4rem)] font-600 leading-[1.05] tracking-[-0.025em]">
            <SplitText text="Cleaner panels. Smarter maintenance." />
          </h2>
          <p className="mt-6 font-mono text-[13px] tracking-[0.25em] text-white/50">
            DETECT → CLEAN → MONITOR
          </p>
        </Reveal>

        <Reveal delay={120} from="right">
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
            <Magnetic>
              <a
                href="#hero"
                className="btn-sheen rounded-full px-8 py-4 font-mono text-[12px] tracking-[0.14em] text-night transition-transform hover:scale-[1.03]"
                style={{ background: "linear-gradient(90deg, var(--color-solar), var(--color-solar-deep))" }}
              >
                EXPLORE THE PROTOTYPE
              </a>
            </Magnetic>
            <Magnetic>
              <Link
                to="/contact"
                className="btn-sheen rounded-full border border-white/20 px-8 py-4 font-mono text-[12px] tracking-[0.14em] text-white/80 transition-colors hover:bg-white/5"
              >
                CONTACT OUR TEAM
              </Link>
            </Magnetic>
          </div>
        </Reveal>
      </div>

      <footer className="border-t border-white/10 py-8 text-center font-mono text-[11px] tracking-[0.2em] text-white/35">
        SOLARA · SMART SOLAR PANEL CLEANING SYSTEM · 2026
      </footer>
    </section>
  )
}

/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <SystemProvider>
      <VisitorTracker />
      <ScrollProgress />
      <div className="relative">
        <Nav />
        <Hero />
        <Problem />
        <Seam from="var(--color-paper)" to="var(--color-night)" />
        <Question />
        <Reveal4 />
        <SpecTicker />
        <HowItWorks />
        <Seam from="var(--color-mist)" to="#0a1a26" />
        <WaterTransition />
        <Seam from="#0a1a26" to="var(--color-night)" h={80} />
        <AppControl />
        <Seam from="var(--color-night)" to="var(--color-paper)" />
        <Technology />
        <Seam from="var(--color-paper)" to="var(--color-night-soft)" />
        <Dashboard />
        <Seam from="var(--color-night-soft)" to="var(--color-mist)" />
        <Future />
        <Seam from="var(--color-mist)" to="var(--color-night)" />
        <Final />
      </div>
    </SystemProvider>
  )
}
