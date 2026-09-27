import { useEffect, useState } from "react"
import { Link } from "react-router"
import { LocationPicker } from "../components/LocationPicker"
import { submitContactRequest, type ContactLocation, type ContactRequest } from "../lib/contactApi"
import { ThemeToggle } from "../lib/theme"

/* ------------------------------------------------------------------ */
/* Shared bits reused from the SOLARA identity                         */
/* ------------------------------------------------------------------ */

function ContactNav() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 backdrop-blur-xl"
      style={{
        background: "color-mix(in oklab, var(--color-paper) 72%, transparent)",
        borderBottom: "1px solid color-mix(in oklab, var(--color-ink) 10%, transparent)",
      }}
    >
      <div className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative h-6 w-6">
            <div className="sun-core absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, #ffce5c, #f38b1c)" }} />
          </div>
          <span className="font-display text-[15px] font-600 tracking-tight text-ink">SOLARA</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/"
            className="rounded-full border border-ink/15 px-4 py-2 font-mono text-[11px] tracking-[0.12em] text-ink/80 transition-colors hover:bg-ink/5"
          >
            ← BACK HOME
          </Link>
        </div>
      </div>
    </header>
  )
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  textarea = false,
}: {
  label: string
  name: string
  type?: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  textarea?: boolean
}) {
  const base =
    "w-full rounded-xl border bg-card px-4 py-3 text-[14px] text-ink placeholder:text-ink/30 outline-none transition-colors"
  const border = error ? "border-red-400/60" : "border-ink/12 focus:border-[var(--color-solar)]/60"
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] tracking-[0.22em] text-ink/45">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={`${base} ${border} resize-none`}
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${base} ${border}`}
        />
      )}
      {error && <span className="mt-1.5 block font-mono text-[11px] tracking-[0.04em] text-red-400/90">{error}</span>}
    </label>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

type Errors = Partial<Record<"fullName" | "phone" | "email" | "location" | "message", string>>

export default function Contact() {
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [location, setLocation] = useState<ContactLocation | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const validate = (): Errors => {
    const e: Errors = {}
    if (!fullName.trim()) e.fullName = "Please enter your full name."
    if (!phone.trim()) e.phone = "Please enter a phone number."
    else if (!/^[+\d][\d\s()-]{6,}$/.test(phone.trim())) e.phone = "That phone number doesn't look right."
    if (!email.trim()) e.email = "Please enter an email address."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Enter a valid email address."
    if (!location) e.location = "Please select your installation location on the map."
    if (!message.trim()) e.message = "Tell us a little about your project."
    return e
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setStatus("submitting")
    const payload: ContactRequest = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      location,
      message: message.trim(),
      submittedAt: new Date().toISOString(),
    }
    try {
      await submitContactRequest(payload)
      setStatus("success")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div className="relative min-h-screen" style={{ background: "var(--color-paper)" }}>
      <ContactNav />

      {/* ambient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, rgba(255,176,32,0.14), transparent 70%)" }}
      />

      <main className="relative mx-auto max-w-[1080px] px-6 pb-24 pt-32">
        {status === "success" ? (
          <SuccessState onReset={() => {
            setStatus("idle")
            setFullName(""); setPhone(""); setEmail(""); setMessage(""); setLocation(null); setErrors({})
          }} />
        ) : (
          <div className="page-enter">
            {/* hero */}
            <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.28em] text-ink/45">
              <span className="h-px w-8 bg-ink/45" />
              <span>GET IN TOUCH</span>
            </div>
            <h1 className="mt-6 max-w-[720px] font-display text-[clamp(2.2rem,5.5vw,4rem)] font-600 leading-[1.03] tracking-[-0.025em] text-ink">
              Let&apos;s build cleaner solar.
            </h1>
            <p className="mt-5 max-w-[520px] text-[17px] leading-relaxed text-ink/60">
              Tell us about your solar installation and our team will get in touch.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-14 grid gap-12 lg:grid-cols-[1fr_1fr]">
              {/* left: identity fields */}
              <div className="flex flex-col gap-6">
                <Field label="FULL NAME" name="fullName" value={fullName} onChange={setFullName} error={errors.fullName} placeholder="Jane Okoro" />
                <Field label="PHONE NUMBER" name="phone" type="tel" value={phone} onChange={setPhone} error={errors.phone} placeholder="+1 555 000 1234" />
                <Field label="EMAIL ADDRESS" name="email" type="email" value={email} onChange={setEmail} error={errors.email} placeholder="jane@company.com" />
                <Field label="PROJECT / MESSAGE" name="message" value={message} onChange={setMessage} error={errors.message} placeholder="48-panel rooftop array, frequent dust build-up…" textarea />
              </div>

              {/* right: location picker */}
              <div>
                <span className="mb-2 block font-mono text-[10px] tracking-[0.22em] text-ink/45">INSTALLATION / PANEL LOCATION</span>
                <LocationPicker
                  value={location}
                  onChange={(loc) => {
                    setLocation(loc)
                    setErrors((prev) => ({ ...prev, location: undefined }))
                  }}
                />
                {errors.location && (
                  <span className="mt-2 block font-mono text-[11px] tracking-[0.04em] text-red-400/90">{errors.location}</span>
                )}
              </div>

              {/* submit spans full width */}
              <div className="lg:col-span-2">
                {status === "error" && (
                  <p className="mb-4 font-mono text-[12px] tracking-[0.08em] text-red-400/90">
                    Something went wrong sending your request. Please try again.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full px-10 py-4 font-mono text-[12px] tracking-[0.16em] text-night transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(90deg, #ffce5c, #ffb020)" }}
                >
                  {status === "submitting" ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-night/30 border-t-night" />
                      SENDING…
                    </>
                  ) : (
                    "SEND REQUEST"
                  )}
                </button>
                <p className="mt-4 font-mono text-[10px] tracking-[0.12em] text-ink/30">
                  YOUR SELECTED LOCATION IS INCLUDED WITH THIS REQUEST
                </p>
              </div>
            </form>
          </div>
        )}
      </main>

      <ContactFooter />
    </div>
  )
}

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <div className="page-enter flex min-h-[52vh] flex-col items-center justify-center text-center">
      <div className="relative mb-8">
        <span className="pulse-ring absolute inset-0 rounded-full" style={{ background: "rgba(52,211,153,0.25)" }} />
        <span
          className="relative flex h-16 w-16 items-center justify-center rounded-full text-[26px] text-night"
          style={{ background: "linear-gradient(90deg, #6ee7b7, #34d399)" }}
        >
          ✓
        </span>
      </div>
      <h2 className="font-display text-[clamp(2rem,5vw,3.2rem)] font-600 tracking-[-0.02em] text-ink">Request received.</h2>
      <p className="mt-4 max-w-[420px] text-[17px] leading-relaxed text-ink/60">
        Thank you. Our team will get back to you soon.
      </p>
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <Link
          to="/"
          className="rounded-full px-8 py-4 font-mono text-[12px] tracking-[0.14em] text-night transition-transform hover:scale-[1.03]"
          style={{ background: "linear-gradient(90deg, #ffce5c, #ffb020)" }}
        >
          BACK TO HOME
        </Link>
        <button
          onClick={onReset}
          className="rounded-full border border-ink/20 px-8 py-4 font-mono text-[12px] tracking-[0.14em] text-ink/80 transition-colors hover:bg-ink/5"
        >
          SEND ANOTHER REQUEST
        </button>
      </div>
    </div>
  )
}

function ContactFooter() {
  return (
    <footer className="border-t border-ink/10 py-8 text-center font-mono text-[11px] tracking-[0.2em] text-ink/35">
      SOLARA · SMART SOLAR PANEL CLEANING SYSTEM · 2026
    </footer>
  )
}
