// Simple API Test Script
// Run this with: node test-api.js (make sure your server is running first)

const https = require("http")

const BASE_URL = "http://localhost:5000"

// Test function
async function testEndpoint(path, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 5000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    }

    const req = https.request(options, (res) => {
      let body = ""
      res.on("data", (chunk) => {
        body += chunk
      })
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body,
        })
      })
    })

    req.on("error", (err) => {
      reject(err)
    })

    if (data) {
      req.write(JSON.stringify(data))
    }
    req.end()
  })
}

// Run tests
async function runTests() {
  console.log("🧪 Testing UNCP Navigate Backend API...\n")

  try {
    // Test 1: Basic health check
    console.log("1. Testing basic health check...")
    const healthCheck = await testEndpoint("/")
    console.log(`   Status: ${healthCheck.status}`)
    console.log(`   Response: ${healthCheck.body}\n`)

    // Test 2: API status
    console.log("2. Testing API status...")
    const statusCheck = await testEndpoint("/api/status")
    console.log(`   Status: ${statusCheck.status}`)
    console.log(`   Response: ${statusCheck.body}\n`)

    // Test 3: User registration
    console.log("3. Testing user registration...")
    const registerData = {
      email: "test@uncp.edu",
      password: "TestPassword123!",
      firstName: "John",
      lastName: "Doe",
      role: "student",
    }
    const registerResponse = await testEndpoint(
      "/api/auth/register",
      "POST",
      registerData
    )
    console.log(`   Status: ${registerResponse.status}`)
    console.log(`   Response: ${registerResponse.body}\n`)

    // Test 4: User login
    console.log("4. Testing user login...")
    const loginData = {
      email: "test@uncp.edu",
      password: "TestPassword123!",
    }
    const loginResponse = await testEndpoint(
      "/api/auth/login",
      "POST",
      loginData
    )
    console.log(`   Status: ${loginResponse.status}`)
    console.log(`   Response: ${loginResponse.body}\n`)

    console.log("✅ API Testing Complete!")
  } catch (error) {
    console.error("❌ Test failed:", error.message)
    console.log("\n💡 Make sure your server is running with: node dist/app.js")
  }
}

runTests()
