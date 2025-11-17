import api from "./http/api";

export interface Matiere {
  id: number;
  nom: string;
  code: string;
  coefficient: number;
  niveau_id: number;
  niveau_nom: string;
  niveau?: {
    id: number;
    nom: string;
  };
  created_at: string;
}

export interface CreateMatiereData {
  nom: string;
  code: string;
  coefficient: number;
  niveau_id: number;
}

export interface UpdateMatiereData extends Partial<CreateMatiereData> {}

export interface MatiereFilters {
  search?: string;
  niveau_id?: number;
}

export interface Matiere {
  id: number;
  nom: string;
  code: string;
  coefficient: number;
  niveau_id: number;
  created_at: string;
}

export const matiereService = {
  // Récupérer toutes les matières
  getAll: async (filters?: MatiereFilters) => {
    const params = new URLSearchParams();

    if (filters?.search) {
      params.append("search", filters.search);
    }
    if (filters?.niveau_id) {
      params.append("niveau_id", filters.niveau_id.toString());
    }

    const response = await api.get(`/matieres?${params.toString()}`);
    return response.data;
  },

  // Récupérer une matière par ID
  getById: async (id: number) => {
    const response = await api.get(`/matieres/${id}`);
    return response.data;
  },

  // Créer une nouvelle matière
  create: async (data: CreateMatiereData) => {
    const response = await api.post("/matieres", data);
    return response.data;
  },

  // Modifier une matière
  update: async (id: number, data: UpdateMatiereData) => {
    const response = await api.put(`/matieres/${id}`, data);
    return response.data;
  },

  // Supprimer une matière
  delete: async (id: number) => {
    const response = await api.delete(`/matieres/${id}`);
    return response.data;
  },

  // Récupérer les matières par niveau
  getByNiveau: async (niveauId: number) => {
    const response = await api.get(`/niveaux/${niveauId}/matieres`);
    return response.data;
  },
};
