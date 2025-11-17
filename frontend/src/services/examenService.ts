import api from "./http/api";
import {
  Examen,
  ExamensResponse,
  ExamenResponse,
  ExamenFormData,
} from "../interfaces/examen.interface";

// Interface pour les filtres de recherche des examens
interface ExamenFilters {
  page?: number;
  perPage?: number;
  search?: string;
  type?: string;
  annee_scolaire_id?: number;
  statut?: string;
}

export const examenService = {
  /**
   * Récupère la liste des examens avec pagination et filtres
   */
  async getAll(filters: ExamenFilters = {}): Promise<ExamensResponse> {
    const {
      page = 1,
      perPage = 10,
      search = "",
      type = "",
      annee_scolaire_id,
      statut = "",
    } = filters;

    const params: any = {
      page,
      perPage,
      search,
      type,
      statut,
    };

    // Ajouter les filtres optionnels seulement s'ils sont définis
    if (annee_scolaire_id) params.annee_scolaire_id = annee_scolaire_id;

    const response = await api.get("/examens", { params });

    return response.data;
  },

  /**
   * Récupère un examen par son ID
   */
  async getById(id: number): Promise<ExamenResponse> {
    const response = await api.get(`/examens/${id}`);
    return response.data;
  },

  /**
   * Crée un nouvel examen
   */
  async create(
    examenData: ExamenFormData
  ): Promise<{ data: { examen: Examen } }> {
    const response = await api.post("/examens", examenData);
    return response.data;
  },

  /**
   * Met à jour un examen existant
   */
  async update(
    id: number,
    examenData: ExamenFormData
  ): Promise<{ data: { examen: Examen } }> {
    const response = await api.put(`/examens/${id}`, examenData);
    return response.data;
  },

  /**
   * Supprime un examen
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/examens/${id}`);
  },

  /**
   * Change le statut d'un examen
   */
  async changerStatut(
    id: number,
    statut: "planifie" | "en_cours" | "termine" | "archive"
  ): Promise<{ message: string }> {
    const response = await api.patch(`/examens/${id}/changer-statut`, {
      statut,
    });
    return response.data;
  },

  /**
   * Récupère les statistiques d'un examen
   */
  async getStatistiques(examenId: number): Promise<any> {
    const response = await api.get(`/examens/${examenId}/statistiques`);
    return response.data;
  },

  /**
   * Récupère les notes d'un examen avec filtres
   */
  async getNotes(
    examenId: number,
    filters: {
      classe_id?: number;
      matiere_id?: number;
    } = {}
  ): Promise<any> {
    const response = await api.get(`/examens/${examenId}/notes`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Sauvegarde les notes pour un examen
   */
  async sauvegarderNotes(
    examenId: number,
    notes: any[]
  ): Promise<{ message: string }> {
    const response = await api.post(`/examens/${examenId}/notes`, { notes });
    return response.data;
  },

  /**
   * Récupère les classes disponibles pour un examen
   */
  async getClassesPourExamen(examenId: number): Promise<any> {
    try {
      const response = await api.get(`/examens/${examenId}/classes`);

      return response.data;
    } catch (error) {
      console.log(error);
    }
  },

  /**
   * Récupère les matières d'une classe
   */
  async getMatieresPourClasse(classeId: number): Promise<any> {
    const response = await api.get(`/classes/${classeId}/matieres`);
    return response.data;
  },

  /**
   * Exporte les résultats d'un examen en CSV
   */
  async exportResultatsCSV(
    examenId: number,
    filters: {
      classe_id?: number;
      matiere_id?: number;
    } = {}
  ): Promise<Blob> {
    const response = await api.get(`/examens/${examenId}/export/csv`, {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Génère les bulletins pour un examen
   */
  async genererBulletins(
    examenId: number,
    filters: {
      classe_id?: number;
    } = {}
  ): Promise<Blob> {
    const response = await api.get(`/examens/${examenId}/bulletins/pdf`, {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Récupère la liste des types d'examen disponibles
   */
  getTypesExamen(): { value: string; label: string }[] {
    return [
      { value: "trimestriel", label: "Trimestriel" },
      { value: "semestriel", label: "Semestriel" },
      { value: "annuel", label: "Annuel" },
      { value: "composition", label: "Composition" },
    ];
  },

  /**
   * Récupère la liste des statuts d'examen disponibles
   */
  getStatutsExamen(): { value: string; label: string }[] {
    return [
      { value: "planifie", label: "Planifié" },
      { value: "en_cours", label: "En cours" },
      { value: "termine", label: "Terminé" },
      { value: "archive", label: "Archivé" },
    ];
  },

  /**
   * Formate une date d'examen pour l'affichage
   */
  formatDateExamen(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  },

  /**
   * Calcule la durée d'un examen en jours
   */
  calculerDureeExamen(dateDebut: string, dateFin: string): number {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const diffTime = Math.abs(fin.getTime() - debut.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de début
  },
};

export default examenService;
