#!/bin/bash

echo ""
echo "Starting UNCP Navigate API Demo Server..."
echo "=========================================="
echo ""

# Build the project
echo "Building TypeScript..."
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo "Build successful!"
echo ""

# Start the server
echo "Starting server on http://localhost:3001"
echo "Demo endpoints:"
echo "   - http://localhost:3001/ (API Overview)"
echo "   - http://localhost:3001/health (Health Check)" 
echo "   - http://localhost:3001/api/places (Campus Places)"
echo "   - Open demo.html in browser for interactive demo"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node dist/app.js