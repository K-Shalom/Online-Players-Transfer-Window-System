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
  Alert,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Skeleton
} from '@mui/material';
import {
  People as PeopleIcon,
  SwapHoriz as TransferIcon,
  TrendingUp as TrendingUpIcon,
  LocalOffer as OfferIcon,
  Favorite as WishlistIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  SportsSoccer as SoccerIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { getClubs, getPlayers, getTransfers, getOffersByClub, getWishlists } from '../services/api';
import { useTheme } from '@mui/material/styles';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

// Sample performance data - replace with actual data from your API
const performanceData = [
  { name: 'Jan', value: 65 },
  { name: 'Feb', value: 59 },
  { name: 'Mar', value: 80 },
  { name: 'Apr', value: 81 },
  { name: 'May', value: 76 },
  { name: 'Jun', value: 85 },
];

const squadDistribution = [
  { name: 'Goalkeepers', value: 3 },
  { name: 'Defenders', value: 8 },
  { name: 'Midfielders', value: 8 },
  { name: 'Forwards', value: 5 },
];

const ClubDashboard = () => {
  const theme = useTheme();
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activeTransfers: 0,
    pendingOffers: 0,
    wishlistCount: 0,
    totalValue: 0,
    avgPlayerValue: 0,
    teamRating: 78.5,
    form: 'WWDWL',
    nextMatch: 'FC Barcelona',
    daysToNextMatch: 3
  });
  
  const [clubInfo, setClubInfo] = useState({
    club_name: 'Loading...',
    country: '',
    manager: 'Loading...',
    founded: 1900,
    stadium: 'Loading Stadium',
    capacity: 0
  });
  
  const [recentPlayers, setRecentPlayers] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      setError('');

      // Fetch club info
      const clubsRes = await getClubs();
      if (clubsRes?.data?.success) {
        const userClub = clubsRes.data.data?.find(c => c.user_id == user.user_id) || {};
        setClubInfo(prev => ({
          ...prev,
          ...userClub,
          club_name: userClub.club_name || 'My Club',
          manager: userClub.manager || 'Unknown Manager'
        }));

        if (userClub?.id) {
          // Fetch players
          const playersRes = await getPlayers();
          if (playersRes?.data?.success) {
            const clubPlayers = playersRes.data.data?.filter(p => p.club_id == userClub.id) || [];
            setRecentPlayers(clubPlayers.slice(0, 5));
            
            const totalValue = clubPlayers.reduce((sum, p) => sum + parseFloat(p.market_value || 0), 0);
            const avgValue = clubPlayers.length > 0 ? totalValue / clubPlayers.length : 0;
            
            setStats(prev => ({
              ...prev,
              totalPlayers: clubPlayers.length,
              totalValue: totalValue,
              avgPlayerValue: avgValue
            }));
          }

          // Fetch transfers
          try {
            const transfersRes = await getTransfers();
            if (transfersRes?.data?.success) {
              const clubTransfers = transfersRes.data.data?.filter(
                t => t.seller_club_id === userClub.id || t.buyer_club_id === userClub.id
              ) || [];
              const activeTransfers = clubTransfers.filter(t => t.status !== 'completed' && t.status !== 'rejected');
              setRecentTransfers(clubTransfers.slice(0, 5));
              
              setStats(prev => ({
                ...prev,
                activeTransfers: activeTransfers.length
              }));
            }
          } catch (e) {
            console.warn('Error fetching transfers:', e);
          }

          // Fetch offers
          try {
            const offersRes = await getOffersByClub(userClub.id);
            if (offersRes?.data?.success) {
              const pendingOffers = offersRes.data.data?.filter(o => o.status === 'pending') || [];
              setStats(prev => ({
                ...prev,
                pendingOffers: pendingOffers.length
              }));
            }
          } catch (e) {
            console.warn('Error fetching offers:', e);
          }

          // Fetch wishlist
          try {
            const wishlistRes = await getWishlists(userClub.id);
            if (wishlistRes?.data?.success) {
              setStats(prev => ({
                ...prev,
                wishlistCount: wishlistRes.data.data?.length || 0
              }));
            }
          } catch (e) {
            console.warn('Error fetching wishlist:', e);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    fetchDashboardData();
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

  if (loading && !refreshing) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!user?.user_id) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', mt: 4 }}>
        <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
          <SoccerIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography variant="h5" gutterBottom>Welcome to Club Dashboard</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Please sign in to access your club's dashboard
        </Typography>
        <Button variant="contained" color="primary">
          Sign In
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Club Info */}
      <Box 
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #1a1a1a 0%, #141414 100%)'
            : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: theme.palette.mode === 'dark' ? theme.palette.text.primary : 'white',
          borderRadius: 2,
          p: 3,
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark' ? 'none' : theme.shadows[4],
          border: theme.palette.mode === 'dark' ? '1px solid #2a2a2a' : 'none'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: theme.palette.mode === 'dark' ? '#2a2a2a' : 'white',
                color: theme.palette.mode === 'dark' ? theme.palette.text.primary : theme.palette.primary.main,
                fontSize: '2.5rem',
                border: '3px solid',
                borderColor: theme.palette.mode === 'dark' ? '#2a2a2a' : 'white',
                boxShadow: theme.shadows[3]
              }}
            >
              {clubInfo.club_name?.[0]?.toUpperCase() || 'C'}
            </Avatar>
            
            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 1, mb: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {clubInfo.club_name || 'My Club'}
                </Typography>
                <Chip 
                  label={clubInfo.status || 'active'} 
                  color={clubInfo.status === 'approved' ? 'success' : 'warning'}
                  size="small"
                  sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    height: 20,
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' }, mb: 2 }}>
                <Chip 
                  icon={<TrophyIcon />} 
                  label={`Founded: ${clubInfo.founded || 'N/A'}`} 
                  size="small" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }} 
                />
                <Chip 
                  icon={<PeopleIcon />} 
                  label={clubInfo.stadium || 'Unknown Stadium'} 
                  size="small" 
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }} 
                />
                {clubInfo.capacity > 0 && (
                  <Chip 
                    label={`Capacity: ${clubInfo.capacity.toLocaleString()}`} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }} 
                  />
                )}
              </Box>
              
              <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: '800px' }}>
                {clubInfo.country ? `${clubInfo.country} • ` : ''}Manager: {clubInfo.manager}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Tooltip title="Refresh Data">
                <IconButton 
                  onClick={handleRefresh} 
                  disabled={refreshing}
                  sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<PersonAddIcon />}
                sx={{ 
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
                }}
              >
                Add Player
              </Button>
            </Box>
          </Box>
        </Box>
        
        {/* Decorative elements */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '40%',
          height: '100%',
          background: theme.palette.mode === 'dark'
            ? 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 70%)'
            : 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
          opacity: 0.5
        }} />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' }
          }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Try Again
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card 
            sx={{ 
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? theme.palette.background.paper 
                : 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.palette.mode === 'dark' 
                ? 'none' 
                : '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.palette.mode === 'dark' 
                  ? 'none' 
                  : '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    SQUAD SIZE
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {stats.totalPlayers}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                      +2 this month
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '12px',
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'primary.contrastText',
                    flexShrink: 0
                  }}
                >
                  <PeopleIcon fontSize="large" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card 
            sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    SQUAD VALUE
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {formatCurrency(stats.totalValue)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                      +5.2% this month
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '12px',
                    bgcolor: 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'success.contrastText',
                    flexShrink: 0
                  }}
                >
                  <MoneyIcon fontSize="large" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card 
            sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    ACTIVE TRANSFERS
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {stats.activeTransfers}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {stats.pendingOffers} pending offers
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '12px',
                    bgcolor: 'info.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'info.contrastText',
                    flexShrink: 0
                  }}
                >
                  <TransferIcon fontSize="large" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card 
            sx={{ 
              height: '100%',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                    TEAM RATING
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {stats.teamRating}
                    </Typography>
                    <Chip 
                      label={stats.form} 
                      size="small" 
                      color="primary" 
                      sx={{ 
                        height: 20, 
                        '& .MuiChip-label': { px: 1 },
                        bgcolor: 'primary.light',
                        color: 'primary.dark',
                        fontWeight: 700
                      }} 
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Next match: {stats.nextMatch} in {stats.daysToNextMatch}d
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '12px',
                    bgcolor: 'secondary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'secondary.contrastText',
                    flexShrink: 0
                  }}
                >
                  <StarIcon fontSize="large" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Area */}
      <Grid container spacing={3}>
        {/* Squad Overview */}
        <Grid item xs={12} lg={8}>
          <Card 
            sx={{ 
              height: '100%',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
          >
            <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PeopleIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Squad Overview</Typography>
                </Box>
                <Button 
                  size="small" 
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => {}}
                >
                  Add Player
                </Button>
              </Box>
            </Box>
            
            <TableContainer sx={{ maxHeight: 440, overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>PLAYER</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>POSITION</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>AGE</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>VALUE</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 600, bgcolor: 'background.paper' }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentPlayers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <SoccerIcon sx={{ fontSize: 40, opacity: 0.5 }} />
                          <Typography color="text.secondary">No players in squad</Typography>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            startIcon={<AddIcon />}
                            sx={{ mt: 1 }}
                            onClick={() => {}}
                          >
                            Add Player
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentPlayers.map((player) => (
                      <TableRow 
                        key={player.player_id}
                        hover 
                        sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 },
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <TableCell sx={{ minWidth: 200 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar 
                              src={player.photo} 
                              alt={player.name}
                              sx={{ width: 36, height: 36 }}
                            >
                              {player.name?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {player.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                #{player.jersey_number || '00'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={player.position} 
                            size="small" 
                            variant="outlined"
                            color={
                              player.position === 'Goalkeeper' ? 'primary' : 
                              player.position === 'Defender' ? 'success' :
                              player.position === 'Midfielder' ? 'warning' : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>{player.age}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {player.market_value ? `$${(player.market_value / 1000000).toFixed(1)}M` : '-'}
                            </Typography>
                            {player.market_value_change > 0 && (
                              <TrendingUpIcon color="success" sx={{ fontSize: 16 }} />
                            )}
                            {player.market_value_change < 0 && (
                              <TrendingUpIcon color="error" sx={{ fontSize: 16, transform: 'rotate(180deg)' }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={player.health_status}
                            size="small"
                            color={getHealthColor(player.health_status)}
                            sx={{ 
                              textTransform: 'capitalize',
                              '&.MuiChip-colorSuccess': { 
                                bgcolor: 'success.light', 
                                color: 'success.dark' 
                              },
                              '&.MuiChip-colorError': { 
                                bgcolor: 'error.light', 
                                color: 'error.dark' 
                              },
                              '&.MuiChip-colorWarning': { 
                                bgcolor: 'warning.light', 
                                color: 'warning.dark' 
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="View Profile">
                              <IconButton size="small" color="primary">
                                <PeopleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Transfer List">
                              <IconButton size="small" color="secondary">
                                <TransferIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {recentPlayers.length > 0 && (
              <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="small" color="primary">
                  View All Players
                </Button>
              </Box>
            )}
          </Card>
        </Grid>
        
        {/* Right Sidebar */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3} direction="column">
            {/* Recent Transfers */}
            <Grid item>
              <Card 
                sx={{ 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <TransferIcon color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Transfers</Typography>
                    </Box>
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => {}}
                    >
                      View All
                    </Button>
                  </Box>
                </Box>
                
                <Box sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                  {recentTransfers.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <TransferIcon sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                      <Typography color="text.secondary">No recent transfers</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ '& > *:not(:last-child)': { mb: 2 } }}>
                      {recentTransfers.map((transfer) => (
                        <Box 
                          key={transfer.transfer_id}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: 'action.hover',
                            '&:hover': { bgcolor: 'action.selected' }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Avatar 
                              src={transfer.player_photo} 
                              sx={{ width: 32, height: 32, mr: 1.5 }}
                            >
                              {transfer.player_name?.[0]}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" noWrap>
                                {transfer.player_name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip 
                                  label={transfer.type} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                  sx={{ height: 20, '& .MuiChip-label': { px: 1 } }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(transfer.date).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ textAlign: 'right', ml: 1 }}>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {formatCurrency(transfer.amount || 0)}
                              </Typography>
                              <Chip
                                label={transfer.status}
                                size="small"
                                color={getStatusColor(transfer.status)}
                                sx={{ 
                                  height: 20, 
                                  '& .MuiChip-label': { px: 1 },
                                  '&.MuiChip-colorSuccess': { 
                                    bgcolor: 'success.light', 
                                    color: 'success.dark' 
                                  },
                                  '&.MuiChip-colorError': { 
                                    bgcolor: 'error.light', 
                                    color: 'error.dark' 
                                  },
                                  '&.MuiChip-colorWarning': { 
                                    bgcolor: 'warning.light', 
                                    color: 'warning.dark' 
                                  }
                                }}
                              />
                            </Box>
                          </Box>
                          
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            mt: 1,
                            pt: 1,
                            borderTop: '1px dashed rgba(0,0,0,0.08)'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar 
                                src={transfer.seller_club_logo} 
                                sx={{ width: 24, height: 24 }}
                              >
                                {transfer.seller_club_name?.[0]}
                              </Avatar>
                              <Typography variant="caption" noWrap sx={{ maxWidth: 80 }}>
                                {transfer.seller_club_name}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ px: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                to
                              </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar 
                                src={transfer.buyer_club_logo} 
                                sx={{ width: 24, height: 24 }}
                              >
                                {transfer.buyer_club_name?.[0]}
                              </Avatar>
                              <Typography variant="caption" noWrap sx={{ maxWidth: 80 }}>
                                {transfer.buyer_club_name}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Card>
            </Grid>
            
            {/* Performance Chart */}
            <Grid item>
              <Card 
                sx={{ 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Team Performance</Typography>
                </Box>
                <Box sx={{ p: 2, height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                        domain={[0, 100]}
                      />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: theme.shape.borderRadius,
                          boxShadow: theme.shadows[2]
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={theme.palette.primary.main} 
                        strokeWidth={2}
                        dot={{
                          fill: theme.palette.primary.main,
                          stroke: theme.palette.background.paper,
                          strokeWidth: 2,
                          r: 4
                        }}
                        activeDot={{
                          r: 6,
                          stroke: theme.palette.primary.main,
                          strokeWidth: 2,
                          fill: theme.palette.background.paper
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>
            
            {/* Squad Distribution */}
            <Grid item>
              <Card 
                sx={{ 
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Squad Distribution</Typography>
                </Box>
                <Box sx={{ p: 2, height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={squadDistribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                      />
                      <RechartsTooltip 
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: theme.shape.borderRadius,
                          boxShadow: theme.shadows[2]
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill={theme.palette.primary.main}
                        radius={[4, 4, 0, 0]}
                      >
                        {squadDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              index % 2 === 0 ? theme.palette.primary.main : theme.palette.primary.light
                            } 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClubDashboard;
