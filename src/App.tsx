import { Fragment, useEffect, useState } from "react"
import { DustField } from "./components/DustField"
import { PanelState, SolarPanel } from "./components/SolarPanel"
import { useReveal, useSectionProgress } from "./lib/scroll"

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const { ref, shown } = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "in" : ""} ${className}`}
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
      <span style={{ color: "var(--color-solar-deep)" }}>{n}</span>
      <span className="h-px w-8" style={{ background: "currentColor" }} />
      <span>{label}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Nav                                                                 */
/* ------------------------------------------------------------------ */

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "backdrop-blur-xl" : ""
      }`}
      style={{
        background: scrolled ? "rgba(251,251,249,0.72)" : "transparent",
        borderBottom: scrolled ? "1px solid rgba(10,14,20,0.08)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="relative h-6 w-6">
            <div
              className="sun-core absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle, #ffce5c, #f38b1c)" }}
            />
          </div>
          <span className="font-display text-[15px] font-600 tracking-tight">SOLARA</span>
        </div>
        <nav className="hidden items-center gap-8 font-mono text-[11px] tracking-[0.15em] text-ink/60 md:flex">
          <a href="#problem" className="transition-colors hover:text-ink">PROBLEM</a>
          <a href="#solution" className="transition-colors hover:text-ink">SYSTEM</a>
          <a href="#app" className="transition-colors hover:text-ink">APP</a>
          <a href="#future" className="transition-colors hover:text-ink">FUTURE</a>
        </nav>
        <a
          href="#final"
          className="rounded-full px-4 py-2 font-mono text-[11px] tracking-[0.12em] text-white transition-transform hover:scale-[1.03]"
          style={{ background: "var(--color-ink)" }}
        >
          PROTOTYPE
        </a>
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------ */
/* 1. HERO — sun to panel                                              */
/* ------------------------------------------------------------------ */

