# Configuration Setup for Current PC

## Current PC IP Address: `192.168.29.14`

All hardcoded IP addresses have been updated from the previous laptop to your current PC's IP address.

## ✅ Completed Updates

### 1. **Backend API** (`backend-api/`)
- ✅ Updated `send-custom-notification.js` IP address
- ✅ Server already configured with correct IP in CSP settings
- ✅ Database configuration uses localhost (should work if PostgreSQL is running locally)

### 2. **Mobile App** (`ExpenseTrackerExpo/`)
- ✅ Updated all service files (`transactionService.ts`, `ReminderService.ts`, `LoanService.ts`, `GoalService.ts`, `CreditCardService.ts`, `CategoryService.ts`, `BudgetService.ts`, `AccountService.ts`)
- ✅ Updated utility files (`ApiClient.ts`, `NotificationNavigationService.ts`)
- ✅ Updated all screen files with hardcoded IPs
- ✅ Updated all context files (`AuthContext.tsx`, `NotificationContext.tsx`, `NetworkContext.tsx`, `SimpleTicketContext.tsx`)

### 3. **Admin Panel** (`admin-panel/`)
- ✅ Updated API service files
- ✅ Updated all page files with hardcoded IPs
- ✅ Updated `next.config.js` with correct API URL
- ✅ Updated banner management pages

## 🔧 Required Setup Steps

### 1. **Database Setup**
You need to set up PostgreSQL on your current PC:

```bash
# Install PostgreSQL (if not already installed)
# Create database
createdb expense_tracker_db

# Set up database user and permissions
psql -U postgres
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE expense_tracker_db TO your_username;
```

### 2. **Backend API Environment**
Create a `.env` file in `backend-api/` directory:

```env
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=expense_tracker_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_REFRESH_EXPIRES_IN=7d

# App URLs
MOBILE_APP_URL=http://localhost:19006
ADMIN_PANEL_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3001

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
```

### 3. **Admin Panel Environment**
Create a `.env.local` file in `admin-panel/` directory:

```env
NEXT_PUBLIC_API_URL=http://192.168.29.14:5000/api
```

## 🚀 Running the Applications

### 1. **Start Backend API**
```bash
cd backend-api
npm run dev
# Should start on http://192.168.29.14:5000
```

### 2. **Start Admin Panel**
```bash
cd admin-panel
npm run dev
# Should start on http://localhost:3001
```

### 3. **Start Mobile App**
```bash
cd ExpenseTrackerExpo
npm start
# Should start Expo development server
```

## 🔍 Verification Steps

1. **Test Backend API**: Visit `http://192.168.29.14:5000/api/health` (if health endpoint exists)
2. **Test Admin Panel**: Visit `http://localhost:3001` and try to login
3. **Test Mobile App**: Scan QR code with Expo Go app and test API connectivity

## 📝 Notes

- All IP addresses have been updated from `192.168.1.4` and `192.168.1.2` to `192.168.29.14`
- The admin panel runs on port 3001 to avoid conflicts with the mobile app
- Database should be running on localhost:5432
- Make sure PostgreSQL is installed and running on your PC
- Update the database credentials in the `.env` file with your actual PostgreSQL credentials

## 🔧 Troubleshooting

If you encounter connection issues:
1. Check if PostgreSQL is running: `pg_ctl status`
2. Verify database credentials in `.env` file
3. Check if port 5000 is available for the backend API
4. Ensure firewall allows connections on the required ports
