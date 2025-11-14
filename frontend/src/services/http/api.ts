import axios from "axios";
import { requestInterceptor, responseInterceptor } from "./interceptors";

const API_URL =
  import.meta.env.REACT_APP_API_URL || "http://localhost:8080/api";

// Création de l'instance axios de base
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Application des intercepteurs
api.interceptors.request.use(
  requestInterceptor.onFulfilled,
  requestInterceptor.onRejected
);

api.interceptors.response.use(
  responseInterceptor.onFulfilled,
  responseInterceptor.onRejected
);

export default api;
