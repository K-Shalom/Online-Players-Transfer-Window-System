import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import {
  getOffers,
  getTransfers,
  getClubs,
  createOffer,
  acceptOffer,
  rejectOffer,
  counterOffer,
  deleteOffer
} from '../services/api';

const OffersManagement = () => {
  const [offers, setOffers] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCounterDialog, setOpenCounterDialog] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    transfer_id: '',
    buyer_club_id: '',
    offered_amount: ''
  });
  
  const [counterAmount, setCounterAmount] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchOffers();
    fetchTransfers();
    fetchClubs();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await getOffers();
      if (res.data.success) {
        setOffers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
    }
  };

  const fetchTransfers = async () => {
    try {
      const res = await getTransfers();
      if (res.data.success) {
        // Only show pending transfers for new offers
        const pendingTransfers = res.data.data.filter(t => t.status === 'pending' || t.status === 'negotiation');
        setTransfers(pendingTransfers);
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
    }
  };

  const fetchClubs = async () => {
    try {
      const res = await getClubs('approved');
      if (res.data.success) {
        setClubs(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching clubs:', err);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      transfer_id: '',
      buyer_club_id: '',
      offered_amount: ''
    });
    setError('');
    setSuccess('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOffer(null);
  };

  const handleOpenCounterDialog = (offer) => {
    setSelectedOffer(offer);
    setCounterAmount(offer.offered_amount);
    setOpenCounterDialog(true);
  };

  const handleCloseCounterDialog = () => {
    setOpenCounterDialog(false);
    setSelectedOffer(null);
    setCounterAmount('');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.transfer_id || !formData.buyer_club_id || !formData.offered_amount) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (parseFloat(formData.offered_amount) <= 0) {
      setError('Offer amount must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      const res = await createOffer(formData);
      if (res.data.success) {
        setSuccess('Offer created successfully');
        fetchOffers();
        fetchTransfers();
        setTimeout(() => {
          handleCloseDialog();
        }, 1500);
      } else {
        setError(res.data.message || 'Failed to create offer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating offer');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (offerId) => {
    if (!window.confirm('Are you sure you want to accept this offer?')) return;

    try {
      const res = await acceptOffer(offerId);
      if (res.data.success) {
        setSuccess('Offer accepted successfully');
        fetchOffers();
        fetchTransfers();
      } else {
        setError(res.data.message || 'Failed to accept offer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error accepting offer');
    }
  };

  const handleReject = async (offerId) => {
    if (!window.confirm('Are you sure you want to reject this offer?')) return;

    try {
      const res = await rejectOffer(offerId);
      if (res.data.success) {
        setSuccess('Offer rejected');
        fetchOffers();
        fetchTransfers();
      } else {
        setError(res.data.message || 'Failed to reject offer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error rejecting offer');
    }
  };

  const handleCounter = async () => {
    if (!counterAmount || parseFloat(counterAmount) <= 0) {
      setError('Valid counter amount required');
      return;
    }

    try {
      const res = await counterOffer(selectedOffer.offer_id, parseFloat(counterAmount));
      if (res.data.success) {
        setSuccess('Counter offer sent');
        fetchOffers();
        handleCloseCounterDialog();
      } else {
        setError(res.data.message || 'Failed to send counter offer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending counter offer');
    }
  };

  const handleDelete = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;

    try {
      const res = await deleteOffer(offerId);
      if (res.data.success) {
        setSuccess('Offer deleted successfully');
        fetchOffers();
        fetchTransfers();
      } else {
        setError(res.data.message || 'Failed to delete offer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting offer');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Offers & Negotiations</Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Make Offer
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Offer ID</strong></TableCell>
              <TableCell><strong>Player</strong></TableCell>
              <TableCell><strong>Position</strong></TableCell>
              <TableCell><strong>Seller Club</strong></TableCell>
              <TableCell><strong>Buyer Club</strong></TableCell>
              <TableCell><strong>Offered Amount</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Created</strong></TableCell>
              {isAdmin && <TableCell><strong>Actions</strong></TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {offers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 8} align="center">
                  No offers found
                </TableCell>
              </TableRow>
            ) : (
              offers.map((offer) => (
                <TableRow key={offer.offer_id}>
                  <TableCell>{offer.offer_id}</TableCell>
                  <TableCell>{offer.player_name || 'N/A'}</TableCell>
                  <TableCell>{offer.position || 'N/A'}</TableCell>
                  <TableCell>{offer.seller_club || 'N/A'}</TableCell>
                  <TableCell>{offer.buyer_club || 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(offer.offered_amount)}</TableCell>
                  <TableCell>
                    <Chip
                      label={offer.status}
                      color={getStatusColor(offer.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(offer.created_at).toLocaleDateString()}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {offer.status === 'pending' && (
                          <>
                            <Tooltip title="Accept">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleAccept(offer.offer_id)}
                              >
                                <CheckIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleReject(offer.offer_id)}
                              >
                                <CloseIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Counter Offer">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenCounterDialog(offer)}
                              >
                                <MoneyIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(offer.offer_id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Offer Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Make New Offer</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Transfer</InputLabel>
            <Select
              name="transfer_id"
              value={formData.transfer_id}
              onChange={handleInputChange}
              label="Transfer"
            >
              {transfers.map((transfer) => (
                <MenuItem key={transfer.transfer_id} value={transfer.transfer_id}>
                  {transfer.player_name} - {transfer.seller_club} ({formatCurrency(transfer.amount || 0)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Buyer Club</InputLabel>
            <Select
              name="buyer_club_id"
              value={formData.buyer_club_id}
              onChange={handleInputChange}
              label="Buyer Club"
            >
              {clubs.map((club) => (
                <MenuItem key={club.club_id} value={club.club_id}>
                  {club.club_name} ({club.country})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Offered Amount"
            name="offered_amount"
            type="number"
            value={formData.offered_amount}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Offer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Counter Offer Dialog */}
      <Dialog open={openCounterDialog} onClose={handleCloseCounterDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Counter Offer</DialogTitle>
        <DialogContent>
          {selectedOffer && (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Current Offer: {formatCurrency(selectedOffer.offered_amount)}
              </Typography>
              <TextField
                fullWidth
                label="Counter Amount"
                type="number"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCounterDialog}>Cancel</Button>
          <Button onClick={handleCounter} variant="contained" color="primary">
            Send Counter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OffersManagement;
