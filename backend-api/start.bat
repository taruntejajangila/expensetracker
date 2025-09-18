@echo off
chcp 65001 >nul
🚀 Starting Expense Tracker Backend API...

REM Check if .env exists
if not exist ".env" (
    echo ❌ .env file not found. Please run setup.bat first.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
)

REM Start development server
🔥 Starting development server...
call npm run dev
