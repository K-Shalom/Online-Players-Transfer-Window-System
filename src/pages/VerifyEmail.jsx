import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Button, Paper } from '@mui/material';
import { CheckCircle, Error } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../services/api';
import { showToast } from '../utils/toast';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verify = async () => {
      try {
        const res = await verifyEmail(token);
        if (res.data.success) {
          setStatus('success');
          setMessage(res.data.message);
          showToast.success('Email verified successfully! You can now login.');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(res.data.message);
          showToast.error(res.data.message);
        }
      } catch (err) {
        setStatus('error');
        const errorMsg = err.response?.data?.message || 'Verification failed';
        setMessage(errorMsg);
        showToast.error(errorMsg);
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
        {status === 'verifying' && (
          <>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Verifying your email...
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Please wait while we verify your email address.
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="success.main">
              Email Verified!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {message}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Redirecting to login page...
            </Typography>
          </>
        )}

        {status === 'error' && (
          <>
            <Error sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error.main">
              Verification Failed
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              {message}
            </Alert>
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              fullWidth
            >
              Go to Login
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default VerifyEmail;
