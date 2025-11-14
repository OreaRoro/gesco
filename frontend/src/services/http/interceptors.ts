import axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { authService } from "../authService";

// Intercepteur pour les requêtes
export const requestInterceptor = {
  onFulfilled: (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  onRejected: (error: any) => {
    return Promise.reject(error);
  },
};

// Intercepteur pour les réponses
export const responseInterceptor = {
  onFulfilled: (response: AxiosResponse) => {
    return response;
  },
  onRejected: async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Gestion des erreurs 401 (Non autorisé)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await axios.post(
            `${
              import.meta.env.REACT_APP_API_URL || "http://localhost:8080/api"
            }/auth/refresh`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const newToken = response.data.data.token;
          localStorage.setItem("token", newToken);

          // Retry la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Si le refresh échoue, déconnecter silencieusement
        authService.logout();
        console.warn("Session expirée - déconnexion automatique");
      }
    }

    return Promise.reject(error);
  },
};
