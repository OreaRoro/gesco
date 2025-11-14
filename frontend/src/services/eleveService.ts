import { api } from "./http/api";
import {
  Eleve,
  ElevesResponse,
  EleveResponse,
  EleveCreateRequest,
  EleveUpdateRequest,
} from "../interfaces/eleve.interface";

// Interface pour les filtres de recherche
interface EleveFilters {
  page?: number;
  perPage?: number;
  search?: string;
  statut?: string;
  annee_scolaire_id?: number;
  classe_id?: number;
  niveau_id?: number;
}

export const eleveService = {
  /**
   * Récupère la liste des élèves avec pagination et filtres
   */
  async getAll(filters: EleveFilters = {}): Promise<ElevesResponse> {
    const {
      page = 1,
      perPage = 10,
      search = "",
      statut = "",
      annee_scolaire_id,
      classe_id,
      niveau_id,
    } = filters;

    const params: any = {
      page,
      perPage,
      search,
      statut,
    };

    // Ajouter les filtres optionnels seulement s'ils sont définis
    if (annee_scolaire_id) params.annee_scolaire_id = annee_scolaire_id;
    if (classe_id) params.classe_id = classe_id;
    if (niveau_id) params.niveau_id = niveau_id;

    const response = await api.get("/eleves", { params });
    return response.data;
  },

  /**
   * Récupère un élève par son ID
   */
  async getById(id: number): Promise<EleveResponse> {
    const response = await api.get(`/eleves/${id}`);
    return response.data;
  },

  /**
   * Crée un nouvel élève
   */
  async create(
    eleveData: EleveCreateRequest
  ): Promise<{ data: { eleve: Eleve } }> {
    const response = await api.post("/eleves", eleveData);
    return response.data;
  },

  /**
   * Met à jour un élève existant
   */
  async update(
    id: number,
    eleveData: EleveUpdateRequest
  ): Promise<{ data: { eleve: Eleve } }> {
    const response = await api.put(`/eleves/${id}`, eleveData);
    return response.data;
  },

  /**
   * Met à jour un élève avec gestion de photo
   */
  async updateWithPhoto(
    id: number,
    eleveData: EleveUpdateRequest,
    photoFile?: File
  ): Promise<{ data: { eleve: Eleve } }> {
    try {
      if (photoFile) {
        // Uploader la photo d'abord
        const photoResponse = await this.uploadPhoto(id, photoFile);

        // Puis mettre à jour les données avec le nouveau chemin de photo
        const updatedData = {
          ...eleveData,
          photo: photoResponse.photo_url,
        };

        const response = await api.put(`/eleves/${id}`, updatedData);
        return response.data;
      } else {
        // Mise à jour simple sans photo
        const response = await api.put(`/eleves/${id}`, eleveData);
        return response.data;
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour avec photo:", error);
      throw error;
    }
  },

  /**
   * Supprime un élève
   */
  // async delete(id: number): Promise<void> {
  //   await api.delete(`/eleves/${id}`);
  // },

  /**
   * Récupère les statistiques des élèves
   */
  async getStatistiques(): Promise<any> {
    const response = await api.get("/eleves/statistiques");
    return response.data;
  },

  /**
   * Upload une photo pour un élève
   */
  async uploadPhoto(
    id: number,
    photoFile: File
  ): Promise<{ photo_url: string }> {
    const formData = new FormData();
    formData.append("photo", photoFile);

    const response = await api.post(`/eleves/${id}/photo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.data.data) {
      throw new Error("Réponse invalide du serveur lors de l'upload de photo");
    }

    return response.data.data;
  },

  /**
   * Récupère les inscriptions d'un élève
   */
  async getInscriptions(eleveId: number): Promise<{ inscriptions: any[] }> {
    const response = await api.get(`/eleves/${eleveId}/inscriptions`);

    if (!response.data.data) {
      throw new Error("Réponse invalide du serveur pour les inscriptions");
    }

    return response.data.data;
  },

  /**
   * Inscrit un élève dans une classe
   */
  async inscrire(
    eleveId: number,
    inscriptionData: {
      classe_id: number;
      annee_scolaire_id: number;
      date_inscription: string;
      montant_inscription: number;
      montant_paye?: number;
    }
  ): Promise<{ inscription_id: number }> {
    const response = await api.post(
      `/eleves/${eleveId}/inscrire`,
      inscriptionData
    );

    if (!response.data.data) {
      throw new Error("Réponse invalide du serveur pour l'inscription");
    }

    return response.data.data;
  },

  /**
   * Réinscrit un élève pour l'année courante
   */
  async reinscrire(
    eleveId: number,
    reinscriptionData: {
      annee_scolaire_id: number;
      date_inscription: string;
      classe_id?: number;
    }
  ): Promise<{ inscription_id: number }> {
    const response = await api.post(
      `/eleves/${eleveId}/reinscrire`,
      reinscriptionData
    );

    if (!response.data.data) {
      throw new Error("Réponse invalide du serveur pour la réinscription");
    }

    return response.data.data;
  },

  /**
   * Vérifie si un élève peut être réinscrit
   */
  async canReinscrire(
    eleveId: number
  ): Promise<{ data: { can_reinscrire: boolean; message?: string } }> {
    try {
      const response = await api.get(`/eleves/${eleveId}/can-reinscrire`);
      return response.data;
    } catch (error) {
      // Si l'endpoint n'existe pas, retourner une valeur par défaut
      console.warn(
        "Endpoint can-reinscrire non disponible, utilisation de la valeur par défaut"
      );
      return { data: { can_reinscrire: true } };
    }
  },

  /**
   * Suppression définitive d'un élève (admin seulement)
   */
  async hardDelete(eleveId: number, confirm: boolean = false): Promise<void> {
    try {
      if (!confirm) {
        throw new Error("Confirmation requise pour la suppression définitive");
      }

      await api.delete(`/eleves/${eleveId}/hard-delete`, {
        params: { confirm },
      });
    } catch (error) {
      console.log(error);
    }
  },

  /**
   * Exporte la liste des élèves en CSV
   */
  async exportCSV(filters: EleveFilters = {}): Promise<Blob> {
    const response = await api.get("/eleves/export/csv", {
      params: filters,
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Génère l'URL complète pour une photo d'élève
   */
  getPhotoUrl: (path: string | null | undefined): string => {
    if (!path) {
      // Retourner une image par défaut si pas de photo
      return "/images/avatar-default.png";
    }

    if (path.startsWith("http")) {
      return path;
    }

    // Supprimer les slashs en double
    const cleanPath = path.replace(/^\/+/, "");
    return `${
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
    }/${cleanPath}`;
  },

  /**
   * Récupère la liste des classes disponibles
   */
  async getClasses(annee_scolaire_id?: number): Promise<any> {
    const params: any = {};
    if (annee_scolaire_id) {
      params.annee_scolaire_id = annee_scolaire_id;
    }

    const response = await api.get("/classes/all", { params });
    return response.data;
  },

  /**
   * Récupère la liste des niveaux disponibles
   */
  async getNiveaux(): Promise<any> {
    const response = await api.get("/niveaux");
    return response.data;
  },

  /**
   * Récupère la liste des années scolaires disponibles
   */
  async getAnneesScolaires(): Promise<any> {
    const response = await api.get("/annees-scolaires");
    return response.data;
  },

  /**
   * Change le statut d'un élève
   */
  async changeStatut(
    eleveId: number,
    statut: "actif" | "inactif" | "transfere" | "diplome"
  ): Promise<{ data: { eleve: Eleve } }> {
    const response = await api.patch(`/eleves/${eleveId}/statut`, { statut });
    return response.data;
  },

  /**
   * Récupère les absences d'un élève
   */
  async getAbsences(
    eleveId: number,
    filters: {
      date_debut?: string;
      date_fin?: string;
      annee_scolaire_id?: number;
    } = {}
  ): Promise<any> {
    const response = await api.get(`/eleves/${eleveId}/absences`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Récupère les notes d'un élève
   */
  async getNotes(
    eleveId: number,
    filters: {
      annee_scolaire_id?: number;
      periode_id?: number;
      matiere_id?: number;
    } = {}
  ): Promise<any> {
    const response = await api.get(`/eleves/${eleveId}/notes`, {
      params: filters,
    });
    return response.data;
  },

  // Dans eleveService.js
  async delete(id: number): Promise<void> {
    // Maintenant c'est un soft delete
    await api.patch(`/eleves/${id}/desactiver`);
  },

  async restore(id: number): Promise<void> {
    await api.patch(`/eleves/${id}/restaurer`);
  },

  async getInactifs(filters: any = {}): Promise<any> {
    const response = await api.get("/eleves/inactifs", { params: filters });
    return response.data;
  },

  /**
   * Désactive un élève (soft delete)
   */
  async desactiver(id: number): Promise<{ message: string }> {
    const response = await api.patch(`/eleves/${id}/desactiver`);
    return response.data;
  },

  /**
   * Restaure un élève précédemment désactivé
   */
  async restaurer(id: number): Promise<{ message: string }> {
    const response = await api.patch(`/eleves/${id}/restaurer`);
    return response.data;
  },
};

export default eleveService;
