# OPTW System - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- XAMPP installed (Apache + MySQL)
- Node.js and npm installed
- Modern web browser

### Setup Steps

#### 1. Database Setup
```bash
# Start XAMPP
# Open phpMyAdmin: http://localhost/phpmyadmin
# Create database: optw_system
# Import: optw_system.sql
```

#### 2. Backend Setup (PHP)
```bash
# Files are already in place at:
# c:\xampp\htdocs\optw_system\api\
# 
# Verify config.php settings:
# - host: localhost
# - dbname: optw_system
# - username: root
# - password: (empty)
```

#### 3. Frontend Setup (React)
```bash
# Navigate to project directory
cd c:\xampp\htdocs\optw_system

# Install dependencies
npm install

# Start development server
npm start
```

#### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost/optw_system/api/
- **phpMyAdmin**: http://localhost/phpmyadmin

## 👤 Test Accounts

### Admin Account
- **Email**: shalom@gmail.com
- **Password**: 12345
- **Access**: Full admin dashboard

### Create New Club Account
1. Go to http://localhost:3000/signup
2. Fill in:
   - Name: Your Name
   - Email: your@email.com
   - Password: password123
   - Role: Club
3. Click Signup
4. Login with your credentials

## 📱 Application Structure

```
optw_system/
├── api/                          # PHP Backend
│   ├── config.php               # Database configuration
│   ├── login.php                # Login endpoint
│   ├── signup.php               # Signup endpoint
│   ├── dashboard_stats.php      # Dashboard statistics
│   ├── recent_transfers.php     # Recent transfers
│   └── pending_clubs.php        # Club approvals
│
├── src/                         # React Frontend
│   ├── pages/
│   │   ├── Login.jsx           # Login page
│   │   ├── Signup.jsx          # Signup page
│   │   ├── AdminDashboard.jsx  # Admin dashboard
│   │   └── Dashboard.jsx       # Club dashboard
│   ├── services/
│   │   └── api.js              # API service layer
│   └── App.jsx                 # Main app component
│
└── optw_system.sql             # Database schema
```

## 🎯 Key Features

### For Admin Users
✅ View system statistics
✅ Monitor recent transfers
✅ Approve/reject club registrations
✅ Access all management sections

### For Club Users
✅ Register and login
✅ Access club dashboard
✅ Manage players
✅ Initiate transfers

## 🔧 Common Tasks

### Add New Admin User
```sql
INSERT INTO users (name, email, password, role, status) 
VALUES ('Admin Name', 'admin@email.com', '12345', 'admin', 'active');
```

### Add Test Data

**Add a Club:**
```sql
INSERT INTO clubs (user_id, club_name, country, manager, contact, status) 
VALUES (1, 'Test FC', 'Rwanda', 'Manager Name', '+250788123456', 'approved');
```

**Add a Player:**
```sql
INSERT INTO players (club_id, name, age, nationality, position, market_value, status) 
VALUES (1, 'Player Name', 25, 'Rwanda', 'Forward', 1000000.00, 'active');
```

**Add a Transfer:**
```sql
INSERT INTO transfers (player_id, seller_club_id, buyer_club_id, type, amount, status) 
VALUES (1, 1, 2, 'Permanent', 500000.00, 'pending');
```

## 🐛 Troubleshooting

### Issue: Cannot connect to database
**Solution:**
1. Start XAMPP Apache and MySQL
2. Check `api/config.php` credentials
3. Verify database exists in phpMyAdmin

### Issue: CORS errors in browser
**Solution:**
- PHP files already have CORS headers
- Check browser console for specific error
- Verify API URL in `src/services/api.js`

### Issue: Login not working
**Solution:**
1. Check database has user data
2. Verify email and password are correct
3. Check browser console for errors
4. Test API endpoint directly: http://localhost/optw_system/api/login.php

### Issue: Dashboard shows zero stats
**Solution:**
1. Add test data to database
2. Check API endpoints are working
3. View network tab in browser DevTools

## 📚 Documentation Files

- `LOGIN_SETUP.md` - Login/Signup system details
- `ADMIN_DASHBOARD_GUIDE.md` - Complete dashboard documentation
- `README.md` - Project overview

## 🔐 Security Notes

⚠️ **Current Implementation**: Passwords are stored in plain text for development

**For Production:**
1. Hash passwords using `password_hash()` in PHP
2. Update login to use `password_verify()`
3. Add JWT tokens for authentication
4. Implement HTTPS
5. Add input sanitization
6. Enable CSRF protection

## 📞 Support

For issues or questions:
1. Check documentation files
2. Review browser console errors
3. Check PHP error logs in XAMPP
4. Verify database structure matches SQL file

## 🎉 Next Steps

1. ✅ Login as admin
2. ✅ Explore the dashboard
3. ✅ Add test clubs and players
4. ✅ Create sample transfers
5. ✅ Test approval workflow
6. 🚀 Build additional features!

---

**Happy Coding! 🚀**
