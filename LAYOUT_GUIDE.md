# Layout System Guide

## Overview

The OPTW system now uses a unified Layout component that provides consistent header and sidebar navigation across all pages.

## Features

### ✅ Persistent Header
- **Logo/Title**: OPTW System branding
- **Notifications**: Bell icon for system notifications
- **User Profile**: Avatar with dropdown menu
- **Menu Toggle**: Hamburger icon to show/hide sidebar

### ✅ Persistent Sidebar
- **Navigation Menu**: Quick access to all sections
- **Active Page Indicator**: Highlights current page
- **Role-based Menu**: Shows only relevant items based on user role
- **Logout Button**: Easy access to sign out

### ✅ Responsive Design
- **Desktop**: Full sidebar visible
- **Tablet/Mobile**: Collapsible sidebar
- **Smooth Transitions**: Animated sidebar toggle

## File Structure

```
src/
├── components/
│   └── Layout.jsx              # Main layout component
├── pages/
│   ├── AdminDashboardContent.jsx   # Dashboard without header/sidebar
│   ├── PlayersManagement.jsx       # Players page (uses Layout)
│   ├── ClubsManagement.jsx         # Clubs page (uses Layout)
│   ├── TransfersManagement.jsx     # Transfers page (uses Layout)
│   ├── ReportsManagement.jsx       # Reports page (uses Layout)
│   └── Settings.jsx                # Settings page (uses Layout)
└── App.jsx                     # Routes with Layout wrapper
```

## How It Works

### Layout Component
The `Layout.jsx` component wraps all protected pages and provides:
1. **AppBar** - Fixed header at the top
2. **Drawer** - Collapsible sidebar navigation
3. **Main Content Area** - Where page content is rendered

### Navigation Menu Items

#### Admin Users See:
- 📊 Dashboard
- 👥 Clubs
- ⚽ Players
- 🔄 Transfers
- 📈 Reports
- ⚙️ Settings
- 🚪 Logout

#### Club Users See:
- 📊 Dashboard (Club view)
- ⚙️ Settings
- 🚪 Logout

### Active Page Highlighting
The current page is automatically highlighted in the sidebar with:
- **Background color**: Light blue tint
- **Bold text**: Page name in bold
- **Icon color**: Blue icon

## Usage in Pages

### Before (Old Way)
```jsx
// Each page had its own header and padding
<Box sx={{ p: 3 }}>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
    <Icon sx={{ fontSize: 32, color: '#1976d2' }} />
    <Typography variant="h4">Page Title</Typography>
  </Box>
  {/* Page content */}
</Box>
```

### After (New Way)
```jsx
// Pages are simpler, Layout handles structure
<Box>
  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
    Page Title
  </Typography>
  {/* Page content */}
</Box>
```

## Benefits

### 1. **Consistency**
- Same header and navigation on every page
- Unified user experience
- Professional appearance

### 2. **Maintainability**
- Update navigation in one place
- Easy to add new menu items
- Centralized styling

### 3. **User Experience**
- Always visible navigation
- Quick page switching
- Clear indication of current location
- Easy logout access

### 4. **Code Efficiency**
- Less code duplication
- Cleaner page components
- Easier to understand

## Customization

### Adding New Menu Items
Edit `Layout.jsx`:
```jsx
const menuItems = [
  // ... existing items
  { 
    text: 'New Page', 
    icon: <NewIcon />, 
    path: '/new-page', 
    adminOnly: true 
  },
];
```

### Changing Colors
Update in `Layout.jsx`:
```jsx
<AppBar sx={{ bgcolor: '#your-color' }}>
```

### Adjusting Sidebar Width
Change `drawerWidth` constant:
```jsx
const drawerWidth = 240; // Change this value
```

## Profile Menu

Clicking the user avatar opens a dropdown with:
- **Profile**: View/edit profile (goes to Settings)
- **Settings**: Configure preferences
- **Logout**: Sign out of system

## Navigation Behavior

### Desktop
- Sidebar always visible by default
- Can be toggled with hamburger menu
- Smooth slide animation

### Mobile/Tablet
- Sidebar starts collapsed
- Opens as overlay when toggled
- Closes automatically after navigation

## Technical Details

### Components Used
- **AppBar**: Material-UI top navigation bar
- **Drawer**: Material-UI sidebar component
- **List/ListItem**: Navigation menu items
- **Menu**: Profile dropdown menu
- **Avatar**: User profile picture

### State Management
```jsx
const [drawerOpen, setDrawerOpen] = useState(true);
const [anchorEl, setAnchorEl] = useState(null);
```

### Route Integration
```jsx
// In App.jsx
const ProtectedRoute = ({ children, adminOnly = false }) => {
  // ... authentication logic
  return <Layout>{children}</Layout>;
};
```

## Pages Without Layout

Only these pages don't use the Layout:
- **Login** - Public page
- **Signup** - Public page

All other pages are wrapped in the Layout component.

## Troubleshooting

### Sidebar Not Showing
- Check if user is logged in
- Verify route is wrapped in ProtectedRoute
- Check browser console for errors

### Menu Items Missing
- Verify user role (admin vs club)
- Check `adminOnly` flag in menu items
- Ensure user data in localStorage

### Navigation Not Working
- Check route paths in App.jsx
- Verify page components are imported
- Check browser console for errors

## Future Enhancements

Possible improvements:
- 🔔 Real notification system
- 🌙 Dark mode toggle
- 🌍 Language selector
- 📱 Better mobile menu
- 🔍 Global search bar
- 📊 Quick stats in header

---

**The Layout system makes navigation consistent and professional across the entire OPTW system!**
