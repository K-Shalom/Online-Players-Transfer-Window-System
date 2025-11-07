import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  List,
  ListItem,
} from '@mui/material';
import {
  People as PeopleIcon,
  SportsSoccer as SoccerIcon,
  SwapHoriz as TransferIcon,
  Pending,
  TrendingUp,
  TrendingDown,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getRecentTransfers, getPendingClubs, approveClub, rejectClub } from '../services/api';

const AdminDashboardContent = () => {
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
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
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
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error approving club:', error);
    }
  };

  const handleRejectClub = async (clubId) => {
    try {
      const res = await rejectClub(clubId);
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error rejecting club:', error);
    }
  };

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
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Welcome back, {user.name || 'Admin'}! 👋
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Here's what's happening with your transfer system today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Clubs"
            value={stats.totalClubs}
            icon={<PeopleIcon />}
            color="#1976d2"
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Players"
            value={stats.totalPlayers}
            icon={<SoccerIcon />}
            color="#2e7d32"
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Transfers"
            value={stats.activeTransfers}
            icon={<TransferIcon />}
            color="#ed6c02"
            trend={-3}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={<Pending />}
            color="#d32f2f"
            trend={5}
          />
        </Grid>
      </Grid>

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
  );
};

export default AdminDashboardContent;
