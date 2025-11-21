import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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

const drawerWidth = 240;

const Layout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const { mode, toggleTheme } = useContext(ThemeContext);

  // Check user session
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");

      if (userData) {
        setUser(JSON.parse(userData));
      } else if (
        !["/login", "/signup", "/verify-email"].includes(location.pathname)
      ) {
        navigate("/login", { replace: true });
      }
    } catch {
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  }, [location.pathname, navigate]);

  // If authentication page → show only children
  if (["/login", "/signup", "/verify-email"].includes(location.pathname)) {
    return <>{children}</>;
  }

  if (!user) return <Box sx={{ display: "flex" }}>{children}</Box>;

  // Menu definitions
  const adminMenu = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Clubs", icon: <PeopleIcon />, path: "/clubs" },
    { text: "Players", icon: <SoccerIcon />, path: "/players" },
    { text: "Transfers", icon: <TransferIcon />, path: "/transfers" },
    { text: "Offers", icon: <NotificationIcon />, path: "/offers" },
    { text: "Wishlist", icon: <AccountCircle />, path: "/wishlist" },
    { text: "Reports", icon: <ReportIcon />, path: "/reports" },
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
  ];

  const clubMenu = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "My Squad", icon: <SoccerIcon />, path: "/my-players" },
    { text: "Transfers", icon: <TransferIcon />, path: "/my-transfers" },
    { text: "My Offers", icon: <NotificationIcon />, path: "/my-offers" },
    { text: "Wishlist", icon: <AccountCircle />, path: "/my-wishlist" },
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
  ];

  const menuItems = user.role === "admin" ? adminMenu : clubMenu;

  const isActive = (path) => location.pathname === path;

  return (
    <Box sx={{ display: "flex" }}>
      {/* Application Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton color="inherit" onClick={() => setDrawerOpen(!drawerOpen)}>
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            OPTW System
          </Typography>

          {/* Theme Toggle */}
          <Tooltip title={mode === "dark" ? "Light Mode" : "Dark Mode"}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <NotificationBell />

          {/* Profile Button */}
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ bgcolor: "#ff9800" }}>
              {user.name?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: mode === "dark" ? "#1a1a1a" : "#fff",
          },
        }}
      >
        <Toolbar />

        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <List sx={{ mt: 2 }}>
            {menuItems.map((item) => (
              <ListItemButton
                key={item.text}
                onClick={() => navigate(item.path)}
                selected={isActive(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  "&.Mui-selected": {
                    bgcolor:
                      mode === "dark"
                        ? "rgba(255,255,255,0.16)"
                        : "rgba(25,118,210,0.15)",
                    "&:hover": {
                      bgcolor:
                        mode === "dark"
                          ? "rgba(255,255,255,0.20)"
                          : "rgba(25,118,210,0.20)",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{ color: isActive(item.path) ? "primary.main" : "inherit" }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive(item.path) ? "bold" : "normal",
                  }}
                />
              </ListItemButton>
            ))}
          </List>

          <Box sx={{ flexGrow: 1 }} />

          <Divider sx={{ my: 2, mx: 1 }} />

          {/* Logout pinned to bottom */}
          <ListItemButton
            onClick={() => {
              localStorage.removeItem("user");
              navigate("/login");
            }}
            sx={{ mx: 1, borderRadius: 1, mb: 1 }}
          >
            <ListItemIcon sx={{ color: "#f44336" }}>
              <LogoutIcon />
            </ListItemIcon>

            <ListItemText primary="Logout" />
          </ListItemButton>
        </Box>
      </Drawer>

      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: 1,
          py: 3,
          ml: drawerOpen ? `${drawerWidth}px` : 0,
          transition: "margin 0.3s",
          mt: "64px",
        }}
      >
        {children}
      </Box>

      {/* Profile Dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => navigate("/profile")}>
          <AccountCircle fontSize="small" /> Profile
        </MenuItem>

        <MenuItem onClick={() => navigate("/settings")}>
          <SettingsIcon fontSize="small" /> Settings
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={() => {
            localStorage.removeItem("user");
            navigate("/login");
          }}
        >
          <LogoutIcon fontSize="small" /> Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout;
