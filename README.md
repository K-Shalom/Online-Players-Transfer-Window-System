# OPTW System - Online Players Transfer Window

A comprehensive web-based platform for managing football player transfers between clubs with advanced features for administrators, clubs, and players.

## Project Description

The **Online Players Transfer Window (OPTW)** is a sophisticated transfer management system designed to streamline the complex process of player transfers between football clubs. The platform serves as a centralized hub where clubs can register, list players, initiate transfer negotiations, and complete transactions under administrative oversight.

### System Overview

**Administrators** oversee the entire transfer process, approving new club registrations and ensuring that all transfers comply with regulations (such as age limits, player quotas, and transfer deadlines). Admins can also temporarily close the transfer window, preventing new offers after a specified deadline.

**Players** are automatically notified when transfer negotiations involve them, and both clubs receive system notifications and emails when a transfer is completed or rejected. Clubs can also maintain a wishlist of desired players to track availability during future windows.

The platform includes a **reporting and analytics module**, generating insights such as most transferred players, total transfer value by club, nationality distribution, and top-performing clubs by transfer success rate. 

**Fraud detection mechanisms** flag suspicious activities such as duplicate player profiles, inflated values, or multiple bids from the same club for the same player.

This project integrates a **PHP backend** (no frameworks, traditional approach) and a **React.js frontend**, connected via HTTP requests and AJAX calls. Security, validation, and data integrity are crucial throughout the system.

## Key Features

### Authentication & Authorization
- User registration and login with email validation
- Role-based access control (Admin/Club)
- Session management with localStorage
- Protected routes and secure navigation

### Admin Dashboard
- Real-time statistics (clubs, players, transfers, approvals)
- Recent transfers monitoring with status tracking
- Pending club approvals with one-click actions
- Quick navigation sidebar
- Transfer window control (open/close)

### Players Management
- Complete CRUD operations
- Detailed player profiles (age, nationality, position, market value)
- Health status tracking (fit/injured/recovering)
- Contract management with end dates
- Player availability status
- Automatic notifications for transfer negotiations

### Clubs Management
- Club registration with approval workflow
- Complete CRUD operations
- Status filtering (pending/approved)
- License number management
- Club wishlist for desired players
- Player quota enforcement

### Transfers Management
- Transfer creation and tracking
- Multi-stage approval workflow (pending → negotiation → accepted → completed)
- Transfer types (Permanent/Loan/Free)
- Amount tracking and validation
- Automatic player club updates on completion
- Email notifications to both clubs
- Transfer deadline enforcement
- Fraud detection for suspicious activities

### Reports & Analytics
- Most transferred players
- Total transfer value by club
- Nationality distribution analysis
- Top-performing clubs by transfer success rate
- Financial overview and trends
- Export capabilities (PDF/Excel ready)

### Notifications & Messaging
- System notifications for transfer events
- Email notifications for completed/rejected transfers
- Player notifications for negotiations
- Admin alerts for suspicious activities

### Fraud Detection
- Duplicate player profile detection
- Inflated value flagging
- Multiple bid detection from same club
- Suspicious activity monitoring

### Additional Features
- Dark/Light mode toggle
- Responsive design (mobile, tablet, desktop)
- Player wishlist management
- Transfer window deadline control
- Age limit and quota validation

## Tech Stack

### Frontend
- React 18
- Vite
- Material-UI (MUI)
- React Router
- Axios

### Backend
- PHP 8.2
- MySQL (MariaDB)
- RESTful API architecture

### Development Tools
- XAMPP (Apache + MySQL)
- Node.js & npm

## How to run (Windows)
1. Install Node.js (if you haven't):

   Recommended (fast):
   ```powershell
   winget install --id OpenJS.NodeJS.LTS -e
   ```

   Or install via nvm-for-windows (if you want multiple Node versions):
   ```powershell
   winget install --id CoreyButler.NVMforWindows -e
   # then in a new shell:
   nvm install lts
   nvm use lts
   ```

2. From the project root, install dependencies and run dev server:

   ```powershell
   npm install
   npm run dev
   ```

3. Open the printed local URL (usually http://localhost:5173).

Notes:
- If `node`/`npm` are not recognized after install, restart PowerShell or your machine.
- This is a starter UI — connect `src/services/api.js` to your backend API.

## 📁 Project Structure

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
├── optw_system.sql             # Database schema
├── QUICK_START.md              # Quick start guide
├── LOGIN_SETUP.md              # Login system docs
└── ADMIN_DASHBOARD_GUIDE.md    # Dashboard docs
```

## 🚀 Quick Start

See **[QUICK_START.md](QUICK_START.md)** for detailed setup instructions.

### Quick Setup
1. Start XAMPP (Apache + MySQL)
2. Import `optw_system.sql` to phpMyAdmin
3. Run `npm install` and `npm start`
4. Login with: shalom@gmail.com / 12345

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Complete setup guide
- **[LOGIN_SETUP.md](LOGIN_SETUP.md)** - Authentication system details
- **[ADMIN_DASHBOARD_GUIDE.md](ADMIN_DASHBOARD_GUIDE.md)** - Dashboard documentation

## 🔐 Default Credentials

**Admin Account:**
- Email: shalom@gmail.com
- Password: 12345

## 🎯 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/login.php` | POST | User authentication |
| `/api/signup.php` | POST | User registration |
| `/api/dashboard_stats.php` | GET | Dashboard statistics |
| `/api/recent_transfers.php` | GET | Recent transfers list |
| `/api/pending_clubs.php` | GET/POST | Club approvals |

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📱 Screenshots

### Admin Dashboard
- Real-time statistics cards
- Recent transfers table
- Pending club approvals
- Responsive sidebar navigation

## ⚠️ Security Note

Current implementation uses plain text passwords for development. For production:
- Implement password hashing with `password_hash()`
- Add JWT token authentication
- Enable HTTPS
- Add input sanitization
- Implement CSRF protection

## 🤝 Contributing

This is a school/learning project for managing football player transfers.

## 📄 License

Educational project - OPTW System

---

**Built with ❤️ using React, PHP, and MySQL**
