import { api } from "./http/api";

export interface Personnel {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  sexe?: "M" | "F";
  date_naissance?: string;
  lieu_naissance?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  type_personnel:
    | "enseignant"
    | "surveillant"
    | "administratif"
    | "menage"
    | "direction"
    | "autre";
  date_embauche: string;
  salaire_base?: number;
  statut: "actif" | "inactif" | "congé" | "licencie";
  photo?: string;
  created_at: string;
  updated_at: string;
}

export interface PersonnelCreateRequest {
  nom: string;
  prenom: string;
  sexe?: "M" | "F";
  date_naissance?: string;
  lieu_naissance?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  type_personnel:
    | "enseignant"
    | "surveillant"
    | "administratif"
    | "menage"
    | "direction"
    | "autre";
  date_embauche: string;
  salaire_base?: number;
  statut: "actif" | "inactif" | "congé" | "licencie";
  photo?: string;
}

export const personnelService = {
  async getAll(
    params?: any
  ): Promise<{ data: { personnel: Personnel[]; total: number } }> {
    try {
      const response = await api.get("/personnel", { params });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération du personnel:", error);
      throw error;
    }
  },

  async getById(id: number): Promise<{ data: { personnel: Personnel } }> {
    try {
      const response = await api.get(`/personnel/${id}`);
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération du personnel ${id}:`,
        error
      );
      throw error;
    }
  },

  async create(
    personnelData: PersonnelCreateRequest
  ): Promise<{ data: { personnel: Personnel } }> {
    try {
      const response = await api.post("/personnel", personnelData);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création du personnel:", error);
      throw error;
    }
  },

  async update(
    id: number,
    personnelData: Partial<PersonnelCreateRequest>
  ): Promise<{ data: { personnel: Personnel } }> {
    try {
      const response = await api.put(`/personnel/${id}`, personnelData);
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la modification du personnel ${id}:`,
        error
      );
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/personnel/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression du personnel ${id}:`, error);
      throw error;
    }
  },

  async getEnseignants(): Promise<{ data: { enseignants: Personnel[] } }> {
    try {
      const response = await api.get("/personnel/enseignants");
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des enseignants:", error);
      return { data: { enseignants: [] } };
    }
  },

  async getSurveillants(): Promise<{ data: { surveillants: Personnel[] } }> {
    try {
      const response = await api.get("/personnel/surveillants");
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des surveillants:", error);
      return { data: { surveillants: [] } };
    }
  },

  async getAdministratif(): Promise<{ data: { administratif: Personnel[] } }> {
    try {
      const response = await api.get("/personnel/administratif");
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du personnel administratif:",
        error
      );
      return { data: { administratif: [] } };
    }
  },

  async getStats(): Promise<{ data: { stats: any } }> {
    try {
      const response = await api.get("/personnel/stats");
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des statistiques du personnel:",
        error
      );
      return { data: { stats: { total: 0, par_type: {}, par_statut: {} } } };
    }
  },

  async updateStatut(
    id: number,
    statut: string
  ): Promise<{ data: { personnel: Personnel } }> {
    try {
      const response = await api.patch(`/personnel/${id}/statut`, { statut });
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la mise à jour du statut du personnel ${id}:`,
        error
      );
      throw error;
    }
  },

  async search(
    term: string
  ): Promise<{ data: { results: Personnel[]; total: number } }> {
    try {
      const response = await api.get("/personnel/search", {
        params: { q: term },
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la recherche du personnel:", error);
      return { data: { results: [], total: 0 } };
    }
  },
};
