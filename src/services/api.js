import axios from 'axios';
const API_URL = 'http://localhost/optw_system/api/';

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
  return axios.post(API_URL + 'players.php', playerData);
};

export const updatePlayer = (playerData) => {
  return axios.put(API_URL + 'players.php', playerData);
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
  return axios.post(API_URL + 'clubs.php', clubData);
};

export const updateClub = (clubData) => {
  return axios.put(API_URL + 'clubs.php', clubData);
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
