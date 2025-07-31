@echo off
echo ========================================
echo Watch Party App Installation Script
echo ========================================
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo Download the LTS version and run the installer.
    echo Make sure to check "Add to PATH" during installation.
    echo.
    echo After installing Node.js, run this script again.
    pause
    exit /b 1
)

echo Node.js is installed. Version:
node --version
echo.

echo Checking if npm is available...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available!
    echo Please reinstall Node.js and make sure npm is included.
    pause
    exit /b 1
)

echo npm is available. Version:
npm --version
echo.

echo Installing dependencies...
echo.

echo Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install root dependencies!
    pause
    exit /b 1
)

echo.
echo Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install server dependencies!
    pause
    exit /b 1
)
cd ..

echo.
echo Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install client dependencies!
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo Installation completed successfully!
echo ========================================
echo.
echo To start the application, run:
echo   npm run dev
echo.
echo This will start:
echo   - Backend server on http://localhost:5000
echo   - Frontend React app on http://localhost:3000
echo.
echo Press any key to start the application now...
pause >nul

echo Starting the application...
call npm run dev 