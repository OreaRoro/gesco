export interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "secretaire" | "enseignant" | "surveillant";
  nom: string;
  prenom: string;
  type_personnel: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  role: string;
  personnel_id: number;
}
