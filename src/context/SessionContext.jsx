import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);
  
  // Inactivity timeout: 15 minutes (900000ms)
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
  // Warning before logout: 2 minutes before timeout
  const WARNING_TIME = 2 * 60 * 1000;

  const logout = () => {
    localStorage.removeItem('user');
    showToast.warning('You have been logged out due to inactivity');
    navigate('/login');
  };

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    setShowWarning(false);

    // Only set timers if user is logged in
    const user = localStorage.getItem('user');
    if (!user) return;

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      showToast.warning('You will be logged out in 2 minutes due to inactivity');
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) return;

    // Events to track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Reset timer on any user activity
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, []);

  return (
    <SessionContext.Provider value={{ resetTimer, showWarning }}>
      {children}
    </SessionContext.Provider>
  );
};
