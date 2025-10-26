@echo off
echo.
echo ========================================
echo   UNCP Navigate - Shutdown
echo ========================================
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo All services stopped.
echo.
echo To stop PostgreSQL (optional):
echo   net stop postgresql-x64-16
echo   OR: docker stop uncp-postgres
echo.
pause
