@echo off
echo.
echo Starting UNCP Navigate API Demo Server...
echo ==========================================
echo.

REM Build the project
echo Building TypeScript...
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo Build successful!
echo.

REM Start the server
echo Starting server on http://localhost:3001
echo Demo endpoints:
echo    - http://localhost:3001/ (API Overview)
echo    - http://localhost:3001/health (Health Check)
echo    - http://localhost:3001/api/places (Campus Places)
echo    - Open demo.html in browser for interactive demo
echo.
echo Press Ctrl+C to stop the server
echo.

node dist/app.js