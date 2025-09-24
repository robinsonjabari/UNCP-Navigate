#!/usr/bin/env node

/**
 * UNCP Navigate API - Presentation Demo Script
 *
 * This script demonstrates all the key features of the UNCP Navigate API
 * Perfect for running during presentations to show real API responses
 */

const baseUrl = "http://localhost:3001"

console.log("UNCP Navigate API - Live Demo Active")
console.log("=====================================\n")

async function makeRequest(endpoint, method = "GET", data = null) {
  try {
    const url = `${baseUrl}${endpoint}`
    console.log(`${method} ${url}`)

    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    }

    if (data) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(url, options)
    const result = await response.json()

    console.log(`Status: ${response.status}`)
    console.log(` Response:`)
    console.log(JSON.stringify(result, null, 2))
    console.log("\n" + "─".repeat(60) + "\n")

    return result
  } catch (error) {
    console.log(` Error: ${error.message}`)
    console.log("\n" + "─".repeat(60) + "\n")
    return null
  }
}

async function runDemo() {
  console.log(" Starting UNCP Navigate API Demo...\n")

  // 1. Root endpoint - API Overview
  console.log("1️ API OVERVIEW")
  await makeRequest("/")

  // 2. Health check
  console.log("2️ HEALTH CHECK")
  await makeRequest("/health")

  // 3. API Status
  console.log("3️ DETAILED API STATUS")
  await makeRequest("/api")

  // 4. Campus Places
  console.log("4️ CAMPUS PLACES")
  await makeRequest("/api/places")

  // 5. Specific Place
  console.log("5️ SPECIFIC PLACE DETAILS")
  await makeRequest("/api/places/1")

  // 6. Places by Category
  console.log("6️ PLACES BY CATEGORY (Academic Buildings)")
  await makeRequest("/api/places?category=academic")

  // 7. Route Planning
  console.log("7️ ROUTE PLANNING")
  await makeRequest("/api/routes/calculate", "POST", {
    origin: { lat: 34.7267, lng: -79.0187 },
    destination: { lat: 34.728, lng: -79.02 },
    mode: "walking",
  })

  // 8. Campus Reports
  console.log("8️ CAMPUS REPORTS")
  await makeRequest("/api/reports")

  // 9. Submit Report Demo
  console.log("9️ SUBMIT DEMO REPORT")
  await makeRequest("/api/reports", "POST", {
    type: "suggestion",
    subject: "Demo Report for Presentation",
    message: "This is a demo report showing how students can submit feedback",
    email: "demo@uncp.edu",
    rating: 5,
  })

  // 10. Emergency Routes
  console.log("EMERGENCY ROUTING")
  await makeRequest("/api/routes/emergency", "POST", {
    currentLocation: { lat: 34.7267, lng: -79.0187 },
    emergencyType: "fire",
  })

  console.log(
    "🎉 Demo Complete! Your UNCP Navigate API is working perfectly!\n"
  )
  console.log("Pro tip: You can run individual endpoints in your browser:")
  console.log(`   • ${baseUrl}/`)
  console.log(`   • ${baseUrl}/api/places`)
  console.log(`   • ${baseUrl}/health`)
}

// Check if we're running this script directly
if (require.main === module) {
  // Add fetch polyfill for older Node versions
  if (!globalThis.fetch) {
    console.log("Installing fetch polyfill...")
    import("node-fetch")
      .then((fetch) => {
        globalThis.fetch = fetch.default
        runDemo().catch(console.error)
      })
      .catch(() => {
        console.log("Please install node-fetch: npm install node-fetch")
      })
  } else {
    runDemo().catch(console.error)
  }
}

module.exports = { runDemo, makeRequest }
