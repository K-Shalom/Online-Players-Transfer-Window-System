import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Divider,
  Paper,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Pending,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getRecentTransfers, getPendingClubs, approveClub, rejectClub } from '../services/api';
import { showToast } from '../utils/toast';
import DashboardChart from '../components/DashboardChart';

const AdminDashboard = () => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [stats, setStats] = useState({
    totalClubs: 0,
    totalPlayers: 0,
    activeTransfers: 0,
    pendingApprovals: 0,
  });
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [pendingClubs, setPendingClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [statsRes, transfersRes, clubsRes] = await Promise.all([
        getDashboardStats(),
        getRecentTransfers(),
        getPendingClubs()
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (transfersRes.data.success) {
        setRecentTransfers(transfersRes.data.data);
      }

      if (clubsRes.data.success) {
        setPendingClubs(clubsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClub = async (clubId) => {
    try {
      const res = await approveClub(clubId);
      if (res.data.success) {
        showToast.success('Club approved successfully');
        fetchDashboardData();
      } else {
        showToast.error(res.data.message || 'Failed to approve club');
      }
    } catch (error) {
      console.error('Error approving club:', error);
      showToast.error('Error approving club');
    }
  };

  const handleRejectClub = async (clubId) => {
    try {
      const res = await rejectClub(clubId);
      if (res.data.success) {
        showToast.success('Club rejected successfully');
        fetchDashboardData();
      } else {
        showToast.error(res.data.message || 'Failed to reject club');
      }
    } catch (error) {
      console.error('Error rejecting club:', error);
      showToast.error('Error rejecting club');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    showToast.success('Logged out successfully!', {
      style: { background: '#43a047', color: '#fff' }
    });
    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Clubs', icon: <PeopleIcon />, path: '/clubs' },
    { text: 'Players', icon: <SoccerIcon />, path: '/players' },
    { text: 'Transfers', icon: <TransferIcon />, path: '/transfers' },
    { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const StatCard = ({ title, value, icon, color, trend }) => (
    <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)` }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: color }}>
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? (
                  <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                )}
                <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
                  {Math.abs(trend)}% from last month
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#1976d2' }}>
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
            OPTW - Admin Dashboard
          </Typography>
          <IconButton color="inherit" sx={{ mr: 2 }}>
            <NotificationIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: '#ff9800' }}>{user.name?.[0] || 'A'}</Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2">{user.name || 'Admin'}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>{user.role || 'Administrator'}</Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            bgcolor: '#fff',
            borderRight: '1px solid #e0e0e0',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    mx: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: '#1976d215' },
                  }}
                >
                  <ListItemIcon sx={{ color: '#1976d2' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
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
                  '&:hover': { bgcolor: '#f4433615' },
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
          p: 3,
          transition: 'margin 0.3s',
          marginLeft: drawerOpen ? 0 : '-240px',
        }}
      >
        <Toolbar />
        
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Welcome back, {user.name || 'Admin'}! 
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Here's what's happening with your transfer system today.
          </Typography>
        </Box>

        {/* KPI Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Clubs"
              value={stats.totalClubs ?? 0}
              icon={<DashboardIcon />}
              color="#1976d2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Players"
              value={stats.totalPlayers ?? 0}
              icon={<PeopleIcon />}
              color="#2e7d32"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Transfers"
              value={stats.activeTransfers ?? 0}
              icon={<TransferIcon />}
              color="#ed6c02"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Approvals"
              value={stats.pendingApprovals ?? 0}
              icon={<ReportIcon />}
              color="#d32f2f"
            />
          </Grid>
        </Grid>

        {/* Dynamic Chart for Dashboard Stats */}
        <DashboardChart stats={stats} />

        {/* Recent Transfers and Pending Clubs */}
        <Grid container spacing={3}>
          {/* Recent Transfers */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Recent Transfers
                </Typography>
                <Button size="small" onClick={() => navigate('/transfers')}>
                  View All
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Player</strong></TableCell>
                      <TableCell><strong>From</strong></TableCell>
                      <TableCell><strong>To</strong></TableCell>
                      <TableCell><strong>Amount</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">Loading...</TableCell>
                      </TableRow>
                    ) : recentTransfers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No recent transfers</TableCell>
                      </TableRow>
                    ) : recentTransfers.map((transfer) => (
                      <TableRow key={transfer.id} hover>
                        <TableCell>{transfer.player}</TableCell>
                        <TableCell>{transfer.from}</TableCell>
                        <TableCell>{transfer.to}</TableCell>
                        <TableCell>{transfer.amount}</TableCell>
                        <TableCell>
                          <Chip
                            label={transfer.status}
                            size="small"
                            color={
                              transfer.status === 'completed' ? 'success' :
                              transfer.status === 'pending' ? 'warning' : 'info'
                            }
                            icon={transfer.status === 'completed' ? <CheckCircle /> : <Pending />}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Pending Club Approvals */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Pending Clubs
                </Typography>
                <Chip label={pendingClubs.length} color="error" size="small" />
              </Box>
              <List>
                {loading ? (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                    Loading...
                  </Typography>
                ) : pendingClubs.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                    No pending clubs
                  </Typography>
                ) : pendingClubs.map((club) => (
                  <React.Fragment key={club.id}>
                    <ListItem
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        bgcolor: '#f5f5f5',
                        borderRadius: 1,
                        mb: 1,
                        p: 2,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {club.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Manager: {club.manager}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Country: {club.country}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, width: '100%' }}>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success" 
                          fullWidth
                          onClick={() => handleApproveClub(club.id)}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error" 
                          fullWidth
                          onClick={() => handleRejectClub(club.id)}
                        >
                          Reject
                        </Button>
                      </Box>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate('/clubs')}
              >
                View All Pending
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
