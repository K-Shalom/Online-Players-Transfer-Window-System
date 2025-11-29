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
  PersonAdd as PersonAddIcon,
  CheckCircle
} from '@mui/icons-material';
import { getClubs, getPlayers, getTransfers, getOffersByClub, getWishlists } from '../services/api';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

const ClubDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activeTransfers: 0,
    pendingOffers: 0,
    wishlistCount: 0,
    totalValue: 0,
    avgPlayerValue: 0
  });

  const [clubInfo, setClubInfo] = useState({
    club_name: '',
    country: '',
    manager: '',
    founded: 1900,
    stadium: '',
    capacity: 0,
    status: 'pending'
  });

  const [recentPlayers, setRecentPlayers] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [performanceTrend, setPerformanceTrend] = useState([]);
  const [squadDistributionData, setSquadDistributionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const parseMarketValue = (value) => {
    if (!value) return 0;
    const strVal = value.toString().replace(/[$,]/g, '');

    if (strVal.toUpperCase().includes('M')) {
      return parseFloat(strVal.replace(/M/i, '')) * 1000000;
    }
    if (strVal.toUpperCase().includes('K')) {
      return parseFloat(strVal.replace(/K/i, '')) * 1000;
    }
    return parseFloat(strVal) || 0;
  };

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      setError('');

      // Fetch club info
      const clubsRes = await getClubs();

      if (!clubsRes?.data) {
        setError('Failed to fetch clubs data');
        return;
      }

      if (clubsRes.data.success) {
        const userClub = clubsRes.data.data?.find(c => c.user_id == user.user_id) || {};

        setClubInfo(prev => ({
          ...prev,
          ...userClub,
          club_name: userClub.name,
          manager: userClub.manager || 'Unknown Manager'
        }));

        if (userClub?.id) {
          // Fetch players
          const playersRes = await getPlayers();
          if (playersRes?.data?.success) {
            const clubPlayers = playersRes.data.data?.filter(p => p.club_id == userClub.id) || [];
            setRecentPlayers(clubPlayers.slice(0, 5));

            const totalValue = clubPlayers.reduce((sum, p) => sum + parseMarketValue(p.market_value), 0);
            const avgValue = clubPlayers.length > 0 ? totalValue / clubPlayers.length : 0;

            setStats(prev => ({
              ...prev,
              totalPlayers: clubPlayers.length,
              totalValue: totalValue,
              avgPlayerValue: avgValue
            }));

            const distributionMap = {
              Goalkeepers: 0,
              Defenders: 0,
              Midfielders: 0,
              Forwards: 0,
            };

            clubPlayers.forEach((player) => {
              const position = (player.position || '').toLowerCase();
              if (position.includes('goal')) distributionMap.Goalkeepers += 1;
              else if (position.includes('def')) distributionMap.Defenders += 1;
              else if (position.includes('mid')) distributionMap.Midfielders += 1;
              else if (position.includes('forward') || position.includes('striker') || position.includes('wing')) {
                distributionMap.Forwards += 1;
              } else {
                distributionMap.Midfielders += 1;
              }
            });

            const distributionData = Object.entries(distributionMap)
              .map(([name, value]) => ({ name, value }))
              .filter(item => item.value > 0);

            setSquadDistributionData(distributionData);
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

              const trendAccumulator = {};
              clubTransfers.forEach((transfer) => {
                const rawDate = transfer.created_at || transfer.date;
                const date = rawDate ? new Date(rawDate) : null;
                if (!date || Number.isNaN(date.getTime())) return;
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!trendAccumulator[key]) {
                  trendAccumulator[key] = {
                    name: date.toLocaleString('default', { month: 'short' }),
                    transfers: 0,
                    amount: 0,
                    sortKey: key,
                  };
                }
                trendAccumulator[key].transfers += 1;
                trendAccumulator[key].amount += parseMarketValue(transfer.amount_raw || transfer.amount);
              });

              const trendData = Object.values(trendAccumulator)
                .sort((a, b) => (a.sortKey > b.sortKey ? 1 : -1))
                .slice(-6)
                .map(item => ({
                  name: item.name,
                  transfers: item.transfers,
                  amount: Number(item.amount.toFixed(2)),
                }));

              setPerformanceTrend(trendData);
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
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
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

  if (!loading && !clubInfo?.id) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          No club profile found for your account. Create your club to access the dashboard.
        </Alert>
        <Button variant="contained" color="primary" onClick={() => navigate('/club/setup')}>
          Create Club Profile
        </Button>
      </Box>
    );
  }

  if (!loading && clubInfo?.status === 'pending') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your club profile is awaiting admin approval. You will see full data once your club is approved.
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/club/setup')}>View/Update Submitted Details</Button>
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
          background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', // Green gradient
          color: 'white',
          borderRadius: 4, // More rounded corners
          p: 4,
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Left Side: Avatar and Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              src={clubInfo.logo_url}
              alt={clubInfo.club_name}
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'white',
                p: 1,
                '& img': { objectFit: 'contain' }
              }}
            >
              {clubInfo.club_name?.[0]?.toUpperCase() || 'C'}
            </Avatar>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
                  {clubInfo.club_name}
                </Typography>
                <Chip
                  label={clubInfo.club_name}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    height: 24,
                    fontSize: '0.75rem',
                    backdropFilter: 'blur(4px)'
                  }}
                />
              </Box>

              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                {clubInfo.country ? `${clubInfo.country} • ` : ''}Manager: {clubInfo.manager}
              </Typography>
            </Box>
          </Box>

          {/* Right Side: Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Refresh Data">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.15)',
                  width: 45,
                  height: 45,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.25)',
                  },
                  '&:disabled': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.3)',
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              sx={{
                bgcolor: 'white',
                color: '#1b5e20', // Green text
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)'
                },
                textTransform: 'uppercase'
              }}
            >
              Add Player
            </Button>
          </Box>
        </Box>

        {/* Decorative elements - Background Shapes */}
        <Box sx={{
          position: 'absolute',
          top: -20,
          left: -20,
          width: 200,
          height: 100,
          bgcolor: 'rgba(255,255,255,0.05)',
          borderRadius: 10,
          transform: 'rotate(-10deg)'
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: 100,
          width: 150,
          height: 80,
          bgcolor: 'rgba(255,255,255,0.05)',
          borderRadius: 10,
          transform: 'rotate(5deg)'
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
            <span>
              <Button
                color="inherit"
                size="small"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                Try Again
              </Button>
            </span>
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
      </Grid>

      {/* Main Content Area */}
      <Grid container spacing={3} sx={{ mt: 0 }}>
        {/* Squad Overview */}
        <Grid item xs={12} lg={7}>
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
                  onClick={() => { }}
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
                            onClick={() => { }}
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
                              {formatCurrency(parseMarketValue(player.market_value))}
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
                              <span>
                                <IconButton size="small" color="primary">
                                  <PeopleIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Transfer List">
                              <span>
                                <IconButton size="small" color="secondary">
                                  <TransferIcon fontSize="small" />
                                </IconButton>
                              </span>
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
        <Grid item xs={12} lg={5}>
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
                      onClick={() => { }}
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
                <Box sx={{ p: 2, minHeight: 240 }}>
                  {performanceTrend.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">No transfer activity yet</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={performanceTrend}>
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
                          allowDecimals={false}
                          domain={[0, (dataMax) => Math.max(dataMax, 1)]}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: theme.shape.borderRadius,
                            boxShadow: theme.shadows[2]
                          }}
                          formatter={(value) => [`${value} transfers`, 'Activity']}
                        />
                        <Line
                          type="monotone"
                          dataKey="transfers"
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
                  )}
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
                <Box sx={{ p: 2, minHeight: 240 }}>
                  {squadDistributionData.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">No players added yet</Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={squadDistributionData}>
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
                          allowDecimals={false}
                          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                          domain={[0, (dataMax) => Math.max(dataMax, 1)]}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: theme.shape.borderRadius,
                            boxShadow: theme.shadows[2]
                          }}
                          formatter={(value) => [value, 'Players']}
                        />
                        <Bar
                          dataKey="value"
                          fill={theme.palette.primary.main}
                          radius={[4, 4, 0, 0]}
                        >
                          {squadDistributionData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index % 2 === 0 ? theme.palette.primary.main : theme.palette.primary.light}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
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
