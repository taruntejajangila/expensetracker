sebui# Deployment Guide for ShriCloud Hosting

This guide will help you deploy your Expense Tracker application to your ShriCloud hosting environment.

## Prerequisites

1. Access to your ShriCloud hosting control panel
2. Domain configured (e.g., yourdomain.com)
3. Subdomain for admin panel (e.g., admin.yourdomain.com)
4. Subdomain for API (e.g., api.yourdomain.com)
5. PostgreSQL database (can be hosted on ShriCloud or external service)

## Deployment Steps

### 1. Backend API Deployment

1. **Upload Backend Files**
   - Upload the entire `backend-api` folder to your domain's public_html directory
   - Or create a subdomain `api.yourdomain.com` and upload there

2. **Install Dependencies**
   ```bash
   cd backend-api
   npm install --production
   ```

3. **Configure Environment Variables**
   - Create `.env` file in backend-api directory:
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgres://username:password@host:port/database
   DB_HOST=your-postgres-host
   DB_PORT=5432
   DB_NAME=expense_tracker
   DB_USER=your-postgres-username
   DB_PASSWORD=your-postgres-password
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   FRONTEND_URL=https://yourdomain.com
   ADMIN_PANEL_URL=https://admin.yourdomain.com
   ```

4. **Set up PM2 (if available)**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

5. **Configure Apache/Nginx**
   - Ensure `.htaccess` file is in place
   - Configure virtual host to point to your Node.js application

### 2. Admin Panel Deployment

1. **Build Admin Panel**
   ```bash
   cd admin-panel
   npm install
   npm run build
   ```

2. **Upload Built Files**
   - Upload the `out` folder contents to your admin subdomain directory
   - Ensure `.htaccess` file is in place

3. **Configure Environment Variables**
   - Update `next.config.js` with your production API URL
   - Set `NEXT_PUBLIC_API_URL` to your API endpoint

### 3. Mobile App Configuration

1. **Update API Endpoints**
   - Update `API_BASE_URL` in `mobile-app/src/contexts/AuthContext.tsx`
   - Change from `http://localhost:5000/api` to `https://api.yourdomain.com/api`

2. **Build for Production**
   ```bash
   cd mobile-app
   npm install
   # For Android
   npx expo build:android
   # For iOS
   npx expo build:ios
   ```

### 4. Database Setup

1. **PostgreSQL Configuration**
   - Use ShriCloud's PostgreSQL service or external PostgreSQL database
   - Update connection string in backend `.env` file
   - Run database seeder:
   ```bash
   cd backend-api
   npm run seed
   ```

2. **Create Admin User**
   - Default admin credentials will be created by the seeder
   - Email: admin@expensetracker.com
   - Password: admin123
   - **Change these credentials immediately after deployment!**

### 5. SSL Certificate Setup

1. **Enable SSL**
   - Use ShriCloud's SSL certificate management
   - Enable SSL for all domains and subdomains
   - Force HTTPS redirects

2. **Update CORS Settings**
   - Update CORS configuration in backend to include your production domains

### 6. File Upload Configuration

1. **Upload Directory**
   - Ensure `uploads` directory exists in backend-api
   - Set proper permissions (755)
   - Configure file size limits in server.js

2. **Backup Strategy**
   - Set up regular database backups
   - Configure file upload backups

## Domain Configuration

### Main Domain (yourdomain.com)
- Hosts the mobile app web version (if needed)
- Can be used for landing page

### Admin Subdomain (admin.yourdomain.com)
- Hosts the admin panel
- Protected by authentication
- Used for managing users, expenses, and analytics

### API Subdomain (api.yourdomain.com)
- Hosts the backend API
- Handles all data operations
- Protected by JWT authentication

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use strong, unique JWT secrets
   - Rotate secrets regularly

2. **Database Security**
   - Use strong database passwords
   - Enable database authentication
   - Restrict database access by IP if possible

3. **API Security**
   - Implement rate limiting
   - Use HTTPS for all communications
   - Validate all input data

4. **File Uploads**
   - Validate file types and sizes
   - Scan uploaded files for malware
   - Store uploads outside web root if possible

## Monitoring and Maintenance

1. **Log Monitoring**
   - Set up log rotation
   - Monitor error logs
   - Set up alerts for critical errors

2. **Performance Monitoring**
   - Monitor API response times
   - Track database performance
   - Monitor server resources

3. **Backup Strategy**
   - Daily database backups
   - Weekly file system backups
   - Test backup restoration regularly

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS configuration in backend
   - Ensure all domains are whitelisted

2. **Database Connection Issues**
   - Verify PostgreSQL connection string
   - Check database server status
   - Verify network connectivity

3. **File Upload Issues**
   - Check directory permissions
   - Verify file size limits
   - Check disk space

4. **SSL Certificate Issues**
   - Verify certificate installation
   - Check certificate expiration
   - Ensure proper redirects

### Support

- Check ShriCloud documentation for hosting-specific issues
- Monitor application logs for error details
- Test all functionality after deployment

## Post-Deployment Checklist

- [ ] All domains are accessible via HTTPS
- [ ] Admin panel login works
- [ ] API endpoints respond correctly
- [ ] Database connection is stable
- [ ] File uploads work properly
- [ ] Mobile app can connect to API
- [ ] SSL certificates are valid
- [ ] Backup systems are configured
- [ ] Monitoring is set up
- [ ] Security measures are in place

## Default Credentials

**Admin Panel:**
- Email: admin@expensetracker.com
- Password: admin123

**⚠️ IMPORTANT: Change these credentials immediately after deployment!**
