import React, { useState, useContext } from 'react';
import { Box, TextField, Button, Typography, Alert, IconButton, Tooltip, Paper, CircularProgress } from '@mui/material';
import { Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { loginUser, sendVerificationEmail } from '../services/api';
import { ThemeContext } from '../context/ThemeContext';
import { showToast } from '../utils/toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const navigate = useNavigate();
  const { mode, toggleTheme } = useContext(ThemeContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validate inputs
    if (!username || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }
    
    try {
      const res = await loginUser(username, password);
      console.log('Login response:', res.data); // Debug log
      if (res.data.success) {
        // Store user data in localStorage
        const userData = {
          user_id: res.data.user_id,
          name: res.data.name,
          email: res.data.email,
          role: res.data.role
        };
        localStorage.setItem('user', JSON.stringify(userData));
        
        showToast.success('Login successful!');
        
        // Redirect based on role with full page reload
        if (res.data.role === 'admin') {
          window.location.href = '/'; // admin dashboard
        } else {
          window.location.href = '/dashboard'; // club user dashboard
        }
      } else {
        if (res.data.email_not_verified) {
          setEmailNotVerified(true);
        }
        setError(res.data.message || 'Login failed');
        showToast.error(res.data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error', err);
      let errorMessage = '';
      if (err.response) {
        const serverMessage = err.response.data && err.response.data.message 
          ? err.response.data.message 
          : JSON.stringify(err.response.data);
        errorMessage = serverMessage || `Server error (${err.response.status})`;
        if (err.response.data?.email_not_verified) {
          setEmailNotVerified(true);
        }
      } else if (err.request) {
        errorMessage = 'Cannot connect to server. Please check: 1) XAMPP is running 2) Backend URL is correct';
      } else {
        errorMessage = err.message || 'Server error';
      }
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!username) {
      showToast.error('Please enter your email address');
      return;
    }
    
    setResendingVerification(true);
    try {
      const res = await sendVerificationEmail(username);
      if (res.data.success) {
        showToast.success('Verification email sent! Check your inbox.');
        // In development, show the link
        if (res.data.verification_link) {
          console.log('Verification link:', res.data.verification_link);
        }
      } else {
        showToast.error(res.data.message);
      }
    } catch (err) {
      showToast.error('Failed to send verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Login</Typography>
        <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
          <IconButton onClick={toggleTheme}>
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper elevation={3} sx={{ p: 3 }}>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          sx={{ mb: 2 }}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          sx={{ mb: 2 }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button 
          variant="contained" 
          type="submit" 
          fullWidth
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>
        {emailNotVerified && (
          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 1 }}
            onClick={handleResendVerification}
            disabled={resendingVerification}
            startIcon={resendingVerification ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
          </Button>
        )}
      </form>
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          Don't have an account?{' '}
          <Button 
            variant="text" 
            onClick={() => navigate('/signup')}
            sx={{ textTransform: 'none' }}
          >
            Sign up here
          </Button>
        </Typography>
      </Box>
      </Paper>
    </Box>
  );
};

export default Login;
