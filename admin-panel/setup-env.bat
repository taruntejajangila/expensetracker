@echo off
echo Creating environment configuration for Admin Panel...

echo NEXT_PUBLIC_API_URL=http://192.168.29.14:5000/api > .env.local

echo.
echo ✅ Environment file created successfully!
echo 📁 File location: admin-panel\.env.local
echo.
echo 🚀 You can now start the admin panel with: npm run dev
echo.
pause
