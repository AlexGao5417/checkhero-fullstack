import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const GuestRoute = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);

  const getDefaultPath = () => {
    if (!user) return '/reports'; // Fallback
    switch (user.user_type_id) {
      case 1: return '/reports';
      case 2: return '/property-management';
      case 3: return '/reports';
      default: return '/reports';
    }
  };

  return isAuthenticated ? <Navigate to={getDefaultPath()} /> : <Outlet />;
};

export default GuestRoute; 