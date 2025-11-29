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
  Button,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  LocalOffer as OfferIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { getOffersByClub, getClubs, acceptOffer, rejectOffer } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ClubOffers = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [clubInfo, setClubInfo] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
          // Get offers
          const offersRes = await getOffersByClub(userClub.id);
          if (offersRes.data.success) {
            setOffers(offersRes.data.data);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (offerId) => {
    if (!window.confirm('Accept this offer? This will reject all other offers for this transfer.')) return;

    try {
      const res = await acceptOffer(offerId);
      if (res.data.success) {
        setSuccess('Offer accepted successfully');
        fetchData();
      } else {
        setError(res.data.message || 'Failed to accept offer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error accepting offer');
    }
  };

  const handleReject = async (offerId) => {
    if (!window.confirm('Reject this offer?')) return;

    try {
      const res = await rejectOffer(offerId);
      if (res.data.success) {
        setSuccess('Offer rejected');
        fetchData();
      } else {
        setError(res.data.message || 'Failed to reject offer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error rejecting offer');
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
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getFilteredOffers = () => {
    switch (tabValue) {
      case 0: // All
        return offers;
      case 1: // Pending
        return offers.filter(o => o.status === 'pending');
      case 2: // Accepted
        return offers.filter(o => o.status === 'accepted');
      case 3: // Rejected
        return offers.filter(o => o.status === 'rejected');
      default:
        return offers;
    }
  };

  if (!clubInfo) {
    return (
      <Alert severity="warning">
        No club profile found. Please contact administrator.
      </Alert>
    );
  }

  const filteredOffers = getFilteredOffers();
  const pendingCount = offers.filter(o => o.status === 'pending').length;
  const acceptedCount = offers.filter(o => o.status === 'accepted').length;
  const rejectedCount = offers.filter(o => o.status === 'rejected').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          <OfferIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          My Offers - {clubInfo.club_name}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/club/market')}
          sx={{ borderRadius: 2 }}
        >
          Make New Offer
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Alert severity="info" sx={{ mb: 3 }}>
        These are offers you've made for players from other clubs. You can track their status here.
      </Alert>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`All (${offers.length})`} />
          <Tab label={`Pending (${pendingCount})`} />
          <Tab label={`Accepted (${acceptedCount})`} />
          <Tab label={`Rejected (${rejectedCount})`} />
        </Tabs>
      </Paper>

      {/* Offers Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Offer ID</strong></TableCell>
              <TableCell><strong>Player</strong></TableCell>
              <TableCell><strong>Position</strong></TableCell>
              <TableCell><strong>Selling Club</strong></TableCell>
              <TableCell><strong>Offered Amount</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOffers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ py: 3 }}>
                    <OfferIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">
                      {tabValue === 0
                        ? 'No offers yet. Start making offers for players you want!'
                        : 'No offers in this category'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredOffers.map((offer) => (
                <TableRow key={offer.offer_id} hover>
                  <TableCell>#{offer.offer_id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {offer.player_name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={offer.position || 'N/A'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{offer.seller_club || 'N/A'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {formatCurrency(parseMarketValue(offer.offered_amount))}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={offer.status}
                      color={getStatusColor(offer.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(offer.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {offer.status === 'pending' && (
                        <>
                          <Tooltip title="Withdraw Offer">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleReject(offer.offer_id)}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {offer.status === 'accepted' && (
                        <Chip label="Awaiting Transfer Completion" color="success" size="small" />
                      )}
                      {offer.status === 'rejected' && (
                        <Chip label="Offer Declined" color="error" size="small" />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ClubOffers;
