import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = "/signin",
}) => {
  const { isAuthenticated, user, loading, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // useEffect pour rediriger proprement
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate(fallbackPath, { replace: true, state: { from: location } });
    }
  }, [isAuthenticated, loading, navigate, fallbackPath, location]);

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Si toujours pas authentifié après chargement → on bloque le rendu
  if (!isAuthenticated) {
    return null;
  }

  // Vérifier les rôles si spécifiés
  if (requiredRole) {
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.some((role) => hasRole(role))
      : hasRole(requiredRole);

    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Accès non autorisé
            </h2>
            <p className="text-gray-600 mb-4">
              Vous n'avez pas les permissions nécessaires pour accéder à cette
              page.
            </p>
            <p className="text-sm text-gray-500">
              Rôle requis :{" "}
              {Array.isArray(requiredRole)
                ? requiredRole.join(" ou ")
                : requiredRole}
              <br />
              Votre rôle : {user?.role}
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }
  }

  // Si tout est bon, on affiche les enfants
  return <>{children}</>;
};

export default ProtectedRoute;
