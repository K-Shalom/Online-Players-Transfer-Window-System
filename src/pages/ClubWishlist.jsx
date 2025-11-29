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
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import {
  getWishlists,
  getPlayers,
  getClubs,
  addToWishlist,
  removeFromWishlist
} from '../services/api';

const ClubWishlist = () => {
  const [wishlists, setWishlists] = useState([]);
  const [players, setPlayers] = useState([]);
  const [clubInfo, setClubInfo] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch club info
      const clubsRes = await getClubs();
      if (clubsRes.data.success) {
        const userClub = clubsRes.data.data.find(c => c.user_id == user.user_id);
        setClubInfo(userClub);

        if (userClub) {
          // Fetch players
          const playersRes = await getPlayers();
          if (playersRes.data.success) {
            // Filter out own players
            const availablePlayers = playersRes.data.data.filter(p => p.club_id != userClub.id);
            setPlayers(availablePlayers);
          }

          // Fetch wishlist
          const wishlistRes = await getWishlists(userClub.id);
          if (wishlistRes.data.success) {
            setWishlists(wishlistRes.data.data);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleOpenDialog = () => {
    setSelectedPlayer('');
    setError('');
    setSuccess('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!selectedPlayer) {
      setError('Please select a player');
      setLoading(false);
      return;
    }

    try {
      const res = await addToWishlist(clubInfo.id, parseInt(selectedPlayer));
      if (res.data.success) {
        setSuccess('Player added to wishlist successfully');
        fetchData();
        setTimeout(() => {
          handleCloseDialog();
        }, 1500);
      } else {
        setError(res.data.message || 'Failed to add to wishlist');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding to wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (wishlistId) => {
    if (!window.confirm('Remove this player from wishlist?')) return;

    try {
      const res = await removeFromWishlist(wishlistId);
      if (res.data.success) {
        setSuccess('Removed from wishlist');
        fetchData();
      } else {
        setError(res.data.message || 'Failed to remove from wishlist');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error removing from wishlist');
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

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'fit': return 'success';
      case 'injured': return 'error';
      case 'recovering': return 'warning';
      default: return 'default';
    }
  };

  if (!clubInfo) {
    return (
      <Alert severity="warning">
        No club profile found. Please contact administrator.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <FavoriteIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#e91e63' }} />
          My Wishlist - {clubInfo.club_name}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Player
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Alert severity="info" sx={{ mb: 3 }}>
        Track players you're interested in. Get notified when they become available for transfer!
      </Alert>

      {/* Stats Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Wishlist Summary</Typography>
          <Typography variant="body1">
            <strong>{wishlists.length}</strong> players in your wishlist
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total estimated value: {formatCurrency(wishlists.reduce((sum, w) => sum + parseMarketValue(w.market_value), 0))}
          </Typography>
        </CardContent>
      </Card>

      {/* Wishlist Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Player</strong></TableCell>
              <TableCell><strong>Age</strong></TableCell>
              <TableCell><strong>Nationality</strong></TableCell>
              <TableCell><strong>Position</strong></TableCell>
              <TableCell><strong>Current Club</strong></TableCell>
              <TableCell><strong>Market Value</strong></TableCell>
              <TableCell><strong>Health</strong></TableCell>
              <TableCell><strong>Added</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {wishlists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Box sx={{ py: 3 }}>
                    <FavoriteBorderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">
                      Your wishlist is empty. Add players you're interested in!
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenDialog}
                      sx={{ mt: 2 }}
                    >
                      Add First Player
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              wishlists.map((item) => (
                <TableRow key={item.wishlist_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {item.player_name}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.age}</TableCell>
                  <TableCell>{item.nationality}</TableCell>
                  <TableCell>
                    <Chip label={item.position} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {item.current_club || 'Free Agent'}
                    {item.club_country && ` (${item.club_country})`}
                  </TableCell>
                  <TableCell>{formatCurrency(parseMarketValue(item.market_value))}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.health_status}
                      color={getHealthColor(item.health_status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Tooltip title="Remove from wishlist">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(item.wishlist_id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add to Wishlist Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Player to Wishlist</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Player</InputLabel>
            <Select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              label="Select Player"
            >
              {players.map((player) => (
                <MenuItem key={player.player_id} value={player.player_id}>
                  {player.name} - {player.position} ({player.club_name || 'Free Agent'}) - {formatCurrency(parseMarketValue(player.market_value))}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mt: 2 }}>
            Add players you're interested in to track their availability during transfer windows
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={<FavoriteIcon />}
          >
            {loading ? 'Adding...' : 'Add to Wishlist'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClubWishlist;
