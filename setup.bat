@echo off
echo Setting up MT5 React Frontend...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js is installed
cmd /c node --version

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo npm is not available!
    pause
    exit /b 1
)

echo npm is available
cmd /c npm --version
echo.

echo Installing dependencies...
cmd /c npm install

if %errorlevel% neq 0 (
    echo Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Setup completed successfully!
echo.
echo Available commands:
echo   npm start     - Start development server
echo   npm run build - Build for production
echo   npm test      - Run tests
echo.
echo The app will be available at: http://localhost:3000
echo Make sure MT5 server is running at: http://localhost:8000
echo.
echo Press any key to start the development server...
pause >nul

echo.
echo Starting development server...
cmd /c npm start