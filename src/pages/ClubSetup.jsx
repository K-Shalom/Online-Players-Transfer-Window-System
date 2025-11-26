import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, Grid } from '@mui/material';
import { addClub } from '../services/api';
import { showToast } from '../utils/toast';
import { useNavigate } from 'react-router-dom';

const ClubSetup = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [form, setForm] = useState({
    club_name: '',
    country: '',
    manager: user?.name || '',
    contact: user?.email || '',
    license_no: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Please login to create your club profile.</Alert>
      </Box>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.club_name || !form.country || !form.manager) {
      setError('Club name, country and manager are required');
      return;
    }
    setLoading(true);
    try {
      const res = await addClub({
        user_id: user.user_id,
        club_name: form.club_name,
        country: form.country,
        manager: form.manager,
        contact: form.contact,
        license_no: form.license_no,
        status: 'pending'
      });
      if (res.data?.success) {
        setSuccess('Club profile submitted for approval');
        showToast.success('Club profile submitted for approval');
        setTimeout(() => navigate('/club'), 1200);
      } else {
        const msg = res.data?.message || 'Failed to create club profile';
        setError(msg);
        showToast.error(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Server error creating club profile';
      setError(msg);
      showToast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Create Club Profile</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Provide your club information. An admin will review and approve it.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField label="Club Name" name="club_name" value={form.club_name} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Country" name="country" value={form.country} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Manager" name="manager" value={form.manager} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Contact Email/Phone" name="contact" value={form.contact} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="License Number" name="license_no" value={form.license_no} onChange={handleChange} fullWidth />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Submit for Approval'}
            </Button>
            <Button variant="outlined" onClick={() => navigate('/club')}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ClubSetup;
