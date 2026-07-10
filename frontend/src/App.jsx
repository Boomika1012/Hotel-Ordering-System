import React, { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';

import ResetPassword from './ResetPassword';
import Home from './Home';
import AuthPage from './AuthPage';
import Profile from './Profile';
import Wallet from './Wallet';
import Orders from './Orders';
import OrderMenu from './components/OrderMenu'; 

// --- 1. Session Manager ---
const SessionManager = () => {
  const navigate = useNavigate();

  const handleLogout = useCallback((reason) => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    if (reason) alert(reason);
    navigate('/auth');
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let jwtTimer;
    let inactivityTimer;
    const INACTIVITY_LIMIT = 2 * 60 * 1000;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const timeRemaining = expiryTime - Date.now();

      if (timeRemaining <= 0) {
        handleLogout("Your session has expired. Please log in again.");
        return;
      } else {
        jwtTimer = setTimeout(() => {
          handleLogout("Your session has expired. Please log in again.");
        }, timeRemaining);
      }
    } catch (error) {
      console.error("Invalid token detected.", error);
      handleLogout("Authentication error. Please log in again.");
      return;
    }

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        handleLogout("You have been logged out due to inactivity.");
      }, INACTIVITY_LIMIT);
    };

    resetInactivityTimer();

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetInactivityTimer));

    return () => {
      clearTimeout(jwtTimer);
      clearTimeout(inactivityTimer);
      events.forEach(e => document.removeEventListener(e, resetInactivityTimer));
    };
  }, [handleLogout]);

  return null;
};

// --- 2. Protected Route ---
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return children;
};

// --- 3. Navbar ---
const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  };

  return (
    <nav style={{ display: 'flex', gap: '20px', padding: '20px 40px', alignItems: 'center', backgroundColor: '#2c2c2c', borderBottom: '2px solid #d4af37' }}>
      <h2 style={{ color: '#fff', margin: 0 }}>Foodie Junction</h2>
      {token && (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <Link to="/home"><button style={{ padding: '8px 16px', cursor: 'pointer' }}>Home</button></Link>
          <Link to="/menu"><button style={{ padding: '8px 16px', cursor: 'pointer' }}>Menu</button></Link>
          <Link to="/orders"><button style={{ padding: '8px 16px', cursor: 'pointer' }}>Orders</button></Link>
          <Link to="/wallet"><button style={{ padding: '8px 16px', cursor: 'pointer' }}>Wallet</button></Link>
          <Link to="/profile"><button style={{ padding: '8px 16px', cursor: 'pointer' }}>Profile</button></Link>
          <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px' }}>Logout</button>
        </div>
      )}
    </nav>
  );
};

// --- 4. Main App ---
export default function App() {
  const currentUserName = localStorage.getItem('userName') || '';
  const currentUserEmail = localStorage.getItem('userEmail') || '';

  return (
    <Router>
      <SessionManager />
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/orders" />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile currentUserName={currentUserName} currentUserEmail={currentUserEmail} />
          </ProtectedRoute>
        } />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        
        {/* OrderMenu is now safely wrapped inside the Router! */}
        <Route path="/menu" element={<ProtectedRoute><OrderMenu /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}