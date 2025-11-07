import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Grid
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SportsSoccer as SoccerIcon
} from '@mui/icons-material';
import { getPlayers, getClubs, addPlayer, updatePlayer, deletePlayer } from '../services/api';

const PlayersManagementDataGrid = () => {
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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const playersRes = await getPlayers();
      const clubsRes = await getClubs('approved');
      
      if (playersRes.data.success) {
        setPlayers(playersRes.data.data);
      }
      if (clubsRes.data.success) {
        setClubs(clubsRes.data.data);
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
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
        club_id: player.club_id,
        market_value: player.market_value.replace(/[$,]/g, ''),
        contract_end: player.contract_end,
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

    if (!currentPlayer.name || !currentPlayer.age || !currentPlayer.position) {
      setError('Please fill all required fields');
      return;
    }

    try {
      if (editMode) {
        const res = await updatePlayer(currentPlayer);
        if (res.data.success) {
          setSuccess('Player updated successfully');
          fetchData();
          setTimeout(() => handleCloseDialog(), 1500);
        } else {
          setError(res.data.message || 'Failed to update player');
        }
      } else {
        const res = await addPlayer(currentPlayer);
        if (res.data.success) {
          setSuccess('Player added successfully');
          fetchData();
          setTimeout(() => handleCloseDialog(), 1500);
        } else {
          setError(res.data.message || 'Failed to add player');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving player');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;

    try {
      const res = await deletePlayer(id);
      if (res.data.success) {
        setSuccess('Player deleted successfully');
        fetchData();
      } else {
        setError(res.data.message || 'Failed to delete player');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting player');
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

  // DataGrid columns configuration
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
      hide: true,
    },
    {
      field: 'name',
      headerName: 'Player Name',
      width: 200,
      editable: false,
    },
    {
      field: 'age',
      headerName: 'Age',
      type: 'number',
      width: 80,
    },
    {
      field: 'nationality',
      headerName: 'Nationality',
      width: 150,
    },
    {
      field: 'position',
      headerName: 'Position',
      width: 130,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      field: 'club',
      headerName: 'Club',
      width: 150,
    },
    {
      field: 'market_value',
      headerName: 'Market Value',
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold" color="success.main">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'contract_end',
      headerName: 'Contract End',
      width: 130,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'health_status',
      headerName: 'Health',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getHealthColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'active' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit player">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenDialog(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete player">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row.id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <SoccerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Players Management (DataGrid)
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Player
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* DataGrid with built-in features */}
      <Paper sx={{ height: 650, width: '100%' }}>
        <DataGrid
          rows={players}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          checkboxSelection
          disableSelectionOnClick
          components={{
            Toolbar: GridToolbar,
          }}
          componentsProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          loading={loading}
          density="comfortable"
          sx={{
            '& .MuiDataGrid-cell:hover': {
              color: 'primary.main',
            },
          }}
        />
      </Paper>

      {/* Add/Edit Player Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Player' : 'Add New Player'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Player Name"
                value={currentPlayer.name}
                onChange={(e) => setCurrentPlayer({ ...currentPlayer, name: e.target.value })}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Age"
                value={currentPlayer.age}
                onChange={(e) => setCurrentPlayer({ ...currentPlayer, age: e.target.value })}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Nationality"
                value={currentPlayer.nationality}
                onChange={(e) => setCurrentPlayer({ ...currentPlayer, nationality: e.target.value })}
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth required>
                <InputLabel>Position</InputLabel>
                <Select
                  value={currentPlayer.position}
                  onChange={(e) => setCurrentPlayer({ ...currentPlayer, position: e.target.value })}
                  label="Position"
                >
                  <MenuItem value="Forward">Forward</MenuItem>
                  <MenuItem value="Midfielder">Midfielder</MenuItem>
                  <MenuItem value="Defender">Defender</MenuItem>
                  <MenuItem value="Goalkeeper">Goalkeeper</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Club</InputLabel>
                <Select
                  value={currentPlayer.club_id}
                  onChange={(e) => setCurrentPlayer({ ...currentPlayer, club_id: e.target.value })}
                  label="Club"
                >
                  <MenuItem value="">None</MenuItem>
                  {clubs.map((club) => (
                    <MenuItem key={club.id} value={club.id}>
                      {club.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Market Value"
                value={currentPlayer.market_value}
                onChange={(e) => setCurrentPlayer({ ...currentPlayer, market_value: e.target.value })}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="date"
                label="Contract End"
                value={currentPlayer.contract_end}
                onChange={(e) => setCurrentPlayer({ ...currentPlayer, contract_end: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Health Status</InputLabel>
                <Select
                  value={currentPlayer.health_status}
                  onChange={(e) => setCurrentPlayer({ ...currentPlayer, health_status: e.target.value })}
                  label="Health Status"
                >
                  <MenuItem value="fit">Fit</MenuItem>
                  <MenuItem value="injured">Injured</MenuItem>
                  <MenuItem value="recovering">Recovering</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Update' : 'Add'} Player
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlayersManagementDataGrid;
