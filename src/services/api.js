import axios from 'axios';

const API_URL = 'http://localhost/Online-Players-Transfer-Window-System/api/';

// Add axios interceptor to include authentication headers
axios.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.user_id) {
      // Create Bearer token with user_id:role format
      const token = `${user.user_id}:${user.role || 'user'}`;
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const loginUser = (username, password) => {
  return axios.post(API_URL + 'login.php', { username, password });
};

export const signupUser = (name, email, password, role) => {
  return axios.post(API_URL + 'signup.php', { name, email, password, role });
};

// Dashboard APIs
export const getDashboardStats = () => {
  return axios.get(API_URL + 'dashboard_stats.php');
};

export const getRecentTransfers = () => {
  return axios.get(API_URL + 'recent_transfers.php');
};

export const getPendingClubs = () => {
  return axios.get(API_URL + 'pending_clubs.php');
};

export const approveClub = (clubId) => {
  return axios.post(API_URL + 'pending_clubs.php', { club_id: clubId, action: 'approve' });
};

export const rejectClub = (clubId) => {
  return axios.post(API_URL + 'pending_clubs.php', { club_id: clubId, action: 'reject' });
};

// Players APIs
export const getPlayers = () => {
  return axios.get(API_URL + 'players.php');
};

export const getPlayer = (playerId) => {
  return axios.get(API_URL + 'players.php?id=' + playerId);
};

export const addPlayer = (playerData) => {
  const formData = new FormData();

  Object.keys(playerData).forEach(key => {
    if (key === 'photo' && playerData[key] instanceof File) {
      formData.append('photo', playerData[key]);
    } else if (playerData[key] !== null && playerData[key] !== undefined) {
      formData.append(key, playerData[key]);
    }
  });

  return axios.post(API_URL + 'players.php', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updatePlayer = (playerData) => {
  const formData = new FormData();
  formData.append('action', 'update');

  Object.keys(playerData).forEach(key => {
    if (key === 'photo' && playerData[key] instanceof File) {
      formData.append('photo', playerData[key]);
    } else if (playerData[key] !== null && playerData[key] !== undefined) {
      formData.append(key, playerData[key]);
    }
  });

  return axios.post(API_URL + 'players.php', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deletePlayer = (playerId) => {
  return axios.delete(API_URL + 'players.php', { data: { player_id: playerId } });
};

// Clubs APIs
export const getClubs = (status = null) => {
  const url = status ? API_URL + 'clubs.php?status=' + status : API_URL + 'clubs.php';
  return axios.get(url);
};

export const getClub = (clubId) => {
  return axios.get(API_URL + 'clubs.php?id=' + clubId);
};

export const addClub = (clubData) => {
  const formData = new FormData();

  // Add all club fields to FormData
  Object.keys(clubData).forEach(key => {
    if (key === 'logo' && clubData[key] instanceof File) {
      formData.append('logo', clubData[key]);
      console.log('Appending logo file:', clubData[key].name);
    } else if (clubData[key] !== null && clubData[key] !== undefined) {
      formData.append(key, clubData[key]);
      console.log('Appending field:', key, clubData[key]);
    }
  });

  // Log FormData contents (for debugging)
  console.log('FormData contents:');
  for (let [key, value] of formData.entries()) {
    console.log(key, value instanceof File ? `File: ${value.name}` : value);
  }

  return axios.post(API_URL + 'clubs.php', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateClub = (clubData) => {
  const formData = new FormData();

  // Add action field to FormData
  formData.append('action', 'update');

  // Add all club fields to FormData
  Object.keys(clubData).forEach(key => {
    if (key === 'logo' && clubData[key] instanceof File) {
      formData.append('logo', clubData[key]);
      console.log('Appending logo file for update:', clubData[key].name);
    } else if (clubData[key] !== null && clubData[key] !== undefined) {
      formData.append(key, clubData[key]);
      console.log('Appending field for update:', key, clubData[key]);
    }
  });

  // Log FormData contents (for debugging)
  console.log('FormData contents for update:');
  for (let [key, value] of formData.entries()) {
    console.log(key, value instanceof File ? `File: ${value.name}` : value);
  }

  // Use POST with action in FormData
  return axios.post(API_URL + 'clubs.php', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteClub = (clubId) => {
  return axios.delete(API_URL + 'clubs.php', { data: { club_id: clubId } });
};

// Transfers APIs
export const getTransfers = () => {
  return axios.get(API_URL + 'transfers.php');
};

export const getTransfer = (transferId) => {
  return axios.get(API_URL + 'transfers.php?id=' + transferId);
};

export const addTransfer = (transferData) => {
  return axios.post(API_URL + 'transfers.php', transferData);
};

export const updateTransfer = (transferData) => {
  return axios.put(API_URL + 'transfers.php', transferData);
};

export const deleteTransfer = (transferId) => {
  return axios.delete(API_URL + 'transfers.php', { data: { transfer_id: transferId } });
};

// Offers APIs
export const getOffers = () => {
  return axios.get(API_URL + 'offers.php');
};

export const getOffer = (offerId) => {
  return axios.get(API_URL + 'offers.php?id=' + offerId);
};

export const getOffersByTransfer = (transferId) => {
  return axios.get(API_URL + 'offers.php?transfer_id=' + transferId);
};

export const getOffersByClub = (clubId) => {
  return axios.get(API_URL + 'offers.php?club_id=' + clubId);
};

export const createOffer = (offerData) => {
  return axios.post(API_URL + 'offers.php', offerData);
};

export const acceptOffer = (offerId) => {
  return axios.put(API_URL + 'offers.php', { offer_id: offerId, action: 'accept' });
};

export const rejectOffer = (offerId) => {
  return axios.put(API_URL + 'offers.php', { offer_id: offerId, action: 'reject' });
};

export const counterOffer = (offerId, newAmount) => {
  return axios.put(API_URL + 'offers.php', { offer_id: offerId, action: 'counter', offered_amount: newAmount });
};

export const deleteOffer = (offerId) => {
  return axios.delete(API_URL + 'offers.php', { data: { offer_id: offerId } });
};

// Notifications APIs
export const getNotifications = (userId, unreadOnly = false) => {
  const url = unreadOnly
    ? `${API_URL}notifications.php?user_id=${userId}&unread=true`
    : `${API_URL}notifications.php?user_id=${userId}`;
  return axios.get(url);
};

export const getAllNotifications = () => {
  return axios.get(API_URL + 'notifications.php');
};

export const createNotification = (notificationData) => {
  return axios.post(API_URL + 'notifications.php', notificationData);
};

export const markNotificationRead = (notifId) => {
  return axios.put(API_URL + 'notifications.php', { notif_id: notifId });
};

export const markAllNotificationsRead = (userId) => {
  return axios.put(API_URL + 'notifications.php', { user_id: userId, mark_all_read: true });
};

export const deleteNotification = (notifId) => {
  return axios.delete(API_URL + 'notifications.php', { data: { notif_id: notifId } });
};

export const deleteAllReadNotifications = (userId) => {
  return axios.delete(API_URL + 'notifications.php', { data: { user_id: userId, delete_all_read: true } });
};

// Wishlists APIs
export const getWishlists = (clubId) => {
  return axios.get(API_URL + 'wishlists.php?club_id=' + clubId);
};

export const getAllWishlists = () => {
  return axios.get(API_URL + 'wishlists.php');
};

export const addToWishlist = (clubId, playerId) => {
  return axios.post(API_URL + 'wishlists.php', { club_id: clubId, player_id: playerId });
};

export const removeFromWishlist = (wishlistId) => {
  return axios.delete(API_URL + 'wishlists.php', { data: { wishlist_id: wishlistId } });
};

export const removeFromWishlistByIds = (clubId, playerId) => {
  return axios.delete(API_URL + 'wishlists.php', { data: { club_id: clubId, player_id: playerId } });
};

// Email Verification APIs
export const sendVerificationEmail = (email) => {
  return axios.post(API_URL + 'send_verification.php', { email });
};

export const verifyEmail = (token) => {
  return axios.get(API_URL + 'verify_email.php?token=' + token);
};

// Bulk Delete API
export const bulkDelete = (table, ids, idColumn) => {
  return axios.post(API_URL + 'bulk_delete.php', { table, ids, id_column: idColumn });
};

// Transfer Window APIs
export const getTransferWindows = (status = null) => {
  const url = status ? `${API_URL}transfer_windows.php?status=${status}` : `${API_URL}transfer_windows.php`;
  return axios.get(url);
};

export const getCurrentTransferWindow = () => {
  return axios.get(API_URL + 'transfer_windows.php?current=true');
};

export const createTransferWindow = (payload) => {
  // payload: { start_at: 'YYYY-MM-DD HH:MM:SS', end_at: 'YYYY-MM-DD HH:MM:SS', is_open: 0|1, created_by?: number }
  return axios.post(API_URL + 'transfer_windows.php', payload);
};

export const updateTransferWindow = (payload) => {
  // payload: { id, start_at?, end_at?, is_open? } OR { action:'close_current' }
  return axios.put(API_URL + 'transfer_windows.php', payload);
};

export const deleteTransferWindow = (id) => {
  return axios.delete(API_URL + 'transfer_windows.php', { data: { id } });
};
