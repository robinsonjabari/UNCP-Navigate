import { useMemo, useState } from "react"
import apiClient from "@/services/api"

type Json = any

export default function TestApi() {
  const [status, setStatus] = useState<Json | null>(null)
  const [places, setPlaces] = useState<Json | null>(null)
  const [route, setRoute] = useState<Json | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showRaw, setShowRaw] = useState<boolean>(false)

  const run = async (label: string, fn: () => Promise<void>) => {
    setError(null)
    setLoading(label)
    try {
      await fn()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || String(e))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() =>
            run("status", async () => {
              const data = await apiClient.get("/status")
              setStatus(data)
            })
          }
          disabled={loading !== null}
          style={btnStyle}
        >
          {loading === "status" ? "Checking…" : "Check API status"}
        </button>

        <button
          onClick={() =>
            run("places", async () => {
              const data = await apiClient.get("/places")
              setPlaces(data)
            })
          }
          disabled={loading !== null}
          style={btnStyle}
        >
          {loading === "places" ? "Loading…" : "Get places"}
        </button>

        <button
          onClick={() =>
            run("directions", async () => {
              const data = await apiClient.post("/routes/directions", {
                origin: { lat: 34.7267, lng: -79.0187 },
                destination: { lat: 34.728, lng: -79.02 },
                mode: "walking",
              })
              setRoute(data)
            })
          }
          disabled={loading !== null}
          style={btnStyle}
        >
          {loading === "directions" ? "Calculating…" : "Get directions"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 12, color: "#b00020" }}>Error: {error}</div>
      )}

      <div style={{ marginTop: 12 }}>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
          }}
        >
          <input
            type='checkbox'
            checked={showRaw}
            onChange={(e) => setShowRaw(e.target.checked)}
          />
          Show raw JSON
        </label>
      </div>

      <StatusResults data={status} showRaw={showRaw} />
      <PlacesResults data={places} showRaw={showRaw} />
      <DirectionsResults data={route} showRaw={showRaw} />
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ margin: "12px 0 6px" }}>{title}</h3>
      {children}
    </div>
  )
}

function Code({ data }: { data: Json }) {
  return (
    <pre
      style={{
        padding: 12,
        background: "#0b1020",
        color: "#e6edf3",
        borderRadius: 8,
        overflowX: "auto",
      }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

function StatusResults({
  data,
  showRaw,
}: {
  data: Json | null
  showRaw: boolean
}) {
  if (!data) return null

  // Support both shapes: root ("message", "endpoints") or /api/status ("status", "environment"...)
  const info = useMemo(() => {
    const isRoot = !!data?.message && !!data?.endpoints
    if (isRoot) {
      return {
        header: data.message,
        status: data.status,
        version: data.version,
        endpoints: data.endpoints,
      }
    }
    return {
      header: "API Status",
      status: data?.status ?? "unknown",
      version: data?.environment ?? data?.version ?? "",
      endpoints: undefined,
    }
  }, [data])

  return (
    <Section title='Status'>
      <div style={card}>
        <div style={{ fontWeight: 600 }}>{info.header}</div>
        <div
          style={{
            color:
              info.status === "OK" || info.status === "active"
                ? "#16a34a"
                : "#b91c1c",
          }}
        >
          {String(info.status)}
        </div>
        {info.version && (
          <div style={{ color: "#64748b" }}>
            Version: {String(info.version)}
          </div>
        )}
        {info.endpoints && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600 }}>Endpoints</div>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {Object.entries(info.endpoints).map(([k, v]) => (
                <li key={k}>
                  {k}:{" "}
                  <a href={String(v)} target='_blank' rel='noreferrer'>
                    {String(v)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {showRaw && <Code data={data} />}
    </Section>
  )
}

function PlacesResults({
  data,
  showRaw,
}: {
  data: Json | null
  showRaw: boolean
}) {
  if (!data) return null
  const list: any[] = data?.places ?? []
  return (
    <Section title='Places'>
      <div style={card}>
        <div>
          <strong>Total:</strong> {Array.isArray(list) ? list.length : 0}
        </div>
        {Array.isArray(list) && list.length > 0 && (
          <ul style={{ marginTop: 8, paddingLeft: 16 }}>
            {list.slice(0, 5).map((p: any) => (
              <li key={p.id || p.name}>{p.name}</li>
            ))}
          </ul>
        )}
      </div>
      {showRaw && <Code data={data} />}
    </Section>
  )
}

function DirectionsResults({
  data,
  showRaw,
}: {
  data: Json | null
  showRaw: boolean
}) {
  if (!data) return null
  const r = data?.route ?? {}
  return (
    <Section title='Directions'>
      <div style={card}>
        <div>
          <strong>Mode:</strong> {r.mode ?? "walking"}
        </div>
        <div>
          <strong>Distance:</strong> {r.distance ?? "n/a"}
        </div>
        <div>
          <strong>Duration:</strong> {r.duration ?? "n/a"} sec
        </div>
        <div>
          <strong>Steps:</strong> {Array.isArray(r.steps) ? r.steps.length : 0}
        </div>
      </div>
      {showRaw && <Code data={data} />}
    </Section>
  )
}

const btnStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#0ea5e9",
  color: "white",
  cursor: "pointer",
}

const card: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 12,
  background: "#fff",
}
