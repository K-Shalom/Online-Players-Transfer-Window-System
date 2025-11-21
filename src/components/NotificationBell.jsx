import React, { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle,
  Info,
  Warning,
  Error as ErrorIcon
} from '@mui/icons-material';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteAllReadNotifications
} from '../services/api';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const res = await getNotifications(user.user_id);
      if (res.data.success) {
        setNotifications(res.data.data);
        const unread = res.data.data.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      } else {
        showToast.error(res.data.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      showToast.error('Error fetching notifications');
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await markNotificationRead(notif.notif_id);
        fetchNotifications();
        showToast.success('Notification marked as read');
      } catch (err) {
        console.error('Error marking notification as read:', err);
        showToast.error('Error marking notification as read');
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(user.user_id);
      fetchNotifications();
      showToast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all as read:', err);
      showToast.error('Error marking all as read');
    }
  };

  const handleClearRead = async () => {
    try {
      await deleteAllReadNotifications(user.user_id);
      fetchNotifications();
      showToast.success('Read notifications cleared');
    } catch (err) {
      console.error('Error clearing read notifications:', err);
      showToast.error('Error clearing read notifications');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle color="success" fontSize="small" />;
      case 'warning':
        return <Warning color="warning" fontSize="small" />;
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      default:
        return <Info color="info" fontSize="small" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return '#e8f5e9';
      case 'warning': return '#fff3e0';
      case 'error': return '#ffebee';
      default: return '#e3f2fd';
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480
          }
        }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Chip label={`${unreadCount} new`} color="primary" size="small" />
          )}
        </Box>
        <Divider />
        
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </MenuItem>
        ) : (
          <>
            {notifications.slice(0, 10).map((notif) => (
              <MenuItem
                key={notif.notif_id}
                onClick={() => handleNotificationClick(notif)}
                sx={{
                  backgroundColor: notif.is_read ? 'transparent' : getNotificationColor(notif.type),
                  borderLeft: notif.is_read ? 'none' : `4px solid ${notif.type === 'success' ? '#4caf50' : notif.type === 'warning' ? '#ff9800' : notif.type === 'error' ? '#f44336' : '#2196f3'}`,
                  '&:hover': {
                    backgroundColor: notif.is_read ? 'rgba(0, 0, 0, 0.04)' : getNotificationColor(notif.type)
                  }
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                  {getNotificationIcon(notif.type)}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: notif.is_read ? 'normal' : 'bold' }}>
                      {notif.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notif.sent_at).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
            
            <Divider />
            <Box sx={{ p: 1, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
              {unreadCount > 0 && (
                <Button size="small" onClick={handleMarkAllRead}>
                  Mark all read
                </Button>
              )}
              <Button size="small" onClick={handleClearRead}>
                Clear read
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
