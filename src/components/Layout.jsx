import React, { useState, useContext } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  SportsSoccer as SoccerIcon,
  SwapHoriz as TransferIcon,
  Assessment as ReportIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  AccountCircle,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';

const Layout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { mode, toggleTheme } = useContext(ThemeContext);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Different menus for admin vs club users
  const adminMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Clubs', icon: <PeopleIcon />, path: '/clubs' },
    { text: 'Players', icon: <SoccerIcon />, path: '/players' },
    { text: 'Transfers', icon: <TransferIcon />, path: '/transfers' },
    { text: 'Offers', icon: <NotificationIcon />, path: '/offers' },
    { text: 'Wishlist', icon: <AccountCircle />, path: '/wishlist' },
    { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const clubMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'My Squad', icon: <SoccerIcon />, path: '/my-players' },
    { text: 'Transfers', icon: <TransferIcon />, path: '/my-transfers' },
    { text: 'My Offers', icon: <NotificationIcon />, path: '/my-offers' },
    { text: 'Wishlist', icon: <AccountCircle />, path: '/my-wishlist' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const menuItems = user.role === 'admin' ? adminMenuItems : clubMenuItems;

  // No need to filter since we're already selecting the right menu
  const filteredMenuItems = menuItems;

  const isActive = (path) => {
    return location.pathname === path;
  };

  const drawerWidth = 240;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            OPTW System
          </Typography>
          <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
            <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          <NotificationBell />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{ p: 0 }}
            >
              <Avatar sx={{ bgcolor: '#ff9800' }}>
                {user.name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, color: 'white' }}>
              <Typography variant="body2">{user.name || 'User'}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {user.role || 'User'}
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/settings'); }}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/settings'); }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Sidebar Drawer */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {filteredMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={isActive(item.path)}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    '&:hover': { 
                      bgcolor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'rgba(25, 118, 210, 0.08)' 
                    },
                    '&.Mui-selected': {
                      bgcolor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.16)' 
                        : 'rgba(25, 118, 210, 0.15)',
                      '&:hover': { 
                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.20)' 
                          : 'rgba(25, 118, 210, 0.20)' 
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: isActive(item.path) 
                      ? 'primary.main' 
                      : 'inherit' 
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      '& .MuiTypography-root': { 
                        fontWeight: isActive(item.path) ? 'bold' : 'normal' 
                      } 
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <List>
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&:hover': { 
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(244, 67, 54, 0.15)' 
                      : 'rgba(244, 67, 54, 0.08)' 
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#f44336' }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          transition: 'margin 0.3s',
          marginLeft: drawerOpen ? 0 : `-${drawerWidth}px`,
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
