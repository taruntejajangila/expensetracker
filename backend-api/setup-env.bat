@echo off
echo Creating environment configuration for Expense Tracker API...

echo NODE_ENV=development > .env
echo PORT=5000 >> .env
echo. >> .env
echo # Database Configuration >> .env
echo DB_HOST=localhost >> .env
echo DB_PORT=5432 >> .env
echo DB_NAME=expense_tracker_db >> .env
echo DB_USER=postgres >> .env
echo DB_PASSWORD=Tarun123@ >> .env
echo. >> .env
echo # JWT Configuration >> .env
echo JWT_SECRET=your_super_secret_jwt_key_here_change_in_production >> .env
echo JWT_EXPIRES_IN=24h >> .env
echo JWT_REFRESH_SECRET=your_refresh_token_secret_here >> .env
echo JWT_REFRESH_EXPIRES_IN=7d >> .env
echo. >> .env
echo # App URLs >> .env
echo MOBILE_APP_URL=http://localhost:19006 >> .env
echo ADMIN_PANEL_URL=http://localhost:3001 >> .env
echo FRONTEND_URL=http://localhost:3001 >> .env
echo. >> .env
echo # File Upload Configuration >> .env
echo MAX_FILE_SIZE=5242880 >> .env
echo UPLOAD_PATH=./uploads >> .env
echo ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf >> .env

echo.
echo ✅ Environment file created successfully!
echo 📁 File location: backend-api\.env
echo.
echo 🚀 You can now start the server with: npm run dev
echo.
pause
