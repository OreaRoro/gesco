import { api } from "./http/api";
import { Classe, ClasseCreateRequest } from "../interfaces/reference.interface";

export const classeService = {
  async getAll(params?: any): Promise<{ data: { classes: Classe[] } }> {
    try {
      const response = await api.get("/classes", { params });

      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des classes:", error);
      throw error;
    }
  },

  async getById(id: number): Promise<{ data: { classe: Classe } }> {
    try {
      const response = await api.get(`/classes/${id}`);
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération de la classe ${id}:`,
        error
      );
      throw error;
    }
  },

  async create(
    classeData: ClasseCreateRequest
  ): Promise<{ data: { classe: Classe } }> {
    try {
      const response = await api.post("/classes", classeData);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création de la classe:", error);
      throw error;
    }
  },

  async update(
    id: number,
    classeData: Partial<ClasseCreateRequest>
  ): Promise<{ data: { classe: Classe } }> {
    try {
      const response = await api.put(`/classes/${id}`, classeData);
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la modification de la classe ${id}:`,
        error
      );
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/classes/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de la classe ${id}:`, error);
      throw error;
    }
  },

  async getClassesWithDetails(): Promise<{ data: { classes: Classe[] } }> {
    try {
      const response = await api.get("/classes/with-details");
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des classes avec détails:",
        error
      );
      // Retourner des données mockées pour le développement
      return {
        data: {
          classes: [],
        },
      };
    }
  },

  async getEffectif(classeId: number): Promise<{ data: { effectif: number } }> {
    try {
      const response = await api.get(`/classes/${classeId}/effectif`);
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération de l'effectif pour la classe ${classeId}:`,
        error
      );
      // Retourner 0 en cas d'erreur
      return {
        data: {
          effectif: 0,
        },
      };
    }
  },

  async getByNiveau(
    niveauId: number
  ): Promise<{ data: { classes: Classe[] } }> {
    try {
      const response = await api.get("/classes", {
        params: { niveau_id: niveauId },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des classes pour le niveau ${niveauId}:`,
        error
      );
      return {
        data: {
          classes: [],
        },
      };
    }
  },

  async getByAnneeScolaire(
    anneeScolaireId: number
  ): Promise<{ data: { classes: Classe[] } }> {
    try {
      const response = await api.get("/classes", {
        params: { annee_scolaire_id: anneeScolaireId },
      });
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des classes pour l'année scolaire ${anneeScolaireId}:`,
        error
      );
      return {
        data: {
          classes: [],
        },
      };
    }
  },

  // Méthode utilitaire pour obtenir les classes disponibles pour l'inscription
  async getClassesDisponiblesPourInscription(
    anneeScolaireId?: number
  ): Promise<Classe[]> {
    try {
      const params: any = {};
      if (anneeScolaireId) {
        params.annee_scolaire_id = anneeScolaireId;
      }

      const response = await this.getAll(params);
      return response.data?.classes || [];
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des classes disponibles:",
        error
      );
      return [];
    }
  },
};
