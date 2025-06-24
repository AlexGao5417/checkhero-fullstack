import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { USER_ROLES } from '@utils/constants';

const GuestRoute = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);

  const getDefaultPath = () => {
    if (!user) return '/reports'; // Fallback
    switch (user.user_type_id) {
      case USER_ROLES.ADMIN: return '/reports';
      case USER_ROLES.AGENT: return '/property-management';
      case USER_ROLES.USER: return '/reports';
      default: return '/reports';
    }
  };

  return isAuthenticated ? <Navigate to={getDefaultPath()} /> : <Outlet />;
};

export default GuestRoute; 