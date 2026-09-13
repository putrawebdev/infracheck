import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Spinner from '../ui/Spinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        id="protected-route-loading"
        className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3"
      >
        <Spinner size="lg" color="blue" />
        <p className="text-sm text-slate-500 font-medium">Memeriksa autentikasi...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
