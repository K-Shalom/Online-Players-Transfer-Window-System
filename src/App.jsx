import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeContextProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AdminDashboardContent from './pages/AdminDashboardContent';
import ClubDashboard from './pages/ClubDashboard';
import ClubPlayers from './pages/ClubPlayers';
import ClubTransfers from './pages/ClubTransfers';
import ClubOffers from './pages/ClubOffers';
import ClubWishlist from './pages/ClubWishlist';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PlayersManagement from './pages/PlayersManagement';
import PlayersManagementDataGrid from './pages/PlayersManagementDataGrid';
import ClubsManagement from './pages/ClubsManagement';
import TransfersManagement from './pages/TransfersManagement';
import OffersManagement from './pages/OffersManagement';
import WishlistManagement from './pages/WishlistManagement';
import Settings from './pages/Settings';
import ReportsManagement from './pages/ReportsManagement';

const App = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  // Protected route component with Layout
  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }
    if (adminOnly && user.role !== 'admin') {
      return <Navigate to="/dashboard" />;
    }
    return <Layout>{children}</Layout>;
  };

  return (
    <ThemeContextProvider>
      <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboardContent />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <ClubDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-players" 
          element={
            <ProtectedRoute>
              <ClubPlayers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-transfers" 
          element={
            <ProtectedRoute>
              <ClubTransfers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-offers" 
          element={
            <ProtectedRoute>
              <ClubOffers />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-wishlist" 
          element={
            <ProtectedRoute>
              <ClubWishlist />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/players" 
          element={
            <ProtectedRoute adminOnly={true}>
              <PlayersManagementDataGrid />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/players-old" 
          element={
            <ProtectedRoute adminOnly={true}>
              <PlayersManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/clubs" 
          element={
            <ProtectedRoute adminOnly={true}>
              <ClubsManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/transfers" 
          element={
            <ProtectedRoute adminOnly={true}>
              <TransfersManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/offers" 
          element={
            <ProtectedRoute adminOnly={true}>
              <OffersManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/wishlist" 
          element={
            <ProtectedRoute adminOnly={true}>
              <WishlistManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute adminOnly={true}>
              <ReportsManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
    </ThemeContextProvider>
  );
};

export default App;
