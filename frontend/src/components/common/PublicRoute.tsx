import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface PublicRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  fallbackPath = "/",
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Rediriger vers le dashboard si déjà authentifié
  if (isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
