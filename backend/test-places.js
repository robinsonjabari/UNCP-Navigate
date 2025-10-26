// Test Places API endpoints
// Run with: node test-places.js

const http = require("http")

const BASE_URL = "http://localhost:3000"

// Helper function to make HTTP requests
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    http
      .get(url, (res) => {
        let data = ""
        res.on("data", (chunk) => {
          data += chunk
        })
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data)
            resolve({ status: res.statusCode, data: parsed })
          } catch (e) {
            resolve({ status: res.statusCode, data })
          }
        })
      })
      .on("error", (err) => reject(err))
  })
}

// Test functions
async function testGetAllPlaces() {
  console.log("\n Test 1: Get All Places")
  console.log("===============================")
  try {
    const result = await makeRequest("/api/places")
    console.log(`Status: ${result.status}`)
    console.log(
      `Total places: ${
        result.data.pagination?.total || result.data.places?.length
      }`
    )
    console.log(`Places returned: ${result.data.places?.length || 0}`)

    if (result.data.places && result.data.places.length > 0) {
      console.log("\nFirst 3 buildings:")
      result.data.places.slice(0, 3).forEach((place, i) => {
        console.log(`  ${i + 1}. ${place.name} (${place.category})`)
        console.log(
          `     Location: ${place.coordinates.lat}, ${place.coordinates.lng}`
        )
      })
    }
  } catch (error) {
    console.error("❌ Error:", error.message)
  }
}

async function testGetPlacesByCategory() {
  console.log("\n Test 2: Get Academic Buildings")
  console.log("===============================")
  try {
    const result = await makeRequest("/api/places?category=academic")
    console.log(`Status: ${result.status}`)
    console.log(
      `Academic buildings: ${
        result.data.pagination?.total || result.data.places?.length
      }`
    )

    if (result.data.places && result.data.places.length > 0) {
      console.log("\nAcademic buildings:")
      result.data.places.forEach((place, i) => {
        console.log(`  ${i + 1}. ${place.name}`)
      })
    }
  } catch (error) {
    console.error("❌ Error:", error.message)
  }
}

async function testSearchPlaces() {
  console.log("\n Test 3: Search for 'Library'")
  console.log("===============================")
  try {
    const result = await makeRequest("/api/places?search=library")
    console.log(`Status: ${result.status}`)
    console.log(
      `Results: ${result.data.pagination?.total || result.data.places?.length}`
    )

    if (result.data.places && result.data.places.length > 0) {
      result.data.places.forEach((place, i) => {
        console.log(`  ${i + 1}. ${place.name}`)
      })
    }
  } catch (error) {
    console.error("❌ Error:", error.message)
  }
}

async function testNearbyPlaces() {
  console.log("\n Test 4: Find Places Near Old Main")
  console.log("===============================")
  console.log("Searching within 0.3km of Old Main (34.6889, -79.1999)")
  try {
    const result = await makeRequest(
      "/api/places/nearby/34.6889/-79.1999?radius=0.3"
    )
    console.log(`Status: ${result.status}`)

    const places = result.data.places || result.data
    if (Array.isArray(places)) {
      console.log(`Nearby places found: ${places.length}`)

      if (places.length > 0) {
        console.log("\nNearby buildings:")
        places.forEach((place, i) => {
          console.log(`  ${i + 1}. ${place.name}`)
          console.log(`     Distance: ${place.distance} km`)
          console.log(`     Category: ${place.category}`)
        })
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message)
  }
}

async function testGetSinglePlace() {
  console.log("\n Test 5: Get First Place by ID")
  console.log("===============================")
  try {
    const allPlaces = await makeRequest("/api/places?limit=1")
    if (allPlaces.data.places && allPlaces.data.places.length > 0) {
      const firstPlace = allPlaces.data.places[0]
      console.log(`Getting details for: ${firstPlace.name}`)

      const result = await makeRequest(`/api/places/${firstPlace.id}`)
      console.log(`Status: ${result.status}`)

      const place = result.data.place || result.data
      if (place) {
        console.log("\nPlace Details:")
        console.log(`  Name: ${place.name}`)
        console.log(`  Description: ${place.description}`)
        console.log(`  Category: ${place.category}`)
        console.log(`  Address: ${place.address}`)
        console.log(
          `  Coordinates: ${place.coordinates.lat}, ${place.coordinates.lng}`
        )
        console.log(`  Accessibility: ${place.accessibility ? "Yes" : "No"}`)
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message)
  }
}

// Run all tests
async function runAllTests() {
  console.log(" Testing UNCP Navigate Places API")
  console.log("===================================")
  console.log("Make sure your backend is running on port 3000!")

  await testGetAllPlaces()
  await testGetPlacesByCategory()
  await testSearchPlaces()
  await testNearbyPlaces()
  await testGetSinglePlace()

  console.log("\n All tests completed!")
  console.log("\n Next steps:")
  console.log("   - Test the frontend at http://localhost:3001")
  console.log("   - Try the 'Test API' button to see if places load")
  console.log("   - Check nearby places with different coordinates")
}

process.on("unhandledRejection", (error) => {
  console.error("\n❌ Unhandled error:", error.message)
  console.log("\n Is your backend running? Try: npm run dev")
  process.exit(1)
})

runAllTests()
