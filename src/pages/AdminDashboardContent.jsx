import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Pending from '@mui/icons-material/Pending';
import DashboardChart from '../components/DashboardChart';

const AdminDashboardContent = () => {
  const [loading, setLoading] = useState(true);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalClubs: 0,
    pendingTransfers: 0,
    completedTransfers: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Mock data for recent transfers
        setRecentTransfers([
          { 
            id: 1, 
            player: 'Player One', 
            from: 'Team A', 
            to: 'Team B', 
            amount: '$5,000,000', 
            status: 'completed' 
          },
          { 
            id: 2, 
            player: 'Player Two', 
            from: 'Team C', 
            to: 'Team D', 
            amount: '$3,500,000', 
            status: 'pending' 
          }
        ]);
        
        // Mock stats
        setStats({
          totalPlayers: 42,
          totalClubs: 10,
          pendingTransfers: 5,
          completedTransfers: 15
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  let user = {};
  try {
    const userRaw = localStorage.getItem('user');
    user = userRaw ? JSON.parse(userRaw) : {};
  } catch (e) {
    user = {};
  }
  return (
    <Box sx={{ position: 'relative', p: 3 }}>
      {/* Overlay Loading Spinner */}
      {loading && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bgcolor: 'rgba(255,255,255,0.8)',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <CircularProgress size={64} color="primary" />
        </Box>
      )}

      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Welcome back, {user?.name || 'Admin'}! 👋
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Here's what's happening with your transfer system today.
        </Typography>
      </Box>

      {/* Dynamic Chart for Dashboard Stats */}
      <DashboardChart stats={stats} />

      {/* Recent Transfers Table */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3 
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Recent Transfers
            </Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => navigate('/transfers')}
            >
              View All
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Player</strong></TableCell>
                  <TableCell><strong>From</strong></TableCell>
                  <TableCell><strong>To</strong></TableCell>
                  <TableCell><strong>Amount</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress size={24} color="primary" />
                    </TableCell>
                  </TableRow>
                ) : recentTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No recent transfers</TableCell>
                  </TableRow>
                ) : recentTransfers.map((transfer) => (
                  <TableRow key={transfer.id} hover>
                    <TableCell>{transfer.player}</TableCell>
                    <TableCell>{transfer.from}</TableCell>
                    <TableCell>{transfer.to}</TableCell>
                    <TableCell>{transfer.amount}</TableCell>
                    <TableCell>
                      <Chip
                        label={transfer.status}
                        size="small"
                        color={
                          transfer.status === 'completed' ? 'success' :
                          transfer.status === 'pending' ? 'warning' : 'info'
                        }
                        icon={transfer.status === 'completed' ? <CheckCircle /> : <Pending />}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
    );
  };

export default AdminDashboardContent;
