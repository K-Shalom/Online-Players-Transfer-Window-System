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
  Storefront as MarketIcon,
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
  const themeCtx = useContext(ThemeContext);
  const mode = themeCtx?.mode ?? 'light';
  const toggleTheme = themeCtx?.toggleTheme ?? (() => { });

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
  // Menu definitions
  const adminMenu = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/admin" },
    { text: "Clubs", icon: <PeopleIcon />, path: "/admin/clubs" },
    { text: "Players", icon: <SoccerIcon />, path: "/admin/players" },
    { text: "Player Market", icon: <MarketIcon />, path: "/admin/market" },
    { text: "Transfers", icon: <TransferIcon />, path: "/admin/transfers" },
    { text: "Offers", icon: <NotificationIcon />, path: "/admin/offers" },
    { text: "Wishlist", icon: <AccountCircle />, path: "/admin/wishlist" },
    { text: "Reports", icon: <ReportIcon />, path: "/admin/reports" },
    { text: "Settings", icon: <SettingsIcon />, path: "/admin/settings" },
  ];

  const clubMenu = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/club" },
    { text: "My Squad", icon: <SoccerIcon />, path: "/club/players" },
    { text: "Player Market", icon: <MarketIcon />, path: "/club/market" },
    { text: "Transfers", icon: <TransferIcon />, path: "/club/transfers" },
    { text: "My Offers", icon: <NotificationIcon />, path: "/club/offers" },
    { text: "Wishlist", icon: <AccountCircle />, path: "/club/wishlist" },
    { text: "Settings", icon: <SettingsIcon />, path: "/club/setup" },
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
          transition: "padding 0.3s",
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
