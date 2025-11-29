import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    MenuItem,
    Button,
    Avatar,
    Chip,
    Paper,
    InputAdornment,
    Slider,
    FormControl,
    InputLabel,
    Select,
    Alert,
    CircularProgress,
    Divider,
    Stack,
    Container,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    SportsSoccer as SoccerIcon,
    AttachMoney as MoneyIcon,
    Clear as ClearIcon,
    Sort as SortIcon
} from '@mui/icons-material';
import { getPlayers, createOffer, getClubs, getTransfers } from '../services/api';

const PlayerMarket = () => {
    const [players, setPlayers] = useState([]);
    const [filteredPlayers, setFilteredPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Offer dialog states
    const [offerDialogOpen, setOfferDialogOpen] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [offerAmount, setOfferAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [userClub, setUserClub] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [position, setPosition] = useState('');
    const [nationality, setNationality] = useState('');
    const [ageRange, setAgeRange] = useState([16, 40]);
    const [valueRange, setValueRange] = useState([0, 100000000]);
    const [availability, setAvailability] = useState('all');
    const [sortBy, setSortBy] = useState('name');

    useEffect(() => {
        fetchPlayers();
        fetchUserClub();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [players, searchTerm, position, nationality, ageRange, valueRange, availability, sortBy]);

    const fetchPlayers = async () => {
        try {
            setLoading(true);
            const res = await getPlayers();
            console.log('Players API Response:', res.data);
            if (res.data.success) {
                console.log('Players data:', res.data.data);
                setPlayers(res.data.data);
            } else {
                console.error('API returned success=false:', res.data.message);
                setError(res.data.message || 'Failed to load players');
            }
        } catch (err) {
            console.error('Error fetching players:', err);
            console.error('Error response:', err.response?.data);
            setError(err.response?.data?.message || 'Failed to load players');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserClub = async () => {
        try {
            const res = await getClubs();
            if (res.data.success) {
                const club = res.data.data.find(c => c.user_id == user.user_id);
                setUserClub(club);
            }
        } catch (err) {
            console.error('Error fetching user club:', err);
        }
    };

    const handleMakeOffer = (player) => {
        if (!userClub) {
            setError('You need to have a club to make offers');
            return;
        }
        setSelectedPlayer(player);
        setOfferAmount('');
        setOfferDialogOpen(true);
    };

    const handleCloseOfferDialog = () => {
        setOfferDialogOpen(false);
        setSelectedPlayer(null);
        setOfferAmount('');
    };

    const handleSubmitOffer = async () => {
        if (!offerAmount || parseFloat(offerAmount) <= 0) {
            setError('Please enter a valid offer amount');
            return;
        }

        if (!selectedPlayer || !userClub) {
            setError('Missing player or club information');
            return;
        }

        try {
            setSubmitting(true);

            // First, check if there's an active transfer for this player
            const transfersRes = await getTransfers();
            if (!transfersRes.data.success) {
                setError('Failed to fetch transfers');
                return;
            }

            const playerTransfer = transfersRes.data.data.find(
                t => t.player_id == selectedPlayer.id && t.status === 'pending'
            );

            if (!playerTransfer) {
                setError('No active transfer found for this player. The player must be listed for transfer first.');
                setSubmitting(false);
                return;
            }

            // Create the offer
            const offerData = {
                transfer_id: playerTransfer.transfer_id,
                buyer_club_id: userClub.id,
                offered_amount: parseFloat(offerAmount)
            };

            const res = await createOffer(offerData);

            if (res.data.success) {
                setSuccess('Offer submitted successfully!');
                handleCloseOfferDialog();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(res.data.message || 'Failed to submit offer');
            }
        } catch (err) {
            console.error('Error submitting offer:', err);
            setError(err.response?.data?.message || 'Failed to submit offer');
        } finally {
            setSubmitting(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...players];

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (position) {
            filtered = filtered.filter(p => p.position === position);
        }

        if (nationality) {
            filtered = filtered.filter(p => p.nationality === nationality);
        }

        // Only filter by age if the player has an age value
        filtered = filtered.filter(p => {
            if (!p.age) return true; // Include players without age
            return p.age >= ageRange[0] && p.age <= ageRange[1];
        });

        // Only filter by value if the player has a market value
        filtered = filtered.filter(p => {
            if (!p.market_value) return true; // Include players without market value
            const value = parseFloat(p.market_value?.toString().replace(/[$,]/g, '') || 0);
            return value >= valueRange[0] && value <= valueRange[1];
        });

        if (availability === 'free') {
            filtered = filtered.filter(p => !p.club_id || p.club_id === null);
        } else if (availability === 'listed') {
            filtered = filtered.filter(p => p.club_id !== null);
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'age':
                    return a.age - b.age;
                case 'value':
                    const aVal = parseFloat(a.market_value?.toString().replace(/[$,]/g, '') || 0);
                    const bVal = parseFloat(b.market_value?.toString().replace(/[$,]/g, '') || 0);
                    return bVal - aVal;
                default:
                    return 0;
            }
        });

        setFilteredPlayers(filtered);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setPosition('');
        setNationality('');
        setAgeRange([16, 40]);
        setValueRange([0, 100000000]);
        setAvailability('all');
        setSortBy('name');
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

    const getPositionColor = (pos) => {
        switch (pos) {
            case 'Goalkeeper': return 'primary';
            case 'Defender': return 'success';
            case 'Midfielder': return 'warning';
            case 'Forward': return 'error';
            default: return 'default';
        }
    };

    const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
    const nationalities = [...new Set(players.map(p => p.nationality))].filter(Boolean);

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
            {/* Sidebar - Fixed Width */}
            <Box sx={{
                width: 280,
                flexShrink: 0,
                p: 3,
                borderRight: '1px solid #e0e0e0',
                bgcolor: '#fff',
                height: '100vh',
                position: 'sticky',
                top: 0,
                overflowY: 'auto'
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterIcon fontSize="small" /> Filters
                    </Typography>
                    <Button size="small" onClick={clearFilters} sx={{ textTransform: 'none' }}>
                        Reset
                    </Button>
                </Box>

                <Stack spacing={3}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                        }}
                    />

                    <FormControl fullWidth size="small">
                        <InputLabel>Position</InputLabel>
                        <Select value={position} onChange={(e) => setPosition(e.target.value)} label="Position">
                            <MenuItem value="">Any Position</MenuItem>
                            {positions.map(pos => <MenuItem key={pos} value={pos}>{pos}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                        <InputLabel>Nationality</InputLabel>
                        <Select value={nationality} onChange={(e) => setNationality(e.target.value)} label="Nationality">
                            <MenuItem value="">Any Nationality</MenuItem>
                            {nationalities.map(nat => <MenuItem key={nat} value={nat}>{nat}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <Box>
                        <Typography variant="caption" color="text.secondary" gutterBottom fontWeight={500}>
                            Age Range: {ageRange[0]} - {ageRange[1]} yrs
                        </Typography>
                        <Slider
                            value={ageRange}
                            onChange={(e, v) => setAgeRange(v)}
                            valueLabelDisplay="auto"
                            min={16}
                            max={40}
                            size="small"
                        />
                    </Box>

                    <Box>
                        <Typography variant="caption" color="text.secondary" gutterBottom fontWeight={500}>
                            Value: {formatCurrency(valueRange[0])} - {formatCurrency(valueRange[1])}
                        </Typography>
                        <Slider
                            value={valueRange}
                            onChange={(e, v) => setValueRange(v)}
                            valueLabelDisplay="auto"
                            min={0}
                            max={100000000}
                            step={1000000}
                            valueLabelFormat={formatCurrency}
                            size="small"
                        />
                    </Box>

                    <FormControl fullWidth size="small">
                        <InputLabel>Sort By</InputLabel>
                        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="Sort By">
                            <MenuItem value="name">Name (A-Z)</MenuItem>
                            <MenuItem value="age">Age (Youngest)</MenuItem>
                            <MenuItem value="value">Value (Highest)</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Box>

            {/* Main Content - Flexible Width */}
            <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e', mb: 1 }}>
                            Transfer Market
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Browse and negotiate for players
                        </Typography>
                    </Box>
                    <Chip
                        icon={<SoccerIcon />}
                        label={`${filteredPlayers.length} Players Available`}
                        color="primary"
                        variant="outlined"
                        sx={{ px: 1, py: 2.5, borderRadius: 2, fontSize: '1rem' }}
                    />
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : filteredPlayers.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, opacity: 0.6 }}>
                        <SoccerIcon sx={{ fontSize: 64, mb: 2 }} />
                        <Typography variant="h6">No players found matching your criteria</Typography>
                    </Box>
                ) : (
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 3
                    }}>
                        {filteredPlayers.map(player => {
                            const marketValue = parseFloat(player.market_value?.toString().replace(/[$,]/g, '') || 0);

                            return (
                                <Card
                                    key={player.id}
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        border: '1px solid #e0e0e0',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)'
                                        }
                                    }}
                                >
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Avatar
                                                src={player.photo_url}
                                                sx={{ width: 64, height: 64, mr: 2, border: '1px solid #eee' }}
                                            >
                                                {player.name?.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                                    {player.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    {player.nationality} • {player.age} yrs
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
                                            <Chip
                                                label={player.position}
                                                size="small"
                                                color={getPositionColor(player.position)}
                                                sx={{ fontWeight: 500 }}
                                            />
                                            <Chip
                                                label={player.club || 'Free Agent'}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>

                                        <Divider sx={{ mb: 2 }} />

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Market Value
                                            </Typography>
                                            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                                                {formatCurrency(marketValue)}
                                            </Typography>
                                        </Box>

                                        <Button
                                            fullWidth
                                            variant="contained"
                                            disableElevation
                                            startIcon={<MoneyIcon />}
                                            onClick={() => handleMakeOffer(player)}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                py: 1,
                                                borderRadius: 2
                                            }}
                                        >
                                            Make Offer
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                )}

                {/* Offer Dialog */}
                <Dialog open={offerDialogOpen} onClose={handleCloseOfferDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>Make an Offer</DialogTitle>
                    <DialogContent>
                        {selectedPlayer && (
                            <Box sx={{ pt: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    {selectedPlayer.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {selectedPlayer.position} • {selectedPlayer.nationality}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Market Value: {formatCurrency(parseFloat(selectedPlayer.market_value?.toString().replace(/[$,]/g, '') || 0))}
                                </Typography>

                                <TextField
                                    fullWidth
                                    label="Offer Amount"
                                    type="number"
                                    value={offerAmount}
                                    onChange={(e) => setOfferAmount(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                    }}
                                    helperText="Enter your offer amount in dollars"
                                />
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseOfferDialog} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitOffer}
                            variant="contained"
                            disabled={submitting}
                            startIcon={submitting ? <CircularProgress size={20} /> : <MoneyIcon />}
                        >
                            {submitting ? 'Submitting...' : 'Submit Offer'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Success Snackbar */}
                <Snackbar
                    open={!!success}
                    autoHideDuration={3000}
                    onClose={() => setSuccess('')}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert severity="success" onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                </Snackbar>
            </Box>
        </Box>
    );
};

export default PlayerMarket;
