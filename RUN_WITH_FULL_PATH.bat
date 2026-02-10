@echo off
echo ========================================
echo Patient Portal Setup Script
echo ========================================
echo.

echo Step 1: Installing dependencies...
"C:\Program Files\nodejs\npm.cmd" install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo Step 2: Building the project...
"C:\Program Files\nodejs\npm.cmd" run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build project
    pause
    exit /b 1
)
echo.

echo Step 3: Running database migrations...
"C:\Program Files\nodejs\npm.cmd" run migrate
if %errorlevel% neq 0 (
    echo ERROR: Failed to run migrations
    pause
    exit /b 1
)
echo.

echo Step 4: Seeding initial data...
"C:\Program Files\nodejs\npm.cmd" run seed
if %errorlevel% neq 0 (
    echo ERROR: Failed to seed data
    pause
    exit /b 1
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the server, run:
echo "C:\Program Files\nodejs\npm.cmd" run dev
echo.
echo Or double-click: START_SERVER.bat
echo.
pause
