import { api } from "./http/api";
import {
  FraisScolarite,
  FraisScolariteCreateRequest,
  PaiementFrais,
  PaiementFraisCreateRequest,
  StatistiquesPaiements,
} from "../interfaces/frais.interface";

export const fraisService = {
  // Gestion des frais de scolarité
  async getFraisScolarite(
    params?: any
  ): Promise<{ data: { frais_scolarite: FraisScolarite[] } }> {
    try {
      const response = await api.get("/frais-scolarite", { params });
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des frais de scolarité:",
        error
      );
      throw error;
    }
  },

  async getFraisByNiveau(
    niveauId: number,
    anneeScolaireId?: number
  ): Promise<{ data: { frais: FraisScolarite } }> {
    try {
      const params: any = { niveau_id: niveauId };
      if (anneeScolaireId) {
        params.annee_scolaire_id = anneeScolaireId;
      }

      const response = await api.get("/frais-scolarite/niveau", { params });
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des frais pour le niveau ${niveauId}:`,
        error
      );
      throw error;
    }
  },

  async getFraisByClasse(
    classeId: number
  ): Promise<{ data: { frais: FraisScolarite } }> {
    try {
      const response = await api.get(`/frais-scolarite/classe/${classeId}`);
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des frais pour la classe ${classeId}:`,
        error
      );
      throw error;
    }
  },

  async createFraisScolarite(
    fraisData: FraisScolariteCreateRequest
  ): Promise<{ data: { frais_scolarite: FraisScolarite } }> {
    try {
      const response = await api.post("/frais-scolarite", fraisData);
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la création des frais de scolarité:",
        error
      );
      throw error;
    }
  },

  async updateFraisScolarite(
    id: number,
    fraisData: Partial<FraisScolariteCreateRequest>
  ): Promise<{ data: { frais_scolarite: FraisScolarite } }> {
    try {
      const response = await api.put(`/frais-scolarite/${id}`, fraisData);
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la modification des frais de scolarité ${id}:`,
        error
      );
      throw error;
    }
  },

  async deleteFraisScolarite(id: number): Promise<void> {
    try {
      await api.delete(`/frais-scolarite/${id}`);
    } catch (error) {
      console.error(
        `Erreur lors de la suppression des frais de scolarité ${id}:`,
        error
      );
      throw error;
    }
  },

  // Gestion des paiements
  async getPaiements(
    params?: any
  ): Promise<{ data: { paiements: PaiementFrais[]; total: number } }> {
    try {
      const response = await api.get("/paiements-frais", { params });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des paiements:", error);
      throw error;
    }
  },

  async getPaiementById(
    id: number
  ): Promise<{ data: { paiement: PaiementFrais } }> {
    try {
      const response = await api.get(`/paiements-frais/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du paiement ${id}:`, error);
      throw error;
    }
  },

  async createPaiement(
    paiementData: PaiementFraisCreateRequest
  ): Promise<{ data: { paiement: PaiementFrais } }> {
    try {
      const response = await api.post("/paiements-frais", paiementData);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la création du paiement:", error);
      throw error;
    }
  },

  async updatePaiement(
    id: number,
    paiementData: Partial<PaiementFraisCreateRequest>
  ): Promise<{ data: { paiement: PaiementFrais } }> {
    try {
      const response = await api.put(`/paiements-frais/${id}`, paiementData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la modification du paiement ${id}:`, error);
      throw error;
    }
  },

  async deletePaiement(id: number): Promise<void> {
    try {
      await api.delete(`/paiements-frais/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression du paiement ${id}:`, error);
      throw error;
    }
  },

  // Méthodes spécifiques
  async getPaiementsEleve(
    eleveId: number,
    anneeScolaireId?: number
  ): Promise<{ data: { paiements: PaiementFrais[] } }> {
    try {
      const params: any = { eleve_id: eleveId };
      if (anneeScolaireId) {
        params.annee_scolaire_id = anneeScolaireId;
      }

      const response = await api.get("/paiements-frais", { params });
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des paiements de l'élève ${eleveId}:`,
        error
      );
      throw error;
    }
  },

  async getPaiementsImpayes(
    params?: any
  ): Promise<{ data: { paiements: PaiementFrais[]; total: number } }> {
    try {
      const finalParams = { ...params, statut: "impaye" };
      const response = await api.get("/paiements-frais", {
        params: finalParams,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des paiements impayés:",
        error
      );
      throw error;
    }
  },

  async getPaiementsParMois(
    mois: string,
    anneeScolaireId?: number
  ): Promise<{ data: { paiements: PaiementFrais[]; total: number } }> {
    try {
      const params: any = { mois };
      if (anneeScolaireId) {
        params.annee_scolaire_id = anneeScolaireId;
      }

      const response = await api.get("/paiements-frais", { params });
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des paiements du mois ${mois}:`,
        error
      );
      throw error;
    }
  },

  async getStatistiquesPaiements(
    anneeScolaireId?: number
  ): Promise<{ data: { statistiques: StatistiquesPaiements } }> {
    try {
      const params: any = {};
      if (anneeScolaireId) {
        params.annee_scolaire_id = anneeScolaireId;
      }

      const response = await api.get("/paiements-frais/statistiques", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des statistiques des paiements:",
        error
      );
      throw error;
    }
  },

  async genererQuittance(
    paiementId: number
  ): Promise<{ data: { quittance_url: string } }> {
    try {
      const response = await api.get(
        `/paiements-frais/${paiementId}/quittance`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Erreur lors de la génération de la quittance ${paiementId}:`,
        error
      );
      throw error;
    }
  },

  // Méthodes utilitaires
  async calculerFraisInscription(classeId: number): Promise<number> {
    try {
      const response = await this.getFraisByClasse(classeId);
      return response.data.frais.frais_inscription || 0;
    } catch (error) {
      console.error(
        `Erreur lors du calcul des frais d'inscription pour la classe ${classeId}:`,
        error
      );
      return 0;
    }
  },

  async calculerFraisScolariteMensuels(classeId: number): Promise<number> {
    try {
      const response = await this.getFraisByClasse(classeId);
      return (response.data.frais.montant || 0) / 10; // Réparti sur 10 mois
    } catch (error) {
      console.error(
        `Erreur lors du calcul des frais de scolarité mensuels pour la classe ${classeId}:`,
        error
      );
      return 0;
    }
  },

  // Méthode pour obtenir les mois d'une année scolaire
  getMoisAnneeScolaire(): string[] {
    return [
      "septembre",
      "octobre",
      "novembre",
      "decembre",
      "janvier",
      "février",
      "mars",
      "avril",
      "mai",
      "juin",
    ];
  },

  // Formatage des montants
  formatMontant(montant: number): string {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MGA",
    }).format(montant);
  },

  // Vérification du statut de paiement
  getStatutPaiementColor(statut: string): string {
    const colors = {
      paye: "text-green-600 bg-green-100",
      impaye: "text-red-600 bg-red-100",
      partiel: "text-orange-600 bg-orange-100",
    };
    return colors[statut as keyof typeof colors] || "text-gray-600 bg-gray-100";
  },
};
