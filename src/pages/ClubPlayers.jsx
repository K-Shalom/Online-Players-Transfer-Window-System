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
  Card,
  CardContent,
  Grid,
  Avatar,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  SportsSoccer as SoccerIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { getPlayers, getClubs } from '../services/api';

const ClubPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [clubInfo, setClubInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterPlayers();
  }, [players, searchTerm, positionFilter, healthFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get club info
      const clubsRes = await getClubs();
      if (clubsRes.data.success) {
        const userClub = clubsRes.data.data.find(c => c.user_id == user.user_id);
        setClubInfo(userClub);

        if (userClub) {
          // Get players
          const playersRes = await getPlayers();
          if (playersRes.data.success) {
            const clubPlayers = playersRes.data.data.filter(p => p.club_id == userClub.id);
            console.log('Club ID:', userClub.id, 'All players:', playersRes.data.data, 'Club players:', clubPlayers);
            setPlayers(clubPlayers);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const filterPlayers = () => {
    let filtered = [...players];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nationality.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Position filter
    if (positionFilter) {
      filtered = filtered.filter(p => p.position === positionFilter);
    }

    // Health filter
    if (healthFilter) {
      filtered = filtered.filter(p => p.health_status === healthFilter);
    }

    setFilteredPlayers(filtered);
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

  const positions = [...new Set(players.map(p => p.position))];
  const totalValue = players.reduce((sum, p) => sum + parseFloat(p.market_value || 0), 0);
  const avgAge = players.length > 0 ? (players.reduce((sum, p) => sum + p.age, 0) / players.length).toFixed(1) : 0;

  if (!clubInfo) {
    return (
      <Alert severity="warning">
        No club profile found. Please contact administrator.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        <SoccerIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        My Squad - {clubInfo.club_name}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Total Players</Typography>
              <Typography variant="h4">{players.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Squad Value</Typography>
              <Typography variant="h4">{formatCurrency(totalValue)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Average Age</Typography>
              <Typography variant="h4">{avgAge} years</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Position</InputLabel>
              <Select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                label="Position"
              >
                <MenuItem value="">All Positions</MenuItem>
                {positions.map(pos => (
                  <MenuItem key={pos} value={pos}>{pos}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Health Status</InputLabel>
              <Select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                label="Health Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="fit">Fit</MenuItem>
                <MenuItem value="injured">Injured</MenuItem>
                <MenuItem value="recovering">Recovering</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Players Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Player</strong></TableCell>
              <TableCell><strong>Age</strong></TableCell>
              <TableCell><strong>Nationality</strong></TableCell>
              <TableCell><strong>Position</strong></TableCell>
              <TableCell><strong>Market Value</strong></TableCell>
              <TableCell><strong>Contract End</strong></TableCell>
              <TableCell><strong>Health</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPlayers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ py: 3 }}>
                    <SoccerIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography color="text.secondary">
                      {searchTerm || positionFilter || healthFilter 
                        ? 'No players match your filters' 
                        : 'No players in your squad'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredPlayers.map((player) => (
                <TableRow key={player.player_id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {player.name[0]}
                      </Avatar>
                      <Typography variant="body2" fontWeight="bold">
                        {player.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{player.age}</TableCell>
                  <TableCell>{player.nationality}</TableCell>
                  <TableCell>
                    <Chip label={player.position} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>{formatCurrency(player.market_value || 0)}</TableCell>
                  <TableCell>{new Date(player.contract_end).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={player.health_status}
                      color={getHealthColor(player.health_status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={player.status}
                      color={player.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
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

export default ClubPlayers;
