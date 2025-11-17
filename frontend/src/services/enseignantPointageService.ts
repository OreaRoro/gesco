import api from "./http/api";
import {
  pointageService,
  type PointagePersonnel,
  type PointageFilters,
  type PointageFormData,
} from "./pointageService";

// Interface spécifique pour les enseignants
export interface EnseignantPointage extends PointagePersonnel {
  specialite?: string;
  niveau_etude?: string;
}

class EnseignantPointageService {
  // Récupérer uniquement les pointages des enseignants
  async getAll(filters: PointageFilters = {}) {
    // Forcer le filtre sur les enseignants
    const filtersEnseignants = {
      ...filters,
      type_personnel: "enseignant",
    };

    return pointageService.getAll(filtersEnseignants);
  }

  // Récupérer la liste des enseignants pour les selects
  async getEnseignants() {
    try {
      const response = await api.get("/personnel?type_personnel=enseignant");
      return response.data.data.personnel || [];
    } catch (error) {
      console.error("Erreur chargement enseignants:", error);
      return [];
    }
  }

  async getById(id: number) {
    const response = await api.get(`/pointages/personnel/${id}`);
    return response.data;
  }

  // Pointage rapide pour enseignant
  async pointageRapide(enseignantId: number, type: "arrivee" | "depart") {
    return pointageService.pointageRapide(enseignantId, type);
  }

  // Créer un pointage pour enseignant
  async create(data: PointageFormData) {
    return pointageService.create(data);
  }

  // Modifier un pointage enseignant
  async update(id: number, data: Partial<PointageFormData>) {
    return pointageService.update(id, data);
  }

  // Supprimer un pointage enseignant
  async delete(id: number) {
    return pointageService.delete(id);
  }

  // Statistiques spécifiques aux enseignants
  async getStatsMensuelles(mois: string, enseignantId?: number) {
    return pointageService.getStatsMensuelles(mois, enseignantId);
  }

  // Récupérer les statuts (même méthode)
  async getStatuts() {
    return pointageService.getStatuts();
  }

  // Méthodes de calcul (mêmes méthodes)
  calculerHeuresTravail(heureArrivee: string, heureDepart: string): number {
    return pointageService.calculerHeuresTravail(heureArrivee, heureDepart);
  }

  formatHeures(heures: number): string {
    return pointageService.formatHeures(heures);
  }
}

export const enseignantPointageService = new EnseignantPointageService();
export { PointageFormData };
