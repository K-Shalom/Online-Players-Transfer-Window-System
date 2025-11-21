import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import App from "./App";
import Layout from "./components/Layout";

// Public pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";

// Admin & Club pages
import AdminDashboardContent from "./pages/AdminDashboardContent";
import Dashboard from "./pages/Dashboard";
import ClubDashboard from "./pages/ClubDashboard";
import ClubPlayers from "./pages/ClubPlayers";
import ClubTransfers from "./pages/ClubTransfers";
import ClubOffers from "./pages/ClubOffers";
import ClubWishlist from "./pages/ClubWishlist";
import PlayersManagement from "./pages/PlayersManagement";
import PlayersManagementDataGrid from "./pages/PlayersManagementDataGrid";
import ClubsManagement from "./pages/ClubsManagement";
import TransfersManagement from "./pages/TransfersManagement";
import OffersManagement from "./pages/OffersManagement";
import WishlistManagement from "./pages/WishlistManagement";
import ReportsManagement from "./pages/ReportsManagement";
import Settings from "./pages/Settings";

// Redirect component based on role
const RoleRedirect = () => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (_) {
    user = null;
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/club'} replace />;
};

// ----------------------------
// PROTECTED ROUTE
// ----------------------------
const ProtectedRoute = ({ adminOnly = false }) => {
  const storedUser = localStorage.getItem("user");
  let user = null;
  
  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== "admin") {
    // Redirect to appropriate dashboard based on role
    const redirectPath = user.role === 'club' ? '/club' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

// ----------------------------
// ROUTES
// ----------------------------
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<App />}>
      {/* PUBLIC PAGES */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* PROTECTED PAGES WITH LAYOUT */}
      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <Layout>
              <Outlet />
            </Layout>
          }
        >
          {/* DEFAULT DASHBOARD REDIRECT BASED ON ROLE */}
          <Route path="/" element={<RoleRedirect />} />

          {/* ADMIN ROUTES */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="admin" element={<AdminDashboardContent />} />
            <Route path="players">
              <Route index element={<PlayersManagement />} />
              <Route path="grid" element={<PlayersManagementDataGrid />} />
            </Route>
            <Route path="clubs" element={<ClubsManagement />} />
            <Route path="transfers" element={<TransfersManagement />} />
            <Route path="offers" element={<OffersManagement />} />
            <Route path="wishlist" element={<WishlistManagement />} />
            <Route path="reports" element={<ReportsManagement />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* CLUB ROUTES */}
          <Route path="club">
            <Route index element={<ClubDashboard />} />
            <Route path="players" element={<ClubPlayers />} />
            <Route path="transfers" element={<ClubTransfers />} />
            <Route path="offers" element={<ClubOffers />} />
            <Route path="wishlist" element={<ClubWishlist />} />
          </Route>

          {/* GENERAL DASHBOARD - HANDLE BOTH ROLES */}
          <Route path="dashboard" element={<RoleRedirect />} />
        </Route>
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
);

export { router };
