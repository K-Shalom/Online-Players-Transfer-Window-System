import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, Grid } from '@mui/material';
import { addClub, getClubs } from '../services/api';
import { showToast } from '../utils/toast';
import { useNavigate } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';

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
  const [clubLogo, setClubLogo] = useState(null);
  const [clubLogoPreview, setClubLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validating, setValidating] = useState(false);

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Please login to create your club profile.</Alert>
      </Box>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(''); // Clear error when user types
  };

  // Validate club name, license number, and country
  const validateClub = async () => {
    if (!form.club_name || !form.country || !form.license_no) {
      return;
    }

    setValidating(true);
    try {
      const res = await getClubs();
      if (res.data?.success) {
        const existingClubs = res.data.data;
        
        // Check club name with country
        const nameCountryMatch = existingClubs.find(c => 
          c.club_name.toLowerCase() === form.club_name.toLowerCase() && 
          c.country.toLowerCase() === form.country.toLowerCase()
        );
        
        if (nameCountryMatch) {
          setError(`Club "${form.club_name}" already exists in ${form.country}. This club is already registered.`);
          return false;
        }
        
        // Check club name exists in different country
        const nameOnlyMatch = existingClubs.find(c => 
          c.club_name.toLowerCase() === form.club_name.toLowerCase() && 
          c.country.toLowerCase() !== form.country.toLowerCase()
        );
        
        if (nameOnlyMatch) {
          setError(`Club "${form.club_name}" already exists in ${nameOnlyMatch.country}. You can continue with your club in ${form.country}.`);
          return true; // Allow to continue
        }
        
        // Check license number
        const licenseMatch = existingClubs.find(c => 
          c.license_no === form.license_no
        );
        
        if (licenseMatch) {
          setError(`License number "${form.license_no}" already exists for club "${licenseMatch.club_name}". Please use a different license number.`);
          return false;
        }
        
        setError(''); // Clear all errors if validations pass
        return true;
      }
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setValidating(false);
    }
    return true;
  };

  // Trigger validation on blur
  const handleBlur = async (field) => {
    if (field === 'club_name' || field === 'country' || field === 'license_no') {
      await validateClub();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.club_name || !form.country || !form.manager) {
      setError('Club name, country and manager are required');
      return;
    }

    // Final validation before submission
    const isValid = await validateClub();
    if (!isValid) {
      return;
    }

    setLoading(true);
    try {
      const clubData = {
        user_id: user.user_id,
        club_name: form.club_name,
        country: form.country,
        manager: form.manager,
        contact: form.contact,
        license_no: form.license_no,
        status: 'pending'
      };
      
      // Include logo if selected
      if (clubLogo) {
        clubData.logo = clubLogo;
      }

      const res = await addClub(clubData);
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
          {/* Logo Upload */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <ImageUpload
              currentImage={clubLogoPreview}
              onImageChange={(file, preview) => {
                setClubLogo(file);
                setClubLogoPreview(preview);
              }}
              label="Club Logo"
              shape="square"
              size={150}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Club Name" 
                name="club_name" 
                value={form.club_name} 
                onChange={handleChange} 
                onBlur={() => handleBlur('club_name')}
                fullWidth 
                required 
                helperText={validating ? 'Checking...' : ''}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label="Country" 
                name="country" 
                value={form.country} 
                onChange={handleChange} 
                onBlur={() => handleBlur('country')}
                fullWidth 
                required 
                helperText={validating ? 'Checking...' : ''}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Manager" name="manager" value={form.manager} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Contact Email/Phone" name="contact" value={form.contact} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField 
                label="License Number" 
                name="license_no" 
                value={form.license_no} 
                onChange={handleChange} 
                onBlur={() => handleBlur('license_no')}
                fullWidth 
                required
                helperText={validating ? 'Checking...' : ''}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button type="submit" variant="contained" disabled={loading || validating}>
              {loading ? 'Saving...' : validating ? 'Validating...' : 'Submit for Approval'}
            </Button>
            <Button variant="outlined" onClick={() => navigate('/club')}>Cancel</Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ClubSetup;
