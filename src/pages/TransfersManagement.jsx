import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as TransferIcon,
  CheckCircle,
  Pending,
  Info,
} from '@mui/icons-material';
import { getTransfers, getPlayers, getClubs, addTransfer, updateTransfer, deleteTransfer } from '../services/api';

const TransfersManagement = () => {
  const [transfers, setTransfers] = useState([]);
  const [players, setPlayers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTransfer, setCurrentTransfer] = useState({
    transfer_id: null,
    player_id: '',
    seller_club_id: '',
    buyer_club_id: '',
    type: 'Permanent',
    amount: '',
    status: 'pending',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransfers();
    fetchPlayers();
    fetchClubs();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await getTransfers();
      if (res.data.success) {
        setTransfers(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching transfers:', error);
      setError('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      const res = await getPlayers();
      if (res.data.success) {
        setPlayers(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchClubs = async () => {
    try {
      const res = await getClubs('approved');
      if (res.data.success) {
        setClubs(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const handleOpenDialog = (transfer = null) => {
    if (transfer) {
      setEditMode(true);
      setCurrentTransfer({
        transfer_id: transfer.id,
        player_id: transfer.player_id,
        seller_club_id: transfer.seller_club_id,
        buyer_club_id: transfer.buyer_club_id,
        type: transfer.type,
        amount: transfer.amount_raw,
        status: transfer.status,
      });
    } else {
      setEditMode(false);
      setCurrentTransfer({
        transfer_id: null,
        player_id: '',
        seller_club_id: '',
        buyer_club_id: '',
        type: 'Permanent',
        amount: '',
        status: 'pending',
      });
    }
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentTransfer({ ...currentTransfer, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      if (!currentTransfer.player_id || !currentTransfer.seller_club_id || !currentTransfer.buyer_club_id) {
        setError('Player, seller club, and buyer club are required');
        return;
      }

      const transferData = {
        ...currentTransfer,
        amount: parseFloat(currentTransfer.amount) || 0,
      };

      let res;
      if (editMode) {
        res = await updateTransfer(transferData);
      } else {
        res = await addTransfer(transferData);
      }

      if (res.data.success) {
        setSuccess(res.data.message);
        fetchTransfers();
        setTimeout(() => {
          handleCloseDialog();
          setSuccess('');
        }, 1500);
      } else {
        setError(res.data.message);
      }
    } catch (error) {
      console.error('Error saving transfer:', error);
      setError('Failed to save transfer');
    }
  };

  const handleDelete = async (transferId) => {
    if (window.confirm('Are you sure you want to delete this transfer?')) {
      try {
        const res = await deleteTransfer(transferId);
        if (res.data.success) {
          setSuccess('Transfer deleted successfully');
          fetchTransfers();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(res.data.message);
        }
      } catch (error) {
        console.error('Error deleting transfer:', error);
        setError('Failed to delete transfer');
      }
    }
  };

  const handleStatusChange = async (transferId, newStatus) => {
    try {
      const res = await updateTransfer({ transfer_id: transferId, status: newStatus });
      if (res.data.success) {
        setSuccess(`Transfer ${newStatus} successfully`);
        fetchTransfers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(res.data.message);
      }
    } catch (error) {
      console.error('Error updating transfer status:', error);
      setError('Failed to update transfer status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'negotiation':
        return 'info';
      case 'accepted':
        return 'primary';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle />;
      case 'pending':
        return <Pending />;
      default:
        return <Info />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Transfers Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Transfer
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Player</strong></TableCell>
                <TableCell><strong>From</strong></TableCell>
                <TableCell><strong>To</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Amount</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">Loading...</TableCell>
                </TableRow>
              ) : transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">No transfers found</TableCell>
                </TableRow>
              ) : (
                transfers.map((transfer) => (
                  <TableRow key={transfer.id} hover>
                    <TableCell>{transfer.player_name}</TableCell>
                    <TableCell>{transfer.seller_club}</TableCell>
                    <TableCell>{transfer.buyer_club}</TableCell>
                    <TableCell>{transfer.type}</TableCell>
                    <TableCell>{transfer.amount}</TableCell>
                    <TableCell>
                      <Chip
                        label={transfer.status}
                        size="small"
                        color={getStatusColor(transfer.status)}
                        icon={getStatusIcon(transfer.status)}
                      />
                    </TableCell>
                    <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {transfer.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            color="success"
                            onClick={() => handleStatusChange(transfer.id, 'accepted')}
                            sx={{ mr: 0.5, mb: 0.5 }}
                          >
                            Accept
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleStatusChange(transfer.id, 'rejected')}
                            sx={{ mr: 0.5, mb: 0.5 }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {transfer.status === 'accepted' && (
                        <Button
                          size="small"
                          color="primary"
                          onClick={() => handleStatusChange(transfer.id, 'completed')}
                          sx={{ mr: 0.5, mb: 0.5 }}
                        >
                          Complete
                        </Button>
                      )}
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(transfer)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(transfer.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Transfer' : 'Add New Transfer'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <TextField
            fullWidth
            select
            label="Player"
            name="player_id"
            value={currentTransfer.player_id}
            onChange={handleInputChange}
            margin="normal"
            required
          >
            {players.map((player) => (
              <MenuItem key={player.id} value={player.id}>
                {player.name} - {player.club}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            select
            label="From Club"
            name="seller_club_id"
            value={currentTransfer.seller_club_id}
            onChange={handleInputChange}
            margin="normal"
            required
          >
            {clubs.map((club) => (
              <MenuItem key={club.id} value={club.id}>
                {club.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            select
            label="To Club"
            name="buyer_club_id"
            value={currentTransfer.buyer_club_id}
            onChange={handleInputChange}
            margin="normal"
            required
          >
            {clubs.map((club) => (
              <MenuItem key={club.id} value={club.id}>
                {club.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            select
            label="Transfer Type"
            name="type"
            value={currentTransfer.type}
            onChange={handleInputChange}
            margin="normal"
          >
            <MenuItem value="Permanent">Permanent</MenuItem>
            <MenuItem value="Loan">Loan</MenuItem>
            <MenuItem value="Free">Free</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Amount"
            name="amount"
            type="number"
            value={currentTransfer.amount}
            onChange={handleInputChange}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Status"
            name="status"
            value={currentTransfer.status}
            onChange={handleInputChange}
            margin="normal"
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="negotiation">Negotiation</MenuItem>
            <MenuItem value="accepted">Accepted</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransfersManagement;
