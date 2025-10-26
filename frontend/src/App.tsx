import TestApi from "./pages/TestApi"

function App() {
  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        padding: 16,
      }}
    >
      <h1 style={{ margin: 0 }}>UNCP Navigate • API Test</h1>
      <p style={{ color: "#555", marginTop: 8 }}>
        Use this page to verify the frontend ↔ backend wiring in local dev.
      </p>
      <TestApi />
    </div>
  )
}

export default App
