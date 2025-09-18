@echo off
chcp 65001 >nul
🚀 Starting Expense Tracker Backend API in production mode...

REM Check if .env exists
if not exist ".env" (
    echo ❌ .env file not found. Please run setup.bat first.
    pause
    exit /b 1
)

REM Check if dist exists
if not exist "dist" (
    echo 🔨 Building application...
    call npm run build
)

REM Start production server
🔥 Starting production server...
call npm start
