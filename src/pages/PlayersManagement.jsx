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
  SportsSoccer as SoccerIcon,
} from '@mui/icons-material';
import { getPlayers, getClubs, addPlayer, updatePlayer, deletePlayer } from '../services/api';

const PlayersManagement = () => {
  const [players, setPlayers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState({
    player_id: null,
    name: '',
    age: '',
    nationality: '',
    position: '',
    club_id: '',
    market_value: '',
    contract_end: '',
    health_status: 'fit',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
    fetchClubs();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await getPlayers();
      if (res.data.success) {
        setPlayers(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
      setError('Failed to load players');
    } finally {
      setLoading(false);
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

  const handleOpenDialog = (player = null) => {
    if (player) {
      setEditMode(true);
      setCurrentPlayer({
        player_id: player.id,
        name: player.name,
        age: player.age,
        nationality: player.nationality,
        position: player.position,
        club_id: player.club_id || '',
        market_value: player.market_value.replace(/[$,]/g, ''),
        contract_end: player.contract_end || '',
        health_status: player.health_status,
      });
    } else {
      setEditMode(false);
      setCurrentPlayer({
        player_id: null,
        name: '',
        age: '',
        nationality: '',
        position: '',
        club_id: '',
        market_value: '',
        contract_end: '',
        health_status: 'fit',
      });
    }
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPlayer({
      player_id: null,
      name: '',
      age: '',
      nationality: '',
      position: '',
      club_id: '',
      market_value: '',
      contract_end: '',
      health_status: 'fit',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPlayer({ ...currentPlayer, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      if (!currentPlayer.name || !currentPlayer.position) {
        setError('Name and position are required');
        return;
      }

      const playerData = {
        ...currentPlayer,
        age: parseInt(currentPlayer.age) || null,
        market_value: parseFloat(currentPlayer.market_value) || 0,
        club_id: currentPlayer.club_id || null,
      };

      let res;
      if (editMode) {
        res = await updatePlayer(playerData);
      } else {
        res = await addPlayer(playerData);
      }

      if (res.data.success) {
        setSuccess(res.data.message);
        fetchPlayers();
        setTimeout(() => {
          handleCloseDialog();
          setSuccess('');
        }, 1500);
      } else {
        setError(res.data.message);
      }
    } catch (error) {
      console.error('Error saving player:', error);
      setError('Failed to save player');
    }
  };

  const handleDelete = async (playerId) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        const res = await deletePlayer(playerId);
        if (res.data.success) {
          setSuccess('Player deleted successfully');
          fetchPlayers();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(res.data.message);
        }
      } catch (error) {
        console.error('Error deleting player:', error);
        setError('Failed to delete player');
      }
    }
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'fit':
        return 'success';
      case 'injured':
        return 'error';
      case 'recovering':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Players Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Player
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Age</strong></TableCell>
                <TableCell><strong>Nationality</strong></TableCell>
                <TableCell><strong>Position</strong></TableCell>
                <TableCell><strong>Club</strong></TableCell>
                <TableCell><strong>Market Value</strong></TableCell>
                <TableCell><strong>Health Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">Loading...</TableCell>
                </TableRow>
              ) : players.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">No players found</TableCell>
                </TableRow>
              ) : (
                players.map((player) => (
                  <TableRow key={player.id} hover>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{player.age}</TableCell>
                    <TableCell>{player.nationality}</TableCell>
                    <TableCell>{player.position}</TableCell>
                    <TableCell>{player.club}</TableCell>
                    <TableCell>{player.market_value}</TableCell>
                    <TableCell>
                      <Chip
                        label={player.health_status}
                        size="small"
                        color={getHealthStatusColor(player.health_status)}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(player)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(player.id)}
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
        <DialogTitle>{editMode ? 'Edit Player' : 'Add New Player'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={currentPlayer.name}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Age"
            name="age"
            type="number"
            value={currentPlayer.age}
            onChange={handleInputChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Nationality"
            name="nationality"
            value={currentPlayer.nationality}
            onChange={handleInputChange}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Position"
            name="position"
            value={currentPlayer.position}
            onChange={handleInputChange}
            margin="normal"
            required
          >
            <MenuItem value="Goalkeeper">Goalkeeper</MenuItem>
            <MenuItem value="Defender">Defender</MenuItem>
            <MenuItem value="Midfielder">Midfielder</MenuItem>
            <MenuItem value="Forward">Forward</MenuItem>
          </TextField>
          <TextField
            fullWidth
            select
            label="Club"
            name="club_id"
            value={currentPlayer.club_id}
            onChange={handleInputChange}
            margin="normal"
          >
            <MenuItem value="">Free Agent</MenuItem>
            {clubs.map((club) => (
              <MenuItem key={club.id} value={club.id}>
                {club.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Market Value"
            name="market_value"
            type="number"
            value={currentPlayer.market_value}
            onChange={handleInputChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Contract End Date"
            name="contract_end"
            type="date"
            value={currentPlayer.contract_end}
            onChange={handleInputChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            select
            label="Health Status"
            name="health_status"
            value={currentPlayer.health_status}
            onChange={handleInputChange}
            margin="normal"
          >
            <MenuItem value="fit">Fit</MenuItem>
            <MenuItem value="injured">Injured</MenuItem>
            <MenuItem value="recovering">Recovering</MenuItem>
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

export default PlayersManagement;
