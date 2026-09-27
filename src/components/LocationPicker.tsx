import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { ContactLocation } from "../lib/contactApi"
import { useTheme } from "../lib/theme"

/* MapTiler — production map + geocoding provider (free tier). One key powers
   raster tiles, forward search, and reverse geocoding. The key is read from an
   environment variable so no secret is committed and it works on Vercel. */
const MAP_KEY = import.meta.env.VITE_MAP_API_KEY as string | undefined

const tileUrl = (theme: "light" | "dark") =>
  `https://api.maptiler.com/maps/${
    theme === "dark" ? "dataviz-dark" : "dataviz"
  }/{z}/{x}/{y}.png?key=${MAP_KEY}`

/* A gold pin drawn as a divIcon so we avoid bundler asset issues with
   Leaflet's default marker images and stay on-brand. */
const pinIcon = L.divIcon({
  className: "solara-pin",
  html: `
    <span class="solara-pin__ring"></span>
    <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.716 23.284 0 15 0Z" fill="url(#g)"/>
      <circle cx="15" cy="15" r="5.5" fill="#0a0e14"/>
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ffce5c"/><stop offset="1" stop-color="#ffb020"/>
        </linearGradient>
      </defs>
    </svg>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
})

const mapsLink = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

// Geocoding uses keyless Nominatim so search / reverse-lookup work regardless
// of whether the map tile key is configured.
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "en" } },
    )
    const data = await res.json()
    return data?.display_name ?? ""
  } catch {
    return ""
  }
}

export function LocationPicker({
  value,
  onChange,
}: {
  value: ContactLocation | null
  onChange: (loc: ContactLocation) => void
}) {
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // Commit a coordinate: move marker/map if present, reverse-geocode, bubble up.
  // Works even when the map tile key is missing (controls stay functional).
  const commit = async (lat: number, lng: number, knownAddress?: string) => {
    const marker = markerRef.current
    if (marker) marker.setLatLng([lat, lng])
    mapRef.current?.panTo([lat, lng], { animate: true })
    onChangeRef.current({ address: knownAddress ?? "Locating address…", lat, lng, mapsLink: mapsLink(lat, lng) })
    const address = knownAddress ?? (await reverseGeocode(lat, lng))
    onChangeRef.current({ address: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng, mapsLink: mapsLink(lat, lng) })
  }

  // Init map once (only when a key is configured).
  useEffect(() => {
    if (!MAP_KEY || !containerRef.current || mapRef.current) return
    const start: [number, number] = value ? [value.lat, value.lng] : [24.7136, 46.6753] // Riyadh — solar-rich default
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView(start, value ? 15 : 5)
    const tiles = L.tileLayer(tileUrl(theme), {
      attribution: "&copy; MapTiler &copy; OpenStreetMap contributors",
      maxZoom: 20,
      crossOrigin: true,
    }).addTo(map)
    tileRef.current = tiles

    const marker = L.marker(start, { icon: pinIcon, draggable: true }).addTo(map)
    marker.on("dragend", () => {
      const { lat, lng } = marker.getLatLng()
      void commit(lat, lng)
    })
    map.on("click", (e: L.LeafletMouseEvent) => void commit(e.latlng.lat, e.latlng.lng))

    mapRef.current = map
    markerRef.current = marker
    // ensure correct sizing after the reveal transition
    setTimeout(() => map.invalidateSize(), 300)
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swap tile layer to match the active theme.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (tileRef.current) tileRef.current.remove()
    tileRef.current = L.tileLayer(tileUrl(theme), {
      attribution: "&copy; MapTiler &copy; OpenStreetMap contributors",
      maxZoom: 20,
      crossOrigin: true,
    }).addTo(map)
  }, [theme])

  const runSearch = async (e?: React.SyntheticEvent) => {
    e?.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setNotice(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { "Accept-Language": "en" } },
      )
      const data = await res.json()
      if (data[0]) {
        const { lat, lon, display_name } = data[0]
        mapRef.current?.setView([+lat, +lon], 15, { animate: true })
        await commit(+lat, +lon, display_name)
      } else {
        setNotice("No results for that search.")
      }
    } catch {
      setNotice("Search is unavailable right now.")
    } finally {
      setSearching(false)
    }
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setNotice("Geolocation isn't supported on this device.")
      return
    }
    setLocating(true)
    setNotice(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 16, { animate: true })
        await commit(pos.coords.latitude, pos.coords.longitude)
        setLocating(false)
      },
      () => {
        setNotice("Couldn't access your location. Search or drop a pin instead.")
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const noMap = !MAP_KEY

  return (
    <div>
      {/* search + current location */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Not a <form> — this component renders inside the page's contact
            form, and nested forms are invalid HTML. Enter / click call
            runSearch directly instead of submitting. */}
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                void runSearch()
              }
            }}
            placeholder="Search a city, address, or place"
            className="w-full rounded-xl border border-ink/12 bg-card px-4 py-3 pr-24 text-[14px] text-ink placeholder:text-ink/35 outline-none transition-colors focus:border-[var(--color-solar)]/60 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void runSearch()}
            disabled={searching}
            className="absolute right-1.5 top-1.5 rounded-lg px-4 py-2 font-mono text-[11px] tracking-[0.12em] text-night transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-60"
            style={{ background: "linear-gradient(90deg, #ffce5c, #ffb020)" }}
          >
            {searching ? "…" : "FIND"}
          </button>
        </div>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="flex items-center justify-center gap-2 rounded-xl border border-ink/15 px-4 py-3 font-mono text-[11px] tracking-[0.12em] text-ink/75 transition-colors hover:bg-ink/5 disabled:opacity-60"
        >
          <span className="text-[13px]">◎</span>
          {locating ? "LOCATING…" : "USE MY LOCATION"}
        </button>
      </div>

      {notice && <p className="mt-3 font-mono text-[11px] tracking-[0.08em] text-[var(--color-solar)]">{notice}</p>}

      {/* map — or a setup message when no tile key is configured */}
      {noMap ? (
        <div className="mt-4 flex h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/20 bg-card px-6 text-center">
          <span className="font-mono text-[11px] tracking-[0.2em] text-[var(--color-solar)]">MAP SETUP REQUIRED</span>
          <p className="max-w-[360px] text-[13px] leading-relaxed text-ink/55">
            Search and{" "}
            <span className="text-ink/80">USE MY LOCATION</span>{" "}
            still work and fill in the location below. Add a{" "}
            <span className="font-mono text-ink/80">VITE_MAP_API_KEY</span>{" "}
            MapTiler key to show the interactive map with drag-to-place pin.
          </p>
          <a
            href="https://www.maptiler.com/cloud/"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] tracking-[0.12em] text-ink/45 underline transition-opacity hover:opacity-80"
          >
            GET A FREE KEY ↗
          </a>
        </div>
      ) : (
        <div className="relative mt-4 overflow-hidden rounded-2xl border border-ink/12">
          <div ref={containerRef} className="h-[320px] w-full" />
          <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-full border border-ink/15 bg-card/80 px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] text-ink/55 backdrop-blur">
            TAP MAP OR DRAG PIN
          </div>
        </div>
      )}

      {/* selected details */}
      <div className="mt-4 rounded-2xl border border-ink/10 bg-card p-5">
        <p className="font-mono text-[10px] tracking-[0.22em] text-ink/40">SELECTED LOCATION</p>
        {value ? (
          <>
            <p className="mt-3 text-[14px] leading-relaxed text-ink/85">{value.address}</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="font-mono text-[10px] tracking-[0.18em] text-ink/35">LATITUDE</p>
                <p className="mt-1 font-mono text-[13px] text-ink/80">{value.lat.toFixed(6)}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] tracking-[0.18em] text-ink/35">LONGITUDE</p>
                <p className="mt-1 font-mono text-[13px] text-ink/80">{value.lng.toFixed(6)}</p>
              </div>
            </div>
            <a
              href={value.mapsLink}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] text-[var(--color-solar)] transition-opacity hover:opacity-80"
            >
              OPEN IN GOOGLE MAPS ↗
            </a>
          </>
        ) : (
          <p className="mt-3 text-[14px] leading-relaxed text-ink/45">
            No location selected yet. Search, use your location, or drop a pin on the map.
          </p>
        )}
      </div>
    </div>
  )
}
