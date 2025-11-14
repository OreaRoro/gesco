import { api } from "./http/api";
import {
  AnneeScolaire,
  AnneeScolaireCreateRequest,
} from "../interfaces/reference.interface";

export const anneeScolaireService = {
  async getAll(): Promise<{ data: { annees_scolaires: AnneeScolaire[] } }> {
    try {
      const response = await api.get("/annees-scolaires");
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des années scolaires:",
        error
      );
      // Retourner des données mockées pour le développement
      const currentYear = new Date().getFullYear();
      return {
        data: {
          annees_scolaires: [
            {
              id: 1,
              annee: `${currentYear}-${currentYear + 1}`,
              date_debut: `${currentYear}-09-01`,
              date_fin: `${currentYear + 1}-07-31`,
              statut: "courante",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_active: 1,
            },
          ],
        },
      };
    }
  },

  async getById(
    id: number
  ): Promise<{ data: { annee_scolaire: AnneeScolaire } }> {
    try {
      const response = await api.get(`/annees-scolaires/${id}`);
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération de l'année scolaire ${id}:`,
        error
      );
      throw error;
    }
  },

  async create(anneeData: AnneeScolaireCreateRequest): Promise<{
    message: string;
    data: { annee_scolaire: AnneeScolaire };
  }> {
    try {
      const response = await api.post("/annees-scolaires", anneeData);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création de l'année scolaire:", error);
      throw error;
    }
  },

  async update(
    id: number,
    anneeData: Partial<AnneeScolaireCreateRequest>
  ): Promise<{
    message: string;
    data: { annee_scolaire: AnneeScolaire };
  }> {
    try {
      const response = await api.put(`/annees-scolaires/${id}`, anneeData);
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la modification de l'année scolaire ${id}:`,
        error
      );
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/annees-scolaires/${id}`);
    } catch (error) {
      console.error(
        `Erreur lors de la suppression de l'année scolaire ${id}:`,
        error
      );
      throw error;
    }
  },

  async getCurrent(): Promise<AnneeScolaire | null> {
    try {
      // Essayer d'abord l'endpoint spécifique
      const response = await api.get("/annees-scolaires/current");
      return response.data?.data?.annee_scolaire || null;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'année scolaire courante:",
        error
      );

      // Fallback: récupérer toutes et trouver celle qui est courante
      try {
        const response = await this.getAll();
        const annees = response.data?.annees_scolaires || [];
        return annees.find((a) => a.statut === "courante") || null;
      } catch (fallbackError) {
        console.error(
          "Erreur lors du fallback de récupération de l'année courante:",
          fallbackError
        );
        return null;
      }
    }
  },

  async setAsActive(id: number): Promise<void> {
    try {
      await api.patch(`/annees-scolaires/${id}/set-active`);
    } catch (error) {
      console.error(
        `Erreur lors de la sélection de l'année scolaire ${id} pour consultation:`,
        error
      );
      throw error;
    }
  },

  async setAsCurrent(id: number): Promise<void> {
    try {
      await api.patch(`/annees-scolaires/${id}/set-current`);
    } catch (error) {
      console.error(
        `Erreur lors de la définition de l'année scolaire ${id} comme courante:`,
        error
      );
      throw error;
    }
  },

  async closeAnneeScolaire(id: number): Promise<void> {
    try {
      await api.patch(`/annees-scolaires/${id}/close`);
    } catch (error) {
      console.error(
        `Erreur lors de la clôture de l'année scolaire ${id}:`,
        error
      );
      throw error;
    }
  },

  // Méthode utilitaire pour générer une année scolaire par défaut
  generateDefaultAnnee(): AnneeScolaireCreateRequest {
    const currentYear = new Date().getFullYear();
    return {
      annee: `${currentYear}-${currentYear + 1}`,
      date_debut: `${currentYear}-09-01`,
      date_fin: `${currentYear + 1}-07-31`,
      statut: "planifie",
    };
  },

  // Vérifier si une année scolaire est valide pour les inscriptions
  async isAnneeScolaireActive(anneeScolaireId: number): Promise<boolean> {
    try {
      const annee = await this.getById(anneeScolaireId);
      return annee.data?.annee_scolaire?.statut === "courante";
    } catch (error) {
      console.error(
        `Erreur lors de la vérification de l'année scolaire ${anneeScolaireId}:`,
        error
      );
      return false;
    }
  },
};
