@echo off
echo 🔄 Restarting React development server...
echo.

REM Kill any existing npm processes
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 🧹 Clearing npm cache...
npm start -- --reset-cache

echo.
echo ✅ Development server restarted with fresh cache
echo 🌐 App should be available at: http://localhost:3000
