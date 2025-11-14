// services/inscriptionService.ts
import { api } from "./http/api";
import {
  InscriptionCreateRequest,
  InscriptionsResponse,
  InscriptionResponse,
  InscriptionFilter,
} from "../interfaces/inscription.interface";
import { classeService } from "./classeService";
import { fraisService } from "./fraisService";

export const inscriptionService = {
  // Récupérer toutes les inscriptions avec filtres et pagination
  getAll: async (
    filters?: InscriptionFilter
  ): Promise<InscriptionsResponse> => {
    const params = new URLSearchParams();

    // Paramètres de pagination
    if (filters?.page) {
      params.append("page", filters.page.toString());
    }
    if (filters?.perPage) {
      params.append("perPage", filters.perPage.toString());
    }

    // Paramètres de filtrage
    if (filters?.annee_scolaire_id) {
      params.append("annee_scolaire_id", filters.annee_scolaire_id.toString());
    }
    if (filters?.statut) {
      params.append("statut", filters.statut);
    }
    if (filters?.search) {
      params.append("search", filters.search);
    }

    try {
      const response = await api.get<InscriptionsResponse>(
        `/inscriptions?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      console.error("Erreur lors de la récupération des inscriptions:", error);
      throw error;
    }
  },

  async create(
    inscriptionData: InscriptionCreateRequest
  ): Promise<InscriptionResponse> {
    try {
      const response = await api.post<InscriptionResponse>(
        "/inscriptions",
        inscriptionData
      );
      return response.data;
    } catch (error: any) {
      console.error("Erreur lors de la création de l'inscription:", error);
      throw error;
    }
  },

  async getByEleve(
    eleveId: number
  ): Promise<{ data: { inscriptions: any[] } }> {
    try {
      const response = await api.get(`/eleves/${eleveId}/inscriptions`);
      return response.data;
    } catch (error: any) {
      console.error(
        "Erreur lors de la récupération des inscriptions de l'élève:",
        error
      );
      throw error;
    }
  },

  async update(
    inscriptionId: number,
    inscriptionData: Partial<InscriptionCreateRequest>
  ): Promise<InscriptionResponse> {
    try {
      const response = await api.put<InscriptionResponse>(
        `/inscriptions/${inscriptionId}`,
        inscriptionData
      );
      return response.data;
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de l'inscription:", error);
      throw error;
    }
  },

  async annuler(inscriptionId: number, raison: string): Promise<void> {
    try {
      await api.patch(`/inscriptions/${inscriptionId}/annuler`, { raison });
    } catch (error: any) {
      console.error("Erreur lors de l'annulation de l'inscription:", error);
      throw error;
    }
  },

  async getClassesDisponibles(anneeScolaireId: number) {
    try {
      const response = await api.get(
        `/classes/disponibles?annee_scolaire_id=${anneeScolaireId}`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "Erreur lors de la récupération des classes disponibles:",
        error
      );
      throw error;
    }
  },

  async getFraisParClasse(classeId: number) {
    try {
      const response = await api.get(`/frais-scolarite/classe/${classeId}`);
      return response.data;
    } catch (error) {
      console.error("Erreur récupération frais:", error);

      // Fallback: utiliser les frais par défaut selon le niveau
      try {
        // Récupérer les détails de la classe pour obtenir le niveau
        const classeResponse = await classeService.getById(classeId);
        const niveauId = classeResponse.data.classe.niveau_id;

        // Récupérer les frais par niveau
        const fraisResponse = await fraisService.getFraisByNiveau(niveauId);
        return {
          data: {
            frais: fraisResponse.data.frais,
          },
        };
      } catch (fallbackError) {
        console.error("Erreur fallback frais:", fallbackError);
        // Frais par défaut
        return {
          data: {
            frais: {
              frais_inscription: 50000,
              frais_scolarite: 250000,
              frais_dossier: 10000,
              montant: 250000,
            },
          },
        };
      }
    }
  },

  // Supprimer une inscription
  delete: async (id: number): Promise<{ status: string; message: string }> => {
    try {
      const response = await api.delete(`/inscriptions/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("Erreur lors de la suppression de l'inscription:", error);
      throw error;
    }
  },

  getById: async (id: number) => {
    const response = await api.get(`/inscriptions/${id}`);

    return response.data;
  },

  // update: async (id: number, data: InscriptionUpdateRequest) => {
  //   const response = await api.put(`/inscriptions/${id}`, data);
  //   return response.data;
  // },

  getPaiements: async (inscriptionId: number) => {
    const response = await api.get(`/inscriptions/${inscriptionId}/paiements`);
    return response.data;
  },

  logChangements: async (inscriptionId: number, logData: any) => {
    const response = await api.post(
      `/insscriptions/${inscriptionId}/historique`,
      logData
    );
    return response.data;
  },

  getByAnneeScolaire: async (anneeScolaireId: number) => {
    const response = await api.get(
      `/inscriptions/annee-scolaire/${anneeScolaireId}`
    );
    return response.data;
  },

  // Réinscrire un élève
  async reinscrire(
    reinscriptionData: InscriptionCreateRequest
  ): Promise<InscriptionResponse> {
    try {
      const response = await api.post<InscriptionResponse>(
        "/inscriptions/reinscrire",
        reinscriptionData
      );
      return response.data;
    } catch (error: any) {
      console.error("Erreur lors de la réinscription:", error);
      throw error;
    }
  },
};

export default inscriptionService;
