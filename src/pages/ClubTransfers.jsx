import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  SwapHoriz as TransferIcon,
  TrendingUp as UpIcon,
  TrendingDown as DownIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { getTransfers, getClubs } from '../services/api';

const ClubTransfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [clubInfo, setClubInfo] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get club info
      const clubsRes = await getClubs();
      if (clubsRes.data.success) {
        const userClub = clubsRes.data.data.find(c => c.user_id == user.user_id);
        setClubInfo(userClub);

        if (userClub) {
          // Get transfers
          const transfersRes = await getTransfers();
          if (transfersRes.data.success) {
            const clubTransfers = transfersRes.data.data.filter(
              t => t.seller_club_id == userClub.id || t.buyer_club_id == userClub.id
            );
            setTransfers(clubTransfers);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load transfers');
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

  const getFilteredTransfers = () => {
    if (!clubInfo) return [];
    
    switch (tabValue) {
      case 0: // All
        return transfers;
      case 1: // Incoming (buying)
        return transfers.filter(t => t.buyer_club_id == clubInfo.id);
      case 2: // Outgoing (selling)
        return transfers.filter(t => t.seller_club_id == clubInfo.id);
      default:
        return transfers;
    }
  };

  const getStats = () => {
    if (!clubInfo) return { incoming: 0, outgoing: 0, totalSpent: 0, totalEarned: 0 };

    const incoming = transfers.filter(t => t.buyer_club_id == clubInfo.id);
    const outgoing = transfers.filter(t => t.seller_club_id == clubInfo.id);
    
    const totalSpent = incoming
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
    const totalEarned = outgoing
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    return {
      incoming: incoming.length,
      outgoing: outgoing.length,
      totalSpent,
      totalEarned
    };
  };

  if (!clubInfo) {
    return (
      <Alert severity="warning">
        No club profile found. Please contact administrator.
      </Alert>
    );
  }

  const stats = getStats();
  const filteredTransfers = getFilteredTransfers();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <TransferIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Transfer Activity - {clubInfo.club_name}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DownIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{stats.incoming}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Incoming Transfers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <UpIcon color="secondary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5">{stats.outgoing}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Outgoing Transfers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MoneyIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">{formatCurrency(stats.totalSpent)}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Total Spent
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MoneyIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">{formatCurrency(stats.totalEarned)}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Total Earned
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`All (${transfers.length})`} />
          <Tab label={`Incoming (${stats.incoming})`} />
          <Tab label={`Outgoing (${stats.outgoing})`} />
        </Tabs>
      </Paper>

      {/* Transfers Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Player</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>From</strong></TableCell>
              <TableCell><strong>To</strong></TableCell>
              <TableCell><strong>Amount</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 3 }}>
                    <TransferIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">
                      No transfers found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransfers.map((transfer) => {
                const isIncoming = transfer.buyer_club_id == clubInfo.id;
                
                return (
                  <TableRow key={transfer.transfer_id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isIncoming ? (
                          <DownIcon color="primary" fontSize="small" />
                        ) : (
                          <UpIcon color="secondary" fontSize="small" />
                        )}
                        <Typography variant="body2" fontWeight="bold">
                          {transfer.player_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={transfer.type} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>{transfer.seller_club || 'N/A'}</TableCell>
                    <TableCell>{transfer.buyer_club || 'TBD'}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={isIncoming ? 'error.main' : 'success.main'}
                      >
                        {isIncoming ? '-' : '+'}{formatCurrency(transfer.amount || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transfer.status}
                        color={getStatusColor(transfer.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ClubTransfers;
