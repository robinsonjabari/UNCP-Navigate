@echo off
echo.
echo ========================================
echo   UNCP Navigate - Full Stack Startup
echo ========================================
echo.

REM Check if PostgreSQL is running
echo [1/3] Checking PostgreSQL Database...
sc query postgresql-x64-16 >nul 2>&1
if errorlevel 1 (
    echo PostgreSQL service not found or not installed as a service.
    echo Please start PostgreSQL manually or via Docker:
    echo   Docker: docker start uncp-postgres
    echo   Manual: Start pgAdmin or PostgreSQL service
    echo.
    pause
) else (
    sc query postgresql-x64-16 | find "RUNNING" >nul
    if errorlevel 1 (
        echo Starting PostgreSQL service...
        net start postgresql-x64-16
    ) else (
        echo PostgreSQL is already running.
    )
)
echo.

REM Start Backend
echo [2/3] Starting Backend Server (Port 3000)...
echo Installing dependencies if needed...
cd backend
call npm install >nul 2>&1
echo Starting backend in new window...
start "UNCP Backend" cmd /k "npm run dev"
cd ..
echo Backend starting... (wait 5 seconds)
timeout /t 5 /nobreak >nul
echo.

REM Start Frontend
echo [3/3] Starting Frontend Server (Port 3001)...
echo Installing dependencies if needed...
cd frontend
call npm install >nul 2>&1
echo Starting frontend in new window...
start "UNCP Frontend" cmd /k "npm run dev"
cd ..
echo Frontend starting... (wait 3 seconds)
timeout /t 3 /nobreak >nul
echo.

echo ========================================
echo   All Services Started!
echo ========================================
echo.
echo URLs:
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:3001
echo   Health:   http://localhost:3000/health
echo   Places:   http://localhost:3000/api/places
echo.
echo Check the new terminal windows for logs.
echo.
echo To test the API, run:
echo   cd backend
echo   node test-places.js
echo.
pause
