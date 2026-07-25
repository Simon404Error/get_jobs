@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"
title Get Jobs - Setup

echo ========================================
echo   Get Jobs - One-Click Setup
echo ========================================
echo.

:: --- Check Java ---
echo [1/5] Checking Java...
java -version 2>&1 | findstr /i "version" >nul
if %errorlevel% neq 0 (
    echo   ERROR: Java not found. Install JDK 21+
    echo   https://adoptium.net/
    pause & exit /b 1
)
for /f "tokens=3 delims= " %%v in ('java -version 2^>^&1 ^| findstr /i "version"') do echo   Java %%v - OK

:: --- Check Node.js ---
echo [2/5] Checking Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo   ERROR: Node.js not found. Install Node.js 18+
    echo   https://nodejs.org/
    pause & exit /b 1
)
for /f %%v in ('node -v') do echo   Node.js %%v - OK

:: --- Install pnpm if needed ---
echo [3/5] Checking pnpm...
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo   Installing pnpm...
    call npm install -g pnpm
    if %errorlevel% neq 0 (
        echo   ERROR: Failed to install pnpm
        pause & exit /b 1
    )
)
echo   pnpm found - OK

:: --- Frontend dependencies ---
echo.
echo [4/5] Installing frontend dependencies...
cd front
set CI=true
call pnpm install
if %errorlevel% neq 0 (
    echo   ERROR: pnpm install failed
    cd ..
    pause & exit /b 1
)
cd ..
echo   Done.

:: --- Build backend ---
echo.
echo [5/5] Building backend (one-time, may take 2-3 minutes)...
call gradlew.bat build -x test
if %errorlevel% neq 0 (
    echo   ERROR: Build failed
    pause & exit /b 1
)
echo   Done.

echo.
echo ========================================
echo   Setup complete!
echo   Double-click start.bat to launch.
echo ========================================
pause
