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
  CardContent,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import {
  getWishlists,
  getPlayers,
  getClubs,
  addToWishlist,
  removeFromWishlist
} from '../services/api';
import { showToast } from '../utils/toast';

const WishlistManagement = () => {
  const [wishlists, setWishlists] = useState([]);
  const [players, setPlayers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClub, setSelectedClub] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterClub, setFilterClub] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, [filterClub]);

  const fetchData = async () => {
    try {
      // Fetch clubs
      const clubsRes = await getClubs('approved');
      if (clubsRes.data.success) {
        setClubs(clubsRes.data.data);
      }

      // Fetch players
      const playersRes = await getPlayers();
      if (playersRes.data.success) {
        setPlayers(playersRes.data.data);
      }

      // Fetch wishlists
      if (filterClub) {
        const wishlistRes = await getWishlists(filterClub);
        if (wishlistRes.data.success) {
          setWishlists(wishlistRes.data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleOpenDialog = () => {
    setSelectedClub('');
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

    if (!selectedClub || !selectedPlayer) {
      setError('Please select both club and player');
      showToast.error('Please select both club and player');
      setLoading(false);
      return;
    }

    try {
      const res = await addToWishlist(parseInt(selectedClub), parseInt(selectedPlayer));
      if (res.data.success) {
        setSuccess('Player added to wishlist successfully');
        showToast.success('Player added to wishlist successfully');
        fetchData();
        setTimeout(() => {
          handleCloseDialog();
        }, 1500);
      } else {
        setError(res.data.message || 'Failed to add to wishlist');
        showToast.error(res.data.message || 'Failed to add to wishlist');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding to wishlist');
      showToast.error(err.response?.data?.message || 'Error adding to wishlist');
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
        showToast.success('Removed from wishlist');
        fetchData();
      } else {
        setError(res.data.message || 'Failed to remove from wishlist');
        showToast.error(res.data.message || 'Failed to remove from wishlist');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error removing from wishlist');
      showToast.error(err.response?.data?.message || 'Error removing from wishlist');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'fit': return 'success';
      case 'injured': return 'error';
      case 'recovering': return 'warning';
      default: return 'default';
    }
  };

  // Get available players (not owned by selected club)
  const getAvailablePlayers = () => {
    if (!selectedClub) return players;
    return players.filter(p => p.club_id != selectedClub);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <FavoriteIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#e91e63' }} />
          Player Wishlist
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Add to Wishlist
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Filter by Club</InputLabel>
                <Select
                  value={filterClub}
                  onChange={(e) => setFilterClub(e.target.value)}
                  label="Filter by Club"
                >
                  <MenuItem value="">All Clubs</MenuItem>
                  {clubs.map((club) => (
                    <MenuItem key={club.club_id} value={club.club_id}>
                      {club.club_name} ({club.country})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                {wishlists.length} player(s) in wishlist
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Wishlist Table */}
      {filterClub ? (
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
                {isAdmin && <TableCell><strong>Actions</strong></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {wishlists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 9 : 8} align="center">
                    <Box sx={{ py: 3 }}>
                      <FavoriteBorderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography color="text.secondary">
                        No players in wishlist. Add players you're interested in!
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                wishlists.map((item) => (
                  <TableRow key={item.wishlist_id}>
                    <TableCell>{item.player_name}</TableCell>
                    <TableCell>{item.age}</TableCell>
                    <TableCell>{item.nationality}</TableCell>
                    <TableCell>
                      <Chip label={item.position} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      {item.current_club || 'Free Agent'}
                      {item.club_country && ` (${item.club_country})`}
                    </TableCell>
                    <TableCell>{formatCurrency(item.market_value || 0)}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.health_status}
                        color={getHealthColor(item.health_status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                    {isAdmin && (
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
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Select a club to view their wishlist
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the filter above to choose a club and see which players they're interested in
          </Typography>
        </Paper>
      )}

      {/* Add to Wishlist Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Player to Wishlist</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Club</InputLabel>
            <Select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              label="Club"
            >
              {clubs.map((club) => (
                <MenuItem key={club.club_id} value={club.club_id}>
                  {club.club_name} ({club.country})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Player</InputLabel>
            <Select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              label="Player"
              disabled={!selectedClub}
            >
              {getAvailablePlayers().map((player) => (
                <MenuItem key={player.player_id} value={player.player_id}>
                  {player.name} - {player.position} ({player.club_name || 'Free Agent'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mt: 2 }}>
            Wishlists help clubs track players they're interested in during transfer windows
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

export default WishlistManagement;
