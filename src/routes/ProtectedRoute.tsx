import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, isLoading, userData } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <Skeleton className="h-12 w-64" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userData?.primerLogin) {
    return <Navigate to="/cambiar-contrasena" replace />;
  }

  if (allowedRoles && userData && !allowedRoles.includes(userData.rol)) {
    return <Navigate to="/sin-acceso" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
