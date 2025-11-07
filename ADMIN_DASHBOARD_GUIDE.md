# Admin Dashboard Guide

## Overview
The Admin Dashboard is a comprehensive control panel for managing the Online Players Transfer Window (OPTW) system. It provides real-time statistics, transfer monitoring, and club approval management.

## Features

### 1. **Dashboard Statistics**
Four key metrics displayed in cards:
- **Total Clubs**: Number of registered clubs in the system
- **Total Players**: Number of active players
- **Active Transfers**: Ongoing transfer negotiations and pending transfers
- **Pending Approvals**: Clubs waiting for admin approval

Each stat card shows:
- Current value
- Trend indicator (percentage change from last month)
- Color-coded icon

### 2. **Recent Transfers Table**
Displays the 10 most recent transfers with:
- Player name
- Source club (From)
- Destination club (To)
- Transfer amount
- Status (completed, pending, negotiation)

Status is color-coded:
- 🟢 **Green (Success)**: Completed transfers
- 🟡 **Yellow (Warning)**: Pending transfers
- 🔵 **Blue (Info)**: In negotiation

### 3. **Pending Club Approvals**
Side panel showing clubs awaiting approval with:
- Club name
- Manager name
- Country
- Action buttons (Approve/Reject)

### 4. **Navigation Sidebar**
Quick access to:
- 📊 Dashboard
- 👥 Clubs
- ⚽ Players
- 🔄 Transfers
- 📈 Reports
- ⚙️ Settings
- 🚪 Logout

## API Endpoints

### Dashboard Statistics
**Endpoint:** `GET /api/dashboard_stats.php`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalClubs": 45,
    "totalPlayers": 1250,
    "activeTransfers": 23,
    "pendingApprovals": 8
  }
}
```

### Recent Transfers
**Endpoint:** `GET /api/recent_transfers.php`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "player": "John Doe",
      "from": "Club A",
      "to": "Club B",
      "amount": "$2.50",
      "status": "completed",
      "type": "Permanent",
      "date": "2025-11-07 10:30:00"
    }
  ]
}
```

### Pending Clubs
**Endpoint:** `GET /api/pending_clubs.php`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "FC Barcelona Rwanda",
      "country": "Rwanda",
      "manager": "John Manager",
      "contact": "+250788123456",
      "license_no": "LIC-001",
      "created_at": "2025-11-07 09:00:00"
    }
  ]
}
```

### Approve Club
**Endpoint:** `POST /api/pending_clubs.php`

**Request Body:**
```json
{
  "club_id": 1,
  "action": "approve"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Club approved successfully"
}
```

### Reject Club
**Endpoint:** `POST /api/pending_clubs.php`

**Request Body:**
```json
{
  "club_id": 1,
  "action": "reject"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Club rejected successfully"
}
```

## User Interface

### Color Scheme
- **Primary Blue**: `#1976d2` - Main theme color
- **Success Green**: `#2e7d32` - Positive actions/stats
- **Warning Orange**: `#ed6c02` - Pending items
- **Error Red**: `#d32f2f` - Critical items/rejections

### Layout
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Collapsible Sidebar**: Toggle to maximize content area
- **Fixed AppBar**: Always visible navigation header
- **Grid System**: Material-UI Grid for responsive layouts

## Access Control

### Admin Only
The dashboard is only accessible to users with `role: 'admin'`.

**Login Credentials (Test):**
- Email: shalom@gmail.com
- Password: 12345
- Role: admin

### Route Protection
```javascript
// In App.jsx
<ProtectedRoute adminOnly={true}>
  <AdminDashboard />
</ProtectedRoute>
```

Non-admin users attempting to access `/` will be redirected to `/dashboard`.

## How to Use

### 1. Login as Admin
1. Navigate to `/login`
2. Enter admin credentials
3. System redirects to admin dashboard at `/`

### 2. View Statistics
- Dashboard loads automatically with current stats
- Stats refresh when page is reloaded
- Trend indicators show month-over-month changes

### 3. Monitor Transfers
- Recent transfers table shows latest activity
- Click "View All" to see complete transfer history
- Status chips indicate transfer state

### 4. Approve/Reject Clubs
1. View pending clubs in the right panel
2. Review club details (name, manager, country)
3. Click "Approve" to accept the club
4. Click "Reject" to decline the club
5. List refreshes automatically after action

### 5. Navigate to Other Sections
- Click sidebar menu items to access:
  - Clubs management
  - Players management
  - Transfers management
  - Reports generation
  - System settings

### 6. Logout
- Click logout button in sidebar
- User is redirected to login page
- Session data is cleared

## Technical Details

### Component Structure
```
AdminDashboard.jsx
├── AppBar (Header)
├── Drawer (Sidebar)
└── Main Content
    ├── Welcome Section
    ├── Stats Cards (Grid)
    ├── Recent Transfers (Table)
    └── Pending Clubs (List)
```

### State Management
```javascript
const [drawerOpen, setDrawerOpen] = useState(true);
const [stats, setStats] = useState({...});
const [recentTransfers, setRecentTransfers] = useState([]);
const [pendingClubs, setPendingClubs] = useState([]);
const [loading, setLoading] = useState(true);
```

### Data Fetching
- Uses `useEffect` hook to fetch data on mount
- Parallel API calls with `Promise.all()`
- Error handling with try-catch
- Loading states for better UX

## Customization

### Adding New Stats
1. Update `dashboard_stats.php` to include new metric
2. Add new stat to `stats` state
3. Create new `StatCard` in the grid

### Adding Menu Items
```javascript
const menuItems = [
  { text: 'New Page', icon: <NewIcon />, path: '/new-page' },
  // ... existing items
];
```

### Changing Colors
Update color values in `StatCard` components:
```javascript
<StatCard
  title="New Stat"
  value={value}
  icon={<Icon />}
  color="#custom-color"
/>
```

## Troubleshooting

### Dashboard Not Loading
1. Check XAMPP is running (Apache + MySQL)
2. Verify database connection in `config.php`
3. Check browser console for errors
4. Ensure API endpoints are accessible

### Stats Showing Zero
1. Verify database has data
2. Check SQL queries in PHP files
3. Test API endpoints directly in browser
3. Review PHP error logs

### Approve/Reject Not Working
1. Check network tab for API response
2. Verify club_id is correct
3. Check database permissions
4. Review PHP error logs

## Future Enhancements
- Real-time updates with WebSockets
- Export reports to PDF/Excel
- Advanced filtering and search
- Data visualization charts
- Email notifications
- Activity logs and audit trail
