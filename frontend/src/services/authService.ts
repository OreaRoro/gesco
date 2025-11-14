import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/auth";

import { api } from "./http/api";

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", credentials);

    if (response.data.status === "success") {
      localStorage.setItem("token", response.data.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
    }

    return response.data;
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", userData);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ status: string; data: { user: User } }>(
      "/auth/me"
    );
    return response.data.data.user;
  },

  async refreshToken(): Promise<string> {
    const response = await api.post<{
      status: string;
      data: { token: string };
    }>("/auth/refresh");
    const newToken = response.data.data.token;
    localStorage.setItem("token", newToken);
    return newToken;
  },

  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken(): string | null {
    return localStorage.getItem("token");
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  hasRole(role: string): boolean {
    const user = this.getStoredUser();
    return user?.role === role;
  },

  isAdmin(): boolean {
    return this.hasRole("admin");
  },
};

export default api;
