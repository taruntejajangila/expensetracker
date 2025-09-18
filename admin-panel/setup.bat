@echo off
echo 🚀 Setting up Mobile App Admin Panel...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% equ 0 (
    echo ✅ Dependencies installed successfully!
) else (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Create .env.local if it doesn't exist
if not exist .env.local (
    echo 🔧 Creating .env.local file...
    (
        echo # App Configuration
        echo NEXT_PUBLIC_APP_NAME="Mobile App Admin"
        echo NEXT_PUBLIC_API_URL="http://localhost:8000/api"
        echo.
        echo # Database ^(if using external DB^)
        echo # DATABASE_URL="your-database-url"
        echo.
        echo # Authentication
        echo # JWT_SECRET="your-jwt-secret"
    ) > .env.local
    echo ✅ .env.local file created!
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo To start the admin panel:
echo   npm run dev
echo.
echo Then open: http://localhost:3000
echo.
echo Happy coding! 🚀
pause
