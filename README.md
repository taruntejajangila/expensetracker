# Expense Tracker Application

A comprehensive expense tracking application with admin panel, backend API, and mobile app, designed for ShriCloud hosting environment.

## 🚀 Features

### 📱 Mobile App (React Native/Expo)
- **User Authentication**: Secure login and registration
- **Expense Tracking**: Add, edit, and delete expenses
- **Income Tracking**: Track income sources
- **Category Management**: Organize expenses by categories
- **Receipt Capture**: Photo capture for receipts
- **Offline Support**: Work without internet connection
- **Push Notifications**: Real-time updates
- **Modern UI**: Clean, intuitive interface

### 🖥️ Admin Panel (Next.js/React)
- **Dashboard**: Overview of users, expenses, and analytics
- **User Management**: Manage user accounts and permissions
- **Expense Management**: View and manage all expenses
- **Category Management**: Create and manage expense categories
- **Analytics**: Detailed reports and charts
- **Real-time Data**: Live updates and statistics

### 🔧 Backend API (Node.js/Express)
- **RESTful API**: Complete API for all operations
- **Authentication**: JWT-based authentication
- **Database**: PostgreSQL with Sequelize ODM
- **File Upload**: Receipt and document handling
- **Security**: Rate limiting, CORS, input validation
- **Email Notifications**: Automated notifications

## 📁 Project Structure

```
ExpenseTracker/
├── admin-panel/          # Next.js admin dashboard (Port 3001)
├── backend-api/          # Node.js/Express API server (Port 5000)
├── mobile-app/           # React Native/Expo mobile app
├── shared/               # Shared utilities and types
├── docs/                 # Documentation
├── deploy.md             # Deployment guide for ShriCloud
└── README.md             # This file
```

## 🛠️ Technology Stack

### Backend API
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize
- **Authentication**: JWT tokens
- **Validation**: express-validator
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate Limiting

### Admin Panel
- **Framework**: Next.js 14
- **UI Library**: Material-UI (MUI)
- **Charts**: Recharts
- **Forms**: React Hook Form with Yup validation
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS

### Mobile App
- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **Forms**: React Hook Form with Yup validation
- **HTTP Client**: Axios
- **Storage**: AsyncStorage
- **Icons**: Expo Vector Icons

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Expo CLI (for mobile development)
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ExpenseTracker
```

### 2. Backend API Setup
```bash
cd backend-api
npm install
cp env.example .env
# Edit .env with your configuration
npm run seed  # Seed default categories and admin user
npm run dev   # Start development server
```

### 3. Admin Panel Setup
```bash
cd admin-panel
npm install
cp env.local.example .env.local
# Edit .env.local with your API URL
npm run dev   # Start development server (Port 3001)
```

### 4. Mobile App Setup
```bash
cd mobile-app
npm install
# Update API_BASE_URL in src/contexts/AuthContext.tsx
npm start     # Start Expo development server
```

## 🔧 Configuration

### Environment Variables

#### Backend API (.env)
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgres://postgres:password@localhost:5432/expense_tracker
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
ADMIN_PANEL_URL=http://localhost:3001
```

#### Admin Panel (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_ADMIN_PANEL_URL=http://localhost:3001
```

### Database Setup
The application will automatically create the necessary collections and seed default data when you run:
```bash
npm run seed
```

## 📱 Mobile App Features

### Authentication
- User registration and login
- Secure token-based authentication
- Password validation and security

### Expense Management
- Add expenses with categories
- Edit and delete expenses
- Photo capture for receipts
- Offline data synchronization

### Categories
- Pre-defined expense categories
- Custom category creation
- Visual category icons and colors

### Analytics
- Monthly expense summaries
- Category-wise spending analysis
- Income vs expense tracking

## 🖥️ Admin Panel Features

### Dashboard
- User statistics and overview
- Recent activity monitoring
- Expense trends and analytics
- System health monitoring

### User Management
- View all registered users
- Edit user profiles and permissions
- Deactivate/activate user accounts
- User activity tracking

### Expense Management
- View all expenses across users
- Filter and search expenses
- Export expense data
- Bulk operations

### Category Management
- Create and manage categories
- Set category budgets
- Visual category management
- Default category seeding

### Analytics
- Interactive charts and graphs
- Revenue and expense trends
- Category performance analysis
- Custom date range reports

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: Comprehensive input validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Cross-origin resource sharing security
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

## 🚀 Deployment

### ShriCloud Hosting
This application is specifically configured for ShriCloud hosting environment. See [deploy.md](deploy.md) for detailed deployment instructions.

### Key Deployment Points
1. **Backend API**: Deploy to api.yourdomain.com
2. **Admin Panel**: Deploy to admin.yourdomain.com  
3. **Mobile App**: Build and distribute via app stores
4. **Database**: Configure PostgreSQL connection
5. **SSL**: Enable HTTPS for all domains

## 📊 Default Credentials

**Admin Panel:**
- Email: admin@expensetracker.com
- Password: admin123

⚠️ **Important**: Change these credentials immediately after deployment!

## 🧪 Testing

### Backend API
```bash
cd backend-api
npm test
```

### Admin Panel
```bash
cd admin-panel
npm test
```

### Mobile App
```bash
cd mobile-app
npm test
```

## 📈 Performance

- **Backend**: Optimized database queries with indexing
- **Frontend**: Code splitting and lazy loading
- **Mobile**: Optimized for smooth 60fps performance
- **Caching**: Intelligent caching strategies

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Expenses
- `GET /api/expenses` - Get user expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Categories
- `GET /api/categories` - Get categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/expenses` - Get all expenses
- `GET /api/admin/analytics` - Analytics data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the deployment guide
- Open an issue on GitHub

## 🔮 Roadmap

- [ ] Advanced analytics and reporting
- [ ] Multi-currency support
- [ ] Budget management
- [ ] Recurring expenses
- [ ] Data export/import
- [ ] Advanced notifications
- [ ] Team/family expense sharing
- [ ] Integration with banking APIs

---

**Built with ❤️ for efficient expense tracking**
