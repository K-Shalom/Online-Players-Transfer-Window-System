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
  CircularProgress,
  Avatar,
  Tooltip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  SportsSoccer as SportsSoccerIcon
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
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 600,
          color: 'primary.main',
          fontSize: { xs: '1.5rem', sm: '2rem' }
        }}>
          Players Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            textTransform: 'none',
            px: 3,
            py: 1,
            borderRadius: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            }
          }}
        >
          Add Player
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          {success}
        </Alert>
      )}

      {/* Players Table */}
      <Paper 
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          '& .MuiTable-root': {
            minWidth: 1000
          }
        }}
      >
        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {[
                  { id: 'name', label: 'Player Name' },
                  { id: 'age', label: 'Age', align: 'center' },
                  { id: 'nationality', label: 'Nationality' },
                  { id: 'position', label: 'Position' },
                  { id: 'club', label: 'Club' },
                  { id: 'market_value', label: 'Market Value', align: 'right' },
                  { id: 'health_status', label: 'Status', align: 'center' },
                  { id: 'actions', label: 'Actions', align: 'center' }
                ].map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    sx={{
                      fontWeight: 600,
                      backgroundColor: 'background.paper',
                      color: 'text.primary',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      py: 1.5,
                      px: 2
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : players.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <SportsSoccerIcon sx={{ fontSize: 40, opacity: 0.5 }} />
                      <Typography>No players found</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                players.map((player) => (
                  <TableRow 
                    key={player.id} 
                    hover 
                    sx={{ 
                      '&:last-child td': { borderBottom: 0 },
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500, py: 1.5, px: 2 }}>
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
                    <TableCell align="center" sx={{ py: 1.5, px: 2 }}>
                      {player.age}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {player.nationality_flag && (
                          <img 
                            src={player.nationality_flag} 
                            alt={player.nationality}
                            style={{ width: 24, height: 16, borderRadius: 2 }}
                          />
                        )}
                        <span>{player.nationality}</span>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2 }}>
                      <Chip
                        label={player.position}
                        size="small"
                        color={
                          player.position === 'Goalkeeper' ? 'primary' : 
                          player.position === 'Defender' ? 'success' :
                          player.position === 'Midfielder' ? 'warning' : 'error'
                        }
                        sx={{ 
                          fontWeight: 500,
                          minWidth: 80,
                          '& .MuiChip-label': { px: 1.5 }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5, px: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {player.club_logo && (
                          <Avatar 
                            src={player.club_logo} 
                            alt={player.club}
                            sx={{ width: 24, height: 24 }}
                          />
                        )}
                        <span>{player.club || 'Free Agent'}</span>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5, px: 2, fontWeight: 500 }}>
                      {player.market_value ? `$${parseInt(player.market_value).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5, px: 2 }}>
                      <Chip
                        label={player.health_status}
                        size="small"
                        color={getHealthStatusColor(player.health_status)}
                        sx={{ 
                          textTransform: 'capitalize',
                          minWidth: 80,
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
                    <TableCell align="center" sx={{ py: 1.5, px: 2 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(player)}
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: 'primary.light',
                                color: 'primary.contrastText'
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(player.id)}
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: 'error.light',
                                color: 'error.contrastText'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
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
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          py: 2,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" component="div">
            {editMode ? 'Edit Player' : 'Add New Player'}
          </Typography>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={handleCloseDialog}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ '& > :not(style)': { my: 1.5 } }}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={currentPlayer.name}
              onChange={handleInputChange}
              margin="dense"
              required
              variant="outlined"
              size="small"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Age"
                name="age"
                type="number"
                value={currentPlayer.age}
                onChange={handleInputChange}
                margin="dense"
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label="Nationality"
                name="nationality"
                value={currentPlayer.nationality}
                onChange={handleInputChange}
                margin="dense"
                variant="outlined"
                size="small"
              />
            </Box>
            <FormControl fullWidth margin="dense" size="small">
              <InputLabel>Position</InputLabel>
              <Select
                name="position"
                value={currentPlayer.position}
                onChange={handleInputChange}
                label="Position"
                variant="outlined"
              >
                <MenuItem value="Goalkeeper">Goalkeeper</MenuItem>
                <MenuItem value="Defender">Defender</MenuItem>
                <MenuItem value="Midfielder">Midfielder</MenuItem>
                <MenuItem value="Forward">Forward</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense" size="small">
              <InputLabel>Club</InputLabel>
              <Select
                name="club_id"
                value={currentPlayer.club_id}
                onChange={handleInputChange}
                label="Club"
                variant="outlined"
              >
                <MenuItem value="">Free Agent</MenuItem>
                {clubs.map((club) => (
                  <MenuItem key={club.id} value={club.id}>
                    {club.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Market Value ($)"
              name="market_value"
              type="number"
              value={currentPlayer.market_value}
              onChange={handleInputChange}
              margin="dense"
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Contract End Date"
              name="contract_end"
              type="date"
              value={currentPlayer.contract_end}
              onChange={handleInputChange}
              margin="dense"
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth margin="dense" size="small">
              <InputLabel>Health Status</InputLabel>
              <Select
                name="health_status"
                value={currentPlayer.health_status}
                onChange={handleInputChange}
                label="Health Status"
                variant="outlined"
              >
                <MenuItem value="fit">Fit</MenuItem>
                <MenuItem value="injured">Injured</MenuItem>
                <MenuItem value="recovering">Recovering</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={handleCloseDialog}
            color="inherit"
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            sx={{ 
              textTransform: 'none',
              px: 3,
              '&:hover': {
                boxShadow: 2
              }
            }}
          >
            {editMode ? 'Update' : 'Add'} Player
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlayersManagement;
