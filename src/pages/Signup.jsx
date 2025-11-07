import React, { useState, useContext } from 'react';
import { Box, TextField, Button, Typography, Alert, MenuItem, IconButton, Tooltip, Paper } from '@mui/material';
import { Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signupUser } from '../services/api';
import { ThemeContext } from '../context/ThemeContext';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('club'); // default role
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { mode, toggleTheme } = useContext(ThemeContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate inputs
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      const res = await signupUser(name, email, password, role);
      if (res.data.success) {
        setSuccess(res.data.message);
        setTimeout(() => navigate('/login'), 1500); // redirect to login
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error('Signup error', err);
      const errorMsg = err.response?.data?.message || 'Server error';
      setError(errorMsg);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Signup</Typography>
        <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
          <IconButton onClick={toggleTheme}>
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Paper elevation={3} sx={{ p: 3 }}>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Name"
          fullWidth
          sx={{ mb: 2 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label="Email"
          type="email"
          fullWidth
          sx={{ mb: 2 }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          sx={{ mb: 2 }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <TextField
          select
          label="Role"
          fullWidth
          sx={{ mb: 2 }}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="club">Club</MenuItem>
        </TextField>
        <Button variant="contained" type="submit" fullWidth>Signup</Button>
      </form>
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          Already have an account?{' '}
          <Button 
            variant="text" 
            onClick={() => navigate('/login')}
            sx={{ textTransform: 'none' }}
          >
            Login here
          </Button>
        </Typography>
      </Box>
      </Paper>
    </Box>
  );
};

export default Signup;
