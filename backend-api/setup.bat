@echo off
chcp 65001 >nul
echo 🚀 Setting up Expense Tracker Backend API...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Visit: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% lss 18 (
    echo ❌ Node.js version 18+ is required. Current version: 
    node --version
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Create necessary directories
echo 📁 Creating directories...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "dist" mkdir dist
if not exist "scripts" mkdir scripts

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Create environment file
if not exist ".env" (
    echo 🔧 Creating .env file...
    copy "env.example" ".env"
    echo ✅ .env file created. Please update it with your database credentials.
) else (
    echo ✅ .env file already exists
)

REM Create TypeScript config
if not exist "tsconfig.json" (
    echo ⚙️ Creating TypeScript configuration...
    (
        echo {
        echo   "compilerOptions": {
        echo     "target": "ES2020",
        echo     "module": "commonjs",
        echo     "lib": ["ES2020"],
        echo     "outDir": "./dist",
        echo     "rootDir": "./src",
        echo     "strict": true,
        echo     "esModuleInterop": true,
        echo     "skipLibCheck": true,
        echo     "forceConsistentCasingInFileNames": true,
        echo     "resolveJsonModule": true,
        echo     "declaration": true,
        echo     "declarationMap": true,
        echo     "sourceMap": true,
        echo     "removeComments": true,
        echo     "noImplicitAny": true,
        echo     "strictNullChecks": true,
        echo     "strictFunctionTypes": true,
        echo     "noImplicitThis": true,
        echo     "noImplicitReturns": true,
        echo     "noFallthroughCasesInSwitch": true,
        echo     "moduleResolution": "node",
        echo     "baseUrl": "./",
        echo     "paths": {
        echo       "@/*": ["src/*"]
        echo     },
        echo     "allowSyntheticDefaultImports": true,
        echo     "experimentalDecorators": true,
        echo     "emitDecoratorMetadata": true
        echo   },
        echo   "include": [
        echo     "src/**/*"
        echo   ],
        echo   "exclude": [
        echo     "node_modules",
        echo     "dist",
        echo     "**/*.test.ts"
        echo   ]
        echo }
    ) > tsconfig.json
    echo ✅ TypeScript configuration created
)

REM Create nodemon config
if not exist "nodemon.json" (
    echo 🔄 Creating nodemon configuration...
    (
        echo {
        echo   "watch": ["src"],
        echo   "ext": "ts,js,json",
        echo   "ignore": ["src/**/*.spec.ts"],
        echo   "exec": "ts-node ./src/server.ts"
        echo }
    ) > nodemon.json
    echo ✅ Nodemon configuration created
)

REM Create start script
echo ▶️ Creating start script...
(
    echo @echo off
        echo chcp 65001 ^>nul
        echo 🚀 Starting Expense Tracker Backend API...
        echo.
        echo REM Check if .env exists
        echo if not exist ".env" ^(
        echo     echo ❌ .env file not found. Please run setup.bat first.
        echo     pause
        echo     exit /b 1
        echo ^)
        echo.
        echo REM Check if node_modules exists
        echo if not exist "node_modules" ^(
        echo     echo 📦 Installing dependencies...
        echo     call npm install
        echo ^)
        echo.
        echo REM Start development server
        echo 🔥 Starting development server...
        echo call npm run dev
) > start.bat

REM Create production start script
echo 🚀 Creating production start script...
(
    echo @echo off
        echo chcp 65001 ^>nul
        echo 🚀 Starting Expense Tracker Backend API in production mode...
        echo.
        echo REM Check if .env exists
        echo if not exist ".env" ^(
        echo     echo ❌ .env file not found. Please run setup.bat first.
        echo     pause
        echo     exit /b 1
        echo ^)
        echo.
        echo REM Check if dist exists
        echo if not exist "dist" ^(
        echo     echo 🔨 Building application...
        echo     call npm run build
        echo ^)
        echo.
        echo REM Start production server
        echo 🔥 Starting production server...
        echo call npm start
) > start-prod.bat

echo.
echo 🎉 Setup complete! Here's what to do next:
echo.
echo 1. 📝 Update .env file with your database credentials:
echo    - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
echo    - JWT_SECRET (generate a strong random string)
echo.
echo 2. 🗄️ Set up your database:
echo    - Install PostgreSQL or use Docker
echo    - Create database: expense_tracker_db
echo    - Run schema: database/schema.sql
echo.
echo 3. 🚀 Start the development server:
echo    - Run: start.bat
echo    - Or: npm run dev
echo.
echo 4. 🔨 Build for production:
echo    - Run: npm run build
echo    - Then: start-prod.bat
echo.
echo 📚 API Documentation: http://localhost:5000/api
echo 🏥 Health Check: http://localhost:5000/health
echo.
echo Happy coding! 🚀✨
pause