function Hero() {
  const { ref, progress } = useSectionProgress<HTMLDivElement>()
  // panel grows / tilts as we scroll; dust builds in the back half
  const scale = 0.7 + progress * 0.9
  const rotate = 24 - progress * 24
  const dust = Math.max(0, (progress - 0.45) / 0.5)
  const sunY = -progress * 260
  const sunOpacity = Math.max(0, 1 - progress * 1.4)

  return (
    <section ref={ref} className="relative h-[220vh]" id="hero">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        {/* sky gradient ground */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #fff7e6 0%, #fdeecf 22%, #fbfbf9 60%)",
          }}
        />
        {/* sun */}
        <div
          className="absolute left-1/2 top-[14%] -translate-x-1/2"
          style={{ transform: `translate(-50%, ${sunY}px)`, opacity: sunOpacity }}
        >
          <div className="relative">
            <div
              className="sun-core h-40 w-40 rounded-full"
              style={{
                background: "radial-gradient(circle, #ffe08a 0%, #ffbe3d 45%, #f38b1c 100%)",
                boxShadow: "0 0 120px 40px rgba(255,176,32,0.45)",
              }}
            />
            {/* light beams */}
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 origin-top"
                style={{
                  width: 2,
                  height: 480,
                  transform: `translate(-50%, 40px) rotate(${(i - 3) * 9}deg)`,
                  background:
                    "linear-gradient(180deg, rgba(255,190,61,0.5), transparent)",
                }}
              />
            ))}
          </div>
        </div>

        {/* headline */}
        <div
          className="relative z-10 mx-auto max-w-[900px] px-6 text-center"
          style={{ opacity: Math.max(0, 1 - progress * 1.8) }}
        >
          <p className="mb-6 font-mono text-[11px] tracking-[0.3em] text-ink/50">
            SMART SOLAR PANEL CLEANING SYSTEM
          </p>
          <h1 className="font-display text-[clamp(2.2rem,6vw,4.6rem)] font-600 leading-[1.02] tracking-[-0.02em]">
            What if your solar panels could tell you when they need cleaning?
          </h1>
          <p className="mx-auto mt-6 max-w-[520px] text-[17px] leading-relaxed text-ink/60">
            Detect the dust. Clean when needed. Control every panel.
          </p>
        </div>

        {/* panel that grows toward viewer */}
        <div
          className="absolute bottom-[-6%] left-1/2 z-0 w-[440px] max-w-[80vw] -translate-x-1/2"
          style={{
            transform: `translateX(-50%) perspective(1200px) rotateX(${rotate}deg) scale(${scale})`,
          }}
        >
          <SolarPanel dust={dust} />
          {dust > 0.35 && (
            <div
              className="absolute -right-4 top-2 flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] shadow-lg backdrop-blur"
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
          style={{ opacity: Math.max(0, 1 - progress * 3) }}
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
          style={{ background: "linear-gradient(90deg, rgba(251,251,249,0.94), rgba(251,251,249,0.4) 55%, transparent)" }}
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
  const scanX = -110 + Math.min(1, Math.max(0, (progress - 0.7) / 0.28)) * 220
  return (
    <section ref={ref} className="relative h-[260vh]" style={{ background: "var(--color-ink)" }}>
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

        {/* sensor scan entering solution */}
        {progress > 0.68 && (
          <>
            <div
              className="absolute inset-y-0 w-[2px]"
              style={{
                left: `${50 + scanX / 2.4}%`,
                background: "linear-gradient(180deg, transparent, var(--color-sensor), transparent)",
                boxShadow: "0 0 24px 4px rgba(34,211,238,0.6)",
              }}
            />
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${50 + scanX / 2.4}%` }}
            >
              <span className="relative flex h-4 w-4">
                <span className="pulse-ring absolute inline-flex h-full w-full rounded-full" style={{ background: "var(--color-sensor)" }} />
                <span className="relative inline-flex h-4 w-4 rounded-full" style={{ background: "var(--color-sensor)", boxShadow: "0 0 20px var(--color-sensor)" }} />
              </span>
            </div>
          </>
        )}
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
        style={{ background: "linear-gradient(180deg, var(--color-ink), transparent)" }}
      />
      <div className="mx-auto max-w-[1240px] px-6">
        <Reveal>
          <Kicker n="02" label="THE SOLUTION" />
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-6 max-w-[820px] font-display text-[clamp(2.2rem,5.5vw,4rem)] font-600 leading-[1.03] tracking-[-0.025em]">
            Meet our Smart Solar Panel Cleaning System.
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-6 max-w-[560px] text-[18px] leading-relaxed text-ink/60">
            A semi-automatic system that detects dust and activates cleaning when required.
          </p>
        </Reveal>

        <Reveal delay={200} className="mt-20">
          <div className="relative grid items-center gap-6 md:grid-cols-[1.1fr_auto_0.9fr_auto_0.9fr]">
            {/* hero panel */}
            <div className="rounded-2xl border border-ink/10 bg-white/70 p-6 shadow-xl backdrop-blur">
              <SolarPanel dust={0} scan />
              <p className="mt-4 font-mono text-[11px] tracking-[0.15em] text-ink/50">LIVE INSTALLATION · ARRAY A</p>
            </div>

            {/* chain */}
            <ChainArrow />
            {chain.map((c, i) => (
              <Fragment key={c.label}>
                <div
                  className="rounded-2xl border border-ink/10 bg-white p-6 text-center shadow-sm"
                >
                  <span
                    className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: `color-mix(in oklab, ${c.color} 18%, white)` }}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                  </span>
                  <p className="font-display text-[15px] font-600">{c.label}</p>
                  <p className="mt-1 font-mono text-[11px] text-ink/45">{c.desc}</p>
                </div>
                {i < chain.length - 1 && <ChainArrow />}
              </Fragment>
            ))}
          </div>
        </Reveal>
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
          <SolarPanel dust={0.35} scan />
        </div>
      ),
    },
    {
      n: "02",
      title: "DECIDE",
      body: "The controller compares the live reading against the defined threshold.",
      render: () => (
        <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-lg">
          <Meter label="Dust Level" value={78} color="var(--color-solar)" />
          <Meter label="Threshold" value={60} color="var(--color-ink)" muted />
          <div
            className="mt-6 flex items-center gap-2 rounded-lg px-4 py-3 font-mono text-[12px] tracking-[0.12em]"
            style={{ background: "color-mix(in oklab, var(--color-solar) 14%, white)", color: "var(--color-solar-deep)" }}
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
      render: () => <CleaningPanel />,
    },
    {
      n: "04",
      title: "CONTROL",
      body: "The user receives the panel status directly through the mobile application.",
      render: () => <MiniPhone />,
    },
  ]
  return (
    <section className="relative bg-mist py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <Reveal>
          <Kicker n="03" label="HOW IT WORKS" />
          <h2 className="mt-6 font-display text-[clamp(2rem,4.6vw,3.2rem)] font-600 tracking-[-0.02em]">
            Four steps, one continuous loop.
          </h2>
        </Reveal>

        <div className="mt-16 flex flex-col gap-24">
          {steps.map((s, i) => (
            <Reveal key={s.n}>
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
      <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(10,14,20,0.08)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-[1400ms] ease-out"
          style={{ width: shown ? `${value}%` : "0%", background: color }}
        />
      </div>
    </div>
  )
}

function CleaningPanel() {
  const { ref, shown } = useReveal<HTMLDivElement>({ once: false })
  return (
    <div ref={ref} className="relative overflow-hidden rounded-2xl">
      <SolarPanel dust={shown ? 0 : 0.6} />
      {shown && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(120,200,255,0.5), rgba(255,255,255,0.7), rgba(120,200,255,0.5), transparent)",
            width: "40%",
            animation: "waterMove 2.4s ease-in-out infinite",
          }}
        />
      )}
    </div>
  )
}

function MiniPhone() {
  return (
    <div className="mx-auto w-[220px] rounded-[28px] border-4 border-ink bg-ink p-2 shadow-2xl">
      <div className="rounded-[20px] bg-paper p-4">
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
  const clean = Math.min(1, progress * 1.4)
  return (
    <section ref={ref} className="relative h-[140vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden" style={{ background: "#0b2033" }}>
        <div className="w-[760px] max-w-[92vw]">
          <SolarPanel dust={1 - clean} />
        </div>
        {/* water sweep tied to scroll */}
        <div
          className="pointer-events-none absolute inset-y-0 w-[60%]"
          style={{
            left: `${-60 + clean * 120}%`,
            background:
              "linear-gradient(90deg, transparent, rgba(120,200,255,0.35), rgba(255,255,255,0.6), rgba(120,200,255,0.35), transparent)",
          }}
        />
        <p className="absolute bottom-16 left-1/2 -translate-x-1/2 font-mono text-[11px] tracking-[0.3em] text-white/60">
          DUST → CLEANING → CLEAN PANEL
        </p>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 7 + 9. MOBILE APP + INDIVIDUAL CONTROL (interactive)               */
/* ------------------------------------------------------------------ */

function AppControl() {
  const [panels, setPanels] = useState<PanelState[]>(["clean", "dust", "clean", "clean"])
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState<"idle" | "cleaning" | "done">("idle")

  const cleanPanel = (idx: number) => {
    if (busy) return
    setBusy(true)
    setPhase("cleaning")
    setPanels((p) => p.map((s, i) => (i === idx ? "cleaning" : s)))
    setTimeout(() => {
      setPanels((p) => p.map((s, i) => (i === idx ? "clean" : s)))
      setPhase("done")
      setBusy(false)
      setTimeout(() => setPhase("idle"), 2200)
    }, 2600)
  }

  const reset = () => {
    setPanels(["clean", "dust", "clean", "clean"])
    setPhase("idle")
  }

  const target = panels.findIndex((s) => s === "dust")

  return (
    <section id="app" className="relative overflow-hidden py-28" style={{ background: "var(--color-ink)" }}>
      <DustField intensity={0.15} count={18} className="opacity-40" />
      <div className="mx-auto max-w-[1240px] px-6 text-white">
        <Reveal>
          <Kicker n="04" label="SMART CONTROL" dark />
          <h2 className="mt-6 max-w-[760px] font-display text-[clamp(2rem,4.8vw,3.4rem)] font-600 leading-[1.05] tracking-[-0.02em]">
            Why clean every panel when only one needs attention?
          </h2>
          <p className="mt-5 max-w-[480px] text-[17px] leading-relaxed text-white/55">
            Control it from wherever you are. Tap a panel, watch it clean, done.
          </p>
        </Reveal>

        <div className="mt-16 grid items-center gap-14 lg:grid-cols-[1fr_360px]">
          {/* Array */}
          <Reveal>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {panels.map((s, i) => (
                <div
                  key={i}
                  className="relative rounded-xl border p-3 transition-all"
                  style={{
                    borderColor: s === "dust" ? "rgba(255,176,32,0.6)" : "rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  {s === "dust" && (
                    <span className="pulse-ring absolute inset-0 rounded-xl" style={{ background: "rgba(255,176,32,0.15)" }} />
                  )}
                  <SolarPanel dust={s === "dust" ? 0.6 : s === "cleaning" ? 0.25 : 0} state={s} scan={s === "cleaning"} />
                  <p className="mt-2 font-mono text-[10px] tracking-[0.15em] text-white/40">PANEL 0{i + 1}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Phone dashboard */}
          <Reveal delay={120}>
            <div className="mx-auto w-[300px] rounded-[36px] border-[6px] border-white/15 bg-[#05090f] p-3 shadow-2xl">
              <div className="rounded-[26px] bg-gradient-to-b from-[#0d141d] to-[#070b11] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[14px] font-600 text-white">Solar System</span>
                  <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.15em] text-emerald-400">
                    <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400" /> ONLINE
                  </span>
                </div>

                <div className="mt-5 space-y-2.5">
                  {panels.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <span className="text-[13px] text-white/80">Panel 0{i + 1}</span>
                      <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: STATE_COLOR[s] }}>
                        <span className="h-2 w-2 rounded-full" style={{ background: STATE_COLOR[s] }} />
                        {STATE_LABEL[s]}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  {phase === "done" ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/15 py-3 font-mono text-[12px] tracking-[0.12em] text-emerald-400">
                      CLEANING COMPLETE ✓
                    </div>
                  ) : phase === "cleaning" ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500/15 py-3 font-mono text-[12px] tracking-[0.12em] text-cyan-300">
                      <span className="live-dot">CLEANING…</span>
                    </div>
                  ) : target >= 0 ? (
                    <button
                      onClick={() => cleanPanel(target)}
                      className="w-full rounded-xl py-3 font-mono text-[12px] tracking-[0.14em] text-ink transition-transform hover:scale-[1.02] active:scale-95"
                      style={{ background: "linear-gradient(90deg, #ffce5c, #ffb020)" }}
                    >
                      CLEAN PANEL 0{target + 1}
                    </button>
                  ) : (
                    <button
                      onClick={reset}
                      className="w-full rounded-xl border border-white/15 py-3 font-mono text-[12px] tracking-[0.14em] text-white/70 transition-colors hover:bg-white/5"
                    >
                      ALL CLEAN · RESET DEMO
                    </button>
                  )}
                  <p className="mt-3 text-center font-mono text-[9px] tracking-[0.1em] text-white/30">
                    MANUAL CONTROL · TAP TO ACTIVATE
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
  return (
    <section className="relative bg-paper py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <Reveal>
          <Kicker n="05" label="ARCHITECTURE" />
          <h2 className="mt-6 max-w-[680px] font-display text-[clamp(2rem,4.6vw,3.2rem)] font-600 tracking-[-0.02em]">
            Six components. One coordinated system.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 md:grid-cols-3">
          {parts.map((p, i) => (
            <Reveal key={p.n} delay={i * 70}>
              <div className="group relative h-full bg-paper p-8 transition-colors hover:bg-mist">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] tracking-[0.2em] text-ink/40">{p.n}</span>
                  <span
                    className="h-2.5 w-2.5 rounded-full transition-transform group-hover:scale-150"
                    style={{ background: "var(--color-solar)" }}
                  />
                </div>
                <h3 className="mt-8 font-display text-[22px] font-600 tracking-tight">{p.t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink/55">{p.d}</p>
                {i < parts.length - 1 && (
                  <span className="mt-6 block font-mono text-[11px] text-ink/30">↓ connects to 0{i + 2 <= 6 ? i + 2 : ""}</span>
                )}
              </div>
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
  const stats = [
    { k: "4", l: "Panels" },
    { k: "1", l: "Requires Cleaning", c: "var(--color-solar)" },
    { k: "1", l: "Cleaning", c: "var(--color-sensor)" },
    { k: "2", l: "Clean", c: "var(--color-leaf)" },
  ]
  return (
    <section className="relative overflow-hidden py-28" style={{ background: "var(--color-ink-soft)" }}>
      <div className="grain-lines absolute inset-0 text-white/40" />
      <div className="relative mx-auto max-w-[1240px] px-6 text-white">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Kicker n="06" label="SMART MONITORING" dark />
              <h2 className="mt-6 font-display text-[clamp(2rem,4.6vw,3.2rem)] font-600 tracking-[-0.02em]">
                System online.
              </h2>
            </div>
            <span className="flex items-center gap-2 font-mono text-[12px] tracking-[0.15em] text-emerald-400">
              <span className="live-dot h-2.5 w-2.5 rounded-full bg-emerald-400" /> SYSTEM ONLINE
            </span>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.l} className="bg-[#0b1017] p-8">
                <p className="font-display text-[52px] font-700 leading-none" style={{ color: s.c ?? "#fff" }}>
                  {s.k}
                </p>
                <p className="mt-3 font-mono text-[11px] tracking-[0.15em] text-white/45">{s.l.toUpperCase()}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* 12. FUTURE — horizontal timeline                                   */
/* ------------------------------------------------------------------ */

function Future() {
  const items = [
    { tag: "TODAY", t: "Dust Detection", d: "Cameras flag panels that need attention." },
    { tag: "NEXT", t: "Automatic Cleaning", d: "Fully hands-off activation on threshold." },
    { tag: "FUTURE", t: "Panel Monitoring", d: "Continuous health & yield analytics." },
    { tag: "VISION", t: "Smarter Solar Maintenance", d: "Predictive, autonomous solar farms." },
  ]
  return (
    <section id="future" className="relative bg-mist py-28">
      <div className="mx-auto max-w-[1240px] px-6">
        <Reveal>
          <Kicker n="07" label="ROADMAP" />
          <h2 className="mt-6 font-display text-[clamp(2rem,4.6vw,3.2rem)] font-600 tracking-[-0.02em]">
            Where this is going.
          </h2>
        </Reveal>
      </div>

      <Reveal className="mt-16">
        <div className="flex gap-6 overflow-x-auto px-6 pb-6 [scrollbar-width:none] md:mx-auto md:max-w-[1240px]">
          {items.map((it, i) => (
            <div
              key={it.tag}
              className="relative min-w-[280px] flex-1 rounded-2xl border border-ink/10 bg-paper p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full font-mono text-[12px] text-white"
                  style={{ background: "var(--color-ink)" }}
                >
                  {i + 1}
                </span>
                <span className="font-mono text-[11px] tracking-[0.25em] text-ink/45">{it.tag}</span>
              </div>
              <h3 className="font-display text-[22px] font-600 leading-tight tracking-tight">{it.t}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-ink/55">{it.d}</p>
              {i < items.length - 1 && (
                <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 font-mono text-ink/25 md:block">→</span>
              )}
            </div>
          ))}
        </div>
      </Reveal>
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
    <section ref={ref} id="final" className="relative" style={{ background: "var(--color-ink)" }}>
      <div className="mx-auto flex max-w-[1240px] flex-col items-center px-6 py-40 text-center text-white">
        <div className="relative mb-14 w-[360px] max-w-[80vw]">
          <div
            className="absolute -inset-10 rounded-full transition-opacity duration-500"
            style={{
              opacity: light,
              background: "radial-gradient(circle, rgba(255,190,61,0.35), transparent 65%)",
            }}
          />
          <div className="relative" style={{ filter: `brightness(${0.5 + light * 0.7})` }}>
            <SolarPanel dust={0} />
          </div>
        </div>

        <Reveal>
          <h2 className="font-display text-[clamp(2.2rem,5.5vw,4rem)] font-600 leading-[1.05] tracking-[-0.025em]">
            Cleaner panels. Smarter maintenance.
          </h2>
          <p className="mt-6 font-mono text-[13px] tracking-[0.25em] text-white/50">
            DETECT → CLEAN → MONITOR
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
            <a
              href="#hero"
              className="rounded-full px-8 py-4 font-mono text-[12px] tracking-[0.14em] text-ink transition-transform hover:scale-[1.03]"
              style={{ background: "linear-gradient(90deg, #ffce5c, #ffb020)" }}
            >
              EXPLORE THE PROTOTYPE
            </a>
            <a
              href="#app"
              className="rounded-full border border-white/20 px-8 py-4 font-mono text-[12px] tracking-[0.14em] text-white/80 transition-colors hover:bg-white/5"
            >
              CONTACT OUR TEAM
            </a>
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

export default function App() {
  return (
    <div className="relative">
      <Nav />
      <Hero />
      <Problem />
      <Question />
      <Reveal4 />
      <HowItWorks />
      <WaterTransition />
      <AppControl />
      <Technology />
      <Dashboard />
      <Future />
      <Final />
    </div>
  )
}
