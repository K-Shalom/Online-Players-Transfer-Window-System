import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { getCurrentTransferWindow, getTransferWindows, createTransferWindow, updateTransferWindow, deleteTransferWindow } from '../services/api';

const Settings = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    email: user.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    transferAlerts: true,
    clubApprovals: true,
    systemUpdates: false,
  });

  const [twLoading, setTwLoading] = useState(false);
  const [currentWindow, setCurrentWindow] = useState(null);
  const [windows, setWindows] = useState([]);
  const [twForm, setTwForm] = useState({ start_at: '', end_at: '', is_open: true });
  const [editingId, setEditingId] = useState(null);

  const toSqlDateTime = (v) => {
    if (!v) return '';
    const s = v.includes('T') ? v.replace('T', ' ') : v;
    return s.length === 16 ? s + ':00' : s; // add seconds if missing
  };

  const loadWindows = async () => {
    try {
      setTwLoading(true);
      const [curRes, listRes] = await Promise.all([
        getCurrentTransferWindow(),
        getTransferWindows(),
      ]);
      const list = Array.isArray(listRes.data?.data) ? listRes.data.data : [];
      setWindows(list);
      let active = curRes.data?.data || null;
      // Fallback: derive active from list if API returns null but there is an open window covering now
      if (!active && list && list.length) {
        const now = new Date();
        const found = list.find(w => {
          const s = new Date(w.start_at.replace(' ', 'T'));
          const e = new Date(w.end_at.replace(' ', 'T'));
          return Number(w.is_open) === 1 && s <= now && now <= e;
        });
        if (found) active = found;
      }
      setCurrentWindow(active);
    } catch (_) {
      // noop
    } finally {
      setTwLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === 'admin') loadWindows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({ ...notificationSettings, [name]: checked });
  };

  const handleSaveProfile = () => {
    // TODO: Implement API call to update profile
    setSuccess('Profile updated successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setTimeout(() => setError(''), 3000);
      return;
    }
    // TODO: Implement API call to change password
    setSuccess('Password changed successfully');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSaveNotifications = () => {
    // TODO: Implement API call to save notification settings
    setSuccess('Notification settings saved');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreateWindow = async () => {
    try {
      setError('');
      setSuccess('');
      if (!twForm.start_at || !twForm.end_at) {
        setError('Please provide start and end datetime');
        return;
      }
      if (new Date(twForm.start_at) >= new Date(twForm.end_at)) {
        setError('Start must be before end');
        return;
      }
      setTwLoading(true);
      const payload = {
        start_at: toSqlDateTime(twForm.start_at),
        end_at: toSqlDateTime(twForm.end_at),
        is_open: twForm.is_open ? 1 : 0,
        created_by: user.user_id || null,
      };
      const res = await createTransferWindow(payload);
      if (res.data?.success) {
        setSuccess('Transfer window created');
        setTwForm({ start_at: '', end_at: '', is_open: true });
        await loadWindows();
      } else {
        setError(res.data?.message || 'Failed to create transfer window');
      }
    } catch (e) {
      setError('Failed to create transfer window: ' + (e.response?.data?.message || e.message || 'Unknown error'));
    } finally {
      setTwLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleEditSelect = (w) => {
    setEditingId(w.id);
    // Convert to datetime-local format
    const startLocal = w.start_at?.replace(' ', 'T').slice(0, 16) || '';
    const endLocal = w.end_at?.replace(' ', 'T').slice(0, 16) || '';
    setTwForm({ start_at: startLocal, end_at: endLocal, is_open: Number(w.is_open) === 1 });
  };

  const handleSaveChanges = async () => {
    try {
      setError('');
      setSuccess('');
      if (!editingId) return;
      if (!twForm.start_at || !twForm.end_at) {
        setError('Please provide start and end datetime');
        return;
      }
      if (new Date(twForm.start_at) >= new Date(twForm.end_at)) {
        setError('Start must be before end');
        return;
      }
      setTwLoading(true);
      const payload = {
        id: editingId,
        start_at: toSqlDateTime(twForm.start_at),
        end_at: toSqlDateTime(twForm.end_at),
        is_open: twForm.is_open ? 1 : 0,
      };
      const res = await updateTransferWindow(payload);
      if (res.data?.success) {
        setSuccess('Transfer window updated');
        setEditingId(null);
        setTwForm({ start_at: '', end_at: '', is_open: true });
        await loadWindows();
      } else {
        setError(res.data?.message || 'Failed to update transfer window');
      }
    } catch (_) {
      setError('Failed to update transfer window');
    } finally {
      setTwLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTwForm({ start_at: '', end_at: '', is_open: true });
  };

  const handleDeleteWindow = async (id) => {
    if (!window.confirm('Delete this transfer window?')) return;
    try {
      setTwLoading(true);
      const res = await deleteTransferWindow(id);
      if (res.data?.success) {
        setSuccess('Transfer window deleted');
        if (editingId === id) {
          handleCancelEdit();
        }
        await loadWindows();
      } else {
        setError(res.data?.message || 'Failed to delete window');
      }
    } catch (_) {
      setError('Failed to delete window');
    } finally {
      setTwLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleCloseCurrent = async () => {
    try {
      setTwLoading(true);
      const res = await updateTransferWindow({ action: 'close_current' });
      if (res.data?.success) {
        setSuccess('Current transfer window closed');
        await loadWindows();
      } else {
        setError(res.data?.message || 'Failed to close window');
      }
    } catch (_) {
      setError('Failed to close window');
    } finally {
      setTwLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Settings
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Profile Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Profile Settings
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={profileData.email}
                onChange={handleProfileChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Role"
                value={user.role || 'N/A'}
                margin="normal"
                disabled
              />
              
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveProfile}
                sx={{ mt: 2 }}
                fullWidth
              >
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SecurityIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Security Settings
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <TextField
                fullWidth
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                margin="normal"
              />
              
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleChangePassword}
                sx={{ mt: 2 }}
                fullWidth
              >
                Change Password
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <NotificationsIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Notification Settings
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onChange={handleNotificationChange}
                        name="emailNotifications"
                      />
                    }
                    label="Email Notifications"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.transferAlerts}
                        onChange={handleNotificationChange}
                        name="transferAlerts"
                      />
                    }
                    label="Transfer Alerts"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.clubApprovals}
                        onChange={handleNotificationChange}
                        name="clubApprovals"
                      />
                    }
                    label="Club Approval Notifications"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.systemUpdates}
                        onChange={handleNotificationChange}
                        name="systemUpdates"
                      />
                    }
                    label="System Updates"
                  />
                </Grid>
              </Grid>
              
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveNotifications}
                sx={{ mt: 3 }}
              >
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Transfer Window Management (Admin) */}
        {user.role === 'admin' && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <SettingsIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Transfer Window Management
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Start"
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                      value={twForm.start_at}
                      onChange={(e) => setTwForm((s) => ({ ...s, start_at: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="End"
                      type="datetime-local"
                      InputLabelProps={{ shrink: true }}
                      value={twForm.end_at}
                      onChange={(e) => setTwForm((s) => ({ ...s, end_at: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={<Switch checked={!!twForm.is_open} onChange={(e) => setTwForm((s) => ({ ...s, is_open: e.target.checked }))} />}
                      label="Open this window"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    {editingId ? (
                      <>
                        <Button variant="contained" color="primary" onClick={handleSaveChanges} disabled={twLoading} startIcon={<SaveIcon />}>Save Changes</Button>
                        <Button sx={{ ml: 2 }} variant="text" onClick={handleCancelEdit} disabled={twLoading}>Cancel</Button>
                      </>
                    ) : (
                      <Button variant="contained" onClick={handleCreateWindow} disabled={twLoading} startIcon={<SaveIcon />}>Create Window</Button>
                    )}
                    {currentWindow && (
                      <Button sx={{ ml: 2 }} variant="outlined" color="warning" onClick={handleCloseCurrent} disabled={twLoading}>
                        Close Current Window
                      </Button>
                    )}
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Current Status
                </Typography>
                <Alert severity={currentWindow ? 'success' : 'warning'} sx={{ mb: 2 }}>
                  {currentWindow ? `Open: ${currentWindow.start_at} → ${currentWindow.end_at}` : 'No active transfer window'}
                </Alert>

                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Recent Windows
                </Typography>
                <Box>
                  {(windows || []).slice(0,5).map((w) => (
                    <Box key={w.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2">{w.start_at} → {w.end_at}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color={w.is_open ? 'success.main' : 'text.secondary'}>
                          {w.is_open ? 'OPEN' : 'closed'}
                        </Typography>
                        <Button size="small" variant="text" onClick={() => handleEditSelect(w)}>Edit</Button>
                        <Button size="small" color="error" variant="text" onClick={() => handleDeleteWindow(w.id)}>Delete</Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* System Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              System Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Version</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>1.0.0</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Last Login</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {new Date().toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">User ID</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{user.user_id || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Account Status</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  Active
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
