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
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment
} from '@mui/material';
import {
  SwapHoriz as TransferIcon,
  TrendingUp as UpIcon,
  TrendingDown as DownIcon,
  AttachMoney as MoneyIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { getTransfers, getClubs, getPlayers, addTransfer } from '../services/api';

const ClubTransfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [clubInfo, setClubInfo] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [transferRequest, setTransferRequest] = useState({
    player_id: '',
    type: 'Permanent',
    amount: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState('');

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

  const handleOpenDialog = async () => {
    setOpenDialog(true);
    setDialogError('');
    try {
      const res = await getPlayers();
      if (res.data.success) {
        // Filter players not in my club
        const others = res.data.data.filter(p => p.club_id != clubInfo.id);
        setAvailablePlayers(others);
      }
    } catch (err) {
      console.error('Error fetching players:', err);
      setDialogError('Failed to load players list');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setTransferRequest({ player_id: '', type: 'Permanent', amount: '' });
  };

  const handleSubmitTransfer = async () => {
    if (!transferRequest.player_id || !transferRequest.amount) {
      setDialogError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setDialogError('');

    try {
      const payload = {
        player_id: transferRequest.player_id,
        buyer_club_id: clubInfo.id,
        type: transferRequest.type,
        amount: parseFloat(transferRequest.amount),
        status: 'pending'
      };

      const res = await addTransfer(payload);
      if (res.data.success) {
        handleCloseDialog();
        fetchData(); // Refresh list
      } else {
        setDialogError(res.data.message || 'Failed to create transfer request');
      }
    } catch (err) {
      setDialogError(err.response?.data?.message || 'Error creating transfer request');
    } finally {
      setSubmitting(false);
    }
  };

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
      .reduce((sum, t) => sum + parseMarketValue(t.amount_raw || t.amount), 0);

    const totalEarned = outgoing
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + parseMarketValue(t.amount_raw || t.amount), 0);

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <TransferIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Transfer Activity - {clubInfo.club_name}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Request Transfer
        </Button>
      </Box>

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
                        {isIncoming ? '-' : '+'}{formatCurrency(parseMarketValue(transfer.amount_raw || transfer.amount))}
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

      {/* Request Transfer Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Request Transfer</DialogTitle>
        <DialogContent>
          {dialogError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{dialogError}</Alert>}

          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Player</InputLabel>
              <Select
                value={transferRequest.player_id}
                label="Select Player"
                onChange={(e) => setTransferRequest({ ...transferRequest, player_id: e.target.value })}
              >
                {availablePlayers.map((player) => (
                  <MenuItem key={player.player_id} value={player.player_id}>
                    {player.name} ({player.club_name}) - {formatCurrency(parseMarketValue(player.market_value))}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Transfer Type</InputLabel>
              <Select
                value={transferRequest.type}
                label="Transfer Type"
                onChange={(e) => setTransferRequest({ ...transferRequest, type: e.target.value })}
              >
                <MenuItem value="Permanent">Permanent Transfer</MenuItem>
                <MenuItem value="Loan">Loan</MenuItem>
                <MenuItem value="Free">Free Transfer</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Offer Amount"
              type="number"
              fullWidth
              value={transferRequest.amount}
              onChange={(e) => setTransferRequest({ ...transferRequest, amount: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              disabled={transferRequest.type === 'Free'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitTransfer}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClubTransfers;
