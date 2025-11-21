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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  CheckCircle,
  Pending,
} from '@mui/icons-material';
import { getClubs, addClub, updateClub, deleteClub, approveClub, rejectClub } from '../services/api';
import { showToast } from '../utils/toast';
import ImageUpload from '../components/ImageUpload';

const ClubsManagement = () => {
  const [clubs, setClubs] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentClub, setCurrentClub] = useState({
    club_id: null,
    club_name: '',
    country: '',
    manager: '',
    contact: '',
    license_no: '',
    status: 'pending',
    logo_url: null,
  });
  const [clubLogo, setClubLogo] = useState(null);
  const [clubLogoPreview, setClubLogoPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, [tabValue]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const status = tabValue === 0 ? null : tabValue === 1 ? 'approved' : 'pending';
      const res = await getClubs(status);
      if (res.data.success) {
        setClubs(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
      setError('Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (club = null) => {
    if (club) {
      setEditMode(true);
      setCurrentClub({
        club_id: club.id,
        club_name: club.name,
        country: club.country,
        manager: club.manager,
        contact: club.contact,
        license_no: club.license_no,
        status: club.status,
        logo_url: club.logo_url,
      });
      setClubLogoPreview(club.logo_url);
    } else {
      setEditMode(false);
      setCurrentClub({
        club_id: null,
        club_name: '',
        country: '',
        manager: '',
        contact: '',
        license_no: '',
        status: 'pending',
        logo_url: null,
      });
      setClubLogo(null);
      setClubLogoPreview(null);
    }
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentClub({ ...currentClub, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      if (!currentClub.club_name || !currentClub.country || !currentClub.manager) {
        setError('Club name, country, and manager are required');
        return;
      }

      let res;
      if (editMode) {
        res = await updateClub(currentClub);
      } else {
        res = await addClub(currentClub);
      }

      if (res.data.success) {
        setSuccess('Club added successfully!');
        showToast.success('Club added successfully!', {
          style: { background: '#43a047', color: '#fff' }
        });
        fetchClubs();
        setTimeout(() => {
          handleCloseDialog();
          setSuccess('');
        }, 1500);
      } else {
        setError(res.data.message);
      }
    } catch (error) {
      console.error('Error saving club:', error);
      setError('Failed to save club');
    }
  };

  const handleDelete = async (clubId) => {
    if (window.confirm('Are you sure you want to delete this club?')) {
      try {
        const res = await deleteClub(clubId);
        if (res.data.success) {
          setSuccess('Club deleted successfully');
          fetchClubs();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(res.data.message);
        }
      } catch (error) {
        console.error('Error deleting club:', error);
        setError('Failed to delete club');
      }
    }
  };

  const handleApprove = async (clubId) => {
    try {
      const res = await approveClub(clubId);
      if (res.data.success) {
        setSuccess('Club approved successfully');
        fetchClubs();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(res.data.message);
      }
    } catch (error) {
      console.error('Error approving club:', error);
      setError('Failed to approve club');
    }
  };

  const handleReject = async (clubId) => {
    if (window.confirm('Are you sure you want to reject this club?')) {
      try {
        const res = await rejectClub(clubId);
        if (res.data.success) {
          setSuccess('Club rejected successfully');
          fetchClubs();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(res.data.message);
        }
      } catch (error) {
        console.error('Error rejecting club:', error);
        setError('Failed to reject club');
      }
    }
  };

  const getStatusColor = (status) => {
    return status === 'approved' ? 'success' : 'warning';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Clubs Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Club
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="All Clubs" />
          <Tab label="Approved" />
          <Tab label="Pending" />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Club Name</strong></TableCell>
                <TableCell><strong>Country</strong></TableCell>
                <TableCell><strong>Manager</strong></TableCell>
                <TableCell><strong>Contact</strong></TableCell>
                <TableCell><strong>License No</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Loading...</TableCell>
                </TableRow>
              ) : clubs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">No clubs found</TableCell>
                </TableRow>
              ) : (
                clubs.map((club) => (
                  <TableRow key={club.id} hover>
                    <TableCell>{club.name}</TableCell>
                    <TableCell>{club.country}</TableCell>
                    <TableCell>{club.manager}</TableCell>
                    <TableCell>{club.contact}</TableCell>
                    <TableCell>{club.license_no}</TableCell>
                    <TableCell>
                      <Chip
                        label={club.status}
                        size="small"
                        color={getStatusColor(club.status)}
                        icon={club.status === 'approved' ? <CheckCircle /> : <Pending />}
                      />
                    </TableCell>
                    <TableCell>
                      {club.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            color="success"
                            onClick={() => handleApprove(club.id)}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleReject(club.id)}
                            sx={{ mr: 1 }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(club)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(club.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Club' : 'Add New Club'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
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

          <TextField
            fullWidth
            label="Club Name"
            name="club_name"
            value={currentClub.club_name}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Country"
            name="country"
            value={currentClub.country}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Manager"
            name="manager"
            value={currentClub.manager}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Contact"
            name="contact"
            value={currentClub.contact}
            onChange={handleInputChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="License Number"
            name="license_no"
            value={currentClub.license_no}
            onChange={handleInputChange}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Status"
            name="status"
            value={currentClub.status}
            onChange={handleInputChange}
            margin="normal"
          >
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClubsManagement;
