import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  People as PeopleIcon,
  SwapHoriz as TransferIcon,
  TrendingUp as TrendingUpIcon,
  LocalOffer as OfferIcon,
  Favorite as WishlistIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { getClubs, getPlayers, getTransfers, getOffersByClub, getWishlists } from '../services/api';

const ClubDashboard = () => {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activeTransfers: 0,
    pendingOffers: 0,
    wishlistCount: 0,
    totalValue: 0
  });
  const [clubInfo, setClubInfo] = useState(null);
  const [recentPlayers, setRecentPlayers] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch club info
      const clubsRes = await getClubs();
      if (clubsRes.data.success) {
        const userClub = clubsRes.data.data.find(c => c.user_id == user.user_id);
        console.log('User ID:', user.user_id, 'Clubs:', clubsRes.data.data, 'Found club:', userClub);
        setClubInfo(userClub);

        if (userClub) {
          // Fetch players
          const playersRes = await getPlayers();
          if (playersRes.data.success) {
            const clubPlayers = playersRes.data.data.filter(p => p.club_id == userClub.id);
            setRecentPlayers(clubPlayers.slice(0, 5));
            
            const totalValue = clubPlayers.reduce((sum, p) => sum + parseFloat(p.market_value || 0), 0);
            
            setStats(prev => ({
              ...prev,
              totalPlayers: clubPlayers.length,
              totalValue: totalValue
            }));
          }

          // Fetch transfers
          const transfersRes = await getTransfers();
          if (transfersRes.data.success) {
            const clubTransfers = transfersRes.data.data.filter(
              t => t.seller_club_id === userClub.club_id || t.buyer_club_id === userClub.club_id
            );
            const activeTransfers = clubTransfers.filter(t => t.status !== 'completed' && t.status !== 'rejected');
            setRecentTransfers(clubTransfers.slice(0, 5));
            
            setStats(prev => ({
              ...prev,
              activeTransfers: activeTransfers.length
            }));
          }

          // Fetch offers
          const offersRes = await getOffersByClub(userClub.club_id);
          if (offersRes.data.success) {
            const pendingOffers = offersRes.data.data.filter(o => o.status === 'pending');
            setStats(prev => ({
              ...prev,
              pendingOffers: pendingOffers.length
            }));
          }

          // Fetch wishlist
          const wishlistRes = await getWishlists(userClub.club_id);
          if (wishlistRes.data.success) {
            setStats(prev => ({
              ...prev,
              wishlistCount: wishlistRes.data.data.length
            }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'negotiation': return 'info';
      case 'accepted': return 'success';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'fit': return 'success';
      case 'injured': return 'error';
      case 'recovering': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Loading Dashboard...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (!clubInfo) {
    return (
      <Box>
        <Alert severity="warning">
          No club profile found. Please contact administrator to create your club profile.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}
          >
            {clubInfo.club_name?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h4">{clubInfo.club_name}</Typography>
            <Typography variant="body1" color="text.secondary">
              {clubInfo.country} • Manager: {clubInfo.manager}
            </Typography>
            <Chip 
              label={clubInfo.status} 
              color={clubInfo.status === 'approved' ? 'success' : 'warning'}
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Players
                  </Typography>
                  <Typography variant="h4">{stats.totalPlayers}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Active Transfers
                  </Typography>
                  <Typography variant="h4">{stats.activeTransfers}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TransferIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Pending Offers
                  </Typography>
                  <Typography variant="h4">{stats.pendingOffers}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <OfferIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Squad Value
                  </Typography>
                  <Typography variant="h5">{formatCurrency(stats.totalValue)}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <MoneyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Players & Transfers */}
      <Grid container spacing={3}>
        {/* Recent Players */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <PeopleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Squad Overview
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Player</strong></TableCell>
                    <TableCell><strong>Position</strong></TableCell>
                    <TableCell><strong>Age</strong></TableCell>
                    <TableCell><strong>Health</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentPlayers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No players in squad
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentPlayers.map((player) => (
                      <TableRow key={player.player_id}>
                        <TableCell>{player.name}</TableCell>
                        <TableCell>
                          <Chip label={player.position} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{player.age}</TableCell>
                        <TableCell>
                          <Chip
                            label={player.health_status}
                            color={getHealthColor(player.health_status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Transfers */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <TransferIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Recent Transfers
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Player</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No recent transfers
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTransfers.map((transfer) => (
                      <TableRow key={transfer.transfer_id}>
                        <TableCell>{transfer.player_name}</TableCell>
                        <TableCell>
                          <Chip label={transfer.type} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>{formatCurrency(transfer.amount || 0)}</TableCell>
                        <TableCell>
                          <Chip
                            label={transfer.status}
                            color={getStatusColor(transfer.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WishlistIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{stats.wishlistCount}</Typography>
                  <Typography color="text.secondary">Players in Wishlist</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{formatCurrency(stats.totalValue / (stats.totalPlayers || 1))}</Typography>
                  <Typography color="text.secondary">Avg. Player Value</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <OfferIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{stats.pendingOffers}</Typography>
                  <Typography color="text.secondary">Offers to Review</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClubDashboard;
