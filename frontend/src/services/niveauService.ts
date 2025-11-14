import { api } from "./http/api";
import { Niveau, NiveauCreateRequest } from "../interfaces/reference.interface";

export const niveauService = {
  async getAll(): Promise<{
    data: {
      annees_scolaires: never[];
      niveaux: Niveau[];
    };
  }> {
    try {
      const response = await api.get("/niveaux");
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des niveaux:", error);
      // Retourner des données mockées pour le développement
      return {
        data: {
          niveaux: [
            {
              id: 1,
              nom: "6ème",
              cycle: "Collège",
              ordre: 1,
              created_at: new Date().toISOString(),
            },
            {
              id: 2,
              nom: "5ème",
              cycle: "Collège",
              ordre: 2,
              created_at: new Date().toISOString(),
            },
            {
              id: 3,
              nom: "4ème",
              cycle: "Collège",
              ordre: 3,
              created_at: new Date().toISOString(),
            },
            {
              id: 4,
              nom: "3ème",
              cycle: "Collège",
              ordre: 4,
              created_at: new Date().toISOString(),
            },
            {
              id: 5,
              nom: "Seconde",
              cycle: "Lycée",
              ordre: 5,
              created_at: new Date().toISOString(),
            },
            {
              id: 6,
              nom: "Première",
              cycle: "Lycée",
              ordre: 6,
              created_at: new Date().toISOString(),
            },
            {
              id: 7,
              nom: "Terminale",
              cycle: "Lycée",
              ordre: 7,
              created_at: new Date().toISOString(),
            },
          ],
          annees_scolaires: [],
        },
      };
    }
  },

  async getById(id: number): Promise<{ data: { niveau: Niveau } }> {
    try {
      const response = await api.get(`/niveaux/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du niveau ${id}:`, error);
      throw error;
    }
  },

  async create(
    niveauData: NiveauCreateRequest
  ): Promise<{ data: { niveau: Niveau } }> {
    try {
      const response = await api.post("/niveaux", niveauData);
      return response.data;
    } catch (error) {
      // console.error("Erreur lors de la création du niveau:", error);
      throw error;
    }
  },

  async update(
    id: number,
    niveauData: Partial<NiveauCreateRequest>
  ): Promise<{ data: { niveau: Niveau } }> {
    try {
      const response = await api.put(`/niveaux/${id}`, niveauData);
      return response.data;
    } catch (error) {
      // console.error(`Erreur lors de la modification du niveau ${id}:`, error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await api.delete(`/niveaux/${id}`);
    } catch (error) {
      // console.error(`Erreur lors de la suppression du niveau ${id}:`, error);
      throw error;
    }
  },

  async getCycles(): Promise<string[]> {
    try {
      // Essayer d'abord l'endpoint spécifique
      const response = await api.get("/niveaux/cycles");
      return response.data?.data?.cycles || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des cycles:", error);

      // Fallback: calculer à partir de la liste des niveaux
      try {
        const response = await this.getAll();
        const niveaux = response.data?.niveaux || [];
        const cycles = [...new Set(niveaux.map((n) => n.cycle))];
        return cycles.sort();
      } catch (fallbackError) {
        console.error(
          "Erreur lors du fallback de récupération des cycles:",
          fallbackError
        );
        return ["Préscolaire", "Primaire", "Collège", "Lycée"];
      }
    }
  },

  async getByCycle(cycle: string): Promise<{ data: { niveaux: Niveau[] } }> {
    try {
      const response = await api.get(`/niveaux/cycle/${cycle}`);
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des niveaux pour le cycle ${cycle}:`,
        error
      );

      // Fallback: filtrer localement
      try {
        const response = await this.getAll();
        const niveaux = response.data?.niveaux || [];
        const niveauxFiltres = niveaux.filter((n) => n.cycle === cycle);
        return {
          data: {
            niveaux: niveauxFiltres,
          },
        };
      } catch (fallbackError) {
        console.error(
          "Erreur lors du fallback de récupération par cycle:",
          fallbackError
        );
        return {
          data: {
            niveaux: [],
          },
        };
      }
    }
  },

  // Méthodes utilitaires
  async getNiveauById(id: number): Promise<Niveau | null> {
    try {
      const response = await this.getById(id);
      return response.data?.niveau || null;
    } catch (error) {
      console.error(`Erreur lors de la récupération du niveau ${id}:`, error);
      return null;
    }
  },

  async getNiveauxByOrdre(): Promise<Niveau[]> {
    try {
      const response = await this.getAll();
      const niveaux = response.data?.niveaux || [];
      return niveaux.sort((a, b) => a.ordre - b.ordre);
    } catch (error) {
      console.error("Erreur lors du tri des niveaux par ordre:", error);
      return [];
    }
  },
};
